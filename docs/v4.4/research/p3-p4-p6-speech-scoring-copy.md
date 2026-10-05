# v4.4 research: speech capture, self-hosted STT, fluency metrics, lenient scoring, plain-language copy

Researched 2026-10-05. Every link below was fetched and seen to load. Figures marked "estimate" are my
extrapolations from published numbers, not measurements on our VPS.

## A. Browser audio recording (MediaRecorder + getUserMedia)

- `getUserMedia()` works only in secure contexts (HTTPS or localhost). On plain HTTP, `navigator.mediaDevices`
  is `undefined`. Errors to handle by `err.name`:
  `NotAllowedError` (user said no, insecure page, or Permissions-Policy blocks it), `NotFoundError` (no mic),
  `NotReadableError` (OS/hardware lock, e.g. another app holds the mic), `OverconstrainedError`, `SecurityError`
  (media disabled in browser settings), `AbortError`, `TypeError` (empty constraints or insecure context).
  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- `MediaRecorder.isTypeSupported(mime)` returns true if the browser should be able to record that type
  ("recording may still fail if there are insufficient resources"). MDN's example probes `audio/webm;codecs=opus`,
  `audio/webm`, `video/mp4...`.
  https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static
- `start(timeslice)`: with a timeslice, a `dataavailable` event fires every N ms with a Blob chunk; without it,
  one Blob at stop. Errors after start arrive as `error` events. `start()` throws `InvalidStateError`
  (already recording), `NotSupportedError`, `SecurityError`.
  https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start
- Containers per browser: Chrome/Opera record WebM/Opus; Firefox records Ogg/Opus (older addpipe write-up;
  also notes Chrome's WebM lacks duration metadata, so it is not immediately seekable).
  https://blog.addpipe.com/recording-audio-in-the-browser-using-pure-html5-and-minimal-javascript.md
- Safari 18.4+: "MediaRecorder ... now supports creating WebM files using the Opus audio codec"; also ALAC/PCM
  and fragmented MP4. Older Safari produces MP4/AAC (`audio/mp4`).
  https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
- Size: Opus voice is roughly 16-32 kbit/s, so 90 s is about 0.2-0.4 MB (estimate). There is no MediaRecorder
  size cap of practical concern at this length; the server upload limit is the real limit.

## B. Self-hosted speech-to-text, CPU only

### B1. whisper.cpp server (ggml-org)
- Images: `ghcr.io/ggml-org/whisper.cpp:main` (CPU, linux/amd64 + arm64, includes curl and ffmpeg);
  `main-cuda`, `main-vulkan`, `main-musa` variants. Upstream run example:
  `docker run ... -v $MODEL_PATH:/models ghcr.io/ggml-org/whisper.cpp:main "whisper-server --host 0.0.0.0 -m /models/ggml-base.bin"`.
  https://github.com/ggml-org/whisper.cpp
- Endpoint: `POST /inference` (multipart `file`, `temperature`, `prompt`, `response_format`), plus `POST /load`.
  The path is configurable with `--inference-path`, so `--inference-path /v1/audio/transcriptions` gives an
  OpenAI-shaped URL. The field name `file` matches OpenAI. An extra `model` field is just ignored (assumed).
  Defaults: `127.0.0.1:8080`, `-t 4` threads, model `models/ggml-base.en.bin`.
  https://github.com/ggml-org/whisper.cpp/tree/master/examples/server
  https://raw.githubusercontent.com/ggml-org/whisper.cpp/master/examples/server/README.md
- `response_format`: `json` (default), `text`, `srt`, `vtt`, `verbose_json`. **Word timestamps:** in
  `verbose_json` each segment gets a `words` array with `start`/`end`. Source:
  `params.token_timestamps = !params.no_timestamps && (params.response_format == vjson_format || ...)`.
  https://raw.githubusercontent.com/ggml-org/whisper.cpp/master/examples/server/server.cpp
- Input formats: the built-in reader takes WAV and a few other formats. WebM/Opus needs `--convert`
  ("Convert audio to WAV, requires ffmpeg on the server"). ffmpeg ships in the `main` image. The README warns:
  don't run as admin, and sandbox it, because of uploads and ffmpeg.
- Models (README): tiny 75 MiB disk / ~273 MB RAM; base 142 MiB / ~388 MB; small 466 MiB / ~852 MB.
  Files on HF: `ggml-base.en.bin` 148 MB, `ggml-base.en-q5_1.bin` 59.7 MB, `ggml-small.en.bin` 488 MB,
  `ggml-small.en-q5_1.bin` 190 MB, `ggml-small.en-q8_0.bin` 264 MB.
  https://huggingface.co/ggerganov/whisper.cpp/tree/main
- Speed (bench issue, base-model encode time per 30 s window): M1 Pro 8 threads 220 ms; Ryzen 9 5950X 8 threads
  421 ms; Ryzen 9 3900X 8 threads 880 ms; Raspberry Pi 4 4 threads 30.5 s.
  https://github.com/ggml-org/whisper.cpp/issues/89
- Speed (faster-whisper README, small model, 13 min audio, i7-12700K 8 threads, beam 5): whisper.cpp fp32 2m05s,
  1049 MB RAM. That is a real-time factor (RTF) of about 0.16.
  https://github.com/SYSTRAN/faster-whisper

### B2. faster-whisper based
- **speaches** (formerly faster-whisper-server): `ghcr.io/speaches-ai/speaches:latest-cpu`. HF model cache volume at
  `/home/ubuntu/.cache/huggingface/hub`. OpenAI-compatible `POST /v1/audio/transcriptions` (`file`, `model`,
  e.g. `Systran/faster-distil-whisper-small.en`). `response_format`: text/json/verbose_json/srt/vtt. It has
  `timestamp_granularities`, default `["segment"]`. I could not confirm from the source that `word` is accepted.
  Models load on demand and are downloaded via `speaches-cli`. It is heavier: a Python stack, plus TTS and
  realtime features we don't need.
  https://github.com/speaches-ai/speaches  https://raw.githubusercontent.com/speaches-ai/speaches/master/compose.cpu.yaml
  https://speaches.ai/usage/speech-to-text/  https://raw.githubusercontent.com/speaches-ai/speaches/master/src/speaches/routers/stt.py
- **whisper-asr-webservice**: `onerahmet/openai-whisper-asr-webservice:latest`, `ASR_ENGINE` =
  openai_whisper | faster_whisper | whisperx, `ASR_MODEL` = tiny/base/small/..., cache `/root/.cache/`. The
  endpoint is `POST /asr?output=json&word_timestamps=true&vad_filter=true` (field `audio_file`). It is **not**
  OpenAI-shaped. ffmpeg is built in (`encode=true` by default).
  https://github.com/ahmetoner/whisper-asr-webservice  https://ahmetoner.github.io/whisper-asr-webservice/endpoints/
- faster-whisper library: no system ffmpeg needed (PyAV), `word_timestamps=True`, Silero `vad_filter`.
  CPU small model, 13 min, 8 threads: fp32 2m37s / 2257 MB; **int8 1m42s / 1477 MB** (RTF about 0.13).
  https://github.com/SYSTRAN/faster-whisper

### B3. Recommendation
**whisper.cpp server, `ghcr.io/ggml-org/whisper.cpp:main`, model `ggml-base.en.bin`, `--convert`, `-t 2..4`.**
- Why: it is a single C++ binary with the lowest RAM (~400 MB for base), OpenAI-shaped via `--inference-path`,
  word timestamps in `verbose_json`, and ffmpeg is already in the image for WebM/Ogg/MP4 input.
- Expected speed (estimate): on 2-4 shared vCPUs, base encode is about 1-3 s per 30 s window. A 90 s clip is
  3 windows plus decoding, so **about 6-15 s**, which meets the under-20 s target. `small.en` is about 3x slower
  (~20-45 s on the same box), so keep it as an opt-in only. Benchmark on the real VPS before committing:
  `docker run --rm ... whisper-bench -m /models/ggml-base.en.bin -t 4`.
- Assume one transcription runs at a time. Queue in the app (concurrency 1) and show the queue position.

```yaml
  stt:
    image: ghcr.io/ggml-org/whisper.cpp:main   # pin a digest in prod
    restart: unless-stopped
    # image entrypoint runs the command string via a shell (per upstream docker run example)
    command: >
      "[ -f /models/ggml-base.en.bin ] ||
       curl -fL -o /models/ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin;
       exec whisper-server --host 0.0.0.0 --port 8080 -m /models/ggml-base.en.bin -t 3
       --convert --inference-path /v1/audio/transcriptions"
    volumes:
      - stt-models:/models
    networks: [internal]          # no `ports:`; only the app container can reach it
    mem_limit: 1g
    cpus: "3.0"
    read_only: false              # --convert writes temp files
    security_opt: ["no-new-privileges:true"]
volumes:
  stt-models:
networks:
  internal:
    internal: true                # NB: an internal network cannot download the model; pre-seed the volume
                                  # or attach a second non-internal network for first boot only
```

```bash
# from the app container
curl -s http://stt:8080/v1/audio/transcriptions \
  -F file=@answer.webm -F response_format=verbose_json -F temperature=0.0 \
  -F prompt="Umm, let me think like, hmm... Okay, here's what I'm, like, thinking."
```

## C. Web Speech API (SpeechRecognition): not suitable
- MDN: "By default ... your audio is sent to a web service for recognition processing, so it won't work
  offline." On-device needs `processLocally = true` plus installed language packs, and support for that is uneven.
  https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
- caniuse: Chrome partial, Safari partial (14.1+), Firefox disabled by default, Edge listed unsupported.
  https://caniuse.com/speech-recognition
- It gives no word timestamps and no stored audio for review, and results differ by vendor. Do not use it for scoring.

## D. Fluency metrics from a timestamped transcript
- **WPM:** NCVS puts conversation at 120-150 wpm (US average ~150), presentations at 100-150, and TED talks
  at ~173 (154-201). https://virtualspeech.com/blog/average-speaking-rate-words-per-minute
  Suggested "comfortable" band for spoken answers: **100-170 wpm**. Measure from the first word's start
  to the last word's end, not over the whole recording.
- **Pauses:** L2 fluency research (de Jong & Bosker 2013) studied silent-pause cut-offs. The
  commonly cited value is about 250 ms, but for a coaching UI, gaps **≥ 1.0 s** between words are what learners
  notice. Report "long pauses (≥ 2 s)" separately.
  https://www.mpi.nl/publications/item1900232/choosing-threshold-silent-pauses-measure-second-language-fluency
- **Fillers:** um, uh, er, ah, hmm, "like", "you know", "I mean", "sort of", "kind of", "basically", "actually",
  "so" at the start of a sentence. Only count um/uh/er/hmm automatically. The rest depend on context, so show them as hints.
- **Whisper limitation:** Whisper's normalisation drops hmm/mm/uh/um, so fillers are under-counted. The known
  trick is a filler-laden initial `prompt` ("Umm, let me think like, hmm..."), which raises recall but can
  hallucinate disfluencies. https://huggingface.co/spaces/openai/whisper/discussions/30
  ASR disfluency handling varies widely across systems for non-native speakers (L2-ARCTIC study).
  https://arxiv.org/abs/2503.06924
  Implication: treat filler counts as "approximate". Never gate a pass on them.

## E. Scoring: mastery and lenient grading
- Mastery grading: objectives become testable outcomes, graded as binary **mastered / not yet**, with
  re-tests allowed (search summaries of the ASEE / PMC papers; those pages blocked direct fetch, so they are not cited).
- LLM judges: use **binary pass/fail with a written critique**, not 1-5 scales ("you're doing it wrong"). Use
  few-shot examples of expert critiques, and calibrate against a human on held-out examples (>90% agreement in
  3 iterations in the Honeycomb case). https://hamel.dev/blog/posts/llm-judge/
- Anthropic grading tips: detailed rubrics, "be empirical" (observations before judgment), ask for reasoning,
  give reference examples. https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
- Known judge biases: position, **verbosity**, self-enhancement, and limited reasoning. GPT-4 judges agree with
  humans >80% of the time. https://arxiv.org/abs/2306.05685
- Lenient code-output comparison:
  - Kattis default validator: any whitespace run counts as one space, comparison is case-insensitive by default,
    and floats are accepted within `float_relative_tolerance` or `float_absolute_tolerance`.
    https://www.kattis.com/problem-package-format/spec/legacy.html
  - Jest `toBeCloseTo`: `|a-b| < 10^-n / 2`, default n=2. `toEqual` ignores `undefined` props and
    class-vs-literal differences. Key order never matters in deep equality.
    https://jestjs.io/docs/expect

## F. Plain-language UX writing
- GOV.UK: plain English is mandatory ("1 in 6 adults in England have very poor literacy"). Experts prefer it too.
  Split sentences over 25 words. Use active voice, 'buy' not 'purchase'. Explain a specialist term the first
  time you use it. https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/
- NHS service manual: reading age 9-11, sentences up to 20 words, paragraphs up to 3 sentences, plain term
  first then the technical one. https://service-manual.nhs.uk/content/how-we-write
- digital.gov: active voice, present tense, "You must do it", no hidden verbs ("analyze", not
  "conduct an analysis"). https://digital.gov/guides/plain-language/writing
- NN/g error messages: show them near the source, in plain language, say exactly what went wrong, give a
  constructive fix, don't blame the user, keep their input. https://www.nngroup.com/articles/error-message-guidelines/
- NN/g progress: under 1 s show nothing. For 2-10 s show a spinner with text ("Loading comments..."). For over
  10 s show percent-done or a determinate indicator. With a progress indicator, users wait about 3x longer.
  https://www.nngroup.com/articles/progress-indicators/

## Design implications for Oyelearn

1. **Recorder:** feature-detect `navigator.mediaDevices` (HTTPS only). Pick the first supported type from
   `audio/webm;codecs=opus`, `audio/ogg;codecs=opus`, `audio/mp4`, then let the browser choose. Use `start(1000)`
   so chunks build up. Hard-stop at 90 s with a visible countdown. Keep the Blob so the learner can replay
   it before submitting.
2. **Mic errors in plain words:** NotAllowedError: "Your browser blocked the microphone. Click the lock icon
   next to the address, allow Microphone, then try again." NotFoundError: "We can't find a microphone. Plug
   one in and try again." NotReadableError: "Another app is using your microphone. Close it and try again."
   Always offer "Type your answer instead" so a learner is never stuck.
3. **STT service:** whisper.cpp `:main` image (pinned by digest), `ggml-base.en.bin`, `--convert`,
   `--inference-path /v1/audio/transcriptions`, internal network only, 1 GB / 3 CPU limits. Keep the client
   code OpenAI-shaped so the backend can switch to speaches or a hosted API with one env var
   (`STT_BASE_URL`). Server-side checks: limit uploads to 5 MB and 100 s, check the MIME allowlist,
   run one job at a time, and time out at 60 s.
4. **Pre-seed the model** into the `stt-models` volume during deploy, because an internal-only network can't
   download it. Add a health check (POST a 1 s silent WAV) to the admin status page.
5. **Fluency card (advisory only):** words per minute (100-170 band), long pauses (≥ 1 s gaps between words
   from `verbose_json`), and fillers (um/uh/er/hmm, marked "approximate"). Never use these to fail an answer.
   The pass/fail is about content.
6. **Grading = Met / Not yet.** The LLM rubric prompt must say: "Mark MET if the answer does the job a
   working engineer needs. Do not penalise style, length, grammar, accent-caused transcription errors, or
   missing extras." It should ask for observations first, then the verdict, then one concrete next step. Add 2-3
   few-shot anchors, including a borderline-MET example. Calibrate against Abhishek's labels on about 20 samples.
7. **Code tests:** trim and collapse whitespace on strings, compare numbers with tolerance (relative 1e-6
   or absolute 1e-9, configurable per test), compare objects deeply ignoring key order, and optionally
   ignore case per test. "Not yet" feedback shows expected vs. got with the diff highlighted.
8. **Copy:** target reading age 9-11 (grade 6-8), sentences of 20 words or fewer, active voice, "you". Explain
   every technical term the first time it appears. No blame in errors.
9. **Long AI operations (transcribe, then grade):** show feedback at once, then a step list with checkmarks
   ("Uploading your recording", "Turning speech into text (about 10 seconds)", "Checking your answer"),
   plus a "What happens next" line. If it takes over 10 s, show elapsed time or a determinate step count. Keep
   the learner's recording and text if any step fails.
