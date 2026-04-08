<?php

namespace App\Http\Controllers\Sales;

use App\Enums\GenericStatus;
use App\Exports\DailyReportExport;
use App\Exports\TaxReportExport;
use App\Http\Controllers\Controller;
use App\Http\Services\Sales\SalesService;
use App\Models\BusinessConfig;
use App\Models\MethodPayment;
use App\Models\Products;
use App\Models\Receipt;
use App\Models\Sales;
use App\Models\SaleLog; // ✅ Importamos el modelo para el historial
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // ✅ Importamos Auth para guardar el usuario en las notas
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class SalesController extends Controller
{
    protected $service;

    public function __construct(SalesService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);
        $groupBy = $request->input('group_by') ?? 'none';

        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 20;
        }

        $query = Sales::query()
            ->with(['user:id,name', 'receipt', 'methodPayment'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code_sales', 'like', "%{$search}%")
                        ->orWhere('receiver_name', 'like', "%{$search}%")
                        ->orWhere('receiver_id_number', 'like', "%{$search}%"); // Quité la serie y número de aquí porque ahora viven en receipts
                });
            });

        // Lógica de Ordenamiento para agrupamiento visual
        if ($groupBy === 'customer') {
            $query->orderBy('receiver_name', 'asc');
        } elseif ($groupBy === 'method_payment') {
            $query->leftJoin('method_payments', 'sales.id_method_payment', '=', 'method_payments.id_method_payment')
                  ->orderBy('method_payments.name_method_payment', 'asc');
        } elseif ($groupBy === 'month') {
            $query->orderBy('date_sales', 'desc');
        } else {
            $query->orderBy('sales.created_at', 'desc'); // explicit table to avoid ambiguous column if joined
        }

        // Si se hizo un join (por el method_payment), hay que seleccionar solo las columnas de ventas
        if ($groupBy === 'method_payment') {
            $query->select('sales.*');
        }

        $sales = $query->paginate((int)$perPage)->withQueryString();

        return Inertia::render('Sales/ListSales', [
            'sales' => $sales,
            'filters' => [
                'search' => $search,
                'per_page' => (int)$perPage,
                'group_by' => $groupBy,
            ]
        ]);
    }

    public function create()
    {
        $products = Products::where('status', GenericStatus::ACTIVE->value)
            ->select('id_product', 'product_name', 'product_code', 'sale_price', 'stock')
            ->orderBy('product_name')
            ->get();

        $methodsPayment = MethodPayment::where("status", GenericStatus::ACTIVE->value)
            ->select('id_method_payment', 'name_method_payment')
            ->orderBy('name_method_payment')
            ->get();

        $documentTypes = [
            ['value' => 'nota_venta', 'label' => 'Nota de Venta (Ticket)'],
        ];

        $taxes = \App\Models\Taxes::all();

        return Inertia::render('Sales/CreateSales', [
            'products'       => $products,
            'methodsPayment' => $methodsPayment,
            'documentTypes'  => $documentTypes,
            'taxes'          => $taxes,
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'document_type' => 'required|string',
            'issue_date'    => 'required|date',
            'method_payment_id' => 'required|exists:method_payments,id_method_payment',
            'details'              => 'required|array|min:1',
            'details.*.id_product' => 'required|exists:products,id_product',
            'details.*.quantity'   => 'required|numeric|min:0.1',
            'details.*.unit_price' => 'required|numeric|min:0',
        ];

        $messages = [
            'document_type.required'     => 'El tipo de documento es obligatorio.',
            'issue_date.required'        => 'La fecha de emisión es obligatoria.',
            'issue_date.date'            => 'La fecha de emisión no es válida.',
            'method_payment_id.required' => 'Debes seleccionar un método de pago.',
            'method_payment_id.exists'   => 'El método de pago seleccionado no es válido.',
            'details.required'           => 'Debes agregar al menos un producto a la venta.',
            'details.min'                => 'La venta debe tener al menos un producto.',
            'details.*.id_product.required' => 'El producto es obligatorio.',
            'details.*.id_product.exists'   => 'Uno de los productos seleccionados no existe en la base de datos.',
            'details.*.quantity.required'   => 'La cantidad es obligatoria.',
            'details.*.quantity.min'        => 'La cantidad debe ser mayor a 0.',
            'details.*.unit_price.required' => 'El precio unitario es obligatorio.',
            'details.*.unit_price.min'      => 'El precio no puede ser negativo.',
        ];

        $validatedData = $request->validate($rules, $messages);

        try {
            $sale = $this->service->createSale($request->all());

            return redirect()->route('sales.show', $sale->id_sales)->with([
                'saleId'  => $sale->id_sales,
                'success' => 'Venta registrada correctamente.'
            ]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al registrar venta: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        // ✅ CORRECCIÓN: Se añaden las relaciones 'receipt' y 'logs.user'
        $sale = Sales::with(['details.product', 'user:id,name', "methodPayment", 'receipt', 'logs.user'])
            ->findOrFail($id);

        return Inertia::render('Sales/ShowSale', [
            'sale' => $sale,
        ]);
    }

    // ✅ NUEVO MÉTODO: Para guardar notas manuales en el historial de la venta
    public function storeNote(Request $request, $id)
    {
        $request->validate([
            'internal_note' => 'required|string'
        ]);

        $sale = Sales::findOrFail($id);

        SaleLog::create([
            'id_sales' => $sale->id_sales,
            'id_user'  => Auth::id(),
            'action'   => 'Nota',
            'notes'    => $request->internal_note,
        ]);

        return back()->with('success', 'Nota registrada en el historial.');
    }

    public function update() {}

    public function destroy() {}

    public function bulkDestroy() {}

    public function printTicket($id)
    {
        $sale = Sales::with(['details.product', 'details.tax', 'user', 'receipt', 'methodPayment'])->findOrFail($id);

        $config = BusinessConfig::first() ?? new BusinessConfig([
            'company_name' => 'Configurar Empresa',
            'ruc' => '00000000000',
            'address' => 'Dirección no configurada',
            'city' => '',
            'phone' => ''
        ]);

        return view('print.ticket', compact('sale', 'config'));
    }

    private function getDateRange(Request $request)
    {
        $from = $request->input('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : Carbon::now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : Carbon::now()->endOfDay();

        return [$from, $to];
    }

    public function reportDaily(Request $request)
    {
        [$from, $to] = $this->getDateRange($request);
        $period = $request->input('period', 'daily');

        // 1. Definición de agrupamiento SQL según el periodo
        switch ($period) {
            case 'weekly':
                $sqlSales = 'STR_TO_DATE(CONCAT(YEARWEEK(date_sales, 1), " Monday"), "%x%v %W")';
                $sqlPurchases = 'STR_TO_DATE(CONCAT(YEARWEEK(issue_date, 1), " Monday"), "%x%v %W")';
                break;
            case 'monthly':
                $sqlSales = 'DATE_FORMAT(date_sales, "%Y-%m-01")';
                $sqlPurchases = 'DATE_FORMAT(issue_date, "%Y-%m-01")';
                break;
            case 'yearly':
                $sqlSales = 'DATE_FORMAT(date_sales, "%Y-01-01")';
                $sqlPurchases = 'DATE_FORMAT(issue_date, "%Y-01-01")';
                break;
            case 'daily':
            default:
                $sqlSales = 'DATE(date_sales)';
                $sqlPurchases = 'DATE(issue_date)';
                break;
        }

        // 2. Consulta de INGRESOS (Ventas)
        $salesQuery = Sales::query()
            ->leftJoin('method_payments', 'sales.id_method_payment', '=', 'method_payments.id_method_payment')
            ->select(DB::raw("$sqlSales as date_group"))
            ->selectRaw("COALESCE(method_payments.name_method_payment, 'Otros') as method_name")
            ->selectRaw('SUM(total) as income')
            ->selectRaw('COUNT(id_sales) as tx_count')
            ->whereBetween('date_sales', [$from, $to])
            ->groupBy('date_group', 'method_name')
            ->get();

        $salesByDate = $salesQuery->groupBy('date_group');

        // 3. Consulta de EGRESOS (Ahora desde PurchaseOrder)
        // Usamos PurchaseOrder para tener el gasto real comprometido/aprobado
        $expensesQuery = DB::table('purchase_orders')
            ->select(DB::raw("$sqlPurchases as date_group"))
            ->selectRaw('SUM(
            CASE
                WHEN currency = "USD" THEN total_amount * exchange_rate
                ELSE total_amount
            END
        ) as expense')
            ->whereBetween('issue_date', [$from, $to])
            ->whereNotIn('status', ['draft', 'cancelled']) // Solo órdenes reales
            ->groupBy('date_group')
            ->get()
            ->keyBy('date_group');

        // 4. Unificar fechas de ambos universos
        $allDates = $salesByDate->keys()->merge($expensesQuery->keys())->unique()->sort();

        // 5. Mapeo del reporte final
        $reportData = $allDates->map(function ($date) use ($salesByDate, $expensesQuery) {
            $daySales = $salesByDate->get($date, collect());
            $totalIncome = $daySales->sum('income');
            $txCount = $daySales->sum('tx_count');
            $expense = (float) ($expensesQuery[$date]->expense ?? 0);

            $methods = $daySales->map(function ($row) {
                return [
                    'name' => $row->method_name,
                    'total' => (float) $row->income,
                    'count' => (int) $row->tx_count,
                ];
            })->values();

            return [
                'date' => $date,
                'income' => round($totalIncome, 2),
                'expense' => round($expense, 2),
                'balance' => round($totalIncome - $expense, 2),
                'transactions' => $txCount,
                'methods' => $methods
            ];
        })->values();

        return Inertia::render('Sales/Reports/DailySummary', [
            'reportData' => $reportData,
            'filters' => [
                'from' => \Carbon\Carbon::parse($from)->toDateString(),
                'to'   => \Carbon\Carbon::parse($to)->toDateString(),
                'period' => $period
            ]
        ]);
    }
    public function reportTax(Request $request)
    {
        $range = $this->getDateRange($request);
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

        $data = DB::table('sales')
            ->join('receipts', 'sales.id_sales', '=', 'receipts.id_sales')
            ->join('sale_details', 'sales.id_sales', '=', 'sale_details.id_sales')
            ->select(
                'receipts.document_type',
                // Base Imponible = (Cantidad * Precio) - Impuesto acumulado
                DB::raw('SUM((sale_details.quantity * sale_details.unit_price) - sale_details.tax_amount) as base_imponible'),
                DB::raw('SUM(sale_details.tax_amount) as igv'),
                DB::raw('SUM(sale_details.quantity * sale_details.unit_price) as total')
            )
            ->whereBetween('sales.date_sales', $range)
            ->groupBy('receipts.document_type')
            ->get();

        return Inertia::render('Sales/Reports/TaxReport', [
            'reportData' => $data,
            'filters' => ['from' => $from, 'to' => $to]
        ]);
    }

    public function reportTopProducts(Request $request)
    {
        // Usamos el mismo estándar de fechas startOfDay y endOfDay
        $from = $request->input('from')
            ? \Carbon\Carbon::parse($request->input('from'))->startOfDay()
            : \Carbon\Carbon::now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? \Carbon\Carbon::parse($request->input('to'))->endOfDay()
            : \Carbon\Carbon::now()->endOfDay();

        // Consultamos la tabla de detalles unida a productos y cabecera de ventas
        $data = DB::table('sale_details')
            ->join('products', 'sale_details.id_product', '=', 'products.id_product')
            ->join('sales', 'sale_details.id_sales', '=', 'sales.id_sales')
            // ✅ Filtro importante: Ignoramos ventas canceladas
            ->whereNotIn('sales.status', ['cancelled'])
            ->whereBetween('sales.date_sales', [$from, $to])
            ->select(
                'products.product_name',
                'products.product_code',
                // Usamos CAST o round para asegurar tipos numéricos limpios para el frontend
                DB::raw('CAST(SUM(sale_details.quantity) AS DECIMAL(12,2)) as total_qty'),
                DB::raw('CAST(SUM(sale_details.subtotal) AS DECIMAL(12,2)) as total_revenue')
            )
            ->groupBy('products.id_product', 'products.product_name', 'products.product_code')
            ->orderBy('total_qty', 'DESC')
            ->limit(15)
            ->get()
            ->map(function($item) {
                return [
                    'product_name' => $item->product_name,
                    'product_code' => $item->product_code,
                    'total_qty' => (float) $item->total_qty,
                    'total_revenue' => (float) $item->total_revenue,
                ];
            });

        return Inertia::render('Sales/Reports/TopProducts', [
            'reportData' => $data,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString()
            ]
        ]);
    }
    public function reportBrandAnalysis(Request $request)
    {
        // Estandarización de fechas para precisión horaria
        $from = $request->input('from')
            ? \Carbon\Carbon::parse($request->input('from'))->startOfDay()
            : \Carbon\Carbon::now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? \Carbon\Carbon::parse($request->input('to'))->endOfDay()
            : \Carbon\Carbon::now()->endOfDay();

        $data = DB::table('sale_details')
            ->join('products', 'sale_details.id_product', '=', 'products.id_product')
            ->join('brands', 'products.id_brand', '=', 'brands.id_brand')
            ->join('sales', 'sale_details.id_sales', '=', 'sales.id_sales')
            // ✅ Filtro: Solo ventas válidas para el market share
            ->whereNotIn('sales.status', ['cancelled'])
            ->whereBetween('sales.date_sales', [$from, $to])
            ->select(
                'brands.name_brand as label',
                DB::raw('CAST(SUM(sale_details.subtotal) AS DECIMAL(12,2)) as value')
            )
            ->groupBy('brands.id_brand', 'brands.name_brand')
            ->orderBy('value', 'DESC')
            ->get()
            ->map(function ($item) {
                return [
                    'label' => $item->label,
                    'value' => (float) $item->value
                ];
            });

        return Inertia::render('Sales/Reports/BrandAnalysis', [
            'reportData' => $data,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString()
            ]
        ]);
    }
    public function exportTaxExcel(Request $request)
    {
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

        $fileName = 'Libro_Ventas_SUNAT_' . Carbon::now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new TaxReportExport($from, $to), $fileName);
    }

    public function exportDailyExcel(Request $request)
    {
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));
        $period = $request->input('period', 'daily');

        $fileName = 'Reporte_Economico_' . $period . '_' . Carbon::now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new DailyReportExport($from, $to, $period), $fileName);
    }
}
