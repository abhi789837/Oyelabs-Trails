import type { Module } from "@/types/curriculum";

// Shared fixtures for the environment-validation challenge.
const APP_ENV_SCHEMA = {
  DATABASE_URL: { type: "url", protocols: ["postgres:", "postgresql:"], secret: true },
  AUTH_SECRET: { type: "string", minLength: 32, secret: true },
  NODE_ENV: { type: "enum", values: ["development", "test", "production"], default: "development" },
  PORT: { type: "int", min: 1, max: 65535, default: 3000 },
  LOG_LEVEL: { type: "enum", values: ["debug", "info", "warn", "error"], default: "info" },
  SENTRY_DSN: { type: "url", optional: true },
  NEXT_PUBLIC_APP_URL: { type: "url", client: true },
  NEXT_PUBLIC_ANALYTICS_ENABLED: { type: "boolean", client: true, default: false },
};

const VALID_ENV = {
  DATABASE_URL: "postgresql://app:s3cr3t-pass@db.internal:5432/notes",
  AUTH_SECRET: "k9Vq2LxP7rT4mW8zB1nH6cY3dF5gJ0sA",
  NODE_ENV: "production",
  PORT: "8080",
  NEXT_PUBLIC_APP_URL: "https://notes.example.com",
  NEXT_PUBLIC_ANALYTICS_ENABLED: "true",
  PATH: "/usr/local/bin:/usr/bin",
  HOME: "/home/app",
};

const NEXT_ENV_OPTIONS = { clientPrefix: "NEXT_PUBLIC_" };

// Shared fixtures for the release-plan challenge: v1 is live, v2 dual-writes full_name, v3 reads it.
const RELEASE_START = {
  running: "v1",
  columns: {
    "users.id": { nullable: false, default: true },
    "users.email": { nullable: false, default: false },
    "users.name": { nullable: false, default: false },
    "users.legacy_role": { nullable: true, default: false },
    "posts.id": { nullable: false, default: true },
    "posts.author_id": { nullable: false, default: false },
    "posts.title": { nullable: false, default: false },
  },
};

const APP_VERSIONS = {
  v1: {
    reads: ["users.id", "users.email", "users.name", "users.legacy_role", "posts.id", "posts.title"],
    writes: ["users.email", "users.name", "posts.author_id", "posts.title"],
  },
  v1b: {
    reads: ["users.id", "users.email", "users.name", "users.legacy_role", "posts.id", "posts.title", "users.bio"],
    writes: ["users.email", "users.name", "posts.author_id", "posts.title"],
  },
  v2: {
    reads: ["users.id", "users.email", "users.name", "posts.id", "posts.title"],
    writes: ["users.email", "users.name", "users.full_name", "posts.author_id", "posts.title"],
  },
  v3: {
    reads: ["users.id", "users.email", "users.full_name", "posts.id", "posts.title"],
    writes: ["users.email", "users.full_name", "posts.author_id", "posts.title"],
  },
};

// Shared fixtures for the notes API capstone. NOTES_NOW is 2026-09-21T14:13:20Z in Unix seconds.
const NOTES_NOW = 1790000000;

const NOTES_CONFIG = {
  issuer: "https://auth.example.com",
  audience: "notes-api",
  secret: "test-signing-secret",
  leewaySeconds: 30,
  now: NOTES_NOW,
};

// Token specs: the driver fills in iss, aud, exp (now + 1 hour) and scope "notes:read notes:write".
const NOTES_TOKENS = {
  alice: { claims: { sub: "alice" } },
  bob: { claims: { sub: "bob" } },
  aliceReader: { claims: { sub: "alice", scope: "notes:read" } },
};

export default {
  id: "fs-capstone",
  trackId: "fullstack",
  name: "Full-Stack Capstone & Deployment",
  description:
    "Everything between \"it works on my machine\" and a live, authenticated app that stays up: validated config and secrets that never reach the bundle, pipelines and migrations that keep old and new code compatible, monitoring that pages on symptoms, the scaling limits that arrive first (usually database connections), and a capstone that ships auth, database, API and UI end to end. Expert level, with three code challenges modeled on real production failures.",
  refs: [
    { label: "The Twelve-Factor App", url: "https://12factor.net/", kind: "article" },
    { label: "Google SRE Book: Monitoring Distributed Systems", url: "https://sre.google/sre-book/monitoring-distributed-systems/", kind: "article" },
    {
      label: "OWASP API Security Top 10 (2023): API1 Broken Object Level Authorization",
      url: "https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/",
      kind: "spec",
    },
  ],
  topics: [
    {
      id: "fscap-env-secrets",
      moduleId: "fs-capstone",
      trackId: "fullstack",
      title: "Environment Config & Secrets Management",
      summary:
        "Twelve-factor config puts everything that varies between deploys (database URLs, API keys, feature switches) in the environment, not in code; the litmus test is whether you could open-source the repository right now without leaking a credential. `.env` files are a local convenience: commit a `.env.example` with names and fake values, keep the real files in `.gitignore`, and treat any secret that ever reached git history as burned, because rotating it is cheaper than scrubbing every clone.\n\nValidate at startup, not at first use. A schema (t3-env with Zod, or your own) that parses `process.env` once, coerces types, applies defaults and reports every problem together turns a 3 a.m. crash into a failed deploy. Two classic traps: `Boolean(\"false\")` is `true`, and an empty `FOO=` line is an empty string, not a missing value. Validation errors must never echo secret values, since they land in CI logs.\n\nThe client bundle is where teams leak secrets. Next.js inlines `NEXT_PUBLIC_*` values (Vite: `VITE_*`) into JavaScript at build time, so anything with the prefix is public forever and frozen at build: promote one image from staging to production and it ships staging's value unless you read that config at runtime. Server-only variables must never carry the prefix, and the `server-only` package makes importing a server module into a client component a build error.\n\nIn production, secrets live in a manager (Vault, AWS Secrets Manager, Doppler or your platform's encrypted store), scoped per environment and injected at deploy or fetched at boot. Rotation means accepting two valid keys for a window, redeploying (Vercel applies env changes only to new deployments), then revoking the old one. Prefer short-lived credentials, such as OIDC from CI to your cloud, over long-lived keys pasted into CI settings.",
      level: "advanced",
      estMinutes: 85,
      webRefs: [
        { label: "Next.js: Environment Variables", url: "https://nextjs.org/docs/app/guides/environment-variables", kind: "docs" },
        { label: "The Twelve-Factor App: III. Config", url: "https://12factor.net/config", kind: "article" },
        {
          label: "OWASP Cheat Sheet Series: Secrets Management",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
          kind: "article",
        },
        { label: "T3 Env: Introduction", url: "https://env.t3.gg/docs/introduction", kind: "docs" },
      ],
      video: {
        title: "Secrets Management: Secure Credentials & Avoid Data Leaks",
        channel: "IBM Technology",
        url: "https://www.youtube.com/watch?v=BqekRTA6VCs",
        videoId: "BqekRTA6VCs",
        durationLabel: "9:40",
      },
      alternateVideos: [
        {
          title: "We Fixed Environment Variables",
          channel: "Theo - t3․gg",
          url: "https://www.youtube.com/watch?v=UnDw3_7_9gc",
          videoId: "UnDw3_7_9gc",
          durationLabel: "7:26",
        },
        {
          title: "How to Deploy, Secure, and Automate Full-Stack Web Apps – Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=wY5pQOTsGaA",
          videoId: "wY5pQOTsGaA",
          durationLabel: "10:29:10",
          startSeconds: 29465,
          chapterLabel: "Secrets & manual deployment reviews",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `parseEnv(schema, env, options)`, the startup check that turns `process.env` into typed, validated config, or fails the deploy with every problem listed at once.\n\n`schema` maps variable names, in declaration order, to specs with any of `type`, `optional`, `default`, `secret`, `client`, `min`, `max`, `minLength`, `values` and `protocols`. `type` is `\"string\"`, `\"int\"`, `\"boolean\"`, `\"url\"` or `\"enum\"`. `env` holds raw strings, including unrelated variables such as `PATH`, and `options.clientPrefix` is the framework's public prefix, such as `NEXT_PUBLIC_` or `VITE_`.\n\nCheck the schema's variables in order and report at most one error for each, formatted as `\"<NAME>: <message>\"`:\n\n- Naming comes first. A variable that is both `secret` and `client` is `secrets can't be client variables`. A `client` variable must start with the prefix (`client variables must start with <prefix>`), and any other variable must not (`server variables can't start with <prefix>`), because bundlers inline prefixed values into public JavaScript.\n- Trim the raw value. A missing, empty or whitespace-only value takes `default` if there is one (already typed; use it as is), is left out of the result if `optional`, and is otherwise `is required`. A default never replaces a value that is present but invalid.\n- `string`: at least `minLength` characters, if set (`must be at least <n> characters`).\n- `int`: digits with an optional leading `-` (`expected an integer`), then `min` (`must be at least <min>`) and `max` (`must be at most <max>`).\n- `boolean`: `true` or `1`, `false` or `0`, case-insensitive (`expected true, false, 1 or 0`).\n- `url`: must parse with `new URL()` (`expected a URL`), and its `protocol` must be one of `protocols`, which defaults to `[\"http:\", \"https:\"]` (`expected protocol <protocols joined with \" or \">`).\n- `enum`: exactly one of `values` (`expected one of <values joined with \", \">`).\n- For the `expected ...` errors of a non-secret variable, append `, got ` and the trimmed raw value as JSON, such as `, got \"80abc\"`. Never include any part of a secret's value, and never include values in `is required`, range or length errors.\n\nAfter the schema, each variable in `env` that starts with the client prefix but isn't in the schema is an error, `<NAME>: not declared in the schema`, listed after the others in name order. Undeclared public variables are how secrets end up in bundles.\n\nReturn `{ ok: false, errors }` if there are any errors. Otherwise return `{ ok: true, env, client, redacted }`: `env` holds every parsed value (`int` as a number, `boolean` as a boolean, everything else as the trimmed string), `client` holds only the client variables (what's safe to ship to the browser), and `redacted` is `env` with each secret replaced by `\"[redacted]\"`, safe to log at startup.",
        starterCode: `/**
 * @param {Record<string, { type: "string" | "int" | "boolean" | "url" | "enum", optional?: boolean, default?: unknown,
 *   secret?: boolean, client?: boolean, min?: number, max?: number, minLength?: number, values?: string[], protocols?: string[] }>} schema
 * @param {Record<string, string | undefined>} env
 * @param {{ clientPrefix: string }} options
 * @returns {{ ok: true, env: object, client: object, redacted: object } | { ok: false, errors: string[] }}
 */
function parseEnv(schema, env, options) {
  // Your code here
}
`,
        functionName: "parseEnv",
        testCases: [
          {
            description: "a valid production environment is parsed, typed and split into client and redacted views",
            args: [APP_ENV_SCHEMA, VALID_ENV, NEXT_ENV_OPTIONS],
            expected: {
              ok: true,
              env: {
                DATABASE_URL: "postgresql://app:s3cr3t-pass@db.internal:5432/notes",
                AUTH_SECRET: "k9Vq2LxP7rT4mW8zB1nH6cY3dF5gJ0sA",
                NODE_ENV: "production",
                PORT: 8080,
                LOG_LEVEL: "info",
                NEXT_PUBLIC_APP_URL: "https://notes.example.com",
                NEXT_PUBLIC_ANALYTICS_ENABLED: true,
              },
              client: { NEXT_PUBLIC_APP_URL: "https://notes.example.com", NEXT_PUBLIC_ANALYTICS_ENABLED: true },
              redacted: {
                DATABASE_URL: "[redacted]",
                AUTH_SECRET: "[redacted]",
                NODE_ENV: "production",
                PORT: 8080,
                LOG_LEVEL: "info",
                NEXT_PUBLIC_APP_URL: "https://notes.example.com",
                NEXT_PUBLIC_ANALYTICS_ENABLED: true,
              },
            },
          },
          {
            description: "defaults fill missing values, and a missing optional variable is left out",
            args: [
              APP_ENV_SCHEMA,
              {
                DATABASE_URL: VALID_ENV.DATABASE_URL,
                AUTH_SECRET: VALID_ENV.AUTH_SECRET,
                NEXT_PUBLIC_APP_URL: VALID_ENV.NEXT_PUBLIC_APP_URL,
              },
              NEXT_ENV_OPTIONS,
            ],
            expected: {
              ok: true,
              env: {
                DATABASE_URL: "postgresql://app:s3cr3t-pass@db.internal:5432/notes",
                AUTH_SECRET: "k9Vq2LxP7rT4mW8zB1nH6cY3dF5gJ0sA",
                NODE_ENV: "development",
                PORT: 3000,
                LOG_LEVEL: "info",
                NEXT_PUBLIC_APP_URL: "https://notes.example.com",
                NEXT_PUBLIC_ANALYTICS_ENABLED: false,
              },
              client: { NEXT_PUBLIC_APP_URL: "https://notes.example.com", NEXT_PUBLIC_ANALYTICS_ENABLED: false },
              redacted: {
                DATABASE_URL: "[redacted]",
                AUTH_SECRET: "[redacted]",
                NODE_ENV: "development",
                PORT: 3000,
                LOG_LEVEL: "info",
                NEXT_PUBLIC_APP_URL: "https://notes.example.com",
                NEXT_PUBLIC_ANALYTICS_ENABLED: false,
              },
            },
          },
          {
            description: "every missing variable is reported at once, in schema order",
            args: [APP_ENV_SCHEMA, { PATH: "/usr/bin" }, NEXT_ENV_OPTIONS],
            expected: {
              ok: false,
              errors: ["DATABASE_URL: is required", "AUTH_SECRET: is required", "NEXT_PUBLIC_APP_URL: is required"],
            },
          },
          {
            description: "type errors quote the offending value for non-secret variables",
            args: [
              APP_ENV_SCHEMA,
              { ...VALID_ENV, NODE_ENV: "prod", PORT: "80abc", LOG_LEVEL: "verbose", NEXT_PUBLIC_ANALYTICS_ENABLED: "yes" },
              NEXT_ENV_OPTIONS,
            ],
            expected: {
              ok: false,
              errors: [
                "NODE_ENV: expected one of development, test, production, got \"prod\"",
                "PORT: expected an integer, got \"80abc\"",
                "LOG_LEVEL: expected one of debug, info, warn, error, got \"verbose\"",
                "NEXT_PUBLIC_ANALYTICS_ENABLED: expected true, false, 1 or 0, got \"yes\"",
              ],
            },
          },
          {
            description: "integer bounds are checked after the format, and range errors don't quote the value",
            args: [
              {
                PORT: { type: "int", min: 1, max: 65535 },
                WORKERS: { type: "int", min: 1, max: 64 },
                TIMEOUT_MS: { type: "int", min: 0 },
                RETRIES: { type: "int", max: 10 },
              },
              { PORT: "70000", WORKERS: "3.5", TIMEOUT_MS: "-1", RETRIES: "11" },
              NEXT_ENV_OPTIONS,
            ],
            expected: {
              ok: false,
              errors: [
                "PORT: must be at most 65535",
                "WORKERS: expected an integer, got \"3.5\"",
                "TIMEOUT_MS: must be at least 0",
                "RETRIES: must be at most 10",
              ],
            },
          },
          {
            description: "values are trimmed before parsing, and booleans accept 1 and 0",
            args: [
              APP_ENV_SCHEMA,
              { ...VALID_ENV, DATABASE_URL: `${VALID_ENV.DATABASE_URL}\n`, PORT: " 8080 ", NEXT_PUBLIC_ANALYTICS_ENABLED: "0" },
              NEXT_ENV_OPTIONS,
            ],
            expected: {
              ok: true,
              env: {
                DATABASE_URL: "postgresql://app:s3cr3t-pass@db.internal:5432/notes",
                AUTH_SECRET: "k9Vq2LxP7rT4mW8zB1nH6cY3dF5gJ0sA",
                NODE_ENV: "production",
                PORT: 8080,
                LOG_LEVEL: "info",
                NEXT_PUBLIC_APP_URL: "https://notes.example.com",
                NEXT_PUBLIC_ANALYTICS_ENABLED: false,
              },
              client: { NEXT_PUBLIC_APP_URL: "https://notes.example.com", NEXT_PUBLIC_ANALYTICS_ENABLED: false },
              redacted: {
                DATABASE_URL: "[redacted]",
                AUTH_SECRET: "[redacted]",
                NODE_ENV: "production",
                PORT: 8080,
                LOG_LEVEL: "info",
                NEXT_PUBLIC_APP_URL: "https://notes.example.com",
                NEXT_PUBLIC_ANALYTICS_ENABLED: false,
              },
            },
          },
          {
            description: "booleans are case-insensitive, and the client prefix comes from the options",
            args: [
              {
                VITE_NEW_EDITOR: { type: "boolean", client: true },
                VITE_BETA_BANNER: { type: "boolean", client: true },
                MAINTENANCE_MODE: { type: "boolean" },
                READ_ONLY: { type: "boolean" },
              },
              { VITE_NEW_EDITOR: "TRUE", VITE_BETA_BANNER: "1", MAINTENANCE_MODE: "False", READ_ONLY: "0" },
              { clientPrefix: "VITE_" },
            ],
            expected: {
              ok: true,
              env: { VITE_NEW_EDITOR: true, VITE_BETA_BANNER: true, MAINTENANCE_MODE: false, READ_ONLY: false },
              client: { VITE_NEW_EDITOR: true, VITE_BETA_BANNER: true },
              redacted: { VITE_NEW_EDITOR: true, VITE_BETA_BANNER: true, MAINTENANCE_MODE: false, READ_ONLY: false },
            },
          },
          {
            description: "empty and whitespace-only values count as missing",
            args: [APP_ENV_SCHEMA, { ...VALID_ENV, DATABASE_URL: "", AUTH_SECRET: "   ", NEXT_PUBLIC_APP_URL: "\n" }, NEXT_ENV_OPTIONS],
            expected: {
              ok: false,
              errors: ["DATABASE_URL: is required", "AUTH_SECRET: is required", "NEXT_PUBLIC_APP_URL: is required"],
            },
            isEdgeCase: true,
          },
          {
            description: "secret values never appear in error messages",
            args: [
              APP_ENV_SCHEMA,
              { ...VALID_ENV, DATABASE_URL: "mysql://admin:hunter2@db:3306/app", AUTH_SECRET: "hunter2" },
              NEXT_ENV_OPTIONS,
            ],
            expected: {
              ok: false,
              errors: [
                "DATABASE_URL: expected protocol postgres: or postgresql:",
                "AUTH_SECRET: must be at least 32 characters",
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "a secret that isn't a URL at all is still reported without its value",
            args: [APP_ENV_SCHEMA, { ...VALID_ENV, DATABASE_URL: "hunter2" }, NEXT_ENV_OPTIONS],
            expected: { ok: false, errors: ["DATABASE_URL: expected a URL"] },
            isEdgeCase: true,
          },
          {
            description: "`localhost:3000` parses as a URL whose protocol is `localhost:`, while a bare hostname isn't a URL",
            args: [
              APP_ENV_SCHEMA,
              { ...VALID_ENV, NEXT_PUBLIC_APP_URL: "localhost:3000", SENTRY_DSN: "o123.ingest.sentry.io" },
              NEXT_ENV_OPTIONS,
            ],
            expected: {
              ok: false,
              errors: [
                "SENTRY_DSN: expected a URL, got \"o123.ingest.sentry.io\"",
                "NEXT_PUBLIC_APP_URL: expected protocol http: or https:, got \"localhost:3000\"",
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "a default never hides an invalid value",
            args: [APP_ENV_SCHEMA, { ...VALID_ENV, PORT: "eighty" }, NEXT_ENV_OPTIONS],
            expected: { ok: false, errors: ["PORT: expected an integer, got \"eighty\""] },
            isEdgeCase: true,
          },
          {
            description: "naming rules keep secrets and server-only variables out of the client bundle",
            args: [
              {
                STRIPE_SECRET_KEY: { type: "string", secret: true, client: true },
                API_URL: { type: "url", client: true },
                NEXT_PUBLIC_DATABASE_URL: { type: "url" },
                NEXT_PUBLIC_SITE_NAME: { type: "string", client: true },
              },
              {
                STRIPE_SECRET_KEY: "sk_live_51Hx",
                API_URL: "https://api.example.com",
                NEXT_PUBLIC_DATABASE_URL: "postgres://db",
                NEXT_PUBLIC_SITE_NAME: "Notes",
              },
              NEXT_ENV_OPTIONS,
            ],
            expected: {
              ok: false,
              errors: [
                "STRIPE_SECRET_KEY: secrets can't be client variables",
                "API_URL: client variables must start with NEXT_PUBLIC_",
                "NEXT_PUBLIC_DATABASE_URL: server variables can't start with NEXT_PUBLIC_",
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "undeclared variables with the client prefix are errors (sorted by name); other undeclared variables are ignored",
            args: [
              APP_ENV_SCHEMA,
              { ...VALID_ENV, NEXT_PUBLIC_STRIPE_SECRET_KEY: "sk_live_51Hx", NEXT_PUBLIC_DEBUG: "1", CI: "true" },
              NEXT_ENV_OPTIONS,
            ],
            expected: {
              ok: false,
              errors: [
                "NEXT_PUBLIC_DEBUG: not declared in the schema",
                "NEXT_PUBLIC_STRIPE_SECRET_KEY: not declared in the schema",
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "an empty schema accepts an environment without client-prefixed variables",
            args: [{}, { PATH: "/usr/bin", HOME: "/home/app" }, NEXT_ENV_OPTIONS],
            expected: { ok: true, env: {}, client: {}, redacted: {} },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "fscap-cicd",
      moduleId: "fs-capstone",
      trackId: "fullstack",
      title: "CI/CD for a Full-Stack App",
      summary:
        "A pipeline's job is to turn a commit into a running release you can undo. The usual stages: install from the lockfile; lint, typecheck and unit-test in parallel; build once into an immutable artifact; run integration and end-to-end tests against a preview environment; migrate; deploy; verify. Promote that same artifact to production, because rebuilding per environment means production runs code you never tested. Preview deployments per pull request need their own database branch or seeded database, never production credentials, and GitHub withholds secrets from workflows triggered by forks for exactly that reason.\n\nMigrations are where full-stack deploys break. During any rolling, blue-green or canary deploy, old and new code share one database, and migrations usually run just before the new code starts, so every schema change must work with both versions. Expand (add nullable columns and new tables), deploy code that writes both shapes, backfill, switch reads, relax old constraints, and only contract (drop or rename) in a later release. One-step renames and drops, a NOT NULL column without a default, and code deployed before its migration are the classic outages.\n\nStrategies trade cost for blast radius. Rolling replaces instances in batches: cheap, but versions mix for minutes. Blue-green flips traffic between two full environments: instant cutover and rollback, double capacity, and the database is still shared. Canary sends a slice of traffic to the new version and promotes it only if its error rate and latency stay close to the baseline, ideally judged automatically. Code rolls back in seconds; schemas don't, which is one more reason migrations must stay backward compatible. Feature flags separate deploy from release, so dark code ships safely and turns on per cohort, but every flag is a branch to test and eventually delete.",
      level: "expert",
      estMinutes: 110,
      webRefs: [
        {
          label: "GitHub Docs: Managing environments for deployment",
          url: "https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments",
          kind: "docs",
        },
        { label: "Martin Fowler: Parallel Change (expand and contract)", url: "https://martinfowler.com/bliki/ParallelChange.html", kind: "article" },
        { label: "Martin Fowler: Canary Release", url: "https://martinfowler.com/bliki/CanaryRelease.html", kind: "article" },
        { label: "Pete Hodgson: Feature Toggles (aka Feature Flags)", url: "https://martinfowler.com/articles/feature-toggles.html", kind: "article" },
      ],
      video: {
        title: "Top 5 Most-Used Deployment Strategies",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=AWVTKBUnoIg",
        videoId: "AWVTKBUnoIg",
        durationLabel: "10:00",
      },
      alternateVideos: [
        {
          title: "Every engineer should know this.. (Expand-Contract Pattern)",
          channel: "Software Developer Diaries",
          url: "https://www.youtube.com/watch?v=ONSCQWLD9d0",
          videoId: "ONSCQWLD9d0",
          durationLabel: "6:35",
        },
        {
          title: "How to Deploy, Secure, and Automate Full-Stack Web Apps – Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=wY5pQOTsGaA",
          videoId: "wY5pQOTsGaA",
          durationLabel: "10:29:10",
          startSeconds: 19777,
          chapterLabel: "Module 5: Automation pipeline",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `checkRelease(initial, versions, plan)`, a pre-deploy check that simulates a release plan step by step and reports the first step that would fail a migration or break a version of the app that's serving traffic.\n\n- `initial` is `{ running, columns }`. `running` is the version serving traffic, and `columns` maps `\"table.column\"` names to `{ nullable, default }`, where `default` is `true` when the column has a default value. Every table already has rows, and no row holds a NULL yet.\n- `versions` maps each version name to `{ reads, writes }`: the columns its queries read and the columns its inserts set. A version inserts into every table that appears in its `writes`.\n- `plan` is an array of steps. `{ migrate: [ops] }` runs a migration while the current version keeps serving. `{ deploy: \"v2\" }` is a rolling deploy: the current and the new version serve side by side, then only the new one. `{ deploy: \"v2\", migrate: [ops] }` runs the migration first, as a release-phase command, and then rolls out, so the old version has to survive the migration too.\n\nOperations run in order, and the first one that fails ends the check:\n\n- `{ op: \"addColumn\", column, nullable, default }` fails with `<column> already exists`, or `can't add NOT NULL column <column> without a default: the table has rows`. Existing rows get NULL when the new column is nullable without a default.\n- `{ op: \"renameColumn\", from, to }` keeps the column's constraints and data, and fails with `<from> doesn't exist` or `<to> already exists`.\n- `{ op: \"dropColumn\", column }`, `{ op: \"backfill\", column }` (fills every existing NULL), `{ op: \"dropNotNull\", column }` and `{ op: \"setNotNull\", column }` fail with `<column> doesn't exist`. `setNotNull` also fails with `<column> still contains NULLs`.\n\nWhen a step's operations succeed, check every version serving during the step (the current one, plus the new one for a deploy):\n\n- `<version> uses <column>, which doesn't exist`, once for each missing column in its `reads` or `writes`.\n- `<version> inserts into <table> without <column>, which is NOT NULL with no default`, for each such column of a table it inserts into that it doesn't write.\n\nThen track NULLs. While a version that inserts into a table without writing one of its nullable, default-less columns is serving (during the step or after it), that column gains NULLs again. That's why a backfill only sticks once every serving version writes the column.\n\nReturn `{ ok: false, step, problems }` for the first failing step, with `problems` sorted. A failed operation reports just its own message, and deploying a version that isn't in `versions` fails with `unknown version <name>` before its migration runs. If every step passes, return `{ ok: true, running, columns }`, where `columns` maps each remaining column to `\"not null\"`, `\"not null default\"`, `\"null\"` or `\"null default\"`.",
        starterCode: `/**
 * @param {{ running: string, columns: Record<string, { nullable: boolean, default: boolean }> }} initial
 * @param {Record<string, { reads: string[], writes: string[] }>} versions
 * @param {Array<{ migrate?: object[], deploy?: string }>} plan
 * @returns {{ ok: true, running: string, columns: Record<string, string> } | { ok: false, step: number, problems: string[] }}
 */
function checkRelease(initial, versions, plan) {
  // Your code here
}
`,
        functionName: "checkRelease",
        testCases: [
          {
            description: "the full expand/contract rename never breaks a running version",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { migrate: [{ op: "addColumn", column: "users.full_name", nullable: true, default: false }] },
                { deploy: "v2" },
                { migrate: [{ op: "backfill", column: "users.full_name" }, { op: "setNotNull", column: "users.full_name" }] },
                { migrate: [{ op: "dropNotNull", column: "users.name" }] },
                { deploy: "v3" },
                { migrate: [{ op: "dropColumn", column: "users.name" }, { op: "dropColumn", column: "users.legacy_role" }] },
              ],
            ],
            expected: {
              ok: true,
              running: "v3",
              columns: {
                "users.id": "not null default",
                "users.email": "not null",
                "posts.id": "not null default",
                "posts.author_id": "not null",
                "posts.title": "not null",
                "users.full_name": "not null",
              },
            },
          },
          {
            description: "renaming a column in one migration breaks the version that's still serving",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { migrate: [{ op: "renameColumn", from: "users.name", to: "users.full_name" }] },
                { deploy: "v3" },
              ],
            ],
            expected: {
              ok: false,
              step: 0,
              problems: [
                "v1 inserts into users without users.full_name, which is NOT NULL with no default",
                "v1 uses users.name, which doesn't exist",
              ],
            },
          },
          {
            description: "deploying code before its migration has run breaks the new code",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { deploy: "v2" },
                { migrate: [{ op: "addColumn", column: "users.full_name", nullable: true, default: false }] },
              ],
            ],
            expected: { ok: false, step: 0, problems: ["v2 uses users.full_name, which doesn't exist"] },
          },
          {
            description: "an additive migration can ship in the same release as the code that uses it",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { deploy: "v1b", migrate: [{ op: "addColumn", column: "users.bio", nullable: true, default: false }] },
              ],
            ],
            expected: {
              ok: true,
              running: "v1b",
              columns: {
                "users.id": "not null default",
                "users.email": "not null",
                "users.name": "not null",
                "users.legacy_role": "null",
                "posts.id": "not null default",
                "posts.author_id": "not null",
                "posts.title": "not null",
                "users.bio": "null",
              },
            },
          },
          {
            description: "dropping a column in the release that stops using it breaks the old instances during the rollout",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { deploy: "v2", migrate: [{ op: "addColumn", column: "users.full_name", nullable: true, default: false }, { op: "dropColumn", column: "users.legacy_role" }] },
              ],
            ],
            expected: { ok: false, step: 0, problems: ["v1 uses users.legacy_role, which doesn't exist"] },
          },
          {
            description: "dropping it once no running version uses it is the contract step",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { deploy: "v2", migrate: [{ op: "addColumn", column: "users.full_name", nullable: true, default: false }] },
                { migrate: [{ op: "dropColumn", column: "users.legacy_role" }] },
              ],
            ],
            expected: {
              ok: true,
              running: "v2",
              columns: {
                "users.id": "not null default",
                "users.email": "not null",
                "users.name": "not null",
                "posts.id": "not null default",
                "posts.author_id": "not null",
                "posts.title": "not null",
                "users.full_name": "null",
              },
            },
          },
          {
            description: "a NOT NULL column with a default is safe for old inserts",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { migrate: [{ op: "addColumn", column: "posts.status", nullable: false, default: true }] },
              ],
            ],
            expected: {
              ok: true,
              running: "v1",
              columns: {
                "users.id": "not null default",
                "users.email": "not null",
                "users.name": "not null",
                "users.legacy_role": "null",
                "posts.id": "not null default",
                "posts.author_id": "not null",
                "posts.title": "not null",
                "posts.status": "not null default",
              },
            },
          },
          {
            description: "a NOT NULL column without a default can't be added to a table with rows",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { migrate: [{ op: "addColumn", column: "users.tenant_id", nullable: false, default: false }] },
              ],
            ],
            expected: {
              ok: false,
              step: 0,
              problems: ["can't add NOT NULL column users.tenant_id without a default: the table has rows"],
            },
            isEdgeCase: true,
          },
          {
            description: "backfilling before every instance writes the new column lets NULLs back in",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { migrate: [{ op: "addColumn", column: "users.full_name", nullable: true, default: false }] },
                { migrate: [{ op: "backfill", column: "users.full_name" }] },
                { deploy: "v2" },
                { migrate: [{ op: "setNotNull", column: "users.full_name" }] },
              ],
            ],
            expected: { ok: false, step: 3, problems: ["users.full_name still contains NULLs"] },
            isEdgeCase: true,
          },
          {
            description: "setting NOT NULL on a column the running version never writes breaks its inserts",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { migrate: [{ op: "addColumn", column: "users.full_name", nullable: true, default: false }] },
                { migrate: [{ op: "backfill", column: "users.full_name" }, { op: "setNotNull", column: "users.full_name" }] },
              ],
            ],
            expected: {
              ok: false,
              step: 1,
              problems: ["v1 inserts into users without users.full_name, which is NOT NULL with no default"],
            },
            isEdgeCase: true,
          },
          {
            description: "a new version must keep writing an old NOT NULL column until the constraint is relaxed",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { migrate: [{ op: "addColumn", column: "users.full_name", nullable: true, default: false }] },
                { deploy: "v2" },
                { migrate: [{ op: "backfill", column: "users.full_name" }, { op: "setNotNull", column: "users.full_name" }] },
                { deploy: "v3" },
              ],
            ],
            expected: {
              ok: false,
              step: 3,
              problems: ["v3 inserts into users without users.name, which is NOT NULL with no default"],
            },
            isEdgeCase: true,
          },
          {
            description: "a migration stops at its first failing operation",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { migrate: [{ op: "addColumn", column: "users.bio", nullable: true, default: false }, { op: "renameColumn", from: "users.name", to: "users.email" }, { op: "dropColumn", column: "users.nickname" }] },
              ],
            ],
            expected: { ok: false, step: 0, problems: ["users.email already exists"] },
            isEdgeCase: true,
          },
          {
            description: "dropping a column that doesn't exist fails",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { migrate: [{ op: "dropColumn", column: "users.nickname" }] },
              ],
            ],
            expected: { ok: false, step: 0, problems: ["users.nickname doesn't exist"] },
            isEdgeCase: true,
          },
          {
            description: "deploying an unknown version fails before its migration runs",
            args: [
              RELEASE_START,
              APP_VERSIONS,
              [
                { deploy: "v9", migrate: [{ op: "addColumn", column: "users.bio", nullable: true, default: false }] },
              ],
            ],
            expected: { ok: false, step: 0, problems: ["unknown version v9"] },
            isEdgeCase: true,
          },
          {
            description: "an empty plan changes nothing",
            args: [RELEASE_START, APP_VERSIONS, []],
            expected: {
              ok: true,
              running: "v1",
              columns: {
                "users.id": "not null default",
                "users.email": "not null",
                "users.name": "not null",
                "users.legacy_role": "null",
                "posts.id": "not null default",
                "posts.author_id": "not null",
                "posts.title": "not null",
              },
            },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "fscap-monitoring",
      moduleId: "fs-capstone",
      trackId: "fullstack",
      title: "Monitoring a Live Full-Stack App",
      summary:
        "Monitoring has to answer two questions fast: are users hurting, and where? Metrics (rate, errors, duration, saturation) are cheap to store and alert on, but only while label cardinality stays bounded: a `userId` or raw-URL label turns one time series into millions. Structured JSON logs carry the detail, with a request id and trace id on every line and no tokens, passwords or raw request headers. Distributed traces follow one request from the browser through the API to the database, which is how you find the one slow downstream call; OpenTelemetry gives vendor-neutral instrumentation and W3C `traceparent` propagation.\n\nAlert on symptoms, not causes. Define SLIs from the user's side (the share of requests that succeed within 300 ms), set an SLO such as 99.9% over 30 days, and page on how fast the error budget burns. Google's SRE workbook pages when 2% of a month's budget goes in an hour (a burn rate of 14.4, confirmed by a 5-minute window so the alert resets quickly) and files a ticket for slow burns. CPU at 90% with happy users isn't an incident; a 3% checkout failure rate on idle servers is. Averages hide pain, so use percentiles or threshold-based SLIs.\n\nThe browser is half the app. Real-user monitoring measures Core Web Vitals in the field (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile), which lab tools can't, and catches front-end errors. Error trackers need source maps uploaded from the build that shipped (Sentry injects debug IDs to match them), or stack traces point at `main.js:1:48213`; upload them to the tracker rather than serving them publicly. Synthetic checks cover what real traffic can't, such as login breaking at 3 a.m. when nobody is using the site.",
      level: "expert",
      estMinutes: 85,
      webRefs: [
        { label: "Google SRE Workbook: Alerting on SLOs", url: "https://sre.google/workbook/alerting-on-slos/", kind: "docs" },
        { label: "Google SRE Book: Monitoring Distributed Systems", url: "https://sre.google/sre-book/monitoring-distributed-systems/", kind: "article" },
        { label: "OpenTelemetry: Observability primer", url: "https://opentelemetry.io/docs/concepts/observability-primer/", kind: "docs" },
        { label: "Sentry Docs: Source Maps (JavaScript)", url: "https://docs.sentry.io/platforms/javascript/sourcemaps/", kind: "docs" },
      ],
      video: {
        title: "Observability Crash Course: Logs, Metrics, Traces Explained",
        channel: "System Design Lab",
        url: "https://www.youtube.com/watch?v=umm-MyCl3Q4",
        videoId: "umm-MyCl3Q4",
        durationLabel: "35:49",
      },
      alternateVideos: [
        {
          title: "Getting started with SLOs",
          channel: "Google Cloud Tech",
          url: "https://www.youtube.com/watch?v=U53wC2A75Is",
          videoId: "U53wC2A75Is",
          durationLabel: "8:12",
        },
        {
          title: "Adding Source Maps for JavaScript Projects (Video 6 of 9)",
          channel: "Sentry",
          url: "https://www.youtube.com/watch?v=hEwpjRHRpC8",
          videoId: "hEwpjRHRpC8",
          durationLabel: "12:22",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "fscap-monitoring-q1",
          prompt:
            "At 3 a.m. a page fires: `CPU > 85% on api-3`. Checkout success rate and latency are normal. What's the better alerting design?",
          options: [
            "Page on user-facing symptoms such as SLO burn, and send CPU to a dashboard",
            "Lower the CPU threshold to 70% so the page fires earlier next time",
            "Page on every host metric, because any of them could be the cause",
            "Silence alerts overnight and review the dashboards each morning",
          ],
          correctIndex: 0,
          explanation:
            "A page should mean users are hurting now. High CPU with healthy SLIs is capacity information, and paging on it trains people to ignore the pager; silencing nights just hides real outages.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fscap-monitoring-q2",
          prompt:
            "A developer adds `userId` and the full request URL as labels on the Prometheus counter `http_requests_total`. What happens?",
          options: [
            "Each label combination becomes a new time series, so series, memory and cost explode",
            "Nothing, because label values are compressed, so cardinality doesn't matter",
            "Prometheus rejects any label that has more than 100 distinct values",
            "Only disk usage grows; memory and query speed aren't affected",
          ],
          correctIndex: 0,
          explanation:
            "Time-series databases index each unique label set, so unbounded labels (user ids, raw paths with ids in them) multiply series without limit. Use route templates such as `/notes/:id` and bounded labels, and look individual requests up in traces.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fscap-monitoring-q3",
          prompt:
            "Your SLO is 99.9% of requests succeeding over 30 days. For the last hour, 1.44% of requests have failed. What's the burn rate, and at that pace how long does the month's error budget last?",
          options: [
            "14.4, and the budget is gone in about 50 hours",
            "1.44, and the budget lasts about 21 days",
            "14.4, and the budget is gone in about 14 hours",
            "0.144, so the budget is barely touched",
          ],
          correctIndex: 0,
          explanation:
            "Burn rate is the error rate divided by the allowed error rate: 0.0144 / 0.001 = 14.4. A 720-hour budget burned 14.4 times too fast lasts 720 / 14.4 = 50 hours, and one such hour uses 2% of it, the SRE workbook's paging threshold.",
        },
        {
          id: "fscap-monitoring-q4",
          prompt: "Roughly how much total downtime does a 99.9% availability SLO allow over a 30-day window?",
          options: ["About 43 minutes", "About 4 minutes", "About 7 hours", "About 22 minutes"],
          correctIndex: 0,
          explanation:
            "0.1% of 43,200 minutes is 43.2 minutes. About 4 minutes is 99.99%, about 22 minutes is 99.95%, and about 7 hours is 99%.",
        },
        {
          id: "fscap-monitoring-q5",
          prompt:
            "Sentry shows production errors as `at e (main-3f9a.js:1:48213)`. Which steps give readable stack traces without publishing your source? (Select all that apply.)",
          options: [
            "Generate source maps in the production build and upload them to Sentry from CI with its bundler plugin, which injects debug IDs",
            "Don't serve the `.map` files publicly once they're uploaded",
            "Ship unminified JavaScript to production",
            "After an incident, rebuild the app with source maps and upload those",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Maps must come from the exact build that's deployed, which debug IDs guarantee; a later rebuild can produce different output that no longer matches. Keeping maps private stops anyone from downloading your original source, and unminified bundles cost every user bandwidth.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fscap-monitoring-q6",
          prompt:
            "Lighthouse gives a page a performance score of 98, but Search Console's Core Web Vitals report (field data) says its INP is poor. How can both be true?",
          options: [
            "INP comes from real interactions on real devices, which a lab run doesn't reproduce",
            "Lighthouse measures INP more accurately, so the field data must be wrong",
            "INP is only measured on desktop, while Lighthouse tests a mobile profile",
            "Search Console averages INP, while Lighthouse reports the 75th percentile",
          ],
          correctIndex: 0,
          explanation:
            "INP needs actual user input across the whole visit, and it depends on device speed, network and what else is running. Lab tools are for catching regressions before release; field data at the 75th percentile is the assessment.",
        },
        {
          id: "fscap-monitoring-q7",
          prompt:
            "Which of these are Core Web Vitals \"good\" thresholds, assessed at the 75th percentile of page loads? (Select all that apply.)",
          options: [
            "Largest Contentful Paint of 2.5 seconds or less",
            "Interaction to Next Paint of 200 milliseconds or less",
            "Cumulative Layout Shift of 0.1 or less",
            "First Input Delay of 100 milliseconds or less",
            "Time to First Byte of 800 milliseconds or less",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The three Core Web Vitals are LCP, INP and CLS. INP replaced FID as a Core Web Vital in 2024, and TTFB is a useful diagnostic but not a Core Web Vital.",
        },
        {
          id: "fscap-monitoring-q8",
          prompt: "An API's mean latency is 120 ms, yet users say the dashboard is slow. What's the most likely blind spot?",
          options: [
            "The mean hides the tail; a few slow requests barely move it, so track p95 and p99",
            "The mean is always higher than p99, so latency must be fine",
            "Latency metrics can't capture the slowness that users perceive",
            "At 120 ms on average, the backend can't be the cause of slowness",
          ],
          correctIndex: 0,
          explanation:
            "A page that makes ten API calls hits the slow tail often, even when the average looks healthy. Percentiles, or an SLI such as \"requests under 300 ms\", show what users actually feel.",
        },
        {
          id: "fscap-monitoring-q9",
          prompt:
            "Checkout is slow for some users, and the API's p99 is 4 seconds. Which signal shows which downstream call inside those slow requests takes the time?",
          options: [
            "A distributed trace of a slow request, with a span per downstream call",
            "The CPU and memory graphs of the API hosts during the slow period",
            "The count of 5xx responses from the checkout endpoint",
            "A synthetic uptime check that probes checkout every minute",
          ],
          correctIndex: 0,
          explanation:
            "Traces break one request into timed spans across services, so the slow span stands out. Metrics tell you that something is slow, not which call in a specific request.",
        },
        {
          id: "fscap-monitoring-q10",
          prompt:
            "What do synthetic checks (scripted probes of key flows from several regions) give you that real-user monitoring doesn't? (Select all that apply.)",
          options: [
            "Detection when there's no traffic, such as login breaking at 3 a.m.",
            "A consistent baseline from fixed locations and devices, useful for comparing releases",
            "A check of critical flows right after a deploy, before users run into them",
            "An accurate picture of your real users' devices and networks",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Synthetics are controlled and always on, which suits availability and regression checks. They can't tell you what real users on real hardware experience; that's what RUM is for.",
        },
        {
          id: "fscap-monitoring-q11",
          prompt:
            "To debug an auth issue, someone adds `logger.info({ headers: req.headers }, \"request\")` to every API request. Why is this an incident waiting to happen?",
          options: [
            "Bearer tokens and session cookies land in the log pipeline, readable by far more people",
            "Request headers can't be serialized to JSON, so logging throws",
            "Structured loggers only record headers in development builds",
            "It only matters if the logs are kept for more than 30 days",
          ],
          correctIndex: 0,
          explanation:
            "Logs are broadly readable, often exported and kept for a long time, so credentials in logs are effectively leaked. Log an allow-list of fields or use the logger's redaction (for example pino's `redact`) for `authorization` and `cookie`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fscap-monitoring-q12",
          prompt: "A canary release serves 5% of traffic. Which signal should trigger an automatic rollback?",
          options: [
            "The canary's error rate or p99 latency being clearly worse than the baseline's over the same window",
            "The canary's CPU going above 80%",
            "Any single 500 response from the canary",
            "The whole site's error rate crossing the SLO, measured across all instances",
          ],
          correctIndex: 0,
          explanation:
            "Comparing canary to baseline over the same period controls for time of day and traffic mix. A site-wide metric dilutes a 5% canary twentyfold, single errors are noise, and CPU says nothing about correctness.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "fscap-scaling",
      moduleId: "fs-capstone",
      trackId: "fullstack",
      title: "Scaling Considerations as Traffic Grows",
      summary:
        "Scaling a full-stack app is mostly removing the reasons a request must land on a particular machine, then protecting the one thing you can't easily clone: the primary database. Keep the app tier stateless, with sessions in signed cookies or Redis rather than process memory, uploads in object storage, and no sticky sessions, which unbalance load and log people out whenever an instance is replaced. Then instances can come and go behind a load balancer or a serverless platform.\n\nThe database usually runs out of connections before CPU. PostgreSQL forks a process per connection and ships with `max_connections = 100`, and throughput peaks at a small active pool (the Postgres wiki's rule of thumb is cores × 2 plus spindles), so more connections make things slower. Serverless multiplies the problem, because every function instance opens its own pool and a spike becomes a connection storm. Put a pooler in front (PgBouncer in transaction mode, RDS Proxy or your provider's pooled URL) and keep per-instance pools tiny, knowing that transaction pooling breaks session state such as `SET`, `LISTEN` and session advisory locks. Read replicas offload reads but lag, so read-your-own-writes paths go to the primary.\n\nThen cache: a CDN for hashed, immutable static assets and for public pages with `s-maxage` and `stale-while-revalidate`, never for personalized responses; Redis for hot queries, with versioned keys so a deploy that changes a cached shape never reads old entries, and jittered TTLs or request coalescing so an expiring hot key doesn't stampede the database. Slow work (emails, PDFs, webhooks, image processing) moves to a queue with idempotent, retrying workers. Rate limits need a shared store, since ten instances with in-memory counters allow ten times the limit. Capacity planning is Little's Law (in-flight requests = throughput × latency) plus load tests well above the expected peak.",
      level: "expert",
      estMinutes: 70,
      webRefs: [
        { label: "PgBouncer: Features (pool modes)", url: "https://www.pgbouncer.org/features.html", kind: "docs" },
        { label: "PostgreSQL Wiki: Number Of Database Connections", url: "https://wiki.postgresql.org/wiki/Number_Of_Database_Connections", kind: "article" },
        { label: "Vercel Knowledge Base: Connection Pooling with Vercel Functions", url: "https://vercel.com/kb/guide/connection-pooling-with-functions", kind: "docs" },
        { label: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", kind: "interview-prep" },
      ],
      video: {
        title: "Scalability Simply Explained in 10 Minutes",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=EWS_CIxttVw",
        videoId: "EWS_CIxttVw",
        durationLabel: "9:20",
      },
      alternateVideos: [
        {
          title: "PostgreSQL connection management and per-client process model explained",
          channel: "Arpit Bhayani",
          url: "https://www.youtube.com/watch?v=o7qLKfILuD8",
          videoId: "o7qLKfILuD8",
          durationLabel: "8:34",
        },
        {
          title: "7 Must-know Strategies to Scale Your Database",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=_1IKwnbscQU",
          videoId: "_1IKwnbscQU",
          durationLabel: "8:41",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "fscap-scaling-q1",
          prompt:
            "A Next.js app on serverless functions uses an ORM with a pool of 10 connections per instance. A marketing email drives traffic, the platform scales to 80 concurrent instances, and Postgres starts refusing connections. What's the fix?",
          options: [
            "Put a pooler in front (PgBouncer, RDS Proxy) and keep each instance's pool tiny",
            "Raise `max_connections` to 5,000 so every instance gets its full pool",
            "Increase each instance's pool to 50 so that requests wait less",
            "Open a fresh connection for every query and close it straight away",
          ],
          correctIndex: 0,
          explanation:
            "80 × 10 = 800 connections against a default limit of 100. Thousands of Postgres backends (one process each) would make everything slower, and connect-per-query adds TCP, TLS and auth cost to every query; a pooler (PgBouncer in transaction mode, RDS Proxy or the provider's pooled URL) multiplexes many clients onto a few server connections.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fscap-scaling-q2",
          prompt: "Your app moves behind PgBouncer in transaction pooling mode. Which features stop working reliably? (Select all that apply.)",
          options: [
            "Session-level `SET` commands such as `SET search_path`",
            "`LISTEN` subscriptions",
            "Session-level advisory locks (`pg_advisory_lock`)",
            "Ordinary transactions wrapped in `BEGIN` … `COMMIT`",
            "Protocol-level prepared statements once `max_prepared_statements` is set",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "In transaction mode your next transaction may run on a different server connection, so anything tied to a session is lost or leaks to another client. Transactions are exactly what the mode preserves, and PgBouncer supports protocol-level prepared statements when `max_prepared_statements` is non-zero.",
        },
        {
          id: "fscap-scaling-q3",
          prompt: "Sessions live in each app server's memory, so the load balancer uses sticky sessions. What goes wrong as you scale?",
          options: [
            "Load gets uneven, and users are logged out whenever their instance is replaced",
            "Nothing: sticky sessions scale linearly as you add instances",
            "Sticky sessions stop TLS termination at the load balancer",
            "Each user ends up holding more database connections",
          ],
          correctIndex: 0,
          explanation:
            "Stickiness ties state to a machine that is meant to be disposable. Instances are replaced by deploys, autoscaling and crashes; with sessions in Redis or the database, or in signed cookies, a stateless tier survives all three without anyone noticing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fscap-scaling-q4",
          prompt:
            "A release renames a field inside the `user:{id}` object cached in Redis. During and after the rolling deploy, some requests crash reading cached users. Which fix prevents this class of bug?",
          options: [
            "Version the cache keys (such as `v2:user:{id}`) so old and new code never share entries",
            "Flush all of Redis at the start of each deploy so no old entries remain",
            "Increase the TTL so entries stay consistent for longer",
            "Cache users in each server's memory instead of in Redis",
          ],
          correctIndex: 0,
          explanation:
            "During a rolling deploy old instances keep writing the old shape, so a flush at the start doesn't help, and a full flush also stampedes the database. Versioned keys let both shapes coexist until the old ones expire.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fscap-scaling-q5",
          prompt:
            "After a user updates their profile, the next page load, served from a read replica, still shows the old name. What's the standard fix?",
          options: [
            "Route reads that must see the user's own recent writes to the primary",
            "Add more read replicas so each one carries less load",
            "Cache the profile page on the CDN so it loads faster",
            "Retry the read in the browser until the new value appears",
          ],
          correctIndex: 0,
          explanation:
            "Asynchronous replicas lag by design, and more replicas don't shorten the lag. Routing read-your-own-writes paths to the primary (for example for a few seconds after a write) keeps replicas for everything that tolerates slight staleness.",
        },
        {
          id: "fscap-scaling-q6",
          prompt:
            "A Postgres server has 8 cores on SSDs. The team raised the application's pool to 400 connections \"for throughput\", and latency got worse. What does the Postgres wiki's guidance suggest?",
          options: [
            "About cores × 2 plus spindles, a few dozen here; more adds contention, not throughput",
            "One connection per expected concurrent user of the application",
            "As many connections as `max_connections` allows, to use the server fully",
            "Exactly one connection per CPU core, so eight in total",
          ],
          correctIndex: 0,
          explanation:
            "Once CPU and I/O are saturated, more backends compete for locks, caches and cores. A small pool with a queue in front of it usually beats hundreds of concurrent queries.",
        },
        {
          id: "fscap-scaling-q7",
          prompt:
            "You move \"send receipt email\" out of the checkout request and into a queue worker. Which statements are true? (Select all that apply.)",
          options: [
            "Checkout latency no longer includes the email provider's latency or outages",
            "Queues usually deliver at least once, so the worker must be idempotent",
            "Failed jobs can be retried with backoff and parked in a dead-letter queue",
            "The email is now guaranteed to be sent exactly once, even across retries",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Queues decouple the request from slow or flaky work and make retries systematic. Exactly-once delivery isn't something a queue gives you; idempotent consumers (for example keyed by order id) make at-least-once delivery safe.",
        },
        {
          id: "fscap-scaling-q8",
          prompt:
            "Your login endpoint allows 5 attempts per minute per IP with an in-memory counter. You scale to 10 instances behind a round-robin load balancer. What's the effective limit?",
          options: [
            "Up to about 50 a minute, because each instance counts separately",
            "Still 5, because the load balancer coordinates the counters",
            "Fewer than 5, because each instance sees only part of the traffic",
            "Unlimited, because in-memory counters reset on every request",
          ],
          correctIndex: 0,
          explanation:
            "Each process only sees the requests routed to it, so the limit multiplies with the instance count, and it resets on every deploy. A shared counter in Redis, or a limit enforced at the edge, makes it global.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fscap-scaling-q9",
          prompt: "Your API must handle 2,000 requests per second at an average latency of 150 ms. Roughly how many requests are in flight at any moment?",
          options: ["About 300", "About 13", "About 2,000", "About 30,000"],
          correctIndex: 0,
          explanation:
            "Little's Law: in-flight requests = arrival rate × time in system = 2,000 × 0.15 s = 300. That number, not requests per second, sizes worker concurrency and connection pools.",
        },
        {
          id: "fscap-scaling-q10",
          prompt: "To cut load, someone adds `Cache-Control: public, s-maxage=300` to the `/api/me/dashboard` response. What happens?",
          options: [
            "The CDN may serve one user's dashboard to other users for five minutes",
            "Nothing: CDNs never cache responses to authenticated requests",
            "Only each user's browser caches it, for five minutes",
            "The CDN automatically keeps a separate copy for each cookie",
          ],
          correctIndex: 0,
          explanation:
            "HTTP caching rules let shared caches store a response to a request with `Authorization` when the response says `public` or `s-maxage`, and nothing about who is asking is in the cache key: cookies don't vary it unless you configure that. Personalized responses need `private` or `no-store`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fscap-scaling-q11",
          prompt:
            "A hot cache key for the homepage feed expires, and 3,000 concurrent requests miss and query the database at once. Which techniques prevent this? (Select all that apply.)",
          options: [
            "Request coalescing: one request recomputes while the others wait",
            "Serving the stale value while one request refreshes it",
            "Adding random jitter to TTLs so keys don't expire together",
            "Giving every key exactly the same TTL so they refresh together",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A stampede happens when many requests recompute the same value at once. Coalescing and stale-while-revalidate cap it at one recompute, and jitter spreads expirations out; identical TTLs synchronize them.",
        },
        {
          id: "fscap-scaling-q12",
          prompt:
            "A chat feature uses WebSockets. With one instance every message reaches everyone; with four instances behind a load balancer, users only see messages from people connected to the same instance. What's missing?",
          options: [
            "A pub/sub backplane, such as Redis pub/sub, to fan messages out across instances",
            "Sticky sessions, so each user always reaches the same instance",
            "A longer WebSocket idle timeout on the load balancer",
            "HTTP/2 between the load balancer and the instances",
          ],
          correctIndex: 0,
          explanation:
            "Each connection lives on one instance, so broadcasts must be fanned out between instances. Stickiness keeps a user on one instance but doesn't share messages across them.",
        },
      ],
    },
    {
      id: "fscap-capstone",
      moduleId: "fs-capstone",
      trackId: "fullstack",
      title: "Capstone: Ship a Deployed, Authenticated, Full-Stack App",
      summary:
        "This capstone ties the track together: one app where a signed-in user manages their own data through a validated API and a real UI, deployed by a pipeline you trust. The walkthroughs show that shape in four stacks. Theo's 2024 Modern React tutorial builds an image gallery with Server Components, Drizzle, Clerk, Sentry, PostHog and Upstash rate limits; his 2023 T3 tutorial does it with tRPC and Prisma; JavaScript Mastery's 2026 PERN course adds Better Auth, APM and real-user monitoring; freeCodeCamp's 2025 MERN course builds a notes app with no auth at all, which is exactly the part you add. Each is a snapshot: the gallery evolves its schema with `drizzle-kit push` instead of migrations, and the T3 build relies on PlanetScale's retired free tier.\n\nThe hard part is the seams, not the wiring. Enforce authorization on every object access (broken object level authorization is OWASP's top API risk): take the user from the verified token or session, never from the request body, and answer 404 for other people's records. Verify tokens fully (signature, algorithm, issuer, audience, expiry) instead of just decoding them. Validate every input, report all field errors at once, and reject unknown fields so nobody can mass-assign `ownerId`. Make retries safe with idempotency keys on creates and concurrent edits safe with version numbers (409 on a stale write). Paginate with keyset cursors, and make status codes mean something (401 versus 403, 400 versus 422).\n\n\"Done\" means: sign-in through a hosted provider or Better Auth; a database whose migrations CI applies; an API that checks ownership in every handler; a UI with loading, empty, error and optimistic states; environment variables validated at startup; preview deploys per pull request; error tracking with source maps and an SLO dashboard; and tests, including an end-to-end run of sign-in, create, edit and delete. The challenge below is the API core, written as pure functions.",
      level: "expert",
      estMinutes: 600,
      isMilestone: true,
      webRefs: [
        {
          label: "OWASP API Security Top 10 (2023): API1 Broken Object Level Authorization",
          url: "https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/",
          kind: "spec",
        },
        { label: "RFC 8725: JSON Web Token Best Current Practices", url: "https://www.rfc-editor.org/rfc/rfc8725.html", kind: "spec" },
        { label: "Stripe API: Idempotent requests", url: "https://docs.stripe.com/api/idempotent_requests", kind: "docs" },
        { label: "RFC 9457: Problem Details for HTTP APIs", url: "https://www.rfc-editor.org/rfc/rfc9457.html", kind: "spec" },
      ],
      video: {
        title: "From 0 to Production - The Modern React Tutorial (RSCs, Next.js, Shadui, Drizzle, TS and more)",
        channel: "Theo - t3․gg",
        url: "https://www.youtube.com/watch?v=d5x0JCZbAJs",
        videoId: "d5x0JCZbAJs",
        durationLabel: "3:03:11",
      },
      alternateVideos: [
        {
          title: "T3 Stack Tutorial - FROM 0 TO PROD FOR $0 (Next.js, tRPC, TypeScript, Tailwind, Prisma & More)",
          channel: "Theo - t3․gg",
          url: "https://www.youtube.com/watch?v=YkOSUVzOAA4",
          videoId: "YkOSUVzOAA4",
          durationLabel: "2:59:02",
        },
        {
          title: "Full Stack Engineering Course | Build and Deploy a Full Stack PERN Admin Dashboard in 2026",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=ek7hmv5PVV8",
          videoId: "ek7hmv5PVV8",
          durationLabel: "7:53:22",
        },
        {
          title: "MERN Stack Tutorial for Beginners with Deployment – 2025",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=F9gB5b4jgOI",
          videoId: "F9gB5b4jgOI",
          durationLabel: "3:34:54",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `handleRequest(state, request, config)`: the whole request path of an authenticated notes API, as a pure function over an in-memory database. It returns `{ state, response }`, where `response` is `{ status, body }`. The driver deep-freezes the state and the request, so never mutate them; return a new state when something changes (you may change the shape `createState()` returns).\n\n`request` is `{ method, path, headers, body }`. Header names are lowercase, and `path` may include a query string. `config` is `{ issuer, audience, secret, leewaySeconds, now }`, with `now` in Unix seconds; timestamps in responses are `new Date(now * 1000).toISOString()`.\n\nChecks run in this order, and the first failure is the response:\n\n1. **Routing.** Only `/notes` (`GET`, `POST`) and `/notes/<segment>` (`GET`, `PATCH`, `DELETE`) exist, where the segment is non-empty and contains no `/`. Anything else is `404 { error: \"not_found\" }`. A known path with another method is `405 { error: \"method_not_allowed\", allow }`, listing that path's methods in the order shown. Routing happens before authentication.\n2. **Authentication.** The `authorization` header must be `Bearer <token>` (the scheme is case-insensitive), otherwise `401 { error: \"unauthorized\" }`. Every failure after that is `401 { error: \"invalid_token\" }`: the token needs three dot-separated parts; the first two must decode (with the `base64UrlDecode` helper, which throws on bad input) to JSON objects; the header's `alg` must be exactly `\"HS256\"`; the third part must equal `sign(part1 + \".\" + part2, config.secret)`; `iss` must equal `config.issuer`; `aud` must equal `config.audience` or be an array containing it; `sub` must be a non-empty string; `exp` must be a number with `now < exp + leewaySeconds`; and if `nbf` is present, `now + leewaySeconds >= nbf`.\n3. **Scope.** The `scope` claim is a space-separated list. `GET` needs `notes:read`, while `POST`, `PATCH` and `DELETE` need `notes:write`, otherwise `403 { error: \"insufficient_scope\" }`.\n4. **Ownership** (`/notes/<id>` only). The id must match `^[1-9][0-9]*$` and name a note owned by the token's `sub`, otherwise `404 { error: \"not_found\" }`. Another user's note must be indistinguishable from a missing one.\n5. **Body shape** (`POST`, `PATCH`). The body must be a plain object (not `null`, not an array), otherwise `400 { error: \"invalid_body\" }`.\n6. **Idempotency** (`POST` only), described below.\n7. **Validation.** Report every problem at once as `422 { error: \"validation_failed\", fieldErrors, formErrors }`.\n8. **Concurrency** (`PATCH` only), described below.\n\nEndpoints:\n\n- `GET /notes` returns `200 { items, nextCursor }`: the user's notes, newest (highest id) first. The `limit` query parameter defaults to 20 and must be an integer from 1 to 100 (`\"Must be an integer from 1 to 100\"`). `cursor` must look like `c_<id>` (`\"Invalid cursor\"`), and only notes with a lower id are returned, so a cursor still works after its note is deleted. `nextCursor` is `c_<last id on the page>` when more notes follow, otherwise `null`. Other query parameters are ignored.\n- `POST /notes` creates a note with `version` 1 and returns `201 { note }`. Ids come from a counter that starts at 1 and never reuses a value.\n- `GET /notes/<id>` returns `200 { note }`.\n- `PATCH /notes/<id>` applies the given fields, increments `version`, sets `updatedAt` and returns `200 { note }`.\n- `DELETE /notes/<id>` removes the note and returns `204` with a `null` body.\n\nA `note` in a response is `{ id, title, body, tags, version, createdAt, updatedAt }`, never the owner.\n\nField rules. Each entry in `fieldErrors` is a one-message array, and `formErrors` is `[]` unless the last rule applies:\n\n- `title`: required on create (`\"Required\"`); a string (`\"Must be a string\"`) that isn't empty after trimming (`\"Must not be empty\"`) and is at most 100 characters after trimming (`\"Must be at most 100 characters\"`). Stored trimmed.\n- `body`: optional string (`\"Must be a string\"`), default `\"\"`, at most 10000 characters (`\"Must be at most 10000 characters\"`), stored as is.\n- `tags`: optional, default `[]`: an array of at most 5 unique strings matching `^[a-z0-9-]{1,20}$`. Any violation is `\"Must be up to 5 unique lowercase tags\"`.\n- `version` (`PATCH` only): required (`\"Required\"`), a positive integer (`\"Must be a positive integer\"`).\n- Any other field is `\"Unknown field\"`, which is how mass assignment of `ownerId` is refused.\n- A `PATCH` with none of `title`, `body` and `tags` adds `\"Provide at least one of title, body, tags\"` to `formErrors`.\n\nIdempotency. An optional `idempotency-key` header on `POST` must match `^[A-Za-z0-9_-]{1,64}$`, otherwise `400 { error: \"invalid_idempotency_key\" }`. Keys are scoped to the user. If this user already has a stored result for the key and the body is deep-equal to the stored one (key order doesn't matter), return the stored response exactly, even if the note has changed since, and create nothing. The same key with a different body is `422 { error: \"idempotency_key_reused\" }`. Only successful creates are stored, so a request that failed validation can be retried with its key.\n\nConcurrency. If a `PATCH`'s `version` isn't the note's current version, return `409 { error: \"version_conflict\", currentVersion }` and change nothing.\n\nThe tests call `runNotesApi({ config, tokens, requests })`. It mints each named token (a JWT-shaped string, with `sign` standing in for HMAC-SHA256), runs the requests in order, adds `authorization: Bearer <token>` to requests that name a token in `as`, and returns every response. Some requests carry their own `now`. Leave the driver and helpers as they are.",
        starterCode: `/** The in-memory database. Treat it as immutable; you may change its shape. */
function createState() {
  return { notes: [], nextId: 1, idempotency: {} };
}

/**
 * @param {{ notes: object[], nextId: number, idempotency: object }} state
 * @param {{ method: string, path: string, headers: Record<string, string>, body?: unknown }} request
 * @param {{ issuer: string, audience: string, secret: string, leewaySeconds: number, now: number }} config
 * @returns {{ state: object, response: { status: number, body: unknown } }}
 */
function handleRequest(state, request, config) {
  // Your code here
  return { state, response: { status: 501, body: { error: "not_implemented" } } };
}

// ---- Test driver and helpers (leave as is; you may call base64UrlDecode and sign) ----
function runNotesApi(scenario) {
  const config = { ...scenario.config };
  const tokens = {};
  for (const [name, spec] of Object.entries(scenario.tokens || {})) tokens[name] = mintToken(spec, config);
  let state = deepFreeze(createState());
  const responses = [];
  for (const req of scenario.requests) {
    const headers = { ...(req.headers || {}) };
    if (req.as) headers.authorization = \`Bearer \${tokens[req.as]}\`;
    const request = deepFreeze({ method: req.method, path: req.path, headers, body: structuredClone(req.body) });
    const result = handleRequest(state, request, { ...config, now: req.now ?? config.now });
    state = deepFreeze(result.state);
    responses.push(JSON.parse(JSON.stringify(result.response)));
  }
  return responses;
}

// Builds a JWT-shaped token. \`sign\` stands in for HMAC-SHA256 so the tests stay synchronous.
function mintToken(spec, config) {
  if (spec.raw !== undefined) return spec.raw;
  const claims = {
    iss: config.issuer,
    aud: config.audience,
    exp: config.now + 3600,
    scope: "notes:read notes:write",
    ...spec.claims,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT", ...spec.header }));
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signature = spec.signature ?? sign(\`\${header}.\${payload}\`, config.secret);
  // A tampered token keeps the original signature but carries different claims.
  const sentPayload = spec.tamper ? base64UrlEncode(JSON.stringify({ ...claims, ...spec.tamper })) : payload;
  return \`\${header}.\${sentPayload}.\${signature}\`;
}

function sign(data, secret) {
  let h = 0x811c9dc5;
  const input = \`\${secret}:\${data}\`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function base64UrlEncode(text) {
  return btoa(text).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
}

/** Decodes base64url to a string; throws on anything that isn't base64url. */
function base64UrlDecode(input) {
  if (typeof input !== "string" || !/^[A-Za-z0-9_-]*$/.test(input)) throw new Error("invalid base64url");
  return atob(input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
`,
        functionName: "runNotesApi",
        testCases: [
          {
            description: "create, read and list your own notes",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "  Ship the capstone  ", body: "Auth, DB, API, UI", tags: ["work", "q3"] } },
                  { method: "GET", path: "/notes/1", as: "alice" },
                  { method: "GET", path: "/notes", as: "alice" },
                ],
              },
            ],
            expected: [
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Ship the capstone",
                    body: "Auth, DB, API, UI",
                    tags: ["work", "q3"],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 200,
                body: {
                  note: {
                    id: 1,
                    title: "Ship the capstone",
                    body: "Auth, DB, API, UI",
                    tags: ["work", "q3"],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 200,
                body: {
                  items: [
                    {
                      id: 1,
                      title: "Ship the capstone",
                      body: "Auth, DB, API, UI",
                      tags: ["work", "q3"],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                  ],
                  nextCursor: null,
                },
              },
            ],
          },
          {
            description: "PATCH with the current version updates the note, bumps the version and sets updatedAt",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Draft" } },
                  { method: "PATCH", path: "/notes/1", as: "alice", body: { version: 1, title: "Final", tags: ["done"] }, now: NOTES_NOW + 60 },
                  { method: "GET", path: "/notes/1", as: "alice" },
                ],
              },
            ],
            expected: [
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Draft",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 200,
                body: {
                  note: {
                    id: 1,
                    title: "Final",
                    body: "",
                    tags: ["done"],
                    version: 2,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:14:20.000Z",
                  },
                },
              },
              {
                status: 200,
                body: {
                  note: {
                    id: 1,
                    title: "Final",
                    body: "",
                    tags: ["done"],
                    version: 2,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:14:20.000Z",
                  },
                },
              },
            ],
          },
          {
            description: "optimistic concurrency: a second writer with a stale version gets 409 and nothing is overwritten",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Shared plan", body: "v1" } },
                  { method: "PATCH", path: "/notes/1", as: "alice", body: { version: 1, title: "Plan A" } },
                  { method: "PATCH", path: "/notes/1", as: "alice", body: { version: 1, body: "Plan B body" } },
                  { method: "GET", path: "/notes/1", as: "alice" },
                ],
              },
            ],
            expected: [
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Shared plan",
                    body: "v1",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 200,
                body: {
                  note: {
                    id: 1,
                    title: "Plan A",
                    body: "v1",
                    tags: [],
                    version: 2,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              { status: 409, body: { error: "version_conflict", currentVersion: 2 } },
              {
                status: 200,
                body: {
                  note: {
                    id: 1,
                    title: "Plan A",
                    body: "v1",
                    tags: [],
                    version: 2,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
            ],
          },
          {
            description: "DELETE returns 204 with no body, and the note is gone afterwards",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Temporary" } },
                  { method: "DELETE", path: "/notes/1", as: "alice" },
                  { method: "GET", path: "/notes/1", as: "alice" },
                  { method: "DELETE", path: "/notes/1", as: "alice" },
                ],
              },
            ],
            expected: [
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Temporary",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              { status: 204, body: null },
              { status: 404, body: { error: "not_found" } },
              { status: 404, body: { error: "not_found" } },
            ],
          },
          {
            description: "cursor pagination walks newest first, and the last page has no cursor",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Note 1" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Note 2" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Note 3" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Note 4" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Note 5" } },
                  { method: "GET", path: "/notes?limit=2", as: "alice" },
                  { method: "GET", path: "/notes?limit=2&cursor=c_4", as: "alice" },
                  { method: "GET", path: "/notes?limit=2&cursor=c_2", as: "alice" },
                ],
              },
            ],
            expected: [
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Note 1",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 2,
                    title: "Note 2",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 3,
                    title: "Note 3",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 4,
                    title: "Note 4",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 5,
                    title: "Note 5",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 200,
                body: {
                  items: [
                    {
                      id: 5,
                      title: "Note 5",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                    {
                      id: 4,
                      title: "Note 4",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                  ],
                  nextCursor: "c_4",
                },
              },
              {
                status: 200,
                body: {
                  items: [
                    {
                      id: 3,
                      title: "Note 3",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                    {
                      id: 2,
                      title: "Note 2",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                  ],
                  nextCursor: "c_2",
                },
              },
              {
                status: 200,
                body: {
                  items: [
                    {
                      id: 1,
                      title: "Note 1",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                  ],
                  nextCursor: null,
                },
              },
            ],
          },
          {
            description: "scopes: a read-only token can read but not write",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "GET", path: "/notes", as: "aliceReader" },
                  { method: "POST", path: "/notes", as: "aliceReader", body: { title: "Nope" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Yes" } },
                  { method: "GET", path: "/notes/1", as: "aliceReader" },
                  { method: "PATCH", path: "/notes/1", as: "aliceReader", body: { version: 1, title: "Nope" } },
                ],
              },
            ],
            expected: [
              { status: 200, body: { items: [], nextCursor: null } },
              { status: 403, body: { error: "insufficient_scope" } },
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Yes",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 200,
                body: {
                  note: {
                    id: 1,
                    title: "Yes",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              { status: 403, body: { error: "insufficient_scope" } },
            ],
          },
          {
            description: "a retried create with the same Idempotency-Key replays the stored response instead of creating a second note",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Pay invoice", tags: ["billing"] }, headers: { "idempotency-key": "create-7f3a" } },
                  { method: "POST", path: "/notes", as: "alice", body: { tags: ["billing"], title: "Pay invoice" }, headers: { "idempotency-key": "create-7f3a" } },
                  { method: "GET", path: "/notes", as: "alice" },
                  { method: "PATCH", path: "/notes/1", as: "alice", body: { version: 1, title: "Paid" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Pay invoice", tags: ["billing"] }, headers: { "idempotency-key": "create-7f3a" } },
                ],
              },
            ],
            expected: [
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Pay invoice",
                    body: "",
                    tags: ["billing"],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Pay invoice",
                    body: "",
                    tags: ["billing"],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 200,
                body: {
                  items: [
                    {
                      id: 1,
                      title: "Pay invoice",
                      body: "",
                      tags: ["billing"],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                  ],
                  nextCursor: null,
                },
              },
              {
                status: 200,
                body: {
                  note: {
                    id: 1,
                    title: "Paid",
                    body: "",
                    tags: ["billing"],
                    version: 2,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Pay invoice",
                    body: "",
                    tags: ["billing"],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
            ],
          },
          {
            description: "BOLA: another user's note is indistinguishable from a missing one",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Alice's secret plan" } },
                  { method: "GET", path: "/notes/1", as: "bob" },
                  { method: "PATCH", path: "/notes/1", as: "bob", body: { version: 1, title: "pwned" } },
                  { method: "DELETE", path: "/notes/1", as: "bob" },
                  { method: "GET", path: "/notes", as: "bob" },
                  { method: "GET", path: "/notes/1", as: "alice" },
                ],
              },
            ],
            expected: [
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Alice's secret plan",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              { status: 404, body: { error: "not_found" } },
              { status: 404, body: { error: "not_found" } },
              { status: 404, body: { error: "not_found" } },
              { status: 200, body: { items: [], nextCursor: null } },
              {
                status: 200,
                body: {
                  note: {
                    id: 1,
                    title: "Alice's secret plan",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
            ],
            isEdgeCase: true,
          },
          {
            description: "missing, malformed and non-Bearer credentials are 401",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "GET", path: "/notes" },
                  { method: "GET", path: "/notes", headers: { authorization: "Basic YWxpY2U6cHc=" } },
                  { method: "GET", path: "/notes", headers: { authorization: "Bearer" } },
                  { method: "GET", path: "/notes", headers: { authorization: "Bearer abc.def" } },
                  { method: "GET", path: "/notes", headers: { authorization: "Bearer not-a-jwt.at-all.!!" } },
                ],
              },
            ],
            expected: [
              { status: 401, body: { error: "unauthorized" } },
              { status: 401, body: { error: "unauthorized" } },
              { status: 401, body: { error: "unauthorized" } },
              { status: 401, body: { error: "invalid_token" } },
              { status: 401, body: { error: "invalid_token" } },
            ],
            isEdgeCase: true,
          },
          {
            description: "token checks: signature, algorithm, issuer, audience, subject, expiry and not-before, with 30 s of leeway",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: { ...NOTES_TOKENS, 
                  tampered: { claims: { sub: "alice" }, tamper: { sub: "bob" } },
                  algNone: { claims: { sub: "alice" }, header: { alg: "none" }, signature: "" },
                  wrongIssuer: { claims: { sub: "alice", iss: "https://evil.example.com" } },
                  wrongAudience: { claims: { sub: "alice", aud: "billing-api" } },
                  noSubject: { claims: { sub: "" } },
                  expired: { claims: { sub: "alice", exp: NOTES_NOW - 30 } },
                  notYetValid: { claims: { sub: "alice", nbf: NOTES_NOW + 31 } },
                  audienceList: { claims: { sub: "alice", aud: ["billing-api", "notes-api"] } },
                  justInLeeway: { claims: { sub: "alice", exp: NOTES_NOW - 29, nbf: NOTES_NOW + 30 } },
                 },
                requests: [
                  { method: "GET", path: "/notes", as: "tampered" },
                  { method: "GET", path: "/notes", as: "algNone" },
                  { method: "GET", path: "/notes", as: "wrongIssuer" },
                  { method: "GET", path: "/notes", as: "wrongAudience" },
                  { method: "GET", path: "/notes", as: "noSubject" },
                  { method: "GET", path: "/notes", as: "expired" },
                  { method: "GET", path: "/notes", as: "notYetValid" },
                  { method: "GET", path: "/notes", as: "audienceList" },
                  { method: "GET", path: "/notes", as: "justInLeeway" },
                  { method: "GET", path: "/notes", as: "alice", now: NOTES_NOW + 3630 },
                ],
              },
            ],
            expected: [
              { status: 401, body: { error: "invalid_token" } },
              { status: 401, body: { error: "invalid_token" } },
              { status: 401, body: { error: "invalid_token" } },
              { status: 401, body: { error: "invalid_token" } },
              { status: 401, body: { error: "invalid_token" } },
              { status: 401, body: { error: "invalid_token" } },
              { status: 401, body: { error: "invalid_token" } },
              { status: 200, body: { items: [], nextCursor: null } },
              { status: 200, body: { items: [], nextCursor: null } },
              { status: 401, body: { error: "invalid_token" } },
            ],
            isEdgeCase: true,
          },
          {
            description: "validation reports every field error at once, rejects unknown fields and non-object bodies",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "   ", body: 42, tags: ["Work", "work"], ownerId: "bob" } },
                  { method: "POST", path: "/notes", as: "alice", body: null },
                  { method: "POST", path: "/notes", as: "alice", body: ["Buy milk"] },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "x".repeat(101), tags: ["a", "b", "c", "d", "e", "f"] } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Valid" } },
                  { method: "PATCH", path: "/notes/1", as: "alice", body: { title: "No version" } },
                  { method: "PATCH", path: "/notes/1", as: "alice", body: { version: 1, id: 7 } },
                  { method: "PATCH", path: "/notes/1", as: "alice", body: { version: 0, title: 5 } },
                ],
              },
            ],
            expected: [
              {
                status: 422,
                body: {
                  error: "validation_failed",
                  fieldErrors: {
                    ownerId: ["Unknown field"],
                    title: ["Must not be empty"],
                    body: ["Must be a string"],
                    tags: ["Must be up to 5 unique lowercase tags"],
                  },
                  formErrors: [],
                },
              },
              { status: 400, body: { error: "invalid_body" } },
              { status: 400, body: { error: "invalid_body" } },
              {
                status: 422,
                body: {
                  error: "validation_failed",
                  fieldErrors: { title: ["Must be at most 100 characters"], tags: ["Must be up to 5 unique lowercase tags"] },
                  formErrors: [],
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Valid",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              { status: 422, body: { error: "validation_failed", fieldErrors: { version: ["Required"] }, formErrors: [] } },
              {
                status: 422,
                body: {
                  error: "validation_failed",
                  fieldErrors: { id: ["Unknown field"] },
                  formErrors: ["Provide at least one of title, body, tags"],
                },
              },
              {
                status: 422,
                body: {
                  error: "validation_failed",
                  fieldErrors: { version: ["Must be a positive integer"], title: ["Must be a string"] },
                  formErrors: [],
                },
              },
            ],
            isEdgeCase: true,
          },
          {
            description: "reusing an Idempotency-Key with a different body is 422, keys are per user, and failed attempts aren't stored",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "A" }, headers: { "idempotency-key": "k-1" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "B" }, headers: { "idempotency-key": "k-1" } },
                  { method: "POST", path: "/notes", as: "bob", body: { title: "A" }, headers: { "idempotency-key": "k-1" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "" }, headers: { "idempotency-key": "k-2" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Fixed" }, headers: { "idempotency-key": "k-2" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "C" }, headers: { "idempotency-key": "not a valid key!" } },
                  { method: "GET", path: "/notes", as: "alice" },
                ],
              },
            ],
            expected: [
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "A",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              { status: 422, body: { error: "idempotency_key_reused" } },
              {
                status: 201,
                body: {
                  note: {
                    id: 2,
                    title: "A",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 422,
                body: { error: "validation_failed", fieldErrors: { title: ["Must not be empty"] }, formErrors: [] },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 3,
                    title: "Fixed",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              { status: 400, body: { error: "invalid_idempotency_key" } },
              {
                status: 200,
                body: {
                  items: [
                    {
                      id: 3,
                      title: "Fixed",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                    {
                      id: 1,
                      title: "A",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                  ],
                  nextCursor: null,
                },
              },
            ],
            isEdgeCase: true,
          },
          {
            description: "routing: unknown paths are 404 and wrong methods are 405 with an allow list, before authentication",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "GET", path: "/users" },
                  { method: "PUT", path: "/notes/1" },
                  { method: "DELETE", path: "/notes" },
                  { method: "GET", path: "/notes/", as: "alice" },
                  { method: "GET", path: "/notes/1/comments", as: "alice" },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Only note" } },
                  { method: "GET", path: "/notes/abc", as: "alice" },
                  { method: "GET", path: "/notes/01", as: "alice" },
                ],
              },
            ],
            expected: [
              { status: 404, body: { error: "not_found" } },
              { status: 405, body: { error: "method_not_allowed", allow: ["GET", "PATCH", "DELETE"] } },
              { status: 405, body: { error: "method_not_allowed", allow: ["GET", "POST"] } },
              { status: 404, body: { error: "not_found" } },
              { status: 404, body: { error: "not_found" } },
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "Only note",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              { status: 404, body: { error: "not_found" } },
              { status: 404, body: { error: "not_found" } },
            ],
            isEdgeCase: true,
          },
          {
            description: "list query validation, and a keyset cursor that survives deletes between pages",
            args: [
              {
                config: NOTES_CONFIG,
                tokens: NOTES_TOKENS,
                requests: [
                  { method: "POST", path: "/notes", as: "alice", body: { title: "One" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Two" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Three" } },
                  { method: "POST", path: "/notes", as: "alice", body: { title: "Four" } },
                  { method: "GET", path: "/notes?limit=0", as: "alice" },
                  { method: "GET", path: "/notes?limit=abc&cursor=bogus", as: "alice" },
                  { method: "GET", path: "/notes?limit=101", as: "alice" },
                  { method: "GET", path: "/notes?limit=2", as: "alice" },
                  { method: "DELETE", path: "/notes/3", as: "alice" },
                  { method: "GET", path: "/notes?limit=2&cursor=c_3", as: "alice" },
                ],
              },
            ],
            expected: [
              {
                status: 201,
                body: {
                  note: {
                    id: 1,
                    title: "One",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 2,
                    title: "Two",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 3,
                    title: "Three",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 201,
                body: {
                  note: {
                    id: 4,
                    title: "Four",
                    body: "",
                    tags: [],
                    version: 1,
                    createdAt: "2026-09-21T14:13:20.000Z",
                    updatedAt: "2026-09-21T14:13:20.000Z",
                  },
                },
              },
              {
                status: 422,
                body: {
                  error: "validation_failed",
                  fieldErrors: { limit: ["Must be an integer from 1 to 100"] },
                  formErrors: [],
                },
              },
              {
                status: 422,
                body: {
                  error: "validation_failed",
                  fieldErrors: { limit: ["Must be an integer from 1 to 100"], cursor: ["Invalid cursor"] },
                  formErrors: [],
                },
              },
              {
                status: 422,
                body: {
                  error: "validation_failed",
                  fieldErrors: { limit: ["Must be an integer from 1 to 100"] },
                  formErrors: [],
                },
              },
              {
                status: 200,
                body: {
                  items: [
                    {
                      id: 4,
                      title: "Four",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                    {
                      id: 3,
                      title: "Three",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                  ],
                  nextCursor: "c_3",
                },
              },
              { status: 204, body: null },
              {
                status: 200,
                body: {
                  items: [
                    {
                      id: 2,
                      title: "Two",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                    {
                      id: 1,
                      title: "One",
                      body: "",
                      tags: [],
                      version: 1,
                      createdAt: "2026-09-21T14:13:20.000Z",
                      updatedAt: "2026-09-21T14:13:20.000Z",
                    },
                  ],
                  nextCursor: null,
                },
              },
            ],
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
