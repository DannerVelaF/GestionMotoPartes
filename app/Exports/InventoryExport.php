<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InventoryExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $products;
    protected $companyName;

    public function __construct($products, $companyName)
    {
        $this->products = $products;
        $this->companyName = $companyName;
    }

    public function collection()
    {
        return $this->products;
    }

    public function headings(): array
    {
        return [
            ['Reporte de Inventario y Rentabilidad - ' . $this->companyName],
            ['Generado el: ' . now()->format('d/m/Y H:i')],
            [],
            ['SKU', 'Producto', 'Stock', 'Costo Unit.', 'Precio Venta', 'Margen Unit.', 'Ganancia Estimada', 'Valorización']
        ];
    }

    public function map($p): array
    {
        $marginUnit = $p->sale_price - $p->purchase_price;
        $totalProfit = $marginUnit * $p->stock;
        $valuation = $p->stock * $p->purchase_price;

        return [
            $p->product_code,
            $p->product_name,
            $p->stock,
            $p->purchase_price,
            $p->sale_price,
            $marginUnit,
            $totalProfit,
            $valuation
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
            // Formatos de moneda para columnas D hasta H
            'D4:H500' => ['numberFormat' => ['formatCode' => '"S/" #,##0.00']],
            'C' => ['alignment' => ['horizontal' => 'right']],
        ];
    }
}
