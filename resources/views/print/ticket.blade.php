<!DOCTYPE html>
<html>
<head>
    <title>Ticket - {{ $sale->series }}-{{ $sale->number }}</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; }
        .uppercase { text-transform: uppercase; }
    </style>
</head>
<body>
<div class="text-center">
    <h2 style="margin: 0;" class="uppercase">{{ $config->company_name }}</h2>
    <p>
        RUC: {{ $config->ruc }}<br>
        {{ $config->address }} {{ $config->city ? '- ' . $config->city : '' }}<br>
        {{ $config->phone ? 'Telf: ' . $config->phone : '' }}
    </p>
</div>

<div class="divider"></div>

<p>
    FECHA: {{ \Carbon\Carbon::parse($sale->date_sales)->format('d/m/Y H:i') }}<br>
    TICKET: {{ $sale->series }}-{{ $sale->number }}<br>
    VENDEDOR: {{ $sale->user->name }}
</p>

<div class="divider"></div>

<p class="uppercase">
    CLIENTE: {{ $sale->receiver_name }}<br>
    ID/RUC: {{ $sale->receiver_id_number ?? '--------' }}
</p>

<div class="divider"></div>

<table>
    <thead>
    <tr>
        <th>DESCRIP.</th>
        <th class="text-right">CANT.</th>
        <th class="text-right">TOTAL</th>
    </tr>
    </thead>
    <tbody>
    @foreach($sale->details as $item)
        <tr>
            <td>{{ $item->product->product_name }}</td>
            <td class="text-right">{{ number_format($item->quantity, 0) }}</td>
            <td class="text-right">{{ number_format($item->unit_price * $item->quantity, 2) }}</td>
        </tr>
    @endforeach
    </tbody>
</table>

<div class="divider"></div>

<p class="text-right">
    SUBTOTAL: S/ {{ number_format($sale->total / 1.18, 2) }}<br>
    IGV (18%): S/ {{ number_format($sale->total - ($sale->total / 1.18), 2) }}<br>
    <strong>TOTAL: S/ {{ number_format($sale->total, 2) }}</strong>
</p>

<div class="text-center" style="margin-top: 20px;">
    <p>{{ $config->ticket_footer ?? '¡Gracias por su compra!' }}</p>
</div>

<script>
    window.print();
    window.onafterprint = function() { window.close(); };
</script>
</body>
</html>
