<?php

use App\Http\Controllers\Purchase\PurchaseOrdersController;
use App\Http\Controllers\Sales\CustomerSearchController;
use App\Http\Controllers\Receipt\ReceiptController;
use App\Http\Controllers\Receipt\SupplierController;
use Illuminate\Support\Facades\Route;

Route::middleware("auth")->group(function () {
    Route::controller(SupplierController::class)->group(function () {

        Route::get('/proovedores/template', [SupplierController::class, 'template'])->name('suppliers.template');
        Route::post('/proovedores/import', [SupplierController::class, 'import'])->name('suppliers.import');
        Route::get("/proovedores/buscar-sunat", "buscarSunatProveedor")->name("suppliers.buscarSunat");
        Route::get("/proovedores", "index")->name("suppliers.index");
        Route::get("/proovedores/nuevoProovedor", "create")->name("suppliers.create");
        Route::post("/proovedores", "store")->name("suppliers.store");
        Route::get("/proovedores/{supplier}", "show")->name("suppliers.show");
        Route::put("/proovedores/{supplier}", "update")->name("suppliers.update");
        Route::delete("/proovedores/bulk-delete", 'bulkDestroy')->name('suppliers.bulk-destroy');
        Route::delete("/proovedores/{supplier}", "destroy")->name("suppliers.destroy");
    });
    Route::controller(ReceiptController::class)->group(function () {
        Route::get('/recibos', 'index')->name('receipts.index');
        Route::get('/recibos/nuevoRecibo', 'create')->name('receipts.create');
        Route::post('/recibos', 'store')->name('receipts.store');
        Route::get('/recibos/{receipt}', 'show')->name('receipts.show');
        Route::put('/recibos/{receipt}', 'update')->name('receipts.update');
        Route::post('/recibos/{receipt}/nota', [ReceiptController::class, 'addNote'])->name('receipts.note');
        Route::delete("/recibos/bulk-delete", 'bulkDestroy')->name('receipts.bulk-destroy');
        Route::delete("/recibos/{receipt}", "destroy")->name("receipts.destroy");
        Route::post('/receipts/{receipt}/return', [ReceiptController::class, 'returnReceipt'])
            ->name('receipts.return');
        Route::get('/recibos/reportes/impuestos',  'taxReport')->name('reports-receipts.tax');
        Route::get('/recibos/reportes/impuestosExcel',  'exportTaxExcel')->name('reports-receipts.taxExcel');
        Route::get('/recibos/reportes/distribucion', [ReceiptController::class, 'expenseDistributionReport'])->name('receipts.reports.distribution');
        Route::get('/recibos/reportes/margen',  'marginReport')->name('reports-receipts.margin');
        Route::get('/recibos/reportes/proveedores',  'supplierReport')->name('reports-receipts.suppliers');
        Route::get('/recibos/reportes/variacionCosto',  'variationReport')->name('reports-receipts.variation');
    });
    Route::get('/api/consultar-documento/{documento}', [CustomerSearchController::class, 'searchCustomer']);

    Route::controller(PurchaseOrdersController::class)->group(function () {
        Route::get('/compras/ordenes', 'index')->name('purchase-orders.index');
        Route::get('/compras/ordenes/crear', 'create')->name('purchase-orders.create');
        Route::post('/compras/ordenes', 'store')->name('purchase-orders.store');
        Route::get('/compras/ordenes/{purchaseOrder}', 'show')->name('purchase-orders.show');
        Route::put('/compras/ordenes/{purchaseOrder}', 'update')->name('purchase-orders.update');
        Route::delete('/compras/ordenes/{purchaseOrder}', 'destroy')->name('purchase-orders.destroy');
        Route::post('/compras/ordenes/{purchaseOrder}/nota', 'addNote')->name('purchase-orders.note');
        Route::post('/compras/ordenes/{purchaseOrder}/aprobar', 'approve')->name('purchase-orders.approve');
        Route::get('/compras/ordenes/{id}/recepcion', 'prepareReception')->name('purchase-orders.reception');
        Route::get('/compras/{purchaseOrder}/print', [PurchaseOrdersController::class, 'print'])->name('purchase-orders.print');
    });
});
