<?php

namespace App\Http\Repositories\Eloquent\Products;

use App\Http\Repositories\Contracts\Products\ProductCategoryRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\ProductCategory;

class ProductCategoryRepository extends BaseRepository implements ProductCategoryRepositoryInterface
{

    public function __construct(ProductCategory $model){
        parent::__construct($model);
    }

}
