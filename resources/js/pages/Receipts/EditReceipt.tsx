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
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    BookText,
    Building2,
    CalendarIcon,
    CheckCircle2,
    Download,
    FileType,
    Hash,
    Lock,
    MoreVertical,
    Paperclip,
    Plus,
    Receipt as ReceiptIcon,
    RotateCcw,
    Save,
    Trash2,
    Truck,
    Undo2,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import productsRoute from '@/routes/products';

// --- Interfaces ---
interface Detail {
    id_receipt_detail?: number;
    id_product: number;
    quantity: number;
    unit_price: number;
    product?: {
        product_name: string;
        product_code: string;
        stock: number; // <--- Asegúrate de recibir esto del backend
    };
}

interface Receipt {
    id_receipt: number;
    receipt_code: string;
    id_supplier: number;
    document_type: string;
    series: string;
    number: string;
    issue_date: string;
    receipt_path: string | null;
    details: Detail[];
    supplier?: { company_name: string; ruc: string };
    children?: Receipt[];
}

interface Props {
    receipt: Receipt;
    documentTypes: { value: string; label: string }[];
}

// Estilos consistentes con Ventas
const cleanInputClass =
    'h-10 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium';
const disabledInputClass =
    'h-10 w-full rounded-none border-0 border-b border-dashed border-muted-foreground/30 bg-transparent px-0 text-lg shadow-none focus:ring-0 cursor-not-allowed text-foreground font-semibold';
const tableInputClass =
    'h-9 border-0 border-b border-transparent bg-transparent text-right shadow-none focus:ring-0 cursor-default text-muted-foreground tabular-nums';

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
        <div
            className={`fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2`}
        >
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={`border-2 shadow-xl ${isSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-red-500 bg-white text-red-900'}`}
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

export default function EditReceipt({ receipt, documentTypes }: Props) {
    const { flash = {}, errors: serverErrors } = usePage<any>().props;
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const initialRows = receipt.details.map((d) => ({
        id: d.id_receipt_detail || Math.random(),
        id_product: String(d.id_product),
        product_name: d.product
            ? d.product.product_name
            : 'Producto desconocido',
        quantity: Number(d.quantity),
        unit_price: Number(d.unit_price),
    }));
    const errorMessage = formError || serverErrors.error || serverErrors[0];
    const [rows] = useState(initialRows);
    const isCreditNote = receipt.document_type === 'nota_credito';
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
        series: receipt.series,
        number: receipt.number,
        issue_date: new Date(receipt.issue_date),
        file: null as File | null,
        details: receipt.details.map((d) => ({
            id_product: d.id_product,
            quantity: d.quantity,
            unit_price: d.unit_price,
        })),
    });

    const visitNc = (ncId: number) => {
        const url = receipts.show({ receipt: ncId }).url;
        router.visit(url, {
            replace: true,
            preserveState: false,
        });
    };

    const returnForm = useForm({
        id_receipt: receipt.id_receipt,
        return_items: receipt.details.map((d) => ({
            id_product: d.id_product,
            product_name: d.product?.product_name || 'Item',
            purchased_quantity: Number(d.quantity),
            current_stock: Number(d.product?.stock || 0), // <--- Guardamos el stock actual
            unit_price: Number(d.unit_price),
            return_quantity: 0,
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

        if (numVal > limit) {
            numVal = limit;
        }

        newItems[index].return_quantity = numVal;
        returnForm.setData('return_items', newItems);
    };
    const hasItemsToReturn = returnForm.data.return_items.some(
        (item) => item.return_quantity > 0,
    );

    const totalRefund = returnForm.data.return_items.reduce((acc, item) => {
        return acc + item.return_quantity * item.unit_price;
    }, 0);

    const submitReturn: FormEventHandler = (e) => {
        e.preventDefault();
        if (!hasItemsToReturn) {
            setFormError(
                'Debes indicar al menos un producto y una cantidad mayor a 0.',
            );
            return;
        }
        returnForm.post(receipts.return({ receipt: receipt.id_receipt }).url, {
            onSuccess: () => {
                setIsReturnDialogOpen(false);
                returnForm.reset();
            },
            onError: (errors) => {
                if (errors.error) setFormError(errors.error);
            },
        });
    };

    const parentId = (usePage<any>().props.receipt as any).id_parent || null;

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const totalAmount = rows.reduce(
        (acc, row) => acc + row.quantity * row.unit_price,
        0,
    );
    const igvAmount = totalAmount - totalAmount / 1.18;
    const subTotal = totalAmount - igvAmount;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        transform((data) => ({
            ...data,
            // Sincronizamos la fecha Kardex enviando el string completo al backend
            issue_date: format(data.issue_date, 'yyyy-MM-dd HH:mm:ss'),
        }));

        post(receipts.update({ receipt: receipt.id_receipt }).url, {
            forceFormData: true,
            onSuccess: () => setShowSuccess(true),
        });
    };

    const executeDelete = () => {
        router.delete(receipts.destroy({ receipt: receipt.id_receipt }).url, {
            onFinish: () => setIsDeleteAlertOpen(false),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Comprobantes', href: receipts.index().url },
                { title: receipt.receipt_code, href: '' },
            ]}
        >
            <Head title={`Ver ${receipt.receipt_code}`} />

            <div key={receipt.id_receipt}>
                {/* --- DIALOGS (Mantenemos la lógica de AlertDialog y ReturnDialog) --- */}
                <AlertDialog
                    open={isDeleteAlertOpen}
                    onOpenChange={setIsDeleteAlertOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <Trash2 className="h-5 w-5" /> ¿Eliminar
                                comprobante?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará
                                el registro{' '}
                                <strong>{receipt.receipt_code}</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={executeDelete}
                                className="bg-red-600 hover:bg-red-700"
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
                    {/* 1. Usamos sm:max-w-[1100px] para asegurar que el ancho se aplique sobre el default de Shadcn */}
                    <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden p-0 sm:max-w-[800px]">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Undo2 className="h-6 w-6 text-blue-600" />{' '}
                                Devolución de Mercadería
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                Genera una Nota de Crédito interna ajustando el
                                stock. Solo se puede devolver lo que aún existe
                                en almacén.
                            </DialogDescription>
                        </DialogHeader>

                        {/* 2. Contenedor con scroll interno para la tabla si hay muchos productos */}
                        <div className="flex-1 overflow-y-auto px-6">
                            <div className="overflow-hidden rounded-xl border dark:border-neutral-800">
                                <Table>
                                    <TableHeader className="bg-muted/50 dark:bg-neutral-900">
                                        <TableRow className="dark:border-neutral-800">
                                            {/* 3. Definimos anchos mínimos para que nada se aplaste */}
                                            <TableHead className="min-w-[300px] font-bold dark:text-neutral-300">
                                                Producto
                                            </TableHead>
                                            <TableHead className="w-[100px] text-right font-bold dark:text-neutral-300">
                                                Comprado
                                            </TableHead>
                                            <TableHead className="w-[120px] text-right font-bold dark:text-neutral-300">
                                                Stock Actual
                                            </TableHead>
                                            <TableHead className="w-[140px] text-right font-bold dark:text-neutral-300">
                                                Cant. Devolver
                                            </TableHead>
                                            <TableHead className="w-[150px] text-right font-bold dark:text-neutral-300">
                                                Total Reembolso
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {returnForm.data.return_items.map(
                                            (item, index) => {
                                                const isStockLow =
                                                    item.current_stock <
                                                    item.purchased_quantity;
                                                return (
                                                    <TableRow
                                                        key={item.id_product}
                                                        className="transition-colors hover:bg-muted/20 dark:border-neutral-800"
                                                    >
                                                        <TableCell className="py-4 font-medium dark:text-neutral-200">
                                                            {item.product_name}
                                                        </TableCell>
                                                        <TableCell className="text-right tabular-nums dark:text-neutral-400">
                                                            {item.purchased_quantity.toFixed(
                                                                2,
                                                            )}
                                                        </TableCell>
                                                        <TableCell
                                                            className={cn(
                                                                'text-right font-bold tabular-nums',
                                                                isStockLow
                                                                    ? 'text-amber-600 dark:text-amber-500'
                                                                    : 'text-emerald-600',
                                                            )}
                                                        >
                                                            {item.current_stock.toFixed(
                                                                2,
                                                            )}
                                                            {isStockLow && (
                                                                <span className="block text-[10px] font-black tracking-tighter uppercase opacity-70">
                                                                    Faltante
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Input
                                                                type="number"
                                                                className="h-9 border-blue-200 text-right font-bold focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
                                                                value={
                                                                    item.return_quantity ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleReturnQuantityChange(
                                                                        index,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-black text-red-600 tabular-nums dark:text-red-400">
                                                            S/{' '}
                                                            {(
                                                                item.return_quantity *
                                                                item.unit_price
                                                            ).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            },
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* 4. Footer fijo para que el botón de confirmar siempre sea visible */}
                        <DialogFooter className="mt-0 items-center border-t bg-muted/10 p-6">
                            <div className="flex-1 text-left">
                                <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                    Monto Estimado
                                </p>
                                <span className="text-2xl font-black text-red-600">
                                    S/ {totalRefund.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsReturnDialogOpen(false)}
                                    className="font-bold"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="bg-red-600 px-8 font-bold hover:bg-red-700"
                                    onClick={submitReturn}
                                    disabled={
                                        returnForm.processing ||
                                        !hasItemsToReturn
                                    }
                                >
                                    {returnForm.processing
                                        ? 'Procesando...'
                                        : 'Confirmar Devolución'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {showSuccess && flash?.success && (
                    <FloatingAlert message={flash.success} type="success" />
                )}
                {errorMessage && (
                    <FloatingAlert message={errorMessage} type="error" />
                )}

                <form
                    onSubmit={submit}
                    className="flex h-full flex-col bg-background"
                >
                    {/* --- HEADER STICKY (MEJORADO) --- */}
                    <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                className="bg-blue-700 text-white shadow-sm hover:bg-blue-800"
                                onClick={() =>
                                    router.visit(receipts.create().url)
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" /> Nuevo
                            </Button>
                            <span className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-foreground/90">
                                <BookText className="text-blue-600" />
                                {receipt.receipt_code}
                            </span>

                            {isCreditNote && parentId && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    className="ml-4 h-8 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                                    onClick={() =>
                                        router.visit(
                                            receipts.show({ receipt: parentId })
                                                .url,
                                        )
                                    }
                                >
                                    <Undo2 className="mr-2 h-4 w-4" /> Ver
                                    Documento Origen
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
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsReturnDialogOpen(true)
                                        }
                                        disabled={isCreditNote}
                                        className="cursor-pointer"
                                    >
                                        <Undo2 className="mr-2 h-4 w-4 text-blue-600" />{' '}
                                        Devolución de Mercadería
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsDeleteAlertOpen(true)
                                        }
                                        className="cursor-pointer text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />{' '}
                                        Eliminar Registro
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {isDirty && (
                                <span className="ml-2 animate-pulse rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 uppercase">
                                    Cambios sin guardar
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => reset()}
                                disabled={!isDirty || processing}
                                type="button"
                                className="border-muted-foreground/30 hover:bg-muted"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                            </Button>
                            <Button
                                type="submit"
                                disabled={!isDirty || processing}
                                className={cn(
                                    'min-w-[120px] shadow-md transition-all active:scale-95',
                                    isDirty
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                <Save className="mr-2 h-4 w-4" /> Guardar
                            </Button>
                        </div>
                    </div>

                    {/* --- CONTENIDO PRINCIPAL --- */}
                    <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                                {['general', 'files', 'returns']
                                    .filter(
                                        (tab) =>
                                            !(
                                                isCreditNote &&
                                                tab === 'returns'
                                            ),
                                    )
                                    .map((tab) => (
                                        <TabsTrigger
                                            key={tab}
                                            value={tab}
                                            className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600"
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
                                    {/* Columna Izquierda */}
                                    <div className="space-y-8">
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <Building2 className="h-3 w-3" />{' '}
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
                                                <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground/30" />
                                            </div>
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <FileType className="h-3 w-3" />{' '}
                                                Tipo Documento
                                            </Label>
                                            <Select
                                                value={data.document_type}
                                                disabled={isCreditNote}
                                                onValueChange={(val) =>
                                                    onFieldChange(
                                                        'document_type',
                                                        val,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    className={cleanInputClass}
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {documentTypes.map((dt) => (
                                                        <SelectItem
                                                            key={dt.value}
                                                            value={dt.value}
                                                        >
                                                            {dt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Columna Derecha */}
                                    <div className="space-y-8">
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <CalendarIcon className="h-3 w-3" /> Fecha y Hora de Emisión
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full justify-start rounded-none border-0 border-b border-muted bg-transparent px-0 text-left font-medium shadow-none hover:border-blue-600 hover:bg-transparent',
                                                            !data.issue_date && 'text-muted-foreground',
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {data.issue_date
                                                            ? format(data.issue_date, 'Pp', { locale: es }) // 'Pp' muestra fecha y hora corta
                                                            : 'Seleccionar fecha y hora'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                                                    {/* 1. Selector de Fecha */}
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.issue_date}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                // Preservar la hora actual si ya existía una
                                                                const newDate = new Date(date);
                                                                newDate.setHours(data.issue_date.getHours());
                                                                newDate.setMinutes(data.issue_date.getMinutes());
                                                                onFieldChange('issue_date', newDate);
                                                            }
                                                        }}
                                                        initialFocus
                                                    />

                                                    {/* 2. Selector de Hora (Añadido al pie del calendario) */}
                                                    <div className="border-t p-3 bg-muted/20 flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-muted-foreground uppercase">Hora:</span>
                                                            <Input
                                                                type="time"
                                                                className="h-8 w-[120px] font-mono font-bold"
                                                                value={format(data.issue_date, 'HH:mm')}
                                                                onChange={(e) => {
                                                                    const [hours, minutes] = e.target.value.split(':');
                                                                    const newDate = new Date(data.issue_date);
                                                                    newDate.setHours(parseInt(hours), parseInt(minutes));
                                                                    onFieldChange('issue_date', newDate);
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase italic">
                    Formato 24h
                </span>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <Hash className="h-3 w-3" />{' '}
                                                Referencia (Serie - Número)
                                            </Label>
                                            <div className="flex gap-4">
                                                <Input
                                                    value={data.series}
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'series',
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    disabled={isCreditNote}
                                                    className={cn(
                                                        cleanInputClass,
                                                        'w-24 text-center uppercase',
                                                    )}
                                                />
                                                <span className="self-center text-muted-foreground">
                                                    -
                                                </span>
                                                <Input
                                                    value={data.number}
                                                    disabled={isCreditNote}
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'number',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={cleanInputClass}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TABLA DE LÍNEAS (MEJORADA) */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                        <h3 className="flex items-center gap-2 font-bold tracking-tight text-foreground uppercase dark:text-neutral-200">
                                            <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />{' '}
                                            Líneas de Compra
                                        </h3>
                                    </div>
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-neutral-900">
                                            <TableRow className="dark:border-neutral-800">
                                                <TableHead className="dark:text-neutral-300">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="text-right dark:text-neutral-300">
                                                    Cantidad
                                                </TableHead>
                                                <TableHead className="text-right dark:text-neutral-300">
                                                    Precio Unit.
                                                </TableHead>
                                                <TableHead className="text-right dark:text-neutral-300">
                                                    Subtotal
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    className="hover:bg-muted/50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                                                >
                                                    <TableCell
                                                        className="cursor-pointer font-medium text-foreground transition-colors hover:text-blue-600 dark:text-neutral-200 dark:hover:text-blue-400"
                                                        onClick={() =>
                                                            router.visit(
                                                                productsRoute.show(
                                                                    {
                                                                        product:
                                                                            row.id_product,
                                                                    },
                                                                ).url,
                                                            )
                                                        }
                                                    >
                                                        {row.product_name}
                                                    </TableCell>

                                                    <TableCell className="text-right tabular-nums">
                                                        {row.quantity.toFixed(
                                                            2,
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right tabular-nums">
                                                        S/{' '}
                                                        {row.unit_price.toFixed(
                                                            2,
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right font-bold tabular-nums">
                                                        S/{' '}
                                                        {(
                                                            row.quantity *
                                                            row.unit_price
                                                        ).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* TOTALES (COMO VENTAS) */}
                                    <div className="flex flex-col items-end gap-2 border-t pt-6">
                                        <div className="w-full max-w-xs space-y-3">
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Base Imponible</span>
                                                <span>
                                                    S/ {subTotal.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>IGV (18%)</span>
                                                <span>
                                                    S/ {igvAmount.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="mt-4 flex justify-between border-t border-blue-200 pt-4">
                                                <span className="text-lg font-bold text-slate-900 uppercase">
                                                    Total Compra
                                                </span>
                                                <span className="text-2xl font-black text-blue-700 tabular-nums">
                                                    S/ {totalAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="files"
                                className="mt-6 animate-in duration-300 fade-in-50"
                            >
                                <div className="max-w-md space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-muted-foreground uppercase">
                                            Archivo Adjunto Actual
                                        </Label>
                                        {receipt.receipt_path ? (
                                            <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                                                <div className="flex items-center gap-3">
                                                    <ReceiptIcon className="h-5 w-5 text-blue-600" />
                                                    <span className="max-w-[180px] truncate text-sm font-medium">
                                                        {receipt.receipt_path
                                                            .split('/')
                                                            .pop()}
                                                    </span>
                                                </div>
                                                <a
                                                    href={`/storage/${receipt.receipt_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center text-xs font-bold text-blue-700 hover:underline"
                                                >
                                                    <Download className="mr-1 h-4 w-4" />{' '}
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                                No hay archivo adjunto
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 border-t pt-6">
                                        <Label className="text-sm font-bold text-muted-foreground uppercase">
                                            Actualizar Documento
                                        </Label>
                                        <div className="flex flex-col gap-4">
                                            <div className="relative">
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    className="w-full border-dashed border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <Paperclip className="mr-2 h-4 w-4" />{' '}
                                                    {data.file
                                                        ? 'Archivo cargado'
                                                        : 'Click para subir nuevo PDF o Imagen'}
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 cursor-pointer opacity-0"
                                                        accept=".pdf,image/*"
                                                        onChange={(e) =>
                                                            onFieldChange(
                                                                'file',
                                                                e.target
                                                                    .files?.[0] ||
                                                                    null,
                                                            )
                                                        }
                                                    />
                                                </Button>
                                            </div>
                                            {data.file && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                                    <CheckCircle2 className="h-4 w-4" />{' '}
                                                    {data.file.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="returns"
                                className="mt-6 animate-in duration-300 fade-in-50"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <Undo2 className="h-5 w-5 text-purple-600" />
                                        <h3 className="font-bold tracking-tight text-foreground uppercase dark:text-neutral-200">
                                            Notas de Crédito Emitidas
                                        </h3>
                                    </div>

                                    {receipt.children &&
                                    receipt.children.length > 0 ? (
                                        <Table>
                                            <TableHeader className="bg-purple-50/50">
                                                <TableRow>
                                                    <TableHead>
                                                        Código NC
                                                    </TableHead>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead className="text-right">
                                                        Monto Devuelto
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {receipt.children.map((nc) => (
                                                    <TableRow
                                                        key={nc.id_receipt}
                                                        className="cursor-pointer hover:bg-purple-50/20"
                                                        onClick={() =>
                                                            visitNc(
                                                                nc.id_receipt,
                                                            )
                                                        }
                                                    >
                                                        <TableCell className="font-mono font-bold text-purple-700">
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
                                                        <TableCell className="text-right font-black text-red-600">
                                                            S/{' '}
                                                            {parseFloat(
                                                                String(
                                                                    nc.total_amount,
                                                                ),
                                                            ).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="rounded-xl border-2 border-dashed p-10 text-center">
                                            <Undo2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
                                            <p className="font-medium text-muted-foreground">
                                                No se han generado devoluciones
                                                para este comprobante.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
