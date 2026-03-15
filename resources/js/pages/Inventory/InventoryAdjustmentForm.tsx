import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { Head, useForm } from '@inertiajs/react'
import { format } from 'date-fns'
import { History, MessageSquare, PackageCheck, Plus, Trash2 } from 'lucide-react'
import { ChangeEvent, useMemo, useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// --- TYPE DEFINITIONS ---
interface Product {
    id_product: number
    product_name: string
    product_code: string
    stock: number
    id_category: number
}

interface Category {
    id_product_category: number
    name_product_category: string
}

interface MovementItem {
    id_product: number
    product_name: string
    product_code: string
    demand: number // Cantidad esperada
    quantity: number // Cantidad recibida/hecha
}

interface Adjustment {
    id_adjustment: number
    reference_code: string
    origin_code?: string
    kardex_date: string
    contact_name: string
    operation_type: string
    document_type: string
    document_number: string
    reason: string
    status: 'draft' | 'done'
    movements: {
        id_movement: number
        id_product: number
        quantity: number // Esto es la 'demanda'
        product: Product
    }[]
}

interface PageProps {
    adjustment: Adjustment
    products: Product[]
    categories: Category[]
}

// --- STYLES ---
const odooInputClass =
    'h-8 border-transparent bg-transparent hover:border-border focus:bg-background focus:ring-1 focus:ring-emerald-500 transition-all'

export default function InventoryAdjustmentForm({
    adjustment,
    products,
    categories,
}: PageProps) {
    const { data, setData, post, processing } = useForm({
        kardex_date:
            adjustment?.kardex_date || format(new Date(), 'yyyy-MM-dd'),
        contact_name: adjustment?.contact_name || '',
        operation_type: adjustment?.operation_type || 'RECEPCIÓN',
        document_type: adjustment?.document_type || 'Factura',
        document_number: adjustment?.document_number || '',
        reason: adjustment?.reason || '',
        items:
            adjustment?.movements?.map((mov) => ({
                id_product: mov.id_product,
                product_name: mov.product.product_name,
                product_code: mov.product.product_code,
                demand: mov.quantity, // La 'quantity' del movimiento es la demanda inicial
                quantity: 0, // La cantidad 'hecha' empieza en 0 o un valor guardado
            })) || [],
    })

    const [isWritingNote, setIsWritingNote] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [productSearch, setProductSearch] = useState('')

    // --- COMPUTED VALUES ---
    const filteredProducts = useMemo(() => {
        if (!selectedCategory) return []
        return products.filter(
            (p) =>
                p.id_category === selectedCategory &&
                !data.items.some((item) => item.id_product === p.id_product),
        )
    }, [selectedCategory, products, data.items])

    // --- HANDLERS ---
    const validate = () => {
        post(`/inventario/ajuste/${adjustment.id_adjustment}/validate`, {
            preserveScroll: true,
            onBefore: () =>
                confirm(
                    '¿Está seguro de que desea validar esta recepción? El stock se actualizará permanentemente.',
                ),
        })
    }

    const handleItemChange = (
        index: number,
        field: keyof MovementItem,
        value: string | number,
    ) => {
        const newItems = [...data.items]
        const item = newItems[index]
        if (typeof item[field] === 'number') {
            ;(item[field] as number) = Number(value)
        } else {
            ;(item[field] as string) = String(value)
        }
        setData('items', newItems)
    }

    const removeItem = (id_product: number) => {
        setData(
            'items',
            data.items.filter((item) => item.id_product !== id_product),
        )
    }

    const addProduct = () => {
        const productToAdd = products.find(
            (p) => p.product_code === productSearch,
        )
        if (productToAdd && !data.items.some(item => item.id_product === productToAdd.id_product)) {
            setData('items', [
                ...data.items,
                {
                    id_product: productToAdd.id_product,
                    product_name: productToAdd.product_name,
                    product_code: productToAdd.product_code,
                    demand: 0, // No hay demanda para items añadidos manualmente
                    quantity: 1, // Por defecto se añade 1
                },
            ])
            setProductSearch('')
        } else {
            alert('Producto no encontrado o ya está en la lista.')
        }
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Inventario', href: '/inventario' },
                {
                    title: adjustment?.reference_code || 'Nuevo Movimiento',
                    href: '#',
                },
            ]}
        >
            <Head title="Movimiento de Almacén" />

            <div className="flex h-full flex-col overflow-hidden bg-background">
                {/* TOOLBAR SUPERIOR */}
                <div className="flex shrink-0 flex-col border-b border-border bg-card shadow-sm">
                    <div className="flex items-center px-6 py-2 text-sm font-medium text-muted-foreground">
                        <span className="text-emerald-600">
                            {adjustment?.reference_code || 'NUEVO'}
                        </span>
                        <span className="mx-2">/</span> Recepción de Mercadería
                    </div>
                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={validate}
                                disabled={processing || adjustment.status === 'done'}
                                className="h-8 bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-700"
                            >
                                Validar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="h-8"
                            >
                                Cancelar
                            </Button>
                        </div>
                        <div className="flex h-8 items-center rounded-sm border border-border bg-muted/30 text-[10px] font-black uppercase">
                            <div
                                className={cn(
                                    'border-r border-border px-4',
                                    adjustment?.status === 'draft'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'opacity-40',
                                )}
                            >
                                Borrador
                            </div>
                            <div
                                className={cn(
                                    'px-4',
                                    adjustment?.status === 'done'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'opacity-40',
                                )}
                            >
                                Realizado
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {/* PANEL IZQUIERDO: FORMULARIO */}
                    <div className="custom-scrollbar flex-1 overflow-y-auto border-r-2 border-border/80">
                        <div className="space-y-8 p-8">
                            <div className="flex items-center gap-3">
                                <PackageCheck className="h-8 w-8 text-emerald-500" />
                                <h1 className="text-3xl font-black tracking-tighter uppercase">
                                    {adjustment?.reference_code || 'BORRADOR'}
                                </h1>
                            </div>

                            {/* CABECERA */}
                            <div className="grid grid-cols-2 gap-x-16 gap-y-2">
                                <div className="space-y-1">
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="w-40 text-sm font-bold text-muted-foreground">
                                            Recibir de:
                                        </span>
                                        <span className="text-sm font-medium">
                                            {data.contact_name}
                                        </span>
                                    </div>
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="w-40 text-sm font-bold text-muted-foreground">
                                            Tipo Operación:
                                        </span>
                                        <span className="text-sm font-medium text-blue-600">
                                            {data.operation_type}
                                        </span>
                                    </div>
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="w-40 text-sm font-bold text-muted-foreground">
                                            Origen:
                                        </span>
                                        <span className="cursor-pointer text-sm font-bold text-emerald-600 underline">
                                            {adjustment?.origin_code}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="w-40 text-sm font-bold text-muted-foreground">
                                            Fecha Planificada:
                                        </span>
                                        <Input
                                            type="date"
                                            value={data.kardex_date}
                                            className={cn(odooInputClass,'w-40')}
                                            onChange={(e) => setData('kardex_date',e.target.value)}
                                        />
                                    </div>
                                    <div className="flex min-h-[32px] items-center">
                                        <span className="w-40 text-sm font-bold text-muted-foreground">
                                            Documento:
                                        </span>
                                        <div className="flex flex-1 gap-2">
                                            <Input
                                                placeholder="Serie"
                                                className={cn(odooInputClass,'w-20')}
                                                value={data.document_type}
                                                onChange={(e) => setData('document_type', e.target.value)}
                                            />
                                            <Input
                                                placeholder="Número"
                                                className={odooInputClass}
                                                value={data.document_number}
                                                onChange={(e) => setData('document_number', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                             {/* SECCIÓN DE AÑADIR PRODUCTOS */}
                             <div className="space-y-4 rounded-md border border-dashed border-border p-4">
                                <h3 className="font-bold text-muted-foreground">Añadir Producto Manualmente</h3>
                                <div className="grid grid-cols-3 items-end gap-4">
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Línea de Producto</label>
                                        <Select
                                            onValueChange={(value) => setSelectedCategory(Number(value))}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Seleccione una categoría" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id_product_category} value={String(cat.id_product_category)}>
                                                        {cat.name_product_category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-2 flex items-end gap-2">
                                        <div className="flex-grow space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Producto</label>
                                            <Input
                                                list="product-list"
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                placeholder="Buscar por código o nombre..."
                                                className="h-9"
                                                disabled={!selectedCategory}
                                            />
                                            <datalist id="product-list">
                                                {filteredProducts.map(p => (
                                                    <option key={p.id_product} value={p.product_code}>
                                                        {p.product_name}
                                                    </option>
                                                ))}
                                            </datalist>
                                        </div>
                                        <Button size="sm" className="h-9" onClick={addProduct} disabled={!productSearch}>
                                            <Plus className="h-4 w-4 mr-2" /> Añadir
                                        </Button>
                                    </div>
                                </div>
                            </div>


                            {/* TABLA DE PRODUCTOS */}
                            <div className="pt-6">
                                <div className="overflow-hidden rounded-sm border border-border bg-card shadow-sm">
                                    <table className="w-full">
                                        <thead className="border-b border-border bg-muted/40">
                                            <tr>
                                                <th className="w-12 px-2 py-3"></th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase">
                                                    Producto
                                                </th>
                                                <th className="w-32 px-4 py-3 text-center text-[10px] font-bold text-muted-foreground uppercase">
                                                    Demanda
                                                </th>
                                                <th className="w-40 px-4 py-3 text-center text-[10px] font-bold text-emerald-600 uppercase">
                                                    Hecho
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {data.items.map(
                                                (item, idx) => (
                                                    <tr
                                                        key={item.id_product}
                                                        className="transition-colors hover:bg-muted/5"
                                                    >
                                                        <td className='px-2'>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeItem(item.id_product)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium">
                                                            {item.product_name}
                                                            <div className="font-mono text-[10px] text-muted-foreground">
                                                                [{item.product_code}]
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-muted-foreground tabular-nums">
                                                            {item.demand}
                                                        </td>
                                                        <td className="bg-emerald-50/20 px-4 py-2">
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-full border-emerald-200 bg-transparent text-center font-black text-emerald-700 focus:ring-emerald-500"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                                                min="0"
                                                            />
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                            {data.items.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                        No hay productos en este movimiento. Añada uno para empezar.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL DERECHO - CHATTER */}
                    <div className="flex h-full w-[380px] shrink-0 flex-col bg-muted/10">
                        <div className="flex items-center justify-between border-b border-border bg-card p-4">
                            <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                <History className="h-3.5 w-3.5" /> Historial
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsWritingNote(!isWritingNote)}
                                className="h-7 text-[10px]"
                            >
                                <MessageSquare className="mr-1 h-3 w-3" /> Nota
                            </Button>
                        </div>
                        {isWritingNote && (
                            <div className="animate-in border-b border-border bg-background p-4 slide-in-from-top-2">
                                <textarea
                                    className="h-24 w-full resize-none rounded-md border border-border p-3 text-sm"
                                    placeholder="Escriba una nota interna..."
                                    autoFocus
                                />
                                <div className="mt-2 flex justify-end">
                                    <Button
                                        size="sm"
                                        className="h-7 bg-emerald-600 text-xs text-white"
                                    >
                                        Guardar nota
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                            {/* Mapeo de logs similar al de EditPurchaseOrder */}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
