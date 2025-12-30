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
            const type = (row.original.document_type || '').toLowerCase();

            // Configuración unificada con soporte Dark Mode
            const config: Record<string, { label: string; classes: string }> = {
                factura: {
                    label: 'Factura',
                    classes:
                        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
                },
                boleta: {
                    label: 'Boleta',
                    classes:
                        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
                },
                nota_venta: {
                    label: 'Nota Venta',
                    classes:
                        'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
                },
                // Agregamos Nota de Crédito/Débito por si aparecen en el futuro en este listado
                nota_credito: {
                    label: 'Nota Crédito',
                    classes:
                        'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
                },
            };

            const defaultConfig = {
                label: type,
                classes:
                    'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400',
            };

            const item = config[type] || defaultConfig;

            return (
                <Badge
                    variant="outline"
                    className={`font-normal whitespace-nowrap ${item.classes}`}
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
                    {row.original.receiver_name || '--'}
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
