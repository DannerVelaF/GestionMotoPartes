import { SearchableSelect } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import salesRoute from '@/routes/sales';
import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    CalendarIcon,
    FileText,
    Plus,
    Printer,
    RotateCcw,
    Save,
    ShoppingBag,
    Trash2,
    User,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

// --- Estilos Consistentes ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium';
const tableInputClass =
    'h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500 tabular-nums';

interface Product {
    id_product: number;
    product_name: string;
    product_code: string | null;
    sale_price: number;
    stock: number;
}

interface DetailRow {
    id: number;
    id_product: string;
    quantity: number;
    unit_price: number;
}

interface Props {
    products: Product[];
    documentTypes: { value: string; label: string }[];
}

const CLIENTE_VARIOS_RUC = '00000000';
const CLIENTE_VARIOS_NAME = 'PÚBLICO EN GENERAL';
const TICKET_VALUE = 'nota_venta';

export default function CreateSales({ products, documentTypes }: Props) {
    const [rows, setRows] = useState<DetailRow[]>([
        { id: Date.now(), id_product: '', quantity: 1, unit_price: 0 },
    ]);
    const [alert, setAlert] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    const [lastSaleId, setLastSaleId] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            receiver_id_number: '',
            receiver_name: '',
            receiver_address: '',
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
            if (value === TICKET_VALUE) {
                setData((prev) => ({
                    ...prev,
                    document_type: value,
                    receiver_id_number: CLIENTE_VARIOS_RUC,
                    receiver_name: CLIENTE_VARIOS_NAME,
                    series: 'T001',
                    number: '',
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

    const updateRow = (id: number, field: keyof DetailRow, value: any) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );
    };

    const totalAmount = rows.reduce(
        (acc, row) => acc + row.quantity * row.unit_price,
        0,
    );
    const igvAmount = totalAmount - totalAmount / 1.18;
    const subTotal = totalAmount - igvAmount;

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
        data.details = rows.map((r) => ({
            id_product: r.id_product,
            quantity: r.quantity,
            unit_price: r.unit_price,
        }));
        post(salesRoute.store().url, {
            onSuccess: (page) => {
                const props = page.props as any;
                const createdSaleId = props.saleId || props.flash?.saleId;
                if (createdSaleId) {
                    setLastSaleId(createdSaleId);

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
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: salesRoute.index().url },
                { title: 'Nueva Venta', href: '' },
            ]}
        >
            <Head title="Nueva Venta" />

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                Nueva Venta
                            </h1>
                            <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                                Borrador de Operación
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
                            className="bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95"
                        >
                            <Save className="mr-2 h-4 w-4" /> Registrar Venta
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <div className="mx-auto max-w-7xl space-y-10">
                        {/* --- SECCIÓN CABECERA: CLIENTE Y DOCUMENTO --- */}
                        <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
                            {/* BLOQUE CLIENTE */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                        <User className="h-3 w-3" /> Información
                                        del Cliente
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            'h-7 px-2 text-[10px] font-bold tracking-tighter uppercase',
                                            data.receiver_id_number ===
                                                CLIENTE_VARIOS_RUC
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'border text-muted-foreground',
                                        )}
                                        onClick={() =>
                                            onFieldChange(
                                                'document_type',
                                                data.document_type,
                                            )
                                        } // Refresca valores por defecto
                                    >
                                        Público General
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                            RUC / DNI
                                        </Label>
                                        <Input
                                            value={data.receiver_id_number}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'receiver_id_number',
                                                    e.target.value,
                                                )
                                            }
                                            className={cleanInputClass}
                                            placeholder="00000000"
                                        />
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
                                        Dirección (Opcional)
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
                                    />
                                </div>
                            </div>

                            {/* BLOQUE DOCUMENTO */}
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                    <FileText className="h-3 w-3" /> Detalles
                                    del Comprobante
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
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                            Fecha de Emisión
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        cleanInputClass,
                                                        'text-left font-normal',
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
                                                        : 'Seleccionar'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={data.issue_date}
                                                    onSelect={(d) =>
                                                        d &&
                                                        onFieldChange(
                                                            'issue_date',
                                                            d,
                                                        )
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                        Referencia (Serie - Número)
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            value={data.series}
                                            readOnly
                                            className={cn(
                                                cleanInputClass,
                                                'w-20 bg-muted/20 text-center font-bold',
                                            )}
                                        />
                                        <span className="text-muted-foreground">
                                            -
                                        </span>
                                        <Input
                                            value={
                                                data.number || 'N° AUTOMÁTICO'
                                            }
                                            readOnly
                                            className={cn(
                                                cleanInputClass,
                                                'flex-1 bg-muted/20 text-center font-bold text-blue-600',
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- TABLA DE PRODUCTOS (KARDEX STYLE) --- */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 border-b border-blue-100 pb-2 text-sm font-bold tracking-tight text-slate-800 uppercase">
                                <ShoppingBag className="h-4 w-4 text-blue-600" />{' '}
                                Artículos de la Venta
                            </h3>
                            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="w-[40%]">
                                                Producto
                                            </TableHead>
                                            <TableHead className="w-[12%] text-center">
                                                Stock
                                            </TableHead>
                                            <TableHead className="w-[12%] text-right">
                                                Cantidad
                                            </TableHead>
                                            <TableHead className="w-[15%] text-right">
                                                P. Unitario
                                            </TableHead>
                                            <TableHead className="w-[15%] text-right">
                                                Subtotal
                                            </TableHead>
                                            <TableHead className="w-[6%]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row) => {
                                            const selectedOpt =
                                                productOptions.find(
                                                    (o) =>
                                                        o.value ===
                                                        row.id_product,
                                                );
                                            const stock =
                                                selectedOpt?.stock ?? 0;
                                            return (
                                                <TableRow
                                                    key={row.id}
                                                    className="transition-colors hover:bg-blue-50/20"
                                                >
                                                    <TableCell className="p-2">
                                                        <SearchableSelect
                                                            options={
                                                                productOptions
                                                            }
                                                            value={
                                                                row.id_product
                                                            }
                                                            onChange={(val) => {
                                                                const opt =
                                                                    productOptions.find(
                                                                        (o) =>
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
                                                                    'unit_price',
                                                                    opt?.salePrice ||
                                                                        0,
                                                                );
                                                            }}
                                                            placeholder="Buscar producto..."
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-2 text-center">
                                                        {row.id_product && (
                                                            <div
                                                                className={cn(
                                                                    'inline-flex flex-col rounded px-2 py-0.5',
                                                                    stock <= 0
                                                                        ? 'bg-red-50 text-red-700'
                                                                        : stock <=
                                                                            5
                                                                          ? 'bg-amber-50 text-amber-700'
                                                                          : 'bg-blue-50 text-blue-700',
                                                                )}
                                                            >
                                                                <span className="text-[9px] font-black uppercase">
                                                                    Físico
                                                                </span>
                                                                <span className="text-sm leading-none font-black">
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
                                                                    'border-b-red-500 font-bold text-red-600',
                                                            )}
                                                            value={row.quantity}
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'quantity',
                                                                    parseInt(
                                                                        e.target
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
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-2 text-right font-bold text-slate-700 tabular-nums">
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
                                                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                                                            onClick={() =>
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

                            <div className="flex items-start justify-between pt-4">
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
                                                quantity: 1,
                                                unit_price: 0,
                                            },
                                        ])
                                    }
                                    className="text-blue-600 hover:bg-blue-50"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Añadir
                                    línea
                                </Button>

                                <div className="w-full max-w-xs space-y-3">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Base Imponible</span>
                                        <span>S/ {subTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>IGV (18%)</span>
                                        <span>S/ {igvAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-4 flex justify-between border-t border-blue-200 pt-4">
                                        <span className="text-lg font-bold text-slate-900 uppercase">
                                            Total a Pagar
                                        </span>
                                        <span className="text-2xl font-black text-blue-700 tabular-nums">
                                            S/ {totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

        </AppLayout>
    );
}
