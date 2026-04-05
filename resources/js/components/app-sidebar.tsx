import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePermission } from '@/hooks/usePermission'; // Importamos tu hook
import { dashboard } from '@/routes';
import inventory from '@/routes/inventory';
import purchaseOrders from '@/routes/purchase-orders';
import sales from '@/routes/sales';
import users from '@/routes/users';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BookText,
    LayoutGrid,
    PackageOpen,
    ShoppingCart,
    User2,
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { hasPermission } = usePermission();

    // 1. Definimos todos los items posibles con su permiso requerido
    const allNavItems = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Ventas',
            href: sales.index.url(),
            icon: ShoppingCart,
            permission: 'sales.view', // Permiso necesario
        },
        {
            title: 'Compras',
            href: purchaseOrders.index.url(),
            icon: BookText,
            permission: 'purchase.view', // Permiso necesario
        },
        {
            title: 'Inventario',
            href: inventory.adjustments.index.url(),
            icon: PackageOpen,
            permission: 'inventory.view', // Permiso necesario
        },
        {
            title: 'Usuarios',
            href: users.index.url(),
            icon: User2,
            permission: 'user.view', // Permiso necesario (o 'roles.view')
        },
    ];

    // 2. Filtramos los items basándonos en los permisos del usuario
    const filteredNavItems = allNavItems.filter((item) => {
        // El Dashboard es público para todos los logueados
        if (item.title === 'Dashboard') return true;

        // Si el item tiene un permiso definido, lo validamos
        return item.permission ? hasPermission(item.permission) : true;
    });

    const footerNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Pasamos la lista ya filtrada */}
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
