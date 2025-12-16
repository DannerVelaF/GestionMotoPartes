<?php

use App\Enums\SalesStatus;
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
        Schema::create('sales', function (Blueprint $table) {
            $table->id("id_sales");
            $table->string("code_sales")->unique();
            $table->date("date_sales");

            $table->decimal("subtotal", 10,2);
            $table->decimal("tax", 10,2);
            $table->decimal("discount", 10,2);
            $table->decimal("total", 10,2);

            $table->enum("status", array_column(SalesStatus::cases(), 'value'))
                ->default(SalesStatus::PENDING->value);

            $table->unsignedBigInteger("id_user")->nullable();
            $table->foreign("id_user")->references("id")->on("users")->onDelete("set null");

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
