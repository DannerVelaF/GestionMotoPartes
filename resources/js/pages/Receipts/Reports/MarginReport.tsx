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
import receipts from '@/routes/receipts';
import { margin } from '@/routes/reports-receipts';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    DollarSign,
    Filter,
    Target,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

interface MarginItem {
    product: string;
    code: string;
    avg_cost: number;
    avg_sale: number;
    margin_percent: number;
    projected_profit: number;
    total_qty: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function MarginReport({
    reportData,
    filters,
}: {
    reportData: MarginItem[];
    filters: any;
}) {
    const avgMargin =
        reportData.length > 0
            ? reportData.reduce((acc, i) => acc + i.margin_percent, 0) /
              reportData.length
            : 0;

    const criticalItems = reportData.filter(
        (i) => i.margin_percent < 15,
    ).length;

    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            margin().url,
            {
                // Cambia por tu ruta real
                from: formData.get('from'),
                to: formData.get('to'),
            },
            { preserveState: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Comprobantes', href: receipts.index().url },
                { title: 'Reportes', href: '#' },
                { title: 'Análisis de Margen', href: '' },
            ]}
        >
            <Head title="Análisis de Rentabilidad" />

            <div className="flex h-full flex-col bg-background">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                Análisis de Margen
                            </h1>
                            <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Rentabilidad Proyectada de Compras
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleFilterChange}
                        className="flex items-center gap-3"
                    >
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1 dark:border-neutral-800">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="date"
                                name="from"
                                defaultValue={filters.from}
                                className="h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0"
                            />
                            <span className="opacity-20">|</span>
                            <Input
                                type="date"
                                name="to"
                                defaultValue={filters.to}
                                className="h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-blue-600 font-bold hover:bg-blue-700"
                        >
                            <Filter className="mr-2 h-3.5 w-3.5" /> Analizar
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {/* --- KPI CARDS --- */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <StatCard
                                title="Margen Promedio"
                                value={`${avgMargin.toFixed(1)}%`}
                                icon={<Target className="h-4 w-4" />}
                                colorClass={
                                    avgMargin < 15
                                        ? 'text-orange-500'
                                        : 'text-emerald-500'
                                }
                                subtext="Rendimiento sobre venta"
                            />
                            <StatCard
                                title="Items Críticos"
                                value={criticalItems.toString()}
                                icon={<AlertTriangle className="h-4 w-4" />}
                                colorClass={
                                    criticalItems > 0
                                        ? 'text-red-500'
                                        : 'text-emerald-500'
                                }
                                subtext="Margen menor al 15%"
                            />
                            <StatCard
                                title="Utilidad Proyectada"
                                value={`S/ ${reportData.reduce((acc, i) => acc + i.projected_profit, 0).toLocaleString()}`}
                                icon={<DollarSign className="h-4 w-4" />}
                                colorClass="text-blue-500"
                                subtext="Basado en stock recibido"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                            {/* Gráfico de Ranking de Ganancia Proyectada */}
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 lg:col-span-3 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="border-b bg-muted/30 dark:border-neutral-800">
                                    <CardTitle className="text-[10px] font-black tracking-widest uppercase">
                                        Top Ganancia Proyectada
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={reportData.slice(0, 10)}
                                                layout="vertical"
                                                margin={{ left: 30, right: 30 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    horizontal={true}
                                                    vertical={false}
                                                    strokeOpacity={0.1}
                                                />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="product"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 12,
                                                        fill: '#888',
                                                        width: 120,
                                                    }}
                                                    width={120}
                                                />
                                                {/* ✅ TOOLTIP CORREGIDO */}
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
                                                        fontSize: '14px', // Fuente más grande
                                                        fontWeight: '600',
                                                        padding: '12px',
                                                    }}
                                                    itemStyle={{
                                                        color: '#60a5fa',
                                                    }} // Color celeste para el valor
                                                    labelStyle={{
                                                        color: '#999',
                                                        marginBottom: '4px',
                                                        fontSize: '11px',
                                                    }}
                                                    formatter={(
                                                        value: number,
                                                    ) => [
                                                        `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                                                        'Ganancia Proyectada',
                                                    ]}
                                                />
                                                <Bar
                                                    dataKey="projected_profit"
                                                    radius={[0, 4, 4, 0]}
                                                    barSize={20}
                                                    fill="#3b82f6"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Detalle en Tabla */}
                            <div className="flex flex-col rounded-3xl border border-neutral-200 bg-card p-6 shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900/20">
                                <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Detalle de Margen
                                </h3>
                                <div className="flex-1 overflow-hidden rounded-2xl border dark:border-neutral-800">
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="font-bold">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="text-right font-bold">
                                                    Margen
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.map((item, idx) => (
                                                <TableRow
                                                    key={idx}
                                                    className="transition-colors hover:bg-muted/50 dark:border-neutral-800"
                                                >
                                                    <TableCell className="py-3">
                                                        <p className="text-[11px] leading-tight font-black uppercase">
                                                            {item.product}
                                                        </p>
                                                        <span className="font-mono text-[10.5px] text-muted-foreground">
                                                            S/ {item.avg_cost}{' '}
                                                            vs S/{' '}
                                                            {item.avg_sale}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span
                                                            className={`text-xs font-black tabular-nums ${
                                                                item.margin_percent <
                                                                0
                                                                    ? 'text-red-500'
                                                                    : item.margin_percent <
                                                                        15
                                                                      ? 'text-orange-500'
                                                                      : 'text-emerald-500'
                                                            }`}
                                                        >
                                                            {item.margin_percent.toFixed(
                                                                1,
                                                            )}
                                                            %
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
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

function StatCard({ title, value, icon, colorClass, subtext }: any) {
    return (
        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    {title}
                </CardTitle>
                <div className={`rounded-lg bg-muted/50 p-2 ${colorClass}`}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div
                    className={`text-2xl font-black tracking-tighter tabular-nums ${colorClass}`}
                >
                    {value}
                </div>
                <p className="mt-1 text-[12px] font-medium text-muted-foreground opacity-60">
                    {subtext}
                </p>
            </CardContent>
        </Card>
    );
}
