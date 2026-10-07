# v4.5 deploy

Same method as v5 (`docs/v5/DEPLOY.md`): Docker Compose on the shared VPS behind the shared Caddy, with `scripts/deploy/deploy-v4.sh`. Read that file for the server layout (`~/oyelearn`, `docker-compose.override.yml` on `hypha_default`) and the general checks. This file lists only what v4.5 adds.

**What v4.5 changes on the box:**
- **Migration `0026_v45_oyelabs_courses`.** It is additive: 9 new tables and 11 new columns with defaults. It runs by itself at boot.
- **The image gets `ffmpeg`.** It is Debian's package, installed with `--no-install-recommends`. It adds about 150–250 MB to today's ~286 MB.
- **Uploads live in `/data/uploads`,** on the existing `oyelearn-data` volume. There is no new volume.
- **One optional Caddy block** caps upload bodies at 1100 MB. Caddy has no default limit, so uploads work without it.

## 0. Before you start (dev machine)

Push `main` and the tags after the v4.5 commits:

```bash
git push origin main --tags
```

This sends `pre-v4.5` (the code before v4.5) and `v4.5.0` once it is tagged. The rollback needs `pre-v4.5` on the server.

On the server, note what is running now:

```bash
cd ~/oyelearn
git log -1 --oneline
git describe --tags          # expect v5.0.1 (or v5.0.0)
ls docker-compose.override.yml
df -h /var/lib/docker        # free disk: see "Disk" below
```

**Disk.** Uploads are stored on the same volume as the database:
- a 1 GB video needs about another 1 GB while it is converted;
- the image grows by about 0.25 GB.

Leave at least 5 GB free before you start.

## 1. Back up the production database (`pre-v4.5`)

This is the online backup from `docs/v5/DEPLOY.md` §1 with a v4.5 file name:

```bash
cd ~/oyelearn
stamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p backups
docker compose exec -T oyelearn node -e "
  const D = require('better-sqlite3');
  const db = new D('/data/oyelearn.db', { readonly: true });
  db.backup('/data/backups/pre-v4.5-$stamp.db').then(() => console.log('backup ok'));"
docker compose cp "oyelearn:/data/backups/pre-v4.5-$stamp.db" "backups/pre-v4.5-$stamp.db"
ls -la "backups/pre-v4.5-$stamp.db"
echo "$stamp"
```

Write down `$stamp`. The rollback in step 6 needs it. `deploy-v4.sh` takes another backup, and the first boot writes `pre-migrate-<time>.db`, so you end up with three copies.

## 2. Pull, build and start

```bash
cd ~/oyelearn
bash scripts/deploy/deploy-v4.sh
```

The script backs up, pulls, builds, runs `docker compose up -d`, waits for `/api/health` and prints the last log lines (details in `docs/v5/DEPLOY.md` §2).

**The build is longer this time.** It installs `ffmpeg` in the runtime stage, so allow about 5–8 minutes.

**Check that video conversion is available.** The boot log must **not** contain "Video conversion isn't available":

```bash
docker compose logs oyelearn --since 10m | grep -i "video conversion" || echo "no warning (good)"
docker compose exec -T oyelearn ffmpeg -version | head -1
docker images | grep oyelearn          # note the new image size
```

## 3. Migration 0026

Since `v5.0.1` there is one new migration:

```bash
git diff --stat v5.0.1 -- server/drizzle
#  server/drizzle/0026_v45_oyelabs_courses.sql |  179 +
#  server/drizzle/meta/0026_snapshot.json      | 9173 +
#  server/drizzle/meta/_journal.json           |    7 +
```

**What it does:**
- **New tables:**
  - `course_departments`, `course_department_rules`, `course_drafts`, `media_uploads`;
  - `course_videos`, `course_docs`, `course_module_texts`, `course_module_tests`, `course_embeddings`.
- **New columns:**
  - `courses.oyelabs` and `courses.published_version`;
  - `course_sections.notes` and `course_sections.notes_text`;
  - `course_topics.kind`;
  - `course_assignments.priority` and `course_assignments.source`;
  - `video_progress.tracking`, `video_progress.active_seconds` and `video_progress.confirmed_at`;
  - `topic_attempts.course_id`.
- **Nothing is renamed or dropped.**

**Check that it ran.** The log should show `(26 -> 27)`:

```bash
docker compose logs oyelearn | grep "backed up before migrating"
docker compose exec -T oyelearn node -e "
  const D = require('better-sqlite3');
  const db = new D('/data/oyelearn.db', { readonly: true });
  console.log(db.prepare(\"select count(*) as n from __drizzle_migrations\").get(),
    db.prepare(\"select name from sqlite_master where type='table' and name in ('course_videos','course_module_tests','media_uploads')\").all());"
```

Expected: `{ n: 27 }` and all three table names.

## 4. Caddy

**Check the shared Caddy still answers for both sites:**

```bash
curl -fsS https://learn.oyegen.com/api/health
```

Then confirm the other project on the box still answers.

**Upload limit (optional, recommended).** Caddy sets no request-body limit by default, so 50 MB docs and 1 GB videos already pass. To make the 1 GB allowance deliberate, add the block from `Caddyfile.example` inside the learn.oyegen.com site block of the **shared** Caddyfile. Don't copy the whole example over it.

```caddy
@uploads path /api/admin/oyelabs/uploads
request_body @uploads {
    max_size 1100MB
}
```

Validate before reloading:

```bash
caddy validate --config /etc/caddy/Caddyfile     # or inside the Caddy container on hypha_default
```

- **If the site is behind nginx instead of Caddy,** this step is required. nginx defaults to 1 MB, and every upload fails with 413 without it. Add the `location /api/admin/oyelabs/uploads { client_max_body_size 1100m; proxy_request_buffering off; proxy_read_timeout 600s; … }` block from `docs/DEPLOY_BRIEF.md` §5.2, then run `nginx -t` and reload.

## 5. Smoke test on https://learn.oyegen.com

Use a real browser with DevTools open on the Console.

1. **Research (Phase 0).**
   - Admin → AI connection → Research → **Test**. It should say "Connected ✓ — test search returned … results".
   - Then run the check script once:
     ```bash
     docker compose exec -T oyelearn node - < scripts/deploy/research-check.cjs
     ```
     Part 3 should show HTTP 200 for a real search with the saved key.
   - Any course that was "waiting for setup" (Priyanka's) starts within 10 minutes.
2. **Add an Oyelabs course.**
   - Go to Admin → Library → **Add Oyelabs course**, and pick one test department.
   - Module 1:
     - paste a Drive video shared with "Anyone with the link". The card should say **Plays ✓**. Type its length.
     - upload a small PDF.
   - Module 2:
     - paste a Dropbox video link. The card should say **Plays ✓**.
     - paste a Google Doc link shared with "Anyone with the link".
   - Paste a Drive link that is **not** shared. The card should say "This Drive video is private." with the fix. Remove it.
   - Press **Save & publish**.
   - Within a few minutes, each module's test panel should say **Ready**, "N questions created from …".
3. **As a learner in that department:**
   - Library shows the course with the **Oyelabs** badge.
   - Module 1: the Drive video counts time while the tab is visible. At 80% of the length, "I've watched this" appears. The test unlocks after the click.
   - Module 2: the Dropbox video plays in our own player.
   - Pass both tests. The course certificate appears under Me → Certificates and opens at `/verify/<id>` in a private window.
   - A learner in another department doesn't see the course.
4. **Upload a short MOV or MP4** (under 50 MB) as a video. The card should go from "Converting…" to playable. A 413 here means the proxy limit (step 4).
5. **No CSP errors** on the module lesson (Drive iframe, HTML5 video, Vimeo if used): no "Refused to…" messages.
6. **Delete the test course** afterwards, or Save as draft so learners don't see it.

## 6. Rollback

### 6a. Code only (keeps the data)

Migration 0026 is additive, so v5.0.1 runs on the migrated database and ignores the new tables:

```bash
cd ~/oyelearn
git checkout pre-v4.5
docker compose build
docker compose up -d
docker compose exec -T oyelearn curl -fsS http://127.0.0.1:8787/api/health
```

- Oyelabs courses stay in the database. Under v5.0.1 they show as ordinary courses, without their module players.
- Don't use `deploy-v4.sh` while on the tag: its `git pull --ff-only` fails on a detached HEAD. To return: `git checkout main`, then step 2.

### 6b. Last resort: restore the database

This loses everything written since step 1. Use it only if v4.5 has broken data. It is the same procedure as `docs/v5/DEPLOY.md` §6c, with `pre-v4.5-<stamp>.db` and the tag `pre-v4.5`.

```bash
cd ~/oyelearn
docker compose stop oyelearn
docker compose run --rm --no-deps --entrypoint sh oyelearn -c '
  cp /data/oyelearn.db /data/backups/broken-v4.5-$(date -u +%Y%m%dT%H%M%SZ).db &&
  cp /data/backups/pre-v4.5-<stamp>.db /data/oyelearn.db &&
  rm -f /data/oyelearn.db-wal /data/oyelearn.db-shm'
git checkout pre-v4.5
docker compose build
docker compose up -d
```

Uploaded files in `/data/uploads` are left in place; they are harmless without the rows that point at them.

## After the deploy

- **Backups.** Add `/data/uploads` to the off-host backup. The nightly backup copies only the database, for example:
  ```bash
  docker compose cp oyelearn:/data/uploads ./uploads
  ```
- **Results.** Fill in the deploy date and the image size in `RESULTS.md`, then tick 5.3 and tag `v4.5.0` (`PROGRESS.md`).
