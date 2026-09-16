// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { NovelThreadHeader } from '../src/client/NovelThreadHeader.js'
import { resetWorkbench, workbenchActions } from '../src/client/store.js'

/**
 * AI 无输出: the Host records a failed turn (`turn/end` with `kind: 'error'`) and
 * its message lands on the session snapshot's `lastAgentError`. Without a
 * surface for it the author just sees silence, so the novel strip says what
 * happened and offers to resend the sentence that failed.
 */
const work = {
  workspaceId: 'ws-1',
  path: '/books/x',
  title: '天机阁主',
  sessionIds: ['session-1'],
  createdAt: '',
  updatedAt: '',
}

function render(snapshot: Record<string, unknown>, resend: (sessionId: string, text: string) => Promise<void>) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const ready = act(async () => {
    root.render(createElement(NovelThreadHeader as never, {
      sessionId: 'session-1',
      useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: [work] }),
      useSessions: (selector: (value: unknown) => unknown) => selector({ current: 'session-1' }),
      useSession: (selector: (value: unknown) => unknown) => selector(snapshot),
      loadReviews: async () => ({ acceptedRevision: 2, proposals: [] }),
      resend,
    } as never))
  })
  return { ready, container, root }
}

describe('novel-mode failed-turn strip', () => {
  it('names the failure and resends the sentence that failed', async () => {
    resetWorkbench()
    workbenchActions.setCurrentSession('session-1' as never)
    workbenchActions.rememberSubmission('session-1', '只回复两个字：收到')
    // A failed *turn* never reaches the snapshot; the plugin mirrors it from the
    // session's own event window into this store field.
    workbenchActions.setTurnFailure({
      sessionId: 'session-1' as never,
      message: 'Authentication Fails, Your api key is invalid',
    })

    const resend = vi.fn(async () => {})
    const rendered = render(
      { lastAgentError: null, promptError: null, running: false },
      resend,
    )
    await rendered.ready
    const { container, root } = rendered
    await act(async () => {})

    const strip = container.querySelector('[data-novel-thread-failure]')
    expect(strip).not.toBeNull()
    expect(strip?.textContent).toContain('上次生成失败')
    expect(strip?.textContent).toContain('Authentication Fails')
    const retry = strip?.querySelector<HTMLButtonElement>('[data-novel-thread-retry]')
    expect(retry).not.toBeNull()
    await act(async () => { retry?.click() })
    await act(async () => {})
    expect(resend).toHaveBeenCalledWith('session-1', '只回复两个字：收到')
    await act(async () => { root.unmount() })
    resetWorkbench()
  })
})
