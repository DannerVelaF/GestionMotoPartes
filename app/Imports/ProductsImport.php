<?php

namespace App\Imports;

use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentDetail;
use App\Models\InventoryLog;
use App\Models\Products;
use App\Models\ProductCategory;
use App\Models\Brand;
use App\Models\ProductType;
use App\Models\InventoryMovements;
use App\Enums\GenericStatus;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class ProductsImport implements ToModel, WithHeadingRow, WithValidation
{
    public $rows = 0;
    protected $adjustmentId = null;

    public function model(array $row)
    {
        $this->rows++;

        return DB::transaction(function () use ($row) {
            $currentUserId = Auth::id() ?? 1;

            if (!$this->adjustmentId) {
                $opType = \App\Models\InventoryOperationType::where('code', 'INIT')->first();

                $adjustment = InventoryAdjustment::create([
                    'reference_code'          => 'ADJ-INIT-' . strtoupper(Str::random(5)),
                    'id_user'                 => $currentUserId,
                    'status'                  => 'done',
                    'reason'                  => 'Carga Inicial por Importación Excel',
                    'kardex_date'             => now(),
                    'exchange_rate'           => 1.000,
                    'id_operation_type'       => $opType->id_operation_type ?? 4,
                    'id_location_source'      => $opType->default_location_source_id ?? null,
                    'id_location_destination' => $opType->default_location_destination_id ?? null,
                ]);
                $this->adjustmentId = $adjustment->id_adjustment;

                // ✅ LOG DE CREACIÓN DEL AJUSTE (Manejando los nuevos campos como null o descriptivos)
                InventoryLog::create([
                    'id_adjustment' => $this->adjustmentId,
                    'id_user'       => $currentUserId,
                    'action'        => 'Creación',
                    'field_changed' => 'status',
                    'old_value'     => null,
                    'new_value'     => 'done',
                    'notes'         => 'Ajuste de inventario generado automáticamente por carga masiva.'
                ]);
            }

            $code = $row['codigo'] ?? 'PROD-' . strtoupper(Str::random(8));
            $precioCompra = (float)($row['precio_compra'] ?? 0);

            $product = Products::create([
                'product_name'    => ucfirst(strtolower(trim($row['nombre']))),
                'product_code'    => $code,
                'status'          => GenericStatus::ACTIVE,
                'stock'           => (float)($row['stock'] ?? 0),
                'sale_price'      => (float)($row['precio_venta'] ?? 0),
                'purchase_price'  => $precioCompra,
                'notes'           => $row['notas'] ?? null,
                'id_category'     => $row['id_category_final'],
                'id_brand'        => $row['id_brand_final'],
                'id_product_type' => $row['id_type_final'],
            ]);

            if ($product->stock > 0) {
                InventoryAdjustmentDetail::create([
                    'id_adjustment' => $this->adjustmentId,
                    'id_product'    => $product->id_product,
                    'quantity'      => $product->stock,
                    'unit_cost'     => $precioCompra,
                    'type'          => 'ingreso'
                ]);

                InventoryMovements::create([
                    'id_product'     => $product->id_product,
                    'id_user'        => $currentUserId,
                    'type'           => 'ingreso',
                    'quantity'       => $product->stock,
                    'unit_cost'      => $precioCompra,
                    'balance'        => $product->stock,
                    'reference_type' => InventoryAdjustment::class,
                    'reference_id'   => $this->adjustmentId,
                    'notes'          => 'Stock Inicial via Carga Masiva',
                    'kardex_date'    => now(),
                ]);
            }

            return null;
        });
    }

    public function prepareForValidation($data, $index)
    {
        // Normalizamos los nombres de las columnas para que coincidan con la lógica interna
        $data['precio_venta'] = $data['precio_venta'] ?? 0;
        $data['precio_compra'] = $data['precio_compra'] ?? 0;

        $categoriaNombre = ucfirst(strtolower(trim($data['categoria'] ?? 'General')));
        $marcaNombre     = ucfirst(strtolower(trim($data['marca'] ?? 'Genérico')));
        $tipoNombre      = ucfirst(strtolower(trim($data['tipo'] ?? 'Repuesto')));

        $data['id_category_final'] = ProductCategory::firstOrCreate(
            ['name_product_category' => $categoriaNombre],
            ['status' => GenericStatus::ACTIVE]
        )->id_product_category;

        $data['id_brand_final'] = Brand::firstOrCreate(
            ['name_brand' => $marcaNombre],
            ['status' => GenericStatus::ACTIVE]
        )->id_brand;

        $data['id_type_final'] = ProductType::firstOrCreate(
            ['name_product_type' => $tipoNombre],
            ['status' => GenericStatus::ACTIVE]
        )->id_product_type;

        return $data;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255|unique:products,product_name',
            'codigo' => 'nullable|unique:products,product_code',
            'precio_venta' => 'required|numeric|min:0',
            'precio_compra' => 'nullable|numeric|min:0', // ✅ Validación nueva
            'stock'  => 'required|integer|min:0',
            'id_category_final' => 'required|exists:product_categories,id_product_category',
            'id_brand_final'    => 'required|exists:brands,id_brand',
            'id_type_final'     => 'required|exists:product_types,id_product_type',
        ];
    }
}
