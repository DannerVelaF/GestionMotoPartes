<?php

namespace App\Http\Services;

use App\Http\Repositories\Eloquent\RoleRepository;
use Illuminate\Support\Str;

class RoleService extends BaseService
{
  public function __construct(RoleRepository $repo)
  {
    parent::__construct($repo);
  }

  /**
   * Obtener todos los roles
   */
  public function getRoles()
  {
    return $this->repo->all();
  }

  /**
   * Crear un nuevo rol
   */
  public function createRole(array $data)
  {
    // Buena práctica: Asegurar que el 'name' (slug) sea seguro para BD
    // Ej: "Jefe de Almacén" -> "jefe_de_almacen"
    if (isset($data['name'])) {
      $data['name'] = Str::slug($data['name'], '_');
    }

    return $this->repo->create($data);
  }

  /**
   * Actualizar un rol existente
   */
  public function updateRole($id, array $data)
  {
    // Aplicamos la misma lógica de slug al actualizar
    if (isset($data['name'])) {
      $data['name'] = Str::slug($data['name'], '_');
    }

    return $this->repo->update($id, $data);
  }

  /**
   * Eliminar un rol individualmente
   */
  public function deleteRole($id)
  {
    // Opcional: Podrías validar aquí si el rol tiene usuarios asignados antes de borrar
    // if ($this->repo->find($id)->users()->exists()) { throw ... }

    return $this->repo->delete($id);
  }

  /**
   * Eliminar múltiples roles (Acción masiva)
   */
  public function deleteRoles(array $ids)
  {
    // Asumiendo que tu BaseRepository tiene el método deleteMany o destroy
    return $this->repo->deleteMany($ids);
  }
}
