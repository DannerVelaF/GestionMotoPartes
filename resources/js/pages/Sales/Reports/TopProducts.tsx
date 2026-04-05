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
import reports from '@/routes/reports';
import sales from '@/routes/sales';
import { Head, router } from '@inertiajs/react';
import { BarChart3, Calendar, Filter, ShoppingBag, Trophy } from 'lucide-react';
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

interface ProductReportItem {
    product_name: string;
    product_code: string;
    total_qty: string | number;
    total_revenue: string | number;
}

interface Props {
    reportData: ProductReportItem[];
    filters: { from: string; to: string };
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export default function TopProducts({
    reportData = [],
    filters = { from: '', to: '' },
}: Props) {
    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            reports.top().url,
            { from: formData.get('from'), to: formData.get('to') },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Preparamos la data para el gráfico asegurando valores numéricos
    const chartData = reportData.slice(0, 10).map((item) => ({
        name: item.product_name,
        cantidad: Number(item.total_qty) || 0,
        ingresos: Number(item.total_revenue) || 0,
    }));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: sales.index().url },
                { title: 'Reportes', href: '#' },
                { title: 'Productos Estrella', href: '' },
            ]}
        >
            <Head title="Ranking de Productos" />

            <div className="flex h-full flex-col bg-background text-foreground">
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Productos Estrella
                        </h1>
                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            Ranking de Rendimiento y Rotación
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
                    </form>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* --- TOP 1 HIGHLIGHT (Hero Section) --- */}
                        {reportData.length > 0 ? (
                            <Card className="rounded-3xl border-none bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xl ring-1 ring-white/10">
                                <CardContent className="flex flex-col items-center justify-between gap-6 p-8 md:flex-row">
                                    <div className="flex items-center gap-6">
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur-md">
                                            <Trophy className="h-10 w-10 text-yellow-300 drop-shadow-md" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black tracking-[0.2em] text-blue-100 uppercase opacity-80">
                                                Producto Líder en Ventas
                                            </p>
                                            <h2 className="text-3xl font-black tracking-tighter capitalize">
                                                {reportData[0].product_name}
                                            </h2>
                                            <p className="text-sm font-medium text-blue-50/80">
                                                Código:{' '}
                                                <span className="font-mono">
                                                    {reportData[0].product_code}
                                                </span>{' '}
                                                —
                                                <span className="ml-2 font-black text-white">
                                                    {Number(
                                                        reportData[0].total_qty,
                                                    ).toLocaleString()}{' '}
                                                    unidades
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-white/10 px-6 py-4 text-center ring-1 ring-white/20 backdrop-blur-md md:text-right">
                                        <p className="text-[10px] font-black text-blue-100 uppercase opacity-70">
                                            Ingresos Totales
                                        </p>
                                        <p className="text-3xl font-black tracking-tighter tabular-nums">
                                            S/{' '}
                                            {Number(
                                                reportData[0].total_revenue,
                                            ).toLocaleString('es-PE', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-background/50 py-12 text-center">
                                <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground/20" />
                                <p className="font-medium text-muted-foreground">
                                    No hay datos para el periodo seleccionado.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                            {/* --- GRÁFICO DE VOLUMEN --- */}
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 lg:col-span-3 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="border-b bg-muted/30 dark:border-neutral-800">
                                    <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                        <BarChart3 className="h-4 w-4 text-blue-600" />{' '}
                                        TOP 10 VOLUMEN
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={chartData}
                                                layout="vertical"
                                                margin={{ left: 10, right: 30 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    horizontal={true}
                                                    vertical={false}
                                                    strokeOpacity={0.1}
                                                />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
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
                                                        backgroundColor: '#000',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        color: '#fff',
                                                    }}
                                                    formatter={(value: any) => [
                                                        `${value} unidades`,
                                                        'Cantidad',
                                                    ]}
                                                />
                                                <Bar
                                                    dataKey="cantidad"
                                                    radius={[0, 4, 4, 0]}
                                                    barSize={24}
                                                >
                                                    {chartData.map(
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

                            {/* --- TABLA DE RANKING --- */}
                            <div className="flex flex-col rounded-3xl border border-neutral-200 bg-card p-6 shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900/20">
                                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    <ShoppingBag className="h-4 w-4 text-blue-600" />{' '}
                                    Listado de Ventas
                                </h3>
                                <div className="flex-1 overflow-hidden rounded-2xl border dark:border-neutral-800">
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="w-10 font-bold">
                                                    #
                                                </TableHead>
                                                <TableHead className="font-bold">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="text-right font-bold text-blue-600 dark:text-blue-400">
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
                                                        <TableCell className="text-[10px] font-black text-muted-foreground/50">
                                                            {String(
                                                                idx + 1,
                                                            ).padStart(2, '0')}
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <p className="text-[11px] leading-tight font-black text-foreground uppercase">
                                                                {
                                                                    item.product_name
                                                                }
                                                            </p>
                                                            <span className="font-mono text-[10px] text-muted-foreground opacity-70">
                                                                {
                                                                    item.product_code
                                                                }
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <p className="text-xs font-black text-blue-600 tabular-nums dark:text-blue-400">
                                                                S/{' '}
                                                                {Number(
                                                                    item.total_revenue,
                                                                ).toFixed(2)}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">
                                                                {Number(
                                                                    item.total_qty,
                                                                )}{' '}
                                                                uds
                                                            </p>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={3}
                                                        className="h-24 text-center text-muted-foreground italic"
                                                    >
                                                        Sin datos.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
