import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FloatingAlertProps {
    message: string | null;
    type?: 'error' | 'success' | null;
    duration?: number; // Tiempo en milisegundos
    onClose?: () => void; // Para limpiar el estado en el padre
}

export function FloatingAlert({
    message,
    type = 'error',
    duration = 5000,
    onClose,
}: FloatingAlertProps) {
    const [isVisible, setIsVisible] = useState(!!message);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [message, duration]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) {
            // Esperamos un poco para que termine la animación de salida si la hay
            setTimeout(onClose, 300);
        }
    };

    if (!isVisible || !message) return null;

    const isSuccess = type === 'success';

    return (
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in duration-300 fade-in slide-in-from-top-2">
            <Alert
                className={cn(
                    'relative border-2 bg-white pr-10 shadow-2xl dark:bg-neutral-900',
                    isSuccess
                        ? 'border-emerald-500 text-emerald-900 dark:text-emerald-100'
                        : 'border-red-500 text-red-900 dark:text-red-100',
                )}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                )}

                <AlertTitle className="ml-2 text-xs font-black tracking-tight uppercase">
                    {isSuccess ? '¡Éxito!' : 'Atención del Sistema'}
                </AlertTitle>

                <AlertDescription className="ml-2 text-sm font-medium whitespace-pre-wrap opacity-90">
                    {message}
                </AlertDescription>

                {/* Botón opcional para cerrar manualmente antes de tiempo */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 opacity-50 transition-opacity hover:opacity-100"
                >
                    <X className="h-4 w-4" />
                </button>
            </Alert>
        </div>
    );
}
