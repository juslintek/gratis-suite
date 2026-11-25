# Research: `gratis-theme` Perfection — WordPress Agent Skills, Gutenberg Edit/Frontend Parity, and WordPress.org Directory Requirements

**Date:** 2026-11-25  
**Scope:** Primary-source research for `gratis-theme` (WordPress Full Site Editing block theme, targeting WP 6.5–6.9+ and WordPress.org Theme Directory compliance).

---

## 1. `WordPress/agent-skills` Inventory vs. Local Installation

**Primary sources:**
- GitHub API (`https://api.github.com/repos/WordPress/agent-skills/contents/skills`)
- Local skills directory (`/Users/linasjusys/.agents/skills/`)

### Coverage Comparison
All **20 skills** currently published in `WordPress/agent-skills` are already installed locally in `/Users/linasjusys/.agents/skills/` (0 missing).

| Skill | Installed Locally | Relevance to `gratis-theme` | Purpose / Scope |
|---|---|---|---|
| `wp-block-themes` | Yes | **Critical** | `theme.json` (settings, styles, v3 presets, WP 6.9 form/radius additions, `_wp_to_kebab_case` slug trap), `templates/*.html`, `parts/*.html`, `patterns/*.php`, `styles/*.json`, Site Editor style hierarchy debugging. |
| `wp-patterns` | Yes | **Critical** | Block pattern authoring (`patterns/*.php`), design tokens/presets only (no inline `<style>` or custom classes), registration-time PHP rules, valid block nesting, i18n/escaping, a11y checks, anti-patterns. |
| `wp-playground` | Yes | **High** | Fast zero-Docker verification via `npx @wp-playground/cli@latest server --auto-mount`, WP version switching (6.5–6.9+), browser previews, snapshots. |
| `blueprint` | Yes | **High** | Authoring/validating Playground `blueprint.json` bundles for reproducible `gratis-theme` demo/test setups. |
| `wp-performance` | Yes | **High** | Profiling & measurement (WP-CLI `profile`/`doctor`, Server-Timing, autoloaded options, object caching, HTTP API calls). |
| `wpds` | Yes | **Medium** | WordPress Design System components, tokens, and patterns (useful for any theme admin/onboarding UI built with Core components). |
| `wp-project-triage` | Yes | **High** | Deterministic inspection of WordPress repo roots (`detect_wp_project.mjs`) before applying theme/pattern workflows. |
| `wordpress-router` | Yes | **Medium** | Classifies WP repos and routes to the right WordPress skill. |
| `wp-env` | Yes | **High** | Docker-based local WordPress environment (`@wordpress/env`) for persistent PHPUnit/Playwright/E2E testing. |
| `wp-plugin-directory-guidelines` | Yes | **Low (analogous)** | Built for **plugins** (18 Plugin Directory guidelines, PCP), *not* the Theme Review Handbook (`make.wordpress.org/themes/handbook/review/required/`). Theme directory compliance must follow Section 3 below. |
| `wp-block-development` | Yes | **Low** | Custom Gutenberg blocks (`block.json`, `render.php`). Note: themes cannot ship custom blocks on WP.org. |
| `wp-interactivity-api` | Yes | **Low** | `data-wp-*` directives / `viewScriptModule` (mainly plugin/block territory, though core blocks use it). |
| `wp-phpstan` | Yes | **Medium** | PHPStan configuration for `functions.php` and pattern PHP validation. |
| `wp-wpcli-and-ops` | Yes | **Medium** | WP-CLI operations, db export/import, cache flushing. |
| `wp-abilities-api`, `wp-abilities-audit`, `wp-abilities-verify`, `wp-ability-development`, `wp-plugin-development`, `wp-rest-api` | Yes | **Not applicable** | Plugin / REST / Abilities API workflows. |

---

## 2. 100% Gutenberg Edit Mode ↔ Frontend Render Parity (Block Themes, WP 6.5–6.9+)

### 2.1 `theme.json` v3 Settings, Layout, Spacing, and Slug Normalization

**Primary sources:**
- [Theme.json Migrations (v2 to v3)](https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/theme-json-migrations/#migrating-from-v2-to-v3)
- [Theme.json v3 Dev Note](https://make.wordpress.org/core/2024/06/19/theme-json-version-3/)
- [Layout Settings](https://developer.wordpress.org/themes/global-settings-and-styles/settings/layout/)
- [Spacing Settings](https://developer.wordpress.org/themes/global-settings-and-styles/settings/spacing/)
- Core source: `wp-includes/class-wp-theme-json.php`, `wp-includes/functions.php`

#### A. Breaking Preset Overrides in `theme.json` v3 (WP 6.6+)
- In `theme.json` **v3**, `settings.typography.defaultFontSizes` and `settings.spacing.defaultSpacingSizes` default to **`true`** (matching `settings.color.defaultPalette`).
- **Pitfall:** When `defaultFontSizes` or `defaultSpacingSizes` is `true`, WordPress shows core defaults (`small`, `medium`, `large`, `x-large`, `xx-large`; spacing `20`–`80`) and **prevents the theme from overriding those slugs**. If a theme wants to replace core slugs with its own scale, it **must** explicitly set:
  ```json
  "settings": {
    "typography": { "defaultFontSizes": false },
    "spacing": { "defaultSpacingSizes": false }
  }
  ```
- In v3, both `spacingScale` and `spacingSizes` can coexist; matching slugs in `spacingSizes` override `spacingScale`-generated entries.

#### B. `useRootPaddingAwareAlignments` & `styles.spacing.padding`
Verified directly in `WP_Theme_JSON::get_root_layout_rules()` (`wp-includes/class-wp-theme-json.php`, lines 4563–4602):
- When `settings.useRootPaddingAwareAlignments` is **`true`** and `styles.spacing.padding` is set as an explicit 4-side object (`top`, `right`, `bottom`, `left`):
  - Top/bottom root padding is emitted on `.wp-site-blocks`.
  - Left/right root padding (`var(--wp--style--root--padding-left)` / `right`) is emitted on `.has-global-padding` rather than `body`, and `.has-global-padding > .alignfull` gets negative horizontal margins (`calc(var(--wp--style--root--padding-left) * -1)`) so full-bleed blocks span edge-to-edge in both the editor canvas and frontend.
  - Nested `.has-global-padding` containers inside non-fullwidth flow containers automatically have horizontal padding zeroed to prevent double-padding.
- **Pitfall:** Declaring `styles.spacing.padding` as a shorthand string or without `useRootPaddingAwareAlignments: true` traps `.alignfull` blocks inside body padding or causes editor/frontend alignment drift.

#### C. `settings.spacing.blockGap` & `styles.spacing.blockGap`
Verified in [Spacing Settings](https://developer.wordpress.org/themes/global-settings-and-styles/settings/spacing/) and `WP_Theme_JSON::get_root_layout_rules()` (lines 4612–4621):
- `settings.spacing.blockGap` has three distinct states:
  - `null` (default): **No** Block Spacing UI control, **no** WordPress-generated blockGap CSS.
  - `false`: **No** UI control, **yes** WordPress-generated blockGap CSS (`:where(.wp-site-blocks) > * { margin-block-start: ... }`, `:first-child { margin-block-start: 0 }`, and `--wp--style--block-gap`).
  - `true`: **Yes** UI control + **yes** WordPress-generated CSS.
- **Pitfall:** Leaving `settings.spacing.blockGap` omitted (`null`) silently disables core vertical flow spacing (`margin-block-start`) and `gap` CSS in both editor and frontend unless manually recreated.

#### D. Slug Normalization Trap: `_wp_to_kebab_case()` (`2xl` → `2-xl`)
Verified in `wp-includes/class-wp-theme-json.php` (line 2975) and `wp-includes/functions.php` (`_wp_to_kebab_case()`, lines 5410–5459):
- `WP_Theme_JSON` passes every preset and custom slug through `_wp_to_kebab_case()` before emitting CSS custom properties (`--wp--preset--*` and `--wp--custom--*`).
- `_wp_to_kebab_case()` replicates JS `lodash.kebabCase()`, splitting on **digit/letter boundaries** (`\d+` vs `[a-z]+`), camelCase boundaries, and non-alphanumeric delimiters:
  - `"2xl"` → `"2-xl"` → `--wp--preset--spacing--2-xl` / `--wp--preset--font-size--2-xl`
  - `"3xs"` → `"3-xs"`
  - `"cardShadow"` → `"card-shadow"`
- **Pitfall:** Writing `var(--wp--preset--spacing--2xl)` or `var(--wp--preset--font-size--2xl)` in custom CSS or `theme.json` `styles.*.css` silently resolves to **nothing** (unlike `"var:preset|spacing|2xl"`, which `WP_Theme_JSON` resolves if handled by theme.json, though keeping consistent kebab-case slugs like `2-xl` avoids mismatch across CSS and PHP/JS). Always inspect or reference the normalized hyphenated variable name (`2-xl`).

#### E. WordPress 6.6–6.9 `theme.json` Capabilities to Prefer Over Custom CSS
- **Section Styles / Block Style Variations** (WP 6.6+, [Section Styles Dev Note](https://make.wordpress.org/core/2024/06/24/section-styles/)): Define reusable container palettes via `/styles/*.json` partials with `"blockTypes": ["core/group", ...]` and `"slug"`, or via `register_block_style( ..., [ 'style_data' => ... ] )`. WP 6.6+ renders Global Styles at uniform `(0, 1, 0)` specificity (`:where(...)` wrapping) so nested section styles compose cleanly in both editor and frontend.
- **Form element styling & border-radius presets** (WP 6.9, referenced in `wp-block-themes`): `styles.elements.textInput`, `styles.elements.select`, `settings.border.radiusSizes`, and button `:hover`/`:focus` pseudo-classes in `theme.json` eliminate custom CSS parity issues for those elements.

---

### 2.2 Loading Stylesheets into the Iframed Block Editor

**Primary sources:**
- [Enqueueing assets in the Editor](https://developer.wordpress.org/block-editor/how-to-guides/enqueueing-assets-in-the-editor/)
- [Including Assets (Theme Handbook)](https://developer.wordpress.org/themes/core-concepts/including-assets/)
- [Block Stylesheets](https://developer.wordpress.org/themes/features/block-stylesheets/)
- [Block Style Variations](https://developer.wordpress.org/themes/features/block-style-variations/)
- Core/Gutenberg source: `wp-includes/theme.php` (`add_editor_style`), `wp-includes/block-editor.php` (`get_block_editor_theme_styles`, `_wp_get_iframed_editor_assets`), `packages/block-editor/src/utils/transform-styles/index.ts`

#### Architecture in WP 6.5–6.9+
- The **Site Editor** always runs its canvas inside an **iframe**.
- The **Post Editor** runs inside an **iframe** whenever all registered blocks use `apiVersion: 3` (and unconditionally in newer WP/Gutenberg versions).
- Because the editor canvas is an isolated document, **styles enqueued only on `wp_enqueue_scripts` never enter the editor**, and **styles enqueued on `enqueue_block_editor_assets` load into the outer admin shell, NOT inside the content iframe** (unless legacy heuristics detect `.editor-styles-wrapper`/`.wp-block*`, which logs console warnings and breaks encapsulation).

#### Comparison of Mechanisms

| Mechanism | Where It Loads | Selector / URL Processing | Best Use & Caveats |
|---|---|---|---|
| `add_theme_support('editor-styles')` + `add_editor_style($files)` (on `after_setup_theme`) | **Inside editor iframe only** (via `get_block_editor_theme_styles()` → `editor_settings['styles']`). Must still enqueue on frontend via `wp_enqueue_scripts` if needed outside `theme.json`. | Passed through `@wordpress/block-editor`'s `transformStyles()` (`packages/block-editor/src/utils/transform-styles/index.ts`). Rewrites relative `url(...)` via `baseURL`. When a wrapper selector (`.editor-styles-wrapper`) is active, prefixes selectors and uses `prefixRootSelector()` for `body`, `html`, `:root`, `:where(body)`, `:where(html)`, `:where(:root)` — inserting the wrapper **after** the root token (e.g., `body .editor-styles-wrapper ...`) rather than before it. | **Recommended** for theme-wide editor stylesheets that must match frontend CSS loaded via `wp_enqueue_scripts`. Note: if CSS has syntax errors, `transformStyles()` logs a warning and returns `null` (drops the entire stylesheet!). |
| `enqueue_block_assets` (with `wp_enqueue_style` / `wp_enqueue_script`) | **Frontend AND inside editor iframe** (since WP 6.3, via `_wp_get_iframed_editor_assets()` in `wp-includes/block-editor.php`). | Loaded verbatim as `<link>`/`<style>` inside the iframe `<head>` **without** `.editor-styles-wrapper` selector rewriting. | Use for shared block/content assets (and editor-only canvas assets wrapped in `if ( is_admin() )`). Note: in WP 6.3+, `enqueue_block_assets` also loads in the outer editor admin document for backward compatibility (Gutenberg issue `#53590`), so avoid un-scoped `body`/`*` resets here. |
| `wp_enqueue_block_style( $block_name, $args )` (on `init`) | **Frontend AND editor iframe**, **only when `$block_name` is rendered** on the page/canvas. | Supplying `'path' => get_theme_file_path(...)` lets WordPress **inline** the CSS into `<head>` on the frontend (avoiding extra HTTP requests). | **Best-in-class** for per-block CSS beyond `theme.json` (zero unused CSS overhead on pages without that block). |
| `register_block_style( $block_name, $args )` (on `init`) | Registers `.is-style-{name}` class in editor UI + styles on **both** frontend and editor. | **WP 6.6+ `style_data`:** Accepts a `theme.json`-shaped PHP array (`color`, `blocks`, `elements`, `:hover`, etc.), absorbed into Global Styles with uniform `(0, 1, 0)` specificity and editable/compatible with Global Styles. | **Prefer `style_data`** (or `/styles/*.json` partials) or small `inline_style`. **Avoid `style_handle`**: official Theme Handbook documents an active Gutenberg bug (`#27244`) where `style_handle` only enqueues in the editor and **not** on the frontend. |
| `enqueue_block_editor_assets` | **Outer WordPress admin page** (outside iframe). | None. | **JS/UI only** (inspector controls, JS block style/variation registration, editor sidebar plugins). Never use for block content styling. |

---

### 2.3 Why Raw `wp_head` Inline `<style>` and `wp_enqueue_scripts`-Only CSS Break Parity + Scoping Animations

1. **Raw `wp_head` `<style>` tags & `wp_enqueue_scripts`-only CSS:**
   - Neither `wp_head` nor `wp_enqueue_scripts` runs inside the Gutenberg Post Editor or Site Editor iframe. Any typography, spacing, layout, custom properties, or pattern styling placed in `wp_head` or `wp_enqueue_scripts` without matching `theme.json` / `add_editor_style()` / `wp_enqueue_block_style()` / `enqueue_block_assets` causes immediate visual divergence in Gutenberg.
   - Official [Including Assets](https://developer.wordpress.org/themes/core-concepts/including-assets/) guidance explicitly states: *"you should never manually hard code these HTML elements [`<link>` / `<style>` / `<script>`] in your theme"* — use `wp_add_inline_style()` attached to a registered handle, or `theme.json` / `wp_enqueue_block_style()`.
2. **Interactive / Scroll-Reveal CSS (`opacity: 0`, `visibility: hidden`, `transform`, `pointer-events: none`):**
   - Frontend scroll-reveal JS (like `IntersectionObserver` scripts enqueued on `wp_enqueue_scripts`) does **not** run inside the Gutenberg editing canvas (and even if loaded via `enqueue_block_assets`, blocks added dynamically by a user would remain un-observed).
   - **Result if unscoped:** Any rule like `.reveal-on-scroll { opacity: 0; }` loaded into the editor via `add_editor_style()` or `enqueue_block_assets` renders blocks **invisible and unclickable/hard to edit** in Gutenberg.
   - **Fix:** Gate initial hidden states strictly to a frontend-only runtime class (e.g., `html.js-loaded .reveal-on-scroll:not(.is-visible)` set only by frontend JS, or `:where(body:not(.editor-styles-wrapper))` / `not(.block-editor-page)`), **and** respect `@media (prefers-reduced-motion: reduce)` so blocks always default to `opacity: 1` when JS hasn't activated or inside the editor. Better yet, omit non-essential reveal hides from patterns entirely and follow the `wp-patterns` rule: patterns must rely on core blocks and `theme.json` tokens without custom JS/CSS dependencies.

---

### 2.4 Block Validation & `kses` Pitfalls ("Attempt Block Recovery")

**Primary sources:**
- [Block Edit and Save — Validation](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation)
- `wp-includes/kses.php` (`safecss_filter_attr`, `wp_kses_post`)

When opening a template or post containing patterns/blocks, Gutenberg parses comment attributes (`<!-- wp:block {...} -->`), runs `save()`, and compares the regenerated HTML byte-for-attribute against the stored markup. Any mismatch triggers **"Attempt Block Recovery"**. Common causes in block themes & patterns:

1. **Hand-edited block markup mismatching core's serializer:**
   - Missing or reordered wrapper classes (e.g., forgetting `wp-block-heading` on `<h2>`, omitting `wp-element-button` on `<a>` in `core/button`, omitting `has-background` / `has-text-color` / `has-{slug}-color` when setting color attributes, or wrong `has-background-dim-*` classes on `core/cover`).
   - Mismatched HTML tag or nested wrapper order (e.g., `wp:group` layout classes, or missing `<!-- /wp:block -->` closing comments).
   - **Rule:** Build patterns in the Gutenberg editor and export via *Options → Copy all blocks*, or verify every edited pattern in the editor/Playground.
2. **KSES sanitization stripping (`wp_kses_post` / `safecss_filter_attr`):**
   - Users without `unfiltered_html` capability (e.g., Authors/Editors, and **all** users including Admins on WordPress Multisite by default) pass post/pattern content through `wp_kses_post()` on save.
   - **Pitfalls:**
     - Inline `<style>`, `<script>`, `<svg>`/`<path>` elements, `onclick`/event handlers, or non-whitelisted `data-*` attributes get **stripped** on save.
     - Inline `style="..."` attributes are filtered by `safecss_filter_attr()` (`wp-includes/kses.php`, lines 3737+): any CSS property not on the `safe_style_css` allowlist (or values containing unsupported functions/quotes) is **stripped**, silently altering the saved HTML and triggering **"Attempt Block Recovery"** for static blocks on the next editor load.
   - **Rule:** Never put raw `<svg>`, `<style>`, `<script>`, custom `data-*`, or custom `style="..."` properties inside patterns or templates. Express all styling through block JSON attributes (`theme.json` presets) or per-block stylesheets (`wp_enqueue_block_style`).
3. **Unescaped/changed dynamic URLs or i18n inside pattern HTML:**
   - Ensure dynamic PHP in `patterns/*.php` (e.g., `esc_url( get_theme_file_uri(...) )`, `esc_html_e(...)`) resolves cleanly at registration time without breaking JSON attributes (use `wp_json_encode()` or clean attribute escaping) or creating invalid HTML entities.

---

## 3. WordPress.org Theme Directory Required Guidelines

**Primary sources:**
- [Theme Review Handbook — Required](https://make.wordpress.org/themes/handbook/review/required/) (last updated June 9, 2026)
- [Theme Tags](https://make.wordpress.org/themes/handbook/review/required/theme-tags/)
- [Theme Check Plugin](https://make.wordpress.org/themes/handbook/review/required/theme-check-plugin/)
- [Accessibility-Ready Requirements](https://make.wordpress.org/themes/handbook/review/accessibility/required/) & [WP Accessibility Team Theme Guidelines](https://wpaccessibility.org/docs/topics/theme-guidelines/)
- [Main Stylesheet (`style.css`)](https://developer.wordpress.org/themes/basics/main-stylesheet-style-css/)
- [Theme Structure](https://developer.wordpress.org/themes/core-concepts/theme-structure/)

*(Note: Themes with 3 or more distinct issues may be closed immediately as not-approved.)*

### 3.1 Plugin Territory & Prohibited Functionality (§5 & §6)

Themes must strictly handle **design and presentation**. The Required guidelines explicitly forbid:

| Feature / Pattern | Status in WP.org Review | Exact Guideline Basis |
|---|---|---|
| **SEO / OpenGraph meta tags** | **Forbidden** | §6 explicitly lists *"SEO options"* as plugin territory; §5 forbids *"Functionality that is not related to design and presentation"* and forbids removing `rel_canonical`. |
| **Robots filters** (`wp_robots`, meta robots) | **Forbidden** | Same: SEO / indexing control is non-presentational plugin territory (§5, §6). |
| **HTTP `Cache-Control` / `Surrogate-Key` headers** | **Forbidden** | §6 explicitly lists *"Resource caching"* as plugin territory; HTTP caching/CDN headers are non-presentational (§5). |
| **Output buffering (`ob_start`) mutating HTML content** | **Forbidden** | Non-presentational HTML/content rewriting, caching, or SEO injection violates §5 (*"Functionality that is not related to design and presentation"*) and §6. |
| **Disabling core emoji** (`remove_action('wp_head', 'print_emoji_detection_script')`, removing `wp_enqueue_emoji_styles`) | **Forbidden** | §5 explicitly states: *"Do not: Remove non-presentational hooks"* (citing `wp_generator`, `feed_links`, `wp_resource_hints`, `rsd_link`, `rest_output_link_wp_head`, `wp_oembed_add_*`, `rel_canonical`, etc.). Site-wide emoji script/style removal is performance/behavior plugin territory. |
| **Disabling remote patterns** (`should_load_remote_block_patterns`) | **Caution / Avoid** | While `should_load_remote_block_patterns` is documented in the Theme Handbook for private/agency sites, themes submitted to WP.org should not silently strip core editor integrations or WordPress.org Pattern Directory access without explicit user opt-in/design justification (if opting out of core bundled patterns only, `remove_theme_support( 'core-block-patterns' )` is the theme-level toggle). |
| **Custom Post Types & post-ID-tied templates** | **Forbidden / Anti-pattern** | §5 explicitly forbids *"Custom post types"*, *"Custom blocks"*, *"Custom roles"*, *"Custom user contact methods"*, *"Custom mime types"*, *"Shortcodes"*. Templates tied to hardcoded database post IDs (e.g., `page-42.html` or `single-cpt-99.html`) fail portability across user installs; use standard template hierarchy (`templates/single.html`, `templates/page.html`) or `customTemplates` in `theme.json`. |
| **Analytics / tracking, contact forms, social share/like/follow buttons, non-design meta boxes, session tampering** | **Forbidden** | Explicitly listed in §6 *"Examples of plugin territory"*. |
| **Remote resources / CDNs** | **Forbidden (1 exception)** | §9: *"No remote resources are allowed without user consent: Include all scripts, images, videos and other resources in the theme zip file. The only exception to this requirement is Google Fonts."* (Still prefer local bundled woff2 fonts via `theme.json` `fontFace` for GDPR/performance.) |
| **Onboarding / Admin** | **Strict limits** | §12: Use dismissible `admin_notices`; optional sub-page under *Appearance* using Core UI only; **single** prefixed option array via Settings/Options API; **no demo imports, no external calls, no tracking/affiliate links**. |

### 3.2 Required & Recommended Block Theme Files (§9 & §11)

- **Required files for a Block Theme (§11):**
  1. `style.css` (in theme root)
  2. `readme.txt` (in theme root)
  3. `theme.json` (in theme root)
  4. `templates/index.html` (inside `/templates/`)
  - Also standard/expected: `screenshot.png` (or `.jpg`) in root; `parts/` (`header.html`, `footer.html` — **must not be nested in subdirectories**); `patterns/` (`.php` files); `styles/` (`.json` style variations).
- **Block template validity (§11):** *"Block templates must be complete, and blocks may not have missing or incorrect closing tags."*
- **Prefixing (§4):** Minimum **4-letter** unique prefix for all functions, constants, options, handles, image sizes, and custom pattern category slugs (except 3rd-party asset handles).
- **Line endings & forbidden files (§9):** Uniform line endings (LF/CRLF consistency for SVN); strip `.git`, `.sh`, `.xml` (except `wpml-config.xml`, `loco.xml`, `phpcs.xml`), `.sql`, `php.ini`, `error_log`, `favicon.ico`, `.zip`, hidden files; include unminified sources alongside any minified JS/CSS; use WordPress-bundled libraries (no custom jQuery).

### 3.3 `style.css` Headers (§8, §9 & Theme Handbook)

Required headers for WordPress.org submission:
- `Theme Name` (cannot contain `WordPress`, `Theme`, or `Twenty*` — §7)
- `Author` (WordPress.org username recommended)
- `Description`
- `Version` (`X.X` or `X.X.X`)
- `Requires at least` (`X.X`, e.g. `6.5` — must support at least current/recent WP versions)
- `Tested up to` (`X.X`, **only the number**, e.g. `6.9`)
- `Requires PHP` (`X.X`, **only the number**, e.g. `7.4`)
- `License` (GPL-compatible; `GNU General Public License v2 or later` recommended)
- `License URI` (e.g. `http://www.gnu.org/licenses/gpl-2.0.html`)
- `Text Domain` (must match theme slug / folder name)
- Optional: `Theme URI` (must be about the hosted theme; `wordpress.org` URLs reserved for Twenty* themes), `Author URI`, `Tags` (validated against `https://api.wordpress.org/themes/info/1.1/?action=feature_list` — **max 3 subject tags**).

### 3.4 `readme.txt` Format (§1, §2, §9)

Must follow the official structure in §9:
- Header fields: `=== Theme Name ===`, `Contributors:` (single WP.org username), `Requires at least:`, `Tested up to:`, `Requires PHP:`, `License:`, `License URI:`, plus short description (**≤ 150 chars**).
- Sections: `== Description ==`, `== Frequently Asked Questions ==`, `== Changelog ==`, `== Upgrade Notice ==` (≤ 300 chars per notice), and **`== Resources ==`**.
- **Licensing & Third-Party Assets (§1):**
  - Everything in the theme ZIP must be GPL or GPL-compatible.
  - Provide a single consolidated list (`== Resources ==`) documenting **license, copyright information, and source URL** for **every bundled font, image, icon, and third-party script/CSS** (public domain assets omit copyright, still cite license/source).
  - Include copyright statement for the theme itself. Frontend copyright text must only show the *user's* site copyright, never the theme author's copyright (credit links limited to max 1 Theme/Author URI link + optional WordPress.org link per §13).
- **Privacy (§2):** Any tracking/data collection must be **off by default (opt-in)** and documented in `readme.txt`.

### 3.5 `screenshot.png` Rules (§9)

- Located in theme root (`screenshot.png` or `.jpg`).
- **Dimensions:** Maximum **`1200 × 900` px**; aspect ratio **must be `4:3`**.
- **Content:** Must show the actual rendered theme design and **must not look like an advertisement** (no marketing copy, feature badges, device mockups/collages that misrepresent the real theme output; reviewers can reject subjectively).

### 3.6 Accessibility Requirements (§3 & Accessibility-Ready Guidelines)

**Baseline Required for ALL WP.org themes (§3):**
1. **Skip link:** Must be the **first focusable element** for screen-reader and keyboard users (when logged out), visible on keyboard focus, and move focus to `<main>` when activated (applies on every template with header/nav before main content; block themes inherit WP core skip-link generation if `<main>` is present, verify in every template).
2. **Keyboard navigation:** All controls and links (including mobile menus, dropdowns, modals, toggles) must be reachable and operable via keyboard alone across all viewport sizes.

**Required if using the `accessibility-ready` tag** ([Accessibility-Ready Guidelines](https://make.wordpress.org/themes/handbook/review/accessibility/required/) & [wpaccessibility.org](https://wpaccessibility.org/docs/topics/theme-guidelines/)):
- **Underlined links in body text:** Links inside large blocks of text (post content, comments, text widgets, footer paragraphs) **must be underlined** (bold/italic/color alone fails!). On hover, there must be a non-color visual change (e.g., removing underline or thickening underline). Navigation menus and button blocks are exempt.
- **Color contrast (WCAG 2.2 AA):** Body text ≥ **4.5:1**, large text (≥18pt / 24px, or ≥14pt / ~19px bold) ≥ **3:1**, UI controls/focus outlines/icon-only buttons ≥ **3:1** across **default, hover, and focus states** and across **all** bundled style variations/palettes.
- **Landmarks, headings, forms, screen-reader text, motion:** Meaningful landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), sequential headings (`h1` → `h2` → `h3`), labelled form fields, `.screen-reader-text` support, visible focus indicators, `prefers-reduced-motion` / accessible animations, reflow/text-spacing support, no ambiguous link text, no new-tab links without warning, accessibility statement in `readme.txt` / docs.
