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

            // --- Campos del Documento ---
            $table->enum("document_type", array_column(DocumentType::cases(),"value"))->default(DocumentType::RECEIPT->value);
            $table->string('series', 5);
            $table->string('number', 10);

            // Asegurar que la referencia (serie + número) sea única por tipo de documento
            $table->unique(['document_type', 'series', 'number']);

            // --- Información del Receptor/Cliente ---
            $table->string('receiver_id_number', 20)->nullable()->comment('DNI o RUC del cliente');
            $table->string('receiver_name', 255)->nullable()->comment('Nombre o Razon Social del cliente');
            $table->string('receiver_address', 255)->nullable();

            // --- Otros Campos ---
            $table->string("code_sales")->unique();
            $table->date("date_sales");

            $table->decimal("subtotal", 10,2);
            $table->decimal("tax", 10,2);
            $table->decimal("discount", 10,2)->default(0); // Incluido default por buena práctica
            $table->decimal("total", 10,2);

            $table->enum("status", array_column(SalesStatus::cases(), 'value'))
                ->default(SalesStatus::PENDING->value);

            $table->unsignedBigInteger("id_user")->nullable();
            $table->foreign("id_user")->references("id")->on("users")->onDelete("set null");

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
