<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $primaryKey = 'id_supplier';
    protected $table = 'suppliers';
    protected $fillable = [
        'type',
        'company_name',
        'ruc',
        'supplier_name',
        'supplier_email',
        'supplier_phone',
    ];
}
