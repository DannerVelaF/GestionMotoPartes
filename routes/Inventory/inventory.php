<?php

use App\Http\Controllers\Inventory\InventoryMovementsController;
use App\Http\Controllers\Inventory\InventorySettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {

    // --- MÓDULO: MOVIMIENTOS Y KARDEX (Acceso base: inventory.view) ---
    Route::middleware(['permission:inventory.view'])->controller(InventoryMovementsController::class)->group(function () {

        // 1. Rutas Estáticas de Inventario General
        Route::get('/inventario', 'index')->name('inventory.index');
        Route::get('/inventario/movimientos', 'movements')->name('inventory.movements');
        Route::get('/inventario/kardex/exportar', 'exportKardex')->name('inventory.export');
        Route::get('/inventario/ajuste/movimientos', 'adjustments')->name('inventory.adjustments.index');

        // 2. Operación de Ajustes (Nivel: inventory.movement)
        Route::middleware(['permission:inventory.movement'])->group(function () {
            Route::get('/inventario/ajuste/nuevo', 'createAdjustment')->name('inventory.adjustment.create'); // ✅ Prioridad ante {id}
            Route::post('/inventario/ajuste/guardar', 'storeAdjustment')->name('inventory.adjustment.store');
        });

        // 3. Supervisión y Bulk (Nivel: inventory.edit)
        Route::middleware(['permission:inventory.edit'])->group(function () {
            Route::delete('/inventario/ajuste/bulk-delete', 'bulkAdjustments')->name('inventory.adjustment.bulk-delete'); // ✅ Prioridad ante {id}
        });

        // 4. Rutas Dinámicas con ID (Siempre al final)
        Route::get('/inventario/ajuste/{id}', 'editAdjustment')->name('inventory.adjustment.show');

        Route::middleware(['permission:inventory.movement'])->group(function () {
            Route::post('/inventario/ajuste/{id}/check', 'checkAdjustment')->name('inventory.adjustment.check');
            Route::post('/inventario/ajuste/{id}/note', 'addNote')->name('inventory.adjustment.note');
        });

        Route::middleware(['permission:inventory.edit'])->group(function () {
            Route::get('/inventario/ajuste/{id}/edit', 'editAdjustment')->name('inventory.adjustment.edit');
            Route::put('/inventario/ajuste/{id}', 'updateAdjustment')->name('inventory.adjustment.update');
            Route::post('/inventario/ajuste/{id}/validate', 'validateAdjustment')->name('inventory.adjustment.validate');
            Route::post('/inventario/ajuste/{id}/devolver', 'createReturn')->name('inventory.adjustment.return');
        });
    });

    // --- MÓDULO: CONFIGURACIÓN Y MAESTROS (Acceso: inventory.config) ---
    Route::middleware(['permission:inventory.config'])->controller(InventorySettingsController::class)->group(function () {

        Route::get('/inventario/configuracion', 'index')->name('inventory.settings');

        // Ubicaciones (POST antes que PUT/DELETE con ID)
        Route::post('/inventario/config/locations', 'storeLocation')->name('inventory.config.locations.store');
        Route::put('/inventario/config/locations/{id}', 'updateLocation')->name('inventory.config.locations.update');
        Route::delete('/inventario/config/locations/{id}', 'destroyLocation')->name('inventory.config.locations.destroy');

        // Tipos de Operación
        Route::post('/inventario/config/operation-types', 'storeOperationType')->name('inventory.config.operation-types.store');
        Route::put('/inventario/config/operation-types/{id}', 'updateOperationType')->name('inventory.config.operation-types.update');
        Route::delete('/inventario/config/operation-types/{id}', 'destroyOperationType')->name('inventory.config.operation-types.destroy');
    });
});
