import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import users from '@/routes/users';
import { Head, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Fingerprint,
    Info,
    Mail,
    Save,
    ShieldCheck,
    User as UserIcon,
} from 'lucide-react';
import { FormEventHandler } from 'react';

export default function CreateUser() {
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        username: '', // Ahora es el principal arriba
        name: '',
        father_last_name: '',
        mother_last_name: '',
        dni: '', // Campo añadido
        email: '',
        is_active: true,
    });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field as keyof typeof errors])
            clearErrors(field as keyof typeof errors);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(users.store().url);
    };

    const breadcrumbs = [
        { title: 'Usuarios', href: users.index().url },
        { title: 'Nuevo Registro', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Registrar Usuario" />

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-black p-2">
                            <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-semibold text-foreground/90">
                            Nuevo Usuario
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => window.history.back()}
                            disabled={processing}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar Usuario
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    {/* --- INPUT GIGANTE (USERNAME) --- */}
                    <div className="mb-12 max-w-3xl">
                        <Label className="text-xs font-bold tracking-wider text-muted-foreground ">
                            ID de Acceso (Username)
                        </Label>
                        <div className="flex items-center ">
                            <span className="mr-2 text-4xl font-extrabold text-muted-foreground/30 uppercase">
                                @
                            </span>
                            <input
                                autoFocus
                                value={data.username}
                                onChange={(e) =>
                                    onFieldChange('username', e.target.value)
                                }
                                placeholder="usuario..."
                                className={`h-auto w-full rounded-none border-0 border-b-2 bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight  transition-all focus:ring-0 focus:outline-none ${
                                    errors.username
                                        ? 'border-red-500 text-red-900'
                                        : 'border-muted text-foreground focus:border-blue-600'
                                }`}
                            />
                        </div>
                        {errors.username && (
                            <p className="mt-1 text-sm font-medium text-red-500">
                                {errors.username}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                        {/* COLUMNA IZQUIERDA: DATOS PERSONALES */}
                        <div className="space-y-8">
                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                    <Fingerprint className="h-3 w-3 uppercase" />{' '}
                                    Documento (DNI)
                                </Label>
                                <Input
                                    value={data.dni}
                                    maxLength={8}
                                    onChange={(e) =>
                                        onFieldChange('dni', e.target.value)
                                    }
                                    placeholder="8 dígitos"
                                    className="h-10 rounded-none border-0 border-b bg-transparent px-0 font-mono text-lg tracking-widest shadow-none focus-visible:border-blue-600 focus-visible:ring-0"
                                />
                                {errors.dni && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.dni}
                                    </p>
                                )}
                            </div>
                            <div className="group space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">
                                    Nombres
                                </Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) =>
                                        onFieldChange('name', e.target.value)
                                    }
                                    className="h-10 rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none focus-visible:border-blue-600 focus-visible:ring-0"
                                />
                                {errors.name && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="group space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                                        Apellido Paterno
                                    </Label>
                                    <Input
                                        value={data.father_last_name}
                                        onChange={(e) =>
                                            onFieldChange(
                                                'father_last_name',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none focus-visible:border-blue-600 focus-visible:ring-0"
                                    />
                                </div>
                                <div className="group space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                                        Apellido Materno
                                    </Label>
                                    <Input
                                        value={data.mother_last_name}
                                        onChange={(e) =>
                                            onFieldChange(
                                                'mother_last_name',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none focus-visible:border-blue-600 focus-visible:ring-0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: SISTEMA */}
                        <div className="space-y-8">
                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Mail className="h-3 w-3" /> Correo
                                    Electrónico
                                </Label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        onFieldChange('email', e.target.value)
                                    }
                                    placeholder="correo@ejemplo.com"
                                    className="h-10 rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none focus-visible:border-blue-600 focus-visible:ring-0"
                                />
                                {errors.email && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* NOTA SOBRE LA CONTRASEÑA */}
                            <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
                                        Seguridad Inicial
                                    </p>
                                    <p className="text-xs leading-relaxed text-blue-700/80 dark:text-blue-400/70">
                                        El sistema asignará una contraseña
                                        temporal que se mostrará al guardar. Se
                                        recomienda solicitar al usuario el
                                        cambio de clave tras su primer acceso.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/5 p-5 transition-colors hover:bg-muted/10">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        onFieldChange('is_active', !!checked)
                                    }
                                    className="h-5 w-5 border-muted-foreground/30 data-[state=checked]:bg-black"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="is_active"
                                        className="flex cursor-pointer items-center gap-2 text-sm font-bold"
                                    >
                                        Habilitar Acceso
                                        <ShieldCheck className="h-3 w-3 text-blue-600" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
