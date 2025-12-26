<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Importante
use Illuminate\Support\Facades\Hash; // Importante

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->string('dni', 8)->unique();
            $table->string('name');
            $table->string("father_last_name")->nullable();
            $table->string("mother_last_name")->nullable();
            $table->string('email')->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->string('password');
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        // --- INSERTAR USUARIO ADMIN AQUÍ ---
        DB::table('users')->insert([
            'username'   => 'admin',
            'dni'        => '12345678', // Asegúrate de que cumpla con los 8 caracteres
            'name'       => 'Administrador',
            'father_last_name' => 'Sistema',
            'mother_last_name' => 'Principal',
            'email'      => 'admin@sistema.com',
            'password'   => Hash::make('admin'), // Siempre hashear la contraseña
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
