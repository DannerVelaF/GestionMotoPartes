<?php

namespace App\Http\Repositories\Eloquent\Sales;

use App\Http\Repositories\Contracts\Sales\MethodPaymentRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\MethodPayment;

class MethodPaymentRepository extends BaseRepository implements MethodPaymentRepositoryInterface
{
  public function __construct(MethodPayment $model)
  {
    parent::__construct($model);
  }
}
