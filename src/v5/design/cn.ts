import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `cn` for v5 components. tailwind-merge has to be told about the v5 theme names, or it reads
 * `text-small` as a colour and silently drops `text-on-brand` next to it (found by axe: dark text
 * on the primary button). Keep these lists in step with theme.css.
 */
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["caption", "small", "body", "lead", "h1", "h2", "h3", "h4", "display"] }],
      shadow: [{ shadow: ["e1", "e2", "e3"] }],
      rounded: [{ rounded: ["control", "card", "sheet"] }],
      "rounded-t": [{ "rounded-t": ["control", "card", "sheet"] }],
      "max-w": [{ "max-w": ["article"] }],
      ease: [{ ease: ["enter", "exit", "move"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
