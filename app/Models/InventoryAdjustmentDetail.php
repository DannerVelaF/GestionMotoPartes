<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryAdjustmentDetail extends Model
{
    protected $primaryKey = 'id_adjustment_detail';
    protected $fillable = ['id_adjustment', 'id_product', 'demand', 'quantity', 'unit_cost'];

    public function product()
    {
        return $this->belongsTo(Products::class, 'id_product', 'id_product');
    }
}
