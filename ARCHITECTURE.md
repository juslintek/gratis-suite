# Gratis Suite — Architecture

## Storage Layer

### Interfaces

```
StorageInterface
├── VolatileCacheBackendInterface    (hot cache: Redis, Memcached, APCu)
├── PersistentStoreInterface         (durable: SQLite WAL, file segments, JSONL)
├── TraceStoreInterface              (append-only event/trace logs)
└── FileChangeStoreInterface         (filesystem change tracking)

SerializerInterface
├── PhpSerializeSerializer           (fallback, always available)
├── JsonSerializer                   (debug/export, always available)
├── IgbinarySerializer               (if ext-igbinary)
├── MsgpackSerializer                (if ext-msgpack)
└── SimdJsonPlusSerializer           (if awesome/simdjson_plus)

CacheInvalidationInterface
└── CacheDependencyMapperInterface   (tracks what depends on what)

BackupSourceInterface                (stream-first backup adapters)
ExtensionCapabilityDetectorInterface (runtime capability detection)
```

### Backend Selection (auto)

```
Priority for volatile cache:
1. Redis (if ext-redis + connection works)
2. Memcached (if ext-memcached + connection works)
3. APCu (if ext-apcu + CLI-safe)
4. RuntimeArrayStore (always, per-request only)

Priority for persistent store:
1. SQLite WAL (if ext-sqlite3, best for local metadata)
2. DBA/LMDB (if ext-dba + lmdb handler)
3. FileSegmentStore (always works, chunked files)
4. JSONL (append-only, simplest)

Priority for serialization:
1. Igbinary (fastest, smallest)
2. Msgpack (fast, portable)
3. PHP serialize (fallback)
```

### Rules

- Redis/Memcached = optional hot volatile cache ONLY
- Persistent data (traces, history, file changes, backup metadata) NEVER depends on Redis
- SQLite WAL = preferred local persistent store (lighter than MySQL for plugin internals)
- MySQL = never required for cache-manager internals
- RocksDB = experimental only, disabled by default

## Extension Detection

Detected at runtime, never assumed:

| Extension | Used For |
|-----------|----------|
| ext-json | Always available (PHP 8+) |
| ext-sqlite3 | Local persistent store |
| ext-dba + lmdb | Alternative persistent store |
| ext-redis | Volatile cache backend |
| ext-memcached | Volatile cache backend |
| ext-igbinary | Fast serialization |
| ext-msgpack | Portable serialization |
| ext-inotify | Real-time file change detection |
| ext-ffi | Experimental (disabled by default) |
| awesome/simdjson_plus | Fast JSON parsing |
| awesome/simdutf | Fast UTF validation |

## Cache Namespaces

### Theme
- `theme` — compiled theme data
- `theme.json` — parsed theme.json
- `global-styles` — computed global styles
- `patterns` — registered patterns
- `templates` — FSE templates
- `template-parts` — FSE template parts
- `assets` — CSS/JS/font manifests
- `fonts` — font file metadata

### Builder
- `builder` — builder state
- `builder-artifacts` — generated output
- `generated-patterns` — AI/programmatic patterns
- `generated-templates` — AI/programmatic templates
- `generated-assets` — compiled CSS/JS
- `preview-cache` — editor previews

## WP-CLI Commands

```bash
wp gratis-cache status          # Show backends, capabilities, health
wp gratis-cache bench           # Benchmark available backends
wp gratis-cache purge           # Purge all cache layers
wp gratis-cache purge-url <url> # Purge specific URL across all layers
wp gratis-cache debug-url <url> # Show all cache state for a URL
wp gratis-cache scan-files      # Detect changed files since last scan
wp gratis-cache history tail    # Show recent cache events
```

## Backup Architecture

Stream-first, never loads full backup into memory:

```
BackupSourceInterface
├── DatabaseSource (mysqldump streaming)
├── UploadsSource (file tree streaming)
├── ThemeSource
├── PluginSource
├── BuilderArtifactSource
└── ChangedFilesSource (since last backup)

BackupDestinationInterface
├── LocalFilesystem
├── SFTP
├── SSH/rsync
├── S3Compatible
├── GoogleDrive
└── Dropbox
```

## AI Module

Optional, free core works without it:

```
GratisAI
├── ModelProviderInterface
│   ├── OpenAICompatible (any endpoint)
│   ├── LocalModel (Ollama, llama.cpp)
│   └── HostedModel (future managed service)
├── AssistantInterface
│   ├── SiteHealthExplainer
│   ├── CacheRecommender
│   ├── PerformanceAnalyzer
│   ├── BackupGuidance
│   └── BuilderAssistant
└── AdminUI (non-invasive panel)
```
