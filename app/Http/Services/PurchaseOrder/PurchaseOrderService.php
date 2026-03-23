<?php

namespace App\Http\Services\PurchaseOrder;

use App\Http\Repositories\Eloquent\PurchaseOrder\PurchaseOrderRepository;
use App\Http\Services\BaseService;
use App\Http\Services\Receipt\ReceiptService;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLog;
use App\Models\Products; // ✅ Importado
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PurchaseOrderService extends BaseService
{
    protected $receiptService;

    public function __construct(PurchaseOrderRepository $model, ReceiptService $receiptService)
    {
        parent::__construct($model);
        $this->receiptService = $receiptService;
    }

    public function createOrder(array $data)
    {
        return DB::transaction(function () use ($data) {
            $userId = Auth::id() ?? 1;

            $path = null;
            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                $path = $data['file']->store('purchase_orders', 'public');
            }

            if (empty($data['po_code'])) {
                $prefix = $data['order_type'] === 'service' ? 'OS' : 'OC';
                $currentYearMonth = now()->format('Ym');
                $count = PurchaseOrder::whereYear('created_at', now()->year)
                    ->whereMonth('created_at', now()->month)
                    ->count();
                $nextSequence = $count + 1;
                $poCode = $prefix . '-' . $currentYearMonth . '-' . str_pad($nextSequence, 5, '0', STR_PAD_LEFT);
            } else {
                $poCode = $data['po_code'];
            }

            $initialStatus = $data['status'] ?? 'draft';

            $order = $this->repo->create([
                'po_code'             => $poCode,
                'order_type'          => $data['order_type'],
                'id_supplier'         => $data['id_supplier'],
                'id_user'             => $userId,
                'requested_by'        => $initialStatus === 'sent' ? $userId : null,
                'issue_date'          => Carbon::parse($data['issue_date']),
                'expected_date'       => isset($data['expected_date']) ? Carbon::parse($data['expected_date']) : null,
                'currency'            => $data['currency'],
                'exchange_rate'       => $data['exchange_rate'],
                'total_amount'        => $data['total_amount'] ?? collect($data['details'])->sum('subtotal'),
                'status'              => $initialStatus,
                'notes'               => $data['notes'] ?? null,
                'attachment_path'     => $path,
            ]);

            PurchaseOrderLog::create([
                'id_purchase_order' => $order->id_purchase_order,
                'id_user'           => $userId,
                'action'            => 'Orden Creada',
                'field_changed'     => 'Estado',
                'new_value'         => $initialStatus,
            ]);

            // 2. Crear Detalles y Sincronizar Precios
            foreach ($data['details'] as $detail) {
                $isService = $detail['is_service'] ?? ($data['order_type'] === 'service');

                $order->details()->create([
                    'id_product'           => $isService ? null : $detail['id_product'],
                    'description'          => $isService ? ($detail['description'] ?? 'Servicio') : null,
                    'quantity'             => $detail['quantity'],
                    'unit_cost'            => $detail['unit_cost'],
                    'subtotal'             => $detail['subtotal'],
                    'margin_percentage'    => $detail['margin_percentage'] ?? 0,
                    'suggested_sale_price' => $detail['suggested_sale_price'] ?? 0,
                ]);

                // ✅ Sincronización automática con el producto maestro
                if (!$isService && !empty($detail['id_product'])) {
                    $this->syncProductPrices($detail);
                }
            }

            return $order;
        });
    }

    public function updateOrder(array $data, $id)
    {
        return DB::transaction(function () use ($data, $id) {
            $userId = Auth::id() ?? 1;
            $order = PurchaseOrder::findOrFail($id);

            if ($order->status === 'received') {
                throw new \Exception("No se puede editar una orden que ya fue recibida.");
            }

            $requestedBy = $order->requested_by;
            if ($order->status === 'draft' && $data['status'] === 'sent') {
                $requestedBy = $userId;
            }

            $updateData = [
                'id_supplier'         => $data['id_supplier'],
                'order_type'          => $data['order_type'],
                'requested_by'        => $requestedBy,
                'issue_date'          => Carbon::parse($data['issue_date']),
                'expected_date'       => isset($data['expected_date']) ? Carbon::parse($data['expected_date']) : null,
                'total_amount'        => collect($data['details'])->sum('subtotal'),
                'currency'            => $data['currency'],
                'exchange_rate'       => $data['exchange_rate'],
                'status'              => $data['status'] ?? $order->status,
                'notes'               => $data['notes'] ?? null,
            ];

            if (isset($data['actual_arrival_date'])) {
                $updateData['actual_arrival_date'] = Carbon::parse($data['actual_arrival_date']);
            }

            $order->fill($updateData);

            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                if ($order->attachment_path) Storage::disk('public')->delete($order->attachment_path);
                $order->attachment_path = $data['file']->store('purchase_orders', 'public');
            }

            // --- LOGS ---
            $dirtyFields = $order->getDirty();
            $originalFields = $order->getOriginal();
            $order->save();

            $fieldNames = ['status' => 'Estado', 'expected_date' => 'Fecha Esperada', 'total_amount' => 'Monto Total', 'currency' => 'Moneda', 'order_type' => 'Tipo de Orden'];

            foreach ($dirtyFields as $field => $newValue) {
                if (array_key_exists($field, $fieldNames)) {
                    $oldValue = $originalFields[$field] ?? null;
                    if (in_array($field, ['total_amount', 'exchange_rate']) && (float)$oldValue === (float)$newValue) continue;

                    PurchaseOrderLog::create([
                        'id_purchase_order' => $order->id_purchase_order,
                        'id_user'           => $userId,
                        'action'            => $field === 'status' ? 'Cambio de Estado' : 'Modificación',
                        'field_changed'     => $fieldNames[$field],
                        'old_value'         => $oldValue ?: 'Vacío',
                        'new_value'         => $newValue,
                    ]);
                }
            }

            // Registrar nota interna
            if (!empty($data['internal_note'])) {
                PurchaseOrderLog::create([
                    'id_purchase_order' => $order->id_purchase_order,
                    'id_user'           => $userId,
                    'action'            => 'Nota',
                    'notes'             => $data['internal_note']
                ]);
            }

            // Actualizar detalles y sincronizar precios
            $order->details()->delete();
            foreach ($data['details'] as $detail) {
                $isService = $detail['is_service'] ?? ($data['order_type'] === 'service');
                $order->details()->create([
                    'id_product'           => $isService ? null : $detail['id_product'],
                    'description'          => $isService ? ($detail['description'] ?? 'Servicio') : null,
                    'quantity'             => $detail['quantity'],
                    'unit_cost'            => $detail['unit_cost'],
                    'subtotal'             => $detail['subtotal'],
                    'margin_percentage'    => $detail['margin_percentage'] ?? 0,
                    'suggested_sale_price' => $detail['suggested_sale_price'] ?? 0,
                ]);

                // ✅ Sincronizar precios al actualizar
                if (!$isService && !empty($detail['id_product'])) {
                    $this->syncProductPrices($detail);
                }
            }

            return $order->refresh();
        });
    }

    /**
     * ✅ MÉTODO DE SINCRONIZACIÓN
     * Actualiza la ficha maestra del producto con los costos y precios negociados en la OC.
     */
    private function syncProductPrices(array $detail)
    {
        $product = Products::find($detail['id_product']);
        if ($product) {
            $product->update([
                'purchase_price' => $detail['unit_cost'],
                'sale_price'     => $detail['suggested_sale_price'] ?? $product->sale_price,
            ]);
        }
    }

    public function approveAndReceiveOrder($orderId, array $receiptData)
    {
        return DB::transaction(function () use ($orderId, $receiptData) {
            $userId = Auth::id() ?? 1;
            $order = PurchaseOrder::findOrFail($orderId);

            if ($order->status === 'received') {
                throw new \Exception("Esta orden ya fue recibida anteriormente.");
            }

            $formattedReceiptData = [
                'id_supplier'       => $order->id_supplier,
                'document_type'     => $receiptData['document_type'],
                'currency'          => $order->currency,
                'exchange_rate'     => $order->exchange_rate,
                'series'            => $receiptData['series'],
                'number'            => $receiptData['number'],
                'issue_date'        => $receiptData['issue_date'],
                'id_purchase_order' => $order->id_purchase_order,
                'details'           => []
            ];

            foreach ($order->details as $detail) {
                $isService = empty($detail->id_product);
                $formattedReceiptData['details'][] = [
                    'is_service'  => $isService,
                    'id_product'  => $detail->id_product,
                    'description' => $detail->description,
                    'quantity'    => $detail->quantity,
                    'unit_price'  => $detail->unit_cost,
                    'sale_price'  => $detail->suggested_sale_price,
                ];
            }

            $receipt = $this->receiptService->createReceipt($formattedReceiptData);

            $order->update([
                'status'              => 'received',
                'approved_by'         => $userId,
                'approved_at'         => now(),
                'actual_arrival_date' => $receiptData['issue_date']
            ]);

            PurchaseOrderLog::create([
                'id_purchase_order' => $order->id_purchase_order,
                'id_user'           => $userId,
                'action'            => 'Recepción y Aprobación',
                'field_changed'     => 'Estado',
                'old_value'         => 'sent',
                'new_value'         => 'received',
                'notes'             => "Generado comprobante: {$receiptData['series']}-{$receiptData['number']}"
            ]);

            return $receipt;
        });
    }

    public function approveOrder($orderId)
    {
        return DB::transaction(function () use ($orderId) {
            $userId = Auth::id() ?? 1;
            $order = PurchaseOrder::findOrFail($orderId);

            if ($order->status !== 'sent') {
                throw new \Exception("Solo se pueden aprobar órdenes enviadas.");
            }

            $order->update([
                'status'      => 'approved',
                'approved_by' => $userId,
                'approved_at' => now(),
            ]);

            PurchaseOrderLog::create([
                'id_purchase_order' => $order->id_purchase_order,
                'id_user'           => $userId,
                'action'            => 'Aprobación',
                'field_changed'     => 'Estado',
                'old_value'         => 'sent',
                'new_value'         => 'approved',
                'notes'             => "La orden ha sido aprobada."
            ]);

            return $order;
        });
    }

    public function cancelOrder($id)
    {
        return DB::transaction(function () use ($id) {
            $order = PurchaseOrder::findOrFail($id);
            if ($order->status === 'received') {
                throw new \Exception("No se puede cancelar una orden recibida.");
            }
            $order->update(['status' => 'cancelled']);
            $order->logs()->create([
                'id_user' => auth()->id(),
                'action' => 'Orden Cancelada',
                'notes' => 'El usuario canceló la orden.'
            ]);
            return $order;
        });
    }
}
