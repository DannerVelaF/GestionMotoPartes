<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Http\Services\Sales\SalesService;
use App\Models\BusinessConfig;
use App\Models\Products;
use App\Models\Sales;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesController extends Controller
{
    protected $service;

    public function __construct(SalesService $service){
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
        $products = Products::select('id_product', 'product_name', 'product_code', 'sale_price', "stock")
            ->get();

        $documentTypes = [
            ['value' => 'nota_venta', 'label' => 'Nota de Venta (Ticket)'],
            ['value' => 'boleta', 'label' => 'Boleta de Venta'],
            ['value' => 'factura', 'label' => 'Factura'],
        ];

        return Inertia::render('Sales/CreateSales', [
            'products' => $products,
            'documentTypes' => $documentTypes,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'document_type' => 'required',
            'issue_date'    => 'required|date',
            'details'       => 'required|array|min:1',
            'details.*.id_product' => 'required|exists:products,id_product',
            'details.*.quantity'   => 'required|numeric|min:0.1',
            'details.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            $sale = $this->service->createSale($request->all());

            // Redirigimos a la vista 'show' de la venta recién creada
            return redirect()->route('sales.show', $sale->id_sales)->with([
                'saleId' => $sale->id_sales, // Mantenemos esto para que el frontend pueda abrir el modal
                'success' => 'Venta registrada correctamente.'
            ]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al registrar venta: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        // Cargamos la venta con sus detalles y los productos de esos detalles
        $sale = Sales::with(['details.product', 'user:id,name'])
            ->findOrFail($id);

        return Inertia::render('Sales/ShowSale', [
            'sale' => $sale,
        ]);
    }

    public function update(){}

    public function destroy(){}

    public function bulkDestroy(){}
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

    // 1. Reporte: Resumen Diario (Finanzas)
    public function reportDaily(Request $request)
    {
        $range = $this->getDateRange($request);

        $data = Sales::select(
        // Opción A: Usar convert_tz si tu servidor tiene las tablas de tiempo cargadas
        // Opción B (Más segura): Simplemente extraer la fecha si el campo ya está en hora local
            DB::raw('DATE(date_sales) as date'),
            DB::raw('SUM(total) as total'),
            DB::raw('COUNT(*) as transactions')
        )
            ->whereBetween('date_sales', $range)
            ->groupBy(DB::raw('DATE(date_sales)')) // Agrupamos explícitamente por el mismo valor
            ->orderBy('date', 'ASC')
            ->get();

        // Debug opcional para ti:
        // dd($data->toArray());

        return Inertia::render('Sales/Reports/DailySummary', [
            'reportData' => $data,
            'filters' => $request->only(['from', 'to'])
        ]);
    }

    // 2. Reporte: Libro de Ventas / Impuestos
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
}
