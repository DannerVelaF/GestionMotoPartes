import { SearchableSelect } from '@/components/SearchableSelect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import receiptsRoute from '@/routes/receipts';
import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    ArrowRightLeft,
    CalendarIcon,
    FileText,
    History,
    Link as LinkIcon,
    Plus,
    RotateCcw,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import React, { FormEventHandler, useEffect, useMemo, useState } from 'react';

// --- ESTILOS REUTILIZABLES ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium dark:text-foreground dark:border-neutral-700 dark:focus:border-blue-500';

const tableInputClass =
    'h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500 tabular-nums dark:text-foreground dark:focus:bg-neutral-800';

// --- HELPER COMPONENTS ---
const InputError = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
        <p className="mt-1 animate-pulse text-[10px] font-bold text-red-500 uppercase">
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
        <div className="w-[140px] shrink-0 pr-4 text-sm font-bold tracking-tighter text-muted-foreground uppercase">
            {label}
        </div>
        <div className="flex-1">{children}</div>
    </div>
);

interface DetailRow {
    id: number;
    id_product: string | null;
    description: string;
    quantity: number;
    unit_price: number;
}

export default function CreateReceipt({
    suppliers,
    products,
    documentTypes,
    preloadedData,
}: any) {
    const [formError, setFormError] = useState<string | null>(null);
    const [isWritingNote, setIsWritingNote] = useState(false);
    const [rows, setRows] = useState<DetailRow[]>([
        {
            id: Date.now(),
            id_product: '',
            description: '',
            quantity: 1,
            unit_price: 0,
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
        id_purchase_order: '' as string | number,
        internal_note: '',
    });

    useEffect(() => {
        if (preloadedData?.order) {
            const order = preloadedData.order;
            const matchedType = documentTypes.find(
                (t: any) =>
                    t.label.toLowerCase() ===
                        preloadedData.type?.toLowerCase() ||
                    t.value === preloadedData.type ||
                    t.id === preloadedData.type,
            )?.value;

            setData((prev) => ({
                ...prev,
                id_supplier: String(order.id_supplier),
                id_purchase_order: order.id_purchase_order,
                currency: order.currency,
                exchange_rate: String(order.exchange_rate),
                document_type: matchedType || '',
                series: preloadedData.series || '',
                number: preloadedData.number || '',
            }));

            const initialRows = order.details
                .map((detail: any) => ({
                    id: Math.random(),
                    id_product: detail.id_product
                        ? String(detail.id_product)
                        : '',
                    description: detail.description || '',
                    quantity: detail.quantity - (detail.billed_quantity || 0),
                    unit_price: Number(detail.unit_cost),
                }))
                .filter((r: any) => r.quantity > 0);

            if (initialRows.length > 0) setRows(initialRows);
        }
    }, [preloadedData]);

    const symbol = data.currency === 'USD' ? '$' : 'S/';

    // --- CÁLCULOS CORREGIDOS ---
    const baseImponible = useMemo(
        () => rows.reduce((acc, row) => acc + row.quantity * row.unit_price, 0),
        [rows],
    );
    const igvAmount = baseImponible * 0.18;
    const totalAmount = baseImponible + igvAmount;

    const handleCurrencyChange = (val: string) =>
        setData((prev) => ({
            ...prev,
            currency: val,
            exchange_rate: val === 'PEN' ? '1.000' : '3.800',
        }));

    const updateRow = (id: number, field: keyof DetailRow, value: any) =>
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );

    const supplierOptions = suppliers.map((s: any) => ({
        value: String(s.id_supplier),
        label: s.company_name,
    }));
    const productOptions = products.map((p: any) => ({
        value: String(p.id_product),
        label: p.product_code
            ? `[${p.product_code}] ${p.product_name}`
            : p.product_name,
    }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((currData) => ({
            ...currData,
            issue_date: format(currData.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            exchange_rate: parseFloat(String(currData.exchange_rate)),
            details: rows.map((r) => ({
                id_product: r.id_product || null,
                description: r.id_product ? null : r.description,
                quantity: r.quantity,
                unit_price: r.unit_price,
                is_service: !r.id_product,
            })),
        }));
        post(receiptsRoute.store().url, { forceFormData: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Comprobantes', href: receiptsRoute.index().url },
                { title: 'Nuevo' },
            ]}
        >
            <Head title="Nuevo Comprobante" />
            <form
                onSubmit={submit}
                className="flex h-full flex-col overflow-hidden bg-background"
            >
                {/* TOOLBAR */}
                <div className="sticky top-0 z-20 flex shrink-0 flex-col border-b border-border bg-card">
                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-8 bg-blue-600 text-white shadow-md hover:bg-blue-700"
                            >
                                <Save className="mr-2 h-4 w-4" /> Registrar
                                Comprobante
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => reset()}
                                className="h-8"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                            </Button>
                        </div>
                        <div className="flex h-8 items-center overflow-hidden rounded-sm border border-border bg-muted/30 text-[10px] font-bold uppercase">
                            <div className="bg-blue-600/10 px-4 py-2 text-blue-600">
                                Borrador
                            </div>
                            <div className="border-l border-border px-4 py-2 text-muted-foreground opacity-50">
                                Registrado
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
                        <div className="w-full space-y-8">
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-500 opacity-80" />
                                <h1 className="text-3xl font-black tracking-tighter uppercase">
                                    NUEVO COMPROBANTE
                                </h1>
                            </div>

                            <div className="grid grid-cols-1 gap-x-20 gap-y-2 pt-4 xl:grid-cols-2">
                                <div className="space-y-1">
                                    <FormFieldRow label="Proveedor">
                                        <SearchableSelect
                                            options={supplierOptions}
                                            value={data.id_supplier}
                                            onChange={(val) =>
                                                setData('id_supplier', val)
                                            }
                                        />
                                        <InputError
                                            message={errors.id_supplier}
                                        />
                                    </FormFieldRow>
                                    <FormFieldRow label="Tipo Doc">
                                        <Select
                                            value={data.document_type}
                                            onValueChange={(val) =>
                                                setData('document_type', val)
                                            }
                                        >
                                            <SelectTrigger
                                                className={cleanInputClass}
                                            >
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {documentTypes.map(
                                                    (dt: any) => (
                                                        <SelectItem
                                                            key={dt.value}
                                                            value={dt.value}
                                                        >
                                                            {dt.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.document_type}
                                        />
                                    </FormFieldRow>
                                    <div className="grid grid-cols-2 gap-8">
                                        <FormFieldRow label="Serie">
                                            <Input
                                                value={data.series}
                                                onChange={(e) =>
                                                    setData(
                                                        'series',
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                placeholder="F001"
                                                className={cn(
                                                    cleanInputClass,
                                                    'text-center font-bold',
                                                )}
                                            />
                                        </FormFieldRow>
                                        <FormFieldRow label="Número">
                                            <Input
                                                value={data.number}
                                                onChange={(e) =>
                                                    setData(
                                                        'number',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="000123"
                                                className={cn(
                                                    cleanInputClass,
                                                    'font-bold',
                                                )}
                                            />
                                        </FormFieldRow>
                                    </div>
                                    {preloadedData?.order && (
                                        <FormFieldRow label="Documento Origen">
                                            <div className="relative">
                                                <LinkIcon className="absolute top-2.5 left-0 h-3.5 w-3.5 text-blue-500" />
                                                <Input
                                                    value={
                                                        preloadedData.order
                                                            .po_code
                                                    }
                                                    disabled
                                                    className={cn(
                                                        cleanInputClass,
                                                        'pl-6 font-mono font-bold text-blue-600 opacity-100',
                                                    )}
                                                />
                                            </div>
                                        </FormFieldRow>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <FormFieldRow label="Fecha Emisión">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        cleanInputClass,
                                                        'text-left',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                                    {format(
                                                        data.issue_date,
                                                        'PPP',
                                                        { locale: es },
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={data.issue_date}
                                                    onSelect={(d) =>
                                                        d &&
                                                        setData('issue_date', d)
                                                    }
                                                    disabled={(date) =>
                                                        date > new Date()
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
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
                                    <FormFieldRow label="T. Cambio">
                                        <div className="relative">
                                            <ArrowRightLeft className="absolute top-2.5 left-0 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                step="0.001"
                                                value={data.exchange_rate}
                                                onChange={(e) =>
                                                    setData(
                                                        'exchange_rate',
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={
                                                    data.currency === 'PEN'
                                                }
                                                className={cn(
                                                    cleanInputClass,
                                                    'pl-8',
                                                )}
                                            />
                                        </div>
                                    </FormFieldRow>
                                </div>
                            </div>

                            <div className="pt-6">
                                <div className="mb-4 border-b border-border text-sm font-bold text-muted-foreground">
                                    <span className="border-b-2 border-blue-600 pb-2 tracking-widest text-foreground uppercase">
                                        Detalle del Comprobante
                                    </span>
                                </div>
                                <div
                                    className={cn(
                                        'overflow-hidden rounded-sm border bg-card shadow-sm',
                                        errors.details && 'border-red-500',
                                    )}
                                >
                                    <Table className="w-full table-fixed">
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="w-[55%] px-4 text-[10px] font-bold uppercase">
                                                    Producto / Descripción
                                                </TableHead>
                                                <TableHead className="w-[10%] text-center text-[10px] font-bold uppercase">
                                                    Cant.
                                                </TableHead>
                                                <TableHead className="w-[15%] px-4 text-center text-[10px] font-bold uppercase">
                                                    Costo Unit ({symbol})
                                                </TableHead>
                                                <TableHead className="w-[15%] px-4 text-right text-[10px] font-bold uppercase">
                                                    Línea Subtotal
                                                </TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border/50">
                                            {rows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    className="group transition-colors hover:bg-muted/5"
                                                >
                                                    <TableCell className="px-4 py-2">
                                                        <SearchableSelect
                                                            options={
                                                                productOptions
                                                            }
                                                            value={
                                                                row.id_product ||
                                                                ''
                                                            }
                                                            onChange={(val) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'id_product',
                                                                    val,
                                                                )
                                                            }
                                                            placeholder="Seleccionar producto..."
                                                            className="h-8 border-transparent"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2 py-2">
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
                                                    <TableCell className="px-4 py-2">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className={cn(
                                                                tableInputClass,
                                                                'text-blue-600',
                                                            )}
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
                                                    <TableCell className="px-4 py-2 text-right font-bold tabular-nums">
                                                        {symbol}{' '}
                                                        {(
                                                            row.quantity *
                                                            row.unit_price
                                                        ).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="p-0 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-600"
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
                                <div className="flex items-start justify-between pt-4 pb-12">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setRows([
                                                ...rows,
                                                {
                                                    id: Date.now(),
                                                    id_product: '',
                                                    description: '',
                                                    quantity: 1,
                                                    unit_price: 0,
                                                },
                                            ])
                                        }
                                        className="text-[10px] font-bold text-blue-600 uppercase hover:bg-blue-50"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Añadir
                                        Línea
                                    </Button>

                                    <div className="w-full max-w-xs space-y-2 rounded-xl border bg-muted/10 p-5 shadow-inner">
                                        <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase">
                                            <span>Base Imponible</span>
                                            <span className="font-mono">
                                                {symbol}{' '}
                                                {baseImponible.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase">
                                            <span>IGV (18%)</span>
                                            <span className="font-mono">
                                                {symbol} {igvAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-blue-200 pt-3 text-lg font-black tracking-tighter text-blue-600 uppercase">
                                            <span>Total</span>
                                            <span className="tabular-nums">
                                                {symbol}{' '}
                                                {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* CHATTER (DUMMY) */}
                    <div className="hidden h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10 xl:flex">
                        <div className="border-b bg-card p-4 shadow-sm">
                            <span className="flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground uppercase">
                                <History className="h-3.5 w-3.5" /> Historial
                            </span>
                        </div>
                        <div className="flex flex-1 items-center justify-center p-8 opacity-20">
                            <p className="text-xs font-bold tracking-widest uppercase italic">
                                Actividad disponible tras registro
                            </p>
                        </div>
                    </div>
                </div>
            </form>

            {formError && (
                <div className="fixed top-6 right-6 z-[100] w-auto animate-in fade-in slide-in-from-top-2">
                    <Alert
                        variant="destructive"
                        className="border-2 border-red-500 bg-white shadow-2xl"
                    >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="ml-2 font-bold text-red-700">
                            Atención
                        </AlertTitle>
                        <AlertDescription className="ml-2">
                            {formError}
                        </AlertDescription>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-red-500"
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
