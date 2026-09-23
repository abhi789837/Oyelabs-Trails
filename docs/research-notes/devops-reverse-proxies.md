# Reverse Proxies research notes (2026-09-23)

Third camp of the v3 DevOps & Cloud track, 14 topics, all `quiz`. Scope decision: this camp is
*the thing in front of the app* — what it buys you, how nginx and Caddy are configured, and the
traps in that configuration. TLS internals and the handshake belong to `devops-networking-tls`
(this camp configures TLS, it does not explain it); Linux and file permissions to
`devops-linux-shell`; Kubernetes Ingress and Gateway API to `devops-kubernetes`; metrics,
tracing and dashboards to `devops-observability`. `proxy-observability-logs` is deliberately
narrow: it covers only the proxy's own access/error logs and the
`$request_time` vs `$upstream_response_time` distinction, because that pair is a
reverse-proxy debugging skill rather than an observability-tooling one.

Topic order (all `proxy-` prefixed):

1. `proxy-what-and-why` — intermediate
2. `proxy-nginx-config-structure` — intermediate
3. `proxy-location-matching` — advanced, **milestone**
4. `proxy-pass-uri-rewrite` — advanced, **milestone**
5. `proxy-forwarded-headers` — advanced
6. `proxy-caddy-automatic-https` — advanced, **milestone**
7. `proxy-tls-config` — advanced
8. `proxy-buffering-timeouts` — advanced
9. `proxy-websockets-sse` — advanced
10. `proxy-static-compression-cache` — intermediate
11. `proxy-rate-limiting` — advanced
12. `proxy-load-balancing` — advanced
13. `proxy-observability-logs` — intermediate
14. `proxy-choosing` — advanced

Three milestones, matching the two the brief names (`proxy_pass` trailing slash, Caddy automatic
HTTPS) plus location matching, which is the other precise, deterministic, genuinely hard thing
here. The brief listed "security headers, proxy vs app" as its own bullet; it is folded into
`proxy-tls-config` (HSTS is a transport statement and the `add_header` inheritance trap lives
there naturally) to keep the camp inside the 11–14 range.

## Videos

Every id came from `yt.mjs search` and was confirmed with `yt.mjs info --chapters`. All 14
primaries and all 5 alternates report `embeddable: true`. No search-URL fallbacks.

Two long courses carry several topics each via chapter-splitting, plus one each from Hussein
Nasser and freeCodeCamp:

- **`9t9Mp0BGnyI`** — "NGINX Tutorial for Beginners" (**freeCodeCamp.org**, 51:03, Jan 2024).
  Chapters: 0 What is NGINX, 498 Installation, 671 Terminology, 796 Serving Static Content,
  1054 Mime Types, **1368 Location Context**, 1996 Rewrites and Redirect, **2273 NGINX as a Load
  Balancer**. Used at 1368 for `proxy-location-matching` and 2273 for `proxy-load-balancing`.
- **`-sY9OBgohX0`** — "NGINX Complete Course: Reverse Proxy, Load Balancing, HTTPS & Docker"
  (**Sarvin Style Coding**, 2:08:17, 7 Sep 2026, 78k views). The most current full nginx course
  found; description confirms it covers reverse proxy, HTTPS, load balancing, caching,
  compression, security headers and rate limiting against a real React/Node/Mongo stack.
  Chapters: 0 Introduction, 149 Nginx Basics, **1022 Reverse Proxy**, 2815 Deploy with Docker,
  3574 HTTPS & Let's Encrypt, 4575 Load Balancing, **5512 HTTP Caching**, 6337 Compression,
  6986 Security Layer. Used at 1022 for `proxy-pass-uri-rewrite` and 5512 for
  `proxy-static-compression-cache`. Not a roster channel — checked the description and chapter
  structure rather than taking the view count on trust.
- **`q8OleYuqntY`** — "Full NGINX Tutorial - Demo Project with Node.js, Docker" (**TechWorld with
  Nana**, 1:11:40, Nov 2024). Chapters: 0 Intro, 225 What is Nginx, 683 How to configure Nginx,
  844 K8s Ingress Controller, **924 Nginx Load Balancer vs Cloud Load Balancer**, 1107 NGINX vs
  Apache, 1163 Simple Web Application, 1226 Add Backend Web Server, 1480 Dockerize Node.js,
  2047 Install NGINX, 2347 Configure NGINX as Reverse Proxy, 3154 Test Load Balancing,
  **3482 Configure HTTPS**, 4093 HTTP to HTTPS Redirection. Used at 3482 for `proxy-tls-config`
  and 924 for `proxy-choosing` (that chapter *is* the nginx-vs-cloud-LB decision).
- **`hcw-NjOh8r0`** — "NginX Crash Course" (**Hussein Nasser**, 2:01:21, 2019). Old, but its
  timeout section is the best free treatment of the subject anywhere: 5134 FrontEnd Timeouts,
  5209 client_header_timeout, 5430 client_body_timeout, 5580 send_timeout, 5700
  keepalive_timeout, 5775 lingering_timeout, 6000 resolver_timeout, **6096 BackEnd Timeouts**,
  6137 proxy_connect_timeout, 6233 proxy_send_timeout, **6390 proxy_read_timeout**, 6600
  proxy_next_upstream_timeout. Used at 6096 for `proxy-buffering-timeouts`, and at 1830
  ("proxy pass") as the alternate on `proxy-pass-uri-rewrite`. None of these directives or
  defaults have changed since, so the age is cosmetic.

Dedicated videos:

- `proxy-what-and-why` → **`xo5V9g9joFs`** "Proxy vs Reverse Proxy vs Load Balancer | Simply
  Explained" (TechWorld with Nana, 13:18, 736k). Alternate **`4NB0NDtOwIQ`** (ByteByteGo, 5:17)
  for a five-minute version.
- `proxy-nginx-config-structure` → **`9jZEfW8h5fQ`** "Nginx Zero to Hero | Full Course with
  Hands-on" (Abhishek.Veeramalla, 58:38, Jul 2025) at **22s "NGINX basics"**, a 26-minute
  hands-on walk through `nginx.conf` structure. Preferred over freeCodeCamp's 2-minute
  "Terminology" chapter and Nana's 2.7-minute "How to configure Nginx".
- `proxy-forwarded-headers` → **`4p1Zc8F29Lk`** "Client IP in NGINX reverse proxy" (Juriy Bura,
  8:25) at **98s "Configuring the host header"**; chapters continue 258 "Setting IP headers".
  From 2017 and the only tightly focused video on the topic that exists;
  `proxy_set_header X-Real-IP` / `X-Forwarded-For` have not changed. **Flagged as the weakest
  primary in the camp** — replace it if a modern equivalent appears.
- `proxy-caddy-automatic-https` → **`Inu5VhrO1rE`** "I Was DEFINITELY Using The Wrong Server"
  (DevOps Toolbox, 14:26, 76k, Feb 2026). Description confirms it is a month of running Caddy
  with automatic SSL as the headline, compared against nginx/Traefik/HAProxy. Alternate
  **`ZOtUco5EwoI`** "Replace Traefik? Caddy Proxy with SSL Certificates" (Jim's Garage, 18:57,
  104k) for a Caddyfile-and-Docker walkthrough with chapters (0 Intro, 29 Config Overview,
  713 Deployment, 852 Testing, 1006 Caddy API).
- `proxy-websockets-sse` → **`zutCD7HMgwA`** "Proxying WebSockets with NGINX" (Juriy Bura, 8:25,
  75k). Also 2017; the `proxy_http_version 1.1` + `Upgrade`/`Connection` idiom is byte-identical
  today. Alternate **`4HlNv1qpZFY`** "Server-Sent Events Crash Course" (Hussein Nasser, 29:48,
  126k) at **300s "Server Sent Events"**. Two Juriy Bura videos in one camp is deliberate: they
  are the two most precisely on-topic videos available, and nothing newer covers either subject
  without being a 90-second AI-narrated fix-it clip.
- `proxy-rate-limiting` → **`TfZlXBHtyzE`** "How to add rate limiting in Ngnix" (Hitesh
  Choudhary, 12:05). Chapters 75 Documentation, 358 Stud(y), 557 Burst.
- `proxy-observability-logs` → **`f2WKJpFWXx8`** "Nginx Access and Error Logs" (WittCode, 6:26).
  Only 2.2k views, but precisely scoped and well chaptered (8 error logs, 56 `error_log`,
  143 placement, 205 access logs, 233 `log_format`, 307 placement, 347 multiple formats).
- `proxy-choosing` alternate → **`F-9KWQByeU0`** "Setting up a production ready VPS is a lot
  easier than I thought." (Dreams of Code, 29:49, 574k) at **1036s "Reverse Proxy"**. Confirmed
  by fetching the watch page that this video uses **Traefik** (30 mentions, zero for
  nginx/Caddy), which is why it sits on the comparison topic.

Considered and rejected: `FziEhnIpln4` and `NTOcdjMs8E4` (Hindi); `tMtFZdaaIhk` / `NwijBVfiK_o`
(4-year-old 5–9 hour compilations with no usable chapters); `7FpSPSlJj-0` (NeuralNine, fine but
every chapter is better covered elsewhere); `lZVAI3PqgHc` and `X3Pr5VATOyA` (NGINX's own channel,
5–8 years old and product-marketing shaped); the `vlogize` / `Dargslan` / `epathshaala` families
of 2-minute, double-digit-view clips that dominate search for `proxy_pass`, WebSocket and SSE
queries — none are trustworthy. **No Vandad Nahavandipoor video was considered** (channel is
`embeddable: false` throughout).

## References

All URLs checked with `check-urls.mjs`; every one in the file returns 200 and the final URL after
redirects is what is shipped. `nginx.org/en/docs/...` or `caddyserver.com/docs/...` is first in
every topic's list, as required.

- **Meta-refresh stub found:** `https://ssl-config.mozilla.org/` is now a 200 stub that only a
  browser follows to **`https://configurator.tlsref.org/`**. The real URL is what
  `proxy-tls-config` links to. Anyone updating this file should not "fix" it back.
- **Meta-refresh stub found:** `https://doc.traefik.io/traefik/providers/docker/` forwards to
  `…/reference/install-configuration/providers/docker/`. Avoided by linking the docs root, which
  is a real page.
- **404s found while searching:** `blog.nginx.org/blog/avoiding-top-10-nginx-configuration-mistakes`
  (no longer exists under any slug tried — the blog's own search does not surface it);
  `blog.nginx.org/blog/websocket-nginx`; `web.dev/articles/uses-text-compression`.
  `https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/` returns **403** to the
  checker (bot challenge) and was dropped.
- Anchored deep links (`#proxy_pass`, `#location`, `#proxy_read_timeout`) are kept: nginx's docs
  are one giant page per module and the fragment is the only way to land on the directive. The
  checker strips the fragment when reporting `finalUrl`; the pages themselves are 200.
- **Iframe previews:** `nginx.org`, `caddyserver.com`, `doc.traefik.io`, `rfc-editor.org`,
  `wiki.mozilla.org`, `configurator.tlsref.org` and `expressjs.com` all allow framing and will
  preview inline. Blocked (link-card fallback): `developer.mozilla.org` (`X-Frame-Options: DENY`),
  `blog.nginx.org` (`SAMEORIGIN`), `github.com`, `owasp.org` and `letsencrypt.org`
  (`CSP frame-ancestors 'none'`), `digitalocean.com` (`frame-ancestors 'self'`),
  `docs.aws.amazon.com` (`SAMEORIGIN`).
- `https://owasp.org/www-project-secure-headers/` redirects to
  `https://owasp.org/projects/secure-headers-project`; the final URL is used.
- No `interview-prep` refs. There is no nginx/Caddy equivalent of
  `lydiahallie/javascript-questions` worth shipping; `trimstray/nginx-admins-handbook` is used as
  `repo` instead, and the interview weight is carried by the read-this-config questions.

## Facts verified

Checked against nginx.org and caddyserver.com on 2026-09-23, not from memory.

### Versions

- **nginx mainline 1.31.6, stable 1.30.5** (`nginx.org/en/docs/download.html`; legacy branches
  1.28.3 and 1.26.3). `CONTENT_GUIDE.md` §10b says "nginx 1.29", which was true when it was
  written and is now a branch behind on both tracks. Content avoids quoting a version except
  where a directive's availability genuinely depends on one.
- **Caddy v2.11.4** (released 2026-06-03, from the GitHub releases API). §10b's "Caddy 2" holds.
- Version-dependent facts actually used, each stated with its version in the prompt or
  explanation: `http2` directive (nginx **1.25.1**, deprecating `listen … http2`);
  `add_header_inherit on|off|merge` (nginx **1.29.3**); predicate locations `location $var`
  (nginx **1.31.5**, mainline only — mentioned in the summary, never used as a quiz answer);
  automatic `Host` override when Caddy proxies to HTTPS (**Caddy v2.11.0**).

### nginx

- **`location` algorithm** (`ngx_http_core_module`): `=` exact match short-circuits; otherwise the
  longest matching prefix is remembered; if it carries `^~`, regexes and predicate locations are
  skipped; otherwise regexes are checked **in configuration order** and the *first* match wins;
  if none match, predicate locations, then the remembered prefix. Matching is on the normalised,
  percent-decoded URI; the query string never participates. Named `@` locations are not matched
  against requests.
- **Trailing-slash 301**: a prefix location ending in `/` that is handled by `proxy_pass` (or
  `fastcgi_pass`/`uwsgi_pass`/`scgi_pass`/`memcached_pass`/`grpc_pass`) makes nginx answer the
  same URI *without* the slash with a permanent redirect adding it. Documented, and the reason
  `location = /user` next to `location /user/` exists.
- **`proxy_pass` URI rule**: with a URI, the part of the normalised request URI matching the
  location is *replaced* by it; without a URI, the request URI is passed through. Three cases
  make the replacement form illegal or ignored — regex and named locations (nginx refuses to
  start with a URI), a preceding `rewrite … break` (the `proxy_pass` URI is ignored and the
  changed URI is sent), and variables in `proxy_pass` (URI sent as-is, name resolved via
  `resolver` rather than as a server group). UNIX sockets take the URI after a second colon:
  `http://unix:/path.sock:/uri/`.
- **`proxy_redirect default;`** is the default and rewrites `Location` and `Refresh` header fields
  that point at the `proxy_pass` address.
- **Default `proxy_set_header`** is `Host $proxy_host;` and `Connection close;` — so upstreams see
  the upstream's own name as `Host` unless you set it. Caddy passes the original `Host` through.
- **`add_header` inheritance**: inherited from the previous level *if and only if* no `add_header`
  is defined at the current level. `add_header_inherit merge` (1.29.3) opts into appending.
  `always` makes the header apply to error responses too.
- **Defaults**: `proxy_connect_timeout` / `proxy_send_timeout` / `proxy_read_timeout` all 60s;
  `proxy_connect_timeout` "cannot usually exceed 75 seconds" (documented);
  `client_max_body_size` 1m → **413**; `proxy_buffering on`; `proxy_buffers 8 4k|8k`;
  `gzip_comp_level 1`; `gzip_min_length 20`; `gzip_vary off`; `gzip_proxied off`;
  `gzip_types text/html` — and `text/html` is *always* compressed, `gzip_types` only adds to it.
- **`proxy_read_timeout` is between two successive reads, not the whole response** (documented
  wording). This is the reason a slow-trickle stream survives and a silent 61-second computation
  does not.
- **`X-Accel-Buffering: yes|no`** from the upstream enables/disables buffering for that response
  (since 1.1.6, suppressible with `proxy_ignore_headers`).
- **Rate limiting**: leaky bucket; `limit_req_zone` is `http`-context only; `limit_req_status`
  default **503**; one megabyte of zone holds "about 16 thousand 64-byte states";
  `burst`, `nodelay` and `delay=` are as described; `limit_req_dry_run` exists.
- **Upstream**: default method is weighted round-robin; `random two` defaults its inner method to
  `least_conn`; `max_fails` default **1**, `fail_timeout` default **10s** — these are *passive*
  checks. Active `health_check` lives in `ngx_http_upstream_hc_module`, which the page itself
  states is part of the commercial subscription.
- **Logging**: `$request_time` is "time elapsed since the first bytes were read from the client"
  through the log write after the last bytes are sent; `$upstream_response_time` is upstream-only
  and holds **several values separated by commas and colons** when more than one upstream was
  tried. `access_log` supports `buffer=`, `flush=`, `gzip` and `if=`. `nginx -s reopen` (USR1) is
  what makes log rotation work.
- `499` (client closed connection) is nginx's own non-standard status — not in RFC 9110.
- **SNI**: with two HTTPS servers on one address, a client that sends no SNI receives the *default
  server's* certificate, "regardless of the requested server name" — the docs state this
  explicitly, along with SAN and wildcard certificates as the workarounds.
- **Certificate chains**: `ssl_certificate` must hold the server certificate *before* the chained
  intermediates; the docs note this is why some browsers accept a certificate that others reject
  (browsers can fetch the missing intermediate, other clients cannot).
- One claim is **not** from a documentation page: the `conflicting server name … ignored` warning
  for two server blocks sharing a `server_name` on one socket is nginx's emitted warning text and
  long-standing behaviour, not something `server_names.html` spells out. Used in
  `proxy-nginx-config-structure` q9.

### Caddy

- **Automatic HTTPS**: on by default for any site address that names a host. Public DNS names get
  certificates from a public ACME CA (Let's Encrypt, ZeroSSL as fallback); `localhost`, `.local`,
  `.internal`, `.home.arpa` and IP addresses get a leaf from Caddy's own local CA, which Caddy
  tries to install into the system trust store. HTTP→HTTPS redirect is automatic. Deactivated by
  an `http://` site-address prefix, by giving no hostname/IP, by listening only on the HTTP port,
  by manually loading certificates, or explicitly.
- **Challenges**: HTTP-01 (needs port 80) and TLS-ALPN-01 (needs port 443) are both enabled by
  default and chosen adaptively; DNS-01 needs provider credentials, needs no open ports, is the
  only route to a wildcard, and **disables the other two by default** when enabled. Staging
  endpoint: `https://acme-staging-v02.api.letsencrypt.org/directory`.
- **Storage is load-bearing**: the data directory holds the account key and all certificates.
  Ephemeral storage means re-issuance on every start and Let's Encrypt rate limits.
- **`reverse_proxy` default headers**: sets/augments `X-Forwarded-For`, sets `X-Forwarded-Proto`
  and `X-Forwarded-Host`, and **ignores the incoming values by default to prevent spoofing**.
  `trusted_proxies` (preferably the `servers > trusted_proxies` global option) is required when
  Caddy is not the outermost hop. This is the opposite default from nginx's
  `$proxy_add_x_forwarded_for`, which appends to whatever the client sent.
- **Streaming**: `flush_interval -1` is low-latency mode (no response buffering, flush after every
  write, and the upstream request is not cancelled on early client disconnect). It is **ignored,
  and responses are flushed immediately anyway**, when the response has
  `Content-Type: text/event-stream`, an unknown `Content-Length`, or is HTTP/2 on both sides with
  unknown length and no non-identity `Accept-Encoding`. WebSockets are force-closed on config
  reload unless `stream_close_delay` is set; `stream_timeout` caps stream lifetime.
- **`encode`** supports **gzip and zstd on the fly only** (zstd preferred, then gzip, if no
  formats are listed). Brotli is served only from pre-compressed files.
- **Routing**: directives are sorted by a hard-coded order, and same-named directives by matcher
  specificity (path matchers by length, with a non-`*` path beating the `*` form); `handle` blocks
  are mutually exclusive and `handle_path` is `handle` plus `uri strip_prefix`; `route` preserves
  written order. Default `lb_policy` is **`random`**, not round-robin. Active health checks
  (`health_uri`, `health_interval` default 30s, `health_body`, …) are in the free build.

### This repository

`Caddyfile.example`, `docker-compose.yml` and README §"Deploying v3 (VPS)" are used as worked
examples in four topics, all re-read on 2026-09-23:

- The app binds `127.0.0.1:8787` and the compose file publishes to loopback only, so Caddy is the
  only route in (`proxy-what-and-why` q3).
- `handle /api/admin/live/stream { reverse_proxy … { flush_interval -1 } }` with a comment
  explaining that without it the admin's live integrity feed arrives minutes late in a batch
  (`proxy-websockets-sse` q6). The nuance the file does not say, and the question does: current
  Caddy would auto-flush anyway *if* the response is labelled `text/event-stream`, so the setting
  is explicitness rather than necessity — which is a defensible reason to keep it.
- `header_up X-Forwarded-For {remote_host}` overwrites rather than appends, which is correct
  precisely because Caddy is the outermost hop there and the login rate limiter depends on the
  value (`proxy-forwarded-headers` q9).
- `@hashed path_regexp … header @hashed Cache-Control "public, max-age=31536000, immutable"`,
  alongside the app's own CSP/HSTS via helmet rather than duplicating them in Caddy
  (`proxy-static-compression-cache`, `proxy-tls-config`).

## Assessment shape

All 14 topics are **quiz**; 127 questions total. The sandbox
(`server/src/sandbox/`) runs JavaScript only, so nginx configuration cannot be graded — the same
decision already recorded under `## v3 decisions` in `docs/PROGRESS.md` for PHP, Dart, Kotlin and
Swift. Difficulty is carried by read-this-config questions instead, which suits this subject
unusually well: location selection and the `proxy_pass` URI rule are precise, deterministic and
genuinely hard, and "given these blocks and this request path, which one matches" is exactly the
question a real inherited config asks. Every topic has at least two
`isEdgeCaseOrInterviewQuestion` and at least one multi-select; the edge-case questions are built
from real production failures — the `//users` double slash, the `add_header` that deletes its
siblings, the 60-second 504, the 1 MB upload, the office rate-limited as one user, the
`$request_time` that proves it was never the app.
