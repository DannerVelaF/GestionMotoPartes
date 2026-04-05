import { NotificationBell } from '@/components/NotificationBell';
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from '@/components/ui/menubar';
import { usePermission } from '@/hooks/usePermission';
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
    CreditCard,
    FileText,
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
    const { hasPermission } = usePermission();

    // 1. Detectar si estamos en el manual o configuraciones globales
    const isManualModule = url.startsWith('/manual');
    const isDashboard = url === '/dashboard';
    if (isManualModule || isDashboard) return null;

    // --- Detección de Módulos ---
    const isInventoryModule = url.startsWith('/inventario');

    const isSalesModule =
        url.startsWith('/ventas') ||
        url.startsWith('/compras/configuracion/impuestos');

    const isReceiptsModule =
        url.startsWith('/recibos') ||
        url.startsWith('/compras') ||
        url.startsWith('/compras/configuracion/impuestos');

    const isUsersModule =
        url.startsWith('/usuarios') || url.startsWith('/roles');

    const openKardexModal = () => {
        window.dispatchEvent(new CustomEvent('open-kardex-modal'));
    };

    const itemClass = 'cursor-pointer gap-2 py-2';

    return (
        <div className="border-b bg-background px-4 py-2">
            <div className="flex items-center justify-between">
                <Menubar className="border-none bg-transparent p-0 shadow-none">
                    {/* CATÁLOGO: Requiere ver inventario */}
                    {hasPermission('inventory.view') && (
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
                                        router.visit(
                                            productCategories.index().url,
                                        )
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
                                    <Tag className="h-4 w-4 text-emerald-600" />{' '}
                                    Marcas
                                </MenubarItem>
                                <MenubarItem
                                    className={itemClass}
                                    onClick={() =>
                                        router.visit(productTypes.index().url)
                                    }
                                >
                                    <Type className="h-4 w-4 text-orange-600" />{' '}
                                    Tipos de producto
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    )}

                    {/* PROVEEDORES: Requiere ver compras */}
                    {hasPermission('purchase.view') && (
                        <MenubarMenu>
                            <MenubarTrigger className="cursor-pointer font-medium hover:bg-muted/50 data-[state=open]:bg-muted">
                                Proveedores
                            </MenubarTrigger>
                            <MenubarContent className="min-w-[180px]">
                                <MenubarItem
                                    className={itemClass}
                                    onClick={() =>
                                        router.visit(suppliers.index().url)
                                    }
                                >
                                    <Building2 className="h-4 w-4 text-blue-600" />{' '}
                                    Directorio
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    )}

                    {/* COMPROBANTES: Visibilidad global de facturación */}
                    {hasPermission('billing.view') && (
                        <MenubarMenu>
                            <MenubarTrigger className="cursor-pointer font-medium hover:bg-muted/50 data-[state=open]:bg-muted">
                                Comprobantes
                            </MenubarTrigger>
                            <MenubarContent className="min-w-[180px]">
                                <MenubarItem
                                    className={itemClass}
                                    onClick={() => router.visit('/recibos')}
                                >
                                    <FileText className="h-4 w-4 text-blue-600" />{' '}
                                    Explorador General
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    )}

                    {/* INVENTARIO (Contextual) */}
                    {isInventoryModule && hasPermission('inventory.view') && (
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
                                    onClick={() => router.visit('/inventario')}
                                >
                                    <ArrowLeftRight className="h-4 w-4 text-emerald-600" />{' '}
                                    Stock por producto
                                </MenubarItem>
                                <MenubarSeparator className="my-1 h-px bg-muted" />
                                <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                    Informes y Trazabilidad
                                </div>
                                <MenubarItem
                                    className={itemClass}
                                    onClick={openKardexModal}
                                >
                                    <Calculator className="h-4 w-4 text-blue-600" />{' '}
                                    Valorización de Stock
                                </MenubarItem>
                                {hasPermission('inventory.config') && (
                                    <>
                                        <MenubarSeparator className="my-1 h-px bg-muted" />
                                        <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                            Maestros
                                        </div>
                                        <MenubarItem
                                            className={itemClass}
                                            onClick={() =>
                                                router.visit(
                                                    '/inventario/configuracion',
                                                )
                                            }
                                        >
                                            <Settings2 className="h-4 w-4 text-slate-600" />{' '}
                                            Tipos de Operación
                                        </MenubarItem>
                                    </>
                                )}
                            </MenubarContent>
                        </MenubarMenu>
                    )}

                    {/* VENTAS (Contextual) */}
                    {isSalesModule && hasPermission('sales.view') && (
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
                                    {hasPermission('billing.report') && (
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
                                    )}
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
                                    Configuración
                                </MenubarTrigger>
                                <MenubarContent className="min-w-[220px]">
                                    <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                        Maestros y Finanzas
                                    </div>
                                    <MenubarItem
                                        className={itemClass}
                                        onClick={() =>
                                            router.visit('/ventas/metodoPago')
                                        }
                                    >
                                        <CreditCard className="h-4 w-4 text-fuchsia-600" />{' '}
                                        Métodos de pago
                                    </MenubarItem>
                                    {hasPermission('inventory.config') && (
                                        <MenubarItem
                                            className={itemClass}
                                            onClick={() =>
                                                router.visit(
                                                    '/compras/configuracion/impuestos',
                                                )
                                            }
                                        >
                                            <Coins className="h-4 w-4 text-slate-600" />{' '}
                                            Matriz de Impuestos
                                        </MenubarItem>
                                    )}
                                </MenubarContent>
                            </MenubarMenu>
                        </>
                    )}

                    {/* COMPRAS (Contextual) */}
                    {isReceiptsModule &&
                        !isSalesModule &&
                        hasPermission('purchase.view') && (
                            <>
                                <MenubarMenu>
                                    <MenubarTrigger className="cursor-pointer font-bold text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/30">
                                        Gestión de Compras
                                    </MenubarTrigger>
                                    <MenubarContent className="min-w-[220px]">
                                        <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                            Finanzas y Auditoría
                                        </div>
                                        <MenubarItem
                                            className={itemClass}
                                            onClick={() =>
                                                router.visit(
                                                    '/compras/reportes/distribucion',
                                                )
                                            }
                                        >
                                            <PieChartIcon className="h-4 w-4 text-amber-500" />{' '}
                                            Estructura de Gastos
                                        </MenubarItem>
                                        <MenubarItem
                                            className={itemClass}
                                            onClick={() =>
                                                router.visit(
                                                    '/compras/reportes/impuestos',
                                                )
                                            }
                                        >
                                            <Percent className="h-4 w-4 text-emerald-600" />{' '}
                                            Libro de Compras
                                        </MenubarItem>
                                        <MenubarItem
                                            className={itemClass}
                                            onClick={() =>
                                                router.visit(
                                                    '/compras/reportes/margen',
                                                )
                                            }
                                        >
                                            <TrendingUp className="h-4 w-4 text-blue-600" />{' '}
                                            Margen y Rentabilidad
                                        </MenubarItem>
                                        <MenubarSeparator className="my-1 h-px bg-muted" />
                                        <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                            Gestión de Suministros
                                        </div>
                                        <MenubarItem
                                            className={itemClass}
                                            onClick={() =>
                                                router.visit(
                                                    '/compras/reportes/proveedores',
                                                )
                                            }
                                        >
                                            <Truck className="h-4 w-4 text-purple-600" />{' '}
                                            Ranking de Proveedores
                                        </MenubarItem>
                                        {hasPermission('purchase.approve') && (
                                            <MenubarItem
                                                className={itemClass}
                                                onClick={() =>
                                                    router.visit(
                                                        '/compras/reportes/variacion-costos',
                                                    )
                                                }
                                            >
                                                <Activity className="h-4 w-4 text-orange-600" />{' '}
                                                Variación de Costos
                                            </MenubarItem>
                                        )}
                                    </MenubarContent>
                                </MenubarMenu>

                                <MenubarMenu>
                                    <MenubarTrigger className="cursor-pointer font-bold text-fuchsia-700 hover:bg-fuchsia-50 dark:text-fuchsia-400 dark:hover:bg-fuchsia-950/30">
                                        Configuración
                                    </MenubarTrigger>
                                    <MenubarContent className="min-w-[220px]">
                                        <div className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">
                                            Maestros
                                        </div>
                                        {hasPermission('inventory.config') && (
                                            <MenubarItem
                                                className={itemClass}
                                                onClick={() =>
                                                    router.visit(
                                                        '/compras/configuracion/impuestos',
                                                    )
                                                }
                                            >
                                                <Coins className="h-4 w-4 text-slate-600" />{' '}
                                                Matriz de Impuestos
                                            </MenubarItem>
                                        )}
                                    </MenubarContent>
                                </MenubarMenu>
                            </>
                        )}

                    {/* ADMINISTRACIÓN */}
                    {isUsersModule &&
                        (hasPermission('user.view') ||
                            hasPermission('roles.view')) && (
                            <MenubarMenu>
                                <MenubarTrigger className="cursor-pointer font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/30">
                                    Administración
                                </MenubarTrigger>
                                <MenubarContent className="min-w-[200px]">
                                    {hasPermission('roles.view') && (
                                        <MenubarItem
                                            className={itemClass}
                                            onClick={() =>
                                                router.visit(
                                                    rolesRoute.index().url,
                                                )
                                            }
                                        >
                                            <Shield className="h-4 w-4 text-violet-600" />{' '}
                                            Roles
                                        </MenubarItem>
                                    )}
                                </MenubarContent>
                            </MenubarMenu>
                        )}
                </Menubar>

                <div className="flex items-center gap-4">
                    <NotificationBell />
                </div>
            </div>
        </div>
    );
}
