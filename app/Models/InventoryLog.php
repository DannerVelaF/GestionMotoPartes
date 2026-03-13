<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    protected $table = 'inventory_logs';

    protected $fillable = [
        'id_adjustment',
        'id_user',
        'action',
        'field_changed', // NUEVO
        'old_value',     // NUEVO
        'new_value',     // NUEVO
        'notes'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }
}
