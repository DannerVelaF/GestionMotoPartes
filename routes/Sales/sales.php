<?php

use App\Http\Controllers\MethodPaymentController;
use App\Http\Controllers\Sales\SalesController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::controller(SalesController::class)->group(function () {
        Route::get('/ventas', 'index')->name('sales.index');
        Route::get('/ventas/nuevaVenta', 'create')->name('sales.create');
        Route::post('/ventas', 'store')->name('sales.store');

        // Mueve esta ruta ARRIBA de las rutas con {sale} para evitar conflictos
        Route::get('/ventas/{id}/ticket', 'printTicket')->name('sales.ticket');

        Route::get('/ventas/{sale}', 'show')->name('sales.show');
        Route::put('/ventas/{sale}', 'update')->name('sales.update');
        Route::delete('/ventas/{sale}', 'destroy')->name('sales.destroy');
        Route::delete('/ventas/bulk-delete', 'bulkDestroy')->name('sales.bulk-destroy');

        Route::get("/ventas/metodoPago", [MethodPaymentController::class, 'index'])->name('sales.methodPayments.index');
        Route::get("/ventas/metodoPago/nuevoMetodo", [MethodPaymentController::class, 'create'])->name('sales.methodPayments.create');
        Route::post("/ventas/metodoPago", [MethodPaymentController::class, 'store'])->name('sales.methodPayments.store');
        Route::get("/ventas/metodoPago/{methodPayment}", [MethodPaymentController::class, 'show'])->name('sales.methodPayments.show');
        Route::put("/ventas/metodoPago/{methodPayment}", [MethodPaymentController::class, 'update'])->name('sales.methodPayments.update');
        Route::delete("/ventas/metodoPago/{methodPayment}", [MethodPaymentController::class, 'destroy'])->name('sales.methodPayments.destroy');
        Route::delete("/ventas/metodoPago/bulk-delete", [MethodPaymentController::class, 'bulkDestroy'])->name('sales.methodPayments.bulk-destroy');

        Route::prefix('/ventas/reportes')->group(function () {
            Route::get('/resumen-diario', [SalesController::class, 'reportDaily'])->name('reports.daily');
            Route::get('/impuestos', [SalesController::class, 'reportTax'])->name('reports.tax');
            Route::get('/impuestosReporte', [SalesController::class, 'exportTaxExcel'])->name('reports.exportTaxExcel');
            Route::get('/productos-estrella', [SalesController::class, 'reportTopProducts'])->name('reports.top');
            Route::get('/analisis-marcas', [SalesController::class, 'reportBrandAnalysis'])->name('reports.brands');
        });
    });
});
