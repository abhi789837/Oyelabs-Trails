# TypeScript research notes (2026-09-21)

## Videos

Primary course (brief's chapter-split worked example): "Practical TypeScript – Course for Beginners" (freeCodeCamp.org, `JHEB7RhJG1Y`, 9:34:51, embeddable). Chapters from `yt.mjs info --chapters` match the brief exactly.

- ts-basic-types: primary course, from "Intro, Type Annotations, Arrays" at 0:00:00 (startSeconds 0).
- ts-interfaces-vs-type-aliases: primary course, from "Alias and Interface" at 1:54:57 (6897). Alt: Matt Pocock, "Types vs Interfaces: What I Got Wrong In 2022" (9:57, Apr 2025).
- ts-functions-inference: primary course, from "Objects and Functions" at 0:55:40 (3340). Alt: Matt Pocock, "Most TS devs don't understand 'satisfies'" (4:10).
- ts-union-intersection: Andrew Burgess, "The KEY to unions and intersections in TypeScript" (4:32). No primary chapter covers unions/intersections as a topic. Alts: Andrew Burgess, "TypeScript Exhaustive Switch…" (10:20), which fits the discriminated-union code challenge; freeCodeCamp "Learn TypeScript – Full Tutorial" (`30LWjhZzg50`) from "Union Types in TS" at 1:50:03 (6603).
- ts-narrowing-type-guards: primary course, from "Type Guards" at 3:59:10 (14350). Alt: `30LWjhZzg50` from "Type Narrowing" at 4:07:16 (14836).
- ts-generics-fundamentals: primary course, from "Generics" at 4:31:02 (16262). Alt: Web Dev Simplified, "Learn TypeScript Generics In 13 Minutes" (12:51).
- ts-generic-constraints-defaults: Matt Pocock, "Generics: The most intimidating TypeScript feature" (18:19, 239k views). Its chapters cover constraints (5:55) and defaults (14:05). I used the whole video so it doesn't repeat the primary generics chapter.
- ts-utility-types: Web Dev Simplified, "You are a Junior Dev if You Don’t Know These 18 TypeScript Utility Types" (22:09, Nov 2025).
- ts-enums-literal-types: primary course, from "Tuples and Enums" at 3:02:53 (10973). Alt: Matt Pocock, "Enums considered harmful" (9:23).
- ts-classes-access-modifiers: primary course, from "Classes" at 5:43:05 (20585). Alt: `30LWjhZzg50` from "Classes" at 2:53:44 (10424), which covers private/protected/getters/abstract.
- ts-modules-namespaces: TypeScript with Benny Code, "Mastering Modules in TypeScript [FULL COURSE]" (18:27). Alt: Matt Pocock, "Import vs Require: The Biggest JavaScript Divide" (4:02).
- ts-conditional-types: Matt Pocock, "Infer is easier than you think" (13:38, 116k views).
- ts-mapped-types: Jack Herrington, "No BS TS #14 - Mapped Types in Typescript" (9:32, 2021). It covers key remapping, `Capitalize` and optional mapping, all still current. Alt: Typed Rocks (6:48, 2024).
- ts-template-literal-types: basarat, "TypeScript Template Literal Types // So much power ☢️" (5:18). basarat is the author of TypeScript Deep Dive, one of the module refs. Alt: Harry Wolff (19:11). This was the best focused video I found; I also searched Matt Pocock, Andrew Burgess, Web Dev Simplified, Fireship and freeCodeCamp, and none has a high-view, dedicated, recent video.
- ts-tsconfig-strictness: Web Dev Simplified, "Strict TypeScript Isn't Enough Anymore" (21:24, Mar 2026). Alt: Matt Pocock, "The TSConfig Cheat Sheet" (5:36).
- ts-react-components-hooks: primary course, from "React with TypeScript" at 6:47:18 (24438). Alt: Matt Pocock, "Blazing Fast Tips: React & TypeScript" (6:14).
- Two primary chapters are unused: "Fetch Data" (5:10:25) and "Tasks" (6:05:17). Both are project walkthroughs with no clean one-topic mapping.
- The brief lists `30LWjhZzg50` as 1:29:00, but `info` reports 4:46:25 (Hitesh Choudhary's course on freeCodeCamp.org, 32 chapters). It's only used as a chapter-split alternate.
- No search-URL fallbacks. Every video and alternate reported `embeddable: true`.

## References

- `github.com/microsoft/TypeScript/blob/main/src/lib/es5.d.ts` is now a 404. Since the TypeScript 7 (Go) codebase moved into microsoft/TypeScript, the lib files live at `tsc/internal/bundled/libs/lib.es5.d.ts` (used for ts-utility-types). microsoft/typescript-go is archived.
- `exploringjs.com/tackling-ts/` returns 404, so I didn't use it.
- Sites that block iframe previews: MDN (`X-Frame-Options: DENY`), GitHub (CSP `frame-ancestors 'none'`), devblogs.microsoft.com (`SAMEORIGIN`), kentcdodds.com (`frame-ancestors 'self'`). typescriptlang.org, totaltypescript.com, basarat.gitbook.io (`frame-ancestors https:`), react.dev, nodejs.org, zod.dev, artsy.github.io, ivov.dev, lexi-lambda.github.io and react-typescript-cheatsheet.netlify.app allow framing.
- I confirmed every `#anchor` deep link exists as an `id` in the page HTML (handbook pages, release notes, the TS 7.0 blog post, the React 19 upgrade guide).

## Facts verified

- **Quiz snippets were compiled, not recalled.** I installed TypeScript 7.0.2 (npm `latest`) and 6.0.3 (`@typescript/typescript6`) in a scratch sandbox and compiled every quiz code block and code-shaped option with both. Assertions used `@ts-expect-error` and a type-level `Equal` helper. I checked runtime claims (enum reverse mappings, `private` vs `#private`, define-semantics fields, detached methods) by running the emitted JS on Node 24.11. React claims were checked against `@types/react` 19.3.0.
- **TS 6.0 release notes:** `strict` defaults to `true`, `module` to `esnext`, and `target` floats to the current year (`es2025`). `types` defaults to `[]`, `rootDir` to the tsconfig's folder, and `noUncheckedSideEffectImports` to `true`. It deprecated `baseUrl`, `moduleResolution: node10`, `target: es5`, `esModuleInterop: false` and the `module Foo {}` namespace syntax, and removed `outFile`.
- **TS 7.0 announcement (July 8, 2026):** it's the Go port, 8–12× faster on full builds. There's no programmatic API until 7.1, so `@typescript/typescript6` (a `tsc6` binary) runs side by side. It adopts 6.0's defaults and makes every 6.0 deprecation a hard error. Template literal inference now splits by Unicode code point. Vue, Svelte, Astro and MDX tooling stays on 6.0 for now.
- **Errors observed on 7.0.2:** TS5102 (`baseUrl` removed), TS5090 (non-relative `paths`), TS5011 (`rootDir` must be explicit; 6.0.3 reports the same and emits to `dist/src`), TS1540 (`module Foo {}`), TS2612 (a redeclared field would overwrite the base property), TS2748 (ambient const enum under `isolatedModules` or `verbatimModuleSyntax`), TS1484, TS1205, TS2835, TS5097, TS2595 and TS2590.
- **Union size limit:** 17^4 = 83,521 members compiles; 18^4 = 104,976 gives TS2590. That supports "about 100,000".
- **Behaviour that differs from older docs:** `const T extends string[]` now infers a mutable tuple `["x", "y"]`, not the `string[]` the 5.0 release notes describe, so the quiz only contrasts `const` vs non-`const` with a `readonly` constraint. The "checked returns for conditional types" idea from the 5.8 betas isn't in 7.0.2: returning into an unresolved conditional type still errors.
- **TSConfig reference:** the `strict` family list includes `strictBuiltinIteratorReturn`. `isolatedModules` defaults to `true` with `verbatimModuleSyntax`, and `preserveConstEnums` to `true` with `isolatedModules`. Also checked: the constructs `erasableSyntaxOnly` rejects (including `const enum`), and that `useDefineForClassFields` defaults to `true` for ES2022+ targets.
- **Node.js TypeScript docs (v26 page, with history):** type stripping has been on by default since 22.18/23.6 and stable since 24.12/25.2. It ignores tsconfig, requires file extensions, and rejects enums, value namespaces and parameter properties. `--experimental-transform-types` was removed in 26.0.
- **React 19 upgrade guide:** `useRef` requires an argument, all refs are mutable, and `useRef<T>(null)` is `RefObject<T | null>`. The global `JSX` namespace moved under `React` (bare `JSX.Element` gives TS2503 with `@types/react` 19.3). `ReactElement` props default to `unknown`. Implicit returns from ref callbacks are rejected. `useReducer` no longer takes `React.Reducer<…>` as a type argument.
- **lib.es5.d.ts (current):** `NonNullable<T> = T & {}`, `Omit<T, K extends keyof any>` and `Awaited` recursion.

## For a human to double-check

- ts-react-components-hooks has `estMinutes: 200` because its chapter really is 2:47:33. Consider whether a shorter primary video would suit learners better (Matt Pocock's 6:14 video is the alternate).
- ts-template-literal-types' primary video (basarat, 10k views, 2022) is the weakest pick in the module.
- The ts-generic-constraints-defaults challenge uses an own `"__proto__"` key in test args (written as a computed key). It survives `structuredClone`/`postMessage` in Node, but it's worth one manual run in the in-browser runner.
