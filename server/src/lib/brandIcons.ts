/**
 * Rebrand Phase 2: the brand kit's favicons, app icons, OG images and `public/brand/` files. They keep
 * stable names, so the server sends them with a day's cache plus a background revalidate (the static
 * default is max-age=0); index.html links them with `?v=2` so the previous logo isn't kept.
 */
export const BRAND_ICON_PATH = /^\/(favicon(-\d+x\d+)?\.(ico|svg|png)|apple-touch-icon\.png|icon-(192|512|maskable-512)\.png|og-image(-dark)?\.png|brand\/(?:[\w./@-]|%40)+\.(svg|png))$/;

export const BRAND_ICON_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

/**
 * Rebrand Phase 6: images other sites and apps load from us: the email header and mark (mail apps
 * render them outside our origin) and the OG images (crawlers). They get
 * `Cross-Origin-Resource-Policy: cross-origin` instead of helmet's `same-site`, which a mail app's
 * web view would otherwise be entitled to block.
 */
export const SHARED_IMAGE_PATH = /^\/(og-image(-dark)?\.png|brand\/(email|social)\/(?:[\w.@-]|%40)+\.png)$/;

/**
 * Rebrand Phase 7: the email images have "@" in their names. The static server only knows the
 * literal names, so a client (or a mail proxy) that sends "@" percent-encoded as "%40" fell through
 * to the SPA and got index.html with a 200. This gives the canonical address to redirect to, or
 * null when the request isn't a brand file written with "%40".
 */
export function brandFileRedirect(url: string): string | null {
  const [pathname, ...rest] = url.split("?");
  if (!pathname.startsWith("/brand/") || !/%40/i.test(pathname)) return null;
  const canonical = pathname.replace(/%40/gi, "@");
  if (canonical.includes("%") || canonical.includes("..") || !BRAND_ICON_PATH.test(canonical)) return null;
  return rest.length ? `${canonical}?${rest.join("?")}` : canonical;
}

/**
 * Rebrand Phase 7: Vite's hashed build files (`/assets/<name>-<8-char hash>.<ext>`, the brand font
 * among them) never change under a given name, so they are cached for a year as immutable. The
 * static default was `max-age=0`, and Caddyfile.example's `@hashed` rule expects a `.hash.` name, which
 * Vite 8 doesn't write. Only a real file gets it: the caller checks for a 200 that isn't HTML, so the
 * SPA fallback for a missing asset is never cached.
 */
export const HASHED_ASSET_PATH = /^\/assets\/[\w.-]+-[A-Za-z0-9_-]{8}\.(js|css|woff2?|ttf|svg|png|jpe?g|webp|wasm)$/;

export const HASHED_ASSET_CACHE = "public, max-age=31536000, immutable";
