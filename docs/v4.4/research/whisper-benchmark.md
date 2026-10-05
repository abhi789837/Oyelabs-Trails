# v4.4 Whisper benchmark (Phase 3a)

Measured 2026-10-05 on the **development machine, not the VPS**. Re-run on the server with the
command at the end before trusting these numbers there.

## Machine

- CPU: Intel Core i5-12500H (12 cores / 16 logical processors; AVX2 + AVX-VNNI, **no AVX-512**)
- Docker 29.6.2 (Docker Desktop, WSL2 VM: 16 CPUs, 7.6 GiB)
- Container limits as in compose: `--cpus 3`, `mem_limit 1g`, `-t 3` (except the thread sweep)

## Finding 1: the upstream image does not run here

`ghcr.io/ggml-org/whisper.cpp:main` (digest `sha256:8b87d9c2…aced3`, source commit `60c0be6a`,
2026-10-02) is built with `GGML_NATIVE=ON` (read from `/app/build/CMakeCache.txt`), i.e.
`-march=native` for whatever CI runner built it. On this CPU `whisper-server` and `whisper-bench`
both die with **SIGILL (exit 132)** straight after loading the model. A VPS CPU is just as likely
to differ, so compose builds `scripts/deploy/whisper/Dockerfile` instead: the same source, rebuilt
with `GGML_NATIVE=OFF GGML_BACKEND_DL=ON GGML_CPU_ALL_VARIANTS=ON`, so ggml picks the best CPU
backend at start-up (here it logged `loaded CPU backend from libggml-cpu-alderlake.so`). The
first build takes about 4 minutes; later builds are cached.

## Finding 2: word timestamps need no flag

`response_format=verbose_json` returns `segments[].words[]` with `word`, `start`, `end`,
`probability` (and `t_dtw: -1`). No `-dtw`/`--split-on-word` flag was needed. Punctuation comes
back as separate "words" (`","`), which the client drops. `timestamp_granularities[]=word` and
`model` are accepted and ignored.

## Finding 3: the filler prompt matters

Without a prompt, "So, um, the main thing…" came back as "So, the main thing…" ("uh" survived).
With the research's filler prompt (`Umm, let me think like, hmm…`) the "um" was kept. The client
always sends it. Fillers stay "approximate" in the UI.

## Clips

Windows SAPI (`System.Speech.Synthesis`, default voice and rate) reading a status-update answer
with "um", "uh", "basically", "you know", "actually" in it. WAV → WebM/Opus 24 kbit/s with the
container's ffmpeg. 30.4 s clip = 93 KB; 75.0 s clip = 226 KB (so the 6 MB cap is ~25x headroom
for a 90 s answer).

## Wall time (curl `time_total`, upload + ffmpeg convert + transcribe, `verbose_json`)

| Setup | 30 s clip | 75 s clip |
| --- | --- | --- |
| `-t 3`, cpus 3, no prompt (3 runs) | 4.48 / 4.48 / 4.53 s | 6.74 / 7.03 / 7.04 s |
| `-t 3`, cpus 3, with filler prompt | 4.65 s | 9.45 / 8.95 / 9.17 s |
| `-t 2`, cpus 2, with prompt (2 runs) | 6.18 / 6.12 s | 10.08 / 9.97 s |
| `-t 4`, cpus 4, with prompt (2 runs) | 3.71 / 3.70 s | 6.07 / 6.32 s |
| Through compose (`stt_net`, read-only, non-root), JFK sample loop, prompt | 4.05 / 4.02 s | 7.60 / 7.63 s |
| The app's own `HttpSttClient`, end to end | 4.48 s (91 words) | 7.16 s (217 words) |

- Memory: 457 MiB resident with the base.en model loaded (limit 1 GiB).
- `whisper-bench -t 3`: encoder 1.18 s per 30 s window.
- The SAPI voice speaks at 174–184 wpm with no real pauses, so the clips exercise speed, not the
  pause metric.

**Reading:** on this laptop a 90 s answer would take roughly 9–11 s with 3 threads, comfortably
inside the 120 s client timeout and the "under 20 s" target. A shared VPS vCPU is often 2–3x
slower than one of these cores, so expect **~20–30 s per 75 s answer on 2–3 vCPUs** until measured.
Transcription runs one at a time in the job queue, so a queue of N answers takes N times that.

## Re-running on the VPS

After deploying (the model is downloaded by `scripts/deploy/whisper-model.sh`, which
`deploy-v4.sh` also runs), from the repo directory on the server:

```bash
docker compose exec -T whisper bash -c '
  set -e; cd /tmp; echo "CPUs visible: $(nproc)"
  ffmpeg -loglevel error -y -stream_loop 2 -i /app/samples/jfk.wav -t 30 -c:a libopus -b:a 24k a30.webm
  ffmpeg -loglevel error -y -stream_loop 7 -i /app/samples/jfk.wav -t 75 -c:a libopus -b:a 24k a75.webm
  for f in a30.webm a75.webm a30.webm a75.webm; do
    curl -s -o /dev/null -w "$f  http=%{http_code}  wall=%{time_total}s\n" http://127.0.0.1:8080/v1/audio/transcriptions \
      -F file=@$f -F response_format=verbose_json -F temperature=0.0 -F language=en \
      -F "prompt=Umm, let me think like, hmm... Okay, here is what I am, like, thinking."
  done
  rm -f a30.webm a75.webm
  whisper-bench -m /models/ggml-base.en.bin -t 3 2>&1 | grep -E "encode time|total time" || true'
```

It uses the JFK sample shipped in the image (looped), so nothing has to be copied to the server.
`nproc` shows the host's CPUs; the compose `cpus: "3.0"` limit still applies. If the 75 s clip
takes over ~30 s, either raise `cpus`/`-t` in `docker-compose.yml` (if the VPS has spare cores)
or switch to `ggml-base.en-q5_1.bin` (set `WHISPER_MODEL`/`WHISPER_MODEL_SHA256` for the download
and change `-m` in the `whisper` command).
