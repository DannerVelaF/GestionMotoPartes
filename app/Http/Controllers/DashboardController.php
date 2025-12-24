<?php

namespace App\Http\Controllers;

use App\Models\Products;
use App\Models\Sales;
use App\Models\Receipt;
use App\Models\InventoryMovements;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        // 1. Cálculos Financieros (KPIs)
        $rawSales = Sales::sum('total') ?? 0;
        $rawPurchases = Receipt::sum('total_amount') ?? 0;
        $netMargin = $rawSales - $rawPurchases;

        $activeUsers = User::where('is_active', true)->count();
        $lowStock = Products::where('stock', '<', 10)->count();

        // 2. Gráfico Comparativo (Últimos 7 días)
        $days = collect(range(6, 0))->map(fn($i) => now()->subDays($i)->format('Y-m-d'));

        $salesData = Sales::select(DB::raw('DATE(date_sales) as date'), DB::raw('SUM(total) as total'))
            ->where('date_sales', '>=', now()->subDays(7))
            ->groupBy('date')->pluck('total', 'date');

        $purchasesData = Receipt::select(DB::raw('DATE(issue_date) as date'), DB::raw('SUM(total_amount) as total'))
            ->where('issue_date', '>=', now()->subDays(7))
            ->groupBy('date')->pluck('total', 'date');

        $chartData = $days->map(fn($date) => [
            'date' => date('d M', strtotime($date)),
            'ventas' => (float) ($salesData->get($date) ?? 0),
            'compras' => (float) ($purchasesData->get($date) ?? 0),
        ]);

        // 3. Movimientos de Inventario (Polimórficos)
        $recentMovements = InventoryMovements::with(['product', 'reference'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($move) {
                $refLabel = $move->notes ?? 'Movimiento manual';

                if (!$move->notes && $move->reference) {
                    if ($move->reference_type === \App\Models\Sales::class) {
                        $refLabel = "Venta " . ($move->reference->code_sales ?? '');
                    } elseif ($move->reference_type === \App\Models\Receipt::class) {
                        $tipo = $move->reference->document_type === 'nota_credito' ? 'Devolución' : 'Compra';
                        $refLabel = $tipo . " " . ($move->reference->receipt_code ?? '');
                    }
                }

                return [
                    'product_name'   => $move->product->product_name ?? 'Producto borrado',
                    'quantity'       => (float) $move->quantity,
                    'type'           => $move->type, // 'purchase' o 'sale'
                    'reference_label' => $refLabel,
                    'reference_type' => $move->reference_type,
                    'reference_id'   => $move->reference_id,
                    'created_at'     => $move->created_at,
                ];
            });

        // 4. Top 5 Productos más vendidos
        $topProducts = DB::table('sale_details')
            ->join('products', 'sale_details.id_product', '=', 'products.id_product')
            ->select(
                'products.id_product',
                'products.product_name',
                DB::raw('SUM(sale_details.quantity) as sold')
            )
            ->groupBy('products.id_product', 'products.product_name')
            ->orderByDesc('sold')
            ->limit(5)
            ->get();

        // 5. Retorno a Inertia
        return Inertia::render('dashboard', [
            'stats' => [
                'total_sales'     => number_format($rawSales, 2),
                'total_purchases' => number_format($rawPurchases, 2),
                'margin'          => number_format($netMargin, 2),
                'margin_raw'      => $netMargin,
                'active_users'    => $activeUsers,
                'low_stock'       => $lowStock,
            ],
            'chartData'       => $chartData,
            'recentMovements' => $recentMovements,
            'topProducts'     => $topProducts
        ]);
    }
}
