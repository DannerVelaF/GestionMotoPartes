<?php

namespace App\Imports;

use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentDetail;
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
    // ✅ DEBEMOS DECLARAR LA PROPIEDAD AQUÍ
    protected $adjustmentId = null;

    public function model(array $row)
    {
        $this->rows++;

        return DB::transaction(function () use ($row) {
            if (!$this->adjustmentId) {
                // Buscamos el tipo de operación que creamos en el seeder
                $opType = \App\Models\InventoryOperationType::where('code', 'INIT')->first();

                $adjustment = InventoryAdjustment::create([
                    'reference_code'          => 'ADJ-INIT-' . strtoupper(Str::random(5)),
                    'id_user'                 => Auth::id() ?? 1,
                    'status'                  => 'done',
                    'reason'                  => 'Carga Inicial por Importación Excel',
                    'kardex_date'             => now(),
                    'exchange_rate'           => 1.000,
                    // ✅ ASIGNAMOS LAS UBICACIONES DESDE EL TIPO DE OPERACIÓN
                    'id_operation_type'       => $opType->id_operation_type ?? 4,
                    'id_location_source'      => $opType->default_location_source_id ?? null,
                    'id_location_destination' => $opType->default_location_destination_id ?? null,
                ]);
                $this->adjustmentId = $adjustment->id_adjustment;
            }

            $code = $row['codigo'] ?? 'PROD-' . strtoupper(Str::random(8));

            $product = Products::create([
                'product_name'    => ucfirst(strtolower(trim($row['nombre']))),
                'product_code'    => $code,
                'status'          => GenericStatus::ACTIVE,
                'stock'           => $row['stock'] ?? 0,
                'sale_price'      => $row['precio'] ?? 0,
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
                    'type'          => 'ingreso'
                ]);

                InventoryMovements::create([
                    'id_product'     => $product->id_product,
                    'id_user'        => Auth::id() ?? 1,
                    'type'           => 'ingreso',
                    'quantity'       => $product->stock,
                    'unit_cost'      => 0,
                    'balance'        => $product->stock,
                    'reference_type' => InventoryAdjustment::class,
                    'reference_id'   => $this->adjustmentId,
                    'notes'          => 'Stock Inicial via Carga Masiva'
                ]);
            }

            return null;
        });
    }

    public function prepareForValidation($data, $index)
    {
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
            'nombre' => [
                'required',
                'string',
                'max:255',
                'unique:products,product_name'
            ],
            'codigo' => [
                'nullable',
                'unique:products,product_code'
            ],
            'precio' => 'required|numeric|min:0',
            'stock'  => 'required|integer|min:0',
            'id_category_final' => 'required|exists:product_categories,id_product_category',
            'id_brand_final'    => 'required|exists:brands,id_brand',
            'id_type_final'     => 'required|exists:product_types,id_product_type',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'nombre.required' => 'El nombre del producto es obligatorio.',
            'nombre.unique'   => 'El producto ":input" ya existe en el sistema.',
            'codigo.unique'   => 'El código ":input" ya está asignado.',
            'precio.required' => 'El precio es obligatorio.',
            'stock.required'  => 'El stock es obligatorio.',
        ];
    }
}
