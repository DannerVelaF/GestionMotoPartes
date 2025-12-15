<?php

namespace App\Http\Services\Products;

use App\Http\Repositories\Eloquent\Products\ProductBrandRepository;
use App\Http\Services\BaseService;

class ProductBrandService extends BaseService
{
    public function __construct(ProductBrandRepository $repo)
    {
        parent::__construct($repo);
    }

    public function createProductBrand(array $data){
        return $this->repo->create($data);
    }

    public function deleteProductBrand($id){
        return $this->repo->delete($id);
    }

    public function deleteProductBrands($ids){
        return $this->repo->deleteMany($ids);
    }

}
