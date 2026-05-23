# Gratis Ecosystem — Strategy Execution Plan

> Companion to MONETIZATION_RESEARCH.md — this document covers tactical execution.

## Current State (May 2026)

### What's Built & Working
| Component | Status | WordPress.org Ready? |
|-----------|--------|---------------------|
| cache-manager | Production-grade, WP-CLI, tracing, multi-backend | ✅ Yes (already public) |
| gratis-theme | FSE theme, 35 patterns, theme.json, templates | ✅ Nearly (needs review) |
| gratis-builder | Patterns, AI REST API, block tools | ⚠️ Needs polish |
| gratis-backup | Skeleton (interfaces + architecture) | ❌ Not yet |
| gratis-db | Skeleton (README only) | ❌ Not yet |
| gratis-ai | Skeleton (README only) | ❌ Not yet |
| gratis-suite | Docker dev env, docs, architecture | N/A (umbrella) |

### Technical Capabilities Verified
- PHP 8.3 + WordPress 6.7 running locally
- SQLite persistent store available
- 89.7% cache hit ratio out of the box
- 35 block patterns registered from theme
- WP-CLI commands: status, purge, purge-url, debug-url, scan-files, history
- Live volume mounting for instant dev iteration

---

## Immediate Priorities (Next 2 Weeks)

### 1. cache-manager → WordPress.org Submission
- [ ] Remove Redis-specific Lithuanian strings from CacheCommand.php
- [ ] Add `readme.txt` in WordPress.org format
- [ ] Ensure no external HTTP calls on activation
- [ ] Add screenshots for plugin directory
- [ ] Run Plugin Check (PCP) tool
- [ ] Submit to wordpress.org/plugins/

### 2. gratis-theme → WordPress.org Submission
- [ ] Run Theme Check plugin
- [ ] Ensure all patterns have proper `Title` and `Categories` headers
- [ ] Add theme screenshot (1200x900)
- [ ] Verify accessibility (color contrast, keyboard nav)
- [ ] Submit to wordpress.org/themes/

### 3. gratis-builder Polish
- [ ] Document the AI REST API endpoints
- [ ] Add pattern preview capability
- [ ] Ensure it works standalone (without cache-manager)
- [ ] Add readme.txt

---

## Competitive Moat Analysis

### Why Users Would Choose Gratis Over Alternatives

| User Need | Current Best Free | Gratis Advantage |
|-----------|------------------|-----------------|
| Page cache | LiteSpeed Cache (server-tied) | Works on ANY server |
| Object cache | Redis Object Cache (basic) | Auto-detects best backend |
| Performance tracing | None free | Full request tracing |
| Backup | UpdraftPlus (limited cloud) | Unlimited local, any destination |
| Block theme | Twenty Twenty-Five | Developer-grade + 35 patterns |
| AI assistance | None free (BYOM) | Full BYOM + local models |
| SQLite | Official plugin (basic) | Migration tools + safety |
| All-in-one | Jetpack ($300/yr for full) | Everything free, no lock-in |

### Key Insight
No single competitor offers cache + theme + builder + backup + AI + SQLite as a cohesive free ecosystem. The closest is Jepack, which costs $25-50/month for comparable features.

**Total competitor cost for equivalent features:** ~$400-800/year
**Gratis cost:** $0 (self-hosted) or $9-29/month (managed cloud)

---

## Revenue Model — Detailed Unit Economics

### Pro Tier ($9/month)
| Cost Component | Per User/Month |
|---------------|---------------|
| S3 storage (50GB) | $1.15 |
| Uptime monitoring | $0.50 |
| AI inference (100 calls) | $0.30 |
| Infrastructure overhead | $0.50 |
| **Total cost** | **$2.45** |
| **Gross margin** | **73%** |

### Agency Tier ($29/month, 10 sites)
| Cost Component | Per User/Month |
|---------------|---------------|
| S3 storage (500GB) | $11.50 |
| Monitoring (10 sites) | $2.00 |
| Dashboard hosting | $1.00 |
| AI inference | $1.00 |
| **Total cost** | **$15.50** |
| **Gross margin** | **47%** |

### Break-Even Analysis
- Fixed costs (servers, domain, email): ~$200/month
- Break-even at Pro tier: 23 paying users
- Break-even at mixed: ~15 Pro + 3 Agency = $192/month
- Target: 50 paying users within 6 months of cloud launch = $650 MRR

---

## Technical Architecture for Cloud Services

```
┌─────────────────────────────────────────────┐
│              Gratis Cloud API                │
│         (Minimal Go/Zig microservice)       │
├─────────────────────────────────────────────┤
│  Auth: API key per site (generated in WP)   │
│  Transport: HTTPS only, TLS 1.3            │
│  Storage: S3-compatible (Cloudflare R2)     │
│  Monitoring: Simple HTTP checks             │
│  AI: Proxy to OpenAI/Anthropic APIs         │
└─────────────────────────────────────────────┘
         ↕ (only when user opts in)
┌─────────────────────────────────────────────┐
│         WordPress Site (user's server)       │
│  cache-manager + gratis-backup + gratis-ai  │
│  All features work without cloud connection │
└─────────────────────────────────────────────┘
```

### Cloud Infrastructure Choices
- **Storage:** Cloudflare R2 (no egress fees, S3-compatible)
- **Compute:** Fly.io or Railway (simple, auto-scaling)
- **Monitoring:** Custom lightweight checker (not third-party)
- **AI Proxy:** Simple relay to OpenAI/Anthropic with rate limiting
- **Database:** SQLite or Turso for cloud metadata (dogfooding)

---

## Marketing Strategy

### Phase 1: Developer Trust (Months 1-3)
- Publish to WordPress.org (cache-manager first)
- Write technical blog posts:
  - "How we detect the best cache backend automatically"
  - "Why your WordPress site doesn't need Redis (but we support it anyway)"
  - "Building a free WordPress AI assistant with BYOM"
- Post on r/WordPress, r/webdev, dev.to
- Create a demo site showing the theme + builder + cache in action

### Phase 2: Community Building (Months 3-6)
- GitHub Discussions for support (not paid forums)
- Monthly "State of Gratis" updates
- Accept community patterns/templates
- Sponsor a WordPress meetup talk

### Phase 3: Soft Monetization (Months 4-8)
- Launch managed backups (invite-only beta)
- Offer free tier: 1 site, 5GB storage, daily backups
- Pro tier: unlimited sites, 50GB, hourly backups
- Transparent pricing page with cost breakdown

---

## superglobaldevelopment.com Integration

The domain could serve as:
1. **Product landing page** for the Gratis ecosystem
2. **Cloud dashboard** for managed services
3. **Documentation hub** with interactive examples
4. **Demo site** running gratis-theme + all plugins

### Proposed Site Structure
```
superglobaldevelopment.com/
├── /                    → Product landing (gratis-theme showcase)
├── /docs/               → Documentation
├── /cloud/              → Cloud dashboard (future)
├── /patterns/           → Pattern library showcase
├── /demo/               → Live WordPress demo
└── /blog/               → Technical blog
```

---

## Risk Mitigation — Specific Actions

| Risk | Action |
|------|--------|
| WordPress.org rejection | Run PCP tool before submission, follow all guidelines |
| No adoption | Focus on cache-manager first (most universal need) |
| Support overwhelm | Invest in docs + WP-CLI help text + admin tooltips |
| Competitor response | Move fast, ship weekly, build community |
| Cloud costs exceed revenue | Start with R2 (free egress), set hard usage limits |

---

## Success Metrics

| Metric | 3 Month | 6 Month | 12 Month |
|--------|---------|---------|----------|
| Active installs (cache-manager) | 500 | 2,000 | 10,000 |
| Active installs (gratis-theme) | 200 | 1,000 | 5,000 |
| GitHub stars (all repos) | 50 | 200 | 1,000 |
| Cloud beta users | — | 50 | 200 |
| MRR | $0 | $500 | $3,000 |
| Support tickets/week | 5 | 15 | 30 |

---

## Next Actions (This Week)

1. ✅ Local dev environment running
2. ✅ WP-CLI commands working
3. ✅ Logger bug fixed
4. → Prepare cache-manager for WordPress.org submission
5. → Run Theme Check on gratis-theme
6. → Set up superglobaldevelopment.com with gratis-theme
7. → Write first blog post: "Introducing Gratis"

---

*Last updated: 2026-05-23*
