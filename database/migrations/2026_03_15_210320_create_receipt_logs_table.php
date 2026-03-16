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
        Schema::create('receipt_logs', function (Blueprint $table) {
            $table->id('id_receipt_log');
            $table->foreignId('id_receipt')->constrained('receipts', 'id_receipt')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users'); // Quién hizo la acción
            $table->string('action'); // Ej: 'Documento Creado', 'Nota', 'Devolución'
            $table->string('field_changed')->nullable();
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->text('notes')->nullable(); // Para el texto de la nota interna
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipt_logs');
    }
};
