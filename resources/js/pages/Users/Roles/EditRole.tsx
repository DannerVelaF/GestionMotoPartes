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
import { Checkbox } from '@/components/ui/checkbox';
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
    CheckSquare,
    MoreVertical,
    RotateCcw,
    Save,
    Shield,
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

interface Permission {
    id_permission: number;
    name: string;
    label: string;
    module: string;
}

interface Role {
    id: number;
    name: string;
    label: string;
    description: string;
    users?: User[];
    permissions: Permission[];
}

interface Props {
    role: Role;
    allPermissions: Permission[];
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

export default function EditRole({ role, allPermissions }: Props) {
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
        permissions: role.permissions.map((p) => p.id_permission),
    });

    // Agrupar permisos por módulo
    const groupedPermissions = allPermissions.reduce(
        (acc, permission) => {
            const module = permission.module || 'Otros';
            if (!acc[module]) acc[module] = [];
            acc[module].push(permission);
            return acc;
        },
        {} as Record<string, Permission[]>,
    );

    // ✅ CORRECCIÓN 1: Usar Callback en setData para evitar el Infinite Loop
    const handlePermissionChange = (permissionId: number) => {
        setData((prevData) => {
            const isSelected = prevData.permissions.includes(permissionId);
            if (isSelected) {
                return {
                    ...prevData,
                    permissions: prevData.permissions.filter((id) => id !== permissionId),
                };
            } else {
                return {
                    ...prevData,
                    permissions: [...prevData.permissions, permissionId],
                };
            }
        });
    };

    // ✅ CORRECCIÓN 2: Callback en Seleccionar Todo para manejar el módulo completo de forma segura
    const handleSelectModule = (modulePerms: Permission[]) => {
        const moduleIds = modulePerms.map((p) => p.id_permission);

        setData((prevData) => {
            const allSelected = moduleIds.every((id) => prevData.permissions.includes(id));
            if (allSelected) {
                // Si están todos, desmarcamos el módulo
                return {
                    ...prevData,
                    permissions: prevData.permissions.filter((id) => !moduleIds.includes(id)),
                };
            } else {
                // Si faltan, los agregamos sin duplicar
                const newPerms = new Set([...prevData.permissions, ...moduleIds]);
                return {
                    ...prevData,
                    permissions: Array.from(newPerms),
                };
            }
        });
    };

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
            preserveScroll: true,
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
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el rol <strong>{role.label}</strong> permanentemente. Si
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

            <form onSubmit={submit} className="flex h-full flex-1 flex-col overflow-hidden bg-background text-foreground">
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-8 py-4 backdrop-blur shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-violet-600 p-2 text-white shadow-lg">
                            <Shield className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-semibold">{role.label}</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsDeleteAlertOpen(true)} className="font-bold text-red-600 cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Rol
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
                        <Button variant="ghost" type="button" onClick={() => reset()} disabled={!isDirty || processing}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={cn(
                                "px-6 font-bold transition-all",
                                isDirty ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-muted text-muted-foreground"
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                        </Button>
                    </div>
                </div>

                {/* --- CONTENIDO PRINCIPAL CON SCROLL GLOBAL --- */}
                <div className="flex-1 overflow-y-auto bg-muted/5 px-8 py-8 dark:bg-background custom-scrollbar">
                    <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 lg:grid-cols-3">

                        {/* COLUMNA IZQUIERDA: DATOS Y USUARIOS */}
                        <div className="flex flex-col gap-6 lg:col-span-1">
                            <Card className="shrink-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Datos Básicos</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold uppercase opacity-60">Identificador (Slug)</Label>
                                        <Input value={data.name} readOnly className="h-8 bg-muted/50 font-mono text-xs cursor-not-allowed border-dashed" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold uppercase opacity-60">Nombre Visible</Label>
                                        <Input value={data.label} onChange={(e) => onFieldChange('label', e.target.value)} className="h-9 focus-visible:ring-violet-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold uppercase opacity-60">Descripción</Label>
                                        <Textarea value={data.description} onChange={(e) => onFieldChange('description', e.target.value)} rows={3} className="resize-none text-sm focus-visible:ring-violet-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="flex flex-col border-l-4 border-l-violet-600 shadow-sm max-h-[400px]">
                                <CardHeader className="shrink-0 border-b bg-muted/10 pb-3">
                                    <CardTitle className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-violet-600" /> Usuarios
                                        </div>
                                        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                            {role.users?.length || 0}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                                    {role.users && role.users.length > 0 ? (
                                        <div className="divide-y">
                                            {role.users.map((user) => (
                                                <div key={user.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/30">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-violet-100 text-[10px] font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
                                                            {user.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
                                                        <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-center">
                                            <Users className="h-8 w-8 text-muted-foreground/20" />
                                            <p className="mt-2 text-xs text-muted-foreground italic">Sin usuarios asignados</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* COLUMNA DERECHA: MATRIZ DE PERMISOS CON SCROLL */}
                        <div className="lg:col-span-2">
                            <Card className="flex flex-col h-full max-h-[calc(100vh-180px)] shadow-md overflow-hidden">
                                <CardHeader className="shrink-0 border-b bg-muted/20 pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                                            <Shield className="h-5 w-5 text-violet-600" />
                                            CAPACIDADES DEL ROL
                                        </CardTitle>
                                        <div className="text-[11px] font-medium text-muted-foreground">
                                            <span className="font-bold text-violet-600">{data.permissions.length}</span> seleccionados
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                                    <div className="divide-y divide-border/60">
                                        {Object.entries(groupedPermissions).map(([module, perms]) => {
                                            // Verificar si todos los permisos de este módulo están seleccionados
                                            const isAllSelected = perms.every(p => data.permissions.includes(p.id_permission));

                                            return (
                                                <div key={module} className="group/module relative p-6">
                                                    {/* Header de Módulo Sticky con botón de Seleccionar Todo */}
                                                    <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-4 flex items-center justify-between bg-background/95 px-6 py-3 backdrop-blur border-b border-border/40 shadow-sm">
                                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">
                                                            {module}
                                                        </h3>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleSelectModule(perms)}
                                                            className="h-7 px-2 text-[10px] uppercase font-bold text-muted-foreground hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30"
                                                        >
                                                            {isAllSelected ? 'Desmarcar Módulo' : 'Seleccionar Todo'}
                                                            <CheckSquare className="ml-1.5 h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        {perms.map((permission) => (
                                                            <div
                                                                key={permission.id_permission}
                                                                className={cn(
                                                                    "flex items-start space-x-3 rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none",
                                                                    data.permissions.includes(permission.id_permission)
                                                                        ? "border-violet-300 bg-violet-50/50 shadow-sm dark:border-violet-900 dark:bg-violet-900/10"
                                                                        : "border-transparent bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/20"
                                                                )}
                                                                // 👇 SOLUCIÓN: Solo capturar el clic si el target es el contenedor
                                                                onClick={(e) => {
                                                                    if (e.target === e.currentTarget) {
                                                                        handlePermissionChange(permission.id_permission);
                                                                    }
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    id={`p-${permission.id_permission}`}
                                                                    checked={data.permissions.includes(permission.id_permission)}
                                                                    // 👇 Dejamos que el Checkbox haga su trabajo natural
                                                                    onCheckedChange={() => handlePermissionChange(permission.id_permission)}
                                                                    className="mt-1 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                                                                />
                                                                <div
                                                                    className="grid gap-1 leading-none"
                                                                    // 👇 Permitimos hacer clic en el texto para que active la lógica natural de React/HTML
                                                                    onClick={() => handlePermissionChange(permission.id_permission)}
                                                                >
                                                                    <label htmlFor={`p-${permission.id_permission}`} className="text-sm font-bold cursor-pointer pointer-events-none">
                                                                        {permission.label}
                                                                    </label>
                                                                    <p className="text-[10px] text-muted-foreground font-mono italic leading-relaxed pointer-events-none">
                                                                        {permission.name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
