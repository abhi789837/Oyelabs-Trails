import type { Module } from "@/types/curriculum";

export default {
  id: "devops-reverse-proxies",
  trackId: "devops",
  name: "Reverse Proxies",
  description:
    "The thing sitting in front of your application: what it does for you, and the handful of rules — location matching, the proxy_pass trailing slash, forwarded headers, buffering and timeouts — that decide whether it helps or silently breaks things. nginx and Caddy side by side, written for whoever inherits a config they did not author.",
  refs: [
    { label: "nginx: Documentation index", url: "https://nginx.org/en/docs/", kind: "docs" },
    { label: "Caddy: Documentation", url: "https://caddyserver.com/docs/", kind: "docs" },
    { label: "nginx Admin's Handbook", url: "https://github.com/trimstray/nginx-admins-handbook", kind: "repo" },
  ],
  topics: [
    {
      id: "proxy-what-and-why",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "What a Reverse Proxy Is For",
      summary:
        "A forward proxy acts for the client and hides it from the server; a reverse proxy acts for the server and hides the origin from the client. Same machinery, opposite loyalty — and the direction of loyalty is what decides where each one lives and who configures it.\n\nYou put one in front of an application because a specific set of jobs does not belong inside your process: terminating TLS and renewing certificates, serving static files from disk without waking the runtime, buffering requests and responses so a slow client on hotel wifi does not occupy an application worker for thirty seconds, fanning one hostname out across several upstreams or several apps, applying compression and cache headers uniformly, absorbing abusive traffic before it costs you a database connection, and giving you one log line per request that is true regardless of which service handled it. Node, Python and PHP application servers can technically do all of this. They do it worse, in a language optimised for your business logic rather than for holding ten thousand idle sockets.\n\nThe cost is a second moving part and a second place a request can die. `502` now means \"the proxy could not get a usable response from your app\", which is a different investigation from a `500`. Your application also stops seeing the client: every request appears to come from `127.0.0.1` until forwarded headers are configured, which quietly breaks IP-based rate limiting and audit logs.\n\nThe honest counter-case: if you deploy to a platform or behind a cloud load balancer, something already *is* your reverse proxy. Running a second one is only worth it for behaviour the managed layer will not give you.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "nginx: Beginner's Guide", url: "https://nginx.org/en/docs/beginners_guide.html", kind: "docs" },
        { label: "Caddy: Reverse proxy quick-start", url: "https://caddyserver.com/docs/quick-starts/reverse-proxy", kind: "docs" },
        {
          label: "NGINX Blog: Optimizing Web Servers for High Throughput and Low Latency",
          url: "https://blog.nginx.org/blog/optimizing-web-servers-for-high-throughput-and-low-latency",
          kind: "article",
        },
      ],
      video: {
        title: "Proxy vs Reverse Proxy vs Load Balancer | Simply Explained",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=xo5V9g9joFs",
        videoId: "xo5V9g9joFs",
        durationLabel: "13:18",
      },
      alternateVideos: [
        {
          title: "Proxy vs Reverse Proxy (Real-world Examples)",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=4NB0NDtOwIQ",
          videoId: "4NB0NDtOwIQ",
          durationLabel: "5:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-what-and-why-q1",
          prompt: "What actually distinguishes a forward proxy from a reverse proxy?",
          options: [
            "Which side it represents: a forward proxy is deployed for clients, a reverse proxy for servers",
            "The direction of the TCP connection — forward proxies dial out, reverse proxies only accept",
            "Whether it can terminate TLS; only reverse proxies can",
            "The OSI layer: forward proxies are layer 4, reverse proxies layer 7",
          ],
          correctIndex: 0,
          explanation:
            "Both accept a connection and open another one; the difference is whose agent it is. A forward proxy is configured by (or imposed on) clients and hides them from the origin; a reverse proxy is deployed by the service owner and hides the origin from clients. Either can terminate TLS and either can run at layer 4 or 7.",
        },
        {
          id: "proxy-what-and-why-q2",
          prompt: "Which of these are genuinely better handled at a reverse proxy than inside a Node or Python application process? (Select all that apply.)",
          options: [
            "Terminating TLS and renewing certificates",
            "Buffering a slow client's upload so the app isn't tied up receiving it",
            "Serving hashed static build assets from disk",
            "Deciding whether the logged-in user may read a particular record",
            "Validating the shape of a JSON request body against your domain rules",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "TLS, buffering and static files are generic I/O work that an event-driven C or Go server does better and cheaper. Authorisation on a specific record and domain-level validation need your data and your business rules, so pushing them into proxy config produces a second, divergent source of truth.",
        },
        {
          id: "proxy-what-and-why-q3",
          prompt:
            "An app container is started with `HOST=0.0.0.0 PORT=8787` and published as `ports: [\"8787:8787\"]`, with nginx in front on 443. What is the practical problem?",
          options: [
            "The app is reachable directly on port 8787 from the internet, bypassing every rule the proxy enforces",
            "nginx cannot proxy to a container that binds `0.0.0.0`",
            "TLS termination silently fails because the upstream is plain HTTP",
            "The app will refuse connections from the proxy unless `trust proxy` is enabled",
          ],
          correctIndex: 0,
          explanation:
            "Publishing to all interfaces means the origin answers directly, so rate limits, auth gateways and security headers applied at the proxy are optional for anyone who guesses the port. Binding the published port to loopback (`127.0.0.1:8787:8787`) makes the proxy the only way in. Proxying to plain HTTP on loopback is normal and fine.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-what-and-why-q4",
          prompt:
            "Your API is served by 8 application workers. Without a buffering proxy, a client uploading 5 MB over a 30 kB/s mobile link occupies a worker for the whole upload. What does response and request buffering at the proxy change?",
          options: [
            "The proxy absorbs the slow transfer and hands the app a complete request quickly, freeing workers",
            "The proxy compresses the upload so it finishes sooner",
            "The proxy retries the upload on a second worker if the first is busy",
            "Nothing — the worker is still held, the proxy just adds a hop",
          ],
          correctIndex: 0,
          explanation:
            "Buffering decouples client speed from application speed: the proxy talks slowly to the client and quickly to the upstream, so expensive application concurrency is spent on work rather than on waiting for packets. Compression does not apply to an inbound body the proxy must forward, and nothing is retried.",
        },
        {
          id: "proxy-what-and-why-q5",
          prompt:
            "After moving an app behind nginx, every entry in the application's audit log shows the client IP as `127.0.0.1`. Why?",
          options: [
            "The TCP connection the app sees really does come from the proxy, and nothing carries the original IP by default",
            "nginx masks client IPs for privacy unless `real_ip_header` is disabled",
            "The app is reading `X-Forwarded-For` but nginx does not send it over loopback",
            "Docker's NAT rewrites the source address and this cannot be recovered",
          ],
          correctIndex: 0,
          explanation:
            "The proxy makes a fresh connection to the upstream, so the peer address is the proxy. The original address only survives if the proxy adds a header (`X-Forwarded-For` or `Forwarded`) and the app is configured to trust it — neither of which happens automatically in nginx.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-what-and-why-q6",
          prompt: "A browser shows nginx's `502 Bad Gateway` page. What has most likely happened?",
          options: [
            "nginx could not get a usable response from the upstream — refused connection, crash mid-response, or an unparseable reply",
            "The application returned HTTP 502 and nginx passed it through",
            "The client's request was malformed and nginx rejected it",
            "TLS negotiation with the client failed",
          ],
          correctIndex: 0,
          explanation:
            "502 is generated *by the proxy* about its upstream: connection refused, the process died mid-response, or it spoke something nginx could not parse. An upstream that answers with its own 500 is passed through as a 500, and a client-side TLS failure never produces an HTTP status at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-what-and-why-q7",
          prompt:
            "A team serves the SPA from `app.example.com` and the API from `api.example.com`, and is fighting CORS preflights. How does a reverse proxy help?",
          options: [
            "Serve both from one origin — static files at `/` and the API at `/api` — so the requests are same-origin",
            "Add `Access-Control-Allow-Origin: *` at the proxy, which removes the preflight",
            "Terminate TLS for both hosts on one certificate, which makes them the same origin",
            "It doesn't — CORS is enforced by the browser and a proxy cannot affect it",
          ],
          correctIndex: 0,
          explanation:
            "An origin is scheme + host + port, so routing both behind one hostname makes the browser treat API calls as same-origin and skip CORS entirely. A wildcard `Access-Control-Allow-Origin` still requires preflights for non-simple requests and cannot be combined with credentials; a shared certificate does not merge origins.",
        },
        {
          id: "proxy-what-and-why-q8",
          prompt: "Which claims about adding a reverse proxy are accurate? (Select all that apply.)",
          options: [
            "It adds a hop, so the minimum latency of a request goes up slightly",
            "It can reduce tail latency by absorbing slow clients and reusing upstream keepalive connections",
            "It gives you one consistent access log and one place to apply edge policy",
            "It removes the need for the application to handle errors, since the proxy returns its own error pages",
            "It makes the application faster by executing your handlers in C",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "An extra hop costs a little latency and buys a lot of tail-latency and operability. It does not execute your code, and the proxy's error page only covers cases where the upstream failed to answer — your handlers still own their own failures.",
        },
        {
          id: "proxy-what-and-why-q9",
          prompt:
            "You deploy to a managed platform whose load balancer already terminates TLS, routes by hostname and serves your static assets from a CDN. When is running your own nginx or Caddy behind it still worth it?",
          options: [
            "When you need behaviour the managed layer will not give you — custom routing, header rewriting, per-path rate limits or a shared edge across several services",
            "Always — a managed load balancer is not a real reverse proxy",
            "Never — two proxies in series is always a misconfiguration",
            "Only when you need HTTP/2, which managed load balancers do not support",
          ],
          correctIndex: 0,
          explanation:
            "Two proxies in series is normal and common (CDN in front of a load balancer in front of an ingress). The question is whether the second one earns its keep with behaviour the first cannot express; if it does not, it is just another thing to page you at 3 a.m.",
        },
      ],
    },
    {
      id: "proxy-nginx-config-structure",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "nginx Configuration Structure: Contexts and Inheritance",
      summary:
        "An nginx config is a tree of *contexts*. The outermost (main) context holds process-level settings like `worker_processes`; `events` holds connection-handling settings; `http` holds everything web; inside `http` sit `upstream` groups and `server` blocks; inside a `server` sit `location` blocks, which may nest. A directive is only legal in the contexts its documentation lists, and the docs state that context for every directive — which is the fastest way to resolve \"why is this being ignored?\".\n\nValues flow downwards: a directive set in `http` applies to every `server` and `location` that does not set it again. The rule that catches people is that inheritance is *replace, not merge*, and it works per-directive-name rather than per-value. One `add_header` inside a `location` discards every `add_header` inherited from the `server` and `http` levels above it, silently dropping your security headers on exactly the path you were customising. nginx 1.29.3 added `add_header_inherit merge;` to opt into appending instead, but the default is still the old behaviour and most configs in the wild predate it.\n\nRequest routing happens in two stages. nginx first picks a `server` block using the `listen` address/port and then the `Host` header against `server_name` (exact name, then the longest wildcard starting with `*`, then the longest wildcard ending with `*`, then the first matching regular expression). If nothing matches, the `default_server` for that listen socket wins — and if you never marked one, it is the first `server` block declared for that socket, which is usually not what you intended. Only then does `location` selection run.\n\nOperationally: `nginx -t` parses and validates without touching the running server, and `nginx -s reload` makes the master re-read the config, spawn new workers and let old workers finish in-flight requests. A reload with a broken config fails and leaves the old config serving, so a test-then-reload pipeline never drops traffic.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "nginx: Beginner's Guide — configuration file structure", url: "https://nginx.org/en/docs/beginners_guide.html", kind: "docs" },
        { label: "nginx: How nginx processes a request", url: "https://nginx.org/en/docs/http/request_processing.html", kind: "docs" },
        { label: "nginx: Server names", url: "https://nginx.org/en/docs/http/server_names.html", kind: "docs" },
        { label: "nginx: Controlling nginx", url: "https://nginx.org/en/docs/control.html", kind: "docs" },
      ],
      video: {
        title: "Nginx Zero to Hero | Full Course with Hands-on",
        channel: "Abhishek.Veeramalla",
        url: "https://www.youtube.com/watch?v=9jZEfW8h5fQ",
        videoId: "9jZEfW8h5fQ",
        startSeconds: 22,
        chapterLabel: "NGINX basics",
        durationLabel: "58:38",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-nginx-config-structure-q1",
          prompt: "In which context must an `upstream` block be declared?",
          options: ["`http`", "`server`", "`location`", "The main (top-level) context"],
          correctIndex: 0,
          explanation:
            "`upstream` is an `http`-context directive, so a named server group is shared by every `server` and `location` in that `http` block. Declaring it inside a `server` is a config error — a common mistake when copying a snippet into a vhost file.",
        },
        {
          id: "proxy-nginx-config-structure-q2",
          prompt:
            "A request arrives with `Host: shop.example.com`. Four server blocks listen on the same address and port with these `server_name` values. Which one wins?\n\n```nginx\nserver { server_name ~^(?<sub>.+)\\.example\\.com$; }\nserver { server_name *.example.com; }\nserver { server_name shop.example.com; }\nserver { server_name www.*; }\n```",
          options: [
            "`shop.example.com` — an exact name beats every wildcard and regex",
            "`~^(?<sub>.+)\\.example\\.com$` — regular expressions are checked first",
            "`*.example.com` — the longest wildcard wins over an exact name",
            "The first block in the file, because all four match",
          ],
          correctIndex: 0,
          explanation:
            "nginx tries an exact name first, then the longest wildcard starting with `*`, then the longest wildcard ending with `*`, then regular expressions in order of appearance. Source order only matters as a tiebreak within the regex stage.",
        },
        {
          id: "proxy-nginx-config-structure-q3",
          prompt:
            "Both server blocks listen on `443 ssl`. A scanner connects by IP with `Host: 203.0.113.7`, matching neither name. Which block handles it?\n\n```nginx\nserver { listen 443 ssl; server_name api.example.com; ... }\nserver { listen 443 ssl; server_name app.example.com; ... }\n```",
          options: [
            "The first one, `api.example.com`, because it is the implicit default server for that socket",
            "Neither — nginx returns 404 with no server context",
            "nginx closes the connection without a response",
            "The second one, because unmatched hosts fall through to the last block",
          ],
          correctIndex: 0,
          explanation:
            "Every listen socket has a default server: the one marked `default_server`, or else the first block declared for that socket. So unmatched traffic — including bots and misrouted health checks — lands in your API vhost and its certificate is what gets presented. Declaring an explicit catch-all that returns 444 or 421 makes that deliberate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-nginx-config-structure-q4",
          prompt:
            "The `server` block sets three security headers. What does the browser receive for `/api/orders`?\n\n```nginx\nserver {\n  add_header X-Frame-Options DENY;\n  add_header X-Content-Type-Options nosniff;\n  add_header Referrer-Policy no-referrer;\n\n  location /api/ {\n    add_header Cache-Control \"no-store\";\n    proxy_pass http://app;\n  }\n}\n```",
          options: [
            "Only `Cache-Control: no-store` — the location's `add_header` replaces all inherited ones",
            "All four headers, because `add_header` directives accumulate down the tree",
            "All four, but `Cache-Control` overrides any value the upstream sent",
            "Only the three server-level headers; the location's is dropped as a duplicate",
          ],
          correctIndex: 0,
          explanation:
            "`add_header` directives are inherited from the level above *only if the current level defines none*. One `add_header` in the location wipes the inherited set, which is how security headers quietly vanish on a single path. Repeat them in the location, or set `add_header_inherit merge;` (nginx 1.29.3+).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-nginx-config-structure-q5",
          prompt: "Which statements about nginx configuration are true? (Select all that apply.)",
          options: [
            "A directive set in `http` applies to every `server` below it that does not set it again",
            "`include /etc/nginx/conf.d/*.conf;` splices files in at the point of the `include`, in glob order",
            "Every directive documents the contexts it is valid in, and using it elsewhere is a config error",
            "Two server blocks on the same socket may share a `server_name` and nginx will alternate between them",
            "A `location` block may be declared directly inside `http`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Inheritance, `include` semantics and per-directive contexts are all as described. Duplicate `server_name` values on the same socket produce a \"conflicting server name\" warning and the later block is ignored, and `location` is only valid inside `server` (or nested in another `location`).",
        },
        {
          id: "proxy-nginx-config-structure-q6",
          prompt: "What does `nginx -s reload` do to requests that are already in flight?",
          options: [
            "Nothing — the master starts new workers for the new config and lets old workers finish their current requests before exiting",
            "They are aborted; a reload is equivalent to a restart",
            "They are queued in the master process and replayed against the new workers",
            "They continue, but the new config is applied to them mid-request",
          ],
          correctIndex: 0,
          explanation:
            "A reload is graceful: new connections go to workers running the new config while old workers drain. That is why `reload` — not `restart` — is the deploy-time operation, and why long-lived connections such as WebSockets deserve their own thought during reloads.",
        },
        {
          id: "proxy-nginx-config-structure-q7",
          prompt: "A colleague edits the config and runs `nginx -s reload`, but the syntax is invalid. What happens?",
          options: [
            "The reload fails with an error and the previously loaded configuration keeps serving traffic",
            "nginx exits, taking the site down until the config is fixed",
            "nginx loads the valid parts and skips the invalid block",
            "New workers start and immediately crash-loop, dropping requests",
          ],
          correctIndex: 0,
          explanation:
            "The master validates before swapping; on failure it logs and keeps the running configuration. This is why `nginx -t && nginx -s reload` is safe — but also why a reload that \"did nothing\" is usually a failed reload nobody read the output of.",
        },
        {
          id: "proxy-nginx-config-structure-q8",
          prompt: "Which of these is **not** a valid context for `proxy_pass`?",
          options: ["`server`", "`location`", "`if` inside a `location`", "`limit_except`"],
          correctIndex: 0,
          explanation:
            "`proxy_pass` is valid in `location`, in `if` within a location, and in `limit_except`, but not directly in `server` — a `server` block has no single URI to map. Putting it there is a startup error, and the fix is a `location / { … }`.",
        },
        {
          id: "proxy-nginx-config-structure-q9",
          prompt:
            "A distribution ships `/etc/nginx/nginx.conf` containing `include /etc/nginx/conf.d/*.conf;` inside `http`, and `sites-enabled` symlinks are included after it. Two files both define `server_name example.com;` on port 80. What does nginx do?",
          options: [
            "It logs a \"conflicting server name\" warning and ignores the duplicate, so the first one loaded serves everything",
            "It refuses to start until the conflict is removed",
            "It load-balances requests between the two blocks",
            "It merges the two blocks, with later directives overriding earlier ones",
          ],
          correctIndex: 0,
          explanation:
            "Duplicate names on the same socket are a warning, not an error, and the later definition is dropped. Because the warning appears only in the reload output, the usual symptom is \"my new vhost has no effect\" long after the reload scrolled past.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "proxy-location-matching",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "How nginx Chooses a `location`",
      summary:
        "nginx does not pick the `location` block that appears first, and it does not pick the one that looks most specific to a human. It runs a fixed algorithm, and knowing it exactly is the difference between reading a config and guessing at one.\n\nThe algorithm: if an exact-match location (`location = /path`) matches, it wins immediately and the search stops. Otherwise nginx scans all *prefix* locations and remembers the longest one that matches. If that longest prefix carries the `^~` modifier, the search stops there and regular expressions are never consulted. Otherwise nginx evaluates regular-expression locations (`~` case-sensitive, `~*` case-insensitive) **in the order they appear in the configuration file** and takes the first one that matches — first, not longest, not best. Only if no regex matches does the remembered prefix win. Named locations (`@name`) are never matched against a request; they exist only as `try_files` and `error_page` targets. nginx mainline 1.31.5 added predicate locations (`location $variable`), evaluated after regexes, but on the stable branch that syntax does not exist yet.\n\nTwo traps account for most of the surprises. First, a prefix location matches on string prefix, not path segment: `location /api` also matches `/apidocs` and `/api-v2`, which is why the trailing slash in `location /api/` is load-bearing. Second, regex order means moving a `location ~* \\.(png|jpg)$` block above a proxy regex can silently reroute half your traffic without either block changing a character.\n\nCaddy solves the same problem differently and is worth contrasting: `handle` blocks are mutually exclusive and Caddy sorts path matchers by specificity, so the ordering you get is the one you would have drawn — at the cost of losing the explicit control nginx gives you.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "nginx: ngx_http_core_module — location", url: "https://nginx.org/en/docs/http/ngx_http_core_module.html#location", kind: "docs" },
        {
          label: "DigitalOcean: Nginx Server and Location Block Selection Algorithms",
          url: "https://www.digitalocean.com/community/tutorials/understanding-nginx-server-and-location-block-selection-algorithms",
          kind: "article",
        },
        { label: "Caddy: Request matchers (Caddyfile)", url: "https://caddyserver.com/docs/caddyfile/matchers", kind: "docs" },
      ],
      video: {
        title: "NGINX Tutorial for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=9t9Mp0BGnyI",
        videoId: "9t9Mp0BGnyI",
        startSeconds: 1368,
        chapterLabel: "Location Context",
        durationLabel: "51:03",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-location-matching-q1",
          prompt:
            "Given this configuration, which block handles `GET /documents/1.jpg`?\n\n```nginx\nlocation = / { # A }\nlocation / { # B }\nlocation /documents/ { # C }\nlocation ^~ /images/ { # D }\nlocation ~* \\.(gif|jpg|jpeg)$ { # E }\n```",
          options: ["E", "C", "B", "D"],
          correctIndex: 0,
          explanation:
            "`/documents/` is the longest matching prefix and is remembered, but it has no `^~`, so nginx goes on to check regexes. `~* \\.(gif|jpg|jpeg)$` matches, and a matching regex beats the remembered prefix.",
        },
        {
          id: "proxy-location-matching-q2",
          prompt: "With the same configuration, which block handles `GET /images/1.gif`?",
          options: ["D", "E", "B", "A"],
          correctIndex: 0,
          explanation:
            "`^~ /images/` is the longest matching prefix and the `^~` modifier stops the search before regexes are considered, so the image regex never runs. That is precisely what `^~` is for.",
        },
        {
          id: "proxy-location-matching-q3",
          prompt:
            "Two regex locations both match `/reports/summary.json`. Which wins?\n\n```nginx\nlocation ~ \\.json$        { proxy_pass http://json_api; }\nlocation ~ ^/reports/.*$  { proxy_pass http://reports; }\n```",
          options: [
            "`~ \\.json$` — regexes are tried in file order and the first match wins",
            "`~ ^/reports/.*$` — the longer, more specific pattern wins",
            "`~ ^/reports/.*$` — anchored patterns are preferred",
            "It is ambiguous and nginx refuses to start",
          ],
          correctIndex: 0,
          explanation:
            "Regex locations are evaluated strictly in configuration order and the search terminates on the first match. Specificity and anchoring are irrelevant, which is why reordering an included file can reroute traffic without changing any block.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-location-matching-q4",
          prompt:
            "Which requests does `location /api { … }` match?\n\n- `/api`\n- `/api/users`\n- `/apidocs`\n- `/v1/api`",
          options: [
            "`/api`, `/api/users` and `/apidocs`",
            "`/api` and `/api/users` only",
            "`/api` only",
            "All four",
          ],
          correctIndex: 0,
          explanation:
            "A prefix location matches a string prefix of the URI, not a path segment, so `/apidocs` matches too — a classic way to accidentally proxy your documentation site into your API. `/v1/api` does not match because the prefix must start at the beginning. Writing `location /api/` plus an explicit `location = /api` is the usual fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-location-matching-q5",
          prompt: "Which statements about nginx location selection are true? (Select all that apply.)",
          options: [
            "`location = /health` stops the search immediately when the URI is exactly `/health`",
            "If no regex matches, the longest matching prefix location is used",
            "`~*` makes the regular expression case-insensitive",
            "A named location `@fallback` is considered during normal request matching",
            "Between two matching regexes, the one with the longer pattern wins",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Exact match short-circuits, the remembered prefix is the fallback, and `~*` is the case-insensitive form. Named locations are only reachable via `try_files`/`error_page`, and regexes are resolved by file order, never by length.",
        },
        {
          id: "proxy-location-matching-q6",
          prompt:
            "This is the whole server block. A browser requests `https://example.com/user` (no trailing slash). What does it get?\n\n```nginx\nlocation /user/ {\n  proxy_pass http://user_service;\n}\n```",
          options: [
            "A 301 redirect to `/user/`, issued by nginx before any proxying",
            "A proxied response from `user_service` for `/user`",
            "A 404 from nginx, because no location matches",
            "A proxied response for `/user/`, with nginx rewriting the path silently",
          ],
          correctIndex: 0,
          explanation:
            "When a prefix location ends in `/` and is handled by `proxy_pass` (or `fastcgi_pass`, `grpc_pass`, …), nginx answers a request for the same string without the slash with a permanent redirect that adds it. That turns a `POST /user` into a `GET /user/` at many clients. Add `location = /user { proxy_pass …; }` if you need the bare path handled.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-location-matching-q7",
          prompt: "What is `^~` for?",
          options: [
            "It marks a prefix location that, if it is the longest match, skips regular-expression evaluation entirely",
            "It makes the location a case-insensitive regular expression",
            "It negates the match, so the block applies to everything except the prefix",
            "It raises the location's priority above exact (`=`) matches",
          ],
          correctIndex: 0,
          explanation:
            "`^~` is still an ordinary prefix location; the modifier only tells nginx to stop once it is chosen as the longest prefix. It is the standard way to protect `/static/` or `/.well-known/` from a catch-all regex. Nothing outranks an exact `=` match.",
        },
        {
          id: "proxy-location-matching-q8",
          prompt:
            "An SPA is served with `try_files $uri $uri/ /index.html;` in `location /`, and there is also `location ~ \\.js$ { expires 1y; }`. A request for `/dashboard/settings` (no such file) arrives. What happens?",
          options: [
            "`location /` matches, `try_files` falls through to `/index.html`, and the SPA boots and routes client-side",
            "The JS regex matches and a 404 is returned with a one-year cache header",
            "nginx returns 404 because `try_files` cannot rewrite to a different location",
            "nginx issues a 301 to `/dashboard/settings/`",
          ],
          correctIndex: 0,
          explanation:
            "The URI has no `.js` suffix, so only `/` matches; `try_files` tries the file, then the directory, then falls back to `/index.html`, which is what makes client-side routing work on refresh. Note that the fallback re-enters location matching for `/index.html`.",
        },
        {
          id: "proxy-location-matching-q9",
          prompt:
            "A request arrives as `GET /files/a%20b/../c.txt?x=1`. What does nginx match the prefix locations against?",
          options: [
            "The normalised, decoded path `/files/c.txt` — the query string is not part of location matching",
            "The raw request line exactly as sent, including `%20` and `?x=1`",
            "`/files/a b/../c.txt?x=1`, decoded but not normalised",
            "`/files/c.txt?x=1` — normalised, with the query string included",
          ],
          correctIndex: 0,
          explanation:
            "nginx decodes percent-escapes and resolves `.` / `..` before matching, and the query string never participates. This matters for security rules: a prefix location cannot be bypassed with `%2e%2e`, but equally you cannot write a location that matches on a query parameter — use a `map` or an `if` on `$arg_name` for that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-location-matching-q10",
          prompt: "How does Caddy's routing differ from nginx's location matching?",
          options: [
            "Caddy sorts directives by a fixed order and path matchers by specificity, and `handle` blocks are mutually exclusive — so written order mostly does not matter",
            "Caddy evaluates blocks strictly top to bottom, so written order is the only thing that matters",
            "Caddy has no path-based routing; you need one site block per path",
            "Caddy uses exactly nginx's algorithm with different syntax",
          ],
          correctIndex: 0,
          explanation:
            "Caddy hard-codes a directive order and sorts same-named directives by matcher specificity, so `handle /api/*` reliably beats `handle /*` wherever you write them. `route` opts out and preserves written order when you genuinely need it.",
        },
      ],
    },
    {
      id: "proxy-pass-uri-rewrite",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "`proxy_pass` and the Trailing-Slash Rule",
      summary:
        "One character in `proxy_pass` decides what path your upstream sees, and nothing in the request or the error message tells you which behaviour you got.\n\nThe rule from the nginx documentation: **if `proxy_pass` is specified with a URI, the part of the request URI that matched the location is replaced by that URI.** If it is specified *without* a URI — just scheme, host and port — the request URI is passed through unchanged. A bare `/` counts as a URI. So with `location /api/`, `proxy_pass http://app:3000;` sends `/api/users/7` upstream, while `proxy_pass http://app:3000/;` sends `/users/7`, and `proxy_pass http://app:3000/v1/;` sends `/v1/users/7`. Mismatch the slashes — `location /api` with `proxy_pass http://app:3000/` — and `/api/users` becomes `//users`, which most routers treat as a 404 you will stare at for twenty minutes.\n\nThree cases disable the replacement form entirely, because nginx cannot work out which part of the URI to replace. Inside a regex location or a named location, `proxy_pass` must have no URI at all (nginx refuses to start otherwise). If a `rewrite … break;` has already changed the URI in the same location, the URI in `proxy_pass` is ignored and the rewritten URI is sent. And if `proxy_pass` contains a variable — `proxy_pass http://backend$request_uri;` — the URI given is sent as-is, the name is resolved through a `resolver` rather than as an upstream group, and you lose the upstream block's load balancing.\n\nCaddy makes the same decision explicit rather than punctuational: `handle /api/*` keeps the prefix, `handle_path /api/*` strips it (it is literally `handle` plus `uri strip_prefix`). When you are translating an nginx config to a Caddyfile, that is the pair to reach for — and the first thing to check when the translation returns 404s.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "nginx: ngx_http_proxy_module — proxy_pass", url: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass", kind: "docs" },
        { label: "Caddy: handle_path (Caddyfile directive)", url: "https://caddyserver.com/docs/caddyfile/directives/handle_path", kind: "docs" },
        { label: "nginx Admin's Handbook", url: "https://github.com/trimstray/nginx-admins-handbook", kind: "repo" },
      ],
      video: {
        title: "NGINX Complete Course: Reverse Proxy, Load Balancing, HTTPS & Docker",
        channel: "Sarvin Style Coding",
        url: "https://www.youtube.com/watch?v=-sY9OBgohX0",
        videoId: "-sY9OBgohX0",
        startSeconds: 1022,
        chapterLabel: "Reverse Proxy",
        durationLabel: "2:08:17",
      },
      alternateVideos: [
        {
          title: "NginX Crash Course",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=hcw-NjOh8r0",
          videoId: "hcw-NjOh8r0",
          startSeconds: 1830,
          chapterLabel: "proxy pass",
          durationLabel: "2:01:21",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-pass-uri-rewrite-q1",
          prompt:
            "What path does the upstream receive for `GET /api/users/7`?\n\n```nginx\nlocation /api/ {\n  proxy_pass http://app:3000/;\n}\n```",
          options: ["`/users/7`", "`/api/users/7`", "`//users/7`", "`/`"],
          correctIndex: 0,
          explanation:
            "`proxy_pass` has a URI (`/`), so the part matching the location — `/api/` — is replaced by `/`, leaving `/users/7`. This is the form to use when the upstream does not know about the `/api` prefix.",
        },
        {
          id: "proxy-pass-uri-rewrite-q2",
          prompt:
            "And with the trailing slash removed from `proxy_pass`?\n\n```nginx\nlocation /api/ {\n  proxy_pass http://app:3000;\n}\n```",
          options: ["`/api/users/7`", "`/users/7`", "`//users/7`", "`/api/`"],
          correctIndex: 0,
          explanation:
            "With no URI after the host and port, nginx passes the request URI through unchanged. Use this when the upstream application is itself mounted at `/api`.",
        },
        {
          id: "proxy-pass-uri-rewrite-q3",
          prompt:
            "What does the upstream receive for `GET /api/users` here?\n\n```nginx\nlocation /api {\n  proxy_pass http://app:3000/;\n}\n```",
          options: ["`//users`", "`/users`", "`/api/users`", "nginx refuses to start"],
          correctIndex: 0,
          explanation:
            "The matched part is `/api` (no trailing slash in the location), and it is replaced by `/`, so the remaining `/users` is appended to `/` giving `//users`. Most routers 404 on a doubled slash. Keeping the slashes consistent on both sides — `location /api/` with `proxy_pass …/` — is the rule of thumb.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-pass-uri-rewrite-q4",
          prompt:
            "What happens when nginx loads this?\n\n```nginx\nlocation ~ ^/api/(.*)$ {\n  proxy_pass http://app:3000/;\n}\n```",
          options: [
            "It fails to start: `proxy_pass` cannot have a URI part in a location given by a regular expression",
            "It starts, and the upstream receives `/`",
            "It starts, and the capture group is appended automatically",
            "It starts, but every request returns 502",
          ],
          correctIndex: 0,
          explanation:
            "Inside a regex location nginx cannot determine which part of the URI the location \"matched\", so the URI form is rejected at configuration time. Either drop the URI and pass the path through, or build the target explicitly with the capture: `proxy_pass http://app:3000/$1;`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-pass-uri-rewrite-q5",
          prompt:
            "What does the upstream receive for `GET /name/alice`?\n\n```nginx\nlocation /name/ {\n  rewrite    /name/([^/]+) /users?name=$1 break;\n  proxy_pass http://app:3000/ignored/;\n}\n```",
          options: [
            "`/users?name=alice` — once `rewrite … break` changes the URI, the URI in `proxy_pass` is ignored",
            "`/ignored/users?name=alice`",
            "`/ignored/alice`",
            "`/name/alice` — the rewrite applies only to redirects",
          ],
          correctIndex: 0,
          explanation:
            "This is the documented exception: when the URI has been changed inside the location by `rewrite … break`, the full changed URI is sent and the `proxy_pass` URI is discarded. Configs that combine both are a reliable source of confusion, so pick one mechanism per location.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-pass-uri-rewrite-q6",
          prompt: "Which of these send `/users` to the upstream for a request to `/api/users`? (Select all that apply.)",
          options: [
            "`location /api/ { proxy_pass http://app/; }`",
            "`location /api/ { rewrite ^/api/(.*)$ /$1 break; proxy_pass http://app; }`",
            "`location ~ ^/api/(?<rest>.*)$ { proxy_pass http://app/$rest; }`",
            "`location /api/ { proxy_pass http://app; }`",
            "`location /api { proxy_pass http://app/; }`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first strips via the URI-replacement rule, the second strips with an explicit rewrite, and the third builds the path from a named capture. The fourth passes `/api/users` through untouched, and the fifth produces `//users`.",
        },
        {
          id: "proxy-pass-uri-rewrite-q7",
          prompt:
            "A colleague changes `proxy_pass http://backend;` to `proxy_pass http://backend$request_uri;`, where `backend` is an `upstream` block with three servers. What breaks?",
          options: [
            "Using a variable makes nginx resolve the name at request time, so the upstream group's load balancing and health tracking no longer apply",
            "Nothing — it is an equivalent way to write the same thing",
            "The query string is dropped, because `$request_uri` excludes it",
            "nginx refuses to start, because variables are not allowed in `proxy_pass`",
          ],
          correctIndex: 0,
          explanation:
            "With a variable, nginx looks the name up among server groups and then falls back to a `resolver`, and the URI is sent literally. In practice teams hit this as \"my upstream block stopped balancing\" or \"no resolver defined\". `$request_uri` does include the query string.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-pass-uri-rewrite-q8",
          prompt:
            "The upstream replies `301 Location: http://app:3000/login`. The browser is at `https://example.com/api/`. What does the client actually see by default?",
          options: [
            "`Location: https://example.com/api/login` — nginx's default `proxy_redirect` rewrites the upstream's own address back to the location",
            "`Location: http://app:3000/login` — nginx never alters response headers",
            "A 502, because nginx rejects redirects to private addresses",
            "`Location: /login` — nginx strips the origin from all redirects",
          ],
          correctIndex: 0,
          explanation:
            "`proxy_redirect default` rewrites `Location` and `Refresh` headers that point at the `proxy_pass` address, substituting the location's own address. It only covers that one case: an upstream that hard-codes some other absolute URL leaks it, which is why apps behind a proxy should emit relative redirects or read `X-Forwarded-*`.",
        },
        {
          id: "proxy-pass-uri-rewrite-q9",
          prompt: "What is the Caddy equivalent of nginx's `location /api/ { proxy_pass http://app:3000/; }`?",
          options: [
            "`handle_path /api/* { reverse_proxy app:3000 }`",
            "`handle /api/* { reverse_proxy app:3000 }`",
            "`route /api/* { reverse_proxy app:3000/ }`",
            "`reverse_proxy /api/ app:3000` — Caddy strips prefixes automatically",
          ],
          correctIndex: 0,
          explanation:
            "`handle_path` is `handle` plus `uri strip_prefix`, so it removes `/api` before the proxy runs — matching the trailing-slash form. Plain `handle` keeps the prefix, and Caddy never strips anything implicitly.",
        },
        {
          id: "proxy-pass-uri-rewrite-q10",
          prompt:
            "An upstream is a UNIX socket. Which `proxy_pass` is correct, and does the trailing-slash rule still apply?",
          options: [
            "`proxy_pass http://unix:/run/app.sock:/;` — the path after the second colon is the URI and follows the same rule",
            "`proxy_pass unix:/run/app.sock;` — sockets have no URI part",
            "`proxy_pass http://unix:/run/app.sock;` — the rule does not apply to sockets",
            "Sockets require `fastcgi_pass`, not `proxy_pass`",
          ],
          correctIndex: 0,
          explanation:
            "The syntax is `http://unix:<socket path>:<uri>`, and everything after the trailing colon is the URI part, behaving exactly as it would for a TCP upstream. Omitting it passes the request URI through.",
        },
      ],
    },
    {
      id: "proxy-forwarded-headers",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "Forwarded Headers and the Real Client IP",
      summary:
        "The proxy opens a new TCP connection to your application, so the peer address the application sees is the proxy's. Everything downstream that cares who the caller was — rate limiting, geo rules, abuse detection, audit logs, \"last login from\" — is wrong until you fix this deliberately, and it is wrong *silently*: the app keeps working, it just blames `127.0.0.1` for everything.\n\nThree headers carry the truth. `X-Forwarded-For` is a de-facto standard comma-separated list where each proxy appends the address it received the connection from, so the leftmost entry is the original client and each hop to the right is a proxy. `X-Forwarded-Proto` tells the app whether the *client* spoke HTTPS, which is what decides whether to set `Secure` cookies and whether to emit an HTTPS redirect. `Forwarded` (RFC 7239) standardises all of it into one header with `for=`, `proto=`, `host=` and `by=` parameters, and is the correct choice for new systems even though `X-Forwarded-*` is what you will meet in the wild.\n\nThe security point that separates people who have operated this from people who have configured it: **every one of these headers is client-supplied**. A request can arrive with `X-Forwarded-For: 1.2.3.4` already set, and if your edge appends rather than replaces, your app will happily believe the attacker's value and let them evade an IP ban. The rule is that a value is only trustworthy if it was written by a proxy you control, which means declaring which peers you trust: nginx's `realip` module with `set_real_ip_from` (plus `real_ip_recursive on` when there are several hops), Caddy's `trusted_proxies` global option, or Express's `trust proxy`. Caddy is safer by default here — it ignores incoming `X-Forwarded-*` values unless you name trusted proxies; nginx's `$proxy_add_x_forwarded_for` appends to whatever arrived.\n\nOne more nginx-specific surprise: `proxy_set_header Host` defaults to `$proxy_host`, so your application sees the upstream's name, not the browser's. Caddy passes the original `Host` through untouched.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "nginx: ngx_http_realip_module", url: "https://nginx.org/en/docs/http/ngx_http_realip_module.html", kind: "docs" },
        { label: "RFC 7239: Forwarded HTTP Extension", url: "https://www.rfc-editor.org/info/rfc7239/", kind: "spec" },
        { label: "MDN: X-Forwarded-For", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-For", kind: "docs" },
        { label: "Express: behind proxies", url: "https://expressjs.com/en/guide/behind-proxies/", kind: "article" },
      ],
      video: {
        title: "Client IP in NGINX reverse proxy",
        channel: "Juriy Bura",
        url: "https://www.youtube.com/watch?v=4p1Zc8F29Lk",
        videoId: "4p1Zc8F29Lk",
        startSeconds: 98,
        chapterLabel: "Configuring the host header",
        durationLabel: "8:25",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-forwarded-headers-q1",
          prompt: "A request passes through a CDN and then your nginx. The app receives `X-Forwarded-For: 203.0.113.9, 198.51.100.4`. Which address is the browser's?",
          options: ["`203.0.113.9`, the leftmost entry", "`198.51.100.4`, the rightmost entry", "Neither — the header lists only proxies", "It is undefined; the order is implementation-specific"],
          correctIndex: 0,
          explanation:
            "Each proxy appends the address it received the connection from, so the list reads client-first and the rightmost entry is the most recent hop. Note that only entries added by proxies you control are trustworthy; the leftmost one is exactly the one an attacker can forge.",
        },
        {
          id: "proxy-forwarded-headers-q2",
          prompt:
            "nginx is configured with `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` and is directly internet-facing. A client sends the request with `X-Forwarded-For: 10.0.0.1` already set. What does the app see?",
          options: [
            "`10.0.0.1, <the client's real address>` — nginx appends to the client-supplied value",
            "`<the client's real address>` — nginx replaces any incoming value",
            "`10.0.0.1` — nginx passes the client's value through unchanged",
            "Nothing — nginx strips headers it did not set",
          ],
          correctIndex: 0,
          explanation:
            "`$proxy_add_x_forwarded_for` is defined as the incoming header plus `$remote_addr`, so a forged prefix survives. On an internet-facing edge you want `proxy_set_header X-Forwarded-For $remote_addr;` instead, which discards anything the client claimed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-forwarded-headers-q3",
          prompt: "An app behind nginx keeps generating `http://` redirects even though users reach it over HTTPS. What is missing?",
          options: [
            "`X-Forwarded-Proto` is not being set, or the app is not configured to honour it",
            "`ssl_protocols` does not include TLSv1.3",
            "The upstream connection should also be HTTPS; the app is reading the wrong scheme",
            "HSTS is not enabled at the proxy",
          ],
          correctIndex: 0,
          explanation:
            "TLS terminates at the proxy, so the upstream request genuinely is plain HTTP and the framework reports `http` unless told otherwise. `proxy_set_header X-Forwarded-Proto $scheme;` plus the framework's trust setting fixes redirects and `Secure` cookies together. Re-encrypting to the upstream would also work but is a much bigger hammer.",
        },
        {
          id: "proxy-forwarded-headers-q4",
          prompt: "What does this nginx configuration achieve?\n\n```nginx\nset_real_ip_from 10.0.0.0/8;\nreal_ip_header X-Forwarded-For;\nreal_ip_recursive on;\n```",
          options: [
            "`$remote_addr` is replaced with the rightmost address in `X-Forwarded-For` that is not in a trusted range, so logs and rate limits key on the real client",
            "It blocks every request that does not originate from `10.0.0.0/8`",
            "It appends the trusted range to `X-Forwarded-For` for downstream proxies",
            "It rejects requests whose `X-Forwarded-For` contains an untrusted address",
          ],
          correctIndex: 0,
          explanation:
            "`set_real_ip_from` declares which peers are allowed to speak for others; `real_ip_recursive on` walks the list from the right, skipping trusted addresses, and stops at the first untrusted one. Without `recursive`, only the last entry is considered, which is wrong once there is more than one hop.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-forwarded-headers-q5",
          prompt: "Which statements about forwarded headers are true? (Select all that apply.)",
          options: [
            "`Forwarded` (RFC 7239) carries client, protocol and host information in one standardised header",
            "`X-Forwarded-*` headers are client-controllable and must only be trusted from known peers",
            "Caddy's `reverse_proxy` ignores incoming `X-Forwarded-*` values by default to prevent spoofing",
            "`X-Forwarded-For` is defined by the HTTP specification and proxies must not modify it",
            "`X-Real-IP` is standardised and always contains the original client address",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "RFC 7239 defines `Forwarded`; the `X-` headers are conventions, spoofable, and Caddy deliberately overwrites them unless `trusted_proxies` says otherwise. `X-Real-IP` is an nginx convention with no standard and whatever semantics the config gives it.",
        },
        {
          id: "proxy-forwarded-headers-q6",
          prompt:
            "An Express app behind one proxy computes login rate limits per IP using `req.ip`, and `app.set('trust proxy', true)` is set. Why is this configuration dangerous?",
          options: [
            "`true` trusts the entire chain, so a forged `X-Forwarded-For` lets an attacker present a new client IP on every attempt and evade the limiter",
            "`req.ip` ignores `X-Forwarded-For` entirely, so every request keys on the proxy",
            "Express rejects requests with more than one `X-Forwarded-For` entry",
            "It is fine — Express validates the header against the socket address",
          ],
          correctIndex: 0,
          explanation:
            "`trust proxy: true` takes the leftmost entry no matter who wrote it, which is precisely the attacker-controlled one. Set the number of proxies in front (`1`) or an explicit subnet so Express counts back from the socket instead of believing the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-forwarded-headers-q7",
          prompt: "With no `proxy_set_header Host` directive, what `Host` does the upstream see from nginx?",
          options: [
            "`$proxy_host` — the name and port from `proxy_pass`, not the browser's hostname",
            "The client's original `Host`, passed through unchanged",
            "The `server_name` of the matching server block",
            "No `Host` header at all",
          ],
          correctIndex: 0,
          explanation:
            "nginx's defaults are `Host $proxy_host;` and `Connection close;`. Frameworks that build absolute URLs, multi-tenant apps that route on hostname and virtual-host-aware upstreams all break on this, which is why `proxy_set_header Host $host;` appears in almost every real config. Caddy passes the original `Host` through by default.",
        },
        {
          id: "proxy-forwarded-headers-q8",
          prompt:
            "Caddy sits behind Cloudflare. The `Caddyfile` uses a plain `reverse_proxy` with no extra options. What must be configured for client IPs to be correct?",
          options: [
            "`trusted_proxies` (ideally as the `servers > trusted_proxies` global option) listing Cloudflare's ranges",
            "`header_up X-Forwarded-For {remote_host}`, which preserves the CDN's value",
            "Nothing — Caddy reads Cloudflare's `CF-Connecting-IP` automatically",
            "`real_ip_header` must be set, as in nginx",
          ],
          correctIndex: 0,
          explanation:
            "Because Caddy discards incoming `X-Forwarded-*` by default, it will report Cloudflare's edge IP until you tell it which peers are trusted. `header_up X-Forwarded-For {remote_host}` does the opposite of what is wanted here — it overwrites the header with the immediate peer, which is the right thing only when Caddy is itself the outermost hop.",
        },
        {
          id: "proxy-forwarded-headers-q9",
          prompt:
            "This project's `Caddyfile.example` sets `header_up X-Forwarded-For {remote_host}` rather than appending. Why is that the right choice there?",
          options: [
            "Caddy is the outermost proxy, so the only trustworthy value is the address of the peer it is talking to; anything a client claimed must be discarded",
            "Appending is slower, and the app only reads the first entry",
            "`{remote_host}` includes the whole chain, so appending would duplicate it",
            "Caddy cannot append to headers, only replace them",
          ],
          correctIndex: 0,
          explanation:
            "With nothing in front, the TCP peer *is* the client, so overwriting is both correct and safe — which matters because the login rate limiter keys on that value. If a CDN were added later, this line would have to change along with `trusted_proxies`. Caddy can append with `header_up +Name value`.",
        },
      ],
    },
    {
      id: "proxy-caddy-automatic-https",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "Caddy and Automatic HTTPS",
      summary:
        "Caddy 2's headline feature is that HTTPS is not something you configure. Give it a site address that is a domain name and it obtains a certificate from a public ACME CA (Let's Encrypt, with ZeroSSL as a fallback), keeps it renewed, and inserts an HTTP-to-HTTPS redirect on port 80. Give it `localhost` or an IP address and it still serves HTTPS, using a locally generated CA whose root it offers to install into your system trust store. The Caddyfile for a real deployment is often three lines, and none of them mention TLS.\n\nWhat actually has to be true: your A/AAAA records point at the machine, ports 80 and 443 are reachable, Caddy can bind them, the data directory is writable *and persistent*, and the domain appears somewhere in the config. Automatic HTTPS is switched off — wholly or partly — by prefixing the site address with `http://`, by listening only on the HTTP port, by loading certificates manually, or by disabling it explicitly. Those are the four things to check when a deployment mysteriously serves plain HTTP.\n\nThe validation uses ACME challenges. HTTP-01 needs port 80 open; TLS-ALPN-01 needs port 443; both are enabled by default and Caddy picks between them, learning which works. DNS-01 needs API credentials for your DNS provider, needs no open ports, and is the only option for wildcard certificates — and enabling it disables the other two by default.\n\nThe failure mode that bites hardest in containers is storage. Caddy's data directory holds the account key and every issued certificate; mount it on an ephemeral layer and each `docker compose up` re-issues from scratch, which walks you straight into Let's Encrypt's rate limits and can lock you out of HTTPS for a week. Use the staging ACME endpoint while you experiment, and treat the data volume as production state.\n\nCompared with nginx this is a real reduction in moving parts — no certbot, no renewal cron, no reload hook — at the cost of a smaller ecosystem of modules and less of the low-level tuning that a very high-traffic nginx deployment leans on.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Caddy: Automatic HTTPS", url: "https://caddyserver.com/docs/automatic-https", kind: "docs" },
        { label: "Caddy: Caddyfile Concepts", url: "https://caddyserver.com/docs/caddyfile/concepts", kind: "docs" },
        { label: "Let's Encrypt: Challenge Types", url: "https://letsencrypt.org/docs/challenge-types/", kind: "article" },
      ],
      video: {
        title: "I Was DEFINITELY Using The Wrong Server",
        channel: "DevOps Toolbox",
        url: "https://www.youtube.com/watch?v=Inu5VhrO1rE",
        videoId: "Inu5VhrO1rE",
        durationLabel: "14:26",
      },
      alternateVideos: [
        {
          title: "Replace Traefik? Caddy Proxy with SSL Certificates - It's so easy!",
          channel: "Jim's Garage",
          url: "https://www.youtube.com/watch?v=ZOtUco5EwoI",
          videoId: "ZOtUco5EwoI",
          durationLabel: "18:57",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-caddy-automatic-https-q1",
          prompt:
            "A Caddyfile contains exactly this. What does Caddy do on start-up?\n\n```caddy\nexample.com {\n\treverse_proxy 127.0.0.1:8787\n}\n```",
          options: [
            "Obtains a certificate for `example.com` from a public ACME CA, serves HTTPS on 443, and redirects HTTP on 80 to HTTPS",
            "Serves plain HTTP on port 80 until a `tls` directive is added",
            "Fails to start, because no certificate path was given",
            "Serves HTTPS using a self-signed certificate, which browsers will warn about",
          ],
          correctIndex: 0,
          explanation:
            "A site address that is a public domain name activates automatic HTTPS: issuance, renewal and the HTTP redirect all happen without configuration. Self-signed certificates from Caddy's local CA are used only for local/internal names and IP addresses.",
        },
        {
          id: "proxy-caddy-automatic-https-q2",
          prompt: "Which of these prevent automatic HTTPS from being activated? (Select all that apply.)",
          options: [
            "Writing the site address as `http://example.com`",
            "Giving no hostname or IP in the config at all",
            "Loading a certificate manually with the `tls <cert> <key>` form",
            "Running Caddy as a non-root user",
            "Using `reverse_proxy` rather than `file_server`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The `http://` scheme, an address-less config and manually loaded certificates each turn automatic HTTPS off in whole or in part. Running unprivileged only affects binding low ports (solvable with capabilities or a systemd unit), and the choice of handler directive is irrelevant.",
        },
        {
          id: "proxy-caddy-automatic-https-q3",
          prompt:
            "A `docker compose` deployment of Caddy has no volume for `/data`. HTTPS works, but after a few redeploys certificate issuance starts failing. What is happening?",
          options: [
            "Each rebuild discards the account key and certificates, so Caddy re-issues every time and eventually hits the CA's rate limits",
            "Caddy caches a failed challenge and needs `caddy untrust` to clear it",
            "Docker's overlay filesystem cannot store PEM files",
            "The container clock drifts, so certificates are seen as expired",
          ],
          correctIndex: 0,
          explanation:
            "Caddy's data directory is the state that makes automatic HTTPS cheap: lose it and every start is a fresh issuance. Let's Encrypt's certificates-per-domain limits then lock you out for days. Mount `/data` on a named volume, and use the staging endpoint while iterating.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-caddy-automatic-https-q4",
          prompt: "Which ACME challenge type can obtain a wildcard certificate such as `*.example.com`?",
          options: ["DNS-01", "HTTP-01", "TLS-ALPN-01", "Any of them, given a correct A record"],
          correctIndex: 0,
          explanation:
            "Only DNS-01 proves control of a whole zone, so it is the only route to a wildcard; it also needs no open ports, which makes it the answer for internal hosts. The trade is that Caddy needs credentials for your DNS provider, and enabling DNS-01 disables the other challenges by default.",
        },
        {
          id: "proxy-caddy-automatic-https-q5",
          prompt: "A server is behind a firewall that allows only port 443 inbound. Which default challenge can still succeed?",
          options: ["TLS-ALPN-01", "HTTP-01", "Neither — automatic HTTPS requires port 80", "Both, because Caddy falls back to port 443 for HTTP-01"],
          correctIndex: 0,
          explanation:
            "TLS-ALPN-01 completes inside a TLS handshake on 443 using special ALPN and SNI values, so it works when 80 is closed. HTTP-01 strictly needs port 80 reachable. Caddy enables both by default and will settle on whichever succeeds.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-caddy-automatic-https-q6",
          prompt: "You run `caddy run` with a site address of `localhost`. What certificate does the browser get?",
          options: [
            "A leaf signed by Caddy's own local CA, which Caddy tries to install into the system trust store",
            "A Let's Encrypt certificate for `localhost`",
            "No certificate — `localhost` is served over plain HTTP",
            "A certificate for `127.0.0.1` issued through TLS-ALPN-01",
          ],
          correctIndex: 0,
          explanation:
            "Local and internal names do not qualify for publicly trusted certificates, so Caddy generates a local CA (root plus intermediate), signs the leaf, and offers to add the root to your trust store. No ACME or DNS validation is involved, and the trust is local to that machine.",
        },
        {
          id: "proxy-caddy-automatic-https-q7",
          prompt: "Why should experiments point at `https://acme-staging-v02.api.letsencrypt.org/directory`?",
          options: [
            "The staging environment has far looser rate limits, so a misconfiguration loop does not cost you a week of HTTPS",
            "Staging issues publicly trusted certificates faster",
            "Production requires a paid account, staging does not",
            "Staging is the only endpoint that supports TLS-ALPN-01",
          ],
          correctIndex: 0,
          explanation:
            "Staging certificates are not publicly trusted — browsers will warn — but that is the point: you are testing plumbing, not trust. The limits it is protecting you from are per-domain issuance caps that apply for days.",
        },
        {
          id: "proxy-caddy-automatic-https-q8",
          prompt: "What problem does On-Demand TLS solve?",
          options: [
            "Serving many hostnames you do not know in advance — such as customer domains — by obtaining a certificate during the first handshake for an unknown SNI",
            "Renewing certificates without reloading the configuration",
            "Issuing certificates faster by batching ACME orders",
            "Sharing one certificate across unrelated hostnames",
          ],
          correctIndex: 0,
          explanation:
            "Instead of listing every domain at config load, Caddy holds the first handshake for an unseen SNI while it obtains a certificate. It must be restricted (by an `ask` endpoint or an allow list) or it becomes an issuance-by-anyone denial-of-service against your CA quota.",
        },
        {
          id: "proxy-caddy-automatic-https-q9",
          prompt:
            "A team migrates from nginx + certbot to Caddy and asks what they actually stop maintaining. Which of these genuinely go away? (Select all that apply.)",
          options: [
            "The renewal timer or cron job",
            "The post-renewal reload hook that makes nginx pick up new certificates",
            "Hard-coded `ssl_certificate` / `ssl_certificate_key` paths per vhost",
            "The need for DNS records to point at the server",
            "The need for the host to be reachable for validation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Caddy owns issuance, renewal and hot certificate reloading, so the timer, the hook and the paths all disappear. Nothing removes the underlying requirement that a CA can verify control of the name: DNS must be right and validation must be able to reach you (or DNS-01 must be configured).",
        },
      ],
    },
    {
      id: "proxy-tls-config",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "TLS Termination and Security Headers",
      summary:
        "Terminating TLS at the proxy concentrates a set of decisions in one place: which protocol versions and cipher suites you accept, which certificate chain you present, and which security headers every response carries.\n\nThe modern answer to protocol selection is short. Offer TLS 1.3 and TLS 1.2, nothing older, and on TLS 1.2 restrict yourself to forward-secret AEAD suites (ECDHE with AES-GCM or ChaCha20-Poly1305); TLS 1.3 removes the choice entirely because its cipher suites are all acceptable. Rather than hand-assembling a cipher string, generate one for your server and version — the list that was correct in 2018 disables things that are now baseline. In nginx, HTTP/2 is no longer a `listen` parameter: since 1.25.1 it is the `http2 on;` directive, and configs that still write `listen 443 ssl http2;` are using a deprecated form.\n\nThe chain is where deployments break rather than the ciphers. `ssl_certificate` must point at the leaf **concatenated with its intermediates**, in that order. Browsers usually paper over a missing intermediate by fetching it, so the site looks fine on a laptop and fails on older Android handsets, in `curl` and in server-to-server calls — a bug that reaches you as \"the mobile app can't log in\".\n\nHeaders split cleanly by who knows the answer. HSTS belongs at the proxy: it is a statement about the transport, and the proxy is the thing that owns it. Add `preload` only once you are certain, because it is effectively irreversible for months. `X-Content-Type-Options: nosniff` and a frame policy are also fine at the edge. A Content-Security-Policy is not: it has to enumerate the origins *your application* loads from and often needs a per-response nonce, so it belongs where the HTML is rendered. Whatever you do choose to set at the proxy, remember nginx's `add_header` inheritance rule — one `add_header` in a `location` discards every inherited one, unless you are on 1.29.3+ and opt into `add_header_inherit merge;`.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "nginx: Configuring HTTPS servers", url: "https://nginx.org/en/docs/http/configuring_https_servers.html", kind: "docs" },
        { label: "Caddy: tls (Caddyfile directive)", url: "https://caddyserver.com/docs/caddyfile/directives/tls", kind: "docs" },
        { label: "Mozilla: TLS Configurator", url: "https://configurator.tlsref.org/", kind: "article" },
        { label: "OWASP Secure Headers Project", url: "https://owasp.org/projects/secure-headers-project", kind: "article" },
      ],
      video: {
        title: "Full NGINX Tutorial - Demo Project with Node.js, Docker",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=q8OleYuqntY",
        videoId: "q8OleYuqntY",
        startSeconds: 3482,
        chapterLabel: "Configure HTTPS - Encrypted Connection",
        durationLabel: "1:11:40",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-tls-config-q1",
          prompt:
            "HTTPS works perfectly in Chrome and Firefox, but `curl` reports `unable to get local issuer certificate` and an older Android device refuses to connect. What is wrong?",
          options: [
            "`ssl_certificate` points at the leaf only; the intermediate certificates are missing from the chain",
            "The certificate has expired but browsers cache the old validation result",
            "TLS 1.3 is disabled, and those clients require it",
            "The private key does not match the certificate",
          ],
          correctIndex: 0,
          explanation:
            "Browsers can fetch a missing intermediate via AIA and hide the problem; `curl` and many mobile and embedded stacks cannot. `ssl_certificate` must be the full chain — leaf first, then intermediates. A key mismatch would stop nginx from starting at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-tls-config-q2",
          prompt: "Which nginx line enables HTTP/2 on a current release?",
          options: [
            "`listen 443 ssl;` plus `http2 on;`",
            "`listen 443 ssl http2;`",
            "`ssl_protocols TLSv1.2 TLSv1.3 HTTP2;`",
            "`http2_push on;`",
          ],
          correctIndex: 0,
          explanation:
            "The `http2` directive arrived in nginx 1.25.1 and the `listen … http2` parameter is deprecated. The old form still works today but produces a warning and will eventually stop; `http2` can also be set once at `http` level rather than per listen socket.",
        },
        {
          id: "proxy-tls-config-q3",
          prompt: "Which protocol versions should a new public-facing proxy offer?",
          options: [
            "TLS 1.3 and TLS 1.2 only",
            "TLS 1.3 only, since 1.2 is deprecated",
            "TLS 1.2, 1.1 and 1.0, for compatibility with older clients",
            "Whatever the distribution default is — it is always current",
          ],
          correctIndex: 0,
          explanation:
            "TLS 1.0 and 1.1 are deprecated and fail PCI and most compliance baselines; TLS 1.2 is still needed for a meaningful tail of clients. Distribution defaults vary wildly by package age, which is why an explicit `ssl_protocols` line is worth writing down.",
        },
        {
          id: "proxy-tls-config-q4",
          prompt:
            "What does the browser receive for `/downloads/report.pdf`?\n\n```nginx\nserver {\n  add_header Strict-Transport-Security \"max-age=31536000\" always;\n  add_header X-Content-Type-Options nosniff always;\n\n  location /downloads/ {\n    add_header Content-Disposition attachment;\n    root /srv;\n  }\n}\n```",
          options: [
            "`Content-Disposition` only — the location's `add_header` replaces the inherited pair",
            "All three headers",
            "The two server-level headers only",
            "All three, but HSTS is dropped because `always` is not repeated",
          ],
          correctIndex: 0,
          explanation:
            "`add_header` is inherited only when the current level defines none, so a single directive in the location discards HSTS and `nosniff` on exactly the responses you were customising. Repeat them, move them into an `include`d snippet, or use `add_header_inherit merge;` on nginx 1.29.3+.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-tls-config-q5",
          prompt: "What does the `always` parameter on `add_header` change?",
          options: [
            "The header is added to every response, including error responses such as 404 and 502, not only to successful ones",
            "It prevents the header from being overridden by the upstream",
            "It makes the header inherit into nested locations",
            "It marks the header as required, so nginx fails to start if the value is empty",
          ],
          correctIndex: 0,
          explanation:
            "Without `always`, `add_header` applies only to a specific set of success and redirect codes, so your security headers vanish on precisely the responses an attacker is probing for. It has no effect on inheritance.",
        },
        {
          id: "proxy-tls-config-q6",
          prompt: "Which security headers are reasonable to own at the reverse proxy, and which belong in the application? (Select all that apply — pick the proxy-appropriate ones.)",
          options: [
            "`Strict-Transport-Security`",
            "`X-Content-Type-Options: nosniff`",
            "A frame-ancestors / `X-Frame-Options` policy for the whole site",
            "A `Content-Security-Policy` with per-response nonces",
            "`Set-Cookie` flags for the session cookie",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "HSTS, `nosniff` and a blanket frame policy are transport- or site-wide statements the edge can make correctly. A nonce-based CSP has to be generated with the HTML, and cookie attributes are set by whatever issues the session — pushing either into proxy config creates a second source of truth that drifts.",
        },
        {
          id: "proxy-tls-config-q7",
          prompt: "Why is adding `preload` to an HSTS header a decision rather than a default?",
          options: [
            "Preloaded domains are compiled into browsers, so backing out takes months and every subdomain must serve valid HTTPS forever",
            "It requires a paid submission to the browser vendors",
            "It disables HTTP entirely, so ACME HTTP-01 validation stops working",
            "It only works with certificates from a specific set of CAs",
          ],
          correctIndex: 0,
          explanation:
            "Preloading ships your domain in the browser binary; removal propagates on the browsers' release cadence. The usual casualty is an internal subdomain on plain HTTP that becomes unreachable. HTTP-01 still works, because the redirect to HTTPS happens after the challenge path is served.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-tls-config-q8",
          prompt: "Two `server` blocks listen on `443 ssl` with different certificates. A very old client connects without SNI. What happens?",
          options: [
            "The default server's certificate is presented, so the other hostname fails validation",
            "nginx returns a 421 Misdirected Request",
            "nginx picks the certificate matching the `Host` header",
            "The handshake is refused",
          ],
          correctIndex: 0,
          explanation:
            "Certificate selection happens during the handshake, before any HTTP header exists, so without SNI nginx can only offer the default server's certificate. This is why SNI-less clients see the wrong name and why a shared multi-domain (SAN) certificate is the workaround when you still have to support them.",
        },
        {
          id: "proxy-tls-config-q9",
          prompt: "What is the effect of `ssl_session_cache shared:SSL:10m;` with `ssl_session_timeout 1h;`?",
          options: [
            "Returning clients can resume a session without a full handshake, cutting handshake CPU and a round trip",
            "Responses are cached for an hour, reducing upstream load",
            "TLS 1.3 connections are downgraded to 1.2 so they can be cached",
            "It caches OCSP responses for stapling",
          ],
          correctIndex: 0,
          explanation:
            "Session resumption reuses previously negotiated parameters, which matters most for clients that reconnect often. It is about handshakes, not about response bodies; OCSP stapling is configured separately with `ssl_stapling`.",
        },
        {
          id: "proxy-tls-config-q10",
          prompt: "How does the equivalent TLS configuration look in a Caddyfile for a public site?",
          options: [
            "There is usually nothing to write — modern protocols and ciphers are the defaults, and `tls you@example.com` only supplies an ACME contact address",
            "`tls /etc/ssl/cert.pem /etc/ssl/key.pem` is required in every site block",
            "`tls protocols tls1.2 tls1.3` must be set explicitly, as Caddy defaults to allowing TLS 1.0",
            "TLS is configured globally and cannot be set per site",
          ],
          correctIndex: 0,
          explanation:
            "Caddy ships with a modern protocol and cipher selection and manages certificates itself, so the `tls` directive is mostly for the contact email, a custom CA, DNS-challenge credentials or manually supplied certificates. It can be used globally or per site.",
        },
      ],
    },
    {
      id: "proxy-buffering-timeouts",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "Buffering, Timeouts and Why Requests Die at 60 Seconds",
      summary:
        "Almost every \"it works locally but times out in production\" report resolves to a default nobody chose. nginx's `proxy_connect_timeout`, `proxy_send_timeout` and `proxy_read_timeout` are all 60 seconds, and `client_max_body_size` is 1 MB. A report generator that takes ninety seconds and an avatar upload of 1.2 MB both fail in production and neither fails in development, because in development there is no proxy.\n\nThe three timeouts mean different things. `proxy_connect_timeout` bounds establishing the TCP connection and cannot usefully exceed 75 seconds because the kernel gives up first; exceeding it yields a `502`. `proxy_read_timeout` is the one people mean when they say \"the 60-second timeout\", and its subtlety is that it is measured **between two successive reads, not across the whole response**: an upstream that emits a byte every 30 seconds can stream for an hour without tripping it, while one that thinks silently for 61 seconds and then answers in full does trip it, yielding a `504`. That distinction is also why streaming endpoints often survive where a slow batch endpoint dies.\n\nBuffering is the other half. By default nginx reads the upstream response into memory buffers and, if it does not fit, into a temp file on disk, and only then starts writing to the client. That is what protects an application worker from a slow client — and it is also what makes a progress stream arrive as one lump at the end. Turn it off per location with `proxy_buffering off`, or let the application decide per response by sending `X-Accel-Buffering: no`. Request buffering has the mirror-image trade: `proxy_request_buffering off` lets huge uploads stream straight through instead of landing on the proxy's disk first, at the cost of holding an upstream worker for the whole transfer.\n\nWhen you raise a timeout, raise it in every layer that has one — proxy, application server, database driver — or the shortest one still wins and you have only moved the confusion.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "nginx: ngx_http_proxy_module — proxy_read_timeout", url: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout", kind: "docs" },
        { label: "Caddy: reverse_proxy — streaming and buffers", url: "https://caddyserver.com/docs/caddyfile/directives/reverse_proxy", kind: "docs" },
        { label: "NGINX Blog: Performance Tuning — Tips & Tricks", url: "https://blog.nginx.org/blog/performance-tuning-tips-tricks", kind: "article" },
      ],
      video: {
        title: "NginX Crash Course",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=hcw-NjOh8r0",
        videoId: "hcw-NjOh8r0",
        startSeconds: 6096,
        chapterLabel: "NginX BackEnd Timeouts",
        durationLabel: "2:01:21",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-buffering-timeouts-q1",
          prompt:
            "An export endpoint takes about 90 seconds. It works when called directly on port 8787 and returns `504 Gateway Time-out` through nginx, with no configuration touched. Which default is responsible?",
          options: [
            "`proxy_read_timeout`, which is 60 seconds",
            "`client_max_body_size`, which is 1 MB",
            "`keepalive_timeout`, which is 75 seconds",
            "`proxy_connect_timeout`, which is 60 seconds",
          ],
          correctIndex: 0,
          explanation:
            "504 means the proxy gave up waiting for the upstream response, which is `proxy_read_timeout`. `proxy_connect_timeout` failures produce 502 and happen at connection time; body size limits produce 413; `keepalive_timeout` governs idle client connections.",
        },
        {
          id: "proxy-buffering-timeouts-q2",
          prompt:
            "`proxy_read_timeout 60s;` is set. An upstream streams a response for 10 minutes, writing a chunk every 20 seconds. Does the request survive?",
          options: [
            "Yes — the timeout applies between two successive reads, and no gap exceeds 60 seconds",
            "No — it is a total limit on the response and trips at 60 seconds",
            "No — streaming responses ignore the timeout and are cut at `send_timeout` instead",
            "Only if `proxy_buffering` is off",
          ],
          correctIndex: 0,
          explanation:
            "The documented semantics are per-read, not cumulative, so a steady trickle keeps the connection alive indefinitely. Conversely an upstream that is silent for 61 seconds while computing trips it even though it would have answered at second 62 — which is the shape of most 504s.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-buffering-timeouts-q3",
          prompt: "Users report that uploads fail at just over 1 MB with a `413` from nginx. Which directive must change, and where?",
          options: [
            "`client_max_body_size`, in `http`, `server` or the specific `location`",
            "`proxy_max_temp_file_size`, in `http`",
            "`client_body_timeout`, in `server`",
            "`proxy_buffers`, in the upload `location`",
          ],
          correctIndex: 0,
          explanation:
            "`client_max_body_size` defaults to 1m and rejects larger bodies with 413 before the request ever reaches the upstream. Scope it to the upload path rather than raising it globally, and remember the application framework usually has its own limit that must move too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-buffering-timeouts-q4",
          prompt: "What is nginx doing by default with a large response from an upstream?",
          options: [
            "Reading it into `proxy_buffers`, spilling to a temp file on disk if it does not fit, and writing to the client from there",
            "Streaming each packet straight through to the client as it arrives",
            "Holding the whole response in memory, regardless of size",
            "Compressing it before forwarding, to reduce buffer pressure",
          ],
          correctIndex: 0,
          explanation:
            "`proxy_buffering on` is the default. Buffering frees the upstream worker as fast as the network between proxy and app allows, which is the main reason to have a proxy at all — but a busy server with large responses can end up doing significant disk I/O under `proxy_temp_path`.",
        },
        {
          id: "proxy-buffering-timeouts-q5",
          prompt: "Which are true about nginx buffering? (Select all that apply.)",
          options: [
            "An upstream can disable buffering for one response by sending `X-Accel-Buffering: no`",
            "`proxy_buffering off` makes nginx forward the response as it arrives, using only `proxy_buffer_size`",
            "`proxy_request_buffering off` streams the request body to the upstream instead of buffering it first",
            "Turning buffering off reduces the risk of slow-client attacks",
            "Buffering is disabled automatically whenever the response has no `Content-Length`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The upstream can opt out per response, `proxy_buffering off` switches to synchronous forwarding, and request buffering has its own switch. Turning buffering off *increases* slow-client exposure — the upstream worker now waits on the client — and nginx does not infer anything from a missing `Content-Length` (Caddy does).",
        },
        {
          id: "proxy-buffering-timeouts-q6",
          prompt: "A request returns `502 Bad Gateway` after about one second, repeatedly. Which cause fits best?",
          options: [
            "The upstream refused the connection or died mid-response — nothing was listening, or the process crashed",
            "The upstream took longer than `proxy_read_timeout` to respond",
            "The request body exceeded `client_max_body_size`",
            "The client disconnected before the response was complete",
          ],
          correctIndex: 0,
          explanation:
            "A fast, consistent 502 is the signature of connection refused or an immediate upstream failure — check that the app is listening on the address and port nginx is proxying to. A timeout would take the configured number of seconds and produce 504; an oversized body produces 413; a client disconnect is logged as 499.",
        },
        {
          id: "proxy-buffering-timeouts-q7",
          prompt: "Why does raising `proxy_connect_timeout` to 300 seconds rarely help?",
          options: [
            "The documented limit is that it cannot usually exceed about 75 seconds, because the operating system's own TCP connect timeout expires first",
            "nginx caps it at 60 seconds and ignores larger values",
            "It only applies to HTTPS upstreams",
            "Connection establishment is instantaneous on loopback, so the value is never used",
          ],
          correctIndex: 0,
          explanation:
            "The kernel abandons the SYN retries before nginx's timer fires, so the larger value is unreachable. If connecting is slow, the problem is the network, the listen backlog or DNS — not the timeout.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-buffering-timeouts-q8",
          prompt:
            "A team raises `proxy_read_timeout` to 300s for a long report, and it still fails at roughly 120 seconds with a 502. What is the most likely explanation?",
          options: [
            "Another layer has its own shorter timeout — the application server, a load balancer in front, or the database client",
            "`proxy_read_timeout` silently caps at 120 seconds",
            "The response exceeded `proxy_buffers` and nginx aborted",
            "The browser gave up, and nginx logged it as a 502",
          ],
          correctIndex: 0,
          explanation:
            "Timeouts compose by minimum: gunicorn's `--timeout`, an ALB idle timeout and a driver's statement timeout will each happily kill the request regardless of nginx. A browser giving up shows as 499 in nginx's log, not 502.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-buffering-timeouts-q9",
          prompt: "What is the better fix for an endpoint that genuinely needs five minutes of work?",
          options: [
            "Return 202 with a job id immediately and let the client poll or subscribe, keeping request timeouts short",
            "Raise every timeout in the stack to 600 seconds",
            "Turn off `proxy_buffering` so the connection stays active",
            "Move the endpoint to HTTP/2, which has no request timeout",
          ],
          correctIndex: 0,
          explanation:
            "A five-minute synchronous HTTP request is fragile by construction: any proxy reload, deploy, mobile network change or idle timeout loses the work. Making it a job with a status endpoint removes the dependency on every timeout in the chain. HTTP/2 does not change any of this.",
        },
      ],
    },
    {
      id: "proxy-websockets-sse",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "WebSockets and SSE Through a Proxy",
      summary:
        "Long-lived connections break the assumptions a reverse proxy makes by default, and they break them quietly: the handshake succeeds, the first bytes arrive, and then the feature is just... late, or gone after a minute.\n\nWebSockets need an explicit opt-in in nginx. The upgrade mechanism is HTTP/1.1-only and nginx talks HTTP/1.0 to upstreams by default, so you must set `proxy_http_version 1.1` and forward the `Upgrade` and `Connection` headers. The idiomatic form uses a `map` on `$http_upgrade` rather than hard-coding `Connection \"upgrade\"`, because a hard-coded value breaks ordinary requests that share the location. Then remember that `proxy_read_timeout` applies to an idle socket: a chat connection with no traffic for 60 seconds is closed by the proxy, which is why application-level ping/pong or a raised timeout is not optional.\n\nServer-sent events fail differently and more confusingly. There is no upgrade, no error, and nothing in the logs — the response is simply buffered. Events pile up in the proxy's buffers and arrive in a batch when the buffer fills or the stream ends, so a live feed appears to work in development and arrives minutes late in production. In nginx the fixes are `proxy_buffering off` in that location, or `X-Accel-Buffering: no` from the application so the decision travels with the response. In Caddy the knob is `flush_interval -1` on `reverse_proxy` — which is exactly what this repository's `Caddyfile.example` sets on `/api/admin/live/stream`, because without it the admin's live integrity feed arrives as a late batch. Current Caddy also flushes immediately on its own when the response carries `Content-Type: text/event-stream` or has no `Content-Length`, so the explicit setting is belt-and-braces that also covers streams the app does not label as SSE.\n\nAnd if you load-balance either of these across several upstreams, the connection is pinned for its whole life — so capacity planning is about concurrent sockets, not requests per second.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "nginx: WebSocket proxying", url: "https://nginx.org/en/docs/http/websocket.html", kind: "docs" },
        { label: "Caddy: reverse_proxy — streaming", url: "https://caddyserver.com/docs/caddyfile/directives/reverse_proxy", kind: "docs" },
        { label: "MDN: Using server-sent events", url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events", kind: "docs" },
        { label: "RFC 6455: The WebSocket Protocol", url: "https://www.rfc-editor.org/info/rfc6455/", kind: "spec" },
      ],
      video: {
        title: "Proxying WebSockets with NGINX",
        channel: "Juriy Bura",
        url: "https://www.youtube.com/watch?v=zutCD7HMgwA",
        videoId: "zutCD7HMgwA",
        durationLabel: "8:25",
      },
      alternateVideos: [
        {
          title: "Server-Sent Events Crash Course",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=4HlNv1qpZFY",
          videoId: "4HlNv1qpZFY",
          startSeconds: 300,
          chapterLabel: "Server Sent Events",
          durationLabel: "29:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-websockets-sse-q1",
          prompt:
            "A WebSocket endpoint works locally but returns `400` through nginx with this configuration. What is missing?\n\n```nginx\nlocation /ws {\n  proxy_pass http://app:8787;\n}\n```",
          options: [
            "`proxy_http_version 1.1;` plus forwarding of the `Upgrade` and `Connection` headers",
            "`proxy_buffering off;`",
            "`proxy_read_timeout 3600s;`",
            "A `map` of `$http_upgrade` is required even when the headers are set explicitly",
          ],
          correctIndex: 0,
          explanation:
            "nginx speaks HTTP/1.0 to upstreams by default and drops hop-by-hop headers, so the upgrade request never reaches the app as an upgrade. Buffering and timeouts matter once the socket is open, but the handshake fails first.",
        },
        {
          id: "proxy-websockets-sse-q2",
          prompt: "Why is the `map` form preferred over hard-coding `proxy_set_header Connection \"upgrade\";`?",
          options: [
            "`Connection: upgrade` would then be sent on ordinary non-WebSocket requests in the same location, which breaks keepalive and confuses some upstreams",
            "`map` is faster, because it is evaluated at configuration load rather than per request",
            "nginx forbids literal values in `proxy_set_header`",
            "Without `map`, the `Upgrade` header is not forwarded at all",
          ],
          correctIndex: 0,
          explanation:
            "The documented pattern maps `$http_upgrade` to `upgrade` when present and to `close` otherwise, so plain HTTP requests through the same location keep sane connection semantics. Hard-coding works only if the location serves nothing but WebSockets.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-websockets-sse-q3",
          prompt: "A WebSocket connects fine, then drops after about a minute whenever the user is idle. Which setting explains it?",
          options: [
            "`proxy_read_timeout` — an idle socket produces no reads, so the 60-second default expires",
            "`keepalive_timeout` — it governs upgraded connections too",
            "`client_body_timeout` — the client sends no body after the handshake",
            "`proxy_connect_timeout` — the connection is re-established periodically",
          ],
          correctIndex: 0,
          explanation:
            "Once upgraded, the tunnel is just bytes, and no bytes means no reads. Either raise `proxy_read_timeout` for that location or have the application send periodic pings — the second is better, because it also detects genuinely dead peers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-websockets-sse-q4",
          prompt:
            "An admin dashboard subscribes to an SSE endpoint. Warnings appear in the browser minutes late, in a batch, with no errors anywhere. What is happening?",
          options: [
            "The proxy is buffering the response, so events are only delivered when a buffer fills or the stream ends",
            "The `EventSource` client batches events until the connection closes",
            "The upgrade to a streaming connection failed and the browser fell back to polling",
            "Events are being dropped and re-sent by the proxy's retry logic",
          ],
          correctIndex: 0,
          explanation:
            "SSE is an ordinary HTTP response that never ends, so a buffering proxy treats it like any other body and holds it. Nothing errors, which is what makes this so hard to spot — the feature works, just uselessly late.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-websockets-sse-q5",
          prompt: "Which of these will make an SSE stream flush promptly through a proxy? (Select all that apply.)",
          options: [
            "`proxy_buffering off;` in the nginx location that serves the stream",
            "The application sending `X-Accel-Buffering: no` on the response",
            "`flush_interval -1` inside Caddy's `reverse_proxy` block",
            "Setting `Content-Length` on the streaming response",
            "Switching the endpoint to HTTP/2, which disables proxy buffering",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are the supported switches — two in nginx (one in config, one delegated to the app) and one in Caddy. A `Content-Length` on an endless stream is wrong and would make matters worse, and HTTP/2 changes framing, not the proxy's buffering policy.",
        },
        {
          id: "proxy-websockets-sse-q6",
          prompt:
            "This project's `Caddyfile.example` gives `/api/admin/live/stream` its own `handle` block with `flush_interval -1`. Given that current Caddy already flushes immediately for `Content-Type: text/event-stream`, is the setting redundant?",
          options: [
            "No — it is explicit rather than dependent on the upstream labelling the response correctly, and it also covers other unlabelled streaming responses on that path",
            "Yes — it has no effect at all on a modern Caddy and should be removed",
            "No — without it, Caddy would not proxy the route at all",
            "Yes, but only because the route is under `/api`, which Caddy never buffers",
          ],
          correctIndex: 0,
          explanation:
            "Caddy's auto-flush depends on the response, so it silently stops applying if the content type changes or the app streams NDJSON instead. Pinning the behaviour in config makes the requirement visible to whoever edits it next — the comment in that file exists for the same reason.",
        },
        {
          id: "proxy-websockets-sse-q7",
          prompt: "What happens to WebSocket connections when Caddy's configuration is reloaded?",
          options: [
            "They are closed by default, because each request holds a reference to its config; `stream_close_delay` can postpone this",
            "They survive indefinitely, because the reload only affects new connections",
            "They are transparently migrated to the new configuration",
            "The reload is refused while any WebSocket is open",
          ],
          correctIndex: 0,
          explanation:
            "Holding old configs alive for open streams would leak memory, so Caddy closes them with a Close control message. `stream_close_delay` gives clients a grace period, which avoids a thundering herd of reconnects after every deploy.",
        },
        {
          id: "proxy-websockets-sse-q8",
          prompt: "You load-balance WebSockets across three application instances with plain round-robin. What should you expect?",
          options: [
            "Each connection is pinned to one instance for its lifetime, so capacity is about concurrent sockets and a restart disconnects everyone on that instance",
            "Frames are distributed across instances, so any instance can handle any message",
            "The proxy re-balances long-lived connections when an instance becomes busy",
            "Round-robin cannot be used with WebSockets; only `ip_hash` works",
          ],
          correctIndex: 0,
          explanation:
            "Balancing happens once, at the upgrade. Anything the connection needs — session state, a pub/sub subscription — lives on that one instance, which is why WebSocket backends usually need a shared bus and why rolling deploys must account for reconnect storms.",
        },
        {
          id: "proxy-websockets-sse-q9",
          prompt: "Over HTTP/1.1, what practical limit do browsers impose on SSE connections, and how does HTTP/2 change it?",
          options: [
            "Roughly six connections per origin, shared with all other requests; HTTP/2 multiplexes streams over one connection and effectively removes the limit",
            "One SSE connection per origin under both versions",
            "No limit under HTTP/1.1; HTTP/2 introduces a limit of 100 streams",
            "The limit applies per tab, so it is never reached in practice",
          ],
          correctIndex: 0,
          explanation:
            "Under HTTP/1.1 a handful of open SSE streams across several tabs can consume the whole per-origin budget and stall normal requests — a real and confusing production symptom. HTTP/2's multiplexing is the fix, which means the proxy's protocol configuration matters for SSE more than people expect.",
        },
      ],
    },
    {
      id: "proxy-static-compression-cache",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "Static Files, Compression and Cache Headers",
      summary:
        "Serving static assets is the cheapest win a reverse proxy gives you: files go straight from the page cache to the socket without waking your application, and the right headers stop the browser asking at all.\n\nThe cache policy that matters is two-tier, and it depends on your build producing content-hashed filenames. Hashed assets can never change under a given name, so they get `Cache-Control: public, max-age=31536000, immutable` — `immutable` additionally tells the browser not to revalidate even on a reload. `index.html` is the opposite: it is the file that names the new hashes, so it must be `no-cache` (revalidate every time) or the browser will keep booting last week's app from a perfectly valid cache. Getting this backwards is the single most common cause of \"users are on the old version and a hard refresh fixes it\". This repository's `Caddyfile.example` does exactly this split, matching hashed assets with a `path_regexp` and giving only those the one-year immutable header.\n\nCompression is nearly free but has three sharp edges. nginx's `gzip_types` *adds* to `text/html`, which is always compressed — listing it again is harmless but listing only `application/json` still leaves HTML compressed. `gzip_vary on` is needed so caches key on `Accept-Encoding`, or a proxy can serve a gzipped body to a client that did not ask. And compressing responses that mix attacker-influenced input with secrets over TLS is the BREACH attack, which is why you do not blanket-compress authenticated API responses containing CSRF tokens. Caddy's `encode` supports gzip and zstd on the fly (Brotli only for pre-compressed files), and `encode zstd gzip` is the sensible default.\n\nFor an SPA, `try_files $uri $uri/ /index.html;` is what makes a deep link survive a refresh. And `root` versus `alias` is the classic trap: `root` appends the whole URI to the path, `alias` replaces the matched location prefix — mixing them up turns `/static/app.css` into `/srv/static/static/app.css`.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "nginx: ngx_http_gzip_module", url: "https://nginx.org/en/docs/http/ngx_http_gzip_module.html", kind: "docs" },
        { label: "Caddy: encode (Caddyfile directive)", url: "https://caddyserver.com/docs/caddyfile/directives/encode", kind: "docs" },
        { label: "MDN: HTTP caching", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching", kind: "docs" },
        { label: "NGINX Blog: A Guide to Caching with NGINX", url: "https://blog.nginx.org/blog/nginx-caching-guide", kind: "article" },
      ],
      video: {
        title: "NGINX Complete Course: Reverse Proxy, Load Balancing, HTTPS & Docker",
        channel: "Sarvin Style Coding",
        url: "https://www.youtube.com/watch?v=-sY9OBgohX0",
        videoId: "-sY9OBgohX0",
        startSeconds: 5512,
        chapterLabel: "HTTP Caching",
        durationLabel: "2:08:17",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-static-compression-cache-q1",
          prompt: "A Vite build emits `assets/index-B7f3xQ2a.js` and `index.html`. What cache headers should each get?",
          options: [
            "One year `immutable` for the hashed asset; `no-cache` for `index.html`",
            "One year `immutable` for both — they are deployed together",
            "`no-cache` for both, so users always get the latest build",
            "`no-store` for the hashed asset; one year for `index.html`",
          ],
          correctIndex: 0,
          explanation:
            "The hash is the version, so that exact URL can be cached forever. `index.html` is the pointer that names the new hashes; caching it means users keep booting the previous build even though the new assets are sitting on the CDN.",
        },
        {
          id: "proxy-static-compression-cache-q2",
          prompt: "What does `immutable` add on top of `max-age=31536000`?",
          options: [
            "It tells the browser not to send a revalidation request even when the user reloads the page",
            "It prevents the file from being evicted from the cache",
            "It makes the response cacheable by shared proxies as well as the browser",
            "It is an alias for `max-age=31536000` kept for older browsers",
          ],
          correctIndex: 0,
          explanation:
            "Without `immutable`, a reload triggers conditional requests for every fresh asset — cheap 304s, but a round trip each. `public` is what allows shared caching, and nothing stops eviction under memory pressure.",
        },
        {
          id: "proxy-static-compression-cache-q3",
          prompt: "`gzip on; gzip_types application/json;` is set. Which responses get compressed?",
          options: [
            "`application/json` and `text/html` — `text/html` is always compressed and `gzip_types` adds to it",
            "`application/json` only",
            "Everything, because `gzip on` enables compression for all types",
            "Nothing, until `gzip_min_length` is also lowered",
          ],
          correctIndex: 0,
          explanation:
            "The documentation is explicit that responses of type `text/html` are always compressed and `gzip_types` lists additional types. The default `gzip_min_length` of 20 bytes is low enough not to matter here — but CSS and JS are *not* compressed under this config, which is the usual real bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-static-compression-cache-q4",
          prompt: "Why does `gzip_vary on;` matter when a shared cache or CDN sits in front?",
          options: [
            "It emits `Vary: Accept-Encoding`, so the cache stores compressed and uncompressed variants separately instead of serving a gzipped body to a client that cannot decode it",
            "It makes nginx vary the compression level with response size",
            "It disables compression for clients that did not send `Accept-Encoding`",
            "It adds an `ETag` derived from the encoding",
          ],
          correctIndex: 0,
          explanation:
            "Without the `Vary` header a cache may key only on the URL and hand a gzipped body to a client that asked for identity. nginx always honours `Accept-Encoding` itself; the header exists for everything downstream of it.",
        },
        {
          id: "proxy-static-compression-cache-q5",
          prompt:
            "What does this serve for `GET /static/app.css`?\n\n```nginx\nlocation /static/ {\n  root /srv/assets/;\n}\n```",
          options: [
            "`/srv/assets/static/app.css` — `root` appends the full URI to the path",
            "`/srv/assets/app.css` — `root` replaces the matched prefix",
            "`/srv/assets/` — the URI is ignored for `root`",
            "A 403, because `root` requires a trailing `try_files`",
          ],
          correctIndex: 0,
          explanation:
            "`root` concatenates path plus URI; `alias` replaces the matched location prefix, so `alias /srv/assets/;` would give `/srv/assets/app.css`. Mixing them up produces the doubled directory that every nginx user meets once.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-static-compression-cache-q6",
          prompt: "Which statements about serving an SPA behind a proxy are true? (Select all that apply.)",
          options: [
            "`try_files $uri $uri/ /index.html;` lets a deep link survive a page refresh",
            "The HTML entry point and the hashed assets need different cache policies",
            "The fallback re-enters location matching for `/index.html`",
            "`try_files` makes the proxy render the client-side route server-side",
            "A missing asset will be served as `index.html` with a 200, which can mask deploy errors",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "The first three are how the fallback works, and the last is its cost: a typo'd script URL returns HTML with a 200 and the browser fails with a confusing MIME error. Nothing here renders anything server-side.",
        },
        {
          id: "proxy-static-compression-cache-q7",
          prompt: "Why is blanket compression of authenticated HTML or JSON responses over TLS a security concern?",
          options: [
            "BREACH: compression ratios leak information about secrets in the body when an attacker can influence part of it",
            "Compressed responses cannot be signed, so integrity is lost",
            "gzip's CRC is predictable, which allows the ciphertext to be forged",
            "Compression happens before encryption, which disables forward secrecy",
          ],
          correctIndex: 0,
          explanation:
            "If a response contains both a secret (a CSRF token) and attacker-controlled text, the compressed length becomes an oracle. Mitigations are to exclude such responses from compression, mask the token per response, or rely on other CSRF defences — not to abandon compression everywhere.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-static-compression-cache-q8",
          prompt: "What does `encode zstd gzip` do in a Caddyfile?",
          options: [
            "Enables on-the-fly Zstandard and gzip, choosing by the client's `Accept-Encoding` and preferring zstd when the client has no preference",
            "Applies zstd first and then gzip to the same body",
            "Enables Brotli, gzip and zstd — `zstd` is Caddy's alias for the whole set",
            "Pre-compresses files on disk at start-up",
          ],
          correctIndex: 0,
          explanation:
            "Caddy negotiates per request and, absent a q-factor preference, uses the first listed encoding. Brotli is only served from pre-compressed files, not generated on the fly, which is a deliberate trade against CPU cost.",
        },
      ],
    },
    {
      id: "proxy-rate-limiting",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "Rate Limiting and Connection Limits at the Edge",
      summary:
        "Limiting at the proxy is cheap in a way limiting in the application never is: a rejected request costs a few microseconds and no database connection, no ORM session and no application worker. That is the whole argument for doing it here, and it is also the boundary of what the edge can do — it can protect capacity, but it cannot enforce a per-account quota it has no way to look up.\n\nnginx's `limit_req` implements a leaky bucket over a shared-memory zone. `limit_req_zone $binary_remote_addr zone=login:10m rate=10r/s;` does not mean \"ten per second in any second\" — it means one request every 100 ms, and an eleventh request arriving in the same millisecond is rejected outright unless `burst` allows queueing. `burst=20` queues up to twenty excess requests and releases them at the configured rate, which smooths bursts at the cost of latency; adding `nodelay` forwards those twenty immediately while still consuming bucket capacity, which is usually what you want for an interactive API. The default rejection status is `503`, which most teams change to `429` with `limit_req_status 429;` so clients can tell throttling from an outage. Sizing is mechanical: one megabyte of zone holds roughly 16,000 states.\n\n`limit_conn` is the sibling that bounds concurrency rather than rate, and it is the better tool against a handful of clients holding many slow downloads open.\n\nThe key that everything hangs on is the client identity, and getting it wrong fails in both directions. Key on `$binary_remote_addr` when you are the outermost proxy. Key on a forwarded header and you have made your limiter bypassable by anyone who sets that header — unless the `realip` module has already replaced `$remote_addr` from a trusted peer. And key on an address that is really a CDN or a corporate NAT and you will rate-limit an entire office as one user. Validate the rule before enforcing it: `limit_req_dry_run on;` logs what would have been rejected without rejecting anything.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "nginx: ngx_http_limit_req_module", url: "https://nginx.org/en/docs/http/ngx_http_limit_req_module.html", kind: "docs" },
        { label: "nginx: ngx_http_limit_conn_module", url: "https://nginx.org/en/docs/http/ngx_http_limit_conn_module.html", kind: "docs" },
        { label: "NGINX Blog: Rate Limiting with NGINX", url: "https://blog.nginx.org/blog/rate-limiting-nginx", kind: "article" },
      ],
      video: {
        title: "How to add rate limiting in Ngnix",
        channel: "Hitesh Choudhary",
        url: "https://www.youtube.com/watch?v=TfZlXBHtyzE",
        videoId: "TfZlXBHtyzE",
        durationLabel: "12:05",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-rate-limiting-q1",
          prompt:
            "With `limit_req_zone … rate=10r/s;` and `limit_req zone=api;` (no `burst`), a client sends 10 requests in the same millisecond. How many are served?",
          options: [
            "One — `10r/s` means one request every 100 ms, and there is no burst allowance",
            "All ten — the limit is evaluated per whole second",
            "Ten, then the eleventh in that second is rejected",
            "None — the burst parameter is mandatory",
          ],
          correctIndex: 0,
          explanation:
            "The leaky bucket refills continuously, so the rate is really an inter-arrival interval. Without `burst` the other nine get the rejection status immediately, which is why a bare `limit_req` almost always looks broken on a page that fires several parallel API calls.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-rate-limiting-q2",
          prompt: "What does adding `nodelay` to `limit_req zone=api burst=20 nodelay;` change?",
          options: [
            "The 20 burst slots are forwarded immediately instead of being paced out, while still consuming bucket capacity that refills at the configured rate",
            "It removes the burst limit entirely",
            "It rejects excess requests instead of queueing them",
            "It delays only the first request of each burst",
          ],
          correctIndex: 0,
          explanation:
            "Without `nodelay`, queued requests are released at the rate, so a burst of 20 at 10r/s adds up to two seconds of latency. With it, they go straight through and the slots refill over time — much better for interactive traffic, and still bounded.",
        },
        {
          id: "proxy-rate-limiting-q3",
          prompt: "An nginx edge rate-limits by `$http_x_forwarded_for` and is directly internet-facing. Why is this ineffective?",
          options: [
            "The header is supplied by the client, so an attacker can vary it per request and get a fresh bucket every time",
            "nginx cannot use request headers as a `limit_req_zone` key",
            "The value includes a port number, so the key is never stable",
            "It works, but only for IPv4 clients",
          ],
          correctIndex: 0,
          explanation:
            "Keying on attacker-controlled input is keying on nothing. Either key on `$binary_remote_addr`, or configure the `realip` module with `set_real_ip_from` for the proxies you actually trust so that `$remote_addr` becomes the real client before the limiter reads it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-rate-limiting-q4",
          prompt: "Roughly how many distinct clients does `zone=login:10m` track when keyed on `$binary_remote_addr`?",
          options: [
            "About 160,000 — one megabyte holds around 16,000 states",
            "About 10,000 — one state per kilobyte",
            "Unlimited; the size only bounds the log buffer",
            "Exactly 10 million, one byte per client",
          ],
          correctIndex: 0,
          explanation:
            "The documentation gives roughly 16,000 64-byte states per megabyte on 64-bit platforms. When the zone fills, nginx evicts the oldest entries and may start returning errors, so sizing it for your real client population matters.",
        },
        {
          id: "proxy-rate-limiting-q5",
          prompt: "Which statements about nginx rate limiting are true? (Select all that apply.)",
          options: [
            "The default rejection status is 503, and `limit_req_status 429;` is the usual change",
            "`limit_req_dry_run on;` logs what would be limited without rejecting anything",
            "`limit_conn` bounds concurrent connections rather than request rate",
            "Limits are shared across worker processes only if `limit_req_zone` is declared per worker",
            "A `limit_req_zone` may be declared inside a `location`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "503 is the documented default, dry run exists precisely for validating a rule before enforcing it, and `limit_conn` is the concurrency sibling. The zone is shared memory across all workers by construction, and `limit_req_zone` is an `http`-context directive — only `limit_req` goes in a `server` or `location`.",
        },
        {
          id: "proxy-rate-limiting-q6",
          prompt: "Which limit best defends against a small number of clients each holding many slow downloads open?",
          options: [
            "`limit_conn` on a per-address zone, bounding simultaneous connections",
            "`limit_req` with a low rate and no burst",
            "`limit_rate`, which caps per-connection bandwidth",
            "`client_body_timeout`, which closes idle uploads",
          ],
          correctIndex: 0,
          explanation:
            "The resource being exhausted is connection slots, not request rate — each client may issue only one request. `limit_rate` shapes bandwidth per connection and can even prolong the problem; timeouts only help once a connection goes idle.",
        },
        {
          id: "proxy-rate-limiting-q7",
          prompt: "You run three nginx instances behind a cloud load balancer, each with `rate=10r/s` keyed on client IP. What is the effective limit per client?",
          options: [
            "Up to 30r/s, because each instance keeps its own shared-memory zone",
            "10r/s, because the load balancer keeps a client on one instance",
            "10r/s, because nginx synchronises zones over the network",
            "Unbounded, because the key differs per instance",
          ],
          correctIndex: 0,
          explanation:
            "Zones are per-process-group and local to a host; open-source nginx has no cross-instance synchronisation. Either divide the rate by the instance count, pin clients with a hash policy, or move the authoritative limit to a shared store such as Redis.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-rate-limiting-q8",
          prompt: "Which limits still belong in the application even with a well-configured edge?",
          options: [
            "Per-account or per-API-key quotas, and anything that depends on who the caller is after authentication",
            "Nothing — the proxy is strictly more capable",
            "All of them; the proxy layer should be removed to avoid double counting",
            "Only limits on write endpoints",
          ],
          correctIndex: 0,
          explanation:
            "The proxy knows an address and a path; it does not know that this bearer token belongs to a trial account with 1,000 calls a month. The edge protects capacity, the application enforces the business rule, and the two answer different questions.",
        },
        {
          id: "proxy-rate-limiting-q9",
          prompt:
            "After enabling `limit_req` on `/api/`, a single office reports being throttled constantly while individual home users are fine. What is the most likely cause?",
          options: [
            "The whole office shares one public address through NAT, so they all land in one bucket",
            "The zone is too small and their entries are being evicted",
            "Their browser is sending a forged `X-Forwarded-For`",
            "`nodelay` is missing, so their requests queue behind each other",
          ],
          correctIndex: 0,
          explanation:
            "IP is a proxy for identity and a poor one: corporate NAT, carrier-grade NAT and CDNs all collapse many users into one key. Where you can identify the caller — an API key or session — key on that for authenticated routes and keep the IP limit as a floor.",
        },
      ],
    },
    {
      id: "proxy-load-balancing",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "Load Balancing and Upstream Health",
      summary:
        "An `upstream` block with two servers in it is a load balancer, and the defaults decide a surprising amount. nginx's default policy is weighted round-robin; `least_conn` sends each request to the server with the fewest active connections and is the better default when request durations vary; `ip_hash` and the generic `hash … consistent` pin a client to a server, which you want for naive session affinity and do not want when your clients arrive through a CDN and all hash to the same bucket. `random two least_conn` implements the \"power of two choices\" — sample two servers, pick the less busy — which gets most of `least_conn`'s benefit without a global view, and is the policy of choice across many proxy instances.\n\nHealth checking is where open-source nginx surprises people. It only does **passive** checks: `max_fails` (default 1) failures within `fail_timeout` (default 10 seconds) mark a server unavailable for that same period, and the failures are discovered by real user requests failing. Active background probing — `health_check` with `match` blocks — lives in `ngx_http_upstream_hc_module`, which is part of the commercial subscription. Caddy, by contrast, ships active health checks for free: set `health_uri` and it probes on a timer (default every 30 seconds). Caddy's default policy is also `random`, not round-robin, which catches people migrating configs across.\n\nTwo details worth internalising. First, `keepalive 32;` in an upstream block is often the single biggest latency win available, but it does nothing unless you also set `proxy_http_version 1.1;` and `proxy_set_header Connection \"\";` — otherwise nginx closes each upstream connection and you pay a handshake per request. Second, `proxy_next_upstream` retries failed requests on the next server, and by default that includes requests that already ran: if a `POST` timed out after the upstream charged a card, the retry charges it again. Restrict retries to idempotent methods, or to `error`/`timeout` before any response was received.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "nginx: Using nginx as HTTP load balancer", url: "https://nginx.org/en/docs/http/load_balancing.html", kind: "docs" },
        { label: "nginx: ngx_http_upstream_module", url: "https://nginx.org/en/docs/http/ngx_http_upstream_module.html", kind: "docs" },
        { label: "Caddy: reverse_proxy — load balancing and health checks", url: "https://caddyserver.com/docs/caddyfile/directives/reverse_proxy", kind: "docs" },
      ],
      video: {
        title: "NGINX Tutorial for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=9t9Mp0BGnyI",
        videoId: "9t9Mp0BGnyI",
        startSeconds: 2273,
        chapterLabel: "NGINX as a Load Balancer",
        durationLabel: "51:03",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-load-balancing-q1",
          prompt: "An `upstream` block lists three servers and specifies no method. How are requests distributed?",
          options: [
            "Weighted round-robin — nginx's default",
            "Least connections",
            "Randomly, with equal probability",
            "All to the first server until it fails",
          ],
          correctIndex: 0,
          explanation:
            "Round-robin (respecting `weight=`) is nginx's default. Worth remembering when translating a config to Caddy, whose default `lb_policy` is `random`.",
        },
        {
          id: "proxy-load-balancing-q2",
          prompt: "A backend has a mix of 5 ms lookups and 4-second reports. Which policy handles it best, and why?",
          options: [
            "`least_conn` — a server stuck on a long report has more active connections and stops receiving new work",
            "`ip_hash` — it keeps each client's long requests on one server",
            "Round-robin — even distribution is optimal when durations vary",
            "`hash $request_uri consistent` — it routes reports and lookups to different servers",
          ],
          correctIndex: 0,
          explanation:
            "Round-robin counts requests, not work, so it will keep feeding a server that is busy with a slow report. `least_conn` uses active connections as a live proxy for load. Hashing by URI would help only if the split were known and stable, and `ip_hash` addresses a different problem entirely.",
        },
        {
          id: "proxy-load-balancing-q3",
          prompt: "Traffic reaches nginx through a CDN, and `ip_hash` is configured for session affinity. What goes wrong?",
          options: [
            "Every request appears to come from a handful of CDN addresses, so almost all traffic hashes onto one or two upstreams",
            "`ip_hash` is incompatible with HTTPS and falls back to round-robin",
            "Sessions break, because `ip_hash` rehashes on every request",
            "Nothing — `ip_hash` reads `X-Forwarded-For` automatically",
          ],
          correctIndex: 0,
          explanation:
            "`ip_hash` hashes `$remote_addr`, which behind a CDN is the CDN. Either restore the real address with the `realip` module first, or switch to `hash` on a value that actually identifies the client — or, better, make the application stateless so affinity is unnecessary.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-load-balancing-q4",
          prompt: "What does open-source nginx do when an upstream server starts refusing connections?",
          options: [
            "After `max_fails` failures within `fail_timeout` (1 failure in 10 seconds by default) it stops sending traffic there for `fail_timeout`, then tries again",
            "A background health check detects it within seconds and removes it from rotation",
            "It removes it permanently until the configuration is reloaded",
            "Nothing — failures are returned to the client and the server keeps its share",
          ],
          correctIndex: 0,
          explanation:
            "Open-source nginx is passive: it learns from real requests failing, so some users see errors before the server is taken out. Active probing (`health_check`) is in the commercial `ngx_http_upstream_hc_module`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-load-balancing-q5",
          prompt: "Which of these are true of load balancing in open-source nginx and in Caddy? (Select all that apply.)",
          options: [
            "Caddy provides active health checks (`health_uri`) without a paid tier",
            "nginx's default policy is round-robin, Caddy's is random",
            "nginx's `backup` servers receive traffic only when the primaries are unavailable",
            "nginx's `health_check` directive is available in the open-source build",
            "`least_conn` in nginx requires a shared memory `zone` to work at all",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Caddy's free active checks and the differing defaults are two of the most practical differences between the two. `health_check` is commercial-only, and `least_conn` works without a `zone` — a `zone` is what makes state shared across worker processes and enables the commercial runtime API.",
        },
        {
          id: "proxy-load-balancing-q6",
          prompt:
            "Upstream keepalive is configured but nginx still opens a new connection per request. What is missing?\n\n```nginx\nupstream app { server 127.0.0.1:8787; keepalive 32; }\nlocation / { proxy_pass http://app; }\n```",
          options: [
            "`proxy_http_version 1.1;` and `proxy_set_header Connection \"\";`",
            "`keepalive_timeout` inside the upstream block",
            "`proxy_buffering off;`",
            "A `zone` directive in the upstream block",
          ],
          correctIndex: 0,
          explanation:
            "nginx talks HTTP/1.0 with `Connection: close` to upstreams by default, so the pool is populated and immediately discarded. Both lines are required, and forgetting them is one of the most common causes of unexplained upstream latency and port exhaustion.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-load-balancing-q7",
          prompt: "Why is the default `proxy_next_upstream` behaviour risky for `POST` requests?",
          options: [
            "A request that timed out may already have been processed, so retrying it on another server can duplicate a side effect",
            "`POST` bodies are not buffered, so the retry sends an empty body",
            "Retries bypass `limit_req`, so they can amplify a burst",
            "It is not risky — nginx only retries requests that never reached an upstream",
          ],
          correctIndex: 0,
          explanation:
            "A timeout tells you nothing about whether the work happened. Restrict retries to cases where no response had begun, keep non-idempotent methods out of the retry set, and make the operation idempotent with a client-supplied key where duplication would be expensive.",
        },
        {
          id: "proxy-load-balancing-q8",
          prompt: "What problem does `random two least_conn` solve that plain `least_conn` does not?",
          options: [
            "With several independent proxy instances, every one of them would pick the same \"least loaded\" server at once; sampling two and choosing the better avoids that herd",
            "It removes the need for health checks",
            "It guarantees an exactly even distribution",
            "It is the only policy that supports weights",
          ],
          correctIndex: 0,
          explanation:
            "\"Power of two choices\" gets most of the benefit of least-connections with only local information and without the synchronised stampede that global least-loaded creates across a fleet. It does not guarantee evenness and is unrelated to health checking.",
        },
        {
          id: "proxy-load-balancing-q9",
          prompt: "You are rolling out a new version with two upstreams behind nginx. What makes this deploy graceful?",
          options: [
            "Drain each instance in turn — stop it receiving new requests, let in-flight ones finish, then replace it — and make sure the proxy notices before users do",
            "Reload nginx, which automatically drains upstreams",
            "Set `max_fails=0`, so failures are ignored during the rollout",
            "Nothing special is needed; passive health checks handle it",
          ],
          correctIndex: 0,
          explanation:
            "Passive health checks discover a dead upstream by failing user requests, so a naive restart shows errors. Draining (or marking a server `down` and reloading, or using active checks with a readiness endpoint) removes it from rotation before it stops answering. `max_fails=0` disables the accounting entirely, which is the opposite of what you want.",
        },
      ],
    },
    {
      id: "proxy-observability-logs",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "Access Logs and Debugging at the Edge",
      summary:
        "The proxy is the only place that sees every request from both sides, which makes its access log the most useful single artefact when something is slow and nobody can agree whose fault it is.\n\nThe pair of variables that settles that argument is `$request_time` and `$upstream_response_time`. `$request_time` covers the whole exchange, from the first bytes read from the client to the last bytes written back to it, so it includes a slow upload, a slow download and time spent in proxy buffers. `$upstream_response_time` covers only the time the upstream took. A request with `$request_time 12.0` and `$upstream_response_time 0.03` is a slow client or a large response over a bad connection — not an application problem, and no amount of profiling the app will find it. The inverse means the opposite. `$upstream_connect_time` and `$upstream_header_time` split the upstream's share further, into connecting, thinking, and streaming the body. When nginx tries more than one upstream, these variables hold several values separated by commas and colons, mirroring `$upstream_addr` — which is how you spot silent retries.\n\nThe default `combined` format has none of this, so the first thing to do on any proxy you inherit is to define a `log_format` that includes the timing variables, the upstream address and status, and a request id you can correlate with application logs. JSON output costs nothing and saves you from writing a regex parser later. Caddy logs structured JSON by default, which is one fewer decision.\n\nTwo practical notes. Health checks and asset requests can dominate log volume; `access_log off;` in those locations keeps signal density up, and `buffer=` with `flush=` reduces write syscalls on a busy server. And a client that disconnects before the response finishes is logged by nginx as status `499` — not an error your application ever saw, and a useful signal that someone upstream of you is timing out.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "nginx: ngx_http_log_module", url: "https://nginx.org/en/docs/http/ngx_http_log_module.html", kind: "docs" },
        { label: "Caddy: log (Caddyfile directive)", url: "https://caddyserver.com/docs/caddyfile/directives/log", kind: "docs" },
        {
          label: "NGINX Blog: Using NGINX Logging for Application Performance Monitoring",
          url: "https://blog.nginx.org/blog/using-nginx-logging-for-application-performance-monitoring",
          kind: "article",
        },
      ],
      video: {
        title: "Nginx Access and Error Logs",
        channel: "WittCode",
        url: "https://www.youtube.com/watch?v=f2WKJpFWXx8",
        videoId: "f2WKJpFWXx8",
        durationLabel: "6:26",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-observability-logs-q1",
          prompt: "A log line shows `request_time=12.412` and `upstream_response_time=0.031`. Where is the time going?",
          options: [
            "In the client connection — a slow upload, a slow download, or a large response over a poor link",
            "In the application, which is slow to generate the response",
            "In DNS resolution of the upstream name",
            "In TLS handshaking, which is counted in `$upstream_response_time`",
          ],
          correctIndex: 0,
          explanation:
            "The upstream answered in 31 ms; the remaining 12 seconds were spent talking to the client. Profiling the application here finds nothing. DNS and upstream connect time appear in `$upstream_connect_time`, not in the client's share.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-observability-logs-q2",
          prompt: "What does `$upstream_response_time` containing `0.512, 30.001` tell you?",
          options: [
            "nginx contacted more than one upstream for this request — the first attempt failed or timed out and it retried",
            "The response was streamed in two chunks",
            "Two upstreams were queried in parallel and the faster one won",
            "The value is corrupt; the variable holds a single number",
          ],
          correctIndex: 0,
          explanation:
            "Times for several attempts are separated by commas and colons, matching `$upstream_addr`. This is how you discover `proxy_next_upstream` retries that are invisible to both client and application — and, on a non-idempotent endpoint, how you discover duplicated work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-observability-logs-q3",
          prompt: "nginx logs a status of `499` for a request the application never reported. What does it mean?",
          options: [
            "The client closed the connection before nginx finished sending the response",
            "The upstream returned an invalid status line",
            "The request was rejected by `limit_req`",
            "TLS renegotiation failed mid-response",
          ],
          correctIndex: 0,
          explanation:
            "499 is nginx's own non-standard code for a client-side abort. A cluster of them usually means something in front — a browser, a mobile app or another proxy — has a shorter timeout than you do, which is a different investigation from a 504.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-observability-logs-q4",
          prompt: "Which fields are worth adding to the default `combined` log format on a proxy? (Select all that apply.)",
          options: [
            "`$request_time` and `$upstream_response_time`",
            "`$upstream_addr` and `$upstream_status`",
            "A request id you also emit from the application, for correlation",
            "The full request body, so failures can be replayed",
            "The `Authorization` header, to identify the caller",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Timings, which upstream served the request, and a correlation id are the three things you always wish you had. Logging bodies and credentials creates a data-protection problem and a secret-leak problem respectively — the log is not the place for either.",
        },
        {
          id: "proxy-observability-logs-q5",
          prompt: "Why is `access_log off;` inside the health-check location a reasonable default?",
          options: [
            "A probe every few seconds produces a large volume of identical lines that dilute the signal and cost disk and ingest budget",
            "Health-check responses cannot be logged accurately",
            "Logging them would cause the health check to time out",
            "It is required for the health check to return 200",
          ],
          correctIndex: 0,
          explanation:
            "On a busy fleet, monitoring traffic can outnumber real traffic. Silencing that one location keeps the log about users. If you do want them, log them separately so they can be sampled or dropped at ingest.",
        },
        {
          id: "proxy-observability-logs-q6",
          prompt: "What do `buffer=32k` and `flush=5s` on `access_log` change?",
          options: [
            "Lines accumulate in memory and are written in batches, cutting syscalls at the cost of losing the tail if the process is killed",
            "They limit each log line to 32k characters",
            "They rotate the file every 5 seconds once it exceeds 32k",
            "They compress the log with gzip",
          ],
          correctIndex: 0,
          explanation:
            "Buffered logging is a throughput optimisation with a durability trade: `flush` bounds how stale the on-disk tail can be. Compression is the separate `gzip` parameter, and rotation is handled outside nginx.",
        },
        {
          id: "proxy-observability-logs-q7",
          prompt: "How do access logs and error logs differ in nginx, and which one holds an upstream connection failure?",
          options: [
            "The access log records one line per completed request; the error log records diagnostics, and an upstream connection failure appears there with the reason",
            "Both record every request; the error log adds a stack trace",
            "The access log records failures too, so the error log is redundant",
            "The error log only records configuration errors at start-up",
          ],
          correctIndex: 0,
          explanation:
            "The access log tells you a 502 happened; the error log tells you it was `connect() failed (111: Connection refused)` to a specific address. Investigating a proxy without reading both is guessing — and `error_log` levels (`warn`, `error`, `debug`) control how much you get.",
        },
        {
          id: "proxy-observability-logs-q8",
          prompt: "After log rotation moves `access.log` aside, nginx keeps writing to the rotated file. What is needed?",
          options: [
            "Signal nginx (`nginx -s reopen`, or `USR1`) so it closes and reopens its log files",
            "Restart nginx completely; reopening is not supported",
            "Nothing — nginx detects the rename by inode and reopens automatically",
            "Set `access_log` to a directory rather than a file",
          ],
          correctIndex: 0,
          explanation:
            "The open file descriptor follows the renamed inode, so writes keep landing in the rotated file and the new one stays empty. `logrotate` configurations ship a `postrotate` hook that sends the signal — when someone writes their own rotation script, this is the step they forget.",
        },
        {
          id: "proxy-observability-logs-q9",
          prompt: "What is different about Caddy's logging out of the box?",
          options: [
            "It writes structured JSON by default, so fields are machine-readable without a custom format or a parser",
            "It writes no access log at all unless one is configured",
            "It logs only errors, and access logging requires a plugin",
            "It uses nginx's `combined` format for compatibility",
          ],
          correctIndex: 0,
          explanation:
            "Structured-by-default removes the \"someone must invent a log format\" step and the regex that would have parsed it. The `log` directive configures output, rolling and formatting — including a console format for local work.",
        },
      ],
    },
    {
      id: "proxy-choosing",
      moduleId: "devops-reverse-proxies",
      trackId: "devops",
      title: "nginx vs Caddy vs Traefik vs a Cloud Load Balancer",
      summary:
        "These four are not ranked; they are shaped for different operational models, and picking badly shows up as config that fights you rather than as a benchmark result.\n\n**nginx** is the one everyone can read, has two decades of answered questions behind it, and gives you the most control over timeouts, buffers, caching and connection handling. That control is also the cost: certificates are someone else's job (certbot plus a reload hook), configuration is static files plus a reload, and active health checks are behind the commercial subscription. Choose it when you need the tuning, or when the team already knows it.\n\n**Caddy** trades some of that control for automatic HTTPS, a much shorter config, structured logs and free active health checks. For a single VPS serving a handful of sites, a Caddyfile is usually a fifth the size of the equivalent nginx config and has no renewal machinery at all — which is why this project's own deployment uses it.\n\n**Traefik** is built around dynamic service discovery: it watches Docker labels, a Kubernetes API or Consul and reconfigures itself as containers come and go, with no reload. That is a genuine advantage when your topology changes constantly, and pure overhead when it does not — you are running a control loop to discover two containers you could have written down.\n\n**A cloud load balancer** (ALB, Cloud Load Balancing, Azure Front Door) removes the box entirely: no patching, no capacity planning, certificates from the provider's manager, health checks and autoscaling integration built in. You give up fine-grained control, pay per request and per gigabyte, and accept that the routing rules are described in your provider's vocabulary rather than in a config file you can diff.\n\nAnd they compose. A very common production shape is a cloud load balancer or CDN at the edge for TLS and DDoS absorption, with nginx, Caddy or Traefik inside doing routing the managed layer cannot express — which is why the forwarded-header and trusted-proxy configuration from earlier in this camp is not optional.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Caddy: Documentation", url: "https://caddyserver.com/docs/", kind: "docs" },
        { label: "Traefik Proxy Documentation", url: "https://doc.traefik.io/traefik/", kind: "docs" },
        { label: "nginx: Documentation index", url: "https://nginx.org/en/docs/", kind: "docs" },
        {
          label: "AWS: What is an Application Load Balancer?",
          url: "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html",
          kind: "article",
        },
      ],
      video: {
        title: "Full NGINX Tutorial - Demo Project with Node.js, Docker",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=q8OleYuqntY",
        videoId: "q8OleYuqntY",
        startSeconds: 924,
        chapterLabel: "Nginx Load Balancer vs Cloud Load Balancer",
        durationLabel: "1:11:40",
      },
      alternateVideos: [
        {
          title: "Setting up a production ready VPS is a lot easier than I thought.",
          channel: "Dreams of Code",
          url: "https://www.youtube.com/watch?v=F-9KWQByeU0",
          videoId: "F-9KWQByeU0",
          startSeconds: 1036,
          chapterLabel: "Reverse Proxy",
          durationLabel: "29:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "proxy-choosing-q1",
          prompt: "A team runs 30 containers on one Docker host, with services added and removed several times a week. Which proxy fits best, and why?",
          options: [
            "Traefik — it watches Docker labels and reconfigures itself as containers start and stop, with no reload step",
            "nginx — a reload after each change is a fine workflow at this scale",
            "A cloud load balancer — it discovers containers automatically",
            "Caddy — its Caddyfile updates itself from the container runtime",
          ],
          correctIndex: 0,
          explanation:
            "Dynamic discovery is exactly Traefik's reason to exist. nginx would need config generation plus reloads; a cloud load balancer does not see inside a single host; and Caddy needs its config supplied (via its API or a config file), it does not watch Docker on its own.",
        },
        {
          id: "proxy-choosing-q2",
          prompt: "Which of these are genuine advantages of Caddy over open-source nginx? (Select all that apply.)",
          options: [
            "Certificate issuance and renewal with no external tool or reload hook",
            "Active health checks without a commercial licence",
            "Structured JSON access logs by default",
            "Substantially higher raw throughput on static files",
            "A larger third-party module ecosystem",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Automatic HTTPS, free active health checking and structured logging are the concrete wins. Throughput is close enough that it is rarely the deciding factor, and nginx's ecosystem and documented recipes are still far larger.",
        },
        {
          id: "proxy-choosing-q3",
          prompt: "Your API is behind an AWS Application Load Balancer, and you want per-path rate limits and a rewrite the ALB cannot express. What is the reasonable shape?",
          options: [
            "Keep the ALB for TLS and health-checked routing, and run nginx or Caddy behind it for the rules it cannot express — configuring trusted proxies so client IPs survive",
            "Replace the ALB with nginx on an EC2 instance, so there is only one proxy",
            "Implement the rules in the application, because two proxies in series is an anti-pattern",
            "Use ALB listener rules — they support arbitrary rewrites and per-path rate limits",
          ],
          correctIndex: 0,
          explanation:
            "Layered proxies are normal; the managed layer handles TLS, scaling and availability while the inner one expresses policy. The consequence is that the inner proxy is no longer the outermost hop, so `X-Forwarded-For` trust must be configured or your rate limiter keys on the ALB.",
        },
        {
          id: "proxy-choosing-q4",
          prompt: "Which claim about cloud load balancers is misleading?",
          options: [
            "\"It removes operational work, so it is always cheaper\"",
            "\"It removes patching and capacity planning for the proxy tier\"",
            "\"Certificates are managed by the provider's certificate service\"",
            "\"Routing rules are expressed in the provider's model, not in a config file you can diff\"",
          ],
          correctIndex: 0,
          explanation:
            "Per-request and per-gigabyte pricing at volume can dwarf the cost of a small instance running nginx, and hourly charges accrue whether or not traffic does. The operational savings are real; the blanket cost claim is not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-choosing-q5",
          prompt: "A team migrates an nginx config to a Caddyfile and every API call starts returning 404. What is the first thing to check?",
          options: [
            "Whether the prefix-stripping behaviour matched — `handle` keeps the path prefix while `proxy_pass http://app/` in nginx stripped it",
            "Whether Caddy needs `proxy_http_version 1.1`",
            "Whether the upstream needs to be declared in an `upstream` block first",
            "Whether automatic HTTPS is interfering with routing",
          ],
          correctIndex: 0,
          explanation:
            "Silent path rewriting is the highest-frequency translation bug in both directions: `handle_path` is the equivalent of the nginx trailing-slash form, and plain `handle` is the equivalent of `proxy_pass` without a URI. The other three are not Caddy concepts at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "proxy-choosing-q6",
          prompt: "When does nginx's fine-grained control genuinely pay for its extra configuration burden?",
          options: [
            "When you need specific buffer, timeout, caching or connection tuning at high traffic, or you are operating a config the team already knows deeply",
            "Whenever the service handles more than a hundred requests per second",
            "Whenever TLS is involved, since Caddy's TLS stack is less mature",
            "Only in Kubernetes, where Caddy cannot be used",
          ],
          correctIndex: 0,
          explanation:
            "The payoff is specific tuning at scale and institutional familiarity, not a traffic threshold. Caddy's TLS stack is modern and maintained, and both run happily in Kubernetes.",
        },
        {
          id: "proxy-choosing-q7",
          prompt: "This project deploys a single Docker container on one VPS with Caddy in front. Which factors make Caddy the right call here? (Select all that apply.)",
          options: [
            "A single domain with automatic certificate issuance and renewal removes the certbot plus reload-hook machinery entirely",
            "The config is short enough to read in one screen, which matters when one person operates it",
            "Streaming and cache-header needs are expressible in a few directives",
            "The traffic volume requires Caddy's superior connection handling",
            "Kubernetes ingress integration is a requirement",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Small surface area, one domain and one operator is exactly Caddy's sweet spot. Traffic volume is not the driver at this scale, and there is no Kubernetes here.",
        },
        {
          id: "proxy-choosing-q8",
          prompt: "Which consideration should carry the most weight when a small team picks between these options?",
          options: [
            "What the team can debug at 3 a.m. with the documentation and the logs they will actually have",
            "Published benchmark throughput on static files",
            "The number of configuration directives supported",
            "Which project has the most GitHub stars",
          ],
          correctIndex: 0,
          explanation:
            "All four handle far more traffic than a small team will generate, so the differentiator is operability under pressure: how legible the config is, how good the error messages are, and whether anyone on call has seen this failure before.",
        },
      ],
    },
  ],
} satisfies Module;
