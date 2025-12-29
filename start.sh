#!/bin/sh
set -e

# Configuración
echo "Caché de configuración..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# --- AGREGAR ESTA LÍNEA ---
echo "Creando enlace simbólico de Storage..."
php artisan storage:link
# --------------------------

# Base de datos SQLite (Tu código anterior)
if [ ! -f /var/www/database/database.sqlite ]; then
    touch /var/www/database/database.sqlite
fi
chmod 666 /var/www/database/database.sqlite
chmod 775 /var/www/database

echo "Ejecutando migraciones..."
php artisan migrate --force

echo "Iniciando Nginx..."
nginx
echo "Iniciando PHP-FPM..."
php-fpm