import { SearchableSelect } from '@/components/SearchableSelect';
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
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertCircle,
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    History,
    MessageSquare,
    PackageCheck,
    Plus,
    Save,
    Trash2,
    User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// --- TYPE DEFINITIONS ---
interface Product {
    id_product: number;
    product_name: string;
    product_code: string;
    stock: number;
    id_category: number;
    sale_price?: number;
}

interface Category {
    id_product_category: number;
    name_product_category: string;
}

interface MovementItem {
    id_product: number;
    product_name: string;
    product_code: string;
    demand: number;
    quantity: number;
    unit_cost: number;
    is_new?: boolean;
}

interface OperationType {
    id_operation_type: number;
    name: string;
    code: string;
    default_location_source_id: number;
    default_location_destination_id: number;
}

interface Location {
    id_location: number;
    name: string;
}

interface AdjustmentDetail {
    id_adjustment_detail: number;
    id_product: number;
    demand: number;
    quantity: number;
    unit_cost: number;
    product?: Product;
}

interface PurchaseOrderDetail {
    id_product: number;
    product_name: string;
    product_code: string;
    quantity: number;
    received_quantity: number;
    unit_cost?: number;
}

interface PurchaseOrder {
    id_purchase_order: number;
    details: PurchaseOrderDetail[];
}

interface InventoryLog {
    id_inventory_log: number;
    action: string;
    field_changed?: string;
    old_value?: string;
    new_value?: string;
    notes?: string;
    created_at: string;
    user?: { name: string };
}

interface Adjustment {
    id_adjustment: number;
    reference_code: string;
    kardex_date: string;
    contact_name: string;
    created_at: string;

    operation_type: OperationType;
    location_source: Location;
    location_destination: Location;

    id_operation_type?: number;
    id_location_source?: number;
    id_location_destination?: number;

    document_type: string;
    document_number: string;
    reason: string;
    status: 'draft' | 'ready' | 'done';

    details: AdjustmentDetail[];
    purchase_order?: PurchaseOrder;
    logs?: InventoryLog[];
}

interface PageProps {
    adjustment: Adjustment;
    products: Product[];
    categories: Category[];
    operationTypes?: OperationType[];
    locations?: Location[];
    purchaseOrder?: PurchaseOrder;
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

// --- STYLES ---
const odooInputClass =
    'h-8 border-transparent bg-transparent hover:border-border focus:bg-background focus:ring-1 focus:ring-emerald-500 transition-all';
const tableInputClass =
    'h-8 w-full border-transparent bg-transparent text-center shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-emerald-500 tabular-nums dark:text-foreground dark:focus:bg-neutral-800';

export default function InventoryAdjustmentForm({
    adjustment,
    products = [],
    categories = [],
    operationTypes = [],
    locations = [],
    purchaseOrder,
}: PageProps) {
    const { props } = usePage<any>();

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const [isWritingNote, setIsWritingNote] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);

    useEffect(() => {
        let msgToSet: string | null = null;
        let isError = false;

        if (props.errors && Object.keys(props.errors).length > 0) {
            const firstErrorKey = Object.keys(props.errors)[0];
            msgToSet = props.errors[firstErrorKey];
            isError = true;
        } else if (props.flash?.error) {
            msgToSet = props.flash.error;
            isError = true;
        } else if (props.flash?.success) {
            msgToSet = props.flash.success;
            isError = false;
        }

        if (msgToSet) {
            if (isError) {
                setLocalError(msgToSet);
            } else {
                setSuccessMessage(msgToSet);
            }

            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setLocalError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [props.errors, props.flash]);

    const mappedItems = useMemo(() => {
        if (!adjustment?.details) return [];
        return adjustment.details.map((detail) => ({
            id_product: detail.id_product,
            product_name:
                detail.product?.product_name || 'Producto Desconocido',
            product_code: detail.product?.product_code || 'N/A',
            demand: Number(detail.demand) || 0,
            quantity: Number(detail.quantity) || 0,
            unit_cost: Number(detail.unit_cost) || 0,
            is_new: false,
        }));
    }, [adjustment]);

    // Añadimos 'put' y 'isDirty' al destructuring
    const { data, setData, post, put, processing, isDirty } = useForm({
        kardex_date:
            adjustment?.kardex_date || format(new Date(), 'yyyy-MM-dd'),
        contact_name: adjustment?.contact_name || '',

        id_operation_type: adjustment?.operation_type?.id_operation_type
            ? String(adjustment.operation_type.id_operation_type)
            : adjustment?.id_operation_type
              ? String(adjustment.id_operation_type)
              : '',

        id_location_source: adjustment?.location_source?.id_location
            ? String(adjustment.location_source.id_location)
            : adjustment?.id_location_source
              ? String(adjustment.id_location_source)
              : '',

        id_location_destination: adjustment?.location_destination?.id_location
            ? String(adjustment.location_destination.id_location)
            : adjustment?.id_location_destination
              ? String(adjustment.id_location_destination)
              : '',

        document_type: adjustment?.document_type || '',
        document_number: adjustment?.document_number || '',
        reason: adjustment?.reason || '',
        items: mappedItems,
    });

    const linkedPo = purchaseOrder || adjustment.purchase_order;

    const availableOptions = useMemo(() => {
        if (linkedPo) {
            return linkedPo.details
                .filter(
                    (pod) =>
                        !data.items.some(
                            (item) =>
                                item.id_product === pod.id_product &&
                                !item.is_new,
                        ),
                )
                .map((pod) => ({
                    value: String(pod.id_product),
                    label: `[${pod.product_code}] ${pod.product_name} (Faltan: ${pod.quantity - pod.received_quantity})`,
                    demand: pod.quantity - pod.received_quantity,
                    unit_cost: pod.unit_cost || 0,
                    product_name: pod.product_name,
                    product_code: pod.product_code,
                }));
        } else {
            return products
                .filter(
                    (p) =>
                        !data.items.some(
                            (item) =>
                                item.id_product === p.id_product &&
                                !item.is_new,
                        ),
                )
                .map((p) => ({
                    value: String(p.id_product),
                    label: `[${p.product_code}] ${p.product_name}`,
                    demand: 0,
                    unit_cost: p.sale_price || 0,
                    product_name: p.product_name,
                    product_code: p.product_code,
                }));
        }
    }, [linkedPo, data.items, products]);

    const handleCheck = () => {
        const validItems = data.items.filter((item) => item.id_product !== 0);

        if (validItems.length === 0) {
            setLocalError(
                'Debe añadir al menos un producto para comprobar la disponibilidad.',
            );
            return;
        }

        if (!data.id_location_source || !data.id_location_destination) {
            setLocalError(
                'Debe seleccionar una ubicación de origen y destino.',
            );
            return;
        }

        const hasQuantities = validItems.some(
            (item) => Number(item.quantity) > 0,
        );
        if (!hasQuantities) {
            setLocalError(
                'Debe ingresar la cantidad a procesar (Cantidad) en al menos un producto.',
            );
            return;
        }

        setData('items', validItems);

        post(`/inventario/ajuste/${adjustment.id_adjustment}/check`, {
            preserveScroll: true,
        });
    };

    const validate = () => {
        const validItems = data.items.filter((item) => item.id_product !== 0);

        if (validItems.length === 0) {
            setLocalError(
                'Debe añadir al menos un producto para validar el movimiento.',
            );
            return;
        }

        const hasQuantities = validItems.some(
            (item) => Number(item.quantity) > 0,
        );
        if (!hasQuantities) {
            setLocalError(
                'No hay cantidades registradas para procesar el Kardex.',
            );
            return;
        }

        setData('items', validItems);

        post(`/inventario/ajuste/${adjustment.id_adjustment}/validate`, {
            preserveScroll: true,
            onBefore: () =>
                confirm(
                    '¿Está seguro de que desea validar este movimiento? El stock se actualizará permanentemente según la Fecha Kardex indicada.',
                ),
        });
    };

    // --- NUEVO: FUNCIÓN PARA GUARDAR CAMBIOS ADMINISTRATIVOS CUANDO ESTÁ 'DONE' ---
    const handleUpdate = () => {
        put(`/inventario/ajuste/${adjustment.id_adjustment}`, {
            preserveScroll: true,
        });
    };

    const handleItemChange = (
        index: number,
        field: keyof MovementItem,
        value: string | number,
    ) => {
        const newItems = [...data.items];
        const item = newItems[index];
        if (typeof item[field] === 'number') {
            (item[field] as number) = Number(value);
        } else {
            (item[field] as string) = String(value);
        }
        setData('items', newItems);
    };

    const handleProductSelect = (index: number, id_product: string) => {
        const option = availableOptions.find((o) => o.value === id_product);
        if (!option) return;

        const newItems = [...data.items];
        newItems[index] = {
            ...newItems[index],
            id_product: Number(option.value),
            product_name: option.product_name,
            product_code: option.product_code,
            demand: option.demand,
            unit_cost: option.unit_cost,
            is_new: false,
        };
        setData('items', newItems);
    };

    const removeItem = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const addNewRow = () => {
        if (availableOptions.length === 0) {
            setLocalError('Ya no hay más productos pendientes por agregar.');
            return;
        }
        setData('items', [
            ...data.items,
            {
                id_product: 0,
                product_name: '',
                product_code: '',
                demand: 0,
                quantity: 0,
                unit_cost: 0,
                is_new: true,
            },
        ]);
    };

    const handleOperationChange = (opId: string) => {
        const op = operationTypes.find(
            (o) => String(o.id_operation_type) === opId,
        );
        setData((prev) => ({
            ...prev,
            id_operation_type: opId,
            id_location_source: op?.default_location_source_id
                ? String(op.default_location_source_id)
                : prev.id_location_source,
            id_location_destination: op?.default_location_destination_id
                ? String(op.default_location_destination_id)
                : prev.id_location_destination,
        }));
    };

    const saveNote = () => {
        if (!noteText.trim()) return;
        setSubmittingNote(true);
        router.post(
            `/inventario/ajuste/${adjustment.id_adjustment}/note`,
            { internal_note: noteText },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsWritingNote(false);
                    setNoteText('');
                    setSubmittingNote(false);
                },
                onError: () => setSubmittingNote(false),
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Inventario', href: '/inventario' },
                {
                    title: adjustment?.reference_code || 'Nuevo Movimiento',
                    href: '#',
                },
            ]}
        >
            <Head title="Movimiento de Almacén" />

            <FloatingAlert message={localError} type="error" />
            <FloatingAlert message={successMessage} type="success" />

            <div className="flex h-full flex-col overflow-hidden bg-background">
                {/* TOOLBAR SUPERIOR */}
                <div className="flex shrink-0 flex-col border-b border-border bg-card shadow-sm">
                    <div className="flex items-center px-6 py-2 text-sm font-medium text-muted-foreground">
                        <span className="text-emerald-600">
                            {adjustment?.reference_code || 'NUEVO'}
                        </span>
                        <span className="mx-2">/</span>
                        <span className="tracking-tight text-foreground uppercase">
                            {adjustment?.operation_type?.name ||
                                'Operación de Inventario'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            {adjustment?.status === 'draft' && (
                                <Button
                                    onClick={handleCheck}
                                    disabled={
                                        processing || data.items.length === 0
                                    }
                                    className="h-8 bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
                                >
                                    Comprobar
                                </Button>
                            )}

                            {adjustment?.status === 'ready' && (
                                <Button
                                    onClick={validate}
                                    disabled={
                                        processing || data.items.length === 0
                                    }
                                    className="h-8 bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-700"
                                >
                                    Validar
                                </Button>
                            )}

                            {/* BOTÓN GUARDAR CAMBIOS (Aparece cuando hay cambios y está en Realizado) */}
                            {adjustment?.status === 'done' && (
                                <Button
                                    onClick={handleUpdate}
                                    disabled={processing || !isDirty}
                                    variant={isDirty ? 'default' : 'secondary'}
                                    className={cn(
                                        'h-8 px-6 font-bold',
                                        isDirty
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Cambios
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="h-8"
                            >
                                Volver
                            </Button>
                        </div>
                        <div className="ml-2 flex h-8 items-center overflow-hidden rounded-sm border border-border bg-muted/30 text-[10px] font-bold tracking-wider uppercase">
                            <div
                                className={cn(
                                    'relative flex h-full items-center justify-center border-r border-border px-4 transition-colors',
                                    adjustment?.status === 'draft'
                                        ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'text-muted-foreground opacity-50',
                                )}
                            >
                                Borrador
                            </div>
                            <div
                                className={cn(
                                    'relative flex h-full items-center justify-center border-r border-border px-4 transition-colors',
                                    adjustment?.status === 'ready'
                                        ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        : 'text-muted-foreground opacity-50',
                                )}
                            >
                                Listo
                            </div>
                            <div
                                className={cn(
                                    'relative flex h-full items-center justify-center px-4 transition-colors',
                                    adjustment?.status === 'done'
                                        ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'text-muted-foreground opacity-50',
                                )}
                            >
                                Realizado
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {/* PANEL IZQUIERDO: FORMULARIO */}
                    <div className="custom-scrollbar flex-1 overflow-y-auto border-r-2 border-border/80">
                        <div className="space-y-8 p-8">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <PackageCheck className="h-8 w-8 text-emerald-500" />
                                    <h1 className="text-3xl font-black tracking-tighter uppercase">
                                        {adjustment?.reference_code ||
                                            'BORRADOR'}
                                    </h1>
                                </div>
                                {adjustment?.created_at && (
                                    <div className="flex flex-col items-end text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1 font-bold tracking-widest uppercase">
                                            <CalendarClock className="h-3 w-3" />
                                            Fecha de Registro
                                        </div>
                                        <span>
                                            {format(
                                                new Date(adjustment.created_at),
                                                'dd/MM/yyyy HH:mm',
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* CABECERA DINÁMICA */}
                            <div className="grid grid-cols-2 gap-x-16 gap-y-2">
                                <div className="space-y-1">
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="w-32 text-sm font-bold text-muted-foreground">
                                            Contacto:
                                        </span>
                                        <Input
                                            placeholder="Proveedor o Cliente..."
                                            className={cn(
                                                odooInputClass,
                                                'w-full',
                                            )}
                                            value={data.contact_name}
                                            onChange={(e) =>
                                                setData(
                                                    'contact_name',
                                                    e.target.value,
                                                )
                                            }
                                            // --- Desbloqueado ---
                                        />
                                    </div>
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="w-32 text-sm font-bold text-muted-foreground">
                                            Tipo Operación:
                                        </span>
                                        {adjustment?.status === 'done' ? (
                                            <span className="text-sm font-bold tracking-tighter text-blue-600 uppercase">
                                                {adjustment?.operation_type
                                                    ?.name || '—'}
                                            </span>
                                        ) : (
                                            <Select
                                                value={data.id_operation_type}
                                                onValueChange={
                                                    handleOperationChange
                                                }
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        odooInputClass,
                                                        'w-full font-bold tracking-tighter text-blue-600 uppercase',
                                                    )}
                                                >
                                                    <SelectValue placeholder="Seleccione operación..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {operationTypes?.map(
                                                        (op) => (
                                                            <SelectItem
                                                                key={
                                                                    op.id_operation_type
                                                                }
                                                                value={String(
                                                                    op.id_operation_type,
                                                                )}
                                                                className="text-xs font-bold text-blue-600 uppercase"
                                                            >
                                                                {op.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="w-32 text-sm font-bold text-muted-foreground">
                                            Origen / Destino:
                                        </span>
                                        {adjustment?.status === 'done' ? (
                                            <div className="flex items-center gap-2 text-[11px] font-black text-emerald-700 uppercase">
                                                <span>
                                                    {adjustment?.location_source
                                                        ?.name || '—'}
                                                </span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                <span>
                                                    {adjustment
                                                        ?.location_destination
                                                        ?.name || '—'}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-1 items-center gap-2">
                                                <Select
                                                    value={
                                                        data.id_location_source
                                                    }
                                                    onValueChange={(v) =>
                                                        setData(
                                                            'id_location_source',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            odooInputClass,
                                                            'w-full text-[10px] font-bold text-emerald-700 uppercase',
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Origen" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {locations?.map((l) => (
                                                            <SelectItem
                                                                key={
                                                                    l.id_location
                                                                }
                                                                value={String(
                                                                    l.id_location,
                                                                )}
                                                                className="text-xs font-bold uppercase"
                                                            >
                                                                {l.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                <Select
                                                    value={
                                                        data.id_location_destination
                                                    }
                                                    onValueChange={(v) =>
                                                        setData(
                                                            'id_location_destination',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            odooInputClass,
                                                            'w-full text-[10px] font-bold text-emerald-700 uppercase',
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Destino" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {locations?.map((l) => (
                                                            <SelectItem
                                                                key={
                                                                    l.id_location
                                                                }
                                                                value={String(
                                                                    l.id_location,
                                                                )}
                                                                className="text-xs font-bold uppercase"
                                                            >
                                                                {l.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="flex w-36 flex-col text-sm leading-tight font-bold text-muted-foreground">
                                            <span>Fecha Kardex:</span>
                                            <span className="text-[9px] font-normal opacity-70">
                                                (Traza Contable)
                                            </span>
                                        </span>
                                        <Input
                                            type="date"
                                            value={data.kardex_date}
                                            className={cn(
                                                odooInputClass,
                                                'w-40',
                                            )}
                                            onChange={(e) =>
                                                setData(
                                                    'kardex_date',
                                                    e.target.value,
                                                )
                                            }
                                            // --- Desbloqueado ---
                                        />
                                    </div>
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="w-36 text-sm font-bold text-muted-foreground">
                                            Documento:
                                        </span>
                                        <div className="flex flex-1 gap-2">
                                            <Input
                                                placeholder="Ej: Factura"
                                                className={cn(
                                                    odooInputClass,
                                                    'w-24',
                                                )}
                                                value={data.document_type}
                                                onChange={(e) =>
                                                    setData(
                                                        'document_type',
                                                        e.target.value,
                                                    )
                                                }
                                                // --- Desbloqueado ---
                                            />
                                            <Input
                                                placeholder="Número"
                                                className={odooInputClass}
                                                value={data.document_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'document_number',
                                                        e.target.value,
                                                    )
                                                }
                                                // --- Desbloqueado ---
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TABLA DE PRODUCTOS */}
                            <div className="pt-2 pb-12">
                                <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
                                    <table className="w-full">
                                        <thead className="border-b border-border bg-muted/40">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                    Producto
                                                </th>
                                                <th className="w-28 px-4 py-3 text-center text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                    Demanda
                                                </th>
                                                <th className="w-32 px-4 py-3 text-center text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                                                    Cantidad
                                                </th>
                                                <th className="w-32 px-4 py-3 text-center text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                                                    Costo Unitario
                                                </th>
                                                <th className="w-12 px-2 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {data.items.map((item, idx) => (
                                                <tr
                                                    key={
                                                        item.id_product ||
                                                        `new-${idx}`
                                                    }
                                                    className="transition-colors hover:bg-muted/5"
                                                >
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        {item.is_new ? (
                                                            <div className="w-full min-w-[250px]">
                                                                <SearchableSelect
                                                                    options={
                                                                        availableOptions
                                                                    }
                                                                    value={
                                                                        item.id_product
                                                                            ? String(
                                                                                  item.id_product,
                                                                              )
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        val,
                                                                    ) =>
                                                                        handleProductSelect(
                                                                            idx,
                                                                            val,
                                                                        )
                                                                    }
                                                                    placeholder="Seleccionar producto..."
                                                                    className={cn(
                                                                        tableInputClass,
                                                                        'text-left text-sm',
                                                                    )}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="mr-1 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                                    [
                                                                    {
                                                                        item.product_code
                                                                    }
                                                                    ]
                                                                </span>
                                                                <span>
                                                                    {
                                                                        item.product_name
                                                                    }
                                                                </span>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-black text-muted-foreground tabular-nums">
                                                        {item.demand}
                                                    </td>
                                                    <td className="bg-emerald-50/20 px-4 py-2 dark:bg-emerald-950/10">
                                                        <Input
                                                            type="number"
                                                            className={cn(
                                                                tableInputClass,
                                                                'text-emerald-700 dark:text-emerald-400',
                                                            )}
                                                            value={
                                                                item.quantity
                                                            }
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    idx,
                                                                    'quantity',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            min="0"
                                                            step="0.01"
                                                            readOnly={
                                                                adjustment?.status ===
                                                                    'done' ||
                                                                item.is_new
                                                            }
                                                        />
                                                    </td>
                                                    <td className="bg-emerald-50/20 px-4 py-2 dark:bg-emerald-950/10">
                                                        <Input
                                                            type="number"
                                                            className={cn(
                                                                tableInputClass,
                                                                'text-emerald-700 dark:text-emerald-400',
                                                            )}
                                                            value={
                                                                item.unit_cost
                                                            }
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    idx,
                                                                    'unit_cost',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            min="0"
                                                            step="0.01"
                                                            readOnly={
                                                                adjustment?.status ===
                                                                    'done' ||
                                                                item.is_new
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-2 text-center align-middle">
                                                        {adjustment?.status !==
                                                            'done' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-500 opacity-50 hover:bg-red-50 hover:opacity-100 dark:hover:bg-red-950/30"
                                                                onClick={() =>
                                                                    removeItem(
                                                                        idx,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {adjustment?.status !== 'done' && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="bg-muted/10 px-4 py-2"
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={addNewRow}
                                                            className="h-8 text-xs font-bold text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30"
                                                        >
                                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                            Agregar Producto
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL DERECHO - CHATTER ESTILO COMPRAS */}
                    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10">
                        <div className="flex items-center justify-between border-b border-border bg-card p-4 shadow-sm">
                            <span className="flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground uppercase">
                                <History className="h-3.5 w-3.5" /> Historial
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsWritingNote(!isWritingNote)}
                                className={cn(
                                    'h-7 text-[10px] font-bold uppercase transition-colors',
                                    isWritingNote
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <MessageSquare className="mr-1.5 h-3 w-3" />{' '}
                                Registrar nota
                            </Button>
                        </div>

                        {isWritingNote && (
                            <div className="shrink-0 animate-in border-b border-border bg-background p-4 slide-in-from-top-2">
                                <textarea
                                    className="w-full resize-none rounded-md border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    placeholder="Escribir una nota interna..."
                                    rows={3}
                                    value={noteText}
                                    onChange={(e) =>
                                        setNoteText(e.target.value)
                                    }
                                    autoFocus
                                />
                                <div className="mt-3 flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setIsWritingNote(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-7 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                                        onClick={saveNote}
                                        disabled={
                                            submittingNote || !noteText.trim()
                                        }
                                    >
                                        Guardar nota
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
                            <div className="relative mt-2 ml-2 space-y-6 border-l-2 border-border pl-6">
                                {adjustment?.logs &&
                                adjustment.logs.length > 0 ? (
                                    adjustment.logs.map((log: any) => (
                                        <div
                                            key={log.id_inventory_log}
                                            className="relative text-sm"
                                        >
                                            <div className="absolute top-0 -left-[35px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-background">
                                                {log.action === 'Nota' ? (
                                                    <MessageSquare className="h-3 w-3 text-blue-500" />
                                                ) : (
                                                    <History className="h-3 w-3 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="flex items-center gap-1 font-bold text-foreground">
                                                    <User className="h-3 w-3" />{' '}
                                                    {log.user?.name ||
                                                        'Sistema'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {format(
                                                        new Date(
                                                            log.created_at,
                                                        ),
                                                        'dd/MM/yyyy HH:mm',
                                                    )}
                                                </span>
                                            </div>

                                            {log.action === 'Nota' ? (
                                                <div className="mt-1 rounded-md border border-border bg-white p-3 shadow-sm dark:bg-muted">
                                                    <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                                        {log.notes}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="mt-1 leading-relaxed">
                                                    <span className="text-muted-foreground">
                                                        {log.action}:{' '}
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        {log.field_changed ||
                                                            log.new_value}
                                                    </span>
                                                    {log.old_value && (
                                                        <span className="ml-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                                            {log.old_value}{' '}
                                                            &rarr;{' '}
                                                            {log.new_value}
                                                        </span>
                                                    )}
                                                    {log.notes && (
                                                        <p className="mt-1 text-xs text-muted-foreground italic">
                                                            {log.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="relative text-sm">
                                        <div className="absolute top-0 -left-[35px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-background">
                                            <History className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="flex items-center gap-1 font-bold text-foreground">
                                                <User className="h-3 w-3" />{' '}
                                                Sistema
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                Ahora
                                            </span>
                                        </div>
                                        <div className="mt-1 leading-relaxed text-muted-foreground italic">
                                            Creando borrador de Orden. El
                                            historial y las notas se guardarán
                                            en la base de datos al presionar
                                            "Guardar Borrador" o al validar.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
