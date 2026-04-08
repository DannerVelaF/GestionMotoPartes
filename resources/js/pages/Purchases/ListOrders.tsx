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
import { cn } from '@/lib/utils';
import { Head, router, usePage } from '@inertiajs/react';
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
import React, {
    KeyboardEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useDebounce } from 'use-debounce';
import { Columns, PurchaseOrder } from './Columns';
import { usePermission } from '@/hooks/usePermission';
import { FloatingAlert } from '@/components/FloatingAlert';

interface PaginatedOrders {
    data: PurchaseOrder[];
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
    orders: PaginatedOrders;
    filters: { search?: string; per_page?: string; group_by?: string };
}

const breadcrumbs = [{ title: 'Órdenes de Compra', href: '/compras/ordenes' }];

export default function ListOrders({ orders, filters }: Props) {
    const { hasPermission } = usePermission();

    // --- ESTADOS ---
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [groupBy, setGroupBy] = useState<string>(filters.group_by || 'none');
    const [perPage, setPerPage] = useState<string | number>(orders.per_page);
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

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
            '/compras/ordenes',
            {
                search: filters.search,
                per_page: orders.per_page,
                group_by: filters.group_by,
                ...newParams,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const handleCardClick = (order: PurchaseOrder) => {
        router.visit(`/compras/ordenes/${order.id_purchase_order}`);
    };

    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue > orders.total) newValue = orders.total;
        else if (newValue < 1) newValue = 20;
        setPerPage(newValue);
        if (newValue !== orders.per_page)
            updateParams({ per_page: newValue, page: 1 });
    };
    const { props: pageProps } = usePage<any>(); // Para capturar los flash mensajes de Laravel
    const [formError, setFormError] = useState<string | null>(null);
    const handleKeyDownPerPage = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handlePerPageSubmit();
    };

    const confirmBulkDelete = () => {
        if (Object.keys(rowSelection).length > 0) setIsDeleteAlertOpen(true);
    };

    const executeBulkDelete = () => {
        // Obtenemos los IDs reales de la selección
        const selectedIds = Object.keys(rowSelection).map((key) => {
            // Si no hay agrupación, la llave es el índice del array, si hay, es el ID
            return groupBy === 'none'
                ? orders.data[Number(key)].id_purchase_order
                : Number(key);
        });

        if (selectedIds.length === 0) return;

        setFormError(null); // Limpiamos errores previos

        router.delete('/compras/ordenes/bulk-delete', {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => {
                setRowSelection({});
                // El mensaje de éxito vendrá por flash session de Laravel
            },
            onError: (errs) => {
                // Capturamos el error de validación de estados que pusimos en el controlador
                if (errs.error) setFormError(errs.error as string);
            },
        });
    };

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupKey]: prev[groupKey] === undefined ? false : !prev[groupKey],
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
            const groupedData = useMemo(() => {
            if (groupBy === 'none') return null;

            const groups: Record<
                string,
                { items: PurchaseOrder[]; total: number }
            > = {};

            orders.data.forEach((order) => {
                let key = 'Otros';

                if (groupBy === 'status') {
                    const mapNames: Record<string, string> = {
                        draft: 'Borradores',
                        sent: 'Enviadas (Pendientes)',
                        approved: 'Aprobadas',
                        received: 'Recibidas (Completadas)',
                        cancelled: 'Canceladas',
                    };
                    key = mapNames[order.status] || 'Otros';
                } else if (groupBy === 'supplier') {
                    key = order.supplier?.company_name || 'Sin Proveedor';
                } else if (groupBy === 'month') {
                    const date = new Date(order.issue_date);
                    if (!isNaN(date.getTime())) {
                        key = format(date, 'MMMM yyyy', { locale: es });
                        key = key.charAt(0).toUpperCase() + key.slice(1);
                    } else {
                        key = 'Fecha inválida';
                    }
                }

                if (!groups[key]) groups[key] = { items: [], total: 0 };
                groups[key].items.push(order);
                groups[key].total += Number(order.total_amount); // NOTA: Aquí asume que todo es la misma moneda, para algo exacto tendrías que separar PEN de USD.
            });

            return groups;
        }, [orders.data, groupBy]);

        const selectedCount = Object.keys(rowSelection).length;
        const hidePaginationControls =
            orders.total <= orders.per_page || orders.total === 0;

        const statusConfig: Record<
            string,
            { label: string; class: string }
        > = {
            draft: {
                label: 'Borrador',
                class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            },
            sent: {
                label: 'Enviado / Pdte',
                class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            },
            approved: {
                label: 'Aprobado',
                class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
            },
            received: {
                label: 'Recibido',
                class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
            },
            cancelled: {
                label: 'Cancelado',
                class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
            },
        };

        // --- RENDERIZADO DEL CONTENIDO PRINCIPAL ---
        const renderContent = () => {
            if (groupBy === 'none') {
                return (
                    <div className="rounded-xl border bg-card shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                        <DataTable
                            columns={Columns}
                            data={orders.data}
                            onRowClick={handleCardClick}
                            rowSelection={rowSelection}
                            setRowSelection={setRowSelection}
                        />
                    </div>
                );
            }

            if (!groupedData || Object.keys(groupedData).length === 0) {
                return (
                    <div className="p-8 text-center text-muted-foreground">
                        No hay datos para mostrar.
                    </div>
                );
            }

            return (
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                    <Table>
                        <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="text-xs font-bold tracking-wider uppercase">
                                    Código OC
                                </TableHead>
                                <TableHead className="text-xs font-bold tracking-wider uppercase">
                                    Proveedor
                                </TableHead>
                                <TableHead className="text-xs font-bold tracking-wider uppercase">
                                    Estado
                                </TableHead>
                                <TableHead className="text-right text-xs font-bold tracking-wider uppercase">
                                    Total Ref.
                                </TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(groupedData).map(
                                ([groupName, { items, total }]) => {
                                    const isExpanded =
                                        expandedGroups[groupName] !== false;

                                    return (
                                        <React.Fragment key={groupName}>
                                            <TableRow
                                                className="cursor-pointer border-b bg-muted/30 font-medium transition-colors hover:bg-muted/50 dark:border-neutral-800 dark:bg-neutral-800/30 dark:hover:bg-neutral-800/50"
                                                onClick={() =>
                                                    toggleGroup(groupName)
                                                }
                                            >
                                                <TableCell className="py-3 pl-4">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    colSpan={3}
                                                    className="font-bold text-foreground"
                                                >
                                                    {groupName}{' '}
                                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                        ({items.length} órdenes)
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-black text-emerald-700 tabular-nums dark:text-emerald-400">
                                                    Total:{' '}
                                                    {total.toLocaleString('es-PE', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>

                                            {isExpanded &&
                                                items.map((order) => {
                                                    const config =
                                                        statusConfig[order.status] ||
                                                        statusConfig.draft;

                                                    return (
                                                        <TableRow
                                                            key={
                                                                order.id_purchase_order
                                                            }
                                                            className="cursor-pointer border-b last:border-0 hover:bg-muted/40 dark:border-neutral-800/50 dark:hover:bg-neutral-800/20"
                                                            onClick={() =>
                                                                handleCardClick(
                                                                    order,
                                                                )
                                                            }
                                                        >
                                                            <TableCell
                                                                className="py-3 pl-4"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <Checkbox
                                                                    checked={
                                                                        !!rowSelection[
                                                                            order
                                                                                .id_purchase_order
                                                                        ]
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        toggleSelectionCustom(
                                                                            order.id_purchase_order,
                                                                        )
                                                                    }
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="w-fit rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold text-muted-foreground dark:bg-neutral-800">
                                                                        {
                                                                            order.po_code
                                                                        }
                                                                    </span>
                                                                    <span className="text-[10px] font-medium tracking-tighter text-muted-foreground">
                                                                        {format(
                                                                            new Date(
                                                                                order.issue_date,
                                                                            ),
                                                                            'dd/MM/yyyy',
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-sm font-medium text-foreground">
                                                                {
                                                                    order.supplier
                                                                        ?.company_name
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'border-transparent text-[9px] tracking-wider uppercase',
                                                                        config.class,
                                                                    )}
                                                                >
                                                                    {config.label}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-foreground tabular-nums">
                                                                {order.currency ===
                                                                'USD'
                                                                    ? '$'
                                                                    : 'S/'}{' '}
                                                                {Number(
                                                                    order.total_amount,
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell></TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </React.Fragment>
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
            <Head title="Órdenes de Compra" />
            <FloatingAlert
                message={formError || (pageProps.flash?.error as string)}
                type="error"
                onClose={() => setFormError(null)}
            />
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán <strong>{selectedCount}</strong>{' '}
                            órdenes seleccionadas. (Las órdenes ya recibidas no
                            pueden eliminarse porque ya afectaron Kardex).
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
                <div
                    className={cn(
                        'flex items-center justify-between border-b px-6 py-3 transition-colors duration-300',
                        selectedCount > 0
                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                            : 'bg-background',
                    )}
                >
                    {selectedCount > 0 ? (
                        <div className="flex w-full animate-in items-center justify-between fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 rounded-md bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                                    <span className="font-bold">
                                        {selectedCount}
                                    </span>
                                    <span className="text-sm font-medium">
                                        seleccionada
                                        {selectedCount > 1 ? 's' : ''}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="ml-2 h-4 w-4 rounded-full hover:bg-emerald-200"
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
                                {hasPermission('purchase.create') && (
                                    <>
                                        <Button
                                            className="bg-emerald-600 font-medium text-white shadow-sm hover:bg-emerald-700"
                                            onClick={() =>
                                                router.visit(
                                                    '/compras/ordenes/crear',
                                                )
                                            }
                                        >
                                            <Plus className="mr-2 h-4 w-4" />{' '}
                                            Nueva Orden
                                        </Button>
                                    </>
                                )}

                                <h1 className="text-lg font-semibold text-foreground">
                                    Órdenes de Compra
                                </h1>
                            </div>

                            <div className="flex items-center gap-4">
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
                                            <SelectItem value="status">
                                                Estado de Orden
                                            </SelectItem>
                                            <SelectItem value="month">
                                                Mes de Emisión
                                            </SelectItem>
                                            <SelectItem value="supplier">
                                                Proveedor
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="relative w-64">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Buscar código o proveedor..."
                                        className="h-9 border-muted bg-muted/30 pl-8 focus-visible:ring-1"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="flex items-center gap-2 border-l pl-4 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                                    <span className="flex items-center gap-1">
                                        <span>{orders.from || 0}</span>-
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
                                                    {orders.to || 0}
                                                </span>
                                            )}
                                        </div>
                                        / {orders.total}
                                    </span>
                                    {!hidePaginationControls && (
                                        <div className="ml-2 flex items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    orders.prev_page_url &&
                                                    router.visit(
                                                        orders.prev_page_url,
                                                    )
                                                }
                                                disabled={!orders.prev_page_url}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 disabled:opacity-30"
                                                onClick={() =>
                                                    orders.next_page_url &&
                                                    router.visit(
                                                        orders.next_page_url,
                                                    )
                                                }
                                                disabled={!orders.next_page_url}
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
                    {renderContent()}
                </div>
            </div>
        </AppLayout>
    );
}
