<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\NotificationController;

// Route::get('/', function () {
//     return Inertia::render('welcome', [
//         'canRegister' => Features::enabled(Features::registration()),
//     ]);
// })->name('home');
Route::get("/", function () {
    return redirect()->route('dashboard');
})->name('home');

Broadcast::routes(['middleware' => ['auth', 'web']]);

Route::middleware(['auth'])->group(function () {
    // Página principal de historial
    Route::get('/notificaciones', [NotificationController::class, 'index'])->name('notifications.index');

    // Marcar una como leída (usada por la campana y el historial)
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    // Marcar todas como leídas
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // Opcional: Eliminar una notificación
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::group(["prefix" => "manual"], function () {
        Route::get("/", function () {
            return Inertia::render("manual/UserManual");
        })->name("manual.index");
        Route::get("/comprobantes", function () {
            return Inertia::render("manual/ReceiptsManual");
        })->name("manual.comprobantes");
        Route::get("/ventas", function () {
            return Inertia::render("manual/SalesManual");
        })->name("manual.ventas");
        Route::get("/inventario", function () {
            return Inertia::render("manual/InventoryManual");
        })->name("manual.inventario");
        Route::get("/productos", function () {
            return Inertia::render("manual/ProductsManual");
        })->name("manual.productos");
        Route::get("/proveedores", function () {
            return Inertia::render("manual/SuppliersManual");
        })->name("manual.proveedores");
        Route::get("/usuarios", function () {
            return Inertia::render("manual/UsersManual");
        })->name("manual.usuarios");
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/Sales/sales.php';
require __DIR__ . '/Products/products.php';
require __DIR__ . '/Receipts/receipt.php';
require __DIR__ . '/Inventory/inventory.php';
require __DIR__ . '/Users/users.php';
