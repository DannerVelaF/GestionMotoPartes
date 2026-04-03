<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class OrderPendingApproval extends Notification implements ShouldQueue, ShouldBroadcast
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
            'type' => 'order_pending',
            'id' => $this->id,
        ]);
    }
}
