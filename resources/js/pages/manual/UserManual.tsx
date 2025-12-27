import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BookText, HelpCircle, Truck } from 'lucide-react';
import manual from '@/routes/manual';
import { router } from '@inertiajs/react';

export default function UserManual() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Manual de Uso', href: '#' }]}>
            <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-black tracking-tight">
                        Centro de Ayuda
                    </h1>
                    <p className="text-muted-foreground">
                        Guía rápida para operar el sistema de gestión.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Guía de Compras */}
                    <Card
                        className="cursor-pointer transition-colors hover:border-blue-500"
                        onClick={() => router.visit(manual.comprobantes())}
                    >
                        <CardHeader>
                            <BookText className="mb-2 h-8 w-8 text-blue-600" />
                            <CardTitle className="text-lg">Comprobantes</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Aprende a registrar facturas, subir adjuntos y
                            gestionar fechas de ingreso.
                        </CardContent>
                    </Card>
                    {/* ... Repetir para Ventas e Inventario */}
                </div>

                <div className="space-y-6">
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                        <HelpCircle className="h-5 w-5 text-blue-600" />{' '}
                        Preguntas Frecuentes
                    </h2>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full rounded-xl border bg-card px-6"
                    >
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-sm font-bold">
                                ¿Por qué el saldo de mi producto no coincide?
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                                El sistema calcula el saldo según la{' '}
                                <strong>Fecha Kardex</strong>. Asegúrate de que
                                las compras tengan la fecha y hora real en que
                                llegó la mercadería.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-sm font-bold">
                                ¿Cómo anulo una venta mal registrada?
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                                Debes ir al detalle de la venta y presionar
                                "Anular". Esto generará un movimiento de ajuste
                                automático en el inventario.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </AppLayout>
    );
}
