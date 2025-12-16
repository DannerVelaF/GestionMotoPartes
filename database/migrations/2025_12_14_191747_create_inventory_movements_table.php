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

            // Cantidad: Positiva (entrada) o Negativa (salida)
            $table->decimal('quantity', 10, 2);

            // Costo unitario en el momento del movimiento (para valoración)
            $table->decimal('unit_cost', 10, 2)->default(0);

            // Stock resultante después del movimiento (Snapshopt)
            $table->decimal('balance', 10, 2);

            // Relación Polimórfica (Para saber si vino de un Receipt, Sale, o Ajuste Manual)
            $table->nullableMorphs('reference'); // Crea reference_id y reference_type

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
