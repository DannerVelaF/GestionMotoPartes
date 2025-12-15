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
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import productsRoute from '@/routes/products';
import { Head, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Layers,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface Product {
    id_product: number;
    product_name: string;
    product_code: string | null;
    sale_price: string;
    url_image: string | null;
    status: string;
    category?: { name_product_category: string };
    brand?: { name_brand: string };
    product_type?: { name_product_type: string };
    stock: number;
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    products: PaginatedProducts;
    filters: { search?: string; per_page?: string; group_by?: string };
}

const breadcrumbs = [{ title: 'Productos', href: productsRoute.index().url }];

export default function ListProducts({ products, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);

    // CORRECCIÓN: Asegurar valor por defecto válido 'none' si viene null/undefined
    const [groupBy, setGroupBy] = useState<string>(filters.group_by || 'none');

    const [perPage, setPerPage] = useState<string | number>(products.per_page);
    const [isEditingPerPage, setIsEditingPerPage] = useState(false);
    const perPageInputRef = useRef<HTMLInputElement>(null);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            updateParams({ search: debouncedSearch, page: 1 });
        }
    }, [debouncedSearch]);

    // Efecto para actualizar cuando cambia el agrupamiento
    // Usamos useEffect para evitar ciclos infinitos o actualizaciones rápidas
    useEffect(() => {
        const currentFilterGroup = filters.group_by || 'none';
        if (groupBy !== currentFilterGroup) {
            updateParams({
                group_by: groupBy === 'none' ? null : groupBy,
                page: 1,
            });
        }
    }, [groupBy]);

    useEffect(() => {
        if (isEditingPerPage && perPageInputRef.current) {
            perPageInputRef.current.focus();
        }
    }, [isEditingPerPage]);

    const updateParams = (newParams: any) => {
        router.get(
            productsRoute.index().url,
            {
                search: filters.search,
                per_page: products.per_page,
                group_by: filters.group_by,
                ...newParams,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const handlePerPageSubmit = () => {
        setIsEditingPerPage(false);
        let newValue = Number(perPage);
        if (newValue > products.total) newValue = products.total;
        else if (newValue < 1) newValue = 20;
        setPerPage(newValue);
        if (newValue !== products.per_page)
            updateParams({ per_page: newValue, page: 1 });
    };

    const handleKeyDownPerPage = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handlePerPageSubmit();
    };

    const handleCardClick = (product: Product) => {
        router.visit(productsRoute.show({ product: product.id_product }).url);
    };

    const toggleSelection = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((itemId) => itemId !== id)
                : [...prev, id],
        );
    };

    const confirmBulkDelete = () => {
        if (selectedIds.length > 0) setIsDeleteAlertOpen(true);
    };

    const executeBulkDelete = () => {
        router.delete(productsRoute.bulkDelete().url, {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds([]);
                setIsDeleteAlertOpen(false);
            },
            onError: (e) => {
                console.error(e);
                setIsDeleteAlertOpen(false);
            },
        });
    };

    const hidePaginationControls =
        products.total <= products.per_page || products.total === 0;

    // --- Helper para renderizar una tarjeta ---
    const renderProductCard = (product: Product) => {
        const isSelected = selectedIds.includes(product.id_product);
        const isActive = product.status === 'active';

        return (
            <Card
                key={product.id_product}
                onClick={() => handleCardClick(product)}
                className={`group relative flex h-36 cursor-pointer flex-row overflow-hidden p-4 transition-all hover:border-blue-500/50 hover:shadow-md active:scale-[0.99] ${
                    isSelected
                        ? 'border-2 border-blue-600 bg-blue-50/10 dark:bg-blue-900/10'
                        : 'bg-card'
                } ${!isActive ? 'opacity-80 grayscale-[0.3]' : ''}`}
            >
                <div
                    className="absolute top-2 left-2 z-20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                            toggleSelection(product.id_product)
                        }
                        className="h-5 w-5 border-gray-400 bg-white/90 shadow-sm data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:border-gray-600 dark:bg-zinc-900"
                    />
                </div>

                <div className="flex w-36 shrink-0 items-center justify-center py-2">
                    {product.url_image ? (
                        <img
                            src={`/storage/${product.url_image}`}
                            alt={product.product_name}
                            className="h-full w-full object-cover mix-blend-multiply dark:mix-blend-normal"
                            loading="lazy"
                        />
                    ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {product.product_code && (
                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                                        {product.product_code}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {isActive ? (
                                    <span
                                        className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]"
                                        title="Activo"
                                    ></span>
                                ) : (
                                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-red-600 uppercase dark:bg-red-900/30 dark:text-red-400">
                                        Inactivo
                                    </span>
                                )}
                            </div>
                        </div>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <h3 className="line-clamp-2 text-sm leading-snug font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {product.product_name}
                                </h3>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs text-center text-xs">
                                    {product.product_name}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="mt-1 flex flex-col gap-1 border-t pt-2">
                        <div className="flex items-end justify-between">
                            <span className="text-xs text-muted-foreground">
                                Precio:
                            </span>
                            <span className="text-sm font-bold text-foreground">
                                S/ {product.sale_price}
                            </span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-xs text-muted-foreground">
                                Stock:
                            </span>
                            <span
                                className={`text-sm font-bold ${product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
                            >
                                {/* AQUÍ EL CAMBIO: */}
                                {product.stock ?? 0}
                                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                                    Und
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    // --- RENDERIZADO POR GRUPOS ---
    const renderGroupedContent = () => {
        if (products.data.length === 0) {
            return (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground">
                    <Search className="mb-2 h-8 w-8 opacity-50" />
                    <p>No se encontraron productos</p>
                </div>
            );
        }

        if (groupBy === 'none') {
            return (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {products.data.map(renderProductCard)}
                </div>
            );
        }

        const groupedData: Record<string, Product[]> = {};
        products.data.forEach((product) => {
            let key = 'Otros';
            if (groupBy === 'brand')
                key = product.brand?.name_brand || 'Sin Marca';
            else if (groupBy === 'category')
                key =
                    product.category?.name_product_category || 'Sin Categoría';
            else if (groupBy === 'type')
                key = product.product_type?.name_product_type || 'Sin Tipo';
            else if (groupBy === 'status')
                key = product.status === 'active' ? 'Activo' : 'Inactivo';

            if (!groupedData[key]) groupedData[key] = [];
            groupedData[key].push(product);
        });

        return (
            <div className="space-y-8">
                {Object.entries(groupedData).map(
                    ([groupName, groupProducts]) => (
                        <div key={groupName} className="space-y-3">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Layers className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-foreground capitalize">
                                    {groupName}{' '}
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({groupProducts.length})
                                    </span>
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {groupProducts.map(renderProductCard)}
                            </div>
                        </div>
                    ),
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Productos" />

            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Estás absolutamente seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará{' '}
                            <strong>{selectedIds.length}</strong> productos
                            seleccionados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeBulkDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TooltipProvider>
                <div className="flex h-full flex-1 flex-col overflow-hidden bg-muted/10 dark:bg-zinc-950/50">
                    {/* BARRA SUPERIOR */}
                    <div
                        className={`flex items-center justify-between border-b px-6 py-3 transition-colors duration-300 ${selectedIds.length > 0 ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-background'}`}
                    >
                        {selectedIds.length > 0 ? (
                            <div className="flex w-full animate-in items-center justify-between fade-in slide-in-from-top-1">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 rounded-md bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                                        <span className="font-bold">
                                            {selectedIds.length}
                                        </span>
                                        <span className="text-sm font-medium">
                                            seleccionado
                                            {selectedIds.length > 1 ? 's' : ''}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-2 h-4 w-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                                            onClick={() => setSelectedIds([])}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="mx-2 h-6 w-px bg-gray-300" />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={confirmBulkDelete}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />{' '}
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex w-full animate-in items-center justify-between fade-in slide-in-from-bottom-1">
                                <div className="flex items-center gap-4">
                                    <Button
                                        className="bg-blue-700 font-medium text-white shadow-sm hover:bg-blue-800 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
                                        onClick={() =>
                                            router.visit(
                                                productsRoute.create().url,
                                            )
                                        }
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Nuevo
                                    </Button>
                                    <h1 className="hidden text-lg font-semibold text-foreground md:block">
                                        Productos
                                    </h1>
                                </div>

                                <div className="flex flex-1 items-center justify-end gap-4">
                                    {/* SELECTOR AGRUPAR POR */}
                                    <div className="w-40">
                                        <Select
                                            value={groupBy}
                                            onValueChange={(val) =>
                                                setGroupBy(val)
                                            }
                                        >
                                            <SelectTrigger className="h-9 border-muted bg-muted/30 text-xs font-medium">
                                                <SelectValue placeholder="Agrupar por" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    Sin agrupar
                                                </SelectItem>
                                                <SelectItem value="brand">
                                                    Por Marca
                                                </SelectItem>
                                                <SelectItem value="category">
                                                    Por Categoría
                                                </SelectItem>
                                                <SelectItem value="type">
                                                    Por Tipo
                                                </SelectItem>
                                                <SelectItem value="status">
                                                    Por Estado
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="relative w-full max-w-xs md:max-w-xs">
                                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Buscar..."
                                            className="h-9 border-muted bg-muted/30 pl-8 focus-visible:ring-1"
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Paginación */}
                                    <div className="flex items-center gap-2 border-l pl-4 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                                        <span className="flex items-center gap-1">
                                            <span>{products.from || 0}</span>
                                            <span>-</span>
                                            <div
                                                className="relative min-w-[1.5rem] text-center"
                                                onClick={() =>
                                                    setIsEditingPerPage(true)
                                                }
                                            >
                                                {isEditingPerPage ? (
                                                    <input
                                                        ref={perPageInputRef}
                                                        type="number"
                                                        className="h-6 w-12 [appearance:textfield] rounded-sm border border-primary bg-background p-0 text-center text-sm font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                                                        value={perPage}
                                                        onChange={(e) =>
                                                            setPerPage(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onBlur={
                                                            handlePerPageSubmit
                                                        }
                                                        onKeyDown={
                                                            handleKeyDownPerPage
                                                        }
                                                    />
                                                ) : (
                                                    <span
                                                        className="cursor-pointer rounded px-1 font-bold text-foreground transition-colors hover:bg-muted"
                                                        title="Editar cantidad"
                                                    >
                                                        {products.to || 0}
                                                    </span>
                                                )}
                                            </div>
                                            <span>/ {products.total}</span>
                                        </span>
                                        {!hidePaginationControls && (
                                            <div className="ml-2 flex items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 disabled:opacity-30"
                                                    onClick={() =>
                                                        products.prev_page_url &&
                                                        router.visit(
                                                            products.prev_page_url,
                                                        )
                                                    }
                                                    disabled={
                                                        !products.prev_page_url
                                                    }
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 disabled:opacity-30"
                                                    onClick={() =>
                                                        products.next_page_url &&
                                                        router.visit(
                                                            products.next_page_url,
                                                        )
                                                    }
                                                    disabled={
                                                        !products.next_page_url
                                                    }
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {renderGroupedContent()}
                    </div>
                </div>
            </TooltipProvider>
        </AppLayout>
    );
}
