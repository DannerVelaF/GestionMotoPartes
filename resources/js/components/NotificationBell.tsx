import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell, CheckCircle, ShieldAlert, RefreshCw, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns'; // Necesitarás instalar date-fns o usar Intl
import { es } from 'date-fns/locale';

export function NotificationBell() {
    const { auth } = usePage<any>().props;
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Sincronizar datos iniciales
    useEffect(() => {
        if (auth.user?.notifications) {
            setNotifications(auth.user.notifications);
        }
    }, [auth.user?.notifications]);

    // Escuchar WebSockets (Echo)
    useEffect(() => {
        const userId = auth.user?.id || auth.user?.id_user;
        if (!userId) return;

        const echoInstance = (window as any).Echo;

        if (echoInstance) {
            const channelName = `App.Models.User.${userId}`;

            // 1. Abandonamos para evitar duplicados
            echoInstance.leave(channelName);

            // 2. Escuchamos específicamente NOTIFICACIONES
            // Importante: .private(...).notification() es un atajo especial de Laravel
            echoInstance
                .private(channelName)
                .notification((notification: any) => {
                    console.log('🔔 ¡EVENTO RECIBIDO EN VIVO!', notification);

                    // Estructura normalizada
                    const newNotif = {
                        id: notification.id || `live-${Date.now()}`,
                        created_at: new Date().toISOString(),
                        data: {
                            title:
                                notification.title ||
                                notification.data?.title ||
                                'Aviso',
                            message:
                                notification.message ||
                                notification.data?.message ||
                                '',
                            url:
                                notification.url ||
                                notification.data?.url ||
                                '#',
                            type:
                                notification.type ||
                                notification.data?.type ||
                                'info',
                        },
                    };

                    // Actualizamos el estado para que el número (unreadCount) cambie al instante
                    setNotifications((prev) => [newNotif, ...prev]);

                    // Opcional: Sonido de alerta
                    // new Audio('/sounds/notification.mp3').play().catch(() => {});
                });
        }
    }, [auth.user?.id]);

    // Función para marcar como leída y navegar
    const handleAction = (id: string, url: string) => {
        // Optimistic UI: Quitar de la lista inmediatamente
        setNotifications(prev => prev.filter(n => n.id !== id));

        router.post(`/notifications/${id}/read`, {}, {
            onSuccess: () => router.visit(url),
            preserveScroll: true
        });
    };

    // Función para recargar (Inertia reload)
    const refreshNotifications = () => {
        setIsRefreshing(true);
        router.reload({
            only: ['auth'],
            onFinish: () => setIsRefreshing(false)
        });
    };

    const markAllRead = () => {
        setNotifications([]);
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    };

    const unreadCount = notifications.length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96 p-0 shadow-2xl border-muted/40 overflow-hidden rounded-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Notificaciones</span>
                        <button
                            onClick={refreshNotifications}
                            disabled={isRefreshing}
                            className={`p-1 hover:bg-muted rounded-full transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            Marcar todo como leído
                        </button>
                    )}
                </div>

                {/* Listado */}
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center opacity-40">
                            <Bell className="h-10 w-10" />
                            <p className="text-xs font-medium">Bandeja de entrada vacía</p>
                        </div>
                    ) : (
                        notifications.map((notif) => {
                            const item = notif.data || notif;
                            const isSuccess = item.title?.toLowerCase().includes('aprobada') || item.type === 'success';
                            const date = notif.created_at ? new Date(notif.created_at) : new Date();

                            return (
                                <DropdownMenuItem
                                    key={notif.id}
                                    className="p-0 border-b last:border-0 focus:bg-muted/50"
                                >
                                    <div
                                        onClick={() => handleAction(notif.id, item.url)}
                                        className="flex w-full cursor-pointer items-start gap-4 px-4 py-4 transition-all hover:bg-muted/30"
                                    >
                                        <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isSuccess ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-amber-100 dark:bg-amber-950'}`}>
                                            {isSuccess ? (
                                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <ShieldAlert className="h-4 w-4 text-amber-600" />
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 w-full">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[13px] font-bold leading-none">
                                                    {item.title}
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(date, { addSuffix: true, locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-[12px] leading-snug text-muted-foreground/90 line-clamp-2">
                                                {item.message}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </div>

                <div className="bg-muted/10 p-2 text-center border-t">
                    <Link href="/notificaciones" className="text-[11px] font-medium text-muted-foreground hover:text-primary">
                        Ver todo el historial
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
