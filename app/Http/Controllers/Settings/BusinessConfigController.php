<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Services\Settings\BusinessConfigService;
use App\Models\BusinessConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\RedirectResponse;

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

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name'      => ['required', 'string', 'max:255'],
            'ruc'               => ['required', 'string', 'size:11'],
            'address'           => ['nullable', 'string', 'max:500'],
            'phone'             => ['nullable', 'string', 'max:20'],
            'email'             => ['nullable', 'email', 'max:255'],
            'city'              => ['nullable', 'string', 'max:100'],
            'ticket_footer'     => ['nullable', 'string', 'max:1000'],
            'api_service_url'   => ['nullable', 'url'],
            'api_service_token' => ['nullable', 'string'],
            'logo'              => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        $config = BusinessConfig::first() ?? new BusinessConfig();

        if ($request->hasFile('logo')) {
            // Eliminar anterior para no llenar el servidor en Polybags Perú
            if ($config->logo_path) {
                Storage::disk('public')->delete($config->logo_path);
            }
            $path = $request->file('logo')->store('logos', 'public');
            $config->logo_path = $path;
        }

        // ✅ Limpiamos el array para que el 'logo' (objeto archivo) no intente entrar en la base de datos
        $dataToSave = $request->except('logo');
        $config->fill($dataToSave);
        $config->save();

        return back()->with('success', 'Configuración actualizada correctamente.');
    }
}
