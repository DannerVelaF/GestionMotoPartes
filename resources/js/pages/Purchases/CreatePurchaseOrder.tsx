import { FloatingAlert } from '@/components/FloatingAlert';
import { SearchableSelect } from '@/components/SearchableSelect';
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
import { Head, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { History, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { usePermission } from '@/hooks/usePermission';

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
    purchase_price: number;
}
interface Tax {
    id_tax: number;
    name: string;
    percentage: number;
    scope: string;
}
interface DetailRow {
    id: number;
    id_product: string | null;
    id_tax: string;
    description: string;
    quantity: number;
    unit_cost: number;
    margin_percentage: number;
    suggested_sale_price: number;
}
interface Props {
    suppliers: Supplier[];
    products: Product[];
    taxes: Tax[];
}

export default function CreatePurchaseOrder({
    suppliers,
    products,
    taxes,
}: Props) {
    const { props: pageProps } = usePage<any>();
    const today = new Date().toISOString().split('T')[0];
    const { hasPermission } = usePermission();

    const [formError, setFormError] = useState<string | null>(null);

    const { widths, onMouseDown, isResizing } = useTableResize({
        product: 320,
        qty: 80,
        cost: 100,
        tax: 120,
        margin: 80,
        sale_price: 100,
        subtotal: 110,
        action: 50,
    });

    const defaultTaxId =
        taxes.find((t) => Number(t.percentage) === 18)?.id_tax.toString() ||
        taxes[0]?.id_tax.toString() ||
        '';

    const [rows, setRows] = useState<DetailRow[]>([
        {
            id: Date.now(),
            id_product: '',
            id_tax: defaultTaxId,
            description: '',
            quantity: 1,
            unit_cost: 0,
            margin_percentage: 30,
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
        order_type: 'purchase',
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

    const handleCurrencyChange = (val: string) => {
        setData((prev) => ({
            ...prev,
            currency: val,
            exchange_rate: val === 'PEN' ? '1.000' : '3.800',
        }));
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
                    if (cost > 0)
                        newRow.suggested_sale_price = parseFloat(
                            (cost * (1 + margin / 100)).toFixed(2),
                        );
                }
                if (field === 'suggested_sale_price') {
                    const salePrice = Number(value);
                    const cost = row.unit_cost;
                    if (salePrice > 0 && cost > 0)
                        newRow.margin_percentage = parseFloat(
                            (((salePrice - cost) / cost) * 100).toFixed(2),
                        );
                }
                return newRow;
            }),
        );
    };

    const onFieldChange = (field: string, value: any) => {
        setData(field as any, value);
        if (errors[field as keyof typeof errors]) clearErrors(field as any);
    };

    const rowsWithCalculations = rows.map((row) => {
        const selectedTax = taxes.find(
            (t) => t.id_tax.toString() === row.id_tax,
        );
        const taxPercent = selectedTax ? Number(selectedTax.percentage) : 0;
        const lineNetSubtotal = row.quantity * row.unit_cost;
        const lineTaxAmount = lineNetSubtotal * (taxPercent / 100);
        return { ...row, lineNetSubtotal, lineTaxAmount };
    });

    const subTotal = rowsWithCalculations.reduce(
        (acc, r) => acc + r.lineNetSubtotal,
        0,
    );
    const igvAmount = rowsWithCalculations.reduce(
        (acc, r) => acc + r.lineTaxAmount,
        0,
    );
    const totalAmount = subTotal + igvAmount;
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
    const selectedProductIds = rows.map((r) => r.id_product).filter(Boolean);

    const submitForm = (targetStatus: 'draft' | 'sent') => {
        setFormError(null);
        transform((currentData) => ({
            ...currentData,
            status: targetStatus,
            issue_date: format(currentData.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            expected_date: currentData.expected_date
                ? format(currentData.expected_date, 'yyyy-MM-dd')
                : null,
            total_amount: totalAmount,
            details: rows
                .filter((r) => (isServiceOrder ? r.description : r.id_product))
                .map((r) => ({
                    id_product: !isServiceOrder ? r.id_product : null,
                    description: isServiceOrder ? r.description : null,
                    quantity: r.quantity,
                    unit_cost: r.unit_cost,
                    id_tax: r.id_tax,
                    margin_percentage: r.margin_percentage,
                    suggested_sale_price: r.suggested_sale_price,
                    subtotal: r.quantity * r.unit_cost,
                    is_service: isServiceOrder,
                })),
        }));

        post('/compras/ordenes', { forceFormData: true });
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
    }: any) => (
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
                className="absolute top-0 right-0 z-10 h-full w-2 cursor-col-resize hover:bg-emerald-500/50"
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
                message={formError || (pageProps.flash?.error as string)}
                type="error"
            />

            <div className="flex h-full flex-col overflow-hidden bg-background">
                {/* TOOLBAR SUPERIOR */}
                <div className="flex shrink-0 flex-col border-b border-border bg-card">
                    <div className="flex items-center px-6 py-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-emerald-600">
                            Nueva
                        </span>
                        <span className="mx-2">/</span> Cotización (Borrador)
                    </div>

                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            {hasPermission('purchase.create') && (
                                <>
                                    <Button
                                        onClick={() => submitForm('sent')}
                                        disabled={processing || rows.length === 0}
                                        className="h-8 rounded-sm bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                                    >
                                        Confirmar Orden
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => submitForm('draft')}
                                        disabled={processing}
                                        className="h-8 rounded-sm"
                                    >
                                        Guardar Borrador
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => window.history.back()}
                                        className="h-8"
                                    >
                                        Descartar
                                    </Button>
                                </>
                            )}

                        </div>
                        <div className="flex h-8 items-center rounded-sm border bg-muted/30 px-4 text-[10px] font-bold tracking-widest uppercase">
                            Cotización
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8">
                        <div className="w-full min-w-[800px] space-y-8">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-30" />
                                <h1 className="text-3xl font-bold tracking-tight uppercase md:text-4xl">
                                    NUEVA ORDEN / {today.replace(/-/g, '')}
                                </h1>
                            </div>

                            <div className="grid grid-cols-1 gap-x-12 gap-y-2 pt-4 xl:grid-cols-2">
                                <div className="space-y-1">
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
                                            className={cleanInputClass}
                                        />
                                        <InputError
                                            message={errors.id_supplier}
                                        />
                                    </FormFieldRow>
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
                                    <FormFieldRow label="Referencia">
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
                                    <FormFieldRow label="Tipo Cambio">
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
                                    {/* ✅ CAMPO AGREGADO: Fecha de llegada esperada */}
                                    <FormFieldRow label="Llegada esperada">
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
                                                    e.target.value
                                                        ? new Date(
                                                              e.target.value,
                                                          )
                                                        : null,
                                                )
                                            }
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
                                    <FormFieldRow label="Tipo Orden">
                                        <Select
                                            value={data.order_type}
                                            onValueChange={(v) =>
                                                onFieldChange('order_type', v)
                                            }
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    cleanInputClass,
                                                    'font-bold text-emerald-700',
                                                )}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="purchase">
                                                    Orden de Compra
                                                </SelectItem>
                                                <SelectItem value="service">
                                                    Orden de Servicio
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormFieldRow>
                                </div>
                            </div>

                            {/* TABLA Y TOTALES (Sin cambios significativos para no romper el diseño) */}
                            <div
                                className={cn(
                                    'mt-6 w-full overflow-x-auto rounded-sm border border-border bg-card shadow-sm',
                                    hasDetailErrors && 'border-red-500',
                                )}
                            >
                                <table
                                    className="table-fixed text-left text-sm"
                                    style={{ minWidth: minTableWidth }}
                                >
                                    <TableHeader className="bg-muted/30 select-none">
                                        <TableRow>
                                            <ResizableTh
                                                col="product"
                                                label="Descripción"
                                                align="left"
                                                className="px-4"
                                            />
                                            <ResizableTh
                                                col="qty"
                                                label="Cant."
                                            />
                                            <ResizableTh
                                                col="cost"
                                                label="Costo"
                                            />
                                            <ResizableTh
                                                col="tax"
                                                label="Impuesto"
                                            />
                                            {!isServiceOrder && (
                                                <>
                                                    <ResizableTh
                                                        col="margin"
                                                        label="% Margen"
                                                    />
                                                    <ResizableTh
                                                        col="sale_price"
                                                        label="P. Venta"
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
                                                className="group hover:bg-muted/10"
                                            >
                                                <td className="px-4 py-2 align-top">
                                                    {!isServiceOrder ? (
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
                                                            onChange={(val) => {
                                                                const p =
                                                                    products.find(
                                                                        (p) =>
                                                                            String(
                                                                                p.id_product,
                                                                            ) ===
                                                                            val,
                                                                    );
                                                                const cost =
                                                                    p?.purchase_price ||
                                                                    0;
                                                                const sale =
                                                                    p?.sale_price ||
                                                                    0;
                                                                const margin =
                                                                    cost > 0
                                                                        ? ((sale -
                                                                              cost) /
                                                                              cost) *
                                                                          100
                                                                        : 30;
                                                                updateRow(
                                                                    row.id,
                                                                    'id_product',
                                                                    val,
                                                                );
                                                                updateRow(
                                                                    row.id,
                                                                    'description',
                                                                    p?.product_name ||
                                                                        '',
                                                                );
                                                                updateRow(
                                                                    row.id,
                                                                    'unit_cost',
                                                                    cost,
                                                                );
                                                                updateRow(
                                                                    row.id,
                                                                    'margin_percentage',
                                                                    parseFloat(
                                                                        margin.toFixed(
                                                                            2,
                                                                        ),
                                                                    ),
                                                                );
                                                                updateRow(
                                                                    row.id,
                                                                    'suggested_sale_price',
                                                                    sale,
                                                                );
                                                            }}
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
                                                            className="h-8 border-transparent"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-2 py-2 align-top">
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
                                                <td className="px-2 py-2 align-top">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className={cn(
                                                            tableInputClass,
                                                            'text-emerald-600',
                                                        )}
                                                        value={row.unit_cost}
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
                                                <td className="px-2 py-2 align-top">
                                                    <Select
                                                        value={row.id_tax}
                                                        onValueChange={(v) =>
                                                            updateRow(
                                                                row.id,
                                                                'id_tax',
                                                                v,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 border-transparent bg-transparent text-[11px] font-bold">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {taxes.map((t) => (
                                                                <SelectItem
                                                                    key={
                                                                        t.id_tax
                                                                    }
                                                                    value={t.id_tax.toString()}
                                                                    className="text-[10px] font-bold uppercase"
                                                                >
                                                                    {t.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                {!isServiceOrder && (
                                                    <>
                                                        <td className="px-2 py-2 align-top">
                                                            <Input
                                                                type="number"
                                                                step="0.1"
                                                                className={
                                                                    tableInputClass
                                                                }
                                                                value={
                                                                    row.margin_percentage
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'margin_percentage',
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 align-top">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                className={
                                                                    tableInputClass
                                                                }
                                                                value={
                                                                    row.suggested_sale_price
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'suggested_sale_price',
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
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
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100"
                                                        onClick={() =>
                                                            rows.length > 1 &&
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
                                                colSpan={isServiceOrder ? 5 : 7}
                                                className="bg-muted/5 px-4 py-2"
                                            >
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-emerald-600"
                                                    onClick={() =>
                                                        setRows([
                                                            ...rows,
                                                            {
                                                                id: Date.now(),
                                                                id_product: '',
                                                                id_tax: defaultTaxId,
                                                                description: '',
                                                                quantity: 1,
                                                                unit_cost: 0,
                                                                margin_percentage: 30,
                                                                suggested_sale_price: 0,
                                                            },
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

                            <div className="flex justify-end pt-6 pb-20">
                                <div className="w-full max-w-sm space-y-2">
                                    <div className="flex justify-between border-b pb-2 text-sm font-medium text-muted-foreground">
                                        <span>Subtotal (Base)</span>
                                        <span>
                                            {symbol} {subTotal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2 text-sm font-medium text-muted-foreground">
                                        <span>Impuestos (Suma Detallada)</span>
                                        <span>
                                            {symbol} {igvAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 text-xl font-black text-emerald-600">
                                        <span>Total Orden</span>
                                        <span>
                                            {symbol} {totalAmount.toFixed(2)}
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
                                    <p className="leading-relaxed text-muted-foreground italic">
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
