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
            'Nombre',      // A
            'Codigo',      // B
            'Precio',      // C
            'Stock',       // D
            'Categoria',   // E
            'Marca',       // F
            'Tipo',        // G
            'Notas',       // H
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->getFont()->setBold(true);
        foreach (range('A', 'H') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                // Opcional: Validación para que no metan texto en Precio (Columna C)
                $validation = $event->sheet->getCell('C2')->getDataValidation();
                $validation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_DECIMAL);
                $validation->setErrorTitle('Error de formato');
                $validation->setError('Debe ser un número (ej: 15.00)');
                $event->sheet->setDataValidation('C2:C500', $validation);
            },
        ];
    }
}
