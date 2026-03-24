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
    Download,
    FileText,
    History,
    MessageSquare,
    PackageCheck,
    Plus,
    RotateCcw,
    Save,
    Trash2,
    Undo2,
    User,
    X,
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

interface PageProps {
    receipt: any;
    returnsCount?: number;
    parentReference?: { id: number; code: string; url: string } | null;
    masterDocument?: { type: string; code: string; url: string } | null;
    products: any[];
    documentTypes: any[];
    suppliers: any[];
}

export default function EditReceipt({
    receipt,
    returnsCount = 0,
    parentReference,
    masterDocument,
    products,
    documentTypes,
    suppliers,
}: PageProps) {
    const { props } = usePage<any>();
    const { flash = {} } = props;

    const isPublished = receipt.status === 'published';

    const [internalNote, setInternalNote] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isWritingNote, setIsWritingNote] = useState(false);

    // Modales
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnItems, setReturnItems] = useState<any[]>([]);

    const { data, setData, processing, isDirty, reset } = useForm({
        id_supplier: String(receipt.id_supplier),
        document_type: receipt.document_type,
        currency: receipt.currency || 'PEN',
        exchange_rate: String(receipt.exchange_rate || '1.000'),
        series: receipt.series,
        number: receipt.number,
        issue_date: new Date(receipt.issue_date),
        glosa: receipt.glosa || '',
        file: null as File | null,
    });

    const rows = useMemo(
        () =>
            receipt.details.map((d: any) => ({
                id_product: d.id_product,
                display_name: d.product
                    ? d.product.product_name
                    : d.description,
                quantity: Number(d.quantity),
                unit_price: Number(d.unit_price),
                subtotal: Number(d.quantity) * Number(d.unit_price),
                type: d.id_product ? 'product' : 'service',
            })),
        [receipt.details],
    );

    const symbol = data.currency === 'USD' ? '$' : 'S/';
    const baseImponible = useMemo(
        () => rows.reduce((acc: number, row: any) => acc + row.subtotal, 0),
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

    const supplierOptions = suppliers.map((s: any) => ({
        value: String(s.id_supplier),
        label: s.company_name,
    }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setFormError(null);

        const formData = new FormData();
        formData.append('_method', 'put');
        formData.append('id_supplier', data.id_supplier);
        formData.append('document_type', data.document_type);
        formData.append('currency', data.currency);
        formData.append('exchange_rate', data.exchange_rate);
        formData.append('series', data.series);
        formData.append('number', data.number);
        formData.append('glosa', data.glosa);
        formData.append(
            'issue_date',
            format(data.issue_date, 'yyyy-MM-dd HH:mm:ss'),
        );
        if (data.file) formData.append('file', data.file);

        rows.forEach((row: any, index: number) => {
            formData.append(
                `details[${index}][id_product]`,
                row.id_product || '',
            );
            formData.append(
                `details[${index}][description]`,
                row.id_product ? '' : row.display_name,
            );
            formData.append(
                `details[${index}][quantity]`,
                row.quantity.toString(),
            );
            formData.append(
                `details[${index}][unit_price]`,
                row.unit_price.toString(),
            );
            formData.append(
                `details[${index}][is_service]`,
                row.type === 'service' ? '1' : '0',
            );
        });

        router.post(`/recibos/${receipt.id_receipt}`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccess(true);
                reset();
            },
            onError: (errors) => {
                if (errors.error) {
                    setFormError(errors.error);
                } else {
                    const firstError = Object.values(errors)[0];
                    setFormError(
                        firstError || 'Error inesperado en el servidor.',
                    );
                }
            },
        });
    };

    const publishReceipt = () => {
        router.post(
            `/recibos/${receipt.id_receipt}/publish`,
            {},
            { preserveScroll: true },
        );
    };

    const executeDelete = () => router.delete(`/recibos/${receipt.id_receipt}`);

    // --- CHATTER ---
    const submitNote = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!internalNote.trim()) return;
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
                { title: 'Comprobantes', href: '/recibos' },
                { title: receipt.receipt_code },
            ]}
        >
            <Head title={receipt.receipt_code} />
            <FloatingAlert
                message={flash.success || formError}
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
                            {isDirty && (
                                <span className="mr-2 animate-pulse text-[10px] font-black tracking-widest text-amber-500 uppercase">
                                    Cambios sin guardar
                                </span>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => reset()}
                                disabled={!isDirty}
                                className="h-8"
                            >
                                Descartar
                            </Button>
                            <Button
                                type="submit"
                                disabled={!isDirty || processing}
                                className="h-8 bg-blue-600 font-bold text-white shadow-md transition-colors hover:bg-blue-700"
                            >
                                <Save className="mr-2 h-4 w-4" /> Guardar
                            </Button>

                            {/* Botón Nota de Crédito (Solo aparece si ESTÁ publicado y no es una nota en sí) */}
                            {isPublished &&
                                receipt.document_type == 'credit_note' &&
                                receipt.document_type !== 'credit_note' && (
                                    <Button
                                        type="button"
                                        onClick={openReturnModal}
                                        className="h-8 bg-red-600 font-bold text-white shadow-md transition-colors hover:bg-red-700"
                                    >
                                        <Undo2 className="mr-2 h-4 w-4" /> Nota
                                        de Crédito
                                    </Button>
                                )}

                            {/* Botón Publicar (Solo aparece si NO está publicado) */}
                            {!isPublished && (
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

                            {/* Botón Eliminar (Siempre visible) */}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDeleteAlertOpen(true)}
                                className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Botones Derecha: Smart Buttons + Estado */}
                        <div className="flex items-center gap-3">
                            <div className="flex gap-2">
                                {/* Smart Button: OC o Venta */}
                                {masterDocument && masterDocument.url && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.get(masterDocument.url)
                                        }
                                        className="h-9 border-amber-200 bg-amber-50/30 px-3 hover:border-amber-300 hover:bg-amber-100"
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
                                {/* Smart Button: Origen (Si es Devolución) */}
                                {parentReference && parentReference.url && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.get(parentReference.url)
                                        }
                                        className="h-9 border-emerald-200 bg-emerald-50/30 px-3 hover:border-emerald-300 hover:bg-emerald-100"
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
                                {returnsCount > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.get('/recibos', {
                                                search: receipt.receipt_code,
                                            })
                                        }
                                        className="h-9 border-blue-200 bg-blue-50/30 px-3 hover:border-blue-300 hover:bg-blue-100"
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
                    {/* FORMULARIO IZQUIERDA */}
                    <div className="custom-scrollbar flex-1 overflow-y-auto border-r border-border p-8">
                        <div className="w-full space-y-8">
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-500 opacity-80" />
                                <h1 className="text-3xl font-black tracking-tighter uppercase">
                                    {receipt.receipt_code}
                                </h1>
                            </div>

                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className="mb-8 h-auto w-full shrink-0 justify-start rounded-none border-b bg-transparent p-0">
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
                                            <FormFieldRow label="Proveedor">
                                                {isPublished ? (
                                                    <Input
                                                        value={
                                                            receipt.supplier
                                                                ?.company_name
                                                        }
                                                        disabled
                                                        className={
                                                            disabledInputClass
                                                        }
                                                    />
                                                ) : (
                                                    <SearchableSelect
                                                        options={
                                                            supplierOptions
                                                        }
                                                        value={data.id_supplier}
                                                        onChange={(val) =>
                                                            setData(
                                                                'id_supplier',
                                                                val,
                                                            )
                                                        }
                                                    />
                                                )}
                                            </FormFieldRow>
                                            <FormFieldRow label="Tipo Doc">
                                                <Select
                                                    value={data.document_type}
                                                    onValueChange={(val) =>
                                                        setData(
                                                            'document_type',
                                                            val,
                                                        )
                                                    }
                                                    disabled={isPublished}
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            isPublished
                                                                ? disabledInputClass
                                                                : cleanInputClass
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
                                            </FormFieldRow>
                                            <div className="grid grid-cols-2 gap-8">
                                                <FormFieldRow label="Serie">
                                                    <Input
                                                        value={data.series}
                                                        disabled={isPublished}
                                                        onChange={(e) =>
                                                            setData(
                                                                'series',
                                                                e.target.value.toUpperCase(),
                                                            )
                                                        }
                                                        placeholder="F001"
                                                        className={cn(
                                                            isPublished
                                                                ? disabledInputClass
                                                                : cleanInputClass,
                                                            'text-center font-bold',
                                                        )}
                                                    />
                                                </FormFieldRow>
                                                <FormFieldRow label="Número">
                                                    <Input
                                                        value={data.number}
                                                        disabled={isPublished}
                                                        onChange={(e) =>
                                                            setData(
                                                                'number',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="000123"
                                                        className={cn(
                                                            isPublished
                                                                ? disabledInputClass
                                                                : cleanInputClass,
                                                            'font-bold',
                                                        )}
                                                    />
                                                </FormFieldRow>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <FormFieldRow label="Fecha Facturación">
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
                                                    value={data.currency}
                                                    onValueChange={
                                                        handleCurrencyChange
                                                    }
                                                    disabled={isPublished}
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            isPublished
                                                                ? disabledInputClass
                                                                : cleanInputClass
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
                                                                'PEN' ||
                                                            isPublished
                                                        }
                                                        className={cn(
                                                            isPublished
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
                                            disabled={isPublished}
                                            onChange={(e) =>
                                                setData('glosa', e.target.value)
                                            }
                                            placeholder="Describa brevemente el motivo..."
                                            className={cn(
                                                'min-h-[80px] resize-none bg-muted/5 transition-colors focus:bg-background',
                                                isPublished &&
                                                    'cursor-not-allowed border-dashed opacity-70',
                                            )}
                                        />
                                    </div>

                                    <div className="pt-6 pb-12">
                                        <div className="mb-4 border-b border-border text-sm font-bold text-muted-foreground">
                                            <span className="border-b-2 border-blue-600 pb-2 tracking-widest text-foreground uppercase">
                                                Detalle del Comprobante
                                            </span>
                                        </div>
                                        <div className="overflow-hidden rounded-sm border bg-card shadow-sm">
                                            <Table className="w-full table-fixed">
                                                <TableHeader className="bg-muted/30">
                                                    <TableRow>
                                                        <TableHead className="w-[55%] px-4 text-[10px] font-bold uppercase">
                                                            Producto /
                                                            Descripción
                                                        </TableHead>
                                                        <TableHead className="w-[15%] text-center text-[10px] font-bold uppercase">
                                                            Cant.
                                                        </TableHead>
                                                        <TableHead className="w-[15%] px-4 text-center text-[10px] font-bold uppercase">
                                                            Costo Unit ({symbol}
                                                            )
                                                        </TableHead>
                                                        <TableHead className="w-[15%] px-4 text-right text-[10px] font-bold uppercase">
                                                            Subtotal
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className="divide-y divide-border/50">
                                                    {rows.map((row, i) => (
                                                        <TableRow
                                                            key={i}
                                                            className="transition-colors hover:bg-muted/5"
                                                        >
                                                            <TableCell className="px-4 py-2">
                                                                <div className="flex items-center gap-3">
                                                                    {row.type ===
                                                                    'product' ? (
                                                                        <Box className="h-4 w-4 shrink-0 text-blue-500" />
                                                                    ) : (
                                                                        <Briefcase className="h-4 w-4 shrink-0 text-purple-500" />
                                                                    )}
                                                                    <span className="truncate text-sm font-medium">
                                                                        {
                                                                            row.display_name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-2 py-2">
                                                                <Input
                                                                    type="number"
                                                                    value={
                                                                        row.quantity
                                                                    }
                                                                    disabled={
                                                                        isPublished
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
                                                                    className={cn(
                                                                        isPublished
                                                                            ? disabledInputClass
                                                                            : tableInputClass,
                                                                        'text-center',
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="px-4 py-2">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={
                                                                        row.unit_price
                                                                    }
                                                                    disabled={
                                                                        isPublished
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
                                                                    className={cn(
                                                                        isPublished
                                                                            ? disabledInputClass
                                                                            : tableInputClass,
                                                                        'text-blue-600',
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="pr-4 text-right text-sm font-bold tabular-nums">
                                                                {symbol}{' '}
                                                                {row.subtotal.toFixed(
                                                                    2,
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="flex justify-end pt-4 pb-10">
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
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent
                                    value="files"
                                    className="animate-in duration-300 fade-in"
                                >
                                    <div
                                        className={cn(
                                            'rounded-2xl border-2 border-dashed p-12 text-center transition-colors',
                                            data.file
                                                ? 'border-blue-500 bg-blue-50/20'
                                                : 'hover:border-blue-400 hover:bg-blue-50/10 dark:hover:bg-blue-900/5',
                                        )}
                                    >
                                        <FileText
                                            className={cn(
                                                'mx-auto mb-4 h-12 w-12',
                                                data.file
                                                    ? 'text-blue-600'
                                                    : 'text-blue-500/50',
                                            )}
                                        />

                                        {/* 1. Si el usuario seleccionó un archivo nuevo (Aún no guardado) */}
                                        {data.file ? (
                                            <div className="space-y-4">
                                                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                                                    <span className="text-xs font-black uppercase">
                                                        Archivo por subir:
                                                    </span>
                                                    <p className="max-w-md truncate text-sm font-bold">
                                                        {data.file.name}
                                                    </p>
                                                </div>
                                                <p className="animate-pulse text-xs text-muted-foreground">
                                                    Haga clic en "Guardar
                                                    cambios" para procesar la
                                                    subida.
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() =>
                                                        setData('file', null)
                                                    }
                                                >
                                                    <X className="mr-1 h-3 w-3" />{' '}
                                                    Cancelar selección
                                                </Button>
                                            </div>
                                        ) : receipt.receipt_path ? (
                                            /* 2. Si ya hay un archivo en el servidor y no se ha seleccionado uno nuevo */
                                            <div className="space-y-4">
                                                <p className="mx-auto max-w-md truncate text-sm font-bold text-foreground">
                                                    {receipt.receipt_path
                                                        .split('/')
                                                        .pop()}
                                                </p>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <a
                                                            href={`/storage/${receipt.receipt_path}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <Download className="mr-2 h-4 w-4" />{' '}
                                                            Descargar
                                                        </a>
                                                    </Button>

                                                    <div className="relative">
                                                        <Button
                                                            type="button"
                                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />{' '}
                                                            Reemplazar
                                                        </Button>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,image/*"
                                                            className="absolute inset-0 cursor-pointer opacity-0"
                                                            onChange={(e) =>
                                                                setData(
                                                                    'file',
                                                                    e.target
                                                                        .files?.[0] ||
                                                                        null,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* 3. Estado totalmente vacío */
                                            <div className="space-y-2">
                                                <p className="mb-2 text-sm text-muted-foreground">
                                                    No hay un archivo adjunto
                                                    para este comprobante
                                                </p>
                                                <p className="mb-4 text-[10px] font-medium tracking-wider text-blue-600/60 uppercase">
                                                    Solo PDF o Imágenes (JPG,
                                                    PNG)
                                                </p>
                                                <div className="relative inline-block">
                                                    <Button
                                                        type="button"
                                                        className="bg-blue-600 font-bold text-white hover:bg-blue-700"
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />{' '}
                                                        Subir Archivo
                                                    </Button>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,image/*"
                                                        className="absolute inset-0 cursor-pointer opacity-0"
                                                        onChange={(e) =>
                                                            setData(
                                                                'file',
                                                                e.target
                                                                    .files?.[0] ||
                                                                    null,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* ✅ CHATTER Y LOGS */}
                    <div className="flex h-full w-[380px] shrink-0 flex-col bg-muted/10">
                        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card p-4 shadow-sm">
                            <span className="flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground uppercase">
                                <History className="h-3.5 w-3.5" /> Historial
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsWritingNote(!isWritingNote)}
                                className={cn(
                                    'h-7 text-[10px] font-bold uppercase transition-all',
                                    isWritingNote
                                        ? 'bg-muted'
                                        : 'text-muted-foreground',
                                )}
                            >
                                <MessageSquare className="mr-1.5 h-3 w-3" />{' '}
                                Registrar nota
                            </Button>
                        </div>

                        {isWritingNote && (
                            <div className="shrink-0 animate-in border-b border-border bg-background p-4 slide-in-from-top-2">
                                <textarea
                                    className="w-full resize-none rounded-md border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    rows={4}
                                    value={internalNote}
                                    onChange={(e) =>
                                        setInternalNote(e.target.value)
                                    }
                                    placeholder="Escribir nota interna..."
                                    autoFocus
                                />
                                <div className="mt-3 flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs"
                                        onClick={() => setIsWritingNote(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={submitNote}
                                        disabled={!internalNote.trim()}
                                        className="h-7 bg-blue-600 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                                    >
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="custom-scrollbar max-h-[calc(100vh-120px)] flex-1 space-y-6 overflow-y-auto p-6">
                            {receipt.logs?.length > 0 ? (
                                receipt.logs.map((log: any) => (
                                    <div
                                        key={log.id_receipt_log || log.id}
                                        className="relative ml-2 border-l-2 border-border pl-6 text-sm"
                                    >
                                        <div className="absolute top-0 -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-background">
                                            {log.action === 'Nota' ? (
                                                <MessageSquare className="h-2.5 w-2.5 text-blue-500" />
                                            ) : (
                                                <History className="h-2.5 w-2.5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="mr-2 flex items-center gap-1 truncate text-[10px] font-bold tracking-tight text-foreground uppercase">
                                                <User className="h-3 w-3" />{' '}
                                                {log.user?.name || 'Sistema'}
                                            </span>
                                            <span className="shrink-0 text-[10px] text-muted-foreground">
                                                {format(
                                                    new Date(log.created_at),
                                                    'dd/MM/yyyy HH:mm',
                                                )}
                                            </span>
                                        </div>
                                        <div
                                            className={cn(
                                                'mt-1 w-full overflow-hidden rounded-md border p-3 shadow-sm',
                                                log.action === 'Nota' ||
                                                    log.action ===
                                                        'Actualización'
                                                    ? 'border-border bg-white dark:bg-neutral-800'
                                                    : 'border-transparent bg-transparent text-muted-foreground italic',
                                            )}
                                        >
                                            <p className="text-xs leading-relaxed break-all whitespace-pre-wrap">
                                                {log.notes || log.action}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center py-20 opacity-20">
                                    <History className="mb-2 h-10 w-10" />
                                    <p className="text-[10px] font-bold tracking-widest uppercase">
                                        Sin actividad
                                    </p>
                                </div>
                            )}
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
