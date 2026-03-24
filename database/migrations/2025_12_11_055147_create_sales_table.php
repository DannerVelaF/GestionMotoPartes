<?php

use App\Enums\DocumentType;
use App\Enums\SalesStatus;
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
        Schema::create('sales', function (Blueprint $table) {
            $table->id("id_sales");
            $table->string("code_sales")->unique(); // VEN-202603-0001 (Control interno)
            $table->dateTime("date_sales");

            // Información del Cliente
            $table->string('receiver_id_number', 20)->nullable();
            $table->string('receiver_name', 255)->nullable();
            $table->string('receiver_address', 255)->nullable();

            // Totales
            $table->decimal("subtotal", 12, 2);
            $table->decimal("tax", 12, 2);
            $table->decimal("discount", 12, 2)->default(0);
            $table->decimal("total", 12, 2);

            $table->unsignedBigInteger("id_method_payment")->nullable();
            $table->foreign("id_method_payment")->references("id_method_payment")->on("method_payments")->onDelete("set null");

            // Estado: draft (cotización), completed (venta hecha), cancelled
            $table->string('status')->default('draft');

            $table->unsignedBigInteger("id_user")->nullable();
            $table->foreign("id_user")->references("id")->on("users")->onDelete("set null");

            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
