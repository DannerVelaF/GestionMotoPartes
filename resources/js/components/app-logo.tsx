import AppLogoIcon from './app-logo-icon';
import { Bike } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Bike className="size-6 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    Moto Repuestos
                </span>
                <span className="mb-0.5 truncate text-[11px] leading-tight font-semibold ">
                    Panel administrativo
                </span>
            </div>
        </>
    );
}
