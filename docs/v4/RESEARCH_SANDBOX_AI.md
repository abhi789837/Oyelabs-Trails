# Research: code sandbox + Anthropic API cost controls (Oyelearn v4)

Researched and tested 2026-10-02. Every claim links to its source. "Tested" means it was run on this
machine. Scratch scripts and logs: `C:\Users\capof\AppData\Local\Temp\claude\sandbox-test\`
(`run_tests.py`, `run_fix.py`, `run_net.py`, `results.log`, `install.log`).

---

## Part A: Piston vs Judge0

**Decision: use Piston (`ghcr.io/engineer-man/piston`), self-hosted, `privileged: true`, cgroup v2 host,
on an internal-only docker network. Do not use Judge0.** It ran locally, and every test below passed.

### A1. Maintenance and security

| | Piston | Judge0 CE |
|---|---|---|
| Last code change | 2025-02-08: "Explicitly provide env vars…" (#703) and "Provide HOME in sandbox" (#702). Commits after that, up to 2026-07-31, only edit the README about the public-API key policy ([commits](https://github.com/engineer-man/piston/commits/master)) | Last release **v1.13.1 on 2024-04-18** ([releases](https://github.com/judge0/judge0/releases), [CHANGELOG](https://github.com/judge0/judge0/blob/master/CHANGELOG.md)). Commits in 2026 only add README links ("Add new article", 2026-09-30) |
| Image | `ghcr.io/engineer-man/piston:latest`, built 2025-02-08T18:47Z, digest `sha256:2f66b745…7a`, 343 MB (tested) | `judge0/judge0:1.13.1` |
| Security advisories | None published, and no SECURITY.md ([security](https://github.com/engineer-man/piston/security)) | Three critical advisories, all **patched in >= 1.13.1** ([advisories](https://github.com/judge0/judge0/security)): CVE-2024-28185 sandbox escape via symlink ([GHSA-h9g2-45c8-89cf](https://github.com/judge0/judge0/security/advisories/GHSA-h9g2-45c8-89cf)), CVE-2024-28189 patch bypass via chown on symlink ([GHSA-3xpw-36v7-2cmg](https://github.com/judge0/judge0/security/advisories/GHSA-3xpw-36v7-2cmg)), CVE-2024-29021 SSRF into sandbox escape through unsafe default config ([GHSA-q7vg-26pg-v5hr](https://github.com/judge0/judge0/security/advisories/GHSA-q7vg-26pg-v5hr)) |
| Public API | The free public API closed on 2026-02-15. Self-hosting is unaffected ([README](https://github.com/engineer-man/piston)) | ce.judge0.com is a hosted, paid/free-tier service |

Both projects are effectively in maintenance mode. Piston's sandbox (isolate on cgroup v2) is newer.
Judge0's last release uses an old isolate that only works with cgroup v1.

### A2. Languages we need

Piston installs packages at runtime from its package index (`PISTON_REPO_URL`, default
`…/releases/download/pkgs/index`, see [configuration.md](https://github.com/engineer-man/piston/blob/master/docs/configuration.md)).
The table below is the real list returned by `GET /api/v2/packages` (tested):

| Language | Piston versions in the repo | Judge0 v1.13.1 self-host ([CHANGELOG](https://github.com/judge0/judge0/blob/master/CHANGELOG.md)) | Hosted ce.judge0.com (`GET /languages`, tested) |
|---|---|---|---|
| Python | 2.7.18, 3.5.10, 3.9.1, 3.9.4, 3.10.0, 3.11.0, **3.12.0** | 2.7.17, 3.8.1 | up to 3.14.0 |
| PHP | 8.0.2, **8.2.3** | 7.4.1 | 7.4.1, 8.3.11 |
| Java | **15.0.2 only** | OpenJDK 13.0.1 | 13.0.1, JDK 17.0.6 |
| Dart | 2.12.1, 2.19.6, **3.0.1** | not listed | 2.19.2 |
| SQLite | **sqlite3 3.36.0** (aliases `sqlite`, `sql`) | SQLite 3.27.2 | 3.27.2 |
| TypeScript | 4.2.3, **5.0.3** | 3.7.4 | 3.7.4, 5.0.3, 5.6.2 |
| JS (Node) | 15.10.0, 16.3.0, 18.15.0, **20.11.1** | — | up to Node 22.08 |

The newer languages on hosted ce.judge0.com are **not** in the self-hostable v1.13.1 release. Gap to
know about: Piston's Java is 15, so there are no records or pattern matching for switch. If we need
Java 17 or 21 we would have to build a custom package from the repo's `packages/` build scripts
(not attempted).

### A3. Docker requirements

- **Piston**: needs **cgroup v2 enabled and cgroup v1 disabled** ([README](https://github.com/engineer-man/piston)).
  The run command in the docs uses `--privileged`, and so does the official compose file
  ([docker-compose.yaml](https://github.com/engineer-man/piston/blob/master/docker-compose.yaml)), which
  also mounts `/piston/packages` and `tmpfs: /tmp:exec`. **Tested: privileged is mandatory.** Without
  it the container exits immediately with `mkdir: cannot create directory 'isolate/': Read-only file system`.
  It needs no other services. Note that the API process itself runs on Node 15.10.0 inside the image
  (from `docker inspect`), which is EOL but not exposed if we keep it internal.
- **Judge0**: needs **cgroup v1**. You have to add `systemd.unified_cgroup_hierarchy=0` to the GRUB
  config and reboot, and it recommends Ubuntu 22.04 ([CHANGELOG deploy steps](https://github.com/judge0/judge0/blob/master/CHANGELOG.md)).
  It also needs **Postgres + Redis**. On cgroup v2 hosts it fails with `No such file or directory
  @ rb_sysopen /box/script.*` ([dev.to report](https://dev.to/nischal_kshaj_f2c1d595ea/internal-error-no-such-file-or-directory-rbsysopen-boxscriptjs-when-using-judge0-api-2la4)).
  Changing the whole VPS kernel's cgroup mode would affect every other app on the box. **That alone
  rules out Judge0 for us.**

### A4. API shape

**Piston** `POST /api/v2/execute` ([README](https://github.com/engineer-man/piston)). It runs
synchronously and returns the result in the same call:
```json
{ "language": "python", "version": "3.12.0",
  "files": [{ "name": "main.py", "content": "..." }],
  "stdin": "[[2,3,5]]", "args": [],
  "run_timeout": 3000, "compile_timeout": 10000,          // ms, wall clock
  "run_cpu_time": 3000, "compile_cpu_time": 10000,        // ms
  "run_memory_limit": 268435456, "compile_memory_limit": -1 } // bytes
```
The response is `{ language, version, run: {stdout, stderr, code, signal, output, status, message,
cpu_time, wall_time, memory}, compile?: {…} }`. `status` is one of `RE` (runtime error), `SG`
(signal), `TO` (timeout), `OL` (stdout too long), `EL` (stderr too long), or `XX` (internal error).
Other endpoints are `GET /api/v2/runtimes` (installed only), `GET /api/v2/packages` (everything
available), `POST /api/v2/packages {language, version}` (install) and `DELETE` (uninstall).
Server-wide caps are set by env vars: `PISTON_RUN_TIMEOUT`=3000, `PISTON_OUTPUT_MAX_SIZE`=1024 bytes,
`PISTON_MAX_PROCESS_COUNT`=64, `PISTON_DISABLE_NETWORKING`=true, `PISTON_MAX_CONCURRENT_JOBS`=64, and
`PISTON_LIMIT_OVERRIDES` for per-language overrides ([configuration.md](https://github.com/engineer-man/piston/blob/master/docs/configuration.md)).
A request cannot go above the server caps.

**Judge0** `POST /submissions?wait=true` with `{source_code, language_id, stdin, expected_output,
cpu_time_limit (s), wall_time_limit (s), memory_limit (KB), enable_network}`. There is also batch
`POST /submissions/batch` + `GET /submissions/batch?tokens=`. Status ids are 3 Accepted, 4 Wrong
Answer, 5 TLE, 6 Compilation Error. Defaults are 2 s CPU / 5 s wall / 128 MB, with maxima of 15 s / 20 s / 256 MB ([ce.judge0.com docs](https://ce.judge0.com/)).
Note that `allow_enable_network` defaults to **true**, so you have to turn it off.

**Hidden tests (the plan for both).** We wrap the user's function in a harness program and pass the
test cases as JSON on **stdin** (they never appear in the source). The harness prints one JSON line
per case, `{"got":…, "pass":…}`, and the Node server parses stdout and compares against the expected
values itself. That way the expected values never enter the sandbox. **Raise
`PISTON_OUTPUT_MAX_SIZE`** (e.g. 65536): the 1024-byte default killed a 5000-char print with `OL`.
One run per submission with N cases is ~0.1–1 s, so there is no need for one request per case.

### A5. Local test (Piston): exact commands and results

Host: Windows 11, Docker Desktop, **Server 29.6.2, kernel 6.6.87.2-microsoft-standard-WSL2,
`Cgroup Driver: cgroupfs`, `Cgroup Version: 2`** (`docker info | grep -i cgroup`).
```bash
docker pull ghcr.io/engineer-man/piston:latest                 # 1m16s
docker volume create piston_packages
docker run --privileged -d --name piston_test -v piston_packages:/piston/packages \
  -p 127.0.0.1:2000:2000 ghcr.io/engineer-man/piston:latest   # API up in ~1 s ("Initialized cgroup")
curl -s -X POST http://127.0.0.1:2000/api/v2/packages -H 'Content-Type: application/json' \
  -d '{"language":"python","version":"3.12.0"}'               # repeated per package
```
Package installs (all succeeded, with time and on-disk size): python 3.12.0 (65 s, 1.1 GB), php 8.2.3
(11 s, 208 MB), java 15.0.2 (33 s, 508 MB), dart 3.0.1 (41 s, 759 MB), sqlite3 3.36.0 (3 s, 1.8 MB),
typescript 5.0.3 (27 s, 249 MB), node 20.11.1 (14 s, 213 MB). That is **~3 GB total**, so the
volume must persist. Node shows up in `/runtimes` as language **`javascript`** version 20.11.1:
`"node"` returns HTTP 400 "runtime is unknown".

Each language ran a hello-world plus a harness (`add(a,b)` over 3 stdin cases, one of them failing
on purpose). Times are client round trip; wall and memory come from Piston:

| Language | Result | Round trip | wall / mem |
|---|---|---|---|
| python 3.12.0 | pass (first call 2.27 s cold) | 0.13 s warm | 556 ms / 4.8 MB |
| php 8.2.3 | pass | 0.52 s | 198 ms / 4.1 MB |
| java 15.0.2 | pass (javac+run) | 1.12 s | 1028 ms / 56 MB |
| dart 3.0.1 | pass | 0.53 s | 469 ms / 106 MB |
| typescript 5.0.3 | pass (tsc+node) | 1.71 s | compile ~1.7 s / 131 MB |
| javascript 20.11.1 | pass | 0.13 s | 84 ms / 7.4 MB |
| sqlite3 3.36.0 | pass: `CREATE`/`INSERT`/`.mode json`/`SELECT` → `[{"name":"ann"},{"name":"cy"}]` | 0.11 s | 57 ms / 1.4 MB |

Failures we hit and fixed (all were harness gotchas, not Piston bugs):
1. **TS:** `require` is untyped because there is no `@types/node` (TS2580). Fix: the harness declares
   `declare const require: any;`.
2. **Java:** a regex with escapes failed because of quoting in our generator. Piston saves `Main.java`
   as `Main.java.java` in error messages, so the public class must be `Main`.
3. **Node:** the runtime is called `javascript`, not `node`.

Sandbox checks (all passed):
- **Network blocked.** `socket.create_connection(("1.1.1.1",80))` gives `OSError [Errno 101] Network
  is unreachable`, DNS gives `Temporary failure in name resolution`, and `urllib` to example.com fails.
  `/sys/class/net` does not exist inside the box.
- **Infinite loop.** Python `while True` returned `status TO, signal SIGKILL, "Time limit exceeded
  (wall clock)"` after 3.1 s. Java returned `TO` at 2.2 s wall / 3.2 s CPU.
- **Memory.** A 512 MB allocation with `run_memory_limit` 256 MB was killed with exit 137, memory
  268 MB.
- **Fork bomb.** Stopped after 62 forks (`BlockingIOError`).
- **Filesystem.** `open("/etc/x","w")` gives a read-only FS error. Runs as uid 60013 in `/box/submission`.
- **Output cap.** 5000 chars returned `OL "stdout length exceeded"` at the default 1024.
- **Throughput.** 5 sequential trivial Python runs took 0.68 s. 8 parallel took 0.32 s, all correct.

**State: container `piston_test` is LEFT RUNNING** (tests succeeded) on `127.0.0.1:2000`, with
named volume `piston_packages` holding the 7 runtimes. To clean up:
`docker rm -f piston_test && docker volume rm piston_packages`. A throwaway non-privileged container
(`piston_noprivs`) was created and removed.

### A6. Production compose snippet (privileged: true is required)

```yaml
services:
  piston:
    image: ghcr.io/engineer-man/piston@sha256:2f66b7456189c4d713aa986d98eccd0b6ee16d26c7ec5f21b30e942756fd127a
    restart: unless-stopped
    privileged: true            # required: isolate mounts cgroup v2; fails without it (tested)
    # no `ports:` at all: reachable only as http://piston:2000 from the app on code_net
    networks: [code_net]
    volumes:
      - piston_packages:/piston/packages
    tmpfs:
      - /tmp:exec
    environment:
      PISTON_DISABLE_NETWORKING: "true"
      PISTON_RUN_TIMEOUT: "5000"            # hard ceiling; requests send smaller values
      PISTON_COMPILE_TIMEOUT: "15000"
      PISTON_RUN_MEMORY_LIMIT: "268435456"  # 256 MB ceiling per run
      PISTON_OUTPUT_MAX_SIZE: "65536"       # default 1024 is too small for harness output
      PISTON_MAX_PROCESS_COUNT: "64"
      PISTON_MAX_CONCURRENT_JOBS: "4"       # match the CPU we give it
    cpus: "2.0"
    mem_limit: 2g
    pids_limit: 1024
    logging: { driver: json-file, options: { max-size: "10m", max-file: "3" } }
  api:                       # our Node server
    networks: [code_net, web]  # web = the network Caddy is on
networks:
  code_net: { internal: true } # no egress for piston
volumes:
  piston_packages: {}
```
Package install needs egress to GitHub, but `code_net` is internal. The one-time procedure is
`docker network connect bridge <piston>` (gives Piston egress), then
`POST http://piston:2000/api/v2/packages {language,version}` from the **app** container over
`code_net`, then `docker network disconnect bridge <piston>`. The Piston image has `node` 15 but no
`curl`, `wget` or global `fetch` (tested), so making the call from the app container is simplest.
The volume keeps the packages after that. Host prerequisite: the VPS must be on pure cgroup v2
(Ubuntu 22.04+/Debian 12 default). Check with `stat -fc %T /sys/fs/cgroup` → `cgroup2fs`.
**Risk to accept:** a privileged container on a shared VPS means a Piston/isolate escape is a host
escape. Mitigations: internal network only, digest-pinned image, never expose port 2000, and keep
the Node server as the only caller (with auth plus rate limits in front).

---

## Part B: Anthropic API cost controls

### B1. Prices: ready-to-use table (USD per million tokens)

Source: [platform.claude.com pricing](https://platform.claude.com/docs/en/about-claude/pricing),
fetched 2026-10-02. IDs come from the [models overview](https://platform.claude.com/docs/en/about-claude/models/overview).

| Model | API ID (alias) | Input | Output | 5m cache write | 1h cache write | Cache read | Batch in / out | Min cacheable |
|---|---|---|---|---|---|---|---|---|
| Haiku 4.5 | `claude-haiku-4-5-20251001` (`claude-haiku-4-5`) | $1 | $5 | $1.25 | $2 | $0.10 | $0.50 / $2.50 | 4,096 tok |
| Sonnet 5.5 (latest) | `claude-sonnet-5-5` | $2 | $10 | $2.50 | $4 | $0.20 | $1 / $5 | 512 |
| Sonnet 5 | `claude-sonnet-5` | $2 | $10 | $2.50 | $4 | $0.20 | $1 / $5 | 1,024 |
| Sonnet 4.5 | `claude-sonnet-4-5` | $3 | $15 | $3.75 | $6 | $0.30 | $1.50 / $7.50 | 1,024 |
| Opus 5.5 (latest Opus) | `claude-opus-5-5` | $4 | $20 | $5 | $8 | **$0.20 (0.05x)** | $2 / $10 | 512 |
| Opus 5 / 4.8 / 4.7 / 4.6 / 4.5 | e.g. `claude-opus-5` | $5 | $25 | $6.25 | $10 | $0.50 | $2.50 / $12.50 | 512–4,096 |
| Fable 5.1 (top tier) | `claude-fable-5-1` | $10 | $50 | $12.50 | $20 | $0.25 (0.025x) | $5 / $25 | 512 |

Multipliers: a 5-minute write costs **1.25x** input, a 1-hour write **2x**, and a read **0.1x**
(0.05x on Opus 5.5, 0.025x on Fable/Mythos 5.1). These **stack with the Batch 50% discount**
([pricing: prompt caching](https://platform.claude.com/docs/en/about-claude/pricing#prompt-caching)).
Sonnet 5's $2/$10 is now the standard price, and the planned rise to $3/$15 was cancelled (pricing,
footnote 3). Claude 4.7+ models use a new tokenizer that produces **~30% more tokens for the same
text** (pricing page), so budget for that when comparing against Sonnet 4.5 or Haiku 4.5. Minimum
cacheable lengths come from [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).
⚠ **Haiku 4.5's retirement is listed as "not sooner than October 15, 2026"**
([models overview](https://platform.claude.com/docs/en/about-claude/models/overview)), which is 2 weeks
away. Don't hard-code it. Pick the model from config, or resolve it via `GET /v1/models`. Sonnet 5.5
is the safe cheap default; its next retirement date is ≥ 2027-09-28.

### B2. Listing models: `GET /v1/models`

From the [API reference](https://platform.claude.com/docs/en/api/models/list): send the headers
`x-api-key`, `anthropic-version: 2023-06-01`, and optionally `anthropic-workspace-id`. Query params
are `limit` (default 20, max 1000), `after_id`, `before_id`. The response looks like `{ data:
ModelInfo[], has_more, first_id, last_id }`, newest first. Each `ModelInfo` is `{ type:"model", id,
display_name, created_at, max_input_tokens, max_tokens, capabilities: { batch, citations,
code_execution, context_management, effort{low,medium,high,xhigh,max}, image_input, pdf_input,
structured_outputs, thinking{types{adaptive,enabled}} } }`, and each capability is `{supported:bool}`.
That means we can check `capabilities.structured_outputs.supported` and `capabilities.batch.supported`
before offering a model in the admin UI.

### B3. Prompt caching

From [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching):
- **Automatic:** put a top-level `cache_control: {type:"ephemeral"}` (optionally `"ttl":"1h"`) on the
  request. The breakpoint goes on the last cacheable block. This is the recommended starting point.
- **Explicit:** `cache_control` on individual blocks in `tools`, `system` or `messages`, **max 4
  breakpoints**. The prefix order is `tools → system → messages`. Put the breakpoint on the **last
  block whose prefix is identical across requests**. The lookback is 20 blocks. `"ttl":"1h"` needs
  no beta header.
- **Too short:** below the minimum length there is **no error**, just no caching. You can tell
  because `cache_creation_input_tokens` and `cache_read_input_tokens` are both 0. For Haiku 4.5 the
  minimum is 4,096 tokens, so short grading prompts won't cache on Haiku.
- **Usage fields:** `input_tokens` (after the last breakpoint), `cache_creation_input_tokens`,
  `cache_read_input_tokens`, and `cache_creation: {ephemeral_5m_input_tokens,
  ephemeral_1h_input_tokens}`. Total input = sum of the three.
- **Invalidators:** changing tool definitions busts everything. Changing `tool_choice`, images,
  thinking or effort busts messages. Changing `output_config.format` also busts the prompt cache
  ([structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)).
  So keep the schema stable per job type.

### B4. Message Batches API

From [batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing):
- Endpoints: `POST /v1/messages/batches` with body `{requests:[{custom_id, params:{…Messages
  params}}]}`. Then `GET /v1/messages/batches/{id}`, `GET /v1/messages/batches` (list),
  `POST /v1/messages/batches/{id}/cancel`, `DELETE /v1/messages/batches/{id}`, and results via the
  batch's `results_url` (.jsonl).
- Limits: **100,000 requests or 256 MB** per batch. Most batches finish within 1 h. A batch
  **expires after 24 h**, and results are kept for **29 days**. `max_tokens` must be ≥ 1, so cache
  pre-warming with `max_tokens:0` is rejected. `stream` and `speed` (fast mode) are not allowed.
  Params are validated asynchronously, so errors only show up in the results.
- Status: `processing_status` goes `in_progress` → `ended`, and
  `request_counts{processing,succeeded,errored,canceled,expired}` tracks progress. Each JSONL line is
  `{custom_id, result:{type:"succeeded"|"errored"|"canceled"|"expired", message?/error?}}`. Only
  `succeeded` is billed. Results are **not in input order**, so match on `custom_id`.
- 50% discount on input and output. **Combines with caching.** The docs recommend the 1-hour TTL
  for shared context because batches can take more than 5 minutes (batch page tip, and the pricing
  FAQ "Batch API and prompt caching discounts can be combined"). Structured outputs work in batches.

### B5. Structured outputs (JSON schema)

From [structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs):
- **GA, no beta header:** `output_config: { format: { type: "json_schema", schema: {...} } }`. The
  JSON comes back in `content[0].text`. The old `output_format` + `structured-outputs-2025-11-13`
  beta is deprecated.
- Alternative: **strict tool use**, i.e. `tools:[{name, strict:true, input_schema}]` with
  `tool_choice:{type:"tool",name}`.
- Supported models: Opus 5.5/5/4.x, Sonnet 5.5/5/4.x, Haiku 4.5 (`claude-haiku-4-5-20251001`), Fable/Mythos.
- **Schema limits:** no recursion, no `minimum`/`maximum`/`minLength`/`maxLength`, `minItems` only
  0 or 1, and `additionalProperties` must be `false`. Validate those rules in our code after parsing.
  Required properties are emitted first. Complexity caps are 20 strict tools, 24 optional params, and
  16 union params. The first use of a schema adds grammar-compile latency, and compiled grammars are
  cached for 24 h.
- Edge cases: `stop_reason: "refusal"` or `"max_tokens"` can produce non-conforming output, so check
  `stop_reason` before parsing.

### B6. Installed SDK surface (`@anthropic-ai/sdk`)

`package.json` requires `^0.128.0`, and `node_modules/@anthropic-ai/sdk/package.json` is **0.128.0**.
Confirmed in the type definitions:
- `client.messages.batches.{create, retrieve, list, cancel, delete, results}`
  (`resources/messages/batches.d.ts`). `results()` returns a `JSONLDecoder<MessageBatchIndividualResponse>`
  that you consume with `for await`.
- `client.models.list()` returns `PagePromise<ModelInfosPage, ModelInfo>` (`resources/models.d.ts:33`).
- `cache_control?: CacheControlEphemeral` with `ttl?: '5m' | '1h'` (`messages.d.ts:943`). It is
  allowed both at the top level of `MessageCreateParams` (automatic caching, line ~97) and on blocks
  (39 occurrences). `Usage` has `cache_creation_input_tokens` and `cache_read_input_tokens`.
- `output_config?: OutputConfig` with `format?: JSONOutputFormat` (`messages.d.ts:2035–2044, 3537`).
  There is also `client.messages.parse()` plus the helpers `zodOutputFormat` (`@anthropic-ai/sdk/helpers/zod`,
  peer `zod ^3.25 || ^4`) and `jsonSchemaOutputFormat` (`helpers/json-schema`), which give a typed
  `parsed_output`.

### B7. Cost-control recipe for v4 (derived from the above)

1. Default model `claude-sonnet-5-5` from config. Keep Haiku 4.5 only for cheap classification, and
   plan to move off it given the retirement notice.
2. Put the stable rubric, curriculum context and schema in `system` with `cache_control` (or use
   top-level automatic caching). Keep those prefixes ≥ 512 tokens on 5.x models, or caching does
   nothing.
3. Send all non-interactive generation (bulk question generation, re-grading, plan building)
   through the Batch API with a 1h-TTL cached shared prefix, which roughly halves the cost again.
4. Use `output_config.format` json_schema for every machine-read response and check `stop_reason`.
5. Log `usage.*` per call (input, cache creation, cache read, output) and compute cost from the
   table in B1 to enforce per-user and per-day budgets.
