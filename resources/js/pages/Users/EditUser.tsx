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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import users from '@/routes/users';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Copy,
    Fingerprint,
    Key,
    Mail,
    RefreshCcw,
    RotateCcw, // Importado para el botón descartar
    Save,
    User as UserIcon,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface Props {
    user: any;
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

export default function EditUser({ user, generated_password }: Props) {
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

    const copyPassword = () => {
        if (generated_password) {
            navigator.clipboard.writeText(generated_password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const lockedInputClasses =
        'h-10 rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none focus-visible:ring-0 text-muted-foreground/60 cursor-not-allowed border-muted/50 font-medium';

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
                            <RefreshCcw className="h-5 w-5 text-amber-600" />{' '}
                            ¿Restablecer contraseña?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Se generará una nueva clave temporal para{' '}
                            <strong>{user?.username}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeResetPassword}
                            className="bg-amber-600 hover:bg-amber-700"
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
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-black p-2 shadow-lg">
                            <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-semibold text-foreground/90">
                            Ficha de Usuario
                        </span>

                        {/* INDICADOR DE CAMBIOS SIN GUARDAR */}
                        {isDirty && (
                            <span className="ml-2 animate-pulse rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700 uppercase">
                                Sin guardar
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => window.history.back()}
                            disabled={processing}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                        </Button>

                        {/* BOTÓN DESCARTAR DINÁMICO */}
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => reset()}
                            disabled={!isDirty || processing}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>

                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={cn(
                                'px-6 font-bold shadow-sm transition-all',
                                isDirty
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                                    : 'cursor-not-allowed bg-muted text-muted-foreground',
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Actualizar Datos
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    {generated_password && (
                        <div className="mb-10 flex items-center justify-between rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-6 dark:bg-amber-950/20">
                            <div className="flex items-center gap-4">
                                <div className="rounded-full bg-amber-100 p-3">
                                    <Key className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-amber-800 uppercase">
                                        Clave temporal generada
                                    </p>
                                    <p className="mt-1 font-mono text-3xl font-bold text-amber-950">
                                        {generated_password}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={copyPassword}
                                variant="outline"
                                className="h-14 gap-2 border-amber-300 px-8 font-bold text-amber-900 hover:bg-amber-100"
                            >
                                {copied ? (
                                    <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                    <Copy className="h-5 w-5" />
                                )}{' '}
                                {copied ? 'Copiado' : 'Copiar Clave'}
                            </Button>
                        </div>
                    )}

                    {/* --- USERNAME EN GRANDE (BLOQUEADO) --- */}
                    <div className="mb-12 max-w-3xl">
                        <Label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            ID de Usuario (Username)
                        </Label>
                        <div className="flex items-center">
                            <span className="mr-2 text-4xl font-extrabold text-muted-foreground/20">
                                @
                            </span>
                            <input
                                readOnly
                                tabIndex={-1}
                                value={data.username}
                                className="h-auto w-full cursor-default border-0 border-b-2 border-muted bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight text-muted-foreground uppercase transition-all focus:ring-0 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                        <div className="space-y-8">
                            <div className="group space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">
                                    Nombres
                                </Label>
                                <Input
                                    readOnly
                                    tabIndex={-1}
                                    value={data.name}
                                    className={lockedInputClasses}
                                />
                            </div>

                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Fingerprint className="h-3 w-3" />{' '}
                                    Documento (DNI)
                                </Label>
                                <Input
                                    readOnly
                                    tabIndex={-1}
                                    value={data.dni}
                                    className={cn(
                                        lockedInputClasses,
                                        'font-mono tracking-widest',
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="group space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                                        Apellido Paterno
                                    </Label>
                                    <Input
                                        readOnly
                                        tabIndex={-1}
                                        value={data.father_last_name}
                                        className={lockedInputClasses}
                                    />
                                </div>
                                <div className="group space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                                        Apellido Materno
                                    </Label>
                                    <Input
                                        readOnly
                                        tabIndex={-1}
                                        value={data.mother_last_name}
                                        className={lockedInputClasses}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
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
                                    className="h-10 rounded-none border-0 border-b bg-transparent px-0 text-lg focus-visible:border-blue-600 focus-visible:ring-0"
                                />
                                {errors.email && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(c) =>
                                            onFieldChange('is_active', !!c)
                                        }
                                        className="h-5 w-5 data-[state=checked]:bg-black"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label
                                            htmlFor="is_active"
                                            className="cursor-pointer text-sm font-bold"
                                        >
                                            Cuenta Habilitada
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Permitir el acceso a la plataforma.
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t border-neutral-200 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIsResetAlertOpen(true)
                                        }
                                        className="w-full justify-start gap-2 border-red-100 font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
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
