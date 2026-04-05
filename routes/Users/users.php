<?php

use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {

    Route::middleware(['permission:user.view'])->controller(UserController::class)->group(function () {

        Route::get('/usuarios', 'index')->name('users.index');

        Route::middleware(['permission:user.create'])->group(function () {
            Route::get('/usuarios/nuevoUsuario', 'create')->name('users.create');
            Route::post('/usuarios/nuevoUsuario', 'store')->name('users.store');
        });

        Route::get('/usuarios/{user}', 'show')->name('users.show');

        Route::middleware(['permission:user.create'])->group(function () {
            Route::put('/usuarios/{user}', 'update')->name('users.update');
            Route::put('/usuarios/{user}/reset-password', 'resetPassword')->name('users.reset-password');
        });
    });

    Route::middleware(['permission:roles.view'])->controller(RoleController::class)->group(function () {
        Route::get('/roles', 'index')->name('roles.index');

        Route::middleware(['permission:user.create'])->group(function () {
            Route::get('/roles/nuevoRol', 'create')->name('roles.create');
            Route::post('/roles/nuevoRol', 'store')->name('roles.store');
        });

        Route::get('/roles/{role}/editar', 'show')->name('roles.show');

        Route::middleware(['permission:user.create'])->group(function () {
            Route::put('/roles/{role}', 'update')->name('roles.update');
            Route::delete('/roles/{role}', 'destroy')->name('roles.destroy');
        });
    });
});
