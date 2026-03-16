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
import receiptsRoute from '@/routes/receipts';
import { Head, router } from '@inertiajs/react';
import { RowSelectionState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Link as LinkIcon,
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

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
        let selectedIds: number[] = [];
        if (groupBy === 'none') {
            selectedIds = Object.keys(rowSelection).map(
                (idx) => receipts.data[Number(idx)].id_receipt,
            );
        } else {
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
        const groups: Record<string, { items: Receipt[]; total: number }> = {};

        receipts.data.forEach((receipt) => {
            let key = 'Otros';
            if (groupBy === 'document_type') {
                const mapNames: Record<string, string> = {
                    factura: 'Facturas',
                    boleta: 'Boletas de Venta',
                    invoice: 'Facturas',
                    receipt: 'Boletas de Venta',
                    nota_credito: 'Notas de Crédito',
                };
                key = mapNames[receipt.document_type.toLowerCase()] || 'Otros';
            } else if (groupBy === 'supplier') {
                key = receipt.supplier?.company_name || 'Sin Proveedor';
            } else if (groupBy === 'month') {
                const date = new Date(receipt.issue_date);
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
    const hidePaginationControls = receipts.total <= receipts.per_page || receipts.total === 0;

    // --- RENDERIZADO DEL CONTENIDO PRINCIPAL ---
    const renderContent = () => {
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
                            <TableHead className="text-xs font-bold tracking-wider uppercase">Fecha</TableHead>
                            <TableHead className="text-xs font-bold tracking-wider uppercase">Documento</TableHead>
                            <TableHead className="text-xs font-bold tracking-wider uppercase">Proveedor</TableHead>
                            <TableHead className="text-xs font-bold tracking-wider uppercase">Referencia</TableHead>
                            <TableHead className="text-xs font-bold tracking-wider uppercase">Origen</TableHead>
                            <TableHead className="text-right text-xs font-bold tracking-wider uppercase">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedData).map(([groupName, { items, total }]) => {
                            const isExpanded = expandedGroups[groupName] !== false;
                            return (
                                <React.Fragment key={groupName}>
                                    <TableRow
                                        className="cursor-pointer border-b bg-muted/30 font-medium transition-colors hover:bg-muted/50 dark:border-neutral-800 dark:bg-neutral-800/30"
                                        onClick={() => toggleGroup(groupName)}
                                    >
                                        <TableCell className="py-3 pl-4">
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </TableCell>
                                        <TableCell colSpan={5} className="font-bold text-foreground">
                                            {groupName} <span className="ml-2 text-xs font-normal text-muted-foreground">({items.length} registros)</span>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-blue-700 tabular-nums dark:text-blue-400">
                                            S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>

                                    {isExpanded && items.map((receipt) => (
                                        <TableRow
                                            key={receipt.id_receipt}
                                            className="cursor-pointer border-b last:border-0 hover:bg-muted/40 dark:border-neutral-800/50"
                                            onClick={() => handleCardClick(receipt)}
                                        >
                                            <TableCell className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={!!rowSelection[receipt.id_receipt]}
                                                    onCheckedChange={() => toggleSelectionCustom(receipt.id_receipt)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-sm text-foreground/80">
                                                {format(new Date(receipt.issue_date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="w-fit rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold text-muted-foreground dark:bg-neutral-800 uppercase">
                                                        {receipt.receipt_code}
                                                    </span>
                                                    <span className="text-[10px] font-black tracking-tighter text-blue-600/70 uppercase">
                                                        {receipt.document_type}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-foreground">
                                                {receipt.supplier?.company_name}
                                            </TableCell>
                                            <TableCell className="text-[11px] font-bold tracking-tight text-foreground/70 uppercase">
                                                {receipt.series}-{receipt.number}
                                            </TableCell>
                                            {/* ✅ NUEVA COLUMNA DE ORIGEN (OC) */}
                                            <TableCell>
                                                {receipt.purchase_order ? (
                                                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                                                        <LinkIcon className="h-3 w-3" />
                                                        {receipt.purchase_order.po_code}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground italic">S/O</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-foreground tabular-nums">
                                                S/ {Number(receipt.total_amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comprobantes" />
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán <strong>{selectedCount}</strong> comprobantes seleccionados permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={executeBulkDelete} className="bg-red-600 text-white hover:bg-red-700">Sí, eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex h-full flex-1 flex-col overflow-hidden">
                <div className={cn("flex items-center justify-between border-b px-6 py-3 transition-colors duration-300", selectedCount > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-background')}>
                    {selectedCount > 0 ? (
                        <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 rounded-md bg-purple-100 px-3 py-1 text-blue-700 dark:bg-blue-900 dark:text-blue-100 font-bold">
                                    {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
                                    <Button variant="ghost" size="icon" className="ml-2 h-4 w-4" onClick={() => setRowSelection({})}><X className="h-3 w-3" /></Button>
                                </div>
                                <div className="h-6 w-px bg-gray-300" />
                                <Button variant="secondary" size="sm" onClick={confirmBulkDelete}><Trash2 className="mr-2 h-4 w-4 text-red-500" /> Eliminar</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button className="bg-blue-700 text-white hover:bg-blue-800" onClick={() => router.visit(receiptsRoute.create().url)}><Plus className="mr-2 h-4 w-4" /> Nuevo</Button>
                                <h1 className="text-lg font-semibold uppercase tracking-tight">Comprobantes</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <Select value={groupBy} onValueChange={setGroupBy}>
                                    <SelectTrigger className="h-9 w-44 bg-muted/30 text-xs font-medium"><SelectValue placeholder="Agrupar por" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin agrupar</SelectItem>
                                        <SelectItem value="month">Mes de Emisión</SelectItem>
                                        <SelectItem value="supplier">Proveedor</SelectItem>
                                        <SelectItem value="document_type">Tipo Documento</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Buscar..." className="h-9 pl-8 bg-muted/30" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 border-l pl-4 text-sm text-muted-foreground font-mono">
                                    <span>{receipts.from || 0}-{receipts.to || 0} / {receipts.total}</span>
                                    {!hidePaginationControls && (
                                        <div className="flex">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.visit(receipts.prev_page_url!)} disabled={!receipts.prev_page_url}><ChevronLeft className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.visit(receipts.next_page_url!)} disabled={!receipts.next_page_url}><ChevronRight className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-auto bg-muted/5 p-4">{renderContent()}</div>
            </div>
        </AppLayout>
    );
}
