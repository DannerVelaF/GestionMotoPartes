import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import receipts from '@/routes/receipts';
import suppliersRoute from '@/routes/suppliers';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { RowSelectionState } from '@tanstack/react-table';
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    Loader2,
    Plus,
    Search,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Columns, Supplier } from './Columns';

// --- MODIFICACIÓN 1: FLOATING ALERT SIEMPRE FIJO (EN LA ESQUINA) ---
function FloatingAlert({
    message,
    type = 'error',
}: {
    message?: string;
    type?: 'error' | 'success';
}) {
    if (!message) return null;
    const isSuccess = type === 'success';

    // Cambiamos la lógica: Siempre 'fixed' en la esquina, sin importar si es error o éxito
    return (
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-lg animate-in fade-in slide-in-from-top-2">
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={`border-2 shadow-2xl ${
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'border-red-500 bg-white text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
                }`}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2 font-bold">
                    {isSuccess ? '¡Éxito!' : 'Error de Importación'}
                </AlertTitle>
                <AlertDescription className="ml-2 max-h-[80vh] overflow-y-auto break-words">
                    {message}
                </AlertDescription>
            </Alert>
        </div>
    );
}

// ... Interfaces (igual que antes) ...
interface PaginatedSuppliers {
    data: Supplier[];
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
    suppliers: PaginatedSuppliers;
    filters: { search?: string; per_page?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Comprobantes', href: receipts.index().url },
    { title: 'Proveedores', href: suppliersRoute.index().url },
];

export default function ListSuppliers({ suppliers, filters }: Props) {
    // ... Estados (igual que antes) ...
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [perPage, setPerPage] = useState<string | number>(suppliers.per_page);
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    // Estados de Importación
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Estados de Alertas
    const { props } = usePage();
    const flashSuccess = (props as any).flash?.success;
    const [importError, setImportError] = useState<string | undefined>(
        undefined,
    );
    const { errors: serverErrors } = usePage().props;
    // Limpiar error automáticamente
    useEffect(() => {
        if (importError) {
            const timer = setTimeout(() => setImportError(undefined), 8000); // 8 segundos
            return () => clearTimeout(timer);
        }
    }, [importError]);

    // ... Efectos y funciones auxiliares (igual que antes) ...
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
    useEffect(() => {
        if (serverErrors.error) {
            setImportError(serverErrors.error as string);
        }
    }, [serverErrors]);
    const updateParams = (newParams: any) => {
        router.get(
            suppliersRoute.index().url,
            {
                search: filters.search,
                per_page: suppliers.per_page,
                ...newParams,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue > suppliers.total) newValue = suppliers.total;
        else if (newValue < 1) newValue = 20;
        setPerPage(newValue);
        if (newValue !== suppliers.per_page) {
            updateParams({ per_page: newValue, page: 1 });
        }
    };

    const handleKeyDownPerPage = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handlePerPageSubmit();
    };

    const handleRowClick = (supplier: Supplier) => {
        router.visit(
            suppliersRoute.show({ supplier: supplier.id_supplier }).url,
        );
    };

    const confirmBulkDelete = () => {
        if (Object.keys(rowSelection).length > 0) setIsDeleteAlertOpen(true);
    };

    const executeBulkDelete = () => {
        const selectedIds = Object.keys(rowSelection)
            .map(Number)
            .map((index) => suppliers.data[index].id_supplier);
        router.delete(suppliersRoute.bulkDestroy().url, {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => {
                setRowSelection({});
                setIsDeleteAlertOpen(false);
            },
            onError: (errors) => console.error(errors),
        });
    };

    const handleDownloadTemplate = () => {
        window.location.href = suppliersRoute.template().url;
    };

    const handleImportSubmit = () => {
        if (!importFile) return;

        setIsImporting(true);
        setImportError(undefined);

        router.post(
            suppliersRoute.import().url,
            { file: importFile },
            {
                forceFormData: true,
                onSuccess: () => {
                    setIsImportOpen(false);
                    setImportFile(null);
                    setIsImporting(false);
                },
                onError: (errors) => {
                    setIsImporting(false);
                    if (errors.error) {
                        setImportError(errors.error);
                    } else if (errors.file) {
                        setImportError(errors.file);
                    } else {
                        setImportError(
                            'Ocurrió un error desconocido al importar.',
                        );
                    }
                    // Opcional: Cerrar el modal para ver mejor la alerta flotante
                    // setIsImportOpen(false);
                },
            },
        );
    };

    const selectedCount = Object.keys(rowSelection).length;
    const hidePaginationControls =
        suppliers.total <= suppliers.per_page || suppliers.total === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Proveedores" />

            {flashSuccess && (
                <FloatingAlert message={flashSuccess} type="success" />
            )}
            {importError && (
                <FloatingAlert message={importError} type="error" />
            )}

            {/* --- MODAL IMPORTACIÓN --- */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                            Importar Proveedores
                        </DialogTitle>
                        <DialogDescription>
                            Sube un archivo Excel (.xlsx) con los datos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <FileSpreadsheet className="h-5 w-5 text-green-700 dark:text-green-400" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">
                                        Plantilla
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Formato .xlsx
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadTemplate}
                                className="border-dashed"
                            >
                                <Download className="mr-2 h-3 w-3" /> Descargar
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="file">Seleccionar Archivo</Label>
                            {/* Eliminamos el 'relative' y el FloatingAlert de aquí dentro */}
                            <Input
                                id="file"
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) =>
                                    setImportFile(e.target.files?.[0] || null)
                                }
                                className={`cursor-pointer ${importError ? 'border-red-500' : ''}`}
                            />
                            {/* Pequeño texto de ayuda si hay error, opcional */}
                            {importError && (
                                <p className="text-[10px] text-red-500">
                                    Revisa la alerta en la esquina superior.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2 sm:justify-between">
                        <Button
                            type="button"
                            onClick={handleImportSubmit}
                            disabled={!importFile || isImporting}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importando...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Subir
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- RESTO DE LA UI (ALERTAS, TABLA) --- */}
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
                            <strong>{selectedCount}</strong> registros.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeBulkDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex h-full flex-1 flex-col overflow-hidden">
                {/* ... (Todo el contenido del toolbar y la tabla sigue igual) ... */}
                <div
                    className={`flex items-center justify-between border-b px-6 py-3 transition-colors duration-300 ${selectedCount > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-background'}`}
                >
                    {selectedCount > 0 ? (
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
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />{' '}
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full animate-in items-center justify-between fade-in slide-in-from-bottom-1">
                            <div className="flex items-center gap-4">
                                <Button
                                    className="bg-blue-700 font-medium text-white shadow-sm hover:bg-blue-800"
                                    onClick={() =>
                                        router.visit(
                                            suppliersRoute.create().url,
                                        )
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Nuevo
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsImportOpen(true)}
                                >
                                    <Upload className="mr-2 h-4 w-4" /> Importar
                                </Button>
                                <h1 className="text-lg font-semibold text-foreground">
                                    Proveedores
                                </h1>
                            </div>
                            <div className="flex items-center gap-4">
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
                                <div className="flex items-center gap-2 border-l pl-4">
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                                        <span>{suppliers.from || 0}</span>-
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
                                                    className="h-6 w-12 rounded-sm border bg-background text-center text-sm font-bold"
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
                                                <span className="cursor-pointer rounded px-1 font-bold hover:bg-muted">
                                                    {suppliers.to || 0}
                                                </span>
                                            )}
                                        </div>
                                        / {suppliers.total}
                                    </span>
                                    {!hidePaginationControls && (
                                        <div className="ml-2 flex items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    suppliers.prev_page_url &&
                                                    router.visit(
                                                        suppliers.prev_page_url,
                                                    )
                                                }
                                                disabled={
                                                    !suppliers.prev_page_url
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    suppliers.next_page_url &&
                                                    router.visit(
                                                        suppliers.next_page_url,
                                                    )
                                                }
                                                disabled={
                                                    !suppliers.next_page_url
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

                <div className="flex-1 overflow-auto bg-muted/5 p-4 dark:bg-neutral-950/20">
                    <div className="rounded-xl border bg-card shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                        <DataTable
                            columns={Columns}
                            data={suppliers.data}
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
