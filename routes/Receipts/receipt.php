<?php

use App\Http\Controllers\Purchase\PurchaseOrdersController;
use App\Http\Controllers\Sales\CustomerSearchController;
use App\Http\Controllers\Receipt\ReceiptController;
use App\Http\Controllers\Receipt\SupplierController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaxesController;

Route::middleware("auth")->group(function () {

    // --- PROVEEDORES ---
    Route::controller(SupplierController::class)->group(function () {
        Route::get('/proovedores/template', 'template')->name('suppliers.template');
        Route::post('/proovedores/import', 'import')->name('suppliers.import');
        Route::get("/proovedores/buscar-sunat", "buscarSunatProveedor")->name("suppliers.buscarSunat");
        Route::get("/proovedores", "index")->name("suppliers.index");
        Route::get("/proovedores/nuevoProovedor", "create")->name("suppliers.create");
        Route::post("/proovedores", "store")->name("suppliers.store");
        Route::get("/proovedores/{supplier}", "show")->name("suppliers.show");
        Route::put("/proovedores/{supplier}", "update")->name("suppliers.update");
        Route::delete("/proovedores/bulk-delete", 'bulkDestroy')->name('suppliers.bulk-destroy');
        Route::delete("/proovedores/{supplier}", "destroy")->name("suppliers.destroy");
    });

    // --- RECIBOS / COMPROBANTES ---
    Route::controller(ReceiptController::class)->group(function () {
        Route::get('/recibos', 'index')->name('receipts.index');

        // Protección específica para creación de recibos
        Route::middleware('permission:purchase.create')->group(function () {
            Route::get('/recibos/nuevoRecibo', 'create')->name('receipts.create');
            Route::post('/recibos', 'store')->name('receipts.store');
        });

        Route::get('/recibos/{receipt}', 'show')->name('receipts.show');
        Route::put('/recibos/{receipt}', 'update')->name('receipts.update');
        Route::post('/recibos/{receipt}/nota', 'addNote')->name('receipts.note');
        Route::delete("/recibos/bulk-delete", 'bulkDestroy')->name('receipts.bulk-destroy');
        Route::delete("/recibos/{receipt}", "destroy")->name("receipts.destroy");

        // Publicar y Devoluciones
        Route::post('/recibos/{receipt}/publish', 'publish')->name('receipts.publish');
        Route::post('/recibos/{receipt}/devolver', 'returnReceipt')->name('receipts.return');

        // Reportes de Recibos
        Route::get('/recibos/reportes/impuestos',  'taxReport')->name('reports-receipts.tax');
        Route::get('/recibos/reportes/impuestosExcel',  'exportTaxExcel')->name('reports-receipts.taxExcel');
        Route::get('/recibos/reportes/distribucion', 'expenseDistributionReport')->name('receipts.reports.distribution');
        Route::get('/recibos/reportes/margen',  'marginReport')->name('reports-receipts.margin');
        Route::get('/recibos/reportes/proveedores',  'supplierReport')->name('reports-receipts.suppliers');
        Route::get('/recibos/reportes/variacionCosto',  'variationReport')->name('reports-receipts.variation');
    });

    // --- BÚSQUEDA DE CLIENTES (API) ---
    Route::get('/api/consultar-documento/{documento}', [CustomerSearchController::class, 'searchCustomer'])
        ->middleware('permission:sales.create');

    // --- ÓRDENES DE COMPRA ---
    Route::controller(PurchaseOrdersController::class)->group(function () {
        Route::get('/compras/ordenes', 'index')->name('purchase-orders.index');

        // Creación y edición bajo permiso de creación
        Route::middleware('permission:purchase.create')->group(function () {
            Route::get('/compras/ordenes/crear', 'create')->name('purchase-orders.create');
            Route::post('/compras/ordenes', 'store')->name('purchase-orders.store');
            Route::put('/compras/ordenes/{purchaseOrder}', 'update')->name('purchase-orders.update');
            Route::post('/compras/ordenes/{purchaseOrder}/nota', 'addNote')->name('purchase-orders.note');
        });

        Route::get('/compras/ordenes/{purchaseOrder}', 'show')->name('purchase-orders.show');
        Route::delete('/compras/ordenes/{purchaseOrder}', 'destroy')->name('purchase-orders.destroy');

        // 🛡️ Aprobación y Cancelación (Solo usuarios con permiso de aprobar)
        Route::post('/compras/ordenes/{purchaseOrder}/aprobar', 'approve')
            ->name('purchase-orders.approve')
            ->middleware('permission:purchase.approve');

        Route::post('/compras/ordenes/{id}/cancelar', 'cancel')
            ->name('purchase-orders.cancel')
            ->middleware('permission:purchase.approve');

        Route::get('/compras/ordenes/{id}/recepcion', 'prepareReception')->name('purchase-orders.reception');
        Route::get('/compras/{purchaseOrder}/print', 'print')->name('purchase-orders.print');
    });

    // --- CONFIGURACIÓN DE IMPUESTOS ---
    Route::controller(TaxesController::class)->group(function () {
        Route::get('/compras/configuracion/impuestos', 'index')->name('taxes.index');
        Route::post('/compras/configuracion/impuestos', 'store')->name('taxes.store');
        Route::put('/compras/configuracion/impuestos/{id}', 'update')->name('taxes.update');
        Route::delete('/compras/configuracion/impuestos/{id}', 'destroy')->name('taxes.destroy');
    });
});
