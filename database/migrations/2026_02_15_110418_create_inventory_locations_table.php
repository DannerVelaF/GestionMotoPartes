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
        Schema::create('inventory_locations', function (Blueprint $table) {
            $table->id('id_location');
            $table->string('name'); // Ej: Almacén Central, Partners/Proveedores
            $table->enum('type', ['internal', 'view', 'supplier', 'customer', 'inventory', 'loss'])->default('internal');
            $table->foreignId('parent_id')->nullable()->constrained('inventory_locations', 'id_location')->onDelete('cascade');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_locations');
    }
};
