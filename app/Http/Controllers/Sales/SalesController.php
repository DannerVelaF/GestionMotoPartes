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
        return [
            $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d')) . ' 00:00:00',
            $request->input('to', Carbon::now()->format('Y-m-d')) . ' 23:59:59'
        ];
    }

    public function reportDaily(Request $request)
    {
        $range = $this->getDateRange($request);
        $period = $request->input('period', 'daily');

        // 1. Definir formato de fecha SQL
        switch ($period) {
            case 'weekly':
                $sql = 'STR_TO_DATE(CONCAT(YEARWEEK(date_sales, 1), " Monday"), "%x%v %W")';
                break;
            case 'monthly':
                $sql = 'DATE_FORMAT(date_sales, "%Y-%m-01")';
                break;
            case 'yearly':
                $sql = 'DATE_FORMAT(date_sales, "%Y-01-01")';
                break;
            case 'daily':
            default:
                $sql = 'DATE(date_sales)';
                break;
        }

        // 2. Consulta agrupada por FECHA y MÉTODO DE PAGO
        // Usamos leftJoin para no perder ventas sin método (aunque no debería haber)
        $rawQuery = Sales::query()
            ->join('sale_details', 'sales.id_sales', '=', 'sale_details.id_sales')
            ->leftJoin('method_payments', 'sales.id_method_payment', '=', 'method_payments.id_method_payment')

            ->selectRaw("{$sql} as date_group")
            // Si es null, le ponemos 'Otros'
            ->selectRaw("COALESCE(method_payments.name_method_payment, 'Otros') as method_name")

            // Métricas
            ->selectRaw('SUM(sale_details.subtotal) as revenue')
            ->selectRaw('SUM(sale_details.quantity * sale_details.cost) as cost')
            ->selectRaw('COUNT(DISTINCT sales.id_sales) as tx_count')

            ->whereBetween('sales.date_sales', $range)
            ->groupByRaw("date_group, method_name")
            ->orderBy('date_group', 'ASC')
            ->get();

        // 3. Procesamiento con Colecciones (Agrupar por Fecha para el Frontend)
        $reportData = $rawQuery->groupBy('date_group')->map(function ($dayGroup) {

            // Totales del día
            $totalRevenue = $dayGroup->sum('revenue');
            $totalCost    = $dayGroup->sum('cost');
            $profit       = $totalRevenue - $totalCost;
            $margin       = $totalRevenue > 0 ? ($profit / $totalRevenue) * 100 : 0;
            $transactions = $dayGroup->sum('tx_count');

            // Desglose por método dentro de este día
            $methods = $dayGroup->map(function ($row) {
                return [
                    'name'  => $row->method_name,
                    'total' => (float) $row->revenue,
                    'count' => (int) $row->tx_count,
                ];
            })->values();

            return [
                'date'         => $dayGroup->first()->date_group,
                'total'        => $totalRevenue,
                'cost'         => $totalCost,
                'profit'       => $profit,
                'margin'       => round($margin, 2),
                'transactions' => $transactions,
                'methods'      => $methods
            ];
        })->values();

        return Inertia::render('Sales/Reports/DailySummary', [
            'reportData' => $reportData,
            'filters' => [
                'from' => $request->input('from', Carbon::now()->subDays(30)->format('Y-m-d')),
                'to'   => $request->input('to', Carbon::now()->format('Y-m-d')),
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
