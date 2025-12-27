import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { Users } from 'lucide-react';

export interface RoleItem {
    id: number;
    name: string; // El slug (ej: admin)
    label: string; // El nombre visible (ej: Administrador)
    description: string;
    users_count?: number; // Viene del withCount('users') del controlador
    created_at: string;
}

export const RoleColumns: ColumnDef<RoleItem>[] = [
    {
        accessorKey: 'label',
        header: 'Rol',
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-bold text-foreground">
                    {row.original.label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                    #{row.original.id}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'name',
        header: 'Identificador (Slug)',
        cell: ({ row }) => (
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground">
                {row.original.name}
            </span>
        ),
    },
    {
        accessorKey: 'description',
        header: 'Descripción',
        cell: ({ row }) => (
            <span
                className="line-clamp-1 max-w-[300px] text-xs text-muted-foreground"
                title={row.original.description}
            >
                {row.original.description || '-'}
            </span>
        ),
    },
    {
        accessorKey: 'users_count',
        header: () => <div className="text-right">Usuarios</div>,
        cell: ({ row }) => {
            const count = row.original.users_count || 0;
            return (
                <div className="flex justify-end">
                    <div
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold',
                            count > 0
                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                        )}
                    >
                        <Users className="h-3 w-3" />
                        {count}
                    </div>
                </div>
            );
        },
    },
];
