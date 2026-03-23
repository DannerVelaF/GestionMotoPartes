import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User2 } from 'lucide-react';

export interface Movement {
    id_movement: number;
    created_at: string;
    product: {
        product_name: string;
        product_code: string;
    };
    type: 'IN' | 'OUT' | 'INTERNAL' | string;
    quantity: number;
    balance: number;
    user: { name: string };
    location_source?: string;
    location_dest?: string;
    reference_label?: string; // Código del movimiento (ej: WH/IN/...)
    source_document?: string; // Código del documento origen (ej: OC-2026...)
    reference_type: string;
    reference_id: number;
}

export const MovementColumns: ColumnDef<Movement>[] = [
    {
        accessorKey: 'created_at',
        header: 'FECHA Y HORA',
        cell: ({ row }) => (
            <div className="text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">
                {format(
                    new Date(row.original.created_at),
                    'dd MMM yyyy, HH:mm',
                    { locale: es },
                )}
            </div>
        ),
    },
    {
        accessorKey: 'reference_label',
        header: 'REFERENCIA',
        cell: ({ row }) => (
            <div className="text-[11px] font-bold tracking-tight whitespace-nowrap text-foreground uppercase">
                {row.original.reference_label || '—'}
            </div>
        ),
    },
    {
        accessorKey: 'source_document',
        header: 'DOC. ORIGEN',
        cell: ({ row }) => (
            <div className="text-[11px] font-bold whitespace-nowrap text-blue-600 uppercase dark:text-blue-400">
                {row.original.source_document || '—'}
            </div>
        ),
    },
    {
        accessorKey: 'product',
        header: 'PRODUCTO',
        cell: ({ row }) => (
            <div className="flex min-w-[180px] flex-col">
                <span className="text-xs leading-tight font-bold text-foreground">
                    {row.original.product.product_name}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground/80">
                    {row.original.product.product_code}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'location_source',
        header: 'DE',
        cell: ({ row }) => (
            <div className="text-[10px] font-medium whitespace-nowrap text-muted-foreground/90 uppercase">
                {row.original.location_source || '—'}
            </div>
        ),
    },
    {
        accessorKey: 'location_dest',
        header: 'PARA',
        cell: ({ row }) => (
            <div className="text-[10px] font-medium whitespace-nowrap text-muted-foreground/90 uppercase">
                {row.original.location_dest || '—'}
            </div>
        ),
    },
    {
        accessorKey: 'quantity',
        header: 'CANTIDAD',
        cell: ({ row }) => {
            const type = row.original.type;
            const isOut = ['OUT', 'sale', 'purchase_return'].includes(type);
            return (
                <div
                    className={cn(
                        'text-right text-sm font-black tabular-nums',
                        isOut
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400',
                    )}
                >
                    {isOut ? '-' : '+'}
                    {Math.abs(Number(row.original.quantity)).toFixed(2)}
                </div>
            );
        },
    },
    {
        accessorKey: 'balance',
        header: 'STOCK FINAL',
        cell: ({ row }) => (
            <div className="rounded border border-transparent bg-muted/40 px-2 py-0.5 text-right font-bold text-foreground tabular-nums dark:border-neutral-700/50 dark:bg-neutral-800">
                {Number(row.original.balance).toFixed(2)}
            </div>
        ),
    },
    {
        accessorKey: 'user',
        header: 'RESPONSABLE',
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-2 text-[11px] font-medium whitespace-nowrap text-muted-foreground">
                <User2 className="h-3 w-3 opacity-70" />
                {row.original.user?.name || 'Sist.'}
            </div>
        ),
    },
];
