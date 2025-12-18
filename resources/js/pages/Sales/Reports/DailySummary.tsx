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
import reports from '@/routes/reports'; // Importación de tus Wayfinders
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    Download,
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
import sales from '@/routes/sales';

interface ReportItem {
    date: string;
    total: string | number;
    transactions: number;
}

interface Props {
    reportData: ReportItem[];
    filters: { from: string; to: string };
}

export default function DailySummary({ reportData, filters }: Props) {
    // Cálculos para los KPIs superiores
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

    // Formatear datos para el gráfico
    const chartData = reportData.map((item) => ({
        ...item,
        formattedDate: format(new Date(item.date), 'dd MMM', { locale: es }),
        total: Number(item.total),
    }));

    // --- MANEJO DE FILTROS USANDO WAYFINDERS ---
    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Usamos la ruta definida en tu objeto reports
        router.get(
            reports.daily().url,
            {
                from: formData.get('from'),
                to: formData.get('to'),
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: "Ventas", href: sales.index().url
                },
                { title: 'Reportes', href: '#' },
                { title: 'Resumen Diario', href: '' },
            ]}
        >
            <Head title="Resumen Diario de Ventas" />

            <div className="flex h-full flex-col bg-slate-50/50">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-8 py-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.history.back()}
                            className="h-9 w-9 rounded-full border-slate-200"
                        >
                            <ArrowLeft className="h-4 w-4 text-slate-600" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                Resumen Diario de Ventas
                            </h1>
                            <p className="text-xs text-[10px] font-medium tracking-widest text-slate-500 uppercase">
                                Análisis de ingresos y transacciones
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleFilterChange}
                        className="flex items-center gap-3"
                    >
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <Input
                                type="date"
                                name="from"
                                defaultValue={filters.from}
                                className="h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0"
                            />
                            <span className="text-slate-300">|</span>
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
                            <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="border-slate-200 text-xs font-bold"
                        >
                            <Download className="mr-2 h-3.5 w-3.5 text-slate-600" />{' '}
                            Exportar
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* --- KPIs --- */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                        Total Recaudado
                                    </CardTitle>
                                    <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                                        S/{' '}
                                        {totalRevenue.toLocaleString('es-PE', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                    <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                        <TrendingUp className="h-3 w-3" /> Bruto
                                        en el periodo
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                        Ventas Realizadas
                                    </CardTitle>
                                    <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
                                        <ShoppingBag className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                                        {totalTransactions} op.
                                    </div>
                                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                                        Volumen de transacciones
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                        Ticket Promedio
                                    </CardTitle>
                                    <div className="rounded-md bg-amber-50 p-2 text-amber-600">
                                        <TrendingUp className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                                        S/{' '}
                                        {averageTicket.toLocaleString('es-PE', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                                        Valor medio por venta
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* --- CHART --- */}
                        <Card className="overflow-hidden rounded-3xl border-none shadow-sm ring-1 ring-slate-200">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />{' '}
                                    Tendencia de Ingresos Diarios
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
                                                stroke="#f1f5f9"
                                            />
                                            <XAxis
                                                dataKey="formattedDate"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fontSize: 10,
                                                    fill: '#94a3b8',
                                                }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fontSize: 10,
                                                    fill: '#94a3b8',
                                                }}
                                                tickFormatter={(value) =>
                                                    `S/ ${value}`
                                                }
                                            />
                                            <ChartTooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow:
                                                        '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="total"
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

                        {/* --- DATA TABLE --- */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold tracking-tight text-slate-900 uppercase">
                                Desglose Cronológico
                            </h3>
                            <div className="overflow-hidden rounded-xl border border-slate-100">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-bold text-slate-700">
                                                Fecha
                                            </TableHead>
                                            <TableHead className="text-center font-bold text-slate-700">
                                                Transacciones
                                            </TableHead>
                                            <TableHead className="text-right font-bold text-slate-700">
                                                Total Diario
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.length > 0 ? (
                                            reportData.map((item, idx) => (
                                                <TableRow
                                                    key={idx}
                                                    className="hover:bg-slate-50/50"
                                                >
                                                    <TableCell className="font-semibold text-slate-700">
                                                        {format(
                                                            new Date(item.date),
                                                            "EEEE, dd 'de' MMMM",
                                                            { locale: es },
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium text-slate-600 tabular-nums">
                                                        {item.transactions}
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-blue-700 tabular-nums">
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
                                                    colSpan={3}
                                                    className="h-24 text-center font-medium text-slate-400"
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
