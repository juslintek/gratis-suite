# Specification: GRATIS Block Theme Perfection, 1:1 Gutenberg Parity, Dedicated Theme Demo & Docs (`v1.0.2`)

## Problem Statement

1. **Misleading demo & incomplete documentation:** `https://github.com/juslintek/gratis-theme` (`README.md`), `site/`, and `/docs/` link users to either the root suite landing page or `/demo/` (a list of 8 plugin demos) instead of a dedicated **GRATIS Theme Demo** showcasing the theme's own features. Furthermore, `/docs/gratis-theme/` returns HTTP 404 on production and `site/docs/gratis-theme.html` is omitted by `bin/build-site.php`. `README.md` also contains stale repo URLs (`juslintek/gratis` instead of `juslintek/gratis-theme`), inconsistent pattern counts (`21` vs `22` vs `35+`), and undocumented block styles, style variations, template parts, and tokens.
2. **Gutenberg Edit Mode vs Published Frontend mismatch:** `functions.php` outputs ~270 lines of layout/component/block-style CSS via `wp_head` and enqueues `components.css`, `animations.css`, and `demo-showcase.css` exclusively via `wp_enqueue_scripts` (frontend-only), with no `add_theme_support('editor-styles')` or `add_editor_style()`. In addition, `theme.json` has un-normalized preset variable slugs (`--4xl`, `--3xl`, `--2xl` instead of WordPress's emitted `--4-xl`, `--3-xl`, `--2-xl`), conflicting root padding/background values vs `wp_head` `!important` overrides, `wp_dequeue_style('wp-block-library')` on non-singular block templates, and 40+ pattern/template/part files with block attribute ↔ HTML serialization mismatches that trigger **"Attempt Block Recovery"** in Gutenberg.
3. **WordPress.org Theme Directory human-review blockers (Ticket `#301616`):**
   - DOM XSS in `assets/js/search.js` and `assets/js/notifications.js` (`innerHTML` with unsanitized query/message strings).
   - Hotlinked third-party images (`images.unsplash.com`, `i.pravatar.cc`) in 4 patterns.
   - Plugin-territory hooks in `functions.php` (SEO/OpenGraph meta tags, `wp_robots`, HTTP `Cache-Control`/`Cache-Tag`/`Surrogate-Key` headers, `ob_start` quote replacement, disabling core emoji and remote block patterns) and inline JSON-LD `<script>` / CF7 block dependency in patterns.
   - Missing `'gratis'` i18n escaping in `patterns/*.php`, skipped heading levels, missing button `href`s, and WCAG AA contrast failures (`.is-style-card` white background with light text, `.reviewer-avatar` selector mismatch, `pricing-cards.php` badge, `newsletter.php`).

## Solution

1. **1:1 Gutenberg Edit Mode ↔ Frontend Architecture:**
   - Unify `theme.json` v3 tokens (`base-dark: #0d0f12`, 0px top/bottom root padding with `useRootPaddingAwareAlignments: true`, normalized `--2-xl`..`--5-xl` preset refs, border radius presets, semantic `custom.surface` tokens) and ship 4 complete Global Style Variations: Default Obsidian Dark (`theme.json` + `styles/dark.json`), Daylight Light (`styles/light.json`), Emerald Matrix (`styles/emerald.json`), and Ocean Slate (`styles/ocean.json`).
   - Move all frontend-only `wp_head` inline CSS into `assets/css/theme.css` and register `add_theme_support('editor-styles')` + `add_editor_style(['assets/css/theme.css', 'assets/css/components.css', 'assets/css/demo-showcase.css'])` alongside `wp_enqueue_scripts` so the iframed Post Editor, Site Editor, and Published Frontend consume the exact same stylesheets and tokens.
   - Implement CSS for all 17 registered custom block styles (`outline`, `ghost`, `pill`, `icon-only`, `rounded`, `shadow`, `border`, `card`, `card-dark`, `glass`, `bordered`, `thick`, `dotted`, `large`, `plain`, `check`, `no-disc`).
   - Scope scroll-reveal animations strictly to frontend `prefers-reduced-motion: no-preference` so Gutenberg blocks are never hidden (`opacity: 0`) or shifting during editing.
   - Canonicalize block markup across all 22 patterns, 18 templates, and 5 template parts and validate every file against real Gutenberg (`wp.blocks.parse` + recursive `isValid === true`) so 0 files trigger "Attempt Block Recovery".
2. **WordPress.org Theme Review Compliance (`v1.0.2`, Ticket `#301616`):**
   - Replace all `innerHTML` interpolation in `search.js` and `notifications.js` with safe DOM construction (`createElement` + `textContent`) and full keyboard/ARIA support.
   - Replace all external Unsplash/Pravatar URLs with bundled GPL-2.0-or-later local SVG illustrations in `assets/images/` documented in `readme.txt`.
   - Extract HTTP `Cache-Control` / `Cache-Tag` / `Surrogate-Key` header emission to `gratis-cache` and front-page accidental `wc_page_no_robots` guard to `gratis-seo`, removing all plugin-territory hooks from `gratis-theme/functions.php`.
   - Internationalize and escape all 22 `patterns/*.php` under text domain `'gratis'`, remove CF7/JSON-LD plugin dependencies from patterns, and fix all heading-hierarchy and WCAG 2.2 AA contrast issues.
3. **Dedicated GRATIS Theme Live Demo (`/demo/gratis-theme/`) & Complete Documentation:**
   - Create and publish `/demo/gratis-theme/` showcasing every GRATIS Theme feature interactively: `theme.json` v3 color/typography/spacing/shadow tokens, interactive Dark/Light/Emerald/Ocean style-variation preview, all 17 custom block styles, curated showcase of all 22 block patterns, all 18 templates & 5 header/footer variants, live debounced REST search widget, interactive `GRATIS.toast()` & `.gratis-bell` `GRATIS.notify()` controls, and WooCommerce/accessibility/performance highlights.
   - Feature `/demo/gratis-theme/` prominently at the top of `/demo/` (`page-224-landing.html`).
   - Publish complete, source-grounded theme documentation across `gratis-theme/README.md`, `gratis-theme/readme.txt`, `/docs/gratis-theme/` (`gratis-docs/seed-docs.php`), and `site/docs/gratis-theme.html` (`bin/build-site.php`), with every demo link pointing directly to `https://gratis.superglobalsdevelopment.com/demo/gratis-theme/`.

## Testing & Verification Seams

1. **`php gratis-theme/tests/validate-theme.php` & `./gratis-suite/tools/verify.sh` & `composer phpcs` & `composer phpunit`**: Static syntax, WPCS, `theme.json` v3 + `styles/*.json` validation, zero un-normalized CSS vars, zero hotlinked assets, version sync.
2. **Official WordPress `wp theme-check run gratis`** inside FrankenPHP WP 7.1.5 + PHP 8.6 container: 0 REQUIRED, 0 WARNING.
3. **Real Gutenberg Editor ↔ Frontend Parity Playwright Suite**:
   - Programmatically parses all 22 patterns, 18 templates, and 5 parts via `wp.blocks.parse()` in real Gutenberg and asserts `0` invalid/recovery blocks.
   - Opens Gutenberg Post Editor & Site Editor iframe side-by-side with Published Frontend and asserts matching computed styles (`backgroundColor`, `color`, `fontFamily`, `fontSize`, `borderRadius`, `padding`) across headings, cards, buttons, block styles, and patterns, plus screenshots inspected visually.
4. **Live Demo & Docs Verification**:
   - Asserts `/demo/gratis-theme/` and `/docs/gratis-theme/` return HTTP 200, render all documented sections, interactive search (including XSS payload safety test), interactive toast/bell notifications, and pass non-destructive Playwright E2E (`tests/e2e/`).
