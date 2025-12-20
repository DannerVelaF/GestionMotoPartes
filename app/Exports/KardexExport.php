<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class KardexExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $data;
    protected $companyName;

    public function __construct($data, $companyName)
    {
        $this->data = $data; // Recibe movimientos agrupados por producto
        $this->companyName = $companyName;
    }

    public function collection()
    {
        return $this->data;
    }

    public function title(): string { return 'Kardex Valorizado'; }

    public function headings(): array
    {
        return [
            ['Kardex Valorizado - ' . $this->companyName],
            ['Fecha', 'Producto', 'Tipo', 'Entrada', 'Salida', 'Costo Unit.', 'Saldo Cant.', 'Saldo Valorizado']
        ];
    }

    public function map($m): array
    {
        return [
            $m->created_at->format('d/m/Y H:i'),
            $m->product->product_name,
            $m->type,
            $m->quantity > 0 ? $m->quantity : 0,
            $m->quantity < 0 ? abs($m->quantity) : 0,
            $m->unit_cost,
            $m->balance,
            ($m->balance * $m->unit_cost)
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 12]],
            2 => ['font' => ['bold' => true]],
            'F:H' => ['numberFormat' => ['formatCode' => '"S/" #,##0.00']],
        ];
    }
}
