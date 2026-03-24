<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleLog extends Model
{
    protected $table = 'sale_logs';
    protected $primaryKey = 'id_sale_log';

    protected $fillable = [
        'id_sales',
        'id_user',
        'action',
        'field_changed',
        'old_value',
        'new_value',
        'notes',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sales::class, 'id_sales');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
