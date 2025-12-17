import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils'; // Asegúrate de importar tu helper de clases
import configuracion from '@/routes/configuracion';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Globe,
    Key,
    Printer,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

// --- Interfaces ---
interface BusinessConfig {
    id_business_config?: number;
    company_name: string;
    ruc: string;
    address: string;
    phone: string;
    email: string;
    city: string;
    ticket_footer: string;
    api_service_token: string;
    api_service_url: string;
}

interface Props {
    config: BusinessConfig | null;
    flash: { success?: string; error?: string };
}

// --- Componente de Alerta Interno ---
function FloatingAlert({
    message,
    type,
    onClose,
}: {
    message: string;
    type: 'error' | 'success';
    onClose: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === 'success';

    return (
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={cn(
                    'border-2 shadow-xl',
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'border-red-500 bg-white text-red-900',
                )}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2 font-bold">
                    {isSuccess ? '¡Éxito!' : 'Error'}
                </AlertTitle>
                <AlertDescription className="ml-2">{message}</AlertDescription>
            </Alert>
        </div>
    );
}

export default function Config({ config, flash }: Props) {
    const [alert, setAlert] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    const { data, setData, put, processing, errors } = useForm({
        company_name: config?.company_name || '',
        ruc: config?.ruc || '',
        address: config?.address || '',
        phone: config?.phone || '',
        email: config?.email || '',
        city: config?.city || '',
        ticket_footer: config?.ticket_footer || '',
        api_service_token: config?.api_service_token || '',
        api_service_url: config?.api_service_url || '',
    });

    // Escuchar mensajes flash del backend
    useEffect(() => {
        if (flash.success)
            setAlert({ message: flash.success, type: 'success' });
        if (flash.error) setAlert({ message: flash.error, type: 'error' });
    }, [flash]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setAlert(null);

        put(configuracion.negocio.update().url, {
            preserveScroll: true,
            onError: (errors) => {
                // Esto te dirá en la consola de F12 exactamente qué falló
                console.log('Errores detallados del servidor:', errors);

                // Si el error viene de la base de datos (catch del controlador)
                if (errors.error) {
                    setAlert({ message: errors.error, type: 'error' });
                } else {
                    setAlert({
                        message:
                            'Faltan campos obligatorios o el formato es inválido.',
                        type: 'error',
                    });
                }
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Configuración', href: '/configuracion/negocio' },
            ]}
        >
            <Head title="Configuración del Negocio" />

            {/* ✅ AGREGADO: Renderizado de la alerta flotante */}
            {alert && (
                <FloatingAlert
                    message={alert.message}
                    type={alert.type}
                    onClose={() => setAlert(null)}
                />
            )}

            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">
                            Configuración del Negocio
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Administra la información legal y de contacto de tu
                            empresa para la emisión de documentos.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {/* SECCIÓN 1: DATOS DE LA EMPRESA */}
                        <Card className="border border-border shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    Datos Generales
                                </CardTitle>
                                <CardDescription>
                                    Información para la cabecera de tus tickets.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">
                                        Razón Social
                                    </Label>
                                    <Input
                                        id="company_name"
                                        value={data.company_name}
                                        onChange={(e) =>
                                            setData(
                                                'company_name',
                                                e.target.value,
                                            )
                                        }
                                        className={
                                            errors.company_name
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    {errors.company_name && (
                                        <p className="text-xs text-destructive">
                                            {errors.company_name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ruc">RUC</Label>
                                    <Input
                                        id="ruc"
                                        maxLength={11}
                                        value={data.ruc}
                                        onChange={(e) =>
                                            setData('ruc', e.target.value)
                                        }
                                        className={
                                            errors.ruc
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    {errors.ruc && (
                                        <p className="text-xs text-destructive">
                                            {errors.ruc}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">
                                        Dirección Fiscal
                                    </Label>
                                    <Input
                                        id="address"
                                        value={data.address}
                                        onChange={(e) =>
                                            setData('address', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">
                                        Ciudad / Distrito
                                    </Label>
                                    <Input
                                        id="city"
                                        value={data.city}
                                        onChange={(e) =>
                                            setData('city', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        Teléfono de contacto
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* SECCIÓN 2: TICKET */}
                        <Card className="border border-border shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Printer className="h-4 w-4 text-emerald-600" />
                                    Personalización de Comprobante
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="ticket_footer">
                                        Mensaje al pie (Footer)
                                    </Label>
                                    <Textarea
                                        id="ticket_footer"
                                        placeholder="Ej: ¡Gracias por su compra!"
                                        rows={3}
                                        value={data.ticket_footer}
                                        onChange={(e) =>
                                            setData(
                                                'ticket_footer',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* SECCIÓN 3: API */}
                        <Card className="border border-border bg-muted/30 shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Key className="h-4 w-4 text-amber-600" />
                                    Servicios Externos
                                </CardTitle>
                                <CardDescription>
                                    Tokens para servicios de validación o
                                    facturación.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="api_service_url">
                                        URL del API
                                    </Label>
                                    <div className="relative">
                                        <Globe className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="api_service_url"
                                            className="pl-9"
                                            value={data.api_service_url}
                                            onChange={(e) =>
                                                setData(
                                                    'api_service_url',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="api_service_token">
                                        API Key / Token
                                    </Label>
                                    <Input
                                        id="api_service_token"
                                        type="password"
                                        value={data.api_service_token}
                                        onChange={(e) =>
                                            setData(
                                                'api_service_token',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {processing
                                    ? 'Guardando...'
                                    : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
