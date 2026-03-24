<?php

namespace App\Models;

use App\Enums\DocumentType;
use App\Enums\SalesStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sales extends Model
{
    protected $primaryKey = 'id_sales';
    protected $table = 'sales';

    protected $fillable = [
        "code_sales", "date_sales", "subtotal", "tax", "discount", "total",
        "id_method_payment", "receiver_id_number", "receiver_name",
        "receiver_address", "status", "id_user", "completed_at"
    ];



    protected function casts(): array
    {
        return [
            'document_type' => DocumentType::class,
            'status'        => SalesStatus::class,
            'date_sales'    => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function details(): HasMany
    {
        return $this->hasMany(SaleDetail::class, "id_sales");
    }

    public function methodPayment(): BelongsTo
    {
        return $this->belongsTo(MethodPayment::class, 'id_method_payment');
    }

    public function receipt()
    {
        return $this->hasOne(Receipt::class, 'id_sales');
    }
    public function logs(): HasMany
    {
        return $this->hasMany(SaleLog::class, 'id_sales')->orderBy('created_at', 'desc');
    }
}
