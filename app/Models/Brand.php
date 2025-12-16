<?php

namespace App\Models;

use App\Enums\GenericStatus;
use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    protected $table = 'brands';
    protected $primaryKey = 'id_brand';

    protected $fillable = ['name_brand', 'status'];
    protected function casts(): array
    {
        return [
            'status' => GenericStatus::class,
        ];
    }
}
