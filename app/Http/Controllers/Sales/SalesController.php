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
            ->with(['user:id,name'])
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
            ['value' => 'boleta', 'label' => 'Boleta de Venta'],
            ['value' => 'factura', 'label' => 'Factura'],
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
        $sale = Sales::with(['details.product', 'user'])->findOrFail($id);

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

        $allDates = $salesByDate->keys()->merge($expensesQuery->keys())->unique()->sort();

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
                'from' => Carbon::parse($from)->toDateString(),
                'to'   => Carbon::parse($to)->toDateString(),
                'period' => $period
            ]
        ]);
    }

    public function reportTax(Request $request)
    {
        $range = $this->getDateRange($request);
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

        // Nota: Si document_type ahora está en receipts, deberás actualizar este reporte pronto.
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

    public function reportTopProducts(Request $request)
    {
        $range = $this->getDateRange($request);
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

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

    public function reportBrandAnalysis(Request $request)
    {
        $range = $this->getDateRange($request);
        $from = $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

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
