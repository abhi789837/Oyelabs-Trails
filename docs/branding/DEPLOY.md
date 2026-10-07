# Rebrand deploy (brand-v1.0)

Same method as v4.5 (`docs/v4.5/DEPLOY.md`), which follows v5 (`docs/v5/DEPLOY.md`): Docker Compose on the
shared VPS behind the shared Caddy, with `scripts/deploy/deploy-v4.sh`. Read those for the server layout
(`~/oyelearn`, `docker-compose.override.yml` on `hypha_default`), the backup and the general checks. This file
lists only what the rebrand adds. Abhishek runs it.

**What the rebrand changes on the box:**
- **No migration.** None of the six rebrand commits touches `server/drizzle` (checked below). The certificate
  signature lives in `app_meta`, which already exists; certificate files are drawn on demand into
  `/data/certificates` on the existing `oyelearn-data` volume.
- **No new runtime dependency.** Certificates are drawn with `@napi-rs/canvas`, already in the image for
  document extraction. `@react-pdf/renderer` and the old font packages were removed (Phase 7), so
  `node_modules` is smaller.
- **New files in the image:** `server/assets/certificates/` (the kit template and three Outfit TTFs) is
  copied next to the bundle by `scripts/build-server.mjs` (`dist-server/assets/`); the Dockerfile already
  ships that folder. `public/brand/**`, the favicons, PWA icons and OG images ship in `dist/`.
- **New environment:** none required. `PUBLIC_ORIGIN` must be `https://learn.oyegen.com` (it already is):
  the certificate QR codes, verify links, OG tags and email images are built from it. `MAIL_FROM` decides
  the email From name (see "Needs Abhishek" in `RESULTS.md`).

## 0. Before you start (dev machine)

Commit Phase 7, tag, and push:

```bash
git tag brand-v1.0
git push origin main --tags
```

**The rollback point is `v4.5.0`, not `pre-rebrand`.** Production runs `v4.5.0`, which already contains
rebrand Phase 1 (tokens, Outfit, the logo components: commit ada6875 landed between v4.5's Phase 4 and
Phase 5). `pre-rebrand` is older than v4.5's last phase, so going back to it would also undo v4.5 Phase 5.
On the server, note what is running:

```bash
cd ~/oyelearn
git log -1 --oneline
git describe --tags                # expect v4.5.0
df -h /var/lib/docker
```

## 1. Back up the production database (`pre-brand-v1.0`)

The online backup from `docs/v4.5/DEPLOY.md` §1, with this file name:

```bash
cd ~/oyelearn
stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose exec -T oyelearn node -e "
  const D = require('better-sqlite3');
  const db = new D('/data/oyelearn.db', { readonly: true });
  db.backup('/data/backups/pre-brand-v1.0-$stamp.db').then(() => console.log('backup ok'));"
docker compose cp "oyelearn:/data/backups/pre-brand-v1.0-$stamp.db" "backups/pre-brand-v1.0-$stamp.db"
echo "$stamp"
```

## 2. Pull, build and start

```bash
cd ~/oyelearn
bash scripts/deploy/deploy-v4.sh
```

Then check there was nothing to migrate:

```bash
git diff --stat v4.5.0 -- server/drizzle      # expect no output
docker compose logs oyelearn --since 10m | grep -i "migrat" || echo "no migration (expected)"
```

## 3. Static files and their cache headers

What the app sends (server/src/app.ts `onSend`, patterns in server/src/lib/brandIcons.ts):

| Files | Cache-Control | Why |
|---|---|---|
| `/assets/<name>-<hash>.<ext>` (JS, CSS, the Outfit and JetBrains Mono fonts) | `public, max-age=31536000, immutable` | The name changes with the content. New in Phase 7: before it, the app sent `@fastify/static`'s `max-age=0`, and Caddyfile.example's `@hashed` rule expected a `.hash.` name Vite 8 doesn't write (fixed in the example too). Only a real file gets it: a missing asset (index.html fallback) is not cached. |
| `/favicon.ico`, `/favicon.svg`, `/favicon-{16,32,48}x…png`, `/apple-touch-icon.png`, `/icon-{192,512,maskable-512}.png`, `/og-image(-dark).png`, `/brand/**` | `public, max-age=86400, stale-while-revalidate=604800` | Stable names. index.html links them with `?v=2` (the manifest's icon URLs too), so a browser holding the old logo fetches the new one at once. |
| `/site.webmanifest`, `/sw.js` | `no-cache` | Always revalidated, so a new manifest or worker is found on the next visit. |
| `/brand/email/*`, `/og-image*.png`, `/brand/social/*` | as above, plus `Cross-Origin-Resource-Policy: cross-origin` | Mail apps and link-preview crawlers load them from other origins. |
| `/api/v5/certificates/:id/preview.png` | `public, max-age=300` | Public, valid certificates only (410 once revoked). |

An email image asked for with `%40` instead of `@` now redirects (301) to the file; before Phase 7 it got
index.html.

Check through the proxy (the hashed name comes from the page):

```bash
font=$(curl -s https://learn.oyegen.com/login | grep -o '/assets/outfit[^"]*\.woff2' | head -1)
curl -sI "https://learn.oyegen.com$font"                       | grep -i cache-control   # immutable
curl -sI "https://learn.oyegen.com/favicon.svg?v=2"             | grep -i cache-control   # max-age=86400
curl -sI  https://learn.oyegen.com/site.webmanifest             | grep -i cache-control   # no-cache
curl -sI  https://learn.oyegen.com/sw.js                        | grep -i cache-control   # no-cache
curl -sI "https://learn.oyegen.com/brand/email/email-header-light@600w.png?v=1" | grep -i -E "content-type|cross-origin-resource-policy"
for f in favicon.ico favicon.svg favicon-16x16.png favicon-32x32.png favicon-48x48.png apple-touch-icon.png icon-192.png icon-512.png icon-maskable-512.png og-image.png og-image-dark.png site.webmanifest brand/logo/oyelearn-light.svg brand/certificate/certificate-sample.png; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code} %{content_type}' "https://learn.oyegen.com/$f")" "$f"
done                                                            # every line 200 with an image/manifest type
```

## 4. Caddy

Nothing to change. Check the shared Caddy still answers for both sites:

```bash
curl -fsS https://learn.oyegen.com/api/health
caddy validate --config /etc/caddy/Caddyfile     # or inside the Caddy container on hypha_default
```

- Make sure Caddy doesn't override the app's cache headers on `/site.webmanifest`, `/sw.js` or the icons
  (the `curl -sI` lines in step 3 show what reaches the browser). If the shared Caddyfile has an old
  `@hashed` rule copied from the example, it simply never matches; the app's header covers it. You may
  update it to the example's new regex, but it isn't required.
- Keep `encode zstd gzip` on the learn.oyegen.com block (as before).
- Like any other origin, the public `/verify/:id` page needs no session and is rate limited by the app.

Then confirm the other project on the box still answers.

## 5. Production checks on https://learn.oyegen.com

Use a real browser with DevTools open, once in a normal window and once in a private one.

1. **Favicon in the tab.** The mark (blue ring, amber inner ring) shows in the tab; in a dark browser UI the
   SVG favicon switches to Sky. If the old logo still shows, hard-reload once (`?v=2` should prevent this).
2. **The login matches the mockup** (`Oyelearn-Brand-Kit/05-web/signin-page-mockup`, baseline
   `docs/branding/shots/login-1440-light.png`): blue left panel with the `on-blue` logo, faint rings and
   "Learning never closes."; right side Cloud with the logo, "Welcome back", Username, Password and the full
   width blue "Sign in". On a phone: the slim blue band, the endorsed logo, then the form. Switch the OS to
   dark: Night panel with Sky rings.
3. **Add to Home Screen uses the new icon.** On Android Chrome (Install app) and iOS Safari (Share → Add to
   Home Screen): the blue app icon, named "Oyelearn". An install made before the deploy may keep its old
   icon until the OS refreshes it (Android re-reads the manifest within a day; iOS needs remove and add).
4. **A test learner completes a short course and downloads the PDF and PNG.**
   - Assign a short course (or an Oyelabs course with one module) to a test learner and finish it.
   - The certificate moment plays; `/learn/certificate/<id>` shows the server's picture.
   - **Download PDF**: A4 landscape, the name is selectable text, the verify line is a link.
   - **Download image**: 3508 × 2480 PNG.
   - The QR code on both opens `https://learn.oyegen.com/verify/<id>`.
   - Admin → Reports → Certificates lists it; set "Signature on certificates" if Abhishek has chosen the
     name and title, then **Draw again** and check the new signature prints.
5. **Verify works logged out.** Open `https://learn.oyegen.com/verify/<id>` in a private window: the logo,
   "This certificate is valid ✓", the name, course, date and picture. An unknown code shows "Certificate not
   found". Revoke the test certificate in Admin and reload: "This certificate was revoked", no name, no
   picture (then make it valid again or delete the test learner).
6. **A shared link preview shows the OG image.** Paste the verify link into Slack or WhatsApp: the preview
   shows the certificate picture and "<Title>: certificate for <Name> · Oyelearn". Or:
   ```bash
   curl -s https://learn.oyegen.com/verify/<id> | grep -E 'og:image|og:title'
   curl -s https://learn.oyegen.com/login       | grep og:image     # the default og-image.png
   ```
   The certificate's `og:image` is `https://learn.oyegen.com/api/v5/certificates/<id>/preview.png`.
7. **Email (only if SMTP is set up).** The certificate-earned email arrives with the blue header, the
   amber rule and the "Oyelearn · by Oyelabs" footer; check the From name.
8. **No CSP errors** in the console on /login, a lesson, the certificate page and /verify.

## 6. Rollback

### 6a. Code only (keeps the data)

There is no migration, so `v4.5.0` (what runs today) runs on the same database:

```bash
cd ~/oyelearn
git checkout v4.5.0
docker compose build
docker compose up -d
docker compose exec -T oyelearn curl -fsS http://127.0.0.1:8787/api/health
```

- **Certificates issued after the deploy won't verify on v4.5.0.** Their codes are 80 bits
  (`OYL-XXXX-XXXX-XXXX-XXXX`) and v4.5.0's `CERTIFICATE_ID_RE` accepts at most three groups, so their
  `/verify` links show "not found" until you roll forward again. Older certificates are unaffected. If you
  must stay on v4.5.0 for long, tell learners who got a certificate in between.
- v4.5.0 draws certificates in the browser again; the server's files in `/data/certificates` are left in
  place and ignored.
- Browsers keep the new favicon for up to a day (`max-age=86400`), and the hashed assets are new names, so
  nothing stale is served.
- Don't use `deploy-v4.sh` on the tag (`git pull --ff-only` fails on a detached HEAD). To return:
  `git checkout main`, then step 2.

### 6b. Last resort: restore the database

Only if something wrote bad data; it loses everything since step 1. Same as `docs/v4.5/DEPLOY.md` §6b with
`pre-brand-v1.0-<stamp>.db` and the tag `v4.5.0`.

## After the deploy

Fill in the deploy date in `RESULTS.md`, then tick 7.3 in `PROGRESS.md`. The tag `brand-v1.0` goes on the
commit that was deployed.
