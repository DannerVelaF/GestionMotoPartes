import { SearchableSelect } from '@/components/SearchableSelect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import productsRoute from '@/routes/products';
import receipts from '@/routes/receipts';
import sales from '@/routes/sales';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertCircle,
    Barcode,
    Box,
    Camera,
    CheckCircle2,
    DollarSign,
    Eye,
    History,
    Info,
    LayoutGrid,
    Pencil,
    PiggyBank,
    Plus,
    Power,
    RotateCcw,
    Save,
    Settings2,
    ShoppingCart,
    Tag as TagIcon,
    Trash2,
    TrendingDown,
    TrendingUp,
    User2,
    Warehouse,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

// --- INTERFACES ---
interface FlashProps {
    flash?: { success?: string; error?: string };
    [key: string]: any;
}

interface Props {
    product: {
        id_product: number;
        product_name: string;
        product_code: string | null;
        sale_price: string;
        id_category: number;
        id_brand: number;
        id_product_type: number;
        notes: string | null;
        status: string;
        url_image: string | null;
        purchase_price: string | null;
        stock: number;
        movements?: any[];
        analytics?: any;
    };
    categories: any[];
    brands: any[];
    types: any[];
}

// --- COMPONENTE ALERTA FLOTANTE ---
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
                className={cn(
                    'border-2 shadow-xl',
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-neutral-900 dark:text-emerald-400'
                        : 'border-red-500 bg-white text-red-900 dark:bg-neutral-900 dark:text-red-400',
                )}
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

export default function EditProduct({
    product,
    categories = [],
    brands = [],
    types = [],
}: Props) {
    const { flash = {} } = usePage<FlashProps>().props;
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDeleteProductAlertOpen, setIsDeleteProductAlertOpen] =
        useState(false);
    const [isRemoveImageAlertOpen, setIsRemoveImageAlertOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const [imagePreview, setImagePreview] = useState<string | null>(
        product.url_image ? `/storage/${product.url_image}` : null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
        isDirty,
    } = useForm({
        _method: 'put',
        product_name: product.product_name,
        product_code: product.product_code || '',
        sale_price: product.sale_price,
        id_category: String(product.id_category),
        id_brand: String(product.id_brand),
        id_product_type: String(product.id_product_type),
        notes: product.notes || '',
        status: product.status,
        image: null as File | null,
        delete_image: false,
        purchase_price: product.purchase_price || '',
    });

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev: any) => ({
                ...prev,
                image: file,
                delete_image: false,
            }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const executeRemoveImage = () => {
        setImagePreview(null);
        setData((prev: any) => ({ ...prev, image: null, delete_image: true }));
        setIsRemoveImageAlertOpen(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(productsRoute.update({ product: product.id_product }).url, {
            forceFormData: true,
            onSuccess: () => setShowSuccess(true),
        });
    };

    const inputClasses =
        'h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-sm shadow-none transition-all focus:ring-0 focus:border-blue-600 font-medium dark:text-foreground';

    const saleMovements =
        product.movements?.filter((m: any) => m.type === 'sale') || [];
    const purchaseMovements =
        product.movements?.filter((m: any) => m.type === 'purchase') || [];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Productos', href: productsRoute.index().url },
                { title: product.product_name, href: '' },
            ]}
        >
            <Head title={`Editar ${product.product_name}`} />
            <FloatingAlert
                message={flash.success || flash.error}
                type={flash.success ? 'success' : 'error'}
            />

            {/* --- MODALES --- */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
                    <div className="relative flex h-[80vh] w-full items-center justify-center overflow-hidden rounded-lg bg-black/80 backdrop-blur-sm">
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                className="h-full w-full object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            className="bg-blue-700 font-medium text-white hover:bg-blue-800"
                            onClick={() =>
                                router.visit(productsRoute.create().url)
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo
                        </Button>
                        <div className="flex items-center gap-3">
                            <Box className="h-6 w-6 text-blue-600" />
                            <span className="max-w-md truncate text-xl font-bold tracking-tight text-foreground/90">
                                {product.product_name}
                            </span>
                        </div>
                        <div
                            className={cn(
                                'rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase',
                                data.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
                            )}
                        >
                            {data.status === 'active'
                                ? 'En Catálogo'
                                : 'Fuera de Catálogo'}
                        </div>
                        {isDirty && (
                            <span className="ml-2 animate-pulse rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700 uppercase">
                                Sin guardar
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => reset()}
                            disabled={!isDirty || processing}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={cn(
                                'min-w-[120px] shadow-md transition-all',
                                isDirty
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    {/* INFO CABECERA */}
                    <div className="mb-10 flex flex-col-reverse gap-10 md:flex-row md:items-start">
                        <div className="flex-1 space-y-2 pt-2">
                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                <Info className="h-3 w-3" /> Nombre del Producto
                            </Label>
                            <input
                                value={data.product_name}
                                onChange={(e) =>
                                    onFieldChange(
                                        'product_name',
                                        e.target.value,
                                    )
                                }
                                className="h-auto w-full border-0 border-b-2 border-muted bg-transparent px-0 py-2 text-4xl font-black tracking-tight text-foreground focus:border-blue-600 focus:ring-0 focus:outline-none"
                            />
                        </div>
                        {/* ZONA IMAGEN */}
                        <div className="flex shrink-0 flex-col items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            <div
                                className={cn(
                                    'group relative h-40 w-40 overflow-hidden rounded-2xl border-2 transition-all duration-300',
                                    imagePreview
                                        ? 'border-blue-200 bg-white shadow-sm dark:bg-neutral-900'
                                        : 'border-dashed border-muted-foreground/25 bg-muted/10 hover:bg-muted/20',
                                )}
                            >
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="rounded-full"
                                                onClick={() =>
                                                    setIsImageModalOpen(true)
                                                }
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="rounded-full text-blue-600"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="rounded-full text-red-600"
                                                onClick={() =>
                                                    setIsRemoveImageAlertOpen(
                                                        true,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground/60 hover:text-blue-600"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Camera className="h-10 w-10 stroke-[1.5]" />
                                        <span className="text-[10px] font-bold tracking-wider uppercase">
                                            Añadir Foto
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                            {[
                                {
                                    id: 'general',
                                    label: 'Información General',
                                    icon: Settings2,
                                },
                                {
                                    id: 'sales',
                                    label: 'Ventas',
                                    icon: TrendingUp,
                                },
                                {
                                    id: 'purchase',
                                    label: 'Compras',
                                    icon: TrendingDown,
                                },
                                {
                                    id: 'inventory',
                                    label: 'Inventario / Kardex',
                                    icon: Warehouse,
                                },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="relative flex items-center gap-2 rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600"
                                >
                                    <tab.icon className="h-4 w-4" /> {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="mt-6">
                            {/* --- TAB: GENERAL --- */}
                            <TabsContent
                                value="general"
                                className="animate-in duration-300 fade-in-50"
                            >
                                <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                                    <div className="space-y-10">
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <LayoutGrid className="h-3 w-3" />{' '}
                                                Tipo de Producto
                                            </Label>
                                            <div>
                                                <SearchableSelect
                                                    options={types.map((t) => ({
                                                        value: String(
                                                            t.id_product_type,
                                                        ),
                                                        label: t.name_product_type,
                                                    }))}
                                                    value={data.id_product_type}
                                                    onChange={(val) =>
                                                        onFieldChange(
                                                            'id_product_type',
                                                            val,
                                                        )
                                                    }
                                                    placeholder="Seleccionar tipo..."
                                                    className={inputClasses}
                                                />
                                            </div>
                                            {errors.id_product_type && (
                                                <p className="mt-1 text-sm font-medium text-red-500">
                                                    {errors.id_product_type}
                                                </p>
                                            )}
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <LayoutGrid className="h-3 w-3" />{' '}
                                                Marca del producto
                                            </Label>
                                            <div>
                                                <SearchableSelect
                                                    options={brands.map(
                                                        (b) => ({
                                                            value: String(
                                                                b.id_brand,
                                                            ),
                                                            label: b.name_brand,
                                                        }),
                                                    )}
                                                    value={data.id_brand}
                                                    onChange={(val) =>
                                                        onFieldChange(
                                                            'id_brand',
                                                            val,
                                                        )
                                                    }
                                                    placeholder="Seleccionar marca..."
                                                    className={inputClasses}
                                                />
                                                {errors.id_brand && (
                                                    <p className="mt-1 text-sm font-medium text-red-500">
                                                        {errors.id_brand}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <DollarSign className="h-3 w-3" />{' '}
                                                Precio de Venta
                                            </Label>
                                            <div className="flex items-end gap-2 border-b-2 border-muted transition-colors focus-within:border-blue-600 dark:border-neutral-800">
                                                <span className="mb-2 text-2xl font-light text-muted-foreground">
                                                    S/
                                                </span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.sale_price}
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'sale_price',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 border-0 bg-transparent px-0 text-3xl font-black focus-visible:ring-0"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {errors.sale_price && (
                                                <p className="text-sm font-medium text-red-500">
                                                    {errors.sale_price}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-start space-x-3 rounded-xl border border-dashed border-muted-foreground/20 p-4 transition-colors hover:bg-muted/5">
                                            <Checkbox
                                                id="product-status"
                                                checked={
                                                    data.status === 'active'
                                                }
                                                onCheckedChange={(checked) =>
                                                    onFieldChange(
                                                        'status',
                                                        checked
                                                            ? 'active'
                                                            : 'inactive',
                                                    )
                                                }
                                                className="mt-1 h-5 w-5 border-2 border-blue-600 data-[state=checked]:bg-blue-600"
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label
                                                    htmlFor="product-status"
                                                    className="flex cursor-pointer items-center gap-2 text-sm font-black tracking-tight text-foreground"
                                                >
                                                    <Power
                                                        className={cn(
                                                            'h-3.5 w-3.5',
                                                            data.status ===
                                                                'active'
                                                                ? 'text-emerald-500'
                                                                : 'text-red-500',
                                                        )}
                                                    />{' '}
                                                    LISTAR PRODUCTO EN VENTAS Y
                                                    COMPRAS
                                                </Label>
                                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                    {data.status === 'active'
                                                        ? 'El producto es visible y está disponible para transacciones.'
                                                        : 'El producto está archivado y no aparecerá en los buscadores.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-10">
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <TagIcon className="h-3 w-3" />{' '}
                                                Categoría
                                            </Label>
                                            <div>
                                                <SearchableSelect
                                                    options={categories.map(
                                                        (c) => ({
                                                            value: String(
                                                                c.id_product_category,
                                                            ),
                                                            label: c.name_product_category,
                                                        }),
                                                    )}
                                                    value={data.id_category}
                                                    onChange={(val) =>
                                                        onFieldChange(
                                                            'id_category',
                                                            val,
                                                        )
                                                    }
                                                    placeholder="Seleccionar categoría..."
                                                    className={inputClasses}
                                                />
                                            </div>
                                            {errors.id_category && (
                                                <p className="mt-1 text-sm font-medium text-red-500">
                                                    {errors.id_category}
                                                </p>
                                            )}
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <Barcode className="h-3 w-3" />{' '}
                                                Referencia Interna
                                            </Label>
                                            <div>
                                                <Input
                                                    value={data.product_code}
                                                    onChange={(e) =>
                                                        onFieldChange(
                                                            'product_code',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={inputClasses}
                                                    placeholder="Ej. COD-001"
                                                />
                                            </div>
                                            {errors.product_code && (
                                                <p className="mt-1 text-sm font-medium text-red-500">
                                                    {errors.product_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- TAB: VENTAS --- */}
                            <TabsContent
                                value="sales"
                                className="animate-in space-y-6 fade-in"
                            >
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <StatCard
                                        title="Unidades Vendidas"
                                        value={
                                            product.analytics?.sales_qty || 0
                                        }
                                        icon={
                                            <TrendingUp className="text-blue-600" />
                                        }
                                        description="Volumen total de salida"
                                    />
                                    <StatCard
                                        title="Ingresos Totales"
                                        value={`S/ ${(product.analytics?.sales_revenue || 0).toFixed(2)}`}
                                        icon={
                                            <DollarSign className="text-emerald-500" />
                                        }
                                        description="Recaudación bruta"
                                    />
                                    <StatCard
                                        title="Precio Prom. Venta"
                                        value={`S/ ${(product.analytics?.sales_avg_price || 0).toFixed(2)}`}
                                        icon={
                                            <Info className="text-purple-500" />
                                        }
                                        description="Ticket promedio"
                                    />
                                </div>
                                <Card className="overflow-hidden border-none shadow-sm dark:bg-neutral-900/50">
                                    <CardHeader className="border-b bg-muted/20 py-4 dark:bg-neutral-800/50">
                                        <CardTitle className="flex items-center gap-2 text-[10px] font-black tracking-widest text-foreground uppercase">
                                            <PiggyBank className="h-4 w-4 text-blue-600 dark:text-blue-400" />{' '}
                                            Historial Detallado de Ventas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <TransactionTable
                                            movements={saleMovements}
                                            type="sale"
                                            emptyMessage="No hay ventas registradas para este producto."
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* --- TAB: COMPRAS --- */}
                            <TabsContent
                                value="purchase"
                                className="animate-in space-y-6 fade-in"
                            >
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <StatCard
                                        title="Stock Ingresado"
                                        value={
                                            product.analytics?.purchases_qty ||
                                            0
                                        }
                                        icon={
                                            <TrendingDown className="text-orange-600" />
                                        }
                                        description="Abastecimiento histórico"
                                    />
                                    <StatCard
                                        title="Inversión Total"
                                        value={`S/ ${(product.analytics?.purchases_investment || 0).toFixed(2)}`}
                                        icon={
                                            <Warehouse className="text-blue-500" />
                                        }
                                        description="Costo total acumulado"
                                    />
                                    <StatCard
                                        title="Costo Prom. Unitario"
                                        value={`S/ ${(product.analytics?.purchases_avg_cost || 0).toFixed(2)}`}
                                        icon={
                                            <History className="text-amber-500" />
                                        }
                                        description="Valor ponderado"
                                    />
                                </div>
                                <Card className="overflow-hidden border-none shadow-sm dark:bg-neutral-900/50">
                                    <CardHeader className="border-b bg-muted/20 py-4 dark:bg-neutral-800/50">
                                        <CardTitle className="flex items-center gap-2 text-[10px] font-black tracking-widest text-foreground uppercase">
                                            <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />{' '}
                                            Historial de Abastecimiento
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <TransactionTable
                                            movements={purchaseMovements}
                                            type="purchase"
                                            emptyMessage="No hay compras registradas para este producto."
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* --- TAB: INVENTARIO / KARDEX (UNIFICADA) --- */}
                            <TabsContent
                                value="inventory"
                                className="animate-in space-y-8 duration-300 fade-in-50"
                            >
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                            <Warehouse className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                Stock Físico
                                            </p>
                                            <p
                                                className={cn(
                                                    'text-3xl font-black',
                                                    product.stock > 0
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-red-600',
                                                )}
                                            >
                                                {Number(product.stock).toFixed(
                                                    2,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                Valorizado (Venta)
                                            </p>
                                            <p className="text-2xl font-bold text-foreground dark:text-neutral-200">
                                                S/{' '}
                                                {(
                                                    Number(product.sale_price) *
                                                    product.stock
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Card className="overflow-hidden border-none shadow-sm dark:bg-neutral-900/50">
                                    <CardHeader className="border-b bg-muted/20 py-4 dark:bg-neutral-800/50">
                                        <CardTitle className="flex items-center gap-2 text-[10px] font-black tracking-widest text-foreground uppercase">
                                            <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />{' '}
                                            Historial de Movimientos (Kardex)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/30 dark:bg-neutral-900">
                                                    <TableRow className="hover:bg-transparent dark:border-neutral-800">
                                                        <TableHead className="px-6 text-xs font-bold uppercase dark:text-neutral-300">
                                                            Fecha Kardex
                                                        </TableHead>
                                                        <TableHead className="px-6 text-xs font-bold uppercase dark:text-neutral-300">
                                                            Tipo Mov.
                                                        </TableHead>
                                                        <TableHead className="px-6 text-xs font-bold uppercase dark:text-neutral-300">
                                                            Referencia
                                                        </TableHead>
                                                        <TableHead className="px-6 text-right text-xs font-bold uppercase dark:text-neutral-300">
                                                            Cant.
                                                        </TableHead>
                                                        <TableHead className="px-6 text-right text-xs font-bold uppercase dark:text-neutral-300">
                                                            Saldo
                                                        </TableHead>
                                                        <TableHead className="px-6 text-right text-xs font-bold uppercase dark:text-neutral-300">
                                                            Usuario
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {product.movements
                                                        ?.length ? (
                                                        product.movements.map(
                                                            (move: any) => {
                                                                const typeStyles: Record<
                                                                    string,
                                                                    string
                                                                > = {
                                                                    purchase:
                                                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
                                                                    sale: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
                                                                    purchase_return:
                                                                        'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
                                                                    return: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
                                                                    adjustment:
                                                                        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
                                                                };
                                                                return (
                                                                    <TableRow
                                                                        key={
                                                                            move.id_movement
                                                                        }
                                                                        className="cursor-pointer transition-colors hover:bg-muted/40 dark:border-neutral-800/50 dark:hover:bg-neutral-800/20"
                                                                        onClick={() => {
                                                                            if (
                                                                                !move.reference_id
                                                                            )
                                                                                return;
                                                                            const url =
                                                                                move.type ===
                                                                                    'sale' ||
                                                                                move.type ===
                                                                                    'return'
                                                                                    ? sales.show(
                                                                                          {
                                                                                              sale: move.reference_id,
                                                                                          },
                                                                                      )
                                                                                          .url
                                                                                    : receipts.show(
                                                                                          {
                                                                                              receipt:
                                                                                                  move.reference_id,
                                                                                          },
                                                                                      )
                                                                                          .url;
                                                                            router.visit(
                                                                                url,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <TableCell className="px-6 py-4 text-sm font-medium text-foreground/80">
                                                                            {format(
                                                                                new Date(
                                                                                    move.created_at,
                                                                                ),
                                                                                'dd/MM/yyyy HH:mm',
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="px-6 py-4">
                                                                            <span
                                                                                className={cn(
                                                                                    'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black tracking-tighter uppercase',
                                                                                    typeStyles[
                                                                                        move
                                                                                            .type
                                                                                    ] ||
                                                                                        'bg-muted text-muted-foreground',
                                                                                )}
                                                                            >
                                                                                {move.type ===
                                                                                'purchase'
                                                                                    ? 'Compra'
                                                                                    : move.type ===
                                                                                        'sale'
                                                                                      ? 'Venta'
                                                                                      : move.type ===
                                                                                          'purchase_return'
                                                                                        ? 'Devolución Compra (NC)'
                                                                                        : move.type ===
                                                                                            'return'
                                                                                          ? 'Devolución Venta'
                                                                                          : move.type ===
                                                                                              'adjustment'
                                                                                            ? 'Ajuste de Stock'
                                                                                            : move.type}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="max-w-[200px] truncate px-6 py-4 text-xs text-muted-foreground">
                                                                            {
                                                                                move.reference_label
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell
                                                                            className={cn(
                                                                                'px-6 py-4 text-right font-bold tabular-nums',
                                                                                Number(
                                                                                    move.quantity,
                                                                                ) >
                                                                                    0
                                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                                    : 'text-red-600 dark:text-red-400',
                                                                            )}
                                                                        >
                                                                            {Number(
                                                                                move.quantity,
                                                                            ) >
                                                                            0
                                                                                ? `+${Number(move.quantity).toFixed(2)}`
                                                                                : Number(
                                                                                      move.quantity,
                                                                                  ).toFixed(
                                                                                      2,
                                                                                  )}
                                                                        </TableCell>
                                                                        <TableCell className="px-6 py-4 text-right font-black text-foreground tabular-nums dark:text-neutral-200">
                                                                            {Number(
                                                                                move.balance,
                                                                            ).toFixed(
                                                                                2,
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="px-6 py-4 text-right">
                                                                            <span className="flex items-center justify-end gap-2 text-xs font-semibold text-muted-foreground">
                                                                                <User2 className="h-3.5 w-3.5" />{' '}
                                                                                {move
                                                                                    .user
                                                                                    ?.name ||
                                                                                    'Sist.'}
                                                                            </span>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            },
                                                        )
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={6}
                                                                className="py-20 text-center text-xs font-bold tracking-widest text-muted-foreground uppercase opacity-50"
                                                            >
                                                                No se registran
                                                                movimientos en
                                                                el sistema
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </form>
        </AppLayout>
    );
}

function StatCard({ title, value, icon, description, highlight = false }: any) {
    return (
        <Card
            className={cn(
                'border-none shadow-sm transition-all hover:scale-[1.02]',
                highlight
                    ? 'bg-red-50 ring-2 ring-red-500/50 dark:bg-red-950/20'
                    : 'bg-white dark:bg-neutral-900/50',
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    {title}
                </CardTitle>
                <div className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black tracking-tighter text-foreground tabular-nums">
                    {value}
                </div>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground italic">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function TransactionTable({
    movements,
    type,
    emptyMessage,
}: {
    movements: any[];
    type: 'sale' | 'purchase';
    emptyMessage: string;
}) {
    if (!movements.length)
        return (
            <div className="py-20 text-center text-xs font-bold tracking-widest text-muted-foreground uppercase opacity-50">
                {emptyMessage}
            </div>
        );
    return (
        <div className="overflow-auto">
            <Table>
                <TableHeader className="bg-muted/30 dark:bg-neutral-900">
                    <TableRow className="hover:bg-transparent dark:border-neutral-800">
                        <TableHead className="px-6 text-xs font-bold uppercase dark:text-neutral-300">
                            Fecha Kardex
                        </TableHead>
                        <TableHead className="px-6 text-xs font-bold uppercase dark:text-neutral-300">
                            Documento / Referencia
                        </TableHead>
                        <TableHead className="px-6 text-right text-xs font-bold uppercase dark:text-neutral-300">
                            Cantidad
                        </TableHead>
                        <TableHead className="px-6 text-right text-xs font-bold uppercase dark:text-neutral-300">
                            {type === 'sale' ? 'P. Venta' : 'Costo Compra'}
                        </TableHead>
                        <TableHead className="px-6 text-right text-xs font-bold uppercase dark:text-neutral-300">
                            Total
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((move) => {
                        const qty = Number(move.quantity || 0);
                        const cost = Number(move.unit_cost || 0);
                        return (
                            <TableRow
                                key={move.id_movement}
                                className="cursor-pointer transition-colors hover:bg-muted/40 dark:border-neutral-800/50 dark:hover:bg-neutral-800/20"
                                onClick={() => {
                                    if (!move.reference_id) return;
                                    const url = move.reference_type.includes(
                                        'Sales',
                                    )
                                        ? sales.show({
                                              sale: move.reference_id,
                                          }).url
                                        : receipts.show({
                                              receipt: move.reference_id,
                                          }).url;
                                    router.visit(url);
                                }}
                            >
                                <TableCell className="px-6 py-4 text-sm font-medium text-foreground/80">
                                    {format(
                                        new Date(move.created_at),
                                        'dd/MM/yyyy HH:mm',
                                    )}
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {move.reference_label ||
                                                'Movimiento'}
                                        </span>
                                        <span className="text-[10px] font-black tracking-tighter text-muted-foreground uppercase">
                                            {move.user?.name || 'Sistema'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right font-bold tabular-nums dark:text-neutral-200">
                                    {Math.abs(qty).toFixed(2)}
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right text-muted-foreground tabular-nums">
                                    S/ {cost.toFixed(2)}
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right font-black text-foreground tabular-nums dark:text-neutral-200">
                                    S/ {(Math.abs(qty) * cost).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
