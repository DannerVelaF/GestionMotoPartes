<?php

namespace App\Http\Services\Inventory;

use App\Http\Repositories\Eloquent\Inventory\InventoryRepository;
use App\Http\Services\BaseService;
use App\Models\Products;
use App\Models\InventoryMovements;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class InventoryService extends BaseService
{
    public function __construct(InventoryRepository $model){
        parent::__construct($model);
    }

    public function registerMovement($productId, $quantity, $type, $unitCost, $referenceModel = null, $notes = '', $date = null) {
        $product = Products::find($productId);
        if (!$product) return null;

        $currentStock = (float)($product->stock ?? 0);
        $newBalance = $currentStock + (float)$quantity;

        $movement = new InventoryMovements([
            'id_product'     => $productId,
            'type'           => $type,
            'id_user'        => Auth::id() ?? 1,
            'quantity'       => $quantity,
            'unit_cost'      => $unitCost,
            'balance'        => $newBalance,
            'reference_id'   => $referenceModel ? $referenceModel->getKey() : null,
            'reference_type' => $referenceModel ? get_class($referenceModel) : null,
            'notes'          => $notes
        ]);

        if ($date) {
            $movement->timestamps = false;
            $movement->created_at = Carbon::parse($date);
            $movement->updated_at = Carbon::parse($date);
        }

        $movement->save();

        // 3. Actualizar Maestro de Productos
        $product->stock = $newBalance;
        if ($type === 'purchase' && $quantity > 0) {
            $product->purchase_price = $unitCost;
        }
        $product->save();

        return $movement;
    }
}
