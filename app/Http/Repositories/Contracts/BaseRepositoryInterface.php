<?php

namespace App\Http\Repositories\Contracts;

/**
 * Interface BaseRepositoryInterface
 *
 * Define el contrato estándar para las operaciones CRUD básicas
 * que deben implementar los repositorios.
 *
 * @package App\Http\Repositories\Contracts
 */
interface BaseRepositoryInterface
{
    /**
     * Obtiene todos los registros del modelo.
     *
     * @param array $columns Columnas específicas a seleccionar (por defecto todas '*').
     * @return Collection Retorna una colección de modelos.
     */
    public function all(array $columns = ['*']);

    /**
     * Busca un registro por su identificador único (ID).
     *
     * @param int|string $id El identificador del registro.
     * @return Model Retorna la instancia del modelo encontrado.
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException Si no se encuentra el registro.
     */
    public function find($id);

    /**
     * Crea un nuevo registro en la base de datos.
     *
     * @param array $data Los datos para crear el registro.
     * @return Model Retorna la instancia del modelo recién creado.
     */
    public function create(array $data);

    /**
     * Actualiza un registro existente identificado por su ID.
     *
     * @param int|string $id El identificador del registro a actualizar.
     * @param array $data Los nuevos datos a guardar.
     * @return Model Retorna la instancia del modelo actualizado.
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException Si no se encuentra el registro.
     */
    public function update($id, array $data);

    /**
     * Elimina un registro de la base de datos por su ID.
     *
     * @param int|string $id El identificador del registro a eliminar.
     * @return bool|null Retorna true si se eliminó, o null/false si falló.
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException Si no se encuentra el registro.
     */
    public function delete($id);

    /**
     * Elimina multiples regsitros de la base de datos por su ID
     * @param array $ids
     * @return mixed
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException Si no se encuentra el registro.
     */

    public function deleteMany(array $ids);

    // Opcional: Si necesitas buscar antes de borrar (para borrar archivos)
    public function whereIn($column, array $values);

}
