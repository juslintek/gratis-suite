#!/bin/bash
set -e

echo "🚀 Gratis Dev Environment Setup"
echo "================================"

cd "$(dirname "$0")"

# Start services
echo "Starting containers..."
docker compose up -d

# Wait for WordPress to be ready
echo "Waiting for WordPress..."
until docker compose exec -T wordpress curl -sf http://localhost/ > /dev/null 2>&1; do
  sleep 2
done

# Install WordPress
echo "Installing WordPress..."
docker compose run --rm wpcli core install \
  --url="http://localhost:8080" \
  --title="Gratis Dev" \
  --admin_user=admin \
  --admin_password=admin \
  --admin_email=dev@gratis.local \
  --skip-email

# Activate theme
echo "Activating gratis-theme..."
docker compose run --rm wpcli theme activate gratis-theme

# Activate plugins
echo "Activating plugins..."
docker compose run --rm wpcli plugin activate cache-manager || true
docker compose run --rm wpcli plugin activate gratis-builder || true

echo ""
echo "✅ Gratis Dev Environment Ready!"
echo "   Site:  http://localhost:8080"
echo "   Admin: http://localhost:8080/wp-admin"
echo "   User:  admin / admin"
echo ""
echo "WP-CLI usage:"
echo "   docker compose run --rm wpcli <command>"
echo "   docker compose run --rm wpcli gratis-cache status"
