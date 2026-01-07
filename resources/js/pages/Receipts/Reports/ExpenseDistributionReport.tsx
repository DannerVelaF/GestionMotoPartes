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
import { Head, router } from '@inertiajs/react';
import {
    Box,
    Briefcase,
    Calendar,
    DollarSign,
    Filter,
    PieChart as PieIcon,
} from 'lucide-react';
import {
    Cell,
    Tooltip as ChartTooltip,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b']; // Azul (Productos), Ambar (Servicios)

export default function ExpenseDistributionReport({
    reportData,
    detailedData, // Recibimos el detalle
    filters,
}: any) {
    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            '/recibos/reportes/distribucion',
            {
                from: formData.get('from'),
                to: formData.get('to'),
            },
            { preserveState: true },
        );
    };

    const totalExpense = reportData.reduce(
        (acc: number, item: any) => acc + item.value,
        0,
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Comprobantes', href: receipts.index().url },
                { title: 'Reportes', href: '#' },
                { title: 'Distribución de Gastos', href: '' },
            ]}
        >
            <Head title="Productos vs Servicios" />

            <div className="flex h-full flex-col bg-background">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                Distribución de Gastos
                            </h1>
                            <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Comparativa Productos vs Servicios
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    EN SOLES (PEN)
                                </span>
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
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-6xl space-y-6">
                        {/* --- RESUMEN KPI --- */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                        Gasto Total
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-foreground tabular-nums">
                                        S/{' '}
                                        {totalExpense.toLocaleString('es-PE', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                            {reportData.map((item: any, idx: number) => (
                                <Card
                                    key={idx}
                                    className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800"
                                >
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            {item.name}
                                        </CardTitle>
                                        {item.name === 'Productos' ? (
                                            <Box className="h-4 w-4 text-blue-500" />
                                        ) : (
                                            <Briefcase className="h-4 w-4 text-amber-500" />
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className={`text-2xl font-black tabular-nums ${item.name === 'Productos' ? 'text-blue-600' : 'text-amber-600'}`}
                                        >
                                            S/{' '}
                                            {item.value.toLocaleString(
                                                'es-PE',
                                                { minimumFractionDigits: 2 },
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {item.percentage}% del total (
                                            {item.count} ítems)
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* --- GRAFICO --- */}
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                                <CardHeader className="border-b bg-muted/30 dark:border-neutral-800">
                                    <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                        <PieIcon className="h-4 w-4" />{' '}
                                        Estructura de Costos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <div className="h-[300px] w-full">
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
                                                    outerRadius={110}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {reportData.map(
                                                        (
                                                            _: any,
                                                            index: number,
                                                        ) => (
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
                                                </Pie>
                                                {/* Tooltip corregido para Dark Mode */}
                                                <ChartTooltip
                                                    formatter={(
                                                        value: number,
                                                    ) =>
                                                        `S/ ${value.toLocaleString()}`
                                                    }
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        backgroundColor:
                                                            'hsl(var(--card))', // Usa variable de tema o color fijo
                                                        color: 'hsl(var(--foreground))',
                                                        boxShadow:
                                                            '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                        padding: '12px',
                                                    }}
                                                    itemStyle={{
                                                        color: 'hsl(var(--foreground))',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* --- TABLA DETALLE ESPECIFICO --- */}
                            <Card className="flex flex-col rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 lg:col-span-2 dark:ring-neutral-800">
                                <CardHeader className="border-b bg-muted/30 dark:border-neutral-800">
                                    <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                        <DollarSign className="h-4 w-4" />{' '}
                                        Detalle por Ítem (Top 50)
                                    </CardTitle>
                                </CardHeader>
                                <div className="flex-1 overflow-hidden p-0">
                                    <div className="h-[400px] overflow-y-auto">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background">
                                                <TableRow className="border-b dark:border-neutral-800">
                                                    <TableHead className="w-[100px] font-bold">
                                                        Tipo
                                                    </TableHead>
                                                    <TableHead className="font-bold">
                                                        Descripción / Producto
                                                    </TableHead>
                                                    <TableHead className="text-right font-bold">
                                                        Monto (S/)
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {detailedData.map(
                                                    (
                                                        item: any,
                                                        idx: number,
                                                    ) => (
                                                        <TableRow
                                                            key={idx}
                                                            className="border-b dark:border-neutral-800"
                                                        >
                                                            <TableCell>
                                                                <div
                                                                    className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                                        item.category ===
                                                                        'Productos'
                                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                                    }`}
                                                                >
                                                                    {
                                                                        item.category
                                                                    }
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs font-medium">
                                                                {item.item_name}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono font-bold tabular-nums">
                                                                S/{' '}
                                                                {Number(
                                                                    item.total_amount,
                                                                ).toLocaleString(
                                                                    'es-PE',
                                                                    {
                                                                        minimumFractionDigits: 2,
                                                                    },
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
