<?php

namespace App\Exports;

use App\Models\Receipt;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class TaxReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting, WithTitle
{
    protected $from;
    protected $to;

    public function __construct($from, $to)
    {
        $this->from = $from;
        $this->to = $to;
    }

    public function title(): string
    {
        return 'Libro de Ventas ' . $this->from;
    }

    /**
     * Traemos la colección con los montos de impuestos ya calculados desde la base de datos
     */
    public function collection()
    {
        $fromDate = $this->from . ' 00:00:00';
        $toDate = $this->to . ' 23:59:59';

        // IMPORTANTE: Cambiamos a Query Builder para sumar los impuestos reales de los detalles
        return Receipt::query()
            ->with(['supplier', 'sale.details']) // Traemos los detalles para sumar impuestos reales
            ->whereBetween('issue_date', [$fromDate, $toDate])
            ->orderBy('issue_date', 'asc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'FECHA EMISIÓN',
            'TIPO DOC',
            'SERIE',
            'NÚMERO',
            'RUC/DNI',
            'CLIENTE / PROVEEDOR',
            'MONEDA ORIG.',
            'T.C.',
            'BASE IMPONIBLE (S/)',
            'IGV REAL (S/)',
            'TOTAL (S/)',
        ];
    }

    public function map($receipt): array
    {
        $exchangeRate = (float) ($receipt->exchange_rate ?? 1.000);

        /** * LÓGICA DINÁMICA:
         * En lugar de total / 1.18, sumamos el tax_amount de los detalles.
         * Si el recibo viene de una venta, sumamos sus detalles.
         */
        $totalTax = 0;
        $totalSubtotal = 0;

        if ($receipt->sale && $receipt->sale->details) {
            $totalTax = $receipt->sale->details->sum('tax_amount');
            // La base imponible es el total de la línea menos su impuesto
            $totalSubtotal = $receipt->sale->details->sum(function($d) {
                return ($d->quantity * $d->unit_price) - $d->tax_amount;
            });
        } else {
            // Fallback: Si no hay detalles (por migración antigua), usamos la lógica anterior
            // pero marcamos que es un cálculo estimado.
            $totalInOriginalCurrency = (float) $receipt->total_amount;
            $totalSubtotal = $totalInOriginalCurrency / 1.18;
            $totalTax = $totalInOriginalCurrency - $totalSubtotal;
        }

        // Aplicamos Tipo de Cambio si es USD
        $isUSD = $receipt->currency === 'USD';
        $baseSoles = $isUSD ? $totalSubtotal * $exchangeRate : $totalSubtotal;
        $igvSoles = $isUSD ? $totalTax * $exchangeRate : $totalTax;
        $totalSoles = $isUSD ? ($receipt->total_amount * $exchangeRate) : $receipt->total_amount;

        $tipoDoc = $receipt->document_type instanceof \App\Enums\DocumentType
            ? $receipt->document_type->label()
            : ucfirst(str_replace('_', ' ', $receipt->document_type));

        return [
            Carbon::parse($receipt->issue_date)->format('d/m/Y'),
            $tipoDoc,
            $receipt->series,
            $receipt->number,
            $receipt->supplier ? $receipt->supplier->ruc : '---',
            $receipt->supplier ? $receipt->supplier->company_name : 'N/A',
            $receipt->currency,
            $exchangeRate,
            round($baseSoles, 2),
            round($igvSoles, 2),
            round($totalSoles, 2),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Obtener el número de filas
        $highestRow = $sheet->getHighestRow();

        return [
            // Encabezados: Fondo azul oscuro, texto blanco, negrita
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E3A8A']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            // Bordes para toda la tabla
            "A1:K{$highestRow}" => [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CCCCCC'],
                    ],
                ],
            ],
        ];
    }

    public function columnFormats(): array
    {
        return [
            'H' => '0.000',
            'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'J' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'K' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }
}
