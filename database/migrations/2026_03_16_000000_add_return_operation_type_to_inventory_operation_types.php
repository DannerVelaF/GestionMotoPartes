<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_operation_types', function (Blueprint $table) {
            $table->unsignedBigInteger('return_operation_type_id')->nullable();

            $table->foreign('return_operation_type_id', 'inv_op_return_foreign')
                ->references('id_operation_type')
                ->on('inventory_operation_types')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_operation_types', function (Blueprint $table) {
            $table->dropForeign('inv_op_return_foreign');
            $table->dropColumn('return_operation_type_id');
        });
    }
};
