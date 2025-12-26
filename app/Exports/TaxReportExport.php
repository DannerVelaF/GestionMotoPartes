<?php

namespace App\Exports;

use App\Models\Receipt;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TaxReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $from;
    protected $to;

    public function __construct($from, $to)
    {
        $this->from = $from;
        $this->to = $to;
    }

    public function collection()
    {
        return Receipt::select(
            'document_type',
            DB::raw('SUM(total_amount) as total_sum')
        )
            ->whereBetween('issue_date', [$this->from, $this->to])
            ->groupBy('document_type')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Tipo de Documento',
            'Base Imponible (S/)',
            'IGV (18%) (S/)',
            'Total Pagado (S/)',
        ];
    }

    public function map($item): array
    {
        $total = (float) $item->total_sum;
        $base = $total / 1.18;
        $igv = $total - $base;

        return [
            $item->document_type instanceof \App\Enums\DocumentType
                ? $item->document_type->label()
                : ucfirst(str_replace('_', ' ', $item->document_type)),

            round($base, 2),
            round($igv, 2),
            round($total, 2),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]], // Encabezados en negrita
        ];
    }
}
