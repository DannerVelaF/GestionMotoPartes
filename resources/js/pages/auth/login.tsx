import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';
import { Form, Head } from '@inertiajs/react';
import { ArrowRight, LayoutGrid, Lock, User } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout title="" description="">
            <Head title="Acceso al Sistema" />

            <div className="relative mx-auto w-full max-w-[400px]">
                {/* CABECERA MINIMALISTA */}
                <div className="mb-12 text-center">
                    <div className="relative mb-6 inline-block">
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-black shadow-2xl ring-8 ring-neutral-50 transition-transform duration-500 hover:scale-105 dark:bg-neutral-800 dark:ring-neutral-900/50">
                            <LayoutGrid
                                className="h-10 w-10 text-white"
                                strokeWidth={1.5}
                            />
                        </div>
                        {/* Indicador de sistema activo */}
                        <div className="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full border-2 border-neutral-50 bg-blue-500 dark:border-neutral-900" />
                    </div>

                    <h1 className="text-xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                        Consola de Acceso
                    </h1>
                    <p className="mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        Introduce tus credenciales para administrar el panel
                    </p>
                </div>

                {/* FORMULARIO */}
                <Form {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-4">
                                {/* CAMPO USUARIO */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="username"
                                        className="ml-1 text-[10px] font-black tracking-[0.15em] text-neutral-400 uppercase dark:text-neutral-500"
                                    >
                                        Identificador
                                    </Label>
                                    <div className="group relative">
                                        <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-black dark:group-focus-within:text-white" />
                                        <Input
                                            id="username"
                                            name="username"
                                            required
                                            autoFocus
                                            placeholder="nombre_usuario"
                                            className="h-12 rounded-xl border-none bg-neutral-50 pl-11 ring-1 ring-neutral-200 transition-all focus:bg-white focus:ring-4 focus:ring-black/5 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-800 dark:focus:bg-neutral-950 dark:focus:ring-white/5"
                                        />
                                    </div>
                                    <InputError message={errors.username} />
                                </div>

                                {/* CAMPO CONTRASEÑA */}
                                <div className="space-y-2">
                                    <div className="group relative">
                                        <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-black dark:group-focus-within:text-white" />
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            placeholder="••••••••"
                                            className="h-12 rounded-xl border-none bg-neutral-50 pl-11 ring-1 ring-neutral-200 transition-all focus:bg-white focus:ring-4 focus:ring-black/5 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-800 dark:focus:bg-neutral-950 dark:focus:ring-white/5"
                                        />
                                    </div>
                                    <InputError message={errors.password} />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="group h-12 w-full rounded-xl bg-black text-sm font-bold text-white shadow-xl transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                                disabled={processing}
                            >
                                {processing ? (
                                    <Spinner className="mr-2 h-5 w-5 text-white dark:text-black" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Ingresar al Sistema</span>
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                )}
                            </Button>
                        </>
                    )}
                </Form>

                {status && (
                    <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
                        {status}
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
