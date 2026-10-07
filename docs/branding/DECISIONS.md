# Rebrand decisions

## Step 0.1: brand rules (from `Oyelearn-Brand-Guidelines.pdf`, 12 pages, and the kit README)

The PDF is the rulebook; where this summary and a prompt disagree, the PDF wins.

**Idea.** "Learning never closes." The outer blue ring (two breaks) is Oyelabs. The amber inner ring is
the learner's progress, about 75% drawn with rounded ends; the amber dot just ahead of it is "you are
here"; the opening means there's always a next level. The whole mark is the **O** of Oyelearn.

**Lockups (p4).** Primary (mark + "yelearn"), Endorsed (primary + "BY OYELABS" under the right end),
With tagline ("LEARNING NEVER CLOSES" under the wordmark), and the Mark alone (app icon, favicon,
avatar). "ye" is set in Oyelabs Blue and "learn" in Night Navy on light.

**Clear space and size (p5).** Clear space on every side = half the ring's height. Minimum sizes: the logo
96 px wide (24 mm), the mark 16 px (5 mm). Below 96 px wide, use the mark.

**Colour (p6), "Blue leads. Amber celebrates."**

| Name | Hex | Use | Share |
|---|---|---|---|
| Oyelabs Blue | #2067D3 | primary | 60% |
| Night Navy | #0B2347 | text and dark surfaces | 25% |
| Amber | #F59E0B | progress and wins only | 10% |
| Sky | #5F93E3 | blue on dark | |
| Night | #0A1428 | dark backgrounds | |
| Mist | #E1EBFA | tints and surfaces | |
| Cloud | #F4F7FB | page background | |
| Slate | #5B6B82 | secondary text | |

**Type (p7).** Outfit (SIL OFL): Display 72/600, Heading 48/600, Title 32/600, Body 22/400 (16–22),
Label 16/500 tracked (upper case, wide letter-spacing). JetBrains Mono for code.

**Backgrounds (p8).** `light` on white/Cloud; `dark` on Night (Sky outer ring and "ye", white "learn");
`on-blue` on Oyelabs Blue (white ring and wordmark, amber inner ring kept); one-colour `black`
(navy) on light and `white` on navy/dark. **Never on amber.**

**Don'ts (p9).** Stretch or squash; rotate; change the colours; add shadows or effects; add an extra
"O" after the mark; place on a low-contrast colour.

**App icon and favicon (p10).** Blue is the default app icon; Night for dark-mode stores and the PWA;
white is the third option. The mark alone works down to 16 px as a favicon.

**In use (p11).** Sign-in: Oyelabs Blue left panel with the `on-blue` logo top-left, large faint rings,
"Learning never closes." + "Your plan, your pace — built for the Oyelabs team." at the bottom; right side
Cloud with the primary logo, "Welcome back", "Sign in to continue your plan.", Username, Password and a
full-width blue "Sign in" button.

**Motion (p12), "The ring keeps moving."** Loader: the amber ring draws, spins and releases but never
fully closes. Progress: the inner ring fills to the learner's real progress, with the dot at the tip.
Celebration (summit): the dot pops and the ring completes for a moment, then opens again.

### How we apply them in code
- Logos are only ever the kit SVGs from `public/brand/` (or the kit's own mark path data in
  `<Mark>`, copied verbatim from `11-code/OyelearnMark.tsx`). Nothing re-types the wordmark.
- Amber is a token named for its job (`progress`/`accent`), never a button, link or large
  background. Amber text on a light surface uses #B45309 (amber-700); on dark, the #F59E0B fill.
- One identity: the old `Oyelearn-Logo-Kit` files are removed from `public/brand/` when nothing
  outside Phase 5 (certificates) uses them; see the Phase 1 entries below.

## Phase 1: Foundation

- **Assets.** `public/brand/`: `logo/` (primary, endorsed, tagline × light, dark, on-blue, white, black),
  `mark/` (5 colourways), `app/` (app-icon blue/dark/white, SVG + PNG), `social/` (og-image blue/dark/light),
  `loader.svg`, `signin-side-panel.svg`. All copied byte-for-byte from the kit (a unit test compares
  them). The old kit's seven files (`oyelearn-{horizontal,mark,stacked}-*-mode.svg`, `mark-mono-white`)
  are deleted, so the two logos can't appear together.
- **One logo component, two old APIs.** `src/components/brand/Logo` is the only thing that renders the
  logo. The old UI's `components/layout/Logo` (horizontal/mark/stacked) and v5's `design/components/Showcase`
  `Logo` now delegate to it (horizontal → primary, stacked → endorsed, mark → Mark), so every existing caller,
  including the shells we must not edit yet, shows the new logo with no change of its own. The old API's
  `horizontal` is held at ≥ 23 px tall (96 px wide) so it never silently turns into the mark.
- **Theme `auto`** renders the light and the dark file; CSS (`.brand-only-*` in src/index.css) shows the one
  under the nearest `.dark` / `.v5-light`. index.html sets `.dark` before first paint from the saved theme
  or prefers-color-scheme, so it is right on first paint with no script and no store dependency.
- **Clear space** is computed (half the ring: 145 of 190.8 units in primary, of 222.8 in endorsed/tagline)
  and applied as padding when `size` is given. With a class-sized logo (v5's `className="h-7"` callers)
  the size is unknown, so the caller owns spacing and the 96 px rule; all current callers are ≥ 28 px tall
  (≥ 119 px wide) except the certificate preview (Phase 5).
- **Mark** is inline SVG with the kit's path data verbatim; outer ring `currentColor` via `text-primary`,
  which is Oyelabs Blue / Sky in both designs and follows /design's nested previews.
- **Amber fill in light is #CD7006, not #F59E0B.** #F59E0B is 2.15:1 on white and #D97706 2.96:1 on Cloud,
  so neither can be a meaningful mark under WCAG 1.4.11. The light `progress` (v5) and `trailmark` (old UI)
  fill is #CD7006 (3.55:1 on white, 3.07:1 on the sunken track; Night text on it 5.17:1); amber text is
  #B45309. Dark uses #F59E0B itself. The logo and mark keep the kit's #F59E0B (logos are exempt).
- **Tokens.** Global (src/index.css): Cloud page, white cards, Night Navy text, Slate secondary text; dark
  is Night with navy-tinted surfaces. New `accent-50…950` amber scale, kit names as Tailwind colours
  (`oyelabs-blue`, `sky`, `night`, `night-navy`, `mist`, `cloud`, `brand-slate`) and the kit's
  `--accent`, `--bg-dark`, `--muted` channel variables. `brand-950` is now exactly #0B2347. Warnings got
  their own `--warning*` variables instead of borrowing `trailmark`, since amber is for progress. v5
  (tokens.css) gets the same palette plus `progress`, `progress-fg`, `on-progress`, `progress-soft`;
  the contrast tests (src/lib/contrast.test.ts, src/v5/design/tokens.test.ts, now including `progress`)
  pass in both themes.
- **Old UI's `trailmark`** (the in-progress colour, also used for warnings in places and as the Frontend
  track's accent) now resolves to the brand amber. Its 200+ call sites aren't audited here; the old UI
  retires in two weeks and Phase 4/7 removes or reviews them.
- **Fonts.** `@fontsource-variable/outfit` (OFL, 5.3.0) installed: one variable latin file covers 400/500/600.
  Imported once from src/main.tsx (src/fonts/brandFonts.ts) because both designs and the sign-in pages
  use it, and preloaded for every page by a `<link rel="preload">` the build adds (vite.config.ts); the
  v5 boot script no longer preloads Geist/Sora. JetBrains Mono is the code font in both designs and
  Monaco. Sora, Geist and IBM Plex are no longer imported by the app. Their npm packages
  (`@fontsource/sora`, `@fontsource-variable/geist`, `@fontsource/ibm-plex-*`) are unused but still
  installed (this agent may only install); uninstall them in Phase 7. The certificate PDF still embeds
  Sora/IBM Plex TTFs from src/assets/fonts (Phase 5).
- **Type scale (v5).** `display` 40–72 px fluid, `heading` 32–48 px fluid, `title` 32 (= h1), body 16,
  lead 18, `label` 16/500 tracked 0.12em. h1–h4 unchanged in size.
- **Hard-coded hex.** Celebration confetti now uses blue + amber; Monaco's theme colours (it only takes
  hex) are the kit's. The remaining hex in src is lesson content, the certificate code (Phase 5) and the
  markdown syntax colours on the dark code block.
- **Certificate share image** (v5 `shareImage.ts`) pointed at the deleted old file; its path now loads
  `/brand/logo/oyelearn-light.svg` (one line, so no certificate shows a broken or old logo). The
  certificate art itself (`art.ts` mark geometry, Sora) is Phase 5.
- **/design** has a new first section, "Brand": every lockup on its allowed backgrounds, theme auto in light
  and dark, clear space and minimum size, the mark at 16–72 px, BrandLoader, ProgressRing and the don'ts.
  The Colour section adds the eight kit colours and the amber scale; the type table is Outfit's scale.

## Phase 2: Favicons, PWA, metadata

- **Files.** `public/`: favicon.ico, favicon.svg (switches to Sky in dark), favicon-16/32/48 PNGs,
  apple-touch-icon.png (kit 04-favicon); icon-192/512/maskable-512 (kit 03-app/pwa); og-image.png
  (= og-image-blue) and og-image-dark.png (the dark variant, available for Phase 6's per-page OG).
- **Manifest** keeps the v5 PWA settings (id and start_url `/learn`, scope `/`, standalone) with the kit's
  name, theme #2067D3, background #FFFFFF and the three PNG icons. The kit's favicon.svg isn't listed as
  an icon: v5-pwa.ts checks every icon is a PNG of its stated size, and the PNGs cover installs.
- **Cache-busting.** index.html links the favicons, apple-touch icon and OG image with `?v=2`, and the
  manifest's icon URLs carry it too. The manifest link has no query: it is always sent no-cache, and
  v5-pwa.ts checks the exact `href="/site.webmanifest"`. The service worker matches precached files by path, so the
  query doesn't break offline. Its `PUBLIC_PRECACHE` adds the 16/32 favicons.
- **Caching.** The server still sends the manifest and sw.js `no-cache`. Favicons, app icons, OG images
  and `/brand/*` now get `public, max-age=86400, stale-while-revalidate=604800`
  (server/src/lib/brandIcons.ts, used in app.ts `onSend`), instead of @fastify/static's `max-age=0`.
- **theme-color** #2067D3 (light) and #0A1428 (dark) by media query; `application-name` and
  `apple-mobile-web-app-title` are "Oyelearn".
- **OG/Twitter.** Absolute URLs on https://learn.oyegen.com (crawlers need them), 1200×630, alt text
  "Oyelearn: learning never closes."; description "Learning never closes. The internal learning
  platform for the Oyelabs team."
- **Titles.** "<Page> · Oyelearn" (was "<Page> | Oyelearn"; v5 admin was "<Page> · Oyelearn admin"),
  one helper in src/lib/pageTitle.ts. Pages that name themselves still do (`useDocumentTitle`, v5
  `PageHeader`); every other route (most v5 learner screens set none) gets a title from its path via
  `RouteTitle` in App.tsx, which never overrides a page that set its own.
- **No mobile wrapper** (no Capacitor, Expo or Cordova in the repo), so the kit's iOS/Android icon
  sets in 03-app aren't used.

## Phase 3: Auth screens

- **One frame for every auth screen** (src/features/auth/AuthLayout.tsx), after
  05-web/signin-page-mockup: desktop (lg+) split 45/55. The left panel is Oyelabs Blue with the ring
  device (the mark's own paths, white at 14%, `RingDevice`), the `on-blue` logo top-left, and "Learning
  never closes." / "Your plan, your pace — built for the Oyelabs team." at the bottom. The right side is
  Cloud with the primary logo, the title, the form and a full-width primary blue button. On a phone it
  is one column: a 64 px blue band with the ring device, the endorsed logo, then the form. In dark mode
  the panel and band are Night with Sky rings and the `dark` logo, and the form side is Night Navy.
  The left panel is an `aside` labelled "Oyelearn"; the decorative band is `aria-hidden`.
- **Copy.** The sign-in title is "Welcome back", with "Sign in to continue your plan." under it. The old
  trail copy in the left column is gone. The no-sign-up / ask-your-admin note moved to the footer.
  Every field label, name, autocomplete, test id and button name is unchanged (the e2e `signIn` helpers
  find Username, Password, Sign in, Temporary/Current/New/Confirm password and Save password).
- **First-time password and change password** use the same frame ("Set your password" when forced,
  with that page title). **There is no forgot/reset password screen**: accounts and resets are
  admin-only, which the sign-in footer says.
- **Sign out** goes to the branded sign-in with "You're signed out. See you next time." (UserMenu
  passes `state.signedOut`, which both designs share).
- **Assessment pre-flight** (consent and proctoring checks), old and v5: a slim brand header
  (`BrandBand`: Oyelabs Blue + ring device + `on-blue` logo; Night + `dark` logo in dark mode) above
  the checks. It is a plain `div`, because PreFlight has its own `<header>` and two banners would be
  an axe finding.
- **Error and 404.** The old 404 shows the mark ("This page isn't here"); v5 has no 404 (unknown paths
  redirect), and its route error screen shows the mark above the message.
- **BrandLoader** replaces the spinner for full-page loading: the route fallback (lazy chunks), the
  auth guard's session check (before every auth redirect), and the in-shell screen fallback. Content
  skeletons are unchanged.
- **Bundle.** The brand components are imported from their own files, not the `@/components/brand`
  barrel: Rolldown made the barrel one shared chunk, which put ProgressRing and the auth band on the
  lesson route. ProgressRing's maths lives in `ringGeometry.ts`. With that, lesson is 199.6 KB, the
  entry 95.2 KB (below Phase 1's) and /design 229.6 KB, all under budget.
- **scripts/e2e/brand-auth.ts** (port 8966): favicons, icons, OG images and manifest all 200 with the
  right type and size, manifest valid with the v5 PWA settings, icon cache header; /login at 1440 and
  390 in light and dark (logo files per surface, panel or band, panel colour and width, Outfit, no
  horizontal scroll, axe 0 serious, a screenshot each); the forced first password on the same frame.
