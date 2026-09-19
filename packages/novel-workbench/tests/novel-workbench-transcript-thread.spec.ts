// @vitest-environment jsdom
// I-P5d: the transcript goes Linear's thread — you can see who said what, and a
// run of "what it did" reads as one block.
//
// Measured on a real 77-line thread from an isolated copy of the author's home
// before anything changed: 2 user lines, 20 assistant lines, 55 tool lines,
// 11,589px of column and 1,368px of it pure gap — and
// `userDistinctFromAssistant: false`.
//
// That last one is the bug worth naming. The stylesheet distinguished the
// author's line with `color: var(--text-100)` while the model's used
// `var(--text-000)` — and in both themes those two tokens are the same value, so
// the rule was a no-op and the author's own words were rendered identically to
// the model's. The author could not see which lines were theirs.
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import { NovelTranscript } from '../src/client/NovelTranscript.js'
import type { TranscriptEntry } from '../src/client/transcript-data.js'
import { WORKBENCH_CSS } from '../src/client/workbench-css.js'

const line = (kind: TranscriptEntry['kind'], id: string, text: string): TranscriptEntry => ({ kind, id, text })

async function render(entries: readonly TranscriptEntry[], props: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => { root.render(createElement(NovelTranscript as never, { entries, ...props })) })
  return { container, root }
}

/** The stylesheet the component ships, read from its own <style> node. */
const transcriptCss = (container: HTMLElement): string =>
  container.querySelector('style')?.textContent ?? ''

const thread: TranscriptEntry[] = [
  line('user', 'u1', '写一段开场。'),
  line('assistant', 'a1', '风起于青萍之末。'),
  line('tool', 't1', 'read'),
  line('tool', 't2', 'read'),
  line('tool', 't3', 'read'),
  line('tool', 't4', 'read'),
  line('tool', 't5', 'read'),
  line('assistant', 'a2', '写好了。'),
  line('user', 'u2', '再短一点。'),
]

describe('novel-mode transcript, against the Linear thread (I-P5d)', () => {
  it('marks the author\'s own lines as the author\'s', async () => {
    const { container, root } = await render(thread)

    const user = container.querySelector('.novel-transcript-line.is-user')
    const assistant = container.querySelector('.novel-transcript-line.is-assistant')
    expect(user).not.toBeNull()
    // The mark is the author's, and the model's prose is left as prose: a
    // column of twenty answers each labelled "AI" is chrome, not information.
    expect(user?.querySelector('[data-novel-transcript-speaker]')?.textContent).toBe('你')
    expect(assistant?.querySelector('[data-novel-transcript-speaker]')).toBeNull()

    await act(async () => { root.unmount() })
    container.remove()
  })

  it('tells them apart with more than a colour', async () => {
    // The rule this replaces was colour-only, and the two colours were the same
    // value. Whatever distinguishes them has to survive that.
    const { container, root } = await render(thread)
    const css = transcriptCss(container)
    const user = css.match(/\.novel-transcript-line\.is-user[^{]*\{([^}]*)\}/u)?.[1] ?? ''
    expect(user).toMatch(/border-left/u)
    expect(user).toMatch(/padding-left/u)
    await act(async () => { root.unmount() })
    container.remove()
  })

  it('reads a run of tool lines as one block, not as five paragraphs', async () => {
    const { container, root } = await render(thread)

    // Five consecutive calls are one stretch of work with one thing to say.
    const blocks = container.querySelectorAll('.novel-transcript-tools')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.querySelectorAll('[data-novel-transcript-entry="tool"]')).toHaveLength(5)
    // …and the prose either side is not swallowed into it.
    expect(blocks[0]?.querySelectorAll('[data-novel-transcript-entry="assistant"]')).toHaveLength(0)
    expect(blocks[0]?.querySelectorAll('[data-novel-transcript-entry="user"]')).toHaveLength(0)

    await act(async () => { root.unmount() })
    container.remove()
  })

  it('gives that block its own tight rhythm', async () => {
    const { container, root } = await render(thread)
    const css = transcriptCss(container)
    const block = css.match(/\.novel-transcript-tools[^{]*\{([^}]*)\}/u)?.[1] ?? ''
    // Tight inside, separated from the prose around it.
    expect(block).toMatch(/gap:\s*\d+px/u)
    expect(block).toMatch(/border-left/u)
    await act(async () => { root.unmount() })
    container.remove()
  })

  it('keeps the paragraph rhythm the reading column already had', async () => {
    const { container, root } = await render(thread)
    const css = transcriptCss(container)
    // Prose is still set as reading, one paragraph's distance apart — this
    // increment compacts the tool runs, it does not compact the manuscript.
    expect(css).toMatch(/\.novel-transcript \{[^}]*gap:\s*18px/u)
    expect(css).toMatch(/\.novel-transcript-text \{[^}]*font-family:\s*var\(--font-serif\)/u)
    await act(async () => { root.unmount() })
    container.remove()
  })

  it('leaves no empty block behind when tool activity is off', async () => {
    const { container, root } = await render(thread, { showTools: false })
    expect(container.querySelectorAll('.novel-transcript-tools')).toHaveLength(0)
    expect(container.querySelectorAll('[data-novel-transcript-entry="tool"]')).toHaveLength(0)
    // The prose is untouched by the switch, and the author's mark survives it.
    expect(container.textContent).toContain('风起于青萍之末。')
    expect(container.querySelector('[data-novel-transcript-speaker]')?.textContent).toBe('你')
    await act(async () => { root.unmount() })
    container.remove()
  })

  it('does not put a per-line timestamp on a working session', async () => {
    // Linear groups a thread by day because a Linear thread spans days. An
    // author's thread is one sitting, and every line would read 「刚刚」.
    const { container, root } = await render(thread)
    expect(container.querySelectorAll('[data-novel-transcript-time]')).toHaveLength(0)
    expect(WORKBENCH_CSS).toBeTruthy()
    await act(async () => { root.unmount() })
    container.remove()
  })
})
