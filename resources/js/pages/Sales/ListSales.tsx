import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from "@/components/ui/button"
import { Head, router } from '@inertiajs/react';
import sales from '@/routes/sales';
import { Input } from '@/components/ui/input';

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
                    <Button variant="outline" onClick={()=> router.visit(sales.create().url)}>Nuevo</Button>
                    <Input type="email" placeholder="Buscar..." />

                </div>
            </div>
        </AppLayout>
    );
}
