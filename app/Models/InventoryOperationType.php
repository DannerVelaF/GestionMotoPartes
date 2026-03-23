<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryOperationType extends Model
{
    protected $table = 'inventory_operation_types';
    protected $primaryKey = 'id_operation_type';

    public $timestamps = true;

    protected $fillable = [
        'name',
        'code', // IN, OUT, INT
        'default_location_source_id',
        'default_location_destination_id',
        'sequence_prefix',
        'return_operation_type_id',
    ];

    /**
     * Ubicación de Origen por defecto (DE)
     */
    public function defaultSource()
    {
        return $this->belongsTo(InventoryLocation::class, 'default_location_source_id', 'id_location');
    }

    /**
     * Ubicación de Destino por defecto (PARA)
     */
    public function defaultDestination()
    {
        return $this->belongsTo(InventoryLocation::class, 'default_location_destination_id', 'id_location');
    }

    /**
     * Ajustes/Movimientos asociados a este tipo
     */
    public function adjustments()
    {
        return $this->hasMany(InventoryAdjustment::class, 'id_operation_type', 'id_operation_type');
    }

    public function returnType()
    {
        return $this->belongsTo(InventoryOperationType::class, 'return_operation_type_id', 'id_operation_type');
    }
}
