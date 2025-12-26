<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Brand;
use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Models\Products;
use App\Models\Supplier;
use App\Models\Receipt;
use App\Models\ReceiptDetail;
use App\Models\Sales;
use App\Models\SaleDetail;
use App\Enums\GenericStatus;
use App\Enums\DocumentType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 0. Limpiar tablas para evitar duplicados (Opcional, pero recomendado para pruebas)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('receipt_details')->truncate();
        DB::table('receipts')->truncate();
        DB::table('sale_details')->truncate();
        DB::table('sales')->truncate();
        DB::table('products')->truncate();
        DB::table('suppliers')->truncate();
        DB::table('brands')->truncate();
        DB::table('product_categories')->truncate();
        DB::table('product_types')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Crear usuarios (Tu lógica original)
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrador',
                "dni" => "12345678",
                'father_last_name' => 'Sistema',
                'mother_last_name' => 'Root',
                'email' => 'admin@sistema.com',
                'password' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['username' => 'operador'],
            [
                'name' => 'Usuario',
                "dni" => "12345679",
                'father_last_name' => 'Prueba',
                'mother_last_name' => 'Demo',
                'email' => 'test@example.com',
                'password' => 'password',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Proveedores Peruanos
        $suppliers = [
            ['company_name' => 'ALICORP S.A.A.', 'ruc' => '20100047218'],
            ['company_name' => 'NESTLE PERU S.A.', 'ruc' => '20100149991'],
            ['company_name' => 'GLORIA S.A.', 'ruc' => '20100192790'],
            ['company_name' => 'KIMBERLY-CLARK PERU S.R.L.', 'ruc' => '20297485303'],
        ];
        foreach ($suppliers as $s) Supplier::create($s);
        $supplierIds = Supplier::pluck('id_supplier');

        // 3. Atributos de Productos
        $cat = ProductCategory::create(['name_product_category' => 'Abarrotes', 'status' => GenericStatus::ACTIVE]);
        $brand = Brand::create(['name_brand' => 'Primor', 'status' => GenericStatus::ACTIVE]);
        $brandGloria = Brand::create(['name_brand' => 'Gloria', 'status' => GenericStatus::ACTIVE]);
        $type = ProductType::create(['name_product_type' => 'Consumo Masivo', 'status' => GenericStatus::ACTIVE]);

        // 4. Productos base para reportes
        $aceite = Products::create([
            'product_name' => 'Aceite Primor Premium 1Lt',
            'product_code' => 'PROD-001',
            'status' => GenericStatus::ACTIVE,
            'stock' => 150,
            'sale_price' => 12.50,
            'id_category' => $cat->id_product_category,
            'id_brand' => $brand->id_brand,
            'id_product_type' => $type->id_product_type,
        ]);

        $leche = Products::create([
            'product_name' => 'Leche Gloria Six Pack',
            'product_code' => 'PROD-002',
            'status' => GenericStatus::ACTIVE,
            'stock' => 80,
            'sale_price' => 24.00,
            'id_category' => $cat->id_product_category,
            'id_brand' => $brandGloria->id_brand,
            'id_product_type' => $type->id_product_type,
        ]);

        // 5. Historial de Compras (6 meses atrás para Variación de Costos e IGV)
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i)->setDay(rand(1, 28));

            // Simular inflación en el aceite (Sube S/ 0.50 cada mes)
            $costoVariable = 8.00 + ((5 - $i) * 0.50);

            $receipt = Receipt::create([
                'id_supplier' => $supplierIds->random(),
                'series' => 'F001',
                'number' => '000' . rand(100, 999),
                'issue_date' => $date,
                'total_amount' => $costoVariable * 50, // 50 unidades compradas
                'document_type' => DocumentType::INVOICE,
                'receipt_code' => 'REC-' . $date->format('Ym') . '-' . strtoupper(Str::random(4))
            ]);

            ReceiptDetail::create([
                'id_receipt' => $receipt->id_receipt,
                'id_product' => $aceite->id_product,
                'quantity' => 50,
                'unit_price' => $costoVariable,
                'subtotal' => $costoVariable * 50
            ]);
        }

        // 6. Historial de Ventas (Últimos 30 días para Resumen Diario y Productos Estrella)
        for ($d = 30; $d >= 0; $d--) {
            $saleDate = Carbon::now()->subDays($d);
            $numSales = rand(3, 10); // Varias ventas por día

            for ($s = 0; $s < $numSales; $s++) {
                $qty = rand(1, 4);
                $total = $aceite->sale_price * $qty;

                $sale = Sales::create([
                    'code_sales' => 'VEN-' . $saleDate->format('Ymd') . '-' . rand(1000, 9999),
                    'date_sales' => $saleDate,
                    'subtotal' => $total / 1.18,
                    'tax' => $total - ($total / 1.18),
                    'total' => $total,
                    'document_type' => rand(0, 1) ? DocumentType::INVOICE : DocumentType::RECEIPT,
                    'series' => 'B001',
                    'number' => rand(10000, 99999),
                    'status' => 'completed',
                    'id_user' => $admin->id,
                ]);

                SaleDetail::create([
                    'id_sales' => $sale->id_sales,
                    'id_product' => $aceite->id_product,
                    'quantity' => $qty,
                    'unit_price' => $aceite->sale_price,
                    'id_user' => $admin->id
                ]);
            }
        }
    }
}
