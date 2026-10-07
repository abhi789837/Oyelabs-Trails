# Oyelearn brand kit (v1.0)

**The idea: "Learning never closes."** The outer blue ring is Oyelabs. The amber inner ring is your progress, drawn about 75% of the way round, with a dot just ahead of it: you are here. The ring never closes, because there's always a next level. The mark is also the **O** in Oyelearn.

Open `Oyelearn-Brand-Guidelines.pdf` first.

## Colours
| Name | Hex | Use |
|---|---|---|
| Oyelabs Blue | #2067D3 | Primary (about 60%) |
| Night Navy | #0B2347 | Text and dark surfaces |
| Amber | #F59E0B | Progress, achievements, the inner ring and dot (use sparingly) |
| Sky | #5F93E3 | Blue on dark backgrounds |
| Night | #0A1428 | Dark-mode background |
| Mist | #E1EBFA | Tints and surfaces |
| Cloud | #F4F7FB | Page background |
| Slate | #5B6B82 | Secondary text |

**Font:** Outfit (Google Fonts, SIL OFL). Use Semibold 600 for headings and Regular 400 for body text. The logo files have the text converted to outlines, so no font is needed to use them.

## Folders
- `01-logo/`: the primary logo (the ring is the O), the "by Oyelabs" version and the tagline version. Each comes in light, dark, white, black and on-blue, as SVG plus PNG at 400, 800 and 1600 px wide.
- `02-mark/`: the mark on its own, in every colour, as SVG plus PNG at 64, 256, 512 and 1024 px.
- `03-app/`: app icons (blue, dark and white), every iOS AppIcon size, Android mipmaps plus an adaptive icon, and PWA icons (192, 512 and maskable).
- `04-favicon/`: `favicon.svg` (switches automatically for dark mode), `.ico`, PNGs, `apple-touch-icon.png` and `site.webmanifest`.
- `05-web/`: the sign-in side panel and a full sign-in page mockup, OG images and email headers (light, dark and blue).
- `06-social/`: LinkedIn banners, X/Twitter headers and profile avatars.
- `07-presentation/`: title slides and Teams/Zoom backgrounds (1920×1080).
- `08-email/`: an email signature (replace `[Your Name]` and `[Role]`).
- `09-print/`: a certificate template (A4 landscape SVG, PDF and PNG with placeholders) and a round sticker.
- `10-motion/`: `loader.svg`, an animated loader where the ring draws but never closes. It respects reduced-motion settings.
- `11-code/`: `OyelearnMark.tsx`, `OyelearnLoader.tsx` and `tokens.css`.

## Web snippet
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#2067D3">
<picture>
  <source srcset="/brand/oyelearn-dark.svg" media="(prefers-color-scheme: dark)">
  <img src="/brand/oyelearn-light.svg" alt="Oyelearn" height="32">
</picture>
```

## Rules
- Keep clear space equal to half the height of the ring.
- Minimum sizes: the logo at 96 px wide, the mark at 16 px.
- Never add a second "O" after the mark.
- Never stretch, rotate, recolour or add effects to the logo.
