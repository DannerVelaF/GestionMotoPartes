<?php

use App\Http\Controllers\Sales\MethodPaymentController;
use App\Http\Controllers\Sales\SalesController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {

    Route::controller(MethodPaymentController::class)->prefix('ventas/metodoPago')->group(function () {
        Route::get('/', 'index')->name('sales.methodPayments.index'); // /ventas/metodoPago
        Route::get('/nuevoMetodo', 'create')->name('sales.methodPayments.create');
        Route::post('/', 'store')->name('sales.methodPayments.store');
        Route::delete('/bulk-delete', 'bulkDestroy')->name('sales.methodPayments.bulk-destroy');

        Route::get('/{methodPayment}', 'show')->name('sales.methodPayments.show');
        Route::put('/{methodPayment}', 'update')->name('sales.methodPayments.update');
        Route::delete('/{methodPayment}', 'destroy')->name('sales.methodPayments.destroy');
    });

    Route::controller(SalesController::class)->prefix('ventas/reportes')->group(function () {
        Route::get('/resumen-diario', 'reportDaily')->name('reports.daily');
        Route::get('/impuestos', 'reportTax')->name('reports.tax');
        Route::get('/impuestosReporte', 'exportTaxExcel')->name('reports.exportTaxExcel');
        Route::get('/productos-estrella', 'reportTopProducts')->name('reports.top');
        Route::get('/analisis-marcas', 'reportBrandAnalysis')->name('reports.brands');
        Route::get('/resumen-diario/export', [SalesController::class, 'exportDailyExcel'])->name('sales.reports.daily.export');
    });

    Route::controller(SalesController::class)->prefix('ventas')->group(function () {
        Route::get('/', 'index')->name('sales.index'); // /ventas
        Route::get('/nuevaVenta', 'create')->name('sales.create');
        Route::post('/', 'store')->name('sales.store');
        Route::delete('/bulk-delete', 'bulkDestroy')->name('sales.bulk-destroy');


        Route::get('/{id}/ticket', 'printTicket')->name('sales.ticket');
        Route::get('/{sale}', 'show')->name('sales.show');
        Route::put('/{sale}', 'update')->name('sales.update');
        Route::delete('/{sale}', 'destroy')->name('sales.destroy');
    });
});
