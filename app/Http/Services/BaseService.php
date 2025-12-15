<?php

namespace App\Http\Services;

use App\Http\Repositories\Contracts\BaseRepositoryInterface;

class BaseService
{
    protected BaseRepositoryInterface $repo;

    public function __construct(BaseRepositoryInterface $repo){
        $this->repo = $repo;
    }

    public function listar()
    {
        return $this->repo->all();
    }

    public function obtener($id)
    {
        return $this->repo->find($id);
    }

    public function crear(array $data){
        return $this->repo->create($data);
    }

    public function actualizar($id, array $data){
        return $this->repo->update($id, $data);
    }

    public function eliminar($id){
        return $this->repo->delete($id);
    }

    public function eliminarMany(array $ids)
    {
        return $this->repo->deleteMany($ids);
    }



}
