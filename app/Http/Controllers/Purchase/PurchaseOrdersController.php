<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Http\Services\PurchaseOrder\PurchaseOrderService; // Corregido el namespace según tu estructura
use App\Models\Products;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\Request;
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
}
