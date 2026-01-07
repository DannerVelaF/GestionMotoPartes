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
import productsRoute from '@/routes/products';
import salesRoute from '@/routes/sales';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    BookText,
    CalendarIcon,
    CheckCircle2,
    FileText,
    MapPin,
    Printer,
    ShoppingBag,
    Tag,
    User,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SaleDetail {
    id_sales_details: number;
    id_product: number;
    quantity: number;
    unit_price: number;
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

interface Sale {
    id_sales: number;
    code_sales: string;
    document_type: string;
    series: string;
    number: string;
    date_sales: string;
    receiver_name: string;
    receiver_id_number: string;
    receiver_address: string | null;
    total: number;
    user: { name: string };
    details: SaleDetail[];
    method_payment?: MethodPayment;
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

    useEffect(() => {
        if (flash?.saleId) {
            setShowPrintModal(true);
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.saleId]);

    const documentNames: Record<string, string> = {
        factura: 'Factura',
        boleta: 'Boleta de Venta',
        nota_venta: 'Nota de Venta',
    };

    const handlePrint = () => {
        const url = salesRoute.ticket(sale.id_sales).url;
        window.open(url, '_blank');
        setShowPrintModal(false);
    };

    const totalAmount = Number(sale.total);
    const igvAmount = totalAmount - totalAmount / 1.18;
    const subTotal = totalAmount - igvAmount;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: salesRoute.index().url },
                { title: sale.code_sales, href: '' },
            ]}
        >
            <Head title={`Venta ${sale.code_sales}`} />

            {/* ... ALERTAS Y DIÁLOGOS ... */}
            {showSuccess && flash?.success && (
                <div className="fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
                    <Alert className="border-2 border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xl">
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
                        <DialogTitle className="flex items-center gap-2">
                            <Printer className="h-5 w-5 text-blue-600" />
                            Venta Registrada
                        </DialogTitle>
                        <DialogDescription>
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
                            className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex h-full flex-col bg-background">
                {/* ... HEADER ... */}
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-foreground/90">
                            <BookText className="text-blue-600" />
                            {sale.code_sales}
                        </span>
                        <div className="ml-4 flex items-center gap-2">
                            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700 uppercase">
                                {documentNames[sale.document_type] || 'Venta'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handlePrint}
                            className="bg-slate-800 text-white shadow-sm hover:bg-slate-900 active:scale-95"
                        >
                            <Printer className="mr-2 h-4 w-4" /> Ticket
                        </Button>
                    </div>
                </div>

                <div className="w-full animate-in px-8 py-8 duration-500 fade-in slide-in-from-bottom-4">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-8 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                            <TabsTrigger
                                value="general"
                                className="relative rounded-none px-8 py-4 text-sm font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:bg-blue-600"
                            >
                                Información de Venta
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="general"
                            className="mt-6 animate-in duration-300 fade-in-50"
                        >
                            <div className="mb-12 grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
                                {/* ... COLUMNA IZQUIERDA ... */}
                                <div className="space-y-8">
                                    <div className="group space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase dark:text-neutral-400">
                                            <User className="h-3 w-3" /> Cliente
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
                                        <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
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
                                        <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                            <MapPin className="h-3 w-3 text-blue-600" />{' '}
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

                                {/* COLUMNA DERECHA */}
                                <div className="space-y-8">
                                    <div className="group space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
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
                                        <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                            <FileText className="h-3 w-3" />{' '}
                                            Referencia de Comprobante
                                        </Label>
                                        <Input
                                            value={`${sale.series} - ${sale.number}`}
                                            disabled
                                            className={disabledInputClass}
                                        />
                                    </div>

                                    <div className="group space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
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

                            {/* ... RESTO DE LA TABLA (IGUAL QUE ANTES) ... */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                    <h3 className="flex items-center gap-2 font-bold tracking-tight text-foreground uppercase dark:text-neutral-200">
                                        <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        Artículos Vendidos
                                    </h3>
                                    <span className="text-xs font-medium text-muted-foreground italic">
                                        Vendedor: {sale.user?.name}
                                    </span>
                                </div>

                                <Table>
                                    <TableHeader className="bg-muted/50 dark:bg-neutral-900">
                                        <TableRow className="dark:border-neutral-800">
                                            <TableHead className="dark:text-neutral-300">
                                                Código
                                            </TableHead>
                                            <TableHead className="dark:text-neutral-300">
                                                Descripción Producto
                                            </TableHead>
                                            <TableHead className="text-right dark:text-neutral-300">
                                                Cant.
                                            </TableHead>
                                            <TableHead className="text-right dark:text-neutral-300">
                                                P. Unitario
                                            </TableHead>
                                            <TableHead className="text-right dark:text-neutral-300">
                                                Subtotal
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sale.details.map((detail) => (
                                            <TableRow
                                                key={detail.id_sales_details}
                                                className="transition-colors hover:bg-blue-50/30 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                                            >
                                                <TableCell
                                                    onClick={() =>
                                                        router.visit(
                                                            productsRoute.show({
                                                                product:
                                                                    detail.id_product,
                                                            }).url,
                                                        )
                                                    }
                                                    className="cursor-pointer font-mono text-xs text-muted-foreground transition-all hover:font-bold hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
                                                >
                                                    {detail.product
                                                        .product_code || 'S/N'}
                                                </TableCell>
                                                <TableCell
                                                    onClick={() =>
                                                        router.visit(
                                                            productsRoute.show({
                                                                product:
                                                                    detail.id_product,
                                                            }).url,
                                                        )
                                                    }
                                                    className="cursor-pointer font-medium text-foreground transition-colors hover:text-blue-600 dark:text-neutral-200 dark:hover:text-blue-400"
                                                >
                                                    {
                                                        detail.product
                                                            .product_name
                                                    }
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums dark:text-neutral-300">
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
                                                <TableCell className="text-right font-semibold tabular-nums">
                                                    S/{' '}
                                                    {Number(
                                                        detail.subtotal,
                                                    ).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="flex flex-col items-end gap-2 border-t pt-6">
                                    <div className="w-full max-w-xs space-y-3">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Base Imponible</span>
                                            <span className="tabular-nums">
                                                S/ {subTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>IGV (18%)</span>
                                            <span className="tabular-nums">
                                                S/ {igvAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex justify-between border-t border-blue-200 pt-4">
                                            <span className="text-lg font-bold text-slate-900 uppercase">
                                                Total Venta
                                            </span>
                                            <span className="text-2xl font-black text-blue-700 tabular-nums">
                                                S/ {totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
