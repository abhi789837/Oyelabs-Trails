# Networking, DNS & TLS research notes (2026-09-23)

Module `devops-networking-tls`, track `devops`, 15 topics, id prefix `net-`, quiz-only
(the sandbox runs JavaScript, and there is no meaningful JS code challenge for protocol
material — difficulty is carried by read-this-output questions and CIDR arithmetic, per
the `## v3 decisions` note in `docs/PROGRESS.md`).

## Scope boundary with the existing Backend camp

`src/content/backend/be-foundations.ts` already covers, at beginner level:
`web-how-internet-works` (DNS hierarchy, TCP handshake round trips, NAT source IP, router
vs switch, IP best-effort), `web-http-methods-status-headers` (RFC 9110/9111 semantics,
safe/idempotent, caching headers, a short HTTP/1.1 vs 2 vs 3 paragraph),
`web-client-server`, `web-rest-rpc-graphql`.

This camp deliberately starts where that stops:

- No repeat of "what is DNS / what is a router". The DNS topics here are the cutover
  procedure, negative caching, apex CNAME, delegation mismatch and reading `dig`.
- No repeat of "how many round trips does TLS 1.3 take" as the central idea; that appears
  once as supporting detail. The TLS topics here are chain building, AIA fetching, SAN
  matching, revocation soft-fail and the certificate lifecycle.
- The HTTP-version topic is framed entirely around head-of-line blocking and QUIC rather
  than around HTTP semantics, which `be-foundations` owns.
- Two questions in `be-foundations` (DNS TTL propagation, NAT source IP) have close cousins
  here; they were rewritten to test a different failure (TTL lowered *too late*; NAT idle
  timeout killing pooled connections) rather than the same fact.

Also out of scope by instruction and left to sibling camps: Linux fundamentals, reverse
proxy configuration (nginx/Caddy), AWS specifics, Kubernetes networking, observability
tooling. Security groups and NACLs appear only as the worked example of stateful vs
stateless filtering, and the AWS NAT gateway idle timeout only as a concrete number for the
idle-mapping failure.

## Topics

| # | id | level | notes |
| --- | --- | --- | --- |
| 1 | `net-layers-in-practice` | intermediate | triage order, encapsulation, MTU black holes |
| 2 | `net-ip-cidr` | intermediate | CIDR arithmetic, RFC 1918, overlap |
| 3 | `net-ports-sockets` | intermediate | 4-tuple, ephemeral exhaustion, reading `ss` |
| 4 | `net-tcp-connections` | advanced | handshake, `TIME_WAIT`, `CLOSE_WAIT`, keepalive |
| 5 | `net-udp` | intermediate | datagram boundaries, when UDP is right |
| 6 | `net-http-versions-quic` | advanced | HOL blocking at both layers, QUIC, ALPN, `Alt-Svc` |
| 7 | `net-nat-private-ranges` | advanced | NAT state, containers, `localhost` |
| 8 | `net-dns-resolution` | advanced, **milestone** | resolution path, records, TTL cutovers |
| 9 | `net-dns-caching-dig` | intermediate | the five caches, reading `dig` |
| 10 | `net-tls-handshake` | advanced, **milestone** | handshake, chain of trust, SAN |
| 11 | `net-cert-lifecycle-acme` | intermediate | ACME challenges, renewal, CT |
| 12 | `net-sni-mtls` | advanced | SNI, virtual hosting, mTLS |
| 13 | `net-firewalls-drop-vs-reject` | advanced | dropped vs refused, stateful vs stateless |
| 14 | `net-load-balancers-l4-l7` | advanced | L4/L7 tradeoffs, XFF, pinned connections |
| 15 | `net-debugging-toolkit` | expert, **milestone** | the ordered method |

Merged against the brief's bullet list to land inside the 12–15 target: QUIC/HTTP3 was
folded into the HTTP-versions topic (they are one story about head-of-line blocking), and
SNI was combined with mTLS (both are "the handshake extended in production"). Nothing in
the brief's list was dropped.

## Videos

Every id came from `node scripts/research/yt.mjs search` and was confirmed with
`yt.mjs info <id>`; all primaries and alternates report `embeddable: true`.

- `net-layers-in-practice`: **OSI Model: A Practical Perspective** (Practical Networking,
  13:25). Explicitly "what the layers mean in practice", which is the framing this topic
  needs. Alt: Hussein Nasser, *The OSI Model by Example* (31:11).
- `net-ip-cidr`: **How to solve ANY Subnetting Problems in 60 seconds or less** (Practical
  Networking, 6:10) — it teaches the arithmetic the quiz tests. Alts: *What is Subnetting?*
  (8:37) and *CIDR, Subnet Mask, and Binary Subnet Mask Are the Exact Same Thing* (3:23).
  **PowerCert's "Subnet Mask - Explained" (`s_Ntt6eTn94`) was rejected: `info` reports
  `embeddable: false` (oEmbed 401).** Other PowerCert videos are fine — embeddability is
  per video, not per channel, so each one must be checked.
- `net-ports-sockets`: **Is there a Limit to Number of Connections a Backend can handle?**
  (Hussein Nasser, 18:42) at `startSeconds: 270`, chapter "64K Connection Limit Explained".
  Alt: Red Hat's own 2:52 `ss` demo. Dedicated `ss` tutorials all had three-digit view
  counts and obscure channels, so the official Red Hat clip was preferred as the alternate.
- `net-tcp-connections`: **TCP connection walkthrough** (Ben Eater, 9:30) — an actual
  packet-by-packet walk including teardown. Alt: Gate Smashers on the state machine.
  Hussein's TCP-handshake video was skipped because `be-foundations` already uses it.
- `net-udp`: **TCP vs UDP Crash Course** (Hussein Nasser) at `startSeconds: 1465`, chapter
  "UDP pros cons". Alt: PowerCert *TCP vs UDP Comparison* (4:37, embeddable).
- `net-http-versions-quic`: **HTTP/2 Critical Limitation that led to HTTP/3 & QUIC**
  (Hussein Nasser, 9:51) — the head-of-line-blocking explanation the topic is built on.
  Alt: NGINX, *Everything You Need to Know About QUIC and HTTP3* (29:19). ByteByteGo's
  HTTP 1/2/3 video was avoided because `be-foundations` already uses it.
- `net-nat-private-ranges`: **NAT vs PAT, Static vs Dynamic** (Practical Networking, 7:06).
  Alts: Hussein Nasser's 21:27 NAT deep dive and anthonywritescode's *docker: connecting to
  localhost outside the container* (7:46), which is exactly the container failure taught here.
- `net-dns-resolution`: **What is DNS?** (NetworkChuck, 24:21, 2024) with chapters covering
  the hierarchy and the record types. Alts: PowerCert *DNS Records Explained* and Hussein
  Nasser *DNS is beautiful* (41:01).
- `net-dns-caching-dig`: **How to Use the dig Command in Linux** (Learn Linux TV, 14:16,
  Dec 2024) — current and tool-focused. Alt: Hussein Nasser, *We now know why the DNS
  failed* (Oct 2025), a real post-incident analysis.
- `net-tls-handshake`: **TLS Handshake — EVERYTHING that happens when you visit an HTTPS
  website** (Practical Networking, 27:58). Note it walks the TLS 1.2 RSA handshake in
  detail, so the TLS 1.3 alternate from the same channel (17:38) is listed alongside it and
  the summary/quiz state the 1.3 differences explicitly. Second alt: Dave Crabbe, *Digital
  Certificates: Chain of Trust*.
- `net-cert-lifecycle-acme`: **Let's Encrypt Explained: Free SSL** (That DevOps Guy, 15:03).
  Alt: Anton Putra on wildcard + DNS-01 auto-renewal.
- `net-sni-mtls`: **Server Name Indication (SNI) TLS Extension Explained** (Hussein Nasser,
  12:55). Alts: ByteMonk *What is mTLS?* (5:49) and Hussein Nasser's 50:16 mTLS show.
- `net-firewalls-drop-vs-reject`: **Stateful vs Stateless Firewalls** (LearnCantrill, 14:04)
  — the best available treatment of the return-traffic problem. Alt: *How To Use nmap To
  Scan For Open Ports* (Tony Teaches Tech) for the open/closed/filtered vocabulary.
  Searches for "iptables DROP vs REJECT" and "connection timeout vs refused" returned only
  tiny or off-topic videos; the drop-vs-refuse distinction is carried by the quiz instead.
- `net-debugging-toolkit`: **cURL Verbose Mode Explained (and how I use it to Troubleshoot
  my Backend)** (Hussein Nasser, 16:12) — exactly the topic's method. Alts: Mike Pennacchi
  on reading SYN/ACK failures in Wireshark, and HackerSploit's tcpdump course.

No search-URL fallbacks were needed; every topic has a real, verified, embeddable video.

## References

All URLs checked with `node scripts/research/check-urls.mjs`; every shipped URL returns
200 at its final URL.

Rejected during checking:

- **Every `www.cloudflare.com/learning/...` page returns 403 to the checker** (sixteen
  tried, including `/learning/dns/what-is-dns/` and `/learning/ssl/what-happens-in-a-tls-handshake/`).
  It looks like bot filtering rather than dead pages, but the rule is a 200, so the whole
  Cloudflare Learning Center was dropped. `blog.cloudflare.com` is fine — 200 **and**
  iframe-embeddable — so two Cloudflare blog posts are used instead.
- `https://hpbn.co/udp/` → 404; the real page is `https://hpbn.co/building-blocks-of-udp/`.
- `https://everything.curl.dev/usingcurl/verbose.html` → 404; use
  `https://everything.curl.dev/usingcurl/verbose/`.
- `https://man7.org/linux/man-pages/man1/dig.1.html` → 404; `dig` is documented in the BIND 9
  manual at `https://bind9.readthedocs.io/en/latest/manpages.html`.
- `https://linux.die.net/man/1/dig` → 403.
- `https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml`
  redirects to `.../service-names-port-numbers`; not used in the end.

Iframe-preview behaviour observed (for the app's fallback card):

- **Blocked:** `datatracker.ietf.org` (CSP `frame-ancestors 'self' ietf.org …`) — so every
  RFC reference in this camp will fall back to a link card. Also blocked: `hpbn.co`
  (`X-Frame-Options: SAMEORIGIN`), `developer.mozilla.org` (DENY), `docs.docker.com` (DENY),
  `letsencrypt.org` (`frame-ancestors 'none'`), `curl.se` and `everything.curl.dev`
  (`'none'`), `www.tcpdump.org` (SAMEORIGIN), `docs.aws.amazon.com` (SAMEORIGIN).
- **Frameable:** `blog.cloudflare.com`, `man7.org`, `docs.kernel.org`, `jvns.ca`,
  `implement-dns.wizardzines.com`, `tls13.xargs.org`, `badssl.com`, `nmap.org`,
  `wiki.nftables.org`, `bind9.readthedocs.io`, `www.haproxy.org`, `tailscale.com`,
  `certificate.transparency.dev`, `vincent.bernat.ch`.

## Facts verified

Protocol behaviour is stable, so the camp prefers mechanisms to version numbers. The
version- or configuration-dependent claims used in quiz answers were checked as follows:

- **`net.ipv4.tcp_fin_timeout` is the `FIN_WAIT_2` timeout, not `TIME_WAIT`** — confirmed
  against `https://docs.kernel.org/networking/ip-sysctl.html` ("the length of time an
  orphaned connection will remain in the FIN_WAIT_2 state"). Linux's `TIME_WAIT` is a fixed
  60 s with no sysctl, which is the point of question 2 in `net-tcp-connections`.
- **`tcp_keepalive_time` default is 2 hours** — same source.
- **`ip_local_port_range` default 32768–60999 (~28,200 ports)** — same source; the 470
  connections/second figure in the quiz is 28,200 ÷ 60 s and is stated as approximate.
- **`tcp_tw_recycle` was removed in Linux 4.12; `tcp_tw_reuse` survives** — the kernel sysctl
  document lists `tcp_tw_reuse` and `tcp_tw_reuse_delay` and no `tcp_tw_recycle`; background
  in Vincent Bernat's TIME-WAIT article, which is cited as a `webRef`.
- **Let's Encrypt: 90-day default certificates, opt-in six-day profile, renew at 60 days
  (three days for the short ones), no exceptions** — quoted from
  `https://letsencrypt.org/docs/faq/` on 2026-09-23.
- **Rate limits: 50 new certificates per registered domain per week; 300 new orders per
  account per 3 hours; ARI-coordinated renewals are exempt; staging exists for testing** —
  from `https://letsencrypt.org/docs/rate-limits/` on 2026-09-23. Only the 50-per-week
  figure is used in a quiz answer, with the staging environment as the takeaway.
- **Let's Encrypt no longer sends expiry-warning emails (2025)** — stated in the summary as
  a year, not a date, so it does not go stale on a specific day.
- **AWS NAT gateway idle timeout 350 s** — used as the concrete example in
  `net-nat-private-ranges`; the transferable lesson in the explanation is "keepalives below
  the shortest idle timeout on the path", which holds regardless of the number.
- **Docker: default bridge is `172.17.0.0/16`, and containers on the *default* bridge get no
  name resolution (user-defined networks do)** — `https://docs.docker.com/engine/network/`,
  cited as a `webRef`.
- **`ss` on a `LISTEN` socket: `Recv-Q` = connections waiting to be accepted, `Send-Q` =
  backlog ceiling.** The man7 `ss(8)` page does not document the columns, so the question is
  worded around the observable consequence (queue full → SYNs dropped → client timeout)
  rather than around a column definition.
- **Wildcard matching covers exactly one label** (`*.example.com` matches `api.example.com`
  but not `example.com` or `a.b.example.com`) and **name matching uses subjectAltName, not
  CN** — RFC 5280 / RFC 6125 behaviour, cited via RFC 5280.
- **TLS 1.3 encrypts the Certificate message but not the ClientHello, so SNI is cleartext
  until ECH** — RFC 8446 plus the cited Cloudflare ECH post.
- **ALPN negotiates the HTTP version inside the TLS handshake (RFC 7301); `h2c` is not
  implemented by major browsers; HTTP/3 is advertised via `Alt-Svc` or an HTTPS DNS record.**
- **Negative answers are cached under the SOA, per RFC 2308** — cited directly.

Nothing in this camp depends on the v3 fact sheet's version-sensitive entries (Caddy 2 /
nginx 1.29 belong to the reverse-proxy camp; IMDSv2 to the AWS camp). The only nod to them
is `169.254.169.254` appearing as the link-local metadata address in the CIDR topic.

## Validation

```
npm run content:check -- --module devops-networking-tls
  1 module(s), 15 topics, 150 quiz questions, 0 code challenges — OK (0 warnings)
npm run content:types
  clean
```
