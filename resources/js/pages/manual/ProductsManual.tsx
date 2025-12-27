import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import manual from '@/routes/manual';
import {
    Archive,
    CheckCircle2,
    History,
    Image as ImageIcon,
    LayoutDashboard,
    MousePointerClick,
    Package,
    PencilLine,
    PlusCircle,
    ShoppingBag,
    Tags,
    Trash2,
    TrendingUp,
} from 'lucide-react';

// --- Sub-componente para Capturas de Pantalla Adaptativo ---
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
        {/* Borde sutil y fondo transparente adaptable */}
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-2xl shadow-indigo-500/5 transition-all hover:border-indigo-500/30 dark:shadow-none">
            <img src={src} alt={alt} className="h-auto w-full object-cover" />
        </div>
        {caption && (
            <p className="flex items-center gap-2 text-center text-[10px] font-black tracking-widest text-muted-foreground uppercase italic">
                <ImageIcon className="h-3 w-3" /> {caption}
            </p>
        )}
    </div>
);

export default function ProductsManual() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Manual de Uso', href: manual.index().url },
                { title: 'Productos', href: '' },
            ]}
        >
            <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
                {/* --- CABECERA --- */}
                <div className="flex flex-col items-center space-y-4 border-b pb-10 text-center">
                    <div className="rounded-3xl bg-indigo-600 p-4 shadow-xl shadow-indigo-500/20 dark:border dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:shadow-none">
                        <Package className="h-10 w-10 text-white dark:text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                            Gestión de Productos
                        </h1>
                        <p className="text-lg font-medium text-muted-foreground">
                            Administra tu catálogo maestro, clasificaciones y
                            trazabilidad de artículos.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="catalogo" className="w-full">
                    <TabsList className="grid h-14 w-full grid-cols-3 rounded-2xl bg-muted/50 p-1.5 dark:bg-muted/20">
                        <TabsTrigger
                            value="catalogo"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:bg-indigo-500"
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />{' '}
                            Catálogo Kanban
                        </TabsTrigger>
                        <TabsTrigger
                            value="registro"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:bg-indigo-500"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Registro
                        </TabsTrigger>
                        <TabsTrigger
                            value="ficha"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:bg-indigo-500"
                        >
                            <PencilLine className="mr-2 h-4 w-4" /> Ficha
                            Técnica
                        </TabsTrigger>
                    </TabsList>

                    {/* --- CONTENIDO: CATÁLOGO KANBAN --- */}
                    <TabsContent
                        value="catalogo"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <Screenshot
                            src="/images/manual/productos/listaKanbanDark.png"
                            alt="Lista Kanban"
                            caption="Vista de tarjetas con información clave"
                        />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm transition-colors dark:bg-muted/5">
                                <h4 className="flex items-center gap-2 border-b pb-4 text-xs font-black tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
                                    Acciones Masivas
                                </h4>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <div className="rounded-full bg-red-500/10 p-2 dark:bg-red-500/20">
                                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <span className="text-xs font-medium text-foreground">
                                            <strong>Eliminar:</strong> Borra
                                            registros sin historial vinculado.
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="rounded-full bg-amber-500/10 p-2 dark:bg-amber-500/20">
                                            <Archive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="text-xs font-medium text-foreground">
                                            <strong>Inactivar:</strong> Oculta
                                            el producto sin borrar datos.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div className="flex flex-col justify-center space-y-4 rounded-2xl border border-indigo-200/50 bg-indigo-50/5 p-8 text-center dark:border-indigo-500/20 dark:bg-indigo-500/5">
                                <MousePointerClick className="mx-auto h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                <h4 className="text-base font-black text-indigo-700 uppercase dark:text-indigo-400">
                                    Edición Directa
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Haz clic en cualquier tarjeta para abrir el
                                    panel de edición avanzada.
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: REGISTRO --- */}
                    <TabsContent
                        value="registro"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                            <div className="flex flex-col justify-center space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
                                <h4 className="flex items-center gap-2 border-b pb-4 text-xs font-black tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
                                    Pasos de Registro
                                </h4>
                                <ul className="space-y-5 text-sm font-medium text-foreground">
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-indigo-500">
                                            01.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold">
                                                Datos Maestros
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                Nombre, SKU y precio de venta.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="shrink-0 text-lg font-black text-indigo-500">
                                            02.
                                        </span>
                                        <div className="space-y-1">
                                            <span className="block font-bold">
                                                Marcas y Categorías
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                Clasifica por fabricante y
                                                familia de productos.
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <Screenshot
                                src="/images/manual/productos/formularioRegistroDark.png"
                                alt="Formulario Registro"
                                caption="Panel centralizado de creación"
                            />
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: FICHA TÉCNICA (SIMÉTRICO) --- */}
                    <TabsContent
                        value="ficha"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                Trazabilidad Individual
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground italic">
                                Analítica filtrada específicamente por artículo.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    {
                                        icon: <Tags className="h-5 w-5" />,
                                        title: 'General',
                                        desc: 'Precios y códigos.',
                                    },
                                    {
                                        icon: (
                                            <ShoppingBag className="h-5 w-5" />
                                        ),
                                        title: 'Ventas',
                                        desc: 'Historial de salidas.',
                                    },
                                    {
                                        icon: (
                                            <TrendingUp className="h-5 w-5" />
                                        ),
                                        title: 'Compras',
                                        desc: 'Registro de ingresos.',
                                    },
                                    {
                                        icon: <History className="h-5 w-5" />,
                                        title: 'Inventario',
                                        desc: 'Kardex del item.',
                                    },
                                ].map((tab, idx) => (
                                    <div
                                        key={idx}
                                        className="space-y-2 rounded-xl border border-border bg-card p-5 transition-all hover:bg-muted/50 dark:hover:bg-indigo-500/5"
                                    >
                                        <div className="text-indigo-600 dark:text-indigo-400">
                                            {tab.icon}
                                        </div>
                                        <h5 className="text-[11px] font-black tracking-widest text-foreground uppercase">
                                            {tab.title}
                                        </h5>
                                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                                            {tab.desc}
                                        </p>
                                    </div>
                                ))}
                                <div className="col-span-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
                                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                            Nota:
                                        </span>{' '}
                                        Los saldos se sincronizan
                                        automáticamente.
                                    </p>
                                </div>
                            </div>
                            <div className="w-full">
                                <Screenshot
                                    src="/images/manual/productos/fichaEdicionDark.png"
                                    alt="Edición Avanzada"
                                    caption="Panel de control individual"
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* --- FOOTER (CORREGIDO ESTILO CARD) --- */}
                {/* Aquí aplicamos la lógica exacta del Card que mencionaste:
                    - Fondo limpio (bg-card / dark:bg-slate-950) en lugar de sólido azul.
                    - Borde coloreado (border-indigo-200) para dar la identidad.
                    - Texto normal (text-foreground / text-muted-foreground) para máxima legibilidad.
                    - Icono coloreado (text-indigo-600) como punto focal.
                */}
                <div className="group relative flex flex-col items-center justify-between overflow-hidden rounded-3xl border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-8 shadow-xl shadow-indigo-500/10 md:flex-row dark:border-indigo-500/20 dark:from-slate-950 dark:to-indigo-950/10 dark:shadow-none">
                    <div className="relative z-10 space-y-1 text-center md:text-left">
                        <h4 className="text-2xl font-black tracking-tighter text-foreground uppercase italic">
                            Control de Catálogo
                        </h4>
                        <p className="text-sm font-medium text-muted-foreground opacity-90">
                            Mantén marcas y categorías actualizadas para obtener
                            reportes precisos.
                        </p>
                    </div>

                    <CheckCircle2 className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-600 opacity-10 transition-transform duration-700 group-hover:scale-110 dark:text-indigo-400 dark:opacity-20" />

                    <div className="relative z-10 mt-4 rounded-full border border-indigo-200 bg-indigo-100/50 px-4 py-2 md:mt-0 dark:border-indigo-500/30 dark:bg-indigo-500/10">
                        <span className="text-[10px] font-bold tracking-widest text-indigo-700 uppercase dark:text-indigo-300">
                            Tip de Gestión
                        </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
