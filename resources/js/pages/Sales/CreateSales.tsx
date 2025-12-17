import { SearchableSelect } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import productsRoute from '@/routes/products';
import salesRoute from '@/routes/sales';
import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    CalendarIcon,
    CheckCircle2,
    Plus,
    Printer,
    Save,
    Trash2,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// --- Interfaces ---

interface Product {
    id_product: number;
    product_name: string;
    product_code: string | null;
    sale_price: number; // Precio de venta base
}

interface DetailRow {
    id: number;
    id_product: string;
    quantity: number;
    unit_price: number; // Precio de venta final aplicado
}

interface Props {
    products: Product[];
    documentTypes: { value: string; label: string }[];
}

const CLIENTE_VARIOS_RUC = '00000000';
const CLIENTE_VARIOS_NAME = 'PÚBLICO EN GENERAL';
const TICKET_VALUE = 'nota_venta';

interface AlertState {
    message: string;
    type: 'success' | 'error';
}

function FloatingAlert({ message, type, onClose }: { message: string, type: 'error' | 'success', onClose: () => void }) {
    // Autocierre después de 5 segundos
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === 'success';

    return (
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={cn(
                    "border-2 shadow-xl",
                    isSuccess
                        ? "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-100"
                        : "border-red-500 bg-white text-red-900"
                )}
            >
                {isSuccess ? <CheckCircle2 className="h-4 w-4 text-blue-500" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle className="ml-2 font-bold">{isSuccess ? '¡Éxito!' : 'Error'}</AlertTitle>
                <AlertDescription className="ml-2">{message}</AlertDescription>
            </Alert>
        </div>
    );
}

export default function CreateSales({ products, documentTypes }: Props) {
    const [rows, setRows] = useState<DetailRow[]>([
        {
            id: Date.now(),
            id_product: '',
            quantity: 1,
            unit_price: 0,
        },
    ]);
    const [alert, setAlert] = useState<AlertState | null>(null);
    // --- ESTADOS PARA EL MODAL DE IMPRESIÓN ---
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [lastSaleId, setLastSaleId] = useState<number | null>(null);
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            // Datos del Receptor (Cliente) - Inputs de texto
            receiver_id_number: '',
            receiver_name: '',
            receiver_address: '',

            // Datos del Comprobante
            document_type: '',
            series: '',
            number: '',
            issue_date: new Date(),

            details: [] as any[],
        });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);

        if (field === 'document_type') {
            clearErrors('series');
            clearErrors('number');

            if (value === TICKET_VALUE) {
                setData((prev) => ({
                    ...prev,
                    document_type: value,
                    receiver_id_number: CLIENTE_VARIOS_RUC,
                    receiver_name: CLIENTE_VARIOS_NAME,
                    series: 'T001', // Serie para notas de venta
                    number: '', // El backend generará el número
                }));
            } else if (value === 'boleta') {
                setData((prev) => ({
                    ...prev,
                    document_type: value,
                    receiver_id_number: CLIENTE_VARIOS_RUC,
                    receiver_name: CLIENTE_VARIOS_NAME,
                    series: 'B001',
                    number: '',
                }));
            } else if (value === 'factura') {
                setData((prev) => ({
                    ...prev,
                    document_type: value,
                    receiver_id_number: '',
                    receiver_name: '',
                    series: 'F001',
                    number: '',
                }));
            }
        }
    };

    // --- Manejo de Filas de Detalle (Funciones) ---
    const addRow = () => {
        setRows([
            ...rows,
            {
                id: Date.now(),
                id_product: '',
                quantity: 1,
                unit_price: 0,
            },
        ]);
        if (errors.details) clearErrors('details');
    };

    const removeRow = (id: number) => {
        if (rows.length === 1) return;
        setRows(rows.filter((row) => row.id !== id));
    };

    const updateRow = (id: number, field: keyof DetailRow, value: any) => {
        setRows((prevRows) =>
            prevRows.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );
        if (errors.details) clearErrors('details');
    };

    // --- Cálculos de Totales (Asumiendo IGV 18%) ---
    const totalAmount = rows.reduce(
        (acc, row) => acc + row.quantity * row.unit_price,
        0,
    );
    const igvAmount = totalAmount - totalAmount / 1.18;
    const subTotal = totalAmount - igvAmount;

    // --- Helpers de Opciones y Filtrado de Productos ---
    const productOptions = products.map((p) => ({
        value: String(p.id_product),
        label: p.product_code
            ? `[${p.product_code}] ${p.product_name}`
            : p.product_name,
        salePrice: p.sale_price,
    }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        data.details = rows.map((row) => ({
            id_product: row.id_product,
            quantity: row.quantity,
            unit_price: row.unit_price,
        }));

        post(salesRoute.store().url, {
            preserveScroll: true,
            onSuccess: (page) => {
                // ✅ CORRECCIÓN: Intentar capturar desde los props de la página
                // Generalmente en Inertia los datos 'with' de Laravel están en props.flash
                const props = page.props as any;
                const createdSaleId =
                    props.saleId || (props.flash ? props.flash.saleId : null);

                if (createdSaleId) {
                    setLastSaleId(createdSaleId);
                    setShowPrintModal(true);
                    setAlert({
                        message: 'Venta registrada exitosamente.',
                        type: 'success',
                    });
                } else {
                    setAlert({
                        message:
                            'Venta registrada, pero no se pudo recuperar el ID para imprimir.',
                        type: 'success',
                    });
                    console.error(
                        'El backend no devolvió saleId. Revisa SalesController.',
                    );
                }

                reset();
                setRows([
                    {
                        id: Date.now(),
                        id_product: '',
                        quantity: 1,
                        unit_price: 0,
                    },
                ]);
            },
            onError: (err) => {
                setAlert({
                    message: err.error || 'Error al procesar la venta.',
                    type: 'error',
                });
            },
        });
    };

    const goToCreateProduct = () => router.visit(productsRoute.create().url);

    // --- ESTADOS DERIVADOS PARA HABILITAR/DESHABILITAR ---
    const isClienteVarios = data.receiver_id_number === CLIENTE_VARIOS_RUC;
    const isAutoNumbered =
        data.document_type === TICKET_VALUE ||
        data.document_type === 'BOLETA' ||
        data.document_type === 'FACTURA';

    const toggleClienteVarios = () => {
        if (isClienteVarios) {
            // Deseleccionar: limpiar campos
            setData('receiver_id_number', '');
            setData('receiver_name', '');
        } else {
            // Seleccionar: asignar cliente por defecto
            setData('receiver_id_number', CLIENTE_VARIOS_RUC);
            setData('receiver_name', CLIENTE_VARIOS_NAME);
        }
    };
    const handlePrint = () => {
        if (lastSaleId) {
            // Opción A: Si tu helper de rutas acepta parámetros
            const url = salesRoute.ticket(lastSaleId).url;

            // Opción B (Segura): Si la anterior falla, construye la URL manualmente para probar
            // const url = `/ventas/${lastSaleId}/ticket`;

            console.log('Abriendo ticket para venta ID:', lastSaleId);
            window.open(url, '_blank');
        } else {
            console.error('No se encontró el ID de la última venta.');
        }

        setShowPrintModal(false);
    };
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: salesRoute.index().url },
                { title: 'Nueva Venta', href: '' },
            ]}
        >
            <Head title="Nueva Venta" />
            {alert && (
                <FloatingAlert
                    message={alert.message}
                    type={alert.type}
                    onClose={() => setAlert(null)}
                />
            )}
            <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Printer className="h-5 w-5 text-blue-600" />
                            Venta Exitosa
                        </DialogTitle>
                        <DialogDescription>
                            ¿Desea imprimir el ticket de venta ahora?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setShowPrintModal(false)}
                            className="flex-1"
                        >
                            No, cerrar
                        </Button>
                        <Button
                            onClick={handlePrint}
                            type={"button"}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- Header de la Venta (Color azul para consistencia) --- */}
                <div className="border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-light text-foreground">
                                Venta /{' '}
                                <span className="text-muted-foreground">
                                    Borrador
                                </span>
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => reset()}
                                disabled={processing}
                            >
                                Descartar
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                            >
                                <Save className="mr-2 h-4 w-4" /> Registrar
                                Venta
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* --- Información del Receptor (Cliente) y Documento --- */}
                        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                            {/* --- Bloque de Información del Receptor --- */}
                            <div className="space-y-4">
                                {/* Nuevo: Botón para CLIENTE VARIOS/PÚBLICO GENERAL */}
                                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Receptor
                                    </Label>
                                    <Button
                                        type="button"
                                        variant={
                                            isClienteVarios
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className={cn(
                                            'h-9 w-full',
                                            isClienteVarios
                                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                : 'border-dashed border-gray-400',
                                        )}
                                        onClick={toggleClienteVarios}
                                    >
                                        {isClienteVarios
                                            ? '✅ Cliente: Público General'
                                            : 'Cliente: Público General'}
                                    </Button>
                                </div>

                                {/* 1. DNI/RUC del Receptor */}
                                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        RUC/DNI
                                    </Label>
                                    <div className="w-full">
                                        <Input
                                            placeholder="DNI o RUC (Opcional)"
                                            value={data.receiver_id_number}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'receiver_id_number',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={isClienteVarios}
                                            className={cn(
                                                'h-9 focus-visible:ring-blue-500',
                                                errors.receiver_id_number &&
                                                    'border-red-500',
                                                isClienteVarios &&
                                                    'bg-muted/50 text-muted-foreground',
                                            )}
                                        />
                                        {errors.receiver_id_number && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.receiver_id_number}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Nombre/Razón Social del Receptor */}
                                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Razón Social
                                    </Label>
                                    <div className="w-full">
                                        <Input
                                            placeholder="Nombre o Razón Social"
                                            value={data.receiver_name}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'receiver_name',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={isClienteVarios}
                                            className={cn(
                                                'h-9 focus-visible:ring-blue-500',
                                                errors.receiver_name &&
                                                    'border-red-500',
                                                isClienteVarios &&
                                                    'bg-muted/50 text-muted-foreground',
                                            )}
                                        />
                                        {errors.receiver_name && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.receiver_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Dirección del Receptor */}
                                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Dirección
                                    </Label>
                                    <div className="w-full">
                                        <Input
                                            placeholder="Dirección (Opcional)"
                                            value={data.receiver_address}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'receiver_address',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={isClienteVarios}
                                            className={cn(
                                                'h-9 focus-visible:ring-blue-500',
                                                isClienteVarios &&
                                                    'bg-muted/50 text-muted-foreground',
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* --- Bloque de Documento y Fecha --- */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Fecha de Emisión
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'outline'}
                                                className={cn(
                                                    'h-9 w-full justify-start text-left font-normal focus-visible:ring-blue-500',
                                                    !data.issue_date &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.issue_date
                                                    ? format(
                                                          data.issue_date,
                                                          'PPP',
                                                          { locale: es },
                                                      )
                                                    : 'Seleccionar fecha'}
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
                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Tipo Documento
                                    </Label>
                                    <Select
                                        value={data.document_type}
                                        onValueChange={(val) =>
                                            onFieldChange('document_type', val)
                                        }
                                    >
                                        <SelectTrigger
                                            className={cn(
                                                'h-9 focus:ring-blue-500',
                                                errors.document_type &&
                                                    'border-red-500',
                                            )}
                                        >
                                            <SelectValue placeholder="Seleccionar..." />
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
                                    <div></div>
                                    {errors.document_type && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.document_type}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Referencia
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Serie"
                                            value={data.series}
                                            // Mantenemos readonly o disabled para que el sistema lo controle
                                            readOnly
                                            className={cn(
                                                'h-9 w-24 bg-muted text-center font-bold uppercase',
                                                errors.series &&
                                                    'border-red-500',
                                            )}
                                        />
                                        <Input
                                            // Indicamos al usuario que el número se genera al guardar
                                            placeholder="N° AUTOMÁTICO"
                                            value={data.number}
                                            readOnly
                                            className="h-9 flex-1 bg-muted text-center font-bold text-blue-600"
                                        />
                                    </div>
                                    <div></div>
                                    <div className="flex gap-2">
                                        {errors.series && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.series}
                                            </p>
                                        )}
                                        {errors.number && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.number}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- TABS --- */}
                        <Tabs defaultValue="products" className="w-full">
                            <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                                <TabsTrigger
                                    value="products"
                                    className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600"
                                >
                                    Detalle de Venta
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="products"
                                className="mt-4 space-y-4"
                            >
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                <TableHead className="w-[45%] font-semibold text-foreground">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right font-semibold text-foreground">
                                                    Cantidad
                                                </TableHead>
                                                <TableHead className="w-[20%] text-right font-semibold text-foreground">
                                                    Precio Unit.
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right font-semibold text-foreground">
                                                    Subtotal
                                                </TableHead>
                                                <TableHead className="w-[5%]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((row) => {
                                                const selectedProductIds = rows
                                                    .filter(
                                                        (r) => r.id !== row.id,
                                                    )
                                                    .map((r) =>
                                                        String(r.id_product),
                                                    );

                                                const availableProductOptions =
                                                    productOptions.filter(
                                                        (option) =>
                                                            !selectedProductIds.includes(
                                                                option.value,
                                                            ) ||
                                                            option.value ===
                                                                row.id_product,
                                                    );

                                                return (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="p-2">
                                                            <SearchableSelect
                                                                options={
                                                                    availableProductOptions
                                                                }
                                                                onCreate={
                                                                    goToCreateProduct
                                                                }
                                                                value={
                                                                    row.id_product
                                                                }
                                                                onChange={(
                                                                    val,
                                                                ) => {
                                                                    const selectedOption =
                                                                        productOptions.find(
                                                                            (
                                                                                opt,
                                                                            ) =>
                                                                                opt.value ===
                                                                                val,
                                                                        );

                                                                    setRows(
                                                                        (
                                                                            prevRows,
                                                                        ) =>
                                                                            prevRows.map(
                                                                                (
                                                                                    r,
                                                                                ) => {
                                                                                    if (
                                                                                        r.id ===
                                                                                        row.id
                                                                                    ) {
                                                                                        return {
                                                                                            ...r,
                                                                                            id_product:
                                                                                                val,
                                                                                            unit_price:
                                                                                                selectedOption?.salePrice ||
                                                                                                0,
                                                                                        };
                                                                                    }
                                                                                    return r;
                                                                                },
                                                                            ),
                                                                    );
                                                                    if (
                                                                        errors.details
                                                                    )
                                                                        clearErrors(
                                                                            'details',
                                                                        );
                                                                }}
                                                                placeholder="Seleccionar producto..."
                                                                className="h-8 border-transparent bg-transparent text-sm shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                className="h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500"
                                                                value={
                                                                    row.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'quantity',
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 1,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500"
                                                                value={
                                                                    row.unit_price
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'unit_price',
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2 text-right font-medium">
                                                            S/{' '}
                                                            {(
                                                                row.quantity *
                                                                row.unit_price
                                                            ).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="p-2 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-muted-foreground hover:text-red-600"
                                                                onClick={() =>
                                                                    removeRow(
                                                                        row.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* --- Totales de Venta --- */}
                                <div className="flex items-start justify-between">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={addRow}
                                        className="-ml-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />{' '}
                                        Agregar un producto
                                    </Button>
                                    <div className="w-80 space-y-2 text-sm">
                                        <div className="flex justify-between border-b py-2 text-muted-foreground">
                                            <span>Base Imponible</span>
                                            <span>
                                                S/ {subTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b py-2 text-muted-foreground">
                                            <span>Impuestos (IGV 18%)</span>
                                            <span>
                                                S/ {igvAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2">
                                            <span className="text-lg font-bold text-foreground">
                                                Total
                                            </span>
                                            <span className="text-lg font-bold text-foreground">
                                                S/ {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
