import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import manual from '@/routes/manual';
import {
    BookUser,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    History,
    Image as ImageIcon,
    MousePointerClick,
    Phone,
    PlusCircle,
    Search,
    Truck,
    Upload,
    UserPlus,
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
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-2xl shadow-rose-500/5 transition-all hover:border-rose-500/30 dark:shadow-none">
            <img src={src} alt={alt} className="h-auto w-full object-cover" />
        </div>
        {caption && (
            <p className="flex items-center gap-2 text-center text-[10px] font-black tracking-widest text-muted-foreground uppercase italic">
                <ImageIcon className="h-3 w-3" /> {caption}
            </p>
        )}
    </div>
);

export default function SuppliersManual() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Manual de Uso', href: manual.index().url },
                { title: 'Proveedores', href: '' },
            ]}
        >
            <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
                {/* --- CABECERA --- */}
                <div className="flex flex-col items-center space-y-4 border-b pb-10 text-center">
                    <div className="rounded-3xl bg-rose-600 p-4 shadow-xl shadow-rose-500/20 dark:border dark:border-rose-500/30 dark:bg-rose-500/10 dark:shadow-none">
                        <Truck className="h-10 w-10 text-white dark:text-rose-400" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                            Gestión de Proveedores
                        </h1>
                        <p className="text-lg font-medium text-muted-foreground">
                            Directorio de aliados comerciales, importación
                            masiva y seguimiento de compras.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="directorio" className="w-full">
                    <TabsList className="grid h-14 w-full grid-cols-3 rounded-2xl bg-muted/50 p-1.5 dark:bg-muted/20">
                        <TabsTrigger
                            value="directorio"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-rose-600 data-[state=active]:text-white dark:data-[state=active]:bg-rose-500"
                        >
                            <BookUser className="mr-2 h-4 w-4" /> Directorio
                        </TabsTrigger>
                        <TabsTrigger
                            value="gestion"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-rose-600 data-[state=active]:text-white dark:data-[state=active]:bg-rose-500"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Alta y
                            Importación
                        </TabsTrigger>
                        <TabsTrigger
                            value="historial"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-rose-600 data-[state=active]:text-white dark:data-[state=active]:bg-rose-500"
                        >
                            <History className="mr-2 h-4 w-4" /> Historial
                            Compras
                        </TabsTrigger>
                    </TabsList>

                    {/* --- CONTENIDO: DIRECTORIO --- */}
                    <TabsContent
                        value="directorio"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                Agenda Comercial
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Accede rápidamente a la información de contacto
                                y estado de tus proveedores.
                            </p>
                        </div>
                        <Screenshot
                            src="/images/manual/proveedores/listaProveedoresDark.png"
                            alt="Directorio de Proveedores"
                            caption="Listado general con búsqueda por RUC o Razón Social"
                        />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm dark:bg-muted/5">
                                <h4 className="flex items-center gap-2 border-b pb-4 text-xs font-black tracking-widest text-rose-600 uppercase dark:text-rose-400">
                                    Funciones Rápidas
                                </h4>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <div className="rounded-full bg-rose-500/10 p-2 dark:bg-rose-500/20">
                                            <Search className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <span className="text-xs font-medium text-foreground">
                                            <strong>
                                                Búsqueda Inteligente:
                                            </strong>{' '}
                                            Filtra instantáneamente por nombre
                                            de la empresa o número de documento.
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="rounded-full bg-blue-500/10 p-2 dark:bg-blue-500/20">
                                            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-xs font-medium text-foreground">
                                            <strong>Contacto Directo:</strong>{' '}
                                            Visualiza teléfono y correo para
                                            gestiones inmediatas.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <Card className="flex flex-col justify-center rounded-2xl border border-rose-200/50 bg-rose-50/5 p-8 text-center shadow-sm dark:border-rose-500/20 dark:bg-rose-500/5">
                                <CardContent className="space-y-4 p-0">
                                    <MousePointerClick className="mx-auto h-8 w-8 text-rose-600 dark:text-rose-400" />
                                    <h4 className="text-base font-black text-rose-700 uppercase dark:text-rose-400">
                                        Edición del Proveedor
                                    </h4>
                                    <p className="text-xs font-medium text-balance text-rose-900/80 dark:text-rose-300">
                                        Edita la información adicional de los proveedores como la persona de contacto, dirección o estado
                                        actual. Mantén los datos actualizados para una comunicación efectiva.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: GESTIÓN (ALTA Y IMPORTACIÓN) --- */}
                    <TabsContent
                        value="gestion"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                            {/* Columna 1: Registro Manual */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-rose-100 p-2 dark:bg-rose-900/30">
                                        <UserPlus className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">
                                        Registro Individual
                                    </h3>
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Ideal para dar de alta a un proveedor nuevo
                                    rápidamente. El formulario valida que el RUC
                                    tenga 11 dígitos y sea único en el sistema.
                                </p>
                                <Screenshot
                                    src="/images/manual/proveedores/nuevoProveedorDark.png"
                                    alt="Formulario Nuevo Proveedor"
                                    caption="Registro manual de datos comerciales"
                                />
                            </div>

                            {/* Columna 2: Importación Masiva */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                                        <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">
                                        Carga Masiva (Excel)
                                    </h3>
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Usa esta opción para migrar tu base de datos
                                    o registrar múltiples proveedores a la vez.
                                </p>

                                <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-50/50 p-6 dark:bg-emerald-950/10">
                                    <h4 className="mb-4 text-xs font-black tracking-widest text-emerald-700 uppercase dark:text-emerald-400">
                                        Pasos de Importación
                                    </h4>
                                    <ul className="space-y-4 text-sm font-medium">
                                        <li className="flex gap-3">
                                            <Download className="h-5 w-5 shrink-0 text-emerald-600" />
                                            <div>
                                                <span className="block font-bold text-foreground">
                                                    1. Descargar Plantilla
                                                </span>
                                                <p className="text-xs text-muted-foreground">
                                                    Baja el archivo{' '}
                                                    <code>
                                                        plantilla_proveedores.xlsx
                                                    </code>
                                                    .
                                                </p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-600" />
                                            <div>
                                                <span className="block font-bold text-foreground">
                                                    2. Llenar Datos
                                                </span>
                                                <p className="text-xs text-muted-foreground">
                                                    Respeta las columnas
                                                    obligatorias:
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {[
                                                        'Razón Social',
                                                        'RUC',
                                                        'Nombre Contacto',
                                                        'Email',
                                                        'Teléfono',
                                                    ].map((col) => (
                                                        <span
                                                            key={col}
                                                            className="rounded-md border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                                                        >
                                                            {col}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <Upload className="h-5 w-5 shrink-0 text-emerald-600" />
                                            <div>
                                                <span className="block font-bold text-foreground">
                                                    3. Subir Archivo
                                                </span>
                                                <p className="text-xs text-muted-foreground">
                                                    El sistema procesará y
                                                    validará cada fila
                                                    automáticamente.
                                                </p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: HISTORIAL --- */}
                    <TabsContent
                        value="historial"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                Trazabilidad de Compras
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Vinculación automática entre el directorio de
                                proveedores y el módulo de comprobantes.
                            </p>
                        </div>
                        <Screenshot
                            src="/images/manual/proveedores/detalleProveedorDark.png"
                            alt="Historial de Proveedor"
                            caption="Vista detallada de compras realizadas a un proveedor específico"
                        />
                        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                            <History className="mx-auto mb-4 h-10 w-10 text-rose-600 dark:text-rose-400" />
                            <h4 className="text-lg font-bold text-foreground">
                                Historial Integrado
                            </h4>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Al ingresar al detalle de un proveedor, verás
                                una pestaña <strong>"Historial"</strong>. Esta
                                sección lista automáticamente todas las facturas
                                y boletas registradas a nombre de ese RUC,
                                permitiéndote calcular el volumen de compra
                                total.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* --- FOOTER (ESTILO TARJETA ADAPTATIVA) --- */}
                <div className="group relative flex flex-col items-center justify-between overflow-hidden rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-900 shadow-xl shadow-rose-500/10 md:flex-row dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100 dark:shadow-none">
                    <div className="relative z-10 space-y-1 text-center md:text-left">
                        <h4 className="text-2xl font-black tracking-tighter uppercase italic">
                            Gestión Eficiente
                        </h4>
                        <p className="text-sm font-medium opacity-90 dark:text-rose-200/70">
                            Mantén el RUC y datos de contacto actualizados para
                            una facturación sin errores.
                        </p>
                    </div>

                    <CheckCircle2 className="absolute -right-4 -bottom-4 h-24 w-24 text-rose-200 opacity-50 transition-transform duration-700 group-hover:scale-110 dark:text-rose-500 dark:opacity-20" />

                    <div className="relative z-10 mt-4 rounded-full border border-rose-200 bg-white/50 px-4 py-2 md:mt-0 dark:border-rose-500/30 dark:bg-rose-500/10">
                        <span className="text-[10px] font-bold tracking-widest text-rose-700 uppercase dark:text-rose-300">
                            Tip de Proveedores
                        </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
