/**
 * The v5 stylesheet side effects: self-hosted fonts and the scoped tokens. Imported by the barrel
 * (`index.ts`) and by `DesignPage`; only v5 code reaches it, so it lands in the lazy v5 CSS chunk.
 */
import "@fontsource-variable/geist/wght.css";
// Sora is v5's display face. Until Phase 9 it came from src/main.tsx for both designs; the same four
// weights are declared here now, so v5 looks the same without the old UI's IBM Plex fonts.
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./tokens.css";
