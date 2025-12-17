import { SearchableSelect } from '@/Components/SearchableSelect';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import brandsRoute from '@/routes/product-brands';
import categoriesRoute from '@/routes/product-categories';
import typesRoute from '@/routes/product-types';
import productsRoute from '@/routes/products';
import receipts from '@/routes/receipts';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle, Box,
    Camera,
    CheckCircle2,
    Eye,
    MoreVertical,
    Pencil,
    Plus,
    RotateCcw,
    Save,
    Trash2,
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
        purchase_price: string | null; // <--- AGREGAR
        stock: number;
    };
    categories: {
        id_product_category: number;
        name_product_category: string;
    }[];
    brands: { id_brand: number; name_brand: string }[];
    types: { id_product_type: number; name_product_type: string }[];
    movements?: {
        id_movement: number;
        type: string; // 'purchase', 'sale', 'adjustment', etc.
        quantity: number;
        unit_cost: number;
        balance: number;
        created_at: string;
        notes: string | null;
    }[];
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
            className={`z-50 animate-in fade-in slide-in-from-top-2 ${
                isSuccess
                    ? 'fixed top-6 right-6 w-auto max-w-md'
                    : 'absolute top-full left-0 mt-1 w-full'
            }`}
        >
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={`border-2 shadow-xl ${
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'bg-white dark:bg-slate-900'
                }`}
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

    // --- ESTADOS DE DIÁLOGOS ---
    const [isDeleteProductAlertOpen, setIsDeleteProductAlertOpen] =
        useState(false); // Para eliminar producto completo
    const [isRemoveImageAlertOpen, setIsRemoveImageAlertOpen] = useState(false); // Para quitar solo la imagen
    const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Para ver detalle

    // Inicializar imagen
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
        purchase_price: product.purchase_price || '', // <--- AGREGAR
    });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev) => ({
                ...prev,
                image: file,
                delete_image: false,
            }));
            setImagePreview(URL.createObjectURL(file));
            if (errors.image) clearErrors('image');
        }
    };

    // 1. Trigger para abrir el modal de confirmación de imagen
    const confirmRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar que clicke el input file de fondo
        setIsRemoveImageAlertOpen(true);
    };

    // 2. Acción real de quitar imagen
    const executeRemoveImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setData((prev) => ({
            ...prev,
            image: null,
            delete_image: true,
        }));
        setIsRemoveImageAlertOpen(false); // Cerrar modal
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(productsRoute.update({ product: product.id_product }).url, {
            forceFormData: true,
            onSuccess: () => setShowSuccess(true),
        });
    };

    const executeDeleteProduct = () => {
        router.delete(
            productsRoute.destroy({ product: product.id_product }).url,
            {
                onFinish: () => setIsDeleteProductAlertOpen(false),
            },
        );
    };

    // Opciones selects
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

    // Redirecciones
    const goToCreateType = () => router.visit(typesRoute.create().url);
    const goToCreateCategory = () => router.visit(categoriesRoute.create().url);
    const goToCreateBrand = () => router.visit(brandsRoute.create().url);

    const inputClasses =
        'h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none transition-all placeholder:text-muted-foreground/30 focus:ring-0 focus:border-blue-600 focus:outline-none';

    const breadcrumbs = [
        { title: 'Productos', href: productsRoute.index().url },
        { title: data.product_name || 'Editar', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar ${product.product_name}`} />

            {/* --- MODAL 1: VER DETALLE IMAGEN --- */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
                    <div className="relative flex h-[80vh] w-full items-center justify-center overflow-hidden rounded-lg bg-black/50 backdrop-blur-sm">
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Detalle"
                                className="h-full w-full object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- MODAL 2: CONFIRMAR QUITAR IMAGEN --- */}
            <AlertDialog
                open={isRemoveImageAlertOpen}
                onOpenChange={setIsRemoveImageAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Quitar imagen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La imagen se eliminará de la vista previa. Deberás
                            presionar "Guardar" para confirmar el cambio en la
                            base de datos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeRemoveImage}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Sí, quitar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- MODAL 3: CONFIRMAR ELIMINAR PRODUCTO --- */}
            <AlertDialog
                open={isDeleteProductAlertOpen}
                onOpenChange={setIsDeleteProductAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar{' '}
                            <strong>"{product.product_name}"</strong>. Esta
                            acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDeleteProduct}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {showSuccess && flash?.success && (
                <FloatingAlert message={flash.success} type="success" />
            )}

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
                encType="multipart/form-data"
            >
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <Button
                            className="bg-blue-700 font-medium text-white shadow-sm hover:bg-blue-800 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
                            onClick={() =>
                                router.visit(productsRoute.create().url)
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo
                        </Button>
                        <div className="flex items-center gap-3">
                        <Box />
                        <span className="max-w-md truncate text-xl font-semibold text-foreground/90">
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
                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {isDirty && (
                            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Sin guardar
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => reset()}
                            disabled={!isDirty || processing}
                            type="button"
                            className={`border-muted-foreground/30 hover:bg-muted ${!isDirty ? 'opacity-50' : ''}`}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={`min-w-[120px] bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95 ${!isDirty ? 'bg-gray-400 opacity-50' : ''}`}
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar
                        </Button>
                    </div>
                </div>

                {/* --- CONTENIDO --- */}
                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <div className="mb-10 flex flex-col-reverse gap-10 md:flex-row md:items-start">
                        {/* Nombre */}
                        <div className="flex-1 space-y-6 pt-2">
                            <div className="relative space-y-2">
                                <Label
                                    htmlFor="product_name"
                                    className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                                >
                                    Nombre del Producto
                                </Label>
                                <input
                                    id="product_name"
                                    value={data.product_name}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'product_name',
                                            e.target.value,
                                        )
                                    }
                                    className="h-auto w-full rounded-none border-0 border-b-2 border-muted bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight text-foreground transition-all duration-300 placeholder:text-muted-foreground/20 focus:border-blue-600 focus:ring-0 focus:outline-none"
                                />
                                <FloatingAlert
                                    message={errors.product_name}
                                    type="error"
                                />
                            </div>
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
                                className={`group relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border-2 transition-all duration-300 ${errors.image ? 'border-red-500 bg-red-50/10' : 'border-muted-foreground/25 bg-muted/10'}`}
                            >
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Overlay de Acciones */}
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsImageModalOpen(true);
                                                }}
                                                title="Ver detalle"
                                            >
                                                <Eye className="h-4 w-4 text-gray-700" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fileInputRef.current?.click();
                                                }}
                                                title="Cambiar imagen"
                                            >
                                                <Pencil className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                                                onClick={confirmRemoveImage} // AHORA ABRE EL DIÁLOGO
                                                title="Eliminar imagen"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground/60 transition-colors hover:bg-muted/20 hover:text-blue-600"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Camera className="h-10 w-10" />
                                        <span className="text-xs font-bold tracking-wide uppercase">
                                            Subir Foto
                                        </span>
                                    </div>
                                )}
                            </div>
                            {errors.image && (
                                <p className="mt-2 text-center text-xs font-medium text-red-500">
                                    {errors.image}
                                </p>
                            )}
                        </div>
                    </div>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                            {['general', 'sales', 'purchase', 'inventory'].map(
                                (tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600"
                                    >
                                        {tab === 'general'
                                            ? 'Información General'
                                            : tab === 'sales'
                                              ? 'Ventas'
                                              : tab === 'purchase'
                                                ? 'Compras'
                                                : 'Inventario'}
                                    </TabsTrigger>
                                ),
                            )}
                        </TabsList>
                        <div className="mt-6">
                            <TabsContent
                                value="general"
                                className="animate-in duration-300 fade-in-50 slide-in-from-left-2"
                            >
                                <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                                    <div className="space-y-8">
                                        <div className="group space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">
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
                                                onCreate={goToCreateType}
                                                error={errors.id_product_type}
                                                placeholder="Seleccionar tipo..."
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">
                                                Precio de Venta
                                            </Label>
                                            <div
                                                className={`flex items-end gap-2 border-b transition-colors focus-within:border-blue-600 ${errors.sale_price ? 'border-red-500' : 'border-muted'}`}
                                            >
                                                <span className="mb-2 text-lg font-medium text-muted-foreground">
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
                                                    className="h-10 w-full rounded-none border-0 bg-transparent px-0 text-lg font-semibold shadow-none placeholder:text-muted-foreground/30 focus-visible:ring-0"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {errors.sale_price && (
                                                <p className="text-sm font-medium text-red-500">
                                                    {errors.sale_price}
                                                </p>
                                            )}
                                        </div>

                                        <div className="group space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">
                                                Costo de Compra (Ref.)
                                            </Label>
                                            <div className="flex items-end gap-2 border-b border-muted transition-colors focus-within:border-blue-600">
                                                <span className="mb-2 text-lg font-medium text-muted-foreground">
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
                                                    className="h-10 w-full rounded-none border-0 bg-transparent px-0 text-lg font-semibold shadow-none placeholder:text-muted-foreground/30 focus-visible:ring-0"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        {/* NUEVO: STOCK ACTUAL (SOLO LECTURA) */}
                                        <div className="group space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">
                                                Stock Actual
                                            </Label>
                                            <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
                                                <span
                                                    className={`text-xl font-bold ${product.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}
                                                >
                                                    {product.stock ?? 0}
                                                </span>
                                                <span className="text-xs text-muted-foreground uppercase">
                                                    Unidades
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                * El stock se modifica mediante
                                                Compras o Ventas.
                                            </p>
                                        </div>

                                        <div className="group space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">
                                                Estado
                                            </Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(val) =>
                                                    onFieldChange('status', val)
                                                }
                                            >
                                                <SelectTrigger
                                                    className={inputClasses}
                                                >
                                                    <SelectValue placeholder="Estado..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">
                                                        Activo
                                                    </SelectItem>
                                                    <SelectItem value="inactive">
                                                        Inactivo
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="group space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">
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
                                                onCreate={goToCreateCategory}
                                                error={errors.id_category}
                                                placeholder="Seleccionar categoría..."
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">
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
                                                onCreate={goToCreateBrand}
                                                error={errors.id_brand}
                                                placeholder="Seleccionar marca..."
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">
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
                                            <FloatingAlert
                                                message={errors.product_code}
                                                type="error"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="sales">
                                <div className="flex h-64 items-center justify-center rounded border border-dashed text-muted-foreground">
                                    Configuración de Ventas
                                </div>
                            </TabsContent>
                            <TabsContent value="purchase">
                                <div className="flex h-64 items-center justify-center rounded border border-dashed text-muted-foreground">
                                    Configuración de Compras
                                </div>
                            </TabsContent>
                            <TabsContent
                                value="inventory"
                                className="animate-in space-y-6 duration-300 fade-in-50 slide-in-from-left-2"
                            >
                                {/* 1. CABECERA: STOCK ACTUAL RESALTADO */}
                                <div className="flex items-center justify-between rounded-lg border bg-card p-6 shadow-sm">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-medium">
                                            Stock Disponible
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Cantidad actual física en almacén
                                            calculada según movimientos.
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`text-4xl font-bold tracking-tight ${product.stock > 0 ? 'text-blue-600' : 'text-red-600'}`}
                                        >
                                            {product.stock ?? 0}
                                        </span>
                                        <span className="ml-2 text-lg font-medium text-muted-foreground">
                                            Unidades
                                        </span>
                                    </div>
                                </div>

                                {/* 2. TABLA DE MOVIMIENTOS (KARDEX) */}
                                <div className="rounded-md border bg-card">
                                    <div className="border-b bg-muted/40 p-4">
                                        <h4 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                            Últimos Movimientos (Kardex)
                                        </h4>
                                    </div>
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <thead className="[&_tr]:border-b">
                                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                        Fecha
                                                    </th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                        Tipo
                                                    </th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                        Notas
                                                    </th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                                                        Cantidad
                                                    </th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                                                        Costo Unit.
                                                    </th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                                                        Saldo
                                                    </th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                                                        Usuario
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="[&_tr:last-child]:border-0">
                                                {product.movements &&
                                                product.movements.length > 0 ? (
                                                    product.movements.map(
                                                        (move) => (
                                                            <tr
                                                                onClick={() => {
                                                                    router.visit(
                                                                        receipts.show(
                                                                            {
                                                                                receipt:
                                                                                    move.reference_id,
                                                                            },
                                                                        ).url,
                                                                    );
                                                                }}
                                                                key={
                                                                    move.id_movement
                                                                }
                                                                className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                                                            >
                                                                <td className="p-4 align-middle">
                                                                    {new Date(
                                                                        move.created_at,
                                                                    ).toLocaleDateString()}
                                                                    <span className="block text-[10px] text-muted-foreground">
                                                                        {new Date(
                                                                            move.created_at,
                                                                        ).toLocaleTimeString(
                                                                            [],
                                                                            {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                            },
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                                    <span
                                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                                                            // Lógica para asignar color y etiqueta
                                                                            move.type ===
                                                                            'purchase'
                                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' // Entrada: Compra
                                                                                : move.type ===
                                                                                    'sale'
                                                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' // Salida: Venta
                                                                                  : move.type ===
                                                                                      'purchase_return' // ¡NUEVO TIPO!
                                                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' // Salida: Devolución de Compra
                                                                                    : move.type ===
                                                                                        'return'
                                                                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' // Entrada: Devolución de Venta
                                                                                      : move.type ===
                                                                                          'adjustment'
                                                                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' // Ajuste (Neutro)
                                                                                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' // Otros
                                                                        }`}
                                                                    >
                                                                        {/* Lógica para traducir la etiqueta */}
                                                                        {move.type ===
                                                                        'purchase'
                                                                            ? 'Compra'
                                                                            : move.type ===
                                                                                'sale'
                                                                              ? 'Venta'
                                                                              : move.type ===
                                                                                  'purchase_return' // ¡NUEVO: Traducción!
                                                                                ? 'Devolución Compra (NC)'
                                                                                : move.type ===
                                                                                    'return'
                                                                                  ? 'Devolución Venta'
                                                                                  : move.type ===
                                                                                      'adjustment'
                                                                                    ? 'Ajuste'
                                                                                    : move.type}
                                                                    </span>
                                                                </td>
                                                                <td
                                                                    className="max-w-[200px] truncate p-4 align-middle"
                                                                    title={
                                                                        move.notes ||
                                                                        ''
                                                                    }
                                                                >
                                                                    {move.notes ||
                                                                        '-'}
                                                                </td>
                                                                <td
                                                                    className={`p-4 text-right align-middle font-bold ${move.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}
                                                                >
                                                                    {move.quantity >
                                                                    0
                                                                        ? '+'
                                                                        : ''}
                                                                    {
                                                                        move.quantity
                                                                    }
                                                                </td>
                                                                <td className="p-4 text-right align-middle">
                                                                    S/{' '}
                                                                    {Number(
                                                                        move.unit_cost,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </td>
                                                                <td className="p-4 text-right align-middle font-medium">
                                                                    {Number(
                                                                        move.balance,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </td>
                                                                <td className="p-4 text-right align-middle font-medium">
                                                                    {/* Usamos el operador ?. (optional chaining) para evitar errores si no hay usuario */}
                                                                    <span className="flex items-center justify-end gap-2">
                                                                        {move.user ? (
                                                                            <>
                                                                                <span className="font-medium">
                                                                                    {
                                                                                        move
                                                                                            .user
                                                                                            .name
                                                                                    }
                                                                                </span>
                                                                                {/* Opcional: Si quieres mostrar un avatar o iniciales */}
                                                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600">
                                                                                    {move.user.name
                                                                                        .charAt(
                                                                                            0,
                                                                                        )
                                                                                        .toUpperCase()}
                                                                                </span>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-muted-foreground italic">
                                                                                Sistema
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="h-24 text-center text-muted-foreground"
                                                        >
                                                            No hay movimientos
                                                            registrados para
                                                            este producto.
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
