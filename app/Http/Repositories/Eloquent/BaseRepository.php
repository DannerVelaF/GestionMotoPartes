<?php

namespace App\Http\Repositories\Eloquent;

use App\Http\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

/**
 * Class BaseRepository
 *
 * Implementación concreta del repositorio base utilizando Eloquent ORM.
 * Esta clase sirve como padre para otros repositorios específicos.
 *
 * @package App\Http\Repositories\Eloquent
 */
class BaseRepository implements BaseRepositoryInterface
{
    /**
     * La instancia del modelo sobre el que actúa el repositorio.
     *
     * @var Model
     */
    protected Model $model;

    /**
     * Constructor del repositorio.
     *
     * Inyecta el modelo Eloquent correspondiente.
     *
     * @param Model $model
     */
    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * {@inheritDoc}
     */
    public function all(array $columns = ['*'])
    {
        return $this->model->all($columns);
    }

    /**
     * {@inheritDoc}
     */
    public function find($id)
    {
        return $this->model->findOrFail($id);
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data)
    {
        return $this->model->create($data);
    }

    /**
     * {@inheritDoc}
     */
    public function update($id, array $data)
    {
        $record = $this->find($id);
        $record->update($data);
        return $record;
    }

    /**
     * {@inheritDoc}
     */
    public function delete($id)
    {
        $record = $this->find($id);
        return $record->delete();
    }


    /**
     * (@inheritDoc)
     */
    public function deleteMany(array $ids)
    {
        return $this->model->destroy($ids);
    }

    /**
     * (@inheritDoc)
     */
    public function whereIn($column, array $values)
    {
        return $this->model->whereIn($column, $values);
    }

}
