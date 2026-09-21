import type { Module } from "@/types/curriculum";

// Shared fixtures for the ts-narrowing-type-guards code challenge (plain data only).
const tsUserSchema = {
  object: {
    id: "number",
    name: "string",
    role: { oneOf: ["admin", "user"] },
    tags: { arrayOf: "string" },
    address: { object: { city: "string", zip: "string" }, optional: ["zip"] },
  },
};
const tsValidUser = { id: 7, name: "Ada", role: "admin", tags: ["math", "engines"], address: { city: "London", zip: "N1" } };

export default {
  id: "fe-typescript",
  trackId: "frontend",
  name: "TypeScript",
  description:
    "TypeScript's type system from everyday annotations to conditional, mapped and template literal types, plus the tsconfig and module settings that matter in TypeScript 6/7 projects. For engineers who already ship JavaScript and want to reason precisely about what the compiler checks, and what it can't.",
  refs: [
    { label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html", kind: "docs" },
    { label: "TypeScript Deep Dive (basarat)", url: "https://basarat.gitbook.io/typescript", kind: "article" },
    { label: "TypeScript: Release notes", url: "https://www.typescriptlang.org/docs/handbook/release-notes/overview.html", kind: "docs" },
    { label: "TypeScript blog: Announcing TypeScript 7.0", url: "https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/", kind: "article" },
  ],
  topics: [
    {
      id: "ts-basic-types",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Basic Types & Type Annotations",
      summary:
        "TypeScript is a structural, compile-time-only type system layered over JavaScript. Every annotation is erased before the code runs, so types check intent but never validate data at runtime. Most of the time you shouldn't write annotations at all: inference handles locals, and you annotate at boundaries (parameters, exported APIs, values arriving from outside) where inference has nothing to work from.\n\nThree special types carry the most weight. `any` switches checking off in both directions and spreads silently through everything it touches. `unknown` is the safe top type: anything is assignable to it, but you must narrow before using it, which makes it the right type for `JSON.parse` results, `catch` variables and untrusted input. `never` is the empty bottom type: the return type of functions that can't return, and what's left when narrowing has ruled out every case. Also note that `{}` means \"any non-nullish value\", not \"empty object\"; use `object` for non-primitives or `Record<string, unknown>` for dictionaries.\n\nLiteral inference is where experienced people get surprised. `const s = \"a\"` has the literal type `\"a\"`, but `let` variables and object properties widen to `string`, so `{ status: \"idle\" }` won't satisfy a `\"idle\" | \"done\"` parameter without `as const`, `satisfies` or a contextual type. Under `strictNullChecks`, `null` and `undefined` are separate types rather than members of every type. Since TypeScript 6.0 `strict` is on by default, and TypeScript 7.0 (the native Go compiler) keeps that default.",
      level: "beginner",
      estMinutes: 80,
      webRefs: [
        { label: "TypeScript Handbook: Everyday Types", url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html", kind: "docs" },
        { label: "TypeScript Deep Dive: Never Type", url: "https://basarat.gitbook.io/typescript/type-system/never", kind: "article" },
        { label: "Total TypeScript: The Empty Object Type in TypeScript", url: "https://www.totaltypescript.com/the-empty-object-type-in-typescript", kind: "article" },
      ],
      video: {
        title: "Practical TypeScript – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=JHEB7RhJG1Y",
        videoId: "JHEB7RhJG1Y",
        durationLabel: "9:34:51",
        startSeconds: 0,
        chapterLabel: "Chapter 1: Intro, Type Annotations, Arrays",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-basic-types-q1",
          prompt: "What types does TypeScript infer for `x` and `y`?\n\n```ts\nlet x = \"hi\";\nconst y = \"hi\";\n```",
          options: ["`x: string`, `y: \"hi\"`", "`x: \"hi\"`, `y: \"hi\"`", "`x: string`, `y: string`", "`x: any`, `y: string`"],
          correctIndex: 0,
          explanation:
            "A `const` can never be reassigned, so TypeScript keeps the literal type `\"hi\"`. A `let` could later hold any string, so its literal is widened to `string`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-basic-types-q2",
          prompt:
            "This call fails with \"Argument of type 'string' is not assignable to parameter of type '\"idle\" | \"done\"'\". Which changes make it compile? (Select all that apply.)\n\n```ts\ndeclare function setStatus(s: \"idle\" | \"done\"): void;\nconst state = { status: \"idle\" };\nsetStatus(state.status);\n```",
          options: [
            "`const state = { status: \"idle\" } as const;`",
            "`const state = { status: \"idle\" as const };`",
            "`const state = { status: \"idle\" } satisfies { status: \"idle\" | \"done\" };`",
            "`let state = { status: \"idle\" };`",
            "`const state: { status: string } = { status: \"idle\" };`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Object properties are mutable, so their literals widen to `string` even inside a `const` object. `as const` (on the object or the property) and `satisfies` with a literal-typed target keep `\"idle\"`; `let` or a `string` annotation widen just the same.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-basic-types-q3",
          prompt:
            "Under `strict`, which lines compile? (Select all that apply.)\n\n```ts\nlet a: any = JSON.parse(\"{}\");\nlet u: unknown = JSON.parse(\"{}\");\n```",
          options: [
            "`a.foo.bar();`",
            "`const n: number = a;`",
            "`if (typeof u === \"number\") u.toFixed();`",
            "`u.foo;`",
            "`const m: number = u;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`any` is assignable to and from everything and allows any member access. `unknown` accepts any value but can't be used, or assigned to a narrower type, until you narrow it, which the `typeof` check does.",
        },
        {
          id: "ts-basic-types-q4",
          prompt:
            "What return types does TypeScript infer?\n\n```ts\nfunction fail(msg: string) {\n  throw new Error(msg);\n}\nconst fail2 = (msg: string) => {\n  throw new Error(msg);\n};\n```",
          options: [
            "`fail` returns `void`, `fail2` returns `never`",
            "Both return `never`",
            "Both return `void`",
            "`fail` returns `never`, `fail2` returns `void`",
          ],
          correctIndex: 0,
          explanation:
            "For backwards compatibility, a function declaration whose end is unreachable still infers `void`; function expressions and arrow functions infer `never`. Annotate `: never` explicitly if you want control-flow analysis to treat a call as ending the code path.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-basic-types-q5",
          prompt: "Under `strictNullChecks`, which values can be assigned to a variable of type `{}`? (Select all that apply.)",
          options: ["`\"hello\"`", "`42`", "`[]`", "`null`", "`undefined`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`{}` means \"any value that isn't `null` or `undefined`\", primitives included, since primitives have properties through their wrapper types. Use `object` to exclude primitives, or `Record<string, unknown>` for an actual dictionary.",
        },
        {
          id: "ts-basic-types-q6",
          prompt: "Which of these still exist in the JavaScript that `tsc` emits? (Select all that apply.)",
          options: [
            "A `class` declaration",
            "A regular (non-`const`) `enum` declaration",
            "An `interface` declaration",
            "A `type` alias",
            "A parameter's type annotation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Classes and regular enums are values as well as types, so they emit code. Interfaces, type aliases and annotations are erased completely, which is also why you can't use `instanceof` with an interface.",
        },
        {
          id: "ts-basic-types-q7",
          prompt:
            "What happens here?\n\n```ts\ninterface User { id: number; name: string }\nconst user: User = JSON.parse('{\"id\":\"42\"}');\nconsole.log(user.name.toUpperCase());\n```",
          options: [
            "It compiles, then throws a `TypeError` at runtime because `user.name` is `undefined`",
            "It fails to compile because the JSON doesn't match `User`",
            "TypeScript inserts a runtime check, so `JSON.parse` throws",
            "It compiles and logs `undefined`",
          ],
          correctIndex: 0,
          explanation:
            "`JSON.parse` returns `any`, which is assignable to `User` without any check, and types don't exist at runtime. Type such values as `unknown` and validate them (a type guard or a schema library) before trusting them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-basic-types-q8",
          prompt:
            "Which statement is true?\n\n```ts\nconst f: () => void = () => 42;\nfunction g(): void {\n  return 42;\n}\n```",
          options: ["`f` compiles; `g` is an error", "Both are errors", "Both compile", "`g` compiles; `f` is an error"],
          correctIndex: 0,
          explanation:
            "A function type returning `void` means \"the caller ignores the result\", so any function is assignable to it; that's why `items.forEach((x) => list.push(x))` type-checks. A function declaration annotated `: void` must not return a value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-basic-types-q9",
          prompt:
            "Given `const xs: readonly number[] = [1, 2, 3];`, which lines compile? (Select all that apply.)",
          options: [
            "`const first = xs[0];`",
            "`const doubled = xs.map((n) => n * 2);`",
            "`xs.push(4);`",
            "`xs.sort();`",
            "`const ys: number[] = xs;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`readonly number[]` (`ReadonlyArray<number>`) has no mutating methods, and it isn't assignable to a mutable `number[]` (the reverse is fine). It's a compile-time view only: the array itself is still mutable at runtime.",
        },
        {
          id: "ts-basic-types-q10",
          prompt: "Your project's `tsconfig.json` doesn't mention `strict` at all. With TypeScript 7.0, is `noImplicitAny` enabled?",
          options: [
            "Yes: `strict` has defaulted to `true` since TypeScript 6.0, and 7.0 keeps 6.0's defaults",
            "No: `strict` is only on when `tsc --init` wrote it into the file",
            "Only in `.tsx` files",
            "Only when `target` is `es2025` or later",
          ],
          correctIndex: 0,
          explanation:
            "TypeScript 6.0 changed the default of `strict` to `true` (along with `module: esnext` and a current-year `target`), and TypeScript 7.0 adopted those defaults. Projects that relied on the old default now need an explicit `\"strict\": false`.",
        },
      ],
    },
    {
      id: "ts-interfaces-vs-type-aliases",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Interfaces vs Type Aliases",
      summary:
        "Interfaces and type aliases overlap for plain object shapes, so the choice comes down to a few behaviours that differ, not raw capability.\n\nInterfaces are open: two `interface User` declarations in the same scope merge. That's how you augment a library's types (`declare module \"express-serve-static-core\" { interface Request { user?: User } }`) or add globals to `Window`. The flip side is accidental merging: in a script file with no imports or exports, `interface Comment {}` silently merges into the DOM's `Comment`. Type aliases are closed and report a duplicate identifier instead, but they can name anything: unions, tuples, primitives, function types, and every mapped, conditional or template literal type, none of which an interface can express.\n\nComposition differs too. `interface B extends A` is checked, so redeclaring a property with an incompatible type fails at the declaration. The intersection `A & { x: number }` never errors: conflicting properties quietly become `never`, and you find out far from the cause. The TypeScript performance wiki recommends `extends` over intersections for composed object types because relationships between interfaces are cached, while intersections are checked constituent by constituent.\n\nThe gotcha that bites in practice is index signatures. A type alias for an object literal type is assignable to `Record<string, unknown>`, but an interface isn't, because interfaces can be augmented later and so don't get an implicit index signature. A common convention is `interface` for public object contracts that consumers may extend and `type` for everything else; consistency matters more than which rule you pick.",
      level: "intermediate",
      estMinutes: 95,
      webRefs: [
        {
          label: "TypeScript Handbook: Differences Between Type Aliases and Interfaces",
          url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces",
          kind: "docs",
        },
        { label: "TypeScript Handbook: Declaration Merging", url: "https://www.typescriptlang.org/docs/handbook/declaration-merging.html", kind: "docs" },
        { label: "Total TypeScript: Type vs Interface: Which Should You Use?", url: "https://www.totaltypescript.com/type-vs-interface-which-should-you-use", kind: "article" },
        {
          label: "TypeScript wiki: Performance (Preferring Interfaces Over Intersections)",
          url: "https://github.com/microsoft/TypeScript/wiki/Performance#preferring-interfaces-over-intersections",
          kind: "article",
        },
      ],
      video: {
        title: "Practical TypeScript – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=JHEB7RhJG1Y",
        videoId: "JHEB7RhJG1Y",
        durationLabel: "9:34:51",
        startSeconds: 6897,
        chapterLabel: "Chapter 3: Alias and Interface",
      },
      alternateVideos: [
        {
          title: "Types vs Interfaces: What I Got Wrong In 2022",
          channel: "Matt Pocock",
          url: "https://www.youtube.com/watch?v=e0AIkYrXAYE",
          videoId: "e0AIkYrXAYE",
          durationLabel: "9:57",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-interfaces-vs-type-aliases-q1",
          prompt:
            "Which statements are true about this file? (Select all that apply.)\n\n```ts\ninterface User { name: string }\ninterface User { age: number }\n\ntype Point = { x: number };\ntype Point = { y: number };\n```",
          options: [
            "`User` now requires both `name` and `age`",
            "The two `Point` declarations are a \"Duplicate identifier\" error",
            "The second `User` replaces the first, so only `age` is required",
            "`Point` becomes `{ x: number; y: number }`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Interfaces with the same name in the same scope merge their members (declaration merging). Type aliases can't be reopened, so declaring one twice is an error.",
        },
        {
          id: "ts-interfaces-vs-type-aliases-q2",
          prompt:
            "What does the compiler report?\n\n```ts\ninterface A { x: string }\ninterface B extends A { x: number } // (1)\ntype C = A & { x: number };         // (2)\n```",
          options: [
            "(1) is an error; (2) compiles, and `C[\"x\"]` is `never`",
            "Both compile, and `x` is `string | number` in both",
            "Both are errors",
            "(2) is an error; (1) compiles and overrides `x`",
          ],
          correctIndex: 0,
          explanation:
            "`extends` checks that the redeclared member is compatible with the base, so the conflict is caught at the declaration. An intersection never errors: `string & number` reduces to `never`, and the problem only surfaces when someone tries to create a value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-interfaces-vs-type-aliases-q3",
          prompt:
            "Which calls compile?\n\n```ts\ninterface IPoint { x: number; y: number }\ntype TPoint = { x: number; y: number };\ndeclare function log(r: Record<string, unknown>): void;\ndeclare const ip: IPoint;\ndeclare const tp: TPoint;\n\nlog(ip); // (1)\nlog(tp); // (2)\n```",
          options: [
            "(1) is an error (index signature missing); (2) compiles",
            "Both compile",
            "Both are errors",
            "(1) compiles; (2) is an error",
          ],
          correctIndex: 0,
          explanation:
            "Object literal types get an implicit index signature, so `TPoint` is assignable to `Record<string, unknown>`. Interfaces don't, because declaration merging could add members later; type the parameter as `object` or pass `{ ...ip }` when you hit this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-interfaces-vs-type-aliases-q4",
          prompt: "Which of these can only be written as a type alias, not as an interface? (Select all that apply.)",
          options: [
            "A union such as `\"sm\" | \"md\" | \"lg\"`",
            "A mapped type such as `{ [K in Keys]: boolean }`",
            "An alias for a primitive, such as `UserId` for `string`",
            "An object type with methods and optional properties",
            "A callable type with a call signature",
            "A shape that a class can `implements`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Interfaces only describe object types (including call and construct signatures), so unions, mapped and conditional types, and primitive aliases need `type`. Classes can implement either kind, as long as it's an object type with statically known members.",
        },
        {
          id: "ts-interfaces-vs-type-aliases-q5",
          prompt:
            "The TypeScript performance wiki recommends `interface Foo extends Bar, Baz { … }` over `type Foo = Bar & Baz & { … }`. Why?",
          options: [
            "Relationships between interfaces are cached and conflicts are detected once at the declaration, while intersections are checked constituent by constituent wherever they're used",
            "Intersections are emitted as runtime helper code, interfaces aren't",
            "The TypeScript 7 compiler only parallelizes checking of interfaces",
            "Intersections turn off excess property checks",
          ],
          correctIndex: 0,
          explanation:
            "Per the wiki, interfaces create a single flat object type, display better and have their relationships cached, whereas every constituent of a target intersection is checked before the flattened type. Neither construct emits any runtime code.",
        },
        {
          id: "ts-interfaces-vs-type-aliases-q6",
          prompt:
            "This is a file with no `import` or `export`, compiled with the default `lib` (which includes the DOM). What happens?\n\n```ts\ninterface Comment { body: string }\nconst c: Comment = { body: \"hi\" };\n```",
          options: [
            "Error: `c` is missing `data`, `length`, `ownerDocument` and dozens of other properties",
            "It compiles; the local interface shadows the DOM type",
            "Error: duplicate identifier `Comment`",
            "It compiles, but only because interfaces are erased",
          ],
          correctIndex: 0,
          explanation:
            "A file without imports or exports is a global script, so the interface merges into the DOM's `Comment`. Adding `export {}` (or setting `moduleDetection: \"force\"`) makes the file a module and the interface local.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-interfaces-vs-type-aliases-q7",
          prompt:
            "To add `user?: User` to Express's request type, you write `declare module \"express-serve-static-core\" { interface Request { user?: User } }`. Why does this have to be an interface?",
          options: [
            "Only interfaces (and namespaces) merge, so a same-named interface in that module augments the library's type",
            "Type aliases can't appear inside `declare module` blocks",
            "Express's `Request` is a class, and classes only merge with interfaces",
            "It doesn't: `type Request = Request & { user?: User }` works the same way",
          ],
          correctIndex: 0,
          explanation:
            "Module augmentation relies on declaration merging, which type aliases don't support: a `type Request` there would be a duplicate identifier (and a circular one). Aliases are perfectly legal inside `declare module` blocks; they just can't reopen an existing type.",
        },
        {
          id: "ts-interfaces-vs-type-aliases-q8",
          prompt:
            "Given these aliases, which declarations compile? (Select all that apply.)\n\n```ts\ntype TPoint = { x: number; y: number };\ntype AorB = { a: string } | { b: string };\n```",
          options: [
            "`class P implements TPoint { x = 0; y = 0; }`",
            "`interface P3 extends TPoint { z: number }`",
            "`class Q implements AorB { a = \"\"; }`",
            "`interface R extends AorB {}`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Classes can implement, and interfaces can extend, any object type with statically known members, aliases included. A union doesn't qualify because TypeScript can't know which member's properties to require.",
        },
        {
          id: "ts-interfaces-vs-type-aliases-q9",
          prompt:
            "Which statement is true?\n\n```ts\ninterface M1 { f(x: string): void }\ninterface M2 { f(x: number): void }\n\ninterface M3 extends M1, M2 {} // (1)\ntype M4 = M1 & M2;             // (2)\n```",
          options: [
            "(1) is an error because `f` differs between the bases; in (2), `f` behaves like an overload accepting `string` or `number`",
            "Both produce an overloaded `f`",
            "Both are errors",
            "(1) produces an overloaded `f`; in (2), `f` becomes `never`",
          ],
          correctIndex: 0,
          explanation:
            "When an interface extends several bases, same-named members must be compatible, so (1) fails. Intersecting function-valued members gives an intersection of function types, which resolves like an overload set, so `m4.f(\"a\")` and `m4.f(1)` both type-check.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-interfaces-vs-type-aliases-q10",
          prompt:
            "`Sheep` extends `Animal`. After these declarations merge, which signature does `cloner.clone(sheep)` resolve to?\n\n```ts\ninterface Cloner { clone(a: Animal): Animal }\ninterface Cloner { clone(a: Sheep): Sheep }\n```",
          options: [
            "`clone(a: Sheep): Sheep`, because members from later declarations come first in the merged overload list",
            "`clone(a: Animal): Animal`, because the first declaration wins",
            "Neither: merged interfaces can't declare the same member twice",
            "`clone(a: Animal): Animal`, because overload resolution prefers the most general signature",
          ],
          correctIndex: 0,
          explanation:
            "Function members of merged interfaces become overloads, and later declarations get higher precedence, so the `Sheep` signature is tried first. Only non-function members must be unique (or identical in type).",
        },
      ],
    },
    {
      id: "ts-functions-inference",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Functions & Type Inference",
      summary:
        "TypeScript infers almost everything inside a function body. What it can't infer is a parameter's type, unless the function is contextually typed by where it's written: a callback passed to `map`, or a handler assigned to a typed property. That's why an inline `(e) => e.clientX` passed to `addEventListener(\"click\", …)` gets a `MouseEvent`, while the same arrow stored in a standalone `const` is an implicit-`any` error. Return types are inferred from every `return`, but they're worth annotating on exported functions: the signature becomes a contract instead of an accident of the implementation, errors surface inside the function rather than at call sites, and declaration emit (including `isolatedDeclarations`) doesn't have to reconstruct it.\n\nOverloads give one function several call signatures, but callers never see the implementation signature, and each call must match a single overload, so a `string | number` argument matches neither `(x: string)` nor `(x: number)`. A union parameter or a generic is usually simpler. For object literals, `satisfies` (TypeScript 4.9) checks a value against a type without widening it to that type, unlike an annotation (which forgets the specifics) or `as` (which suppresses errors, even for missing properties).\n\nAssignability has its own surprises. A function with fewer parameters is assignable to one expecting more, which is why `forEach((x) => …)` works. Excess property checks apply only to fresh object literals, so the same object passed through a variable is accepted. And `strictFunctionTypes` checks parameters contravariantly only for function-typed properties; members written in method syntax stay bivariant, a deliberate hole that keeps types like `Array<T>` covariant.",
      level: "intermediate",
      estMinutes: 90,
      webRefs: [
        { label: "TypeScript Handbook: More on Functions", url: "https://www.typescriptlang.org/docs/handbook/2/functions.html", kind: "docs" },
        { label: "TypeScript Handbook: Type Compatibility", url: "https://www.typescriptlang.org/docs/handbook/type-compatibility.html", kind: "docs" },
        { label: "TypeScript 4.9 release notes: The satisfies Operator", url: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator", kind: "docs" },
        { label: "Total TypeScript: Clarifying the satisfies Operator", url: "https://www.totaltypescript.com/clarifying-the-satisfies-operator", kind: "article" },
      ],
      video: {
        title: "Practical TypeScript – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=JHEB7RhJG1Y",
        videoId: "JHEB7RhJG1Y",
        durationLabel: "9:34:51",
        startSeconds: 3340,
        chapterLabel: "Chapter 2: Objects and Functions",
      },
      alternateVideos: [
        {
          title: "Most TS devs don't understand 'satisfies'",
          channel: "Matt Pocock",
          url: "https://www.youtube.com/watch?v=r1L35zxZQPE",
          videoId: "r1L35zxZQPE",
          durationLabel: "4:10",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-functions-inference-q1",
          prompt:
            "Which calls compile? (Select all that apply.)\n\n```ts\ninterface Opts { retries: number; verbose?: boolean }\ndeclare function run(o: Opts): void;\nconst o = { retries: 3, verbos: true };\n```",
          options: [
            "`run(o);`",
            "`run({ retries: 3, verbos: true } as Opts);`",
            "`run({ retries: 3, verbos: true });`",
            "`run({ verbos: true } as Opts);`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Excess property checks only apply to fresh object literals, so the typo is caught inline but not through `o`, which simply has an extra property. `as Opts` skips the excess check, but `as` still rejects `{ verbos: boolean }`, which doesn't overlap with `Opts` at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-functions-inference-q2",
          prompt:
            "Which lines compile? (Select all that apply.)\n\n```ts\ntype Colors = Record<\"red\" | \"green\", string | [number, number, number]>;\nconst a: Colors = { red: \"#f00\", green: [0, 255, 0] };\nconst b = { red: \"#f00\", green: [0, 255, 0] } satisfies Colors;\n```",
          options: [
            "`b.red.toUpperCase();`",
            "`b.green[0].toFixed();`",
            "`a.red.toUpperCase();`",
            "`const c = { red: \"#f00\", green: \"#0f0\", blue: \"#00f\" } satisfies Colors;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The annotation gives `a.red` the declared union `string | [number, number, number]`, so string methods aren't available. `satisfies` checks the literal against `Colors`, excess properties like `blue` included, but keeps the inferred types: `b.red` is `string` and `b.green` a tuple.",
        },
        {
          id: "ts-functions-inference-q3",
          prompt:
            "What happens on the last line?\n\n```ts\nfunction parse(x: string): number;\nfunction parse(x: number): string;\nfunction parse(x: string | number) {\n  return typeof x === \"string\" ? Number(x) : String(x);\n}\ndeclare const input: string | number;\nparse(input);\n```",
          options: [
            "Compile error: no overload matches a `string | number` argument",
            "It type-checks and returns `number | string`",
            "It falls back to the implementation signature",
            "It picks the first overload and returns `number`",
          ],
          correctIndex: 0,
          explanation:
            "The implementation signature isn't visible to callers, and a call must match one overload for the whole argument type. Add a third overload taking `string | number`, or replace the overloads with a generic or union signature.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-functions-inference-q4",
          prompt:
            "With `strict` on, what does the compiler report?\n\n```ts\ninterface WithMethod { handle(x: string | number): void }\ninterface WithProp { handle: (x: string | number) => void }\nconst onlyStrings = (x: string) => x.toUpperCase();\n\nconst a: WithMethod = { handle: onlyStrings }; // (1)\nconst b: WithProp = { handle: onlyStrings };   // (2)\n```",
          options: ["(1) compiles; (2) is an error", "Both are errors", "Both compile", "(1) is an error; (2) compiles"],
          correctIndex: 0,
          explanation:
            "`strictFunctionTypes` checks parameters contravariantly only for function-typed properties. Method-syntax members stay bivariant, so (1) is accepted even though `a.handle(42)` would crash at runtime.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-functions-inference-q5",
          prompt:
            "Given `type Cb = (a: number, b: number) => void;`, which assignments compile? (Select all that apply.)",
          options: [
            "`const c1: Cb = (a) => {};`",
            "`const c2: Cb = () => 42;`",
            "`const c3: Cb = (a, b, c) => {};`",
            "`const c4: Cb = (a: string) => {};`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Ignoring extra arguments is normal in JavaScript, so a function with fewer parameters is assignable, and a `void`-returning type accepts functions that return something. A function that needs more parameters, or has incompatible parameter types, is rejected.",
        },
        {
          id: "ts-functions-inference-q6",
          prompt:
            "What return types are inferred?\n\n```ts\nfunction one() {\n  return 1;\n}\nfunction oneOrTwo(flag: boolean) {\n  if (flag) return 1;\n  return 2;\n}\n```",
          options: [
            "`one(): number`, `oneOrTwo(): 1 | 2`",
            "`one(): 1`, `oneOrTwo(): 1 | 2`",
            "`one(): number`, `oneOrTwo(): number`",
            "`one(): 1`, `oneOrTwo(): number`",
          ],
          correctIndex: 0,
          explanation:
            "When the inferred return type is a single literal type, TypeScript widens it to its base type; a union of literal types is kept as is. Annotate the return type if you want a specific literal or the wide type.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-functions-inference-q7",
          prompt:
            "Under `strict`, what happens?\n\n```ts\nconst handler = (e) => console.log(e.clientX);                   // (1)\nwindow.addEventListener(\"click\", (e) => console.log(e.clientX)); // (2)\n```",
          options: [
            "(1) is an implicit-`any` error; in (2), `e` is contextually typed as `MouseEvent`",
            "Both infer `e: MouseEvent`",
            "Both are implicit-`any` errors",
            "(1) infers `e: Event`; (2) infers `e: MouseEvent`",
          ],
          correctIndex: 0,
          explanation:
            "Parameter types come from context. Inline, the arrow is contextually typed by the `\"click\"` overload of `addEventListener`; a standalone arrow has no context, so `noImplicitAny` flags `e`.",
        },
        {
          id: "ts-functions-inference-q8",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```ts\nfunction onClick(this: HTMLButtonElement, e: MouseEvent) {\n  return this.disabled;\n}\n```",
          options: [
            "At runtime `onClick.length` is `1`, because the `this` parameter is erased",
            "Calling `onClick(event)` directly is a compile error, because `this` would be `void`",
            "`button.addEventListener(\"click\", onClick)` type-checks when `button` is an `HTMLButtonElement`",
            "The `this` parameter makes the compiled code bind `this` automatically",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A `this` parameter is a compile-time declaration of what `this` must be; it emits nothing and binds nothing. The DOM listener types declare `this` as the element, so passing the function as a listener works, while a bare call has `this: void`.",
        },
        {
          id: "ts-functions-inference-q9",
          prompt: "Where is an explicit return type annotation genuinely valuable? (Select all that apply.)",
          options: [
            "Exported functions of a shared module, so the public signature can't change by accident",
            "Recursive functions, where inference would be circular and fall back to an implicit-`any` error",
            "Projects using `isolatedDeclarations`, which requires them on exported functions",
            "Every inline callback passed to `map` or `filter`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Annotations pay off at boundaries and where inference can't work. On inline callbacks, contextual typing already gives precise types; an explicit `: boolean` on a `filter` callback even throws away the type predicate TypeScript 5.5 would have inferred.",
        },
        {
          id: "ts-functions-inference-q10",
          prompt: "Which statement is true?\n\n```ts\nfunction f(x?: number) {}\nfunction g(x: number | undefined) {}\n```",
          options: [
            "`f()` compiles, but `g()` is an error: the argument to `g` is still required, even though it may be `undefined`",
            "Both can be called with no arguments",
            "Neither accepts `undefined` explicitly",
            "`f(undefined)` is an error under `strict`",
          ],
          correctIndex: 0,
          explanation:
            "`x?: number` makes the argument optional (its type inside the body is `number | undefined`). `x: number | undefined` only widens the type; the caller still has to pass something.",
        },
      ],
    },
    {
      id: "ts-union-intersection",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Union & Intersection Types",
      summary:
        "Think of a type as the set of values it allows. A union `A | B` holds the values in either set, so until you narrow you can only use members that every constituent has. An intersection `A & B` holds the values in both: for object types that means \"has all the properties of both\", while for disjoint primitives like `string & number` it's the empty set, `never`. The set view explains the counterintuitive results: `keyof (A | B)` is only the shared keys while `keyof (A & B)` is every key, `T | never` is `T`, and `T & unknown` is `T`. Object unions also aren't exclusive: `{ a: 1, b: 2 }` is a valid `{ a: number } | { b: number }`, so a true either/or needs `b?: never` on one side.\n\nThe most valuable union in application code is the discriminated union: object types that share a literal property such as `status`. Checking it narrows the whole object, and a `default` branch that assigns the value to `never` turns a forgotten case into a compile error. Modelling request state as `idle | loading | success | error` variants, instead of `isLoading`, `data?` and `error?` flags, makes impossible combinations (loading and failed, data without success) unrepresentable.\n\nGotchas: intersecting object types whose discriminants conflict collapses the whole type to `never`, and mixing literals with `string` (`\"sm\" | \"lg\" | string`) reduces to plain `string`, which kills autocomplete (`\"sm\" | \"lg\" | (string & {})` keeps it). And because types are erased, the exhaustive check needs a runtime `throw` as well: a server, localStorage or an older client can still send a variant your union doesn't list.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "TypeScript Handbook: Union Types", url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types", kind: "docs" },
        { label: "TypeScript Handbook: Intersection Types", url: "https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types", kind: "docs" },
        { label: "Iván Ovejero: TypeScript and Set Theory", url: "https://ivov.dev/notes/typescript-and-set-theory", kind: "article" },
        { label: "Kent C. Dodds: Stop using isLoading booleans", url: "https://kentcdodds.com/blog/stop-using-isloading-booleans", kind: "article" },
      ],
      video: {
        title: "The KEY to unions and intersections in TypeScript",
        channel: "Andrew Burgess",
        url: "https://www.youtube.com/watch?v=EsoRUqFutYU",
        videoId: "EsoRUqFutYU",
        durationLabel: "4:32",
      },
      alternateVideos: [
        {
          title: "TypeScript Exhaustive Switch: How discriminated unions make your job easier!",
          channel: "Andrew Burgess",
          url: "https://www.youtube.com/watch?v=CG3_Y9T03J4",
          videoId: "CG3_Y9T03J4",
          durationLabel: "10:20",
        },
        {
          title: "Learn TypeScript – Full Tutorial",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=30LWjhZzg50",
          videoId: "30LWjhZzg50",
          durationLabel: "4:46:25",
          startSeconds: 6603,
          chapterLabel: "Union Types in TS",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Model a fetch lifecycle as a discriminated union and implement `transition(state, event)`, a pure reducer.\n\n- States (discriminant `status`): `{ status: \"idle\" }`, `{ status: \"loading\", attempt }`, `{ status: \"success\", data }`, `{ status: \"error\", error, attempt }`.\n- Events (discriminant `type`): `FETCH`, `RESOLVE` (carries `data`), `REJECT` (carries `error`), `RETRY`, `RESET`.\n\nTransitions:\n\n- `idle` + `FETCH` gives `{ status: \"loading\", attempt: 1 }`.\n- `loading` + `RESOLVE` gives `{ status: \"success\", data }`; `loading` + `REJECT` gives `{ status: \"error\", error, attempt }`, keeping the current attempt.\n- `error` + `RETRY` gives `{ status: \"loading\", attempt: attempt + 1 }` while `attempt < MAX_ATTEMPTS` (3); at the limit, `RETRY` is ignored.\n- `success` + `FETCH` gives `{ status: \"loading\", attempt: 1 }` (a refetch).\n- `RESET` gives `{ status: \"idle\" }` from any state except `idle`.\n\nRules:\n\n- Any other known event is ignored: return the same `state` object, not a copy. React bails out of a re-render when a reducer returns the identical state.\n- Never mutate `state`; the driver freezes every state.\n- An unknown event `type` throws `Error(\"Unknown event type: <type>\")` in every state, checked before the status. This is the runtime half of an exhaustive `switch`: a `never` check can't stop a malformed event that arrives from a server or old persisted state.\n- An unknown `status` throws `Error(\"Unknown status: <status>\")`.\n\nThe tests call `runMachine(events, initialState)`, which applies the events in order and returns `{ final, ignored }` (`ignored` counts events that returned the same object), or `{ error, processed }` if `transition` throws. Leave the driver as it is.",
        starterCode:
          "/**\n * @typedef {{ status: \"idle\" }\n *   | { status: \"loading\", attempt: number }\n *   | { status: \"success\", data: unknown }\n *   | { status: \"error\", error: string, attempt: number }} State\n * @typedef {{ type: \"FETCH\" }\n *   | { type: \"RESOLVE\", data: unknown }\n *   | { type: \"REJECT\", error: string }\n *   | { type: \"RETRY\" }\n *   | { type: \"RESET\" }} MachineEvent\n */\n\nconst MAX_ATTEMPTS = 3;\n\n/**\n * @param {State} state\n * @param {MachineEvent} event\n * @returns {State}\n */\nfunction transition(state, event) {\n  // Your code here\n  return state;\n}\n\n// ---- Test driver (leave as is) ----\nfunction runMachine(events, initial = { status: \"idle\" }) {\n  let state = Object.freeze({ ...initial });\n  let ignored = 0;\n  for (let i = 0; i < events.length; i++) {\n    let next;\n    try {\n      next = transition(state, events[i]);\n    } catch (e) {\n      return { error: e instanceof Error ? e.message : String(e), processed: i };\n    }\n    if (next === state) ignored++;\n    state = Object.freeze(next);\n  }\n  return { final: state, ignored };\n}\n",
        functionName: "runMachine",
        testCases: [
          {
            description: "fetch then resolve ends in success",
            args: [[{ type: "FETCH" }, { type: "RESOLVE", data: { id: 1 } }]],
            expected: { final: { status: "success", data: { id: 1 } }, ignored: 0 },
          },
          {
            description: "a rejected fetch can be retried and then succeed",
            args: [[{ type: "FETCH" }, { type: "REJECT", error: "timeout" }, { type: "RETRY" }, { type: "RESOLVE", data: "ok" }]],
            expected: { final: { status: "success", data: "ok" }, ignored: 0 },
          },
          {
            description: "RETRY is ignored once 3 attempts have failed",
            args: [
              [
                { type: "FETCH" },
                { type: "REJECT", error: "e1" },
                { type: "RETRY" },
                { type: "REJECT", error: "e2" },
                { type: "RETRY" },
                { type: "REJECT", error: "e3" },
                { type: "RETRY" },
              ],
            ],
            expected: { final: { status: "error", error: "e3", attempt: 3 }, ignored: 1 },
            isEdgeCase: true,
          },
          {
            description: "known events a state doesn't handle return the same state object",
            args: [[{ type: "RESOLVE", data: 1 }, { type: "RETRY" }, { type: "FETCH" }, { type: "FETCH" }, { type: "REJECT", error: "x" }]],
            expected: { final: { status: "error", error: "x", attempt: 1 }, ignored: 3 },
          },
          {
            description: "FETCH from success starts a fresh first attempt",
            args: [[{ type: "FETCH" }, { type: "RESOLVE", data: [1, 2] }, { type: "FETCH" }]],
            expected: { final: { status: "loading", attempt: 1 }, ignored: 0 },
          },
          {
            description: "RESET returns to idle from anywhere, and is ignored when already idle",
            args: [[{ type: "RESET" }, { type: "FETCH" }, { type: "RESET" }, { type: "FETCH" }, { type: "REJECT", error: "x" }, { type: "RESET" }]],
            expected: { final: { status: "idle" }, ignored: 1 },
          },
          {
            description: "an unknown event type throws even in a state that ignores unhandled events",
            args: [[{ type: "FETCH" }, { type: "RESOLVE", data: 1 }, { type: "CANCEL" }]],
            expected: { error: "Unknown event type: CANCEL", processed: 2 },
            isEdgeCase: true,
          },
          {
            description: "event types are case-sensitive",
            args: [[{ type: "fetch" }]],
            expected: { error: "Unknown event type: fetch", processed: 0 },
            isEdgeCase: true,
          },
          {
            description: "an unknown status (e.g. corrupted persisted state) throws",
            args: [[{ type: "FETCH" }], { status: "paused" }],
            expected: { error: "Unknown status: paused", processed: 0 },
            isEdgeCase: true,
          },
          {
            description: "no events leaves the initial state untouched",
            args: [[]],
            expected: { final: { status: "idle" }, ignored: 0 },
            isEdgeCase: true,
          },
          {
            description: "resuming from a persisted error state respects the attempt limit",
            args: [[{ type: "RETRY" }, { type: "REJECT", error: "new" }, { type: "RETRY" }], { status: "error", error: "old", attempt: 2 }],
            expected: { final: { status: "error", error: "new", attempt: 3 }, ignored: 1 },
            isEdgeCase: true,
          },
          {
            description: "1,000 events (500 fetch/resolve cycles) then a reset",
            args: [
              [
                ...Array.from({ length: 500 }, (_, i) => [{ type: "FETCH" }, { type: "RESOLVE", data: i }]).flat(),
                { type: "RESET" },
              ],
            ],
            expected: { final: { status: "idle" }, ignored: 0 },
          },
        ],
      },
    },
    {
      id: "ts-narrowing-type-guards",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Narrowing & Type Guards",
      summary:
        "Narrowing is TypeScript's control-flow analysis: after `typeof x === \"string\"`, a truthiness check, `===`, `in`, `instanceof`, `Array.isArray` or a discriminant check, the variable has a narrower type inside that branch. The built-in guards inherit JavaScript's quirks: `typeof null === \"object\"`, truthiness also discards `0` and `\"\"`, and `instanceof` fails across realms (an array from an iframe, or two copies of a class from a duplicated package).\n\nFor anything the built-ins can't express you write a type predicate (`(x: unknown): x is User`) or an assertion function (`asserts x is User`). Both are unchecked promises: TypeScript trusts the body completely, so a guard that only checks `\"id\" in x` makes every later `x.name` look safe when it isn't. Since TypeScript 5.5, simple predicates are inferred, which is why `.filter((x) => x !== undefined)` now narrows the array, while a `!!x` filter doesn't (it also drops `0`). Assertion functions only narrow when called through an explicitly typed name; calling an arrow stored in an unannotated `const` is error TS2775.\n\nNarrowing is fragile over time, too. Inside a callback, a narrowed `let` or parameter is widened again if it's reassigned anywhere after the callback is created (TypeScript 5.4 keeps the narrowing otherwise), while a narrowed property survives intervening function calls that could have changed it: a deliberate unsoundness for usability. The architectural lesson matters most: types vanish at runtime, so every boundary (`JSON.parse`, `fetch`, `localStorage`, `postMessage`, environment variables) needs real validation. Parse untrusted data into a typed value once, at the edge, by hand or with a schema library such as Zod that infers the type from the validator, and let the types carry that guarantee inward.",
      level: "advanced",
      estMinutes: 90,
      isMilestone: true,
      webRefs: [
        { label: "TypeScript Handbook: Narrowing", url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html", kind: "docs" },
        { label: "TypeScript 5.5 release notes: Inferred Type Predicates", url: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#inferred-type-predicates", kind: "docs" },
        { label: "Alexis King: Parse, don't validate", url: "https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/", kind: "article" },
        { label: "Zod documentation", url: "https://zod.dev/", kind: "docs" },
      ],
      video: {
        title: "Practical TypeScript – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=JHEB7RhJG1Y",
        videoId: "JHEB7RhJG1Y",
        durationLabel: "9:34:51",
        startSeconds: 14350,
        chapterLabel: "Chapter 5: Type Guards",
      },
      alternateVideos: [
        {
          title: "Learn TypeScript – Full Tutorial",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=30LWjhZzg50",
          videoId: "30LWjhZzg50",
          durationLabel: "4:46:25",
          startSeconds: 14836,
          chapterLabel: "Type Narrowing",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `validate(value, schema)`, a runtime type guard for untrusted data such as a `JSON.parse` result. It returns an array of error messages, empty when `value` matches, so the same function can back an `isUser(x): x is User` guard and a useful error report.\n\nSchemas are plain data:\n\n- `\"string\"`, `\"boolean\"`, `\"null\"` or `\"number\"`: a primitive. `\"number\"` accepts only finite numbers (`typeof NaN` is `\"number\"` too).\n- `{ arrayOf: schema }`: an array whose every element matches `schema`.\n- `{ object: { key: schema, ... }, optional: [\"key\"] }`: a non-null, non-array object. Every listed key is required unless it's in `optional` (which may be omitted). A key only counts as present if it's an own property. Extra keys are allowed, as with TypeScript's structural typing.\n- `{ oneOf: [literal, ...] }`: the value must be `===` to one of the listed strings, numbers, booleans or `null`.\n\nEach error is `\"<path>: <problem>\"`. The path starts at `$` and appends `.key` for properties and `[i]` for array indexes. Problems:\n\n- wrong type: `expected <kind>`, where kind is the primitive name, `array` or `object`\n- missing required key: `is required`\n- no literal matched: `expected one of <values>`, the values as `JSON.stringify` output joined by `\" | \"`, e.g. `$.role: expected one of \"admin\" | \"user\"`\n\nReport every error in schema order (an object's keys in the order the schema lists them, array elements by index), but don't descend into a value whose own type is wrong.",
        starterCode:
          "/**\n * @typedef {\"string\" | \"number\" | \"boolean\" | \"null\"\n *   | { arrayOf: Schema }\n *   | { object: Record<string, Schema>, optional?: string[] }\n *   | { oneOf: (string | number | boolean | null)[] }} Schema\n */\n\n/**\n * Validates untrusted data (e.g. the result of JSON.parse) against a schema.\n * @param {unknown} value\n * @param {Schema} schema\n * @returns {string[]} error messages; empty when value matches\n */\nfunction validate(value, schema) {\n  // Your code here\n  return [];\n}\n",
        functionName: "validate",
        testCases: [
          { description: "a valid nested user has no errors", args: [tsValidUser, tsUserSchema], expected: [] },
          {
            description: "a wrong type deep inside reports the full path",
            args: [{ ...tsValidUser, address: { city: 42 } }, tsUserSchema],
            expected: ["$.address.city: expected string"],
          },
          {
            description: "a missing required key is reported; an absent optional key is fine",
            args: [{ id: 7, role: "user", tags: [], address: { city: "Paris" } }, tsUserSchema],
            expected: ["$.name: is required"],
          },
          {
            description: "every bad array element is reported with its index",
            args: [{ ...tsValidUser, tags: ["a", 1, "b", false] }, tsUserSchema],
            expected: ["$.tags[1]: expected string", "$.tags[3]: expected string"],
          },
          {
            description: "a literal mismatch lists the allowed values",
            args: [{ ...tsValidUser, role: "owner" }, tsUserSchema],
            expected: ["$.role: expected one of \"admin\" | \"user\""],
          },
          {
            description: "several errors come out in schema order",
            args: [{ id: "7", name: "Ada", role: "owner", tags: "x", address: { city: "Oslo" } }, tsUserSchema],
            expected: ["$.id: expected number", "$.role: expected one of \"admin\" | \"user\"", "$.tags: expected array"],
          },
          {
            description: "objects nested in arrays get combined paths",
            args: [{ items: [{ qty: 1 }, { qty: "2" }, {}] }, { object: { items: { arrayOf: { object: { qty: "number" } } } } }],
            expected: ["$.items[1].qty: expected number", "$.items[2].qty: is required"],
          },
          {
            description: "null is not an object, even though typeof null === \"object\"",
            args: [null, tsUserSchema],
            expected: ["$: expected object"],
            isEdgeCase: true,
          },
          {
            description: "an array is not an object",
            args: [[], { object: {} }],
            expected: ["$: expected object"],
            isEdgeCase: true,
          },
          {
            description: "NaN and Infinity are not valid numbers",
            args: [[1, NaN, Infinity], { arrayOf: "number" }],
            expected: ["$[1]: expected number", "$[2]: expected number"],
            isEdgeCase: true,
          },
          {
            description: "inherited keys such as constructor don't count as present",
            args: [{}, { object: { constructor: "string" } }],
            expected: ["$.constructor: is required"],
            isEdgeCase: true,
          },
          {
            description: "extra keys are allowed (structural typing)",
            args: [{ id: 1, extra: true }, { object: { id: "number" } }],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "\"null\" matches only null, and oneOf can include null",
            args: [{ a: null, b: null, c: 0 }, { object: { a: "null", b: { oneOf: ["x", null] }, c: "null" } }],
            expected: ["$.c: expected null"],
            isEdgeCase: true,
          },
          {
            description: "a wrong top-level type isn't descended into",
            args: ["hello", { arrayOf: "string" }],
            expected: ["$: expected array"],
          },
        ],
      },
    },
    {
      id: "ts-generics-fundamentals",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Generics Fundamentals",
      summary:
        "Generics let one function or type keep the relationship between its inputs and outputs. `identity<T>(x: T): T` says the result is whatever came in, which neither `any` (no checking) nor `unknown` (nothing useful comes back out) can express. A type parameter earns its place only when it links two or more positions: a parameter to the return type, one parameter to another, or a property to a method. The handbook's rule of thumb is that it should appear at least twice; `len<T>(xs: T[]): number` gains nothing over `(xs: unknown[]) => number`.\n\nCallers rarely pass type arguments, because TypeScript infers them. It collects a candidate from every position that mentions `T`, then decides whether to keep literal types: `const a = identity(\"hi\")` is `\"hi\"`, but `let b = identity(\"hi\")` widens to `string`. When candidates share no common supertype (`pick(1, \"one\")` for `pick<T>(a: T, b: T)`), it reports an error rather than inventing a union. When a position shouldn't drive inference at all, such as a default that ought to be checked against the other arguments, wrap it in `NoInfer<T>` (TypeScript 5.4). And there's no partial inference: pass one type argument explicitly and every other parameter needs a default.\n\nGeneric types (`Box<T>`, `Promise<T>`, `Map<K, V>`) are type-level functions evaluated at each use, and a generic class can't mention its type parameter in static members, since statics exist once per class rather than per instantiation. Generics are erased, so a function can't branch on `T` at runtime: if behaviour depends on the type, pass a value that carries it (a schema, a constructor, a key), which is how validation libraries infer types from schemas. In `.tsx` files, write `<T,>(x: T) => x`; otherwise the parser reads `<T>` as a JSX tag.",
      level: "intermediate",
      estMinutes: 70,
      webRefs: [
        { label: "TypeScript Handbook: Generics", url: "https://www.typescriptlang.org/docs/handbook/2/generics.html", kind: "docs" },
        {
          label: "TypeScript Handbook: Guidelines for Writing Good Generic Functions",
          url: "https://www.typescriptlang.org/docs/handbook/2/functions.html#guidelines-for-writing-good-generic-functions",
          kind: "docs",
        },
        { label: "Total TypeScript: Building the Mental Model for Generics", url: "https://www.totaltypescript.com/mental-model-for-typescript-generics", kind: "article" },
        { label: "TypeScript 5.4 release notes: The NoInfer Utility Type", url: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#the-noinfer-utility-type", kind: "docs" },
      ],
      video: {
        title: "Practical TypeScript – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=JHEB7RhJG1Y",
        videoId: "JHEB7RhJG1Y",
        durationLabel: "9:34:51",
        startSeconds: 16262,
        chapterLabel: "Chapter 6: Generics",
      },
      alternateVideos: [
        {
          title: "Learn TypeScript Generics In 13 Minutes",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=EcCTIExsqmI",
          videoId: "EcCTIExsqmI",
          durationLabel: "12:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-generics-fundamentals-q1",
          prompt:
            "What are the types of `a`, `b` and `c`?\n\n```ts\nfunction identity<T>(x: T): T {\n  return x;\n}\nconst a = identity(\"hi\");\nlet b = identity(\"hi\");\nconst c = identity([\"hi\"]);\n```",
          options: [
            "`a: \"hi\"`, `b: string`, `c: string[]`",
            "`a: string`, `b: string`, `c: string[]`",
            "`a: \"hi\"`, `b: \"hi\"`, `c: \"hi\"[]`",
            "`a: \"hi\"`, `b: string`, `c: [\"hi\"]`",
          ],
          correctIndex: 0,
          explanation:
            "`T` is inferred as the literal `\"hi\"`, which a `const` keeps and a `let` widens, exactly as with a plain literal. The array literal's element type is widened to `string` before `T` is inferred, so `c` is `string[]`, not a tuple.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-generics-fundamentals-q2",
          prompt: "Which function's type parameter is pointless, in that removing it loses no type information?",
          options: [
            "`function len<T>(xs: T[]): number { return xs.length; }`",
            "`function first<T>(xs: T[]): T | undefined { return xs[0]; }`",
            "`function pair<A, B>(a: A, b: B): [A, B] { return [a, b]; }`",
            "`function merge<T extends object>(a: T, b: Partial<T>): T { return { ...a, ...b }; }`",
          ],
          correctIndex: 0,
          explanation:
            "In `len`, `T` appears once, so it links nothing: `(xs: unknown[]) => number` is equivalent. The others use each type parameter to connect an input to the output or to another input.",
        },
        {
          id: "ts-generics-fundamentals-q3",
          prompt:
            "Why is the marked line an error?\n\n```ts\nclass Registry<T> {\n  private items: T[] = [];\n  static fallback: T; // error\n  add(item: T) {\n    this.items.push(item);\n  }\n}\n```",
          options: [
            "Static members exist once per class, not once per instantiation, so they can't reference the class's type parameters",
            "Static properties must be initialized when they're declared",
            "Static members need their own `<T>` declaration, like a generic method",
            "`T` must be constrained before a static member can use it",
          ],
          correctIndex: 0,
          explanation:
            "`Registry<string>` and `Registry<number>` share the same `Registry.fallback`, so its type can't depend on `T`. Pass the value per instance, or give a static method its own type parameter.",
        },
        {
          id: "ts-generics-fundamentals-q4",
          prompt:
            "Why doesn't this compile?\n\n```ts\nfunction make<T extends { id: string }>(): T {\n  return { id: \"x\" };\n}\n```",
          options: [
            "`T` could be instantiated with a subtype that has more required properties, so `{ id: \"x\" }` isn't necessarily a `T`",
            "A generic function must take at least one parameter of type `T`",
            "A return type can't be a bare type parameter",
            "The constraint must mark `id` as `readonly`",
          ],
          correctIndex: 0,
          explanation:
            "The constraint only says what `T` is at least; a caller could write `make<{ id: string; name: string }>()`. Writing `return { id: \"x\" } as T` silences the error but moves the lie to every caller.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-generics-fundamentals-q5",
          prompt:
            "This compiles, with `C` inferred as `\"red\" | \"yellow\" | \"green\" | \"blue\"`. Which changes make `\"blue\"` an error? (Select all that apply.)\n\n```ts\nfunction createLight<C extends string>(colors: C[], defaultColor?: C) {}\ncreateLight([\"red\", \"yellow\", \"green\"], \"blue\");\n```",
          options: [
            "Declare the second parameter as `defaultColor?: NoInfer<C>`",
            "Add a second type parameter: `<C extends string, D extends C>(colors: C[], defaultColor?: D)`",
            "Change the constraint to `C extends string | number`",
            "Annotate the function's return type as `void`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Every position mentioning `C` is an inference site, so `\"blue\"` joins the union. `NoInfer<C>` (TypeScript 5.4) removes that position from inference; the older workaround is a second type parameter constrained by the first, so `D` is checked against the already-inferred `C`.",
        },
        {
          id: "ts-generics-fundamentals-q6",
          prompt:
            "Inside `function parse<T>(input: unknown): T`, why can't you write `if (input instanceof T)` or otherwise check `T` at runtime?",
          options: [
            "`T` is erased during compilation, so there's no runtime value to test; the caller must pass something runtime-visible, like a constructor or a schema",
            "`instanceof` only works with interfaces",
            "It works, but only when `T` is constrained to a class type",
            "Type parameters only exist in `.d.ts` files",
          ],
          correctIndex: 0,
          explanation:
            "The compiler reports that `T` only refers to a type but is being used as a value. That's why schema libraries take a validator value and derive the static type from it, rather than the other way round.",
        },
        {
          id: "ts-generics-fundamentals-q7",
          prompt: "In a `.tsx` file, which of these generic function declarations parse correctly? (Select all that apply.)",
          options: [
            "`const id = <T,>(x: T) => x;`",
            "`const id = <T extends unknown>(x: T) => x;`",
            "`function id<T>(x: T) { return x; }`",
            "`const id = <T>(x: T) => x;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "In TSX, `<T>` at the start of an arrow function looks like a JSX opening tag. A trailing comma or an `extends` clause disambiguates it, and function declarations aren't affected.",
        },
        {
          id: "ts-generics-fundamentals-q8",
          prompt:
            "What happens?\n\n```ts\nfunction pickOne<T>(a: T, b: T): T {\n  return Math.random() > 0.5 ? a : b;\n}\npickOne(1, \"one\");\n```",
          options: [
            "Compile error: `T` is fixed from the first argument (as `1`), and `\"one\"` isn't assignable to it",
            "`T` is inferred as `string | number`",
            "`T` is inferred as `unknown`",
            "`T` is inferred as `1 | \"one\"`",
          ],
          correctIndex: 0,
          explanation:
            "When the candidates share no common supertype, TypeScript doesn't synthesize a union; it settles on the first candidate and reports the other argument (\"Argument of type '\"one\"' is not assignable to parameter of type '1'\"). Write `pickOne<string | number>(1, \"one\")` if a union is really intended.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-generics-fundamentals-q9",
          prompt:
            "What happens?\n\n```ts\nfunction tuple<A, B>(a: A, b: B): [A, B] {\n  return [a, b];\n}\ntuple<string>(\"x\", 1);\n```",
          options: [
            "Compile error: expected 2 type arguments, because there's no partial type-argument inference",
            "`B` is inferred as `number` from the argument",
            "`B` falls back to `unknown`",
            "`B` is set to `string` as well",
          ],
          correctIndex: 0,
          explanation:
            "Once you pass any type argument explicitly, every type parameter without a default must be supplied too; none are inferred. Give `B` a default, or curry the function (`tuple<string>()(\"x\", 1)`) so the second call can infer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-generics-fundamentals-q10",
          prompt:
            "What are the types of `a` and `b`?\n\n```ts\ndeclare function withConst<const T extends readonly string[]>(xs: T): T;\ndeclare function withoutConst<T extends readonly string[]>(xs: T): T;\nconst a = withConst([\"x\", \"y\"]);\nconst b = withoutConst([\"x\", \"y\"]);\n```",
          options: [
            "`a: readonly [\"x\", \"y\"]`, `b: string[]`",
            "Both are `readonly [\"x\", \"y\"]`",
            "Both are `string[]`",
            "`a: [\"x\", \"y\"]`, `b: readonly string[]`",
          ],
          correctIndex: 0,
          explanation:
            "A `const` type parameter (TypeScript 5.0) infers the argument as if it were written with `as const`, giving a readonly tuple of literals. Without it, the array literal is inferred normally as `string[]`, which satisfies the `readonly string[]` constraint.",
        },
      ],
    },
    {
      id: "ts-generic-constraints-defaults",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Generic Constraints & Defaults",
      summary:
        "A constraint (`T extends Shape`) does two jobs: it rejects bad type arguments at the call site, and it tells the function body what it may assume about `T`. The canonical example is `function get<T, K extends keyof T>(obj: T, key: K): T[K]`. `K` is tied to `T`, and the indexed-access return type tracks exactly which key was passed, so `get(user, \"id\")` returns `number` and `get(user, \"nope\")` doesn't compile. Constraints also steer inference: with `T extends string`, a literal argument stays a literal even when the result lands in a `let`, and the `const` modifier (TypeScript 5.0) infers arguments as if they were written with `as const`.\n\nDefaults (`<T, E = Error>`) apply when a type argument is neither passed nor inferable. Parameters with defaults must come after required ones, and a default must satisfy its own constraint. Because TypeScript has no partial type-argument inference, a caller who passes one argument explicitly gets defaults, not inference, for the rest; that's why libraries expose curried helpers such as `create<State>()(…)`.\n\nA constraint says what `T` is at least, not what it exactly is. Inside `function f<T extends { id: string }>(x: T)`, returning a fresh `{ id: \"new\" }` as `T` is an error, since the caller may have chosen a `T` with more properties. The runtime twin of `Pick<T, K>` hides similar traps, which is what this challenge is about: `keyof T` promises keys that can be missing at runtime, `key in obj` also finds inherited properties like `toString`, and copying an untrusted `\"__proto__\"` key with `out[key] = value` replaces the result's prototype instead of creating a property.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "TypeScript Handbook: Generic Constraints", url: "https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints", kind: "docs" },
        { label: "TypeScript Handbook: Keyof Type Operator", url: "https://www.typescriptlang.org/docs/handbook/2/keyof-types.html", kind: "docs" },
        { label: "Total TypeScript: Const type parameters bring 'as const' to functions", url: "https://www.totaltypescript.com/const-type-parameters", kind: "article" },
        { label: "MDN: Object.prototype.__proto__", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto", kind: "docs" },
      ],
      video: {
        title: "Generics: The most intimidating TypeScript feature",
        channel: "Matt Pocock",
        url: "https://www.youtube.com/watch?v=dLPgQRbVquo",
        videoId: "dLPgQRbVquo",
        durationLabel: "18:19",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `pick` and `omit`, the runtime twins of `Pick<T, K>` and `Omit<T, K>`. Typed, they'd be `pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>` and the same shape for `omit`; the constraint `K extends keyof T` is what makes `pick(user, [\"nope\"])` a compile error. Your job is the part the types can't guarantee at runtime.\n\n- `pick(obj, keys)` returns a new object with the listed keys that are own properties of `obj`, in the order of `keys`. Keys that are missing, or only inherited (like `toString`), are skipped rather than set to `undefined`. A present key whose value is `undefined` is kept.\n- `omit(obj, keys)` returns a new object with every own enumerable property of `obj` except the listed keys, in `obj`'s order. Listed keys that aren't present are ignored.\n- Never mutate `obj`. Copy shallowly: nested objects are shared, matching the types' shallow semantics.\n- Treat keys as untrusted. `JSON.parse` can produce an own property named `\"__proto__\"`; it must stay an ordinary own property of the result, but `result[key] = value` would replace the result's prototype instead. And don't call `obj.hasOwnProperty(...)`: `obj` may have an own key with that name.\n\nThe tests call `runPickOmit(op, obj, keys)`, which reports the result's entries, whether its prototype is still `Object.prototype`, whether its values are the same references as in `obj`, and whether `obj` was left unchanged. Leave the driver as it is.",
        starterCode:
          "/**\n * Runtime twin of TypeScript's Pick<T, K>.\n * @template {object} T\n * @template {keyof T} K\n * @param {T} obj\n * @param {readonly K[]} keys\n * @returns {Pick<T, K>}\n */\nfunction pick(obj, keys) {\n  // Your code here\n}\n\n/**\n * Runtime twin of TypeScript's Omit<T, K>.\n * @template {object} T\n * @template {keyof T} K\n * @param {T} obj\n * @param {readonly K[]} keys\n * @returns {Omit<T, K>}\n */\nfunction omit(obj, keys) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction runPickOmit(op, obj, keys) {\n  const before = Object.entries(obj);\n  const result = op === \"pick\" ? pick(obj, keys) : omit(obj, keys);\n  const after = Object.entries(obj);\n  return {\n    entries: Object.entries(result),\n    plainPrototype: Object.getPrototypeOf(result) === Object.prototype,\n    sharesValues: Object.keys(result).every((k) => Object.is(result[k], obj[k])),\n    inputUnchanged: after.length === before.length && after.every(([k, v], i) => k === before[i][0] && Object.is(v, before[i][1])),\n  };\n}\n",
        functionName: "runPickOmit",
        testCases: [
          {
            description: "pick keeps only the listed keys, in the order of keys",
            args: ["pick", { id: 1, name: "Ada", email: "a@x.io" }, ["email", "id"]],
            expected: { entries: [["email", "a@x.io"], ["id", 1]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
          },
          {
            description: "omit drops the listed keys and keeps obj's order, without mutating obj",
            args: ["omit", { id: 1, name: "Ada", email: "a@x.io", role: "admin" }, ["email"]],
            expected: { entries: [["id", 1], ["name", "Ada"], ["role", "admin"]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
          },
          {
            description: "pick skips keys that are missing at runtime",
            args: ["pick", { id: 1 }, ["id", "name"]],
            expected: { entries: [["id", 1]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
          },
          {
            description: "omit ignores listed keys that aren't present",
            args: ["omit", { a: 1, b: 2 }, ["c", "a"]],
            expected: { entries: [["b", 2]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
          },
          {
            description: "a present key whose value is undefined is kept",
            args: ["pick", { a: undefined, b: 2 }, ["a"]],
            expected: { entries: [["a", undefined]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "inherited properties such as toString are not picked",
            args: ["pick", { a: 1 }, ["toString", "a"]],
            expected: { entries: [["a", 1]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "an own key named hasOwnProperty doesn't break the own-property check",
            args: ["pick", { hasOwnProperty: 1, a: 2 }, ["a", "hasOwnProperty"]],
            expected: { entries: [["a", 2], ["hasOwnProperty", 1]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "pick copies an untrusted __proto__ key as an own property, leaving the prototype alone",
            args: ["pick", { ["__proto__"]: { admin: true }, id: 1 }, ["__proto__", "id"]],
            expected: { entries: [["__proto__", { admin: true }], ["id", 1]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "omit keeps an untrusted __proto__ key as an own property too",
            args: ["omit", { ["__proto__"]: { admin: true }, id: 1 }, ["id"]],
            expected: { entries: [["__proto__", { admin: true }]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "nested objects are shared, not cloned",
            args: ["pick", { user: { name: "Ada" }, n: 1 }, ["user"]],
            expected: { entries: [["user", { name: "Ada" }]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
          },
          {
            description: "an empty key list: pick returns {}",
            args: ["pick", { a: 1 }, []],
            expected: { entries: [], plainPrototype: true, sharesValues: true, inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "an empty key list: omit returns a copy",
            args: ["omit", { a: 1 }, []],
            expected: { entries: [["a", 1]], plainPrototype: true, sharesValues: true, inputUnchanged: true },
            isEdgeCase: true,
          },
          {
            description: "omitting 500 of 1,000 keys",
            args: [
              "omit",
              Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`k${i}`, i])),
              Array.from({ length: 500 }, (_, i) => `k${i * 2}`),
            ],
            expected: {
              entries: Array.from({ length: 500 }, (_, i) => [`k${i * 2 + 1}`, i * 2 + 1]),
              plainPrototype: true,
              sharesValues: true,
              inputUnchanged: true,
            },
          },
        ],
      },
    },
    {
      id: "ts-utility-types",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Utility Types (Partial, Pick, Omit, Record…)",
      summary:
        "The built-in utility types are ordinary aliases in `lib.es5.d.ts`, and their one-line definitions predict their edge cases. `Partial`, `Required`, `Readonly`, `Pick` and `Record` are mapped types; `Exclude`, `Extract`, `Parameters`, `ReturnType`, `InstanceType` and `Awaited` are conditional types (the first two distribute over unions); `NonNullable<T>` is simply `T & {}`.\n\nThat explains the classic surprises. `Partial` and `Readonly` are shallow: nested objects stay required and mutable. `Omit<T, K>` is `Pick<T, Exclude<keyof T, K>>` with `K extends keyof any`, so a misspelled key compiles silently, and because `keyof` a union is only the shared keys, `Omit` on a discriminated union collapses it to its common properties; `T extends unknown ? Omit<T, K> : never` applies it per variant instead. `Exclude` and `Extract` filter union members, not object properties, so `Exclude<{ a: 1; b: 2 }, \"a\">` changes nothing. `Record<string, T>` claims every key exists, so `record[k]` is `T` rather than `T | undefined` unless `noUncheckedIndexedAccess` is on, while `Record<\"a\" | \"b\", T>` requires both keys, which makes it a cheap exhaustiveness check for lookup tables.\n\nThe function helpers read types off values: `ReturnType<typeof fn>` needs `typeof` because it takes a type, and on an overloaded function it only sees the last signature. `Awaited<T>` recursively unwraps promise-likes the way `await` does. The broader habit is to derive types from one source of truth (a const object via `keyof typeof`, a function's return type, a schema) instead of maintaining parallel declarations that drift apart.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "TypeScript Handbook: Utility Types", url: "https://www.typescriptlang.org/docs/handbook/utility-types.html", kind: "docs" },
        { label: "Total TypeScript Essentials: Deriving Types", url: "https://www.totaltypescript.com/books/total-typescript-essentials/deriving-types", kind: "article" },
        { label: "TypeScript source: lib.es5.d.ts (utility type definitions)", url: "https://github.com/microsoft/TypeScript/blob/main/tsc/internal/bundled/libs/lib.es5.d.ts", kind: "repo" },
        { label: "type-challenges: TypeScript type challenges", url: "https://github.com/type-challenges/type-challenges", kind: "repo" },
      ],
      video: {
        title: "You are a Junior Dev if You Don’t Know These 18 TypeScript Utility Types",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=BhNSauna0eo",
        videoId: "BhNSauna0eo",
        durationLabel: "22:09",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-utility-types-q1",
          prompt: "Which of these resolve as described? (Select all that apply.)",
          options: [
            "`Exclude<\"a\" | \"b\" | \"c\", \"a\" | \"c\">` is `\"b\"`",
            "`Extract<string | number | (() => void), Function>` is `() => void`",
            "`NonNullable<string | null | undefined>` is `string`",
            "`Exclude<{ a: 1; b: 2 }, \"a\">` is `{ b: 2 }`",
            "`Extract<\"a\" | \"b\", string>` is `never`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`Exclude` and `Extract` distribute over union members and keep or drop each one. They don't touch object properties, so `Exclude<{ a: 1; b: 2 }, \"a\">` returns the object type unchanged (that's `Omit`'s job), and every member of `\"a\" | \"b\"` extends `string`, so `Extract` keeps both.",
        },
        {
          id: "ts-utility-types-q2",
          prompt:
            "What is `NoId`?\n\n```ts\ntype Shape =\n  | { kind: \"circle\"; radius: number; id: string }\n  | { kind: \"square\"; size: number; id: string };\ntype NoId = Omit<Shape, \"id\">;\n```",
          options: [
            "`{ kind: \"circle\" | \"square\" }`",
            "`{ kind: \"circle\"; radius: number } | { kind: \"square\"; size: number }`",
            "`never`, because the variants conflict",
            "A compile error, because `Omit` doesn't accept unions",
          ],
          correctIndex: 0,
          explanation:
            "`Omit` isn't distributive: it computes `keyof Shape`, which for a union is only the shared keys (`kind | id`), then picks `kind` from the whole union. A distributive version, `T extends unknown ? Omit<T, K> : never`, preserves each variant.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-utility-types-q3",
          prompt:
            "What happens with this typo?\n\n```ts\ninterface User { id: number; email: string; password: string }\ntype PublicUser = Omit<User, \"pasword\">;\n```",
          options: [
            "It compiles, and `PublicUser` still includes `password`",
            "Compile error: `\"pasword\"` isn't a key of `User`",
            "It compiles, and `PublicUser` is `{}`",
            "It compiles, and `password` becomes optional",
          ],
          correctIndex: 0,
          explanation:
            "`Omit`'s key parameter is constrained to `keyof any`, so any string is accepted and a typo silently removes nothing. `Pick` uses `K extends keyof T` and would catch it; `type StrictOmit<T, K extends keyof T> = Omit<T, K>` does the same for omitting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-utility-types-q4",
          prompt:
            "Which lines compile? (Select all that apply.)\n\n```ts\ninterface Config {\n  server: { port: number; host: string };\n  debug: boolean;\n}\ndeclare const frozen: Readonly<Config>;\n```",
          options: [
            "`const p: Partial<Config> = { server: { port: 8080, host: \"x\" } };`",
            "`frozen.server.port = 9000;`",
            "`const q: Partial<Config> = { server: { port: 8080 } };`",
            "`frozen.debug = true;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`Partial` and `Readonly` only change top-level properties. `server` may be omitted, but if present it needs both fields; `frozen.debug` is readonly, while `frozen.server.port` is still writable.",
        },
        {
          id: "ts-utility-types-q5",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```ts\nfunction createUser(name: string, age?: number) {\n  return { id: Math.random().toString(36), name, age };\n}\n```",
          options: [
            "`ReturnType<typeof createUser>` is `{ id: string; name: string; age: number | undefined }`",
            "`Parameters<typeof createUser>` is `[name: string, age?: number]`",
            "`ReturnType<createUser>` works without `typeof`",
            "`Parameters<typeof createUser>[1]` is `number`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The helpers take types, so a function value needs `typeof`. The optional parameter shows up as an optional tuple element, and indexing it gives `number | undefined`.",
        },
        {
          id: "ts-utility-types-q6",
          prompt:
            "What is `R`?\n\n```ts\nfunction parse(x: string): number;\nfunction parse(x: number): string;\nfunction parse(x: string | number) {\n  return typeof x === \"string\" ? Number(x) : String(x);\n}\ntype R = ReturnType<typeof parse>;\n```",
          options: ["`string`", "`number`", "`number | string`", "`never`"],
          correctIndex: 0,
          explanation:
            "Inferring from an overloaded function (as `ReturnType` and `Parameters` do with `infer`) uses the last overload signature, here `(x: number): string`. The implementation signature isn't part of the type at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-utility-types-q7",
          prompt: "Which statements about `Awaited` are true? (Select all that apply.)",
          options: [
            "`Awaited<Promise<Promise<number>>>` is `number`",
            "`Awaited<string>` is `string`",
            "`Awaited<Promise<number> | string>` is `number | string`",
            "`ReturnType<() => Promise<number>>` is `number`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`Awaited` mirrors `await`: it recursively unwraps promise-likes, leaves other types alone and distributes over unions. `ReturnType` of an async function is still the `Promise`, so you'd write `Awaited<ReturnType<typeof fn>>`.",
        },
        {
          id: "ts-utility-types-q8",
          prompt:
            "Under `strict` (and nothing else), what is the type of `p`?\n\n```ts\nconst prices: Record<string, number> = { apple: 1 };\nconst p = prices[\"banana\"];\n```",
          options: [
            "`number`, even though it's `undefined` at runtime; `noUncheckedIndexedAccess` makes it `number | undefined`",
            "`number | undefined`",
            "A compile error, because `banana` isn't a known key",
            "`unknown`",
          ],
          correctIndex: 0,
          explanation:
            "`Record<string, number>` is an index signature that claims every string key maps to a number. `noUncheckedIndexedAccess` isn't part of `strict`; it adds `undefined` to index-signature and array reads.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-utility-types-q9",
          prompt:
            "What happens?\n\n```ts\ntype Status = \"idle\" | \"loading\" | \"error\";\nconst labels: Record<Status, string> = { idle: \"Idle\", loading: \"Loading…\" };\n```",
          options: [
            "Compile error: property `error` is missing, because a `Record` over literal keys requires every key",
            "It compiles; missing keys are simply `undefined`",
            "It compiles only if the object is marked `as const`",
            "Compile error: `Record` keys must be `string`",
          ],
          correctIndex: 0,
          explanation:
            "`Record<K, T>` maps over each member of `K`, so every status needs a label; adding a new status later flags every incomplete table. Use `Partial<Record<Status, string>>` when entries are genuinely optional.",
        },
        {
          id: "ts-utility-types-q10",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```ts\nconst ROLES = { admin: \"Administrator\", viewer: \"Viewer\" } as const;\ntype Role = keyof typeof ROLES;\ntype Label = (typeof ROLES)[Role];\n```",
          options: [
            "`Role` is `\"admin\" | \"viewer\"`",
            "`Label` is `\"Administrator\" | \"Viewer\"`",
            "Without `as const`, `Label` would be `string`",
            "Without `as const`, `Role` would be `string`",
            "`keyof ROLES` would work without `typeof`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`typeof` turns the value into a type, `keyof` takes its keys and an indexed access reads its value types. Keys are literal either way, but without `as const` the property values widen to `string`; `ROLES` itself is a value, so `keyof ROLES` doesn't compile.",
        },
      ],
    },
    {
      id: "ts-enums-literal-types",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Enums & Literal Types",
      summary:
        "Literal types are the precise end of the type system: `\"GET\"`, `404` and `true` are types with exactly one value, and unions of them (`\"GET\" | \"POST\"`) are how idiomatic TypeScript models a closed set of options. They cost nothing at runtime, autocomplete well and narrow cleanly. Tuples are their array-shaped cousin: fixed positions with their own types, optionally labelled (`[lat: number, lng: number]`); `as const` turns an array literal into a readonly tuple of literals.\n\nEnums predate literal unions and are one of the few TypeScript features that generate code. A numeric enum compiles to an object with reverse mappings (`Direction[0] === \"Up\"`), so `Object.keys` returns names and numeric strings alike, and any value typed `number` is assignable to it. String enums have no reverse mapping and only accept their own members, so the plain string `\"ACTIVE\"` isn't assignable to `Status` even when the values match: a feature for some teams, friction for others. `const enum` inlines values and emits no object, but that needs cross-file knowledge: under `isolatedModules` (implied by `verbatimModuleSyntax`, and assumed by per-file transpilers such as esbuild and SWC), reading an ambient `const enum` from a declaration file is an error, and the handbook lists further pitfalls for libraries that publish them.\n\nThe ecosystem has been moving away from enums. `erasableSyntaxOnly` (TypeScript 5.8) forbids them because Node.js's built-in type stripping runs `.ts` files by deleting types, and it can't handle syntax that emits code. The usual replacement is a const object plus a derived type: `const Direction = { Up: \"UP\", Down: \"DOWN\" } as const; type Direction = (typeof Direction)[keyof typeof Direction];` gives you a runtime object to iterate, a literal union for type checking, and no reverse-mapping surprises.",
      level: "intermediate",
      estMinutes: 85,
      webRefs: [
        { label: "TypeScript Handbook: Enums", url: "https://www.typescriptlang.org/docs/handbook/enums.html", kind: "docs" },
        { label: "TypeScript Handbook: Literal Types", url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types", kind: "docs" },
        { label: "Total TypeScript: Why I Don't Like Enums", url: "https://www.totaltypescript.com/why-i-dont-like-typescript-enums", kind: "article" },
        { label: "Total TypeScript: TypeScript 5.8 Ships --erasableSyntaxOnly To Disable Enums", url: "https://www.totaltypescript.com/erasable-syntax-only", kind: "article" },
      ],
      video: {
        title: "Practical TypeScript – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=JHEB7RhJG1Y",
        videoId: "JHEB7RhJG1Y",
        durationLabel: "9:34:51",
        startSeconds: 10973,
        chapterLabel: "Chapter 4: Tuples and Enums",
      },
      alternateVideos: [
        {
          title: "Enums considered harmful",
          channel: "Matt Pocock",
          url: "https://www.youtube.com/watch?v=jjMbPt_H3RQ",
          videoId: "jjMbPt_H3RQ",
          durationLabel: "9:23",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-enums-literal-types-q1",
          prompt:
            "What does this log?\n\n```ts\nenum Direction { Up, Down, Left = 10, Right }\nconsole.log(Direction[0], Direction.Right, Object.keys(Direction).length);\n```",
          options: ["`Up 11 8`", "`Up 3 4`", "`undefined 11 4`", "`Up 11 4`"],
          correctIndex: 0,
          explanation:
            "Numeric members auto-increment from the previous value, so `Right` is 11. Every numeric member also gets a reverse mapping (`Direction[0] === \"Up\"`), so the object has eight keys: four names and four numeric strings.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-enums-literal-types-q2",
          prompt:
            "Which lines compile? (Select all that apply.)\n\n```ts\nenum Status { Active = \"ACTIVE\", Inactive = \"INACTIVE\" }\nenum Level { Low, High }\ndeclare const n: number;\n```",
          options: [
            "`const s: Status = Status.Active;`",
            "`const l: Level = n;`",
            "`const s2: Status = \"ACTIVE\";`",
            "`const l2: Level = 42;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "String enums only accept their own members, even when a string's value matches. Numeric enums accept any value typed `number` (to support bit flags), but since TypeScript 5.0 a numeric literal that matches no member, like `42`, is rejected.",
        },
        {
          id: "ts-enums-literal-types-q3",
          prompt:
            "A library's `.d.ts` contains `export declare const enum Color { Red = 0, Green = 1 }`. Your app compiles with `isolatedModules: true`, as esbuild-, SWC- and Vite-based setups expect, and reads `Color.Red`. What happens?",
          options: [
            "Compile error: ambient const enums can't be accessed under `isolatedModules`, because a per-file transpiler can't know their values",
            "It compiles, and `0` is inlined at the use site",
            "It compiles, then `Color` is `undefined` at runtime with no warning",
            "It compiles as long as `preserveConstEnums` is also set",
          ],
          correctIndex: 0,
          explanation:
            "Plain `tsc` could inline `0`, but a single-file transpiler never reads the declaration file, and no `Color` object exists at runtime, so the reference would crash. TypeScript reports \"Cannot access ambient const enums when 'isolatedModules' is enabled\" instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-enums-literal-types-q4",
          prompt:
            "A project enables `erasableSyntaxOnly` so its `.ts` files can run under Node's built-in type stripping. Which declarations become errors? (Select all that apply.)",
          options: [
            "`enum Color { Red, Green }`",
            "`const enum Flag { On, Off }`",
            "`class Repo { constructor(private readonly db: Db) {} }`",
            "`namespace Utils { export const x = 1; }`",
            "`namespace Types { export type Id = string; }`",
            "`type Color = \"red\" | \"green\";`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Erasable syntax can be deleted to leave valid JavaScript. Enums (including `const enum`), parameter properties and namespaces that contain values all generate code, so they're rejected; a namespace holding only types and a type alias disappear entirely.",
        },
        {
          id: "ts-enums-literal-types-q5",
          prompt:
            "Which statements are true about this enum replacement? (Select all that apply.)\n\n```ts\nconst Direction = { Up: \"UP\", Down: \"DOWN\" } as const;\ntype Direction = (typeof Direction)[keyof typeof Direction];\n```",
          options: [
            "The type `Direction` is `\"UP\" | \"DOWN\"`",
            "Declaring a value and a type with the same name is legal, because values and types live in separate declaration spaces",
            "A parameter typed `Direction` accepts the plain string `\"UP\"`",
            "`Object.values(Direction)` returns `[\"UP\", \"DOWN\", \"Up\", \"Down\"]`",
            "It emits no runtime code",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The object exists at runtime (so you can iterate it) and the derived type is a literal union, so plain strings work. There are no reverse mappings, so `Object.values` gives just the two values.",
        },
        {
          id: "ts-enums-literal-types-q6",
          prompt:
            "What happens?\n\n```ts\nconst pair: [string, number] = [\"age\", 42];\npair.push(99);\nconsole.log(pair.length);\n```",
          options: [
            "It compiles and logs `3`: tuple types don't remove `push`",
            "Compile error: tuples have a fixed length",
            "It compiles and logs `2`",
            "A runtime error, because tuples are frozen arrays",
          ],
          correctIndex: 0,
          explanation:
            "A tuple is an ordinary array with positional types, and its mutating methods are still typed, so the type (length 2) now lies. Declare it `readonly [string, number]` to remove `push` and friends.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-enums-literal-types-q7",
          prompt: "Given `type Range = [start: number, end?: number];`, what is `Range[\"length\"]`?",
          options: ["`1 | 2`", "`2`", "`number`", "`1`"],
          correctIndex: 0,
          explanation:
            "A tuple's `length` is a union of every length it can have, so an optional trailing element makes it `1 | 2`. A tuple with a rest element, like `[string, ...number[]]`, has `length: number`.",
        },
        {
          id: "ts-enums-literal-types-q8",
          prompt:
            "Which of these enum declarations are compile errors? (Select all that apply.)\n\n```ts\nenum A { X = \"x\", Y }\nenum B { X = 1, Y }\nenum C { X = \"x\".length, Y }\nenum D { X, Y = X + 5 }\n```",
          options: ["`A`", "`C`", "`B`", "`D`"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A member without an initializer auto-increments from the previous one, which is impossible after a string member (`A`) or a computed, non-constant member (`C`). `B.Y` is 2, and `X + 5` in `D` is a constant expression evaluated at compile time.",
        },
        {
          id: "ts-enums-literal-types-q9",
          prompt: "Given `enum Level { Low = 1, High = 2 }`, what is `keyof typeof Level`?",
          options: [
            "`\"Low\" | \"High\"`",
            "`1 | 2`",
            "`\"Low\" | \"High\" | \"1\" | \"2\"`",
            "The keys of `number`, such as `\"toFixed\"`",
          ],
          correctIndex: 0,
          explanation:
            "`typeof Level` is the type of the enum object, whose declared keys are the member names; reverse mappings aren't part of it. Without `typeof`, `Level` means the member type (a number), so `keyof Level` gives `number`'s method names.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-enums-literal-types-q10",
          prompt:
            "What does this log?\n\n```ts\nenum Perm { Read = 1, Write = 2, Exec = 4 }\nconst rw: Perm = Perm.Read | Perm.Write;\nconsole.log(rw, Perm[rw]);\n```",
          options: ["`3 undefined`", "`3 Read|Write`", "`Read,Write 3`", "Nothing: it's a compile error because 3 isn't a member of `Perm`"],
          correctIndex: 0,
          explanation:
            "Combining flags yields a plain `number`, which a numeric enum type accepts. Reverse mappings only exist for declared values, so `Perm[3]` is `undefined` at runtime even though TypeScript types it as `string`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "ts-classes-access-modifiers",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Classes & Access Modifiers in TS",
      summary:
        "TypeScript classes are JavaScript classes plus type-level extras, and the line between the two matters. `public`, `protected` and `private` are compile-time only: after erasure a `private` field is an ordinary property that shows up in `JSON.stringify`, `Object.keys` and bracket access (`obj[\"secret\"]` even type-checks, as a deliberate escape hatch). ECMAScript `#private` fields are enforced by the runtime, invisible to reflection and serialization, and inaccessible to subclasses. Use `#` when privacy is a real guarantee, and `private` or `protected` when you only need API hygiene or subclass access.\n\nSome TypeScript-only class syntax generates code. Parameter properties (`constructor(private readonly db: Db) {}`) declare and assign a field in one go, but they aren't erasable, so `erasableSyntaxOnly` and Node's type stripping reject them, just as they reject enums. `readonly` is shallow and compile-time only, and `abstract` only exists in the type system (JavaScript can still instantiate the class). `implements` checks a class against an interface but doesn't contextually type its members, so method parameters still need annotations. `override`, enforced with `noImplicitOverride`, turns a renamed base method into a compile error instead of a silently orphaned subclass method.\n\nTwo gotchas catch experienced developers. Classes are structural, so an unrelated object literal with the same public shape is assignable to the class type, unless the class has a `private` or `#private` member, which makes it effectively nominal. And fields follow standard JavaScript semantics (`useDefineForClassFields` is on for ES2022+ targets): they're defined after `super()` returns, so redeclaring an inherited field in a subclass would reset it to `undefined` (TypeScript flags this and suggests `declare name: string`), and a base constructor that calls an overridden method sees the subclass's fields uninitialized.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "TypeScript Handbook: Classes", url: "https://www.typescriptlang.org/docs/handbook/2/classes.html", kind: "docs" },
        { label: "MDN: Private elements", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements", kind: "docs" },
        { label: "Total TypeScript Essentials: Classes", url: "https://www.totaltypescript.com/books/total-typescript-essentials/classes", kind: "article" },
        { label: "TSConfig Reference: useDefineForClassFields", url: "https://www.typescriptlang.org/tsconfig/#useDefineForClassFields", kind: "docs" },
      ],
      video: {
        title: "Practical TypeScript – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=JHEB7RhJG1Y",
        videoId: "JHEB7RhJG1Y",
        durationLabel: "9:34:51",
        startSeconds: 20585,
        chapterLabel: "Chapter 8: Classes",
      },
      alternateVideos: [
        {
          title: "Learn TypeScript – Full Tutorial",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=30LWjhZzg50",
          videoId: "30LWjhZzg50",
          durationLabel: "4:46:25",
          startSeconds: 10424,
          chapterLabel: "Classes",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-classes-access-modifiers-q1",
          prompt:
            "Compiled for an ES2022+ target, what does this log?\n\n```ts\nclass Account {\n  private balance = 100;\n  #pin = 1234;\n}\nconst a = new Account();\nconsole.log(JSON.stringify(a), (a as any).balance, (a as any).pin);\n```",
          options: [
            "`{\"balance\":100} 100 undefined`",
            "`{} undefined undefined`",
            "`{\"balance\":100,\"pin\":1234} 100 1234`",
            "It throws a `TypeError` when reading `balance`",
          ],
          correctIndex: 0,
          explanation:
            "`private` is erased, so `balance` is an ordinary public property at runtime. `#pin` is a genuinely private field: it isn't serialized, and there's no property called `pin` at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-classes-access-modifiers-q2",
          prompt:
            "Which lines compile inside `Child.test`? (Select all that apply.)\n\n```ts\nclass Base {\n  private secret = 1;\n  protected shared = 2;\n}\nclass Child extends Base {\n  test(other: Base) {\n    // ...\n  }\n}\n```",
          options: ["`this.shared;`", "`this[\"secret\"];`", "`this.secret;`", "`other.shared;`"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Subclasses can use `protected` members, but only through an instance of their own class, so `other.shared` (typed as `Base`) is an error. `private` blocks `this.secret`, yet bracket notation is allowed as an intentional escape hatch, which shows how soft TypeScript privacy is.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-classes-access-modifiers-q3",
          prompt:
            "Which statement is true?\n\n```ts\nclass Point {\n  constructor(public x: number, public y: number) {}\n}\nclass Secret {\n  private id = 1;\n}\nconst p: Point = { x: 1, y: 2 }; // (1)\nconst s: Secret = { id: 1 };     // (2)\n```",
          options: [
            "(1) compiles; (2) is an error, because a class with a `private` member is only compatible with its own instances and subclasses",
            "Both are errors: only `new` can create a class instance",
            "Both compile",
            "(1) is an error; (2) compiles",
          ],
          correctIndex: 0,
          explanation:
            "Class types are compared structurally, so a plain object with the same public members is a `Point`. Private and protected members break that: they must originate from the same declaration, which makes such classes effectively nominal.",
        },
        {
          id: "ts-classes-access-modifiers-q4",
          prompt: "Which of these have no runtime effect at all once compiled? (Select all that apply.)",
          options: [
            "`private` and `protected` modifiers",
            "`readonly` on a field",
            "An `implements` clause",
            "The `abstract` modifier on a class",
            "A `#private` field",
            "A parameter property such as `constructor(public name: string)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Access modifiers, `readonly`, `implements` and `abstract` are erased; plain JavaScript can still instantiate an abstract class or mutate a readonly field. A `#private` field is real JavaScript, and a parameter property emits a `this.name = name` assignment.",
        },
        {
          id: "ts-classes-access-modifiers-q5",
          prompt:
            "Under `strict`, what happens?\n\n```ts\ninterface Checkable {\n  check(name: string): boolean;\n}\nclass NameChecker implements Checkable {\n  check(s) {\n    return s.toLowerCase() === \"ok\";\n  }\n}\n```",
          options: [
            "Error: `s` implicitly has an `any` type, because `implements` doesn't type the class's members",
            "`s` is inferred as `string` from the interface",
            "It compiles, with `s` typed as `unknown`",
            "Error: classes can't implement interfaces that declare methods",
          ],
          correctIndex: 0,
          explanation:
            "`implements` is only a check that the finished class is assignable to the interface; it doesn't change the class's types. Annotate `check(s: string)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-classes-access-modifiers-q6",
          prompt:
            "With a target of ES2022 or later (so `useDefineForClassFields` is on), what happens?\n\n```ts\nclass Base {\n  name: string;\n  constructor() {\n    this.name = \"base\";\n  }\n}\nclass Derived extends Base {\n  name!: string; // meant only to document the type\n}\n```",
          options: [
            "Compile error: the redeclaration would overwrite the base property; use `declare name: string;` instead",
            "It compiles, and `new Derived().name` is `\"base\"`",
            "It compiles, and `new Derived().name` is `undefined`",
            "Compile error: `name` must be `protected` to be redeclared",
          ],
          correctIndex: 0,
          explanation:
            "With define semantics the subclass field is re-initialized to `undefined` after `super()` returns (the emitted JavaScript really would give `undefined`), so TypeScript reports error TS2612. `declare name: string` narrows the type without emitting a field.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-classes-access-modifiers-q7",
          prompt: "Your team turns on `erasableSyntaxOnly` so the code runs under Node's type stripping. Which class has to be rewritten?",
          options: [
            "`class Repo { constructor(private readonly db: Db) {} }`",
            "`class Repo { #db: Db; constructor(db: Db) { this.#db = db; } }`",
            "`class Repo { private readonly db: Db; constructor(db: Db) { this.db = db; } }`",
            "`abstract class Repo { abstract find(id: string): Promise<User>; }`",
          ],
          correctIndex: 0,
          explanation:
            "A parameter property makes the compiler generate `this.db = db`, so it can't simply be erased. The explicit field declaration, the `#private` field and the abstract class are all erasable.",
        },
        {
          id: "ts-classes-access-modifiers-q8",
          prompt: "What do the `override` keyword and `noImplicitOverride` give you? (Select all that apply.)",
          options: [
            "If the base method is renamed or removed, a subclass method marked `override` becomes a compile error instead of a silently unrelated method",
            "With `noImplicitOverride`, overriding a base method without the keyword is an error",
            "`override` changes how the method is dispatched at runtime",
            "`override` prevents further subclasses from overriding the method again",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`override` is a compile-time assertion that a same-named member exists in the base class; it emits nothing. TypeScript has no `final` modifier, so it can't stop further overriding.",
        },
        {
          id: "ts-classes-access-modifiers-q9",
          prompt:
            "Given this abstract class, which declarations compile? (Select all that apply.)\n\n```ts\nabstract class Shape {\n  abstract area(): number;\n  describe() {\n    return \"Area: \" + this.area();\n  }\n}\n```",
          options: [
            "`class Square extends Shape { area() { return 4; } }`",
            "`abstract class Polygon extends Shape {}`",
            "`const s = new Shape();`",
            "`class Circle extends Shape {}`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A concrete subclass must implement every abstract member, while an abstract subclass may defer them. TypeScript refuses `new` on an abstract class, although plain JavaScript could instantiate it.",
        },
        {
          id: "ts-classes-access-modifiers-q10",
          prompt:
            "What happens when this runs?\n\n```ts\nclass Counter {\n  count = 0;\n  inc() { this.count++; }\n  incArrow = () => { this.count++; };\n}\nconst c = new Counter();\nconst { inc, incArrow } = c;\nincArrow();\ninc();\n```",
          options: [
            "`incArrow()` works, but `inc()` throws a `TypeError` at runtime, and TypeScript doesn't flag it",
            "Both calls work",
            "TypeScript reports an error on the destructuring",
            "`inc()` silently increments a global `count`",
          ],
          correctIndex: 0,
          explanation:
            "Class bodies are strict mode, so a detached method runs with `this` as `undefined`. Arrow-function fields capture the instance (at the cost of one function per instance). Declaring `inc(this: Counter)` would make the unbound call a compile error.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "ts-modules-namespaces",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Modules & Namespaces",
      summary:
        "TypeScript doesn't have its own module system. It models the one your code will run under, and most module pain comes from that model disagreeing with the real runtime or bundler. Two settings define it: `module` decides the output format and which rules apply (`nodenext` for code Node runs directly, `preserve` or `esnext` for bundled apps), and `moduleResolution` decides how specifiers are resolved (`nodenext`, or `bundler` for Vite, webpack, esbuild and Bun). TypeScript 6.0 deprecated `moduleResolution: node10` and `baseUrl`, and 7.0 removed them, so `paths` entries are now written relative to the config file.\n\nUnder `nodenext`, TypeScript follows Node's rules exactly. Whether a `.ts` file is ESM or CommonJS depends on the nearest `package.json` `\"type\"` field (or an `.mts`/`.cts` extension); relative ESM imports need a file extension, and you write the extension of the output (`import \"./util.js\"` from `util.ts`), because TypeScript doesn't rewrite specifiers unless you write `.ts` and enable `rewriteRelativeImportExtensions`. Likewise, `paths` only teaches the type checker about aliases: the bundler or runtime needs its own mapping. Type-only imports matter too: with `verbatimModuleSyntax`, every import without the `type` modifier stays in the output, which is exactly what single-file transpilers and Node's type stripping assume.\n\nNamespaces are TypeScript's pre-ES2015 answer to modules: an IIFE-built object that can span files. They're legacy for application code (they don't tree-shake, and ones containing values are rejected by `erasableSyntaxOnly`), but `declare namespace`, `declare global` and `declare module \"x\"` remain essential in declaration files and for module augmentation. The old `module Foo {}` spelling of a namespace is an error in TypeScript 7.0. Finally, a file with no top-level `import` or `export` is a global script, not a module; that's behind many mysterious redeclaration errors, and `export {}` or `moduleDetection: \"force\"` fixes it.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "TypeScript Handbook: Modules Theory", url: "https://www.typescriptlang.org/docs/handbook/modules/theory.html", kind: "docs" },
        {
          label: "TypeScript Handbook: Choosing Module Compiler Options",
          url: "https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html",
          kind: "docs",
        },
        { label: "TypeScript Handbook: Namespaces and Modules", url: "https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html", kind: "docs" },
        {
          label: "Total TypeScript: Relative import paths need explicit file extensions in EcmaScript imports",
          url: "https://www.totaltypescript.com/relative-import-paths-need-explicit-file-extensions-in-ecmascript-imports",
          kind: "article",
        },
      ],
      video: {
        title: "Mastering Modules in TypeScript [FULL COURSE]",
        channel: "TypeScript with Benny Code",
        url: "https://www.youtube.com/watch?v=XoOgNRQEYws",
        videoId: "XoOgNRQEYws",
        durationLabel: "18:27",
      },
      alternateVideos: [
        {
          title: "Import vs Require: The Biggest JavaScript Divide",
          channel: "Matt Pocock",
          url: "https://www.youtube.com/watch?v=6_JNPmjSevo",
          videoId: "6_JNPmjSevo",
          durationLabel: "4:02",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-modules-namespaces-q1",
          prompt:
            "In a package with `\"type\": \"module\"` compiled with `module: nodenext`, `src/index.ts` imports from `src/util.ts`. Which specifier compiles?",
          options: [
            "`import { f } from \"./util.js\";`",
            "`import { f } from \"./util\";`",
            "`import { f } from \"./util.ts\";`",
            "`import { f } from \"src/util\";`",
          ],
          correctIndex: 0,
          explanation:
            "Node's ESM resolver needs the real output file name, and TypeScript doesn't rewrite specifiers by default, so you write `.js`. The extensionless form is error TS2835; `.ts` needs `allowImportingTsExtensions` (with no emit) or `rewriteRelativeImportExtensions`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-modules-namespaces-q2",
          prompt:
            "With `verbatimModuleSyntax` on, which statements are true? (Select all that apply.)\n\n```ts\nimport { type User, createUser } from \"./user.js\";\nimport type { Config } from \"./config.js\";\nimport { Logger } from \"./logger.js\"; // Logger is an interface\n```",
          options: [
            "The first import is emitted as `import { createUser } from \"./user.js\"`",
            "The second import is removed entirely",
            "The third import is an error, because a type is imported without the `type` modifier",
            "TypeScript silently drops the third import because `Logger` is only used as a type",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`verbatimModuleSyntax` means what you write is what's emitted, minus anything marked `type`. Importing a type without the modifier is error TS1484, because a single-file transpiler couldn't know it's safe to drop.",
        },
        {
          id: "ts-modules-namespaces-q3",
          prompt:
            "Under `verbatimModuleSyntax`, how do `import { type Theme } from \"./theme.js\"` and `import type { Theme } from \"./theme.js\"` differ in the output?",
          options: [
            "The first still emits `import {} from \"./theme.js\"`, so the module's side effects run; the second is erased completely",
            "They're identical: both are erased",
            "The first is an error under `verbatimModuleSyntax`",
            "The second keeps a side-effect import; the first is erased",
          ],
          correctIndex: 0,
          explanation:
            "Inline `type` modifiers only remove the named specifiers, so the import declaration itself survives as a side-effect import. A top-level `import type` removes the whole statement.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-modules-namespaces-q4",
          prompt: "With `module: nodenext`, which files are treated as ES modules? (Select all that apply.)",
          options: [
            "`src/a.mts`",
            "`src/b.ts` when the nearest `package.json` has `\"type\": \"module\"`",
            "`src/c.cts` when the nearest `package.json` has `\"type\": \"module\"`",
            "`src/d.ts` when `package.json` has no `\"type\"` field, as long as it uses `import` syntax",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "TypeScript mirrors Node: `.mts` is always ESM, `.cts` is always CommonJS, and `.ts` follows the nearest `package.json` `\"type\"`, defaulting to CommonJS. In that last case `import` syntax is compiled to `require` calls.",
        },
        {
          id: "ts-modules-namespaces-q5",
          prompt:
            "After upgrading to TypeScript 7.0, a config with `\"baseUrl\": \"./src\"` and `\"paths\": { \"@app/*\": [\"app/*\"] }` fails to load. What's the fix?",
          options: [
            "Remove `baseUrl` and make each path relative to the config file: `\"@app/*\": [\"./src/app/*\"]`",
            "Set `\"ignoreDeprecations\": \"6.0\"`, which keeps `baseUrl` working in 7.0",
            "Switch to `moduleResolution: node10`, which still honours `baseUrl`",
            "Move `baseUrl` into `paths` as a `\"*\"` key and keep `\"app/*\"` unchanged",
          ],
          correctIndex: 0,
          explanation:
            "TypeScript 6.0 deprecated `baseUrl` (silenceable with `ignoreDeprecations`), and 7.0 removed it along with `node10` resolution. Without `baseUrl`, non-relative `paths` targets are an error, so they need a leading `./`.",
        },
        {
          id: "ts-modules-namespaces-q6",
          prompt:
            "`paths` maps `@/*` to `./src/*`, and `tsc` compiles `import { db } from \"@/db.js\"` without errors. Running the emitted JavaScript with plain Node fails with \"Cannot find package '@/db.js'\". Why?",
          options: [
            "`paths` only affects type checking; TypeScript never rewrites import specifiers, so the runtime or bundler needs its own mapping, such as `package.json` `imports` subpath patterns",
            "`paths` only works together with `moduleResolution: node10`",
            "Node also requires `baseUrl` to be set",
            "`tsc` rewrites aliases only when `outDir` is set",
          ],
          correctIndex: 0,
          explanation:
            "TypeScript resolves the alias to find types, then emits the specifier untouched. Vite (`resolve.alias`), webpack or Node's own subpath imports (`\"#/*\"` patterns in `package.json`) must be configured to match.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-modules-namespaces-q7",
          prompt:
            "`a.ts` contains only `const config = { a: 1 };` and `b.ts` contains only `const config = { b: 2 };`. Both are compiled together. What does TypeScript report?",
          options: [
            "\"Cannot redeclare block-scoped variable 'config'\" in both files, because files without imports or exports are global scripts sharing one scope",
            "Nothing: every file has its own scope",
            "A duplicate export error",
            "An error only when `isolatedModules` is enabled",
          ],
          correctIndex: 0,
          explanation:
            "With the default `moduleDetection: \"auto\"`, a file needs a top-level `import` or `export` to be a module. Adding `export {}` to each file, or setting `moduleDetection: \"force\"`, gives each its own scope.",
        },
        {
          id: "ts-modules-namespaces-q8",
          prompt: "Which statements about namespaces and ambient modules are true today? (Select all that apply.)",
          options: [
            "`namespace Utils { export const x = 1; }` compiles to an IIFE that builds an object at runtime",
            "A namespace containing only types is erased completely, so Node's type stripping accepts it",
            "`declare module \"legacy-lib\" { … }` in a global declaration file types an untyped package",
            "`module Utils { … }` is still a valid spelling of `namespace Utils` in TypeScript 7.0",
            "Bundlers tree-shake unused namespace members just like unused ES module exports",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Value namespaces emit an IIFE that mutates an object, which bundlers can't tree-shake; type-only namespaces vanish. Ambient `declare module \"name\"` blocks are still how you type untyped packages, but the legacy `module Utils {}` namespace syntax is now error TS1540.",
        },
        {
          id: "ts-modules-namespaces-q9",
          prompt:
            "A CommonJS package's types say `export = createApp;` (its `module.exports` is a function). `esModuleInterop` can no longer be turned off as of TypeScript 6.0. Which import lets you call it?",
          options: [
            "`import createApp from \"legacy-app\";`",
            "`import * as createApp from \"legacy-app\";`",
            "`import { createApp } from \"legacy-app\";`",
            "None: `export =` modules can only be loaded with `require`",
          ],
          correctIndex: 0,
          explanation:
            "With interop always on, the whole `module.exports` value becomes the default import. A namespace import is an object (`{ default: … }`), so calling it is error TS2349, and the named import is rejected because the export \"can only be imported by using a default import\".",
        },
        {
          id: "ts-modules-namespaces-q10",
          prompt: "Inside a module file (it has imports), how do you add `analytics: Analytics` to the global `window` type?",
          options: [
            "`declare global { interface Window { analytics: Analytics } }`",
            "`interface Window { analytics: Analytics }` at the top level of the file",
            "`declare module \"window\" { interface Window { analytics: Analytics } }`",
            "`namespace Window { export let analytics: Analytics; }`",
          ],
          correctIndex: 0,
          explanation:
            "In a module, a top-level `interface Window` declares a new local type that merges with nothing global. `declare global` reopens the global scope, where the interface merges with the DOM's `Window`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "ts-conditional-types",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Advanced: Conditional Types",
      summary:
        "A conditional type, `T extends U ? X : Y`, is an `if` for types: TypeScript checks whether `T` is assignable to `U` and picks a branch. Two mechanics make it powerful. First, when the checked type is a naked type parameter and the argument is a union, the condition distributes: it runs once per member and the results are unioned, which is how `Exclude<T, U> = T extends U ? never : T` filters unions. Wrapping both sides in a tuple, `[T] extends [U]`, turns distribution off, which you need when testing for `never`: it's the empty union, so a distributive conditional over it returns `never` without evaluating either branch. Second, `infer` declares a type variable inside the `extends` clause and captures whatever matches that position: `T extends (...args: any[]) => infer R ? R : never` is `ReturnType`. Since TypeScript 4.7 a capture can be constrained (`infer N extends number`), and inference from template literals can even turn `\"42\"` into the number literal `42`.\n\nConditional types resolve eagerly when `T` is known and are deferred when it isn't. Inside a generic function body `T` is unresolved, and narrowing a value doesn't narrow `T`, so a return type like `T extends string ? number : string` can't be satisfied by either branch without a cast. That's the main reason to prefer overloads for simple input-to-output mappings. When one `infer` variable appears in several positions, covariant candidates are unioned and contravariant ones intersected, a detail behind tricks like `UnionToIntersection`.\n\nRecursive conditional types (deep readonly, path parsers, `Awaited` itself) work, but every instantiation is checker work, and deep recursion hits \"Type instantiation is excessively deep and possibly infinite\". Treat them like clever runtime code: name them well, test them with type-level assertions, and keep them out of hot paths.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "TypeScript Handbook: Conditional Types", url: "https://www.typescriptlang.org/docs/handbook/2/conditional-types.html", kind: "docs" },
        {
          label: "TypeScript 2.8 release notes: Distributive conditional types",
          url: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types",
          kind: "docs",
        },
        { label: "Artsy Engineering: Conditional types in TypeScript", url: "https://artsy.github.io/blog/2018/11/21/conditional-types-in-typescript/", kind: "article" },
        { label: "type-challenges: TypeScript type challenges", url: "https://github.com/type-challenges/type-challenges", kind: "repo" },
      ],
      video: {
        title: "Infer is easier than you think",
        channel: "Matt Pocock",
        url: "https://www.youtube.com/watch?v=hLZXJTm7TEk",
        videoId: "hLZXJTm7TEk",
        durationLabel: "13:38",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-conditional-types-q1",
          prompt: "What is `A`?\n\n```ts\ntype ToArray<T> = T extends unknown ? T[] : never;\ntype A = ToArray<string | number>;\n```",
          options: ["`string[] | number[]`", "`(string | number)[]`", "`never`", "`unknown[]`"],
          correctIndex: 0,
          explanation:
            "`T` is a naked type parameter, so the conditional distributes over the union: `ToArray<string> | ToArray<number>`. Writing `[T] extends [unknown] ? T[] : never` would give `(string | number)[]` instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-conditional-types-q2",
          prompt:
            "What are `A` and `B`?\n\n```ts\ntype IsNever<T> = T extends never ? true : false;\ntype IsNever2<T> = [T] extends [never] ? true : false;\ntype A = IsNever<never>;\ntype B = IsNever2<never>;\n```",
          options: ["`A` is `never`, `B` is `true`", "Both are `true`", "`A` is `false`, `B` is `true`", "Both are `never`"],
          correctIndex: 0,
          explanation:
            "`never` is the empty union, and distributing over zero members produces `never` without evaluating either branch. The tuple wrapper stops distribution, so `[never] extends [never]` is checked normally and is `true`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-conditional-types-q3",
          prompt:
            "Using `type ToArray<T> = T extends unknown ? T[] : never;`, which statements are true? (Select all that apply.)",
          options: [
            "`Exclude<\"a\" | \"b\" | 1, string>` is `1`",
            "`ToArray<boolean>` is `false[] | true[]`",
            "Written inline, `(string | number) extends string ? \"y\" : \"n\"` is `\"n\"`",
            "`ToArray<never>` is `never[]`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Distribution only happens through a naked type parameter: `boolean` is the union `true | false`, so it splits, while an inline union is checked as a whole (and `string | number` isn't assignable to `string`). Over `never`, a distributive conditional yields `never`.",
        },
        {
          id: "ts-conditional-types-q4",
          prompt:
            "What are `A`, `B` and `C`?\n\n```ts\ntype ElementOf<T> = T extends readonly (infer E)[] ? E : never;\ntype A = ElementOf<string[]>;\ntype B = ElementOf<readonly [1, \"a\"]>;\ntype C = ElementOf<string>;\n```",
          options: [
            "`A: string`, `B: 1 | \"a\"`, `C: never`",
            "`A: string`, `B: [1, \"a\"]`, `C: string`",
            "`A: string[]`, `B: 1 | \"a\"`, `C: never`",
            "`A: string`, `B: never`, `C: never`",
          ],
          correctIndex: 0,
          explanation:
            "Mutable arrays and readonly tuples both match `readonly (infer E)[]`, and a tuple's element type is the union of its members. A plain `string` isn't an array, so the false branch gives `never`.",
        },
        {
          id: "ts-conditional-types-q5",
          prompt:
            "What are `X` and `Y`?\n\n```ts\ntype FirstArg<F> = F extends (first: infer A, ...rest: any[]) => any ? A : never;\ntype X = FirstArg<(id: number, name: string) => void>;\ntype Y = FirstArg<() => void>;\n```",
          options: ["`X: number`, `Y: unknown`", "`X: number`, `Y: never`", "`X: number`, `Y: undefined`", "`X: [number, string]`, `Y: []`"],
          correctIndex: 0,
          explanation:
            "A zero-parameter function is assignable to one that takes parameters, so the true branch is taken, but there's no candidate for `A`, and an `infer` variable without candidates becomes `unknown`. Use `Parameters<F>[0]` if you want `undefined` for missing parameters.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-conditional-types-q6",
          prompt:
            "What are `A` and `B`?\n\n```ts\ntype ToNum<S> = S extends `${infer N extends number}` ? N : never;\ntype A = ToNum<\"42\">;\ntype B = ToNum<\"4x\">;\n```",
          options: ["`A: 42`, `B: never`", "`A: number`, `B: never`", "`A: \"42\"`, `B: never`", "`A: 42`, `B: number`"],
          correctIndex: 0,
          explanation:
            "An `infer` variable constrained to `number` inside a template literal only matches strings that are valid numbers, and when the string round-trips cleanly TypeScript infers the number literal itself. `\"4x\"` doesn't parse, so the false branch is taken.",
        },
        {
          id: "ts-conditional-types-q7",
          prompt:
            "What happens?\n\n```ts\nfunction convert<T extends string | number>(\n  x: T,\n): T extends string ? number : string {\n  return typeof x === \"string\" ? x.length : String(x);\n}\n```",
          options: [
            "Compile errors: narrowing `x` doesn't narrow `T`, so neither `number` nor `string` is assignable to the unresolved conditional type",
            "It compiles, because TypeScript matches each branch to the corresponding side of the conditional",
            "It compiles only with `strict` off",
            "It compiles, but `convert(\"a\")` returns `string | number`",
          ],
          correctIndex: 0,
          explanation:
            "While `T` is generic the conditional is deferred, and `typeof x` checks narrow the value, not the type parameter. Overloads (`(x: string): number; (x: number): string`) express this without casts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-conditional-types-q8",
          prompt: "Which built-in utility types are implemented with `infer`? (Select all that apply.)",
          options: ["`ReturnType`", "`Parameters`", "`Awaited`", "`Exclude`", "`NonNullable`", "`Partial`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`ReturnType` and `Parameters` capture parts of a function type, and `Awaited` captures the argument of `then`. `Exclude` is a conditional type without `infer`, `NonNullable<T>` is `T & {}`, and `Partial` is a mapped type.",
        },
        {
          id: "ts-conditional-types-q9",
          prompt:
            "What are `A` and `B`?\n\n```ts\ntype Co<T> = T extends { a: infer U; b: infer U } ? U : never;\ntype Contra<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void }\n  ? U\n  : never;\ntype A = Co<{ a: string; b: number }>;\ntype B = Contra<{ a: (x: string) => void; b: (x: number) => void }>;\n```",
          options: [
            "`A: string | number`, `B: never`",
            "`A: string | number`, `B: string | number`",
            "`A: never`, `B: string | number`",
            "`A: string`, `B: string`",
          ],
          correctIndex: 0,
          explanation:
            "Multiple candidates for one `infer` variable are unioned in covariant positions and intersected in contravariant ones (function parameters), and `string & number` is `never`. The same rule powers the `UnionToIntersection` trick.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-conditional-types-q10",
          prompt:
            "Given `type IsString<T> = T extends string ? \"yes\" : \"no\";`, what is `IsString<any>`?",
          options: ["`\"yes\" | \"no\"`", "`\"yes\"`", "`\"no\"`", "`any`"],
          correctIndex: 0,
          explanation:
            "When the checked type is `any`, TypeScript can't decide, so the result is the union of both branches. `IsString<unknown>`, by contrast, is `\"no\"`, because `unknown` isn't assignable to `string`.",
        },
        {
          id: "ts-conditional-types-q11",
          prompt: "A codebase relies on deeply recursive conditional types for route and form-path typing. What is the realistic cost?",
          options: [
            "Type-checking time and memory, since every instantiation is computed by the checker, plus \"excessively deep and possibly infinite\" errors when recursion runs deep",
            "Larger JavaScript bundles, because conditional types are compiled to runtime checks",
            "Slower runtime performance in the functions that use them",
            "Incremental builds are disabled for files that use them",
          ],
          correctIndex: 0,
          explanation:
            "Types are erased, so there's no runtime or bundle cost; the price is paid in the compiler and the editor. TypeScript 7's faster compiler raises the ceiling but doesn't remove it.",
        },
      ],
    },
    {
      id: "ts-mapped-types",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Advanced: Mapped Types",
      summary:
        "A mapped type builds an object type by iterating over a union of keys: `{ [K in Keys]: V }`. The workhorse form is homomorphic, `{ [K in keyof T]: … }`, which maps over an existing type and preserves each property's `readonly` and `?` modifiers; that's why `Partial`, `Readonly` and `Pick` are one-liners. Modifiers can be added or removed explicitly with `+` and `-`: `{ -readonly [K in keyof T]: T[K] }` is the `Mutable<T>` the standard library lacks, and `-?` removes optionality together with the `undefined` it implied (without `exactOptionalPropertyTypes`, even an explicit `| undefined` goes). Preservation depends on the form, though: mapping over a precomputed key union (`type Keys = keyof T`, then `[K in Keys]`) drops the modifiers, while `Pick`'s `K extends keyof T` keeps them.\n\nKey remapping with `as` (TypeScript 4.1) changes the output keys: remapping each key through a template literal type and `Capitalize<K & string>` turns `name` into `getName`, and remapping a key to `never` removes it, which is how you filter properties by value type. The `& string` matters because `keyof` can include number and symbol keys. Indexing a mapped type immediately, `{ [K in keyof E]: { type: K; payload: E[K] } }[keyof E]`, turns an object map into a discriminated union, the pattern behind many typed event emitters and reducers.\n\nHomomorphic mapped types have special cases worth knowing. Over an array or tuple they produce an array or tuple (`Partial<[number, string]>` is `[number?, string?]`), over a primitive they return it unchanged, and over a union they distribute per member. They're also shallow, and a naive recursive `DeepReadonly` maps function types to `{}`, silently deleting their call signatures, so real deep variants special-case functions. Deep recursion over large types is also a common source of slow type-checking.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "TypeScript Handbook: Mapped Types", url: "https://www.typescriptlang.org/docs/handbook/2/mapped-types.html", kind: "docs" },
        {
          label: "TypeScript 4.1 release notes: Key Remapping in Mapped Types",
          url: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#key-remapping-in-mapped-types",
          kind: "docs",
        },
        { label: "Total TypeScript: Transform Any Union in TypeScript with the IIMT", url: "https://www.totaltypescript.com/immediately-indexed-mapped-type", kind: "article" },
      ],
      video: {
        title: "No BS TS #14 - Mapped Types in Typescript",
        channel: "Jack Herrington",
        url: "https://www.youtube.com/watch?v=0-BsmzlMMIw",
        videoId: "0-BsmzlMMIw",
        durationLabel: "9:32",
      },
      alternateVideos: [
        {
          title: "Mapped Types Explained: Keep Your Types in Sync Automatically - Advanced TypeScript",
          channel: "Typed Rocks",
          url: "https://www.youtube.com/watch?v=iCEJY9XpfG8",
          videoId: "iCEJY9XpfG8",
          durationLabel: "6:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-mapped-types-q1",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```ts\ntype Mutable<T> = { -readonly [K in keyof T]: T[K] };\ntype Frozen = { readonly id: number; readonly tags: readonly string[] };\ntype M = Mutable<Frozen>;\n```",
          options: [
            "`M[\"id\"]` is writable",
            "`M[\"tags\"]` is still `readonly string[]`, because the mapping is shallow",
            "`Mutable` ships with TypeScript's standard library",
            "`-readonly` also removes `?` modifiers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`-readonly` strips the modifier from each top-level property only; the array type inside `tags` is untouched. There's no built-in `Mutable`, and `?` is controlled separately with `-?`.",
        },
        {
          id: "ts-mapped-types-q2",
          prompt:
            "Under `strict` (without `exactOptionalPropertyTypes`), what is `R`?\n\n```ts\ntype Opts = { retries?: number; label?: string | undefined };\ntype R = Required<Opts>;\n```",
          options: [
            "`{ retries: number; label: string }`",
            "`{ retries: number; label: string | undefined }`",
            "`{ retries: number | undefined; label: string | undefined }`",
            "`{ retries?: number; label?: string }`",
          ],
          correctIndex: 0,
          explanation:
            "`-?` removes optionality and the `undefined` it implies. Without `exactOptionalPropertyTypes`, TypeScript can't tell an explicit `| undefined` from the implicit one, so both go; with the flag on, `label` stays `string | undefined`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-mapped-types-q3",
          prompt: "Which statements about homomorphic mapped types are true? (Select all that apply.)",
          options: [
            "`Partial<[number, string]>` is `[number?, string?]`",
            "`Readonly<string[]>` is `readonly string[]`",
            "`Partial<string>` is `string`",
            "`Partial<[number, string]>` is an object type with optional `0`, `1` and `length` keys",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "When a homomorphic mapped type is instantiated with an array or tuple, TypeScript maps the elements and keeps the array shape; primitives pass through unchanged. That's why the built-in helpers behave sensibly on arrays.",
        },
        {
          id: "ts-mapped-types-q4",
          prompt:
            "What is `G`?\n\n```ts\ntype Getters<T> = {\n  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K];\n};\ntype G = Getters<{ name: string; age: number }>;\n```",
          options: [
            "`{ getName: () => string; getAge: () => number }`",
            "`{ getname: () => string; getage: () => number }`",
            "`{ name: () => string; age: () => number }`",
            "A compile error: template literal types can't be used as keys",
          ],
          correctIndex: 0,
          explanation:
            "The `as` clause computes a new key for each `K`, and `Capitalize` uppercases the first character. Modifiers such as `readonly` and `?` on the source properties would carry over to the renamed keys.",
        },
        {
          id: "ts-mapped-types-q5",
          prompt:
            "What is `D`?\n\n```ts\ntype DataOnly<T> = {\n  [K in keyof T as T[K] extends Function ? never : K]: T[K];\n};\nclass User {\n  id = 1;\n  name = \"Ada\";\n  greet() { return \"hi\"; }\n}\ntype D = DataOnly<User>;\n```",
          options: [
            "`{ id: number; name: string }`",
            "`{ id: number; name: string; greet: never }`",
            "`{ greet: () => string }`",
            "`{}`, because class instances have no own keys at the type level",
          ],
          correctIndex: 0,
          explanation:
            "Remapping a key to `never` removes it from the result, rather than keeping it with a `never` type. The class instance type includes the method, so `greet` is filtered out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-mapped-types-q6",
          prompt: "Why does `Getters<T>` use `Capitalize<K & string>` rather than `Capitalize<K>`?",
          options: [
            "`keyof T` may include `number` and `symbol` keys, and `Capitalize` only accepts strings",
            "It makes the generated keys readonly",
            "`K` is always a string already; `& string` only silences a lint rule",
            "Template literal types need an intersection to distribute over keys",
          ],
          correctIndex: 0,
          explanation:
            "For a generic `T`, `keyof T` is `string | number | symbol`-shaped, so `Capitalize<K>` fails its `extends string` constraint. Intersecting with `string` turns non-string keys into `never`, which drops them.",
        },
        {
          id: "ts-mapped-types-q7",
          prompt:
            "Which types keep `readonly id` and the optional `nick`? (Select all that apply.)\n\n```ts\ntype Src = { readonly id: number; nick?: string };\ntype Copy<T> = { [K in keyof T]: T[K] };\ntype Keys = keyof Src;\ntype Rebuilt = { [K in Keys]: Src[K] };\n```",
          options: ["`Copy<Src>`", "`Pick<Src, \"id\" | \"nick\">`", "`Rebuilt`", "`Record<keyof Src, unknown>`"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Modifiers are copied when the mapping is over `keyof T` or a type parameter constrained to `keyof T` (as in `Pick`). `Rebuilt` maps over an already-resolved key union, so it produces `{ id: number; nick: string | undefined }`, and `Record` never copies modifiers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-mapped-types-q8",
          prompt:
            "What is `P`?\n\n```ts\ntype A = { kind: \"a\"; x: number };\ntype B = { kind: \"b\"; y: string };\ntype P = Partial<A | B>;\n```",
          options: ["`Partial<A> | Partial<B>`", "`{ kind?: \"a\" | \"b\" }`", "`Partial<A & B>`", "A compile error"],
          correctIndex: 0,
          explanation:
            "Homomorphic mapped types distribute over unions, so each variant is mapped separately and the union's shape survives. Contrast `Omit`, which is built on `keyof` of the whole union and collapses it.",
        },
        {
          id: "ts-mapped-types-q9",
          prompt:
            "What is `EventUnion`?\n\n```ts\ntype Events = { click: { x: number }; key: { code: string } };\ntype EventUnion = {\n  [K in keyof Events]: { type: K; payload: Events[K] };\n}[keyof Events];\n```",
          options: [
            "`{ type: \"click\"; payload: { x: number } } | { type: \"key\"; payload: { code: string } }`",
            "`{ type: \"click\" | \"key\"; payload: { x: number } | { code: string } }`",
            "An object type with `click` and `key` properties",
            "`never`",
          ],
          correctIndex: 0,
          explanation:
            "The mapped type builds one object per key, and indexing it with `keyof Events` collects the property types into a union. Each member keeps its own `type`-to-`payload` pairing, so the result is a proper discriminated union.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-mapped-types-q10",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```ts\ntype DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> };\ndeclare const r: DeepReadonly<{ tags: string[]; save: () => void }>;\n```",
          options: [
            "`r.tags.push(\"x\")` is a compile error",
            "`r.save()` is a compile error, because mapping over a function type produces `{}`",
            "`r.tags[0].toUpperCase()` compiles",
            "`r.tags = []` compiles",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Arrays map to readonly arrays and primitives pass through, but a function type has no properties to map, so its call signature is lost. Production `DeepReadonly` types check for functions first (`T extends (...args: any[]) => any ? T : …`).",
        },
      ],
    },
    {
      id: "ts-template-literal-types",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Advanced: Template Literal Types",
      summary:
        "Template literal types (TypeScript 4.1) bring JavaScript's template string syntax to the type level. Written between backticks like a template string (the inline examples here omit them), `${Verb}-${Noun}` builds new string literal types, and when placeholders are unions the result is their cross product: `${\"sm\" | \"lg\"}-${\"red\" | \"blue\"}` is four literals. The intrinsic helpers `Uppercase`, `Lowercase`, `Capitalize` and `Uncapitalize` transform them. Combined with key remapping in mapped types, this is how libraries derive `onClick` from `click` or `getName` from `name`, and how routers, CSS-in-JS and i18n libraries type strings that used to be plain `string`.\n\nPlaceholders can also be wide types: `data-${string}` matches any string with that prefix, and `${number}px` accepts `\"12px\"` but not `\"12em\"`, so formats can be checked at compile time and even used as index signature keys. Inside a conditional type, `infer` in a template does pattern matching: matching against `${infer Head}/${infer Rest}` splits on the first `/`, because a placeholder followed by literal text matches up to the first occurrence. Recursion walks the rest of the string, which is how typed route params (`\"/users/:id\"` to `\"id\"`) and dotted property paths work.\n\nThe limits are practical. Cross products explode quickly, and TypeScript refuses unions beyond roughly 100,000 members; recursion depth is capped; and every parse is checker work repeated at each instantiation. TypeScript 7.0 also changed template inference to split strings by Unicode code points rather than UTF-16 code units, so an emoji is now a single character to `infer`, a breaking change for type-level string-length utilities. And a string built at runtime is just `string`: template literal types check the strings you write in code, not data arriving from users or APIs, which still needs runtime validation.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "TypeScript Handbook: Template Literal Types", url: "https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html", kind: "docs" },
        {
          label: "TypeScript 4.8 release notes: Improved inference for infer types in template string types",
          url: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-8.html#improved-inference-for-infer-types-in-template-string-types",
          kind: "docs",
        },
        { label: "Total TypeScript: Writing string.replace in TypeScript", url: "https://www.totaltypescript.com/writing-string-replace-in-typescript", kind: "article" },
        {
          label: "TypeScript blog: Template Literal Types Now Preserve Unicode Code Points (TypeScript 7.0)",
          url: "https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#template-literal-types-now-preserve-unicode-code-points",
          kind: "article",
        },
      ],
      video: {
        title: "TypeScript Template Literal Types // So much power ☢️",
        channel: "basarat",
        url: "https://www.youtube.com/watch?v=8KIkLPQPt98",
        videoId: "8KIkLPQPt98",
        durationLabel: "5:18",
      },
      alternateVideos: [
        {
          title: "TypeScript Template Literal Types",
          channel: "Harry Wolff",
          url: "https://www.youtube.com/watch?v=nskIP1iyrAo",
          videoId: "nskIP1iyrAo",
          durationLabel: "19:11",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-template-literal-types-q1",
          prompt: "What is `Handler`?\n\n```ts\ntype Handler = `on${Capitalize<\"click\" | \"key-down\">}`;\n```",
          options: [
            "`\"onClick\" | \"onKey-down\"`",
            "`\"onClick\" | \"onKeyDown\"`",
            "`\"onclick\" | \"onkey-down\"`",
            "A pattern type matching any string that starts with `on`",
          ],
          correctIndex: 0,
          explanation:
            "The template distributes over the union, and `Capitalize` only uppercases the first character; it knows nothing about kebab-case. Converting `key-down` to `KeyDown` needs a recursive type that splits on `-`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-template-literal-types-q2",
          prompt:
            "What are `A` and `B`?\n\n```ts\ntype Split<S> = S extends `${infer Head}/${infer Rest}` ? [Head, Rest] : [S];\ntype A = Split<\"users/42/posts\">;\ntype B = Split<\"users\">;\n```",
          options: [
            "`A: [\"users\", \"42/posts\"]`, `B: [\"users\"]`",
            "`A: [\"users/42\", \"posts\"]`, `B: [\"users\"]`",
            "`A: [\"users\", \"42\", \"posts\"]`, `B: [\"users\"]`",
            "`A: [\"users\", \"42/posts\"]`, `B: never`",
          ],
          correctIndex: 0,
          explanation:
            "A placeholder followed by literal text matches up to the first occurrence of that text, so `Head` stops at the first `/` and `Rest` takes everything after it. A string without `/` falls through to the false branch.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-template-literal-types-q3",
          prompt:
            "What is `R`?\n\n```ts\ntype Params<P extends string> =\n  P extends `${string}:${infer Name}/${infer Rest}`\n    ? Name | Params<Rest>\n    : P extends `${string}:${infer Name}`\n      ? Name\n      : never;\ntype R = Params<\"/users/:userId/posts/:postId\">;\n```",
          options: ["`\"userId\" | \"postId\"`", "`\"userId\"`", "`\"userId/posts\" | \"postId\"`", "`string`"],
          correctIndex: 0,
          explanation:
            "The first branch captures `userId` (up to the next `/`) and recurses on `posts/:postId`; that remainder has no `/` after its parameter, so the second branch captures `postId`. This is essentially how typed routers derive their params object.",
        },
        {
          id: "ts-template-literal-types-q4",
          prompt: "Given this type, which assignments compile? (Select all that apply.)\n\n```ts\ntype Px = `${number}px`;\n```",
          options: [
            "`const a: Px = \"12px\";`",
            "`const b: Px = \"1.5px\";`",
            "`const c: Px = \"-3px\";`",
            "`const d: Px = \"12em\";`",
            "`const e: Px = \"px\";`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A `${number}` placeholder accepts any text that parses as a JavaScript number, including decimals and negatives. `\"12em\"` has the wrong suffix, and an empty string isn't a numeric string.",
        },
        {
          id: "ts-template-literal-types-q5",
          prompt:
            "Which statement is true?\n\n```ts\ntype DataAttrs = { [key: `data-${string}`]: string };\nconst ok: DataAttrs = { \"data-id\": \"1\" };\nconst bad: DataAttrs = { id: \"1\" };\n```",
          options: [
            "`ok` compiles; `bad` is an error, because `id` doesn't match the `data-${string}` pattern",
            "Both compile: index signatures accept any key",
            "Neither compiles: index signature keys must be `string`, `number` or `symbol`",
            "`bad` compiles, because excess property checks don't apply to index signatures",
          ],
          correctIndex: 0,
          explanation:
            "Since TypeScript 4.4, index signatures can use pattern template literal types, so only keys matching the pattern are covered. `id` matches nothing, and the fresh object literal triggers an excess property error.",
        },
        {
          id: "ts-template-literal-types-q6",
          prompt:
            "What is `R` in TypeScript 7.0?\n\n```ts\ntype HeadTail<S> = S extends `${infer H}${infer T}` ? [H, T] : never;\ntype R = HeadTail<\"😀abc\">;\n```",
          options: [
            "`[\"😀\", \"abc\"]`; earlier versions split the emoji's UTF-16 surrogate pair into two halves",
            "`[\"😀\", \"abc\"]` in every TypeScript version",
            "`never`, because emoji can't appear in literal types",
            "`[\"😀abc\", \"\"]`",
          ],
          correctIndex: 0,
          explanation:
            "TypeScript 7.0 infers from template literals by Unicode code point, matching `for...of` and spreading a string. TypeScript 6.0 and earlier followed UTF-16 indexing and produced unpaired surrogates, so type-level `Length` utilities can give different answers after upgrading.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-template-literal-types-q7",
          prompt:
            "What is `R`?\n\n```ts\ntype Camel<S extends string> = S extends `${infer A}_${infer B}`\n  ? `${A}${Camel<Capitalize<B>>}`\n  : S;\ntype R = Camel<\"created_at_utc\">;\n```",
          options: ["`\"createdAtUtc\"`", "`\"createdAt_utc\"`", "`\"CreatedAtUtc\"`", "`string`"],
          correctIndex: 0,
          explanation:
            "Each step splits at the first `_`, keeps the head and recurses on the capitalized tail: `created` + `Camel<\"At_utc\">` gives `created` + `At` + `Utc`. The first segment is never capitalized.",
        },
        {
          id: "ts-template-literal-types-q8",
          prompt:
            "Each of `A`, `B`, `C` and `D` is a union of 20 string literals. What happens?\n\n```ts\ntype Big = `${A}${B}${C}${D}`;\n```",
          options: [
            "Error: \"Expression produces a union type that is too complex to represent\", because 160,000 members exceed TypeScript's limit",
            "It works, but autocomplete only lists the first 100 members",
            "TypeScript silently widens the result to `string`",
            "It compiles instantly, because template literal types are evaluated lazily",
          ],
          correctIndex: 0,
          explanation:
            "Cross products multiply: 20^4 is 160,000, beyond the roughly 100,000-member cap on unions, so TypeScript reports error TS2590. Three such placeholders (8,000 members) would be fine.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-template-literal-types-q9",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```ts\ntype Changed<T> = `${keyof T}Changed`;           // (1)\ntype Changed2<T> = `${keyof T & string}Changed`; // (2)\ntype Upper = Uppercase<\"ab\" | \"cd\">;\ntype Bools = `${boolean}`;\n```",
          options: [
            "(1) is an error, because `keyof T` may include `symbol`",
            "(2) compiles, and drops any non-string keys",
            "`Upper` is `\"AB\" | \"CD\"`",
            "`Bools` is `string`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Template placeholders accept `string`, `number`, `bigint`, `boolean`, `null` and `undefined`, but not `symbol`, hence `& string`. Intrinsic string types distribute over unions, and `Bools` is `\"false\" | \"true\"`.",
        },
        {
          id: "ts-template-literal-types-q10",
          prompt:
            "A form library types field paths as `Path<T>` (for example `\"address.city\"`) using recursive template literal types. Which statement is true?",
          options: [
            "It checks path strings written in code, but a path built at runtime from user input or an API response is only `string` and still needs runtime validation",
            "TypeScript validates runtime strings against the path type",
            "It makes property lookups faster at runtime",
            "It only works when the form values are declared `as const`",
          ],
          correctIndex: 0,
          explanation:
            "Types are erased, so the guarantee covers literals the compiler can see. Anything computed at runtime needs a runtime check (or a type guard) before it can be treated as a `Path<T>`.",
        },
      ],
    },
    {
      id: "ts-tsconfig-strictness",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Configuring tsconfig.json for Strictness",
      summary:
        "`strict` is a family flag: it enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `strictBuiltinIteratorReturn`, `noImplicitThis`, `useUnknownInCatchVariables` and `alwaysStrict`, and future versions may add members, so upgrades can surface new errors. It has defaulted to `true` since TypeScript 6.0, which also changed other defaults (`module: esnext`, a current-year `target`, `types: []`, `rootDir` set to the config's folder) and deprecated options that 7.0 turned into hard errors (`baseUrl`, `moduleResolution: node10`, `target: es5`). TypeScript 7.0 is the native Go compiler, typically 8 to 12 times faster on full builds, but it ships without a programmatic API until 7.1, so tools such as typescript-eslint and the Vue, Svelte and Astro tooling keep using the `@typescript/typescript6` compatibility package for now.\n\nSome of the most valuable checks sit outside `strict`. `noUncheckedIndexedAccess` adds `undefined` to array and index-signature reads, catching a class of crash that strict code still allows; `exactOptionalPropertyTypes` distinguishes a missing property from one explicitly set to `undefined`; `noImplicitOverride`, `noImplicitReturns` and `noFallthroughCasesInSwitch` tighten further. Enable them at the start of a project: retrofitting `noUncheckedIndexedAccess` onto a large codebase means thousands of edits.\n\nA second group constrains syntax so that tools other than `tsc` can process each file on its own. `isolatedModules` rejects code a single-file transpiler (esbuild, SWC, Babel) can't compile correctly, such as reading an ambient `const enum` or re-exporting a type without `export type`. `verbatimModuleSyntax` makes import elision explicit and implies `isolatedModules`. `erasableSyntaxOnly` (TypeScript 5.8) forbids syntax that emits code, as Node.js's built-in type stripping requires. Together with `noEmit` they describe the modern setup: `tsc` only type-checks, and something faster produces the JavaScript.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "TSConfig Reference: strict", url: "https://www.typescriptlang.org/tsconfig/#strict", kind: "docs" },
        { label: "TypeScript 6.0 release notes", url: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html", kind: "docs" },
        { label: "Total TypeScript: The TSConfig Cheat Sheet", url: "https://www.totaltypescript.com/tsconfig-cheat-sheet", kind: "article" },
        { label: "Node.js docs: Modules: TypeScript (type stripping)", url: "https://nodejs.org/api/typescript.html", kind: "docs" },
      ],
      video: {
        title: "Strict TypeScript Isn't Enough Anymore",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=35cESnxXH6o",
        videoId: "35cESnxXH6o",
        durationLabel: "21:24",
      },
      alternateVideos: [
        {
          title: "The TSConfig Cheat Sheet",
          channel: "Matt Pocock",
          url: "https://www.youtube.com/watch?v=eJXVEju3XLM",
          videoId: "eJXVEju3XLM",
          durationLabel: "5:36",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-tsconfig-strictness-q1",
          prompt: "Which flags does `\"strict\": true` turn on? (Select all that apply.)",
          options: [
            "`strictNullChecks`",
            "`useUnknownInCatchVariables`",
            "`strictBuiltinIteratorReturn`",
            "`noUncheckedIndexedAccess`",
            "`exactOptionalPropertyTypes`",
            "`noImplicitOverride`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The strict family also includes `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis` and `alwaysStrict`. `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noImplicitOverride` are opt-in because they're disruptive on existing code.",
        },
        {
          id: "ts-tsconfig-strictness-q2",
          prompt:
            "With `noUncheckedIndexedAccess` on, which expressions are typed `number | undefined`? (Select all that apply.)\n\n```ts\nconst xs = [1, 2, 3];\nconst map: Record<string, number> = {};\ndeclare const pair: [number, number];\n```",
          options: [
            "`xs[0]`",
            "`map.missing`",
            "`a` in `const [a] = xs;`",
            "`x` inside `for (const x of xs) { … }`",
            "`pair[0]`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Index and index-signature reads (destructuring included) might hit nothing, so they gain `undefined`. Iteration only visits existing elements, and a tuple's declared positions are known to exist, so neither changes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-tsconfig-strictness-q3",
          prompt:
            "With `exactOptionalPropertyTypes` on, `const p: Prefs = { theme: undefined }` is an error for `interface Prefs { theme?: \"dark\" | \"light\" }`. Why is that a useful error?",
          options: [
            "Because `{ theme: undefined }` and `{}` behave differently at runtime (`\"theme\" in p`, `Object.keys`, spreading over defaults), and the flag makes the type state which one is allowed",
            "Because `JSON.stringify` throws on `undefined` values",
            "Because optional properties can't be read without a null check",
            "Because `undefined` isn't a valid value in strict mode",
          ],
          correctIndex: 0,
          explanation:
            "`{ ...defaults, ...{ theme: undefined } }` overwrites the default with `undefined`, while `{}` keeps it. If `undefined` is a legitimate value, say so explicitly with `theme?: \"dark\" | \"light\" | undefined`.",
        },
        {
          id: "ts-tsconfig-strictness-q4",
          prompt:
            "A project that relied on compiler defaults upgrades from TypeScript 5.9 to 7.0. What changes? (Select all that apply.)",
          options: [
            "`strict` is now on",
            "`types` defaults to `[]`, so globals from `@types/node` or `@types/jest` disappear until they're listed",
            "`target` defaults to a current ECMAScript version rather than ES5",
            "`esModuleInterop: false` still works, with a deprecation warning",
            "`moduleResolution: node10` still works, with a deprecation warning",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "TypeScript 7.0 adopts 6.0's new defaults and turns everything 6.0 deprecated into hard errors, including `esModuleInterop: false` and `node10` resolution. `ignoreDeprecations` only helped on 6.0.",
        },
        {
          id: "ts-tsconfig-strictness-q5",
          prompt:
            "After upgrading to TypeScript 7.0, a Node project reports \"Cannot find name 'process'\" and \"Cannot find module 'fs'\", even though `@types/node` is installed. What's the fix?",
          options: [
            "Add `\"types\": [\"node\"]`: since 6.0, `types` defaults to `[]` instead of loading every `@types` package",
            "Reinstall `@types/node`, because TypeScript 7 needs a native build of it",
            "Set `moduleResolution: node10`",
            "Add `\"node\"` to the `lib` array",
          ],
          correctIndex: 0,
          explanation:
            "Automatically including every package under `node_modules/@types` was slow and unpredictable, so global type packages must now be listed. `\"types\": [\"*\"]` restores the old behaviour, but an explicit list is faster.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-tsconfig-strictness-q6",
          prompt:
            "Why is this an error under `isolatedModules`?\n\n```ts\nimport { User, createUser } from \"./user\"; // User is an interface\nexport { User, createUser };\n```",
          options: [
            "A single-file transpiler can't tell that `User` is only a type, so it would emit an export of a binding that doesn't exist at runtime",
            "Interfaces can never be re-exported",
            "`isolatedModules` forbids re-exports entirely",
            "`createUser` must be exported with `export default`",
          ],
          correctIndex: 0,
          explanation:
            "TypeScript reports \"Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'\". Writing `export type { User }` (or `export { type User, createUser }`) tells every tool the name can be dropped.",
        },
        {
          id: "ts-tsconfig-strictness-q7",
          prompt: "Node.js 24 can run `node app.ts` directly using type stripping. Which statements are true? (Select all that apply.)",
          options: [
            "Node doesn't type-check; it only removes type syntax, so `tsc --noEmit` still belongs in CI",
            "Node ignores `tsconfig.json`, so `paths` aliases don't work at runtime",
            "Enums and parameter properties fail at runtime, which `erasableSyntaxOnly` catches at compile time instead",
            "Relative imports may omit the `.ts` extension, as with bundlers",
            "Type-only imports work without the `type` keyword, because Node reads the types",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Type stripping replaces types with whitespace and nothing more: no checking, no config, no code generation. Extensions are mandatory, and a type imported without `type` is treated as a value import that fails at runtime, which `verbatimModuleSyntax` catches.",
        },
        {
          id: "ts-tsconfig-strictness-q8",
          prompt:
            "Your lint setup uses typescript-eslint's type-aware rules, and you want TypeScript 7.0's faster `tsc` in CI. What does the 7.0 release recommend?",
          options: [
            "Run 7.0's `tsc`, and alias the `typescript` dependency to `@typescript/typescript6` so tools that need the compiler API keep working until 7.1 ships a new API",
            "Nothing: typescript-eslint uses 7.0's API automatically",
            "Stay on 5.9, because 7.0 can't be installed next to another version",
            "Rewrite the lint rules against the Go compiler's internals",
          ],
          correctIndex: 0,
          explanation:
            "TypeScript 7.0 doesn't expose a programmatic API yet, so the team published `@typescript/typescript6` (with a `tsc6` binary) to run side by side. Code that compiles cleanly on 6.0 should compile identically on 7.0.",
        },
        {
          id: "ts-tsconfig-strictness-q9",
          prompt:
            "Under `strict`, what happens?\n\n```ts\ntry {\n  risky();\n} catch (e) {\n  console.log(e.message);\n}\n```",
          options: [
            "Compile error: `e` is `unknown` (`useUnknownInCatchVariables`), because JavaScript can throw any value",
            "It compiles, and `e` is `Error`",
            "It compiles, and `e` is `any`",
            "Compile error: catch clauses need a type annotation",
          ],
          correctIndex: 0,
          explanation:
            "Narrow first, for example `if (e instanceof Error) console.log(e.message)`. The only annotations allowed on a catch variable are `unknown` and `any`, because TypeScript can't know what was thrown.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-tsconfig-strictness-q10",
          prompt:
            "A project's `tsconfig.json` sits at the repo root with `\"include\": [\"src\"]` and `\"outDir\": \"dist\"`, and no `rootDir`. On TypeScript 5.9 it emitted `dist/index.js`. What does TypeScript 7.0 do?",
          options: [
            "It reports error TS5011 asking for an explicit `rootDir`, because `rootDir` now defaults to the config's folder, which would put output in `dist/src/`",
            "It emits `dist/index.js` exactly as before",
            "It ignores `outDir` and writes JavaScript next to the sources",
            "It refuses to build until `outFile` is set",
          ],
          correctIndex: 0,
          explanation:
            "Since 6.0, `rootDir` is no longer inferred from the common source directory. Setting `\"rootDir\": \"./src\"` restores the old layout (and `outFile` has been removed entirely).",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "ts-react-components-hooks",
      moduleId: "fe-typescript",
      trackId: "frontend",
      title: "Typing React Components & Hooks",
      summary:
        "Typing React is mostly typing props. Declare them as an object type and destructure in the signature; `React.FC` is no longer harmful (since React 18's types it doesn't add an implicit `children`), but it adds little. For children use `React.ReactNode`, the widest renderable type (elements, strings, numbers, arrays, `null`), not `React.JSX.Element`, which allows exactly one element; React 19's types also dropped the global `JSX` namespace, so bare `JSX.Element` no longer resolves. To wrap a native element, extend `React.ComponentProps<\"button\">` and spread the rest onto it; to reuse another component's props, use `React.ComponentProps<typeof Other>`. In React 19, function components receive `ref` as an ordinary prop, so `forwardRef` and its awkward generics are no longer needed.\n\nHooks are generic and mostly infer. `useState(0)` is `number`, but empty initial values need a type argument: `useState<User | null>(null)`, and `useState<string[]>([])`, which would otherwise be `never[]`. `useRef<HTMLInputElement>(null)` returns a `RefObject<HTMLInputElement | null>` to pass to `ref`, and in React 19's types every ref is mutable and `useRef` requires an argument. Type reducer actions as a discriminated union so each `case` narrows the payload, and let `useReducer` infer from the reducer. For context, prefer a `null` default plus a custom hook that throws outside the provider over `createContext({} as Value)`.\n\nEvent handlers use React's synthetic event types (`React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`), or `React.ComponentProps<\"input\">[\"onChange\"]` for a whole handler; inline handlers infer theirs. Generic components (`function List<T>(props: ListProps<T>)`) keep item types flowing into render props. The recurring senior concern is API design: discriminated-union props (`{ variant: \"link\"; href: string } | { variant: \"button\"; onClick: () => void }`) make invalid combinations unrepresentable, which beats a bag of optional props.",
      level: "advanced",
      estMinutes: 200,
      isMilestone: true,
      webRefs: [
        { label: "react.dev: Using TypeScript", url: "https://react.dev/learn/typescript", kind: "docs" },
        { label: "React 19 Upgrade Guide: TypeScript changes", url: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide#typescript-changes", kind: "docs" },
        {
          label: "React TypeScript Cheatsheet: Typing Component Props",
          url: "https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/basic_type_example/",
          kind: "article",
        },
        { label: "sudheerj: React interview questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Practical TypeScript – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=JHEB7RhJG1Y",
        videoId: "JHEB7RhJG1Y",
        durationLabel: "9:34:51",
        startSeconds: 24438,
        chapterLabel: "Chapter 10: React with TypeScript",
      },
      alternateVideos: [
        {
          title: "Blazing Fast Tips: React & TypeScript",
          channel: "Matt Pocock",
          url: "https://www.youtube.com/watch?v=37PafxU_uzQ",
          videoId: "37PafxU_uzQ",
          durationLabel: "6:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ts-react-components-hooks-q1",
          prompt:
            "Which usages compile? (Select all that apply.)\n\n```tsx\nfunction Card({ children }: { children: React.ReactNode }) {\n  return <div>{children}</div>;\n}\nfunction Strict({ children }: { children: React.JSX.Element }) {\n  return <div>{children}</div>;\n}\n```",
          options: [
            "`<Card>hello {42} {null}</Card>`",
            "`<Strict><span /></Strict>`",
            "`<Strict>hello</Strict>`",
            "`<Strict><span /><span /></Strict>`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`ReactNode` covers everything React can render, including text, numbers and `null`. `JSX.Element` is exactly one element: text isn't an element, and two children arrive as an array.",
        },
        {
          id: "ts-react-components-hooks-q2",
          prompt:
            "What happens?\n\n```tsx\nconst [items, setItems] = useState([]);\nsetItems([\"a\"]);\n```",
          options: [
            "Compile error: `items` is inferred as `never[]`, so nothing can be added; write `useState<string[]>([])`",
            "It compiles, and `items` is `any[]`",
            "It compiles, and `items` is `unknown[]`",
            "It compiles, because TypeScript infers `string[]` from the later `setItems` call",
          ],
          correctIndex: 0,
          explanation:
            "Under `strict`, an empty array literal with no contextual type is `never[]`, and inference never looks ahead to later calls. Likewise `useState(null)` is typed `null` forever unless you pass `<User | null>`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-react-components-hooks-q3",
          prompt: "Which statements about `useRef` with React 19's types are true? (Select all that apply.)",
          options: [
            "`useRef<HTMLInputElement>(null)` returns `RefObject<HTMLInputElement | null>`, ready to pass to `ref`",
            "`const t = useRef<number>(0); t.current = 5;` compiles",
            "Changing `ref.current` doesn't trigger a re-render",
            "`useRef<number>()` with no argument compiles",
            "`useRef<number>(null)` gives a read-only `current`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "React 19's types made `useRef` require an argument and made every `RefObject` mutable; the `null` overload just adds `| null`. Refs are mutable boxes outside the render cycle, so writing to them never re-renders.",
        },
        {
          id: "ts-react-components-hooks-q4",
          prompt:
            "You're building `<Button variant=\"primary\" />` that must accept every native `<button>` prop (`type`, `disabled`, `onClick`, `aria-*`…). Which props type is the idiomatic choice?",
          options: [
            "`React.ComponentProps<\"button\"> & { variant: \"primary\" | \"ghost\" }`, spreading the rest onto `<button>`",
            "`React.HTMLAttributes<HTMLElement> & { variant: string }`",
            "`{ [key: string]: any; variant: string }`",
            "`React.ButtonHTMLAttributes<HTMLButtonElement>` extended through declaration merging",
          ],
          correctIndex: 0,
          explanation:
            "`ComponentProps<\"button\">` is exactly what JSX accepts for `<button>`, including `ref`, which React 19 passes as a normal prop. Generic `HTMLAttributes<HTMLElement>` lacks button-specific props like `type` and `disabled`, and an index signature gives up type checking.",
        },
        {
          id: "ts-react-components-hooks-q5",
          prompt: "In React 19, how does a function component let its parent attach a ref to the inner `<input>`?",
          options: [
            "Accept `ref` as an ordinary prop (typed via `React.ComponentProps<\"input\">`) and pass it to `<input>`; `forwardRef` is no longer needed",
            "Wrap the component in `forwardRef`, exactly as in React 18",
            "Refs can only be attached to class components",
            "Call `useImperativeHandle` without accepting any prop",
          ],
          correctIndex: 0,
          explanation:
            "React 19 passes `ref` through to function components like any other prop, which also removes `forwardRef`'s awkward interaction with generic components. `forwardRef` still works but is on its way out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-react-components-hooks-q6",
          prompt: "Which handler typings are correct? (Select all that apply.)",
          options: [
            "`(e: React.ChangeEvent<HTMLInputElement>) => void` for an `<input>`'s `onChange`",
            "`(e: React.FormEvent<HTMLFormElement>) => void` for a `<form>`'s `onSubmit`",
            "`React.ComponentProps<\"input\">[\"onChange\"]` as the type of a whole handler",
            "`(e: Event) => void` for a `<button>`'s `onClick`",
            "`(e: React.MouseEvent<HTMLDivElement>) => void` for a `<button>`'s `onClick`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "React passes synthetic events, not DOM `Event`s, so a DOM `Event` handler doesn't type-check, and the element type parameter must match the element (it types `currentTarget`). Indexing `ComponentProps` is a handy way to type an extracted handler.",
        },
        {
          id: "ts-react-components-hooks-q7",
          prompt:
            "What is the type of `item` in the `render` callback?\n\n```tsx\ntype ListProps<T> = { items: T[]; render: (item: T) => React.ReactNode };\nfunction List<T>({ items, render }: ListProps<T>) {\n  return <ul>{items.map(render)}</ul>;\n}\n\n<List items={[{ id: 1, name: \"Ada\" }]} render={(item) => item.name.toUpperCase()} />;\n```",
          options: [
            "`{ id: number; name: string }`, inferred from `items` just like a generic function call",
            "`unknown`, because JSX elements can't infer type arguments",
            "`any`",
            "A compile error: generic components need an explicit `<List<User>>`",
          ],
          correctIndex: 0,
          explanation:
            "A JSX element is type-checked like a call to the component, so `T` is inferred from `items` and flows into `render`. You can still pass type arguments explicitly (`<List<User> … />`) when inference isn't enough.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-react-components-hooks-q8",
          prompt:
            "Why is `createContext<Theme | null>(null)` plus a `useTheme()` hook that throws on `null` preferred over `createContext({} as Theme)`?",
          options: [
            "`{} as Theme` lies: a consumer rendered outside the provider gets an empty object typed as a full `Theme` and fails later, while the throwing hook fails fast and returns a non-null type",
            "`createContext` doesn't accept object defaults",
            "Type assertions with `as` aren't allowed in `.tsx` files",
            "Contexts with object defaults re-render every consumer on each render",
          ],
          correctIndex: 0,
          explanation:
            "The assertion silences the compiler without providing the data. The `null` default makes the missing-provider case explicit, and the custom hook narrows it once for every consumer. (In `.tsx`, only the angle-bracket `<Theme>value` assertion syntax is unavailable.)",
        },
        {
          id: "ts-react-components-hooks-q9",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```tsx\ntype State = { count: number };\ntype Action = { type: \"inc\"; by: number } | { type: \"reset\" };\nfunction reducer(state: State, action: Action): State {\n  switch (action.type) {\n    case \"inc\":\n      return { count: state.count + action.by };\n    case \"reset\":\n      return { count: 0 };\n    default: {\n      const unreachable: never = action;\n      throw new Error(`Unknown action: ${JSON.stringify(unreachable)}`);\n    }\n  }\n}\nconst [state, dispatch] = useReducer(reducer, { count: 0 });\n```",
          options: [
            "`dispatch({ type: \"inc\" })` is a compile error, because `by` is missing for that variant",
            "Inside `case \"inc\":`, `action.by` is typed `number`",
            "With React 19's types, `useReducer` infers state and action types from `reducer`; passing `React.Reducer<State, Action>` as a type argument no longer compiles",
            "The `never` assignment alone rejects unknown actions at runtime, even without the `throw`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The discriminant narrows each `case`, and `dispatch` accepts only valid action shapes. The `never` assignment is purely a compile-time exhaustiveness check; the `throw` is what handles an unexpected action at runtime.",
        },
        {
          id: "ts-react-components-hooks-q10",
          prompt: "Which statements about React 19's TypeScript types are true? (Select all that apply.)",
          options: [
            "The global `JSX` namespace is gone; use `React.JSX.Element`",
            "`React.ReactElement[\"props\"]` defaults to `unknown` rather than `any`",
            "A ref callback written as `ref={(el) => (node = el)}` is a type error, because a returned value would be treated as a cleanup function",
            "`React.FC` adds an implicit `children` prop",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "React 19 scoped `JSX` under `React`, tightened element props to `unknown`, and gave ref callbacks cleanup semantics, so implicit returns are rejected. `React.FC` stopped adding `children` back in React 18's types.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ts-react-components-hooks-q11",
          prompt:
            "Given `type Props = { variant: \"link\"; href: string } | { variant: \"button\"; onClick: () => void };` for a component `Action`, which usages compile? (Select all that apply.)",
          options: [
            "`<Action variant=\"link\" href=\"/docs\" />`",
            "`<Action variant=\"button\" onClick={() => {}} />`",
            "`<Action variant=\"link\" onClick={() => {}} />`",
            "`<Action href=\"/docs\" />`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Each variant requires its own props, and excess property checking rejects `onClick` on the link variant. Without `variant`, TypeScript can't pick a member, so the element fails to type-check.",
        },
      ],
    },
  ],
} satisfies Module;
