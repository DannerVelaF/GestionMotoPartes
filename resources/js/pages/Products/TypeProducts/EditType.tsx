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
import types from '@/routes/product-types'; // Asegúrate de tener este Wayfinder
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

// --- TIPOS ---
interface FlashProps {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: any;
}

interface Props {
    type: {
        id_product_type: number;
        name_product_type: string;
        status: string;
    };
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
        <div
            className={`z-50 animate-in fade-in slide-in-from-top-2 ${
                isSuccess
                    ? 'fixed top-6 right-6 w-auto max-w-md'
                    : 'absolute top-full left-0 mt-2 w-fit max-w-full'
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
                <AlertDescription className="ml-2 whitespace-nowrap">
                    {message}
                </AlertDescription>
            </Alert>
        </div>
    );
}

export default function EditType({ type }: Props) {
    // 1. Flash Messages
    const { flash = {} } = usePage<FlashProps>().props;
    const [showSuccess, setShowSuccess] = useState(false);

    // 2. Estado para el Dialogo de Eliminar
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    // 3. Formulario Inertia
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
        name_product_type: type.name_product_type,
        status: type.status,
    });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    // Actualizar Tipo
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(types.update({ type: type.id_product_type }).url, {
            onSuccess: () => setShowSuccess(true),
        });
    };

    // Eliminar Tipo
    const executeDelete = () => {
        router.delete(types.destroy({ type: type.id_product_type }).url, {
            onFinish: () => setIsDeleteAlertOpen(false),
        });
    };

    const breadcrumbs = [
        { title: 'Productos', href: products.index().url },
        { title: 'Tipos de Producto', href: types.index().url },
        { title: data.name_product_type || 'Editar', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar ${type.name_product_type}`} />

            {/* --- DIÁLOGO DE CONFIRMACIÓN --- */}
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Eliminar tipo de producto?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar el tipo{' '}
                            <strong>"{type.name_product_type}"</strong>. Esta
                            acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- ALERTA DE ÉXITO GLOBAL --- */}
            {showSuccess && flash?.success && (
                <FloatingAlert message={flash.success} type="success" />
            )}

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-semibold text-foreground/90 capitalize">
                            {type.name_product_type}
                        </span>

                        {/* Menú de Acciones */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                    <MoreVertical className="h-5 w-5" />
                                    <span className="sr-only">Acciones</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteAlertOpen(true)}
                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Badge de Cambios sin guardar */}
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
                            className={`border-muted-foreground/30 transition-all hover:bg-muted ${
                                !isDirty
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'opacity-100'
                            }`}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Descartar
                        </Button>

                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={`min-w-[120px] font-medium text-white shadow-sm transition-all active:scale-95 ${
                                !isDirty
                                    ? 'cursor-not-allowed bg-gray-400 opacity-50'
                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow dark:bg-blue-600 dark:hover:bg-blue-500'
                            }`}
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
                                htmlFor="name_product_type"
                                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                            >
                                Nombre del Tipo
                            </Label>
                            <input
                                id="name_product_type"
                                value={data.name_product_type}
                                onChange={(e) =>
                                    onFieldChange(
                                        'name_product_type',
                                        e.target.value,
                                    )
                                }
                                placeholder="Ej. Repuesto, Insumo, Servicio..."
                                className={`h-auto w-full rounded-none border-0 border-b-2 bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight capitalize transition-all duration-300 placeholder:text-muted-foreground/20 focus:ring-0 focus:outline-none ${
                                    errors.name_product_type
                                        ? 'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500'
                                        : 'border-muted text-foreground focus:border-blue-600'
                                }`}
                            />
                            {/* Alerta de Error de Campo */}
                            <FloatingAlert
                                message={errors.name_product_type}
                                type="error"
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
                                    Editando el tipo de producto ID:{' '}
                                    <strong>{type.id_product_type}</strong>.
                                    <br />
                                    Los cambios no se aplicarán hasta que
                                    presiones "Guardar".
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
