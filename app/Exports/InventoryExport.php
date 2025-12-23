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
            ['Reporte Detallado de Inventario y Rentabilidad - ' . $this->companyName],
            ['Generado el: ' . now()->format('d/m/Y H:i')],
            [],
            [
                'SKU',
                'Producto',
                'Stock Actual',
                'Costo Unit.',
                'P. Venta',
                'Margen (%)', // Nueva columna coincidente con la web
                'Ganancia Est.',
                'Valorización'
            ]
        ];
    }

    public function map($p): array
    {
        $cost = (float) $p->purchase_price;
        $sale = (float) $p->sale_price;
        $stock = (float) $p->stock;

        // Lógica de Margen (%) coincidente con el Frontend
        $marginPercentage = $sale > 0 ? (($sale - $cost) / $sale) * 100 : 0;

        // Ganancia Estimada: (Precio - Costo) * Stock
        $totalProfit = ($sale - $cost) * $stock;

        // Valorización: Stock * Costo
        $valuation = $stock * $cost;

        return [
            $p->product_code,
            $p->product_name,
            $stock,
            $cost,
            $sale,
            round($marginPercentage, 1) . '%',
            $totalProfit,
            $valuation
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14]],
            2 => ['font' => ['italic' => true, 'size' => 10]],
            4 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F1F5F9']
                ]
            ],
            // Formato de Moneda para Costo, Venta, Ganancia y Valorización
            'D4:E2000' => ['numberFormat' => ['formatCode' => '"S/" #,##0.00']],
            'G4:H2000' => ['numberFormat' => ['formatCode' => '"S/" #,##0.00']],

            // Alineación
            'C' => ['alignment' => ['horizontal' => 'center']], // Stock centrado
            'F' => ['alignment' => ['horizontal' => 'right']],  // Margen % a la derecha
        ];
    }
}
