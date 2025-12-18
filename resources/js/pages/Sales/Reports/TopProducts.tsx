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
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Calendar,
    Filter,
    ShoppingBag,
    Trophy,
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
import sales from '@/routes/sales';

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
            {
                from: formData.get('from'),
                to: formData.get('to'),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Preparar datos para el gráfico (Top 10 para no saturar)
    const chartData = [...reportData].slice(0, 10).map((item) => ({
        name: item.product_name,
        cantidad: Number(item.total_qty),
        ingresos: Number(item.total_revenue),
    }));

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Ventas',
                    href: sales.index().url,
                },
                { title: 'Reportes', href: '#' },
                { title: 'Productos Estrella', href: '' },
            ]}
        >
            <Head title="Ranking de Productos" />

            <div className="flex h-full flex-col bg-slate-50/50">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-8 py-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.history.back()}
                            className="h-9 w-9 rounded-full"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                Productos Estrella
                            </h1>
                            <p className="text-xs text-[10px] font-medium tracking-widest text-slate-500 uppercase">
                                Ranking de los más vendidos
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
                    </form>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* --- TOP 1 HIGHLIGHT --- */}
                        {reportData.length > 0 && (
                            <Card className="rounded-3xl border-none bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md ring-1 ring-slate-200">
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                                            <Trophy className="h-10 w-10 text-yellow-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold tracking-widest text-blue-100 uppercase">
                                                Producto más vendido
                                            </p>
                                            <h2 className="text-2xl font-black">
                                                {reportData[0].product_name}
                                            </h2>
                                            <p className="text-sm font-medium text-blue-100">
                                                {reportData[0].product_code} —{' '}
                                                {Number(
                                                    reportData[0].total_qty,
                                                )}{' '}
                                                unidades movidas
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-blue-100 uppercase">
                                            Ingresos Generados
                                        </p>
                                        <p className="text-3xl font-black tabular-nums">
                                            S/{' '}
                                            {Number(
                                                reportData[0].total_revenue,
                                            ).toFixed(2)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                            {/* Gráfico de Barras (3/5 del ancho) */}
                            <Card className="overflow-hidden rounded-3xl border-none shadow-sm ring-1 ring-slate-200 lg:col-span-3">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <BarChart3 className="h-4 w-4 text-blue-600" />{' '}
                                        Comparativa de Volumen (Top 10)
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
                                                margin={{ left: 30, right: 30 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    horizontal={true}
                                                    vertical={false}
                                                    stroke="#f1f5f9"
                                                />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 10,
                                                        fontWeight: '600',
                                                        fill: '#64748b',
                                                    }}
                                                    width={120}
                                                />
                                                <ChartTooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow:
                                                            '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="cantidad"
                                                    radius={[0, 4, 4, 0]}
                                                    barSize={25}
                                                    fill="#2563eb"
                                                >
                                                    {chartData.map(
                                                        (entry, index) => (
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

                            {/* Tabla de Ranking (2/5 del ancho) */}
                            <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 uppercase">
                                    <ShoppingBag className="h-4 w-4 text-blue-600" />{' '}
                                    Detalle de Ventas
                                </h3>
                                <div className="flex-1 overflow-hidden rounded-xl border border-slate-100">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="w-12 font-bold text-slate-700">
                                                    #
                                                </TableHead>
                                                <TableHead className="font-bold text-slate-700">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="text-right font-bold text-slate-700">
                                                    Cant.
                                                </TableHead>
                                                <TableHead className="text-right font-bold text-slate-700">
                                                    Total
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.map((item, idx) => (
                                                <TableRow
                                                    key={idx}
                                                    className="hover:bg-slate-50/50"
                                                >
                                                    <TableCell className="text-xs font-bold text-slate-400">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell className="text-[11px] leading-tight font-bold text-slate-800">
                                                        {item.product_name}
                                                        <span className="block font-mono text-[9px] font-normal text-slate-400 uppercase">
                                                            {item.product_code}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-slate-700 tabular-nums">
                                                        {Number(item.total_qty)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-black text-blue-700 tabular-nums">
                                                        S/{' '}
                                                        {Number(
                                                            item.total_revenue,
                                                        ).toFixed(2)}
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
