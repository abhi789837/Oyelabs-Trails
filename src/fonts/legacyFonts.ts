/**
 * The previous design's fonts (Sora for headings, IBM Plex Sans for text, IBM Plex Mono for code).
 *
 * Phase 9 performance: these used to be imported by `src/main.tsx` for every page, so a v5 page
 * declared them and downloaded IBM Plex Sans for its loading screen. Now only the trees that use
 * them import this file: the old route tree (`LegacyRoutes`) and the sign-in pages (`AuthPages`),
 * which both designs share. v5 declares its own (Geist, JetBrains Mono, and Sora for display) in
 * `src/v5/design/styles.ts`. The old UI looks exactly as before.
 */
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/400-italic.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
