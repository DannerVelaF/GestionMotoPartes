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
        Schema::table('inventory_operation_types', function (Blueprint $table) {
            // El nombre exacto del índice que causaba el error
            $table->dropUnique('inventory_operation_types_code_unique');

            // Hacemos que el prefijo sea único obligatoriamente
            $table->unique('sequence_prefix');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_operation_types', function (Blueprint $table) {
            $table->dropUnique(['sequence_prefix']);
            $table->unique('code');
        });
    }
};
