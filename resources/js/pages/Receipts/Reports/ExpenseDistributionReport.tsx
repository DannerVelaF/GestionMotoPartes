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
                                                      reportData = [],
                                                      detailedData = [],
                                                      filters,
                                                  }: any) {
    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            '/compras/reportes/distribucion', // ✅ Nueva ruta
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
                { title: 'Compras', href: '/compras/ordenes' },
                { title: 'Reportes', href: '#' },
                { title: 'Distribución de Gastos', href: '' },
            ]}
        >
            <Head title="Productos vs Servicios" />

            <div className="flex h-full flex-col bg-background text-foreground">
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-foreground">
                            Distribución de Gastos (OC)
                        </h1>
                        <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            Análisis de Inversión en Compras
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                EN SOLES (PEN)
                            </span>
                        </p>
                    </div>

                    <form onSubmit={handleFilterChange} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="date"
                                name="from"
                                defaultValue={filters.from}
                                className="h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0 dark:color-scheme-dark"
                            />
                            <span className="opacity-20">|</span>
                            <Input
                                type="date"
                                name="to"
                                defaultValue={filters.to}
                                className="h-7 border-none bg-transparent p-0 text-xs focus-visible:ring-0 dark:color-scheme-dark"
                            />
                        </div>
                        <Button type="submit" size="sm" className="bg-blue-600 font-bold hover:bg-blue-700 dark:text-white">
                            <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-8 dark:bg-neutral-950/20">
                    <div className="mx-auto max-w-6xl space-y-6">
                        {/* --- RESUMEN KPI --- */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                        Gasto Comprometido Total
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-foreground tabular-nums">
                                        S/ {totalExpense.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </div>
                                </CardContent>
                            </Card>
                            {reportData.map((item: any, idx: number) => (
                                <Card key={idx} className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
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
                                        <div className={`text-2xl font-black tabular-nums ${item.name === 'Productos' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            S/ {item.value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </div>
                                        <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase">
                                            {item.percentage}% del total • {item.count} líneas
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* --- GRÁFICO --- */}
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="border-b dark:border-neutral-800 bg-muted/30">
                                    <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-foreground">
                                        <PieIcon className="h-4 w-4 text-blue-500" /> Estructura de Gastos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={reportData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={100}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {reportData.map((_: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip
                                                    formatter={(value: number) => `S/ ${value.toLocaleString('es-PE')}`}
                                                    contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '12px', color: 'white' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* --- TABLA DETALLE --- */}
                            <Card className="flex flex-col rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 lg:col-span-2 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="border-b dark:border-neutral-800 bg-muted/30">
                                    <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-foreground">
                                        <DollarSign className="h-4 w-4 text-emerald-500" /> Detalle por Concepto (Top 50)
                                    </CardTitle>
                                </CardHeader>
                                <div className="flex-1 overflow-hidden">
                                    <div className="h-[400px] overflow-y-auto">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                                                <TableRow className="border-b dark:border-neutral-800">
                                                    <TableHead className="w-[100px] font-bold text-foreground">Tipo</TableHead>
                                                    <TableHead className="font-bold text-foreground">Descripción</TableHead>
                                                    <TableHead className="text-right font-bold text-foreground">Monto</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {detailedData.map((item: any, idx: number) => (
                                                    <TableRow key={idx} className="border-b dark:border-neutral-800 hover:bg-muted/50 transition-colors">
                                                        <TableCell>
                                                            <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                                                item.category === 'Productos'
                                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                            }`}>
                                                                {item.category}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-[11px] font-bold uppercase text-foreground/80">
                                                            {item.item_name}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-xs font-black tabular-nums">
                                                            S/ {Number(item.total_amount).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
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
