<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class KardexExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $data;
    protected $companyName;
    protected $startDate;
    protected $endDate;
    protected $currency;

    // Calculadoras de Resumen General
    protected $totalInQty = 0;
    protected $totalInVal = 0;
    protected $totalOutQty = 0;
    protected $totalOutVal = 0;
    protected $finalQty = 0;
    protected $finalVal = 0;

    // Calculadora de saldos en tiempo real por producto
    protected $runningBalances = [];

    public function __construct($data, $companyName, $startDate = null, $endDate = null, $currency = 'PEN')
    {
        $this->data = $data;
        $this->companyName = $companyName;
        $this->startDate = $startDate ? date('d/m/Y', strtotime($startDate)) : 'Inicio';
        $this->endDate = $endDate ? date('d/m/Y', strtotime($endDate)) : 'Actualidad';
        $this->currency = $currency;

        $this->calculateTotals();
    }

    private function calculateTotals()
    {
        foreach ($this->data as $m) {
            $qty = (float) $m->quantity;
            $isOut = in_array($m->type, ['OUT', 'sale', 'purchase_return', 'loss']) || $qty < 0;

            $tc = (float) ($m->exchange_rate ?? $m->reference->exchange_rate ?? 1.00);
            if ($tc <= 0) $tc = 1.00;

            $costoReal = ($this->currency === 'USD') ? (($m->unit_cost ?? 0) / $tc) : ($m->unit_cost ?? 0);
            $totalOperacion = abs($qty) * $costoReal;

            $productId = $m->id_product;
            if (!isset($this->runningBalances[$productId])) $this->runningBalances[$productId] = 0;

            if ($isOut) {
                $this->totalOutQty += abs($qty);
                $this->totalOutVal += $totalOperacion;
                $this->runningBalances[$productId] -= abs($qty);
            } else {
                $this->totalInQty += abs($qty);
                $this->totalInVal += $totalOperacion;
                $this->runningBalances[$productId] += abs($qty);
            }
        }
        $this->finalQty = array_sum($this->runningBalances);
        $this->finalVal = $this->totalInVal - $this->totalOutVal;
    }

    public function collection()
    {
        $this->runningBalances = []; // Reiniciar para el mapeo fila a fila
        return $this->data;
    }

    public function headings(): array
    {
        $monedaTexto = $this->currency === 'USD' ? 'DÓLARES (USD)' : 'SOLES (PEN)';

        return [
            ['KARDEX VALORIZADO EN ' . $monedaTexto . ' - ' . mb_strtoupper($this->companyName)],
            ['RANGO DE FECHAS: ' . $this->startDate . ' AL ' . $this->endDate],
            [],
            ['RESUMEN DE MOVIMIENTOS', '', 'CANTIDAD FÍSICA', 'VALOR TOTAL'],
            ['Total de Ingresos (+)', '', $this->totalInQty, $this->totalInVal],
            ['Total de Salidas (-)', '', $this->totalOutQty, $this->totalOutVal],
            ['Balance Neto del Periodo', '', $this->finalQty, $this->finalVal],
            [],
            [],
            [
                '', '', '', '', '', '', '', '', '', '', '', '', // A - L
                'INGRESO', '', '', // M, N, O
                'SALIDA', '', '',  // P, Q, R
                'SALDO', '',       // S, T
                '', ''             // U, V
            ],
            [
                'FECHA', 'HORA', 'TIPO', 'REFERENCIA', 'MOV. VINCULADO', 'DOC. ORIGEN',
                'PROVEEDOR / CLIENTE', 'ORIGEN (DE)', 'DESTINO (A)', 'CÓD. PRODUCTO',
                'PRODUCTO', 'T.C.',
                'CANTIDAD', 'COSTO UNIT.', 'TOTAL',
                'CANTIDAD', 'COSTO UNIT.', 'TOTAL',
                'CANTIDAD', 'TOTAL',
                'COSTO PROM.', 'RESPONSABLE'
            ]
        ];
    }

    public function map($m): array
    {
        $types = ['IN'=>'ENTRADA','OUT'=>'SALIDA','INT'=>'INTERNO','ADJ'=>'AJUSTE','loss'=>'DESECHO','purchase'=>'COMPRA','sale'=>'VENTA','purchase_return'=>'DEV. COMPRA','sale_return'=>'DEV. VENTA','adjustment'=>'AJUSTE MANUAL','INIT'=>'SALDO INICIAL'];
        $tipoEspañol = $types[$m->type] ?? strtoupper($m->type);

        $linkedMov = '—';
        $refCode = $m->reference->reference_code ?? 'MOV-' . $m->id_movement;

        if ($m->reference instanceof \App\Models\InventoryAdjustment) {
            if ($m->reference->source_document_type === \App\Models\InventoryAdjustment::class) {
                // Buscamos el código del ajuste padre para la trazabilidad
                $parent = \App\Models\InventoryAdjustment::find($m->reference->source_document_id);
                $linkedMov = $parent ? $parent->reference_code : 'Ajuste #' . $m->reference->source_document_id;
            }
        }

        $qty = (float) $m->quantity;
        $isOut = in_array($m->type, ['OUT', 'sale', 'purchase_return', 'loss']) || $qty < 0;

        $productId = $m->id_product;
        if (!isset($this->runningBalances[$productId])) $this->runningBalances[$productId] = 0;
        $isOut ? ($this->runningBalances[$productId] -= abs($qty)) : ($this->runningBalances[$productId] += abs($qty));

        $saldoFisico = $this->runningBalances[$productId];
        $tc = (float) ($m->exchange_rate ?? $m->reference->exchange_rate ?? 1.00);
        if ($tc <= 0) $tc = 1.00;
        $costoReal = ($this->currency === 'USD') ? (($m->unit_cost ?? 0) / $tc) : ($m->unit_cost ?? 0);
        $totalOp = abs($qty) * $costoReal;

        return [
            $m->kardex_date ?? $m->created_at->format('Y-m-d'),
            $m->created_at->format('H:i:s'),
            $tipoEspañol,
            $refCode,
            $linkedMov,
            $m->reference->document_number ?? '—',
            $m->reference->contact_name ?? '—',
            $m->reference->locationSource->name ?? '—',
            $m->reference->locationDestination->name ?? '—',
            $m->product->product_code ?? '—',
            $m->product->product_name ?? '...',
            $tc,
            !$isOut ? abs($qty) : null, !$isOut ? $costoReal : null, !$isOut ? $totalOp : null,
            $isOut ? abs($qty) : null, $isOut ? $costoReal : null, $isOut ? $totalOp : null,
            $saldoFisico, $saldoFisico * $costoReal,
            $costoReal,
            $m->user->name ?? 'Sistema'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->mergeCells('A1:V1');
        $sheet->mergeCells('A2:V2');
        $sheet->mergeCells('A4:B4'); $sheet->mergeCells('A5:B5'); $sheet->mergeCells('A6:B6'); $sheet->mergeCells('A7:B7');
        $sheet->mergeCells('M10:O10'); // INGRESO
        $sheet->mergeCells('P10:R10'); // SALIDA
        $sheet->mergeCells('S10:T10'); // SALDO

        $symbol = $this->currency === 'USD' ? '"$" #,##0.00' : '"S/" #,##0.00';

        return [
            1 => ['font' => ['bold' => true, 'size' => 15]],
            4 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0EA5E9']]],
            10 => ['font' => ['bold' => true], 'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E2E8F0']]],
            11 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0F172A']], 'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]],
            'L' => ['numberFormat' => ['formatCode' => '0.000']],
            'M' => ['numberFormat' => ['formatCode' => '#,##0.00']],
            'P' => ['numberFormat' => ['formatCode' => '#,##0.00']],
            'S' => ['numberFormat' => ['formatCode' => '#,##0.00']],
            'N:O' => ['numberFormat' => ['formatCode' => $symbol]],
            'Q:R' => ['numberFormat' => ['formatCode' => $symbol]],
            'T:U' => ['numberFormat' => ['formatCode' => $symbol]],
        ];
    }
}
