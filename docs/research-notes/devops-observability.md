# Observability research notes (2026-09-23)

The seventh camp of the DevOps & Cloud track. Scope decision: this camp is *knowing what the
system is doing and why it broke*. Linux, networking/TLS, reverse proxies, AWS, Terraform and
Kubernetes are other camps and are deliberately not covered here. CloudWatch is mentioned nowhere
— it belongs to `devops-aws-core`. Kubernetes appears only as an incidental example (pods being
rescheduled, a DaemonSet Collector being disproportionate for one VPS), never as material.

15 topics, matching the brief's 15 bullets one-for-one. The only structural judgement call was
folding "recording rules and alerting rules" into the PromQL topic (`obs-promql-rules`) rather
than giving it a topic of its own, because all three are the same expression language evaluated
at different times; that freed a slot to split "metrics" and "why averages lie" apart from
Prometheus itself.

## Topic list

| # | id | level | challenge |
| --- | --- | --- | --- |
| 1 | `obs-monitoring-vs-observability` | intermediate | quiz (10) |
| 2 | `obs-three-signals` | intermediate | quiz (10) |
| 3 | `obs-structured-logging` | intermediate | quiz (10) |
| 4 | `obs-log-aggregation` | advanced | quiz (10) |
| 5 | `obs-metrics-and-percentiles` | advanced | **code** |
| 6 | `obs-prometheus` | advanced | quiz (10) |
| 7 | `obs-promql-rules` | advanced | quiz (10) |
| 8 | `obs-grafana-dashboards` | intermediate | quiz (8) |
| 9 | `obs-opentelemetry` | advanced, **milestone** | quiz (10) |
| 10 | `obs-distributed-tracing` | advanced, **milestone** | **code** |
| 11 | `obs-slo-error-budgets` | expert, **milestone** | quiz (11) |
| 12 | `obs-alerting` | advanced | **code** |
| 13 | `obs-oncall-incident-response` | intermediate | quiz (10) |
| 14 | `obs-postmortems` | advanced | quiz (10) |
| 15 | `obs-profiling` | expert | quiz (10) |

119 quiz questions, 3 code challenges. Every quiz has at least two
`isEdgeCaseOrInterviewQuestion` entries and at least one multi-select.

## Code challenges (3, the maximum the brief allows)

Chosen because each is pure logic that stands alone in JavaScript and is the *actual* algorithm
behind a thing engineers use daily without reading.

- **`obs-metrics-and-percentiles` → `histogramQuantile(phi, buckets)`.** A faithful port of
  Prometheus's classic-histogram `bucketQuantile`. Rules taken from the `histogram_quantile()`
  entry in the query-functions docs, not from memory: cumulative buckets with an inclusive `le`
  upper bound; fewer than two buckets or a missing `+Inf` bucket is undefined; zero observations
  is undefined; linear interpolation inside the containing bucket; **a quantile that lands in the
  `+Inf` bucket returns the upper bound of the second-highest bucket** (the "your p99.9 is pinned
  at exactly 10" gotcha, used as the edge case). Prometheus returns `NaN` for the undefined cases;
  the challenge returns `null` instead so the expectations stay plain JSON-ish data. 10 tests,
  5 edge cases. All expected values are exact in binary floating point (bucket bounds in
  milliseconds, counts chosen so every interpolation divides cleanly — e.g. p95 = 406.25).
- **`obs-distributed-tracing` → `propagateTraceparent(header, spanId)`.** W3C Trace Context
  parsing and re-parenting. 12 tests, 6 edge cases. See "Facts verified" for the rules.
- **`obs-alerting` → `evaluateBurnRate(samples, slo, rules)`** behind a `runBurnRateScenario`
  driver that expands compact traffic segments into per-minute `{good, bad}` samples, so the test
  args stay small. Implements the SRE Workbook's multiwindow, multi-burn-rate scheme and returns
  firing-severity *transitions*, which makes the reset-time behaviour of the short window
  observable in the expectations. Windows are clipped to available data (stated in the
  instructions) so short scenarios are meaningful. The burst scenario's expected output —
  ticket at t=60, page at t=62, back to ticket at t=98 — was computed by running the reference
  solution and then hand-checked: the page comes from the 6×/6h rule before the 14.4×/1h rule can
  accumulate, and it clears ~30 minutes after the errors stop because the 30-minute short window
  falls below threshold while the 3-day ticket window is still hot. 7 tests, 3 edge cases.

The remaining twelve topics are quizzes because the material is judgement (which alert deserves a
page, why a green dashboard coexists with a broken login) rather than code.

## Videos

Every id came from `yt.mjs search` and was confirmed with `yt.mjs info --chapters`. All 25 ids
used (15 primary + 10 alternates) report `embeddable: true`. No search-URL fallbacks.

- `obs-monitoring-vs-observability` → **`_Gj6eSCFWts`** "Introduction To Observability | Monitoring
  vs Observability" (Tech Tutorials with Piyush, 21:54, published 2026-05). Recent and exactly on
  topic. Alternates: **`1PJM8p-RMsY`** "Observability 2.0" (GOTO Conferences, Charity Majors &
  James Lewis, 29:51) for the opinionated take, and **`CAQ_a2-9UOI`** (IBM Technology, 9:40) for a
  crisp short version.
- `obs-three-signals` → **`GsW0-uiCwqQ`** "Logs, Metrics and Traces - 3 pillars of Observability"
  (Tech Tutorials with Piyush, 15:47, 2026-05). No alternate: nothing else searched was both
  current and specifically about what each signal is *for*.
- `obs-structured-logging` → **`I2mWnh66Bkg`** "12 Logging BEST Practices in 12 minutes" (Better
  Stack, 12:00, 276k views). Language-agnostic, covers levels and security.
- `obs-log-aggregation` → **`h_GGd7HfKQ8`** "Meet Grafana LOKI" (Techno Tim, 28:13, 297k) for the
  mechanics of shipping logs. Alternates **`EmZ6wycniGs`** "ObservabilityCON 2022 - Cardinality
  Management" (Grafana, 10:26) and **`_6iXRW3BG1U`** "SREcon24 Americas - The Sins of High
  Cardinality" (USENIX, 19:33) carry the cost half of the topic.
- `obs-metrics-and-percentiles` → **`fhx0ehppMGM`** "Understanding Prometheus Metric Types"
  (PromLabs / Julius Volz, 11:19). Alternates **`yYbXak-1hew`** "Understanding Prometheus
  Histograms" (22:04) and **`iPotMqzOsDI`** "SREcon19 Americas - Latency SLOs Done Right"
  (USENIX, 30:45), which is the best free talk on why you cannot average a percentile.
- `obs-prometheus` → **`h4Sl21AKiDg`** "How Prometheus Monitoring works" (TechWorld with Nana,
  21:30, 1.26M). Alternates **`STVMGrYIlfg`** (PromLabs intro, 10:37) and **`NEMsO1qeI1s`**
  "Don't Make These 6 Prometheus Monitoring Mistakes" deep-linked to **22s "Mistake 1: Cardinality
  Bombs"**.
- `obs-promql-rules` → **`7uy_yovtyqw`** "Understanding Counter Rates and Increases in PromQL"
  (PromLabs, 10:53) — reset handling and extrapolation are the parts people get wrong. Alternates
  **`xIAEEQwUBXQ`** "PromQL Data Selection Explained" (13:57) and **`NEMsO1qeI1s`** again, this
  time at **289s "Mistake 4: Missing 'for' Durations in Alerting Rules"**. That is the only video
  reused across two topics, and at two different chapters.
- `obs-grafana-dashboards` → **`EGgtJUjky8w`** "Creating Grafana Dashboards for Prometheus"
  (PromLabs, 13:51, 218k). Alternate **`vTiIkdDwT-0`** (Grafana's own channel, 5:52).
- `obs-opentelemetry` → **`LzLULxhyIpU`** "What is OpenTelemetry? - Explanation and Demo" (Better
  Stack, 24:54) — covers SDK *and* collector, which the shorter explainers do not. Alternates
  **`_CJrFW_yjRo`** (Adam Gardner, collector deep dive, 10:06) and **`iEEIabOha8U`** (the official
  OpenTelemetry channel, 9:11).
- `obs-distributed-tracing` → **`gviWKCXwyvY`** "Context Propagation makes OpenTelemetry awesome"
  (Lightstep / ServiceNow Cloud Observability, 9:40) — propagation is what the code challenge is
  about. Alternate **`XYvQHjWJJTE`** (ByteMonk, 7:01).
- `obs-slo-error-budgets` → **`Dfnbw5dJQ5I`** "The Art of SLOs" (DevOpsDays Chicago 2019, Jennifer
  Petoff & Nathen Harvey, 30:59) — two of the SRE book's own authors. Low view count (869) but
  it is the canonical workshop. Alternates **`ZbWqzDfccuI`** "SREcon18 Europe - Real World SLOs and
  SLIs: A Deep Dive" (37:12) and **`l3FsR4jzXxw`** (Niall Murphy, 9:14).
- `obs-alerting` → **`_2th8LDnvQk`** "SREcon18 Asia/Australia - A Theory and Practice of Alerting
  with Service Level Objectives" (USENIX, 40:45) — the talk the SRE Workbook chapter is derived
  from. Alternate **`ra0cCmEVKS8`** "How I learned to stop worrying and love burn rates" (Nobl9
  SLOconf, 9:14) as the short version.
- `obs-oncall-incident-response` → **`FYYTglQoS3w`** "SREcon21 - Evolution of Incident Management
  at Slack" (USENIX, 28:20). Alternate **`RvHbFYbE6ww`** "SREcon18 Europe - What Medicine Can Teach
  Us about Being On-Call" (23:27).
- `obs-postmortems` → **`qgHWzQ2zcqQ`** "Postmortem Culture at Google" (Conf42 SRE 2022, Ramon
  Medrano Llamas, 23:13). Alternates **`JNgvuF8r46U`** "Tales from the VOID: The Scary Truth about
  Incident Metrics" (USENIX SREcon22, 27:07) and **`DES9935e92Y`** "A Post Incident Review Review"
  (USENIX SREcon22 APAC, 44:03).
- `obs-profiling` → **`pU6GFVHFPFU`** "Introduction to continuous profiling" (Grafana, 7:36).
  Alternate **`2Ux_6ljZjsA`** (Ryan Perry, Pyroscope at FOSDEM 2022, 27:55).

**Rejected:** `bchNRQQkSjM` "How to send Alerts in Prometheus - Alertmanager" (Tech Tutorials -
David McKone, 31:50) — the best Alertmanager walkthrough found, but `embeddable: false`, so it
could not be used. `9joXN3ipABg` / `lVeECk5nxgs` (DevOps Hint) are embeddable but thin, and the
PromLabs "6 mistakes" chapter covers the `for`-duration material better. Searches for a dedicated
"alert fatigue" video returned almost entirely low-view SEO content, and one query
("symptom based alerting philosophy SRE reduce noisy alerts") returned meditation and anxiety
videos — the SREcon talk is used instead, which is the better source anyway.

## References

All URLs checked with `check-urls.mjs`; every one returns 200 and the **final** URL after
redirects is what is shipped.

Redirects worth recording:

- `charity.wtf/2022/08/15/live-your-best-life-with-structured-events/` →
  `charity.wtf/p/live-your-best-life-with-structured-events` (Substack).
- `grafana.com/docs/grafana/latest/dashboards/...` → `.../latest/visualizations/dashboards/...`
  (the whole Grafana dashboard docs tree moved under `visualizations/`).
- `opentelemetry.io/docs/collector/deployment/` → `/docs/collector/deploy/` (not used, noted).
- `landing.google.com/sre/workbook/...` → `sre.google/workbook/...`.
- `jaegertracing.io/docs/latest/...` → a version-pinned `/docs/2.21/...`; avoided by not citing
  Jaeger.

Dead or unusable:

- **`https://www.w3.org/TR/trace-context/` returns 403** to the checker (Cloudflare challenge),
  and also 403s with a browser user-agent. The spec is cited as
  `https://w3c.github.io/trace-context/` instead, which is 200 and frames cleanly. The normative
  text used for the code challenge was read from
  `raw.githubusercontent.com/w3c/trace-context/main/spec/20-http_request_header_format.md` and
  `30-processing-model.md`.
- `grafana.com/blog/2022/03/01/...`-style dated blog slugs 404 and land on the Grafana home page;
  the undated slug (`grafana.com/blog/the-red-method-how-to-instrument-your-services/`) is the
  live one.
- `getpino.io/#/docs/api` resolves to a 1.8 KB stub (the fragment is client-side only), so the
  pino reference points at `github.com/pinojs/pino/blob/main/docs/redaction.md`.

Iframe previews (from the checker's `embeddable` field):

- **Allow framing**, so the in-app preview actually works: `prometheus.io/docs/*`,
  `sre.google/*` (both books), `w3c.github.io`, `brendangregg.com`, `elastic.co/docs`,
  `fastify.dev/docs`, `docs.google.com` (the Ewaschuk alerting doc), `thevoid.community`.
- **Block framing**, so the app falls back to a link card: `opentelemetry.io/*` (CSP
  `frame-ancestors 'self'`), all of `grafana.com/docs/*` (`X-Frame-Options: DENY`, including
  Loki, Pyroscope and Tempo), `github.com` (`frame-ancestors 'none'`), `honeycomb.io`,
  `charity.wtf`, `12factor.net`, `response.pagerduty.com`, `go.dev`, `pkg.go.dev`,
  `usenix.org`.

## Facts verified

Checked against primary sources on 2026-09-23, not from memory.

### OpenTelemetry component maturity (`opentelemetry.io/status/`)

The brief asked for this specifically. Read off the status page as served today:

| Language | Traces | Metrics | Logs |
| --- | --- | --- | --- |
| C++, C#/.NET, PHP | Stable | Stable | Stable |
| Java | Stable | Stable | Stable (Profiles: Development) |
| Go | Stable | Stable | **Release candidate** |
| JavaScript | Stable | Stable | **Development** |
| Python | Stable | Stable | **Development** |
| Ruby | Stable | **Development** | **Development** |
| Swift | Stable | **Development** | **Development** |
| Erlang/Elixir | Stable | **Development** | **Development** |
| Kotlin | Development | Development | Development |
| Rust | Beta | Beta | Beta |

The **Collector's** status is "**mixed**", because each receiver/processor/exporter declares its
own stability in its own `README.md`; the Kubernetes Operator is likewise "mixed" (components in
`v1alpha1` and `v1beta1`). The practical conclusion written into the topic: traces are safe
everywhere, logs are the signal most likely to need a fallback, and "is the Collector stable" is
the wrong question. (The status page itself carries a "Last modified February 12, 2025" footer,
so the table is the project's own current statement rather than a freshly dated one.)

### W3C Trace Context (spec source on GitHub)

- `traceparent = version "-" trace-id "-" parent-id "-" trace-flags`; version 2 lowercase hex,
  trace-id 32, parent-id 16, flags 2. A version `00` header is therefore exactly 55 characters.
- **All hex must be lowercase** — uppercase makes the header invalid and it must be ignored.
- Version `ff` is forbidden. Flags `ff` is *fine* (only the version is restricted).
- All-zero trace-id and all-zero parent-id are both invalid.
- Flags are a **bit field**: sampled is bit 0 (`0x01`), so `01`, `03` and `ff` are all sampled.
  Bit 1 (`0x02`) is the `random-trace-id` flag. The spec explicitly calls out whole-number
  equality as "a common mistake when interpreting bit-fields".
- Processing model: if the version is *higher* than supported, parse with the `00` layout and
  **set all unparsed/unknown trace-flags to 0 on outgoing requests** — which is why the challenge
  masks the outgoing flags with `0x03`.
- A higher version may append extra `-`-separated fields; version `00` may not.

### Prometheus

- `histogram_quantile()` on a classic histogram: buckets are cumulative, `le` is the inclusive
  upper bound; fewer than two buckets → NaN; the highest bucket must be `+Inf` or NaN; 0
  observations → NaN; φ<0 → −Inf, φ>1 → +Inf; **if the quantile is located in the highest bucket,
  the upper bound of the second-highest bucket is returned**; the lower limit of the lowest bucket
  is assumed to be 0 when its upper bound is > 0, with linear interpolation inside it.
  Classic histograms and native histograms with custom bounds use **linear** interpolation
  (uniform distribution within the bucket); standard exponential native histograms use exponential
  interpolation.
- Aggregating a classic histogram's quantile requires `le` in the `by` clause:
  `histogram_quantile(0.9, sum by (job, le) (rate(..._bucket[10m])))`.
- "**You cannot aggregate quantiles**" is the docs' own wording, and it is the reason summaries
  (client-side quantiles) cannot be combined across replicas while histograms (bucket counts,
  which are additive) can.
- Average latency is `rate(x_sum[5m]) / rate(x_count[5m])`; both are additive so `sum by (job)`
  may be applied after the rate and before the division.
- `--query.lookback-delta` default is **5m** (checked on the command-line flags page), which is
  why an instant query can keep returning a dead target's last sample for minutes.
- `up` is a synthetic per-target series written by the server after each scrape.
- PromLabs' six mistakes, used for question material: cardinality bombs, aggregating away too many
  labels, unscoped selectors, missing `for` durations, too-short rate windows, functions used on
  the wrong metric type.

### Google SRE (book and workbook, free online)

- Four golden signals: latency, traffic, errors, saturation. Symptoms page; causes do not.
- Tail: "If your users depend on several such web services to render their page, the 99th
  percentile of one backend can easily become the median response of your frontend."
- On-call: at most 50% of an SRE's time on operational work, **no more than 25% on-call**, giving
  a **minimum of about eight engineers** for a single-site 24/7 primary+secondary rotation with
  week-long shifts. Overload symptoms should be measurable: "**paging events per shift < 2**",
  daily tickets < 5. Target a **1:1 alert-to-incident ratio**; every paging alert must be
  actionable. "Email alerts are of very limited value."
- Alerting on SLOs (Workbook ch. 5), Table 5-8, recommended starting config for a **99.9% SLO**:

  | Severity | Long window | Short window | Burn rate | Budget consumed |
  | --- | --- | --- | --- | --- |
  | Page | 1 hour | 5 minutes | 14.4 | 2% |
  | Page | 6 hours | 30 minutes | 6 | 5% |
  | Ticket | 3 days | 6 hours | 1 | 10% |

  Guideline: the short window is **1/12** the long window. Burn rate 1 = 0.1% errors = exhausts a
  30-day budget in 30 days; 2 → 15 days; 10 → 3 days; 1000 → 43 minutes. Hence a 99.9%/30-day
  error budget ≈ **43 minutes** of total unavailability.
- Low-traffic pathology, quoted from the same chapter: at 10 requests per hour a single failure is
  a 10% hourly error rate, a 1000× burn rate, and **13.9% of the 30-day budget** — only seven
  failed requests per month are permitted. Mitigations: synthetic traffic, combining services,
  making a single failure less impactful, or lowering the SLO.

### The VOID

Courtney Nash's SREcon22 talk and the VOID reports: incident duration data across thousands of
public reports is long-tailed and inconsistently bounded, so **MTTR carries much less signal than
its use as a KPI implies**. Used as an edge-case question in `obs-postmortems`.

### This repository, used as a worked example

Read from source, not assumed:

- `server/src/app.ts` — Fastify's pino logger is `level: "info"` in production and `"debug"`
  otherwise, with `pino-pretty` as a transport only when not in production. It redacts
  `req.headers.cookie`, `req.headers.authorization`, `res.headers["set-cookie"]`,
  `req.body.password`, `req.body.newPassword`, `req.body.currentPassword` and `req.body.secret`,
  censor `[redacted]`. `trustProxy` is on in production because Caddy terminates TLS. All of this
  is cited in `obs-structured-logging`, including the point that path-based redaction is a
  deny-list.
- `server/src/lib/audit.ts` — `writeAudit` records every admin mutation into an `audit_log` table,
  with the comment "record what changed, not the new value". Used to make the
  audit-log-vs-application-log distinction concrete.
- `server/src/maintenance/retention.ts` — snapshot retention (default 90 days) deletes the image
  file and nulls `snapshot_path` **but keeps the row**. Informs the retention-tiering framing in
  `obs-log-aggregation`.
- `README.md` "Deploying v3 (VPS)" — one container bound to `127.0.0.1:8787`, Caddy in front,
  state on a volume, `curl /api/health` as the smoke test. This is why several topics say plainly
  that a Collector, a mesh, tail-based sampling and per-user metric labels are all solving
  problems this deployment does not have, and that the real trigger for log shipping is the second
  host (or a container that is replaced on every deploy).

## Validation

`npm run content:check -- --module devops-observability` → 1 module, 15 topics, 119 quiz
questions, 3 code challenges, 3 reference solutions run, **0 errors, 0 warnings**.
`tsc -p tsconfig.content.json --noEmit` → clean.
