import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { negocio } from '@/routes/configuracion';
import { index } from '@/routes/manual';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { Book, LogOut, Settings } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>

            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full"
                        href={index()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <Book className="mr-2 h-4 w-4" />
                        Manual de uso
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>

                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link
                            className="block w-full"
                            href={negocio()}
                            as="button"
                            prefetch
                            onClick={cleanup}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Configuración
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
                <Link
                    className="block w-full"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                </Link>
            </DropdownMenuItem>
        </>
    );
}
