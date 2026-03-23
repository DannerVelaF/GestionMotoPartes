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
        Schema::create('purchase_order_details', function (Blueprint $table) {
            $table->id('id_po_detail');
            $table->unsignedBigInteger('id_purchase_order');
            $table->unsignedBigInteger('id_product');

            $table->decimal('quantity', 10, 3);
            $table->decimal('unit_cost', 10, 2); // A cuánto lo compro
            $table->decimal('subtotal', 10, 2);

            // --- LO QUE PIDIÓ TU CLIENTE ---
            $table->decimal('margin_percentage', 5, 2)->default(0); // Ej: 30.00 (%)
            $table->decimal('suggested_sale_price', 10, 2)->default(0); // A cuánto lo debería vender

            $table->timestamps();

            $table->unsignedBigInteger("id_tax");
            $table->foreign('id_tax')->references('id_tax')->on('taxes')->onDelete("cascade");

            $table->foreign('id_purchase_order')->references('id_purchase_order')->on('purchase_orders')->onDelete('cascade');
            $table->foreign('id_product')->references('id_product')->on('products');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_order_details');
    }
};
