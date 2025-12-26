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
use App\Models\InventoryMovements;
use App\Enums\GenericStatus;
use App\Enums\DocumentType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Limpieza Total
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        $tables = [
            'inventory_movements',
            'receipt_details',
            'receipts',
            'sale_details',
            'sales',
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

        // 1. Usuarios Base
        $admin = User::firstOrCreate(['username' => 'admin'], [
            'name' => 'Administrador',
            'dni' => '12345678',
            'father_last_name' => 'Sistema',
            'mother_last_name' => 'Root',
            'email' => 'admin@sistema.com',
            'password' => 'admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 2. Proveedores y Atributos
        $supAlicorp = Supplier::create(['company_name' => 'ALICORP S.A.A.', 'ruc' => '20100047218']);
        $supGloria = Supplier::create(['company_name' => 'GLORIA S.A.', 'ruc' => '20100192790']);

        $catAbarrotes = ProductCategory::create(['name_product_category' => 'Abarrotes', 'status' => GenericStatus::ACTIVE]);
        $brandPrimor = Brand::create(['name_brand' => 'Primor', 'status' => GenericStatus::ACTIVE]);
        $brandGloria = Brand::create(['name_brand' => 'Gloria', 'status' => GenericStatus::ACTIVE]);
        $typeConsumo = ProductType::create(['name_product_type' => 'Consumo Masivo', 'status' => GenericStatus::ACTIVE]);

        // 3. Catálogo de Productos
        $productosData = [
            [
                'info' => [
                    'product_name' => 'Aceite Primor Premium 1Lt',
                    'product_code' => 'ACE-001',
                    'stock' => 0,
                    'sale_price' => 11.50,
                    'id_category' => $catAbarrotes->id_product_category,
                    'id_brand' => $brandPrimor->id_brand,
                    'id_product_type' => $typeConsumo->id_product_type,
                    'status' => GenericStatus::ACTIVE
                ],
                'cost_base' => 8.50,
                'supplier' => $supAlicorp
            ],
            [
                'info' => [
                    'product_name' => 'Leche Gloria Six Pack',
                    'product_code' => 'LEC-002',
                    'stock' => 0,
                    'sale_price' => 25.00,
                    'id_category' => $catAbarrotes->id_product_category,
                    'id_brand' => $brandGloria->id_brand,
                    'id_product_type' => $typeConsumo->id_product_type,
                    'status' => GenericStatus::ACTIVE
                ],
                'cost_base' => 19.00,
                'supplier' => $supGloria
            ]
        ];

        $listaProductos = [];
        foreach ($productosData as $p) {
            $model = Products::create($p['info']);
            $listaProductos[] = ['model' => $model, 'cost_base' => $p['cost_base'], 'supplier' => $p['supplier']];
        }

        // --- CONTADORES PARA EVITAR DUPLICADOS ---
        $invoiceNumber = 1; // Contador para Facturas
        $receiptNumber = 1; // Contador para Boletas
        $purchaseNumber = 1; // Contador para Compras

        // 4. Bucle de 6 Meses
        $startDate = Carbon::now()->subMonths(6)->startOfMonth();
        $endDate = Carbon::now();

        for ($currentDate = $startDate->copy(); $currentDate->lte($endDate); $currentDate->addDay()) {

            // --- A. COMPRAS (Entradas los días 1 y 15) ---
            if ($currentDate->day == 1 || $currentDate->day == 15) {
                foreach ($listaProductos as $p) {
                    /** @var \App\Models\Products $prodModel */
                    $prodModel = $p['model'];
                    $qtyCompra = rand(60, 100);
                    $costoActual = $p['cost_base'];

                    $receipt = Receipt::create([
                        'id_supplier' => $p['supplier']->id_supplier,
                        'series' => 'F001',
                        'number' => str_pad($purchaseNumber++, 8, '0', STR_PAD_LEFT),
                        'issue_date' => $currentDate,
                        'total_amount' => $costoActual * $qtyCompra,
                        'document_type' => DocumentType::INVOICE,
                        'receipt_code' => 'REC-' . $currentDate->format('Ymd') . '-' . strtoupper(Str::random(3))
                    ]);

                    ReceiptDetail::create([
                        'id_receipt' => $receipt->id_receipt,
                        'id_product' => $prodModel->id_product,
                        'quantity' => $qtyCompra,
                        'unit_price' => $costoActual,
                        'subtotal' => $costoActual * $qtyCompra
                    ]);

                    $prodModel->refresh();
                    $nuevoStock = $prodModel->stock + $qtyCompra;
                    InventoryMovements::create([
                        'id_product' => $prodModel->id_product,
                        'type' => 'in',
                        'id_user' => $admin->id,
                        'quantity' => $qtyCompra,
                        'unit_cost' => $costoActual,
                        'balance' => $nuevoStock,
                        'reference_id' => $receipt->id_receipt,
                        'reference_type' => Receipt::class,
                        'notes' => 'Abastecimiento',
                        'created_at' => $currentDate,
                    ]);
                    $prodModel->update(['stock' => $nuevoStock]);
                }
            }

            // --- B. VENTAS (Salidas diarias) ---
            $numVentasHoy = ($currentDate->isWeekend()) ? rand(10, 18) : rand(4, 10);

            for ($i = 0; $i < $numVentasHoy; $i++) {
                $pIndex = rand(0, count($listaProductos) - 1);
                /** @var \App\Models\Products $prodModel */
                $prodModel = $listaProductos[$pIndex]['model'];
                $qtyVenta = rand(1, 4);

                $prodModel->refresh();
                if ($prodModel->stock >= $qtyVenta) {
                    $totalVenta = $prodModel->sale_price * $qtyVenta;

                    // Alternar entre Boleta y Factura
                    $isInvoice = (rand(1, 10) > 8); // 20% facturas
                    $docType = $isInvoice ? DocumentType::INVOICE : DocumentType::RECEIPT;
                    $series = $isInvoice ? 'F001' : 'B001';
                    $currentNum = $isInvoice ? $invoiceNumber++ : $receiptNumber++;

                    $sale = Sales::create([
                        'code_sales' => 'VEN-' . $currentDate->format('Ymd') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                        'date_sales' => $currentDate,
                        'subtotal' => $totalVenta / 1.18,
                        'tax' => $totalVenta - ($totalVenta / 1.18),
                        'total' => $totalVenta,
                        'document_type' => $docType,
                        'series' => $series,
                        'number' => str_pad($currentNum, 8, '0', STR_PAD_LEFT),
                        'status' => 'completed',
                        'id_user' => $admin->id,
                    ]);

                    SaleDetail::create([
                        'id_sales' => $sale->id_sales,
                        'id_product' => $prodModel->id_product,
                        'quantity' => $qtyVenta,
                        'unit_price' => $prodModel->sale_price,
                        'id_user' => $admin->id
                    ]);

                    $nuevoStock = $prodModel->stock - $qtyVenta;
                    InventoryMovements::create([
                        'id_product' => $prodModel->id_product,
                        'type' => 'out',
                        'id_user' => $admin->id,
                        'quantity' => $qtyVenta,
                        'unit_cost' => $listaProductos[$pIndex]['cost_base'],
                        'balance' => $nuevoStock,
                        'reference_id' => $sale->id_sales,
                        'reference_type' => Sales::class,
                        'notes' => 'Venta regular',
                        'created_at' => $currentDate,
                    ]);
                    $prodModel->update(['stock' => $nuevoStock]);
                }
            }
        }
    }
}
