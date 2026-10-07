import fs from "node:fs";
import path from "node:path";

import fastifyCookie from "@fastify/cookie";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";

import { BODY_LIMIT_JSON, BODY_LIMIT_SNAPSHOT, ERROR_CODES } from "../../shared/api";
import type { AiService } from "./ai/service";
import { registerAuthContext } from "./auth/guards";
import type { ContentStore } from "./content/store";
import type { Db } from "./db";
import type { Env } from "./env";
import { buildCsp, buildRunnerCsp, RUNNER_PAGE_PATH } from "./lib/csp";
import { HttpError } from "./lib/errors";
import { registerAdminAiRoutes } from "./routes/admin/ai";
import { registerAdminBuilderRoutes } from "./routes/admin/builder";
import { registerAdminCatalogRoutes } from "./routes/admin/catalog";
import { registerAdminSetupRoutes } from "./routes/admin/setup";
import { registerAdminBundleRoutes } from "./routes/admin/bundles";
import { registerAdminGoalRoutes } from "./routes/admin/goals";
import { registerGoalRoutes } from "./routes/goals";
import { registerAdminSkillGraphRoutes } from "./routes/admin/skillGraph";
import { registerAdminAssessmentV4Routes } from "./routes/admin/assessmentV4";
import { registerAdminBankRoutes } from "./routes/admin/bank";
import { registerAdminAiRoutingRoutes } from "./routes/admin/aiRouting";
import { registerAdminCourseRoutes } from "./routes/admin/courses";
import { registerAdminAssessmentRoutes } from "./routes/admin/assessments";
import { registerAdminLiveRoutes } from "./routes/admin/live";
import { registerAdminOverviewRoutes } from "./routes/admin/overview";
import { registerAdminPlanRoutes } from "./routes/admin/plans";
import { registerAdminUserRoutes } from "./routes/admin/users";
import { registerAdminWeekRoutes } from "./routes/admin/week";
import { registerAssessmentRoutes } from "./routes/assessment";
import { registerAssessmentV4Routes } from "./routes/assessmentV4";
import { registerAuthRoutes } from "./routes/auth";
import { registerContentRoutes } from "./routes/content";
import { registerSopRoutes } from "./routes/sop";
import { registerAdminRoleplayRoutes, registerRoleplayRoutes } from "./routes/roleplay";
import { registerAdminHandbookRoutes, registerHandbookRoutes } from "./routes/handbook";
import { registerHealthRoutes } from "./routes/health";
import { registerSpeechRoutes } from "./routes/speech";
import { registerReviewRoutes } from "./routes/reviews";
import { registerMeRoutes } from "./routes/me";
import { registerUiRoutes } from "./routes/ui";
import { registerTopicRoutes } from "./routes/topics";
import { registerAdminVideoRoutes, registerVideoRoutes } from "./routes/videos";
import { registerAdminTopicTestRoutes } from "./routes/admin/topicTests";
import { registerAdminNextActionRoutes } from "./routes/admin/nextAction";
import { registerAdminBulkOnboardRoutes } from "./routes/admin/onboardBulk";
import { registerV5AdminRoutes } from "./v5/admin/routes";
import { registerV5AnnouncementRoutes } from "./v5/announcements/routes";
import { registerV5TodayRoutes } from "./v5/today/routes";
import { registerV5XpRoutes } from "./v5/xp/routes";
import { registerV5ReviewRoutes } from "./v5/review/routes";
import { registerV5MeRoutes } from "./v5/me/routes";
import { registerV5LessonRoutes } from "./v5/lesson/register";
import { registerV5MotivationRoutes } from "./v5/notify/routes";
import { registerV5CertificateRoutes } from "./v5/certificates/routes";
import { registerV5AssessmentRoutes } from "./v5/assessment/routes";
import { registerOyelabsRoutes } from "./oyelabs/routes";
import type { CodeSandbox } from "./sandbox";
import { PistonClient } from "./sandbox/polyglot";

export interface RouteRecord {
  method: string;
  url: string;
}

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
    db: Db;
    /** The curriculum, and the only place the server reads content from. */
    content: ContentStore;
    /** Runs learner-submitted JavaScript. See server/src/sandbox for what it guarantees. */
    sandbox: CodeSandbox;
    /** v4: the Piston client for every other language, or null when PISTON_URL is unset. */
    piston: PistonClient | null;
    /** The only way the server talks to an AI provider. */
    ai: AiService;
    /** True when a dev-only mock provider is standing in. Surfaced in the admin UI. */
    usingMockProvider: boolean;
    /**
     * Every route this app registered. Security tests walk it to assert that no route under
     * /api/admin is reachable by a learner, so adding an admin route is covered automatically
     * rather than only when someone remembers to extend a hand-written list.
     */
    routeTable: RouteRecord[];
  }
}

export interface BuildAppOptions {
  env: Env;
  db: Db;
  content: ContentStore;
  sandbox: CodeSandbox;
  ai: AiService;
  usingMockProvider?: boolean;
  /** Off in tests so the output stays readable. */
  logger?: boolean;
}

export async function buildApp({
  env,
  db,
  content,
  sandbox,
  ai,
  usingMockProvider = false,
  logger = !env.isTest,
}: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger
      ? {
          level: env.isProduction ? "info" : "debug",
          // Never let a secret or a session cookie reach the log.
          redact: {
            paths: [
              "req.headers.cookie",
              "req.headers.authorization",
              'res.headers["set-cookie"]',
              "req.body.password",
              "req.body.newPassword",
              "req.body.currentPassword",
              "req.body.secret",
            ],
            censor: "[redacted]",
          },
          transport: env.isProduction
            ? undefined
            : { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
        }
      : false,
    bodyLimit: BODY_LIMIT_JSON,
    // Caddy terminates TLS in production, so the client IP comes from X-Forwarded-For.
    trustProxy: env.isProduction,
  });

  app.decorate("env", env);
  app.decorate("db", db);
  app.decorate("content", content);
  app.decorate("sandbox", sandbox);
  app.decorate("piston", env.pistonUrl ? new PistonClient({ url: env.pistonUrl, runTimeoutMs: env.pistonRunTimeoutMs }) : null);
  app.decorate("ai", ai);
  app.decorate("usingMockProvider", usingMockProvider);

  const routeTable: RouteRecord[] = [];
  app.decorate("routeTable", routeTable);
  app.addHook("onRoute", (route) => {
    const methods = Array.isArray(route.method) ? route.method : [route.method];
    for (const method of methods) {
      if (method === "HEAD" || method === "OPTIONS") continue;
      routeTable.push({ method, url: route.url });
    }
  });

  const indexHtml = path.join(env.clientDist, "index.html");
  const hasBuild = fs.existsSync(indexHtml);

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: { directives: buildCsp({ indexHtmlPath: hasBuild ? indexHtml : undefined }) },
    // Needed so the YouTube embed iframe and the MediaPipe WASM can load cross-origin.
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
  });

  // The isolated code runner gets its own, narrower policy (lib/csp.ts `buildRunnerCsp`): the one
  // page where eval is allowed, with no network and an opaque origin. Replaces helmet's header.
  const runnerCsp = buildRunnerCsp({ runnerHtmlPath: hasBuild ? path.join(env.clientDist, "runner.html") : undefined });
  app.addHook("onSend", async (request, reply, payload) => {
    const pathname = request.url.split("?")[0];
    if (pathname === RUNNER_PAGE_PATH) {
      reply.header("content-security-policy", runnerCsp);
      reply.header("cache-control", "no-cache");
    }
    // v5 P8 PWA: the service worker and the manifest must always be revalidated, so a deploy's new
    // worker is found on the next visit. The worker lives at the root, so its scope is the whole app.
    if (pathname === "/sw.js") {
      reply.header("cache-control", "no-cache");
      reply.header("service-worker-allowed", "/");
    } else if (pathname === "/site.webmanifest") {
      reply.header("cache-control", "no-cache");
    }
    return payload;
  });

  await app.register(fastifyCookie, { secret: env.sessionSecret });

  // The defaults are sized for one proctoring JPEG. The v4.4 recording upload raises them for
  // its own request only (`request.parts({ limits })` in routes/speech.ts).
  await app.register(fastifyMultipart, {
    limits: { fileSize: BODY_LIMIT_SNAPSHOT, files: 1, fields: 4, fieldSize: 16 * 1024 },
  });

  // Opt-in per route: `config: { rateLimit: { ... } }`. A global limit would throttle the
  // assessment heartbeat and the admin live feed.
  await app.register(fastifyRateLimit, { global: false });

  registerAuthContext(app);

  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof HttpError) {
      if (error.statusCode >= 500) request.log.error({ err: error }, "request failed");
      return reply.status(error.statusCode).send(error.toBody());
    }
    // Fastify's own validation/parse/rate-limit errors carry a statusCode; anything else is a bug.
    const raw = error as { statusCode?: unknown; message?: unknown };
    const status =
      typeof raw.statusCode === "number" && raw.statusCode >= 400 && raw.statusCode < 500 ? raw.statusCode : 500;
    if (status >= 500) {
      request.log.error({ err: error }, "unhandled error");
      return reply.status(500).send({ error: { code: ERROR_CODES.INTERNAL, message: "Something went wrong." } });
    }
    const code = status === 429 ? ERROR_CODES.RATE_LIMITED : ERROR_CODES.BAD_REQUEST;
    const message = typeof raw.message === "string" ? raw.message : "That request was not valid.";
    return reply.status(status).send({ error: { code, message } });
  });

  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerMeRoutes(app);
  await registerUiRoutes(app);
  await registerContentRoutes(app);
  await registerSopRoutes(app);
  await registerRoleplayRoutes(app);
  await registerHandbookRoutes(app);
  await registerTopicRoutes(app);
  await registerVideoRoutes(app);
  await registerAssessmentRoutes(app);
  await registerAssessmentV4Routes(app);
  await registerGoalRoutes(app);
  await registerSpeechRoutes(app);
  await registerReviewRoutes(app);
  // v5 Today (P2): /api/v5/today, /api/v5/me/xp, announcements (learner + /api/admin/announcements).
  await registerV5TodayRoutes(app);
  await registerV5XpRoutes(app);
  await registerV5AnnouncementRoutes(app);
  // v5 Plan/Library/Review/Me (P4): /api/v5/review/*, /api/v5/me/{settings,notes,profile,library}.
  await registerV5ReviewRoutes(app);
  await registerV5MeRoutes(app);
  // v5 Lesson (P3): /api/v5/lessons/*, notes, tutor, problems (+ /api/admin/v5/{problems,tutor-quality}).
  await registerV5LessonRoutes(app);
  // v5 Motivation (P6): /api/v5/motivation, /api/v5/leaderboard, /api/admin/motivation/*.
  await registerV5MotivationRoutes(app);
  // v5 Assessment results + certificates (P5): /api/v5/assessment/results, /api/v5/certificates/*, /api/admin/v5/{certificates,assessment}.
  await registerV5AssessmentRoutes(app);
  await registerV5CertificateRoutes(app);
  // Registered as plugins so their superadmin preHandler is encapsulated to those routes only.
  await app.register(registerAdminUserRoutes);
  await app.register(registerAdminPlanRoutes);
  await app.register(registerAdminWeekRoutes);
  await app.register(registerAdminAiRoutes);
  await app.register(registerAdminCourseRoutes);
  await app.register(registerAdminBuilderRoutes);
  await app.register(registerAdminAssessmentRoutes);
  await app.register(registerAdminLiveRoutes);
  await app.register(registerAdminOverviewRoutes);
  await app.register(registerAdminCatalogRoutes);
  await app.register(registerAdminSetupRoutes);
  await app.register(registerAdminGoalRoutes);
  await app.register(registerAdminBundleRoutes);
  await app.register(registerAdminSkillGraphRoutes);
  await app.register(registerAdminAssessmentV4Routes);
  await app.register(registerAdminBankRoutes);
  await app.register(registerAdminAiRoutingRoutes);
  await app.register(registerAdminRoleplayRoutes);
  await app.register(registerAdminHandbookRoutes);
  await app.register(registerAdminVideoRoutes);
  await app.register(registerAdminTopicTestRoutes);
  await app.register(registerAdminNextActionRoutes);
  await app.register(registerAdminBulkOnboardRoutes);
  // v5 Admin (P7): /api/admin/v5/{inbox,people,overview,reports,library,courses/:id/versions}.
  await app.register(registerV5AdminRoutes);
  // v4.5 Oyelabs courses: editor, media, module tests, assignments (server/src/oyelabs/routes.ts).
  await registerOyelabsRoutes(app);

  await registerSpa(app, env, indexHtml, hasBuild);

  return app;
}

/**
 * Production serves the built SPA from the same origin as the API, so there is no CORS and the
 * session cookie is first-party. In development Vite serves the SPA and proxies /api here, so
 * only the JSON 404 handler is installed.
 */
async function registerSpa(app: FastifyInstance, env: Env, indexHtml: string, hasBuild: boolean): Promise<void> {
  if (hasBuild) {
    // preCompressed (Phase 9 performance): the build writes .br/.gz next to each text asset
    // (vite.config.ts `precompressAssets`), sent when the browser accepts them, so the app is fast
    // without a compressing proxy too. Only static files; API responses and the SSE feed are untouched.
    await app.register(fastifyStatic, { root: env.clientDist, prefix: "/", index: false, wildcard: false, preCompressed: true });
  } else if (!env.isTest) {
    app.log.warn({ dir: env.clientDist }, "no SPA build found; serving the API only");
  }

  // Always installed, so an unknown /api/* route returns our error envelope rather than
  // Fastify's default body. With a build present, any other GET renders index.html, so a deep
  // link like /track/frontend/module/fe-js-core survives a hard refresh.
  app.setNotFoundHandler((request, reply) => {
    if (!hasBuild || request.method !== "GET" || request.url.startsWith("/api/")) {
      return reply.status(404).send({ error: { code: ERROR_CODES.NOT_FOUND, message: "Not found." } });
    }
    return reply.type("text/html").send(fs.createReadStream(indexHtml));
  });
}
