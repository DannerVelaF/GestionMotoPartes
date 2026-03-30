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
        Schema::create('permissions', function (Blueprint $table) {
            $table->id("id_permission");
            $table->string('name')->unique(); // Ej: 'purchase.approve'
            $table->string('label');           // Ej: 'Aprobar Órdenes de Compra'
            $table->string('module');
            $table->timestamps();
        });

        Schema::create('permission_role', function (Blueprint $table) {
            $table->id("id_permission_role");
            $table->unsignedBigInteger("id_permission");
            $table->unsignedBigInteger("id_role");
            $table->foreign("id_permission")->references("id_permission")->on("permissions");
            $table->foreign("id_role")->references("id")->on("roles");

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
