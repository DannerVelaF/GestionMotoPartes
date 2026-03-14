<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderLog extends Model
{
    protected $table = 'purchase_order_logs';

    protected $fillable = [
        'id_purchase_order',
        'id_user',
        'action',
        'field_changed',
        'old_value',
        'new_value',
        'notes'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }
}
