<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleDetail extends Model
{
    protected $primaryKey = 'id_sales_detail';
    protected $table = 'sale_details';

    protected $fillable = [
        'id_sales',
        'id_product',
        'quantity',
        'unit_price',
        "id_user"
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sales::class, "id_sales");
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Products::class, "id_product");
    }
}
