<?php

namespace App\Http\Services\Sales;

use App\Http\Repositories\Eloquent\Sales\SalesRepository;
use App\Http\Services\BaseService;
use App\Models\InventoryMovements;
use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentDetail;
use App\Models\InventoryOperationType;
use App\Models\Receipt;
use App\Models\ReceiptLog;
use App\Models\Sales;
use App\Models\SaleLog;
use App\Models\Products;
use App\Models\Taxes;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SalesService extends BaseService
{
    public function __construct(SalesRepository $repo)
    {
        parent::__construct($repo);
    }

    public function createSale(array $data)
    {
        return DB::transaction(function () use ($data) {
            $totalSubtotal = 0;
            $totalTax = 0;
            $totalAmount = 0;

            $processedDetails = [];

            // 1. Procesar Detalles, Validar Stock y Calcular Totales Dinámicos
            foreach ($data['details'] as $detail) {
                $product = Products::lockForUpdate()->findOrFail($detail['id_product']);

                if ($product->stock < $detail['quantity']) {
                    throw new \Exception("Stock insuficiente para: {$product->product_name}");
                }

                $tax = Taxes::find($detail['id_tax']);
                $taxPercentage = $tax ? ((float)$tax->percentage / 100) : 0;

                // Cálculo real: Precio Unitario = Base Imponible
                $lineSubtotal = $detail['quantity'] * $detail['unit_price'];
                $lineTax = $lineSubtotal * $taxPercentage;
                $lineTotal = $lineSubtotal + $lineTax;

                $totalSubtotal += $lineSubtotal;
                $totalTax += $lineTax;
                $totalAmount += $lineTotal;

                $processedDetails[] = [
                    'product'    => $product,
                    'quantity'   => $detail['quantity'],
                    'unit_price' => $detail['unit_price'],
                    'id_tax'     => $detail['id_tax'],
                    'tax_amount' => $lineTax,
                ];
            }

            $discountAmount = (float) ($data['discount'] ?? 0);
            $finalTotalAmount = max(0, $totalAmount - $discountAmount);

            // 2. Crear Cabecera de Venta
            $sale = Sales::create([
                'code_sales'         => 'VEN-' . now()->format('YmdHis'),
                'date_sales'         => Carbon::parse($data['issue_date'])->format('Y-m-d H:i:s'),
                'receiver_id_number' => $data['receiver_id_number'] ?? null,
                'receiver_name'      => $data['receiver_name'] ?? null,
                'receiver_address'   => $data['receiver_address'] ?? null,
                'subtotal'           => $totalSubtotal,
                'tax'                => $totalTax,
                'discount'           => $discountAmount,
                'total'              => $finalTotalAmount,
                'id_method_payment'  => $data['method_payment_id'],
                'status'             => 'completed',
                'id_user'            => Auth::id(),
            ]);

            // 3. OBTENER DINÁMICAMENTE EL TIPO DE OPERACIÓN
            $operationType = InventoryOperationType::where('name', 'Ventas')->first();

            if (!$operationType) {
                throw new \Exception("No se encontró el tipo de operación 'Ventas' configurado en el sistema.");
            }

            // Generar el correlativo usando el prefijo dinámico (ej: WH/OUT/)
            $adjustmentCount = InventoryAdjustment::where('id_operation_type', $operationType->id_operation_type)->count() + 1;
            $referenceCode = $operationType->sequence_prefix . str_pad($adjustmentCount, 5, '0', STR_PAD_LEFT);

            // 4. CREAR EL AJUSTE DE INVENTARIO (Guía de Salida)
            $adjustment = InventoryAdjustment::create([
                'reference_code'          => $referenceCode,
                'id_operation_type'       => $operationType->id_operation_type,       // Extraído del modelo
                'id_location_source'      => $operationType->default_location_source_id, // Extraído del modelo
                'id_location_destination' => $operationType->default_location_destination_id, // Extraído del modelo
                'kardex_date'             => Carbon::parse($data['issue_date'])->format('Y-m-d H:i:s'),
                'reason'                  => "Despacho de Venta {$sale->code_sales}",
                'contact_name'            => $sale->receiver_name ?? 'Público en General',
                'document_type'           => $data['document_type'],
                'document_number'         => $data['series'] . '-' . ($data['number'] ?? 'AUTO'),
                'exchange_rate'           => 1.000,
                'source_document_type'    => get_class($sale),
                'source_document_id'      => $sale->id_sales,
                'status'                  => 'done',
                'id_user'                 => Auth::id(),
            ]);

            // 5. Guardar Detalles de Venta, Detalles de Ajuste y Movimientos (Kardex)
            foreach ($processedDetails as $item) {
                $product = $item['product'];

                // A. Detalle de la Venta
                $sale->details()->create([
                    'id_product' => $product->id_product,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'id_tax'     => $item['id_tax'],
                    'tax_amount' => $item['tax_amount'],
                    'cost'       => $product->purchase_price,
                    'id_user'    => Auth::id(),
                ]);

                // B. Detalle del Ajuste de Inventario (Guía de Salida)
                InventoryAdjustmentDetail::create([
                    'id_adjustment' => $adjustment->id_adjustment,
                    'id_product'    => $product->id_product,
                    'quantity'      => $item['quantity'],
                    'unit_cost'     => $product->purchase_price,
                    'total_cost'    => $item['quantity'] * $product->purchase_price,
                ]);

                // Descontar físicamente el stock
                $product->decrement('stock', $item['quantity']);

                // C. Movimiento de Inventario (Kardex)
                InventoryMovements::create([
                    'id_product'     => $product->id_product,
                    'id_user'        => Auth::id(),
                    'type'           => 'OUT',
                    'kardex_date'    => Carbon::parse($data['issue_date'])->format('Y-m-d H:i:s'),
                    'quantity'       => $item['quantity'],
                    'unit_cost'      => $product->purchase_price,
                    'total_cost'     => $item['quantity'] * $product->purchase_price,
                    'balance'        => $product->fresh()->stock,
                    'reference_type' => get_class($sale),
                    'reference_id'   => $sale->id_sales,
                    'notes'          => "Salida automática por Venta {$sale->code_sales}"
                ]);
            }

            // 6. Obtener o Generar Número de Comprobante Contable
            $series = strtoupper($data['series']);
            $number = !empty($data['number'])
                ? $data['number']
                : $this->calculateNextReceiptNumber($data['document_type'], $series);

            // 7. GENERAR COMPROBANTE CENTRALIZADO
            $receipt = Receipt::create([
                'id_sales'         => $sale->id_sales,
                'receipt_code'     => 'REC-' . now()->format('YmdHis'),
                'document_type'    => $data['document_type'],
                'series'           => $series,
                'number'           => $number,
                'issue_date'       => Carbon::parse($data['issue_date'])->format('Y-m-d H:i:s'),
                'total_amount'     => $finalTotalAmount,
                'currency'         => 'PEN',
                'exchange_rate'    => 1.0000,
                'status'           => 'published',
                'published_at'     => now(),
            ]);

            // ✅ 8. CREAR DETALLES DEL COMPROBANTE
            foreach ($processedDetails as $item) {
                $product = $item['product'];

                $receipt->details()->create([
                    'id_product'  => $product->id_product,
                    'id_tax'      => $item['id_tax'],
                    'description' => $product->product_name,
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'subtotal'    => $item['quantity'] * $item['unit_price'],
                    'tax_amount'  => $item['tax_amount'],
                    'is_service'  => false,
                ]);
            }

            // 9. Registrar Acción en el Historial (Chatter)
            SaleLog::create([
                'id_sales' => $sale->id_sales,
                'id_user'  => Auth::id(),
                'action'   => 'Creación',
                'notes'    => 'Venta registrada. Stock descontado y comprobante generado.'
            ]);

            ReceiptLog::create([
                'id_receipt' => $receipt->id_receipt,
                'id_user'    => Auth::id(),
                'action'     => 'Creación Automática',
                'notes'      => "Comprobante generado automáticamente desde la Venta {$sale->code_sales}."
            ]);

            return $sale;
        });
    }

    protected function calculateNextReceiptNumber(string $docType, string $series): string
    {
        $lastReceipt = Receipt::where('document_type', $docType)
            ->where('series', $series)
            ->orderBy(DB::raw('CAST(number AS UNSIGNED)'), 'desc')
            ->first();

        $lastNumber = $lastReceipt ? (int)$lastReceipt->number : 0;
        return str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
    }
}
