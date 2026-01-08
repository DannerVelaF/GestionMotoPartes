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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import receipts from '@/routes/receipts';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    ArrowRightLeft,
    BookText,
    Box,
    Briefcase,
    CalendarIcon,
    CheckCircle2,
    Download,
    FileText,
    Lock,
    MoreVertical,
    Paperclip,
    Plus,
    Receipt as ReceiptIcon,
    RotateCcw,
    Save,
    ShoppingBag,
    Trash2,
    Truck,
    Undo2,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

// --- Interfaces ---
interface Detail {
    id_receipt_detail?: number;
    id_product: number | null;
    description: string | null;
    quantity: number;
    unit_price: number;
    sale_price?: number;
    product?: {
        product_name: string;
        product_code: string | null;
        stock: number;
        sale_price: number;
    };
}

interface Receipt {
    id_receipt: number;
    receipt_code: string;
    id_supplier: number;
    document_type: string;
    currency: string;
    exchange_rate: number;
    series: string;
    number: string;
    issue_date: string;
    receipt_path: string | null;
    details: Detail[];
    supplier?: { company_name: string; ruc: string };
    children?: Receipt[];
    id_parent?: number;
}

interface ProductOption {
    id_product: number;
    product_name: string;
    product_code: string | null;
    sale_price: number;
}

interface Props {
    receipt: Receipt;
    suppliers: { id_supplier: number; company_name: string }[];
    products: ProductOption[];
    documentTypes: { value: string; label: string }[];
}

// --- Estilos Dark/Light ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium dark:text-foreground dark:border-neutral-700 dark:focus:border-blue-500';

const disabledInputClass =
    'h-9 w-full rounded-none border-0 border-b border-dashed border-muted-foreground/30 bg-transparent px-0 text-sm shadow-none focus:ring-0 cursor-not-allowed text-foreground font-semibold dark:border-neutral-700 dark:text-neutral-400';

const tableInputClass =
    'h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500 tabular-nums dark:text-foreground dark:focus:bg-neutral-800';

// --- ALERTA FLOTANTE ---
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
                className={`border-2 shadow-xl ${isSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100' : 'border-red-500 bg-white text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100'}`}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2 font-bold">
                    {isSuccess ? '¡Éxito!' : 'Error'}
                </AlertTitle>
                <AlertDescription className="ml-2">{message}</AlertDescription>
            </Alert>
        </div>
    );
}

export default function EditReceipt({
    receipt,
    suppliers,
    products,
    documentTypes,
}: Props) {
    const { flash = {}, errors: serverErrors } = usePage<any>().props;
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // --- PREPARACIÓN DE DATOS ---
    const initialRows = receipt.details.map((d) => ({
        id: d.id_receipt_detail || Math.random(),
        type: d.id_product ? 'product' : 'service',
        id_product: d.id_product ? String(d.id_product) : '',
        description: d.description || '',
        product_name: d.product ? d.product.product_name : '',
        quantity: Number(d.quantity),
        unit_price: Number(d.unit_price),
        sale_price: Number(d.product?.sale_price || 0),
    }));

    const [rows, setRows] = useState(initialRows);
    const isCreditNote = receipt.document_type === 'nota_credito';

    // --- USE FORM ---
    const {
        data,
        setData,
        post,
        processing,
        errors,
        isDirty,
        reset,
        transform,
        clearErrors,
    } = useForm({
        _method: 'put',
        id_supplier: String(receipt.id_supplier),
        document_type: receipt.document_type,
        currency: receipt.currency || 'PEN',
        exchange_rate: String(receipt.exchange_rate || '1.000'),
        series: receipt.series,
        number: receipt.number,
        issue_date: new Date(receipt.issue_date),
        file: null as File | null,
        details: [] as any[],
    });

    const symbol = data.currency === 'USD' ? '$' : 'S/';

    // --- MANEJADORES ---
    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const handleCurrencyChange = (val: string) => {
        setData((prev) => ({
            ...prev,
            currency: val,
            exchange_rate: val === 'PEN' ? '1.000' : '3.800',
        }));
    };

    // (Función deshabilitada visualmente pero mantenida por compatibilidad)
    const toggleRowType = (id: number) => {
        // Lógica deshabilitada
    };

    const updateRow = (id: number, field: string, value: any) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );
    };

    const hasDetailErrors = Object.keys(errors).some((key) =>
        key.startsWith('details'),
    );

    // --- CÁLCULOS ---
    const totalAmount = rows.reduce(
        (acc, row) => acc + row.quantity * row.unit_price,
        0,
    );
    const igvAmount = totalAmount - totalAmount / 1.18;
    const subTotal = totalAmount - igvAmount;
    const totalInSoles =
        data.currency === 'USD'
            ? totalAmount * Number(data.exchange_rate)
            : totalAmount;

    // --- LÓGICA DEVOLUCIÓN ---
    const returnForm = useForm({
        id_receipt: receipt.id_receipt,
        return_items: receipt.details
            .filter((d) => d.id_product)
            .map((d) => ({
                id_product: d.id_product,
                description: d.description,
                display_name: d.product
                    ? d.product.product_name
                    : d.description || 'Servicio',
                purchased_quantity: Number(d.quantity),
                current_stock: d.id_product
                    ? Number(d.product?.stock || 0)
                    : Number(d.quantity),
                unit_price: Number(d.unit_price),
                return_quantity: 0,
                is_service: !d.id_product,
            })),
    });

    const handleReturnQuantityChange = (index: number, val: string) => {
        const newItems = [...returnForm.data.return_items];
        let numVal = parseFloat(val);
        if (isNaN(numVal)) numVal = 0;
        if (numVal < 0) numVal = 0;

        const limit = Math.min(
            newItems[index].purchased_quantity,
            newItems[index].current_stock,
        );
        if (numVal > limit) numVal = limit;

        newItems[index].return_quantity = numVal;
        returnForm.setData('return_items', newItems);
    };

    const hasItemsToReturn = returnForm.data.return_items.some(
        (item) => item.return_quantity > 0,
    );

    const totalRefund = returnForm.data.return_items.reduce(
        (acc, item) => acc + item.return_quantity * item.unit_price,
        0,
    );

    const totalRefundInSoles =
        receipt.currency === 'USD'
            ? totalRefund * receipt.exchange_rate
            : totalRefund;

    const submitReturn: FormEventHandler = (e) => {
        e.preventDefault();
        if (!hasItemsToReturn) {
            setFormError(
                'Debes indicar al menos un ítem y una cantidad mayor a 0.',
            );
            return;
        }
        returnForm.post(receipts.return({ receipt: receipt.id_receipt }).url, {
            onSuccess: () => {
                setIsReturnDialogOpen(false);
                returnForm.reset();
                setShowSuccess(true);
            },
            onError: (errors) => {
                if (errors.error) setFormError(errors.error);
            },
        });
    };

    // --- SUBMIT PRINCIPAL ---
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setFormError(null);

        transform((data) => ({
            ...data,
            issue_date: format(data.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            exchange_rate: parseFloat(data.exchange_rate),
            // Se envían los detalles, pero como no se pueden editar, son los mismos
            details: rows.map((r) => ({
                id_product: r.type === 'product' ? r.id_product : null,
                description: r.type === 'service' ? r.description : null,
                quantity: r.quantity,
                unit_price: r.unit_price,
                sale_price: r.sale_price,
                is_service: r.type === 'service',
            })),
        }));

        post(receipts.update({ receipt: receipt.id_receipt }).url, {
            forceFormData: true,
            onSuccess: () => setShowSuccess(true),
            onError: (err: any) => {
                if (err.error) setFormError(err.error);
                else if (Object.keys(err).length > 0)
                    setFormError('Corrige los errores marcados.');
            },
        });
    };

    const executeDelete = () => {
        router.delete(receipts.destroy({ receipt: receipt.id_receipt }).url, {
            onFinish: () => setIsDeleteAlertOpen(false),
        });
    };

    const parentId = receipt.id_parent || null;
    const errorMessage = formError || serverErrors.error || serverErrors[0];

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);
    const isOnlyServices = receipt.details.every(
        (detail) => !detail.id_product,
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Comprobantes', href: receipts.index().url },
                { title: receipt.receipt_code, href: '' },
            ]}
        >
            <Head title={`Ver ${receipt.receipt_code}`} />

            {/* --- MODALES --- */}
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 dark:text-red-400">
                            ¿Eliminar comprobante?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará{' '}
                            <strong>{receipt.receipt_code}</strong> y se
                            revertirá el stock.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog
                open={isReturnDialogOpen}
                onOpenChange={setIsReturnDialogOpen}
            >
                <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden p-0 sm:max-w-[900px]">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                            <Undo2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />{' '}
                            Devolución de Mercadería
                        </DialogTitle>
                        <DialogDescription>
                            Genera una Nota de Crédito. Solo items con cantidad
                            &gt; 0 serán procesados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6">
                        <Table>
                            <TableHeader className="bg-muted/50 dark:bg-neutral-900">
                                <TableRow className="dark:border-neutral-800">
                                    <TableHead className="min-w-[200px] dark:text-neutral-300">
                                        Producto / Descripción
                                    </TableHead>
                                    <TableHead className="text-right dark:text-neutral-300">
                                        Comprado
                                    </TableHead>
                                    <TableHead className="text-right dark:text-neutral-300">
                                        Stock Disp.
                                    </TableHead>
                                    <TableHead className="w-[120px] text-right dark:text-neutral-300">
                                        Cant. Devolver
                                    </TableHead>
                                    <TableHead className="text-right dark:text-neutral-300">
                                        Total ({symbol})
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {returnForm.data.return_items.map(
                                    (item, index) => (
                                        <TableRow
                                            key={index}
                                            className="dark:border-neutral-800"
                                        >
                                            <TableCell className="font-medium dark:text-neutral-200">
                                                {item.display_name}
                                            </TableCell>
                                            <TableCell className="text-right dark:text-neutral-400">
                                                {item.purchased_quantity}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {item.is_service
                                                    ? 'N/A'
                                                    : item.current_stock.toFixed(
                                                          2,
                                                      )}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-right font-bold dark:border-neutral-700 dark:bg-neutral-800"
                                                    value={
                                                        item.return_quantity ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        handleReturnQuantityChange(
                                                            index,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                                                {symbol}{' '}
                                                {(
                                                    item.return_quantity *
                                                    item.unit_price
                                                ).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ),
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter className="mt-0 items-center border-t bg-muted/10 p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="flex flex-1 flex-col text-left">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase">
                                    Total Reembolso ({receipt.currency})
                                </p>
                                <span className="text-2xl font-black text-red-600 dark:text-red-400">
                                    {receipt.currency === 'USD' ? '$' : 'S/'}{' '}
                                    {totalRefund.toFixed(2)}
                                </span>
                            </div>

                            {receipt.currency === 'USD' && (
                                <div className="mt-1 border-t border-dashed border-neutral-300 pt-1 dark:border-neutral-700">
                                    <p className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase">
                                        Ref. en Soles (T.C.{' '}
                                        {receipt.exchange_rate})
                                    </p>
                                    <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                                        S/ {totalRefundInSoles.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsReturnDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                onClick={submitReturn}
                                disabled={
                                    returnForm.processing || !hasItemsToReturn
                                }
                            >
                                Confirmar Devolución
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- ALERTAS --- */}
            {showSuccess && flash?.success && (
                <FloatingAlert message={flash.success} type="success" />
            )}
            {errorMessage && (
                <FloatingAlert message={errorMessage} type="error" />
            )}

            {/* --- FORMULARIO PRINCIPAL --- */}
            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            className="bg-blue-700 text-white shadow-sm hover:bg-blue-800"
                            onClick={() => router.visit(receipts.create().url)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo
                        </Button>
                        <span className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-foreground/90">
                            <BookText className="text-blue-600 dark:text-blue-400" />{' '}
                            {receipt.receipt_code}
                        </span>

                        {isCreditNote && parentId && (
                            <Button
                                variant="secondary"
                                size="sm"
                                type="button"
                                className="ml-4 h-8 border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                onClick={() =>
                                    router.visit(
                                        receipts.show({ receipt: parentId })
                                            .url,
                                    )
                                }
                            >
                                <Undo2 className="mr-2 h-4 w-4" /> Ver Doc.
                                Origen
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground"
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {!isOnlyServices && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsReturnDialogOpen(true)
                                        }
                                        disabled={isCreditNote}
                                        className="cursor-pointer dark:focus:bg-neutral-800"
                                    >
                                        <Undo2 className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />{' '}
                                        Devolución de Mercadería
                                    </DropdownMenuItem>
                                )}
                                {!isOnlyServices && (
                                    <DropdownMenuSeparator className="dark:bg-neutral-700" />
                                )}
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteAlertOpen(true)}
                                    className="cursor-pointer text-red-600 dark:text-red-400 dark:focus:bg-neutral-800"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                    Registro
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {isDirty && (
                            <span className="ml-2 animate-pulse rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 uppercase dark:bg-amber-900/50 dark:text-amber-200">
                                Cambios sin guardar
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => reset()}
                            disabled={!isDirty || processing}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={cn(
                                'min-w-[120px] shadow-md transition-all active:scale-95',
                                isDirty
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                            {['general', 'files', 'returns']
                                .filter(
                                    (tab) =>
                                        !(isCreditNote && tab === 'returns'),
                                )
                                .map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:after:bg-blue-400"
                                    >
                                        {tab === 'general'
                                            ? 'Información General'
                                            : tab === 'files'
                                              ? 'Archivos Adjuntos'
                                              : `Devoluciones (${receipt.children?.length ?? 0})`}
                                    </TabsTrigger>
                                ))}
                        </TabsList>

                        <TabsContent
                            value="general"
                            className="mt-6 animate-in duration-300 fade-in-50"
                        >
                            <div className="mb-12 grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                                {/* COLUMNA IZQUIERDA: DATOS COMERCIALES */}
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:border-neutral-800">
                                        <Truck className="h-3 w-3" /> Datos
                                        Comerciales
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Proveedor */}
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                Proveedor
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    value={
                                                        receipt.supplier
                                                            ?.company_name ||
                                                        'Sin proveedor'
                                                    }
                                                    disabled
                                                    className={
                                                        disabledInputClass
                                                    }
                                                />
                                                <Lock className="absolute top-2.5 right-2 h-4 w-4 text-muted-foreground/30" />
                                            </div>
                                        </div>

                                        {/* Moneda y TC */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Moneda
                                                </Label>

                                                <Input
                                                    value={data.currency}
                                                    disabled={true}
                                                    className={cn(
                                                        disabledInputClass,
                                                        'pl-6 font-mono',
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Tipo de Cambio
                                                </Label>
                                                <div className="relative">
                                                    <ArrowRightLeft className="absolute top-2.5 left-0 h-3 w-3 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        step="0.001"
                                                        value={
                                                            data.exchange_rate
                                                        }
                                                        onChange={(e) =>
                                                            onFieldChange(
                                                                'exchange_rate',
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={true} // BLOQUEADO
                                                        className={cn(
                                                            cleanInputClass,
                                                            'pl-6 font-mono',
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Serie y Número */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Serie
                                                </Label>
                                                <Input
                                                    value={data.series}
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'series',
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    disabled={true} // BLOQUEADO
                                                    className={cn(
                                                        cleanInputClass,
                                                        'text-center uppercase',
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Número
                                                </Label>
                                                <Input
                                                    value={data.number}
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'number',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={true} // BLOQUEADO
                                                    className={cleanInputClass}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: DATOS DOC */}
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:border-neutral-800">
                                        <FileText className="h-3 w-3" />{' '}
                                        Detalles Documento
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Tipo Doc
                                                </Label>

                                                {data.document_type ===
                                                'nota_credito' ? (
                                                    /* Caso: Nota de Crédito - Solo lectura */
                                                    <div className="relative">
                                                        <Input
                                                            value="Nota de Crédito"
                                                            disabled
                                                            className={
                                                                disabledInputClass
                                                            }
                                                        />
                                                        <Lock className="absolute top-2.5 right-2 h-4 w-4 text-muted-foreground/30" />
                                                    </div>
                                                ) : (
                                                    /* Caso: Otros - Selector habilitado */
                                                    <Select
                                                        value={
                                                            data.document_type
                                                        }
                                                        onValueChange={(val) =>
                                                            onFieldChange(
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
                                                            {documentTypes
                                                                .filter(
                                                                    (dt) =>
                                                                        dt.value !==
                                                                        'nota_credito',
                                                                ) // Opcional: filtrar para que no la elijan manualmente si no quieres
                                                                .map((dt) => (
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
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Fecha Emisión
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                cleanInputClass,
                                                                'text-left font-medium',
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                            {data.issue_date
                                                                ? format(
                                                                      data.issue_date,
                                                                      'Pp',
                                                                      {
                                                                          locale: es,
                                                                      },
                                                                  )
                                                                : 'Elegir...'}
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
                                                            onSelect={(d) => {
                                                                if (d) {
                                                                    const nd =
                                                                        new Date(
                                                                            d,
                                                                        );
                                                                    nd.setHours(
                                                                        data.issue_date.getHours(),
                                                                        data.issue_date.getMinutes(),
                                                                    );
                                                                    onFieldChange(
                                                                        'issue_date',
                                                                        nd,
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <div className="flex items-center justify-between gap-4 border-t bg-muted/20 p-3 dark:border-neutral-700">
                                                            <span className="text-xs font-bold uppercase">
                                                                Hora:
                                                            </span>
                                                            <Input
                                                                type="time"
                                                                className="h-8 w-24 font-mono font-bold dark:bg-neutral-800"
                                                                value={format(
                                                                    data.issue_date,
                                                                    'HH:mm',
                                                                )}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const [
                                                                        h,
                                                                        m,
                                                                    ] =
                                                                        e.target.value.split(
                                                                            ':',
                                                                        );
                                                                    const nd =
                                                                        new Date(
                                                                            data.issue_date,
                                                                        );
                                                                    nd.setHours(
                                                                        parseInt(
                                                                            h,
                                                                        ),
                                                                        parseInt(
                                                                            m,
                                                                        ),
                                                                    );
                                                                    onFieldChange(
                                                                        'issue_date',
                                                                        nd,
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                {data.file
                                                    ? 'Archivo seleccionado'
                                                    : 'Adjuntar Nuevo Archivo'}
                                            </Label>

                                            <div
                                                className={cn(
                                                    'relative flex items-center gap-2 border-b border-muted py-2 transition-all',
                                                    'hover:border-blue-400 hover:bg-blue-50/50 dark:border-neutral-700 dark:hover:bg-blue-900/20',
                                                    data.file &&
                                                        'rounded-t-sm border-emerald-500/50 bg-emerald-50/30 px-2 dark:bg-emerald-900/20',
                                                )}
                                            >
                                                <Paperclip
                                                    className={cn(
                                                        'h-4 w-4',
                                                        data.file
                                                            ? 'text-emerald-600'
                                                            : 'text-blue-600',
                                                    )}
                                                />

                                                <span className="flex-1 truncate text-xs font-medium">
                                                    {data.file ? (
                                                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                            {data.file.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Clic para
                                                            seleccionar
                                                            (PDF/JPG)
                                                        </span>
                                                    )}
                                                </span>

                                                {/* Input invisible: Habilitado */}
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'file',
                                                            e.target
                                                                .files?.[0] ||
                                                                null,
                                                        )
                                                    }
                                                />

                                                {/* Botón Eliminar: Ahora funcional */}
                                                {data.file && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="relative z-20 h-6 w-6 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/50"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            onFieldChange(
                                                                'file',
                                                                null,
                                                            );
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            {errors.file && (
                                                <p className="text-[10px] font-bold text-red-500">
                                                    {errors.file}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- TABLA DE DETALLES --- */}
                            <div className="space-y-4 pt-6">
                                <h3
                                    className={cn(
                                        'flex items-center gap-2 border-b pb-2 text-sm font-bold tracking-tight uppercase dark:border-neutral-800',
                                        hasDetailErrors
                                            ? 'border-red-500 text-red-500'
                                            : 'border-blue-100 text-slate-800 dark:text-neutral-200',
                                    )}
                                >
                                    <ShoppingBag className="h-4 w-4" /> Líneas
                                    de Compra ({data.currency})
                                </h3>

                                <div
                                    className={cn(
                                        'overflow-hidden rounded-xl border bg-card shadow-sm dark:border-neutral-800',
                                        hasDetailErrors &&
                                            'border-red-500 ring-1 ring-red-500',
                                    )}
                                >
                                    <Table>
                                        <TableHeader className="bg-muted/30 dark:bg-neutral-900">
                                            <TableRow className="dark:border-neutral-800">
                                                <TableHead className="w-[50px] text-center text-[10px] font-bold uppercase">
                                                    Tipo
                                                </TableHead>
                                                <TableHead className="w-[35%] text-[10px] font-bold uppercase">
                                                    Descripción / Producto
                                                </TableHead>
                                                <TableHead className="w-[10%] text-right text-[10px] font-bold uppercase">
                                                    Cant.
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right text-[10px] font-bold uppercase">
                                                    Costo ({symbol})
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right text-[10px] font-bold uppercase">
                                                    Subtotal ({symbol})
                                                </TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((row, index) => (
                                                <TableRow
                                                    key={row.id}
                                                    className="hover:bg-muted/20 dark:border-neutral-800"
                                                >
                                                    {/* 1. TIPO */}
                                                    <TableCell className="p-2 text-center">
                                                        <Button
                                                            disabled={true} // BLOQUEADO
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                'h-8 w-8 cursor-default rounded-full opacity-70',
                                                                row.type ===
                                                                    'service'
                                                                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                                                            )}
                                                            onClick={() =>
                                                                toggleRowType(
                                                                    row.id,
                                                                )
                                                            }
                                                        >
                                                            {row.type ===
                                                            'product' ? (
                                                                <Box className="h-4 w-4" />
                                                            ) : (
                                                                <Briefcase className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>

                                                    {/* 2. PRODUCTO / DESCRIPCIÓN */}
                                                    <TableCell className="p-2">
                                                        {row.type ===
                                                        'product' ? (
                                                            <Input
                                                                disabled={true} // BLOQUEADO
                                                                value={
                                                                    row.product_name
                                                                }
                                                                className={cn(
                                                                    cleanInputClass,
                                                                    'cursor-not-allowed text-muted-foreground',
                                                                )}
                                                            />
                                                        ) : (
                                                            <Input
                                                                disabled={true} // BLOQUEADO
                                                                placeholder="Ej. Hosting Anual..."
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
                                                                className={cn(
                                                                    cleanInputClass,
                                                                    'cursor-not-allowed text-muted-foreground',
                                                                )}
                                                            />
                                                        )}
                                                    </TableCell>

                                                    {/* 3. CANTIDAD */}
                                                    <TableCell className="p-2">
                                                        <Input
                                                            disabled={true} // BLOQUEADO
                                                            type="number"
                                                            className={cn(
                                                                tableInputClass,
                                                                'cursor-not-allowed opacity-70',
                                                            )}
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
                                                    </TableCell>

                                                    {/* 4. COSTO */}
                                                    <TableCell className="p-2">
                                                        <Input
                                                            disabled={true} // BLOQUEADO
                                                            type="number"
                                                            step="0.01"
                                                            className={cn(
                                                                tableInputClass,
                                                                'cursor-not-allowed opacity-70',
                                                            )}
                                                            value={
                                                                row.unit_price
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'unit_price',
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* 5. SUBTOTAL */}
                                                    <TableCell className="p-2 text-right font-bold tabular-nums dark:text-neutral-200">
                                                        {symbol}{' '}
                                                        {(
                                                            row.quantity *
                                                            row.unit_price
                                                        ).toFixed(2)}
                                                    </TableCell>

                                                    {/* 6. BORRAR */}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex items-start justify-between pt-6">
                                    <div></div>
                                    <div className="w-full max-w-sm space-y-3 rounded-xl border bg-muted/10 p-6 dark:border-neutral-800">
                                        <div className="flex justify-between text-sm font-medium text-muted-foreground">
                                            <span>Base Imponible</span>
                                            <span>
                                                {symbol} {subTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium text-muted-foreground">
                                            <span>IGV (18%)</span>
                                            <span>
                                                {symbol} {igvAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex justify-between border-t border-blue-200 pt-4 dark:border-neutral-700">
                                            <span className="text-lg font-black tracking-tighter text-foreground uppercase">
                                                Total Compra
                                            </span>
                                            <span className="text-2xl font-black text-blue-600 tabular-nums dark:text-blue-400">
                                                {symbol}{' '}
                                                {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        {data.currency === 'USD' && (
                                            <div className="mt-2 rounded-md bg-emerald-50 p-2 dark:bg-emerald-900/20">
                                                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400">
                                                    <span className="font-medium">
                                                        Valor estimado en Soles
                                                        (T.C.{' '}
                                                        {data.exchange_rate})
                                                    </span>
                                                    <span className="text-lg font-black">
                                                        S/{' '}
                                                        {totalInSoles.toFixed(
                                                            2,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="files">
                            <div className="rounded-lg border p-8 text-center dark:border-neutral-800">
                                {receipt.receipt_path ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <ReceiptIcon className="h-12 w-12 text-blue-500/50" />
                                        <p className="text-sm font-medium text-foreground">
                                            {receipt.receipt_path
                                                .split('/')
                                                .pop()}
                                        </p>
                                        <a
                                            href={`/storage/${receipt.receipt_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer" // Seguridad adicional
                                            className="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                        >
                                            <Download className="h-4 w-4" />
                                            Descargar Archivo Actual
                                        </a>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">
                                        No hay archivo adjunto actualmente.
                                    </span>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="returns">
                            {receipt.children && receipt.children.length > 0 ? (
                                <div className="overflow-hidden rounded-xl border dark:border-neutral-800">
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-neutral-900">
                                            <TableRow className="dark:border-neutral-800">
                                                <TableHead className="dark:text-neutral-300">
                                                    Código
                                                </TableHead>
                                                <TableHead className="dark:text-neutral-300">
                                                    Fecha
                                                </TableHead>
                                                <TableHead className="text-right dark:text-neutral-300">
                                                    Monto Devuelto
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {receipt.children.map((nc) => (
                                                <TableRow
                                                    key={nc.id_receipt}
                                                    className="cursor-pointer hover:bg-muted/50 dark:border-neutral-800"
                                                    onClick={() =>
                                                        router.visit(
                                                            receipts.show({
                                                                receipt:
                                                                    nc.id_receipt,
                                                            }).url,
                                                        )
                                                    }
                                                >
                                                    <TableCell className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                                        {nc.receipt_code}
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(
                                                            new Date(
                                                                nc.issue_date,
                                                            ),
                                                            'dd MMM yyyy',
                                                            { locale: es },
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                                                        S/{' '}
                                                        {Math.abs(
                                                            Number(
                                                                nc.total_amount ||
                                                                    0,
                                                            ),
                                                        ).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground dark:border-neutral-800">
                                    No hay devoluciones registradas.
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </form>
        </AppLayout>
    );
}
