<?php

use App\Http\Controllers\Inventory\InventoryMovementsController;
use App\Http\Controllers\Inventory\InventorySettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::controller(InventoryMovementsController::class)->group(function () {
        Route::get('/inventario', 'index')->name('inventory.index');
        Route::get('/inventario/movimientos', 'movements')->name('inventory.movements');
        Route::get('/inventario/exportar', 'export')->name('inventory.export');
        Route::get('/inventario/kardex-exportar', 'exportKardex')->name('inventory.kardex.export');
        Route::get('/inventario/kardex/{product}', 'kardexByProduct')->name('inventory.kardex.product');

        // Creación y Listado de Ajustes
        Route::get('/inventario/ajuste', 'createAdjustment')->name('inventory.adjustment.create');
        Route::post('/inventario/ajuste', 'storeAdjustment')->name('inventory.adjustment.store');
        Route::get('/inventario/ajuste/movimientos', 'adjustments')->name('inventory.adjustments.index');

        // ✅ SOLUCIÓN: Agregamos la ruta GET directa por si los enlaces no tienen el "/edit"
        Route::get('/inventario/ajuste/{id}', 'editAdjustment')->name('inventory.adjustment.show');
        Route::get('/inventario/ajuste/{id}/edit', 'editAdjustment')->name('inventory.adjustment.edit');

        // ✅ Mantenemos las acciones de estado aquí en su controlador correcto
        Route::put('/inventario/ajuste/{id}', 'updateAdjustment');
        Route::post('/inventario/ajuste/{id}/check', 'checkAdjustment');
        Route::post('/inventario/ajuste/{id}/validate', 'validateAdjustment')->name('inventory.adjustment.validate');
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
