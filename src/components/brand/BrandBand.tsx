import { Logo } from "./Logo";
import { RingDevice } from "./RingDevice";

/**
 * A slim brand header (rebrand Phase 3): Oyelabs Blue with the ring device and the `on-blue` logo;
 * Night with Sky rings and the `dark` logo in dark mode. For full-page moments outside the app
 * shell: the assessment pre-flight (consent and proctoring checks) in both designs.
 */
export function BrandBand() {
  return (
    <div className="relative overflow-hidden bg-oyelabs-blue dark:bg-night" data-brand="band">
      <RingDevice className="absolute -right-8 -top-12 h-40 w-auto text-white opacity-[0.16] dark:text-sky dark:opacity-30" />
      <div className="relative mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
        {/* Visibility on wrappers: a display class on the logo itself would fight its inline-flex. */}
        <div className="dark:hidden">
          <Logo theme="on-blue" size={28} clearSpace={false} />
        </div>
        <div className="hidden dark:block">
          <Logo theme="dark" size={28} clearSpace={false} />
        </div>
      </div>
    </div>
  );
}
