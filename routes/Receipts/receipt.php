<?php

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
});
