# Oyelearn logo kit

All logos have transparent backgrounds unless noted. SVG is the master; PNGs are exported at several widths (`@400w` = 400 px wide).

## Colours
| Use | Mark | "Oye" | "learn" |
|---|---|---|---|
| light-mode (on white/light bg) | #1D4ED8 | #1D4ED8 | #0F172A |
| dark-mode (on dark bg) | #60A5FA | #60A5FA | #FFFFFF |
| mono-white / mono-black | single colour | | |

App tile blue: #1D4ED8. Font: Sora Bold (text is outlined in the SVGs, no font needed).

## Folders
- `web/horizontal` – mark + wordmark side by side (headers, navbars)
- `web/stacked` – mark above wordmark (login screens, footers)
- `web/mark` – icon only
- `web/wordmark` – text only
- `favicon` – favicon.svg (auto light/dark), .ico, PNGs, apple-touch-icon, site.webmanifest
- `app/ios` – AppIcon sizes (square, no transparency — iOS rounds corners itself)
- `app/android` – legacy mipmaps + adaptive icon (foreground PNG/SVG + background colour XML)
- `app/pwa` – 192/512 + maskable
- `app/splash` – light & dark splash screens
- `social` – 1200×630 Open Graph image

## Web snippet
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

<picture>
  <source srcset="/oyelearn-horizontal-dark-mode.svg" media="(prefers-color-scheme: dark)">
  <img src="/oyelearn-horizontal-light-mode.svg" alt="Oyelearn" height="40">
</picture>
```
