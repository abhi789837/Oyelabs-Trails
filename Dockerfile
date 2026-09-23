# Oyelearn v3 (brief §16).
#
# Multi-stage: the build stage has the toolchain and the dev dependencies, the runtime stage has
# neither. The result runs as a non-root user and keeps its state on a mounted volume.

# ---------------------------------------------------------------------------
# Stage 1 — build the SPA, the server bundle and the server content
# ---------------------------------------------------------------------------
FROM node:24-bookworm-slim AS build

# node-gyp needs these for better-sqlite3 and isolated-vm on architectures with no prebuilt binary.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first, so a source-only change does not reinstall them.
# --ignore-scripts skips the MediaPipe postinstall; it is run explicitly below, after the source
# is in place, so a failed download is a visible build failure rather than a silent one.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# The proctoring assets are ~46 MB of WASM and models, deliberately not in the repository.
RUN node scripts/fetch-mediapipe.mjs

# Generates the content manifest and the server content bundle, type-checks everything, builds the
# SPA into dist/ and the server into dist-server/.
RUN npm run build

# The content quality gate runs in the image build too: shipping content that fails it would mean
# shipping a broken curriculum.
RUN npm run content:check

# Prune to production dependencies for the runtime stage.
RUN npm prune --omit=dev

# ---------------------------------------------------------------------------
# Stage 2 — runtime
# ---------------------------------------------------------------------------
FROM node:24-bookworm-slim AS runtime

# Optional CLI adapters (brief §8.1). Off by default: they are only useful with a subscription
# credential, which is not the recommended configuration.
#   docker build --build-arg INSTALL_CLAUDE_CLI=1 --build-arg INSTALL_CODEX_CLI=1 .
ARG INSTALL_CLAUDE_CLI=0
ARG INSTALL_CODEX_CLI=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN if [ "$INSTALL_CLAUDE_CLI" = "1" ]; then npm install -g @anthropic-ai/claude-code; fi \
  && if [ "$INSTALL_CODEX_CLI" = "1" ]; then npm install -g @openai/codex; fi

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/server/content ./server/content
COPY --from=build /app/server/drizzle ./server/drizzle

# The mounted volume: SQLite, proctoring snapshots and nightly backups.
RUN mkdir -p /data && chown -R node:node /data /app
VOLUME /data

ENV DATA_DIR=/data \
    CLIENT_DIST=/app/dist \
    SERVER_CONTENT_DIR=/app/server/content \
    HOST=0.0.0.0 \
    PORT=8787

EXPOSE 8787
USER node

# Matches the compose healthcheck. /api/health touches the database, so a process that is up but
# cannot read its own data reports unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8787/api/health || exit 1

CMD ["node", "dist-server/index.js"]
