# Laravel Foundations research notes (2026-09-23)

Second camp of the Laravel half of the PHP track. Scope: the framework's **core request path** only
— from `public/index.php` to a rendered Blade view. 14 topics, one per item in the brief's scope
list, all `quiz`.

Deliberately **not** here, because other camps own them: Eloquent, migrations, factories and seeding
(`laravel-eloquent`); guards, policies, gates, starter kits (`laravel-auth`); API resources,
JSON:API, Sanctum (`laravel-apis`); queues, events, scheduling (`laravel-queues-events`); Pest and
HTTP tests (`laravel-testing`). Where a topic here had to touch one of those — `authorize()` on a
form request returning 403, `#[Authorize]` on a controller, `Cache::shouldReceive` in the facades
topic — it is mentioned as context for the mechanism under discussion and never expanded.

One scope judgement worth flagging: the brief lists "routing and route parameters" as a single item,
and there are two good dedicated videos for it (Gio's routing basics and his route-parameters
episode). Rather than split into a 15th topic, `lv-routing` carries both as primary +
`alternateVideos` and its `estMinutes` (55) accounts for watching both.

## Videos

Every id below was confirmed with `node scripts/research/yt.mjs info <id>`; all report
`embeddable: true`. Durations and titles are copied from that output verbatim (note the curly
apostrophes in two Gio titles — they are exact).

**Spine: Program With Gio, "Learn Laravel The Right Way".** Nine of the fourteen topics use an
episode from this series. It is the only free, current, *episodic* Laravel series that maps
one-video-per-concept at the granularity this camp needs — everything else is either a 5–11 hour
course or a 5-minute explainer. Views are modest (4k–28k) but the content is accurate and
framework-idiomatic.

- `lv-request-lifecycle` — **`W0KFGXx1HG8`** "Understanding Laravel Architecture" (Program With Gio,
  12:44)
- `lv-project-structure` — **`KzyMmRVRInM`** "Understanding Laravel’s Directory Structure" (7:03),
  with **`gw7O8P0J1jE`** "Getting Started with Artisan Commands" (7:17) and **`sZysCyzl9Vk`**
  "Getting Started with Laravel Tinker" (12:15) as `alternateVideos` — the topic covers all three
  subjects and no single video does.
- `lv-configuration` — **`Ts5fLYgEM8E`** "Working with Laravel Config Files" (23:53)
- `lv-routing` — **`pP4g0xPq0TQ`** "The Basics of Routing in Laravel" (11:39), alternates
  **`DgQEDXBcyZw`** "Working with Route Parameters in Laravel" (25:23) and the Codeholic course at
  its Routing chapter.
- `lv-route-groups-binding` — **`0MBzQg8sAZg`** "Group & Organize Your Routes" (18:34)
- `lv-controllers` — **`Aj8egM0HMNM`** "Clean Up Your Routes In Laravel" (22:05). The title is about
  routes but the description confirms it is the *Controllers* episode of the series ("we explore
  Laravel Controllers… move your route logic into controller methods… single-action controllers").
  Description fetched from the watch page to check this, because the title alone is misleading.
- `lv-middleware` — **`C63AxM2y3pc`** "How Middleware Works in Laravel" (42:23)
- `lv-service-container` — **`VO6Sm3GbCUk`** "Understanding the Laravel Service Container" (40:09),
  with the **official Laravel channel's** **`8HBQ2-_39VE`** "Why the Laravel Service Container is
  the Key to Better Dependency Management" (34:21) as an alternate. Two long videos on one topic is
  deliberate: this is the module's expert milestone.
- `lv-service-providers` — **`r4A_3f7KxbQ`** "What Are Laravel Service Providers and How Do They
  Work?" (18:21)
- `lv-facades-helpers` — **`5LtSVmKx25s`** "What Are Laravel Facades and How Do They Work?" (24:12),
  alternate **`VZqx3QTwQfM`** "How to Make the Most of Laravel’s Built-In Helpers" (32:18)
- `lv-blade` — **`AoMz0_zRPjg`** "Get Sharp with Laravel Blade" (26:03)
- `lv-blade-components` — **`_VDiNlT3FOA`** "Simplify Your Views with Laravel Blade Components"
  (43:26)

**Chapter-split spine: `0M84Nk7iWkA`** "Laravel 12 in 11 hours" (The Codeholic, 10:54:51, 322k
views). Chapter markers read with `yt.mjs info --chapters` and confirmed against the brief's list:
1268 Getting Started · **2942 Routing** · **4534 Controllers** · 5849 Views The Basics · 6622 Views
Displaying Data · **7236 Views Blade Directives** · 9250 Template Inheritance · **11863 Components**
· 16055 Create Basic Pages · 17020–36598 database chapters · **38407 Requests & Responses** · 39302
Outro.

- `lv-requests-responses` uses it as its **primary** video at **38407s** — Gio's series has no
  requests/responses episode and searching turned up nothing dedicated and current. The chapter runs
  ~15 minutes, which is the right length.
- 2942 (Routing), 4534 (Controllers), 7236 (Blade Directives) and 11863 (Components) are used as
  `alternateVideos` on the matching topics.
- The 17020–36598s database chapters are left untouched for `laravel-eloquent`.

**Laracasts.** `lv-validation` uses **`tROESL4trkQ`** "30 Days to Learn Laravel, Ep 17 - Always
Validate. Never Trust the User." (13:50). Short for a milestone topic, but it is the best free
first-party treatment of the subject and the quiz carries the depth.

No search-URL fallbacks. Every topic has a real, embeddable video.

Searched and rejected: nothing usable for a dedicated Laravel 13 "requests and responses" or
"validation" episode outside the two above — the recent-upload field for controllers/validation is
almost entirely sub-500-view channels and Laravel 8/9-era material.

## References

- **All Laravel doc URLs use the post-redirect form.** `https://laravel.com/docs/13.x/…` returns a
  302 to `https://laravel.com/framework/docs/13.x/…`; the final URL is what is shipped. Verified 200
  for: lifecycle, structure, artisan, configuration, routing, controllers, requests, responses,
  validation, middleware, container, providers, facades, blade, helpers, views, urls, csrf,
  deployment, packages, releases. `https://laravel.com/docs/13.x/redirects` is a **404** — redirects
  are documented inside the `responses` page.
- Deep-link fragments (`routing#route-model-binding`, `blade#components`,
  `validation#form-request-validation`) are used where the page is long. The checker reports the
  fragment-less final URL, which is expected — fragments are client-side.
- **Iframe previews: almost nothing in this camp embeds.** `laravel.com` and `api.laravel.com` send
  `X-Frame-Options: SAMEORIGIN`; `github.com` sends `CSP frame-ancestors 'none'`;
  `martinfowler.com` and `symfony.com` send `X-Frame-Options: DENY`; `12factor.net`,
  `livewire.laravel.com`, `laracasts.com` and `laravel-news.com` all block too. The only refs here
  that preview inline are `php-fig.org` (PSR-11, PSR-15) and
  `cheatsheetseries.owasp.org`. Reference cards will fall back to link previews for ~85% of this
  camp.
- Non-Laravel refs used, all verified 200: `martinfowler.com/articles/injection.html`,
  `php-fig.org/psr/psr-11/`, `php-fig.org/psr/psr-15/`,
  `symfony.com/doc/current/components/http_foundation.html`,
  `php.net/manual/en/language.oop5.overloading.php`, `12factor.net/config`,
  `restfulapi.net/resource-naming/`, two OWASP cheat sheets,
  `github.com/laravel/tinker`, `github.com/vlucas/phpdotenv`, and four `laravel/framework` `13.x`
  source files (`Pipeline.php`, `Container.php`, `Facade.php`, `Foundation/Http/Kernel.php`).
- Redirect worth noting: `https://owasp.org/www-community/attacks/xss/` → `community.owasp.org`,
  and `https://livewire.laravel.com/docs/components` → `/docs/4.x/components`. Final URLs shipped.
- `bootstrap.laravel.com`-style guessed Laravel News slugs were not attempted; the brief warned they
  404 and no Laravel News article was needed.

## Facts verified

Checked against the live 13.x docs (`raw.githubusercontent.com/laravel/docs/13.x/*.md`, which match
the rendered site — `PreventRequestForgery` appears in both) and, where behaviour rather than prose
was at stake, against `laravel/framework` `13.x` source. Not from memory.

### Corrections to widely-repeated but now-wrong claims

- **`route:cache` does NOT fail on closure routes.** `Route::prepareForSerialization()` serialises
  closures via `SerializableClosure::unsigned()`. The "never cache routes if you use closures" rule
  is Laravel 5–7 era. This is `lv-routing-q10` precisely because so many engineers still believe it.
- **There is no `app/Http/Kernel.php`, `app/Console/Kernel.php` or `app/Exceptions/Handler.php`.**
  Everything is `bootstrap/app.php` → `withMiddleware()` / `withRouting()` / `withExceptions()`.
- **`VerifyCsrfToken` is gone from the `web` group**; Laravel 13 uses
  `Illuminate\Foundation\Http\Middleware\PreventRequestForgery`.
- **The `api` group is `SubstituteBindings` only — no throttle.**

### Lifecycle / structure

- `public/index.php` → Composer autoloader → `bootstrap/app.php` returns the `Application` (which
  *is* the container) → `handleRequest()` / `handleCommand()` → `Illuminate\Foundation\Http\Kernel`
  → bootstrappers → **all** providers `register()`, then **all** providers `boot()` → router →
  middleware → handler → response back out through middleware → `send()`.
- `app/` ships with `Http`, `Models`, `Providers` only. `Console`, `Events`, `Exceptions`, `Jobs`,
  `Listeners`, `Mail`, `Notifications`, `Policies`, `Rules`, `Broadcasting` are created by the
  matching `make:` command.
- `routes/` ships with **`web.php` and `console.php` only**. `api.php` comes from `install:api`
  (which also installs Sanctum and applies the `/api` prefix via the router, changeable with
  `apiPrefix:`); `channels.php` from `install:broadcasting`.
- Default `withRouting(web:, commands:, health: '/up')`. `then:` adds extra route files; `using:`
  takes over registration entirely.
- Providers are listed in `bootstrap/providers.php`. Packages register via
  `extra.laravel.providers` / `extra.laravel.aliases` in their own `composer.json`.
- Compiled Blade → `storage/framework/views`; config/route/services/package manifests →
  `bootstrap/cache`.
- `php artisan dev` (Laravel 13) runs `serve` + `queue:listen` + `pail` + `npm run dev` via
  `@laravel/multiplex`; needs Node 22.13+, falls back to `concurrently` on Windows.
- Tinker is PsySH. Documented warning: the `dispatch` helper relies on GC, so use `Bus::dispatch` or
  `Queue::push` inside Tinker.

### Configuration

- After `config:cache`, **`.env` is not loaded at all** during requests or Artisan commands, so
  `env()` sees only real system environment variables. Hence `env()` in `config/` files only.
- DotEnv reserved values: `true`/`(true)`, `false`/`(false)`, `empty`/`(empty)` → `''`,
  `null`/`(null)`. Spaces need double quotes.
- External/server-level environment variables override `.env`. `APP_ENV` (or `--env`) selects
  `.env.[APP_ENV]` if it exists.
- `Config::set` / `config([...])` are in-memory for the current process; nothing is written.
- Typed accessors that throw on mismatch: `Config::string/integer/float/boolean/array/collection`.
- `config:publish [--all]` for unpublished files (`cors.php`, `view.php`); `config:show <file>`;
  `about [--only=…]`.
- `env:encrypt` → `.env.encrypted` (AES-256-CBC default), `--readable` keeps names visible;
  `env:decrypt` takes the key from `LARAVEL_ENV_ENCRYPTION_KEY` or `--key`.

### Routing

- **Route parameters are injected by position, not name.** Container dependencies must be declared
  *before* route parameters. Optional `{name?}` requires a PHP default.
- Constraint helpers: `where`, `whereNumber`, `whereAlpha`, `whereAlphaNumeric`, `whereUuid`,
  `whereUlid`, `whereIn` (accepts `Enum::cases()`). A failed constraint is a **404**, not an error.
  `Route::pattern()` in `AppServiceProvider::boot()` for global constraints.
- A parameter never matches `/` unless `->where('x', '.*')`, and encoded slashes are only supported
  **in the last segment**.
- `get`/`post`/… routes must be declared before `any`/`match`/`redirect` on the same URI.
- `route('name', ['id' => 1, 'extra' => 'x'])` → unmatched keys become query string.
- **`Route::fallback` is matched last regardless of declaration order** — verified in
  `AbstractRouteCollection::matchAgainstRoutes()` (fallbacks are held back and only returned if
  nothing else matched) and `toSymfonyRouteCollection()` (fallbacks appended last).
- Nested groups: middleware and `where` **merge**; names and URI prefixes **append** (hence the
  trailing `.` in `Route::name('admin.')`).
- Model binding: `SubstituteBindings` is the middleware that performs it — in both `web` and `api`.
  Missing model → 404, customisable with `->missing()`. `{post:slug}` custom key;
  **`#[RouteKey('slug')]`** attribute on the model for a global default; `->withTrashed()` for soft
  deletes.
- **Scoping:** a custom key on a nested parameter enables automatic scoping to the parent's guessed
  relationship (plural of the parameter name). Without a custom key there is no scoping unless
  `->scopeBindings()`; `->withoutScopedBindings()` disables it. Written up as an authorisation
  hazard, which it is.
- Implicit enum binding requires a **string-backed** enum; a non-matching segment is a 404.
- Domain parameters (`Route::domain('{account}.example.com')`) are prepended to URI parameters.

### Controllers

- `Route::resource` → 7 routes (`index/create/store/show/edit/update/destroy`), `update` on
  `PUT|PATCH /photos/{photo}`, names `photos.*`. `apiResource` drops `create` and `edit` → 5.
- `Route::singleton('profile', …)` → `show`, `edit`, `update`, **no identifier segment**;
  `->creatable()` adds `create`/`store`/`destroy`, `->destroyable()` adds only `destroy`;
  `apiSingleton` drops `create`/`edit`.
- `->shallow()`, `->only()`, `->except()`, `->names([...])`, `->missing()`, `->withTrashed([...])`,
  `Route::resources([...])`, `Route::softDeletableResources([...])`.
- `make:controller` flags: `--resource`, `--api` (five methods, does **not** write routes),
  `--model=X`, `--requests`, `--invokable`.
- Laravel 13 attributes: `#[Middleware('auth')]`, `#[Middleware('log', only: [...])]`,
  `#[WithoutMiddleware(…, except: [...])]`, `#[Authorize('update', 'post')]`, all from
  `Illuminate\Routing\Attributes\Controllers`. Class-level and method-level `#[Middleware]`
  **merge**. `WithoutMiddleware` is inherited by child controllers and **cannot remove global
  middleware**. The older `HasMiddleware` interface with `static middleware()` still works.

### Requests / responses

- `TrimStrings` + `ConvertEmptyStringsToNull` are **global**, so an empty form field arrives as
  `null`. Removable/exemptable from `bootstrap/app.php` (`trimStrings(except: [...])`,
  `convertEmptyStringsToNull(except: [...])`).
- `input()` reads `getInputSource()->all() + $this->query->all()` — verified in
  `InteractsWithInput::input()`, so **the body wins** over the query string on a key collision.
  `query()` is query-string only.
- `boolean()` is true for `1`, `"1"`, `true`, `"true"`, `"on"`, `"yes"`. Other typed accessors:
  `string()` (Stringable), `integer()`, `float()`, `array()`, `date()`, `enum()`, `collect()`.
- Presence family: `has` (all keys), `hasAny`, `filled`, `isNotFilled`, `anyFilled`, `missing`,
  `whenHas`, `whenFilled`, `whenMissing`.
- Returning a string → HTML; array / model / collection → JSON respecting `$hidden`.
- `EncryptCookies` encrypts and signs every Laravel cookie; a JS-written plaintext cookie fails
  integrity and is treated as absent. `encryptCookies(except: [...])` opts out.
- `response()->view($v, $data, $status)`, `->json()`, `->download()`, `->streamDownload()`;
  `withHeaders()`, `withoutHeader()`; `cache.headers:public;max_age=30;etag` middleware.
- `Response::macro()` belongs in a provider's **`boot`**.
- Redirects need the session (`web` group): `back()->withInput()`, `redirect()->route()`,
  `to_route()`, `->action()`, `->away()`, `->with()`.
- `Illuminate\Http\Request` extends Symfony's `Request`; PSR-7 needs an explicit bridge.

### Validation

- Failure throws `ValidationException` → **302 back with flashed errors + old input** for a browser,
  **422 JSON** when the request expects JSON. Nested error keys flattened to dot notation
  (`users.0.email`).
- `validated()` / `safe()->only()/except()/all()/merge()/collect()` return **only** ruled keys — the
  mass-assignment defence.
- FormRequest `authorize()` returning false → **403**, controller never runs. `rules()`,
  `messages()`, `attributes()`, `prepareForValidation()`, `after()` all supported; `rules()` and
  `authorize()` support method injection.
- `bail` is per attribute; `#[StopOnFirstFailure]` / `stopOnFirstFailure()` is per validator. Rules
  run in declaration order.
- Laravel 13 form-request attributes: `#[StopOnFirstFailure]`, `#[FailOnUnknownFields]` (+ global
  `FormRequest::failOnUnknownFields()`, + `#[FailOnUnknownFields(false)]` to opt out),
  `#[RedirectTo]`, `#[RedirectToRoute]`, `#[ErrorBag]`.
- `required` = present and not `null`/`""`/empty array/empty Countable/pathless file. `present` =
  key must exist, empty is fine. `filled` = if present, not empty. `nullable` = `null` allowed.
  `sometimes` = only validate when present. `nullable` does **not** soften `required`.
- Optional dates need `nullable` **because of `ConvertEmptyStringsToNull`** — the docs say this
  explicitly under "A Note on Optional Fields".
- Custom rules: `implements Illuminate\Contracts\Validation\ValidationRule` with
  `validate(string $attribute, mixed $value, Closure $fail): void`. The `passes()`/`message()`
  interface is legacy.
- `Rule::requiredIf(bool|Closure)`, `Rule::anyOf([...])`, fluent `Rule::date()`, `validateWithBag()`,
  named error bags, `@error`, `$errors` (a `MessageBag` shared by `ShareErrorsFromSession`, so it is
  always defined inside the `web` group and absent outside it).
- `numeric:strict` (13) rejects numeric strings.

### Middleware

- Registration API on `Illuminate\Foundation\Configuration\Middleware`: `append`, `prepend`, `use`,
  `appendToGroup`, `prependToGroup`, `group`, `web(append:|prepend:|replace:|remove:)`,
  `api(...)`, `alias`, `priority`, `prependToPriorityList(before:, prepend:)`,
  `appendToPriorityList(after:, append:)`, `remove`, `encryptCookies(except:)`,
  `trimStrings(except:)`, `convertEmptyStringsToNull(except:)`.
- Default global stack (as shown by `use([...])`): `InvokeDeferredCallbacks`, `TrustHosts`
  (commented out), `TrustProxies`, `HandleCors`, `PreventRequestsDuringMaintenance`,
  `ValidatePostSize`, `TrimStrings`, `ConvertEmptyStringsToNull`.
- Default `web`: `EncryptCookies`, `AddQueuedCookiesToResponse`, `StartSession`,
  `ShareErrorsFromSession`, `PreventRequestForgery`, `SubstituteBindings`. Default `api`:
  `SubstituteBindings`.
- Default aliases: `auth`, `auth.basic`, `auth.session`, `cache.headers`, `can`, `guest`,
  `password.confirm`, `precognitive`, `signed`, `subscribed`, `throttle`, `verified`.
- `withoutMiddleware` **cannot remove global middleware** (stated twice in the docs).
- `terminate()` requires FastCGI and Laravel resolves a **fresh instance** for it unless the
  middleware is registered as a container `singleton` in a provider's `register()`.
- Parameters after `$next`, `Class::class.':editor,publisher'`. Middleware are container-resolved,
  so constructor injection works. Not calling `$next` short-circuits the pipeline.

### Container

- Zero-configuration resolution for concrete classes and their concrete dependencies; **interfaces
  need a binding** (`BindingResolutionException: Target [X] is not instantiable`).
- `bind`/`bindIf`, `singleton`/`singletonIf`, `scoped`/`scopedIf`, `instance`, `extend`,
  `tag`/`tagged`, `make`/`makeWith`/`bound`, `App::call()`, `resolving()`, `rebinding()`.
- **`scoped` is a singleton with a flush point**: cleared when an Octane worker takes a new request
  or a queue worker takes a new job. Identical to `singleton` under plain PHP-FPM.
- Contextual: `when([...])->needs(X)->give(...)`, `giveTagged`, `giveConfig`, `needs('$primitive')`,
  typed variadics, variadic tag dependencies.
- Attributes: `#[Singleton]`, `#[Scoped]`, `#[Bind(X::class, environments: [...])]`, `#[BindWhen]`
  (**requires PHP 8.5**), and contextual `#[Storage]`, `#[Auth]`, `#[Cache]`, `#[Config]`,
  `#[Context]`, `#[DB]`, `#[Give]`, `#[Log]`, `#[RequestAttribute]`, `#[RouteParameter]`, `#[Tag]`,
  `#[CurrentUser]`. `Bind`/`BindWhen` evaluate in declaration order.
- **No property injection** — constructor and method injection only. There is no `#[Inject]`.
- The container implements PSR-11 (`get`/`has` only). Bindings are lazy: the closure runs on first
  `make`, once for a singleton.
- Providers: `register()` binds only; `boot()` runs after every `register()` and supports method
  injection. `$bindings` / `$singletons` properties as shorthand. Deferral =
  `implements DeferrableProvider` + `provides()`; the `$defer` property is the Laravel 5 API.

### Facades and helpers

- `Facade::__callStatic` → `getFacadeAccessor()` → container resolve → forward. Verified in
  `Illuminate/Support/Facades/Facade.php`.
- **`static::$resolvedInstance` memoises per accessor** (lines ~232–256 of `Facade.php`), so a
  rebinding after first resolution is invisible until `clearResolvedInstance()` /
  `clearResolvedInstances()`; `swap()` writes directly into that cache. Used as the expert question
  in `lv-facades-helpers`.
- `shouldReceive`, `spy`, `partialMock`, `swap`, `isMock`, `isFake` all exist on the base class.
- Real-time facades: prefix the import with `Facades\`.
- Docs state there is "absolutely no practical difference between facades and helper functions",
  including for mocking. Documented danger is **class scope creep**.
- `blank()`: `''`, `'   '`, `null`, empty collection → true; `0`, `true`, `false` → **false**.
  `filled()` is its inverse. Different from `empty()`.
- `once()` memoises per request, unique per object instance when called inside one. `tap($v, $cb)`
  always returns `$v` regardless of the closure's return; `tap($v)` with no closure returns a
  proxy whose method calls also return `$v`.
- Real helpers used in the quiz: `abort_if`, `abort_unless`, `to_route`, `to_action`, `rescue`,
  `retry`, `once`, `tap`, `throw_if`, `transform`, `value`, `optional`, `blank`, `filled`.

### Blade

- Compiles to plain PHP in `storage/framework/views`, recompiled on source mtime change;
  `view:cache` / `view:clear`.
- `{{ }}` → `e()` → `htmlspecialchars` with **double encoding ON** by default;
  `Blade::withoutDoubleEncoding()` disables it. `{!! !!}` does not escape. Blade does **not**
  sanitise HTML and escaping is not context-aware.
- `@{{ }}` and `@verbatim` for JS-framework braces; `@@if` escapes a directive.
  `Js::from($array)` (and the `Js` facade) for JSON in a `<script>`.
- `$loop`: `index` (0-based), `iteration` (1-based), `remaining`, `count`, `first`, `last`, `even`,
  `odd`, `depth`, `parent`.
- `@forelse`/`@empty`, `@continue($cond)`, `@break($cond)`, `@class`, `@style`, `@checked`,
  `@selected`, `@disabled`, `@once`, `@pushOnce`/`@prependOnce` (optional second arg as a dedupe
  key), `@push`/`@pushIf`/`@prepend`/`@stack`/`@hasstack`, `@php`, `@inject`, `@csrf`, `@method`,
  `@error`, `@session`, `@fragment`.
- Inheritance: `@extends`/`@section`/`@yield` (with a default second arg). **`@endsection` defines;
  `@show` defines and immediately yields.** `@@parent` appends rather than overwrites.
- Form method spoofing uses a hidden `_method` field; `@method('PUT')` generates it.

### Blade components

- Class components in `app/View/Components` (+ view in `resources/views/components`), anonymous
  components as a single file in `resources/views/components`. Both auto-discovered.
  `make:component Forms/Input`, `make:component forms.input --view`.
- Declared data (constructor properties / `@props`) becomes variables; everything else goes to
  `$attributes`.
- **camelCase constructor arg ↔ kebab-case attribute** (`$alertType` ↔ `alert-type`).
- `$attributes->merge(['class' => …])` **concatenates** classes; for **any other attribute the
  merged value is only a default and the caller overwrites it**. `->class([...])` for conditional
  classes, `->prepends()` to force joining a non-class attribute, `->filter()`,
  `->whereStartsWith()`.
- Short attribute syntax `:$userId`; `::attr` escapes an Alpine-style attribute and renders a
  **single** colon.
- Slots: `{{ $slot }}`, named `<x-slot:title>`, scoped slots, slot attributes.
- **`@aware` can only read parent data explicitly passed as an attribute** — a parent's `@props`
  default is invisible to it (documented warning).
- Reserved component names: `data`, `render`, `resolve`, `resolveView`, `shouldRender`, `view`,
  `withAttributes`, `withName`.
- Nested path syntax `<x-inputs.button/>`; package namespace syntax `<x-nightshade::calendar/>` via
  `Blade::componentNamespace()`; anonymous index components
  (`components/accordion/accordion.blade.php`).
- Directives such as `@env` are **not** supported inside component tags.

## Assessment shape

All 14 topics are `quiz`, **150 questions total**, per the track-wide decision: the sandbox is a V8
isolate and cannot grade PHP, so difficulty is carried by predict-the-output and
"which-of-these-actually-runs" questions rather than by fake exercises. Every topic has at least two
`isEdgeCaseOrInterviewQuestion` entries and at least one multi-select.

Milestones (3): `lv-validation` (advanced), `lv-middleware` (advanced), `lv-service-container`
(expert).

Level spread: 1 topic at `expert`, 6 at `advanced`, 7 at `intermediate`. Nothing is `beginner` —
this camp assumes `php-foundations` through `php-web` are done.

`npm run content:check -- --module laravel-foundations` → 14 topics, 150 questions, **0 errors,
0 warnings**. `npm run content:types` → clean.
