<?php

namespace App\Http\Controllers\Receipt;

use App\Enums\DocumentType;
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
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ReceiptController extends Controller
{

    protected $service;

    public function __construct(ReceiptService $service){
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
        if ($groupBy === 'supplier') {
            $query->join('suppliers', 'receipts.id_supplier', '=', 'suppliers.id_supplier')
                ->orderBy('suppliers.company_name', 'asc')
                ->select('receipts.*');
        } elseif ($groupBy === 'document_type') {
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
        // 1. Validación
        $validated = $request->validate([
            'id_supplier'          => 'required|exists:suppliers,id_supplier',
            'document_type'        => ['required', Rule::enum(DocumentType::class)],
            'series'               => 'required|string|max:10',
            'number'               => 'required|string|max:20',
            'issue_date'           => 'required|date',
            'file'                 => 'nullable|file|mimes:pdf,jpg,png,jpeg|max:5120',
            'details'              => 'required|array|min:1',
            'details.*.id_product' => 'required|exists:products,id_product',
            'details.*.quantity'   => 'required|numeric|min:0.01',
            'details.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            // 2. Delegar lógica al servicio
            $receipt = $this->service->createReceipt($validated);

            // 3. Redireccionar al Show del registro creado
            return to_route('receipts.show', $receipt->id_receipt)
                ->with('success', 'Comprobante registrado correctamente.');

        } catch (\Exception $e) {
            Log::error('Error creating receipt: ' . $e->getMessage());
            // Si el servicio lanza excepción, el archivo (si se subió) debería gestionarse en el catch del servicio o aquí.
            // Gracias a la transacción DB, la base de datos queda limpia.
            return back()->withErrors(['error' => 'Error al guardar: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        // Cargamos el recibo con sus detalles y la información del producto asociado
        // Usamos findOrFail directamente o a través del servicio si tienes un método getByIdWithRelations
        $receipt = Receipt::with(['details.product', 'supplier'])->findOrFail($id);

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
            $this->service->deleteReceipt($id);
            return to_route('receipts.index')->with('success', 'Comprobante eliminado.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'No se pudo eliminar el comprobante.']);
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
}
