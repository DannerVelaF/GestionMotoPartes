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
            // "quantity" ya existe y será nuestra "Cantidad Pedida"

            // Cantidad que ya ingresó físicamente al Kardex
            $table->decimal('received_quantity', 10, 3)->default(0)->after('quantity');

            // Cantidad que ya tiene un Comprobante (Factura) registrado
            $table->decimal('billed_quantity', 10, 3)->default(0)->after('received_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('po_details', function (Blueprint $table) {
            $table->dropColumn('received_quantity');
            $table->dropColumn('billed_quantity');
        });
    }
};
