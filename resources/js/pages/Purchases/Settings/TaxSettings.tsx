import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import {
    Check,
    Edit2,
    Percent,
    Plus,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import purchaseOrders from '@/routes/purchase-orders';

const createInputClass =
    'h-8 border-transparent bg-transparent focus-visible:ring-0 focus-visible:bg-background transition-all font-medium';

export default function TaxSettings({ taxes }: { taxes: any[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);

    // Formulario para crear
    const createForm = useForm({
        name: '',
        percentage: '',
        scope: 'both',
    });

    // Formulario para editar
    const editForm = useForm({
        name: '',
        percentage: '',
        scope: '',
        is_active: true,
    });

    const startEdit = (tax: any) => {
        setEditingId(tax.id_tax);
        editForm.setData({
            name: tax.name,
            percentage: tax.percentage.toString(),
            scope: tax.scope,
            is_active: !!tax.is_active,
        });
    };

    const submitCreate = () => {
        createForm.post('/compras/configuracion/impuestos', {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const submitEdit = (id: number) => {
        editForm.put(`/compras/configuracion/impuestos/${id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    const getScopeBadge = (scope: string) => {
        const styles: any = {
            purchase:
                'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
            sale: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
            both: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
        };
        const labels: any = {
            purchase: 'COMPRAS',
            sale: 'VENTAS',
            both: 'AMBOS',
        };
        return (
            <span
                className={cn(
                    'rounded px-2 py-0.5 text-[9px] font-black',
                    styles[scope],
                )}
            >
                {labels[scope]}
            </span>
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                {title: "Compras", href: purchaseOrders.index.url()},
                { title: 'Configuración', href: '#' },
                { title: 'Impuestos', href: '#' },
            ]}
        >
            <Head title="Configuración de Impuestos" />

            <div className="flex h-full flex-col bg-background p-8">
                <div className="mx-auto w-full max-w-4xl space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="rounded-lg bg-muted p-2">
                            <Percent className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase">
                                Impuestos y Tasas
                            </h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                Define los cargos aplicables a compras y ventas
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border bg-card shadow-md">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="text-[10px] font-black uppercase">
                                    <TableHead className="px-6">
                                        Nombre del Impuesto
                                    </TableHead>
                                    <TableHead className="w-24 text-center">
                                        Tasa (%)
                                    </TableHead>
                                    <TableHead className="w-32 text-center">
                                        Ámbito
                                    </TableHead>
                                    <TableHead className="w-24 pr-6 text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {taxes.map((tax) => (
                                    <TableRow
                                        key={tax.id_tax}
                                        className="group border-b border-border/50"
                                    >
                                        {editingId === tax.id_tax ? (
                                            <>
                                                <TableCell className="px-6 py-2">
                                                    <Input
                                                        className={
                                                            createInputClass
                                                        }
                                                        value={
                                                            editForm.data.name
                                                        }
                                                        onChange={(e) =>
                                                            editForm.setData(
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Input
                                                        type="number"
                                                        className={cn(
                                                            createInputClass,
                                                            'text-center',
                                                        )}
                                                        value={
                                                            editForm.data
                                                                .percentage
                                                        }
                                                        onChange={(e) =>
                                                            editForm.setData(
                                                                'percentage',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Select
                                                        value={
                                                            editForm.data.scope
                                                        }
                                                        onValueChange={(v) =>
                                                            editForm.setData(
                                                                'scope',
                                                                v,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 border-transparent text-[10px] font-bold uppercase">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="purchase">
                                                                Compras
                                                            </SelectItem>
                                                            <SelectItem value="sale">
                                                                Ventas
                                                            </SelectItem>
                                                            <SelectItem value="both">
                                                                Ambos
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-emerald-500"
                                                            onClick={() =>
                                                                submitEdit(
                                                                    tax.id_tax,
                                                                )
                                                            }
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground"
                                                            onClick={() =>
                                                                setEditingId(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell className="px-6 py-3 text-sm font-bold">
                                                    <div className="flex items-center gap-2">
                                                        {!tax.is_active && (
                                                            <X className="h-3 w-3 text-red-500" />
                                                        )}
                                                        {tax.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-bold text-blue-600">
                                                    {tax.percentage}%
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {getScopeBadge(tax.scope)}
                                                </TableCell>
                                                <TableCell className="pr-6 text-right opacity-0 transition-opacity group-hover:opacity-100">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-blue-500"
                                                            onClick={() =>
                                                                startEdit(tax)
                                                            }
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-500"
                                                            onClick={() =>
                                                                router.delete(
                                                                    `/config/taxes/${tax.id_tax}`,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                ))}

                                {/* FILA DE CREACIÓN RÁPIDA */}
                                <TableRow className="border-t-2 border-emerald-500/20 bg-emerald-500/5">
                                    <TableCell className="px-6 py-2">
                                        <Input
                                            placeholder="Nuevo impuesto (ej. Percepción 2%)..."
                                            className={cn(
                                                createInputClass,
                                                'text-emerald-700 placeholder:italic',
                                            )}
                                            value={createForm.data.name}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className={cn(
                                                createInputClass,
                                                'text-center text-emerald-700',
                                            )}
                                            value={createForm.data.percentage}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'percentage',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <Select
                                            value={createForm.data.scope}
                                            onValueChange={(v) =>
                                                createForm.setData('scope', v)
                                            }
                                        >
                                            <SelectTrigger className="h-8 border-transparent text-[10px] font-bold text-emerald-700 uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="purchase">
                                                    Compras
                                                </SelectItem>
                                                <SelectItem value="sale">
                                                    Ventas
                                                </SelectItem>
                                                <SelectItem value="both">
                                                    Ambos
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <Button
                                            size="sm"
                                            className="h-8 w-8 rounded-full bg-emerald-600 shadow-lg transition-all hover:bg-emerald-700 active:scale-90"
                                            onClick={submitCreate}
                                            disabled={
                                                !createForm.data.name ||
                                                !createForm.data.percentage
                                            }
                                        >
                                            <Plus className="h-4 w-4 text-white" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <div className="text-[11px] leading-relaxed font-bold text-blue-800 uppercase dark:text-blue-300">
                            <p>
                                Los impuestos configurados aquí se utilizarán
                                para calcular los totales en las Órdenes de
                                Compra y Facturas. Asegúrese de que el ámbito
                                coincida con el tipo de documento para que
                                aparezcan en las listas de selección.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
