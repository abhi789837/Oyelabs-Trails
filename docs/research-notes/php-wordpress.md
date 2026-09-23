# WordPress Development research notes (2026-09-23)

Thirteenth and final camp of the PHP track. Scope decision: this is WordPress *as a PHP developer
meets it in agency work* — the boot sequence, the hook system, the query and its costs, the content
model, both theme models, blocks, plugins, the schema, REST/headless, security and caching, plus a
WooCommerce glance. The PHP language, OOP, Composer/PSR and plain-PHP web concerns stay in
`php-foundations`, `php-oop`, `php-modern`, `php-composer-psr` and `php-web`.

Two deliberate merges to land inside the 10–13 topic budget:

- **CPTs + taxonomies + post meta** are one topic (`wp-content-model`), because the whole point is
  the *decision between* taxonomy and meta; splitting them would separate the question from its
  answer.
- **Options + transients + object cache + page cache + the N+1 shape** are one topic
  (`wp-caching-performance`), because they are four layers of one story and a learner who only
  knows three of them optimises the wrong one.

`php-web.ts` was read first. The security topic (`wp-security`) deliberately does **not** re-teach
XSS or CSRF mechanics or prepared statements — it names `php-web-xss-csrf` in the summary and
restricts itself to WordPress's own three-question split (nonce / capability / sanitise+escape),
`map_meta_cap`, the escaping-function-per-context table and `$wpdb->prepare()`'s difference from a
real prepared statement. The `$wpdb->prepare()` question in `wp-wpdb` is about the *mechanism*
(sprintf with escaping, `%i`), not about SQL injection, which `php-web-pdo-prepared-statements`
already covers.

## Topics

1. `wp-bootstrap-template-hierarchy` — How WordPress Boots and the Template Hierarchy (advanced)
2. `wp-hooks` — Actions, Filters and the Hook System (advanced, **milestone**)
3. `wp-loop-wp-query` — The Loop, WP_Query and What Queries Cost (advanced)
4. `wp-content-model` — Custom Post Types, Taxonomies and Post Meta (advanced)
5. `wp-block-themes` — Block Themes, theme.json and the Classic Themes You Will Inherit (advanced, **milestone**)
6. `wp-blocks` — Building a Block for the Block Editor (advanced)
7. `wp-plugins` — Plugins, mu-plugins and Where Code Belongs (intermediate)
8. `wp-enqueue` — Enqueuing Scripts and Styles Properly (intermediate)
9. `wp-wpdb` — The Database Schema and $wpdb (advanced)
10. `wp-rest-headless` — The REST API and Headless WordPress (advanced)
11. `wp-security` — Nonces, Capabilities, Sanitising and Escaping (advanced, **milestone**)
12. `wp-caching-performance` — Options, Transients and the Caching Layers (expert)
13. `wp-woocommerce` — WooCommerce at a Glance (intermediate)

## Videos

Every id came from `yt.mjs search` and was confirmed with `yt.mjs info --chapters`. All 27 ids used
(13 primaries + 14 alternates) report `embeddable: true`. No search-URL fallbacks.

WordPress video quality is genuinely poor compared with the other tracks — the top search results
are overwhelmingly beginner "build a site with a page builder" content or low-view SEO uploads. The
spine here is therefore **LearnWebCode (Brad Schiff)**, whose Dec 2024 – Feb 2025 run of short,
developer-focused videos is the only recent body of work that covers classic themes, block themes,
blocks and plugins at the right level, plus the **official WordPress channel**, **WooCommerce's own
channel** and **WPCasts**.

- `wp-bootstrap-template-hierarchy` → **`AWYp3rNKmvU`** "#3 Understanding WordPress Core | How
  Plugins Are Loaded In WordPress" (Imran Sayed – Codeytek Academy, 10:02). Walks `index.php` →
  `wp-load` → `wp-settings` → plugin loading, which nothing else on YouTube does concisely.
  Alternate **`ssqyrXoH7LI`** "A Guide to the WordPress Template Hierarchy (2021 Edition)" (Kinsta,
  12:25) for the hierarchy half.
- `wp-hooks` → **`VPpqajczp3A`** "Understanding WordPress Hooks: Actions, Filters, and Callbacks
  Explained" (Crocoblock, 16:52, **Mar 2026**). The most recent competent hooks explainer found;
  chapters split cleanly along actions / filters / callbacks. Alternate **`MW-evyl4nQU`**
  "WordPress Hooks" (WordPress, 3:44) as the official 4-minute version.
- `wp-loop-wp-query` → **`QBRdOq0Fvbo`** "3 simple steps to make WP_Query faster 🚀" (pragmatedev,
  13:43). Chosen over a beginner Loop tutorial because the topic's angle is *cost*; the Loop itself
  is covered by alternate **`FVqzKAUsM68`** at **4903s "The Loop"** (LearnWebCode, 3:18:32 — 2018,
  but the Loop has not changed). Second alternate **`ECFplH5J-Aw`** "The Most Powerful Block Type in
  WordPress (Query Loop)" (LearnWebCode, 22:15) for the block-editor counterpart.
- `wp-content-model` → **`4W36IbaE-As`** "WordPress Custom Post Type & Field Tutorial"
  (LearnWebCode, 28:11, Dec 2024). Alternate **`hbJiwm5YL5Q`** at **12241s "Pros & Cons of Custom
  Post Types"**.
- `wp-block-themes` → **`KBF359_ZYZ0`** "WordPress Block Theme Development Tutorial" (LearnWebCode,
  20:58, Feb 2025). Alternates **`fr14H3x0m1M`** "When To Create a Block Theme vs Traditional
  Theme" (8:01) and **`wUz69qRjN2s`** "WordPress Theme Development Tutorial (Classic Theme)"
  (27:05, Jan 2025) — the classic-vs-block contrast the brief asked for, in three videos by one
  author so the comparison is like for like.
- `wp-blocks` → **`zDxyfgtVedY`** "How to Create New Blocks In WordPress (@wordpress/create-block)"
  (LearnWebCode, 11:19). Alternates **`qaetjPBm5x4`** "React JS in WordPress (Add Options to Block
  Type)" (21:35) and **`hbJiwm5YL5Q`** at **9703s "Block Attributes"**.
- `wp-plugins` → **`syRi9p9aWYA`** "Create Your Own WordPress Plugin" (LearnWebCode, 18:47,
  Dec 2024). Alternate **`hbJiwm5YL5Q`** at **992s "Our First Plugin"**.
- `wp-enqueue` → **`a7ZRFA2s-pM`** "Enqueuing CSS and JavaScript" (WordPress, 7:08, Aug 2024) — the
  official short. Alternate **`Sqs2ogGrvTU`** on `wp_localize_script()` (BuntyWP, 19:23).
- `wp-wpdb` → **`D5BcyVA7WZE`** "WordPress Database High-Level Tour" (WPCasts, 15:26) for the
  schema, alternate **`gNnf2rRDWEw`** "How To Interact With The WordPress Database | WPDB
  Development Tutorial" (WPCasts, 8:54) for the class. Both are 2020/2021 and knowingly so: the
  core schema has not changed, and nothing newer covers it at this level.
- `wp-rest-headless` → **`v1CRoQVwuOU`** "WordPress REST API – custom routes and endpoints"
  (WordPress, 17:19) — official, and its chapters include "Managing user permissions", which is the
  part the topic hammers. Alternate **`kU5dUnKav4A`** "Headless WordPress Overview" (WPCasts,
  28:50).
- `wp-security` → **`p80LAxOhFd4`** "Escaping, Sanitizing and Data Validation in WordPress"
  (SmallTownDev, 36:38) — low view count, but it is the only video found whose chapters are exactly
  Data Validation / Nonces / Data Escaping. Alternates **`b44-svgheAU`** "Let's code: WordPress
  plugin security" (WordPress, 1:16:40, an official Learn WordPress workshop) and **`7p9TWoqvmp4`**
  (WPCasts, 13:41).
- `wp-caching-performance` → **`XNJr8eVqvV8`** "Micah Wood: The WordPress Developer's Guide to
  Caching" (WordPress, 53:51) — a WordCamp talk on the official channel with only 55 views, but it
  is the only free long-form treatment of object cache vs transients vs page cache aimed at
  developers. Alternates **`VO4MozDqL90`** (Imran Sayed, 6:37, the concise version) and
  **`zDix8THVpA8`** "How To Fix A Slow WordPress Site" (WPCasts, 35:15).
- `wp-woocommerce` → **`NdlYa0P_VlA`** "Joshua Michaels — Customizing WooCommerce the Right Way
  Using Action and Filter Hooks" (Chicagoland WordPress Meetups, 1:00:07, 33.8k views). A real
  meetup talk whose spine is exactly the templates-vs-hooks tradeoff. Alternates **`8ed8_bqcZW4`**
  "Customizing WooCommerce with Confidence" (WooCommerce official) at **2304s "WooCommerce Hooks"**,
  and **`O4cedT4sm2c`** "Clean-up your old WooCommerce database with HPOS" (WordPress, 22:31,
  **Jul 2026**) for the HPOS migration angle.

`hbJiwm5YL5Q` (LearnWebCode, 3:44:47) is used three times as an alternate, at three different
chapters (992s, 9703s, 12241s). No primary video is reused.

Considered and rejected: `-h7gOJbIpmo` freeCodeCamp "How to Create a Custom WordPress Theme" (2:32:35,
1.1M views) and `KibbYf9avko` (4:27:14) — both 2018/2019 and teach the classic path without ever
saying it is the classic path, which is precisely the failure mode §10b warns about. `R4v_7hh4Yys`
freeCodeCamp 2025 and the CodeWithHarry crash courses are site-building, not development.
`cdpZQi0bEO8` (MyListing Club, HPOS) dropped in favour of the official WordPress upload.

## References

- Every URL checked with `check-urls.mjs`; all return **200** and all `webRefs` use the **final**
  URL after redirects.
- **The theme handbook has been reorganised.** Classic-theme pages now live under
  `/themes/classic-themes/`: `/themes/basics/template-hierarchy/` →
  `/themes/classic-themes/basics/template-hierarchy/`, `/themes/basics/the-loop/` →
  `/themes/classic-themes/basics/the-loop/`, `/themes/basics/template-files/` and
  `/themes/basics/including-css-javascript/` likewise. `/themes/templates/template-hierarchy/` is a
  *separate*, current (block-era) page and is the one used for `wp-bootstrap-template-hierarchy`.
- `/themes/block-themes/` and `/themes/block-themes/block-theme-setup/` both redirect away
  (to `/themes/getting-started/what-is-a-theme/` and `/themes/core-concepts/`). The stable
  block-theme reference is `/themes/global-settings-and-styles/` plus the block editor's
  `theme-json-living` page, which is what the module uses.
- `developer.woocommerce.com/docs/features/high-performance-order-storage/` redirects to
  `…/docs/features/**orders**/high-performance-order-storage/`.
- `https://wphierarchy.com/` returns **403** to the checker — the obvious interactive
  template-hierarchy diagram could not be shipped.
- **Deviation from the brief's "developer.wordpress.org first in each topic's list":** honoured for
  12 of 13 topics. `wp-woocommerce` leads with `developer.woocommerce.com` instead, because there is
  no WooCommerce section on developer.wordpress.org and leading with an unrelated core page would be
  worse than useful.
- **No interview-prep reference.** Same finding as `php-foundations`: there is no WordPress
  equivalent of `lydiahallie/javascript-questions` worth shipping. Not guessed at.
- **iframe previews:** every `developer.wordpress.org` page sends `X-Frame-Options: SAMEORIGIN`, so
  the whole official handbook falls back to the link-preview card. Same for `carlalexander.ca`,
  `kinsta.com` (CSP `frame-ancestors`) and `wpgraphql.com` (CSP). The only embeddable references in
  this camp are `10up.github.io`, `deliciousbrains.com`, `docs.wpvip.com` and every
  `developer.woocommerce.com` page.

## Facts verified

Checked on **2026-09-23**, against the project's own endpoints rather than from memory.

- **WordPress 7.1.2 is current stable**, released **22 September 2026**.
  `curl -s https://api.wordpress.org/core/stable-check/1.0/` marks `7.1.2` as `latest`, and
  `wordpress.org/download/releases/` lists 7.1.2 at the top with 7.1 and 7.0 as the shown branches.
  Nothing in the module's prose or quizzes depends on a WordPress version number, by design.
- **WordPress's minimum PHP is 7.4** — `api.wordpress.org/core/version-check/1.7/` reports
  `php_version: 7.4` for the 7.1.2 offer (and `7.2.24` for the 6.6–6.9 branches, `5.6.20` as
  recently as the 6.2 branch). PHP 7.4 has been end of life since November 2022, so WordPress's
  floor sits four major PHP releases below **PHP 8.5**, the current stable, with 8.4 in active
  support and 8.1 and earlier EOL. That gap is the one honest sentence the brief asked for; it is
  not asserted anywhere as a quiz answer because the floor moves.
- **`wp_enqueue_script()`'s 5th parameter** became `array|bool $args` in **6.3.0**, accepting
  `strategy` (`defer` / `async`), `in_footer`, `fetchpriority` and `module_dependencies`
  (`developer.wordpress.org/reference/functions/wp_enqueue_script/`). Used in `wp-enqueue` q2/q3.
- **`$wpdb->prepare()`** supports `%d`, `%f`, `%s` and, **since 6.2.0**, `%i` for identifiers
  (`wpdb::has_cap( 'identifier_placeholders' )`). The docs also state it strips and re-adds quotes
  around `%s`, which is the basis of `wp-wpdb` q3/q4 and `wp-security` q11.
- **`add_action()` is a one-line wrapper around `add_filter()`** — source quoted on
  `reference/functions/add_action/`, with `$priority = 10`, `$accepted_args = 1`. Basis of
  `wp-hooks` q1/q3/q4.
- **`wp_verify_nonce()`** returns `1` (0–12 h), `2` (12–24 h) or `false`, and the docs state "a
  nonce is valid for between 12 and 24 hours (by default)". Basis of `wp-security` q2.
- **`add_option()`'s `$autoload` default became `null` in 6.6.0**, meaning "let WordPress determine
  the value using default heuristics"; `true`/`false` are the explicit values and `'yes'`/`'no'` are
  the deprecated legacy strings. The module says "a size heuristic" without quoting a byte
  threshold, because the docs do not state one.
- **`theme.json` version 3** is the current schema generation and "works with WordPress 6.6 or
  later"; top-level properties are `settings`, `styles`, `customTemplates`, `templateParts`,
  `patterns`. Basis of `wp-block-themes` q7.
- **mu-plugins**: loaded "by PHP, in alphabetical order, before normal plugins"; do not appear in
  update notifications; **activation hooks are not executed**; and WordPress "only looks for PHP
  files right inside the mu-plugins directory… not for files in subdirectories", with a proxy loader
  file as the documented workaround. All four points quoted from
  `/advanced-administration/plugins/mu-plugins/`. Basis of `wp-plugins` q2/q3/q4.
- **`WP_Query` parameters** read from the class docblock via
  `?output_format=md`: `no_found_rows` is "Whether to skip counting the total rows found. Enabling
  can improve performance. Default false"; `fields` accepts `''`, `'ids'` and `'id=>parent'`;
  `cache_results`, `update_post_meta_cache` and `update_post_term_cache` are the three cache
  switches. Basis of `wp-loop-wp-query` q4/q6/q9/q11 and `wp-caching-performance` q7.
- **Action order in a typical request** read from `/apis/hooks/action-reference/` (last modified
  8 Sep 2026): `muplugins_loaded` → `plugins_loaded` → `setup_theme` → `after_setup_theme` →
  `init` → `wp_loaded` → `parse_request` → `pre_get_posts` → `wp` → `template_redirect` →
  `wp_enqueue_scripts`. The page states `after_setup_theme` is "the first action hook available to
  themes". Basis of `wp-bootstrap-template-hierarchy` q1/q3/q5.
- **Escaping functions** listed on `/apis/security/escaping/` with the rule "always escape when you
  echo, not before" and the "Always escape late" section: `esc_html`, `esc_js`, `esc_url`,
  `esc_url_raw`, `esc_xml`, `esc_attr`, `esc_textarea`, `wp_kses`, `wp_kses_post`, `wp_kses_data`.
- **HPOS** creates `wc_orders`, `wc_order_addresses`, `wc_order_operational_data` and
  `wc_orders_meta`, and "from WooCommerce 8.2, released on October 2023 … is enabled by default for
  new installations", with a compatibility mode that syncs posts/postmeta against the new tables.
  Quoted from `developer.woocommerce.com/docs/features/orders/high-performance-order-storage/`.
  Basis of `wp-woocommerce` q2/q3.

## Deliberately not asserted

- The exact WordPress version that removed `SQL_CALC_FOUND_ROWS` from `WP_Query`. The 6.1 field
  guide and Trac #47280 discuss it, but no single authoritative line was found, so
  `wp-loop-wp-query` q4 describes `no_found_rows` in terms of *skipping the count* (which the
  docblock states verbatim) rather than naming a SQL construct.
- The byte threshold behind 6.6's autoload heuristic — documented as "default heuristics" only.
- Whether classic themes remain submittable to the theme directory; the distractor in
  `wp-block-themes` q4 was rewritten to "can no longer receive block editor support", which is
  unambiguously false.
- Any current WordPress version number inside a quiz answer, per §10b's standing warning.
