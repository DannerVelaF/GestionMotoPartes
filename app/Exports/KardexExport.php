<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class KardexExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    protected $data;
    protected $companyName;

    public function __construct($data, $companyName)
    {
        $this->data = $data;
        $this->companyName = $companyName;
    }

    public function collection() { return $this->data; }
    public function title(): string { return 'Kardex Valorizado'; }

    public function headings(): array
    {
        return [
            ['Kardex Valorizado - ' . $this->companyName],
            ['Generado el: ' . now()->format('d/m/Y H:i')],
            [],
            ['Fecha', 'Producto', 'Tipo Operación', 'Entrada', 'Salida', 'Saldo Cant.', 'Costo Unit.', 'Saldo Valorizado']
        ];
    }

    public function map($m): array
    {
        // 1. Traducción de Tipos
        $types = [
            'purchase' => 'COMPRA',
            'sale' => 'VENTA',
            'purchase_return' => 'DEV. COMPRA',
            'sale_return' => 'DEV. VENTA',
            'adjustment' => 'AJUSTE'
        ];
        $tipoEspañol = $types[$m->type] ?? strtoupper($m->type);

        // 2. Lógica de columnas Entrada/Salida
        $qty = (float) $m->quantity;
        $entrada = $qty > 0 ? $qty : null;
        $salida = $qty < 0 ? abs($qty) : null;

        $costo = (float) $m->unit_cost;
        $saldoCant = (float) $m->balance;

        return [
            $m->created_at->format('d/m/Y H:i'),
            $m->product->product_name,
            $tipoEspañol,
            $entrada,
            $salida,
            $saldoCant,
            $costo,
            ($saldoCant * $costo) // Saldo Valorizado
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14]],
            4 => ['font' => ['bold' => true], 'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F1F5F9']
            ]],
            // ✅ Formato Moneda Soles (Columnas G y H)
            'G:H' => ['numberFormat' => ['formatCode' => '"S/" #,##0.00']],
            // Alineaciones
            'D:G' => ['alignment' => ['horizontal' => 'center']],
        ];
    }
}
