<?php

use App\Enums\GenericStatus;
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
        Schema::create('products', function (Blueprint $table) {
            $table->id("id_product");
            $table->string("product_name", 200);
            $table->string("product_code", 150)->unique();
            $table->enum("status", array_column(GenericStatus::cases(), "value"))->default(GenericStatus::ACTIVE->value);
            $table->decimal("sale_price", 15, 2)->default(0.00);
            $table->text("notes")->nullable();
            $table->unsignedBigInteger("id_category")->nullable();
            $table->foreign("id_category")->references("id_product_category")->on("product_categories")->ondelete("set null");
            $table->unsignedBigInteger("id_brand")->nullable();
            $table->foreign("id_brand")->references("id_brand")->on("brands")->ondelete("set null");

            $table->unsignedBigInteger("id_product_type")->nullable();
            $table->foreign("id_product_type")->references("id_product_type")->on("product_types")->ondelete("set null");
            $table->decimal('stock', 10, 2)->default(0);
            $table->decimal('purchase_price', 10, 2)->nullable()->default(0);
            $table->string("url_image", 255)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
