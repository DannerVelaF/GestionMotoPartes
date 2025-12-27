<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Route::get('/', function () {
//     return Inertia::render('welcome', [
//         'canRegister' => Features::enabled(Features::registration()),
//     ]);
// })->name('home');
Route::get("/", function () {
    return redirect()->route('dashboard');
})->name('home');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::group(["prefix" => "manual"], function () {
        Route::get("/", function (){
            return Inertia::render("manual/UserManual");
        })->name("manual.index");
        Route::get("/comprobantes", function (){
            return Inertia::render("manual/ReceiptsManual");
        })->name("manual.comprobantes");
    });

});

require __DIR__ . '/settings.php';
require __DIR__ . '/Sales/sales.php';
require __DIR__ . '/Products/products.php';
require __DIR__ . '/Receipts/receipt.php';
require __DIR__ . '/Inventory/inventory.php';
require __DIR__ . '/Users/users.php';
