<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title> </title>
    <style>
        @page {
            margin: 1.5cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        /* Contenedor principal para evitar cortes */
        .wrapper {
            width: 100%;
        }

        /* Encabezado con sistema de tablas para evitar desajustes */
        .header-table {
            width: 100%;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .col-50 {
            width: 50%;
            vertical-align: top;
        }

        /* Espacio para Logo */
        .logo-placeholder {
            width: 150px;
            height: 60px;
            border: 1px dashed #ccc; /* Se quita cuando hay logo */
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 5px;
            color: #ccc;
            font-size: 10px;
            text-transform: uppercase;
        }

        .logo-img {
            max-width: 150px;
            max-height: 70px;
            display: block;
        }

        h1, h2, h3, h4 {
            margin: 0;
            padding: 0;
            text-transform: uppercase;
        }

        .po-title {
            color: #10b981; /* Emerald 600 */
            font-size: 24px;
        }

        /* Información de Secciones */
        .section-title {
            background-color: #f3f4f6;
            padding: 5px 10px;
            font-weight: bold;
            margin-top: 20px;
            border-left: 4px solid #333;
        }

        /* Tabla de Productos */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .items-table th {
            background-color: #374151;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
        }
        .items-table td {
            border-bottom: 1px solid #e5e7eb;
            padding: 8px;
        }

        /* Totales */
        .totals-container {
            margin-top: 15px;
            float: right;
            width: 300px;
        }
        .total-row {
            display: table;
            width: 100%;
            padding: 4px 0;
        }
        .total-label {
            display: table-cell;
            text-align: right;
            padding-right: 15px;
            font-weight: bold;
        }
        .total-value {
            display: table-cell;
            text-align: right;
            width: 100px;
        }
        .grand-total {
            border-top: 2px solid #333;
            margin-top: 5px;
            padding-top: 5px;
            font-size: 14px;
            color: #10b981;
        }

        .footer {
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 10px;
            text-align: center;
            color: #999;
            font-size: 9px;
        }

        /* Evitar que se corte el contenido entre páginas */
        tr { page-break-inside: avoid; }

        @media print {
            .no-print { display: none; }
        }
    </style>
</head>
<body>
<div class="wrapper">
    <table class="header-table">
        <tr>
            <td class="col-50">
                @if($businessConfig && $businessConfig->logo_path)
                    <img src="{{ storage_path('app/public/' . $businessConfig->logo_path) }}" class="logo-img">
                @else
                    <div class="logo-placeholder">Sin Logo</div>
                @endif
                <h3 style="margin-top: 10px;">{{ $businessConfig->company_name ?? 'MI EMPRESA S.A.C.' }}</h3>
                <p>
                    RUC: {{ $businessConfig->ruc ?? '00000000000' }}<br>
                    {{ $businessConfig->address ?? 'Dirección de la empresa' }}<br>
                    Tel: {{ $businessConfig->phone ?? '-' }} | Email: {{ $businessConfig->email ?? '-' }}
                </p>
            </td>
            <td class="col-50" style="text-align: right;">
                <h2 style="color: #666; letter-spacing: 2px;">ORDEN DE COMPRA</h2>
                <h1 class="po-title">{{ $purchaseOrder->po_code }}</h1>
                <p>
                    <strong>Emisión:</strong> {{ $purchaseOrder->issue_date->format('d/m/Y') }}<br>
                </p>
            </td>
        </tr>
    </table>

    <div class="section-title">DATOS DEL PROVEEDOR</div>
    <table style="width: 100%; margin-top: 5px; border: none;">
        <tr>
            <td style="border: none; width: 60%;">
                <strong>Razón Social:</strong> {{ $purchaseOrder->supplier->company_name }}<br>
                <strong>RUC:</strong> {{ $purchaseOrder->supplier->ruc }}
            </td>
            <td style="border: none; width: 40%;">
                <strong>Moneda:</strong> {{ $purchaseOrder->currency == 'PEN' ? 'Soles' : 'Dólares' }}<br>
                <strong>T. Cambio:</strong> {{ number_format($purchaseOrder->exchange_rate, 3) }}
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
        <tr>
            <th style="width: 15%;">Código</th>
            <th style="width: 45%;">Descripción</th>
            <th style="text-align: center; width: 10%;">Cant.</th>
            <th style="text-align: right; width: 15%;">Costo Unit.</th>
            <th style="text-align: right; width: 15%;">Subtotal</th>
        </tr>
        </thead>
        <tbody>
        @foreach($purchaseOrder->details as $detail)
            <tr>
                <td style="font-family: monospace;">{{ $detail->product->product_code ?? 'SERV' }}</td>
                <td>{{ $detail->product->product_name ?? $detail->description }}</td>
                <td style="text-align: center;">{{ number_format($detail->quantity, 2) }}</td>
                <td style="text-align: right;">{{ number_format($detail->unit_cost, 2) }}</td>
                <td style="text-align: right;">{{ number_format($detail->subtotal, 2) }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <div class="totals-container">
        <div class="total-row">
            <div class="total-label">SUBTOTAL</div>
            <div class="total-value">{{ $purchaseOrder->currency }} {{ number_format($purchaseOrder->total_amount / 1.18, 2) }}</div>
        </div>
        <div class="total-row">
            <div class="total-label">IGV (18%)</div>
            <div class="total-value">{{ $purchaseOrder->currency }} {{ number_format($purchaseOrder->total_amount - ($purchaseOrder->total_amount / 1.18), 2) }}</div>
        </div>
        <div class="total-row grand-total">
            <div class="total-label">TOTAL</div>
            <div class="total-value"><strong>{{ $purchaseOrder->currency }} {{ number_format($purchaseOrder->total_amount, 2) }}</strong></div>
        </div>
    </div>

    <div style="clear: both;"></div>

    @if($purchaseOrder->notes)
        <div class="section-title">OBSERVACIONES</div>
        <div style="padding: 10px; border: 1px solid #e5e7eb; border-top: none;">
            {{ $purchaseOrder->notes }}
        </div>
    @endif

    <div class="footer">
        <p>
            Documento generado por el sistema de gestión el {{ date('d/m/Y H:i') }}<br>
            Registrado por: {{ $purchaseOrder->creator->name ?? 'Sistema' }} |
            Aprobado por: {{ $purchaseOrder->approver->name ?? 'Pendiente' }}
        </p>
    </div>
</div>
</body>

</html>
