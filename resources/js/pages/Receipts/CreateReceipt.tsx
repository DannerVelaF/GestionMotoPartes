import { SearchableSelect } from '@/Components/SearchableSelect';
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
import receipts from '@/routes/receipts';
import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    AlertTriangle,
    CalendarIcon,
    ChevronLeft,
    Paperclip,
    Plus,
    Save,
    Trash2,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import receiptsRoute from '@/routes/receipts';

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
}

interface Props {
    suppliers: Supplier[];
    products: Product[];
    documentTypes: { value: string; label: string }[];
}

// --- COMPONENTE AUXILIAR PARA INDICADOR DE MARGEN ---
const MarginIndicator = ({
    cost,
    salePrice,
}: {
    cost: number;
    salePrice: number;
}) => {
    // Si no hay precio de venta configurado, no mostramos nada o mostramos gris
    if (!salePrice || salePrice <= 0) return null;

    const margin = salePrice - cost;
    const marginPercent = salePrice > 0 ? (margin / salePrice) * 100 : 0;

    // Caso 1: PÉRDIDA (Costo > Venta)
    if (cost > salePrice) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex cursor-help items-center gap-1 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-xs font-bold">Pérdida</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="border-red-700 bg-red-600 text-white">
                        <p>
                            ¡Cuidado! Estás comprando a{' '}
                            <strong>S/ {cost}</strong>
                        </p>
                        <p>
                            y vendes a <strong>S/ {salePrice}</strong>.
                        </p>
                        <p>
                            Pérdida de{' '}
                            <strong>S/ {Math.abs(margin).toFixed(2)}</strong>{' '}
                            por unidad.
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Caso 2: MARGEN BAJO (Ej. menos del 15% de ganancia)
    if (marginPercent < 15) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex cursor-help items-center gap-1 text-yellow-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-bold">
                                {marginPercent.toFixed(0)}%
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="border-yellow-600 bg-yellow-500 text-white">
                        <p>Margen bajo ({marginPercent.toFixed(1)}%).</p>
                        <p>Ganancia: S/ {margin.toFixed(2)}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Caso 3: BUEN MARGEN (Default)
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex cursor-help items-center gap-1 text-emerald-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-bold">
                            {marginPercent.toFixed(0)}%
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="border-emerald-700 bg-emerald-600 text-white">
                    <p>¡Buen margen!</p>
                    <p>Ganancia: S/ {margin.toFixed(2)} por unidad.</p>
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
    // ... (Estados y Hooks igual que antes) ...
    const [rows, setRows] = useState<DetailRow[]>([
        { id: Date.now(), id_product: '', quantity: 1, unit_price: 0 },
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
            { id: Date.now(), id_product: '', quantity: 1, unit_price: 0 },
        ]);
        if (errors.details) clearErrors('details');
    };

    const removeRow = (id: number) => {
        if (rows.length === 1) return;
        setRows(rows.filter((row) => row.id !== id));
    };

    const updateRow = (id: number, field: keyof DetailRow, value: any) => {
        setRows(
            rows.map((row) =>
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
        data.details = rows.map((row) => ({
            id_product: row.id_product,
            quantity: row.quantity,
            unit_price: row.unit_price,
        }));
        post(receipts.store().url, { forceFormData: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Comprobantes', href: receiptsRoute.index().url },
                { title: 'Nuevo', href: '' },
            ]}
        >
            <Head title="Nueva Compra" />

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* ... HEADER (Igual que antes) ... */}
                <div className="border-b px-6 py-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div
                            className="flex cursor-pointer items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => window.history.back()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Volver a Compras
                            </span>
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
                                <Save className="mr-2 h-4 w-4" /> Guardar
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-light text-foreground">
                            Nuevo /{' '}
                            <span className="text-muted-foreground">
                                Borrador
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* ... BLOQUE SUPERIOR (Igual que antes) ... */}
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
                                        <SelectTrigger className="h-9 focus:ring-blue-500">
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
                                                <TableHead className="w-[40%] font-semibold text-foreground">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right font-semibold text-foreground">
                                                    Cantidad
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right font-semibold text-foreground">
                                                    Costo Unit.
                                                </TableHead>
                                                <TableHead className="w-[10%] text-center font-semibold text-foreground">
                                                    Margen
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right font-semibold text-foreground">
                                                    Subtotal
                                                </TableHead>
                                                <TableHead className="w-[5%]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((row) => {
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
                                                                    productOptions
                                                                }
                                                                value={
                                                                    row.id_product
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
                                                                className="text-sm h-8 border-transparent bg-transparent shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500"
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
                                                            {selectedProduct && (
                                                                <MarginIndicator
                                                                    cost={
                                                                        row.unit_price
                                                                    }
                                                                    salePrice={
                                                                        selectedProduct.sale_price
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

                        {/* Mensajes de error */}
                        {Object.keys(errors).length > 0 && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error al guardar</AlertTitle>
                                <AlertDescription>
                                    Revisa los campos marcados en rojo.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
