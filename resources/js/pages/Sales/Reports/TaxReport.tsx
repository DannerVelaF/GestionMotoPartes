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
    ArrowLeft,
    Calendar,
    Download,
    Filter,
    Percent,
    FileText,
    Calculator,
    PieChart
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import reports from '@/routes/reports';
import sales from '@/routes/sales';

interface TaxItem {
    document_type: string;
    base_imponible: string | number;
    igv: string | number;
    total: string | number;
}

interface Props {
    reportData: TaxItem[];
    filters: { from: string; to: string };
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#6366f1'];

export default function TaxReport({
    reportData = [],
    filters = { from: '', to: '' },
}: Props) {
    // Totales generales
    const totals = reportData.reduce(
        (acc, item) => ({
            base: acc.base + Number(item.base_imponible),
            igv: acc.igv + Number(item.igv),
            total: acc.total + Number(item.total),
        }),
        { base: 0, igv: 0, total: 0 },
    );

    const documentNames: Record<string, string> = {
        factura: 'Facturas',
        boleta: 'Boletas',
        nota_venta: 'Notas de Venta',
    };

    const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            reports.tax().url,
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
                { title: 'Libro de Ventas / IGV', href: '' },
            ]}
        >
            <Head title="Reporte de Impuestos" />

            <div className="flex h-full flex-col bg-slate-50/50">
                {/* --- HEADER --- */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-8 py-4 shadow-sm">
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
                                Libro de Ventas e Impuestos
                            </h1>
                            <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">
                                Resumen de IGV y Base Imponible
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
                            className="border-slate-200 font-bold"
                        >
                            <Download className="mr-2 h-3.5 w-3.5" /> SUNAT
                            (CSV)
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    <div className="mx-auto max-w-7xl space-y-8">
                        {/* --- KPI CARDS --- */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Total Base Imponible
                                    </CardTitle>
                                    <Calculator className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                                        S/{' '}
                                        {totals.base.toLocaleString('es-PE', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                                        Monto neto sin impuestos
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        IGV Recaudado (18%)
                                    </CardTitle>
                                    <Percent className="h-4 w-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                                        S/{' '}
                                        {totals.igv.toLocaleString('es-PE', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                    <p className="mt-1 text-[10px] font-bold text-emerald-600">
                                        Débito fiscal generado
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-none bg-blue-600 text-white shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-blue-100 uppercase">
                                        Total Comprobantes
                                    </CardTitle>
                                    <FileText className="h-4 w-4 text-blue-100" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black tabular-nums">
                                        S/{' '}
                                        {totals.total.toLocaleString('es-PE', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                    <p className="text-opacity-80 mt-1 text-[10px] font-medium text-blue-100">
                                        Suma total incluyendo impuestos
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* --- CHART Y TABLA --- */}
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Gráfico de Barras por Documento */}
                            <Card className="overflow-hidden rounded-3xl border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <PieChart className="h-4 w-4 text-blue-600" />{' '}
                                        Distribución por Documento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={reportData}
                                                layout="vertical"
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    horizontal={true}
                                                    vertical={false}
                                                    stroke="#f1f5f9"
                                                />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="document_type"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(val) =>
                                                        documentNames[val] ||
                                                        val
                                                    }
                                                    tick={{
                                                        fontSize: 11,
                                                        fontWeight: '600',
                                                        fill: '#64748b',
                                                    }}
                                                    width={100}
                                                />
                                                <ChartTooltip
                                                    cursor={{ fill: '#f8fafc' }}
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
                                                <Bar
                                                    dataKey="total"
                                                    radius={[0, 4, 4, 0]}
                                                    barSize={30}
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
                                                            />
                                                        ),
                                                    )}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Detalle en Tabla */}
                            <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-sm font-bold tracking-tight text-slate-900 uppercase">
                                    Detalle Contable
                                </h3>
                                <div className="flex-1 overflow-hidden rounded-xl border border-slate-100">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-bold text-slate-700">
                                                    Documento
                                                </TableHead>
                                                <TableHead className="text-right font-bold text-slate-700">
                                                    Base Imp.
                                                </TableHead>
                                                <TableHead className="text-right font-bold text-slate-700">
                                                    IGV (18%)
                                                </TableHead>
                                                <TableHead className="text-right font-bold text-slate-700">
                                                    Total
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
                                                        <TableCell className="text-xs font-bold text-slate-800 uppercase">
                                                            {documentNames[
                                                                item
                                                                    .document_type
                                                            ] ||
                                                                item.document_type}
                                                        </TableCell>
                                                        <TableCell className="text-right text-slate-600 tabular-nums">
                                                            {Number(
                                                                item.base_imponible,
                                                            ).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-emerald-600 tabular-nums">
                                                            {Number(
                                                                item.igv,
                                                            ).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-black text-slate-900 tabular-nums">
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
                                                        colSpan={4}
                                                        className="h-24 text-center font-medium text-slate-400"
                                                    >
                                                        No hay datos contables
                                                        disponibles.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                                    <p className="text-[10px] leading-relaxed font-medium text-blue-700">
                                        * Cálculos basados en una tasa
                                        impositiva del 18%. Los montos se
                                        redondean a dos decimales para fines de
                                        visualización.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
