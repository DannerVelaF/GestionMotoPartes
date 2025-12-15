<?php

namespace App\Http\Repositories\Eloquent\Products;

use App\Http\Repositories\Contracts\Products\ProductBrandRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\Brand;

class ProductBrandRepository extends BaseRepository implements ProductBrandRepositoryInterface
{
    public function __construct(Brand $model){
        parent::__construct($model);
    }
}
