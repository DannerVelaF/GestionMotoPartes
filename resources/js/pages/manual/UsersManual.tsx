import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import manual from '@/routes/manual';
import {
    CheckCircle2,
    Fingerprint,
    Image as ImageIcon,
    KeyRound,
    Lock,
    Power,
    RotateCcw,
    Shield,
    UserCog,
    UserPlus,
    Users,
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
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-2xl shadow-slate-500/5 transition-all hover:border-slate-500/30 dark:shadow-none">
            <img src={src} alt={alt} className="h-auto w-full object-cover" />
        </div>
        {caption && (
            <p className="flex items-center gap-2 text-center text-[10px] font-black tracking-widest text-muted-foreground uppercase italic">
                <ImageIcon className="h-3 w-3" /> {caption}
            </p>
        )}
    </div>
);

export default function UsersManual() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Manual de Uso', href: manual.index().url },
                { title: 'Usuarios', href: '' },
            ]}
        >
            <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
                {/* --- CABECERA --- */}
                <div className="flex flex-col items-center space-y-4 border-b pb-10 text-center">
                    <div className="rounded-3xl bg-slate-600 p-4 shadow-xl shadow-slate-500/20 dark:border dark:border-slate-500/30 dark:bg-slate-500/10 dark:shadow-none">
                        <Users className="h-10 w-10 text-white dark:text-slate-400" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                            Control de Acceso
                        </h1>
                        <p className="text-lg font-medium text-muted-foreground">
                            Gestión de perfiles, seguridad y administración de
                            credenciales del sistema.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="gestion" className="w-full">
                    <TabsList className="grid h-14 w-full grid-cols-3 rounded-2xl bg-muted/50 p-1.5 dark:bg-muted/20">
                        <TabsTrigger
                            value="gestion"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-slate-600 data-[state=active]:text-white dark:data-[state=active]:bg-slate-500"
                        >
                            <UserCog className="mr-2 h-4 w-4" /> Gestión de
                            Cuentas
                        </TabsTrigger>
                        <TabsTrigger
                            value="seguridad"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-slate-600 data-[state=active]:text-white dark:data-[state=active]:bg-slate-500"
                        >
                            <Shield className="mr-2 h-4 w-4" /> Seguridad y
                            Estado
                        </TabsTrigger>
                        <TabsTrigger
                            value="acceso"
                            className="rounded-xl text-[10px] font-bold tracking-widest uppercase data-[state=active]:bg-slate-600 data-[state=active]:text-white dark:data-[state=active]:bg-slate-500"
                        >
                            <Fingerprint className="mr-2 h-4 w-4" /> Login
                        </TabsTrigger>
                    </TabsList>

                    {/* --- CONTENIDO: GESTIÓN (LISTADO Y CREACIÓN) --- */}
                    <TabsContent
                        value="gestion"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                Administración de Personal
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                Crea cuentas para tus colaboradores.
                            </p>
                        </div>
                        <Screenshot
                            src="/images/manual/usuarios/listaUsuariosDark.png"
                            alt="Listado de Usuarios"
                            caption="Panel general de administración de cuentas"
                        />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm dark:bg-muted/5">
                                <h4 className="flex items-center gap-2 border-b pb-4 text-xs font-black tracking-widest text-slate-600 uppercase dark:text-slate-400">
                                    <UserPlus className="h-4 w-4" />
                                    Creación de Usuario
                                </h4>
                                <ul className="space-y-4 text-sm font-medium">
                                    <li className="flex gap-4">
                                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                                        <p className="text-muted-foreground">
                                            <strong className="text-foreground">
                                                Datos Personales:
                                            </strong>{' '}
                                            Nombre completo y correo electrónico
                                            corporativo.
                                        </p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                                        <p className="text-muted-foreground">
                                            <strong className="text-foreground">
                                                Credenciales:
                                            </strong>{' '}
                                            Asignación de un{' '}
                                            <strong>nombre de usuario</strong>{' '}
                                            único para el ingreso.
                                        </p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                                        <p className="text-muted-foreground">
                                            <strong className="text-foreground">
                                                Rol:
                                            </strong>{' '}
                                            Define el nivel de privilegios
                                            (Administrador, Vendedor, Almacén).
                                        </p>
                                    </li>
                                </ul>
                            </div>
                            <Card className="flex flex-col justify-center rounded-2xl border border-slate-200/50 bg-slate-50/50 p-8 text-center shadow-sm dark:border-slate-500/20 dark:bg-slate-500/5">
                                <CardContent className="space-y-4 p-0">
                                    <Shield className="mx-auto h-8 w-8 text-slate-600 dark:text-slate-400" />
                                    <h4 className="text-base font-black text-slate-700 uppercase dark:text-slate-400">
                                        Política de Privacidad
                                    </h4>
                                    <p className="text-xs font-medium text-balance text-slate-900/80 dark:text-slate-300">
                                        Las contraseñas se almacenan
                                        encriptadas. Ni siquiera el
                                        administrador puede ver la contraseña
                                        actual, solo restablecerla.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: SEGURIDAD (RESETEO Y ESTADO) --- */}
                    <TabsContent
                        value="seguridad"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
                            {/* Sección Reseteo de Contraseña */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                                        <KeyRound className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">
                                        Reseteo de Contraseña
                                    </h3>
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    En caso de pérdida de acceso por parte del
                                    usuario, puedes asignar una clave temporal
                                    desde la edición.
                                </p>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/10">
                                    <div className="flex items-start gap-3">
                                        <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                        <div className="space-y-1">
                                            <span className="text-xs font-black tracking-widest text-amber-700 uppercase dark:text-amber-500">
                                                Acción Requerida
                                            </span>
                                            <p className="text-xs text-amber-900/80 dark:text-amber-300">
                                                Al guardar la nueva contraseña,
                                                comunícala inmediatamente al
                                                usuario. Él deberá cambiarla en
                                                su primer inicio de sesión por
                                                seguridad.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Screenshot
                                    src="/images/manual/usuarios/resetPasswordDark.png"
                                    alt="Modal de Reseteo"
                                    caption="Opción de cambio de contraseña en perfil"
                                />
                            </div>

                            {/* Sección Estado (Activar/Inactivar) */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                                        <Power className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">
                                        Control de Estado
                                    </h3>
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    En lugar de eliminar usuarios (lo cual
                                    rompería el historial de auditoría), utiliza
                                    el interruptor de estado.
                                </p>
                                <div className="grid gap-4">
                                    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                            <span className="text-sm font-bold">
                                                Activo
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Acceso total permitido.
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl border bg-card p-4 opacity-75">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-slate-400" />
                                            <span className="text-sm font-bold text-muted-foreground">
                                                Inactivo
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Bloqueo inmediato al sistema.
                                        </p>
                                    </div>
                                </div>
                                <Screenshot
                                    src="/images/manual/usuarios/estadoUsuarioDark.png"
                                    alt="Switch de Estado"
                                    caption="Interruptor para habilitar o denegar acceso"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- CONTENIDO: ACCESO (LOGIN) --- */}
                    <TabsContent
                        value="acceso"
                        className="mt-10 animate-in space-y-10 duration-500 zoom-in-95 fade-in"
                    >
                        <div className="mx-auto max-w-4xl text-center">
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                                Portal de Ingreso
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                                El sistema utiliza un mecanismo de autenticación
                                seguro mediante credenciales únicas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                            <Screenshot
                                src="/images/manual/usuarios/loginScreenDark.png"
                                alt="Pantalla de Login"
                                caption="Interfaz de autenticación del sistema"
                            />
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-lg font-bold">
                                        <Lock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        Credenciales
                                    </h4>
                                    <ul className="space-y-3 pl-2">
                                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                            <span>
                                                <strong>Usuario:</strong> Nombre
                                                de usuario asignado (No el
                                                correo).
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                            <span>
                                                <strong>Contraseña:</strong>{' '}
                                                Clave personal intransferible.
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <Card className="border-l-4 border-l-slate-600 bg-slate-50 dark:border-l-slate-500 dark:bg-slate-900/50">
                                    <CardContent className="p-6">
                                        <p className="text-xs leading-relaxed font-medium text-slate-600 italic dark:text-slate-400">
                                            "Si ingresas la contraseña
                                            incorrecta múltiples veces, el
                                            sistema podría bloquear
                                            temporalmente tu IP por seguridad."
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* --- FOOTER (ADAPTATIVO SLATE) --- */}
                <div className="group relative flex flex-col items-center justify-between overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-900 shadow-xl shadow-slate-500/10 md:flex-row dark:border-slate-500/30 dark:bg-slate-950/40 dark:text-slate-100 dark:shadow-none">
                    <div className="relative z-10 space-y-1 text-center md:text-left">
                        <h4 className="text-2xl font-black tracking-tighter uppercase italic">
                            Seguridad ante todo
                        </h4>
                        <p className="text-sm font-medium opacity-90 dark:text-slate-200/70">
                            Recomendamos <strong>Inactivar</strong> usuarios
                            antiguos en lugar de eliminarlos para preservar el
                            historial.
                        </p>
                    </div>

                    <CheckCircle2 className="absolute -right-4 -bottom-4 h-24 w-24 text-slate-200 opacity-50 transition-transform duration-700 group-hover:scale-110 dark:text-slate-600 dark:opacity-20" />

                    <div className="relative z-10 mt-4 rounded-full border border-slate-200 bg-white/50 px-4 py-2 md:mt-0 dark:border-slate-500/30 dark:bg-slate-500/10">
                        <span className="text-[10px] font-bold tracking-widest text-slate-700 uppercase dark:text-slate-300">
                            Tip de Admin
                        </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
