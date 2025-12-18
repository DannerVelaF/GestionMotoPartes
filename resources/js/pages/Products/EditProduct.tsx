import { SearchableSelect } from '@/components/SearchableSelect';
import { format } from 'date-fns'; // <--- ASEGÚRATE DE AÑADIR ESTO
import { es } from 'date-fns/locale';
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import brandsRoute from '@/routes/product-brands';
import categoriesRoute from '@/routes/product-categories';
import typesRoute from '@/routes/product-types';
import productsRoute from '@/routes/products';
import receipts from '@/routes/receipts';
import { Head, router, useForm, usePage } from '@inertiajs/react';
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
    MoreVertical,
    Package,
    Pencil,
    Plus,
    RotateCcw,
    Save,
    Settings2,
    Tag as TagIcon,
    Trash2,
    TrendingDown,
    TrendingUp,
    User2,
    Warehouse,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import sales from '@/routes/sales';

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
    };
    categories: any[];
    brands: any[];
    types: any[];
}

// --- ALERTA FLOTANTE ---
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
        <div
            className={`fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2`}
        >
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={`border-2 shadow-xl ${isSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-red-500 bg-white text-red-900'}`}
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

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

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

    const typeOptions = types.map((t) => ({
        value: String(t.id_product_type),
        label: t.name_product_type,
    }));
    const categoryOptions = categories.map((c) => ({
        value: String(c.id_product_category),
        label: c.name_product_category,
    }));
    const brandOptions = brands.map((b) => ({
        value: String(b.id_brand),
        label: b.name_brand,
    }));

    const inputClasses =
        'h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-xs shadow-none transition-all placeholder:text-muted-foreground/30 focus:ring-0 focus:border-blue-600 focus:outline-none font-medium';

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
                        <AlertDialogTitle>¿Quitar imagen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La imagen se eliminará. Guarda los cambios para
                            confirmar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeRemoveImage}
                            className="bg-red-600"
                        >
                            Sí, quitar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={isDeleteProductAlertOpen}
                onOpenChange={setIsDeleteProductAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar{' '}
                            <strong>"{product.product_name}"</strong>{' '}
                            permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                router.delete(
                                    productsRoute.destroy({
                                        product: product.id_product,
                                    }).url,
                                )
                            }
                            className="bg-red-600"
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
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <Button
                            className="bg-blue-700 font-medium text-white shadow-sm hover:bg-blue-800"
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() =>
                                        setIsDeleteProductAlertOpen(true)
                                    }
                                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                    Producto
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {isDirty && (
                            <span className="ml-2 animate-pulse rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700 uppercase">
                                Sin guardar
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
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

                {/* --- CONTENIDO --- */}
                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <div className="mb-10 flex flex-col-reverse gap-10 md:flex-row md:items-start">
                        <div className="flex-1 space-y-2 pt-2">
                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
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
                                className="h-auto w-full border-0 border-b-2 border-muted bg-transparent px-0 py-2 text-4xl font-black tracking-tight text-foreground transition-all focus:border-blue-600 focus:ring-0 focus:outline-none"
                            />
                        </div>

                        {/* --- ZONA DE IMAGEN --- */}
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
                                        ? 'border-blue-200 bg-white shadow-sm'
                                        : 'border-dashed border-muted-foreground/25 bg-muted/10 hover:bg-muted/20',
                                )}
                            >
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
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
                                        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground/60 transition-colors hover:text-blue-600"
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
                            <TabsContent
                                value="general"
                                className="animate-in duration-300 fade-in-50"
                            >
                                <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                                    <div className="space-y-10">
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <LayoutGrid className="h-3 w-3" />{' '}
                                                Tipo de Producto
                                            </Label>
                                            <SearchableSelect
                                                options={typeOptions}
                                                value={data.id_product_type}
                                                onChange={(val) =>
                                                    onFieldChange(
                                                        'id_product_type',
                                                        val,
                                                    )
                                                }
                                                onCreate={() =>
                                                    router.visit(
                                                        typesRoute.create().url,
                                                    )
                                                }
                                                placeholder="Seleccionar tipo..."
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <DollarSign className="h-3 w-3" />{' '}
                                                Precio de Venta
                                            </Label>
                                            <div className="flex items-end gap-2 border-b-2 border-muted transition-colors focus-within:border-blue-600">
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
                                                    className="h-10 border-0 bg-transparent px-0 text-3xl font-black shadow-none focus-visible:ring-0"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <History className="h-3 w-3" />{' '}
                                                Costo de Compra (Ref.)
                                            </Label>
                                            <div className="flex items-end gap-2 border-b border-muted transition-colors focus-within:border-blue-600">
                                                <span className="mb-1 text-lg font-medium text-muted-foreground">
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
                                                    className="h-10 border-0 bg-transparent px-0 text-lg font-bold shadow-none focus-visible:ring-0"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-10">
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <TagIcon className="h-3 w-3" />{' '}
                                                Categoría
                                            </Label>
                                            <SearchableSelect
                                                options={categoryOptions}
                                                value={data.id_category}
                                                onChange={(val) =>
                                                    onFieldChange(
                                                        'id_category',
                                                        val,
                                                    )
                                                }
                                                onCreate={() =>
                                                    router.visit(
                                                        categoriesRoute.create()
                                                            .url,
                                                    )
                                                }
                                                placeholder="Seleccionar categoría..."
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <Package className="h-3 w-3" />{' '}
                                                Marca
                                            </Label>
                                            <SearchableSelect
                                                options={brandOptions}
                                                value={data.id_brand}
                                                onChange={(val) =>
                                                    onFieldChange(
                                                        'id_brand',
                                                        val,
                                                    )
                                                }
                                                onCreate={() =>
                                                    router.visit(
                                                        brandsRoute.create()
                                                            .url,
                                                    )
                                                }
                                                placeholder="Seleccionar marca..."
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                <Barcode className="h-3 w-3" />{' '}
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
                            </TabsContent>

                            <TabsContent
                                value="inventory"
                                className="animate-in space-y-8 duration-300 fade-in-50"
                            >
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
                                        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
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
                                                        ? 'text-blue-600'
                                                        : 'text-red-600',
                                                )}
                                            >
                                                {product.stock ?? 0}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
                                        <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
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
                                    <div className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
                                        <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
                                            <Settings2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                Estado de Almacén
                                            </p>
                                            <p className="text-sm font-semibold">
                                                {product.stock > 10
                                                    ? 'Stock Saludable'
                                                    : 'Reponer Stock'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                                    <div className="border-b bg-muted/30 px-6 py-4">
                                        <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-slate-700 uppercase">
                                            <History className="h-4 w-4" />{' '}
                                            Historial de Movimientos (Kardex)
                                        </h4>
                                    </div>
                                    <div className="overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/10">
                                                <tr className="border-b text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                    <th className="px-6 py-3 text-left">
                                                        Fecha / Hora
                                                    </th>
                                                    <th className="px-6 py-3 text-left">
                                                        Tipo Mov.
                                                    </th>
                                                    <th className="px-6 py-3 text-left">
                                                        Referencia
                                                    </th>
                                                    <th className="px-6 py-3 text-right">
                                                        Cant.
                                                    </th>
                                                    <th className="px-6 py-3 text-right">
                                                        Saldo
                                                    </th>
                                                    <th className="px-6 py-3 text-right">
                                                        Usuario
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {product.movements?.length ? (
                                                    product.movements.map(
                                                        (move: any) => (
                                                            <tr
                                                                key={
                                                                    move.id_movement
                                                                }
                                                                className={cn(
                                                                    'transition-colors',
                                                                    move.reference_id
                                                                        ? 'cursor-pointer hover:bg-muted/20'
                                                                        : 'cursor-default opacity-80',
                                                                )}
                                                                onClick={() => {
                                                                    if (
                                                                        !move.reference_id
                                                                    )
                                                                        return;

                                                                    // Lógica de redirección dinámica
                                                                    const url =
                                                                        move.type ===
                                                                            'sale' ||
                                                                        move.type ===
                                                                            'return'
                                                                            ? sales.show(
                                                                                  {
                                                                                      sale:
                                                                                          move.reference_id,
                                                                                  },
                                                                              )
                                                                            : receipts.show(
                                                                                  {
                                                                                      receipt:
                                                                                          move.reference_id,
                                                                                  },
                                                                              )
                                                                                  .url; // Ruta para Compras/Recibos

                                                                    router.visit(
                                                                        url,
                                                                    );
                                                                }}
                                                            >
                                                                <td className="px-6 py-4 font-medium">
                                                                    {format(
                                                                        new Date(
                                                                            move.created_at,
                                                                        ),
                                                                        'dd/MM/yyyy HH:mm',
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span
                                                                        className={cn(
                                                                            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase',
                                                                            // Lógica de colores según el tipo
                                                                            move.type ===
                                                                                'purchase' ||
                                                                                move.type ===
                                                                                    'return'
                                                                                ? 'bg-blue-100 text-blue-700' // Entradas (Compra o Devolución de Cliente)
                                                                                : move.type ===
                                                                                        'sale' ||
                                                                                    move.type ===
                                                                                        'purchase_return'
                                                                                  ? 'bg-emerald-100 text-emerald-700' // Salidas (Venta o Devolución a Proveedor)
                                                                                  : 'bg-amber-100 text-amber-700', // Ajustes u otros
                                                                        )}
                                                                    >
                                                                        {/* Lógica de traducción manual como se hacía antes */}
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
                                                                </td>
                                                                <td className="max-w-[150px] truncate px-6 py-4 text-xs text-muted-foreground">
                                                                    {move.notes ||
                                                                        '-'}
                                                                </td>
                                                                <td
                                                                    className={cn(
                                                                        'px-6 py-4 text-right font-bold tabular-nums',
                                                                        move.quantity >
                                                                            0
                                                                            ? 'text-blue-600'
                                                                            : 'text-red-600',
                                                                    )}
                                                                >
                                                                    {move.quantity >
                                                                    0
                                                                        ? `+${move.quantity}`
                                                                        : move.quantity}
                                                                </td>
                                                                <td className="px-6 py-4 text-right font-black tabular-nums">
                                                                    {
                                                                        move.balance
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <span className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-600">
                                                                        <User2 className="h-3 w-3" />{' '}
                                                                        {move
                                                                            .user
                                                                            ?.name ||
                                                                            'Sist.'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="py-20 text-center font-medium text-muted-foreground"
                                                        >
                                                            No se registran
                                                            movimientos.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </form>
        </AppLayout>
    );
}
