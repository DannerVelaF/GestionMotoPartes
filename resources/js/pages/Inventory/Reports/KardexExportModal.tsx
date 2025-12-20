// resources/js/Pages/Inventory/Components/KardexExportModal.tsx
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import inventoryRoutes from '@/routes/inventory';
import { FileSpreadsheet, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { InventoryItem } from '../Columns';

interface Props {
    allProducts: InventoryItem[]; // Pasamos la lista de productos disponibles
}

export function KardexExportModal({ allProducts }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [exportAll, setExportAll] = useState(true);
    const [selectedProducts, setSelectedProducts] = useState<InventoryItem[]>(
        [],
    );
    const [pickerSearch, setPickerSearch] = useState('');

    // Escuchador de evento global
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-kardex-modal', handleOpen);
        return () =>
            window.removeEventListener('open-kardex-modal', handleOpen);
    }, []);

    const handleDownload = () => {
        const params = new URLSearchParams();
        if (exportAll) {
            params.append('all', 'true');
        } else {
            selectedProducts.forEach((p) =>
                params.append('ids[]', p.id_product.toString()),
            );
        }

        window.open(
            `${inventoryRoutes.kardex.export().url}?${params.toString()}`,
        );
        setIsOpen(false);
    };

    const filteredPicker = allProducts.filter(
        (p) =>
            p.product_name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
            p.product_code.toLowerCase().includes(pickerSearch.toLowerCase()),
    );

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-700">
                            <FileSpreadsheet className="h-5 w-5" />
                            Kardex Valorizado
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-3 rounded-md border bg-muted/20 p-4">
                            <Checkbox
                                id="all"
                                checked={exportAll}
                                onCheckedChange={(v) => setExportAll(!!v)}
                            />
                            <Label
                                htmlFor="all"
                                className="cursor-pointer font-bold"
                            >
                                Exportar todos los productos
                            </Label>
                        </div>

                        {!exportAll && (
                            <div className="animate-in space-y-2 fade-in slide-in-from-top-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">
                                        Seleccionados
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 border-blue-200 text-blue-600"
                                        onClick={() =>
                                            setIsProductPickerOpen(true)
                                        }
                                    >
                                        <Plus className="mr-1 h-3 w-3" /> Añadir
                                    </Button>
                                </div>
                                <ScrollArea className="h-32 rounded border bg-background p-2">
                                    {selectedProducts.map((p) => (
                                        <div
                                            key={p.id_product}
                                            className="mb-1 flex items-center justify-between rounded bg-muted/40 p-1 text-xs"
                                        >
                                            <span className="truncate">
                                                {p.product_name}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 text-red-500"
                                                onClick={() =>
                                                    setSelectedProducts(
                                                        (prev) =>
                                                            prev.filter(
                                                                (x) =>
                                                                    x.id_product !==
                                                                    p.id_product,
                                                            ),
                                                    )
                                                }
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                        >
                            Cerrar
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleDownload}
                            disabled={
                                !exportAll && selectedProducts.length === 0
                            }
                        >
                            Generar Excel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Secundario: Picker */}
            <Dialog
                open={isProductPickerOpen}
                onOpenChange={setIsProductPickerOpen}
            >
                <DialogContent className="flex h-[60vh] flex-col sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-sm">
                            Seleccionar Producto
                        </DialogTitle>
                    </DialogHeader>
                    <div className="relative my-2">
                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="h-9 pl-8"
                            value={pickerSearch}
                            onChange={(e) => setPickerSearch(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="flex-1 rounded border">
                        {filteredPicker.map((p) => (
                            <div
                                key={p.id_product}
                                className="cursor-pointer border-b p-3 text-sm last:border-0 hover:bg-muted"
                                onClick={() => {
                                    if (
                                        !selectedProducts.find(
                                            (x) =>
                                                x.id_product === p.id_product,
                                        )
                                    )
                                        setSelectedProducts([
                                            ...selectedProducts,
                                            p,
                                        ]);
                                    setIsProductPickerOpen(false);
                                }}
                            >
                                <p className="font-semibold">
                                    {p.product_name}
                                </p>
                                <p className="font-mono text-[10px] text-muted-foreground">
                                    {p.product_code}
                                </p>
                            </div>
                        ))}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}
