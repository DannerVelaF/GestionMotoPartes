<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleDetail extends Model
{
    protected $primaryKey = 'id_sales_detail';
    protected $table = 'sale_details';

    protected $fillable = [
        'id_sales',
        'id_product',
        'id_tax',
        'id_user',
        'quantity',
        'unit_price',
        'tax_amount',
        'cost',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sales::class, "id_sales");
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Products::class, "id_product");
    }

    // ✅ Relación con Impuestos
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Taxes::class, "id_tax");
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
