// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { NovelThreadHeader } from '../src/client/NovelThreadHeader.js'
import { NovelThreadNotice } from '../src/client/NovelThreadNotice.js'
import { resetWorkbench, workbenchActions } from '../src/client/store.js'

/**
 * AI 无输出: the Host records a failed turn (`turn/end` with `kind: 'error'`) and
 * its message lands on the session snapshot's `lastAgentError`. Without a
 * surface for it the author just sees silence, so the novel mode says what
 * happened and offers to resend the sentence that failed.
 *
 * That surface is the strip under the transcript (`NovelThreadNotice`), not the
 * thread header. It used to live in the header while the transcript said nothing
 * about the failure; once the frame started rendering the thread's own lines the
 * two said it at once, so it moved down to where the author is reading. The
 * second test below is what keeps it from creeping back.
 */
const work = {
  workspaceId: 'ws-1',
  path: '/books/x',
  title: '天机阁主',
  sessionIds: ['session-1'],
  createdAt: '',
  updatedAt: '',
}

/** Put one failed turn into the state both surfaces read. */
function failTurn(): void {
  resetWorkbench()
  workbenchActions.setCurrentSession('session-1' as never)
  workbenchActions.rememberSubmission('session-1' as never, '只回复两个字：收到')
  // A failed *turn* never reaches the snapshot; the plugin mirrors it from the
  // session's own event window into this store field.
  workbenchActions.setTurnFailure({
    sessionId: 'session-1' as never,
    message: 'Authentication Fails, Your api key is invalid',
  })
}

function mount(component: unknown, props: Record<string, unknown>) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const ready = act(async () => { root.render(createElement(component as never, props as never)) })
  return { ready, container, root }
}

describe('novel-mode failed-turn strip', () => {
  it('names the failure under the transcript and resends the sentence that failed', async () => {
    failTurn()

    const resend = vi.fn(async () => {})
    const rendered = mount(NovelThreadNotice, {
      sessionId: 'session-1',
      useSession: (selector: (value: unknown) => unknown) => selector({ lastAgentError: null, promptError: null, running: false }),
      resend,
    })
    await rendered.ready
    const { container, root } = rendered
    await act(async () => {})

    const strip = container.querySelector('[data-novel-thread-notice]')
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

  it('leaves the same failure out of the thread header', async () => {
    failTurn()

    const rendered = mount(NovelThreadHeader, {
      sessionId: 'session-1',
      useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: [work] }),
      useSessions: (selector: (value: unknown) => unknown) => selector({ current: 'session-1' }),
      useSession: (selector: (value: unknown) => unknown) => selector({ lastAgentError: null, promptError: null, running: false }),
      loadReviews: async () => ({ acceptedRevision: 2, proposals: [] }),
      resend: async () => {},
    })
    await rendered.ready
    const { container, root } = rendered
    await act(async () => {})

    // The header keeps naming the work; the failure is not its business any more.
    expect(container.textContent).toContain('天机阁主')
    expect(container.querySelector('[data-novel-thread-notice]')).toBeNull()
    expect(container.querySelector('[data-novel-thread-retry]')).toBeNull()
    expect(container.textContent).not.toContain('上次生成失败')

    await act(async () => { root.unmount() })
    resetWorkbench()
  })
})
