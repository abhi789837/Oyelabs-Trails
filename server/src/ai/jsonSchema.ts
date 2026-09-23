import { z, type ZodType } from "zod";

/**
 * zod schema -> JSON Schema for the providers.
 *
 * zod 4 ships `z.toJSONSchema`, so there is no separate converter dependency. The `io: "input"`
 * mode is what a provider needs: it describes what the model should *produce*, before any
 * transform or default is applied.
 *
 * `$schema` is stripped: Anthropic and OpenAI both reject unknown top-level keys on a strict
 * schema, and the dialect is implied by the API.
 */
export function toProviderJsonSchema(schema: ZodType<unknown>): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { io: "input", target: "draft-2020-12" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

/**
 * Providers only report *that* the output failed validation, so this turns zod's issues into the
 * repair message. Naming the exact paths is what makes a single repair turn work most of the time
 * instead of re-rolling the whole generation.
 */
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.map(String).join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

/**
 * Models sometimes wrap JSON in a fence or add a sentence before it, even with structured output
 * enabled. Pulling out the outermost object is cheaper and more reliable than a repair round-trip.
 */
export function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;

  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  if (fenced) return fenced[1].trim();

  const firstObject = trimmed.indexOf("{");
  const firstArray = trimmed.indexOf("[");
  const start = firstObject === -1 ? firstArray : firstArray === -1 ? firstObject : Math.min(firstObject, firstArray);
  if (start === -1) return trimmed;

  const open = trimmed[start];
  const close = open === "{" ? "}" : "]";
  const end = trimmed.lastIndexOf(close);
  return end > start ? trimmed.slice(start, end + 1) : trimmed.slice(start);
}
