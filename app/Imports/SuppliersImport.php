<?php

namespace App\Imports;

use App\Models\Supplier;
use Illuminate\Support\Facades\Http;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Exception;

class SuppliersImport implements ToModel, WithHeadingRow, WithValidation
{
    public $rows = 0;

    public function model(array $row)
    {
        $ruc = trim($row['ruc']);
        // Usamos null coalescing operator para asegurar que exista la clave
        $razonSocial = isset($row['razon_social']) ? trim($row['razon_social']) : null;

        // Lógica de Auto-completado
        if (empty($razonSocial) && !empty($ruc)) {
            $razonSocial = $this->consultarSunat($ruc);

            if (!$razonSocial) {
                // Mensaje de error manual en español
                throw new Exception("El RUC {$ruc} no tiene Razón Social en el Excel y no se pudo obtener de SUNAT.");
            }
        }

        $this->rows++;

        return new Supplier([
            'company_name'   => strtoupper($razonSocial),
            'ruc'            => $ruc,
            'supplier_name'  => $row['nombre_contacto'] ?? null,
            'supplier_email' => isset($row['email']) ? strtolower($row['email']) : null,
            'supplier_phone' => $row['telefono'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            // 'nullable' permite que esté vacío para que lo busquemos por API,
            // pero si viene algo, validamos que sea texto.
            'razon_social' => 'nullable|string',
            'ruc'          => 'required|digits:11|unique:suppliers,ruc',
            'email'        => 'nullable|email',
        ];
    }

    // AQUÍ ESTÁN LAS TRADUCCIONES
    public function customValidationMessages()
    {
        return [
            'ruc.required'        => 'El campo RUC es obligatorio (columna vacía).',
            'ruc.digits'          => 'El RUC :input debe tener exactamente 11 dígitos.',
            'ruc.unique'          => 'El RUC :input ya se encuentra registrado en el sistema.',

            'razon_social.string' => 'La Razón Social debe ser texto. (Verifique que no haya puesto el RUC en esta columna).',

            'email.email'         => 'El correo electrónico :input no tiene un formato válido.',
        ];
    }

    private function consultarSunat($ruc)
    {
        try {
            // TU LÓGICA DE API AQUÍ
            // ...

            // Simulación
            if (strlen($ruc) === 11) {
                sleep(1);
                return "EMPRESA AUTO-ENCONTRADA S.A.C.";
            }
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }
}
