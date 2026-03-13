// resources/js/Pages/Inventory/ListInventory.tsx
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { KardexExportModal } from '@/pages/Inventory/Reports/KardexExportModal';
import inventoryRoutes from '@/routes/inventory';
import { Head, router } from '@inertiajs/react';
import { RowSelectionState } from '@tanstack/react-table';
import {
    ChevronLeft,
    ChevronRight,
    FileDown,
    Package,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { InventoryColumns, InventoryItem } from './Columns';

interface PaginatedInventory {
    data: InventoryItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    inventory: PaginatedInventory;
    filters: { search?: string; per_page?: string };
}

export default function ListInventory({ inventory, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [perPage, setPerPage] = useState<string | number>(inventory.per_page);
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [selectAllGlobal, setSelectAllGlobal] = useState(false);

    const selectedCount = Object.keys(rowSelection).length;

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            updateParams({ search: debouncedSearch, page: 1 });
        }
    }, [debouncedSearch]);

    useEffect(() => {
        if (selectedCount === 0) setSelectAllGlobal(false);
    }, [selectedCount]);

    useEffect(() => {
        if (isEditingPerPage && perPageInputRef.current) {
            perPageInputRef.current.focus();
        }
    }, [isEditingPerPage]);

    const updateParams = (newParams: any) => {
        router.get(
            inventoryRoutes.index().url,
            { search: searchTerm, per_page: perPage, ...newParams },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const handleExport = () => {
        if (selectAllGlobal) {
            const params = new URLSearchParams();
            params.append('all', 'true');
            if (searchTerm) params.append('search', searchTerm);
            window.open(`${inventoryRoutes.export().url}?${params.toString()}`);
            return;
        }

        const selectedIds = Object.keys(rowSelection).map(
            (index) => inventory.data[Number(index)].id_product,
        );
        const params = new URLSearchParams();
        selectedIds.forEach((id) => params.append('ids[]', id.toString()));
        window.open(`${inventoryRoutes.export().url}?${params.toString()}`);
    };

    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue > inventory.total) newValue = inventory.total;
        else if (newValue < 1) newValue = 20;
        setPerPage(newValue);
        if (newValue !== inventory.per_page)
            updateParams({ per_page: newValue, page: 1 });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Inventario Actual', href: '#' }]}>
            <Head title="Stock de Almacén" />

            {/* Contenedor principal con fondo adaptable */}
            <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
                {/* --- TOOLBAR SUPERIOR --- */}
                <div className="flex items-center justify-between border-b border-border bg-background px-6 py-3 transition-colors">
                    <div className="flex items-center gap-4">
                        {/* Icono con fondo azul suave en light, azul oscuro transparente en dark */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <Package className="h-6 w-6" />
                        </div>
                        <h1 className="text-lg font-semibold text-foreground">
                            Inventario / Stock
                        </h1>

                        {/* INDICADOR DE CONTEO LOCAL */}
                        {selectedCount > 0 && (
                            <div className="flex animate-in items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 fade-in slide-in-from-left-2 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                                <span className="text-sm font-bold">
                                    {selectAllGlobal
                                        ? inventory.total
                                        : selectedCount}{' '}
                                    seleccionados
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 hover:bg-blue-200/50 dark:hover:bg-blue-800/50"
                                    onClick={() => {
                                        setRowSelection({});
                                        setSelectAllGlobal(false);
                                    }}
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
                                placeholder="Buscar..."
                                className="h-9 bg-muted/30 pl-8 dark:bg-muted/10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* ✅ NUEVO BOTÓN: Ajuste Manual */}
                        <Button
                            variant="default"
                            className="h-9 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600"
                            onClick={() => router.visit('/inventario/ajuste')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Ajuste Manual
                        </Button>

                        <Button
                            variant={selectedCount > 0 ? 'default' : 'outline'}
                            className={cn(
                                'h-9 transition-all',
                                selectedCount > 0
                                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:text-white' // Botón primario sólido
                                    : 'border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30', // Botón outline adaptable
                            )}
                            disabled={selectedCount === 0}
                            onClick={handleExport}
                        >
                            <FileDown className="mr-2 h-4 w-4" />
                            {selectedCount > 0
                                ? `Exportar (${selectAllGlobal ? inventory.total : selectedCount})`
                                : 'Exportar'}
                        </Button>

                        {/* PAGINACIÓN */}
                        <div className="flex items-center gap-2 border-l border-border pl-4 text-sm text-muted-foreground tabular-nums">
                            <span>
                                {inventory.from || 0}-
                                <span
                                    className="cursor-pointer rounded px-1 font-bold hover:bg-muted"
                                    onClick={() => setIsEditingPerPage(true)}
                                >
                                    {isEditingPerPage ? (
                                        <input
                                            ref={perPageInputRef}
                                            type="number"
                                            className="h-5 w-10 rounded border border-input bg-background text-center text-foreground"
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
                                        inventory.to || 0
                                    )}
                                </span>
                                / {inventory.total}
                            </span>
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 disabled:opacity-30"
                                    onClick={() =>
                                        updateParams({
                                            page: inventory.current_page - 1,
                                        })
                                    }
                                    disabled={inventory.current_page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 disabled:opacity-30"
                                    onClick={() =>
                                        updateParams({
                                            page: inventory.current_page + 1,
                                        })
                                    }
                                    disabled={
                                        inventory.current_page >=
                                        inventory.last_page
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-4 dark:bg-background">
                    {selectedCount === inventory.data.length &&
                        inventory.total > inventory.data.length && (
                            <div className="mb-4 animate-in rounded-md bg-blue-600 p-2 text-center text-xs text-white shadow-sm slide-in-from-top-1 dark:bg-blue-700">
                                {!selectAllGlobal ? (
                                    <p>
                                        Has seleccionado los{' '}
                                        {inventory.data.length} productos de
                                        esta página.{' '}
                                        <button
                                            onClick={() =>
                                                setSelectAllGlobal(true)
                                            }
                                            className="ml-1 font-bold underline hover:text-blue-200"
                                        >
                                            Seleccionar los {inventory.total}{' '}
                                            productos del inventario
                                        </button>
                                    </p>
                                ) : (
                                    <p>
                                        Están seleccionados los{' '}
                                        <strong>{inventory.total}</strong>{' '}
                                        productos del inventario (incluyendo
                                        todas las páginas).{' '}
                                        <button
                                            onClick={() => {
                                                setRowSelection({});
                                                setSelectAllGlobal(false);
                                            }}
                                            className="ml-1 font-bold underline hover:text-blue-200"
                                        >
                                            Desmarcar todo
                                        </button>
                                    </p>
                                )}
                            </div>
                        )}

                    <div className="rounded-xl border border-border bg-card shadow-sm transition-colors">
                        <DataTable
                            columns={InventoryColumns}
                            data={inventory.data}
                            rowSelection={rowSelection}
                            setRowSelection={setRowSelection}
                        />
                    </div>
                </div>
            </div>
            <KardexExportModal allProducts={inventory.data} />
        </AppLayout>
    );
}
