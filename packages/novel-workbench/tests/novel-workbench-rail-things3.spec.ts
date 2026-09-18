// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

/**
 * I-P3: the navigation rail goes Things 3 — the benchmark a Mac author knows
 * for a sidebar that stays out of the way while it carries the whole outline.
 *
 * Things 3's sidebar is denser and quieter than the prototype's: group headers
 * are 11px uppercase, and chapters indent 16px under their volume. The
 * prototype shipped 12px headers and 8px indent, so the rail read as looser
 * than the benchmark and the chapter hierarchy was almost flat.
 *
 * The change is in the prototype's CSS, ported into WORKBENCH_CSS. These specs
 * hold the token sheet itself, the way the shell spec holds the prototype's
 * design tokens: the product reads what the prototype says, and the port
 * carries it verbatim.
 */
describe('novel-mode rail Things 3 (I-P3)', () => {
  it('sets the group header to 11px uppercase, the way Things 3 styles its sections', async () => {
    const { WORKBENCH_CSS } = await import('../src/client/workbench-css.js')
    const grpHeadRule = WORKBENCH_CSS.match(/\.grp-head \{[^}]*\}/)?.[0] ?? ''
    expect(grpHeadRule).not.toBe('')
    // The benchmark's group headers are 11px, uppercase, with letter-spacing.
    expect(grpHeadRule).toMatch(/font-size:\s*11px/)
    expect(grpHeadRule).toMatch(/text-transform:\s*uppercase/)
    expect(grpHeadRule).toMatch(/letter-spacing/)
  })

  it('indents a chapter 16px under its volume, the way Things 3 indents a level', async () => {
    const { WORKBENCH_CSS } = await import('../src/client/workbench-css.js')
    const chItemRule = WORKBENCH_CSS.match(/\.ch-item \{[^}]*\}/)?.[0] ?? ''
    expect(chItemRule).not.toBe('')
    // The chapter's left padding is its indent under the volume header. The
    // benchmark carries 16px; the prototype shipped 8px.
    expect(chItemRule).toMatch(/padding-left:\s*16px/)
  })

  it('keeps the active chapter highlighted with a light accent fill', async () => {
    const { WORKBENCH_CSS } = await import('../src/client/workbench-css.js')
    // The fill is the accent at low alpha — the benchmark's selection colour.
    // The prototype already carried this; I-P3 keeps it.
    const activeRule = WORKBENCH_CSS.match(/\.item\[aria-current="true"\][^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(activeRule).not.toBe('')
    expect(activeRule).toMatch(/accent-brand/)
  })
})
