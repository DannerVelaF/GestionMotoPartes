<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Http\Services\Sales\SalesService;
use App\Models\BusinessConfig;
use App\Models\Products;
use App\Models\Sales;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesController extends Controller
{
    protected $service;

    public function __construct(SalesService $service){
        $this->service = $service;
    }


    public function index(){
        return Inertia::render('Sales/ListSales');
    }
    public function create()
    {
        $products = Products::select('id_product', 'product_name', 'product_code', 'sale_price')
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
            return redirect()->back()->with([
                'saleId' => $sale->id_sales,
                'success' => 'Venta registrada correctamente.'
            ]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al registrar venta: ' . $e->getMessage()]);
        }
    }

    public function show(){

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
}
