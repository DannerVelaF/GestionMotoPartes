import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    History,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface Props {
    adjustments: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: { search?: string; per_page?: string };
}

export default function AdjustmentsList({ adjustments, filters }: Props) {
    const [selected, setSelected] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 400);
    const [perPage, setPerPage] = useState<string | number>(
        adjustments.per_page,
    );
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            updateParams({ search: debouncedSearch, page: 1 });
        }
    }, [debouncedSearch]);

    const updateParams = (newParams: any) => {
        router.get(
            '/inventario/ajuste/movimientos',
            { search: searchTerm, per_page: perPage, ...newParams },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue < 1) newValue = 25;
        setPerPage(newValue);
        if (newValue !== adjustments.per_page)
            updateParams({ per_page: newValue, page: 1 });
    };

    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelected(adjustments.data.map((adj: any) => adj.id_adjustment));
        } else {
            setSelected([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((rowId) => rowId !== id)
                : [...prev, id],
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Inventario', href: '/inventario' },
                { title: 'Movimientos', href: '#' },
            ]}
        >
            <Head title="Movimientos de Almacén" />

            <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
                {/* --- TOOLBAR SUPERIOR --- */}
                <div className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                            <History className="h-6 w-6" />
                        </div>
                        <h1 className="text-lg font-semibold text-foreground italic">
                            Operaciones de Inventario
                        </h1>

                        {selected.length > 0 && (
                            <div className="flex animate-in items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1 text-foreground fade-in slide-in-from-left-2">
                                <span className="text-sm font-bold">
                                    {selected.length} seleccionados
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4"
                                    onClick={() => setSelected([])}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar referencia..."
                                className="h-9 bg-muted/30 pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Button
                            className="h-9 bg-foreground text-[11px] font-bold tracking-widest text-background uppercase shadow-sm hover:bg-foreground/90"
                            onClick={() => router.visit('/inventario/ajuste')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Ajuste
                        </Button>

                        {/* PAGINACIÓN */}
                        <div className="flex items-center gap-2 border-l border-border pl-4 text-sm text-muted-foreground tabular-nums">
                            <span>
                                {adjustments.from || 0}-{adjustments.to || 0} /{' '}
                                {adjustments.total}
                            </span>
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        updateParams({
                                            page: adjustments.current_page - 1,
                                        })
                                    }
                                    disabled={adjustments.current_page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        updateParams({
                                            page: adjustments.current_page + 1,
                                        })
                                    }
                                    disabled={
                                        adjustments.current_page >=
                                        adjustments.last_page
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TABLA --- */}
                <div className="flex-1 overflow-auto p-6 md:p-8">
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-12 px-4">
                                        <Checkbox
                                            onCheckedChange={handleSelectAll}
                                            checked={
                                                selected.length > 0 &&
                                                selected.length ===
                                                    adjustments.data.length
                                            }
                                        />
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Referencia
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        De
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Para
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Contacto
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                        Doc. Origen
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Fecha
                                    </TableHead>
                                    <TableHead className="text-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Estado
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adjustments.data.map((adj: any) => (
                                    <TableRow
                                        key={adj.id_adjustment}
                                        className="group cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
                                        onClick={() =>
                                            router.get(
                                                `/inventario/ajuste/${adj.id_adjustment}/edit`,
                                            )
                                        }
                                    >
                                        <TableCell
                                            className="px-4"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                checked={selected.includes(
                                                    adj.id_adjustment,
                                                )}
                                                onCheckedChange={() =>
                                                    handleSelectRow(
                                                        adj.id_adjustment,
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="font-bold tracking-tight text-foreground">
                                            {adj.reference_code}
                                        </TableCell>

                                        {/* ✅ CORRECCIÓN AQUÍ: Acceder a .name del objeto */}
                                        <TableCell className="text-xs text-muted-foreground">
                                            {adj.location_source?.name ||
                                                adj.location_origin ||
                                                'Externo'}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {adj.location_destination?.name ||
                                                adj.location_destination_name ||
                                                'Almacén/Stock'}
                                        </TableCell>

                                        <TableCell className="text-xs font-medium">
                                            {adj.contact_name || '—'}
                                        </TableCell>

                                        <TableCell className="text-xs font-bold text-emerald-700 dark:text-emerald-500">
                                            {/* Si es una OC vinculada, mostrar el código de la OC */}
                                            {adj.source?.po_code ||
                                                adj.reason?.match(
                                                    /OC-\d+/,
                                                )?.[0] ||
                                                '—'}
                                        </TableCell>

                                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                                            {format(
                                                new Date(adj.created_at),
                                                'dd/MM/yyyy HH:mm',
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center rounded-sm border px-2 py-0.5 text-[9px] font-black tracking-tighter uppercase transition-colors',
                                                    adj.status === 'done'
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-500/10 dark:text-blue-400',
                                                )}
                                            >
                                                {adj.status === 'done'
                                                    ? 'Realizado'
                                                    : 'Borrador'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {adjustments.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="h-32 text-center text-muted-foreground italic"
                                        >
                                            No se encontraron movimientos.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
