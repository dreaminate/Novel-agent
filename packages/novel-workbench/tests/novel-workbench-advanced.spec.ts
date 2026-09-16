// @vitest-environment jsdom
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'

const works = [{
  workspaceId: 'ws-mist',
  path: '/books/mist-harbor',
  title: '雾港夜航：第七码头',
  sessionIds: ['s-6'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}]

const sessionState = {
  ids: ['s-6'],
  byId: { 's-6': { id: 's-6', displayTitle: '第 6 章 · 冷库之下的通道', running: true, blank: false, updatedAt: 1 } },
  current: 's-6',
  phase: 'ready',
  subagentsByParent: {
    's-6': {
      state: 'ready',
      entries: [
        { kind: 'child', id: 'child-1', activity: 'running', hasChildren: false, mode: 'continuable', label: '资料收集' },
        { kind: 'diagnostic', id: 'child-2', reason: 'unavailable' },
      ],
    },
  },
  jobsBySession: {
    's-6': [{ id: 'job-1', kind: 'bash', label: '生成第 6 章草稿', status: 'running', startedAt: 1 }],
  },
  currentAddress: undefined,
}

const diagnostics = {
  projectId: 'project-mist',
  workspaceId: 'ws-mist',
  cwd: '/books/mist-harbor',
  acceptedRevision: 5,
  locks: ['character-state/chen-mo'],
  canonJson: '{\n  "revision": 5\n}',
}

function faceStubs() {
  return {
    sessionId: 's-6',
    useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: works }),
    useSessions: (selector: (value: unknown) => unknown) => selector(sessionState),
    loadOutline: vi.fn(),
    loadStoryMap: vi.fn(),
    loadReviews: vi.fn(),
    previewReview: vi.fn(),
    submitReview: vi.fn(),
    discardProposal: vi.fn(),
    loadHistory: vi.fn(),
    rollbackTo: vi.fn(),
    loadDiagnostics: vi.fn(async () => diagnostics),
    // The inventory-backed panels read the Host's plugin list and the dynamic
    // Cordis inventory; this fixture answers with an empty deployment.
    loadAdvancedPanels: vi.fn(async () => ({ plugins: [], presets: [], cordis: [] })),
    openThread: vi.fn(),
    newThread: vi.fn(),
  }
}

describe('novel-mode advanced surface', () => {
  it('renders kernel facts, jobs, subagents and the raw Canon projection', async () => {
    const { NovelCanvas } = await import('../src/client/NovelCanvas.js') as {
      NovelCanvas: (props: Record<string, unknown>) => unknown
    }
    const { workbenchActions } = await import('../src/client/store.js') as {
      workbenchActions: { setView(view: string): void }
    }
    workbenchActions.setView('advanced')

    const props = faceStubs()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(NovelCanvas as never, props as never))
    })
    await act(async () => {})

    expect(props.loadDiagnostics).toHaveBeenCalledWith('ws-mist')
    expect(container.querySelector('[data-novel-canvas="advanced"]')).not.toBeNull()
    expect(container.textContent).toContain('project-mist')
    expect(container.textContent).toContain('/books/mist-harbor')
    expect(container.querySelector('[data-novel-advanced-job="job-1"]')?.textContent)
      .toContain('生成第 6 章草稿')
    expect(container.querySelectorAll('[data-novel-advanced-subagent]')).toHaveLength(1)
    expect(container.textContent).toContain('资料收集')
    expect(container.querySelector('[data-novel-advanced-canon]')?.textContent)
      .toContain('"revision": 5')

    await act(async () => { root.unmount() })
  })

  it('names the work and links to the proposals waiting in the thread header', async () => {
    const { NovelThreadHeader } = await import('../src/client/NovelThreadHeader.js') as {
      NovelThreadHeader: (props: Record<string, unknown>) => unknown
    }
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const loadReviews = vi.fn(async () => ({ acceptedRevision: 5, proposals: [{ packetId: 'p1' }, { packetId: 'p2' }] }))
    await act(async () => {
      root.render(createElement(NovelThreadHeader as never, {
        sessionId: 's-6',
        useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: works }),
        // The strip reads the session snapshot for a failed turn; this fixture
        // has no failure to report.
        useSession: (selector: (value: unknown) => unknown) => selector({
          lastAgentError: null,
          promptError: null,
          running: false,
        }),
        loadReviews,
        loadOutline: vi.fn(),
        loadStoryMap: vi.fn(),
        previewReview: vi.fn(),
        submitReview: vi.fn(),
        discardProposal: vi.fn(),
        loadHistory: vi.fn(),
        rollbackTo: vi.fn(),
        loadDiagnostics: vi.fn(),
        openThread: vi.fn(),
        newThread: vi.fn(),
      } as never))
    })
    await act(async () => {})

    expect(container.querySelector('[data-novel-thread-header]')?.textContent)
      .toContain('雾港夜航：第七码头')
    expect(container.textContent).toContain('R5')
    expect(container.querySelector('[data-novel-thread-pending]')?.textContent).toBe('待审提案 2')

    await act(async () => { root.unmount() })
  })
})
