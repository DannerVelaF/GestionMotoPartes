import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import categories from '@/routes/product-categories';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, Save } from 'lucide-react';
import { FormEventHandler } from 'react';
import products from '@/routes/products';

// --- COMPONENTE DE ALERTA FLOTANTE ---
function FloatingAlert({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 animate-in fade-in slide-in-from-top-1">
            <Alert
                variant="destructive"
                className="border-2 bg-white shadow-xl dark:bg-slate-900"
            >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="ml-2 font-bold">
                    Error de Validación
                </AlertTitle>
                <AlertDescription className="ml-2">{message}</AlertDescription>
            </Alert>
        </div>
    );
}

export default function CreateCategory() {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name_product_category: '',
            status: 'active',
        });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) {
            clearErrors(field);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(categories.store().url);
    };

    const breadcrumbs = [
        { title: 'Productos', href: products.index().url },
        { title: 'Categorías', href: categories.index().url },
        { title: 'Nueva', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Categoría" />

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        {/* BOTÓN DE RETROCESO ELIMINADO */}
                        <span className="text-xl font-semibold text-foreground/90">
                            Crear Categoría
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
                <div className="w-full max-w-5xl animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    {/* INPUT GIGANTE */}
                    <div className="mb-12 space-y-6 pt-2">
                        <div className="relative space-y-2">
                            <Label
                                htmlFor="name_product_category"
                                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                            >
                                Nombre de la Categoría
                            </Label>
                            <input
                                id="name_product_category"
                                value={data.name_product_category}
                                onChange={(e) =>
                                    onFieldChange(
                                        'name_product_category',
                                        e.target.value,
                                    )
                                }
                                placeholder="Ej. Lubricantes"
                                className={`h-auto w-full rounded-none border-0 border-b-2 bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight transition-all duration-300 placeholder:text-muted-foreground/20 focus:ring-0 focus:outline-none ${
                                    errors.name_product_category
                                        ? 'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500'
                                        : 'border-muted text-foreground focus:border-blue-600'
                                }`}
                            />
                            <FloatingAlert
                                message={errors.name_product_category}
                            />
                        </div>
                    </div>

                    {/* SECCIÓN DE DETALLES */}
                    <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                        <div className="space-y-8">
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
                                        className={`h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none transition-all focus:ring-0 ${
                                            errors.status
                                                ? 'border-red-500 focus:border-red-500'
                                                : 'border-muted focus:border-blue-600'
                                        }`}
                                    >
                                        <SelectValue placeholder="Seleccionar estado..." />
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
                                {errors.status && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.status}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 p-6 text-sm text-muted-foreground">
                                <p>
                                    Las categorías ayudan a organizar tu
                                    inventario. Asegúrate de usar nombres claros
                                    y únicos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
