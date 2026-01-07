import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppSidebarLayout from '@/layouts/app-layout';
import receipts from '@/routes/receipts';
import suppliers from '@/routes/suppliers';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    CheckCircle2,
    CreditCard,
    Globe, // Nuevo icono
    Loader2,
    Mail,
    MapPin, // Nuevo icono
    Phone,
    Save,
    Search,
    Truck,
    User,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

// --- COMPONENTE DE ALERTA FLOTANTE MEJORADO ---
function FloatingAlert({
    message,
    type = 'error',
}: {
    message?: string;
    type?: 'error' | 'success';
}) {
    if (!message) return null;

    const isSuccess = type === 'success';

    return (
        <div
            className={`z-50 animate-in fade-in slide-in-from-top-2 ${
                isSuccess
                    ? 'fixed top-6 right-6 w-auto max-w-md'
                    : 'absolute top-full left-0 mt-2 w-fit max-w-full'
            }`}
        >
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={`border-2 shadow-xl ${
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'bg-white dark:bg-slate-900'
                }`}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2 font-bold">
                    {isSuccess ? '¡Éxito!' : 'Error'}
                </AlertTitle>
                <AlertDescription className="ml-2 whitespace-nowrap">
                    {message}
                </AlertDescription>
            </Alert>
        </div>
    );
}

export default function CreateSupplier() {
    // Estado para la carga de búsqueda SUNAT
    const [isSearching, setIsSearching] = useState(false);

    // Estado para alertas manuales (Búsqueda SUNAT)
    const [manualAlert, setManualAlert] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    // Efecto para limpiar la alerta manual después de 3 segundos
    useEffect(() => {
        if (manualAlert) {
            const timer = setTimeout(() => setManualAlert(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [manualAlert]);

    // 1. Configuración del Formulario
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
        setError,
    } = useForm({
        type: 'nacional', // 'nacional' | 'extranjero'
        company_name: '',
        ruc: '',
        supplier_name: '',
        supplier_email: '',
        supplier_phone: '',
    });

    const onFieldChange = (field: keyof typeof data, value: any) => {
        setData(field, value);
        if (errors[field]) {
            clearErrors(field);
        }
    };

    // Cambio de tipo de proveedor (Limpia el RUC al cambiar)
    const handleTypeChange = (newType: string) => {
        setData((prev) => ({ ...prev, type: newType, ruc: '' }));
        clearErrors('ruc');
    };

    const handleSunatSearch = async () => {
        // Validación local mínima
        if (data.type !== 'nacional') return; // No buscar si es extranjero

        setManualAlert(null);
        clearErrors('ruc');

        if (!data.ruc || data.ruc.length !== 11) {
            setError('ruc', 'Ingresa un RUC válido de 11 dígitos para buscar.');
            return;
        }

        setIsSearching(true);

        try {
            const response = await axios.get(suppliers.buscarSunat().url, {
                params: { numero: data.ruc },
            });

            if (response.data.razon_social) {
                setData('company_name', response.data.razon_social);
                setManualAlert({
                    message: 'Razón Social obtenida de SUNAT.',
                    type: 'success',
                });
            } else {
                throw new Error('No se encontró la razón social');
            }
        } catch (error: any) {
            console.error('Error en búsqueda SUNAT:', error);
            const errorMessage =
                error.response?.data?.error || 'No se pudo conectar con SUNAT.';
            setManualAlert({
                message: errorMessage,
                type: 'error',
            });
            setError('ruc', 'No se encontró información para este RUC.');
        } finally {
            setIsSearching(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(suppliers.store().url);
    };

    const breadcrumbs = [
        { title: 'Comprobantes', href: receipts.index().url },
        { title: 'Proveedores', href: suppliers.index().url },
        { title: 'Nuevo', href: '' },
    ];

    const secondaryInputClass = (hasError: boolean) =>
        `h-10 w-full rounded-none border-0 border-b bg-transparent px-0 text-lg shadow-none transition-all placeholder:text-muted-foreground/40 focus:ring-0 focus:outline-none ${
            hasError
                ? 'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500'
                : 'border-muted text-foreground focus:border-blue-600'
        }`;

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Proveedor" />

            {manualAlert && (
                <FloatingAlert
                    message={manualAlert.message}
                    type={manualAlert.type}
                />
            )}

            <form
                onSubmit={submit}
                className="flex h-full flex-col bg-background"
            >
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xl font-semibold text-foreground/90">
                            Registrar Proveedor
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => reset()}
                            disabled={processing || isSearching}
                            type="button"
                            className="border-muted-foreground/30 hover:bg-muted"
                        >
                            Descartar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || isSearching}
                            className="min-w-[120px] bg-blue-600 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            {processing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Guardar
                        </Button>
                    </div>
                </div>

                {/* --- CONTENIDO PRINCIPAL --- */}
                <div className="w-full max-w-5xl animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    {/* SELECCIÓN DE TIPO DE PROVEEDOR */}
                    <div className="mb-8 flex gap-4">
                        <div
                            onClick={() => handleTypeChange('nacional')}
                            className={`flex flex-1 cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-all hover:bg-muted/50 ${
                                data.type === 'nacional'
                                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 dark:bg-blue-900/20'
                                    : 'border-muted bg-card'
                            }`}
                        >
                            <div className="flex items-center gap-2 text-sm font-bold uppercase">
                                <MapPin className="h-4 w-4 text-blue-600" />{' '}
                                Nacional (Perú)
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Con RUC (11 dígitos) y validación SUNAT.
                            </p>
                        </div>

                        <div
                            onClick={() => handleTypeChange('extranjero')}
                            className={`flex flex-1 cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-all hover:bg-muted/50 ${
                                data.type === 'extranjero'
                                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 dark:bg-blue-900/20'
                                    : 'border-muted bg-card'
                            }`}
                        >
                            <div className="flex items-center gap-2 text-sm font-bold uppercase">
                                <Globe className="h-4 w-4 text-purple-600" />{' '}
                                Extranjero
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Sin RUC (Tax ID/EIN), facturación Invoice.
                            </p>
                        </div>
                    </div>

                    {/* 1. INPUT GIGANTE: RAZÓN SOCIAL */}
                    <div className="mb-12 space-y-6 pt-2">
                        <div className="relative space-y-2">
                            <Label
                                htmlFor="company_name"
                                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                            >
                                Razón Social (Empresa)
                            </Label>
                            <input
                                id="company_name"
                                value={data.company_name}
                                onChange={(e) =>
                                    onFieldChange(
                                        'company_name',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                placeholder={
                                    data.type === 'nacional'
                                        ? 'EJ. INVERSIONES GENERALES S.A.C.'
                                        : 'EX. DIGITAL OCEAN, LLC'
                                }
                                className={`h-auto w-full rounded-none border-0 border-b-2 bg-transparent px-0 py-2 text-4xl font-extrabold tracking-tight transition-all duration-300 placeholder:text-muted-foreground/20 focus:ring-0 focus:outline-none ${
                                    errors.company_name
                                        ? 'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500'
                                        : 'border-muted text-foreground focus:border-blue-600'
                                }`}
                                autoFocus
                            />
                            <FloatingAlert message={errors.company_name} />
                        </div>
                    </div>

                    {/* 2. GRILLA DE DETALLES */}
                    <div className="grid grid-cols-1 gap-x-20 gap-y-12 md:grid-cols-2">
                        {/* COLUMNA IZQUIERDA: DATOS LEGALES Y CONTACTO PRINCIPAL */}
                        <div className="space-y-10">
                            {/* RUC / TAX ID CON LÓGICA CONDICIONAL */}
                            <div className="relative space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                        <CreditCard className="h-3 w-3" />
                                        <Label>
                                            {data.type === 'nacional'
                                                ? 'RUC (11 Dígitos)'
                                                : 'Tax ID / Identificación'}
                                        </Label>
                                    </div>
                                    {isSearching && (
                                        <span className="animate-pulse text-xs font-medium text-blue-600">
                                            Consultando SUNAT...
                                        </span>
                                    )}
                                </div>

                                <div className="relative">
                                    <input
                                        value={data.ruc}
                                        maxLength={
                                            data.type === 'nacional' ? 11 : 20
                                        }
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            // Si es nacional, solo números. Si es extranjero, permite todo.
                                            if (data.type === 'nacional') {
                                                val = val
                                                    .replace(/\D/g, '')
                                                    .slice(0, 11);
                                            }
                                            onFieldChange('ruc', val);
                                        }}
                                        disabled={isSearching}
                                        placeholder={
                                            data.type === 'nacional'
                                                ? '20123456789'
                                                : 'US-EIN-12345'
                                        }
                                        className={`${secondaryInputClass(
                                            !!errors.ruc,
                                        )} ${data.type === 'nacional' ? 'pr-32' : ''}`}
                                    />

                                    {/* Botón Integrado SOLO PARA NACIONALES */}
                                    {data.type === 'nacional' && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleSunatSearch}
                                            disabled={
                                                !data.ruc ||
                                                data.ruc.length < 11 ||
                                                isSearching
                                            }
                                            className="absolute right-0 bottom-1 h-8 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                        >
                                            {isSearching ? (
                                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            ) : (
                                                <Search className="mr-2 h-3 w-3" />
                                            )}
                                            Buscar SUNAT
                                        </Button>
                                    )}
                                </div>
                                <FloatingAlert message={errors.ruc} />
                            </div>

                            {/* NOMBRE DE CONTACTO */}
                            <div className="relative space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <User className="h-3 w-3" />
                                    <Label>Persona de Contacto</Label>
                                </div>
                                <input
                                    value={data.supplier_name}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'supplier_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ej. Juan Pérez"
                                    className={secondaryInputClass(
                                        !!errors.supplier_name,
                                    )}
                                />
                                <FloatingAlert message={errors.supplier_name} />
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: COMUNICACIÓN */}
                        <div className="space-y-10">
                            {/* EMAIL */}
                            <div className="relative space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Mail className="h-3 w-3" />
                                    <Label>Correo Electrónico</Label>
                                </div>
                                <input
                                    type="email"
                                    value={data.supplier_email}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'supplier_email',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="contacto@empresa.com"
                                    className={secondaryInputClass(
                                        !!errors.supplier_email,
                                    )}
                                />
                                <FloatingAlert
                                    message={errors.supplier_email}
                                />
                            </div>

                            {/* TELÉFONO */}
                            <div className="relative space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                    <Phone className="h-3 w-3" />
                                    <Label>Teléfono / Celular</Label>
                                </div>
                                <input
                                    value={data.supplier_phone}
                                    onChange={(e) =>
                                        onFieldChange(
                                            'supplier_phone',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="999 000 000"
                                    className={secondaryInputClass(
                                        !!errors.supplier_phone,
                                    )}
                                />
                                <FloatingAlert
                                    message={errors.supplier_phone}
                                />
                            </div>

                            {/* NOTA DINÁMICA SEGÚN TIPO */}
                            {data.type === 'nacional' ? (
                                <div className="mt-8 flex gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-6 text-sm text-blue-900 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-200">
                                    <Search className="mt-1 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                                    <div className="space-y-1">
                                        <p className="font-semibold">
                                            Búsqueda Rápida SUNAT
                                        </p>
                                        <p className="leading-relaxed opacity-90">
                                            Para agilizar el registro, ingresa
                                            el RUC y presiona
                                            <span className="mx-1 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                                Buscar SUNAT
                                            </span>
                                            .
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-8 flex gap-4 rounded-lg border border-neutral-100 bg-neutral-50/50 p-6 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-200">
                                    <Globe className="mt-1 h-5 w-5 shrink-0 text-neutral-500" />
                                    <div className="space-y-1">
                                        <p className="font-semibold">
                                            Proveedor Internacional
                                        </p>
                                        <p className="leading-relaxed opacity-90">
                                            Ingresa el identificador fiscal
                                            (EIN, VAT, Tax ID) de la empresa
                                            extranjera. No se realizará
                                            validación con SUNAT.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </AppSidebarLayout>
    );
}
