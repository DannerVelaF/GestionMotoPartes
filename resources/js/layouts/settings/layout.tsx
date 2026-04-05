import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn, isSameUrl, resolveUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import configuracion from '@/routes/configuracion';
import { edit as editPassword } from '@/routes/user-password';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react'; // ✅ Importamos usePage
import { type PropsWithChildren } from 'react';

export default function SettingsLayout({ children }: PropsWithChildren) {
    // 1. Obtenemos el usuario desde los props globales de Inertia
    const { auth } = usePage<any>().props;
    const user = auth.user;

    // 2. Verificamos si es admin (ahora que corregimos el Middleware, esto funcionará)
    const isAdmin = user?.role?.name === 'admin';

    // 3. Definimos los items dentro del componente para poder filtrarlos dinámicamente
    const sidebarNavItems: NavItem[] = [
        // ✅ Solo incluimos "Empresa" si es administrador
        ...(isAdmin ? [{
            title: 'Empresa',
            href: configuracion.negocio.url(),
            icon: null,
        }] : []),
        {
            title: 'Cambio de contraseña',
            href: editPassword(),
            icon: null,
        },
        {
            title: 'Apariencia',
            href: editAppearance(),
            icon: null,
        },
    ];

    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-6">
            <Heading
                title="Configuración"
                description="Maneja la información de tu empresa y cuenta."
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${resolveUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': isSameUrl(
                                        currentPath,
                                        item.href,
                                    ),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
