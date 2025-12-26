<?php

namespace App\Http\Controllers\Receipt;

use App\Enums\DocumentType;
use App\Exports\TaxReportExport;
use App\Http\Controllers\Controller;
use App\Http\Services\Receipt\ReceiptService;
use App\Models\Products; // Asegúrate de importar tu modelo de productos
use App\Models\Receipt;
use App\Models\ReceiptDetail;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

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
        $groupBy = $request->input('group_by') ?? 'none'; // Default 'none'

        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 20;
        }

        $query = Receipt::query()
            ->with(['supplier:id_supplier,company_name,ruc']) // Cargar relación
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('receipt_code', 'like', "%{$search}%")
                        ->orWhere('series', 'like', "%{$search}%")
                        ->orWhere('number', 'like', "%{$search}%")
                        ->orWhereHas('supplier', function ($sq) use ($search) {
                            $sq->where('company_name', 'like', "%{$search}%")
                                ->orWhere('ruc', 'like', "%{$search}%");
                        });
                });
            });

        // Lógica de Ordenamiento para que el agrupamiento visual funcione bien
        if ($groupBy === 'document_type') {
            $query->orderBy('document_type', 'asc');
        } elseif ($groupBy === 'month') {
            // Ordenar por fecha para agrupar por mes
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

    public function create()
    {
        return Inertia::render('Receipts/CreateReceipt', [
            'suppliers' => Supplier::select('id_supplier', 'company_name', 'ruc')
                ->orderBy('company_name')
                ->get(),
            // CAMBIO AQUÍ: Agregamos 'sale_price' a la selección
            'products' => Products::where('status', 'active')
                ->select('id_product', 'product_name', 'product_code', 'sale_price')
                ->orderBy('product_name')
                ->get(),
            'documentTypes' => collect(DocumentType::cases())->map(fn($t) => ['value' => $t->value, 'label' => $t->label()]),
        ]);
    }

    public function store(Request $request)
    {
        $messages = [
            'id_supplier.required' => 'El proveedor es obligatorio.',
            'document_type.required' => 'El tipo de documento es obligatorio.',
            'series.required' => 'La serie del comprobante es obligatoria.',
            'number.required' => 'El número del comprobante es obligatorio.',
            'issue_date.required' => 'La fecha de emisión es obligatoria.',
            'details.required' => 'Debes agregar al menos un producto.',
            'details.*.id_product.required' => 'El producto es obligatorio en cada línea.',
            'details.*.id_product.exists' => 'Uno de los productos seleccionados no es válido.',
            'details.*.quantity.required' => 'La cantidad es obligatoria.',
            'details.*.quantity.min' => 'La cantidad debe ser mayor a 0.',
            'details.*.unit_price.required' => 'El costo unitario es obligatorio.',
            'details.*.unit_price.min' => 'El costo unitario debe ser mayor o igual a 0.',
            'details.*.sale_price.required' => 'El precio de venta es obligatorio.',
            'details.*.sale_price.min' => 'El precio de venta debe ser mayor o igual a 0.',
        ];

        $validated = $request->validate([
            'id_supplier'           => 'required|exists:suppliers,id_supplier',
            'document_type'         => ['required', Rule::enum(DocumentType::class)],
            'series'                => 'required|string|max:10',
            'number'                => 'required|string|max:20',
            'issue_date'            => 'required|date',
            'file'                  => 'nullable|file|mimes:pdf,jpg,png,jpeg|max:5120',
            'details'               => 'required|array|min:1',
            'details.*.id_product'  => 'required|exists:products,id_product',
            'details.*.quantity'    => 'required|numeric|min:0.01',
            'details.*.unit_price'  => 'required|numeric|min:0',
            'details.*.sale_price'  => 'required|numeric|min:0',
        ], $messages);


        if (empty($validated['details'])) {
            return back()->withErrors(['error' => 'Debes agregar al menos un producto.']);
        }


        try {
            $productNames = Products::whereIn('id_product', collect($validated['details'])->pluck('id_product'))
                ->pluck('product_name', 'id_product');

            foreach ($validated['details'] as $detail) {
                $cost = (float)$detail['unit_price'];
                $salePrice = (float)$detail['sale_price'];
                $productId = $detail['id_product'];
                $productName = $productNames[$productId] ?? "ID {$productId}";

                if ($salePrice > 0 && $cost > $salePrice) {
                    return back()->withErrors([
                        'error' => "El costo unitario (S/ {$cost}) del producto '{$productName}' es mayor que su precio de venta sugerido (S/ {$salePrice}). La compra generaría pérdida."
                    ]);
                }
            }

            $receipt = $this->service->createReceipt($validated);

            return to_route('receipts.show', $receipt->id_receipt)
                ->with('success', 'Comprobante registrado correctamente.');
        } catch (\Exception $e) {
            Log::error('Error creating receipt: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al guardar: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $receipt = Receipt::with(['details.product', 'supplier', 'children' => function ($query) {
            $query->with('supplier', 'details');
            $query->orderBy('issue_date', 'desc');
        }])->findOrFail($id);
        if (Session::has('success')) {
            Session::forget('success');
        }
        return Inertia::render('Receipts/EditReceipt', [
            'receipt' => $receipt,
            'suppliers' => Supplier::select('id_supplier', 'company_name', 'ruc')->orderBy('company_name')->get(),
            'products' => Products::where('status', 'active')
                ->select('id_product', 'product_name', 'product_code')
                ->orderBy('product_name')
                ->get(),
            'documentTypes' => collect(DocumentType::cases())->map(fn($t) => ['value' => $t->value, 'label' => $t->label()]),
        ]);
    }

    public function update(Request $request, $id)
    {
        // 1. Validación (Similar al store, pero permitiendo mantener los mismos datos)
        $validated = $request->validate([
            'id_supplier'          => 'required|exists:suppliers,id_supplier',
            'document_type'        => ['required', Rule::enum(DocumentType::class)],
            'series'               => 'required|string|max:10',
            'number'               => 'required|string|max:20',
            'issue_date'           => 'required|date',
            'file'                 => 'nullable|file|mimes:pdf,jpg,png,jpeg|max:5120', // Archivo es opcional en update

            // Validación de detalles
            'details'              => 'required|array|min:1',
            'details.*.id_product' => 'required|exists:products,id_product',
            'details.*.quantity'   => 'required|numeric|min:0.01',
            'details.*.unit_price' => 'required|numeric|min:0',

        ]);

        try {
            // 2. Delegar al servicio
            $this->service->updateReceipt($validated, $id);

            // 3. Retornar
            return back()->with('success', 'Comprobante actualizado correctamente.');
        } catch (\Exception $e) {
            Log::error('Error updating receipt: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al actualizar: ' . $e->getMessage()]);
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
            // ✅ CAPTURA DE ERROR DE BASE DE DATOS (Integrity constraint violation)
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
        // 1. Validación simple
        $validated = $request->validate([
            'return_items' => 'required|array',
            'return_items.*.id_product' => 'required|exists:products,id_product',
            'return_items.*.return_quantity' => 'required|numeric|min:0',
            'return_items.*.unit_price' => 'required|numeric',
        ]);

        try {
            // Filtramos solo los items que tienen cantidad > 0
            $itemsToReturn = collect($validated['return_items'])
                ->filter(function ($item) {
                    return $item['return_quantity'] > 0;
                })
                ->toArray();

            if (empty($itemsToReturn)) {
                return back()->withErrors(['error' => 'No hay items seleccionados para devolver.']);
            }

            // 2. Llamar al servicio
            $this->service->createReturn($itemsToReturn, $id);

            return back()->with('success', 'Devolución registrada correctamente (Nota de Crédito creada).');
        } catch (\Exception $e) {
            Log::error('Error processing return: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al procesar devolución: ' . $e->getMessage()]);
        }
    }

    public function taxReport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());

        $reportData = Receipt::select(
            'document_type',
            DB::raw('SUM(total_amount) as total_sum')
        )
            ->whereBetween('issue_date', [$from, $to])
            ->groupBy('document_type')
            ->get()
            ->map(function ($item) {
                $total = (float) $item->total_sum;
                // Cálculo contable Perú (IGV 18%)
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
            'filters' => [
                'from' => $from,
                'to' => $to
            ]
        ]);
    }


    public function marginReport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());

        $reportData = DB::table('receipt_details')
            ->join('receipts', 'receipt_details.id_receipt', '=', 'receipts.id_receipt')
            ->join('products', 'receipt_details.id_product', '=', 'products.id_product')
            ->whereBetween('receipts.issue_date', [$from, $to])
            ->select(
                'products.product_name',
                'products.product_code',
                'products.sale_price as current_sale_price', // <--- Cambiado aquí
                DB::raw('AVG(receipt_details.unit_price) as avg_cost'),
                DB::raw('SUM(receipt_details.quantity) as total_qty')
            )
            ->groupBy('products.id_product', 'products.product_name', 'products.product_code', 'products.sale_price')
            ->get()
            ->map(function ($item) {
                $cost = (float) $item->avg_cost;
                $sale = (float) $item->current_sale_price; // Usamos el precio del maestro de productos

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
            'filters' => ['from' => $from, 'to' => $to]
        ]);
    }
    public function supplierReport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());

        $reportData = DB::table('receipts')
            ->join('suppliers', 'receipts.id_supplier', '=', 'suppliers.id_supplier')
            ->whereBetween('receipts.issue_date', [$from, $to])
            ->select(
                'suppliers.company_name',
                'suppliers.ruc',
                DB::raw('COUNT(receipts.id_receipt) as purchase_count'),
                DB::raw('SUM(receipts.total_amount) as total_invested'),
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
            'filters' => ['from' => $from, 'to' => $to]
        ]);
    }

    public function variationReport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->subMonths(6)->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $id_product = $request->input('id_product');

        // 1. Obtener datos para el gráfico (Promedio diario para no saturar la línea)
        $trendQuery = DB::table('receipt_details')
            ->join('receipts', 'receipt_details.id_receipt', '=', 'receipts.id_receipt')
            ->whereBetween('receipts.issue_date', [$from, $to]);

        if ($id_product) {
            $trendQuery->where('receipt_details.id_product', $id_product);
        }

        $trendData = $trendQuery->select(
            'receipts.issue_date as date',
            DB::raw('AVG(receipt_details.unit_price) as price')
        )
            ->groupBy('receipts.issue_date')
            ->orderBy('receipts.issue_date', 'asc')
            ->get();

        // 2. LÓGICA CORREGIDA: Obtener el PRIMER y ÚLTIMO precio real por ID
        $products = DB::table('receipt_details')
            ->join('receipts', 'receipt_details.id_receipt', '=', 'receipts.id_receipt')
            ->join('products', 'receipt_details.id_product', '=', 'products.id_product')
            ->whereBetween('receipts.issue_date', [$from, $to])
            ->select(
                'products.id_product',
                'products.product_name',
                // Obtenemos el ID del primer y último detalle registrado en ese rango
                DB::raw('MIN(receipt_details.id_receipt_detail) as first_detail_id'),
                DB::raw('MAX(receipt_details.id_receipt_detail) as last_detail_id')
            )
            ->groupBy('products.id_product', 'products.product_name')
            ->get()
            ->map(function ($p) {
                // Buscamos el precio exacto del primer registro
                $firstPrice = DB::table('receipt_details')
                    ->where('id_receipt_detail', $p->first_detail_id)
                    ->value('unit_price');

                // Buscamos el precio exacto del último registro
                $lastPrice = DB::table('receipt_details')
                    ->where('id_receipt_detail', $p->last_detail_id)
                    ->value('unit_price');

                $variation = $firstPrice > 0 ? (($lastPrice - $firstPrice) / $firstPrice) * 100 : 0;

                return [
                    'id' => $p->id_product,
                    'name' => $p->product_name,
                    'old_price' => round((float)$firstPrice, 2),
                    'new_price' => round((float)$lastPrice, 2),
                    'variation' => round($variation, 2)
                ];
            })
            ->sortByDesc(fn($item) => abs($item['variation'])) // Ordenar por los que más cambiaron
            ->values();

        return Inertia::render('Receipts/Reports/CostVariationReport', [
            'trendData' => $trendData,
            'reportData' => $products,
            'productsList' => \App\Models\Products::select('id_product as value', 'product_name as label')->get(),
            'filters' => [
                'from' => $from,
                'to' => $to,
                'id_product' => $id_product
            ]
        ]);
    }
    public function exportTaxExcel(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());

        return Excel::download(
            new TaxReportExport($from, $to),
            "libro_compras_{$from}_al_{$to}.xlsx"
        );
    }
}
