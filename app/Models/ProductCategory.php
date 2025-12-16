<?php

namespace App\Models;

use App\Enums\GenericStatus;
use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    protected $table = 'product_categories';
    protected $primaryKey = 'id_product_category';

    protected $fillable = [
        'name_product_category',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => GenericStatus::class,
        ];
    }
}
