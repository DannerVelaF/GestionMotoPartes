<?php

namespace App\Http\Services\Sales;

use App\Http\Repositories\Eloquent\Sales\MethodPaymentRepository;
use App\Http\Services\BaseService;

class MethodPaymentService extends BaseService
{
  public function __construct(MethodPaymentRepository $repo)
  {
    parent::__construct($repo);
  }

  public function getAllMethodPayments()
  {
    return $this->repo->all();
  }

  public function findMethodPaymentById($id)
  {
    return $this->repo->find($id);
  }


  public function createMethodPayment(array $data)
  {
    return $this->repo->create($data);
  }

  public function updateMethodPayment($id, array $data)
  {
    return $this->repo->update($id, $data);
  }

  public function deleteMethodPayment($id)
  {
    return $this->repo->delete($id);
  }

  public function deleteMethodPayments($ids)
  {
    return $this->repo->deleteMany($ids);
  }
}
