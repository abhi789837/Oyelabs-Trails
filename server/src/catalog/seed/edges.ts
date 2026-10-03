import type { SkillEdge } from "../../../../shared/skillGraph";

/**
 * v4.3 seed progressions for the skill graph, on top of the catalog's own `prerequisites` arrays
 * (which `ensureSkillEdgesSeed` turns into `prerequisite` edges first).
 *
 * Sources (docs/v4.3/RESEARCH.md §2):
 * - Engineering follows roadmap.sh: frontend (HTTP → HTML/CSS → JS → VCS → package managers →
 *   framework → testing), backend (HTTP → a runtime → VCS → relational DB → REST APIs → auth →
 *   caching → testing → CI/CD and deployment) and Git/GitHub (basics → branching → remotes → PRs →
 *   advanced and Actions).
 * - PM follows PMI (CAPM → PMP), the Scrum Guide and APM competences, read through the Oyelabs
 *   agency process: the generic SDLC comes before the company's own lifecycles, and the project
 *   vocabulary comes before handling change requests.
 * - BD follows the O*NET sales task order: prospecting → qualification → proposal → negotiation →
 *   account management.
 *
 * `prerequisite` is used only where the later skill genuinely cannot be done without the earlier
 * one; everything that merely goes better with it is `recommended`, which orders suggestions but
 * never blocks a path. Every id must exist in the catalog seed; the seed test checks that, and
 * that the whole graph stays acyclic.
 */

type Pair = readonly [from: string, to: string];

const prerequisite = (pairs: readonly Pair[]): SkillEdge[] => pairs.map(([from, to]) => ({ from, to, type: "prerequisite" }));
const recommended = (pairs: readonly Pair[]): SkillEdge[] => pairs.map(([from, to]) => ({ from, to, type: "recommended" }));

const ENGINEERING: SkillEdge[] = [
  // Backend: HTTP and REST → a runtime → Express → databases → auth → deployment.
  ...prerequisite([
    ["eng-js-async", "eng-node-runtime"], // Node's whole API is callbacks, promises and streams.
    ["eng-http", "eng-express"],
    ["eng-php-composer", "eng-laravel-fundamentals"],
    ["eng-secrets-config", "eng-fullstack-delivery"],
  ]),
  ...recommended([
    ["eng-rest-api-design", "eng-express"],
    ["eng-js-modules", "eng-node-runtime"],
    ["eng-express", "eng-mongoose"],
    ["eng-express", "eng-prisma"],
    ["eng-express", "eng-auth-sessions-jwt"],
    ["eng-sql", "eng-auth-sessions-jwt"],
    ["eng-express-middleware", "eng-nestjs"],
    ["eng-express", "eng-paas-deploy"],
    ["eng-docker", "eng-ci-cd"],
    ["eng-dockerfiles", "eng-ci-cd"],
    ["eng-dockerfiles", "eng-kubernetes"],
    ["eng-linux-shell", "eng-docker"],
    ["eng-unit-testing", "eng-ci-cd"],
    ["eng-sql-joins", "eng-data-modelling"],
    ["eng-sql-indexing", "eng-n-plus-one"],
    ["eng-php-web", "eng-laravel-fundamentals"],
  ]),
  // Frontend: HTML/CSS → JS → package managers → a framework.
  ...recommended([
    ["eng-js-dom-events", "eng-react-fundamentals"],
    ["eng-css", "eng-react-fundamentals"],
    ["eng-js-modules", "eng-build-tools"],
    ["eng-build-tools", "eng-paas-deploy"],
    ["eng-js-dom-events", "eng-vue-fundamentals"],
    ["eng-mobile-foundations", "eng-react-native"],
    ["eng-browser-devtools", "eng-debugging"],
  ]),
  // Git: basics → branching and PRs → advanced workflows and CI.
  ...recommended([
    ["eng-github-flow", "eng-git-advanced"],
  ]),
  // AI-driven development: prompting basics → Claude Code → context files and reusable skills →
  // multi-agent workflows.
  ...recommended([
    ["eng-llm-fundamentals", "eng-ai-prompting-for-code"],
    ["eng-ai-claude-code", "eng-ai-context-files"],
    ["eng-ai-claude-code", "eng-ai-reusable-skills"],
    ["eng-ai-reusable-skills", "eng-ai-agents"],
    ["eng-code-review", "eng-ai-reviewing-diffs"],
  ]),
];

const PM: SkillEdge[] = [
  ...prerequisite([
    ["pm-agency-sdlc", "pm-proc-custom"], // the generic agency SDLC before the company's own lifecycle
    ["pm-agency-sdlc", "pm-proc-whitelabel"],
    ["pm-proc-terms", "pm-change-requests"], // the vocabulary before handling a CR
    ["pm-requirements-gathering", "pm-sow"], // discovery before the statement of work
  ]),
  ...recommended([
    ["pm-sdlc", "pm-agency-sdlc"],
    ["pm-tech-terms", "pm-proc-terms"],
    ["pm-project-lifecycle", "pm-proc-custom"],
    ["pm-proc-custom", "pm-proc-templates"],
    ["pm-meeting-facilitation", "pm-proc-meetings"],
    ["pm-client-communication", "pm-proc-meetings"],
    ["pm-client-communication", "pm-client-management"],
    ["pm-email-etiquette", "pm-status-reporting"],
    ["pm-github-for-pms", "pm-git-flow"],
    ["pm-requirements-gathering", "pm-kickoff"],
    ["pm-change-requests", "pm-commercial-fixed-bid"],
    ["pm-uat", "pm-release-management"],
    ["pm-ai-for-pms", "pm-ai-status-reports"],
    ["pm-ai-for-pms", "pm-ai-meeting-notes"],
    ["pm-ai-for-pms", "pm-ai-prds"],
  ]),
];

const BD: SkillEdge[] = [
  ...prerequisite([
    ["bd-lead-linkedin", "bd-linkedin-outreach"],
    ["bd-discovery-calls", "bd-proposals-sows"], // discovery before the proposal
    ["bd-tech-delivery-process", "bd-sales-handoff"],
  ]),
  ...recommended([
    ["bd-prospect-research", "bd-cold-email"],
    ["bd-prospect-research", "bd-linkedin-outreach"],
    ["bd-prospect-research", "bd-meeting-prep"],
    ["bd-value-proposition", "bd-cold-email"],
    ["bd-business-writing", "bd-cold-email"],
    ["bd-crm-hygiene", "bd-follow-up-cadences"],
    ["bd-agency-services", "bd-upwork-proposals"],
    ["bd-bant", "bd-proposals-sows"],
    ["bd-proc-terms", "bd-proposals-sows"],
    ["bd-tech-delivery-process", "bd-proposals-sows"],
    ["bd-tech-web-mobile-ai", "bd-tech-delivery-process"],
    ["bd-proc-whitelabel", "bd-white-label-offering"],
    ["bd-pricing-fixed", "bd-proposals-sows"],
    ["bd-proposals-sows", "bd-negotiation"],
    ["bd-closing", "bd-sales-handoff"],
    ["bd-closing", "bd-account-management"],
    ["bd-negotiation", "bd-msa"],
    ["bd-case-studies", "bd-rfp"],
  ]),
];

export const SEED_SKILL_EDGES: SkillEdge[] = [...ENGINEERING, ...PM, ...BD];
