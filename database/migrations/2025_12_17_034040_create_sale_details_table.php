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

            // ✅ Relación con Impuestos (IGV, Exonerado, etc.)
            $table->unsignedBigInteger("id_tax")->nullable();
            $table->foreign("id_tax")->references("id_tax")->on("taxes")->onDelete('restrict');

            $table->unsignedBigInteger("id_user")->nullable();
            $table->foreign("id_user")->references("id")->on("users")->onDelete('set null');

            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 10, 2); // Precio de venta incluyendo impuesto

            // ✅ Monto del impuesto calculado para esta línea
            $table->decimal('tax_amount', 10, 2)->default(0);

            // El subtotal es el resultado de la cantidad por el precio unitario
            $table->decimal('subtotal', 10, 2)->virtualAs('quantity * unit_price');

            $table->timestamps();

            // Evitar duplicados del mismo producto en la misma venta
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
