import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import productsRoute from '@/routes/products/index';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Check,
    DollarSign,
    Package,
    ShoppingBag,
    TrendingDown,
    TrendingUp,
    TriangleAlert,
    Trophy,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface Props {
    stats: {
        total_sales: string;
        total_purchases: string;
        margin: string;
        margin_raw: number;
        active_users: number;
        low_stock: number;
    };
    chartData: any[];
    recentMovements: any[];
    topProducts: any[];
}

export default function Dashboard({
    stats,
    chartData,
    recentMovements,
    topProducts,
}: Props) {
    const isLoss = stats.margin_raw < 0;

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Panel de Control" />

            <div className="flex h-full flex-1 animate-in flex-col gap-6 bg-background p-6 duration-700 fade-in">
                {/* --- SECCIÓN DE ALERTA --- */}
                {isLoss && (
                    <div className="flex animate-pulse items-center gap-4 rounded-2xl border-2 border-red-500/20 bg-red-50/50 p-4 dark:bg-red-950/20">
                        <div className="rounded-full bg-red-500 p-2 text-white">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-red-800 uppercase dark:text-red-400">
                                Alerta de Margen Negativo
                            </h4>
                            <p className="text-xs font-medium text-red-700/80 dark:text-red-300/60">
                                Los egresos superan a los ingresos por S/{' '}
                                {Math.abs(stats.margin_raw).toLocaleString()}.
                            </p>
                        </div>
                    </div>
                )}

                {/* --- KPI CARDS --- */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        title="Ventas"
                        value={`S/ ${stats.total_sales}`}
                        icon={<DollarSign className="text-emerald-500" />}
                        description="Ventas brutas"
                    />
                    <StatCard
                        title="Compras"
                        value={`S/ ${stats.total_purchases}`}
                        icon={<ShoppingBag className="text-orange-500" />}
                        description="Inversión total"
                    />
                    <StatCard
                        title="Utilidad"
                        value={`S/ ${stats.margin}`}
                        icon={
                            isLoss ? (
                                <TrendingDown className="text-red-500" />
                            ) : (
                                <TrendingUp className="text-emerald-500" />
                            )
                        }
                        description="Balance neto"
                        highlight={isLoss}
                    />
                    <StatCard
                        title="Equipo"
                        value={stats.active_users.toString()}
                        icon={<Users className="text-blue-500" />}
                        description="Usuarios en sistema"
                    />
                    <StatCard
                        title="Stock"
                        value={stats.low_stock.toString()}
                        icon={<Package className="text-red-500" />}
                        description="Items críticos"
                        highlight={stats.low_stock > 0}
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-7">
                    {/* GRÁFICO (4 COLUMNAS) */}
                    <Card className="border-none shadow-sm md:col-span-4 dark:bg-neutral-900/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                <TrendingUp className="h-4 w-4 text-blue-600" />{' '}
                                Ventas vs Compras
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient
                                            id="colorSales"
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
                                        <linearGradient
                                            id="colorPurchases"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#f97316"
                                                stopOpacity={0.1}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#f97316"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        opacity={0.1}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [
                                            `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                                            '', // El segundo parámetro es el nombre, lo dejamos vacío para usar el name de la Area
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#000',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            color: '#fff',
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            paddingTop: '20px',
                                        }}
                                    />
                                    <Area
                                        name="Ventas"
                                        type="monotone"
                                        dataKey="ventas"
                                        stroke="#2563eb"
                                        fill="url(#colorSales)"
                                        strokeWidth={3}
                                    />
                                    <Area
                                        name="Compras"
                                        type="monotone"
                                        dataKey="compras"
                                        stroke="#f97316"
                                        fill="url(#colorPurchases)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* DERECHA: SALUD Y TOP 5 (3 COLUMNAS) */}
                    <div className="flex flex-col gap-6 md:col-span-3">
                        {/* Tarjeta Salud */}
                        <Card className="border-none shadow-sm dark:bg-neutral-900/50">
                            <CardHeader>
                                <CardTitle className="text-xs font-black tracking-widest uppercase">
                                    Salud del Negocio
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                        <span>Eficiencia Operativa</span>
                                        <span>
                                            {isLoss ? 'Bajo' : 'Óptimo'}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={cn(
                                                'h-full transition-all',
                                                isLoss
                                                    ? 'bg-red-500'
                                                    : 'bg-emerald-500',
                                            )}
                                            style={{
                                                width: isLoss ? '30%' : '85%',
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-dashed p-3">
                                    <p className="text-[11px] leading-relaxed font-medium text-muted-foreground">
                                        {isLoss ? (
                                            <span className="inline-flex items-center">
                                                <TriangleAlert className="mr-1 h-3 w-3 text-red-500" />
                                                Atención: Los costos son altos.
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center">
                                                <Check className="mr-1 h-3 w-3 text-emerald-500" />
                                                Buen desempeño actual.
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tarjeta Top 5 (CORREGIDA) */}
                        <Card className="flex-1 border-none shadow-sm dark:bg-neutral-900/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                    <Trophy className="h-4 w-4 text-amber-500" />{' '}
                                    Top 5 Productos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {topProducts.map((prod, i) => (
                                    <div
                                        key={i}
                                        onClick={() =>
                                            router.visit(
                                                productsRoute.show({
                                                    product: prod.id_product,
                                                }).url,
                                            )
                                        }
                                        className="group flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex flex-col">
                                            <span className="max-w-[150px] truncate text-xs font-bold transition-colors group-hover:text-blue-600">
                                                {prod.product_name}
                                            </span>
                                            <span className="font-mono text-[9px] text-muted-foreground uppercase">
                                                Rank #{i + 1}
                                            </span>
                                        </div>
                                        <div className="rounded-lg bg-muted px-2 py-1 text-[10px] font-black uppercase tabular-nums">
                                            {prod.sold} uds
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* --- AUDITORÍA (FULL WIDTH) --- */}
                <Card className="border-none shadow-sm dark:bg-neutral-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                            <Activity className="h-4 w-4 text-blue-500" />{' '}
                            Auditoría de Inventario
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentMovements.map((move, i) => {
                                const isEntry = move.type === 'purchase';
                                const displayQuantity = Math.abs(move.quantity);
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between rounded-lg border-b border-border px-2 pb-3 transition-all last:border-0 hover:bg-muted/40"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={cn(
                                                    'rounded-lg p-2',
                                                    isEntry
                                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                                                        : 'bg-red-50 text-red-600 dark:bg-red-500/10',
                                                )}
                                            >
                                                {isEntry ? (
                                                    <ArrowUpRight className="h-4 w-4" />
                                                ) : (
                                                    <ArrowDownRight className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-sm font-bold text-foreground">
                                                        {move.product_name}
                                                    </p>
                                                    <span className="text-[10px] font-medium text-muted-foreground/80 tabular-nums">
                                                        {format(
                                                            new Date(
                                                                move.created_at,
                                                            ),
                                                            'dd/MM/yyyy HH:mm',
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    {move.reference_label}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={cn(
                                                'text-sm font-black tabular-nums',
                                                isEntry
                                                    ? 'text-emerald-600'
                                                    : 'text-red-600',
                                            )}
                                        >
                                            {isEntry ? '+' : '-'}
                                            {displayQuantity.toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon, description, highlight = false }: any) {
    return (
        <Card
            className={cn(
                'border-none shadow-sm transition-all',
                highlight
                    ? 'bg-red-50 ring-2 ring-red-500/50 dark:bg-red-950/20'
                    : 'bg-white dark:bg-neutral-900/50',
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    {title}
                </CardTitle>
                <div className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black tracking-tighter tabular-nums">
                    {value}
                </div>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground italic">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}
