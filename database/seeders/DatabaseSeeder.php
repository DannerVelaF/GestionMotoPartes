<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Models\Products;
use App\Models\Supplier;
use App\Enums\GenericStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Limpieza de tablas relacionadas a productos y proveedores
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        $tables = [
            'products',
            'suppliers',
            'brands',
            'product_categories',
            'product_types'
        ];
        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Crear Categorías
        $catAbarrotes = ProductCategory::create(['name_product_category' => 'Abarrotes', 'status' => GenericStatus::ACTIVE]);
        $catLimpieza  = ProductCategory::create(['name_product_category' => 'Limpieza', 'status' => GenericStatus::ACTIVE]);
        $catBebidas   = ProductCategory::create(['name_product_category' => 'Bebidas', 'status' => GenericStatus::ACTIVE]);

        // 2. Crear Marcas
        $brandPrimor  = Brand::create(['name_brand' => 'Primor', 'status' => GenericStatus::ACTIVE]);
        $brandGloria  = Brand::create(['name_brand' => 'Gloria', 'status' => GenericStatus::ACTIVE]);
        $brandAce     = Brand::create(['name_brand' => 'Ace', 'status' => GenericStatus::ACTIVE]);
        $brandCielo   = Brand::create(['name_brand' => 'Cielo', 'status' => GenericStatus::ACTIVE]);

        // 3. Crear Tipos de Producto
        $typeConsumo = ProductType::create(['name_product_type' => 'Consumo Masivo', 'status' => GenericStatus::ACTIVE]);
        $typeLiquido = ProductType::create(['name_product_type' => 'Líquidos', 'status' => GenericStatus::ACTIVE]);

        // 4. Crear Proveedores
        Supplier::create(['company_name' => 'ALICORP S.A.A.', 'ruc' => '20100047218']);
        Supplier::create(['company_name' => 'GLORIA S.A.', 'ruc' => '20100192790']);
        Supplier::create(['company_name' => 'AJEPER S.A.', 'ruc' => '20331061155']);
        Supplier::create(['company_name' => 'PROCTER & GAMBLE PERU S.R.L.', 'ruc' => '20100152909']);

        $productos = [
            [
                'product_name' => 'Aceite Primor Premium 1Lt',
                'product_code' => 'ACE-001',
                'stock'        => 50,
                'sale_price'   => 11.50,
                'id_category'  => $catAbarrotes->id_product_category,
                'id_brand'     => $brandPrimor->id_brand,
                'id_product_type' => $typeConsumo->id_product_type,
                'status'       => GenericStatus::ACTIVE
            ],
            [
                'product_name' => 'Leche Gloria Six Pack',
                'product_code' => 'LEC-002',
                'stock'        => 30,
                'sale_price'   => 25.00,
                'id_category'  => $catAbarrotes->id_product_category,
                'id_brand'     => $brandGloria->id_brand,
                'id_product_type' => $typeConsumo->id_product_type,
                'status'       => GenericStatus::ACTIVE
            ],
            [
                'product_name' => 'Detergente Ace Canela 2Kg',
                'product_code' => 'DET-003',
                'stock'        => 20,
                'sale_price'   => 18.50,
                'id_category'  => $catLimpieza->id_product_category,
                'id_brand'     => $brandAce->id_brand,
                'id_product_type' => $typeConsumo->id_product_type,
                'status'       => GenericStatus::ACTIVE
            ],
            [
                'product_name' => 'Agua Cielo Sin Gas 625ml',
                'product_code' => 'AGU-004',
                'stock'        => 100,
                'sale_price'   => 1.50,
                'id_category'  => $catBebidas->id_product_category,
                'id_brand'     => $brandCielo->id_brand,
                'id_product_type' => $typeLiquido->id_product_type,
                'status'       => GenericStatus::ACTIVE
            ],
            [
                'product_name' => 'Yogurt Gloria Fresa 1Kg',
                'product_code' => 'YOG-005',
                'stock'        => 15,
                'sale_price'   => 6.50,
                'id_category'  => $catAbarrotes->id_product_category,
                'id_brand'     => $brandGloria->id_brand,
                'id_product_type' => $typeConsumo->id_product_type,
                'status'       => GenericStatus::ACTIVE
            ],
        ];

        foreach ($productos as $p) {
            Products::create($p);
        }

        $this->call([
            InventoryConfigSeeder::class,
        ]);
    }
}
