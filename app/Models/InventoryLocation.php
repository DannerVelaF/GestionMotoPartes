<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLocation extends Model
{
    protected $table = 'inventory_locations';
    protected $primaryKey = 'id_location';

    // Si activaste los timestamps en la migración, déjalo en true (recomendado)
    public $timestamps = true;

    protected $fillable = [
        'name',
        'type', // internal, view, supplier, customer, inventory, loss
        'parent_id',
        'active',
    ];

    /**
     * Relación con la ubicación padre (jerarquía)
     */
    public function parent()
    {
        return $this->belongsTo(InventoryLocation::class, 'parent_id', 'id_location');
    }

    /**
     * Relación con las sub-ubicaciones
     */
    public function children()
    {
        return $this->hasMany(InventoryLocation::class, 'parent_id', 'id_location');
    }
}
