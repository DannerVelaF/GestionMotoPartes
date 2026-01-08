<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;

class SupplierTemplateExport implements WithHeadings, WithStyles, WithEvents
{
    public function headings(): array
    {
        return [
            'Tipo',            // Columna A: nacional / extranjero
            'Razon Social',    // Columna B
            'RUC / Tax ID',    // Columna C
            'Nombre Contacto', // Columna D
            'Email',           // Columna E
            'Telefono',        // Columna F
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Encabezado en negrita y ajustar ancho de columnas
        $sheet->getStyle('1')->getFont()->setBold(true);
        foreach (range('A', 'F') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        return [];
    }

    /**
     * Registramos los eventos para añadir la validación de datos (Select)
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                // Definimos el rango donde queremos el select (ej: de la fila 2 a la 500)
                $range = 'A2:A500';

                $validation = $event->sheet->getCell('A2')->getDataValidation();
                $validation->setType(DataValidation::TYPE_LIST);
                $validation->setErrorStyle(DataValidation::STYLE_STOP);
                $validation->setAllowBlank(false);
                $validation->setShowInputMessage(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowDropDown(true);
                $validation->setErrorTitle('Error de entrada');
                $validation->setError('Valor no permitido. Elija uno de la lista.');
                $validation->setPromptTitle('Elegir tipo');
                $validation->setPrompt('Por favor, seleccione nacional o extranjero.');

                // Los valores del desplegable (IMPORTANTE: deben estar entre comillas dobles y separados por coma)
                $validation->setFormula1('"nacional,extranjero"');

                // Aplicar la validación a todo el rango seleccionado
                $event->sheet->setDataValidation($range, $validation);
            },
        ];
    }
}
