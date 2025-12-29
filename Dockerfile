FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip \
    libpq-dev libzip-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring bcmath gd zip

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

RUN composer install --no-dev --optimize-autoloader
RUN npm install --legacy-peer-deps
RUN npm run build

RUN chmod -R 775 storage bootstrap/cache

COPY start.sh /var/www/start.sh
RUN chmod +x /var/www/start.sh

ENTRYPOINT ["/var/www/start.sh"]
