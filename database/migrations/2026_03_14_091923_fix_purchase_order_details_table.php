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
        Schema::table('purchase_order_details', function (Blueprint $table) {
            // Agregamos la columna de descripción para los servicios/fletes
            $table->string('description')->nullable()->after('id_product');

            // Hacemos que el id_product sea nullable (porque un servicio no tiene ID de producto)
            $table->unsignedBigInteger('id_product')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_order_details', function (Blueprint $table) {
            // Eliminamos la columna de descripción
            $table->dropColumn('description');

            // Volvemos a hacer que id_product no sea nullable
            $table->unsignedBigInteger('id_product')->nullable(false)->change();
        });
    }
};
