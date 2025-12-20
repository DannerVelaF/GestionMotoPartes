// resources/js/Pages/Inventory/MovementColumns.tsx
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    RefreshCcw,
    Settings,
} from 'lucide-react';

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
            const type = row.original.type;
            const configs = {
                purchase: {
                    label: 'Compra',
                    color: 'bg-blue-100 text-blue-700',
                    icon: ArrowUpCircle,
                },
                sale: {
                    label: 'Venta',
                    color: 'bg-emerald-100 text-emerald-700',
                    icon: ArrowDownCircle,
                },
                return: {
                    label: 'Devolución',
                    color: 'bg-orange-100 text-orange-700',
                    icon: RefreshCcw,
                },
                adjustment: {
                    label: 'Ajuste',
                    color: 'bg-slate-100 text-slate-700',
                    icon: Settings,
                },
            };
            const config = configs[type] || {
                label: type,
                color: '',
                icon: ArrowUpCircle,
            };
            const Icon = config.icon;
            return (
                <Badge
                    variant="outline"
                    className={`flex w-fit items-center gap-1 font-normal ${config.color}`}
                >
                    <Icon className="h-3 w-3" />
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
