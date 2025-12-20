import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, History, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Movement, MovementColumns } from './MovementColumns';

interface Props {
    movements: {
        data: Movement[];
        total: number;
        from: number;
        to: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
    filters: { search?: string; type?: string; per_page?: number };
}

export default function GlobalMovements({ movements, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');

    // Estados para paginación editable
    const [perPage, setPerPage] = useState<string | number>(movements.per_page);
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);

    // Función centralizada de actualización
    const updateParams = (newParams: any) => {
        const type = typeFilter === 'all' ? undefined : typeFilter;
        router.get(
            '/inventario/movimientos',
            {
                search: debouncedSearch,
                type,
                per_page: perPage,
                page: movements.current_page, // Mantener la página actual por defecto
                ...newParams,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            updateParams({ search: debouncedSearch, page: 1 });
        }
    }, [debouncedSearch]);

    useEffect(() => {
        const currentType = filters.type || 'all';
        if (typeFilter !== currentType) {
            updateParams({
                type: typeFilter === 'all' ? undefined : typeFilter,
                page: 1,
            });
        }
    }, [typeFilter]);

    useEffect(() => {
        if (isEditingPerPage && perPageInputRef.current) {
            perPageInputRef.current.focus();
        }
    }, [isEditingPerPage]);

    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue > movements.total) newValue = movements.total;
        else if (newValue < 1) newValue = 25;

        setPerPage(newValue);
        if (newValue !== movements.per_page) {
            updateParams({ per_page: newValue, page: 1 });
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Inventario', href: '/inventario' },
                { title: 'Movimientos Globales', href: '#' },
            ]}
        >
            <Head title="Historial de Movimientos" />

            <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
                <div className="flex items-center justify-between border-b px-6 py-3">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <History className="h-6 w-6" />
                        </div>
                        <h1 className="text-lg font-semibold">
                            Trazabilidad de Almacén
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select
                            value={typeFilter}
                            onValueChange={setTypeFilter}
                        >
                            <SelectTrigger className="h-9 w-40 bg-muted/20">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Todos los tipos
                                </SelectItem>
                                <SelectItem value="purchase">
                                    Compras
                                </SelectItem>
                                <SelectItem value="sale">Ventas</SelectItem>
                                <SelectItem value="adjustment">
                                    Ajustes
                                </SelectItem>
                                <SelectItem value="return">
                                    Devoluciones
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative w-64">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar producto..."
                                className="h-9 bg-muted/20 pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* PAGINACIÓN IGUAL A INVENTARIO */}
                        <div className="flex items-center gap-2 border-l pl-4 text-sm text-muted-foreground tabular-nums">
                            <span className="flex items-center gap-1">
                                <span>{movements.from || 0}</span>-
                                <div
                                    className="relative min-w-[1.5rem] text-center"
                                    onClick={() => setIsEditingPerPage(true)}
                                >
                                    {isEditingPerPage ? (
                                        <input
                                            ref={perPageInputRef}
                                            type="number"
                                            className="h-5 w-12 rounded border bg-background text-center text-xs font-bold"
                                            value={perPage}
                                            onChange={(e) =>
                                                setPerPage(e.target.value)
                                            }
                                            onBlur={handlePerPageSubmit}
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' &&
                                                handlePerPageSubmit()
                                            }
                                        />
                                    ) : (
                                        <span className="cursor-pointer rounded px-1 font-bold hover:bg-muted">
                                            {movements.to || 0}
                                        </span>
                                    )}
                                </div>
                                / {movements.total}
                            </span>
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={movements.current_page <= 1}
                                    onClick={() =>
                                        updateParams({
                                            page: movements.current_page - 1,
                                        })
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={
                                        movements.current_page >=
                                        movements.last_page
                                    }
                                    onClick={() =>
                                        updateParams({
                                            page: movements.current_page + 1,
                                        })
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-4">
                    <div className="rounded-lg border bg-card shadow-sm">
                        <DataTable
                            columns={MovementColumns}
                            data={movements.data}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
