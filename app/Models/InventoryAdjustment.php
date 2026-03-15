<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryAdjustment extends Model
{
    protected $table = 'inventory_adjustments';
    protected $primaryKey = 'id_adjustment';

    protected $fillable = [
        'reference_code',
        'id_operation_type', // Relación con tabla de tipos
        'id_location_source',      // DE (Ubicación Origen)
        'id_location_destination', // PARA (Ubicación Destino)
        'kardex_date',
        'reason',
        'contact_name',
        'document_type',      // Podría ser ID también si lo haces tabla
        'document_number',
        'exchange_rate',
        'status',             // draft, ready, done, cancelled
        'id_user',
        'source_document_id',   // ID de la OC de origen (opcional para link directo)
        'source_document_type'  // Modelo de la OC (Polimórfico)
    ];

    /**
     * Tipo de Operación (Ej: Recepción por Compras, Ajuste Manual)
     */
    public function operationType()
    {
        return $this->belongsTo(InventoryOperationType::class, 'id_operation_type');
    }

    /**
     * Ubicación de Origen (DE)
     */
    public function locationSource()
    {
        return $this->belongsTo(InventoryLocation::class, 'id_location_source');
    }

    /**
     * Ubicación de Destino (PARA)
     */
    public function locationDestination()
    {
        return $this->belongsTo(InventoryLocation::class, 'id_location_destination');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }

    public function movements()
    {
        return $this->morphMany(InventoryMovements::class, 'reference');
    }

    public function logs()
    {
        return $this->hasMany(InventoryLog::class, 'id_adjustment', 'id_adjustment')->orderBy('created_at', 'desc');
    }

    /**
     * Relación con el documento que originó esto (La Orden de Compra)
     */
    public function source()
    {
        return $this->morphTo('source_document');
    }
}
