#!/bin/sh

# Salir si hay error
set -e

# 1. Configurar Laravel
echo "Caché de configuración..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 2. CONFIGURACIÓN SQLITE AUTOMÁTICA
echo "Preparando SQLite..."
# Si el archivo no existe, lo creamos
if [ ! -f /var/www/database/database.sqlite ]; then
    touch /var/www/database/database.sqlite
fi

# Damos permisos totales al archivo (necesario para que www-data escriba)
chmod 666 /var/www/database/database.sqlite
# SQLite necesita escribir en la carpeta también (para archivos temporales)
chmod 775 /var/www/database

# 3. Ejecutar migraciones (Para crear las tablas user, roles, etc.)
echo "Ejecutando migraciones..."
php artisan migrate --force

# 4. Iniciar Nginx y PHP
echo "Iniciando Nginx..."
nginx
echo "Iniciando PHP-FPM..."
php-fpm