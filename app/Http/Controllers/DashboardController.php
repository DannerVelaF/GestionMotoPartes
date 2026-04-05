<?php

namespace App\Http\Controllers;

use App\Models\Products;
use App\Models\Sales;
use App\Models\PurchaseOrder;
use App\Models\InventoryMovements;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $startDate = now()->subDays(6)->startOfDay();

        // 1. Cálculos Financieros (KPIs) - Siempre en PEN
        $rawSales = Sales::sum('total') ?? 0;

        // Compras: Solo aprobadas/recibidas y convertidas a Soles dinámicamente
        $rawPurchases = PurchaseOrder::whereNotIn('status', ['draft', 'cancelled'])
            ->selectRaw('SUM(
                CASE
                    WHEN currency = "USD" THEN total_amount * exchange_rate
                    ELSE total_amount
                END
            ) as total_pen')
            ->value('total_pen') ?? 0;

        $netMargin = $rawSales - $rawPurchases;

        $activeUsers = User::count(); // O User::where('is_active', true)->count() si tienes esa columna
        $lowStock = Products::where('stock', '<', 10)->count();

        // 2. Gráfico Comparativo (Últimos 7 días)
        $days = collect(range(6, 0))->map(fn($i) => now()->subDays($i)->format('Y-m-d'));

        $salesData = Sales::select(
            DB::raw('DATE(date_sales) as date_only'),
            DB::raw('SUM(total) as total')
        )
            ->where('date_sales', '>=', $startDate)
            ->groupBy('date_only')
            ->pluck('total', 'date_only');

        $purchasesData = PurchaseOrder::whereNotIn('status', ['draft', 'cancelled'])
            ->select(
                DB::raw('DATE(issue_date) as date_only'),
                DB::raw('SUM(
                    CASE
                        WHEN currency = "USD" THEN total_amount * exchange_rate
                        ELSE total_amount
                    END
                ) as total')
            )
            ->where('issue_date', '>=', $startDate)
            ->groupBy('date_only')
            ->pluck('total', 'date_only');

        $chartData = $days->map(fn($date) => [
            'date' => date('d M', strtotime($date)),
            'ventas' => (float) ($salesData->get($date) ?? 0),
            'compras' => (float) ($purchasesData->get($date) ?? 0),
        ]);

        // 3. Movimientos de Inventario (Adaptado a tu nueva estructura)
        $recentMovements = InventoryMovements::with(['product'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($move) {
                // Lógica de etiquetas basada en el tipo de movimiento
                $refLabel = $move->notes ?? 'Ajuste de inventario';

                if ($move->reference_type === \App\Models\Sales::class) {
                    $refLabel = "Venta #" . ($move->reference->code_sales ?? $move->reference_id);
                } elseif ($move->reference_type === \App\Models\InventoryAdjustment::class) {
                    $refLabel = "Ajuste Almacén";
                } elseif ($move->reference_type === \App\Models\Receipt::class) {
                    $refLabel = "Ingreso Factura";
                }

                return [
                    'product_name'    => $move->product->product_name ?? 'Producto no encontrado',
                    'quantity'        => (float) $move->quantity,
                    'type'            => $move->type === 'IN' || $move->type === 'purchase' ? 'purchase' : 'sale',
                    'reference_label' => $refLabel,
                    'created_at'      => $move->created_at,
                ];
            });

        // 4. Top 5 Productos (Desde los detalles de venta)
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

        return Inertia::render('dashboard', [
            'stats' => [
                'total_sales'     => number_format($rawSales, 2, '.', ','),
                'total_purchases' => number_format($rawPurchases, 2, '.', ','),
                'margin'          => number_format($netMargin, 2, '.', ','),
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
