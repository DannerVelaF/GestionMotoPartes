<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SupplierTemplateExport implements WithHeadings, WithStyles
{
    public function headings(): array
    {
        // Estas son las cabeceras que verá el usuario en el Excel
        return [
            'Razon Social',    // company_name
            'RUC',             // ruc
            'Nombre Contacto', // supplier_name
            'Email',           // supplier_email
            'Telefono',        // supplier_phone
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Ponemos la primera fila en negrita
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
