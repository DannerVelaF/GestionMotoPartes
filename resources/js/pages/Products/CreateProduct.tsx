import { SearchableSelect } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import brandsRoute from '@/routes/product-brands'; // Rutas Wayfinder
import categoriesRoute from '@/routes/product-categories'; // Rutas Wayfinder
import typesRoute from '@/routes/product-types'; // Rutas Wayfinder
import products from '@/routes/products';
import { Head, router, useForm } from '@inertiajs/react';
import { Box, Camera, Save } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

interface Props {
    categories: {
        id_product_category: number;
        name_product_category: string;
    }[];
    brands: { id_brand: number; name_brand: string }[];
    types: { id_product_type: number; name_product_type: string }[];
}

export default function CreateProduct({
    categories = [],
    brands = [],
    types = [],
}: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            product_name: '',
            product_code: '',
            sale_price: '',
            id_category: '',
            id_brand: '',
            id_product_type: '',
            notes: '',
            status: 'active',
            image: null as File | null,
        });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) {
            clearErrors(field);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            setImagePreview(URL.createObjectURL(file));
            if (errors.image) clearErrors('image');
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(products.store().url, {
            forceFormData: true,
        });
    };

    // --- TRANSFORMACIÓN DE DATOS PARA EL SELECT ---
    // Convertimos tus arrays de DB al formato { value, label } que espera el componente
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

    // --- HANDLERS DE REDIRECCIÓN A CREAR ---
    const goToCreateType = () => router.visit(typesRoute.create().url);
    const goToCreateCategory = () => router.visit(categoriesRoute.create().url);
    const goToCreateBrand = () => router.visit(brandsRoute.create().url);

    const breadcrumbs = [
        { title: 'Productos', href: products.index().url },
        { title: 'Nuevo', href: '' },
    ];

    const tabsList = [
        { value: 'general', label: 'Información General' },
        { value: 'sales', label: 'Ventas' },
        { value: 'purchase', label: 'Compras' },
        { value: 'inventory', label: 'Inventario' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo Producto" />

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
                encType="multipart/form-data"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <Box />
                        <span className="text-xl font-semibold text-foreground/90">
                            Crear Producto
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => reset()}
                            disabled={processing}
                            type="button"
                            className="border-muted-foreground/30 hover:bg-muted"
                        >
                            Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="min-w-[120px] bg-blue-600 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar
                        </Button>
                    </div>
                </div>

                {/* --- CONTENIDO PRINCIPAL --- */}
                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    {/* 1. SECCIÓN SUPERIOR: TÍTULO E IMAGEN */}
                    <div className="mb-10 flex flex-col-reverse gap-10 md:flex-row md:items-start">
                        {/* IZQUIERDA: Input Gigante del Nombre */}
                        <div className="flex-1 space-y-6 pt-2">
                            <div className="space-y-2">
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
                                    placeholder="Ej... Aceite de motor"
                                    className={`h-auto w-full rounded-none border-0 border-b-2 bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight transition-all duration-300 placeholder:text-muted-foreground/20 focus:ring-0 focus:outline-none ${
                                        errors.product_name
                                            ? 'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500'
                                            : 'border-muted text-foreground focus:border-blue-600'
                                    }`}
                                />
                                {errors.product_name && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.product_name}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* DERECHA: Imagen */}
                        <div className="flex shrink-0 flex-col items-center">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`group relative flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 hover:bg-blue-50/10 ${
                                    errors.image
                                        ? 'border-red-500 bg-red-50/10'
                                        : 'border-muted-foreground/25 bg-muted/10 hover:border-blue-500/50'
                                }`}
                            >
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground/60 transition-colors group-hover:text-blue-600">
                                        <Camera className="h-10 w-10" />
                                        <span className="text-xs font-bold tracking-wide uppercase">
                                            Subir Foto
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                            {errors.image && (
                                <p className="mt-2 text-center text-xs font-medium text-red-500">
                                    {errors.image}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 2. PESTAÑAS (TABS) */}
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                            {tabsList.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:scale-x-0 after:bg-blue-600 after:transition-transform hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:after:scale-x-100 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:after:bg-blue-400"
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="mt-6">
                            {/* --- TAB: GENERAL --- */}
                            <TabsContent
                                value="general"
                                className="animate-in duration-300 fade-in-50 slide-in-from-left-2"
                            >
                                <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                                    {/* Columna Izquierda */}
                                    <div className="space-y-8">
                                        {/* TIPO DE PRODUCTO (SEARCHABLE) */}
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
                                                onCreate={goToCreateType} // Redirección
                                                error={errors.id_product_type}
                                                placeholder="Seleccionar tipo..."
                                            />
                                        </div>

                                        <div className="group space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">
                                                Precio de Venta
                                            </Label>
                                            <div
                                                className={`flex items-end gap-2 border-b transition-colors focus-within:border-blue-600 ${
                                                    errors.sale_price
                                                        ? 'border-red-500'
                                                        : 'border-muted'
                                                }`}
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
                                                    onBlur={(e) => {
                                                        const value =
                                                            parseFloat(
                                                                e.target.value,
                                                            );
                                                        if (!isNaN(value)) {
                                                            onFieldChange(
                                                                'sale_price',
                                                                value.toFixed(
                                                                    2,
                                                                ),
                                                            );
                                                        }
                                                    }}
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
                                    </div>

                                    {/* Columna Derecha */}
                                    <div className="space-y-8">
                                        {/* CATEGORÍA (SEARCHABLE) */}
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
                                                onCreate={goToCreateCategory} // Redirección
                                                error={errors.id_category}
                                                placeholder="Seleccionar categoría..."
                                            />
                                        </div>

                                        {/* MARCA (SEARCHABLE) */}
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
                                                onCreate={goToCreateBrand} // Redirección
                                                error={errors.id_brand}
                                                placeholder="Seleccionar marca..."
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
                                                className={`h-10 rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none transition-all placeholder:text-muted-foreground/30 focus-visible:ring-0 ${
                                                    errors.product_code
                                                        ? 'border-red-500 focus-visible:border-red-500'
                                                        : 'border-muted focus-visible:border-blue-600'
                                                }`}
                                                placeholder="Ej. COD-001"
                                            />
                                            {errors.product_code && (
                                                <p className="text-sm font-medium text-red-500">
                                                    {errors.product_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ... Otros Tabs ... */}
                            <TabsContent value="sales">
                                <div className="flex h-64 animate-in flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 text-muted-foreground fade-in-50">
                                    <p>
                                        Configuraciones de política de ventas.
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="purchase">
                                <div className="flex h-64 animate-in flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 text-muted-foreground fade-in-50">
                                    <p>
                                        Configuraciones de proveedores y
                                        compras.
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="inventory">
                                <div className="flex h-64 animate-in flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 text-muted-foreground fade-in-50">
                                    <p>Configuraciones de rutas y logística.</p>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </form>
        </AppLayout>
    );
}
