<?php

namespace App\Http\Services\PurchaseOrder;

use App\Http\Repositories\Eloquent\PurchaseOrder\PurchaseOrderRepository;
use App\Http\Services\BaseService;
use App\Http\Services\Receipt\ReceiptService;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLog;
use App\Models\Products;
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
                'total_amount'        => $data['total_amount'],
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

            // 2. Crear Detalles asignando el ID del Impuesto
            foreach ($data['details'] as $detail) {
                $isService = $detail['is_service'] ?? ($data['order_type'] === 'service');

                $order->details()->create([
                    'id_product'           => $isService ? null : $detail['id_product'],
                    'description'          => $isService ? ($detail['description'] ?? 'Servicio') : null,
                    'quantity'             => $detail['quantity'],
                    'unit_cost'            => $detail['unit_cost'],
                    'id_tax'               => $detail['id_tax'],
                    'subtotal'             => $detail['subtotal'],
                    'margin_percentage'    => $detail['margin_percentage'] ?? 0,
                    'suggested_sale_price' => $detail['suggested_sale_price'] ?? 0,
                ]);

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
                'id_supplier'   => $data['id_supplier'],
                'order_type'    => $data['order_type'],
                'requested_by'  => $requestedBy,
                'issue_date'    => Carbon::parse($data['issue_date']),
                'expected_date' => isset($data['expected_date']) ? Carbon::parse($data['expected_date']) : null,
                'total_amount'  => $data['total_amount'],
                'currency'      => $data['currency'],
                'exchange_rate' => $data['exchange_rate'],
                'status'        => $data['status'] ?? $order->status,
                'notes'         => $data['notes'] ?? null,
            ];

            if (isset($data['actual_arrival_date'])) {
                $updateData['actual_arrival_date'] = Carbon::parse($data['actual_arrival_date']);
            }

            $order->fill($updateData);

            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                if ($order->attachment_path) Storage::disk('public')->delete($order->attachment_path);
                $order->attachment_path = $data['file']->store('purchase_orders', 'public');
            }

            $order->save();

            // Actualizar detalles (Borrar y re-crear es más limpio para sincronizar cambios)
            $order->details()->delete();
            foreach ($data['details'] as $detail) {
                $isService = $detail['is_service'] ?? ($data['order_type'] === 'service');
                $order->details()->create([
                    'id_product'           => $isService ? null : $detail['id_product'],
                    'description'          => $isService ? ($detail['description'] ?? 'Servicio') : null,
                    'quantity'             => $detail['quantity'],
                    'unit_cost'            => $detail['unit_cost'],
                    'id_tax'               => $detail['id_tax'], // ✅ CORREGIDO: Se mantiene el impuesto al actualizar
                    'subtotal'             => $detail['subtotal'],
                    'margin_percentage'    => $detail['margin_percentage'] ?? 0,
                    'suggested_sale_price' => $detail['suggested_sale_price'] ?? 0,
                ]);

                if (!$isService && !empty($detail['id_product'])) {
                    $this->syncProductPrices($detail);
                }
            }

            return $order->refresh();
        });
    }

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
                'id_user' => Auth::id(),
                'action' => 'Orden Cancelada',
                'notes' => 'El usuario canceló la orden.'
            ]);
            return $order;
        });
    }
}
