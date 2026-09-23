# Oyelearn — deployment brief for an operator with server access

**You are deploying a second application onto a server that is already running something else.
The existing deployment must not be disturbed.** That constraint shapes several steps below; the
ones that can break the other project are marked **STOP**.

Repository: `https://github.com/abhi789837/Oyelabs-Trails.git` (branch `main`).
The repo is still named after the product's old name; the product is **Oyelearn**.

---

## 1. What this application is

An internal training platform: a **Fastify server** that serves a React SPA and a JSON API from
one origin. A superadmin onboards learners, the server generates a proctored adaptive assessment,
grades it, and publishes a personalised learning plan.

It is **not** a static site and **not** serverless-compatible. It needs a long-running process and
a persistent disk, because it has:

- **SQLite in WAL mode** as its only database, on disk
- **proctoring snapshot files** written to that same disk
- a **background job worker** running between requests (assessment generation, evaluation)
- a **long-lived SSE stream** for the admin live view
- **nightly `VACUUM INTO` backups** on a timer
- **`isolated-vm`**, a native module, used to grade code submissions in a V8 isolate

Do not attempt to deploy this to Vercel, Netlify, or any function-per-request platform. A
`vercel.json` in the repo deliberately fails the build with an explanation if anyone tries.

---

## 2. Container contract

Everything below is already in the repo; you should not need to write a Dockerfile or a compose
file.

| Thing | Value |
| --- | --- |
| Base image | `node:24-bookworm-slim`, multi-stage |
| Built image size | ~286 MB |
| Listens on | `8787` inside the container |
| Published by compose on | `127.0.0.1:8787` — **loopback only, deliberately** |
| Persistent volume | `/data` (named volume `oyelearn-data`) |
| Health endpoint | `GET /api/health` → `{"ok":true,...}`; also a Docker `HEALTHCHECK` |
| Runs as | non-root (`node`) |
| Compose service name | `oyelearn` |
| Memory limit | `mem_limit: 2g` in compose |

The app serves the SPA and the API from the same origin, so **only one port needs proxying**.

### Build requirements

The build stage installs `python3 make g++` because `better-sqlite3` and `isolated-vm` may compile
from source. It also runs `node scripts/fetch-mediapipe.mjs`, which downloads ~46 MB of WASM and
model files, so **the build needs outbound internet**. The build then runs a full typecheck, the
production bundle, and the content quality gate — expect **3–6 minutes** on first build.

`isolated-vm` compilation is memory-hungry. If the host is under memory pressure from the other
project, run `docker compose build` separately from `up -d` and do it at a quiet moment.

---

## 3. Environment

`cp .env.example .env` and fill in. Only four values matter:

| Variable | Notes |
| --- | --- |
| `APP_MASTER_KEY` | 32 bytes, `openssl rand -base64 32`. Encrypts stored AI provider credentials (AES-256-GCM). **Back this up off the server.** If it changes, every saved credential becomes unreadable and must be re-entered. Nothing else in the system is unrecoverable. |
| `SESSION_SECRET` | 32 bytes, `openssl rand -base64 32`. |
| `PUBLIC_ORIGIN` | `https://<hostname>` — the public URL, used for cookie and CSP decisions. |
| `SUPERADMIN_PASSWORD` | **Leave empty.** The server then generates a 20-character password and prints it to the log **exactly once**, which is better than a value sitting in a file. |

`NODE_ENV=production`, `DATA_DIR=/data`, `HOST=0.0.0.0` and `PORT=8787` are already correct in the
example and are also set by compose.

The server **refuses to boot in production** without `APP_MASTER_KEY` and `SESSION_SECRET`, and
rejects a key that does not decode to exactly 32 bytes.

---

## 4. HTTPS is mandatory, not optional

The session cookie is set `Secure` when `NODE_ENV=production`
(`server/src/routes/auth.ts`: `secure: env.isProduction`). Browsers will not send a `Secure`
cookie over plain HTTP, so **login silently fails over HTTP**. There is no HTTP-only mode.

A hostname is therefore required — an IP address alone cannot get a public certificate. If no
domain is available yet, `<dashed-ip>.sslip.io` resolves to that IP and Let's Encrypt will issue
for it, which is enough to get running and can be swapped for a real domain later by changing one
line in the proxy config.

---

## 5. Coexisting with the existing deployment

### STOP — the one command that will break the other project

The repo's README and `Caddyfile.example` are written for a **fresh** server and say:

```bash
cp Caddyfile.example /etc/caddy/Caddyfile      # ← DO NOT RUN THIS on a shared server
```

That **overwrites** the Caddyfile. If the other project is served by Caddy, its config is
destroyed and that site goes down. Integrate instead, per §5.2.

### 5.1 Survey first

```bash
ss -tlnp | grep -E ':(80|443|8787)\s'
docker ps --format '{{.Names}}\t{{.Ports}}'
for s in caddy nginx apache2; do printf "%-8s %s\n" "$s" "$(systemctl is-active $s 2>/dev/null || echo absent)"; done
ls -la /etc/caddy/Caddyfile 2>/dev/null; ls /etc/nginx/sites-enabled/ 2>/dev/null
```

### 5.2 Reverse proxy — integrate, don't replace

**If Caddy is already running:** append a new site block to the existing Caddyfile. Caddy serves
many sites from one file. Take the block from `Caddyfile.example`, substitute the hostname and
email, and append it. **Run `caddy validate --config /etc/caddy/Caddyfile` before reloading** — a
syntax error on reload takes down every site Caddy serves, not just this one.

**If nginx is already running:** do not install Caddy. Add an nginx site that proxies to
`127.0.0.1:8787`, and obtain a certificate with certbot. Two directives are load-bearing:

```nginx
location /api/admin/live/stream {
    proxy_pass http://127.0.0.1:8787;
    proxy_buffering off;        # nginx buffers SSE by default; without this the admin
    proxy_read_timeout 24h;     # live view arrives in batches, minutes late
}
location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The app sets `trustProxy` in production and reads the client IP from `X-Forwarded-For`; the login
rate limiter depends on it. If the header is missing, every request appears to come from the
proxy and the per-IP limit becomes useless.

The app sets its own CSP, HSTS and frame options via helmet — **the proxy should not add its own**,
or they will conflict.

### 5.3 Port

Compose publishes `127.0.0.1:8787:8787`. If `8787` is already taken, edit `docker-compose.yml` and
change only the **left** number, e.g. `127.0.0.1:8788:8787`, then point the proxy at `8788`.

### 5.4 Names

The compose project is named after its directory, so containers and the `oyelearn-data` volume are
namespaced. Clone into a directory not already in use. Nothing here writes outside its own
directory and its own named volume.

### 5.5 Firewall

Only 80 and 443 need to be publicly reachable. The app itself is bound to loopback and must stay
that way — do not publish `8787` publicly.

---

## 6. Deploy sequence

```bash
git clone https://github.com/abhi789837/Oyelabs-Trails.git oyelearn
cd oyelearn
cp .env.example .env
# fill APP_MASTER_KEY, SESSION_SECRET, PUBLIC_ORIGIN; leave SUPERADMIN_PASSWORD empty

docker compose build          # separately, if the host is busy
docker compose up -d
docker compose logs -f oyelearn
```

**Capture the first-boot block from the logs — it appears once and is stored nowhere:**

```
  FIRST BOOT: superadmin account created
  username: admin
  password: XXXX-XXXX-XXXX-XXXX-XXXX
```

Then configure the reverse proxy per §5.2 and verify.

---

## 7. Verification

```bash
docker compose ps                              # STATUS should include (healthy)
curl -fsS http://127.0.0.1:8787/api/health     # from the host
curl -fsS https://<hostname>/api/health        # through the proxy
```

Expected: `{"ok":true,"name":"oyelearn","version":"3.0.0","uptimeSec":N,"db":"ok"}`

**Then confirm the other project is still up.** That is the actual success criterion here.

In a browser, sign in as `admin` with the printed password. The app will require a password change
before it lets you do anything — that is correct behaviour, not a bug. A freshly seeded superadmin
is blocked from **every** route until the password is changed, so API probes with that account
will return `password_change_required` rather than data.

---

## 8. Operations

- **Update:** `git pull && docker compose up -d --build`. Data lives in the `oyelearn-data` volume
  and survives rebuilds.
- **Backups:** a nightly job writes `VACUUM INTO /data/backups/oyelearn-<timestamp>.db` and keeps
  the newest 14. **They are on the same volume as the database** — copy them off the host
  separately, e.g. `docker compose cp oyelearn:/data/backups ./backups` on a schedule. Nothing in
  the repo does this.
- **Logs:** `docker compose logs oyelearn`. Structured JSON via pino; cookies, authorization
  headers, and password and secret body fields are redacted.
- **Snapshots:** proctoring images under `/data/snapshots/`, deleted after
  `SNAPSHOT_RETENTION_DAYS` (default 90) by a daily job.

---

## 9. Known gotchas, so you do not rediscover them

1. **`.dockerignore` is load-bearing.** It is in the repo. Without it, `COPY . .` would overwrite
   the Linux `node_modules` with the build host's, and the native modules would fail to load.
   Don't remove it.
2. **`flush_interval -1` in `Caddyfile.example` is belt-and-braces, not required.** Caddy already
   flushes immediately for `Content-Type: text/event-stream`, which that route sets. nginx is the
   one that genuinely needs `proxy_buffering off`.
3. **The build runs the content quality gate** (`npm run content:check`). If it fails, the image
   build fails. That is intentional — it means broken curriculum content cannot ship — but it does
   mean a build failure may be a content error rather than an infrastructure one. The error output
   names the module and topic.
4. **`docker compose config` fails without a `.env` file.** Create `.env` before any compose
   command, even a read-only one.
5. **First boot creates the database and seeds the superadmin.** If you destroy the volume you get
   a new superadmin password on the next boot, and all learner data is gone.

---

## 10. After deployment

The application works immediately, but the assessment pipeline runs on a **deterministic mock
provider** until a real AI credential is added. Go to **Admin → AI connection** and add an
Anthropic API key. Until then, generated assessments are structurally valid but not genuinely
useful. The admin page shows a banner while the mock is in use, and the mock can never be selected
in production — it is development-only by construction.
