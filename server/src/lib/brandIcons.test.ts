import { describe, expect, test } from "vitest";

import { BRAND_ICON_PATH, SHARED_IMAGE_PATH } from "./brandIcons";

describe("BRAND_ICON_PATH", () => {
  test.each(["/favicon.ico", "/favicon.svg", "/favicon-32x32.png", "/apple-touch-icon.png", "/icon-192.png", "/icon-maskable-512.png", "/og-image.png", "/og-image-dark.png", "/brand/logo/oyelearn-light.svg", "/brand/loader.svg", "/brand/email/email-header-light@600w.png", "/brand/email/email-header-dark%401200w.png"])(
    "%s gets the icon cache",
    (p) => expect(BRAND_ICON_PATH.test(p)).toBe(true),
  );
  test.each(["/site.webmanifest", "/sw.js", "/index.html", "/assets/index-abc.js", "/brand/notes.txt", "/learn"])("%s does not", (p) => {
    expect(BRAND_ICON_PATH.test(p)).toBe(false);
  });
});

describe("SHARED_IMAGE_PATH (cross-origin images: email and OG)", () => {
  test.each(["/og-image.png", "/og-image-dark.png", "/brand/email/email-header-light@600w.png", "/brand/email/oyelearn-mark-dark%4064w.png", "/brand/social/og-image-blue.png"])("%s is shared", (p) => {
    expect(SHARED_IMAGE_PATH.test(p)).toBe(true);
  });
  test.each(["/favicon.ico", "/brand/logo/oyelearn-light.svg", "/brand/email/../x.png", "/index.html"])("%s is not", (p) => {
    expect(SHARED_IMAGE_PATH.test(p)).toBe(false);
  });
});
