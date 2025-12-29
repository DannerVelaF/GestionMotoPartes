#!/bin/sh

# Salir si hay error
set -e

# Caché de configuración (Opcional, recomendado para prod)
echo "Caché de configuración..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones (Opcional: Descomenta si tienes BD conectada en Render)
# echo "Ejecutando migraciones..."
# php artisan migrate --force

# Iniciar Nginx en segundo plano
echo "Iniciando Nginx..."
nginx

# Iniciar PHP-FPM (Esto mantiene el contenedor vivo)
echo "Iniciando PHP-FPM..."
php-fpm