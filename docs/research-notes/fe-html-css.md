# HTML & CSS Foundations research notes (2026-09-21)

## Videos
All ids checked with `node scripts/research/yt.mjs info <id> [--chapters]` (embeddable: true for every entry).

- html-semantic-structure: HTML Tutorial - Website Crash Course for Beginners (freeCodeCamp.org, 45:19); verified in the brief. Alternates: Kevin Powell "HTML section elements are a lie (sort of)" (7:59, section/region landmarks) and "The most common HTML mistake //  The incorrect use of HTML heading levels" (15:49; the double space is in the real title).
- html-forms-validation: How to set custom error messages for your HTML forms (Kevin Powell, 39:26, Sep 2025); covers the Constraint Validation API, which the crash course doesn't. Alternates: the crash course from "Forms and Input Elements" at 24:24 (1464 s), and Web Dev Simplified "Learn HTML Forms In 25 Minutes" (24:55).
- html-accessibility-fundamentals: The Only Accessibility Video You Will Ever Need (Web Dev Simplified, 37:32, Nov 2024). Alternates: Kevin Powell "Why you shouldn't use a div for everything…" (31:46, div vs button), freeCodeCamp "Learn Accessibility - Full a11y Tutorial" (1:33:05).
- html-tables-media: Make Your Site Lightning Fast With Responsive Images (Web Dev Simplified, 14:13). Alternates: Kevin Powell "How to create a responsive HTML table" (27:19) and "srcset and sizes attributes" (30:08, 2018 but still accurate).
- css-box-model: CSS Tutorial – Full Course for Beginners (freeCodeCamp.org / Dave Gray, 11:08:10), from Chapter 5: Box Model at 1:11:56 (4316 s).
- css-selectors-specificity (code): These CSS features give us more control on the cascade and specificity (Kevin Powell, 42:54, Apr 2024); covers order, specificity, :is/:where/:has and layers, so it beats the 2022 course's selectors chapter. Alternates: Kevin Powell "CSS Specificity explained" (13:27) and the course's Chapter 2: Selectors at 0:14:50 (890 s).
- css-flexbox: Learn flexbox the easy way (Kevin Powell, 34:04). Alternate: course Chapter 14: Flexbox at 3:57:53 (14273 s).
- css-grid: Learn CSS Grid the easy way (Kevin Powell, 37:03). Alternates: course Chapter 15: Grid Layout at 4:21:39 (15699 s); Kevin Powell "Easy and more consistent layouts using subgrid" (8:01).
- css-responsive-media-queries (code): course Chapter 17: Media Queries at 5:32:40 (19960 s). Alternate: Kevin Powell "Learn how to use Media queries & Container queries" (34:32, Jan 2024), which covers range syntax and container queries that the 2022 chapter predates.
- css-custom-properties: course Chapter 20: Variables at 6:52:56 (24776 s). Alternate: Kevin Powell "Using CSS custom properties like this is a waste" (16:12).
- css-transitions-animations: course Chapter 22: Animations at 7:50:05 (28205 s). Alternates: Kevin Powell "10 CSS animation tips and tricks" (20:13), "We can now transition to and from display: none" (21:19).
- css-architecture-bem-utility: course Chapter 23: Organization at 8:37:33 (31053 s); the lesson files (github.com/gitdagray/css_course/23_lesson) confirm it teaches CSS organisation with BEM. Alternates: Adam Wathan "Why you don't need BEM with utility-first CSS" (7:01), Kevin Powell "Why I use the BEM naming convention for my CSS" (7:03) and his cascade layers video (17:44).
- css-bootstrap-sass: Learn Bootstrap 5 and SASS by Building a Portfolio Website - Full Course (freeCodeCamp.org, 5:02:23), from "Part 2-1: SASS Setup" at 2:13 (133 s). Alternate: Kevin Powell "Stop using @import with Sass | @use and @forward explained" (13:12), because the 2021 course uses `@import`.
- No search-URL fallbacks.

Brief discrepancies: the Bootstrap video is 5:02:23 (the brief says 14:11:43) and its real title ends in "- Full Course"; the HTML crash course is 45:19 (brief: 45:20). The CSS course has 25 chapter markers (Intro + 24 chapters), as expected.

Late in the session YouTube started returning watch pages without player data (lengthSeconds 0, no chapters) while oEmbed still worked; a final oEmbed pass re-confirmed every title, channel and embeddable flag, and durations/chapter starts come from the earlier successful `info --chapters` runs.

## References
- Every URL was checked with `scripts/research/check-urls.mjs`; all 55 return 200 at the URL used (MDN's old paths redirect to the new `/Learn_web_development/…`, `/Web/CSS/Guides/…` and `/Reference/…` paths, which are what the module uses).
- w3.org (WCAG, APG, TR specs) serves a Cloudflare challenge (403) to scripted clients, so spec links use the editor's drafts on `drafts.csswg.org` and `w3c.github.io` (WCAG 2.2, Using ARIA, ARIA in HTML). `w3c.github.io/aria-practices/` is only a "Content Moved" stub, so the APG isn't linked.
- The invalid-at-computed-value-time definition moved from css-variables-1 to `drafts.csswg.org/css-values-5/#invalid-at-computed-value-time`.
- getbem.com didn't resolve (DNS failure) and `en.bem.info/methodology/…` pages 404, so BEM is covered by MDN "Organizing your CSS" and the videos.
- `web.dev/learn/css/media-queries` is a 404; not used.
- Iframe previews: MDN (X-Frame-Options DENY), web.dev (CSP frame-ancestors self), CSS-Tricks and YouTube channel pages (SAMEORIGIN) block framing. drafts.csswg.org, w3c.github.io, html.spec.whatwg.org, joshwcomeau.com, getbootstrap.com, sass-lang.com and adamwathan.me allow it.

## Facts verified
- Baseline dates (MDN, Sep 2026): `:has()` Dec 2023, subgrid Sep 2023, `:user-invalid` Nov 2023, `@property` Jul 2024, `@starting-style` and `transition-behavior` Aug 2024, `fetchpriority` Oct 2024, `@scope` Mar 2026; `@layer`, `@container`, `inert` widely available; `interpolate-size` limited.
- Stacking context triggers incl. `container-type`, `position: sticky`, individual transform properties (MDN Stacking context page). `overflow: clip` doesn't create a BFC (MDN BFC page).
- `pattern` is anchored and compiled with the `v` flag since mid-2023 (MDN). `tooShort` only applies after user edits (MDN ValidityState). `checkValidity()` fires `invalid` (MDN). `:focus-visible` heuristics incl. text inputs (MDN).
- Header/footer landmark scoping and "naming prohibited" on generic (ARIA in HTML); section is a region only with an accessible name. Only one `<main>` without `hidden` (HTML Standard). The standard removed the nested-`<h1>` UA styles in May 2025 (MDN heading elements). Dialog `closedby` defaults to `closerequest` for `showModal()` (MDN).
- Quirks mode: unitless lengths for `width` etc. (CSS Values 4, Quirky Lengths) and table font properties reset (HTML rendering section).
- WCAG 2.2: new criteria 2.4.11, 2.5.8 (24×24 CSS px), 3.3.8; 4.1.1 removed; contrast 4.5:1 / 3:1 AA, 7:1 / 4.5:1 AAA. `#767676` on white computed as 4.54:1.
- Media Queries 4: `em` relative to the initial font size; empty list is true; a grammar error turns only that query into `not all`; unknown features/values use Kleene logic and an unknown query is false; `min-`/`max-` on discrete features is an unknown feature; unknown media type is false but `not <unknown>` is true. MQ5: `prefers-color-scheme` has no false value in boolean context; `no-preference` is false for `prefers-reduced-motion`.
- CSS Values 5: invalid-at-computed-value-time falls back to the inherited or initial value (not an earlier declaration).
- Tailwind v4 emits `@layer theme, base, components, utilities` (tailwindcss.com preflight docs).
- Bootstrap: npm latest 5.3.8; docs still use `@import` and say Dart Sass deprecation warnings can be ignored; overrides go after `functions` and before `variables`; breakpoints 576/768/992/1200/1400; `media-breakpoint-down(md)` is `max-width: 767.98px`; jQuery optional; Popper for dropdowns/popovers/tooltips; tooltips are opt-in.
- Sass: npm latest 1.104.1; `@import` and global built-ins deprecated in Dart Sass 1.80.0, removal no sooner than two years later in 3.0; `sass:color` omits `darken()` (equivalent `color.adjust($c, $lightness: -$amount, $space: hsl)`); `@use` must precede other rules except `@forward` and variable declarations.
- Code challenges: both reference solutions pass all tests (`npm run content:check`), and each was also run against extra cases in a scratch harness (33 selectors, 40 media queries).
