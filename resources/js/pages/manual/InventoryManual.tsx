import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import manual from '@/routes/manual';
import {
    ArrowLeftRight,
    CheckCircle2,
    ClipboardList,
    Download,
    History,
    Image as ImageIcon,
    MousePointerClick,
    Package,
    Search,
    ShieldCheck,
} from 'lucide-react';

// --- Sub-componente para Capturas de Pantalla ---
const Screenshot = ({
    src,
    alt,
    caption,
}: {
    src: string;
    alt: string;
    caption?: string;
}) => (
    <div className="my-8 flex flex-col items-center space-y-3">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border-4 border-muted bg-muted/20 shadow-2xl shadow-orange-500/10 transition-all hover:border-orange-500/30">
            <img src={src} alt={alt} className="h-auto w-full object-cover" />
        </div>
        {caption && (
            <p className="flex items-center gap-2 text-center text-[10px] font-black tracking-widest text-muted-foreground uppercase italic">
                <ImageIcon className="h-3 w-3" /> {caption}
            </p>
        )}
    </div>
);

export default function InventoryManual() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Manual de Uso', href: manual.index().url },
                { title: 'Inventario', href: '' },
            ]}
        >
            <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
                {/* --- CABECERA --- */}
                <div className="flex flex-col items-center space-y-4 border-b pb-10 text-center">
                    <div className="rounded-3xl bg-amber-600 p-4 shadow-xl shadow-amber-500/20">
                        <Package className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                            Gestión de Inventario
                        </h1>
                        <p className="text-lg font-medium text-muted-foreground">
                            Control total sobre el stock físico y trazabilidad
                            histórica de movimientos.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="saldos" className="w-full">
                    <TabsList className="grid h-14 w-full grid-cols-3 rounded-2xl bg-muted/50 p-1.5">
                        <TabsTrigger
                            value="saldos"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                        >
                            <ClipboardList className="mr-2 h-4 w-4" /> Stock
                            Actual
                        </TabsTrigger>
                        <TabsTrigger
                            value="movimientos"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                        >
                            <ArrowLeftRight className="mr-2 h-4 w-4" />{' '}
                            Movimientos
                        </TabsTrigger>
                        <TabsTrigger
                            value="kardex"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                        >
                            <Download className="mr-2 h-4 w-4" /> Reporte Kardex
                        </TabsTrigger>
                    </TabsList>

                    {/* --- CONTENIDO: STOCK ACTUAL --- */}
                    <TabsContent
                        value="saldos"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                Monitoreo de Saldos
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Vista inicial para consultar la disponibilidad
                                inmediata de productos en almacén.
                            </p>
                        </div>
                        <Screenshot
                            src="/images/manual/inventario/listaStockDark.png"
                            alt="Vista de Stock"
                            caption="Panel principal de saldos por producto"
                        />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Card className="rounded-2xl border-amber-200 bg-amber-50/50 shadow-sm dark:bg-amber-950/10">
                                <CardContent className="space-y-4 p-8">
                                    <div className="flex items-center gap-3 text-amber-600">
                                        <Search className="h-6 w-6" />
                                        <h4 className="font-bold tracking-tight uppercase">
                                            Búsqueda Rápida
                                        </h4>
                                    </div>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Utiliza el buscador para filtrar por{' '}
                                        <strong>Nombre</strong> o{' '}
                                        <strong>Código de Producto</strong>. El
                                        sistema actualizará las cantidades de
                                        manera instantánea tras cada operación.
                                    </p>
                                </CardContent>
                            </Card>
                            <div className="flex flex-col justify-center space-y-4 rounded-2xl border bg-card p-8">
                                <div className="flex items-center gap-3 text-blue-600">
                                    <ShieldCheck className="h-6 w-6" />
                                    <h4 className="font-bold tracking-tight uppercase">
                                        Integridad de Datos
                                    </h4>
                                </div>
                                <p className="text-sm text-muted-foreground italic">
                                    "El saldo reflejado es el resultado neto de
                                    todas las compras, ventas y devoluciones
                                    procesadas en el sistema".
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: MOVIMIENTOS --- */}
                    <TabsContent
                        value="movimientos"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                                    <History className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase italic">
                                        Historial Global de Movimientos
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Trazabilidad de cada entrada y salida
                                        del almacén.
                                    </p>
                                </div>
                            </div>
                            <Screenshot
                                src="/images/manual/inventario/historialMovimientosDark.png"
                                alt="Historial de Movimientos"
                                caption="Registro detallado de transacciones por usuario y referencia"
                            />
                            <div className="space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
                                <h4 className="flex items-center gap-2 text-xs font-black tracking-widest text-amber-600 uppercase">
                                    <MousePointerClick className="h-4 w-4" />
                                    Análisis por Producto
                                </h4>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Dentro de{' '}
                                    <strong>Movimientos Globales</strong>,
                                    puedes filtrar un producto específico para
                                    auditar su comportamiento. El sistema
                                    muestra:
                                </p>
                                <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <li className="space-y-1 border-l-2 border-amber-500 pl-4">
                                        <span className="block font-bold text-foreground">
                                            Tipo de Mov.
                                        </span>
                                        <p className="text-xs text-muted-foreground italic">
                                            Diferencia entre COMPRA, VENTA o
                                            DEVOLUCIÓN.
                                        </p>
                                    </li>
                                    <li className="space-y-1 border-l-2 border-amber-500 pl-4">
                                        <span className="block font-bold text-foreground">
                                            Referencia
                                        </span>
                                        <p className="text-xs text-muted-foreground italic">
                                            Código de documento vinculado al
                                            movimiento.
                                        </p>
                                    </li>
                                    <li className="space-y-1 border-l-2 border-amber-500 pl-4">
                                        <span className="block font-bold text-foreground">
                                            Variación de Saldo
                                        </span>
                                        <p className="text-xs text-muted-foreground italic">
                                            Cálculo del stock resultante tras la
                                            operación.
                                        </p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: KARDEX --- */}
                    <TabsContent
                        value="kardex"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-2">
                            <div className="space-y-6">
                                <h4 className="flex items-center gap-2 text-lg font-bold">
                                    Generación de Reporte Kardex
                                </h4>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    El sistema permite exportar auditorías en
                                    formato Excel/CSV con el detalle cronológico
                                    de inventario.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                                            1
                                        </div>
                                        <div>
                                            <span className="block font-bold text-foreground">
                                                Descarga Masiva
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                Exporta el historial de{' '}
                                                <strong>
                                                    todos los productos
                                                </strong>{' '}
                                                registrados en el sistema.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                                            2
                                        </div>
                                        <div>
                                            <span className="block font-bold text-foreground">
                                                Selección Específica
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                Filtra y genera el Kardex solo
                                                para los artículos
                                                seleccionados.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Screenshot
                                src="/images/manual/inventario/exportarKardexDark.png"
                                alt="Exportar Kardex"
                                caption="Opciones de descarga y exportación de datos"
                            />
                        </div>

                        <Card className="overflow-hidden border-dashed">
                            <div className="border-b bg-muted/50 p-4">
                                <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Estructura del Reporte Generado
                                </span>
                            </div>
                            <CardContent className="p-0">
                                <div className="p-6 font-mono text-[11px] leading-relaxed text-blue-600 dark:text-blue-400">
                                    Fecha | Producto | Tipo Operación | Entrada
                                    | Salida | Saldo Cant.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* FOOTER */}
                <div className="group relative flex items-center justify-between overflow-hidden rounded-3xl bg-amber-600 p-8 text-white shadow-2xl shadow-amber-500/30">
                    <div className="relative z-10 space-y-1">
                        <h4 className="text-2xl font-black tracking-tighter uppercase italic">
                            Control de Almacén
                        </h4>
                        <p className="text-sm font-medium opacity-90">
                            Recuerda realizar cruces periódicos entre el{' '}
                            <strong>Stock Actual</strong> y el inventario físico
                            para mantener la exactitud del sistema.
                        </p>
                    </div>
                    <CheckCircle2 className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20 transition-transform duration-700 group-hover:scale-110" />
                </div>
            </div>
        </AppLayout>
    );
}
