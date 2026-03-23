<?php

namespace App\Models;

use App\Enums\GenericStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Products extends Model
{
    protected $table = 'products';

    protected $primaryKey = 'id_product';

    protected $fillable = [
        'product_name',
        'product_code',
        'status',
        'stock',
        'sale_price',
        'purchase_price',
        'notes',
        'url_image',
        'id_category',
        'id_brand',
        'id_product_type',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos.
     */
   protected $casts = [
       'sale_price' => 'decimal:2',
       'purchase_price' => 'decimal:2',
       'stock' => 'decimal:2',
   ];

    /*
    |--------------------------------------------------------------------------
    | Relaciones
    |--------------------------------------------------------------------------
    */

    /**
     * Relación con Categoría
     */
    public function category(): BelongsTo
    {
        // belongsTo(Modelo, Foreign Key local, Owner Key en la otra tabla)
        return $this->belongsTo(ProductCategory::class, 'id_category', 'id_product_category');
    }

    /**
     * Relación con Marca
     * Se asume que el modelo se llama Brand
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'id_brand', 'id_brand');
    }

    /**
     * Relación con Tipo de Producto
     * Se asume que el modelo se llama ProductType
     */
    public function productType(): BelongsTo
    {
        return $this->belongsTo(ProductType::class, 'id_product_type', 'id_product_type');
    }


    public function movements()
    {
        // Asumiendo que tu tabla es 'inventory_movements' y la llave foránea 'id_product'
        return $this->hasMany(InventoryMovements::class, 'id_product')->orderBy('created_at', 'desc');
    }

}
