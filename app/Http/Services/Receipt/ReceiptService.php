<?php

namespace App\Http\Services\Receipt;

use App\Enums\DocumentType;
use App\Http\Repositories\Eloquent\Receipt\ReceiptRepository;
use App\Http\Services\BaseService;
use App\Http\Services\Inventory\InventoryService;
use App\Models\InventoryMovements;
use App\Models\Products;
use App\Models\Receipt;
use App\Models\ReceiptLog;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReceiptService extends BaseService
{
    protected $inventoryService;

    public function __construct(ReceiptRepository $model, InventoryService $inventoryService)
    {
        parent::__construct($model);
        $this->inventoryService = $inventoryService;
    }

    public function createReceipt(array $data)
    {
        return DB::transaction(function () use ($data) {
            $path = null;
            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                $path = $data['file']->store('receipts', 'public');
            }

            $issueDate = Carbon::parse($data['issue_date']);
            $baseImponible = collect($data['details'])->sum(fn($i) => (float)$i['quantity'] * (float)$i['unit_price']);
            $totalAmount = $baseImponible * 1.18;

            $receipt = $this->repo->create([
                'id_supplier'   => $data['id_supplier'],
                'id_purchase_order' => $data['id_purchase_order'] ?? null,
                'document_type' => $data['document_type'],
                'currency'      => $data['currency'],
                'exchange_rate' => $data['exchange_rate'],
                'series'        => strtoupper($data['series']),
                'number'        => $data['number'],
                'issue_date'    => $issueDate,
                'glosa'         => $data['glosa'] ?? null,
                'total_amount'  => $totalAmount,
                'receipt_path'  => $path,
            ]);

            $isUSD = $data['currency'] === 'USD';
            $exchangeRate = (float) $data['exchange_rate'];

            foreach ($data['details'] as $detail) {
                $qty = (float)$detail['quantity'];
                $price = (float)$detail['unit_price'];
                $isService = $detail['is_service'] ?? false;
                $idProduct = $isService ? null : $detail['id_product'];

                $receipt->details()->create([
                    'quantity'    => $qty,
                    'unit_price'  => $price,
                    'subtotal'    => $qty * $price,
                    'id_product'  => $idProduct,
                    'description' => $isService ? ($detail['description'] ?? 'Servicio') : null,
                ]);

                // ✅ LÓGICA DE ORDEN DE COMPRA: Aumentar billed_quantity
                if ($receipt->id_purchase_order) {
                    $this->updateBilledQuantity(
                        $receipt->id_purchase_order,
                        $idProduct,
                        $qty,
                        $isService ? ($detail['description'] ?? null) : null
                    );
                }

                if (!$isService && !empty($idProduct)) {
                    $kardexPrice = $isUSD ? ($price * $exchangeRate) : $price;
                    $this->inventoryService->registerMovement(
                        $idProduct, $qty, 'purchase', $kardexPrice, $receipt,
                        "Ingreso por Compra {$receipt->series}-{$receipt->number}", $issueDate
                    );
                }
            }
            return $receipt;
        });
    }


    public function updateReceipt(array $data, $id)
    {
        return DB::transaction(function () use ($data, $id) {
            $receipt = Receipt::findOrFail($id);
            $originalAttributes = $receipt->getAttributes();

            // 1. Manejo de archivos
            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                if ($receipt->receipt_path) {
                    Storage::disk('public')->delete($receipt->receipt_path);
                }
                $data['receipt_path'] = $data['file']->store('receipts', 'public');
            }

            // 2. REVERSIÓN DE ESTADOS ANTERIORES
            // 2.1. Revertir cantidades facturadas en la Orden de Compra (si existe)
            if ($receipt->id_purchase_order) {
                foreach ($receipt->details as $oldDetail) {
                    $this->updateBilledQuantity(
                        $receipt->id_purchase_order,
                        $oldDetail->id_product,
                        -$oldDetail->quantity, // Restamos para revertir el aumento previo
                        $oldDetail->description
                    );
                }
            }

            // 2.2. Revertir stock físico y eliminar movimientos de inventario
            foreach ($receipt->details as $oldDetail) {
                if ($oldDetail->id_product && $oldDetail->product) {
                    $oldDetail->product->decrement('stock', $oldDetail->quantity);
                }
            }

            InventoryMovements::where('reference_id', $receipt->id_receipt)
                ->where('reference_type', Receipt::class)
                ->delete();

            // 2.3. Limpiar detalles antiguos
            $receipt->details()->delete();

            // 3. PREPARAR DATOS Y ACTUALIZAR CABECERA
            $issueDate = Carbon::parse($data['issue_date']);
            $baseImponible = collect($data['details'])->sum(fn($i) => (float)($i['quantity'] ?? 0) * (float)($i['unit_price'] ?? 0));
            $newTotal = $baseImponible * 1.18;

            $updateData = [
                'id_supplier'   => $data['id_supplier'],
                'document_type' => $data['document_type'],
                'currency'      => $data['currency'],
                'exchange_rate' => $data['exchange_rate'],
                'series'        => strtoupper($data['series']),
                'number'        => $data['number'],
                'glosa'         => $data['glosa'] ?? null,
                'issue_date'    => $issueDate,
                'total_amount'  => $newTotal,
            ];

            if (isset($data['receipt_path'])) {
                $updateData['receipt_path'] = $data['receipt_path'];
            }

            // --- LÓGICA DE LOG DETALLADO ---
            $receipt->fill($updateData);

            if ($receipt->isDirty()) {
                $changes = $receipt->getDirty();
                foreach ($changes as $field => $newValue) {
                    if (in_array($field, ['receipt_path', 'updated_at'])) continue;

                    $oldValue = $receipt->getOriginal($field);

                    // Comparación para evitar logs duplicados por tipos de datos
                    if (is_numeric($oldValue) && is_numeric($newValue)) {
                        if (abs((float)$oldValue - (float)$newValue) < 0.001) continue;
                    } else {
                        if (trim((string)$oldValue) === trim((string)$newValue)) continue;
                    }

                    $friendlyField = strtoupper(str_replace('_', ' ', $field));

                    // Formateo de notas del log
                    if ($field === 'glosa') {
                        $notes = "Se actualizó la glosa del comprobante";
                    } else {
                        $valOld = ($field === 'issue_date') ? Carbon::parse($oldValue)->format('d/m/Y') : $oldValue;
                        $valNew = ($field === 'issue_date') ? Carbon::parse($newValue)->format('d/m/Y') : $newValue;

                        if ($field === 'total_amount') {
                            $valOld = number_format((float)$oldValue, 2);
                            $valNew = number_format((float)$newValue, 2);
                        }
                        $notes = "Cambió {$friendlyField} de '{$valOld}' a '{$valNew}'";
                    }

                    ReceiptLog::create([
                        'id_receipt'    => $receipt->id_receipt,
                        'id_user'       => Auth::id(),
                        'action'        => 'Actualización',
                        'field_changed' => $field,
                        'old_value'     => $field === 'glosa' ? null : (string)$oldValue,
                        'new_value'     => $field === 'glosa' ? null : (string)$newValue,
                        'notes'         => $notes
                    ]);
                }
            }

            $receipt->save();

            // 4. CREAR NUEVOS DETALLES Y REGISTRAR MOVIMIENTOS
            $isUSD = $data['currency'] === 'USD';
            $exchangeRate = (float) $data['exchange_rate'];

            foreach ($data['details'] as $item) {
                $qty = (float)($item['quantity'] ?? 0);
                $price = (float)($item['unit_price'] ?? 0);
                $isService = filter_var($item['is_service'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $idProduct = $item['id_product'] ?? null;

                // 4.1. Crear registro de detalle
                $receipt->details()->create([
                    'quantity'    => $qty,
                    'unit_price'  => $price,
                    'subtotal'    => $qty * $price,
                    'id_product'  => $isService ? null : $idProduct,
                    'description' => $isService ? ($item['description'] ?? 'Servicio') : null,
                ]);

                // 4.2. ✅ ACTUALIZAR CANTIDADES FACTURADAS EN OC
                if ($receipt->id_purchase_order) {
                    $this->updateBilledQuantity(
                        $receipt->id_purchase_order,
                        $idProduct,
                        $qty,
                        $isService ? ($item['description'] ?? null) : null
                    );
                }

                // 4.3. Registrar movimiento de Kardex (Solo productos)
                if (!$isService && !empty($idProduct)) {
                    $kardexPrice = $isUSD ? ($price * $exchangeRate) : $price;

                    $this->inventoryService->registerMovement(
                        $idProduct,
                        $qty,
                        'purchase',
                        $kardexPrice,
                        $receipt,
                        "Compra Actualizada {$receipt->series}-{$receipt->number}",
                        $issueDate
                    );
                }
            }

            return $receipt;
        });
    }

    protected function updateBilledQuantity($poId, $productId, $quantity, $description = null)
    {
        $query = \App\Models\PurchaseOrderDetail::where('id_purchase_order', $poId);

        if ($productId) {
            $query->where('id_product', $productId);
        } else {
            $query->where('description', $description);
        }

        $poDetail = $query->first();

        if ($poDetail) {
            $poDetail->increment('billed_quantity', $quantity);
        }
    }

    public function createReturn(array $data, $originalReceiptId)
    {
        return DB::transaction(function () use ($data, $originalReceiptId) {
            $originalReceipt = $this->repo->find($originalReceiptId);

            // Calcular total
            $totalReturnAmount = collect($data)->sum(fn($i) => (float)$i['return_quantity'] * (float)$i['unit_price']);

            $ncSeries = 'NC-' . $originalReceipt->series;
            $ncNumber = $this->calculateNextReceiptNumber($ncSeries);
            $now = Carbon::now();

            // --- CORRECCIÓN AQUÍ ---
            // Heredar moneda y tipo de cambio del padre
            $creditNote = $this->repo->create([
                'id_supplier'   => $originalReceipt->id_supplier,
                'document_type' => DocumentType::CREDIT_NOTE,
                'id_parent'     => $originalReceipt->id_receipt,
                'series'        => $ncSeries,
                'number'        => $ncNumber,
                'issue_date'    => $now,
                'currency'      => $originalReceipt->currency,      // <--- AGREGADO
                'exchange_rate' => $originalReceipt->exchange_rate, // <--- AGREGADO
                'total_amount'  => -$totalReturnAmount, // Guardamos en negativo
                'receipt_path'  => null // Opcional: podrías querer copiar el archivo o dejarlo null
            ]);

            foreach ($data as $item) {
                if ((float)$item['return_quantity'] > 0) {
                    $qty = (float)$item['return_quantity'];
                    $price = (float)$item['unit_price'];
                    $isService = empty($item['id_product']);

                    $creditNote->details()->create([
                        'id_product'  => $isService ? null : $item['id_product'],
                        'description' => $isService ? ($item['description'] ?? 'Devolución Servicio') : null,
                        'quantity'    => $qty,
                        'unit_price'  => $price,
                        'subtotal'    => $qty * $price,
                    ]);

                    if (!$isService) {
                        // Mover Kardex: Usar el precio convertido si es USD
                        $isUSD = $originalReceipt->currency === 'USD';
                        $exchangeRate = $originalReceipt->exchange_rate;
                        $kardexPrice = $isUSD ? ($price * $exchangeRate) : $price;

                        $this->inventoryService->registerMovement(
                            $item['id_product'],
                            -$qty, // Salida de stock
                            'purchase_return',
                            $kardexPrice, // <--- PRECIO EN SOLES
                            $creditNote,
                            "Devolución parcial de Compra {$originalReceipt->series}-{$originalReceipt->number}",
                            Carbon::now()
                        );
                    }
                }
            }
            return $creditNote;
        });
    }

    public function deleteReceipt($id)
    {
        return DB::transaction(function () use ($id) {
            $receipt = $this->repo->find($id);
            if (!$receipt) return false;

            foreach ($receipt->details as $detail) {
                if ($detail->id_product) {
                    $qty = abs($detail->quantity);
                    $finalQty = ($receipt->document_type != DocumentType::CREDIT_NOTE) ? -$qty : $qty;

                    $this->inventoryService->registerMovement(
                        $detail->id_product,
                        $finalQty,
                        'adjustment',
                        $detail->unit_price,
                        $receipt,
                        "Anulación de " . ($receipt->document_type == DocumentType::CREDIT_NOTE ? "Nota de Crédito" : "Compra"),
                        Carbon::now()
                    );
                }
            }

            if ($receipt->receipt_path) Storage::disk('public')->delete($receipt->receipt_path);
            $receipt->details()->delete();
            return $this->repo->delete($id);
        });
    }

    public function deleteReceipts(array $ids)
    {
        return DB::transaction(function () use ($ids) {
            foreach ($ids as $id) {
                $receipt = $this->repo->find($id);
                if (!$receipt) continue;
                foreach ($receipt->details as $detail) {
                    $qty = abs($detail->quantity);
                    $finalQty = ($receipt->document_type != DocumentType::CREDIT_NOTE) ? -$qty : $qty;

                    $this->inventoryService->registerMovement(
                        $detail->id_product,
                        $finalQty,
                        'adjustment',
                        $detail->unit_price,
                        $receipt,
                        "Anulación de " . ($receipt->document_type == DocumentType::CREDIT_NOTE ? "Nota de Crédito" : "Compra"),
                        Carbon::now()
                    );
                }
                if ($receipt->receipt_path) Storage::disk('public')->delete($receipt->receipt_path);
                $receipt->details()->delete();
                $this->repo->delete($id);
            }
        });
    }

    protected function calculateNextReceiptNumber(string $series): string
    {
        $last = Receipt::where('document_type', DocumentType::CREDIT_NOTE)
            ->where('series', $series)
            ->orderBy(DB::raw('CAST(number AS UNSIGNED)'), 'desc')
            ->first();
        $num = $last ? (int)$last->number : 0;
        return str_pad($num + 1, 6, '0', STR_PAD_LEFT);
    }
}
