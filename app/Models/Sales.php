<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sales extends Model
{
    protected $primaryKey = 'id_sales';

    protected $fillable = [
        'id_sales',
        "code_sales",
        "date_sales",
        "subtotal",
        "discount",
        "total",
        "tax",
        "status_sales",
        "id_user"
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }


}
