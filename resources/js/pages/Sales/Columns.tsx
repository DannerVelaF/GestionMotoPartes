// resources/js/Pages/Sales/Columns.tsx
import { Badge } from '@/components/ui/badge';
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
    receiver_name: string;
    receiver_id_number: string;
    receipt?: {
        document_type: string;
        series: string;
        number: string;
    };
    method_payment?: {
        name_method_payment: string;
    };
}

export const Columns: ColumnDef<Sale>[] = [
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
        id: 'reference',
        header: 'Referencia',
        cell: ({ row }) => {
            const receipt = row.original.receipt;
            if (!receipt) {
                return <span className="text-xs text-muted-foreground">--</span>;
            }

            const docTypeLabel = receipt.document_type === 'boleta' ? 'BOL' :
                                 receipt.document_type === 'factura' ? 'FAC' : 'TICK';

            return (
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {docTypeLabel}
                    </span>
                    <span className="text-xs font-medium">
                        {receipt.series}-{receipt.number}
                    </span>
                </div>
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
        id: 'method_payment',
        header: 'Pago',
        cell: ({ row }) => {
            const payment = row.original.method_payment?.name_method_payment || 'N/A';
            return (
                <Badge variant="outline" className="font-normal whitespace-nowrap bg-muted/30">
                    {payment}
                </Badge>
            );
        },
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
