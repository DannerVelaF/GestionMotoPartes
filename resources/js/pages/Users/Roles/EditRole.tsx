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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import roles from '@/routes/roles';
import users from '@/routes/users';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    MoreVertical,
    RotateCcw,
    Save,
    Shield,
    Tag,
    Text,
    Trash2,
    Users,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

// --- INTERFACES ---
interface FlashProps {
    flash?: { success?: string; error?: string };
    [key: string]: any;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Role {
    id: number;
    name: string;
    label: string;
    description: string;
    users?: User[];
}

interface Props {
    role: Role;
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
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
            <Alert
                className={cn(
                    'border-2 shadow-xl',
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-neutral-900 dark:text-emerald-400'
                        : 'border-red-500 bg-white text-red-900 dark:bg-neutral-900 dark:text-red-400',
                )}
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

export default function EditRole({ role }: Props) {
    const { flash = {} } = usePage<FlashProps>().props;
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const {
        data,
        setData,
        put,
        delete: destroy,
        processing,
        errors,
        clearErrors,
        isDirty,
        reset,
    } = useForm({
        name: role.name,
        label: role.label,
        description: role.description || '',
    });

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
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
        put(roles.update({ role: role.id }).url, {
            onSuccess: () => setShowSuccess(true),
        });
    };

    const handleDelete = () => {
        destroy(roles.destroy({ role: role.id }).url);
    };

    const breadcrumbs = [
        { title: 'Usuarios', href: users.index().url },
        { title: 'Roles', href: roles.index().url },
        { title: role.label, href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar ${role.label}`} />
            <FloatingAlert
                message={flash.success || flash.error}
                type={flash.success ? 'success' : 'error'}
            />

            {/* --- MODAL DE ELIMINACIÓN --- */}
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Estás absolutamente seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el rol{' '}
                            <strong>{role.label}</strong> permanentemente. Si
                            hay usuarios asignados, la operación podría fallar o
                            dejar usuarios sin acceso.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:text-white"
                        >
                            Sí, eliminar rol
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <form
                onSubmit={submit}
                className="flex h-full flex-1 flex-col overflow-hidden bg-background text-foreground"
            >
                {/* --- HEADER STICKY CON MENÚ DE OPCIONES --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-violet-600 p-2 text-white shadow-lg shadow-violet-500/20">
                            <Shield className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-semibold text-foreground">
                            {role.label}
                        </span>
                        {/* Menú de Opciones (Eliminar) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteAlertOpen(true)}
                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/20 dark:focus:text-red-300"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Rol
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {isDirty && (
                            <span className="ml-2 animate-pulse rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700 uppercase dark:bg-amber-900/50 dark:text-amber-400">
                                Sin guardar
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Botón Descartar */}
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => reset()}
                            disabled={!isDirty || processing}
                            className="text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>

                        {/* Botón Guardar */}
                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={cn(
                                'px-6 font-bold shadow-sm transition-all',
                                isDirty
                                    ? 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95 dark:bg-violet-600 dark:hover:bg-violet-500'
                                    : 'cursor-not-allowed bg-muted text-muted-foreground',
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                        </Button>

                        {/* Separador */}
                        <div className="mx-1 h-6 w-px bg-border" />
                    </div>
                </div>

                <div className="w-full flex-1 overflow-auto bg-muted/5 px-8 py-8 dark:bg-background">
                    <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                        {/* COLUMNA IZQUIERDA: FORMULARIO */}
                        <div className="space-y-8">
                            {/* Slug (Name) */}
                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                    Identificador Único (Slug)
                                </Label>
                                <div className="flex items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                                    <span className="mr-2 text-lg font-bold text-muted-foreground">
                                        #
                                    </span>
                                    <input
                                        value={data.name}
                                        onChange={(e) =>
                                            onFieldChange(
                                                'name',
                                                e.target.value
                                                    .toLowerCase()
                                                    .replace(/\s+/g, '_'),
                                            )
                                        }
                                        className="flex-1 bg-transparent p-0 font-mono text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Label */}
                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Tag className="h-3 w-3" /> Nombre Visible
                                </Label>
                                <Input
                                    value={data.label}
                                    onChange={(e) =>
                                        onFieldChange('label', e.target.value)
                                    }
                                    className="h-12 border-muted-foreground/20 text-lg shadow-sm focus-visible:border-violet-600 focus-visible:ring-0"
                                />
                                {errors.label && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.label}
                                    </p>
                                )}
                            </div>

                            {/* Descripción */}
                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Text className="h-3 w-3" /> Descripción
                                </Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    className="min-h-[120px] resize-none rounded-xl border-2 border-muted bg-muted/20 p-4 text-base focus-visible:border-violet-600 focus-visible:ring-0"
                                />
                                {errors.description && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: USUARIOS ASIGNADOS */}
                        <div className="space-y-6">
                            <Card className="border-l-4 border-l-violet-600 bg-card shadow-sm dark:bg-neutral-900/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-widest text-muted-foreground uppercase">
                                        <Users className="h-4 w-4 text-violet-600" />
                                        Usuarios con este Rol
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {role.users && role.users.length > 0 ? (
                                        role.users.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
                                                        {user.name
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="truncate text-sm font-bold text-foreground">
                                                        {user.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground italic">
                                            No hay usuarios asignados a este
                                            rol.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
