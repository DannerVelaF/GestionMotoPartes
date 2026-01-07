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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'; // Importamos Select
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import users from '@/routes/users';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Copy,
    Fingerprint,
    Key,
    Mail,
    RefreshCcw,
    RotateCcw,
    Save,
    Shield,
    User as UserIcon,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

// Definimos la interfaz del Rol
interface Role {
    id: number;
    label: string;
}

interface Props {
    user: any;
    roles: Role[]; // Recibimos la lista de roles
    generated_password?: string;
}

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
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100'
                        : 'border-red-500 bg-white text-red-900 dark:bg-red-950/90 dark:text-red-100'
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

export default function EditUser({
    user,
    roles = [],
    generated_password,
}: Props) {
    const { flash = {}, errors: serverErrors } = usePage<any>().props;
    const [showSuccess, setShowSuccess] = useState(false);
    const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        data,
        setData,
        put,
        processing,
        errors,
        clearErrors,
        isDirty,
        reset,
    } = useForm({
        username: user?.username || '',
        dni: user?.dni || '',
        name: user?.name || '',
        father_last_name: user?.father_last_name || '',
        mother_last_name: user?.mother_last_name || '',
        email: user?.email || '',
        role_id: user?.role_id ? String(user.role_id) : '', // Inicializamos el rol
        is_active: !!user?.is_active,
    });

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field as keyof typeof errors])
            clearErrors(field as keyof typeof errors);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(users.update({ user: user.id }).url);
    };

    const executeResetPassword = () => {
        router.put(
            users.resetPassword({ user: user.id }).url,
            {},
            {
                onFinish: () => setIsResetAlertOpen(false),
            },
        );
    };

    const copyPassword = async () => {
        if (!generated_password) return;

        try {
            // Intento 1: API Moderna (Funciona en HTTPS y Localhost)
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(generated_password);
            } else {
                // Intento 2: Método Fallback (Funciona en HTTP / Sitios no seguros)
                const textArea = document.createElement('textarea');
                textArea.value = generated_password;

                // Estilos para que el elemento no estorbe visualmente
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '0';

                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (!successful) {
                    throw new Error('El navegador bloqueó la acción de copiar');
                }
            }

            // Feedback visual de éxito
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error al copiar contraseña:', err);
            alert(
                'No se pudo copiar la contraseña automáticamente. Por favor, cópiala manualmente.',
            );
        }
    };

    const lockedInputClasses =
        'h-10 rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none focus-visible:ring-0 text-muted-foreground/60 cursor-not-allowed border-border font-medium';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Usuarios', href: users.index().url },
                { title: user?.username, href: '' },
            ]}
        >
            <Head title={`Editar: ${user?.username}`} />

            <AlertDialog
                open={isResetAlertOpen}
                onOpenChange={setIsResetAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <RefreshCcw className="h-5 w-5 text-amber-600 dark:text-amber-500" />{' '}
                            ¿Restablecer contraseña?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Se generará una nueva clave temporal para{' '}
                            <strong className="text-foreground">
                                {user?.username}
                            </strong>
                            .
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeResetPassword}
                            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-500"
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {showSuccess && flash?.success && (
                <FloatingAlert message={flash.success} type="success" />
            )}
            {Object.keys(serverErrors).length > 0 && (
                <FloatingAlert
                    message="Se encontraron errores en el formulario."
                    type="error"
                />
            )}

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background text-foreground"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary p-2 text-primary-foreground shadow-lg">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-semibold text-foreground">
                            Ficha de Usuario
                        </span>

                        {isDirty && (
                            <span className="ml-2 animate-pulse rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700 uppercase dark:bg-amber-900/50 dark:text-amber-400">
                                Sin guardar
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => reset()}
                            disabled={!isDirty || processing}
                            className="text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>

                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={cn(
                                'px-6 font-bold shadow-sm transition-all',
                                isDirty
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500'
                                    : 'cursor-not-allowed bg-muted text-muted-foreground',
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Actualizar Datos
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    {generated_password && (
                        <div className="mb-10 flex items-center justify-between rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-6 dark:border-amber-800/50 dark:bg-amber-950/20">
                            <div className="flex items-center gap-4">
                                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/40">
                                    <Key className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-amber-800 uppercase dark:text-amber-400">
                                        Clave temporal generada
                                    </p>
                                    <p className="mt-1 font-mono text-3xl font-bold text-amber-950 dark:text-amber-100">
                                        {generated_password}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={copyPassword}
                                variant="outline"
                                className="h-14 gap-2 border-amber-300 px-8 font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-transparent dark:text-amber-400 dark:hover:bg-amber-900/20"
                            >
                                {copied ? (
                                    <Check className="h-5 w-5 text-green-600 dark:text-green-500" />
                                ) : (
                                    <Copy className="h-5 w-5" />
                                )}{' '}
                                {copied ? 'Copiado' : 'Copiar Clave'}
                            </Button>
                        </div>
                    )}

                    <div className="mb-12 max-w-3xl">
                        <Label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            ID de Usuario (Username)
                        </Label>
                        <div className="flex items-center">
                            <span className="mr-2 text-4xl font-extrabold text-muted-foreground/20 uppercase">
                                @
                            </span>
                            <input
                                readOnly
                                tabIndex={-1}
                                value={data.username}
                                className="h-auto w-full cursor-default border-0 border-b-2 border-border bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight text-muted-foreground uppercase transition-all focus:ring-0 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                        {/* COLUMNA IZQUIERDA: DATOS PERSONALES */}
                        <div className="space-y-8">
                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Fingerprint className="h-3 w-3" />{' '}
                                    Documento (DNI)
                                </Label>
                                <Input
                                    tabIndex={-1}
                                    value={data.dni}
                                    onChange={(e) =>
                                        onFieldChange('dni', e.target.value)
                                    }
                                    className="h-10 rounded-none border-0 border-b border-input bg-transparent px-0 text-lg text-foreground focus-visible:border-blue-600 focus-visible:ring-0"
                                />
                            </div>
                            <div className="group space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">
                                    Nombres
                                </Label>
                                <Input
                                    tabIndex={-1}
                                    value={data.name}
                                    onChange={(e) =>
                                        onFieldChange('name', e.target.value)
                                    }
                                    className="h-10 rounded-none border-0 border-b border-input bg-transparent px-0 text-lg text-foreground focus-visible:border-blue-600 focus-visible:ring-0"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="group space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                                        Apellido Paterno
                                    </Label>
                                    <Input
                                        tabIndex={-1}
                                        value={data.father_last_name}
                                        onChange={(e) =>
                                            onFieldChange(
                                                'father_last_name',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-none border-0 border-b border-input bg-transparent px-0 text-lg text-foreground focus-visible:border-blue-600 focus-visible:ring-0"
                                    />
                                </div>
                                <div className="group space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                                        Apellido Materno
                                    </Label>
                                    <Input
                                        tabIndex={-1}
                                        value={data.mother_last_name}
                                        onChange={(e) =>
                                            onFieldChange(
                                                'mother_last_name',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-none border-0 border-b border-input bg-transparent px-0 text-lg text-foreground focus-visible:border-blue-600 focus-visible:ring-0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: SISTEMA */}
                        <div className="space-y-8">
                            {/* --- SELECTOR DE ROL (NUEVO) --- */}
                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Shield className="h-3 w-3" /> Rol Asignado
                                </Label>
                                <Select
                                    value={data.role_id}
                                    onValueChange={(val) =>
                                        onFieldChange('role_id', val)
                                    }
                                >
                                    <SelectTrigger className="h-10 rounded-none border-0 border-b border-input bg-transparent px-0 text-lg text-foreground shadow-none focus:border-blue-600 focus:ring-0">
                                        <SelectValue placeholder="Seleccionar Rol..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem
                                                key={role.id}
                                                value={String(role.id)}
                                            >
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role_id && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.role_id}
                                    </p>
                                )}
                            </div>

                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Mail className="h-3 w-3" /> Correo
                                    electrónico
                                </Label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        onFieldChange('email', e.target.value)
                                    }
                                    className="h-10 rounded-none border-0 border-b border-input bg-transparent px-0 text-lg text-foreground focus-visible:border-blue-600 focus-visible:ring-0"
                                />
                                {errors.email && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-6 rounded-2xl border border-border bg-muted/30 p-6 dark:bg-card">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(c) =>
                                            onFieldChange('is_active', !!c)
                                        }
                                        className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label
                                            htmlFor="is_active"
                                            className="cursor-pointer text-sm font-bold text-foreground"
                                        >
                                            Cuenta Habilitada
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Permitir el acceso a la plataforma.
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t border-border pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIsResetAlertOpen(true)
                                        }
                                        className="w-full justify-start gap-2 border-red-200 font-bold text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30"
                                    >
                                        <RefreshCcw className="h-4 w-4" />{' '}
                                        Resetear Password Temporal
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
