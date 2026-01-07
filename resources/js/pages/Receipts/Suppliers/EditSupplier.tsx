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
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import AppSidebarLayout from '@/layouts/app-layout'; // Asegúrate de que este path sea correcto
import receipts from '@/routes/receipts';
import suppliersRoute from '@/routes/suppliers';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    CheckCircle2,
    CreditCard,
    Globe, // Icono para extranjero
    Loader2,
    Lock,
    Mail,
    MapPin, // Icono para nacional
    MoreVertical,
    Phone,
    Plus,
    RefreshCw,
    RotateCcw,
    Save,
    Trash2,
    Truck,
    Unlock,
    User,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

// --- INTERFACES ---
interface FlashProps {
    flash?: { success?: string; error?: string };
    [key: string]: any;
}

interface Props {
    supplier: {
        id_supplier: number;
        type?: 'nacional' | 'extranjero'; // Si tu backend ya lo manda, úsalo. Si no, lo inferimos.
        company_name: string;
        ruc: string;
        supplier_name: string | null;
        supplier_email: string | null;
        supplier_phone: string | null;
    };
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
            className={`z-50 animate-in fade-in slide-in-from-top-2 ${isSuccess ? 'fixed top-6 right-6 w-auto max-w-md' : 'absolute top-full left-0 mt-1 w-full'}`}
        >
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={`border-2 shadow-xl ${isSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100' : 'bg-white dark:bg-slate-900'}`}
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

export default function EditSupplier({ supplier }: Props) {
    const { flash = {} } = usePage<FlashProps>().props;

    // Inferir tipo si no viene del backend (solo para compatibilidad, idealmente migra tu DB)
    const initialType =
        supplier.type ||
        (supplier.ruc.length === 11 && /^\d+$/.test(supplier.ruc)
            ? 'nacional'
            : 'extranjero');

    const [showSuccess, setShowSuccess] = useState(false);
    const [manualAlert, setManualAlert] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    // Solo bloqueamos por defecto si es Nacional. Extranjeros siempre son editables.
    const [isSunatEditable, setIsSunatEditable] = useState(
        initialType === 'extranjero',
    );
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    useEffect(() => {
        if (manualAlert) {
            const timer = setTimeout(() => setManualAlert(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [manualAlert]);

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
        type: initialType,
        company_name: supplier.company_name,
        ruc: supplier.ruc,
        supplier_name: supplier.supplier_name || '',
        supplier_email: supplier.supplier_email || '',
        supplier_phone: supplier.supplier_phone || '',
    });

    // Efecto para controlar la editabilidad al cambiar el tipo
    useEffect(() => {
        if (data.type === 'extranjero') {
            setIsSunatEditable(true);
        } else {
            // Si vuelve a nacional, bloqueamos por seguridad (salvo que el usuario lo desbloquee explícitamente)
            setIsSunatEditable(false);
        }
    }, [data.type]);

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const handleSunatSync = async () => {
        if (data.type !== 'nacional') return; // Solo nacionales sincronizan

        if (!data.ruc || data.ruc.length !== 11) {
            setManualAlert({
                message: 'Ingrese un RUC válido de 11 dígitos.',
                type: 'error',
            });
            return;
        }

        setIsSyncing(true);
        setManualAlert(null);

        try {
            const response = await axios.get(suppliersRoute.buscarSunat().url, {
                params: { numero: data.ruc },
            });
            const newName = response.data.razon_social;

            if (newName && newName !== 'No encontrado') {
                setData('company_name', newName);
                setManualAlert({
                    message: 'Datos actualizados desde SUNAT correctamente.',
                    type: 'success',
                });
            } else {
                setManualAlert({
                    message: 'No se encontró información para este RUC.',
                    type: 'error',
                });
            }
        } catch (error: any) {
            console.error('Error SUNAT:', error);
            const errorMsg =
                error.response?.data?.error ||
                'Error al conectar con el servicio de SUNAT.';
            setManualAlert({ message: errorMsg, type: 'error' });
        } finally {
            setIsSyncing(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(suppliersRoute.update({ supplier: supplier.id_supplier }).url, {
            onSuccess: () => setShowSuccess(true),
        });
    };

    const executeDelete = () => {
        router.delete(
            suppliersRoute.destroy({ supplier: supplier.id_supplier }).url,
            {
                onFinish: () => setIsDeleteAlertOpen(false),
            },
        );
    };

    const breadcrumbs = [
        { title: 'Comprobantes', href: receipts.index().url },
        { title: 'Proveedores', href: suppliersRoute.index().url },
        { title: data.company_name || 'Editar', href: '' },
    ];

    const secondaryInputClass = (hasError: boolean, disabled: boolean) =>
        `h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none transition-all focus:ring-0 focus:outline-none ${disabled ? 'cursor-not-allowed border-dashed border-muted text-muted-foreground' : 'text-foreground placeholder:text-muted-foreground/40'} ${hasError ? 'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500' : disabled ? '' : 'border-muted focus:border-blue-600'}`;

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar ${supplier.company_name}`} />

            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Eliminar proveedor?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar{' '}
                            <strong>"{supplier.company_name}"</strong>. Esta
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

            {showSuccess && flash?.success && (
                <FloatingAlert message={flash.success} type="success" />
            )}
            {manualAlert && (
                <FloatingAlert
                    message={manualAlert.message}
                    type={manualAlert.type}
                />
            )}

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <Button
                            type={'button'}
                            className="bg-blue-700 font-medium text-white shadow-sm hover:bg-blue-800"
                            onClick={() =>
                                router.visit(suppliersRoute.create().url)
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo
                        </Button>
                        <Truck className="h-6 w-6 text-muted-foreground" />
                        <span className="max-w-md truncate text-xl font-semibold text-foreground/90">
                            {supplier.company_name}
                        </span>
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
                                    onClick={() => setIsDeleteAlertOpen(true)}
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

                <div className="w-full max-w-5xl animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    {/* --- ZONA DE CONTROL (TIPO Y SUNAT) --- */}
                    <div className="mb-8 flex flex-col justify-between gap-4 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-6">
                            {/* Selector de Tipo */}
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant={
                                        data.type === 'nacional'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setData('type', 'nacional')}
                                    className={
                                        data.type === 'nacional'
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : ''
                                    }
                                >
                                    <MapPin className="mr-2 h-3.5 w-3.5" />{' '}
                                    Nacional
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        data.type === 'extranjero'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() =>
                                        setData('type', 'extranjero')
                                    }
                                    className={
                                        data.type === 'extranjero'
                                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                                            : ''
                                    }
                                >
                                    <Globe className="mr-2 h-3.5 w-3.5" />{' '}
                                    Extranjero
                                </Button>
                            </div>

                            {/* Checkbox solo visible si es Nacional */}
                            {data.type === 'nacional' && (
                                <div className="flex items-center space-x-2 border-l pl-6">
                                    <Checkbox
                                        id="edit-sunat"
                                        checked={isSunatEditable}
                                        onCheckedChange={(checked) =>
                                            setIsSunatEditable(!!checked)
                                        }
                                    />
                                    <Label
                                        htmlFor="edit-sunat"
                                        className="cursor-pointer text-sm font-medium text-muted-foreground"
                                    >
                                        Edición manual
                                    </Label>
                                </div>
                            )}
                        </div>

                        {/* Botón Sincronizar (Solo Nacionales) */}
                        {data.type === 'nacional' && (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleSunatSync}
                                disabled={
                                    isSyncing ||
                                    !data.ruc ||
                                    data.ruc.length !== 11
                                }
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200"
                            >
                                {isSyncing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Actualizar SUNAT
                            </Button>
                        )}
                    </div>

                    {/* 1. INPUT GIGANTE: RAZÓN SOCIAL */}
                    <div className="mb-12 space-y-6 pt-2">
                        <div className="relative space-y-2">
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="company_name"
                                    className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                                >
                                    Razón Social (Empresa)
                                </Label>
                                {data.type === 'nacional' &&
                                    (isSunatEditable ? (
                                        <Unlock className="h-3 w-3 animate-pulse text-orange-500" />
                                    ) : (
                                        <Lock className="h-3 w-3 text-muted-foreground/50" />
                                    ))}
                            </div>
                            <input
                                id="company_name"
                                // Deshabilitado SOLO si es nacional Y no está en modo editable
                                disabled={
                                    data.type === 'nacional' && !isSunatEditable
                                }
                                value={data.company_name}
                                onChange={(e) =>
                                    onFieldChange(
                                        'company_name',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                placeholder={
                                    data.type === 'nacional'
                                        ? 'EJ. INVERSIONES S.A.C.'
                                        : 'EJ. DIGITALOCEAN, LLC'
                                }
                                className={`h-auto w-full rounded-none border-0 border-b-2 bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight transition-all duration-300 focus:ring-0 focus:outline-none ${
                                    data.type === 'nacional' && !isSunatEditable
                                        ? 'cursor-not-allowed border-dashed border-muted text-muted-foreground/70'
                                        : 'border-muted text-foreground placeholder:text-muted-foreground/20 focus:border-blue-600'
                                } ${errors.company_name ? 'border-red-500 text-red-900 focus:border-red-500' : ''}`}
                            />
                            <FloatingAlert message={errors.company_name} />
                        </div>
                    </div>

                    {/* 2. GRILLA DE DETALLES */}
                    <div className="grid grid-cols-1 gap-x-20 gap-y-12 md:grid-cols-2">
                        <div className="space-y-10">
                            {/* RUC / TAX ID */}
                            <div className="relative space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <CreditCard className="h-3 w-3" />
                                    <Label>
                                        {data.type === 'nacional'
                                            ? 'RUC (11 Dígitos)'
                                            : 'Tax ID / ID Fiscal'}
                                    </Label>
                                </div>
                                <input
                                    value={data.ruc}
                                    maxLength={
                                        data.type === 'nacional' ? 11 : 25
                                    }
                                    disabled={
                                        data.type === 'nacional' &&
                                        !isSunatEditable
                                    }
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (data.type === 'nacional') {
                                            val = val
                                                .replace(/\D/g, '')
                                                .slice(0, 11);
                                        } else {
                                            val = val.slice(0, 25);
                                        }
                                        onFieldChange('ruc', val);
                                    }}
                                    placeholder={
                                        data.type === 'nacional'
                                            ? '20123456789'
                                            : '27-0653600'
                                    }
                                    className={secondaryInputClass(
                                        !!errors.ruc,
                                        data.type === 'nacional' &&
                                            !isSunatEditable,
                                    )}
                                />
                                <FloatingAlert message={errors.ruc} />
                            </div>

                            <div className="relative space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <User className="h-3 w-3" />
                                    <Label>Persona de Contacto</Label>
                                </div>
                                <input
                                    value={data.supplier_name}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'supplier_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ej. Juan Pérez / Soporte"
                                    className={secondaryInputClass(
                                        !!errors.supplier_name,
                                        false,
                                    )}
                                />
                                <FloatingAlert message={errors.supplier_name} />
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="relative space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Mail className="h-3 w-3" />
                                    <Label>Correo Electrónico</Label>
                                </div>
                                <input
                                    type="email"
                                    value={data.supplier_email}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'supplier_email',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="contacto@empresa.com"
                                    className={secondaryInputClass(
                                        !!errors.supplier_email,
                                        false,
                                    )}
                                />
                                <FloatingAlert
                                    message={errors.supplier_email}
                                />
                            </div>

                            <div className="relative space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Phone className="h-3 w-3" />
                                    <Label>Teléfono / Celular</Label>
                                </div>
                                <input
                                    value={data.supplier_phone}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'supplier_phone',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="999 000 000"
                                    className={secondaryInputClass(
                                        !!errors.supplier_phone,
                                        false,
                                    )}
                                />
                                <FloatingAlert
                                    message={errors.supplier_phone}
                                />
                            </div>

                            {/* NOTA DINÁMICA CONDICIONAL */}
                            {data.type === 'nacional' ? (
                                <div
                                    className={`mt-8 rounded-lg border p-6 text-sm transition-colors duration-300 ${
                                        isSunatEditable
                                            ? 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-300'
                                            : 'border-blue-100 bg-blue-50/50 text-blue-900 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-300'
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        {isSunatEditable ? (
                                            <AlertCircle className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                                        ) : (
                                            <RefreshCw className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                                        )}
                                        <div className="space-y-1">
                                            <p className="font-semibold">
                                                {isSunatEditable
                                                    ? 'Edición Manual Habilitada'
                                                    : 'Sincronización Inteligente'}
                                            </p>
                                            <p className="leading-relaxed opacity-90">
                                                {isSunatEditable
                                                    ? 'Advertencia: Estás editando datos fiscales manualmente. Asegúrate de que coincidan con la ficha RUC.'
                                                    : 'Los datos están protegidos y sincronizados con SUNAT para evitar errores.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50/50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                                    <div className="flex gap-3">
                                        <Globe className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <div className="space-y-1">
                                            <p className="font-semibold">
                                                Proveedor Internacional
                                            </p>
                                            <p className="leading-relaxed opacity-90">
                                                Al ser un proveedor extranjero,
                                                la validación con SUNAT no está
                                                disponible. Asegúrate de
                                                ingresar correctamente el Tax ID
                                                del Invoice.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </AppSidebarLayout>
    );
}
