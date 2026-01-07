import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Globe, Mail, MapPin, Phone, User } from 'lucide-react';

// 1. Definimos la interfaz del Proveedor (igual a la de tu DB)
export interface Supplier {
    id_supplier: number;
    company_name: string;
    ruc: string; // Puede ser RUC o Tax ID
    type?: 'nacional' | 'extranjero';
    supplier_name: string | null;
    supplier_email: string | null;
    supplier_phone: string | null;
    created_at?: string;
}

export const Columns: ColumnDef<Supplier>[] = [
    // --- COLUMNA DE SELECCIÓN ---
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

    // --- NUEVA COLUMNA TIPO ---
    {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ row }) => {
            // Lógica de inferencia si no viene el campo 'type' del backend
            const doc = row.original.ruc;
            const isNational =
                row.original.type === 'nacional' ||
                (!row.original.type && doc.length === 11 && /^\d+$/.test(doc));

            return (
                <Badge
                    variant="outline"
                    className={`gap-1 pr-2.5 font-medium ${
                        isNational
                            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400'
                            : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                    }`}
                >
                    {isNational ? (
                        <>
                            <MapPin className="h-3 w-3" />
                            Nacional
                        </>
                    ) : (
                        <>
                            <Globe className="h-3 w-3" />
                            Extranjero
                        </>
                    )}
                </Badge>
            );
        },
        size: 120,
    },

    // --- COLUMNA RUC / TAX ID (LIMPIA) ---
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
                    ID Fiscal / RUC
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            return (
                <span className="font-mono text-sm font-medium text-foreground/80">
                    {row.getValue('ruc')}
                </span>
            );
        },
        size: 140,
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {name.substring(0, 2).toUpperCase()}
                    </div>
                    <span
                        className="max-w-[250px] truncate font-semibold text-foreground"
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
                    <span className="text-xs text-muted-foreground/40 italic">
                        --
                    </span>
                );

            return (
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="max-w-[150px] truncate">
                        {contactName}
                    </span>
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
                    <span className="text-xs text-muted-foreground/40 italic">
                        --
                    </span>
                );

            return (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {email && (
                        <div className="flex items-center gap-2" title={email}>
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="max-w-[180px] truncate">
                                {email}
                            </span>
                        </div>
                    )}
                    {phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{phone}</span>
                        </div>
                    )}
                </div>
            );
        },
    },
];
