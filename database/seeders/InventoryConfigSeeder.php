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
        // Usamos updateOrCreate para evitar duplicados si corres el seeder varias veces
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


        // ---------------------------------------------------
        // 2. CREAR TIPOS DE OPERACIÓN
        // ---------------------------------------------------

        // Recepciones (Ingreso por compras)
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/IN/'],
            [
                'name' => 'Recepciones',
                'code' => 'IN',
                'default_location_source_id'      => $locSupplier->id_location,
                'default_location_destination_id' => $locStock->id_location,
            ]
        );

        // Órdenes de Entrega (Salida por ventas)
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/OUT/'],
            [
                'name' => 'Órdenes de Entrega',
                'code' => 'OUT',
                'default_location_source_id'      => $locStock->id_location,
                'default_location_destination_id' => $locCustomer->id_location,
            ]
        );

        // Transferencias Internas (Movimientos dentro del mismo almacén)
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/INT/'],
            [
                'name' => 'Transferencias Internas',
                'code' => 'INT',
                'default_location_source_id'      => $locStock->id_location,
                'default_location_destination_id' => $locStock->id_location,
            ]
        );

        // Ajustes de Inventario (Sobrantes o faltantes detectados)
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/ADJ/'],
            [
                'name' => 'Ajustes de Inventario',
                'code' => 'ADJ',
                // En un ajuste físico, la ubicación origen suele ser la virtual de ajuste
                'default_location_source_id'      => $locAdjustment->id_location,
                'default_location_destination_id' => $locStock->id_location,
            ]
        );

        // Devolución de Cliente (Ingreso)
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/RET-IN/'],
            [
                'name' => 'Devoluciones de Cliente',
                'code' => 'IN', // Suma al stock local
                'default_location_source_id'      => $locCustomer->id_location,
                'default_location_destination_id' => $locStock->id_location,
            ]
        );

        // Devolución a Proveedor (Salida)
        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/RET-OUT/'],
            [
                'name' => 'Devoluciones a Proveedor',
                'code' => 'OUT', // Resta al stock local
                'default_location_source_id'      => $locStock->id_location,
                'default_location_destination_id' => $locSupplier->id_location,
            ]
        );

        $locInitial = InventoryLocation::updateOrCreate(
            ['name' => 'Virtual Location / Saldos Iniciales'],
            ['type' => 'inventory'] // Sigue siendo de tipo inventario (virtual)
        );

        InventoryOperationType::updateOrCreate(
            ['sequence_prefix' => 'WH/INIT/'],
            [
                'name' => 'Saldos Iniciales',
                'code' => 'INIT',
                'default_location_source_id'      => $locInitial->id_location, // De: Virtual Inicial
                'default_location_destination_id' => $locStock->id_location,   // Para: Stock Real
            ]
        );
    }
}
