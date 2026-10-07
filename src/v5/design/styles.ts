/**
 * The v5 stylesheet side effects: the code font and the scoped tokens. Imported by the barrel
 * (`index.ts`) and by `DesignPage`; only v5 code reaches it, so it lands in the lazy v5 CSS chunk.
 */
// Outfit (the brand face) is global since the rebrand: src/fonts/brandFonts.ts, from src/main.tsx.
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./tokens.css";
