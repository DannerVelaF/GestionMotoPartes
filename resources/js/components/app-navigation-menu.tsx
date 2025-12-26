import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from '@/components/ui/menubar';
import productBrands from '@/routes/product-brands';
import productCategories from '@/routes/product-categories';
import productTypes from '@/routes/product-types';
import productsRoute from '@/routes/products';
import suppliers from '@/routes/suppliers';
import { router, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowLeftRight,
    Building2,
    Calculator,
    CalendarDays,
    Layers,
    Package,
    Percent,
    PieChart,
    Tag,
    TrendingUp,
    Trophy,
    Truck,
    Type,
} from 'lucide-react';

export function AppNavigationMenu() {
    const { url } = usePage();

    const isSalesModule = url.startsWith('/ventas');
    const isReceiptsModule = url.startsWith('/recibos');
    const isInventoryModule = url.startsWith('/inventario');

    const openKardexModal = () => {
        window.dispatchEvent(new CustomEvent('open-kardex-modal'));
    };

    // Clase común para los items con icono
    const itemClass = 'cursor-pointer gap-2 py-2';

    return (
        <div className="border-b bg-background px-4 py-2">
            <Menubar className="border-none bg-transparent p-0 shadow-none">
                {/* Módulo: PRODUCTOS */}
                <MenubarMenu>
                    <MenubarTrigger className="cursor-pointer font-medium">
                        Productos
                    </MenubarTrigger>
                    <MenubarContent className="min-w-[180px]">
                        <MenubarItem
                            className={itemClass}
                            onClick={() =>
                                router.visit(productsRoute.index().url)
                            }
                        >
                            <Package className="h-4 w-4 text-blue-600" />{' '}
                            Productos
                        </MenubarItem>
                        <MenubarItem
                            className={itemClass}
                            onClick={() =>
                                router.visit(productCategories.index().url)
                            }
                        >
                            <Layers className="h-4 w-4 text-purple-600" />{' '}
                            Categorías
                        </MenubarItem>
                        <MenubarItem
                            className={itemClass}
                            onClick={() =>
                                router.visit(productBrands.index().url)
                            }
                        >
                            <Tag className="h-4 w-4 text-emerald-600" /> Marcas
                        </MenubarItem>
                        <MenubarItem
                            className={itemClass}
                            onClick={() =>
                                router.visit(productTypes.index().url)
                            }
                        >
                            <Type className="h-4 w-4 text-orange-600" /> Tipos
                            de producto
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                {/* Módulo: PROVEEDORES */}
                <MenubarMenu>
                    <MenubarTrigger className="cursor-pointer font-medium text-primary">
                        Proveedores
                    </MenubarTrigger>
                    <MenubarContent className="min-w-[180px]">
                        <MenubarItem
                            className={itemClass}
                            onClick={() => router.visit(suppliers.index().url)}
                        >
                            <Building2 className="h-4 w-4 text-blue-600" />{' '}
                            Directorio
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                {/* Analítica de Almacén (Solo en Inventario) */}
                {isInventoryModule && (
                    <MenubarMenu>
                        <MenubarTrigger className="cursor-pointer font-bold text-emerald-700 dark:text-emerald-400">
                            Analítica de Almacén
                        </MenubarTrigger>
                        <MenubarContent className="min-w-[200px]">
                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Trazabilidad
                            </div>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit('/inventario/movimientos')
                                }
                            >
                                <ArrowLeftRight className="h-4 w-4 text-emerald-600" />{' '}
                                Movimientos Globales
                            </MenubarItem>
                            <MenubarItem
                                className={itemClass}
                                onClick={openKardexModal}
                            >
                                <Calculator className="h-4 w-4 text-blue-600" />{' '}
                                Kardex Valorizado
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                )}

                {/* Analítica de Ventas (Solo en Ventas) */}
                {isSalesModule && (
                    <MenubarMenu>
                        <MenubarTrigger className="cursor-pointer font-bold text-blue-700 dark:text-blue-400">
                            Analítica de Ventas
                        </MenubarTrigger>
                        <MenubarContent className="min-w-[220px]">
                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Finanzas
                            </div>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit(
                                        '/ventas/reportes/resumen-diario',
                                    )
                                }
                            >
                                <CalendarDays className="h-4 w-4 text-blue-600" />{' '}
                                Resumen Diario
                            </MenubarItem>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit('/ventas/reportes/impuestos')
                                }
                            >
                                <Percent className="h-4 w-4 text-emerald-600" />{' '}
                                Libro de Ventas (IGV)
                            </MenubarItem>

                            <MenubarSeparator className="my-1 h-px bg-muted" />

                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Movimiento de Stock
                            </div>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit(
                                        '/ventas/reportes/productos-estrella',
                                    )
                                }
                            >
                                <Trophy className="h-4 w-4 text-amber-500" />{' '}
                                Productos Estrella
                            </MenubarItem>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit(
                                        '/ventas/reportes/analisis-marcas',
                                    )
                                }
                            >
                                <PieChart className="h-4 w-4 text-purple-600" />{' '}
                                Ventas por Marca
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                )}

                {/* Analítica de Compras (Solo en Recibos) */}
                {isReceiptsModule && (
                    <MenubarMenu>
                        <MenubarTrigger className="cursor-pointer font-bold text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-neutral-900">
                            Analítica de Compras
                        </MenubarTrigger>
                        <MenubarContent className="min-w-[220px] dark:border-neutral-800">
                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Finanzas y Auditoría
                            </div>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit('/recibos/reportes/impuestos')
                                }
                            >
                                <Percent className="h-4 w-4 text-emerald-600" />{' '}
                                Libro de Compras (IGV)
                            </MenubarItem>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit('/recibos/reportes/margen')
                                }
                            >
                                <TrendingUp className="h-4 w-4 text-blue-600" />{' '}
                                Margen y Rentabilidad
                            </MenubarItem>

                            <MenubarSeparator className="my-1 h-px bg-muted dark:bg-neutral-800" />

                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Gestión de Suministros
                            </div>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit(
                                        '/recibos/reportes/proveedores',
                                    )
                                }
                            >
                                <Truck className="h-4 w-4 text-purple-600" />{' '}
                                Ranking de Proveedores
                            </MenubarItem>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit(
                                        '/recibos/reportes/variacionCosto',
                                    )
                                }
                            >
                                <Activity className="h-4 w-4 text-orange-600" />{' '}
                                Variación de Costos
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                )}
            </Menubar>
        </div>
    );
}
