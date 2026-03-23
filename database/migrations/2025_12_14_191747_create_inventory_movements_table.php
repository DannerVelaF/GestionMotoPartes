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
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id("id_movement");
            $table->unsignedBigInteger("id_product");
            $table->foreign("id_product")->references("id_product")->on("products");
            $table->unsignedBigInteger("id_user");
            $table->foreign("id_user")->references("id")->on("users");
            $table->string('type');

            $table->date('kardex_date');

            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_cost', 10, 2)->default(0);

            $table->decimal('total_cost', 10, 2)->default(0);

            $table->decimal('balance', 10, 2);
            $table->nullableMorphs('reference');
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
