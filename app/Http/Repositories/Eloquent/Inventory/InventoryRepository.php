<?php

namespace App\Http\Repositories\Eloquent\Inventory;

use App\Http\Repositories\Contracts\Inventory\InventoryRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\InventoryMovements;

class InventoryRepository extends BaseRepository implements InventoryRepositoryInterface
{
    public function __construct(InventoryMovements $model){
        parent::__construct($model);
    }
}
