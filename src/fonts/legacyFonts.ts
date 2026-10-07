/**
 * The previous design's code font.
 *
 * Rebrand Phase 1: the brand face, Outfit, is global now (src/fonts/brandFonts.ts, imported by
 * src/main.tsx) because both designs and the sign-in pages use it. The old route tree
 * (`LegacyRoutes`) and the sign-in pages (`AuthPages`) still import this file for the code font,
 * JetBrains Mono, which replaced IBM Plex Mono. Sora and IBM Plex Sans are gone.
 */
import "@fontsource-variable/jetbrains-mono/wght.css";
