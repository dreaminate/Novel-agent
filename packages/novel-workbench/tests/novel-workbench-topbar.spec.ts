// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NovelTopbar } from '../src/client/NovelTopbar.js'
import { getWorkbenchState, resetWorkbench, workbenchActions } from '../src/client/store.js'

/**
 * F4/M1: 对话 is the button that shows the conversation column, and with no
 * thread selected that column has nothing to render — `WorkbenchFrame` only
 * mounts it when there is a session. So the button toggled a column that could
 * not appear, and pressing it changed nothing the author could see.
 *
 * Asking for a conversation with no thread selected means "give me one".
 */
const works = [{
  workspaceId: 'ws-1',
  path: '/books/x',
  title: '天机阁主',
  sessionIds: ['s-6'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}]

const mounted: { root: Root; container: HTMLElement }[] = []

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => { entry.root.unmount() })
    entry.container.remove()
  }
  resetWorkbench()
})

async function mountTopbar(current: string | undefined) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const newThread = vi.fn()
  await act(async () => {
    root.render(createElement(NovelTopbar as never, {
      useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: works }),
      useSessions: (selector: (value: unknown) => unknown) => selector({ current }),
      loadOutline: vi.fn(async () => ({ revision: 5, groups: [], chapterCount: 0 })),
      loadReviews: vi.fn(async () => ({ acceptedRevision: 5, proposals: [] })),
      newThread,
      actions: {
        setTheme: vi.fn(),
        toggleAdvanced: vi.fn(),
        toggleSidebar: vi.fn(),
        // The real one comes from the plugin layer and moves the store; a no-op
        // stub here would make the toggle look broken rather than untested.
        toggleDetails: () => {
          if (getWorkbenchState().panels.details > 0) workbenchActions.closeDetails()
          else workbenchActions.openDetails()
        },
      },
    } as never))
  })
  await act(async () => {})
  mounted.push({ root, container })
  return { container, root, newThread }
}

const click = async (container: HTMLElement): Promise<void> => {
  await act(async () => {
    container.querySelector<HTMLButtonElement>('[data-novel-topbar-details]')?.click()
  })
  await act(async () => {})
}

describe('novel-mode topbar', () => {
  it('opens a thread when the author asks for a conversation and there is none', async () => {
    const { container, newThread } = await mountTopbar(undefined)
    workbenchActions.closeDetails()

    await click(container)

    // A thread, because the column cannot show anything without one…
    expect(newThread).toHaveBeenCalledWith('ws-1')
    // …and the column, so the author lands where the new thread will appear.
    expect(getWorkbenchState().panels.details).toBeGreaterThan(0)
  })

  it('only toggles the column once a thread is serving this work', async () => {
    const { container, newThread } = await mountTopbar('s-6')
    workbenchActions.closeDetails()

    await click(container)
    expect(newThread).not.toHaveBeenCalled()
    expect(getWorkbenchState().panels.details).toBeGreaterThan(0)

    await click(container)
    expect(getWorkbenchState().panels.details).toBe(0)
  })
})
