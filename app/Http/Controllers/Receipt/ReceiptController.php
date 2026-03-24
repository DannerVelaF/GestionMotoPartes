<?php

namespace App\Http\Controllers\Receipt;

use App\Enums\DocumentType;
use App\Exports\TaxReportExport;
use App\Http\Controllers\Controller;
use App\Http\Services\Receipt\ReceiptService;
use App\Models\Products; // Asegúrate de importar tu modelo de productos
use App\Models\PurchaseOrder;
use App\Models\Receipt;
use App\Models\ReceiptDetail;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\ReceiptLog;

class ReceiptController extends Controller
{
    protected $service;

    public function __construct(ReceiptService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 20);
        $groupBy = $request->input('group_by') ?? 'none';

        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 20;
        }

        $query = Receipt::query()
            ->with([
                'supplier:id_supplier,company_name,ruc',
                'purchaseOrder:id_purchase_order,po_code'
            ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('receipt_code', 'like', "%{$search}%")
                        ->orWhere('series', 'like', "%{$search}%")
                        ->orWhere('number', 'like', "%{$search}%")
                        ->orWhereHas('supplier', function ($sq) use ($search) {
                            $sq->where('company_name', 'like', "%{$search}%")
                                ->orWhere('ruc', 'like', "%{$search}%");
                        })
                        // ✅ Permitir buscar por el código de la Orden de Compra
                        ->orWhereHas('purchaseOrder', function ($pq) use ($search) {
                            $pq->where('po_code', 'like', "%{$search}%");
                        });
                });
            });

        if ($groupBy === 'document_type') {
            $query->orderBy('document_type', 'asc');
        } elseif ($groupBy === 'month') {
            $query->orderBy('issue_date', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $receipts = $query->paginate((int)$perPage)->withQueryString();

        return Inertia::render("Receipts/ListReceipts", [
            'receipts' => $receipts,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'group_by' => $groupBy,
            ]
        ]);
    }

    public function create(Request $request) {
        $allowedTypes = [DocumentType::INVOICE, DocumentType::RECEIPT];

        // --- LÓGICA DE PRE-CARGA DESDE OC ---
        $sourceOrder = null;
        if ($request->has('source_po')) {
            $sourceOrder = PurchaseOrder::with(['details.product', 'supplier'])
                ->findOrFail($request->source_po);
        }

        return Inertia::render('Receipts/CreateReceipt', [
            'suppliers' => Supplier::select('id_supplier', 'company_name', 'ruc')->orderBy('company_name')->get(),
            'products' => Products::where('status', 'active')
                ->select('id_product', 'product_name', 'product_code', 'sale_price')
                ->orderBy('product_name')->get(),
            'documentTypes' => collect($allowedTypes)->map(fn($t) => [
                'value' => $t->value,
                'label' => $t->label()
            ]),
            'preloadedData' => [
                'order'  => $sourceOrder,
                'type'   => $request->type,
                'series' => $request->series,
                'number' => $request->number,
                'currency' => $sourceOrder ? $sourceOrder->currency : 'PEN',
                'exchange_rate' => $sourceOrder ? $sourceOrder->exchange_rate : '1.000',
            ],
            'purchaseOrders' => PurchaseOrder::with(['details.product'])->whereHas('details', function($q) {
                $q->whereColumn('billed_quantity', '<', 'quantity');
            })->get(),
        ]);
    }

    public function show($id) {
        $allowedTypes = [DocumentType::INVOICE, DocumentType::RECEIPT, DocumentType::CREDIT_NOTE, DocumentType::NOTE];

        $receipt = Receipt::with([
            'details.product',
            'supplier',
            'logs.user',
            'purchaseOrder',
            'children' => function ($query) {
                $query->with('supplier', 'details')->orderBy('issue_date', 'desc');
            }
        ])->findOrFail($id);

        $returnsCount = $receipt->children->count();

        $parentReference = null;
        if ($receipt->id_parent) {
            $parent = Receipt::find($receipt->id_parent);
            if ($parent) {
                $parentReference = [
                    'id' => $parent->id_receipt,
                    'code' => $parent->receipt_code,
                    'url' => "/recibos/{$parent->id_receipt}"
                ];
            }
        }

        $masterDocument = null;

        if ($receipt->id_purchase_order && $receipt->purchaseOrder) {
            $masterDocument = [
                'type' => 'Orden Compra',
                'code' => $receipt->purchaseOrder->po_code,
                'url'  => "/compras/ordenes/{$receipt->id_purchase_order}"
            ];
        } elseif ($receipt->id_sales && $receipt->sale) {
            $masterDocument = [
                'type' => 'Venta',
                'code' => $receipt->sale->code_sales,
                'url'  => "/ventas/{$receipt->id_sales}"
            ];
        }
        return Inertia::render('Receipts/EditReceipt', [
            'receipt' => $receipt,
            'returnsCount' => $returnsCount,
            'parentReference' => $parentReference,
            'masterDocument' => $masterDocument,
            'suppliers' => Supplier::select('id_supplier', 'company_name', 'ruc')->orderBy('company_name')->get(),
            'products' => Products::where('status', 'active')->select('id_product', 'product_name', 'product_code', "stock")->get(),
            'documentTypes' => collect($allowedTypes)->map(fn($t) => [
                'value' => $t->value,
                'label' => $t->label()
            ]),
        ]);
    }
    public function addNote(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'internal_note' => 'required|string|max:1000',
            ]);

            $receipt = Receipt::findOrFail($id);

            $receipt->logs()->create([
                'id_user' => Auth::id(),
                'action' => 'Nota',
                'notes' => $validated['internal_note'],
            ]);

            // Importante cargar el usuario para que el Chatter lo muestre al refrescar
            $receipt->load('logs.user');

            return back()->with('success', 'Nota registrada correctamente.');

        } catch (\Exception $e) {
            Log::error("Error al agregar nota: " . $e->getMessage());
            return back()->withErrors(['error' => 'No se pudo guardar la nota.']);
        }
    }

    public function update(Request $request, $id)
    {
        // Decodificar 'details' si es un string JSON (enviado desde FormData)
        if ($request->has('details') && is_string($request->details)) {
            $request->merge(['details' => json_decode($request->details, true)]);
        }

        $validated = $request->validate([
            'id_supplier'   => 'required|exists:suppliers,id_supplier',
            'document_type' => ['required'],
            'currency'      => 'required|in:PEN,USD',
            'exchange_rate' => 'required|numeric|min:0.0001',
            'series'        => 'required|string|max:10',
            'number'        => 'required|string|max:20',
            'issue_date'    => 'required|date',
            'file'          => 'nullable|file|mimes:pdf,jpg,png,jpeg|max:5120',
            'glosa'         => 'nullable|string',
            'details'           => 'sometimes|array|min:1',
            'details.*.is_service' => 'boolean',
            'details.*.id_product' => 'nullable|required_if:details.*.is_service,false|exists:products,id_product',
            'details.*.description' => 'nullable|required_if:details.*.is_service,true|string|max:255',
            'details.*.quantity'   => 'required|numeric|min:0.01',
            'details.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            $this->service->updateReceipt($validated, $id);

            return to_route('receipts.show', $id)->with('success', 'Comprobante actualizado correctamente.');
        } catch (\Exception $e) {
            Log::error("Error al actualizar recibo: " . $e->getMessage());
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
    public function store(Request $request)
    {
        $messages = [
            'id_supplier.required' => 'El proveedor es obligatorio.',
            'document_type.required' => 'El tipo de documento es obligatorio.',
            'series.required' => 'La serie del comprobante es obligatoria.',
            'number.required' => 'El número del comprobante es obligatorio.',
            'issue_date.required' => 'La fecha de emisión es obligatoria.',
            'details.required' => 'Debes agregar al menos un ítem.',
            'details.*.id_product.required_if' => 'Seleccione un producto o escriba una descripción.',
            'details.*.description.required_if' => 'La descripción es obligatoria para servicios.',
            'details.*.quantity.required' => 'La cantidad es obligatoria.',
            'details.*.quantity.min' => 'La cantidad debe ser mayor a 0.',
            'details.*.unit_price.required' => 'El costo unitario es obligatorio.',
            'details.*.unit_price.min' => 'El costo unitario debe ser mayor o igual a 0.',

        ];

        $validated = $request->validate([
            'id_supplier'       => 'required|exists:suppliers,id_supplier',
            'id_purchase_order' => 'nullable|exists:purchase_orders,id_purchase_order', // ✅ AGREGADO
            'document_type'     => ['required', Rule::enum(DocumentType::class)],

            'currency'          => 'required|in:PEN,USD',
            'exchange_rate'     => 'required|numeric|min:0.0001',

            'series'            => 'required|string|max:10',
            'number'            => 'required|string|max:20',
            'issue_date'        => 'required|date',
            'file'              => 'nullable|file|mimes:pdf,jpg,png,jpeg|max:5120',

            'details'           => 'required|array|min:1',
            'details.*.is_service' => 'boolean',
            'details.*.id_product' => 'nullable|required_if:details.*.is_service,false|exists:products,id_product',
            'details.*.description' => 'nullable|required_if:details.*.is_service,true|string|max:255',
            'details.*.quantity'   => 'required|numeric|min:0.01',
            'details.*.unit_price' => 'required|numeric|min:0',
            'details.*.sale_price' => 'nullable|numeric|min:0',
        ], $messages);

        if (empty($validated['details'])) {
            return back()->withErrors(['error' => 'Debes agregar al menos un ítem.']);
        }

        try {
            // Validación de Márgenes (Solo si es Producto)
            // NOTA: Si es USD, convertimos a Soles para comparar con el precio de venta (que suele estar en Soles)
            $exchangeRate = (float) $validated['exchange_rate'];
            $isUSD = $validated['currency'] === 'USD';

            $productIds = collect($validated['details'])
                ->where('is_service', false)
                ->pluck('id_product');

            if ($productIds->isNotEmpty()) {
                $productNames = Products::whereIn('id_product', $productIds)
                    ->pluck('product_name', 'id_product');

                foreach ($validated['details'] as $detail) {
                    if (!empty($detail['is_service'])) continue;

                    $cost = (float)$detail['unit_price'];
                    // Convertir costo a soles si la compra es en dólares
                    $costInSoles = $isUSD ? $cost * $exchangeRate : $cost;

                    $salePrice = (float)($detail['sale_price'] ?? 0);
                    $productId = $detail['id_product'];
                    $productName = $productNames[$productId] ?? "ID {$productId}";

                    if ($salePrice > 0 && $costInSoles > $salePrice) {
                        return back()->withErrors([
                            'error' => "El costo unitario (S/ " . round($costInSoles, 2) . ") del producto '{$productName}' es mayor que su precio de venta sugerido (S/ {$salePrice}). Revise los montos o el tipo de cambio."
                        ]);
                    }
                }
            }

            $receipt = $this->service->createReceipt($validated);

            ReceiptLog::create([
                'id_receipt' => $receipt->id_receipt,
                'id_user'    => Auth::id(),
                'action'     => 'Creación',
                'notes'      => 'Comprobante creado.'
            ]);

            return to_route('receipts.show', $receipt->id_receipt)
                ->with('success', 'Comprobante registrado correctamente.');
        } catch (\Exception $e) {
            Log::error('Error creating receipt: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al guardar: ' . $e->getMessage()]);
        }
    }


    public function destroy($id)
    {
        try {
            // 1. Verificación manual (Ya la tenías, pero asegúrate que use id_parent)
            $hasChildren = Receipt::where('id_parent', $id)->exists();

            if ($hasChildren) {
                return back()->withErrors([
                    'error' => 'No puedes borrar esta factura porque tiene notas de crédito (devoluciones) vinculadas. Primero debes eliminar las notas de crédito.'
                ]);
            }

            // 2. Intentar eliminar a través del servicio
            $this->service->deleteReceipt($id);

            return to_route('receipts.index')->with('success', 'Comprobante eliminado correctamente.');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == "23000") {
                return back()->withErrors([
                    'error' => 'Error de integridad: Este documento está siendo usado por otros registros (detalles o referencias) y no puede ser eliminado.'
                ]);
            }

            return back()->withErrors(['error' => 'Error inesperado al intentar eliminar.']);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'No se pudo eliminar el comprobante: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $messages = [
            'ids.required' => 'Debes seleccionar al menos un producto.',
            'ids.array'    => 'Formato de datos inválido.',
            'ids.*.exists' => 'Uno de los recibos seleccionados no existe.'
        ];

        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:receipts,id_receipt'
        ], $messages);

        // Nota: Si quieres borrar imágenes en bulk, deberías hacerlo iterando en el servicio
        $this->service->deleteReceipts($data['ids']);

        return back()->with('success', 'Recibos seleccionados eliminados correctamente.');
    }

    public function returnReceipt(Request $request, $id)
    {
        $validated = $request->validate([
            'return_items' => 'required|array',
            'return_items.*.id_product' => 'nullable',
            'return_items.*.description' => 'nullable|string',
            'return_items.*.return_quantity' => 'required|numeric|min:0',
            'return_items.*.unit_price' => 'required|numeric',
        ]);

        try {
            $itemsToReturn = collect($validated['return_items'])
                ->filter(fn($item) => $item['return_quantity'] > 0)
                ->toArray();

            if (empty($itemsToReturn)) {
                return back()->withErrors(['error' => 'No hay items seleccionados para devolver.']);
            }

            $creditNote = $this->service->createReturn($itemsToReturn, $id);

            return to_route('receipts.show', $creditNote->id_receipt)
                ->with('success', 'Nota de Crédito generada correctamente.');

        } catch (\Exception $e) {
            Log::error('Error processing return: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al procesar devolución: ' . $e->getMessage()]);
        }
    }

    public function taxReport(Request $request)
    {
        // CORRECCIÓN DE FECHAS
        $from = Carbon::parse($request->input('from', Carbon::now()->startOfMonth()))->startOfDay();
        $to = Carbon::parse($request->input('to', Carbon::now()))->endOfDay();
        $idProduct = $request->input('id_product');

        $query = Receipt::query();

        if ($idProduct) {
            $query->join('receipt_details', 'receipts.id_receipt', '=', 'receipt_details.id_receipt')
                ->where('receipt_details.id_product', $idProduct);

            $sumExpression = 'SUM(
                CASE
                    WHEN receipts.currency = "USD" THEN receipt_details.subtotal * receipts.exchange_rate
                    ELSE receipt_details.subtotal
                END
            )';
        } else {
            $sumExpression = 'SUM(
                CASE
                    WHEN receipts.currency = "USD" THEN receipts.total_amount * receipts.exchange_rate
                    ELSE receipts.total_amount
                END
            )';
        }

        $reportData = $query->select(
            'receipts.document_type',
            DB::raw("$sumExpression as total_sum_pen")
        )
            ->whereBetween('receipts.issue_date', [$from, $to])
            ->groupBy('receipts.document_type')
            ->get()
            ->map(function ($item) {
                $total = (float) $item->total_sum_pen;
                $base = $total / 1.18;
                $igv = $total - $base;

                return [
                    'document_type' => $item->document_type,
                    'base_imponible' => round($base, 2),
                    'igv' => round($igv, 2),
                    'total' => round($total, 2),
                ];
            });

        return Inertia::render('Receipts/Reports/TaxReport', [
            'reportData' => $reportData,
            'productsList' => Products::select('id_product as value', 'product_name as label')->orderBy('product_name')->get(),
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'id_product' => $idProduct
            ]
        ]);
    }

    public function expenseDistributionReport(Request $request)
    {
        // CORRECCIÓN AQUÍ: Usamos startOfDay y endOfDay
        $from = Carbon::parse($request->input('from', Carbon::now()->startOfMonth()))->startOfDay();
        $to = Carbon::parse($request->input('to', Carbon::now()))->endOfDay();

        // 1. Resumen Agrupado
        $summary = DB::table('receipt_details')
            ->join('receipts', 'receipt_details.id_receipt', '=', 'receipts.id_receipt')
            ->whereBetween('receipts.issue_date', [$from, $to])
            ->select(
                DB::raw('
                    CASE
                        WHEN receipt_details.id_product IS NOT NULL THEN "Productos"
                        ELSE "Servicios"
                    END as expense_type
                '),
                DB::raw('COUNT(receipt_details.id_receipt_detail) as count'),
                DB::raw('SUM(
                    CASE
                        WHEN receipts.currency = "USD" THEN receipt_details.subtotal * receipts.exchange_rate
                        ELSE receipt_details.subtotal
                    END
                ) as total_amount')
            )
            ->groupBy('expense_type')
            ->get();

        $grandTotal = $summary->sum('total_amount');

        $reportData = $summary->map(function ($item) use ($grandTotal) {
            return [
                'name' => $item->expense_type,
                'value' => round((float)$item->total_amount, 2),
                'count' => $item->count,
                'percentage' => $grandTotal > 0 ? round(($item->total_amount / $grandTotal) * 100, 1) : 0
            ];
        });

        // 2. Detalle Específico
        $details = DB::table('receipt_details')
            ->join('receipts', 'receipt_details.id_receipt', '=', 'receipts.id_receipt')
            ->leftJoin('products', 'receipt_details.id_product', '=', 'products.id_product')
            ->whereBetween('receipts.issue_date', [$from, $to])
            ->select(
                DB::raw('
                    CASE
                        WHEN receipt_details.id_product IS NOT NULL THEN "Productos"
                        ELSE "Servicios"
                    END as category
                '),
                DB::raw('COALESCE(products.product_name, receipt_details.description) as item_name'),
                DB::raw('SUM(
                    CASE
                        WHEN receipts.currency = "USD" THEN receipt_details.subtotal * receipts.exchange_rate
                        ELSE receipt_details.subtotal
                    END
                ) as total_amount')
            )
            ->groupBy('category', 'item_name')
            ->orderByDesc('total_amount')
            ->limit(50)
            ->get();

        return Inertia::render('Receipts/Reports/ExpenseDistributionReport', [
            'reportData' => $reportData,
            'detailedData' => $details,
            // Enviamos las fechas formateadas Y-m-d al frontend para que el input type="date" las lea bien
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString()
            ]
        ]);
    }
    public function publish($id)
    {
        try {
            $this->service->publishReceipt($id);
            return back()->with('success', 'Comprobante publicado. La Orden de Compra ha sido actualizada.');
        } catch (\Exception $e) {
            Log::error("Error al publicar recibo: " . $e->getMessage());
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
    public function marginReport(Request $request)
    {
        // CORRECCIÓN DE FECHAS
        $from = Carbon::parse($request->input('from', Carbon::now()->startOfMonth()))->startOfDay();
        $to = Carbon::parse($request->input('to', Carbon::now()))->endOfDay();

        $reportData = DB::table('receipt_details')
            ->join('receipts', 'receipt_details.id_receipt', '=', 'receipts.id_receipt')
            ->join('products', 'receipt_details.id_product', '=', 'products.id_product')
            ->whereBetween('receipts.issue_date', [$from, $to])
            ->select(
                'products.product_name',
                'products.product_code',
                'products.sale_price as current_sale_price',
                DB::raw('AVG(
                    CASE
                        WHEN receipts.currency = "USD" THEN receipt_details.unit_price * receipts.exchange_rate
                        ELSE receipt_details.unit_price
                    END
                ) as avg_cost'),
                DB::raw('SUM(receipt_details.quantity) as total_qty')
            )
            ->groupBy('products.id_product', 'products.product_name', 'products.product_code', 'products.sale_price')
            ->get()
            ->map(function ($item) {
                $cost = (float) $item->avg_cost;
                $sale = (float) $item->current_sale_price;

                $profit_per_unit = $sale - $cost;
                $margin_percent = $sale > 0 ? ($profit_per_unit / $sale) * 100 : 0;

                return [
                    'product' => $item->product_name,
                    'code' => $item->product_code,
                    'avg_cost' => round($cost, 2),
                    'avg_sale' => round($sale, 2),
                    'margin_percent' => round($margin_percent, 2),
                    'projected_profit' => round($profit_per_unit * $item->total_qty, 2),
                    'total_qty' => $item->total_qty
                ];
            })
            ->sortByDesc('projected_profit')
            ->values();

        return Inertia::render('Receipts/Reports/MarginReport', [
            'reportData' => $reportData,
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()]
        ]);
    }

    public function supplierReport(Request $request)
    {
        // CORRECCIÓN DE FECHAS
        $from = Carbon::parse($request->input('from', Carbon::now()->startOfMonth()))->startOfDay();
        $to = Carbon::parse($request->input('to', Carbon::now()))->endOfDay();

        $reportData = DB::table('receipts')
            ->join('suppliers', 'receipts.id_supplier', '=', 'suppliers.id_supplier')
            ->whereBetween('receipts.issue_date', [$from, $to])
            ->select(
                'suppliers.company_name',
                'suppliers.ruc',
                DB::raw('COUNT(receipts.id_receipt) as purchase_count'),
                DB::raw('SUM(
                    CASE
                        WHEN receipts.currency = "USD" THEN receipts.total_amount * receipts.exchange_rate
                        ELSE receipts.total_amount
                    END
                ) as total_invested'),
                DB::raw('MAX(receipts.issue_date) as last_purchase')
            )
            ->groupBy('suppliers.id_supplier', 'suppliers.company_name', 'suppliers.ruc')
            ->orderByDesc('total_invested')
            ->get()
            ->map(function ($item) {
                return [
                    'supplier' => $item->company_name,
                    'ruc' => $item->ruc,
                    'count' => $item->purchase_count,
                    'total' => round((float) $item->total_invested, 2),
                    'last_date' => Carbon::parse($item->last_purchase)->format('d/m/Y'),
                ];
            });

        return Inertia::render('Receipts/Reports/SupplierReport', [
            'reportData' => $reportData,
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()]
        ]);
    }

    public function variationReport(Request $request)
    {
        // CORRECCIÓN DE FECHAS
        $from = Carbon::parse($request->input('from', Carbon::now()->subMonths(6)))->startOfDay();
        $to = Carbon::parse($request->input('to', Carbon::now()))->endOfDay();
        $id_product = $request->input('id_product');

        $trendQuery = DB::table('receipt_details')
            ->join('receipts', 'receipt_details.id_receipt', '=', 'receipts.id_receipt')
            ->whereNotNull('receipt_details.id_product')
            ->whereBetween('receipts.issue_date', [$from, $to]);

        if ($id_product) {
            $trendQuery->where('receipt_details.id_product', $id_product);
        }

        $trendData = $trendQuery->select(
            'receipts.issue_date as date',
            DB::raw('AVG(
                CASE
                    WHEN receipts.currency = "USD" THEN receipt_details.unit_price * receipts.exchange_rate
                    ELSE receipt_details.unit_price
                END
            ) as price')
        )
            ->groupBy('receipts.issue_date')
            ->orderBy('receipts.issue_date', 'asc')
            ->get();

        $products = DB::table('receipt_details')
            ->join('receipts', 'receipt_details.id_receipt', '=', 'receipts.id_receipt')
            ->join('products', 'receipt_details.id_product', '=', 'products.id_product')
            ->whereBetween('receipts.issue_date', [$from, $to])
            ->select(
                'products.id_product',
                'products.product_name',
                DB::raw('MIN(receipt_details.id_receipt_detail) as first_detail_id'),
                DB::raw('MAX(receipt_details.id_receipt_detail) as last_detail_id')
            )
            ->groupBy('products.id_product', 'products.product_name')
            ->get()
            ->map(function ($p) {
                $getNormalizedPrice = function ($detailId) {
                    $record = DB::table('receipt_details')
                        ->join('receipts', 'receipt_details.id_receipt', '=', 'receipts.id_receipt')
                        ->where('receipt_details.id_receipt_detail', $detailId)
                        ->select('receipt_details.unit_price', 'receipts.currency', 'receipts.exchange_rate')
                        ->first();

                    if (!$record) return 0;
                    return $record->currency === 'USD'
                        ? $record->unit_price * $record->exchange_rate
                        : $record->unit_price;
                };

                $firstPrice = $getNormalizedPrice($p->first_detail_id);
                $lastPrice = getNormalizedPrice($p->last_detail_id);
                $variation = $firstPrice > 0 ? (($lastPrice - $firstPrice) / $firstPrice) * 100 : 0;

                return [
                    'id' => $p->id_product,
                    'name' => $p->product_name,
                    'old_price' => round((float)$firstPrice, 2),
                    'new_price' => round((float)$lastPrice, 2),
                    'variation' => round($variation, 2)
                ];
            })
            ->sortByDesc(fn($item) => abs($item['variation']))
            ->values();

        return Inertia::render('Receipts/Reports/CostVariationReport', [
            'trendData' => $trendData,
            'reportData' => $products,
            'productsList' => Products::select('id_product as value', 'product_name as label')->get(),
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'id_product' => $id_product
            ]
        ]);
    }
    public function exportTaxExcel(Request $request)
    {
        // CORRECCIÓN DE FECHAS EN EXPORTACIÓN TAMBIÉN
        // Aquí no usamos startOfDay/endOfDay porque TaxReportExport ya lo hace internamente (o debería hacerlo)
        // Pero para ser consistentes, pasamos strings Y-m-d y que el exportador maneje las horas.
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $idProduct = $request->input('id_product');

        return Excel::download(
            new TaxReportExport($from, $to, $idProduct),
            "libro_compras_{$from}_al_{$to}.xlsx"
        );
    }
}
