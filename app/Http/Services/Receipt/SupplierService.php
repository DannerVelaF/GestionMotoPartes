<?php

namespace App\Http\Services\Receipt;

use App\Http\Repositories\Eloquent\Receipt\SupplierRepository;
use App\Http\Services\BaseService;

class SupplierService extends BaseService
{

    public function __construct(SupplierRepository $repo)
    {
        parent::__construct($repo);
    }

    public function createSupplier(array $data){
        return $this->repo->create($data);
    }

    public function updateSupplier(array $data){
        return $this->repo->update($data);
    }

    public function deleteSupplier($id){
        return $this->repo->delete($id);
    }

    public function getSupplierById($id){
        return $this->repo->find($id);
    }

    public function deleteSuppliers($ids){
        return $this->repo->deleteMany($ids);
    }

}
