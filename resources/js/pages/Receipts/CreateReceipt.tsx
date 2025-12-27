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
    AlertTriangle,
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
    Clock,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

// --- Estilos ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-all font-medium dark:text-foreground';
const tableInputClass =
    'h-8 border-transparent bg-transparent text-right shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-blue-500 tabular-nums';

interface Supplier { id_supplier: number; company_name: string; ruc: string; }
interface Product { id_product: number; product_name: string; product_code: string | null; sale_price: number; }
interface DetailRow { id: number; id_product: string; quantity: number; unit_price: number; sale_price: number; }

interface Props {
    suppliers: Supplier[];
    products: Product[];
    documentTypes: { value: string; label: string }[];
}

const MarginIndicator = ({ cost, salePrice }: { cost: number; salePrice: number; }) => {
    const numericCost = Number(cost) || 0;
    const numericSalePrice = Number(salePrice) || 0;
    if (numericSalePrice <= 0) return null;
    const margin = numericSalePrice - numericCost;
    const marginPercent = (margin / numericSalePrice) * 100;
    const marginText = `S/ ${margin.toFixed(2)}`;

    if (numericCost > numericSalePrice) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex cursor-help items-center gap-1 text-red-600 font-bold"><TrendingDown className="h-4 w-4" /><span className="text-[10px]">{marginText}</span></div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-red-600 text-white border-none"><p className="text-xs font-bold uppercase">Aviso de Pérdida</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    const colorClass = marginPercent < 15 ? 'text-yellow-600' : 'text-emerald-600';
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(colorClass, 'flex cursor-help items-center gap-1 font-bold')}><TrendingUp className="h-4 w-4" /><span className="text-[10px]">{marginText}</span></div>
                </TooltipTrigger>
                <TooltipContent className={cn('border-none text-white', marginPercent < 15 ? 'bg-yellow-500' : 'bg-emerald-600')}><p className="text-[10px] font-bold uppercase">{marginPercent < 15 ? 'Margen Ajustado' : '¡Margen Óptimo!'}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default function CreateReceipt({ suppliers, products, documentTypes }: Props) {
    const [formError, setFormError] = useState<string | null>(null);
    const [rows, setRows] = useState<DetailRow[]>([{ id: Date.now(), id_product: '', quantity: 1, unit_price: 0, sale_price: 0 }]);

    const { data, setData, post, processing, errors, reset, clearErrors, transform } = useForm({
        id_supplier: '',
        document_type: '',
        series: '',
        number: '',
        issue_date: new Date(), // Inicializa con fecha y hora actual
        file: null as File | null,
        details: [] as any[],
    });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const updateRow = (id: number, field: keyof DetailRow, value: any) => {
        setRows((prev) => prev.map((row) => row.id === id ? { ...row, [field]: value } : row));
    };

    const totalAmount = rows.reduce((acc, row) => acc + row.quantity * row.unit_price, 0);
    const igvAmount = totalAmount - totalAmount / 1.18;
    const subTotal = totalAmount - igvAmount;

    const supplierOptions = suppliers.map((s) => ({ value: String(s.id_supplier), label: s.company_name }));
    const productOptions = products.map((p) => ({
        value: String(p.id_product),
        label: p.product_code ? `[${p.product_code}] ${p.product_name}` : p.product_name,
        salePrice: p.sale_price
    }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // 1. Transformar fecha para MySQL (YYYY-MM-DD HH:mm:ss)
        transform((data) => ({
            ...data,
            issue_date: format(data.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            details: rows.map((r) => ({
                id_product: r.id_product,
                quantity: r.quantity,
                unit_price: r.unit_price,
                sale_price: r.sale_price,
            })),
        }));

        post(receiptsRoute.store().url, {
            forceFormData: true,
            onError: (err) => err.error && setFormError(err.error),
        });
    };

    const selectedProductIds = rows.map((r) => r.id_product).filter((id) => id !== '');

    return (
        <AppLayout breadcrumbs={[{ title: 'Comprobantes', href: receiptsRoute.index().url }, { title: 'Nuevo', href: '' }]}>
            <Head title="Nueva Compra" />

            <form onSubmit={submit} className="flex h-full flex-col bg-background">
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Nueva Compra</h1>
                            <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Registro de Abastecimiento</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" type="button" onClick={() => reset()} disabled={processing}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-blue-600 text-white shadow-md hover:bg-blue-700">
                            <Save className="mr-2 h-4 w-4" /> Registrar Compra
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <div className="mx-auto max-w-7xl space-y-10">
                        <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
                            {/* BLOQUE PROVEEDOR */}
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                    <Truck className="h-3 w-3" /> Información del Proveedor
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Proveedor Seleccionado</Label>
                                        <SearchableSelect options={supplierOptions} value={data.id_supplier} onChange={(val) => onFieldChange('id_supplier', val)} placeholder="Buscar proveedor..." onCreate={() => router.visit(suppliersRoute.create().url)} className={cleanInputClass} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Serie</Label>
                                            <Input value={data.series} onChange={(e) => onFieldChange('series', e.target.value.toUpperCase())} className={cn(cleanInputClass, 'text-center uppercase')} placeholder="F001" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Número Correlativo</Label>
                                            <Input value={data.number} onChange={(e) => onFieldChange('number', e.target.value)} className={cleanInputClass} placeholder="000123" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOQUE DOCUMENTO (CON HORA) */}
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                    <FileText className="h-3 w-3" /> Detalles del Documento
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo Comprobante</Label>
                                        <Select value={data.document_type} onValueChange={(val) => onFieldChange('document_type', val)}>
                                            <SelectTrigger className={cleanInputClass}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                            <SelectContent>{documentTypes.map((dt) => (<SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Fecha y Hora Recepción</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn(cleanInputClass, 'text-left font-medium', !data.issue_date && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                                    {data.issue_date ? format(data.issue_date, 'Pp', { locale: es }) : 'Elegir fecha...'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={data.issue_date}
                                                    onSelect={(d) => {
                                                        if (d) {
                                                            const newDate = new Date(d);
                                                            newDate.setHours(data.issue_date.getHours());
                                                            newDate.setMinutes(data.issue_date.getMinutes());
                                                            onFieldChange('issue_date', newDate);
                                                        }
                                                    }}
                                                    disabled={(date) => date > new Date()}
                                                />
                                                <div className="border-t p-3 bg-muted/20 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Hora:</span>
                                                        <Input
                                                            type="time"
                                                            className="h-8 w-[110px] font-mono font-bold text-xs"
                                                            value={format(data.issue_date, 'HH:mm')}
                                                            onChange={(e) => {
                                                                const [h, m] = e.target.value.split(':');
                                                                const newDate = new Date(data.issue_date);
                                                                newDate.setHours(parseInt(h), parseInt(m));
                                                                onFieldChange('issue_date', newDate);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase font-black">Archivo Adjunto</Label>
                                    <div className="group relative">
                                        <div className={cn('flex items-center gap-2 border-b border-muted transition-all py-2', data.file && 'bg-emerald-50/30 border-emerald-500/50 px-2 rounded-t-sm')}>
                                            <Paperclip className="h-4 w-4 text-blue-600" />
                                            <span className="flex-1 truncate text-xs font-medium">{data.file ? data.file.name : 'Subir Comprobante (PDF/JPG)'}</span>
                                            <Input type="file" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => onFieldChange('file', e.target.files?.[0] || null)} />
                                            {data.file && <Button type="button" variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={() => onFieldChange('file', null)}><Trash2 className="h-3 w-3 text-red-500" /></Button>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- TABLA DE PRODUCTOS --- */}
                        <div className="space-y-4 pt-6">
                            <h3 className="flex items-center gap-2 border-b border-blue-100 pb-2 text-sm font-bold tracking-tight text-slate-800 uppercase dark:text-neutral-200">
                                <ShoppingBag className="h-4 w-4 text-blue-600" /> Líneas de Compra
                            </h3>
                            <div className="overflow-hidden rounded-xl border bg-card shadow-sm dark:border-neutral-800">
                                <Table>
                                    <TableHeader className="bg-muted/30 dark:bg-neutral-900">
                                        <TableRow className="dark:border-neutral-800">
                                            <TableHead className="w-[35%] font-bold uppercase text-[10px]">Producto</TableHead>
                                            <TableHead className="w-[10%] text-right font-bold uppercase text-[10px]">Cant.</TableHead>
                                            <TableHead className="w-[15%] text-right font-bold uppercase text-[10px]">Costo Unit.</TableHead>
                                            <TableHead className="w-[15%] text-right font-bold uppercase text-[10px]">P. Venta Ref.</TableHead>
                                            <TableHead className="w-[10%] text-center font-bold uppercase text-[10px]">Margen</TableHead>
                                            <TableHead className="w-[15%] text-right font-bold uppercase text-[10px]">Subtotal</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row) => (
                                            <TableRow key={row.id} className="dark:border-neutral-800 hover:bg-muted/20">
                                                <TableCell className="p-2">
                                                    <SearchableSelect
                                                        options={productOptions.filter(o => !selectedProductIds.includes(o.value) || o.value === row.id_product)}
                                                        value={row.id_product}
                                                        onChange={(val) => {
                                                            const opt = productOptions.find(o => o.value === val);
                                                            updateRow(row.id, 'id_product', val);
                                                            updateRow(row.id, 'sale_price', opt?.salePrice || 0);
                                                        }}
                                                        placeholder="Producto..." className={cleanInputClass}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2"><Input type="number" className={tableInputClass} value={row.quantity} onChange={(e) => updateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)} /></TableCell>
                                                <TableCell className="p-2"><Input type="number" step="0.01" className={cn(tableInputClass, Number(row.unit_price) > Number(row.sale_price) && row.sale_price > 0 && "text-red-600 font-black")} value={row.unit_price} onChange={(e) => updateRow(row.id, 'unit_price', parseFloat(e.target.value) || 0)} /></TableCell>
                                                <TableCell className="p-2"><Input type="number" step="0.01" className={tableInputClass} value={row.sale_price} onChange={(e) => updateRow(row.id, 'sale_price', parseFloat(e.target.value) || 0)} /></TableCell>
                                                <TableCell className="p-2 text-center"><MarginIndicator cost={row.unit_price} salePrice={row.sale_price} /></TableCell>
                                                <TableCell className="p-2 text-right font-bold tabular-nums text-foreground">S/ {(row.quantity * row.unit_price).toFixed(2)}</TableCell>
                                                <TableCell className="p-2 text-center">
                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => rows.length > 1 && setRows(rows.filter(r => r.id !== row.id))}><Trash2 className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex items-start justify-between pt-6">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setRows([...rows, { id: Date.now(), id_product: '', quantity: 1, unit_price: 0, sale_price: 0 }])} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-bold uppercase text-[10px] tracking-widest"><Plus className="mr-2 h-4 w-4" /> Añadir Producto</Button>

                                <div className="w-full max-w-xs space-y-3 bg-muted/10 p-6 rounded-xl border dark:border-neutral-800">
                                    <div className="flex justify-between text-sm text-muted-foreground font-medium"><span>Base Imponible</span><span>S/ {subTotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-sm text-muted-foreground font-medium"><span>IGV (18%)</span><span>S/ {igvAmount.toFixed(2)}</span></div>
                                    <div className="mt-4 flex justify-between border-t border-blue-200 pt-4 dark:border-neutral-700">
                                        <span className="text-lg font-black text-foreground uppercase tracking-tighter">Total Compra</span>
                                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">S/ {totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* ALERTA DE ERROR */}
            {formError && (
                <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
                    <Alert variant="destructive" className="border-2 border-red-500 bg-white dark:bg-neutral-950 shadow-xl">
                        <AlertCircle className="h-4 w-4" /><AlertTitle className="ml-2 font-bold">Error de Validación</AlertTitle>
                        <AlertDescription className="ml-2">{formError}</AlertDescription>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setFormError(null)}><RotateCcw className="h-3 w-3" /></Button>
                    </Alert>
                </div>
            )}
        </AppLayout>
    );
}
