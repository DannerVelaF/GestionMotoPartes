<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderDetail extends Model
{
    protected $table = 'purchase_order_details';
    protected $primaryKey = 'id_po_detail';

    protected $fillable = [
        'id_purchase_order',
        'id_product',
        'description',
        'quantity',
        'received_quantity',
        'billed_quantity', // <-- Agregados aquí
        'unit_cost',
        'subtotal',
        'margin_percentage',
        'suggested_sale_price',
        "id_tax"
    ];
    public function product()
    {
        return $this->belongsTo(Products::class, 'id_product', 'id_product');
    }
    public function tax()
    {
        return $this->belongsTo(Taxes::class, 'id_tax');
    }
}
