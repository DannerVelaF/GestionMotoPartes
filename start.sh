#!/bin/sh
set -e

# Configuración de caché
echo "Caché de configuración..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# --- CORRECCIÓN IMPORTANTE AQUÍ ---
echo "Vinculando Storage..."
# Borramos el enlace viejo si existe para evitar conflictos
rm -rf /var/www/public/storage
# Creamos el enlace nuevo
php artisan storage:link
# ----------------------------------

# Configuración SQLite (Mantén esto igual)
echo "Preparando SQLite..."
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