/**
 * The frame's column widths, as a pure function.
 *
 * The prototype draws three fixed tracks and says nothing about what happens
 * when the window cannot hold them. The official `@deepseek-ai/dsh-client-ui-layout`
 * AppFrame answers exactly that question with a concession chain, and this is the
 * same contract — centre keeps a floor, the details column concedes first and
 * then closes, the rail never concedes — with our own numbers, because the
 * prototype's 248 / 296 are the design and theirs are 280 / 360.
 *
 * Everything here is pure, so the widths can be asserted without a browser, and
 * the frame stays a rendering of this arithmetic rather than a second opinion
 * about it.
 */

/** Rail drag clamp: below the minimum the labels no longer fit, above it the manuscript pays. */
export const RAIL_MIN = 200
export const RAIL_MAX = 360
/** Rail width before any drag. */
export const RAIL_DEFAULT = 248
/** Closed rail: the icon column the frame already draws. */
export const RAIL_COLLAPSED = 56
/** Details drag clamp. */
export const SIDE_MIN = 280
export const SIDE_MAX = 520
/** Details width before any drag. */
export const SIDE_DEFAULT = 296
/**
 * What the manuscript column is worth keeping, in pixels — the reason this
 * function exists. Only the last fallback may cross it, and only when the rail
 * alone already eats the window.
 */
export const CENTER_MIN = 640

export interface FrameColumns {
  readonly rail: number
  readonly center: number
  readonly side: number
}

/** Clamp a dragged width into its panel's range. */
export function clampWidth(px: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(px)))
}

/**
 * Resolve the three column widths for one frame.
 *
 * Widths are preferences (0 = closed), matching the layout store's own shape, so
 * a closed column stays closed however wide the window gets and is never
 * unmounted — the frame derives what to render from the resolved number.
 */
export function solveColumns(viewport: number, rail: number, side: number): FrameColumns {
  const railWidth = rail <= 0 ? RAIL_COLLAPSED : clampWidth(rail, RAIL_MIN, RAIL_MAX)
  let sideWidth = side <= 0 ? 0 : clampWidth(side, SIDE_MIN, SIDE_MAX)
  // Preferences cross a store boundary, where they can be stale: re-clamping
  // here is what keeps a width dragged in a wider window from breaking a
  // narrower one.
  const available = Math.max(0, Math.round(viewport))
  if (sideWidth > 0 && available - railWidth - sideWidth < CENTER_MIN) {
    const give = CENTER_MIN - (available - railWidth - sideWidth)
    sideWidth = sideWidth - give >= SIDE_MIN ? sideWidth - give : 0
  }
  return { rail: railWidth, center: Math.max(0, available - railWidth - sideWidth), side: sideWidth }
}
