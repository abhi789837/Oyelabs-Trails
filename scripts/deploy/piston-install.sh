#!/usr/bin/env bash
# Installs the Piston language packages once (they persist in the `piston-packages` volume).
#
# Piston lives on an internal network with no egress, so for the duration of the install it is
# briefly connected to the default bridge, and disconnected again at the end — even on failure.
# The install requests are made from the app container, which can reach Piston on `code_net`
# (the Piston image has no curl).
set -euo pipefail
cd "$(dirname "$0")/../.."

PISTON=$(docker compose ps -q piston)
[ -n "$PISTON" ] || { echo "piston is not running: docker compose up -d first"; exit 1; }

docker network connect bridge "$PISTON"
trap 'docker network disconnect bridge "$PISTON" >/dev/null 2>&1 || true' EXIT

for pkg in python:3.12.0 php:8.2.3 java:15.0.2 dart:3.0.1 sqlite3:3.36.0 typescript:5.0.3 node:20.11.1; do
  lang=${pkg%%:*}; version=${pkg##*:}
  echo "installing $lang $version"
  docker compose exec -T oyelearn node -e "
    fetch('http://piston:2000/api/v2/packages', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: '$lang', version: '$version' }) })
      .then(async (r) => { const t = await r.text(); console.log(r.status, t.slice(0, 200)); if (!r.ok && !/already installed/i.test(t)) process.exit(1); })"
done

docker compose exec -T oyelearn node -e "fetch('http://piston:2000/api/v2/runtimes').then(r=>r.json()).then(j=>console.log(j.map(x=>x.language+' '+x.version).join('\n')))"
