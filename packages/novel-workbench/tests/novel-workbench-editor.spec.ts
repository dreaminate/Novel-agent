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

function mount(options: { text?: string, state?: 'loaded' | 'missing' } = {}) {
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
      saveChapterDraft: async () => ({ state: 'saved', version: 'v2' }),
      readingSize: 18,
      readingMeasure: 34,
      readingIndent: 2,
      readingLeading: 1.85,
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
})
