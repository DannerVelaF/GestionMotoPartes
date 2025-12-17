<?php

namespace App\Http\Repositories\Eloquent\Sales;

use App\Http\Repositories\Contracts\Sales\SalesRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\Sales;

class SalesRepository extends BaseRepository implements SalesRepositoryInterface
{
    public function __construct(Sales $model){
        parent::__construct($model);
    }
}
