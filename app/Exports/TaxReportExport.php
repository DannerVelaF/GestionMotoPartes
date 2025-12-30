<?php

namespace App\Exports;

use App\Models\Receipt;
// use Illuminate\Support\Facades\DB; // Ya no necesitamos DB::raw para sumas
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class TaxReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting
{
    protected $from;
    protected $to;

    public function __construct($from, $to)
    {
        $this->from = $from;
        $this->to = $to;
    }

    /**
     * Trae el listado DETALLADO de comprobantes.
     */
    public function collection()
    {
        // Aseguramos que tome todo el día final agregando horas si solo envías 'Y-m-d'
        $fromDate = $this->from . ' 00:00:00';
        $toDate = $this->to . ' 23:59:59';

        return Receipt::query()
            ->whereBetween('issue_date', [$fromDate, $toDate])
            ->orderBy('issue_date', 'asc')
            ->orderBy('series', 'asc') // Asumiendo que tienes columna 'series'
            ->orderBy('number', 'asc') // Asumiendo que tienes columna 'number'
            ->get();
    }

    public function headings(): array
    {
        return [
            'Fecha Emisión',
            'Tipo Documento',
            'Serie',
            'Número',
            'Doc. Cliente',
            'Razón Social / Nombre',
            'Base Imponible',
            'IGV (18%)',
            'Total',
        ];
    }

    /**
     * Mapea cada FILA (cada comprobante individual)
     */
    public function map($receipt): array
    {
        // Cálculos fila por fila
        $total = (float) $receipt->total_amount;
        $base = $total / 1.18;
        $igv = $total - $base;

        // Formateo del Tipo de Documento
        $tipoDoc = $receipt->document_type instanceof \App\Enums\DocumentType
            ? $receipt->document_type->label()
            : ucfirst(str_replace('_', ' ', $receipt->document_type));

        return [
            $receipt->issue_date,      // Columna A
            $tipoDoc,                  // Columna B
            $receipt->series ?? '001', // Columna C (ajusta al nombre real de tu campo)
            $receipt->number ?? $receipt->id, // Columna D
            $receipt->receiver_id_number ?? '---', // Columna E (RUC/DNI)
            $receipt->receiver_name ?? 'Cliente Varios', // Columna F
            $base,                     // Columna G (Sin redondear aquí para que Excel sume exacto)
            $igv,                      // Columna H
            $total,                    // Columna I
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Fila 1 en Negrita y fondo azul suave
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '4F81BD']]
            ],
        ];
    }

    /**
     * Da formato de moneda y fecha a las columnas de Excel
     */
    public function columnFormats(): array
    {
        return [
            // Columna G (Base), H (IGV), I (Total) con formato numérico
            'G' => NumberFormat::FORMAT_NUMBER_00,
            'H' => NumberFormat::FORMAT_NUMBER_00,
            'I' => '"S/" #,##0.00',
        ];
    }
}
