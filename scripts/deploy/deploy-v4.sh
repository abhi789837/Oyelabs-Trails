#!/usr/bin/env bash
# Oyelearn v4 deploy, for the shared VPS (docs/DEPLOY_BRIEF.md still applies: never overwrite the
# shared Caddyfile; the app stays on 127.0.0.1:8787 and only Caddy reaches it).
#
#   ./scripts/deploy/deploy-v4.sh
#
# 1. checks the host is on cgroup v2 (Piston's sandbox needs it),
# 2. backs up the live database to the volume AND to the host before anything changes,
# 3. pulls, builds and restarts (migrations 0013-0017 run at boot; they are additive),
# 4. installs the code-runner languages if they are missing,
# 5. smoke-tests /api/health and prints the last log lines.
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "== 1. host checks"
fs=$(stat -fc %T /sys/fs/cgroup)
[ "$fs" = "cgroup2fs" ] || { echo "This host is not on cgroup v2 ($fs). Piston will not start. Stop."; exit 1; }
docker compose version >/dev/null

echo "== 2. backup"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p backups
if docker compose ps -q oyelearn | grep -q .; then
  docker compose exec -T oyelearn node -e "
    const D = require('better-sqlite3');
    const db = new D('/data/oyelearn.db', { readonly: true });
    db.backup('/data/backups/pre-v4-$stamp.db').then(() => console.log('backup ok'));"
  docker compose cp "oyelearn:/data/backups/pre-v4-$stamp.db" "backups/pre-v4-$stamp.db"
  ls -la "backups/pre-v4-$stamp.db"
else
  echo "app not running; no live database to back up"
fi

echo "== 3. build and restart"
git pull --ff-only
docker compose build
docker compose up -d

echo "== 4. code runner"
for i in $(seq 1 30); do curl -fsS http://127.0.0.1:8787/api/health >/dev/null && break; sleep 2; done
runtimes=$(docker compose exec -T oyelearn node -e "fetch('http://piston:2000/api/v2/runtimes').then(r=>r.json()).then(j=>console.log(j.length))" || echo 0)
if [ "${runtimes:-0}" -lt 7 ]; then ./scripts/deploy/piston-install.sh; fi

echo "== 5. smoke"
curl -fsS http://127.0.0.1:8787/api/health && echo
docker compose logs --tail=40 oyelearn
echo "Done. Backup: backups/pre-v4-$stamp.db. Next: rebuild learner paths from Admin (POST /api/admin/paths/rebuild-all)."
