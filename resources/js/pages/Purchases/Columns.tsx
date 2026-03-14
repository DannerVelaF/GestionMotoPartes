import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface PurchaseOrder {
    id_purchase_order: number;
    po_code: string;
    id_supplier: number;
    id_user: number;
    issue_date: string;
    expected_date: string | null;
    total_amount: string | number;
    currency: string;
    status: 'draft' | 'sent' | 'received' | 'cancelled' | 'approved';
    order_type: 'purchase' | 'service';
    supplier: {
        company_name: string;
        ruc: string;
    };
    creator: {
        name: string;
    };
}

export const Columns: ColumnDef<PurchaseOrder>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'po_code',
        header: 'CÓDIGO',
        cell: ({ row }) => {
            return (
                <div className="font-mono text-xs font-bold text-muted-foreground">
                    {row.original.po_code}
                </div>
            );
        },
    },
    {
        accessorKey: 'issue_date',
        header: 'FECHA ORDEN',
        cell: ({ row }) => {
            const date = new Date(row.original.issue_date);
            return (
                <div className="text-xs font-medium">
                    {format(date, 'dd MMM yyyy', { locale: es })}
                </div>
            );
        },
    },
    {
        accessorKey: 'supplier.company_name',
        header: 'PROVEEDOR',
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                        {row.original.supplier?.company_name || 'Desconocido'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        RUC: {row.original.supplier?.ruc || 'N/A'}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: 'order_type',
        header: 'TIPO',
        cell: ({ row }) => {
            const isService = row.original.order_type === 'service';
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'border-transparent text-[9px] tracking-wider uppercase',
                        isService
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                    )}
                >
                    {isService ? 'Servicio' : 'Compra'}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'creator.name',
        header: 'CREADOR',
        cell: ({ row }) => {
            return (
                <div className="text-xs font-medium">
                    {row.original.creator?.name || 'N/A'}
                </div>
            );
        },
    },
    {
        accessorKey: 'currency',
        header: 'MONEDA',
        cell: ({ row }) => {
            return (
                <div className="text-center text-xs font-bold">
                    {row.original.currency}
                </div>
            );
        },
    },
    {
        accessorKey: 'expected_date',
        header: 'LLEGADA ESTIMADA',
        cell: ({ row }) => {
            if (!row.original.expected_date)
                return <span className="text-muted-foreground">-</span>;
            const date = new Date(row.original.expected_date);
            return (
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {format(date, 'dd MMM yyyy', { locale: es })}
                </div>
            );
        },
    },
    {
        accessorKey: 'status',
        header: 'ESTADO',
        cell: ({ row }) => {
            const status = row.original.status;

            const statusConfig = {
                draft: {
                    label: 'Borrador',
                    class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                },
                sent: {
                    label: 'Enviado / Pdte',
                    class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                },
                approved: {
                    label: 'Aprobado',
                    class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                },
                received: {
                    label: 'Recibido',
                    class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
                },
                cancelled: {
                    label: 'Cancelado',
                    class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                },
            };

            const config = statusConfig[status] || statusConfig.draft;

            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'border-transparent text-[9px] tracking-wider uppercase',
                        config.class,
                    )}
                >
                    {config.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'total_amount',
        header: () => <div className="text-right">TOTAL</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.original.total_amount as string);
            const symbol = row.original.currency === 'USD' ? '$' : 'S/';
            return (
                <div className="text-right font-bold text-foreground tabular-nums">
                    {symbol} {amount.toFixed(2)}
                </div>
            );
        },
    },
];
