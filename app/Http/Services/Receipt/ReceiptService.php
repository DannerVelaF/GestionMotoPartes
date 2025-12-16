<?php

namespace App\Http\Services\Receipt;

use App\Enums\DocumentType;
use App\Http\Repositories\Contracts\Receipt\ReceiptRepositoryInterface;
use App\Http\Repositories\Eloquent\Inventory\InventoryRepository;
use App\Http\Repositories\Eloquent\Receipt\ReceiptRepository;
use App\Http\Services\BaseService;
use App\Http\Services\Inventory\InventoryService;
use App\Models\Products;
use App\Models\Receipt;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReceiptService extends BaseService
{

    protected $inventoryService;

    // 2. INYECTA InventoryService AQUÍ
    public function __construct(ReceiptRepository $model, InventoryService $inventoryService)
    {
        parent::__construct($model);
        $this->inventoryService = $inventoryService;
    }

    public function createReceipt(array $data)
    {
        return DB::transaction(function () use ($data) {
            // 1. Archivo
            $path = null;
            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                $path = $data['file']->store('receipts', 'public');
            }

            // 2. Calcular Total
            $totalAmount = collect($data['details'])->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });

            // 3. Crear Cabecera
            $receiptData = [
                'id_supplier'   => $data['id_supplier'],
                'document_type' => $data['document_type'],
                'series'        => strtoupper($data['series']),
                'number'        => $data['number'],
                'issue_date'    => Carbon::parse($data['issue_date'])->format('Y-m-d'),
                'total_amount'  => $totalAmount,
                'receipt_path'  => $path,
            ];

            $receipt = $this->repo->create($receiptData);

            // 4. Crear Detalles y MOVER INVENTARIO
            foreach ($data['details'] as $detail) {
                // A. Crear detalle visual
                $receipt->details()->create([
                    'id_product' => $detail['id_product'],
                    'quantity'   => $detail['quantity'],
                    'unit_price' => $detail['unit_price'],
                    'subtotal'   => $detail['quantity'] * $detail['unit_price'],
                ]);

                if ($detail['sale_price'] > 0) {
                    Products::where('id_product', $detail['id_product'])->update([
                        'sale_price' => $detail['sale_price']
                    ]);
                }

                // B. Registrar Ingreso en Kardex (+)
                $this->inventoryService->registerMovement(
                    $detail['id_product'],
                    abs($detail['quantity']), // Cantidad Positiva (Entrada)
                    'purchase',
                    $detail['unit_price'],
                    $receipt, // Referencia polimórfica
                    "Ingreso por Compra {$receipt->series}-{$receipt->number}"
                );
            }

            return $receipt;
        });
    }

    public function createReturn(array $data, $originalReceiptId)
    {
        return DB::transaction(function () use ($data, $originalReceiptId) {
            $originalReceipt = $this->repo->find($originalReceiptId);
            $originalDetails = $originalReceipt->details->keyBy('id_product');
            $totalReturnAmount = collect($data)->sum(function ($item) {
                return $item['return_quantity'] * $item['unit_price'];
            });

            $ncSeries = 'NC-' . $originalReceipt->series;

            $ncNumber = $this->calculateNextReceiptNumber($ncSeries);

            $creditNote = $this->repo->create([
                'id_supplier'   => $originalReceipt->id_supplier,
                'document_type' => DocumentType::CREDIT_NOTE,
                'parent_id'     => $originalReceipt->id_receipt, // Correcto
                'series'        => $ncSeries, // Ej: NC-F001
                'number'        => $ncNumber, // Ej: 000004
                'issue_date'    => Carbon::now()->format('Y-m-d'),
                'total_amount'  => -$totalReturnAmount,
                'receipt_path'  => null,
                "id_parent"     => $originalReceipt->id_receipt,
            ]);

            foreach ($data as $item) {
                if ($item['return_quantity'] > 0) {
                    $productId = $item['id_product'];
                    $currentReturnQuantity = $item['return_quantity'];

                    $originalDetail = $originalDetails->get($productId);

                    if (!$originalDetail) {
                        throw new \Exception("El producto ID {$productId} no se encontró en la compra original.");
                    }

                    $originalQuantity = $originalDetail->quantity;

                    $previouslyReturned = $this->getTotalPreviouslyReturnedQuantity($originalReceiptId, $productId);

                    $totalFutureReturned = $previouslyReturned + $currentReturnQuantity;

                    if ($totalFutureReturned > $originalQuantity) {
                        throw new \Exception("No se puede devolver {$currentReturnQuantity} unidades del producto ID {$productId}. Ya se han devuelto {$previouslyReturned} y el stock original fue de {$originalQuantity}.");
                    }
                    $creditNote->details()->create([
                        'id_product' => $item['id_product'],
                        'quantity'   => $item['return_quantity'],
                        'unit_price' => $item['unit_price'],
                        'subtotal'   => $item['return_quantity'] * $item['unit_price'],
                    ]);


                    $this->inventoryService->registerMovement(
                        $item['id_product'],
                        -abs($item['return_quantity']),
                        'purchase_return',
                        $item['unit_price'],
                        $creditNote,
                        "Devolución parcial de Compra {$originalReceipt->series}-{$originalReceipt->number}"
                    );
                }
            }

            return $creditNote;
        });
    }

    public function updateReceipt(array $data, $id)
    {
        return DB::transaction(function () use ($data, $id) {
            $receipt = $this->repo->find($id);

            // 1. Archivo
            $path = $receipt->receipt_path;
            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                if ($receipt->receipt_path) {
                    Storage::disk('public')->delete($receipt->receipt_path);
                }
                $path = $data['file']->store('receipts', 'public');
            }

            $totalAmount = collect($data['details'])->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });

            $receipt->update([
                'id_supplier'   => $data['id_supplier'],
                'document_type' => $data['document_type'],
                'series'        => strtoupper($data['series']),
                'number'        => $data['number'],
                'issue_date'    => Carbon::parse($data['issue_date'])->format('Y-m-d'),
                'total_amount'  => $totalAmount,
                'receipt_path'  => $path,
            ]);

            foreach ($receipt->details as $oldDetail) {
                $this->inventoryService->registerMovement(
                    $oldDetail->id_product,
                    -abs($oldDetail->quantity),
                    'adjustment',
                    $oldDetail->unit_price,
                    $receipt,
                    "Reversión por edición de Compra {$receipt->series}-{$receipt->number}"
                );
            }

            $receipt->details()->delete();

            foreach ($data['details'] as $detail) {
                $receipt->details()->create([
                    'id_product' => $detail['id_product'],
                    'quantity'   => $detail['quantity'],
                    'unit_price' => $detail['unit_price'],
                    'subtotal'   => $detail['quantity'] * $detail['unit_price'],
                ]);

                $this->inventoryService->registerMovement(
                    $detail['id_product'],
                    abs($detail['quantity']),
                    'purchase',
                    $detail['unit_price'],
                    $receipt,
                    "Re-ingreso por edición de Compra {$receipt->series}-{$receipt->number}"
                );
            }

            return $receipt;
        });
    }

    public function deleteReceipt($id)
    {
        return DB::transaction(function () use ($id) {
            $receipt = $this->repo->find($id);

            if (!$receipt) return false;

            foreach ($receipt->details as $detail) {
                $quantityToRevert = abs($detail->quantity);
                $movementType = 'adjustment';

                // Si el documento es una COMPRA (entrada al almacén), 
                // para anularla, la reversión es una SALIDA (-).
                if ($receipt->document_type != DocumentType::CREDIT_NOTE) {
                    $finalQuantity = -$quantityToRevert;
                    $reason = "Anulación de Compra {$receipt->series}-{$receipt->number}";
                } else {
                    // Si el documento es una NOTA DE CRÉDITO (salida del almacén), 
                    // para anularla, la reversión es una ENTRADA (+).
                    $finalQuantity = $quantityToRevert;
                    $reason = "Anulación de Nota de Crédito {$receipt->series}-{$receipt->number}";
                }

                $this->inventoryService->registerMovement(
                    $detail->id_product,
                    $finalQuantity, // Cantidad ajustada
                    $movementType,
                    $detail->unit_price,
                    $receipt,
                    $reason
                );
            }

            if ($receipt->receipt_path) {
                Storage::disk('public')->delete($receipt->receipt_path);
            }

            $receipt->details()->delete();
            return $this->repo->delete($id);
        });
    }

    public function getReceiptById($id)
    {
        return $this->repo->find($id);
    }

    public function deleteReceipts($ids)
    {
        return DB::transaction(function () use ($ids) {
            $receipts = $this->repo->whereIn('id_receipt', $ids)->get();

            foreach ($receipts as $receipt) {
                // 1. Revertir Stock
                foreach ($receipt->details as $detail) {
                    $this->inventoryService->registerMovement(
                        $detail->id_product,
                        -abs($detail->quantity),
                        'return',
                        $detail->unit_price,
                        $receipt,
                        "Anulación masiva de Compra"
                    );
                }

                if ($receipt->receipt_path) {
                    Storage::disk('public')->delete($receipt->receipt_path);
                }

                $receipt->details()->delete();
            }
            return $this->repo->deleteMany($ids);
        });
    }

    protected function getTotalPreviouslyReturnedQuantity(int $originalReceiptId, int $productId): float
    {
        $originalReceipt = $this->repo->find($originalReceiptId);

        if (!$originalReceipt) {
            return 0;
        }

        $returnedItems = Receipt::where('document_type', DocumentType::CREDIT_NOTE)
            ->where('id_supplier', $originalReceipt->id_supplier)
            ->where('number', $originalReceipt->number)
            ->whereHas('details', function ($query) use ($productId) {
                $query->where('id_product', $productId);
            })
            ->with('details') // Cargar los detalles para sumar
            ->get();

        $totalReturned = 0;

        foreach ($returnedItems as $note) {
            $detail = $note->details->firstWhere('id_product', $productId);
            if ($detail) {
                $totalReturned += abs($detail->quantity);
            }
        }

        return $totalReturned;
    }

    /**
     * Calcula el siguiente número de documento secuencial (Ej: 000004)
     * basado en la última NC emitida para una serie dada.
     * @param string $series La serie de la Nota de Crédito (Ej: NC-F001).
     * @return string
     */
    protected function calculateNextReceiptNumber(string $series): string
    {
        $lastReceipt = Receipt::where('document_type', DocumentType::CREDIT_NOTE)
            ->where('series', $series)
            ->orderBy(DB::raw('CAST(number AS UNSIGNED)'), 'desc') // Ordenar numéricamente
            ->first();

        $lastNumber = 0;

        if ($lastReceipt) {
            $lastNumber = (int) $lastReceipt->number;
        }

        $newNumber = $lastNumber + 1;

        return str_pad($newNumber, 6, '0', STR_PAD_LEFT);
    }
}
