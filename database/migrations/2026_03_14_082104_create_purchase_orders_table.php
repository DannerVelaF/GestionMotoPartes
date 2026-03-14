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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id('id_purchase_order');
            $table->string('po_code')->unique(); // Ej: OC-202603-0001
            $table->string('order_type')->default('purchase'); // 'purchase' o 'service'

            $table->unsignedBigInteger('id_supplier');
            $table->unsignedBigInteger('id_user');

            $table->date('issue_date');
            $table->date('expected_date')->nullable();

            $table->string('currency', 3)->default('PEN');
            $table->decimal('exchange_rate', 10, 4)->default(1.000);
            $table->decimal('total_amount', 12, 2)->default(0);

            $table->string('status')->default('draft'); // draft, sent, received, cancelled
            $table->text('notes')->nullable();
            $table->string('attachment_path')->nullable();

            $table->timestamps();

            $table->foreign('id_supplier')->references('id_supplier')->on('suppliers');
            $table->foreign('id_user')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
