<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiptLog extends Model {
    protected $table = 'receipt_logs';
    protected $primaryKey = 'id_receipt_log';

    protected $fillable = [
        'id_receipt',
        'id_user',
        'action',
        'field_changed',
        'old_value',
        'new_value',
        'notes'
    ];

    public function user() {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function receipt() {
        return $this->belongsTo(Receipt::class, 'id_receipt');
    }
}
