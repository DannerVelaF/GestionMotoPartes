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
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import productRoutes from '@/routes/products';
import receiptsRoute from '@/routes/receipts';
import suppliersRoute from '@/routes/suppliers';
import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    ArrowRightLeft,
    Box,
    Briefcase,
    CalendarIcon,
    FileText,
    Paperclip,
    Plus,
    RotateCcw,
    Save,
    ShoppingBag,
    Trash2,
    TrendingDown,
    TrendingUp,
    Truck,
    X,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';
// --- ESTILOS REUTILIZABLES ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium dark:text-foreground dark:border-neutral-700 dark:focus:border-blue-500';

const tableInputClass =
    'h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500 tabular-nums dark:text-foreground dark:focus:bg-neutral-800';

// --- HELPER COMPONENTS ---
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

const MarginIndicator = ({
    cost,
    salePrice,
    currency,
    exchangeRate,
}: {
    cost: number;
    salePrice: number;
    currency: string;
    exchangeRate: number;
}) => {
    const numericCost = Number(cost) || 0;
    const costInSoles =
        currency === 'USD' ? numericCost * exchangeRate : numericCost;
    const numericSalePrice = Number(salePrice) || 0;
    if (numericSalePrice <= 0) return null;
    const margin = numericSalePrice - costInSoles;
    const marginPercent = (margin / numericSalePrice) * 100;
    const marginText = `S/ ${margin.toFixed(2)}`;
    if (costInSoles > numericSalePrice) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex cursor-help items-center justify-center gap-1 font-bold text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-[10px]">{marginText}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="border-none bg-red-600 text-[10px] text-white uppercase">
                        Pérdida Estimada
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    const colorClass =
        marginPercent < 15 ? 'text-yellow-600' : 'text-emerald-600';
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            colorClass,
                            'flex cursor-help items-center justify-center gap-1 font-bold',
                        )}
                    >
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-[10px]">{marginText}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    className={cn(
                        'border-none text-[10px] font-bold text-white uppercase',
                        marginPercent < 15 ? 'bg-yellow-500' : 'bg-emerald-600',
                    )}
                >
                    {marginPercent < 15 ? 'Margen Ajustado' : 'Margen Óptimo'}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

// --- INTERFACES ---
interface Supplier {
    id_supplier: number;
    company_name: string;
    ruc: string;
}
interface Product {
    id_product: number;
    product_name: string;
    product_code: string | null;
    sale_price: number;
}
interface DetailRow {
    id: number;
    type: 'product' | 'service';
    id_product: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    sale_price: number;
}
interface Props {
    suppliers: Supplier[];
    products: Product[];
    documentTypes: { value: string; label: string }[];
}

export default function CreateReceipt({
    suppliers,
    products,
    documentTypes,
}: Props) {
    const [formError, setFormError] = useState<string | null>(null);
    const [rows, setRows] = useState<DetailRow[]>([
        {
            id: Date.now(),
            type: 'product',
            id_product: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            sale_price: 0,
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
    } = useForm({
        id_supplier: '',
        document_type: '',
        series: '',
        number: '',
        currency: 'PEN',
        exchange_rate: '1.000',
        issue_date: new Date(),
        file: null as File | null,
        details: [] as any[],
    });

    const symbol = data.currency === 'USD' ? '$' : 'S/';
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
    const updateRow = (id: number, field: keyof DetailRow, value: any) =>
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );
    const toggleRowType = (id: number) =>
        setRows((prev) =>
            prev.map((row) =>
                row.id === id
                    ? {
                          ...row,
                          type: row.type === 'product' ? 'service' : 'product',
                          id_product: '',
                          description: '',
                          sale_price: 0,
                      }
                    : row,
            ),
        );

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

    const supplierOptions = suppliers.map((s) => ({
        value: String(s.id_supplier),
        label: s.company_name,
    }));
    const productOptions = products.map((p) => ({
        value: String(p.id_product),
        label: p.product_code
            ? `[${p.product_code}] ${p.product_name}`
            : p.product_name,
        salePrice: p.sale_price,
    }));
    const selectedProductIds = rows
        .map((r) => r.id_product)
        .filter((id) => id !== '');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setFormError(null);
        transform((data) => ({
            ...data,
            issue_date: format(data.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            exchange_rate: parseFloat(data.exchange_rate),
            details: rows.map((r) => ({
                id_product: r.type === 'product' ? r.id_product : null,
                description: r.type === 'service' ? r.description : null,
                quantity: r.quantity,
                unit_price: r.unit_price,
                sale_price: r.sale_price,
                is_service: r.type === 'service',
            })),
        }));
        post(receiptsRoute.store().url, {
            forceFormData: true,
            onError: (err: any) => {
                if (err.error) setFormError(err.error);
                else setFormError('Por favor corrige los campos obligatorios.');
            },
        });
    };

    const hasDetailErrors = Object.keys(errors).some((key) =>
        key.startsWith('details'),
    );

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
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                Nueva Compra
                            </h1>
                            <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                                Registro de Abastecimiento
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => reset()}
                            disabled={processing}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 text-white shadow-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            <Save className="mr-2 h-4 w-4" /> Registrar
                            Comprobante
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                            <TabsTrigger
                                value="general"
                                className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:after:bg-blue-400"
                            >
                                Información General
                            </TabsTrigger>
                            <TabsTrigger
                                value="files"
                                className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:after:bg-blue-400"
                            >
                                Archivo Adjunto
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="general"
                            className="mt-6 animate-in duration-300 fade-in-50"
                        >
                            {/* --- GRID CABECERA --- */}
                            <div className="mb-12 grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                                {/* COMERCIAL */}
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:border-neutral-800">
                                        <Truck className="h-3 w-3" /> Datos
                                        Comerciales
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                Proveedor
                                            </Label>
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
                                                onCreate={() =>
                                                    router.visit(
                                                        suppliersRoute.create()
                                                            .url,
                                                    )
                                                }
                                                className={cn(
                                                    cleanInputClass,
                                                    errors.id_supplier &&
                                                        'border-red-500',
                                                )}
                                            />
                                            <InputError
                                                message={errors.id_supplier}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Moneda
                                                </Label>
                                                <Select
                                                    value={data.currency}
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
                                                            S/ Soles (PEN)
                                                        </SelectItem>
                                                        <SelectItem value="USD">
                                                            $ Dólares (USD)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                                                        disabled={
                                                            data.currency ===
                                                            'PEN'
                                                        }
                                                        className={cn(
                                                            cleanInputClass,
                                                            'pl-6 font-mono',
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* DOCUMENTO */}
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:border-neutral-800">
                                        <FileText className="h-3 w-3" />{' '}
                                        Detalles Documento
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    Tipo Doc
                                                </Label>
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
                                                        className={cn(
                                                            cleanInputClass,
                                                            errors.document_type &&
                                                                'border-red-500',
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Seleccionar..." />
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
                                                                errors.issue_date &&
                                                                    'border-red-500',
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
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
                                                            onSelect={(d) =>
                                                                d &&
                                                                onFieldChange(
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
                                            </div>
                                        </div>
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
                                                    className={cn(
                                                        cleanInputClass,
                                                        'text-center uppercase',
                                                        errors.series &&
                                                            'border-red-500',
                                                    )}
                                                    placeholder="F001"
                                                />
                                                <InputError
                                                    message={errors.series}
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
                                                    className={cn(
                                                        cleanInputClass,
                                                        errors.number &&
                                                            'border-red-500',
                                                    )}
                                                    placeholder="000123"
                                                />
                                                <InputError
                                                    message={errors.number}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- TABLA DE LÍNEAS --- */}
                            <div className="space-y-4 pt-6">
                                <h3
                                    className={cn(
                                        'flex items-center gap-2 border-b pb-2 text-sm font-bold tracking-tight uppercase',
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
                                                <TableHead className="w-[30%] text-center text-[10px] font-bold uppercase">
                                                    Producto / Descripción
                                                </TableHead>
                                                <TableHead className="w-[8%] text-center text-[10px] font-bold uppercase">
                                                    Cant.
                                                </TableHead>
                                                <TableHead className="w-[12%] text-center text-[10px] font-bold uppercase">
                                                    Costo ({symbol})
                                                </TableHead>
                                                <TableHead className="w-[12%] text-center text-[10px] font-bold uppercase">
                                                    P. Venta (S/)
                                                </TableHead>
                                                <TableHead className="w-[12%] text-center text-[10px] font-bold text-blue-600 uppercase">
                                                    {data.currency === 'USD'
                                                        ? 'Conv. (S/)'
                                                        : ''}
                                                </TableHead>
                                                <TableHead className="w-[8%] text-center text-[10px] font-bold uppercase">
                                                    Margen
                                                </TableHead>
                                                <TableHead className="w-[12%] text-center text-[10px] font-bold uppercase">
                                                    Subtotal ({symbol})
                                                </TableHead>
                                                <TableHead className="w-[40px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    className="hover:bg-muted/20 dark:border-neutral-800"
                                                >
                                                    <TableCell className="p-2 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                'h-8 w-8 rounded-full',
                                                                row.type ===
                                                                    'service'
                                                                    ? 'bg-purple-100 text-purple-600'
                                                                    : 'bg-blue-50 text-blue-600',
                                                            )}
                                                            onClick={() =>
                                                                toggleRowType(
                                                                    row.id,
                                                                )
                                                            }
                                                        >
                                                            {row.type ===
                                                            'service' ? (
                                                                <Briefcase className="h-4 w-4" />
                                                            ) : (
                                                                <Box className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        {row.type ===
                                                        'product' ? (
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
                                                                    const opt =
                                                                        productOptions.find(
                                                                            (
                                                                                o,
                                                                            ) =>
                                                                                o.value ===
                                                                                val,
                                                                        );
                                                                    updateRow(
                                                                        row.id,
                                                                        'id_product',
                                                                        val,
                                                                    );
                                                                    updateRow(
                                                                        row.id,
                                                                        'sale_price',
                                                                        opt?.salePrice ||
                                                                            0,
                                                                    );
                                                                }}
                                                                onCreate={() =>
                                                                    router.visit(
                                                                        productRoutes.create()
                                                                            .url,
                                                                    )
                                                                }
                                                                placeholder="Buscar..."
                                                                className={
                                                                    cleanInputClass
                                                                }
                                                            />
                                                        ) : (
                                                            <Input
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
                                                                placeholder="Descripción..."
                                                                className={
                                                                    cleanInputClass
                                                                }
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input
                                                            type="number"
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
                                                    </TableCell>

                                                    {/* CELDA DE COSTO CON CONVERSIÓN VISUAL SI ES USD */}
                                                    <TableCell className="p-2">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className={
                                                                tableInputClass
                                                            }
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
                                                        {data.currency ===
                                                            'USD' &&
                                                            row.type ===
                                                                'product' &&
                                                            row.unit_price >
                                                                0 && (
                                                                <div className="mt-1 animate-in text-right font-mono text-[9px] font-bold text-amber-600 fade-in slide-in-from-top-1">
                                                                    S/{' '}
                                                                    {(
                                                                        row.unit_price *
                                                                        Number(
                                                                            data.exchange_rate,
                                                                        )
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </div>
                                                            )}
                                                    </TableCell>

                                                    <TableCell className="p-2 text-right">
                                                        {row.type ===
                                                        'product' ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                className={
                                                                    tableInputClass
                                                                }
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
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="p-2 text-center font-mono text-[11px] font-bold text-amber-600">
                                                        {data.currency ===
                                                            'USD' &&
                                                        row.type === 'product'
                                                            ? `S/ ${(row.unit_price * Number(data.exchange_rate)).toFixed(2)}`
                                                            : ''}
                                                    </TableCell>
                                                    <TableCell className="p-2 text-center">
                                                        {row.type ===
                                                            'product' && (
                                                            <MarginIndicator
                                                                cost={
                                                                    row.unit_price
                                                                }
                                                                salePrice={
                                                                    row.sale_price
                                                                }
                                                                currency={
                                                                    data.currency
                                                                }
                                                                exchangeRate={Number(
                                                                    data.exchange_rate,
                                                                )}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="p-2 text-right font-bold tabular-nums">
                                                        {symbol}{' '}
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
                                                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                                                            onClick={() =>
                                                                rows.length >
                                                                    1 &&
                                                                setRows(
                                                                    rows.filter(
                                                                        (r) =>
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
                                {/* --- FOOTER TOTALES --- */}
                                <div className="flex items-start justify-between pt-6">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setRows([
                                                ...rows,
                                                {
                                                    id: Date.now(),
                                                    type: 'product',
                                                    id_product: '',
                                                    description: '',
                                                    quantity: 1,
                                                    unit_price: 0,
                                                    sale_price: 0,
                                                },
                                            ])
                                        }
                                        className="text-[10px] font-bold tracking-widest text-blue-600 uppercase hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Añadir
                                        Ítem
                                    </Button>
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
                                            <span className="text-lg font-black uppercase">
                                                Total Compra
                                            </span>
                                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                                {symbol}{' '}
                                                {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        {data.currency === 'USD' && (
                                            <div className="mt-2 rounded-md bg-emerald-50 p-2 dark:bg-emerald-900/20">
                                                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400">
                                                    <span className="font-medium uppercase">
                                                        Total en Soles (T.C.{' '}
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

                        <TabsContent
                            value="files"
                            className="mt-6 animate-in duration-300 fade-in-50"
                        >
                            <div className="mx-auto max-w-2xl space-y-6">
                                <div className="rounded-xl border-2 border-dashed p-12 text-center dark:border-neutral-800">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                                            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold tracking-tight uppercase">
                                                Cargar Comprobante Digital
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                PDF o imagen (JPG/PNG).
                                            </p>
                                        </div>
                                        <div className="mt-4 w-full">
                                            <div
                                                className={cn(
                                                    'relative flex items-center justify-center gap-3 rounded-lg border border-muted bg-muted/5 p-4 transition-all hover:bg-blue-50/50 dark:border-neutral-800',
                                                    data.file &&
                                                        'border-emerald-500/50 bg-emerald-50/30',
                                                )}
                                            >
                                                <Paperclip
                                                    className={cn(
                                                        'h-5 w-5',
                                                        data.file
                                                            ? 'text-emerald-600'
                                                            : 'text-blue-600',
                                                    )}
                                                />
                                                <span className="text-sm font-bold">
                                                    {data.file ? (
                                                        <span className="block max-w-[300px] truncate text-emerald-700">
                                                            {data.file.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Seleccionar
                                                            archivo...
                                                        </span>
                                                    )}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'file',
                                                            e.target
                                                                .files?.[0] ||
                                                                null,
                                                        )
                                                    }
                                                />
                                                {data.file && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="relative z-20 h-8 w-8 text-red-500 hover:bg-red-100"
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
                                            <InputError
                                                message={errors.file}
                                                className="mt-2 text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </form>

            {/* ALERTA FLOTANTE */}
            {formError && (
                <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
                    <Alert
                        variant="destructive"
                        className="border-2 border-red-500 bg-white shadow-2xl dark:bg-red-950"
                    >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="ml-2 font-bold text-red-700 dark:text-white">
                            Atención
                        </AlertTitle>
                        <AlertDescription className="ml-2 text-red-600/90 dark:text-red-100/90">
                            {formError}
                        </AlertDescription>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                            onClick={() => setFormError(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </Alert>
                </div>
            )}
        </AppLayout>
    );
}
