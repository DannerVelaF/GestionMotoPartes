<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryMovements extends Model
{
    protected $table = 'inventory_movements';
    protected $primaryKey = 'id_movement';

    protected $fillable = [
        'id_product',
        'type',
        'id_user',
        'kardex_date',
        'quantity',
        'unit_cost',
        'total_cost',
        'balance',
        'reference_id',
        'reference_type',
        'notes'
    ];

    public function product()
    {
        return $this->belongsTo(Products::class, 'id_product', 'id_product');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }

    // Para obtener el documento origen (Ej. El Recibo)
    public function reference()
    {
        return $this->morphTo();
    }
}
