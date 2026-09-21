# React Practice Projects research notes (2026-09-21)

## Videos
All seven ids from the brief were verified with `scripts/research/yt.mjs info` (oEmbed 200, `embeddable: true`); titles,
channels and durations below are YouTube's own.

- react-capstone-ecommerce: "React Tutorial: Build an e-commerce site from scratch using React and Netlify"
  (freeCodeCamp.org, 6:18:14, Jan 2019, Coding Addict / John Smilga). No chapters. The brief lists 6:18:15; YouTube reports
  6:18:14. Alternates: "React Tutorial: Weather App with RESTful APIs" (2:43:47, Jan 2019, IPenywis; brief says 2:43:48)
  and "React Beginners Tutorial - Build an Autocomplete Text Box" (45:09, Nov 2018, WellPaidGeek). Both practise data
  fetching and search input, which is what a store's catalog and search need.
- react-capstone-quiz-app-ts: "React / Typescript Tutorial - Build a Quiz App" (freeCodeCamp.org, 1:20:01, Jul 2020,
  Thomas Weibenfalk). No chapters. Alternate: "How to Build Tetris in React - GameDev Tutorial (with React Hooks!)"
  (2:34:18, Aug 2019, also Weibenfalk; has chapters): another game-state machine built from Hooks.
- react-capstone-todoist-clone: "Intermediate React Tutorial - Todoist Clone (with Firebase, Custom Hooks, SCSS, React
  Testing)" (freeCodeCamp.org, 7:38:39, Aug 2019, Karl Hadwen). Detailed chapters (testing starts at 4:39:45, accessibility
  at 3:45:10); used from the start. Alternate: "Build a Chat Application using React, Redux, Redux-Saga, and Web Sockets -
  Tutorial" (1:24:54, Jan 2018; chapters): the real-time side of a synced task app.
- No search-URL fallbacks.

## What the walkthroughs actually build (checked in their repos, used in the summaries)
- E-commerce (`john-smilga/react-phone-e-commerce-project`): react-scripts 2.1.1, React 16.6, react-router-dom 4,
  styled-components 4, `react-paypal-express-checkout`. `context.js` is a class `ProductProvider`; `addToCart`/`increment`
  mutate product objects shared by `products` and `cart`; `cartSubTotal`/`cartTax`/`cartTotal` live in state and are
  recomputed in `setState` callbacks; tax is `subTotal * 0.1` then `parseFloat(toFixed(2))`.
- Quiz (`weibenfalk/react-quiz`): the 2020 "finished" commit uses react-scripts 3.4.1 and TypeScript 3.7 (CRA); the repo
  was moved to Vite in July 2024. `shuffleArray` is `[...array].sort(() => Math.random() - 0.5)`; questions come from
  `opentdb.com/api.php`; `QuestionCard` renders question and answers with `dangerouslySetInnerHTML`; `App.tsx` uses six
  `useState` calls.
- Todoist (`karlhadwen/todoist`): react-scripts 3.4.1, Firebase 7, moment, node-sass. Every query is hard-coded to
  `userId == 'jlIFXIwyAL3tzHMtzRbw'` (no auth); dates stored as `DD/MM/YYYY`; NEXT_7 uses
  `moment(task.date, 'DD-MM-YYYY').diff(moment(), 'days') <= 7`, which also includes overdue tasks; `useProjects` has
  `[projects]` as its Effect dependency and compares with `JSON.stringify`. (Its `generatePushId` also never fills the
  random suffix, so ids created in the same millisecond collide; not mentioned in the summary for space.)
- Weather app (`ipenywis/React-Weather-App`): CRA 2, axios, dotenv.

## References
- Block iframe previews: docs.stripe.com (CSP frame-ancestors limited to Stripe hosts), tanstack.com and
  martinfowler.com, vitest.dev and developer.mozilla.org (X-Frame-Options: DENY), github.com (`frame-ancestors 'none'`).
  react.dev, typescriptlang.org, bost.ocks.org, opentdb.com, testing-library.com, vite.dev and playwright.dev allow framing.

## Facts verified
- Create React App sunset: react.dev blog, 2025-02-14.
- Stripe docs (Checkout fulfilment): "Webhooks are required for fulfilment"; you can't rely on the landing page.
- Moment.js docs: "Moment.js is a legacy project in maintenance mode."
- `Math.round(3000 * 0.0725)` is 217 (3000 * 0.0725 = 217.49999999999997) while the exact half-up result is 218; checked
  in Node 24 and used as a test case. At the tutorial's 10% rate, `parseFloat((c / 100 * 0.1).toFixed(2))` differs from
  exact half-up rounding for 1,915 of the first 100,000 cent amounts (e.g. $1.15).
- Challenge expectations were generated from the reference solutions and cross-checked by hand: the Fisher–Yates run for
  seed 42 (`[a, b, c, d]` gives `[a, d, b, c]`; the malformed-question case gives `[Au, Go, Gd, Ag]`), every cart total,
  and every Todoist view.
- The quiz driver's `createRandom` is mulberry32, which uses only 32-bit integer operations and `Math.imul`, so results are
  identical across JavaScript engines.
