<?php

namespace App\Http\Services\Receipt;

use App\Enums\DocumentType;
use App\Http\Repositories\Eloquent\Receipt\ReceiptRepository;
use App\Http\Services\BaseService;
use App\Models\Receipt;
use App\Models\ReceiptLog;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReceiptService extends BaseService
{
    public function __construct(ReceiptRepository $model)
    {
        parent::__construct($model);
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
                'id_supplier'       => $data['id_supplier'],
                'id_purchase_order' => $data['id_purchase_order'] ?? null,
                'document_type'     => $data['document_type'],
                'currency'          => $data['currency'],
                'exchange_rate'     => $data['exchange_rate'],
                'series'            => strtoupper($data['series']),
                'number'            => $data['number'],
                'issue_date'        => $issueDate,
                'glosa'             => $data['glosa'] ?? null,
                'total_amount'      => $totalAmount,
                'receipt_path'      => $path,
                'status'            => 'draft', // ✅ SE CREA COMO BORRADOR
            ]);

            foreach ($data['details'] as $detail) {
                $qty = (float)$detail['quantity'];
                $price = (float)$detail['unit_price'];
                $isService = filter_var($detail['is_service'] ?? false, FILTER_VALIDATE_BOOLEAN);

                $receipt->details()->create([
                    'quantity'    => $qty,
                    'unit_price'  => $price,
                    'subtotal'    => $qty * $price,
                    'id_product'  => $isService ? null : $detail['id_product'],
                    'description' => $isService ? ($detail['description'] ?? 'Servicio') : null,
                ]);
            }
            return $receipt;
        });
    }

    public function updateReceipt(array $data, $id)
    {
        return DB::transaction(function () use ($data, $id) {
            $receipt = Receipt::findOrFail($id);

            if ($receipt->status === 'published') {
                throw new \Exception("No se puede editar un comprobante publicado.");
            }

            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                if ($receipt->receipt_path) Storage::disk('public')->delete($receipt->receipt_path);
                $data['receipt_path'] = $data['file']->store('receipts', 'public');
            }

            $receipt->details()->delete();

            $issueDate = Carbon::parse($data['issue_date']);
            $baseImponible = collect($data['details'])->sum(fn($i) => (float)($i['quantity'] ?? 0) * (float)($i['unit_price'] ?? 0));

            $updateData = [
                'id_supplier'   => $data['id_supplier'],
                'document_type' => $data['document_type'],
                'currency'      => $data['currency'],
                'exchange_rate' => $data['exchange_rate'],
                'series'        => strtoupper($data['series']),
                'number'        => $data['number'],
                'glosa'         => $data['glosa'] ?? null,
                'issue_date'    => $issueDate,
                'total_amount'  => $baseImponible * 1.18,
            ];

            if (isset($data['receipt_path'])) $updateData['receipt_path'] = $data['receipt_path'];

            $receipt->update($updateData);

            foreach ($data['details'] as $item) {
                $isService = filter_var($item['is_service'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $receipt->details()->create([
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'subtotal'    => $item['quantity'] * $item['unit_price'],
                    'id_product'  => $isService ? null : $item['id_product'],
                    'description' => $isService ? ($item['description'] ?? null) : null,
                ]);
            }

            return $receipt;
        });
    }

    // ✅ NUEVO MÉTODO: Publicar y afectar Orden de Compra
    public function publishReceipt($id)
    {
        return DB::transaction(function () use ($id) {
            $receipt = Receipt::with('details')->findOrFail($id);

            if ($receipt->status === 'published') {
                throw new \Exception("El comprobante ya está publicado.");
            }

            // Si tiene Orden de Compra, impactamos las cantidades facturadas
            if ($receipt->id_purchase_order) {
                // Si es nota de crédito, la cantidad facturada debe restar (-1), sino sumar (1)
                $multiplier = (in_array($receipt->document_type, ['credit_note', DocumentType::CREDIT_NOTE])) ? -1 : 1;

                foreach ($receipt->details as $detail) {
                    $this->updateBilledQuantity(
                        $receipt->id_purchase_order,
                        $detail->id_product,
                        $detail->quantity * $multiplier,
                        $detail->description
                    );
                }
            }

            $receipt->update([
                'status' => 'published',
                'published_at' => now(),
            ]);

            ReceiptLog::create([
                'id_receipt' => $receipt->id_receipt,
                'id_user'    => Auth::id(),
                'action'     => 'Publicación',
                'notes'      => 'Comprobante publicado. Cantidades facturadas actualizadas.'
            ]);

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

            $creditNote = $this->repo->create([
                'id_supplier'   => $originalReceipt->id_supplier,
                'id_purchase_order' => $originalReceipt->id_purchase_order, // Conservamos el vínculo a la OC
                'document_type' => DocumentType::CREDIT_NOTE,
                'id_parent'     => $originalReceipt->id_receipt,
                'series'        => $ncSeries,
                'number'        => $ncNumber,
                'issue_date'    => Carbon::now(),
                'currency'      => $originalReceipt->currency,
                'exchange_rate' => $originalReceipt->exchange_rate,
                'total_amount'  => -$totalReturnAmount,
                'status'        => 'draft', // ✅ La Nota de Crédito nace en borrador
            ]);

            foreach ($data as $item) {
                $creditNote->details()->create([
                    'id_product'  => $item['id_product'] ?? null,
                    'description' => empty($item['id_product']) ? ($item['description'] ?? 'Devolución') : null,
                    'quantity'    => $item['return_quantity'],
                    'unit_price'  => $item['unit_price'],
                    'subtotal'    => $item['return_quantity'] * $item['unit_price'],
                ]);
            }

            ReceiptLog::create([
                'id_receipt' => $creditNote->id_receipt,
                'id_user'    => Auth::id() ?? 1,
                'action'     => 'Creación',
                'notes'      => 'Nota de Crédito generada a partir de ' . $originalReceipt->series . '-' . $originalReceipt->number
            ]);

            return $creditNote;
        });
    }

    public function deleteReceipt($id)
    {
        return DB::transaction(function () use ($id) {
            $receipt = $this->repo->find($id);
            if (!$receipt) return false;

            // Si estaba publicado, revertimos la Orden de Compra
            if ($receipt->status === 'published' && $receipt->id_purchase_order) {
                $multiplier = (in_array($receipt->document_type, ['credit_note', DocumentType::CREDIT_NOTE])) ? -1 : 1;
                foreach ($receipt->details as $d) {
                    $this->updateBilledQuantity($receipt->id_purchase_order, $d->id_product, -($d->quantity * $multiplier), $d->description);
                }
            }

            if ($receipt->receipt_path) Storage::disk('public')->delete($receipt->receipt_path);
            $receipt->details()->delete();
            return $this->repo->delete($id);
        });
    }

    public function deleteReceipts(array $ids)
    {
        foreach ($ids as $id) { $this->deleteReceipt($id); }
    }

    protected function updateBilledQuantity($poId, $productId, $quantity, $description = null)
    {
        $query = \App\Models\PurchaseOrderDetail::where('id_purchase_order', $poId);
        $productId ? $query->where('id_product', $productId) : $query->where('description', $description);

        $poDetail = $query->first();
        if ($poDetail) {
            $poDetail->increment('billed_quantity', $quantity);
        }
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
