import { MARK_DOT, MARK_INNER, MARK_INNER_WIDTH, MARK_OUTER, MARK_OUTER_WIDTH, MARK_VIEWBOX, cx } from "./brandAssets";

/**
 * The brand's large background device (kit 05-web/signin-side-panel.svg): the mark, drawn big and
 * faint behind content, in one colour. Purely decorative. The colour is `currentColor`, so the
 * caller picks it (white on Oyelabs Blue, Sky on Night) and the opacity sets how faint it is.
 */
export function RingDevice({ className }: { className?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} aria-hidden="true" focusable="false" className={cx("pointer-events-none", className)} data-brand="ring-device">
      {MARK_OUTER.map((d) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth={MARK_OUTER_WIDTH} />
      ))}
      <path d={MARK_INNER} fill="none" stroke="currentColor" strokeWidth={MARK_INNER_WIDTH} strokeLinecap="round" />
      <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill="currentColor" />
    </svg>
  );
}
