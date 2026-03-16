<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Http\Services\PurchaseOrder\PurchaseOrderService;
use App\Models\InventoryAdjustment;
use App\Models\InventoryOperationType;
use App\Models\Products;
use App\Models\PurchaseOrder;
use App\Models\Receipt;
use App\Models\Supplier;
use App\Models\User;
use App\Models\BusinessConfig; // Importar el modelo BusinessConfig
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PurchaseOrdersController extends Controller
{
    protected $service;

    public function __construct(PurchaseOrderService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 20);

        $orders = PurchaseOrder::query()
            ->with(['supplier:id_supplier,company_name,ruc', 'creator:id,name'])
            ->when($search, function ($query, $search) {
                $query->where('po_code', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($sq) use ($search) {
                        $sq->where('company_name', 'like', "%{$search}%")
                            ->orWhere('ruc', 'like', "%{$search}%");
                    });
            })
            ->orderBy('created_at', 'desc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render("Purchases/ListOrders", [
            'orders' => $orders,
            'filters' => ['search' => $search, 'per_page' => $perPage]
        ]);
    }

    public function create()
    {
        return Inertia::render('Purchases/CreatePurchaseOrder', [
            'suppliers' => Supplier::select('id_supplier', 'company_name', 'ruc')->orderBy('company_name')->get(),
            'products' => Products::where('status', 'active')
                ->select('id_product', 'product_name', 'product_code', 'sale_price')
                ->orderBy('product_name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_supplier'   => 'required|exists:suppliers,id_supplier',
            'order_type'    => 'required|in:purchase,service',
            'issue_date'    => 'required|date',
            'expected_date' => 'nullable|date',
            'notes'         => 'nullable|string',
            'total_amount'  => 'required|numeric|min:0',
            'status'        => 'required|in:draft,sent',
            'currency'      => 'required|in:PEN,USD',
            'exchange_rate' => 'required|numeric|min:0.0001',
            'file'          => 'nullable|file|mimes:pdf,jpg,png,jpeg|max:5120',
            'details'       => 'required|array|min:1',
            'details.*.is_service' => 'boolean',
            'details.*.id_product' => 'nullable|required_if:details.*.is_service,false|exists:products,id_product',
            'details.*.description' => 'nullable|required_if:details.*.is_service,true|string|max:255',
            'details.*.quantity'   => 'required|numeric|min:0.01',
            'details.*.unit_cost'  => 'required|numeric|min:0',
            'details.*.subtotal'   => 'required|numeric|min:0',
            'details.*.margin_percentage' => 'nullable|numeric',
            'details.*.suggested_sale_price' => 'nullable|numeric',
        ]);

        try {
            $order = $this->service->createOrder($validated);
            return redirect()->route('purchase-orders.show', ['purchaseOrder' => $order->id_purchase_order])->with('success', 'Orden creada correctamente.');
        } catch (\Exception $e) {
            Log::error('Error creating PO: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al guardar: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $order = PurchaseOrder::with([
            'supplier:id_supplier,company_name,ruc',
            'details.product:id_product,product_name,product_code,sale_price',
            'logs.user:id,name',
            'creator:id,name',
            'requester:id,name',
            'approver:id,name'
        ])
            ->withCount(['receipts', 'inventoryAdjustments']) // Usar withCount para ambas relaciones
            ->findOrFail($id);

        return Inertia::render('Purchases/EditPurchaseOrder', [
            'order' => $order,
            'suppliers' => Supplier::select('id_supplier', 'company_name', 'ruc')->orderBy('company_name')->get(),
            'products' => Products::where('status', 'active')
                ->select('id_product', 'product_name', 'product_code', 'sale_price')
                ->orderBy('product_name')->get(),
            'documentTypes' => [
                ['value' => 'Factura', 'label' => 'Factura'],
                ['value' => 'Boleta', 'label' => 'Boleta'],
                ['value' => 'Guía Remisión', 'label' => 'Guía Remisión'],
            ]
        ]);
    }
    public function update(Request $request, $id)
    {
        // LOG 1: Ver qué llega exactamente del navegador
        Log::info("Intentando actualizar OC ID: {$id}", [
            'all_input' => $request->all(),
            'content_type' => $request->header('Content-Type'),
        ]);

        try {
            $validated = $request->validate([
                'id_supplier'   => 'required|exists:suppliers,id_supplier',
                'order_type'    => 'required|in:purchase,service',
                'issue_date'    => 'required|date',
                'expected_date' => 'nullable|date',
                'actual_arrival_date' => 'nullable|date',
                'notes'         => 'nullable|string',
                'internal_note' => 'nullable|string',
                'status'        => 'required|in:draft,sent,received,cancelled',
                'total_amount'  => 'required|numeric|min:0',
                'currency'      => 'required|in:PEN,USD',
                'exchange_rate' => 'required|numeric|min:0.0001',
                'file'          => 'nullable|file|mimes:pdf,jpg,png,jpeg|max:5120',
                'details'       => 'required|array|min:1',
                'details.*.id_product' => 'nullable|exists:products,id_product',
                'details.*.description' => 'nullable|string',
                'details.*.quantity'   => 'required|numeric|min:0.01',
                'details.*.unit_cost'  => 'required|numeric|min:0',
                'details.*.subtotal'   => 'required|numeric|min:0',
                // Agregamos estos por si el Service los usa al actualizar
                'details.*.margin_percentage' => 'nullable|numeric',
                'details.*.suggested_sale_price' => 'nullable|numeric',
            ]);

            // LOG 2: Si llega aquí, la validación pasó
            Log::info("Validación exitosa para OC ID: {$id}", ['validated_data' => $validated]);

            $this->service->updateOrder($validated, $id);

            return back()->with('success', 'Orden actualizada.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            // LOG 3: Ver exactamente qué campo falló
            Log::error("Error de validación en OC ID: {$id}", [
                'errors' => $e->errors(),
                'old_input' => $request->all()
            ]);
            throw $e; // Re-lanzar para que Inertia maneje los errores

        } catch (\Exception $e) {
            // LOG 4: Errores del Service o Base de datos
            Log::error('Error crítico actualizando OC: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return back()->withErrors(['error' => 'Error interno: ' . $e->getMessage()]);
        }
    }

    public function addNote(Request $request, $id)
    {
        $request->validate(['internal_note' => 'required|string']);
        $this->service->registerNote($id, $request->internal_note);
        return back()->with('success', 'Nota agregada.');
    }

    public function approve(Request $request, $id)
    {
        try {
            $this->service->approveOrder($id);
            return back()->with('success', 'Orden aprobada correctamente.');
        } catch (\Exception $e) {
            Log::error('Error approving PO: ' . $e->getMessage());
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function receive($id)
    {
        $order = PurchaseOrder::with('supplier', 'details.product')->findOrFail($id);

        // 1. Buscar si ya existe una recepción pendiente (draft o ready) para esta OC
        $existingAdjustment = InventoryAdjustment::where('document_number', $order->po_code)
            ->whereIn('status', ['draft', 'ready'])
            ->first();

        // 2. Si ya existe un borrador, vamos a ese directamente
        if ($existingAdjustment) {
            return redirect()->route('inventory.adjustment.edit', $existingAdjustment->id_adjustment);
        }

        return DB::transaction(function () use ($order) {
            $adjustment = InventoryAdjustment::create([
                'reference_code' => 'IN/' . $order->po_code . '/' . now()->format('is'),
                'operation_type' => 'RECEPCIÓN',
                'contact_name'   => $order->supplier->company_name,
                'kardex_date'    => now()->format('Y-m-d'),
                'id_user'        => Auth::id(),
                'status'         => 'draft',
                'reason'         => 'Recepción de mercadería de ' . $order->po_code,
                'document_number' => $order->po_code,
                'location'       => 'Almacén Principal',
                'exchange_rate'  => $order->exchange_rate,
            ]);

            foreach ($order->details as $detail) {
                if (!$detail->id_product) continue;

                $pendingQty = $detail->quantity - $detail->received_quantity;
                if ($pendingQty > 0) {
                    $adjustment->movements()->create([
                        'id_product'     => $detail->id_product,
                        'type'           => 'IN',
                        'id_user'        => Auth::id(),
                        'quantity'       => $pendingQty,
                        'unit_cost'      => $detail->unit_cost,
                        'reference_id'   => $adjustment->id_adjustment,
                        'reference_type' => InventoryAdjustment::class,
                    ]);
                }
            }

            return redirect()->route('inventory.adjustment.edit', $adjustment->id_adjustment);
        });
    }

    public function prepareReception($id)
    {
        // 1. Cargamos la OC con sus detalles
        $order = PurchaseOrder::with(['details.product', 'supplier'])->findOrFail($id);

        // 2. Buscamos el tipo de operación de entrada (IN)
        $operationType = \App\Models\InventoryOperationType::where('code', 'IN')->first();

        if (!$operationType) {
            return back()->withErrors(['error' => 'No se encontró un Tipo de Operación con código IN configurado en el sistema.']);
        }

        return DB::transaction(function () use ($order, $operationType) {

            // 3. Creamos la recepción vinculándola polimórficamente a la OC
            $reception = InventoryAdjustment::create([
                'reference_code'          => $operationType->sequence_prefix . $order->po_code . '/' . now()->format('is'),
                'id_operation_type'       => $operationType->id_operation_type,
                'id_location_source'      => $operationType->default_location_source_id,
                'id_location_destination' => $operationType->default_location_destination_id,
                'contact_name'            => $order->supplier->company_name,
                'kardex_date'             => now()->format('Y-m-d'),
                'id_user'                 => Auth::id(),
                'status'                  => 'draft',
                'reason'                  => 'Recepción de mercadería de ' . $order->po_code,
                'document_type'           => 'Orden de Compra',
                'document_number'         => $order->po_code,
                'exchange_rate'           => $order->exchange_rate,

                // ✅ ESTOS CAMPOS SON LOS QUE FALTABAN:
                'source_document_id'      => $order->id_purchase_order,
                'source_document_type'    => get_class($order),
            ]);

            // LOG: Registrar la creación
            \App\Models\InventoryLog::create([
                'id_adjustment' => $reception->id_adjustment,
                'id_user'       => Auth::id(),
                'action'        => 'Documento Creado',
                'field_changed' => 'Estado',
                'new_value'     => 'Borrador',
                'notes'         => 'Borrador de recepción vinculado a OC: ' . $order->po_code,
            ]);

            // 4. Mapeamos los productos pendientes (solo lo que falta recibir)
            foreach ($order->details as $detail) {
                // Saltamos servicios o productos sin ID
                if (!$detail->id_product || $detail->is_service) continue;

                $pendingQty = (float)$detail->quantity - (float)$detail->received_quantity;

                if ($pendingQty > 0) {
                    $reception->details()->create([
                        'id_product' => $detail->id_product,
                        'demand'     => $pendingQty,
                        'quantity'   => 0, // Se deja en 0 para que el almacenero digite lo que llegó
                        'unit_cost'  => $detail->unit_cost,
                    ]);
                }
            }

            return redirect()->route('inventory.adjustment.edit', $reception->id_adjustment)
                ->with('success', 'Recepción preparada. Ingrese las cantidades recibidas.');
        });
    }

    public function print(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load([
            'supplier',
            'details.product',
            'creator',
            'requester',
            'approver'
        ]);

        $businessConfig = BusinessConfig::first(); // Asume que solo hay una configuración global

        return view('purchases.print', compact('purchaseOrder', 'businessConfig'));
    }
}
