import { eq } from "drizzle-orm";
import { describe, expect, test, vi } from "vitest";

import { isLegacyResearchNotice } from "../../../shared/builder";
import { researchModeLine } from "../../../shared/connection";
import type { ProviderId } from "../../../shared/enums";
import { AnthropicApiProvider } from "../ai/adapters/anthropicApi";
import { cliWebSearchArgs } from "../ai/adapters/claudeCli";
import { MockProvider } from "../ai/adapters/mock";
import { normaliseHits } from "../ai/adapters/webSearch";
import type { WebSearchRequest, WebSearchResult } from "../ai/types";
import { schema } from "../db";
import { adminSession, as, createTestApp } from "../test/harness";
import { knownSources, makeAiResearchClient, withAiFallback } from "./aiResearch";
import { ProviderError, type SearchClient } from "./providers";
import { descriptionOf } from "./research";

/**
 * v4.5.1: course research with only the AI credential. The end-to-end runs (a missing course made
 * in mode 2 and mode 3, blocked jobs woken) are in autoCourse.test.ts; these are the pieces.
 */

/** A mock provider with a built-in web search, as the Anthropic adapter would answer. */
class SearchingMock extends MockProvider {
  override readonly id: ProviderId;
  readonly searched: string[] = [];
  constructor(id: ProviderId = "anthropic-api") {
    super();
    this.id = id;
  }
  async webSearch(request: WebSearchRequest): Promise<WebSearchResult> {
    this.searched.push(request.query);
    return {
      hits: [{ url: "https://react.dev/learn", title: "Quick Start", snippet: "", publishedAt: null }],
      usage: { input: 0, output: 0 },
      searches: 2,
      latencyMs: 1,
      model: "mock-1",
    };
  }
}

describe("the providers' built-in web search", () => {
  test("Anthropic: results are read from web_search_tool_result blocks, never from the model's prose", async () => {
    const provider = new AnthropicApiProvider("sk-ant-test-key-123456");
    const create = vi.spyOn(provider.raw.messages, "create").mockResolvedValue({
      id: "msg_1",
      type: "message",
      role: "assistant",
      model: "claude-haiku-4-5-20251001",
      stop_reason: "end_turn",
      stop_sequence: null,
      content: [
        { type: "server_tool_use", id: "srvtoolu_1", name: "web_search", input: { query: "react useEffect" } },
        {
          type: "web_search_tool_result",
          tool_use_id: "srvtoolu_1",
          content: [
            { type: "web_search_result", url: "https://react.dev/reference/react/useEffect", title: "useEffect – React", page_age: "April 30, 2025", encrypted_content: "x" },
            { type: "web_search_result", url: "https://react.dev/reference/react/useEffect", title: "duplicate", page_age: null, encrypted_content: "x" },
            { type: "web_search_result", url: "javascript:alert(1)", title: "not a page", page_age: null, encrypted_content: "x" },
          ],
        },
        { type: "text", text: "Also see https://invented.example/useEffect-guide", citations: null },
      ],
      usage: { input_tokens: 900, output_tokens: 40, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, server_tool_use: { web_search_requests: 1, web_fetch_requests: 0 } },
    } as never);

    const result = await provider.webSearch({ query: "react useEffect", limit: 5, model: "claude-haiku-4-5-20251001" });
    const sent = create.mock.calls[0]![0] as unknown as { tools: { type: string; max_uses: number }[] };
    expect(sent.tools).toEqual([{ type: "web_search_20250305", name: "web_search", max_uses: 1 }]);
    expect(result.hits).toEqual([{ url: "https://react.dev/reference/react/useEffect", title: "useEffect – React", snippet: "", publishedAt: new Date("April 30, 2025").toISOString() }]);
    expect(result.searches).toBe(1);
    expect(result.usage).toMatchObject({ input: 900, output: 40 });
  });

  test("Anthropic: a search error inside the result is a provider error", async () => {
    const provider = new AnthropicApiProvider("sk-ant-test-key-123456");
    vi.spyOn(provider.raw.messages, "create").mockResolvedValue({
      content: [{ type: "web_search_tool_result", tool_use_id: "s", content: { type: "web_search_tool_result_error", error_code: "unavailable" } }],
      usage: { input_tokens: 1, output_tokens: 1 },
    } as never);
    await expect(provider.webSearch({ query: "x", limit: 3 })).rejects.toThrow("web search failed: unavailable");
  });

  test("Claude Code CLI: WebSearch is the only tool, pre-approved, with no MCP servers", () => {
    const args = cliWebSearchArgs("claude-sonnet-5-5");
    expect(args).toEqual(["-p", "--output-format", "json", "--model", "claude-sonnet-5-5", "--strict-mcp-config", "--tools", "WebSearch", "--allowedTools", "WebSearch"]);
    expect(args).not.toContain("WebFetch");
    expect(args.join(" ")).not.toMatch(/Bash|Edit|Write|dangerously/);
  });

  test("hits are http(s) only, de-duplicated and capped", () => {
    const hits = normaliseHits(
      [{ url: "https://a.dev/x" }, { url: "https://a.dev/x" }, { url: "ftp://a.dev/y" }, { url: "not a url" }, { url: "https://b.dev/" }, { url: "https://c.dev/" }],
      2,
    );
    expect(hits.map((hit) => hit.url)).toEqual(["https://a.dev/x", "https://b.dev/"]);
  });
});

describe("AiService.webSearch", () => {
  test("goes through the AI router: logged as course_research, with the Anthropic search fee in the cost", async () => {
    const provider = new SearchingMock("anthropic-api");
    const ctx = await createTestApp({}, { provider });
    expect(ctx.ai.webSearchAvailable()).toBe(true);
    const hits = await ctx.ai.webSearch("react hooks", 5, { subjectUserId: "u-1" });
    expect(hits[0]!.url).toBe("https://react.dev/learn");
    const [call] = ctx.db.select().from(schema.aiCalls).where(eq(schema.aiCalls.purpose, "course_research")).all();
    expect(call).toMatchObject({ task: "course_research", ok: true, subjectUserId: "u-1", costMicros: 20_000 });
    await ctx.close();
  }, 60_000);

  test("the plain mock (like Codex CLI) has no web search", async () => {
    const ctx = await createTestApp();
    expect(ctx.ai.webSearchAvailable()).toBe(false);
    await ctx.close();
  }, 60_000);
});

describe("the AI connection page names the research mode", () => {
  test("AI web search, AI-only, a search service, and nothing without an AI credential", async () => {
    const searching = await createTestApp({}, { provider: new SearchingMock("anthropic-api") });
    const admin = await adminSession(searching);
    const one = (await searching.app.inject({ method: "GET", url: "/api/admin/research", ...as(admin) })).json().settings;
    expect(one).toMatchObject({ mode: "ai_web_search", modeLine: "Web search for new courses: using Claude's built-in web search (no extra setup needed)." });
    await searching.app.inject({ method: "PUT", url: "/api/admin/research", ...as(admin), payload: { provider: "tavily", searchKey: "tvly-x-123" } });
    const two = (await searching.app.inject({ method: "GET", url: "/api/admin/research", ...as(admin) })).json().settings;
    expect(two).toMatchObject({ mode: "provider", modeLine: "Web search for new courses: using Tavily." });
    await searching.close();

    const plain = await createTestApp();
    const admin2 = await adminSession(plain);
    expect((await plain.app.inject({ method: "GET", url: "/api/admin/research", ...as(admin2) })).json().settings).toMatchObject({ mode: "ai_only" });
    await plain.close();

    const none = await createTestApp({}, { noAi: true });
    const admin3 = await adminSession(none);
    const blocked = (await none.app.inject({ method: "GET", url: "/api/admin/research", ...as(admin3) })).json().settings;
    expect(blocked).toMatchObject({ mode: "none", modeLine: "New courses wait until an AI credential works. Connect an AI credential under Admin → AI connection." });
    await none.close();
  }, 120_000);

  test("plain lines", () => {
    expect(researchModeLine("ai_web_search", { ai: "openai-api" })).toBe("Web search for new courses: using OpenAI's built-in web search (no extra setup needed).");
    expect(researchModeLine("ai_web_search", { ai: "claude-cli" })).toContain("Claude's built-in web search");
  });
});

describe("AI research client", () => {
  test("known sources: the curriculum's references and the shared resources list, matched by their words", async () => {
    const ctx = await createTestApp();
    const at = Date.now();
    ctx.db.insert(schema.courses).values({ id: "lib-k", title: "Docker for developers", summary: "", audience: "everyone", published: true, origin: "generated", createdAt: at, updatedAt: at }).run();
    ctx.db.insert(schema.generatedCourses).values({ courseId: "lib-k", skill: "Docker", status: "published", scope: "global", library: true, createdAt: at }).run();
    ctx.db.insert(schema.courseSources).values({ id: "s-k", courseId: "lib-k", topicId: null, url: "https://docs.docker.com/build/building/multi-stage/", title: "Multi-stage builds", kind: "docs" }).run();
    const hits = knownSources(ctx.db, ctx.content, "docker multi-stage builds", 5);
    expect(hits.map((hit) => hit.url)).toContain("https://docs.docker.com/build/building/multi-stage/");
    expect(knownSources(ctx.db, ctx.content, "quantum basket weaving", 5)).toEqual([]);
    await ctx.close();
  }, 60_000);

  test("never throws: a failing AI gives fewer candidates, not a failed lesson", async () => {
    const ctx = await createTestApp();
    const client = makeAiResearchClient({
      ai: { generateJson: vi.fn(async () => Promise.reject(new Error("model down"))), webSearch: vi.fn(async () => Promise.reject(new Error("no search"))) },
      db: ctx.db,
      content: ctx.content,
      meta: {},
      webSearch: true,
    });
    expect(client.id).toBe("ai-web-search");
    await expect(client.search("anything at all", 4)).resolves.toEqual([]);
    expect(client.id).toBe("ai-knowledge");
    await ctx.close();
  }, 60_000);

  test("a saved service that fails hands over to the AI once, and says why once", async () => {
    const failing: SearchClient = { id: "tavily", search: vi.fn(async () => Promise.reject(new ProviderError("key_rejected", "search", "401", 401))) };
    const fallback: SearchClient = { id: "ai-knowledge", search: vi.fn(async () => [{ url: "https://a.dev/", title: "a", snippet: "", publishedAt: null }]) };
    const heard: string[] = [];
    const client = withAiFallback(failing, fallback, (failure) => heard.push(failure.state));
    await client.search("one", 3);
    await client.search("two", 3);
    expect(failing.search).toHaveBeenCalledTimes(1);
    expect(fallback.search).toHaveBeenCalledTimes(2);
    expect(heard).toEqual(["key_rejected"]);
    expect(client.id).toBe("ai-knowledge");
  });
});

describe("plain words", () => {
  test("the old pre-v4.4 notices are recognised; today's are not", () => {
    expect(isLegacyResearchNotice("3 targets still need a generated course. No research provider is set up. Add one under Admin → AI connection.")).toBe(true);
    expect(isLegacyResearchNotice("1 target still needs a generated course. No API key for tavily. Add one under Admin → AI connection.")).toBe(true);
    expect(isLegacyResearchNotice("We couldn't create the course because the AI isn't connected.")).toBe(false);
    expect(isLegacyResearchNotice(null)).toBe(false);
  });

  test("a source with no snippet takes the page's own description", () => {
    expect(descriptionOf('<meta name="description" content="How effects synchronise with outside systems.">')).toBe("How effects synchronise with outside systems.");
    expect(descriptionOf('<meta content="Open Graph text here" property="og:description">')).toBe("Open Graph text here");
    expect(descriptionOf("<title>x</title>")).toBe("");
  });
});
