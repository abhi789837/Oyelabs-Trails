# PDF fonts

TrueType copies of the brand fonts, used only by the certificate PDF (`@react-pdf/renderer`).
fontkit can't parse the IBM Plex Mono WOFF files that `@fontsource` ships, so all five were
converted from the `@fontsource` WOFF files (latin subset) to TTF, byte-for-byte table data.

Space Grotesk and IBM Plex are licensed under the SIL Open Font License 1.1 (see the LICENSE files).
