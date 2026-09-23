import fs from "node:fs";
import path from "node:path";

import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";

import { BODY_LIMIT_JSON, ERROR_CODES } from "../../shared/api";
import type { Db } from "./db";
import type { Env } from "./env";
import { HttpError } from "./lib/errors";
import { registerHealthRoutes } from "./routes/health";

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
    db: Db;
  }
}

export interface BuildAppOptions {
  env: Env;
  db: Db;
  /** Off in tests so the output stays readable. */
  logger?: boolean;
}

export async function buildApp({ env, db, logger = !env.isTest }: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger
      ? {
          level: env.isProduction ? "info" : "debug",
          // Never let a secret or a session cookie reach the log.
          redact: {
            paths: [
              'req.headers.cookie',
              'req.headers.authorization',
              'res.headers["set-cookie"]',
              "req.body.password",
              "req.body.newPassword",
              "req.body.currentPassword",
              "req.body.secret",
            ],
            censor: "[redacted]",
          },
          transport: env.isProduction ? undefined : { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
        }
      : false,
    bodyLimit: BODY_LIMIT_JSON,
    // Caddy terminates TLS in production, so the client IP comes from X-Forwarded-For.
    trustProxy: env.isProduction,
  });

  app.decorate("env", env);
  app.decorate("db", db);

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

  await registerSpa(app, env);

  return app;
}

/**
 * Production serves the built SPA from the same origin as the API, so there is no CORS and the
 * session cookie is first-party. In development Vite serves the SPA and proxies /api here, so
 * only the JSON 404 handler is installed.
 */
async function registerSpa(app: FastifyInstance, env: Env): Promise<void> {
  const indexHtml = path.join(env.clientDist, "index.html");
  const hasBuild = fs.existsSync(indexHtml);

  if (hasBuild) {
    await app.register(fastifyStatic, { root: env.clientDist, prefix: "/", index: false, wildcard: false });
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
