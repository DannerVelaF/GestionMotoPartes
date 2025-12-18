// resources/js/Pages/Sales/Columns.tsx
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Sale {
    id_sales: number;
    code_sales: string;
    series: string;
    number: string;
    date_sales: string;
    total: number;
    document_type: string;
    receiver_name: string;
    receiver_id_number: string;
}

export const Columns: ColumnDef<Sale>[] = [
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
                aria-label="Seleccionar todos"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Seleccionar fila"
                onClick={(e) => e.stopPropagation()}
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },
    {
        accessorKey: 'code_sales',
        header: 'Código',
        cell: ({ row }) => (
            <div className="font-mono text-xs font-bold text-muted-foreground">
                {row.original.code_sales}
            </div>
        ),
    },
    {
        accessorKey: 'date_sales',
        header: 'Fecha',
        cell: ({ row }) => {
            const date = new Date(row.original.date_sales);
            return isNaN(date.getTime())
                ? '-'
                : format(date, 'dd MMM yyyy', { locale: es });
        },
    },
    {
        accessorKey: 'document_type',
        header: 'Tipo',
        cell: ({ row }) => {
            const type = row.original.document_type?.toLowerCase();
            const config: Record<string, { label: string; classes: string }> = {
                factura: {
                    label: 'Factura',
                    classes: 'border-blue-200 bg-blue-50 text-blue-700',
                },
                boleta: {
                    label: 'Boleta',
                    classes:
                        'border-emerald-200 bg-emerald-50 text-emerald-700',
                },
                nota_venta: {
                    label: 'Nota Venta',
                    classes: 'border-gray-200 bg-gray-50 text-gray-700',
                },
            };
            const item = config[type] || { label: type, classes: '' };
            return (
                <Badge
                    variant="outline"
                    className={`font-normal ${item.classes}`}
                >
                    {item.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'receiver_name',
        header: 'Cliente',
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="truncate font-medium">
                    {row.original.receiver_name || 'Venta al paso'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                    {row.original.receiver_id_number}
                </span>
            </div>
        ),
    },
    {
        id: 'reference',
        header: 'Referencia',
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {row.original.series}-{row.original.number}
            </span>
        ),
    },
    {
        accessorKey: 'total',
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
            const formatted = new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN',
            }).format(row.original.total);
            return (
                <div className="text-right font-bold tabular-nums">
                    {formatted}
                </div>
            );
        },
    },
];
