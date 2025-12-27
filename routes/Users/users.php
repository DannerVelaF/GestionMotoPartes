<?php

use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
  Route::controller(UserController::class)->group(function () {
    Route::get('/usuarios', 'index')->name('users.index');
    Route::get('/usuarios/nuevoUsuario', 'create')->name('users.create');
    Route::post('/usuarios/nuevoUsuario', 'store')->name('users.store');
    Route::get('/usuarios/{user}', 'show')->name('users.show');
    Route::put('/usuarios/{user}/reset-password', 'resetPassword')->name('users.reset-password');
    Route::put('/usuarios/{user}', 'update')->name('users.update');
  });
  Route::controller(RoleController::class)->group(function () {
    Route::get('/roles', 'index')->name('roles.index');
    Route::get('/roles/nuevoRol', 'create')->name('roles.create');
    Route::post('/roles/nuevoRol', 'store')->name('roles.store');
    Route::get('/roles/{role}/editar', 'show')->name('roles.show');
    Route::put('/roles/{role}', 'update')->name('roles.update');
    Route::delete('/roles/{role}', 'destroy')->name('roles.destroy');
  });
});
