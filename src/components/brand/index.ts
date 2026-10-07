/**
 * Oyelearn brand components (rebrand Phase 1). Tiny on purpose: they load on every route.
 *
 * App code imports each component from its own file (`@/components/brand/Logo`), not from this
 * barrel: a shared barrel becomes one chunk holding every component, so the lesson route would
 * carry ProgressRing and the auth band too. This index is for tests and documentation.
 */
export { Logo, type LogoProps } from "./Logo";
export { Mark, type MarkProps } from "./Mark";
export { BrandLoader, type BrandLoaderProps } from "./BrandLoader";
export { ProgressRing, type ProgressRingProps } from "./ProgressRing";
export type { BrandTheme, LogoTheme, LogoVariant } from "./brandAssets";
export { RingDevice } from "./RingDevice";
export { BrandBand } from "./BrandBand";
