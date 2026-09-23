# PDF fonts

TrueType copies of the brand fonts, used only by the certificate PDF (`@react-pdf/renderer`).
fontkit can't parse the IBM Plex Mono WOFF files that `@fontsource` ships, so all of them were
converted from the `@fontsource` WOFF files (latin subset) to TTF, byte-for-byte table data.

Sora and IBM Plex are licensed under the SIL Open Font License 1.1 (see the LICENSE files).

Sora is the brand face and is converted by `scripts/woff2ttf.mjs`:

```
node scripts/woff2ttf.mjs node_modules/@fontsource/sora/files/sora-latin-700-normal.woff src/assets/fonts/sora-latin-700.ttf
```
