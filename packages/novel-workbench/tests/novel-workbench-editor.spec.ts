// @vitest-environment jsdom
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NovelEditor } from '../src/client/NovelEditor.js'

/**
 * Every root the helpers below mount. A mounted editor keeps debouncing, keeps
 * its page-exit listeners and keeps reading the shared store, so a case that
 * leaves one behind is still running during the next one.
 */
const mounted: { root: Root; container: HTMLElement }[] = []

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => { entry.root.unmount() })
    entry.container.remove()
  }
})

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

  it('says what it will submit, in the author`s words, before submitting', async () => {
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
    // What the author is agreeing to: one by one, and the story does not move
    // until they do.
    expect(panel?.textContent).toContain('逐条')
    expect(panel?.textContent).toContain('接受')
    expect(panel?.textContent).toContain('故事内容不会')
    // The brief's rule for author-facing copy (docs/novel-mode-frontend-brief-2026-09-16.md §6):
    // no Canon, no workdir, no revision-alignment prose on a card the author
    // reads. The revision is still allowed as a bare R badge elsewhere.
    expect(panel?.textContent).not.toContain('Canon')
    expect(panel?.textContent).not.toContain('workdir')
    expect(panel?.textContent ?? '').not.toMatch(/R\d+\s*对齐/)

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

/**
 * F2: the three ways typing used to get lost.
 *
 * Autosave is a 700ms debounce, and three different exits from that debounce
 * dropped the author's last paragraph without a word: unmounting the editor
 * *cancelled* the pending save, switching chapter let the timer file the old
 * chapter's text under the new chapter, and closing the page never flushed at
 * all. Each path is exercised here through the editor itself — the prose has to
 * travel the same route the author's does.
 */
describe('novel-mode autosave keeps the work', () => {
  const FIRST = { number: 1, title: '开篇章' }
  const SECOND = { number: 2, title: '夜航' }

  interface SaveCall {
    readonly chapter: { number: number; title: string } | undefined
    readonly text: string
    readonly version: string
  }

  /**
   * Only `setTimeout` is faked: the debounce is what these tests are about, and
   * faking more (rAF, microtasks) would stop the editor from mounting at all.
   */
  const fakeDebounce = (): void => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }) }

  function mountSaver(continuation: string) {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const saves: SaveCall[] = []
    let chapter: { number: number; title: string } = FIRST

    const element = () => createElement(NovelEditor as never, {
      workId: 'ws-1',
      chapter,
      loadChapterDraft: async (_workId: unknown, target: unknown) => ({
        state: 'loaded',
        text: '',
        version: `v-${String((target as { number: number }).number)}`,
      }),
      saveChapterDraft: async (_workId: unknown, target: unknown, text: string, version: string) => {
        saves.push({ chapter: target as SaveCall['chapter'], text, version })
        return { state: 'saved', version: `saved-${String((target as { number: number }).number)}` }
      },
      readingSize: 18, readingMeasure: 34, readingIndent: 2, readingLeading: 1.85,
      sessionId: 'session-1', revision: 7,
      submitChapterProposal: async () => {},
      requestContinuation: async () => ({ state: 'ok', text: continuation }),
      requestRefine: async () => {},
    } as never)

    mounted.push({ root, container })
    return {
      container, root, saves,
      render: async () => { await act(async () => { root.render(element()) }) },
      settle: async () => { await act(async () => {}) },
      /** Prose enters the way it does for a real author: through the document. */
      type: async () => {
        await act(async () => {
          container.querySelector<HTMLButtonElement>('[data-novel-editor-continue]')?.click()
        })
        await act(async () => {
          container.querySelector<HTMLButtonElement>('[data-novel-continue-generate]')?.click()
        })
        await act(async () => {
          container.querySelector<HTMLButtonElement>('[data-novel-continue-adopt]')?.click()
        })
      },
      switchTo: async (next: { number: number; title: string }) => {
        chapter = next
        await act(async () => { root.render(element()) })
      },
    }
  }

  afterEach(() => { vi.useRealTimers() })

  it('files the last keystrokes under the chapter they were typed in, not the next one', async () => {
    fakeDebounce()
    const ui = mountSaver('第一章的话。')
    await ui.render()
    await ui.settle()
    await ui.type()

    // The author moves on before the debounce fires. The work belongs to 第1章.
    await ui.switchTo(SECOND)
    await act(async () => { vi.runAllTimers() })
    await ui.settle()

    const forFirst = ui.saves.filter(call => call.chapter?.number === 1)
    expect(forFirst.some(call => call.text === '第一章的话。')).toBe(true)
    // …and must never be filed against the chapter that happens to be open now,
    // carrying a version token that belongs to that other chapter.
    expect(ui.saves.some(call => call.chapter?.number === 2 && call.text.includes('第一章的话'))).toBe(false)
    expect(forFirst.every(call => call.version === 'v-1')).toBe(true)
  })

  it('does not let the chapter it just left hand its version token to the next one', async () => {
    // The leaving flush and the next chapter's read are two requests in flight at
    // once, and they can come back in either order. If the save for the chapter
    // just left lands *after* the read, its token would become the one guarding
    // the chapter now on screen — and the next write into it would be refused as
    // a conflict the author never caused.
    fakeDebounce()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const saves: SaveCall[] = []
    let chapter: { number: number; title: string } = FIRST
    let releaseFirstSave: (() => void) | undefined
    let held = false
    mounted.push({ root, container })

    const element = () => createElement(NovelEditor as never, {
      workId: 'ws-1',
      chapter,
      loadChapterDraft: async (_workId: unknown, target: unknown) => ({
        state: 'loaded',
        text: '',
        version: `v-${String((target as { number: number }).number)}`,
      }),
      saveChapterDraft: async (_workId: unknown, target: unknown, text: string, version: string) => {
        saves.push({ chapter: target as SaveCall['chapter'], text, version })
        if (!held) {
          held = true
          await new Promise<void>(resolve => { releaseFirstSave = resolve })
        }
        return { state: 'saved', version: `saved-${String((target as { number: number }).number)}` }
      },
      readingSize: 18, readingMeasure: 34, readingIndent: 2, readingLeading: 1.85,
      sessionId: 'session-1', revision: 7,
      submitChapterProposal: async () => {},
      requestContinuation: async () => ({ state: 'ok', text: '第一段。' }),
      requestRefine: async () => {},
    } as never)

    const settle = async () => { await act(async () => {}) }
    await act(async () => { root.render(element()) })
    await settle()

    // Type into the first chapter so the debounce owes it a save.
    await act(async () => { container.querySelector<HTMLButtonElement>('[data-novel-editor-continue]')?.click() })
    await act(async () => { container.querySelector<HTMLButtonElement>('[data-novel-continue-generate]')?.click() })
    await act(async () => { container.querySelector<HTMLButtonElement>('[data-novel-continue-adopt]')?.click() })
    await settle()

    // Move on: the leaving flush starts, and the next chapter's read answers while
    // that save is still in flight.
    chapter = SECOND
    await act(async () => { root.render(element()) })
    await settle()

    await act(async () => { releaseFirstSave?.() })
    await settle()

    // Now write into the second chapter and let the unmount flush carry it out.
    await act(async () => { container.querySelector<HTMLButtonElement>('[data-novel-editor-continue]')?.click() })
    await act(async () => { container.querySelector<HTMLButtonElement>('[data-novel-continue-generate]')?.click() })
    await act(async () => { container.querySelector<HTMLButtonElement>('[data-novel-continue-adopt]')?.click() })
    await settle()
    await act(async () => { root.unmount() })
    await settle()

    const forSecond = saves.filter(call => call.chapter?.number === 2)
    expect(forSecond).toHaveLength(1)
    expect(forSecond[0]?.version).toBe('v-2')
  })

  it('does not cancel the pending save when the editor unmounts', async () => {
    fakeDebounce()
    const ui = mountSaver('风起于青萍之末。')
    await ui.render()
    await ui.settle()
    await ui.type()
    const before = ui.saves.length

    await act(async () => { ui.root.unmount() })
    await ui.settle()

    expect(ui.saves.length).toBeGreaterThan(before)
    expect(ui.saves.at(-1)?.text).toBe('风起于青萍之末。')
    expect(ui.saves.at(-1)?.chapter?.number).toBe(1)
  })

  it('writes the pending paragraph when the page is going away', async () => {
    fakeDebounce()
    const ui = mountSaver('风起于青萍之末。')
    await ui.render()
    await ui.settle()
    await ui.type()

    await act(async () => { window.dispatchEvent(new Event('pagehide')) })
    await ui.settle()

    expect(ui.saves.at(-1)?.text).toBe('风起于青萍之末。')
    expect(ui.saves.at(-1)?.chapter?.number).toBe(1)
  })

  it('asks the browser to wait while there is prose the draft file does not have', async () => {
    fakeDebounce()
    const ui = mountSaver('风起于青萍之末。')
    await ui.render()
    await ui.settle()
    await ui.type()

    // `dispatchEvent` answers false exactly when something called preventDefault.
    expect(window.dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(false)

    // Once the debounce has landed there is nothing to lose, and holding the
    // author back would be a lie.
    await act(async () => { vi.runAllTimers() })
    await ui.settle()
    expect(window.dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(true)
  })
})

/**
 * F3a, E1 and E6 — the submit chain.
 *
 * Three defects in one row of buttons. Submitting once took 「提交本章」 away for
 * good, because `submitState` never went back to idle, so an author who kept
 * working had no way to submit the chapter they were now holding. The confirm
 * card and the continue panel could be open at the same time, stacked on each
 * other on a 896px bar. And the state that said "you already submitted" — along
 * with any refine or submit problem — stayed put when the author moved to the
 * next chapter, describing a chapter that was no longer on screen.
 */
describe('novel-mode submit chain', () => {
  const FIRST = { number: 1, title: '开篇章' }
  const SECOND = { number: 2, title: '夜航' }

  interface ChainOptions {
    readonly text?: string
    readonly continuation?: string
    readonly sessionId?: string | undefined
    readonly submit?: () => Promise<void>
    readonly refine?: () => Promise<void>
    readonly onOpenInbox?: () => void
    readonly onOpenThread?: () => void
    readonly acceptedText?: string
  }

  function mountChain(options: ChainOptions = {}) {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    let chapter: { number: number; title: string } = FIRST
    const saves: {
      chapter: { number: number; title: string } | undefined
      text: string
      version: string
    }[] = []

    const element = () => createElement(NovelEditor as never, {
      workId: 'ws-1',
      chapter,
      loadChapterDraft: async () => ({ state: 'loaded', text: options.text ?? '', version: 'v1' }),
      saveChapterDraft: async (_workId: unknown, target: unknown, text: string, version: string) => {
        saves.push({ chapter: target as never, text, version })
        return { state: 'saved', version: 'v2' }
      },
      readingSize: 18, readingMeasure: 34, readingIndent: 2, readingLeading: 1.85,
      sessionId: 'sessionId' in options ? options.sessionId : 'session-1',
      revision: 7,
      submitChapterProposal: options.submit ?? (async () => {}),
      requestContinuation: async () => ({ state: 'ok', text: options.continuation ?? '' }),
      requestRefine: options.refine ?? (async () => {}),
      onOpenInbox: options.onOpenInbox ?? (() => {}),
      onOpenThread: options.onOpenThread ?? (() => {}),
      ...(options.acceptedText === undefined ? {} : { acceptedText: options.acceptedText }),
    } as never)

    mounted.push({ root, container })
    return {
      container, root, saves,
      settle: async () => { await act(async () => {}) },
      render: async () => { await act(async () => { root.render(element()) }) },
      click: async (selector: string) => {
        await act(async () => {
          container.querySelector<HTMLButtonElement>(selector)?.click()
        })
        await act(async () => {})
      },
      switchTo: async (next: { number: number; title: string }) => {
        chapter = next
        await act(async () => { root.render(element()) })
        await act(async () => {})
      },
    }
  }

  const shown = (container: HTMLElement, selector: string): boolean =>
    container.querySelector(selector) !== null

  it('puts 「提交本章」 back as soon as the author writes again', async () => {
    const ui = mountChain({ text: '第一段。', continuation: '又写了一段。' })
    await ui.render()
    await ui.settle()

    await ui.click('[data-novel-editor-submit]')
    await ui.click('[data-novel-editor-confirm-submit]')

    expect(shown(ui.container, '[data-novel-editor-inbox]')).toBe(true)
    expect(shown(ui.container, '[data-novel-editor-submit]')).toBe(false)

    // What the author is holding is no longer what was submitted, so there is
    // something new to submit — and the way back to the inbox stays visible.
    await ui.click('[data-novel-editor-continue]')
    await ui.click('[data-novel-continue-generate]')
    await ui.click('[data-novel-continue-adopt]')
    await ui.settle()

    expect(shown(ui.container, '[data-novel-editor-submit]')).toBe(true)
    expect(shown(ui.container, '[data-novel-editor-inbox]')).toBe(false)
  })

  it('starts the next chapter with a clean slate, not the last chapter`s leftovers', async () => {
    const ui = mountChain({ text: '第一段。', sessionId: undefined })
    await ui.render()
    await ui.settle()

    await ui.click('[data-novel-editor-submit]')
    await ui.click('[data-novel-editor-confirm-submit]')
    expect(ui.container.textContent).toContain('还没有选定线程')
    await ui.click('[data-novel-editor-refine]')
    expect(ui.container.textContent).toContain('还没有选定线程')

    await ui.switchTo(SECOND)
    await ui.settle()

    // Nothing said about the last chapter may describe this one: not its
    // inbox state, not its problems, not a confirm card left open.
    expect(ui.container.textContent).not.toContain('还没有选定线程')
    expect(shown(ui.container, '[data-novel-editor-inbox]')).toBe(false)
    expect(shown(ui.container, '[data-novel-editor-refined]')).toBe(false)
    expect(shown(ui.container, '[data-novel-editor-confirm]')).toBe(false)
    expect(shown(ui.container, '[data-novel-editor-submit]')).toBe(true)
  })

  it('never shows the confirm card and the continue panel at the same time', async () => {
    const ui = mountChain({ text: '第一段。', continuation: '第二段。' })
    await ui.render()
    await ui.settle()

    await ui.click('[data-novel-editor-continue]')
    expect(shown(ui.container, '[data-novel-continue]')).toBe(true)

    // Asking to submit is a different question; the panel has to get out of the way.
    await ui.click('[data-novel-editor-submit]')
    expect(shown(ui.container, '[data-novel-editor-confirm]')).toBe(true)
    expect(shown(ui.container, '[data-novel-continue]')).toBe(false)

    // …and the other way round.
    await ui.click('[data-novel-editor-continue]')
    expect(shown(ui.container, '[data-novel-continue]')).toBe(true)
    expect(shown(ui.container, '[data-novel-editor-confirm]')).toBe(false)
  })

  it('offers a way to the inbox it just filled', async () => {
    let opened = 0
    const ui = mountChain({ text: '第一段。', onOpenInbox: () => { opened += 1 } })
    await ui.render()
    await ui.settle()

    await ui.click('[data-novel-editor-submit]')
    await ui.click('[data-novel-editor-confirm-submit]')
    await ui.click('[data-novel-editor-inbox]')

    expect(opened).toBe(1)
  })

  it('offers to open the thread it says is missing, instead of only naming it', async () => {
    // Without a thread the author is told what they lack and given nothing to do
    // about it — on the two actions this product exists for.
    let openedThreads = 0
    const submitted: unknown[][] = []
    const ui = mountChain({
      text: '第一段。',
      sessionId: undefined,
      submit: async (...args: unknown[]) => { submitted.push(args) },
      onOpenThread: () => { openedThreads += 1 },
    })
    await ui.render()
    await ui.settle()

    await ui.click('[data-novel-editor-submit]')
    await ui.click('[data-novel-editor-confirm-submit]')
    expect(ui.container.textContent).toContain('还没有选定线程')

    const buttons = ui.container.querySelectorAll('[data-novel-editor-open-thread]')
    expect(buttons.length).toBeGreaterThan(0)
    // The refusal to submit is still a refusal.
    expect(submitted).toHaveLength(0)

    await ui.click('[data-novel-editor-open-thread]')
    expect(openedThreads).toBe(1)
  })

  it('says nothing about opening a thread once one is serving this work', async () => {
    const ui = mountChain({ text: '第一段。' })
    await ui.render()
    await ui.settle()

    expect(ui.container.querySelector('[data-novel-editor-open-thread]')).toBeNull()
  })
})

/**
 * F3d: what the author accepted and what they are holding are two different
 * documents, and the editor used to show only one of them without saying so.
 * Accepting writes Canon; the draft file is not Canon, so the two part ways the
 * moment a proposal is accepted, and the author needs to see that — and to have
 * a way to bring either one to the other.
 */
describe('novel-mode accepted prose', () => {
  const FIRST = { number: 1, title: '开篇章' }

  it('says the draft and the accepted chapter have parted ways, and offers both ways across', async () => {
    const { NovelEditor } = await import('../src/client/NovelEditor.js')
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const saves: { text: string; version: string }[] = []
    await act(async () => {
      root.render(createElement(NovelEditor as never, {
        workId: 'ws-1',
        chapter: FIRST,
        loadChapterDraft: async () => ({ state: 'loaded', text: '这是我改过的稿子。', version: 'v1' }),
        saveChapterDraft: async (_workId: unknown, _chapter: unknown, text: string, version: string) => {
          saves.push({ text, version })
          return { state: 'saved', version: 'v2' }
        },
        readingSize: 18, readingMeasure: 34, readingIndent: 2, readingLeading: 1.85,
        sessionId: 'session-1', revision: 7,
        submitChapterProposal: async () => {},
        requestContinuation: async () => ({ state: 'ok', text: '' }),
        requestRefine: async () => {},
        acceptedText: '这是已接受的正文。',
      } as never))
    })
    await act(async () => {})
    mounted.push({ root, container })

    const bar = container.querySelector('[data-novel-editor-diverged]')
    expect(bar).not.toBeNull()

    // 读已接受正文 shows what Canon actually holds…
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-novel-editor-read-accepted]')?.click()
    })
    await act(async () => {})
    expect(container.querySelector('[data-novel-editor-reading]')?.textContent)
      .toContain('这是已接受的正文。')

    // …and 写回稿子 puts it back into the draft file, under the version the file
    // already has, so the write goes through the same conflict guard as typing.
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-novel-editor-write-back]')?.click()
    })
    await act(async () => {})
    expect(saves.at(-1)?.text).toBe('这是已接受的正文。')
    expect(saves.at(-1)?.version).toBe('v1')
  })

  it('says nothing when the draft and the accepted chapter are the same text', async () => {
    const { NovelEditor } = await import('../src/client/NovelEditor.js')
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(NovelEditor as never, {
        workId: 'ws-1',
        chapter: FIRST,
        loadChapterDraft: async () => ({ state: 'loaded', text: '一样的话。', version: 'v1' }),
        saveChapterDraft: async () => ({ state: 'saved', version: 'v2' }),
        readingSize: 18, readingMeasure: 34, readingIndent: 2, readingLeading: 1.85,
        sessionId: 'session-1', revision: 7,
        submitChapterProposal: async () => {},
        requestContinuation: async () => ({ state: 'ok', text: '' }),
        requestRefine: async () => {},
        acceptedText: '一样的话。',
      } as never))
    })
    await act(async () => {})
    mounted.push({ root, container })

    expect(container.querySelector('[data-novel-editor-diverged]')).toBeNull()
  })
})
