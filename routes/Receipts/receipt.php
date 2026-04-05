<?php

use App\Http\Controllers\Purchase\PurchaseOrdersController;
use App\Http\Controllers\Sales\CustomerSearchController;
use App\Http\Controllers\Receipt\ReceiptController;
use App\Http\Controllers\Receipt\SupplierController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaxesController;

Route::middleware(["auth", "verified"])->group(function () {

    // --- PROVEEDORES ---
    Route::middleware(['permission:purchase.view'])->controller(SupplierController::class)->group(function () {
        Route::get("/proovedores", "index")->name("suppliers.index");
        Route::get('/proovedores/template', 'template')->name('suppliers.template');
        Route::get("/proovedores/buscar-sunat", "buscarSunatProveedor")->name("suppliers.buscarSunat");
        Route::get("/proovedores/nuevoProovedor", "create")->name("suppliers.create");
        Route::post("/proovedores", "store")->name("suppliers.store");
        Route::delete("/proovedores/bulk-delete", 'bulkDestroy')->name('suppliers.bulk-destroy');

        Route::get("/proovedores/{supplier}", "show")->name("suppliers.show");
        Route::put("/proovedores/{supplier}", "update")->name("suppliers.update");
        Route::delete("/proovedores/{supplier}", "destroy")->name("suppliers.destroy");
    });

    // --- RECIBOS / COMPROBANTES (Mantenemos aquí solo lo operativo de facturas) ---
    Route::middleware(['permission:billing.view'])->controller(ReceiptController::class)->group(function () {
        Route::get('/recibos', 'index')->name('receipts.index');

        Route::get('/recibos/nuevoRecibo', 'create')->name('receipts.create');
        Route::post('/recibos', 'store')->name('receipts.store');
        Route::delete("/recibos/bulk-delete", 'bulkDestroy')->name('receipts.bulk-destroy');

        Route::get('/recibos/{receipt}', 'show')->name('receipts.show');
        Route::put('/recibos/{receipt}', 'update')->name('receipts.update');
        Route::post('/recibos/{receipt}/nota', 'addNote')->name('receipts.note');
        Route::post('/recibos/{receipt}/publish', 'publish')->name('receipts.publish');
        Route::post('/recibos/{receipt}/devolver', 'returnReceipt')->name('receipts.return');
        Route::delete("/recibos/{receipt}", "destroy")->name("receipts.destroy");
    });

    // --- ÓRDENES DE COMPRA (OC) Y ANALÍTICA DE COMPRAS ---
    Route::middleware(['permission:purchase.view'])->controller(PurchaseOrdersController::class)->group(function () {

        // 1. REPORTES DE COMPRAS (Trasladados aquí)
        Route::prefix('compras/reportes')->group(function () {
            Route::get('/impuestos', 'taxReport')->name('reports.purchases.tax');
            Route::get('/impuestos/export', 'exportTaxExcel')->name('reports.purchases.export');
            Route::get('/variacion-costos', 'variationReport')->name('reports.purchases.variation');
            Route::get('/distribucion', 'expenseDistributionReport')->name('receipts.reports.distribution');
            Route::get('/margen', 'marginReport')->name('reports-receipts.margin');
            Route::get('/proveedores', 'supplierReport')->name('reports-receipts.suppliers');
        });

        // 2. Operaciones Estáticas
        Route::get('/compras/ordenes', 'index')->name('purchase-orders.index');
        Route::get('/compras/ordenes/crear', 'create')->name('purchase-orders.create');
        Route::post('/compras/ordenes', 'store')->name('purchase-orders.store');

        // 3. Operaciones Dinámicas
        Route::get('/compras/ordenes/{purchaseOrder}', 'show')->name('purchase-orders.show');
        Route::get('/compras/{purchaseOrder}/print', 'print')->name('purchase-orders.print');
        Route::put('/compras/ordenes/{purchaseOrder}', 'update')->name('purchase-orders.update');
        Route::post('/compras/ordenes/{purchaseOrder}/nota', 'addNote')->name('purchase-orders.note');
        Route::get('/compras/ordenes/{id}/recepcion', 'prepareReception')->name('purchase-orders.reception');
        Route::post('/compras/ordenes/{purchaseOrder}/aprobar', 'approve')->name('purchase-orders.approve');
        Route::post('/compras/ordenes/{id}/cancelar', 'cancel')->name('purchase-orders.cancel');
        Route::delete('/compras/ordenes/{purchaseOrder}', 'destroy')->name('purchase-orders.destroy');
    });

    // --- BÚSQUEDA DE CLIENTES ---
    Route::get('/api/consultar-documento/{documento}', [CustomerSearchController::class, 'searchCustomer'])
        ->middleware('permission:sales.create');

    // --- CONFIGURACIÓN DE IMPUESTOS ---
    Route::middleware(['permission:inventory.config'])->controller(TaxesController::class)->group(function () {
        Route::get('/compras/configuracion/impuestos', 'index')->name('taxes.index');
        Route::post('/compras/configuracion/impuestos', 'store')->name('taxes.store');
        Route::put('/compras/configuracion/impuestos/{id}', 'update')->name('taxes.update');
        Route::delete('/compras/configuracion/impuestos/{id}', 'destroy')->name('taxes.destroy');
    });
});
