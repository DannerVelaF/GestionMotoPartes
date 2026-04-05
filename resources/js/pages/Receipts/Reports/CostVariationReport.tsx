import { SearchableSelect } from '@/components/SearchableSelect';
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
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Calendar,
    Filter,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
    CartesianGrid,
    Tooltip as ChartTooltip,
    Line,
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

interface Props {
    trendData: any[];
    reportData: any[];
    productsList: { value: string | number; label: string }[];
    filters: { from: string; to: string; id_product?: string };
}

export default function CostVariationReport({
    trendData = [],
    reportData = [],
    productsList = [],
    filters,
}: Props) {
    const [selectedProduct, setSelectedProduct] = useState(
        filters.id_product || '',
    );

    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        router.get(
            '/compras/reportes/variacion-costos', // ✅ Nueva ruta en PurchaseOrdersController
            {
                from: formData.get('from'),
                to: formData.get('to'),
                id_product: selectedProduct,
            },
            { preserveState: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Compras', href: '/compras/ordenes' },
                { title: 'Reportes', href: '#' },
                { title: 'Variación de Costos', href: '' },
            ]}
        >
            <Head title="Historial de Precios" />

            <div className="flex h-full flex-col bg-background text-foreground">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                Variación de Costos (OC)
                            </h1>
                            <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Trazabilidad inflacionaria de insumos
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                    VALORES EN SOLES (PEN)
                                </span>
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleFilterChange}
                        className="flex items-center gap-3"
                    >
                        <div className="w-64">
                            <SearchableSelect
                                options={productsList}
                                value={selectedProduct}
                                placeholder="Todos los productos"
                                onChange={(val) => setSelectedProduct(val)}
                                onClear={() => setSelectedProduct('')}
                                className="text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="date"
                                name="from"
                                defaultValue={filters.from}
                                className="dark:color-scheme-dark h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0"
                            />
                            <span className="text-muted-foreground opacity-20">
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
                            <Filter className="mr-2 h-3.5 w-3.5" /> Rastrear
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                            {/* Gráfico de Tendencia */}
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 lg:col-span-3 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="border-b bg-muted/30 dark:border-neutral-800">
                                    <CardTitle className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                        Curva de Costos Históricos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <LineChart
                                                data={trendData}
                                                margin={{
                                                    top: 5,
                                                    right: 20,
                                                    bottom: 5,
                                                    left: 0,
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                    strokeOpacity={0.1}
                                                />
                                                <XAxis
                                                    dataKey="date"
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
                                                        fontSize: 11,
                                                        fill: 'currentColor',
                                                        opacity: 0.5,
                                                    }}
                                                    tickFormatter={(val) =>
                                                        `S/ ${val}`
                                                    }
                                                />
                                                <ChartTooltip
                                                    contentStyle={{
                                                        backgroundColor:
                                                            'black',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        color: 'white',
                                                    }}
                                                    itemStyle={{
                                                        color: '#60a5fa',
                                                    }}
                                                    formatter={(value: any) => [
                                                        `S/ ${Number(value).toFixed(2)}`,
                                                        'Costo Promedio',
                                                    ]}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke="#3b82f6"
                                                    strokeWidth={4}
                                                    dot={{
                                                        r: 4,
                                                        fill: '#3b82f6',
                                                        strokeWidth: 0,
                                                    }}
                                                    activeDot={{
                                                        r: 6,
                                                        strokeWidth: 0,
                                                    }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Ranking de Variación */}
                            <div className="flex flex-col rounded-3xl border border-neutral-200 bg-card p-6 shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900/20">
                                <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Ranking de Variación por Item
                                </h3>
                                <div className="flex-1 overflow-hidden rounded-2xl border dark:border-neutral-800">
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-bold">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="text-right font-bold">
                                                    Variación
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.length > 0 ? (
                                                reportData.map(
                                                    (
                                                        item: any,
                                                        idx: number,
                                                    ) => (
                                                        <TableRow
                                                            key={idx}
                                                            className="transition-colors hover:bg-muted/50 dark:border-neutral-800"
                                                        >
                                                            <TableCell className="py-3">
                                                                <p className="max-w-[180px] truncate text-[11px] leading-tight font-black text-foreground uppercase">
                                                                    {item.name}
                                                                </p>
                                                                <span className="font-mono text-[10px] text-muted-foreground">
                                                                    S/{' '}
                                                                    {
                                                                        item.old_price
                                                                    }{' '}
                                                                    → S/{' '}
                                                                    {
                                                                        item.new_price
                                                                    }
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div
                                                                    className={`flex items-center justify-end gap-1 text-xs font-black tabular-nums ${
                                                                        item.variation >
                                                                        0
                                                                            ? 'text-red-500'
                                                                            : item.variation <
                                                                                0
                                                                              ? 'text-emerald-500'
                                                                              : 'text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    {item.variation >
                                                                    0 ? (
                                                                        <TrendingUp className="h-3 w-3" />
                                                                    ) : (
                                                                        <TrendingDown className="h-3 w-3" />
                                                                    )}
                                                                    {Math.abs(
                                                                        item.variation,
                                                                    ).toFixed(
                                                                        1,
                                                                    )}
                                                                    %
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={2}
                                                        className="h-24 text-center text-muted-foreground"
                                                    >
                                                        Sin datos registrados.
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
            </div>
        </AppLayout>
    );
}
