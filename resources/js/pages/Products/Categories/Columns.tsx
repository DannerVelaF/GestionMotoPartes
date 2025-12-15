import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

export type Category = {
    id_product_category: number;
    name_product_category: string;
    status: 'active' | 'inactive';
    created_at: string;
};

export const Columns: ColumnDef<Category>[] = [
    // Checkbox estilo ERP (opcional, pero sale en la imagen)
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
                onClick={(e) => e.stopPropagation()} // Evita que el click en el checkbox active la navegación de la fila
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'name_product_category',
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
            <div className="text-sm font-medium">
                {row.getValue('name_product_category')}
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
            // Estilos parecidos a la imagen (Cyan/Verde)
            const isActive = status === 'active';

            return (
                <Badge
                    className={`rounded-md border-0 px-2 py-0.5 text-xs font-normal ${
                        isActive
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' // Verde estilo "Ordenes de venta"
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200' // Gris para inactivo
                    }`}
                >
                    {isActive ? 'Activo' : 'Inactivo'}
                </Badge>
            );
        },
    },
];
