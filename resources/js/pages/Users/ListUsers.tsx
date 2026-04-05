import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import usersRoute from '@/routes/users';
import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Columns, User } from './Columns';
import { usePermission } from '@/hooks/usePermission';

interface PaginatedUsers {
    data: User[];
    from: number;
    to: number;
    total: number;
    per_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    users: PaginatedUsers;
    filters: { search?: string; per_page?: number };
}

export default function ListUsers({ users, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 400);

    // --- Sincronización de Filtros ---
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            updateParams({ search: debouncedSearch, page: 1 });
        }
    }, [debouncedSearch]);

    const updateParams = (newParams: any) => {
        router.get(
            usersRoute.index().url,
            {
                search: searchTerm,
                per_page: users.per_page,
                ...newParams,
            },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
    };
    const {hasPermission} = usePermission()
    return (
        <AppLayout breadcrumbs={[{ title: 'Usuarios', href: '' }]}>
            <Head title="Usuarios del Sistema" />

            <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
                {/* --- HEADER STICKY --- */}
                <div className="flex items-center justify-between border-b bg-background px-6 py-3 dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                        {hasPermission('user.create') && (
                            <>
                                <Button
                                    className="bg-blue-700 font-bold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                                    onClick={() =>
                                        router.visit(usersRoute.create().url)
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Nuevo
                                </Button>
                            </>
                        )}

                        <h1 className="text-lg font-bold tracking-tight text-foreground/90">
                            Usuarios
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* BUSCADOR */}
                        <div className="relative w-64">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nombre o usuario..."
                                className="h-9 border-muted bg-muted/30 pl-9 transition-all focus:bg-background dark:border-neutral-800 dark:bg-neutral-900/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* PAGINACIÓN ESTILO CONSOLA */}
                        <div className="flex items-center gap-2 border-l pl-4 text-sm text-muted-foreground tabular-nums dark:border-neutral-800">
                            <span className="font-medium text-foreground">
                                {users.from || 0}-{users.to || 0}
                            </span>
                            <span className="text-muted-foreground/60">
                                de {users.total}
                            </span>

                            <div className="ml-2 flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted dark:hover:bg-neutral-800"
                                    onClick={() =>
                                        users.prev_page_url &&
                                        router.visit(users.prev_page_url)
                                    }
                                    disabled={!users.prev_page_url}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted dark:hover:bg-neutral-800"
                                    onClick={() =>
                                        users.next_page_url &&
                                        router.visit(users.next_page_url)
                                    }
                                    disabled={!users.next_page_url}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ÁREA DE TABLA --- */}
                <div className="flex-1 overflow-auto bg-muted/5 p-4 dark:bg-neutral-950/20">
                    <div className="rounded-xl border bg-card shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                        <DataTable
                            columns={Columns}
                            data={users.data || []}
                            onRowClick={(row) => {
                                // Protección contra undefined y uso de Wayfinder
                                if (row?.id) {
                                    router.visit(
                                        usersRoute.show({ user: row.id }).url,
                                    );
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
