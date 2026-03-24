import { FloatingAlert } from '@/components/FloatingAlert';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import productRoutes from '@/routes/products';
import salesRoute from '@/routes/sales';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    CalendarIcon,
    FileText,
    History,
    Lock,
    Plus,
    RotateCcw,
    Save,
    Search,
    ShoppingBag,
    Trash2,
    User,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

// --- Estilos Consistentes ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium dark:text-foreground';
const disabledInputClass =
    'h-9 w-full rounded-none border-0 border-b border-dashed border-muted-foreground/30 bg-muted/5 px-0 text-sm shadow-none focus:ring-0 text-foreground font-semibold flex items-center gap-2';
const tableInputClass =
    'h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500 tabular-nums';

interface Product {
    id_product: number;
    product_name: string;
    product_code: string | null;
    sale_price: number;
    stock: number;
}

interface Tax {
    id_tax: number;
    name: string;
    percentage: number;
}

interface DetailRow {
    id: number;
    id_product: string;
    id_tax: string;
    quantity: number;
    unit_price: number;
}

interface Props {
    products: Product[];
    methodsPayment: {
        id_method_payment: number;
        name_method_payment: string;
    }[];
    documentTypes: { value: string; label: string }[];
    taxes: Tax[];
}

const CLIENTE_VARIOS_RUC = '00000000';
const CLIENTE_VARIOS_NAME = 'PÚBLICO EN GENERAL';
const TICKET_VALUE = 'nota_venta';

export default function CreateSales({
    products,
    documentTypes,
    methodsPayment,
    taxes,
}: Props) {
    const { props: pageProps } = usePage<any>();

    // Buscar el ID del impuesto por defecto (ej. IGV 18%)
    const defaultTaxId =
        taxes.find((t) => Number(t.percentage) === 18)?.id_tax.toString() ||
        taxes[0]?.id_tax.toString() ||
        '';

    const [rows, setRows] = useState<DetailRow[]>([
        {
            id: Date.now(),
            id_product: '',
            id_tax: defaultTaxId,
            quantity: 1,
            unit_price: 0,
        },
    ]);
    const [isSearching, setIsSearching] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

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
        receiver_id_number: '',
        receiver_name: '',
        receiver_address: '',
        document_type: '',
        series: '',
        number: '',
        issue_date: new Date(),
        method_payment_id: '',
        discount: 0, // ✅ Nuevo campo para descuento global
        details: [] as any[],
    });

    const handleSearchDocument = async () => {
        const doc = data.receiver_id_number;
        if (doc.length !== 8 && doc.length !== 11) return;
        setIsSearching(true);
        try {
            const response = await axios.get(
                `/api/consultar-documento/${doc}`,
                { headers: { Accept: 'application/json' } },
            );
            const res = response.data;
            if (res.success) {
                const isNameEmptyOrDefault =
                    !data.receiver_name ||
                    data.receiver_name === CLIENTE_VARIOS_NAME;
                if (isNameEmptyOrDefault) setData('receiver_name', res.nombre);
            }
        } catch (error: any) {
            console.error('Error:', error.message);
        } finally {
            setIsSearching(false);
        }
    };

    const onFieldChange = (field: keyof typeof data, value: any) => {
        if (field === 'document_type') {
            const hasManualData =
                data.receiver_id_number !== '' &&
                data.receiver_id_number !== CLIENTE_VARIOS_RUC;
            if (hasManualData) {
                const seriesMap: any = {
                    [TICKET_VALUE]: 'T001',
                    boleta: 'B001',
                    factura: 'F001',
                };
                setData((prev) => ({
                    ...prev,
                    document_type: value,
                    series: seriesMap[value] || '',
                }));
            } else {
                if (value === TICKET_VALUE || value === 'boleta') {
                    setData((prev) => ({
                        ...prev,
                        document_type: value,
                        receiver_id_number: CLIENTE_VARIOS_RUC,
                        receiver_name: CLIENTE_VARIOS_NAME,
                        series: value === 'boleta' ? 'B001' : 'T001',
                    }));
                } else {
                    setData((prev) => ({
                        ...prev,
                        document_type: value,
                        receiver_id_number: '',
                        receiver_name: '',
                        series: 'F001',
                    }));
                }
            }
        } else {
            setData(field, value);
        }
        if (errors[field]) clearErrors(field);
    };

    const updateRow = (id: number, field: keyof DetailRow, value: any) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );
    };

    // ✅ Lógica de cálculos Corregida: El precio es la Base, el IGV se suma.
    const rowsWithCalculations = useMemo(() => {
        return rows.map((row) => {
            const selectedTax = taxes.find(
                (t) => t.id_tax.toString() === row.id_tax,
            );
            const taxPercent = selectedTax ? Number(selectedTax.percentage) : 0;

            // 1. Base Imponible de la línea (Subtotal Neto)
            const lineNetSubtotal = row.quantity * row.unit_price;

            // 2. Impuesto de la línea sumado por encima
            const lineTaxAmount = lineNetSubtotal * (taxPercent / 100);

            // 3. Total Final de la línea
            const lineTotal = lineNetSubtotal + lineTaxAmount;

            return { ...row, lineTotal, lineNetSubtotal, lineTaxAmount };
        });
    }, [rows, taxes]);

    const subTotal = rowsWithCalculations.reduce(
        (acc, r) => acc + r.lineNetSubtotal,
        0,
    );
    const igvAmount = rowsWithCalculations.reduce(
        (acc, r) => acc + r.lineTaxAmount,
        0,
    );

    // ✅ Aplicar descuento al Total General
    const totalBeforeDiscount = subTotal + igvAmount;
    const discountAmount = Number(data.discount) || 0;
    const totalAmount = Math.max(0, totalBeforeDiscount - discountAmount);

    const productOptions = products.map((p) => ({
        value: String(p.id_product),
        label: p.product_code
            ? `[${p.product_code}] ${p.product_name}`
            : p.product_name,
        salePrice: p.sale_price,
        stock: p.stock,
    }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setFormError(null);

        transform((currentData) => ({
            ...currentData,
            issue_date: format(currentData.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            subtotal: subTotal.toFixed(2),
            tax: igvAmount.toFixed(2),
            discount: discountAmount.toFixed(2),
            total: totalAmount.toFixed(2),
            details: rows
                .filter((r) => r.id_product !== '')
                .map((r) => ({
                    id_product: r.id_product,
                    id_tax: r.id_tax,
                    quantity: r.quantity,
                    unit_price: r.unit_price,
                })),
        }));

        post(salesRoute.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setRows([
                    {
                        id: Date.now(),
                        id_product: '',
                        id_tax: defaultTaxId,
                        quantity: 1,
                        unit_price: 0,
                    },
                ]);
            },
            onError: (errs) => {
                if (errs.error) setFormError(errs.error as string);
            },
        });
    };

    const selectedProductIds = rows
        .map((r) => r.id_product)
        .filter((id) => id !== '');

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: salesRoute.index().url },
                { title: 'Nueva Venta', href: '' },
            ]}
        >
            <Head title="Nueva Venta" />

            <FloatingAlert
                message={formError || (pageProps.flash?.error as string)}
                type="error"
                onClose={() => setFormError(null)}
            />

            <form
                onSubmit={submit}
                className="flex h-full flex-col overflow-hidden bg-background"
            >
                {/* TOOLBAR */}
                <div className="flex shrink-0 flex-col border-b border-border bg-card">
                    <div className="flex items-center px-6 py-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-blue-600">
                            Nueva
                        </span>
                        <span className="mx-2">/</span> Venta (Borrador)
                    </div>

                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            <Button
                                type="submit"
                                disabled={
                                    processing ||
                                    rows.length === 0 ||
                                    rows[0].id_product === ''
                                }
                                className="h-8 rounded-sm bg-blue-600 px-4 text-white shadow-md hover:bg-blue-700 active:scale-95"
                            >
                                <Save className="mr-2 h-4 w-4" /> Registrar
                                Venta
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => reset()}
                                disabled={processing}
                                className="h-8 rounded-sm"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                            </Button>
                        </div>
                        <div className="flex h-8 items-center rounded-sm border bg-muted/30 px-4 text-[10px] font-bold tracking-widest uppercase">
                            Borrador
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {/* PANEL IZQUIERDO: FORMULARIO */}
                    <div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8">
                        <div className="w-full min-w-[800px] animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-30" />
                                <h1 className="text-3xl font-bold tracking-tight uppercase md:text-4xl">
                                    NUEVA VENTA /{' '}
                                    {format(new Date(), 'yyyyMMdd')}
                                </h1>
                            </div>

                            <div className="grid grid-cols-1 gap-x-12 gap-y-2 pt-4 xl:grid-cols-2">
                                {/* BLOQUE CLIENTE */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                            <User className="h-3 w-3" />{' '}
                                            Información del Cliente
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                'h-7 px-2 text-[10px] font-bold uppercase',
                                                data.receiver_id_number ===
                                                    CLIENTE_VARIOS_RUC
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20'
                                                    : 'border text-muted-foreground',
                                            )}
                                            onClick={() =>
                                                onFieldChange(
                                                    'document_type',
                                                    data.document_type,
                                                )
                                            }
                                        >
                                            Público General
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                RUC / DNI
                                            </Label>
                                            <div className="relative w-full">
                                                <Input
                                                    value={
                                                        data.receiver_id_number
                                                    }
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'receiver_id_number',
                                                            e.target.value,
                                                        )
                                                    }
                                                    onKeyDown={(e) =>
                                                        e.key === 'Enter' &&
                                                        (e.preventDefault(),
                                                        handleSearchDocument())
                                                    }
                                                    className={cn(
                                                        cleanInputClass,
                                                        'pr-10',
                                                    )}
                                                    placeholder="00000000"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isSearching}
                                                    onClick={
                                                        handleSearchDocument
                                                    }
                                                    className="absolute top-1/2 right-0 h-8 w-8 -translate-y-1/2 text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Search className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                Razón Social
                                            </Label>
                                            <Input
                                                value={data.receiver_name}
                                                onChange={(e) =>
                                                    onFieldChange(
                                                        'receiver_name',
                                                        e.target.value,
                                                    )
                                                }
                                                className={cleanInputClass}
                                                placeholder="Nombre del cliente"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                            Dirección
                                        </Label>
                                        <Input
                                            value={data.receiver_address}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'receiver_address',
                                                    e.target.value,
                                                )
                                            }
                                            className={cleanInputClass}
                                            placeholder="Dirección del cliente"
                                        />
                                    </div>
                                </div>

                                {/* BLOQUE DOCUMENTO */}
                                <div className="space-y-6">
                                    <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                        <FileText className="h-3 w-3" />{' '}
                                        Detalles de Operación
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                Tipo de Documento
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
                                                    className={cleanInputClass}
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
                                            {errors.document_type && (
                                                <p className="text-xs font-bold text-red-500">
                                                    {errors.document_type}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                Fecha y Hora (Automático)
                                            </Label>
                                            <div className={disabledInputClass}>
                                                <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                                                {format(data.issue_date, 'Pp', {
                                                    locale: es,
                                                })}
                                                <Lock className="ml-auto h-3 w-3 text-muted-foreground/40" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                Referencia (Serie - Número)
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        disabledInputClass,
                                                        'w-24 justify-center text-center font-bold',
                                                    )}
                                                >
                                                    {data.series || '---'}
                                                </div>
                                                <span className="text-muted-foreground">
                                                    -
                                                </span>
                                                <div
                                                    className={cn(
                                                        disabledInputClass,
                                                        'flex-1 justify-center text-center text-sm font-bold text-blue-600',
                                                    )}
                                                >
                                                    AUTOMÁTICO
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                Método de pago
                                            </Label>
                                            <Select
                                                value={data.method_payment_id}
                                                onValueChange={(val) =>
                                                    onFieldChange(
                                                        'method_payment_id',
                                                        val,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    className={cleanInputClass}
                                                >
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {methodsPayment.map(
                                                        (method) => (
                                                            <SelectItem
                                                                key={
                                                                    method.id_method_payment
                                                                }
                                                                value={String(
                                                                    method.id_method_payment,
                                                                )}
                                                            >
                                                                {
                                                                    method.name_method_payment
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.method_payment_id && (
                                                <p className="text-xs font-bold text-red-500">
                                                    {errors.method_payment_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- TABLA DE ARTÍCULOS --- */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 border-b border-blue-100 pb-2 text-sm font-bold tracking-tight text-slate-800 uppercase dark:text-neutral-200">
                                    <ShoppingBag className="h-4 w-4 text-blue-600" />{' '}
                                    Artículos de la Venta
                                </h3>
                                <div className="overflow-hidden rounded-xl border bg-card shadow-sm dark:border-neutral-800">
                                    <Table>
                                        <TableHeader className="bg-muted/30 dark:bg-neutral-900">
                                            <TableRow className="dark:border-neutral-800">
                                                <TableHead className="w-[35%] text-[10px] font-black uppercase">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="w-[10%] text-center text-[10px] font-black uppercase">
                                                    Stock
                                                </TableHead>
                                                <TableHead className="w-[10%] text-right text-[10px] font-black uppercase">
                                                    Cantidad
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right text-[10px] font-black uppercase">
                                                    Valor Unit. (Sin IGV)
                                                </TableHead>
                                                <TableHead className="w-[15%] text-center text-[10px] font-black uppercase">
                                                    Impuesto
                                                </TableHead>
                                                <TableHead className="w-[15%] text-right text-[10px] font-black uppercase">
                                                    Total Línea
                                                </TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((row, index) => {
                                                const selectedOpt =
                                                    productOptions.find(
                                                        (o) =>
                                                            o.value ===
                                                            row.id_product,
                                                    );
                                                const stock =
                                                    selectedOpt?.stock ?? 0;
                                                const filteredOptions =
                                                    productOptions.filter(
                                                        (opt) =>
                                                            !selectedProductIds.includes(
                                                                opt.value,
                                                            ) ||
                                                            opt.value ===
                                                                row.id_product,
                                                    );

                                                const rowCalc =
                                                    rowsWithCalculations[index];

                                                return (
                                                    <TableRow
                                                        key={row.id}
                                                        className="hover:bg-blue-50/20 dark:border-neutral-800"
                                                    >
                                                        <TableCell className="p-2">
                                                            <SearchableSelect
                                                                options={
                                                                    filteredOptions
                                                                }
                                                                value={
                                                                    row.id_product
                                                                }
                                                                onChange={(
                                                                    val,
                                                                ) => {
                                                                    const opt =
                                                                        productOptions.find(
                                                                            (
                                                                                o,
                                                                            ) =>
                                                                                String(
                                                                                    o.value,
                                                                                ) ===
                                                                                val,
                                                                        );
                                                                    updateRow(
                                                                        row.id,
                                                                        'id_product',
                                                                        val,
                                                                    );
                                                                    // Asignar el precio de venta sugerido asumiendo que es la Base Imponible
                                                                    updateRow(
                                                                        row.id,
                                                                        'unit_price',
                                                                        opt?.salePrice ||
                                                                            0,
                                                                    );
                                                                }}
                                                                placeholder="Buscar producto..."
                                                                className={
                                                                    cleanInputClass
                                                                }
                                                                onCreate={() =>
                                                                    router.visit(
                                                                        productRoutes.create()
                                                                            .url,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2 text-center">
                                                            {row.id_product && (
                                                                <div
                                                                    className={cn(
                                                                        'inline-flex flex-col rounded px-2 py-0.5',
                                                                        stock <=
                                                                            0
                                                                            ? 'bg-red-50 text-red-700 dark:bg-red-500/10'
                                                                            : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10',
                                                                    )}
                                                                >
                                                                    <span className="text-[8px] font-black tracking-tighter uppercase">
                                                                        Stock
                                                                    </span>
                                                                    <span className="text-sm font-black">
                                                                        {stock}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="p-2">
                                                            <Input
                                                                type="number"
                                                                className={cn(
                                                                    tableInputClass,
                                                                    row.quantity >
                                                                        stock &&
                                                                        row.id_product &&
                                                                        'font-black text-red-600',
                                                                )}
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
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2 text-center">
                                                            <Select
                                                                value={
                                                                    row.id_tax
                                                                }
                                                                onValueChange={(
                                                                    v,
                                                                ) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'id_tax',
                                                                        v,
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="h-8 justify-center border-transparent bg-transparent text-center text-[11px] font-bold focus:ring-0">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {taxes.map(
                                                                        (t) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    t.id_tax
                                                                                }
                                                                                value={t.id_tax.toString()}
                                                                                className="text-[10px] font-bold uppercase"
                                                                            >
                                                                                {
                                                                                    t.name
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="p-2 text-right font-bold text-foreground tabular-nums">
                                                            S/{' '}
                                                            {rowCalc?.lineTotal.toFixed(
                                                                2,
                                                            )}
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
                                                                            (
                                                                                r,
                                                                            ) =>
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
                                                    id_product: '',
                                                    id_tax: defaultTaxId,
                                                    quantity: 1,
                                                    unit_price: 0,
                                                },
                                            ])
                                        }
                                        className="text-[10px] font-bold tracking-widest text-blue-600 uppercase hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Añadir
                                        Artículo
                                    </Button>
                                    <div className="w-full max-w-xs space-y-3 rounded-xl border bg-muted/10 p-6 dark:border-neutral-800">
                                        <div className="flex justify-between text-sm font-medium text-muted-foreground">
                                            <span>Base Imponible</span>
                                            <span>
                                                S/ {subTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium text-muted-foreground">
                                            <span>IGV (Detallado)</span>
                                            <span>
                                                S/ {igvAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                            <span>Descuento</span>
                                            <div className="flex items-center gap-1">
                                                <span>S/</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="h-7 w-20 px-2 text-right text-xs"
                                                    value={data.discount}
                                                    onChange={(e) =>
                                                        setData(
                                                            'discount',
                                                            parseFloat(
                                                                e.target.value,
                                                            ) || 0,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-between border-t border-blue-200 pt-4 dark:border-neutral-700">
                                            <span className="text-lg font-black tracking-tighter text-foreground uppercase">
                                                Total Venta
                                            </span>
                                            <span className="text-2xl font-black text-blue-600 tabular-nums dark:text-blue-400">
                                                S/ {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL DERECHO: HISTORIAL / CHATTER */}
                    <div className="relative hidden h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10 xl:flex">
                        <div className="z-10 flex shrink-0 items-center gap-1 border-b border-border bg-card p-2 shadow-sm">
                            <Button
                                variant="ghost"
                                className="h-8 text-xs font-bold text-muted-foreground"
                            >
                                Enviar mensaje
                            </Button>
                        </div>
                        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
                            <div className="relative space-y-6 border-l-2 border-border pl-6">
                                <div className="text-sm">
                                    <div className="absolute top-0 -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-background">
                                        <History className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="font-bold text-foreground">
                                            Sistema
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Ahora
                                        </span>
                                    </div>
                                    <p className="leading-relaxed text-muted-foreground italic">
                                        Creando nueva Venta. El registro
                                        contable (Comprobante) y el descuento de
                                        inventario se ejecutarán de forma
                                        automática al presionar "Registrar
                                        Venta".
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
