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
            $table->string("receipt_code"); // Código interno del sistema (REC-XXXX)

            $table->unsignedBigInteger("id_supplier")->nullable();
            $table->foreign("id_supplier")->references("id_supplier")->on("suppliers");

            $table->unsignedBigInteger("id_purchase_order")->nullable();
            $table->foreign("id_purchase_order")->references("id_purchase_order")->on("purchase_orders")->onDelete('set null');

            // Un comprobante puede estar amarrado a una recepción específica de almacén
            $table->unsignedBigInteger("id_adjustment")->nullable();
            $table->foreign("id_adjustment")->references("id_adjustment")->on("inventory_adjustments")->onDelete('set null');

            $table->string('series', 20);       // Ej: F001 o B001
            $table->string('number', 20);       // Ej: 00012345
            $table->dateTime('issue_date');      // Fecha de emisión física del comprobante
            $table->timestamp('published_at')->nullable();
            $table->decimal('total_amount', 10, 2);

            $table->unsignedBigInteger("id_parent")->nullable();
            $table->foreign("id_parent")->references("id_receipt")->on("receipts")->onDelete('cascade');

            $table->enum("document_type", array_column(DocumentType::cases(), "value"))->default(DocumentType::RECEIPT->value);
            $table->string('receipt_path')->nullable();

            $table->unsignedBigInteger("id_sales")->nullable();
            $table->foreign("id_sales")->references("id_sales")->on("sales")->onDelete('set null');

            $table->enum('currency', ['PEN', 'USD'])->default('PEN');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->enum('status', ['draft', 'published', 'cancelled'])->default('draft');
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
