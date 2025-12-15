import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Mail, Phone, User } from 'lucide-react';

// 1. Definimos la interfaz del Proveedor (igual a la de tu DB)
export interface Supplier {
    id_supplier: number;
    company_name: string;
    ruc: string;
    supplier_name: string | null;
    supplier_email: string | null;
    supplier_phone: string | null;
    created_at?: string;
}

export const Columns: ColumnDef<Supplier>[] = [
    // --- COLUMNA DE SELECCIÓN (CHECKBOX) ---
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
                onClick={(e) => e.stopPropagation()} // Evita que el click seleccione la fila para editar
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40, // Ancho fijo pequeño
    },

    // --- COLUMNA RUC ---
    {
        accessorKey: 'ruc',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="pl-0 text-left hover:bg-transparent"
                >
                    RUC
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            return (
                <Badge
                    variant="outline"
                    className="font-mono font-normal text-muted-foreground"
                >
                    {row.getValue('ruc')}
                </Badge>
            );
        },
        size: 150,
    },

    // --- COLUMNA RAZÓN SOCIAL (PRINCIPAL) ---
    {
        accessorKey: 'company_name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="pl-0 text-left hover:bg-transparent"
                >
                    Razón Social
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const name = row.getValue('company_name') as string;
            return (
                <div className="flex items-center gap-3">
                    {/* Avatar de iniciales */}
                    <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {name.substring(0, 2).toUpperCase()}
                    </div>
                    <span
                        className="max-w-[300px] truncate font-semibold text-foreground"
                        title={name}
                    >
                        {name}
                    </span>
                </div>
            );
        },
    },

    // --- COLUMNA CONTACTO (PERSONA) ---
    {
        accessorKey: 'supplier_name',
        header: 'Contacto',
        cell: ({ row }) => {
            const contactName = row.original.supplier_name;
            if (!contactName)
                return (
                    <span className="text-muted-foreground/40 italic">--</span>
                );

            return (
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{contactName}</span>
                </div>
            );
        },
    },

    // --- COLUMNA DATOS DE CONTACTO (EMAIL / TEL) ---
    {
        id: 'contact_info',
        header: 'Información',
        cell: ({ row }) => {
            const email = row.original.supplier_email;
            const phone = row.original.supplier_phone;

            if (!email && !phone)
                return (
                    <span className="text-muted-foreground/40 italic">--</span>
                );

            return (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {email && (
                        <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span
                                className="max-w-[200px] truncate"
                                title={email}
                            >
                                {email}
                            </span>
                        </div>
                    )}
                    {phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{phone}</span>
                        </div>
                    )}
                </div>
            );
        },
    },
];
