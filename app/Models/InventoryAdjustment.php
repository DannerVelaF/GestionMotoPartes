<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryAdjustment extends Model
{
    protected $table = 'inventory_adjustments';
    protected $primaryKey = 'id_adjustment';

    protected $fillable = [
        'reference_code',
        'operation_type',
        'kardex_date',
        'reason',
        'location',
        'contact_name',      // NUEVO
        'document_type',     // NUEVO
        'document_number',   // NUEVO
        'exchange_rate',     // NUEVO
        'status',
        'id_user'
    ];
    /**
     * Relación: Obtener el usuario responsable de este ajuste.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }

    /**
     * Relación Polimórfica: Obtener todos los movimientos del Kardex 
     * que pertenecen a este documento de ajuste.
     */
    public function movements()
    {
        return $this->morphMany(InventoryMovements::class, 'reference');
    }

    public function logs()
    {
        return $this->hasMany(InventoryLog::class, 'id_adjustment', 'id_adjustment')->orderBy('created_at', 'desc');
    }
}
