<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('product_suppliers', function (Blueprint $table) {
            $table->id("id_product_supplier");
            $table->unsignedBigInteger("id_product")->nullable();
            $table->unsignedBigInteger("id_supplier")->nullable();

            $table->foreign("id_product")->references("id_product")->on("products")->onDelete("set null");
            $table->foreign("id_supplier")->references("id_supplier")->on("suppliers")->onDelete("set null");

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_suppliers');
    }
};
