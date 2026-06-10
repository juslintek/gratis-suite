FROM wordpress:7-php8.3-apache

# libvips runtime + CLI tools (php-vips uses libvips via PHP's bundled FFI)
RUN apt-get update && apt-get install -y --no-install-recommends libvips-tools \
    && rm -rf /var/lib/apt/lists/*

# Install PIE (the official PHP Installer for Extensions)
RUN curl -fsSL https://github.com/php/pie/releases/latest/download/pie.phar -o /usr/local/bin/pie \
    && chmod +x /usr/local/bin/pie

# Install every PHP extension declared in composer.json via PIE
COPY composer.json /usr/src/gratis/composer.json
RUN for ext in $(php -r '$r=json_decode(file_get_contents("/usr/src/gratis/composer.json"),true)["require"]??[];echo implode(" ",array_keys($r));'); do \
        pie install "$ext"; \
    done
