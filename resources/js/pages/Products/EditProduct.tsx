import { SearchableSelect } from '@/components/SearchableSelect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
    PackageOpen,
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
import { FloatingAlert } from '@/components/FloatingAlert';

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
        inventory_adjustments_count?: number; // ✅ Recibido desde el controlador
    };
    categories: any[];
    brands: any[];
    types: any[];
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
export default function EditProduct({ product, categories = [], brands = [], types = [] }: Props) {
    const { flash = {} } = usePage<FlashProps>().props;
    const [showSuccess, setShowSuccess] = useState(false);
    const [isRemoveImageAlertOpen, setIsRemoveImageAlertOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(product.url_image ? `/storage/${product.url_image}` : null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset, clearErrors, isDirty } = useForm({
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
            setData((prev: any) => ({ ...prev, image: file, delete_image: false }));
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

    const inputClasses = 'h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-sm shadow-none transition-all focus:ring-0 focus:border-blue-600 font-medium dark:text-foreground';

    const saleMovements = product.movements?.filter((m: any) => ['sale', 'return'].includes(m.type)) || [];
    const purchaseMovements = product.movements?.filter((m: any) => ['purchase', 'purchase_return'].includes(m.type)) || [];
    const allMovements = product.movements || [];

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

            <AlertDialog
                open={isRemoveImageAlertOpen}
                onOpenChange={setIsRemoveImageAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la imagen actual del producto.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeRemoveImage}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur">
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
                        <Box className="h-6 w-6 text-blue-600" />
                        <span className="max-w-md truncate text-xl font-bold tracking-tight">
                            {product.product_name}
                        </span>

                        {/* ✅ BOTÓN DE RECEPCIONES / AJUSTES */}
                        {(product.inventory_adjustments_count ?? 0) > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    router.get(
                                        `/inventario/ajuste/movimientos?search=${product.product_code}`,
                                    )
                                }
                                className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 transition-all hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                            >
                                <PackageOpen className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-black uppercase">
                                    Ajustes (
                                    {product.inventory_adjustments_count})
                                </span>
                            </button>
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
                                'min-w-[120px]',
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
                    <div className="mb-10 flex flex-col-reverse gap-10 md:flex-row md:items-start">
                        <div className="flex-1 space-y-2 pt-2">
                            <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                <Info className="mr-1 inline h-3 w-3" /> Nombre
                                del Producto
                            </Label>
                            <input
                                value={data.product_name}
                                onChange={(e) =>
                                    onFieldChange(
                                        'product_name',
                                        e.target.value,
                                    )
                                }
                                className="w-full border-0 border-b-2 border-muted bg-transparent py-2 text-4xl font-black tracking-tight focus:border-blue-600 focus:ring-0 focus:outline-none"
                            />
                        </div>

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
                                    'group relative h-40 w-40 overflow-hidden rounded-2xl border-2 transition-all',
                                    imagePreview
                                        ? 'border-blue-200 bg-white'
                                        : 'border-dashed border-muted-foreground/25 bg-muted/10',
                                )}
                            >
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
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
                                        <Camera className="h-10 w-10" />
                                        <span className="text-[10px] font-bold uppercase">
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
                                    className="relative flex items-center gap-2 rounded-none px-8 py-4 text-sm font-bold tracking-wide uppercase data-[state=active]:text-blue-600 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600"
                                >
                                    <tab.icon className="h-4 w-4" /> {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent
                                value="general"
                                className="animate-in duration-300 fade-in-50"
                            >
                                <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
                                    <div className="space-y-10">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                Tipo de Producto
                                            </Label>
                                            <SearchableSelect
                                                options={types.map((t) => ({
                                                    value: String(
                                                        t.id_product_type,
                                                    ),
                                                    label: t.name_product_type,
                                                }))}
                                                value={data.id_product_type}
                                                onChange={(v) =>
                                                    onFieldChange(
                                                        'id_product_type',
                                                        v,
                                                    )
                                                }
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                Marca del producto
                                            </Label>
                                            <SearchableSelect
                                                options={brands.map((b) => ({
                                                    value: String(b.id_brand),
                                                    label: b.name_brand,
                                                }))}
                                                value={data.id_brand}
                                                onChange={(v) =>
                                                    onFieldChange('id_brand', v)
                                                }
                                                className={inputClasses}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-10">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                Categoría
                                            </Label>
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
                                                onChange={(v) =>
                                                    onFieldChange(
                                                        'id_category',
                                                        v,
                                                    )
                                                }
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                Referencia Interna
                                            </Label>
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
                                    </div>
                                </div>
                                {/* --- SECCIÓN DE PRECIOS (NEUTRO) --- */}
                                <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
                                    {/* PRECIO DE COMPRA (COSTO) */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                            Costo de Adquisición (Compra)
                                        </Label>
                                        <div className="flex items-end gap-2 border-b-2 border-muted transition-colors focus-within:border-foreground">
                                            <span className="mb-2 text-2xl font-light text-muted-foreground">
                                                S/
                                            </span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={data.purchase_price}
                                                onChange={(e) =>
                                                    onFieldChange(
                                                        'purchase_price',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 border-0 bg-transparent px-0 text-3xl font-black focus-visible:ring-0"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase">
                                            Valor para el Kardex
                                        </p>
                                    </div>

                                    {/* PRECIO DE VENTA */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                            Precio de Venta al Público
                                        </Label>
                                        <div className="flex items-end gap-2 border-b-2 border-muted transition-colors focus-within:border-foreground">
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
                                            />
                                        </div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase">
                                            Precio final de salida
                                        </p>
                                    </div>
                                </div>

                                {/* --- ESTADO EN EL CATÁLOGO (NEUTRO) --- */}
                                <div className="mt-8 flex items-center space-x-4 rounded-xl border border-muted bg-muted/5 p-6">
                                    <Checkbox
                                        id="product-status"
                                        checked={data.status === 'active'}
                                        onCheckedChange={(c) =>
                                            onFieldChange(
                                                'status',
                                                c ? 'active' : 'inactive',
                                            )
                                        }
                                        className="h-5 w-5 border-2 border-muted-foreground data-[state=checked]:border-foreground data-[state=checked]:bg-foreground"
                                    />
                                    <div className="grid gap-1 leading-none">
                                        <Label
                                            htmlFor="product-status"
                                            className="flex cursor-pointer items-center gap-2 text-sm font-bold tracking-tight uppercase"
                                        >
                                            <Power className="h-3.5 w-3.5 text-muted-foreground" />
                                            Listar en el Catálogo de Productos
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground uppercase">
                                            Define la visibilidad del producto
                                            en ventas e inventario.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="sales">
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
                                <Card className="mt-6 overflow-hidden border-none shadow-sm dark:bg-neutral-900/50">
                                    <TransactionTable
                                        movements={saleMovements}
                                        emptyMessage="No hay ventas registradas."
                                        productCode={product.product_code}
                                    />
                                </Card>
                            </TabsContent>

                            <TabsContent value="purchase">
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
                                <Card className="mt-6 overflow-hidden border-none shadow-sm dark:bg-neutral-900/50">
                                    <TransactionTable
                                        movements={purchaseMovements}
                                        emptyMessage="No hay compras registradas."
                                        productCode={product.product_code}
                                    />
                                </Card>
                            </TabsContent>

                            <TabsContent
                                value="inventory"
                                className="animate-in space-y-8 duration-300 fade-in-50"
                            >
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
                                        <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10">
                                            <Warehouse className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">
                                                Stock Físico
                                            </p>
                                            <p
                                                className={cn(
                                                    'text-3xl font-black',
                                                    product.stock > 0
                                                        ? 'text-blue-600'
                                                        : 'text-red-600',
                                                )}
                                            >
                                                {Number(product.stock).toFixed(
                                                    2,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
                                        <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">
                                                Valorizado (Venta)
                                            </p>
                                            <p className="text-2xl font-bold">
                                                S/{' '}
                                                {(
                                                    Number(product.sale_price) *
                                                    product.stock
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-full flex-col border-dashed py-4"
                                        onClick={() =>
                                            router.get(
                                                `/inventario/ajuste/movimientos?search=${product.product_code}`,
                                            )
                                        }
                                    >
                                        <Settings2 className="mb-2 h-5 w-5" />
                                        <span className="text-xs font-bold uppercase">
                                            Ver Ajustes Manuales
                                        </span>
                                    </Button>
                                </div>
                                <Card className="overflow-hidden border-none shadow-sm dark:bg-neutral-900/50">
                                    <TransactionTable
                                        movements={allMovements}
                                        emptyMessage="No se registran movimientos en el sistema."
                                        productCode={product.product_code}
                                    />
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </form>
        </AppLayout>
    );
}

// --- TABLA DE TRANSACCIONES (KARDEX) ---
// --- TABLA DE TRANSACCIONES (KARDEX) ---
function TransactionTable({ movements, emptyMessage, productCode }: { movements: any[]; emptyMessage: string; productCode: string | null }) {
    if (!movements || !movements.length) return <div className="py-20 text-center text-xs font-bold text-muted-foreground uppercase opacity-50">{emptyMessage}</div>;

    return (
        <div className="overflow-auto">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 text-xs font-bold uppercase">
                            Fecha
                        </TableHead>
                        <TableHead className="px-6 text-xs font-bold uppercase">
                            Referencia
                        </TableHead>
                        {/* ✅ NUEVAS COLUMNAS */}
                        <TableHead className="px-6 text-center text-xs font-bold uppercase">
                            Operación
                        </TableHead>
                        <TableHead className="px-6 text-xs font-bold uppercase">
                            Trayecto
                        </TableHead>
                        <TableHead className="px-6 text-right text-xs font-bold uppercase">
                            Cant.
                        </TableHead>
                        <TableHead className="px-6 text-right text-xs font-bold uppercase">
                            Costo Unit.
                        </TableHead>
                        <TableHead className="px-6 text-right text-xs font-bold uppercase">
                            Total
                        </TableHead>
                        <TableHead className="px-6 text-right text-xs font-bold uppercase">
                            Resp.
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((move) => {
                        // Nos aseguramos de trabajar con valores absolutos para la matemática
                        const qty = Math.abs(Number(move.quantity || 0));
                        const unitValue = Number(move.unit_cost || 0);
                        const totalValue = qty * unitValue;

                        // ✅ LÓGICA INTELIGENTE: ¿Es una salida de inventario?
                        const isOutbound =
                            move.type === 'OUT' ||
                            move.type === 'sale' ||
                            move.type === 'purchase_return';

                        const typeStyles: Record<string, string> = {
                            purchase:
                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10',
                            IN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10',
                            sale: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10',
                            OUT: 'bg-red-100 text-red-700 dark:bg-red-500/10',
                            purchase_return:
                                'bg-purple-100 text-purple-700 dark:bg-purple-500/10',
                            return: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10',
                            adjustment:
                                'bg-amber-100 text-amber-700 dark:bg-amber-500/10',
                        };

                        const operationName =
                            move.type === 'IN'
                                ? 'ENTRADA'
                                : move.type === 'OUT'
                                  ? 'SALIDA'
                                  : move.type;

                        return (
                            <TableRow
                                key={move.id_movement}
                                className="cursor-pointer transition-colors hover:bg-muted/40"
                                onClick={() => {
                                    if (!move.reference_id) return;
                                    const refType = move.reference_type || '';

                                    if (
                                        refType.includes('Sales') ||
                                        ['sale', 'return'].includes(move.type)
                                    ) {
                                        router.visit(
                                            sales.show({
                                                sale: move.reference_id,
                                            }).url,
                                        );
                                    } else if (
                                        refType.includes('Receipt') ||
                                        [
                                            'purchase',
                                            'purchase_return',
                                        ].includes(move.type)
                                    ) {
                                        router.visit(
                                            receipts.show({
                                                receipt: move.reference_id,
                                            }).url,
                                        );
                                    } else if (
                                        refType.includes(
                                            'InventoryAdjustment',
                                        ) ||
                                        move.type === 'adjustment' ||
                                        ['IN', 'OUT'].includes(move.type)
                                    ) {
                                        router.get(
                                            `/inventario/ajuste/movimientos?search=${productCode}`,
                                        );
                                    }
                                }}
                            >
                                <TableCell className="px-6 py-4 text-sm text-muted-foreground tabular-nums">
                                    {format(
                                        new Date(move.created_at),
                                        'dd/MM/yyyy HH:mm',
                                    )}
                                </TableCell>

                                <TableCell className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-foreground">
                                            {move.reference_label ||
                                                move.reference
                                                    ?.reference_code ||
                                                move.reference?.po_code ||
                                                'MOV-SISTEMA'}
                                        </span>
                                        <span className="line-clamp-1 font-mono text-[10px] text-muted-foreground">
                                            {move.notes}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* ✅ NUEVA: Operación */}
                                <TableCell className="px-6 py-4 text-center">
                                    <span
                                        className={cn(
                                            'w-fit rounded-md px-2 py-0.5 text-[10px] font-black uppercase',
                                            typeStyles[move.type] || 'bg-muted',
                                        )}
                                    >
                                        {operationName}
                                    </span>
                                </TableCell>

                                {/* ✅ NUEVA: Trayecto (De / Para) */}
                                <TableCell className="px-6 py-4">
                                    <div className="flex flex-col gap-0.5 text-[10px] tracking-widest uppercase">
                                        <span className="text-muted-foreground">
                                            <span className="font-bold text-foreground">
                                                De:
                                            </span>{' '}
                                            {move.location_source ||
                                                (isOutbound
                                                    ? 'Almacén/Stock'
                                                    : 'Externo')}
                                        </span>
                                        <span className="text-muted-foreground">
                                            <span className="font-bold text-foreground">
                                                Para:
                                            </span>{' '}
                                            {move.location_dest ||
                                                (!isOutbound
                                                    ? 'Almacén/Stock'
                                                    : 'Externo')}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* ✅ CORREGIDO: Cantidad con colores y signos dinámicos */}
                                <TableCell
                                    className={cn(
                                        'px-6 py-4 text-right font-black tabular-nums',
                                        isOutbound
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-emerald-600 dark:text-emerald-400',
                                    )}
                                >
                                    {isOutbound ? '-' : '+'}
                                    {qty.toFixed(2)}
                                </TableCell>

                                <TableCell className="px-6 py-4 text-right text-muted-foreground tabular-nums">
                                    S/ {unitValue.toFixed(2)}
                                </TableCell>

                                {/* ✅ CORREGIDO: Total con colores y signos dinámicos */}
                                <TableCell
                                    className={cn(
                                        'px-6 py-4 text-right font-bold tabular-nums',
                                        isOutbound
                                            ? 'text-red-600/80 dark:text-red-400/80'
                                            : 'text-emerald-600/80 dark:text-emerald-400/80',
                                    )}
                                >
                                    {isOutbound ? '- S/ ' : '+ S/ '}
                                    {totalValue.toFixed(2)}
                                </TableCell>

                                <TableCell className="px-6 py-4 text-right">
                                    <span className="flex items-center justify-end gap-2 text-xs font-semibold text-muted-foreground uppercase">
                                        <User2 className="h-3 w-3" />{' '}
                                        {move.user?.name || 'Sist.'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
