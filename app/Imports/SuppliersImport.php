<?php

namespace App\Imports;

use App\Models\Supplier;
use App\Http\Services\Receipt\SupplierService;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Str;
use Exception;

class SuppliersImport implements ToModel, WithHeadingRow, WithValidation
{
    public $rows = 0;
    protected $service;

    public function __construct()
    {
        $this->service = app(SupplierService::class);
    }

    public function model(array $row)
    {
        $type = Str::lower(trim($row['tipo'] ?? 'nacional'));
        $ruc = trim($row['ruc_tax_id'] ?? '');

        // Usamos razon_social_final que fue procesada en prepareForValidation
        $razonSocial = $row['razon_social_final'];

        $this->rows++;

        return new Supplier([
            'type'           => $type,
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
            'tipo' => 'required|in:nacional,extranjero',
            // VALIDACIÓN DE NOMBRE DUPLICADO:
            'razon_social_final' => 'required|string|max:255|unique:suppliers,company_name',
            'ruc_tax_id' => [
                'required',
                'unique:suppliers,ruc',
            ],
            'email' => 'nullable|email',
        ];
    }

    public function prepareForValidation($data, $index)
    {
        if (isset($data['tipo'])) {
            $data['tipo'] = Str::lower(trim($data['tipo']));
        }

        $rucValue = $data['ruc'] ?? $data['ruc_tax_id'] ?? $data['identificacion'] ?? null;
        $data['ruc_tax_id'] = $rucValue;

        // Lógica para determinar la razón social antes de validar
        $razonSocial = isset($data['razon_social']) ? trim($data['razon_social']) : (isset($data['empresa']) ? trim($data['empresa']) : null);

        // Si es nacional y no hay nombre, lo buscamos en SUNAT para poder validar la unicidad del nombre que vendrá
        if (Str::lower($data['tipo'] ?? '') === 'nacional' && empty($razonSocial) && !empty($rucValue)) {
            $razonSocial = $this->service->getRazonSocialFromSunat($rucValue);
        }

        // Guardamos el nombre final en una llave que validaremos en rules()
        $data['razon_social_final'] = $razonSocial;

        return $data;
    }

    public function customValidationMessages()
    {
        return [
            'tipo.required' => 'La columna "Tipo" es obligatoria.',
            'tipo.in' => 'El tipo debe ser "nacional" o "extranjero".',
            'ruc_tax_id.required' => 'El RUC o Tax ID es obligatorio.',
            'ruc_tax_id.unique' => 'El RUC/ID :input ya existe.',
            'razon_social_final.required' => 'La Razón Social es obligatoria.',
            'razon_social_final.unique' => 'La empresa ":input" ya está registrada.', // Mensaje amigable
            'email.email' => 'El correo :input no es válido.',
        ];
    }
}
