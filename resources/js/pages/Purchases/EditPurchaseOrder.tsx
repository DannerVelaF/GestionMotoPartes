import { SearchableSelect } from '@/components/SearchableSelect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertCircle,
    CheckCircle2,
    FileText,
    History,
    MessageSquare,
    PackageOpen,
    ShoppingBag,
    Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// --- ESTILOS REUTILIZABLES ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-emerald-600 focus:outline-none transition-all font-medium dark:text-foreground dark:border-neutral-700 dark:focus:border-emerald-500';
const tableInputClass =
    'h-8 w-full border-transparent bg-transparent text-center shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-emerald-500 tabular-nums dark:text-foreground dark:focus:bg-neutral-800';

const InputError = ({
    message,
    className,
}: {
    message?: string;
    className?: string;
}) => {
    if (!message) return null;
    return (
        <p
            className={cn(
                'mt-1 animate-pulse text-[10px] font-bold text-red-500 uppercase',
                className,
            )}
        >
            {message}
        </p>
    );
};

function FloatingAlert({
    message,
    type = 'error',
}: {
    message?: string;
    type?: 'error' | 'success';
}) {
    if (!message) return null;
    const isSuccess = type === 'success';
    return (
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={cn(
                    'border-2 shadow-xl',
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100'
                        : 'border-red-500 bg-white text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100',
                )}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2 font-bold">
                    {isSuccess ? '¡Éxito!' : 'Atención'}
                </AlertTitle>
                <AlertDescription className="ml-2 whitespace-pre-wrap">
                    {message}
                </AlertDescription>
            </Alert>
        </div>
    );
}

const FormFieldRow = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <div className="flex min-h-[36px] items-center">
        <div className="w-[160px] shrink-0 pr-4 text-sm font-bold text-muted-foreground">
            {label}
        </div>
        <div className="flex-1">{children}</div>
    </div>
);

// --- CUSTOM HOOK PARA REDIMENSIONAR COLUMNAS ---
const useTableResize = (initialWidths: Record<string, number>) => {
    const [widths, setWidths] = useState(initialWidths);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const onMouseDown = (e: React.MouseEvent, col: string) => {
        setIsResizing(col);
        startX.current = e.clientX;
        startWidth.current = (
            e.target as HTMLElement
        ).parentElement!.offsetWidth;
        e.preventDefault();
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = Math.max(
                50,
                startWidth.current + (e.clientX - startX.current),
            );
            setWidths((prev) => ({ ...prev, [isResizing]: newWidth }));
        };
        const onMouseUp = () => setIsResizing(null);
        if (isResizing) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [isResizing]);

    return { widths, onMouseDown, isResizing };
};

// --- INTERFACES ---
interface Props {
    order: any;
    suppliers: any[];
    products: any[];
    receptionsCount: number;
    receiptsCount: number;
    documentTypes: { value: string; label: string }[];
}

interface DetailRow {
    id: number;
    id_product: string | null;
    description: string;
    quantity: number;
    received_quantity: number;
    billed_quantity: number;
    unit_cost: number;
    margin_percentage: number;
    suggested_sale_price: number;
}

export default function EditPurchaseOrder({
    order,
    suppliers,
    receptionsCount,
    receiptsCount,
    products,
    documentTypes,
}: Props) {
    const { props } = usePage();
    const serverErrors: any = props.errors;

    const [formError, setFormError] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isWritingNote, setIsWritingNote] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    // Modal de Facturación
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [billingData, setBillingData] = useState({
        type: 'Factura',
        series: '',
        number: '',
    });

    const isDraft = order.status === 'draft';
    const isApproved = order.status === 'approved';
    const isDone = order.status === 'received';
    const showTracking = !isDraft;

    const { widths, onMouseDown, isResizing } = useTableResize({
        product: 350,
        qty: 90,
        received: 90,
        billed: 90,
        cost: 110,
        margin: 90,
        sale_price: 110,
        subtotal: 120,
        action: 60,
    });

    const initialRows: DetailRow[] = order.details.map((line: any) => ({
        id: line.id_po_detail,
        id_product: line.id_product ? String(line.id_product) : '',
        description: line.description || '',
        quantity: Number(line.quantity),
        received_quantity: Number(line.received_quantity || 0),
        billed_quantity: Number(line.billed_quantity || 0),
        unit_cost: Number(line.unit_cost),
        margin_percentage: Number(line.margin_percentage),
        suggested_sale_price: Number(line.suggested_sale_price),
    }));

    const [rows, setRows] = useState<DetailRow[]>(initialRows);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        clearErrors,
        transform,
        isDirty,
    } = useForm({
        id_supplier: String(order.id_supplier),
        po_code: order.po_code,
        order_type: order.order_type || 'purchase',
        currency: order.currency || 'PEN',
        exchange_rate: order.exchange_rate || '1.000',
        issue_date: new Date(order.issue_date),
        expected_date: order.expected_date
            ? new Date(order.expected_date)
            : null,
        notes: order.notes || '',
        internal_note: '',
        status: order.status,
    });

    const isServiceOrder = data.order_type === 'service';
    const symbol = data.currency === 'USD' ? '$' : 'S/';
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        const rowsChanged =
            JSON.stringify(rows) !== JSON.stringify(initialRows);
        setHasUnsavedChanges(isDirty || rowsChanged);
    }, [rows, isDirty]);

    // ✅ LÓGICA DE BOTONES (CORREGIDA: DENTRO DEL COMPONENTE)
    const needsReception = useMemo(() => {
        if (isServiceOrder || !isApproved) return false;
        return rows.some((r) => r.received_quantity < r.quantity);
    }, [rows, isApproved, isServiceOrder]);

    const needsBilling = useMemo(() => {
        if (!isApproved && !isDone) return false;
        return rows.some((r) => r.billed_quantity < r.quantity);
    }, [rows, isApproved, isDone]);

    const handleCurrencyChange = (val: string) =>
        setData((prev) => ({
            ...prev,
            currency: val,
            exchange_rate: val === 'PEN' ? '1.000' : '3.800',
        }));

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const updateRow = (id: number, field: string, value: any) => {
        if (isDone || isApproved) return;
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                const newRow = { ...row, [field]: value };
                if (field === 'unit_cost' || field === 'margin_percentage') {
                    const cost =
                        field === 'unit_cost' ? Number(value) : row.unit_cost;
                    const margin =
                        field === 'margin_percentage'
                            ? Number(value)
                            : row.margin_percentage;
                    if (cost > 0)
                        newRow.suggested_sale_price = parseFloat(
                            (cost + cost * (margin / 100)).toFixed(2),
                        );
                }
                if (field === 'suggested_sale_price') {
                    const salePrice = Number(value);
                    if (salePrice > 0 && row.unit_cost > 0) {
                        const profit = salePrice - row.unit_cost;
                        newRow.margin_percentage = parseFloat(
                            ((profit / row.unit_cost) * 100).toFixed(2),
                        );
                    }
                }
                return newRow;
            }),
        );
    };

    const submitNote = () => {
        if (!data.internal_note.trim()) return;
        router.post(
            `/compras/ordenes/${order.id_purchase_order}/nota`,
            { internal_note: data.internal_note },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsWritingNote(false);
                    setData('internal_note', '');
                },
            },
        );
    };

    const totalAmount = rows.reduce(
        (acc, row) => acc + row.quantity * row.unit_cost,
        0,
    );
    const hasDetailErrors = Object.keys(errors).some((key) =>
        key.startsWith('details'),
    );
    const igvAmount = totalAmount - totalAmount / 1.18;
    const subTotal = totalAmount - igvAmount;
    const totalInSoles =
        data.currency === 'USD'
            ? totalAmount * Number(data.exchange_rate)
            : totalAmount;

    const supplierOptions = suppliers.map((s) => ({
        value: String(s.id_supplier),
        label: s.company_name,
    }));
    const productOptions = products.map((p) => ({
        value: String(p.id_product),
        label: p.product_code
            ? `[${p.product_code}] ${p.product_name}`
            : p.product_name,
    }));
    const selectedProductIds = rows
        .map((r) => r.id_product)
        .filter((id) => id !== '');

    const submitForm = (targetStatus: 'draft' | 'sent') => {
        const dataToSend = {
            ...data,
            _method: 'put',
            status: targetStatus,
            issue_date: format(data.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            expected_date: data.expected_date
                ? format(data.expected_date, 'yyyy-MM-dd')
                : null,
            exchange_rate: parseFloat(data.exchange_rate),
            total_amount: totalAmount,
            details: rows
                .filter(
                    (r) =>
                        (!isServiceOrder && r.id_product) ||
                        (isServiceOrder && r.description),
                )
                .map((r) => ({
                    id_product: !isServiceOrder ? r.id_product : null,
                    description: isServiceOrder ? r.description : null,
                    quantity: r.quantity,
                    unit_cost: r.unit_cost,
                    margin_percentage: r.margin_percentage,
                    suggested_sale_price: r.suggested_sale_price,
                    subtotal: r.quantity * r.unit_cost,
                    is_service: isServiceOrder,
                })),
        };
        router.post(`/compras/ordenes/${order.id_purchase_order}`, dataToSend, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setHasUnsavedChanges(false);
            },
            onError: (errs: any) => {
                if (errs.error) setFormError(errs.error);
            },
        });
    };

    const handleApproveOrder = () => {
        setIsApproving(true);
        router.post(
            `/compras/ordenes/${order.id_purchase_order}/aprobar`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setIsApproving(false),
                onError: (errs: any) => {
                    if (errs.error) setFormError(errs.error);
                    setIsApproving(false);
                },
            },
        );
    };

    const goToBilling = () => {
        const params = new URLSearchParams({
            source_po: order.id_purchase_order.toString(),
            type: billingData.type,
            series: billingData.series,
            number: billingData.number,
        }).toString();
        router.get(`/recibos/nuevoRecibo?${params}`);
    };

    const ResizableTh = ({
        col,
        label,
        align = 'center',
        className = '',
    }: any) => (
        <TableHead
            style={{ width: widths[col], minWidth: 50 }}
            className={cn(
                `relative px-4 py-3 text-${align} text-[10px] font-bold uppercase`,
                className,
                isResizing === col && 'bg-muted/50',
            )}
        >
            {label}
            <div
                className="absolute top-0 right-0 z-10 h-full w-2 cursor-col-resize touch-none hover:bg-emerald-500/50"
                onMouseDown={(e) => onMouseDown(e, col)}
            />
        </TableHead>
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Compras', href: '/compras/ordenes' },
                { title: order.po_code, href: '#' },
            ]}
        >
            <Head title={order.po_code} />
            <FloatingAlert
                message={
                    formError || localError || (serverErrors?.error as string)
                }
                type="error"
            />

            <div className="flex h-full flex-col overflow-hidden bg-background">
                {/* TOOLBAR SUPERIOR */}
                <div className="flex shrink-0 flex-col border-b border-border bg-card">
                    <div className="flex items-center px-6 py-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-emerald-600">
                            {order.po_code}
                        </span>
                        <span className="mx-2">/</span>{' '}
                        {order.status.toUpperCase()}
                    </div>

                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            {isDraft && (
                                <>
                                    <Button
                                        onClick={() => submitForm('sent')}
                                        disabled={rows.length === 0}
                                        className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        Confirmar Orden
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => submitForm('draft')}
                                        disabled={!hasUnsavedChanges}
                                        className="h-8"
                                    >
                                        Guardar Cambios
                                    </Button>
                                </>
                            )}
                            {order.status === 'sent' && (
                                <>
                                    <Button
                                        onClick={handleApproveOrder}
                                        disabled={isApproving}
                                        className="h-8 bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Aprobar Orden
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => submitForm('sent')}
                                        disabled={!hasUnsavedChanges}
                                        className="h-8"
                                    >
                                        Guardar Cambios
                                    </Button>
                                </>
                            )}
                            {isApproved || isDone ? (
                                <>
                                    {needsReception && (
                                        <Button
                                            onClick={() =>
                                                router.get(
                                                    `/compras/ordenes/${order.id_purchase_order}/recepcion`,
                                                )
                                            }
                                            className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                                        >
                                            <PackageOpen className="mr-2 h-4 w-4" />{' '}
                                            Recibir Productos
                                        </Button>
                                    )}
                                    {needsBilling && (
                                        <Button
                                            onClick={() =>
                                                setShowBillingModal(true)
                                            }
                                            variant="outline"
                                            className="h-8 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                        >
                                            <FileText className="mr-2 h-4 w-4" />{' '}
                                            Facturar Productos
                                        </Button>
                                    )}
                                </>
                            ) : null}
                            <Button
                                variant="ghost"
                                onClick={() => window.history.back()}
                                className="h-8"
                            >
                                Volver
                            </Button>
                        </div>

                        {/* StatusBar Visual */}
                        <div className="flex items-center gap-4">
                            {receptionsCount > 0 && (
                                <button
                                    onClick={() =>
                                        router.get(
                                            `/inventario/ajuste/movimientos?search=${order.po_code}`,
                                        )
                                    }
                                    className="flex items-center gap-1.5 border-r border-border px-3 text-emerald-600 transition-all hover:bg-muted/50 dark:text-emerald-400"
                                >
                                    <PackageOpen className="h-3.5 w-3.5" />{' '}
                                    <span className="text-[10px] font-semibold uppercase">
                                        Recepciones ({receptionsCount})
                                    </span>
                                </button>
                            )}

                            {receiptsCount > 0 && (
                                <button
                                    onClick={() =>
                                        router.get(
                                            `/recibos?search=${order.po_code}`,
                                        )
                                    }
                                    className="flex items-center gap-1.5 border-r border-border px-3 text-blue-600 transition-all hover:bg-muted/50 dark:text-blue-400"
                                >
                                    <FileText className="h-3.5 w-3.5" />{' '}
                                    <span className="text-[10px] font-semibold uppercase">
                                        Comprobantes ({receiptsCount})
                                    </span>
                                </button>
                            )}
                            <div className="flex h-8 items-center overflow-hidden rounded-sm border border-border bg-muted/30 text-[10px] font-bold uppercase">
                                <div
                                    className={cn(
                                        'border-r px-4 py-2',
                                        isDraft
                                            ? 'bg-emerald-600/10 text-emerald-600'
                                            : 'opacity-50',
                                    )}
                                >
                                    Cotización
                                </div>
                                <div
                                    className={cn(
                                        'border-r px-4 py-2',
                                        order.status === 'sent'
                                            ? 'bg-blue-600/10 text-blue-600'
                                            : 'opacity-50',
                                    )}
                                >
                                    Confirmada
                                </div>
                                <div
                                    className={cn(
                                        'border-r px-4 py-2',
                                        order.status === 'approved'
                                            ? 'bg-yellow-600/10 text-yellow-600'
                                            : 'opacity-50',
                                    )}
                                >
                                    Aprobada
                                </div>
                                <div
                                    className={cn(
                                        'px-4 py-2',
                                        isDone
                                            ? 'bg-emerald-600/10 text-emerald-600'
                                            : 'opacity-50',
                                    )}
                                >
                                    Completada
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8">
                        <div className="w-full min-w-[800px] space-y-8">
                            <div className="flex items-center gap-3">
                                <ShoppingBag
                                    className={cn(
                                        'h-8 w-8',
                                        isDone
                                            ? 'text-emerald-500'
                                            : 'text-muted-foreground opacity-30',
                                    )}
                                />
                                <h1 className="text-3xl font-bold uppercase">
                                    {order.po_code}
                                </h1>
                            </div>

                            {/* CABECERA */}
                            <div className="grid grid-cols-1 gap-x-12 gap-y-2 pt-4 xl:grid-cols-2">
                                <div className="space-y-1">
                                    <FormFieldRow label="Tipo de Orden">
                                        <Select
                                            value={data.order_type}
                                            onValueChange={(val) =>
                                                onFieldChange('order_type', val)
                                            }
                                            disabled={!isDraft}
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    cleanInputClass,
                                                    'font-bold text-emerald-700',
                                                )}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="purchase">
                                                    Orden de Compra
                                                </SelectItem>
                                                <SelectItem value="service">
                                                    Orden de Servicio
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormFieldRow>
                                    <FormFieldRow label="Proveedor">
                                        <SearchableSelect
                                            options={supplierOptions}
                                            value={data.id_supplier}
                                            onChange={(val) =>
                                                onFieldChange(
                                                    'id_supplier',
                                                    val,
                                                )
                                            }
                                            isDisabled={isDone || isApproved}
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>
                                    <FormFieldRow label="Referencia Proveedor">
                                        <Input
                                            value={data.notes}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'notes',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={isDone || isApproved}
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>
                                </div>
                                <div className="space-y-1">
                                    <FormFieldRow label="Moneda">
                                        <Select
                                            value={data.currency}
                                            onValueChange={handleCurrencyChange}
                                            disabled={isDone || isApproved}
                                        >
                                            <SelectTrigger
                                                className={cleanInputClass}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PEN">
                                                    Soles (PEN)
                                                </SelectItem>
                                                <SelectItem value="USD">
                                                    Dólares (USD)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormFieldRow>
                                    <FormFieldRow label="Tipo de Cambio">
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={data.exchange_rate}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'exchange_rate',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                data.currency === 'PEN' ||
                                                isDone ||
                                                isApproved
                                            }
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>
                                    <FormFieldRow label="Fecha de Orden">
                                        <Input
                                            type="date"
                                            value={format(
                                                data.issue_date,
                                                'yyyy-MM-dd',
                                            )}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'issue_date',
                                                    new Date(e.target.value),
                                                )
                                            }
                                            disabled={isDone || isApproved}
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>
                                </div>
                            </div>

                            {/* TABLA */}
                            <div className="w-full pt-6">
                                <div className="mb-4 border-b border-border text-sm font-bold text-muted-foreground">
                                    <span className="border-b-2 border-emerald-600 pb-2 text-foreground">
                                        {isServiceOrder
                                            ? 'Servicios'
                                            : 'Productos'}
                                    </span>
                                </div>
                                <div
                                    className={cn(
                                        'w-full overflow-x-auto rounded-sm border border-border bg-card shadow-sm',
                                        hasDetailErrors && 'border-red-500',
                                    )}
                                >
                                    <table className="w-full table-fixed text-left text-sm">
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <ResizableTh
                                                    col="product"
                                                    label="Producto / Descripción"
                                                    align="left"
                                                    className="px-4"
                                                />
                                                <ResizableTh
                                                    col="qty"
                                                    label="Cantidad"
                                                />
                                                {showTracking && (
                                                    <>
                                                        <ResizableTh
                                                            col="received"
                                                            label="Recibida"
                                                        />
                                                        <ResizableTh
                                                            col="billed"
                                                            label="Facturada"
                                                        />
                                                    </>
                                                )}
                                                <ResizableTh
                                                    col="cost"
                                                    label={`Costo (${symbol})`}
                                                />
                                                <ResizableTh
                                                    col="subtotal"
                                                    label="Subtotal"
                                                    align="right"
                                                />
                                                {!(isDone || isApproved) && (
                                                    <ResizableTh
                                                        col="action"
                                                        label=""
                                                    />
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border/50">
                                            {rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="group hover:bg-muted/10"
                                                >
                                                    <td className="px-4 py-2">
                                                        {!isServiceOrder ? (
                                                            <SearchableSelect
                                                                options={
                                                                    productOptions
                                                                }
                                                                value={
                                                                    row.id_product ||
                                                                    ''
                                                                }
                                                                onChange={(v) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'id_product',
                                                                        v,
                                                                    )
                                                                }
                                                                isDisabled={
                                                                    isDone ||
                                                                    isApproved
                                                                }
                                                                className="h-8 border-transparent shadow-none"
                                                            />
                                                        ) : (
                                                            <Input
                                                                value={
                                                                    row.description
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'description',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isDone ||
                                                                    isApproved
                                                                }
                                                                className="h-8 border-transparent shadow-none"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <Input
                                                            type="number"
                                                            value={row.quantity}
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'quantity',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            disabled={
                                                                isDone ||
                                                                isApproved
                                                            }
                                                            className={
                                                                tableInputClass
                                                            }
                                                        />
                                                    </td>
                                                    {showTracking && (
                                                        <>
                                                            <td className="text-center align-middle font-bold text-emerald-600">
                                                                {
                                                                    row.received_quantity
                                                                }
                                                            </td>
                                                            <td className="text-center align-middle font-bold text-blue-600">
                                                                {
                                                                    row.billed_quantity
                                                                }
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-2 py-2">
                                                        <Input
                                                            type="number"
                                                            value={
                                                                row.unit_cost
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'unit_cost',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            disabled={
                                                                isDone ||
                                                                isApproved
                                                            }
                                                            className={
                                                                tableInputClass
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-bold tabular-nums">
                                                        {symbol}{' '}
                                                        {(
                                                            row.quantity *
                                                            row.unit_cost
                                                        ).toFixed(2)}
                                                    </td>
                                                    {!(
                                                        isDone || isApproved
                                                    ) && (
                                                        <td className="text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100"
                                                                onClick={() =>
                                                                    rows.length >
                                                                        1 &&
                                                                    setRows(
                                                                        rows.filter(
                                                                            (
                                                                                r,
                                                                            ) =>
                                                                                r.id !==
                                                                                row.id,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </TableBody>
                                    </table>
                                </div>

                                {/* TOTALES */}
                                <div className="flex justify-end pt-6 pb-20">
                                    <div className="w-full max-w-sm space-y-2">
                                        <div className="flex justify-between border-b pb-2 text-sm text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span>
                                                {symbol} {subTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2 text-sm text-muted-foreground">
                                            <span>IGV Estimado (18%)</span>
                                            <span>
                                                {symbol} {igvAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 text-xl font-black text-emerald-600">
                                            <span>Total</span>
                                            <span>
                                                {symbol}{' '}
                                                {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CHATTER */}
                    <div className="relative hidden h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10 xl:flex">
                        <div className="z-10 flex shrink-0 items-center gap-1 border-b border-border bg-card p-2 shadow-sm">
                            <Button
                                variant="ghost"
                                className="h-8 text-xs font-bold text-muted-foreground"
                            >
                                Enviar mensaje
                            </Button>
                            {!(isDone || isApproved) && (
                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        setIsWritingNote(!isWritingNote)
                                    }
                                    className="h-8 text-xs font-bold"
                                >
                                    <MessageSquare className="mr-1.5 h-3 w-3" />{' '}
                                    Registrar nota
                                </Button>
                            )}
                        </div>
                        {isWritingNote && (
                            <div className="animate-in border-b bg-background p-4 slide-in-from-top-2">
                                <textarea
                                    value={data.internal_note}
                                    onChange={(e) =>
                                        setData('internal_note', e.target.value)
                                    }
                                    className="w-full rounded-md border p-2 text-sm"
                                    rows={3}
                                    placeholder="Nota interna..."
                                />
                                <div className="mt-2 flex justify-end">
                                    <Button
                                        size="sm"
                                        onClick={submitNote}
                                        className="h-8 bg-emerald-600 text-white"
                                    >
                                        Guardar nota
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="flex-1 space-y-6 overflow-y-auto p-6">
                            {order.logs?.map((log: any) => (
                                <div
                                    key={log.id}
                                    className="relative border-l-2 pl-6 text-sm"
                                >
                                    <div className="absolute top-0 -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2 bg-background">
                                        {log.action === 'Nota' ? (
                                            <MessageSquare className="h-3 w-3 text-blue-500" />
                                        ) : (
                                            <History className="h-3 w-3 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="mb-1 flex justify-between font-bold">
                                        <span>
                                            {log.user?.name || 'Sistema'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(
                                                new Date(log.created_at),
                                                'dd/MM HH:mm',
                                            )}
                                        </span>
                                    </div>
                                    <p className="leading-relaxed text-muted-foreground">
                                        {log.notes || log.action}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* DIALOG FACTURACIÓN */}
            <Dialog open={showBillingModal} onOpenChange={setShowBillingModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-black tracking-tighter uppercase">
                            Registrar Comprobante
                        </DialogTitle>
                        <DialogDescription>
                            Selecciona el tipo de documento para la factura de
                            esta orden.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-right text-sm font-bold">
                                Tipo
                            </span>
                            <Select
                                value={billingData.type}
                                onValueChange={(v) =>
                                    setBillingData({ ...billingData, type: v })
                                }
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Factura">
                                        Factura
                                    </SelectItem>
                                    <SelectItem value="Boleta">
                                        Boleta
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-right text-sm font-bold">
                                Serie
                            </span>
                            <Input
                                value={billingData.series}
                                onChange={(e) =>
                                    setBillingData({
                                        ...billingData,
                                        series: e.target.value.toUpperCase(),
                                    })
                                }
                                placeholder="F001"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-right text-sm font-bold">
                                Número
                            </span>
                            <Input
                                value={billingData.number}
                                onChange={(e) =>
                                    setBillingData({
                                        ...billingData,
                                        number: e.target.value,
                                    })
                                }
                                placeholder="000123"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowBillingModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={goToBilling}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Continuar a Facturación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
