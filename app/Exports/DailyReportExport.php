<?php

namespace App\Exports;

use App\Models\Sales;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DailyReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $from;
    protected $to;
    protected $period;

    public function __construct($from, $to, $period)
    {
        $this->from = $from;
        $this->to = $to;
        $this->period = $period;
    }

    public function collection()
    {
        // 1. Definir formato de fecha SQL (Copia de tu lógica en Controller)
        switch ($this->period) {
            case 'weekly':
                $sql = 'STR_TO_DATE(CONCAT(YEARWEEK(date_sales, 1), " Monday"), "%x%v %W")';
                break;
            case 'monthly':
                $sql = 'DATE_FORMAT(date_sales, "%Y-%m-01")';
                break;
            case 'yearly':
                $sql = 'DATE_FORMAT(date_sales, "%Y-01-01")';
                break;
            case 'daily':
            default:
                $sql = 'DATE(date_sales)';
                break;
        }

        $range = [
            $this->from . ' 00:00:00',
            $this->to . ' 23:59:59'
        ];

        // 2. Consulta Raw
        $rawQuery = Sales::query()
            ->join('sale_details', 'sales.id_sales', '=', 'sale_details.id_sales')
            ->leftJoin('method_payments', 'sales.id_method_payment', '=', 'method_payments.id_method_payment')
            ->selectRaw("{$sql} as date_group")
            ->selectRaw("COALESCE(method_payments.name_method_payment, 'Otros') as method_name")
            ->selectRaw('SUM(sale_details.subtotal) as revenue')
            ->selectRaw('SUM(sale_details.quantity * sale_details.cost) as cost')
            ->selectRaw('COUNT(DISTINCT sales.id_sales) as tx_count')
            ->whereBetween('sales.date_sales', $range)
            ->groupByRaw("date_group, method_name")
            ->orderBy('date_group', 'ASC')
            ->get();

        // 3. Agrupamiento (Igual que en el controlador)
        return $rawQuery->groupBy('date_group')->map(function ($dayGroup) {
            $totalRevenue = $dayGroup->sum('revenue');
            $totalCost    = $dayGroup->sum('cost');
            $profit       = $totalRevenue - $totalCost;
            $margin       = $totalRevenue > 0 ? ($profit / $totalRevenue) * 100 : 0;
            $transactions = $dayGroup->sum('tx_count');

            // Formatear métodos como texto para una sola celda de Excel
            // Ej: "Efectivo: 100 | Yape: 50"
            $methodsString = $dayGroup->map(function ($row) {
                return $row->method_name . ': ' . number_format($row->revenue, 2);
            })->implode(' | ');

            return [
                'date'         => $dayGroup->first()->date_group,
                'transactions' => $transactions,
                'methods'      => $methodsString,
                'revenue'      => $totalRevenue,
                'cost'         => $totalCost,
                'profit'       => $profit,
                'margin'       => round($margin, 2) . '%',
            ];
        })->values();
    }

    public function headings(): array
    {
        return [
            'Fecha / Periodo',
            'N° Operaciones',
            'Desglose Métodos de Pago',
            'Ingresos Totales (S/)',
            'Costo Total (S/)',
            'Utilidad (S/)',
            'Margen (%)',
        ];
    }

    public function map($row): array
    {
        return [
            $row['date'],
            $row['transactions'],
            $row['methods'],
            $row['revenue'],
            $row['cost'],
            $row['profit'],
            $row['margin'],
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Estilo para la primera fila (encabezados)
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '4F46E5']]],
        ];
    }
}
