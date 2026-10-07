/**
 * The brand face, Outfit (SIL OFL), self-hosted: one variable file per subset covers 400 (text),
 * 500 (labels) and 600 (headings). `font-display: swap` comes with the @fontsource CSS.
 *
 * Imported once by src/main.tsx, so every page (both designs, the sign-in pages) declares it.
 * The latin file is preloaded from index.html (vite.config.ts `brandFontPreload`), so headings
 * don't wait for the CSS to discover it.
 */
import "@fontsource-variable/outfit/wght.css";
