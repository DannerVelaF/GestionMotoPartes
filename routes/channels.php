<?php

// routes/channels.php
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    // Agregamos un log para ver si Laravel realmente recibe al usuario
    \Log::info("Validando canal para Usuario: {$user->id} contra ID solicitado: {$id}");
    return (int) $user->id === (int) $id;
});
