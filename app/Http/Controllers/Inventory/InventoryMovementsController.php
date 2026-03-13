<?php

namespace App\Http\Controllers\Inventory;

use App\Exports\InventoryExport;
use App\Exports\KardexExport;
use App\Http\Controllers\Controller;
use App\Models\BusinessConfig;
use App\Models\InventoryAdjustment;
use App\Models\InventoryLog;
use App\Models\InventoryMovements;
use App\Models\Products;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class InventoryMovementsController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        // 1. Preparamos la consulta base
        $query = Products::query()
            ->where('status', 'active')
            ->when($search, function ($q, $search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_code', 'like', "%{$search}%");
            });

        // 2. Lógica de Paginación Dinámica Inicial
        // Si el usuario no ha movido el selector de 'per_page', calculamos el default
        if (!$request->has('per_page')) {
            $totalCount = (clone $query)->count();
            // Si hay más de 20, ponemos 20. Si hay menos, ponemos el total para que no salga paginado.
            $perPage = ($totalCount > 20) ? 20 : max($totalCount, 1);
        } else {
            $perPage = $request->input('per_page');
        }

        // Validación de seguridad para perPage
        if (!is_numeric($perPage) || $perPage < 1) {
            $perPage = 20;
        }

        $inventory = $query->orderBy('stock', 'asc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render('Inventory/ListInventory', [
            'inventory' => $inventory,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage
            ]
        ]);
    }

    public function export(Request $request)
    {
        $all = $request->boolean('all'); // Recibe el flag de selección total
        $ids = $request->input('ids');
        $search = $request->input('search');

        $query = Products::query()->where('status', 'active');

        // Lógica de filtrado
        if ($all) {
            // Si es "Todo", aplicamos el filtro de búsqueda que tenía el usuario
            $query->when($search, function ($q, $search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_code', 'like', "%{$search}%");
            });
        } else {
            // Si no es todo, filtramos solo por los IDs seleccionados
            if (!$ids) return back();
            $query->whereIn('id_product', $ids);
        }

        $products = $query->get();

        // Configuración de BusinessConfig
        $config = BusinessConfig::first();
        $companyName = $config ? $config->company_name : 'Empresa';
        $safeName = str_replace(' ', '_', strtolower($companyName));
        $fileName = "inventario_{$safeName}_" . now()->format('Ymd_His') . ".xlsx";

        return Excel::download(new InventoryExport($products, $companyName), $fileName);
    }

    public function movements(Request $request)
    {
        $search = $request->input('search');
        $type = $request->input('type');

        $query = InventoryMovements::query()
            ->with(['product:id_product,product_name,product_code', 'user:id,name'])
            ->when($search, function ($q, $search) {
                $q->whereHas('product', function ($pq) use ($search) {
                    $pq->where('product_name', 'like', "%{$search}%")
                        ->orWhere('product_code', 'like', "%{$search}%");
                });
            })
            ->when($type, function ($q, $type) {
                $q->where('type', $type);
            });

        // Lógica dinámica inicial de paginación
        if (!$request->has('per_page')) {
            $totalCount = (clone $query)->count();
            $perPage = ($totalCount > 25) ? 25 : max($totalCount, 1);
        } else {
            $perPage = $request->input('per_page');
        }

        if (!is_numeric($perPage) || $perPage < 1) $perPage = 25;

        $movements = $query->orderBy('created_at', 'desc')
            ->paginate((int)$perPage)
            ->withQueryString();

        $products = Products::where('status', 'active')
            ->select('id_product', 'product_name', 'product_code')
            ->orderBy('product_name')
            ->get();

        return Inertia::render('Inventory/Reports/GlobalMovements', [
            'movements' => $movements,
            'products' => $products,
            'filters' => [
                'search' => $search,
                'per_page' => (int)$perPage,
                'type' => $type
            ]
        ]);
    }
    public function exportKardex(Request $request)
    {
        $all = $request->boolean('all');
        $ids = $request->input('ids');

        $query = InventoryMovements::with('product');

        if (!$all) {
            $query->whereIn('id_product', $ids);
        }

        $movements = $query->orderBy('id_product')
            ->orderBy('created_at', 'asc')
            ->orderBy('id_movement', 'asc')
            ->get();

        $config = BusinessConfig::first();
        $companyName = $config ? $config->company_name : 'Empresa';

        return Excel::download(new KardexExport($movements, $companyName), "kardex_" . now()->format('Ymd') . ".xlsx");
    }


    public function createAdjustment()
    {
        $products = Products::where('status', 'active')
            ->select('id_product', 'product_name', 'product_code', 'stock', 'sale_price')
            ->orderBy('product_name')
            ->get();

        return Inertia::render('Inventory/ManualAdjustment', [
            'products' => $products
        ]);
    }

    public function storeAdjustment(Request $request)
    {
        // 1. Validaciones actualizadas
        $request->validate([
            'operation_type'  => 'required|string|max:255',
            'kardex_date'     => 'required|date',
            'reason'          => 'required|string|max:255',
            'location'        => 'required|string|max:255',
            'contact_name'    => 'nullable|string|max:255',
            'document_type'   => 'nullable|string|max:255',
            'document_number' => 'nullable|string|max:255',
            'exchange_rate'   => 'nullable|numeric|min:0.0001',
            'status'          => 'required|in:draft,done',
            'internal_note'   => 'nullable|string', // Aceptamos la nota del chatter

            // Los items SOLO son obligatorios si vamos a VALIDAR (done) el documento
            'items'              => 'required_if:status,done|array',
            'items.*.id_product' => 'required_with:items|exists:products,id_product',
            'items.*.old_stock'  => 'required_with:items|numeric',
            'items.*.new_stock'  => 'required_with:items|numeric|min:0',
            'items.*.unit_cost'  => 'nullable|numeric|min:0',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $userId = Auth::id() ?? 1;
                $isDone = $request->status === 'done';

                $lastAdjustment = InventoryAdjustment::orderBy('id_adjustment', 'desc')->first();
                $nextId = $lastAdjustment ? $lastAdjustment->id_adjustment + 1 : 1;
                $referenceCode = 'AJU-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

                $adjustment = InventoryAdjustment::create([
                    'reference_code'  => $referenceCode,
                    'operation_type'  => $request->operation_type,
                    'kardex_date'     => $request->kardex_date,
                    'reason'          => $request->reason,
                    'location'        => $request->location,
                    'contact_name'    => $request->contact_name,
                    'document_type'   => $request->document_type,
                    'document_number' => $request->document_number,
                    'exchange_rate'   => $request->exchange_rate ?? 1.0000,
                    'status'          => $request->status,
                    'id_user'         => $userId,
                ]);

                // LOG 1: Creación de documento
                InventoryLog::create([
                    'id_adjustment' => $adjustment->id_adjustment,
                    'id_user'       => $userId,
                    'action'        => 'Documento Creado',
                    'field_changed' => 'Estado',
                    'new_value'     => $request->status,
                ]);

                // LOG 2: NOTA INTERNA (Si el usuario escribió algo en el chatter)
                if ($request->filled('internal_note')) {
                    InventoryLog::create([
                        'id_adjustment' => $adjustment->id_adjustment,
                        'id_user'       => $userId,
                        'action'        => 'Nota',
                        'notes'         => $request->internal_note
                    ]);
                }

                // 4. PROCESAMOS LOS PRODUCTOS (Solo si enviaron alguno)
                if ($request->has('items') && is_array($request->items)) {
                    foreach ($request->items as $item) {
                        $product = Products::where('id_product', $item['id_product'])->lockForUpdate()->first();

                        $oldStock = (float) $product->stock;
                        $newStock = (float) $item['new_stock'];
                        $difference = $newStock - $oldStock;

                        if ($difference == 0) continue;

                        InventoryLog::create([
                            'id_adjustment' => $adjustment->id_adjustment,
                            'id_user'       => $userId,
                            'action'        => 'Modificación',
                            'field_changed' => 'Stock: ' . $product->product_name,
                            'old_value'     => $oldStock,
                            'new_value'     => $newStock,
                        ]);

                        if ($isDone) {
                            $quantity = abs($difference);
                            $unitCost = $difference > 0 ? ($item['unit_cost'] ?? $product->sale_price ?? 0) : ($product->sale_price ?? 0);
                            $totalCost = $quantity * $unitCost;

                            $product->update(['stock' => $newStock]);

                            InventoryMovements::create([
                                'id_product'     => $product->id_product,
                                'id_user'        => $userId,
                                'type'           => substr($request->operation_type, 0, 2),
                                'kardex_date'    => $request->kardex_date,
                                'quantity'       => $difference,
                                'unit_cost'      => $unitCost,
                                'total_cost'     => $totalCost,
                                'balance'        => $newStock,
                                'reference_type' => InventoryAdjustment::class,
                                'reference_id'   => $adjustment->id_adjustment,
                                'notes'          => "Ref: {$referenceCode} | " . $request->reason
                            ]);
                        }
                    }
                }
            });

            $mensaje = $request->status === 'done'
                ? 'Ajuste de inventario VALIDADO y Kardex actualizado con éxito.'
                : 'Borrador / Nota guardados correctamente.';

            return redirect()->route('inventory.index')->with('success', $mensaje);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al guardar: ' . $e->getMessage()]);
        }
    }
}
