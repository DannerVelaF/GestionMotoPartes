<?php

namespace App\Models;

use App\Enums\GenericStatus;
use Illuminate\Database\Eloquent\Model;

class ProductType extends Model
{
    protected $table = 'product_types';
    protected $primaryKey = 'id_product_type';

    protected $fillable = [
        'name_product_type',
        "status",
    ];
    protected function casts(): array
    {
        return [
            'status' => GenericStatus::class,
        ];
    }
}
