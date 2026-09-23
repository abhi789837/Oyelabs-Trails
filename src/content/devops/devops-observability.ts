import type { Module } from "@/types/curriculum";

export default {
  id: "devops-observability",
  trackId: "devops",
  name: "Observability",
  description:
    "Knowing what your system is doing, and finding out why it broke. Logs, metrics and traces; Prometheus, Grafana and OpenTelemetry; and the judgement that turns all of it into SLOs, alerts worth waking someone for, and incidents you actually learn from.",
  refs: [
    { label: "Google SRE Book", url: "https://sre.google/sre-book/table-of-contents/", kind: "docs" },
    { label: "Google SRE Workbook: Alerting on SLOs", url: "https://sre.google/workbook/alerting-on-slos/", kind: "docs" },
    { label: "Prometheus: Documentation", url: "https://prometheus.io/docs/introduction/overview/", kind: "docs" },
    { label: "OpenTelemetry: Documentation", url: "https://opentelemetry.io/docs/", kind: "docs" },
  ],
  topics: [
    {
      id: "obs-monitoring-vs-observability",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Monitoring vs Observability",
      summary:
        "Monitoring answers questions you thought to ask in advance: you decide that CPU above 90% matters, you build a dashboard for it, and you alert on it. Observability is the property of being able to ask questions you did *not* anticipate — to take a report of \"checkout is slow for one customer in Pune on Android\" and answer it from data you already have, without shipping a new deploy to add a metric.\n\nThat distinction explains the all-green dashboard. A dashboard is a pre-aggregated answer. When you record `http_requests_total` by status code and average latency per service, you have thrown away which user, which tenant, which build, which region — so a failure that affects 0.5% of requests, all of them from one tenant, disappears into an average that still looks healthy. The system is not lying; you only kept the dimensions you guessed would matter.\n\nThe tradeoff is cost. Metrics are cheap precisely because they are low-cardinality and pre-aggregated, and a dashboard renders in milliseconds off a few thousand time series. Keeping wide, high-cardinality events so you can slice by `user_id` later costs orders of magnitude more to store and query. Most teams end up with both: cheap metrics for \"is it broken\", and something wider — traces, wide events, sampled logs — for \"why\".\n\nThe honest gotcha for a small team: a single self-hosted app with one process and one database does not have unknown-unknowns at the same rate a 200-service mesh does. Buying a distributed-tracing pipeline for it is cargo cult. Buying nothing at all, and finding out about outages from users, is worse.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Google SRE Book: Monitoring Distributed Systems", url: "https://sre.google/sre-book/monitoring-distributed-systems/", kind: "docs" },
        { label: "Honeycomb: Observability — A Manifesto", url: "https://www.honeycomb.io/blog/observability-a-manifesto", kind: "article" },
        { label: "Charity Majors: Live Your Best Life With Structured Events", url: "https://charity.wtf/p/live-your-best-life-with-structured-events", kind: "article" },
      ],
      video: {
        title: "Introduction To Observability | Monitoring vs Observability",
        channel: "Tech Tutorials with Piyush",
        url: "https://www.youtube.com/watch?v=_Gj6eSCFWts",
        videoId: "_Gj6eSCFWts",
        durationLabel: "21:54",
      },
      alternateVideos: [
        {
          title: "Observability 2.0: Transforming Logging & Metrics • Charity Majors & James Lewis • GOTO 2024",
          channel: "GOTO Conferences",
          url: "https://www.youtube.com/watch?v=1PJM8p-RMsY",
          videoId: "1PJM8p-RMsY",
          durationLabel: "29:51",
        },
        {
          title: "Observability vs. APM vs. Monitoring",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=CAQ_a2-9UOI",
          videoId: "CAQ_a2-9UOI",
          durationLabel: "9:40",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-monitoring-vs-observability-q1",
          prompt:
            "Users report that login has been failing for the last twenty minutes. Every dashboard is green: request rate normal, error rate 0.4%, p95 latency unchanged. What is the most likely explanation?",
          options: [
            "The failures are concentrated in a dimension the dashboards aggregate away, such as one tenant, one region or one client version",
            "The monitoring agent has crashed and is serving stale data",
            "The dashboards are correct and the users are mistaken",
            "Prometheus is dropping samples because of a scrape timeout",
          ],
          correctIndex: 0,
          explanation:
            "A 0.4% global error rate is entirely compatible with 100% failure for one slice of traffic. Aggregation is the mechanism that hides it; stale data and dropped scrapes would usually show as gaps or a flatlined `up` series, not as plausible-looking normal values.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-monitoring-vs-observability-q2",
          prompt: "Which of these are genuine consequences of metrics being pre-aggregated? (Select all that apply.)",
          options: [
            "You cannot retroactively break a counter down by a dimension you did not record as a label",
            "The cost of storing a metric depends on the number of label-value combinations, not on request volume",
            "An average latency can look healthy while a meaningful fraction of requests are very slow",
            "Metrics cannot be used for alerting, only for dashboards",
            "Adding a new label to an existing metric retroactively re-labels historical data",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Aggregation is lossy going forward and backwards: new labels only apply from the moment you deploy them, and the cost is driven by series count (cardinality), not traffic. Metrics are in fact the usual basis for alerting.",
        },
        {
          id: "obs-monitoring-vs-observability-q3",
          prompt:
            "A team adds `user_id` as a label on `http_requests_total` so they can debug per-user problems from their metrics. What happens?",
          options: [
            "Prometheus creates one time series per user per label combination, and memory and query cost grow until the server falls over",
            "Prometheus hashes the label and stores it compactly, so cost is unchanged",
            "Prometheus rejects the label because it is not in the metric's declared schema",
            "Nothing changes until the metric is queried with that label",
          ],
          correctIndex: 0,
          explanation:
            "Every distinct combination of label values is a separate time series with its own in-memory index entry and chunk. Per-user labels are the canonical cardinality bomb; user-level debugging belongs in traces, logs or a wide-event store.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-monitoring-vs-observability-q4",
          prompt: "In the control-theory sense the term borrows from, what does it mean for a system to be observable?",
          options: [
            "Its internal state can be inferred from its external outputs",
            "It emits logs at every level from debug to fatal",
            "Its dashboards refresh at least once per minute",
            "It exports metrics in an open format",
          ],
          correctIndex: 0,
          explanation:
            "Observability is about whether the outputs are rich enough to reconstruct internal state. Log levels, refresh rates and formats are implementation details that may or may not get you there.",
        },
        {
          id: "obs-monitoring-vs-observability-q5",
          prompt: "Which of these questions genuinely needs observability rather than monitoring?",
          options: [
            "Which combination of tenant, endpoint and app version is producing these timeouts?",
            "Is the error rate above 1%?",
            "Is disk usage above 85%?",
            "Is the service up?",
          ],
          correctIndex: 0,
          explanation:
            "The tenant/endpoint/version question is open-ended and multi-dimensional — you did not know in advance to build that view. The other three are fixed thresholds on known signals, which is exactly what monitoring does well and cheaply.",
        },
        {
          id: "obs-monitoring-vs-observability-q6",
          prompt: "What is the practical difference between black-box and white-box monitoring?",
          options: [
            "Black-box observes the system from outside as a user would; white-box uses internals the system exports about itself",
            "Black-box is commercial tooling; white-box is open source",
            "Black-box means unencrypted telemetry; white-box means encrypted",
            "Black-box is for infrastructure; white-box is for applications",
          ],
          correctIndex: 0,
          explanation:
            "Black-box probes (a synthetic login, an HTTP check) prove a symptom is real right now, which makes them good for paging. White-box telemetry explains why, and can warn about problems that have not surfaced yet.",
        },
        {
          id: "obs-monitoring-vs-observability-q7",
          prompt:
            "A service records only `requests_total`, `errors_total` and `latency_avg_seconds`, with no labels beyond the service name. Which incident would this set-up be *least* able to explain?",
          options: [
            "A single downstream dependency timing out for 3% of requests",
            "The whole service returning 500s after a bad deploy",
            "The service becoming unreachable entirely",
            "A doubling of overall traffic",
          ],
          correctIndex: 0,
          explanation:
            "A total failure, an outage or a traffic spike all move the three aggregate numbers unmistakably. A 3% partial failure attributable to one dependency needs a breakdown that these metrics never recorded.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-monitoring-vs-observability-q8",
          prompt: "Why is \"observability\" not simply a synonym for \"having all three of logs, metrics and traces\"?",
          options: [
            "You can emit all three and still be unable to answer a new question, if none of them carries the dimension you need",
            "Traces alone are sufficient, so the other two are redundant",
            "The three signals are mutually exclusive in practice",
            "Observability requires a fourth signal, profiles, to be meaningful",
          ],
          correctIndex: 0,
          explanation:
            "The signals are transport formats, not a guarantee. Three unlabelled, uncorrelated streams answer no more questions than one. Profiles are genuinely useful but are not a precondition.",
        },
        {
          id: "obs-monitoring-vs-observability-q9",
          prompt:
            "This repository is a single Fastify process with SQLite on one VPS behind Caddy. Which observability investment has the best payoff *first*? (Select all that apply.)",
          options: [
            "Structured request logs with a request id, kept long enough to investigate a report from yesterday",
            "An uptime check from outside the box that pages when the health endpoint fails",
            "A deployed OpenTelemetry Collector with tail-based sampling across services",
            "Per-user metric labels so any customer's requests can be graphed",
            "A service mesh to capture inter-service traffic",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "With one process and one database there are no inter-service hops to trace and no fleet to sample. Logs you can search and an external check that notices the box is gone cover almost everything. A collector, a mesh and per-user labels are all solving problems this shape of system does not have.",
        },
        {
          id: "obs-monitoring-vs-observability-q10",
          prompt: "What does it cost, operationally, to answer a question by adding a new metric?",
          options: [
            "A code change, a deploy, and then waiting for enough new data to accumulate before the question can be answered",
            "Nothing — metrics can be backfilled from existing logs automatically",
            "Only a dashboard edit, since the data is already collected",
            "A restart of the metrics backend to pick up the new schema",
          ],
          correctIndex: 0,
          explanation:
            "That round trip is the real argument for keeping richer raw data: during an incident, \"deploy a new metric and wait an hour\" is not an answer. No backend backfills metrics you never emitted.",
        },
      ],
    },
    {
      id: "obs-three-signals",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "The Three Signals: Logs, Metrics and Traces",
      summary:
        "The three signals are not three views of the same data; they are three different trade-offs between detail and cost. A metric is a number over time with a small, fixed set of dimensions — cheap enough to keep at full resolution for a year, useless for explaining any single request. A log line is a detailed record of one event, expensive per byte, and searchable but not summarisable. A trace is a causally linked set of spans describing one request as it crosses process boundaries — the only signal that shows *where* the time went and *which* call caused which.\n\nThe practical rule: alert on metrics, because they are cheap to evaluate continuously and have low false-positive noise; debug with traces, because they answer \"which hop\"; and reach for logs when you need the specific detail — the query text, the exception, the payload shape — that neither of the other two carries.\n\nTwo things make them far more useful together than apart. Correlation: put the trace id on every log line and every span, and \"this alert fired\" becomes \"here is the exact trace and its logs\". And exemplars: attach a sample trace id to a metric bucket, so clicking the spike on the latency histogram opens a real slow request rather than a number.\n\nThe cost gotcha runs in the opposite direction to the usefulness gotcha. Logs scale with traffic and are the line item that surprises teams on their first big month; metrics scale with cardinality and are the line item that kills the Prometheus server. Profiles are increasingly treated as a fourth signal, answering \"which function\" the way a trace answers \"which service\".",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "OpenTelemetry: Signals", url: "https://opentelemetry.io/docs/concepts/signals/traces/", kind: "docs" },
        { label: "Grafana: The RED Method", url: "https://grafana.com/blog/the-red-method-how-to-instrument-your-services/", kind: "article" },
        { label: "Brendan Gregg: The USE Method", url: "https://www.brendangregg.com/usemethod.html", kind: "article" },
      ],
      video: {
        title: "Logs, Metrics and Traces - 3 pillars of Observability",
        channel: "Tech Tutorials with Piyush",
        url: "https://www.youtube.com/watch?v=GsW0-uiCwqQ",
        videoId: "GsW0-uiCwqQ",
        durationLabel: "15:47",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-three-signals-q1",
          prompt:
            "A request that normally takes 200 ms is taking 4 seconds. You need to know which of the seven services in its path is responsible. Which signal answers that directly?",
          options: [
            "A trace, because spans record the duration of each hop and their parent-child relationships",
            "Metrics, because you can compare each service's average latency",
            "Logs, because each service logs its own start and end time",
            "A profile, because it shows which function is consuming CPU",
          ],
          correctIndex: 0,
          explanation:
            "Only a trace carries causality: it ties this request's spans together so you can see one hop consumed 3.8 s. Per-service averages tell you nothing about this request, and stitching timestamps out of seven services' logs by hand is what tracing exists to avoid.",
        },
        {
          id: "obs-three-signals-q2",
          prompt: "Which statements about the cost profile of each signal are true? (Select all that apply.)",
          options: [
            "Log volume grows roughly with request volume",
            "Metric storage grows with the number of distinct label combinations, largely independent of request volume",
            "Trace volume is usually controlled by sampling rather than by storing every request",
            "Metric storage grows linearly with request volume because every request increments a counter",
            "Logs are cheaper than metrics at any volume because they compress well",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Incrementing a counter a million times still stores one sample per scrape — cost follows series count, not increments. Log cost does follow traffic, which is why sampling and retention tiers exist, and traces are almost always sampled.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-three-signals-q3",
          prompt: "What does the RED method prescribe for a request-driven service?",
          options: [
            "Rate, Errors and Duration for every service",
            "Reliability, Efficiency and Durability targets per quarter",
            "Requests, Endpoints and Dependencies as dashboard rows",
            "Recovery, Escalation and Deferral as incident stages",
          ],
          correctIndex: 0,
          explanation:
            "RED is the request-side counterpart to USE (Utilisation, Saturation, Errors), which is about resources. Both are shortcuts for \"what do I instrument first\".",
        },
        {
          id: "obs-three-signals-q4",
          prompt: "What is an exemplar, in the metrics sense?",
          options: [
            "A trace id attached to a metric observation, so a point on a histogram links to a concrete request",
            "A reference dashboard shipped with an exporter",
            "A recording rule that other rules are derived from",
            "A canonical alert definition maintained by the vendor",
          ],
          correctIndex: 0,
          explanation:
            "Exemplars are the bridge from the aggregate back to an individual: you see the p99 bucket spike and jump straight into one of the actual slow traces. Without them you go from metric to trace by guessing a time range.",
        },
        {
          id: "obs-three-signals-q5",
          prompt:
            "Your traces are sampled at 1%. An alert fires for a rare error affecting roughly 1 in 5,000 requests. What is the likely problem when you go looking for a trace?",
          options: [
            "Head-based sampling has almost certainly discarded the failing requests, so there is no trace to look at",
            "The sampled traces will be biased towards the failures, over-representing them",
            "Sampling only affects storage, not which traces you can query",
            "The trace backend will reconstruct the missing spans from the metrics",
          ],
          correctIndex: 0,
          explanation:
            "Head-based sampling decides at the first span, before anyone knows the request will fail, so rare failures are usually thrown away. Tail-based sampling — decide after the trace completes, keep the errors and the slow ones — exists precisely for this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-three-signals-q6",
          prompt: "Why put the trace id on every log line?",
          options: [
            "It turns \"all logs from that minute\" into \"the logs belonging to this one request across every service\"",
            "It lets the log backend deduplicate identical lines",
            "It is required by the OpenTelemetry logs specification",
            "It replaces the need to log a timestamp",
          ],
          correctIndex: 0,
          explanation:
            "Correlation is the whole point: one field turns three disconnected streams into one story. Deduplication, timestamps and spec compliance are unrelated.",
        },
        {
          id: "obs-three-signals-q7",
          prompt: "Which signal would you use to answer each question best? Pick the pairing that is wrong.",
          options: [
            "\"What was the exact SQL that failed?\" → metrics",
            "\"Is the error rate rising?\" → metrics",
            "\"Which downstream call is slow?\" → traces",
            "\"What was the stack trace?\" → logs",
          ],
          correctIndex: 0,
          explanation:
            "Metrics deliberately throw away the payload. Putting a SQL string into a metric label would be a cardinality catastrophe; that detail belongs in a log line or a span attribute.",
        },
        {
          id: "obs-three-signals-q8",
          prompt: "What is the USE method for, and what are its three components?",
          options: [
            "Resources: Utilisation, Saturation and Errors for every resource (CPU, disk, network, pool)",
            "Requests: Uptime, Speed and Errors for every endpoint",
            "Teams: Understanding, Scope and Escalation during incidents",
            "Storage: Usage, Size and Expiry for every retention tier",
          ],
          correctIndex: 0,
          explanation:
            "USE is resource-centric and complements RED's request-centric view. Queue depth and connection-pool saturation are the checks that catch \"CPU looks fine but everything is waiting\".",
        },
        {
          id: "obs-three-signals-q9",
          prompt:
            "A team stores every log line for 90 days at full fidelity and finds the bill has tripled. Which changes genuinely reduce cost without destroying the ability to debug? (Select all that apply.)",
          options: [
            "Drop debug-level logs in production and keep info and above",
            "Sample high-volume, low-information lines (successful health checks, cache hits) rather than dropping whole categories",
            "Keep a short hot retention for searchable logs and a longer, cheaper cold tier for compliance",
            "Move every log line into a metric label so it is stored as a time series instead",
            "Turn off logging entirely on the busiest service",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Level filtering, sampling and tiering all trade a little fidelity for a lot of cost. Turning log text into metric labels swaps a log bill for a cardinality explosion, and switching off logging on the busiest service guarantees you are blind exactly where it matters.",
        },
        {
          id: "obs-three-signals-q10",
          prompt: "Profiles are often called the fourth signal. What question do they answer that the other three do not?",
          options: [
            "Which functions inside a process are consuming CPU, memory or lock time",
            "Which service in a request path is slow",
            "How many requests failed in the last five minutes",
            "What a specific user did before the error",
          ],
          correctIndex: 0,
          explanation:
            "A trace stops at the process boundary and says \"this service took 3 s\". A profile goes inside and says which function that was. The other two options are trace and metric territory respectively.",
        },
      ],
    },
    {
      id: "obs-structured-logging",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Structured Logging, Levels and Correlation IDs",
      summary:
        "A log line written for a human (`User 42 failed to log in at 10:32`) is a string that a machine has to guess at. A structured log line is an object — `{\"level\":\"warn\",\"msg\":\"login failed\",\"userId\":42,\"reason\":\"bad_password\",\"reqId\":\"c1f2...\"}` — that a log backend can index, filter and aggregate without regular expressions. The cost is that it is slightly less pleasant to read raw, which is why most loggers pretty-print in development and emit JSON in production. This repository does exactly that: Fastify's pino logger uses `pino-pretty` when not in production and raw JSON otherwise, at `debug` level in development and `info` in production.\n\nLevels only earn their keep if they mean something the same way everywhere. A workable convention: `error` means a human should eventually look; `warn` means something recovered but was not supposed to happen; `info` is the business-visible events you would want in an audit of normal operation; `debug` is for development and is off in production. If every handled exception logs at `error`, the level stops carrying information and alerting on error counts becomes meaningless.\n\nCorrelation is the second half. A request id generated (or accepted from a header) at the edge and attached to every line means one grep reconstructs the request. With tracing in play, use the trace id so logs and spans join up. Fastify gives every request a `reqId` and a child logger for free — using `request.log` rather than the root logger is the difference between correlated logs and confetti.\n\nThe gotcha that bites in production is redaction. Logging a whole request or response object ships cookies, `authorization` headers and password fields into a log store that far more people can read than can read the database. This repo redacts `req.headers.cookie`, `req.headers.authorization`, `res.headers[\"set-cookie\"]` and the password fields by path, with a `[redacted]` censor — a deny-list, which means every new sensitive field is a new entry someone has to remember.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "OpenTelemetry: Logs Data Model", url: "https://opentelemetry.io/docs/specs/otel/logs/data-model/", kind: "spec" },
        { label: "The Twelve-Factor App: Logs", url: "https://12factor.net/logs", kind: "article" },
        { label: "pino: Redaction", url: "https://github.com/pinojs/pino/blob/main/docs/redaction.md", kind: "docs" },
        { label: "Fastify: Logging", url: "https://fastify.dev/docs/latest/Reference/Logging/", kind: "docs" },
      ],
      video: {
        title: "12 Logging BEST Practices in 12 minutes",
        channel: "Better Stack",
        url: "https://www.youtube.com/watch?v=I2mWnh66Bkg",
        videoId: "I2mWnh66Bkg",
        durationLabel: "12:00",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-structured-logging-q1",
          prompt:
            "Which of these log lines can a backend aggregate by failure reason without a custom parser?\n\n```text\nA: 2026-09-23 10:32:01 WARN  login failed for user 42: bad password\nB: {\"time\":\"...\",\"level\":\"warn\",\"msg\":\"login failed\",\"userId\":42,\"reason\":\"bad_password\"}\n```",
          options: [
            "B, because `reason` is a field the backend can group by",
            "A, because the text is easier to match with a regular expression",
            "Both, because modern backends infer structure from free text reliably",
            "Neither, because aggregation requires metrics, not logs",
          ],
          correctIndex: 0,
          explanation:
            "Structure at write time beats parsing at read time: the field exists, so `count by reason` is a query, not a regex someone has to maintain as the message wording drifts.",
        },
        {
          id: "obs-structured-logging-q2",
          prompt:
            "A Fastify handler does `app.log.info({ order }, \"order created\")` instead of `request.log.info(...)`. What is lost?",
          options: [
            "The request id and any other per-request bindings, so the line cannot be correlated with the rest of that request",
            "The timestamp, which only the request logger adds",
            "The log level, which defaults to trace on the root logger",
            "Nothing — the root logger and the request logger produce identical output",
          ],
          correctIndex: 0,
          explanation:
            "Fastify creates a child logger per request bound to `reqId`. The root logger has no request context, so the line lands in the stream with nothing tying it to the request that produced it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-structured-logging-q3",
          prompt: "Which of these are sound reasons to log to stdout rather than to a file the app manages itself? (Select all that apply.)",
          options: [
            "The process supervisor, container runtime or shipper owns rotation and shipping, so the app does not reimplement them",
            "It behaves identically whether the app runs in a container, under systemd or in a local shell",
            "Writing to a file the app opens can silently fail or fill the disk in ways the app does not handle",
            "stdout is buffered by the kernel, so logging can never block the process",
            "stdout output is automatically encrypted in transit",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Treating logs as an event stream the environment routes is the twelve-factor argument. But stdout is not magic: a slow or full pipe can block a writer, and nothing about stdout encrypts anything.",
        },
        {
          id: "obs-structured-logging-q4",
          prompt:
            "The Fastify app in this repository redacts `req.headers.cookie`, `req.headers.authorization`, `res.headers[\"set-cookie\"]` and several password fields. What class of mistake does that *not* protect against?",
          options: [
            "A new endpoint that accepts a secret under a field name nobody added to the redaction list",
            "An `authorization` header being logged as part of the request",
            "A session cookie being logged on the way in",
            "A `Set-Cookie` response header being logged on the way out",
          ],
          correctIndex: 0,
          explanation:
            "Path-based redaction is a deny-list: it covers exactly what is enumerated. The safer complement is not logging whole request or response bodies at all, so a new field is never in the stream to begin with.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-structured-logging-q5",
          prompt: "A service logs every handled exception at `error`, including expected validation failures. What is the consequence?",
          options: [
            "Error-rate alerts based on log level become noise, and real errors are lost among expected ones",
            "The log backend rejects the lines as malformed",
            "The process exits, because `error` is fatal in most loggers",
            "Nothing, as long as the messages are descriptive",
          ],
          correctIndex: 0,
          explanation:
            "Levels are a signal you are spending. If a 400 from a bad form logs at the same level as a database connection failure, the level no longer distinguishes \"wake someone\" from \"normal Tuesday\".",
        },
        {
          id: "obs-structured-logging-q6",
          prompt: "Where should a request id come from in a system that sits behind a reverse proxy?",
          options: [
            "Accept an inbound id from a trusted proxy header if present, otherwise generate one, and propagate it downstream",
            "Always generate a new one, ignoring anything the proxy sends",
            "Always trust the client-supplied header, since clients know their own request best",
            "Use the TCP connection id, which is unique per request",
          ],
          correctIndex: 0,
          explanation:
            "Accepting from a trusted hop preserves correlation across the proxy; generating when absent guarantees you always have one. Trusting an arbitrary client header lets anyone forge or collide ids, and connections are reused across requests.",
        },
        {
          id: "obs-structured-logging-q7",
          prompt: "Why do most teams pretty-print logs in development and emit raw JSON in production?",
          options: [
            "JSON is what machines ingest; pretty-printing costs CPU and produces output no backend parses",
            "JSON is not valid output for a terminal",
            "Pretty-printers strip sensitive fields, which is only wanted locally",
            "Production loggers cannot colourise output",
          ],
          correctIndex: 0,
          explanation:
            "It is a reader-audience decision. In this repo `pino-pretty` is wired up only when the environment is not production, exactly for that reason — and transports cost real CPU per line at volume.",
        },
        {
          id: "obs-structured-logging-q8",
          prompt: "This repo keeps a separate `audit_log` table for admin mutations, alongside its application logs. Why is that not duplication? (Select all that apply.)",
          options: [
            "Audit records must survive log retention and rotation, so they belong in durable storage",
            "Audit records answer \"who changed what\" and are queried by the application itself, not only by operators",
            "Application logs are routinely sampled, dropped and level-filtered, which would be unacceptable for an audit trail",
            "Application logs cannot record a user id",
            "SQLite writes are faster than stdout writes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "An audit trail is a product feature with its own durability and query requirements; an application log is operational exhaust that gets filtered and expires. Application logs can of course record a user id, and relative write speed is irrelevant to the decision.",
        },
        {
          id: "obs-structured-logging-q9",
          prompt: "What is the risk of logging a large object at every request, such as the full parsed body?",
          options: [
            "Serialisation cost per request, log bill growth, and an unbounded surface for leaking fields nobody redacted",
            "The logger will truncate it silently, so nothing is gained or lost",
            "JSON loggers cannot serialise nested objects",
            "It prevents the log backend from indexing any field",
          ],
          correctIndex: 0,
          explanation:
            "It is the combination that hurts: CPU on every request, bytes you pay for, and PII you did not intend to ship. Logging the fields you actually need is both cheaper and safer.",
        },
        {
          id: "obs-structured-logging-q10",
          prompt: "In the OpenTelemetry logs data model, what distinguishes a log record from a span event?",
          options: [
            "A log record stands alone and may or may not carry trace context; a span event is attached to a specific span in a trace",
            "Span events are unstructured strings; log records are structured",
            "Log records cannot carry a severity; span events can",
            "They are the same thing under two names",
          ],
          correctIndex: 0,
          explanation:
            "The model deliberately allows log records to carry `TraceId` and `SpanId` so existing logging can join a trace, while span events are timestamped annotations that only exist inside a span.",
        },
      ],
    },
    {
      id: "obs-log-aggregation",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Log Aggregation and the Cost of Cardinality",
      summary:
        "Aggregation is what turns logs on twelve machines into one searchable place. The architectural choice underneath every log system is how much it indexes. Elasticsearch-style systems index every field, which makes arbitrary queries fast and makes ingestion and storage expensive. Loki-style systems index only a small set of labels and store the log body compressed, which makes ingestion cheap and makes a query that is not label-selective into a brute-force scan.\n\nThat choice is why cardinality shows up here too, in a different costume. In Loki, each unique combination of label values is a *stream* with its own chunks; putting a request id, a user id or a full URL path into a label produces millions of tiny streams, wrecks compression and makes the index the largest thing you store. The fix is not \"do not record it\" — it is to record it in the log body or, in newer Loki, as structured metadata, and filter on it at query time, paying CPU during an investigation instead of storage forever.\n\nRetention is the other lever, and it is a policy question more than a technical one. Most teams want days of searchable, hot logs and months of cheap, cold archive; almost nobody needs 90 days of full-fidelity debug logs, and the ones who think they do have usually not priced it. Sampling helps where volume is dominated by uninformative success: keeping 1 in 100 successful health checks while keeping 100% of errors preserves the signal and removes most of the bytes.\n\nFor a single-box deployment like this repository's, the honest answer is that `docker compose logs` and journald are a log aggregation system — one host, one process, rotation handled by the runtime. The moment there are two hosts, or the container is replaced on every deploy and its logs go with it, that stops being true, and that is the real trigger for shipping logs somewhere.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Grafana Loki: Understand labels", url: "https://grafana.com/docs/loki/latest/get-started/labels/", kind: "docs" },
        { label: "Grafana Loki: What is structured metadata", url: "https://grafana.com/docs/loki/latest/get-started/labels/structured-metadata/", kind: "docs" },
        { label: "Elastic Common Schema (ECS) reference", url: "https://www.elastic.co/docs/reference/ecs", kind: "docs" },
      ],
      video: {
        title: "Meet Grafana LOKI, a Log Aggregation System for EVERYTHING",
        channel: "Techno Tim",
        url: "https://www.youtube.com/watch?v=h_GGd7HfKQ8",
        videoId: "h_GGd7HfKQ8",
        durationLabel: "28:13",
      },
      alternateVideos: [
        {
          title: "ObservabilityCON 2022 - Cardinality Management",
          channel: "Grafana",
          url: "https://www.youtube.com/watch?v=EmZ6wycniGs",
          videoId: "EmZ6wycniGs",
          durationLabel: "10:26",
        },
        {
          title: "SREcon24 Americas - The Sins of High Cardinality",
          channel: "USENIX",
          url: "https://www.youtube.com/watch?v=_6iXRW3BG1U",
          videoId: "_6iXRW3BG1U",
          durationLabel: "19:33",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-log-aggregation-q1",
          prompt: "What is the core design difference between an index-everything log store and a label-indexed one such as Loki?",
          options: [
            "One indexes every field at ingest so any query is fast; the other indexes only labels and scans compressed bodies at query time",
            "One stores JSON and the other stores plain text",
            "One is push-based and the other is pull-based",
            "One supports retention policies and the other does not",
          ],
          correctIndex: 0,
          explanation:
            "It is a straight trade of ingest and storage cost against query flexibility. Both store structured logs, both support retention, and both are push-based from the agent's point of view.",
        },
        {
          id: "obs-log-aggregation-q2",
          prompt:
            "A team adds `request_id` as a Loki label so they can find a request instantly. What happens? (Select all that apply.)",
          options: [
            "Each request becomes its own stream, so the number of streams grows with traffic",
            "Chunks become tiny and compress poorly, inflating storage",
            "The index, which was supposed to be small, becomes the dominant cost",
            "Queries for everything else get faster, because the index is more selective",
            "Loki rejects the write because labels must come from a fixed schema",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Unbounded label values are the canonical Loki failure. The right home for a request id is the log line body or structured metadata, filtered at query time. Nothing gets faster, and Loki does not enforce a schema.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-log-aggregation-q3",
          prompt: "Which of these make reasonable Loki labels for an application's logs?",
          options: [
            "`app`, `env`, `namespace`, `level` — a small, bounded set that you filter on first",
            "`trace_id`, `user_id`, `session_id` — the identifiers you search by most",
            "`url` and `query_string`, so you can find a specific page's logs",
            "`timestamp`, so that time-range queries are indexed",
          ],
          correctIndex: 0,
          explanation:
            "Good labels are low-cardinality and describe the *source* of the stream. Identifiers and URLs belong in the body or structured metadata; time is already the primary axis and never belongs in a label.",
        },
        {
          id: "obs-log-aggregation-q4",
          prompt: "Why does structured metadata exist in Loki, given that you can already put anything in the log line?",
          options: [
            "It attaches high-cardinality fields to a line without creating a new stream, so they can be filtered without being indexed as labels",
            "It compresses better than the log body",
            "It allows log lines to exceed the maximum line length",
            "It is the only way to store JSON logs",
          ],
          correctIndex: 0,
          explanation:
            "It is the middle ground between \"label\" (indexed, must be low cardinality) and \"buried in a string\" (needs parsing on every query). Trace ids are the motivating example.",
        },
        {
          id: "obs-log-aggregation-q5",
          prompt:
            "A service emits 40,000 log lines per second, 99.5% of them successful health checks and cache hits. Which sampling strategy keeps the debugging value and removes most of the cost?",
          options: [
            "Keep 100% of errors and warnings, and 1 in 100 of the uninformative successes",
            "Keep 1 in 100 of all lines uniformly",
            "Keep the first 400 lines of every second and drop the rest",
            "Keep only errors and drop everything else",
          ],
          correctIndex: 0,
          explanation:
            "Sampling should be biased towards the rare and interesting. Uniform sampling throws away 99% of your errors too; head-truncating each second biases by arrival order; keeping only errors leaves you unable to see what normal looked like.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-log-aggregation-q6",
          prompt: "What does a tiered retention policy typically look like, and why?",
          options: [
            "Days of hot, searchable logs plus months of cheap cold storage, because investigations are recent and compliance is not",
            "Equal retention for all logs, because inconsistent retention is confusing",
            "Indefinite retention of everything, because storage is cheap",
            "Hot storage only, with a nightly delete, because old logs are never useful",
          ],
          correctIndex: 0,
          explanation:
            "Almost all debugging happens within days of the event; almost all long retention exists for audit or legal reasons that do not need fast search. Pricing the two separately is where the savings are.",
        },
        {
          id: "obs-log-aggregation-q7",
          prompt:
            "Logs stop arriving from one of twenty hosts. Nothing alerts. What is the design mistake?",
          options: [
            "Nothing monitors the absence of logs — an alert on \"no lines from host X in 10 minutes\" was never created",
            "The log backend should have retried the missing lines automatically",
            "The host should have buffered to disk until the backend was reachable",
            "Log agents are not supposed to be monitored",
          ],
          correctIndex: 0,
          explanation:
            "Silence looks identical to health in most log systems. Alerting on the *absence* of an expected signal (dead-man's-switch style) is the standard fix; buffering helps with backend outages but not with an agent that died.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-log-aggregation-q8",
          prompt: "Why does a common field-naming schema such as ECS or OpenTelemetry semantic conventions matter in an aggregated log store?",
          options: [
            "Queries and dashboards work across services only if the same concept has the same field name everywhere",
            "It reduces storage, because field names are interned",
            "It is required before logs can be shipped over TLS",
            "It allows the backend to infer log levels automatically",
          ],
          correctIndex: 0,
          explanation:
            "Three services calling the same thing `status`, `http_status` and `code` is what makes cross-service log queries impossible. Naming is the interoperability layer.",
        },
        {
          id: "obs-log-aggregation-q9",
          prompt:
            "This repository runs as a single container on one VPS, with Caddy in front and its logs going to the container runtime. When does that stop being adequate?",
          options: [
            "As soon as there is more than one host, or when the container is replaced on deploy and its logs go with it",
            "As soon as the log volume exceeds 1 MB per day",
            "As soon as JSON logging is enabled",
            "Never — a single host never needs log shipping",
          ],
          correctIndex: 0,
          explanation:
            "Aggregation buys you two things: one place to search across machines, and survival of the process that wrote the logs. Neither matters much with one long-lived container; both matter immediately when that changes.",
        },
        {
          id: "obs-log-aggregation-q10",
          prompt: "A query over a label-indexed log store times out. Which changes are likely to make it complete? (Select all that apply.)",
          options: [
            "Narrow the time range",
            "Add a label selector that is actually selective, so fewer streams are scanned",
            "Move an expensive regular-expression filter to after a cheap substring filter",
            "Add more labels to the ingested data so the index is bigger",
            "Increase the retention period",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "These stores scan what the labels select over the time range chosen, so the wins are narrowing both and filtering cheaply before expensively. More labels means more streams and a bigger index, and retention has nothing to do with a single query's cost.",
        },
      ],
    },
    {
      id: "obs-metrics-and-percentiles",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Counters, Gauges, Histograms — and Why Averages Lie",
      summary:
        "There are only a few metric types, and picking the wrong one is the most common instrumentation bug. A **counter** only ever goes up (and resets to zero on restart); you never graph its absolute value, you graph its rate. A **gauge** goes up and down and represents a current value — queue depth, memory in use, connections open. A **histogram** counts observations into cumulative buckets, which is how you get latency distributions. A **summary** computes quantiles inside the process instead, which is cheaper to query and fundamentally broken to aggregate.\n\nThat last point is the one worth internalising. An average latency of 100 ms is compatible with 99% of requests at 20 ms and 1% at 8 seconds. Worse, if a page makes calls to several backends, the 99th percentile of one backend becomes roughly the median experience of the page. So you track percentiles — and then hit the second trap: **percentiles do not average**. Taking the p99 from five instances and averaging the five numbers produces a value that is not the p99 of anything. There is no arithmetic that recovers a true quantile from per-instance quantiles, which is exactly why Prometheus summaries cannot be aggregated across instances and histograms can: bucket *counts* are additive, quantiles are not.\n\nA classic histogram estimates a quantile by finding the bucket the rank falls into and interpolating linearly inside it, assuming observations are spread evenly across the bucket. That has consequences you can see on a dashboard: your p99 can never be more precise than your bucket boundaries, and if the quantile lands in the `+Inf` bucket the best answer available is the highest finite bucket bound — which is why a p99.9 sometimes sits pinned at exactly `10` for days. Native histograms (dynamic exponential buckets) exist to remove the fixed-bucket problem.\n\nThe practical rule: choose bucket boundaries around the thresholds you actually care about — your SLO, your timeout — not around round numbers.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Prometheus: Metric types", url: "https://prometheus.io/docs/concepts/metric_types/", kind: "docs" },
        { label: "Prometheus: Histograms and summaries", url: "https://prometheus.io/docs/practices/histograms/", kind: "docs" },
        { label: "Prometheus: Native Histograms", url: "https://prometheus.io/docs/specs/native_histograms/", kind: "spec" },
        { label: "Google SRE Book: Worrying About Your Tail", url: "https://sre.google/sre-book/monitoring-distributed-systems/", kind: "article" },
      ],
      video: {
        title: "Understanding Prometheus Metric Types | Meaning and Usage (Gauge, Counter, Summary, Histogram)",
        channel: "Prometheus Monitoring with Julius | PromLabs",
        url: "https://www.youtube.com/watch?v=fhx0ehppMGM",
        videoId: "fhx0ehppMGM",
        durationLabel: "11:19",
      },
      alternateVideos: [
        {
          title: "Understanding Prometheus Histograms | Motivation and Concepts, Instrumentation, Querying in PromQL",
          channel: "Prometheus Monitoring with Julius | PromLabs",
          url: "https://www.youtube.com/watch?v=yYbXak-1hew",
          videoId: "yYbXak-1hew",
          durationLabel: "22:04",
        },
        {
          title: "SREcon19 Americas - Latency SLOs Done Right",
          channel: "USENIX",
          url: "https://www.youtube.com/watch?v=iPotMqzOsDI",
          videoId: "iPotMqzOsDI",
          durationLabel: "30:45",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `histogramQuantile(phi, buckets)` — the calculation `histogram_quantile()` performs on a classic Prometheus histogram.\n\n`buckets` is an array of `{ le, count }` objects in **any order**, where `le` is the inclusive upper bound of the bucket (a number, or the string `\"+Inf\"`) and `count` is the **cumulative** number of observations at or below that bound.\n\nReturn the estimated quantile as a number, or `null` when it cannot be computed. Return `null` if:\n\n- `phi` is not a number in the range 0 to 1 inclusive,\n- there are fewer than two buckets,\n- there is no `\"+Inf\"` bucket,\n- the `\"+Inf\"` bucket's count is 0 (no observations).\n\nOtherwise:\n\n1. Sort the finite buckets by `le` ascending. The total number of observations is the `\"+Inf\"` bucket's count.\n2. `rank = phi * total`.\n3. Find the first finite bucket whose cumulative `count` is greater than or equal to `rank`.\n4. If no finite bucket reaches `rank`, the quantile lies in the `+Inf` bucket: return the largest finite `le`.\n5. Otherwise interpolate linearly inside the bucket you found. Its lower bound is the previous bucket's `le`, or `0` for the first bucket. Its own observation count is its cumulative count minus the previous bucket's cumulative count (or minus 0 for the first bucket).\n\n```text\nstart + (le - start) * ((rank - previousCount) / bucketObservations)\n```\n\nTwo guards:\n\n- If the matching bucket is the first one and its `le` is less than or equal to 0, return that `le` unchanged.\n- If the matching bucket holds no observations of its own, return its lower bound rather than dividing by zero.\n\nDo not mutate the array you are given.",
        starterCode:
          "/**\n * @param {number} phi                                       quantile in [0, 1]\n * @param {{ le: number | \"+Inf\", count: number }[]} buckets  cumulative bucket counts\n * @returns {number | null}\n */\nfunction histogramQuantile(phi, buckets) {\n  // Your code here\n}\n",
        functionName: "histogramQuantile",
        testCases: [
          {
            description: "the median lands exactly on a bucket boundary",
            args: [
              0.5,
              [
                { le: 10, count: 0 },
                { le: 50, count: 100 },
                { le: 100, count: 150 },
                { le: 250, count: 180 },
                { le: 500, count: 196 },
                { le: 1000, count: 198 },
                { le: "+Inf", count: 200 },
              ],
            ],
            expected: 50,
          },
          {
            description: "the p90 of the same histogram",
            args: [
              0.9,
              [
                { le: 10, count: 0 },
                { le: 50, count: 100 },
                { le: 100, count: 150 },
                { le: 250, count: 180 },
                { le: 500, count: 196 },
                { le: 1000, count: 198 },
                { le: "+Inf", count: 200 },
              ],
            ],
            expected: 250,
          },
          {
            description: "the p95 falls between boundaries and is interpolated",
            args: [
              0.95,
              [
                { le: 10, count: 0 },
                { le: 50, count: 100 },
                { le: 100, count: 150 },
                { le: 250, count: 180 },
                { le: 500, count: 196 },
                { le: 1000, count: 198 },
                { le: "+Inf", count: 200 },
              ],
            ],
            expected: 406.25,
          },
          {
            description: "buckets arrive out of order and must be sorted first",
            args: [
              0.9,
              [
                { le: "+Inf", count: 200 },
                { le: 100, count: 150 },
                { le: 10, count: 0 },
                { le: 1000, count: 198 },
                { le: 50, count: 100 },
                { le: 500, count: 196 },
                { le: 250, count: 180 },
              ],
            ],
            expected: 250,
          },
          {
            description: "a quantile inside the first bucket interpolates from 0",
            args: [
              0.2,
              [
                { le: 100, count: 40 },
                { le: 200, count: 60 },
                { le: "+Inf", count: 100 },
              ],
            ],
            expected: 50,
          },
          {
            description: "the p99.9 lands in the +Inf bucket, so the last finite bound is the best answer",
            args: [
              0.999,
              [
                { le: 10, count: 0 },
                { le: 50, count: 100 },
                { le: 100, count: 150 },
                { le: 250, count: 180 },
                { le: 500, count: 196 },
                { le: 1000, count: 198 },
                { le: "+Inf", count: 200 },
              ],
            ],
            expected: 1000,
            isEdgeCase: true,
          },
          {
            description: "a histogram with no observations returns null",
            args: [
              0.9,
              [
                { le: 100, count: 0 },
                { le: "+Inf", count: 0 },
              ],
            ],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "a histogram without a +Inf bucket returns null",
            args: [
              0.9,
              [
                { le: 100, count: 40 },
                { le: 200, count: 60 },
              ],
            ],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "a single bucket returns null",
            args: [0.9, [{ le: "+Inf", count: 10 }]],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "a quantile outside 0..1 returns null",
            args: [
              1.5,
              [
                { le: 100, count: 40 },
                { le: 200, count: 60 },
                { le: "+Inf", count: 100 },
              ],
            ],
            expected: null,
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "obs-prometheus",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Prometheus: the Pull Model and the Data Model",
      summary:
        "Prometheus scrapes. Targets expose a plain-text `/metrics` endpoint and the server fetches it on an interval it controls, rather than applications pushing samples to a collector. The consequences are practical rather than ideological: the server knows the full list of things it is supposed to be scraping (via service discovery), so \"target is gone\" is detectable — it writes a synthetic `up` series per target — and a target that is slow or broken cannot flood the server, because the server decides when to ask. The cost is that anything the server cannot reach needs a workaround: short-lived batch jobs push to a Pushgateway, and networks that block inbound connections need a proxy or a push-based system instead.\n\nThe data model is a metric name plus a set of key/value labels, with a stream of `(timestamp, float64)` samples. Every distinct combination of label values is a separate time series, and that multiplication is the whole cardinality story: five services × twenty endpoints × six status codes is 600 series, which is nothing; add `user_id` and it is 600 × your user count, which is an outage. Prometheus holds an in-memory index of every active series, so cardinality is paid in RAM continuously, not just in disk.\n\nStorage is deliberately local and single-node: no clustering, no replication, and what happens if the disk dies is that you lose the data. That is a design choice that keeps the alerting path simple and independent — a Prometheus can keep alerting while the rest of your world is on fire — and pushes long-term storage to remote-write backends such as Thanos, Mimir or Cortex.\n\nThe subtle behaviour worth knowing: a query for an instant vector looks back up to five minutes by default (`--query.lookback-delta`) for the most recent sample. A series scraped every 15 s therefore keeps returning its last value for up to five minutes after the target disappears, unless a staleness marker was recorded — which is exactly why a naive `count(up)` graph can look fine for several minutes after a fleet dies.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Prometheus: Data model", url: "https://prometheus.io/docs/concepts/data_model/", kind: "docs" },
        { label: "Prometheus: Metric and label naming", url: "https://prometheus.io/docs/practices/naming/", kind: "docs" },
        { label: "Prometheus: Instrumentation practices", url: "https://prometheus.io/docs/practices/instrumentation/", kind: "docs" },
      ],
      video: {
        title: "How Prometheus Monitoring works | Prometheus Architecture explained",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=h4Sl21AKiDg",
        videoId: "h4Sl21AKiDg",
        durationLabel: "21:30",
      },
      alternateVideos: [
        {
          title: "Introduction to the Prometheus Monitoring System | Key Concepts and Features",
          channel: "Prometheus Monitoring with Julius | PromLabs",
          url: "https://www.youtube.com/watch?v=STVMGrYIlfg",
          videoId: "STVMGrYIlfg",
          durationLabel: "10:37",
        },
        {
          title: "Don't Make These 6 Prometheus Monitoring Mistakes | Prometheus Best Practices & Pitfalls",
          channel: "Prometheus Monitoring with Julius | PromLabs",
          url: "https://www.youtube.com/watch?v=NEMsO1qeI1s",
          videoId: "NEMsO1qeI1s",
          startSeconds: 22,
          chapterLabel: "Mistake 1: Cardinality Bombs",
          durationLabel: "10:42",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-prometheus-q1",
          prompt: "What does the pull model give you that a push model does not, by default?",
          options: [
            "The server knows the intended target list, so a target that disappears is detectable rather than simply silent",
            "Lower network bandwidth, because samples are compressed on the wire",
            "Guaranteed delivery of every individual sample",
            "The ability to monitor targets behind a NAT without extra components",
            "Higher scrape frequency than push systems can achieve",
          ],
          correctIndex: 0,
          explanation:
            "Service discovery gives the server an expectation to compare reality against, which is why `up == 0` is meaningful. Pull makes NAT *harder*, not easier, and guarantees nothing about individual samples.",
        },
        {
          id: "obs-prometheus-q2",
          prompt:
            "An application exposes `http_requests_total{method, path, status}`. `path` is the raw request path including ids, e.g. `/orders/91823`. What is the outcome?",
          options: [
            "Unbounded series growth, rising memory on the Prometheus server, and eventually an OOM or a refusal to scrape",
            "No problem, since the counter values are small",
            "Prometheus automatically groups similar paths into a template",
            "Only query performance suffers; ingestion is unaffected",
          ],
          correctIndex: 0,
          explanation:
            "The route *template* (`/orders/:id`) is the label you want. Raw paths make one series per id forever, and Prometheus keeps an index entry in memory for every active series.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-prometheus-q3",
          prompt: "What is the Pushgateway for, and what is it explicitly not for?",
          options: [
            "For short-lived batch jobs that end before a scrape can happen; not for turning Prometheus into a general push-based system",
            "For buffering samples when Prometheus is down; not for batch jobs",
            "For federating between Prometheus servers; not for single jobs",
            "For converting OTLP to the Prometheus exposition format; not for native clients",
          ],
          correctIndex: 0,
          explanation:
            "A cron job that runs for four seconds can never be scraped, so it pushes its final numbers to a gateway that Prometheus then scrapes. Using it for long-running services loses the `up` signal and makes the gateway a single point of staleness.",
        },
        {
          id: "obs-prometheus-q4",
          prompt: "Which of these are true about Prometheus's local storage? (Select all that apply.)",
          options: [
            "It is single-node with no built-in clustering or replication",
            "Losing the disk loses the data unless it was replicated elsewhere via remote write",
            "Running two identically configured servers is a common way to get redundancy",
            "It replicates to a quorum of peers before acknowledging a sample",
            "It supports cross-server transactions for consistent multi-target queries",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The design deliberately trades durability guarantees for operational simplicity and independence. Redundancy is achieved by running two scrapers, or by shipping to a remote-write backend such as Thanos or Mimir.",
        },
        {
          id: "obs-prometheus-q5",
          prompt:
            "All the pods behind a job are deleted at 10:00. At 10:03 you run `count(up)`. What is the most likely result and why?",
          options: [
            "It may still return the old count, because an instant query looks back up to five minutes for the last sample of each series",
            "It returns 0 immediately, because scraping stopped",
            "It returns an error, because the series no longer exist",
            "It returns NaN until the next scrape interval elapses",
          ],
          correctIndex: 0,
          explanation:
            "The default `--query.lookback-delta` is 5 m, so a series keeps resolving to its last sample for that long unless a staleness marker was written. It is a common source of \"the graph said everything was fine\" during a fast rollout failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-prometheus-q6",
          prompt: "Which metric name follows Prometheus naming conventions best for the total number of HTTP requests served?",
          options: [
            "`http_requests_total`",
            "`httpRequestCount`",
            "`http.requests.count`",
            "`HTTP_Requests`",
          ],
          correctIndex: 0,
          explanation:
            "Snake case, a unit or `_total` suffix for counters, and base units (seconds, bytes) are the conventions. They matter because every dashboard, rule and exporter assumes them.",
        },
        {
          id: "obs-prometheus-q7",
          prompt: "What is the `up` metric, and where does it come from?",
          options: [
            "A synthetic series Prometheus writes per target after each scrape: 1 if the scrape succeeded, 0 if it failed",
            "A gauge every exporter is required to expose",
            "A metric written by Alertmanager when a target recovers",
            "A counter of successful scrapes since server start",
          ],
          correctIndex: 0,
          explanation:
            "It is generated by the server, not by the target, which is why it can report 0 for a target that is not responding at all — a target could hardly report its own unreachability.",
        },
        {
          id: "obs-prometheus-q8",
          prompt:
            "A service exposes 40 metrics, each with labels `service` (1 value), `endpoint` (25 values), `method` (4 values) and `status` (8 values). Roughly how many time series is that, and does it matter?",
          options: [
            "About 32,000 series — large but entirely manageable for one Prometheus",
            "40 series, one per metric name",
            "About 800 series, because labels are stored once per metric",
            "Unbounded, because label counts multiply with traffic",
          ],
          correctIndex: 0,
          explanation:
            "40 × 25 × 4 × 8 = 32,000. The point of the arithmetic is that cardinality is a product: each new label multiplies. Bounded label sets stay bounded no matter how much traffic arrives.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-prometheus-q9",
          prompt: "Why does Prometheus store samples as `float64` and refuse to record strings as values?",
          options: [
            "The query language is arithmetic over numeric time series; dimensions belong in labels, detail belongs in logs and traces",
            "Strings would break the exposition format's parser",
            "It is a historical limitation that native histograms remove",
            "Strings cannot be compressed by the chunk encoder",
          ],
          correctIndex: 0,
          explanation:
            "It is a deliberate boundary. The moment you want to record an arbitrary string per event, you have left the metrics system and want a log or a span attribute.",
        },
        {
          id: "obs-prometheus-q10",
          prompt: "Which of these belong in service discovery rather than in a static scrape config? (Select all that apply.)",
          options: [
            "Pods in a Kubernetes cluster that are rescheduled on any node",
            "EC2 instances in an autoscaling group",
            "Containers registered in Consul",
            "A single fixed node exporter on a long-lived VPS",
            "The Prometheus server's own `/metrics` endpoint",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Service discovery exists for targets whose identity and count change without a config edit. One VPS and the server itself are stable enough that a static entry is clearer and less machinery.",
        },
      ],
    },
    {
      id: "obs-promql-rules",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "PromQL, Recording Rules and Alerting Rules",
      summary:
        "PromQL has two value types, and most confusion comes from mixing them up. An *instant vector* is one sample per series at one moment (`http_requests_total`). A *range vector* is a window of samples per series (`http_requests_total[5m]`) and cannot be graphed directly — it has to be reduced by a function. `rate()` is the reduction you use on counters almost every time: it computes per-second increase over the window, handles counter resets (a drop is treated as a restart, not a negative rate), and extrapolates to the window edges, which is why `increase()` over a slow counter can return a non-integer like `3.7`.\n\nTwo rules of thumb save a lot of debugging. Always `rate()` before you `sum()`, never after: summing raw counters across instances and then rating produces garbage the moment one instance restarts. And keep the rate window at least four times the scrape interval — `rate(x[15s])` on a 15 s scrape frequently sees fewer than two samples and returns nothing at all, which shows up as a mysteriously empty graph rather than an error.\n\nRecording rules pre-compute expensive expressions on the server's evaluation interval and store the result as a new series. They exist for two reasons: dashboards that would otherwise re-run a 30-series aggregation on every refresh, and alerting expressions that should be simple enough to read at 3am. The naming convention `level:metric:operations` (for example `job:http_requests:rate5m`) encodes what was aggregated away, which matters because you cannot recover it later.\n\nAlerting rules are the same expressions plus a `for` duration: when the expression returns results the alert goes *pending*, and only after it has been continuously true for `for` does it become *firing* and get sent to Alertmanager. Omitting `for` is the single most common cause of flapping pages. Prometheus evaluates and fires; Alertmanager does the grouping, inhibition, silencing and routing — separating \"is it true\" from \"who should hear about it\".",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Prometheus: Querying basics", url: "https://prometheus.io/docs/prometheus/latest/querying/basics/", kind: "docs" },
        { label: "Prometheus: Query functions", url: "https://prometheus.io/docs/prometheus/latest/querying/functions/", kind: "docs" },
        { label: "Prometheus: Recording rules and naming", url: "https://prometheus.io/docs/practices/rules/", kind: "docs" },
        { label: "Prometheus: Alerting rules", url: "https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/", kind: "docs" },
      ],
      video: {
        title: "Understanding Counter Rates and Increases in PromQL | Reset Handling, Extrapolation, Edge Cases",
        channel: "Prometheus Monitoring with Julius | PromLabs",
        url: "https://www.youtube.com/watch?v=7uy_yovtyqw",
        videoId: "7uy_yovtyqw",
        durationLabel: "10:53",
      },
      alternateVideos: [
        {
          title: "PromQL Data Selection Explained | Selectors, Lookback Delta, Offsets, and Absolute \"@\" Timestamps",
          channel: "Prometheus Monitoring with Julius | PromLabs",
          url: "https://www.youtube.com/watch?v=xIAEEQwUBXQ",
          videoId: "xIAEEQwUBXQ",
          durationLabel: "13:57",
        },
        {
          title: "Don't Make These 6 Prometheus Monitoring Mistakes | Prometheus Best Practices & Pitfalls",
          channel: "Prometheus Monitoring with Julius | PromLabs",
          url: "https://www.youtube.com/watch?v=NEMsO1qeI1s",
          videoId: "NEMsO1qeI1s",
          startSeconds: 289,
          chapterLabel: "Mistake 4: Missing \"for\" Durations in Alerting Rules",
          durationLabel: "10:42",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-promql-rules-q1",
          prompt:
            "Which of these two is correct for the total request rate across instances, and why?\n\n```promql\nA: sum(rate(http_requests_total[5m]))\nB: rate(sum(http_requests_total)[5m:])\n```",
          options: [
            "A — rate must be applied per series so counter resets are handled before aggregation",
            "B — summing first is cheaper and gives the same answer",
            "Both are equivalent; A is just conventional",
            "Neither; you must use `increase()` for totals",
          ],
          correctIndex: 0,
          explanation:
            "Reset handling happens per series. Summing first turns one instance restarting into a sudden drop in the summed counter, which the rate then misreads. `rate()` then `sum()` is the rule.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-promql-rules-q2",
          prompt: "`rate(http_requests_total[15s])` on a job scraped every 15 seconds often returns nothing. Why?",
          options: [
            "`rate()` needs at least two samples inside the window, and a 15 s window on a 15 s scrape frequently contains only one",
            "15 s is below the minimum window Prometheus accepts",
            "The counter has not incremented within the window",
            "The lookback delta prevents windows shorter than one minute",
          ],
          correctIndex: 0,
          explanation:
            "Jitter means a window exactly equal to the scrape interval sometimes catches one sample and sometimes two. The usual guidance is a window of at least four scrape intervals.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-promql-rules-q3",
          prompt: "Why does `increase(some_counter[1h])` sometimes return a value like `41.6` when a counter can only increase by whole numbers?",
          options: [
            "`increase()` extrapolates the observed slope to the exact window edges, since samples rarely land on them",
            "Floating-point error accumulates over long windows",
            "It averages across all matching series",
            "Counter resets are estimated with a fractional correction",
          ],
          correctIndex: 0,
          explanation:
            "It is extrapolation, not a bug. For slow-moving counters the effect is proportionally large, which is why alerting on `increase() > 0` for rare events can misbehave.",
        },
        {
          id: "obs-promql-rules-q4",
          prompt:
            "You want the p99 latency per job from a classic histogram. Which expression is right?",
          options: [
            "`histogram_quantile(0.99, sum by (job, le) (rate(http_request_duration_seconds_bucket[5m])))`",
            "`histogram_quantile(0.99, sum by (job) (rate(http_request_duration_seconds_bucket[5m])))`",
            "`avg by (job) (histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])))`",
            "`sum by (job) (rate(http_request_duration_seconds_sum[5m])) / sum by (job) (rate(http_request_duration_seconds_count[5m]))`",
          ],
          correctIndex: 0,
          explanation:
            "`le` must survive the aggregation or `histogram_quantile` has no buckets to work with. Averaging per-instance quantiles is the mistake this whole topic exists to prevent, and the last expression is the mean, not the p99.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-promql-rules-q5",
          prompt: "What does the `for` clause on an alerting rule do?",
          options: [
            "Holds the alert in `pending` until the expression has been continuously true for that duration, then moves it to `firing`",
            "Delays notification delivery by that duration after firing",
            "Re-evaluates the expression only once per that duration",
            "Keeps the alert firing for that long after the condition clears",
          ],
          correctIndex: 0,
          explanation:
            "It is a debounce on the *condition*, evaluated every evaluation interval. It is not a notification delay and not a minimum firing time — Alertmanager's `group_wait` and `repeat_interval` handle delivery timing.",
        },
        {
          id: "obs-promql-rules-q6",
          prompt: "Which responsibilities belong to Alertmanager rather than to the Prometheus server? (Select all that apply.)",
          options: [
            "Grouping many related alerts into one notification",
            "Silencing alerts during a planned maintenance window",
            "Inhibiting lower-severity alerts while a higher-severity one is firing",
            "Evaluating the alerting expression against the time series data",
            "Applying the `for` duration before an alert becomes firing",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Prometheus decides *whether* an alert is true, including `for`. Alertmanager decides *who hears about it, when and as how many messages*. Keeping those separate is why one Alertmanager can serve many Prometheus servers.",
        },
        {
          id: "obs-promql-rules-q7",
          prompt: "What is the `level:metric:operations` recording-rule naming convention for?",
          options: [
            "It records the aggregation level and the operations applied, since that information is otherwise unrecoverable from the resulting series",
            "It is required by Prometheus, which rejects rule names without colons",
            "It sorts the rules in evaluation order",
            "It marks which rules are safe to use in alerts",
          ],
          correctIndex: 0,
          explanation:
            "`job:http_requests:rate5m` tells you it is aggregated to `job` level and is a 5-minute rate. Without it, a bare `http_requests` series is ambiguous about what was summed away.",
        },
        {
          id: "obs-promql-rules-q8",
          prompt: "When is a recording rule genuinely worth adding?",
          options: [
            "When an expensive expression is used repeatedly by dashboards or alerts, or when an alert expression is too complex to read under pressure",
            "For every query anyone writes, as a matter of policy",
            "Only for expressions that use `histogram_quantile`",
            "Whenever a query takes more than one second, regardless of how often it runs",
          ],
          correctIndex: 0,
          explanation:
            "Recording rules cost storage and evaluation time on every interval forever. A slow query run twice a month is cheaper left alone; a slow query on a wall dashboard refreshing every 10 s is not.",
        },
        {
          id: "obs-promql-rules-q9",
          prompt:
            "An alerting rule is `up == 0` with no `for`. A target has a single failed scrape during a network blip. What happens?",
          options: [
            "The alert fires immediately and resolves at the next successful scrape, paging someone for a transient blip",
            "Nothing, because Prometheus requires two consecutive failures by default",
            "The alert enters `pending` for five minutes by default",
            "The alert fires but Alertmanager suppresses it automatically as flapping",
          ],
          correctIndex: 0,
          explanation:
            "Without `for`, the first true evaluation fires. There is no implicit default and Alertmanager does not detect flapping on its own; `for: 5m` is what turns this into a useful alert.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-promql-rules-q10",
          prompt: "Which of these expressions measures the *error ratio* of a service correctly?",
          options: [
            "`sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))`",
            "`sum(rate(http_requests_total{status=~\"5..\"}[5m]))`",
            "`sum(http_requests_total{status=~\"5..\"}) / sum(http_requests_total)`",
            "`rate(sum(http_requests_total{status=~\"5..\"})[5m:]) / rate(sum(http_requests_total)[5m:])`",
          ],
          correctIndex: 0,
          explanation:
            "A ratio needs both sides rated over the same window and then aggregated. Rating only the 5xx side gives an absolute rate rather than a ratio; dividing the raw counters compares lifetime totals since process start; and aggregating before rating breaks counter-reset handling.",
        },
      ],
    },
    {
      id: "obs-grafana-dashboards",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Grafana and Dashboards Worth Having",
      summary:
        "A dashboard is a saved question. That is its strength — the answer renders in a second and everyone sees the same thing — and its limit: it can only answer the question it was built for. Most dashboard problems come from forgetting that and building a wall of forty panels that answers nothing in particular, which nobody reads and which everybody scrolls past during an incident.\n\nThe shape that works is a small hierarchy. One overview dashboard per service showing the golden signals (latency, traffic, errors, saturation) or the RED trio, in that order, above the fold. Below or behind it, drill-down dashboards for the subsystems: database, queue, cache. Template variables (`$service`, `$env`, `$instance`) let one dashboard serve every instance instead of being copied twenty times and drifting. And the alert should link to the dashboard row that shows the thing it fired about, so the first click during a page is not a search.\n\nTwo judgement calls separate good dashboards from decoration. First, *show the SLO, not just the raw number* — a latency panel with a threshold line at the SLO boundary tells you whether to care; one without it tells you a number. Second, put units and sane axes on everything: a panel in \"short\" units that is actually bytes, or a y-axis auto-scaled to a 0.3% range, turns noise into an apparent crisis.\n\nThe operational gotcha is dashboards as code. A dashboard edited in the browser by whoever was on call is not reproducible, not reviewed, and quietly diverges between environments. Provisioning them from files (or from a library such as Grafonnet) costs a little friction per change and buys you the same dashboard in staging and production, plus a diff when someone changes the query behind the graph everyone trusts.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Grafana: Dashboard best practices", url: "https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/best-practices/", kind: "docs" },
        { label: "Grafana: Variables", url: "https://grafana.com/docs/grafana/latest/visualizations/dashboards/variables/", kind: "docs" },
        { label: "Grafana: The RED Method", url: "https://grafana.com/blog/the-red-method-how-to-instrument-your-services/", kind: "article" },
      ],
      video: {
        title: "Creating Grafana Dashboards for Prometheus | Grafana Setup & Simple Dashboard (Chart, Gauge, Table)",
        channel: "Prometheus Monitoring with Julius | PromLabs",
        url: "https://www.youtube.com/watch?v=EGgtJUjky8w",
        videoId: "EGgtJUjky8w",
        durationLabel: "13:51",
      },
      alternateVideos: [
        {
          title: "Understanding Dashboards in Grafana | Panels, Visualizations, Queries, and Transformations",
          channel: "Grafana",
          url: "https://www.youtube.com/watch?v=vTiIkdDwT-0",
          videoId: "vTiIkdDwT-0",
          durationLabel: "5:52",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-grafana-dashboards-q1",
          prompt: "What should be above the fold on a service's primary dashboard?",
          options: [
            "The golden signals for that service: latency, traffic, errors and saturation",
            "Every metric the service exports, so nothing is missed",
            "Host-level CPU and memory for each instance",
            "The last 50 log lines",
          ],
          correctIndex: 0,
          explanation:
            "The first screen should answer \"is this service healthy, and in which direction is it unhealthy\". Host resources and logs are drill-downs you reach after the signals point you somewhere.",
        },
        {
          id: "obs-grafana-dashboards-q2",
          prompt: "Which of these are real benefits of template variables on a dashboard? (Select all that apply.)",
          options: [
            "One dashboard serves every service or environment instead of twenty near-duplicates",
            "Changes to a panel apply everywhere at once, so copies cannot drift",
            "Panels can be repeated per variable value, so a new instance appears automatically",
            "They reduce the load on the data source, because fewer queries run per refresh",
            "They allow a dashboard to be used without a data source configured",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Variables are about avoiding duplication and drift. They do not reduce query load — a repeated panel runs one query per value — and a data source is still required.",
        },
        {
          id: "obs-grafana-dashboards-q3",
          prompt: "A latency panel shows a line hovering around 240 ms. What single addition makes it actionable?",
          options: [
            "A threshold line at the SLO boundary, so the panel shows whether the number is acceptable",
            "A larger font for the current value",
            "A second y-axis for request rate",
            "A colour gradient based on the value",
          ],
          correctIndex: 0,
          explanation:
            "Without a reference, 240 ms is trivia. With a 300 ms SLO line drawn on it, the same panel answers \"are we fine\" at a glance — which is what someone on a page needs in the first two seconds.",
        },
        {
          id: "obs-grafana-dashboards-q4",
          prompt:
            "During an incident the on-call opens the service dashboard and every panel shows \"No data\". The service is definitely serving traffic. What is the most likely cause?",
          options: [
            "A template variable is set to a value that matches nothing, such as a pod name from a previous deploy",
            "Grafana has lost its connection to the browser",
            "Prometheus deleted the series when the pods were replaced",
            "The panels need to be refreshed manually after a deploy",
          ],
          correctIndex: 0,
          explanation:
            "Stale variable selections persisting in the URL or in the saved dashboard state is the classic version of this. Old series still exist in Prometheus; the query is simply selecting a label value that no longer has data.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-grafana-dashboards-q5",
          prompt: "Why is a dashboard a poor substitute for an alert?",
          options: [
            "Nobody is looking at it at 3am, so a dashboard only detects problems someone happens to notice",
            "Dashboards cannot display error rates accurately",
            "Dashboards are slower to load than alert evaluation",
            "Dashboards cannot query the same data sources as alerts",
          ],
          correctIndex: 0,
          explanation:
            "Dashboards are for diagnosis and for questions you are actively asking. Detection has to be automatic, or your detection time is \"whenever someone next looks\".",
        },
        {
          id: "obs-grafana-dashboards-q6",
          prompt: "What problem does provisioning dashboards from files rather than editing them in the UI solve? (Select all that apply.)",
          options: [
            "Changes go through review, so the query behind a trusted graph cannot change silently",
            "Staging and production get the same dashboard instead of drifting apart",
            "A broken dashboard can be rolled back like any other change",
            "It makes dashboards render faster",
            "It removes the need for template variables",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "It is a configuration-management argument: review, reproducibility and rollback. It has no effect on rendering speed, and variables are just as useful in a provisioned dashboard.",
        },
        {
          id: "obs-grafana-dashboards-q7",
          prompt: "A panel's y-axis auto-scales to the data range. When is that actively misleading?",
          options: [
            "When the values vary within a tiny band — a 99.95%-to-99.97% success rate rendered full-height looks like a collapse",
            "When the values are counters rather than gauges",
            "When more than one series is plotted",
            "When the time range exceeds 24 hours",
          ],
          correctIndex: 0,
          explanation:
            "Auto-scaling maximises visual variance regardless of significance. For ratios and percentages, pinning the axis (or plotting the error budget instead) is what makes the picture honest.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-grafana-dashboards-q8",
          prompt: "What is the healthiest relationship between an alert and a dashboard?",
          options: [
            "The alert links directly to the dashboard (and time range) that shows what it fired about",
            "The alert embeds a rendered image of the dashboard in the notification",
            "The dashboard is the alert — a panel with a red threshold is sufficient",
            "They should be kept separate so the alert does not depend on Grafana",
          ],
          correctIndex: 0,
          explanation:
            "A runbook URL and a dashboard URL in the alert annotations remove the first minute of every page. A static image cannot be explored, and a red panel nobody is watching is not an alert.",
        },
      ],
    },
    {
      id: "obs-opentelemetry",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "OpenTelemetry: SDK, Collector and Semantic Conventions",
      summary:
        "OpenTelemetry exists because instrumentation used to be a vendor lock-in decision. Every agent had its own API, so changing backend meant re-instrumenting every service. OTel splits that into an **API** your code calls, an **SDK** that implements it (sampling, batching, resource detection), and **exporters** that speak OTLP to whatever backend you chose — so swapping vendors becomes a configuration change rather than a migration. Libraries instrument against the API only and add no dependency on any SDK, which is why framework maintainers were willing to adopt it.\n\nThe **Collector** is a separate process: receivers take data in (OTLP, Prometheus scrape, Jaeger, filelog), processors transform it (batch, redact attributes, tail-sample, add resource attributes), exporters send it on. It earns its place when you want to change telemetry routing without redeploying applications, when you need to strip PII centrally, or when tail-based sampling requires seeing a whole trace in one place. It is *not* mandatory — an SDK can export straight to a backend, and for a single service that is usually the simpler answer.\n\n**Semantic conventions** are the part people skip and then regret. They are the agreed attribute names — `http.request.method`, `server.address`, `db.system.name` — that make a dashboard or a query work across services written in different languages. Roll your own attribute names and you get telemetry that no off-the-shelf dashboard understands and that cannot be correlated between teams.\n\nMaturity is genuinely uneven and matters when you adopt. Checked against the project's own status page: tracing is Stable in most languages (C++, .NET, Go, Java, JavaScript, PHP, Python, Ruby, Swift, Erlang), metrics is Stable in a smaller set (C++, .NET, Go, Java, JavaScript, PHP, Python) and still in development for Erlang, Ruby and Swift, and **logs lag furthest** — Stable for C++, .NET, Java and PHP, Release Candidate for Go, and still in development for JavaScript, Python, Ruby and Swift. Rust is Beta across all three. Profiles is the newest signal and is in development. The Collector's own status is \"mixed\", because its components each carry their own stability level. Read the component README, not the marketing page.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "OpenTelemetry: What is OpenTelemetry?", url: "https://opentelemetry.io/docs/what-is-opentelemetry/", kind: "docs" },
        { label: "OpenTelemetry: Collector", url: "https://opentelemetry.io/docs/collector/", kind: "docs" },
        { label: "OpenTelemetry: Semantic conventions", url: "https://opentelemetry.io/docs/concepts/semantic-conventions/", kind: "docs" },
        { label: "OpenTelemetry: Status (component maturity)", url: "https://opentelemetry.io/status/", kind: "docs" },
      ],
      video: {
        title: "What is OpenTelemetry? - Explanation and Demo",
        channel: "Better Stack",
        url: "https://www.youtube.com/watch?v=LzLULxhyIpU",
        videoId: "LzLULxhyIpU",
        durationLabel: "24:54",
      },
      alternateVideos: [
        {
          title: "OpenTelemetry Collector: EVERYTHING you need to know [to get started]",
          channel: "Adam Gardner",
          url: "https://www.youtube.com/watch?v=_CJrFW_yjRo",
          videoId: "_CJrFW_yjRo",
          durationLabel: "10:06",
        },
        {
          title: "What is OTel? | OTel for Beginners - The JavaScript Journey",
          channel: "OpenTelemetry",
          url: "https://www.youtube.com/watch?v=iEEIabOha8U",
          videoId: "iEEIabOha8U",
          durationLabel: "9:11",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-opentelemetry-q1",
          prompt: "Why does OpenTelemetry separate the API from the SDK?",
          options: [
            "So libraries can instrument against the API with no SDK dependency, and become no-ops in applications that have not configured one",
            "So the API can be written in a different language from the SDK",
            "So the API can be versioned independently of the OTLP wire format",
            "So the SDK can be loaded lazily at first span creation",
          ],
          correctIndex: 0,
          explanation:
            "A library that pulled in a full SDK would force a telemetry pipeline on every consumer. Instrumenting against the API means the cost is zero unless the application opts in.",
        },
        {
          id: "obs-opentelemetry-q2",
          prompt: "Which of these are genuine reasons to run a Collector rather than exporting straight from the SDK? (Select all that apply.)",
          options: [
            "You want to change backends or routing without redeploying every application",
            "You need to strip or hash sensitive attributes in one place",
            "You want tail-based sampling, which needs to see all spans of a trace together",
            "The SDK cannot export without a Collector",
            "The Collector is required for semantic conventions to apply",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "All three are about centralising policy. Direct export is fully supported, and semantic conventions are an attribute-naming agreement enforced by instrumentation, not by the Collector.",
        },
        {
          id: "obs-opentelemetry-q3",
          prompt: "In a Collector pipeline, what are receivers, processors and exporters responsible for?",
          options: [
            "Receivers ingest telemetry, processors transform or filter it, exporters send it to a destination",
            "Receivers poll backends, processors render dashboards, exporters write files",
            "Receivers validate schemas, processors sample, exporters compress",
            "Receivers handle traces, processors handle metrics, exporters handle logs",
          ],
          correctIndex: 0,
          explanation:
            "They are pipeline stages, not signal-specific roles. A pipeline is declared per signal type, wiring a set of receivers through processors to exporters.",
        },
        {
          id: "obs-opentelemetry-q4",
          prompt:
            "A team is adopting OpenTelemetry in a Node.js service and wants traces, metrics and logs all through the OTel SDK. Based on the project's own status page, which signal is most likely to need a fallback?",
          options: [
            "Logs — the JavaScript logs SDK is still in development, while traces and metrics are stable",
            "Traces — tracing is the least mature signal in JavaScript",
            "Metrics — the JavaScript metrics SDK is still experimental",
            "None — all three are stable in every language",
          ],
          correctIndex: 0,
          explanation:
            "Maturity is per language *and* per signal. In JavaScript, traces and metrics are stable while logs are still in development, so most Node.js teams keep their existing logger and add trace context to it instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-opentelemetry-q5",
          prompt: "What is a resource, in OpenTelemetry terms?",
          options: [
            "The set of attributes describing the entity producing telemetry — service name, version, instance, host, deployment environment",
            "A limit on how much telemetry a process may emit",
            "A file that maps metric names between vendors",
            "The Collector's memory and CPU allocation",
          ],
          correctIndex: 0,
          explanation:
            "`service.name` in particular is the attribute almost every backend keys on. Forgetting to set it is why telemetry shows up attributed to `unknown_service`.",
        },
        {
          id: "obs-opentelemetry-q6",
          prompt: "Why do semantic conventions matter more than they sound like they should?",
          options: [
            "Cross-service dashboards, alerts and queries only work if the same concept carries the same attribute name everywhere",
            "The OTLP protocol rejects attributes not listed in the conventions",
            "They determine the sampling rate for each span kind",
            "Backends charge less for conventional attribute names",
          ],
          correctIndex: 0,
          explanation:
            "Conventions are the interoperability contract. Custom names are allowed — they just mean every consumer of your telemetry has to be taught your vocabulary, forever.",
        },
        {
          id: "obs-opentelemetry-q7",
          prompt: "What does zero-code (auto-)instrumentation actually do, and what is its limitation?",
          options: [
            "It hooks known libraries at startup to emit spans and metrics without code changes, but it knows nothing about your business logic",
            "It rewrites your source files to add span creation calls",
            "It infers spans from log output, so no libraries need support",
            "It only works for HTTP servers, not clients or databases",
          ],
          correctIndex: 0,
          explanation:
            "It gets you HTTP, database and messaging spans for free, which is most of the plumbing. The span that says \"this is the checkout step and it belongs to tenant X\" still has to be written by hand.",
        },
        {
          id: "obs-opentelemetry-q8",
          prompt: "Which statements about OTLP are correct? (Select all that apply.)",
          options: [
            "It is the vendor-neutral wire protocol OpenTelemetry defines for traces, metrics and logs",
            "It is supported over both gRPC and HTTP",
            "Backends that accept OTLP can receive data from any conforming SDK or Collector",
            "It is a storage format, and backends must store data exactly as it arrives",
            "It requires a Collector as an intermediary",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "OTLP is transport, not storage, and SDKs can speak it directly to a backend. Its existence is precisely what makes swapping vendors a config change.",
        },
        {
          id: "obs-opentelemetry-q9",
          prompt:
            "A single Fastify service on one VPS wants tracing. Which adoption path is proportionate?",
          options: [
            "Enable Node auto-instrumentation, export directly to a backend, and add a Collector only when a second service or a central redaction requirement appears",
            "Deploy a Collector as a DaemonSet and a gateway Collector before instrumenting anything",
            "Skip OpenTelemetry — tracing is meaningless for a single service",
            "Write manual spans for every function before enabling any auto-instrumentation",
          ],
          correctIndex: 0,
          explanation:
            "Even one service benefits from spans across its HTTP handler, its database calls and any outbound requests. The Collector is infrastructure you add when you have a reason, and a DaemonSet needs a cluster to be a daemon on.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-opentelemetry-q10",
          prompt: "What does it mean that the Collector's overall status is \"mixed\"?",
          options: [
            "Each Collector component has its own stability level documented in its README; the distribution as a whole cannot claim one",
            "The Collector is stable for traces but not for metrics or logs",
            "Only the contrib distribution is unstable; the core is stable",
            "It is a deprecation warning ahead of the Collector being replaced",
          ],
          correctIndex: 0,
          explanation:
            "Stability is declared per receiver, processor and exporter. \"Is the Collector stable\" is the wrong question; \"is the `tailsamplingprocessor` stable\" is the right one.",
        },
      ],
    },
    {
      id: "obs-distributed-tracing",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Distributed Tracing: Spans, Context Propagation and Sampling",
      summary:
        "A trace is a tree of spans. Each span has a name, a start and end time, attributes, a status, a 16-byte trace id shared by the whole tree, an 8-byte span id of its own, and the span id of its parent. That parent link is the entire trick: it is what lets a backend reconstruct \"the API called auth, which called the user service, which waited 3.4 s on Postgres\" from records emitted independently by four processes that never spoke to each other about it.\n\nContext propagation is how the link survives a process boundary. On HTTP, the W3C Trace Context standard defines the `traceparent` header — `version-traceid-parentid-flags`, for example `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`. A service reads it, starts a child span whose parent is the incoming `parent-id`, and sends the *new* span's id as `parent-id` on its outbound calls. Get this wrong in one place — a background job, a queue consumer, a `fetch` outside the instrumented client — and the trace silently splits into two unconnected trees, which is far harder to notice than a crash.\n\nSampling is what makes it affordable, and the choice of *where* to decide matters. Head-based sampling decides at the root and propagates the decision through the flags, so every service agrees and traces are complete — but the decision is made before anyone knows whether the request failed, so rare errors are usually discarded. Tail-based sampling buffers all spans of a trace and decides after it completes, so you can keep 100% of errors and slow requests and 1% of the boring ones — at the cost of a component that must see every span of a trace, which constrains your Collector topology.\n\nWhat a trace shows that logs cannot is *where the time went and what caused what*. Logs from five services with synchronised clocks still leave you correlating timestamps by hand, and clock skew between hosts means span timings from different machines can appear to overlap impossibly — which is why you read durations within a service as reliable and cross-host orderings with a pinch of salt.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "W3C: Trace Context", url: "https://w3c.github.io/trace-context/", kind: "spec" },
        { label: "OpenTelemetry: Traces", url: "https://opentelemetry.io/docs/concepts/signals/traces/", kind: "docs" },
        { label: "OpenTelemetry: Context propagation", url: "https://opentelemetry.io/docs/concepts/context-propagation/", kind: "docs" },
        { label: "OpenTelemetry: Sampling", url: "https://opentelemetry.io/docs/concepts/sampling/", kind: "docs" },
      ],
      video: {
        title: "Context Propagation makes OpenTelemetry awesome",
        channel: "Lightstep is now ServiceNow Cloud Observability",
        url: "https://www.youtube.com/watch?v=gviWKCXwyvY",
        videoId: "gviWKCXwyvY",
        durationLabel: "9:40",
      },
      alternateVideos: [
        {
          title: "Distributed Tracing in Microservices | System Design",
          channel: "ByteMonk",
          url: "https://www.youtube.com/watch?v=XYvQHjWJJTE",
          videoId: "XYvQHjWJJTE",
          durationLabel: "7:01",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `propagateTraceparent(header, spanId)`: validate an incoming W3C `traceparent` header and build the one to send downstream.\n\nA version `00` header is exactly 55 characters: `vv-tttttttttttttttttttttttttttttttt-pppppppppppppppp-ff`, i.e. a 2-hex version, a 32-hex trace id, a 16-hex parent (span) id and a 2-hex flags byte, separated by `-`. **All hex must be lowercase.**\n\nReturn `{ valid: false }` — and nothing else — when the header is not usable. Treat it as unusable if any of these hold:\n\n- it is not a string, or is shorter than 55 characters,\n- the characters at index 2, 35 and 52 are not `-`,\n- the version is not two lowercase hex digits, or is `\"ff\"` (forbidden),\n- the version is `\"00\"` and the header is not exactly 55 characters (version 00 permits no extra fields),\n- the version is higher than `\"00\"` and the character at index 55 is not `-` (later versions may append fields, but only after a delimiter),\n- the trace id is not 32 lowercase hex digits, or is all zeroes,\n- the parent id is not 16 lowercase hex digits, or is all zeroes,\n- the flags are not two lowercase hex digits.\n\nOtherwise return:\n\n- `valid: true`\n- `traceId` and `parentId` as parsed\n- `sampled`: `true` when **bit 0** (`0x01`) of the flags byte is set. Compare the bit, not the whole byte — `03` and `ff` are both sampled.\n- `outgoing`: the header for the next hop. Always version `00`, the same trace id, `spanId` as the new parent id, and a flags byte keeping only the two bits this version defines — sampled (`0x01`) and random (`0x02`) — with all other bits zeroed, formatted as two lowercase hex digits.\n\nYou may assume `spanId` is already a valid 16-hex span id.",
        starterCode:
          "/**\n * @param {unknown} header  the incoming traceparent header value\n * @param {string} spanId   the 16-hex id of the span this service just started\n * @returns {{ valid: boolean, traceId?: string, parentId?: string, sampled?: boolean, outgoing?: string }}\n */\nfunction propagateTraceparent(header, spanId) {\n  // Your code here\n}\n",
        functionName: "propagateTraceparent",
        testCases: [
          {
            description: "a sampled version 00 header is parsed and re-parented",
            args: ["00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01", "00f067aa0ba902b7"],
            expected: {
              valid: true,
              traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
              parentId: "b7ad6b7169203331",
              sampled: true,
              outgoing: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
            },
          },
          {
            description: "flags 00 means not sampled, and the flags are propagated unchanged",
            args: ["00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-00", "00f067aa0ba902b7"],
            expected: {
              valid: true,
              traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
              parentId: "b7ad6b7169203331",
              sampled: false,
              outgoing: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00",
            },
          },
          {
            description: "flags 02 sets the random bit but not sampled",
            args: ["00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-02", "00f067aa0ba902b7"],
            expected: {
              valid: true,
              traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
              parentId: "b7ad6b7169203331",
              sampled: false,
              outgoing: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-02",
            },
          },
          {
            description: "flags ff is sampled, and unknown bits are zeroed on the way out",
            args: ["00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-ff", "00f067aa0ba902b7"],
            expected: {
              valid: true,
              traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
              parentId: "b7ad6b7169203331",
              sampled: true,
              outgoing: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-03",
            },
            isEdgeCase: true,
          },
          {
            description: "a future version with an extra field is parsed with the 00 layout",
            args: ["01-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01-af5ee3", "00f067aa0ba902b7"],
            expected: {
              valid: true,
              traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
              parentId: "b7ad6b7169203331",
              sampled: true,
              outgoing: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
            },
            isEdgeCase: true,
          },
          {
            description: "uppercase hex is invalid",
            args: ["00-4BF92F3577B34DA6A3CE929D0E0E4736-b7ad6b7169203331-01", "00f067aa0ba902b7"],
            expected: { valid: false },
            isEdgeCase: true,
          },
          {
            description: "an all-zero trace id is invalid",
            args: ["00-00000000000000000000000000000000-b7ad6b7169203331-01", "00f067aa0ba902b7"],
            expected: { valid: false },
            isEdgeCase: true,
          },
          {
            description: "an all-zero parent id is invalid",
            args: ["00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01", "00f067aa0ba902b7"],
            expected: { valid: false },
          },
          {
            description: "version ff is forbidden",
            args: ["ff-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01", "00f067aa0ba902b7"],
            expected: { valid: false },
          },
          {
            description: "version 00 with a trailing extra field is invalid",
            args: ["00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01-af5ee3", "00f067aa0ba902b7"],
            expected: { valid: false },
            isEdgeCase: true,
          },
          {
            description: "a truncated header is invalid",
            args: ["00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b716920333-01", "00f067aa0ba902b7"],
            expected: { valid: false },
          },
          {
            description: "an empty header is invalid",
            args: ["", "00f067aa0ba902b7"],
            expected: { valid: false },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "obs-slo-error-budgets",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "SLIs, SLOs and Error Budgets",
      summary:
        "An SLI is a ratio: good events over valid events. An SLO is a target for that ratio over a window — 99.9% of HTTP requests return a non-5xx status within 300 ms, measured over 30 rolling days. The error budget is what is left over: 0.1% of 30 days is about 43 minutes of complete unavailability, or a much longer period of partial degradation. This is the idea that turns monitoring from a wall of graphs into a decision-making tool, because an error budget is a *quantity that gets spent*, and spending it has agreed consequences.\n\nThat consequence is the error budget policy, and without one the SLO is decoration. A typical policy: while budget remains, ship freely; when it is exhausted, feature work stops until reliability work restores it. The point is not punishment — it is that \"how reliable should this be\" stops being an argument between product and operations and becomes a number both sides agreed to in advance. It also makes the opposite case: if you never spend the budget, you are over-invested in reliability and could be shipping faster.\n\nThe details that separate a real SLO from a ceremonial one are all in the definition. *Good events over valid events* — health checks and bot traffic are usually not valid events, and a 400 is usually not your fault, so counting them distorts the ratio in both directions. Request-based SLIs (\"99.9% of requests succeeded\") and windowed SLIs (\"99.9% of one-minute windows were good\") give genuinely different numbers for the same outage, because a windowed SLI weights a quiet minute the same as a peak one. And 100% is always the wrong target: it forbids deploys, forbids maintenance, and ignores that your users' ISPs are not 100% either.\n\nThe gotcha that survives all of this is aggregation, again. A global 99.95% can hide one tenant at 92%, and an SLO measured at the load balancer misses everything that fails in the browser. Measure as close to the user as you can bear, and break the SLI down by the dimension your customers experience it in.",
      level: "expert",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "Google SRE Book: Service Level Objectives", url: "https://sre.google/sre-book/service-level-objectives/", kind: "docs" },
        { label: "Google SRE Workbook: Implementing SLOs", url: "https://sre.google/workbook/implementing-slos/", kind: "docs" },
        { label: "Google SRE Book: Embracing Risk", url: "https://sre.google/sre-book/embracing-risk/", kind: "article" },
      ],
      video: {
        title: "DevOpsDays Chicago 2019 - Jennifer Petoff & Nathen Harvey - The Art of SLOs",
        channel: "DevOpsDays Chicago",
        url: "https://www.youtube.com/watch?v=Dfnbw5dJQ5I",
        videoId: "Dfnbw5dJQ5I",
        durationLabel: "30:59",
      },
      alternateVideos: [
        {
          title: "SREcon18 Europe - Real World SLOs and SLIs: A Deep Dive",
          channel: "USENIX",
          url: "https://www.youtube.com/watch?v=ZbWqzDfccuI",
          videoId: "ZbWqzDfccuI",
          durationLabel: "37:12",
        },
        {
          title: "SLOconf 2021: Introduction to SLO alerting and monitoring - Niall Murphy",
          channel: "Nobl9",
          url: "https://www.youtube.com/watch?v=l3FsR4jzXxw",
          videoId: "l3FsR4jzXxw",
          durationLabel: "9:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-slo-error-budgets-q1",
          prompt: "A service has a 99.9% availability SLO over a rolling 30-day window. Roughly how much total downtime does the error budget allow?",
          options: [
            "About 43 minutes",
            "About 7 hours",
            "About 4 hours",
            "About 5 minutes",
          ],
          correctIndex: 0,
          explanation:
            "0.1% of 30 days ≈ 43.2 minutes. The same budget can also be spent as a long period of partial failure — 1% errors for about three days spends it just as completely.",
        },
        {
          id: "obs-slo-error-budgets-q2",
          prompt: "What distinguishes an SLA from an SLO?",
          options: [
            "An SLA is a contractual promise to a customer with consequences; an SLO is an internal target, normally set stricter than the SLA",
            "An SLA is measured monthly and an SLO is measured weekly",
            "An SLA covers latency and an SLO covers availability",
            "They are the same thing; SLA is the older term",
          ],
          correctIndex: 0,
          explanation:
            "The internal target should be tighter, so you notice and react before you owe anyone a refund. An SLI is the measurement that both are expressed in terms of.",
        },
        {
          id: "obs-slo-error-budgets-q3",
          prompt: "Which of these are reasonable things to exclude from the denominator of an availability SLI? (Select all that apply.)",
          options: [
            "Internal health-check requests from the load balancer",
            "Requests rejected with 400 because the client sent malformed input",
            "Requests from a known scraper or synthetic load generator",
            "Requests that returned 503 during a deploy",
            "Requests from your largest customer, because they retry aggressively",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "\"Valid events\" should mean real user requests you are responsible for. A 503 during your own deploy is squarely your fault and must count, and excluding a customer because they are inconvenient is how an SLO becomes fiction.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-slo-error-budgets-q4",
          prompt: "A team has not spent any of its error budget in six months. What does that suggest?",
          options: [
            "The SLO may be too loose, or the team is over-investing in reliability and could ship faster or take more risk",
            "The team is performing exactly as intended and nothing should change",
            "The SLI is certainly measuring the wrong thing",
            "The error budget should be reduced to zero",
          ],
          correctIndex: 0,
          explanation:
            "A budget that is never spent is not a budget. Either the target is below what the system naturally delivers, or the team is paying for reliability nobody asked for — both worth a conversation.",
        },
        {
          id: "obs-slo-error-budgets-q5",
          prompt:
            "The same 20-minute total outage is measured two ways: as a request-based SLI, and as a windowed SLI over one-minute buckets. Why can the two produce very different numbers?",
          options: [
            "A request-based SLI weights each minute by its traffic; a windowed SLI weights every minute equally, so an outage at 3am costs the same as one at peak",
            "Windowed SLIs always report a worse number than request-based ones",
            "Request-based SLIs cannot represent partial failures",
            "Windowed SLIs are computed from logs and request-based ones from metrics",
          ],
          correctIndex: 0,
          explanation:
            "Neither is wrong, but they answer different questions. Pick the one that matches how your users experience harm, and state which you are using — otherwise two teams will quote two numbers for the same incident.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-slo-error-budgets-q6",
          prompt: "Why is 100% the wrong availability target for essentially every service?",
          options: [
            "It leaves no budget for deploys, maintenance or dependency failures, and the marginal user benefit is near zero once you exceed the reliability of the path to the user",
            "Monitoring systems cannot measure 100% accurately",
            "It is forbidden by most cloud providers' terms of service",
            "It would require synchronous replication, which is technically impossible",
          ],
          correctIndex: 0,
          explanation:
            "Beyond a point, the user's own network, device and ISP dominate what they experience. Each extra nine costs roughly an order of magnitude more and buys something nobody can perceive.",
        },
        {
          id: "obs-slo-error-budgets-q7",
          prompt: "What makes an error budget policy different from just having an SLO?",
          options: [
            "It states in advance what changes when the budget is exhausted — for example, feature work pauses until reliability is restored",
            "It requires the SLO to be reviewed quarterly",
            "It sets a separate, stricter SLO for the on-call team",
            "It defines which alerts page and which file tickets",
          ],
          correctIndex: 0,
          explanation:
            "Without agreed consequences, exhausting the budget is just a red number on a dashboard. The policy is what converts the measurement into a decision nobody has to argue about mid-incident.",
        },
        {
          id: "obs-slo-error-budgets-q8",
          prompt:
            "An API's SLO is measured at the load balancer: 99.97% of requests return 2xx. Customers report the product is frequently broken. What is the likely gap?",
          options: [
            "The SLI does not capture what users experience — client-side failures, slow responses that technically succeed, or a 200 with wrong content",
            "The load balancer is miscounting requests",
            "99.97% is too strict a target to be meaningful",
            "The window is too long, so recent failures are diluted",
          ],
          correctIndex: 0,
          explanation:
            "A 200 that takes 12 seconds, or returns an empty list because a backend silently failed, is a success by that SLI and a failure to the user. Measuring closer to the user — including a latency threshold in the definition of \"good\" — is the fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-slo-error-budgets-q9",
          prompt: "A service depends on three internal services, each with a 99.9% SLO. What availability can the dependent service promise, assuming it needs all three per request and failures are independent?",
          options: [
            "At most about 99.7%, because the failure probabilities compound",
            "99.9%, because the dependencies are in the same data centre",
            "99.99%, because having three independent services adds redundancy",
            "It cannot be estimated without measuring",
          ],
          correctIndex: 0,
          explanation:
            "0.999³ ≈ 0.997. Serial dependencies multiply, which is why a service can never be more reliable than the product of everything it needs — unless it degrades gracefully when one of them is down.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-slo-error-budgets-q10",
          prompt: "Which of these are good properties of an SLI definition? (Select all that apply.)",
          options: [
            "It is expressed as good events divided by valid events",
            "It can be computed from data you already collect, cheaply and continuously",
            "It moves when users are unhappy and stays flat when they are not",
            "It is derived from CPU utilisation, so it covers every failure mode",
            "It is defined per team so each team can pick its own definition of good",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The third property is the one people forget: an indicator that moves for reasons users do not notice will train everyone to ignore it. CPU is a cause, not a symptom, and inconsistent definitions make the numbers incomparable.",
        },
        {
          id: "obs-slo-error-budgets-q11",
          prompt: "A global SLO reports 99.95% while one tenant is experiencing 92% success. Why is the global number still \"correct\" and still useless?",
          options: [
            "It correctly reports the aggregate, but a small tenant's traffic is too small a share to move it — the SLI needs to be evaluated per tenant as well",
            "It is not correct; aggregate SLIs always understate failure",
            "It is correct and sufficient; per-tenant reliability is not an SRE concern",
            "The global number would move if the SLO window were shorter",
          ],
          correctIndex: 0,
          explanation:
            "Aggregates are weighted by volume, so the smaller the affected tenant the less it shows. Either compute the SLI per tenant and alert on the worst, or accept that you will hear about it from the customer first.",
        },
      ],
    },
    {
      id: "obs-alerting",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Alerting That Doesn't Burn People Out",
      summary:
        "Every page spends something real: attention during the day, sleep at night, and credibility every time it turns out not to matter. The single most useful filter is symptom versus cause. Alert on what the user experiences — error ratio above the SLO, latency past the threshold, the queue not draining — and leave causes (CPU at 95%, a replica restarting, disk at 80%) to dashboards and tickets. A cause-based alert fires when something *might* be bad; a symptom alert fires when something *is* bad, and it keeps working when the cause is one nobody predicted.\n\nStatic thresholds are where alert fatigue is manufactured. \"Error rate above 1% for 5 minutes\" is either too sensitive at 3am on low traffic or too slow during a real outage, and it has no relationship to whether you can afford the errors. Burn-rate alerting fixes that by expressing the threshold in units of your error budget: a burn rate of 1 consumes the whole budget exactly at the end of the window, so a burn rate of 14.4 over one hour means you have spent 2% of a 30-day budget in an hour — worth waking someone for. Google's recommended starting configuration for a 99.9% SLO is 14.4× over 1 hour (page), 6× over 6 hours (page), and 1× over 3 days (ticket, not a page).\n\nThe multiwindow refinement is what stops the alert hanging around after the incident ends. Pair each long window with a short one of about one twelfth its length and require *both* to exceed the threshold. The long window gives precision — a two-minute blip does not move a one-hour average enough to fire — and the short window gives a fast reset: once the errors stop, the 5-minute window drops below the threshold in five minutes instead of sixty.\n\nThe rest is hygiene, and it matters as much as the maths. Every page must be actionable and must have a runbook link. Related alerts should be grouped into one notification rather than fanning out to twelve. Anything that does not need a human within the hour is a ticket. Google's own rule of thumb for a healthy rotation is fewer than two paging events per shift — measure it, and treat exceeding it as a bug in the alerting, not as a fact of life.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Google SRE Workbook: Alerting on SLOs", url: "https://sre.google/workbook/alerting-on-slos/", kind: "docs" },
        { label: "Prometheus: Alerting best practices", url: "https://prometheus.io/docs/practices/alerting/", kind: "docs" },
        { label: "Rob Ewaschuk: My Philosophy on Alerting", url: "https://docs.google.com/document/d/199PqyG3UsyXlwieHaqbGiWVa8eMWi8zzAn0YfcApr8Q/edit", kind: "article" },
      ],
      video: {
        title: "SREcon18 Asia/Australia - A Theory and Practice of Alerting with Service Level Objectives",
        channel: "USENIX",
        url: "https://www.youtube.com/watch?v=_2th8LDnvQk",
        videoId: "_2th8LDnvQk",
        durationLabel: "40:45",
      },
      alternateVideos: [
        {
          title: "SLOconf 2023 - How I learned to stop worrying and love burn rates - Ashley Chen",
          channel: "Nobl9",
          url: "https://www.youtube.com/watch?v=ra0cCmEVKS8",
          videoId: "ra0cCmEVKS8",
          durationLabel: "9:14",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `evaluateBurnRate(samples, slo, rules)` — a multiwindow, multi-burn-rate SLO alert evaluator.\n\n- `samples` is one entry per minute, oldest first: `{ good, bad }` request counts.\n- `slo` is the objective as a fraction, e.g. `0.999`. The error budget is `1 - slo`.\n- `rules` is an array of `{ severity, longWindowMinutes, shortWindowMinutes, burnRate }` in **priority order**, most severe first.\n\nFor each minute `t` (0-based), evaluate the rules in order:\n\n- A window of `n` minutes ending at `t` covers samples `max(0, t - n + 1)` through `t` inclusive. Windows are **clipped** to the data available, so early minutes use a shorter window rather than being skipped.\n- The window's error ratio is `sum(bad) / sum(good + bad)` over that window. Sum first, then divide — averaging the per-minute ratios is a different (and wrong) number. If the window has no requests at all, the ratio is `0`.\n- A rule fires at `t` when **both** its long-window ratio and its short-window ratio are **strictly greater than** `burnRate * (1 - slo)`.\n- The minute's firing severity is the severity of the first rule that fires, or `null` if none does.\n\nReturn the **transitions**: an array of `{ at, severity }`, one entry for each minute whose firing severity differs from the previous minute's. The state before minute 0 is `null`, so a resolution is reported as `{ at, severity: null }`.\n\nThe tests call `runBurnRateScenario`, which expands a compact list of traffic segments into per-minute samples and calls your function. Leave the driver as it is.",
        starterCode:
          "/**\n * @param {{ good: number, bad: number }[]} samples  one entry per minute, oldest first\n * @param {number} slo                               e.g. 0.999\n * @param {{ severity: string, longWindowMinutes: number, shortWindowMinutes: number, burnRate: number }[]} rules\n * @returns {{ at: number, severity: string | null }[]}\n */\nfunction evaluateBurnRate(samples, slo, rules) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction runBurnRateScenario(segments, slo, rules) {\n  const samples = [];\n  for (const segment of segments) {\n    const bad = Math.round(segment.rpm * segment.errorRate);\n    for (let i = 0; i < segment.minutes; i++) samples.push({ good: segment.rpm - bad, bad });\n  }\n  return evaluateBurnRate(samples, slo, rules);\n}\n",
        functionName: "runBurnRateScenario",
        testCases: [
          {
            description: "burning exactly the budget (0.1% errors at a 99.9% SLO) never fires",
            args: [
              [{ minutes: 1440, rpm: 1000, errorRate: 0.001 }],
              0.999,
              [
                { severity: "page", longWindowMinutes: 60, shortWindowMinutes: 5, burnRate: 14.4 },
                { severity: "page", longWindowMinutes: 360, shortWindowMinutes: 30, burnRate: 6 },
                { severity: "ticket", longWindowMinutes: 4320, shortWindowMinutes: 360, burnRate: 1 },
              ],
            ],
            expected: [],
          },
          {
            description: "a 10-minute burst of 15% errors tickets, then pages, then resolves back to a ticket",
            args: [
              [
                { minutes: 60, rpm: 1000, errorRate: 0 },
                { minutes: 10, rpm: 1000, errorRate: 0.15 },
                { minutes: 120, rpm: 1000, errorRate: 0 },
              ],
              0.999,
              [
                { severity: "page", longWindowMinutes: 60, shortWindowMinutes: 5, burnRate: 14.4 },
                { severity: "page", longWindowMinutes: 360, shortWindowMinutes: 30, burnRate: 6 },
                { severity: "ticket", longWindowMinutes: 4320, shortWindowMinutes: 360, burnRate: 1 },
              ],
            ],
            expected: [
              { at: 60, severity: "ticket" },
              { at: 62, severity: "page" },
              { at: 98, severity: "ticket" },
            ],
          },
          {
            description: "a sustained 1% error rate picks the 6x rule, not the 14.4x one",
            args: [
              [{ minutes: 180, rpm: 1000, errorRate: 0.01 }],
              0.999,
              [
                { severity: "page", longWindowMinutes: 60, shortWindowMinutes: 5, burnRate: 14.4 },
                { severity: "page", longWindowMinutes: 360, shortWindowMinutes: 30, burnRate: 6 },
                { severity: "ticket", longWindowMinutes: 4320, shortWindowMinutes: 360, burnRate: 1 },
              ],
            ],
            expected: [{ at: 0, severity: "page" }],
          },
          {
            description: "a total outage halfway through pages",
            args: [
              [
                { minutes: 30, rpm: 1000, errorRate: 0 },
                { minutes: 30, rpm: 1000, errorRate: 1 },
              ],
              0.999,
              [
                { severity: "page", longWindowMinutes: 60, shortWindowMinutes: 5, burnRate: 14.4 },
                { severity: "page", longWindowMinutes: 360, shortWindowMinutes: 30, burnRate: 6 },
                { severity: "ticket", longWindowMinutes: 4320, shortWindowMinutes: 360, burnRate: 1 },
              ],
            ],
            expected: [{ at: 30, severity: "page" }],
          },
          {
            description: "no traffic at all never fires and never divides by zero",
            args: [
              [{ minutes: 120, rpm: 0, errorRate: 0 }],
              0.999,
              [
                { severity: "page", longWindowMinutes: 60, shortWindowMinutes: 5, burnRate: 14.4 },
                { severity: "ticket", longWindowMinutes: 4320, shortWindowMinutes: 360, burnRate: 1 },
              ],
            ],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "no samples at all returns no transitions",
            args: [
              [],
              0.999,
              [{ severity: "page", longWindowMinutes: 60, shortWindowMinutes: 5, burnRate: 14.4 }],
            ],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "on a low-traffic service one failed request out of 366 opens a ticket",
            args: [
              [
                { minutes: 60, rpm: 6, errorRate: 0 },
                { minutes: 1, rpm: 6, errorRate: 0.17 },
                { minutes: 60, rpm: 6, errorRate: 0 },
              ],
              0.999,
              [
                { severity: "page", longWindowMinutes: 60, shortWindowMinutes: 5, burnRate: 14.4 },
                { severity: "page", longWindowMinutes: 360, shortWindowMinutes: 30, burnRate: 6 },
                { severity: "ticket", longWindowMinutes: 4320, shortWindowMinutes: 360, burnRate: 1 },
              ],
            ],
            expected: [{ at: 60, severity: "ticket" }],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "obs-oncall-incident-response",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "On-Call, Runbooks and Incident Response",
      summary:
        "On-call is a sustainability problem before it is a technical one. Google's published constraints are a useful anchor: SREs spend at most 50% of their time on operational work and no more than 25% on-call, which means a 24/7 primary-plus-secondary rotation needs about eight engineers at a single site. Smaller teams can absolutely run a rotation — most teams do — but they should know they are running one outside the sustainable envelope and compensate deliberately: fewer paging alerts, generous compensatory time off, and a hard rule that nobody is on-call two weeks running.\n\nThe quality axis matters as much as the quantity. Fewer than two paging events per shift is the published rule of thumb, and a 1:1 alert-to-incident ratio is the goal — one incident generating twelve pages is an alerting bug, not an unusually bad night. Measure both, review them quarterly, and treat a breach as work to be scheduled rather than as weather.\n\nIncident response scales by separating roles, not by adding people to the same conversation. The Incident Commander decides and delegates and does *not* debug; an Operations lead does the hands-on work; a Communications lead owns the status page and the stakeholder updates. Under pressure the commander's real job is holding the timeline and the current hypothesis so that the six people in the channel are working on the same problem. Slack's published account of their own evolution is a good illustration: a formal IC role, defined severity levels and actual training, because ad-hoc response stopped working at their scale.\n\nA runbook is what makes a page survivable at 3am. It should answer, in this order: what this alert means, what the user impact is, how to verify it is real, the safest mitigation, when to escalate and to whom. Not \"how the system works\" — a design document is not a runbook. The strongest signal that a runbook is real is that the last person to use it edited it afterwards. And mitigate before you diagnose: roll back, fail over, shed load. Understanding why can wait until users are not affected.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Google SRE Book: Being On-Call", url: "https://sre.google/sre-book/being-on-call/", kind: "docs" },
        { label: "Google SRE Book: Managing Incidents", url: "https://sre.google/sre-book/managing-incidents/", kind: "docs" },
        { label: "PagerDuty: Incident Commander training", url: "https://response.pagerduty.com/training/incident_commander/", kind: "article" },
      ],
      video: {
        title: "SREcon21 - Evolution of Incident Management at Slack",
        channel: "USENIX",
        url: "https://www.youtube.com/watch?v=FYYTglQoS3w",
        videoId: "FYYTglQoS3w",
        durationLabel: "28:20",
      },
      alternateVideos: [
        {
          title: "SREcon18 Europe - What Medicine Can Teach Us about Being On-Call",
          channel: "USENIX",
          url: "https://www.youtube.com/watch?v=RvHbFYbE6ww",
          videoId: "RvHbFYbE6ww",
          durationLabel: "23:27",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-oncall-incident-response-q1",
          prompt: "What is the Incident Commander's actual job during a major incident?",
          options: [
            "Hold the current state and hypothesis, decide, and delegate — explicitly not to debug the problem themselves",
            "Be the most senior engineer and personally fix the problem",
            "Write the postmortem while the incident is ongoing",
            "Handle all external communication so nobody else is distracted",
          ],
          correctIndex: 0,
          explanation:
            "The moment the commander starts debugging, nobody is tracking the whole picture. Hands-on work belongs to the Operations lead and external updates to the Communications lead, precisely so the commander stays free.",
        },
        {
          id: "obs-oncall-incident-response-q2",
          prompt: "A single database failover generates 14 pages in four minutes. What is the correct conclusion?",
          options: [
            "The alerting is broken: related alerts should be grouped and cause-level alerts should not page",
            "The incident was unusually severe and 14 pages is proportionate",
            "The on-call should silence the extra pages manually each time",
            "Alertmanager should be configured with a longer repeat interval",
          ],
          correctIndex: 0,
          explanation:
            "The goal is roughly one alert per incident. Fan-out is fixed by grouping in Alertmanager and by not paging on causes that the symptom alert already covers — not by asking the person being paged to triage duplicates.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-oncall-incident-response-q3",
          prompt: "Which of these belong in a runbook for an alert? (Select all that apply.)",
          options: [
            "What the alert means and what the user-visible impact is",
            "How to verify quickly whether it is a real problem or a false alarm",
            "The safest mitigation, and when and to whom to escalate",
            "A full architectural description of the service",
            "The complete history of previous incidents on this service",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A runbook is read by a tired person under time pressure. Architecture documents and incident archives are valuable, and belong somewhere the runbook can link to rather than in the first screen.",
        },
        {
          id: "obs-oncall-incident-response-q4",
          prompt: "During an outage, you have a plausible theory about the root cause and an untested fix, and you also have a rollback available. What do you do first?",
          options: [
            "Roll back to stop the user impact, then investigate the cause with the pressure off",
            "Apply the fix, because rolling back loses the evidence",
            "Investigate until you are certain, so you do not roll back unnecessarily",
            "Escalate and wait for the service owner before changing anything",
          ],
          correctIndex: 0,
          explanation:
            "Mitigation before diagnosis. An untested fix under pressure is how a one-hour incident becomes a four-hour one, and evidence can be preserved by capturing logs and metrics rather than by leaving users broken.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-oncall-incident-response-q5",
          prompt: "Roughly how many engineers does a sustainable 24/7 primary-and-secondary rotation need at a single site, by Google's published 25% on-call guidance?",
          options: [
            "About eight, so each engineer is on-call one week in every four in one of the two roles",
            "About three, since only one person is needed at a time",
            "About twenty, because every timezone needs full coverage",
            "It does not depend on team size, only on alert volume",
          ],
          correctIndex: 0,
          explanation:
            "Two roles × week-long shifts × the 25% cap gives eight. Smaller teams can run a rotation, but should be explicit that they are outside the envelope and reduce paging load accordingly.",
        },
        {
          id: "obs-oncall-incident-response-q6",
          prompt: "What should happen at an on-call handoff?",
          options: [
            "A live handover covering open incidents, ongoing risks and anything deliberately left unresolved",
            "Nothing, provided the alerting system routes to the new person",
            "The outgoing engineer writes a postmortem for every page they received",
            "The incoming engineer reads the last week's alerts before their shift starts",
          ],
          correctIndex: 0,
          explanation:
            "An unexplained \"we suppressed that alert until Monday\" is exactly what causes a repeat incident. The handoff is a short conversation and it is the cheapest reliability practice there is.",
        },
        {
          id: "obs-oncall-incident-response-q7",
          prompt: "Which of these are healthy responses to a rotation that consistently exceeds two pages per shift? (Select all that apply.)",
          options: [
            "Treat excess paging load as scheduled work: fix the noisiest alerts and the underlying flakiness",
            "Downgrade alerts that do not need a human within the hour to tickets",
            "Escalate to management with the measured page rate, since staffing and priorities are their decision",
            "Add more people to the rotation so each person is woken less often",
            "Raise thresholds across the board until the page count drops",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Overload is a signal to fix alerts or fix the system, and it is a planning conversation. Spreading the pain across more people hides it, and blanket threshold-raising trades noise for missed real incidents.",
        },
        {
          id: "obs-oncall-incident-response-q8",
          prompt: "Why do severity levels exist, and what makes them useful rather than bureaucratic?",
          options: [
            "They map an incident to a defined response — who is woken, how often updates go out, whether a postmortem is required",
            "They determine which team is to blame for the incident",
            "They are required for compliance reporting",
            "They set the order in which incidents are fixed",
          ],
          correctIndex: 0,
          explanation:
            "A severity is only meaningful if something concrete follows from it. If SEV1 and SEV3 lead to the same response, the levels are paperwork.",
        },
        {
          id: "obs-oncall-incident-response-q9",
          prompt: "An alert has fired forty times this month and the on-call has resolved it the same way every time. What does that indicate?",
          options: [
            "It is toil that should be automated away, or the underlying problem should be fixed — a human is being used as a script",
            "The runbook is working well and nothing needs to change",
            "The alert threshold should be raised so it fires less often",
            "The alert should be routed to a more experienced engineer",
          ],
          correctIndex: 0,
          explanation:
            "A repeatable manual response is the definition of toil. Either automate the remediation or fix the cause; paging a human to run the same three commands forty times is the thing SRE exists to eliminate.",
        },
        {
          id: "obs-oncall-incident-response-q10",
          prompt: "Why is a status-page update usually a separate role's job during a large incident?",
          options: [
            "Writing accurate external updates takes sustained attention that would otherwise be taken from debugging or from command",
            "Only a designated person is legally allowed to publish updates",
            "Engineers are not permitted to see customer-facing communications",
            "Status pages are updated automatically and need no human",
          ],
          correctIndex: 0,
          explanation:
            "Communications is real work with its own cadence and audience. Bolting it onto whoever is deepest in the debugger produces both worse updates and slower resolution.",
        },
      ],
    },
    {
      id: "obs-postmortems",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Postmortems and What Blameless Actually Means",
      summary:
        "Blameless does not mean nobody is accountable. It means the analysis assumes everyone acted reasonably given the information, incentives and tooling they had at the time, and then asks why that was the reasonable action. The reason is practical rather than sentimental: as soon as a postmortem can end someone's career, people stop volunteering what they actually did, and you lose the only source of information about how the system really behaves. A blameful culture produces short, tidy, useless postmortems.\n\nThe discipline that makes it work is avoiding counterfactuals. \"The engineer should have checked the config\" describes a world that did not happen and teaches nothing. \"The deploy tool showed a diff of 400 lines with no indication which were production-affecting\" describes the world that did, and suggests a change. Similarly, \"human error\" is where an investigation stops being useful, not where it concludes: the interesting question is what made the error easy to make and hard to catch.\n\n\"Root cause\", singular, is mostly a fiction in systems of any size. Real incidents are several contributing factors intersecting — a latent bug, a missing alert, an unusual traffic pattern, a runbook that was out of date. Picking one and calling it *the* cause makes the write-up tidy and the remediation narrow. The VOID project's analysis of thousands of public incident reports makes a related point about metrics: incident duration data is wildly skewed and shallow, so MTTR is a far weaker number than its popularity suggests — a useful thing to know before someone puts it on a dashboard as a KPI.\n\nThe operational half is unglamorous: action items with an owner, a priority and a ticket, reviewed like any other work. A postmortem with twelve unassigned \"we should consider\" items is a document, not a change. Triggers for writing one should be defined in advance (user-visible impact beyond a threshold, data loss, a manual intervention to resolve) so the decision is never a judgement call about how embarrassing it was.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Google SRE Book: Postmortem Culture", url: "https://sre.google/sre-book/postmortem-culture/", kind: "docs" },
        { label: "Google SRE Workbook: Postmortem Culture — Beginning", url: "https://sre.google/workbook/postmortem-culture/", kind: "docs" },
        { label: "The VOID: public incident reports", url: "https://www.thevoid.community/", kind: "article" },
        { label: "danluu/post-mortems: a collection of postmortems", url: "https://github.com/danluu/post-mortems", kind: "repo" },
      ],
      video: {
        title: "Postmortem Culture at Google | Ramon Medrano Llamas | Conf42 SRE 2022",
        channel: "Conf42",
        url: "https://www.youtube.com/watch?v=qgHWzQ2zcqQ",
        videoId: "qgHWzQ2zcqQ",
        durationLabel: "23:13",
      },
      alternateVideos: [
        {
          title: "SREcon22 Americas - Tales from the VOID: The Scary Truth about Incident Metrics",
          channel: "USENIX",
          url: "https://www.youtube.com/watch?v=JNgvuF8r46U",
          videoId: "JNgvuF8r46U",
          durationLabel: "27:07",
        },
        {
          title: "SREcon22 Asia/Pacific - A Post Incident Review Review",
          channel: "USENIX",
          url: "https://www.youtube.com/watch?v=DES9935e92Y",
          videoId: "DES9935e92Y",
          durationLabel: "44:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-postmortems-q1",
          prompt: "What does \"blameless\" actually commit a team to?",
          options: [
            "Analysing why an action was reasonable given the information and tools available at the time, rather than who did it",
            "Never naming individuals in the document under any circumstances",
            "Accepting that incidents are unavoidable and require no follow-up",
            "Removing accountability for remediation work",
            "Only writing postmortems for incidents with no human involvement",
          ],
          correctIndex: 0,
          explanation:
            "It is about the direction of the question, not about anonymity or the absence of consequences. Action items still have owners; what is removed is the incentive to hide what happened.",
        },
        {
          id: "obs-postmortems-q2",
          prompt:
            "Which of these findings are counterfactual, and therefore of little use? (Select all that apply.)",
          options: [
            "\"The on-call should have noticed the graph was climbing\"",
            "\"If the review had been more careful, the bug would have been caught\"",
            "\"The engineer ought to have read the runbook before restarting\"",
            "\"The alert for this condition did not exist, so nothing notified anyone for 40 minutes\"",
            "\"The deploy tool applied the migration before the health check completed\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything phrased as \"should have\", \"ought to have\" or \"if only\" describes an alternate history and produces no change. The findings about the missing alert and the deploy tool's ordering describe what the system actually did, and each suggests a specific fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-postmortems-q3",
          prompt: "Why is \"human error\" an unsatisfying root cause?",
          options: [
            "It stops the investigation exactly where the useful questions begin: what made the error easy to make and hard to detect",
            "Humans are never actually involved in modern incidents",
            "It is prohibited by most incident management frameworks",
            "It implies the person should be retrained, which is always the wrong remedy",
          ],
          correctIndex: 0,
          explanation:
            "People make mistakes at a fairly constant rate; the design question is why this particular mistake reached production and went unnoticed. That is where the actionable findings live.",
        },
        {
          id: "obs-postmortems-q4",
          prompt: "What is wrong with insisting every incident has a single root cause?",
          options: [
            "Real incidents usually have several contributing factors, and picking one produces a narrow remediation that misses the others",
            "Nothing — identifying one cause is the goal of every investigation",
            "It takes too long to determine, so it delays the write-up",
            "It requires tooling most teams do not have",
          ],
          correctIndex: 0,
          explanation:
            "A latent bug plus a missing alert plus an unusual traffic pattern is the normal shape. \"The cause was the bad config\" quietly drops the fact that nothing alerted for forty minutes.",
        },
        {
          id: "obs-postmortems-q5",
          prompt: "Why is MTTR a weaker metric than its popularity suggests?",
          options: [
            "Incident duration data is heavily skewed and inconsistently measured, so a mean over it is dominated by definitional choices and outliers",
            "It cannot be calculated without a commercial incident management tool",
            "It measures detection rather than resolution",
            "It only applies to infrastructure incidents, not application ones",
          ],
          correctIndex: 0,
          explanation:
            "This is the VOID project's central finding from thousands of public reports: the distributions are long-tailed and the start and end of an incident are defined differently everywhere, so the mean carries far less signal than a KPI dashboard implies.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-postmortems-q6",
          prompt: "What separates a postmortem that changes something from one that does not?",
          options: [
            "Action items with a named owner, a priority and a ticket, tracked alongside other work",
            "Length and level of technical detail",
            "Being reviewed by a senior engineer",
            "Being published to the whole company",
          ],
          correctIndex: 0,
          explanation:
            "Detail, review and publication all help, but a list of unassigned suggestions decays into nothing. If it is not in the backlog with an owner, it did not happen.",
        },
        {
          id: "obs-postmortems-q7",
          prompt: "When should the decision to write a postmortem be made?",
          options: [
            "In advance, via agreed triggers such as user-visible impact beyond a threshold, data loss, or manual intervention being required",
            "After the incident, based on whether anyone thinks it was interesting",
            "Only when a customer explicitly asks for one",
            "Only for incidents that lasted more than an hour",
          ],
          correctIndex: 0,
          explanation:
            "Deciding case by case means the embarrassing ones get skipped and the near misses never get written up at all. Pre-agreed triggers remove the judgement call.",
        },
        {
          id: "obs-postmortems-q8",
          prompt: "A near miss — an incident that was caught before users noticed — is proposed for a postmortem. Should one be written?",
          options: [
            "Yes: the same contributing factors were present and the luck that saved you is not a control you can rely on",
            "No: without user impact there is nothing to learn",
            "No: it would inflate the team's incident count unfairly",
            "Only if the same conditions recur a second time",
          ],
          correctIndex: 0,
          explanation:
            "Near misses are the cheapest possible learning: full information, no customer damage. Teams that only study incidents with impact are studying a biased sample of their own failures.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-postmortems-q9",
          prompt: "What role does the incident timeline play in the document?",
          options: [
            "It records what was known and believed at each moment, which is what makes detection and diagnosis gaps visible",
            "It establishes who was responsible at each stage",
            "It is a formality required for compliance",
            "It replaces the need for a narrative description",
          ],
          correctIndex: 0,
          explanation:
            "\"Alert fired at 02:14, first human acknowledged at 02:41, correct hypothesis at 03:05\" turns vague impressions into measurable gaps. The timeline is evidence, not attribution.",
        },
        {
          id: "obs-postmortems-q10",
          prompt: "Which practices support a blameless culture in a way people actually believe? (Select all that apply.)",
          options: [
            "Senior people writing up their own mistakes publicly",
            "Separating the postmortem process entirely from performance review",
            "Reviewing postmortems in a forum where questions are allowed and expected",
            "Keeping postmortems confidential to the team involved",
            "Assigning a \"responsible party\" field in the template",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Culture is demonstrated, not announced. Confidentiality removes the learning from everyone who was not there, and a responsible-party field reintroduces exactly the incentive the practice exists to remove.",
        },
      ],
    },
    {
      id: "obs-profiling",
      moduleId: "devops-observability",
      trackId: "devops",
      title: "Profiling in Production",
      summary:
        "Traces stop at the process boundary. When a span says \"this service took 3.2 seconds\" and there are no child spans to explain it, the next question — *which code* — is a profiling question. A sampling profiler interrupts the process at a fixed frequency (typically 100 Hz), records the stack at that instant, and aggregates thousands of those samples into a picture of where time is actually spent. Because it samples rather than instruments every call, the overhead is small enough — low single-digit percent for CPU profiles — to leave running in production permanently, which is what \"continuous profiling\" means.\n\nRunning it in production is the point. Local profiling reproduces the developer's laptop: a different dataset, a cold cache, no contention, no noisy neighbour, and JIT behaviour shaped by a different workload. The pathologies that matter — a regex catastrophically backtracking on one customer's input, lock contention that only appears above 400 concurrent requests, an allocation pattern that keeps the GC busy — usually do not reproduce anywhere else.\n\nA flame graph is the standard rendering, and it is worth being precise about how to read it: the x-axis is *not* time, it is the proportion of samples, sorted alphabetically for stable diffs. Width means \"how much of the total this stack accounted for\"; depth is just call depth. The usual mistake is reading a wide frame at the bottom as slow — `main` is always wide. What you are hunting for is a wide frame with a narrow parent, or a plateau near the top. And CPU profiles only show running time: a request blocked on a database is invisible in one, which is why allocation, block and mutex profiles exist alongside it.\n\nFor a small deployment the honest scope is smaller than the tooling suggests. Language runtimes ship perfectly good profilers — Go's `net/http/pprof`, Node's inspector, JFR for the JVM — that you can attach to a live process when you need one. Continuous profiling with a storage backend earns its keep when you have a fleet, when you want to compare a release against the previous one, or when the problem only appears at 3am and nobody was there to attach anything.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "Grafana Pyroscope: Introduction to continuous profiling", url: "https://grafana.com/docs/pyroscope/latest/introduction/", kind: "docs" },
        { label: "Brendan Gregg: Flame Graphs", url: "https://www.brendangregg.com/flamegraphs.html", kind: "article" },
        { label: "Go: Profiling Go Programs", url: "https://go.dev/blog/pprof", kind: "article" },
        { label: "OpenTelemetry: announcing support for profiling", url: "https://opentelemetry.io/blog/2024/profiling/", kind: "article" },
      ],
      video: {
        title: "Introduction to continuous profiling",
        channel: "Grafana",
        url: "https://www.youtube.com/watch?v=pU6GFVHFPFU",
        videoId: "pU6GFVHFPFU",
        durationLabel: "7:36",
      },
      alternateVideos: [
        {
          title: "Introduction to Continuous Profiling using Pyroscope - Fosdem 2022",
          channel: "Ryan Perry",
          url: "https://www.youtube.com/watch?v=2Ux_6ljZjsA",
          videoId: "2Ux_6ljZjsA",
          durationLabel: "27:55",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "obs-profiling-q1",
          prompt: "On a flame graph, what does the horizontal axis represent?",
          options: [
            "The proportion of collected samples a stack accounted for, with frames sorted alphabetically",
            "Elapsed wall-clock time, left to right",
            "The order in which functions were called",
            "Memory allocated by each frame",
          ],
          correctIndex: 0,
          explanation:
            "It is a population, not a timeline. Alphabetical sorting is deliberate: it keeps a frame in the same place between two profiles so they can be compared or differenced.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-profiling-q2",
          prompt: "A request spends 3 seconds waiting on a database query. What does a CPU profile of that process show?",
          options: [
            "Almost nothing for that request, because the thread was blocked rather than executing",
            "Three seconds attributed to the database driver's function",
            "Three seconds in the kernel's socket read path",
            "An error, because the profiler cannot sample a blocked thread",
          ],
          correctIndex: 0,
          explanation:
            "CPU profiles measure on-CPU time. Blocking is invisible there, which is what block, mutex and wall-clock profiles — and traces — are for.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-profiling-q3",
          prompt: "Why is a sampling profiler cheap enough to leave running in production?",
          options: [
            "It records a stack at a fixed low frequency instead of instrumenting every function entry and exit",
            "It only runs during periods of low traffic",
            "It writes to memory only and never persists anything",
            "It profiles one request in a thousand rather than the whole process",
          ],
          correctIndex: 0,
          explanation:
            "Instrumenting every call changes the program's performance, sometimes by a lot. Sampling at ~100 Hz costs low single-digit percent and converges on the same answer given enough samples.",
        },
        {
          id: "obs-profiling-q4",
          prompt: "Which problems are realistically only visible when profiling in production? (Select all that apply.)",
          options: [
            "Lock contention that appears above a concurrency level your laptop never reaches",
            "A regular expression backtracking catastrophically on one customer's real input",
            "Garbage collection pressure driven by real traffic mix and object lifetimes",
            "A function with quadratic complexity on a small fixed input",
            "A syntax error in a rarely executed branch",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Contention, adversarial real input and GC pressure all depend on production scale, production data and production concurrency. Deterministic algorithmic problems on fixed inputs, and syntax errors, are exactly what local testing does catch.",
        },
        {
          id: "obs-profiling-q5",
          prompt: "You see a very wide frame near the bottom of a flame graph, such as your HTTP handler. What does it tell you?",
          options: [
            "Almost nothing — every sample passes through it; look for a wide frame whose parent is narrow, or a plateau near the top",
            "That the handler itself is the bottleneck and should be optimised",
            "That the profile was collected incorrectly",
            "That the process spent most of its time in the framework rather than your code",
          ],
          correctIndex: 0,
          explanation:
            "Width at the bottom is inevitable. The diagnostic signal is where the width *concentrates* higher up — a leaf that is wide is code actually running, and a frame far wider than you expected relative to its siblings is the lead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "obs-profiling-q6",
          prompt: "What does a differential (comparison) profile between two releases give you that a single profile does not?",
          options: [
            "It isolates what changed, so a regression shows up even when the absolute profile is dominated by the same hot paths as always",
            "It reduces profiling overhead by half",
            "It removes the need to correlate with deploy timestamps",
            "It can attribute cost to individual requests",
          ],
          correctIndex: 0,
          explanation:
            "Hot paths look the same release after release, which makes a single profile a poor regression detector. The diff is where \"this function got 40% more expensive on Tuesday\" becomes visible.",
        },
        {
          id: "obs-profiling-q7",
          prompt: "Why label profiles with service, version and instance metadata in a continuous profiling system?",
          options: [
            "Without them you cannot compare releases or isolate one bad instance in a fleet — the profiles blur into one average",
            "The storage format requires at least three labels",
            "Labels are what allow profiles to be linked to log lines",
            "Unlabelled profiles cannot be rendered as flame graphs",
          ],
          correctIndex: 0,
          explanation:
            "It is the same dimensionality argument as everywhere else in this camp: aggregate without the dimension you need and the answer disappears. Labels are also what makes a differential profile possible.",
        },
        {
          id: "obs-profiling-q8",
          prompt: "For a single-process application on one VPS, when is continuous profiling worth the infrastructure?",
          options: [
            "When the problem only shows up under real load at unpredictable times, so nobody is around to attach a profiler manually",
            "Always — continuous profiling should be the first observability tool installed",
            "Never — single-process applications cannot be profiled meaningfully",
            "Only once the application exceeds a thousand requests per second",
          ],
          correctIndex: 0,
          explanation:
            "The runtime's built-in profiler, attached when you need it, covers the reproducible cases perfectly well. The argument for keeping it always on is retrospective: a profile from 03:14 last Tuesday that nobody had to be awake to capture.",
        },
        {
          id: "obs-profiling-q9",
          prompt: "Which profile type would you reach for first for a service whose memory grows steadily until it is OOM-killed?",
          options: [
            "An allocation or heap profile, which attributes allocated bytes and retained objects to call stacks",
            "A CPU profile, since allocation costs CPU",
            "A mutex profile, since leaks are usually a concurrency bug",
            "A wall-clock profile over the whole lifetime of the process",
          ],
          correctIndex: 0,
          explanation:
            "\"Which stack allocated these bytes, and what is still holding them\" is exactly what heap and allocation profiles answer. A CPU profile shows allocation cost only incidentally and says nothing about retention.",
        },
        {
          id: "obs-profiling-q10",
          prompt: "How do traces and profiles divide the work of explaining a slow request?",
          options: [
            "The trace narrows it to a service and a span; the profile explains what that service's code was doing during it",
            "They are interchangeable; a profile can reconstruct the trace",
            "The profile narrows it to a service; the trace explains the code path",
            "Profiles replace traces once a system has more than a handful of services",
          ],
          correctIndex: 0,
          explanation:
            "They operate at different granularities and compose well — several systems can now link a span directly to the profile samples collected while it was executing.",
        },
      ],
    },
  ],
} satisfies Module;
