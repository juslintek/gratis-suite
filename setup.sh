#!/bin/bash
set -e

echo "🚀 Gratis Dev Environment Setup"
echo "================================"

cd "$(dirname "$0")"

# Start services
echo "Starting containers..."
docker compose up -d

PORT="${PORT:-8080}"

# Wait for WordPress to be ready (200, 301 canonical redirect, or 302 to install.php)
echo "Waiting for WordPress..."
ready=0
for _ in $(seq 1 30); do
  code=$(docker compose exec -T wordpress curl -sS -o /dev/null -w "%{http_code}" -H "Host: localhost:${PORT}" http://localhost/ 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    ready=1
    break
  fi
  sleep 2
done
if [ "$ready" -ne 1 ]; then
  echo "ERROR: WordPress did not become ready within 60s (last HTTP status: ${code})" >&2
  exit 1
fi

wp_exec() {
  docker compose exec -T wordpress wp --allow-root --path=/app/public "$@"
}

# Install WordPress (idempotent)
if ! wp_exec core is-installed >/dev/null 2>&1; then
  echo "Installing WordPress..."
  wp_exec core install \
    --url="http://localhost:${PORT}" \
    --title="Gratis Dev" \
    --admin_user=admin \
    --admin_password=admin \
    --admin_email=dev@gratis.local \
    --skip-email
else
  echo "WordPress already installed — skipping core install."
fi

# Activate theme
echo "Activating gratis-theme..."
wp_exec theme activate gratis-theme

# Activate core plugins
echo "Activating plugins..."
wp_exec plugin activate gratis-cache gratis-builder

echo ""
echo "✅ Gratis Dev Environment Ready!"
echo "   Site:  http://localhost:${PORT}"
echo "   Admin: http://localhost:${PORT}/wp-admin"
echo "   User:  admin / admin"
echo ""
echo "WP-CLI usage:"
echo "   docker compose exec wordpress wp --allow-root <command>"
echo "   docker compose exec wordpress wp --allow-root gratis-cache status"
