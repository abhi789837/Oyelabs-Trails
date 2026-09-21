import type { Module } from "@/types/curriculum";

// Shared DTO rule map for the nest-dto-validation-pipes challenge (plain data).
const createUserDto = {
  name: { type: "string", rules: ["isString", "isNotEmpty", "maxLength:20"] },
  age: { type: "number", rules: ["isInt", "min:0"] },
  role: { type: "string", rules: ["isOptional", "isIn:admin,member"] },
};

// Shared app configuration for the nest-exception-filters lifecycle challenge (plain data).
const lifecycleApp = {
  method: "GET",
  middleware: ["cors", "logger"],
  guards: { global: ["Auth"], controller: ["Roles"] },
  interceptors: { global: ["Metrics"], route: ["Cache"] },
  pipes: { global: ["Validation"], param: ["ParseInt"] },
  filters: {
    route: [{ name: "HttpFilter", catches: ["HttpException"] }],
    global: [{ name: "AllFilter", catches: "*" }],
  },
};
const lifecycleOk = [
  "middleware:cors",
  "middleware:logger",
  "guard:Auth",
  "guard:Roles",
  "interceptor:Metrics:before",
  "interceptor:Cache:before",
  "pipe:Validation",
  "pipe:ParseInt",
  "handler",
  "interceptor:Cache:after",
  "interceptor:Metrics:after",
];
const lifecycleUntilHandler = lifecycleOk.slice(0, 9);

export default {
  id: "be-nestjs",
  trackId: "backend",
  name: "NestJS",
  description:
    "NestJS 12 from the container outwards: modules and dependency injection, the request pipeline of guards, interceptors, pipes and filters, persistence with TypeORM or Prisma, and microservices. For engineers who want to know what the framework does on their behalf, and what each abstraction costs.",
  refs: [
    { label: "NestJS: Documentation", url: "https://docs.nestjs.com/", kind: "docs" },
    { label: "NestJS: Request lifecycle", url: "https://docs.nestjs.com/faq/request-lifecycle", kind: "docs" },
    { label: "NestJS: Migration guide (v11 to v12)", url: "https://docs.nestjs.com/migration-guide", kind: "docs" },
  ],
  topics: [
    {
      id: "nest-modules-di",
      moduleId: "be-nestjs",
      trackId: "backend",
      title: "Modules & the Dependency Injection Container",
      summary:
        "Nest's module system exists so a large codebase gets enforced boundaries and a container that wires dependencies for you. At bootstrap Nest walks the module graph from the root module, reads each class's constructor parameter types from the `design:paramtypes` metadata that TypeScript emits, and instantiates providers in dependency order. Providers are singletons by default and they're encapsulated: a provider can only be injected inside the module that declares it, or in a module that imports a module listing it in `exports`. `exports` is the module's public API. Registering the same class in two modules' `providers` arrays creates two instances, a classic cause of a cache or connection pool that mysteriously isn't shared.\n\n`@Global()` removes the import requirement (the module must still be imported once and must still export), which suits config or logging but hides dependencies, so keep it for real infrastructure. Dynamic modules are how reusable modules take configuration: a static `forRoot()` or `register()` returns a `DynamicModule` whose properties extend the `@Module()` metadata. The `forRootAsync` variants take `useFactory` plus `inject`, so options can come from other providers such as a `ConfigService`. By convention `forRoot` is configured once and shared, `register` is per importing module, and `forFeature` narrows a `forRoot` setup for one module.\n\nA cycle between providers or modules fails at bootstrap, often as \"can't resolve dependencies ... at index [0]\" because an import resolved to `undefined` (barrel files are a frequent culprit). `forwardRef()` on both sides makes the cycle resolvable, but instantiation order becomes indeterminate and request-scoped cycles can inject `undefined`. Treat a cycle as a design smell: extract the shared logic into a third provider, or decouple with events. NestJS 12's official packages are ESM, consumable from CommonJS apps on Node 20.19+ or 22.12+.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "NestJS: Modules", url: "https://docs.nestjs.com/modules", kind: "docs" },
        { label: "NestJS: Dynamic modules", url: "https://docs.nestjs.com/fundamentals/dynamic-modules", kind: "docs" },
        { label: "NestJS: Circular dependency", url: "https://docs.nestjs.com/fundamentals/circular-dependency", kind: "docs" },
        {
          label: "Trilon: Circular Dependencies in NestJS and how to Avoid Them",
          url: "https://trilon.io/blog/avoiding-circular-dependencies-in-nestjs",
          kind: "article",
        },
      ],
      video: {
        title: "Demystifying Dependency Injection: Angular vs NestJS - Kamil Mysliwiec | NG-DE 2019",
        channel: "NG-DE Conference",
        url: "https://www.youtube.com/watch?v=vYFhHVMetPg",
        videoId: "vYFhHVMetPg",
        durationLabel: "27:08",
      },
      alternateVideos: [
        {
          title: "NestJS Full Course for Beginners in 2026 | Build a Production-Ready API",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=Q6NpiIp-6WM",
          videoId: "Q6NpiIp-6WM",
          durationLabel: "1:46:35",
          startSeconds: 498,
          chapterLabel: "Module & Architecture",
        },
        {
          title: "Every NestJS Concept Explained in 9 Minutes",
          channel: "Tech Vision",
          url: "https://www.youtube.com/watch?v=IdsBwplQAMw",
          videoId: "IdsBwplQAMw",
          durationLabel: "9:19",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nest-modules-di-q1",
          prompt:
            "What happens when this application boots?\n\n```ts\n@Module({ providers: [CatsService] })\nexport class CatsModule {}\n\n@Injectable()\nexport class DogsService {\n  constructor(private cats: CatsService) {}\n}\n\n@Module({ imports: [CatsModule], providers: [DogsService] })\nexport class DogsModule {}\n```",
          options: [
            "Bootstrap fails: Nest can't resolve `CatsService` in `DogsModule` because `CatsModule` doesn't export it",
            "It works, because importing a module makes all of its providers injectable",
            "It works, but `DogsService` gets its own private instance of `CatsService`",
            "It fails only when a request first reaches a route that uses `DogsService`",
          ],
          correctIndex: 0,
          explanation:
            "Modules encapsulate their providers; an import only exposes what the imported module lists in `exports`. Nest throws `UnknownDependenciesException` during bootstrap, not lazily at request time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-modules-di-q2",
          prompt:
            "`RateLimiterService` keeps an in-memory counter. It's listed in the `providers` (and `exports`) of both `OrdersModule` and `PaymentsModule`, and a limit enforced in one module is never seen by the other. Why?",
          options: [
            "Each module that registers the class gets its own instance, so there are two independent counters",
            "Providers are request-scoped by default, so the counter resets on every request",
            "Exported providers are cloned when another module imports them",
            "Singletons are per controller, and the two modules use different controllers",
          ],
          correctIndex: 0,
          explanation:
            "Declaring a class in a module's `providers` creates an instance owned by that module. To share one instance, declare it in a single module, export it, and import that module wherever it's needed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-modules-di-q3",
          prompt: "Which statements about `@Global()` modules are true? (Select all that apply.)",
          options: [
            "Other modules can inject its exported providers without adding it to their `imports`",
            "It still has to list the providers it wants to share in `exports`",
            "It still has to be imported once somewhere in the graph, typically by the root or core module",
            "Every provider it declares becomes available everywhere, exported or not",
            "It makes its providers request-scoped so they're safe to share",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`@Global()` only removes the need to import the module in each consumer. A global module that isn't part of the graph, or that doesn't export a provider, still leaves consumers with an unresolved dependency. Scope is unrelated.",
        },
        {
          id: "nest-modules-di-q4",
          prompt:
            "What does `DatabaseModule.forRoot()` make available to modules that import it?\n\n```ts\n@Module({ providers: [Connection], exports: [Connection] })\nexport class DatabaseModule {\n  static forRoot(entities: Type[]): DynamicModule {\n    const repos = createRepositoryProviders(entities);\n    return { module: DatabaseModule, providers: repos, exports: repos };\n  }\n}\n```",
          options: [
            "Both `Connection` and the generated repository providers",
            "Only the repository providers, because the returned object overrides the decorator metadata",
            "Only `Connection`, because static metadata wins over dynamic metadata",
            "Nothing until `forFeature()` is also called",
          ],
          correctIndex: 0,
          explanation:
            "The properties returned by a dynamic module extend the `@Module()` metadata rather than replacing it, so the static `Connection` export and the dynamic repository exports are both visible.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-modules-di-q5",
          prompt:
            "`AppModule` imports `TypeOrmModule.forRoot({...})` and `UsersModule` imports `TypeOrmModule.forFeature([User])`. What is `forFeature` for?",
          options: [
            "Registering repositories for specific entities in the calling module, using the connection configured once by `forRoot`",
            "Opening a second, separate database connection for `UsersModule`",
            "Making the `User` entity global so every module can inject its repository",
            "Running migrations for the listed entities at startup",
          ],
          correctIndex: 0,
          explanation:
            "Nest's convention: `forRoot` configures something once for the whole app, `forFeature` adapts that shared setup to one module's needs (here, which repositories it can inject), and `register` configures an independent instance per importing module.",
        },
        {
          id: "nest-modules-di-q6",
          prompt: "Why would you use `JwtModule.registerAsync({ useFactory: (config: ConfigService) => ({...}), inject: [ConfigService] })` instead of `JwtModule.register({...})`?",
          options: [
            "The options depend on another provider, and the async variant lets Nest resolve it through DI (and await an async factory) before building the module",
            "The async variant runs the module in a worker thread so it doesn't block startup",
            "`register` options are evaluated per request, while `registerAsync` evaluates them once",
            "Only the async variants are allowed in the root module",
          ],
          correctIndex: 0,
          explanation:
            "`register` receives a plain object at import time, before any provider exists. The async form passes a provider definition, so the factory can inject `ConfigService` and even return a Promise that Nest awaits during bootstrap.",
        },
        {
          id: "nest-modules-di-q7",
          prompt:
            "`CatsService` and `CommonService` inject each other. Both sides use `@Inject(forwardRef(() => OtherService))`. Which statement is accurate?",
          options: [
            "The cycle now resolves, but you can't rely on which constructor runs first",
            "Nest instantiates them lazily on first use, so neither constructor runs at startup",
            "`forwardRef` is only needed on one side; adding it to both creates two instances",
            "`forwardRef` turns both providers into request-scoped providers",
          ],
          correctIndex: 0,
          explanation:
            "`forwardRef` defers reading the class reference so Nest can construct both, and the docs warn the order of instantiation is indeterminate. It's a workaround; extracting the shared logic into a third provider removes the cycle.",
        },
        {
          id: "nest-modules-di-q8",
          prompt:
            "Bootstrap fails with `UndefinedDependencyException`: \"Nest can't resolve dependencies of the OrdersService (?). Please make sure that the argument at index [0] is available in the current module.\" `OrdersService` injects `PaymentsService`, which is exported and imported correctly at the module level. `orders.service.ts` imports the class from `../payments` (an `index.ts` barrel), and the barrel re-exports a file that imports `orders.service.ts`. What's the likely cause?",
          options: [
            "A circular file import: when the decorator metadata was recorded, the imported class was still `undefined`",
            "`PaymentsService` needs `@Global()` because it's imported through a barrel",
            "Barrel files aren't supported by Nest's CLI compiler",
            "The service is missing `@Injectable()`, which only matters for barrel imports",
          ],
          correctIndex: 0,
          explanation:
            "If two files import each other, one sees the other's export as `undefined` while it's being evaluated, so `design:paramtypes` records `undefined` and Nest can't name the dependency. The docs specifically warn against barrel files for module and provider classes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-modules-di-q9",
          prompt: "Which are true for modules in Nest? (Select all that apply.)",
          options: [
            "A module can re-export a module it imports, making that module's exports available to its own importers",
            "A module class can inject providers through its constructor, for example for configuration",
            "Modules are singletons, so importing the same module in several places shares its exported instances",
            "A module class can itself be injected into a provider like any other class",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Re-exporting (`imports: [CommonModule], exports: [CommonModule]`) and constructor injection in module classes are both supported, and a module is instantiated once. Module classes can't be injected as providers; Nest reports an unresolved dependency.",
        },
        {
          id: "nest-modules-di-q10",
          prompt: "A team upgrades a CommonJS NestJS 11 app to NestJS 12 on Node 22.14. What's accurate?",
          options: [
            "The official packages are now ESM, and the CommonJS app can keep running because Node 22.12+ supports `require(esm)`",
            "The app must convert to ESM (`\"type\": \"module\"`) before it can use NestJS 12",
            "NestJS 12 removed the Express adapter, so the app must move to Fastify",
            "Node 22.14 is too old; NestJS 12 requires Node 26",
          ],
          correctIndex: 0,
          explanation:
            "NestJS 12 ships ESM-only packages and needs Node 20.19+ or 22.12+ (where `require(esm)` is unflagged) to run a CommonJS app. Migrating your own code to ESM is optional, and Express remains the default adapter.",
        },
      ],
    },
    {
      id: "nest-controllers-routing",
      moduleId: "be-nestjs",
      trackId: "backend",
      title: "Controllers & Routing Decorators",
      summary:
        "Controllers are where HTTP meets your application: decorators such as `@Controller('users')`, `@Get(':id')` and `@Post()` declare routes, and parameter decorators (`@Param`, `@Query`, `@Body`, `@Headers`, `@Ip`) extract request data so handlers read like plain methods that are easy to unit test. In Nest's standard mode you return a value, a Promise or an Observable and Nest serializes it: objects and arrays become JSON, and the status is 200, or 201 for POST, unless `@HttpCode()` says otherwise. Keep controllers thin: parse and delegate to providers, and let the pipeline (guards, pipes, interceptors, filters) handle cross-cutting work.\n\nThe main escape hatch is the platform response object. Injecting `@Res()` (or `@Next()`) switches that handler to library-specific mode: Nest no longer sends your return value, so forgetting `res.json()` leaves the request hanging, and features built on the return value, such as `@HttpCode`, response-mapping interceptors and the cache interceptor, stop applying. If you only need to set a cookie or header, use `@Res({ passthrough: true })` and keep returning values, or use `@Header()`. Code that touches Express or Fastify objects directly also loses platform independence.\n\nTwo more gotchas. Every path and query parameter arrives as a string: `@Param('id') id: number` is still `\"42\"` at runtime unless a pipe such as `ParseIntPipe` or `ValidationPipe({ transform: true })` converts it, because TypeScript types are erased. And on the default Express adapter routes register in declaration order, so a `@Get(':id')` declared before `@Get('me')` swallows `/users/me`. Declare static paths first, or opt into NestJS 12's `routeResolutionStrategy: 'specificity'` and `routeConflictPolicy` to sort or detect conflicts at bootstrap (Fastify already ranks routes by specificity).",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "NestJS: Controllers", url: "https://docs.nestjs.com/controllers", kind: "docs" },
        { label: "NestJS: Custom route decorators", url: "https://docs.nestjs.com/custom-decorators", kind: "docs" },
        { label: "NestJS: HTTP adapter", url: "https://docs.nestjs.com/faq/http-adapter", kind: "docs" },
      ],
      video: {
        title: "Nest.js Full Course for Beginners | Complete All-in-One Tutorial | 3 Hours",
        channel: "Dave Gray",
        url: "https://www.youtube.com/watch?v=8_X0nSrzrCw",
        videoId: "8_X0nSrzrCw",
        durationLabel: "2:59:13",
        startSeconds: 934,
        chapterLabel: "Chapter 2: Controllers",
      },
      alternateVideos: [
        {
          title: "NestJS Course for Beginners - Build Server-Side Applications",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=21_I-12f5JE",
          videoId: "21_I-12f5JE",
          durationLabel: "1:27:38",
          startSeconds: 618,
          chapterLabel: "Controller (GET) All Profiles",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nest-controllers-routing-q1",
          prompt:
            "A client calls `GET /reports/latest`. What does it receive?\n\n```ts\n@Get('latest')\ngetLatest(@Res() res: Response) {\n  res.setHeader('Cache-Control', 'no-store');\n  return this.reports.latest();\n}\n```",
          options: [
            "Nothing: the request hangs until it times out, because injecting `@Res()` means Nest no longer sends the return value",
            "The report as JSON with the `Cache-Control` header",
            "An empty 200 response with the `Cache-Control` header",
            "A 500 error, because `@Res()` and a return value can't be combined",
          ],
          correctIndex: 0,
          explanation:
            "`@Res()` puts the handler in library-specific mode, so you must call `res.json()`/`res.send()` yourself. No error is thrown; the connection simply stays open. `@Res({ passthrough: true })` would set the header and still send the returned value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-controllers-routing-q2",
          prompt: "Which parameter decorators switch a handler into library-specific response mode (unless `passthrough: true` is set)? (Select all that apply.)",
          options: ["`@Res()`", "`@Next()`", "`@Req()`", "`@Headers()`", "`@Body()`"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Nest detects `@Res()` (alias `@Response()`) and `@Next()` and disables standard response handling for that route. Reading the request with `@Req()`, `@Headers()` or `@Body()` has no effect on how the response is sent.",
        },
        {
          id: "nest-controllers-routing-q3",
          prompt: "With no `@HttpCode()` decorator, what status codes do a successful `@Get()` and a successful `@Post()` handler return?",
          options: ["200 and 201", "200 and 200", "200 and 204", "201 and 201"],
          correctIndex: 0,
          explanation:
            "Nest defaults to 200 for every method except POST, which defaults to 201. Use `@HttpCode(200)` on a POST that doesn't create anything (a login or search endpoint), or `@HttpCode(204)` for empty responses.",
        },
        {
          id: "nest-controllers-routing-q4",
          prompt:
            "No global pipes are configured. What does `GET /orders/42` return?\n\n```ts\n@Get(':id')\nfindOne(@Param('id') id: number) {\n  return { id, type: typeof id };\n}\n```",
          options: ['`{ "id": "42", "type": "string" }`', '`{ "id": 42, "type": "number" }`', "A 400 error because `\"42\"` isn't a number", '`{ "id": null, "type": "object" }`'],
          correctIndex: 0,
          explanation:
            "Type annotations are erased at runtime and route params always arrive as strings. `ParseIntPipe` or a `ValidationPipe` with `transform: true` is what actually converts (and validates) the value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-controllers-routing-q5",
          prompt:
            "On the default Express adapter with default options, what does `GET /users/me` return?\n\n```ts\n@Controller('users')\nexport class UsersController {\n  @Get(':id')\n  findOne(@Param('id') id: string) { return { route: ':id', id }; }\n\n  @Get('me')\n  me() { return { route: 'me' }; }\n}\n```",
          options: [
            '`{ "route": ":id", "id": "me" }`',
            '`{ "route": "me" }`, because static segments always win',
            "A 409 error because the routes conflict",
            "Bootstrap fails with a duplicate-route error",
          ],
          correctIndex: 0,
          explanation:
            "Express matches in registration order and Nest registers routes in declaration order, so `:id` captures `me`. Declare static routes first, or set NestJS 12's opt-in `routeResolutionStrategy: 'specificity'`; `routeConflictPolicy` can warn or fail at bootstrap instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-controllers-routing-q6",
          prompt: "A handler returns `of(1, 2, 3)` (an RxJS Observable). What does the client receive?",
          options: ["`3`", "`[1,2,3]`", "`1`", "Three separate chunks: `1`, `2`, `3`"],
          correctIndex: 0,
          explanation:
            "Nest subscribes to a returned Observable and sends the last value emitted once the stream completes. To stream multiple values you'd use Server-Sent Events (`@Sse()`) or a streaming response instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-controllers-routing-q7",
          prompt:
            "What status and `Location` does this handler produce?\n\n```ts\n@Get('docs')\n@Redirect('https://docs.nestjs.com', 302)\ngetDocs(@Query('version') version?: string) {\n  if (version === '5') {\n    return { url: 'https://docs.nestjs.com/v5/', statusCode: 307 };\n  }\n}\n```\n\nfor `GET /docs?version=5`",
          options: [
            "307 to `https://docs.nestjs.com/v5/`",
            "302 to `https://docs.nestjs.com`, because decorator arguments take precedence",
            "302 to `https://docs.nestjs.com/v5/`",
            "200 with the object as JSON",
          ],
          correctIndex: 0,
          explanation:
            "Returning an object shaped like `HttpRedirectResponse` overrides both arguments of `@Redirect()`. Without a return value the decorator's URL and status apply (the status defaults to 302 if omitted).",
        },
        {
          id: "nest-controllers-routing-q8",
          prompt: "You need to set an auth cookie in a login handler but still want interceptors and `@HttpCode(200)` to apply to the returned body. What's the right approach?",
          options: [
            "Inject `@Res({ passthrough: true }) res`, call `res.cookie(...)`, and return the body",
            "Inject `@Res() res` and call `res.cookie(...)`, then return the body",
            "Inject `@Req() req` and assign `req.cookies.token`",
            "Throw an `HttpException` whose response contains a `Set-Cookie` field",
          ],
          correctIndex: 0,
          explanation:
            "`passthrough: true` lets you use the native response for side effects while Nest keeps handling the return value. Plain `@Res()` disables standard handling, and mutating `req.cookies` only changes the incoming request object.",
        },
        {
          id: "nest-controllers-routing-q9",
          prompt: "Which are good reasons to keep controllers thin and put logic in providers? (Select all that apply.)",
          options: [
            "Providers can be reused by other transports (microservice handlers, GraphQL resolvers, CLI commands)",
            "Business logic can be unit tested without building HTTP requests",
            "Guards, pipes and interceptors already handle cross-cutting concerns around the handler",
            "Nest refuses to inject repositories into controllers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Controllers are one entry point among several, so logic in providers is reusable and easier to test, and the pipeline covers auth, validation and logging. Nest will inject a repository into a controller; it's a design choice, not a rule.",
        },
      ],
    },
    {
      id: "nest-providers-injectable",
      moduleId: "be-nestjs",
      trackId: "backend",
      title: "Providers & @Injectable",
      summary:
        "A provider is anything Nest can create and inject under a token: a class marked `@Injectable()`, or a custom definition. With a class token Nest reads the constructor's parameter types from the `design:paramtypes` metadata TypeScript emits, so injection looks free. That metadata only records real runtime values: interfaces are erased, and a class imported with `import type` is `undefined` at runtime, which Nest 12 reports as an `UndefinedDependencyException`. For an interface, register under a `Symbol` or string token and inject with `@Inject(TOKEN)`, or use an abstract class as both contract and token.\n\nCustom providers cover the rest. `useValue` supplies constants, config objects and test doubles. `useClass` picks an implementation (a fake in tests, a different adapter per environment). `useFactory` computes a value from the providers listed in `inject`, which may include `{ token, optional: true }`; an async factory is awaited before anything that depends on it is built, which is how you open a database connection before accepting traffic. `useExisting` aliases one token to another token's instance.\n\nScope is where the cost hides. The default singleton is built once at bootstrap and shared by every request: safe in single-threaded Node, but per-request data must never live on a singleton's fields. `Scope.REQUEST` builds a fresh instance per request and bubbles up the injection chain, so every controller and provider that depends on it becomes request-scoped too; one request-scoped logger injected everywhere turns your app into a per-request object graph. The docs cite roughly 5% extra latency for a well-designed app, and durable providers can share sub-trees per tenant instead. `Scope.TRANSIENT` gives each consumer its own instance and doesn't bubble. Scoped providers can't be fetched with `app.get()`; use `app.resolve()` or `ModuleRef`.",
      level: "advanced",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "NestJS: Custom providers", url: "https://docs.nestjs.com/fundamentals/custom-providers", kind: "docs" },
        { label: "NestJS: Injection scopes", url: "https://docs.nestjs.com/fundamentals/injection-scopes", kind: "docs" },
        { label: "NestJS: Asynchronous providers", url: "https://docs.nestjs.com/fundamentals/async-providers", kind: "docs" },
        { label: "Trilon: NestJS Metadata Deep Dive", url: "https://trilon.io/blog/nestjs-metadata-deep-dive", kind: "article" },
      ],
      video: {
        title: "Learn NestJS – Complete Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=sFnAHC9lLaw",
        videoId: "sFnAHC9lLaw",
        durationLabel: "13:56:30",
        startSeconds: 3129,
        chapterLabel: "Custom Providers",
      },
      alternateVideos: [
        {
          title: "Nest.js Full Course for Beginners | Complete All-in-One Tutorial | 3 Hours",
          channel: "Dave Gray",
          url: "https://www.youtube.com/watch?v=8_X0nSrzrCw",
          videoId: "8_X0nSrzrCw",
          durationLabel: "2:59:13",
          startSeconds: 2189,
          chapterLabel: "Chapter 3: Providers",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createContainer(providers)`, a small version of Nest's IoC container. It returns `{ get(token) }`; tokens are strings.\n\nProvider shapes:\n\n- `{ provide, useValue }`: `get` returns the value as-is, including `0`, `null` or `false`.\n- `{ provide, useClass, deps, scope }`: construct with `new useClass(...resolvedDeps)`. `deps` may be missing (no dependencies).\n- `{ provide, useFactory, inject, scope }`: call `useFactory(...resolvedInject)`. `inject` may be missing.\n- `{ provide, useExisting }`: an alias; resolving it resolves the target token instead.\n\nRules:\n\n- Entries in `deps` and `inject` are tokens, or `{ token, optional: true }`, which resolves to `undefined` when nothing is registered under that token.\n- If several providers share a token, the last one registered wins.\n- Resolution is lazy: nothing is constructed until a `get` call needs it.\n- `scope` defaults to `\"singleton\"`: construct once, then always return that instance.\n- `scope: \"transient\"` works like Nest: every direct `get()` builds a new instance and every provider that depends on it gets its own, but a provider that lists the same transient token twice receives the same instance for both.\n- A missing required token throws `new Error('No provider for \"<token>\"')`, naming the missing token, even when it's a dependency deep in the graph.\n- A cycle throws `new Error(\"Circular dependency: A -> B -> A\")`, listing the chain from the token passed to `get()` through to the repeated token. A diamond (two providers sharing one dependency) is not a cycle.\n- A failed `get()` must leave the container usable for later calls.\n\nThe tests call `runContainerScenario`, which builds providers from plain data, runs the steps and describes each instance as `Name#n(deps...)`, where `n` counts how many times `Name` has been constructed. Leave the driver as it is.",
        starterCode: "/**\n * Build a tiny DI container.\n * @param {Array<object>} providers  e.g. { provide, useClass, deps, scope } | { provide, useFactory, inject, scope }\n *                                   | { provide, useValue } | { provide, useExisting }\n * @returns {{ get(token: string): unknown }}\n */\nfunction createContainer(providers) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\n// defs: [{ provide, kind: \"class\" | \"factory\" | \"value\" | \"existing\", deps?, inject?, scope?, value?, target? }]\n// steps: [\"get\", token] | [\"same\", tokenA, tokenB] | [\"created\", token]\n// Instances are described as Name#n(dep,dep,...), where n counts how many times Name was constructed.\nfunction runContainerScenario(defs, steps) {\n  const created = {};\n  const labels = new WeakMap();\n  const track = (name, instance, args) => {\n    created[name] = (created[name] || 0) + 1;\n    labels.set(instance, { label: name + \"#\" + created[name], args });\n    return instance;\n  };\n  const makeClass = (name) =>\n    class {\n      constructor(...args) {\n        track(name, this, args);\n      }\n    };\n  const makeFactory = (name) => (...args) => track(name, {}, args);\n  const providers = defs.map((d) => {\n    const p = { provide: d.provide };\n    if (d.kind === \"value\") p.useValue = d.value;\n    else if (d.kind === \"existing\") p.useExisting = d.target;\n    else if (d.kind === \"class\") p.useClass = makeClass(d.provide);\n    else p.useFactory = makeFactory(d.provide);\n    if (d.deps) p.deps = d.deps;\n    if (d.inject) p.inject = d.inject;\n    if (d.scope) p.scope = d.scope;\n    return p;\n  });\n  const describe = (v) => {\n    const meta = v !== null && typeof v === \"object\" ? labels.get(v) : undefined;\n    if (meta) return meta.args.length ? meta.label + \"(\" + meta.args.map(describe).join(\",\") + \")\" : meta.label;\n    return v === undefined ? \"undefined\" : JSON.stringify(v);\n  };\n  const container = createContainer(providers);\n  const log = [];\n  const attempt = (fn) => {\n    try {\n      log.push(fn());\n    } catch (err) {\n      log.push(\"error: \" + (err && err.message));\n    }\n  };\n  for (const [op, a, b] of steps) {\n    if (op === \"get\") attempt(() => describe(container.get(a)));\n    else if (op === \"same\") attempt(() => \"same:\" + (container.get(a) === container.get(b)));\n    else if (op === \"created\") log.push(\"created:\" + a + \"=\" + (created[a] || 0));\n  }\n  return log;\n}\n",
        functionName: "runContainerScenario",
        testCases: [
          {
            description: "resolves a class and its dependencies in declaration order",
            args: [
              [
                { provide: "Config", kind: "value", value: { port: 3000 } },
                { provide: "Db", kind: "class" },
                { provide: "Users", kind: "class", deps: ["Db", "Config"] },
              ],
              [["get", "Users"]],
            ],
            expected: ['Users#1(Db#1,{"port":3000})'],
          },
          {
            description: "providers are singletons by default",
            args: [
              [
                { provide: "Config", kind: "value", value: { port: 3000 } },
                { provide: "Db", kind: "class" },
                { provide: "Users", kind: "class", deps: ["Db", "Config"] },
              ],
              [["get", "Users"], ["get", "Users"], ["same", "Users", "Users"], ["created", "Db"], ["created", "Users"]],
            ],
            expected: ['Users#1(Db#1,{"port":3000})', 'Users#1(Db#1,{"port":3000})', "same:true", "created:Db=1", "created:Users=1"],
          },
          {
            description: "resolution is lazy: nothing is built until it's needed",
            args: [
              [
                { provide: "A", kind: "class" },
                { provide: "B", kind: "class", deps: ["A"] },
              ],
              [["created", "A"], ["get", "A"], ["created", "B"]],
            ],
            expected: ["created:A=0", "A#1", "created:B=0"],
          },
          {
            description: "a transient provider gives each consumer, and each direct get, its own instance",
            args: [
              [
                { provide: "Logger", kind: "class", scope: "transient" },
                { provide: "Orders", kind: "class", deps: ["Logger"] },
                { provide: "Payments", kind: "class", deps: ["Logger"] },
              ],
              [["get", "Orders"], ["get", "Payments"], ["get", "Logger"], ["get", "Orders"], ["created", "Logger"]],
            ],
            expected: ["Orders#1(Logger#1)", "Payments#1(Logger#2)", "Logger#3", "Orders#1(Logger#1)", "created:Logger=3"],
          },
          {
            description: "a consumer that lists a transient token twice gets one instance",
            args: [
              [
                { provide: "Logger", kind: "class", scope: "transient" },
                { provide: "Svc", kind: "class", deps: ["Logger", "Logger"] },
              ],
              [["get", "Svc"], ["created", "Logger"]],
            ],
            expected: ["Svc#1(Logger#1,Logger#1)", "created:Logger=1"],
            isEdgeCase: true,
          },
          {
            description: "`useExisting` aliases the same singleton instead of building a second one",
            args: [
              [
                { provide: "Logger", kind: "class" },
                { provide: "AppLogger", kind: "existing", target: "Logger" },
              ],
              [["get", "AppLogger"], ["same", "AppLogger", "Logger"], ["created", "Logger"]],
            ],
            expected: ["Logger#1", "same:true", "created:Logger=1"],
          },
          {
            description: "a factory receives its injected values; a missing optional token is `undefined`",
            args: [
              [
                { provide: "Config", kind: "value", value: { url: "pg://db" } },
                { provide: "Conn", kind: "factory", inject: ["Config", { token: "Metrics", optional: true }] },
              ],
              [["get", "Conn"]],
            ],
            expected: ['Conn#1({"url":"pg://db"},undefined)'],
          },
          {
            description: "a singleton factory runs once no matter how many consumers inject it",
            args: [
              [
                { provide: "Conn", kind: "factory" },
                { provide: "A", kind: "class", deps: ["Conn"] },
                { provide: "B", kind: "class", deps: ["Conn"] },
              ],
              [["get", "A"], ["get", "B"], ["created", "Conn"]],
            ],
            expected: ["A#1(Conn#1)", "B#1(Conn#1)", "created:Conn=1"],
          },
          {
            description: "falsy values are valid provider values, not missing providers",
            args: [
              [
                { provide: "Zero", kind: "value", value: 0 },
                { provide: "Nothing", kind: "value", value: null },
                { provide: "Off", kind: "value", value: false },
                { provide: "Svc", kind: "class", deps: ["Zero", "Nothing", "Off"] },
              ],
              [["get", "Svc"]],
            ],
            expected: ["Svc#1(0,null,false)"],
            isEdgeCase: true,
          },
          {
            description: "a missing dependency throws and names the token that's missing",
            args: [[{ provide: "Users", kind: "class", deps: ["Db"] }], [["get", "Users"], ["get", "Nope"]]],
            expected: ['error: No provider for "Db"', 'error: No provider for "Nope"'],
            isEdgeCase: true,
          },
          {
            description: "a cycle is reported with the whole resolution chain",
            args: [
              [
                { provide: "Api", kind: "class", deps: ["Orders"] },
                { provide: "Orders", kind: "class", deps: ["Payments"] },
                { provide: "Payments", kind: "class", deps: ["Orders"] },
              ],
              [["get", "Api"]],
            ],
            expected: ["error: Circular dependency: Api -> Orders -> Payments -> Orders"],
            isEdgeCase: true,
          },
          {
            description: "a failed resolution leaves the container usable",
            args: [
              [
                { provide: "A", kind: "class", deps: ["B"] },
                { provide: "B", kind: "class", deps: ["A"] },
                { provide: "C", kind: "class" },
                { provide: "D", kind: "class", deps: ["C"] },
              ],
              [["get", "A"], ["get", "D"], ["get", "B"]],
            ],
            expected: ["error: Circular dependency: A -> B -> A", "D#1(C#1)", "error: Circular dependency: B -> A -> B"],
            isEdgeCase: true,
          },
          {
            description: "a self-dependency and an alias loop are cycles too",
            args: [
              [
                { provide: "Self", kind: "class", deps: ["Self"] },
                { provide: "X", kind: "existing", target: "Y" },
                { provide: "Y", kind: "existing", target: "X" },
              ],
              [["get", "Self"], ["get", "X"]],
            ],
            expected: ["error: Circular dependency: Self -> Self", "error: Circular dependency: X -> Y -> X"],
            isEdgeCase: true,
          },
          {
            description: "a diamond isn't a cycle, and the shared dependency is built once",
            args: [
              [
                { provide: "D", kind: "class" },
                { provide: "B", kind: "class", deps: ["D"] },
                { provide: "C", kind: "class", deps: ["D"] },
                { provide: "A", kind: "class", deps: ["B", "C"] },
              ],
              [["get", "A"], ["created", "D"]],
            ],
            expected: ["A#1(B#1(D#1),C#1(D#1))", "created:D=1"],
            isEdgeCase: true,
          },
          {
            description: "the last registration of a token wins",
            args: [
              [
                { provide: "Mailer", kind: "value", value: "smtp" },
                { provide: "Mailer", kind: "value", value: "ses" },
              ],
              [["get", "Mailer"]],
            ],
            expected: ['"ses"'],
          },
          {
            description: "a 300-provider dependency chain resolves, with every link built once",
            args: [
              Array.from({ length: 300 }, (_, i) =>
                i === 0 ? { provide: "P0", kind: "class" } : { provide: `P${i}`, kind: "class", deps: [`P${i - 1}`] },
              ),
              [["same", "P299", "P299"], ["created", "P0"], ["created", "P150"]],
            ],
            expected: ["same:true", "created:P0=1", "created:P150=1"],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "nest-dto-validation-pipes",
      moduleId: "be-nestjs",
      trackId: "backend",
      title: "DTOs & Validation Pipes",
      summary:
        "Payloads arrive as untyped JSON and TypeScript types vanish at compile time, so Nest validates against something that survives: a DTO class decorated with `class-validator` rules and checked by `ValidationPipe`, usually registered globally. The class is the runtime schema, which is why DTOs must be classes and must not be imported with `import type`. When a parameter's metatype is an interface, a generic or a type-only import, the pipe only sees `Object` and skips validation entirely, without any warning.\n\nThe options matter more than the decorators. `whitelist: true` strips every property that has no validation decorator, your defence against mass assignment (`isAdmin: true` slipping into an update), so even optional fields need a decorator such as `@IsOptional()`. `forbidNonWhitelisted: true` rejects those properties with a 400 instead, and does nothing unless `whitelist` is on too. `transform: true` hands the handler a real DTO instance and converts primitive route and query params to their declared types; without it, `@Param('id') id: number` is still a string. Converting body and query fields needs `@Type(() => Number)` or `transformOptions: { enableImplicitConversion: true }`, which uses plain JavaScript conversion: `\"false\"` becomes `true`, `\"\"` becomes `0`, and `5` becomes `\"5\"` and then passes `@IsString()`.\n\nNested objects are validated only with `@ValidateNested()` plus `@Type(() => Child)`; without them any shape passes. Failures produce a 400 whose `message` is a flat array of strings (NestJS 12 adds `errorFormat: 'grouped'`). NestJS 12 also supports Standard Schema libraries such as Zod, Valibot and ArkType through `@Body({ schema })` and `StandardSchemaValidationPipe`, a schema-first alternative when you already share schemas with a frontend.",
      level: "intermediate",
      estMinutes: 70,
      webRefs: [
        { label: "NestJS: Validation", url: "https://docs.nestjs.com/techniques/validation", kind: "docs" },
        { label: "NestJS: Pipes", url: "https://docs.nestjs.com/pipes", kind: "docs" },
        { label: "class-validator (GitHub)", url: "https://github.com/typestack/class-validator", kind: "repo" },
      ],
      video: {
        title: "Nest.js Full Course for Beginners | Complete All-in-One Tutorial | 3 Hours",
        channel: "Dave Gray",
        url: "https://www.youtube.com/watch?v=8_X0nSrzrCw",
        videoId: "8_X0nSrzrCw",
        durationLabel: "2:59:13",
        startSeconds: 3782,
        chapterLabel: "Chapter 4: DTO Validation",
      },
      alternateVideos: [
        {
          title: "NestJS Course for Beginners - Build Server-Side Applications",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=21_I-12f5JE",
          videoId: "21_I-12f5JE",
          durationLabel: "1:27:38",
          startSeconds: 4209,
          chapterLabel: "Pipes (Transformation)",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `validatePayload(dto, payload, options)`, a small version of what `ValidationPipe` does with a class-validator DTO.\n\n`dto` maps each declared property to `{ type, rules }`: `type` is the TypeScript type (`\"string\"`, `\"number\"` or `\"boolean\"`) and `rules` lists validators in order. `options` may set `whitelist`, `forbidNonWhitelisted` and `transform` (all default to `false`). `payload` is always a plain object; don't mutate it.\n\nSteps:\n\n- Undeclared properties (payload keys missing from `dto`): with `whitelist`, strip them, and if `forbidNonWhitelisted` is also set add `\"property <key> should not exist\"` for each, in payload order. `forbidNonWhitelisted` without `whitelist` does nothing. Without `whitelist` they're kept as they are.\n- With `transform`, convert declared values that aren't `null` or `undefined` the way `enableImplicitConversion` does: `Number(v)`, `Boolean(v)` or `String(v)`, by `type`. Without `transform`, values are left alone.\n- Validate each declared property in `dto` order, running its rules in list order and collecting every failure. A missing property is validated as `undefined`. If a property's rules include `isOptional` and its value is `null` or `undefined`, skip its other rules.\n\nRules and messages (`<p>` is the property name):\n\n- `isString`: a string, else `\"<p> must be a string\"`\n- `isInt`: an integer number, else `\"<p> must be an integer number\"`\n- `isNumber`: a finite number (not `NaN`), else `\"<p> must be a number conforming to the specified constraints\"`\n- `isBoolean`: `true` or `false`, else `\"<p> must be a boolean value\"`\n- `isNotEmpty`: not `\"\"`, `null` or `undefined`, else `\"<p> should not be empty\"`\n- `min:N` and `max:N`: a number `>= N` or `<= N`, else `\"<p> must not be less than N\"` or `\"<p> must not be greater than N\"`\n- `minLength:N` and `maxLength:N`: a string whose length is `>= N` or `<= N`, else `\"<p> must be longer than or equal to N characters\"` or `\"<p> must be shorter than or equal to N characters\"`\n- `isIn:a,b`: strictly equal to one of the listed strings, else `\"<p> must be one of the following values: a, b\"`\n\nRange and length rules fail for values of the wrong type, as in class-validator (which reports a property's messages in reverse decorator order; here, use list order).\n\nReturn `{ valid: true, value }` with the stripped and converted payload, or `{ valid: false, error: { statusCode: 400, message, error: \"Bad Request\" } }`, the body Nest sends, with the forbidden-property messages first and then the rule messages.",
        starterCode: "/**\n * A ValidationPipe-style validator.\n * @param {Record<string, { type: \"string\" | \"number\" | \"boolean\", rules: string[] }>} dto\n * @param {Record<string, unknown>} payload\n * @param {{ whitelist?: boolean, forbidNonWhitelisted?: boolean, transform?: boolean }} [options]\n * @returns {{ valid: true, value: object } | { valid: false, error: { statusCode: 400, message: string[], error: \"Bad Request\" } }}\n */\nfunction validatePayload(dto, payload, options = {}) {\n  // Your code here\n}\n",
        functionName: "validatePayload",
        testCases: [
          {
            description: "a valid payload passes through unchanged",
            args: [createUserDto, { name: "Ann", age: 30, role: "admin" }, {}],
            expected: { valid: true, value: { name: "Ann", age: 30, role: "admin" } },
          },
          {
            description: "every failing rule is reported, in order",
            args: [createUserDto, { name: "", age: -1, role: "root" }, {}],
            expected: {
              valid: false,
              error: {
                statusCode: 400,
                message: ["name should not be empty", "age must not be less than 0", "role must be one of the following values: admin, member"],
                error: "Bad Request",
              },
            },
          },
          {
            description: "missing required properties fail every rule; missing optional ones are skipped",
            args: [createUserDto, {}, {}],
            expected: {
              valid: false,
              error: {
                statusCode: 400,
                message: [
                  "name must be a string",
                  "name should not be empty",
                  "name must be shorter than or equal to 20 characters",
                  "age must be an integer number",
                  "age must not be less than 0",
                ],
                error: "Bad Request",
              },
            },
            isEdgeCase: true,
          },
          {
            description: "`isOptional` skips `null`",
            args: [createUserDto, { name: "Ann", age: 1, role: null }, {}],
            expected: { valid: true, value: { name: "Ann", age: 1, role: null } },
            isEdgeCase: true,
          },
          {
            description: "`isOptional` doesn't skip an empty string",
            args: [createUserDto, { name: "Ann", age: 1, role: "" }, {}],
            expected: {
              valid: false,
              error: { statusCode: 400, message: ["role must be one of the following values: admin, member"], error: "Bad Request" },
            },
            isEdgeCase: true,
          },
          {
            description: "without `transform`, a numeric string fails number rules",
            args: [createUserDto, { name: "Ann", age: "30" }, {}],
            expected: {
              valid: false,
              error: { statusCode: 400, message: ["age must be an integer number", "age must not be less than 0"], error: "Bad Request" },
            },
            isEdgeCase: true,
          },
          {
            description: "with `transform`, declared values are converted before validation",
            args: [createUserDto, { name: "Ann", age: "30" }, { transform: true }],
            expected: { valid: true, value: { name: "Ann", age: 30 } },
          },
          {
            description: "implicit conversion follows JavaScript rules, surprises included",
            args: [
              {
                active: { type: "boolean", rules: ["isBoolean"] },
                retries: { type: "number", rules: ["isInt", "min:0"] },
                label: { type: "string", rules: ["isString"] },
              },
              { active: "false", retries: "", label: 42 },
              { transform: true },
            ],
            expected: { valid: true, value: { active: true, retries: 0, label: "42" } },
            isEdgeCase: true,
          },
          {
            description: "a non-numeric string converts to `NaN` and fails `isNumber`",
            args: [{ score: { type: "number", rules: ["isNumber"] } }, { score: "abc" }, { transform: true }],
            expected: {
              valid: false,
              error: { statusCode: 400, message: ["score must be a number conforming to the specified constraints"], error: "Bad Request" },
            },
          },
          {
            description: "`whitelist` strips undeclared properties",
            args: [createUserDto, { name: "Ann", age: 30, isAdmin: true }, { whitelist: true }],
            expected: { valid: true, value: { name: "Ann", age: 30 } },
          },
          {
            description: "without `whitelist`, undeclared properties reach the handler",
            args: [createUserDto, { name: "Ann", age: 30, isAdmin: true }, {}],
            expected: { valid: true, value: { name: "Ann", age: 30, isAdmin: true } },
          },
          {
            description: "`forbidNonWhitelisted` reports extra properties first, in payload order",
            args: [createUserDto, { zeta: 1, name: 5, age: 1, alpha: 2 }, { whitelist: true, forbidNonWhitelisted: true }],
            expected: {
              valid: false,
              error: {
                statusCode: 400,
                message: [
                  "property zeta should not exist",
                  "property alpha should not exist",
                  "name must be a string",
                  "name must be shorter than or equal to 20 characters",
                ],
                error: "Bad Request",
              },
            },
            isEdgeCase: true,
          },
          {
            description: "`forbidNonWhitelisted` without `whitelist` does nothing",
            args: [createUserDto, { name: "Ann", age: 30, isAdmin: true }, { forbidNonWhitelisted: true }],
            expected: { valid: true, value: { name: "Ann", age: 30, isAdmin: true } },
            isEdgeCase: true,
          },
          {
            description: "range and length rules fail for values of the wrong type",
            args: [
              { code: { type: "string", rules: ["minLength:2"] }, qty: { type: "number", rules: ["min:1"] } },
              { code: 12345, qty: "5" },
              {},
            ],
            expected: {
              valid: false,
              error: {
                statusCode: 400,
                message: ["code must be longer than or equal to 2 characters", "qty must not be less than 1"],
                error: "Bad Request",
              },
            },
            isEdgeCase: true,
          },
          {
            description: "`whitelist` and `transform` together strip, then convert",
            args: [createUserDto, { name: "Ann", age: "7", extra: "x" }, { whitelist: true, transform: true }],
            expected: { valid: true, value: { name: "Ann", age: 7 } },
          },
          {
            description: "1,000 unexpected properties are each reported",
            args: [
              createUserDto,
              { name: "Ann", age: 1, ...Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`f${i}`, i])) },
              { whitelist: true, forbidNonWhitelisted: true },
            ],
            expected: {
              valid: false,
              error: {
                statusCode: 400,
                message: Array.from({ length: 1000 }, (_, i) => `property f${i} should not exist`),
                error: "Bad Request",
              },
            },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "nest-guards",
      moduleId: "be-nestjs",
      trackId: "backend",
      title: "Guards (Auth)",
      summary:
        "Guards answer one question before a handler runs: may this request proceed? A guard implements `CanActivate` and returns a boolean, a Promise or an Observable of one. Returning `false` makes Nest throw `ForbiddenException` (403, \"Forbidden resource\"), so throw `UnauthorizedException` yourself when credentials are missing rather than insufficient. Guards run after all middleware and before any interceptor or pipe, global first, then controller, then route, and the first guard that fails stops the chain.\n\nWhat makes a guard better than Express-style auth middleware is context. Middleware doesn't know which handler will run; a guard receives an `ExecutionContext` whose `getHandler()` and `getClass()` point at the method and controller, so it can read metadata attached by decorators. Create a decorator with `Reflector.createDecorator<string[]>()` (or `SetMetadata`) and read it with `reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()])`, so a method-level value overrides the controller's, or with `getAllAndMerge` to combine both. Reading only the handler misses decorators placed on the class. A common design is a global authentication guard plus a `@Public()` decorator the guard checks before demanding a token.\n\nHow you register a global guard matters. `app.useGlobalGuards(new AuthGuard())` is instantiated outside any module, so it can't inject `JwtService` or `Reflector`; `{ provide: APP_GUARD, useClass: AuthGuard }` in any module lets Nest build it with DI, applies it app-wide, and several `APP_GUARD` registrations all run in registration order. In hybrid apps, `useGlobalGuards()` doesn't cover connected microservices unless you pass `inheritAppConfig`. Keep guards to authorization decisions: they run before pipes, so they only see the raw request, and ownership checks that need to load the resource often belong in the service.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "NestJS: Guards", url: "https://docs.nestjs.com/guards", kind: "docs" },
        { label: "NestJS: Execution context (Reflector and metadata)", url: "https://docs.nestjs.com/fundamentals/execution-context", kind: "docs" },
        { label: "NestJS: Authorization", url: "https://docs.nestjs.com/security/authorization", kind: "docs" },
      ],
      video: {
        title: "Learn NestJS – Complete Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=sFnAHC9lLaw",
        videoId: "sFnAHC9lLaw",
        durationLabel: "13:56:30",
        startSeconds: 12282,
        chapterLabel: "Role Based Authentication",
      },
      alternateVideos: [
        {
          title: "NestJS Full Course for Beginners in 2026 | Build a Production-Ready API",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=Q6NpiIp-6WM",
          videoId: "Q6NpiIp-6WM",
          durationLabel: "1:46:35",
          startSeconds: 2861,
          chapterLabel: "Guards",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nest-guards-q1",
          prompt: "A guard's `canActivate()` returns `false` and no exception filters are registered. What does the client receive?",
          options: [
            '403 with `{ "message": "Forbidden resource", "error": "Forbidden", "statusCode": 403 }`',
            '401 with `{ "message": "Unauthorized", "statusCode": 401 }`',
            "200 with an empty body, because the handler was skipped",
            "The request hangs, because the guard didn't send a response",
          ],
          correctIndex: 0,
          explanation:
            "Nest throws a `ForbiddenException` when a guard returns `false`. If the real problem is a missing or invalid token, throw `UnauthorizedException` yourself so the client gets a 401.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-guards-q2",
          prompt:
            "`OwnerGuard` reads `request.body.accountId` and expects it to be a number, because the route's DTO declares `accountId: number` and a global `ValidationPipe({ transform: true })` is installed. In production the guard sees the string `\"42\"`. Why?",
          options: [
            "Guards run before pipes, so the guard sees the raw body, not the validated and transformed DTO",
            "`ValidationPipe` only transforms route params, never the body",
            "The guard runs after the handler, when the DTO has been serialized back to JSON",
            "Global pipes don't apply to routes that have guards",
          ],
          correctIndex: 0,
          explanation:
            "The order is middleware, guards, interceptors, pipes, handler. A guard only has the raw request, so either validate what it needs itself or move the check after validation (into the service).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-guards-q3",
          prompt: "Why can't `AuthGuard` inject `JwtService` when it's registered with `app.useGlobalGuards(...)` in `main.ts`?",
          options: [
            "You construct it yourself outside any module, so Nest's injector never resolves its constructor; register it as an `APP_GUARD` provider instead",
            "Global guards run before the DI container has been created",
            "`JwtService` is request-scoped, and global guards can only inject singletons",
            "`useGlobalGuards` only accepts functional guards, not classes",
          ],
          correctIndex: 0,
          explanation:
            "`useGlobalGuards(new AuthGuard(...))` takes an instance you built. `{ provide: APP_GUARD, useClass: AuthGuard }` inside a module lets Nest construct the guard with its dependencies while still applying it to every route.",
        },
        {
          id: "nest-guards-q4",
          prompt:
            "Given this controller, what does each lookup return for `archive()`?\n\n```ts\nexport const Roles = Reflector.createDecorator<string[]>();\n\n@Roles(['user'])\n@Controller('docs')\nexport class DocsController {\n  @Get('archive')\n  archive() {}\n}\n```\n\n1. `reflector.get(Roles, context.getHandler())`\n2. `reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()])`",
          options: [
            "1 is `undefined`; 2 is `['user']`",
            "Both are `['user']`, because method metadata inherits from the class",
            "1 is `['user']`; 2 is `undefined`",
            "Both are `undefined`, because `archive()` has no decorator",
          ],
          correctIndex: 0,
          explanation:
            "`get` with the handler only reads metadata on the method itself. `getAllAndOverride` checks the targets in order and returns the first defined value, so the class-level `['user']` applies. Guards that only read the handler silently ignore controller-level decorators.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-guards-q5",
          prompt:
            "The controller has `@Roles(['user'])` and the method has `@Roles(['admin'])`. Which statements are true? (Select all that apply.)",
          options: [
            "`getAllAndOverride(Roles, [handler, class])` returns `['admin']`",
            "`getAllAndMerge(Roles, [handler, class])` returns both `'admin'` and `'user'`",
            "Passing `[class, handler]` to `getAllAndOverride` would return `['user']`",
            "`getAllAndOverride` throws because two values conflict",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`getAllAndOverride` returns the first non-undefined value in the order you pass the targets, so order decides whether method or class wins. `getAllAndMerge` concatenates arrays (and merges objects) from all targets.",
        },
        {
          id: "nest-guards-q6",
          prompt:
            "A global guard `G0` is registered, the controller has `@UseGuards(G1, G2)`, and the route has `@UseGuards(G3)`. `G1` returns `false`. Which guards run?",
          options: ["`G0` and `G1`", "`G0`, `G1`, `G2` and `G3`", "`G3`, `G2` and `G1`, then the request is rejected", "Only `G1`"],
          correctIndex: 0,
          explanation:
            "Guards run global, then controller, then route, in the order they're bound, and evaluation stops at the first guard that denies. `G2` and `G3` never execute.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-guards-q7",
          prompt: "Which statements about `{ provide: APP_GUARD, useClass: X }` are true? (Select all that apply.)",
          options: [
            "The guard applies to every route in the application, whichever module registers it",
            "The guard can inject providers from the module that registers it",
            "Registering `APP_GUARD` several times runs every registered guard, in registration order",
            "You can later retrieve the guard with `app.get(APP_GUARD)` to call it manually",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`APP_GUARD` is a pseudo-provider Nest consumes during bootstrap: global in effect, DI-enabled, and repeatable. Because it's consumed rather than stored, it can't be fetched with `app.get()` or injected elsewhere.",
        },
        {
          id: "nest-guards-q8",
          prompt:
            "A global `JwtAuthGuard` should skip routes marked `@Public()`. Which implementation handles `@Public()` on either a method or a whole controller?",
          options: [
            "`if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;` before verifying the token",
            "`if (this.reflector.get<boolean>(IS_PUBLIC, ctx.getHandler())) return true;` before verifying the token",
            "Check `request.route.public`, which Nest sets from the decorator",
            "Register the public routes in middleware that removes the guard from the request",
          ],
          correctIndex: 0,
          explanation:
            "Checking both the handler and the class covers `@Public()` at either level. Reading only the handler misses controller-level markers, and Nest doesn't copy custom metadata onto the request.",
        },
        {
          id: "nest-guards-q9",
          prompt: "Why is a guard usually a better place than middleware for role checks in Nest?",
          options: [
            "A guard gets an `ExecutionContext` and knows which handler will run, so it can read route metadata; middleware is context-blind",
            "Middleware can't read request headers",
            "Guards run before middleware, so they reject requests earlier",
            "Exceptions thrown in middleware are never handled, so the process crashes",
          ],
          correctIndex: 0,
          explanation:
            "Middleware runs before a route is selected, so it can't see which decorators apply. It can still authenticate and attach `request.user`; exceptions thrown there reach global exception filters only.",
        },
        {
          id: "nest-guards-q10",
          prompt:
            "The same `RolesGuard` protects HTTP controllers and a `@MessagePattern()` handler, and it calls `context.switchToHttp().getRequest().user`. The microservice handler fails. What's the fix?",
          options: [
            "Branch on `context.getType()` (`'http'`, `'rpc'`, `'ws'`) and read the user from the right place, e.g. `switchToRpc().getData()` for messages",
            "Mark the guard `@Global()` so it runs in the HTTP context for all transports",
            "Guards can't be used with microservices at all",
            "Use `@Res()` in the message handler so the HTTP request exists",
          ],
          correctIndex: 0,
          explanation:
            "`ExecutionContext` abstracts several transports; `switchToHttp()` only makes sense when `getType()` is `'http'`. Generic guards check the type and use `switchToRpc()` or `switchToWs()` accordingly.",
        },
      ],
    },
    {
      id: "nest-interceptors",
      moduleId: "be-nestjs",
      trackId: "backend",
      title: "Interceptors (Logging/Transform)",
      summary:
        "Interceptors are Nest's aspect-oriented hook: they wrap the handler. `intercept(context, next)` runs code before calling `next.handle()`, which returns an RxJS Observable of the handler's result, and operators on that stream run afterwards: `tap` for logging and metrics, `map` to reshape responses (a `{ data }` envelope, or `ClassSerializerInterceptor` applying `@Exclude()` to returned class instances), `catchError` to translate errors, `timeout` to bound latency. If an interceptor never calls `handle()`, the handler never runs, which is exactly how a caching interceptor short-circuits with `of(cachedValue)`.\n\nThe order is an onion. On the way in, global, then controller, then route interceptors run their pre-code; on the way out their operators apply in reverse. Pipes run inside the interceptor chain, so an interceptor's `catchError` sees validation, handler and service errors, but never guard failures, which happen before any interceptor runs. Whatever escapes the interceptors goes to exception filters.\n\nThe gotchas are practical. A function passed to `tap(fn)` only sees successful values, so a logger written that way silently skips failed requests; use `tap({ next, error })` or `finalize`. Response mapping doesn't apply when a handler injects `@Res()` without passthrough, and `CacheInterceptor` only caches GET routes. A `timeout(5000)` interceptor stops waiting and answers 408 through `RequestTimeoutException`, but it doesn't cancel anything: the handler's Promise and its database query keep running, so real cancellation needs an `AbortSignal` or a query timeout. Interceptors registered with `app.useGlobalInterceptors()` can't inject dependencies; `APP_INTERCEPTOR` can. Pick the right tool: middleware for raw request concerns, guards for authorization, pipes for input, interceptors for behaviour around the handler and its result, filters for turning errors into responses.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "NestJS: Interceptors", url: "https://docs.nestjs.com/interceptors", kind: "docs" },
        { label: "NestJS: Serialization", url: "https://docs.nestjs.com/techniques/serialization", kind: "docs" },
        { label: "RxJS: timeout operator", url: "https://rxjs.dev/api/operators/timeout", kind: "docs" },
        { label: "RxJS: Observable guide", url: "https://rxjs.dev/guide/observable", kind: "article" },
      ],
      video: {
        title: "Nest.js | Middleware, Pipes & Interceptors Explained By Example",
        channel: "Michael Guay",
        url: "https://www.youtube.com/watch?v=x1W3FJ1RJlM",
        videoId: "x1W3FJ1RJlM",
        durationLabel: "33:38",
      },
      alternateVideos: [
        {
          title: "NestJS Full Course for Beginners in 2026 | Build a Production-Ready API",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=Q6NpiIp-6WM",
          videoId: "Q6NpiIp-6WM",
          durationLabel: "1:46:35",
          startSeconds: 2001,
          chapterLabel: "Interceptors",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nest-interceptors-q1",
          prompt:
            "What happens on a cache hit?\n\n```ts\n@Injectable()\nexport class CacheHitInterceptor implements NestInterceptor {\n  private cache = new Map<string, unknown>();\n  intercept(ctx: ExecutionContext, next: CallHandler) {\n    const key = ctx.switchToHttp().getRequest().url;\n    if (this.cache.has(key)) return of(this.cache.get(key));\n    return next.handle().pipe(tap((v) => this.cache.set(key, v)));\n  }\n}\n```",
          options: [
            "The cached value is sent and the route handler never runs",
            "The handler runs anyway, then the cached value replaces its result",
            "Nest throws because an interceptor must always call `next.handle()`",
            "The handler runs and both values are sent as an array",
          ],
          correctIndex: 0,
          explanation:
            "The handler only executes when `next.handle()` is called (and subscribed). Returning another Observable short-circuits it, which is how caching interceptors work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-interceptors-q2",
          prompt:
            "A global interceptor `G` and a route interceptor `R` each log `before` and then `tap(() => log('after'))`. In what order do the logs appear for a successful request?",
          options: [
            "G before, R before, handler, R after, G after",
            "G before, R before, handler, G after, R after",
            "R before, G before, handler, G after, R after",
            "G before, G after, R before, R after, handler",
          ],
          correctIndex: 0,
          explanation:
            "Interceptors nest like an onion: pre-code runs global to route, and the returned streams unwind route to global, so the innermost interceptor sees the result first.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-interceptors-q3",
          prompt:
            "A `TimeoutInterceptor` uses `timeout(100)` and maps `TimeoutError` to `RequestTimeoutException`. A handler awaits a 300 ms database call. What happens?",
          options: [
            "The client gets a 408 after about 100 ms, but the handler and its database call keep running to completion",
            "The client gets a 408 and the database call is cancelled automatically",
            "The client waits 300 ms and then gets the real result, because timeouts only apply to Observables",
            "The process crashes with an unhandled `TimeoutError`",
          ],
          correctIndex: 0,
          explanation:
            "Unsubscribing from an Observable built from a Promise can't stop the Promise. The response is sent early, but the work continues; cancelling it requires an `AbortSignal` passed down, or a timeout on the query itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-interceptors-q4",
          prompt:
            "A global interceptor wraps its stream in `catchError`. Which failures can it observe? (Select all that apply.)",
          options: [
            "A `BadRequestException` thrown by a global `ValidationPipe`",
            "An error thrown inside the route handler",
            "An error thrown by a service the handler awaits",
            "The `ForbiddenException` produced when a guard returns `false`",
            "An exception thrown in module-bound middleware",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Pipes and the handler run inside the interceptor chain, so their errors flow through `catchError`. Guards and middleware run before any interceptor, so their errors go straight to exception filters.",
        },
        {
          id: "nest-interceptors-q5",
          prompt:
            "This logging interceptor never logs requests that throw. Why?\n\n```ts\nintercept(ctx: ExecutionContext, next: CallHandler) {\n  const start = Date.now();\n  return next.handle().pipe(\n    tap(() => this.logger.log(`${Date.now() - start}ms`)),\n  );\n}\n```",
          options: [
            "A function passed to `tap` only handles `next` notifications; errors skip it, so use `tap({ next, error })` or `finalize`",
            "`Date.now()` isn't available inside RxJS operators",
            "Exceptions are thrown before `intercept` is called",
            "Nest doesn't subscribe to interceptor streams when the handler throws",
          ],
          correctIndex: 0,
          explanation:
            "`tap(fn)` is shorthand for a `next` observer. An error notification passes straight through it. `finalize` runs on completion, error or unsubscribe, which suits duration logging.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-interceptors-q6",
          prompt: "A `TransformInterceptor` wraps every response in `{ data }` using `map`. Which handler's response is NOT wrapped?",
          options: [
            "One that injects `@Res() res` and calls `res.json(result)`",
            "One that returns a Promise",
            "One that returns an Observable",
            "One that injects `@Res({ passthrough: true })` to set a header and returns an object",
          ],
          correctIndex: 0,
          explanation:
            "In library-specific mode the handler writes the response itself, so there's no return value for `map` to transform. Promises and Observables are resolved before mapping, and passthrough mode keeps standard handling.",
        },
        {
          id: "nest-interceptors-q7",
          prompt: "`CacheInterceptor` is bound globally. Which requests can it serve from the cache?",
          options: [
            "GET requests to handlers that don't inject `@Res()`",
            "Any request method, keyed by URL and body",
            "Only requests whose handlers are marked `@CacheKey()`",
            "GET and HEAD requests, including handlers that use `@Res()`",
          ],
          correctIndex: 0,
          explanation:
            "Nest's docs state that only GET endpoints are cached and that routes injecting the native response object can't use the cache interceptor. `@CacheKey()` only overrides the generated key.",
        },
        {
          id: "nest-interceptors-q8",
          prompt:
            "`ClassSerializerInterceptor` is global and `UserEntity` marks `password` with `@Exclude()`. Which handler leaks the password?",
          options: [
            "`return { ...row };`, where `row` is a plain object from a raw query",
            "`return new UserEntity(row);`",
            "`return [new UserEntity(a), new UserEntity(b)];`",
            "A handler with `@SerializeOptions({ type: UserEntity })` that returns `{ ...row }`",
          ],
          correctIndex: 0,
          explanation:
            "The serializer applies the rules declared on a class, and a plain object carries no class metadata, so nothing is excluded. Returning instances (or arrays of them) works, and `@SerializeOptions({ type })` converts plain objects into the class before serializing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-interceptors-q9",
          prompt: "Which concerns fit an interceptor better than a guard, pipe or middleware? (Select all that apply.)",
          options: [
            "Measuring handler duration and emitting a metric",
            "Wrapping successful responses in a consistent envelope",
            "Mapping a domain `NotFoundError` from the service layer into a `NotFoundException`",
            "Rejecting a request because the user lacks the `admin` role",
            "Converting the `id` route param from string to number",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Interceptors see both sides of the handler and its result stream. Authorization decisions belong in guards, and param conversion belongs in pipes.",
        },
        {
          id: "nest-interceptors-q10",
          prompt: "Why register a global interceptor with `{ provide: APP_INTERCEPTOR, useClass: MetricsInterceptor }` rather than `app.useGlobalInterceptors(new MetricsInterceptor())`?",
          options: [
            "The provider form lets Nest inject its dependencies (e.g. a metrics client); an instance created in `main.ts` is outside the DI container",
            "`useGlobalInterceptors` interceptors only run for GET requests",
            "The provider form makes the interceptor request-scoped automatically",
            "`useGlobalInterceptors` runs after exception filters",
          ],
          correctIndex: 0,
          explanation:
            "Like `APP_GUARD` and `APP_FILTER`, `APP_INTERCEPTOR` registers a global component through a module so it participates in DI. Neither form changes scope or ordering relative to filters.",
        },
      ],
    },
    {
      id: "nest-exception-filters",
      moduleId: "be-nestjs",
      trackId: "backend",
      title: "Custom Exception Filters",
      summary:
        "Exception filters turn uncaught errors into responses. Out of the box, Nest's exceptions layer handles `HttpException` and its subclasses (`NotFoundException`, `ConflictException` and friends) by sending their status and body; anything else becomes `500 { \"statusCode\": 500, \"message\": \"Internal server error\" }`, so driver errors and stack traces don't leak. `HttpException` takes an options object with a `cause`, which is for logging and never serialized, and in NestJS 12 an `errorCode` that is serialized so clients can branch on a stable identifier instead of parsing messages.\n\nA custom filter declares what it handles with `@Catch(TypeA, TypeB)`, or `@Catch()` for everything, and receives an `ArgumentsHost` to reach the response (use `HttpAdapterHost` for a filter that works on both Express and Fastify). Typical jobs: mapping domain or ORM errors (a unique-constraint violation to 409), enforcing one error envelope, and logging unknown errors with request context while returning a generic message. A catch-all that echoes `exception.message` to clients leaks internals.\n\nResolution is where people get surprised. Filters are the only component resolved from the lowest level up: route, then controller, then global. The first matching filter handles the exception and nothing propagates further; to delegate, extend `BaseExceptionFilter` and call `super.catch()`. Within one `@UseFilters(A, B)` list the last-declared filter is tried first, so declare a catch-all before specific filters. Guard failures reach route and controller filters, but exceptions thrown in middleware only reach global ones, because no route has been selected yet. Filters registered with `useGlobalFilters()` can't inject dependencies and don't cover gateways or hybrid apps; `APP_FILTER` can. Filters only see uncaught exceptions: an error caught in a `try/catch` or recovered in an interceptor's `catchError` never reaches them. Microservice handlers throw `RpcException`, and their filters return an Observable.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "NestJS: Exception filters", url: "https://docs.nestjs.com/exception-filters", kind: "docs" },
        { label: "NestJS: Request lifecycle", url: "https://docs.nestjs.com/faq/request-lifecycle", kind: "docs" },
        { label: "NestJS: Microservices exception filters", url: "https://docs.nestjs.com/microservices/exception-filters", kind: "docs" },
      ],
      video: {
        title: "NestJS Course for Beginners - Build Server-Side Applications",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=21_I-12f5JE",
        videoId: "21_I-12f5JE",
        durationLabel: "1:27:38",
        startSeconds: 3287,
        chapterLabel: "Exception Filters - Bubbling Up",
      },
      alternateVideos: [
        {
          title: "Learn NestJS – Complete Course",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=sFnAHC9lLaw",
          videoId: "sFnAHC9lLaw",
          durationLabel: "13:56:30",
          startSeconds: 1959,
          chapterLabel: "Exception Filter",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `simulateRequest(config)`, which replays Nest's request lifecycle for one request and reports what ran and who produced the response.\n\n`config` (every key is optional):\n\n- `method`: `\"GET\"`, `\"POST\"`, and so on.\n- `middleware`: names, run in order.\n- `guards` and `interceptors`: `{ global, controller, route }`, each an array of names.\n- `pipes`: `{ global, controller, route, param }`.\n- `filters`: `{ global, controller, route }`, each an array of `{ name, catches }`. `catches` is `\"*\"` (like `@Catch()`) or a list of exception names, where `\"HttpException\"` matches every HTTP exception.\n- `outcome`: `{}` for success, or `{ at, throw }` or `{ at, deny: true }`, where `at` is `\"middleware:<name>\"`, `\"guard:<name>\"`, `\"interceptor:<name>\"`, `\"pipe:<name>\"` or `\"handler\"`. The component named by `at` runs (and is logged), then throws the named exception. `deny: true` is a guard returning `false`, which Nest turns into `ForbiddenException`.\n\nRun the stages in Nest's order, logging as you go:\n\n- Middleware in order: `\"middleware:<name>\"`.\n- Guards, global then controller then route: `\"guard:<name>\"`.\n- Interceptors, global then controller then route: `\"interceptor:<name>:before\"`.\n- Pipes, global then controller then route then param: `\"pipe:<name>\"`.\n- The handler: `\"handler\"`.\n- Interceptors that completed their before step unwind in reverse order, logging `\"interceptor:<name>:after\"` on success or `\"interceptor:<name>:error\"` while an error propagates. An interceptor that throws in its own before step doesn't log `:error`.\n\nAn exception skips every later stage (interceptors still unwind as above). Then choose a filter: route filters first, then controller, then global, and within a level try filters from last-declared to first. The first filter whose `catches` matches logs `\"filter:<name>\"` and handles it; no other filter runs. Exceptions thrown in middleware only reach global filters. If no filter matches, Nest's built-in handler answers and `handledBy` is `\"default\"`.\n\nStatuses: `BadRequestException` 400, `UnauthorizedException` 401, `ForbiddenException` 403, `NotFoundException` 404, `RequestTimeoutException` 408, `ConflictException` 409. Any other name (such as `TypeError`) isn't an HTTP exception and becomes 500. A filter responds with that status. On success the status is 201 for `POST` and 200 otherwise.\n\nReturn `{ log, status, handledBy }`, where `handledBy` is the handling filter's name, `\"default\"`, or `null` on success.",
        starterCode: "/**\n * Replay Nest's request lifecycle for one request.\n * @param {object} config  middleware, guards, interceptors, pipes, filters, outcome, method\n * @returns {{ log: string[], status: number, handledBy: string | null }}\n */\nfunction simulateRequest(config) {\n  // Your code here\n}\n",
        functionName: "simulateRequest",
        testCases: [
          {
            description: "a successful GET runs every stage in lifecycle order",
            args: [{ ...lifecycleApp, outcome: {} }],
            expected: { log: lifecycleOk, status: 200, handledBy: null },
          },
          {
            description: "a successful POST answers 201",
            args: [{ ...lifecycleApp, method: "POST", outcome: {} }],
            expected: { log: lifecycleOk, status: 201, handledBy: null },
          },
          {
            description: "a denying guard stops the chain before any interceptor, and a route filter can catch the 403",
            args: [{ ...lifecycleApp, outcome: { at: "guard:Roles", deny: true } }],
            expected: {
              log: ["middleware:cors", "middleware:logger", "guard:Auth", "guard:Roles", "filter:HttpFilter"],
              status: 403,
              handledBy: "HttpFilter",
            },
            isEdgeCase: true,
          },
          {
            description: "a guard can throw its own exception instead of returning false",
            args: [{ ...lifecycleApp, outcome: { at: "guard:Auth", throw: "UnauthorizedException" } }],
            expected: {
              log: ["middleware:cors", "middleware:logger", "guard:Auth", "filter:HttpFilter"],
              status: 401,
              handledBy: "HttpFilter",
            },
          },
          {
            description: "a pipe error passes back through the interceptors that already ran",
            args: [{ ...lifecycleApp, outcome: { at: "pipe:ParseInt", throw: "BadRequestException" } }],
            expected: {
              log: [
                ...lifecycleOk.slice(0, 8),
                "interceptor:Cache:error",
                "interceptor:Metrics:error",
                "filter:HttpFilter",
              ],
              status: 400,
              handledBy: "HttpFilter",
            },
          },
          {
            description: "a non-HTTP error skips an HttpException-only filter and reaches the global catch-all",
            args: [{ ...lifecycleApp, outcome: { at: "handler", throw: "TypeError" } }],
            expected: {
              log: [...lifecycleUntilHandler, "interceptor:Cache:error", "interceptor:Metrics:error", "filter:AllFilter"],
              status: 500,
              handledBy: "AllFilter",
            },
            isEdgeCase: true,
          },
          {
            description: "with no matching filter, the built-in handler answers 500 for unknown errors",
            args: [{ ...lifecycleApp, filters: {}, outcome: { at: "handler", throw: "QueryFailedError" } }],
            expected: {
              log: [...lifecycleUntilHandler, "interceptor:Cache:error", "interceptor:Metrics:error"],
              status: 500,
              handledBy: "default",
            },
            isEdgeCase: true,
          },
          {
            description: "an HTTP exception with no matching filter keeps its status",
            args: [{ ...lifecycleApp, filters: {}, outcome: { at: "handler", throw: "NotFoundException" } }],
            expected: {
              log: [...lifecycleUntilHandler, "interceptor:Cache:error", "interceptor:Metrics:error"],
              status: 404,
              handledBy: "default",
            },
          },
          {
            description: "exceptions thrown in middleware only reach global filters",
            args: [
              {
                ...lifecycleApp,
                filters: {
                  route: [{ name: "HttpFilter", catches: ["HttpException"] }],
                  controller: [{ name: "CtrlFilter", catches: "*" }],
                  global: [{ name: "GlobalHttp", catches: ["HttpException"] }],
                },
                outcome: { at: "middleware:logger", throw: "UnauthorizedException" },
              },
            ],
            expected: { log: ["middleware:cors", "middleware:logger", "filter:GlobalHttp"], status: 401, handledBy: "GlobalHttp" },
            isEdgeCase: true,
          },
          {
            description: "a middleware exception falls back to the built-in handler when only route filters exist",
            args: [
              {
                ...lifecycleApp,
                filters: { route: [{ name: "HttpFilter", catches: ["HttpException"] }] },
                outcome: { at: "middleware:cors", throw: "UnauthorizedException" },
              },
            ],
            expected: { log: ["middleware:cors"], status: 401, handledBy: "default" },
            isEdgeCase: true,
          },
          {
            description: "filters resolve route, then controller, then global, and the first match wins",
            args: [
              {
                ...lifecycleApp,
                filters: {
                  route: [{ name: "NotFoundOnly", catches: ["NotFoundException"] }],
                  controller: [{ name: "CtrlHttp", catches: ["HttpException"] }],
                  global: [{ name: "All", catches: "*" }],
                },
                outcome: { at: "handler", throw: "ConflictException" },
              },
            ],
            expected: {
              log: [...lifecycleUntilHandler, "interceptor:Cache:error", "interceptor:Metrics:error", "filter:CtrlHttp"],
              status: 409,
              handledBy: "CtrlHttp",
            },
          },
          {
            description: "within one level, the last-declared filter is tried first",
            args: [
              {
                ...lifecycleApp,
                filters: {
                  route: [
                    { name: "CatchAll", catches: "*" },
                    { name: "HttpOnly", catches: ["HttpException"] },
                  ],
                },
                outcome: { at: "handler", throw: "BadRequestException" },
              },
            ],
            expected: {
              log: [...lifecycleUntilHandler, "interceptor:Cache:error", "interceptor:Metrics:error", "filter:HttpOnly"],
              status: 400,
              handledBy: "HttpOnly",
            },
            isEdgeCase: true,
          },
          {
            description: "declaring the catch-all last lets it shadow the specific filter",
            args: [
              {
                ...lifecycleApp,
                filters: {
                  route: [
                    { name: "HttpOnly", catches: ["HttpException"] },
                    { name: "CatchAll", catches: "*" },
                  ],
                },
                outcome: { at: "handler", throw: "BadRequestException" },
              },
            ],
            expected: {
              log: [...lifecycleUntilHandler, "interceptor:Cache:error", "interceptor:Metrics:error", "filter:CatchAll"],
              status: 400,
              handledBy: "CatchAll",
            },
          },
          {
            description: "an interceptor that throws before calling the handler skips everything inside it",
            args: [
              {
                ...lifecycleApp,
                interceptors: { global: ["Metrics"], controller: ["Timeout"], route: ["Cache"] },
                outcome: { at: "interceptor:Timeout", throw: "RequestTimeoutException" },
              },
            ],
            expected: {
              log: [
                "middleware:cors",
                "middleware:logger",
                "guard:Auth",
                "guard:Roles",
                "interceptor:Metrics:before",
                "interceptor:Timeout:before",
                "interceptor:Metrics:error",
                "filter:HttpFilter",
              ],
              status: 408,
              handledBy: "HttpFilter",
            },
            isEdgeCase: true,
          },
          {
            description: "several components per level keep their binding order, and interceptors unwind in reverse",
            args: [
              {
                guards: { global: ["G0"], controller: ["G1", "G2"], route: ["G3"] },
                interceptors: { global: ["I0"], controller: ["I1"], route: ["I2", "I3"] },
                pipes: { route: ["P1"], controller: ["P0"] },
                outcome: {},
              },
            ],
            expected: {
              log: [
                "guard:G0",
                "guard:G1",
                "guard:G2",
                "guard:G3",
                "interceptor:I0:before",
                "interceptor:I1:before",
                "interceptor:I2:before",
                "interceptor:I3:before",
                "pipe:P0",
                "pipe:P1",
                "handler",
                "interceptor:I3:after",
                "interceptor:I2:after",
                "interceptor:I1:after",
                "interceptor:I0:after",
              ],
              status: 200,
              handledBy: null,
            },
          },
          {
            description: "an empty configuration still runs the handler",
            args: [{ outcome: {} }],
            expected: { log: ["handler"], status: 200, handledBy: null },
            isEdgeCase: true,
          },
          {
            description: "a failure configured on a component that never runs has no effect",
            args: [{ ...lifecycleApp, outcome: { at: "guard:Admin", deny: true } }],
            expected: { log: lifecycleOk, status: 200, handledBy: null },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "nest-typeorm-prisma",
      moduleId: "be-nestjs",
      trackId: "backend",
      title: "NestJS + TypeORM/Prisma Integration",
      summary:
        "Nest doesn't ship an ORM; it integrates one through DI. With TypeORM, `TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory })` creates one `DataSource` for the app, and `TypeOrmModule.forFeature([User])` registers repositories in a feature module so services can take `@InjectRepository(User) users: Repository<User>`; another module that needs that repository imports `forFeature` itself or gets it re-exported. `autoLoadEntities` picks up entities registered through `forFeature`, but not ones only reachable through a relation. `synchronize: true` rewrites the schema at startup and can drop columns and data; production uses reviewed migrations. With Prisma, the schema lives in `schema.prisma`, `prisma migrate dev` generates SQL migrations, and the generated client is wrapped in a `PrismaService` that extends `PrismaClient` (Prisma 7 generates it into your source tree via the `prisma-client` generator and takes a driver adapter such as `@prisma/adapter-pg`), exported from one module so the whole app shares a single client and pool.\n\nThe choice is mostly about where types come from. TypeORM entities are decorated classes, and query results are typed as the full entity even when you selected two columns or didn't load a relation, so `user.posts` can be `undefined` while typed as an array. Prisma derives each result type from the query's `select` or `include`, so reading an unloaded relation is a compile error, at the cost of a codegen step and a separate schema language.\n\nThe production traps are the same in both. Loading relations in a loop recreates N+1; use `relations`, a join in the query builder, or `include`. Transactions only cover work done through the transaction-scoped handle (`queryRunner.manager`, the `manager` passed to `dataSource.transaction()`, the `tx` argument of `prisma.$transaction(async (tx) => ...)`); a call through the injected repository or `this.prisma` inside the callback commits on its own. And pool sizes multiply by instance count, so ten replicas with a pool of 20 need 200 database connections.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "NestJS: Database (TypeORM)", url: "https://docs.nestjs.com/techniques/database", kind: "docs" },
        { label: "NestJS: Prisma recipe", url: "https://docs.nestjs.com/recipes/prisma", kind: "docs" },
        { label: "TypeORM: Transactions", url: "https://typeorm.io/docs/advanced-topics/transactions/", kind: "docs" },
        { label: "Prisma: Transactions in Prisma ORM", url: "https://www.prisma.io/docs/orm/fundamentals/transactions", kind: "article" },
      ],
      video: {
        title: "Learn NestJS – Complete Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=sFnAHC9lLaw",
        videoId: "sFnAHC9lLaw",
        durationLabel: "13:56:30",
        startSeconds: 5705,
        chapterLabel: "Establish Database Connection",
      },
      alternateVideos: [
        {
          title: "NestJS + Prisma Deep Dive",
          channel: "Michael Guay",
          url: "https://www.youtube.com/watch?v=skQXoZ8chxk",
          videoId: "skQXoZ8chxk",
          durationLabel: "51:41",
        },
        {
          title: "Learn NestJS – Complete Course",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=sFnAHC9lLaw",
          videoId: "sFnAHC9lLaw",
          durationLabel: "13:56:30",
          startSeconds: 40856,
          chapterLabel: "Setup Prisma",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nest-typeorm-prisma-q1",
          prompt: "Why do the NestJS docs warn against `synchronize: true` in production?",
          options: [
            "On every startup TypeORM alters the schema to match the entities, which can drop columns and lose data",
            "It opens a second connection that doubles pool usage",
            "It disables transactions for the whole `DataSource`",
            "It only works with SQLite",
          ],
          correctIndex: 0,
          explanation:
            "Schema sync is convenient in development, but renaming a property can be applied as drop-and-add. Production schemas change through generated migrations that are reviewed and run deliberately.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-typeorm-prisma-q2",
          prompt:
            "`UsersModule` imports `TypeOrmModule.forFeature([User])`. `BillingModule` imports `UsersModule` and a billing service injects `@InjectRepository(User)`. Bootstrap fails to resolve the repository. Which fixes work? (Select all that apply.)",
          options: [
            "Add `exports: [TypeOrmModule]` to `UsersModule` so it re-exports the generated repository providers",
            "Import `TypeOrmModule.forFeature([User])` in `BillingModule` as well",
            "Better still, export a `UsersService` from `UsersModule` and have billing call that instead of the repository",
            "Call `TypeOrmModule.forRoot()` again inside `BillingModule`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`forFeature` providers are scoped to the importing module like any other provider. Re-exporting or importing `forFeature` both work; exposing a service keeps data access behind one module's API. A second `forRoot` would create another connection.",
        },
        {
          id: "nest-typeorm-prisma-q3",
          prompt:
            "The error is thrown after both saves. Which rows exist afterwards?\n\n```ts\nawait this.dataSource.transaction(async (manager) => {\n  await this.usersRepository.save(user);   // injected Repository<User>\n  await manager.save(Order, order);\n  throw new Error('payment declined');\n});\n```",
          options: [
            "The user row exists; the order row was rolled back",
            "Neither row exists; the whole callback was rolled back",
            "Both rows exist, because the error is thrown after the saves",
            "Only the order row exists",
          ],
          correctIndex: 0,
          explanation:
            "Only operations executed through the transactional `manager` join the transaction. The injected repository uses its own connection and commits immediately, a very common partial-write bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-typeorm-prisma-q4",
          prompt:
            "What's wrong with this Prisma interactive transaction?\n\n```ts\nawait this.prisma.$transaction(async (tx) => {\n  await tx.account.update({ where: { id: from }, data: { balance: { decrement: amount } } });\n  await this.prisma.ledgerEntry.create({ data: { from, to, amount } });\n  await tx.account.update({ where: { id: to }, data: { balance: { increment: amount } } });\n});\n```",
          options: [
            "The ledger entry is written through `this.prisma`, outside the transaction, so it survives a rollback",
            "Nothing: every query inside the callback is part of the transaction",
            "`$transaction` callbacks can't contain more than two queries",
            "`increment` and `decrement` can't be used inside transactions",
          ],
          correctIndex: 0,
          explanation:
            "Only queries issued through `tx` belong to the interactive transaction. If the second update fails, the ledger entry created via the root client stays committed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-typeorm-prisma-q5",
          prompt: "Which of these load 100 users with their posts without an N+1 query pattern? (Select all that apply.)",
          options: [
            "`usersRepository.find({ relations: { posts: true } })`",
            "`usersRepository.createQueryBuilder('u').leftJoinAndSelect('u.posts', 'p').getMany()`",
            "`prisma.user.findMany({ include: { posts: true } })`",
            "`Promise.all(users.map((u) => postsRepository.findBy({ authorId: u.id })))`",
            "A `for...of` loop that awaits `postsRepository.findBy({ authorId: u.id })` for each user",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Relations, explicit joins and Prisma's `include` fetch the posts in one query (or one extra batched query). `Promise.all` only runs the 100 per-user queries concurrently; it's still N+1 and can exhaust the pool.",
        },
        {
          id: "nest-typeorm-prisma-q6",
          prompt:
            "You run `usersRepository.find({ select: { id: true, email: true } })` in TypeORM and `prisma.user.findMany({ select: { id: true, email: true } })` in Prisma, then access `.name` on a result. What happens?",
          options: [
            "TypeORM compiles and gives `undefined` at runtime; Prisma fails to compile because `name` isn't in the result type",
            "Both fail to compile, because both ORMs narrow the result type to the selected columns",
            "Both compile and return `undefined`, because neither ORM tracks `select` in its types",
            "TypeORM throws a missing-column error at runtime; Prisma compiles and returns `null`",
          ],
          correctIndex: 0,
          explanation:
            "TypeORM types results as the entity class regardless of `select`, while Prisma computes the result type from `select`/`include`. That's the main type-safety difference between the two.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-typeorm-prisma-q7",
          prompt:
            "`autoLoadEntities: true` is set and `PostsModule` registers `forFeature([Post])`. `Tag` is only referenced from `Post` through `@ManyToMany`, and TypeORM reports that the entity metadata for `Post#tags` was not found. Why?",
          options: [
            "`autoLoadEntities` only adds entities registered via `forFeature()`; entities reachable only through relations aren't included",
            "`autoLoadEntities` only works for `@OneToMany` relations",
            "Entities must also be listed in `synchronize`",
            "Many-to-many entities must be global",
          ],
          correctIndex: 0,
          explanation:
            "The Nest docs call this out explicitly. Register `Tag` with `forFeature([Tag])` somewhere, or list it in `entities`.",
        },
        {
          id: "nest-typeorm-prisma-q8",
          prompt: "Several services each create `new PrismaClient()` in their constructors. What's the main problem?",
          options: [
            "Each client has its own connection pool, so the app opens several pools and can exhaust the database's connection limit",
            "Prisma Client can only be instantiated inside a module factory",
            "The clients share one pool, so transactions leak between services",
            "Prisma forbids more than one client per process",
          ],
          correctIndex: 0,
          explanation:
            "Wrap the client in one `PrismaService` provider exported from a single (often global) module, so every consumer shares one client and pool.",
        },
        {
          id: "nest-typeorm-prisma-q9",
          prompt:
            "An API runs 10 replicas, each with a database pool of 20, against PostgreSQL with `max_connections = 100`. What happens under load?",
          options: [
            "Replicas try to open up to 200 connections and some fail with connection errors; shrink the pools or put a pooler such as PgBouncer in front",
            "PostgreSQL queues the extra connections transparently",
            "Each replica shares the other replicas' idle connections",
            "Nothing, because pools only open one connection at a time",
          ],
          correctIndex: 0,
          explanation:
            "Pool size is per process, so total connections scale with replicas (and serverless instances). Budget connections across every instance, including migrations and admin tools.",
        },
        {
          id: "nest-typeorm-prisma-q10",
          prompt:
            "Following the NestJS Prisma recipe for Prisma 7 in a CommonJS Nest project, which steps are part of the setup? (Select all that apply.)",
          options: [
            "Use the `prisma-client` generator with an explicit `output` path for the generated client",
            "Install a driver adapter such as `@prisma/adapter-pg` and pass it to `PrismaClient`",
            "Set `moduleFormat = \"cjs\"` in the generator, since Prisma 7 generates ESM by default",
            "Enable `synchronize: true` so Prisma creates the tables",
            "Decorate models with `@Entity()` so Nest can inject them",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The recipe sets an `output` path, installs a driver adapter, and sets `moduleFormat` to `cjs` for CommonJS projects. `synchronize` and `@Entity()` are TypeORM concepts; Prisma changes schemas through `prisma migrate`.",
        },
      ],
    },
    {
      id: "nest-microservices",
      moduleId: "be-nestjs",
      trackId: "backend",
      title: "Microservices with NestJS",
      summary:
        "In Nest a microservice is an application that listens on a transport instead of HTTP: `NestFactory.createMicroservice(AppModule, { transport: Transport.TCP })`, with built-in transporters for TCP (the default), Redis, NATS, MQTT, RabbitMQ, Kafka and gRPC. Handlers live in controllers. `@MessagePattern('orders.get')` is request-response: the returned value, Promise or Observable is sent back. `@EventPattern('order.created')` is fire-and-forget, and every handler registered for the pattern runs. On the client, `ClientProxy.send()` returns a cold Observable, so nothing is sent until you subscribe (`await lastValueFrom(...)`), while `emit()` is hot and publishes immediately. Request-response over a broker needs a reply channel; Kafka makes you call `subscribeToResponseOf()` and have a reply-topic partition per instance. Put a `timeout()` on every `send()`.\n\nThe transport is the real architectural decision, because Nest's uniform API hides delivery guarantees rather than removing them. Redis pub/sub is fire-and-forget: with no subscriber listening, the message is gone. TCP is point-to-point with no broker or persistence. RabbitMQ with manual acks (`noAck: false`) redelivers a message whose consumer died, and Kafka redelivers when a handler throws before the offset is committed, so consumers see at-least-once delivery and must be idempotent. gRPC gives typed `.proto` contracts and streaming, at the cost of codegen and HTTP/2 infrastructure.\n\nA hybrid application serves HTTP and one or more transports from one process via `app.connectMicroservice()` and `app.startAllMicroservices()`. Global pipes, guards, interceptors and filters aren't inherited by connected microservices unless you pass `inheritAppConfig: true`, and starting microservices before `app.listen()`/`app.init()` lets them consume messages before lifecycle hooks finish. Throw `RpcException` for errors; an event handler has no response channel, so its failures never reach the emitter. And distribution removes the shared transaction: saving a row and publishing an event aren't atomic, which is what the transactional outbox pattern fixes.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "NestJS: Microservices overview", url: "https://docs.nestjs.com/microservices/basics", kind: "docs" },
        { label: "NestJS: Hybrid application", url: "https://docs.nestjs.com/faq/hybrid-application", kind: "docs" },
        { label: "NestJS: Kafka transporter", url: "https://docs.nestjs.com/microservices/kafka", kind: "docs" },
        { label: "microservices.io: Pattern: Transactional outbox", url: "https://microservices.io/patterns/data/transactional-outbox.html", kind: "article" },
      ],
      video: {
        title: "Microservices in Nest.js – JavaScript Tutorial",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=t76UMpwFNs0",
        videoId: "t76UMpwFNs0",
        durationLabel: "1:51:21",
        startSeconds: 5062,
        chapterLabel: "TCP Based Microservices Communication",
      },
      alternateVideos: [
        {
          title: "Nest.js Microservices Tutorial in 20 Minutes",
          channel: "Michael Guay",
          url: "https://www.youtube.com/watch?v=C250DCwS81Q",
          videoId: "C250DCwS81Q",
          durationLabel: "17:55",
        },
        {
          title: "Nest.js Kafka Microservice Tutorial",
          channel: "Michael Guay",
          url: "https://www.youtube.com/watch?v=JJEKPqSlXvk",
          videoId: "JJEKPqSlXvk",
          durationLabel: "22:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "nest-microservices-q1",
          prompt:
            "The pricing service never receives this message. Why?\n\n```ts\n@Post('quote')\nrequestQuote(@Body() dto: QuoteDto) {\n  this.pricingClient.send('pricing.quote', dto);\n  return { status: 'requested' };\n}\n```",
          options: [
            "`send()` returns a cold Observable; nothing is sent until something subscribes to it",
            "`send()` only works inside `@MessagePattern()` handlers",
            "The message is sent, but TCP drops it because the handler returned before the reply arrived",
            "HTTP controllers can't inject a `ClientProxy`",
          ],
          correctIndex: 0,
          explanation:
            "Request-response calls are lazy. Subscribe or `await lastValueFrom(this.pricingClient.send(...).pipe(timeout(3000)))`. For fire-and-forget notifications use `emit()`, which is hot.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-microservices-q2",
          prompt: "Which statements about `ClientProxy` are true? (Select all that apply.)",
          options: [
            "`emit()` publishes immediately, whether or not you subscribe to the Observable it returns",
            "It connects lazily on the first call unless you call `connect()` yourself, for example in `onApplicationBootstrap`",
            "A `send()` with no reply can wait indefinitely, so production code adds an RxJS `timeout()`",
            "`emit()` resolves with the event handler's return value",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`emit()` returns a hot Observable, the proxy connects on first use (call `connect()` to fail fast at startup), and bounding every `send()` with a timeout avoids hung requests. Event handlers never send anything back.",
        },
        {
          id: "nest-microservices-q3",
          prompt:
            "After an order is placed, the inventory, email and analytics services all need to react, and the order service shouldn't wait for them. What's the right design in Nest?",
          options: [
            "`client.emit('order.placed', payload)` with an `@EventPattern('order.placed')` handler in each service",
            "`client.send('order.placed', payload)` to each service in sequence, awaiting each reply",
            "One `@MessagePattern('order.placed')` handler that calls the other two services",
            "A hybrid app that exposes `POST /order-placed` on each service",
          ],
          correctIndex: 0,
          explanation:
            "Events decouple the producer from its consumers, and every handler registered for a pattern is invoked. Request-response would couple the order service to three services' latency and availability.",
        },
        {
          id: "nest-microservices-q4",
          prompt: "A producer publishes `invoice.created` over Nest's Redis transporter while the billing service is restarting. What happens to that message?",
          options: [
            "It's lost: Redis pub/sub is fire-and-forget and only delivers to subscribers connected at that moment",
            "Redis stores it until billing reconnects, then delivers it",
            "The producer's `emit()` throws because there were no subscribers",
            "Nest retries delivery every second until someone subscribes",
          ],
          correctIndex: 0,
          explanation:
            "The Nest docs spell out that Redis transport messages aren't guaranteed to be handled by any service. If losing an event matters, use a durable transport (RabbitMQ with acks, Kafka) or an outbox.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-microservices-q5",
          prompt:
            "A Kafka `@EventPattern('payment.requested')` handler charges a card, then throws while writing an audit log, so the offset isn't committed. What must the handler be designed for?",
          options: [
            "Redelivery: the same message will be processed again, so the charge must be idempotent (e.g. keyed by a payment id)",
            "Nothing: Kafka guarantees each message is processed exactly once",
            "Loss: an uncommitted message is discarded when the handler throws",
            "Ordering only: Kafka will deliver the message to a different partition",
          ],
          correctIndex: 0,
          explanation:
            "Throwing makes kafkajs retry because the offset wasn't committed, so the side effect can run twice. At-least-once delivery is the norm with brokers; deduplicate with an idempotency key or a processed-messages table.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-microservices-q6",
          prompt:
            "A hybrid app calls `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))` and `app.connectMicroservice({ transport: Transport.RMQ, options: {...} })`. Invalid payloads reach `@MessagePattern` handlers unvalidated. Why?",
          options: [
            "Connected microservices don't inherit the HTTP app's global pipes, guards, interceptors and filters unless `inheritAppConfig: true` is passed",
            "`ValidationPipe` only supports HTTP bodies",
            "RabbitMQ payloads are strings, so decorators can't apply",
            "Global pipes only run for `@EventPattern` handlers",
          ],
          correctIndex: 0,
          explanation:
            "Pass `{ inheritAppConfig: true }` as the second argument to `connectMicroservice()`, or bind the pipe at controller or handler level. `ValidationPipe` works with any transport once it's applied.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-microservices-q7",
          prompt:
            "`main.ts` calls `await app.startAllMicroservices()` and then `await app.listen(3000)`. A handler depends on a cache warmed in `onApplicationBootstrap`. What can go wrong?",
          options: [
            "Microservices start consuming messages before lifecycle hooks finish, so early messages can hit the cold cache",
            "Nothing: microservices never start before `listen()` resolves",
            "`listen()` throws because microservices already bound the port",
            "Lifecycle hooks run twice, once per server",
          ],
          correctIndex: 0,
          explanation:
            "The docs warn that calling `startAllMicroservices()` first lets handlers receive messages before `onModuleInit`/`onApplicationBootstrap` complete. Call `app.listen()` (or `app.init()`) first when handlers need a fully initialized app.",
        },
        {
          id: "nest-microservices-q8",
          prompt: "What does request-response over Kafka require that events don't? (Select all that apply.)",
          options: [
            "The client calls `subscribeToResponseOf('topic')`, which subscribes to a derived reply topic (by default `topic.reply`)",
            "The reply topic needs at least one partition per running client instance",
            "Messages carry a correlation id so replies can be matched to requests",
            "Every consumer must use a unique `groupId`, or Kafka refuses the connection",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Nest implements Kafka request-response with a return address: correlation id, reply topic and reply partition. Too few reply partitions for the number of instances makes some clients error. Consumer groups are how instances share work, not something Kafka rejects.",
        },
        {
          id: "nest-microservices-q9",
          prompt:
            "What's the flaw in this handler, and what's the standard fix?\n\n```ts\nasync placeOrder(dto: CreateOrderDto) {\n  const order = await this.orders.save(dto);\n  this.events.emit('order.placed', { id: order.id });\n  return order;\n}\n```",
          options: [
            "It's a dual write: a crash or broker outage after the commit loses the event. Write the event to an outbox table in the same transaction and have a relay publish it",
            "`emit()` must be awaited before `save()`, so the event always precedes the row",
            "Events can't carry ids; send the whole order instead",
            "The flaw is using `emit()`; switching to `send()` guarantees delivery",
          ],
          correctIndex: 0,
          explanation:
            "The database and the broker can't commit atomically. The transactional outbox makes the event part of the database transaction; a relay publishes it with at-least-once semantics, so consumers still need idempotency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "nest-microservices-q10",
          prompt: "An `@EventPattern('user.deleted')` handler throws an `RpcException`. What does the service that called `emit()` observe?",
          options: [
            "Nothing: events have no response channel, so the error has to be handled (logged, retried, dead-lettered) on the consumer side",
            "Its `emit()` Observable errors with `{ status: 'error', message }`",
            "Nest automatically re-emits the event to the next instance",
            "The producer's global exception filter receives the `RpcException`",
          ],
          correctIndex: 0,
          explanation:
            "Only request-response handlers send errors back (as `{ status: 'error', message }` for an `RpcException`). The docs warn that a filter rethrowing for an event handler sends the error nowhere.",
        },
        {
          id: "nest-microservices-q11",
          prompt: "When is gRPC a better transport choice than a message broker for service-to-service calls?",
          options: [
            "When you want synchronous calls with strongly typed contracts shared as `.proto` files, and optionally streaming, and can run HTTP/2 infrastructure",
            "When producers must keep working while consumers are down for hours",
            "When many independent consumers must each receive every event",
            "When messages must survive a restart of every service",
          ],
          correctIndex: 0,
          explanation:
            "gRPC is typed request-response (plus streaming) between live services. Buffering while consumers are down, fan-out and durability are what brokers such as Kafka and RabbitMQ provide.",
        },
      ],
    },
  ],
} satisfies Module;
