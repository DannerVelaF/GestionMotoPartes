import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

export interface InventoryItem {
    id_product: number;
    product_name: string;
    product_code: string;
    stock: number;
    sale_price: number;
    purchase_price: number;
}

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
        cell: ({ row }) => (
            <span className="text-sm font-medium">
                {row.original.product_name}
            </span>
        ),
    },
    {
        accessorKey: 'stock',
        header: () => <div className="text-right">Stock Actual</div>,
        cell: ({ row }) => {
            const stock = Number(row.original.stock || 0);
            return (
                <div
                    className={`text-right font-bold tabular-nums ${stock <= 10 ? 'text-red-600' : 'text-emerald-600'}`}
                >
                    {stock.toFixed(2)}
                </div>
            );
        },
    },
    {
        accessorKey: 'purchase_price',
        header: () => <div className="text-right">Últ. Costo</div>,
        cell: ({ row }) => (
            <div className="text-right text-sm text-gray-600">
                S/ {Number(row.original.purchase_price || 0).toFixed(2)}
            </div>
        ),
    },
    {
        accessorKey: 'sale_price',
        header: () => <div className="text-right">Precio Venta</div>,
        cell: ({ row }) => (
            <div className="text-right text-sm font-medium text-emerald-700">
                S/ {Number(row.original.sale_price || 0).toFixed(2)}
            </div>
        ),
    },

    {
        id: 'profit',
        header: () => <div className="text-right">Ganancia Estimada</div>,
        cell: ({ row }) => {
            const stock = Number(row.original.stock || 0);
            const cost = Number(row.original.purchase_price || 0);
            const salePrice = Number(row.original.sale_price || 0);

            // Ganancia unitaria multiplicada por el stock disponible
            const totalProfit = (salePrice - cost) * stock;
            const isNegative = totalProfit < 0;

            return (
                <div
                    className={cn(
                        'text-right font-bold tabular-nums',
                        isNegative ? 'text-red-500' : 'text-emerald-600',
                    )}
                >
                    S/{' '}
                    {totalProfit.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                    })}
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
                <div className="text-right font-bold text-blue-600 tabular-nums">
                    S/ {total.toFixed(2)}
                </div>
            );
        },
    },
];
