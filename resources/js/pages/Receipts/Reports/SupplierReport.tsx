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
    Briefcase,
    Calendar,
    Filter,
    PieChart as PieIcon,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Cell,
    Tooltip as ChartTooltip,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function SupplierReport({ reportData = [], filters }: { reportData: any[]; filters: any }) {
    const totalInvestment = reportData.reduce((acc, i) => acc + i.total, 0);
    const topSupplier = reportData[0]?.supplier || 'Sin datos';

    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            '/recibos/reportes/proveedores', // ✅ Ajustado a la ruta unificada de reportes
            { from: formData.get('from'), to: formData.get('to') },
            { preserveState: true }
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Compras', href: '/compras/ordenes' },
                { title: 'Reportes', href: '#' },
                { title: 'Análisis de Proveedores', href: '' },
            ]}
        >
            <Head title="Ranking de Proveedores" />

            <div className="flex h-full flex-col bg-background text-foreground">
                {/* --- HEADER STICKY --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-8 py-4 backdrop-blur dark:border-neutral-800">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Gestión de Proveedores (OC)</h1>
                        <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            Ranking de Inversión y Frecuencia
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                VALORES EN SOLES (PEN)
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
                            <span className="opacity-20 text-muted-foreground">|</span>
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
                    <div className="mx-auto max-w-7xl space-y-6">
                        {/* KPI CARDS */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <StatCard
                                title="Socios Comerciales"
                                value={reportData.length.toString()}
                                icon={<Users className="h-4 w-4" />}
                                colorClass="text-blue-500"
                                subtext="Proveedores con OCs en el periodo"
                            />
                            <StatCard
                                title="Partner Principal"
                                value={topSupplier}
                                icon={<Briefcase className="h-4 w-4" />}
                                colorClass="text-emerald-500"
                                subtext="Mayor volumen de compra acumulado"
                            />
                            <StatCard
                                title="Inversión Consolidada"
                                value={`S/ ${totalInvestment.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                                icon={<TrendingUp className="h-4 w-4" />}
                                colorClass="text-orange-500"
                                subtext="Total bruto (Convertido a PEN)"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Gráfico de Distribución */}
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
                                <CardHeader className="border-b dark:border-neutral-800 bg-muted/30">
                                    <CardTitle className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                                        <PieIcon className="h-4 w-4 text-blue-500" /> Distribución de Cartera
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={reportData}
                                                    dataKey="total"
                                                    nameKey="supplier"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={5}
                                                    stroke="none"
                                                >
                                                    {reportData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip
                                                    contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '12px', color: 'white' }}
                                                    formatter={(value: number) => [`S/ ${value.toLocaleString('es-PE')}`, 'Inversión']}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Ranking Table */}
                            <div className="flex flex-col rounded-3xl border border-neutral-200 bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/20">
                                <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">Top Proveedores por Monto</h3>
                                <div className="flex-1 overflow-hidden rounded-2xl border dark:border-neutral-800">
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-neutral-800/50">
                                            <TableRow className="hover:bg-transparent border-none">
                                                <TableHead className="font-bold text-foreground">Proveedor</TableHead>
                                                <TableHead className="text-right font-bold text-foreground">Total Invertido</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.length > 0 ? (
                                                reportData.map((item, idx) => {
                                                    const percentage = totalInvestment > 0 ? (item.total / totalInvestment) * 100 : 0;
                                                    return (
                                                        <TableRow key={idx} className="transition-colors hover:bg-muted/50 dark:border-neutral-800">
                                                            <TableCell className="py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                                    <div>
                                                                        <p className="text-[11px] leading-tight font-black uppercase text-foreground">{item.supplier}</p>
                                                                        <span className="font-mono text-[10px] text-muted-foreground opacity-70">RUC: {item.ruc}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <p className="text-xs font-black tabular-nums text-foreground">
                                                                    S/ {item.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                                </p>
                                                                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted dark:bg-neutral-800">
                                                                    <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${percentage}%` }} />
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow><TableCell colSpan={2} className="h-24 text-center text-muted-foreground italic">No se hallaron registros.</TableCell></TableRow>
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

function StatCard({ title, value, icon, colorClass, subtext }: any) {
    return (
        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:ring-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{title}</CardTitle>
                <div className={`rounded-xl bg-muted/50 p-2 dark:bg-neutral-800 ${colorClass}`}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="truncate text-2xl font-black tracking-tighter tabular-nums">{value}</div>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground opacity-60 italic">{subtext}</p>
            </CardContent>
        </Card>
    );
}
