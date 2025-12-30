<?php

namespace App\Models;

use App\Enums\DocumentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sales extends Model
{
    protected $primaryKey = 'id_sales';
    protected $table = 'sales';

    protected $fillable = [
        "code_sales",
        "date_sales",
        "subtotal",
        "discount",
        "total",
        "tax",
        'document_type',
        'series',
        'number',
        "id_method_payment",
        "receiver_id_number",
        "receiver_name",
        "receiver_address",
        "status",
        "id_user"
    ];
    protected function casts(): array
    {
        return [
            'document_type' => DocumentType::class,
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
}
