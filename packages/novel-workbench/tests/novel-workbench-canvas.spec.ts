// @vitest-environment jsdom
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Every root this file mounts. The workbench store is module state, so a canvas
 * left mounted from one case keeps answering store changes during the next — its
 * effects run, it writes to the store, and the case under test reads a state
 * somebody else set. Tearing down after each case is what keeps them independent.
 */
const mounted: { root: Root; container: HTMLElement }[] = []

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => { entry.root.unmount() })
    entry.container.remove()
  }
  const { resetWorkbench } = await import('../src/client/store.js')
  resetWorkbench()
})

/**
 * E6, at the canvas rather than at the editor.
 *
 * The writing surface names its draft file after the chapter, so it needs the
 * chapter's number and title — which only the outline has. When that read failed,
 * the canvas left the chapter undefined and the editor rendered "先在左栏选一章":
 * the author was told they had not picked a chapter when in fact the app had
 * failed to read one. Two different problems, one misleading sentence.
 */
const works = [{
  workspaceId: 'ws-mist',
  path: '/books/mist-harbor',
  title: '雾港夜航：第七码头',
  sessionIds: ['s-6'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}]

describe('novel-mode writing canvas', () => {
  async function mountEditorCanvas(loadOutline: ReturnType<typeof vi.fn>) {
    const { NovelCanvas } = await import('../src/client/NovelCanvas.js') as {
      NovelCanvas: (props: Record<string, unknown>) => unknown
    }
    const { workbenchActions } = await import('../src/client/store.js') as {
      workbenchActions: { setView(view: string): void; openChapter(id: string): void }
    }
    workbenchActions.setView('editor')
    workbenchActions.openChapter('vol01-ch0001')

    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(NovelCanvas as never, {
        sessionId: 's-6',
        useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: works }),
        useSessions: (selector: (value: unknown) => unknown) => selector({
          jobsBySession: {},
          subagentsByParent: {},
        }),
        loadOutline,
        loadManuscriptText: vi.fn(async () => undefined),
        loadChapterDraft: async () => ({ state: 'loaded', text: '', version: 'v1' }),
        saveChapterDraft: async () => ({ state: 'saved', version: 'v2' }),
        submitChapterProposal: async () => {},
        refineChapter: async () => {},
        completeSentence: async () => '',
        continueWriting: async () => ({ state: 'ok', text: '' }),
      } as never))
    })
    await act(async () => {})
    mounted.push({ root, container })
    return { container, root }
  }

  it('says the outline could not be read, instead of blaming the author for not picking a chapter', async () => {
    const loadOutline = vi.fn(async () => { throw new Error('这一章的大纲没有读出来') })
    const { container } = await mountEditorCanvas(loadOutline)

    const card = container.querySelector('[data-novel-editor-outline-error]')
    expect(card).not.toBeNull()
    // The real reason, not a sentence about something the author did not do.
    expect(card?.textContent).toContain('这一章的大纲没有读出来')
    expect(container.textContent).not.toContain('先在左栏选一章')
    expect(container.querySelector('[data-novel-editor]')).toBeNull()
  })

  it('reads the outline again when the author retries', async () => {
    const loadOutline = vi.fn(async () => { throw new Error('这一章的大纲没有读出来') })
    const { container } = await mountEditorCanvas(loadOutline)
    const before = loadOutline.mock.calls.length

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-novel-editor-outline-retry]')?.click()
    })
    await act(async () => {})

    expect(loadOutline.mock.calls.length).toBeGreaterThan(before)
  })

  it('drops a remembered chapter that is not in this work, instead of waiting for it for ever', async () => {
    // `chapterId` outlives a reload now, and nothing clears it when the author
    // moves to another work — so it can name a chapter this work has never had.
    // Left alone, the canvas would sit on "正在读取这一章…" waiting for something
    // that is never coming.
    const loadOutline = vi.fn(async () => ({
      revision: 5,
      groups: [{
        id: 'vol-1',
        title: '第一卷',
        chapters: [{ id: 'vol01-ch0009', number: 9, title: '另一章的标题', status: 'accepted' }],
      }],
    }))
    const { container } = await mountEditorCanvas(loadOutline)

    expect(container.querySelector('[data-novel-editor-outline-error]')).toBeNull()
    expect(container.textContent).not.toContain('正在读取')
    // The stale pick is dropped, so the author is back at the way in.
    expect(container.querySelector('[data-novel-landing]')).not.toBeNull()

    const { getWorkbenchState } = await import('../src/client/store.js')
    expect(getWorkbenchState().chapterId).toBeUndefined()
  })

  it('describes 写作 without the words the author does not use', async () => {
    // The subtitle used to read "自动保存到你自己的 workdir，接受后才进 Canon" — two
    // names from the plumbing, on the line under the title of the screen the
    // author spends the most time on.
    const loadOutline = vi.fn(async () => ({
      revision: 5,
      groups: [{
        id: 'vol-1',
        title: '第一卷',
        chapters: [{ id: 'vol01-ch0001', number: 1, title: '开篇章', status: 'accepted' }],
      }],
      chapterCount: 1,
    }))
    const { container } = await mountEditorCanvas(loadOutline)

    const sub = container.querySelector('.main-head .sub')?.textContent ?? ''
    expect(sub.length).toBeGreaterThan(0)
    expect(sub).not.toContain('workdir')
    expect(sub).not.toContain('Canon')
  })

  it('opens the writing surface once the outline answers', async () => {
    const loadOutline = vi.fn(async () => ({
      revision: 5,
      groups: [{ id: 'vol-1', title: '第一卷', chapters: [{ id: 'vol01-ch0001', number: 1, title: '开篇章', status: 'accepted' }] }],
    }))
    const { container } = await mountEditorCanvas(loadOutline)

    expect(container.querySelector('[data-novel-editor-outline-error]')).toBeNull()
    expect(container.querySelector('[data-novel-editor]')).not.toBeNull()
    expect(container.querySelector('.novel-editor-meta')?.textContent).toContain('第1章《开篇章》')
  })
})
