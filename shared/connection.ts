/**
 * v4.5 Phase 0: one vocabulary for "can we reach the AI and the web search right now?".
 *
 * Before this, every reason a new course couldn't be made was shown as "the web search isn't
 * connected": a missing YouTube key, a search service never picked, a rejected key and a network
 * error all read the same. These are the only states anything may show, and each has its own line.
 *
 * Pure: the server decides the state, every screen words it from here.
 */

/** Why something can't be used. `not_set_up` is the only one that is about our own settings. */
export const CONNECTION_PROBLEMS = ["not_set_up", "key_rejected", "quota", "unreachable", "temporary"] as const;
export type ConnectionProblem = (typeof CONNECTION_PROBLEMS)[number];
export type ConnectionState = "ready" | ConnectionProblem;
export type ConnectionService = "ai" | "search" | "youtube";

/**
 * Problems a job waits out instead of retrying: nothing changes until a person fixes the settings
 * (or a quota resets). They are woken by saving the settings, a passing Test, and the 10-minute
 * re-check. The other two are retried with backoff and fail after 5 tries.
 */
export const BLOCKING_PROBLEMS: readonly ConnectionProblem[] = ["not_set_up", "key_rejected", "quota"];

export function isBlockingProblem(state: ConnectionState): boolean {
  return (BLOCKING_PROBLEMS as readonly string[]).includes(state);
}

const SERVICE_NAME: Record<ConnectionService, string> = { ai: "the AI", search: "the web search", youtube: "the YouTube key" };

/**
 * The short clause used inside sentences: "We couldn't create the course because <line>." and
 * "1 new course blocked: <line>." Lower-case on purpose; it is never a sentence on its own.
 */
export function problemLine(service: ConnectionService, state: ConnectionProblem): string {
  if (service === "ai") {
    switch (state) {
      case "not_set_up":
        return "the AI isn't connected";
      case "key_rejected":
        return "the AI key was rejected";
      case "quota":
        return "the AI has used up its quota";
      case "unreachable":
        return "our server can't reach the AI";
      case "temporary":
        return "the AI had a temporary error";
    }
  }
  const what = SERVICE_NAME[service];
  switch (state) {
    case "not_set_up":
      return `${what} isn't set up`;
    case "key_rejected":
      return service === "youtube" ? "the YouTube key was rejected" : "the web search key was rejected";
    case "quota":
      return `${what} has used up its quota`;
    case "unreachable":
      return `our server can't reach ${what}`;
    case "temporary":
      return `${what} had a temporary error`;
  }
}

/** Lines written by older versions, still found in stored jobs. Both mean "not set up". */
const LEGACY_LINES: Record<string, ConnectionProblem> = {
  "the web search isn't connected": "not_set_up",
  "the setup isn't finished": "not_set_up",
};

/** The state a stored line stands for, or null for a line that isn't one of ours (a real failure). */
export function stateOfLine(line: string | null | undefined): ConnectionProblem | null {
  if (!line) return null;
  const trimmed = line.trim().replace(/\.$/, "");
  if (LEGACY_LINES[trimmed]) return LEGACY_LINES[trimmed];
  for (const service of ["search", "ai", "youtube"] as const) {
    for (const state of CONNECTION_PROBLEMS) if (problemLine(service, state) === trimmed) return state;
  }
  return null;
}

/** What happens next, after "We'll finish automatically …". */
export function afterFixWords(state: ConnectionProblem | null): string {
  switch (state) {
    case "key_rejected":
      return "after the key is fixed";
    case "quota":
      return "when the quota resets or is raised";
    case "unreachable":
    case "temporary":
      return "when it works again";
    default:
      return "after it's set up";
  }
}

/** A failed job's line on screen: "Failed: our server can't reach the web search". */
export function failedLine(reason: string | null | undefined): string {
  const text = (reason ?? "").trim().replace(/\.$/, "") || "something went wrong while making it";
  return `Failed: ${text}`;
}

/** The result of Admin → AI connection → Test (and of the 10-minute re-check). */
export interface ResearchCheck {
  state: ConnectionState;
  /** One plain line for the admin, ending with what happens next or what to do. */
  message: string;
  /** How many results the test search returned (only when it ran). */
  results: number | null;
  /** Whether lessons can get a video: a YouTube key is saved and worked (null when not tested). */
  videos: "ok" | "missing" | "rejected" | "error" | null;
  checkedAt: number;
}

export const RESEARCH_CHECK_META_KEY = "research.last_check";

/** "Connected ✓ — test search returned 5 results". */
export function connectedLine(results: number): string {
  return `Connected ✓ — test search returned ${results} result${results === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------------------
// v4.5.1: where new courses find their sources
// ---------------------------------------------------------------------------

/**
 * How the course builder researches a new course, in priority order:
 * 1. `provider`: the saved search service (Tavily, Brave or Serper);
 * 2. `ai_web_search`: the AI connection's own web search (Anthropic API, Claude Code CLI, OpenAI API);
 * 3. `ai_only`: the AI writes from its own knowledge and cites only the shared resources list, the
 *    curriculum's references and official docs it proposes, each opened by our server first.
 * `none` only when no AI credential works; that is the one case where new courses wait.
 */
export const RESEARCH_MODES = ["provider", "ai_web_search", "ai_only", "none"] as const;
export type ResearchMode = (typeof RESEARCH_MODES)[number];

/** The one thing to do when nothing works. */
export const CONNECT_AI_LINE = "Connect an AI credential under Admin → AI connection";

/** Whose web search it is, from the active credential's provider id. */
export function aiSearchName(providerId: string | null | undefined): string {
  switch (providerId) {
    case "anthropic-api":
    case "claude-cli":
      return "Claude";
    case "openai-api":
      return "OpenAI";
    default:
      return "the AI";
  }
}

/** The plain line on Admin → AI connection: what new courses search with right now. */
export function researchModeLine(mode: ResearchMode, names: { provider?: string | null; ai?: string | null } = {}): string {
  switch (mode) {
    case "provider":
      return `Web search for new courses: using ${names.provider ?? "your search service"}.`;
    case "ai_web_search":
      return `Web search for new courses: using ${aiSearchName(names.ai)}'s built-in web search (no extra setup needed).`;
    case "ai_only":
      return "Web search for new courses: this AI connection has no built-in web search, so new courses are written from the AI's own knowledge and cite only links our server has opened and checked (no extra setup needed).";
    case "none":
      return `New courses wait until an AI credential works. ${CONNECT_AI_LINE}.`;
  }
}
