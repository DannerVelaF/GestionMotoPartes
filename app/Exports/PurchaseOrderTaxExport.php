<?php

namespace App\Exports;

use App\Models\PurchaseOrder;
use Carbon\Carbon;
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

class PurchaseOrderTaxExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting, WithTitle
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
        return 'Libro de Compras OC';
    }

    public function collection()
    {
        return PurchaseOrder::with(['supplier', 'details.tax'])
            ->whereBetween('issue_date', [$this->from, $this->to])
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->orderBy('issue_date', 'asc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'FECHA EMISIÓN',
            'CÓDIGO OC',
            'TIPO ORDEN',
            'PROVEEDOR',
            'RUC',
            'MONEDA',
            'T. CAMBIO',
            'BASE IMPONIBLE (S/)',
            'IGV CALCULADO (S/)',
            'TOTAL (S/)',
            'ESTADO'
        ];
    }

    public function map($order): array
    {
        $exchangeRate = (float) $order->exchange_rate;
        $baseTotal = 0;
        $taxTotal = 0;

        foreach ($order->details as $detail) {
            $subtotal = (float) $detail->subtotal;
            $taxPercent = $detail->tax ? (float) $detail->tax->percentage : 0;

            $baseTotal += $subtotal;
            $taxTotal += ($subtotal * ($taxPercent / 100));
        }

        // Conversión a Soles
        $isUSD = $order->currency === 'USD';
        $baseSoles = $isUSD ? $baseTotal * $exchangeRate : $baseTotal;
        $igvSoles = $isUSD ? $taxTotal * $exchangeRate : $taxTotal;
        $totalSoles = $baseSoles + $igvSoles;

        return [
            $order->issue_date->format('d/m/Y'),
            $order->po_code,
            $order->order_type === 'purchase' ? 'Mercadería' : 'Servicio',
            $order->supplier->company_name ?? 'N/A',
            $order->supplier->ruc ?? '---',
            $order->currency,
            $exchangeRate,
            round($baseSoles, 2),
            round($igvSoles, 2),
            round($totalSoles, 2),
            strtoupper($order->status)
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $highestRow = $sheet->getHighestRow();
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '4338CA']], // Indigo para Compras
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            "A1:K{$highestRow}" => [
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'AAAAAA']]],
            ],
        ];
    }

    public function columnFormats(): array
    {
        return [
            'G' => '0.000',
            'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'K' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }
}
