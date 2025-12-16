<?php

use App\Enums\DocumentType;
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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id("id_receipt");
            $table->string("receipt_code");
            $table->unsignedBigInteger("id_supplier");
            $table->foreign("id_supplier")->references("id_supplier")->on("suppliers");
            $table->string('series', 20);       // Ej: B001
            $table->string('number', 20);       // Ej: 00012345
            $table->date('issue_date');        // Fecha de emisión
            $table->decimal('total_amount', 10, 2); // Monto total
            $table->enum("document_type", array_column(DocumentType::cases(),"value"))->default(DocumentType::RECEIPT->value);
            $table->string('receipt_path')->nullable(); // Si guardan el archivo
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
