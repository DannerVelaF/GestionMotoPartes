<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('inventory_adjustment_details', function (Blueprint $table) {
            $table->id('id_adjustment_detail');
            $table->unsignedBigInteger('id_adjustment');
            $table->unsignedBigInteger('id_product');

            $table->decimal('demand', 10, 2)->default(0);   // Cantidad esperada de la OC
            $table->decimal('quantity', 10, 2)->default(0); // Cantidad realmente recibida/hecha
            $table->decimal('unit_cost', 10, 2)->default(0); // Costo unitario

            $table->timestamps();

            $table->foreign('id_adjustment')->references('id_adjustment')->on('inventory_adjustments')->onDelete('cascade');
            $table->foreign('id_product')->references('id_product')->on('products')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustment_details');
    }
};
