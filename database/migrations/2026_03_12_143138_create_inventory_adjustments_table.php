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
        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id('id_adjustment');
            $table->string('reference_code')->unique(); // Ej: AJU-20260312-001

            $table->string('operation_type'); // SUNAT: 13-Merma, 02-Compra, etc.
            $table->date('kardex_date');
            $table->string('reason');
            $table->string('location')->default('Almacén Principal');

            // --- NUEVOS CAMPOS ERP (KARDEX OFICIAL) ---
            $table->string('contact_name')->nullable(); // Cliente / Proveedor / Empleado
            $table->string('document_type')->nullable(); // Factura, Boleta, Guía, Ticket
            $table->string('document_number')->nullable(); // F001-000234
            $table->decimal('exchange_rate', 10, 4)->default(1.0000); // TC: 3.7500

            // ESTADO DEL FLUJO (Borrador -> Realizado)
            $table->string('status')->default('draft'); // draft, waiting, done, cancelled

            $table->unsignedBigInteger('id_user');
            $table->timestamps();

            $table->foreign('id_user')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustments');
    }
};
