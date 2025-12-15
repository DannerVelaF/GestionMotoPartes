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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    CalendarIcon,
    CheckCircle2,
    Lock,
    MoreVertical,
    Paperclip,
    RotateCcw,
    Save,
    Trash2,
    BookText,
    Undo2
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu';

// --- Interfaces ---
interface Detail {
    id_receipt_detail?: number;
    id_product: number;
    quantity: number;
    unit_price: number;
    product?: { product_name: string; product_code: string };
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
}

interface Props {
    receipt: Receipt;
    documentTypes: { value: string; label: string }[];
}

// Estilos
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all';
const disabledInputClass =
    'h-10 w-full rounded-none border-0 border-b border-dashed border-muted-foreground/30 bg-transparent px-0 text-lg shadow-none focus:ring-0 cursor-not-allowed text-muted-foreground';
const tableInputClass =
    'h-9 border-0 border-b border-transparent bg-transparent text-right shadow-none focus:ring-0 cursor-default text-muted-foreground';

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
    const { flash = {} } = usePage<any>().props;
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    // --- Transformar detalles DB a filas de UI (Solo Lectura) ---
    const initialRows = receipt.details.map((d) => ({
        id: d.id_receipt_detail || Math.random(),
        id_product: String(d.id_product),
        product_name: d.product
            ? d.product.product_name
            : 'Producto desconocido',
        quantity: Number(d.quantity),
        unit_price: Number(d.unit_price),
    }));

    const [rows] = useState(initialRows); // Estado de filas (Solo lectura)

    const {
        data,
        setData,
        post,
        processing,
        errors,
        isDirty, // <--- DETECTA CAMBIOS
        reset,
        clearErrors,
    } = useForm({
        _method: 'put',
        id_supplier: String(receipt.id_supplier),
        document_type: receipt.document_type,
        series: receipt.series,
        number: receipt.number,
        issue_date: new Date(receipt.issue_date),
        file: null as File | null,
        // Los detalles se envían para validación, aunque no se editen en la UI de este ejemplo
        details: receipt.details.map((d) => ({
            id_product: d.id_product,
            quantity: d.quantity,
            unit_price: d.unit_price,
        })),
    });

    const returnForm = useForm({
        id_receipt: receipt.id_receipt,
        // Inicializamos con cantidad de retorno en 0
        return_items: receipt.details.map((d) => ({
            id_product: d.id_product,
            product_name: d.product?.product_name || 'Item',
            purchased_quantity: Number(d.quantity),
            unit_price: Number(d.unit_price),
            return_quantity: 0, // Inicia en 0
        })),

    });

    // Handler para cambiar cantidad a devolver
    const handleReturnQuantityChange = (index: number, val: string) => {
        const newItems = [...returnForm.data.return_items];
        let numVal = parseFloat(val);

        // Validaciones básicas
        if (isNaN(numVal)) numVal = 0;
        if (numVal < 0) numVal = 0;
        // No puede devolver más de lo que compró
        if (numVal > newItems[index].purchased_quantity) {
            numVal = newItems[index].purchased_quantity;
        }

        newItems[index].return_quantity = numVal;
        returnForm.setData('return_items', newItems);
    };

    // Calcular total a devolver (Visual)
    const totalRefund = returnForm.data.return_items.reduce((acc, item) => {
        return acc + item.return_quantity * item.unit_price;
    }, 0);

    const submitReturn: FormEventHandler = (e) => {
        e.preventDefault();
        // Validar que al menos haya 1 item para devolver
        if (totalRefund <= 0) {
            alert('Debes indicar una cantidad a devolver mayor a 0.');
            return;
        }

        returnForm.post(
            // CORRECCIÓN: Los parámetros van DENTRO de la función de la ruta
            receipts.return({ receipt: receipt.id_receipt }).url,
            {
                onSuccess: () => {
                    setIsReturnDialogOpen(false);
                    returnForm.reset();
                },
                onError: (errors) => {
                    // CLAVE: Capturar el error del backend
                    if (errors.error) {
                        setFormError(errors.error); // Asigna el mensaje de error del backend
                    }
                },
            },
        );
    };

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

    // Cálculos (Solo visuales en este modo)
    const totalAmount = rows.reduce(
        (acc, row) => acc + row.quantity * row.unit_price,
        0,
    );
    const igvAmount = totalAmount - totalAmount / 1.18;
    const subTotal = totalAmount - igvAmount;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
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
                            Esta acción no se puede deshacer. Se eliminará el
                            registro <strong>{receipt.receipt_code}</strong> y
                            su historial contable.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
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
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Devolución de Mercadería</DialogTitle>
                        <DialogDescription>
                            Selecciona las cantidades a devolver. Se generará
                            una Nota de Crédito interna y se ajustará el stock.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">
                                        Comprado
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Precio
                                    </TableHead>
                                    <TableHead className="w-[140px] text-right">
                                        Cant. a Devolver
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total Dev.
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {returnForm.data.return_items.map(
                                    (item, index) => (
                                        <TableRow key={item.id_product}>
                                            <TableCell className="font-medium">
                                                {item.product_name}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {item.purchased_quantity.toFixed(
                                                    2,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                S/ {item.unit_price.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={
                                                        item.purchased_quantity
                                                    }
                                                    step="1"
                                                    className="h-8 text-right"
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
                                            <TableCell className="text-right font-bold text-red-600">
                                                S/{' '}
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

                        <div className="mt-4 flex justify-end border-t pt-4">
                            <div className="flex gap-4 text-lg">
                                <span className="font-semibold">
                                    Total Reembolso:
                                </span>
                                <span className="font-bold text-red-600">
                                    S/ {totalRefund.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsReturnDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={submitReturn}
                            disabled={
                                returnForm.processing || totalRefund === 0
                            }
                        >
                            {returnForm.processing
                                ? 'Procesando...'
                                : 'Confirmar Devolución'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showSuccess && flash?.success && (
                <FloatingAlert message={flash.success} type="success" />
            )}
            {formError && <FloatingAlert message={formError} type="error" />}

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-foreground/90">
                            <BookText />
                            {receipt.receipt_code}
                        </span>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() => setIsReturnDialogOpen(true)}
                                    className="cursor-pointer"
                                >
                                    <Undo2 className="mr-2 h-4 w-4" />{' '}
                                    Devolución de Mercadería
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteAlertOpen(true)}
                                    className="cursor-pointer text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                    Registro
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* INDICADOR DE CAMBIOS SIN GUARDAR */}
                        {isDirty && (
                            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Sin guardar
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* BOTÓN DESCARTAR (Reset) */}
                        <Button
                            variant="outline"
                            onClick={() => reset()}
                            disabled={!isDirty || processing}
                            type="button"
                            className={`border-muted-foreground/30 hover:bg-muted ${!isDirty ? 'opacity-50' : ''}`}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>

                        {/* BOTÓN GUARDAR */}
                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={`min-w-[120px] bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95 ${!isDirty ? 'bg-gray-400 opacity-50' : ''}`}
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar
                        </Button>
                    </div>
                </div>

                {/* --- CONTENIDO PRINCIPAL --- */}
                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                            {['general', 'files'].map((tab) => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600"
                                >
                                    {tab === 'general'
                                        ? 'Información General'
                                        : 'Archivos Adjuntos'}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent
                            value="general"
                            className="mt-6 animate-in duration-300 fade-in-50 slide-in-from-left-2"
                        >
                            {/* 1. CAMPOS DE CABECERA */}
                            <div className="mb-10 grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                                {/* Columna Izquierda */}
                                <div className="space-y-8">
                                    <div className="group space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">
                                            Proveedor
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                value={
                                                    receipt.supplier
                                                        ?.company_name ||
                                                    'Proveedor no encontrado'
                                                }
                                                disabled
                                                className={disabledInputClass}
                                            />
                                            <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground/50" />
                                        </div>
                                    </div>
                                    <div className="group space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">
                                            Tipo Documento
                                        </Label>
                                        {/* HABILITADO PARA EDICIÓN */}
                                        <Select
                                            value={data.document_type}
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
                                        {errors.document_type && (
                                            <p className="text-xs text-red-500">
                                                {errors.document_type}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Columna Derecha */}
                                <div className="space-y-8">
                                    <div className="group space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">
                                            Fecha Emisión
                                        </Label>
                                        {/* HABILITADO PARA EDICIÓN */}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-full justify-start rounded-none border-0 border-b border-muted bg-transparent px-0 text-left font-normal shadow-none hover:border-blue-600 hover:bg-transparent focus:ring-0',
                                                        !data.issue_date &&
                                                            'text-muted-foreground',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {data.issue_date ? (
                                                        format(
                                                            data.issue_date,
                                                            'PPP',
                                                            { locale: es },
                                                        )
                                                    ) : (
                                                        <span>
                                                            Seleccionar fecha
                                                        </span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={data.issue_date}
                                                    onSelect={(date) =>
                                                        date &&
                                                        onFieldChange(
                                                            'issue_date',
                                                            date,
                                                        )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="group space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">
                                            Referencia
                                        </Label>
                                        {/* HABILITADO PARA EDICIÓN */}
                                        <div className="flex gap-4">
                                            <Input
                                                value={data.series}
                                                onChange={(e) =>
                                                    onFieldChange(
                                                        'series',
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                className={
                                                    cleanInputClass +
                                                    ' w-24 text-center uppercase'
                                                }
                                            />
                                            <span className="self-center text-muted-foreground">
                                                -
                                            </span>
                                            <Input
                                                value={data.number}
                                                onChange={(e) =>
                                                    onFieldChange(
                                                        'number',
                                                        e.target.value,
                                                    )
                                                }
                                                className={
                                                    cleanInputClass + ' flex-1'
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. TABLA DE DETALLES (SOLO LECTURA) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                                        Líneas de Compra
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                    </h3>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                                            <TableHead className="w-[50%]">
                                                Producto
                                            </TableHead>
                                            <TableHead className="w-[15%] text-right">
                                                Cantidad
                                            </TableHead>
                                            <TableHead className="w-[15%] text-right">
                                                Precio Unit.
                                            </TableHead>
                                            <TableHead className="w-[20%] text-right">
                                                Subtotal
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell className="py-2">
                                                    <Input
                                                        value={row.product_name}
                                                        disabled
                                                        className="cursor-default border-0 bg-transparent px-0 text-foreground shadow-none focus:ring-0"
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Input
                                                        value={row.quantity.toFixed(
                                                            2,
                                                        )}
                                                        disabled
                                                        className={
                                                            tableInputClass
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Input
                                                        value={row.unit_price.toFixed(
                                                            2,
                                                        )}
                                                        disabled
                                                        className={
                                                            tableInputClass
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2 text-right font-medium tabular-nums">
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

                                {/* 3. TOTALES */}
                                <div className="flex flex-col items-end gap-2 border-t pt-4">
                                    <div className="w-full max-w-xs space-y-2">
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
                                        <div className="mt-2 flex justify-between border-t pt-2">
                                            <span className="text-lg font-bold text-foreground">
                                                Total
                                            </span>
                                            <span className="text-xl font-bold text-blue-600">
                                                S/ {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="files"
                            className="mt-6 animate-in duration-300 fade-in-50 slide-in-from-left-2"
                        >
                            <div className="max-w-md space-y-4">
                                <Label className="text-base font-semibold">
                                    Archivo Adjunto Actual
                                </Label>
                                {receipt.receipt_path ? (
                                    <div className="flex items-center justify-between rounded border bg-muted/20 p-4">
                                        <span className="max-w-[200px] truncate text-sm text-muted-foreground">
                                            {receipt.receipt_path
                                                .split('/')
                                                .pop()}
                                        </span>
                                        <a
                                            href={`/storage/${receipt.receipt_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            Ver / Descargar
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        No hay archivo adjunto.
                                    </p>
                                )}

                                <div className="mt-4 border-t pt-4">
                                    <Label className="mb-2 block text-sm font-medium">
                                        Reemplazar Archivo
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            type="button"
                                            className="relative hover:bg-muted"
                                        >
                                            <Paperclip className="mr-2 h-4 w-4" />
                                            {data.file
                                                ? 'Nuevo archivo seleccionado'
                                                : 'Subir nuevo PDF/Imagen'}
                                            <input
                                                type="file"
                                                className="absolute inset-0 cursor-pointer opacity-0"
                                                accept=".pdf,image/*"
                                                onChange={(e) =>
                                                    onFieldChange(
                                                        'file',
                                                        e.target.files?.[0] ||
                                                            null,
                                                    )
                                                }
                                            />
                                        </Button>
                                        {data.file && (
                                            <span className="text-xs text-muted-foreground">
                                                {data.file.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Sube un archivo solo si deseas
                                        reemplazar el actual.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </form>
        </AppLayout>
    );
}
