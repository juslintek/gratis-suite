# Gratis — Free WordPress Performance & Builder Suite

> Everything premium themes and plugins charge for. Forever free.

A powerful free WordPress suite where premium-level performance, cache management, theme tooling, builder tooling, diagnostics, backups, and AI-assisted management are available for free by default.

## 🗺️ Repository Map

| Repository | Purpose | Status |
|-----------|---------|--------|
| [cache-manager](https://github.com/juslintek/cache-manager) | Performance, cache, tracing, storage engine | Active |
| [gratis-theme](https://github.com/juslintek/gratis-theme) | Free block/FSE theme system | Active |
| [gratis-builder](https://github.com/juslintek/gratis-builder) | Free visual builder, patterns, AI REST API | Active |
| [gratis-backup](https://github.com/juslintek/gratis-backup) | Stream-first backup/restore engine | Skeleton |
| [gratis-db](https://github.com/juslintek/gratis-db) | Optional SQLite WordPress DB mode | Skeleton |
| [gratis-ai](https://github.com/juslintek/gratis-ai) | Optional AI assistance (BYOM / hosted) | Skeleton |
| [gratis-suite](https://github.com/juslintek/gratis-suite) | This repo — ecosystem docs & coordination | Active |

## 🎯 Principles

1. **Free by default** — Nothing useful is locked behind a paywall
2. **Progressive enhancement** — Detect capabilities, never assume them
3. **Lightweight** — Minimal CPU/memory footprint, shared hosting compatible
4. **Developer-grade** — WP-CLI commands, REST APIs, MCP integration
5. **Non-invasive** — Never silently replace MySQL, never auto-install extensions

## 💰 Monetization (Future)

Paid features may only cover hosted infrastructure costs:
- Hosted AI model usage
- Managed backup storage
- Managed uptime/performance monitoring
- Priority support & team dashboards

> "I built this to be free and useful. Some optional hosted services cost real server resources, so they have a price tag to cover those costs and help keep development sustainable."

## 🏗️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.

## 📋 Getting Started

```bash
# Install the core cache manager
wp plugin install cache-manager --activate

# Install the theme
wp theme install gratis-theme --activate

# Install the builder
wp plugin install gratis-builder --activate

# Check system capabilities
wp gratis-cache status
```

## License

Individual repositories have their own licenses. Core plugins are GPL-2.0-or-later.
