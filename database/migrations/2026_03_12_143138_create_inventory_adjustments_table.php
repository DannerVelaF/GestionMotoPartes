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
            $table->string('reference_code')->unique(); // Ej: WH/IN/0001 (Generado por tipo de operación)

            // --- CONFIGURACIÓN DE FLUJO (Estilo Odoo) ---
            // Relación con tabla de tipos (Recepción, Entrega, Ajuste)
            $table->unsignedBigInteger('id_operation_type')->nullable();

            // El "DE" y el "PARA" (Ubicaciones reales)
            $table->unsignedBigInteger('id_location_source')->nullable(); // Origen (Ej: Proveedor)
            $table->unsignedBigInteger('id_location_destination')->nullable(); // Destino (Ej: Stock)

            // --- DATOS DE LA OPERACIÓN ---
            $table->date('kardex_date');
            $table->string('reason')->nullable(); // Notas o motivo

            // --- NUEVOS CAMPOS ERP (KARDEX OFICIAL) ---
            $table->string('contact_name')->nullable();
            $table->string('document_type')->nullable();
            $table->string('document_number')->nullable();
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);

            // --- TRAZABILIDAD (Link a la Orden de Compra) ---
            // Esto permite que el movimiento sepa que viene de la OC #15
            $table->nullableMorphs('source_document', 'inv_adj_source_idx');
            // ESTADO DEL FLUJO
            $table->string('status')->default('draft'); // draft, ready, done, cancelled

            $table->unsignedBigInteger('id_user');
            $table->timestamps();

            // --- LLAVES FORÁNEAS ---
            $table->foreign('id_user')->references('id')->on('users');
            $table->foreign('id_location_source')->references('id_location')->on('inventory_locations');
            $table->foreign('id_location_destination')->references('id_location')->on('inventory_locations');
            $table->foreign('id_operation_type')->references('id_operation_type')->on('inventory_operation_types');
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
