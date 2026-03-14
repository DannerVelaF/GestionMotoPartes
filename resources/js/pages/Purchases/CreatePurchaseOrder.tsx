import { SearchableSelect } from '@/components/SearchableSelect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import suppliersRoute from '@/routes/suppliers';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertCircle,
    CheckCircle2,
    History,
    Plus,
    ShoppingBag,
    Trash2,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// --- ESTILOS REUTILIZABLES ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-emerald-600 focus:outline-none transition-all font-medium dark:text-foreground dark:border-neutral-700 dark:focus:border-emerald-500';
const tableInputClass =
    'h-8 w-full border-transparent bg-transparent text-center shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-emerald-500 tabular-nums dark:text-foreground dark:focus:bg-neutral-800';

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
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100'
                        : 'border-red-500 bg-white text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100',
                )}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2 font-bold">
                    {isSuccess ? '¡Éxito!' : 'Atención'}
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
        <div className="w-[160px] shrink-0 pr-4 text-sm font-bold text-muted-foreground">
            {label}
        </div>
        <div className="flex-1">{children}</div>
    </div>
);

// --- CUSTOM HOOK PARA REDIMENSIONAR COLUMNAS ---
const useTableResize = (initialWidths: Record<string, number>) => {
    const [widths, setWidths] = useState(initialWidths);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const onMouseDown = (e: React.MouseEvent, col: string) => {
        setIsResizing(col);
        startX.current = e.clientX;
        startWidth.current = (
            e.target as HTMLElement
        ).parentElement!.offsetWidth;
        e.preventDefault();
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = Math.max(
                50,
                startWidth.current + (e.clientX - startX.current),
            );
            setWidths((prev) => ({ ...prev, [isResizing]: newWidth }));
        };
        const onMouseUp = () => setIsResizing(null);

        if (isResizing) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [isResizing]);

    return { widths, onMouseDown, isResizing };
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
    id_product: string | null;
    description: string;
    quantity: number;
    unit_cost: number;
    margin_percentage: number;
    suggested_sale_price: number;
}
interface Props {
    suppliers: Supplier[];
    products: Product[];
}

export default function CreatePurchaseOrder({ suppliers, products }: Props) {
    const { props } = usePage();
    const serverErrors: any = props.errors;
    const today = new Date().toISOString().split('T')[0];

    const [formError, setFormError] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isWritingNote, setIsWritingNote] = useState(false);

    // Anchos iniciales (Solo de las columnas numéricas)
    const { widths, onMouseDown, isResizing } = useTableResize({
        product: 350,
        qty: 90,
        cost: 110,
        margin: 90,
        sale_price: 110,
        subtotal: 120,
        action: 60,
    });

    const [rows, setRows] = useState<DetailRow[]>([
        {
            id: Date.now(),
            id_product: '',
            description: '',
            quantity: 1,
            unit_cost: 0,
            margin_percentage: 30, // 30% por defecto
            suggested_sale_price: 0,
        },
    ]);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        clearErrors,
        transform,
        isDirty,
    } = useForm({
        id_supplier: '',
        po_code: '',
        order_type: 'purchase', // 'purchase' o 'service'
        currency: 'PEN',
        exchange_rate: '1.000',
        issue_date: new Date(),
        expected_date: new Date(new Date().setDate(new Date().getDate() + 7)),
        notes: '',
        internal_note: '',
        status: 'draft',
    });

    const isServiceOrder = data.order_type === 'service';
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

    const updateRow = (id: number, field: keyof DetailRow, value: any) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;

                const newRow = { ...row, [field]: value };

                if (field === 'unit_cost' || field === 'margin_percentage') {
                    const cost =
                        field === 'unit_cost' ? Number(value) : row.unit_cost;
                    const margin =
                        field === 'margin_percentage'
                            ? Number(value)
                            : row.margin_percentage;
                    if (cost > 0) {
                        newRow.suggested_sale_price = parseFloat(
                            (cost + cost * (margin / 100)).toFixed(2),
                        );
                    }
                }

                if (field === 'suggested_sale_price') {
                    const salePrice = Number(value);
                    if (salePrice > 0 && row.unit_cost > 0) {
                        const profit = salePrice - row.unit_cost;
                        newRow.margin_percentage = parseFloat(
                            ((profit / row.unit_cost) * 100).toFixed(2),
                        );
                    }
                }

                return newRow;
            }),
        );
    };

    const totalAmount = rows.reduce(
        (acc, row) => acc + row.quantity * row.unit_cost,
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
    }));
    const selectedProductIds = rows
        .map((r) => r.id_product)
        .filter((id) => id !== '');

    useEffect(() => {
        if (serverErrors?.error || localError) {
            const timer = setTimeout(() => setLocalError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [serverErrors, localError]);

    const submitForm = (targetStatus: 'draft' | 'sent') => {
        setFormError(null);

        const hasProducts = rows.some(
            (r) =>
                (!isServiceOrder && r.id_product) ||
                (isServiceOrder && r.description),
        );

        if (targetStatus === 'sent' && !hasProducts) {
            setFormError(
                `Debes agregar al menos un ${isServiceOrder ? 'servicio' : 'producto'} para enviar la orden.`,
            );
            return;
        }

        transform((currentData) => ({
            ...currentData,
            status: targetStatus,
            issue_date: format(currentData.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            expected_date: currentData.expected_date
                ? format(currentData.expected_date, 'yyyy-MM-dd')
                : null,
            exchange_rate: parseFloat(currentData.exchange_rate),
            total_amount: totalAmount,
            details: rows
                .filter(
                    (r) =>
                        (!isServiceOrder && r.id_product) ||
                        (isServiceOrder && r.description),
                )
                .map((r) => ({
                    id_product: !isServiceOrder ? r.id_product : null,
                    description: isServiceOrder ? r.description : null,
                    quantity: r.quantity,
                    unit_cost: r.unit_cost,
                    margin_percentage: r.margin_percentage,
                    suggested_sale_price: r.suggested_sale_price,
                    subtotal: r.quantity * r.unit_cost,
                    is_service: isServiceOrder,
                })),
        }));

        post('/compras/ordenes', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsWritingNote(false);
                setData('internal_note', '');
            },
            onError: (err: any) => {
                if (err.error) setFormError(err.error);
                else
                    setFormError(
                        'Por favor corrige los campos obligatorios antes de guardar.',
                    );
            },
        });
    };

    const hasDetailErrors = Object.keys(errors).some((key) =>
        key.startsWith('details'),
    );

    const minTableWidth = Object.values(widths).reduce((acc, w) => acc + w, 0);

    const ResizableTh = ({
        col,
        label,
        align = 'center',
        className = '',
    }: {
        col: string;
        label: React.ReactNode;
        align?: string;
        className?: string;
    }) => (
        <TableHead
            style={{ width: widths[col], minWidth: 50 }}
            className={cn(
                `relative px-4 py-3 text-${align} text-[10px] font-bold uppercase`,
                className,
                isResizing === col && 'bg-muted/50',
            )}
        >
            {label}
            <div
                className="absolute top-0 right-0 z-10 h-full w-2 cursor-col-resize touch-none hover:bg-emerald-500/50"
                onMouseDown={(e) => onMouseDown(e, col)}
            />
        </TableHead>
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Compras', href: '/compras/ordenes' },
                { title: 'Nueva Orden', href: '#' },
            ]}
        >
            <Head title="Nueva Orden de Compra" />

            <FloatingAlert
                message={
                    formError || localError || (serverErrors?.error as string)
                }
                type="error"
            />

            {/* CONTENEDOR PRINCIPAL */}
            <div className="flex h-full flex-col overflow-hidden bg-background">
                {/* TOOLBAR SUPERIOR */}
                <div className="flex shrink-0 flex-col border-b border-border bg-card">
                    <div className="flex items-center px-6 py-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Nueva
                        </span>
                        <span className="mx-2">/</span> Cotización (Borrador)
                    </div>

                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => submitForm('sent')}
                                disabled={processing || rows.length === 0}
                                className="h-8 rounded-sm bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
                            >
                                {processing && data.status === 'sent'
                                    ? 'Enviando...'
                                    : 'Confirmar Orden'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => submitForm('draft')}
                                disabled={
                                    processing ||
                                    (!isDirty && !data.internal_note)
                                }
                                className="h-8 rounded-sm text-foreground shadow-sm"
                            >
                                {processing && data.status === 'draft'
                                    ? 'Guardando...'
                                    : 'Guardar Borrador'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.history.back()}
                                className="h-8 rounded-sm text-muted-foreground hover:bg-muted"
                            >
                                Descartar
                            </Button>
                        </div>

                        {/* StatusBar Visual */}
                        <div className="flex h-8 items-center overflow-hidden rounded-sm border border-border bg-muted/30 text-xs font-bold tracking-wider uppercase">
                            <div className="relative flex h-full items-center justify-center border-r border-border bg-emerald-600/10 px-4 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Cotización
                            </div>
                            <div className="flex h-full items-center justify-center border-r border-border px-4 text-muted-foreground opacity-50">
                                Orden Confirmada
                            </div>
                            <div className="flex h-full items-center justify-center px-4 text-muted-foreground opacity-50">
                                Completada
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENEDOR INFERIOR DIVIDIDO */}
                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {/* PANEL IZQUIERDO (Formulario 100%) */}
                    <div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8">
                        <div className="w-full min-w-[800px] space-y-8">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-30" />
                                <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase md:text-4xl">
                                    NUEVA ORDEN / {today.replace(/-/g, '')}
                                </h1>
                            </div>

                            {/* CABECERA (Grilla corregida) */}
                            <div className="grid grid-cols-1 gap-x-12 gap-y-2 pt-4 xl:grid-cols-2">
                                <div className="space-y-1">
                                    <FormFieldRow label="Tipo de Orden">
                                        <Select
                                            value={data.order_type}
                                            onValueChange={(val) =>
                                                onFieldChange('order_type', val)
                                            }
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    cleanInputClass,
                                                    'font-bold text-emerald-700 dark:text-emerald-400',
                                                )}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="purchase">
                                                    Orden de Compra (Bienes)
                                                </SelectItem>
                                                <SelectItem value="service">
                                                    Orden de Servicio
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormFieldRow>

                                    <FormFieldRow label="Proveedor">
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
                                    </FormFieldRow>

                                    <FormFieldRow label="Referencia Proveedor">
                                        <Input
                                            value={data.notes}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'notes',
                                                    e.target.value,
                                                )
                                            }
                                            className={cleanInputClass}
                                            placeholder="Ej: Cotización #12345..."
                                        />
                                    </FormFieldRow>
                                </div>
                                <div className="space-y-1">
                                    <FormFieldRow label="Moneda">
                                        <Select
                                            value={data.currency}
                                            onValueChange={handleCurrencyChange}
                                        >
                                            <SelectTrigger
                                                className={cleanInputClass}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PEN">
                                                    Soles (PEN)
                                                </SelectItem>
                                                <SelectItem value="USD">
                                                    Dólares (USD)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormFieldRow>

                                    <FormFieldRow label="Tipo de Cambio">
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
                                            disabled={data.currency === 'PEN'}
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label="Fecha de Orden">
                                        <Input
                                            type="date"
                                            value={format(
                                                data.issue_date,
                                                'yyyy-MM-dd',
                                            )}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'issue_date',
                                                    new Date(e.target.value),
                                                )
                                            }
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label="Llegada Esperada">
                                        <Input
                                            type="date"
                                            value={
                                                data.expected_date
                                                    ? format(
                                                          data.expected_date,
                                                          'yyyy-MM-dd',
                                                      )
                                                    : ''
                                            }
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'expected_date',
                                                    new Date(e.target.value),
                                                )
                                            }
                                            className={cn(
                                                cleanInputClass,
                                                'font-medium text-emerald-600',
                                            )}
                                        />
                                    </FormFieldRow>
                                </div>
                            </div>

                            {/* TABLA DE PRODUCTOS */}
                            <div className="w-full pt-6">
                                <div className="mb-4 flex gap-6 border-b border-border text-sm font-bold text-muted-foreground">
                                    <span className="border-b-2 border-emerald-600 pb-2 text-foreground transition-colors">
                                        {isServiceOrder
                                            ? 'Servicios a Contratar'
                                            : 'Productos a Comprar'}
                                    </span>
                                </div>

                                <div
                                    className={cn(
                                        'w-full overflow-x-auto rounded-sm border border-border bg-card shadow-sm',
                                        hasDetailErrors && 'border-red-500',
                                    )}
                                >
                                    <table
                                        className="table-fixed text-left text-sm"
                                        style={{ minWidth: minTableWidth }}
                                    >
                                        <TableHeader className="bg-muted/30 select-none dark:bg-neutral-900">
                                            <TableRow className="dark:border-neutral-800">
                                                {/* Columna flexible que tomará todo el ancho restante */}
                                                <ResizableTh
                                                    col="product"
                                                    label={
                                                        isServiceOrder
                                                            ? 'Descripción del Servicio'
                                                            : 'Producto / Descripción'
                                                    }
                                                    align="left"
                                                    className="px-4"
                                                />

                                                <ResizableTh
                                                    col="qty"
                                                    label="Cantidad."
                                                />
                                                <ResizableTh
                                                    col="cost"
                                                    label={`Costo (${symbol})`}
                                                    className="text-emerald-600 dark:text-emerald-400"
                                                />

                                                {!isServiceOrder && (
                                                    <>
                                                        <ResizableTh
                                                            col="margin"
                                                            label="% Margen"
                                                            className="text-emerald-600 dark:text-emerald-400"
                                                        />
                                                        <ResizableTh
                                                            col="sale_price"
                                                            label="P. Venta"
                                                            className="text-emerald-600 dark:text-emerald-400"
                                                        />
                                                    </>
                                                )}

                                                <ResizableTh
                                                    col="subtotal"
                                                    label="Subtotal"
                                                    align="right"
                                                />
                                                <ResizableTh
                                                    col="action"
                                                    label=""
                                                />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border/50">
                                            {rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="group transition-colors hover:bg-muted/10"
                                                >
                                                    <td className="overflow-hidden px-4 py-2 align-top">
                                                        {!isServiceOrder ? (
                                                            <div className="w-full">
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
                                                                        updateRow(
                                                                            row.id,
                                                                            'id_product',
                                                                            val,
                                                                        );
                                                                        updateRow(
                                                                            row.id,
                                                                            'unit_cost',
                                                                            row.unit_cost,
                                                                        );
                                                                    }}
                                                                    placeholder="Buscar producto..."
                                                                    className="h-8 w-full border-transparent shadow-none focus:ring-1 focus:ring-emerald-500"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full">
                                                                <Input
                                                                    value={
                                                                        row.description
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            row.id,
                                                                            'description',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Descripción del servicio..."
                                                                    className="h-8 w-full border-transparent shadow-none focus:ring-1 focus:ring-emerald-500"
                                                                />
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="overflow-hidden px-2 py-2 align-top">
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
                                                    </td>

                                                    <td className="overflow-hidden px-2 py-2 align-top">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className={cn(
                                                                tableInputClass,
                                                                'text-emerald-600 dark:text-emerald-400',
                                                            )}
                                                            value={
                                                                row.unit_cost
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'unit_cost',
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    {!isServiceOrder && (
                                                        <>
                                                            <td className="overflow-hidden px-2 py-2 align-top">
                                                                <div className="flex items-center justify-center">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        className={cn(
                                                                            tableInputClass,
                                                                            'px-1 text-center text-emerald-600 dark:text-emerald-400',
                                                                        )}
                                                                        value={
                                                                            row.margin_percentage
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateRow(
                                                                                row.id,
                                                                                'margin_percentage',
                                                                                parseFloat(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ) ||
                                                                                    0,
                                                                            )
                                                                        }
                                                                    />
                                                                    <span className="ml-1 text-[10px] text-muted-foreground">
                                                                        %
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="overflow-hidden px-2 py-2 align-top">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className={cn(
                                                                        tableInputClass,
                                                                        'text-emerald-600 dark:text-emerald-400',
                                                                    )}
                                                                    value={
                                                                        row.suggested_sale_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            row.id,
                                                                            'suggested_sale_price',
                                                                            parseFloat(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        )
                                                                    }
                                                                />
                                                            </td>
                                                        </>
                                                    )}

                                                    <td className="bg-muted/10 px-2 py-3 text-right align-middle font-bold tabular-nums">
                                                        {symbol}{' '}
                                                        {(
                                                            row.quantity *
                                                            row.unit_cost
                                                        ).toFixed(2)}
                                                    </td>
                                                    <td className="px-2 py-3 text-center align-middle">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30"
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
                                                    </td>
                                                </tr>
                                            ))}

                                            <tr>
                                                <td
                                                    colSpan={
                                                        isServiceOrder ? 5 : 7
                                                    }
                                                    className="bg-muted/5 px-4 py-2"
                                                >
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                                        onClick={() =>
                                                            setRows([
                                                                ...rows,
                                                                {
                                                                    id: Date.now(),
                                                                    id_product:
                                                                        '',
                                                                    description:
                                                                        '',
                                                                    quantity: 1,
                                                                    unit_cost: 0,
                                                                    margin_percentage: 30,
                                                                    suggested_sale_price: 0,
                                                                } as DetailRow,
                                                            ])
                                                        }
                                                    >
                                                        <Plus className="mr-1 h-4 w-4" />{' '}
                                                        Añadir línea
                                                    </Button>
                                                </td>
                                            </tr>
                                        </TableBody>
                                    </table>
                                </div>

                                {/* TOTALES */}
                                <div className="flex justify-end pt-6 pb-20">
                                    <div className="w-full max-w-sm space-y-2">
                                        <div className="flex justify-between border-b border-border pb-2 text-sm font-medium text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span>
                                                {symbol} {subTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-border pb-2 text-sm font-medium text-muted-foreground">
                                            <span>IGV Estimado (18%)</span>
                                            <span>
                                                {symbol} {igvAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 text-xl font-black text-emerald-600 dark:text-emerald-400">
                                            <span>Total</span>
                                            <span>
                                                {symbol}{' '}
                                                {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        {data.currency === 'USD' && (
                                            <div className="flex justify-between pt-1 text-xs font-bold text-blue-600">
                                                <span>
                                                    Equiv. Soles (T.C.{' '}
                                                    {data.exchange_rate})
                                                </span>
                                                <span>
                                                    S/ {totalInSoles.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL DERECHO (LOGS ESTÁTICO) */}
                    <div className="relative hidden h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10 xl:flex">
                        <div className="z-10 flex shrink-0 items-center gap-1 border-b border-border bg-card p-2 shadow-sm">
                            <Button
                                variant="ghost"
                                className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
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
                                    <p className="leading-relaxed text-muted-foreground">
                                        Creando borrador de Orden. El historial
                                        y las notas se guardarán en la base de
                                        datos al presionar "Guardar Borrador".
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
