import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns'; // Necesitarás instalar date-fns si no lo tienes
import { es } from 'date-fns/locale'; // Para formato en español
import {
    Calendar,
    Circle,
    Clock,
    Mail,
    Shield,
    User as UserIcon,
} from 'lucide-react';

export interface User {
    id: number;
    name: string;
    father_last_name: string | null;
    mother_last_name: string | null;
    username: string;
    email: string | null;
    is_active: boolean;
    created_at: string;
    last_login_at: string | null;
    role?: {
        id: number;
        label: string;
        name: string;
    };
}

export const Columns: ColumnDef<User>[] = [
    {
        accessorKey: 'name',
        header: () => (
            <span className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/70 uppercase">
                Identidad / Personal
            </span>
        ),
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex items-center gap-3 py-1">
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
        accessorKey: 'role', // Columna ROL (Nueva)
        header: () => (
            <span className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/70 uppercase">
                Rol Asignado
            </span>
        ),
        cell: ({ row }) => {
            const role = row.original.role;
            const isAdmin = role?.name === 'admin';

            return (
                <div className="flex items-center">
                    {role ? (
                        <div
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold tracking-tight uppercase ${
                                isAdmin
                                    ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400'
                            }`}
                        >
                            <Shield className="h-3 w-3" />
                            {role.label}
                        </div>
                    ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                            Sin rol
                        </span>
                    )}
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
                            Sin correo
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'created_at', // Columna FECHA CREACIÓN (Nueva)
        header: () => (
            <span className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/70 uppercase">
                Registro
            </span>
        ),
        cell: ({ row }) => {
            const date = row.getValue('created_at') as string;
            return (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(date), 'dd MMM, yyyy', { locale: es })}
                    </div>
                    <span className="pl-4.5 text-[10px] text-muted-foreground">
                        {format(new Date(date), 'HH:mm')}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: 'last_login_at', // Columna ÚLTIMO ACCESO (Nueva)
        header: () => (
            <span className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/70 uppercase">
                Último Acceso
            </span>
        ),
        cell: ({ row }) => {
            const lastLogin = row.getValue('last_login_at') as string;

            if (!lastLogin) {
                return (
                    <span className="inline-flex items-center rounded-sm bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                        Nunca
                    </span>
                );
            }

            return (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium text-foreground/80">
                        {format(new Date(lastLogin), 'dd/MM/yy HH:mm')}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: 'is_active',
        header: () => (
            <span className="block text-center text-[10px] font-black tracking-[0.15em] text-muted-foreground/70 uppercase">
                Estado
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
                        {isActive ? 'Activo' : 'Inactivo'}
                    </div>
                </div>
            );
        },
    },
];
