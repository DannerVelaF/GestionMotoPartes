<?php

use App\Http\Controllers\Products\BrandController;
use App\Http\Controllers\Products\ProductCategoryController;
use App\Http\Controllers\Products\ProductController;
use App\Http\Controllers\Products\ProductTypeController;
use Illuminate\Support\Facades\Route;

Route::middleware(["auth", "verified"])->group(function () {

    // --- MÓDULO: PRODUCTOS (Acceso base: inventory.view) ---
    Route::middleware(['permission:inventory.view'])->group(function () {

        // 1. Estáticas de Productos
        Route::get("/productos", [ProductController::class, "index"])->name("products.index");

        Route::middleware(['permission:inventory.edit'])->group(function () {
            Route::get('/productos/template', [ProductController::class, 'template'])->name('products.template');
            Route::get("/productos/nuevoProducto", [ProductController::class, "create"])->name("products.create");
            Route::post('/productos/nuevoProducto', [ProductController::class, 'store'])->name('products.store');
            Route::post('/productos/import', [ProductController::class, 'import'])->name('products.import');
            Route::delete("/productos/bulk-delete", [ProductController::class, "bulkDestroy"])->name("products.bulk-delete");
        });

        // 2. Dinámicas de Productos (Siempre al final del bloque)
        Route::get("/productos/{product}", [ProductController::class, "show"])->name("products.show");

        Route::middleware(['permission:inventory.edit'])->group(function () {
            Route::put("/productos/{product}", [ProductController::class, "update"])->name("products.update");
            Route::delete("/productos/{product}", [ProductController::class, "destroy"])->name("products.destroy");
        });
    });

    // --- MÓDULO: CATEGORÍAS (Maestros) ---
    Route::middleware(['permission:inventory.config'])->controller(ProductCategoryController::class)->group(function () {
        Route::get('/categorias', 'index')->name('product-categories.index');
        Route::get('/categorias/nuevaCategoria', 'create')->name('product-categories.create');
        Route::post('/categorias/nuevaCategoria', 'store')->name('product-categories.store');
        Route::delete('/categorias/bulk-delete', 'bulkDestroy')->name('product-categories.bulk-destroy');

        // Dinámicas al final
        Route::get('/categorias/{category}', 'show')->name('product-categories.show');
        Route::put('/categorias/{category}', 'update')->name('product-categories.update');
        Route::delete('/categorias/{category}', 'destroy')->name('product-categories.destroy');
    });

    // --- MÓDULO: MARCAS (Maestros) ---
    Route::middleware(['permission:inventory.config'])->controller(BrandController::class)->group(function () {
        Route::get('/marcas', 'index')->name('product-brands.index');
        Route::get('/marcas/nuevaMarca', 'create')->name('product-brands.create');
        Route::post('/marcas/nuevaMarca', 'store')->name('product-brands.store');
        Route::delete("/marcas/bulk-delete", 'bulkDestroy')->name('product-brands.bulk-destroy');

        // Dinámicas al final
        Route::get('/marcas/{brand}', 'show')->name('product-brands.show');
        Route::put('/marcas/{brand}', 'update')->name('product-brands.update');
        Route::delete('/marcas/{brand}', 'destroy')->name('product-brands.destroy');
    });

    // --- MÓDULO: TIPOS DE PRODUCTO (Maestros) ---
    Route::middleware(['permission:inventory.config'])->controller(ProductTypeController::class)->group(function () {
        Route::get('/tipoProducto', 'index')->name('product-types.index');
        Route::get('/tipoProducto/nuevaTipoProducto', 'create')->name('product-types.create');
        Route::post('/tipoProducto/nuevaTipoProducto', 'store')->name('product-types.store');
        Route::delete("/tipoProducto/bulk-delete", 'bulkDestroy')->name('product-types.bulk-destroy');

        // Dinámicas al final
        Route::get('/tipoProducto/{type}', 'show')->name('product-types.show');
        Route::put('/tipoProducto/{type}', 'update')->name('product-types.update');
        Route::delete('/tipoProducto/{type}', 'destroy')->name('product-types.destroy');
    });
});
