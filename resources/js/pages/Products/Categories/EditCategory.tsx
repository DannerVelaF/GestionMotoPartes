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
} from "@/components/ui/alert-dialog"; // Importar Shadcn
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    MoreVertical,
    RotateCcw,
    Save,
    Trash2,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import products from '@/routes/products';

// ... (Tipos FlashProps y FloatingAlert se mantienen igual) ...
// --- TIPO DE FLASH MESSAGE DE LARAVEL ---
interface FlashProps {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: any;
}

function FloatingAlert({ message, type = 'error' }: { message?: string; type?: 'error' | 'success'; }) {
    if (!message) return null;
    const isSuccess = type === 'success';
    return (
        <div className={`z-50 animate-in fade-in slide-in-from-top-2 ${isSuccess ? 'fixed top-6 right-6 w-auto max-w-md' : 'absolute top-full left-0 mt-2 w-fit max-w-full'}`}>
            <Alert variant={isSuccess ? 'default' : 'destructive'} className={`border-2 shadow-xl ${isSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100' : 'bg-white dark:bg-slate-900'}`}>
                {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle className="ml-2 font-bold">{isSuccess ? '¡Éxito!' : 'Error'}</AlertTitle>
                <AlertDescription className="ml-2 whitespace-nowrap">{message}</AlertDescription>
            </Alert>
        </div>
    );
}

interface Props {
    category: {
        id_product_category: number;
        name_product_category: string;
        status: string;
    };
}

export default function EditCategory({ category }: Props) {
    const { flash = {} } = usePage<FlashProps>().props;
    const [showSuccess, setShowSuccess] = useState(false);

    // NUEVO ESTADO PARA EL DIÁLOGO
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

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
        put,
        processing,
        errors,
        reset,
        clearErrors,
        isDirty,
    } = useForm({
        name_product_category: category.name_product_category,
        status: category.status,
    });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(categories.update({ category: category.id_product_category }).url, {
            onSuccess: () => setShowSuccess(true),
        });
    };

    // Función para EJECUTAR la eliminación
    const executeDelete = () => {
        router.delete(
            categories.destroy({ category: category.id_product_category }).url,
            {
                onFinish: () => setIsDeleteAlertOpen(false),
            }
        );
    };

    const breadcrumbs = [
        { title: 'Productos', href: products.index().url },
        { title: 'Categorías', href: categories.index().url },
        { title: data.name_product_category || 'Editar', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar ${category.name_product_category}`} />

            {/* --- COMPONENTE ALERT DIALOG --- */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar la categoría <strong>"{category.name_product_category}"</strong>.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {showSuccess && flash?.success && (
                <FloatingAlert message={flash.success} type="success" />
            )}

            <form onSubmit={submit} className="flex h-full flex-col bg-background">
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-semibold text-foreground/90 capitalize">
                            {category.name_product_category}
                        </span>

                        {/* Dropdown Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="h-5 w-5" />
                                    <span className="sr-only">Acciones</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteAlertOpen(true)} // ABRIMOS EL DIÁLOGO AQUÍ
                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {isDirty && (
                            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Sin guardar
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 transition-opacity duration-300">
                        <Button
                            variant="outline"
                            onClick={() => reset()}
                            disabled={!isDirty || processing}
                            type="button"
                            className={`border-muted-foreground/30 transition-all hover:bg-muted ${!isDirty ? 'cursor-not-allowed opacity-50' : 'opacity-100'}`}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Descartar
                        </Button>

                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={`min-w-[120px] font-medium text-white shadow-sm transition-all active:scale-95 ${!isDirty ? 'cursor-not-allowed bg-gray-400 opacity-50' : 'bg-blue-600 hover:bg-blue-700 hover:shadow dark:bg-blue-600 dark:hover:bg-blue-500'}`}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar
                        </Button>
                    </div>
                </div>

                {/* --- CONTENIDO PRINCIPAL --- */}
                <div className="w-full max-w-5xl animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <div className="mb-12 space-y-6 pt-2">
                        <div className="relative space-y-2">
                            <Label htmlFor="name_product_category" className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                Nombre de la Categoría
                            </Label>
                            <input
                                id="name_product_category"
                                value={data.name_product_category}
                                onChange={(e) => onFieldChange('name_product_category', e.target.value)}
                                placeholder="Ej. Lubricantes"
                                className={`h-auto w-full rounded-none border-0 border-b-2 bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight capitalize transition-all duration-300 placeholder:text-muted-foreground/20 focus:ring-0 focus:outline-none ${errors.name_product_category ? 'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500' : 'border-muted text-foreground focus:border-blue-600'}`}
                            />
                            <FloatingAlert message={errors.name_product_category} type="error" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                        <div className="space-y-8">
                            <div className="group space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Estado</Label>
                                <Select value={data.status} onValueChange={(val) => onFieldChange('status', val)}>
                                    <SelectTrigger className={`h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none transition-all focus:ring-0 ${errors.status ? 'border-red-500 focus:border-red-500' : 'border-muted focus:border-blue-600'}`}>
                                        <SelectValue placeholder="Seleccionar estado..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Activo</SelectItem>
                                        <SelectItem value="inactive">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-sm font-medium text-red-500">{errors.status}</p>}
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 p-6 text-sm text-muted-foreground">
                                <p>
                                    Editando la categoría ID: <strong>{category.id_product_category}</strong>.
                                    <br />
                                    Los cambios no se aplicarán hasta que presiones "Guardar".
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
