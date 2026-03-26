import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, User2 } from 'lucide-react';

// ... (Interface Movement se mantiene igual)

export const MovementColumns: ColumnDef<Movement>[] = [
    {
        accessorKey: 'created_at',
        header: 'FECHA KARDEX',
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
        header: 'MOVIMIENTO',
        cell: ({ row }) => {
            const { reference_id, reference_label } = row.original;

            const handleNavigate = () => {
                if (!reference_id) return;
                // Redirigimos siempre al detalle del Ajuste de Inventario
                router.get(`/inventario/ajuste/${reference_id}`);
            };

            return (
                <button
                    onClick={handleNavigate}
                    className="group flex items-center gap-1.5 text-[11px] font-bold tracking-tight text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400"
                >
                    <Eye className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    {reference_label || 'VER DETALLE'}
                </button>
            );
        },
    },
    {
        accessorKey: 'source_document',
        header: 'DOC. ORIGEN',
        cell: ({ row }) => (
            <div className="text-[11px] font-bold whitespace-nowrap text-muted-foreground uppercase">
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
                <span className="font-mono text-[9px] text-muted-foreground/80 uppercase">
                    {row.original.product.product_code}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'location_source',
        header: 'ORIGEN',
        cell: ({ row }) => (
            <div className="text-[10px] font-medium whitespace-nowrap text-muted-foreground/90 uppercase">
                {row.original.location_source || '—'}
            </div>
        ),
    },
    {
        accessorKey: 'location_dest',
        header: 'DESTINO',
        cell: ({ row }) => (
            <div className="text-[10px] font-medium whitespace-nowrap text-muted-foreground/90 uppercase">
                {row.original.location_dest || '—'}
            </div>
        ),
    },
    {
        accessorKey: 'quantity',
        header: () => <div className="text-right">CANTIDAD</div>,
        cell: ({ row }) => {
            const type = row.original.type.toLowerCase();
            const isOut = [
                'out',
                'sale',
                'purchase_return',
                'salida',
                'egreso',
            ].includes(type);

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
        header: () => <div className="text-right">STOCK FINAL</div>,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <div className="rounded border border-transparent bg-muted/40 px-2 py-0.5 text-right font-bold text-foreground tabular-nums dark:border-neutral-700/50 dark:bg-neutral-800/50">
                    {Number(row.original.balance).toFixed(2)}
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'user',
        header: 'RESPONSABLE',
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-2 text-[11px] font-medium whitespace-nowrap text-muted-foreground">
                <User2 className="h-3 w-3 opacity-70" />
                {row.original.user?.name || 'Sistema'}
            </div>
        ),
    },
];
