# Gratis Suite — WP-CLI Command Reference

## cache-manager

```bash
# Status & diagnostics
wp gratis-cache status              # Environment, backends, today's stats, extensions
wp gratis-cache debug-url <url>     # Full cache layer diagnostic for a URL
wp gratis-cache bench               # Benchmark all available backends
wp gratis-cache bench --iterations=5000

# Cache operations
wp gratis-cache purge               # Purge all cache layers
wp gratis-cache purge-url <url>     # Purge specific URL
wp gratis-cache purge-url <url> --reason=deploy

# Object cache drop-in
wp gratis-cache dropin status       # Check object-cache.php status
wp gratis-cache dropin install      # Install Redis object-cache.php
wp gratis-cache dropin remove       # Remove object-cache.php

# File monitoring
wp gratis-cache scan-files          # Detect changed files since last scan
wp gratis-cache scan-files --dir=/path/to/watch

# History
wp gratis-cache history tail        # Show recent cache + file events

# Performance (free — WP Rocket charges $59/yr)
wp gratis-cache critical-css        # Generate critical CSS for homepage
wp gratis-cache critical-css <url>  # Generate for specific URL
wp gratis-cache optimize-db         # Clean revisions, transients, spam, trash
wp gratis-cache optimize-db --dry-run
wp gratis-cache optimize-images     # Convert JPEG/PNG to WebP (local, no API)
wp gratis-cache optimize-images --limit=200

# Legacy (vlt-cache)
wp vlt-cache status                 # Redis/OPcache/Nginx/Elementor status
wp vlt-cache purge                  # Purge all
wp vlt-cache purge --type=redis     # Purge specific layer
wp vlt-cache stats                  # Today's hit/miss statistics
```

## gratis-backup

```bash
# Backup operations
wp gratis-backup run                # Full backup (database + uploads + themes + plugins)
wp gratis-backup run --type=database    # Database only
wp gratis-backup run --type=uploads     # Uploads only
wp gratis-backup run --type=themes      # Themes only
wp gratis-backup run --type=plugins     # Plugins only

# Management
wp gratis-backup list               # List all backups with size and date
wp gratis-backup status             # Show destination, writable status, backup count
```

## gratis-ai

```bash
# Configuration
wp gratis-ai status                 # Show provider, endpoint, model, availability
wp gratis-ai configure --endpoint=http://localhost:11434/v1 --model=llama3
wp gratis-ai configure --endpoint=https://api.openai.com/v1 --api-key=sk-... --model=gpt-4o-mini

# Usage
wp gratis-ai ask "Why is my cache hit ratio low?"
wp gratis-ai ask "Explain this error" --model=gpt-4o
wp gratis-ai analyze               # AI analysis of site health + cache stats
```

## gratis-db

```bash
# Status & scanning
wp gratis-db status                 # SQLite availability, current DB, migration readiness
wp gratis-db scan                   # Scan plugins/themes for SQLite compatibility
wp gratis-db plan                   # Show migration plan (dry-run)
```

## gratis-fleet

```bash
# Fleet management
wp gratis-fleet key                 # Show this site's fleet API key
wp gratis-fleet add <url> <key>     # Add a site to the fleet
wp gratis-fleet list                # List all fleet sites
wp gratis-fleet status              # Check status of all sites
wp gratis-fleet update-all          # Update plugins across all sites
wp gratis-fleet purge-all           # Purge cache across all sites

# Security (free — ManageWP charges $1/site/mo)
wp gratis-fleet security            # Run security scan on this site

# SEO (free — ManageWP charges $1/site/mo)
wp gratis-fleet seo                 # Full site SEO audit
wp gratis-fleet seo <url>           # Audit specific URL

# Uptime (free — ManageWP charges $1/site/mo)
wp gratis-fleet uptime              # Check uptime of all fleet sites
```

## REST API (cache-manager)

All endpoints require `manage_options` capability.

```
GET  /wp-json/gratis-cache/v1/status    # Capabilities, backends, debug meta
GET  /wp-json/gratis-cache/v1/stats     # Today's hit ratio, requests, purges
POST /wp-json/gratis-cache/v1/purge     # Purge all cache layers
```

## Quick Start

```bash
# Install everything
wp plugin install cache-manager --activate
wp theme activate gratis-theme
wp plugin activate gratis-builder gratis-backup gratis-ai gratis-db

# Set up Redis object cache
wp gratis-cache dropin install

# Verify
wp gratis-cache status
wp gratis-cache bench

# First backup
wp gratis-backup run --type=database

# Configure AI (optional)
wp gratis-ai configure --endpoint=http://localhost:11434/v1 --model=llama3
```
