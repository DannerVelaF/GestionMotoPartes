import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import salesRoute from '@/routes/sales';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    BookText,
    CalendarIcon,
    CheckCircle2,
    FileText,
    History,
    MapPin,
    MessageSquare,
    Printer,
    ShoppingBag,
    Tag,
    Truck,
    User,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// --- Interfaces ---
interface SaleDetail {
    id_sales_details: number;
    id_product: number;
    quantity: number;
    unit_price: number;
    tax_amount: number;
    subtotal: number;
    product: {
        product_name: string;
        product_code: string;
    };
}

interface MethodPayment {
    id_method_payment: number;
    name_method_payment: string;
}

interface Receipt {
    id_receipt: number;
    receipt_code: string;
    series: string;
    number: string;
}

interface SaleLog {
    id_sale_log: number;
    action: string;
    notes: string | null;
    created_at: string;
    user?: { name: string };
}

interface Sale {
    id_sales: number;
    code_sales: string;
    date_sales: string;
    receiver_name: string;
    receiver_id_number: string;
    receiver_address: string | null;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    user: { name: string };
    details: SaleDetail[];
    method_payment?: MethodPayment;
    receipt?: Receipt;
    logs?: SaleLog[];
}

interface Props {
    sale: Sale;
}

const disabledInputClass =
    'h-10 w-full rounded-none border-0 border-b border-dashed border-muted-foreground/30 bg-transparent px-0 text-lg shadow-none focus:ring-0 cursor-not-allowed text-foreground font-medium';

export default function ShowSales({ sale }: Props) {
    const { flash = {} } = usePage<any>().props;
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [isWritingNote, setIsWritingNote] = useState(false);

    const {
        data: noteData,
        setData: setNoteData,
        post: postNote,
        processing: processingNote,
        reset: resetNote,
    } = useForm({
        internal_note: '',
    });

    useEffect(() => {
        if (flash?.saleId) {
            setShowPrintModal(true);
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.saleId]);

    const handlePrint = () => {
        const url = salesRoute.ticket(sale.id_sales).url;
        window.open(url, '_blank');
        setShowPrintModal(false);
    };

    const submitNote = () => {
        if (!noteData.internal_note.trim()) return;
        postNote(`/ventas/${sale.id_sales}/nota`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsWritingNote(false);
                resetNote();
            },
        });
    };
    const getDocTypeLabel = (type?: string) => {
        if (!type) return 'TICKET DE VENTA';
        const labels: any = {
            factura: 'FACTURA DE VENTA',
            boleta: 'BOLETA DE VENTA',
            nota_venta: 'NOTA DE VENTA',
        };
        return labels[type] || 'TICKET DE VENTA';
    };
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: salesRoute.index().url },
                { title: sale.code_sales, href: '' },
            ]}
        >
            <Head title={`Venta ${sale.code_sales}`} />

            {/* ALERTAS Y DIÁLOGOS */}
            {showSuccess && flash?.success && (
                <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
                    <Alert className="border-2 border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xl dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle className="ml-2 font-bold">
                            ¡Éxito!
                        </AlertTitle>
                        <AlertDescription className="ml-2">
                            {flash.success}
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <Printer className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                            Venta Registrada
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Desea imprimir el comprobante de venta ahora?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setShowPrintModal(false)}
                            className="flex-1"
                        >
                            Cerrar
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            <Printer className="mr-2 h-4 w-4" /> Imprimir Ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex h-full flex-col overflow-hidden bg-background">
                {/* TOOLBAR */}
                <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-4 border-b bg-card px-8 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-foreground/90">
                            <BookText className="text-blue-600 dark:text-blue-500" />
                            {sale.code_sales}
                        </span>
                        <div className="ml-4 flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-700 uppercase dark:bg-emerald-500/20 dark:text-emerald-400">
                                COMPLETADA
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border-r border-border pr-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.get(
                                        '/inventario/ajuste/movimientos',
                                        { search: sale.code_sales },
                                    )
                                }
                                className="h-9 border-emerald-200 bg-emerald-50/30 px-3 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/40"
                            >
                                <Truck className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[8px] leading-none font-bold text-muted-foreground uppercase">
                                        Entregas
                                    </span>
                                    <span className="text-[10px] leading-tight font-black text-emerald-700 dark:text-emerald-400">
                                        Movimientos
                                    </span>
                                </div>
                            </Button>

                            {sale.receipt && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.get(`/recibos`, {
                                            search: sale.receipt?.receipt_code,
                                        })
                                    }
                                    className="h-9 border-blue-200 bg-blue-50/30 px-3 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:bg-blue-900/40"
                                >
                                    <FileText className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-500" />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-[8px] leading-none font-bold text-muted-foreground uppercase">
                                            Comprobante
                                        </span>
                                        <span className="text-[10px] leading-tight font-black text-blue-700 dark:text-blue-400">
                                            {sale.receipt.series}-
                                            {sale.receipt.number}
                                        </span>
                                    </div>
                                </Button>
                            )}
                        </div>
                        <Button
                            onClick={handlePrint}
                            className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95"
                        >
                            <Printer className="mr-2 h-4 w-4" /> Ticket
                        </Button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-auto px-8 py-8">
                        <Tabs
                            defaultValue="general"
                            className="mx-auto w-full max-w-7xl animate-in duration-500 fade-in slide-in-from-bottom-4"
                        >
                            <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                                <TabsTrigger
                                    value="general"
                                    className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600 dark:data-[state=active]:text-blue-500 dark:data-[state=active]:after:bg-blue-500"
                                >
                                    Información de Venta
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="general"
                                className="mt-6 animate-in duration-300 fade-in-50"
                            >
                                <div className="mb-12 grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                                    <div className="space-y-8">
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <User className="h-3 w-3" />{' '}
                                                Cliente
                                            </Label>
                                            <Input
                                                value={
                                                    sale.receiver_name ||
                                                    'CLIENTE GENERAL'
                                                }
                                                disabled
                                                className={disabledInputClass}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <Tag className="h-3 w-3" />{' '}
                                                Documento de Identidad
                                            </Label>
                                            <Input
                                                value={
                                                    sale.receiver_id_number ||
                                                    '00000000'
                                                }
                                                disabled
                                                className={disabledInputClass}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-500" />{' '}
                                                Dirección de Entrega / Fiscal
                                            </Label>
                                            <Input
                                                value={
                                                    sale.receiver_address ||
                                                    'SIN DIRECCIÓN REGISTRADA'
                                                }
                                                disabled
                                                className={cn(
                                                    disabledInputClass,
                                                    !sale.receiver_address &&
                                                        'text-muted-foreground/50 italic',
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <CalendarIcon className="h-3 w-3" />{' '}
                                                Fecha y Hora de Venta
                                            </Label>
                                            <Input
                                                value={format(
                                                    new Date(sale.date_sales),
                                                    'dd/MM/yyyy HH:mm:ss',
                                                    { locale: es },
                                                )}
                                                disabled
                                                className={disabledInputClass}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-500" />
                                                Documento de Referencia
                                            </Label>
                                            <div className="flex items-center gap-2 border-b border-dashed border-muted-foreground/30 pb-2">
                                                <span className="text-sm font-bold text-foreground uppercase">
                                                    {sale.receipt
                                                        ? getDocTypeLabel(
                                                              sale.receipt
                                                                  .document_type,
                                                          )
                                                        : 'TICKET DE VENTA'}
                                                </span>
                                                <span className="font-light text-muted-foreground/40">
                                                    |
                                                </span>
                                                <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400">
                                                    {sale.receipt
                                                        ? `${sale.receipt.series}-${sale.receipt.number}`
                                                        : sale.id_sales
                                                              .toString()
                                                              .padStart(8, '0')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="group space-y-2">
                                            <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                                <FileText className="h-3 w-3" />{' '}
                                                Método de pago
                                            </Label>
                                            <Input
                                                value={
                                                    sale.method_payment
                                                        ?.name_method_payment ||
                                                    'NO ESPECIFICADO'
                                                }
                                                disabled
                                                className={disabledInputClass}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-blue-100 pb-2 dark:border-blue-900/50">
                                        <h3 className="flex items-center gap-2 font-bold tracking-tight text-foreground uppercase">
                                            <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-500" />{' '}
                                            Artículos Vendidos
                                        </h3>
                                        <span className="text-xs font-medium text-muted-foreground italic">
                                            Vendedor: {sale.user?.name}
                                        </span>
                                    </div>

                                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50 dark:bg-neutral-900/50">
                                                <TableRow className="border-border">
                                                    <TableHead className="text-xs font-bold text-muted-foreground uppercase">
                                                        Código
                                                    </TableHead>
                                                    <TableHead className="text-xs font-bold text-muted-foreground uppercase">
                                                        Descripción
                                                    </TableHead>
                                                    <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase">
                                                        Cant.
                                                    </TableHead>
                                                    <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase">
                                                        P. Unitario
                                                    </TableHead>
                                                    <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase">
                                                        IGV (18%)
                                                    </TableHead>
                                                    <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase">
                                                        Subtotal
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sale.details.map((detail) => {
                                                    const subtotalLinea =
                                                        Number(detail.subtotal);
                                                    const igvLinea = Number(
                                                        detail.tax_amount,
                                                    );
                                                    const totalLinea =
                                                        subtotalLinea +
                                                        igvLinea;

                                                    return (
                                                        <TableRow
                                                            key={
                                                                detail.id_sales_details
                                                            }
                                                            className="border-border transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                                                        >
                                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                                {detail.product
                                                                    .product_code ||
                                                                    'S/N'}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-foreground">
                                                                {
                                                                    detail
                                                                        .product
                                                                        .product_name
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums">
                                                                {Number(
                                                                    detail.quantity,
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-muted-foreground tabular-nums">
                                                                S/{' '}
                                                                {Number(
                                                                    detail.unit_price,
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-emerald-600 tabular-nums dark:text-emerald-400">
                                                                S/{' '}
                                                                {igvLinea.toFixed(
                                                                    2,
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold tabular-nums">
                                                                S/{' '}
                                                                {totalLinea.toFixed(
                                                                    2,
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 border-t border-border pt-6">
                                        <div className="w-full max-w-xs space-y-3">
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>
                                                    Subtotal (Base Imponible)
                                                </span>
                                                <span className="font-medium text-foreground tabular-nums">
                                                    S/{' '}
                                                    {Number(
                                                        sale.subtotal,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>IGV Total</span>
                                                <span className="font-medium text-foreground tabular-nums">
                                                    S/{' '}
                                                    {Number(sale.tax).toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>
                                            {Number(sale.discount) > 0 && (
                                                <div className="flex justify-between text-sm font-bold text-red-600 dark:text-red-400">
                                                    <span>
                                                        Descuento Aplicado
                                                    </span>
                                                    <span className="tabular-nums">
                                                        - S/{' '}
                                                        {Number(
                                                            sale.discount,
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="mt-4 flex justify-between border-t border-blue-200 pt-4 dark:border-blue-800">
                                                <span className="text-lg font-black tracking-tight text-foreground uppercase">
                                                    Total Venta
                                                </span>
                                                <span className="text-2xl font-black text-blue-600 tabular-nums dark:text-blue-500">
                                                    S/{' '}
                                                    {Number(sale.total).toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="relative hidden h-full w-[380px] shrink-0 flex-col border-l border-border bg-muted/10 xl:flex dark:bg-muted/5">
                        <div className="z-10 flex shrink-0 items-center gap-1 border-b border-border bg-card p-2 shadow-sm">
                            <Button
                                variant="ghost"
                                onClick={() => setIsWritingNote(!isWritingNote)}
                                className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                            >
                                <MessageSquare className="mr-1.5 h-3 w-3" />{' '}
                                Registrar nota
                            </Button>
                        </div>
                        {isWritingNote && (
                            <div className="animate-in border-b border-border bg-card p-4 slide-in-from-top-2">
                                <textarea
                                    value={noteData.internal_note}
                                    onChange={(e) =>
                                        setNoteData(
                                            'internal_note',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-border bg-background p-2 text-sm text-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Añade una nota a esta venta..."
                                />
                                <div className="mt-2 flex justify-end">
                                    <Button
                                        size="sm"
                                        onClick={submitNote}
                                        disabled={processingNote}
                                        className="h-8 bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Guardar nota
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
                            <div className="relative space-y-6 border-l-2 border-border pl-6">
                                {sale.logs?.map((log) => (
                                    <div
                                        key={log.id_sale_log}
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
                                            <span className="font-bold text-foreground">
                                                {log.user?.name || 'Sistema'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(
                                                    new Date(log.created_at),
                                                    'dd/MMM HH:mm',
                                                    { locale: es },
                                                )}
                                            </span>
                                        </div>
                                        <p className="leading-relaxed text-muted-foreground italic">
                                            {log.notes || log.action}
                                        </p>
                                    </div>
                                ))}
                                {!sale.logs?.length && (
                                    <p className="text-sm text-muted-foreground">
                                        No hay historial para esta venta.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
