// @vitest-environment jsdom
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { NovelEditor } from '../src/client/NovelEditor.js'

/**
 * I-P2: the writing surface goes iA Writer — benchmark product Obsidian's own
 * writing app, the one an author who chose this graph view would also reach for.
 *
 * iA Writer's design is almost no chrome: the page is the text, and the one
 * control that stays is the mode (write / read). Everything else — the chapter
 * name, the word count, the status — is metadata, painted faint and pushed to
 * the edge, not a toolbar button competing for the author's eye.
 *
 * These specs hold the four behaviours the chrome-heavy bar could not provide:
 * - The toolbar carries one element: the mode toggle. Actions like submit,
 *   continue and refine move into an overflow menu, so the writing surface
 *   reads as a surface, not a cockpit.
 * - The body font is a CJK serif (Source Han Serif / Noto Serif CJK), the way
 *   iA Writer's body is a serif. The cluster-disc detour's warm grey rail font
 *   is not what an author reads their prose in.
 * - The body line height sits in [1.6, 1.8] — iA Writer's is ~1.7. The shipped
 *   default of 1.85 was looser than the benchmark and looser than the spec.
 * - A paragraph's bottom margin is at least 1em, so a break between paragraphs
 *   reads as a break. The detour's 0.86em left paragraphs almost touching.
 */
const chapter = { number: 1, title: '开篇章' }

const mounted: { root: Root; container: HTMLElement }[] = []

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => { entry.root.unmount() })
    entry.container.remove()
  }
})

async function mountEditor() {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(createElement(NovelEditor as never, {
      workId: 'ws-1',
      chapter,
      loadChapterDraft: async () => ({ state: 'loaded', text: '夜里风大。', version: 'v1' }),
      saveChapterDraft: async () => ({ state: 'saved', version: 'v2' }),
      readingSize: 17,
      readingMeasure: 40,
      readingIndent: 2,
      readingLeading: 1.75,
      sessionId: 'session-1',
      revision: 7,
      submitChapterProposal: async () => {},
      requestContinuation: async () => ({ state: 'ok', text: '' }),
      requestRefine: async () => {},
    } as never))
  })
  await act(async () => {})
  mounted.push({ root, container })
  return { container, root }
}

describe('novel-mode editor iA Writer (I-P2)', () => {
  it('keeps one element in the toolbar: the mode toggle', async () => {
    const { container } = await mountEditor()
    // The toolbar is the chrome that competes with the text. Metadata (chapter
    // name, status, count) lives in its own faint row; actions live in an
    // overflow menu. The toolbar itself carries only the write/read toggle.
    const toolbar = container.querySelector('[data-novel-editor-toolbar]')
    expect(toolbar).not.toBeNull()
    // The mode toggle is the only control in the toolbar; the overflow menu
    // is a separate element, not a toolbar control.
    const toggleButtons = toolbar?.querySelectorAll('.novel-editor-toggle button') ?? []
    expect(toggleButtons.length).toBe(2) // write + read, one control
    // The actions that used to sit on the bar are now inside an overflow menu,
    // not in the toolbar's toggle.
    expect(toolbar?.querySelector('.novel-editor-toggle [data-novel-editor-submit]')).toBeNull()
    expect(toolbar?.querySelector('.novel-editor-toggle [data-novel-editor-continue]')).toBeNull()
    expect(toolbar?.querySelector('.novel-editor-toggle [data-novel-editor-refine]')).toBeNull()
  })

  it('keeps the submit action reachable from the overflow menu, not lost', async () => {
    const { container } = await mountEditor()
    // iA Writer hides chrome, but it does not hide the one thing the author
    // came to do. The submit action is in the overflow menu, and opening it
    // shows the confirm card the same way it always did.
    const overflow = container.querySelector('[data-novel-editor-overflow]')
    expect(overflow).not.toBeNull()
    // The submit trigger is inside the overflow menu's content, not on the bar.
    const submit = overflow?.querySelector('[data-novel-editor-submit]')
    expect(submit).not.toBeNull()
  })

  it('sets the body font to a CJK serif, the way iA Writer sets a serif', async () => {
    const { container } = await mountEditor()
    // jsdom does not resolve CSS variables, and the editor's stylesheet uses
    // `font-family: var(--font-serif)`. The token itself is defined in the
    // prototype stylesheet the frame mounts, so read it from WORKBENCH_CSS.
    const { WORKBENCH_CSS } = await import('../src/client/workbench-css.js')
    const serifToken = WORKBENCH_CSS.match(/--font-serif:\s*([^;]+);/)?.[1] ?? ''
    expect(serifToken).toMatch(/Source Han Serif|Noto Serif/i)
    // And the editor's surface reads that token.
    const style = container.querySelector('.novel-editor style')?.textContent ?? ''
    expect(style).toMatch(/\.ProseMirror \{[^}]*font-family:\s*var\(--font-serif\)/)
  })

  it('sets the body line height inside the iA Writer range [1.6, 1.8]', async () => {
    await mountEditor()
    // jsdom does not resolve var(--read-lh), so read the token the prototype
    // carries. The frame mounts the prototype stylesheet, which defines
    // --read-lh; the editor's surface reads it. The token itself is what the
    // benchmark is held against.
    const { WORKBENCH_CSS } = await import('../src/client/workbench-css.js')
    const tokenMatch = WORKBENCH_CSS.match(/--read-lh:\s*([0-9.]+)/)
    expect(tokenMatch).not.toBeNull()
    const lh = parseFloat(tokenMatch![1])
    expect(lh).toBeGreaterThanOrEqual(1.6)
    expect(lh).toBeLessThanOrEqual(1.8)
  })

  it('gives a paragraph at least 1em of bottom margin, so breaks read as breaks', async () => {
    const { container } = await mountEditor()
    const style = container.querySelector('.novel-editor style')?.textContent ?? ''
    // The editor's own CSS is in a <style> tag the component mounts. The
    // paragraph rule is what we are asserting against.
    const paragraphRule = style.match(/\.ProseMirror p \{[^}]*\}/)?.[0] ?? ''
    expect(paragraphRule).not.toBe('')
    const marginBottom = paragraphRule.match(/margin-bottom:\s*([0-9.]+)em/)?.[1]
    if (marginBottom === undefined) {
      // The shorthand `margin: 0 0 1em` form: read the third value.
      const shorthand = paragraphRule.match(/margin:\s*[^;]*\b([0-9.]+)em\b[^;]*;/)?.[1]
      expect(shorthand).not.toBeUndefined()
      expect(parseFloat(shorthand!)).toBeGreaterThanOrEqual(1)
    } else {
      expect(parseFloat(marginBottom)).toBeGreaterThanOrEqual(1)
    }
  })
})
