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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    BookText,
    Box,
    Briefcase,
    CheckCircle2,
    Download,
    FileText,
    History,
    Link as LinkIcon,
    Lock,
    MessageSquare,
    MoreVertical,
    Plus,
    Save,
    Trash2,
    Truck,
    User,
} from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium dark:text-foreground dark:border-neutral-700 dark:focus:border-blue-500';
const disabledInputClass =
    'h-9 w-full rounded-none border-0 border-b border-dashed border-muted-foreground/30 bg-transparent px-0 text-sm shadow-none focus:ring-0 cursor-not-allowed text-foreground font-semibold dark:border-neutral-700 dark:text-neutral-400';

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
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'border-red-500 bg-white text-red-900 dark:border-red-600 dark:bg-neutral-900 dark:text-red-200',
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

export default function EditReceipt({ receipt }: { receipt: any }) {
    const { props } = usePage<any>();
    const { flash = {}, errors: serverErrors } = props;

    const [internalNote, setInternalNote] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isWritingNote, setIsWritingNote] = useState(false);

    const { data, setData, processing, isDirty, reset } = useForm({
        id_supplier: String(receipt.id_supplier),
        document_type: receipt.document_type,
        currency: receipt.currency || 'PEN',
        exchange_rate: String(receipt.exchange_rate || '1.000'),
        series: receipt.series,
        number: receipt.number,
        issue_date: new Date(receipt.issue_date),
        glosa: receipt.glosa || '', // ✅ Nuevo campo Glosa
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setFormError(null);

        // ✅ Usamos router.post pero pasamos un objeto con los datos procesados
        // NO usamos JSON.stringify para que reset() funcione correctamente
        const detailsPayload = rows.map((row: any) => ({
            id_product: row.id_product || null,
            description: row.id_product ? '' : row.display_name,
            quantity: row.quantity,
            unit_price: row.unit_price,
            is_service: row.type === 'service',
        }));

        // Construimos el FormData manual para soportar el archivo y el método PUT
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

        // ✅ Enviamos los detalles como campos de array para que Laravel los entienda
        detailsPayload.forEach((item, index) => {
            formData.append(
                `details[${index}][id_product]`,
                item.id_product || '',
            );
            formData.append(
                `details[${index}][description]`,
                item.description || '',
            );
            formData.append(
                `details[${index}][quantity]`,
                item.quantity.toString(),
            );
            formData.append(
                `details[${index}][unit_price]`,
                item.unit_price.toString(),
            );
            formData.append(
                `details[${index}][is_service]`,
                item.is_service ? '1' : '0',
            );
        });

        router.post(`/recibos/${receipt.id_receipt}`, formData, {
            forceFormData: true,
            onSuccess: () => {
                setShowSuccess(true);
                // ✅ Esto ahora sí funcionará porque sincroniza el estado
                reset();
            },
            onError: (err) => {
                console.error('Errores:', err);
                setFormError('Error al procesar la actualización.');
            },
        });
    };

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
                    setFormError(
                        err.internal_note || 'Error al guardar la nota',
                    ),
            },
        );
    };

    const executeDelete = () => router.delete(`/recibos/${receipt.id_receipt}`);

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
                message={flash.success || serverErrors.error}
                type={flash.success ? 'success' : 'error'}
            />

            <form
                onSubmit={submit}
                className="flex h-full flex-col overflow-hidden bg-background"
            >
                <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b bg-card px-8 py-3 shadow-sm">
                    <div className="flex items-center gap-4">
                        <h1 className="flex items-center gap-2 font-mono text-lg font-bold tracking-tighter uppercase">
                            <BookText className="h-5 w-5 text-blue-500" />{' '}
                            {receipt.receipt_code}
                        </h1>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteAlertOpen(true)}
                                    className="cursor-pointer font-bold text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                    Registro
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-3">
                        {isDirty && (
                            <span className="animate-pulse text-[10px] font-black tracking-widest text-amber-500 uppercase">
                                Cambios sin guardar
                            </span>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => reset()}
                            disabled={!isDirty}
                        >
                            Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className="bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700"
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar
                        </Button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
                        <div className="w-full space-y-10">
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
                                    <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
                                        <div className="space-y-6">
                                            <h3 className="flex items-center gap-2 border-b pb-2 text-[10px] font-bold text-muted-foreground uppercase">
                                                <Truck className="h-4 w-4" />{' '}
                                                Datos Comerciales
                                            </h3>
                                            <FormFieldRow label="Proveedor">
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
                                            </FormFieldRow>
                                            <div className="grid grid-cols-2 gap-8">
                                                <FormFieldRow label="Moneda">
                                                    <Input
                                                        value={data.currency}
                                                        disabled
                                                        className={
                                                            disabledInputClass
                                                        }
                                                    />
                                                </FormFieldRow>
                                                <FormFieldRow label="T. Cambio">
                                                    <Input
                                                        value={
                                                            data.exchange_rate
                                                        }
                                                        disabled
                                                        className={
                                                            disabledInputClass
                                                        }
                                                    />
                                                </FormFieldRow>
                                            </div>
                                            {/* ✅ ORIGEN: Ahora muestra el código real de la orden */}
                                            {receipt.id_purchase_order && (
                                                <FormFieldRow label="Documento Origen">
                                                    <div className="relative">
                                                        <Input
                                                            value={
                                                                receipt
                                                                    .purchase_order
                                                                    ?.po_code ||
                                                                'N/A'
                                                            }
                                                            disabled
                                                            className={cn(
                                                                disabledInputClass,
                                                                'pl-6 font-mono font-bold text-blue-600 opacity-100',
                                                            )}
                                                        />
                                                    </div>
                                                </FormFieldRow>
                                            )}
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="flex items-center gap-2 border-b pb-2 text-[10px] font-bold text-muted-foreground uppercase">
                                                <FileText className="h-4 w-4" />{' '}
                                                Información Documento
                                            </h3>
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
                                                        className={
                                                            cleanInputClass
                                                        }
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
                                                        className={
                                                            cleanInputClass
                                                        }
                                                    />
                                                </FormFieldRow>
                                            </div>
                                            {/* ✅ FECHA: Ya no es editable */}
                                            <FormFieldRow label="Fecha Emisión">
                                                <div className="relative">
                                                    <Input
                                                        value={format(
                                                            new Date(
                                                                receipt.issue_date,
                                                            ),
                                                            'Pp',
                                                            { locale: es },
                                                        )}
                                                        disabled
                                                        className={
                                                            disabledInputClass
                                                        }
                                                    />
                                                    <Lock className="absolute top-2.5 right-0 h-3.5 w-3.5 text-muted-foreground/30" />
                                                </div>
                                            </FormFieldRow>
                                        </div>
                                    </div>

                                    {/* ✅ CAMPO GLOSA */}
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
                                            placeholder="Describa brevemente el motivo o contenido de este comprobante..."
                                            className="min-h-[80px] resize-none bg-muted/5 transition-colors focus:bg-background"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold tracking-tight text-slate-800 uppercase dark:text-neutral-200">
                                            Líneas del Comprobante
                                        </h3>
                                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm dark:border-neutral-800">
                                            <Table className="w-full table-fixed">
                                                <TableHeader className="bg-muted/30 dark:bg-neutral-900">
                                                    <TableRow>
                                                        <TableHead className="w-[80px] text-center text-[10px] font-bold uppercase">
                                                            Tipo
                                                        </TableHead>
                                                        <TableHead className="px-4 text-[10px] font-bold uppercase">
                                                            Descripción /
                                                            Producto
                                                        </TableHead>
                                                        <TableHead className="w-[100px] text-center text-[10px] font-bold uppercase">
                                                            Cant.
                                                        </TableHead>
                                                        <TableHead className="w-[120px] text-center text-[10px] font-bold uppercase">
                                                            Precio Unit.
                                                        </TableHead>
                                                        <TableHead className="w-[150px] pr-8 text-right text-[10px] font-bold uppercase">
                                                            Subtotal
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className="divide-y divide-border/50">
                                                    {rows.map(
                                                        (
                                                            row: any,
                                                            i: number,
                                                        ) => (
                                                            <TableRow
                                                                key={i}
                                                                className="transition-colors hover:bg-muted/10"
                                                            >
                                                                <TableCell className="text-center">
                                                                    {row.type ===
                                                                    'product' ? (
                                                                        <Box className="mx-auto h-4 w-4 text-blue-500" />
                                                                    ) : (
                                                                        <Briefcase className="mx-auto h-4 w-4 text-purple-500" />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="px-4 font-medium">
                                                                    {
                                                                        row.display_name
                                                                    }
                                                                </TableCell>
                                                                <TableCell className="text-center font-mono">
                                                                    {
                                                                        row.quantity
                                                                    }
                                                                </TableCell>
                                                                <TableCell className="text-center font-mono">
                                                                    {symbol}{' '}
                                                                    {row.unit_price.toFixed(
                                                                        2,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="pr-8 text-right font-bold tabular-nums">
                                                                    {symbol}{' '}
                                                                    {row.subtotal.toFixed(
                                                                        2,
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="flex justify-end pt-4 pb-10">
                                            <div className="w-full max-w-sm space-y-2 rounded-xl border bg-muted/10 p-5 shadow-inner dark:border-neutral-800">
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
                                                <div className="flex justify-between border-t border-blue-200 pt-3 text-lg font-black tracking-tighter text-blue-600 uppercase dark:border-neutral-700">
                                                    <span>Total</span>
                                                    <span className="tabular-nums">
                                                        {symbol}{' '}
                                                        {totalAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                {data.currency === 'USD' && (
                                                    <div className="mt-2 text-right text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                                                        Equiv. S/{' '}
                                                        {totalInSoles.toFixed(
                                                            2,
                                                        )}
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
                                    <div className="rounded-2xl border-2 border-dashed p-12 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/10 dark:border-neutral-800">
                                        <FileText className="mx-auto mb-4 h-12 w-12 text-blue-500/50" />
                                        {receipt.receipt_path ? (
                                            <div className="space-y-4">
                                                <p className="mx-auto max-w-md truncate text-sm font-bold">
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
                                                            className="bg-blue-600 text-white"
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />{' '}
                                                            Reemplazar
                                                        </Button>
                                                        <input
                                                            type="file"
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
                                                            e.target
                                                                .files?.[0] ||
                                                                null,
                                                        )
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10">
                        {/* CABECERA DEL HISTORIAL (FIJA) */}
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
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <MessageSquare className="mr-1.5 h-3 w-3" />{' '}
                                Registrar nota
                            </Button>
                        </div>

                        {/* ÁREA DE TEXTAREA (SOLO APARECE AL DAR CLICK) */}
                        {isWritingNote && (
                            <div className="shrink-0 animate-in border-b border-border bg-background p-4 slide-in-from-top-2">
                                <textarea
                                    className="w-full resize-none rounded-md border-border bg-transparent p-3 text-sm focus:ring-1 focus:ring-blue-500"
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
                                        onClick={() => setIsWritingNote(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={submitNote}
                                        disabled={!internalNote.trim()}
                                        className="bg-blue-600 text-white transition-colors hover:bg-blue-700"
                                    >
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ✅ CONTENEDOR DE LOGS CON ALTO FIJO Y SCROLL */}
                        <div className="custom-scrollbar max-h-[calc(100vh-120px)] flex-1 space-y-6 overflow-y-auto p-6">
                            {receipt.logs?.map((log: any) => (
                                <div
                                    key={log.id_receipt_log || log.id}
                                    className="relative border-l-2 border-border pl-6"
                                >
                                    <div className="absolute top-0 -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-background">
                                        {log.action === 'Nota' ? (
                                            <MessageSquare className="h-2.5 w-2.5 text-blue-500" />
                                        ) : (
                                            <History className="h-2.5 w-2.5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
                                        <span className="mr-2 flex items-center gap-1 truncate tracking-tight uppercase">
                                            <User className="h-2.5 w-2.5" />{' '}
                                            {log.user?.name || 'Sistema'}
                                        </span>
                                        <span className="shrink-0 font-mono text-muted-foreground">
                                            {format(
                                                new Date(log.created_at),
                                                'dd/MM HH:mm',
                                            )}
                                        </span>
                                    </div>

                                    {/* ✅ CAJA DE TEXTO CON BREAK-ALL PARA EVITAR DESBORDE HORIZONTAL */}
                                    <div
                                        className={cn(
                                            'mt-1 w-full overflow-hidden rounded-md border p-2 shadow-sm',
                                            log.action === 'Nota' ||
                                                log.action === 'Actualización'
                                                ? 'border-border bg-white dark:bg-neutral-800'
                                                : 'border-transparent bg-transparent text-muted-foreground italic',
                                        )}
                                    >
                                        <p className="text-xs leading-relaxed break-all whitespace-pre-wrap">
                                            {log.notes || log.action}
                                        </p>
                                    </div>
                                </div>
                            )) || (
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
                            Se revertirá el stock y se perderá el vínculo
                            contable.
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
