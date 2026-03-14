<?php

namespace App\Http\Repositories\Eloquent\PurchaseOrder;

use App\Http\Repositories\Contracts\PurchaseOrder\PurchaseOrderRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\PurchaseOrder;

class PurchaseOrderRepository extends BaseRepository implements PurchaseOrderRepositoryInterface
{
  public function __construct(PurchaseOrder $model)
  {
    parent::__construct($model);
  }
}
