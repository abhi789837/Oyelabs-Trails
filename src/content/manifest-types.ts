/**
 * The manifest shapes now live in `shared/content.ts`, because the server builds the manifest and
 * the client consumes it. This file remains so `manifest.generated.ts` keeps its import, and is
 * re-exported here for anything still importing from `@/content/manifest-types`.
 *
 * `manifest.generated.ts` itself is no longer bundled into the SPA: it is build tooling only
 * (`npm run content:manifest`), and the running app gets its manifest from `/api/me/manifest`.
 */
export type { ModuleMeta, TopicMeta, TrackMeta } from "@shared/content";
