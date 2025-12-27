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
            // 1. Manejo de Archivo
            $path = null;
            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                $path = $data['file']->store('receipts', 'public');
            }

            // 2. Fecha y Totales
            $issueDate = Carbon::parse($data['issue_date']);
            $totalAmount = collect($data['details'])->sum(fn($i) => (float)$i['quantity'] * (float)$i['unit_price']);

            // 3. Crear Cabecera
            $receipt = $this->repo->create([
                'id_supplier'   => $data['id_supplier'],
                'document_type' => $data['document_type'],
                'series'        => strtoupper($data['series']),
                'number'        => $data['number'],
                'issue_date'    => $issueDate,
                'total_amount'  => $totalAmount,
                'receipt_path'  => $path,
            ]);

            // 4. Detalles y Kardex
            foreach ($data['details'] as $detail) {
                $qty = (float)$detail['quantity'];
                $price = (float)$detail['unit_price'];

                $receipt->details()->create([
                    'id_product' => $detail['id_product'],
                    'quantity'   => $qty,
                    'unit_price' => $price,
                    'subtotal'   => $qty * $price, // Soluciona error de default value
                ]);

                // Actualizar precio de venta si se envió
                if (isset($detail['sale_price']) && $detail['sale_price'] > 0) {
                    Products::where('id_product', $detail['id_product'])->update(['sale_price' => $detail['sale_price']]);
                }

                // Registrar en Kardex con la fecha del documento
                $this->inventoryService->registerMovement(
                    $detail['id_product'], $qty, 'purchase', $price, $receipt,
                    "Ingreso por Compra {$receipt->series}-{$receipt->number}",
                    $issueDate
                );
            }

            return $receipt;
        });
    }

    public function updateReceipt(array $data, $id)
    {
        return DB::transaction(function () use ($data, $id) {
            $receipt = Receipt::findOrFail($id);

            // 1. Revertir Stock antiguo
            foreach ($receipt->details as $oldDetail) {
                if ($oldDetail->product) $oldDetail->product->decrement('stock', $oldDetail->quantity);
            }

            // 2. Limpiar Kardex y Detalles previos de este recibo
            \App\Models\InventoryMovements::where('reference_id', $receipt->id_receipt)
                ->where('reference_type', Receipt::class)
                ->delete();
            $receipt->details()->delete();

            // 3. Preparar Fecha con Hora
            $issueDate = \Carbon\Carbon::parse($data['issue_date']);

            // 4. Actualizar Cabecera
            $receipt->update([
                'id_supplier'   => $data['id_supplier'],
                'document_type' => $data['document_type'],
                'series'        => strtoupper($data['series']),
                'number'        => $data['number'],
                'issue_date'    => $issueDate, // <--- SE GUARDA EN LA DB
                'total_amount'  => collect($data['details'])->sum(fn($i) => (float)$i['quantity'] * (float)$i['unit_price']),
            ]);

            // 5. Grabar nuevos detalles y llamar al registro de Kardex forzado
            foreach ($data['details'] as $item) {
                $qty = (float)$item['quantity'];
                $price = (float)$item['unit_price'];

                $receipt->details()->create([
                    'id_product' => $item['id_product'],
                    'quantity'   => $qty,
                    'unit_price' => $price,
                    'subtotal'   => $qty * $price,
                ]);

                // LLAMADA AL INVENTARIO PASANDO LA FECHA
                $this->inventoryService->registerMovement(
                    $item['id_product'],
                    $qty,
                    'purchase',
                    $price,
                    $receipt,
                    "Compra Actualizada {$receipt->series}-{$receipt->number}",
                    $issueDate
                );
            }

            return $receipt;
        });
    }

    public function createReturn(array $data, $originalReceiptId)
    {
        return DB::transaction(function () use ($data, $originalReceiptId) {
            $originalReceipt = $this->repo->find($originalReceiptId);
            $totalReturnAmount = collect($data)->sum(fn($i) => (float)$i['return_quantity'] * (float)$i['unit_price']);

            $ncSeries = 'NC-' . $originalReceipt->series;
            $ncNumber = $this->calculateNextReceiptNumber($ncSeries);
            $now = Carbon::now(); // Fecha para la Nota de Crédito

            $creditNote = $this->repo->create([
                'id_supplier'   => $originalReceipt->id_supplier,
                'document_type' => DocumentType::CREDIT_NOTE,
                'id_parent'     => $originalReceipt->id_receipt,
                'series'        => $ncSeries,
                'number'        => $ncNumber,
                'issue_date'    => $now,
                'total_amount'  => -$totalReturnAmount,
            ]);

            foreach ($data as $item) {
                if ((float)$item['return_quantity'] > 0) {
                    $qty = (float)$item['return_quantity'];
                    $price = (float)$item['unit_price'];

                    $creditNote->details()->create([
                        'id_product' => $item['id_product'],
                        'quantity'   => $qty,
                        'unit_price' => $price,
                        'subtotal'   => $qty * $price,
                    ]);

                    $this->inventoryService->registerMovement(
                        $item['id_product'], -$qty, 'purchase_return', $price, $creditNote,
                        "Devolución parcial de Compra {$originalReceipt->series}-{$originalReceipt->number}",
                        $now
                    );
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
                $qty = abs($detail->quantity);
                $finalQty = ($receipt->document_type != DocumentType::CREDIT_NOTE) ? -$qty : $qty;

                $this->inventoryService->registerMovement(
                    $detail->id_product, $finalQty, 'adjustment', $detail->unit_price, $receipt,
                    "Anulación de " . ($receipt->document_type == DocumentType::CREDIT_NOTE ? "Nota de Crédito" : "Compra"),
                    Carbon::now()
                );
            }

            if ($receipt->receipt_path) Storage::disk('public')->delete($receipt->receipt_path);
            $receipt->details()->delete();
            return $this->repo->delete($id);
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
