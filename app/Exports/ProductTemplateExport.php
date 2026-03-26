<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductTemplateExport implements WithHeadings, WithStyles, WithEvents
{
    public function headings(): array
    {
        return [
            'Nombre',         // A
            'Codigo',         // B
            'Precio Venta',   // C
            'Precio Compra',  // D (NUEVA)
            'Stock',          // E
            'Categoria',      // F
            'Marca',          // G
            'Tipo',           // H
            'Notas',          // I
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->getFont()->setBold(true);
        // Ajustamos el rango de columnas hasta la I
        foreach (range('A', 'I') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                // Validación para Precio Venta (C) y Precio Compra (D)
                $validation = $event->sheet->getCell('C2')->getDataValidation();
                $validation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_DECIMAL);
                $validation->setErrorTitle('Error de formato');
                $validation->setError('Debe ser un número decimal');

                $event->sheet->setDataValidation('C2:D500', $validation);
            },
        ];
    }
}
