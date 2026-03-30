import { FloatingAlert } from '@/components/FloatingAlert';
import { usePermission } from '@/hooks/usePermission';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    Download,
    FileText,
    History,
    MessageSquare,
    PackageOpen,
    Paperclip,
    Printer,
    Search, Shield,
    ShoppingBag,
    Trash2,
    Truck,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// --- ESTILOS REUTILIZABLES ---
const cleanInputClass =
    'h-9 w-full rounded-none border-0 border-b border-muted bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-emerald-600 focus:outline-none transition-all font-medium dark:text-foreground dark:border-neutral-700 dark:focus:border-emerald-500';
const tableInputClass =
    'h-8 w-full border-transparent bg-transparent text-center shadow-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-emerald-500 tabular-nums dark:text-foreground dark:focus:bg-neutral-800';

// --- INTERFACES CORREGIDAS ---
interface Supplier {
    id_supplier: number;
    company_name: string;
    ruc: string;
}

interface Product {
    id_product: number;
    product_name: string;
    product_code: string | null;
    sale_price: number;
    purchase_price: number;
}

interface DetailRow {
    id: number;
    id_product: string;
    id_tax: string;
    description: string;
    quantity: number;
    received_quantity: number;
    billed_quantity: number;
    unit_cost: number;
    margin_percentage: number;
    suggested_sale_price: number;
}

interface OrderLog {
    id: number;
    action: string;
    notes: string | null;
    created_at: string;
    user?: { name: string };
}

interface PurchaseOrder {
    actual_arrival_date: React.JSX.Element;
    id_purchase_order: number;
    po_code: string;
    status: string;
    order_type: string;
    id_supplier: number;
    currency: string;
    exchange_rate: string;
    issue_date: string;
    expected_date: string | null;
    notes: string | null;
    details: any[];
    logs: OrderLog[];
    inventory_adjustments_count: number;
    receipts_count: number;
}
interface Tax {
    id_tax: number;
    name: string;
    percentage: number;
    scope: string;
}
interface Props {
    order: PurchaseOrder;
    suppliers: Supplier[];
    products: Product[];
    documentTypes: { value: string; label: string }[];
    taxes: Tax[];
}

const FormFieldRow = ({
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

export default function EditPurchaseOrder({
    order,
    suppliers,
    products,
    taxes
}: Props) {
    const { hasPermission } = usePermission();
    useEffect(() => {
        const handleFocus = () => {
            router.reload({ only: ['order'] }); // Solo recarga el objeto de la orden
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);
    const { props } = usePage<any>();
    const [formError, setFormError] = useState<string | null>(null);
    const [isWritingNote, setIsWritingNote] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    const [showBillingModal, setShowBillingModal] = useState(false);
    const [billingData, setBillingData] = useState({
        type: 'Factura',
        series: '',
        number: '',
    });

    const isDraft = order.status === 'draft';
    const isSent = order.status === 'sent';
    const isApproved = order.status === 'approved';
    const isDone = order.status === 'received';
    const isCancelled = order.status === 'cancelled';
    const showTracking = !isDraft && !isCancelled;

    const initialRows: DetailRow[] = order.details.map((line: any) => ({
        id: line.id_po_detail,
        id_product: line.id_product ? String(line.id_product) : '',
        id_tax: line.id_tax
            ? String(line.id_tax)
            : taxes
                  .find((t) => Number(t.percentage) === 18)
                  ?.id_tax.toString() || '',
        description: line.description || '',
        quantity: Number(line.quantity),
        received_quantity: Number(line.received_quantity || 0),
        billed_quantity: Number(line.billed_quantity || 0),
        unit_cost: Number(line.unit_cost),
        margin_percentage: Number(line.margin_percentage || 0),
        suggested_sale_price: Number(line.suggested_sale_price || 0),
    }));

    const [rows, setRows] = useState<DetailRow[]>(initialRows);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const {
        data,
        setData,
        errors,
        clearErrors,
        isDirty,
        post: postAction,
        processing: processingNote,
        reset,
    } = useForm({
        id_supplier: String(order.id_supplier),
        po_code: order.po_code,
        order_type: order.order_type || 'purchase',
        currency: order.currency || 'PEN',
        exchange_rate: order.exchange_rate || '1.000',
        issue_date: new Date(order.issue_date),
        expected_date: order.expected_date
            ? new Date(order.expected_date)
            : null,
        notes: order.notes || '',
        internal_note: '',
        status: order.status,
        note_file: null as File | null,
    });

    const isServiceOrder = data.order_type === 'service';
    const symbol = data.currency === 'USD' ? '$' : 'S/';
    const hasUnsavedChanges = useMemo(() => {
        const rowsChanged =
            JSON.stringify(rows) !== JSON.stringify(initialRows);
        return isDirty || rowsChanged;
    }, [rows, isDirty, initialRows]);

    const needsReception = useMemo(() => {
        if (isServiceOrder || !isApproved) return false;
        return rows.some((r) => r.received_quantity < r.quantity);
    }, [rows, isApproved, isServiceOrder]);

    const needsBilling = useMemo(() => {
        if (!isApproved && !isDone) return false;
        return rows.some((r) => r.billed_quantity < r.quantity);
    }, [rows, isApproved, isDone]);

    const handleCurrencyChange = (val: string) =>
        setData((prev) => ({
            ...prev,
            currency: val,
            exchange_rate: val === 'PEN' ? '1.000' : '3.800',
        }));

    const onFieldChange = (field: string, value: any) => {
        setData(field as any, value);
        if (errors[field as keyof typeof errors]) clearErrors(field as any);
    };

    // ✅ LÓGICA DE CÁLCULO DE PRECIOS Y MÁRGENES
    const updateRow = (id: number, field: keyof DetailRow, value: any) => {
        if (isDone || isApproved) return;
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                const newRow = { ...row, [field]: value } as DetailRow;

                if (field === 'unit_cost' || field === 'margin_percentage') {
                    const cost =
                        field === 'unit_cost' ? Number(value) : row.unit_cost;
                    const margin =
                        field === 'margin_percentage'
                            ? Number(value)
                            : row.margin_percentage;
                    if (cost > 0)
                        newRow.suggested_sale_price = parseFloat(
                            (cost * (1 + margin / 100)).toFixed(2),
                        );
                }
                if (field === 'suggested_sale_price') {
                    const salePrice = Number(value);
                    const cost = row.unit_cost;
                    if (salePrice > 0 && cost > 0) {
                        newRow.margin_percentage = parseFloat(
                            (((salePrice - cost) / cost) * 100).toFixed(2),
                        );
                    }
                }
                return newRow;
            }),
        );
    };

    const submitNote = () => {
        if (!data.internal_note.trim() && !data.note_file) return;

        postAction(`/compras/ordenes/${order.id_purchase_order}/nota`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsWritingNote(false);
                reset('internal_note', 'note_file');
                router.reload({ only: ['order'] });
            },
            onError: (errors) => {
                setFormError(errors.error || 'Error al guardar la nota');
            },
        });
    };

    const subTotal = rows.reduce(
        (acc, row) => acc + row.quantity * row.unit_cost,
        0,
    );
    const igvAmount = subTotal * 0.18;
    const totalAmount = subTotal + igvAmount;
    const totalInSoles =
        data.currency === 'USD'
            ? totalAmount * Number(data.exchange_rate)
            : totalAmount;
    const hasDetailErrors = Object.keys(errors).some((key) =>
        key.startsWith('details'),
    );
    const supplierOptions = suppliers.map((s) => ({
        value: String(s.id_supplier),
        label: s.company_name,
    }));
    const productOptions = products.map((p) => ({
        value: String(p.id_product),
        label: p.product_code
            ? `[${p.product_code}] ${p.product_name}`
            : p.product_name,
    }));

    const submitForm = (targetStatus: 'draft' | 'sent') => {
        const dataToSend = {
            ...data,
            _method: 'put',
            status: targetStatus,
            issue_date: format(data.issue_date, 'yyyy-MM-dd HH:mm:ss'),
            expected_date: data.expected_date
                ? format(data.expected_date, 'yyyy-MM-dd')
                : null,
            exchange_rate: parseFloat(data.exchange_rate),
            total_amount: totalAmount,
            details: rows
                .filter((r) => (!isServiceOrder ? r.id_product : r.description))
                .map((r) => ({
                    id_product: !isServiceOrder ? r.id_product : null,
                    id_tax: r.id_tax,
                    description: isServiceOrder ? r.description : null,
                    quantity: r.quantity,
                    unit_cost: r.unit_cost,
                    margin_percentage: r.margin_percentage,
                    suggested_sale_price: r.suggested_sale_price,
                    subtotal: r.quantity * r.unit_cost,
                    is_service: isServiceOrder ? 1 : 0,
                })),
        };

        setFormError(null);

        router.post(
            `/compras/ordenes/${order.id_purchase_order}`,
            dataToSend as any,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsWritingNote(false);
                },
                onError: (errs) => {
                    if (errs.error) setFormError(errs.error as string);
                },
            },
        );
    };

    const handleApproveOrder = () => {
        setIsApproving(true);
        router.post(
            `/compras/ordenes/${order.id_purchase_order}/aprobar`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setIsApproving(false),
                onError: (errs) => {
                    if (errs.error) setFormError(errs.error as string);
                    setIsApproving(false);
                },
            },
        );
    };

    const goToBilling = () => {
        const params = new URLSearchParams({
            source_po: order.id_purchase_order.toString(),
            type: billingData.type,
            series: billingData.series,
            number: billingData.number,
        }).toString();
        router.get(`/recibos/nuevoRecibo?${params}`);
    };

    const handleCancelOrder = () => {
        if (confirm('¿Estás seguro de que deseas cancelar esta orden?')) {
            router.post(
                `/compras/ordenes/${order.id_purchase_order}/cancelar`,
                {},
                { preserveScroll: true },
            );
        }
    };
    useEffect(() => {
        const updatedRows: DetailRow[] = order.details.map((line: any) => ({
            id: line.id_po_detail,
            id_product: line.id_product ? String(line.id_product) : '',
            id_tax: line.id_tax ? String(line.id_tax) :
                (taxes.find((t) => Number(t.percentage) === 18)?.id_tax.toString() || ''),
            description: line.description || '',
            quantity: Number(line.quantity),
            received_quantity: Number(line.received_quantity || 0),
            billed_quantity: Number(line.billed_quantity || 0),
            unit_cost: Number(line.unit_cost),
            margin_percentage: Number(line.margin_percentage || 0),
            suggested_sale_price: Number(line.suggested_sale_price || 0),
        }));

        setRows(updatedRows);
    }, [order.details, taxes]);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Compras', href: '/compras/ordenes' },
                { title: order.po_code, href: '#' },
            ]}
        >
            <Head title={order.po_code} />

            <FloatingAlert
                message={formError || (props.flash?.error as string)}
                type="error"
                onClose={() => setFormError(null)}
            />

            <FloatingAlert
                message={props.flash?.success as string}
                type="success"
            />

            <div className="flex h-full flex-col overflow-hidden bg-background">
                {/* TOOLBAR */}
                <div className="flex shrink-0 flex-col border-b border-border bg-card">
                    <div className="flex items-center px-6 py-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-emerald-600">
                            {order.po_code}
                        </span>
                        <span className="mx-2">/</span>{' '}
                        {order.status.toUpperCase()}
                    </div>

                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">

                            {!(isDone || isApproved || isCancelled) && hasPermission('purchase.create') && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => submitForm(order.status as 'draft' | 'sent')}
                                        disabled={!hasUnsavedChanges}
                                        className="h-8"
                                    >
                                        Guardar Cambios
                                    </Button>

                                    {/* Si está en borrador, mostramos el botón para enviarla a revisión */}
                                    {isDraft && (
                                        <Button
                                            onClick={() => submitForm('sent')}
                                            disabled={rows.length === 0}
                                            className="h-8 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                        >
                                            Confirmar Orden
                                        </Button>
                                    )}
                                </>
                            )}

                            {order.status === 'sent' && (
                                <>
                                    {hasPermission('purchase.approve') ? (
                                        <Button
                                            onClick={handleApproveOrder}
                                            disabled={isApproving}
                                            className="h-8 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 font-bold"
                                        >
                                            <Shield className="mr-2 h-4 w-4" />
                                            Aprobar Orden
                                        </Button>
                                    ) : (
                                        <div className="flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                                        <History className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                                        Esperando Aprobación...
                                        </div>
                                    )}
                                </>
                            )}

                            {/* --- 3. ACCIONES OPERATIVAS (Aprobada o Completada) --- */}
                            {(isApproved || isDone) && hasPermission('purchase.create') && (
                                <>
                                    {needsReception && (
                                        <Button
                                            onClick={() => router.get(`/compras/ordenes/${order.id_purchase_order}/recepcion`)}
                                            className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                                        >
                                            <PackageOpen className="mr-2 h-4 w-4" /> Recibir Productos
                                        </Button>
                                    )}
                                    {needsBilling && (
                                        <Button
                                            onClick={() => setShowBillingModal(true)}
                                            variant="outline"
                                            className="h-8 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                        >
                                            <FileText className="mr-2 h-4 w-4" /> Facturar Productos
                                        </Button>
                                    )}
                                </>
                            )}

                            {/* --- 4. CANCELAR Y VOLVER --- */}
                            {!isDone && !isCancelled && hasPermission('purchase.approve') && (
                                <Button
                                    onClick={handleCancelOrder}
                                    variant="ghost"
                                    className="h-8 font-bold text-red-600 hover:bg-red-50"
                                >
                                    Cancelar Orden
                                </Button>
                            )}

                            <Button variant="ghost" onClick={() => window.history.back()} className="h-8">
                                Volver
                            </Button>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    if (printFrameRef.current) {
                                        printFrameRef.current.src = `/compras/${order.id_purchase_order}/print`;
                                        printFrameRef.current.onload = () => {
                                            printFrameRef.current?.contentWindow?.focus();
                                            printFrameRef.current?.contentWindow?.print();
                                        };
                                    }
                                }}
                                className="flex h-12 items-center gap-1.5 border-r border-border px-3 text-slate-600 transition-all hover:bg-muted/50"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-semibold uppercase">
                                    Imprimir
                                </span>
                            </button>
                            {order.inventory_adjustments_count > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.get(
                                            '/inventario/ajuste/movimientos',
                                            { search: order.po_code },
                                        )
                                    }
                                    className="h-9 border-emerald-200 bg-emerald-50/30 px-3 hover:border-emerald-300 hover:bg-emerald-100"
                                >
                                    <Truck className="mr-2 h-4 w-4 text-emerald-600" />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-[8px] leading-none font-bold text-muted-foreground uppercase">
                                            Recepciones
                                        </span>
                                        <span className="text-[10px] leading-tight font-black text-emerald-700">
                                            {order.inventory_adjustments_count}{' '}
                                            {order.inventory_adjustments_count >
                                            1
                                                ? 'Movimientos'
                                                : 'Movimiento'}
                                        </span>
                                    </div>
                                </Button>
                            )}

                            {/* Smart Button: Comprobantes (Solo si hay facturas/boletas) */}
                            {order.receipts_count > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.get('/recibos', {
                                            search: order.po_code,
                                        })
                                    }
                                    className="h-9 border-blue-200 bg-blue-50/30 px-3 hover:border-blue-300 hover:bg-blue-100"
                                >
                                    <FileText className="mr-2 h-4 w-4 text-blue-600" />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-[8px] leading-none font-bold text-muted-foreground uppercase">
                                            Comprobantes
                                        </span>
                                        <span className="text-[10px] leading-tight font-black text-blue-700">
                                            {order.receipts_count}{' '}
                                            {order.receipts_count > 1
                                                ? 'Comprobantes'
                                                : 'Comprobante'}
                                        </span>
                                    </div>
                                </Button>
                            )}

                            {/* StatusBar Indicators */}
                            <div className="flex h-8 items-center overflow-hidden rounded-sm border border-border bg-muted/30 text-[10px] font-bold uppercase">
                                <div
                                    className={cn(
                                        'border-r px-4 py-2',
                                        isDraft
                                            ? 'bg-emerald-600/10 text-emerald-600'
                                            : 'opacity-50',
                                    )}
                                >
                                    Cotización
                                </div>
                                <div
                                    className={cn(
                                        'border-r px-4 py-2',
                                        order.status === 'sent'
                                            ? 'bg-blue-600/10 text-blue-600'
                                            : 'opacity-50',
                                    )}
                                >
                                    Confirmada
                                </div>
                                <div
                                    className={cn(
                                        'border-r px-4 py-2',
                                        order.status === 'approved'
                                            ? 'bg-yellow-600/10 text-yellow-600'
                                            : 'opacity-50',
                                    )}
                                >
                                    Aprobada
                                </div>
                                <div
                                    className={cn(
                                        'px-4 py-2',
                                        isDone
                                            ? 'bg-emerald-600/10 text-emerald-600'
                                            : 'opacity-50',
                                    )}
                                >
                                    Completada
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8">
                        <div className="w-full min-w-[800px] space-y-8">
                            <div className="flex items-center gap-3">
                                <ShoppingBag
                                    className={cn(
                                        'h-8 w-8',
                                        isDone
                                            ? 'text-emerald-500'
                                            : 'text-muted-foreground opacity-30',
                                    )}
                                />
                                <h1 className="text-3xl font-bold uppercase">
                                    {order.po_code}
                                </h1>
                            </div>

                            {/* CABECERA FORMULARIO */}
                            <div className="grid grid-cols-1 gap-x-12 gap-y-2 pt-4 xl:grid-cols-2">
                                <div className="space-y-1">
                                    <FormFieldRow label="Tipo de Orden">
                                        <Select
                                            value={data.order_type}
                                            onValueChange={(val) =>
                                                onFieldChange('order_type', val)
                                            }
                                            disabled={!isDraft}
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    cleanInputClass,
                                                    'font-bold text-emerald-700',
                                                )}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="purchase">
                                                    Orden de Compra
                                                </SelectItem>
                                                <SelectItem value="service">
                                                    Orden de Servicio
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormFieldRow>
                                    <FormFieldRow label="Proveedor">
                                        <SearchableSelect
                                            options={supplierOptions}
                                            value={data.id_supplier}
                                            onChange={(val) =>
                                                onFieldChange(
                                                    'id_supplier',
                                                    val,
                                                )
                                            }
                                            isDisabled={isDone || isApproved}
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>
                                    <FormFieldRow label="Referencia Proveedor">
                                        <Input
                                            value={data.notes}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'notes',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={isDone || isApproved}
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>
                                </div>
                                <div className="space-y-1">
                                    <FormFieldRow label="Moneda">
                                        <Select
                                            value={data.currency}
                                            onValueChange={handleCurrencyChange}
                                            disabled={isDone || isApproved}
                                        >
                                            <SelectTrigger
                                                className={cleanInputClass}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PEN">
                                                    Soles (PEN)
                                                </SelectItem>
                                                <SelectItem value="USD">
                                                    Dólares (USD)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormFieldRow>
                                    <FormFieldRow label="Tipo de Cambio">
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={data.exchange_rate}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'exchange_rate',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                data.currency === 'PEN' ||
                                                isDone ||
                                                isApproved
                                            }
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>
                                    <FormFieldRow label="Fecha de Orden">
                                        <Input
                                            type="date"
                                            value={format(
                                                data.issue_date,
                                                'yyyy-MM-dd',
                                            )}
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'issue_date',
                                                    new Date(e.target.value),
                                                )
                                            }
                                            disabled={isDone || isApproved}
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>
                                    <FormFieldRow label="Llegada Esperada">
                                        <Input
                                            type="date"
                                            value={
                                                data.expected_date
                                                    ? format(
                                                          data.expected_date,
                                                          'yyyy-MM-dd',
                                                      )
                                                    : ''
                                            }
                                            onChange={(e) =>
                                                onFieldChange(
                                                    'expected_date',
                                                    e.target.value
                                                        ? new Date(
                                                              e.target.value,
                                                          )
                                                        : null,
                                                )
                                            }
                                            disabled={isDone || isApproved}
                                            className={cleanInputClass}
                                        />
                                    </FormFieldRow>
                                    {order.actual_arrival_date && (
                                        <FormFieldRow label="Llegada Real">
                                            <Input
                                                value={format(
                                                    new Date(
                                                        order.actual_arrival_date,
                                                    ),
                                                    'dd/MM/yyyy',
                                                )}
                                                disabled
                                                className={cn(
                                                    cleanInputClass,
                                                    'border-emerald-200 font-bold text-emerald-700',
                                                )}
                                            />
                                        </FormFieldRow>
                                    )}
                                </div>
                            </div>

                            {/* TABLA DE DETALLES */}
                            <div className="w-full pt-6">
                                <div className="mb-4 border-b border-border text-sm font-bold text-muted-foreground">
                                    <span className="border-b-2 border-emerald-600 pb-2 text-foreground">
                                        {isServiceOrder
                                            ? 'Servicios'
                                            : 'Productos'}
                                    </span>
                                </div>
                                <div
                                    className={cn(
                                        'w-full overflow-hidden rounded-sm border border-border bg-card shadow-sm',
                                        hasDetailErrors && 'border-red-500',
                                    )}
                                >
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="w-[350px] px-4">
                                                    Producto / Descripción
                                                </TableHead>
                                                <TableHead className="w-[100px] text-center">
                                                    Cantidad
                                                </TableHead>
                                                {showTracking && (
                                                    <>
                                                        <TableHead className="w-[100px] text-center">
                                                            Recibida
                                                        </TableHead>
                                                        <TableHead className="w-[100px] text-center">
                                                            Facturada
                                                        </TableHead>
                                                    </>
                                                )}
                                                <TableHead className="w-[120px] text-right">
                                                    Costo ({symbol})
                                                </TableHead>
                                                <TableHead className="w-[120px] text-center">
                                                    Impuesto
                                                </TableHead>
                                                {!isServiceOrder && (
                                                    <>
                                                        <TableHead className="w-[100px] text-center">
                                                            % Margen
                                                        </TableHead>
                                                        <TableHead className="w-[120px] text-right">
                                                            P. Venta
                                                        </TableHead>
                                                    </>
                                                )}
                                                <TableHead className="w-[120px] text-right">
                                                    Subtotal
                                                </TableHead>
                                                {!(isDone || isApproved) && (
                                                    <TableHead className="w-[50px]"></TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border/50">
                                            {rows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    className="group"
                                                >
                                                    <TableCell className="px-2">
                                                        {!isServiceOrder ? (
                                                            <SearchableSelect
                                                                options={
                                                                    productOptions
                                                                }
                                                                value={
                                                                    row.id_product
                                                                }
                                                                onChange={(
                                                                    v,
                                                                ) => {
                                                                    const p =
                                                                        products.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                String(
                                                                                    p.id_product,
                                                                                ) ===
                                                                                v,
                                                                        );
                                                                    updateRow(
                                                                        row.id,
                                                                        'id_product',
                                                                        v,
                                                                    );
                                                                    updateRow(
                                                                        row.id,
                                                                        'description',
                                                                        p?.product_name ||
                                                                            '',
                                                                    );
                                                                    updateRow(
                                                                        row.id,
                                                                        'unit_cost',
                                                                        p?.purchase_price ||
                                                                            0,
                                                                    );
                                                                    updateRow(
                                                                        row.id,
                                                                        'suggested_sale_price',
                                                                        p?.sale_price ||
                                                                            0,
                                                                    );
                                                                    // Calcular margen inicial
                                                                    if (
                                                                        p &&
                                                                        p.purchase_price >
                                                                            0
                                                                    ) {
                                                                        const m =
                                                                            ((p.sale_price -
                                                                                p.purchase_price) /
                                                                                p.purchase_price) *
                                                                            100;
                                                                        updateRow(
                                                                            row.id,
                                                                            'margin_percentage',
                                                                            parseFloat(
                                                                                m.toFixed(
                                                                                    2,
                                                                                ),
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                                isDisabled={
                                                                    isDone ||
                                                                    isApproved
                                                                }
                                                            />
                                                        ) : (
                                                            <Input
                                                                value={
                                                                    row.description
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row.id,
                                                                        'description',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isDone ||
                                                                    isApproved
                                                                }
                                                                className="h-8 border-transparent"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={row.quantity}
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'quantity',
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                            disabled={
                                                                isDone ||
                                                                isApproved ||
                                                                isCancelled
                                                            }
                                                            className={
                                                                tableInputClass
                                                            }
                                                        />
                                                    </TableCell>
                                                    {showTracking && (
                                                        <>
                                                            <TableCell className="text-center font-bold text-emerald-600">
                                                                {
                                                                    row.received_quantity
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold text-blue-600">
                                                                {
                                                                    row.billed_quantity
                                                                }
                                                            </TableCell>
                                                        </>
                                                    )}
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={
                                                                row.unit_cost
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'unit_cost',
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                            disabled={
                                                                isDone ||
                                                                isApproved
                                                            }
                                                            className={
                                                                tableInputClass
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Select
                                                            value={row.id_tax}
                                                            onValueChange={(
                                                                v,
                                                            ) =>
                                                                updateRow(
                                                                    row.id,
                                                                    'id_tax',
                                                                    v,
                                                                )
                                                            }
                                                            disabled={
                                                                isDone ||
                                                                isApproved
                                                            }
                                                        >
                                                            <SelectTrigger className="flex h-8 w-full justify-center border-transparent bg-transparent text-[11px] font-bold focus:ring-0">
                                                                <div className="flex-1 text-center">
                                                                    <SelectValue />
                                                                </div>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {taxes.map(
                                                                    (t) => (
                                                                        <SelectItem
                                                                            key={
                                                                                t.id_tax
                                                                            }
                                                                            value={t.id_tax.toString()}
                                                                            className="flex justify-center text-center text-[10px] font-bold uppercase"
                                                                        >
                                                                            {
                                                                                t.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    {!isServiceOrder && (
                                                        <>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={
                                                                        row.margin_percentage
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            row.id,
                                                                            'margin_percentage',
                                                                            parseFloat(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isDone ||
                                                                        isApproved
                                                                    }
                                                                    className={
                                                                        tableInputClass
                                                                    }
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={
                                                                        row.suggested_sale_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            row.id,
                                                                            'suggested_sale_price',
                                                                            parseFloat(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isDone ||
                                                                        isApproved
                                                                    }
                                                                    className={
                                                                        tableInputClass
                                                                    }
                                                                />
                                                            </TableCell>
                                                        </>
                                                    )}
                                                    <TableCell className="text-right font-bold tabular-nums">
                                                        {symbol}{' '}
                                                        {(
                                                            row.quantity *
                                                            row.unit_cost
                                                        ).toFixed(2)}
                                                    </TableCell>
                                                    {!(
                                                        isDone || isApproved
                                                    ) && (
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100"
                                                                onClick={() =>
                                                                    setRows(
                                                                        rows.filter(
                                                                            (
                                                                                r,
                                                                            ) =>
                                                                                r.id !==
                                                                                row.id,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* TOTALES */}
                                <div className="flex justify-end pt-6 pb-20">
                                    <div className="w-full max-w-sm space-y-2">
                                        <div className="flex justify-between border-b pb-2 text-sm text-muted-foreground">
                                            <span>
                                                Subtotal (Base Imponible)
                                            </span>
                                            <span>
                                                {symbol} {subTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2 text-sm text-muted-foreground">
                                            <span>IGV (18%)</span>
                                            <span>
                                                {symbol} {igvAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 text-xl font-black text-emerald-600">
                                            <span>Total Orden</span>
                                            <span>
                                                {symbol}{' '}
                                                {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        {data.currency !== 'PEN' && (
                                            <div className="flex animate-in justify-between pt-1 text-xs font-bold text-blue-600 fade-in slide-in-from-right-2">
                                                <span>
                                                    Equivalente en Soles (T.C.{' '}
                                                    {parseFloat(
                                                        data.exchange_rate,
                                                    ).toFixed(3)}
                                                    )
                                                </span>
                                                <span>
                                                    S/ {totalInSoles.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CHATTER / LOGS */}
                    <div className="relative hidden h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10 xl:flex">
                        <div className="z-10 flex shrink-0 items-center gap-1 border-b border-border bg-card p-2 shadow-sm">
                            <Button
                                variant="ghost"
                                onClick={() => setIsWritingNote(!isWritingNote)}
                                className="h-8 text-xs font-bold"
                            >
                                <MessageSquare className="mr-1.5 h-3 w-3" />{' '}
                                Registrar nota
                            </Button>
                        </div>
                        {isWritingNote && (
                            <div className="animate-in border-b bg-background p-4 slide-in-from-top-2">
                                <textarea
                                    value={data.internal_note}
                                    onChange={(e) =>
                                        setData('internal_note', e.target.value)
                                    }
                                    className="w-full rounded-md border p-2 text-sm focus:ring-1 focus:ring-emerald-500"
                                    rows={3}
                                    placeholder="Escriba la respuesta del proveedor o una nota..."
                                />

                                {/* ✅ INPUT DE ADJUNTO PARA LA NOTA */}
                                <div className="mt-2 flex flex-col gap-2">
                                    {data.note_file ? (
                                        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                            <span className="flex items-center gap-1 truncate">
                                                <Paperclip className="h-3 w-3" />{' '}
                                                {data.note_file.name}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 text-emerald-700"
                                                onClick={() =>
                                                    setData('note_file', null)
                                                }
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-full border-dashed text-xs"
                                            >
                                                <Paperclip className="mr-1.5 h-3 w-3" />{' '}
                                                Adjuntar Imagen o PDF
                                            </Button>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="absolute inset-0 cursor-pointer opacity-0"
                                                onChange={(e) =>
                                                    setData(
                                                        'note_file',
                                                        e.target.files?.[0] ||
                                                            null,
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                setIsWritingNote(false)
                                            }
                                            className="h-8 text-xs"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={submitNote}
                                            disabled={
                                                processingNote ||
                                                !data.internal_note.trim()
                                            }
                                            className="h-8 bg-emerald-600 text-white"
                                        >
                                            {processingNote
                                                ? 'Guardando...'
                                                : 'Guardar nota'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex-1 space-y-6 overflow-y-auto p-6">
                            {order.logs?.map((log: any) => (
                                <div
                                    key={log.id}
                                    className="relative border-l-2 pl-6 text-sm"
                                >
                                    <div className="absolute top-0 -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2 bg-background">
                                        {log.action === 'Nota' ? (
                                            <MessageSquare className="h-3 w-3 text-blue-500" />
                                        ) : (
                                            <History className="h-3 w-3 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="mb-1 flex justify-between font-bold">
                                        <span>
                                            {log.user?.name || 'Sistema'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(
                                                new Date(log.created_at),
                                                'dd/MM HH:mm',
                                            )}
                                        </span>
                                    </div>
                                    <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                        {log.notes}
                                    </p>

                                    {log.file_path && (
                                        <div className="mt-2">
                                            {log.file_path.match(
                                                /\.(jpeg|jpg|gif|png|webp)$/i,
                                            ) ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <div className="relative w-48 cursor-zoom-in overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-emerald-500">
                                                            <img
                                                                src={`/storage/${log.file_path}`}
                                                                alt="Adjunto"
                                                                className="max-h-40 w-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity hover:opacity-100">
                                                                <Search className="h-6 w-6 text-white" />
                                                            </div>
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
                                                        <img
                                                            src={`/storage/${log.file_path}`}
                                                            alt="Imagen expandida"
                                                            className="h-auto w-full rounded-lg object-contain shadow-2xl"
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <a
                                                    href={`/storage/${log.file_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
                                                >
                                                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                                                    Ver PDF adjunto
                                                    <Download className="ml-1 h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL FACTURACIÓN */}
            <Dialog open={showBillingModal} onOpenChange={setShowBillingModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-black tracking-tighter uppercase">
                            Registrar Comprobante
                        </DialogTitle>
                        <DialogDescription>
                            Selecciona el tipo de documento para la factura de
                            esta orden.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-right text-sm font-bold">
                                Tipo
                            </span>
                            <Select
                                value={billingData.type}
                                onValueChange={(v) =>
                                    setBillingData({ ...billingData, type: v })
                                }
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Factura">
                                        Factura
                                    </SelectItem>
                                    <SelectItem value="Boleta">
                                        Boleta
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-right text-sm font-bold">
                                Serie
                            </span>
                            <Input
                                value={billingData.series}
                                onChange={(e) =>
                                    setBillingData({
                                        ...billingData,
                                        series: e.target.value.toUpperCase(),
                                    })
                                }
                                placeholder="F001"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-right text-sm font-bold">
                                Número
                            </span>
                            <Input
                                value={billingData.number}
                                onChange={(e) =>
                                    setBillingData({
                                        ...billingData,
                                        number: e.target.value,
                                    })
                                }
                                placeholder="000123"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowBillingModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={goToBilling}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Continuar a Facturación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <iframe
                ref={printFrameRef}
                style={{ display: 'none' }}
                title="Print Content"
            />
        </AppLayout>
    );
}
