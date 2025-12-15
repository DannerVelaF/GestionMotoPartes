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

        // 1. Calcular nuevo balance (Stock)
        // Si es compra o devolución, suma. Si es venta, resta (la cantidad debe venir con signo desde el origen o manejarse aquí)
        // Para simplificar: Asumimos que $quantity ya trae el signo correcto.
        // Compra: +10, Venta: -5, Anulación de Compra: -10
        $currentStock = $product->stock ?? 0;
        $newBalance = $currentStock + $quantity;

        // 2. Crear Movimiento (Kardex)
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

        // 3. Actualizar Producto Maestro
        $product->stock = $newBalance;

        // Si es una compra positiva, actualizamos el costo de compra referencial
        if ($type === 'purchase' && $quantity > 0) {
            $product->purchase_price = $unitCost;
        }

        $product->save();

        return $movement;
    }



}
