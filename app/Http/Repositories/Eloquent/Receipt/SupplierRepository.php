<?php

namespace App\Http\Repositories\Eloquent\Receipt;

use App\Http\Repositories\Contracts\Receipt\SupplierRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\Supplier;

class SupplierRepository extends BaseRepository implements SupplierRepositoryInterface
{
    public function __construct(Supplier $model){
        parent::__construct($model);
    }
}
