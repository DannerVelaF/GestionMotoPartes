<?php

namespace App\Http\Services\Sales;

use App\Enums\SalesStatus;
use App\Http\Repositories\Eloquent\Sales\SalesRepository;
use App\Http\Services\BaseService;
use App\Http\Services\Inventory\InventoryService;
use App\Http\Services\Products\ProductService;
use App\Models\Sales;
use App\Models\Products;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SalesService extends BaseService
{
    protected $inventoryService;
    protected $productService;

    public function __construct(SalesRepository $repo, InventoryService $inventoryService, ProductService $productService)
    {
        parent::__construct($repo);
        $this->inventoryService = $inventoryService;
        $this->productService = $productService;
    }

    public function createSale(array $data)
    {
        // 1. VALIDACIÓN PREVENTIVA DE STOCK (Fuera de la transacción para fallar rápido)
        foreach ($data['details'] as $detail) {
            $product = Products::findOrFail($detail['id_product']);

            if ($product->stock < $detail['quantity']) {
                throw new \Exception("Stock insuficiente para: {$product->product_name}. Disponible: {$product->stock}, Solicitado: {$detail['quantity']}");
            }
        }

        return DB::transaction(function () use ($data) {
            // 2. Generar correlativo automático
            $series = strtoupper($data['series']);
            $number = $this->calculateNextSaleNumber($data['document_type'], $series);

            // 3. Calcular Totales
            $total = collect($data['details'])->sum(fn($item) => $item['quantity'] * $item['unit_price']);
            $tax = $total - ($total / 1.18);
            $subtotal = $total - $tax;

            // 4. Crear Cabecera de Venta
            $saleData = [
                'code_sales'         => 'V-' . now()->format('YmdHis'),
                'date_sales'         => Carbon::parse($data['issue_date'])->format('Y-m-d'),
                'document_type'      => $data['document_type'],
                'series'             => $series,
                'number'             => $number,
                'receiver_id_number' => $data['receiver_id_number'] ?? null,
                'receiver_name'      => $data['receiver_name'] ?? null,
                'receiver_address'   => $data['receiver_address'] ?? null,
                'subtotal'           => $subtotal,
                'tax'                => $tax,
                'discount'           => 0,
                'total'              => $total,
                "id_method_payment"  => $data['method_payment_id'],
                'status'             => SalesStatus::COMPLETED->value, // Asegúrate que COMPLETED existe en tu Enum
                'id_user'            => Auth::id(),
            ];

            $sale = $this->repo->create($saleData);

            // 5. Crear Detalles y Movimientos de Almacén
            foreach ($data['details'] as $detail) {
                $product = $this->productService->findProduct($detail['id_product']);
                $sale->details()->create([
                    'id_product' => $detail['id_product'],
                    'quantity'   => $detail['quantity'],
                    'unit_price' => $detail['unit_price'],
                    'cost'       => $product->purchase_price,
                    'id_user'    => Auth::id(),
                ]);

                $this->inventoryService->registerMovement(
                    $detail['id_product'],
                    -abs($detail['quantity']), // Cantidad Negativa para Salida
                    'sale',
                    $detail['unit_price'],
                    $sale,
                    "Venta " . ($sale->document_type->value ?? $sale->document_type) . " {$sale->series}-{$sale->number}"
                );
            }

            return $sale;
        });
    }

    protected function calculateNextSaleNumber(string $docType, string $series): string
    {
        $lastSale = Sales::where('document_type', $docType)
            ->where('series', $series)
            ->orderBy(DB::raw('CAST(number AS UNSIGNED)'), 'desc')
            ->first();

        $lastNumber = $lastSale ? (int)$lastSale->number : 0;
        return str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
    }
}
