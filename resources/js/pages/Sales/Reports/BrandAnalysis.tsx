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
    Briefcase,
    Calendar,
    Filter,
    PieChart as PieIcon,
    TrendingUp,
} from 'lucide-react';
import {
    Cell,
    Tooltip as ChartTooltip,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
} from 'recharts';
import sales from '@/routes/sales';

interface BrandItem {
    label: string;
    value: string | number;
}

interface Props {
    reportData: BrandItem[];
    filters: { from: string; to: string };
}

// Paleta de colores profesional para Data Science
const COLORS = [
    '#2563eb',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#f43f5e',
];

export default function BrandAnalysis({
    reportData = [],
    filters = { from: '', to: '' },
}: Props) {
    const totalValue = reportData.reduce(
        (acc, item) => acc + Number(item.value),
        0,
    );

    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            reports.brands().url,
            {
                from: formData.get('from'),
                to: formData.get('to'),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Ventas',
                    href: sales.index().url,
                },
                { title: 'Reportes', href: '#' },
                { title: 'Análisis de Marcas', href: '' },
            ]}
        >
            <Head title="Participación por Marca" />

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
                                Análisis de Marcas
                            </h1>
                            <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                Distribución de ingresos por fabricante
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
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* --- GRÁFICO DE DONA --- */}
                            <Card className="overflow-hidden rounded-3xl border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <PieIcon className="h-4 w-4 text-blue-600" />{' '}
                                        Composición del Market Share
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center pt-10">
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={reportData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    nameKey="label"
                                                >
                                                    {reportData.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    COLORS[
                                                                        index %
                                                                            COLORS.length
                                                                    ]
                                                                }
                                                                stroke="none"
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <ChartTooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow:
                                                            '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    }}
                                                    formatter={(value) =>
                                                        `S/ ${Number(value).toFixed(2)}`
                                                    }
                                                />
                                                <Legend
                                                    iconType="circle"
                                                    layout="horizontal"
                                                    verticalAlign="bottom"
                                                    align="center"
                                                    wrapperStyle={{
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        textTransform:
                                                            'uppercase',
                                                        paddingTop: '20px',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            Ingreso Total Agrupado
                                        </p>
                                        <p className="text-3xl font-black text-blue-700 tabular-nums">
                                            S/{' '}
                                            {totalValue.toLocaleString(
                                                'es-PE',
                                                { minimumFractionDigits: 2 },
                                            )}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* --- TABLA DE DATOS Y PARTICIPACIÓN --- */}
                            <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 uppercase">
                                    <Briefcase className="h-4 w-4 text-blue-600" />{' '}
                                    Ranking de Marcas
                                </h3>
                                <div className="flex-1 overflow-hidden rounded-xl border border-slate-100">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-bold text-slate-700">
                                                    Marca
                                                </TableHead>
                                                <TableHead className="text-right font-bold text-slate-700">
                                                    Ventas (S/)
                                                </TableHead>
                                                <TableHead className="text-right font-bold text-slate-700">
                                                    Part. %
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.length > 0 ? (
                                                reportData.map((item, idx) => {
                                                    const percentage =
                                                        (Number(item.value) /
                                                            totalValue) *
                                                        100;
                                                    return (
                                                        <TableRow
                                                            key={idx}
                                                            className="hover:bg-slate-50/50"
                                                        >
                                                            <TableCell className="flex items-center gap-2 font-bold text-slate-800">
                                                                <div
                                                                    className="h-2 w-2 rounded-full"
                                                                    style={{
                                                                        backgroundColor:
                                                                            COLORS[
                                                                                idx %
                                                                                    COLORS.length
                                                                            ],
                                                                    }}
                                                                />
                                                                {item.label}
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-slate-600 tabular-nums">
                                                                {Number(
                                                                    item.value,
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-xs font-black text-blue-600">
                                                                        {percentage.toFixed(
                                                                            1,
                                                                        )}
                                                                        %
                                                                    </span>
                                                                    <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                                                                        <div
                                                                            className="h-full bg-blue-600"
                                                                            style={{
                                                                                width: `${percentage}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={3}
                                                        className="h-40 text-center font-medium text-slate-400"
                                                    >
                                                        No hay datos de marcas
                                                        registrados.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-6 flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                    <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black tracking-tighter text-emerald-800 uppercase">
                                            Insights de Datos
                                        </p>
                                        <p className="text-xs leading-tight font-medium text-emerald-700">
                                            La marca{' '}
                                            <span className="font-bold underline">
                                                {reportData[0]?.label}
                                            </span>{' '}
                                            lidera el mercado con una
                                            participación del{' '}
                                            {(
                                                (Number(reportData[0]?.value) /
                                                    totalValue) *
                                                100
                                            ).toFixed(1)}
                                            %.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
