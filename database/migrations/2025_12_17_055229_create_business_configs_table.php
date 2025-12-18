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
        Schema::create('business_configs', function (Blueprint $table) {
            $table->id("id_business_config");
            $table->string('company_name');
            $table->string('ruc', 11);
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('city')->nullable();

            $table->text('ticket_footer')->nullable();
            $table->string('logo_path')->nullable();

            $table->text('api_service_token')->nullable();
            $table->string('api_service_url')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_configs');
    }
};
