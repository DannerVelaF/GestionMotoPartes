<?php

use App\Http\Controllers\Products\BrandController;
use App\Http\Controllers\Products\ProductCategoryController;
use App\Http\Controllers\Products\ProductController;
use App\Http\Controllers\Products\ProductTypeController;

Route::middleware("auth")->group(function () {
    Route::get('/productos/template', [ProductController::class, 'template'])->name('products.template');
    Route::post('/productos/import', [ProductController::class, 'import'])->name('products.import');
    Route::get("/productos", [ProductController::class, "index"])->name("products.index");
    Route::get("/productos/nuevoProducto", [ProductController::class, "create"])->name("products.create");
    Route::post('/productos/nuevoProducto', [ProductController::class, 'store'])
        ->name('products.store');
    Route::get("/productos/{product}", [ProductController::class, "show"])->name("products.show");
    Route::put("/productos/{product}", [ProductController::class, "update"])->name("products.update");
    Route::delete("/productos/bulk-delete", [ProductController::class, "bulkDestroy"])->name("products.bulk-delete");
    Route::delete("/productos/{product}", [ProductController::class, "destroy"])->name("products.destroy");

    Route::controller(ProductCategoryController::class)->group(function () {
        Route::get('/categorias', 'index')->name('product-categories.index');
        Route::get('/categorias/nuevaCategoria', 'create')->name('product-categories.create');
        Route::post('/categorias/nuevaCategoria', 'store')->name('product-categories.store');
        Route::get('/categorias/{category}', 'show')->name('product-categories.show');
        Route::put('/categorias/{category}', 'update')->name('product-categories.update');
        Route::delete('/categorias/bulk-delete', 'bulkDestroy')->name('product-categories.bulk-destroy');
        Route::delete('/categorias/{category}', 'destroy')->name('product-categories.destroy');
    });

    Route::controller(BrandController::class)->group(function () {
        Route::get('/marcas', 'index')->name('product-brands.index');
        Route::get('/marcas/nuevaMarca', 'create')->name('product-brands.create');
        Route::post('/marcas/nuevaMarca', 'store')->name('product-brands.store');
        Route::get('/marcas/{brand}', 'show')->name('product-brands.show');
        Route::put('/marcas/{brand}', 'update')->name('product-brands.update');
        Route::delete("/marcas/bulk-delete", 'bulkDestroy')->name('product-brands.bulk-destroy');
        Route::delete('/marcas/{brand}', 'destroy')->name('product-brands.destroy');
    });

    Route::controller(ProductTypeController::class)->group(function () {
        Route::get('/tipoProducto', 'index')->name('product-types.index');
        Route::get('/tipoProducto/nuevaTipoProducto', 'create')->name('product-types.create');
        Route::post('/tipoProducto/nuevaTipoProducto', 'store')->name('product-types.store');
        Route::get('/tipoProducto/{type}', 'show')->name('product-types.show');
        Route::put('/tipoProducto/{type}', 'update')->name('product-types.update');
        Route::delete("/tipoProducto/bulk-delete", 'bulkDestroy')->name('product-types.bulk-destroy');
        Route::delete('/tipoProducto/{type}', 'destroy')->name('product-types.destroy');
    });
});
