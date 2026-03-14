<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            // Fechas de flujo
            $table->timestamp('approved_at')->nullable();     // Fecha de aprobación
            $table->date('actual_arrival_date')->nullable(); // Fecha de llegada real (cuando entra a almacén)

            // Relaciones de usuarios (además del creador id_user)
            $table->unsignedBigInteger('requested_by')->nullable(); // Quién solicita la aprobación
            $table->unsignedBigInteger('approved_by')->nullable();  // Quién aprobó

            // Foreign keys
            $table->foreign('requested_by')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            // Eliminar columnas de flujo
            $table->dropColumn(['approved_at', 'actual_arrival_date', 'requested_by', 'approved_by']);
        });
    }
};
