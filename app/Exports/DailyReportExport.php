<?php

namespace App\Exports;

use App\Models\Receipt;
use App\Models\Sales;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use Illuminate\Support\Facades\DB;

class DailyReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting
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
        // 1. Definir formato de fecha SQL según periodo
        switch ($this->period) {
            case 'weekly':
                $sqlSales = 'STR_TO_DATE(CONCAT(YEARWEEK(date_sales, 1), " Monday"), "%x%v %W")';
                $sqlReceipts = 'STR_TO_DATE(CONCAT(YEARWEEK(issue_date, 1), " Monday"), "%x%v %W")';
                break;
            case 'monthly':
                $sqlSales = 'DATE_FORMAT(date_sales, "%Y-%m-01")';
                $sqlReceipts = 'DATE_FORMAT(issue_date, "%Y-%m-01")';
                break;
            case 'yearly':
                $sqlSales = 'DATE_FORMAT(date_sales, "%Y-01-01")';
                $sqlReceipts = 'DATE_FORMAT(issue_date, "%Y-01-01")';
                break;
            case 'daily':
            default:
                $sqlSales = 'DATE(date_sales)';
                $sqlReceipts = 'DATE(issue_date)';
                break;
        }

        // 2. Obtener VENTAS desglosadas por MÉTODO (Ingresos)
        $salesQuery = Sales::query()
            ->leftJoin('method_payments', 'sales.id_method_payment', '=', 'method_payments.id_method_payment')
            ->select(DB::raw("$sqlSales as date_group"))
            ->selectRaw("COALESCE(method_payments.name_method_payment, 'Otros') as method_name")
            ->selectRaw('SUM(total) as income')
            ->whereBetween('date_sales', [$this->from . ' 00:00:00', $this->to . ' 23:59:59'])
            ->groupBy('date_group', 'method_name')
            ->get();

        // Agrupamos en memoria por fecha para poder iterar después
        $salesByDate = $salesQuery->groupBy('date_group');

        // 3. Obtener COMPRAS Totales (Egresos - Normalizado a PEN)
        $expensesQuery = Receipt::query()
            ->select(DB::raw("$sqlReceipts as date_group"))
            ->selectRaw('SUM(
                CASE 
                    WHEN currency = "USD" THEN total_amount * exchange_rate 
                    ELSE total_amount 
                END
            ) as expense')
            ->whereBetween('issue_date', [$this->from . ' 00:00:00', $this->to . ' 23:59:59'])
            ->groupBy('date_group')
            ->get()
            ->keyBy('date_group');

        // 4. Fusionar fechas únicas de ambos orígenes
        $allDates = $salesByDate->keys()->merge($expensesQuery->keys())->unique()->sort();

        // 5. Construir la colección final para el Excel
        return $allDates->map(function ($date) use ($salesByDate, $expensesQuery) {
            // Datos de Ventas del día (Colección de métodos)
            $daySales = $salesByDate->get($date, collect());

            $totalIncome = $daySales->sum('income');
            $expense = (float) ($expensesQuery[$date]->expense ?? 0);

            // Crear string de detalle: "Efectivo: 100 | Yape: 50"
            $breakdown = $daySales->map(function ($s) {
                return $s->method_name . ': S/ ' . number_format($s->income, 2);
            })->implode("\n"); // Salto de línea para celda de Excel

            return (object) [
                'date' => $date,
                'income' => $totalIncome,
                'expense' => $expense,
                'balance' => $totalIncome - $expense,
                'breakdown' => $breakdown ?: 'Sin ventas',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Periodo',
            'Detalle por Método', // Nueva columna
            'Total Ingresos (Ventas)',
            'Total Egresos (Compras)',
            'Balance Neto (S/)'
        ];
    }

    public function map($row): array
    {
        // Formatear fecha para visualización amigable
        $date = Carbon::parse($row->date);

        $formattedDate = match ($this->period) {
            'monthly' => $date->translatedFormat('F Y'),
            'yearly' => $date->format('Y'),
            'weekly' => 'Semana del ' . $date->format('d/m/Y'),
            default => $date->format('d/m/Y'),
        };

        return [
            $formattedDate,
            $row->breakdown, // Insertamos el texto con saltos de línea
            $row->income,
            $row->expense,
            $row->balance,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Habilitar ajuste de texto (Wrap Text) para la columna B (Detalle)
        // para que los saltos de línea (\n) se visualicen correctamente.
        $sheet->getStyle('B')->getAlignment()->setWrapText(true);

        return [
            // Encabezado
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E293B']],
                'alignment' => ['horizontal' => 'center', 'vertical' => 'center'],
            ],
            // Alinear verticalmente al centro todas las celdas
            'A:E' => [
                'alignment' => ['vertical' => 'center'],
            ]
        ];
    }

    public function columnFormats(): array
    {
        return [
            'C' => '"S/" #,##0.00', // Ingresos
            'D' => '"S/" #,##0.00', // Egresos
            'E' => '"S/" #,##0.00', // Balance
        ];
    }
}
