<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Ej: 'admin', 'collaborator'
            $table->string('label');          // Ej: 'Administrador', 'Colaborador'
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // --- INSERTAR SOLO 2 ROLES ---
        DB::table('roles')->insert([
            [
                'name' => 'admin',
                'label' => 'Administrador',
                'description' => 'Acceso total al sistema (Configuración, Usuarios, Reportes, Caja, Ventas)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'collaborator',
                'label' => 'Colaborador',
                'description' => 'Acceso operativo (Ventas, Clientes, Inventario básico)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
