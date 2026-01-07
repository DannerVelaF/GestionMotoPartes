import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpDown } from 'lucide-react';

// Interfaz actualizada para reflejar tipos más amplios
export interface Receipt {
    id_receipt: number;
    receipt_code: string;
    series: string;
    number: string;
    issue_date: string;
    total_amount: number;
    document_type: string; // 'invoice', 'receipt', 'credit_note', 'nota_credito', etc.
    supplier?: { company_name: string; ruc: string };
}

export const Columns: ColumnDef<Receipt>[] = [
    // --- CHECKBOX ---
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
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Seleccionar fila"
                className="translate-y-[2px]"
                onClick={(e) => e.stopPropagation()}
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },

    // --- CÓDIGO INTERNO ---
    {
        accessorKey: 'receipt_code',
        header: 'Código',
        cell: ({ row }) => (
            <div className="font-mono text-xs font-bold text-muted-foreground">
                {row.getValue('receipt_code')}
            </div>
        ),
        size: 120,
    },

    // --- FECHA EMISIÓN ---
    {
        accessorKey: 'issue_date',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="-ml-4 h-8 data-[state=open]:bg-accent"
                >
                    Emisión
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const dateValue = row.getValue('issue_date');
            if (!dateValue)
                return <span className="text-muted-foreground">-</span>;

            const date = new Date(dateValue as string);
            return (
                <div className="text-sm">
                    {format(date, 'dd MMM yyyy', { locale: es })}
                </div>
            );
        },
        size: 120,
    },

    // --- TIPO DOCUMENTO (CORREGIDO) ---
    {
        accessorKey: 'document_type',
        header: 'Tipo',
        cell: ({ row }) => {
            const type = (
                row.getValue('document_type') as string
            )?.toLowerCase();

            // Configuración de estilos y etiquetas según el Enum
            const typeConfig: Record<
                string,
                { label: string; classes: string }
            > = {
                // Facturas
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

                // Boletas
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

                // Notas de Crédito (Importante para tu devolución)
                credit_note: {
                    label: 'Nota Crédito',
                    classes:
                        'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
                },
                nota_credito: {
                    label: 'Nota Crédito',
                    classes:
                        'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
                },

                // Notas de Débito
                debit_note: {
                    label: 'Nota Débito',
                    classes:
                        'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300',
                },
                nota_debito: {
                    label: 'Nota Débito',
                    classes:
                        'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300',
                },
            };

            // Valor por defecto si llega algo desconocido
            const defaultConfig = {
                label: type || 'Otro',
                classes:
                    'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400',
            };

            const config = typeConfig[type] || defaultConfig;

            return (
                <Badge
                    variant="outline"
                    className={`font-normal whitespace-nowrap ${config.classes}`}
                >
                    {config.label}
                </Badge>
            );
        },
        size: 110,
    },

    // --- PROVEEDOR ---
    {
        accessorKey: 'supplier.company_name',
        header: 'Proveedor',
        cell: ({ row }) => {
            const supplier = row.original.supplier;
            return (
                <div className="flex flex-col">
                    <span
                        className="max-w-[200px] truncate font-medium"
                        title={supplier?.company_name}
                    >
                        {supplier?.company_name || 'Desconocido'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        RUC: {supplier?.ruc || '-'}
                    </span>
                </div>
            );
        },
    },

    // --- REFERENCIA (SERIE-NUMERO) ---
    {
        id: 'reference',
        header: 'Referencia',
        cell: ({ row }) => (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {row.original.series}-{row.original.number}
            </span>
        ),
    },

    // --- TOTAL ---
    {
        accessorKey: 'total_amount',
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('total_amount'));

            // Detectar si es negativo (Nota de crédito) para pintarlo rojo
            const isNegative = amount < 0;

            const formatted = new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN',
            }).format(amount);

            return (
                <div
                    className={`text-right font-bold tabular-nums ${isNegative ? 'text-red-500' : ''}`}
                >
                    {formatted}
                </div>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: () => (
            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Fecha Registro
            </div>
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return (
                <div className="text-sm text-muted-foreground">
                    {format(date, "d 'de' MMMM, yyyy", { locale: es })}
                </div>
            );
        },
    },
];
