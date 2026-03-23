<?php

namespace App\Http\Controllers;

use App\Models\Taxes;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxesController extends Controller
{
    public function index()
    {
        return Inertia::render('Purchases/Settings/TaxSettings', [
            'taxes' => Taxes::orderBy('id_tax', 'desc')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
            'scope'      => 'required|in:purchase,sale,both',
        ], [
            'name.required'       => 'El nombre es obligatorio.',
            'percentage.required' => 'El porcentaje es obligatorio.',
            'scope.in'            => 'El ámbito seleccionado no es válido.',
        ]);

        Taxes::create($validated);

        return back()->with('success', 'Impuesto creado correctamente.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
            'scope'      => 'required|in:purchase,sale,both',
            'is_active'  => 'required|boolean',
        ]);

        $tax = Taxes::findOrFail($id);
        $tax->update($validated);

        return back()->with('success', 'Impuesto actualizado.');
    }

    public function destroy($id)
    {
        // Nota: Podrías validar aquí si el impuesto está siendo usado en alguna factura
        Taxes::destroy($id);
        return back()->with('success', 'Impuesto eliminado.');
    }
}
