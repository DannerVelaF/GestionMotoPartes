<?php

use App\Http\Controllers\Sales\SalesController;
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
    });
});
