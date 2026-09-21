import type { Module } from "@/types/curriculum";

export default {
  id: "be-foundations",
  trackId: "backend",
  name: "Web & Backend Foundations",
  description:
    "How a request really travels from a client to your server and back: DNS, TCP and TLS, HTTP semantics and caching, and the API styles built on top. Beginner-friendly, but every topic carries the gotchas that bite in production.",
  refs: [
    { label: "roadmap.sh: Backend Developer Roadmap", url: "https://roadmap.sh/backend", kind: "article" },
    {
      label: "MDN: How the web works",
      url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works",
      kind: "docs",
    },
    { label: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html", kind: "spec" },
  ],
  topics: [
    {
      id: "web-how-internet-works",
      moduleId: "be-foundations",
      trackId: "backend",
      title: "How the Internet Works: DNS, TCP/IP & Routing",
      summary:
        "The internet is a network of independently run networks that agree on two things: IP, which addresses hosts and delivers packets on a best-effort basis, and BGP, which lets each network announce the address ranges it can reach. Nothing in the core guarantees delivery, order or timing. Switches move frames inside a local network by MAC address, routers forward packets between networks hop by hop by IP address, and reliability is added at the endpoints by TCP (or by QUIC over UDP). Your home router also does NAT, which is why a laptop can open connections outward but can't be reached from outside by default: clients connect, servers listen.\n\nBefore any packet moves, DNS turns a name into an address. Your OS asks a recursive resolver, which walks root, then TLD, then the domain's authoritative servers, and caches every answer for its TTL. Caching is the point and the trap: after you change an A record with a one-day TTL, resolvers may keep sending users to the old IP for a day. Lower the TTL well before a migration, and remember that failed lookups are cached too.\n\nLatency is dominated by round trips, not bandwidth. A new HTTPS connection over TCP spends one round trip on the TCP handshake and another on a TLS 1.3 handshake (two for TLS 1.2) before the first request byte leaves; QUIC folds transport and TLS 1.3 into one round trip and can resume with 0-RTT. On a 100 ms mobile link that's roughly 300 ms versus 200 ms to the first response byte, which is why connection reuse, CDNs near users and HTTP/3 often beat a bigger pipe.",
      level: "beginner",
      estMinutes: 135,
      webRefs: [
        {
          label: "MDN: How does the Internet work?",
          url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work",
          kind: "docs",
        },
        { label: "High Performance Browser Networking: Building Blocks of TCP", url: "https://hpbn.co/building-blocks-of-tcp/", kind: "article" },
        { label: "Julia Evans: How updating DNS works", url: "https://jvns.ca/blog/how-updating-dns-works/", kind: "article" },
        { label: "RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3", url: "https://www.rfc-editor.org/rfc/rfc8446.html", kind: "spec" },
      ],
      video: {
        title: "How does the internet work? (Full Course)",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=zN8YNNHcaZc",
        videoId: "zN8YNNHcaZc",
        durationLabel: "1:42:42",
      },
      alternateVideos: [
        {
          title: "Everything You Need to Know About DNS: Crash Course System Design #4",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=27r4Bzuj5NQ",
          videoId: "27r4Bzuj5NQ",
          durationLabel: "5:45",
        },
        {
          title: "What is the TCP 3-Way Handshake and Why Backend Engineers should understand it",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=bW_BILl7n0Y",
          videoId: "bW_BILl7n0Y",
          durationLabel: "11:37",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "web-how-internet-works-q1",
          prompt:
            "You change your API's A record from `203.0.113.10` to `198.51.100.20`. The old record had a TTL of `86400`. Twelve hours later some users still reach the old server. Why?",
          options: [
            "Resolvers cached the old answer and may keep serving it until its 86,400-second TTL runs out",
            "DNS changes must be copied to every root server, which takes up to 48 hours",
            "Browsers ignore TTLs and always cache DNS answers for exactly 24 hours",
            "The new record only takes effect once its own TTL has elapsed",
          ],
          correctIndex: 0,
          explanation:
            "DNS has no push: \"propagation\" is just caches expiring on their own schedule. Lower the TTL (say to 300 s) a day before a migration. Root servers only delegate TLDs; they never hold your zone's records.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-how-internet-works-q2",
          prompt:
            "On a brand-new HTTPS connection over TCP with TLS 1.3, how many round trips pass before the client can send the first byte of its HTTP request? Ignore DNS.",
          options: ["2", "1", "3", "0"],
          correctIndex: 0,
          explanation:
            "One round trip for TCP's SYN / SYN-ACK (the ClientHello rides along right after), and one for the TLS 1.3 handshake. TLS 1.2 needs two handshake round trips, so three in total; QUIC combines transport and TLS into one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-how-internet-works-q3",
          prompt: "Which statements about TCP and UDP are true? (Select all that apply.)",
          options: [
            "TCP delivers an ordered byte stream and retransmits lost segments",
            "One lost TCP segment holds up delivery of all the data behind it on that connection",
            "UDP has no handshake, so a DNS query can complete in a single round trip",
            "UDP guarantees delivery but not ordering",
            "TCP preserves message boundaries, so each `write()` arrives as exactly one `read()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "TCP is an ordered byte stream with no message boundaries (framing is the application's job), and in-order delivery means a loss stalls everything behind it. UDP guarantees neither delivery nor order, which is why DNS clients retry and QUIC builds its own per-stream reliability.",
        },
        {
          id: "web-how-internet-works-q4",
          prompt: "What does a router do that a switch doesn't?",
          options: [
            "Forwards packets between different IP networks based on the destination IP address",
            "Forwards frames between devices on the same local network by MAC address",
            "Encrypts traffic between hosts on the same LAN",
            "Assigns domain names to the devices plugged into it",
          ],
          correctIndex: 0,
          explanation:
            "A switch works inside one network using MAC addresses; a router connects networks and picks the next hop from the destination IP. Neither encrypts traffic or hands out domain names.",
        },
        {
          id: "web-how-internet-works-q5",
          prompt:
            "Your laptop at home has the address `192.168.1.23` and opens a connection to a public API. Which source IP does the API server see?",
          options: [
            "Your router's public IP, because the router translates addresses (NAT)",
            "`192.168.1.23`, because IP headers are never modified in transit",
            "The IP address of your ISP's DNS resolver",
            "None: the server only sees the TCP port, not an IP",
          ],
          correctIndex: 0,
          explanation:
            "`192.168.0.0/16` is a private range that isn't routable on the internet, so the router rewrites the source address and port and remembers the mapping for replies. That's also why unsolicited inbound connections to the laptop fail without port forwarding.",
        },
        {
          id: "web-how-internet-works-q6",
          prompt:
            "A recursive resolver with an empty cache resolves `api.example.com`. In what order does it ask?",
          options: [
            "Root servers, then the `.com` TLD servers, then `example.com`'s authoritative servers",
            "`example.com`'s authoritative servers, then the `.com` TLD servers, then the root",
            "The domain registrar, then the hosting provider, then the root servers",
            "The CDN edge, then the origin server, then the `.com` TLD servers",
          ],
          correctIndex: 0,
          explanation:
            "Each level refers the resolver one step down the hierarchy. The resolver caches those referrals too, so the next lookup under `.com` skips the root entirely.",
        },
        {
          id: "web-how-internet-works-q7",
          prompt:
            "A page makes 20 small, sequential API calls. Moving the API from 10 ms away to 150 ms away slows it far more than raising bandwidth from 50 to 500 Mbps speeds it up. Why?",
          options: [
            "Small requests are latency-bound: each one pays round trips that extra bandwidth can't shorten",
            "Extra bandwidth only speeds up UDP traffic, not TCP",
            "TCP slow start is disabled on links faster than 100 Mbps",
            "Bandwidth affects uploads only, and API calls are downloads",
          ],
          correctIndex: 0,
          explanation:
            "Twenty sequential calls at 150 ms RTT cost at least 3 seconds regardless of bandwidth, because small payloads finish in a round trip or two. Cutting round trips (batching, parallel requests, connection reuse, servers closer to users) is what helps.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-how-internet-works-q8",
          prompt: "Which statement about IP (the Internet Protocol) is accurate?",
          options: [
            "It's best-effort: packets can be dropped, duplicated or reordered, and higher layers deal with it",
            "It guarantees delivery but not ordering",
            "It sets up a connection between the two hosts before sending any packets",
            "It routes all packets of a conversation along a fixed path chosen at the start",
          ],
          correctIndex: 0,
          explanation:
            "IP is connectionless and each packet is routed independently, so two packets can take different paths and arrive out of order. TCP or QUIC restore reliability and ordering at the endpoints.",
        },
      ],
    },
    {
      id: "web-http-methods-status-headers",
      moduleId: "be-foundations",
      trackId: "backend",
      title: "HTTP Methods, Status Codes & Headers",
      summary:
        "HTTP's semantics (methods, status codes, headers, caching) are defined once in RFC 9110 and RFC 9111, separately from the wire format, so HTTP/1.1, HTTP/2 and HTTP/3 all carry the same messages. Those semantics are a contract that proxies, CDNs, browsers and retry libraries act on. A **safe** method (GET, HEAD, OPTIONS, TRACE) requests no state change, so crawlers and prefetchers may call it freely. An **idempotent** method (the safe ones plus PUT and DELETE) has the same effect whether it's sent once or five times, so a client may retry it after a timeout. POST and PATCH are neither, which is why payment APIs accept an `Idempotency-Key` header.\n\nStatus codes carry intent too. 401 means \"not authenticated\" and must include `WWW-Authenticate`; 403 means \"I know who you are, and no\". 301 and 302 historically let clients turn a POST into a GET, 307 and 308 forbid that, and 301/308 are cacheable by default, so a mistaken permanent redirect can stick in browsers.\n\nCaching is where headers earn their keep. `Cache-Control: max-age=60` lets a cache reuse a response without asking the server; `no-cache` still stores it but forces revalidation; `no-store` forbids storing. Revalidation sends `If-None-Match` with the stored `ETag`, and a `304 Not Modified` costs a round trip but no body. Forget `Vary` and a CDN can serve one variant to everyone.\n\nOn the wire, HTTP/1.1 returns one response at a time per connection, so browsers open about six per origin. HTTP/2 multiplexes streams over one TCP connection, yet one lost packet still stalls every stream; HTTP/3 runs over QUIC with independent streams. And a cross-origin `fetch` with a JSON body, an `Authorization` header or a PUT triggers a CORS preflight.",
      level: "advanced",
      estMinutes: 85,
      isMilestone: true,
      webRefs: [
        { label: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html", kind: "spec" },
        { label: "MDN: HTTP caching", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching", kind: "docs" },
        { label: "MDN: Cross-Origin Resource Sharing (CORS)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS", kind: "docs" },
        { label: "High Performance Browser Networking: HTTP/2", url: "https://hpbn.co/http2/", kind: "article" },
      ],
      video: {
        title: "HTTP Crash Course & Exploration",
        channel: "Traversy Media",
        url: "https://www.youtube.com/watch?v=iYM2zFP3Zn0",
        videoId: "iYM2zFP3Zn0",
        durationLabel: "38:30",
      },
      alternateVideos: [
        {
          title: "HTTP 1 Vs HTTP 2 Vs HTTP 3!",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=UMwQjFzTQXw",
          videoId: "UMwQjFzTQXw",
          durationLabel: "7:37",
        },
        {
          title: "HTTP Caching with E-Tags -  (Explained by Example)",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=TgZnpp5wJWU",
          videoId: "TgZnpp5wJWU",
          durationLabel: "16:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "web-http-methods-status-headers-q1",
          prompt: "Which methods does RFC 9110 define as idempotent? (Select all that apply.)",
          options: ["`GET`", "`PUT`", "`DELETE`", "`POST`", "`PATCH`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Safe methods plus PUT and DELETE are idempotent. POST isn't, and PATCH isn't guaranteed to be: a patch such as \"append this item\" or \"increment by 1\" changes the result every time it's applied.",
        },
        {
          id: "web-http-methods-status-headers-q2",
          prompt:
            "`DELETE /orders/42` succeeds with `204`, but the response is lost and the client retries. The retry gets `404`. Is DELETE still idempotent here?",
          options: [
            "Yes: idempotency is about the effect on server state, not about getting identical responses",
            "No: an idempotent method must return the same status code every time",
            "No: DELETE is only idempotent when the server answers `200` both times",
            "Only if the server cached the first response and replays it",
          ],
          correctIndex: 0,
          explanation:
            "After one call or two, order 42 is gone, so the intended effect is the same. The status code can legitimately differ; that's why retrying an idempotent request after a timeout is safe.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-http-methods-status-headers-q3",
          prompt:
            "A logged-in user with a valid session calls an admin-only endpoint they aren't allowed to use. Which status fits RFC 9110 best?",
          options: ["`403 Forbidden`", "`401 Unauthorized`", "`400 Bad Request`", "`405 Method Not Allowed`"],
          correctIndex: 0,
          explanation:
            "401 means the request lacks valid credentials (and must carry a `WWW-Authenticate` challenge); logging in again won't help here. 403 says the server understood who's asking and refuses. Responding 404 to hide the resource is also allowed, but not required.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-http-methods-status-headers-q4",
          prompt:
            "You permanently moved `POST /api/v1/upload` to `/api/v2/upload`, and existing clients must keep sending POST with the body intact. Which redirect do you return?",
          options: ["`308 Permanent Redirect`", "`301 Moved Permanently`", "`302 Found`", "`303 See Other`"],
          correctIndex: 0,
          explanation:
            "For historical reasons clients may turn a POST into a GET after 301 or 302. 308 is the permanent redirect that forbids changing the method (307 is its temporary sibling), while 303 explicitly tells the client to follow up with a GET.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-http-methods-status-headers-q5",
          prompt: "What does `Cache-Control: no-cache` on a response mean?",
          options: [
            "Caches may store it, but must revalidate with the origin before each reuse",
            "Caches must not store any part of it",
            "Browsers may cache it for the session, but shared caches (CDNs) may not",
            "It's reused without any request until the `ETag` changes",
          ],
          correctIndex: 0,
          explanation:
            "`no-store` is the directive that forbids storing. `no-cache` allows storing but requires a revalidation first, which is often a cheap `304`. `private` is the one that keeps a response out of shared caches.",
        },
        {
          id: "web-http-methods-status-headers-q6",
          prompt:
            "A browser holds a stale cached copy of `/app.js` that came with `ETag: \"v7\"`. What do the revalidation request and the ideal \"unchanged\" response look like?",
          options: [
            "Request sends `If-None-Match: \"v7\"`; server replies `304 Not Modified` with no body",
            "Request sends `If-Match: \"v7\"`; server replies `200 OK` with the full body",
            "Request sends `ETag: \"v7\"`; server replies `204 No Content`",
            "Request sends `If-Modified-Since: \"v7\"`; server replies `412 Precondition Failed`",
          ],
          correctIndex: 0,
          explanation:
            "`If-None-Match` makes a conditional GET: \"send it only if it no longer matches\". `If-Match` is for optimistic concurrency on writes and yields `412` on a mismatch; `If-Modified-Since` takes a date, not an entity tag.",
        },
        {
          id: "web-http-methods-status-headers-q7",
          prompt: "What problem does HTTP/2 multiplexing solve, and what does it leave unsolved?",
          options: [
            "It removes HTTP/1.1's one-response-at-a-time limit per connection, but one lost TCP packet still stalls every stream on the connection",
            "It removes all head-of-line blocking by opening a separate TCP connection for each stream",
            "It eliminates packet loss by switching the transport to UDP",
            "It parallelizes requests on one connection only when they go to different origins",
          ],
          correctIndex: 0,
          explanation:
            "HTTP/2 interleaves many streams over one TCP connection, but TCP must deliver bytes in order, so a single loss blocks all of them. HTTP/3 moves to QUIC over UDP, where loss recovery is per stream.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-http-methods-status-headers-q8",
          prompt:
            "Which cross-origin `fetch` calls from a browser trigger a CORS preflight `OPTIONS` request? (Select all that apply.)",
          options: [
            "`fetch(url, { method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body })`",
            "`fetch(url, { headers: { Authorization: \"Bearer abc\" } })`",
            "`fetch(url, { method: \"PUT\", body })`",
            "`fetch(url)`, a plain GET with no custom headers",
            "`fetch(url, { method: \"POST\", body: new URLSearchParams({ a: \"1\" }) })`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Only GET, HEAD and POST with safelisted headers and a form-urlencoded, multipart or text/plain body skip the preflight. A JSON content type, an `Authorization` header or a PUT all need one. Note that the simple POST still reaches your server: CORS controls who can read responses, it isn't CSRF protection.",
        },
        {
          id: "web-http-methods-status-headers-q9",
          prompt:
            "A CDN caches `GET /products`. The API returns JSON or XML depending on the request's `Accept` header, and some users asking for JSON get XML. What's missing?",
          options: [
            "`Vary: Accept` on the response, so caches key stored responses by that request header",
            "`Cache-Control: private` on the request",
            "A different `ETag` for each representation",
            "`Content-Type: application/json` on the request",
          ],
          correctIndex: 0,
          explanation:
            "`Vary` tells caches which request headers select the representation; without it, whichever variant was stored first is served to everyone. Distinct ETags help revalidation but don't split the cache key.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-http-methods-status-headers-q10",
          prompt: "Why do new HTTP/3 connections usually start faster than HTTP/2 over TLS 1.3?",
          options: [
            "QUIC combines the transport and TLS 1.3 handshakes into one round trip, with 0-RTT on resumption",
            "HTTP/3 sends the first request unencrypted to save time",
            "Routers forward UDP packets faster than TCP packets",
            "HTTP/3 compresses headers and HTTP/2 doesn't",
          ],
          correctIndex: 0,
          explanation:
            "TCP plus TLS 1.3 costs two round trips before the request; QUIC needs one. QUIC is always encrypted, and both versions compress headers (HPACK and QPACK). 0-RTT data can be replayed, so it should carry only idempotent requests.",
        },
        {
          id: "web-http-methods-status-headers-q11",
          prompt: "A client exceeds your API's rate limit. Which response helps well-behaved clients most?",
          options: [
            "`429 Too Many Requests` with a `Retry-After` header",
            "`503 Service Unavailable` with no extra headers",
            "`403 Forbidden` until the rate-limit window resets",
            "`400 Bad Request` with an error message in the body",
          ],
          correctIndex: 0,
          explanation:
            "429 says this client is sending too much, and `Retry-After` tells retry logic when to come back. 503 signals that the server is struggling for everyone, and 403 or 400 misdescribe the problem.",
        },
      ],
    },
    {
      id: "web-client-server",
      moduleId: "be-foundations",
      trackId: "backend",
      title: "The Client-Server Model",
      summary:
        "In the client-server model a client initiates requests and a server, reachable at a well-known address, answers them. The asymmetry is deliberate: the server owns the authoritative data, enforces the rules and scales on its own terms, while clients (browsers, mobile apps, other services) are numerous, intermittently connected and untrusted. That last word is the first gotcha. Anything a client sends, including hidden form fields, prices, a `role` in the request body or a button your UI \"disabled\", is attacker-controlled. Validation in the browser is UX; validation on the server is security.\n\nHTTP makes each request self-contained: the protocol remembers nothing between requests, so applications add state with cookies or tokens plus a store. Keeping the application tier stateless (sessions in Redis or the database, files in object storage, counters in a shared store) is what lets you run N identical instances behind a load balancer, restart any of them and autoscale. Sessions in process memory or uploads on one instance's disk break the moment a second instance or a deploy arrives. Long-lived connections like WebSockets are fine, but they pin a client to one instance, which complicates balancing and deploys.\n\nReal deployments put layers between client and app: DNS, a CDN serving cached responses near users, a load balancer or reverse proxy that terminates TLS, then app servers and databases. Each hop can cache, rewrite headers or time out. The client's IP arrives in `X-Forwarded-For`, and only the entries your own proxies appended are trustworthy. A backend keep-alive timeout shorter than the load balancer's idle timeout causes sporadic 502s. Peer-to-peer designs (WebRTC, BitTorrent) let clients talk directly, but NAT means they still need servers for discovery and relaying.",
      level: "beginner",
      estMinutes: 40,
      webRefs: [
        {
          label: "MDN: Client-Server overview",
          url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview",
          kind: "docs",
        },
        { label: "MDN: An overview of HTTP", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview", kind: "docs" },
        { label: "The Twelve-Factor App: Processes", url: "https://12factor.net/processes", kind: "article" },
      ],
      video: {
        title: "Web Application Architecture: Full Request-Response Lifecycle",
        channel: "ByteMonk",
        url: "https://www.youtube.com/watch?v=xv0Be4QfkH0",
        videoId: "xv0Be4QfkH0",
        durationLabel: "7:33",
      },
      alternateVideos: [
        {
          title: "Stateful vs Stateless Applications (Explained by Example)",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=nFPzI_Qg3FU",
          videoId: "nFPzI_Qg3FU",
          durationLabel: "14:44",
        },
        {
          title: "How does the internet work? (Full Course)",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=zN8YNNHcaZc",
          videoId: "zN8YNNHcaZc",
          durationLabel: "1:42:42",
          startSeconds: 2880,
          chapterLabel: "Connecting to the internet from a computer's perspective",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "web-client-server-q1",
          prompt:
            "A checkout UI hides the \"Apply staff discount\" button for non-staff users, and the API applies the discount when the request body contains `\"role\": \"staff\"`. What's wrong?",
          options: [
            "The client is untrusted: the server must derive the role from its own session or a verified token, never from the request body",
            "Nothing, as long as the button is also removed from the DOM rather than hidden with CSS",
            "The role should be kept in `localStorage` so it can't be edited",
            "The server should validate the `role` field against an allow-list of strings",
          ],
          correctIndex: 0,
          explanation:
            "Anyone can send the request with curl and any body they like. Hiding UI is UX; authorization has to come from state the server controls. Validating the string's format doesn't make it trustworthy.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-client-server-q2",
          prompt:
            "Your Node API runs as one instance and you're moving to four identical instances behind a load balancer. Which existing designs break? (Select all that apply.)",
          options: [
            "Login sessions stored in an in-memory `Map` inside the process",
            "Uploaded avatars written to the instance's local `./uploads` folder",
            "A rate limiter that counts requests per IP in process memory",
            "Sessions stored in Redis and looked up by a cookie",
            "JWTs verified on every request with a shared public key",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything kept in one process's memory or on its disk is invisible to the other three, so users get logged out, images 404 and the rate limit is effectively four times looser. Externalized state and self-verifying tokens work on every instance.",
        },
        {
          id: "web-client-server-q3",
          prompt: "What does it mean that HTTP is stateless?",
          options: [
            "Each request carries everything needed to process it; the protocol itself keeps no memory between requests",
            "Servers aren't allowed to store data between requests",
            "The TCP connection is closed after every request",
            "Cookies aren't part of HTTP and need a separate protocol",
          ],
          correctIndex: 0,
          explanation:
            "Statelessness is a property of the protocol: applications add state with cookies or tokens and a store. Connections can stay open (keep-alive) without the protocol remembering anything about previous requests.",
        },
        {
          id: "web-client-server-q4",
          prompt:
            "Your API runs behind one load balancer that appends the client address to `X-Forwarded-For`. Which value should your rate limiter use as the client IP?",
          options: [
            "The right-most `X-Forwarded-For` entry, which your load balancer added",
            "The left-most `X-Forwarded-For` entry, because it's the original client",
            "`req.socket.remoteAddress`, because it's the TCP peer",
            "A `X-Client-IP` header set by your frontend code",
          ],
          correctIndex: 0,
          explanation:
            "Clients can send any `X-Forwarded-For` they like; proxies append to it. With one trusted proxy, only the last entry was written by infrastructure you control. The socket address is the load balancer itself, and anything set by frontend code is client input.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-client-server-q5",
          prompt: "Where does a CDN sit, and what does it do for your application?",
          options: [
            "Between clients and your origin, serving cacheable responses from locations near users and absorbing traffic",
            "Between your app servers and the database, caching SQL results",
            "Inside the browser, replacing its HTTP cache",
            "In front of DNS, translating domain names into IP addresses",
          ],
          correctIndex: 0,
          explanation:
            "A CDN is a globally distributed layer of reverse proxies. It cuts latency by answering from the edge and protects the origin by absorbing load; database caching and name resolution are separate concerns.",
        },
        {
          id: "web-client-server-q6",
          prompt:
            "Users see random `502` errors from your cloud load balancer, mostly after quiet periods. The Node server runs with default settings (5-second keep-alive timeout) and the load balancer's idle timeout is 60 seconds. What's the likely cause?",
          options: [
            "Node closes idle keep-alive sockets before the load balancer does, so the balancer sometimes sends a request on a socket that's being closed",
            "The load balancer's health checks run too often and overload the server",
            "HTTP/2 isn't enabled between the load balancer and Node",
            "The server's request timeout is shorter than the average request",
          ],
          correctIndex: 0,
          explanation:
            "The side that closes an idle connection first should be the load balancer. Set the backend keep-alive timeout above the balancer's idle timeout (for example 65 s) so the balancer never reuses a socket the server has just closed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-client-server-q7",
          prompt: "Which is a genuine advantage of peer-to-peer over client-server?",
          options: [
            "Peers can exchange data directly, cutting server bandwidth and often latency for media or large files",
            "No servers are needed at all, even for discovery or getting through NAT",
            "Data automatically stays consistent across all peers",
            "Authorization rules are easier to enforce without a central server",
          ],
          correctIndex: 0,
          explanation:
            "Direct transfer is the win. WebRTC still needs signalling servers and STUN/TURN relays for NAT traversal, and without a central authority consistency and access control get harder, not easier.",
        },
        {
          id: "web-client-server-q8",
          prompt: "A mobile app and a web SPA call the same API. Which responsibility belongs on the server no matter which client calls?",
          options: [
            "Authorization checks and business-rule validation",
            "Formatting form fields and showing inline error messages",
            "Deciding which screen to show after login",
            "Caching images for offline use",
          ],
          correctIndex: 0,
          explanation:
            "Clients can be modified or bypassed, so the rules that protect data must run on the server. The other three are presentation concerns each client handles in its own way.",
        },
      ],
    },
    {
      id: "web-rest-rpc-graphql",
      moduleId: "be-foundations",
      trackId: "backend",
      title: "REST vs RPC vs GraphQL at a Glance",
      summary:
        "These are three answers to \"how should clients call my backend?\", and the useful comparison is what each one optimizes. REST models the API as resources addressed by URLs and manipulated with HTTP's uniform methods, so it inherits HTTP's infrastructure for free: GET responses can be cached by browsers and CDNs, idempotent methods can be retried, and status codes mean the same thing to every proxy. The cost is chattiness and shape mismatch: one screen may need several round trips (under-fetching), and fixed endpoints return fields nobody asked for (over-fetching).\n\nRPC models the API as functions, such as `createInvoice(customerId, lines)`, which fits actions that aren't CRUD. gRPC adds a Protobuf contract, generated clients, HTTP/2 streaming and compact binary payloads, which is why it's popular between internal services. Browsers can't speak native gRPC (they need gRPC-Web or a similar proxy), payloads aren't human-readable, and calls are POSTs, so HTTP caching doesn't apply. tRPC is RPC for TypeScript monorepos, where the contract is the server's types.\n\nGraphQL exposes a typed schema and lets each client ask for exactly the fields it needs in one request, which suits many clients with different data needs. The complexity moves to the server: naive resolvers cause N+1 database queries (hence DataLoader), one deeply nested query can be very expensive (so you need depth or cost limits, or persisted queries), and queries usually go over POST to a single endpoint, which defeats URL-based caching. A field error typically still returns HTTP 200 with an `errors` array, so monitoring that only counts 5xx misses failures. Many real systems mix styles: REST or GraphQL at the edge, gRPC between services.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "GraphQL: Learn", url: "https://graphql.org/learn/", kind: "docs" },
        { label: "gRPC: Introduction to gRPC", url: "https://grpc.io/docs/what-is-grpc/introduction/", kind: "docs" },
        {
          label: "Roy Fielding: Representational State Transfer (dissertation, chapter 5)",
          url: "https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm",
          kind: "article",
        },
        {
          label: "Smashing Magazine: Understanding RPC vs REST for HTTP APIs",
          url: "https://www.smashingmagazine.com/2016/09/understanding-rest-and-rpc-for-http-apis/",
          kind: "article",
        },
      ],
      video: {
        title: "REST vs RPC vs GraphQL API - How do I pick the right API paradigm?",
        channel: "Ambient Coder",
        url: "https://www.youtube.com/watch?v=hkXzsB8D_mo",
        videoId: "hkXzsB8D_mo",
        durationLabel: "15:36",
      },
      alternateVideos: [
        {
          title: "What Is GraphQL? REST vs. GraphQL",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=yWzKJPw_VzM",
          videoId: "yWzKJPw_VzM",
          durationLabel: "5:14",
        },
        {
          title: "What is RPC? gRPC Introduction.",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=gnchfOojMk4",
          videoId: "gnchfOojMk4",
          durationLabel: "6:09",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "web-rest-rpc-graphql-q1",
          prompt:
            "A public product catalogue is read millions of times a day by anonymous users and changes hourly. Which API style makes CDN caching simplest?",
          options: [
            "REST, with `GET /products?category=shoes` and `Cache-Control` headers",
            "GraphQL queries sent with POST to `/graphql`",
            "gRPC unary calls with Protobuf payloads",
            "JSON-RPC calls over a WebSocket",
          ],
          correctIndex: 0,
          explanation:
            "HTTP caches key on method and URL, so URL-addressable GETs are what CDNs cache natively. POST bodies, WebSocket frames and gRPC calls bypass that; GraphQL can be cached with GET and persisted queries, but it takes extra work.",
        },
        {
          id: "web-rest-rpc-graphql-q2",
          prompt:
            "A mobile screen shows a user, their last 5 orders and each order's shipping status. With resource-oriented REST it takes 7 requests. What's this called, and what addresses it most directly?",
          options: [
            "Under-fetching; a GraphQL query or a purpose-built endpoint can return the nested data in one round trip",
            "Over-fetching; return fewer fields from each endpoint",
            "Cache stampede; add `Cache-Control` headers",
            "Head-of-line blocking; switch every endpoint to POST",
          ],
          correctIndex: 0,
          explanation:
            "Each endpoint returns too little for the screen, so the client pays multiple round trips. GraphQL's nested selection or a backend-for-frontend endpoint fixes that; trimming fields solves the opposite problem.",
        },
        {
          id: "web-rest-rpc-graphql-q3",
          prompt:
            "A GraphQL server resolves `posts { author { name } }` for 100 posts, and the `author` resolver queries the users table once per post. How many database queries run, and what's the usual fix?",
          options: [
            "101 (one for the posts, one per author); batch the author lookups with a DataLoader",
            "2; GraphQL servers batch resolver queries automatically",
            "1; the database planner merges the resolver queries into a join",
            "100; cache the posts query",
          ],
          correctIndex: 0,
          explanation:
            "Resolvers run per field per object, so the naive version is the classic N+1. A DataLoader collects the author ids requested in one tick and fetches them with a single `WHERE id IN (...)` query.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-rest-rpc-graphql-q4",
          prompt: "Which are real reasons teams choose gRPC for service-to-service calls? (Select all that apply.)",
          options: [
            "Protobuf schemas generate typed clients and servers in many languages",
            "Compact binary payloads over HTTP/2, with built-in streaming",
            "Per-call deadlines are part of the protocol",
            "Browsers can call gRPC services natively without a proxy",
            "Responses are cacheable by CDNs out of the box",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Contracts, code generation, efficient framing, streaming and deadlines are gRPC's strengths inside a backend. Browsers need gRPC-Web or a similar bridge, and POST-based binary calls aren't cached by CDNs.",
        },
        {
          id: "web-rest-rpc-graphql-q5",
          prompt:
            "Every call in your JSON-RPC API is a POST to `/rpc`. A client times out on `chargeCard` and wants to retry. What's the risk, and the usual mitigation?",
          options: [
            "The first charge may have succeeded, so a retry could charge twice; send an idempotency key the server uses to deduplicate",
            "There's no risk because POST is idempotent",
            "HTTP servers reject duplicate POST bodies automatically",
            "Switch the call to GET so retries are safe",
          ],
          correctIndex: 0,
          explanation:
            "A timeout doesn't tell you whether the server acted. POST isn't idempotent, so the server must recognize the retry, typically by storing the result under a client-supplied key. Making a side-effecting call a GET breaks HTTP's safety contract.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-rest-rpc-graphql-q6",
          prompt:
            "A GraphQL query succeeds except that one nullable field's resolver throws. What does a typical GraphQL-over-HTTP response contain?",
          options: [
            "HTTP 200 with `data` (that field set to `null`) plus an `errors` array describing the failure",
            "HTTP 500 with no `data` at all",
            "Only an `errors` array, because partial data is never returned",
            "The field silently left out, with no error reported",
          ],
          correctIndex: 0,
          explanation:
            "GraphQL returns partial results: failed nullable fields become `null` and the error goes in `errors`. Dashboards that only count 5xx responses miss these failures, so monitor the `errors` array too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "web-rest-rpc-graphql-q7",
          prompt:
            "What protects a public GraphQL endpoint from a single deeply nested query that fans out to millions of records?",
          options: [
            "Query depth or cost limits, or accepting only persisted (pre-registered) queries",
            "Serving the endpoint over HTTP/2",
            "Returning 404 for fields the client doesn't know",
            "Keeping schema introspection enabled",
          ],
          correctIndex: 0,
          explanation:
            "The client chooses the query shape, so the server must bound it: analyse depth or estimated cost before executing, or allow only queries your own apps registered. The transport and introspection don't limit cost.",
        },
        {
          id: "web-rest-rpc-graphql-q8",
          prompt: "Which constraint from Fielding's definition of REST do most self-described \"REST APIs\" skip?",
          options: [
            "Hypermedia as the engine of application state: clients follow links in responses instead of hard-coding URLs",
            "Using JSON as the payload format",
            "Using plural nouns in URL paths",
            "Putting the API version in the URL",
          ],
          correctIndex: 0,
          explanation:
            "REST is an architectural style defined by constraints (client-server, stateless, cacheable, uniform interface including hypermedia, layered system). JSON, noun-based URLs and versioning schemes are conventions, not part of the definition.",
        },
        {
          id: "web-rest-rpc-graphql-q9",
          prompt: "When is tRPC a better fit than REST or GraphQL?",
          options: [
            "A TypeScript frontend and backend owned by one team, where end-to-end types matter more than a language-neutral public contract",
            "A public API consumed by partners in many languages",
            "Microservices written in Go and Java",
            "An API whose responses must be cached by third-party CDNs by URL",
          ],
          correctIndex: 0,
          explanation:
            "tRPC's contract is the server's TypeScript types, which is excellent inside a TypeScript monorepo and useless to a Go or Java client. Public, multi-language APIs need an explicit contract such as OpenAPI, GraphQL SDL or Protobuf.",
        },
      ],
    },
  ],
} satisfies Module;
