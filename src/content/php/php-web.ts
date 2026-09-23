import type { Module } from "@/types/curriculum";

export default {
  id: "php-web",
  trackId: "php",
  name: "PHP on the Web",
  description:
    "PHP as it actually runs behind a web server: the shared-nothing request lifecycle, FPM workers, untrusted input, sessions and cookies, uploads, PDO, and the production settings a Laravel app inherits without ever showing you. Plain PHP only — the framework layer comes later.",
  refs: [
    { label: "PHP Manual: Features", url: "https://www.php.net/manual/en/features.php", kind: "docs" },
    { label: "OWASP: Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", kind: "article" },
    { label: "PHP Delusions: the PDO tutorial", url: "https://phpdelusions.net/pdo", kind: "article" },
  ],
  topics: [
    {
      id: "php-web-request-lifecycle",
      moduleId: "php-web",
      trackId: "php",
      title: "The Request Lifecycle and Shared-Nothing Execution",
      summary:
        "PHP's defining architectural choice is that a request gets a clean interpreter and then the interpreter is thrown away. The SAPI hands the request to the engine, the engine populates the superglobals, compiles (or fetches from OPcache) and runs your script, flushes output, runs shutdown functions, and frees every variable, object, resource and connection your code created. Nothing you put in a global, a `static`, or a singleton survives to the next request.\n\nThat is why PHP is unusually forgiving. A memory leak lasts milliseconds, an unclosed handle is cleaned up for you, and a fatal error in one request cannot corrupt the next — properties a long-lived Node or Java process does not get for free. The cost is that every request pays for bootstrapping again: autoloading, config parsing, container building, a fresh database connection. OPcache removes the *compile* cost by caching opcodes in shared memory, but it caches nothing about your data, so anything that must outlive a request has to go somewhere external: a database, Redis, the session store, or a file.\n\nThe gotcha shows up when a team moves a classic app onto a worker runtime — FrankenPHP worker mode, Swoole, Laravel Octane — where the process is reused. Code that quietly relied on shared-nothing (a static cache keyed by the current user, a singleton holding request state, an `ini_set()` made mid-request) now leaks state between users. The fault is not the runtime; the code was depending on a guarantee it never stated.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: Connection handling", url: "https://www.php.net/manual/en/features.connection-handling.php", kind: "docs" },
        { label: "PHP Manual: register_shutdown_function", url: "https://www.php.net/manual/en/function.register-shutdown-function.php", kind: "docs" },
        { label: "FrankenPHP: Worker mode", url: "https://frankenphp.dev/docs/worker/", kind: "article" },
      ],
      video: {
        title: "How Nginx and PHP-FPM turn a web request into code",
        channel: "Chris Fidao",
        url: "https://www.youtube.com/watch?v=lh4RnczaATI",
        videoId: "lh4RnczaATI",
        durationLabel: "7:08",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-request-lifecycle-q1",
          prompt: "A classic PHP-FPM app serves this file. What does the *second* request print?\n\n```php\n<?php\n$hits = ($hits ?? 0) + 1;\necho $hits;\n```",
          options: ["`1`", "`2`", "`0`", "A warning about an undefined variable, then `2`"],
          correctIndex: 0,
          explanation:
            "Every request starts with a fresh variable table, so `$hits` is always unset at the top and always ends at 1. The null-coalescing operator also suppresses the undefined-variable warning, so there is no diagnostic either.",
        },
        {
          id: "php-web-request-lifecycle-q2",
          prompt: "A service class caches lookups in a `static` array to avoid repeat queries. Under classic PHP-FPM, how long does that cache live?",
          options: [
            "For one request — it is destroyed when the script ends",
            "For the life of the FPM worker that handled the request",
            "Until OPcache is reset",
            "Until it is explicitly cleared, across all workers",
          ],
          correctIndex: 0,
          explanation:
            "Statics are userland state, and all userland state is torn down at the end of the request. The cache is still useful — it de-duplicates queries *within* one request — but it is not a cross-request cache; that needs Redis, APCu or the database.",
        },
        {
          id: "php-web-request-lifecycle-q3",
          prompt: "Which of these survive from one request to the next under classic PHP-FPM? (Select all that apply.)",
          options: [
            "Rows committed to the database",
            "Data written to `$_SESSION` and flushed by the session handler",
            "Compiled opcodes held in OPcache's shared memory",
            "A value assigned to a `static` class property",
            "An entry pushed onto an array held in a global variable",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Only state that leaves the PHP request survives: the database, the session store, and OPcache's shared memory segment (which belongs to the FPM master, not to your script). Statics and globals are destroyed at shutdown.",
        },
        {
          id: "php-web-request-lifecycle-q4",
          prompt: "Does a function registered with `register_shutdown_function()` run after a fatal error such as an uncaught `Error`?",
          options: [
            "Yes — which is why it is the standard place to log fatal errors via `error_get_last()`",
            "No — a fatal error terminates the process before shutdown functions run",
            "Only if a `set_error_handler()` callback is also registered",
            "Only under the CLI SAPI",
          ],
          correctIndex: 0,
          explanation:
            "Shutdown functions run during the engine's shutdown phase, which still happens after a fatal error, so `register_shutdown_function()` plus `error_get_last()` catches what a try/catch cannot. Only a hard process kill (segfault, OOM, FPM's `request_terminate_timeout`) skips them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-request-lifecycle-q5",
          prompt: "A user hits Stop halfway through a slow page. With PHP's default settings, when does the script actually stop?",
          options: [
            "The next time it tries to send output, PHP notices the aborted connection and terminates it",
            "Immediately — PHP polls the client socket between statements",
            "Never — the script always runs to completion",
            "Only when `max_execution_time` is reached",
          ],
          correctIndex: 0,
          explanation:
            "`ignore_user_abort` defaults to 0, so an abort does terminate the script, but the abort is only *detected* when PHP next writes to the client; a long loop that produces no output keeps running. `ignore_user_abort(true)` plus a shutdown function is how you make work finish regardless.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-request-lifecycle-q6",
          prompt: "By the time your first line of PHP executes, `$_GET`, `$_POST` and `$_SERVER` are already populated. What filled them?",
          options: [
            "The SAPI layer, from the web server's request data, before the script runs",
            "`session_start()`, which bootstraps the request globals",
            "An `auto_prepend_file` shipped with PHP",
            "The first read of the array, which is parsed lazily",
          ],
          correctIndex: 0,
          explanation:
            "The SAPI (php-fpm, mod_php, cli-server, CLI) bridges the server and the engine and registers the request variables during startup. That is also why `filter_input()` reads the original SAPI values rather than any later modification you made to the superglobal.",
        },
        {
          id: "php-web-request-lifecycle-q7",
          prompt: "A request arrives with `Content-Type: application/json` and a JSON body. What is in `$_POST`?",
          options: [
            "Nothing — PHP only populates `$_POST` for `application/x-www-form-urlencoded` and `multipart/form-data` bodies",
            "The decoded JSON as an associative array",
            "The raw JSON string under the key `0`",
            "The raw JSON string under the key `body`",
          ],
          correctIndex: 0,
          explanation:
            "PHP parses only those two form content types into `$_POST`; for anything else you read the raw body from `php://input` and decode it yourself. That is precisely what a framework's JSON request handling does on your behalf.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-request-lifecycle-q8",
          prompt: "Why does a PHP app typically open a database connection on every request, while a Node app opens one pool at boot?",
          options: [
            "The PDO handle is userland state, so it is destroyed with everything else at the end of the request",
            "PDO objects cannot be reused for more than one query",
            "MySQL refuses connections that stay open across requests",
            "OPcache closes any open connection when it revalidates a file",
          ],
          correctIndex: 0,
          explanation:
            "Shared-nothing means no process stays alive between requests to hold a pool. `PDO::ATTR_PERSISTENT` keeps the underlying socket open per worker as a partial escape hatch, but it brings its own hazards (leaked session settings, open transactions) and is not a pool.",
        },
        {
          id: "php-web-request-lifecycle-q9",
          prompt: "What does OPcache actually keep between requests?",
          options: [
            "The compiled opcodes for each PHP file",
            "The values of your global variables",
            "The contents of `$_SESSION`",
            "The HTML your script rendered last time",
          ],
          correctIndex: 0,
          explanation:
            "OPcache removes the parse-and-compile step by storing opcodes in shared memory; it knows nothing about your data or your output. Caching results is a separate concern (APCu, Redis, an HTTP cache).",
        },
        {
          id: "php-web-request-lifecycle-q10",
          prompt: "A team moves a working app onto a worker runtime (FrankenPHP worker mode, Swoole, Laravel Octane) and it starts showing one user's data to another. What is the most likely cause?",
          options: [
            "State held in static properties and singletons now persists between requests",
            "Superglobals are unavailable under worker runtimes",
            "Composer's autoloader cannot run in a long-lived process",
            "OPcache must be disabled in worker mode, so files are recompiled per request",
          ],
          correctIndex: 0,
          explanation:
            "Worker runtimes keep the process alive between requests, so anything cached in a static or a container singleton outlives the user it was built for. The code was silently depending on shared-nothing to reset it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "php-web-fpm",
      moduleId: "php-web",
      trackId: "php",
      title: "PHP-FPM, mod_php and the Process Model",
      summary:
        "PHP-FPM is a FastCGI process manager: a master process that owns the configuration and a pool of worker children that each handle exactly one request at a time. nginx (or Apache with `proxy_fcgi`) speaks FastCGI to the pool over a TCP port or a Unix socket, and the main dial on throughput is `pm.max_children`, because that number *is* your concurrency limit.\n\nThe older `mod_php` embeds the interpreter in every Apache child. Simpler, but PHP is then loaded even to serve a PNG, the whole server is pinned to one PHP version and to the prefork MPM (PHP with its usual extensions is not reliably thread-safe), and PHP runs as the web server user. FPM decouples all of that: separate pools per site, per-pool users, per-pool `php.ini` overrides, and the ability to restart PHP without restarting the web server. It is what current deployments — and every Laravel deployment — actually use.\n\nThe model that matters is that a worker is blocked for the whole request. A 3-second upstream API call does not yield the way it would on an event loop; it holds one of your N workers hostage. Capacity is therefore `max_children`, and `max_children` is bounded by RAM: workers × peak memory per worker must fit, or the OOM killer takes something and nginx starts returning 502. Two timeouts are easy to confuse: `max_execution_time` counts only PHP's own execution and ignores time spent waiting on a database query or `sleep()`, so a hung query can pin a worker indefinitely; FPM's `request_terminate_timeout` is the wall-clock backstop that actually kills it.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: FPM configuration", url: "https://www.php.net/manual/en/install.fpm.configuration.php", kind: "docs" },
        { label: "PHP Manual: FastCGI Process Manager", url: "https://www.php.net/manual/en/install.fpm.php", kind: "docs" },
        { label: "Tideways: An Introduction to PHP-FPM Tuning", url: "https://tideways.com/profiler/blog/an-introduction-to-php-fpm-tuning", kind: "article" },
      ],
      video: {
        title: "All you need to know about FastCGI Process Manager (FPM)",
        channel: "Daniel Persson",
        url: "https://www.youtube.com/watch?v=hEXBgQ71rvE",
        videoId: "hEXBgQ71rvE",
        durationLabel: "12:44",
      },
      alternateVideos: [
        {
          title: "Configuring and Troubleshooting PHP-FPM",
          channel: "Chris Fidao",
          url: "https://www.youtube.com/watch?v=vohsuhwWvpw",
          videoId: "vohsuhwWvpw",
          durationLabel: "4:59",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-fpm-q1",
          prompt: "What does `pm.max_children` actually limit?",
          options: [
            "The number of requests the pool can serve simultaneously",
            "The number of requests per second the pool will accept",
            "The number of PHP files a worker may include",
            "The number of pools the FPM master may start",
          ],
          correctIndex: 0,
          explanation:
            "One worker handles one request at a time, so `max_children` is the pool's concurrency ceiling. Requests beyond it wait in the listen backlog, which is why an under-sized pool shows up first as latency and then as 502s, not as errors from PHP itself.",
        },
        {
          id: "php-web-fpm-q2",
          prompt: "Which are valid values for the `pm` directive in an FPM pool? (Select all that apply.)",
          options: ["`static`", "`dynamic`", "`ondemand`", "`threaded`", "`prefork`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`static` fixes the worker count at `pm.max_children`, `dynamic` scales between spare-server bounds, and `ondemand` spawns workers only when a request arrives and reaps them after `pm.process_idle_timeout`. `prefork` and `threaded` are Apache MPM names, not FPM process managers.",
        },
        {
          id: "php-web-fpm-q3",
          prompt: "A box has 4 GB of RAM, about 1 GB is used by everything else, and each FPM worker peaks at roughly 80 MB. What is a defensible `pm.max_children`?",
          options: ["About 35", "About 200", "About 500", "It does not depend on memory at all"],
          correctIndex: 0,
          explanation:
            "Usable memory divided by peak per-worker memory: roughly 3 GB / 80 MB ≈ 37, minus headroom. Setting it higher than the box can feed does not add throughput — it invites the OOM killer, and nginx then reports 502 because its upstream vanished.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-fpm-q4",
          prompt: "Which of these are genuine consequences of using `mod_php` instead of PHP-FPM? (Select all that apply.)",
          options: [
            "The interpreter is loaded into every Apache child, including ones serving static files",
            "PHP runs as the web server user, so per-site privilege separation is harder",
            "Apache is effectively pinned to the prefork MPM",
            "Sessions cannot be used, because there is no separate process to hold them",
            "Prepared statements must be emulated, because there is no FastCGI channel",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Embedding the interpreter costs memory in every child, ties the process identity to the web server, and forces prefork because PHP with its extensions is not reliably thread-safe. Sessions and PDO behave identically either way — they are engine features, not SAPI features.",
        },
        {
          id: "php-web-fpm-q5",
          prompt: "A report page runs a query that hangs for ten minutes. `max_execution_time` is 30. What happens?",
          options: [
            "The script keeps waiting — `max_execution_time` does not count time spent inside a database call",
            "PHP aborts the script after 30 seconds with a fatal error",
            "PHP aborts the query after 30 seconds but lets the script continue",
            "The FPM master restarts the worker after 30 seconds",
          ],
          correctIndex: 0,
          explanation:
            "`max_execution_time` measures only the script's own execution; time in system calls, `sleep()` and database queries is excluded, so a hung query pins the worker. FPM's `request_terminate_timeout` (and a driver-level query timeout) is what actually bounds it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-fpm-q6",
          prompt: "A page calls a third-party API that takes 3 seconds. Under PHP-FPM, what does that cost?",
          options: [
            "One worker is occupied for the full 3 seconds and can serve nothing else",
            "Nothing — PHP releases the worker while it waits on I/O",
            "One worker plus an extra thread spawned for the socket",
            "Only the CPU time, since blocking I/O is not charged to the pool",
          ],
          correctIndex: 0,
          explanation:
            "FPM workers are synchronous: blocking I/O blocks the worker. That is the structural difference from an event-loop runtime, and it is why slow third-party calls in PHP belong in a queued job rather than in the request.",
        },
        {
          id: "php-web-fpm-q7",
          prompt: "nginx in front of PHP-FPM returns `502 Bad Gateway` on some requests and `504 Gateway Timeout` on others. What do the two usually mean?",
          options: [
            "502: the FPM upstream died or closed the connection. 504: nginx gave up waiting for a response",
            "502: the request body was too large. 504: PHP returned a 5xx status itself",
            "502: nginx gave up waiting. 504: FPM had no free worker",
            "They are interchangeable; nginx picks whichever fits the log format",
          ],
          correctIndex: 0,
          explanation:
            "502 means the upstream broke the conversation — a crashed worker, an OOM kill, a missing socket, or `request_terminate_timeout` firing. 504 is nginx's own `fastcgi_read_timeout` expiring while PHP is still working.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-fpm-q8",
          prompt: "`pm.max_requests` defaults to 0. What does setting it to, say, 500 buy you?",
          options: [
            "Each worker respawns after 500 requests, bounding leaks in PHP or a third-party extension",
            "Each worker is limited to 500 concurrent requests",
            "The pool refuses more than 500 requests per second",
            "The master restarts the entire pool every 500 requests",
          ],
          correctIndex: 0,
          explanation:
            "It recycles workers individually, so a slow leak cannot grow without bound. The default of 0 means workers live forever, which is fine for clean code and unpleasant when an extension leaks.",
        },
        {
          id: "php-web-fpm-q9",
          prompt: "Is OPcache's compiled-opcode cache shared between the workers of one FPM pool?",
          options: [
            "Yes — it lives in shared memory allocated by the master and inherited by every worker in that pool",
            "No — each worker compiles and caches independently",
            "Only when `opcache.enable_cli` is turned on",
            "Only when the pool uses `pm = static`",
          ],
          correctIndex: 0,
          explanation:
            "The shared memory segment belongs to the master process, so a file compiled by one worker is immediately available to its siblings. It is not shared with a different master or with the CLI — which is why an `opcache_reset()` run from a CLI deploy script does nothing to the web pool.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-fpm-q10",
          prompt: "When is `pm = static` a better choice than `pm = dynamic`?",
          options: [
            "On a dedicated box where workers are already sized to fit RAM and you want no fork latency at peak",
            "On a shared box running many low-traffic sites",
            "Whenever the application is memory-hungry, because static uses less memory per worker",
            "Whenever traffic is unpredictable, because static scales up faster",
          ],
          correctIndex: 0,
          explanation:
            "`static` pre-forks the whole pool, so there is no spawn cost under load and memory use is flat and predictable. That is wasteful for many idle sites on one box, which is exactly where `ondemand` or a small `dynamic` pool wins. Per-worker memory is the same either way.",
        },
      ],
    },
    {
      id: "php-web-superglobals",
      moduleId: "php-web",
      trackId: "php",
      title: "Superglobals and Untrusted Input",
      summary:
        "`$_GET`, `$_POST`, `$_COOKIE`, `$_FILES` and `$_SERVER` are the raw request, decoded into arrays by the SAPI before your first line runs. They are convenient and completely untrusted: every value in them, and every *key*, was chosen by whoever sent the request. The most misread of the five is `$_SERVER`, because it mixes server-controlled facts (`REMOTE_ADDR`, `DOCUMENT_ROOT`, `SCRIPT_FILENAME`) with a straight copy of the client's headers under `HTTP_*` — so `HTTP_HOST`, `HTTP_REFERER` and `HTTP_X_FORWARDED_FOR` are attacker input wearing a server-looking name.\n\nPHP's own answer to sanitising this is the filter extension: `filter_var()` and `filter_input()` with `FILTER_VALIDATE_*` filters, which *validate* (return the value coerced to the right type, or `false`) rather than *sanitise* (mangle the value and hope). Prefer validation with an allowlist: decide what shape you accept, reject everything else, and keep the typed result. The sanitising filters have aged badly — `FILTER_SANITIZE_STRING` is deprecated as of PHP 8.1 precisely because \"strip some tags and encode some quotes\" is not a security boundary.\n\nThe gotcha worth internalising is that validation is not escaping. A perfectly valid string is still dangerous when it is concatenated into SQL, echoed into HTML, or passed to a shell. Escaping is decided by the *destination* — bound parameters for SQL, `htmlspecialchars()` for HTML, `escapeshellarg()` for a command line — and the right amount of escaping at the point of use does not depend on how the value got in. Two small traps: PHP rewrites dots and spaces in incoming parameter names to underscores, and `max_input_vars` (default 1000) silently caps how many fields a huge form delivers.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: Superglobals", url: "https://www.php.net/manual/en/language.variables.superglobals.php", kind: "docs" },
        { label: "PHP Manual: $_SERVER", url: "https://www.php.net/manual/en/reserved.variables.server.php", kind: "docs" },
        { label: "PHP Manual: filter_var", url: "https://www.php.net/manual/en/function.filter-var.php", kind: "docs" },
        { label: "OWASP: Input Validation Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "PHP Superglobals - Basic Routing Using The Server Info - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=CF7Yy5cPFVM",
        videoId: "CF7Yy5cPFVM",
        durationLabel: "12:55",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-superglobals-q1",
          prompt: "Why do experienced PHP developers avoid `$_REQUEST`?",
          options: [
            "Which superglobals it merges, and in what precedence, depends on the `request_order`/`variables_order` ini settings, so a cookie can shadow a query parameter",
            "It is deprecated and removed in PHP 8",
            "It is populated only for POST requests",
            "It copies the arrays on every access, so it is slow on large forms",
          ],
          correctIndex: 0,
          explanation:
            "`$_REQUEST`'s contents are a configuration detail, not a property of the request, so the same code can behave differently on two servers — and a value you believed came from the form may have come from a cookie the attacker set. Read from the specific superglobal you meant.",
        },
        {
          id: "php-web-superglobals-q2",
          prompt: "Which of these `$_SERVER` entries are ultimately controlled by the client? (Select all that apply.)",
          options: [
            "`HTTP_USER_AGENT`",
            "`HTTP_X_FORWARDED_FOR`",
            "`HTTP_HOST`",
            "`REMOTE_ADDR`",
            "`DOCUMENT_ROOT`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Everything under `HTTP_*` is a verbatim copy of a request header, so all three are attacker-supplied. `REMOTE_ADDR` comes from the TCP peer the web server actually accepted, and `DOCUMENT_ROOT` is server configuration — which is why rate limiting or IP allowlisting on `X-Forwarded-For` is only safe behind a proxy you trust and have configured explicitly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-superglobals-q3",
          prompt: "What is wrong with this very common form snippet?\n\n```php\n<form action=\"<?= $_SERVER['PHP_SELF'] ?>\" method=\"post\">\n```",
          options: [
            "`PHP_SELF` can carry attacker-controlled path info, so it must be escaped — or replaced with a fixed URL",
            "`PHP_SELF` is only defined under the CLI SAPI",
            "`PHP_SELF` is URL-encoded, so the form posts to the wrong path",
            "Nothing — `PHP_SELF` is generated by the server and is safe to echo",
          ],
          correctIndex: 0,
          explanation:
            "A request to `/page.php/\"><script>…` puts that path info straight into `PHP_SELF`, and echoing it unescaped is reflected XSS. `htmlspecialchars($_SERVER['PHP_SELF'])` closes it; hard-coding the action closes it better.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-superglobals-q4",
          prompt: "A request arrives as `?tag=a&tag=b&size[]=s&size[]=m`. What do `$_GET['tag']` and `$_GET['size']` hold?",
          options: [
            "`'b'` and `['s', 'm']`",
            "`['a', 'b']` and `['s', 'm']`",
            "`'a'` and `'m'`",
            "`'a,b'` and `['s', 'm']`",
          ],
          correctIndex: 0,
          explanation:
            "Repeating a plain name overwrites: the last occurrence wins. Only the `name[]` bracket syntax tells PHP to build an array, which is why a multi-select input must be named `size[]`.",
        },
        {
          id: "php-web-superglobals-q5",
          prompt: "A form field is named `user.email`. How do you read it in PHP?",
          options: [
            "`$_POST['user_email']` — PHP converts dots and spaces in incoming names to underscores",
            "`$_POST['user.email']`",
            "`$_POST['user']['email']`",
            "You cannot — PHP drops fields whose names contain a dot",
          ],
          correctIndex: 0,
          explanation:
            "A dot is not legal in a PHP variable name, and the rewrite is a legacy of `register_globals`; it still applies to incoming parameter names today. Spaces get the same treatment, which is why a field named `first name` arrives as `first_name`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-superglobals-q6",
          prompt: "What is the bug here, given `?offset=0`?\n\n```php\n$offset = filter_var($_GET['offset'] ?? null, FILTER_VALIDATE_INT);\nif (!$offset) {\n    http_response_code(400);\n    exit('bad offset');\n}\n```",
          options: [
            "`FILTER_VALIDATE_INT` returns `int(0)`, which is falsy, so a valid offset of 0 is rejected — the check must be `=== false`",
            "`FILTER_VALIDATE_INT` returns a string, so `!$offset` is always false",
            "`filter_var()` throws on a missing key, so the `??` is unreachable",
            "Nothing — the snippet is correct",
          ],
          correctIndex: 0,
          explanation:
            "The validate filters return the converted value or `false` on failure, so failure must be distinguished from a falsy-but-valid value (`0`, and `\"\"` for a string filter) with a strict comparison. This is the single most common filter-extension bug.",
        },
        {
          id: "php-web-superglobals-q7",
          prompt: "What is the current advice on `FILTER_SANITIZE_STRING`?",
          options: [
            "It is deprecated as of PHP 8.1 — escape at output with `htmlspecialchars()` instead",
            "It is the recommended way to make input safe for HTML",
            "It was renamed `FILTER_SANITIZE_FULL_SPECIAL_CHARS` and behaves identically",
            "It is only deprecated for `filter_input()`, not for `filter_var()`",
          ],
          correctIndex: 0,
          explanation:
            "Stripping tags and encoding some quotes on the way in destroys legitimate data and still does not make the value safe in every output context. Store what the user typed and escape it for the context you are writing it into.",
        },
        {
          id: "php-web-superglobals-q8",
          prompt: "`filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT)` returns `null` for one reason and `false` for another. Which is which?",
          options: [
            "`null` when `page` is not present at all; `false` when it is present but fails the filter",
            "`false` when `page` is not present; `null` when it fails the filter",
            "`null` in both cases; `false` is never returned",
            "`null` when the value is the empty string; `false` when it is missing",
          ],
          correctIndex: 0,
          explanation:
            "Missing and invalid are deliberately distinguishable so you can tell \"the user did not send it\" from \"the user sent nonsense\". `FILTER_NULL_ON_FAILURE` swaps the two if you prefer the opposite convention.",
        },
        {
          id: "php-web-superglobals-q9",
          prompt: "What does this print?\n\n```php\n// request: ?q=hello\n$_GET['q'] = 'tampered';\nvar_dump(filter_input(INPUT_GET, 'q'));\n```",
          options: [
            "`string(5) \"hello\"`",
            "`string(8) \"tampered\"`",
            "`NULL`",
            "`bool(false)`",
          ],
          correctIndex: 0,
          explanation:
            "`filter_input()` reads the original values the SAPI registered, not the current contents of the superglobal, so later writes to `$_GET` are invisible to it. Use `filter_var()` if you need to filter a value your own code produced.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-superglobals-q10",
          prompt: "A bulk-edit form with 1,400 inputs posts, and PHP only sees the first 1,000. What is responsible?",
          options: [
            "`max_input_vars`, which defaults to 1000",
            "`post_max_size`, which defaults to 8M",
            "`max_input_nesting_level`, which defaults to 64",
            "`memory_limit`, which defaults to 128M",
          ],
          correctIndex: 0,
          explanation:
            "`max_input_vars` caps how many input variables PHP will register per request (a denial-of-service guard against hash-collision attacks) and emits a warning when it trips. Size limits would have produced an empty `$_POST`, not a truncated one.",
        },
        {
          id: "php-web-superglobals-q11",
          prompt: "A `PUT` request arrives with a `multipart/form-data` body. On PHP 8.4+, what is the supported way to read it?",
          options: [
            "`request_parse_body()`, which returns the `$_POST` and `$_FILES` equivalents for non-POST verbs",
            "`$_PUT`, which PHP populates for PUT requests",
            "`parse_str(file_get_contents('php://input'), $data)`",
            "`$_FILES`, which PHP fills for every verb",
          ],
          correctIndex: 0,
          explanation:
            "PHP only auto-populates `$_POST`/`$_FILES` for POST, and `request_parse_body()` (PHP 8.4) fills that gap by parsing the body on demand. `parse_str()` handles only URL-encoded bodies, and the body can be consumed only once, so mixing it with `php://input` gives you empty data.",
        },
        {
          id: "php-web-superglobals-q12",
          prompt: "An email address passes `FILTER_VALIDATE_EMAIL`. Which of these are still required before using it? (Select all that apply.)",
          options: [
            "Bind it as a parameter (or escape it) before putting it in SQL",
            "Escape it with `htmlspecialchars()` before echoing it into HTML",
            "Escape it before passing it to a shell command",
            "Nothing — a validated value is safe in every context",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Validation answers \"is this the shape I expected?\"; escaping answers \"how do I put this into *that* language safely?\". They are independent, and the escaping is chosen by the destination, not by the source.",
        },
      ],
    },
    {
      id: "php-web-headers-output",
      moduleId: "php-web",
      trackId: "php",
      title: "Headers, Status Codes, Redirects and Output Buffering",
      summary:
        "An HTTP response is headers, then a blank line, then the body — and because PHP streams the body as you produce it, the headers must be finalised before a single byte of output escapes. That one protocol rule explains `header()`, `setcookie()`, `session_start()` and the famous \"headers already sent\" warning, which is almost never about headers and almost always about a stray newline after a closing `?>`, a UTF-8 BOM in an include, or a `var_dump()` left in a config file.\n\nOutput buffering is the escape hatch. `ob_start()` captures output in memory instead of sending it, which lets you set a header after you have already echoed, capture a template into a string, or discard a half-rendered page and send an error instead. The cost is real memory and lost streaming: a 200 MB CSV built inside a buffer is 200 MB of RSS per worker, and nothing reaches the client until the buffer flushes. Buffer to gain control, stream when the payload is big.\n\nStatus codes are the part people under-use. `header('Location: …')` sends 302 unless you have already set 201 or another 3xx, and — crucially — it does not stop the script, so the code below it still runs unless you `exit`. For a POST-redirect-GET you usually want 303, which tells the browser to re-request with GET; 307 and 308 exist precisely because 301/302 historically let browsers downgrade a POST to a GET, and they preserve the method. Getting these right is the difference between a redirect that works and one that silently re-submits an order.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: header", url: "https://www.php.net/manual/en/function.header.php", kind: "docs" },
        { label: "PHP Manual: Output Control", url: "https://www.php.net/manual/en/book.outcontrol.php", kind: "docs" },
        { label: "MDN: HTTP response status codes", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status", kind: "docs" },
        { label: "OWASP: HTTP Headers Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "HTTP Headers In PHP - Request & Response Headers - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=W7tj0Qlk3rE",
        videoId: "W7tj0Qlk3rE",
        durationLabel: "11:59",
      },
      alternateVideos: [
        {
          title: "PHP Sessions & Cookies - Output Buffering - Headers Already Sent Warning - Full PHP 8 Tutorial",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=6vM-9ou1ARo",
          videoId: "6vM-9ou1ARo",
          durationLabel: "14:55",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-headers-output-q1",
          prompt: "What is the bug?\n\n```php\nif (!$user->isAdmin()) {\n    header('Location: /login');\n}\ndeleteEverything();\n```",
          options: [
            "`header()` does not stop execution, so `deleteEverything()` runs for non-admins too",
            "`header()` only works on POST requests",
            "The redirect needs an absolute URL or it is ignored",
            "Nothing — PHP halts the script when it sends a `Location` header",
          ],
          correctIndex: 0,
          explanation:
            "`header()` just queues a header; the script carries on. The missing `exit;` (or an early `return`) is a classic way to turn an access check into no check at all, because the browser follows the redirect while the server has already done the work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-headers-output-q2",
          prompt: "What status code does `header('Location: /dashboard');` send on its own?",
          options: [
            "302, unless a 201 or another 3xx status has already been set",
            "301, because redirects default to permanent",
            "200, with the `Location` header ignored by the browser",
            "303, since PHP 8",
          ],
          correctIndex: 0,
          explanation:
            "`Location` is a special case in `header()`: it sets 302 for you unless you have already chosen 201 or a 3xx. That default is fine for most flows but wrong when you meant a permanent move or a POST-redirect-GET.",
        },
        {
          id: "php-web-headers-output-q3",
          prompt: "A page warns \"Cannot modify header information - headers already sent by (output started at /config.php:42)\". What is the most likely cause?",
          options: [
            "Output escaped before the header call — often a blank line after `?>` or a BOM in the included file",
            "Two `header()` calls setting the same header name",
            "The web server stripped the header because it was sent too late",
            "`header()` was called before `session_start()`",
          ],
          correctIndex: 0,
          explanation:
            "The message names the file and line where output began, which is the actual bug. The usual culprits are whitespace after a closing `?>` (omit it in pure-PHP files), a UTF-8 byte-order mark saved by an editor, or leftover debug output.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-headers-output-q4",
          prompt: "What does `ob_get_clean()` do?",
          options: [
            "Returns the current buffer's contents and discards the buffer without sending it",
            "Sends the buffer to the client and returns its length",
            "Returns the buffer's contents and also flushes them to the client",
            "Clears the buffer and returns the number of bytes discarded",
          ],
          correctIndex: 0,
          explanation:
            "`ob_get_clean()` is the capture-to-string idiom: render a template, grab the output, send nothing. `ob_end_flush()` sends it, and `ob_get_flush()` does both.",
        },
        {
          id: "php-web-headers-output-q5",
          prompt: "Which of these make later `header()` calls fail? (Select all that apply.)",
          options: [
            "An `echo` earlier in the script",
            "A newline between `?>` and `<?php` in an included file",
            "A `var_dump()` in a bootstrap file",
            "Calling `ob_start()` at the top of the script",
            "Calling `header()` twice with the same header name",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that actually sends body bytes commits the headers. `ob_start()` does the opposite — it holds the body back so headers stay editable — and repeating a header name simply replaces the earlier value by default.",
        },
        {
          id: "php-web-headers-output-q6",
          prompt: "What does the client receive?\n\n```php\nheader('X-Trace: a');\nheader('X-Trace: b');\nheader('X-Trace: c', false);\n```",
          options: [
            "`X-Trace: b` and `X-Trace: c`",
            "`X-Trace: a`, `X-Trace: b` and `X-Trace: c`",
            "`X-Trace: c` only",
            "`X-Trace: a` only",
          ],
          correctIndex: 0,
          explanation:
            "The `replace` parameter defaults to `true`, so `b` overwrites `a`; passing `false` appends a second header of the same name instead. That is how you legitimately send multiple `Set-Cookie` or `WWW-Authenticate` headers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-headers-output-q7",
          prompt: "You are handling a form POST and want the browser to re-request the result page with GET so a refresh does not re-submit. Which status is the precise choice?",
          options: [
            "303 See Other",
            "307 Temporary Redirect",
            "301 Moved Permanently",
            "204 No Content",
          ],
          correctIndex: 0,
          explanation:
            "303 explicitly means \"fetch that other resource with GET\", which is the POST-redirect-GET pattern. 307 deliberately preserves the method, so the browser would POST again; 301 is permanent and cacheable, which is the wrong promise for a form result.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-headers-output-q8",
          prompt: "What does `http_response_code()` return when called with no argument?",
          options: [
            "The current response status code",
            "`true` if a status has been set",
            "The number of headers queued so far",
            "Always 200, because PHP does not track the status",
          ],
          correctIndex: 0,
          explanation:
            "Called with an argument it sets the status; called without one it returns the code that will be sent. It is the readable alternative to `header('HTTP/1.1 404 Not Found')`, which hard-codes a protocol version.",
        },
        {
          id: "php-web-headers-output-q9",
          prompt: "An export endpoint builds a 300 MB CSV inside `ob_start()` … `ob_get_clean()` and then echoes it. What goes wrong first?",
          options: [
            "The buffer holds the whole file in the worker's memory, so it hits `memory_limit`",
            "Output buffering silently truncates at 4 MB",
            "The browser times out because `Content-Length` is missing",
            "OPcache refuses to cache a script that buffers",
          ],
          correctIndex: 0,
          explanation:
            "A buffer is memory, and memory is per worker. Large exports should stream — write rows to `php://output` as you fetch them, flush periodically, and skip the buffer — which also lets the download start immediately.",
        },
        {
          id: "php-web-headers-output-q10",
          prompt: "A JSON endpoint echoes `json_encode($data)` but sets no `Content-Type`. What does the client see?",
          options: [
            "`text/html` with PHP's `default_charset`, because that is the `default_mimetype`",
            "`application/json`, which PHP infers from the JSON body",
            "No `Content-Type` header at all",
            "`application/octet-stream`",
          ],
          correctIndex: 0,
          explanation:
            "PHP sends `default_mimetype` (`text/html`) plus `default_charset` unless you override it, so a JSON response is mislabelled as HTML. Set `header('Content-Type: application/json; charset=utf-8')` explicitly, and pair it with `X-Content-Type-Options: nosniff`.",
        },
      ],
    },
    {
      id: "php-web-cookies",
      moduleId: "php-web",
      trackId: "php",
      title: "Cookies and Their Security Attributes",
      summary:
        "A cookie is a small key/value pair the server asks the browser to store and replay on every matching request. Because it is replayed automatically, a cookie is both the only practical way to keep a browser logged in and the reason cross-site request forgery exists at all. `setcookie()` is a thin wrapper over the `Set-Cookie` header, and since PHP 7.3 it takes an options array — the only form that can set `samesite`, and as of PHP 8.5 `partitioned`.\n\nThe attributes are the security model. `HttpOnly` keeps the value out of `document.cookie`, which turns a successful XSS from \"steal the session\" into \"act within the session\" — a real reduction, not a fix. `Secure` stops the cookie travelling over plain HTTP. `SameSite` decides whether the browser attaches it to cross-site requests: `Strict` never, `Lax` only on top-level navigations using a safe method, `None` always (and then `Secure` is mandatory or the browser drops it). The `__Host-` name prefix is an underrated hardening step: a browser will only accept such a cookie if it is `Secure`, has `Path=/`, and has **no** `Domain`, which pins it to exactly one host and stops a compromised sibling subdomain from overwriting it.\n\nTwo details catch people out. First, `Domain` is inverted from the intuition: omitting it gives a host-only cookie, while setting `Domain=example.com` *widens* it to every subdomain. Second, PHP does not send a `SameSite` attribute unless you ask for one; Chromium-family browsers then apply their own Lax default, which even has a two-minute grace window during which a freshly set cookie is still sent on cross-site POSTs. Relying on a browser default is not the same as setting the attribute.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: setcookie", url: "https://www.php.net/manual/en/function.setcookie.php", kind: "docs" },
        { label: "MDN: Set-Cookie", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie", kind: "docs" },
        { label: "RFC 6265: HTTP State Management Mechanism", url: "https://datatracker.ietf.org/doc/html/rfc6265", kind: "spec" },
      ],
      video: {
        title: "SameSite Cookie Attribute Explained by Example (Strict, Lax, None & No SameSite)",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=aUF2QCEudPo",
        videoId: "aUF2QCEudPo",
        durationLabel: "13:56",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-cookies-q1",
          prompt: "What does this print on the request that runs it?\n\n```php\nsetcookie('theme', 'dark');\necho $_COOKIE['theme'] ?? 'unset';\n```",
          options: ["`unset`", "`dark`", "An empty string", "A warning, then `dark`"],
          correctIndex: 0,
          explanation:
            "`setcookie()` only queues a `Set-Cookie` header; `$_COOKIE` was populated from the *incoming* request and is not updated. The value appears on the next request — assign to `$_COOKIE` yourself if the same script needs to read it back.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-cookies-q2",
          prompt: "Which `setcookie()` call can set `SameSite`?",
          options: [
            "The options-array signature, `setcookie($name, $value, ['samesite' => 'Lax', ...])`, available since PHP 7.3",
            "The positional signature, by passing `'Lax'` as the seventh argument",
            "Neither — `SameSite` can only be set with `header()`",
            "Both, but only when `session.cookie_samesite` is also set",
          ],
          correctIndex: 0,
          explanation:
            "The positional signature stops at `httponly`; the array form added `samesite` in 7.3 and `partitioned` in 8.5. Passing an unrecognised key to the array form throws a `ValueError` as of PHP 8.0, so typos fail loudly.",
        },
        {
          id: "php-web-cookies-q3",
          prompt: "What does `HttpOnly` actually prevent?",
          options: [
            "JavaScript on the page from reading the cookie via `document.cookie`",
            "The cookie from being sent on cross-site requests",
            "The cookie from being sent over plain HTTP",
            "The cookie from being modified by the server",
          ],
          correctIndex: 0,
          explanation:
            "It narrows the blast radius of XSS — the attacker's script can still make authenticated requests as the victim, it just cannot exfiltrate the session id. Cross-site sending is `SameSite`'s job and HTTPS-only is `Secure`'s.",
        },
        {
          id: "php-web-cookies-q4",
          prompt: "Which statements about `SameSite=None` are true? (Select all that apply.)",
          options: [
            "The cookie is sent on cross-site requests, including sub-resource and `fetch()` requests",
            "The `Secure` attribute must also be set or browsers reject the cookie",
            "It is the value you need for a cookie used by a third-party embed",
            "It is equivalent to omitting the `SameSite` attribute in every browser",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`None` is an explicit opt-in to cross-site sending and is only honoured on secure cookies. Omitting the attribute is not the same thing: Chromium browsers then apply a Lax-like default of their own, so behaviour varies by browser.",
        },
        {
          id: "php-web-cookies-q5",
          prompt: "A cookie is set with no `SameSite` attribute. A cross-site form POSTs to your site 30 seconds later in Chrome. Is the cookie sent?",
          options: [
            "Yes — Chrome's Lax-by-default has a roughly two-minute window in which newly set cookies are still sent on cross-site POSTs",
            "No — Lax never sends cookies on cross-site POSTs, with no exceptions",
            "No — a cookie with no `SameSite` is treated as `Strict`",
            "Yes — a cookie with no `SameSite` is always treated as `None`",
          ],
          correctIndex: 0,
          explanation:
            "The default is a more permissive variant of Lax that keeps certain single-sign-on flows working, and it is exactly why \"Chrome defaults to Lax so we are safe from CSRF\" is not a defence. Set the attribute explicitly and still use CSRF tokens.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-cookies-q6",
          prompt: "With `SameSite=Lax`, which cross-site request still carries the cookie?",
          options: [
            "A user clicking a link from another site to yours",
            "An `<img>` on another site pointing at your URL",
            "A `fetch()` from another origin with `credentials: 'include'`",
            "A hidden cross-site form that POSTs to your site",
          ],
          correctIndex: 0,
          explanation:
            "Lax sends the cookie only for top-level navigations that use a safe method — clicking a link qualifies, so logged-in users arriving from search still see their session. Sub-resources, scripted requests and cross-site POSTs do not.",
        },
        {
          id: "php-web-cookies-q7",
          prompt: "A browser will only accept a cookie named `__Host-session` if it meets three conditions. Which set is correct?",
          options: [
            "`Secure`, `Path=/`, and no `Domain` attribute",
            "`Secure`, `HttpOnly`, and `SameSite=Strict`",
            "`Domain` set to the registrable domain, `Path=/`, and `Secure`",
            "`HttpOnly`, `Path=/`, and a `Max-Age` under one day",
          ],
          correctIndex: 0,
          explanation:
            "The prefix guarantees a host-bound, host-wide cookie that no other host on the domain can set or overwrite. Adding a `Domain` — even the correct one — makes the browser reject it, which is the point.",
        },
        {
          id: "php-web-cookies-q8",
          prompt: "You set a cookie with `Domain=example.com` instead of leaving `Domain` out. What changed?",
          options: [
            "The cookie widened: it is now sent to every subdomain of `example.com`, not just the host that set it",
            "The cookie narrowed: it is now sent only to the exact host `example.com`",
            "Nothing — omitting `Domain` already means the whole domain",
            "The cookie became `Secure` implicitly",
          ],
          correctIndex: 0,
          explanation:
            "Omitting `Domain` produces a host-only cookie; naming a domain includes all of its subdomains. That is why a compromised or third-party-hosted subdomain can read or overwrite a domain-wide session cookie.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-cookies-q9",
          prompt: "How do you delete a cookie from PHP?",
          options: [
            "Call `setcookie()` again with an expiry in the past and the *same* path and domain",
            "Call `unset($_COOKIE['name'])`",
            "Call `setcookie('name', '')` with no other arguments",
            "Send `header('Clear-Cookie: name')`",
          ],
          correctIndex: 0,
          explanation:
            "Deletion is just an expired `Set-Cookie`, and the browser matches on name plus path plus domain — mismatch any of them and you create a second cookie while the original survives. `unset($_COOKIE[...])` only edits your own array for this request.",
        },
        {
          id: "php-web-cookies-q10",
          prompt: "Which are good reasons to store a session identifier in the cookie rather than the user's data? (Select all that apply.)",
          options: [
            "Cookies are sent on every matching request, so large cookies cost bandwidth on every hit",
            "Browsers cap a cookie at roughly 4 KB",
            "Cookie contents are client-side and can be read and modified unless you sign or encrypt them",
            "Cookies are only readable by the server that set them, so they need no protection",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "An opaque id keeps the payload tiny and keeps authority on the server. Anything you do put in a cookie must be signed (`hash_hmac()` plus `hash_equals()`) or encrypted, because the client owns the storage.",
        },
      ],
    },
    {
      id: "php-web-sessions",
      moduleId: "php-web",
      trackId: "php",
      title: "Sessions: Storage, Locking and Fixation",
      summary:
        "A PHP session is server-side state keyed by an identifier that lives in a cookie. `session_start()` reads the id, loads the serialized data through the configured save handler (files by default, into `session.save_path`), exposes it as `$_SESSION`, and writes it back at shutdown. The only thing the client ever holds is the id, which is exactly why the id must be unguessable, must travel only in a `Secure`, `HttpOnly` cookie, and must be replaced the moment the user's privilege level changes.\n\nThe files handler takes an exclusive lock for the whole request. That is the single most surprising performance property of PHP sessions: two requests from the same browser — a page and three of its AJAX calls — serialise one behind the other, so a 2-second page delays every sibling request. `session_write_close()` right after the last write releases the lock early and is the standard fix; a Redis or database handler moves the storage off local disk so that multiple app servers can share it, but it does not automatically remove locking, it only changes where it happens.\n\nThe security failure to understand is session fixation: the attacker plants a session id they already know (via a link, a subdomain, or an injected cookie), waits for the victim to log in with it, and then uses it. Two settings make it possible. `session.use_strict_mode` defaults to **0**, which means PHP will happily adopt an unknown id supplied by the browser instead of minting a fresh one — turn it on. And `session_regenerate_id(true)` on login, on privilege escalation and on logout gives the authenticated user an id the attacker never saw. Garbage collection is probabilistic, not a timer: `session.gc_maxlifetime` (1440 s) is the *minimum* a session survives, swept by a `gc_probability/gc_divisor` chance per request, so it is an expiry policy only in the loosest sense.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Session configuration", url: "https://www.php.net/manual/en/session.configuration.php", kind: "docs" },
        { label: "PHP Manual: Sessions and security", url: "https://www.php.net/manual/en/features.session.security.management.php", kind: "docs" },
        { label: "OWASP: Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Session Based Authentication - Session Hijacking & Fixation - Build Expense Tracker App With PHP 8",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=nJWmoetWP0k",
        videoId: "nJWmoetWP0k",
        durationLabel: "17:37",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-sessions-q1",
          prompt: "With PHP's default configuration, where does the contents of `$_SESSION` live between requests?",
          options: [
            "In a file on the server, under `session.save_path`, named after the session id",
            "In the session cookie, serialized and base64-encoded",
            "In shared memory, alongside OPcache",
            "In the database configured in `php.ini`",
          ],
          correctIndex: 0,
          explanation:
            "The default save handler is `files`; the cookie carries only the id. That matters as soon as you run two app servers — local files are not shared, so sessions must move to Redis, Memcached or a database.",
        },
        {
          id: "php-web-sessions-q2",
          prompt: "A page takes 2 seconds and fires three AJAX calls that each take 50 ms. All four requests call `session_start()`. With the default files handler, roughly how long until the last AJAX call returns?",
          options: [
            "Just over 2 seconds — the session file lock serialises them behind the slow page",
            "About 50 ms — they run in parallel",
            "About 150 ms — the three AJAX calls queue behind each other but not behind the page",
            "It fails with a session lock error",
          ],
          correctIndex: 0,
          explanation:
            "The files handler holds an exclusive lock from `session_start()` until the session is written at shutdown, so same-session requests are serialised. `session_write_close()` as soon as the page has finished writing to `$_SESSION` releases it early.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-sessions-q3",
          prompt: "What is session fixation?",
          options: [
            "An attacker gets the victim to authenticate under a session id the attacker already knows, then reuses it",
            "An attacker brute-forces session ids until one is valid",
            "An attacker steals the session cookie with XSS",
            "An attacker replays an expired session id after garbage collection",
          ],
          correctIndex: 0,
          explanation:
            "The attacker never needs to steal anything — they supply the id up front and wait for it to become privileged. Regenerating the id at login is what breaks it; stealing an id with XSS is hijacking, a different attack with a different defence.",
        },
        {
          id: "php-web-sessions-q4",
          prompt: "`session.use_strict_mode` defaults to `0`. What does that mean in practice?",
          options: [
            "PHP accepts an unknown session id sent by the browser and starts a session with it, which is what makes fixation possible",
            "PHP rejects any session id it did not generate, so fixation is impossible by default",
            "PHP validates the id's length and character set but nothing else",
            "PHP regenerates the id on every request",
          ],
          correctIndex: 0,
          explanation:
            "With strict mode off, an uninitialised id is adopted as-is. Turning it on makes PHP discard unknown ids and issue a fresh one, which the manual calls mandatory for general session security — note that a custom save handler must implement `validateId()` or strict mode is silently disabled.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-sessions-q5",
          prompt: "Which of these `php.ini` settings genuinely harden sessions? (Select all that apply.)",
          options: [
            "`session.cookie_httponly = 1`",
            "`session.cookie_secure = 1`",
            "`session.use_strict_mode = 1`",
            "`session.use_trans_sid = 1`",
            "`session.use_only_cookies = 0`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three keep the id out of JavaScript, off plain HTTP, and out of the attacker's control. The last two do the opposite: transparent SID rewriting puts the id in URLs where it leaks through `Referer` and browser history — both are deprecated as of PHP 8.4.",
        },
        {
          id: "php-web-sessions-q6",
          prompt: "What does the `true` argument do in `session_regenerate_id(true)`?",
          options: [
            "Deletes the old session file as well as issuing a new id",
            "Forces the new id to be cryptographically strong",
            "Copies `$_SESSION` into the new session instead of discarding it",
            "Regenerates the id only if the current one was not created by this server",
          ],
          correctIndex: 0,
          explanation:
            "Session data is carried over either way; `$delete_old_session` controls whether the previous record is destroyed. Leaving the old session alive is occasionally deliberate (in-flight requests on a flaky mobile connection) but it also leaves a usable id behind.",
        },
        {
          id: "php-web-sessions-q7",
          prompt: "`session.gc_maxlifetime` is 1440. Does a session reliably expire 24 minutes after its last use?",
          options: [
            "No — collection is probabilistic (`gc_probability`/`gc_divisor`), so 1440 is a minimum lifetime, not a deadline",
            "Yes — PHP runs a timer that deletes the file exactly then",
            "Yes, but only when the files handler is used",
            "No — `gc_maxlifetime` controls the cookie lifetime, not the data lifetime",
          ],
          correctIndex: 0,
          explanation:
            "Garbage collection runs on a chance per request (1 in 100 by default), so stale files can linger indefinitely on a quiet site — and on Debian-family systems PHP's own GC is disabled in favour of a cron job. Enforce real idle timeouts in your own code with a timestamp in `$_SESSION`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-sessions-q8",
          prompt: "Why must `session_start()` be called before any output?",
          options: [
            "It sends the session cookie, and cookies are headers",
            "It needs to read `$_POST`, which is discarded once output begins",
            "It acquires the session lock, which the SAPI releases on first output",
            "It does not — `session_start()` can be called at any point",
          ],
          correctIndex: 0,
          explanation:
            "Starting a session emits a `Set-Cookie` header (and, by default, cache-limiter headers), so the same headers-already-sent rule applies as to `header()` and `setcookie()`.",
        },
        {
          id: "php-web-sessions-q9",
          prompt: "What happens to the write in this code?\n\n```php\nsession_start();\nsession_write_close();\n$_SESSION['cart'] = ['sku-1'];\n```",
          options: [
            "It is lost — the session was already written and closed, so nothing persists it",
            "It is persisted at shutdown as usual",
            "It throws a `RuntimeException`",
            "It is persisted, but only for the current request",
          ],
          correctIndex: 0,
          explanation:
            "`session_write_close()` flushes and releases the lock; `$_SESSION` remains a normal array afterwards, so later writes go nowhere. Close the session *after* the last write, or call `session_start()` again before writing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-sessions-q10",
          prompt: "You move sessions from the files handler to Redis. What problem does that solve?",
          options: [
            "Sessions become shared state, so any app server behind the load balancer can serve any user",
            "Session locking disappears entirely, so concurrent requests never block",
            "Session data is encrypted at rest without further work",
            "Session ids become longer and harder to guess",
          ],
          correctIndex: 0,
          explanation:
            "The real win is shared storage across servers (plus TTL-based expiry instead of probabilistic GC). Locking is a property of the handler's implementation, not something Redis removes for free, and the id and its entropy are unchanged.",
        },
        {
          id: "php-web-sessions-q11",
          prompt: "Which single change does the most to prevent session fixation on a login form?",
          options: [
            "Call `session_regenerate_id(true)` immediately after the credentials are verified",
            "Set `session.gc_maxlifetime` to a small value",
            "Put a CSRF token in the login form",
            "Regenerate the id on every request",
          ],
          correctIndex: 0,
          explanation:
            "Fixation depends on the pre-login id still being valid after login; replacing it at exactly that moment breaks the attack. A CSRF token defends a different attack, and regenerating on every request causes lost sessions when requests race.",
        },
        {
          id: "php-web-sessions-q12",
          prompt: "Which sequence logs a user out properly?",
          options: [
            "Clear `$_SESSION`, call `session_destroy()`, and expire the session cookie with `setcookie()`",
            "Call `session_destroy()` only",
            "Call `unset($_SESSION)` only",
            "Call `session_regenerate_id()` only",
          ],
          correctIndex: 0,
          explanation:
            "`session_destroy()` removes the server-side record but leaves `$_SESSION` populated for the rest of the request and leaves the cookie in the browser, so the id keeps being presented. Doing all three closes the loop on both sides.",
        },
      ],
    },
    {
      id: "php-web-file-uploads",
      moduleId: "php-web",
      trackId: "php",
      title: "Handling File Uploads Safely",
      summary:
        "An upload arrives as a `multipart/form-data` POST; PHP writes each part to a temporary file and describes it in `$_FILES` with `name`, `type`, `size`, `tmp_name`, `error` and (since PHP 8.1) `full_path`. Exactly two of those are produced by your server: `tmp_name` and `size`. `name`, `type` and `full_path` are strings the client chose, so treating `type` as \"the file's MIME type\" or `name` as \"a safe filename\" is trusting the attacker to describe their own payload.\n\nThe safe shape is always the same: check `error === UPLOAD_ERR_OK` first, sniff the real type server-side with `finfo` (and re-encode images where you can), generate your own storage name from a random value plus an extension you derived from the detected type, and move the file with `move_uploaded_file()` — which verifies the path really is a PHP upload before moving, closing a class of local-file-inclusion tricks. Store outside the document root, or in a location where the web server will never hand the file to a PHP handler; \"it's a .jpg\" is not a guarantee, because what executes a file is the server's handler mapping, not its extension.\n\nThe limits are where debugging time disappears. `upload_max_filesize` (2M) caps one file; `post_max_size` (8M) caps the whole body and must be larger; `max_file_uploads` (20) caps the count. If the body exceeds `post_max_size`, PHP does not give you an error code — **both `$_POST` and `$_FILES` come back empty**, so a form that appears to submit nothing is usually a size limit, not a bug in your code. And `MAX_FILE_SIZE`, the hidden form field in every tutorial, is a client-side courtesy that an attacker simply omits.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: Handling file uploads", url: "https://www.php.net/manual/en/features.file-upload.php", kind: "docs" },
        { label: "PHP Manual: File upload error messages", url: "https://www.php.net/manual/en/features.file-upload.errors.php", kind: "docs" },
        { label: "OWASP: File Upload Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html", kind: "article" },
        { label: "PortSwigger: File upload vulnerabilities", url: "https://portswigger.net/web-security/file-upload", kind: "article" },
      ],
      video: {
        title: "PHP File Uploads - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=5PWGAC-mafU",
        videoId: "5PWGAC-mafU",
        durationLabel: "8:32",
      },
      alternateVideos: [
        {
          title: "Web Application Hacking - File Upload Attacks Explained",
          channel: "The Cyber Mentors",
          url: "https://www.youtube.com/watch?v=YAFVGQ-lBoM",
          videoId: "YAFVGQ-lBoM",
          durationLabel: "17:23",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-file-uploads-q1",
          prompt: "Where does `$_FILES['avatar']['type']` come from?",
          options: [
            "The `Content-Type` the client put in the multipart part — PHP does not verify it",
            "PHP's own inspection of the file's magic bytes",
            "The file extension, mapped through `mime.types`",
            "The web server, which sniffs the body before PHP sees it",
          ],
          correctIndex: 0,
          explanation:
            "It is client-supplied metadata, so `image/png` proves nothing. Detect the real type server-side with `finfo_file()` / `mime_content_type()` and compare it against an allowlist.",
        },
        {
          id: "php-web-file-uploads-q2",
          prompt: "A user uploads a 30 MB file with `post_max_size = 8M`. What does the script see?",
          options: [
            "Both `$_POST` and `$_FILES` are empty, with no upload error code to inspect",
            "`$_FILES['file']['error']` is `UPLOAD_ERR_INI_SIZE`",
            "`$_FILES['file']['error']` is `UPLOAD_ERR_FORM_SIZE`",
            "A `ValueError` is thrown before the script runs",
          ],
          correctIndex: 0,
          explanation:
            "Exceeding `post_max_size` aborts parsing of the entire body, so there is no `$_FILES` entry to carry an error. Detect it by comparing `$_SERVER['CONTENT_LENGTH']` against the limit when `$_POST` is unexpectedly empty. `UPLOAD_ERR_INI_SIZE` is the *per-file* `upload_max_filesize` case.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-file-uploads-q3",
          prompt: "What must you check before touching `tmp_name`?",
          options: [
            "That `$_FILES['x']['error'] === UPLOAD_ERR_OK`",
            "That `$_FILES['x']['size'] > 0`",
            "That `$_FILES['x']['name']` has an allowed extension",
            "That `is_file($_FILES['x']['tmp_name'])` returns true",
          ],
          correctIndex: 0,
          explanation:
            "On any failure `tmp_name` is empty or meaningless, and `UPLOAD_ERR_NO_FILE` simply means the user left the field blank — a state you want to handle, not crash on. Size and extension checks come after, and neither replaces the error check.",
        },
        {
          id: "php-web-file-uploads-q4",
          prompt: "Why use `move_uploaded_file()` instead of `rename()` or `copy()`?",
          options: [
            "It verifies the path really was uploaded in this request before moving it",
            "It is the only function that can write outside the document root",
            "It automatically strips executable content from the file",
            "It preserves the original filename safely",
          ],
          correctIndex: 0,
          explanation:
            "If an attacker can influence the value you pass as `tmp_name`, `copy()` would happily read `/etc/passwd`. `move_uploaded_file()` (and `is_uploaded_file()`) refuse anything that is not a genuine upload temp file from this request.",
        },
        {
          id: "php-web-file-uploads-q5",
          prompt: "Which of these meaningfully reduce the risk of an uploaded file being executed? (Select all that apply.)",
          options: [
            "Storing uploads outside the document root and serving them through a PHP script",
            "Generating your own filename and extension from the server-detected type",
            "Configuring the web server so no PHP handler applies to the upload directory",
            "Rejecting any filename that ends in `.php`",
            "Trusting the hidden `MAX_FILE_SIZE` field in the form",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three remove the attacker's ability to get their bytes interpreted. Extension blocklists lose to `.phtml`, `.php5`, double extensions and case tricks, and `MAX_FILE_SIZE` is a client-side hint that an attacker simply omits.",
        },
        {
          id: "php-web-file-uploads-q6",
          prompt: "`finfo` reports `image/jpeg` and the file really does render as an image, but it also contains `<?php …` inside an EXIF comment. Is that a problem?",
          options: [
            "Yes, if the server can ever be made to run the file through a PHP handler — re-encoding the image strips the payload",
            "No — a valid JPEG can never be executed as PHP",
            "No — PHP ignores code outside `.php` files regardless of server configuration",
            "Yes, but only if `allow_url_include` is enabled",
          ],
          correctIndex: 0,
          explanation:
            "Polyglot files pass type checks and still carry code; whether they execute depends on the server's handler mapping and on any local-file-inclusion bug elsewhere. Re-encoding through GD or Imagick produces a fresh file containing only pixels.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-file-uploads-q7",
          prompt: "You need to accept 25 MB uploads. Which pair of settings is coherent?",
          options: [
            "`upload_max_filesize = 25M` with `post_max_size` comfortably larger, e.g. `30M`",
            "`upload_max_filesize = 25M` with `post_max_size = 8M`",
            "`post_max_size = 25M` alone — `upload_max_filesize` only affects `PUT` uploads",
            "`memory_limit = 25M` alone — the other two are advisory",
          ],
          correctIndex: 0,
          explanation:
            "`post_max_size` bounds the whole request body, so it must exceed the per-file limit plus the multipart overhead and any other fields. Setting the file limit above the body limit means the body limit wins, silently.",
        },
        {
          id: "php-web-file-uploads-q8",
          prompt: "A gallery form allows 30 files at once, but only 20 arrive. Which directive is responsible?",
          options: [
            "`max_file_uploads`, which defaults to 20",
            "`max_input_vars`, which defaults to 1000",
            "`upload_max_filesize`, which defaults to 2M",
            "`max_input_nesting_level`, which defaults to 64",
          ],
          correctIndex: 0,
          explanation:
            "`$_FILES` stops accumulating entries once the limit is reached, so the extra files vanish rather than reporting an error. Blank file inputs do not count toward the limit.",
        },
        {
          id: "php-web-file-uploads-q9",
          prompt: "What is wrong with `move_uploaded_file($tmp, '/var/www/uploads/' . $_FILES['f']['name']);`?",
          options: [
            "`name` is attacker-controlled, so it can collide with, overwrite or traverse out of the target directory",
            "`move_uploaded_file()` rejects absolute destination paths",
            "`name` is URL-encoded, so the file lands with a mangled name",
            "Nothing — PHP sanitises `name` before populating `$_FILES`",
          ],
          correctIndex: 0,
          explanation:
            "The client picks that string. Even with `basename()` applied you still face collisions, unicode and length tricks, and a chosen extension — which is why the storage name should be generated by you and the original name kept in the database for display only.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-file-uploads-q10",
          prompt: "Your handler validates the upload and returns an error without moving the file. What happens to the temporary file?",
          options: [
            "PHP deletes it when the request ends",
            "It stays in `upload_tmp_dir` until the next garbage-collection run",
            "It stays until the FPM worker respawns",
            "It is moved to the system temp directory and kept for an hour",
          ],
          correctIndex: 0,
          explanation:
            "Unmoved upload temp files are removed at the end of the request, which is another reason the work must happen in the same request. If you need the bytes later, move them somewhere you control first.",
        },
        {
          id: "php-web-file-uploads-q11",
          prompt: "PHP 8.1 added `$_FILES['x']['full_path']`. What is it for, and how much should you trust it?",
          options: [
            "It carries the relative path the browser reported for directory uploads, and it is client-supplied, so it is untrusted",
            "It is the absolute server path of the temp file, so it is a safer `tmp_name`",
            "It is the final destination path chosen by `move_uploaded_file()`",
            "It is the canonical path after symlink resolution, so it is safe to use directly",
          ],
          correctIndex: 0,
          explanation:
            "It exists so directory uploads (`<input type=\"file\" webkitdirectory>`) can preserve their structure, and the manual is explicit that it does not always reflect a real directory structure and cannot be trusted. `tmp_name` remains the only server-generated path.",
        },
      ],
    },
    {
      id: "php-web-pdo-prepared-statements",
      moduleId: "php-web",
      trackId: "php",
      title: "PDO and Prepared Statements",
      summary:
        "A prepared statement sends the query *shape* and the data on separate channels, so no amount of quoting, casing or comment trickery inside a value can change the parsed statement. That is the whole of the protection, and it explains its limit precisely: only literals are parameterisable. Table names, column names, an `ORDER BY` direction, the contents of an `IN (…)` list and the `LIMIT` clause under some configurations are not values, so they must come from an allowlist you control — never from concatenated input.\n\nConfiguration decides how much of that guarantee you actually get. Set the charset in the DSN (`mysql:host=…;dbname=…;charset=utf8mb4`), not with a later `SET NAMES`, because PDO needs to know the encoding to quote correctly. Set `PDO::ATTR_ERRMODE` deliberately — since PHP 8.0 the default is finally `ERRMODE_EXCEPTION`, so older code that checked return values may now be throwing where it used to limp on. And decide about `PDO::ATTR_EMULATE_PREPARES`, which MySQL enables by default: emulation interpolates the values in PHP and sends one round trip, native prepares send two and let the server keep the plan. Emulation is not inherently unsafe once the DSN charset is right, but it does change behaviour.\n\nThe classic emulation bug is `LIMIT ?, ?`. With emulation on and values passed as an array to `execute()`, every parameter is bound as a string, producing `LIMIT '10', '10'` and a syntax error. Turn emulation off, or bind explicitly with `PDO::PARAM_INT`. The related trap is `IN (?)`: one placeholder binds one value, so a comma-separated string becomes a single literal and matches nothing. Build `IN (?, ?, ?)` with one placeholder per element instead.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Prepared statements and stored procedures", url: "https://www.php.net/manual/en/pdo.prepared-statements.php", kind: "docs" },
        { label: "PHP Manual: PDO::setAttribute", url: "https://www.php.net/manual/en/pdo.setattribute.php", kind: "docs" },
        { label: "PHP Delusions: the only proper PDO tutorial", url: "https://phpdelusions.net/pdo", kind: "article" },
        { label: "OWASP: SQL Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "PHP PDO Tutorial Part 1 - Prepared Statements - SQL Injection - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=wcD5HlEHrnc",
        videoId: "wcD5HlEHrnc",
        durationLabel: "25:18",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-pdo-prepared-statements-q1",
          prompt: "Which of these is injectable?\n\n```php\n// A\n$db->prepare('SELECT * FROM users WHERE email = ?')->execute([$_GET['email']]);\n\n// B\n$stmt = $db->prepare('SELECT * FROM users ORDER BY ' . $_GET['sort']);\n$stmt->execute();\n\n// C\n$stmt = $db->prepare('SELECT * FROM users WHERE id = :id');\n$stmt->execute([':id' => $_GET['id']]);\n\n// D\n$stmt = $db->prepare('SELECT * FROM users WHERE name LIKE ?');\n$stmt->execute(['%' . $_GET['q'] . '%']);\n```",
          options: ["B", "A", "C", "D"],
          correctIndex: 0,
          explanation:
            "B concatenates input into the statement *before* it is parsed, so the placeholder machinery never sees it — an `ORDER BY` is an identifier position and must come from an allowlist. D builds the wildcard in PHP and still binds the whole string as one value, which is safe (though `%` and `_` inside `$q` remain wildcards).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-pdo-prepared-statements-q2",
          prompt: "A user picks which column to sort by. What is the correct implementation?",
          options: [
            "Map the input through an allowlist array of known column names and use the mapped value",
            "Bind the column name as a parameter: `ORDER BY ?`",
            "Wrap the input in `PDO::quote()` and concatenate it",
            "Escape backticks in the input and concatenate it",
          ],
          correctIndex: 0,
          explanation:
            "Identifiers cannot be bound — a bound value always arrives as a literal, so `ORDER BY ?` sorts by a constant string. `PDO::quote()` produces a quoted *string literal*, which is equally wrong in an identifier position. An allowlist is the only answer.",
        },
        {
          id: "php-web-pdo-prepared-statements-q3",
          prompt: "With MySQL's default PDO settings, what does this do?\n\n```php\n$stmt = $pdo->prepare('SELECT * FROM posts LIMIT ?, ?');\n$stmt->execute([0, 10]);\n```",
          options: [
            "Fails with a syntax error, because emulation binds both values as strings: `LIMIT '0', '10'`",
            "Works — PDO detects integers in the array and binds them as integers",
            "Works, but silently ignores the `LIMIT` clause",
            "Throws a `TypeError` from `execute()`",
          ],
          correctIndex: 0,
          explanation:
            "Passing an array to `execute()` binds everything as `PDO::PARAM_STR`, and with emulation on those quotes end up in the SQL. Fix it by turning `PDO::ATTR_EMULATE_PREPARES` off, or by using `bindValue($i, $v, PDO::PARAM_INT)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-pdo-prepared-statements-q4",
          prompt: "What does `PDO::ATTR_EMULATE_PREPARES => false` change for MySQL?",
          options: [
            "The statement is prepared by the server, so the query and its parameters travel separately and the server keeps the plan",
            "PDO stops quoting parameters, so escaping becomes your responsibility",
            "PDO switches from named to positional placeholders",
            "PDO disables prepared statements entirely and runs plain queries",
          ],
          correctIndex: 0,
          explanation:
            "Native prepares cost an extra round trip but let the server parse once and reuse the plan, and they return column values in their native types. Emulation interpolates in PHP, which is still safe once the charset is set in the DSN — but it is where the `LIMIT` and multi-query quirks come from.",
        },
        {
          id: "php-web-pdo-prepared-statements-q5",
          prompt: "Why must the connection charset be set in the DSN rather than with a `SET NAMES` query afterwards?",
          options: [
            "PDO needs to know the client encoding to quote values correctly; `SET NAMES` changes the server's view without telling PDO",
            "`SET NAMES` is not supported by the MySQL driver",
            "`SET NAMES` resets the emulation setting",
            "It makes no difference; both are equivalent",
          ],
          correctIndex: 0,
          explanation:
            "Historically this was an actual injection vector with multibyte charsets like GBK: PHP escaped using one encoding while the server interpreted another. Putting `charset=utf8mb4` in the DSN keeps both sides in agreement.",
        },
        {
          id: "php-web-pdo-prepared-statements-q6",
          prompt: "Since PHP 8.0, what is PDO's default error mode?",
          options: [
            "`PDO::ERRMODE_EXCEPTION`",
            "`PDO::ERRMODE_SILENT`",
            "`PDO::ERRMODE_WARNING`",
            "There is no default; it must be set in the constructor",
          ],
          correctIndex: 0,
          explanation:
            "It was `ERRMODE_SILENT` before PHP 8.0, which is why so much legacy code checks return values and inspects `errorInfo()`. Upgrading such code can surface `PDOException`s from places that previously failed quietly.",
        },
        {
          id: "php-web-pdo-prepared-statements-q7",
          prompt: "Which statements about prepared statements are true? (Select all that apply.)",
          options: [
            "They keep attacker input out of the parsed statement, so injection through a bound value is not possible",
            "They do nothing for identifiers such as table or column names",
            "They do not make the value safe to echo into HTML",
            "They escape HTML entities in values on the way out of the database",
            "They make a query immune to a logic bug such as a missing `WHERE user_id = ?`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Binding is a SQL-layer protection only. Output escaping is a separate concern decided by the destination, and authorisation is a separate concern entirely — a perfectly parameterised query can still return someone else's rows.",
        },
        {
          id: "php-web-pdo-prepared-statements-q8",
          prompt: "What does this match when `$q` is `50%`?\n\n```php\n$stmt = $pdo->prepare('SELECT * FROM products WHERE name LIKE ?');\n$stmt->execute(['%' . $q . '%']);\n```",
          options: [
            "Any name containing `50` followed by anything, because the `%` inside `$q` is still a LIKE wildcard",
            "Only names containing the literal text `50%`",
            "Nothing — the inner `%` makes the pattern invalid",
            "Every row, because LIKE with a bound parameter ignores wildcards",
          ],
          correctIndex: 0,
          explanation:
            "Binding protects the SQL syntax, not the LIKE pattern language: `%` and `_` inside the value keep their wildcard meaning. Escape them in the value (and declare an `ESCAPE` character) when the user meant them literally.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-pdo-prepared-statements-q9",
          prompt: "How many rows does this return when `$ids` is `'1,2,3'`?\n\n```php\n$stmt = $pdo->prepare('SELECT * FROM users WHERE id IN (?)');\n$stmt->execute([$ids]);\n```",
          options: [
            "At most one — the whole string is bound as a single value, so it compares as one literal",
            "Three — MySQL splits the comma-separated list",
            "Zero always — the query is a syntax error",
            "All rows — an `IN` list with one placeholder matches everything",
          ],
          correctIndex: 0,
          explanation:
            "One placeholder is one value. Build the list dynamically — `implode(',', array_fill(0, count($ids), '?'))` — so there is one placeholder per element, and pass the array to `execute()`.",
        },
        {
          id: "php-web-pdo-prepared-statements-q10",
          prompt: "When is `PDO::quote()` the right tool?",
          options: [
            "Almost never — it is a fallback for building a literal when a placeholder genuinely cannot be used",
            "Whenever you want to avoid the overhead of `prepare()`",
            "For quoting table and column names",
            "For escaping values before echoing them into HTML",
          ],
          correctIndex: 0,
          explanation:
            "It produces a quoted string literal for the current connection, which is strictly weaker than binding and useless for identifiers. Reach for it only in rare dynamic-SQL corners, and never as a general substitute for prepared statements.",
        },
        {
          id: "php-web-pdo-prepared-statements-q11",
          prompt: "You prepare a statement once and execute it 1,000 times in a loop. Where does the saving actually come from?",
          options: [
            "Only with native prepares — the server parses and plans once and reuses it per execute",
            "From PHP caching the SQL string, regardless of emulation",
            "From OPcache, which caches the compiled statement",
            "There is no saving; `prepare()` is purely a safety feature",
          ],
          correctIndex: 0,
          explanation:
            "With emulation on, PDO rebuilds and sends a complete SQL string on every `execute()`, so the reuse benefit is zero. It is real with `ATTR_EMULATE_PREPARES => false`, and it is confined to a single PHP request because the handle dies with it.",
        },
        {
          id: "php-web-pdo-prepared-statements-q12",
          prompt: "A signup form throws `PDOException: SQLSTATE[23000] … Duplicate entry`. What is the production-appropriate response?",
          options: [
            "Catch it, inspect the SQLSTATE, and turn it into a friendly \"that email is taken\" message while logging the details",
            "Let it bubble up so the user sees the exception message",
            "Switch that connection to `ERRMODE_SILENT` so it stops throwing",
            "Check for an existing row first, then insert, and drop the unique constraint",
          ],
          correctIndex: 0,
          explanation:
            "An uncaught `PDOException` leaks the query, and often connection details, into the response. Silencing errors hides real failures, and a check-then-insert without the constraint reintroduces the race the constraint was protecting you from.",
        },
      ],
    },
    {
      id: "php-web-pdo-transactions",
      moduleId: "php-web",
      trackId: "php",
      title: "Transactions and Connection Handling with PDO",
      summary:
        "By default every statement you send is its own transaction, committed the moment it succeeds. `PDO::beginTransaction()` suspends that autocommit for the connection until `commit()` or `rollBack()`, which is how you make several statements succeed or fail as one unit. The pattern is small and should be identical everywhere: begin, do the work inside `try`, commit at the end, `rollBack()` in `catch`, rethrow. Guard the rollback with `inTransaction()`, because rolling back when no transaction is active throws in its own right.\n\nWhat surprises people is that a transaction can end without your permission. In MySQL, DDL such as `CREATE TABLE`, `ALTER TABLE`, `TRUNCATE` and `DROP` causes an **implicit commit**, so a migration that mixes schema changes with data changes inside one transaction is not atomic no matter what your code looks like. PDO also has no real nesting: a second `beginTransaction()` on the same connection throws, so \"nested transactions\" in libraries are a depth counter plus `SAVEPOINT`s. And if the script ends with a transaction still open, the connection closes and the server rolls it back — safe, but it means a forgotten `commit()` fails silently rather than loudly.\n\nThe operational point is that a transaction holds locks, and in a shared-nothing runtime it holds them for the whole time a worker is blocked. Doing an HTTP call, sending an email or writing a file between `beginTransaction()` and `commit()` turns a third party's latency into row locks on your primary database. Keep transactions short, put side effects after the commit (or in a queued job), and be wary of `PDO::ATTR_PERSISTENT`: a persistent connection handed back with an open transaction or altered session settings is inherited by the next request on that worker.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: Transactions and auto-commit", url: "https://www.php.net/manual/en/pdo.transactions.php", kind: "docs" },
        { label: "PHP Manual: PDO::beginTransaction", url: "https://www.php.net/manual/en/pdo.begintransaction.php", kind: "docs" },
        { label: "MySQL: Statements That Cause an Implicit Commit", url: "https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html", kind: "docs" },
      ],
      video: {
        title: "PHP PDO Tutorial Part 2 - Transactions - Env Variables & PHPDotEnv - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=e6yLUvpcOZo",
        videoId: "e6yLUvpcOZo",
        durationLabel: "17:01",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-pdo-transactions-q1",
          prompt: "What does `PDO::beginTransaction()` actually change?",
          options: [
            "It turns off autocommit on that connection until `commit()` or `rollBack()` is called",
            "It takes a table-level lock for the duration",
            "It opens a second connection reserved for the transaction",
            "It queues statements in PHP and sends them all at `commit()`",
          ],
          correctIndex: 0,
          explanation:
            "Statements are still sent and executed immediately; what changes is that they are not durable until you commit. Locks are taken by the statements themselves according to the isolation level, not by `beginTransaction()`.",
        },
        {
          id: "php-web-pdo-transactions-q2",
          prompt: "A migration runs inside a transaction: `ALTER TABLE users ADD COLUMN tz VARCHAR(64)`, then an `UPDATE`, then something fails and you call `rollBack()`. On MySQL, what is undone?",
          options: [
            "Nothing from before the `ALTER` — DDL causes an implicit commit, so the transaction ended there",
            "Both the `ALTER` and the `UPDATE`",
            "Only the `ALTER`",
            "Nothing at all — `rollBack()` throws because DDL closed the connection",
          ],
          correctIndex: 0,
          explanation:
            "MySQL implicitly commits before and after most DDL, so the transaction you thought you were in was silently ended and a new one begun. This is why schema and data migrations are kept in separate, individually reversible steps (PostgreSQL, by contrast, has transactional DDL).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-pdo-transactions-q3",
          prompt: "What happens on the second call here?\n\n```php\n$pdo->beginTransaction();\n$pdo->beginTransaction();\n```",
          options: [
            "A `PDOException` — there is already an active transaction on that connection",
            "The transactions nest, and two `commit()` calls are then needed",
            "The second call is a silent no-op",
            "The first transaction is committed and a new one begins",
          ],
          correctIndex: 0,
          explanation:
            "PDO has no nesting. Libraries that advertise nested transactions keep a depth counter and issue `SAVEPOINT` / `ROLLBACK TO SAVEPOINT` for the inner levels, committing only when the outermost level finishes.",
        },
        {
          id: "php-web-pdo-transactions-q4",
          prompt: "A request opens a transaction, writes three rows, and then the script ends without calling `commit()`. What is persisted?",
          options: [
            "Nothing — the connection closes with an open transaction and the server rolls it back",
            "All three rows, because PDO commits on destruct",
            "The first row only",
            "All three, but only after the next successful transaction on that connection",
          ],
          correctIndex: 0,
          explanation:
            "An open transaction dies with the connection, and shared-nothing means the connection dies with the request. It is a safe default but a quiet one: a missing `commit()` produces silently missing data rather than an error.",
        },
        {
          id: "php-web-pdo-transactions-q5",
          prompt: "Which of these genuinely need an explicit transaction? (Select all that apply.)",
          options: [
            "Debiting one account row and crediting another",
            "Inserting an order and its line items",
            "Reading a counter, adding to it, and writing it back without losing a concurrent update",
            "A single-row `UPDATE`",
            "A single `SELECT`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first two need several statements to be all-or-nothing; the third needs a transaction so that `SELECT … FOR UPDATE` can hold the row while you compute. A single statement is already atomic on its own, and a lone `SELECT` needs one only when you want a consistent multi-statement snapshot.",
        },
        {
          id: "php-web-pdo-transactions-q6",
          prompt: "Why guard the rollback with `if ($pdo->inTransaction())`?",
          options: [
            "Because `rollBack()` throws when no transaction is active — which can happen after an implicit commit or a lost connection",
            "Because `rollBack()` is asynchronous and needs a completion check",
            "Because otherwise the rollback also reverts the previous transaction",
            "It is unnecessary; `rollBack()` is always safe to call",
          ],
          correctIndex: 0,
          explanation:
            "Inside a `catch` you do not know whether the transaction is still open — DDL may have committed it, or the server may have dropped the connection — and an exception thrown from your error handler hides the original failure.",
        },
        {
          id: "php-web-pdo-transactions-q7",
          prompt: "Two requests insert into the same table at the same time. Is `$pdo->lastInsertId()` reliable?",
          options: [
            "Yes — it reports the id generated on *this* connection, so concurrent connections cannot interfere",
            "No — it returns the highest id in the table, so it can return another request's id",
            "Only inside an explicit transaction",
            "Only when `ATTR_EMULATE_PREPARES` is off",
          ],
          correctIndex: 0,
          explanation:
            "It maps to the driver's per-connection last-insert-id, which is exactly why it is safe under concurrency. It is *not* safe across a multi-row insert (it gives the first id on MySQL) or after any intervening insert on the same connection.",
        },
        {
          id: "php-web-pdo-transactions-q8",
          prompt: "What is wrong with doing this between `beginTransaction()` and `commit()`?\n\n```php\n$pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute(['paid', $id]);\n$gateway->capture($paymentId);   // HTTPS call, 200–3000 ms\n$pdo->commit();\n```",
          options: [
            "The row locks are held for the whole gateway call, so a slow third party becomes database contention",
            "PDO forbids network calls while a transaction is open",
            "The gateway call resets the connection's autocommit flag",
            "Nothing — this is the standard way to keep payment and order state consistent",
          ],
          correctIndex: 0,
          explanation:
            "Transaction duration is lock duration. Do the external call outside the transaction (or in a queued job) and reconcile afterwards — and remember that a remote call inside a transaction cannot be rolled back anyway.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-pdo-transactions-q9",
          prompt: "What is the risk of `PDO::ATTR_PERSISTENT => true`?",
          options: [
            "A connection returned to the pool can carry state — an open transaction, temp tables, altered session variables — into the next request on that worker",
            "Persistent connections cannot use prepared statements",
            "They are shared between FPM workers, so two requests can interleave queries",
            "They bypass the DSN charset, so values are quoted incorrectly",
          ],
          correctIndex: 0,
          explanation:
            "Persistence saves the handshake but keeps a real server session alive across requests, so anything not reset leaks forward. Each worker still has its own connection, so there is no interleaving — the danger is inherited state, plus `max_children` connections held open permanently.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-pdo-transactions-q10",
          prompt: "Which structure is correct for a transactional write?",
          options: [
            "`beginTransaction()`, then the work in `try`, `commit()` at the end, `rollBack()` in `catch` followed by a rethrow",
            "The work in `try`, `beginTransaction()` in `catch`, then `commit()`",
            "`beginTransaction()`, the work, `commit()` — with no `catch`, relying on the connection closing",
            "`beginTransaction()`, the work, and `rollBack()` in a `finally` block",
          ],
          correctIndex: 0,
          explanation:
            "Commit on the success path, roll back on the failure path, and rethrow so the caller knows it failed. A `rollBack()` in `finally` would undo successful work, and relying on the connection closing works only when the script actually dies.",
        },
      ],
    },
    {
      id: "php-web-password-hashing",
      moduleId: "php-web",
      trackId: "php",
      title: "Password Hashing with password_hash",
      summary:
        "Passwords are not encrypted, they are hashed with a deliberately slow, salted function, so that a stolen database is expensive rather than catastrophic. PHP gives you exactly one API you should use: `password_hash()` generates a cryptographically random salt, runs the chosen algorithm, and returns a self-describing string — algorithm, cost and salt are all encoded in it. `password_verify()` reads those parameters back out of the stored hash and re-derives, which is why you never store a salt separately and never compare hashes with `===` (two hashes of the same password differ, by design).\n\n`PASSWORD_DEFAULT` is currently an alias for bcrypt, and the manual is explicit that it is meant to change as stronger algorithms land — so the column must be wide enough for whatever comes next (255 is the recommended width, not the 60 bcrypt happens to need today). PHP 8.4 raised bcrypt's default cost from 10 to 12; raising cost is the standard way to keep pace with hardware, and `password_needs_rehash()` on a successful login is how an existing user base migrates: you have the plaintext for exactly one moment, so rehash and store it then.\n\nThe sharp edge is bcrypt's 72-byte input limit — anything beyond it is truncated, so a 200-character passphrase is decided by its first 72 bytes, and multibyte characters eat that budget in bytes rather than characters. OWASP's current guidance is Argon2id first, then scrypt, with bcrypt for legacy systems precisely because of that limit; `PASSWORD_ARGON2ID` is available when PHP was built with Argon2 support, and its `memory_cost` makes it far harder to attack with GPUs. Whatever you pick, the remaining failure mode is operational: identical responses and timing for \"no such user\" and \"wrong password\", or you have built a user-enumeration endpoint.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: password_hash", url: "https://www.php.net/manual/en/function.password-hash.php", kind: "docs" },
        { label: "PHP Manual: Password hashing constants", url: "https://www.php.net/manual/en/password.constants.php", kind: "docs" },
        { label: "OWASP: Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "User Registration & Password Hashing - Build Expense Tracker App With PHP 8",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=TqXMaj2Z-GQ",
        videoId: "TqXMaj2Z-GQ",
        durationLabel: "13:19",
      },
      alternateVideos: [
        {
          title: "Password Storage Tier List: encryption, hashing, salting, bcrypt, and beyond",
          channel: "Studying With Alex",
          url: "https://www.youtube.com/watch?v=qgpsIBLvrGY",
          videoId: "qgpsIBLvrGY",
          durationLabel: "10:16",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-password-hashing-q1",
          prompt: "Which algorithm does `password_hash($p, PASSWORD_DEFAULT)` currently use, and how wide should the column be?",
          options: [
            "bcrypt today, but `VARCHAR(255)` — the constant is documented to change as stronger algorithms are added",
            "bcrypt, and `CHAR(60)` exactly, since bcrypt hashes are always 60 bytes",
            "Argon2id, and `VARCHAR(255)`",
            "SHA-256 with a random salt, and `CHAR(64)`",
          ],
          correctIndex: 0,
          explanation:
            "`PASSWORD_DEFAULT` is an alias for `PASSWORD_BCRYPT` right now, and the manual recommends 255 bytes precisely because the default is expected to move. A 60-character column silently truncates the day it does, and every stored hash becomes unverifiable.",
        },
        {
          id: "php-web-password-hashing-q2",
          prompt: "Two users choose passwords that share their first 72 bytes but differ afterwards. With `PASSWORD_BCRYPT`, what happens?",
          options: [
            "Each can log in with the other's password — bcrypt truncates the input at 72 bytes",
            "The hashes differ, so nothing unusual happens",
            "`password_hash()` throws a `ValueError` for inputs over 72 bytes",
            "PHP pre-hashes long inputs with SHA-512 automatically",
          ],
          correctIndex: 0,
          explanation:
            "The truncation is documented and is the main reason OWASP puts Argon2id ahead of bcrypt. If you must stay on bcrypt with long passphrases, pre-hash carefully (base64 the digest so no NUL byte sneaks in) or set a maximum length users are told about.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-password-hashing-q3",
          prompt: "Where does the salt come from, and where is it stored?",
          options: [
            "`password_hash()` generates a random salt per call and embeds it in the returned hash string",
            "You must generate a salt and store it in a second column",
            "The salt is derived from the username, so it is unique per user",
            "There is no salt; bcrypt does not need one",
          ],
          correctIndex: 0,
          explanation:
            "The hash string encodes the algorithm, the cost and the salt, which is how `password_verify()` can re-derive without any extra storage. Supplying your own salt was deprecated and, as of PHP 8.0, is ignored entirely.",
        },
        {
          id: "php-web-password-hashing-q4",
          prompt: "Why can you not verify a login with `if (password_hash($input, PASSWORD_DEFAULT) === $stored)`?",
          options: [
            "A fresh random salt is used each time, so hashing the same password twice never produces the same string",
            "`password_hash()` returns an object, not a string",
            "`===` compares by reference for long strings",
            "You can — it is simply slower than `password_verify()`",
          ],
          correctIndex: 0,
          explanation:
            "Distinct salts are the point: they defeat rainbow tables and stop identical passwords looking identical in the dump. `password_verify()` extracts the stored salt and cost and compares in constant time.",
        },
        {
          id: "php-web-password-hashing-q5",
          prompt: "You raise the bcrypt cost from 10 to 12. How do existing users' hashes get upgraded?",
          options: [
            "On the next successful login, check `password_needs_rehash()` and re-hash the plaintext you have at that moment",
            "Run a migration that re-hashes every stored hash with the new cost",
            "Call `password_get_info()` on each row and let PHP upgrade it in place",
            "They cannot be upgraded; existing users must reset their passwords",
          ],
          correctIndex: 0,
          explanation:
            "A hash cannot be strengthened without the plaintext, and login is the only moment you legitimately hold it. `password_needs_rehash($stored, PASSWORD_DEFAULT)` also catches the day `PASSWORD_DEFAULT` changes algorithm.",
        },
        {
          id: "php-web-password-hashing-q6",
          prompt: "Which statements about `password_hash()` are true? (Select all that apply.)",
          options: [
            "The returned string encodes the algorithm, its parameters and the salt",
            "Hashing the same password twice yields two different strings",
            "The `cost` option is a work factor: each increment roughly doubles the time",
            "MD5 or SHA-1 with a per-user salt is an acceptable substitute",
            "Passwords should be encrypted rather than hashed so support can recover them",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Self-describing output, per-call salts and a tunable work factor are the three properties that make the API safe. Fast general-purpose digests are the wrong tool however you salt them, and recoverable passwords mean a key compromise equals a plaintext dump.",
        },
        {
          id: "php-web-password-hashing-q7",
          prompt: "What is bcrypt's default `cost` in `password_hash()` on PHP 8.4 and later?",
          options: ["12", "10", "8", "There is no default; it must be supplied"],
          correctIndex: 0,
          explanation:
            "It was raised from 10 to 12 in PHP 8.4 to track hardware. Because the cost is stored inside each hash, old hashes keep verifying at their original cost — `password_needs_rehash()` is what moves them up.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-password-hashing-q8",
          prompt: "OWASP's current ordering for password storage in new applications is:",
          options: [
            "Argon2id first, then scrypt, with bcrypt for legacy systems",
            "bcrypt first, then Argon2id, with PBKDF2 for legacy systems",
            "PBKDF2 first, because it is FIPS-approved and therefore strongest",
            "SHA-512 with many iterations, because it is the fastest to verify",
          ],
          correctIndex: 0,
          explanation:
            "Argon2id's memory hardness is what makes GPU and ASIC attacks expensive; bcrypt remains acceptable but carries the 72-byte limit. Verification speed is not a virtue here — slowness is the feature.",
        },
        {
          id: "php-web-password-hashing-q9",
          prompt: "`PASSWORD_ARGON2ID` is not defined on your production server although the code works locally. Why?",
          options: [
            "The Argon2 algorithms are only available when PHP was built with Argon2 (or sodium) support",
            "Argon2 was removed in PHP 8 and replaced by bcrypt",
            "Argon2 requires `opcache.jit` to be enabled",
            "The constant only exists under the CLI SAPI",
          ],
          correctIndex: 0,
          explanation:
            "Argon2 support is a compile-time option, so distro packages vary. Check with `password_algos()` at boot and fail loudly rather than silently falling back to a weaker default.",
        },
        {
          id: "php-web-password-hashing-q10",
          prompt: "Your login returns \"no such user\" quickly and \"wrong password\" after ~200 ms of hashing. What have you built?",
          options: [
            "A user-enumeration oracle — an attacker can confirm which addresses are registered from the timing alone",
            "Nothing exploitable; only the message text matters",
            "A timing side channel that leaks the password hash",
            "A denial-of-service vector, but no information leak",
          ],
          correctIndex: 0,
          explanation:
            "Different messages *and* different response times both leak membership. Return one generic message and verify against a dummy hash when the user does not exist, so both paths cost the same.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "php-web-xss-csrf",
      moduleId: "php-web",
      trackId: "php",
      title: "XSS and CSRF in Plain PHP",
      summary:
        "XSS and CSRF are opposite failures of the same trust relationship. XSS is the site trusting data it renders: attacker-controlled text becomes markup or script in a victim's browser, and then it runs with your origin's full authority — reading the DOM, calling your endpoints, and reaching `HttpOnly`-protected sessions indirectly by simply using them. CSRF is the browser trusting the site: because cookies are attached automatically to any request to your origin, a page on another site can cause a state-changing request that your server cannot distinguish from a real one.\n\nThe XSS fix is escaping at output, chosen by context. `htmlspecialchars()` is correct for text and for quoted attribute values — and since PHP 8.1 its default flags are `ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401`, which finally escapes single quotes and replaces invalid UTF-8 instead of returning an empty string. It is *not* sufficient inside a `<script>` block, in a URL where the scheme is attacker-controlled, or in an unquoted attribute, where a space is enough to add a new one. Blocklists and `strip_tags()` lose; a Content-Security-Policy is worthwhile defence in depth but is not a substitute for escaping, and `'unsafe-inline'` defeats most of the point.\n\nThe CSRF fix is proving the request came from your own page. The synchroniser token pattern is still the baseline: `random_bytes()` into the session, the same value in a hidden field, and `hash_equals()` to compare on every state-changing request. `SameSite=Lax` cookies remove a large slice of the attack surface and belong in every configuration, but they are a browser behaviour with defaults, exceptions and per-browser variation — and they do nothing for a state-changing `GET`, which is its own bug. Use both, and keep `GET` free of side effects.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "PHP Manual: htmlspecialchars", url: "https://www.php.net/manual/en/function.htmlspecialchars.php", kind: "docs" },
        { label: "PHP Manual: hash_equals", url: "https://www.php.net/manual/en/function.hash-equals.php", kind: "docs" },
        { label: "OWASP: Cross Site Scripting Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", kind: "article" },
        { label: "OWASP: CSRF Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Cross-Site Scripting (XSS) Explained",
        channel: "PwnFunction",
        url: "https://www.youtube.com/watch?v=EoaDgUgS6QA",
        videoId: "EoaDgUgS6QA",
        durationLabel: "11:27",
      },
      alternateVideos: [
        {
          title: "Cross-Site Request Forgery (CSRF) Explained",
          channel: "PwnFunction",
          url: "https://www.youtube.com/watch?v=eWEgUcHPle0",
          videoId: "eWEgUcHPle0",
          durationLabel: "14:11",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-xss-csrf-q1",
          prompt: "On PHP 8.0, this was exploitable; on PHP 8.1+ it is not. Why?\n\n```php\n<input value='<?= htmlspecialchars($name) ?>'>\n```",
          options: [
            "The default flags changed to include `ENT_QUOTES`, so single quotes are now escaped and cannot close the attribute",
            "PHP 8.1 made `htmlspecialchars()` strip all quotes from its input",
            "PHP 8.1 started escaping the output of `<?=` automatically",
            "PHP 8.1 blocks single-quoted attributes in the template compiler",
          ],
          correctIndex: 0,
          explanation:
            "The default was `ENT_COMPAT`, which escaped double quotes only, so a `'` in the value broke out of a single-quoted attribute. It is now `ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401` — but pass the flags explicitly anyway if you support older versions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-xss-csrf-q2",
          prompt: "Is this safe?\n\n```php\n<script>var user = '<?= htmlspecialchars($name) ?>';</script>\n```",
          options: [
            "No — HTML escaping is the wrong context inside a script block; use `json_encode()` with the HTML-escaping flags",
            "Yes — `htmlspecialchars()` neutralises every character that matters",
            "Yes, as long as `ENT_QUOTES` is passed",
            "No, but only because the value is not URL-encoded",
          ],
          correctIndex: 0,
          explanation:
            "Inside a script block the parser sees JavaScript, and sequences such as `</script>` or a line separator break out regardless of HTML entities. `json_encode($name, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)` emits a safe JavaScript literal.",
        },
        {
          id: "php-web-xss-csrf-q3",
          prompt: "Which of these are XSS sinks in a PHP template? (Select all that apply.)",
          options: [
            "Echoing a value into an unquoted attribute, e.g. `<div class=<?= $v ?>>`",
            "Echoing a value inside a `<script>` block",
            "Echoing a user-supplied URL into `href` without checking the scheme",
            "Echoing `htmlspecialchars($v)` into the text of a `<p>`",
            "Storing the raw value in the database",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Unquoted attributes need only a space to gain an `onmouseover`, script context is a different language, and a `javascript:` URL executes on click. Escaped text in an element body is the one case `htmlspecialchars()` fully covers, and storing raw data is fine as long as output is escaped.",
        },
        {
          id: "php-web-xss-csrf-q4",
          prompt: "What distinguishes stored XSS from reflected XSS?",
          options: [
            "Stored XSS is persisted server-side and served to every viewer; reflected XSS is echoed back from the current request",
            "Stored XSS runs on the server; reflected XSS runs in the browser",
            "Stored XSS requires a database; reflected XSS requires a session",
            "Stored XSS affects only the attacker's own account",
          ],
          correctIndex: 0,
          explanation:
            "The difference is delivery, and it determines blast radius: a stored payload in a profile bio hits everyone who views it, while a reflected one needs the victim to follow a crafted link. DOM XSS is a third variant where the sink is client-side JavaScript and the payload may never reach the server.",
        },
        {
          id: "php-web-xss-csrf-q5",
          prompt: "Why does CSRF work at all?",
          options: [
            "Browsers attach cookies for your origin to requests triggered by any site, so the forged request looks authenticated",
            "The attacker can read the victim's session cookie from another origin",
            "PHP accepts session ids from the query string by default",
            "The victim's browser sends the CSRF token automatically",
          ],
          correctIndex: 0,
          explanation:
            "The attacker never reads anything — the same-origin policy stops that. They only need to *cause* a request, and ambient cookie authority does the rest, which is why the defence must be something the attacker cannot guess or read.",
        },
        {
          id: "php-web-xss-csrf-q6",
          prompt: "Which implementation of the synchroniser token pattern is correct?",
          options: [
            "Store `bin2hex(random_bytes(32))` in the session, emit it in a hidden field, and compare with `hash_equals()` on POST",
            "Emit `md5(session_id())` in a hidden field and recompute it on POST",
            "Emit the user's id in a hidden field and check it matches the logged-in user",
            "Put the token in a query parameter on every link, including GETs",
          ],
          correctIndex: 0,
          explanation:
            "The token must be unpredictable and tied to the session. Deriving it from the session id or the user id makes it guessable by anyone who learns either, and putting it in URLs leaks it through `Referer`, logs and shared links.",
        },
        {
          id: "php-web-xss-csrf-q7",
          prompt: "Why compare CSRF tokens with `hash_equals($expected, $given)` rather than `===`?",
          options: [
            "`hash_equals()` compares in constant time, so the comparison does not leak information through timing",
            "`===` on two strings performs a numeric comparison when both look numeric",
            "`hash_equals()` also checks the token's length and expiry",
            "`===` is case-insensitive for hexadecimal strings",
          ],
          correctIndex: 0,
          explanation:
            "A short-circuiting comparison takes measurably longer the more leading characters match, which is the standard way secrets are recovered byte by byte. `hash_equals()` exists for exactly this class of comparison — `===` is at least type-safe, unlike `==`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-xss-csrf-q8",
          prompt: "Your session cookie is `SameSite=Lax`. Is CSRF solved?",
          options: [
            "No — it is strong defence in depth, but state-changing `GET` endpoints remain exploitable and browser behaviour varies",
            "Yes — Lax blocks every cross-site request that carries cookies",
            "Yes, provided the cookie is also `HttpOnly`",
            "No — Lax has no effect on CSRF at all",
          ],
          correctIndex: 0,
          explanation:
            "Lax still sends the cookie on top-level navigations with safe methods, so a `GET /account/delete?id=7` link is untouched, and the browser default has its own permissive window. Keep tokens, keep `GET` side-effect free, and set the attribute anyway.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-xss-csrf-q9",
          prompt: "How much does `HttpOnly` limit an attacker who already has XSS on your page?",
          options: [
            "It stops them reading the session cookie, but their script can still make authenticated requests as the victim",
            "It stops the script running at all",
            "It has no effect once XSS exists",
            "It stops the browser sending the cookie on requests made by scripts",
          ],
          correctIndex: 0,
          explanation:
            "Exfiltration becomes hard; abuse does not. The injected script runs in your origin, so `fetch('/admin/promote', {method:'POST'})` carries the cookie automatically — which is why `HttpOnly` is a mitigation, not a fix.",
        },
        {
          id: "php-web-xss-csrf-q10",
          prompt: "What does a Content-Security-Policy realistically buy you against XSS?",
          options: [
            "It blocks injected inline and third-party scripts from executing — unless the policy includes `'unsafe-inline'`",
            "It sanitises user input before it reaches your templates",
            "It makes escaping unnecessary if the policy is strict enough",
            "It prevents the injected markup from being stored",
          ],
          correctIndex: 0,
          explanation:
            "CSP is a second line of defence that turns many injections into a console error, most usefully with nonces or hashes plus `strict-dynamic`. `'unsafe-inline'` re-permits exactly the payloads it was meant to stop, and no policy repairs an unescaped template.",
        },
        {
          id: "php-web-xss-csrf-q11",
          prompt: "A reviewer suggests running all input through `strip_tags()` on the way in. What is wrong with that?",
          options: [
            "It destroys legitimate data and still misses attribute-, URL- and script-context payloads — escaping belongs at output",
            "`strip_tags()` was removed in PHP 8",
            "It is correct, but too slow for large inputs",
            "It only works on UTF-8 input",
          ],
          correctIndex: 0,
          explanation:
            "Filtering on input makes the stored value lossy and still leaves every non-HTML context unprotected. When you genuinely must accept user HTML, use a real sanitiser with an allowlist (HTML Purifier) and keep escaping everywhere else.",
        },
      ],
    },
    {
      id: "php-web-production-config",
      moduleId: "php-web",
      trackId: "php",
      title: "Production php.ini, OPcache and Error Logging",
      summary:
        "The gap between a working app and a production app is mostly configuration. Three settings decide how errors behave: `display_errors` must be `Off` so stack traces never reach a user, `log_errors` must be `On` with a destination you actually read, and `error_reporting` should stay at `E_ALL` — hiding diagnostics from the log is not the same as not having bugs. Traces matter here too: `zend.exception_ignore_args` defaults to `0`, so argument values (tokens, passwords, connection strings) can appear in a logged trace, and `expose_php` defaults to `1`, advertising your exact version in `X-Powered-By`.\n\nOPcache is the single largest performance lever, and its defaults are conservative: 128 MB of shared memory, 10,000 cached files, and `validate_timestamps = 1` with a 2-second revalidation window. On a busy app with a big vendor directory, exceeding `max_accelerated_files` or the memory budget means new files simply stop being cached and are recompiled on every request — a cliff rather than a slope, visible in `opcache_get_status()`. Turning `validate_timestamps` off removes the stat calls entirely and is the right production setting, but only if your deploy resets the cache (reload FPM or call `opcache_reset()` inside the pool, not from the CLI — they do not share memory). JIT is off by default and stays off for typical web workloads, which are I/O bound, not arithmetic bound.\n\nThe limits worth understanding rather than copying: `memory_limit` (128M) is per request and multiplies by `pm.max_children`, so raising it to 1G on a 4 GB box is an outage waiting to happen; `max_execution_time` (30) ignores time spent in database calls and external I/O; `post_max_size` must exceed `upload_max_filesize`. Finally, PHP's error model needs three handlers to be fully covered: `set_error_handler()` for diagnostics, `set_exception_handler()` for uncaught throwables, and `register_shutdown_function()` with `error_get_last()` for the fatals the first two never see.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Error-handling configuration", url: "https://www.php.net/manual/en/errorfunc.configuration.php", kind: "docs" },
        { label: "PHP Manual: OPcache configuration", url: "https://www.php.net/manual/en/opcache.configuration.php", kind: "docs" },
        { label: "PHP Manual: set_error_handler", url: "https://www.php.net/manual/en/function.set-error-handler.php", kind: "docs" },
        { label: "OWASP: PHP Configuration Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Everything about OPcache to increase PHP performance (2026)",
        channel: "Tideways",
        url: "https://www.youtube.com/watch?v=LcIkUpcaXZc",
        videoId: "LcIkUpcaXZc",
        durationLabel: "25:20",
      },
      alternateVideos: [
        {
          title: "How To Work With PHPs Configuration File - PHP.INI - Full PHP 8 Tutorial",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=LVEhccXXnOo",
          videoId: "LVEhccXXnOo",
          durationLabel: "7:25",
        },
        {
          title: "PHP Error Handling & Error Handlers - Full PHP 8 Tutorial",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=rQntgj7yink",
          videoId: "rQntgj7yink",
          durationLabel: "7:29",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-web-production-config-q1",
          prompt: "Which combination is right for a production server?",
          options: [
            "`display_errors = Off`, `log_errors = On`, `error_reporting = E_ALL`",
            "`display_errors = Off`, `log_errors = Off`, `error_reporting = 0`",
            "`display_errors = On`, `log_errors = On`, `error_reporting = E_ALL & ~E_NOTICE`",
            "`display_errors = stderr`, `log_errors = Off`, `error_reporting = E_ERROR`",
          ],
          correctIndex: 0,
          explanation:
            "Users see nothing, you see everything. Lowering `error_reporting` to quieten the log hides the deprecations and warnings that predict the next upgrade's breakage; filter at the log-processing layer instead.",
        },
        {
          id: "php-web-production-config-q2",
          prompt: "Beyond looking unprofessional, what does an exposed PHP stack trace give an attacker? (Select all that apply.)",
          options: [
            "Absolute filesystem paths, which help with local-file-inclusion and log-poisoning attacks",
            "Framework and library versions to match against known CVEs",
            "Argument values — `zend.exception_ignore_args` defaults to 0, so secrets passed as arguments can appear",
            "The contents of the session store for every user",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Traces are a free reconnaissance report, and the argument capture is the part people forget — a DSN or an API key passed to a constructor ends up in the trace. It cannot dump other users' sessions, but it often reveals enough to get there.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-production-config-q3",
          prompt: "A script hits the 128M `memory_limit`, so someone sets `memory_limit = 1G` on a 4 GB box running `pm.max_children = 30`. What is the risk?",
          options: [
            "The limit is per request, so enough concurrent heavy requests can exhaust the machine's memory",
            "None — only one request can use the limit at a time",
            "OPcache's shared memory is taken from the same budget, so it will be evicted",
            "`memory_limit` above 512M is ignored by PHP",
          ],
          correctIndex: 0,
          explanation:
            "Worst case is `max_children` × `memory_limit`. Raising the limit is a legitimate fix for a genuinely large job, but the job usually belongs in a CLI worker with its own limit rather than in a web request.",
        },
        {
          id: "php-web-production-config-q4",
          prompt: "What does `opcache.validate_timestamps = 0` change, and what must the deploy do?",
          options: [
            "PHP stops stat-ing files for changes, so the deploy must reset the cache — by reloading FPM or calling `opcache_reset()` inside the pool",
            "PHP caches file modification times instead of contents, so no deploy change is needed",
            "PHP validates timestamps only once per hour, so the deploy should sleep 60 minutes",
            "PHP disables OPcache entirely, so the deploy needs no action",
          ],
          correctIndex: 0,
          explanation:
            "Skipping the stat calls is free performance and makes deploys atomic-or-broken rather than half-old-half-new. The trap is resetting from a CLI script: the CLI has its own OPcache instance and shares no memory with the FPM master.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-production-config-q5",
          prompt: "A large app with a big `vendor/` directory exceeds `opcache.max_accelerated_files` (default 10000). What is the symptom?",
          options: [
            "Files beyond the limit are not cached and are recompiled on every request, so latency rises sharply",
            "OPcache evicts the least recently used entries, so performance degrades gradually",
            "PHP throws a fatal error on the next `require`",
            "OPcache silently disables itself until the server restarts",
          ],
          correctIndex: 0,
          explanation:
            "OPcache does not do LRU eviction — once the hash table or the shared memory is full it stops accepting new scripts, and `opcache_get_status()` reports it. Size `max_accelerated_files` and `memory_consumption` from your real file count.",
        },
        {
          id: "php-web-production-config-q6",
          prompt: "Should you enable OPcache's JIT for a typical Laravel or WordPress site?",
          options: [
            "No — it is disabled by default and rarely helps I/O-bound web workloads; measure before enabling it",
            "Yes — it is the single largest available speedup for web requests",
            "Yes — JIT replaces the opcode cache and removes compilation entirely",
            "No — JIT was removed in PHP 8.4",
          ],
          correctIndex: 0,
          explanation:
            "`opcache.jit` defaults to `disable`, and the wins concentrate in long, arithmetic-heavy code, not in request handling dominated by database and network time. It is still very much present in current PHP; it is just not the lever most sites need.",
        },
        {
          id: "php-web-production-config-q7",
          prompt: "Which of these does `set_error_handler()` NOT catch?",
          options: [
            "A fatal `E_ERROR`, such as exhausting `memory_limit`",
            "An `E_WARNING` from a failed `fopen()`",
            "An `E_NOTICE` from an undefined array key",
            "An `E_DEPRECATED` from a deprecated function call",
          ],
          correctIndex: 0,
          explanation:
            "Fatal errors bypass the error handler entirely, which is why the complete setup adds `register_shutdown_function()` with `error_get_last()` for fatals and `set_exception_handler()` for uncaught throwables.",
        },
        {
          id: "php-web-production-config-q8",
          prompt: "On PHP 8, what does `@` do that it did not do before?",
          options: [
            "It no longer silences fatal errors — a mistyped function call now fails visibly instead of dying silently",
            "It suppresses exceptions as well as diagnostics",
            "It stops calling a registered `set_error_handler()` callback",
            "It was removed from the language",
          ],
          correctIndex: 0,
          explanation:
            "Before 8.0 an `@` could hide a call to a non-existent function, producing a blank page with nothing in the log. A custom error handler is still invoked for suppressed diagnostics either way, so `@`-suppressed problems remain visible to a handler that checks `error_reporting()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-web-production-config-q9",
          prompt: "Where should PHP's error log go in a containerised deployment?",
          options: [
            "To `stderr`, so the container runtime collects it with everything else",
            "To a file inside the container, rotated by a cron job in the same container",
            "To the document root, so it can be fetched over HTTP when needed",
            "Nowhere — set `log_errors = Off` and rely on APM",
          ],
          correctIndex: 0,
          explanation:
            "Container logs belong on the standard streams; a file inside an ephemeral filesystem disappears with the container. Writing a log anywhere under the document root is a data breach waiting for someone to guess the filename.",
        },
        {
          id: "php-web-production-config-q10",
          prompt: "Which production settings are sensible? (Select all that apply.)",
          options: [
            "`expose_php = Off`",
            "`display_errors = Off`",
            "`session.cookie_secure = 1`",
            "`allow_url_include = On`",
            "`error_reporting = 0`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Remove the version banner, keep errors off the page, and pin session cookies to HTTPS. `allow_url_include` turns any include-path bug into remote code execution, and silencing `error_reporting` blinds the log rather than fixing anything.",
        },
        {
          id: "php-web-production-config-q11",
          prompt: "A long-running admin page calls `set_time_limit(0)`. What does that do under PHP-FPM?",
          options: [
            "It removes PHP's own limit, so only FPM's `request_terminate_timeout` can stop the request pinning a worker",
            "It sets the limit to the `php.ini` default of 30 seconds",
            "It has no effect; `max_execution_time` is not changeable at runtime",
            "It also removes `memory_limit`",
          ],
          correctIndex: 0,
          explanation:
            "Disabling the timer in a web request means one stuck page holds a worker indefinitely, and enough of them exhaust the pool. Long jobs belong on the CLI or in a queue, where an unlimited runtime is the normal expectation.",
        },
      ],
    },
  ],
} satisfies Module;
