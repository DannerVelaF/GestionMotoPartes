<?php

use App\Http\Controllers\Inventory\InventoryMovementsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::controller(InventoryMovementsController::class)->group(function () {
        Route::get('/inventario', 'index')->name('inventory.index');
        Route::get('/inventario/movimientos', 'movements')->name('inventory.movements');
        Route::get('/inventario/exportar', 'export')->name('inventory.export');

        // ✅ AÑADE ESTA LÍNEA AQUÍ:
        Route::get('/inventario/kardex-exportar', 'exportKardex')->name('inventory.kardex.export');

        Route::get('/inventario/kardex/{product}', 'kardexByProduct')->name('inventory.kardex.product');
        Route::get('/inventario/ajuste', 'createAdjustment')->name('inventory.adjustment.create');
        Route::post('/inventario/ajuste', 'storeAdjustment')->name('inventory.adjustment.store');
    });
});
