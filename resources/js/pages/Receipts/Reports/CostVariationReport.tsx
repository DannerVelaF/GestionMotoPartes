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
    ArrowLeft,
    Calendar,
    Filter,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import {
    CartesianGrid,
    Tooltip as ChartTooltip,
    Line,
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

export default function CostVariationReport({
    trendData,
    reportData,
    productsList,
    filters,
}: any) {
    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            '/receipts/reports/variation',
            {
                from: formData.get('from'),
                to: formData.get('to'),
                id_product: formData.get('id_product'),
            },
            { preserveState: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Reportes', href: '#' },
                { title: 'Variación de Costos', href: '' },
            ]}
        >
            <Head title="Historial de Precios" />

            <div className="flex h-full flex-col bg-background">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.history.back()}
                            className="rounded-full dark:border-neutral-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                Variación de Costos
                            </h1>
                            <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Trazabilidad inflacionaria de insumos
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleFilterChange}
                        className="flex items-center gap-3"
                    >
                        <div className="w-64">
                            <SearchableSelect
                                name="id_product"
                                options={productsList}
                                value={filters.id_product}
                                placeholder="Todos los productos"
                                onChange={() => {}} // Se maneja por el submit del form
                            />
                        </div>
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
                            className="bg-blue-600 font-bold hover:bg-blue-700"
                        >
                            <Filter className="mr-2 h-3.5 w-3.5" /> Rastrear
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                            {/* Gráfico de Tendencia (Líneas) */}
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 lg:col-span-3 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="border-b bg-muted/30 dark:border-neutral-800">
                                    <CardTitle className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                                        <Activity className="h-4 w-4 text-blue-500" />{' '}
                                        Curva de Precios
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <LineChart data={trendData}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                    strokeOpacity={0.05}
                                                />
                                                <XAxis
                                                    dataKey="date"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 9,
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
                                                    tickFormatter={(val) =>
                                                        `S/ ${val}`
                                                    }
                                                />
                                                <ChartTooltip
                                                    contentStyle={{
                                                        backgroundColor: '#000',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        color: '#fff',
                                                        fontSize: '10px',
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke="#2563eb"
                                                    strokeWidth={3}
                                                    dot={{
                                                        r: 4,
                                                        fill: '#2563eb',
                                                    }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tabla de Variaciones Críticas */}
                            <div className="flex flex-col rounded-3xl border border-neutral-200 bg-card p-6 shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900/20">
                                <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Ranking de Variación
                                </h3>
                                <div className="flex-1 overflow-hidden rounded-2xl border dark:border-neutral-800">
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="font-bold">
                                                    Producto
                                                </TableHead>
                                                <TableHead className="text-right font-bold">
                                                    Variación
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.map(
                                                (item: any, idx: number) => (
                                                    <TableRow
                                                        key={idx}
                                                        className="transition-colors hover:bg-muted/50 dark:border-neutral-800"
                                                    >
                                                        <TableCell className="py-3">
                                                            <p className="text-[11px] leading-tight font-black uppercase">
                                                                {item.name}
                                                            </p>
                                                            <span className="font-mono text-[9px] text-muted-foreground">
                                                                Inicial: S/{' '}
                                                                {item.old_price}{' '}
                                                                → Final: S/{' '}
                                                                {item.new_price}
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
                                                                )}
                                                                %
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
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
