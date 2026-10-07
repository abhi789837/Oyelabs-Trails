import type { GenerateJsonRequest } from "../types";
import { fixtureTopicTestAnswer, fixtureTopicTestItems, fixtureTopicTestRelevance } from "./mockTopicTests";

/**
 * MockProvider fixtures for v4.5 module tests ("module_test_items", "module_test_relevance",
 * "module_test_answer"). They reuse the v4.3 topic-test fixtures, which are built from the real
 * passages, so the same gates run end to end without a credential:
 *
 * - The writer reads the passages from the system prompt (the module material is the cached
 *   prefix there) and writes items whose key is an exact quote. Its stems are reworded as Oyelabs
 *   scenarios, and round 1 still includes two deliberately bad items (an "All of the above" option
 *   and a quote that is not in the material) so the gates have something to drop.
 * - The checkers are the topic-test checkers: the prompts the gates send are the same shape.
 */
export function fixtureModuleTests(request: GenerateJsonRequest<unknown>): unknown {
  switch (request.schemaName) {
    case "module_test_items": {
      const { items } = fixtureTopicTestItems(`${request.system}\n${request.user}`);
      return {
        items: items.map((raw) => {
          const item = raw as { prompt: string };
          const n = /^Mock item (\d+\.\d+)/.exec(item.prompt)?.[1] ?? "1.1";
          const heading = /under "(.*)"\?$/.exec(item.prompt)?.[1] ?? "the module";
          return { ...item, prompt: `Scenario ${n}: a client asks you at Oyelabs what to do, citing "${heading}". Which answer follows the material?` };
        }),
      };
    }
    case "module_test_relevance":
      return fixtureTopicTestRelevance(request.user);
    case "module_test_answer":
      return fixtureTopicTestAnswer(request.user);
    default:
      return undefined;
  }
}
