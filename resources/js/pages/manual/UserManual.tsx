import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import manual from '@/routes/manual';
import { Head, router } from '@inertiajs/react';
import {
    BookText,
    Package,
    ShoppingBag,
    Tags,
    Truck,
    Users,
} from 'lucide-react';

export default function UserManual() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Manual de Uso', href: '#' }]}>
            <Head title="Manual de Usuario" />
            <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-black tracking-tight uppercase">
                        Centro de Ayuda
                    </h1>
                    <p className="text-muted-foreground">
                        Guía rápida para operar el sistema de gestión.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card
                        className="group cursor-pointer transition-all hover:border-indigo-500 hover:shadow-md"
                        onClick={() => router.visit(manual.productos())}
                    >
                        <CardHeader>
                            <Tags className="mb-2 h-8 w-8 text-indigo-600 transition-transform group-hover:scale-110" />
                            <CardTitle className="text-lg font-black tracking-tight">
                                Productos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs leading-relaxed text-muted-foreground">
                            Administración del **catálogo maestro**,
                            configuración de precios, marcas, categorías y
                            estados de productos.
                        </CardContent>
                    </Card>

                    {/* Guía de Proveedores */}
                    <Card
                        className="group cursor-pointer transition-all hover:border-rose-500 hover:shadow-md"
                        onClick={() => router.visit(manual.proveedores())}
                    >
                        <CardHeader>
                            <Truck className="mb-2 h-8 w-8 text-rose-600 transition-transform group-hover:scale-110" />
                            <CardTitle className="text-lg font-black tracking-tight">
                                Proveedores
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs leading-relaxed text-muted-foreground">
                            Directorio de **aliados comerciales**, registro de
                            RUC, contactos y seguimiento de compras por
                            proveedor.
                        </CardContent>
                    </Card>

                    {/* Guía de Usuarios */}
                    <Card
                        className="group cursor-pointer transition-all hover:border-slate-500 hover:shadow-md"
                        onClick={() => router.visit(manual.usuarios())}
                    >
                        <CardHeader>
                            <Users className="mb-2 h-8 w-8 text-slate-600 transition-transform group-hover:scale-110" />
                            <CardTitle className="text-lg font-black tracking-tight">
                                Usuarios
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs leading-relaxed text-muted-foreground">
                            Control de **accesos al sistema**, gestión de
                            perfiles, permisos de seguridad y auditoría de
                            acciones.
                        </CardContent>
                    </Card>

                    {/* Guía de Comprobantes */}
                    <Card
                        className="group cursor-pointer transition-all hover:border-blue-500 hover:shadow-md"
                        onClick={() => router.visit(manual.comprobantes())}
                    >
                        <CardHeader>
                            <BookText className="mb-2 h-8 w-8 text-blue-600 transition-transform group-hover:scale-110" />
                            <CardTitle className="text-lg font-black tracking-tight">
                                Comprobantes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs leading-relaxed text-muted-foreground">
                            Registro de **compras de productos**, gestión de
                            adjuntos, control de fechas de recepción y notas de
                            crédito.
                        </CardContent>
                    </Card>

                    {/* Guía de Ventas */}
                    <Card
                        className="group cursor-pointer transition-all hover:border-emerald-500 hover:shadow-md"
                        onClick={() => router.visit(manual.ventas())}
                    >
                        <CardHeader>
                            <ShoppingBag className="mb-2 h-8 w-8 text-emerald-600 transition-transform group-hover:scale-110" />
                            <CardTitle className="text-lg font-black tracking-tight">
                                Ventas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs leading-relaxed text-muted-foreground">
                            Registro de **facturación a clientes**, emisión de
                            tickets, control de salidas y analítica de ingresos.
                        </CardContent>
                    </Card>

                    {/* Guía de Inventario */}
                    <Card
                        className="group cursor-pointer transition-all hover:border-amber-500 hover:shadow-md"
                        onClick={() => router.visit(manual.inventario())}
                    >
                        <CardHeader>
                            <Package className="mb-2 h-8 w-8 text-amber-600 transition-transform group-hover:scale-110" />
                            <CardTitle className="text-lg font-black tracking-tight">
                                Inventario
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs leading-relaxed text-muted-foreground">
                            Gestión de **Stock Real**, consulta de Kardex
                            histórico, exportación de reportes y control de
                            saldos.
                        </CardContent>
                    </Card>

                    {/* Guía de Productos */}
                </div>
            </div>
        </AppLayout>
    );
}
