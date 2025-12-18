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
        Schema::create('sale_details', function (Blueprint $table) {
            $table->id("id_sales_detail");

            $table->unsignedBigInteger("id_product");
            $table->foreign("id_product")->references("id_product")->on("products")->onDelete('restrict');

            $table->unsignedBigInteger("id_sales");
            $table->foreign("id_sales")->references("id_sales")->on("sales")->onDelete('cascade');

            // Ajuste: si el usuario se elimina, el detalle no se elimina
            $table->unsignedBigInteger("id_user")->nullable();
            $table->foreign("id_user")->references("id")->on("users")->onDelete('set null');

            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 10, 2);
            // El subtotal debe ser calculable si el producto no tiene descuento individual.
            $table->decimal('subtotal', 10, 2)->virtualAs('quantity * unit_price');

            $table->timestamps();

            $table->unique(['id_sales', 'id_product']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_details');
    }
};
