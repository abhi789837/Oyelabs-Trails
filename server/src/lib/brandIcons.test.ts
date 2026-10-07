import { describe, expect, test } from "vitest";

import { BRAND_ICON_PATH, HASHED_ASSET_PATH, SHARED_IMAGE_PATH, brandFileRedirect } from "./brandIcons";

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

describe("brandFileRedirect (an encoded @ in an email image address)", () => {
  test("sends %40 to the file's real name, keeping the query", () => {
    expect(brandFileRedirect("/brand/email/email-header-light%40600w.png")).toBe("/brand/email/email-header-light@600w.png");
    expect(brandFileRedirect("/brand/email/oyelearn-mark-dark%4064w.png?v=1")).toBe("/brand/email/oyelearn-mark-dark@64w.png?v=1");
  });
  test.each(["/brand/email/email-header-light@600w.png", "/brand/logo/oyelearn-light.svg", "/learn/%40x", "/brand/email/..%40/x.png", "/brand/email/a%40b%2Fc.png", "/brand/notes%40.txt"])("%s is left alone", (p) => {
    expect(brandFileRedirect(p)).toBeNull();
  });
});

describe("HASHED_ASSET_PATH (Vite's hashed build files)", () => {
  test.each(["/assets/index-D0RfN2Tp.js", "/assets/V5App-c_9x-ab1.css", "/assets/outfit-latin-wght-normal-AbCd1234.woff2", "/assets/ts.worker-D0RfN2Tp.js"])("%s is immutable", (p) => {
    expect(HASHED_ASSET_PATH.test(p)).toBe(true);
  });
  test.each(["/assets/index.js", "/sw.js", "/index.html", "/assets/../index-D0RfN2Tp.js/x", "/brand/logo/oyelearn-light.svg", "/assets/sub/dir/x-D0RfN2Tp.js"])("%s is not", (p) => {
    expect(HASHED_ASSET_PATH.test(p)).toBe(false);
  });
});
