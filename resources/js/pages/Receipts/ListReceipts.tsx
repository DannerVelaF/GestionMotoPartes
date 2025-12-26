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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import receiptsRoute from '@/routes/receipts';
import { Head, router } from '@inertiajs/react';
import { RowSelectionState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Columns, Receipt } from './Columns';

interface PaginatedReceipts {
    data: Receipt[];
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
    receipts: PaginatedReceipts;
    filters: { search?: string; per_page?: string; group_by?: string };
}

const breadcrumbs = [
    { title: 'Comprobantes', href: receiptsRoute.index().url },
];

export default function ListReceipts({ receipts, filters }: Props) {
    // --- ESTADOS ---
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [groupBy, setGroupBy] = useState<string>(filters.group_by || 'none');
    const [perPage, setPerPage] = useState<string | number>(receipts.per_page);
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    // Estado para controlar qué grupos están expandidos (por defecto todos abiertos)
    const [expandedGroups, setExpandedGroups] = useState<
        Record<string, boolean>
    >({});

    // --- EFECTOS ---
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            updateParams({ search: debouncedSearch, page: 1 });
        }
    }, [debouncedSearch]);

    useEffect(() => {
        const currentGroup = filters.group_by || 'none';
        if (groupBy !== currentGroup) {
            updateParams({ group_by: groupBy, page: 1 });
            // Al cambiar agrupación, reseteamos selección
            setRowSelection({});
        }
    }, [groupBy]);

    useEffect(() => {
        if (isEditingPerPage && perPageInputRef.current) {
            perPageInputRef.current.focus();
        }
    }, [isEditingPerPage]);

    // --- FUNCIONES ---
    const updateParams = (newParams: any) => {
        router.get(
            receiptsRoute.index().url,
            {
                search: filters.search,
                per_page: receipts.per_page,
                group_by: filters.group_by,
                ...newParams,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const handleCardClick = (receipt: Receipt) => {
        router.visit(receiptsRoute.show({ receipt: receipt.id_receipt }).url);
    };

    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue > receipts.total) newValue = receipts.total;
        else if (newValue < 1) newValue = 20;
        setPerPage(newValue);
        if (newValue !== receipts.per_page)
            updateParams({ per_page: newValue, page: 1 });
    };

    const handleKeyDownPerPage = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handlePerPageSubmit();
    };

    const confirmBulkDelete = () => {
        if (Object.keys(rowSelection).length > 0) setIsDeleteAlertOpen(true);
    };

    const executeBulkDelete = () => {
        // Obtenemos IDs basados en la selección (sea agrupada o plana)
        // Nota: En modo agrupado, rowSelection puede necesitar lógica extra si usas checkboxes personalizados
        // Para simplificar, asumimos que rowSelection contiene los IDs de recibos directamente

        // Si usas el DataTable estándar, rowSelection tiene indices.
        // Si usamos la vista agrupada manual, gestionaremos IDs directos.

        let selectedIds: number[] = [];

        if (groupBy === 'none') {
            // Lógica DataTable (Indices)
            selectedIds = Object.keys(rowSelection).map(
                (idx) => receipts.data[Number(idx)].id_receipt,
            );
        } else {
            // Lógica Custom (IDs directos)
            selectedIds = Object.keys(rowSelection).map(Number);
        }

        router.delete(receiptsRoute.bulkDestroy().url, {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => {
                setRowSelection({});
                setIsDeleteAlertOpen(false);
            },
        });
    };

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupKey]: prev[groupKey] === undefined ? false : !prev[groupKey], // Toggle
        }));
    };

    const toggleSelectionCustom = (id: number) => {
        setRowSelection((prev) => {
            const newState = { ...prev };
            if (newState[id]) delete newState[id];
            else newState[id] = true;
            return newState;
        });
    };

    // --- AGRUPACIÓN DE DATOS ---
    // --- AGRUPACIÓN DE DATOS ---
    const groupedData = useMemo(() => {
        if (groupBy === 'none') return null;

        const groups: Record<string, { items: Receipt[]; total: number }> = {};

        receipts.data.forEach((receipt) => {
            let key = 'Otros';

            if (groupBy === 'document_type') {
                // CORRECCIÓN AQUÍ: Las llaves deben coincidir con lo que hay en la BD ('factura', 'boleta')
                const mapNames: Record<string, string> = {
                    factura: 'Facturas',
                    boleta: 'Boletas de Venta',
                    // Por si acaso tienes datos viejos en inglés, puedes dejar estos:
                    invoice: 'Facturas',
                    receipt: 'Boletas de Venta',
                };
                // Normalizamos a minúsculas por si acaso
                key = mapNames[receipt.document_type.toLowerCase()] || 'Otros';
            } else if (groupBy === 'supplier') {
                key = receipt.supplier?.company_name || 'Sin Proveedor';
            } else if (groupBy === 'month') {
                const date = new Date(receipt.issue_date);
                // Asegúrate de que la fecha sea válida antes de formatear
                if (!isNaN(date.getTime())) {
                    key = format(date, 'MMMM yyyy', { locale: es });
                    key = key.charAt(0).toUpperCase() + key.slice(1);
                } else {
                    key = 'Fecha inválida';
                }
            }

            if (!groups[key]) groups[key] = { items: [], total: 0 };
            groups[key].items.push(receipt);
            groups[key].total += Number(receipt.total_amount);
        });

        return groups;
    }, [receipts.data, groupBy]);

    const selectedCount = Object.keys(rowSelection).length;
    const hidePaginationControls =
        receipts.total <= receipts.per_page || receipts.total === 0;

    // --- RENDERIZADO DEL CONTENIDO PRINCIPAL ---
    const renderContent = () => {
        // 1. MODO TABLA PLANA (Sin agrupar) -> Usa tu DataTable existente
        if (groupBy === 'none') {
            return (
                <div className="rounded-xl border bg-card shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                    <DataTable
                        columns={Columns}
                        data={receipts.data}
                        onRowClick={handleCardClick}
                        rowSelection={rowSelection}
                        setRowSelection={setRowSelection}
                    />
                </div>
            );
        }

        // 2. MODO AGRUPADO (Estilo Odoo) -> Renderizado manual
        if (!groupedData || Object.keys(groupedData).length === 0) {
            return (
                <div className="p-8 text-center text-muted-foreground">
                    No hay datos para mostrar.
                </div>
            );
        }

        return (
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <Table>
                    {/* Encabezado Global de la Tabla */}
                    <TableHeader className="bg-white">
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>{' '}
                            {/* Checkbox/Espacio */}
                            <TableHead>Fecha</TableHead>
                            <TableHead>Número</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Referencia</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedData).map(
                            ([groupName, { items, total }]) => {
                                const isExpanded =
                                    expandedGroups[groupName] !== false; // Abierto por defecto

                                return (
                                    <div
                                        key={groupName}
                                        style={{ display: 'contents' }}
                                    >
                                        {/* --- FILA DE GRUPO (CABECERA) --- */}
                                        <TableRow
                                            className="cursor-pointer border-b border-muted-foreground/10 bg-muted/50 font-medium hover:bg-muted/70"
                                            onClick={() =>
                                                toggleGroup(groupName)
                                            }
                                        >
                                            <TableCell className="py-2 pl-4">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </TableCell>
                                            <TableCell
                                                colSpan={4}
                                                className="py-2 font-bold text-foreground"
                                            >
                                                {groupName}{' '}
                                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                    ({items.length})
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 text-right font-bold tabular-nums">
                                                S/{' '}
                                                {total.toLocaleString('es-PE', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>

                                        {/* --- FILAS DE DATOS (ITEMS) --- */}
                                        {isExpanded &&
                                            items.map((receipt) => (
                                                <TableRow
                                                    key={receipt.id_receipt}
                                                    className="cursor-pointer border-0 hover:bg-muted/20"
                                                    onClick={() =>
                                                        handleCardClick(receipt)
                                                    }
                                                >
                                                    <TableCell
                                                        className="py-2 pl-4"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Checkbox
                                                            checked={
                                                                !!rowSelection[
                                                                    receipt
                                                                        .id_receipt
                                                                ]
                                                            }
                                                            onCheckedChange={() =>
                                                                toggleSelectionCustom(
                                                                    receipt.id_receipt,
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-2 text-sm">
                                                        {format(
                                                            new Date(
                                                                receipt.issue_date,
                                                            ),
                                                            'dd/MM/yyyy',
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-xs font-bold text-muted-foreground">
                                                                {
                                                                    receipt.receipt_code
                                                                }
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="h-4 w-fit px-1 text-[10px] font-normal"
                                                            >
                                                                {receipt.document_type ===
                                                                'factura'
                                                                    ? 'Factura'
                                                                    : 'Boleta'}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2 text-sm font-medium">
                                                        {
                                                            receipt.supplier
                                                                ?.company_name
                                                        }
                                                    </TableCell>
                                                    <TableCell className="py-2 text-xs text-muted-foreground">
                                                        {receipt.series}-
                                                        {receipt.number}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right text-sm font-bold tabular-nums">
                                                        S/{' '}
                                                        {Number(
                                                            receipt.total_amount,
                                                        ).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        {/* Acciones extra si se requieren */}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </div>
                                );
                            },
                        )}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comprobantes" />

            {/* ALERT DIALOG */}
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán <strong>{selectedCount}</strong>{' '}
                            comprobantes seleccionados permanentemente.
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
                {/* --- TOOLBAR SUPERIOR --- */}
                <div
                    className={`flex items-center justify-between border-b px-6 py-3 transition-colors duration-300 ${selectedCount > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-background'}`}
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
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />{' '}
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // MODO NORMAL (BÚSQUEDA Y FILTROS)
                        <div className="flex w-full animate-in items-center justify-between fade-in slide-in-from-bottom-1">
                            <div className="flex items-center gap-4">
                                <Button
                                    className="bg-blue-700 font-medium text-white shadow-sm hover:bg-blue-800"
                                    onClick={() =>
                                        router.visit(receiptsRoute.create().url)
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Nuevo
                                </Button>
                                <h1 className="text-lg font-semibold text-foreground">
                                    Comprobantes
                                </h1>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Selector Agrupar */}
                                <div className="w-44">
                                    <Select
                                        value={groupBy}
                                        onValueChange={(val) => setGroupBy(val)}
                                    >
                                        <SelectTrigger className="h-9 border-muted bg-muted/30 text-xs font-medium">
                                            <SelectValue placeholder="Agrupar por" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Sin agrupar
                                            </SelectItem>
                                            <SelectItem value="month">
                                                Mes de Emisión
                                            </SelectItem>
                                            <SelectItem value="supplier">
                                                Proveedor
                                            </SelectItem>
                                            <SelectItem value="document_type">
                                                Tipo Documento
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Buscador */}
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

                                {/* Paginación */}
                                <div className="flex items-center gap-2 border-l pl-4 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                                    <span className="flex items-center gap-1">
                                        <span>{receipts.from || 0}</span>-
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
                                                    {receipts.to || 0}
                                                </span>
                                            )}
                                        </div>
                                        / {receipts.total}
                                    </span>
                                    {!hidePaginationControls && (
                                        <div className="ml-2 flex items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    receipts.prev_page_url &&
                                                    router.visit(
                                                        receipts.prev_page_url,
                                                    )
                                                }
                                                disabled={
                                                    !receipts.prev_page_url
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    receipts.next_page_url &&
                                                    router.visit(
                                                        receipts.next_page_url,
                                                    )
                                                }
                                                disabled={
                                                    !receipts.next_page_url
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

                {/* --- TABLA (Contenido) --- */}
                <div className="flex-1 overflow-auto bg-muted/5 p-4">
                    {renderContent()}
                </div>
            </div>
        </AppLayout>
    );
}
