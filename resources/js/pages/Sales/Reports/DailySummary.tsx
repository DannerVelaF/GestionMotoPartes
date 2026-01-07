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
    ArrowDownCircle,
    ArrowUpCircle,
    BarChart3,
    Calendar,
    Download,
    Filter,
    LineChart,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    Line,
    LineChart as RechartsLineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

// --- Interfaces Actualizadas ---
interface MethodBreakdown {
    name: string;
    total: number;
    count: number;
}

interface ReportItem {
    date: string;
    income: number;
    expense: number;
    balance: number;
    transactions: number;
    methods: MethodBreakdown[]; // <--- Recuperado
}

interface Props {
    reportData: ReportItem[];
    filters: { from: string; to: string; period: string };
}

export default function DailySummary({ reportData, filters }: Props) {
    const [chartType, setChartType] = useState<'line' | 'bar'>('bar');

    // Totales Generales
    const totalIncome = reportData.reduce((acc, item) => acc + item.income, 0);
    const totalExpense = reportData.reduce(
        (acc, item) => acc + item.expense,
        0,
    );
    const totalBalance = totalIncome - totalExpense;

    const formatLabelByPeriod = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = parseISO(dateStr);
        switch (filters.period) {
            case 'monthly':
                return format(date, 'MMM yy', { locale: es });
            case 'yearly':
                return format(date, 'yyyy', { locale: es });
            case 'weekly':
                return format(date, 'dd/MM', { locale: es });
            default:
                return format(date, 'dd MMM', { locale: es });
        }
    };

    const formatTableDate = (dateStr: string) => {
        if (!dateStr) return '-';
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
        `S/ ${amount.toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const handleExport = () => {
        const queryParams = new URLSearchParams({
            from: filters.from,
            to: filters.to,
            period: filters.period,
        }).toString();
        window.location.href = `/ventas/reportes/resumen-diario/export?${queryParams}`;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: sales.index().url },
                { title: 'Reportes', href: '#' },
                { title: 'Flujo de Caja', href: '' },
            ]}
        >
            <Head title="Ingresos vs Egresos" />

            <div className="flex h-full flex-col bg-background">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Flujo de Caja (Ingresos vs Egresos)
                        </h1>
                        <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            Periodo: {filters.from} al {filters.to}
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                EN SOLES (PEN)
                            </span>
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
                            type="button"
                            onClick={handleExport}
                            className="dark:border-neutral-800 dark:hover:bg-neutral-900"
                        >
                            <Download className="mr-2 h-3.5 w-3.5" /> Excel
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {/* --- 1. RESUMEN KPI --- */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                        Total Ingresos (Ventas)
                                    </CardTitle>
                                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <ArrowUpCircle className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-emerald-600 tabular-nums dark:text-emerald-400">
                                        {currency(totalIncome)}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                        Total Egresos (Compras)
                                    </CardTitle>
                                    <div className="rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                        <ArrowDownCircle className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-red-600 tabular-nums dark:text-red-400">
                                        {currency(totalExpense)}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                        Balance Neto (Saldo)
                                    </CardTitle>
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className={`text-2xl font-black tabular-nums ${
                                            totalBalance >= 0
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`}
                                    >
                                        {currency(totalBalance)}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* --- 2. GRÁFICO --- */}
                        <div className="grid grid-cols-1">
                            <Card className="h-full rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 dark:border-neutral-800">
                                    <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                        <BarChart3 className="h-4 w-4 text-blue-600" />
                                        Comparativa Ingresos vs Egresos
                                    </CardTitle>
                                    <div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm dark:border-neutral-800">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setChartType('bar')}
                                            className={`h-6 w-6 rounded-md ${chartType === 'bar' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <BarChart3 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setChartType('line')}
                                            className={`h-6 w-6 rounded-md ${chartType === 'line' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <LineChart className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            {chartType === 'bar' ? (
                                                <BarChart data={chartData}>
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
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="income"
                                                        name="Ingresos"
                                                        fill="#10b981"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                    <Bar
                                                        dataKey="expense"
                                                        name="Egresos"
                                                        fill="#ef4444"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                </BarChart>
                                            ) : (
                                                <RechartsLineChart
                                                    data={chartData}
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
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="income"
                                                        name="Ingresos"
                                                        stroke="#10b981"
                                                        strokeWidth={3}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="expense"
                                                        name="Egresos"
                                                        stroke="#ef4444"
                                                        strokeWidth={3}
                                                    />
                                                </RechartsLineChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
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
                                                Transacciones
                                            </TableHead>
                                            <TableHead className="font-bold">
                                                Detalle por Método
                                            </TableHead>
                                            <TableHead className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                Ingresos
                                            </TableHead>
                                            <TableHead className="text-right font-bold text-red-600 dark:text-red-400">
                                                Egresos
                                            </TableHead>
                                            <TableHead className="text-right font-bold text-blue-600 dark:text-blue-400">
                                                Balance
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

                                                    {/* CELDA DE MÉTODOS RESTAURADA */}
                                                    <TableCell className="align-top">
                                                        <div className="flex flex-col gap-1">
                                                            {item.methods &&
                                                            item.methods
                                                                .length > 0 ? (
                                                                item.methods.map(
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
                                                                                    ops)
                                                                                </span>
                                                                            </div>
                                                                            <span className="font-medium tabular-nums">
                                                                                {currency(
                                                                                    method.total,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">
                                                                    -
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-right align-top font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                                                        {currency(item.income)}
                                                    </TableCell>
                                                    <TableCell className="text-right align-top font-bold text-red-600 tabular-nums dark:text-red-400">
                                                        {currency(item.expense)}
                                                    </TableCell>
                                                    <TableCell
                                                        className={`text-right align-top font-black tabular-nums ${item.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}
                                                    >
                                                        {currency(item.balance)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="h-32 text-center text-muted-foreground"
                                                >
                                                    No hay movimientos
                                                    registrados en este rango.
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
