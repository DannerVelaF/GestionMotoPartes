<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket - {{ str_pad($sale->id_sales, 8, '0', STR_PAD_LEFT) }}</title>
    <style>
        @page { margin: 0; }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            width: 72mm;
            margin: 0 auto;
            padding: 5px;
            color: #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        th { text-align: left; font-size: 11px; border-bottom: 1px solid #000; }
        td { padding: 2px 0; vertical-align: top; }
        .uppercase { text-transform: uppercase; }
        .bold { font-weight: bold; }
        .fs-sm { font-size: 10px; }
        .fs-xs { font-size: 9px; }
    </style>
</head>
<body>
<div class="text-center">
    <h3 style="margin: 0;" class="uppercase">{{ $config->company_name }}</h3>
    <p class="fs-sm">
        RUC: {{ $config->ruc }}<br>
        {{ $config->address }} {{ $config->city ? '- ' . $config->city : '' }}<br>
        TELÉFONO: {{ $config->phone ?? 'S/N' }}
    </p>

    <div class="divider"></div>

    <h4 style="margin: 2px 0;" class="uppercase">TICKET DE VENTA</h4>
    <p class="bold" style="margin: 0;">
        NRO: {{ str_pad($sale->id_sales, 8, '0', STR_PAD_LEFT) }}
    </p>
</div>

<div class="divider"></div>

<div class="fs-sm">
    FECHA: {{ $sale->date_sales->format('d/m/Y H:i') }}<br>
    VENDEDOR: {{ $sale->user->name }}<br>
    PAGO: {{ $sale->methodPayment->name_method_payment ?? 'EFECTIVO' }}
</div>

<div class="divider"></div>

<div class="fs-sm uppercase">
    CLIENTE: {{ $sale->receiver_name ?? 'PÚBLICO EN GENERAL' }}<br>
    {{ $sale->receiver_id_number ? 'DNI/RUC: ' . $sale->receiver_id_number : '' }}
</div>

<div class="divider"></div>

<table>
    <thead>
    <tr>
        <th>DESCRIPCIÓN</th>
        <th class="text-right">CANT</th>
        <th class="text-right">TOTAL</th>
    </tr>
    </thead>
    <tbody>
    @php
        $accumulatedTax = 0;
        $accumulatedBase = 0;
    @endphp
    @foreach($sale->details as $item)
        @php
            $lineTotal = $item->quantity * $item->unit_price;
            $lineTax = (float) $item->tax_amount;
            $lineBase = $lineTotal - $lineTax;

            $accumulatedTax += $lineTax;
            $accumulatedBase += $lineBase;
        @endphp
        <tr>
            <td class="fs-sm">{{ $item->product->product_name }}</td>
            <td class="text-right fs-sm">{{ number_format($item->quantity, 0) }}</td>
            <td class="text-right fs-sm">{{ number_format($lineTotal, 2) }}</td>
        </tr>
    @endforeach
    </tbody>
</table>

<div class="divider"></div>

<div class="text-right fs-sm">
    OP. GRAVADA: S/ {{ number_format($accumulatedBase, 2) }}<br>
    IGV ACUMULADO: S/ {{ number_format($accumulatedTax, 2) }}<br>
    <span class="bold" style="font-size: 14px;">TOTAL: S/ {{ number_format($sale->total, 2) }}</span>
</div>

<div class="divider"></div>

<div class="text-center fs-sm" style="margin-top: 10px;">
    <p class="bold">*** DOCUMENTO DE CONTROL INTERNO ***</p>
    <p class="fs-xs italic">No tiene valor tributario para crédito fiscal.</p>
    <p class="fs-xs italic">Canjee este ticket por Boleta/Factura si lo requiere.</p>

    <p style="margin-top: 8px;">{{ $config->ticket_footer ?? '¡GRACIAS POR SU PREFERENCIA!' }}</p>
    <p class="fs-xs" style="opacity: 0.6;">SISTEMA MOTOPARTES ERP</p>
</div>

<script>
    window.onload = function() {
        window.print();
        setTimeout(function() {
            window.close();
        }, 1000);
    };
</script>
</body>
</html>
