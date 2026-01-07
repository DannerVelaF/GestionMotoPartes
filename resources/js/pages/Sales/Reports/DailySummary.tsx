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
    BarChart3,
    Calendar,
    Download,
    Filter,
    LineChart,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

// --- Interfaces ---
interface MethodBreakdown {
    name: string;
    total: number;
    count: number;
}

interface ReportItem {
    date: string;
    total: string | number;
    cost: string | number;
    profit: string | number;
    margin: string | number;
    transactions: number;
    methods: MethodBreakdown[];
}

interface Props {
    reportData: ReportItem[];
    filters: { from: string; to: string; period: string };
}

export default function DailySummary({ reportData, filters }: Props) {
    // Estado para controlar el tipo de gráfico (area = líneas/área, bar = barras)
    const [chartType, setChartType] = useState<'area' | 'bar'>('area');

    const totalRevenue = reportData.reduce(
        (acc, item) => acc + Number(item.total),
        0,
    );
    const totalCost = reportData.reduce(
        (acc, item) => acc + Number(item.cost),
        0,
    );
    const totalProfit = reportData.reduce(
        (acc, item) => acc + Number(item.profit),
        0,
    );

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
        profit: Number(item.profit),
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

    const currency = (amount: number) =>
        amount.toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const handleExport = () => {
        const queryParams = new URLSearchParams({
            from: filters.from,
            to: filters.to,
            period: filters.period,
        }).toString();

        // CAMBIO AQUÍ: Usar la ruta en español definida en web.php
        window.location.href = `/ventas/reportes/resumen-diario/export?${queryParams}`;
    };
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: sales.index().url },
                { title: 'Reportes', href: '#' },
                { title: 'Análisis de Rentabilidad', href: '' },
            ]}
        >
            <Head title="Resumen Económico" />

            <div className="flex h-full flex-col bg-background">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Reporte Económico
                        </h1>
                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            Periodo: {filters.from} al {filters.to}
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
                                <SelectValue placeholder="Periodo" />
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
                        <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800"></div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400"
                        >
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Excel
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                            {/* --- 1. RESUMEN KPI --- */}
                            <div className="md:col-span-4 lg:col-span-3">
                                <Card className="h-full rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            Resumen del Periodo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-hidden rounded-xl border dark:border-neutral-800">
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b bg-blue-50/50 dark:border-neutral-800 dark:bg-blue-900/10">
                                                        <td className="px-4 py-3 font-bold text-blue-700 dark:text-blue-400">
                                                            INGRESOS
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-700 tabular-nums dark:text-slate-300">
                                                            {currency(
                                                                totalRevenue,
                                                            )}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b bg-red-50/50 dark:border-neutral-800 dark:bg-red-900/10">
                                                        <td className="px-4 py-3 font-bold text-red-700 dark:text-red-400">
                                                            COSTO
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-700 tabular-nums dark:text-slate-300">
                                                            {currency(
                                                                totalCost,
                                                            )}
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-emerald-50/50 dark:bg-emerald-900/10">
                                                        <td className="px-4 py-3 font-black text-emerald-700 dark:text-emerald-400">
                                                            UB (Utilidad)
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-emerald-700 tabular-nums dark:text-emerald-400">
                                                            {currency(
                                                                totalProfit,
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-4 text-center">
                                            <span className="text-xs text-muted-foreground">
                                                Margen Bruto:{' '}
                                            </span>
                                            <span className="text-lg font-black text-slate-700 dark:text-slate-200">
                                                {totalRevenue > 0
                                                    ? (
                                                          (totalProfit /
                                                              totalRevenue) *
                                                          100
                                                      ).toFixed(2)
                                                    : 0}
                                                %
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* --- 2. GRÁFICO --- */}
                            <div className="md:col-span-8 lg:col-span-9">
                                <Card className="h-full rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 dark:border-neutral-800">
                                        <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                            <TrendingUp className="h-4 w-4 text-blue-600" />{' '}
                                            {chartData.length > 1
                                                ? 'Tendencia de Rentabilidad'
                                                : 'Balance del Periodo'}
                                        </CardTitle>

                                        {/* BOTÓN TOGGLE GRÁFICO */}
                                        <div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm dark:border-neutral-800">
                                            {chartData.length > 1 && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setChartType('area')
                                                        }
                                                        className={`h-6 w-6 rounded-md ${chartType === 'area' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        title="Gráfico de Líneas"
                                                    >
                                                        <LineChart className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setChartType('bar')
                                                        }
                                                        className={`h-6 w-6 rounded-md ${chartType === 'bar' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        title="Gráfico de Barras"
                                                    >
                                                        <BarChart3 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                {/* Lógica: Si hay 1 solo dato O si el usuario eligió Barras -> BarChart */}
                                                {chartData.length === 1 ||
                                                chartType === 'bar' ? (
                                                    <BarChart
                                                        data={chartData}
                                                        barSize={
                                                            chartData.length >
                                                            10
                                                                ? undefined
                                                                : 60
                                                        } // Ajuste dinámico de ancho
                                                    >
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
                                                                fontWeight:
                                                                    'bold',
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
                                                            cursor={{
                                                                fill: 'transparent',
                                                            }}
                                                            contentStyle={{
                                                                borderRadius:
                                                                    '12px',
                                                                border: 'none',
                                                                backgroundColor:
                                                                    '#000',
                                                                color: '#fff',
                                                                fontSize:
                                                                    '12px',
                                                            }}
                                                        />
                                                        <Legend
                                                            iconType="circle"
                                                            wrapperStyle={{
                                                                fontSize:
                                                                    '12px',
                                                                paddingTop:
                                                                    '10px',
                                                            }}
                                                        />
                                                        <Bar
                                                            dataKey="total"
                                                            name="Ingresos"
                                                            fill="#2563eb"
                                                            radius={[
                                                                4, 4, 0, 0,
                                                            ]}
                                                        />
                                                        <Bar
                                                            dataKey="profit"
                                                            name="Utilidad"
                                                            fill="#10b981"
                                                            radius={[
                                                                4, 4, 0, 0,
                                                            ]}
                                                        />
                                                    </BarChart>
                                                ) : (
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
                                                                    stopOpacity={
                                                                        0.1
                                                                    }
                                                                />
                                                                <stop
                                                                    offset="95%"
                                                                    stopColor="#2563eb"
                                                                    stopOpacity={
                                                                        0
                                                                    }
                                                                />
                                                            </linearGradient>
                                                            <linearGradient
                                                                id="colorProfit"
                                                                x1="0"
                                                                y1="0"
                                                                x2="0"
                                                                y2="1"
                                                            >
                                                                <stop
                                                                    offset="5%"
                                                                    stopColor="#10b981"
                                                                    stopOpacity={
                                                                        0.1
                                                                    }
                                                                />
                                                                <stop
                                                                    offset="95%"
                                                                    stopColor="#10b981"
                                                                    stopOpacity={
                                                                        0
                                                                    }
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
                                                                borderRadius:
                                                                    '12px',
                                                                border: 'none',
                                                                backgroundColor:
                                                                    '#000',
                                                                color: '#fff',
                                                                fontSize:
                                                                    '12px',
                                                            }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="total"
                                                            name="Ingresos"
                                                            stroke="#2563eb"
                                                            strokeWidth={2}
                                                            fillOpacity={1}
                                                            fill="url(#colorTotal)"
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="profit"
                                                            name="Utilidad"
                                                            stroke="#10b981"
                                                            strokeWidth={2}
                                                            fillOpacity={1}
                                                            fill="url(#colorProfit)"
                                                        />
                                                    </AreaChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* --- 3. TABLA DE DETALLE --- */}
                        <div className="rounded-3xl border border-slate-200 bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                            <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Desglose por Periodo
                            </h3>
                            <div className="overflow-hidden rounded-2xl border dark:border-neutral-800">
                                <Table>
                                    <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                        <TableRow className="border-none hover:bg-transparent">
                                            <TableHead className="font-bold">
                                                Periodo
                                            </TableHead>
                                            <TableHead className="text-center font-bold">
                                                Ops
                                            </TableHead>
                                            <TableHead className="font-bold">
                                                Detalle por Método
                                            </TableHead>
                                            <TableHead className="text-right font-bold">
                                                Ingresos
                                            </TableHead>
                                            <TableHead className="text-right font-bold text-red-600 dark:text-red-400">
                                                Costo
                                            </TableHead>
                                            <TableHead className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                UB
                                            </TableHead>
                                            <TableHead className="text-right font-bold">
                                                Margen
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
                                                    <TableCell className="align-top font-semibold capitalize">
                                                        {formatTableDate(
                                                            item.date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center align-top font-medium tabular-nums">
                                                        {item.transactions}
                                                    </TableCell>

                                                    {/* CELDA DE DESGLOSE DE MÉTODOS */}
                                                    <TableCell className="align-top">
                                                        <div className="flex flex-col gap-1">
                                                            {item.methods.map(
                                                                (
                                                                    method,
                                                                    mIdx,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            mIdx
                                                                        }
                                                                        className="flex items-center justify-between gap-4 rounded bg-muted/30 px-2 py-1 text-xs"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-foreground">
                                                                                {
                                                                                    method.name
                                                                                }
                                                                            </span>
                                                                            <span className="text-[10px] text-muted-foreground">
                                                                                (
                                                                                {
                                                                                    method.count
                                                                                }{' '}
                                                                                vts)
                                                                            </span>
                                                                        </div>
                                                                        <span className="font-medium tabular-nums">
                                                                            S/{' '}
                                                                            {currency(
                                                                                method.total,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-right align-top font-bold tabular-nums">
                                                        S/{' '}
                                                        {currency(
                                                            Number(item.total),
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right align-top font-medium text-red-600 tabular-nums dark:text-red-400">
                                                        S/{' '}
                                                        {currency(
                                                            Number(item.cost),
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right align-top font-black text-emerald-600 tabular-nums dark:text-emerald-400">
                                                        S/{' '}
                                                        {currency(
                                                            Number(item.profit),
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right align-top text-xs font-bold text-muted-foreground tabular-nums">
                                                        {item.margin}%
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
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
