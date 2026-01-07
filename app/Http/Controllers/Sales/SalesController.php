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
use Carbon\Carbon;
use Illuminate\Http\Request;
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
            ->with(['user:id,name'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code_sales', 'like', "%{$search}%")
                        ->orWhere('receiver_name', 'like', "%{$search}%")
                        ->orWhere('receiver_id_number', 'like', "%{$search}%")
                        ->orWhere('series', 'like', "%{$search}%")
                        ->orWhere('number', 'like', "%{$search}%");
                });
            });

        // Lógica de Ordenamiento para agrupamiento visual
        if ($groupBy === 'customer') {
            // Agrupamos por el nombre guardado en la tabla sales
            $query->orderBy('receiver_name', 'asc');
        } elseif ($groupBy === 'document_type') {
            $query->orderBy('document_type', 'asc');
        } elseif ($groupBy === 'month') {
            $query->orderBy('date_sales', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $sales = $query->paginate((int)$perPage)->withQueryString();

        return Inertia::render('Sales/ListSales', [
            'sales' => $sales,
            'filters' => [
                'search' => $search,
                'per_page' => (int)$perPage, // Asegúrate de enviarlo como entero
                'group_by' => $groupBy,
            ]
        ]);
    }
    public function create()
    {
        // CAMBIO: Añadimos where('status', 'active')
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
            ['value' => 'boleta', 'label' => 'Boleta de Venta'],
            ['value' => 'factura', 'label' => 'Factura'],
        ];

        return Inertia::render('Sales/CreateSales', [
            'products' => $products,
            'methodsPayment' => $methodsPayment,
            'documentTypes' => $documentTypes,
        ]);
    }

    public function store(Request $request)
    {
        // 1. Reglas de Validación
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

        // Ejecutar validación
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
        // Cargamos la venta con sus detalles y los productos de esos detalles
        $sale = Sales::with(['details.product', 'user:id,name', "methodPayment"])
            ->findOrFail($id);
        return Inertia::render('Sales/ShowSale', [
            'sale' => $sale,
        ]);
    }

    public function update() {}

    public function destroy() {}

    public function bulkDestroy() {}
    public function printTicket($id)
    {
        $sale = Sales::with(['details.product', 'user'])->findOrFail($id);

        $config = BusinessConfig::first() ?? new BusinessConfig([
            'company_name' => 'Configurar Empresa',
            'ruc' => '00000000000',
            'address' => 'Dirección no configurada',
            'city' => '',
            'phone' => ''
        ]);

        // 3. Pasamos ambas variables a la vista
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

        // 1. Definir formato de fecha SQL
        switch ($period) {
            case 'weekly':
                $sqlSales = 'STR_TO_DATE(CONCAT(YEARWEEK(date_sales, 1), " Monday"), "%x%v %W")';
                $sqlReceipts = 'STR_TO_DATE(CONCAT(YEARWEEK(issue_date, 1), " Monday"), "%x%v %W")';
                break;
            case 'monthly':
                $sqlSales = 'DATE_FORMAT(date_sales, "%Y-%m-01")';
                $sqlReceipts = 'DATE_FORMAT(issue_date, "%Y-%m-01")';
                break;
            case 'yearly':
                $sqlSales = 'DATE_FORMAT(date_sales, "%Y-01-01")';
                $sqlReceipts = 'DATE_FORMAT(issue_date, "%Y-01-01")';
                break;
            case 'daily':
            default:
                $sqlSales = 'DATE(date_sales)';
                $sqlReceipts = 'DATE(issue_date)';
                break;
        }

        // 2. Obtener VENTAS (Ingresos) desglosadas por MÉTODO
        $salesQuery = Sales::query()
            ->leftJoin('method_payments', 'sales.id_method_payment', '=', 'method_payments.id_method_payment')
            ->select(DB::raw("$sqlSales as date_group"))
            ->selectRaw("COALESCE(method_payments.name_method_payment, 'Otros') as method_name")
            ->selectRaw('SUM(total) as income')
            ->selectRaw('COUNT(id_sales) as tx_count')
            ->whereBetween('date_sales', [$from, $to])
            ->groupBy('date_group', 'method_name') // Agrupamos por fecha Y método
            ->get();

        // Agrupamos la colección por fecha para facilitar el merge
        $salesByDate = $salesQuery->groupBy('date_group');

        // 3. Obtener COMPRAS (Egresos) totales por fecha
        $expensesQuery = Receipt::query()
            ->select(DB::raw("$sqlReceipts as date_group"))
            ->selectRaw('SUM(
                CASE 
                    WHEN currency = "USD" THEN total_amount * exchange_rate 
                    ELSE total_amount 
                END
            ) as expense')
            ->whereBetween('issue_date', [$from, $to])
            ->groupBy('date_group')
            ->get()
            ->keyBy('date_group');

        // 4. Fusionar fechas
        $allDates = $salesByDate->keys()->merge($expensesQuery->keys())->unique()->sort();

        // 5. Mapear datos finales
        $reportData = $allDates->map(function ($date) use ($salesByDate, $expensesQuery) {

            // Obtener todas las filas de ventas de este día (una por método)
            $daySales = $salesByDate->get($date, collect());

            // Calcular totales del día
            $totalIncome = $daySales->sum('income');
            $txCount = $daySales->sum('tx_count');

            // Obtener gasto del día
            $expense = (float) ($expensesQuery[$date]->expense ?? 0);

            // Preparar el desglose de métodos para el frontend
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
                'methods' => $methods // <--- Aquí va el desglose
            ];
        })->values();

        return Inertia::render('Sales/Reports/DailySummary', [
            'reportData' => $reportData,
            'filters' => [
                'from' => Carbon::parse($from)->toDateString(),
                'to'   => Carbon::parse($to)->toDateString(),
                'period' => $period
            ]
        ]);
    }

    // 2. Reporte: Libro de Ventas / Impuestos
    public function reportTax(Request $request)
    {
        $range = $this->getDateRange($request);

        // Extraemos las fechas limpias para enviarlas de vuelta a la vista
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

        $data = Sales::select(
            'document_type',
            DB::raw('SUM(total / 1.18) as base_imponible'),
            DB::raw('SUM(total - (total / 1.18)) as igv'),
            DB::raw('SUM(total) as total')
        )
            ->whereBetween('date_sales', $range)
            ->groupBy('document_type')
            ->get();

        return Inertia::render('Sales/Reports/TaxReport', [
            'reportData' => $data,
            'filters' => [
                'from' => $from,
                'to' => $to
            ]
        ]);
    }
    // 3. Reporte: Productos Estrella (Top Sellers)
    public function reportTopProducts(Request $request)
    {
        $range = $this->getDateRange($request);

        // Extraemos las fechas para la vista
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

        // Cambié 'sales_details' por 'sale_details' basándome en el error común
        // Si tu tabla se llama distinto, ajústalo aquí.
        $data = DB::table('sale_details')
            ->join('products', 'sale_details.id_product', '=', 'products.id_product')
            ->join('sales', 'sale_details.id_sales', '=', 'sales.id_sales')
            ->select(
                'products.product_name',
                'products.product_code',
                DB::raw('SUM(sale_details.quantity) as total_qty'),
                DB::raw('SUM(sale_details.subtotal) as total_revenue')
            )
            ->whereBetween('sales.date_sales', $range)
            ->groupBy('products.id_product', 'products.product_name', 'products.product_code')
            ->orderBy('total_qty', 'DESC')
            ->limit(15)
            ->get();

        return Inertia::render('Sales/Reports/TopProducts', [
            'reportData' => $data,
            'filters' => [
                'from' => $from,
                'to' => $to
            ]
        ]);
    }
    // 4. Reporte: Análisis por Marcas / Categorías
    public function reportBrandAnalysis(Request $request)
    {
        $range = $this->getDateRange($request);

        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

        // Corregido: 'sale_details' en lugar de 'sales_details'
        $data = DB::table('sale_details')
            ->join('products', 'sale_details.id_product', '=', 'products.id_product')
            ->join('brands', 'products.id_brand', '=', 'brands.id_brand')
            ->join('sales', 'sale_details.id_sales', '=', 'sales.id_sales')
            ->select(
                'brands.name_brand as label',
                DB::raw('SUM(sale_details.subtotal) as value')
            )
            ->whereBetween('sales.date_sales', $range)
            ->groupBy('brands.id_brand', 'brands.name_brand')
            ->orderBy('value', 'DESC')
            ->get();

        return Inertia::render('Sales/Reports/BrandAnalysis', [
            'reportData' => $data,
            'filters' => [
                'from' => $from,
                'to' => $to
            ]
        ]);
    }

    public function exportTaxExcel(Request $request)
    {
        // Obtener fechas o usar default (últimos 30 días), igual que en los reportes
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

        $fileName = 'Libro_Ventas_SUNAT_' . Carbon::now()->format('Ymd_His') . '.xlsx';

        // Descarga el archivo usando la clase exportadora
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
