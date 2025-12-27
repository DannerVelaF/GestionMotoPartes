import { Math } from '@/components/Math';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import manual from '@/routes/manual';
import {
    BarChart3,
    CheckCircle2,
    FileSpreadsheet,
    Image as ImageIcon,
    MousePointerClick,
    PieChart,
    PlusCircle,
    ShieldCheck,
    ShoppingBag,
    Target,
    TrendingUp,
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
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border-4 border-muted bg-muted/20 shadow-2xl shadow-blue-500/10 transition-all hover:border-blue-500/30">
            <img src={src} alt={alt} className="h-auto w-full object-cover" />
        </div>
        {caption && (
            <p className="flex items-center gap-2 text-center text-[10px] font-black tracking-widest text-muted-foreground uppercase italic">
                <ImageIcon className="h-3 w-3" /> {caption}
            </p>
        )}
    </div>
);

export default function SalesManual() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Manual de Uso', href: manual.index().url },
                { title: 'Ventas', href: '' },
            ]}
        >
            <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
                {/* --- CABECERA --- */}
                <div className="flex flex-col items-center space-y-4 border-b pb-10 text-center">
                    <div className="rounded-3xl bg-emerald-600 p-4 shadow-xl shadow-emerald-500/20">
                        <ShoppingBag className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                            Gestión de Ventas
                        </h1>
                        <p className="text-lg font-medium text-muted-foreground">
                            Control de salida de inventario, facturación y
                            análisis de rendimiento comercial.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="registro" className="w-full">
                    <TabsList className="grid h-14 w-full grid-cols-2 rounded-2xl bg-muted/50 p-1.5">
                        <TabsTrigger
                            value="registro"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Registro de
                            Venta
                        </TabsTrigger>
                        <TabsTrigger
                            value="analitica"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                            <BarChart3 className="mr-2 h-4 w-4" /> Analítica de
                            Ventas
                        </TabsTrigger>
                    </TabsList>

                    {/* --- CONTENIDO: REGISTRO DE VENTA --- */}
                    <TabsContent
                        value="registro"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <Screenshot
                            src="/images/manual/ventas/nuevaVentaDark.png"
                            alt="Interfaz Nueva Venta"
                            caption="Formulario de facturación y registro en tiempo real"
                        />
                        <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-8 md:grid-cols-2">
                            <div className="flex flex-col justify-center space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
                                <h4 className="flex items-center gap-2 border-b pb-4 text-xs font-black tracking-widest text-blue-600 uppercase">
                                    <MousePointerClick className="h-4 w-4" />
                                    Guía de Facturación Paso a Paso
                                </h4>
                                <ul className="space-y-6 text-sm font-medium">
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-blue-500">
                                            01.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold text-foreground">
                                                Identificación del Cliente
                                            </span>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                Busca por RUC o DNI. El sistema
                                                cargará la razón social y
                                                permitirá agrupar el historial
                                                de ventas por cliente.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-blue-500">
                                            02.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold text-foreground">
                                                Documentos de Venta
                                            </span>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                Emisión de{' '}
                                                <strong>Notas de Venta</strong>,{' '}
                                                <strong>Boletas</strong> o{' '}
                                                <strong>Facturas</strong> con
                                                gestión automática de series y
                                                correlativos.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-blue-500">
                                            03.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold text-foreground">
                                                Selección de Artículos
                                            </span>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                Solo se visualizan productos en
                                                estado <strong>activo</strong>{' '}
                                                con su respectivo stock y precio
                                                sugerido.
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-6">
                                <Card className="flex flex-col justify-center rounded-2xl border-blue-200 bg-blue-50/50 shadow-sm dark:bg-blue-950/10">
                                    <CardContent className="flex flex-col items-center space-y-5 p-8 text-center">
                                        <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
                                            <ShieldCheck className="h-8 w-8 text-blue-700 dark:text-blue-500" />
                                        </div>
                                        <h4 className="text-base font-black tracking-tight text-blue-700 uppercase">
                                            Validación de Inventario
                                        </h4>
                                        <p className="text-xs font-medium text-balance text-blue-900/80 dark:text-blue-400">
                                            El sistema bloquea automáticamente
                                            transacciones que excedan el stock
                                            físico disponible en el almacén.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: ANALÍTICA (Basado en Controller PHP) --- */}
                    <TabsContent
                        value="analitica"
                        className="mt-10 animate-in space-y-12 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                Inteligencia de Negocio
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Análisis comercial basado en el procesamiento de
                                datos del historial de ventas.
                            </p>
                        </div>

                        {/* ANÁLISIS DE INGRESOS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground uppercase italic">
                                        Análisis de Ingresos
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Seguimiento de recaudación y flujo de
                                        órdenes.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Permite agrupar la recaudación de forma{' '}
                                        <strong>
                                            diaria, semanal, mensual o anual
                                        </strong>
                                        . El sistema calcula automáticamente el
                                        ticket promedio para medir la eficiencia
                                        comercial por periodo.
                                    </p>
                                    <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase italic">
                                            Métrica de Rendimiento:
                                        </p>
                                        <div className="text-sm text-blue-600 dark:text-blue-400">
                                            <Math formula="\text{Ticket Promedio} = \frac{\sum \text{Total}}{\text{Cant. Transacciones}}" />
                                        </div>
                                    </div>
                                </div>
                                <Screenshot
                                    src="/images/manual/ventas/analisisIngresosDark.png"
                                    alt="Dashboard de Ingresos"
                                    caption="Visualización de tendencia de ingresos y conteo de operaciones"
                                />
                            </div>
                        </div>

                        {/* REPORTE TAX (LIBRO DE VENTAS) */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                                    <FileSpreadsheet className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground uppercase italic">
                                        Libro de Ventas (IGV)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Desglose tributario según normativa
                                        vigente.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <Screenshot
                                    src="/images/manual/ventas/libroVentasDark.png"
                                    alt="Reporte Fiscal"
                                    caption="Resumen de impuestos y base imponible por tipo de documento"
                                />
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed font-medium text-muted-foreground">
                                        Genera el cálculo automático del{' '}
                                        <strong>IGV (18%)</strong> recaudado,
                                        agrupando los montos por tipo de
                                        documento contable.
                                    </p>
                                    <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            Fórmula Contable Aplicada:
                                        </p>
                                        <div className="text-sm text-blue-600 dark:text-blue-400">
                                            <Math formula="\text{Base Imp.} = \frac{\text{Total}}{1.18}" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RENDIMIENTO (PRODUCTOS Y MARCAS) */}
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <div className="space-y-4 rounded-3xl border bg-card p-6">
                                <div className="flex items-center gap-3">
                                    <Target className="h-5 w-5 text-orange-500" />
                                    <h4 className="font-bold text-foreground uppercase italic">
                                        Productos Estrella
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                    Identifica los 15 productos con mayor
                                    rotación y volumen de recaudación en el
                                    rango seleccionado.
                                </p>
                                <Screenshot
                                    src="/images/manual/ventas/productosEstrellaDark.png"
                                    alt="Ranking de Productos"
                                    caption="Top Sellers por cantidad y revenue total"
                                />
                            </div>

                            <div className="space-y-4 rounded-3xl border bg-card p-6">
                                <div className="flex items-center gap-3">
                                    <PieChart className="h-5 w-5 text-purple-500" />
                                    <h4 className="font-bold text-foreground uppercase italic">
                                        Ventas por Marca
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                    Visualización del{' '}
                                    <strong>Market Share</strong> interno para
                                    determinar la participación porcentual de
                                    cada marca en los ingresos.
                                </p>
                                <Screenshot
                                    src="/images/manual/ventas/analisisMarcasDark.png"
                                    alt="Participación de Marcas"
                                    caption="Distribución de mercado por fabricante"
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* FOOTER */}
                <div className="group relative flex items-center justify-between overflow-hidden rounded-3xl bg-emerald-600 p-8 text-white shadow-2xl shadow-emerald-500/30">
                    <div className="relative z-10 space-y-1">
                        <h4 className="text-2xl font-black tracking-tighter uppercase italic">
                            Optimización de Stock
                        </h4>
                        <p className="text-sm font-medium opacity-90">
                            Utiliza el reporte de **Productos Estrella** para
                            priorizar tus pedidos de reposición.
                        </p>
                    </div>
                    <CheckCircle2 className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20 transition-transform duration-700 group-hover:scale-110" />
                </div>
            </div>
        </AppLayout>
    );
}
