# v5 deploy

This uses the existing method: Docker Compose on the shared VPS behind the shared Caddy, with `scripts/deploy/deploy-v4.sh`. Nothing in v5 changes the compose file, the Dockerfile or the Caddyfile.

**Where the app lives:**
- **Server directory:** `~/oyelearn`, the path used in the v4.4 deploy notes. **check:** the real path on the box.
- **Live site:** https://learn.oyegen.com.
- **How Caddy reaches the app:** on this box, through the shared Docker network `hypha_default`. That comes from `docker-compose.override.yml`, copied from `docker-compose.override.example.yml`. Git ignores it, so `git pull` leaves it alone.

## 0. Before you start (dev machine)

`main` is ahead of `origin` (v4.4 and v5 aren't pushed yet). After the final v5 commit and the `v5.0.0` tag, push:

```bash
git push origin main --tags
```

`git push origin main --tags` sends the `v4.4.0` tag as well, and the rollback below needs that tag on the server.

On the server, note what is running now, so you know which migrations are pending:

```bash
cd ~/oyelearn
git log -1 --oneline
git describe --tags
ls docker-compose.override.yml
```

`ls docker-compose.override.yml` must show the file. Without it, the app isn't on Caddy's network.

## 1. Back up the production database

This is the same online backup `deploy-v4.sh` takes: better-sqlite3's `backup()` inside the running container, copied to the host as well. The command is taken from the script; only the file name changes.

```bash
cd ~/oyelearn
stamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p backups
docker compose exec -T oyelearn node -e "
  const D = require('better-sqlite3');
  const db = new D('/data/oyelearn.db', { readonly: true });
  db.backup('/data/backups/pre-v5-$stamp.db').then(() => console.log('backup ok'));"
docker compose cp "oyelearn:/data/backups/pre-v5-$stamp.db" "backups/pre-v5-$stamp.db"
ls -la "backups/pre-v5-$stamp.db"
echo "$stamp"
```

Write down `$stamp`; the rollback in step 6 needs it.

There are two more safety nets, so you end up with three copies:
- `deploy-v4.sh` takes its own `backups/pre-v4-<stamp>.db` in step 2.
- On the first boot with a new migration, the app writes `/data/backups/pre-migrate-<time>.db` with `VACUUM INTO` (`server/src/db/index.ts`).

## 2. Pull and build

```bash
cd ~/oyelearn
bash scripts/deploy/deploy-v4.sh
```

**What the script does, in order:**
1. Checks that the host is on cgroup v2.
2. Backs up the database again.
3. Runs `git pull --ff-only`, then `docker compose build`.
4. Downloads the Whisper model if it's missing. This is safe to re-run, and it matters if v4.4 was never deployed here.
5. Runs `docker compose up -d`.
6. Waits for `/api/health`.
7. Installs the code-runner languages if they're missing.
8. Prints the last 40 log lines.

**How long it takes:** the build runs the typecheck, the production bundle and the content gate, about 3–6 minutes. It needs outbound internet (MediaPipe download).

**Don't set `UI_V5_DEFAULT`** in `.env`. Leaving it unset is what makes v5 the default. Check that `.env` doesn't already have it:

```bash
grep -n UI_V5_DEFAULT .env || echo "not set (good)"
```

## 3. Migrations

Since `v4.4.0`, there is one new migration:

```bash
git diff --stat v4.4.0 -- server/drizzle
#  server/drizzle/0025_v5_learner_experience.sql |  159 +
#  server/drizzle/meta/0025_snapshot.json        | 7873 +
#  server/drizzle/meta/_journal.json             |    7 +
```

**What `0025_v5_learner_experience.sql` does:**
- It is additive. It adds 11 tables: review_cards, review_logs, xp_events, weekly_streaks, lesson_state, lesson_notes, problem_reports, tutor_messages, announcements, content_versions and email_outbox.
- It adds columns and a unique index to `certificates`.
- One hand-written UPDATE backfills existing certificate rows first, so the unique index can't fail on duplicates.
- It runs by itself at boot (`migrate()` in `server/src/db/index.ts`). There is no manual command.

**If production was still on v4.3:** `git describe` in step 0 would show `v4.3.0` or earlier. Then `0024_v44_intents_soft_speak_scoring.sql` runs too (also additive), and the v4.4 notes apply: the Whisper model, and the re-score job that runs once after boot.

**Check that it ran.** The log should show this line, with 26 at the end (25 if coming from v4.4, 24 from v4.3):

```
[oyelearn] database backed up before migrating (25 -> 26): /data/backups/pre-migrate-….db
```

```bash
docker compose logs oyelearn | grep "backed up before migrating"
docker compose exec -T oyelearn node -e "
  const D = require('better-sqlite3');
  const db = new D('/data/oyelearn.db', { readonly: true });
  console.log(db.prepare(\"select count(*) as n from __drizzle_migrations\").get(),
    db.prepare(\"select name from sqlite_master where type='table' and name in ('review_cards','lesson_state','email_outbox')\").all());"
```

Expected: `{ n: 26 }` and all three table names.

## 4. Restart, keeping the shared Caddy working

`deploy-v4.sh` already restarted the app with `docker compose up -d`. It never touches Caddy, and v5 needs no Caddy change.

**Don't copy `Caddyfile.example` over the shared Caddyfile** (`docs/DEPLOY_BRIEF.md` §5). If the Caddy config is edited for any other reason, validate it before reloading:

```bash
caddy validate --config /etc/caddy/Caddyfile
```

**check:** the shared Caddy may run in a container on `hypha_default` rather than as a systemd service. If so, run the same validate inside that container.

**Check the app through the proxy, and that the other site is still up:**

```bash
docker compose ps                                   # oyelearn should be (healthy)
docker compose exec -T oyelearn curl -fsS http://127.0.0.1:8787/api/health
curl -fsS https://learn.oyegen.com/api/health
curl -sI https://learn.oyegen.com/sw.js | grep -i -E "cache-control|service-worker-allowed"
curl -sI https://learn.oyegen.com/site.webmanifest | grep -i cache-control
```

`/sw.js` must say `Cache-Control: no-cache` and `Service-Worker-Allowed: /`. The manifest must say `no-cache`. The app sets these. Caddy's immutable-cache rule only matches hashed `/assets/*` files, so it doesn't override them.

**check:** the shared Caddy block for learn.oyegen.com has `encode zstd gzip`, as in `Caddyfile.example`. The Node server doesn't compress, and without it every page is about twice as large (`QUALITY.md`, "Bare Node server").

**Then confirm the other project on the box still answers.** That's the success criterion from `DEPLOY_BRIEF.md`.

## 5. Smoke test on https://learn.oyegen.com

Use a real browser with DevTools open on the Console. Do it once as a learner and once as staff.

1. **The global default is on.** Signed in as staff, run this in the console:
   ```js
   fetch('/api/admin/settings/ui').then(r => r.json()).then(console.log)
   ```
   Expect `{ v5Default: "on" }`.
   - If it says `"off"`, a saved setting is overriding the fallback.
   - A super admin fixes that with `PUT` and `{ "v5Default": "on" }`, the same as in step 6a.
2. **Learner: Today → Continue → lesson.**
   - Sign in as a learner with a plan. `/` should land on `/learn` (Today).
   - Press **Continue**. It should open `/learn/lesson/<topic>?step=…` inside the right step, at the saved video position on Watch.
   - Step through Watch, Read and Do or Check.
   - In a coding Do step, press **Run** and **Check**. Results must come back. This exercises the `/runner.html` sandbox and the server sandbox.
   - "Next lesson" should follow the plan.
3. **Review offline.**
   - Open `/learn/review` online once (this caches a session).
   - Set DevTools → Network to **Offline** and reload.
   - The banner should say "You're offline. Your ratings will sync when you're back."
   - Start a review and rate a card.
   - Go back online. The banner should go, and the rating should be saved (the due count drops).
4. **Admin inbox.**
   - As staff, `/admin` should show **"Needs your attention"** with grouped items, or "All caught up" with "Onboard someone".
   - Try ⌘K or Ctrl+K.
   - Open People, then a row's side sheet.
5. **The `/verify` page.**
   - Open a certificate from Me → Certificates and copy its verify link.
   - Open `/verify/<id>` in a private window, signed out. It should show the holder and the title.
   - Open `/verify/does-not-exist`. It should say "We couldn't find this certificate", not show an error page.
6. **"Use previous design" and back.**
   - **Learner:** Me → Settings → **Use previous design**. The old dashboard should load. In the old user menu, **Try the new design** should go back to `/learn`.
   - **Staff:** the ↶ icon on the admin top bar (tooltip "Use previous design"), then back the same way.
   - Each switch should appear in the audit log as `ui.v5_toggle`.
7. **PWA install.**
   - In Chrome or Edge on `/learn`:
     - the address bar should offer **Install**;
     - DevTools → Application → Manifest should show no installability errors;
     - Service workers should show `/sw.js` activated.
   - On Android Chrome, "Add to Home screen" should offer to install, and the app should open on `/learn`.
   - There is no in-app install button; this is the browser's own prompt.
8. **No CSP errors.**
   - The console should show no "Refused to…" or "violates the following Content Security Policy" messages.
   - Check on Today, a lesson (with the YouTube player and a code run), Review, Me, `/admin` and `/verify/<id>`.
   - Pay special attention to the inline theme script on first load. Its hash now ignores CRLF line breaks.

Optional, once it's live: Lighthouse with a staff login (see `RESULTS.md`, Needs Abhishek).

## 6. Rollback

Try these in order. The first two keep v5's code and data and only change which design people see.

### 6a. Make the old design the default (no restart)

A super admin sets the saved global setting. A saved setting wins over the built-in fallback and over `UI_V5_DEFAULT`. There is no screen for this yet; run it in the browser console, signed in as the super admin on learn.oyegen.com:

```js
fetch('/api/admin/settings/ui', {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ v5Default: 'off' }),
}).then(r => r.json()).then(console.log)
```

- This is logged as `ui.v5_default`.
- People who chose a design themselves keep their choice. Everyone else gets the old design on their next page load.
- To undo it, send the same request with `'on'`.

### 6b. Or through the environment (restart)

```bash
cd ~/oyelearn
echo "UI_V5_DEFAULT=off" >> .env
docker compose up -d        # recreates the app container with the new env
```

This only applies while no global setting is saved. A saved `"on"` from 6a would win, so if 6a was ever used, use 6a again instead. To undo it, delete the line and run `docker compose up -d` again.

### 6c. Last resort: back to v4.4.0 with the database restored

**This loses everything written since the backup:**
- progress, attempts and tests;
- any onboarding;
- all v5 data (review cards, XP, notes).

Use it only if v5 has broken data.

```bash
cd ~/oyelearn
docker compose stop oyelearn

# Put the step 1 backup back in place (it is already in the volume, under /data/backups).
docker compose run --rm --no-deps --entrypoint sh oyelearn -c '
  cp /data/oyelearn.db /data/backups/broken-v5-$(date -u +%Y%m%dT%H%M%SZ).db &&
  cp /data/backups/pre-v5-<stamp>.db /data/oyelearn.db &&
  rm -f /data/oyelearn.db-wal /data/oyelearn.db-shm'

git checkout v4.4.0
docker compose build
docker compose up -d
docker compose exec -T oyelearn curl -fsS http://127.0.0.1:8787/api/health
```

Points to check with 6c:
- **check:** the `docker compose run … --entrypoint sh` restore isn't in any repo script. It assumes the image has `sh` and `cp`, and that the `node` user can write `/data` (the volume is the app's own).
- If the host copy is the one you need, first copy it back into the volume:
  ```bash
  docker compose cp backups/pre-v5-<stamp>.db oyelearn:/data/backups/
  ```
  **check:** `docker compose cp` into a stopped container.
- **Don't use `deploy-v4.sh` while on the tag.** Its `git pull --ff-only` fails on a detached HEAD. Use the plain build and up commands above. To return to v5 later: `git checkout main`, then step 2.
- **Without the database restore,** v4.4 also starts on the v5 database (it has 25 migrations and finds 26 applied, so it applies nothing). The v5 tables are simply unused. Restore anyway if the data is the problem.
- **Service worker.** Browsers that used v5 keep its service worker after a code rollback. It is network-first for pages and never caches `/api` (except an offline-only copy of `/api/auth/me`), so the old UI works under it. The `v5-pwa` e2e checks the old dashboard under the worker. To remove it everywhere, ship a `sw.js` that calls `self.registration.unregister()` and deletes the `oyelearn-*` caches. That is the kill switch in `DECISIONS.md` (Phase 8, PWA).
  - **check:** v4.4.0 has no `/sw.js`, and the browser keeps the old worker when the update fetch fails.

## After the deploy

Write the removal date for the old UI (deploy date + 14 days) into `RESULTS.md` → Switch-on, and tick 9.5 in `PROGRESS.md`.
