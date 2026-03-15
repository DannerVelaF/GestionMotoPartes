<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Http\Services\PurchaseOrder\PurchaseOrderService; // Corregido el namespace según tu estructura
use App\Models\InventoryAdjustment;
use App\Models\InventoryOperationType;
use App\Models\Products;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
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
        ])->findOrFail($id);

        $receptionsCount = InventoryAdjustment::where('reference_code', 'like', "%{$order->po_code}%")
            ->count();

        return Inertia::render('Purchases/EditPurchaseOrder', [
            'order' => $order,
            'receptionsCount' => $receptionsCount, // <-- Pasamos el conteo
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
        $validated = $request->validate([
            'id_supplier'   => 'required|exists:suppliers,id_supplier',
            'order_type'    => 'required|in:purchase,service',
            'issue_date'    => 'required|date',
            'expected_date' => 'nullable|date',
            'actual_arrival_date' => 'nullable|date', // Nuevo
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
        ]);

        try {
            $this->service->updateOrder($validated, $id);
            return back()->with('success', 'Orden actualizada.');
        } catch (\Exception $e) {
            Log::error('Error updating PO: ' . $e->getMessage());
            return back()->withErrors(['error' => $e->getMessage()]);
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
        $existingAdjustment = InventoryAdjustment::where('reference_code', 'like', "%{$order->po_code}%")
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
        $order = PurchaseOrder::with(['details.product', 'supplier'])->findOrFail($id);
        $operationType = \App\Models\InventoryOperationType::where('code', 'IN')->first();

        if (!$operationType) {
            return back()->withErrors(['error' => 'No se encontró un Tipo de Operación con código IN configurado en el sistema.']);
        }

        return DB::transaction(function () use ($order, $operationType) {

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
            ]);

            // LOG: Registrar la creación del borrador
            \App\Models\InventoryLog::create([
                'id_adjustment' => $reception->id_adjustment,
                'id_user'       => Auth::id(),
                'action'        => 'Documento Creado',
                'field_changed' => 'Estado',
                'new_value'     => 'Borrador',
                'notes'         => 'Borrador creado a partir de la Orden de Compra: ' . $order->po_code,
            ]);

            // Guardamos en la NUEVA TABLA de detalles (demand = pendiente, quantity = 0)
            foreach ($order->details as $detail) {
                if (!$detail->id_product || $detail->is_service) continue;

                $pendingQty = $detail->quantity - $detail->received_quantity;

                if ($pendingQty > 0) {
                    $reception->details()->create([
                        'id_product' => $detail->id_product,
                        'demand'     => $pendingQty,
                        'quantity'   => 0, // Inicia en 0 para que el usuario lo llene
                        'unit_cost'  => $detail->unit_cost,
                    ]);
                }
            }

            return redirect()->route('inventory.adjustment.edit', $reception->id_adjustment)
                ->with('success', 'Documento generado con los productos de la Orden de Compra.');
        });
    }
}
