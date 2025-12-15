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
import AppLayout from '@/layouts/app-layout';
import suppliersRoute from '@/routes/suppliers';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    CreditCard,
    Loader2,
    Lock,
    Mail,
    MoreVertical,
    Phone,
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

export default function EditSupplier({ supplier }: Props) {
    const { flash = {} } = usePage<FlashProps>().props;

    // Estados para alertas
    const [showSuccess, setShowSuccess] = useState(false);
    const [manualAlert, setManualAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isSunatEditable, setIsSunatEditable] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // 1. Manejo de mensajes Flash (desde el servidor/Inertia)
    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    // 2. Manejo de alertas Manuales (desde el cliente/SUNAT)
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
        company_name: supplier.company_name,
        ruc: supplier.ruc,
        supplier_name: supplier.supplier_name || '',
        supplier_email: supplier.supplier_email || '',
        supplier_phone: supplier.supplier_phone || '',
    });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    // --- LÓGICA DE SINCRONIZACIÓN SUNAT ---
    const handleSunatSync = async () => {
        setIsSyncing(true);
        // Limpiamos alertas previas
        setManualAlert(null);

        try {
            // 1. Aquí iría tu llamada real a la API
            // const response = await axios.get(`/api/sunat/${data.ruc}`);

            // Simulación
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // 2. Dato simulado
            const simulatedNewName = 'NUEVA RAZÓN SOCIAL S.A.C.';

            // 3. Actualizamos y mostramos alerta
            if (simulatedNewName !== data.company_name) {
                setData('company_name', simulatedNewName);
                setManualAlert({ message: 'Datos actualizados desde SUNAT correctamente.', type: 'success' });
            } else {
                setManualAlert({ message: 'Los datos ya están actualizados.', type: 'success' });
            }

        } catch (error) {
            console.error(error);
            setManualAlert({ message: 'Error al conectar con SUNAT. Intente manualmente.', type: 'error' });
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
        { title: 'Compras', href: '#' },
        { title: 'Proveedores', href: suppliersRoute.index().url },
        { title: data.company_name || 'Editar', href: '' },
    ];

    const secondaryInputClass = (hasError: boolean, disabled: boolean) =>
        `h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none transition-all focus:ring-0 focus:outline-none ${
            disabled
                ? 'cursor-not-allowed border-dashed border-muted text-muted-foreground'
                : 'text-foreground placeholder:text-muted-foreground/40'
        } ${hasError ? 'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500' : disabled ? '' : 'border-muted focus:border-blue-600'}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
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

            {/* --- ALERTAS --- */}
            {/* 1. Alerta de Flash (Servidor) */}
            {showSuccess && flash?.success && (
                <FloatingAlert message={flash.success} type="success" />
            )}

            {/* 2. Alerta Manual (Cliente / SUNAT) */}
            {manualAlert && (
                <FloatingAlert message={manualAlert.message} type={manualAlert.type} />
            )}

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
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
                    {/* --- ZONA DE CONTROL (MANUAL VS AUTO) --- */}
                    <div className="mb-8 flex flex-col justify-between gap-4 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center">
                        {/* Checkbox Edición Manual */}
                        <div className="flex items-center space-x-2">
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
                                Habilitar edición manual
                            </Label>
                        </div>

                        {/* Botón Sincronizar (Recomendado) */}
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleSunatSync}
                            disabled={
                                isSyncing || !data.ruc || data.ruc.length !== 11
                            }
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60"
                        >
                            {isSyncing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Actualizar desde SUNAT
                        </Button>
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
                                {isSunatEditable ? (
                                    <Unlock className="h-3 w-3 animate-pulse text-orange-500" />
                                ) : (
                                    <Lock className="h-3 w-3 text-muted-foreground/50" />
                                )}
                            </div>
                            <input
                                id="company_name"
                                disabled={!isSunatEditable}
                                value={data.company_name}
                                onChange={(e) =>
                                    onFieldChange(
                                        'company_name',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                placeholder="EJ. INVERSIONES GENERALES S.A.C."
                                className={`h-auto w-full rounded-none border-0 border-b-2 bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight transition-all duration-300 focus:ring-0 focus:outline-none ${
                                    !isSunatEditable
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
                            <div className="relative space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <CreditCard className="h-3 w-3" />
                                    <Label>RUC (11 Dígitos)</Label>
                                </div>
                                <input
                                    value={data.ruc}
                                    maxLength={11}
                                    disabled={!isSunatEditable}
                                    onChange={(e) => {
                                        const val = e.target.value
                                            .replace(/\D/g, '')
                                            .slice(0, 11);
                                        onFieldChange('ruc', val);
                                    }}
                                    placeholder="20123456789"
                                    className={secondaryInputClass(
                                        !!errors.ruc,
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
                                    placeholder="Ej. Juan Pérez"
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

                            {/* NOTA DINÁMICA */}
                            <div
                                className={`mt-8 rounded-lg border p-6 text-sm transition-colors duration-300 ${isSunatEditable ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-gray-100 bg-gray-50/50 text-gray-900'}`}
                            >
                                <div className="flex gap-3">
                                    {isSunatEditable ? (
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                    ) : (
                                        <RefreshCw className="h-5 w-5 shrink-0" />
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
                                                : 'Recomendación: Si el proveedor actualizó su Razón Social en SUNAT, utiliza el botón "Actualizar desde SUNAT" para traer los datos oficiales sin riesgo de errores de escritura.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
