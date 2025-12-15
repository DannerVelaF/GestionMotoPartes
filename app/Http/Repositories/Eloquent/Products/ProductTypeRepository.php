<?php

namespace App\Http\Repositories\Eloquent\Products;

use App\Http\Repositories\Contracts\Products\ProductTypeRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\ProductType;

class ProductTypeRepository extends BaseRepository implements ProductTypeRepositoryInterface
{
    public function __construct(ProductType $model){
        parent::__construct($model);
    }
}
