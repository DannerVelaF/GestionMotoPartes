<?php

namespace App\Http\Services\Receipt;

use App\Enums\DocumentType;
use App\Http\Repositories\Eloquent\Receipt\ReceiptRepository;
use App\Http\Services\BaseService;
use App\Http\Services\Inventory\InventoryService;
use App\Models\InventoryMovements;
use App\Models\Products;
use App\Models\Receipt;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
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
            $totalAmount = collect($data['details'])->sum(fn($i) => (float)$i['quantity'] * (float)$i['unit_price']);

            // --- 1. Crear Cabecera con Moneda ---
            $receipt = $this->repo->create([
                'id_supplier'   => $data['id_supplier'],
                'document_type' => $data['document_type'],
                'currency'      => $data['currency'],       // <--- NUEVO
                'exchange_rate' => $data['exchange_rate'],  // <--- NUEVO
                'series'        => strtoupper($data['series']),
                'number'        => $data['number'],
                'issue_date'    => $issueDate,
                'total_amount'  => $totalAmount, // El total se guarda en la moneda original (ej: $100)
                'receipt_path'  => $path,
            ]);

            $isUSD = $data['currency'] === 'USD';
            $exchangeRate = (float) $data['exchange_rate'];

            foreach ($data['details'] as $detail) {
                $qty = (float)$detail['quantity'];
                $price = (float)$detail['unit_price']; // Precio en moneda original
                $isService = $detail['is_service'] ?? false;

                // --- 2. Crear Detalle ---
                $detailData = [
                    'quantity'    => $qty,
                    'unit_price'  => $price,
                    'subtotal'    => $qty * $price,
                    'id_product'  => $isService ? null : $detail['id_product'],
                    'description' => $isService ? ($detail['description'] ?? 'Servicio') : null,
                ];

                $receipt->details()->create($detailData);

                // --- 3. Lógica Inventario (Solo Productos) ---
                if (!$isService && !empty($detail['id_product'])) {

                    // Actualizar precio de venta sugerido (Siempre en Soles)
                    if (isset($detail['sale_price']) && $detail['sale_price'] > 0) {
                        Products::where('id_product', $detail['id_product'])
                            ->update(['sale_price' => $detail['sale_price']]);
                    }

                    // --- CALCULAR PRECIO EN SOLES PARA KARDEX ---
                    // Si la compra fue en USD, convertimos al tipo de cambio.
                    // Si fue en PEN, usamos el precio directo.
                    $kardexPrice = $isUSD ? ($price * $exchangeRate) : $price;

                    $this->inventoryService->registerMovement(
                        $detail['id_product'],
                        $qty,
                        'purchase',
                        $kardexPrice, // <--- PRECIO CONVERTIDO A SOLES
                        $receipt,
                        "Ingreso por Compra {$receipt->series}-{$receipt->number} (" . ($isUSD ? 'USD' : 'PEN') . ")",
                        $issueDate
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

            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                if ($receipt->receipt_path) {
                    Storage::disk('public')->delete($receipt->receipt_path);
                }

                $data['receipt_path'] = $data['file']->store('receipts', 'public');
            }

            foreach ($receipt->details as $oldDetail) {
                if ($oldDetail->id_product && $oldDetail->product) {
                    $oldDetail->product->decrement('stock', $oldDetail->quantity);
                }
            }

            \App\Models\InventoryMovements::where('reference_id', $receipt->id_receipt)
                ->where('reference_type', Receipt::class)
                ->delete();

            $receipt->details()->delete();

            $issueDate = \Carbon\Carbon::parse($data['issue_date']);

            $updateData = [
                'id_supplier'   => $data['id_supplier'],
                'document_type' => $data['document_type'],
                'currency'      => $data['currency'],
                'exchange_rate' => $data['exchange_rate'],
                'series'        => strtoupper($data['series']),
                'number'        => $data['number'],
                'issue_date'    => $issueDate,
                'total_amount'  => collect($data['details'])->sum(fn($i) => (float)$i['quantity'] * (float)$i['unit_price']),
            ];

            if (isset($data['receipt_path'])) {
                $updateData['receipt_path'] = $data['receipt_path'];
            }

            // 5. Actualizar
            $receipt->update($updateData);

            $isUSD = $data['currency'] === 'USD';
            $exchangeRate = (float) $data['exchange_rate'];
            foreach ($data['details'] as $item) {
                $qty = (float)$item['quantity'];
                $price = (float)$item['unit_price'];
                $isService = $item['is_service'] ?? false;

                $receipt->details()->create([
                    'quantity'    => $qty,
                    'unit_price'  => $price,
                    'subtotal'    => $qty * $price,
                    'id_product'  => $isService ? null : $item['id_product'],
                    'description' => $isService ? ($item['description'] ?? 'Servicio') : null,
                ]);

                if (!$isService && !empty($item['id_product'])) {
                    $kardexPrice = $isUSD ? ($price * $exchangeRate) : $price;

                    $this->inventoryService->registerMovement(
                        $item['id_product'],
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
