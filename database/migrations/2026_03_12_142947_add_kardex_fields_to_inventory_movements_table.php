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
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->date('kardex_date')->nullable()->after('type'); // Fecha real del movimiento
            $table->decimal('total_cost', 12, 2)->default(0)->after('unit_cost'); // Para kardex valorizado
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->dropColumn(['kardex_date', 'total_cost']);
        });
    }
};
