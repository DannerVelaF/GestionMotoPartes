import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Importar Shadcn Alert Dialog
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/pages/Products/Categories/data-table';
import categoriesRoute from '@/routes/product-categories';
import productsRoute from '@/routes/products'; // Wayfinder
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { RowSelectionState } from '@tanstack/react-table';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Printer,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Category, Columns } from './Columns';

// ... (Interfaces PaginatedCategories y Props se mantienen igual) ...
interface PaginatedCategories {
    data: Category[];
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
    categories: PaginatedCategories;
    filters: { search?: string; per_page?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Productos', href: productsRoute.index().url },
    { title: 'Categorías', href: categoriesRoute.index().url },
];

export default function ListCategories({ categories, filters }: Props) {
    // ... (Estados existentes: searchTerm, perPage, rowSelection, etc.) ...
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [perPage, setPerPage] = useState<string | number>(
        categories.per_page,
    );
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);

    // NUEVO ESTADO: Para controlar la apertura del diálogo de confirmación
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    // ... (useEffect y updateParams se mantienen igual) ...
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
            categoriesRoute.index().url,
            {
                search: filters.search,
                per_page: categories.per_page,
                ...newParams,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const handlePerPageSubmit = () => {
        /* ... lógica igual ... */
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue > categories.total) newValue = categories.total;
        else if (newValue < 1) newValue = 20;
        setPerPage(newValue);
        if (newValue !== categories.per_page)
            updateParams({ per_page: newValue, page: 1 });
    };

    const handleKeyDownPerPage = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handlePerPageSubmit();
    };

    const handleRowClick = (category: Category) => {
        router.visit(
            categoriesRoute.show({ category: category.id_product_category })
                .url,
        );
    };

    // --- FUNCIÓN MODIFICADA: Solo abre el diálogo ---
    const confirmBulkDelete = () => {
        const selectedIndices = Object.keys(rowSelection);
        if (selectedIndices.length > 0) {
            setIsDeleteAlertOpen(true);
        }
    };

    // --- NUEVA FUNCIÓN: Ejecuta el borrado real ---
    const executeBulkDelete = () => {
        const selectedIndices = Object.keys(rowSelection).map(Number);
        const selectedIds = selectedIndices.map(
            (index) => categories.data[index].id_product_category,
        );

        router.delete(categoriesRoute.bulkDestroy().url, {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => {
                setRowSelection({});
                setIsDeleteAlertOpen(false); // Cerramos el diálogo
            },
            onError: (errors) => {
                console.error('Error al eliminar:', errors);
                setIsDeleteAlertOpen(false);
            },
        });
    };

    const selectedCount = Object.keys(rowSelection).length;
    const hidePaginationControls =
        categories.total <= categories.per_page || categories.total === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categorías" />

            {/* --- COMPONENTE ALERT DIALOG --- */}
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Estás absolutamente seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará{' '}
                            <strong>{selectedCount}</strong> registros
                            seleccionados permanentemente. Esta acción no se
                            puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeBulkDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Sí, eliminar registros
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex h-full flex-1 flex-col overflow-hidden">
                <div
                    className={`flex items-center justify-between border-b px-6 py-3 transition-colors duration-300 ${selectedCount > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-background'}`}
                >
                    {selectedCount > 0 ? (
                        <div className="flex w-full animate-in items-center justify-between fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 rounded-md bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
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
                                        className="ml-2 h-4 w-4 rounded-full hover:bg-blue-200"
                                        onClick={() => setRowSelection({})}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="mx-2 h-6 w-px bg-gray-300" />

                                {/* BOTÓN AHORA LLAMA A confirmBulkDelete */}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={confirmBulkDelete}
                                >
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                    Eliminar
                                </Button>

                                
                            </div>
                        </div>
                    ) : (
                        // ... (Renderizado normal de barra de búsqueda y paginación se mantiene igual) ...
                        <div className="flex w-full animate-in items-center justify-between fade-in slide-in-from-bottom-1">
                            {/* ... Código existente de barra normal ... */}
                            <div className="flex items-center gap-4">
                                {/* ... Boton Nuevo y Título ... */}
                                <Button
                                    className="bg-blue-700 font-medium text-white shadow-sm hover:bg-blue-800"
                                    onClick={() =>
                                        router.visit(
                                            categoriesRoute.create().url,
                                        )
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo
                                </Button>
                                <h1 className="text-lg font-semibold text-foreground">
                                    Categorías
                                </h1>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* ... Search e Input ... */}
                                <div className="relative w-64">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Buscar..."
                                        className="h-9 border-muted bg-muted/30 pl-8 focus-visible:ring-1"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                                {/* ... Paginación Editable ... */}
                                <div className="flex items-center gap-2 border-l pl-4">
                                    {/* ... Lógica de paginación existente ... */}
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                                        <span>{categories.from || 0}</span>
                                        <span>-</span>
                                        <div
                                            className="relative min-w-[1.5rem] text-center"
                                            onClick={() =>
                                                setIsEditingPerPage(true)
                                            }
                                        >
                                            {isEditingPerPage ? (
                                                <input
                                                    ref={perPageInputRef}
                                                    type="number"
                                                    className="h-6 w-12 [appearance:textfield] rounded-sm border border-primary bg-background p-0 text-center text-sm font-bold focus:ring-1 focus:ring-primary focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    value={perPage}
                                                    onChange={(e) =>
                                                        setPerPage(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onBlur={handlePerPageSubmit}
                                                    onKeyDown={
                                                        handleKeyDownPerPage
                                                    }
                                                />
                                            ) : (
                                                <span
                                                    className="cursor-pointer rounded px-1 font-bold text-foreground transition-colors hover:bg-muted"
                                                    title="Click para editar cantidad"
                                                >
                                                    {categories.to || 0}
                                                </span>
                                            )}
                                        </div>
                                        <span>/ {categories.total}</span>
                                    </span>
                                    {!hidePaginationControls && (
                                        <div className="ml-2 flex items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    categories.prev_page_url &&
                                                    router.visit(
                                                        categories.prev_page_url,
                                                    )
                                                }
                                                disabled={
                                                    !categories.prev_page_url
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    categories.next_page_url &&
                                                    router.visit(
                                                        categories.next_page_url,
                                                    )
                                                }
                                                disabled={
                                                    !categories.next_page_url
                                                }
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-4">
                    <div className="rounded-lg border bg-card shadow-sm">
                        <DataTable
                            columns={Columns}
                            data={categories.data}
                            onRowClick={handleRowClick}
                            rowSelection={rowSelection}
                            setRowSelection={setRowSelection}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
