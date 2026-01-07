import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

// Definición del tipo según tu modelo ProductType
export type ProductType = {
    id_product_type: number;
    name_product_type: string;
    status: 'active' | 'inactive';
    created_at: string;
};

export const Columns: ColumnDef<ProductType>[] = [
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
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                onClick={(e) => e.stopPropagation()}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'name_product_type',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="pl-0 text-xs font-bold tracking-wider text-muted-foreground uppercase hover:bg-transparent"
                >
                    Nombre
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            );
        },
        cell: ({ row }) => (
            <div className="text-sm font-medium capitalize">
                {row.getValue('name_product_type')}
            </div>
        ),
    },
    {
        accessorKey: 'status',
        header: () => (
            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Estado
            </div>
        ),
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            const isActive = status === 'active';

            return (
                <Badge
                    className={`rounded-md border-0 px-2 py-0.5 text-xs font-normal ${
                        isActive
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                >
                    {isActive ? 'Activo' : 'Inactivo'}
                </Badge>
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
            const createdAt = new Date(row.getValue('created_at') as string);
            return (
                <div className="text-sm text-muted-foreground">
                    {createdAt.toLocaleDateString()}
                </div>
            );
        },
    },
];
