import { Math } from '@/components/Math';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import manual from '@/routes/manual';
import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    Image as ImageIcon,
    MousePointerClick,
    PencilLine,
    PieChart,
    PlusCircle,
    ShieldCheck,
    Trash2,
    TrendingUp,
    Truck,
    Undo2,
    XCircle,
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

export default function ReceiptsManual() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Manual de Uso', href: manual.index().url },
                { title: 'Comprobantes', href: '' },
            ]}
        >
            <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
                {/* --- CABECERA --- */}
                <div className="flex flex-col items-center space-y-4 border-b pb-10 text-center">
                    <div className="rounded-3xl bg-blue-600 p-4 shadow-xl shadow-blue-500/20">
                        <Truck className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                            Gestión de Comprobantes
                        </h1>
                        <p className="text-lg font-medium text-muted-foreground">
                            Domina el registro de abastecimiento y control
                            estratégico de inventario de entrada.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="registro" className="w-full">
                    <TabsList className="grid h-14 w-full grid-cols-5 rounded-2xl bg-muted/50 p-1.5">
                        <TabsTrigger
                            value="registro"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Registro
                        </TabsTrigger>
                        <TabsTrigger
                            value="edicion"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                            <PencilLine className="mr-2 h-4 w-4" /> Edición
                        </TabsTrigger>
                        <TabsTrigger
                            value="eliminacion"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-red-600 data-[state=active]:text-white"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminación
                        </TabsTrigger>
                        <TabsTrigger
                            value="devolucion"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                            <Undo2 className="mr-2 h-4 w-4" /> Devolución
                        </TabsTrigger>
                        <TabsTrigger
                            value="analitica"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                            <BarChart3 className="mr-2 h-4 w-4" /> Analítica
                        </TabsTrigger>
                    </TabsList>

                    {/* --- CONTENIDO: REGISTRO --- */}
                    <TabsContent
                        value="registro"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <Screenshot
                            src="/images/manual/comprobantes/nuevoComprobanteDark.png"
                            alt="Pantalla Nueva Compra"
                            caption="Interfaz completa de registro de abastecimiento"
                        />
                        <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-8 md:grid-cols-2">
                            <div className="flex flex-col justify-center space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
                                <h4 className="flex items-center gap-2 border-b pb-4 text-xs font-black tracking-widest text-blue-600 uppercase">
                                    <MousePointerClick className="h-4 w-4" />
                                    Guía de Llenado Paso a Paso
                                </h4>
                                <ul className="space-y-6 text-sm font-medium">
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-blue-500">
                                            01.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold text-foreground">
                                                Proveedor y Referencia
                                            </span>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                Busca al proveedor y digita la
                                                serie/número del documento
                                                físico.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-blue-500">
                                            02.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold text-foreground">
                                                Cronología y Adjuntos
                                            </span>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                Define la fecha exacta para el
                                                Kardex y sube el PDF/Foto del
                                                documento.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-blue-500">
                                            03.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold text-foreground">
                                                Líneas de Compra
                                            </span>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                Agrega productos y define el{' '}
                                                <strong>Costo Unitario</strong>{' '}
                                                recibido.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-blue-500">
                                            04.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold text-blue-600">
                                                Validación de Margen
                                            </span>
                                            <p className="text-xs leading-relaxed font-semibold text-muted-foreground italic">
                                                El sistema bloquea el registro
                                                si el costo supera al precio de
                                                venta.
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-6">
                                <Card className="flex flex-col justify-center rounded-2xl border-amber-200 bg-amber-50/50 shadow-sm dark:bg-amber-950/10">
                                    <CardContent className="flex flex-col items-center space-y-5 p-8 text-center">
                                        <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
                                            <Clock className="h-8 w-8 text-amber-700 dark:text-amber-500" />
                                        </div>
                                        <h4 className="text-base font-black tracking-tight text-amber-700 uppercase">
                                            Sincronización del Kardex
                                        </h4>
                                        <p className="text-xs font-medium text-balance text-amber-900/80 dark:text-amber-400">
                                            Es crucial que la fecha coincida con
                                            la entrega física para cálculos de
                                            saldos correctos.
                                        </p>
                                    </CardContent>
                                </Card>
                                <div className="rounded-2xl border-l-4 border-blue-600 bg-blue-600/5 p-6">
                                    <div className="mb-2 flex items-center gap-3 text-blue-700 dark:text-blue-400">
                                        <ShieldCheck className="h-5 w-5" />
                                        <span className="text-xs font-black tracking-widest uppercase">
                                            Control Fiscal
                                        </span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        El sistema calcula automáticamente la{' '}
                                        <strong>Base Imponible</strong> y el{' '}
                                        <strong>IGV (18%)</strong> en el pie del
                                        formulario.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: EDICIÓN --- */}
                    <TabsContent
                        value="edicion"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight uppercase">
                                Modificar Datos Referenciales
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Solo se permite la edición de información de
                                encabezado para proteger la integridad del
                                stock.
                            </p>
                        </div>
                        <Screenshot
                            src="/images/manual/comprobantes/editarComprobanteDark.png"
                            alt="Editar Compra"
                            caption="Los campos de cantidad permanecen bloqueados"
                        />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="text-xs font-black uppercase">
                                        Correcciones
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Puedes corregir serie, número o fecha de
                                    emisión.
                                </p>
                            </div>
                            <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                                <div className="flex items-center gap-2 text-red-600">
                                    <XCircle className="h-5 w-5" />
                                    <span className="text-xs font-black uppercase">
                                        Cantidades
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Para errores de stock, debe anularse el
                                    documento completo.
                                </p>
                            </div>
                            <div className="space-y-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
                                <div className="flex items-center gap-2 text-blue-600">
                                    <ShieldCheck className="h-5 w-5" />
                                    <span className="text-xs font-black uppercase">
                                        Trazabilidad
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Cualquier cambio de fecha reordenará
                                    automáticamente el historial del Kardex.
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: ELIMINACIÓN --- */}
                    <TabsContent
                        value="eliminacion"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-red-600 uppercase">
                                Anulación de Registros
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Elimina registros fallidos para revertir el
                                impacto en el inventario.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold">
                                    1. Acceso al Menú
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Haz clic en los{' '}
                                    <strong>tres puntos (⋮)</strong> junto al
                                    código del registro.
                                </p>
                            </div>
                            <Screenshot
                                src="/images/manual/comprobantes/menuOpcionesDark.png"
                                alt="Menú"
                                caption="Opción de eliminación"
                            />
                        </div>
                        <div className="space-y-6">
                            <div className="text-center">
                                <h4 className="text-lg font-bold">
                                    2. Impacto en Inventario (Reversión)
                                </h4>
                                <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
                                    El sistema genera un{' '}
                                    <strong>Ajuste de Stock negativo</strong>{' '}
                                    automático, devolviendo el saldo al estado
                                    previo.
                                </p>
                            </div>
                            <Screenshot
                                src="/images/manual/comprobantes/ajusteKardexComprobanteDark.png"
                                alt="Impacto Kardex"
                                caption="El historial muestra la anulación restando la cantidad original"
                            />
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: DEVOLUCIÓN --- */}
                    <TabsContent
                        value="devolucion"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-blue-600 uppercase">
                                Devoluciones y Notas de Crédito
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Retorno de mercadería al proveedor con ajuste de
                                stock real.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                            <div className="space-y-6">
                                <h4 className="flex items-center gap-2 text-lg font-bold">
                                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                                        <Undo2 className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Gestión de Salida por Devolución
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Al seleccionar <strong>"Devolución"</strong>
                                    , el sistema valida:
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-xs font-medium">
                                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        <span>
                                            <strong>Stock Actual:</strong> Solo
                                            permite devolver lo que existe
                                            físicamente en almacén.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3 text-xs font-medium">
                                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        <span>
                                            <strong>Nota de Crédito:</strong>{' '}
                                            Genera un sustento vinculado al
                                            documento origen.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <Screenshot
                                src="/images/manual/comprobantes/modalDevolucionDark.png"
                                alt="Modal Devolución"
                                caption="Interfaz de validación de unidades a devolver"
                            />
                        </div>
                        <Screenshot
                            src="/images/manual/comprobantes/kardexDevolucionDark.png"
                            alt="Kardex Devolución"
                            caption="Movimiento negativo registrado como DEVOLUCIÓN COMPRA (NC)"
                        />
                    </TabsContent>

                    {/* --- CONTENIDO: ANALÍTICA --- */}
                    <TabsContent
                        value="analitica"
                        className="mt-10 animate-in space-y-12 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                Inteligencia de Abastecimiento
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Análisis de egresos, márgenes de ganancia y
                                desempeño de proveedores.
                            </p>
                        </div>

                        {/* LIBRO DE COMPRAS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
                                    <FileSpreadsheet className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase italic">
                                        Libro de Compras (IGV)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Auditoría contable y control fiscal.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Este reporte calcula automáticamente la
                                        carga tributaria basada en tus
                                        adquisiciones (IGV 18%).
                                    </p>
                                    <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            Cálculo Aplicado:
                                        </p>
                                        <div className="text-sm text-blue-600 dark:text-blue-400">
                                            <Math formula="\text{Base Imp.} = \frac{\text{Total}}{1.18}" />
                                        </div>
                                    </div>
                                </div>
                                <Screenshot
                                    src="/images/manual/comprobantes/libroComprasDark.png"
                                    alt="Reporte IGV"
                                    caption="Resumen de egresos y crédito fiscal"
                                />
                            </div>
                        </div>

                        {/* MARGEN Y RENTABILIDAD */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase italic">
                                        Margen y Rentabilidad
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Proyección de utilidad basada en costos
                                        reales.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <Screenshot
                                    src="/images/manual/comprobantes/analisisMargenDark.png"
                                    alt="Análisis Margen"
                                    caption="Identificación de productos con margen menor al 15%"
                                />
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Cruza el <strong>Costo Promedio</strong>{' '}
                                        registrado contra el{' '}
                                        <strong>Precio de Venta</strong> del
                                        maestro de productos para estimar la
                                        ganancia neta disponible.
                                    </p>
                                    <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            Fórmula de Utilidad:
                                        </p>
                                        <div className="text-sm text-blue-600 dark:text-blue-400">
                                            <Math formula="\text{Utilidad} = \sum (\text{Precio Venta} - \text{Costo Prom.}) \times \text{Stock}" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PROVEEDORES Y VARIACIÓN */}
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <div className="space-y-4 rounded-3xl border bg-card p-6">
                                <div className="flex items-center gap-3">
                                    <PieChart className="h-5 w-5 text-orange-500" />
                                    <h4 className="font-bold uppercase italic">
                                        Distribución de Gasto
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                    Ranking de inversión por aliado comercial y
                                    frecuencia de abastecimiento.
                                </p>
                                <Screenshot
                                    src="/images/manual/comprobantes/gestionProveedoresDark.png"
                                    alt="Proveedores"
                                    caption="Top de proveedores por volumen de inversión"
                                />
                            </div>
                            <div className="space-y-4 rounded-3xl border bg-card p-6">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                    <h4 className="font-bold uppercase italic">
                                        Variación de Costos
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                    Trazabilidad inflacionaria. Compara el
                                    primer precio registrado vs el último.
                                </p>
                                <Screenshot
                                    src="/images/manual/comprobantes/variacionCostosDark.png"
                                    alt="Variación"
                                    caption="Curva histórica de evolución de precios"
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* FOOTER */}
                <div className="group relative flex items-center justify-between overflow-hidden rounded-3xl bg-emerald-600 p-8 text-white shadow-2xl shadow-emerald-500/30">
                    <div className="relative z-10 space-y-1">
                        <h4 className="text-2xl font-black tracking-tighter uppercase italic">
                            Control de Totales
                        </h4>
                        <p className="text-sm font-medium opacity-90">
                            Verifica siempre la sección{' '}
                            <strong>"Total Compra"</strong> antes de confirmar
                            para asegurar la exactitud del Kardex.
                        </p>
                    </div>
                    <CheckCircle2 className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20 transition-transform duration-700 group-hover:scale-110" />
                </div>
            </div>
        </AppLayout>
    );
}
