import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Bell,
    Calendar,
    Check,
    CheckCheck,
    Clock,
    ExternalLink,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

// Reutilizamos tus constantes de estilo para mantener coherencia
const badgeStatusClass =
    'flex h-6 items-center rounded-sm border bg-muted/30 px-3 text-[9px] font-bold tracking-widest uppercase';

interface Props {
    allNotifications: {
        data: any[];
        total: number;
        links: any[];
    };
}

export default function NotificationIndex({ allNotifications }: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const markAsRead = (id: string) => {
        router.post(`/notifications/${id}/read`, {}, { preserveScroll: true });
    };

    const deleteNotification = (id: string) => {
        if (confirm('¿Desea eliminar permanentemente esta notificación?')) {
            router.delete(`/notifications/${id}`, { preserveScroll: true });
        }
    };

    const markAllAsRead = () => {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    };

    const refreshNotifications = () => {
        setIsRefreshing(true);
        router.reload({
            only: ['allNotifications'],
            onFinish: () => setIsRefreshing(false),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Notificaciones', href: '#' },
            ]}
        >
            <Head title="Centro de Notificaciones" />

            <div className="flex h-full flex-col overflow-hidden bg-background">
                {/* TOOLBAR SUPERIOR ESTILO GESTION */}
                <div className="flex shrink-0 flex-col border-b border-border bg-card">
                    <div className="flex items-center px-6 py-2 text-sm text-muted-foreground">
                        <span className="font-semibold tracking-tighter text-emerald-600 uppercase">
                            Sistema
                        </span>
                        <span className="mx-2">/</span> Historial de Alertas
                    </div>

                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight uppercase">
                                Centro de Notificaciones
                            </h1>
                            <div className={badgeStatusClass}>
                                {allNotifications.total} Registros
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refreshNotifications}
                                disabled={isRefreshing}
                                className="h-8 rounded-sm text-[11px] font-bold uppercase"
                            >
                                <RefreshCw
                                    className={cn(
                                        'mr-2 h-3.5 w-3.5',
                                        isRefreshing && 'animate-spin',
                                    )}
                                />
                                Actualizar
                            </Button>
                            <Button
                                onClick={markAllAsRead}
                                disabled={allNotifications.total === 0}
                                className="h-8 rounded-sm bg-emerald-600 px-4 text-[11px] font-bold text-white uppercase hover:bg-emerald-700"
                            >
                                <CheckCheck className="mr-2 h-3.5 w-3.5" />
                                Marcar todo leido
                            </Button>
                        </div>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL SCROLLABLE */}
                <div className="custom-scrollbar flex-1 overflow-y-auto bg-muted/5 p-6 md:p-8">
                    <div className="mx-auto max-w-5xl space-y-4">
                        {allNotifications.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-card py-24">
                                <Bell className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
                                <h3 className="text-lg font-bold text-muted-foreground uppercase">
                                    Bandeja Vacía
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    No tienes notificaciones pendientes en este
                                    momento.
                                </p>
                            </div>
                        ) : (
                            allNotifications.data.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        'group relative flex flex-col items-start justify-between rounded-sm border bg-card p-5 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center',
                                        !n.read_at
                                            ? 'border-l-4 border-border border-l-emerald-600'
                                            : 'border-border opacity-80',
                                    )}
                                >
                                    <div className="flex flex-1 items-start gap-5">
                                        <div
                                            className={cn(
                                                'mt-1 shrink-0 rounded-full p-2.5 shadow-inner',
                                                !n.read_at
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950'
                                                    : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            <Bell className="h-5 w-5" />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-sm font-black tracking-tight text-foreground uppercase">
                                                    {n.data.title}
                                                </h4>
                                                {!n.read_at && (
                                                    <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                                )}
                                            </div>

                                            <p className="max-w-2xl text-sm leading-relaxed font-medium text-muted-foreground">
                                                {n.data.message}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase">
                                                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                                                    {formatDistanceToNow(
                                                        new Date(n.created_at),
                                                        {
                                                            addSuffix: true,
                                                            locale: es,
                                                        },
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1.5 border-l border-border pl-4 text-[11px] font-bold text-muted-foreground uppercase">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(
                                                        new Date(n.created_at),
                                                        'dd MMM yyyy, p',
                                                        { locale: es },
                                                    )}
                                                </span>
                                                {n.data.url && (
                                                    <Link
                                                        href={n.data.url}
                                                        className="flex items-center gap-1.5 border-l border-border pl-4 text-[11px] font-black text-blue-600 uppercase hover:text-blue-800"
                                                    >
                                                        Abrir Documento
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACCIONES LATERALES */}
                                    <div className="mt-4 flex w-full items-center justify-end gap-1 border-t pt-3 md:mt-0 md:w-auto md:border-t-0 md:pt-0">
                                        {!n.read_at && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => markAsRead(n.id)}
                                                className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                title="Marcar leída"
                                            >
                                                <Check className="h-5 w-5" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                deleteNotification(n.id)
                                            }
                                            className="h-9 w-9 text-red-400 hover:bg-red-50 hover:text-red-600"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* PAGINACIÓN ESTILO GESTIÓN */}
                        {allNotifications.links.length > 3 && (
                            <div className="mt-10 flex justify-center pb-20">
                                <div className="flex items-center gap-1 rounded-sm border border-border bg-card p-1 shadow-sm">
                                    {allNotifications.links.map((link, i) => (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url)
                                            }
                                            className={cn(
                                                'h-8 min-w-[32px] rounded-sm px-3 text-[10px] font-black uppercase transition-all',
                                                link.active
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'text-muted-foreground hover:bg-muted',
                                            )}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
