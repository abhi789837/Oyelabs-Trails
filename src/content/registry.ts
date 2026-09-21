// The curriculum's table of contents. Module content lives in src/content/<trackId>/<moduleId>.ts
// (default export `satisfies Module`); this file fixes the order of tracks and modules.
import type { AccentToken, TrackId } from "@/types/curriculum";

export interface ModuleEntry {
  id: string;
  name: string;
  /** Recommended prefix for topic ids in this module (ids must be unique across the whole curriculum). */
  idPrefix: string;
}

export interface TrackEntry {
  id: TrackId;
  name: string;
  tagline: string;
  accentToken: AccentToken;
  modules: ModuleEntry[];
}

export const registry: TrackEntry[] = [
  {
    id: "frontend",
    name: "Frontend",
    tagline: "From the browser's rendering model to production React, Next.js and Vue.",
    accentToken: "trailmark",
    modules: [
      { id: "fe-tooling", name: "Dev Environment & Tooling", idPrefix: "tooling-" },
      { id: "fe-html-css", name: "HTML & CSS Foundations", idPrefix: "html-/css-" },
      { id: "fe-js-core", name: "JavaScript Core", idPrefix: "js-" },
      { id: "fe-js-advanced", name: "JavaScript Advanced & Interview-Level", idPrefix: "js-" },
      { id: "fe-typescript", name: "TypeScript", idPrefix: "ts-" },
      { id: "fe-tailwind", name: "Tailwind CSS", idPrefix: "tw-" },
      { id: "fe-react-fundamentals", name: "React Fundamentals", idPrefix: "react-" },
      { id: "fe-react-hooks", name: "React Hooks & Advanced Patterns", idPrefix: "react-adv-" },
      { id: "fe-react-ecosystem", name: "React Ecosystem", idPrefix: "react-eco-" },
      { id: "fe-react-projects", name: "React Practice Projects", idPrefix: "react-capstone-" },
      { id: "fe-nextjs", name: "Next.js", idPrefix: "next-" },
      { id: "fe-vue", name: "Vue.js", idPrefix: "vue-" },
      { id: "fe-meta-mobile", name: "Meta-Frameworks, Mobile & Bonus", idPrefix: "bonus-" },
      { id: "fe-security-perf", name: "Frontend Security & Performance", idPrefix: "feperf-" },
    ],
  },
  {
    id: "backend",
    name: "Backend",
    tagline: "Runtimes, APIs, data, security and the systems thinking behind them.",
    accentToken: "summit",
    modules: [
      { id: "be-foundations", name: "Web & Backend Foundations", idPrefix: "web-" },
      { id: "be-node-core", name: "Node.js Core", idPrefix: "node-" },
      { id: "be-express", name: "Express.js", idPrefix: "express-" },
      { id: "be-sql", name: "SQL & Relational Databases", idPrefix: "sql-" },
      { id: "be-nosql", name: "NoSQL & Caching", idPrefix: "nosql-" },
      { id: "be-auth-security", name: "Authentication & Security", idPrefix: "auth-" },
      { id: "be-api-design", name: "API Design", idPrefix: "api-" },
      { id: "be-nestjs", name: "NestJS", idPrefix: "nest-" },
      { id: "be-python", name: "Python Backend", idPrefix: "py-" },
      { id: "be-docker", name: "Docker & Containers", idPrefix: "docker-" },
      { id: "be-system-design", name: "System Design Fundamentals", idPrefix: "sd-" },
      { id: "be-testing-ops", name: "Backend Testing & Ops", idPrefix: "ops-" },
    ],
  },
  {
    id: "fullstack",
    name: "Full-Stack",
    tagline: "Wire frontend to backend and ship real, authenticated apps end to end.",
    accentToken: "glacier",
    modules: [
      { id: "fs-mern", name: "MERN End-to-End", idPrefix: "mern-" },
      { id: "fs-nextjs", name: "Next.js Full-Stack", idPrefix: "fsnext-" },
      { id: "fs-t3", name: "The T3 Stack & End-to-End Type Safety", idPrefix: "t3-" },
      { id: "fs-graphql", name: "GraphQL Full-Stack", idPrefix: "fsgql-" },
      { id: "fs-capstone", name: "Full-Stack Capstone & Deployment", idPrefix: "fscap-" },
    ],
  },
  {
    id: "ai-driven",
    name: "AI-Driven Development",
    tagline: "Use AI coding tools deliberately, from prompts and context to RAG and agents.",
    accentToken: "ridge",
    modules: [
      { id: "ai-tools", name: "The AI Coding Tools Landscape", idPrefix: "aitools-" },
      { id: "ai-prompting", name: "Prompt Engineering", idPrefix: "prompt-" },
      { id: "ai-context", name: "Context Engineering & AI Pair Programming", idPrefix: "ctx-" },
      { id: "ai-llm", name: "LLM Fundamentals", idPrefix: "llm-" },
      { id: "ai-rag", name: "Retrieval-Augmented Generation", idPrefix: "rag-" },
      { id: "ai-agents", name: "AI Agents", idPrefix: "agents-" },
    ],
  },
];
