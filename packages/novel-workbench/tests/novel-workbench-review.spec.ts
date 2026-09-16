// @vitest-environment jsdom
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { NovelPendingProposal, NovelResultItemDecision } from '@novel-agent/novel-project/types'
import { buildReviewProposal } from '../src/client/novel-data.js'

const provenance = { taskId: 'task-6', sessionId: 's-6', producer: 'proposal' }

const pending = {
  packetId: 'packet-6',
  receivedAt: 1,
  producer: 'novel-writing',
  packet: {
    packetId: 'packet-6',
    expectedRevision: 5,
    manuscript: {
      expectedRevision: 5,
      format: 'txt',
      sourceId: 'source-6',
      unitId: 'chapter-6',
      title: '冷库之下的通道',
      text: '陈默推开门。',
    },
    deltas: [{
      id: 'delta-1',
      kind: 'character-state',
      operation: 'set',
      targetId: 'chen-mo',
      field: 'location',
      value: '3 号冷库地下通道',
      sourceAnchorIds: ['anchor-1'],
    }],
    issues: [{
      id: 'issue-1',
      dimension: 'continuity',
      severity: 'major',
      problem: '第 4 章说陈默受伤，这里却翻墙。',
      suggestion: '改成他扶墙走。',
      sourceAnchorIds: ['anchor-2'],
    }],
    sourceAnchors: [],
    provenance,
  },
} as unknown as NovelPendingProposal

const works = [{
  workspaceId: 'ws-mist',
  path: '/books/mist-harbor',
  title: '雾港夜航：第七码头',
  sessionIds: ['s-6'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}]

describe('novel-mode proposal review', () => {
  it('maps one pending proposal to author-facing rows', () => {
    const review = buildReviewProposal(pending)

    expect(review.chapterTitle).toBe('冷库之下的通道')
    expect(review.words).toBe(6)
    expect(review.deltas).toEqual([{ id: 'delta-1', summary: '更新人物状态：3 号冷库地下通道' }])
    expect(review.issues).toEqual([{
      id: 'issue-1',
      severityLabel: '重要',
      dimensionLabel: '连续性',
      problem: '第 4 章说陈默受伤，这里却翻墙。',
      suggestion: '改成他扶墙走。',
      anchorCount: 1,
    }])
  })

  it('stages per-item decisions, previews them and writes only on 接受本章', async () => {
    const { NovelCanvas } = await import('../src/client/NovelCanvas.js') as {
      NovelCanvas: (props: Record<string, unknown>) => unknown
    }
    const { workbenchActions } = await import('../src/client/store.js') as {
      workbenchActions: { setView(view: string): void }
    }
    workbenchActions.setView('review')

    const previews: (readonly NovelResultItemDecision[])[] = []
    const loadReviews = vi.fn(async () => ({ acceptedRevision: 5, proposals: [buildReviewProposal(pending)] }))
    const previewReview = vi.fn(async (
      _sessionId: string,
      _workspaceId: string,
      _packet: unknown,
      decisions: readonly NovelResultItemDecision[],
    ) => {
      previews.push(decisions)
      return { fromRevision: 5, toRevision: 6, manuscriptChanged: true, settingChanges: 1, unacceptedIssues: 0 }
    })
    const submitReview = vi.fn(async () => ({ revision: 6, acceptedSettings: 0, manuscriptAccepted: false }))

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
        loadOutline: vi.fn(),
        loadStoryMap: vi.fn(),
        loadReviews,
        previewReview,
        submitReview,
        discardProposal: vi.fn(),
        loadHistory: vi.fn(),
        rollbackTo: vi.fn(),
        openThread: vi.fn(),
        newThread: vi.fn(),
      } as never))
    })
    await act(async () => {})

    expect(loadReviews).toHaveBeenCalledWith('ws-mist')
    expect(container.querySelector('[data-novel-review="packet-6"]')).not.toBeNull()
    expect(container.querySelector('.nw-review-route')?.textContent)
      .toBe('R5 → R6 · 冷库之下的通道 · 约 6 字')
    expect(container.textContent).toContain('更新人物状态：3 号冷库地下通道')
    expect(container.textContent).toContain('重要')
    expect(container.textContent).toContain('连续性')
    expect(previews.at(-1)?.map(decision => decision.itemType))
      .toEqual(['delta', 'manuscript', 'issue'])

    // 接受设定、拒绝正文: reject the manuscript item, keep the setting change.
    const manuscriptReject = container.querySelector(
      '[data-novel-review-delta="delta-1"] [data-novel-review-decision="reject"]',
    )
    expect(manuscriptReject).not.toBeNull()

    const issueToggle = container.querySelector(
      '[data-novel-review-issue="issue-1"] [data-novel-review-decision="issue"]',
    )
    await act(async () => {
      (issueToggle as HTMLElement).click()
    })
    expect(previews.at(-1)?.find(decision => decision.itemType === 'issue')?.outcome).toBe('reject')

    await act(async () => {
      (container.querySelector('[data-novel-review-accept]') as HTMLElement).click()
    })
    await act(async () => {})

    // The prototype confirms before writing: 接受本章 opens a sheet that spells
    // out what the decision will write, and nothing reaches the Host until the
    // author confirms it there.
    expect(submitReview).not.toHaveBeenCalled()
    const sheet = container.querySelector('[data-novel-review-confirm]')
    expect(sheet).not.toBeNull()
    expect(sheet?.textContent).toContain('确认接受本章？')
    expect(sheet?.textContent).toContain('设定变更 1 条')

    await act(async () => {
      const back = sheet?.querySelector('[data-novel-review-confirm-back]')
      expect(back).not.toBeNull()
      ;(back as HTMLElement).click()
    })
    expect(container.querySelector('[data-novel-review-confirm]')).toBeNull()
    expect(submitReview).not.toHaveBeenCalled()

    await act(async () => {
      (container.querySelector('[data-novel-review-accept]') as HTMLElement).click()
    })
    await act(async () => {
      (container.querySelector('[data-novel-review-confirm-yes]') as HTMLElement).click()
    })
    await act(async () => {})

    expect(submitReview).toHaveBeenCalledTimes(1)
    const decisions = submitReview.mock.calls[0]?.[3] as readonly NovelResultItemDecision[]
    expect(decisions.find(decision => decision.itemType === 'issue')?.outcome).toBe('reject')
    expect(decisions.find(decision => decision.itemType === 'delta')?.outcome).toBe('accept')

    await act(async () => { root.unmount() })
  })

  it('shows the stale state and offers only 丢弃提案', async () => {
    const { NovelCanvas } = await import('../src/client/NovelCanvas.js') as {
      NovelCanvas: (props: Record<string, unknown>) => unknown
    }
    const { workbenchActions } = await import('../src/client/store.js') as {
      workbenchActions: { setView(view: string): void }
    }
    workbenchActions.setView('review')

    const stale = structuredClone(pending) as NovelPendingProposal
    ;(stale.packet as { expectedRevision: number }).expectedRevision = 4
    const discardProposal = vi.fn(async () => {})

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
        loadOutline: vi.fn(),
        loadStoryMap: vi.fn(),
        loadReviews: vi.fn(async () => ({ acceptedRevision: 5, proposals: [buildReviewProposal(stale)] })),
        previewReview: vi.fn(),
        submitReview: vi.fn(),
        discardProposal,
        loadHistory: vi.fn(),
        rollbackTo: vi.fn(),
        openThread: vi.fn(),
        newThread: vi.fn(),
      } as never))
    })
    await act(async () => {})

    expect(container.textContent).toContain('此提案已过期')
    expect(container.querySelector('[data-novel-review-accept]')).toBeNull()
    await act(async () => {
      (container.querySelector('[data-novel-review-discard]') as HTMLElement).click()
    })
    await act(async () => {})
    expect(discardProposal).toHaveBeenCalledWith('ws-mist', 'packet-6')

    await act(async () => { root.unmount() })
  })
})
