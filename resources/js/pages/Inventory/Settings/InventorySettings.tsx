import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    Building2,
    Check,
    CheckCircle2,
    Edit2,
    MapPin,
    Package,
    Plus,
    RefreshCcw,
    Repeat,
    Settings2,
    SlidersHorizontal,
    Trash2,
    Truck,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// --- COMPONENTE DE ALERTA ---
function FloatingAlert({
    message,
    type = 'error',
}: {
    message?: any;
    type?: 'error' | 'success';
}) {
    if (!message) return null;
    const isSuccess = type === 'success';

    let displayMessage = '';
    if (typeof message === 'string') {
        displayMessage = message;
    } else if (typeof message === 'object' && message !== null) {
        const firstValue = Object.values(message)[0];
        if (typeof firstValue === 'string') {
            displayMessage = firstValue;
        } else if (Array.isArray(firstValue)) {
            displayMessage = firstValue[0] || '';
        }
    }

    if (!displayMessage.trim()) return null;

    return (
        <div className="pointer-events-none fixed top-6 right-6 z-[100] w-auto max-w-md animate-in fade-in slide-in-from-top-2">
            <Alert
                variant={isSuccess ? 'default' : 'destructive'}
                className={cn(
                    'pointer-events-auto border-2 shadow-xl',
                    isSuccess
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100'
                        : 'border-red-500 bg-white text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100',
                )}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2 font-bold">
                    {isSuccess ? '¡Éxito!' : 'Atención'}
                </AlertTitle>
                <AlertDescription className="ml-2 whitespace-pre-wrap">
                    {displayMessage}
                </AlertDescription>
            </Alert>
        </div>
    );
}

export default function InventorySettings({ locations, operationTypes }: any) {
    const { props } = usePage<any>();

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{
        url: string;
        id: string | number;
    } | null>(null);

    // --- ESTADOS PARA EDICIÓN INLINE ---
    const [editingLocId, setEditingLocId] = useState<number | string | null>(
        null,
    );
    const [editingOpId, setEditingOpId] = useState<number | string | null>(
        null,
    );

    useEffect(() => {
        let msgToSet: string | null = null;
        let isError = false;

        if (props.errors && Object.keys(props.errors).length > 0) {
            const firstErrorKey = Object.keys(props.errors)[0];
            msgToSet = props.errors[firstErrorKey];
            isError = true;
        } else if (props.flash?.error) {
            msgToSet = props.flash.error;
            isError = true;
        } else if (props.flash?.success) {
            msgToSet = props.flash.success;
            isError = false;
        }

        if (msgToSet) {
            if (isError) {
                setErrorMessage(msgToSet);
            } else {
                setSuccessMessage(msgToSet);
            }

            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setErrorMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [props.errors, props.flash]);

    // Formularios de Creación
    const locForm = useForm({ name: '', type: 'internal' });
    const opForm = useForm({
        name: '',
        code: 'IN',
        sequence_prefix: 'WH/IN/',
        default_location_source_id: '',
        default_location_destination_id: '',
    });

    // Formularios de Edición
    const editLocForm = useForm({ name: '', type: '' });
    const editOpForm = useForm({
        name: '',
        code: '',
        sequence_prefix: '',
        default_location_source_id: '',
        default_location_destination_id: '',
    });

    // --- MÉTODOS DE CREACIÓN ---
    const submitLocation = () => {
        locForm.post('/inventario/config/locations', {
            preserveScroll: true,
            onSuccess: () => locForm.reset(),
        });
    };

    const submitOpType = () => {
        opForm.post('/inventario/config/operation-types', {
            preserveScroll: true,
            onSuccess: () => opForm.reset(),
            onError: () => {
                if (Object.keys(opForm.errors).length > 0) {
                    setErrorMessage(
                        'Revise que los campos obligatorios estén completos y no haya duplicados.',
                    );
                }
            },
        });
    };

    // --- MÉTODOS DE EDICIÓN ---
    const startEditLoc = (loc: any) => {
        setEditingLocId(loc.id_location);
        editLocForm.setData({
            name: loc.name,
            type: loc.type,
        });
    };

    const cancelEditLoc = () => {
        setEditingLocId(null);
        editLocForm.reset();
    };

    const submitEditLoc = (id: number | string) => {
        editLocForm.put(`/inventario/config/locations/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingLocId(null);
                setSuccessMessage('Ubicación actualizada correctamente.');
            },
        });
    };

    const startEditOp = (op: any) => {
        setEditingOpId(op.id_operation_type);
        editOpForm.setData({
            name: op.name,
            code: op.code,
            sequence_prefix: op.sequence_prefix,
            default_location_source_id:
                op.default_location_source_id?.toString() || '',
            default_location_destination_id:
                op.default_location_destination_id?.toString() || '',
        });
    };

    const cancelEditOp = () => {
        setEditingOpId(null);
        editOpForm.reset();
    };

    const submitEditOp = (id: number | string) => {
        editOpForm.put(`/inventario/config/operation-types/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingOpId(null);
                setSuccessMessage('Operación actualizada correctamente.');
            },
        });
    };

    const handleCodeChange = (newCode: string, isEdit = false) => {
        if (isEdit) {
            editOpForm.setData((prev) => ({
                ...prev,
                code: newCode,
                sequence_prefix: `WH/${newCode}/`,
            }));
        } else {
            opForm.setData((prev) => ({
                ...prev,
                code: newCode,
                sequence_prefix: `WH/${newCode}/`,
            }));
        }
    };

    // --- ELIMINACIÓN ---
    const confirmDelete = (url: string, id: number | string) => {
        setItemToDelete({ url, id });
        setDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (!itemToDelete) return;
        router.delete(`${itemToDelete.url}/${itemToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModalOpen(false);
                setItemToDelete(null);
            },
            onError: () => {
                setDeleteModalOpen(false);
                setItemToDelete(null);
            },
        });
    };

    const createInputClass =
        'h-8 border-transparent bg-transparent focus-visible:ring-0 focus-visible:bg-background transition-all font-medium';

    const isOpFormIncomplete =
        !opForm.data.name ||
        !opForm.data.default_location_source_id ||
        !opForm.data.default_location_destination_id ||
        !opForm.data.sequence_prefix;

    const isEditOpFormIncomplete =
        !editOpForm.data.name ||
        !editOpForm.data.default_location_source_id ||
        !editOpForm.data.default_location_destination_id ||
        !editOpForm.data.sequence_prefix;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Inventario', href: '/inventario' },
                { title: 'Configuracion', href: '#' },
            ]}
        >
            <Head title="Configuración de Almacenes" />

            <FloatingAlert message={errorMessage} type="error" />
            <FloatingAlert message={successMessage} type="success" />

            <AlertDialog
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Estás completamente seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará
                            permanentemente este registro de la base de datos de
                            configuración de inventario.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setItemToDelete(null)}
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex h-full flex-col overflow-hidden bg-background">
                <div className="flex items-center justify-between border-b bg-card px-8 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                            <Settings2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase">
                                Configuración
                            </h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                Control de Almacenes
                            </p>
                        </div>
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
                    <Tabs
                        defaultValue="locations"
                        className="mx-auto max-w-6xl space-y-8"
                    >
                        <TabsList className="h-11 w-[350px] border bg-muted/50 p-1">
                            <TabsTrigger
                                value="locations"
                                className="flex-1 gap-2 text-xs font-bold tracking-widest uppercase data-[state=active]:bg-background"
                            >
                                <MapPin className="h-3.5 w-3.5" /> Ubicaciones
                            </TabsTrigger>
                            <TabsTrigger
                                value="operation_types"
                                className="flex-1 gap-2 text-xs font-bold tracking-widest uppercase data-[state=active]:bg-background"
                            >
                                <Repeat className="h-3.5 w-3.5" /> Operaciones
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="locations">
                            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
                                <Table>
                                    <TableHeader className="bg-muted/30 tracking-tighter uppercase">
                                        <TableRow className="border-none hover:bg-transparent">
                                            <TableHead className="px-6 text-[10px] font-black">
                                                Nombre
                                            </TableHead>
                                            <TableHead className="text-[10px] font-black">
                                                Tipo
                                            </TableHead>
                                            <TableHead className="w-24"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {locations.map((loc: any) => (
                                            <TableRow
                                                key={loc.id_location}
                                                className="group border-b border-border/50 transition-colors"
                                            >
                                                {editingLocId ===
                                                loc.id_location ? (
                                                    // --- FILA EN MODO EDICIÓN (LOCATIONS) ---
                                                    <>
                                                        <TableCell className="px-6 py-2">
                                                            <Input
                                                                className={
                                                                    createInputClass
                                                                }
                                                                value={
                                                                    editLocForm
                                                                        .data
                                                                        .name
                                                                }
                                                                onChange={(e) =>
                                                                    editLocForm.setData(
                                                                        'name',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <Select
                                                                value={
                                                                    editLocForm
                                                                        .data
                                                                        .type
                                                                }
                                                                onValueChange={(
                                                                    v,
                                                                ) =>
                                                                    editLocForm.setData(
                                                                        'type',
                                                                        v,
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="h-8 border-transparent bg-transparent text-xs font-bold uppercase">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem
                                                                        value="internal"
                                                                        className="text-xs uppercase"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Package className="h-3 w-3" />{' '}
                                                                            Stock
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="supplier"
                                                                        className="text-xs uppercase"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Truck className="h-3 w-3" />{' '}
                                                                            Proveedor
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="customer"
                                                                        className="text-xs uppercase"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Building2 className="h-3 w-3" />{' '}
                                                                            Cliente
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="inventory"
                                                                        className="text-xs uppercase"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <SlidersHorizontal className="h-3 w-3" />{' '}
                                                                            Ajuste
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="loss"
                                                                        className="text-xs uppercase"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Trash2 className="h-3 w-3" />{' '}
                                                                            Desecho
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                                                                    onClick={() =>
                                                                        submitEditLoc(
                                                                            loc.id_location,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        editLocForm.processing ||
                                                                        !editLocForm
                                                                            .data
                                                                            .name
                                                                    }
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                                                    onClick={
                                                                        cancelEditLoc
                                                                    }
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    // --- FILA NORMAL (LOCATIONS) ---
                                                    <>
                                                        <TableCell className="px-6 py-3 text-sm font-semibold">
                                                            {loc.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="rounded-md border bg-muted px-2 py-0.5 text-[9px] font-bold uppercase">
                                                                {loc.type}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right">
                                                            <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-blue-500"
                                                                    onClick={() =>
                                                                        startEditLoc(
                                                                            loc,
                                                                        )
                                                                    }
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-red-500"
                                                                    onClick={() =>
                                                                        confirmDelete(
                                                                            '/inventario/config/locations',
                                                                            loc.id_location,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))}
                                        {/* --- FILA NUEVA UBICACIÓN --- */}
                                        <TableRow className="border-t-2 border-emerald-500/20 bg-emerald-500/5">
                                            <TableCell className="px-6">
                                                <Input
                                                    placeholder="Nueva ubicación..."
                                                    className={cn(
                                                        createInputClass,
                                                        'font-bold text-emerald-700',
                                                    )}
                                                    value={locForm.data.name}
                                                    onChange={(e) =>
                                                        locForm.setData(
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={locForm.data.type}
                                                    onValueChange={(v) =>
                                                        locForm.setData(
                                                            'type',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 border-transparent bg-transparent text-xs font-bold uppercase">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="internal"
                                                            className="text-xs uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Package className="h-3 w-3" />{' '}
                                                                Stock
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="supplier"
                                                            className="text-xs uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Truck className="h-3 w-3" />{' '}
                                                                Proveedor
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="customer"
                                                            className="text-xs uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-3 w-3" />{' '}
                                                                Cliente
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="inventory"
                                                            className="text-xs uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <SlidersHorizontal className="h-3 w-3" />{' '}
                                                                Ajuste
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="loss"
                                                            className="text-xs uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Trash2 className="h-3 w-3" />{' '}
                                                                Desecho
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <Button
                                                    onClick={submitLocation}
                                                    disabled={
                                                        locForm.processing ||
                                                        !locForm.data.name
                                                    }
                                                    size="sm"
                                                    className="h-8 w-8 rounded-full bg-emerald-600 shadow-lg transition-all hover:bg-emerald-700 active:scale-90"
                                                >
                                                    <Plus className="h-4 w-4 text-white" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="operation_types">
                            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
                                <Table>
                                    <TableHeader className="bg-muted/30 tracking-tighter uppercase">
                                        <TableRow className="border-none hover:bg-transparent">
                                            <TableHead className="px-6 text-[10px] font-black">
                                                Nombre
                                            </TableHead>
                                            <TableHead className="text-[10px] font-black">
                                                Código
                                            </TableHead>
                                            <TableHead className="text-[10px] font-black">
                                                Prefijo
                                            </TableHead>
                                            <TableHead className="text-center text-[10px] font-black">
                                                Trayectoria (DE → PARA)
                                            </TableHead>
                                            <TableHead className="w-24"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {operationTypes.map((op: any) => (
                                            <TableRow
                                                key={op.id_operation_type}
                                                className="group border-b border-border/50 transition-colors"
                                            >
                                                {editingOpId ===
                                                op.id_operation_type ? (
                                                    // --- FILA EN MODO EDICIÓN (OPERACIONES) ---
                                                    <>
                                                        <TableCell className="px-6 py-2">
                                                            <Input
                                                                className={
                                                                    createInputClass
                                                                }
                                                                value={
                                                                    editOpForm
                                                                        .data
                                                                        .name
                                                                }
                                                                onChange={(e) =>
                                                                    editOpForm.setData(
                                                                        'name',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <Select
                                                                value={
                                                                    editOpForm
                                                                        .data
                                                                        .code
                                                                }
                                                                onValueChange={(
                                                                    v,
                                                                ) =>
                                                                    handleCodeChange(
                                                                        v,
                                                                        true,
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="h-8 border-transparent bg-transparent text-xs font-black text-blue-600">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem
                                                                        value="IN"
                                                                        className="text-[10px] font-black uppercase"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <ArrowDownLeft className="h-3.5 w-3.5" />{' '}
                                                                            IN
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="OUT"
                                                                        className="text-[10px] font-black uppercase"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <ArrowUpRight className="h-3.5 w-3.5" />{' '}
                                                                            OUT
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="INT"
                                                                        className="text-[10px] font-black uppercase"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <RefreshCcw className="h-3.5 w-3.5" />{' '}
                                                                            INT
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="ADJ"
                                                                        className="text-[10px] font-black uppercase"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <SlidersHorizontal className="h-3.5 w-3.5" />{' '}
                                                                            ADJ
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <Input
                                                                className={cn(
                                                                    createInputClass,
                                                                    'w-24 bg-transparent font-mono text-[10px] font-bold tracking-widest',
                                                                )}
                                                                value={
                                                                    editOpForm
                                                                        .data
                                                                        .sequence_prefix
                                                                }
                                                                onChange={(e) =>
                                                                    editOpForm.setData(
                                                                        'sequence_prefix',
                                                                        e.target.value.toUpperCase(),
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Select
                                                                    value={
                                                                        editOpForm
                                                                            .data
                                                                            .default_location_source_id
                                                                    }
                                                                    onValueChange={(
                                                                        v,
                                                                    ) =>
                                                                        editOpForm.setData(
                                                                            'default_location_source_id',
                                                                            v,
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-8 w-[110px] border-transparent bg-transparent text-[9px] font-black uppercase">
                                                                        <SelectValue placeholder="ORIGEN" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {locations.map(
                                                                            (
                                                                                l: any,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        l.id_location
                                                                                    }
                                                                                    value={l.id_location.toString()}
                                                                                    className="text-[10px] font-bold uppercase"
                                                                                >
                                                                                    {
                                                                                        l.name
                                                                                    }
                                                                                </SelectItem>
                                                                            ),
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                                <ArrowRight className="h-2.5 w-2.5 text-blue-500 opacity-40" />
                                                                <Select
                                                                    value={
                                                                        editOpForm
                                                                            .data
                                                                            .default_location_destination_id
                                                                    }
                                                                    onValueChange={(
                                                                        v,
                                                                    ) =>
                                                                        editOpForm.setData(
                                                                            'default_location_destination_id',
                                                                            v,
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-8 w-[110px] border-transparent bg-transparent text-[9px] font-black uppercase">
                                                                        <SelectValue placeholder="DESTINO" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {locations.map(
                                                                            (
                                                                                l: any,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        l.id_location
                                                                                    }
                                                                                    value={l.id_location.toString()}
                                                                                    className="text-[10px] font-bold uppercase"
                                                                                >
                                                                                    {
                                                                                        l.name
                                                                                    }
                                                                                </SelectItem>
                                                                            ),
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                                                                    onClick={() =>
                                                                        submitEditOp(
                                                                            op.id_operation_type,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        editOpForm.processing ||
                                                                        isEditOpFormIncomplete
                                                                    }
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                                                    onClick={
                                                                        cancelEditOp
                                                                    }
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    // --- FILA NORMAL (OPERACIONES) ---
                                                    <>
                                                        <TableCell className="px-6 py-3 text-sm font-bold">
                                                            {op.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <code className="rounded border bg-muted px-1.5 py-0.5 text-xs font-black text-blue-600">
                                                                {op.code}
                                                            </code>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-[10px] tracking-widest opacity-70">
                                                            {op.sequence_prefix}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-center gap-2 text-[10px] font-black tracking-tighter uppercase opacity-80">
                                                                <span>
                                                                    {op
                                                                        .default_source
                                                                        ?.name ||
                                                                        '—'}
                                                                </span>
                                                                <ArrowRight className="h-3 w-3 text-blue-500" />
                                                                <span>
                                                                    {op
                                                                        .default_destination
                                                                        ?.name ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right">
                                                            <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-blue-500"
                                                                    onClick={() =>
                                                                        startEditOp(
                                                                            op,
                                                                        )
                                                                    }
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-red-500"
                                                                    onClick={() =>
                                                                        confirmDelete(
                                                                            '/inventario/config/operation-types',
                                                                            op.id_operation_type,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))}
                                        {/* --- FILA NUEVA OPERACIÓN --- */}
                                        <TableRow className="border-t-2 border-blue-500/20 bg-blue-500/5">
                                            <TableCell className="px-6 italic">
                                                <Input
                                                    placeholder="Ej: Recepción..."
                                                    className={cn(
                                                        createInputClass,
                                                        'font-bold text-blue-600',
                                                    )}
                                                    value={opForm.data.name}
                                                    onChange={(e) =>
                                                        opForm.setData(
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={opForm.data.code}
                                                    onValueChange={(v) =>
                                                        handleCodeChange(
                                                            v,
                                                            false,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 border-transparent bg-transparent text-xs font-black text-blue-600">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="IN"
                                                            className="text-[10px] font-black uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ArrowDownLeft className="h-3.5 w-3.5" />{' '}
                                                                IN
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="OUT"
                                                            className="text-[10px] font-black uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ArrowUpRight className="h-3.5 w-3.5" />{' '}
                                                                OUT
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="INT"
                                                            className="text-[10px] font-black uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <RefreshCcw className="h-3.5 w-3.5" />{' '}
                                                                INT
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="ADJ"
                                                            className="text-[10px] font-black uppercase"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <SlidersHorizontal className="h-3.5 w-3.5" />{' '}
                                                                ADJ
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    placeholder="Ej: WH/IN/"
                                                    className={cn(
                                                        createInputClass,
                                                        'w-24 bg-transparent font-mono text-[10px] font-bold tracking-widest',
                                                    )}
                                                    value={
                                                        opForm.data
                                                            .sequence_prefix
                                                    }
                                                    onChange={(e) =>
                                                        opForm.setData(
                                                            'sequence_prefix',
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Select
                                                        value={
                                                            opForm.data
                                                                .default_location_source_id
                                                        }
                                                        onValueChange={(v) =>
                                                            opForm.setData(
                                                                'default_location_source_id',
                                                                v,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-[110px] border-transparent bg-transparent text-[9px] font-black uppercase">
                                                            <SelectValue placeholder="ORIGEN" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {locations.map(
                                                                (l: any) => (
                                                                    <SelectItem
                                                                        key={
                                                                            l.id_location
                                                                        }
                                                                        value={l.id_location.toString()}
                                                                        className="text-[10px] font-bold uppercase"
                                                                    >
                                                                        {l.name}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <ArrowRight className="h-2.5 w-2.5 text-blue-500 opacity-40" />
                                                    <Select
                                                        value={
                                                            opForm.data
                                                                .default_location_destination_id
                                                        }
                                                        onValueChange={(v) =>
                                                            opForm.setData(
                                                                'default_location_destination_id',
                                                                v,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-[110px] border-transparent bg-transparent text-[9px] font-black uppercase">
                                                            <SelectValue placeholder="DESTINO" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {locations.map(
                                                                (l: any) => (
                                                                    <SelectItem
                                                                        key={
                                                                            l.id_location
                                                                        }
                                                                        value={l.id_location.toString()}
                                                                        className="text-[10px] font-bold uppercase"
                                                                    >
                                                                        {l.name}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <Button
                                                    onClick={submitOpType}
                                                    disabled={
                                                        opForm.processing ||
                                                        isOpFormIncomplete
                                                    }
                                                    size="sm"
                                                    className="h-8 w-8 rounded-full bg-blue-600 shadow-lg transition-all hover:bg-blue-700 active:scale-90"
                                                >
                                                    <Plus className="h-4 w-4 text-white" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
