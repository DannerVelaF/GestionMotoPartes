<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MethodPayment extends Model
{
    protected $table = 'method_payments';
    protected $primaryKey = 'id_method_payment';
    protected $fillable = [
        'name_method_payment',
        'status',
    ];

    public function sales()
    {
        return $this->hasMany(Sales::class, 'id_method_payment');
    }
}
