// resources/js/Pages/Sales/ListSales.tsx
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
import salesRoute from '@/routes/sales';
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
    X,
} from 'lucide-react';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Columns, Sale } from './Columns';

interface PaginatedSales {
    data: Sale[];
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
    sales: PaginatedSales;
    filters: { search?: string; per_page?: string; group_by?: string };
}

export default function ListSales({ sales, filters }: Props) {
    // --- ESTADOS ---
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [groupBy, setGroupBy] = useState<string>(filters.group_by || 'none');
    const [perPage, setPerPage] = useState<string | number>(sales.per_page);
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);
    const [expandedGroups, setExpandedGroups] = useState<
        Record<string, boolean>
    >({});

    const selectedCount = Object.keys(rowSelection).length;

    // --- EFECTOS ---
    useEffect(() => {
        if (debouncedSearch !== (filters.search || ''))
            updateParams({ search: debouncedSearch, page: 1 });
    }, [debouncedSearch]);

    useEffect(() => {
        if (groupBy !== (filters.group_by || 'none')) {
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
            salesRoute.index().url,
            {
                search: searchTerm,
                group_by: groupBy,
                per_page: perPage,
                ...newParams,
            },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
    };
    const showNavigation = sales.last_page > 1;
    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue > sales.total) newValue = sales.total;
        else if (newValue < 1) newValue = 20;

        setPerPage(newValue);
        if (newValue !== sales.per_page)
            updateParams({ per_page: newValue, page: 1 });
    };

    const handleKeyDownPerPage = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handlePerPageSubmit();
    };

    const handleCardClick = (sale: Sale) => {
        router.visit(salesRoute.show({ sale: sale.id_sales }).url);
    };

    const toggleSelectionCustom = (id: number) => {
        setRowSelection((prev) => {
            const newState = { ...prev };
            if (newState[id]) delete newState[id];
            else newState[id] = true;
            return newState;
        });
    };

    const groupedData = useMemo(() => {
        if (groupBy === 'none') return null;
        const groups: Record<string, { items: Sale[]; total: number }> = {};

        sales.data.forEach((sale) => {
            let key = 'Otros';
            if (groupBy === 'customer')
                key = sale.receiver_name || 'Sin nombre';
            else if (groupBy === 'document_type') {
                const names: Record<string, string> = {
                    factura: 'Facturas',
                    boleta: 'Boletas',
                    nota_venta: 'Notas de Venta',
                };
                key = names[sale.document_type] || sale.document_type;
            } else if (groupBy === 'month') {
                const date = new Date(sale.date_sales);
                if (!isNaN(date.getTime())) {
                    key = format(date, 'MMMM yyyy', { locale: es });
                    key = key.charAt(0).toUpperCase() + key.slice(1);
                }
            }

            if (!groups[key]) groups[key] = { items: [], total: 0 };
            groups[key].items.push(sale);
            groups[key].total += Number(sale.total || 0);
        });
        return groups;
    }, [sales.data, groupBy]);

    const hidePaginationControls =
        sales.total <= sales.per_page || sales.total === 0;
    useEffect(() => {
        setPerPage(sales.per_page);
    }, [sales.per_page]);
    const renderContent = () => {
        if (groupBy === 'none') {
            return (
                <div className="rounded-lg border bg-card shadow-sm">
                    <DataTable
                        columns={Columns}
                        data={sales.data}
                        onRowClick={handleCardClick}
                        rowSelection={rowSelection}
                        setRowSelection={setRowSelection}
                    />
                </div>
            );
        }

        return (
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <Table>
                    <TableHeader className="bg-white">
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Número</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Referencia</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedData || {}).map(
                            ([groupName, { items, total }]) => {
                                const isExpanded =
                                    expandedGroups[groupName] !== false;
                                return (
                                    <div
                                        key={groupName}
                                        style={{ display: 'contents' }}
                                    >
                                        <TableRow
                                            className="cursor-pointer bg-muted/50 font-medium"
                                            onClick={() =>
                                                setExpandedGroups((p) => ({
                                                    ...p,
                                                    [groupName]: !isExpanded,
                                                }))
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
                                                className="font-bold"
                                            >
                                                {groupName}{' '}
                                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                    ({items.length})
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-blue-700">
                                                S/ {total.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded &&
                                            items.map((sale) => (
                                                <TableRow
                                                    key={sale.id_sales}
                                                    className="cursor-pointer hover:bg-muted/20"
                                                    onClick={() =>
                                                        handleCardClick(sale)
                                                    }
                                                >
                                                    <TableCell
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="py-2 pl-4"
                                                    >
                                                        <Checkbox
                                                            checked={
                                                                !!rowSelection[
                                                                    sale
                                                                        .id_sales
                                                                ]
                                                            }
                                                            onCheckedChange={() =>
                                                                toggleSelectionCustom(
                                                                    sale.id_sales,
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {format(
                                                            new Date(
                                                                sale.date_sales,
                                                            ),
                                                            'dd/MM/yyyy',
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-mono text-xs font-bold text-muted-foreground">
                                                            {sale.code_sales}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium">
                                                        {sale.receiver_name}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {sale.series}-
                                                        {sale.number}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        S/{' '}
                                                        {Number(
                                                            sale.total,
                                                        ).toFixed(2)}
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
        <AppLayout
            breadcrumbs={[{ title: 'Ventas', href: salesRoute.index().url }]}
        >
            <Head title="Ventas" />
            <div className="flex h-full flex-1 flex-col overflow-hidden">
                <div
                    className={`flex items-center justify-between border-b px-6 py-3 transition-colors duration-300 ${selectedCount > 0 ? 'bg-blue-50' : 'bg-background'}`}
                >
                    <div className="flex items-center gap-4">
                        {selectedCount > 0 ? (
                            <div className="flex animate-in items-center gap-2 rounded-md bg-blue-100 px-3 py-1 text-blue-700 fade-in slide-in-from-top-1">
                                <span className="font-bold">
                                    {selectedCount}
                                </span>{' '}
                                seleccionados
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4"
                                    onClick={() => setRowSelection({})}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button
                                    className="bg-blue-700 text-white shadow-sm hover:bg-blue-800"
                                    onClick={() =>
                                        router.visit(salesRoute.create().url)
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Nuevo
                                </Button>
                                <h1 className="text-lg font-semibold">
                                    Ventas
                                </h1>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <Select value={groupBy} onValueChange={setGroupBy}>
                            <SelectTrigger className="h-9 w-44 border-muted bg-muted/30 text-xs">
                                <SelectValue placeholder="Agrupar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    Sin agrupar
                                </SelectItem>
                                <SelectItem value="customer">
                                    Cliente
                                </SelectItem>
                                <SelectItem value="document_type">
                                    Tipo Documento
                                </SelectItem>
                                <SelectItem value="month">Mes</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative w-64">
                            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar venta..."
                                className="h-9 border-muted bg-muted/30 pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* PAGINACIÓN IGUAL A COMPROBANTES */}
                        <div className="flex items-center gap-2 border-l pl-4 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                            <span className="flex items-center gap-1">
                                <span>{sales.from || 0}</span>-
                                <div
                                    className="relative min-w-[1.5rem] text-center"
                                    onClick={() => setIsEditingPerPage(true)}
                                >
                                    {isEditingPerPage ? (
                                        <input
                                            ref={perPageInputRef}
                                            type="number"
                                            className="h-6 w-12 rounded-sm border bg-background text-center text-sm font-bold"
                                            value={perPage}
                                            onChange={(e) =>
                                                setPerPage(e.target.value)
                                            }
                                            onBlur={handlePerPageSubmit}
                                            onKeyDown={handleKeyDownPerPage}
                                        />
                                    ) : (
                                        <span className="cursor-pointer rounded px-1 font-bold hover:bg-muted">
                                            {/* Mostramos el límite actual de la página (sales.to) */}
                                            {sales.to || 0}
                                        </span>
                                    )}
                                </div>
                                / {sales.total}
                            </span>

                            {/* Cambiamos la condición aquí para que se muestren siempre que haya paginación real */}
                            {showNavigation && (
                                <div className="ml-2 flex items-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 disabled:opacity-30"
                                        onClick={() =>
                                            sales.prev_page_url &&
                                            router.visit(sales.prev_page_url)
                                        }
                                        disabled={!sales.prev_page_url}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 disabled:opacity-30"
                                        onClick={() =>
                                            sales.next_page_url &&
                                            router.visit(sales.next_page_url)
                                        }
                                        disabled={!sales.next_page_url}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-muted/5 p-4">
                    {renderContent()}
                </div>
            </div>
        </AppLayout>
    );
}
