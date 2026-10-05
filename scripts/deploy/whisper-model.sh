#!/usr/bin/env bash
# v4.4: downloads the speech-to-text model into the `whisper-models` volume, once.
#
# The `whisper` service sits on an internal network with no internet access (it accepts uploaded
# audio and runs ffmpeg on it, so it gets no route out). It therefore cannot fetch its own model.
# This runs the one-shot `whisper-model` service instead, which mounts the same volume on the
# default network, downloads ggml-base.en.bin (~148 MB), checks its SHA-256, and exits.
#
#   scripts/deploy/whisper-model.sh            # then: docker compose up -d whisper
#
# Safe to re-run; a model that is already there and intact is kept.
set -euo pipefail
cd "$(dirname "$0")/../.."

docker compose build whisper
docker compose --profile setup run --rm whisper-model
docker compose up -d whisper
echo "Done. Check it with: docker compose ps whisper   (it should become healthy within a minute)"
