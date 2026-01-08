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
import AppSidebarLayout from '@/layouts/app-layout';
import suppliersRoute from '@/routes/suppliers';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    CheckCircle2,
    CreditCard,
    Globe,
    Loader2,
    Mail,
    MapPin,
    MoreVertical,
    Phone,
    RefreshCw,
    RotateCcw,
    Save,
    Trash2,
    Truck,
    User,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface Props {
    supplier: {
        id_supplier: number;
        type?: 'nacional' | 'extranjero';
        company_name: string;
        ruc: string;
        supplier_name: string | null;
        supplier_email: string | null;
        supplier_phone: string | null;
    };
}

// --- ALERTA FLOTANTE FIJA EN LA ESQUINA ---
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
                variant={isSuccess ? 'default' : 'destructive'}
                className={`border-2 shadow-xl ${
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100'
                        : 'border-red-500 bg-white text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100'
                }`}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2 font-bold">
                    {isSuccess ? '¡Éxito!' : 'Atención'}
                </AlertTitle>
                <AlertDescription className="ml-2">{message}</AlertDescription>
            </Alert>
        </div>
    );
}

export default function EditSupplier({ supplier }: Props) {
    const { flash = {}, errors: serverErrors } = usePage<any>().props;

    const initialType =
        supplier.type ||
        (supplier.ruc.length === 11 && /^\d+$/.test(supplier.ruc)
            ? 'nacional'
            : 'extranjero');

    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [manualAlert, setManualAlert] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isSunatEditable, setIsSunatEditable] = useState(
        initialType === 'extranjero',
    );
    const [isSyncing, setIsSyncing] = useState(false);

    // Capturar Errores del Servidor (Validación o SQL)
    useEffect(() => {
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            const firstError =
                serverErrors.error || Object.values(serverErrors)[0];
            setErrorMessage(firstError as string);
            const timer = setTimeout(() => setErrorMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [serverErrors]);

    // Capturar Mensajes Flash de Éxito
    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 4000);
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

    useEffect(() => {
        if (data.type === 'extranjero') setIsSunatEditable(true);
        else setIsSunatEditable(false);
    }, [data.type]);

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const handleSunatSync = async () => {
        if (data.type !== 'nacional') return;
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
            if (response.data.razon_social) {
                setData('company_name', response.data.razon_social);
                setManualAlert({
                    message: 'Sincronizado con SUNAT.',
                    type: 'success',
                });
            }
        } catch (error: any) {
            setManualAlert({
                message: error.response?.data?.error || 'Error SUNAT',
                type: 'error',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(suppliersRoute.update({ supplier: supplier.id_supplier }).url);
    };

    const executeDelete = () => {
        router.delete(
            suppliersRoute.destroy({ supplier: supplier.id_supplier }).url,
            {
                onFinish: () => setIsDeleteAlertOpen(false),
            },
        );
    };

    const secondaryInputClass = (hasError: boolean, disabled: boolean) =>
        `h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none transition-all focus:ring-0 focus:outline-none ${disabled ? 'cursor-not-allowed border-dashed border-muted text-muted-foreground' : 'text-foreground'} ${hasError ? 'border-red-500 text-red-900' : 'border-muted focus:border-blue-600'}`;

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Proveedores', href: suppliersRoute.index().url },
                { title: 'Editar', href: '' },
            ]}
        >
            <Head title={`Editar ${supplier.company_name}`} />

            {/* ALERTAS FIJAS ARRIBA A LA DERECHA */}
            {showSuccess && flash?.success && (
                <FloatingAlert message={flash.success} type="success" />
            )}
            {errorMessage && (
                <FloatingAlert message={errorMessage} type="error" />
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
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-muted-foreground" />
                        <span className="max-w-md truncate text-xl font-semibold">
                            {data.company_name}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteAlertOpen(true)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => reset()}
                            disabled={!isDirty || processing}
                            type="button"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar
                        </Button>
                    </div>
                </div>

                <div className="w-full max-w-5xl animate-in px-8 py-8 duration-500 slide-in-from-bottom-4">
                    <div className="mb-8 flex gap-4">
                        <Button
                            type="button"
                            variant={
                                data.type === 'nacional' ? 'default' : 'outline'
                            }
                            onClick={() => setData('type', 'nacional')}
                            className={
                                data.type === 'nacional' ? 'bg-blue-600' : ''
                            }
                        >
                            <MapPin className="mr-2 h-4 w-4" /> Nacional
                        </Button>
                        <Button
                            type="button"
                            variant={
                                data.type === 'extranjero'
                                    ? 'default'
                                    : 'outline'
                            }
                            onClick={() => setData('type', 'extranjero')}
                            className={
                                data.type === 'extranjero'
                                    ? 'bg-amber-600 text-white'
                                    : ''
                            }
                        >
                            <Globe className="mr-2 h-4 w-4" /> Extranjero
                        </Button>
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
                                    className="cursor-pointer text-sm text-muted-foreground"
                                >
                                    Edición manual
                                </Label>
                            </div>
                        )}
                        {data.type === 'nacional' && (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleSunatSync}
                                disabled={isSyncing || data.ruc.length !== 11}
                                className="ml-auto bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                                {isSyncing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}{' '}
                                Actualizar SUNAT
                            </Button>
                        )}
                    </div>

                    <div className="mb-12 space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">
                            Razón Social
                        </Label>
                        <input
                            value={data.company_name}
                            disabled={
                                data.type === 'nacional' && !isSunatEditable
                            }
                            onChange={(e) =>
                                onFieldChange(
                                    'company_name',
                                    e.target.value.toUpperCase(),
                                )
                            }
                            className={
                                secondaryInputClass(
                                    !!errors.company_name,
                                    data.type === 'nacional' &&
                                        !isSunatEditable,
                                ) + ' text-4xl font-extrabold tracking-tight'
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-x-20 gap-y-12 md:grid-cols-2">
                        <div className="space-y-10">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <CreditCard className="h-3 w-3" />{' '}
                                    {data.type === 'nacional'
                                        ? 'RUC'
                                        : 'Tax ID'}
                                </Label>
                                <input
                                    value={data.ruc}
                                    disabled={
                                        data.type === 'nacional' &&
                                        !isSunatEditable
                                    }
                                    onChange={(e) =>
                                        onFieldChange(
                                            'ruc',
                                            data.type === 'nacional'
                                                ? e.target.value
                                                      .replace(/\D/g, '')
                                                      .slice(0, 11)
                                                : e.target.value,
                                        )
                                    }
                                    className={secondaryInputClass(
                                        !!errors.ruc,
                                        data.type === 'nacional' &&
                                            !isSunatEditable,
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <User className="h-3 w-3" /> Contacto
                                </Label>
                                <input
                                    value={data.supplier_name}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'supplier_name',
                                            e.target.value,
                                        )
                                    }
                                    className={secondaryInputClass(
                                        !!errors.supplier_name,
                                        false,
                                    )}
                                />
                            </div>
                        </div>
                        <div className="space-y-10">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Mail className="h-3 w-3" /> Email
                                </Label>
                                <input
                                    type="email"
                                    value={data.supplier_email}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'supplier_email',
                                            e.target.value,
                                        )
                                    }
                                    className={secondaryInputClass(
                                        !!errors.supplier_email,
                                        false,
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Phone className="h-3 w-3" /> Teléfono
                                </Label>
                                <input
                                    value={data.supplier_phone}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'supplier_phone',
                                            e.target.value,
                                        )
                                    }
                                    className={secondaryInputClass(
                                        !!errors.supplier_phone,
                                        false,
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

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
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-red-600 text-white"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppSidebarLayout>
    );
}
