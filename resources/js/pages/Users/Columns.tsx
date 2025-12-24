import { ColumnDef } from '@tanstack/react-table';
import { Circle, Mail, User as UserIcon } from 'lucide-react';

// Definimos la interfaz del Usuario para la tabla
export interface User {
    id: number;
    name: string;
    father_last_name: string | null;
    mother_last_name: string | null;
    username: string;
    email: string | null;
    is_active: boolean;
    last_login_at: string | null;
}

export const Columns: ColumnDef<User>[] = [
    {
        accessorKey: 'name',
        // Estilo de encabezado minimalista y profesional
        header: () => (
            <span className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/70 uppercase">
                Identidad / Personal
            </span>
        ),
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex items-center gap-3 py-1">
                    {/* Avatar genérico con estilo de sistema */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                        <UserIcon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm leading-none font-bold text-foreground capitalize">
                            {user.name} {user.father_last_name}
                        </span>
                        <span className="mt-1.5 font-mono text-[10px] leading-none font-medium tracking-tight text-muted-foreground uppercase">
                            @{user.username}
                        </span>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'email',
        header: () => (
            <span className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/70 uppercase">
                Contacto
            </span>
        ),
        cell: ({ row }) => {
            const email = row.getValue('email') as string;
            return (
                <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/40" />
                    {email ? (
                        <span className="font-medium text-neutral-600 dark:text-neutral-400">
                            {email}
                        </span>
                    ) : (
                        <span className="text-[11px] text-muted-foreground/30 italic">
                            Sin correo asignado
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'is_active',
        header: () => (
            <span className="block text-center text-[10px] font-black tracking-[0.15em] text-muted-foreground/70 uppercase">
                Estado de Acceso
            </span>
        ),
        cell: ({ row }) => {
            const isActive = row.getValue('is_active') as boolean;
            return (
                <div className="flex justify-center">
                    <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-tighter uppercase transition-colors ${
                            isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400'
                        }`}
                    >
                        <Circle
                            className={`h-1.5 w-1.5 fill-current ${isActive ? 'text-emerald-500' : 'text-red-500'}`}
                        />
                        {isActive ? 'Habilitado' : 'Restringido'}
                    </div>
                </div>
            );
        },
    },
];
