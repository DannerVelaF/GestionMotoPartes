import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from "@/components/ui/button"
import { Head, router } from '@inertiajs/react';
import sales from '@/routes/sales';
import productsRoute from '@/routes/products';
import { Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ventas',
        href: sales.index().url,
    },
];


export default function LIstSales()
{
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ventas" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button
                        className="bg-blue-700 font-medium text-white shadow-sm hover:bg-blue-800 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
                        onClick={() =>
                            router.visit(
                                sales.create().url,
                            )
                        }
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nuevo
                    </Button>
                    <h1 className="hidden text-lg font-semibold text-foreground md:block">
                        Ventas
                    </h1>
                </div>
            </div>
        </AppLayout>
    );
}
