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
        Schema::create('inventory_operation_types', function (Blueprint $table) {
            $table->id('id_operation_type');
            $table->string('name');
            $table->string('code')->unique();

            // Definimos las columnas
            $table->unsignedBigInteger('default_location_source_id')->nullable();
            $table->unsignedBigInteger('default_location_destination_id')->nullable();

            // Creamos las llaves foráneas con nombres manuales cortos
            $table->foreign('default_location_source_id', 'inv_op_src_foreign')
                ->references('id_location')
                ->on('inventory_locations');

            $table->foreign('default_location_destination_id', 'inv_op_dest_foreign')
                ->references('id_location')
                ->on('inventory_locations');

            $table->string('sequence_prefix');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_operation_types');
    }
};
