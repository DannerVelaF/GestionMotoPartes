#!/bin/sh
set -e

php artisan config:clear
php artisan route:clear
php artisan view:clear

php artisan config:cache
php artisan route:cache
php artisan view:cache

php artisan storage:link || true

if [ ! -f /var/www/database/database.sqlite ]; then
    touch /var/www/database/database.sqlite
fi

php artisan migrate --force

# 🔴 ESTO ES CLAVE
php artisan serve --host=0.0.0.0 --port=$PORT
