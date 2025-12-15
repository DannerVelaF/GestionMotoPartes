<?php

namespace App\Http\Services\Products;

use App\Http\Repositories\Contracts\BaseRepositoryInterface;
use App\Http\Repositories\Eloquent\Products\ProductCategoryRepository;
use App\Http\Services\BaseService;

class ProductCategoryService extends BaseService
{
    public function __construct(ProductCategoryRepository $repo)
    {
        parent::__construct($repo);
    }

    public function getProductCategories(){
        return $this->repo->all();
    }

    public function createProductCategory(array $data){
        return $this->repo->create($data);
    }

    public function deleteProductCategory($id){
        return $this->repo->delete($id);
    }

    public function deleteProductCategories($ids){
        return $this->repo->deleteMany($ids);
    }
}
