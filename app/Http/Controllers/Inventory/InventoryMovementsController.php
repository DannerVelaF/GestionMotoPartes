<?php

namespace App\Http\Controllers\Inventory;

use App\Exports\InventoryExport;
use App\Exports\KardexExport;
use App\Http\Controllers\Controller;
use App\Models\BusinessConfig;
use App\Models\InventoryAdjustment;
use App\Models\InventoryLog;
use App\Models\InventoryMovements;
use App\Models\ProductCategory;
use App\Models\Products;
use App\Models\PurchaseOrder;
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
        if (!$request->has('per_page')) {
            $totalCount = (clone $query)->count();
            $perPage = ($totalCount > 20) ? 20 : max($totalCount, 1);
        } else {
            $perPage = $request->input('per_page');
        }

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
        $all = $request->boolean('all');
        $ids = $request->input('ids');
        $search = $request->input('search');

        $query = Products::query()->where('status', 'active');

        if ($all) {
            $query->when($search, function ($q, $search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_code', 'like', "%{$search}%");
            });
        } else {
            if (!$ids) return back();
            $query->whereIn('id_product', $ids);
        }

        $products = $query->get();

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

    public function adjustments(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 25);

        $query = \App\Models\InventoryAdjustment::query()
            ->with(['user:id,name', 'operationType', 'locationSource', 'locationDestination', "source"])
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    // 1. Búsqueda en la cabecera del ajuste
                    $sub->where('reference_code', 'like', "%{$search}%")
                        ->orWhere('contact_name', 'like', "%{$search}%")
                        ->orWhere('reason', 'like', "%{$search}%")
                        ->orWhere('document_number', 'like', "%{$search}%")

                        // 2. Búsqueda por Documento Origen (Si es una OC)
                        // Usamos la relación 'source' que es polimórfica en tu sistema
                        ->orWhereHasMorph('source', [\App\Models\PurchaseOrder::class], function ($query) use ($search) {
                            $query->where('po_code', 'like', "%{$search}%")
                                // 3. Búsqueda por nombre del Proveedor dentro de la OC
                                ->orWhereHas('supplier', function($s) use ($search) {
                                    $s->where('company_name', 'like', "%{$search}%");
                                });
                        })

                        // 4. Búsqueda por Producto dentro del ajuste (por si buscas por código de producto)
                        ->orWhereHas('details.product', function ($pq) use ($search) {
                            $pq->where('product_name', 'like', "%{$search}%")
                                ->orWhere('product_code', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('created_at', 'desc');

        $adjustments = $query->paginate((int)$perPage)->withQueryString();

        return Inertia::render('Inventory/Adjustments/AdjustmentsList', [
            'adjustments' => $adjustments,
            'filters' => ['search' => $search, 'per_page' => (int)$perPage]
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
            'internal_note'   => 'nullable|string',
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

                InventoryLog::create([
                    'id_adjustment' => $adjustment->id_adjustment,
                    'id_user'       => $userId,
                    'action'        => 'Documento Creado',
                    'field_changed' => 'Estado',
                    'new_value'     => $request->status,
                ]);

                if ($request->filled('internal_note')) {
                    InventoryLog::create([
                        'id_adjustment' => $adjustment->id_adjustment,
                        'id_user'       => $userId,
                        'action'        => 'Nota',
                        'notes'         => $request->internal_note
                    ]);
                }

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

    public function editAdjustment($id)
    {
        $adjustment = InventoryAdjustment::with([
            'operationType',
            'locationSource',
            'locationDestination',
            'details.product',
            'logs.user'
        ])->findOrFail($id);

        return Inertia::render('Inventory/InventoryAdjustmentForm', [
            'adjustment'     => $adjustment,
            'products'       => \App\Models\Products::where('status', 'active')
                ->select('id_product', 'product_name', 'product_code', 'stock')->get(),
            // ✅ ENVIAR PROVEEDORES
            'suppliers'      => \App\Models\Supplier::select('id_supplier', 'company_name', 'ruc')->get(),
            // ✅ ENVIAR ÓRDENES DE COMPRA (Como documentos origen disponibles)
            'purchaseOrders' => \App\Models\PurchaseOrder::select('id_purchase_order', 'po_code', 'id_supplier')
                ->orderBy('created_at', 'desc')->take(50)->get(),
            'categories'     => \App\Models\ProductCategory::where('status', 'active')->get(),
            'operationTypes' => \App\Models\InventoryOperationType::all(),
            'locations'      => \App\Models\InventoryLocation::all(),
        ]);
    }

    public function checkAdjustment(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $adjustment = InventoryAdjustment::findOrFail($id);

            if ($adjustment->status !== 'draft') {
                return back()->withErrors(['error' => 'El documento ya no está en estado Borrador.']);
            }

            $items = $request->input('items', []);
            $totalQty = collect($items)->sum(fn($item) => (float) ($item['quantity'] ?? 0));

            if ($totalQty <= 0) {
                return back()->withErrors(['error' => 'Debe ingresar la cantidad a procesar en al menos un producto.']);
            }

            // Guardar detalles
            $this->syncAdjustmentDetails($adjustment, $items);

            // Actualizamos cabecera (incluyendo la Fecha Kardex digitada)
            $adjustment->update([
                'status'          => 'ready',
                'kardex_date'     => $request->input('kardex_date', $adjustment->kardex_date),
                'document_type'   => $request->input('document_type'),
                'document_number' => $request->input('document_number'),
            ]);

            InventoryLog::create([
                'id_adjustment' => $adjustment->id_adjustment,
                'id_user'       => Auth::id(),
                'action'        => 'Comprobación',
                'field_changed' => 'Estado',
                'old_value'     => 'Borrador',
                'new_value'     => 'Listo',
                'notes'         => 'Cantidades comprobadas. Listo para validar.'
            ]);

            return back()->with('success', 'Cantidades comprobadas correctamente.');
        });
    }

    public function validateAdjustment(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            // Cargamos el ajuste con sus detalles y la relación polimórfica 'source'
            $adjustment = InventoryAdjustment::with(['details', 'source'])->findOrFail($id);
            $userId = Auth::id();

            if ($adjustment->status === 'done') throw new \Exception("Este movimiento ya ha sido validado.");
            if ($adjustment->status === 'draft') throw new \Exception("Primero debe 'Comprobar' el documento.");

            $items = $request->input('items', []);
            $totalQty = collect($items)->sum(fn($item) => (float) ($item['quantity'] ?? 0));

            if ($totalQty <= 0) throw new \Exception("No hay cantidades válidas.");

            // Sincronizamos detalles antes de procesar stock
            $this->syncAdjustmentDetails($adjustment, $items);

            $kardexDate = $request->input('kardex_date', now()->format('Y-m-d'));

            foreach ($items as $item) {
                $qtyDone = (float) ($item['quantity'] ?? 0);
                if ($qtyDone <= 0) continue;

                $product = Products::findOrFail($item['id_product']);
                $product->increment('stock', $qtyDone);

                // Registro en Kardex
                InventoryMovements::create([
                    'id_product'     => $product->id_product,
                    'id_user'        => $userId,
                    'type'           => 'IN',
                    'kardex_date'    => $kardexDate,
                    'quantity'       => $qtyDone,
                    'unit_cost'      => $item['unit_cost'] ?? 0,
                    'total_cost'     => $qtyDone * ($item['unit_cost'] ?? 0),
                    'balance'        => $product->stock,
                    'reference_type' => get_class($adjustment),
                    'reference_id'   => $adjustment->id_adjustment,
                    'notes'          => "Validado en: {$adjustment->reference_code}"
                ]);

                // --- ACTUALIZACIÓN DE CANTIDAD RECIBIDA EN LA OC ---
                // Verificamos si el ajuste tiene una Orden de Compra vinculada
                if ($adjustment->source instanceof \App\Models\PurchaseOrder) {
                    $purchaseOrder = $adjustment->source;

                    // Buscamos la línea específica del detalle de la OC para este producto
                    $poDetail = $purchaseOrder->details()
                        ->where('id_product', $item['id_product'])
                        ->first();

                    if ($poDetail) {
                        $poDetail->increment('received_quantity', $qtyDone);
                    }
                }
            }

            // Actualizamos estado del movimiento de almacén
            $adjustment->update([
                'status'          => 'done',
                'kardex_date'     => $kardexDate,
                'document_type'   => $request->input('document_type'),
                'document_number' => $request->input('document_number'),
            ]);

            // Verificamos si la OC debe pasar a estado "received" (opcional)
            if ($adjustment->source instanceof \App\Models\PurchaseOrder) {
                $purchaseOrder = $adjustment->source->fresh(['details']);
                $allReceived = $purchaseOrder->details->every(function ($detail) {
                    // Si es servicio, lo ignoramos; si es producto, comparamos cantidades
                    return $detail->is_service || ($detail->received_quantity >= $detail->quantity);
                });

                if ($allReceived) {
                    $purchaseOrder->update(['status' => 'received']);
                }
            }

            InventoryLog::create([
                'id_adjustment' => $adjustment->id_adjustment,
                'id_user'       => $userId,
                'action'        => 'Documento Validado',
                'field_changed' => 'Estado',
                'old_value'     => 'Listo',
                'new_value'     => 'Realizado',
            ]);

            return redirect()->back()->with('success', 'Movimiento validado, stock y OC actualizados.');
        });
    }

    // Asegúrate de tener este método para guardar las notas del chatter
    public function addNote(Request $request, $id)
    {
        $request->validate(['internal_note' => 'required|string']);

        InventoryLog::create([
            'id_adjustment' => $id,
            'id_user'       => Auth::id(),
            'action'        => 'Nota',
            'notes'         => $request->internal_note
        ]);

        return back()->with('success', 'Nota agregada.');
    }

    /**
     * Función auxiliar para guardar las filas de la tabla
     */
    private function syncAdjustmentDetails(InventoryAdjustment $adjustment, array $items)
    {
        $incomingIds = collect($items)->pluck('id_product')->filter(fn($id) => $id !== 0)->toArray();

        // 1. Eliminar los productos quitados
        $adjustment->details()->whereNotIn('id_product', $incomingIds)->delete();

        // 2. Actualizar o crear productos
        foreach ($items as $item) {
            if (empty($item['id_product']) || $item['id_product'] === 0) continue;

            $adjustment->details()->updateOrCreate(
                ['id_product' => $item['id_product']],
                [
                    'demand'    => $item['demand'] ?? 0,
                    'quantity'  => $item['quantity'] ?? 0,
                    'unit_cost' => $item['unit_cost'] ?? 0,
                ]
            );
        }
    }

    public function updateAdjustment(Request $request, $id)
    {
        $adjustment = InventoryAdjustment::findOrFail($id);

        if ($adjustment->status === 'done') {
            $request->validate([
                'kardex_date'     => 'required|date',
                'document_number' => 'nullable|string|max:255',
                'contact_name'    => 'nullable|string|max:255',
                'source_id'       => 'nullable|integer',
            ]);

            $adjustment->fill($request->only(['kardex_date', 'document_number', 'contact_name']));

            // Manejo de la relación polimórfica
            if ($request->filled('source_id')) {
                $adjustment->source_document_type = \App\Models\PurchaseOrder::class;
                $adjustment->source_document_id   = $request->source_id;
            } else {
                $adjustment->source_document_type = null;
                $adjustment->source_document_id   = null;
            }

            $changes = $adjustment->getDirty();
            $original = $adjustment->getOriginal();

            if (!empty($changes)) {
                $fieldNames = [
                    'kardex_date'     => 'Fecha Kardex',
                    'contact_name'    => 'Proveedor/Contacto',
                    'document_number' => 'N° Documento',
                    'source_document_id' => 'Documento Origen'
                ];

                foreach ($changes as $field => $newValue) {
                    if (array_key_exists($field, $fieldNames)) {

                        // ✅ Lógica para que el historial imprima el CÓDIGO de la OC, no el ID
                        $oldVal = $original[$field] ?? 'Vacío';
                        $newVal = $newValue ?? 'Vacío';

                        if ($field === 'source_document_id' && $newValue !== null) {
                            $po = \App\Models\PurchaseOrder::find($newValue);
                            $newVal = $po ? $po->po_code : $newValue;
                        }

                        InventoryLog::create([
                            'id_adjustment' => $adjustment->id_adjustment,
                            'id_user'       => Auth::id(),
                            'action'        => 'Actualización',
                            'field_changed' => $fieldNames[$field],
                            'old_value'     => $oldVal,
                            'new_value'     => $newVal,
                        ]);
                    }
                }
                $adjustment->save();
            }
            return back()->with('success', 'Actualizado correctamente.');
        }
        return back()->withErrors(['error' => 'No se puede editar.']);
    }
}
