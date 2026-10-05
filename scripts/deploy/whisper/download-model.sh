#!/usr/bin/env bash
# Runs inside the `whisper-model` one-shot service (scripts/deploy/whisper-model.sh).
# Downloads the speech model into /models (the `whisper-models` volume) and checks its hash.
# Safe to re-run: an existing file with the right hash is kept.
set -euo pipefail

MODEL=${WHISPER_MODEL:-ggml-base.en.bin}
URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODEL}"
# Measured 2026-10-05 for ggml-base.en.bin (147,964,211 bytes). Other models skip the check.
EXPECTED_SHA256=${WHISPER_MODEL_SHA256:-a03779c86df3323075f5e796cb2ce5029f00ec8869eee3fdfb897afe36c6d002}

target="/models/${MODEL}"
check() { [ "${MODEL}" != "ggml-base.en.bin" ] && [ -z "${WHISPER_MODEL_SHA256:-}" ] && return 0; echo "${EXPECTED_SHA256}  $1" | sha256sum -c --quiet -; }

if [ -s "$target" ] && check "$target"; then
  echo "whisper model already present: $target"
  exit 0
fi

echo "downloading $URL"
curl -fL --retry 3 -o "${target}.part" "$URL"
check "${target}.part" || { echo "checksum mismatch for ${MODEL}"; rm -f "${target}.part"; exit 1; }
mv "${target}.part" "$target"
chmod 0644 "$target"
ls -la /models
echo "whisper model ready: $target"
