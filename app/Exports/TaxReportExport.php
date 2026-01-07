<?php

namespace App\Exports;

use App\Models\Receipt;
use Carbon\Carbon;
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
        $fromDate = $this->from . ' 00:00:00';
        $toDate = $this->to . ' 23:59:59';

        return Receipt::query()
            ->with('supplier') // Cargar relación para evitar N+1
            ->whereBetween('issue_date', [$fromDate, $toDate])
            ->orderBy('issue_date', 'asc')
            ->orderBy('series', 'asc')
            ->orderBy('number', 'asc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Fecha Emisión',
            'Tipo Documento',
            'Serie',
            'Número',
            'RUC Proveedor',        // Corregido: Es compras, vemos Proveedores
            'Razón Social',         // Corregido
            'Moneda Orig.',         // Útil para auditoría
            'T. Cambio',            // Útil para auditoría
            'Base Imponible (S/)',  // Aclaramos que es en Soles
            'IGV (18%) (S/)',
            'Total (S/)',
        ];
    }

    /**
     * Mapea cada FILA (cada comprobante individual)
     */
    public function map($receipt): array
    {
        // 1. Normalización de Moneda a SOLES
        $exchangeRate = (float) $receipt->exchange_rate;
        $originalTotal = (float) $receipt->total_amount;

        // Si es USD, convertimos. Si es PEN, se mantiene.
        $totalInSoles = ($receipt->currency === 'USD')
            ? $originalTotal * $exchangeRate
            : $originalTotal;

        // 2. Cálculos Tributarios (Base / IGV) sobre el monto en Soles
        $base = $totalInSoles / 1.18;
        $igv = $totalInSoles - $base;

        // 3. Formateo del Tipo de Documento
        $tipoDoc = $receipt->document_type instanceof \App\Enums\DocumentType
            ? $receipt->document_type->label()
            : ucfirst(str_replace('_', ' ', $receipt->document_type));

        // 4. Datos del Proveedor (Safety checks)
        $ruc = $receipt->supplier ? $receipt->supplier->ruc : '---';
        $razonSocial = $receipt->supplier ? $receipt->supplier->company_name : 'Proveedor Eliminado';

        return [
            // A. Fecha (Objeto Carbon o string, Excel lo formatea luego)
            Carbon::parse($receipt->issue_date)->format('d/m/Y'),

            // B. Tipo
            $tipoDoc,

            // C. Serie
            $receipt->series,

            // D. Número
            $receipt->number,

            // E. RUC
            $ruc,

            // F. Razón Social
            $razonSocial,

            // G. Moneda Original
            $receipt->currency,

            // H. Tipo de Cambio
            $exchangeRate,

            // I. Base (Soles)
            $base,

            // J. IGV (Soles)
            $igv,

            // K. Total (Soles)
            $totalInSoles,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Fila 1 (Encabezados)
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '2563EB']], // Azul corporativo
                'alignment' => ['horizontal' => 'center'],
            ],
        ];
    }

    /**
     * Da formato de moneda y fecha a las columnas de Excel
     */
    public function columnFormats(): array
    {
        return [
            // G (Moneda texto), H (TC 3 decimales)
            'H' => '0.000',
            // I (Base), J (IGV), K (Total) con formato moneda Soles
            'I' => '"S/" #,##0.00',
            'J' => '"S/" #,##0.00',
            'K' => '"S/" #,##0.00',
        ];
    }
}
