import { describe, expect, test } from "vitest";

import { BRAND_ICON_PATH } from "./brandIcons";

describe("BRAND_ICON_PATH", () => {
  test.each(["/favicon.ico", "/favicon.svg", "/favicon-32x32.png", "/apple-touch-icon.png", "/icon-192.png", "/icon-maskable-512.png", "/og-image.png", "/og-image-dark.png", "/brand/logo/oyelearn-light.svg", "/brand/loader.svg"])(
    "%s gets the icon cache",
    (p) => expect(BRAND_ICON_PATH.test(p)).toBe(true),
  );
  test.each(["/site.webmanifest", "/sw.js", "/index.html", "/assets/index-abc.js", "/brand/notes.txt", "/learn"])("%s does not", (p) => {
    expect(BRAND_ICON_PATH.test(p)).toBe(false);
  });
});
