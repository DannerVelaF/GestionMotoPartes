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
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
// Asegúrate de que esta ruta apunte a tu archivo de rutas de métodos de pago
import salesRoute from '@/routes/sales';
import paymentMethodsRoute from '@/routes/sales/methodPayments';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { RowSelectionState } from '@tanstack/react-table';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Columns, MethodPayment } from './Columns';

// --- INTERFACES ---
interface PaginatedMethods {
    data: MethodPayment[];
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
    methods: PaginatedMethods;
    filters: { search?: string; per_page?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ventas', href: salesRoute.index().url },
    { title: 'Métodos de Pago', href: paymentMethodsRoute.index().url },
];

export default function ListMethods({ methods, filters }: Props) {
    // --- ESTADOS ---
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Paginación Editable
    const [perPage, setPerPage] = useState<string | number>(methods.per_page);
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);

    // Dialogo de Eliminación
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    // --- EFECTOS ---
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

    // --- FUNCIONES AUXILIARES ---
    const updateParams = (newParams: any) => {
        router.get(
            paymentMethodsRoute.index().url,
            {
                search: filters.search,
                per_page: methods.per_page,
                ...newParams,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    // Lógica del input "Por página"
    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);

        if (newValue > methods.total) newValue = methods.total;
        else if (newValue < 1) newValue = 20;

        setPerPage(newValue);

        if (newValue !== methods.per_page) {
            updateParams({ per_page: newValue, page: 1 });
        }
    };

    const handleKeyDownPerPage = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handlePerPageSubmit();
    };

    // Navegación a Editar
    const handleRowClick = (method: MethodPayment) => {
        // Asegúrate de que tu ruta show espera el parámetro correcto (ej: { methodPayment: id })
        router.visit(
            paymentMethodsRoute.show({
                methodPayment: method.id_method_payment,
            }).url,
        );
    };

    // Confirmar Eliminación Masiva
    const confirmBulkDelete = () => {
        const selectedIndices = Object.keys(rowSelection);
        if (selectedIndices.length > 0) {
            setIsDeleteAlertOpen(true);
        }
    };

    // Ejecutar Eliminación Masiva
    const executeBulkDelete = () => {
        const selectedIndices = Object.keys(rowSelection).map(Number);
        const selectedIds = selectedIndices.map(
            (index) => methods.data[index].id_method_payment,
        );

        router.delete(paymentMethodsRoute.bulkDestroy().url, {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => {
                setRowSelection({});
                setIsDeleteAlertOpen(false);
            },
            onError: (errors) => {
                console.error('Error al eliminar:', errors);
                setIsDeleteAlertOpen(false);
            },
        });
    };

    const selectedCount = Object.keys(rowSelection).length;
    const hidePaginationControls =
        methods.total <= methods.per_page || methods.total === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Métodos de Pago" />

            {/* DIÁLOGO DE CONFIRMACIÓN */}
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
                            <strong>{selectedCount}</strong> métodos de pago
                            seleccionados permanentemente.
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
                {/* BARRA SUPERIOR DINÁMICA */}
                <div
                    className={`flex items-center justify-between border-b px-6 py-3 transition-colors duration-300 ${
                        selectedCount > 0
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'bg-background'
                    }`}
                >
                    {selectedCount > 0 ? (
                        // MODO SELECCIÓN ACTIVADO
                        <div className="flex w-full animate-in items-center justify-between fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 rounded-md bg-purple-100 px-3 py-1 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
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
                                        className="ml-2 h-4 w-4 rounded-full hover:bg-purple-200"
                                        onClick={() => setRowSelection({})}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="mx-2 h-6 w-px bg-gray-300" />
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
                        // MODO NORMAL (BÚSQUEDA Y NUEVO)
                        <div className="flex w-full animate-in items-center justify-between fade-in slide-in-from-bottom-1">
                            <div className="flex items-center gap-4">
                                <Button
                                    className="bg-blue-700 font-medium text-white shadow-sm hover:bg-blue-800"
                                    onClick={() =>
                                        router.visit(
                                            paymentMethodsRoute.create().url,
                                        )
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo
                                </Button>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                                        Métodos de Pago
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative w-64">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Buscar método..."
                                        className="h-9 border-muted bg-muted/30 pl-8 focus-visible:ring-1"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>

                                {/* Paginación Estilo Odoo */}
                                <div className="flex items-center gap-2 border-l pl-4">
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                                        <span>{methods.from || 0}</span>
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
                                                    {methods.to || 0}
                                                </span>
                                            )}
                                        </div>
                                        <span>/ {methods.total}</span>
                                    </span>

                                    {!hidePaginationControls && (
                                        <div className="ml-2 flex items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    methods.prev_page_url &&
                                                    router.visit(
                                                        methods.prev_page_url,
                                                    )
                                                }
                                                disabled={
                                                    !methods.prev_page_url
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    methods.next_page_url &&
                                                    router.visit(
                                                        methods.next_page_url,
                                                    )
                                                }
                                                disabled={
                                                    !methods.next_page_url
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
                            data={methods.data}
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
