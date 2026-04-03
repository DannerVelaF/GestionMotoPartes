<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage; // ✅ Importante
use Illuminate\Notifications\Notification;

class OrderApproved extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;

    /**
     * Recibimos la orden aprobada
     */
    public function __construct($order)
    {
        $this->order = $order;
    }

    /**
     * Definimos los canales: Base de Datos y WebSockets
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Estructura para la tabla 'notifications' de la BD
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title'   => 'Orden Aprobada',
            'message' => "Tu orden {$this->order->po_code} ha sido aprobada.",
            'url'     => "/compras/ordenes/{$this->order->id_purchase_order}",
            'type'    => 'success'
        ];
    }

    /**
     * Estructura para el WebSocket (lo que lee React)
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'title'   => 'Orden Aprobada',
            'message' => "Tu orden {$this->order->po_code} ha sido aprobada.",
            'url'     => "/compras/ordenes/{$this->order->id_purchase_order}",
            'id'      => $this->id, // ID único de la notificación
        ]);
    }
}
