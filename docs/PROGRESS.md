# v2 build progress

Resume here after an interruption: read CLAUDE.md, this file and `git log`, then continue with the
first unchecked item. `npm run content:check` lists which registry modules don't exist yet.

## Phase 2: content, module by module

Status: `[ ]` not started, `[~]` being written, `[x]` committed (`content: <module>`).

### Frontend (14 modules)
- [x] fe-tooling: Dev Environment & Tooling (6)
- [x] fe-html-css: HTML & CSS Foundations (13)
- [x] fe-js-core: JavaScript Core, Namaste JavaScript S1 (19)
- [x] fe-js-advanced: JavaScript Advanced & Interview-Level (21)
- [x] fe-typescript: TypeScript (16)
- [x] fe-tailwind: Tailwind CSS (7)
- [x] fe-react-fundamentals: React Fundamentals (9)
- [x] fe-react-hooks: React Hooks & Advanced Patterns (16)
- [~] fe-react-ecosystem: React Ecosystem (9)
- [x] fe-react-projects: React Practice Projects (3)
- [x] fe-nextjs: Next.js (11)
- [~] fe-vue: Vue.js (11)
- [~] fe-meta-mobile: Meta-Frameworks, Mobile & Bonus (3)
- [~] fe-security-perf: Frontend Security & Performance (5)

### Backend (12 modules)
- [x] be-foundations: Web & Backend Foundations (4)
- [x] be-node-core: Node.js Core (10)
- [x] be-express: Express.js (9)
- [x] be-sql: SQL & Relational Databases (10)
- [x] be-nosql: NoSQL & Caching (6)
- [x] be-auth-security: Authentication & Security (8)
- [x] be-api-design: API Design (8)
- [x] be-nestjs: NestJS (9)
- [x] be-python: Python Backend (8)
- [x] be-docker: Docker & Containers (8)
- [x] be-system-design: System Design Fundamentals (8)
- [x] be-testing-ops: Backend Testing & Ops (4)

### Full-Stack (5 modules)
- [~] fs-mern: MERN End-to-End (5)
- [~] fs-nextjs: Next.js Full-Stack (5)
- [~] fs-t3: The T3 Stack & End-to-End Type Safety (4)
- [~] fs-graphql: GraphQL Full-Stack (3)
- [~] fs-capstone: Full-Stack Capstone & Deployment (5)

### AI-Driven Development (6 modules)
- [x] ai-tools: The AI Coding Tools Landscape (5)
- [x] ai-prompting: Prompt Engineering (5)
- [x] ai-context: Context Engineering & AI Pair Programming (5)
- [x] ai-llm: LLM Fundamentals (5)
- [x] ai-rag: Retrieval-Augmented Generation (5)
- [x] ai-agents: AI Agents (5)

Total planned: 293 topics across 37 modules (the brief estimates ~240; its module lists add up to 293).

## Phases 3–12: app

- [x] 3. App shell & routing (four-level routes, sidebar with track + module progress)
- [x] 4. Progress store (`getModuleCompletionPct`)
- [~] 5. Dashboard
- [x] 6. Track roadmap (module camps)
- [x] 7. Module view (waypoint path)
- [~] 8. Topic detail (reference previews with fallback, embedded video, alternate videos)
- [~] 9. Challenge engine (multi-select, Markdown code blocks, edge-case tags)
- [~] 10. Certificate + module-complete toasts
- [ ] 11. Polish pass
- [ ] 12. Deploy prep

## Decisions log

- Full-Stack keeps the added `glacier` accent: the brief assigns `ridge` to both Full-Stack and
  AI-Driven while reserving `ridge` for AI-Driven only.
- Content lives in `src/content/<trackId>/<moduleId>.ts`; a generated manifest
  (`src/content/manifest.generated.ts`) holds light metadata and module content is lazy-loaded.
- Video research uses `scripts/research/yt.mjs`, which reads youtube.com itself (search results,
  watch page, oEmbed) rather than third-party aggregators; oEmbed success also proves embeddability.
- Reference previews: embeddability is precomputed from response headers
  (`npm run content:embeds` → `src/content/embeds.generated.ts`), because browsers fire `load` even for
  frames blocked by X-Frame-Options, so a runtime timeout alone can't detect blocking.
- The v1 app runs on `src/types/curriculum-v1.ts` until the v2 app phases replace it.
