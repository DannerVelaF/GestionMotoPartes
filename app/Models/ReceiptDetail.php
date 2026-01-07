<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiptDetail extends Model
{
    protected $table = 'receipt_details';
    protected $primaryKey = 'id_receipt_detail';

    protected $fillable = [
        'id_receipt',
        'id_product',
        'description',
        'quantity',
        'unit_price',
        'sale_price',
        'subtotal'
    ];

    public function product()
    {
        return $this->belongsTo(Products::class, 'id_product', 'id_product');
    }
}
