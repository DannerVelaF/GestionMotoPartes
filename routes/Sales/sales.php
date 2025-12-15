<?php

use App\Http\Controllers\Sales\SalesController;

Route::middleware("auth")->group(function (){
    Route::get("/ventas", [SalesController::class, "index"])->name("sales.index");
    Route::get("/ventas/nuevaVenta", [SalesController::class, "create"])->name("sales.create");
});


