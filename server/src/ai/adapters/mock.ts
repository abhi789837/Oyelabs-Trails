import type { ProviderId } from "../../../../shared/enums";
import { toProviderJsonSchema } from "../jsonSchema";
import { AiOutputError, type AiProvider, type GenerateJsonRequest, type GenerateJsonResult } from "../types";
import { fixtureBlueprint, fixtureCritic, fixtureExplainItems, fixtureItems } from "./mockFixtures";

/**
 * A deterministic stand-in for a real provider, for development and tests only.
 *
 * It exists because every phase from P4 onward is built on AI output, and those phases have to be
 * testable without a live credential — and without paying for one on every test run. It walks the
 * request's JSON Schema and synthesises a document that satisfies it, seeded so the same request
 * always produces the same result.
 *
 * It is **never selectable in production**: `createProvider` only offers it when
 * `NODE_ENV !== "production"`, and it is not in `selectableProviderIds`. What it produces is
 * structurally valid and semantically meaningless — it proves the plumbing, never the content.
 */
export interface MockHints {
  /** Real topic ids, so generated plans and item tags survive server-side validation. */
  topicIds?: string[];
  /** Real module ids, so a fixture blueprint's areas are not discarded. */
  moduleIds?: string[];
  /** Area names the blueprint should use. */
  areas?: string[];
}

export class MockProvider implements AiProvider {
  readonly id: ProviderId = "mock";
  private calls = 0;

  constructor(
    private readonly hints: MockHints = {},
    /** Set to make every call fail, for testing the failure paths. */
    private readonly failWith?: Error,
  ) {}

  defaultModel(): string {
    return "mock-1";
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    if (this.failWith) throw this.failWith;

    // The assessment pipeline needs *semantically* coherent output, not merely schema-valid
    // output, or every item would be dropped by validation and the pipeline would prove nothing.
    const fixture = this.fixtureFor(request);
    if (fixture !== undefined) {
      const checked = request.schema.safeParse(fixture);
      if (!checked.success) {
        throw new AiOutputError(
          `MockProvider's fixture for "${request.schemaName}" no longer matches its schema. Update server/src/ai/adapters/mockFixtures.ts.`,
          checked.error.issues.map((i) => `${i.path.map(String).join(".")}: ${i.message}`),
        );
      }
      return { data: checked.data, usage: { input: Math.round(request.user.length / 4), output: 512 }, latencyMs: 5, model: "mock-1" };
    }

    const schema = toProviderJsonSchema(request.schema);
    const seed = hashString(`${request.purpose}:${request.schemaName ?? ""}:${this.calls++}:${request.user.length}`);
    const value = synthesise(schema, schema, new Rng(seed), this.hints, "");

    const parsed = request.schema.safeParse(value);
    if (!parsed.success) {
      // A failure here means the mock cannot satisfy a schema the real providers are asked for,
      // which is a bug in this generator rather than a plausible production error.
      throw new AiOutputError(
        "MockProvider could not synthesise a value matching the schema. Extend server/src/ai/adapters/mock.ts.",
        parsed.error.issues.map((i) => `${i.path.map(String).join(".")}: ${i.message}`),
      );
    }

    return {
      data: parsed.data,
      usage: { input: Math.round(request.user.length / 4), output: 256 },
      latencyMs: 5,
      model: "mock-1",
    };
  }

  async verify(): Promise<void> {
    if (this.failWith) throw this.failWith;
  }

  /**
   * Hand-built output for the pipeline's known call shapes; undefined means "synthesise".
   *
   * The names "blueprint", "items", "explain_items" and "critic" are reserved: any call using one
   * gets the matching fixture, and a mismatch is a loud error rather than a silent fallback, so
   * fixture drift is caught the moment a schema changes. Other callers should use another name.
   */
  private fixtureFor(request: GenerateJsonRequest<unknown>): unknown {
    const context = {
      moduleIds: this.hints.moduleIds ?? [],
      topicIds: this.hints.topicIds ?? [],
      seed: this.calls++,
    };

    switch (request.schemaName) {
      case "blueprint":
        return fixtureBlueprint(context);
      case "items": {
        // The area name is in the prompt; using it keeps each batch distinguishable.
        const area = /Name: (.+)/.exec(request.user)?.[1]?.trim() ?? "General";
        return { items: fixtureItems(context, area) };
      }
      case "explain_items":
        return { items: fixtureExplainItems(context, 4) };
      case "critic": {
        const count = (request.user.match(/^### Item \d+$/gm) ?? []).length;
        return { verdicts: fixtureCritic({ length: Math.max(1, count) }) };
      }
      default:
        return undefined;
    }
  }
}

// ---------------------------------------------------------------------------
// Deterministic synthesis from a JSON Schema
// ---------------------------------------------------------------------------

function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32, the same generator the client uses for quiz shuffling. */
class Rng {
  constructor(private state: number) {}
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length) % items.length];
  }
}

type Schema = Record<string, unknown>;

function resolveRef(schema: Schema, root: Schema): Schema {
  const ref = schema.$ref;
  if (typeof ref !== "string" || !ref.startsWith("#/")) return schema;
  const parts = ref.slice(2).split("/");
  let node: unknown = root;
  for (const part of parts) {
    node = (node as Record<string, unknown>)?.[decodeURIComponent(part)];
  }
  return (node as Schema) ?? schema;
}

const WORDS = [
  "closure",
  "reconciliation",
  "invariant",
  "throughput",
  "idempotent",
  "migration",
  "hydration",
  "pagination",
  "isolation",
  "coalescing",
];

function sentence(rng: Rng, words: number): string {
  const parts = Array.from({ length: words }, () => rng.pick(WORDS));
  const text = parts.join(" ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

function synthesise(schema: Schema, root: Schema, rng: Rng, hints: MockHints, path: string): unknown {
  const node = resolveRef(schema, root);

  if (node.const !== undefined) return node.const;
  if (Array.isArray(node.enum) && node.enum.length > 0) return rng.pick(node.enum);

  for (const key of ["anyOf", "oneOf", "allOf"] as const) {
    const branches = node[key];
    if (Array.isArray(branches) && branches.length > 0) {
      // allOf needs every branch merged; anyOf/oneOf only needs one to be satisfied.
      if (key === "allOf") {
        const merged: Record<string, unknown> = {};
        for (const branch of branches) {
          const value = synthesise(branch as Schema, root, rng, hints, path);
          if (value && typeof value === "object") Object.assign(merged, value);
        }
        return merged;
      }
      return synthesise(branches[0] as Schema, root, rng, hints, path);
    }
  }

  const type = Array.isArray(node.type) ? node.type[0] : node.type;

  switch (type) {
    case "object": {
      const properties = (node.properties ?? {}) as Record<string, Schema>;
      const required = new Set((node.required as string[] | undefined) ?? []);
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(properties)) {
        // Optional fields are filled about half the time, so both shapes get exercised.
        if (!required.has(key) && rng.next() < 0.5) continue;
        out[key] = synthesise(child, root, rng, hints, path ? `${path}.${key}` : key);
      }
      return out;
    }

    case "array": {
      const min = typeof node.minItems === "number" ? node.minItems : 1;
      const max = typeof node.maxItems === "number" ? Math.min(node.maxItems, min + 3) : min + 2;
      const items = (node.items ?? {}) as Schema;
      const count = Math.max(min, Math.min(max, rng.int(min, max)));

      // A list of topic ids must contain *real* ids or the server drops the whole thing.
      if (isTopicIdPath(path) && hints.topicIds?.length) {
        const pool = [...hints.topicIds];
        const picked: string[] = [];
        for (let i = 0; i < count && pool.length > 0; i++) {
          picked.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
        }
        return picked;
      }

      return Array.from({ length: count }, (_, i) => synthesise(items, root, rng, hints, `${path}[${i}]`));
    }

    case "integer":
    case "number": {
      const min = typeof node.minimum === "number" ? node.minimum : 1;
      const max = typeof node.maximum === "number" ? Math.min(node.maximum, min + 10) : min + 5;
      const value = rng.int(Math.ceil(min), Math.max(Math.ceil(min), Math.floor(max)));
      return type === "integer" ? value : value;
    }

    case "boolean":
      return rng.next() < 0.5;

    case "null":
      return null;

    default: {
      if (isTopicIdPath(path) && hints.topicIds?.length) return rng.pick(hints.topicIds);
      if (/\barea\b/i.test(path) && hints.areas?.length) return rng.pick(hints.areas);

      const minLength = typeof node.minLength === "number" ? node.minLength : 0;
      let text = sentence(rng, Math.max(3, Math.ceil(minLength / 8)));
      while (text.length < minLength) text += ` ${sentence(rng, 4)}`;
      if (typeof node.maxLength === "number" && text.length > node.maxLength) text = text.slice(0, node.maxLength);
      return text;
    }
  }
}

function isTopicIdPath(path: string): boolean {
  return /topicIds?(\[\d+\])?$/i.test(path);
}
