import type { Module } from "@/types/curriculum";

export default {
  id: "laravel-foundations",
  trackId: "php",
  name: "Laravel Foundations",
  description:
    "The framework's core request path, from `public/index.php` to a rendered Blade view. Routing, controllers, validation, middleware, the service container, providers, facades and Blade — written for Laravel 13, where every Kernel file you remember has been replaced by `bootstrap/app.php`.",
  refs: [
    { label: "Laravel 13: Request Lifecycle", url: "https://laravel.com/framework/docs/13.x/lifecycle", kind: "docs" },
    { label: "Laravel 13: Release Notes", url: "https://laravel.com/framework/docs/13.x/releases", kind: "docs" },
    { label: "Laravel API Reference (13.x)", url: "https://api.laravel.com/docs/13.x/index.html", kind: "docs" },
    { label: "laravel/framework on GitHub", url: "https://github.com/laravel/framework", kind: "repo" },
  ],
  topics: [
    {
      id: "lv-request-lifecycle",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Laravel's Shape and the Request Lifecycle",
      summary:
        "Laravel is easiest to hold in your head as a single function: a request goes in one end, a response comes out the other, and everything in between is a bootstrapper, a service provider, a middleware or a route handler. `public/index.php` is the only PHP file a web server ever points at. It loads Composer's autoloader, asks `bootstrap/app.php` for a configured `Application` instance — which *is* the service container — and calls `handleRequest()` on it.\n\nThe request is handed to `Illuminate\\Foundation\\Http\\Kernel`, which runs a fixed list of bootstrappers first: load the environment, load configuration, configure error handling and logging, register facades, then register and boot every service provider. Providers matter more than anything else here, because Laravel instantiates them all, calls `register()` on every one, and only then calls `boot()` on every one. That ordering is the entire reason `register()` must do nothing but bind into the container — anything you resolve there may not exist yet.\n\nOnly after bootstrapping does the router see the request. It runs global middleware, matches a route, runs that route's middleware, invokes the handler, and then lets the response travel back out through the same middleware in reverse before `send()` writes it to the client.\n\nSince Laravel 11 there is no `app/Http/Kernel.php`, `app/Console/Kernel.php` or `app/Exceptions/Handler.php`. All three are framework classes now, configured from `bootstrap/app.php` via `->withMiddleware()`, `->withRouting()` and `->withExceptions()`. The skeleton is much smaller; the cost is that the code you used to read to answer \"what actually runs here?\" lives in `vendor/`, so any tutorial telling you to edit a Kernel file is describing a release that reached end of life in March 2026.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel 13: Request Lifecycle", url: "https://laravel.com/framework/docs/13.x/lifecycle", kind: "docs" },
        { label: "Laravel 13: Service Providers", url: "https://laravel.com/framework/docs/13.x/providers", kind: "docs" },
        {
          label: "laravel/framework: Foundation/Http/Kernel.php",
          url: "https://github.com/laravel/framework/blob/13.x/src/Illuminate/Foundation/Http/Kernel.php",
          kind: "repo",
        },
      ],
      video: {
        title: "Understanding Laravel Architecture | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=W0KFGXx1HG8",
        videoId: "W0KFGXx1HG8",
        durationLabel: "12:44",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-request-lifecycle-q1",
          prompt: "Which file does a correctly configured web server point every incoming request at?",
          options: ["`public/index.php`", "`bootstrap/app.php`", "`routes/web.php`", "`artisan`"],
          correctIndex: 0,
          explanation:
            "`public/index.php` is the single front controller; it loads the autoloader and then asks `bootstrap/app.php` for an application instance. Pointing the document root anywhere above `public/` would expose `.env` and `vendor/` to the web.",
        },
        {
          id: "lv-request-lifecycle-q2",
          prompt:
            "In Laravel 13, where do you register global middleware, route files and exception handling?",
          options: [
            "In `bootstrap/app.php`, via `->withMiddleware()`, `->withRouting()` and `->withExceptions()`",
            "In `app/Http/Kernel.php` and `app/Exceptions/Handler.php`",
            "In `config/app.php`, under the `middleware` and `routing` keys",
            "In `app/Providers/RouteServiceProvider.php`",
          ],
          correctIndex: 0,
          explanation:
            "Laravel 11 removed the application-level Kernel and Handler classes; everything is configured fluently in `bootstrap/app.php`. Advice that tells you to edit `app/Http/Kernel.php` predates that change — the file simply does not exist in a fresh app.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-request-lifecycle-q3",
          prompt: "What is the relationship between `register()` and `boot()` across all service providers?",
          options: [
            "Every provider's `register()` runs before any provider's `boot()`",
            "Each provider's `register()` is immediately followed by its own `boot()`",
            "`boot()` runs first so that bindings can depend on booted services",
            "`boot()` only runs for providers that are not deferred; `register()` runs for all of them",
          ],
          correctIndex: 0,
          explanation:
            "Laravel instantiates every provider, calls `register()` on all of them, and only then calls `boot()` on all of them. That is why `boot()` can safely depend on any binding, and why resolving a service inside `register()` is a bug waiting to happen.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-request-lifecycle-q4",
          prompt:
            "Which of these have already happened by the time your controller method body starts executing? (Select all that apply.)",
          options: [
            "The HTTP kernel's bootstrappers have loaded configuration and detected the environment",
            "Every service provider has been registered and booted",
            "Global middleware and the matched route's middleware have run",
            "The response has been written to the client by `send()`",
            "Any terminable middleware's `terminate()` method has run",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Bootstrapping, provider registration/booting and the middleware pipeline all precede the handler. Sending the response and running `terminate()` happen after the handler returns — which is exactly why `terminate()` is the place for work you don't want the user waiting on.",
        },
        {
          id: "lv-request-lifecycle-q5",
          prompt: "What is the signature of the HTTP kernel's `handle` method, conceptually?",
          options: [
            "It receives a `Request` and returns a `Response`",
            "It receives a `Request` and returns `void`, echoing output directly",
            "It receives a route name and returns a view",
            "It receives a `Request` and returns an array that Laravel serialises",
          ],
          correctIndex: 0,
          explanation:
            "Request in, response out — the kernel is effectively one big function wrapping your whole application. That shape is what makes HTTP tests possible without a web server at all.",
        },
        {
          id: "lv-request-lifecycle-q6",
          prompt: "Where are your application's own and third-party service providers listed in Laravel 13?",
          options: [
            "`bootstrap/providers.php`",
            "The `providers` array in `config/app.php`",
            "The `autoload.providers` section of `composer.json`",
            "`app/Providers/AppServiceProvider.php`, which imports the rest",
          ],
          correctIndex: 0,
          explanation:
            "Since Laravel 11 the provider list moved out of `config/app.php` into `bootstrap/providers.php`, and `make:provider` appends to it automatically. Packages usually never appear there at all, because auto-discovery loads them from their own `composer.json`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-request-lifecycle-q7",
          prompt: "After your controller returns a response, what happens to it next?",
          options: [
            "It travels back out through the route's middleware in reverse order before being sent",
            "It is sent to the browser immediately, bypassing middleware on the way out",
            "It is passed to the exception handler for final formatting",
            "It is re-dispatched through the router so `Route::current()` stays accurate",
          ],
          correctIndex: 0,
          explanation:
            "Middleware wrap the handler, so anything after `$next($request)` in a middleware runs on the way out. That is how cookie queuing, session saving and cache headers get attached without the controller knowing about them.",
        },
        {
          id: "lv-request-lifecycle-q8",
          prompt: "What object does `bootstrap/app.php` return, and what else is it?",
          options: [
            "An `Illuminate\\Foundation\\Application` instance, which is also the service container",
            "A configuration array that the kernel turns into an application",
            "A router instance with all route files already loaded",
            "A PSR-11 container that Laravel wraps in an application object later",
          ],
          correctIndex: 0,
          explanation:
            "`Application` extends the container, so \"the app\" and \"the container\" are the same object — which is why `app()` and `$this->app` are interchangeable. It does implement PSR-11, but it is the application itself, not something wrapped later.",
        },
        {
          id: "lv-request-lifecycle-q9",
          prompt:
            "Why does the documentation insist you never register routes or event listeners inside a provider's `register()` method?",
          options: [
            "Because other providers may not be registered yet, so the services you rely on may not be bound",
            "Because `register()` is only called in production, while `boot()` is called in every environment",
            "Because routes registered in `register()` cannot be cached",
            "Because `register()` runs before the container exists",
          ],
          correctIndex: 0,
          explanation:
            "`register()` runs while the binding list is still being assembled, so resolving anything there can pull in a half-configured service. The container exists from the first line of `bootstrap/app.php`; the problem is ordering, not availability.",
        },
        {
          id: "lv-request-lifecycle-q10",
          prompt:
            "You run `php artisan tinker` or a queue worker instead of serving HTTP. What is different about the bootstrap?",
          options: [
            "The same providers are registered and booted, but the console kernel handles the input instead of the HTTP kernel",
            "Service providers are skipped entirely; only the container is built",
            "Only providers listed in `bootstrap/providers.php` boot; framework providers are HTTP-only",
            "Configuration is read directly from `.env` without building the config repository",
          ],
          correctIndex: 0,
          explanation:
            "`artisan` builds the same application from `bootstrap/app.php` and calls `handleCommand()` instead of `handleRequest()`. Everything that a provider's `boot()` does therefore also happens in CLI — a common source of surprise when boot logic assumes an HTTP request exists.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-project-structure",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Project Structure, Artisan and Tinker",
      summary:
        "A fresh Laravel 13 skeleton is deliberately small: `app/` contains only `Http`, `Models` and `Providers`, and directories like `Console`, `Events`, `Jobs`, `Policies` and `Rules` appear the first time a `make:` command needs them. That is a design statement — the framework refuses to pre-create structure you have not earned yet, and it means the shape of an unfamiliar codebase tells you honestly which features it actually uses.\n\nThe `routes` directory ships with `web.php` and `console.php` only. `routes/api.php` does not exist until you run `php artisan install:api` (which also installs Sanctum), and `channels.php` arrives with `install:broadcasting`. Everything generated at runtime lives under `storage/` — compiled Blade views, file cache, file sessions and logs — plus `bootstrap/cache/` for the config, route, services and package manifests. Both are writable directories that must exist on a server and must never be in version control.\n\nArtisan is the framework's own CLI, and it is worth knowing beyond `make:`: `php artisan list`, `php artisan help <command>`, `route:list` for inspecting the routing table, `about` for a configuration overview, and `optimize` / `optimize:clear` as the deploy-time cache pair. `php artisan dev` starts the server, queue worker, log tail and Vite in one window.\n\nTinker is a PsySH REPL that boots the *whole* application, so it is the fastest way to answer \"what does this actually return?\" without writing a test. The gotcha worth memorising: inside Tinker the `dispatch()` helper relies on garbage collection to push a job, so use `Bus::dispatch` or `Queue::push` instead — otherwise your job quietly never gets queued.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Laravel 13: Directory Structure", url: "https://laravel.com/framework/docs/13.x/structure", kind: "docs" },
        { label: "Laravel 13: Artisan Console", url: "https://laravel.com/framework/docs/13.x/artisan", kind: "docs" },
        { label: "laravel/tinker on GitHub", url: "https://github.com/laravel/tinker", kind: "repo" },
      ],
      video: {
        title: "Understanding Laravel’s Directory Structure | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=KzyMmRVRInM",
        videoId: "KzyMmRVRInM",
        durationLabel: "7:03",
      },
      alternateVideos: [
        {
          title: "Getting Started with Artisan Commands in Laravel | Learn Laravel The Right Way",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=gw7O8P0J1jE",
          videoId: "gw7O8P0J1jE",
          durationLabel: "7:17",
        },
        {
          title: "Getting Started with Laravel Tinker | Learn Laravel The Right Way",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=sZysCyzl9Vk",
          videoId: "sZysCyzl9Vk",
          durationLabel: "12:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-project-structure-q1",
          prompt: "Which directories exist inside `app/` in a brand-new Laravel 13 application? (Select all that apply.)",
          options: ["`Http`", "`Models`", "`Providers`", "`Console`", "`Exceptions`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Only `Http`, `Models` and `Providers` ship by default. `app/Console` appears the first time you run `make:command`, and `app/Exceptions` the first time you run `make:exception` — the skeleton grows with the `make:` commands you actually use.",
        },
        {
          id: "lv-project-structure-q2",
          prompt: "Which route files ship with a fresh Laravel 13 install?",
          options: [
            "`web.php` and `console.php` only",
            "`web.php`, `api.php` and `console.php`",
            "`web.php`, `api.php`, `console.php` and `channels.php`",
            "`web.php` only",
          ],
          correctIndex: 0,
          explanation:
            "`routes/api.php` is created by `php artisan install:api` (which also pulls in Sanctum) and `channels.php` by `install:broadcasting`. Expecting `api.php` to be there is one of the most common first-hour surprises since Laravel 11.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-project-structure-q3",
          prompt: "Besides creating `routes/api.php`, what else does `php artisan install:api` do?",
          options: [
            "Installs Laravel Sanctum and applies an automatic `/api` URI prefix to those routes",
            "Installs Passport and registers an OAuth2 authorisation server",
            "Publishes `config/cors.php` and enables the `HandleCors` middleware",
            "Adds a `throttle:api` middleware to the `api` group",
          ],
          correctIndex: 0,
          explanation:
            "The command scaffolds token auth with Sanctum and the `/api` prefix is applied by the router, not written into each route. CORS is already handled globally by `HandleCors`, and there is no throttle in the default `api` group.",
        },
        {
          id: "lv-project-structure-q4",
          prompt: "Where does Laravel keep compiled Blade templates?",
          options: [
            "`storage/framework/views`",
            "`bootstrap/cache/views`",
            "`resources/views/compiled`",
            "`public/build/views`",
          ],
          correctIndex: 0,
          explanation:
            "Blade compiles each template to plain PHP under `storage/framework/views` and recompiles when the source file is newer. `bootstrap/cache` holds the config, route, services and package manifests instead.",
        },
        {
          id: "lv-project-structure-q5",
          prompt: "What is `public/storage` in a typical Laravel deployment?",
          options: [
            "A symbolic link to `storage/app/public`, created by `php artisan storage:link`",
            "A copy of `storage/app` made during `npm run build`",
            "The directory Laravel writes logs to when `APP_DEBUG` is true",
            "A real directory that the `Storage` facade writes to directly",
          ],
          correctIndex: 0,
          explanation:
            "User uploads live under `storage/app/public`, outside the document root, and `storage:link` exposes them. Forgetting to run it after a deploy is the classic \"images 404 in production but work locally\" bug.",
        },
        {
          id: "lv-project-structure-q6",
          prompt: "What is `php artisan tinker`?",
          options: [
            "A PsySH-powered REPL that boots your full application so you can call models, jobs and services interactively",
            "A database browser that connects using your `config/database.php` credentials",
            "A code generator that scaffolds classes from an interactive prompt",
            "A profiler that records queries and timings for the last request",
          ],
          correctIndex: 0,
          explanation:
            "Tinker boots the whole application — container, providers, config and all — inside a REPL. That is why an Eloquent query or a container binding behaves there exactly as it does in a request.",
        },
        {
          id: "lv-project-structure-q7",
          prompt:
            "Inside Tinker you run `dispatch(new SendInvoice($order));` against a Redis queue and nothing ever appears on the queue. Why?",
          options: [
            "The `dispatch` helper relies on garbage collection to push the job, which Tinker's REPL defeats; use `Bus::dispatch` or `Queue::push`",
            "Tinker always forces the `sync` driver regardless of `QUEUE_CONNECTION`",
            "Jobs must be dispatched from an HTTP request so that a session exists",
            "Tinker's command allow list blocks anything that touches the queue",
          ],
          correctIndex: 0,
          explanation:
            "`dispatch()` and `Dispatchable::dispatch` push the job when the pending-dispatch object is destructed, and Tinker keeps the last expression alive. The docs call this out explicitly and recommend `Bus::dispatch` or `Queue::push` in the REPL.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-project-structure-q8",
          prompt: "Which Artisan command shows every registered route with its method, URI, name and action?",
          options: ["`php artisan route:list`", "`php artisan about --only=routing`", "`php artisan list route`", "`php artisan route:show`"],
          correctIndex: 0,
          explanation:
            "`route:list` prints the resolved routing table, which is the fastest way to confirm what a `Route::resource` or a group prefix actually produced. `php artisan list` only lists commands.",
        },
        {
          id: "lv-project-structure-q9",
          prompt: "Which statements about Artisan commands are true? (Select all that apply.)",
          options: [
            "Commands in `app/Console/Commands` are registered automatically",
            "`php artisan help migrate` prints a command's arguments and options",
            "Commands are resolved through the service container, so constructor dependencies are injected",
            "A command must be listed in `bootstrap/providers.php` before Artisan can see it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Laravel scans `app/Console/Commands` automatically, and `withCommands()` in `bootstrap/app.php` adds extra directories or classes. `bootstrap/providers.php` is for service providers, not commands.",
        },
        {
          id: "lv-project-structure-q10",
          prompt: "What does `php artisan dev` start?",
          options: [
            "The PHP development server, a queue worker, log tailing via Pail and Vite, all in one terminal",
            "A production-grade server with opcache and config caching enabled",
            "A watcher that reruns your test suite whenever a file changes",
            "A Docker Compose stack equivalent to Laravel Sail",
          ],
          correctIndex: 0,
          explanation:
            "`dev` multiplexes `serve`, `queue:listen`, `pail` and `npm run dev` into one tabbed window and restarts a process if it crashes. Sail is the Docker option; `dev` is plain local PHP.",
        },
      ],
    },

    {
      id: "lv-configuration",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Configuration, `.env` and Config Caching",
      summary:
        "Laravel separates *environment* from *configuration* on purpose. `.env` holds machine-specific secrets and is never committed; `config/*.php` holds the application's shape and is committed. The contract between them is one-directional: config files call `env()`, application code calls `config()`. Break that rule and you will ship a bug that only appears in production.\n\nThat bug is config caching. `php artisan config:cache` flattens every config file into one PHP array in `bootstrap/cache`, and from that moment Laravel stops loading `.env` at all. Any `env('STRIPE_KEY')` left in a controller, a service or a Blade template silently returns `null` — unless the key also happens to be a real system environment variable. It works perfectly on your laptop, where nobody runs `config:cache`, and fails the moment you deploy. `config:clear` undoes it.\n\nDotEnv parses everything as strings, with a small set of reserved words: `true`, `false`, `null` and `empty` (with or without parentheses) are converted to real types, and values containing spaces need double quotes. External, server-level environment variables override `.env`, which is how platforms inject secrets without a file at all. `APP_ENV` chooses the environment, and if `.env.staging` exists it is loaded instead of `.env` when `APP_ENV=staging`.\n\nFor reading, `config('app.timezone', 'UTC')` uses dot notation with a default, and `Config::set()` changes a value *for the current process only* — nothing is written back to disk. Laravel 13 also offers typed accessors (`Config::string()`, `Config::integer()`, `Config::boolean()`, `Config::array()`, `Config::collection()`) that throw when the value is the wrong type, which is worth using anywhere a misconfigured value would otherwise fail deep inside a driver.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel 13: Configuration", url: "https://laravel.com/framework/docs/13.x/configuration", kind: "docs" },
        { label: "Laravel 13: Deployment", url: "https://laravel.com/framework/docs/13.x/deployment", kind: "docs" },
        { label: "The Twelve-Factor App: Config", url: "https://12factor.net/config", kind: "article" },
        { label: "vlucas/phpdotenv on GitHub", url: "https://github.com/vlucas/phpdotenv", kind: "repo" },
      ],
      video: {
        title: "Working with Laravel Config Files | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=Ts5fLYgEM8E",
        videoId: "Ts5fLYgEM8E",
        durationLabel: "23:53",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-configuration-q1",
          prompt:
            "A deploy script runs `php artisan config:cache`. A service class contains `env('MAILGUN_SECRET')` and `MAILGUN_SECRET` is set in `.env` but not exported as a system variable. What does the call return in production?",
          options: [
            "`null`, because the cached config means `.env` is never loaded",
            "The value from `.env`, which is baked into the cached config file",
            "The value from `.env`, because DotEnv still runs before the cache is read",
            "It throws a `RuntimeException` about an undefined environment variable",
          ],
          correctIndex: 0,
          explanation:
            "Once configuration is cached, Laravel does not load `.env` during requests or Artisan commands, so `env()` only sees real system environment variables. This is why `env()` belongs exclusively in `config/` files and `config()` everywhere else.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-configuration-q2",
          prompt: "Your `.env` contains `APP_DEBUG=false`. What does `env('APP_DEBUG')` return?",
          options: [
            "The boolean `false`",
            "The string `\"false\"`",
            "`null`, because `false` is treated as an empty value",
            "The integer `0`",
          ],
          correctIndex: 0,
          explanation:
            "DotEnv values are strings, but `true`, `false`, `null` and `empty` (optionally in parentheses) are converted to real types by `env()`. Everything else — including `\"0\"` and `\"off\"` — stays a string, which is why `config/app.php` still casts with `(bool)`.",
        },
        {
          id: "lv-configuration-q3",
          prompt:
            "You call `config(['services.stripe.key' => 'sk_test_x']);` in a request. What happens?",
          options: [
            "The value changes in memory for that process only; `config/services.php` is untouched",
            "`config/services.php` is rewritten on disk with the new value",
            "The change persists until the next `config:clear`",
            "It throws, because the config repository is read-only after booting",
          ],
          correctIndex: 0,
          explanation:
            "`Config::set` / `config([...])` mutate the in-memory repository for the current request, job or command. Nothing is written back, which makes it safe and useful in tests but useless as a way to persist settings.",
        },
        {
          id: "lv-configuration-q4",
          prompt: "Which statements about reading configuration in Laravel 13 are true? (Select all that apply.)",
          options: [
            "`config('mail.default', 'smtp')` returns the default when the key is absent",
            "`Config::integer('app.retries')` throws if the stored value is not an integer",
            "`php artisan config:show database` prints the resolved values of one config file",
            "`config()` reads directly from `.env`, so a `.env` edit takes effect immediately in production",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Dot notation with a default, typed accessors that throw on a mismatch, and `config:show` are all real. `config()` reads the config repository, which is built from `config/*.php` — `.env` only reaches it through `env()` calls inside those files.",
        },
        {
          id: "lv-configuration-q5",
          prompt: "Why does the documentation warn against running `config:cache` during local development?",
          options: [
            "Because configuration changes stop taking effect until you clear the cache, which is confusing while you are iterating",
            "Because the cached file is written to `storage/` and will be committed by accident",
            "Because it disables `APP_DEBUG` regardless of your `.env`",
            "Because it prevents Vite's hot module replacement from connecting",
          ],
          correctIndex: 0,
          explanation:
            "Caching freezes the config and stops `.env` loading, so every tweak needs a `config:clear`. It is a deploy-step optimisation, not a development one.",
        },
        {
          id: "lv-configuration-q6",
          prompt: "How do you define an environment value that contains spaces?",
          options: [
            "Wrap it in double quotes: `APP_NAME=\"My Application\"`",
            "Escape each space with a backslash",
            "Use single quotes, which DotEnv treats as literal",
            "Replace spaces with `%20`, which Laravel decodes on load",
          ],
          correctIndex: 0,
          explanation:
            "Double quotes are the documented way to include spaces in a `.env` value. Unquoted values are read up to whitespace, which is how `APP_NAME=My Application` silently becomes `My`.",
        },
        {
          id: "lv-configuration-q7",
          prompt:
            "A container platform sets `APP_ENV=production` as a real environment variable, while the image also contains a `.env` with `APP_ENV=local`. Which wins, and why?",
          options: [
            "`production`, because external, server-level environment variables override values from `.env`",
            "`local`, because Laravel loads `.env` last and it takes precedence",
            "Neither; the conflict raises an exception at boot",
            "It depends on whether `config:cache` has been run",
          ],
          correctIndex: 0,
          explanation:
            "DotEnv does not overwrite variables that already exist in the environment, so platform-injected values win. Laravel also checks `APP_ENV` before loading, and will prefer `.env.production` if that file exists.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-configuration-q8",
          prompt: "What does `php artisan env:encrypt` produce, and where does the key live when decrypting?",
          options: [
            "An `.env.encrypted` file safe to commit; `env:decrypt` reads the key from `LARAVEL_ENV_ENCRYPTION_KEY` or `--key`",
            "An encrypted `.env` in place; the key is stored in `bootstrap/cache`",
            "A GPG-signed `.env.asc`; the key comes from the system keyring",
            "An `.env.encrypted` file; the key is derived from `APP_KEY` automatically",
          ],
          correctIndex: 0,
          explanation:
            "The command writes `.env.encrypted` (AES-256-CBC by default) and prints a key you store in a password manager. `--readable` keeps variable names visible so diffs are reviewable while values stay encrypted.",
        },
        {
          id: "lv-configuration-q9",
          prompt: "Which command gives a one-screen overview of the application's environment, drivers and cache state?",
          options: ["`php artisan about`", "`php artisan env`", "`php artisan config:show`", "`php artisan optimize --dry-run`"],
          correctIndex: 0,
          explanation:
            "`about` (optionally filtered with `--only=environment`) summarises versions, drivers and which caches are warm. `config:show` needs a file name and dumps that file's values instead.",
        },
        {
          id: "lv-configuration-q10",
          prompt: "Why does Laravel ship `.env.example` alongside the ignored `.env`?",
          options: [
            "It documents which variables an app needs, with placeholder values, so teammates and CI know what to set",
            "It is the file Laravel falls back to when `.env` is missing at runtime",
            "It is copied over `.env` on every `composer install`",
            "It is the template `config:cache` reads when building the cached config",
          ],
          correctIndex: 0,
          explanation:
            "`.env.example` is committed purely as documentation; the installer copies it to `.env` once, at install time. Nothing reads it at runtime, so a variable present only there will be missing in production.",
        },
      ],
    },

    {
      id: "lv-routing",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Routing and Route Parameters",
      summary:
        "Laravel's router is a compiled list, not a filesystem convention: every route is an explicit registration in `routes/web.php` (or another file wired up in `bootstrap/app.php`), matched in declaration order. That explicitness is the tradeoff against file-based routers like Next.js — more typing, but `php artisan route:list` can always tell you the truth about what the application exposes, and a route's middleware, name and constraints all live in one readable line.\n\nThe detail that trips people up is how parameters reach your handler. They are injected **by position, not by name**: given `/posts/{post}/comments/{comment}`, the first closure argument gets the post segment whatever you called it. Container dependencies must therefore be listed *before* route parameters, which is why every controller signature in the docs reads `(Request $request, string $id)`. Optional parameters (`{name?}`) need a default value on the PHP side, and constraints (`->where()`, `->whereNumber()`, `->whereUuid()`, `->whereIn()`) turn a non-matching URI into a plain 404 rather than an exception deeper in your code.\n\nA few sharp edges are worth carrying. A parameter never matches `/` unless you explicitly allow it with `->where('path', '.*')`, and then only in the final segment. Routes registered with `get`/`post`/etc. should come before `any`, `match` and `redirect` routes on the same URI, because first match wins. Extra keys passed to `route('profile', ['id' => 1, 'tab' => 'billing'])` that do not correspond to a parameter become query-string arguments. And the old rule that closure routes break `route:cache` no longer holds — modern Laravel serialises them, so caching routes on deploy is unconditionally worth it.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel 13: Routing", url: "https://laravel.com/framework/docs/13.x/routing", kind: "docs" },
        { label: "Laravel 13: URL Generation", url: "https://laravel.com/framework/docs/13.x/urls", kind: "docs" },
        { label: "Laravel 13: CSRF Protection", url: "https://laravel.com/framework/docs/13.x/csrf", kind: "docs" },
      ],
      video: {
        title: "The Basics of Routing in Laravel | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=pP4g0xPq0TQ",
        videoId: "pP4g0xPq0TQ",
        durationLabel: "11:39",
      },
      alternateVideos: [
        {
          title: "Working with Route Parameters in Laravel | Learn Laravel The Right Way",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=DgQEDXBcyZw",
          videoId: "DgQEDXBcyZw",
          durationLabel: "25:23",
        },
        {
          title: "Laravel 12 in 11 hours - Laravel for Beginners Full Course",
          channel: "The Codeholic",
          url: "https://www.youtube.com/watch?v=0M84Nk7iWkA",
          videoId: "0M84Nk7iWkA",
          startSeconds: 2942,
          chapterLabel: "Routing",
          durationLabel: "10:54:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-routing-q1",
          prompt:
            "What does a request to `/posts/7/comments/9` print?\n\n```php\nRoute::get('/posts/{post}/comments/{comment}', function (string $comment, string $post) {\n    return $comment.'|'.$post;\n});\n```",
          options: ["`7|9`", "`9|7`", "A `BindingResolutionException`", "A 404, because the argument names don't match"],
          correctIndex: 0,
          explanation:
            "Route parameters are injected by position, not by name, so the first argument receives the `{post}` segment regardless of what it is called. Swapping the names only misleads the reader — it does not swap the values.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-routing-q2",
          prompt:
            "Which controller signature works for `Route::put('/user/{id}', [UserController::class, 'update']);`?",
          options: [
            "`update(Request $request, string $id)`",
            "`update(string $id, Request $request)`",
            "`update(string $id)` only — the request cannot be injected on a route with parameters",
            "`update(Request $request)` and read `$id` from `$request->id`",
          ],
          correctIndex: 0,
          explanation:
            "Container-resolved dependencies must be listed before route parameters, because the parameters fill the remaining positions in order. Putting `$id` first means the container tries to resolve it as a dependency.",
        },
        {
          id: "lv-routing-q3",
          prompt:
            "What is wrong with this route?\n\n```php\nRoute::get('/user/{name?}', function (string $name) {\n    return $name;\n});\n```",
          options: [
            "An optional parameter requires a default value on the PHP argument, e.g. `?string $name = null`",
            "Optional parameters must be declared with `{name|optional}`",
            "Nothing — Laravel passes an empty string when the segment is absent",
            "Optional parameters are only allowed inside route groups",
          ],
          correctIndex: 0,
          explanation:
            "Laravel simply does not pass an argument when the segment is missing, so PHP raises an `ArgumentCountError` unless the parameter has a default. The `?` in the URI and the default in PHP always come as a pair.",
        },
        {
          id: "lv-routing-q4",
          prompt: "A request hits `/user/abc` on a route constrained with `->where('id', '[0-9]+')`. What does the client get?",
          options: [
            "A 404, because a route whose constraints fail is simply not matched",
            "A 422 validation error listing the failed constraint",
            "A 500, because the regular expression did not match",
            "The route runs and `$id` is `null`",
          ],
          correctIndex: 0,
          explanation:
            "Constraints are part of matching, not validation: an unmatched route falls through to the next candidate and ultimately to the 404 handler. That makes `where` a cheap way to keep malformed input out of your code entirely.",
        },
        {
          id: "lv-routing-q5",
          prompt: "Which of these are real route-constraint helpers in Laravel 13? (Select all that apply.)",
          options: ["`whereNumber`", "`whereUuid`", "`whereIn`", "`whereEmail`", "`whereBetween`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`whereNumber`, `whereAlpha`, `whereAlphaNumeric`, `whereUuid`, `whereUlid` and `whereIn` (which also accepts `Enum::cases()`) exist. `whereEmail` and `whereBetween` do not — an email belongs in validation, not in URI matching.",
        },
        {
          id: "lv-routing-q6",
          prompt:
            "You want `/search/{query}` to accept `/search/laravel/routing` as a single parameter containing a slash. What is required?",
          options: [
            "Add `->where('query', '.*')`, and the parameter must be the last segment of the URI",
            "Nothing — Laravel decodes `%2F` into the parameter automatically",
            "Register the route with `Route::any` instead of `Route::get`",
            "Add `->whereAlphaNumeric('query')` so slashes are treated as part of the value",
          ],
          correctIndex: 0,
          explanation:
            "Route parameters match anything except `/` by default; `.*` opts in, and only the final segment may contain encoded forward slashes. Everything else silently turns into a 404.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-routing-q7",
          prompt:
            "Two routes share the URI `/reports`: one registered with `Route::any` and one with `Route::get`. What does the documentation recommend?",
          options: [
            "Define the `get` route before the `any` route, because the first matching route wins",
            "Define the `any` route first so it can delegate to the more specific one",
            "Order does not matter; Laravel prefers the most specific verb",
            "Merge them with `Route::match(['get', 'any'], ...)`",
          ],
          correctIndex: 0,
          explanation:
            "Routes are matched in registration order, so a broad `any`/`match`/`redirect` route defined first will swallow requests intended for a specific verb route. There is no specificity scoring.",
        },
        {
          id: "lv-routing-q8",
          prompt:
            "Given `Route::get('/user/{id}/profile', ...)->name('profile');`, what does `route('profile', ['id' => 1, 'photos' => 'yes'])` generate?",
          options: [
            "`http://example.com/user/1/profile?photos=yes`",
            "`http://example.com/user/1/profile/yes`",
            "`http://example.com/user/1/profile` — unknown keys are dropped",
            "It throws, because `photos` is not a declared parameter",
          ],
          correctIndex: 0,
          explanation:
            "Keys that match a parameter fill the URI; everything else is appended as a query string. That behaviour is what makes `route()` convenient for building filtered links.",
        },
        {
          id: "lv-routing-q9",
          prompt: "What does `Route::pattern('id', '[0-9]+')` in `AppServiceProvider::boot()` do?",
          options: [
            "Applies that constraint to every route parameter named `id` across the application",
            "Renames all `{id}` parameters to a numeric alias",
            "Registers a global validation rule used by `$request->validate()`",
            "Constrains only routes defined after the call, in the same file",
          ],
          correctIndex: 0,
          explanation:
            "Global patterns are keyed by parameter name and apply everywhere, which is a good way to guarantee that `{id}` is never a slug anywhere. It has nothing to do with request validation.",
        },
        {
          id: "lv-routing-q10",
          prompt:
            "Your `routes/web.php` mixes controller routes and a few closure routes. What happens when you run `php artisan route:cache` on Laravel 13?",
          options: [
            "It succeeds — closures are serialised, so closure routes cache fine",
            "It fails with \"Unable to prepare route for serialization. Uses Closure.\"",
            "It succeeds but silently drops the closure routes from the cache",
            "It succeeds only if every closure is declared `static`",
          ],
          correctIndex: 0,
          explanation:
            "Modern Laravel serialises route closures with `SerializableClosure`, so the long-standing \"never cache routes if you use closures\" rule is stale advice from the Laravel 5–7 era. Caching routes on deploy is now unconditionally worthwhile.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-routing-q11",
          prompt: "What is `Route::fallback()` for, and what should you know about it?",
          options: [
            "It handles requests that match no other route, and defined in `web.php` it inherits the `web` middleware group",
            "It replaces the framework's exception handler for all 4xx and 5xx responses",
            "It runs before every route as a catch-all filter",
            "It must be registered first so Laravel knows where to send unmatched requests",
          ],
          correctIndex: 0,
          explanation:
            "`fallback` is matched last no matter where you write it, and because it usually lives in `web.php` it picks up sessions and CSRF from the `web` group. It only covers unmatched routes — thrown exceptions still go to the exception handler.",
        },
      ],
    },

    {
      id: "lv-route-groups-binding",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Route Groups, Naming and Model Binding",
      summary:
        "Route groups exist so that shared concerns — a middleware stack, a URI prefix, a name prefix, a subdomain, a controller — are declared once. The merge rules are specific and worth memorising: nested groups **merge** middleware and `where` constraints, but **append** names and URI prefixes. That is why `Route::name('admin.')` needs its trailing dot and `Route::prefix('admin')` does not need its slash.\n\nNamed routes are the real payoff. Once a route has a name, `route('orders.show', $order)` is the only place the URL shape is written down, so changing `/orders/{order}` to `/o/{order}` is a one-line change rather than a grep. Names should be unique; a duplicate silently wins or loses depending on registration order.\n\nRoute model binding is where Laravel's conventions earn the most and surprise the most. Type-hint `App\\Models\\User $user` on a route with a `{user}` segment and the `SubstituteBindings` middleware resolves the model before your handler runs, returning a 404 if it does not exist. Swap the lookup column with `{post:slug}`, or mark the model with `#[RouteKey('slug')]` to make it the default everywhere. Soft-deleted models are excluded unless you add `->withTrashed()`.\n\nThe subtle part is scoping. When a nested parameter uses a custom key — `/users/{user}/posts/{post:slug}` — Laravel automatically scopes the child query to the parent's guessed relationship (`posts`), so a slug belonging to another user 404s instead of leaking. Without a custom key there is no scoping unless you ask for it with `->scopeBindings()`, and `->withoutScopedBindings()` turns it off. Getting this wrong is a genuine IDOR-shaped bug, not just an inconvenience.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        {
          label: "Laravel 13: Route Model Binding",
          url: "https://laravel.com/framework/docs/13.x/routing#route-model-binding",
          kind: "docs",
        },
        { label: "Laravel 13: Route Groups", url: "https://laravel.com/framework/docs/13.x/routing#route-groups", kind: "docs" },
        { label: "Laravel 13: URL Generation", url: "https://laravel.com/framework/docs/13.x/urls", kind: "docs" },
      ],
      video: {
        title: "Group & Organize Your Routes | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=0MBzQg8sAZg",
        videoId: "0MBzQg8sAZg",
        durationLabel: "18:34",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-route-groups-binding-q1",
          prompt: "How do nested route groups combine their attributes?",
          options: [
            "Middleware and `where` constraints are merged; names and URI prefixes are appended",
            "Everything is merged, with the inner group overriding the outer on conflicts",
            "Everything is appended, including middleware, which may therefore run twice",
            "The inner group replaces the outer group's attributes entirely",
          ],
          correctIndex: 0,
          explanation:
            "Merging middleware means an inner group adds to the outer stack rather than replacing it, while appending names and prefixes is what produces `admin.users.index` and `/admin/users`. Mixing the two mental models is why prefixes sometimes come out doubled.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-route-groups-binding-q2",
          prompt:
            "What is the final route name?\n\n```php\nRoute::name('admin.')->group(function () {\n    Route::get('/users', fn () => null)->name('users');\n});\n```",
          options: ["`admin.users`", "`adminusers`", "`admin/users`", "`users.admin`"],
          correctIndex: 0,
          explanation:
            "The name prefix is concatenated exactly as written, so the trailing dot is yours to supply — `Route::name('admin')` would produce `adminusers`. URI prefixes are different: Laravel inserts the slash for you.",
        },
        {
          id: "lv-route-groups-binding-q3",
          prompt:
            "`Route::get('/users/{user}', fn (User $user) => $user->email);` is hit with an id that does not exist. What happens?",
          options: [
            "A 404 response is returned automatically before the handler runs",
            "`$user` is `null` and the closure throws a `TypeError`",
            "A 500 response from an unhandled `ModelNotFoundException`",
            "An empty `User` model is injected so the handler still runs",
          ],
          correctIndex: 0,
          explanation:
            "Implicit binding calls the equivalent of `findOrFail` and Laravel renders the resulting `ModelNotFoundException` as a 404. `->missing(fn () => redirect()->route('users.index'))` customises that.",
        },
        {
          id: "lv-route-groups-binding-q4",
          prompt: "Which middleware actually resolves implicit route-model bindings?",
          options: [
            "`Illuminate\\Routing\\Middleware\\SubstituteBindings`",
            "`Illuminate\\Foundation\\Http\\Middleware\\ConvertEmptyStringsToNull`",
            "`Illuminate\\Session\\Middleware\\StartSession`",
            "None — the router resolves them before any middleware runs",
          ],
          correctIndex: 0,
          explanation:
            "`SubstituteBindings` is in both the `web` and `api` groups, and it is what turns the raw URI segment into a model. A route registered outside those groups receives the raw string instead, which is a confusing failure the first time you see it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-route-groups-binding-q5",
          prompt: "Which statements about binding by a column other than `id` are true? (Select all that apply.)",
          options: [
            "`/posts/{post:slug}` resolves the model by its `slug` column for that route only",
            "`#[RouteKey('slug')]` on the model makes `slug` the default binding column everywhere",
            "`->withTrashed()` allows soft-deleted models to be resolved",
            "Custom keys require an explicit `Route::model()` binding in a service provider",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The `{param:column}` syntax, the `RouteKey` attribute and `withTrashed()` all work with implicit binding. `Route::model()` is the *explicit* binding API — a separate mechanism you only reach for when convention does not fit.",
        },
        {
          id: "lv-route-groups-binding-q6",
          prompt:
            "For `Route::get('/users/{user}/posts/{post:slug}', ...)`, how does Laravel resolve `{post}`?",
          options: [
            "It queries the `posts` relationship on the resolved `$user`, so a slug owned by another user 404s",
            "It queries `Post` globally by slug, ignoring the parent",
            "It requires `->scopeBindings()` before any scoping happens",
            "It resolves `{post}` first and then checks `$post->user_id` after the handler returns",
          ],
          correctIndex: 0,
          explanation:
            "A custom key on a nested parameter enables automatic scoping, with the relationship name guessed as the plural of the parameter. Without a custom key you get no scoping unless you call `->scopeBindings()` — and that difference is a real authorisation bug in waiting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-route-groups-binding-q7",
          prompt:
            "Given `enum Category: string { case Fruits = 'fruits'; case People = 'people'; }` and a route type-hinting `Category $category`, what does `/categories/vehicles` return?",
          options: [
            "A 404, because the segment is not a valid backed-enum value",
            "A 422 with a validation message about the invalid enum",
            "The handler runs with `$category` set to `null`",
            "A 500 from `ValueError: not a valid backing value`",
          ],
          correctIndex: 0,
          explanation:
            "Implicit enum binding only invokes the route when the segment matches a case of the string-backed enum; otherwise it is a clean 404. It is effectively a `whereIn` constraint you get for free from the type system.",
        },
        {
          id: "lv-route-groups-binding-q8",
          prompt: "What does `Route::controller(OrderController::class)->group(...)` let you do?",
          options: [
            "Write `Route::get('/orders/{id}', 'show')` with just the method name inside the group",
            "Apply the controller's middleware to every route in the group",
            "Automatically register all seven resource routes for that controller",
            "Namespace the group's route names with the controller's short name",
          ],
          correctIndex: 0,
          explanation:
            "The `controller` group attribute removes the repeated `[OrderController::class, ...]` array. It does not imply resource routes — that is `Route::resource` — and it does not touch names or middleware.",
        },
        {
          id: "lv-route-groups-binding-q9",
          prompt:
            "```php\nRoute::domain('{account}.example.com')->group(function () {\n    Route::get('/user/{id}', function (string $a, string $b) { /* ... */ });\n});\n```\nFor `acme.example.com/user/42`, what are `$a` and `$b`?",
          options: [
            "`$a` is `acme` and `$b` is `42`",
            "`$a` is `42` and `$b` is `acme`",
            "`$a` is `acme.example.com` and `$b` is `42`",
            "Only `$b` is passed; the subdomain must be read from the request",
          ],
          correctIndex: 0,
          explanation:
            "Domain parameters are prepended to the URI parameters, still in positional order. Forgetting that shifts every subsequent argument by one — a bug that only shows up once you add a subdomain group around existing routes.",
        },
        {
          id: "lv-route-groups-binding-q10",
          prompt: "What does `->missing(fn (Request $request) => redirect()->route('locations.index'))` change?",
          options: [
            "It replaces the automatic 404 when an implicitly bound model cannot be found",
            "It runs when the route itself does not exist, like `Route::fallback`",
            "It runs when a required route parameter is absent from the URI",
            "It suppresses the binding entirely so the raw segment is passed through",
          ],
          correctIndex: 0,
          explanation:
            "`missing()` is scoped to binding failures on that route, which is useful for gracefully redirecting deleted resources instead of showing a 404. `Route::fallback` handles unmatched URIs, a different case.",
        },
      ],
    },

    {
      id: "lv-controllers",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Controllers and Resource Controllers",
      summary:
        "A controller is not a layer, it is a translation step: take an HTTP request, turn it into a call into your application, turn the result into a response. Everything that is not translation — business rules, queries, notifications — belongs elsewhere, and the surest sign a Laravel codebase is drifting is a controller that has grown past the point where you can see the whole method on one screen.\n\nLaravel gives you three shapes. A plain controller with arbitrary methods; a single-action controller with `__invoke`, registered as `Route::get('/provision', ProvisionServer::class)`, which is the honest answer when a \"controller\" only ever does one thing; and a resource controller, where `Route::resource('photos', PhotoController::class)` registers the seven conventional CRUD routes with conventional names. `apiResource` drops `create` and `edit` because an API has no HTML forms, and `Route::singleton` models resources that have exactly one instance per owner — a profile, a thumbnail — registering `show`, `edit` and `update` with no identifier segment.\n\nControllers are resolved through the container, so constructor injection and method injection both work, with the same positional rule as routes: dependencies first, route parameters after.\n\nLaravel 13 lets you attach middleware and authorisation as attributes — `#[Middleware('auth')]`, `#[Middleware('log', only: ['index'])]`, `#[Authorize('update', 'post')]` — alongside the older `HasMiddleware` interface. Two caveats: `#[WithoutMiddleware]` can only remove *route* middleware, never global middleware, and class-level `WithoutMiddleware` attributes are inherited by child controllers, which can quietly disable protection on a subclass you did not review. When in doubt, `php artisan route:list` is the only source of truth.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: Controllers", url: "https://laravel.com/framework/docs/13.x/controllers", kind: "docs" },
        { label: "Laravel 13: Routing", url: "https://laravel.com/framework/docs/13.x/routing", kind: "docs" },
        { label: "REST API Tutorial: Resource Naming", url: "https://restfulapi.net/resource-naming/", kind: "article" },
      ],
      video: {
        title: "Clean Up Your Routes In Laravel | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=Aj8egM0HMNM",
        videoId: "Aj8egM0HMNM",
        durationLabel: "22:05",
      },
      alternateVideos: [
        {
          title: "Laravel 12 in 11 hours - Laravel for Beginners Full Course",
          channel: "The Codeholic",
          url: "https://www.youtube.com/watch?v=0M84Nk7iWkA",
          videoId: "0M84Nk7iWkA",
          startSeconds: 4534,
          chapterLabel: "Controllers",
          durationLabel: "10:54:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-controllers-q1",
          prompt: "How many routes does `Route::resource('photos', PhotoController::class)` register, and which verb handles `update`?",
          options: [
            "Seven routes; `update` is reached by `PUT` or `PATCH` on `/photos/{photo}`",
            "Seven routes; `update` is reached by `POST` on `/photos/{photo}/update`",
            "Five routes; `update` is reached by `PATCH` on `/photos/{photo}`",
            "Eight routes; `update` is reached by `PUT` on `/photos/{photo}/edit`",
          ],
          correctIndex: 0,
          explanation:
            "`index`, `create`, `store`, `show`, `edit`, `update`, `destroy` — seven — and `update` accepts both `PUT` and `PATCH` on the member URI. `edit` is the HTML form; it never performs the write.",
        },
        {
          id: "lv-controllers-q2",
          prompt: "Which actions does `Route::apiResource('photos', PhotoController::class)` skip, and why?",
          options: [
            "`create` and `edit`, because they exist only to render HTML forms",
            "`index` and `show`, because reads belong on a separate read-only controller",
            "`destroy`, because APIs should soft-delete instead",
            "`store` and `update`, because writes need explicit route definitions",
          ],
          correctIndex: 0,
          explanation:
            "`create` and `edit` return forms, which a JSON API has no use for, leaving five routes. `make:controller --api` generates the matching five-method stub.",
        },
        {
          id: "lv-controllers-q3",
          prompt: "How do you write and register a single-action controller?",
          options: [
            "Give the class an `__invoke` method and register it as `Route::post('/server', ProvisionServer::class)`",
            "Name the method `handle` and register it as `Route::post('/server', [ProvisionServer::class, 'handle'])`",
            "Extend `Illuminate\\Routing\\SingleActionController` and implement `run()`",
            "Add `#[SingleAction]` to the class and let Laravel discover it",
          ],
          correctIndex: 0,
          explanation:
            "`__invoke` makes the controller callable, so the route needs only the class name. It is the right shape whenever a \"controller\" would otherwise be a class with exactly one public method.",
        },
        {
          id: "lv-controllers-q4",
          prompt: "Which `make:controller` flags do what? (Select all that apply.)",
          options: [
            "`--resource` stubs the seven CRUD methods",
            "`--model=Photo` type-hints the model in the generated methods for route model binding",
            "`--requests` also generates form request classes for `store` and `update`",
            "`--api` generates all seven methods plus an `apiResource` route definition",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`--api` generates the *five*-method stub and does not touch your route files — you still register `Route::apiResource` yourself. The other three flags behave exactly as described.",
        },
        {
          id: "lv-controllers-q5",
          prompt:
            "A controller carries `#[Middleware('auth')]` at class level and a method carries `#[Middleware('subscribed')]`. What runs for that method?",
          options: [
            "Both, because method-level middleware is merged with class-level middleware",
            "Only `subscribed`, because the method-level attribute overrides the class",
            "Only `auth`, because class-level attributes take precedence",
            "Neither — attributes on methods are ignored unless the class implements `HasMiddleware`",
          ],
          correctIndex: 0,
          explanation:
            "Class-level and method-level `#[Middleware]` attributes merge. If you actually want to drop one, `#[WithoutMiddleware]` is the tool — and it can only remove route middleware, never global middleware.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-controllers-q6",
          prompt: "What does `Route::resource('photos.comments', CommentController::class)->shallow()` change?",
          options: [
            "`show`, `edit`, `update` and `destroy` drop the parent segment, becoming `/comments/{comment}`",
            "All seven routes drop the parent segment",
            "Only `index` and `store` keep the parent segment, and the rest are removed",
            "The child model is automatically scoped to the parent for every action",
          ],
          correctIndex: 0,
          explanation:
            "Shallow nesting keeps the parent only where it is needed to disambiguate — `index`, `create`, `store` — because a comment id is already unique. It is a URL-design choice, not a scoping mechanism.",
        },
        {
          id: "lv-controllers-q7",
          prompt: "Which routes does `Route::singleton('profile', ProfileController::class)` register?",
          options: [
            "`GET /profile`, `GET /profile/edit` and `PUT|PATCH /profile` — no identifier segment",
            "All seven resource routes, with `{profile}` always resolving to the current user",
            "`GET /profile` and `PUT /profile` only",
            "The same five routes as `apiResource`, minus the identifier",
          ],
          correctIndex: 0,
          explanation:
            "Singleton resources have no `create`/`store`/`destroy` by default and no id in the URI, because one and only one instance exists. `->creatable()` adds `create`, `store` and `destroy`; `->destroyable()` adds only `destroy`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-controllers-q8",
          prompt: "What is the route name of the `store` action generated by `Route::resource('photos', PhotoController::class)`?",
          options: ["`photos.store`", "`photos.create`", "`store.photos`", "`photos` — only member routes get names"],
          correctIndex: 0,
          explanation:
            "Every resource action gets `{resource}.{action}`, which is what makes `route('photos.store')` safe to use in forms. `->names(['create' => 'photos.build'])` overrides individual names when a legacy URL must be preserved.",
        },
        {
          id: "lv-controllers-q9",
          prompt: "How are controller constructor dependencies satisfied?",
          options: [
            "The service container resolves and injects them when the controller is instantiated",
            "Laravel passes the `Request` and route parameters, and anything else must be resolved with `app()`",
            "They must be registered explicitly in `bootstrap/app.php`",
            "Constructor injection is not supported in controllers; only method injection is",
          ],
          correctIndex: 0,
          explanation:
            "Controllers are resolved through the container, so a promoted constructor property of a concrete class needs no configuration at all. Only interfaces require a binding.",
        },
        {
          id: "lv-controllers-q10",
          prompt: "Which of these belongs in a controller method rather than somewhere else?",
          options: [
            "Turning validated input into a call on a service or model and choosing the response shape",
            "The SQL that aggregates monthly revenue across three tables",
            "The retry and backoff policy for a third-party API call",
            "The business rule that decides whether an order can still be cancelled",
          ],
          correctIndex: 0,
          explanation:
            "Controllers translate between HTTP and your application; the other three survive unchanged when the same behaviour is triggered by a queue job or an Artisan command, which is the test for whether they belong elsewhere.",
        },
      ],
    },

    {
      id: "lv-requests-responses",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Requests and Responses",
      summary:
        "`Illuminate\\Http\\Request` extends Symfony's `Request`, so you get a well-tested HTTP value object plus a large convenience layer. The layer matters: `input()` reads the merged payload (query string *and* body), `query()` reads only the query string, and typed accessors — `string()`, `integer()`, `boolean()`, `array()`, `date()`, `enum()` — coerce as they read, which is how you avoid scattering casts through a controller. `boolean()` in particular understands `\"on\"`, `\"yes\"`, `\"true\"` and `1`, the actual values a checkbox sends.\n\nTwo global middleware silently reshape input before you see it: `TrimStrings` trims every string field, and `ConvertEmptyStringsToNull` turns `\"\"` into `null`. So an empty text input does not arrive as an empty string — it arrives as `null`. That single fact explains why optional fields almost always need the `nullable` validation rule, and why `filled()` and `has()` give different answers for the same submitted form. Both middleware can be removed or exempted per-path from `bootstrap/app.php`.\n\nOn the way out, Laravel converts what you return. A string becomes a `text/html` response; an array, an Eloquent model or a collection becomes JSON with the model's hidden attributes respected. For control over status and headers, `response($content, 201)->header(...)`, `response()->json(...)`, `response()->view(...)` and `response()->download(...)` cover almost everything, and `Response::macro()` in a provider's `boot()` lets you add an application-specific shape once.\n\nRedirects are responses too: `back()->withInput()`, `redirect()->route('orders.show', $order)`, `to_route(...)`, `redirect()->away($external)`. They depend on the session, so they only behave correctly inside the `web` middleware group. And every cookie Laravel sets is encrypted and signed by `EncryptCookies`, which means a cookie written by client-side JavaScript will not decrypt and is treated as absent — a confusing afternoon if you do not know it.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: HTTP Requests", url: "https://laravel.com/framework/docs/13.x/requests", kind: "docs" },
        { label: "Laravel 13: HTTP Responses", url: "https://laravel.com/framework/docs/13.x/responses", kind: "docs" },
        {
          label: "Symfony: The HttpFoundation Component",
          url: "https://symfony.com/doc/current/components/http_foundation.html",
          kind: "article",
        },
      ],
      video: {
        title: "Laravel 12 in 11 hours - Laravel for Beginners Full Course",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=0M84Nk7iWkA",
        videoId: "0M84Nk7iWkA",
        startSeconds: 38407,
        chapterLabel: "Requests & Responses",
        durationLabel: "10:54:51",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-requests-responses-q1",
          prompt:
            "A user submits a form leaving the optional `bio` text field empty. In the controller, what is `$request->input('bio')` in a default Laravel app?",
          options: [
            "`null`, because the global `ConvertEmptyStringsToNull` middleware converted it",
            "`\"\"`, exactly as the browser sent it",
            "`null`, because Laravel never includes empty fields in the input bag",
            "`false`, because empty form values are cast to booleans",
          ],
          correctIndex: 0,
          explanation:
            "`TrimStrings` and `ConvertEmptyStringsToNull` are in the global middleware stack, so an empty input becomes `null` before your code runs. The key is still present — it just holds `null` — which is why `has('bio')` is true while `filled('bio')` is false.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-requests-responses-q2",
          prompt:
            "A POST to `/search?page=2` has a body field `page=5`. What do `$request->input('page')` and `$request->query('page')` return?",
          options: [
            "`5` and `2`",
            "`2` and `2`",
            "`5` and `5`",
            "`2` and `5`",
          ],
          correctIndex: 0,
          explanation:
            "`input()` reads the merged payload with the body taking precedence, while `query()` is restricted to the query string. Reaching for `query()` is how you read a paginator page that must not be spoofable from the body.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-requests-responses-q3",
          prompt: "What does returning `['id' => 1, 'name' => 'Ada']` from a route produce?",
          options: [
            "A JSON response with an `application/json` content type",
            "A `text/html` response containing `Array`",
            "A 500, because a route must return a string, view or `Response`",
            "A serialized PHP array that the client must `unserialize`",
          ],
          correctIndex: 0,
          explanation:
            "Laravel converts arrays, Eloquent models and collections to JSON automatically, honouring the model's `$hidden`. Returning a raw model is fine for a quick endpoint but leaks every new column you add — which is what API resources exist to fix.",
        },
        {
          id: "lv-requests-responses-q4",
          prompt: "For which of these submitted values does `$request->boolean('archived')` return `true`? (Select all that apply.)",
          options: ["`\"on\"`", "`\"yes\"`", "`\"1\"`", "`\"off\"`", "`\"no\"`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`boolean()` treats `1`, `\"1\"`, `true`, `\"true\"`, `\"on\"` and `\"yes\"` as true and everything else as false. It exists precisely because an unchecked checkbox sends nothing and a checked one sends `\"on\"`.",
        },
        {
          id: "lv-requests-responses-q5",
          prompt:
            "A form is submitted with `name=\"\"` (empty) and no `email` field at all. Which are true?",
          options: [
            "`has('name')` is `true` and `filled('name')` is `false`",
            "`has('email')` is `false` and `missing('email')` is `true`",
            "`filled('name')` is `true` because the key exists",
            "`has(['name', 'email'])` is `true` because at least one is present",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`has` asks whether the key is present, `filled` whether it is present *and* not empty, and `missing` is the inverse of `has`. Given an array, `has` requires all keys — `hasAny` is the \"at least one\" version.",
        },
        {
          id: "lv-requests-responses-q6",
          prompt:
            "Client-side JavaScript writes `document.cookie = \"theme=dark\"`. On the next request, what does Laravel's `$request->cookie('theme')` give you in a default app?",
          options: [
            "Nothing usable — `EncryptCookies` cannot decrypt it, so it is treated as absent",
            "`\"dark\"`, because Laravel reads raw cookies before decrypting",
            "The encrypted payload as a string, for you to decrypt yourself",
            "A `DecryptException` bubbles up as a 500",
          ],
          correctIndex: 0,
          explanation:
            "All Laravel cookies are encrypted and signed, so a plaintext cookie fails the integrity check and is discarded rather than thrown. Exempting a specific name via `encryptCookies(except: ['theme'])` is the supported escape hatch.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-requests-responses-q7",
          prompt: "Why does `back()->withInput()` only work properly inside the `web` middleware group?",
          options: [
            "It flashes the previous URL and the input to the session, and `StartSession` is only in the `web` group",
            "The `api` group strips `Location` headers from responses",
            "`withInput()` requires CSRF protection to have run first",
            "`back()` needs the `Referer` header, which the `api` group removes",
          ],
          correctIndex: 0,
          explanation:
            "Both the previous location and the flashed old input live in the session, which the stateless `api` group deliberately does not start. In an API you return a 422 with the errors instead of redirecting.",
        },
        {
          id: "lv-requests-responses-q8",
          prompt: "Where should a response macro such as `Response::macro('caps', ...)` be registered?",
          options: [
            "In the `boot` method of a service provider",
            "In the `register` method of a service provider",
            "In `bootstrap/app.php` inside `withMiddleware()`",
            "At the top of `routes/web.php`, before any route uses it",
          ],
          correctIndex: 0,
          explanation:
            "Macros configure an already-bound service, which is exactly what `boot()` is for — registering them in `register()` risks touching a service before its provider has run. Route files are loaded per request and are the wrong place for framework configuration.",
        },
        {
          id: "lv-requests-responses-q9",
          prompt: "Which response builder sets a status code and headers while still rendering a Blade view?",
          options: [
            "`response()->view('errors.503', $data, 503)->header('Retry-After', '120')`",
            "`view('errors.503', $data)->status(503)`",
            "`abort(503, view('errors.503', $data))`",
            "`response()->json(view('errors.503', $data), 503)`",
          ],
          correctIndex: 0,
          explanation:
            "`response()->view()` wraps a rendered view in a full `Response` you can then customise. The `view()` helper alone returns a `View` that Laravel converts to a 200, with no place to set a status.",
        },
        {
          id: "lv-requests-responses-q10",
          prompt: "What is `$request->expectsJson()` used for?",
          options: [
            "Deciding whether to return a redirect or a JSON payload, which is how validation produces a 302 or a 422",
            "Checking that the request body parsed as valid JSON",
            "Asserting the `Content-Type` of the incoming request is `application/json`",
            "Telling the router to skip the `web` middleware group",
          ],
          correctIndex: 0,
          explanation:
            "It performs content negotiation on `Accept` (and the AJAX headers), which is what lets the same controller serve a browser form and an XHR client. The incoming body's content type is a separate question answered by `isJson()`.",
        },
        {
          id: "lv-requests-responses-q11",
          prompt: "Which statement about `Illuminate\\Http\\Request` is accurate?",
          options: [
            "It extends Symfony's `Request`, adding Laravel's convenience and typed accessor layer",
            "It is a PSR-7 `ServerRequestInterface` implementation",
            "It is a thin wrapper over `$_GET` and `$_POST` with no external dependency",
            "It is immutable, so `merge()` returns a new request instance",
          ],
          correctIndex: 0,
          explanation:
            "Laravel builds on Symfony HttpFoundation, which is why `Illuminate\\Http\\Response` is type-compatible with `Symfony\\Component\\HttpFoundation\\Response` in middleware signatures. PSR-7 is available only via an explicit bridge package, and `merge()` mutates in place.",
        },
      ],
    },

    {
      id: "lv-validation",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Validation and Form Requests",
      summary:
        "Validation in Laravel is a gate, not a check: when it fails it throws `ValidationException` and the request never reaches your code. What the user sees depends on content negotiation — a browser form gets a 302 back to the previous URL with errors and old input flashed to the session, an XHR or JSON client gets a `422` with an `errors` object keyed by field (nested keys flattened to dot notation). One rule set, two correct behaviours, no branching in the controller.\n\nThe part that is genuinely a security control is `validated()` and `safe()`. They return *only* the keys you wrote rules for, so passing `$request->validated()` to `Model::create()` cannot smuggle an `is_admin` field through, no matter what the client posted. Passing `$request->all()` instead is the mass-assignment bug that `$fillable` exists to catch as a second line of defence. Laravel 13 adds `#[FailOnUnknownFields]` (and a global `FormRequest::failOnUnknownFields()`) to reject unexpected keys outright rather than silently discarding them.\n\nForm requests move rules out of the controller and add an `authorize()` method that returns `403` when it returns false — a genuinely different outcome from a failed rule, and the reason authorisation belongs there rather than in a rule closure. Laravel 13 configures the rest through attributes: `#[StopOnFirstFailure]`, `#[RedirectTo]`, `#[RedirectToRoute]`, `#[ErrorBag]`.\n\nThe distinctions worth knowing cold are `required` (present and not empty), `present` (the key must exist, empty is fine), `filled` (if present, must not be empty), `nullable` (explicitly permits `null`) and `sometimes` (only validate when the key is present). Because `ConvertEmptyStringsToNull` runs globally, an empty optional input arrives as `null`, so an optional date almost always needs `nullable` — without it, `date` rejects `null` and your \"optional\" field is effectively required.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Laravel 13: Validation", url: "https://laravel.com/framework/docs/13.x/validation", kind: "docs" },
        {
          label: "Laravel 13: Form Request Validation",
          url: "https://laravel.com/framework/docs/13.x/validation#form-request-validation",
          kind: "docs",
        },
        {
          label: "OWASP: Input Validation Cheat Sheet",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
          kind: "article",
        },
      ],
      video: {
        title: "30 Days to Learn Laravel, Ep 17 - Always Validate. Never Trust the User.",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=tROESL4trkQ",
        videoId: "tROESL4trkQ",
        durationLabel: "13:50",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-validation-q1",
          prompt:
            "The same controller runs `$request->validate([...])` and validation fails. What does a browser form POST get, and what does a `fetch()` call sending `Accept: application/json` get?",
          options: [
            "A 302 redirect back with errors flashed to the session; a 422 with a JSON `errors` object",
            "A 422 in both cases, with the browser rendering the JSON",
            "A 302 in both cases; the JSON client must follow the redirect to read the errors",
            "A 400 in both cases, with a `message` string",
          ],
          correctIndex: 0,
          explanation:
            "`ValidationException` is rendered according to what the request says it accepts. That is why a Blade form and an API client can share one rule set without the controller branching on the request type.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-validation-q2",
          prompt:
            "Rules are `['name' => 'required', 'email' => 'required|email']` and the client posts `name`, `email` and `is_admin=1`. What does `$request->validated()` contain?",
          options: [
            "`name` and `email` only",
            "`name`, `email` and `is_admin`",
            "`name` and `email`, plus `is_admin` set to `null`",
            "An empty array, because an unknown key fails validation",
          ],
          correctIndex: 0,
          explanation:
            "`validated()` and `safe()` return only the keys that had rules, which is what makes `Model::create($request->validated())` safe against mass assignment. By default an unexpected key is silently dropped rather than rejected.",
        },
        {
          id: "lv-validation-q3",
          prompt: "A form request's `authorize()` method returns `false`. What does the client receive?",
          options: [
            "A 403, and the controller method never runs",
            "A 422 with an authorisation error under the `errors` key",
            "A 302 redirect back, like any other validation failure",
            "A 401, prompting the authentication flow",
          ],
          correctIndex: 0,
          explanation:
            "Authorisation failure is a different outcome from rule failure: 403 Forbidden, no error bag. Putting an ownership check in a rule closure would wrongly present it as a 422 field error instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-validation-q4",
          prompt: "Which of these are true about stopping validation early? (Select all that apply.)",
          options: [
            "`'title' => ['bail', 'required', 'max:255']` stops further rules for `title` after its first failure",
            "`#[StopOnFirstFailure]` on a form request stops validating every remaining attribute after one failure",
            "Rules for an attribute run in the order you list them",
            "`bail` stops validating all other attributes as well",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`bail` is per attribute; `#[StopOnFirstFailure]` (or `$validator->stopOnFirstFailure()`) is for the whole validator. Both rely on rules running in declaration order, which is why `bail` before an expensive `unique` lookup is worth it.",
        },
        {
          id: "lv-validation-q5",
          prompt: "Which statements about `required`, `present`, `filled`, `nullable` and `sometimes` are correct? (Select all that apply.)",
          options: [
            "`required` fails when the value is `null`, `\"\"` or an empty array",
            "`present` only requires the key to exist; an empty value passes",
            "`sometimes` applies the remaining rules only when the key is present in the input",
            "`nullable` makes a field optional even when `required` is also listed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`nullable` only tells the other rules to accept `null`; combined with `required` it is contradictory and `required` still rejects `null`. `filled` is the fourth shape: if the key is present it must not be empty.",
        },
        {
          id: "lv-validation-q6",
          prompt:
            "`'publish_at' => ['date']` rejects submissions where the user left the date input blank. Why, and what fixes it?",
          options: [
            "`ConvertEmptyStringsToNull` turns the blank input into `null`, and `date` rejects `null`; add `nullable`",
            "The `date` rule requires a timezone; add `date_format:Y-m-d`",
            "Blank inputs are omitted entirely, so add `sometimes`",
            "The field needs `exclude_if` to skip validation when the form is partially filled",
          ],
          correctIndex: 0,
          explanation:
            "Because a global middleware nullifies empty strings, every optional field is really a nullable field. This is the single most common cause of \"my optional field is required\" in Laravel.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-validation-q7",
          prompt:
            "You validate `'users.*.email' => ['required', 'email']` and the second entry has a bad address. What key appears in the JSON `errors` object?",
          options: ["`users.1.email`", "`users[1][email]`", "`users.*.email`", "`email`"],
          correctIndex: 0,
          explanation:
            "Wildcard rules expand per index and nested error keys are flattened to dot notation in the JSON response, so the client can map an error straight back to a row. Remember the index is zero-based.",
        },
        {
          id: "lv-validation-q8",
          prompt: "What does `#[FailOnUnknownFields]` on a form request do?",
          options: [
            "Rejects the request when it contains input keys that no rule defines",
            "Throws at boot if a rule references a field the model does not have",
            "Strips unknown keys from `validated()` instead of failing",
            "Logs unknown keys in development and ignores them in production",
          ],
          correctIndex: 0,
          explanation:
            "It turns silent discarding into an explicit failure, which catches renamed fields and typo'd form inputs early. `FormRequest::failOnUnknownFields()` in a provider enables it globally, and `#[FailOnUnknownFields(false)]` opts a webhook endpoint back out.",
        },
        {
          id: "lv-validation-q9",
          prompt: "How is the `$errors` variable available in every Blade view, even ones that never received it?",
          options: [
            "The `ShareErrorsFromSession` middleware in the `web` group shares it with all views on every request",
            "Blade injects it at compile time whenever it sees `@error`",
            "The `view()` helper merges the session's errors into the data array",
            "`AppServiceProvider` shares it by default in a fresh application",
          ],
          correctIndex: 0,
          explanation:
            "`ShareErrorsFromSession` guarantees `$errors` is always a `MessageBag`, even when empty, so templates never need `isset()`. Outside the `web` group there is no session and therefore no `$errors`.",
        },
        {
          id: "lv-validation-q10",
          prompt: "How do you write a reusable custom rule object in Laravel 13?",
          options: [
            "Implement `Illuminate\\Contracts\\Validation\\ValidationRule` with `validate(string $attribute, mixed $value, Closure $fail): void`",
            "Extend `Illuminate\\Validation\\Rule` and implement `passes()` and `message()`",
            "Register a closure with `Validator::extend()` — rule objects were removed",
            "Add a `#[Rule]` attribute to a static method on the form request",
          ],
          correctIndex: 0,
          explanation:
            "The current contract is `ValidationRule` with a single `validate` method that calls `$fail(...)`. The older `passes()`/`message()` interface is the legacy shape, and `Validator::extend` is for string-named rules.",
        },
        {
          id: "lv-validation-q11",
          prompt: "What is `Rule::requiredIf()` for?",
          options: [
            "Building a `required_if` condition from a boolean or a closure rather than another field's value",
            "Marking a field required only when the request expects JSON",
            "Requiring a field only on `PUT` and `PATCH` requests",
            "Deferring a `required` check until after the database rules have run",
          ],
          correctIndex: 0,
          explanation:
            "The string form `required_if:other,value` can only compare against another input field; `Rule::requiredIf(fn () => $user->isAdmin())` lets the condition come from anywhere. It is the escape hatch when a rule depends on state outside the payload.",
        },
        {
          id: "lv-validation-q12",
          prompt: "Which attributes customise where a failed form request redirects, and into which error bag? (Select all that apply.)",
          options: ["`#[RedirectTo('/dashboard')]`", "`#[RedirectToRoute('dashboard')]`", "`#[ErrorBag('login')]`", "`#[Fallback('/home')]`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`RedirectTo`, `RedirectToRoute` and `ErrorBag` are the Laravel 13 form-request attributes; named bags matter when two forms render on one page. There is no `Fallback` attribute.",
        },
      ],
    },

    {
      id: "lv-middleware",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Middleware and the Pipeline",
      summary:
        "Middleware is the decorator pattern applied to an HTTP request, implemented as a pipeline. Each class receives the request and a `$next` closure; whatever you do before calling `$next($request)` happens on the way in, whatever you do with its return value happens on the way out, and simply *not* calling `$next` short-circuits the entire application and returns your response instead. That is how `auth` redirects to a login page without the controller knowing it exists.\n\nRegistration lives entirely in `bootstrap/app.php` since Laravel 11. `$middleware->append()`/`prepend()` manage the global stack, `use([...])` replaces it wholesale, `appendToGroup()`/`prependToGroup()` and the `web(append:)` / `api(prepend:)` / `web(replace:)` / `web(remove:)` shortcuts manage the groups, and `alias([...])` gives long class names the short handles you use on routes. Defaults worth knowing: the `web` group is `EncryptCookies`, `AddQueuedCookiesToResponse`, `StartSession`, `ShareErrorsFromSession`, `PreventRequestForgery` (which replaced `VerifyCsrfToken` in Laravel 13) and `SubstituteBindings`; the `api` group contains `SubstituteBindings` and nothing else — in particular, **no rate limiting by default**, so an unthrottled public API is the framework doing exactly what you told it.\n\nOrder is where bugs live. Middleware run in the order listed, but `priority()` (plus `prependToPriorityList(before:)` and `appendToPriorityList(after:)`) forces a global ordering for cases where a route's own list would otherwise put session handling after something that needs it. And `withoutMiddleware()` can only remove *route* middleware — global middleware is not removable per route, by design.\n\nFinally, `terminate()`: if your server is FastCGI, it runs after the response has been flushed, which makes it the right place for logging or analytics. Two traps — Laravel resolves a **fresh instance** for `terminate()` unless the middleware is bound as a container singleton, so state set in `handle()` is gone; and on non-FastCGI setups it may not run at all.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "Laravel 13: Middleware", url: "https://laravel.com/framework/docs/13.x/middleware", kind: "docs" },
        { label: "PSR-15: HTTP Server Request Handlers", url: "https://www.php-fig.org/psr/psr-15/", kind: "spec" },
        {
          label: "laravel/framework: Pipeline.php",
          url: "https://github.com/laravel/framework/blob/13.x/src/Illuminate/Pipeline/Pipeline.php",
          kind: "repo",
        },
      ],
      video: {
        title: "How Middleware Works in Laravel | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=C63AxM2y3pc",
        videoId: "C63AxM2y3pc",
        durationLabel: "42:23",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-middleware-q1",
          prompt:
            "In which order do these lines execute for a successful request?\n\n```php\npublic function handle(Request $request, Closure $next): Response\n{\n    Log::info('A');\n    $response = $next($request);\n    Log::info('B');\n    return $response;\n}\n```",
          options: [
            "`A`, then the controller, then `B`",
            "The controller, then `A`, then `B`",
            "`A`, then `B`, then the controller",
            "`A` and `B` both run before the controller",
          ],
          correctIndex: 0,
          explanation:
            "`$next($request)` is the rest of the pipeline, so everything before it is \"on the way in\" and everything after is \"on the way out\". That is what makes a single middleware able to both authorise and add a response header.",
        },
        {
          id: "lv-middleware-q2",
          prompt: "Which middleware does the default `api` group contain in Laravel 13?",
          options: [
            "`SubstituteBindings` only",
            "`SubstituteBindings` and `ThrottleRequests`",
            "`ThrottleRequests`, `SubstituteBindings` and `HandleCors`",
            "The same list as `web`, minus `StartSession`",
          ],
          correctIndex: 0,
          explanation:
            "There is no rate limiting in the `api` group by default — you add `throttle:api` yourself. Assuming otherwise is how public APIs ship unthrottled. `HandleCors` is global, not group-scoped.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-middleware-q3",
          prompt: "Which middleware are in the default `web` group? (Select all that apply.)",
          options: [
            "`EncryptCookies`",
            "`StartSession`",
            "`PreventRequestForgery`",
            "`Authenticate`",
            "`ThrottleRequests`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The `web` group is `EncryptCookies`, `AddQueuedCookiesToResponse`, `StartSession`, `ShareErrorsFromSession`, `PreventRequestForgery` (the Laravel 13 replacement for `VerifyCsrfToken`) and `SubstituteBindings`. `Authenticate` and `ThrottleRequests` are aliases you apply per route.",
        },
        {
          id: "lv-middleware-q4",
          prompt:
            "You add `EnsureTokenIsValid` to the **global** stack, then put `->withoutMiddleware([EnsureTokenIsValid::class])` on one route. What happens on that route?",
          options: [
            "The middleware still runs — `withoutMiddleware` cannot remove global middleware",
            "The middleware is skipped for that route only",
            "The route 500s, because you cannot exclude a middleware that was never assigned to it",
            "The middleware runs but its return value is ignored",
          ],
          correctIndex: 0,
          explanation:
            "`withoutMiddleware` (and the `#[WithoutMiddleware]` attribute) operate on route middleware only. If a global middleware needs an exemption, the middleware itself must check the path — or it should not be global.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-middleware-q5",
          prompt:
            "A middleware sets `$this->startedAt = microtime(true)` in `handle()` and reads it in `terminate()`, but the value is always uninitialised. Why?",
          options: [
            "Laravel resolves a fresh instance for `terminate()` unless the middleware is bound as a container singleton",
            "`terminate()` runs in a separate process with no access to the previous one",
            "Properties are reset because middleware are serialised between phases",
            "`terminate()` only receives the request and response, so `$this` is not bound",
          ],
          correctIndex: 0,
          explanation:
            "The documented fix is `$this->app->singleton(TerminatingMiddleware::class)` in a provider's `register()`. Also remember `terminate()` only fires on FastCGI, so it is not a reliable hook everywhere.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-middleware-q6",
          prompt: "How do you pass arguments to a middleware from a route definition?",
          options: [
            "Append them after a colon: `->middleware('role:editor,publisher')`",
            "Pass an array: `->middleware(['role' => ['editor', 'publisher']])`",
            "Use a second argument: `->middleware('role', 'editor')`",
            "Bind them contextually in the container; middleware cannot take route arguments",
          ],
          correctIndex: 0,
          explanation:
            "Everything after the colon is split on commas and passed to `handle()` after `$next`, so the signature becomes `handle($request, Closure $next, string ...$roles)`. This is why `throttle:60,1` reads the way it does.",
        },
        {
          id: "lv-middleware-q7",
          prompt: "Which of these are middleware aliases Laravel registers by default? (Select all that apply.)",
          options: ["`auth`", "`throttle`", "`signed`", "`cors`", "`csrf`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The default aliases include `auth`, `auth.basic`, `auth.session`, `cache.headers`, `can`, `guest`, `password.confirm`, `precognitive`, `signed`, `subscribed`, `throttle` and `verified`. CORS and CSRF are handled by global and `web`-group middleware, not by aliases.",
        },
        {
          id: "lv-middleware-q8",
          prompt: "What problem does `$middleware->priority([...])` solve?",
          options: [
            "It imposes a global execution order on middleware regardless of the order a route lists them in",
            "It decides which middleware handles a request when two match the same route",
            "It controls which middleware run first across concurrent requests",
            "It marks middleware that may be skipped under load",
          ],
          correctIndex: 0,
          explanation:
            "Without it, a route that lists `auth` before `StartSession` would try to authenticate before a session exists. `prependToPriorityList(before: ...)` and `appendToPriorityList(after: ...)` slot your own middleware into the existing list instead of replacing it.",
        },
        {
          id: "lv-middleware-q9",
          prompt: "What is the difference between `$middleware->append()` and `$middleware->prepend()` in `withMiddleware()`?",
          options: [
            "`append` adds to the end of the global stack, `prepend` to the beginning — so `prepend` runs earlier",
            "`append` adds to the `web` group, `prepend` to the `api` group",
            "`append` adds to the route stack, `prepend` to the global stack",
            "They are aliases; ordering is always controlled by `priority()`",
          ],
          correctIndex: 0,
          explanation:
            "Both manage the global stack; position determines when the middleware sees the request relative to `TrustProxies`, `HandleCors` and the rest. Group-level changes use `appendToGroup` or the `web()`/`api()` shortcuts.",
        },
        {
          id: "lv-middleware-q10",
          prompt: "What does `$middleware->web(replace: [StartSession::class => StartCustomSession::class])` do?",
          options: [
            "Substitutes your class for the default one in the `web` group, keeping its position",
            "Adds your class to the `web` group and leaves the original in place",
            "Removes `StartSession` globally and registers the replacement as an alias",
            "Replaces the middleware only for routes that do not define their own middleware",
          ],
          correctIndex: 0,
          explanation:
            "`replace:` swaps one entry in place so ordering relative to the rest of the group is preserved, which matters enormously for session and cookie middleware. `remove:` deletes an entry outright.",
        },
        {
          id: "lv-middleware-q11",
          prompt: "Can a middleware constructor take dependencies?",
          options: [
            "Yes — middleware are resolved through the service container, so type-hinted dependencies are injected",
            "No — middleware must have an empty constructor and use `app()` internally",
            "Only if you register the middleware manually in a service provider",
            "Only for route middleware; global middleware are instantiated with `new`",
          ],
          correctIndex: 0,
          explanation:
            "Every middleware is resolved from the container, which is why injecting a rate limiter, a logger or a repository just works. It is also why binding one as a singleton changes `terminate()` behaviour.",
        },
        {
          id: "lv-middleware-q12",
          prompt: "What happens if `handle()` returns a redirect without ever calling `$next($request)`?",
          options: [
            "The rest of the pipeline and the controller never run; the redirect is returned, passing back out through earlier middleware",
            "The controller still runs and its response replaces the redirect",
            "Laravel throws because a middleware must always call `$next`",
            "The redirect is queued and applied after the controller responds",
          ],
          correctIndex: 0,
          explanation:
            "Not calling `$next` short-circuits everything deeper in the pipeline — the mechanism behind `auth`, maintenance mode and rate limiting. The response still travels back out through middleware that already ran.",
        },
      ],
    },

    {
      id: "lv-service-container",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "The Service Container and Dependency Injection",
      summary:
        "The container is the single most load-bearing object in Laravel: it is the application, and almost everything else — controllers, middleware, jobs, listeners, commands, even route closures — is resolved through it. Its headline trick is *zero-configuration resolution*: type-hint a concrete class with no dependencies of its own, or one whose dependencies are themselves concrete, and reflection builds the whole graph with no registration at all. An **interface** is the case that always needs a binding, because reflection cannot guess an implementation; the symptom is `BindingResolutionException: Target [X] is not instantiable`.\n\nThe binding vocabulary is small and each entry means something precise. `bind` runs the factory on every resolve. `singleton` runs it once per application instance. `scoped` runs it once per *lifecycle* — which is identical to `singleton` under classic PHP-FPM, but is flushed for each request under Octane and for each job in a queue worker. That distinction is exactly where long-running PHP leaks state. `instance` registers an object you already have, and `extend` wraps an existing binding, which is how you decorate a framework service without forking it.\n\nWhen one implementation is not enough, contextual binding — `$this->app->when(PhotoController::class)->needs(Filesystem::class)->give(fn () => Storage::disk('local'))` — resolves differently per consumer, and `needs('$primitive')` does the same for scalars. Laravel 13 exposes much of this declaratively through attributes: `#[Singleton]`, `#[Scoped]`, `#[Bind(RedisEventPusher::class, environments: ['production'])]`, `#[BindWhen(...)]` (PHP 8.5 only), plus contextual attributes like `#[Config('services.stripe.key')]`, `#[Storage('s3')]`, `#[CurrentUser]` and `#[RouteParameter('post')]`.\n\nThe tradeoff is honest: a container makes swapping implementations and testing trivial, and makes \"where does this object actually come from?\" a question you can no longer answer by reading one file. `php artisan about`, `App::call()`, tagging and `resolving()` callbacks are how you get that visibility back.",
      level: "expert",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "Laravel 13: Service Container", url: "https://laravel.com/framework/docs/13.x/container", kind: "docs" },
        {
          label: "Martin Fowler: Inversion of Control Containers and the Dependency Injection Pattern",
          url: "https://martinfowler.com/articles/injection.html",
          kind: "article",
        },
        { label: "PSR-11: Container Interface", url: "https://www.php-fig.org/psr/psr-11/", kind: "spec" },
        {
          label: "laravel/framework: Container.php",
          url: "https://github.com/laravel/framework/blob/13.x/src/Illuminate/Container/Container.php",
          kind: "repo",
        },
      ],
      video: {
        title: "Understanding the Laravel Service Container | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=VO6Sm3GbCUk",
        videoId: "VO6Sm3GbCUk",
        durationLabel: "40:09",
      },
      alternateVideos: [
        {
          title: "Why the Laravel Service Container is the Key to Better Dependency Management",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=8HBQ2-_39VE",
          videoId: "8HBQ2-_39VE",
          durationLabel: "34:21",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-service-container-q1",
          prompt:
            "Neither of these is registered anywhere. Which resolves, and which fails?\n\n```php\nfinal class PdfRenderer {}\ninterface PaymentGateway {}\n\nRoute::get('/a', fn (PdfRenderer $r) => 'ok');\nRoute::get('/b', fn (PaymentGateway $g) => 'ok');\n```",
          options: [
            "`/a` resolves via zero-configuration resolution; `/b` throws `BindingResolutionException`",
            "Both resolve — the container creates an anonymous implementation for the interface",
            "Both fail — every dependency must be bound explicitly",
            "`/b` resolves to `null` and `/a` throws, because closures cannot take dependencies",
          ],
          correctIndex: 0,
          explanation:
            "Reflection can instantiate a concrete class and recursively build its concrete dependencies. An interface is not instantiable, so it needs a binding — the classic \"Target [X] is not instantiable\" error.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-service-container-q2",
          prompt: "Which statements about `bind`, `singleton`, `scoped` and `instance` are true? (Select all that apply.)",
          options: [
            "`bind` runs its factory closure on every resolve",
            "`singleton` runs its factory once and caches the result for the application's lifetime",
            "`instance` registers an object you already constructed",
            "`scoped` behaves like `bind`, returning a new object per resolve",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`scoped` is a singleton with a flush point, not a per-resolve factory: it caches within one request or job and is cleared at the start of the next lifecycle. The `*If` variants (`bindIf`, `singletonIf`, `scopedIf`) register only when nothing is bound yet.",
        },
        {
          id: "lv-service-container-q3",
          prompt: "When is a `scoped` binding actually flushed, and why does it exist?",
          options: [
            "At the start of each Octane request and each queued job, so long-lived workers don't share per-request state",
            "At the end of every HTTP response under PHP-FPM, which `singleton` does not do",
            "Whenever `config:clear` runs, because the container cache is rebuilt",
            "Only when you call `App::forgetScopedInstances()` yourself",
          ],
          correctIndex: 0,
          explanation:
            "Under classic PHP-FPM the process dies each request, so `scoped` and `singleton` look identical — the difference only shows under Octane or a long-running queue worker, where a `singleton` holding the current user is a cross-request data leak.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-service-container-q4",
          prompt:
            "Two controllers both type-hint `Filesystem`, but one must get the local disk and the other S3. What does that?",
          options: [
            "`$this->app->when(PhotoController::class)->needs(Filesystem::class)->give(fn () => Storage::disk('local'))`",
            "Two separate `singleton` bindings for the same interface; the last one wins per controller",
            "A `tag` on each implementation, resolved with `tagged('filesystems')`",
            "Binding the interface to a closure that inspects `debug_backtrace()` for the caller",
          ],
          correctIndex: 0,
          explanation:
            "Contextual binding keys the resolution on the consuming class, which is the only clean way to give two consumers different implementations of one interface. Tagging returns *all* tagged services, a different problem.",
        },
        {
          id: "lv-service-container-q5",
          prompt: "Which Laravel 13 container attributes exist? (Select all that apply.)",
          options: [
            "`#[Singleton]` on a class, marking it a singleton binding",
            "`#[Bind(RedisEventPusher::class, environments: ['production'])]` on an interface",
            "`#[Config('services.stripe.key')]` on a constructor parameter",
            "`#[Inject]` on a property, for property injection",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`Singleton`, `Scoped`, `Bind`, `BindWhen` and the contextual attributes (`Config`, `Storage`, `Cache`, `DB`, `Log`, `Auth`, `CurrentUser`, `RouteParameter`, `Tag`, `Give`, …) are real. Laravel's container does constructor and method injection, not property injection — there is no `#[Inject]`.",
        },
        {
          id: "lv-service-container-q6",
          prompt: "What does `App::call([$report, 'generate'])` give you over calling `$report->generate()` directly?",
          options: [
            "The container resolves and injects the method's type-hinted dependencies",
            "The call is deferred until the response has been sent",
            "The method result is cached for the rest of the request",
            "Exceptions thrown inside are converted to HTTP responses",
          ],
          correctIndex: 0,
          explanation:
            "`App::call()` performs method injection on any callable, which is the same machinery controllers use. You may also pass extra arguments as an array for parameters the container cannot resolve.",
        },
        {
          id: "lv-service-container-q7",
          prompt: "What is `$this->app->extend(Cache::class, fn ($service, $app) => new LoggingCache($service))` for?",
          options: [
            "Decorating an existing binding — the original is resolved and passed in for you to wrap",
            "Adding methods to a class at runtime, like a macro",
            "Replacing a binding only if one already exists",
            "Registering a subclass so that `instanceof` checks still pass",
          ],
          correctIndex: 0,
          explanation:
            "`extend` is the decorator hook: you receive the resolved service and return the wrapper. Re-binding the key instead would throw away whatever the framework or another package had configured.",
        },
        {
          id: "lv-service-container-q8",
          prompt: "What does `tag` / `tagged` solve?",
          options: [
            "Resolving a whole set of related bindings at once, e.g. every registered report generator",
            "Labelling bindings so `php artisan about` can group them",
            "Giving a binding an alias usable as a string key",
            "Marking bindings that should be deferred until first use",
          ],
          correctIndex: 0,
          explanation:
            "`$this->app->tag([A::class, B::class], 'reports')` then `$this->app->tagged('reports')` returns an iterable of all of them — the container-level answer to plugin registries. Deferral is a service-provider concern.",
        },
        {
          id: "lv-service-container-q9",
          prompt: "What is the relationship between Laravel's container and PSR-11?",
          options: [
            "The container implements `Psr\\Container\\ContainerInterface`, which only defines `get()` and `has()`",
            "PSR-11 defines binding methods like `bind` and `singleton` that Laravel implements",
            "Laravel provides a separate adapter class; the application container itself is not PSR-11",
            "PSR-11 compliance is why Laravel supports contextual binding",
          ],
          correctIndex: 0,
          explanation:
            "PSR-11 is deliberately a read-only consumer interface — `get` and `has` — so a package can depend on any container. Everything about *registering* services, including contextual binding, is Laravel-specific.",
        },
        {
          id: "lv-service-container-q10",
          prompt:
            "A class needs a primitive it cannot infer, e.g. `__construct(private int $maxRetries)`. Which approaches work? (Select all that apply.)",
          options: [
            "`$this->app->when(Syncer::class)->needs('$maxRetries')->give(3)`",
            "`$this->app->makeWith(Syncer::class, ['maxRetries' => 3])`",
            "Binding a closure: `$this->app->bind(Syncer::class, fn () => new Syncer(3))`",
            "Type-hinting `int` and letting zero-configuration resolution supply a default",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Primitives need `needs('$name')`, `makeWith`, or an explicit factory closure. Reflection can build classes, not scalars, so a bare `int` parameter with no default is unresolvable.",
        },
        {
          id: "lv-service-container-q11",
          prompt:
            "You bind `$this->app->singleton(Reporter::class, fn () => new Reporter(config('reports.mode')));` and resolve it three times in one request. How many `Reporter` objects exist, and when does the closure run?",
          options: [
            "One; the closure runs on the first `make`, not at registration time",
            "One; the closure runs when the provider's `register()` method executes",
            "Three; `singleton` only guarantees the same *class*, not the same instance",
            "One, but the closure runs again whenever `config()` changes",
          ],
          correctIndex: 0,
          explanation:
            "Bindings are lazy — registering stores the factory, and nothing is constructed until something resolves the key. That laziness is why registering hundreds of bindings costs almost nothing per request.",
        },
        {
          id: "lv-service-container-q12",
          prompt: "What is the main cost of routing everything through a container, and how do you mitigate it?",
          options: [
            "Object construction becomes indirect and hard to trace; tooling like `route:list`, `about`, explicit bindings and `resolving()` callbacks restore visibility",
            "Reflection makes every request measurably slower; caching the container is the standard fix",
            "It prevents constructor injection, forcing you to use facades instead",
            "It makes unit testing harder, because you cannot substitute implementations",
          ],
          correctIndex: 0,
          explanation:
            "The real tradeoff is legibility: \"where did this object come from?\" now needs tooling rather than one file. Testability actually improves, and reflection resolution is cheap relative to a typical request's I/O.",
        },
      ],
    },

    {
      id: "lv-service-providers",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Service Providers and Bootstrapping",
      summary:
        "Service providers are the only place Laravel gives you to say \"before any request is handled, wire this up.\" Every framework subsystem — the database, the queue, the mailer, the router — is bootstrapped by one, and your own live in `app/Providers` and are listed in `bootstrap/providers.php` (which replaced the `providers` array in `config/app.php` in Laravel 11).\n\nThe two methods are not interchangeable and the rule is mechanical. `register()` may **only** bind things into the container, because it runs while the binding list is still being built and the service you want may not exist yet. `boot()` runs after every provider has registered, so it is where event listeners, view composers, route patterns, macros, Blade directives, policies and validation extensions belong. `boot()` also supports method injection, so you can type-hint what you need rather than resolving it from `$this->app`.\n\nFor providers that do nothing but bind, deferral is free performance: implement `DeferrableProvider` and return the bound keys from `provides()`, and Laravel keeps a compiled manifest mapping each key to its provider, loading the provider only when something resolves one of those keys. The catch is that a deferred provider's `boot()` will not run at startup, so a provider that registers a listener or a route must not be deferred — and there is no warning if you get it wrong, just behaviour that mysteriously depends on whether something else resolved the binding first.\n\nPackages usually never appear in `bootstrap/providers.php` at all: auto-discovery reads `extra.laravel.providers` (and `extra.laravel.aliases`) from the package's own `composer.json`. That is why `composer require` is normally the entire installation step, and why `--no-scripts` can leave a package apparently installed but completely inert.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel 13: Service Providers", url: "https://laravel.com/framework/docs/13.x/providers", kind: "docs" },
        { label: "Laravel 13: Package Development", url: "https://laravel.com/framework/docs/13.x/packages", kind: "docs" },
        { label: "Laravel 13: Request Lifecycle", url: "https://laravel.com/framework/docs/13.x/lifecycle", kind: "docs" },
      ],
      video: {
        title: "What Are Laravel Service Providers and How Do They Work? | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=r4A_3f7KxbQ",
        videoId: "r4A_3f7KxbQ",
        durationLabel: "18:21",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-service-providers-q1",
          prompt: "What is the documented rule for what may go in `register()`?",
          options: [
            "Only container bindings — never event listeners, routes or anything that resolves another service",
            "Anything, as long as it does not touch the database",
            "Only code that must run in every environment, including CLI",
            "Only bindings for deferred providers; eager providers bind in `boot()`",
          ],
          correctIndex: 0,
          explanation:
            "`register()` runs before every provider has registered, so resolving a service there can pull in something half-configured. Binding a closure is safe because nothing is constructed until it is resolved.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-service-providers-q2",
          prompt: "Which of these belong in `boot()` rather than `register()`? (Select all that apply.)",
          options: [
            "`View::composer('sidebar', SidebarComposer::class)`",
            "`Route::pattern('id', '[0-9]+')`",
            "`Response::macro('caps', fn ($v) => Response::make(strtoupper($v)))`",
            "`$this->app->singleton(Connection::class, fn ($app) => new Connection(config('riak')))`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Composers, route patterns and macros all configure services that must already be bound, so they belong in `boot()`. A `singleton` binding is exactly what `register()` is for.",
        },
        {
          id: "lv-service-providers-q3",
          prompt: "Where does Laravel 13 list your application's service providers?",
          options: [
            "`bootstrap/providers.php`",
            "The `providers` array in `config/app.php`",
            "`bootstrap/app.php`, via a `->withProviders()` call",
            "`composer.json`, under `extra.laravel.providers`",
          ],
          correctIndex: 0,
          explanation:
            "Laravel 11 moved the list to `bootstrap/providers.php`, and `make:provider` appends to it automatically. `extra.laravel.providers` is how *packages* register themselves through auto-discovery.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-service-providers-q4",
          prompt: "What must be true for a provider to be safely deferred?",
          options: [
            "It only registers container bindings — it must not need `boot()` to run at startup",
            "It must be listed last in `bootstrap/providers.php`",
            "It must bind exactly one service",
            "Its bindings must all be singletons",
          ],
          correctIndex: 0,
          explanation:
            "A deferred provider is loaded only when one of the keys in `provides()` is resolved, so anything it would have done in `boot()` — registering a listener, a route, a macro — simply never happens until then. Number and kind of bindings are irrelevant.",
        },
        {
          id: "lv-service-providers-q5",
          prompt: "How do you defer a provider?",
          options: [
            "Implement `Illuminate\\Contracts\\Support\\DeferrableProvider` and return the bound keys from `provides()`",
            "Set `protected $defer = true;` on the provider class",
            "Register it with `->withProviders(deferred: [...])` in `bootstrap/app.php`",
            "Add `#[Deferred]` to the provider class",
          ],
          correctIndex: 0,
          explanation:
            "The `$defer` property was the Laravel 5 API; the current contract is `DeferrableProvider` plus `provides()`. Laravel compiles those keys into a manifest so it knows which provider to load on demand.",
        },
        {
          id: "lv-service-providers-q6",
          prompt: "What do the `$bindings` and `$singletons` properties on a provider do?",
          options: [
            "They declare simple interface-to-implementation bindings that Laravel registers automatically",
            "They document the provider's bindings for `php artisan about` without registering them",
            "They list the keys a deferred provider provides, replacing `provides()`",
            "They define bindings that are only applied in the `local` environment",
          ],
          correctIndex: 0,
          explanation:
            "They are a shorthand for a `register()` full of one-line `bind`/`singleton` calls, checked automatically when the provider loads. They cannot express a factory closure, so anything with construction logic still needs `register()`.",
        },
        {
          id: "lv-service-providers-q7",
          prompt: "Can `boot()` declare parameters?",
          options: [
            "Yes — the container performs method injection on `boot()`",
            "No — `boot()` must have an empty signature",
            "Only `Application $app` is allowed",
            "Only if the provider is not deferred",
          ],
          correctIndex: 0,
          explanation:
            "`public function boot(ResponseFactory $response)` is valid and idiomatic. `register()` deliberately does not offer this, because resolving anything at that point is the thing you are being warned against.",
        },
        {
          id: "lv-service-providers-q8",
          prompt:
            "You `composer require` a package and it works immediately, without touching `bootstrap/providers.php`. Why?",
          options: [
            "Package auto-discovery reads `extra.laravel.providers` and `extra.laravel.aliases` from the package's `composer.json`",
            "Laravel scans `vendor/` for classes extending `ServiceProvider` on every request",
            "Composer writes the provider into `bootstrap/providers.php` for you",
            "The package registers itself the first time one of its classes is autoloaded",
          ],
          correctIndex: 0,
          explanation:
            "A Composer post-autoload script builds a package manifest in `bootstrap/cache`, which is why `composer install --no-scripts` can leave a package installed but inert. `bootstrap/providers.php` stays for your own providers.",
        },
        {
          id: "lv-service-providers-q9",
          prompt: "What is `$this->app` inside a service provider?",
          options: [
            "The application instance, which is also the service container",
            "A read-only PSR-11 view of the container",
            "The current `Illuminate\\Http\\Request`",
            "A configuration repository scoped to the provider",
          ],
          correctIndex: 0,
          explanation:
            "`Application` extends `Container`, so `$this->app->singleton(...)` and `app()->singleton(...)` are the same call. That identity is why \"the app\" and \"the container\" are used interchangeably in Laravel discussions.",
        },
        {
          id: "lv-service-providers-q10",
          prompt: "A provider is deferred and `provides()` returns `[Connection::class]`. When is the provider actually loaded?",
          options: [
            "The first time something resolves `Connection::class` from the container",
            "On every request, but after all eager providers have booted",
            "Only in the `production` environment",
            "When `php artisan optimize` rebuilds the manifest",
          ],
          correctIndex: 0,
          explanation:
            "Laravel keeps a compiled map from provided key to provider and loads it lazily on first resolution. If nothing ever resolves that key, the provider's file is never even read — which is the whole point.",
        },
      ],
    },

    {
      id: "lv-facades-helpers",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Facades and Helpers",
      summary:
        "A Laravel facade is not a static class. `Cache::get('key')` hits `Facade::__callStatic`, which asks the subclass for a container key via `getFacadeAccessor()`, resolves that key, and forwards the call to the resolved object. The static syntax is a readability decision layered over ordinary dependency injection, which is why `Cache::shouldReceive('get')->andReturn('x')` works in a test — you are swapping a container binding, not monkey-patching a static method.\n\nThe documented danger is not testability but **scope creep**. A constructor with eight injected dependencies looks wrong; a class with eight facade calls looks fine, so classes quietly accumulate responsibilities. The practical rule most teams land on: facades and helpers in controllers, routes, Blade views and anywhere glue code lives; constructor injection in domain services, where the dependency list is the documentation.\n\nOne behaviour catches even experienced developers: `Facade` caches every resolved object in a static array keyed by accessor. Re-binding a service *after* a facade has already resolved it has no effect on that facade until you call `Facade::clearResolvedInstance()` — or use `swap()`, which writes straight into the cache. Laravel clears these between tests, but in a long-lived Octane process it is a real hazard.\n\nReal-time facades let you call any class statically by prefixing its namespace with `Facades\\`, keeping the test seam without the constructor parameter. Helpers are the third face of the same machinery — `view()`, `response()`, `config()`, `route()`, `abort_if()`, `to_route()`, `rescue()`, `once()`, `tap()`, `blank()`/`filled()` — and the docs are explicit that there is no practical difference between a helper and its facade. Note that `blank()`/`filled()` are not PHP's `empty()`: `blank(false)` is `false` and `blank('   ')` is `true`.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: Facades", url: "https://laravel.com/framework/docs/13.x/facades", kind: "docs" },
        { label: "Laravel 13: Helpers", url: "https://laravel.com/framework/docs/13.x/helpers", kind: "docs" },
        {
          label: "PHP Manual: Overloading (`__callStatic`)",
          url: "https://www.php.net/manual/en/language.oop5.overloading.php",
          kind: "docs",
        },
        {
          label: "laravel/framework: Facade.php",
          url: "https://github.com/laravel/framework/blob/13.x/src/Illuminate/Support/Facades/Facade.php",
          kind: "repo",
        },
      ],
      video: {
        title: "What Are Laravel Facades and How Do They Work? | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=5LtSVmKx25s",
        videoId: "5LtSVmKx25s",
        durationLabel: "24:12",
      },
      alternateVideos: [
        {
          title: "How to Make the Most of Laravel’s Built-In Helpers | Learn Laravel The Right Way",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=VZqx3QTwQfM",
          videoId: "VZqx3QTwQfM",
          durationLabel: "32:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-facades-helpers-q1",
          prompt: "What actually happens when you call `Cache::get('key')`?",
          options: [
            "`Facade::__callStatic` resolves the container binding named by `getFacadeAccessor()` and forwards `get` to that object",
            "A real static method `get` on the `Cache` class runs",
            "Laravel rewrites the call at compile time into `app('cache')->get('key')`",
            "A global singleton is read from `$GLOBALS` and the method is invoked on it",
          ],
          correctIndex: 0,
          explanation:
            "`Illuminate\\Support\\Facades\\Cache` defines only `getFacadeAccessor(): 'cache'`; `__callStatic` does the rest. No compilation step is involved — it is plain PHP magic-method dispatch.",
        },
        {
          id: "lv-facades-helpers-q2",
          prompt: "Why can `Cache::shouldReceive('get')->andReturn('value')` work at all, given the static syntax?",
          options: [
            "The facade resolves from the container, so the test swaps the bound instance for a mock",
            "PHP allows static methods to be redefined at runtime in test mode",
            "Laravel recompiles facade classes during testing to point at mocks",
            "`shouldReceive` is a real static method that records calls on the facade class itself",
          ],
          correctIndex: 0,
          explanation:
            "Indirection through the container is the entire reason facades avoid the usual testability problem of static code. A genuinely static call would have no seam to substitute.",
        },
        {
          id: "lv-facades-helpers-q3",
          prompt:
            "Inside one process you call `Cache::get('a')`, then rebind the `cache` key in the container to a different implementation, then call `Cache::get('b')`. Which implementation serves the second call?",
          options: [
            "The original one — `Facade` caches resolved instances statically until `clearResolvedInstance()` or `swap()`",
            "The new one — facades resolve from the container on every call",
            "The new one, but only after the next request begins",
            "Neither; the rebinding throws because the key is already resolved",
          ],
          correctIndex: 0,
          explanation:
            "`Facade::$resolvedInstance` memoises per accessor, so a late rebinding is invisible to the facade. `Facade::clearResolvedInstance('cache')` or `Cache::swap($new)` is how you force it — a real hazard under Octane.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-facades-helpers-q4",
          prompt: "What is a real-time facade?",
          options: [
            "Prefixing an imported class or interface with `Facades\\` so you can call it statically without binding a facade class",
            "A facade that resolves a new instance on every call instead of caching",
            "A facade generated at runtime for every class in `app/`",
            "A facade whose underlying binding is refreshed by a queue worker between jobs",
          ],
          correctIndex: 0,
          explanation:
            "`use Facades\\App\\Contracts\\Publisher;` then `Publisher::publish($podcast)` resolves the class after the prefix from the container, and `Publisher::shouldReceive(...)` still mocks it. It buys the test seam without the constructor parameter.",
        },
        {
          id: "lv-facades-helpers-q5",
          prompt: "What does the documentation say is the practical difference between `view('profile')` and `View::make('profile')`?",
          options: [
            "There is none — the helper calls the same underlying service and is mocked the same way",
            "The helper skips the container, so it cannot be mocked",
            "The helper always returns a string, while the facade returns a `View` object",
            "The facade caches the compiled view; the helper does not",
          ],
          correctIndex: 0,
          explanation:
            "Helpers are a second syntax over the same container bindings, which is why `Cache::shouldReceive('get')` also intercepts the `cache('key')` helper. Choosing between them is a style decision, not a technical one.",
        },
        {
          id: "lv-facades-helpers-q6",
          prompt: "What does the documentation name as the primary danger of facades?",
          options: [
            "Class scope creep — with no constructor to grow, classes silently accumulate responsibilities",
            "They cannot be mocked, so they make tests brittle",
            "They resolve on every call and are therefore slow",
            "They bypass the container, so contextual bindings are ignored",
          ],
          correctIndex: 0,
          explanation:
            "A ten-parameter constructor is a visible smell; ten facade calls are invisible. The recommendation is to keep watching class size, not to avoid facades.",
        },
        {
          id: "lv-facades-helpers-q7",
          prompt:
            "What do these return?\n\n```php\nblank(false);\nblank('   ');\nfilled(0);\n```",
          options: [
            "`false`, `true`, `true`",
            "`true`, `true`, `false`",
            "`true`, `false`, `true`",
            "`false`, `false`, `false`",
          ],
          correctIndex: 0,
          explanation:
            "`blank()` treats only `null`, whitespace-only strings and empty countables as blank — `false` and `0` are *not* blank, unlike PHP's `empty()`. That difference is what makes `filled()` safe for a legitimate zero.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-facades-helpers-q8",
          prompt: "Which of these are real Laravel global helper functions? (Select all that apply.)",
          options: ["`abort_if`", "`to_route`", "`rescue`", "`dd_if`", "`view_or_abort`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`abort_if`, `abort_unless`, `to_route`, `to_action`, `rescue`, `retry`, `once`, `tap`, `throw_if` and `transform` are all documented helpers. `dd_if` and `view_or_abort` do not exist.",
        },
        {
          id: "lv-facades-helpers-q9",
          prompt: "What does the `once()` helper do?",
          options: [
            "Runs the callback the first time and returns the memoised result for the rest of the request, per object instance when called inside one",
            "Guarantees a callback runs exactly once across all requests, using the cache",
            "Runs the callback once per queue worker process",
            "Schedules the callback to run after the response is sent",
          ],
          correctIndex: 0,
          explanation:
            "It is per-process memoisation keyed by call site — cheap for repeated derived values inside one request. It is not a distributed lock; `Cache::lock` is the tool for that.",
        },
        {
          id: "lv-facades-helpers-q10",
          prompt:
            "What is `$result` here?\n\n```php\n$result = tap($user, function (User $u) {\n    $u->markAsVerified();\n    return 'ignored';\n});\n```",
          options: [
            "The `$user` object — `tap` always returns the value it was given",
            "The string `'ignored'`",
            "`null`, because the closure's return value is discarded and nothing is returned",
            "A `HigherOrderTapProxy` wrapping `$user`",
          ],
          correctIndex: 0,
          explanation:
            "`tap` exists to let you do something with a value and still return it, so the closure's return value is deliberately irrelevant. The proxy form is what you get from `tap($user)` with *no* closure, where the method's return value is also replaced by `$user`.",
        },
        {
          id: "lv-facades-helpers-q11",
          prompt: "Where does using a facade tend to be a worse choice than constructor injection?",
          options: [
            "In a domain service class, where the constructor is the documentation of what the class depends on",
            "In a Blade view, where imports are awkward",
            "In a route closure, which is already glue code",
            "In a controller action that simply flashes a message and redirects",
          ],
          correctIndex: 0,
          explanation:
            "The further a class is from HTTP glue, the more its dependency list is worth making explicit — that list is what tells the next reader (and a static analyser) what the class touches. Views, route closures and thin controller actions are exactly where the terseness pays off.",
        },
      ],
    },

    {
      id: "lv-blade",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Blade Templating",
      summary:
        "Blade is a compiler, not an interpreter. Every `.blade.php` file is transformed once into plain PHP, cached under `storage/framework/views`, and recompiled only when the source is newer than the compiled file — so the abstraction costs essentially nothing at runtime, and `php artisan view:cache` removes even the staleness check on deploy. Unlike Twig, it deliberately does not sandbox you: any PHP expression is legal inside `{{ }}`, and `@php` blocks exist. That is a tradeoff toward power over enforced discipline, and it means Blade cannot stop you putting a query in a template.\n\nThe security property is the important one. `{{ $value }}` compiles to `e($value)`, which is `htmlspecialchars` with **double encoding on** — so an already-escaped `&amp;` becomes `&amp;amp;` unless you call `Blade::withoutDoubleEncoding()`. `{!! $value !!}` skips escaping entirely and is the correct answer only for HTML you generated yourself. Neither form is context-aware: escaping is HTML escaping, so interpolating a value inside a `<script>` block or an `onclick` attribute is still an XSS vector. `Js::from($array)` is the safe way to hand data to JavaScript, and `@{{ }}` or `@verbatim` protect Vue- or Alpine-style braces from Blade.\n\nThe directives worth knowing beyond `@if`/`@foreach` are the ones that solve real layout problems: `$loop` (with `index` starting at 0 and `iteration` at 1, plus `first`, `last` and `parent`), `@forelse`/`@empty` for the empty-collection case, `@once`/`@pushOnce` for scripts pushed from inside a loop, and `@push`/`@prepend`/`@stack` for assembling head content from child views.\n\nTemplate inheritance — `@extends`, `@section`, `@yield` — is still fully supported and still common in older codebases. The distinction to keep straight: `@endsection` defines a section for later yielding, while `@show` defines it *and* immediately yields it.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: Blade Templates", url: "https://laravel.com/framework/docs/13.x/blade", kind: "docs" },
        { label: "Laravel 13: Views", url: "https://laravel.com/framework/docs/13.x/views", kind: "docs" },
        {
          label: "OWASP: Cross Site Scripting Prevention Cheat Sheet",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
          kind: "article",
        },
      ],
      video: {
        title: "Get Sharp with Laravel Blade | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=AoMz0_zRPjg",
        videoId: "AoMz0_zRPjg",
        durationLabel: "26:03",
      },
      alternateVideos: [
        {
          title: "Laravel 12 in 11 hours - Laravel for Beginners Full Course",
          channel: "The Codeholic",
          url: "https://www.youtube.com/watch?v=0M84Nk7iWkA",
          videoId: "0M84Nk7iWkA",
          startSeconds: 7236,
          chapterLabel: "Views - Blade Directives",
          durationLabel: "10:54:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-blade-q1",
          prompt:
            "`$title` holds the string `Tom &amp; Jerry` (already HTML-escaped). What does `{{ $title }}` render by default?",
          options: [
            "`Tom &amp;amp; Jerry`, because `e()` double-encodes by default",
            "`Tom &amp; Jerry`, because Blade detects existing entities",
            "`Tom & Jerry`, because Blade decodes before escaping",
            "Nothing — Blade refuses to echo strings containing entities",
          ],
          correctIndex: 0,
          explanation:
            "`{{ }}` compiles to `e()`, which is `htmlspecialchars` with `$double_encode = true`. `Blade::withoutDoubleEncoding()` in `AppServiceProvider::boot()` changes it globally — the usual reason anyone discovers this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-blade-q2",
          prompt: "How do you stop Blade from interpreting `{{ user.name }}` intended for a JavaScript framework?",
          options: [
            "Prefix it with `@`, as in `@{{ user.name }}`, or wrap the region in `@verbatim`",
            "Escape both braces with backslashes",
            "Use `{!! !!}` so the expression is passed through unevaluated",
            "Move the markup into a `.html` file, which Blade does not compile",
          ],
          correctIndex: 0,
          explanation:
            "Blade strips the leading `@` and leaves the braces alone; `@verbatim`/`@endverbatim` does the same for a whole block. `{!! !!}` still evaluates the expression — it only skips escaping.",
        },
        {
          id: "lv-blade-q3",
          prompt: "Where do compiled Blade templates go, and when are they regenerated?",
          options: [
            "`storage/framework/views`, regenerated when the source file is newer than the compiled file",
            "`bootstrap/cache`, regenerated on every request in local environments",
            "In memory only, rebuilt for each request",
            "`public/build`, regenerated by Vite alongside CSS and JS",
          ],
          correctIndex: 0,
          explanation:
            "The mtime check makes development transparent, and `view:cache` precompiles everything so production never performs it. `view:clear` empties the directory when a stale compile misbehaves.",
        },
        {
          id: "lv-blade-q4",
          prompt:
            "Iterating three users, what do `$loop->index` and `$loop->iteration` hold on the final pass?",
          options: ["`2` and `3`", "`3` and `3`", "`3` and `2`", "`2` and `2`"],
          correctIndex: 0,
          explanation:
            "`index` is zero-based and `iteration` is one-based — the pair exists so you can use whichever the markup needs without arithmetic. `$loop->count` is 3 and `$loop->remaining` is 0 at that point.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-blade-q5",
          prompt: "What does `@forelse ... @empty ... @endforelse` give you over `@foreach`?",
          options: [
            "A built-in branch for the case where the collection has no items",
            "Lazy iteration that avoids loading the whole collection",
            "Automatic pagination links after the loop",
            "A `$loop` variable, which `@foreach` does not provide",
          ],
          correctIndex: 0,
          explanation:
            "`@empty` is the else-branch for an empty iterable, replacing an `@if ($users->isEmpty())` wrapper. `$loop` is available in any `@foreach`.",
        },
        {
          id: "lv-blade-q6",
          prompt: "In template inheritance, what is the difference between ending a section with `@endsection` and with `@show`?",
          options: [
            "`@endsection` only defines the section; `@show` defines it and immediately yields it",
            "`@show` defines the section only in the parent layout; `@endsection` only in child views",
            "`@show` makes the section immutable by child views",
            "They are aliases; `@show` is the older spelling",
          ],
          correctIndex: 0,
          explanation:
            "Layouts use `@section ... @show` to declare a default and render it in place; child views use `@section ... @endsection` to fill a section that the layout yields elsewhere. Mixing them up produces content that silently never renders.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-blade-q7",
          prompt: "A component rendered inside a loop needs to push a `<script>` tag to the head exactly once. Which directive pair does that?",
          options: [
            "`@pushOnce('scripts', 'chart.js') ... @endPushOnce` with `@stack('scripts')` in the layout",
            "`@push('scripts')` with `@yield('scripts')` in the layout",
            "`@section('scripts')` with `@show` in the layout",
            "`@include('partials.scripts')` guarded by `@if ($loop->first)`",
          ],
          correctIndex: 0,
          explanation:
            "`@once`/`@pushOnce` evaluate their body once per render cycle, and the optional second argument keys the deduplication across different templates pushing the same asset. `@stack` renders whatever was pushed.",
        },
        {
          id: "lv-blade-q8",
          prompt: "Why does a form posting to a `PUT` route need `@method('PUT')` as well as `@csrf`?",
          options: [
            "HTML forms only support GET and POST, so Laravel reads a hidden `_method` field to spoof the verb",
            "`@method` generates the signed URL that `PUT` routes require",
            "`@csrf` only protects POST, so `@method` supplies a second token",
            "Laravel needs both to decide whether the request is stateless",
          ],
          correctIndex: 0,
          explanation:
            "`@method('PUT')` renders `<input type=\"hidden\" name=\"_method\" value=\"PUT\">` and Laravel rewrites the request method from it. `@csrf` renders the `_token` field that `PreventRequestForgery` checks.",
        },
        {
          id: "lv-blade-q9",
          prompt: "Which statements about Blade are true? (Select all that apply.)",
          options: [
            "Blade compiles to plain PHP, so it adds essentially no runtime overhead",
            "`{{ }}` escapes output with `htmlspecialchars` by default",
            "Plain PHP is allowed in templates, including via `@php` blocks",
            "`{!! !!}` is safe for user-supplied content because Blade sanitises HTML first",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Blade neither sanitises nor sandboxes: `{!! !!}` emits exactly what you give it, which is why it belongs only around HTML you produced. The other three are core design decisions.",
        },
        {
          id: "lv-blade-q10",
          prompt: "What is `Js::from($array)` for?",
          options: [
            "Rendering a PHP array as a JavaScript value that is correctly escaped for embedding inside HTML quotes",
            "Importing a JavaScript module into a Blade view without Vite",
            "Converting a JavaScript object literal into a PHP array at compile time",
            "Registering a Blade directive that outputs a `<script src>` tag",
          ],
          correctIndex: 0,
          explanation:
            "It emits a `JSON.parse(...)` expression with the JSON escaped for HTML context, which plain `json_encode` inside `{{ }}` does not get right. Use it only on existing variables — the docs warn against passing complex expressions.",
        },
      ],
    },

    {
      id: "lv-blade-components",
      moduleId: "laravel-foundations",
      trackId: "php",
      title: "Blade Components and Layouts",
      summary:
        "Components are Blade's answer to the question `@include` never answered well: how do you give a piece of markup a real interface? `<x-alert type=\"error\" :message=\"$message\" class=\"mt-4\"/>` splits its attributes in two. Anything the component declares — as a constructor property on a class component, or in `@props([...])` on an anonymous one — becomes a variable. Everything else lands in the `$attributes` bag for the component to place on its root element. That split is the whole design, and it is what makes a component composable with arbitrary HTML attributes it never anticipated.\n\nThe merge semantics are asymmetric and worth memorising. `$attributes->merge(['class' => 'alert'])` **concatenates** classes, because two class lists can coexist. For any other attribute, the value you pass to `merge()` is only a *default* and a caller-supplied value **overwrites** it — which is precisely what you want for `type=\"button\"` on a button component. `->class(['p-4', 'bg-red' => $hasError])` handles conditional classes, and `->prepends()` is the escape hatch when a non-class attribute really should be joined.\n\nChoosing between class and anonymous components is mostly about whether there is logic. A file in `resources/views/components` with `@props` is enough for most presentational components; a class in `app/View/Components` earns its keep when the component needs computed values, injected dependencies or methods. Both are auto-discovered, so nothing needs registering.\n\nTwo traps. Constructor arguments are camelCase in PHP and kebab-case in markup (`$alertType` ↔ `alert-type`), and getting that wrong produces a silently-unset variable. And `@aware` can only read parent data that was **explicitly passed as an attribute** — a parent's `@props` default is invisible to it, which is the most common reason a menu child renders with the wrong colour.\n\nFor layouts, a component with `{{ $slot }}` and named slots (`<x-slot:title>`) is the modern approach; `@extends`/`@yield` inheritance still works and still fills older codebases.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel 13: Blade Components", url: "https://laravel.com/framework/docs/13.x/blade#components", kind: "docs" },
        {
          label: "Laravel 13: Building Layouts",
          url: "https://laravel.com/framework/docs/13.x/blade#building-layouts",
          kind: "docs",
        },
        { label: "Livewire: Components", url: "https://livewire.laravel.com/docs/4.x/components", kind: "article" },
      ],
      video: {
        title: "Simplify Your Views with Laravel Blade Components | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=_VDiNlT3FOA",
        videoId: "_VDiNlT3FOA",
        durationLabel: "43:26",
      },
      alternateVideos: [
        {
          title: "Laravel 12 in 11 hours - Laravel for Beginners Full Course",
          channel: "The Codeholic",
          url: "https://www.youtube.com/watch?v=0M84Nk7iWkA",
          videoId: "0M84Nk7iWkA",
          startSeconds: 11863,
          chapterLabel: "Components",
          durationLabel: "10:54:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-blade-components-q1",
          prompt: "How does Blade decide whether an attribute becomes a variable or goes into `$attributes`?",
          options: [
            "Attributes matching a constructor property (class component) or a `@props` entry (anonymous component) become variables; everything else goes into the bag",
            "Attributes prefixed with `:` become variables; plain ones go into the bag",
            "Everything becomes a variable, and `$attributes` holds a copy of all of them",
            "Only attributes listed in `$attributes->only([...])` reach the bag",
          ],
          correctIndex: 0,
          explanation:
            "The component's declared interface is the dividing line, which is what lets a caller add `class`, `id` or `wire:model` without the component knowing about them. The `:` prefix only means \"this value is a PHP expression\".",
        },
        {
          id: "lv-blade-components-q2",
          prompt:
            "A component constructor is `__construct(public string $alertType)`. Which markup sets it?",
          options: [
            "`<x-alert alert-type=\"danger\" />`",
            "`<x-alert alertType=\"danger\" />`",
            "`<x-alert :alert_type=\"'danger'\" />`",
            "`<x-alert type=\"danger\" />`",
          ],
          correctIndex: 0,
          explanation:
            "Constructor arguments are camelCase in PHP and kebab-case in markup. Writing `alertType` in the template leaves `$alertType` unset and quietly drops the value into the attribute bag instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-blade-components-q3",
          prompt:
            "The template is `<div {{ $attributes->merge(['class' => 'alert alert-error']) }}>` and it is used as `<x-alert class=\"mb-4\"/>`. What renders?",
          options: [
            "`<div class=\"alert alert-error mb-4\">`",
            "`<div class=\"mb-4\">`",
            "`<div class=\"alert alert-error\">`",
            "`<div class=\"alert alert-error\" class=\"mb-4\">`",
          ],
          correctIndex: 0,
          explanation:
            "`class` is the one attribute `merge()` concatenates rather than overwrites, because component defaults and caller utilities are meant to coexist. That is exactly why Tailwind-style utility classes work on components.",
        },
        {
          id: "lv-blade-components-q4",
          prompt:
            "The template is `<button {{ $attributes->merge(['type' => 'button']) }}>` and it is used as `<x-button type=\"submit\">Save</x-button>`. What is the rendered `type`?",
          options: [
            "`submit` — for non-class attributes, `merge()` supplies a default that the caller overwrites",
            "`button submit` — values are concatenated like classes",
            "`button` — the component's value always wins",
            "Both attributes are rendered, and the browser uses the first",
          ],
          correctIndex: 0,
          explanation:
            "Only `class` is joined; every other attribute treats the merged value as a default. `->prepends('profile-controller')` is the opt-in when you do want a non-class attribute joined.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-blade-components-q5",
          prompt: "How do you declare data variables on an **anonymous** component?",
          options: [
            "`@props(['type' => 'info', 'message'])` at the top of the template, where keyed entries supply defaults",
            "A `@data` block listing the variable names",
            "A matching class in `app/View/Components` with public properties",
            "You cannot — anonymous components receive everything through `$attributes`",
          ],
          correctIndex: 0,
          explanation:
            "`@props` is both the declaration and the defaults list: a numeric entry is required-ish (undefined if not passed), a keyed entry has a fallback. Everything not listed stays in `$attributes`.",
        },
        {
          id: "lv-blade-components-q6",
          prompt: "How do you pass a second, named block of content to a component?",
          options: [
            "`<x-slot:title>Custom Title</x-slot>` inside the component tag, echoed as `{{ $title }}`",
            "`<x-alert title=\"...\">` with the markup escaped into the attribute",
            "`@section('title') ... @endsection` inside the component tag",
            "`<x-alert::title> ... </x-alert::title>`",
          ],
          correctIndex: 0,
          explanation:
            "Unnamed content becomes `$slot`; `<x-slot:name>` creates additional named slots, each exposed as a variable. That is how a layout component offers a `$title` region alongside its body.",
        },
        {
          id: "lv-blade-components-q7",
          prompt:
            "`<x-menu>` declares `@props(['color' => 'gray'])` and is used without a `color` attribute. Its child uses `@aware(['color' => 'gray'])`. What colour does the child see if the parent's default is `purple` instead?",
          options: [
            "The `@aware` default, because `@aware` cannot read a parent `@props` default that was never passed as an attribute",
            "`purple`, because `@aware` reads the parent's resolved props",
            "Nothing — `@aware` throws when the attribute is absent",
            "`purple`, but only if the child is rendered inside the parent's `$slot`",
          ],
          correctIndex: 0,
          explanation:
            "`@aware` reads the parent's *attributes*, not its resolved data, so defaults declared in `@props` are invisible to it. This is documented as a warning and is the usual cause of a child component rendering with the wrong variant.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-blade-components-q8",
          prompt: "Which names are reserved and cannot be used as public properties or methods on a component class? (Select all that apply.)",
          options: ["`render`", "`view`", "`data`", "`title`", "`message`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The reserved list is `data`, `render`, `resolve`, `resolveView`, `shouldRender`, `view`, `withAttributes` and `withName` — Blade's own machinery. `title` and `message` are ordinary names.",
        },
        {
          id: "lv-blade-components-q9",
          prompt: "Which of these are true when choosing between a class component and an anonymous component? (Select all that apply.)",
          options: [
            "Both are auto-discovered, in `app/View/Components` and `resources/views/components` respectively",
            "A class component can inject container dependencies in its constructor",
            "An anonymous component is a single Blade file with no PHP class",
            "Only class components can accept slots",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Slots work identically in both. The real dividing line is logic: reach for a class when you need computed values, methods or injected services, and stay with a single file otherwise.",
        },
        {
          id: "lv-blade-components-q10",
          prompt: "How do you render a component defined at `resources/views/components/inputs/button.blade.php`?",
          options: [
            "`<x-inputs.button />`",
            "`<x-inputs/button />`",
            "`<x-inputs::button />`",
            "`<x-button namespace=\"inputs\" />`",
          ],
          correctIndex: 0,
          explanation:
            "Dot notation maps to subdirectories. The `::` form is reserved for package components registered with `Blade::componentNamespace()`, e.g. `<x-nightshade::calendar />`.",
        },
        {
          id: "lv-blade-components-q11",
          prompt: "What does the double-colon prefix in `<x-button ::disabled=\"isLoading\">` mean?",
          options: [
            "It escapes the attribute so Blade renders a literal `:disabled` for Alpine.js instead of evaluating PHP",
            "It binds the attribute to two values, one for the component and one for the root element",
            "It marks the attribute as static so Blade caches it",
            "It is a syntax error; Alpine attributes must go through `$attributes->merge()`",
          ],
          correctIndex: 0,
          explanation:
            "Because a single `:` means \"this is a PHP expression\", `::` is the escape for frameworks like Alpine that use colon-prefixed attributes of their own. The rendered attribute keeps one colon.",
        },
      ],
    },
  ],
} satisfies Module;
