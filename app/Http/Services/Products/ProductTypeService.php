<?php

namespace App\Http\Services\Products;

use App\Http\Repositories\Contracts\Products\ProductTypeRepositoryInterface;
use App\Http\Repositories\Eloquent\Products\ProductTypeRepository;
use App\Http\Services\BaseService;

class ProductTypeService extends BaseService
{
    public function __construct(ProductTypeRepository $repo)
    {
        parent::__construct($repo);
    }

    public function createProductType(array $data){
        return $this->repo->create($data);
    }

    public function deleteProductType($id){
        return $this->repo->delete($id);
    }

    public function deleteProductTypes($ids){
        return $this->repo->deleteMany($ids);
    }

}
