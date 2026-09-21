# Web & Backend Foundations research notes (2026-09-21)

## Videos
- web-how-internet-works: How does the internet work? (Full Course) (freeCodeCamp.org, 1:42:42); the brief's verified video, used from the start because the whole course (switches, routers, WAN, ISPs) is this topic. `info` reports 1:42:42, not the brief's 1:27:01. Alternates: ByteByteGo DNS crash course (5:45) and Hussein Nasser on the TCP 3-way handshake (11:37), which cover the DNS/TCP parts the course doesn't.
- web-http-methods-status-headers: HTTP Crash Course & Exploration (Traversy Media, 38:30); focused on methods, status codes and headers, 1.28M views. HTTP semantics are stable, so its 2019 date doesn't matter. Alternates: ByteByteGo "HTTP 1 Vs HTTP 2 Vs HTTP 3!" (7:37) for multiplexing/QUIC, Hussein Nasser "HTTP Caching with E-Tags" (16:47) for revalidation.
- web-client-server: Web Application Architecture: Full Request-Response Lifecycle (ByteMonk, 7:33, 2024); the full request path through DNS, CDN, load balancer and app tier. Alternates: Hussein Nasser "Stateful vs Stateless Applications" (14:44), and the freeCodeCamp internet course chapter-split at "Connecting to the internet from a computer's perspective" (48:00 = 2880 s), which covers host addressing and gateways (the NAT background for "clients connect, servers listen").
- web-rest-rpc-graphql: REST vs RPC vs GraphQL API - How do I pick the right API paradigm? (Ambient Coder, 15:36); the only well-viewed video specifically comparing all three. Alternates: ByteByteGo "What Is GraphQL? REST vs. GraphQL" (5:14) and "What is RPC? gRPC Introduction." (6:09).
- No search-URL fallbacks.

## References
- MDN pages now live under `/Learn_web_development/...` and `/Web/HTTP/Guides/...`; used the current paths directly (all 200). MDN sends `X-Frame-Options: DENY`.
- Cloudflare Learning pages (DNS, TLS handshake) return 403 to the URL checker (bot protection), so they were replaced with Julia Evans' DNS article and RFC 8446.
- `web.dev/articles/performance-http2` redirects to `hpbn.co/http2/`; used the final URL.
- Frame-blocking (fallback card in app): MDN, roadmap.sh, hpbn.co, 12factor.net, Smashing Magazine. Embeddable: rfc-editor.org, graphql.org, grpc.io, jvns.ca, Fielding's dissertation page.

## Facts verified
- RFC 9110 text (rfc-editor.org): safe = GET, HEAD, OPTIONS, TRACE; idempotent = PUT, DELETE + safe methods (§9.2.1–9.2.2); 401 MUST send `WWW-Authenticate` (§15.5.2); 403 semantics and the 404-to-hide option (§15.5.4); 301/302 "MAY change POST to GET", 307/308 MUST NOT change the method; 301 and 308 heuristically cacheable (§15.4); 422 is now "Unprocessable Content"; If-None-Match uses weak comparison.
- RFC 9111: `no-cache` allows storing but requires revalidation; `no-store` forbids storing (§5.2.2.4–5.2.2.5).
- Handshake round trips (TCP 1 RTT, TLS 1.3 1 RTT, TLS 1.2 2 RTT, QUIC 1 RTT / 0-RTT resumption) per RFC 8446 and RFC 9000.
- Node `http` defaults used in the client-server quiz (keepAliveTimeout 5000 ms) checked on Node v24.11.1 and in the v24.x `http.md`.
- CORS preflight triggers (non-safelisted method, `Authorization`, JSON content type; form-urlencoded via `URLSearchParams` is safelisted) per the Fetch standard as summarized on MDN.
