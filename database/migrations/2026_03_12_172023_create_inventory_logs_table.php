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
        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_adjustment'); // A qué documento pertenece
            $table->unsignedBigInteger('id_user'); // Quién hizo la acción

            $table->string('action'); // Ej: "Modificación", "Cambio de Estado", "Nota"

            // --- TRACKING DE VALORES (AUDITORÍA) ---
            $table->string('field_changed')->nullable(); // Ej: 'Cantidad Producto A', 'Estado', 'Fecha Kardex'
            $table->text('old_value')->nullable(); // Valor que tenía antes (Ej: '10.00' o 'Borrador')
            $table->text('new_value')->nullable(); // Nuevo valor (Ej: '15.00' o 'Realizado')

            $table->text('notes')->nullable(); // Comentarios manuales
            $table->timestamps(); // Esto guarda automáticamente la FECHA y HORA exacta (created_at)

            $table->foreign('id_adjustment')->references('id_adjustment')->on('inventory_adjustments')->onDelete('cascade');
            $table->foreign('id_user')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
    }
};
