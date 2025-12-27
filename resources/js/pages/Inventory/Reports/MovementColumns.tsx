import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {cn} from '@/lib/utils';

export interface Movement {
    id: number;
    type: 'purchase' | 'sale' | 'return' | 'adjustment';
    quantity: number;
    unit_cost: number;
    balance: number;
    created_at: string;
    notes: string;
    product: { product_name: string; product_code: string };
    user: { name: string };
}

export const MovementColumns: ColumnDef<Movement>[] = [
    {
        accessorKey: 'created_at',
        header: 'Fecha y Hora',
        cell: ({ row }) => (
            <div className="text-xs">
                {format(new Date(row.original.created_at), 'dd MMM yyyy, p', {
                    locale: es,
                })}
            </div>
        ),
    },
    {
        accessorKey: 'product.product_name',
        header: 'Producto',
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="text-sm font-medium">
                    {row.original.product.product_name}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                    {row.original.product.product_code}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ row }) => {
            const type = row.getValue('type') as string;

            // Definimos el mapeo de nombres y colores
            const typeConfig: Record<string, { label: string; class: string }> =
                {
                    purchase: {
                        label: 'Compra',
                        class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
                    },
                    sale: {
                        label: 'Venta',
                        class: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
                    },
                    purchase_return: {
                        label: 'Devolución Compra (NC)',
                        class: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
                    },
                    return: {
                        label: 'Devolución Venta',
                        class: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
                    },
                    adjustment: {
                        label: 'Ajuste de Stock',
                        class: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
                    },
                };

            const config = typeConfig[type] || {
                label: type,
                class: 'bg-muted text-muted-foreground',
            };

            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'border-none text-[10px] font-black tracking-tighter uppercase',
                        config.class,
                    )}
                >
                    {config.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'quantity',
        header: () => <div className="text-right">Cantidad</div>,
        cell: ({ row }) => {
            const qty = Number(row.original.quantity);
            return (
                <div
                    className={`text-right font-bold tabular-nums ${qty > 0 ? 'text-blue-600' : 'text-red-600'}`}
                >
                    {qty > 0 ? `+${qty.toFixed(2)}` : qty.toFixed(2)}
                </div>
            );
        },
    },
    {
        accessorKey: 'balance',
        header: () => <div className="text-right">Stock Resultante</div>,
        cell: ({ row }) => (
            <div className="text-right font-medium tabular-nums">
                {Number(row.original.balance).toFixed(2)}
            </div>
        ),
    },
    {
        accessorKey: 'user.name',
        header: 'Responsable',
        cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
                {row.original.user?.name || 'Sistema'}
            </span>
        ),
    },
];
