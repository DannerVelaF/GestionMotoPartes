<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Taxes extends Model
{
    use HasFactory;

    protected $table = 'taxes';

    protected $primaryKey = 'id_tax';

    /**
     * Los atributos que se pueden asignar masivamente.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'percentage',
        'scope',      // 'purchase', 'sale', 'both'
        'is_active',
    ];

    /**
     * Los atributos que deben ser casteados.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'percentage' => 'decimal:2',
        'is_active'  => 'boolean',
    ];

    // --- RELACIONES OPCIONALES ---

    /**
     * Ejemplo: Un impuesto puede estar asociado a muchos detalles de orden de compra
     */
    public function purchaseOrderDetails()
    {
        // Esto asumiendo que agregaste 'id_tax' a la tabla purchase_order_details
        return $this->hasMany(PurchaseOrderDetail::class, 'id_tax', 'id_tax');
    }
}
