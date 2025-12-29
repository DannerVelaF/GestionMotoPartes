# 1. Usar imagen base de PHP 8.3
FROM php:8.3-fpm

# 2. Instalar dependencias del sistema y Nginx
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nginx \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip

# 3. Instalar Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 4. Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Configurar directorio de trabajo
WORKDIR /var/www

# 6. Copiar archivos del proyecto
COPY . .

# 7. Instalar dependencias de PHP
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# 8. Instalar dependencias de JS y compilar (Vite/React)
RUN npm install --legacy-peer-deps
RUN npm run build


# 9. Configurar permisos de Laravel
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache /var/www/database
RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache /var/www/database

# 10. Copiar configuración de Nginx
COPY ./nginx.conf /etc/nginx/sites-available/default
COPY ./custom.ini /usr/local/etc/php/conf.d/custom.ini

# 11. Copiar script de arranque
COPY ./start.sh /var/www/start.sh
RUN chmod +x /var/www/start.sh

# 12. Exponer el puerto
EXPOSE 80

# 13. Comando de inicio
ENTRYPOINT ["/var/www/start.sh"]