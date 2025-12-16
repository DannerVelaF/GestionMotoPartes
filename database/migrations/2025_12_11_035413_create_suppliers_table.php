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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id("id_supplier");
            $table->string("company_name", 200)->unique();
            $table->string("ruc", 25)->unique();
            $table->string("supplier_name", 200)->nullable();
            $table->string("supplier_email", 200)->unique()->nullable();;
            $table->string("supplier_phone", 15)->nullable();;
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
