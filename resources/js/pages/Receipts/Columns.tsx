import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowUpDown, Link as LinkIcon } from 'lucide-react';

export interface Receipt {
    sale: React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | string | number | bigint | Iterable<React.ReactNode> | React.ReactPortal | boolean | Promise<AwaitedReactNode> | null | undefined;
    id_receipt: number;
    receipt_code: string;
    series: string;
    number: string;
    issue_date: string;
    total_amount: number;
    document_type: string;
    currency: string;
    supplier?: { company_name: string; ruc: string };
    purchase_order?: { id_purchase_order: number; po_code: string };
}

export const Columns: ColumnDef<Receipt>[] = [
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
        accessorKey: 'receipt_code',
        header: 'Código',
        cell: ({ row }) => (
            <div className="font-mono text-[11px] font-bold text-muted-foreground uppercase">
                {row.getValue('receipt_code')}
            </div>
        ),
        size: 110,
    },
    {
        accessorKey: 'issue_date',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="-ml-4 h-8 text-xs font-bold uppercase"
            >
                Emisión
                <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue('issue_date') as string);
            return <div className="text-sm">{format(date, 'dd/MM/yyyy')}</div>;
        },
        size: 110,
    },
    {
        accessorKey: 'document_type',
        header: 'Tipo',
        cell: ({ row }) => {
            const type = (
                row.getValue('document_type') as string
            )?.toLowerCase();

            const typeConfig: Record<
                string,
                { label: string; classes: string }
            > = {
                invoice: {
                    label: 'Factura',
                    classes:
                        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
                },
                factura: {
                    label: 'Factura',
                    classes:
                        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
                },
                receipt: {
                    label: 'Boleta',
                    classes:
                        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
                },
                boleta: {
                    label: 'Boleta',
                    classes:
                        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
                },
                // ✅ CONFIGURACIÓN PARA NOTA DE VENTA
                nota_venta: {
                    label: 'N. Venta',
                    classes:
                        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
                },
                credit_note: {
                    label: 'N. Crédito',
                    classes:
                        'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
                },
                nota_credito: {
                    label: 'N. Crédito',
                    classes:
                        'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
                },
            };

            const config = typeConfig[type] || {
                label: type?.replace('_', ' ') || 'S/D',
                classes:
                    'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400',
            };

            return (
                <Badge
                    variant="outline"
                    className={`text-[10px] font-bold uppercase shadow-none ${config.classes}`}
                >
                    {config.label}
                </Badge>
            );
        },
        size: 100,
    },
    {
        accessorKey: 'supplier.company_name',
        header: 'Entidad (Prov/Cli)',
        cell: ({ row }) => {
            const receipt = row.original;
            const supplier = receipt.supplier;
            const sale = receipt.sale;

            // Determinar nombre y documento (Prioriza proveedor, luego datos de la venta)
            const name =
                supplier?.company_name ||
                sale?.receiver_name ||
                'PÚBLICO GENERAL';
            const document = supplier?.ruc || sale?.receiver_id_number || '-';

            return (
                <div className="flex flex-col">
                    <span
                        className="max-w-[180px] truncate text-sm font-bold text-foreground"
                        title={name}
                    >
                        {name}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground">
                            {document}
                        </span>
                        {/* Badge minúsculo opcional para distinguir rápido */}
                        {supplier ? (
                            <span className="text-[9px] font-bold tracking-tighter text-blue-500/70 uppercase dark:text-blue-400/50">
                                Prov
                            </span>
                        ) : sale ? (
                            <span className="text-[9px] font-bold tracking-tighter text-emerald-500/70 uppercase dark:text-emerald-400/50">
                                Cli
                            </span>
                        ) : null}
                    </div>
                </div>
            );
        },
    },
    // --- REFERENCIA (SERIE-NÚMERO) ---
    {
        id: 'reference',
        header: 'Referencia',
        cell: ({ row }) => (
            <span className="text-sm font-bold text-foreground/80 uppercase">
                {row.original.series}-{row.original.number}
            </span>
        ),
        size: 120,
    },
    {
        id: 'origin',
        header: 'Origen',
        cell: ({ row }) => {
            const po = row.original.purchase_order;
            if (!po)
                return (
                    <span className="text-[10px] text-muted-foreground italic">
                        Directo
                    </span>
                );
            return (
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-blue-600 uppercase dark:text-blue-400">
                    <LinkIcon className="h-3 w-3" />
                    {po.po_code}
                </div>
            );
        },
        size: 120,
    },
    {
        accessorKey: 'total_amount',
        header: () => (
            <div className="text-right text-xs font-bold uppercase">Total</div>
        ),
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('total_amount'));
            const currency = row.original.currency || 'PEN';
            const formatted = new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: currency,
            }).format(amount);

            return (
                <div
                    className={`text-right font-black tabular-nums ${amount < 0 ? 'text-red-500' : 'text-foreground'}`}
                >
                    {formatted}
                </div>
            );
        },
        size: 120,
    },
];
