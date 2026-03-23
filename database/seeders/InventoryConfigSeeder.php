<?php

namespace Database\Seeders;

use App\Models\InventoryLocation;
use App\Models\InventoryOperationType;
use Illuminate\Database\Seeder;

class InventoryConfigSeeder extends Seeder
{
    public function run()
    {
        // ---------------------------------------------------
        // 1. CREAR UBICACIONES (Físicas y Virtuales)
        // ---------------------------------------------------

        $locSupplier = InventoryLocation::updateOrCreate(
            ['name' => 'Partners / Proveedores'],
            ['type' => 'supplier']
        );

        $locCustomer = InventoryLocation::updateOrCreate(
            ['name' => 'Partners / Clientes'],
            ['type' => 'customer']
        );

        $locStock = InventoryLocation::updateOrCreate(
            ['name' => 'WH / Stock'],
            ['type' => 'internal']
        );

        $locAdjustment = InventoryLocation::updateOrCreate(
            ['name' => 'Virtual Location / Ajuste de Inventario'],
            ['type' => 'inventory']
        );

        $locScrap = InventoryLocation::updateOrCreate(
            ['name' => 'Virtual Location / Desecho (Scrap)'],
            ['type' => 'loss']
        );

        $locInitial = InventoryLocation::updateOrCreate(
            ['name' => 'Virtual Location / Saldos Iniciales'],
            ['type' => 'inventory']
        );

        // ---------------------------------------------------
        // 2. CREAR TIPOS DE OPERACIÓN DE DEVOLUCIÓN (Hijos)
        // ---------------------------------------------------

        // ID 5: Devolución de Cliente (Ingreso) -> El cliente nos devuelve
        $opDevCliente = InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/RET-IN/'],
            [
                'name' => 'Devoluciones de Cliente',
                'code' => 'IN', // Suma al stock
                'default_location_source_id'      => $locCustomer->id_location,
                'default_location_destination_id' => $locStock->id_location,
                'return_operation_type_id'        => null, // Las devoluciones no tienen devoluciones
            ]
        );

        // ID 6: Devolución a Proveedor (Salida) -> Nosotros devolvemos al proveedor
        $opDevProveedor = InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/RET-OUT/'],
            [
                'name' => 'Devoluciones a Proveedor',
                'code' => 'OUT', // Resta al stock
                'default_location_source_id'      => $locStock->id_location,
                'default_location_destination_id' => $locSupplier->id_location,
                'return_operation_type_id'        => null,
            ]
        );

        // ---------------------------------------------------
        // 3. CREAR TIPOS DE OPERACIÓN PRINCIPALES (Padres)
        // ---------------------------------------------------

        // ID 1: Recepciones (Compras)
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/IN/'],
            [
                'name' => 'Recepciones',
                'code' => 'IN',
                'default_location_source_id'      => $locSupplier->id_location,
                'default_location_destination_id' => $locStock->id_location,
                'return_operation_type_id'        => $opDevProveedor->id_operation_type, // ✅ Apunta a su devolución
            ]
        );

        // ID 2: Ventas / Órdenes de Entrega
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/OUT/'],
            [
                // Nota: Tu me pasaste "Ventas" en la lista de arriba, así que le pongo Ventas.
                // Si quieres dejarlo como "Órdenes de Entrega", solo cámbialo aquí.
                'name' => 'Ventas',
                'code' => 'OUT',
                'default_location_source_id'      => $locStock->id_location,
                'default_location_destination_id' => $locCustomer->id_location,
                'return_operation_type_id'        => $opDevCliente->id_operation_type, // ✅ Apunta a su devolución
            ]
        );

        // ID 3: Transferencias Internas
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/INT/'],
            [
                'name' => 'Transferencias Internas',
                'code' => 'INT',
                'default_location_source_id'      => $locStock->id_location,
                'default_location_destination_id' => $locStock->id_location,
                'return_operation_type_id'        => null,
            ]
        );

        // ID 4: Ajustes de Inventario
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/ADJ/'],
            [
                'name' => 'Ajustes de Inventario',
                'code' => 'ADJ',
                'default_location_source_id'      => $locAdjustment->id_location,
                'default_location_destination_id' => $locStock->id_location,
                'return_operation_type_id'        => null,
            ]
        );

        // ID 7: Saldos Iniciales
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/INIT/'],
            [
                'name' => 'Saldos Iniciales',
                'code' => 'INIT',
                'default_location_source_id'      => $locInitial->id_location,
                'default_location_destination_id' => $locStock->id_location,
                'return_operation_type_id'        => null,
            ]
        );
    }
}
