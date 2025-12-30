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
import {
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

interface BrandItem {
    label: string;
    value: string | number;
}

interface Props {
    reportData: BrandItem[];
    filters: { from: string; to: string };
}

const COLORS = [
    '#2563eb', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
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
            { from: formData.get('from'), to: formData.get('to') },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ventas', href: sales.index().url },
                { title: 'Reportes', href: '#' },
                { title: 'Análisis de Marcas', href: '' },
            ]}
        >
            <Head title="Participación por Marca" />

            <div className="flex h-full flex-col bg-background">
                {/* --- HEADER STICKY (Sincronizado) --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-foreground">
                                Análisis de Marcas
                            </h1>
                            <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Participación de Mercado
                            </p>
                        </div>
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
                                className="h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0 dark:text-neutral-200"
                            />
                            <span className="text-muted-foreground/30">|</span>
                            <Input
                                type="date"
                                name="to"
                                defaultValue={filters.to}
                                className="h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0 dark:text-neutral-200"
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
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* --- GRÁFICO DE DONA (Modernizado) --- */}
                            <Card className="overflow-hidden rounded-3xl border-none shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="border-b bg-muted/30 dark:border-neutral-800">
                                    <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                        <PieIcon className="h-4 w-4 text-blue-600" />{' '}
                                        Market Share
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
                                                        (_, index) => (
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
                                                        backgroundColor: '#000',
                                                        color: '#fff',
                                                        fontSize: '12px',
                                                    }}
                                                    formatter={(value) =>
                                                        `S/ ${Number(value).toFixed(2)}`
                                                    }
                                                />
                                                <Legend
                                                    iconType="circle"
                                                    wrapperStyle={{
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        paddingTop: '20px',
                                                        color: '#888',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            Ingreso Total
                                        </p>
                                        <p className="text-3xl font-black tracking-tighter text-blue-600 tabular-nums dark:text-blue-400">
                                            S/{' '}
                                            {totalValue.toLocaleString(
                                                'es-PE',
                                                { minimumFractionDigits: 2 },
                                            )}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* --- RANKING DE MARCAS (Estilo Tabla Neutral) --- */}
                            <div className="flex flex-col rounded-3xl border border-slate-200 bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    <Briefcase className="h-4 w-4 text-blue-600" />{' '}
                                    Ranking de Marcas
                                </h3>
                                <div className="flex-1 overflow-hidden rounded-2xl border dark:border-neutral-800">
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="font-bold">
                                                    Marca
                                                </TableHead>
                                                <TableHead className="text-right font-bold">
                                                    Ventas (S/)
                                                </TableHead>
                                                <TableHead className="text-right font-bold">
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
                                                            className="transition-colors hover:bg-muted/50 dark:border-neutral-800"
                                                        >
                                                            <TableCell className="flex items-center gap-3 font-bold capitalize">
                                                                <div
                                                                    className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
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
                                                            <TableCell className="text-right font-bold text-muted-foreground tabular-nums">
                                                                {Number(
                                                                    item.value,
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                                                                        {percentage.toFixed(
                                                                            1,
                                                                        )}
                                                                        %
                                                                    </span>
                                                                    <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-muted">
                                                                        <div
                                                                            className="h-full bg-blue-600 dark:bg-blue-500"
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
                                                        className="h-40 text-center text-muted-foreground"
                                                    >
                                                        No hay datos
                                                        registrados.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* --- INSIGHT CARD (Adaptado) --- */}
                                <div className="mt-6 flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                                    <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm dark:bg-neutral-800">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black tracking-tighter text-emerald-800 uppercase dark:text-emerald-400">
                                            Insight del Mercado
                                        </p>
                                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                            <span className="font-bold underline">
                                                {reportData[0]?.label}
                                            </span>{' '}
                                            es tu marca más rentable
                                            actualmente.
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
