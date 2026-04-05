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
    Line,
    LineChart as RechartsLineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

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
    methods: MethodBreakdown[];
}

interface Props {
    reportData: ReportItem[];
    filters: { from: string; to: string; period: string };
}

export default function DailySummary({ reportData = [], filters }: Props) {
    const [chartType, setChartType] = useState<'line' | 'bar'>('bar');

    const totalIncome = reportData.reduce(
        (acc, item) => acc + (Number(item.income) || 0),
        0,
    );
    const totalExpense = reportData.reduce(
        (acc, item) => acc + (Number(item.expense) || 0),
        0,
    );
    const totalBalance = totalIncome - totalExpense;

    const formatLabelByPeriod = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
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
        } catch (e) {
            return dateStr;
        }
    };

    const formatTableDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            const date = parseISO(dateStr);
            switch (filters.period) {
                case 'monthly':
                    return format(date, "MMMM 'de' yyyy", { locale: es });
                case 'yearly':
                    return format(date, 'yyyy', { locale: es });
                case 'weekly':
                    return (
                        'Semana del ' +
                        format(date, "dd 'de' MMM", { locale: es })
                    );
                default:
                    return format(date, "EEEE, dd 'de' MMMM", { locale: es });
            }
        } catch (e) {
            return dateStr;
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
            '/ventas/reportes/resumen-diario', // ✅ URL hardcodeada para evitar fallos de helper
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

            <div className="flex h-full flex-col bg-background text-foreground">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Flujo de Caja
                        </h1>
                        <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            Movimientos del {filters.from} al {filters.to}
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                VALORES EN SOLES
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
                            <SelectTrigger className="h-9 w-[130px] text-xs font-bold dark:border-neutral-800">
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
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1 dark:border-neutral-800 dark:bg-neutral-900/50">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    type="date"
                                    name="from"
                                    defaultValue={filters.from}
                                    className="dark:color-scheme-dark h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0"
                                />
                                <span className="text-muted-foreground/30">
                                    |
                                </span>
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="dark:border-neutral-800 dark:hover:bg-neutral-900"
                        >
                            <Download className="mr-2 h-3.5 w-3.5" /> Excel
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {/* --- 1. KPI CARDS --- */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <KpiCard
                                title="Total Ingresos (Ventas)"
                                value={currency(totalIncome)}
                                icon={<ArrowUpCircle className="h-4 w-4" />}
                                color="text-emerald-600 dark:text-emerald-400"
                                bgColor="bg-emerald-100 dark:bg-emerald-900/30"
                            />
                            <KpiCard
                                title="Total Egresos (Compras)"
                                value={currency(totalExpense)}
                                icon={<ArrowDownCircle className="h-4 w-4" />}
                                color="text-red-600 dark:text-red-400"
                                bgColor="bg-red-100 dark:bg-red-900/30"
                            />
                            <KpiCard
                                title="Balance Neto (Saldo)"
                                value={currency(totalBalance)}
                                icon={<Wallet className="h-4 w-4" />}
                                color={
                                    totalBalance >= 0
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-red-600'
                                }
                                bgColor="bg-blue-100 dark:bg-blue-900/30"
                            />
                        </div>

                        {/* --- 2. GRÁFICO --- */}
                        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 dark:border-neutral-800">
                                <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                    <BarChart3 className="h-4 w-4 text-blue-600" />{' '}
                                    Comparativa Temporal
                                </CardTitle>
                                <div className="flex gap-1 rounded-lg border bg-background p-1 dark:border-neutral-800">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setChartType('bar')}
                                        className={cn(
                                            'h-7 w-7',
                                            chartType === 'bar' && 'bg-muted',
                                        )}
                                    >
                                        <BarChart3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setChartType('line')}
                                        className={cn(
                                            'h-7 w-7',
                                            chartType === 'line' && 'bg-muted',
                                        )}
                                    >
                                        <LineChart className="h-4 w-4" />
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
                                                        fill: 'currentColor',
                                                        opacity: 0.5,
                                                    }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 10,
                                                        fill: 'currentColor',
                                                        opacity: 0.5,
                                                    }}
                                                />
                                                <ChartTooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        backgroundColor: '#000',
                                                        color: '#fff',
                                                    }}
                                                />
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
                                            <RechartsLineChart data={chartData}>
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
                                                        fill: 'currentColor',
                                                        opacity: 0.5,
                                                    }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 10,
                                                        fill: 'currentColor',
                                                        opacity: 0.5,
                                                    }}
                                                />
                                                <ChartTooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        backgroundColor: '#000',
                                                        color: '#fff',
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="income"
                                                    name="Ingresos"
                                                    stroke="#10b981"
                                                    strokeWidth={3}
                                                    dot={{ r: 4 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="expense"
                                                    name="Egresos"
                                                    stroke="#ef4444"
                                                    strokeWidth={3}
                                                    dot={{ r: 4 }}
                                                />
                                            </RechartsLineChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* --- 3. TABLA --- */}
                        <div className="rounded-3xl border border-slate-200 bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                            <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Desglose Detallado
                            </h3>
                            <div className="overflow-hidden rounded-2xl border dark:border-neutral-800">
                                <Table>
                                    <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-bold">
                                                Periodo
                                            </TableHead>
                                            <TableHead className="text-center font-bold">
                                                TXs
                                            </TableHead>
                                            <TableHead className="font-bold">
                                                Métodos de Pago (Ingresos)
                                            </TableHead>
                                            <TableHead className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                Ingresos
                                            </TableHead>
                                            <TableHead className="text-right font-bold text-red-600 dark:text-red-400">
                                                Egresos (OC)
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
                                                    className="hover:bg-muted/50 dark:border-neutral-800"
                                                >
                                                    <TableCell className="font-semibold capitalize">
                                                        {formatTableDate(
                                                            item.date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium tabular-nums">
                                                        {item.transactions}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            {item.methods?.map(
                                                                (m, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="flex justify-between gap-4 rounded bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase"
                                                                    >
                                                                        <span>
                                                                            {
                                                                                m.name
                                                                            }
                                                                        </span>
                                                                        <span className="tabular-nums">
                                                                            S/{' '}
                                                                            {m.total.toFixed(
                                                                                2,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-600 tabular-nums">
                                                        {currency(item.income)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-red-600 tabular-nums">
                                                        {currency(item.expense)}
                                                    </TableCell>
                                                    <TableCell
                                                        className={cn(
                                                            'text-right font-black tabular-nums',
                                                            item.balance >= 0
                                                                ? 'text-blue-600'
                                                                : 'text-red-500',
                                                        )}
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
                                                    Sin registros en el rango.
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

function KpiCard({ title, value, icon, color, bgColor }: any) {
    return (
        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    {title}
                </CardTitle>
                <div className={cn('rounded-lg p-2', bgColor, color)}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn('text-2xl font-black tabular-nums', color)}>
                    {value}
                </div>
            </CardContent>
        </Card>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
