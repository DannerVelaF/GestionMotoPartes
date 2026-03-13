import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    History,
    MessageSquare,
    Paperclip,
    Plus,
    Star,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// --- TIPOS ---
interface Product {
    id_product: number;
    product_name: string;
    product_code: string | null;
    stock: number | string;
    sale_price: number | string;
}

interface Props {
    products: Product[];
}

interface AdjustmentItem {
    id_product: number;
    product_name: string;
    product_code: string | null;
    old_stock: number;
    new_stock: number | string;
    unit_cost: number | string;
}

// --- COMPONENTE DE ALERTA ---
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
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={cn(
                    'border-2 shadow-xl',
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100'
                        : 'border-red-500 bg-white text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100',
                )}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2 font-bold">
                    {isSuccess ? '¡Éxito!' : 'Atención'}
                </AlertTitle>
                <AlertDescription className="ml-2 whitespace-pre-wrap">
                    {message}
                </AlertDescription>
            </Alert>
        </div>
    );
}

// --- COMPONENTE CAMPO ESTILO ODOO ---
const OdooField = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <div className="flex min-h-[36px] items-center">
        <div className="w-[160px] shrink-0 pr-4 text-sm font-bold text-muted-foreground">
            {label}
        </div>
        <div className="flex-1">{children}</div>
    </div>
);

export default function ManualAdjustment({ products }: Props) {
    const { props } = usePage();
    const serverErrors: any = props.errors;
    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        operation_type: '00 - OTROS',
        kardex_date: today,
        reason: 'Ajuste de Inventario',
        location: 'Almacén Principal',
        contact_name: '',
        document_type: '',
        document_number: '',
        exchange_rate: '1.000',
        status: 'draft',
        internal_note: '',
        items: [] as AdjustmentItem[],
    });

    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('operaciones');

    // Estado para controlar si la caja de notas está visible
    const [isWritingNote, setIsWritingNote] = useState(false);

    useEffect(() => {
        if (serverErrors?.error || localError) {
            const timer = setTimeout(() => setLocalError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [serverErrors, localError]);

    const handleAddProduct = () => {
        if (!selectedProductId) return;
        const product = products.find(
            (p) => p.id_product.toString() === selectedProductId,
        );
        if (!product) return;

        if (data.items.some((item) => item.id_product === product.id_product)) {
            setLocalError('El producto ya está en la lista.');
            return;
        }

        const currentStock = Number(product.stock) || 0;
        const currentCost = Number(product.sale_price) || 0;

        setData('items', [
            ...data.items,
            {
                id_product: product.id_product,
                product_name: product.product_name,
                product_code: product.product_code,
                old_stock: currentStock,
                new_stock: currentStock,
                unit_cost: currentCost,
            },
        ]);
        setSelectedProductId('');
    };

    const handleRemoveItem = (id: number) => {
        setData(
            'items',
            data.items.filter((item) => item.id_product !== id),
        );
    };

    const handleStockChange = (id: number, value: string) => {
        setData(
            'items',
            data.items.map((item) =>
                item.id_product === id ? { ...item, new_stock: value } : item,
            ),
        );
    };

    const handleCostChange = (id: number, value: string) => {
        setData(
            'items',
            data.items.map((item) =>
                item.id_product === id ? { ...item, unit_cost: value } : item,
            ),
        );
    };

    const submitForm = (targetStatus: 'draft' | 'done') => {
        setLocalError(null);

        // SOLO obligamos a tener productos si el usuario intenta "VALIDAR" (done)
        if (targetStatus === 'done' && data.items.length === 0) {
            setLocalError(
                'Debes agregar al menos un producto para validar el ajuste en el Kardex.',
            );
            return;
        }

        const cleanedItems = data.items.map((item) => ({
            ...item,
            new_stock: item.new_stock === '' ? 0 : Number(item.new_stock),
            unit_cost: item.unit_cost === '' ? 0 : Number(item.unit_cost),
        }));

        post('/inventario/ajuste', {
            data: { ...data, status: targetStatus, items: cleanedItems },
            onSuccess: () => {
                setIsWritingNote(false);
                setData('internal_note', '');
            },
            onError: (errs) => {
                if (errs.error) setLocalError(errs.error);
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Inventario', href: '/inventario' },
                { title: 'Nuevo Ajuste', href: '#' },
            ]}
        >
            <Head title="Ajuste de Inventario" />

            {(serverErrors?.error || localError) && (
                <FloatingAlert
                    message={serverErrors.error || localError}
                    type="error"
                />
            )}

            <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
                {/* TOOLBAR SUPERIOR */}
                <div className="flex flex-col border-b border-border bg-card">
                    <div className="flex items-center px-6 py-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                            Nuevo
                        </span>
                        <span className="mx-2">/</span> Borrador de Ajuste
                    </div>

                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => submitForm('done')}
                                disabled={processing || data.items.length === 0}
                                className="h-8 rounded-sm bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
                            >
                                {processing && data.status === 'done'
                                    ? 'Validando...'
                                    : 'Validar Ajuste'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => submitForm('draft')}
                                disabled={processing} // <-- QUITAMOS el data.items.length === 0
                                className="h-8 rounded-sm text-foreground shadow-sm"
                            >
                                {processing && data.status === 'draft'
                                    ? 'Guardando...'
                                    : 'Guardar Borrador'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.history.back()}
                                className="h-8 rounded-sm text-muted-foreground hover:bg-muted"
                            >
                                Descartar
                            </Button>
                        </div>

                        {/* StatusBar Estilo Odoo */}
                        <div className="flex h-8 items-center overflow-hidden rounded-sm border border-border bg-muted/30 text-xs font-bold tracking-wider uppercase">
                            <div className="relative flex h-full items-center justify-center border-r border-border bg-blue-600/10 px-4 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                Borrador
                            </div>
                            <div className="flex h-full items-center justify-center px-4 text-muted-foreground opacity-50">
                                Realizado
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENEDOR PRINCIPAL DIVIDIDO */}
                <div className="flex flex-1 overflow-hidden">
                    {/* PANEL IZQUIERDO (Formulario) - Ahora usa el 100% del ancho disponible */}
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="w-full space-y-8">
                            {/* TITULO Y ESTRELLA */}
                            <div className="flex items-center gap-3">
                                <Star className="h-8 w-8 cursor-pointer text-muted-foreground opacity-30 transition-colors hover:text-yellow-400 hover:opacity-100" />
                                <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase md:text-4xl">
                                    NUEVO AJUSTE / {today.replace(/-/g, '')}
                                </h1>
                            </div>

                            {/* FORMULARIO CABECERA CONTABLE (Fluido en 2 columnas al 100%) */}
                            <div className="grid grid-cols-1 gap-x-12 gap-y-2 pt-4 xl:grid-cols-2">
                                <div className="space-y-1">
                                    <OdooField label="Motivo">
                                        <Select
                                            value={data.reason}
                                            onValueChange={(val) =>
                                                setData('reason', val)
                                            }
                                        >
                                            <SelectTrigger className="h-8 border-transparent bg-transparent px-2 shadow-none hover:border-border focus:ring-0">
                                                <SelectValue placeholder="Seleccione un motivo..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Ajuste de Inventario">
                                                    Ajuste de Inventario
                                                </SelectItem>
                                                <SelectItem value="Conteo Físico">
                                                    Conteo Físico
                                                </SelectItem>
                                                <SelectItem value="Merma / Deterioro">
                                                    Merma / Deterioro
                                                </SelectItem>
                                                <SelectItem value="Pérdida / Robo">
                                                    Pérdida / Robo
                                                </SelectItem>
                                                <SelectItem value="Saldo Inicial">
                                                    Saldo Inicial
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </OdooField>

                                    <OdooField label="Contacto / Responsable">
                                        <Input
                                            value={data.contact_name}
                                            onChange={(e) =>
                                                setData(
                                                    'contact_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ej: Empleado Juan, Proveedor X..."
                                            className="h-8 rounded-sm border-transparent bg-transparent px-2 shadow-none hover:border-border focus-visible:bg-background"
                                        />
                                    </OdooField>

                                    <OdooField label="Fecha Kardex">
                                        <Input
                                            type="date"
                                            value={data.kardex_date}
                                            onChange={(e) =>
                                                setData(
                                                    'kardex_date',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-8 rounded-sm border-transparent bg-transparent px-2 shadow-none hover:border-border focus-visible:bg-background"
                                        />
                                    </OdooField>

                                    <OdooField label="Ubicación">
                                        <Input
                                            value={data.location}
                                            disabled
                                            className="h-8 rounded-sm border-transparent bg-transparent px-2 font-medium text-blue-600 opacity-100 shadow-none dark:text-blue-400"
                                        />
                                    </OdooField>
                                </div>

                                <div className="space-y-1">
                                    <OdooField label="Tipo Operación">
                                        <Select
                                            value={data.operation_type}
                                            onValueChange={(val) =>
                                                setData('operation_type', val)
                                            }
                                        >
                                            <SelectTrigger className="h-8 border-transparent bg-transparent px-2 shadow-none hover:border-border focus:ring-0">
                                                <SelectValue placeholder="Seleccione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="00 - OTROS">
                                                    00 - OTROS
                                                </SelectItem>
                                                <SelectItem value="13 - MERMAS">
                                                    13 - MERMAS
                                                </SelectItem>
                                                <SelectItem value="16 - SALDO INICIAL">
                                                    16 - SALDO INICIAL
                                                </SelectItem>
                                                <SelectItem value="99 - AJUSTE INVENTARIO">
                                                    99 - AJUSTE INVENTARIO
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </OdooField>

                                    <div className="flex gap-2">
                                        <div className="w-1/2 xl:w-2/3">
                                            <OdooField label="Documento Respaldo">
                                                <Select
                                                    value={data.document_type}
                                                    onValueChange={(val) =>
                                                        setData(
                                                            'document_type',
                                                            val,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 border-transparent bg-transparent px-2 shadow-none hover:border-border focus:ring-0">
                                                        <SelectValue placeholder="Tipo (Opcional)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Factura">
                                                            Factura
                                                        </SelectItem>
                                                        <SelectItem value="Boleta">
                                                            Boleta
                                                        </SelectItem>
                                                        <SelectItem value="Guía Remisión">
                                                            Guía Remisión
                                                        </SelectItem>
                                                        <SelectItem value="Nota Interna">
                                                            Nota Interna
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </OdooField>
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                value={data.document_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'document_number',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Nro: F001-123"
                                                className="h-8 rounded-sm border-transparent bg-transparent px-2 shadow-none hover:border-border focus-visible:bg-background"
                                            />
                                        </div>
                                    </div>

                                    <OdooField label="Tipo de Cambio">
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={data.exchange_rate}
                                            onChange={(e) =>
                                                setData(
                                                    'exchange_rate',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-8 w-32 rounded-sm border-transparent bg-transparent px-2 shadow-none hover:border-border focus-visible:bg-background"
                                        />
                                    </OdooField>
                                </div>
                            </div>

                            {/* TABS Y TABLA DE PRODUCTOS (Expandida al 100%) */}
                            <div className="w-full pt-6">
                                <div className="mb-4 flex gap-6 border-b border-border text-sm font-bold text-muted-foreground">
                                    <button
                                        onClick={() =>
                                            setActiveTab('operaciones')
                                        }
                                        className={cn(
                                            'border-b-2 pb-2 transition-colors',
                                            activeTab === 'operaciones'
                                                ? 'border-blue-600 text-foreground'
                                                : 'border-transparent hover:text-foreground',
                                        )}
                                    >
                                        Operaciones
                                    </button>
                                </div>

                                {activeTab === 'operaciones' && (
                                    <div className="w-full overflow-hidden rounded-sm border border-border bg-card shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="border-b border-border bg-muted/30">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-muted-foreground">
                                                        Producto
                                                    </th>
                                                    <th className="w-40 px-4 py-3 text-center font-bold text-muted-foreground">
                                                        A Mano (Sistema)
                                                    </th>
                                                    <th className="w-48 px-4 py-3 text-center font-bold text-foreground">
                                                        Cantidad Contada
                                                    </th>
                                                    <th className="w-32 px-4 py-3 text-center font-bold text-muted-foreground">
                                                        Diferencia
                                                    </th>
                                                    <th className="w-48 px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                                                        Costo Unitario (S/)
                                                    </th>
                                                    <th className="w-16 px-4 py-3 text-center">
                                                        Quitar
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {data.items.map((item) => {
                                                    const newStockNum =
                                                        item.new_stock === ''
                                                            ? 0
                                                            : Number(
                                                                  item.new_stock,
                                                              );
                                                    const oldStockNum = Number(
                                                        item.old_stock,
                                                    );
                                                    const diff =
                                                        newStockNum -
                                                        oldStockNum;
                                                    const isCostEditable =
                                                        diff > 0;

                                                    return (
                                                        <tr
                                                            key={
                                                                item.id_product
                                                            }
                                                            className="group transition-colors hover:bg-muted/10"
                                                        >
                                                            <td className="px-4 py-3 font-medium text-foreground">
                                                                <div className="flex flex-col">
                                                                    <span>
                                                                        {
                                                                            item.product_name
                                                                        }
                                                                    </span>
                                                                    <span className="font-mono text-xs text-muted-foreground">
                                                                        [
                                                                        {item.product_code ||
                                                                            'S/C'}
                                                                        ]
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                                                                {oldStockNum.toFixed(
                                                                    2,
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={
                                                                        item.new_stock
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleStockChange(
                                                                            item.id_product,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="mx-auto h-9 w-32 rounded-sm border-blue-200 bg-blue-50/50 text-center font-bold tabular-nums focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-blue-800 dark:bg-blue-950/20"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-bold tabular-nums">
                                                                <span
                                                                    className={cn(
                                                                        diff > 0
                                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                                            : diff <
                                                                                0
                                                                              ? 'text-red-500 dark:text-red-400'
                                                                              : 'text-muted-foreground',
                                                                    )}
                                                                >
                                                                    {diff > 0
                                                                        ? '+'
                                                                        : ''}
                                                                    {diff.toFixed(
                                                                        2,
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center justify-center">
                                                                    <span className="mr-1 text-xs text-muted-foreground">
                                                                        S/
                                                                    </span>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={
                                                                            item.unit_cost
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleCostChange(
                                                                                item.id_product,
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !isCostEditable
                                                                        }
                                                                        className={cn(
                                                                            'h-8 w-28 rounded-sm border-transparent text-center tabular-nums',
                                                                            isCostEditable
                                                                                ? 'border-border bg-transparent font-medium focus-visible:border-blue-500'
                                                                                : 'cursor-not-allowed bg-transparent text-muted-foreground opacity-50 shadow-none',
                                                                        )}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleRemoveItem(
                                                                            item.id_product,
                                                                        )
                                                                    }
                                                                    className="h-8 w-8 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {/* ROW PARA AÑADIR PRODUCTOS (Expandida) */}
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="bg-muted/5 px-4 py-2"
                                                    >
                                                        <div className="flex w-full items-center gap-2">
                                                            <div className="max-w-xl flex-1">
                                                                <Select
                                                                    value={
                                                                        selectedProductId
                                                                    }
                                                                    onValueChange={
                                                                        setSelectedProductId
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-9 border-dashed bg-background text-muted-foreground shadow-sm hover:border-solid hover:border-blue-400 focus:ring-1">
                                                                        <SelectValue placeholder="Buscar y añadir un producto..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {products.map(
                                                                            (
                                                                                p,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        p.id_product
                                                                                    }
                                                                                    value={p.id_product.toString()}
                                                                                >
                                                                                    <span className="mr-2 font-mono text-xs text-muted-foreground">
                                                                                        [
                                                                                        {
                                                                                            p.product_code
                                                                                        }

                                                                                        ]
                                                                                    </span>
                                                                                    {
                                                                                        p.product_name
                                                                                    }
                                                                                </SelectItem>
                                                                            ),
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            {selectedProductId && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    className="h-9 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                                                                    onClick={
                                                                        handleAddProduct
                                                                    }
                                                                >
                                                                    <Plus className="mr-1 h-4 w-4" />{' '}
                                                                    Añadir a la
                                                                    lista
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PANEL DERECHO (Chatter / Historial) - Se mantiene estático a la derecha */}
                    <div className="hidden w-[380px] flex-col border-l border-border bg-muted/10 xl:flex">
                        <div className="z-10 flex items-center gap-1 border-b border-border bg-card p-2 shadow-sm">
                            <Button
                                variant="ghost"
                                className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                            >
                                Enviar mensaje
                            </Button>

                            {/* BOTÓN INTERACTIVO PARA REGISTRAR NOTA */}
                            <Button
                                variant={isWritingNote ? 'secondary' : 'ghost'}
                                onClick={() => setIsWritingNote(!isWritingNote)}
                                className={cn(
                                    'h-8 text-xs font-bold transition-colors',
                                    isWritingNote
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <MessageSquare className="mr-1.5 h-3 w-3" />{' '}
                                Registrar nota
                            </Button>

                            <div className="flex-1"></div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* CAJÓN DESPLEGABLE DE NOTAS (Solo visible si se hizo clic en Registrar nota) */}
                        {isWritingNote && (
                            <div className="animate-in border-b border-border bg-background p-4 slide-in-from-top-2">
                                <textarea
                                    value={data.internal_note}
                                    onChange={(e) =>
                                        setData('internal_note', e.target.value)
                                    }
                                    className="w-full resize-none rounded-md border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Escribir una nota interna para guardar en el historial..."
                                    autoFocus
                                />
                                <div className="mt-3 flex justify-end">
                                    <Button
                                        size="sm"
                                        onClick={() => submitForm('draft')}
                                        disabled={
                                            processing ||
                                            data.items.length === 0
                                        }
                                        className="h-8 bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Guardar nota
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Historial (Logs) */}
                        <div className="flex-1 space-y-6 overflow-y-auto p-6">
                            <div className="relative space-y-6 border-l-2 border-border pl-6">
                                <div className="absolute top-0 -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-background">
                                    <History className="h-3 w-3 text-muted-foreground" />
                                </div>

                                <div className="text-sm">
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="font-bold text-foreground">
                                            Sistema
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Ahora
                                        </span>
                                    </div>
                                    <p className="leading-relaxed text-muted-foreground">
                                        Preparando borrador de ajuste. El
                                        historial detallado y las notas se
                                        guardarán en la base de datos al
                                        confirmar o guardar la operación.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
