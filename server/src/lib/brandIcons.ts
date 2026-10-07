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
