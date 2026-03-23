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

        $query = Products::query()
            ->where('status', 'active')
            ->when($search, function ($q, $search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_code', 'like', "%{$search}%");
            });

        if (!$request->has('per_page')) {
            $totalCount = (clone $query)->count();
            $perPage = ($totalCount > 20) ? 20 : max($totalCount, 1);
        } else {
            $perPage = $request->input('per_page');
        }

        if (!is_numeric($perPage) || $perPage < 1) $perPage = 20;

        $inventory = $query->orderBy('stock', 'asc')
            ->paginate((int)$perPage)
            ->withQueryString();

        return Inertia::render('Inventory/ListInventory', [
            'inventory' => $inventory,
            'filters' => ['search' => $search, 'per_page' => $perPage]
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
            'filters' => ['search' => $search, 'per_page' => (int)$perPage, 'type' => $type]
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
                    $sub->where('reference_code', 'like', "%{$search}%")
                        ->orWhere('contact_name', 'like', "%{$search}%")
                        ->orWhere('reason', 'like', "%{$search}%")
                        ->orWhere('document_number', 'like', "%{$search}%")
                        ->orWhereHasMorph('source', [\App\Models\PurchaseOrder::class], function ($query) use ($search) {
                            $query->where('po_code', 'like', "%{$search}%")
                                ->orWhereHas('supplier', function ($s) use ($search) {
                                    $s->where('company_name', 'like', "%{$search}%");
                                });
                        })
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
        return Inertia::render('Inventory/InventoryAdjustmentForm', [
            'adjustment'     => null,
            'products'       => \App\Models\Products::where('status', 'active')
                ->select('id_product', 'product_name', 'product_code', 'stock', 'sale_price', 'purchase_price')
                ->orderBy('product_name')->get(),
            'suppliers'      => \App\Models\Supplier::select('id_supplier', 'company_name', 'ruc')
                ->orderBy('company_name')->get(),
            'purchaseOrders' => \App\Models\PurchaseOrder::select('id_purchase_order', 'po_code', 'id_supplier')
                ->orderBy('created_at', 'desc')->take(50)->get(),
            'operationTypes' => \App\Models\InventoryOperationType::all(),
            'locations'      => \App\Models\InventoryLocation::all(),
            'categories'     => \App\Models\ProductCategory::where('status', 'active')->get(),
        ]);
    }

    public function storeAdjustment(Request $request)
    {
        $request->validate([
            'id_operation_type'       => 'required|integer',
            'id_location_source'      => 'required|integer',
            'id_location_destination' => 'required|integer',
            'kardex_date'             => 'required|date',
            'contact_name'            => 'nullable|string|max:255',
            'document_type'           => 'nullable|string|max:255',
            'document_number'         => 'nullable|string|max:255',
            'reason'                  => 'nullable|string|max:255',
            'source_id'               => 'nullable|integer',
            'source_type'             => 'nullable|string',
            'items'                   => 'required|array|min:1',
            'items.*.id_product'      => 'required|integer',
            'items.*.demand'          => 'nullable|numeric|min:0',
            'items.*.quantity'        => 'nullable|numeric|min:0',
            'items.*.unit_cost'       => 'nullable|numeric|min:0',
        ]);

        try {
            // ✅ Capturamos el resultado de la transacción en una variable
            $nuevoAjuste = DB::transaction(function () use ($request) {
                $userId = Auth::id() ?? 1;

                $operationType = \App\Models\InventoryOperationType::find($request->id_operation_type);
                $prefix = $operationType && $operationType->sequence_prefix ? $operationType->sequence_prefix : 'AJU/';

                $lastAdjustment = \App\Models\InventoryAdjustment::where('id_operation_type', $request->id_operation_type)
                    ->orderBy('id_adjustment', 'desc')
                    ->first();

                $nextId = $lastAdjustment ? $lastAdjustment->id_adjustment + 1 : 1;
                $separator = str_ends_with($prefix, '/') || str_ends_with($prefix, '-') ? '' : '/';
                $referenceCode = $prefix . $separator . str_pad($nextId, 5, '0', STR_PAD_LEFT);

                $adjustment = \App\Models\InventoryAdjustment::create([
                    'reference_code'          => $referenceCode,
                    'id_operation_type'       => $request->id_operation_type,
                    'id_location_source'      => $request->id_location_source,
                    'id_location_destination' => $request->id_location_destination,
                    'kardex_date'             => $request->kardex_date,
                    'reason'                  => $request->reason ?? 'Ajuste Manual',
                    'contact_name'            => $request->contact_name,
                    'document_type'           => $request->document_type,
                    'document_number'         => $request->document_number,
                    'exchange_rate'           => 1.0000,
                    'status'                  => 'draft',
                    'id_user'                 => $userId,
                    'source_document_id'      => $request->source_id,
                    'source_document_type'    => $request->source_type,
                ]);

                \App\Models\InventoryLog::create([
                    'id_adjustment' => $adjustment->id_adjustment,
                    'id_user'       => $userId,
                    'action'        => 'Documento Creado',
                    'field_changed' => 'Estado',
                    'new_value'     => 'Borrador',
                ]);

                $this->syncAdjustmentDetails($adjustment, $request->items);

                return $adjustment;
            });

            return redirect()->route('inventory.adjustment.edit', $nuevoAjuste->id_adjustment)
                ->with('success', 'Borrador de ajuste creado correctamente.');

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
                ->select('id_product', 'product_name', 'product_code', 'stock', "sale_price", "purchase_price")->get(),
            'suppliers'      => \App\Models\Supplier::select('id_supplier', 'company_name', 'ruc')->get(),
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

            // ✅ VALIDACIÓN BACKEND: Evitar excesos de demanda
            foreach ($items as $item) {
                $demand = (float) ($item['demand'] ?? 0);
                $qty = (float) ($item['quantity'] ?? 0);
                if ($demand > 0 && $qty > $demand) {
                    return back()->withErrors(['error' => 'La cantidad ingresada no puede ser mayor a la demanda estipulada.']);
                }
            }

            $this->syncAdjustmentDetails($adjustment, $items);

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
            $adjustment = InventoryAdjustment::with(['details', 'source', 'operationType'])->findOrFail($id);
            $userId = Auth::id();

            if ($adjustment->status === 'done') {
                return back()->withErrors(['error' => 'Este movimiento ya ha sido validado.']);
            }

            if ($adjustment->status === 'draft') {
                return back()->withErrors(['error' => "Primero debe 'Comprobar' el documento antes de validarlo."]);
            }

            $items = $request->input('items', []);
            $totalQty = collect($items)->sum(fn($item) => (float) ($item['quantity'] ?? 0));

            if ($totalQty <= 0) {
                return back()->withErrors(['error' => 'No hay cantidades válidas para procesar.']);
            }

            $opCode = $adjustment->operationType ? $adjustment->operationType->code : 'IN';

            // ✅ 1. TODAS LAS VALIDACIONES OCURREN AQUÍ (Antes de tocar la BD)
            foreach ($items as $item) {
                $qtyDone = (float) ($item['quantity'] ?? 0);
                if ($qtyDone <= 0) continue;

                $demand = (float) ($item['demand'] ?? 0);

                // A. Validar que no supere la demanda
                if ($demand > 0 && $qtyDone > $demand) {
                    return back()->withErrors(['error' => 'La cantidad ingresada no puede ser mayor a la demanda estipulada.']);
                }

                // B. Validar que haya stock suficiente (Solo si es salida)
                if ($opCode === 'OUT') {
                    $product = Products::findOrFail($item['id_product']);
                    if ($product->stock < $qtyDone) {
                        return back()->withErrors(['error' => "La cantidad a retirar ({$qtyDone}) supera el stock disponible ({$product->stock}) para el producto: {$product->product_name}."]);
                    }
                }
            }

            // ✅ 2. SI TODO ESTÁ PERFECTO, EMPEZAMOS A GUARDAR EN LA BD
            $this->syncAdjustmentDetails($adjustment, $items);

            $kardexDate = $request->input('kardex_date', now()->format('Y-m-d'));

            foreach ($items as $item) {
                $qtyDone = (float) ($item['quantity'] ?? 0);
                if ($qtyDone <= 0) continue;

                $product = Products::findOrFail($item['id_product']);

                // Solo descontamos o incrementamos, ya sabemos que es seguro
                if ($opCode === 'OUT') {
                    $product->decrement('stock', $qtyDone);
                } else {
                    $product->increment('stock', $qtyDone);
                }

                $currentStock = $product->fresh()->stock;

                InventoryMovements::create([
                    'id_product'     => $product->id_product,
                    'id_user'        => $userId,
                    'type'           => $opCode,
                    'kardex_date'    => $kardexDate,
                    'quantity'       => $qtyDone,
                    'unit_cost'      => $item['unit_cost'] ?? 0,
                    'total_cost'     => $qtyDone * ($item['unit_cost'] ?? 0),
                    'balance'        => $currentStock,
                    'reference_type' => get_class($adjustment),
                    'reference_id'   => $adjustment->id_adjustment,
                    'notes'          => "Validado en: {$adjustment->reference_code}"
                ]);

                // Actualizar OC
                if ($adjustment->source instanceof \App\Models\PurchaseOrder) {
                    $poDetail = $adjustment->source->details()
                        ->where('id_product', $item['id_product'])
                        ->first();

                    if ($poDetail) {
                        if ($opCode === 'OUT') {
                            $poDetail->decrement('received_quantity', $qtyDone);
                        } else {
                            $poDetail->increment('received_quantity', $qtyDone);
                        }
                    }
                }

                // Actualizar Ventas
                if ($adjustment->source instanceof \App\Models\Sales) {
                    $saleDetail = $adjustment->source->details()
                        ->where('id_product', $item['id_product'])
                        ->first();

                    if ($saleDetail) {
                        if ($opCode === 'IN') {
                            $saleDetail->decrement('delivered_quantity', $qtyDone);
                        } else {
                            $saleDetail->increment('delivered_quantity', $qtyDone);
                        }
                    }
                }
            }

            $adjustment->update([
                'status'          => 'done',
                'kardex_date'     => $kardexDate,
                'document_type'   => $request->input('document_type'),
                'document_number' => $request->input('document_number'),
            ]);

            if ($adjustment->source instanceof \App\Models\PurchaseOrder) {
                $purchaseOrder = $adjustment->source->fresh(['details']);
                $allReceived = $purchaseOrder->details->every(function ($detail) {
                    return $detail->is_service || ($detail->received_quantity >= $detail->quantity);
                });

                if ($allReceived) {
                    $purchaseOrder->update(['status' => 'received']);
                } else {
                    $purchaseOrder->update(['status' => 'sent']);
                }
            }

            if ($adjustment->source instanceof \App\Models\Sales) {
                $sale = $adjustment->source->fresh(['details']);
                $allDelivered = $sale->details->every(function ($detail) {
                    $isService = $detail->is_service ?? false;
                    return $isService || ($detail->delivered_quantity >= $detail->quantity);
                });

                if ($allDelivered) {
                    $sale->update(['status' => 'completed']);
                } else {
                    $sale->update(['status' => 'pending']);
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

            return redirect()->back()->with('success', 'Movimiento validado, stock y documentos vinculados actualizados.');
        });
    }
    public function createReturn(Request $request, $id)
    {
        // ✅ 1. Validamos que nos envíen el array de productos a devolver
        $request->validate([
            'return_items'              => 'required|array',
            'return_items.*.id_product' => 'required|integer',
            'return_items.*.quantity'   => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $id) {
            $originalAdjustment = InventoryAdjustment::with(['details', 'operationType.returnType'])->findOrFail($id);

            if ($originalAdjustment->status !== 'done') {
                return back()->withErrors(['error' => 'Solo se pueden devolver movimientos que ya están Realizados.']);
            }

            $returnOperationType = $originalAdjustment->operationType->returnType;

            if (!$returnOperationType) {
                return back()->withErrors(['error' => 'Este tipo de operación no tiene configurada una operación de devolución.']);
            }

            // ✅ 2. Filtramos para asegurarnos de que al menos van a devolver 1 producto mayor a 0
            $itemsToReturn = collect($request->return_items)->filter(function ($item) {
                return (float)$item['quantity'] > 0;
            });

            if ($itemsToReturn->isEmpty()) {
                return back()->withErrors(['error' => 'Debe especificar al menos una cantidad mayor a 0 para devolver.']);
            }

            $prefix = $returnOperationType->sequence_prefix ? $returnOperationType->sequence_prefix : 'RET/';

            $lastAdjustment = InventoryAdjustment::where('id_operation_type', $returnOperationType->id_operation_type)
                ->orderBy('id_adjustment', 'desc')
                ->first();

            $nextId = $lastAdjustment ? $lastAdjustment->id_adjustment + 1 : 1;
            $separator = str_ends_with($prefix, '/') || str_ends_with($prefix, '-') ? '' : '/';
            $referenceCode = $prefix . $separator . str_pad($nextId, 5, '0', STR_PAD_LEFT);

            $newAdjustment = new InventoryAdjustment();
            $newAdjustment->reference_code          = $referenceCode;
            $newAdjustment->id_operation_type       = $returnOperationType->id_operation_type;
            $newAdjustment->id_location_source      = $originalAdjustment->id_location_destination;
            $newAdjustment->id_location_destination = $originalAdjustment->id_location_source;
            $newAdjustment->kardex_date             = now()->format('Y-m-d');
            $newAdjustment->reason                  = 'Devolución de ' . $originalAdjustment->reference_code;
            $newAdjustment->contact_name            = $originalAdjustment->contact_name;
            $newAdjustment->document_type           = $originalAdjustment->document_type;
            $newAdjustment->document_number         = $originalAdjustment->document_number;
            $newAdjustment->exchange_rate           = $originalAdjustment->exchange_rate;
            $newAdjustment->status                  = 'draft';
            $newAdjustment->id_user                 = Auth::id() ?? 1;
            $newAdjustment->source_document_id      = $originalAdjustment->source_document_id;
            $newAdjustment->source_document_type    = $originalAdjustment->source_document_type;
            $newAdjustment->save();

            InventoryLog::create([
                'id_adjustment' => $newAdjustment->id_adjustment,
                'id_user'       => Auth::id() ?? 1,
                'action'        => 'Documento Creado',
                'field_changed' => 'Estado',
                'new_value'     => 'Borrador',
                'notes'         => 'Creado a partir de la devolución de ' . $originalAdjustment->reference_code
            ]);

            // ✅ 3. Solo copiamos los productos que el usuario seleccionó en el modal
            foreach ($itemsToReturn as $itemData) {
                // Buscamos el detalle original para copiar su costo unitario
                $originalDetail = $originalAdjustment->details->where('id_product', $itemData['id_product'])->first();

                if ($originalDetail) {
                    $newAdjustment->details()->create([
                        'id_product' => $itemData['id_product'],
                        'demand'     => $itemData['quantity'], // La demanda ahora es lo que el usuario digitó en el modal
                        'quantity'   => 0,
                        'unit_cost'  => $originalDetail->unit_cost,
                    ]);
                }
            }

            return redirect()->route('inventory.adjustment.edit', $newAdjustment->id_adjustment)
                ->with('success', 'Borrador de devolución creado. Confirme las cantidades a devolver.');
        });
    }
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

    private function syncAdjustmentDetails(InventoryAdjustment $adjustment, array $items)
    {
        $incomingIds = collect($items)->pluck('id_product')->filter(fn($id) => $id !== 0)->toArray();

        $adjustment->details()->whereNotIn('id_product', $incomingIds)->delete();

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
