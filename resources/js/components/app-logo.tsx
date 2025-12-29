import { useSidebar } from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/react';
import { Building2 } from 'lucide-react';

export default function AppLogo() {
    // 1. Obtenemos el estado del sidebar
    const { state } = useSidebar();
    const { business } = usePage<any>().props;

    // Determinamos si debemos mostrar el texto (solo cuando está expandido)
    const showText = state === 'expanded';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-5 text-black" strokeWidth={2.5} />
            </div>

            {/* 2. Renderizado condicional del texto */}
            {showText && (
                <div className="ml-1 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-tight font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {business?.company_name || 'Moto Repuestos'}
                    </span>
                    <span className="mb-0.5 truncate text-[10px] leading-tight font-black tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                        Panel administrativo
                    </span>
                </div>
            )}
        </>
    );
}
