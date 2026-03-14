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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    Plus,
    ShoppingBag,
    Trash2,
    User,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
    products,
    documentTypes,
}: Props) {
    const { props } = usePage();
    const serverErrors: any = props.errors;

    const [formError, setFormError] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isWritingNote, setIsWritingNote] = useState(false);

    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isReceiving, setIsReceiving] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [receiptData, setReceiptData] = useState({
        document_type: 'Factura',
        series: '',
        number: '',
        issue_date: format(new Date(), 'yyyy-MM-dd'),
    });

    const isDraft = order.status === 'draft';
    const isApproved = order.status === 'approved';
    const isDone = order.status === 'received';
    const showTracking = !isDraft;

    // Anchos iniciales (El Producto es fluido, no va aquí)
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
        put,
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

    useEffect(() => {
        if (serverErrors?.error || localError) {
            const timer = setTimeout(() => setLocalError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [serverErrors, localError]);

    const submitForm = (targetStatus: 'draft' | 'sent') => {
        setFormError(null);

        const hasProducts = rows.some(
            (r) =>
                (!isServiceOrder && r.id_product) ||
                (isServiceOrder && r.description),
        );

        if (targetStatus === 'sent' && !hasProducts) {
            setFormError(
                `Debes agregar al menos un ${isServiceOrder ? 'servicio' : 'producto'} para enviar la orden.`,
            );
            return;
        }

        transform((currentData) => ({
            ...currentData,
            status: targetStatus,
            issue_date: format(currentData.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            expected_date: currentData.expected_date
                ? format(currentData.expected_date, 'yyyy-MM-dd')
                : null,
            exchange_rate: parseFloat(currentData.exchange_rate),
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
        }));

        put(`/compras/ordenes/${order.id_purchase_order}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsWritingNote(false);
                setData('internal_note', '');
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
                onSuccess: () => {
                    setIsApproving(false);
                },
                onError: (errs: any) => {
                    if (errs.error) setFormError(errs.error);
                    setIsApproving(false);
                },
            },
        );
    };

    const handleReceiveOrder = () => {
        setFormError(null);
        setIsReceiving(true);
        router.post(
            `/compras/ordenes/${order.id_purchase_order}/recibir`,
            receiptData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsReceiveModalOpen(false);
                    setIsReceiving(false);
                },
                onError: (errs: any) => {
                    if (errs.error) setFormError(errs.error);
                    setIsReceiving(false);
                },
            },
        );
    };

    // ResizableTh: Se encarga del resize para todas las columnas EXCEPTO la fluida ("w-full")
    const ResizableTh = ({
        col,
        label,
        align = 'center',
        className = '',
    }: {
        col: string;
        label: React.ReactNode;
        align?: string;
        className?: string;
    }) => (
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
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {order.po_code}
                        </span>
                        <span className="mx-2">/</span>{' '}
                        {order.status === 'received'
                            ? 'Orden Completada'
                            : isDraft
                              ? 'Cotización (Borrador)'
                              : order.status === 'approved'
                                ? 'Orden Aprobada'
                                : 'Orden Confirmada'}
                    </div>

                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            {order.status === 'draft' && (
                                <>
                                    <Button
                                        onClick={() => submitForm('sent')}
                                        disabled={
                                            processing || rows.length === 0
                                        }
                                        className="h-8 rounded-sm bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
                                    >
                                        Confirmar Orden
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => submitForm('draft')}
                                        disabled={
                                            processing || !hasUnsavedChanges
                                        }
                                        className="h-8 rounded-sm text-foreground shadow-sm"
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
                                        className="h-8 rounded-sm bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
                                    >
                                        {isApproving
                                            ? 'Aprobando...'
                                            : 'Aprobar Orden'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => submitForm('sent')}
                                        disabled={
                                            processing || !hasUnsavedChanges
                                        }
                                        className="h-8 rounded-sm text-foreground shadow-sm"
                                    >
                                        Guardar Cambios
                                    </Button>
                                </>
                            )}

                            {order.status === 'approved' && (
                                <>
                                    {!isServiceOrder && (
                                        <Dialog
                                            open={isReceiveModalOpen}
                                            onOpenChange={setIsReceiveModalOpen}
                                        >
                                            <DialogTrigger asChild>
                                                <Button className="h-8 rounded-sm bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700">
                                                    <PackageOpen className="mr-2 h-4 w-4" />{' '}
                                                    Recibir Productos
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Recibir Mercadería
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Se registrará el ingreso
                                                        al Kardex y se creará el
                                                        comprobante financiero.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label className="text-right">
                                                            Tipo Doc.
                                                        </Label>
                                                        <Select
                                                            value={
                                                                receiptData.document_type
                                                            }
                                                            onValueChange={(
                                                                v,
                                                            ) =>
                                                                setReceiptData({
                                                                    ...receiptData,
                                                                    document_type:
                                                                        v,
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger className="col-span-3">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {documentTypes.map(
                                                                    (dt) => (
                                                                        <SelectItem
                                                                            key={
                                                                                dt.value
                                                                            }
                                                                            value={
                                                                                dt.value
                                                                            }
                                                                        >
                                                                            {
                                                                                dt.label
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label className="text-right">
                                                            Serie
                                                        </Label>
                                                        <Input
                                                            className="col-span-3"
                                                            value={
                                                                receiptData.series
                                                            }
                                                            onChange={(e) =>
                                                                setReceiptData({
                                                                    ...receiptData,
                                                                    series: e.target.value.toUpperCase(),
                                                                })
                                                            }
                                                            placeholder="F001"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label className="text-right">
                                                            Número
                                                        </Label>
                                                        <Input
                                                            className="col-span-3"
                                                            value={
                                                                receiptData.number
                                                            }
                                                            onChange={(e) =>
                                                                setReceiptData({
                                                                    ...receiptData,
                                                                    number: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            }
                                                            placeholder="000123"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label className="text-right">
                                                            Fecha Recepción
                                                        </Label>
                                                        <Input
                                                            type="date"
                                                            className="col-span-3"
                                                            value={
                                                                receiptData.issue_date
                                                            }
                                                            onChange={(e) =>
                                                                setReceiptData({
                                                                    ...receiptData,
                                                                    issue_date:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        onClick={
                                                            handleReceiveOrder
                                                        }
                                                        disabled={
                                                            isReceiving ||
                                                            !receiptData.series ||
                                                            !receiptData.number
                                                        }
                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                    >
                                                        {isReceiving
                                                            ? 'Procesando...'
                                                            : 'Confirmar Recepción'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="h-8 rounded-sm border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-400"
                                        onClick={() =>
                                            console.log(
                                                'Próximamente: Abrir Facturación',
                                            )
                                        }
                                    >
                                        <FileText className="mr-2 h-4 w-4" />{' '}
                                        Crear Factura
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="ghost"
                                onClick={() => window.history.back()}
                                className="h-8 rounded-sm text-muted-foreground hover:bg-muted"
                            >
                                Volver
                            </Button>
                        </div>

                        {/* StatusBar Visual */}
                        <div className="flex h-8 items-center overflow-hidden rounded-sm border border-border bg-muted/30 text-xs font-bold tracking-wider uppercase">
                            <div
                                className={cn(
                                    'relative flex h-full items-center justify-center border-r border-border px-4',
                                    isDraft
                                        ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'text-muted-foreground opacity-50',
                                )}
                            >
                                Cotización
                            </div>
                            <div
                                className={cn(
                                    'flex h-full items-center justify-center border-r border-border px-4',
                                    order.status === 'sent'
                                        ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'text-muted-foreground opacity-50',
                                )}
                            >
                                Orden Confirmada
                            </div>
                            <div
                                className={cn(
                                    'flex h-full items-center justify-center border-r border-border px-4',
                                    order.status === 'approved'
                                        ? 'bg-yellow-600/10 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        : 'text-muted-foreground opacity-50',
                                )}
                            >
                                Aprobada
                            </div>
                            <div
                                className={cn(
                                    'flex h-full items-center justify-center px-4',
                                    order.status === 'received'
                                        ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'text-muted-foreground opacity-50',
                                )}
                            >
                                Completada
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {/* PANEL IZQUIERDO (Formulario 100%) */}
                    <div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8">
                        <div className="w-full min-w-[800px] space-y-8">
                            <div className="flex items-center gap-3">
                                <ShoppingBag
                                    className={cn(
                                        'h-8 w-8 transition-colors',
                                        isDone
                                            ? 'text-emerald-500 opacity-100'
                                            : 'text-muted-foreground opacity-30',
                                    )}
                                />
                                <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase md:text-4xl">
                                    {order.po_code}
                                </h1>
                            </div>

                            {/* CABECERA (Rediseñada para simetría, un campo por línea) */}
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
                                                    'font-bold text-emerald-700 dark:text-emerald-400',
                                                )}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="purchase">
                                                    Orden de Compra (Bienes)
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
                                            placeholder="Buscar proveedor..."
                                            isDisabled={isDone || isApproved}
                                            className={cn(
                                                cleanInputClass,
                                                errors.id_supplier &&
                                                    'border-red-500 text-sm',
                                            )}
                                        />
                                        <InputError
                                            message={errors.id_supplier}
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
                                            placeholder="Cotización #..."
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

                                    <FormFieldRow label="Llegada Esperada">
                                        <Input
                                            type="date"
                                            value={
                                                data.expected_date
                                                    ? format(
                                                          data.expected_date,
                                                          'yyyy-MM-dd',
                                                      )
                                                    : ''
                                            }
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'expected_date',
                                                    new Date(e.target.value),
                                                )
                                            }
                                            disabled={isDone || isApproved}
                                            className={cn(
                                                cleanInputClass,
                                                'font-medium text-emerald-600',
                                            )}
                                        />
                                    </FormFieldRow>
                                </div>
                            </div>

                            {/* TABLA DE PRODUCTOS REDIMENSIONABLE */}
                            <div className="w-full pt-6">
                                <div className="mb-4 flex gap-6 border-b border-border text-sm font-bold text-muted-foreground">
                                    <span className="border-b-2 border-emerald-600 pb-2 text-foreground transition-colors">
                                        {isServiceOrder
                                            ? 'Servicios a Contratar'
                                            : 'Productos a Comprar'}
                                    </span>
                                </div>

                                <div
                                    className={cn(
                                        'w-full overflow-x-auto rounded-sm border border-border bg-card shadow-sm',
                                        hasDetailErrors && 'border-red-500',
                                    )}
                                >
                                    <table className="table-fixed text-left text-sm">
                                        <TableHeader className="bg-muted/30 select-none dark:bg-neutral-900">
                                            <TableRow className="dark:border-neutral-800">
                                                {/* Columna Fluida: Ocupa todo el espacio disponible */}
                                                <ResizableTh
                                                    col="product"
                                                    label={
                                                        isServiceOrder
                                                            ? 'Descripción del Servicio'
                                                            : 'Producto / Descripción'
                                                    }
                                                    align="left"
                                                    className="px-4"
                                                />

                                                <ResizableTh
                                                    col="qty"
                                                    label="Cantidad"
                                                />

                                                {showTracking && (
                                                    <>
                                                        {!isServiceOrder && (
                                                            <ResizableTh
                                                                col="received"
                                                                label="Recibida"
                                                                className="dark:text-white"
                                                            />
                                                        )}
                                                        <ResizableTh
                                                            col="billed"
                                                            label="Facturada"
                                                            className="dark:text-white"
                                                        />
                                                    </>
                                                )}

                                                <ResizableTh
                                                    col="cost"
                                                    label={`Costo (${symbol})`}
                                                    className="dark:text-white"
                                                />

                                                {!isServiceOrder && (
                                                    <>
                                                        <ResizableTh
                                                            col="margin"
                                                            label="% Margen"
                                                            className="dark:text-white"
                                                        />
                                                        <ResizableTh
                                                            col="sale_price"
                                                            label="P. Venta"
                                                            className="dark:text-white"
                                                        />
                                                    </>
                                                )}

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
                                                    className="group transition-colors hover:bg-muted/10"
                                                >
                                                    <td className="overflow-hidden px-4 py-2 align-top">
                                                        {!isServiceOrder ? (
                                                            <div className="w-full">
                                                                <SearchableSelect
                                                                    options={productOptions.filter(
                                                                        (o) =>
                                                                            !selectedProductIds.includes(
                                                                                o.value,
                                                                            ) ||
                                                                            o.value ===
                                                                                row.id_product,
                                                                    )}
                                                                    value={
                                                                        row.id_product ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        val,
                                                                    ) => {
                                                                        updateRow(
                                                                            row.id,
                                                                            'id_product',
                                                                            val,
                                                                        );
                                                                        updateRow(
                                                                            row.id,
                                                                            'unit_cost',
                                                                            row.unit_cost,
                                                                        );
                                                                    }}
                                                                    isDisabled={
                                                                        isDone ||
                                                                        isApproved
                                                                    }
                                                                    placeholder="Buscar producto..."
                                                                    className="h-8 border-transparent text-sm shadow-none focus:ring-1 focus:ring-emerald-500"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <Input
                                                                value={
                                                                    row.description
                                                                }
                                                                disabled={
                                                                    isDone ||
                                                                    isApproved
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'description',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Descripción del servicio..."
                                                                className="h-8 border-transparent shadow-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-100"
                                                            />
                                                        )}
                                                    </td>

                                                    <td className="px-2 py-2 align-top">
                                                        <Input
                                                            type="number"
                                                            disabled={
                                                                isDone ||
                                                                isApproved
                                                            }
                                                            className={
                                                                tableInputClass
                                                            }
                                                            value={row.quantity}
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'quantity',
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    {showTracking && (
                                                        <>
                                                            {!isServiceOrder && (
                                                                <td className="px-2 py-2 text-center align-middle">
                                                                    <span
                                                                        className={cn(
                                                                            'rounded px-2 py-1 text-xs font-bold tabular-nums',
                                                                            row.received_quantity >=
                                                                                row.quantity
                                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                                : row.received_quantity >
                                                                                    0
                                                                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                                  : 'text-muted-foreground',
                                                                        )}
                                                                    >
                                                                        {row.received_quantity ||
                                                                            0}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            <td className="px-2 py-2 text-center align-middle">
                                                                <span
                                                                    className={cn(
                                                                        'rounded px-2 py-1 text-xs font-bold tabular-nums',
                                                                        row.billed_quantity >=
                                                                            row.quantity
                                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                            : row.billed_quantity >
                                                                                0
                                                                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                                              : 'text-muted-foreground',
                                                                    )}
                                                                >
                                                                    {row.billed_quantity ||
                                                                        0}
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}

                                                    <td className="px-2 py-2 align-top">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            disabled={
                                                                isDone ||
                                                                isApproved
                                                            }
                                                            className={cn(
                                                                tableInputClass,
                                                                'text-emerald-600 disabled:opacity-100 dark:text-emerald-400',
                                                            )}
                                                            value={
                                                                row.unit_cost
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'unit_cost',
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    {!isServiceOrder && (
                                                        <>
                                                            <td className="px-2 py-2 align-top">
                                                                <div className="flex items-center justify-center">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        disabled={
                                                                            isDone ||
                                                                            isApproved
                                                                        }
                                                                        className={cn(
                                                                            tableInputClass,
                                                                            'px-1 text-center text-emerald-600 disabled:opacity-100 dark:text-emerald-400',
                                                                        )}
                                                                        value={
                                                                            row.margin_percentage
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateRow(
                                                                                row.id,
                                                                                'margin_percentage',
                                                                                parseFloat(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ) ||
                                                                                    0,
                                                                            )
                                                                        }
                                                                    />
                                                                    <span className="ml-1 text-[10px] text-muted-foreground">
                                                                        %
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-2 align-top">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    disabled={
                                                                        isDone ||
                                                                        isApproved
                                                                    }
                                                                    className={cn(
                                                                        tableInputClass,
                                                                        'text-emerald-600 disabled:opacity-100 dark:text-emerald-400',
                                                                    )}
                                                                    value={
                                                                        row.suggested_sale_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            row.id,
                                                                            'suggested_sale_price',
                                                                            parseFloat(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        )
                                                                    }
                                                                />
                                                            </td>
                                                        </>
                                                    )}

                                                    <td className="bg-muted/10 px-2 py-3 text-right align-middle font-bold tabular-nums">
                                                        {symbol}{' '}
                                                        {(
                                                            row.quantity *
                                                            row.unit_cost
                                                        ).toFixed(2)}
                                                    </td>
                                                    {!(
                                                        isDone || isApproved
                                                    ) && (
                                                        <td className="px-2 py-3 text-center align-middle">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30"
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

                                            {!(isDone || isApproved) && (
                                                <tr>
                                                    {/* El colspan depende de si mostramos el tracking y de si es servicio */}
                                                    <td
                                                        colSpan={12}
                                                        className="bg-muted/5 px-4 py-2"
                                                    >
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                                            onClick={() =>
                                                                setRows([
                                                                    ...rows,
                                                                    {
                                                                        id: Date.now(),
                                                                        id_product:
                                                                            '',
                                                                        description:
                                                                            '',
                                                                        quantity: 1,
                                                                        received_quantity: 0,
                                                                        billed_quantity: 0,
                                                                        unit_cost: 0,
                                                                        margin_percentage: 30,
                                                                        suggested_sale_price: 0,
                                                                    } as DetailRow,
                                                                ])
                                                            }
                                                        >
                                                            <Plus className="mr-1 h-4 w-4" />{' '}
                                                            Añadir línea
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )}
                                        </TableBody>
                                    </table>
                                </div>

                                {/* TOTALES */}
                                <div className="flex justify-end pt-6 pb-20">
                                    <div className="w-full max-w-sm space-y-2">
                                        <div className="flex justify-between border-b border-border pb-2 text-sm font-medium text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span>
                                                {symbol} {subTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-border pb-2 text-sm font-medium text-muted-foreground">
                                            <span>IGV Estimado (18%)</span>
                                            <span>
                                                {symbol} {igvAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 text-xl font-black text-emerald-600 dark:text-emerald-400">
                                            <span>Total</span>
                                            <span>
                                                {symbol}{' '}
                                                {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        {data.currency === 'USD' && (
                                            <div className="flex justify-between pt-1 text-xs font-bold text-blue-600">
                                                <span>
                                                    Equiv. Soles (T.C.{' '}
                                                    {data.exchange_rate})
                                                </span>
                                                <span>
                                                    S/ {totalInSoles.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL DERECHO (LOGS ESTÁTICO) */}
                    <div className="relative hidden h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10 xl:flex">
                        <div className="z-10 flex shrink-0 items-center gap-1 border-b border-border bg-card p-2 shadow-sm">
                            <Button
                                variant="ghost"
                                className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                            >
                                Enviar mensaje
                            </Button>
                            {!(isDone || isApproved) && (
                                <Button
                                    variant={
                                        isWritingNote ? 'secondary' : 'ghost'
                                    }
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsWritingNote(!isWritingNote);
                                    }}
                                    className={cn(
                                        'h-8 text-xs font-bold transition-colors',
                                        isWritingNote
                                            ? 'bg-muted text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <MessageSquare className="mr-1.5 h-3 w-3" />{' '}
                                    Registrar nota
                                </Button>
                            )}
                        </div>

                        {isWritingNote && !(isDone || isApproved) && (
                            <div className="shrink-0 animate-in border-b border-border bg-background p-4 slide-in-from-top-2">
                                <textarea
                                    value={data.internal_note}
                                    onChange={(e) =>
                                        setData('internal_note', e.target.value)
                                    }
                                    className="w-full resize-none rounded-md border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    rows={3}
                                    placeholder="Escribir una nota interna..."
                                    autoFocus
                                />
                                <div className="mt-3 flex justify-end">
                                    <Button
                                        size="sm"
                                        type="button"
                                        onClick={submitNote}
                                        disabled={
                                            processing ||
                                            !data.internal_note.trim()
                                        }
                                        className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        Guardar nota
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
                            <div className="relative space-y-6 border-l-2 border-border pl-6">
                                {order.logs?.map((log: any) => (
                                    <div key={log.id} className="text-sm">
                                        <div className="absolute top-0 -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-background">
                                            {log.action === 'Nota' ? (
                                                <MessageSquare className="h-3 w-3 text-blue-500" />
                                            ) : (
                                                <History className="h-3 w-3 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="flex items-center gap-1 font-bold text-foreground">
                                                <User className="h-3 w-3" />{' '}
                                                {log.user?.name || 'Sistema'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(
                                                    new Date(log.created_at),
                                                    'dd/MM/yyyy HH:mm',
                                                )}
                                            </span>
                                        </div>

                                        {log.action === 'Nota' ? (
                                            <div className="mt-1 rounded-md border border-border bg-white p-3 shadow-sm dark:bg-muted">
                                                <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                                    {log.notes}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="mt-1 leading-relaxed">
                                                <span className="text-muted-foreground">
                                                    {log.action}:{' '}
                                                </span>
                                                <span className="font-medium text-foreground">
                                                    {log.field_changed ||
                                                        log.new_value}
                                                </span>
                                                {log.old_value && (
                                                    <span className="ml-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                                        {log.old_value} &rarr;{' '}
                                                        {log.new_value}
                                                    </span>
                                                )}
                                                {log.notes && (
                                                    <p className="mt-1 text-xs text-muted-foreground italic">
                                                        {log.notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
