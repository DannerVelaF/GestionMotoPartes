import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Asegúrate de tener este componente
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import roles from '@/routes/roles'; // Asumo que tienes esta ruta definida
import users from '@/routes/users';
import { Head, useForm } from '@inertiajs/react';
import { RotateCcw, Save, Shield, Tag, Text } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function CreateRole() {
    // 1. Configuración del formulario
    const {
        data,
        setData,
        post,
        processing,
        errors,
        clearErrors,
        isDirty,
        reset,
    } = useForm({
        name: '', // Identificador interno (ej: admin)
        label: '', // Nombre visible (ej: Administrador)
        description: '',
    });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field as keyof typeof errors])
            clearErrors(field as keyof typeof errors);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(roles.store().url);
    };

    // 2. Configuración del Wayfinder (Breadcrumbs)
    const breadcrumbs = [
        { title: 'Usuarios', href: users.index().url },
        { title: 'Roles', href: roles.index().url },
        { title: 'Nuevo Rol', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Rol" />

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background text-foreground"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-violet-600 p-2 text-white shadow-lg shadow-violet-500/20">
                            <Shield className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-semibold text-foreground">
                            Nuevo Rol de Sistema
                        </span>

                        {/* Indicador de cambios */}
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
                                    ? 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95 dark:bg-violet-600 dark:hover:bg-violet-500'
                                    : 'cursor-not-allowed bg-muted text-muted-foreground',
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar Rol
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    {/* --- INPUT GIGANTE (SLUG/NAME) --- */}
                    <div className="mb-12 max-w-3xl">
                        <Label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            Identificador Único (Slug)
                        </Label>
                        <div className="flex items-center">
                            <span className="mr-2 text-4xl font-extrabold text-muted-foreground/30">
                                #
                            </span>
                            <input
                                autoFocus
                                value={data.name}
                                onChange={(e) =>
                                    onFieldChange(
                                        'name',
                                        e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, '_'), // Forzar formato slug
                                    )
                                }
                                placeholder="ej_administrador"
                                className={`h-auto w-full rounded-none border-0 border-b-2 bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight transition-all placeholder:text-muted-foreground/40 focus:ring-0 focus:outline-none ${
                                    errors.name
                                        ? 'border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-muted-foreground/20 text-foreground focus:border-violet-600 dark:focus:border-violet-500'
                                }`}
                            />
                        </div>
                        {errors.name ? (
                            <p className="mt-1 text-sm font-medium text-red-500">
                                {errors.name}
                            </p>
                        ) : (
                            <p className="mt-2 text-xs text-muted-foreground">
                                Se usa internamente en el código (ej:{' '}
                                <code>if (user.hasRole('admin'))</code>).
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                        {/* COLUMNA IZQUIERDA: DETALLES VISIBLES */}
                        <div className="space-y-8">
                            {/* Label */}
                            <div className="group space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Tag className="h-3 w-3" /> Nombre Visible
                                    (Label)
                                </Label>
                                <Input
                                    value={data.label}
                                    onChange={(e) =>
                                        onFieldChange('label', e.target.value)
                                    }
                                    placeholder="Ej: Administrador General"
                                    className="h-12 rounded-none border-0 border-b border-foreground/20 bg-transparent px-0 text-lg text-foreground shadow-none placeholder:text-muted-foreground/50 focus-visible:border-violet-600 focus-visible:ring-0"
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
                                    placeholder="Describe brevemente el alcance de este rol..."
                                    className="min-h-[120px] resize-none rounded-xl border-2 border-muted bg-muted/20 p-4 text-base focus-visible:border-violet-600 focus-visible:ring-0"
                                />
                                {errors.description && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
