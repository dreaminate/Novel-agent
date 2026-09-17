// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import { NovelEditor } from '../src/client/NovelEditor.js'

/**
 * The writing surface is one document in two states, and 正文阅读 is the reading
 * one — that canvas is gone, so the assertions it used to own live here now.
 *
 * The two things worth pinning are the ones an author would notice losing: a
 * chapter with no draft yet opens blank rather than pretending, and the reading
 * state is set with the size, measure, indent and leading they chose.
 */
const chapter = { number: 1, title: '开篇章' }

function mount(options: { text?: string, state?: 'loaded' | 'missing', onSubmit?: (sessionId: string, chapter: unknown, revision: number, chars: number) => Promise<void>, continuation?: string, saves?: string[], refines?: unknown[][] } = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const ready = act(async () => {
    root.render(createElement(NovelEditor as never, {
      workId: 'ws-1',
      chapter,
      loadChapterDraft: async () => (options.state === 'missing'
        ? { state: 'missing' }
        : { state: 'loaded', text: options.text ?? '', version: 'v1' }),
      saveChapterDraft: async (_workId: unknown, _chapter: unknown, text: string) => {
        options.saves?.push(text)
        return { state: 'saved', version: 'v2' }
      },
      readingSize: 18,
      readingMeasure: 34,
      readingIndent: 2,
      readingLeading: 1.85,
      sessionId: 'session-1',
      revision: 7,
      submitChapterProposal: options.onSubmit ?? (async () => {}),
      requestContinuation: async () => ({ state: 'ok', text: options.continuation ?? '' }),
      requestRefine: async (...args: unknown[]) => { options.refines?.push(args) },
    } as never))
  })
  return { ready, container, root }
}

describe('novel-mode writing surface', () => {
  it('opens a chapter that has no draft yet as a blank one, not an error', async () => {
    const rendered = mount({ state: 'missing' })
    await rendered.ready
    await act(async () => {})

    expect(rendered.container.textContent).toContain('第1章《开篇章》')
    expect(rendered.container.querySelector('[data-novel-editor-count]')?.getAttribute('data-novel-editor-count')).toBe('0')
    expect(rendered.container.textContent).not.toContain('出错')

    await act(async () => { rendered.root.unmount() })
    rendered.container.remove()
  })

  it('reads the same document with the typography the author chose', async () => {
    const rendered = mount({ text: '第一段。\n\n第二段。' })
    await rendered.ready
    await act(async () => {})

    // Writing first, reading on demand — the two states share one document.
    const readTab = rendered.container.querySelector<HTMLButtonElement>('[data-novel-editor-mode="read"]')
    expect(readTab).not.toBeNull()
    await act(async () => { readTab?.click() })
    await act(async () => {})

    const article = rendered.container.querySelector<HTMLElement>('[data-novel-editor-reading]')
    expect(article).not.toBeNull()
    expect(article?.style.fontSize).toBe('18px')
    expect(article?.style.maxWidth).toBe('34em')
    expect(article?.style.lineHeight).toBe('1.85')
    expect(article?.style.textIndent).toBe('2em')
    expect(article?.querySelectorAll('p')).toHaveLength(2)
    expect(article?.textContent).toContain('第二段。')

    await act(async () => { rendered.root.unmount() })
    rendered.container.remove()
  })

  it('says what it will submit, and against which revision, before submitting', async () => {
    const calls: unknown[][] = []
    const rendered = mount({
      text: '第一段。',
      onSubmit: async (...args: unknown[]) => { calls.push(args) },
    })
    await rendered.ready
    await act(async () => {})

    // Nothing is sent until the author has seen what it is.
    expect(rendered.container.querySelector('[data-novel-editor-confirm]')).toBeNull()
    expect(calls).toHaveLength(0)

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-editor-submit]')?.click()
    })
    await act(async () => {})

    const panel = rendered.container.querySelector('[data-novel-editor-confirm]')
    expect(panel).not.toBeNull()
    expect(panel?.textContent).toContain('第1章《开篇章》')
    expect(panel?.textContent).toContain('R7')
    // The boundary is stated where the author decides, not buried in a doc.
    expect(panel?.textContent).toContain('Canon 不会因为这一步改变')

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-editor-confirm-submit]')?.click()
    })
    await act(async () => {})

    expect(calls).toHaveLength(1)
    expect(calls[0][0]).toBe('session-1')
    expect(calls[0][2]).toBe(7)

    await act(async () => { rendered.root.unmount() })
    rendered.container.remove()
  })

  it('backs out without submitting when the author says not yet', async () => {
    const calls: unknown[][] = []
    const rendered = mount({ text: '第一段。', onSubmit: async (...args: unknown[]) => { calls.push(args) } })
    await rendered.ready
    await act(async () => {})
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-editor-submit]')?.click()
    })
    await act(async () => {})
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-editor-confirm-cancel]')?.click()
    })
    await act(async () => {})

    expect(rendered.container.querySelector('[data-novel-editor-confirm]')).toBeNull()
    expect(calls).toHaveLength(0)

    await act(async () => { rendered.root.unmount() })
    rendered.container.remove()
  })

  it('takes generated prose into a blank chapter without a blank line above it', async () => {
    // A chapter with no draft opens on Tiptap's one empty paragraph. Appending
    // after it would put an empty line at the top of the author's file, so the
    // first adoption into a blank chapter has to replace it.
    const saves: string[] = []
    const rendered = mount({ state: 'missing', saves, continuation: '第一段。\n\n第二段。' })
    await rendered.ready
    await act(async () => {})

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-editor-continue]')?.click()
    })
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-continue-generate]')?.click()
    })
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-continue-adopt]')?.click()
    })
    // Autosave is debounced; let it land before the unmount clears the timer.
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 900)) })

    expect(saves.at(-1)).toBe('第一段。\n\n第二段。')

    await act(async () => { rendered.root.unmount() })
    rendered.container.remove()
  })

  it('refines the chapter after the author submits it, and not before', async () => {
    const refines: unknown[][] = []
    const rendered = mount({ text: '第一段。', refines })
    await rendered.ready
    await act(async () => {})

    // Refinement reads an accepted chapter. Asking before it is accepted would
    // ask the organizer to work from a lineage that does not exist yet.
    expect(refines).toHaveLength(0)

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-editor-submit]')?.click()
    })
    await act(async () => {})
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-editor-confirm-submit]')?.click()
    })
    await act(async () => {})

    expect(refines).toHaveLength(1)

    await act(async () => { rendered.root.unmount() })
    rendered.container.remove()
  })

  it('offers a manual re-run, so refinement is not a one-shot', async () => {
    const refines: unknown[][] = []
    const rendered = mount({ text: '第一段。', refines })
    await rendered.ready
    await act(async () => {})

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-novel-editor-refine]')?.click()
    })

    expect(refines).toHaveLength(1)

    await act(async () => { rendered.root.unmount() })
    rendered.container.remove()
  })
})
