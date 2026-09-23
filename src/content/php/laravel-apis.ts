import type { Module } from "@/types/curriculum";

export default {
  id: "laravel-apis",
  trackId: "php",
  name: "Laravel APIs",
  description:
    "Shipping an HTTP API with Laravel 13: the API routes file you have to ask for, resources and JSON:API serialisation, pagination, versioning, the JSON exception shape, rate limiting, calling other services with the HTTP client, documentation, CORS and signed webhooks. Laravel-specific throughout — the REST theory lives in the Backend track's API Design camp.",
  refs: [
    { label: "Laravel Docs: Routing", url: "https://laravel.com/framework/docs/13.x/routing", kind: "docs" },
    { label: "Laravel Docs: Eloquent API Resources", url: "https://laravel.com/framework/docs/13.x/eloquent-resources", kind: "docs" },
    { label: "Laravel Docs: Error Handling", url: "https://laravel.com/framework/docs/13.x/errors", kind: "docs" },
    { label: "Laravel Docs: HTTP Client", url: "https://laravel.com/framework/docs/13.x/http-client", kind: "docs" },
  ],
  topics: [
    {
      id: "lv-api-install",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "API Routes and `install:api`",
      summary:
        "A fresh Laravel 13 application has no `routes/api.php`. That is deliberate: since Laravel 11 the skeleton ships only what you need, and an API is opt-in. `php artisan install:api` pulls in `laravel/sanctum`, publishes the `personal_access_tokens` migration and offers to run it, copies the API routes stub into `routes/api.php`, and edits `bootstrap/app.php` so that `withRouting()` actually registers the file. It does not touch your `User` model — adding the `HasApiTokens` trait is left to you, and forgetting it is the most common reason `createToken()` blows up right after installation.\n\nThe routes in that file get a `/api` URI prefix automatically (changeable with `apiPrefix:` in `withRouting()`) and the `api` middleware group. The surprise for anyone who learned Laravel before version 11 is what that group contains: `SubstituteBindings` and nothing else. There is no session, no cookie encryption, no `PreventRequestForgery`, and — the part that catches people — **no throttling**. Rate limiting on an API is something you switch on with `$middleware->throttleApi()`, not something you inherit.\n\nThere is also no `app/Http/Kernel.php` any more. Middleware, routing and exception handling all live in `bootstrap/app.php` behind `->withMiddleware()`, `->withRouting()` and `->withExceptions()`. Any tutorial that tells you to edit a Kernel class is describing Laravel 10 or earlier, and the fastest way to spot stale Laravel API content is to look for that file.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Laravel Docs: Routing — API Routes", url: "https://laravel.com/framework/docs/13.x/routing", kind: "docs" },
        { label: "Laravel Docs: Controllers — API Resource Routes", url: "https://laravel.com/framework/docs/13.x/controllers", kind: "docs" },
        { label: "Laravel Docs: Sanctum", url: "https://laravel.com/framework/docs/13.x/sanctum", kind: "docs" },
      ],
      video: {
        title: "Laravel API for Beginners - A Complete Guide",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=_iuxZygxz98",
        videoId: "_iuxZygxz98",
        startSeconds: 1669,
        chapterLabel: "Install Laravel API & Create Basic Route",
        durationLabel: "4:55:53",
      },
      alternateVideos: [
        {
          title: "How to Create a Laravel API: Explained in 14 Minutes",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=WVNiiov53CE",
          videoId: "WVNiiov53CE",
          durationLabel: "14:29",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-install-q1",
          prompt: "What does `php artisan install:api` actually do in a fresh Laravel 13 app? (Select all that apply.)",
          options: [
            "Creates `routes/api.php` from a stub",
            "Requires `laravel/sanctum` via Composer and publishes the `personal_access_tokens` migration",
            "Edits `bootstrap/app.php` so `withRouting()` registers the API routes file",
            "Adds the `HasApiTokens` trait to your `User` model",
            "Adds `throttle:api` to the `api` middleware group",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The command scaffolds the routes file, installs Sanctum with its migration, and uncomments (or inserts) the `api:` argument in `withRouting()`. It explicitly prints a reminder to add `HasApiTokens` yourself, and it does not enable throttling.",
        },
        {
          id: "lv-api-install-q2",
          prompt: "Which middleware does the default `api` group contain in Laravel 13?",
          options: [
            "`SubstituteBindings` only",
            "`SubstituteBindings` and `throttle:api`",
            "`EncryptCookies`, `StartSession`, `SubstituteBindings` and `throttle:api`",
            "`auth:sanctum` and `throttle:api`",
          ],
          correctIndex: 0,
          explanation:
            "Since Laravel 11 the `api` group is just route-model binding. Sanctum's stateful middleware is added by `statefulApi()` and throttling by `throttleApi()`; neither is on by default. Pre-11 apps did get `throttle:api` from `app/Http/Kernel.php`, which is where the misconception comes from.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-install-q3",
          prompt: "You want every route in `routes/api.php` throttled by the `api` rate limiter. What is the current way to do it globally?",
          options: [
            "Call `$middleware->throttleApi()` inside `->withMiddleware()` in `bootstrap/app.php`",
            "Add `'throttle:api'` to the `$middlewareGroups['api']` array in `app/Http/Kernel.php`",
            "Set `THROTTLE_API=true` in `.env`",
            "Wrap the whole routes file in `Route::middleware('throttle')->group(...)`",
          ],
          correctIndex: 0,
          explanation:
            "`throttleApi()` prepends `throttle:api` to the group (and optionally maps it to the Redis implementation). `app/Http/Kernel.php` no longer exists, and there is no environment switch for it.",
        },
        {
          id: "lv-api-install-q4",
          prompt: "Your API must live under `/api/admin` instead of `/api`. Where do you change that?",
          options: [
            "The `apiPrefix:` argument of `->withRouting()` in `bootstrap/app.php`",
            "`config/app.php`, under an `api_prefix` key",
            "`RouteServiceProvider::$apiPrefix`",
            "A `Route::prefix('admin')` group is the only option; the `/api` segment is hard-coded",
          ],
          correctIndex: 0,
          explanation:
            "`->withRouting(api: __DIR__.'/../routes/api.php', apiPrefix: 'api/admin')` replaces the default prefix. `RouteServiceProvider` is gone from the skeleton, and there is no config key for it.",
        },
        {
          id: "lv-api-install-q5",
          prompt: "Which routes does `Route::apiResource('photos', PhotoController::class)` register?",
          options: [
            "`index`, `store`, `show`, `update`, `destroy`",
            "`index`, `create`, `store`, `show`, `edit`, `update`, `destroy`",
            "`index`, `show` and `store` only",
            "`index`, `store`, `show`, `update`, `destroy` and `restore`",
          ],
          correctIndex: 0,
          explanation:
            "`apiResource` is `resource` minus `create` and `edit`, because those two exist only to render HTML forms. `make:controller --api` generates the matching five methods.",
        },
        {
          id: "lv-api-install-q6",
          prompt:
            "A user logs into your Blade app, then the same browser calls `GET /api/profile`, which does `return $request->user();`. It returns `null`. Why?",
          options: [
            "The `api` group has no `StartSession` middleware, so the session cookie is never read and the request is unauthenticated",
            "`$request->user()` only works inside controllers, not closures",
            "Laravel blocks cookies on any URL beginning with `/api`",
            "The session exists but `user()` needs `auth()->shouldUse('web')` to be called first",
          ],
          correctIndex: 0,
          explanation:
            "API routes are stateless: with no session middleware there is no session guard to resolve. You either send a Sanctum token, or opt the SPA into cookie auth with `$middleware->statefulApi()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-install-q7",
          prompt: "Why do routes in `routes/api.php` not need a CSRF token?",
          options: [
            "`PreventRequestForgery` is only registered in the `web` middleware group",
            "Laravel disables CSRF for any request whose `Accept` header is `application/json`",
            "CSRF checks are skipped for `POST` requests that carry an `Authorization` header",
            "The `api` group replaces CSRF with a signed-URL check",
          ],
          correctIndex: 0,
          explanation:
            "CSRF defends cookie-based sessions, so the middleware lives in the `web` group only. In Laravel 13 that middleware is `PreventRequestForgery` — the class that replaced `VerifyCsrfToken`. A token-authenticated API has no ambient credential for a third-party page to abuse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-install-q8",
          prompt: "You want OAuth2 rather than Sanctum's simple tokens when scaffolding. Which command installs it?",
          options: [
            "`php artisan install:api --passport`",
            "`php artisan install:api --oauth`",
            "`php artisan passport:scaffold`",
            "`php artisan install:api` followed by `php artisan sanctum:upgrade`",
          ],
          correctIndex: 0,
          explanation:
            "`--passport` swaps the Composer requirement, runs `passport:install`, and rewrites `auth:sanctum` to `auth:api` in the generated routes file.",
        },
        {
          id: "lv-api-install-q9",
          prompt: "Where is middleware configured in a Laravel 13 application?",
          options: [
            "`bootstrap/app.php`, via `->withMiddleware()`",
            "`app/Http/Kernel.php`, via the `$middleware` and `$middlewareGroups` properties",
            "`config/middleware.php`",
            "`app/Providers/RouteServiceProvider.php`",
          ],
          correctIndex: 0,
          explanation:
            "The HTTP kernel class was removed from the skeleton in Laravel 11; `bootstrap/app.php` is the single configuration point for middleware, routing and exceptions. Content that edits `app/Http/Kernel.php` predates that.",
        },
        {
          id: "lv-api-install-q10",
          prompt: "What does the generated `routes/api.php` contain immediately after `install:api`?",
          options: [
            "A single `GET /user` route returning `$request->user()`, protected by `auth:sanctum`",
            "An empty file with only the `<?php` tag",
            "A full `apiResource` for the `User` model",
            "A health-check route returning `{\"status\":\"ok\"}`",
          ],
          correctIndex: 0,
          explanation:
            "The stub is one authenticated example route. The health endpoint is a separate feature — `withRouting(health: '/up')` — and is unrelated to the API scaffolding.",
        },
      ],
    },
    {
      id: "lv-api-resources",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "API Resources and Resource Collections",
      summary:
        "Returning an Eloquent model straight from a controller works and is almost always wrong. The response shape then follows your database columns, so renaming a column or adding `password_reset_secret` silently changes or leaks the public contract. `JsonResource` inserts a transformation layer you control: a class whose `toArray(Request $request)` decides exactly which keys exist, what they are called, and how they are cast.\n\nA resource wraps the model rather than extending it. `$this->title` inside `toArray` is forwarded to the underlying model by `__get`, which is why resources read like models but are not models. The outermost resource is wrapped in a `data` key by default; `JsonResource::withoutWrapping()` in a service provider turns that off globally, though paginated responses always keep `data` because they need `links` and `meta` alongside it. Laravel also refuses to double-wrap, so nesting a collection that returns `['data' => $this->collection]` is safe.\n\nFor a list you have two options. `UserResource::collection($users)` (or `$users->toResourceCollection()`) is enough when you only need each item transformed. A dedicated `ResourceCollection` subclass earns its keep when the collection itself carries data — a total, a set of links, an aggregate — which you add from its `toArray` or via `additional([...])`. The gotcha that bites in code review: `UserResource::collection()` maps over the collection in PHP, so anything the resource touches that is not eager-loaded becomes one query per row.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel Docs: Eloquent API Resources", url: "https://laravel.com/framework/docs/13.x/eloquent-resources", kind: "docs" },
        { label: "Laravel Docs: Eloquent Serialization", url: "https://laravel.com/framework/docs/13.x/eloquent-serialization", kind: "docs" },
        { label: "Laravel Docs: Responses", url: "https://laravel.com/framework/docs/13.x/responses", kind: "docs" },
      ],
      video: {
        title: "Laravel Advanced - Eloquent Api Resource - Complete Explanation",
        channel: "Laratips",
        url: "https://www.youtube.com/watch?v=AY5VkcPbR94",
        videoId: "AY5VkcPbR94",
        durationLabel: "37:09",
      },
      alternateVideos: [
        {
          title: "Laravel API for Beginners - A Complete Guide",
          channel: "The Codeholic",
          url: "https://www.youtube.com/watch?v=_iuxZygxz98",
          videoId: "_iuxZygxz98",
          startSeconds: 6689,
          chapterLabel: "API Resources",
          durationLabel: "4:55:53",
        },
        {
          title: "Laravel API Resources for Same Model: Re-Use or Create New?",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=CdwK41cRCTw",
          videoId: "CdwK41cRCTw",
          durationLabel: "6:38",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-resources-q1",
          prompt:
            "A route returns `new UserResource($user)` where `toArray` returns `['id' => $this->id, 'name' => $this->name]`. What is the JSON body?",
          options: [
            "`{\"data\":{\"id\":1,\"name\":\"Ada\"}}`",
            "`{\"id\":1,\"name\":\"Ada\"}`",
            "`{\"user\":{\"id\":1,\"name\":\"Ada\"}}`",
            "`{\"data\":[{\"id\":1,\"name\":\"Ada\"}]}`",
          ],
          correctIndex: 0,
          explanation:
            "The outermost resource is wrapped in `data`. A single resource is an object, not a one-element array; the array form is what `::collection()` produces.",
        },
        {
          id: "lv-api-resources-q2",
          prompt: "Which statements about `JsonResource::withoutWrapping()` are true? (Select all that apply.)",
          options: [
            "It is normally called from a service provider's `boot` method so it applies to every response",
            "It only affects the outermost resource, not `data` keys you add yourself inside nested collections",
            "A paginated resource collection is still wrapped in `data` despite it",
            "It removes the `links` and `meta` keys from paginated responses as well",
            "It must be called on each resource class individually",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Wrapping is global state set on the base `JsonResource` class, it applies only to the outermost layer, and pagination overrides it because `links` and `meta` need a sibling key to sit beside. It does not strip pagination metadata.",
        },
        {
          id: "lv-api-resources-q3",
          prompt: "Inside `toArray`, why does `$this->email` work even though `UserResource` has no `$email` property?",
          options: [
            "`JsonResource` proxies unknown property reads to the wrapped model in `$this->resource`",
            "`JsonResource` extends `Model`, so it inherits the attribute bag",
            "Laravel copies every model attribute onto the resource when it is constructed",
            "`$this` is rebound to the model while `toArray` runs",
          ],
          correctIndex: 0,
          explanation:
            "The resource holds the model in `$this->resource` and forwards reads through `__get`. It is composition, not inheritance — which is why a resource can wrap anything arrayable, not just an Eloquent model.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-resources-q4",
          prompt: "When is a dedicated `ResourceCollection` subclass worth creating instead of calling `UserResource::collection($users)`?",
          options: [
            "When the collection itself needs extra keys, such as a total, aggregate or set of links",
            "Whenever you return more than one model, since `::collection()` cannot transform items",
            "Only when the underlying models use different classes",
            "When you want each item wrapped in its own `data` key",
          ],
          correctIndex: 0,
          explanation:
            "`::collection()` already maps each item through the item resource. The subclass exists so the collection can carry its own payload; it declares which item resource to use via the `$collects` property.",
        },
        {
          id: "lv-api-resources-q5",
          prompt:
            "```php\nreturn (new UserResource($user))->additional(['meta' => ['version' => 2]]);\n```\nWhat does this produce?",
          options: [
            "`{\"data\":{…},\"meta\":{\"version\":2}}`",
            "`{\"data\":{…,\"meta\":{\"version\":2}}}`",
            "`{\"meta\":{\"version\":2}}` — `additional` replaces the payload",
            "A `TypeError`: `additional` only exists on resource collections",
          ],
          correctIndex: 0,
          explanation:
            "`additional` adds top-level keys alongside `data`. To merge into the resource object itself you put the key in `toArray`; `with()` on the class is the reusable equivalent of `additional()`.",
        },
        {
          id: "lv-api-resources-q6",
          prompt:
            "A controller runs `return UserResource::collection(User::all());` and the resource includes `'posts' => PostResource::collection($this->posts)`. There are 500 users. How many queries run?",
          options: [
            "501 — one for the users and one per user for the posts",
            "2 — Laravel eager-loads relationships referenced in a resource",
            "1 — resources are compiled into a single joined query",
            "501, but only when `APP_DEBUG` is true",
          ],
          correctIndex: 0,
          explanation:
            "Resources are plain PHP running per row; nothing inspects them to plan queries. Either eager-load in the controller (`User::with('posts')`) or use `whenLoaded('posts')` so the key is skipped when the relation is absent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-resources-q7",
          prompt: "How do you return a resource with a 201 status and a `Location` header?",
          options: [
            "`return (new UserResource($user))->response()->setStatusCode(201)->header('Location', $url);`",
            "`return response()->json(new UserResource($user), 201);`",
            "`return (new UserResource($user))->status(201);`",
            "`return new UserResource($user, 201, ['Location' => $url]);`",
          ],
          correctIndex: 0,
          explanation:
            "`->response()` converts the resource to a `JsonResponse` you can keep customising. Passing a resource to `response()->json()` works but re-serialises it and loses the resource's own `with`/`additional` data.",
        },
        {
          id: "lv-api-resources-q8",
          prompt: "Which of these are genuine reasons to prefer a resource over returning the model directly? (Select all that apply.)",
          options: [
            "A column rename stops being a breaking API change",
            "Attributes hidden by `$hidden` can still leak through relations, casts or `toArray` overrides — a resource is an explicit allow-list",
            "You can shape nested relationships independently of how they are stored",
            "Resources cache their output automatically, so repeat requests skip the database",
            "Resources validate incoming request data before it reaches the model",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Resources are an outbound presentation layer: they decouple the contract from the schema and make the exposed field list explicit. They do no caching and have nothing to do with request validation.",
        },
        {
          id: "lv-api-resources-q9",
          prompt: "A nested `CommentsCollection` returns `['data' => $this->collection]` from `toArray` and is used inside `PostResource`, which is itself the outermost resource. Does the response end up double-wrapped?",
          options: [
            "No — Laravel never double-wraps the outermost resource",
            "Yes — you get `data.data.comments`",
            "Yes, unless `withoutWrapping()` has been called",
            "Only if the collection is paginated",
          ],
          correctIndex: 0,
          explanation:
            "The framework detects that the outer layer is already wrapped and does not add a second `data` key, which is exactly why wrapping nested collections yourself is safe.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-resources-q10",
          prompt: "What is the difference between `$post->toResource()` and `new PostResource($post)`?",
          options: [
            "None functionally — `toResource()` discovers the conventional resource class for the model",
            "`toResource()` returns an array, not a resource instance",
            "`toResource()` skips the `data` wrapper",
            "`toResource()` eager-loads every relationship first",
          ],
          correctIndex: 0,
          explanation:
            "`toResource()` (and `toResourceCollection()` on a collection or paginator) is a convenience that resolves the resource class by naming convention. The resulting object and response are identical.",
        },
      ],
    },
    {
      id: "lv-api-conditional-attributes",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "Conditional Attributes and Relationship Inclusion",
      summary:
        "Real APIs do not return the same shape to everyone. An admin sees an internal note the owner does not; a list endpoint omits the nested author that the detail endpoint includes. Writing that with `if` statements inside `toArray` produces unreadable resources, so Laravel gives you a set of conditional helpers that return a sentinel value the serialiser removes afterwards: `when($condition, $value)`, `whenHas('column')`, `whenNotNull($value)` and `mergeWhen($condition, [...])` for a block of keys sharing one condition.\n\nThe relationship helpers matter more, because they encode a discipline. `whenLoaded('posts')` includes the key only if the relation is already on the model, so the controller decides what to eager-load and the resource can never trigger a lazy load. That is the difference between a list endpoint that runs two queries and one that runs N+1. The same idea extends to `whenCounted('posts')` for `loadCount`, `whenAggregated('posts', 'words', 'sum')` for `withSum` and friends, and `whenPivotLoaded('role_user', fn () => $this->pivot->expires_at)` for many-to-many pivot columns.\n\nTwo things catch people. Passing `$this->posts` to `whenLoaded` instead of the string `'posts'` defeats the whole point: PHP evaluates the argument first, so the relation loads before the check runs. And `mergeWhen` must not be used inside an array that mixes string and non-sequential numeric keys, because the merge re-indexes them. Pair all of this with `Model::preventLazyLoading()` in local and CI so an accidental N+1 fails loudly instead of quietly costing 500 queries.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel Docs: API Resources — Conditional Attributes", url: "https://laravel.com/framework/docs/13.x/eloquent-resources", kind: "docs" },
        { label: "Laravel Docs: Eloquent Relationships — Eager Loading", url: "https://laravel.com/framework/docs/13.x/eloquent-relationships", kind: "docs" },
        { label: "Use The Index, Luke: pagination and query cost", url: "https://use-the-index-luke.com/no-offset", kind: "article" },
      ],
      video: {
        title: "Laravel API Resources: whenLoaded() To Avoid N+1 Queries",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=Ls7m14eCaSU",
        videoId: "Ls7m14eCaSU",
        durationLabel: "4:38",
      },
      alternateVideos: [
        {
          title: "Laravel Advanced - Eloquent Api Resource - Complete Explanation",
          channel: "Laratips",
          url: "https://www.youtube.com/watch?v=AY5VkcPbR94",
          videoId: "AY5VkcPbR94",
          durationLabel: "37:09",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-conditional-attributes-q1",
          prompt:
            "```php\n'secret' => $this->when($request->user()->isAdmin(), 'shh'),\n```\nWhat does a non-admin see?",
          options: [
            "No `secret` key at all",
            "`\"secret\": null`",
            "`\"secret\": false`",
            "`\"secret\": \"\"`",
          ],
          correctIndex: 0,
          explanation:
            "`when` returns a `MissingValue` sentinel when the condition is false, and the serialiser strips those keys entirely. Returning `null` would still advertise that the field exists.",
        },
        {
          id: "lv-api-conditional-attributes-q2",
          prompt:
            "Which call is correct, and why?\n\n```php\n// A\n'posts' => PostResource::collection($this->whenLoaded('posts')),\n// B\n'posts' => PostResource::collection($this->whenLoaded($this->posts)),\n```",
          options: [
            "A — passing the relation name lets the check happen before anything is loaded",
            "B — passing the collection is more explicit and equally lazy",
            "Both are equivalent; `whenLoaded` normalises its argument",
            "Neither — you must use `when($this->relationLoaded('posts'), …)`",
          ],
          correctIndex: 0,
          explanation:
            "In B, PHP evaluates `$this->posts` before calling `whenLoaded`, so the relation is lazy-loaded on every row — the exact N+1 the helper exists to prevent. `whenLoaded` takes the name for that reason.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-conditional-attributes-q3",
          prompt:
            "A controller runs `User::with('posts')->paginate(50)` and the resource uses `whenLoaded('posts')`. A second endpoint runs `User::paginate(50)` with the same resource. What differs in the responses?",
          options: [
            "The second response has no `posts` key at all",
            "The second response has `\"posts\": []`",
            "The second response has `\"posts\": null`",
            "Nothing — `whenLoaded` loads the relation if it is missing",
          ],
          correctIndex: 0,
          explanation:
            "The key is omitted when the relation is not loaded. That is a real API-design consequence: clients must treat `posts` as optional, which is why some teams standardise on always eager-loading or on an explicit `include` parameter.",
        },
        {
          id: "lv-api-conditional-attributes-q4",
          prompt: "Match the helper to the loading call it pairs with. (Select all that apply.)",
          options: [
            "`whenCounted('posts')` pairs with `withCount('posts')` or `loadCount('posts')`",
            "`whenAggregated('posts', 'words', 'sum')` pairs with `withSum('posts', 'words')`",
            "`whenPivotLoaded('role_user', fn () => $this->pivot->expires_at)` pairs with a many-to-many relation whose pivot is loaded",
            "`whenHas('name')` pairs with `with('name')`",
            "`whenNotNull($this->name)` pairs with `withNull('name')`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three mirror `withCount`, the aggregate helpers and pivot loading. `whenHas` checks whether the attribute is present on the model (useful after a `select()` that omitted columns) and `whenNotNull` simply checks the value; neither has a `with*` counterpart.",
        },
        {
          id: "lv-api-conditional-attributes-q5",
          prompt: "What is the documented restriction on `mergeWhen`?",
          options: [
            "Do not use it inside an array that mixes string keys with non-sequential numeric keys",
            "It cannot be used more than once per resource",
            "It only accepts a closure, never a literal array",
            "It must be the last entry in the returned array",
          ],
          correctIndex: 0,
          explanation:
            "The merge re-indexes numeric keys, so mixed or out-of-order numeric keys come out scrambled. With ordinary string-keyed payloads it is safe anywhere in the array.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-conditional-attributes-q6",
          prompt: "`$this->when($request->user()->isAdmin(), fn () => $this->expensiveReport())`. What does passing a closure change?",
          options: [
            "The expensive call only runs when the condition is true",
            "Nothing — PHP evaluates closures eagerly too",
            "The result is cached for the rest of the request",
            "The value is serialised lazily, after the response is sent",
          ],
          correctIndex: 0,
          explanation:
            "A literal second argument is evaluated whether or not the condition holds. Wrapping it in a closure defers the work to the branch that needs it.",
        },
        {
          id: "lv-api-conditional-attributes-q7",
          prompt: "What does `Model::preventLazyLoading()` do, and where would you enable it?",
          options: [
            "Throws `LazyLoadingViolationException` when an unloaded relation is accessed; enable it in non-production environments",
            "Silently converts lazy loads into eager loads at the start of the request",
            "Disables all relationship access unless `with()` was called, in every environment",
            "Logs a warning for each lazy load but only when `APP_DEBUG` is true",
          ],
          correctIndex: 0,
          explanation:
            "It turns a silent N+1 into a loud failure during development and CI. The usual pattern is `Model::preventLazyLoading(! app()->isProduction())` so production degrades rather than 500s.",
        },
        {
          id: "lv-api-conditional-attributes-q8",
          prompt:
            "A `roles` relation is loaded, and the resource has `'expires_at' => $this->whenPivotLoaded('role_user', fn () => $this->pivot->expires_at)`. The relation is defined as `belongsToMany(Role::class)` with no `withPivot`. What is in the response?",
          options: [
            "No `expires_at` key, because `expires_at` was never selected onto the pivot",
            "`\"expires_at\": null`",
            "The correct timestamp — the pivot always carries all its columns",
            "A `BadMethodCallException` from `whenPivotLoaded`",
          ],
          correctIndex: 0,
          explanation:
            "`belongsToMany` selects only the two foreign keys unless you declare `->withPivot('expires_at')`. The pivot object exists, but the attribute is not on it, so the accessor yields nothing and the key is dropped.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-conditional-attributes-q9",
          prompt: "Which approach best supports a client-driven `?include=author,comments` parameter on a standard `JsonResource`?",
          options: [
            "Parse the parameter in the controller, eager-load only the requested relations, and use `whenLoaded` in the resource",
            "Call `$this->load($request->query('include'))` inside the resource's `toArray`",
            "Return every relation always and let the client ignore what it does not need",
            "Use `mergeWhen` with the raw query string as the condition",
          ],
          correctIndex: 0,
          explanation:
            "Keeping the decision in the controller means one eager-load per request and gives you a place to validate the allow-list. Loading inside the resource runs per row, and returning everything is the classic over-fetching problem. (Laravel's `JsonApiResource` does all of this for you — see the JSON:API topic.)",
        },
        {
          id: "lv-api-conditional-attributes-q10",
          prompt: "Which of these attributes would `whenHas('bio')` omit?",
          options: [
            "One on a model fetched with `User::select('id', 'name')->get()`",
            "One whose database value is `null`",
            "One whose database value is an empty string",
            "One defined by an accessor on the model",
          ],
          correctIndex: 0,
          explanation:
            "`whenHas` asks whether the attribute exists in the model's attribute bag, which a partial `select()` breaks. A present-but-`null` column still exists — that is the case `whenNotNull` handles.",
        },
      ],
    },
    {
      id: "lv-api-jsonapi",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "JSON:API Resources (new in Laravel 13)",
      summary:
        "JSON:API is a specification for how a JSON HTTP API represents resources, relationships, includes and sparse fieldsets. Its value is that clients and tooling can be written once: given `type` and `id` on every object, a generic client can cache, de-duplicate and link records without knowing your domain. Its cost is ceremony — hand-rolling the nested `data`/`relationships`/`included` shape from a plain `JsonResource` is tedious and easy to get subtly wrong.\n\nLaravel 13 ships `Illuminate\\Http\\Resources\\JsonApi\\JsonApiResource` to remove that cost. `php artisan make:resource PostResource --json-api` generates a class with `$attributes` and `$relationships` properties; the base class produces compliant resource objects, resolves `include` and `fields[...]` query parameters, builds the top-level `included` array, and sets `Content-Type: application/vnd.api+json`. `toAttributes()` gives you full control and lets you return a closure for an expensive attribute so it is only computed when the response actually needs it.\n\nThe details worth knowing before you adopt it: the `type` is derived from the class name (`PostResource` becomes `posts`, `BlogPostResource` becomes `blog-posts`) and `id` from the primary key, both overridable with `toType()` and `toId()`. Relationships are **not** serialised unless the client asks via `include`, which is a deliberate anti-over-fetching default — `includePreviouslyLoadedRelationships()` opts out of it, and `ignoreFieldsAndIncludesInQueryString()` freezes the shape entirely. Nested includes use dot notation and are bounded by `JsonApiResource::maxRelationshipDepth()`. Laravel serialises JSON:API responses; it does not parse JSON:API filter and sort parameters, for which the docs point at Spatie's Laravel Query Builder.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Laravel Docs: API Resources — JSON:API Resources", url: "https://laravel.com/framework/docs/13.x/eloquent-resources", kind: "docs" },
        { label: "JSON:API v1.1 specification", url: "https://jsonapi.org/format/", kind: "spec" },
        { label: "Laravel News: Laravel 13 is released", url: "https://laravel-news.com/laravel-13", kind: "article" },
        { label: "spatie/laravel-query-builder", url: "https://github.com/spatie/laravel-query-builder", kind: "repo" },
      ],
      video: {
        title: "What's New in Laravel 13: Vector Search, PHP Attributes, JSON:API Resources & More",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=UnvBFcO3Vww",
        videoId: "UnvBFcO3Vww",
        startSeconds: 655,
        chapterLabel: "First-party JSON API support",
        durationLabel: "23:28",
      },
      alternateVideos: [
        {
          title: "NEW in Laravel v12.45: JsonApiResource for JSON:API Specification",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=e75PDM-gDSA",
          videoId: "e75PDM-gDSA",
          durationLabel: "4:28",
        },
        {
          title: "Laravel 13 Demo: JSON:API + Spatie Query Builder + Scramble API Docs",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=vrAdzOPSFiE",
          videoId: "vrAdzOPSFiE",
          durationLabel: "13:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-jsonapi-q1",
          prompt: "Which Artisan command generates a JSON:API resource in Laravel 13?",
          options: [
            "`php artisan make:resource PostResource --json-api`",
            "`php artisan make:resource PostResource --jsonapi`",
            "`php artisan make:json-api-resource Post`",
            "`php artisan jsonapi:resource Post`",
          ],
          correctIndex: 0,
          explanation:
            "The `--json-api` flag on `make:resource` produces a class extending `Illuminate\\Http\\Resources\\JsonApi\\JsonApiResource` with `$attributes` and `$relationships` stubs.",
        },
        {
          id: "lv-api-jsonapi-q2",
          prompt:
            "`PostResource` declares `public $relationships = ['author', 'comments'];`. A client requests `GET /api/posts/1` with no query string. What is in the response?",
          options: [
            "Only `data` with `id`, `type` and `attributes` — no relationships are serialised",
            "`data` plus `relationships` for both, with full objects in `included`",
            "`data` plus `relationships` containing resource identifiers, but an empty `included`",
            "A 400, because `include` is required once relationships are declared",
          ],
          correctIndex: 0,
          explanation:
            "Declared relationships are *includable*, not included. The client opts in with `?include=author,comments`, which is what keeps the default response small.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-jsonapi-q3",
          prompt: "What `type` does a `BlogPostResource` produce by default, and how would you change it?",
          options: [
            "`blog-posts`; override `toType()`",
            "`BlogPost`; override `$type`",
            "`blog_posts`; set `protected $resourceType`",
            "`blogposts`; it cannot be changed",
          ],
          correctIndex: 0,
          explanation:
            "The class name is stripped of the `Resource` suffix and kebab-cased and pluralised. `toType()` and `toId()` are the override points — useful when, say, an `AuthorResource` wraps a `User` and should report `authors`.",
        },
        {
          id: "lv-api-jsonapi-q4",
          prompt: "What does `GET /api/posts?fields[posts]=title,created_at&fields[users]=name` do?",
          options: [
            "Returns only those attributes per resource type — a sparse fieldset",
            "Filters the collection to posts whose title and created_at are non-null",
            "Sorts by title then created_at",
            "Is ignored unless the resource opts in with `allowFields()`",
          ],
          correctIndex: 0,
          explanation:
            "`fields[type]` is the JSON:API sparse-fieldset syntax and `JsonApiResource` honours it out of the box. `ignoreFieldsAndIncludesInQueryString()` is how you opt *out*.",
        },
        {
          id: "lv-api-jsonapi-q5",
          prompt: "Which of these does `JsonApiResource` handle for you? (Select all that apply.)",
          options: [
            "Building the top-level `included` array from requested relationships",
            "Setting `Content-Type: application/vnd.api+json`",
            "Honouring `include` and `fields[...]` query parameters",
            "Parsing JSON:API `filter[...]` and `sort` parameters into query constraints",
            "Validating incoming JSON:API request documents",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The framework covers serialisation: resource objects, includes, sparse fieldsets and the media type. Filtering, sorting and inbound document validation are not included — the docs suggest Spatie's Laravel Query Builder for the query-parameter side.",
        },
        {
          id: "lv-api-jsonapi-q6",
          prompt:
            "```php\npublic function toAttributes(Request $request): array\n{\n    return [\n        'title' => $this->title,\n        'word_count' => fn () => $this->calculateWordCount(),\n    ];\n}\n```\nWhen does `calculateWordCount()` run?",
          options: [
            "Only when `word_count` survives the sparse-fieldset filter and is actually serialised",
            "On every request, because PHP evaluates the array eagerly",
            "Never — closures are dropped from the attribute array",
            "Once per response, even if the attribute is filtered out",
          ],
          correctIndex: 0,
          explanation:
            "Lazy attribute evaluation is one of the reasons to use `toAttributes`: a client asking for `fields[posts]=title` never pays for the expensive computation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-jsonapi-q7",
          prompt: "A client sends `?include=comments.author`. What governs how deep that can go?",
          options: [
            "`JsonApiResource::maxRelationshipDepth(...)`, typically set in a service provider",
            "The `json-api.max_depth` config key",
            "Nothing — dot notation is unlimited",
            "The number of entries in `$relationships`",
          ],
          correctIndex: 0,
          explanation:
            "Nested includes are capped by default so a client cannot request an arbitrarily deep graph; `maxRelationshipDepth()` raises or lowers that ceiling.",
        },
        {
          id: "lv-api-jsonapi-q8",
          prompt:
            "You already do `$post->load('author', 'comments')` in the controller and want those in the response without the client sending `include`. Which method does that?",
          options: [
            "`includePreviouslyLoadedRelationships()`",
            "`ignoreFieldsAndIncludesInQueryString()`",
            "`withRelationships()`",
            "`alwaysInclude()`",
          ],
          correctIndex: 0,
          explanation:
            "`includePreviouslyLoadedRelationships()` serialises whatever is already eager-loaded regardless of the query string. `ignoreFieldsAndIncludesInQueryString()` is the stronger hammer: it disables the client's control entirely.",
        },
        {
          id: "lv-api-jsonapi-q9",
          prompt: "Where do `toLinks()` and `toMeta()` output land in the JSON:API document?",
          options: [
            "As `links` and `meta` keys inside the resource object, next to `attributes`",
            "As top-level `links` and `meta` siblings of `data`",
            "Inside `included`, one entry per relationship",
            "In the response headers, as `Link` and `X-Meta`",
          ],
          correctIndex: 0,
          explanation:
            "They decorate the resource object — for example a `self` link built from a named route, or a humanised timestamp. Top-level document metadata is a separate concern.",
        },
        {
          id: "lv-api-jsonapi-q10",
          prompt: "Which are honest arguments *against* adopting JSON:API for an internal-only API? (Select all that apply.)",
          options: [
            "The envelope is verbose, and every client has to learn `data`/`attributes`/`relationships`",
            "Its benefits — generic clients, caching, de-duplication — mostly pay off with many heterogeneous consumers",
            "Deep `include` chains can become an expensive, hard-to-bound query surface",
            "Laravel cannot produce JSON:API responses without a third-party package",
            "JSON:API forbids pagination, so list endpoints must return everything",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are real tradeoffs. The last two are false: Laravel 13 has first-party support, and JSON:API defines a `page[...]` pagination family.",
        },
      ],
    },
    {
      id: "lv-api-pagination",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "Pagination in API Responses",
      summary:
        "Laravel gives you three paginators with genuinely different costs. `paginate()` returns a `LengthAwarePaginator`: it runs a second `COUNT(*)` so it can tell you `total` and `last_page`, and its `OFFSET` grows linearly, so page 5,000 makes the database walk 75,000 rows it will throw away. `simplePaginate()` returns a `Paginator`: no count query, it just fetches one extra row to know whether a next page exists, so you get previous/next but no total. `cursorPaginate()` returns a `CursorPaginator` and rewrites the query as `where id > ?`, which is index-friendly and constant-cost at any depth.\n\nCursor pagination is also the only one that is correct under concurrent writes. With offsets, a row inserted above the page a user is reading shifts everything down, so they see a duplicate; a deletion makes them skip a record. The price: the query must have an `order by` on a unique, non-null column set belonging to the paginated table, and you cannot render numbered page links.\n\nThe response shape differs depending on what you return. A raw paginator serialises flat — `data` alongside `total`, `per_page`, `current_page`, `last_page`, `path` and the `*_page_url` keys. Wrap the same paginator in a resource collection and you get the JSON:API-ish three-key shape instead: `data`, `links` (`first`/`last`/`prev`/`next`) and `meta` (the counters). Choose one and stick to it, because switching later is a breaking change. Two operational details: generated URLs drop the rest of the query string unless you call `withQueryString()`, and a client-supplied `per_page` must be clamped — `?per_page=1000000` is a free denial-of-service otherwise.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel Docs: Pagination", url: "https://laravel.com/framework/docs/13.x/pagination", kind: "docs" },
        { label: "Laravel Docs: API Resources — Pagination", url: "https://laravel.com/framework/docs/13.x/eloquent-resources", kind: "docs" },
        { label: "Use The Index, Luke: We need tool support for keyset pagination", url: "https://use-the-index-luke.com/no-offset", kind: "article" },
      ],
      video: {
        title: "Laravel API for Beginners - A Complete Guide",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=_iuxZygxz98",
        videoId: "_iuxZygxz98",
        startSeconds: 13545,
        chapterLabel: "Pagination, Filtering and Sorting",
        durationLabel: "4:55:53",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-pagination-q1",
          prompt: "Which paginator runs an extra `COUNT(*)` query, and why does it need to?",
          options: [
            "`paginate()` — it reports `total` and `last_page`",
            "`simplePaginate()` — it needs the total to know whether a next page exists",
            "`cursorPaginate()` — it counts rows beyond the cursor",
            "All three run a count query",
          ],
          correctIndex: 0,
          explanation:
            "Only `LengthAwarePaginator` needs the grand total. `simplePaginate` fetches `perPage + 1` rows to detect a next page, and cursor pagination compares against the ordered columns.",
        },
        {
          id: "lv-api-pagination-q2",
          prompt:
            "Two SQL statements for \"page 2 of users ordered by id\":\n\n```sql\nselect * from users order by id asc limit 15 offset 15;\nselect * from users where id > 15 order by id asc limit 15;\n```\nWhy is the second better at page 5,000?",
          options: [
            "`offset` makes the database read and discard every preceding row, while the `where` clause seeks straight into the index",
            "`offset` cannot use an index at all, whereas `where` can",
            "The second returns fewer rows",
            "`offset` locks the table while it counts",
          ],
          correctIndex: 0,
          explanation:
            "An index can satisfy the ordering in both cases, but `OFFSET n` still has to traverse and throw away `n` entries. Keyset (cursor) pagination turns that linear scan into a single index seek.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-pagination-q3",
          prompt: "Which are documented limitations of `cursorPaginate()`? (Select all that apply.)",
          options: [
            "The query must have an `order by` clause",
            "The ordering columns must be unique (or a unique combination) and must not contain nulls",
            "You cannot generate numbered page links, only next/previous",
            "It cannot be combined with `where` clauses",
            "It only works on MySQL",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Cursor pagination encodes the position of the last row in the ordered set, so ordering must exist and be unambiguous, and there is no notion of a page number. Other `where` clauses are fine, and it is database-agnostic.",
        },
        {
          id: "lv-api-pagination-q4",
          prompt: "A route returns `User::paginate()` directly (not wrapped in a resource). Which keys appear at the top level of the JSON?",
          options: [
            "`data`, `total`, `per_page`, `current_page`, `last_page`, `path`, `from`, `to` and the `*_page_url` keys",
            "`data`, `links` and `meta`",
            "`data` and `pagination`",
            "Just a bare array of records",
          ],
          correctIndex: 0,
          explanation:
            "A raw paginator serialises flat. The three-key `data`/`links`/`meta` shape is what a `ResourceCollection` wrapping a paginator produces — a genuine difference people hit when they refactor a controller to use resources.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-pagination-q5",
          prompt: "A user browsing page 3 of an offset-paginated feed sees a record they already saw on page 2. What most likely happened?",
          options: [
            "New rows were inserted above their position, shifting everything down by the offset",
            "The database returned rows in a non-deterministic order because no index existed",
            "The paginator cached page 2 and replayed it",
            "`per_page` changed between the two requests",
          ],
          correctIndex: 0,
          explanation:
            "Offsets are positional, so concurrent inserts and deletes cause duplicates and skips. Cursor pagination is stable because the cursor refers to a row's key, not its position.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-pagination-q6",
          prompt: "`GET /api/users?status=active&page=2` returns `next_page_url` without the `status` filter. What fixes it?",
          options: [
            "`->withQueryString()` on the paginator",
            "`->withPath(request()->fullUrl())`",
            "`->appends('page')`",
            "Nothing — filters are intentionally stripped from pagination links",
          ],
          correctIndex: 0,
          explanation:
            "`withQueryString()` re-appends the current request's query parameters to generated links. `withPath()` only changes the base URI, and `appends()` takes the parameters you want added, not `page`.",
        },
        {
          id: "lv-api-pagination-q7",
          prompt: "Why clamp a client-supplied `per_page`?",
          options: [
            "An unbounded value lets one request select the whole table, hydrate every model and serialise it",
            "Laravel throws if `per_page` exceeds 100",
            "The paginator caches each distinct `per_page`, exhausting memory",
            "Values above 15 disable the index on the ordering column",
          ],
          correctIndex: 0,
          explanation:
            "`?per_page=1000000` is a cheap request that becomes an expensive query plus full ORM hydration plus serialisation. Validate it (`integer|min:1|max:100`) or ignore it entirely.",
        },
        {
          id: "lv-api-pagination-q8",
          prompt: "How do you customise the `links` or `meta` block of a paginated resource collection?",
          options: [
            "Define `paginationInformation($request, $paginated, $default)` on the resource and return a modified `$default`",
            "Override `toArray()` and rebuild the whole envelope",
            "Publish `config/pagination.php` and edit the `meta` template",
            "Call `->withMeta([...])` on the paginator",
          ],
          correctIndex: 0,
          explanation:
            "`paginationInformation` receives the already-built `links` and `meta` arrays so you can add or rename keys without reimplementing the envelope.",
        },
        {
          id: "lv-api-pagination-q9",
          prompt: "Even with `JsonResource::withoutWrapping()` set globally, a paginated resource collection still has a `data` key. Why?",
          options: [
            "Paginated responses need somewhere to put `links` and `meta`, so the records stay under `data`",
            "`withoutWrapping()` is ignored on collections of any kind",
            "It is a bug retained for backwards compatibility",
            "Because `paginate()` returns an object, not an array",
          ],
          correctIndex: 0,
          explanation:
            "The framework documents this explicitly: pagination metadata are siblings of the records, so the records must be nested. Unwrapping only applies when the payload stands alone.",
        },
        {
          id: "lv-api-pagination-q10",
          prompt: "An infinite-scroll mobile feed over a table with heavy insert traffic. Which paginator fits best, and why?",
          options: [
            "`cursorPaginate()` — stable under concurrent writes and constant cost at any depth",
            "`paginate()` — the client needs `last_page` to size the scrollbar",
            "`simplePaginate()` — it is the only one without a count query",
            "`paginate()` with a large `per_page` to reduce the number of requests",
          ],
          correctIndex: 0,
          explanation:
            "Infinite scroll never shows page numbers, so the one thing cursor pagination cannot do does not matter, and the two things it does best — stability and depth-independent cost — are exactly what the feed needs.",
        },
      ],
    },
    {
      id: "lv-api-versioning",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "API Versioning Strategies",
      summary:
        "Versioning is a way of buying time for consumers you cannot upgrade. The first question is therefore not \"URI or header?\" but \"is this change actually breaking?\" Adding an optional field, a new endpoint or a new enum value a client can ignore is additive; renaming a field, removing one, tightening validation, changing a type or changing pagination shape is not. Teams that treat additive evolution as the default ship far fewer versions.\n\nIn Laravel the common shapes are: a URI prefix (`Route::prefix('v1')`, or separate `routes/api_v1.php` files registered through `withRouting(then: ...)`), a media-type header (`Accept: application/vnd.acme.v2+json`) resolved in middleware, and a date-based header the way Stripe does it. URI prefixes win on debuggability — the version is visible in logs, curl commands and browser history — at the cost of violating the purist position that one resource should have one URI. Header versioning keeps URIs stable but is invisible in a server log unless you deliberately log it, and any caching layer needs `Vary: Accept` or it will serve v1 bodies to v2 clients.\n\nWhatever you choose, the real cost is downstream: `App\\Http\\Controllers\\Api\\V1` and `V2` namespaces, two sets of resources, two sets of form requests, and a test suite that has to cover both. Keep one shared domain layer and let the version-specific layer be only controllers, requests and resources, so the duplication stays at the presentation edge. Pick a deprecation policy at the same time you pick the scheme — a version with no sunset date never dies, and the `Deprecation` and `Sunset` response headers exist to announce one.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel Docs: Routing — Route Groups and Prefixes", url: "https://laravel.com/framework/docs/13.x/routing", kind: "docs" },
        { label: "Stripe: APIs as infrastructure — future-proofing at Stripe with versioning", url: "https://stripe.com/blog/api-versioning", kind: "article" },
        { label: "APIs You Won't Hate: API versioning has no \"right way\"", url: "https://apisyouwonthate.com/blog/api-versioning-has-no-right-way/", kind: "article" },
      ],
      video: {
        title: "Laravel API for Beginners - A Complete Guide",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=_iuxZygxz98",
        videoId: "_iuxZygxz98",
        startSeconds: 3734,
        chapterLabel: "API Versioning",
        durationLabel: "4:55:53",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-versioning-q1",
          prompt: "Which of these are breaking changes that justify a new API version? (Select all that apply.)",
          options: [
            "Renaming `created` to `created_at` in every response",
            "Removing a field that some clients still read",
            "Making a previously optional request field required",
            "Adding a new optional field to the response body",
            "Adding a brand-new endpoint",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Renames, removals and tightened input validation all break existing consumers. Additive changes — new optional response fields, new endpoints — do not, provided clients ignore unknown keys, which is worth stating in your own API's contract.",
        },
        {
          id: "lv-api-versioning-q2",
          prompt: "You keep `routes/api_v1.php` and `routes/api_v2.php`. How do you register both in Laravel 13?",
          options: [
            "Use the `then:` closure of `->withRouting()` to load each file inside its own prefixed, named route group",
            "List them as an array in the `api:` argument of `->withRouting()`",
            "Add them to `$routeMiddleware` in `app/Http/Kernel.php`",
            "Register them in `RouteServiceProvider::map()`",
          ],
          correctIndex: 0,
          explanation:
            "`withRouting(..., then: function () { Route::middleware('api')->prefix('api/v2')->group(base_path('routes/api_v2.php')); })` is the supported hook for extra route files. The Kernel and `RouteServiceProvider` no longer exist in the skeleton.",
        },
        {
          id: "lv-api-versioning-q3",
          prompt: "An edge cache sits in front of an API versioned by `Accept: application/vnd.acme.v2+json`. What header must the origin send?",
          options: [
            "`Vary: Accept`",
            "`Cache-Control: private`",
            "`Vary: Authorization`",
            "`Content-Version: 2`",
          ],
          correctIndex: 0,
          explanation:
            "Without `Vary: Accept` the cache keys only on the URL, so a v1 response cached for one client is served to a v2 client asking for the same path. This is the classic hidden cost of header-based versioning.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-versioning-q4",
          prompt: "What is the strongest practical argument for putting the version in the URI (`/api/v2/orders`)?",
          options: [
            "It is visible in logs, curl commands, bug reports and browser history, so the version in play is never ambiguous",
            "It is the only scheme that lets two versions coexist",
            "It avoids the need for separate controllers",
            "REST requires it",
          ],
          correctIndex: 0,
          explanation:
            "Debuggability is the honest advantage. Headers can also run versions side by side, they just hide which one a given request used. REST says nothing of the sort — Fielding's position is in fact against URI versioning.",
        },
        {
          id: "lv-api-versioning-q5",
          prompt: "Which layer should be duplicated per version, and which should not?",
          options: [
            "Duplicate controllers, form requests and resources; share models, services and the database schema",
            "Duplicate models and migrations; share controllers",
            "Duplicate everything, including the service layer, to keep versions fully isolated",
            "Duplicate nothing; branch on `$request->header('Api-Version')` inside each controller",
          ],
          correctIndex: 0,
          explanation:
            "Versioning is a presentation-layer concern. Duplicating domain logic doubles the bug surface; branching inside one controller produces exactly the tangle versioning was meant to avoid.",
        },
        {
          id: "lv-api-versioning-q6",
          prompt: "What distinguishes Stripe's date-based versioning from a plain `/v2` prefix?",
          options: [
            "Each account is pinned to a release date, and requests are transformed between the pinned version and current internal code",
            "It requires a new controller per calendar day",
            "It versions the database schema rather than the API surface",
            "It only applies to webhook payloads",
          ],
          correctIndex: 0,
          explanation:
            "Stripe keeps one current implementation and runs a chain of small transformers to present older shapes. It scales to many versions, at the cost of having to write and keep every transformer forever.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-versioning-q7",
          prompt: "Which response headers are the standard way to announce that an endpoint or version is going away?",
          options: [
            "`Deprecation` and `Sunset`",
            "`X-Api-Retired` and `X-Api-Expires`",
            "`Warning` and `Expires`",
            "`Retry-After` and `Link`",
          ],
          correctIndex: 0,
          explanation:
            "`Deprecation` marks the resource as deprecated and `Sunset` carries the date it stops working, both machine-readable. `Expires` and `Retry-After` are about caching and rate limiting.",
        },
        {
          id: "lv-api-versioning-q8",
          prompt:
            "A middleware reads `Accept: application/vnd.acme.v2+json` and sets a container binding for the version. What must the exception handler also do?",
          options: [
            "Make sure errors still render as JSON, since the `Accept` value is no longer `application/json`",
            "Re-run the version middleware so the error body is versioned",
            "Downgrade the response to v1 for safety",
            "Nothing — the handler is version-agnostic",
          ],
          correctIndex: 0,
          explanation:
            "`expectsJson()` recognises `application/json` and `+json` suffixed types, but any custom sniffing you add must agree. `shouldRenderJsonWhen()` is the hook for teaching the handler about your media type.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-versioning-q9",
          prompt: "Which policy most reliably reduces the number of versions a team has to maintain?",
          options: [
            "Make additive change the default, and require a written justification for anything breaking",
            "Release a new version every quarter on a fixed schedule",
            "Version every endpoint independently",
            "Never document the version, so clients cannot depend on it",
          ],
          correctIndex: 0,
          explanation:
            "Versions are created by breaking changes; the way to have fewer is to make fewer. A fixed cadence guarantees versions whether or not they are needed, and per-endpoint versioning multiplies the combinations a client must reason about.",
        },
        {
          id: "lv-api-versioning-q10",
          prompt: "Which tactics help you retire an old version rather than carrying it forever? (Select all that apply.)",
          options: [
            "Instrument per-version request counts so you know who is still on it",
            "Publish a sunset date up front and send `Deprecation`/`Sunset` headers",
            "Contact the top remaining consumers directly before the cut-off",
            "Silently start returning 410 once the new version ships",
            "Leave the old version undocumented so nobody new adopts it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Measure, announce, then chase the stragglers. Cutting without notice breaks production for real customers, and hiding the docs does not stop existing integrations — it only makes them harder to support.",
        },
      ],
    },
    {
      id: "lv-api-exceptions",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "Error Handling and the JSON Exception Shape",
      summary:
        "Every uncaught exception in a Laravel API becomes an HTTP response, and the quality of your API is largely the quality of that conversion. Since Laravel 11 there is no `app/Exceptions/Handler.php`; the whole thing is configured in `bootstrap/app.php` through `->withExceptions(function (Exceptions $exceptions) { ... })`. Reporting and rendering are separate concerns there: `report()` decides what gets logged or shipped to Sentry/Nightwatch, `render()` decides what the client sees.\n\nLaravel already maps its own exceptions sensibly. Route-model binding failures become 404, `AuthenticationException` 401, `AuthorizationException` 403, `ValidationException` 422, `ThrottleRequestsException` 429, and `abort(409, '...')` produces an `HttpException` with your status. Whether the body is HTML or JSON is decided from the request's `Accept` header, which is why the same failing endpoint returns a Blade error page in a browser and `{\"message\": \"...\"}` from a client that sends `Accept: application/json`. `shouldRenderJsonWhen()` overrides that decision — useful for an admin area or a custom media type.\n\nThe reporting side has the subtler tools. `dontReport()` and the `ShouldntReport` marker interface silence expected exceptions; `stopIgnoring(HttpException::class)` un-silences the ones Laravel hides by default (404s, CSRF 419s, origin-mismatch 403s); `level()` routes a type to a different log level; `context()` attaches global metadata; `throttle()` samples with a `Limit` or a `Lottery` so one failing dependency cannot generate a million Sentry events. The gotcha that ends up in incident reports: with `APP_DEBUG=true` the JSON error body includes the exception class, file, line and full stack trace. On a production API that is a free source map of your codebase — and the exact reason `APP_DEBUG` must be `false` in production.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Laravel Docs: Error Handling", url: "https://laravel.com/framework/docs/13.x/errors", kind: "docs" },
        { label: "RFC 9457: Problem Details for HTTP APIs", url: "https://www.rfc-editor.org/rfc/rfc9457.html", kind: "spec" },
        { label: "Laravel Docs: Responses", url: "https://laravel.com/framework/docs/13.x/responses", kind: "docs" },
      ],
      video: {
        title: "Laravel API: Consistent 422 Response from Exceptions?",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=oFzfX2c-IIg",
        videoId: "oFzfX2c-IIg",
        durationLabel: "4:34",
      },
      alternateVideos: [
        {
          title: "Laravel: Avoid Try-Catch In Every Method (What To Do Instead)",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=eTOScyTCkiY",
          videoId: "eTOScyTCkiY",
          durationLabel: "4:44",
        },
        {
          title: "Laravel API: Override \"Model Not Found\" with Exception",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=Tdh4oCe0rlc",
          videoId: "Tdh4oCe0rlc",
          durationLabel: "3:26",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-exceptions-q1",
          prompt: "Where do you register a custom rendering closure for an exception in Laravel 13?",
          options: [
            "In `bootstrap/app.php`, inside `->withExceptions(function (Exceptions $exceptions) { $exceptions->render(...); })`",
            "In `app/Exceptions/Handler.php`, inside the `register()` method",
            "In `config/exceptions.php`",
            "In a service provider's `boot()` method via `Exception::renderUsing()`",
          ],
          correctIndex: 0,
          explanation:
            "`withExceptions()` is the single entry point since Laravel 11. `app/Exceptions/Handler.php` is gone from the skeleton — seeing it in a tutorial dates that tutorial to Laravel 10 or earlier.",
        },
        {
          id: "lv-api-exceptions-q2",
          prompt:
            "```php\nRoute::get('/api/posts/{post}', fn (Post $post) => $post);\n```\nThe id does not exist and the client sends `Accept: application/json`. What comes back?",
          options: [
            "404 with `{\"message\": \"No query results for model [App\\\\Models\\\\Post] 99\"}`",
            "500 with a `ModelNotFoundException` trace",
            "404 with an HTML error page",
            "204 with an empty body",
          ],
          correctIndex: 0,
          explanation:
            "Route-model binding converts the `ModelNotFoundException` into a `NotFoundHttpException`, and the `Accept` header selects the JSON renderer. With `APP_DEBUG=false` the message is generic; with debug on it carries the model class and id.",
        },
        {
          id: "lv-api-exceptions-q3",
          prompt: "Which exceptions does Laravel map to these statuses out of the box? (Select all that apply.)",
          options: [
            "`ValidationException` to 422",
            "`AuthenticationException` to 401",
            "`AuthorizationException` to 403",
            "`ModelNotFoundException` to 422",
            "`ThrottleRequestsException` to 503",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Validation is 422, unauthenticated is 401 and unauthorised is 403. A missing model surfaces as 404, and exceeding a rate limit is 429 Too Many Requests, not 503.",
        },
        {
          id: "lv-api-exceptions-q4",
          prompt: "Your API returns a styled HTML error page instead of JSON when something fails. What is the most likely cause?",
          options: [
            "The client is not sending `Accept: application/json`, so `expectsJson()` is false",
            "`withExceptions()` has not been called at all",
            "The route is in `routes/web.php`, and only API routes can return JSON errors",
            "`APP_DEBUG` is false",
          ],
          correctIndex: 0,
          explanation:
            "Content negotiation drives the choice. Fix it on the client, or force it server-side with `shouldRenderJsonWhen(fn (Request $r) => $r->is('api/*') || $r->expectsJson())`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-exceptions-q5",
          prompt: "What does `$exceptions->stopIgnoring(HttpException::class)` change?",
          options: [
            "HTTP exceptions Laravel silently ignores — 404s, 419s, origin-mismatch 403s — start being reported to your logs and error tracker",
            "It stops those exceptions being rendered, returning a blank 500 instead",
            "It re-throws them so they bubble past the handler",
            "It suppresses them entirely, including rendering",
          ],
          correctIndex: 0,
          explanation:
            "`dontReport`/`ShouldntReport` silence reporting; `stopIgnoring` reverses the framework's own built-in silence list. Rendering is unaffected either way.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-exceptions-q6",
          prompt:
            "A flaky third-party integration throws thousands of the same exception per minute and floods your error tracker. Which `withExceptions` tool is designed for that?",
          options: [
            "`throttle()`, returning a `Limit` or `Lottery` for that exception type",
            "`dontReportDuplicates()`",
            "`level()` with `LogLevel::DEBUG`",
            "`dontReport()` for that class",
          ],
          correctIndex: 0,
          explanation:
            "`throttle()` rate-limits or samples reporting — `Limit::perMinute(300)->by($e->getMessage())`, or `Lottery::odds(1, 1000)`. `dontReportDuplicates()` only de-duplicates repeat `report()` calls on the *same instance*, and `dontReport()` would blind you completely.",
        },
        {
          id: "lv-api-exceptions-q7",
          prompt: "A production API returns a 500 whose JSON body contains `exception`, `file`, `line` and a full `trace`. What is wrong?",
          options: [
            "`APP_DEBUG` is `true` in production",
            "`APP_ENV` is set to `testing`",
            "The exception implements `Renderable`",
            "`stopIgnoring()` was called on `Throwable`",
          ],
          correctIndex: 0,
          explanation:
            "Debug mode adds the class, file, line and stack trace to error responses. On a public API that discloses paths, package versions and internal structure — it is the single most common Laravel information-disclosure finding.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-exceptions-q8",
          prompt: "What happens if a closure passed to `$exceptions->render()` returns nothing for a given exception?",
          options: [
            "Laravel falls back to its default rendering for that exception",
            "The response body is empty with status 200",
            "A `TypeError` is thrown from the handler",
            "The exception is re-thrown and becomes a 500",
          ],
          correctIndex: 0,
          explanation:
            "Returning `null` is the documented way to handle only some cases — for example JSON-ifying a `NotFoundHttpException` when `$request->is('api/*')` and leaving browser requests to the default page.",
        },
        {
          id: "lv-api-exceptions-q9",
          prompt: "Which are valid alternatives to configuring everything in `bootstrap/app.php`? (Select all that apply.)",
          options: [
            "Define a `render(Request $request)` method on the exception class itself",
            "Define a `report()` method on the exception class itself",
            "Implement `Illuminate\\Contracts\\Debug\\ShouldntReport` on the exception to suppress reporting",
            "Add a `#[NotReported]` attribute to the exception class",
            "Set a `public $status` property on any exception to control its HTTP status",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Reportable and renderable exceptions keep the behaviour next to the exception, and `ShouldntReport` is the marker interface for silence. There is no `#[NotReported]` attribute, and `$status` is specific to `ValidationException`, not a general mechanism — use `HttpException` or a custom `render()` for that.",
        },
        {
          id: "lv-api-exceptions-q10",
          prompt: "What is RFC 9457 (Problem Details) and how does it relate to Laravel's default error body?",
          options: [
            "A standard `application/problem+json` body with `type`, `title`, `status` and `detail`; Laravel's default `{\"message\": ...}` is simpler and not RFC 9457, but you can emit it from `render()`",
            "The RFC that defines the 422 status code, which Laravel implements directly",
            "A Laravel-specific convention for validation errors",
            "The specification Laravel's `respond()` method implements by default",
          ],
          correctIndex: 0,
          explanation:
            "RFC 9457 (which obsoleted RFC 7807) gives errors a machine-readable, extensible shape. Laravel does not use it by default; teams that want it build the body in a `render()` or `respond()` closure.",
        },
        {
          id: "lv-api-exceptions-q11",
          prompt: "Why is `$exceptions->respond()` a heavier hammer than `render()`?",
          options: [
            "It receives the already-built response for every unhandled exception, so one closure can rewrite all of them",
            "It runs before the exception is reported, so logging is skipped",
            "It replaces the router, not just the handler",
            "It only fires in production",
          ],
          correctIndex: 0,
          explanation:
            "`render()` is keyed by exception type; `respond()` sees the final `Response` regardless of type. It is the right place for a blanket rule like \"turn every 419 into a redirect\", and the wrong place for per-exception logic.",
        },
      ],
    },
    {
      id: "lv-api-validation",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "Validation Errors as 422 Responses",
      summary:
        "Validation in an API is a contract, not a convenience. When `ValidationException` is thrown and the request expects JSON, Laravel returns **422 Unprocessable Content** with a fixed shape: a human-readable `message` (the first failure, plus \"(and N more errors)\") and an `errors` object mapping each field to an array of messages. Nested fields are flattened into dot notation, so a failure on the third element of `users` appears as `users.2.email`. Clients can rely on that shape, which is why overriding it casually is a breaking change.\n\nWhen the request does *not* expect JSON, the very same exception produces a 302 redirect back with the errors flashed to the session. This is the single most common confusion for people writing an API client by hand: a POST that returns 302 and an HTML login page usually means the client forgot `Accept: application/json`, not that validation passed.\n\nForm requests are the idiomatic place to put rules, because validation then runs before the controller method is entered and the controller only ever sees valid input. Two details matter. First, `php artisan make:request` generates `authorize(): bool { return false; }` — a freshly generated form request rejects everything with a 403 until you change it, and that is by design, not a bug. Second, `authorize()` returning false throws an `AuthorizationException` (403), which is semantically different from a validation failure (422): authorisation answers \"may you\", validation answers \"is this well-formed\". Round it out with `prepareForValidation()` for normalisation, `$request->safe()->only([...])` so only validated keys reach `Model::create`, and `stopOnFirstFailure` when you would rather fail fast than run twelve rules including two `exists` queries.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel Docs: Validation", url: "https://laravel.com/framework/docs/13.x/validation", kind: "docs" },
        { label: "MDN: 422 Unprocessable Content", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/422", kind: "docs" },
        { label: "Laravel Docs: Requests — Content Negotiation", url: "https://laravel.com/framework/docs/13.x/requests", kind: "docs" },
      ],
      video: {
        title: "Laravel API for Beginners - A Complete Guide",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=_iuxZygxz98",
        videoId: "_iuxZygxz98",
        startSeconds: 6221,
        chapterLabel: "Form Request classes",
        durationLabel: "4:55:53",
      },
      alternateVideos: [
        {
          title: "Laravel API for Beginners - A Complete Guide",
          channel: "The Codeholic",
          url: "https://www.youtube.com/watch?v=_iuxZygxz98",
          videoId: "_iuxZygxz98",
          startSeconds: 4685,
          chapterLabel: "Basics of Validation & Status Codes",
          durationLabel: "4:55:53",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-validation-q1",
          prompt: "What status and body shape does a failed `$request->validate()` produce for a request that expects JSON?",
          options: [
            "422 with `{\"message\": \"…\", \"errors\": {\"field\": [\"…\"]}}`",
            "400 with `{\"errors\": [\"…\"]}`",
            "422 with a flat `{\"field\": \"message\"}` object",
            "409 with `{\"message\": \"…\"}`",
          ],
          correctIndex: 0,
          explanation:
            "422 Unprocessable Content, with `message` summarising and `errors` mapping each field to an *array* of messages — a field can fail more than one rule.",
        },
        {
          id: "lv-api-validation-q2",
          prompt:
            "A hand-written client POSTs JSON to a validated endpoint and gets a 302 redirect with an HTML body. What is wrong?",
          options: [
            "The client is not sending `Accept: application/json`, so Laravel takes the redirect-and-flash branch",
            "The route is missing the `api` middleware group",
            "Validation passed, and the controller redirected",
            "The `Content-Type` must be `multipart/form-data` for validation to return JSON",
          ],
          correctIndex: 0,
          explanation:
            "`ValidationException` renders as 422 JSON only when `expectsJson()` is true. Sending the right `Accept` header (or `X-Requested-With: XMLHttpRequest`) is the fix; `Content-Type` describes the request body and does not affect this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-validation-q3",
          prompt:
            "A rule fails on `users.*.email` for the third element of the array. What key appears in the `errors` object?",
          options: ["`users.2.email`", "`users[2][email]`", "`users.*.email`", "`email`"],
          correctIndex: 0,
          explanation:
            "Nested keys are flattened to dot notation with the concrete index substituted for the wildcard. Clients that build per-field error UIs have to parse that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-validation-q4",
          prompt:
            "You run `php artisan make:request StorePostRequest`, add rules, type-hint it in the controller, and every request returns 403. Why?",
          options: [
            "The generated `authorize()` returns `false`; you have to implement the real check",
            "Form requests require a policy to be registered before they run",
            "The `api` middleware group blocks form requests",
            "`authorize()` must return a `Response`, not a `bool`, in Laravel 13",
          ],
          correctIndex: 0,
          explanation:
            "The stub is deliberately closed by default — a generated request denies everything until you write the authorisation rule (or `return true` if the route's middleware already handles it).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-validation-q5",
          prompt: "Which status does a form request's `authorize()` returning `false` produce, and why is it not 422?",
          options: [
            "403 — authorisation asks \"may you do this\", which is a different question from \"is the payload well-formed\"",
            "422 — all form-request failures are validation failures",
            "401 — the user must authenticate first",
            "400 — the request is malformed",
          ],
          correctIndex: 0,
          explanation:
            "`failedAuthorization()` throws `AuthorizationException`, rendered as 403. Conflating the two hides a real distinction: a 422 tells the client to fix the payload, a 403 tells it not to bother retrying.",
        },
        {
          id: "lv-api-validation-q6",
          prompt: "Which of these are legitimate ways to change the JSON error response for validation? (Select all that apply.)",
          options: [
            "Override `failedValidation(Validator $validator)` on the form request and throw your own `HttpResponseException`",
            "Register a `render()` closure for `ValidationException` in `bootstrap/app.php`",
            "Set `public $status = 400;` on a custom exception extending `ValidationException`",
            "Publish `config/validation.php` and edit the response template",
            "Set `'error_format' => 'rfc9457'` in `config/app.php`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`failedValidation` is the per-request hook, `render()` the global one, and `ValidationException::$status` is a real public property. There is no `config/validation.php` response template and no error-format config key.",
        },
        {
          id: "lv-api-validation-q7",
          prompt: "What does `prepareForValidation()` on a form request let you do?",
          options: [
            "Normalise or merge input — trim, cast, slugify, inject a route value — before the rules run",
            "Run the rules a second time after the controller finishes",
            "Change the HTTP status of the failure response",
            "Skip validation for administrators",
          ],
          correctIndex: 0,
          explanation:
            "It calls `$this->merge([...])` before validation. Doing the normalisation in the controller instead means the rules run against raw input and your \"clean\" value never gets validated.",
        },
        {
          id: "lv-api-validation-q8",
          prompt: "Why prefer `$request->safe()->only(['title', 'body'])` over `$request->all()` when creating a model?",
          options: [
            "It passes only keys that were actually validated, so unexpected input cannot reach a fillable column",
            "It is faster because it skips the request object",
            "It casts every value to a string",
            "It is required — `create()` rejects a plain array",
          ],
          correctIndex: 0,
          explanation:
            "`validated()`/`safe()` return the validated subset. `all()` includes anything the client sent, so a mass-assignment gap in `$fillable` becomes exploitable.",
        },
        {
          id: "lv-api-validation-q9",
          prompt: "When is `stopOnFirstFailure()` worth using?",
          options: [
            "When the ruleset is expensive — several `exists` or `unique` rules each costing a query — and one failure is enough to reject the request",
            "Whenever the client is a mobile app",
            "When you want all errors returned but sorted by severity",
            "When validating file uploads, where multiple errors are not supported",
          ],
          correctIndex: 0,
          explanation:
            "It trades error completeness for cost. Forms usually want every error at once; a machine-to-machine endpoint with database-backed rules often does not.",
        },
        {
          id: "lv-api-validation-q10",
          prompt: "Which of these does `422 Unprocessable Content` communicate, as opposed to `400 Bad Request`?",
          options: [
            "The syntax was understood but the content failed the application's semantic rules",
            "The request body could not be parsed at all",
            "The client must authenticate before retrying",
            "The server understood the request but will never fulfil it",
          ],
          correctIndex: 0,
          explanation:
            "400 is for a malformed request — broken JSON, for example. 422 says the document parsed fine but the values are wrong, which is exactly what a validator reports.",
        },
      ],
    },
    {
      id: "lv-api-rate-limiting",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "Rate Limiting with `RateLimiter` and Named Limiters",
      summary:
        "Rate limiting protects a shared resource from one caller, and Laravel's model separates *defining* a limit from *applying* it. You define named limiters in `AppServiceProvider::boot()` with `RateLimiter::for('uploads', fn (Request $r) => Limit::perMinute(60)->by($r->user()?->id ?: $r->ip()))`, and apply them with the `throttle:uploads` middleware on a route, group or controller attribute. The closure receives the request, so the limit can vary per caller — `Limit::none()` for an internal service, a smaller bucket for guests.\n\nThe `by()` value is the whole design. Omit it and the limiter is one global bucket shared by every caller, which is occasionally what you want (protecting a downstream API) and usually a bug. Return an array of limits to enforce several windows at once — a per-minute burst limit and a per-day quota — but prefix the `by()` keys (`'minute:'.$id`, `'day:'.$id`), because identical keys across limits collide in the cache. Laravel 13 adds response-based limiting: `->after(fn (Response $r) => $r->status() === 404)` counts only the responses you care about, which is how you throttle enumeration attempts without punishing successful requests.\n\nOperationally: exceeding a limit throws `ThrottleRequestsException` (429 \"Too Many Attempts.\"), and every response carries `X-RateLimit-Limit` and `X-RateLimit-Remaining`, with `Retry-After` and `X-RateLimit-Reset` added on the 429. The counters live in your cache, so a `file` or `array` driver across several web nodes gives each node its own limit; set `cache.limiter` to `redis` and call `$middleware->throttleWithRedis()` for an atomic, Lua-backed implementation. And remember that API routes have no throttling at all until you add it. For non-HTTP work — an outbound email, a webhook retry — the same facade offers `attempt()`, `increment()`, `remaining()`, `availableIn()` and `clear()` directly.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel Docs: Routing — Rate Limiting", url: "https://laravel.com/framework/docs/13.x/routing", kind: "docs" },
        { label: "Laravel Docs: Rate Limiting (the cache abstraction)", url: "https://laravel.com/framework/docs/13.x/rate-limiting", kind: "docs" },
        { label: "IETF: RateLimit header fields for HTTP", url: "https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers", kind: "spec" },
        { label: "Cloudflare: How we built rate limiting capable of scaling to millions of domains", url: "https://blog.cloudflare.com/counting-things-a-lot-of-different-things/", kind: "article" },
      ],
      video: {
        title: "Exploring Laravel Rate Limiters: Control Traffic & Secure Actions ⛔",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=5YlJ8DllTFw",
        videoId: "5YlJ8DllTFw",
        durationLabel: "6:42",
      },
      alternateVideos: [
        {
          title: "Laravel API for Beginners - A Complete Guide",
          channel: "The Codeholic",
          url: "https://www.youtube.com/watch?v=_iuxZygxz98",
          videoId: "_iuxZygxz98",
          startSeconds: 10433,
          chapterLabel: "Rate Limiting",
          durationLabel: "4:55:53",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-rate-limiting-q1",
          prompt: "Where are named rate limiters defined in a current Laravel application?",
          options: [
            "In the `boot()` method of `AppServiceProvider`, via `RateLimiter::for(...)`",
            "In `RouteServiceProvider::configureRateLimiting()`",
            "In `config/rate-limiting.php`",
            "Inline on each route via `Route::rateLimit(...)`",
          ],
          correctIndex: 0,
          explanation:
            "`RouteServiceProvider` left the skeleton in Laravel 11, and the docs now show limiters registered from `AppServiceProvider::boot()`. There is no config file for them.",
        },
        {
          id: "lv-api-rate-limiting-q2",
          prompt:
            "```php\nRateLimiter::for('reports', fn (Request $request) => Limit::perMinute(60));\n```\nWhat does this limit?",
          options: [
            "Every caller together — 60 requests per minute across the entire application",
            "Each IP address to 60 requests per minute",
            "Each authenticated user to 60 requests per minute",
            "Each route in the group to 60 requests per minute, independently",
          ],
          correctIndex: 0,
          explanation:
            "With no `by()` there is a single shared bucket. That is a legitimate way to protect a fragile downstream dependency and a serious bug if you meant per-user — one noisy client then locks out everyone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-rate-limiting-q3",
          prompt:
            "```php\nRateLimiter::for('uploads', fn (Request $r) => [\n    Limit::perMinute(10)->by($r->user()->id),\n    Limit::perDay(1000)->by($r->user()->id),\n]);\n```\nWhat is wrong here?",
          options: [
            "Both limits use the same `by()` key, so they share a cache entry and interfere — prefix them, e.g. `'minute:'.$id` and `'day:'.$id`",
            "You cannot return an array of limits; only one `Limit` is allowed",
            "`perDay` does not exist",
            "Nothing — this is the documented pattern",
          ],
          correctIndex: 0,
          explanation:
            "The docs call this out explicitly: when several limits are segmented by identical `by()` values, prefix the values so each limit gets its own counter.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-rate-limiting-q4",
          prompt: "Which headers does Laravel's throttle middleware add? (Select all that apply.)",
          options: [
            "`X-RateLimit-Limit` on every throttled response",
            "`X-RateLimit-Remaining` on every throttled response",
            "`Retry-After` on the 429",
            "`X-RateLimit-Reset` on the 429",
            "`Rate-Limit-Policy` on every throttled response",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Limit and remaining go on every response; `Retry-After` and `X-RateLimit-Reset` are added once the caller is blocked. The IETF `RateLimit-Policy` header is from a draft standard Laravel does not implement.",
        },
        {
          id: "lv-api-rate-limiting-q5",
          prompt: "What does Laravel 13's `->after(fn (Response $response) => $response->status() === 404)` on a `Limit` do?",
          options: [
            "Only counts responses matching the closure toward the limit, so you can throttle 404 enumeration without penalising successful requests",
            "Runs the closure after the rate limit is exceeded",
            "Delays each response by the returned number of seconds",
            "Clears the limiter after a matching response",
          ],
          correctIndex: 0,
          explanation:
            "Response-based rate limiting inverts the usual model: the request is always served, and only the responses you nominate increment the counter. Limiting consecutive 404s is the documented use case.",
        },
        {
          id: "lv-api-rate-limiting-q6",
          prompt: "Your app runs on four web nodes behind a load balancer with `CACHE_STORE=file`. What is the effective limit of a `Limit::perMinute(60)` limiter?",
          options: [
            "Up to 240 per minute, because each node keeps its own counters on local disk",
            "60 per minute — the throttle middleware always uses a shared store",
            "Unlimited — the file driver cannot store counters",
            "60 per minute, but only if sticky sessions are enabled",
          ],
          correctIndex: 0,
          explanation:
            "Rate limiting is only as shared as the cache behind it. Point `cache.limiter` at Redis (and use `throttleWithRedis()` for the atomic implementation) before you trust the numbers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-rate-limiting-q7",
          prompt: "How do you exempt internal service accounts from a limiter?",
          options: [
            "Return `Limit::none()` from the limiter closure for those callers",
            "Return `null` from the closure",
            "Return `Limit::perMinute(PHP_INT_MAX)`",
            "Add `->except('internal')` to the throttle middleware",
          ],
          correctIndex: 0,
          explanation:
            "`Limit::none()` is the documented unlimited limit. It reads clearly and avoids relying on an arbitrary huge number that still allocates a counter.",
        },
        {
          id: "lv-api-rate-limiting-q8",
          prompt: "You need to limit how often a user can send a message, from inside a service class rather than on a route. Which API fits?",
          options: [
            "`RateLimiter::attempt('send-message:'.$user->id, 5, fn () => …)` on the `RateLimiter` facade",
            "Apply the `throttle` middleware to the service class",
            "Wrap the call in `Route::middleware('throttle:messages')`",
            "There is no non-HTTP API; you must go through a route",
          ],
          correctIndex: 0,
          explanation:
            "The facade's `attempt()`, `increment()`, `remaining()`, `availableIn()` and `clear()` are a general cache-backed limiter usable anywhere — jobs, commands, service classes.",
        },
        {
          id: "lv-api-rate-limiting-q9",
          prompt:
            "Under heavy concurrency, why does the documentation prefer checking the value returned by `RateLimiter::increment(...)` over calling `tooManyAttempts()` and then `increment()`?",
          options: [
            "`increment()` is atomic on the redis, memcached and database stores, so each concurrent request gets a unique count; the two-step version has a race between the check and the write",
            "`tooManyAttempts()` is deprecated",
            "`increment()` is faster because it skips a network round trip",
            "`tooManyAttempts()` resets the window each time it is called",
          ],
          correctIndex: 0,
          explanation:
            "Check-then-act is a classic TOCTOU race: several requests can all read \"under the limit\" before any of them writes. A single atomic increment returning the new count closes it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-rate-limiting-q10",
          prompt: "What status and exception does exceeding a throttle produce?",
          options: [
            "429, from `ThrottleRequestsException`",
            "503, from `ServiceUnavailableHttpException`",
            "403, from `AccessDeniedHttpException`",
            "429, but only if you registered a `response()` callback on the limit",
          ],
          correctIndex: 0,
          explanation:
            "429 Too Many Requests with the message \"Too Many Attempts.\" is the default. `->response(...)` lets you replace the body; the headers are passed into that callback so you can keep them.",
        },
        {
          id: "lv-api-rate-limiting-q11",
          prompt: "Which are reasonable segmentation keys for a public API's limiter? (Select all that apply.)",
          options: [
            "The authenticated user or API key id, falling back to IP for guests",
            "The API key id for machine clients, so one customer's traffic cannot starve another's",
            "A route-specific prefix plus the caller id, so an expensive endpoint has its own budget",
            "The `User-Agent` header, since each client library sends a distinct one",
            "A random value per request, to spread load evenly",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Good keys identify the party you are holding accountable and are hard to forge. `User-Agent` is attacker-controlled and shared by thousands of legitimate clients, and a random key means no limiting at all.",
        },
      ],
    },
    {
      id: "lv-api-http-client",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "The HTTP Client: Calling Other Services",
      summary:
        "The `Http` facade is Laravel's wrapper around Guzzle — a hard dependency of the framework since Laravel 13, so there is nothing to install. Its most consequential design decision is that it does **not** throw on 4xx or 5xx. `Http::get($url)` returns a `Response` object you interrogate with `successful()`, `failed()`, `clientError()`, `serverError()`, `status()` and `json()`. If you want exceptions you ask for them: `->throw()`, `->throwIf($condition)`, `->throwIfStatus(403)`, or `onError(fn ($r) => ...)`. Code that does `$data = Http::get($url)->json()['items']` and never checks the status will happily iterate `null` the first time the upstream returns a 500.\n\nTimeouts and retries are the next thing people get wrong. The default is 30 seconds for the whole request and 10 to establish the connection, both of which are far too generous inside a web request that itself has a budget — a slow dependency turns into exhausted PHP-FPM workers. `retry(3, 100)` re-attempts on client or server errors with a 100 ms gap, and a closure as the second argument gives you exponential backoff; `retry(..., throw: false)` returns the last response instead of throwing, though a `ConnectionException` still escapes. Retrying is only safe when the call is idempotent — replaying a `POST /charges` is how you double-charge a customer.\n\nFor fan-out, `Http::pool(fn (Pool $pool) => [...], concurrency: 5)` issues requests in parallel, indexed by position or by `as('name')`. Note the sharp edge: a pooled request that fails to connect puts a `ConnectionException` *object* in the results array rather than throwing, so you must check `instanceof Throwable` before calling `failed()`. In tests, `Http::fake()` stubs everything, `Http::fake(['github.com/*' => Http::response(...)])` stubs by pattern, `Http::sequence()` scripts a series, and `Http::preventStrayRequests()` turns any un-faked call into an exception — the single best guard against a test suite that quietly hits the real internet.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel Docs: HTTP Client", url: "https://laravel.com/framework/docs/13.x/http-client", kind: "docs" },
        { label: "Laravel Docs: Mocking", url: "https://laravel.com/framework/docs/13.x/mocking", kind: "docs" },
        { label: "Laravel News: Laravel HTTP client", url: "https://laravel-news.com/laravel-http-client", kind: "article" },
      ],
      video: {
        title: "Laravel: Top 5 Mistakes with 3rd-Party API Errors in HTTP Client",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=yxcNpZ9zAvs",
        videoId: "yxcNpZ9zAvs",
        durationLabel: "12:47",
      },
      alternateVideos: [
        {
          title: "Laravel and External APIs: Get Data with HTTP Client",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=oEDDZsmMLc0",
          videoId: "oEDDZsmMLc0",
          durationLabel: "6:35",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-http-client-q1",
          prompt:
            "```php\n$items = Http::get('https://api.example.com/items')->json()['items'];\n```\nThe upstream returns 503 with an HTML error page. What happens?",
          options: [
            "No exception; `json()` returns `null` and the array access fails or yields `null`",
            "An `Illuminate\\Http\\Client\\RequestException` is thrown",
            "A `ConnectionException` is thrown",
            "Laravel retries automatically until it succeeds",
          ],
          correctIndex: 0,
          explanation:
            "The client does not throw on error statuses. You have to opt in with `->throw()` or check `successful()`/`failed()` — this is the most common bug in Laravel integration code.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-http-client-q2",
          prompt: "What are the HTTP client's default `timeout` and `connectTimeout` values?",
          options: [
            "30 seconds and 10 seconds",
            "10 seconds and 30 seconds",
            "60 seconds and 60 seconds",
            "There are no defaults; a request waits indefinitely",
          ],
          correctIndex: 0,
          explanation:
            "30 s total, 10 s to connect. Inside a web request that is usually far too long — a dependency that hangs for 30 s ties up a worker for 30 s.",
        },
        {
          id: "lv-api-http-client-q3",
          prompt: "Which methods make the client raise an exception on an error response? (Select all that apply.)",
          options: [
            "`->throw()`",
            "`->throwIf($condition)`",
            "`->throwIfStatus(403)`",
            "`->json()`",
            "`->failed()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The `throw*` family raises `RequestException`. `json()` decodes the body and `failed()` returns a boolean; neither throws.",
        },
        {
          id: "lv-api-http-client-q4",
          prompt: "`Http::retry(3, 100, throw: false)->post($url)`. Every attempt fails with a connection error. What happens?",
          options: [
            "A `ConnectionException` is still thrown — `throw: false` only suppresses `RequestException` for error responses",
            "The last `Response` object is returned with status 0",
            "`null` is returned",
            "The call blocks and retries indefinitely",
          ],
          correctIndex: 0,
          explanation:
            "The docs are explicit: if all attempts fail because of a connection issue, `ConnectionException` is thrown regardless of the `throw` argument. There is no response to hand back.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-http-client-q5",
          prompt: "Which request is unsafe to wrap in a blanket `retry()`?",
          options: [
            "`POST /v1/charges` with no idempotency key",
            "`GET /v1/customers/cus_123`",
            "`PUT /v1/customers/cus_123` with the full representation",
            "`DELETE /v1/customers/cus_123`",
          ],
          correctIndex: 0,
          explanation:
            "A POST that creates a resource is not idempotent: a retry after a timed-out-but-successful request creates a second charge. Send an idempotency key so the server can de-duplicate, or do not retry.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-http-client-q6",
          prompt:
            "```php\n$responses = Http::pool(fn (Pool $pool) => [\n    $pool->as('a')->get($urlA),\n    $pool->as('b')->get($urlB),\n]);\n```\nThe host for `$urlB` does not resolve. What is in `$responses['b']`?",
          options: [
            "An `Illuminate\\Http\\Client\\ConnectionException` instance, not a `Response`",
            "A `Response` with status 0",
            "`null`",
            "Nothing — the whole `pool()` call throws",
          ],
          correctIndex: 0,
          explanation:
            "Connection-level failures inside a pool are returned, not thrown, so a single bad host does not abort the batch. Check `instanceof Throwable` before treating an entry as a response.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-http-client-q7",
          prompt: "What does the `concurrency:` argument to `Http::pool()` control?",
          options: [
            "The maximum number of requests in flight at once while the pool is processed",
            "The number of retries per pooled request",
            "How many PHP processes are forked",
            "The pool's overall timeout in seconds",
          ],
          correctIndex: 0,
          explanation:
            "It bounds in-flight requests, which matters when you are fanning out to a service with its own rate limit — 200 parallel calls is a good way to get yourself throttled.",
        },
        {
          id: "lv-api-http-client-q8",
          prompt: "What does `Http::preventStrayRequests()` do in a test?",
          options: [
            "Any request without a matching fake throws instead of hitting the network",
            "It records requests but lets them through",
            "It fakes every request with a 200 empty body",
            "It disables the HTTP client entirely for the test run",
          ],
          correctIndex: 0,
          explanation:
            "Without it, an un-faked URL makes a real call — slow, flaky and occasionally destructive. `Http::fake()` with no arguments is the \"fake everything as 200 empty\" option.",
        },
        {
          id: "lv-api-http-client-q9",
          prompt: "You need to script three successive responses from one endpoint in a test. Which tool fits?",
          options: [
            "`Http::fake(['api.example.com/*' => Http::sequence()->push(...)->push(...)->pushStatus(404)])`",
            "Three separate `Http::fake()` calls in order",
            "`Http::fake()` with an array of three responses under the same key",
            "`Http::assertSentInOrder()`",
          ],
          correctIndex: 0,
          explanation:
            "`Http::sequence()` (or `Http::fakeSequence()` when the URL does not matter) returns each pushed response in turn and throws once exhausted, unless you supply `whenEmpty()`. `assertSentInOrder` is an assertion, not a stub.",
        },
        {
          id: "lv-api-http-client-q10",
          prompt: "What problem does `Http::macro('github', fn () => Http::baseUrl('https://api.github.com')->withToken(config('services.github.token')))` solve?",
          options: [
            "It defines a named, pre-configured client so base URL, auth and headers are not re-typed at every call site",
            "It caches responses from that host",
            "It registers the host with `preventStrayRequests`",
            "It makes calls to that host asynchronous",
          ],
          correctIndex: 0,
          explanation:
            "Macros give you `Http::github()->get('/user')` and one place to change a header or a token. They are configuration reuse, not caching or concurrency.",
        },
        {
          id: "lv-api-http-client-q11",
          prompt: "Which are sensible defaults when calling a third-party API from inside a user-facing HTTP request? (Select all that apply.)",
          options: [
            "A timeout well below your own request budget, so a slow dependency cannot exhaust workers",
            "Retries only on idempotent calls, with backoff rather than a tight loop",
            "An explicit `throw()` or status check so failures surface instead of producing `null`",
            "The default 30-second timeout, since a longer wait means fewer failures",
            "Retrying on 422, since validation errors are usually transient",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Short timeouts, selective retries with backoff and explicit failure handling. A long timeout converts a slow dependency into an outage of your own, and a 422 means the payload is wrong — retrying it unchanged will fail identically.",
        },
      ],
    },
    {
      id: "lv-api-docs",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "Documenting the API: Scribe, Scramble and OpenAPI",
      summary:
        "Hand-written API documentation is wrong within a sprint. The only documentation that stays true is documentation generated from, or verified against, the code — which in practice means producing an OpenAPI description (currently 3.2) and treating it as the artefact. A spec is not just a human-readable page: it drives client SDK generation, mock servers, contract tests and API gateways, which is why \"we have a Postman collection\" is not the same thing.\n\nThe Laravel ecosystem has two dominant approaches. **Scribe** is annotation-driven: PHPDoc tags and attributes on controllers describe parameters and responses, and it can produce a real example response by actually calling the endpoint against your test database. That gives accurate bodies without writing them twice, but it means generation has side effects, so it needs a safe environment. **Scramble** is inference-driven: it reads your routes, form requests, resources and type hints and derives the OpenAPI document with no annotations at all. Zero-annotation is wonderful until the inference is wrong, at which point you are adding annotations anyway. Annotation-first packages such as L5-Swagger sit at the other extreme: maximum control, maximum drift risk.\n\nWhichever you pick, wire it into CI. Regenerate the spec on every build and fail if it differs from the committed one, so an undocumented breaking change cannot merge. Better still, validate real responses against the schema inside your feature tests. And document the parts generators cannot infer: authentication, rate limits, pagination conventions, error shapes and the deprecation policy. Those are the things integrators actually get stuck on.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "OpenAPI Specification 3.2.0", url: "https://spec.openapis.org/oas/v3.2.0.html", kind: "spec" },
        { label: "Scribe: documentation for Laravel APIs", url: "https://scribe.knuckles.wtf/laravel", kind: "docs" },
        { label: "Scramble: modern Laravel API documentation", url: "https://scramble.dedoc.co/", kind: "docs" },
        { label: "knuckleswtf/scribe", url: "https://github.com/knuckleswtf/scribe", kind: "repo" },
      ],
      video: {
        title: "Laravel 13 Demo: JSON:API + Spatie Query Builder + Scramble API Docs",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=vrAdzOPSFiE",
        videoId: "vrAdzOPSFiE",
        durationLabel: "13:48",
      },
      alternateVideos: [
        {
          title: "Ep33 - Laravel API Documentation Generator with Scribe | Laravel API Server",
          channel: "Acadea.io",
          url: "https://www.youtube.com/watch?v=a3nQrBEtufw",
          videoId: "a3nQrBEtufw",
          durationLabel: "12:35",
        },
        {
          title: "Laravel API Docs Showdown: Scribe vs. Scramble vs. Swagger",
          channel: "WebDevMatics",
          url: "https://www.youtube.com/watch?v=p1QAJFXsz8E",
          videoId: "p1QAJFXsz8E",
          durationLabel: "3:23",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-docs-q1",
          prompt: "What is the practical difference between publishing an OpenAPI document and publishing a Postman collection?",
          options: [
            "OpenAPI is a machine-readable contract that drives SDK generation, mock servers and contract tests; a collection is mainly a set of saved example requests",
            "They are interchangeable formats with different file extensions",
            "A Postman collection can describe schemas, while OpenAPI cannot",
            "OpenAPI only describes authentication; collections describe endpoints",
          ],
          correctIndex: 0,
          explanation:
            "A collection is great for exploration and poor as a contract. Most generators, including Scribe, can emit both — but only the spec is consumable by tooling downstream.",
        },
        {
          id: "lv-api-docs-q2",
          prompt: "How does Scribe's \"response calls\" strategy produce example responses?",
          options: [
            "It actually issues requests against your endpoints in a configured environment and records the real bodies",
            "It parses the resource class and infers the shape statically",
            "It asks an LLM to invent plausible payloads",
            "It reads example bodies from your feature tests' assertions",
          ],
          correctIndex: 0,
          explanation:
            "Executing the endpoint is what makes the examples accurate. It is also why generation has side effects and should run against a disposable database, not production.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-docs-q3",
          prompt: "What is Scramble's defining characteristic compared with annotation-driven generators?",
          options: [
            "It infers the OpenAPI document from routes, form requests, resources and type hints, requiring no annotations by default",
            "It requires a PHPDoc block on every controller method",
            "It only documents routes registered in `routes/api.php`",
            "It generates the spec at runtime on each request",
          ],
          correctIndex: 0,
          explanation:
            "Zero-annotation inference is its selling point. Where inference falls short — a dynamic response shape, a union return — you add hints, so it is a spectrum rather than a binary.",
        },
        {
          id: "lv-api-docs-q4",
          prompt: "Which practices actually prevent documentation drift? (Select all that apply.)",
          options: [
            "Regenerate the spec in CI and fail the build if it differs from the committed file",
            "Validate real responses against the schema inside feature tests",
            "Derive the docs from the same code that serves the requests, rather than a parallel document",
            "Schedule a quarterly documentation review",
            "Keep the docs in a wiki so anyone can fix them",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Drift is prevented by automation that fails, not by good intentions. A quarterly review and an editable wiki both let a breaking change ship undocumented on day one.",
        },
        {
          id: "lv-api-docs-q5",
          prompt: "Which details do generators typically *not* infer, and therefore need writing by hand?",
          options: [
            "Authentication flow, rate limits, pagination conventions, error shapes and the deprecation policy",
            "Route paths and HTTP methods",
            "Request body field names from a form request's `rules()`",
            "Path parameter names",
            "The base URL",
          ],
          correctIndex: 0,
          explanation:
            "Structure is inferable; policy is not. Integrators get stuck on how to authenticate, what happens at the limit, and how errors are shaped — exactly the parts no generator can read off the code.",
        },
        {
          id: "lv-api-docs-q6",
          prompt: "Which OpenAPI version is current as of this writing, and why does the number matter?",
          options: [
            "3.2 — tooling support varies by version, so the spec you emit must be one your consumers' generators can read",
            "2.0 — it is still the only version with broad tooling",
            "4.0 — every generator has moved to it",
            "The version is cosmetic; all tooling accepts any of them",
          ],
          correctIndex: 0,
          explanation:
            "OpenAPI 3.2 is the current release. Version choice is a compatibility decision: some client generators still lag, which is a real constraint when your consumers are external.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-docs-q7",
          prompt: "A team wants generated docs but the generator's example responses are wrong for one endpoint. What is the healthiest fix?",
          options: [
            "Add an explicit annotation or example for that endpoint, keeping inference for the rest",
            "Abandon generation and hand-write the whole document",
            "Delete the endpoint from the docs",
            "Change the endpoint's response to match what the generator produced",
          ],
          correctIndex: 0,
          explanation:
            "Generators are designed to be overridden per endpoint. Falling back to hand-writing everything reintroduces drift across the other ninety endpoints that were fine.",
        },
        {
          id: "lv-api-docs-q8",
          prompt: "Why is an OpenAPI document useful even to a team with no external consumers?",
          options: [
            "It enables generated typed clients for your own frontend or mobile app, plus mock servers so those teams can work before the backend lands",
            "It is required for the API to accept JSON request bodies",
            "Laravel validates incoming requests against it automatically",
            "It replaces the need for feature tests",
          ],
          correctIndex: 0,
          explanation:
            "Internal consumers benefit from generated clients and mocks just as much as external ones. Laravel does nothing with the spec at runtime, and it is no substitute for tests.",
        },
        {
          id: "lv-api-docs-q9",
          prompt: "Which statement about Scribe and Scramble is accurate?",
          options: [
            "Both can emit an OpenAPI document; they differ mainly in how much you have to tell them versus how much they infer",
            "Only Scribe can emit OpenAPI; Scramble produces HTML only",
            "Only Scramble can emit OpenAPI; Scribe produces a Postman collection only",
            "Neither emits OpenAPI; both produce proprietary formats",
          ],
          correctIndex: 0,
          explanation:
            "Output format is not the differentiator — both produce OpenAPI plus a browsable HTML site. The real choice is annotation effort versus inference risk.",
        },
      ],
    },
    {
      id: "lv-api-cors",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "CORS for Laravel APIs",
      summary:
        "Laravel handles CORS with `Illuminate\\Http\\Middleware\\HandleCors`, which sits in the **global** middleware stack — before routing and before any route middleware. That ordering is deliberate: a preflight `OPTIONS` request carries no credentials, so if it had to pass through `auth:sanctum` first it would come back 401 and the browser would block the real request. It also means the middleware answers preflights for you; you never write an `OPTIONS` route.\n\nThe configuration file is not in a fresh application. `php artisan config:publish cors` writes `config/cors.php` with the framework defaults: `paths` of `['api/*', 'sanctum/csrf-cookie']`, `allowed_methods` and `allowed_origins` of `['*']`, `max_age` of `0` and `supports_credentials` of `false`. The `paths` entry is where most real problems start — if you moved your API with `apiPrefix: 'api/admin'`, or you expose `/broadcasting/auth` or a webhook under `/webhooks/*`, none of those match `api/*` and they get no CORS headers at all. The browser reports that as a generic CORS error, which sends people hunting in the wrong place.\n\nThe credentials rule is the other trap. With `supports_credentials => true`, the browser rejects `Access-Control-Allow-Origin: *` outright, so you must enumerate exact origins (or use `allowed_origins_patterns` for a controlled regex) and emit `Vary: Origin` so a shared cache cannot serve one origin's headers to another. Two closing reminders: CORS is enforced by browsers only — curl, Postman and server-to-server calls ignore it entirely, so it is never access control — and an uncaught 500 thrown *before* the CORS headers are attached shows up in the console as a CORS failure when the real problem is your exception.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Laravel Docs: Routing — Cross-Origin Resource Sharing (CORS)", url: "https://laravel.com/framework/docs/13.x/routing", kind: "docs" },
        { label: "MDN: Cross-Origin Resource Sharing (CORS)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS", kind: "docs" },
        { label: "fruitcake/php-cors — the library behind HandleCors", url: "https://github.com/fruitcake/php-cors", kind: "repo" },
      ],
      video: {
        title: "Laravel API for Beginners - A Complete Guide",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=_iuxZygxz98",
        videoId: "_iuxZygxz98",
        startSeconds: 14554,
        chapterLabel: "What is CORS",
        durationLabel: "4:55:53",
      },
      alternateVideos: [
        {
          title: "CORS Explained - Cross-Origin Resource Sharing",
          channel: "Piyush Garg",
          url: "https://www.youtube.com/watch?v=WWnR4xptSRk",
          videoId: "WWnR4xptSRk",
          durationLabel: "28:39",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-cors-q1",
          prompt: "Where does `HandleCors` sit in the middleware stack, and why does it matter?",
          options: [
            "In the global stack, before route middleware — so a credential-less preflight is not rejected by `auth`",
            "In the `api` group, after `SubstituteBindings`",
            "In the `web` group only",
            "It is a terminable middleware that runs after the response is sent",
          ],
          correctIndex: 0,
          explanation:
            "Preflights carry no cookies or `Authorization` header. If auth middleware ran first the `OPTIONS` request would 401 and the browser would never send the real request — the ordering is what prevents that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-cors-q2",
          prompt: "A fresh Laravel 13 app has no `config/cors.php`. How do you get one?",
          options: [
            "`php artisan config:publish cors`",
            "`php artisan vendor:publish --tag=cors`",
            "`composer require fruitcake/laravel-cors`",
            "Create it by hand; the framework never ships a stub",
          ],
          correctIndex: 0,
          explanation:
            "`config:publish` copies the framework's own config stub into your app. The separate `fruitcake/laravel-cors` package was absorbed into the framework in Laravel 9.",
        },
        {
          id: "lv-api-cors-q3",
          prompt: "What is the default value of `paths` in the published CORS config?",
          options: [
            "`['api/*', 'sanctum/csrf-cookie']`",
            "`['*']`",
            "`['api/*']`",
            "`[]` — you must list every route explicitly",
          ],
          correctIndex: 0,
          explanation:
            "Only the API prefix and Sanctum's CSRF cookie endpoint. Anything outside those patterns gets no CORS headers, which is the cause of most \"it works in Postman but not the browser\" reports.",
        },
        {
          id: "lv-api-cors-q4",
          prompt:
            "You set `apiPrefix: 'v2'` in `withRouting()` and published the default CORS config. The SPA on `https://app.example.com` now gets a CORS error on every call, although the same URLs work in Postman. What is the cause?",
          options: [
            "`paths` is still `['api/*', 'sanctum/csrf-cookie']`, so routes under `/v2` never receive CORS headers",
            "`apiPrefix` disables `HandleCors` for the routes it registers",
            "A custom prefix requires `supports_credentials => true`",
            "`paths` accepts only one pattern, so the second entry shadows the first",
          ],
          correctIndex: 0,
          explanation:
            "`HandleCors` only adds headers to request paths matching `paths`. Postman ignores CORS entirely, which is exactly why \"it works in Postman\" is not evidence that the configuration is right. Add `'v2/*'` to the list.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-cors-q5",
          prompt: "You set `supports_credentials => true` and leave `allowed_origins => ['*']`. What happens in the browser?",
          options: [
            "The request is blocked: a credentialed request cannot accept a wildcard `Access-Control-Allow-Origin`",
            "It works, because Laravel rewrites the wildcard to the request's origin",
            "Cookies are sent but the response is not readable",
            "The browser downgrades the request to a non-credentialed one",
          ],
          correctIndex: 0,
          explanation:
            "The Fetch standard forbids `*` with credentials. You must list exact origins (or use `allowed_origins_patterns`) so a specific origin is echoed back.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-cors-q6",
          prompt: "Which statements about CORS and security are true? (Select all that apply.)",
          options: [
            "CORS is enforced by browsers, so curl and server-to-server calls ignore it entirely",
            "It is not a substitute for authentication or authorization",
            "A CORS error means the browser withheld the response, not that the server refused the request",
            "CORS prevents CSRF on state-changing endpoints",
            "Setting `allowed_origins => ['*']` blocks all cross-origin requests",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "CORS governs whether a *page* may read a response. Simple requests are still sent — and their side effects still happen — which is why CSRF defences are a separate mechanism, and why `*` is the most permissive setting, not the strictest.",
        },
        {
          id: "lv-api-cors-q7",
          prompt: "Why send `Vary: Origin` when origins are echoed per request?",
          options: [
            "So caches key the response by origin and cannot serve one origin's `Access-Control-Allow-Origin` to another",
            "So browsers know to retry the preflight",
            "Because `Access-Control-Allow-Origin` is otherwise ignored",
            "To let the client choose a different origin",
          ],
          correctIndex: 0,
          explanation:
            "A CDN or proxy that ignores the request's `Origin` will happily reuse a cached response, handing origin A's permission to origin B — or breaking B entirely.",
        },
        {
          id: "lv-api-cors-q8",
          prompt: "Your endpoint throws an uncaught 500 and the browser console shows a CORS error rather than the 500. What should you check first?",
          options: [
            "The actual response in the network tab or server logs — the failure is the exception, and the CORS message is a symptom of missing headers on that response",
            "The `allowed_methods` list",
            "Whether `max_age` is too low",
            "Whether the browser supports preflight caching",
          ],
          correctIndex: 0,
          explanation:
            "When a response is produced outside the normal middleware flow, or the request path is not covered by `paths`, the CORS headers are absent and the browser reports that rather than the underlying status. Read the raw response, not the console message.",
        },
        {
          id: "lv-api-cors-q9",
          prompt: "What does raising `max_age` from the default `0` achieve?",
          options: [
            "The browser caches the preflight result, so repeated non-simple requests skip the extra `OPTIONS` round trip",
            "It extends the session lifetime for cross-origin callers",
            "It increases the rate limit for cross-origin requests",
            "It allows credentials without listing origins",
          ],
          correctIndex: 0,
          explanation:
            "`Access-Control-Max-Age` caches the preflight answer. Browsers cap it — a couple of hours in Chromium, 24 hours in Firefox — so a very large value is silently clamped.",
        },
      ],
    },
    {
      id: "lv-api-webhooks-signed-urls",
      moduleId: "laravel-apis",
      trackId: "php",
      title: "Webhooks and Signed URLs",
      summary:
        "Both halves of this topic solve the same problem: trusting an HTTP request that carries no session and no bearer token. Laravel's answer in each direction is a keyed hash.\n\nOutbound, `URL::signedRoute('unsubscribe', ['user' => 1])` appends an HMAC of the URL computed with `APP_KEY`, and `temporarySignedRoute($name, now()->plus(minutes: 30), $params)` adds an expiry into the hash. Validate with the `signed` middleware (`Illuminate\\Routing\\Middleware\\ValidateSignature`, which throws `InvalidSignatureException` and renders 403) or `$request->hasValidSignature()`. Use `absolute: false` plus `signed:relative` when the link is generated behind a proxy whose host differs. Three consequences to internalise: the signature proves the *link* is untampered, not who is using it, so a leaked URL in a Referer header or an access log is a leaked capability; `hasValidSignatureWhileIgnoring(['page'])` deliberately lets the client change those parameters; and rotating `APP_KEY` invalidates every outstanding signed URL in the wild.\n\nInbound, a webhook is an unauthenticated POST from a stranger claiming to be Stripe. Put the route in `routes/api.php` so `PreventRequestForgery` — which lives only in the `web` group — is not in the way, then verify the provider's HMAC header against the **raw** body (`$request->getContent()`, not the re-encoded array) using `hash_equals()` for a timing-safe comparison. Check the signed timestamp to bound replay. Then do almost nothing: acknowledge with a 2xx immediately and dispatch a queued job, because providers time out in seconds and retry aggressively, and a slow handler turns into duplicate deliveries. Assume at-least-once delivery and out-of-order arrival: store the provider's event id and make processing idempotent, or you will apply the same subscription cancellation twice.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Laravel Docs: URL Generation — Signed URLs", url: "https://laravel.com/framework/docs/13.x/urls", kind: "docs" },
        { label: "Stripe Docs: Receive Stripe events in your webhook endpoint", url: "https://docs.stripe.com/webhooks", kind: "docs" },
        { label: "Brandur Leach: Webhooks", url: "https://brandur.org/webhooks", kind: "article" },
        { label: "spatie/laravel-webhook-client", url: "https://github.com/spatie/laravel-webhook-client", kind: "repo" },
      ],
      video: {
        title: "Ep44 - Create Links that will Expire in Laravel?! - Signed Route",
        channel: "Acadea.io",
        url: "https://www.youtube.com/watch?v=N40i3ljGNSI",
        videoId: "N40i3ljGNSI",
        durationLabel: "12:06",
      },
      alternateVideos: [
        {
          title: "Laravel Basics - URL Generation and Signed URLs",
          channel: "Laratips",
          url: "https://www.youtube.com/watch?v=_kkM802vgbI",
          videoId: "_kkM802vgbI",
          durationLabel: "23:28",
        },
        {
          title: "Laravel SaaS: Stripe Webhooks to Register Successful Charge",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=waojlxMBZ3U",
          videoId: "waojlxMBZ3U",
          durationLabel: "14:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-api-webhooks-signed-urls-q1",
          prompt: "What secret does Laravel use to sign a signed route URL, and what follows from that?",
          options: [
            "`APP_KEY` — so rotating it invalidates every signed URL already sent out",
            "A per-route secret stored in the `signed_urls` table",
            "The user's session id, so the link only works in the originating browser",
            "A random value regenerated on every deploy, by design",
          ],
          correctIndex: 0,
          explanation:
            "The signature is an HMAC keyed by the application key. Key rotation is therefore a breaking event for outstanding password-reset, unsubscribe and download links.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-webhooks-signed-urls-q2",
          prompt: "Which are true of signed URLs? (Select all that apply.)",
          options: [
            "They prove the URL has not been altered since it was generated",
            "They do not identify or authenticate whoever is holding the link",
            "`temporarySignedRoute` encodes the expiry inside the signed payload, so it cannot be extended by editing the query string",
            "They are encrypted, so the parameters are not readable",
            "They are single-use by default",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Signing is integrity, not confidentiality or authentication: the parameters are plainly visible, anyone with the link can use it, and it keeps working until it expires unless you add your own single-use tracking.",
        },
        {
          id: "lv-api-webhooks-signed-urls-q3",
          prompt: "What does the `signed` middleware do when the signature is missing or wrong?",
          options: [
            "Throws `InvalidSignatureException`, rendered as 403",
            "Redirects to the login page",
            "Returns 401 with a `WWW-Authenticate` header",
            "Passes the request through with `$request->hasValidSignature()` set to false",
          ],
          correctIndex: 0,
          explanation:
            "`ValidateSignature` aborts with a 403. You can register a `render()` closure for `InvalidSignatureException` in `bootstrap/app.php` to show a friendlier \"link expired\" page.",
        },
        {
          id: "lv-api-webhooks-signed-urls-q4",
          prompt: "Your app generates signed URLs behind a proxy that rewrites the host, so validation fails in production. What is the intended fix?",
          options: [
            "Generate with `absolute: false` and validate with the `signed:relative` middleware",
            "Disable signature validation in production",
            "Set `APP_URL` to the proxy host and regenerate `APP_KEY`",
            "Sign the path only, by stripping the query string before hashing",
          ],
          correctIndex: 0,
          explanation:
            "`absolute: false` excludes the domain from the hash, and `signed:relative` tells the middleware to validate the same way. (Configuring `TrustProxies` correctly is the other half of the story.)",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-webhooks-signed-urls-q5",
          prompt: "What does `hasValidSignatureWhileIgnoring(['page', 'order'])` allow, and what is the cost?",
          options: [
            "The client may change those query parameters freely; anything they control is outside the integrity guarantee",
            "Those parameters are stripped before the handler sees them",
            "The signature is checked twice, once with and once without them",
            "Nothing — ignored parameters are still covered by the hash",
          ],
          correctIndex: 0,
          explanation:
            "It exists so a frontend can paginate a signed listing, and the documentation warns about exactly this: ignoring a parameter means anyone can modify it.",
        },
        {
          id: "lv-api-webhooks-signed-urls-q6",
          prompt: "Why must a webhook signature be verified against the raw request body rather than a re-encoded array?",
          options: [
            "The provider computed the HMAC over the exact bytes it sent; re-encoding changes whitespace, key order or escaping and produces a different hash",
            "`$request->all()` strips the signature header",
            "JSON decoding is too slow for webhook volumes",
            "Laravel encrypts the parsed body before the controller sees it",
          ],
          correctIndex: 0,
          explanation:
            "`json_decode` then `json_encode` is not byte-identical. Use `$request->getContent()` — and be careful with any middleware that consumes the input stream first.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-webhooks-signed-urls-q7",
          prompt: "Why compare the computed and received signatures with `hash_equals()` rather than `===`?",
          options: [
            "`hash_equals()` runs in constant time, so an attacker cannot learn the correct prefix by measuring response time",
            "`===` does not work on binary strings",
            "`hash_equals()` also normalises case and encoding",
            "`===` throws on strings of different lengths",
          ],
          correctIndex: 0,
          explanation:
            "String comparison normally short-circuits at the first differing byte, which leaks how much of a guess was right. Timing-safe comparison removes that signal.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-api-webhooks-signed-urls-q8",
          prompt: "Why does a webhook route usually belong in `routes/api.php`?",
          options: [
            "The `api` group has no CSRF middleware, and a third-party POST can never supply a CSRF token",
            "Only API routes can accept a JSON body",
            "The `api` group signs all incoming requests automatically",
            "Webhook providers only call URLs beginning with `/api`",
          ],
          correctIndex: 0,
          explanation:
            "`PreventRequestForgery` lives in the `web` group only. If the route must be in `web`, exclude it via `$middleware->preventRequestForgery(except: ['webhooks/*'])`.",
        },
        {
          id: "lv-api-webhooks-signed-urls-q9",
          prompt: "Your webhook handler synchronously reconciles an invoice, taking eight seconds. What goes wrong?",
          options: [
            "The provider times out, marks the delivery failed and retries — so the same event is processed repeatedly",
            "Laravel aborts the request after five seconds by default",
            "The signature expires mid-request",
            "Nothing, as long as it eventually returns 200",
          ],
          correctIndex: 0,
          explanation:
            "Providers wait only a few seconds. Verify, persist the raw event, return 2xx, and do the work in a queued job — otherwise slow handling manufactures duplicates.",
        },
        {
          id: "lv-api-webhooks-signed-urls-q10",
          prompt: "Which assumptions should a webhook consumer make about delivery? (Select all that apply.)",
          options: [
            "Delivery is at-least-once, so the same event id can arrive more than once",
            "Events can arrive out of order relative to when they occurred",
            "A retry storm can arrive as a burst after an outage on your side",
            "Each event is delivered exactly once, so de-duplication is unnecessary",
            "Events always arrive in the order the provider created them",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Exactly-once delivery over a network is not on offer. Store the provider's event id with a unique constraint, ignore repeats, and order by the event's own timestamp rather than arrival time.",
        },
        {
          id: "lv-api-webhooks-signed-urls-q11",
          prompt: "Which of these is the weakest defence for a webhook endpoint?",
          options: [
            "Accepting any request whose body contains a known account id",
            "Verifying the provider's HMAC signature over the raw body",
            "Rejecting requests whose signed timestamp is older than a few minutes",
            "Allow-listing the provider's published source IP ranges as defence in depth",
          ],
          correctIndex: 0,
          explanation:
            "An account id is not a secret — it appears in your own dashboards and often in URLs. Signature verification is the actual control; timestamp checks and IP allow-lists are useful additions, not replacements.",
        },
      ],
    },
  ],
} satisfies Module;
