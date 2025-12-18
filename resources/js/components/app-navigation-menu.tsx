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
                        <MenubarTrigger className="cursor-pointer font-medium text-blue-700 text-primary">
                            Analítica de Ventas
                        </MenubarTrigger>
                        <MenubarContent>
                            <div className="px-2 py-1 text-[10px] font-black tracking-tighter text-muted-foreground uppercase">
                                Finanzas
                            </div>
                            <MenubarItem
                                onClick={() =>
                                    router.visit(
                                        '/ventas/reportes/resumen-diario',
                                    )
                                }
                            >
                                Resumen Diario
                            </MenubarItem>
                            <MenubarItem
                                onClick={() =>
                                    router.visit('/ventas/reportes/impuestos')
                                }
                            >
                                Libro de Ventas (IGV)
                            </MenubarItem>

                            <MenubarSeparator />

                            <div className="px-2 py-1 text-[10px] font-black tracking-tighter text-muted-foreground uppercase">
                                Movimiento de Stock
                            </div>
                            <MenubarItem
                                onClick={() =>
                                    router.visit(
                                        '/ventas/reportes/productos-estrella',
                                    )
                                }
                            >
                                Productos más Vendidos
                            </MenubarItem>
                            <MenubarItem
                                onClick={() =>
                                    router.visit(
                                        '/ventas/reportes/analisis-marcas',
                                    )
                                }
                            >
                                Ventas por Marca / Categoría
                            </MenubarItem>

                        </MenubarContent>
                    </MenubarMenu>
                )}

                {/* Aquí puedes agregar más MenubarMenu para Ventas, Compras, etc. */}
            </Menubar>
        </div>
    );
}
