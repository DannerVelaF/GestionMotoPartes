<?php

namespace App\Http\Repositories\Eloquent\Products;

use App\Http\Repositories\Contracts\Products\ProductRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\Products;

class ProductRepository extends BaseRepository implements ProductRepositoryInterface
{
    public function __construct(Products $model){
        parent::__construct($model);
    }

}
