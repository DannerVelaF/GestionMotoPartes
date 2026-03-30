<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permissions extends Model
{
    protected $primaryKey = 'id_permission';
    protected $table = "permissions";

    protected $fillable = ['name', 'label', 'module'];

    public function roles()
    {
        return $this->belongsToMany(
            Role::class,
            'permission_role',
            'id_permission',
            'id_role'
        );
    }
}
