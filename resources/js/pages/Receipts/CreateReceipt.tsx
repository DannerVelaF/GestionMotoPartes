import { SearchableSelect } from '@/components/SearchableSelect';
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
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import receiptsRoute from '@/routes/receipts';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    ArrowRightLeft,
    Box,
    Briefcase,
    CalendarIcon,
    CheckCircle2,
    FileText,
    History,
    Link as LinkIcon,
    MessageSquare,
    PackageCheck,
    Plus,
    RotateCcw,
    Save,
    Trash2,
    Undo2,
} from 'lucide-react';
import React, { FormEventHandler, useEffect, useMemo, useState } from 'react';

// --- ESTILOS REUTILIZABLES ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium dark:text-foreground dark:border-neutral-700 dark:focus:border-blue-500';
const disabledInputClass =
    'h-9 w-full rounded-none border-0 border-b border-dashed border-muted-foreground/30 bg-transparent px-0 text-sm shadow-none focus:ring-0 cursor-not-allowed text-foreground font-semibold dark:border-neutral-700 dark:text-neutral-400';
const tableInputClass =
    'h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500 tabular-nums dark:text-foreground dark:focus:bg-neutral-800';

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
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-red-500 bg-white text-red-900',
                )}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="text-[12px] leading-tight font-bold tracking-tight uppercase">
                    {message}
                </AlertTitle>
                <AlertDescription className="ml-2 whitespace-pre-wrap">
                    {message}
                </AlertDescription>
            </Alert>
        </div>
    );
}

const InputError = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
        <p className="mt-1 animate-pulse text-[10px] font-bold text-red-500 uppercase">
            {message}
        </p>
    );
};

const FormFieldRow = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <div className="flex min-h-[36px] items-center">
        <div className="w-[140px] shrink-0 pr-4 text-sm font-bold tracking-tighter text-muted-foreground uppercase">
            {label}
        </div>
        <div className="flex-1">{children}</div>
    </div>
);

interface DetailRow {
    id: number;
    id_product: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    type?: string;
}

interface PageProps {
    receipt: any;
    returnsCount?: number;
    parentReference?: { id: number; code: string; url: string } | null;
    masterDocument?: { type: string; code: string; url: string } | null;
    products: any[];
    documentTypes: any[];
    suppliers: any[];
    purchaseOrders?: any[];
    preloadedData?: {
        order?: any;
        type?: string;
        series?: string;
        number?: string;
        currency?: string;
        exchange_rate?: string;
    };
}

export default function CreateReceipt({
    receipt,
    returnsCount = 0,
    parentReference,
    masterDocument,
    products,
    documentTypes,
    suppliers,
    preloadedData,
    purchaseOrders = [],
}: PageProps) {
    const { props } = usePage<any>();
    const { flash = {} } = props;

    // Validación segura por si receipt no existe (ya que es CreateReceipt)
    const isPublished = receipt?.status === 'published';

    const [internalNote, setInternalNote] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isWritingNote, setIsWritingNote] = useState(false);

    // Modales
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnItems, setReturnItems] = useState<any[]>([]);

    const [rows, setRows] = useState<DetailRow[]>([
        {
            id: Date.now(),
            id_product: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            type: 'product',
        },
    ]);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
        transform,
        isDirty,
    } = useForm({
        id_supplier: receipt?.id_supplier ? String(receipt.id_supplier) : '',
        document_type: receipt?.document_type || '',
        series: receipt?.series || '',
        number: receipt?.number || '',
        currency: receipt?.currency || 'PEN',
        exchange_rate: receipt?.exchange_rate
            ? String(receipt.exchange_rate)
            : '1.000',
        issue_date: receipt?.issue_date
            ? new Date(receipt.issue_date)
            : new Date(),
        file: null as File | null,
        details: [] as any[],
        id_purchase_order: '' as string | number,
        internal_note: '',
        glosa: receipt?.glosa || '',
    });

    useEffect(() => {
        if (preloadedData?.order) {
            const order = preloadedData.order;

            // Usamos un timeout mínimo de 0ms para que se ejecute
            // justo después del primer renderizado y los componentes Select ya existan
            setTimeout(() => {
                const passedType = preloadedData.type || '';
                const matchedType = documentTypes.find(
                    (t: any) =>
                        t.label?.toLowerCase() === passedType.toLowerCase() ||
                        t.value === passedType,
                )?.value;

                setData((prev) => ({
                    ...prev,
                    id_supplier: String(order.id_supplier),
                    id_purchase_order: String(order.id_purchase_order),
                    currency: preloadedData.currency || order.currency || 'PEN',
                    exchange_rate: preloadedData.exchange_rate
                        ? String(preloadedData.exchange_rate)
                        : '1.000',
                    document_type: matchedType || passedType || '',
                    series: preloadedData.series || '',
                    number: preloadedData.number || '',
                }));
            }, 0);

            // El detalle se puede quedar fuera del timeout
            const initialRows = order.details
                .map((detail: any) => ({
                    id: Math.random(),
                    id_product: detail.id_product
                        ? String(detail.id_product)
                        : '',
                    description: detail.description || '',
                    quantity: detail.quantity - (detail.billed_quantity || 0),
                    unit_price: Number(detail.unit_cost),
                    type: detail.id_product ? 'product' : 'service',
                }))
                .filter((r: any) => r.quantity > 0);

            setRows(initialRows);
        }
    }, [preloadedData, documentTypes]);

    const poOptions = useMemo(() => {
        return (purchaseOrders || []).map((po: any) => ({
            value: String(po.id_purchase_order),
            label: `OC: ${po.po_code}`,
        }));
    }, [purchaseOrders]);

    const selectedPo = useMemo(() => {
        return purchaseOrders?.find(
            (p: any) =>
                String(p.id_purchase_order) === String(data.id_purchase_order),
        );
    }, [data.id_purchase_order, purchaseOrders]);

    const handlePoChange = (val: string) => {
        if (!val) {
            setData('id_purchase_order', '');
            return;
        }

        const po = purchaseOrders?.find(
            (p: any) => String(p.id_purchase_order) === val,
        );
        if (po) {
            setData((prev) => ({
                ...prev,
                id_purchase_order: val,
                id_supplier: String(po.id_supplier),
                currency: po.currency || 'PEN',
                exchange_rate: String(po.exchange_rate || '1.000'),
            }));

            const newRows = (po.details || [])
                .map((detail: any) => ({
                    id: Math.random(),
                    id_product: detail.id_product
                        ? String(detail.id_product)
                        : '',
                    description: detail.description || '',
                    quantity:
                        Number(detail.quantity) -
                        Number(detail.billed_quantity || 0),
                    unit_price: Number(detail.unit_cost || 0),
                    type: detail.id_product ? 'product' : 'service',
                }))
                .filter((r: any) => r.quantity > 0);

            if (newRows.length > 0) {
                setRows(newRows);
            } else {
                setRows([
                    {
                        id: Date.now(),
                        id_product: '',
                        description: '',
                        quantity: 1,
                        unit_price: 0,
                        type: 'product',
                    },
                ]);
                setFormError(
                    'Esta Orden de Compra ya ha sido facturada en su totalidad.',
                );
            }
        }
    };

    const symbol = data.currency === 'USD' ? '$' : 'S/';

    const baseImponible = useMemo(
        () => rows.reduce((acc, row) => acc + row.quantity * row.unit_price, 0),
        [rows],
    );
    const igvAmount = baseImponible * 0.18;
    const totalAmount = baseImponible + igvAmount;
    const totalInSoles =
        data.currency === 'USD'
            ? totalAmount * Number(data.exchange_rate)
            : totalAmount;

    // --- DEVOLUCIONES ---
    const openReturnModal = () => {
        if (!receipt?.details) return;
        const items = receipt.details
            .map((d: any) => ({
                id_product: d.id_product,
                description: d.description,
                display_name: d.product
                    ? d.product.product_name
                    : d.description,
                max: Number(d.quantity),
                return_quantity: Number(d.quantity),
                unit_price: Number(d.unit_price),
            }))
            .filter((i: any) => i.max > 0);
        setReturnItems(items);
        setIsReturnModalOpen(true);
    };

    const handleReturnQtyChange = (index: number, val: string) => {
        const newItems = [...returnItems];
        let num = Number(val);
        if (num < 0) num = 0;
        if (num > newItems[index].max) num = newItems[index].max;
        newItems[index].return_quantity = num;
        setReturnItems(newItems);
    };

    const submitReturn = () => {
        if (!receipt?.id_receipt) return;
        router.post(
            `/recibos/${receipt.id_receipt}/devolver`,
            { return_items: returnItems },
            {
                preserveScroll: true,
                onSuccess: () => setIsReturnModalOpen(false),
                onError: (err) => setFormError(Object.values(err)[0] as string),
            },
        );
    };

    // --- GUARDAR Y PUBLICAR ---
    const handleCurrencyChange = (val: string) =>
        setData((prev) => ({
            ...prev,
            currency: val,
            exchange_rate: val === 'PEN' ? '1.000' : '3.800',
        }));

    const updateRow = (id: number, field: keyof DetailRow, value: any) =>
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );

    const supplierOptions = suppliers.map((s: any) => ({
        value: String(s.id_supplier),
        label: s.company_name,
    }));

    const productOptions = products.map((p: any) => ({
        value: String(p.id_product),
        label: p.product_code
            ? `[${p.product_code}] ${p.product_name}`
            : p.product_name,
    }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setFormError(null);
        transform((currData) => ({
            ...currData,
            issue_date: format(currData.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            exchange_rate: parseFloat(String(currData.exchange_rate)),
            details: rows.map((r) => ({
                id_product: r.id_product || null,
                description: r.id_product ? null : r.description,
                quantity: r.quantity,
                unit_price: r.unit_price,
                is_service: r.type === 'service',
            })),
        }));
        post(receiptsRoute.store().url, { forceFormData: true });
    };

    const publishReceipt = () => {
        if (!receipt?.id_receipt) return;
        router.post(
            `/recibos/${receipt.id_receipt}/publish`,
            {},
            { preserveScroll: true },
        );
    };

    const executeDelete = () => {
        if (!receipt?.id_receipt) return;
        router.delete(`/recibos/${receipt.id_receipt}`);
    };

    // --- CHATTER ---
    const submitNote = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!internalNote.trim() || !receipt?.id_receipt) return;
        router.post(
            `/recibos/${receipt.id_receipt}/nota`,
            { internal_note: internalNote },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setInternalNote('');
                    setIsWritingNote(false);
                    setShowSuccess(true);
                },
                onError: (err: any) =>
                    setFormError(err.internal_note || 'Error al guardar nota'),
            },
        );
    };

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Comprobantes', href: receiptsRoute.index().url },
                { title: receipt?.receipt_code || 'Nuevo' },
            ]}
        >
            <Head title={receipt?.receipt_code || 'Nuevo Comprobante'} />
            <FloatingAlert
                message={flash.success || formError || errors.error}
                type={flash.success ? 'success' : 'error'}
            />

            <form
                onSubmit={submit}
                className="flex h-full flex-col overflow-hidden bg-background"
            >
                {/* TOOLBAR */}
                <div className="sticky top-0 z-20 flex shrink-0 flex-col border-b border-border bg-card">
                    <div className="flex items-center justify-between px-6 py-3">
                        {/* Botones Izquierda */}
                        <div className="flex items-center gap-2">
                            {isPublished ? (
                                receipt?.document_type !== 'credit_note' && (
                                    <Button
                                        type="button"
                                        onClick={openReturnModal}
                                        className="h-8 bg-red-600 font-bold text-white shadow-md transition-colors hover:bg-red-700"
                                    >
                                        <Undo2 className="mr-2 h-4 w-4" /> Nota
                                        de Crédito
                                    </Button>
                                )
                            ) : (
                                <>
                                    <Button
                                        type="submit"
                                        disabled={!isDirty || processing}
                                        className="h-8 bg-blue-600 font-bold text-white shadow-md transition-colors hover:bg-blue-700"
                                    >
                                        <Save className="mr-2 h-4 w-4" />{' '}
                                        Guardar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => reset()}
                                        disabled={!isDirty}
                                        className="h-8"
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />{' '}
                                        Descartar
                                    </Button>
                                    {receipt?.id_receipt && (
                                        <Button
                                            type="button"
                                            onClick={publishReceipt}
                                            disabled={isDirty || processing}
                                            className="h-8 bg-emerald-600 font-bold text-white shadow-md transition-colors hover:bg-emerald-700"
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />{' '}
                                            Publicar
                                        </Button>
                                    )}
                                    {receipt?.id_receipt && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setIsDeleteAlertOpen(true)
                                            }
                                            className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Botones Derecha: Smart Buttons + Estado */}
                        <div className="flex items-center gap-3">
                            <div className="flex gap-2 px-4 py-1">
                                {/* Smart Button: OC o Venta (maestro) */}
                                {masterDocument && masterDocument.url && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.get(masterDocument.url)
                                        }
                                        className="group flex h-9 min-w-[120px] flex-col items-start gap-0 border-amber-200 bg-amber-50/30 px-3 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100"
                                    >
                                        <PackageCheck className="mr-2 h-4 w-4 text-amber-600" />
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-[8px] leading-none font-bold text-muted-foreground uppercase">
                                                {masterDocument.type}
                                            </span>
                                            <span className="text-[10px] leading-tight font-black text-amber-700">
                                                {masterDocument.code}
                                            </span>
                                        </div>
                                    </Button>
                                )}
                                {isDirty && (
                                    <span className="mr-2 animate-pulse text-center text-[10px] font-black tracking-widest text-amber-500 uppercase">
                                        Cambios sin guardar
                                    </span>
                                )}

                                {/* Smart Button: OC PADRE (Precargada o seleccionada si no estamos editando) */}
                                {!receipt?.id_receipt &&
                                    (preloadedData?.order || selectedPo) && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                router.get(
                                                    `/compras/ordenes/${
                                                        preloadedData?.order
                                                            ?.id_purchase_order ||
                                                        selectedPo?.id_purchase_order
                                                    }`,
                                                )
                                            }
                                            className="group flex h-9 min-w-[120px] flex-col items-start gap-0 border-amber-200 bg-amber-50/30 px-3 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100"
                                        >
                                            <span className="mb-1 text-[8px] leading-none font-bold text-muted-foreground uppercase group-hover:text-amber-600">
                                                Documento Origen
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] leading-tight font-black text-amber-700">
                                                <PackageCheck className="h-3 w-3 stroke-[3px]" />{' '}
                                                {preloadedData?.order
                                                    ?.po_code ||
                                                    selectedPo?.po_code}
                                            </span>
                                        </Button>
                                    )}

                                {/* Smart Button: Origen (Si es Devolución) */}
                                {parentReference && parentReference.url && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.get(parentReference.url)
                                        }
                                        className="group flex h-9 min-w-[120px] flex-col items-start gap-0 border-emerald-200 bg-emerald-50/30 px-3 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-100"
                                    >
                                        <Undo2 className="mr-2 h-4 w-4 text-emerald-600" />
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-[8px] leading-none font-bold text-muted-foreground uppercase">
                                                Origen
                                            </span>
                                            <span className="text-[10px] leading-tight font-black text-emerald-700">
                                                {parentReference.code}
                                            </span>
                                        </div>
                                    </Button>
                                )}
                                {/* Smart Button: Hijos (Si tiene Devoluciones) */}
                                {returnsCount > 0 && receipt?.receipt_code && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.get('/recibos', {
                                                search: receipt.receipt_code,
                                            })
                                        }
                                        className="group flex h-9 min-w-[120px] flex-col items-start gap-0 border-blue-200 bg-blue-50/30 px-3 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-100"
                                    >
                                        <History className="mr-2 h-4 w-4 text-blue-600" />
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-[8px] leading-none font-bold text-muted-foreground uppercase">
                                                Notas Crédito
                                            </span>
                                            <span className="text-[10px] leading-tight font-black text-blue-700">
                                                {returnsCount} Docs
                                            </span>
                                        </div>
                                    </Button>
                                )}
                            </div>

                            {/* Status Indicator */}
                            <div className="flex h-9 items-center overflow-hidden rounded-md border border-border bg-muted/30 text-[10px] font-bold uppercase">
                                <div
                                    className={cn(
                                        'flex h-full items-center px-4 transition-colors',
                                        !isPublished
                                            ? 'bg-blue-600/10 text-blue-600'
                                            : 'text-muted-foreground opacity-50',
                                    )}
                                >
                                    Borrador
                                </div>
                                <div
                                    className={cn(
                                        'flex h-full items-center border-l border-border px-4 transition-colors',
                                        isPublished
                                            ? 'bg-emerald-600/10 text-emerald-600'
                                            : 'text-muted-foreground opacity-50',
                                    )}
                                >
                                    Publicado
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
                        <div className="w-full space-y-8">
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-500 opacity-80" />
                                <h1 className="text-3xl font-black tracking-tighter uppercase">
                                    {receipt?.receipt_code ||
                                        'NUEVO COMPROBANTE'}
                                </h1>
                            </div>

                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className="mb-8 flex h-auto w-full shrink-0 justify-start rounded-none border-b bg-transparent p-0">
                                    <TabsTrigger
                                        value="general"
                                        className="rounded-none border-b-2 border-transparent px-8 py-4 text-sm font-bold text-muted-foreground uppercase data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
                                    >
                                        Información General
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="files"
                                        className="rounded-none border-b-2 border-transparent px-8 py-4 text-sm font-bold text-muted-foreground uppercase data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
                                    >
                                        Archivos Adjuntos
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent
                                    value="general"
                                    className="animate-in space-y-12 duration-300 fade-in"
                                >
                                    <div className="grid grid-cols-1 gap-x-20 gap-y-2 pt-4 xl:grid-cols-2">
                                        <div className="space-y-1">
                                            {/* Selector de Documento Origen (OC) SOLO si es creacion */}
                                            {!receipt?.id_receipt && (
                                                <FormFieldRow label="Doc. Origen (OC)">
                                                    {preloadedData?.order ? (
                                                        <div className="relative">
                                                            <LinkIcon className="absolute top-2.5 left-0 h-3.5 w-3.5 text-blue-500" />
                                                            <Input
                                                                value={
                                                                    preloadedData
                                                                        .order
                                                                        .po_code
                                                                }
                                                                disabled
                                                                className={cn(
                                                                    cleanInputClass,
                                                                    'pl-6 font-mono font-bold text-blue-600 opacity-100',
                                                                )}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <SearchableSelect
                                                            options={poOptions}
                                                            value={String(
                                                                data.id_purchase_order ||
                                                                    '',
                                                            )}
                                                            onChange={
                                                                handlePoChange
                                                            }
                                                            placeholder="Buscar orden de compra..."
                                                        />
                                                    )}
                                                </FormFieldRow>
                                            )}

                                            <FormFieldRow label="Proveedor">
                                                <SearchableSelect
                                                    options={supplierOptions}
                                                    value={data.id_supplier}
                                                    onChange={(val) =>
                                                        setData(
                                                            'id_supplier',
                                                            val,
                                                        )
                                                    }
                                                    className={'text-sm'}
                                                />
                                                <InputError
                                                    message={errors.id_supplier}
                                                />
                                            </FormFieldRow>
                                            <FormFieldRow label="Tipo Doc">
                                                <Select
                                                    value={data.document_type} // Este es el vínculo clave
                                                    onValueChange={(val) =>
                                                        setData(
                                                            'document_type',
                                                            val,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            cleanInputClass
                                                        }
                                                    >
                                                        <SelectValue placeholder="Seleccionar..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {documentTypes.map(
                                                            (dt: any) => (
                                                                <SelectItem
                                                                    key={
                                                                        dt.value
                                                                    }
                                                                    value={
                                                                        dt.value
                                                                    }
                                                                >
                                                                    {dt.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        errors.document_type
                                                    }
                                                />
                                            </FormFieldRow>
                                            <div className="grid grid-cols-2 gap-8">
                                                <FormFieldRow label="Serie">
                                                    <Input
                                                        value={data.series}
                                                        onChange={(e) =>
                                                            setData(
                                                                'series',
                                                                e.target.value.toUpperCase(),
                                                            )
                                                        }
                                                        placeholder="F001"
                                                        className={cn(
                                                            cleanInputClass,
                                                            'text-center font-bold',
                                                        )}
                                                    />
                                                </FormFieldRow>
                                                <FormFieldRow label="Número">
                                                    <Input
                                                        value={data.number}
                                                        onChange={(e) =>
                                                            setData(
                                                                'number',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="000123"
                                                        className={cn(
                                                            cleanInputClass,
                                                            'font-bold',
                                                        )}
                                                    />
                                                </FormFieldRow>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <FormFieldRow label="Fecha Emisión">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                cleanInputClass,
                                                                'text-left',
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                                            {format(
                                                                data.issue_date,
                                                                'PPP',
                                                                { locale: es },
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-auto p-0"
                                                        align="start"
                                                    >
                                                        <Calendar
                                                            mode="single"
                                                            selected={
                                                                data.issue_date
                                                            }
                                                            onSelect={(d) =>
                                                                d &&
                                                                setData(
                                                                    'issue_date',
                                                                    d,
                                                                )
                                                            }
                                                            disabled={(date) =>
                                                                date >
                                                                new Date()
                                                            }
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormFieldRow>
                                            <FormFieldRow label="Moneda">
                                                <Select
                                                    value={data.currency} // Debe ser "USD" o "PEN"
                                                    onValueChange={
                                                        handleCurrencyChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            cleanInputClass
                                                        }
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
                                            <FormFieldRow label="T. Cambio">
                                                <div className="relative">
                                                    <ArrowRightLeft className="absolute top-2.5 left-0 h-3.5 w-3.5 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        step="0.001"
                                                        value={
                                                            data.exchange_rate
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'exchange_rate',
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            data.currency ===
                                                            'PEN'
                                                        }
                                                        className={cn(
                                                            data.currency ===
                                                                'PEN'
                                                                ? disabledInputClass
                                                                : cleanInputClass,
                                                            'pl-8',
                                                        )}
                                                    />
                                                </div>
                                            </FormFieldRow>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b pb-2">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                Glosa / Descripción del
                                                Comprobante
                                            </span>
                                        </div>
                                        <Textarea
                                            value={data.glosa}
                                            onChange={(e) =>
                                                setData('glosa', e.target.value)
                                            }
                                            placeholder="Describa brevemente el motivo..."
                                            className={cn(
                                                'min-h-[80px] resize-none bg-muted/5 transition-colors focus:bg-background',
                                            )}
                                        />
                                    </div>

                                    <div className="pt-6 pb-12">
                                        <div className="mb-4 border-b border-border text-sm font-bold text-muted-foreground">
                                            <span className="border-b-2 border-blue-600 pb-2 tracking-widest text-foreground uppercase">
                                                Detalle del Comprobante
                                            </span>
                                        </div>
                                        <div
                                            className={cn(
                                                'overflow-hidden rounded-sm border bg-card shadow-sm',
                                                errors.details &&
                                                    'border-red-500',
                                            )}
                                        >
                                            <Table className="w-full table-fixed">
                                                <TableHeader className="bg-muted/30">
                                                    <TableRow>
                                                        <TableHead className="w-[55%] px-4 text-[10px] font-bold uppercase">
                                                            Producto /
                                                            Descripción
                                                        </TableHead>
                                                        <TableHead className="w-[10%] text-center text-[10px] font-bold uppercase">
                                                            Cant.
                                                        </TableHead>
                                                        <TableHead className="w-[15%] px-4 text-center text-[10px] font-bold uppercase">
                                                            Costo Unit ({symbol}
                                                            )
                                                        </TableHead>
                                                        <TableHead className="w-[15%] px-4 text-right text-[10px] font-bold uppercase">
                                                            Línea Subtotal
                                                        </TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className="divide-y divide-border/50">
                                                    {rows.map((row, i) => (
                                                        <TableRow
                                                            key={row.id}
                                                            className="group transition-colors hover:bg-muted/5"
                                                        >
                                                            <TableCell className="px-4 py-2">
                                                                <div className="flex items-center gap-3">
                                                                    {row.type ===
                                                                    'service' ? (
                                                                        <Briefcase className="h-4 w-4 shrink-0 text-purple-500" />
                                                                    ) : (
                                                                        <Box className="h-4 w-4 shrink-0 text-blue-500" />
                                                                    )}
                                                                    {row.type ===
                                                                    'service' ? (
                                                                        <Input
                                                                            value={
                                                                                row.description ||
                                                                                ''
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateRow(
                                                                                    row.id,
                                                                                    'description',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            placeholder="Descripción del servicio..."
                                                                            className="h-8 w-full border-transparent bg-transparent text-left shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-purple-500"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex-1">
                                                                            <SearchableSelect
                                                                                options={
                                                                                    productOptions
                                                                                }
                                                                                value={
                                                                                    row.id_product ||
                                                                                    ''
                                                                                }
                                                                                onChange={(
                                                                                    val,
                                                                                ) =>
                                                                                    updateRow(
                                                                                        row.id,
                                                                                        'id_product',
                                                                                        val,
                                                                                    )
                                                                                }
                                                                                placeholder="Seleccionar producto..."
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-2 py-2">
                                                                <Input
                                                                    type="number"
                                                                    className={cn(
                                                                        tableInputClass,
                                                                        'text-center',
                                                                    )}
                                                                    value={
                                                                        row.quantity
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            row.id,
                                                                            'quantity',
                                                                            parseFloat(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        )
                                                                    }
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="px-4 py-2">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className={cn(
                                                                        tableInputClass,
                                                                        'text-blue-600',
                                                                    )}
                                                                    value={
                                                                        row.unit_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            row.id,
                                                                            'unit_price',
                                                                            parseFloat(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        )
                                                                    }
                                                                    min="0"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="pr-4 text-right text-sm font-bold tabular-nums">
                                                                {symbol}{' '}
                                                                {(
                                                                    row.quantity *
                                                                    row.unit_price
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="p-0 text-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    type="button"
                                                                    className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
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
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="flex items-start justify-between pt-4 pb-12">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    type="button"
                                                    onClick={() =>
                                                        setRows([
                                                            ...rows,
                                                            {
                                                                id: Date.now(),
                                                                id_product: '',
                                                                description: '',
                                                                quantity: 1,
                                                                unit_price: 0,
                                                                type: 'product',
                                                            },
                                                        ])
                                                    }
                                                    className="text-[10px] font-bold text-blue-600 uppercase hover:bg-blue-50"
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />{' '}
                                                    Añadir Producto
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    type="button"
                                                    onClick={() =>
                                                        setRows([
                                                            ...rows,
                                                            {
                                                                id:
                                                                    Date.now() +
                                                                    1,
                                                                id_product:
                                                                    null,
                                                                description: '',
                                                                quantity: 1,
                                                                unit_price: 0,
                                                                type: 'service',
                                                            },
                                                        ])
                                                    }
                                                    className="text-[10px] font-bold text-purple-600 uppercase hover:bg-purple-50"
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />{' '}
                                                    Añadir Servicio
                                                </Button>
                                            </div>

                                            <div className="w-full max-w-xs space-y-2 rounded-xl border bg-muted/10 p-5 shadow-inner">
                                                <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase">
                                                    <span>Base Imponible</span>
                                                    <span className="font-mono">
                                                        {symbol}{' '}
                                                        {baseImponible.toFixed(
                                                            2,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase">
                                                    <span>IGV (18%)</span>
                                                    <span className="font-mono">
                                                        {symbol}{' '}
                                                        {igvAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-t border-blue-200 pt-3 text-lg font-black tracking-tighter text-blue-600 uppercase">
                                                    <span>Total</span>
                                                    <span className="tabular-nums">
                                                        {symbol}{' '}
                                                        {totalAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                {data.currency === 'USD' && (
                                                    <div className="mt-2 flex justify-between text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                                                        <span>
                                                            Equiv. Soles (T.C.{' '}
                                                            {data.exchange_rate}
                                                            )
                                                        </span>
                                                        <span>
                                                            S/{' '}
                                                            {totalInSoles.toFixed(
                                                                2,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent
                                    value="files"
                                    className="animate-in duration-300 fade-in"
                                >
                                    <div className="rounded-2xl border-2 border-dashed p-12 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/10">
                                        <FileText className="mx-auto mb-4 h-12 w-12 text-blue-500/50" />
                                        <div className="relative inline-block">
                                            <Button
                                                type="button"
                                                className="bg-blue-600 font-bold text-white"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />{' '}
                                                Subir Archivo
                                            </Button>
                                            <input
                                                type="file"
                                                className="absolute inset-0 cursor-pointer opacity-0"
                                                onChange={(e) =>
                                                    setData(
                                                        'file',
                                                        e.target.files?.[0] ||
                                                            null,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* ✅ CHATTER Y LOGS */}
                    <div className="hidden h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10 xl:flex">
                        <div className="z-10 flex shrink-0 items-center gap-1 border-b border-border bg-card p-2 shadow-sm">
                            <Button
                                variant="ghost"
                                type="button"
                                className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                            >
                                Enviar mensaje
                            </Button>
                        </div>
                        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
                            <div className="relative space-y-6 border-l-2 border-border pl-6">
                                <div className="text-sm">
                                    <div className="absolute top-0 -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-background">
                                        <History className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="font-bold text-foreground">
                                            Sistema
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Ahora
                                        </span>
                                    </div>
                                    <p className="leading-relaxed text-muted-foreground italic">
                                        Creando borrador de Comprobante. El
                                        historial y las notas se guardarán en la
                                        base de datos al presionar "Registrar
                                        Comprobante".
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* MODALES: DEVOLUCIÓN */}
            <AlertDialog
                open={isReturnModalOpen}
                onOpenChange={setIsReturnModalOpen}
            >
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Undo2 className="h-5 w-5 text-red-500" /> Generar
                            Nota de Crédito
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Especifique la cantidad a devolver de cada ítem.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="my-4 max-h-[50vh] overflow-y-auto rounded-md border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase">
                                        Producto/Servicio
                                    </TableHead>
                                    <TableHead className="w-24 text-center text-xs font-bold uppercase">
                                        Facturado
                                    </TableHead>
                                    <TableHead className="w-32 text-center text-xs font-black text-red-600 uppercase">
                                        A Devolver
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {returnItems.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="text-sm font-medium">
                                            {item.display_name}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground tabular-nums">
                                            {item.max}
                                        </TableCell>
                                        <TableCell className="bg-red-50/30 p-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                max={item.max}
                                                step="0.01"
                                                value={item.return_quantity}
                                                onChange={(e) =>
                                                    handleReturnQtyChange(
                                                        idx,
                                                        e.target.value,
                                                    )
                                                }
                                                className="mx-auto h-8 w-20 border-red-200 text-center font-bold text-red-600 focus:border-red-500"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setIsReturnModalOpen(false)}
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <Button
                            onClick={submitReturn}
                            disabled={returnItems.every(
                                (i) => i.return_quantity === 0,
                            )}
                            className="bg-red-600 font-bold text-white hover:bg-red-700"
                        >
                            Confirmar Nota de Crédito
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* MODALES: ELIMINAR */}
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Eliminar comprobante?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Se revertirá el monto facturado en la Orden y se
                            perderá el vínculo contable.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
