<?php

namespace App\Http\Services\Inventory;

use App\Http\Repositories\Eloquent\Inventory\InventoryRepository;
use App\Http\Services\BaseService;
use App\Models\Products;
use Illuminate\Support\Facades\Auth;

class InventoryService extends BaseService
{
    public function __construct(InventoryRepository $model){
        parent::__construct($model);
    }

    public function registerMovement(
        $productId,
        $quantity,
        $type, // 'purchase', 'sale', 'return', 'adjustment'
        $unitCost,
        $referenceModel = null,
        $notes = ''
    ) {
        $product = Products::find($productId);

        if (!$product) return null;

        $currentStock = $product->stock ?? 0;
        $newBalance = $currentStock + $quantity;

        $movement = $this->repo->create([
            'id_product'     => $productId,
            'type'           => $type,
            'id_user'        => Auth::id() ?? 1, // Usuario logueado
            'quantity'       => $quantity,
            'unit_cost'      => $unitCost,
            'balance'        => $newBalance, // Stock resultante
            'reference_id'   => $referenceModel ? $referenceModel->getKey() : null,
            'reference_type' => $referenceModel ? get_class($referenceModel) : null,
            'notes'          => $notes
        ]);

        $product->stock = $newBalance;

        if ($type === 'purchase' && $quantity > 0) {
            $product->purchase_price = $unitCost;
        }

        $product->save();

        return $movement;
    }



}
