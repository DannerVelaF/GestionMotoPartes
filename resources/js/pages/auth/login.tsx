import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { Box } from 'lucide-react'; // Cambiamos a Box para un look más moderno
import { useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    business?: {
        name: string;
        logo: string | null;
    };
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
    business,
}: LoginProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <AuthLayout
            title={business?.name || 'Polybags Perú'}
            description="Bienvenido de nuevo, ingresa tus credenciales"
        >
            <Head title="Iniciar Sesión" />

            {/* SECCIÓN DEL LOGO REDISEÑADA */}
            <div className="mb-10 flex flex-col items-center justify-center">
                <div className="group relative">
                    {business?.logo && !imageError ? (
                        <div className="relative">
                            {/* Glow effect sutil */}
                            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-neutral-100 to-transparent opacity-40 blur-xl dark:from-neutral-800"></div>

                            {/* Contenedor del logo */}
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg transition-transform duration-300 hover:scale-105 dark:border-neutral-800 dark:bg-neutral-950">
                                <img
                                    src={business.logo}
                                    alt={business.name}
                                    className="h-full w-full object-contain"
                                    onError={() => setImageError(true)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-neutral-100 to-transparent opacity-40 blur-xl dark:from-neutral-800"></div>

                            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
                                <Box
                                    className="h-12 w-12 text-neutral-400"
                                    strokeWidth={1.5}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="ml-1 text-xs font-bold tracking-wider text-neutral-500 uppercase"
                                >
                                    Correo Electrónico
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="usuario@polybags.com"
                                    className="h-12 border-neutral-200 bg-white text-base shadow-sm transition-all focus:border-black focus:ring-0 dark:border-neutral-800 dark:bg-neutral-950"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="ml-1 flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-bold tracking-wider text-neutral-500 uppercase"
                                    >
                                        Contraseña
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                            tabIndex={5}
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="h-12 border-neutral-200 bg-white text-base shadow-sm transition-all focus:border-black focus:ring-0 dark:border-neutral-800 dark:bg-neutral-950"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="ml-1 flex items-center space-x-3 py-1">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="h-5 w-5 border-neutral-300 data-[state=checked]:border-black data-[state=checked]:bg-black"
                                />
                                <label
                                    htmlFor="remember"
                                    className="cursor-pointer text-sm font-medium text-neutral-600 transition-colors select-none hover:text-black"
                                >
                                    Recordar sesión
                                </label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-3 h-12 w-full bg-black text-base font-bold text-white shadow-xl transition-all hover:bg-neutral-800 active:scale-[0.98]"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing ? (
                                    <Spinner className="mr-2 h-5 w-5 text-white" />
                                ) : (
                                    'Entrar al Sistema'
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-6 animate-in rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm font-bold text-green-700 shadow-inner zoom-in-95">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
