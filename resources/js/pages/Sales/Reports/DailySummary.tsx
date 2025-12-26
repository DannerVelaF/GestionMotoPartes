import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import reports from '@/routes/reports';
import sales from '@/routes/sales';
import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Calendar,
    DollarSign,
    Filter,
    ShoppingBag,
    TrendingUp,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

interface ReportItem {
    date: string;
    total: string | number;
    transactions: number;
}

interface Props {
    reportData: ReportItem[];
    filters: { from: string; to: string; period: string };
}

export default function DailySummary({ reportData, filters }: Props) {
    const totalRevenue = reportData.reduce(
        (acc, item) => acc + Number(item.total),
        0,
    );
    const totalTransactions = reportData.reduce(
        (acc, item) => acc + item.transactions,
        0,
    );
    const averageTicket =
        totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const formatLabelByPeriod = (dateStr: string) => {
        const date = parseISO(dateStr);
        switch (filters.period) {
            case 'monthly':
                return format(date, 'MMM yyyy', { locale: es });
            case 'yearly':
                return format(date, 'yyyy', { locale: es });
            case 'weekly':
                return 'Sem. ' + format(date, 'dd/MM', { locale: es });
            default:
                return format(date, 'dd MMM', { locale: es });
        }
    };

    // Formato largo para la tabla
    const formatTableDate = (dateStr: string) => {
        const date = parseISO(dateStr);
        switch (filters.period) {
            case 'monthly':
                return format(date, "MMMM 'de' yyyy", { locale: es });
            case 'yearly':
                return format(date, 'yyyy', { locale: es });
            case 'weekly':
                return (
                    'Semana del ' + format(date, "dd 'de' MMM", { locale: es })
                );
            default:
                return format(date, "EEEE, dd 'de' MMMM", { locale: es });
        }
    };

    const chartData = reportData.map((item) => ({
        ...item,
        formattedDate: formatLabelByPeriod(item.date),
        total: Number(item.total),
    }));

    const handleFilterChange = (
        e?: React.FormEvent<HTMLFormElement>,
        newPeriod?: string,
    ) => {
        if (e) e.preventDefault();
        const form = e ? new FormData(e.currentTarget) : null;

        router.get(
            reports.daily().url,
            {
                from: form ? form.get('from') : filters.from,
                to: form ? form.get('to') : filters.to,
                period: newPeriod || filters.period,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: sales.index().url },
                { title: 'Reportes', href: '#' },
                { title: 'Análisis de Ingresos', href: '' },
            ]}
        >
            <Head title="Resumen de Ventas" />

            <div className="flex h-full flex-col bg-background">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Análisis de Ingresos
                        </h1>
                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            Agrupado por:{' '}
                            {filters.period === 'daily'
                                ? 'Día'
                                : filters.period === 'weekly'
                                  ? 'Semana'
                                  : filters.period === 'monthly'
                                    ? 'Mes'
                                    : 'Año'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select
                            defaultValue={filters.period}
                            onValueChange={(val) =>
                                handleFilterChange(undefined, val)
                            }
                        >
                            <SelectTrigger className="h-9 w-[140px] text-xs font-semibold">
                                <SelectValue placeholder="Periodicidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Diario</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                        </Select>

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
                                <span className="text-muted-foreground/30">
                                    |
                                </span>
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
                                className="bg-blue-600 font-bold text-white hover:bg-blue-700"
                            >
                                <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* --- KPI CARDS --- */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <ReportStatCard
                                title="Total Recaudado"
                                value={`S/ ${totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                                icon={<DollarSign className="h-4 w-4" />}
                                colorClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                subtext="Ingresos brutos"
                            />
                            <ReportStatCard
                                title="Ventas Realizadas"
                                value={`${totalTransactions} op.`}
                                icon={<ShoppingBag className="h-4 w-4" />}
                                colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                subtext="Volumen de órdenes"
                            />
                            <ReportStatCard
                                title="Ticket Promedio"
                                value={`S/ ${averageTicket.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                                icon={<TrendingUp className="h-4 w-4" />}
                                colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                                subtext="Promedio por venta"
                            />
                        </div>

                        {/* --- CHART --- */}
                        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                            <CardHeader className="border-b bg-muted/30 dark:border-neutral-800">
                                <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />{' '}
                                    Tendencia de Ingresos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient
                                                    id="colorTotal"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="#2563eb"
                                                        stopOpacity={0.1}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="#2563eb"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                strokeOpacity={0.1}
                                            />
                                            <XAxis
                                                dataKey="formattedDate"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fontSize: 10,
                                                    fill: '#888',
                                                }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fontSize: 10,
                                                    fill: '#888',
                                                }}
                                            />
                                            <ChartTooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    backgroundColor: '#000',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                }}
                                                labelStyle={{
                                                    fontWeight: 'bold',
                                                    marginBottom: '4px',
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="total"
                                                name="Total"
                                                stroke="#2563eb"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorTotal)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* --- TABLE --- */}
                        <div className="rounded-3xl border border-slate-200 bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                            <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Desglose Detallado
                            </h3>
                            <div className="overflow-hidden rounded-2xl border dark:border-neutral-800">
                                <Table>
                                    <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                        <TableRow className="border-none hover:bg-transparent">
                                            <TableHead className="font-bold">
                                                Periodo
                                            </TableHead>
                                            <TableHead className="text-center font-bold">
                                                Transacciones
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
                                                    <TableCell className="font-semibold capitalize">
                                                        {formatTableDate(
                                                            item.date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium tabular-nums">
                                                        {item.transactions}
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-blue-600 tabular-nums dark:text-blue-400">
                                                        S/{' '}
                                                        {Number(
                                                            item.total,
                                                        ).toLocaleString(
                                                            'es-PE',
                                                            {
                                                                minimumFractionDigits: 2,
                                                            },
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={3}
                                                    className="h-32 text-center text-muted-foreground"
                                                >
                                                    No hay datos registrados en
                                                    este rango.
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
        </AppLayout>
    );
}

function ReportStatCard({ title, value, icon, colorClass, subtext }: any) {
    return (
        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    {title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${colorClass}`}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black tracking-tight tabular-nums">
                    {value}
                </div>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                    {subtext}
                </p>
            </CardContent>
        </Card>
    );
}
