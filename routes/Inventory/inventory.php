<?php

use App\Http\Controllers\Inventory\InventoryMovementsController;
use App\Http\Controllers\Inventory\InventorySettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::controller(InventoryMovementsController::class)->group(function () {
        Route::get('/inventario', 'index')->name('inventory.index');
        Route::get('/inventario/movimientos', 'movements')->name('inventory.movements');

        // 1. Mueve el LISTADO arriba para que no choque con nada
        Route::get('/inventario/ajuste/movimientos', 'adjustments')->name('inventory.adjustments.index');

        // 2. Rutas de CREACIÓN
        Route::get('/inventario/ajuste/nuevo', 'createAdjustment')->name('inventory.adjustment.create'); // Sugerencia: añadir /nuevo
        Route::post('/inventario/ajuste/guardar', 'storeAdjustment')->name('inventory.adjustment.store');

        // 3. Rutas de EDICIÓN (con {id} siempre al final)
        Route::get('/inventario/ajuste/{id}', 'editAdjustment')->name('inventory.adjustment.show');
        Route::get('/inventario/ajuste/{id}/edit', 'editAdjustment')->name('inventory.adjustment.edit');

        // Acciones
        Route::put('/inventario/ajuste/{id}', 'updateAdjustment')->name('inventory.adjustment.update');
        Route::post('/inventario/ajuste/{id}/check', 'checkAdjustment')->name('inventory.adjustment.check');
        Route::post('/inventario/ajuste/{id}/validate', 'validateAdjustment')->name('inventory.adjustment.validate');
        Route::post('/inventario/ajuste/{id}/note', 'addNote')->name('inventory.adjustment.note');
        Route::post('/inventario/ajuste/{id}/devolver', 'createReturn')->name('inventory.adjustment.return');
    });

    Route::controller(InventorySettingsController::class)->group(function () {
        Route::get('/inventario/configuracion', 'index')->name('inventory.settings');
        Route::post('/inventario/config/locations', 'storeLocation')->name('inventory.config.locations.store');
        Route::post('/inventario/config/operation-types', 'storeOperationType')->name('inventory.config.operation-types.store');
        Route::put('/inventario/config/locations/{id}', 'updateLocation')->name('inventory.config.locations.update');
        Route::put('/inventario/config/operation-types/{id}', 'updateOperationType')->name('inventory.config.operation-types.update');
        Route::delete('/inventario/config/locations/{id}', 'destroyLocation')->name('inventory.config.locations.destroy');
        Route::delete('/inventario/config/operation-types/{id}', 'destroyOperationType')->name('inventory.config.operation-types.destroy');
    });
});
