<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'label',
        'description',
    ];

    /**
     * Obtener los usuarios que tienen este rol.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function permissions()
    {
        return $this->belongsToMany(
            Permissions::class,
            'permission_role', // Nombre de la tabla en tu migración
            'id_role',         // Llave de este modelo en la tabla pivote
            'id_permission'    // Llave del modelo relacionado
        );
    }

    /**
     * Verifica si el rol tiene un permiso específico
     */
    public function hasPermission(string $permissionName): bool
    {
        return $this->permissions->contains('name', $permissionName);
    }
}
