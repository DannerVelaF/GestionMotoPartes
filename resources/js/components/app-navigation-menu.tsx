import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarTrigger,
} from '@/components/ui/menubar';
import productBrands from '@/routes/product-brands';
import productCategories from '@/routes/product-categories';
import productTypes from '@/routes/product-types';
import productsRoute from '@/routes/products';
import { router, usePage } from '@inertiajs/react';
import { MenubarSeparator } from '@radix-ui/react-menubar';
import suppliers from '@/routes/suppliers';

export function AppNavigationMenu() {
    const { url } = usePage();
    const isSalesModule = url.startsWith('/ventas');
    return (
        <div className="border-b bg-background px-4 py-2">
            <Menubar className="border-none bg-transparent p-0 shadow-none">
                {/* Módulo: PRODUCTOS / INVENTARIO */}
                <MenubarMenu>
                    <MenubarTrigger className="cursor-pointer">
                        Productos
                    </MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem
                            onClick={() =>
                                router.visit(productsRoute.index().url)
                            }
                        >
                            Productos
                        </MenubarItem>
                        <MenubarItem
                            onClick={() =>
                                router.visit(productCategories.index().url)
                            }
                        >
                            Categorías
                        </MenubarItem>
                        <MenubarItem
                            onClick={() =>
                                router.visit(productBrands.index().url)
                            }
                        >
                            Marcas
                        </MenubarItem>
                        <MenubarItem
                            onClick={() =>
                                router.visit(productTypes.index().url)
                            }
                        >
                            Tipos de producto
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                <MenubarMenu>
                    <MenubarTrigger className="cursor-pointer font-medium text-primary">
                        Proveedores
                    </MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem
                            onClick={() => router.visit(suppliers.index().url)}
                        >
                            Proveedores
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                {isSalesModule && (
                    <MenubarMenu>
                        <MenubarTrigger className="cursor-pointer font-medium text-primary">
                            Reportes
                        </MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem
                                onClick={() => router.visit('/ventas/reportes')}
                            >
                                Reportes
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                )}

                {/* Aquí puedes agregar más MenubarMenu para Ventas, Compras, etc. */}
            </Menubar>
        </div>
    );
}
