<?php

namespace Database\Seeders;

use App\Models\Permissions;
use App\Models\Role;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $perms = [];

        // --- MÓDULO: COMPRAS ---
        $perms[] = Permissions::create(['name' => 'purchase.view', 'label' => 'Ver Listado de OC', 'module' => 'Compras']);
        $perms[] = Permissions::create(['name' => 'purchase.create', 'label' => 'Crear OC', 'module' => 'Compras']);
        $perms[] = Permissions::create(['name' => 'purchase.approve', 'label' => 'Aprobar OC', 'module' => 'Compras']);
        $perms[] = Permissions::create(['name' => 'purchase.delete', 'label' => 'Eliminar/Anular OC', 'module' => 'Compras']);

        // --- MÓDULO: VENTAS ---
        $perms[] = Permissions::create(['name' => 'sales.view', 'label' => 'Ver Historial de Ventas', 'module' => 'Ventas']);
        $perms[] = Permissions::create(['name' => 'sales.create', 'label' => 'Crear Ventas', 'module' => 'Ventas']);
        $perms[] = Permissions::create(['name' => 'sales.void', 'label' => 'Anular Venta realizada', 'module' => 'Ventas']);

        // --- MÓDULO: INVENTARIO (CRUCIAL PARA LOGÍSTICA) ---
        $perms[] = Permissions::create(['name' => 'inventory.view', 'label' => 'Ver Inventario y Stock', 'module' => 'Inventario']);
        $perms[] = Permissions::create(['name' => 'inventory.edit', 'label' => 'Ajustar Stock Manualmente', 'module' => 'Inventario']);
        $perms[] = Permissions::create(['name' => 'inventory.movement', 'label' => 'Registrar Entradas/Salidas', 'module' => 'Inventario']);
        $perms[] = Permissions::create(['name' => 'inventory.transfer', 'label' => 'Transferir entre Almacenes', 'module' => 'Inventario']);
        $perms[] = Permissions::create(['name' => 'inventory.config', 'label' => 'Configurar Ubicaciones y Tipos', 'module' => 'Inventario']);

        // --- MÓDULO: FACTURACIÓN / RECIBOS ---
        $perms[] = Permissions::create(['name' => 'billing.view', 'label' => 'Ver Comprobantes', 'module' => 'Facturación']);
        $perms[] = Permissions::create(['name' => 'billing.create', 'label' => 'Emitir Factura/Boleta', 'module' => 'Facturación']);
        $perms[] = Permissions::create(['name' => 'billing.void', 'label' => 'Anular Comprobantes', 'module' => 'Facturación']);
        $perms[] = Permissions::create(['name' => 'billing.report', 'label' => 'Descargar Reportes Tributarios', 'module' => 'Facturación']);

        // --- MÓDULO: USUARIOS Y SEGURIDAD ---
        $perms[] = Permissions::create(['name' => 'user.view', 'label' => 'Listar Usuarios', 'module' => 'Usuarios']);
        $perms[] = Permissions::create(['name' => 'user.create', 'label' => 'Registrar/Editar Usuarios', 'module' => 'Usuarios']);
        $perms[] = Permissions::create(['name' => 'roles.view', 'label' => 'Ver Roles y Permisos', 'module' => 'Usuarios']);

        // Obtenemos todos los IDs para el admin
        $allPermissionIds = collect($perms)->pluck('id_permission')->toArray();

        // --- ASIGNACIÓN DE ROLES ---
        $admin = Role::where('name', 'admin')->first();
        $colab = Role::where('name', 'collaborator')->first();

        if ($admin) {
            // El admin tiene TODO por definición
            $admin->permissions()->sync($allPermissionIds);
        }

        if ($colab) {
            // El colaborador suele ser para Ventas e Inventario básico
            $colabPermissions = Permissions::whereIn('name', [
                'sales.view',
                'sales.create',
                'inventory.view',
                'inventory.movement',
                'purchase.view',
                'billing.view'
            ])->pluck('id_permission')->toArray();

            $colab->permissions()->sync($colabPermissions);
        }

        // Llamada a otros seeders de configuración
        $this->call([
            InventoryConfigSeeder::class,
        ]);
    }
}
