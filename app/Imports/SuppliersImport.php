<?php

namespace App\Imports;

use App\Models\Supplier;
use App\Http\Services\Receipt\SupplierService; // Importamos el servicio
use Illuminate\Support\Facades\Http;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Exception;

class SuppliersImport implements ToModel, WithHeadingRow, WithValidation
{
    public $rows = 0;
    protected $service;

    public function __construct()
    {
        // Inyectamos el servicio manualmente usando el helper app()
        $this->service = app(SupplierService::class);
    }

    public function model(array $row)
    {
        $ruc = trim($row['ruc']);

        // Verificamos si la razón social viene en el excel (admite columnas 'razon_social' o 'empresa')
        $razonSocial = isset($row['razon_social']) ? trim($row['razon_social']) : (isset($row['empresa']) ? trim($row['empresa']) : null);

        // Lógica de Auto-completado con SUNAT
        if (empty($razonSocial) && !empty($ruc)) {
            // Llamamos al servicio real
            $razonSocial = $this->service->getRazonSocialFromSunat($ruc);

            if (!$razonSocial) {
                // Si la API no lo encuentra y el Excel no lo tiene, lanzamos error
                throw new Exception("El RUC {$ruc} no tiene Razón Social en el Excel y no se pudo obtener de SUNAT.");
            }
        }

        $this->rows++;

        return new Supplier([
            'company_name'   => strtoupper($razonSocial),
            'ruc'            => $ruc,
            'supplier_name'  => $row['nombre_contacto'] ?? $row['contacto'] ?? null,
            'supplier_email' => isset($row['email']) ? strtolower($row['email']) : null,
            'supplier_phone' => $row['telefono'] ?? $row['celular'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            'razon_social' => 'nullable|string',
            'ruc'          => 'required|digits:11|unique:suppliers,ruc',
            'email'        => 'nullable|email',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'ruc.required'        => 'El campo RUC es obligatorio.',
            'ruc.digits'          => 'El RUC :input debe tener 11 dígitos.',
            'ruc.unique'          => 'El RUC :input ya existe en el sistema.',
            'razon_social.string' => 'La Razón Social debe ser texto.',
            'email.email'         => 'El correo :input no es válido.',
        ];
    }
}
