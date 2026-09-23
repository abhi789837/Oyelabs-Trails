import type { Module } from "@/types/curriculum";

export default {
  id: "laravel-deploy",
  trackId: "php",
  name: "Deploying Laravel",
  description:
    "Getting a Laravel application into production and keeping it there: the server stack and the document root, the build step, the caches that make it fast and the one that makes it lie to you, migrations, workers, the scheduler, observability, atomic releases and rollback.",
  refs: [
    { label: "Laravel: Deployment", url: "https://laravel.com/framework/docs/13.x/deployment", kind: "docs" },
    { label: "Laravel: Configuration", url: "https://laravel.com/framework/docs/13.x/configuration", kind: "docs" },
    { label: "Laravel: Artisan Console", url: "https://laravel.com/framework/docs/13.x/artisan", kind: "docs" },
    { label: "The Twelve-Factor App: Config", url: "https://12factor.net/config", kind: "article" },
  ],
  topics: [
    {
      id: "lv-deploy-server-stack",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "The Production Server Stack and the Document Root",
      summary:
        "Laravel's security model rests on one assumption about your web server: the document root is `public/`, and nothing else. `.env`, `vendor/`, `storage/`, `config/` and `composer.json` all live one directory above the web root, so no URL can reach them. Move `index.php` up to the project root to make a cheap host work and you have published your database password. This is the single configuration line that matters most, and Laravel's own sample nginx config puts it first: `root /srv/example.com/public;`.\n\nEverything after that is plumbing. `try_files $uri $uri/ /index.php?$query_string` serves real files from disk and funnels everything else into the front controller. nginx hands PHP requests to PHP-FPM over FastCGI; Caddy's `php_fastcgi` directive expands to the same rules and adds automatic certificates; FrankenPHP collapses the two daemons into one Go process that embeds PHP, and is now in the official deployment docs. The choice is mostly about how much configuration you want to own — the request still ends at `public/index.php`.\n\nTwo details bite in production. Laravel's sample config sets `SCRIPT_FILENAME $realpath_root$fastcgi_script_name`, not `$document_root...`: `$realpath_root` resolves symlinks, so with atomic releases PHP and OPcache key files by the real release path rather than by the shared `current` symlink. And behind a TLS-terminating load balancer, `url()` will emit `http://` links and your rate limiter will see the balancer's IP for every visitor until you configure `trustProxies(at: [...])` in `bootstrap/app.php` — there has been no `app/Http/Middleware/TrustProxies.php` since Laravel 11.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Deployment — Server Configuration", url: "https://laravel.com/framework/docs/13.x/deployment#server-configuration", kind: "docs" },
        { label: "Laravel: Configuring Trusted Proxies", url: "https://laravel.com/framework/docs/13.x/requests#configuring-trusted-proxies", kind: "docs" },
        { label: "nginx: ngx_http_fastcgi_module", url: "https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html", kind: "docs" },
        { label: "Caddy: the php_fastcgi directive", url: "https://caddyserver.com/docs/caddyfile/directives/php_fastcgi", kind: "docs" },
      ],
      video: {
        title: "Deploy Laravel on Ubuntu Nginx server",
        channel: "Susan B.",
        url: "https://www.youtube.com/watch?v=c6ZsjOvGMGM",
        videoId: "c6ZsjOvGMGM",
        startSeconds: 922,
        chapterLabel: "Configure Nginx to load application",
        durationLabel: "18:57",
      },
      alternateVideos: [
        {
          title: "PHP-FPM vs FrankenPHP Classic Performance: What is faster?",
          channel: "Tideways",
          url: "https://www.youtube.com/watch?v=1yQubrkwzz4",
          videoId: "1yQubrkwzz4",
          durationLabel: "19:34",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-server-stack-q1",
          prompt:
            "A shared host only serves from `~/public_html`, so a developer copies the whole Laravel project there and adds a rewrite to `public/index.php`. What has this cost?",
          options: [
            "`/.env`, `/storage/logs/laravel.log` and `/composer.json` become fetchable over HTTP",
            "Nothing — the rewrite makes it equivalent to pointing the root at `public/`",
            "Blade templates stop compiling because the view path is now wrong",
            "Route caching stops working because the front controller moved",
          ],
          correctIndex: 0,
          explanation:
            "A rewrite only changes which script handles a URL that matched nothing on disk; files that do exist are still served directly. Everything Laravel deliberately keeps above the web root is now one request away.",
        },
        {
          id: "lv-deploy-server-stack-q2",
          prompt:
            "Laravel's sample nginx config uses `fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;` rather than `$document_root$fastcgi_script_name`. Why does that matter on a server that deploys by flipping a symlink?",
          options: [
            "`$realpath_root` resolves the symlink to the actual release directory, so PHP and OPcache key compiled files by the real path instead of the shared symlink path",
            "`$document_root` is not defined inside a `location` block that matches PHP files",
            "`$realpath_root` is required before nginx will negotiate HTTP/2 for PHP responses",
            "It lets nginx serve the PHP file from disk without involving FPM at all",
          ],
          correctIndex: 0,
          explanation:
            "With `$document_root` every release is compiled under the same path, so OPcache can serve the previous release's bytecode for the new code. `$realpath_root` gives each release its own cache keys.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-server-stack-q3",
          prompt: "What does `try_files $uri $uri/ /index.php?$query_string;` do?",
          options: [
            "Serves the file or directory if it exists on disk, otherwise hands the URI to Laravel's front controller with the query string preserved",
            "Issues a 302 redirect to `/index.php` for every request",
            "Tries three PHP-FPM pools in order until one responds",
            "Caches the response for `$uri` so later requests skip PHP",
          ],
          correctIndex: 0,
          explanation:
            "It is an internal fallback, not a redirect: the browser's URL never changes, which is what lets Laravel's router see the original path.",
        },
        {
          id: "lv-deploy-server-stack-q4",
          prompt:
            "Behind a TLS-terminating load balancer, `url()` emits `http://` links and the login rate limiter sees the balancer's IP for every visitor. Which statements are true? (Select all that apply.)",
          options: [
            "The fix is to configure `trustProxies(at: [...])` inside `->withMiddleware()` in `bootstrap/app.php`",
            "The balancer already sends `X-Forwarded-Proto` and `X-Forwarded-For`; Laravel ignores them until the proxy is trusted",
            "Trusting `*` is defensible only when nothing but the balancer can reach the application's port",
            "Setting `APP_URL=https://…` alone also fixes `$request->secure()` and `$request->ip()`",
            "This is configured by editing `app/Http/Middleware/TrustProxies.php`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Forwarded headers are trivially spoofable, so Laravel discards them until you name the proxies. `APP_URL` only affects generated URLs, not what the request object reports, and there has been no app-level `TrustProxies` file since Laravel 11.",
        },
        {
          id: "lv-deploy-server-stack-q5",
          prompt: "PHP-FPM can listen on a Unix socket or on `127.0.0.1:9000`. Which statement is accurate?",
          options: [
            "A Unix socket skips the TCP stack and is the usual choice when nginx and FPM share a host; TCP is what you use when FPM is on another host or in another container",
            "TCP is always faster because it is handled in the kernel while sockets go through the filesystem layer",
            "nginx cannot talk to a Unix socket; only Apache can",
            "Using a socket removes the need to `include fastcgi_params`",
          ],
          correctIndex: 0,
          explanation:
            "The transport is an implementation detail of where the two processes live. The FastCGI parameters are about what PHP is told, and are required either way.",
        },
        {
          id: "lv-deploy-server-stack-q6",
          prompt:
            "The Laravel deployment docs now show `frankenphp php-server -r public/` as an alternative to nginx plus PHP-FPM. What changes about the process model?",
          options: [
            "FrankenPHP is a Go web server with PHP embedded, so one process terminates TLS and executes PHP — there is no FastCGI hop between two daemons",
            "PHP source is transpiled to Go and compiled ahead of time",
            "It requires Laravel Octane before it can serve any request",
            "It replaces OPcache with a Go bytecode cache",
          ],
          correctIndex: 0,
          explanation:
            "FrankenPHP embeds the PHP interpreter in a Caddy-based server. Octane is an optional extra that keeps the framework booted between requests; classic mode works without it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-server-stack-q7",
          prompt: "What is the `location` block that denies dotfiles (while excepting `/.well-known`) for in Laravel's sample nginx config?",
          options: [
            "It refuses requests for dotfiles such as `/.env` or `/.git/config` while still allowing ACME challenges",
            "It denies any request whose path contains a dot, which is every request for a file with an extension",
            "It blocks regular-expression-based path traversal attempts",
            "It forces HTTPS for everything except the ACME challenge path",
          ],
          correctIndex: 0,
          explanation:
            "It is defence in depth: with the document root at `public/` there should be no sensitive dotfiles there anyway, but a stray `.env` copy or a checked-out `.git` directory is a common accident.",
        },
        {
          id: "lv-deploy-server-stack-q8",
          prompt: "What is the practical difference between serving Laravel with Caddy's `php_fastcgi` directive and an equivalent nginx server block?",
          options: [
            "Caddy obtains and renews certificates automatically and `php_fastcgi` expands to the try_files plus FastCGI rules for you; nginx needs certbot and the rules written out by hand",
            "Caddy speaks FastCGI natively while nginx needs a module compiled in",
            "Caddy runs PHP in-process, so PHP-FPM is not needed",
            "Caddy cannot serve static assets, so nginx is still required in front of it",
          ],
          correctIndex: 0,
          explanation:
            "`php_fastcgi` is a shorthand that expands into the same primitives. Automatic HTTPS is the real differentiator; FrankenPHP, not Caddy, is what removes the separate PHP process.",
        },
        {
          id: "lv-deploy-server-stack-q9",
          prompt:
            "A Laravel endpoint streams server-sent events. Through the reverse proxy the whole stream arrives in one burst when the connection closes, though it works when hitting the app port directly. What is the most likely cause?",
          options: [
            "The proxy is buffering the response; streaming endpoints need buffering disabled for that route (`fastcgi_buffering off` or `X-Accel-Buffering: no` in nginx, `flush_interval -1` in Caddy)",
            "PHP-FPM cannot produce streamed responses, so the proxy has to collect them",
            "PHP's `output_buffering` needs to be raised so the proxy receives complete chunks",
            "Browsers only render an SSE stream once the connection has ended",
          ],
          correctIndex: 0,
          explanation:
            "Proxies buffer by default because it is better for ordinary responses. For a long-lived stream it defeats the point, so buffering has to be turned off for that location specifically.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-server-stack-q10",
          prompt: "Laravel's sample nginx config includes `fastcgi_hide_header X-Powered-By;`. What is it doing, and what is the complementary PHP setting?",
          options: [
            "It stops nginx passing PHP's version banner on to the client; `expose_php = Off` stops PHP emitting it in the first place",
            "It hides the nginx version; the PHP equivalent is `server_tokens off`",
            "It suppresses all FastCGI response headers so Laravel's own headers win",
            "It is a prerequisite for HTTP/2 server push of PHP-generated assets",
          ],
          correctIndex: 0,
          explanation:
            "Advertising an exact PHP patch version hands an attacker a CVE shortlist. `server_tokens off` is the nginx-side setting for nginx's own banner.",
        },
      ],
    },
    {
      id: "lv-deploy-composer-production",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Composer in Production",
      summary:
        "The deploy-time command is `composer install --no-dev --optimize-autoloader --no-interaction`, and every word of it earns its place. `install` reads `composer.lock` and installs exactly the versions you tested; `update` re-resolves from `composer.json` and rewrites the lock, which is a decision to be made on a developer's machine and reviewed, never something a deploy script does on its own. If `composer.lock` is missing from the repository, `install` degrades into a resolve and your production tree quietly differs from staging.\n\n`--optimize-autoloader` converts the PSR-4 rules into a static classmap so class loading stops guessing at file paths; `--classmap-authoritative` goes further and treats anything absent from that map as non-existent, which is faster still and breaks the moment something writes a class file at runtime. `--no-dev` drops `require-dev`, which is right, but it turns any unconditional reference to a dev package — a debug service provider registered in `AppServiceProvider`, a dev-only facade aliased in config — into a fatal on the first request.\n\nPlatform parity is the quiet one. Composer resolves against the PHP version and extensions of the machine running it, so a build container on PHP 8.5 can select packages a PHP 8.3 production host cannot run. `config.platform.php` in `composer.json` pins what Composer resolves for; `--ignore-platform-reqs` does the opposite — it silences the check and moves the failure from build time to runtime, where it is far more expensive. Finally, Laravel hooks `post-autoload-dump` to run `package:discover`, which regenerates `bootstrap/cache/packages.php`, so a deploy that passes `--no-scripts` has to run that command itself.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Composer: Autoloader Optimization", url: "https://getcomposer.org/doc/articles/autoloader-optimization.md", kind: "docs" },
        { label: "Composer: Command-line interface", url: "https://getcomposer.org/doc/03-cli.md", kind: "docs" },
        { label: "Composer: The config schema (platform)", url: "https://getcomposer.org/doc/06-config.md", kind: "docs" },
        { label: "Laravel: Deployment — Server Requirements", url: "https://laravel.com/framework/docs/13.x/deployment#server-requirements", kind: "docs" },
      ],
      video: {
        title: "Deploy Laravel on Ubuntu Nginx server",
        channel: "Susan B.",
        url: "https://www.youtube.com/watch?v=c6ZsjOvGMGM",
        videoId: "c6ZsjOvGMGM",
        startSeconds: 555,
        chapterLabel: "Build vendor directory with Composer",
        durationLabel: "18:57",
      },
      alternateVideos: [
        {
          title: "10+ Mistakes When Deploying Laravel Project to Production",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=9gEsqgO05ZE",
          videoId: "9gEsqgO05ZE",
          startSeconds: 478,
          chapterLabel: "Software version consistency",
          durationLabel: "11:12",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-composer-production-q1",
          prompt: "Which command belongs in a production deploy script?",
          options: [
            "`composer install --no-dev --optimize-autoloader --no-interaction`",
            "`composer update --no-dev --optimize-autoloader`",
            "`composer require --update-no-dev`",
            "`composer install --dev --prefer-source`",
          ],
          correctIndex: 0,
          explanation:
            "`install` reproduces the locked versions; `update` re-resolves them, so a deploy running it can ship a package version nobody has ever tested. `--prefer-source` clones git repositories, which is slower and pointless on a server.",
        },
        {
          id: "lv-deploy-composer-production-q2",
          prompt:
            "`composer install` on the production server produced different package versions from the ones on the CI machine. What is the most likely cause?",
          options: [
            "`composer.lock` is not in the repository (or is git-ignored), so Composer resolved from `composer.json` instead",
            "`--no-dev` changes which versions of production packages get selected",
            "`--optimize-autoloader` upgrades packages to their latest patch releases",
            "Composer always re-resolves the first time it runs on a machine",
          ],
          correctIndex: 0,
          explanation:
            "With a lock file, `install` is deterministic. Without one it behaves like `update`, which is exactly the non-determinism the lock file exists to remove.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-composer-production-q3",
          prompt: "What does `--optimize-autoloader` actually do?",
          options: [
            "Converts the PSR-4 and PSR-0 rules into a static classmap, so resolving a class stops stat-ing candidate file paths",
            "Minifies the PHP files in `vendor/` to reduce disk usage",
            "Removes packages that no code in the project imports",
            "Turns on OPcache for the vendor directory",
          ],
          correctIndex: 0,
          explanation:
            "PSR-4 resolution is a filesystem guess per class. A classmap is one array lookup. It costs a slower `dump-autoload`, which is why it is a deploy flag rather than a default.",
        },
        {
          id: "lv-deploy-composer-production-q4",
          prompt: "Which statements about `--classmap-authoritative` are true? (Select all that apply.)",
          options: [
            "It implies `--optimize-autoloader`",
            "A class absent from the classmap is treated as non-existent and is never looked for on disk",
            "It breaks code that generates class files at runtime, such as some caching or proxy libraries",
            "It requires the APCu extension to be installed",
            "It roughly halves the size of the `vendor/` directory",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Authoritative means the map is the whole truth, which is why it is fast and why runtime class generation breaks. APCu is the separate `--apcu-autoloader` option, and neither changes how much code is installed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-composer-production-q5",
          prompt:
            "After adding `--no-dev` to the deploy, production throws `Class \"Laravel\\Telescope\\TelescopeServiceProvider\" not found`. What is wrong?",
          options: [
            "A dev-only package is being registered unconditionally, so registration must be guarded by the environment",
            "`--no-dev` also strips production packages whose only dependents were dev packages",
            "The autoloader needs `composer dump-autoload` run a second time after `install`",
            "`--no-dev` is incompatible with Laravel's package auto-discovery",
          ],
          correctIndex: 0,
          explanation:
            "Auto-discovery already skips packages listed under `dont-discover` or absent from `vendor/`; the failure comes from application code that names the class directly, so it belongs behind an `App::environment('local')` check.",
        },
        {
          id: "lv-deploy-composer-production-q6",
          prompt: "`--ignore-platform-reqs` makes a failing `composer install` succeed on the build machine. Why is that usually a mistake?",
          options: [
            "It only silences the check — the package still needs the PHP version or extension it declared, so the failure reappears at runtime",
            "It downgrades every package to a version compatible with the installed PHP",
            "It disables autoloader optimisation as a side effect",
            "It is only valid together with `--no-dev`",
          ],
          correctIndex: 0,
          explanation:
            "The flag is a promise you make to Composer that you know better. It is defensible when building a container whose runtime PHP differs deliberately; it is not a fix for a missing extension.",
        },
        {
          id: "lv-deploy-composer-production-q7",
          prompt: "Your build container runs PHP 8.5 but production runs PHP 8.3. How should Composer be told to resolve for production?",
          options: [
            "Set `config.platform.php` in `composer.json` to the production version so Composer resolves against it",
            "Pass `--ignore-platform-reqs` on the build machine",
            "Commit `vendor/` built on a machine running 8.3",
            "Nothing — `composer.lock` records the PHP version it was built with, and `install` re-resolves to match",
          ],
          correctIndex: 0,
          explanation:
            "`platform` makes Composer pretend it is on the target PHP when resolving, which is exactly the intent. `install` never re-resolves; it installs what the lock says and then checks the platform, which is when a mismatch surfaces.",
        },
        {
          id: "lv-deploy-composer-production-q8",
          prompt: "What does Laravel's `post-autoload-dump` Composer script do, and why does it matter to a deploy?",
          options: [
            "It runs `package:discover`, regenerating `bootstrap/cache/packages.php` and `services.php`, so a deploy that skips scripts must run it explicitly",
            "It runs the outstanding database migrations",
            "It precompiles the Blade templates",
            "It publishes every vendor config file into `config/`",
          ],
          correctIndex: 0,
          explanation:
            "Package discovery is what makes an installed package's providers and facades available without editing a file. A stale or missing manifest shows up as a missing facade, not as an obvious Composer error.",
        },
        {
          id: "lv-deploy-composer-production-q9",
          prompt: "Why is `composer.lock` the file that matters at deploy time, and `composer.json` the one that does not?",
          options: [
            "`install` installs exactly the versions recorded in the lock; `composer.json` only constrains what a future `update` may choose",
            "`composer.json` is not read by `install` at all",
            "The lock file embeds the package source, so `vendor/` can be rebuilt with no network access",
            "`install` regenerates the lock from `composer.json` on every run",
          ],
          correctIndex: 0,
          explanation:
            "`install` does still read `composer.json` — for autoload rules, scripts and platform config — but it takes versions from the lock. The lock records references, not code.",
        },
      ],
    },
    {
      id: "lv-deploy-optimize-caches",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "artisan optimize: the Config, Route, View and Event Caches",
      summary:
        "`php artisan optimize` is a wrapper around four commands — `config:cache`, `event:cache`, `route:cache` and `view:cache` — plus anything a package has registered through `ServiceProvider::$optimizeCommands`. Each one collapses work the framework would otherwise redo on every request into a single PHP file under `bootstrap/cache/` (`config.php`, `routes-v7.php`, `events.php`) or `storage/framework/views/`, where OPcache then keeps it compiled. On a large application this is the difference between a boot that scans dozens of config files and reflects over every listener, and one that includes one array.\n\nThe inverse is `optimize:clear`, and it does more than people expect: alongside `config:clear`, `event:clear`, `route:clear`, `view:clear` and `clear-compiled` it runs **`cache:clear`**, flushing your application cache. That takes the `queue:restart` flag, `withoutOverlapping()` locks and cache-driver maintenance mode with it. Reaching for `optimize:clear` to fix one stale view on a live server is how a routine deploy turns into an incident.\n\nOrder matters as much as the commands. Cache after the new code and `vendor/` are in place and the environment is set, and before traffic reaches the release — caching first bakes the old state in. Two failure modes are worth knowing by name. `config:cache` writes the cache with `var_export()`, so a closure or an object anywhere in a config file throws `LogicException: Your configuration files are not serializable`. And the old advice that closure routes break `route:cache` is out of date: current Laravel serialises them with `SerializableClosure`, and only a closure capturing something unserialisable will fail.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Deployment — Optimization", url: "https://laravel.com/framework/docs/13.x/deployment#optimization", kind: "docs" },
        { label: "Laravel: Artisan Console", url: "https://laravel.com/framework/docs/13.x/artisan", kind: "docs" },
        { label: "laravel/framework: OptimizeCommand.php", url: "https://github.com/laravel/framework/blob/13.x/src/Illuminate/Foundation/Console/OptimizeCommand.php", kind: "repo" },
        { label: "laravel/framework: OptimizeClearCommand.php", url: "https://github.com/laravel/framework/blob/13.x/src/Illuminate/Foundation/Console/OptimizeClearCommand.php", kind: "repo" },
      ],
      video: {
        title: "How to Boost Your Laravel App in Minutes",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=wT1lcJ_zn18",
        videoId: "wT1lcJ_zn18",
        durationLabel: "14:37",
      },
      alternateVideos: [
        {
          title: "Artisan Cache Commands",
          channel: "WebDevMatics",
          url: "https://www.youtube.com/watch?v=3bReOYxzhpE",
          videoId: "3bReOYxzhpE",
          startSeconds: 515,
          chapterLabel: "The optimize commands",
          durationLabel: "11:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-optimize-caches-q1",
          prompt: "What does `php artisan optimize` run?",
          options: [
            "`config:cache`, `event:cache`, `route:cache` and `view:cache`, plus any commands packages have registered with the framework",
            "`config:cache` and `route:cache` only",
            "`composer dump-autoload -o` followed by `config:cache`",
            "It clears every cache and then warms the application cache",
          ],
          correctIndex: 0,
          explanation:
            "It is a convenience wrapper over the four granular commands. Packages such as Filament or Livewire can append their own caching commands to the same list.",
        },
        {
          id: "lv-deploy-optimize-caches-q2",
          prompt: "Someone runs `php artisan optimize:clear` on production to clear one stale compiled view. What else did they just clear?",
          options: [
            "The application cache — `optimize:clear` runs `cache:clear` alongside the config, event, route, view and compiled-class caches",
            "Only the four caches that `optimize` created",
            "The OPcache bytecode cache as well as the framework caches",
            "Nothing else; `optimize:clear` is the exact inverse of `optimize`",
          ],
          correctIndex: 0,
          explanation:
            "Flushing the default cache store also discards the `queue:restart` timestamp, `withoutOverlapping()` and `onOneServer()` locks, and cache-driver maintenance mode. `view:clear` alone is the surgical option.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-optimize-caches-q3",
          prompt:
            "A config file contains a closure:\n\n```php\n// config/reporting.php\nreturn [\n    'formatter' => fn (string $v) => strtoupper($v),\n];\n```\n\nWhat happens when the deploy runs `config:cache`?",
          options: [
            "It throws a `LogicException` saying the configuration files are not serializable",
            "The closure is serialized with `SerializableClosure` and keeps working",
            "The key is silently dropped from the cached configuration",
            "Nothing at cache time; the error appears on the first request that reads the key",
          ],
          correctIndex: 0,
          explanation:
            "The cache is written as `<?php return ` plus `var_export()` of the whole config array, and `var_export()` cannot represent a closure. Laravel even walks the array to name the offending key.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-optimize-caches-q4",
          prompt: "Your routes file still registers a handful of closure routes. Does `route:cache` refuse to build the cache?",
          options: [
            "No — current Laravel serialises closure routes with `SerializableClosure`; only a closure capturing something unserialisable fails",
            "Yes, it throws `LogicException: Unable to prepare route … Uses Closure`",
            "Yes, but only when `APP_ENV=production`",
            "No, it silently omits the closure routes from the cache file",
          ],
          correctIndex: 0,
          explanation:
            "This is a fact that changed: older Laravel refused outright, and a great deal of deployment advice still says so. Controller actions are still preferable, but they are no longer a hard requirement for route caching.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-optimize-caches-q5",
          prompt: "Where in a deploy do the artisan caches belong?",
          options: [
            "After the new code, `vendor/` and the environment are in place, and before traffic is moved to the release",
            "First, so the rest of the deploy runs against a warm cache",
            "After traffic has moved, so the caches reflect real requests",
            "It does not matter; the commands are idempotent",
          ],
          correctIndex: 0,
          explanation:
            "The caches are a snapshot of code and configuration. Building them before the new code lands snapshots the old application, and building them after traffic arrives means the first users pay for the uncached boot.",
        },
        {
          id: "lv-deploy-optimize-caches-q6",
          prompt: "Where do the artisan caches live on disk?",
          options: [
            "`bootstrap/cache/` holds `config.php`, the routes file, `events.php`, `packages.php` and `services.php`; compiled Blade views go to `storage/framework/views`",
            "All of them are written under `storage/cache/`",
            "They are written to the default cache store, so database or Redis",
            "They are written into `vendor/composer/` next to the autoloader",
          ],
          correctIndex: 0,
          explanation:
            "They are plain PHP files, which is the point: OPcache caches them like any other source file, so reading them costs nothing after the first request.",
        },
        {
          id: "lv-deploy-optimize-caches-q7",
          prompt: "Which statements about the artisan caches in production are true? (Select all that apply.)",
          options: [
            "`bootstrap/cache/` must be writable at the moment the commands run",
            "Each cache is a single PHP file, so OPcache keeps it compiled between requests",
            "Their locations can be moved with `APP_CONFIG_CACHE`, `APP_ROUTES_CACHE` and friends, which matters on a read-only filesystem",
            "They are stored in the application cache store and therefore shared between servers",
            "`view:cache` is redundant because Blade compiles on first use at identical cost",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "They are per-release files on local disk, not shared state — every server (or container) builds its own. `view:cache` moves the compile cost off the first request rather than removing it.",
        },
        {
          id: "lv-deploy-optimize-caches-q8",
          prompt: "Given that Blade compiles a view the first time it renders, what does `view:cache` buy you?",
          options: [
            "It moves compilation off the request path, so the first visitor after a deploy does not pay for it",
            "It renders the views to static HTML that can be served without PHP",
            "It is required before `@include` and `@component` will resolve",
            "It compresses the compiled templates to save disk",
          ],
          correctIndex: 0,
          explanation:
            "It is a latency question, not a correctness one — and on a release directory that you would rather keep read-only at runtime, it also means nothing needs to write compiled views later.",
        },
        {
          id: "lv-deploy-optimize-caches-q9",
          prompt: "Why does `event:cache` exist?",
          options: [
            "Auto-discovered listeners are found by reflecting over listener classes, which is expensive to repeat on every boot",
            "It queues events so they can be replayed after a deploy",
            "It caches the payloads of dispatched events for debugging",
            "It is required before queued listeners will work at all",
          ],
          correctIndex: 0,
          explanation:
            "Event discovery trades boot cost for the convenience of not registering listeners by hand. Caching the resulting map gives you both.",
        },
        {
          id: "lv-deploy-optimize-caches-q10",
          prompt: "A package registers routes dynamically, so route caching breaks it. You still want the other caches. What is the direct way to express that?",
          options: [
            "`php artisan optimize --except=routes`",
            "`php artisan optimize --skip-routes`",
            "Set `OPTIMIZE_ROUTES=false` in `.env`",
            "There is no way to skip one; call each granular command yourself",
          ],
          correctIndex: 0,
          explanation:
            "`optimize` and `optimize:clear` both take `--except`, keyed by the task name or the command name. Calling the granular commands individually also works, so the last option is wrong only because it claims there is no alternative.",
        },
      ],
    },
    {
      id: "lv-deploy-env-config-cache",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Environment Variables and Why env() Returns Null in Production",
      summary:
        "Laravel reads `.env` exactly once, at boot, through the `LoadEnvironmentVariables` bootstrapper, which populates the process environment; `env()` reads from there. Config files call `env()` while they are being loaded, and the rest of the application reads `config()`. That indirection looks like ceremony until you deploy.\n\n`php artisan config:cache` writes every config file's evaluated result into one `bootstrap/cache/config.php`. From then on `LoadEnvironmentVariables` returns early — **the `.env` file is never parsed again**, on web requests or Artisan commands. `config()` keeps working, because the values were baked in when the cache was built. `env()` does not: called from a service class, a controller or a job, it falls through to its default, which is almost always `null`. Locally nothing is cached, so the same code works perfectly on your machine. This is the single most common way a Laravel deploy misbehaves without raising an error.\n\nThe precise statement is narrower than \"env() returns null\": `env()` still returns genuine process-level environment variables — a systemd `Environment=`, a Docker `-e`, an nginx `fastcgi_param` — because config caching only stops Laravel parsing the file. It is exactly the values that lived only in `.env` that vanish. The failure is at its worst when the value is a feature flag or a boolean: no exception, no log line, just the falsy branch taken in production forever. The fix is never `config:clear`; it is to put the value in a config file and read `config('services.stripe.secret')`.\n\nThe rest of the environment story follows from the same model. `APP_KEY` must be identical on every server and stable across releases or sessions and encrypted cookies become unreadable. `APP_ENV` selects `.env.[APP_ENV]` if that file exists. `env:encrypt` lets an encrypted `.env` live in version control with only `LARAVEL_ENV_ENCRYPTION_KEY` distributed. And `php artisan about` and `config:show` are how you ask a deployed instance what it actually believes.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Laravel: Configuration — Configuration Caching", url: "https://laravel.com/framework/docs/13.x/configuration#configuration-caching", kind: "docs" },
        { label: "Laravel: Configuration — Environment Configuration", url: "https://laravel.com/framework/docs/13.x/configuration#environment-configuration", kind: "docs" },
        { label: "laravel/framework: LoadEnvironmentVariables.php", url: "https://github.com/laravel/framework/blob/13.x/src/Illuminate/Foundation/Bootstrap/LoadEnvironmentVariables.php", kind: "repo" },
        { label: "The Twelve-Factor App: Config", url: "https://12factor.net/config", kind: "article" },
      ],
      video: {
        title: "Why You Should NOT Use env() in Laravel Controllers?",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=AWTUpT7krAs",
        videoId: "AWTUpT7krAs",
        durationLabel: "2:38",
      },
      alternateVideos: [
        {
          title: "10+ Mistakes When Deploying Laravel Project to Production",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=9gEsqgO05ZE",
          videoId: "9gEsqgO05ZE",
          startSeconds: 150,
          chapterLabel: "Configuring the .env file",
          durationLabel: "11:12",
        },
        {
          title: "Environments in Laravel: How APP_ENV Works",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=2ogZV0qdGNc",
          videoId: "2ogZV0qdGNc",
          durationLabel: "5:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-env-config-cache-q1",
          prompt:
            "`STRIPE_SECRET` is set in `.env` and nowhere else. The deploy runs `php artisan config:cache`. What does this return, called from a service class?\n\n```php\nclass PaymentGateway\n{\n    public function __construct(\n        private string $key = '',\n    ) {\n        $this->key = env('STRIPE_SECRET');\n    }\n}\n```",
          options: [
            "`null` — once the config is cached the `.env` file is not loaded, so `env()` sees only real process environment variables",
            "The value from `.env`; config caching has no effect on `env()`",
            "The value, but only for the request that built the cache",
            "It throws a `RuntimeException` about a missing environment variable",
          ],
          correctIndex: 0,
          explanation:
            "`LoadEnvironmentVariables` returns early when a config cache exists, so Dotenv never runs. `env()` then returns its default argument, and the default default is `null`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-env-config-cache-q2",
          prompt:
            "The same `env('STRIPE_SECRET')` call does work on one production host, where the variable is exported by systemd's `Environment=` directive rather than written in `.env`. Why?",
          options: [
            "`env()` reads the process environment; config caching only stops Laravel parsing the `.env` file, not variables the OS already provides",
            "systemd variables are copied into `bootstrap/cache/config.php` when the cache is built",
            "`config:cache` re-reads `.env` whenever `APP_ENV=production`",
            "Laravel falls back to `getenv()` only for console commands",
          ],
          correctIndex: 0,
          explanation:
            "This is why the bug is so slippery: it can work on one host and not another depending on how the variable was supplied. Relying on it is still wrong, because the behaviour now depends on deployment mechanics rather than on your code.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-env-config-cache-q3",
          prompt: "What is the correct fix for a class that calls `env('STRIPE_SECRET')`?",
          options: [
            "Add `'stripe' => ['secret' => env('STRIPE_SECRET')]` to `config/services.php` and read `config('services.stripe.secret')`",
            "Run `config:clear` at the end of every deploy so `.env` is always loaded",
            "Call `Dotenv::createImmutable(base_path())->load()` in the class constructor",
            "Move the value into `bootstrap/app.php`",
          ],
          correctIndex: 0,
          explanation:
            "Config files are the only place `env()` is meant to be called; everything else reads `config()`. Clearing the cache trades a correctness bug for a performance one and leaves the trap in place for the next person.",
        },
        {
          id: "lv-deploy-env-config-cache-q4",
          prompt:
            "A controller gates a feature with `if (env('FEATURE_NEW_CHECKOUT', false)) { … }`. Production has `FEATURE_NEW_CHECKOUT=true` in `.env`, and the deploy runs `php artisan optimize`. What happens?",
          options: [
            "The call returns `false`, the feature is silently off, and nothing is logged or thrown",
            "The controller throws, so the problem is obvious in the first minute",
            "The feature is on, because booleans are stored separately from strings in the config cache",
            "Laravel emits a deprecation warning for calling `env()` outside a config file",
          ],
          correctIndex: 0,
          explanation:
            "This is the worst shape of the bug: with a sensible-looking default there is no error at all, just behaviour nobody ordered. A missing API key at least fails loudly somewhere downstream.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-env-config-cache-q5",
          prompt: "After `config:cache` has run, which of these still behave normally? (Select all that apply.)",
          options: [
            "`config('app.timezone')` anywhere in the application",
            "The value `config('app.name')` returns, because the config files were evaluated when the cache was built",
            "`env('DB_HOST')` where `DB_HOST` is a real exported environment variable on the host",
            "`env('MAIL_PASSWORD')` called from a mailer class, where the value exists only in `.env`",
            "Editing `.env` on the server and seeing the new value on the next request",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Caching freezes the evaluated config and stops `.env` being read. Values already in the process environment are unaffected; values that only ever lived in the file are gone until the cache is rebuilt.",
        },
        {
          id: "lv-deploy-env-config-cache-q6",
          prompt: "`.env` contains `APP_DEBUG=false`. What does `env('APP_DEBUG')` return when `.env` is being read?",
          options: [
            "The boolean `false` — Dotenv values are strings, but Laravel maps the reserved words `true`, `false`, `null` and `empty` to real types",
            "The string `\"false\"`, which is truthy in a condition",
            "`null`, because `false` is not a valid `.env` value",
            "The integer `0`",
          ],
          correctIndex: 0,
          explanation:
            "Only those reserved words are converted. `APP_DEBUG=0` or `APP_DEBUG=off` would come back as the strings `\"0\"` and `\"off\"`, which is why Laravel's own config casts the result with `(bool)`.",
        },
        {
          id: "lv-deploy-env-config-cache-q7",
          prompt: "Why must `APP_KEY` be identical on every application server and stable across releases?",
          options: [
            "It keys the encrypter, so sessions, encrypted cookies and any `Crypt::` payload written under one key cannot be read under another",
            "It is the hash used to name the config cache file",
            "It signs `composer.lock` so Composer can verify the deploy",
            "It only affects password hashing, which is salted per user anyway",
          ],
          correctIndex: 0,
          explanation:
            "Regenerating it on a deploy logs everybody out at best, and makes previously encrypted database columns unreadable at worst. Password hashes use bcrypt or Argon2 and are unaffected.",
        },
        {
          id: "lv-deploy-env-config-cache-q8",
          prompt: "The documentation says not to run `config:cache` during local development. Why?",
          options: [
            "Config stops tracking `.env`, so every change needs a `config:clear` and people lose hours to edits that appear to do nothing",
            "It is not supported outside `APP_ENV=production`",
            "It would add `bootstrap/cache/config.php` to version control",
            "It disables the Vite development server",
          ],
          correctIndex: 0,
          explanation:
            "The cache is a deploy-time optimisation. A stale local config cache is the second most common way people meet this behaviour — usually after copying a deploy command into their own terminal.",
        },
        {
          id: "lv-deploy-env-config-cache-q9",
          prompt: "`APP_ENV=staging` is exported in the shell before `php artisan migrate` runs. Which environment file does Laravel load?",
          options: [
            "`.env.staging` if it exists, otherwise `.env`",
            "Always `.env`, regardless of `APP_ENV`",
            "`.env.staging` only, failing if that file is absent",
            "Both, with `.env` taking precedence over `.env.staging`",
          ],
          correctIndex: 0,
          explanation:
            "Laravel checks for an externally provided `APP_ENV` (or a `--env` argument) before loading anything, then falls back to the plain `.env`. The same mechanism is what makes `--env` work for one-off commands.",
        },
        {
          id: "lv-deploy-env-config-cache-q10",
          prompt: "Which command tells you what a deployed instance actually believes its configuration is, including whether the config is cached?",
          options: [
            "`php artisan about`, with `php artisan config:show <file>` to inspect one file's values",
            "`php artisan env`",
            "`php artisan config:cache --dry-run`",
            "`php artisan tinker --show-config`",
          ],
          correctIndex: 0,
          explanation:
            "`about` reports the environment, debug mode, the drivers in use and which caches are warm. `php artisan env` is a real command, but it only prints the environment name.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-env-config-cache-q11",
          prompt: "What problem do `env:encrypt` and `env:decrypt` solve?",
          options: [
            "They let an encrypted `.env.encrypted` live in version control, so only `LARAVEL_ENV_ENCRYPTION_KEY` has to be distributed out of band",
            "They encrypt the values at rest inside `bootstrap/cache/config.php`",
            "They rotate `APP_KEY` across a fleet of servers",
            "They stop `env()` returning null once the config is cached",
          ],
          correctIndex: 0,
          explanation:
            "It reduces secret distribution to one key instead of a whole file. The `--readable` option keeps variable names in the clear so a pull request still shows which variables were added or removed.",
        },
        {
          id: "lv-deploy-env-config-cache-q12",
          prompt: "`Config::integer('services.timeout')` throws where `config('services.timeout')` happily returned `\"30\"`. Why prefer the typed accessor?",
          options: [
            "`.env` values arrive as strings, so a value that should be an integer can silently be a string; the typed accessor fails loudly instead of leaking the wrong type into your code",
            "It is faster because it skips the dot-notation lookup",
            "It reads from `.env` directly rather than from the config cache",
            "It memoises the value for the remainder of the request",
          ],
          correctIndex: 0,
          explanation:
            "`Config::string()`, `integer()`, `float()`, `boolean()`, `array()` and `collection()` exist so static analysis and runtime agree. Casting in the config file (`(int) env(...)`) is the other half of the same discipline.",
        },
      ],
    },
    {
      id: "lv-deploy-storage-permissions",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Storage, the Public Disk and File Permissions",
      summary:
        "Exactly two directories in a Laravel project need to be writable by the process serving requests: `storage/` and `bootstrap/cache/`. Everything else can be read-only, and on a well-built deploy it is. The usual failure is ownership drift — an Artisan command run over SSH as `root` or as the deploy user creates `storage/logs/laravel.log`, and from then on PHP-FPM running as `www-data` cannot write to it, producing a 500 with an unhelpful `Permission denied`. The reflex fix, `chmod -R 777`, makes the problem go away and leaves an uploads directory that any local user can write executable files into.\n\nThe shape that works: files owned by the deploy user, group set to the web-server group, group-write on those two trees only, and the setgid bit so new files inherit the group instead of the creator's. Then run Artisan as the deploy user, not as root.\n\nThe public disk is the other half. `config/filesystems.php` defines `local` rooted at `storage/app/private` (it moved there in Laravel 11 — files under it are deliberately unreachable by URL) and `public` rooted at `storage/app/public`. `php artisan storage:link` creates `public/storage` as a symlink to the latter, which is how `Storage::url()` and `asset('storage/…')` resolve; `Storage::url()` on the local driver just prepends `/storage`, so a wrong `APP_URL` produces broken image links and nothing else. Two deploy consequences follow. The symlink points at an absolute path, so on atomic releases `storage/` has to be a shared directory outside the release tree and the link re-created (or itself shared) each time — otherwise every deploy silently orphans uploaded files and starts a new log. And the moment there is a second application server, a local public disk is wrong by construction: two servers, two sets of files. S3 or another object store is the real answer, and the `Storage` API makes it a config change.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: File Storage — The Public Disk", url: "https://laravel.com/framework/docs/13.x/filesystem#the-public-disk", kind: "docs" },
        { label: "Laravel: Deployment — Directory Permissions", url: "https://laravel.com/framework/docs/13.x/deployment#directory-permissions", kind: "docs" },
        { label: "Laravel: Directory Structure", url: "https://laravel.com/framework/docs/13.x/structure", kind: "docs" },
      ],
      video: {
        title: "Laravel permissions for storage and bootstrap/cache (Apache or Nginx)",
        channel: "Susan B.",
        url: "https://www.youtube.com/watch?v=HgKUtsO6qig",
        videoId: "HgKUtsO6qig",
        durationLabel: "3:52",
      },
      alternateVideos: [
        {
          title: "10+ Mistakes When Deploying Laravel Project to Production",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=9gEsqgO05ZE",
          videoId: "9gEsqgO05ZE",
          startSeconds: 271,
          chapterLabel: "Handling app URLs and paths",
          durationLabel: "11:12",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-storage-permissions-q1",
          prompt: "Which directories does the web server process need write access to in a deployed Laravel application?",
          options: [
            "`storage/` and `bootstrap/cache/`",
            "The whole project directory",
            "`public/` and `vendor/`",
            "`config/` and `database/`",
          ],
          correctIndex: 0,
          explanation:
            "Logs, sessions, compiled views and framework caches live under `storage/`; the config, route and event caches live in `bootstrap/cache/`. Everything else is code and should be read-only at runtime.",
        },
        {
          id: "lv-deploy-storage-permissions-q2",
          prompt: "Why is `chmod -R 777 storage` the wrong fix for a `Permission denied` on the log file?",
          options: [
            "It makes every stored file world-writable — including user uploads — so any local account or compromised process can replace them",
            "777 is not a valid mode for directories, only for files",
            "It has no effect because PHP re-applies its own umask",
            "It breaks `storage:link`, which requires mode 755",
          ],
          correctIndex: 0,
          explanation:
            "The real problem is ownership, not permission bits. Fix who owns the tree and which group can write to it; 777 papers over that and hands anyone on the box a write primitive into a directory your application reads back.",
        },
        {
          id: "lv-deploy-storage-permissions-q3",
          prompt:
            "A deploy uses timestamped release directories with a `current` symlink. Uploads disappear after every deploy and each release starts a fresh log file. What is wrong?",
          options: [
            "`storage/` is inside the release directory instead of being a shared directory symlinked into each release",
            "`storage:link` was not run, so uploads went to the wrong disk",
            "The `public` disk needs `visibility` set to `private` for persistence",
            "`APP_URL` is stale, so new uploads were written under the old host name",
          ],
          correctIndex: 0,
          explanation:
            "Anything stateful has to live outside the thing you replace on each deploy. In an atomic-release layout `storage/` and `.env` come from a shared directory and are symlinked in.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-storage-permissions-q4",
          prompt: "In a current Laravel skeleton, where does the `local` disk write, and what does that imply?",
          options: [
            "`storage/app/private`, which is not reachable by URL — files there must be served through a controller that checks authorisation",
            "`storage/app/public`, which is web-reachable once `storage:link` has run",
            "`public/uploads`, which is served directly by the web server",
            "The system temporary directory, so files do not survive a reboot",
          ],
          correctIndex: 0,
          explanation:
            "The default moved to `storage/app/private` in Laravel 11 to make the safe choice the default. The `public` disk is the opt-in for files that are genuinely public.",
        },
        {
          id: "lv-deploy-storage-permissions-q5",
          prompt: "Which statements about `php artisan storage:link` are true? (Select all that apply.)",
          options: [
            "It creates `public/storage` as a symbolic link to `storage/app/public`",
            "Additional links can be declared in the `links` array of `config/filesystems.php` and are all created by the same command",
            "It has to be re-run (or the link shared) for each new release directory on an atomic deploy",
            "It copies the files into `public/` so no symlink support is needed",
            "It is required before the `s3` disk will generate URLs",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "It is a symlink, not a copy — which is why hosts that forbid symlinks are a problem. S3 URLs are generated from the bucket configuration and involve no local link at all.",
        },
        {
          id: "lv-deploy-storage-permissions-q6",
          prompt:
            "A developer SSHes in as `root` and runs `php artisan cache:clear` to debug something. The next request returns a 500 with `Permission denied` on a file under `storage/framework`. What happened?",
          options: [
            "Artisan recreated files owned by `root`, which the PHP-FPM user cannot write to",
            "`cache:clear` deletes the `storage/framework` directory itself and does not recreate it",
            "The root shell had a different `APP_ENV`, so a second set of caches was written",
            "`cache:clear` sets the files to mode 0400 by design",
          ],
          correctIndex: 0,
          explanation:
            "Running Artisan as a different user than the one serving requests is the most common source of permission drift on a hand-managed server. Run maintenance commands as the deploy user, and use `setgid` so new files keep the right group.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-storage-permissions-q7",
          prompt: "`Storage::disk('public')->url('avatars/1.jpg')` returns a URL on `http://localhost` in production. What is the cause?",
          options: [
            "`APP_URL` is still the default — the public disk's `url` is derived from it, and the local driver simply prepends `/storage`",
            "`storage:link` created the link with a relative path",
            "The disk's `visibility` is `private`, so a signed localhost URL is returned",
            "`ASSET_URL` overrides `APP_URL` and defaults to localhost",
          ],
          correctIndex: 0,
          explanation:
            "The local driver has no idea what host it is on; it uses whatever `config('filesystems.disks.public.url')` says, which in the skeleton is built from `APP_URL`. This is also why `APP_URL` matters for queued mail and signed URLs.",
        },
        {
          id: "lv-deploy-storage-permissions-q8",
          prompt: "Your application is scaled to two web servers behind a load balancer and still uses the local `public` disk for user uploads. What is the symptom?",
          options: [
            "An upload handled by one server 404s about half the time, because the other server does not have the file",
            "Uploads fail with a permission error on the second server",
            "Both servers write to the same file and corrupt it",
            "Nothing, because the load balancer replicates the filesystem",
          ],
          correctIndex: 0,
          explanation:
            "Local disks are per-server state. A shared network filesystem is one answer; object storage is the better one, and swapping `FILESYSTEM_DISK` to `s3` is the whole change in application code.",
        },
        {
          id: "lv-deploy-storage-permissions-q9",
          prompt: "What does setting the setgid bit on `storage/` achieve for a server where the deploy user and the PHP-FPM user differ?",
          options: [
            "New files and directories inherit the directory's group rather than the creating user's, so both users keep group access",
            "It makes new files executable by the group",
            "It forces new files to be owned by root",
            "It stops the PHP process changing file ownership",
          ],
          correctIndex: 0,
          explanation:
            "Combined with a group-writable mode it keeps the invariant true over time, instead of only at the moment somebody last ran `chown -R`.",
        },
      ],
    },
    {
      id: "lv-deploy-migrations",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Running Migrations on Deploy",
      summary:
        "`php artisan migrate --force` is the command — `--force` because destructive operations prompt for confirmation and a deploy pipeline has no terminal to answer with. `--isolated` takes an atomic lock through the cache before migrating, so when three application servers run the same deploy script only one of them actually migrates and the others exit successfully. `--pretend` prints the SQL without executing it, which is the cheapest possible review of a migration somebody wrote three weeks ago.\n\nThe command is the easy part. The hard part is that a migration and a code deploy are two separate events, so for some window old code runs against the new schema or new code runs against the old one. That is why the expand/contract discipline exists: add a nullable column, deploy code that writes both old and new, backfill, deploy code that reads the new one, and only in a later release drop the old. Renaming a column in the same release that stops using it guarantees errors for every request in flight and makes rollback impossible.\n\nLocking is the other thing that turns a 200 ms migration into an outage. On MySQL an `ALTER TABLE` can rebuild a large table and block writes for the duration. Laravel 13 exposes the underlying knobs directly: `->instant()` for MySQL's INSTANT algorithm (append-only, so it cannot be combined with `after()` or `first()`), `->inplace()` for INPLACE, `->lock('none'|'shared'|'exclusive')` for the LOCK clause, and `->online()` on an index for PostgreSQL's `CREATE INDEX CONCURRENTLY` or SQL Server's online build. MySQL raises an error if the algorithm you asked for cannot do the job, which is the behaviour you want — a loud failure in a maintenance window beats a silent table rebuild at peak.\n\nTwo traps worth internalising. `change()` writes the column's whole new definition, so any modifier you do not restate — `unsigned`, `default`, `comment`, `nullable` — is dropped. And `migrate:rollback` is not a production undo button: `down()` methods are rarely exercised, and a `down()` that drops a column deletes the data in it. In production you roll forward.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Migrations — Running Migrations", url: "https://laravel.com/framework/docs/13.x/migrations#running-migrations", kind: "docs" },
        { label: "Laravel: Migrations — DDL Locking", url: "https://laravel.com/framework/docs/13.x/migrations#ddl-locking", kind: "docs" },
        { label: "Martin Fowler: ParallelChange (expand/contract)", url: "https://martinfowler.com/bliki/ParallelChange.html", kind: "article" },
        { label: "MySQL: Online DDL Operations", url: "https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html", kind: "docs" },
      ],
      video: {
        title: "Every engineer should know this.. (Expand-Contract Pattern)",
        channel: "Software Developer Diaries",
        url: "https://www.youtube.com/watch?v=ONSCQWLD9d0",
        videoId: "ONSCQWLD9d0",
        durationLabel: "6:35",
      },
      alternateVideos: [
        {
          title: "How do software projects achieve zero downtime database migrations?",
          channel: "Web Dev Cody",
          url: "https://www.youtube.com/watch?v=cw5K2O4AHJc",
          videoId: "cw5K2O4AHJc",
          durationLabel: "7:05",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-migrations-q1",
          prompt: "Why does a deploy pipeline need `php artisan migrate --force` rather than plain `migrate`?",
          options: [
            "Potentially destructive migrations prompt for confirmation in production, and a non-interactive pipeline cannot answer the prompt",
            "`--force` is what enables the `migrations` table to be written",
            "Without it, migrations run inside a transaction that is rolled back at the end",
            "`--force` is required whenever `APP_DEBUG=false`",
          ],
          correctIndex: 0,
          explanation:
            "The prompt is a guard against someone running a destructive command against production by accident. In CI there is no tty, so the command would abort.",
        },
        {
          id: "lv-deploy-migrations-q2",
          prompt: "Three application servers each run the deploy script, which includes `php artisan migrate --force`. What does adding `--isolated` change?",
          options: [
            "Laravel takes an atomic lock through the cache, so only the first server migrates; the others exit with a success status without running anything",
            "Each migration runs in its own database transaction",
            "Migrations run against a replica first and are then replayed on the primary",
            "It serialises the three servers so each runs the migrations in turn",
          ],
          correctIndex: 0,
          explanation:
            "It needs a cache driver every server shares — `redis`, `memcached`, `database` or `dynamodb`. With a per-server `file` cache all three would take their own lock and all three would migrate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-migrations-q3",
          prompt:
            "A release renames `users.name` to `users.full_name` and updates every reference in the same deploy. Requests fail for about thirty seconds. Why?",
          options: [
            "The migration and the code switch are not simultaneous, so for a window the running code and the live schema disagree",
            "Renaming a column always requires a full table lock",
            "Eloquent caches the column list, and the cache has to be cleared",
            "`renameColumn` drops and recreates the column, losing its data",
          ],
          correctIndex: 0,
          explanation:
            "Whichever order you choose, one side is briefly wrong: old code hits a missing `name`, or new code hits a missing `full_name`. Expand/contract removes the window by making both names valid for a release.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-migrations-q4",
          prompt: "Put the expand/contract steps for renaming a column into the right order.",
          options: [
            "Add the new nullable column → deploy code that writes both → backfill → deploy code that reads the new column → drop the old column in a later release",
            "Drop the old column → add the new column → backfill → deploy the new code",
            "Deploy the new code → add the new column → backfill → drop the old column",
            "Add the new column and backfill inside one migration → deploy code that reads and writes only the new column → drop the old column in the same release",
          ],
          correctIndex: 0,
          explanation:
            "Every step has to leave both the previous and the next release able to run. The last option looks tidy but the drop lands while the previous release may still be serving requests, and it makes rollback impossible.",
        },
        {
          id: "lv-deploy-migrations-q5",
          prompt:
            "What is wrong with this migration?\n\n```php\nSchema::table('users', function (Blueprint $table) {\n    $table->integer('votes')->change();\n});\n```\n\nThe column was previously `unsignedInteger` with a default of `1` and a comment.",
          options: [
            "`change()` writes the column's complete new definition, so `unsigned`, the default and the comment are all dropped",
            "`change()` cannot alter an integer column without the doctrine/dbal package",
            "`change()` silently does nothing when only the signedness differs",
            "`change()` requires the column to be nullable first",
          ],
          correctIndex: 0,
          explanation:
            "Every modifier you want to keep has to be restated on the changed definition. It is one of the most common ways a migration quietly loses a constraint, and `--pretend` shows it immediately.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-migrations-q6",
          prompt: "Which are true about Laravel 13's MySQL `->instant()` column modifier? (Select all that apply.)",
          options: [
            "It asks MySQL to use the INSTANT algorithm, avoiding a full table rebuild",
            "It cannot be combined with `after()` or `first()`, because instant additions can only append to the end of the table",
            "MySQL raises an error if the requested operation is not compatible with the algorithm",
            "It works on PostgreSQL as well, where it maps to `ADD COLUMN … CONCURRENTLY`",
            "It makes the migration run inside a transaction so it can be rolled back instantly",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "It is a MySQL-specific hint. PostgreSQL's equivalent concern is index creation, which is what `->online()` addresses by emitting `CREATE INDEX CONCURRENTLY`.",
        },
        {
          id: "lv-deploy-migrations-q7",
          prompt: "You need to add a unique index to a ten-million-row PostgreSQL table without blocking writes. What does Laravel give you?",
          options: [
            "`$table->string('email')->unique()->online();`, which emits `CREATE INDEX CONCURRENTLY`",
            "`$table->string('email')->unique()->instant();`",
            "`$table->string('email')->unique()->lock('exclusive');`",
            "Nothing — the index has to be created by hand outside a migration",
          ],
          correctIndex: 0,
          explanation:
            "`online()` maps to `CONCURRENTLY` on PostgreSQL and `WITH (online = on)` on SQL Server. `instant()` and `lock()` are the MySQL-side modifiers.",
        },
        {
          id: "lv-deploy-migrations-q8",
          prompt: "Why is `php artisan migrate:rollback` a poor production recovery plan?",
          options: [
            "`down()` methods are rarely exercised and often destructive, so rolling back can delete the data the failed release wrote",
            "It only rolls back one migration file regardless of the batch",
            "It requires `--force`, which is disabled in production",
            "It rewrites the `migrations` table in a way that breaks the next `migrate`",
          ],
          correctIndex: 0,
          explanation:
            "Rolling back code is cheap because code is disposable; rolling back schema is not, because data is not. Ship a forward migration that corrects the problem instead.",
        },
        {
          id: "lv-deploy-migrations-q9",
          prompt: "What is `php artisan migrate --pretend` for?",
          options: [
            "It prints the SQL the migrations would execute without running them, which makes an unfamiliar migration reviewable before a production run",
            "It runs the migrations inside a transaction and rolls back at the end",
            "It runs the migrations against the `testing` connection",
            "It marks the migrations as run without executing them",
          ],
          correctIndex: 0,
          explanation:
            "It answers 'what is this actually going to do to my table' without a staging restore. Marking migrations as run without executing them is a manual `migrations` table edit, not a flag.",
        },
        {
          id: "lv-deploy-migrations-q10",
          prompt: "A migration adds a table for a feature that is still behind a flag and must not be created yet. What does Laravel offer?",
          options: [
            "A `shouldRun()` method on the migration; returning `false` skips it, and it can consult a feature flag",
            "A `--skip` option naming the migration file",
            "Prefixing the filename with an underscore so the migrator ignores it",
            "Wrapping the `up()` body in `if (app()->isProduction())`",
          ],
          correctIndex: 0,
          explanation:
            "`shouldRun()` keeps the decision in the migration and keeps the file in its normal batch ordering. Wrapping the body in a condition would mark the migration as run, so it would never execute later.",
        },
        {
          id: "lv-deploy-migrations-q11",
          prompt: "When should migrations run relative to the code switch, on an atomic-release deploy?",
          options: [
            "Inside the new release directory, after `composer install` and the caches, but before the `current` symlink is flipped — so long as the migration is compatible with the release still serving traffic",
            "After the symlink flip, so the new code is definitely live before the schema changes",
            "Before the release directory is built, from the previous release's code",
            "It does not matter as long as `--force` is used",
          ],
          correctIndex: 0,
          explanation:
            "Migrating before the flip means the new code never meets an old schema. It only works because expand/contract guarantees the *old* code can survive the new schema for the few seconds before the flip.",
        },
      ],
    },
    {
      id: "lv-deploy-queue-workers",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Queue Workers Across a Deploy",
      summary:
        "`queue:work` boots the framework once and then loops, which is exactly what makes it fast and exactly what makes it a deployment problem. A worker started before your deploy keeps running the old job classes, the old config and the old container bindings until something stops it. Nothing about copying new files into place tells it to notice.\n\n`php artisan queue:restart` is that something, and it is worth knowing what it really does: it writes a timestamp into the **cache**, and every worker checks the cache on each iteration and exits gracefully once its current job finishes. Two consequences fall out. A process monitor has to bring the workers back — `queue:restart` only ends them — and if the cache store is not shared and persistent, the signal never arrives. An `array` store, or a per-container `file` store, means `queue:restart` reports success and changes nothing. So does `Queue::withoutInterruptionPolling()`, which disables the per-iteration cache check for performance. Laravel 13 bundles the fleet-wide version as `php artisan reload`, which runs `queue:restart` and `schedule:interrupt` together, plus whatever Octane or Reverb register.\n\nSupervisor is the usual monitor, and its defaults are wrong for long jobs. `stopwaitsecs` must exceed your longest job or Supervisor will SIGKILL a worker mid-flight; `stopasgroup` and `killasgroup` make sure a job's child processes go too; `numprocs` sets concurrency; `--max-time` or `--max-jobs` recycle workers so a slow leak never becomes an OOM. Separately, `--timeout` (60 s by default) must stay comfortably *below* the connection's `retry_after` (90 s in the skeleton), or a job that is still running gets released back onto the queue and processed twice.\n\nTwo more deploy-specific hazards. Maintenance mode stops queue processing entirely unless the worker was started with `--force`, so `php artisan down` during a long deploy quietly pauses your background work. And a job serialised by the old release may be deserialised by the new one — change a job's constructor signature and deploy in one step and the jobs already on the queue will fail on unserialize.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Queues — Queue Workers and Deployment", url: "https://laravel.com/framework/docs/13.x/queues#queue-workers-and-deployment", kind: "docs" },
        { label: "Laravel: Queues — Supervisor Configuration", url: "https://laravel.com/framework/docs/13.x/queues#supervisor-configuration", kind: "docs" },
        { label: "Supervisor: Configuration File", url: "https://supervisord.org/configuration.html", kind: "docs" },
        { label: "Laravel: Horizon — Deploying Horizon", url: "https://laravel.com/framework/docs/13.x/horizon#deploying-horizon", kind: "docs" },
      ],
      video: {
        title: "How to Set up Laravel Queues on Production",
        channel: "CodingX",
        url: "https://www.youtube.com/watch?v=iH4Skwaw-KU",
        videoId: "iH4Skwaw-KU",
        durationLabel: "11:56",
      },
      alternateVideos: [
        {
          title: "Laravel Horizon: queue monitoring + configuration",
          channel: "Aaron Francis",
          url: "https://www.youtube.com/watch?v=r3c_qBvAHXA",
          videoId: "r3c_qBvAHXA",
          startSeconds: 360,
          chapterLabel: "Setting Up Workers and Supervisors",
          durationLabel: "14:53",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-queue-workers-q1",
          prompt: "A deploy copies new code into place but nothing restarts the workers. What do the running `queue:work` processes execute?",
          options: [
            "The old code — they booted the framework once and hold the old classes, config and bindings in memory",
            "The new code, because PHP re-reads each file when a job is handled",
            "A mix: new job classes but old configuration",
            "Nothing; they detect the changed files and exit automatically",
          ],
          correctIndex: 0,
          explanation:
            "That is the whole trade of a long-lived worker. `queue:listen` reboots per job and does pick up changes, at a large cost per job, which is why it is a development tool.",
        },
        {
          id: "lv-deploy-queue-workers-q2",
          prompt: "What does `php artisan queue:restart` actually do?",
          options: [
            "Writes a restart timestamp into the cache; workers poll it each iteration and exit gracefully after finishing the current job",
            "Sends SIGKILL to every `queue:work` process it can find",
            "Restarts the Supervisor service, which restarts the workers",
            "Reloads the worker's autoloader in place without exiting",
          ],
          correctIndex: 0,
          explanation:
            "It is cooperative, which is why no job is lost. It also means something else has to start the workers again — the command does not, and is not supposed to.",
        },
        {
          id: "lv-deploy-queue-workers-q3",
          prompt:
            "A deploy runs `queue:restart` and reports success, but the workers keep running old code. `CACHE_STORE` is `array`. What went wrong?",
          options: [
            "The restart flag is stored in the cache, and an `array` store lives only for the life of one process, so the workers never see it",
            "`queue:restart` requires the `redis` queue driver",
            "The command must be run as the same user as the workers or the signal is dropped",
            "`array` is fine; the workers need `--tries` set for the signal to be honoured",
          ],
          correctIndex: 0,
          explanation:
            "Any cache store that is not shared between the Artisan process and the workers breaks this — `array` always, and `file` as soon as they are in different containers. A shared Redis or database store fixes it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-queue-workers-q4",
          prompt:
            "Someone added `Queue::withoutInterruptionPolling()` to `AppServiceProvider::boot()` after reading that it saves a cache read per job. What does it break?",
          options: [
            "`queue:restart` and `queue:pause` stop reaching the workers, because the per-iteration cache poll is what delivers those signals",
            "Failed jobs are no longer recorded",
            "Job timeouts stop being enforced",
            "Nothing — it is purely a performance optimisation",
          ],
          correctIndex: 0,
          explanation:
            "It is a real optimisation with a real cost. Disabling it means deploys need another way to cycle the workers, such as replacing the containers outright.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-queue-workers-q5",
          prompt:
            "The Supervisor program for the workers has `stopwaitsecs=10`, and some jobs take three minutes. What happens on `supervisorctl stop`?",
          options: [
            "Supervisor SIGKILLs the worker ten seconds in, killing the in-flight job, which is only retried once `retry_after` elapses",
            "Supervisor waits for the job because the worker refuses to exit",
            "The job is released back onto the queue immediately and retried",
            "Nothing: `stopwaitsecs` only applies at boot",
          ],
          correctIndex: 0,
          explanation:
            "Laravel's docs use `stopwaitsecs=3600` for exactly this reason. Set it above your worst-case job duration, and keep jobs short enough that the number is defensible.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-queue-workers-q6",
          prompt: "Which Supervisor settings matter for Laravel workers, and why? (Select all that apply.)",
          options: [
            "`autorestart=true`, so a worker that exits after `queue:restart` or `--max-time` comes straight back",
            "`numprocs`, which sets how many worker processes run concurrently",
            "`stopasgroup` and `killasgroup`, so a stop signal reaches processes the job spawned",
            "`user`, which must be `root` so the worker can write to `storage/`",
            "`startsecs=0`, which is required for `--stop-when-empty` to work",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`user` should be the same unprivileged account that serves requests, not root — running workers as root is how `storage/` ends up with files the web user cannot write.",
        },
        {
          id: "lv-deploy-queue-workers-q7",
          prompt:
            "A connection has `retry_after` of 90 seconds. Somebody sets `queue:work --timeout=120` because jobs were being killed. What is the new failure mode?",
          options: [
            "A job still running at 90 seconds is released back onto the queue and picked up by another worker, so it runs twice",
            "The worker refuses to start because the values are inconsistent",
            "Jobs are silently marked failed at 90 seconds",
            "Nothing changes; `--timeout` overrides `retry_after`",
          ],
          correctIndex: 0,
          explanation:
            "`--timeout` must stay below `retry_after` so a frozen worker is always killed before the queue decides the job was abandoned. Raising `retry_after` alongside the timeout is the correct fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-queue-workers-q8",
          prompt: "What is the effect of `php artisan down` on queue processing?",
          options: [
            "Queued jobs are not handled while the application is in maintenance mode, unless the worker was started with `--force`",
            "Jobs are processed as normal; maintenance mode only affects HTTP requests",
            "Jobs are deleted and must be re-dispatched after `php artisan up`",
            "Workers exit immediately and Supervisor restarts them in a loop",
          ],
          correctIndex: 0,
          explanation:
            "That is usually what you want during a deploy, but it is worth knowing: a long maintenance window silently stops all background work, and the backlog is waiting for you when you come back up.",
        },
        {
          id: "lv-deploy-queue-workers-q9",
          prompt: "What does Laravel 13's `php artisan reload` do that `queue:restart` alone does not?",
          options: [
            "It runs `queue:restart` and `schedule:interrupt` together, plus any reload commands packages such as Octane or Reverb have registered",
            "It restarts PHP-FPM as well as the workers",
            "It rebuilds the artisan caches and then restarts the workers",
            "It replaces `queue:restart`, which was removed",
          ],
          correctIndex: 0,
          explanation:
            "It is the single 'cycle every long-lived service' command for a deploy script. `queue:restart` is still there and is still what `reload` calls.",
        },
        {
          id: "lv-deploy-queue-workers-q10",
          prompt:
            "A release changes a job's constructor from `__construct(User $user)` to `__construct(int $userId, string $reason)`. What happens to jobs already sitting on the queue?",
          options: [
            "They were serialised against the old signature, so unserializing and handling them under the new code fails",
            "Laravel migrates the payloads automatically when the job class changes",
            "They are silently discarded on the first attempt",
            "Nothing — the payload only stores the class name and the handle method is called with no arguments",
          ],
          correctIndex: 0,
          explanation:
            "The queue payload is a serialised object. Changing a job's shape is a two-release operation for the same reason a column rename is: drain the old jobs, or keep the old constructor working for one release.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-queue-workers-q11",
          prompt: "When Horizon manages the workers, what belongs in the deploy script?",
          options: [
            "`php artisan horizon:terminate`, with a process monitor configured to restart the `horizon` process",
            "`php artisan horizon:restart`, which stops and starts the master process itself",
            "`supervisorctl restart horizon`, because Horizon ignores Artisan signals",
            "Nothing — Horizon watches the filesystem and reloads workers automatically",
          ],
          correctIndex: 0,
          explanation:
            "Same pattern as `queue:restart`: Horizon's master process terminates gracefully and the monitor brings it back with the new code and the new `config/horizon.php`.",
        },
      ],
    },
    {
      id: "lv-deploy-scheduler-cron",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "The Scheduler as a Single Cron Entry",
      summary:
        "Laravel's scheduler exists so that the list of recurring jobs lives in version control instead of in whatever somebody typed into `crontab -e` two years ago. The server gets exactly one entry — `* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1` — and `schedule:run` decides each minute which tasks are due. The schedule itself is defined in `routes/console.php`; there has been no `app/Console/Kernel.php` since Laravel 11, so any guide showing one predates the current structure.\n\nWhat makes this a deployment topic is that the cron entry points at a path. With atomic releases it must point at the `current` symlink, never at a release directory, or the scheduler keeps running a version you deleted three deploys ago. And several scheduler features are built on the cache: `withoutOverlapping()` and `onOneServer()` both take locks there, so a cache flush during a deploy — `optimize:clear` runs `cache:clear`, remember — can release a lock mid-task and let a second copy start. `schedule:clear-cache` exists for locks left behind by a crashed task, and `onOneServer()` needs a cache store every server shares.\n\nThe rest is operational hygiene. Tasks do not run in maintenance mode unless marked `evenInMaintenanceMode()`. `schedule:pause` and `schedule:continue` quiesce the scheduler around a risky change without editing code, with `evenWhenPaused()` as the escape hatch; `schedule:interrupt` is what `php artisan reload` calls to stop an in-flight `schedule:run`. Tasks scheduled at the same minute run sequentially in definition order unless you add `runInBackground()`, so one slow report can delay everything behind it. Sub-minute tasks keep `schedule:run` alive until the end of the minute rather than exiting immediately.\n\nAnd the gotcha hiding in the documented cron line: `>> /dev/null 2>&1` exists so cron does not email you every minute, but it also throws away every error your tasks produce. Use `onFailure()`, `emailOutputOnFailure()` or a heartbeat monitor, or you will find out a nightly job has been failing for six weeks when somebody asks for the report.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Laravel: Task Scheduling — Running the Scheduler", url: "https://laravel.com/framework/docs/13.x/scheduling#running-the-scheduler", kind: "docs" },
        { label: "Laravel: Task Scheduling — Running Tasks on One Server", url: "https://laravel.com/framework/docs/13.x/scheduling#running-tasks-on-one-server", kind: "docs" },
        { label: "Laravel: Task Scheduling — Preventing Task Overlaps", url: "https://laravel.com/framework/docs/13.x/scheduling#preventing-task-overlaps", kind: "docs" },
        { label: "man7: crontab(5)", url: "https://man7.org/linux/man-pages/man5/crontab.5.html", kind: "spec" },
      ],
      video: {
        title: "Laravel 11 Task Scheduling Simplified: New Approach Without Kernel.php",
        channel: "Laravel boy",
        url: "https://www.youtube.com/watch?v=LM4OzsUAevY",
        videoId: "LM4OzsUAevY",
        durationLabel: "4:56",
      },
      alternateVideos: [
        {
          title: "Laravel Scheduler: 5 \"Tricks\" You May Not Know",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=KBAIWP8wfyQ",
          videoId: "KBAIWP8wfyQ",
          durationLabel: "3:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-scheduler-cron-q1",
          prompt: "How many crontab entries does a Laravel application with forty scheduled tasks need?",
          options: [
            "One, running `schedule:run` every minute; the forty tasks are defined in `routes/console.php`",
            "One per task, so the server's crontab mirrors the schedule",
            "One per task group, defined with `Schedule::group()`",
            "None — Laravel installs a systemd timer during `composer install`",
          ],
          correctIndex: 0,
          explanation:
            "`schedule:run` is the dispatcher: it evaluates the whole schedule against the current time each minute. That is the entire point of moving the schedule into the codebase.",
        },
        {
          id: "lv-deploy-scheduler-cron-q2",
          prompt: "Where are scheduled tasks defined in a current Laravel application?",
          options: [
            "`routes/console.php`, using the `Schedule` facade",
            "The `schedule()` method of `app/Console/Kernel.php`",
            "`config/scheduling.php`",
            "`bootstrap/app.php`, inside `->withSchedule()`",
          ],
          correctIndex: 0,
          explanation:
            "`app/Console/Kernel.php` was removed in Laravel 11 along with the HTTP kernel. `bootstrap/app.php` is where middleware, routing and exception handling are configured, but the schedule lives with the console routes.",
        },
        {
          id: "lv-deploy-scheduler-cron-q3",
          prompt:
            "An atomic-release deploy writes to `/var/www/app/releases/20260921103000` and flips `/var/www/app/current`. The crontab says `cd /var/www/app/releases/20260921103000 && php artisan schedule:run`. What breaks?",
          options: [
            "The scheduler keeps running the code of that one release forever, and starts failing outright once old releases are pruned",
            "Nothing, because the release directory is never deleted",
            "`schedule:run` refuses to run outside the `current` path",
            "The tasks run twice, once from the release and once from `current`",
          ],
          correctIndex: 0,
          explanation:
            "The cron entry is server state, not release state. Point it at the stable `current` symlink so every deploy is picked up by the next minute's run.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-scheduler-cron-q4",
          prompt: "`Schedule::command('reports:build')->everyMinute()->withoutOverlapping();` — how is the overlap prevented, and what is the deploy risk?",
          options: [
            "Through a lock in the application cache, so flushing the cache during a deploy can release the lock and let a second copy start",
            "Through a `flock()` on a file in `storage/framework`, so a deploy that replaces the directory breaks it",
            "Through a row in the `jobs` table, so it needs the database queue driver",
            "Through a PID check, so it only works when the task runs in the foreground",
          ],
          correctIndex: 0,
          explanation:
            "`optimize:clear` runs `cache:clear`, which is the usual way this happens. `schedule:clear-cache` is the deliberate version, for a lock stranded by a crashed task.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-scheduler-cron-q5",
          prompt: "Three application servers all run the scheduler cron entry, and a Friday report is generated three times. What is the fix, and what does it require?",
          options: [
            "`->onOneServer()`, which takes an atomic lock — so every server must share one central cache store",
            "`->withoutOverlapping()`, which detects the other servers' running processes",
            "Remove the cron entry from two of the three servers",
            "`->runInBackground()`, which makes only the first server claim the task",
          ],
          correctIndex: 0,
          explanation:
            "Removing the entry from two servers works until that one server is the one that fails. `withoutOverlapping()` is per-lock too, but it guards against a slow previous run, not against peers.",
        },
        {
          id: "lv-deploy-scheduler-cron-q6",
          prompt: "Which statements about the scheduler during a deploy are true? (Select all that apply.)",
          options: [
            "Scheduled tasks do not run while the application is in maintenance mode unless marked `evenInMaintenanceMode()`",
            "`schedule:pause` stops tasks running without a code change, and `schedule:continue` resumes them",
            "`php artisan reload` calls `schedule:interrupt` to stop an in-flight `schedule:run`",
            "`schedule:run` refuses to start if a previous minute's run is still executing",
            "The scheduler reloads `routes/console.php` between tasks, so a deploy takes effect mid-run",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Each `schedule:run` is a fresh short-lived process, so it naturally picks up new code on the next minute — but a run already in progress is running the old code until it ends, which is what `schedule:interrupt` is for.",
        },
        {
          id: "lv-deploy-scheduler-cron-q7",
          prompt: "Two tasks are scheduled at the same minute and the first takes four minutes. When does the second run?",
          options: [
            "After the first finishes, because tasks in one `schedule:run` execute sequentially in definition order unless `runInBackground()` is used",
            "Immediately, in parallel — each task gets its own process",
            "Never, because `schedule:run` exits after one task",
            "On the next minute's run, from a queue of deferred tasks",
          ],
          correctIndex: 0,
          explanation:
            "`runInBackground()` (available for `command` and `exec` tasks) is the fix, and dispatching a queued job from the schedule is usually better still — it keeps `schedule:run` short.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-scheduler-cron-q8",
          prompt: "The documented cron entry ends with `>> /dev/null 2>&1`. What does that cost you, and what should you add?",
          options: [
            "It discards all task output, including errors — so attach `onFailure()`, `emailOutputOnFailure()` or a heartbeat check to the tasks that matter",
            "It discards only stdout, so errors still reach the crontab owner's mailbox",
            "It suppresses the exit status, so cron cannot retry — use `MAILTO=` instead",
            "Nothing; Laravel writes all task output to `storage/logs` regardless",
          ],
          correctIndex: 0,
          explanation:
            "`2>&1` folds stderr into stdout before both go to `/dev/null`. The redirect stops a mail flood every minute; the price is that failures are invisible unless the schedule reports them itself.",
        },
        {
          id: "lv-deploy-scheduler-cron-q9",
          prompt: "What happens when a sub-minute task such as `->everySecond()` is defined?",
          options: [
            "`schedule:run` keeps running until the end of the current minute so it can invoke the task repeatedly, rather than exiting immediately",
            "Laravel installs a second cron entry that runs every second",
            "The task is rounded up to once per minute, because cron cannot go finer",
            "A dedicated `schedule:work` daemon is required in production",
          ],
          correctIndex: 0,
          explanation:
            "Because the process stays alive, a slow sub-minute task delays the ones behind it — which is why the docs recommend that sub-minute tasks only dispatch queued jobs.",
        },
        {
          id: "lv-deploy-scheduler-cron-q10",
          prompt: "What is `php artisan schedule:work` for?",
          options: [
            "Local development: it runs in the foreground and invokes the scheduler every minute, so no cron entry is needed on a developer machine",
            "Production: it is the recommended daemon replacement for the cron entry",
            "It processes the queue of tasks that failed their scheduled window",
            "It is an alias for `schedule:run` that adds `--force`",
          ],
          correctIndex: 0,
          explanation:
            "In production it would be one more long-lived process to supervise for no benefit, since cron already exists and restarts nothing on its own.",
        },
      ],
    },
    {
      id: "lv-deploy-cache-redis",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Production Caching: the Application Cache and Redis",
      summary:
        "Two unrelated things in a Laravel deploy are both called \"cache\", and conflating them causes outages. The framework caches — `bootstrap/cache/config.php`, the route and event caches, compiled views — are build artefacts of one release, local to one machine, rebuilt on every deploy. The application cache reached through `Cache::` is shared runtime state with a lifetime longer than any release. `php artisan optimize:clear` clears both, which is why it is the wrong tool for clearing a stale view.\n\nDriver choice is a deployment decision. The Laravel skeleton defaults `CACHE_STORE` to `database`, which changed from `file` in Laravel 11 and is a sensible default precisely because it survives a deploy and works from more than one process. `file` is per-server and becomes wrong the moment you add a second one. `array` is per-request, so `Cache::` silently becomes a no-op between processes — and takes `queue:restart`, `--isolated` migrations, `onOneServer()` and cache-driver maintenance mode with it. Redis is the usual production answer: shared, fast, with atomic locks (`Cache::lock`), tagging, and the ability to back sessions and queues too.\n\nThat convenience has a shape you should choose deliberately. `maxmemory-policy` decides what Redis does when it fills up: `allkeys-lru` is right for a pure cache, and catastrophic for an instance that also holds queued jobs, because evicting a job loses it silently. Use separate Redis databases or separate instances for cache, queue and session rather than one shared pool with one eviction policy. `CACHE_PREFIX` is the other trap — staging and production pointed at one Redis with the same prefix will read each other's data.\n\nFinally, invalidation on deploy. Flushing the cache after every release is a habit worth breaking: a cold cache under production traffic is a thundering herd against your database at exactly the moment you have changed something. Version your keys instead so old and new coexist, use `Cache::flexible()` (stale-while-revalidate) so one request refreshes while others are served stale, and pre-warm anything expensive before traffic moves.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Cache", url: "https://laravel.com/framework/docs/13.x/cache", kind: "docs" },
        { label: "Laravel: Cache — Atomic Locks", url: "https://laravel.com/framework/docs/13.x/cache#atomic-locks", kind: "docs" },
        { label: "Laravel: Redis", url: "https://laravel.com/framework/docs/13.x/redis", kind: "docs" },
        { label: "Redis: Key eviction", url: "https://redis.io/docs/latest/develop/reference/eviction/", kind: "docs" },
      ],
      video: {
        title: "Let's Talk About Caching Dos and Don'ts",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=ZEH4Ryd96H0",
        videoId: "ZEH4Ryd96H0",
        durationLabel: "14:40",
      },
      alternateVideos: [
        {
          title: "Ultimate Laravel Optimization Guide! (Queries, Queues, Caching, Infrastructure)",
          channel: "David Grzyb",
          url: "https://www.youtube.com/watch?v=1zwsdl0eCwo",
          videoId: "1zwsdl0eCwo",
          startSeconds: 1340,
          chapterLabel: "Redis in Production Environments",
          durationLabel: "35:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-cache-redis-q1",
          prompt: "Which of these is the *application* cache rather than a framework build artefact?",
          options: [
            "Whatever `Cache::remember('report', 3600, …)` stores",
            "`bootstrap/cache/config.php`",
            "The compiled Blade templates under `storage/framework/views`",
            "`bootstrap/cache/packages.php`",
          ],
          correctIndex: 0,
          explanation:
            "The framework caches are per-release files on local disk. The application cache is shared state in a store, with a lifetime independent of any deploy.",
        },
        {
          id: "lv-deploy-cache-redis-q2",
          prompt: "Why is `CACHE_STORE=array` a dangerous setting to find in a production `.env`?",
          options: [
            "It only lives for the life of one process, so `Cache::` is a no-op across requests and `queue:restart`, `--isolated` migrations and `onOneServer()` all silently stop working",
            "It stores cache entries in memory without a size limit, so the process eventually runs out of memory",
            "It writes to `/tmp`, which is cleared on reboot",
            "It is read-only, so every `Cache::put` throws",
          ],
          correctIndex: 0,
          explanation:
            "Nothing errors. Every feature that coordinates through the cache just stops coordinating, which is much harder to notice than a failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-cache-redis-q3",
          prompt: "What is the default `CACHE_STORE` in a current Laravel skeleton, and why does it matter for deployment?",
          options: [
            "`database` — it survives a deploy and is visible to every process on the host, unlike the older `file` default",
            "`file` — the simplest option, and still the default",
            "`redis`, so a Redis server is a hard requirement of a fresh install",
            "`array`, so nothing is persisted until you choose a store",
          ],
          correctIndex: 0,
          explanation:
            "It moved from `file` in Laravel 11. A database store needs no extra service, works from CLI and web alike, and is good enough until contention makes Redis worth adding.",
        },
        {
          id: "lv-deploy-cache-redis-q4",
          prompt:
            "One Redis instance is used for the cache, the queue and sessions, with `maxmemory-policy allkeys-lru`. Memory fills up under load. What is the worst consequence?",
          options: [
            "Redis evicts queued jobs along with cache entries, so work is lost with no error anywhere",
            "Redis refuses new writes, so the cache stops updating but nothing is lost",
            "Sessions are evicted first because they are the largest keys",
            "Redis swaps to disk and slows down but keeps everything",
          ],
          correctIndex: 0,
          explanation:
            "`allkeys-lru` is correct for data you can regenerate and wrong for data you cannot. Separate databases or instances let each one have the policy it deserves — `noeviction` for the queue.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-cache-redis-q5",
          prompt: "Staging and production share one Redis server and both use the default cache prefix. What goes wrong?",
          options: [
            "They read and write each other's keys, so a staging deploy can serve stale or wrong data to production users",
            "Redis rejects the second connection because the prefix is already registered",
            "Nothing — Laravel namespaces keys by `APP_ENV` automatically",
            "Only the queue is affected, because cache keys include a random salt",
          ],
          correctIndex: 0,
          explanation:
            "`CACHE_PREFIX` defaults to a slug of the application name, which is identical across environments of the same app. Set it per environment, or give each environment its own Redis database.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-cache-redis-q6",
          prompt: "Which Laravel features depend on the application cache store being shared and persistent? (Select all that apply.)",
          options: [
            "`php artisan queue:restart`",
            "`php artisan migrate --isolated`",
            "`->onOneServer()` and `->withoutOverlapping()` on scheduled tasks",
            "`php artisan config:cache`",
            "Compiling Blade views with `view:cache`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The last two write PHP files to local disk and never touch a cache store. The first three are coordination primitives built on `Cache::lock` and friends.",
        },
        {
          id: "lv-deploy-cache-redis-q7",
          prompt: "Why is `php artisan cache:clear` on every deploy a habit worth breaking?",
          options: [
            "A cold cache under live traffic sends every request through to the database at once — a thundering herd at the worst possible moment",
            "It is slow on Redis because it iterates every key",
            "It clears the config cache too, so the application boots unconfigured",
            "It empties the failed-jobs table",
          ],
          correctIndex: 0,
          explanation:
            "Invalidate what the release actually changed — by key or by tag — or version the key so old and new entries coexist. Flushing everything trades a correctness worry for a load spike.",
        },
        {
          id: "lv-deploy-cache-redis-q8",
          prompt: "What does `Cache::flexible('key', [300, 3600], $callback)` give you that `Cache::remember` does not?",
          options: [
            "Stale-while-revalidate: after the first duration the cached value is still served while a background refresh runs, so no request waits for a recompute",
            "It stores the value in two stores at once for redundancy",
            "It refreshes the key on a schedule rather than on access",
            "It bypasses the cache entirely when the callback is cheap",
          ],
          correctIndex: 0,
          explanation:
            "`remember` makes whichever unlucky request arrives after expiry pay the full cost — and under concurrency, several of them at once. `flexible` keeps the tail latency flat.",
        },
        {
          id: "lv-deploy-cache-redis-q9",
          prompt: "You need to guarantee that only one process runs an expensive rebuild, even across servers. What does Laravel provide?",
          options: [
            "`Cache::lock('rebuild', 120)->get(fn () => …)`, an atomic lock on a store that supports it",
            "`Cache::remember`, which is atomic by definition",
            "A database transaction around the rebuild",
            "`Cache::tags(['rebuild'])->flush()` before starting",
          ],
          correctIndex: 0,
          explanation:
            "Atomic locks are supported by the memcached, redis, dynamodb, database, file and array drivers, and are the same primitive `onOneServer()` and `--isolated` are built on.",
        },
        {
          id: "lv-deploy-cache-redis-q10",
          prompt: "Which is the sound reason to move sessions from the `database` driver to `redis` in production?",
          options: [
            "Session writes happen on nearly every request, so they add write load to the database that has nothing to do with your data",
            "Redis sessions are encrypted at rest and database sessions are not",
            "The database driver cannot share sessions between application servers",
            "Redis sessions survive a `cache:clear` while database sessions do not",
          ],
          correctIndex: 0,
          explanation:
            "Both drivers are shared and both are cleared independently of the cache. The argument is load: a session write per request is the kind of traffic a key-value store is designed for.",
        },
      ],
    },
    {
      id: "lv-deploy-logging-monitoring",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Logging, Health Checks and Monitoring",
      summary:
        "A fresh Laravel app logs through the `stack` channel, which by default contains only `single` — one file at `storage/logs/laravel.log` that grows until the disk does not. On a long-lived server, `daily` with `LOG_DAILY_DAYS` retention is the minimum change. In a container, the right channel is `stderr`, because a container's log *is* its standard output; writing to a file inside an ephemeral filesystem means the evidence disappears with the container that produced it. `LOG_LEVEL` defaults to `debug` in the skeleton, which in production means logging every query and every payload — a disk-space problem and a privacy one.\n\nLogs are only useful if you can correlate them. `Log::info('Order placed', ['order_id' => $id])` is the floor; Laravel's `Context` facade is the ceiling, attaching fields to every log line for the rest of the request and carrying them into queued jobs dispatched from it, which is how you follow a web request into the background work it caused. If something downstream parses your logs, set a `JsonFormatter` and stop writing prose. And `APP_DEBUG` must be `false` in production, always: with it on, an unhandled exception renders a page containing your configuration and environment.\n\nHealth checking is built in. `/up` returns 200 if the application booted without exceptions and 500 if it did not; its URI is configurable through `health:` in `->withRouting()` in `bootstrap/app.php`, and it dispatches `DiagnosingHealth` so a listener can check the database or cache and throw. Be careful how deep you make it: a health check that fails when Redis blips will pull every instance out of the load balancer at the same moment, turning a degradation into an outage. Keep the load-balancer check shallow and put the deep checks on a separate endpoint that alerts rather than evicts.\n\nFor what is happening inside, `php artisan about` tells you what a deployed instance believes about itself, Pulse gives you in-app performance cards, Horizon gives you queue throughput and wait times, and Telescope is a development tool that records requests, queries and payloads — never expose it in production without authorisation. None of them replaces an external uptime check: a monitor running inside the thing it monitors reports nothing when the thing is down.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: Logging", url: "https://laravel.com/framework/docs/13.x/logging", kind: "docs" },
        { label: "Laravel: Context", url: "https://laravel.com/framework/docs/13.x/context", kind: "docs" },
        { label: "Laravel: Deployment — The Health Route", url: "https://laravel.com/framework/docs/13.x/deployment#the-health-route", kind: "docs" },
        { label: "The Twelve-Factor App: Logs", url: "https://12factor.net/logs", kind: "article" },
      ],
      video: {
        title: "Configuring (and viewing!) logs in Laravel",
        channel: "Aaron Francis",
        url: "https://www.youtube.com/watch?v=MGASWCQ6TJ0",
        videoId: "MGASWCQ6TJ0",
        durationLabel: "13:16",
      },
      alternateVideos: [
        {
          title: "Pulse - Monitor Your Application's Performance in Production",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=V40uwtx_usM",
          videoId: "V40uwtx_usM",
          durationLabel: "4:09",
        },
        {
          title: "Real-time monitoring for Laravel applications",
          channel: "Aaron Francis",
          url: "https://www.youtube.com/watch?v=DTEAN5ADfhs",
          videoId: "DTEAN5ADfhs",
          durationLabel: "5:11",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-logging-monitoring-q1",
          prompt: "Which log channel is right for a Laravel application running in a container?",
          options: [
            "`stderr`, so the container runtime collects the logs like any other process output",
            "`single`, with a volume mounted at `storage/logs`",
            "`daily`, with `LOG_DAILY_DAYS=30`",
            "`syslog`, which is the only channel that works without a writable filesystem",
          ],
          correctIndex: 0,
          explanation:
            "A container's log stream is its stdout and stderr; anything written to a file inside it dies with the container unless you add a volume and a collector, which is more moving parts for a worse result.",
        },
        {
          id: "lv-deploy-logging-monitoring-q2",
          prompt: "What is the `stack` channel, and what does it contain by default?",
          options: [
            "A channel that forwards each message to several other channels; the skeleton's `LOG_STACK` puts only `single` in it",
            "A channel that records the stack trace of every log call",
            "The channel used only for uncaught exceptions",
            "An alias for `daily` kept for backwards compatibility",
          ],
          correctIndex: 0,
          explanation:
            "It is the composition point: `LOG_STACK=daily,slack` sends everything to a rotating file and the critical entries on to Slack, because each channel filters by its own `level`.",
        },
        {
          id: "lv-deploy-logging-monitoring-q3",
          prompt: "`LOG_LEVEL` is left at the skeleton's `debug` on a busy production server. What is the practical consequence?",
          options: [
            "Every debug-level message is written, which fills the disk and can persist request payloads and query bindings you did not intend to keep",
            "Nothing, because Laravel raises the effective level automatically when `APP_ENV=production`",
            "Only the `single` channel is affected; `daily` always filters at `info`",
            "Log writes become synchronous and slow every request down by design",
          ],
          correctIndex: 0,
          explanation:
            "Level filtering is per channel and purely from configuration — nothing adjusts it for you. `info` or `warning` is the usual production floor, with `debug` reachable per-channel when you need it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-logging-monitoring-q4",
          prompt: "What does Laravel's `Context` facade give you that a per-call array of context does not?",
          options: [
            "Fields attached once persist across every log entry for the rest of the request and are carried into jobs queued from it",
            "It writes the context to a separate file so the main log stays readable",
            "It guarantees the context is JSON-encoded regardless of the formatter",
            "It stores the context in the cache so other requests can read it",
          ],
          correctIndex: 0,
          explanation:
            "That propagation into queued jobs is the point: a request id added once at the edge lets you follow a user's action from the controller into the job that finished it ten seconds later.",
        },
        {
          id: "lv-deploy-logging-monitoring-q5",
          prompt: "A load balancer health-checks `/up`, and the listener on `DiagnosingHealth` throws when Redis is unreachable. Redis has a ten-second blip. What happens?",
          options: [
            "Every instance fails the check simultaneously and is pulled from the pool, so a degradation becomes a full outage",
            "Only the instance whose Redis connection blipped is removed, which is the intended behaviour",
            "The check is cached for a minute, so nothing happens",
            "The balancer ignores 500s on health endpoints and keeps routing",
          ],
          correctIndex: 0,
          explanation:
            "The check a balancer uses should answer 'can this instance serve traffic', not 'is the whole system healthy'. Deep dependency checks belong on an endpoint that pages a human instead of evicting servers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-logging-monitoring-q6",
          prompt: "Which statements about Laravel's built-in health route are true? (Select all that apply.)",
          options: [
            "It is served at `/up` by default and returns 200 when the application booted without exceptions",
            "Its URI is configured with the `health:` argument to `->withRouting()` in `bootstrap/app.php`",
            "It dispatches an `Illuminate\\Foundation\\Events\\DiagnosingHealth` event so listeners can add their own checks",
            "It verifies the database connection out of the box",
            "It is only registered when `APP_ENV=production`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Out of the box it proves only that the framework booted — which is genuinely useful, because a broken config cache or a missing `APP_KEY` fails it. Anything deeper is yours to add in a listener.",
        },
        {
          id: "lv-deploy-logging-monitoring-q7",
          prompt: "Why must `APP_DEBUG` be `false` in production even on an internal application?",
          options: [
            "With debug on, an unhandled exception renders a page containing configuration values, environment variables and source context",
            "Debug mode disables the route cache, so the application is slower",
            "It forces `LOG_LEVEL` to `debug` regardless of configuration",
            "It disables CSRF protection on POST routes",
          ],
          correctIndex: 0,
          explanation:
            "\"Internal\" is not a security boundary — anyone who can reach the app can trigger an exception. This is one of the highest-severity misconfigurations in a PHP deploy and it is one environment variable.",
        },
        {
          id: "lv-deploy-logging-monitoring-q8",
          prompt: "Telescope is installed and its dashboard is reachable in production without authorisation. What is the exposure?",
          options: [
            "It records requests, queries, jobs and their payloads, so it can hand an anonymous visitor tokens, personal data and query contents",
            "It only exposes timing information, so the risk is limited to fingerprinting",
            "None, because Telescope redacts all parameters automatically",
            "It allows arbitrary code execution through the Tinker tab",
          ],
          correctIndex: 0,
          explanation:
            "Telescope is a debugging recorder, which is exactly what makes it dangerous when exposed. Gate it behind an authorisation callback, or keep it out of production entirely.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-logging-monitoring-q9",
          prompt: "Why is an external uptime check necessary even with Pulse, Horizon and structured logs in place?",
          options: [
            "All three run inside the application; when the application is down they report nothing, and silence is indistinguishable from health",
            "They only collect data during business hours by default",
            "They cannot observe queue jobs, only HTTP requests",
            "External checks are the only way to measure response time accurately",
          ],
          correctIndex: 0,
          explanation:
            "Self-hosted observability tells you how a running system behaves. Something outside your infrastructure has to be the one that notices when there is no running system.",
        },
        {
          id: "lv-deploy-logging-monitoring-q10",
          prompt: "What is `php artisan about` most useful for right after a deploy?",
          options: [
            "Confirming the environment, debug mode, drivers in use and which caches are warm on the instance you are actually standing on",
            "Listing the routes registered by the new release",
            "Reporting how many jobs are waiting on each queue",
            "Showing the diff between the deployed commit and the previous one",
          ],
          correctIndex: 0,
          explanation:
            "It answers 'is this box configured the way I think it is' in one command — which is exactly the question behind most post-deploy confusion.",
        },
        {
          id: "lv-deploy-logging-monitoring-q11",
          prompt: "What should a production alert on the queue watch, and why?",
          options: [
            "Queue depth and oldest-job wait time, because a worker that died leaves the application looking healthy while work silently piles up",
            "The number of jobs processed per minute, since a drop always means failure",
            "The size of `storage/logs`, which grows in proportion to queue activity",
            "CPU usage on the worker host, which is the only signal that generalises",
          ],
          correctIndex: 0,
          explanation:
            "Nothing about a stopped worker shows up in HTTP metrics. Wait time is the user-visible symptom; depth tells you whether it is a spike or a stall.",
        },
      ],
    },
    {
      id: "lv-deploy-zero-downtime",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Zero-Downtime Deploys, Maintenance Mode and Rollback",
      summary:
        "`git pull && composer install && php artisan migrate` on a live server is a deploy strategy where the site is broken for its duration: `vendor/` is half-written, the config cache is stale, and requests keep arriving throughout. `php artisan down` at least turns a random 500 into an honest 503 — with `--secret` or `--with-secret` for a bypass cookie so you can verify the release yourself, `--render` to pre-render the view (rendering it normally requires booting the framework you are in the middle of breaking), `--redirect` to send visitors somewhere useful, and `APP_MAINTENANCE_DRIVER=cache` so one command covers a whole fleet instead of one server. It is still downtime, and queue and scheduler processing stops with it.\n\nAtomic releases remove the window. Build the new version in `releases/<timestamp>/`, symlink `storage/` and `.env` in from a shared directory, run `composer install`, `php artisan optimize` and `migrate --force` inside it, then move traffic with a single atomic `rename(2)` of the `current` symlink — `ln -sfn … && mv -Tf …`, or whatever your tool does for you. Requests move between releases, not between files; there is no moment at which a request sees a half-built tree. Deployer, Envoy, GitHub Actions and Forge all implement this shape.\n\nTwo things reliably catch people. The first is **OPcache and the symlink**: OPcache and the realpath cache key compiled files by resolved path, so if nginx sends `SCRIPT_FILENAME $document_root$fastcgi_script_name` every release resolves to the same path and the new code can be served from the previous release's bytecode. Laravel's sample config uses `$realpath_root` for this reason. With `opcache.validate_timestamps=0` — the right production setting — you must additionally reload PHP-FPM or call `opcache_reset()` **from inside a pool worker**, because the CLI has its own separate OPcache and resetting it there achieves nothing.\n\nThe second is that **the database is not part of the flip**. Rolling back is pointing `current` at the previous release and reloading FPM; it does not un-run a migration. So every migration must be compatible with the release before it, and any release that is not safely reversible needs its own plan — a feature flag, a forward fix, or an accepted maintenance window. Keep enough old releases around to have somewhere to roll back to, and prune by count, not by hand.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Laravel: Deployment", url: "https://laravel.com/framework/docs/13.x/deployment", kind: "docs" },
        { label: "Laravel: Configuration — Maintenance Mode", url: "https://laravel.com/framework/docs/13.x/configuration#maintenance-mode", kind: "docs" },
        { label: "Deployer: Basics", url: "https://deployer.org/docs/7.x/basics", kind: "docs" },
        { label: "PHP Manual: opcache_reset", url: "https://www.php.net/manual/en/function.opcache-reset.php", kind: "docs" },
      ],
      video: {
        title: "Deploying Laravel with Deployer",
        channel: "Daniel Werner",
        url: "https://www.youtube.com/watch?v=vY2So0OaHCY",
        videoId: "vY2So0OaHCY",
        durationLabel: "13:11",
      },
      alternateVideos: [
        {
          title: "Effortless Continuous Deployment for Laravel with GitHub Actions",
          channel: "Glenn Raya",
          url: "https://www.youtube.com/watch?v=C9_O9dn7SzY",
          videoId: "C9_O9dn7SzY",
          durationLabel: "15:40",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-zero-downtime-q1",
          prompt: "What makes an atomic-release deploy atomic?",
          options: [
            "Traffic is moved by renaming a single symlink, an operation the kernel performs indivisibly, so no request ever sees a partially built release",
            "The files are copied with `rsync --atomic`, which writes to a temporary name first",
            "The web server is stopped, the files are replaced, and it is started again",
            "The deploy runs inside a database transaction that can be rolled back",
          ],
          correctIndex: 0,
          explanation:
            "Building elsewhere and flipping a pointer is the whole idea. `rename(2)` over an existing symlink either has happened or has not; there is no in-between state for a request to land in.",
        },
        {
          id: "lv-deploy-zero-downtime-q2",
          prompt:
            "After switching to symlinked releases, the first requests on a new release run the *previous* release's code even though `current` points at the new directory. What is the cause?",
          options: [
            "nginx is passing `SCRIPT_FILENAME $document_root$fastcgi_script_name`, so every release resolves to the same path and OPcache serves the old bytecode",
            "The symlink was created with `ln -s` instead of `ln -sfn`, so it points at the old release",
            "PHP-FPM caches the document root at startup and needs a full restart on every deploy",
            "Composer's classmap still lists the old paths",
          ],
          correctIndex: 0,
          explanation:
            "`$realpath_root` resolves the symlink so each release gets its own OPcache keys. It is the single most common reason a symlink deploy 'doesn't take'.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-zero-downtime-q3",
          prompt:
            "Production runs with `opcache.validate_timestamps=0`. The deploy script ends with `php -r 'opcache_reset();'`. Why does the new code still not appear?",
          options: [
            "The CLI SAPI has its own OPcache, separate from the FPM pool's shared memory — resetting it from the command line does nothing to the web workers",
            "`opcache_reset()` is disabled by default and must be enabled with `opcache.enable_cli`",
            "`opcache_reset()` only clears the JIT buffer, not the compiled scripts",
            "It works, but only after `validate_timestamps` is set back to 1",
          ],
          correctIndex: 0,
          explanation:
            "Either reload the FPM master (`systemctl reload php8.4-fpm`, which is graceful) or call `opcache_reset()` through an HTTP request handled by the pool. The CLI can never reach the web workers' cache.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-zero-downtime-q4",
          prompt: "Which directories must be shared between releases rather than living inside each one? (Select all that apply.)",
          options: [
            "`storage/`, which holds logs, sessions and locally stored uploads",
            "`.env`, so the environment is not rebuilt or copied on each deploy",
            "Anything else the application writes at runtime and expects to find later",
            "`vendor/`, so Composer does not reinstall packages every time",
            "`bootstrap/cache/`, so the config cache survives the flip",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`vendor/` and `bootstrap/cache/` are release artefacts and must match the code they belong to — sharing them is how you get the previous release's dependencies and config cache serving new code.",
        },
        {
          id: "lv-deploy-zero-downtime-q5",
          prompt: "Why does `php artisan down --render=\"errors::503\"` exist?",
          options: [
            "The normal maintenance view needs a good deal of the framework booted to render, which is unreliable exactly when dependencies are being replaced",
            "It caches the view so the 503 is served faster under load",
            "It is required when `APP_MAINTENANCE_DRIVER=cache`",
            "It renders the view in the language of the requesting browser",
          ],
          correctIndex: 0,
          explanation:
            "Pre-rendering writes the HTML at the moment you run `down`, so it can be returned at the very start of the request cycle. Without it, a mid-`composer install` request can hit a fatal instead of your maintenance page.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-zero-downtime-q6",
          prompt: "Four application servers sit behind a load balancer. What does `APP_MAINTENANCE_DRIVER=cache` change about `php artisan down`?",
          options: [
            "Maintenance state is stored in a shared cache store, so one `down` covers every server instead of needing the command on each",
            "It makes the maintenance response cacheable by the load balancer",
            "It caches the maintenance view, replacing `--render`",
            "It keeps the queue running during maintenance mode",
          ],
          correctIndex: 0,
          explanation:
            "The default is a file in `storage/framework`, which is per-server. The cache driver needs a store every server shares — and `APP_MAINTENANCE_STORE` names which one.",
        },
        {
          id: "lv-deploy-zero-downtime-q7",
          prompt: "What is `php artisan down --with-secret` for?",
          options: [
            "It generates a bypass token; visiting the application URL with that token sets a cookie that lets you browse the site normally while everyone else sees the 503",
            "It encrypts the maintenance page so search engines cannot index it",
            "It requires a secret before `php artisan up` will work",
            "It puts only authenticated users into maintenance mode",
          ],
          correctIndex: 0,
          explanation:
            "It is how you smoke-test a release before letting traffic in. `--secret` lets you supply the token yourself; `--with-secret` has Laravel generate and print one.",
        },
        {
          id: "lv-deploy-zero-downtime-q8",
          prompt: "You roll back by pointing `current` at the previous release and reloading FPM. What has *not* been rolled back?",
          options: [
            "The database — migrations that ran during the deploy are still applied, so the old code has to tolerate the new schema",
            "The `.env` file, which is copied per release",
            "The application cache, which is tied to the release directory",
            "The queue workers, which exit automatically when the symlink changes",
          ],
          correctIndex: 0,
          explanation:
            "This is the constraint that makes expand/contract non-negotiable. It also explains why a release containing an irreversible migration needs a different plan than 'we can always roll back'.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-zero-downtime-q9",
          prompt: "In an atomic-release deploy, where do `composer install` and `php artisan optimize` run?",
          options: [
            "Inside the new release directory, before the symlink is flipped, so the release is complete and cached the instant it starts serving",
            "Against the `current` symlink, so the caches reflect the live paths",
            "After the flip, as the first requests arrive, so the caches are warmed by real traffic",
            "On the build machine only; the server receives a finished archive and never runs Composer",
          ],
          correctIndex: 0,
          explanation:
            "Building in place is what makes the flip safe. Building the artefact on a CI machine and shipping it is also legitimate — but then Composer runs there, not against `current`.",
        },
        {
          id: "lv-deploy-zero-downtime-q10",
          prompt: "Why does a symlink-release deploy usually keep several previous releases on disk?",
          options: [
            "Rollback is a symlink flip back to a previous release, so there has to be one to flip back to",
            "Composer needs them to resolve the dependency graph incrementally",
            "OPcache reads across releases to warm the new one",
            "The scheduler runs tasks from the most recent three releases for redundancy",
          ],
          correctIndex: 0,
          explanation:
            "Keeping a fixed number — five is typical — bounds disk use while guaranteeing a rollback target. Pruning is part of the deploy, not a cleanup somebody remembers to do.",
        },
        {
          id: "lv-deploy-zero-downtime-q11",
          prompt: "Which steps belong *after* the symlink flip in a deploy script?",
          options: [
            "Reload PHP-FPM, then `php artisan reload` (or `queue:restart` and `schedule:interrupt`) so long-lived processes pick up the new release",
            "`composer install` and `php artisan optimize`, so they run against the live path",
            "`php artisan migrate --force`, so the schema changes only once the code is live",
            "`storage:link`, because the link cannot be created before the release is current",
          ],
          correctIndex: 0,
          explanation:
            "Everything that builds the release happens before the flip; everything that cycles processes already running the old release happens after. Workers must not be restarted early or they will come back on the old code.",
        },
        {
          id: "lv-deploy-zero-downtime-q12",
          prompt: "A team argues that `php artisan down` during a two-minute deploy is fine because traffic is low at 3 a.m. What is the strongest counter-argument?",
          options: [
            "Maintenance mode also stops queue workers and scheduled tasks, so the blast radius is larger than the HTTP downtime and grows with every deploy you are afraid to do during the day",
            "Maintenance mode returns 503, which permanently harms search ranking",
            "`php artisan up` can fail, leaving the site down indefinitely",
            "Two minutes exceeds the timeout of most load balancers, which will mark the host permanently unhealthy",
          ],
          correctIndex: 0,
          explanation:
            "The real cost is not the two minutes; it is that deploying becomes an event you schedule, which makes releases larger, riskier and rarer. A 503 with a `Retry-After` is understood by crawlers.",
        },
      ],
    },
    {
      id: "lv-deploy-docker",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Containerising Laravel",
      summary:
        "Laravel Sail is a local development convenience, not a production image: it mounts your source, installs dev tooling and runs as a development user. A production image is a multi-stage build — Composer and Node in the build stage, and a runtime stage containing only PHP, its extensions, `vendor/` and the compiled assets. Nothing from the toolchain ships.\n\nBake the build step into the image: `composer install --no-dev --optimize-autoloader`, the asset build, and `php artisan optimize` so the running container does nothing but serve. That immediately collides with the `env()` trap in container form, because a config cache baked at build time freezes whatever environment the *builder* had. The usual resolution is to cache routes, views and events at build time and run `config:cache` in the container's entrypoint, once the real environment variables have been injected — which is also why container deploys tend to skip `.env` entirely and pass variables directly, where `env()` genuinely works.\n\nStructure the workload as one process per container: an `app` container, a `queue` container running `queue:work`, a `scheduler` container, rather than supervisord inside one image. The orchestrator can then restart, scale and monitor each independently, and a crashed worker is a container the platform restarts rather than a process nobody notices. FrankenPHP collapses the web server and PHP into a single process and is the simplest web container; nginx plus PHP-FPM needs either two containers sharing a socket or a process supervisor inside one.\n\nThe rest is the usual container discipline applied to Laravel. `storage/` must be a volume or, better, object storage — a container filesystem is ephemeral, so `file` cache, `file` sessions and locally stored uploads vanish on every deploy. Logs go to `stderr`. Add a `HEALTHCHECK` against `/up`, run as a non-root `USER`, and write a `.dockerignore` that excludes `.env`, `vendor/`, `node_modules/` and `.git` — secrets are injected at run time and never copied into a layer, because image layers are forever. Deploys become 'start containers from the new image tag and retire the old ones', which is atomic by construction, with migrations as a separate one-shot job so N replicas do not race each other.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Docker: Multi-stage builds", url: "https://docs.docker.com/build/building/multi-stage/", kind: "docs" },
        { label: "FrankenPHP: Docker images", url: "https://frankenphp.dev/docs/docker/", kind: "docs" },
        { label: "Docker: Dockerfile reference", url: "https://docs.docker.com/reference/dockerfile/", kind: "docs" },
        { label: "Laravel: Sail", url: "https://laravel.com/framework/docs/13.x/sail", kind: "docs" },
      ],
      video: {
        title: "Laravel Docker Nginx + PHP-FPM + op_cache",
        channel: "Emad Zaamout",
        url: "https://www.youtube.com/watch?v=so50k0t7qWo",
        videoId: "so50k0t7qWo",
        durationLabel: "22:07",
      },
      alternateVideos: [
        {
          title: "How to Deploy Laravel with Octane, FrankenPHP and Docker on Debian",
          channel: "DevWithAri",
          url: "https://www.youtube.com/watch?v=d8NiAbqb6aI",
          videoId: "d8NiAbqb6aI",
          durationLabel: "9:24",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-docker-q1",
          prompt: "Why is Laravel Sail's image not a production image?",
          options: [
            "It is built for local development: it mounts your source, ships dev tooling and runs as a development user",
            "It only supports SQLite, so it cannot connect to a real database",
            "It is licensed for non-commercial use",
            "It pins an end-of-life PHP version",
          ],
          correctIndex: 0,
          explanation:
            "Sail is a great local environment and was never meant to be deployed. A production image bakes the code in, drops the toolchain and runs unprivileged.",
        },
        {
          id: "lv-deploy-docker-q2",
          prompt: "What does a multi-stage build achieve for a Laravel image?",
          options: [
            "Composer, Node and the compilers live in a build stage; only PHP, its extensions, `vendor/` and the built assets are copied into the runtime stage",
            "It builds several architectures at once from one Dockerfile",
            "It lets the container rebuild itself when the source changes",
            "It splits the image into one layer per Composer package for faster pulls",
          ],
          correctIndex: 0,
          explanation:
            "A smaller runtime image is the visible benefit; a smaller attack surface is the better one. Nothing that compiles code should be present in something facing the internet.",
        },
        {
          id: "lv-deploy-docker-q3",
          prompt:
            "A Dockerfile runs `php artisan config:cache` at build time. The image is deployed to staging and production with different `DB_HOST` values injected as container environment variables. What happens?",
          options: [
            "Both environments use the config baked at build time, so the injected values are ignored and one of them connects to the wrong database",
            "The container entrypoint automatically detects the change and rebuilds the cache",
            "Only values referenced by `env()` outside config files are affected",
            "Nothing — environment variables always take precedence over the config cache",
          ],
          correctIndex: 0,
          explanation:
            "The config cache is a snapshot of evaluated config, not a lookup. Cache routes, views and events at build time, and run `config:cache` in the entrypoint once the environment exists.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-docker-q4",
          prompt: "Why run the queue worker in its own container instead of alongside PHP-FPM under supervisord?",
          options: [
            "One process per container lets the orchestrator restart, scale and monitor web and queue capacity independently, and a crashed worker becomes a restart rather than a silent stall",
            "PHP-FPM and `queue:work` cannot share a PHP installation",
            "Supervisord is incompatible with container signal handling",
            "It is the only way for the worker to reach Redis",
          ],
          correctIndex: 0,
          explanation:
            "Web traffic and background work scale on different curves and fail in different ways. Hiding both behind one supervisord process makes the platform blind to the difference.",
        },
        {
          id: "lv-deploy-docker-q5",
          prompt: "Which of these are wrong in a containerised Laravel deployment? (Select all that apply.)",
          options: [
            "`SESSION_DRIVER=file`, because the container filesystem is ephemeral and not shared between replicas",
            "Storing user uploads on the local `public` disk without a volume or object storage",
            "`COPY .env .` in the Dockerfile, which bakes secrets into an image layer",
            "`LOG_CHANNEL=stderr`, which sends logs to the container runtime",
            "Running `php artisan migrate --force` as a separate one-shot job rather than in the app container's entrypoint",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The last two are the recommended practices, not mistakes — logging to stderr is how containers are meant to log, and a one-shot migration job stops N replicas racing each other on start-up.",
        },
        {
          id: "lv-deploy-docker-q6",
          prompt: "Secrets are removed from the image in a later layer with `RUN rm .env`. Is the image safe to publish?",
          options: [
            "No — the earlier layer still contains the file, and anyone who pulls the image can read it from the layer history",
            "Yes, `rm` in a later layer removes the file from the image entirely",
            "Yes, provided the image is squashed to a single layer at push time",
            "No, but only if the registry is public; private registries strip deleted files",
          ],
          correctIndex: 0,
          explanation:
            "Layers are additive and immutable. A secret that entered any layer is in the image forever, which is what `.dockerignore` and runtime injection exist to prevent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-docker-q7",
          prompt: "What is the natural `HEALTHCHECK` for a Laravel container, and why?",
          options: [
            "A request to `/up`, because it returns 200 only if the framework booted — catching a broken config cache or a missing `APP_KEY`, not just a live TCP port",
            "`php -v`, which proves the runtime is present",
            "A `SELECT 1` against the database from the entrypoint",
            "A TCP connect to the exposed port, which is the only check the runtime understands",
          ],
          correctIndex: 0,
          explanation:
            "A process that is up but cannot boot the application is exactly the failure a port check misses. Keep the check shallow enough that a dependency blip does not restart every container at once.",
        },
        {
          id: "lv-deploy-docker-q8",
          prompt: "Why is a container deploy atomic without any symlink machinery?",
          options: [
            "Each image tag is a complete, immutable filesystem; the platform starts containers from the new image and retires the old ones, so nothing is ever half-replaced in place",
            "Docker writes the new layers to a temporary directory and renames it",
            "The container runtime pauses requests while the image is swapped",
            "It is not — containers need the same `current` symlink pattern inside the image",
          ],
          correctIndex: 0,
          explanation:
            "The image is the release artefact, so the problem atomic symlinks solve is solved by construction. Rollback is likewise just running the previous tag — with the same caveat about migrations.",
        },
        {
          id: "lv-deploy-docker-q9",
          prompt: "What does FrankenPHP change about the shape of a Laravel web container?",
          options: [
            "It is one process that both terminates HTTP and executes PHP, so a single container needs neither a second daemon nor a supervisor",
            "It removes the need for OPcache by precompiling the application at build time",
            "It requires Octane, so the application must be rewritten to be stateless",
            "It runs PHP in a sidecar container managed by the orchestrator",
          ],
          correctIndex: 0,
          explanation:
            "The nginx + PHP-FPM pairing forces you to choose between two containers sharing a socket or one container running two processes. FrankenPHP sidesteps the choice; Octane is an optional extra on top.",
        },
        {
          id: "lv-deploy-docker-q10",
          prompt: "Three replicas of the app container start at once and each entrypoint runs `php artisan migrate --force`. What is the failure, and what fixes it?",
          options: [
            "They race on the same schema change; run migrations as a separate one-shot job, or add `--isolated` so only one replica acquires the lock",
            "Nothing — the `migrations` table makes concurrent runs safe by design",
            "Only the first container starts and the others exit; use `restart: always` to retry them",
            "The migrations run three times, so every migration must be idempotent",
          ],
          correctIndex: 0,
          explanation:
            "Laravel records each migration only after it runs, so three simultaneous starts can all see the same pending list. `--isolated` needs a shared cache store; a one-shot job needs nothing and is easier to reason about.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "lv-deploy-managed-platforms",
      moduleId: "laravel-deploy",
      trackId: "php",
      title: "Forge, Vapor and Cloud: When Managed Wins",
      summary:
        "There are three first-party answers to \"where does this run\", and they sit at different points on the same axis. **Forge** provisions and configures a server you own on DigitalOcean, Hetzner, AWS or elsewhere: nginx, PHP-FPM, MySQL, Redis, certificates, the scheduler cron entry, Supervisor for the queue, and a deploy script you can open and edit. You still own the box, the patching and the capacity planning; you stop owning the fifty lines of nginx config and the Supervisor file. **Vapor** deploys to AWS Lambda — per-request scaling, no servers, and a different set of constraints: no persistent local filesystem, SQS-backed queues instead of long-running workers, cold starts, and a hard limit on deployment package size. You also inherit VPC, RDS and NAT costs. **Cloud** is Laravel's own managed platform: managed compute with hibernation, managed Postgres or MySQL, Redis, object storage and zero-downtime deploys, with nothing to SSH into. Envoyer's atomic-release deployments are now folded into Forge and Cloud rather than sold separately.\n\nThe honest way to decide is not \"a VPS is cheaper\", because per month it usually is. It is what an engineer's day costs and how much of it goes into parts of the stack that do not differentiate your product. A three-person team shipping a CRUD application should not be hand-rolling atomic symlink deploys and debugging Supervisor; a company with a platform team and a Kubernetes cluster should not be paying per application for a PaaS that duplicates it. Somewhere in between, the answer changes — and it changes again when the person who set up the server leaves.\n\nThe cost that people underestimate is migration, and it differs sharply between these options. Forge and Cloud run a stock Laravel application, so moving off them is a weekend of rebuilding infrastructure. Vapor's constraints reach into your code — filesystem access, session driver, job timeouts, response size — so an application written for Lambda is not automatically an application that runs anywhere else. Weigh that before the monthly bill.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Laravel: Deployment — Deploying With Laravel Cloud or Forge", url: "https://laravel.com/framework/docs/13.x/deployment#deploying-with-cloud-or-forge", kind: "docs" },
        { label: "Laravel Forge: Introduction", url: "https://laravel.com/forge/docs/introduction", kind: "docs" },
        { label: "Laravel Vapor: Introduction", url: "https://docs.vapor.build/introduction", kind: "docs" },
        { label: "Laravel Cloud", url: "https://laravel.com/cloud", kind: "article" },
      ],
      video: {
        title: "Laravel Cloud: The Complete Guide to Deploying and Scaling Your Apps",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=6zN4w6PMjcw",
        videoId: "6zN4w6PMjcw",
        durationLabel: "31:28",
      },
      alternateVideos: [
        {
          title: "Getting Started with Laravel Forge",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=AGYKgFc0DUQ",
          videoId: "AGYKgFc0DUQ",
          durationLabel: "4:19",
        },
        {
          title: "Laravel Cloud vs. Laravel Forge",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=I-WGiX-tQF8",
          videoId: "I-WGiX-tQF8",
          durationLabel: "2:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-deploy-managed-platforms-q1",
          prompt: "What does Laravel Forge actually do?",
          options: [
            "Provisions and configures a server on a provider you own an account with — nginx, PHP-FPM, databases, certificates, the scheduler cron and Supervisor — and runs a deploy script you control",
            "Hosts your application on Laravel's own infrastructure",
            "Runs your application on AWS Lambda without servers",
            "Builds container images from your repository and pushes them to a registry",
          ],
          correctIndex: 0,
          explanation:
            "Forge is server management, not hosting: the bill for the machine comes from DigitalOcean or AWS, and you keep root. That is also why you keep responsibility for patching and capacity.",
        },
        {
          id: "lv-deploy-managed-platforms-q2",
          prompt: "Which constraints come with deploying a Laravel application on Vapor (AWS Lambda)? (Select all that apply.)",
          options: [
            "No persistent local filesystem, so uploads and file-based sessions must move to S3 or another store",
            "Queues are backed by SQS rather than long-running `queue:work` processes",
            "Cold starts affect the first request to a newly provisioned instance",
            "Eloquent relationships have to be replaced with raw queries",
            "Blade cannot be used, because views must be prerendered",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The constraints are environmental, not about the framework's features. That is precisely why they reach into your code: where state lives and how long a process may run are architectural decisions.",
        },
        {
          id: "lv-deploy-managed-platforms-q3",
          prompt: "What is the strongest argument against \"a €12 VPS is cheaper than any managed platform\"?",
          options: [
            "The server bill is the small number; the engineering hours spent on provisioning, patching, deploy tooling and the 2 a.m. incident are the large one",
            "VPS providers oversubscribe, so the performance is never comparable",
            "Managed platforms are always cheaper once you include bandwidth",
            "Self-hosting cannot achieve zero-downtime deploys",
          ],
          correctIndex: 0,
          explanation:
            "Self-hosting can do everything a platform does — this whole camp is about how. The question is whether building and maintaining it is the best use of the team you have.",
        },
        {
          id: "lv-deploy-managed-platforms-q4",
          prompt: "Which is the clearest signal that a managed platform is *not* the right choice?",
          options: [
            "The organisation already runs a platform team and a container cluster that other services deploy to",
            "The team has fewer than five engineers",
            "The application uses queues and scheduled tasks",
            "Traffic is spiky and hard to predict",
          ],
          correctIndex: 0,
          explanation:
            "Paying per application for a platform that duplicates one you already operate is the waste. Small teams, background work and spiky traffic are all arguments *for* managed, not against.",
        },
        {
          id: "lv-deploy-managed-platforms-q5",
          prompt: "Why is the lock-in cost of Vapor higher than that of Forge or Cloud?",
          options: [
            "Vapor's constraints shape the application code — where files go, which session and queue drivers work, how long a request may run — so leaving is a rewrite rather than a re-host",
            "Vapor encrypts the source so it cannot be exported",
            "Vapor requires a proprietary fork of the framework",
            "Vapor contracts are multi-year while Forge and Cloud are monthly",
          ],
          correctIndex: 0,
          explanation:
            "Forge and Cloud run a stock Laravel application, so moving is an infrastructure project. An app written against Lambda's constraints has absorbed them, and unwinding that touches real code.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-managed-platforms-q6",
          prompt: "A team on Forge wants zero-downtime deploys. What is the current answer?",
          options: [
            "Atomic-release deployments are built into Forge (and Cloud); Envoyer's capability was folded in rather than remaining a separate product to buy",
            "Install Envoyer separately and point it at the Forge server",
            "Switch to Vapor, which is the only Laravel platform with zero-downtime deploys",
            "Write a custom deploy script, because managed platforms cannot do symlink releases",
          ],
          correctIndex: 0,
          explanation:
            "The mechanism is exactly the one covered in the zero-downtime topic — releases directories and a symlink flip. The value of the platform is that you do not maintain the script.",
        },
        {
          id: "lv-deploy-managed-platforms-q7",
          prompt: "What still belongs to you after Forge provisions a server?",
          options: [
            "Operating-system patching, capacity planning, backups you have verified, and the security of anything you install yourself",
            "Nothing operational — Forge manages the server end to end",
            "Only the application code; Forge owns every service on the box",
            "Only the database, which Forge does not touch",
          ],
          correctIndex: 0,
          explanation:
            "Forge sets services up correctly and keeps their configuration coherent. It does not absolve you of owning a Linux machine, which is the whole difference between it and Cloud.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-deploy-managed-platforms-q8",
          prompt: "Which fact should most influence the choice between running your own server and using a managed platform?",
          options: [
            "Whether anyone on the team will still be able to rebuild the server from scratch in two years, and how quickly",
            "Whether the application uses MySQL or PostgreSQL",
            "Whether the codebase has more than fifty routes",
            "Whether the team already uses GitHub Actions for tests",
          ],
          correctIndex: 0,
          explanation:
            "Hand-built infrastructure decays with the knowledge of whoever built it. If the setup is undocumented and unreproducible, the monthly saving is borrowed against an outage nobody can fix.",
        },
      ],
    },
  ],
} satisfies Module;
