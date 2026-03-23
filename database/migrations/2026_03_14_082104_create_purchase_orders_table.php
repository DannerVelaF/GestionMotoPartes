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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id('id_purchase_order');
            $table->string('po_code')->unique(); // Ej: OC-202603-0001
            $table->string('order_type')->default('purchase'); // 'purchase' o 'service'

            // Relaciones y Auditoría
            $table->unsignedBigInteger('id_supplier');
            $table->unsignedBigInteger('id_user');      // Creador
            $table->unsignedBigInteger('requested_by')->nullable(); // Solicitante aprobación
            $table->unsignedBigInteger('approved_by')->nullable();  // Quien aprobó

            // Fechas del ciclo de vida
            $table->date('issue_date');                 // Fecha de emisión
            $table->timestamp('approved_at')->nullable(); // Fecha de aprobación
            $table->date('expected_date')->nullable();    // Fecha llegada esperada
            $table->date('actual_arrival_date')->nullable(); // Fecha llegada real (se llena al recibir)

            // Valores Económicos
            $table->string('currency', 3)->default('PEN');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->decimal('total_amount', 12, 2)->default(0);

            // Estado y Otros
            $table->string('status')->default('draft'); // draft, sent, approved, received, cancelled
            $table->text('notes')->nullable();
            $table->string('attachment_path')->nullable();

            $table->timestamps();

            // Foreign Keys
            $table->foreign('id_supplier')->references('id_supplier')->on('suppliers');
            $table->foreign('id_user')->references('id')->on('users');
            $table->foreign('requested_by')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
