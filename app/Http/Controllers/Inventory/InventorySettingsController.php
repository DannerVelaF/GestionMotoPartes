<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryAdjustment;
use App\Models\InventoryLocation;
use App\Models\InventoryOperationType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventorySettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Settings/InventorySettings', [
            'locations' => InventoryLocation::orderBy('id_location', 'desc')->get(),
            'operationTypes' => InventoryOperationType::with(['defaultSource', 'defaultDestination', 'returnType'])->get(),
        ]);
    }

  public function storeLocation(Request $request)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'type' => 'required|in:internal,view,supplier,customer,inventory,loss',
    ]);

    InventoryLocation::create($validated);

    // Aquí sí tenías el mensaje
    return back()->with('success', 'Ubicación creada correctamente.');
  }

  public function storeOperationType(Request $request)
  {
    $validated = $request->validate([
      // El nombre y el prefijo ahora deben ser únicos
      'name'                            => 'required|string|max:255|unique:inventory_operation_types,name',
      'sequence_prefix'                 => 'required|string|max:20|unique:inventory_operation_types,sequence_prefix',

      // El código ya NO es único, permitiendo múltiples IN, OUT, etc.
      'code'                            => 'required|string|max:10',

      'default_location_source_id'      => 'required|exists:inventory_locations,id_location',
      'default_location_destination_id' => 'required|exists:inventory_locations,id_location',
      'return_operation_type_id'     => 'nullable|exists:inventory_operation_types,id_operation_type',
    ], [
      'name.unique'            => 'Ya existe un tipo de operación con este nombre.',
      'sequence_prefix.unique' => 'Este prefijo ya está siendo utilizado por otra operación.',
      'required'               => 'El campo :attribute es obligatorio.',
      'exists'                 => 'La ubicación seleccionada no es válida.'
    ]);

    InventoryOperationType::create($validated);

    return back()->with('success', 'Tipo de operación configurado correctamente.');
  }

  public function destroyLocation($id)
  {
    $inUse = InventoryOperationType::where('default_location_source_id', $id)
      ->orWhere('default_location_destination_id', $id)
      ->exists();

    if ($inUse) {
      return back()->withErrors(['error' => 'Esta ubicación no se puede eliminar porque está en uso.']);
    }

    InventoryLocation::destroy($id);

    // CORREGIDO: Se envía el texto de éxito
    return back()->with('success', 'Ubicación eliminada de forma exitosa.');
  }

  public function destroyOperationType($id)
  {
    // Validar si existen documentos (InventoryAdjustment) usando este tipo
    $hasMovements = InventoryAdjustment::where('id_operation_type', $id)->exists();

    if ($hasMovements) {
      return back()->withErrors([
        'error' => 'No se puede eliminar el tipo de operación porque ya tiene movimientos registrados.'
      ]);
    }

    InventoryOperationType::destroy($id);

    // CORREGIDO: Se envía el texto de éxito
    return back()->with('success', 'El tipo de operación fue eliminado.');
  }
  public function updateLocation(Request $request, $id)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'type' => 'required|in:internal,view,supplier,customer,inventory,loss',
    ]);

    $location = InventoryLocation::findOrFail($id);
    $location->update($validated);

    return back()->with('success', 'Ubicación actualizada correctamente.');
  }

  public function updateOperationType(Request $request, $id)
  {
    $validated = $request->validate([
      'name'                            => 'required|string|max:255|unique:inventory_operation_types,name,' . $id . ',id_operation_type',
      'sequence_prefix'                 => 'required|string|max:20|unique:inventory_operation_types,sequence_prefix,' . $id . ',id_operation_type',
      'code'                            => 'required|string|max:10',
      'default_location_source_id'      => 'required|exists:inventory_locations,id_location',
      'default_location_destination_id' => 'required|exists:inventory_locations,id_location',
      'return_operation_type_id'     => 'nullable|exists:inventory_operation_types,id_operation_type',
    ]);

    $opType = InventoryOperationType::findOrFail($id);
    $opType->update($validated);

    return back()->with('success', 'Tipo de operación actualizado correctamente.');
  }
}
