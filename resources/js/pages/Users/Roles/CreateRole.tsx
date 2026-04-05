import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import roles from '@/routes/roles';
import users from '@/routes/users';
import { Head, useForm } from '@inertiajs/react';
import { Info, RotateCcw, Save, Shield } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function CreateRole() {
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
        name: '',
        label: '',
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
                className="flex h-full flex-1 flex-col overflow-hidden bg-background text-foreground"
            >
                {/* --- HEADER STICKY (Idéntico a EditRole) --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-8 py-4 shadow-sm backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-violet-600 p-2 text-white shadow-lg">
                            <Shield className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-semibold">
                            Nuevo Rol de Sistema
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
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isDirty || processing}
                            className={cn(
                                'px-6 font-bold transition-all',
                                isDirty
                                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Guardar Rol
                        </Button>
                    </div>
                </div>

                {/* --- CONTENIDO PRINCIPAL (Mismo grid que EditRole) --- */}
                <div className="custom-scrollbar flex-1 overflow-y-auto bg-muted/5 px-8 py-8 dark:bg-background">
                    <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* COLUMNA IZQUIERDA: INFORMACIÓN Y TIPS */}
                        <div className="flex flex-col gap-6 lg:col-span-1">
                            <Card className="shrink-0 border-l-4 border-l-violet-600 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                        Configuración Inicial
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Identificador con estilo # para denotar que es un slug técnico */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold uppercase opacity-60">
                                            Identificador (Slug)
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute top-2 left-3 font-mono text-xs text-muted-foreground/40">
                                                #
                                            </span>
                                            <Input
                                                autoFocus
                                                value={data.name}
                                                onChange={(e) =>
                                                    onFieldChange(
                                                        'name',
                                                        e.target.value
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/g,
                                                                '_',
                                                            ),
                                                    )
                                                }
                                                placeholder="ej_administrador"
                                                className={cn(
                                                    'h-8 pl-6 font-mono text-xs focus-visible:ring-violet-500',
                                                    errors.name &&
                                                        'border-red-500',
                                                )}
                                            />
                                        </div>
                                        {errors.name && (
                                            <p className="text-[10px] font-medium text-red-500">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold uppercase opacity-60">
                                            Nombre Visible
                                        </Label>
                                        <Input
                                            value={data.label}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'label',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ej: Administrador de Ventas"
                                            className={cn(
                                                'h-9 focus-visible:ring-violet-500',
                                                errors.label &&
                                                    'border-red-500',
                                            )}
                                        />
                                        {errors.label && (
                                            <p className="text-[10px] font-medium text-red-500">
                                                {errors.label}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold uppercase opacity-60">
                                            Descripción
                                        </Label>
                                        <Textarea
                                            value={data.description}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Propósito de este rol..."
                                            className="resize-none text-sm focus-visible:ring-violet-500"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card Informativa para balancear el diseño de la columna izquierda */}
                            <Card className="border-violet-200 bg-violet-50/50 shadow-none dark:border-violet-900/50 dark:bg-violet-900/10">
                                <CardContent className="flex gap-3 p-4">
                                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-violet-900 dark:text-violet-300">
                                            ¿Qué sigue?
                                        </p>
                                        <p className="text-[11px] leading-relaxed text-violet-800/80 dark:text-violet-400">
                                            Tras guardar el rol, serás
                                            redirigido a la pantalla de edición
                                            donde podrás asignar la{' '}
                                            <strong>matriz de permisos</strong>{' '}
                                            específica.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* COLUMNA DERECHA: PLACEHOLDER O VISTA PREVIA */}
                        <div className="lg:col-span-2">
                            <Card className="flex h-full min-h-[400px] flex-col items-center justify-center border-2 border-dashed bg-muted/5 p-8 text-center">
                                <div className="max-w-md space-y-4">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                        <Shield className="h-8 w-8 text-muted-foreground/40" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-muted-foreground">
                                            Configuración de Capacidades
                                        </h3>
                                        <p className="text-sm text-muted-foreground/70">
                                            La matriz de permisos estará
                                            disponible una vez que el rol haya
                                            sido creado exitosamente en el
                                            sistema.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
