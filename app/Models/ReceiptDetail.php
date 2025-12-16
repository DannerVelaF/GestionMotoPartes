<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiptDetail extends Model
{
    protected $fillable = [
        'id_receipt',
        'id_product',
        'quantity',
        'unit_price',
        'subtotal'
    ];

    public function product()
    {
        return $this->belongsTo(Products::class, 'id_product', 'id_product');
    }
}
