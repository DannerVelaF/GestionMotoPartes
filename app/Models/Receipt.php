<?php

namespace App\Models;

use App\Enums\DocumentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Receipt extends Model
{
    protected $table = 'receipts';
    protected $primaryKey = 'id_receipt';

    protected $fillable = [
        'id_supplier',
        'series',
        'number',
        'issue_date',
        'total_amount',
        "document_type",
        'receipt_path',
        "receipt_code",
        "id_parent",
    ];

    protected function casts(): array
    {
        return [
            'document_type' => DocumentType::class,
        ];
    }

    protected static function booted()
    {
        static::creating(function ($receipt) {
            // Genera algo como: REC-202512-AB12
            $receipt->receipt_code = 'REC-' . now()->format('Ym') . '-' . strtoupper(Str::random(4));
        });
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'id_supplier', 'id_supplier');
    }

    public function details()
    {
        // Una boleta tiene muchas líneas de detalle
        return $this->hasMany(ReceiptDetail::class, "id_receipt", "id_receipt");
    }

    public function products()
    {
        return $this->belongsToMany(Products::class, 'receipt_details')
            ->withPivot('quantity', 'unit_price', 'subtotal');
    }

    public function parent()
    {
        return $this->belongsTo(Receipt::class, 'id_parent');
    }

    // Relación: Documentos Hijos (Las NC generadas a partir de esta factura)
    public function children()
    {
        return $this->hasMany(Receipt::class, 'id_parent');
    }
}
