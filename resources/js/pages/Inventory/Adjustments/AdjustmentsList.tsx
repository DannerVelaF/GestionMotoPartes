import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { KardexExportModal } from '@/pages/Inventory/Reports/KardexExportModal';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
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
        next_page_url: string | null;
        prev_page_url: string | null;
    };
    filters: { search?: string; per_page?: string };
    products?: any[]; // ✅ Agregado para recibir los productos y pasarlos al modal
}

const breadcrumbs = [
    { title: 'Inventario', href: '/inventario/ajuste/movimientos' },
    { title: 'Movimientos', href: '#' },
];

export default function AdjustmentsList({
    adjustments,
    filters,
    products = [],
}: Props) {
    const [selected, setSelected] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 400);
    const [perPage, setPerPage] = useState<string | number>(
        adjustments.per_page,
    );
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    // ✅ Validación: Solo se puede borrar si hay algo seleccionado y TODOS son 'draft'
    const canDeleteSelected = useMemo(() => {
        if (selected.length === 0) return false;
        return selected.every((id) => {
            const item = adjustments.data.find(
                (adj) => adj.id_adjustment === id,
            );
            return item?.status === 'draft';
        });
    }, [selected, adjustments.data]);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            updateParams({ search: debouncedSearch, page: 1 });
        }
    }, [debouncedSearch]);

    useEffect(() => {
        if (isEditingPerPage && perPageInputRef.current) {
            perPageInputRef.current.focus();
        }
    }, [isEditingPerPage]);

    const updateParams = (newParams: any) => {
        router.get(
            '/inventario/ajuste/movimientos',
            {
                search: filters.search,
                per_page: adjustments.per_page,
                ...newParams,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue > adjustments.total && adjustments.total > 0)
            newValue = adjustments.total;
        else if (newValue < 1) newValue = 25;
        setPerPage(newValue);
        if (newValue !== adjustments.per_page)
            updateParams({ per_page: newValue, page: 1 });
    };

    const handleKeyDownPerPage = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handlePerPageSubmit();
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

    const confirmBulkDelete = () => {
        if (canDeleteSelected) setIsDeleteAlertOpen(true);
    };

    const executeBulkDelete = () => {
        // ✅ Llamada a la nueva ruta bulk-delete vinculada al método bulkAdjustments
        router.delete('/inventario/ajuste/bulk-delete', {
            data: { ids: selected },
            preserveScroll: true,
            onSuccess: () => {
                setSelected([]);
                setIsDeleteAlertOpen(false);
            },
        });
    };

    const selectedCount = selected.length;

    const renderPagination = () => {
        return (
            <div className="flex items-center gap-2 border-l border-border/50 pl-4 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                <span className="flex items-center gap-1">
                    <span>{adjustments.from || 0}</span>-
                    <div
                        className="relative min-w-[1.5rem] cursor-pointer rounded text-center font-bold text-foreground hover:bg-muted"
                        onClick={() => setIsEditingPerPage(true)}
                    >
                        {isEditingPerPage ? (
                            <input
                                ref={perPageInputRef}
                                type="number"
                                className="absolute top-1/2 left-1/2 h-6 w-12 -translate-x-1/2 -translate-y-1/2 rounded-sm border bg-background text-center text-sm font-bold shadow-sm"
                                value={perPage}
                                onChange={(e) => setPerPage(e.target.value)}
                                onBlur={handlePerPageSubmit}
                                onKeyDown={handleKeyDownPerPage}
                            />
                        ) : (
                            <span className="px-1">{adjustments.to || 0}</span>
                        )}
                    </div>
                    / {adjustments.total}
                </span>
                <div className="ml-2 flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 disabled:opacity-30"
                        onClick={() =>
                            adjustments.prev_page_url &&
                            router.visit(adjustments.prev_page_url)
                        }
                        disabled={!adjustments.prev_page_url}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 disabled:opacity-30"
                        onClick={() =>
                            adjustments.next_page_url &&
                            router.visit(adjustments.next_page_url)
                        }
                        disabled={!adjustments.next_page_url}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Movimientos de Almacén" />

            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Estás seguro de eliminar?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán <strong>{selectedCount}</strong>{' '}
                            movimientos en borrador seleccionados. Esta acción
                            no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeBulkDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Sí, eliminar borradores
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
                <div
                    className={cn(
                        'flex items-center justify-between border-b px-6 py-3 transition-colors duration-300',
                        selectedCount > 0
                            ? 'bg-blue-50/50 dark:bg-blue-900/10'
                            : 'bg-background',
                    )}
                >
                    <div className="flex items-center gap-4">
                        {selectedCount > 0 ? (
                            <div className="flex animate-in items-center gap-4 fade-in slide-in-from-top-1">
                                <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-400">
                                    <span className="font-bold">
                                        {selectedCount}
                                    </span>
                                    <span className="text-sm font-medium">
                                        seleccionado
                                        {selectedCount > 1 ? 's' : ''}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="ml-2 h-5 w-5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                                        onClick={() => setSelected([])}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="h-4 w-px bg-border" />

                                {canDeleteSelected ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={confirmBulkDelete}
                                        className="h-8 px-3 text-xs font-bold text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                                    >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                        Eliminar Borradores
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-600 dark:border-amber-800 dark:bg-amber-950/30">
                                        <AlertCircle className="h-3 w-3" />
                                        No puedes eliminar movimientos
                                        realizados
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex animate-in items-center gap-4 fade-in slide-in-from-bottom-1">
                                <Button
                                    className="bg-emerald-600 font-medium text-white shadow-sm hover:bg-emerald-700"
                                    onClick={() =>
                                        router.visit('/inventario/ajuste/nuevo')
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Nuevo
                                    Ajuste
                                </Button>
                                <h1 className="text-lg font-semibold text-foreground">
                                    Operaciones de Inventario
                                </h1>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {selectedCount === 0 && (
                            <div className="relative w-64 animate-in fade-in slide-in-from-bottom-1">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar referencia o documento..."
                                    className="h-9 border-muted bg-muted/30 pl-8 focus-visible:ring-1"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>
                        )}
                        {renderPagination()}
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-4 md:p-8 dark:bg-neutral-950">
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-b text-[10px] font-bold tracking-wider text-muted-foreground uppercase hover:bg-transparent">
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
                                    <TableHead>Referencia</TableHead>
                                    <TableHead>De</TableHead>
                                    <TableHead>Para</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Doc. Origen</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-center">
                                        Estado
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adjustments.data.map((adj: any) => (
                                    <TableRow
                                        key={adj.id_adjustment}
                                        className={cn(
                                            'group cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/40',
                                            selected.includes(
                                                adj.id_adjustment,
                                            ) &&
                                                'bg-blue-50/50 dark:bg-blue-900/10',
                                        )}
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
                                        <TableCell className="font-bold tracking-tight whitespace-nowrap text-foreground">
                                            {adj.reference_code}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-muted-foreground uppercase">
                                            {adj.location_source?.name ||
                                                adj.location_origin ||
                                                'Externo'}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-muted-foreground uppercase">
                                            {adj.location_destination?.name ||
                                                adj.location_destination_name ||
                                                'Almacén/Stock'}
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate text-xs font-medium">
                                            {adj.contact_name || '—'}
                                        </TableCell>
                                        <TableCell className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                            {adj.source?.po_code ||
                                                adj.source?.code_sales ||
                                                adj.document_number ||
                                                '—'}
                                        </TableCell>
                                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
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

            {/* ✅ MODAL DE KARDEX AÑADIDO AQUÍ */}
            <KardexExportModal allProducts={products} />
        </AppLayout>
    );
}
