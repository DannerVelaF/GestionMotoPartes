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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium dark:text-foreground';
const tableInputClass =
    'h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500 tabular-nums';

// --- HELPER COMPONENT: ERROR MESSAGE ---
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
                'mt-1 animate-pulse text-[10px] font-medium text-red-500',
                className,
            )}
        >
            {message}
        </p>
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

// --- HELPER COMPONENT: INDICADOR DE MARGEN ---
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
    // Convertimos a Soles si la compra es en Dólares para comparar con el precio de venta (que suele ser en Soles)
    const costInSoles =
        currency === 'USD' ? numericCost * exchangeRate : numericCost;

    const numericSalePrice = Number(salePrice) || 0;

    // Si no hay precio de venta definido, no mostramos nada
    if (numericSalePrice <= 0) return null;

    const margin = numericSalePrice - costInSoles;
    const marginPercent = (margin / numericSalePrice) * 100;
    const marginText = `S/ ${margin.toFixed(2)}`;

    // CASO DE PÉRDIDA
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
                    <TooltipContent className="border-none bg-red-600 text-white">
                        <p className="text-xs font-bold uppercase">
                            Posible Pérdida (Ref. Cambio)
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // CASO DE GANANCIA
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
                        'border-none text-white',
                        marginPercent < 15 ? 'bg-yellow-500' : 'bg-emerald-600',
                    )}
                >
                    <p className="text-[10px] font-bold uppercase">
                        {marginPercent < 15
                            ? 'Margen Ajustado (<15%)'
                            : '¡Margen Óptimo!'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function CreateReceipt({
    suppliers,
    products,
    documentTypes,
}: Props) {
    const [formError, setFormError] = useState<string | null>(null);

    // Estado inicial de las filas
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
        currency: 'PEN', // Por defecto Soles
        exchange_rate: '1.000', // Por defecto 1.000
        issue_date: new Date(),
        file: null as File | null,
        details: [] as any[],
    });

    const symbol = data.currency === 'USD' ? '$' : 'S/';

    // --- MANEJADORES ---

    const handleCurrencyChange = (val: string) => {
        setData((prev) => ({
            ...prev,
            currency: val,
            // Resetear o sugerir tipo de cambio al cambiar moneda
            exchange_rate: val === 'PEN' ? '1.000' : '3.800',
        }));
    };

    const toggleRowType = (id: number) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id === id) {
                    const isNowService = row.type === 'product';
                    return {
                        ...row,
                        type: isNowService ? 'service' : 'product',
                        id_product: '', // Limpiamos ID al cambiar
                        description: '', // Limpiamos descripción al cambiar
                        sale_price: 0, // Servicios no suelen tener P.Venta sugerido directo
                    };
                }
                return row;
            }),
        );
    };

    // Helper para actualizar campos del formulario general
    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    // Helper para actualizar filas de la tabla
    const updateRow = (id: number, field: keyof DetailRow, value: any) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );
    };

    // Detectar errores en array de detalles para pintar borde rojo
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

    // Total referencial en soles (si es USD)
    const totalInSoles =
        data.currency === 'USD'
            ? totalAmount * Number(data.exchange_rate)
            : totalAmount;

    // --- PREPARACIÓN DE OPCIONES ---
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

    // --- SUBMIT ---
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
                if (err.error) {
                    setFormError(err.error);
                } else if (Object.keys(err).length > 0) {
                    setFormError(
                        hasDetailErrors
                            ? 'Hay errores en la lista de ítems.'
                            : 'Por favor corrige los campos obligatorios.',
                    );
                }
            },
        });
    };
    const isService = row.type === 'service';
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
                {/* --- HEADER STICKY (RESTAURADO) --- */}
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
                            variant="outline"
                            type="button"
                            onClick={() => reset()}
                            disabled={processing}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        >
                            <Save className="mr-2 h-4 w-4" /> Registrar
                            Comprobante
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <div className="mx-auto max-w-7xl space-y-10">
                        {/* --- GRID SUPERIOR: DATOS GENERALES --- */}
                        <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
                            {/* COLUMNA IZQUIERDA: COMERCIAL */}
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                    <Truck className="h-3 w-3" /> Datos
                                    Comerciales
                                </h3>
                                <div className="space-y-4">
                                    {/* Proveedor */}
                                    <div className="space-y-2">
                                        <Label
                                            className={cn(
                                                'text-[10px] font-bold uppercase',
                                                errors.id_supplier
                                                    ? 'text-red-500'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            Proveedor Seleccionado
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
                                                    suppliersRoute.create().url,
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

                                    {/* Moneda y TC */}
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
                                                    className={cleanInputClass}
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
                                            <Label
                                                className={cn(
                                                    'text-[10px] font-bold text-muted-foreground uppercase',
                                                    data.currency === 'PEN' &&
                                                        'opacity-50',
                                                )}
                                            >
                                                Tipo de Cambio
                                            </Label>
                                            <div className="relative">
                                                <ArrowRightLeft className="absolute top-2.5 left-0 h-3 w-3 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={data.exchange_rate}
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'exchange_rate',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={
                                                        data.currency === 'PEN'
                                                    }
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
                                            <Label
                                                className={cn(
                                                    'text-[10px] font-bold uppercase',
                                                    errors.series
                                                        ? 'text-red-500'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
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
                                            <Label
                                                className={cn(
                                                    'text-[10px] font-bold uppercase',
                                                    errors.number
                                                        ? 'text-red-500'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
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

                            {/* COLUMNA DERECHA: DOCUMENTO */}
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                    <FileText className="h-3 w-3" /> Detalles
                                    Documento
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label
                                                className={cn(
                                                    'text-[10px] font-bold uppercase',
                                                    errors.document_type
                                                        ? 'text-red-500'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                Tipo Comprobante
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
                                            <InputError
                                                message={errors.document_type}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                className={cn(
                                                    'text-[10px] font-bold uppercase',
                                                    errors.issue_date
                                                        ? 'text-red-500'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                Fecha Emisión
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            cleanInputClass,
                                                            'text-left font-medium',
                                                            !data.issue_date &&
                                                                'text-muted-foreground',
                                                            errors.issue_date &&
                                                                'border-red-500 text-red-500',
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
                                                            : 'Elegir fecha...'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="flex w-auto flex-col p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={
                                                            data.issue_date
                                                        }
                                                        onSelect={(d) => {
                                                            if (d) {
                                                                const newDate =
                                                                    new Date(d);
                                                                newDate.setHours(
                                                                    data.issue_date.getHours(),
                                                                    data.issue_date.getMinutes(),
                                                                );
                                                                onFieldChange(
                                                                    'issue_date',
                                                                    newDate,
                                                                );
                                                            }
                                                        }}
                                                        disabled={(date) =>
                                                            date > new Date()
                                                        }
                                                    />
                                                    <div className="flex items-center justify-between gap-4 border-t bg-muted/20 p-3">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                            Hora:
                                                        </span>
                                                        <Input
                                                            type="time"
                                                            className="h-8 w-[110px] font-mono text-xs font-bold"
                                                            value={format(
                                                                data.issue_date,
                                                                'HH:mm',
                                                            )}
                                                            onChange={(e) => {
                                                                const [h, m] =
                                                                    e.target.value.split(
                                                                        ':',
                                                                    );
                                                                const newDate =
                                                                    new Date(
                                                                        data.issue_date,
                                                                    );
                                                                newDate.setHours(
                                                                    parseInt(h),
                                                                    parseInt(m),
                                                                );
                                                                onFieldChange(
                                                                    'issue_date',
                                                                    newDate,
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <InputError
                                                message={errors.issue_date}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            className={cn(
                                                'text-[10px] font-bold uppercase',
                                                errors.file
                                                    ? 'text-red-500'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            Archivo Adjunto
                                        </Label>

                                        <div
                                            className={cn(
                                                'relative flex items-center gap-2 border-b border-muted py-2 transition-all',
                                                'cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20',
                                                data.file &&
                                                    'rounded-t-sm border-emerald-500/50 bg-emerald-50/30 px-2 hover:bg-emerald-100/30',
                                                errors.file && 'border-red-500',
                                            )}
                                        >
                                            <Paperclip
                                                className={cn(
                                                    'h-4 w-4 transition-colors',
                                                    'text-blue-600 group-hover:text-blue-700',
                                                )}
                                            />

                                            <span className="flex-1 truncate text-xs font-medium text-foreground/80">
                                                {data.file ? (
                                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                        {data.file.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground group-hover:text-blue-600">
                                                        Clic para subir
                                                        Comprobante (PDF/JPG)
                                                    </span>
                                                )}
                                            </span>

                                            <Input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                                onChange={(e) =>
                                                    onFieldChange(
                                                        'file',
                                                        e.target.files?.[0] ||
                                                            null,
                                                    )
                                                }
                                            />

                                            {data.file && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    // z-20 para estar ENCIMA del input invisible
                                                    className="relative z-20 h-6 w-6 hover:bg-red-100 hover:text-red-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onFieldChange(
                                                            'file',
                                                            null,
                                                        );
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <InputError message={errors.file} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- TABLA DE DETALLES --- */}
                        <div className="space-y-4 pt-6">
                            <h3
                                className={cn(
                                    'flex items-center gap-2 border-b pb-2 text-sm font-bold tracking-tight uppercase',
                                    hasDetailErrors
                                        ? 'border-red-500 text-red-500'
                                        : 'border-blue-100 text-slate-800 dark:text-neutral-200',
                                )}
                            >
                                <ShoppingBag className="h-4 w-4" /> Líneas de
                                Compra ({data.currency})
                            </h3>

                            {/* Alerta visual si hay errores */}
                            {hasDetailErrors && (
                                <div className="mb-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                    <p className="flex items-center gap-2 text-xs font-bold">
                                        <AlertCircle className="h-4 w-4" />
                                        Existen errores en los ítems listados.
                                    </p>
                                </div>
                            )}

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
                                            <TableHead className="w-[50px] text-center text-[10px] font-bold text-muted-foreground uppercase">
                                                Tipo
                                            </TableHead>
                                            <TableHead className="w-[30%] text-center text-[10px] font-bold text-muted-foreground uppercase">
                                                Descripción / Producto
                                            </TableHead>
                                            <TableHead className="w-[8%] text-center text-[10px] font-bold text-muted-foreground uppercase">
                                                Cant.
                                            </TableHead>
                                            <TableHead className="w-[12%] text-center text-[10px] font-bold text-muted-foreground uppercase">
                                                Costo ({symbol})
                                            </TableHead>
                                            <TableHead className="w-[12%] text-center text-[10px] font-bold text-muted-foreground uppercase">
                                                P. Venta (S/)
                                            </TableHead>
                                            {/* Cabecera condicional o siempre visible pero centrada */}
                                            <TableHead className="w-[12%] text-center text-[10px] font-bold text-blue-600 uppercase dark:text-blue-400">
                                                {data.currency === 'USD'
                                                    ? 'Conversión (S/)'
                                                    : ''}
                                            </TableHead>
                                            <TableHead className="w-[8%] text-center text-[10px] font-bold text-muted-foreground uppercase">
                                                Margen
                                            </TableHead>
                                            <TableHead className="w-[12%] text-center text-[10px] font-bold text-muted-foreground uppercase">
                                                Subtotal ({symbol})
                                            </TableHead>
                                            <TableHead className="w-[40px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, index) => {
                                            const isService =
                                                row.type === 'service';
                                            const exchangeRate =
                                                Number(data.exchange_rate) || 1;

                                            return (
                                                <TableRow
                                                    key={row.id}
                                                    className="hover:bg-muted/20 dark:border-neutral-800"
                                                >
                                                    {/* 1. TIPO */}
                                                    <TableCell className="p-2 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                'h-8 w-8 rounded-full',
                                                                isService
                                                                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                                                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300',
                                                            )}
                                                            onClick={() =>
                                                                toggleRowType(
                                                                    row.id,
                                                                )
                                                            }
                                                        >
                                                            {isService ? (
                                                                <Briefcase className="h-4 w-4" />
                                                            ) : (
                                                                <Box className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>

                                                    {/* 2. PRODUCTO / DESCRIPCIÓN */}
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
                                                                placeholder="Descripción del servicio..."
                                                                className={
                                                                    cleanInputClass
                                                                }
                                                            />
                                                        )}
                                                    </TableCell>

                                                    {/* 3. CANTIDAD */}
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

                                                    {/* 4. COSTO UNITARIO */}
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
                                                    </TableCell>

                                                    {/* 5. PRECIO VENTA (S/) */}
                                                    <TableCell className="p-2">
                                                        {!isService ? (
                                                            <div className="relative">
                                                                <span className="absolute top-1.5 left-0 text-[10px] font-bold text-muted-foreground">
                                                                    S/
                                                                </span>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className={cn(
                                                                        tableInputClass,
                                                                        'pl-4',
                                                                    )}
                                                                    value={
                                                                        row.sale_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            row.id,
                                                                            'sale_price',
                                                                            parseFloat(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-muted-foreground">
                                                                -
                                                            </div>
                                                        )}
                                                    </TableCell>

                                                    {/* 6. CONVERSIÓN EN LÍNEA (Solo si es USD y no es servicio) */}
                                                    <TableCell className="p-2 text-center">
                                                        {data.currency ===
                                                            'USD' &&
                                                        !isService ? (
                                                            <div className="flex animate-in flex-col items-center duration-200 zoom-in-95 fade-in">
                                                                <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                                                    S/{' '}
                                                                    {(
                                                                        row.unit_price *
                                                                        exchangeRate
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </span>
                                                                <span className="text-[8px] leading-none text-muted-foreground uppercase">
                                                                    Costo Ref.
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                    </TableCell>

                                                    {/* 7. MARGEN */}
                                                    <TableCell className="p-2 text-center">
                                                        {!isService ? (
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
                                                                exchangeRate={
                                                                    exchangeRate
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                -
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {/* 8. SUBTOTAL */}
                                                    <TableCell className="p-2 text-right font-bold text-foreground tabular-nums">
                                                        {symbol}{' '}
                                                        {(
                                                            row.quantity *
                                                            row.unit_price
                                                        ).toFixed(2)}
                                                    </TableCell>

                                                    {/* 9. ACCIONES */}
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
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* --- FOOTER: TOTALES --- */}
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
                                        <span className="text-lg font-black tracking-tighter text-foreground uppercase">
                                            Total Compra
                                        </span>
                                        <span className="text-2xl font-black text-blue-600 tabular-nums dark:text-blue-400">
                                            {symbol} {totalAmount.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Mostrar ref. en Soles si es USD */}
                                    {data.currency === 'USD' && (
                                        <div className="flex justify-between border-t border-dashed border-neutral-300 pt-2 text-xs text-muted-foreground">
                                            <span>
                                                Valor en Soles (Ref. T.C.{' '}
                                                {data.exchange_rate})
                                            </span>
                                            <span className="font-bold">
                                                S/ {totalInSoles.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* --- ALERTA FLOTANTE --- */}
            {formError && (
                <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
                    <Alert
                        variant="destructive"
                        className="border-2 border-red-500 bg-white text-red-950 shadow-2xl dark:border-red-900 dark:bg-red-950 dark:text-red-50"
                    >
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-100" />
                        <AlertTitle className="ml-2 font-bold text-red-700 dark:text-white">
                            Atención
                        </AlertTitle>
                        <AlertDescription className="ml-2 text-red-600/90 dark:text-red-100/90">
                            {formError}
                        </AlertDescription>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-red-500 hover:bg-red-100 hover:text-red-700 dark:text-red-200 dark:hover:bg-red-900/50 dark:hover:text-white"
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
