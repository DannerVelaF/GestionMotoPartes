import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
export interface InventoryItem {
    id_product: number;
    product_name: string;
    product_code: string;
    stock: number;
    sale_price: number;
    purchase_price: number;
}

// Función auxiliar para formatear moneda de forma consistente
const formatCurrency = (value: number) => {
    return value.toLocaleString('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
    });
};

export const InventoryColumns: ColumnDef<InventoryItem>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                onClick={(e) => e.stopPropagation()}
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },
    {
        accessorKey: 'product_code',
        header: 'SKU',
        cell: ({ row }) => (
            <div className="font-mono text-[11px] font-bold text-muted-foreground uppercase">
                {row.original.product_code}
            </div>
        ),
    },
    {
        accessorKey: 'product_name',
        header: 'Producto',
        cell: ({ row }) => {
            const productName = row.original.product_name;

            const handleNavigateToMovements = (e: React.MouseEvent) => {
                e.preventDefault();
                // Navegamos a movimientos globales filtrando por el nombre del producto
                router.get('/inventario/movimientos', {
                    search: productName,
                });
            };

            return (
                <div className="flex flex-col">
                    <button
                        onClick={handleNavigateToMovements}
                        className="text-left decoration-blue-500 underline-offset-4 hover:cursor-pointer hover:underline"
                    >
                        <span className="mb-1 text-sm leading-none font-bold text-blue-600">
                            {productName}
                        </span>
                    </button>

                    {/* Badge de estado basado en stock */}
                    {row.original.stock <= 0 ? (
                        <span className="text-[10px] font-bold text-red-500 uppercase">
                            Sin Stock
                        </span>
                    ) : row.original.stock <= 10 ? (
                        <span className="text-[10px] font-bold text-orange-500 uppercase">
                            Stock Crítico
                        </span>
                    ) : null}
                </div>
            );
        },
    },
    {
        accessorKey: 'stock',
        header: () => <div className="text-right">Stock Actual</div>,
        cell: ({ row }) => {
            const stock = Number(row.original.stock || 0);
            return (
                <div
                    className={cn(
                        'text-right font-bold tabular-nums',
                        stock <= 0
                            ? 'text-slate-400'
                            : stock <= 10
                              ? 'text-red-600'
                              : 'text-emerald-600',
                    )}
                >
                    {stock.toFixed(2)}
                </div>
            );
        },
    },
    {
        accessorKey: 'purchase_price',
        header: () => <div className="text-right">Costo Unit.</div>,
        cell: ({ row }) => (
            <div className="text-right text-sm text-muted-foreground tabular-nums">
                {formatCurrency(Number(row.original.purchase_price || 0))}
            </div>
        ),
    },
    {
        accessorKey: 'sale_price',
        header: () => <div className="text-right">P. Venta</div>,
        cell: ({ row }) => (
            <div className="text-right text-sm font-bold text-blue-900 tabular-nums">
                {formatCurrency(Number(row.original.sale_price || 0))}
            </div>
        ),
    },
    {
        id: 'margin',
        header: () => <div className="text-right">Margen (%)</div>,
        cell: ({ row }) => {
            const cost = Number(row.original.purchase_price || 0);
            const sale = Number(row.original.sale_price || 0);
            const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;

            return (
                <div
                    className={cn(
                        'text-right text-[11px] font-bold tabular-nums',
                        margin < 15 ? 'text-orange-500' : 'text-slate-500',
                    )}
                >
                    {margin.toFixed(1)}%
                </div>
            );
        },
    },
    {
        id: 'profit',
        header: () => <div className="text-right">Ganancia Est.</div>,
        cell: ({ row }) => {
            const stock = Number(row.original.stock || 0);
            const cost = Number(row.original.purchase_price || 0);
            const sale = Number(row.original.sale_price || 0);
            const totalProfit = (sale - cost) * stock;

            return (
                <div
                    className={cn(
                        'text-right font-bold tabular-nums',
                        totalProfit < 0 ? 'text-red-500' : 'text-emerald-700',
                    )}
                >
                    {formatCurrency(totalProfit)}
                </div>
            );
        },
    },
    {
        id: 'valuation',
        header: () => <div className="text-right">Valorización</div>,
        cell: ({ row }) => {
            const total =
                Number(row.original.stock) *
                Number(row.original.purchase_price || 0);
            return (
                <div className="rounded bg-blue-50/50 px-1 text-right font-bold text-blue-600 tabular-nums">
                    {formatCurrency(total)}
                </div>
            );
        },
    },
];
