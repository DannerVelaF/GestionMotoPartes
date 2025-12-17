import { SearchableSelect } from '@/components/SearchableSelect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'; // Necesario para el detalle del margen
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import productsRoute from '@/routes/products';
import {
    default as receipts,
    default as receiptsRoute,
} from '@/routes/receipts';
import suppliersRoute from '@/routes/suppliers';
import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    AlertTriangle,
    CalendarIcon,
    CheckCircle2,
    Paperclip,
    Plus,
    Save,
    Trash2,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

// --- Interfaces ---
interface Supplier {
    id_supplier: number;
    company_name: string;
    ruc: string;
}

interface Product {
    id_product: number;
    product_name: string;
    product_code: string | null;
    sale_price: number; // <--- NUEVO CAMPO
}

interface DetailRow {
    id: number;
    id_product: string;
    quantity: number;
    unit_price: number;
    sale_price: number;
}

interface Props {
    suppliers: Supplier[];
    products: Product[];
    documentTypes: { value: string; label: string }[];
}

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
            // Ya está corregido a fixed top-6 right-6
            className={`fixed top-6 right-6 z-50 w-auto max-w-md animate-in fade-in slide-in-from-top-2`}
        >
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={`border-2 shadow-xl ${
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'border-red-500 bg-white text-red-900 dark:border-red-700 dark:bg-slate-900 dark:text-red-300'
                }`}
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

const MarginIndicator = ({
    cost,
    salePrice,
}: {
    cost: number;
    salePrice: number;
}) => {
    // ✅ CORRECCIÓN 1: Asegurar que las entradas son números válidos.
    const numericCost = Number(cost) || 0;
    const numericSalePrice = Number(salePrice) || 0;

    // Si no hay precio de venta configurado, no mostramos nada.
    if (numericSalePrice <= 0) return null;

    const margin = numericSalePrice - numericCost;
    const marginPercent = (margin / numericSalePrice) * 100;

    // Texto de Ganancia/Pérdida para mostrar en la celda
    const marginText = `S/ ${margin.toFixed(2)}`;
    const percentText = ` (${marginPercent.toFixed(0)}%)`;

    // Caso 1: PÉRDIDA (Costo > Venta)
    if (numericCost > numericSalePrice) {
        // Usar las variables convertidas
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex cursor-help items-center gap-1 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-xs font-bold whitespace-nowrap">
                                {marginText}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="border-red-700 bg-red-600 text-white">
                        <p>PÉRDIDA. Costo: S/ {numericCost.toFixed(2)}</p>
                        <p>Venta: S/ {numericSalePrice.toFixed(2)}</p>
                        <p>
                            Pérdida neta: {marginText}
                            {percentText}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Caso 2 & 3: MARGEN (Ganancia)
    const colorClass =
        marginPercent < 15 ? 'text-yellow-600' : 'text-emerald-600';
    const Icon = marginPercent < 15 ? AlertTriangle : TrendingUp;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            colorClass,
                            'flex cursor-help items-center gap-1',
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-bold whitespace-nowrap">
                            {marginText}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    className={cn(
                        `border-emerald-700 text-white`,
                        marginPercent < 15
                            ? 'border-yellow-600 bg-yellow-500'
                            : 'bg-emerald-600',
                    )}
                >
                    <p>
                        {marginPercent < 15 ? 'Margen Bajo' : '¡Buen margen!'}
                    </p>
                    <p>
                        Ganancia: {marginText}
                        {percentText}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default function CreateReceipt({
    suppliers,
    products,
    documentTypes,
}: Props) {
    const [formError, setFormError] = useState<string | null>(null);
    const [rows, setRows] = useState<DetailRow[]>([
        {
            id: Date.now(),
            id_product: '',
            quantity: 1,
            unit_price: 0,
            sale_price: 0,
        },
    ]);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            id_supplier: '',
            document_type: '',
            series: '',
            number: '',
            issue_date: new Date(),
            file: null as File | null,
            details: [] as any[],
        });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    // ... (Funciones addRow, removeRow, updateRow igual que antes) ...
    const addRow = () => {
        setRows([
            ...rows,
            {
                id: Date.now(),
                id_product: '',
                quantity: 1,
                unit_price: 0,
                sale_price: 0,
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

    const totalAmount = rows.reduce(
        (acc, row) => acc + row.quantity * row.unit_price,
        0,
    );
    const igvAmount = totalAmount - totalAmount / 1.18;
    const subTotal = totalAmount - igvAmount;

    // --- Helpers de Opciones ---
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const detailsToSend = rows.map((row) => ({
            id_product: row.id_product,
            quantity: row.quantity,
            unit_price: row.unit_price,
            sale_price: row.sale_price, // Incluir el precio de venta
        }));

        // 2. Validación de Pérdida en el FRONTEND (Regla de negocio)
        const hasLoss = rows.some(
            (row) =>
                Number(row.unit_price) > Number(row.sale_price) &&
                Number(row.sale_price) > 0,
        );

        if (hasLoss) {
            setFormError(
                '¡Advertencia! Hay productos cuyo costo es superior al precio de venta. Revise la columna Margen.',
            );
            // 🛑 Detener el envío a Inertia
            return;
        } else {
            setFormError(null); // Limpiar error si la validación pasa
        }

        data.details = detailsToSend;

        // 3. Envío con manejo de error del backend
        post(receipts.store().url, {
            forceFormData: true,
            onSuccess: () => {
                // Opcional: Mostrar éxito si no hay redirección
                // setManualAlert({ message: 'Comprobante registrado correctamente.', type: 'success' });
            },
            onError: (backendErrors) => {
                // Capturar el error de validación de negocio lanzado en el controlador
                if (backendErrors.error) {
                    setFormError(backendErrors.error);
                }
            },
        });
    };

    const goToCreateSupplier = () => router.visit(suppliersRoute.create().url);
    const goToCreateProduct = () => router.visit(productsRoute.create().url);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Comprobantes', href: receiptsRoute.index().url },
                { title: 'Nuevo', href: '' },
            ]}
        >
            <Head title="Nueva Compra" />

            {formError && (
                <div className="fixed top-0 right-0 z-[100]">
                    <FloatingAlert message={formError} type="error" />
                </div>
            )}

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                <div className="border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className={"flex gap-2"}>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-light text-foreground">
                                    Nuevo /{' '}
                                    <span className="text-muted-foreground">
                                        Borrador
                                    </span>
                                </h1>
                            </div>
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
                                <Save className="mr-2 h-4 w-4" /> Registrar comprobante
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-7xl space-y-8">
                        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Proveedor
                                    </Label>
                                    <div className="w-full">
                                        <SearchableSelect
                                            options={supplierOptions}
                                            value={data.id_supplier}
                                            onChange={(val) =>
                                                onFieldChange(
                                                    'id_supplier',
                                                    val,
                                                )
                                            }
                                            placeholder="Seleccionar proveedor..."
                                            error={errors.id_supplier}
                                            onCreate={goToCreateSupplier}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Referencia
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="F001"
                                            value={data.series}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'series',
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            className={cn(
                                                'h-9 w-24 uppercase focus-visible:ring-blue-500',
                                                errors.series &&
                                                    'border-red-500',
                                            )}
                                        />
                                        <Input
                                            placeholder="000123"
                                            value={data.number}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'number',
                                                    e.target.value,
                                                )
                                            }
                                            className={cn(
                                                'h-9 flex-1 focus-visible:ring-blue-500',
                                                errors.number &&
                                                    'border-red-500',
                                            )}
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
                            </div>
                        </div>

                        {/* --- TABS --- */}
                        <Tabs defaultValue="products" className="w-full">
                            <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                                <TabsTrigger
                                    value="products"
                                    className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600"
                                >
                                    Productos
                                </TabsTrigger>
                                <TabsTrigger
                                    value="other"
                                    className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600"
                                >
                                    Otra Información
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
                                                <TableHead className="w-[35%] font-semibold text-foreground">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="w-[10%] text-right font-semibold text-foreground">
                                                    Cantidad
                                                </TableHead>
                                                {/* REVISIÓN: Renombrar Costo Venta a Precio Venta */}
                                                <TableHead className="w-[15%] text-right font-semibold text-foreground">
                                                    Precio Venta
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right font-semibold text-foreground">
                                                    Costo Unit.
                                                </TableHead>
                                                <TableHead className="w-[15%] text-center font-semibold text-foreground">
                                                    Margen
                                                </TableHead>
                                                <TableHead className="w-[10%] text-right font-semibold text-foreground">
                                                    Subtotal
                                                </TableHead>
                                                <TableHead className="w-[5%]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((row) => {
                                                // 1. Obtener los IDs de los productos ya seleccionados por OTRAS filas
                                                const selectedProductIds = rows
                                                    .filter(
                                                        (r) => r.id !== row.id, // Excluye la fila actual
                                                    )
                                                    .map((r) =>
                                                        String(r.id_product),
                                                    );

                                                // 2. Filtrar las opciones: Incluir solo el producto actual (si está seleccionado)
                                                //    y los que no están en la lista de seleccionados por otras filas.
                                                const availableProductOptions =
                                                    productOptions.filter(
                                                        (option) =>
                                                            !selectedProductIds.includes(
                                                                option.value,
                                                            ) ||
                                                            option.value ===
                                                                row.id_product,
                                                    );

                                                // BUSCAMOS EL PRODUCTO SELECCIONADO PARA SABER SU PRECIO DE VENTA
                                                const selectedProduct =
                                                    products.find(
                                                        (p) =>
                                                            String(
                                                                p.id_product,
                                                            ) ===
                                                            row.id_product,
                                                    );

                                                return (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="p-2">
                                                            <SearchableSelect
                                                                options={
                                                                    // 3. Usar la lista de opciones filtrada
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
                                                                    const newProduct =
                                                                        products.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                String(
                                                                                    p.id_product,
                                                                                ) ===
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
                                                                                            // 2. Asigna el precio de venta del producto seleccionado
                                                                                            sale_price:
                                                                                                newProduct
                                                                                                    ? newProduct.sale_price
                                                                                                    : 0,
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
                                                                step="0.01"
                                                                className="h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500"
                                                                value={
                                                                    row.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'quantity',
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
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
                                                                    row.sale_price
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'sale_price',
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
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

                                                        {/* COLUMNA DE INDICADOR DE MARGEN */}
                                                        <TableCell className="flex h-12 items-center justify-center p-2">
                                                            {/* Solo mostramos el indicador si hay producto seleccionado */}
                                                            {row.id_product && (
                                                                <MarginIndicator
                                                                    cost={
                                                                        row.unit_price
                                                                    }
                                                                    salePrice={
                                                                        row.sale_price
                                                                    }
                                                                />
                                                            )}
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

                            {/* ... TAB OTRA INFO (Igual que antes) ... */}
                            <TabsContent value="other" className="mt-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="border-b pb-2 font-semibold text-foreground">
                                            Archivos Adjuntos
                                        </h3>
                                        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                            <Label className="text-right text-muted-foreground">
                                                Comprobante
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    type="button"
                                                    className="relative"
                                                >
                                                    <Paperclip className="mr-2 h-4 w-4" />
                                                    {data.file
                                                        ? 'Archivo seleccionado'
                                                        : 'Adjuntar PDF'}
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
                                                {data.file && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {data.file.name}
                                                    </span>
                                                )}
                                            </div>
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
