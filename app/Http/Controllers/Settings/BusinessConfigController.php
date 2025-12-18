<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Services\Settings\BusinessConfigService;
use App\Models\BusinessConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BusinessConfigController extends Controller
{
    protected $service;

    public function __construct(BusinessConfigService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        $config = BusinessConfig::first();

        return Inertia::render('settings/config', [
            'config' => $config
        ]);
    }

    public function update(Request $request)
    {
        // 1. Validar (Asegúrate que el email no sea 'required' si está vacío)
        $val = $request->validate([
            'company_name' => 'required|string|max:255',
            'ruc'          => 'required|string|size:11',
            'email'        => 'nullable|email',
            'api_service_url'   => 'nullable|url',
            'api_service_token' => 'nullable|string',
        ]);

        try {
            // Log para ver si los datos llegan al servicio
            \Log::info("Iniciando actualización de negocio", $request->all());

            $this->service->updateSettings($request->all());

            return redirect()->back()->with('success', 'Configuración actualizada con éxito.');
        } catch (\Exception $e) {
            // Esto enviará el error real de SQL o de PHP al frontend
            return redirect()->back()->withErrors(['error' => 'Error interno: ' . $e->getMessage()]);
        }
    }
}
