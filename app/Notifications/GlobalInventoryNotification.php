<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class GlobalInventoryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $title;
    protected $message;
    protected $url;
    protected $type;

    /**
     * @param string $title Título de la notificación
     * @param string $message Cuerpo del mensaje
     * @param string $url Link a donde redirigir al hacer clic
     * @param string $type Categoría (purchase, sale, inventory)
     */
    public function __construct($title, $message, $url = '#', $type = 'inventory')
    {
        $this->title = $title;
        $this->message = $message;
        $this->url = $url;
        $this->type = $type;
    }

    /**
     * Determinamos por dónde se envía: DB para persistencia, Broadcast para tiempo real.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Lo que se guardará en la tabla 'notifications' de la base de datos.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title'   => $this->title,
            'message' => $this->message,
            'url'     => $this->url,
            'type'    => $this->type,
        ];
    }

    /**
     * Lo que se enviará vía WebSockets (Reverb/Pusher) al frontend.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'title'   => $this->title,
            'message' => $this->message,
            'url'     => $this->url,
            'type'    => $this->type,
            'time'    => now()->diffForHumans(), // Para mostrar "hace 2 min" en el momento
        ]);
    }
}
