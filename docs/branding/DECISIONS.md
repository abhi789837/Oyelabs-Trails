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

## Phase 6: Emails, notifications, sharing

- **What email exists.** Four emails, all through `email_outbox` and `server/src/v5/email/sender.ts`, all off
  unless SMTP is set up: the learner weekly recap and the reminder copy (notify/jobs.ts), the admin weekly
  report (admin/weeklyEmail.ts) and send-to-laptop (lesson/sendToEmail.ts). There are no invite or
  password-reset emails (accounts and resets are admin-only, Phase 3). A **certificate-earned** email is new
  (below), because a hook already existed.
- **One layout** (`server/src/v5/email/layout.ts`, `brandEmail(origin, body)`). Builders return only a body
  (`EmailBody` in `shared/emailParts.ts`: subject, preheader, body HTML, text); the layout adds the frame, so
  no email can skip it, and TypeScript rejects storing a bare body (the field is `bodyHtml`, the outbox
  wants `html`). The kit's `08-email` has only a signature, no message template, so the frame follows the
  05-web email headers and the signature's "logo + Role · Oyelabs" pattern:
  - header: `email-header-light@600w.png` (`@1200w` as the 2x `srcset`), copied byte-for-byte from the
    kit into `public/brand/email/`, linked absolutely on `PUBLIC_ORIGIN` with `?v=1`. The dark header sits
    beside it, hidden, and a `prefers-color-scheme: dark` block swaps them (Apple Mail, iOS Mail, Outlook
    for Mac); Outlook desktop never sees the dark copy (`<!--[if !mso]>`). Elsewhere the light header
    shows, the kit's default. The same block turns Cloud/white/Night Navy into Night/navy surface/light text;
  - Cloud page, white card with the theme border, Night Navy text, Slate secondary text, Oyelabs Blue
    table-based ("bulletproof") buttons (white text 5.2:1) and links, Outfit then Arial;
  - footer: the mark (`oyelearn-mark-light@64w.png` at 24 px, dark variant swapped the same way, `alt=""`
    because the words follow) and "Oyelearn · by Oyelabs", then "Learning never closes." and the origin;
  - `lang="en"`, `color-scheme` meta, `role="presentation"` on every layout table, alt on every image,
    a hidden preheader, and the text part kept with the same footer after a `-- ` signature line;
  - amber only for a win: the certificate email has a 4 px amber rule under the header.
- **Builders moved to body parts.** `reminderEmail`, `buildWeeklyRecap`, `weeklyReportEmail` (now with an
  "Open Reports" button when it knows the URL) and `continueOnLaptopEmail` use the shared parts; the old
  palette (#1F5FBF, #F5F6F2, Inter) is gone from email. The weekly report reads the origin from
  `PUBLIC_ORIGIN` (`publicOriginFromEnv`, same default as env.ts), so its callers didn't change.
- **Certificate-earned email** (`server/src/v5/email/certificateEmail.ts`). The hook is the
  `certificate.issued` notification that `issueCertificate` already sends: `lib/notify.ts` (whose comment
  always said "adding a notifier means changing here") passes each notification to
  `emailCopyOfNotification`, which acts only on that kind, finds the certificate from the link, and queues
  one email per certificate (not for revoked ones, not for inactive users, nothing when email is off). It
  never throws, so issuing can't fail because of email. The certificate code itself is unchanged.
- **Serving the images.** `/brand/email/*` and the OG images get `Cross-Origin-Resource-Policy:
  cross-origin` (helmet's default `same-site` would let a mail app's web view refuse them) and the brand
  cache header; the brand path pattern now accepts `@` (and `%40`) in file names (lib/brandIcons.ts).
- **Toasts.** The one sonner surface (`AppToaster`, which also renders `v5Toast`/`lessonToast`) was the
  inverted popover (Night Navy in light); the outcome icons were tuned for a light surface and fell under
  3:1 on it. It is now the brand card: surface, theme border, Night Navy text, Outfit title, semantic icon
  colours, actions in Oyelabs Blue. The old UI's camp/summit `CompletionToast` uses the same card with a
  4 px amber left edge (a win). Certificate and level-up celebrations were already amber (Phase 4 made
  every celebration badge amber, animated and reduced-motion), so they weren't touched here.
- **Bell.** The new-count badge is Oyelabs Blue (it was danger red, but an unread count isn't an error),
  unread rows get a blue dot, and each row has a kind badge: certificates (`certificate.*`) and level-ups
  (`*level_up*`) on the amber tint with an amber left edge, everything else a blue bell. Unknown kinds fall
  back to the bell.
- **Link previews per page type** (`server/src/lib/ogPages.ts`). Every page keeps index.html's default
  (og-image-blue as `/og-image.png`). `GET /verify/:id` is now served by the server (when the build exists)
  with its head rewritten: `<title>`, description, og:url/title/description/image/image:alt (and size)
  and the twitter:* twins. A valid certificate shows "<Title>: certificate for <Holder> · Oyelearn" and
  its own PNG, the certificate code's public `GET /api/v5/certificates/:id/preview.png` (1754 × 1240,
  only while valid); revoked, changed or unknown codes get a plain preview with the default image and no
  name. Only `<title>` and `<meta>` are touched, so index.html's inline scripts, and with them the CSP
  hashes, are byte-for-byte the same (a test hashes both). Rate limited (120/min), `no-cache`, and on any
  error it sends the default head. `ogDeps.certificateImage` is the one place that names the PNG URL.
- **Not done.** No per-page OG for in-app pages (they need a session, so crawlers only ever see sign-in).
  The From name is whatever `MAIL_FROM` says: under Needs Abhishek.

## Phase 4: Shells and every screen

- **Logo rule in the shells.** Learner (src/v5/app/shells.tsx), admin (src/v5/admin/shell/AdminFrame.tsx)
  and the old UI (TopBar, AdminLayout, MobileNav, the footer) import `Logo`/`Mark` from their own files.
  The full primary logo is 24 px tall (102 px wide, over the 96 px minimum); a phone header, and the
  admin's icon rail (768–1279 px or "Collapse"), show the `Mark` instead. A breakpoint class on `<Logo>`
  itself doesn't work (its own `inline-flex` beats `hidden`), so a wrapper span carries it; otherwise the
  mark and the logo both showed, which reads as an extra "O". The learner header keeps the computed
  clear space; the denser admin and old headers pass `clearSpace={false}` and keep the half-ring gap
  with their own padding.
- **Admin label.** A small Mist pill "Admin" (old UI: "Admin console") sits next to the logo/mark, inside
  the home link ("Oyelearn admin, Inbox"). Nav actives are `bg-brand-soft text-brand-fg`; the learner's
  bottom bar gets the admin's pill behind the active icon and the safe-area padding.
- **Text logos replaced.** The old dashboard's `<h1>Oyelearn</h1>` is the tagline lockup (its alt keeps
  the heading's name, which v5-foundation looks for); the old mobile sheet title is the logo; the
  footer's mark + "Oyelearn · by Oyelabs" text is the endorsed lockup (the mark followed by "Oyelearn"
  was the forbidden extra O). The v5 assessment frame, results and sheet, and /design's AppShell, use the
  brand files directly. No old logo files or "Oyelabs Trails" strings remain in src. "Trails" is left
  where it is the trail metaphor (the old sidebar's and palette's list of tracks, course content).
- **Progress is amber, in the dot motif.** v5 `ProgressBar` gains a `progress` tone (now the default):
  the fill stops a small gap short of the value and the dot sits at it (none at 0 or 100%). `brand`
  stays for the app's own work (uploads). The goal ring, course cards (Library, course page) and /design
  use the brand `ProgressRing`, which gained centre content and a one-off CSS draw-in (`brand-ring-fill`,
  stilled by `data-motion="reduce"` and the OS setting). v5's old SVG ring is gone; the `@/v5/design`
  barrel re-exports the brand one. Skill meters, the lesson playlist's watched bar, the plan week bar and
  the walked part of every trail are amber; done ticks stay success green.
- **"You are here".** The trail's current stop is the mark's amber dot: v5 `Waypoint` fills its marker
  with the dot (amber border and pulse); the plan's week trail and route add `HereDot` just ahead of the
  stop, where the mark's dot sits; the labels are `text-progress-fg`. The course page marks the lesson
  "Continue" opens with the dot ("You are here:" for screen readers).
- **Weekly summit.** `src/v5/motivation/SummitRing.tsx` draws the guideline's celebration from the kit's
  geometry: the amber ring closes (70% → 100%) while the dot pops, then opens again, 1.6 s, once.
  `Celebration` takes a `badge` that replaces its icon circle; the host passes the ring for
  `weekly_summit`. Reduced motion (and the static celebration) shows the still mark. Other wins' icon
  badges are on the amber tint, not success green.
- **Empty states.** `ContourBackground` (same name and props, so callers didn't change) now draws the
  ring device: the mark's rings in Oyelabs Blue/Sky at 8%, large and partly off the edge, placement by
  `seed`. That covers every v5 `EmptyState`, the assessment frame and results, and the verify page.
  The old data-table empty state gets the device at 7%. The topographic contours remain only in the old
  dashboard hero and the certificate art (Phase 5).
- **Buttons, links, focus.** v5 Button gains `achievement` (amber fill, Night text) for "Claim
  certificate" / "Level up" only, shown on /design; nothing else is amber. In the old UI every
  `outline-trailmark` focus ring is now `outline-primary-strong` and every amber link underline
  (`decoration-trailmark`, the old Button's `link` variant) is blue; the playlist's amber "Play now"
  is the primary button and the password-strength "fair" step uses the warning colour. Track accent
  classes (src/lib/accent.ts) are unchanged.
- **Charts.** Recharts (admin overview and reports) take series from `SERIES`: Oyelabs Blue, then
  `--v5-chart-2` (Night Navy; a light Sky tint in dark, where navy disappears). Amber only as an
  optional dashed `target` line. Me's XP bars are blue with this week, the learner's own, in amber.
- **Bundle.** On top of Phases 5 and 6: lesson 198.5 KB, /design 228.3 of 230, plan 196.4, course page
  193.5, admin 221.4, entry 93.8. EmptyState swaps the contours for the ring device at no cost, and the
  shells import the brand files directly instead of the old logo wrapper.
- **Checked** in light and dark at 390, 768 and 1440 px with v5-visual on a private snapshot (HEAD + this
  phase's files, since the certificate and email agents' work in progress didn't build). Every screen
  differs from the old baselines (fonts and colours since Phase 1), so the baselines were re-shot
  (`v5-visual.ts --update`). Gates: tsc, eslint, 2917 unit tests, build and size green; v5-today,
  v5-lesson, v5-learner-pages, v5-admin, v5-mobile-learner, v5-mobile-admin, v5-a11y, v5-design and
  v4-departments (UI_V5_DEFAULT=off) pass. v5-foundation fails one check, "verify page renders": it
  looks for the heading "Check a certificate", which Phase 5's verify page renamed "Verify a
  certificate" (not a Phase 4 change; the script needs the new name).
- **Old UI badge contrast.** The old `Badge` `progress` tone's #B45309 text on its amber tint is
  4.49:1 (axe, v5-mobile-admin on an old learner page); light mode now uses amber-800 #92400E.
- **Shared file.** This phase's change to `src/v5/learner/me/MePage.tsx` (the XP chart's colours) went
  in with the Phase 5 commit, which edited the same file.


## Phase 5: Certificates

- **One template, drawn by the server.** `server/assets/certificates/certificate-template-a4.svg` is the
  kit's `09-print` file byte for byte (a test compares them). `template.ts` parses it (the small SVG subset
  the kit uses; anything else throws), keeps every element as it is (white page, the faint ring device off
  the bottom-right corner, the Oyelabs Blue + Mist double border, the primary logo, the two signature
  rules, the ring seal) and drops its ten outlined placeholder texts, which are set again in Outfit at the
  kit's sizes, colours and centres (measured from the glyph outlines: heading 30/600 tracked 0.18em in
  Slate, lead 28/400, name 84/600 Night Navy, title 48/600 Oyelabs Blue, date and signature 24/600 over
  18/400 labels, verify 16/400 #8A98AD). The QR (error correction M, Night Navy) sits bottom left inside
  the inner border, clear of the date block, since the kit leaves no slot for it.
- **Renderer: `@napi-rs/canvas` (Skia), no new runtime dependency.** It is already a production
  dependency (document extraction) with a prebuilt linux-x64-gnu binary for the Docker image, and its
  `PDFDocument` is Skia's PDF backend, so one drawing function makes both files: a vector A4 landscape PDF
  (text stays real, selectable text; the verify line and the QR are links) and a PNG on a raster canvas.
  `@react-pdf/renderer` in Node was the alternative, but it would mean a second layout of the same
  template. Loaded at run time like extraction (`runtimeImport`), so it is never bundled.
- **Fonts.** Skia embeds a static TrueType font as a real subset font (`FontFile2`), but a variable font
  only as Type3 outlines, and the app's `@fontsource-variable/outfit` is variable WOFF2. So the three
  static weights (Outfit-Regular/Medium/SemiBold.ttf, 2021 The Outfit Project Authors, SIL OFL 1.1, with
  `OFL.txt`) are committed under `server/assets/certificates/fonts/`, from the upstream
  Outfitio/Outfit-Fonts repository. Nothing was installed. `scripts/build-server.mjs` copies
  `server/assets/` next to the bundle (`dist-server/assets/`), which the Dockerfile already ships.
  Outfit covers Latin; a name in another script would need a fallback font (none in the slim image).
- **Sizes.** PDF: A4 landscape (Skia rounds to 842 × 595 pt). PNG: 2× the template, 3508 × 2480, for
  download and sharing; a 1× 1754 × 1240 preview for the verify page and link previews (Phase 6's OG
  tags use it).
- **Long names and titles** shrink first, then wrap: name 84 → 52 on one line, then two lines 64 → 44,
  then three 44 → 34; title 48 → 34, two lines 40 → 30, three 30 → 24 ("wraps at most twice"). Lines are
  balanced (the narrowest width that keeps the line count), a word wider than a line breaks between
  letters, the block below moves down and stays above the seal (tested), and only text that can't fit
  three lines at the smallest size is cut with "…". Date and signature fit one line in 300 px.
- **Wording by kind.** Course: "has completed" (the kit's words). Track (a path): "has completed the
  path". Goal: "has reached the goal". "Course, path or level": a level-up has no certificate of its own
  today; the kinds stay course, track (path) and goal, issued by the existing `syncCertificates`.
- **Files and idempotence.** `files.ts` keeps `DATA_DIR/certificates/<id>.<key>.{pdf,png,preview.png}`;
  the key hashes everything printed (the record's hash, so the holder's name and title; the signature;
  the public origin in the QR; `TEMPLATE_VERSION`). Requests serve from disk; a corrected name, a new
  signature or a template change gives a new key, the next request draws it again and the old files are
  deleted. Concurrent requests share one draw; writes go through a temp file and a rename. On issue and
  on a name correction the routes draw all three straight away (`onCertificateChanged`, off the request;
  skipped in unit tests). No migration: the files live on the volume and the signature in `app_meta`.
- **Ids.** The first v5 codes were 40 bits (`OYL-XXXX-XXXX`). New ones are 80 bits
  (`OYL-XXXX-XXXX-XXXX-XXXX`, Crockford base32), since the code alone unlocks a public page and a public
  image. Old codes (and the older browser `OYL-FE-…` ones) still match `CERTIFICATE_ID_RE` and verify.
- **Routes.** Learner: `GET /api/v5/certificates/:id/file.pdf|file.png[?download=1]` (own only, 410 once
  revoked). Public, rate limited: `/:id/public` (unchanged, minimal data) and `/:id/preview.png` (valid
  only; 410 when revoked or changed, `public, max-age=300`). Staff: `GET /api/admin/v5/certificates`
  (now with the signature), `/:id/file.pdf|png`, `POST /:id/regenerate` (audited), `GET|PUT /signature`
  (audited), `GET /report.pdf`. `MyCertificate` and the Me profile carry `verifyUrl` on PUBLIC_ORIGIN, so
  the QR, "Copy verify link" and LinkedIn all use the configured origin, not the browser's.
- **Learner.** `/learn/certificate/:id`: the ring seal next to the heading plays the summit moment once per
  browser (the amber ring closes, the dot pops, the ring opens again; the still mark under reduced motion,
  the system's or the learner's setting), plus the existing v5 `celebrate("certificate")`. Shells and
  progress components untouched. The preview card is the server's PNG with Download PDF, Download image,
  Copy verify link, Add to LinkedIn ("Oyelearn – <Course>", Oyelabs, issue month/year, credential URL and
  id) and the check page. The name form stays (it redraws every current certificate). Me → Certificates
  (`#certificates`) lists them with the same PDF/image downloads and LinkedIn. The browser no longer draws
  certificates: v5's `CertificateArt`, `art.ts`, `pdf.tsx`, `qr.ts`, `shareImage.ts` and the old UI's
  `components/certificate/*` and `lib/certificate.ts` are deleted. The old `/report/:trackId` page now
  opens the server's certificate for that track (or says it isn't issued yet).
- **Verify page** (`/verify/:id`, no login): the primary logo; "This certificate is valid ✓" with the name,
  the course, the date, "Issued by Oyelabs" and the preview picture; "This certificate was revoked" (date
  only, no name, no picture); "Certificate not found" with the code tried. `VerifyView` is pure and its
  states are unit tested with `renderToStaticMarkup`.
- **Admin** is a Certificates section at the end of Reports (`/admin/reports#certificates`), so no shell or
  nav change: find by name/course/code, Open PDF, Draw again, Revoke (with a confirm step) / Make valid
  again, "Download list (PDF)", and "Signature on certificates" (name and job title, with a live
  "Prints as" line). With no name set the block prints "Oyelabs" over "Issued by"; nothing invents a
  person.
- **Report PDFs (5.6).** The app had no PDF reports (Reports exports CSV). `reportPdf.ts` adds the branded
  frame every PDF report uses (the kit logo from the template, the title and a subtitle top right, a Mist
  rule; the footer "Oyelearn, the learning platform of Oyelabs" and "Page N of M"; Outfit embedded) and the
  first report on it: the certificates list (A4 landscape, paged).
- **Left for later.** `@react-pdf/renderer`, the Sora/IBM Plex TTFs in `src/assets/fonts` and vite's
  `chunkSizeWarningLimit` comment about the PDF chunk are no longer used by certificates: remove in
  Phase 7. `/design`'s `CertificatePreview` demo (Showcase) is a stand-in drawing; Phase 4/7 may swap it
  for the kit picture.
- **Tests.** `server/src/v5/certificates/brand.test.ts` (template parse and byte check, fitting long names
  and titles, PDF fonts/size/link/text, PNG sizes, the QR read back from the PNG module by module against
  the verify URL, the report, and the routes: downloads, idempotent files, name correction, verify
  valid/revoked/unknown, admin signature/regenerate/report); `src/v5/learner/certificate/certificate.test.ts`
  (codes, LinkedIn, file URLs, the verify page's states). `scripts/e2e/brand-certificate.ts` (port 8967)
  passes, as do v5-assessment (its certificate part updated to the server files), v45-oyelabs-flow and
  v5-motivation on snapshot `brand5`.

## Phase 7: Clean-up, checks, deploy notes

- **Old fonts and the browser PDF library uninstalled.** `@fontsource/sora`, `@fontsource/ibm-plex-sans`,
  `@fontsource/ibm-plex-mono`, `@fontsource-variable/geist` and `@react-pdf/renderer` had no importer
  (`npm uninstall`, 55 packages fewer). `src/assets/fonts/` (Sora and IBM Plex TTFs for the old
  browser PDF) and `scripts/woff2ttf.mjs` (its converter) are deleted. JetBrains Mono and Outfit stay.
  Stale comments fixed: vite.config.ts (the chunks over 500 kB are now Monaco's, loaded only with a code
  editor; the 1.3 MB warning limit stays so anything else that big is still flagged), the v5 design
  barrel and V5App font notes. `scripts/perf/chunks.mjs` HEAVY no longer lists `generateCertificatePdf` /
  `react-pdf`; check-heavy's description and v5-pwa's "heavy libraries are not precached" regex follow.
- **The old logo kit folder is deleted.** `Oyelearn-Logo-Kit/` (115 files, the Sora-era logos) was
  referenced only by docs/v5/CODEMAP.md (now points at `public/brand/` and `Oyelearn-Brand-Kit/`) and two
  `.dockerignore` lines (kept: they only exclude it). Nothing in src, server, scripts or the Dockerfile used
  it. The untracked `Oyelearn-Brand-Guidelines.pdf` at the repo root is a byte-identical copy of the kit's
  PDF; left alone (not ours to delete).
- **Old colours.** No old-palette hex remains in components: the hex left in src is the kit's own
  colours (brandAssets, Monaco's theme, the confetti, /design's swatches, SummitRing), the badge's
  amber-800 and the markdown code block's three syntax colours on a dark surface (Phase 1). No "Trails"
  brand name remains; "Trails" in the old sidebar and command palette is the list of tracks (the trail
  metaphor, kept as in Phase 4).
- **/design CertificatePreview** is the server's own drawing now, not an HTML stand-in:
  `scripts/brand/certificate-sample.ts` renders `public/brand/certificate/certificate-sample.png` (1754 ×
  1240, "Rahul Mehta", path "Backend foundations", unsigned, a sample code that never verifies) with
  `renderCertificatePng`, and the component is an `<img>` on white. Props are now `src`/`alt` (it can
  show any server certificate picture). Re-run the script after a template change; the logo-rule test
  checks the file exists at the right size.
- **Amber audit (the old UI's `trailmark`, "amber only for progress and achievement").** 33 uses changed,
  where amber meant something else:
  - warnings and attention → the warning token: alert icons (`AlertTriangle`/`TriangleAlert`/`CircleAlert`
    in admin overview, AI, evaluation, pool, research settings, generated courses, path priorities, video
    gate), the notification "attention" tone, integrity timeline soft events, the proctoring warning toast,
    AI-usage and role-play "near the cap" bars and cards, the timing chart's "over estimate" segment, setup
    over-length and "rules only" notes, V4 results warnings, the code runner's "Edge case" tag;
  - selection and navigation → Oyelabs Blue: the old notification count badge (as v5's in Phase 6), the
    playlist's Autoplay switch, the admin learner tabs' underline, the assessment's selected answer
    (border, number chip and native radio accent), the quiz's "Select all that apply".
  Kept, as progress or achievement, or recorded for the old UI's retirement: in-progress status dots,
  waypoints, the trail map, "You are here", the old sidebar's current-route marker (the trail's
  "you are here"), plan/people progress bars, the video playlist's watched bar, pre-flight's current step,
  the completion toast; the Frontend track's accent (src/lib/accent.ts, unchanged since Phase 4); priority-4
  chips in goal/plan setup (a ranking colour scale), handbook "To confirm" chips, review-request "open",
  role-play speaker badges, the article tag in ResourceKindTag and the milestone flag in the old Library.
  These are in the old UI, which retires; v5 already uses `progress` only for progress.
- **Logo-rule test** (`src/components/brand/logoRules.test.ts`): scans every `.tsx` in src (lesson
  content excluded) for (1) `<Mark>`, `<Logo variant="mark">` or a mark `<img>` followed, through spaces,
  `{" "}` and tags only, by "Oyelearn"/"yelearn"; (2) any string naming the old kit folder or its seven
  files (also index.html and the manifest); (3) an element whose whole content is "Oyelearn"/"yelearn"
  when it is a heading or has a logo-like class (`logo`, `wordmark`, `font-display`, `font-brand`,
  `brand-name`, `text-display`). It tests its own rules on good and bad snippets first, so a sentence like
  "Welcome to Oyelearn" or "Oyelearn · by Oyelabs" never trips it, and colour alone (`text-brand-fg`) isn't
  a logo. It also checks the old kit folder and files are gone.
- **Hashed build files are immutable (server).** `/assets/<name>-<hash>.<ext>` was sent with
  `@fastify/static`'s `max-age=0`, and Caddyfile.example's `@hashed` rule (`.hash.` names) never matched
  Vite 8's `name-hash.ext`. The app now sends `public, max-age=31536000, immutable` for those names
  (`HASHED_ASSET_PATH`, only on a 200 that isn't HTML, so the SPA fallback for a missing asset isn't
  cached), and the example's regex is fixed. This covers the brand font.
- **Email image with an encoded "@".** `/brand/email/…%40600w.png` fell through to the SPA (index.html,
  200), because the static routes are the literal names. The not-found handler now 301s a `/brand/` path
  written with `%40` to its real name (`brandFileRedirect`). Emails themselves write "@".
- **E2E.** brand-auth.ts now also requests every file under `public/brand/` (200, image type, the day's
  cache), the encoded-@ redirect, the font's immutable header (and a missing asset's lack of it), and
  checks the manifest's id, 192/512 icons and icon types. `scripts/e2e/brand-visual.ts` (port 8968) is new:
  login, Today, My plan, a lesson, admin inbox, the certificate page, /design's certificate sample, verify
  and the 404 at 390 and 1440, light and dark, each asserting `<html>`'s dark class; baselines in
  `docs/branding/shots/`. The certificate pictures are answered with the fixed sample (each run's code
  and QR are random). The 404 is the previous design's (v5 redirects unknown paths), opened as staff with
  `?ui=old`. v5-visual.ts masks the server certificate pictures for the same reason.
