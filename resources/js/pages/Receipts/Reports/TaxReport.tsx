import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    Calculator,
    Calendar,
    Download,
    FileText,
    Filter,
    Percent,
    PieChart as PieIcon,
    RefreshCw,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

interface TaxItem {
    document_type: string;
    base_imponible: number;
    igv: number;
    total: number;
}

interface Props {
    reportData: TaxItem[];
    filters: { from: string; to: string };
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#6366f1'];

export default function TaxReport({ reportData = [], filters }: Props) {
    const totals = reportData.reduce(
        (acc, item) => ({
            base: acc.base + Number(item.base_imponible),
            igv: acc.igv + Number(item.igv),
            total: acc.total + Number(item.total),
        }),
        { base: 0, igv: 0, total: 0 },
    );

    const documentNames: Record<string, string> = {
        'Compra Mercadería': 'Compra de Mercadería (OC)',
        'Servicios/Otros': 'Contratación de Servicios',
        purchase: 'Compra Mercadería',
        service: 'Servicios/Otros',
    };

    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            '/compras/reportes/impuestos',
            { from: formData.get('from'), to: formData.get('to') },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams({
            from: filters.from,
            to: filters.to,
        }).toString();
        window.location.href = `/compras/reportes/impuestos/export?${params}`;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Compras', href: '/compras/ordenes' },
                { title: 'Reportes', href: '#' },
                { title: 'Libro de Compras (OC)', href: '' },
            ]}
        >
            <Head title="Libro de Compras (OC)" />

            <div className="flex h-full flex-col bg-background text-foreground">
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Libro de Compras por OC
                        </h1>
                        <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            Resumen de Impuestos en Órdenes de Compra
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                VALORES EN SOLES
                            </span>
                        </p>
                    </div>

                    <form
                        onSubmit={handleFilterChange}
                        className="flex items-center gap-3"
                    >
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="date"
                                name="from"
                                defaultValue={filters.from}
                                className="dark:color-scheme-dark h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0"
                            />
                            <span className="text-muted-foreground/30">|</span>
                            <Input
                                type="date"
                                name="to"
                                defaultValue={filters.to}
                                className="dark:color-scheme-dark h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-blue-600 font-bold hover:bg-blue-700 dark:text-white"
                        >
                            <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            className="dark:border-neutral-800 dark:hover:bg-neutral-900"
                        >
                            <Download className="mr-2 h-3.5 w-3.5" /> Exportar
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* --- KPI CARDS --- */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <TaxStatCard
                                title="IGV Comprometido"
                                value={`S/ ${totals.igv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                                icon={<Percent className="h-4 w-4" />}
                                colorClass="text-emerald-600 dark:text-emerald-400"
                                description="Total impuestos en OC aprobadas"
                            />
                            <TaxStatCard
                                title="Base Imponible (OC)"
                                value={`S/ ${totals.base.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                                icon={<Calculator className="h-4 w-4" />}
                                colorClass="text-blue-600 dark:text-blue-400"
                                description="Monto neto sin impuestos"
                            />
                            <Card className="rounded-3xl border-none bg-neutral-900 text-white shadow-xl ring-1 ring-white/10 dark:bg-white dark:text-black dark:ring-black/10">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest uppercase opacity-70">
                                        Total General (PEN)
                                    </CardTitle>
                                    <FileText className="h-4 w-4 opacity-70" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black tracking-tighter tabular-nums">
                                        S/{' '}
                                        {totals.total.toLocaleString('es-PE', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                    <p className="mt-1 flex items-center gap-1 text-[12px] font-medium opacity-60">
                                        <RefreshCw className="h-3 w-3" /> Basado
                                        en T.C. de cada OC
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* --- CHART Y TABLA --- */}
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Gráfico */}
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="border-b dark:border-neutral-800">
                                    <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                        <PieIcon className="h-4 w-4 text-blue-600" />{' '}
                                        Distribución por Tipo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={reportData}
                                                layout="vertical"
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    horizontal={true}
                                                    vertical={false}
                                                    strokeOpacity={0.1}
                                                />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="document_type"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(val) =>
                                                        documentNames[val] ||
                                                        val
                                                    }
                                                    tick={{
                                                        fontSize: 10,
                                                        fontWeight: 'bold',
                                                        fill: 'currentColor',
                                                        opacity: 0.5,
                                                    }}
                                                    width={120}
                                                />
                                                <ChartTooltip
                                                    cursor={{
                                                        fill: 'currentColor',
                                                        opacity: 0.05,
                                                    }}
                                                    contentStyle={{
                                                        backgroundColor:
                                                            'black',
                                                        borderRadius: '12px',
                                                        color: 'white',
                                                        border: 'none',
                                                    }}
                                                    formatter={(value: any) =>
                                                        `S/ ${Number(value).toFixed(2)}`
                                                    }
                                                />
                                                <Bar
                                                    dataKey="total"
                                                    radius={[0, 4, 4, 0]}
                                                    barSize={24}
                                                >
                                                    {reportData.map(
                                                        (_, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    COLORS[
                                                                        index %
                                                                            COLORS.length
                                                                    ]
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tabla Detalle */}
                            <div className="flex flex-col rounded-3xl border border-neutral-200 bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                                <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Resumen de Gastos
                                </h3>
                                <div className="flex-1 overflow-hidden rounded-2xl border dark:border-neutral-800">
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-bold">
                                                    Concepto
                                                </TableHead>
                                                <TableHead className="text-right font-bold">
                                                    Base Imp.
                                                </TableHead>
                                                <TableHead className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                    IGV
                                                </TableHead>
                                                <TableHead className="text-right font-bold">
                                                    Total
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.length > 0 ? (
                                                reportData.map((item, idx) => (
                                                    <TableRow
                                                        key={idx}
                                                        className="transition-colors hover:bg-muted/50 dark:border-neutral-800"
                                                    >
                                                        <TableCell className="text-[10px] font-black uppercase">
                                                            {documentNames[
                                                                item
                                                                    .document_type
                                                            ] ||
                                                                item.document_type}
                                                        </TableCell>
                                                        <TableCell className="text-right text-muted-foreground tabular-nums">
                                                            {Number(
                                                                item.base_imponible,
                                                            ).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                                                            {Number(
                                                                item.igv,
                                                            ).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-black tabular-nums">
                                                            S/{' '}
                                                            {Number(
                                                                item.total,
                                                            ).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="h-24 text-center text-muted-foreground"
                                                    >
                                                        No hay datos en el
                                                        periodo.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
                                    <p className="text-[10px] leading-relaxed font-medium text-blue-700 dark:text-blue-300">
                                        * Este reporte suma el IGV individual de
                                        cada ítem de las OC aprobadas. Los
                                        montos en dólares se convierten al T.C.
                                        de la fecha de emisión.
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

function TaxStatCard({ title, value, icon, colorClass, description }: any) {
    return (
        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    {title}
                </CardTitle>
                <div
                    className={`rounded-lg bg-muted/50 p-2 dark:bg-neutral-800 ${colorClass}`}
                >
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black tracking-tighter tabular-nums">
                    {value}
                </div>
                <p className="mt-1 text-[12px] font-medium text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}
