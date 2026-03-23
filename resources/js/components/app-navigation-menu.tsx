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
import rolesRoute from '@/routes/roles';
import suppliers from '@/routes/suppliers';
import { router, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowLeftRight,
    Building2,
    Calculator,
    CalendarDays,
    Coins,
    Layers,
    Package,
    Percent,
    PieChart,
    PieChartIcon,
    Settings2,
    Shield,
    Tag,
    TrendingUp,
    Trophy,
    Truck,
    Type,
} from 'lucide-react';

export function AppNavigationMenu() {
    const { url } = usePage();

    // 1. Detectar si estamos en el manual
    const isManualModule = url.startsWith('/manual');
    const isConfigModule = url.startsWith('/configuracion');
    const isDashboard = url === '/dashboard';
    if (isManualModule || isConfigModule || isDashboard) return null;

    // --- Detección de Módulos ---
    const isProductsModule =
        url.startsWith('/productos') ||
        url.startsWith('/categorias') ||
        url.startsWith('/marcas') ||
        url.startsWith('/tipos') ||
        url.startsWith('/proveedores');

    const isSalesModule = url.startsWith('/ventas');
    // ✅ Se incluye el nuevo prefijo de configuración de impuestos en el módulo de compras
    const isReceiptsModule =
        url.startsWith('/recibos') ||
        url.startsWith('/compras') ||
        url.startsWith('/configuracion/impuestos');
    const isInventoryModule = url.startsWith('/inventario');
    const isUsersModule =
        url.startsWith('/usuarios') || url.startsWith('/roles');

    const openKardexModal = () => {
        window.dispatchEvent(new CustomEvent('open-kardex-modal'));
    };

    const itemClass = 'cursor-pointer gap-2 py-2';

    return (
        <div className="border-b bg-background px-4 py-2">
            <Menubar className="border-none bg-transparent p-0 shadow-none">
                {/* CATÁLOGO */}
                <MenubarMenu>
                    <MenubarTrigger className="cursor-pointer font-medium hover:bg-muted/50 data-[state=open]:bg-muted">
                        Catálogo
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

                {/* PROVEEDORES */}
                <MenubarMenu>
                    <MenubarTrigger className="cursor-pointer font-medium hover:bg-muted/50 data-[state=open]:bg-muted">
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

                {/* INVENTARIO */}
                {isInventoryModule && (
                    <MenubarMenu>
                        <MenubarTrigger className="cursor-pointer font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
                            Logística e Inventario
                        </MenubarTrigger>
                        <MenubarContent className="min-w-[220px]">
                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Ejecución
                            </div>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit(
                                        '/inventario',
                                    )
                                }
                            >
                                <ArrowLeftRight className="h-4 w-4 text-emerald-600" />{' '}
                                Stock por producto
                            </MenubarItem>
                            <MenubarSeparator className="my-1 h-px bg-muted" />
                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Informes y Trazabilidad
                            </div>
                            {/*<MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit('/inventario/movimientos')
                                }
                            >
                                <Activity className="h-4 w-4 text-orange-600" />{' '}
                                Kardex de Movimientos
                            </MenubarItem>*/}
                            <MenubarItem
                                className={itemClass}
                                onClick={openKardexModal}
                            >
                                <Calculator className="h-4 w-4 text-blue-600" />{' '}
                                Valorización de Stock
                            </MenubarItem>
                            <MenubarSeparator className="my-1 h-px bg-muted" />
                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Maestros
                            </div>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit('/inventario/configuracion')
                                }
                            >
                                <Settings2 className="h-4 w-4 text-slate-600" />{' '}
                                Tipos de Operación y Ubicaciones
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                )}

                {/* VENTAS */}
                {isSalesModule && (
                    <>
                        <MenubarMenu>
                            <MenubarTrigger className="cursor-pointer font-bold text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30">
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
                                        router.visit(
                                            '/ventas/reportes/impuestos',
                                        )
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
                        <MenubarMenu>
                            <MenubarTrigger className="cursor-pointer font-bold text-fuchsia-700 hover:bg-fuchsia-50 dark:text-fuchsia-400 dark:hover:bg-fuchsia-950/30">
                                Métodos de pago
                            </MenubarTrigger>
                            <MenubarContent className="min-w-[220px]">
                                <MenubarItem
                                    className={itemClass}
                                    onClick={() =>
                                        router.visit('/ventas/metodoPago')
                                    }
                                >
                                    <CalendarDays className="h-4 w-4 text-fuchsia-600" />{' '}
                                    Métodos de pago
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    </>
                )}

                {/* COMPRAS / RECIBOS */}
                {isReceiptsModule && (
                    <MenubarMenu>
                        <MenubarTrigger className="cursor-pointer font-bold text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/30">
                            Gestión de Compras
                        </MenubarTrigger>
                        <MenubarContent className="min-w-[220px] dark:border-neutral-800">
                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Finanzas y Auditoría
                            </div>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit(
                                        '/recibos/reportes/distribucion',
                                    )
                                }
                            >
                                <PieChartIcon className="h-4 w-4 text-amber-500" />{' '}
                                Estructura de Gastos
                            </MenubarItem>
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

                            {/* ✅ SECCIÓN AGREGADA: CONFIGURACIÓN DE COMPRAS */}
                            <MenubarSeparator className="my-1 h-px bg-muted dark:bg-neutral-800" />
                            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                Maestros
                            </div>
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit(
                                        '/compras/configuracion/impuestos',
                                    )
                                }
                            >
                                <Coins className="h-4 w-4 text-slate-600" />{' '}
                                Configuración de Impuestos
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                )}

                {/* ADMINISTRACIÓN */}
                {isUsersModule && (
                    <MenubarMenu>
                        <MenubarTrigger className="cursor-pointer font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/30">
                            Administración
                        </MenubarTrigger>
                        <MenubarContent className="min-w-[200px] dark:border-neutral-800">
                            <MenubarItem
                                className={itemClass}
                                onClick={() =>
                                    router.visit(rolesRoute.index().url)
                                }
                            >
                                <Shield className="h-4 w-4 text-violet-600" />{' '}
                                Roles
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                )}
            </Menubar>
        </div>
    );
}
