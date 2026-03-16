<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $table = 'purchase_orders';
    protected $primaryKey = 'id_purchase_order';

    protected $fillable = [
        'po_code',
        'order_type',
        'id_supplier',
        'id_user',          // El creador/comprador
        'requested_by',     // Usuario que solicita aprobación
        'approved_by',      // Usuario que aprueba
        'issue_date',       // Fecha de emisión
        'approved_at',      // Fecha de aprobación
        'expected_date',    // Fecha llegada esperada
        'actual_arrival_date', // Fecha llegada real
        'currency',
        'exchange_rate',
        'total_amount',
        'status',
        'notes',
        'attachment_path'
    ];

    // Para que Eloquent trate estos campos como objetos Carbon (fechas) automáticamente
    protected $casts = [
        'issue_date' => 'date',
        'expected_date' => 'date',
        'actual_arrival_date' => 'date',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    // --- RELACIONES ---

    // Usuario que creó la orden
    public function creator()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    // Usuario que solicitó la aprobación
    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    // Usuario que aprobó la orden
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'id_supplier', 'id_supplier');
    }

    public function details()
    {
        return $this->hasMany(PurchaseOrderDetail::class, 'id_purchase_order', 'id_purchase_order');
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class, 'id_purchase_order', 'id_purchase_order');
    }

    public function logs()
    {
        return $this->hasMany(PurchaseOrderLog::class, 'id_purchase_order', 'id_purchase_order')
            ->orderBy('created_at', 'desc');
    }

    // Relación polimórfica inversa para obtener las recepciones (Ajustes de Inventario)
    public function inventoryAdjustments()
    {
        return $this->morphMany(InventoryAdjustment::class, 'source_document');
    }

    // --- ACCESORES ÚTILES ---

    // Para obtener la fecha de creación legible (mapeo implícito)
    public function getFormattedCreatedAtAttribute()
    {
        return $this->created_at->format('d/m/Y H:i');
    }
}
