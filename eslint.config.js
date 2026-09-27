import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/**
 * A deliberately tiny flat config.
 *
 * It exists for one rule — no native `alert` / `confirm` / `prompt` in app code — added in U3 when
 * those nine dialogs were replaced by `useConfirm`. Turning on a full recommended ruleset here
 * would bury that one signal under hundreds of pre-existing warnings nobody asked for, so the
 * broader linting decision is left to whoever wants to make it deliberately.
 *
 * The TypeScript parser is here only so the rule can see `.ts`/`.tsx`; no type-aware rules run, so
 * `npm run lint` stays fast and needs no project service. The typescript-eslint plugin is
 * registered but left switched off, purely so the `eslint-disable` comments already in the server
 * resolve to a real rule name instead of erroring as unknown.
 */
export default [
  {
    ignores: [
      "dist/**",
      "dist-server/**",
      "coverage/**",
      "public/**",
      "data/**",
      "node_modules/**",
      /*
       * `src/content/**` is curriculum data, not application code. Nine of the eighteen `alert(`
       * matches in this repo live in there, inside quiz questions, where `alert("…")` *is* the
       * subject being taught — "what does this snippet log?". Linting them would demand a rewrite
       * of content that 289 tests and `npm run content:check` exist to protect. They are never
       * executed as application code, so the rule has nothing to protect there either.
       */
      "src/content/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: {
      // The ruleset here is deliberately narrow, so a `eslint-disable` comment for a rule this
      // config does not run is not a mistake — it is a note for whoever turns the rest on later.
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      "no-alert": "error",
      "no-restricted-globals": [
        "error",
        {
          name: "alert",
          message: "Native alerts block the page and cannot be styled. Use notify.* from @/lib/toast.",
        },
        {
          name: "confirm",
          message: "Use the useConfirm() hook from @/components/overlays instead of window.confirm.",
        },
        {
          name: "prompt",
          message: "Use the useFormDialog() hook from @/components/overlays instead of window.prompt.",
        },
      ],
    },
  },
];
