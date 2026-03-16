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
        "currency",
        "exchange_rate",
        "id_purchase_order",
        "glosa",
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
        return $this->belongsToMany(Products::class, 'receipt_details', 'id_receipt', 'id_product')
            ->withPivot('quantity', 'unit_price', 'description');
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

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'id_purchase_order');
    }

    // Relación con el Movimiento de Almacén (Recepción)
    public function adjustment()
    {
        return $this->belongsTo(InventoryAdjustment::class, 'id_adjustment');
    }

    public function logs()
    {
        return $this->hasMany(ReceiptLog::class, 'id_receipt')->orderBy('created_at', 'desc');
    }
}
