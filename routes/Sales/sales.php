<?php

use App\Http\Controllers\Sales\MethodPaymentController;
use App\Http\Controllers\Sales\SalesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {

    // --- MÓDULO: MÉTODOS DE PAGO (Maestros) ---
    Route::middleware(['permission:inventory.config'])->controller(MethodPaymentController::class)->prefix('ventas/metodoPago')->group(function () {
        // 1. Estáticas primero
        Route::get('/', 'index')->name('sales.methodPayments.index');
        Route::get('/nuevoMetodo', 'create')->name('sales.methodPayments.create');
        Route::get('/{methodPayment}', 'show')->name('sales.methodPayments.show');
        Route::post('/', 'store')->name('sales.methodPayments.store');
        Route::delete('/bulk-delete', 'bulkDestroy')->name('sales.methodPayments.bulk-destroy');

        // 2. Dinámicas al final
        Route::put('/{methodPayment}', 'update')->name('sales.methodPayments.update');
        Route::delete('/{methodPayment}', 'destroy')->name('sales.methodPayments.destroy');
    });

    // --- MÓDULO: REPORTES Y ANALÍTICA (Lectura) ---
    Route::middleware(['permission:sales.view'])->controller(SalesController::class)->prefix('ventas/reportes')->group(function () {
        Route::get('/resumen-diario', 'reportDaily')->name('reports.daily');
        Route::get('/productos-estrella', 'reportTopProducts')->name('reports.top');
        Route::get('/analisis-marcas', 'reportBrandAnalysis')->name('reports.brands');
        Route::get('/resumen-diario/export', 'exportDailyExcel')->name('sales.reports.daily.export');

        // Reportes de Impuestos (Restringidos)
        Route::middleware(['permission:billing.report'])->group(function () {
            Route::get('/impuestos', 'reportTax')->name('reports.tax');
            Route::get('/impuestosReporte', 'exportTaxExcel')->name('reports.exportTaxExcel');
        });
    });

    // --- MÓDULO: OPERACIÓN DE VENTAS ---
    Route::middleware(['permission:sales.view'])->controller(SalesController::class)->prefix('ventas')->group(function () {

        // 1. Estáticas y Operativas Primero
        Route::get('/', 'index')->name('sales.index');

        Route::middleware(['permission:sales.create'])->group(function () {
            Route::get('/nuevaVenta', 'create')->name('sales.create'); // ✅ Ahora Laravel la verá primero
            Route::post('/', 'store')->name('sales.store');
        });

        Route::middleware(['permission:sales.void'])->group(function () {
            Route::delete('/bulk-delete', 'bulkDestroy')->name('sales.bulk-destroy');
        });

        // 2. Dinámicas con ID (Siempre al final del grupo /ventas)
        Route::get('/{id}', 'show')->name('sales.show');
        Route::get('/{id}/ticket', 'printTicket')->name('sales.ticket');

        Route::middleware(['permission:sales.create'])->group(function () {
            Route::post('/{id}/nota', 'storeNote')->name('sales.note');
        });

        Route::middleware(['permission:sales.void'])->group(function () {
            Route::put('/{id}', 'update')->name('sales.update');
            Route::delete('/{id}', 'destroy')->name('sales.destroy');
        });
    });
});
