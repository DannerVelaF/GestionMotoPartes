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
                            Domina el registro de abastecimiento y control de
                            inventario de entrada.
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
                                                Selecciona el proveedor y digita
                                                la serie y número real del
                                                documento. El sistema generará
                                                un código interno único para
                                                seguimiento.
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
                                                Define la{' '}
                                                <strong>
                                                    Fecha y Hora de Recepción
                                                </strong>{' '}
                                                exacta y sube el comprobante
                                                digital (PDF/JPG) para auditoría
                                                inmediata.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-blue-500">
                                            03.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold text-foreground">
                                                Líneas de Abastecimiento
                                            </span>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                Agrega los productos, define la
                                                cantidad ingresada y el{' '}
                                                <strong>Costo Unitario</strong>.
                                                El subtotal se calculará
                                                automáticamente.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-blue-500">
                                            04.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold text-blue-600 text-foreground">
                                                Validación de Márgenes
                                            </span>
                                            <p className="text-xs leading-relaxed font-semibold text-muted-foreground italic">
                                                El sistema calculará el margen
                                                de ganancia en tiempo real. No
                                                se permite guardar si el costo
                                                supera al precio de venta.
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
                                            la entrega física para que el
                                            historial de saldos sea coherente.
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
                                        En la parte inferior derecha, verás el
                                        desglose automático de la{' '}
                                        <strong>Base Imponible</strong> y el{' '}
                                        <strong>IGV (18%)</strong> basado en el
                                        Total Compra.
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
                                encabezado para mantener la trazabilidad exacta.
                            </p>
                        </div>
                        <Screenshot
                            src="/images/manual/comprobantes/editarComprobanteDark.png"
                            alt="Pantalla Editar Compra"
                            caption="Los campos de cantidad permanecen bloqueados para proteger el stock"
                        />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="text-xs font-black tracking-widest uppercase">
                                        Cambios de Referencia
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Puedes corregir serie, número o fecha. Verás
                                    el aviso de{' '}
                                    <strong>"Cambios sin Guardar"</strong> hasta
                                    confirmar.
                                </p>
                            </div>
                            <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                                <div className="flex items-center gap-2 text-red-600">
                                    <XCircle className="h-5 w-5" />
                                    <span className="text-xs font-black tracking-widest uppercase">
                                        Stock Inalterable
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    No se permite editar cantidades aquí. Para
                                    errores de stock, usa la pestaña de{' '}
                                    <strong>Eliminación</strong>.
                                </p>
                            </div>
                            <div className="space-y-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
                                <div className="flex items-center gap-2 text-blue-600">
                                    <ShieldCheck className="h-5 w-5" />
                                    <span className="text-xs font-black tracking-widest uppercase">
                                        Integridad de Kardex
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Si modificas la fecha, el sistema reordenará
                                    automáticamente los movimientos en el
                                    historial.
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
                                El método correcto para corregir errores de
                                cantidad o ingresos fallidos es la eliminación
                                completa del registro.
                            </p>
                        </div>

                        {/* Paso 1: Acceso */}
                        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold">
                                    1. Acceso al Menú
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Dentro de la vista del comprobante, haz clic
                                    en los <strong>tres puntos (⋮)</strong>{' '}
                                    junto al código del registro para desplegar
                                    las opciones de gestión.
                                </p>
                            </div>
                            <Screenshot
                                src="/images/manual/comprobantes/menuOpcionesDark.png"
                                alt="Menú de opciones"
                                caption="Ubicación del botón de eliminación"
                            />
                        </div>

                        {/* Paso 2: Confirmación */}
                        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                            <Screenshot
                                src="/images/manual/comprobantes/dialogoEliminarDark.png"
                                alt="Confirmación de eliminación"
                                caption="Dialogo de seguridad para evitar errores"
                            />
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold">
                                    2. Confirmación Obligatoria
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Aparecerá un diálogo de advertencia. Al
                                    confirmar con{' '}
                                    <strong>"Sí, eliminar"</strong>, el registro
                                    se borrará de forma permanente de la base de
                                    datos.
                                </p>
                            </div>
                        </div>

                        {/* Paso 3: Resultado en Kardex */}
                        <div className="space-y-6">
                            <div className="text-center">
                                <h4 className="text-lg font-bold">
                                    3. Impacto en el Inventario (Reversión)
                                </h4>
                                <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
                                    Al eliminar el comprobante, el sistema
                                    genera automáticamente un{' '}
                                    <strong>Ajuste de Stock</strong> negativo
                                    por la misma cantidad ingresada, devolviendo
                                    el saldo del producto a su estado anterior.
                                </p>
                            </div>
                            <Screenshot
                                src="/images/manual/comprobantes/ajusteKardexComprobanteDark.png"
                                alt="Historial de movimientos"
                                caption="El Kardex muestra la anulación de compra restando el stock ingresado"
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
                                Proceso para retornar mercadería al proveedor,
                                ajustando el stock real y generando el sustento
                                legal interno.
                            </p>
                        </div>

                        {/* Paso 1: El Modal */}
                        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                            <div className="space-y-6">
                                <h4 className="flex items-center gap-2 text-lg font-bold">
                                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                                        <MousePointerClick className="h-5 w-5 text-blue-600" />
                                    </div>
                                    1. Configurar la Devolución
                                </h4>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Desde el menú de opciones (⋮), selecciona{' '}
                                    <strong>"Devolución"</strong>. Se abrirá un
                                    panel donde podrás ver:
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-xs font-medium">
                                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        <span>
                                            <strong>Stock Actual:</strong> El
                                            sistema valida qué cantidad tienes
                                            realmente en almacén para evitar
                                            devoluciones de productos
                                            inexistentes.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3 text-xs font-medium">
                                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        <span>
                                            <strong>Cant. Devolver:</strong>{' '}
                                            Digita las unidades que saldrán del
                                            inventario. El sistema calculará el
                                            reembolso automáticamente.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <Screenshot
                                src="/images/manual/comprobantes/modalDevolucionDark.png"
                                alt="Modal de Devolución"
                                caption="Interfaz de ajuste de cantidades para devolución"
                            />
                        </div>

                        <div className="rounded-2xl border border-dashed p-1">
                            <div className="rounded-xl bg-muted/30 p-8">
                                <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                                    {/* Paso 2: Nota de Crédito */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold">
                                            2. Emisión de Nota de Crédito
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Al confirmar, el sistema genera
                                            automáticamente un documento de{' '}
                                            <strong>Nota de Crédito</strong>{' '}
                                            vinculado al comprobante original.
                                            Este documento detalla los productos
                                            devueltos y el monto total a favor.
                                        </p>
                                        <Screenshot
                                            src="/images/manual/comprobantes/notaCreditoDetalleDark.png"
                                            alt="Detalle de Nota de Crédito"
                                            caption="Documento generado con el detalle de la operación"
                                        />
                                    </div>

                                    {/* Paso 3: Kardex */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold">
                                            3. Registro Automático en Kardex
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Cada devolución genera un movimiento
                                            tipo{' '}
                                            <strong>
                                                "DEVOLUCIÓN COMPRA (NC)"
                                            </strong>{' '}
                                            con cantidad negativa, restando el
                                            stock de forma inmediata y
                                            actualizando el saldo del producto.
                                        </p>
                                        <Screenshot
                                            src="/images/manual/comprobantes/kardexDevolucionDark.png"
                                            alt="Kardex con Devolución"
                                            caption="Visualización del egreso por devolución en el historial"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Alerta de Validación */}
                        <Card className="rounded-2xl border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
                            <CardContent className="flex items-start gap-5 p-6">
                                <AlertTriangle className="h-6 w-6 shrink-0 text-blue-600" />
                                <div className="space-y-1">
                                    <h5 className="text-sm font-black tracking-widest text-blue-700 uppercase">
                                        Regla de Validación de Almacén
                                    </h5>
                                    <p className="text-xs font-medium text-blue-900/80 dark:text-blue-400">
                                        No puedes devolver una cantidad mayor a
                                        la que tienes en{' '}
                                        <strong>Stock Actual</strong>, incluso
                                        si compraste más originalmente. Esto
                                        asegura que tu inventario físico nunca
                                        sea negativo.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent
                        value="analitica"
                        className="mt-10 animate-in space-y-12 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                Reportes y Analítica Estratégica
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Transforma los datos de abastecimiento en
                                información clave para la toma de decisiones
                                financieras y logísticas.
                            </p>
                        </div>

                        {/* SECCIÓN 1: LIBRO DE COMPRAS */}
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
                                        Auditoría contable y control de crédito
                                        fiscal.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Este reporte desglosa el impacto
                                        impositivo de tus compras basándose en
                                        la normativa fiscal (IGV 18%). Permite
                                        filtrar por rangos de fecha y exportar a
                                        CSV para declaraciones mensuales.
                                    </p>
                                    <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            Lógica de Cálculo:
                                        </p>
                                        <div className="flex flex-col gap-2 font-mono text-xs text-blue-600 dark:text-blue-400">
                                            <span>
                                                {
                                                    '$Base\\ Imponible = \\frac{Total}{1.18}$'
                                                }
                                            </span>
                                            <span>
                                                {
                                                    '$IGV = Total - Base\\ Imponible$'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Screenshot
                                    src="/images/manual/comprobantes/libroComprasDark.png"
                                    alt="Vista Libro de Compras"
                                    caption="Resumen de egresos y composición del gasto por tipo de documento"
                                />
                            </div>
                        </div>

                        {/* SECCIÓN 2: MARGEN Y RENTABILIDAD */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase italic">
                                        Análisis de Margen
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Rentabilidad proyectada basada en stock
                                        recibido.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <Screenshot
                                    src="/images/manual/comprobantes/analisisMargenDark.png"
                                    alt="Análisis de Margen"
                                    caption="Identificación de items críticos con margen menor al 15%"
                                />
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Cruza el <strong>Costo Promedio</strong>{' '}
                                        de las facturas recibidas contra el{' '}
                                        <strong>Precio de Venta</strong> actual
                                        del maestro de productos.
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex gap-3 text-xs">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>
                                                <strong>
                                                    Utilidad Proyectada:
                                                </strong>{' '}
                                                Estimación de ganancia total
                                                basada en el stock disponible.
                                            </span>
                                        </li>
                                        <li className="flex gap-3 text-xs font-bold text-red-500">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <span>
                                                <strong>Items Críticos:</strong>{' '}
                                                El sistema alerta si el margen
                                                de un producto cae por debajo
                                                del 15%.
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: PROVEEDORES Y VARIACIÓN */}
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            {/* Card Proveedores */}
                            <div className="space-y-4 rounded-3xl border bg-card p-6">
                                <div className="flex items-center gap-3">
                                    <PieChart className="h-5 w-5 text-orange-500" />
                                    <h4 className="font-bold uppercase italic">
                                        Ranking de Inversión
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Identifica a los proveedores con mayor
                                    volumen de compra y frecuencia de
                                    abastecimiento en el periodo.
                                </p>
                                <Screenshot
                                    src="/images/manual/comprobantes/gestionProveedoresDark.png"
                                    alt="Ranking Proveedores"
                                    caption="Distribución de inversión por aliado comercial"
                                />
                            </div>

                            {/* Card Variación */}
                            <div className="space-y-4 rounded-3xl border bg-card p-6">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                    <h4 className="font-bold uppercase italic">
                                        Variación de Costos
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Rastrea la trazabilidad inflacionaria.
                                    Compara el primer precio registrado vs el
                                    último para detectar variaciones.
                                </p>
                                <Screenshot
                                    src="/images/manual/comprobantes/variacionCostosDark.png"
                                    alt="Variación de Costos"
                                    caption="Curva histórica de precios por producto"
                                />
                            </div>
                        </div>

                        {/* BLOQUEO DE PÉRDIDAS */}
                        <div className="rounded-2xl border-l-4 border-red-600 bg-red-600/5 p-6">
                            <div className="flex items-center gap-4">
                                <ShieldCheck className="h-8 w-8 text-red-600" />
                                <div>
                                    <h4 className="text-sm font-black text-red-600 uppercase">
                                        Sistema Preventivo de Rentabilidad
                                    </h4>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        El sistema{' '}
                                        <strong>bloquea automáticamente</strong>{' '}
                                        el registro de cualquier compra donde el{' '}
                                        <strong>Costo Unitario</strong> sea
                                        superior al{' '}
                                        <strong>Precio de Venta</strong>{' '}
                                        sugerido, evitando que el ingreso de
                                        mercadería genere pérdida inmediata.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* FOOTER */}
                <div className="group relative flex items-center justify-between overflow-hidden rounded-3xl bg-emerald-600 p-8 text-white shadow-2xl shadow-emerald-500/30">
                    <div className="relative z-10 space-y-1">
                        <h4 className="text-2xl font-black tracking-tighter uppercase italic">
                            ¿Dudas con los totales?
                        </h4>
                        <p className="text-sm font-medium opacity-90">
                            Verifica siempre el recuadro inferior derecho de{' '}
                            <strong>"Total Compra"</strong> antes de registrar.
                        </p>
                    </div>
                    <CheckCircle2 className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20 transition-transform duration-700 group-hover:scale-110" />
                </div>
            </div>
        </AppLayout>
    );
}
