<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Crear usuario Administrador Maestro
        User::firstOrCreate(
            ['username' => 'admin'], // Buscamos por username
            [
                'name' => 'Administrador',
                'father_last_name' => 'Sistema',
                'mother_last_name' => 'Root',
                'email' => 'admin@sistema.com',
                'password' => 'admin', // El cast 'hashed' en el modelo User lo encriptará automáticamente
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Opcional: Crear un usuario de prueba normal
        User::firstOrCreate(
            ['username' => 'operador'],
            [
                'name' => 'Usuario',
                'father_last_name' => 'Prueba',
                'mother_last_name' => 'Demo',
                'email' => 'test@example.com',
                'password' => 'password',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
