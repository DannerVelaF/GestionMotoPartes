<?php

namespace App\Notifications;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class OrderPendingApproval extends Notification implements ShouldQueue
{
    use Queueable;

    public $order;

    public function __construct($order)
    {
        $this->order = $order;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        Log::info("Id de la orden: " . $this->order->id_purchase_order);
        return [
            'title' => 'Nueva Orden Pendiente',
            'message' => "La orden {$this->order->po_code} espera tu aprobación.",
            'url' => "/compras/ordenes/{$this->order->id_purchase_order}",
            'type' => 'order_pending'
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'title' => 'Nueva Orden Pendiente',
            'message' => "La orden {$this->order->po_code} espera tu aprobación.",
            'url' => "/compras/ordenes/{$this->order->id_purchase_order}",
            'type' => 'order_pending'
        ]);
    }

    public function broadcastOn()
    {
        // Esto define el canal privado: App.Models.User.1, App.Models.User.2, etc.
        return new PrivateChannel('App.Models.User.' . $this->order->id_user);

        // NOTA: Si 'id_user' no es el ID del administrador que debe recibirla,
        // asegúrate de que sea el ID correcto del destinatario.
    }
}
