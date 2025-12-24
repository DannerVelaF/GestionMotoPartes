import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/user-password';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ajustes de seguridad',
        href: edit().url,
    },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajustes de Contraseña" />

            <SettingsLayout>
                <div className="animate-in space-y-6 duration-500 fade-in">
                    <HeadingSmall
                        title="Actualizar contraseña"
                        description="Asegúrate de que tu cuenta use una contraseña larga y aleatoria para mantener la seguridad."
                    />

                    <Form
                        {...PasswordController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="max-w-xl space-y-6"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                {/* CONTRASEÑA ACTUAL */}
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="current_password"
                                        className="text-[10px] font-black tracking-widest text-neutral-500 uppercase dark:text-neutral-400"
                                    >
                                        Contraseña actual
                                    </Label>

                                    <Input
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        type="password"
                                        className="mt-1 block w-full dark:bg-neutral-900"
                                        autoComplete="current-password"
                                        placeholder="Ingresa tu clave actual"
                                    />

                                    <InputError
                                        message={errors.current_password}
                                    />
                                </div>

                                {/* NUEVA CONTRASEÑA */}
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-[10px] font-black tracking-widest text-neutral-500 uppercase dark:text-neutral-400"
                                    >
                                        Nueva contraseña
                                    </Label>

                                    <Input
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        type="password"
                                        className="mt-1 block w-full dark:bg-neutral-900"
                                        autoComplete="new-password"
                                        placeholder="Nueva clave"
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                {/* CONFIRMAR CONTRASEÑA */}
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="text-[10px] font-black tracking-widest text-neutral-500 uppercase dark:text-neutral-400"
                                    >
                                        Confirmar nueva contraseña
                                    </Label>

                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        className="mt-1 block w-full dark:bg-neutral-900"
                                        autoComplete="new-password"
                                        placeholder="Repite la nueva clave"
                                    />

                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        className="rounded-xl bg-black px-8 font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                                    >
                                        Guardar cambios
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            ¡Actualizado con éxito!
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
