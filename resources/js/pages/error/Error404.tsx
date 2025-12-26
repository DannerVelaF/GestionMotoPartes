import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    FileSearch,
    Home,
    Settings2,
    ShieldAlert,
} from 'lucide-react';

export default function Error404() {
    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4">
            <Head title="404 - Página no encontrada" />

            {/* --- ELEMENTOS DECORATIVOS DE FONDO (Blurs sutiles) --- */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-500/5" />
            <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px] dark:bg-emerald-500/5" />

            <div className="relative z-10 flex w-full max-w-[480px] animate-in flex-col items-center duration-1000 fade-in slide-in-from-bottom-8">
                {/* --- ICONO CENTRAL --- */}
                <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20 opacity-20" />
                    <Card className="relative flex h-full w-full items-center justify-center rounded-3xl border-none shadow-2xl ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
                        <FileSearch className="h-10 w-10 text-blue-600 dark:text-blue-500" />
                    </Card>
                </div>

                {/* --- MENSAJE --- */}
                <div className="text-center">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase dark:text-blue-400">
                        Error de sistema
                    </p>
                    <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground md:text-5xl">
                        Ruta No Encontrada
                    </h1>
                    <p className="mt-4 px-6 text-sm leading-relaxed font-medium text-muted-foreground/80">
                        Lo sentimos, la página que buscas no existe o ha sido
                        movida. Verifica la URL o utiliza los accesos directos
                        de abajo.
                    </p>
                </div>

                {/* --- BOTONES DE ACCIÓN --- */}
                <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.history.back()}
                        className="h-12 rounded-2xl border-none font-bold shadow-sm ring-1 ring-neutral-200 transition-all hover:bg-muted dark:bg-neutral-900 dark:ring-neutral-800"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver Atrás
                    </Button>

                    <Button
                        asChild
                        size="lg"
                        className="h-12 rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"
                    >
                        <Link href="/dashboard">
                            <Home className="mr-2 h-4 w-4" /> Ir al Dashboard
                        </Link>
                    </Button>
                </div>

                {/* --- SECCIÓN DE SOPORTE SUTIL --- */}
                <div className="mt-12 flex items-center gap-6 border-t border-dashed border-neutral-200 pt-8 dark:border-neutral-800">
                    <div className="flex items-center gap-2 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            Seguridad OK
                        </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                        <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            v2.0.25
                        </span>
                    </div>
                </div>
            </div>

            {/* --- FOOTER DECORATIVO --- */}
            <div className="absolute bottom-8 text-center">
                <p className="text-[9px] font-black tracking-[0.4em] text-muted-foreground/40 uppercase">
                    Sistema de Gestión de Motopartes
                </p>
            </div>
        </div>
    );
}
