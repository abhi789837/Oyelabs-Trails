import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// The brand font (Outfit) is global; the code font loads with the design that uses it (Phase 9
// performance): src/fonts/legacyFonts.ts for the previous design and the sign-in pages,
// src/v5/design/styles.ts for v5.
import "./fonts/brandFonts";
import "./index.css";

import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
