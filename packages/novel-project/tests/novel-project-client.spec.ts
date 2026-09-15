// @vitest-environment jsdom
import { Context, Service } from '@deepseek-ai/cordis'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import novelProjectRemote from '@novel-agent/novel-project/remote'
import { NARRATIVE_CLOCKS } from '../src/types.js'

type SessionId = string

interface NovelProjectPanelActions {
  openProject: (workspaceId: unknown) => Promise<unknown>
  generateReviewDraft: (
    workspaceId: unknown,
    request: unknown,
    signal?: AbortSignal,
  ) => Promise<unknown>
  previewReview: (workspaceId: unknown, review: unknown) => Promise<unknown>
  reviewResultPacket: (workspaceId: unknown, review: unknown) => Promise<unknown>
  retrieve: (workspaceId: unknown, query: unknown) => Promise<unknown>
  readRevision: (workspaceId: unknown, revision: number) => Promise<unknown>
  projectCanon: (workspaceId: unknown, revision: number) => Promise<unknown>
  projectNarrative: (workspaceId: unknown, revision: number) => Promise<unknown>
  projectManuscripts: (workspaceId: unknown, revision: number) => Promise<unknown>
  projectRelationships: (workspaceId: unknown, revision: number) => Promise<unknown>
  rollbackRevision: (workspaceId: unknown, command: unknown) => Promise<unknown>
  pendingProposals: (workspaceId: unknown) => Promise<unknown>
  discardProposal: (workspaceId: unknown, packetId: string) => Promise<unknown>
}

const SESSION_ID = 'session-novel-project' as SessionId

function legacyChatSelector(legacy: unknown) {
  return (selector: (snapshot: unknown) => unknown): unknown => selector({ legacy })
}

const useEmptyChat = legacyChatSelector({ nodes: [] })

async function emptyProjectNarrative(workspaceId: unknown, revision: number) {
  return {
    ok: true,
    value: {
      projectId: `project-${String(workspaceId)}`,
      workspaceId: String(workspaceId),
      revision,
      units: [],
      clocks: NARRATIVE_CLOCKS.map(clock => ({ clock, entries: [], debts: [] })),
    },
  } as const
}

async function defaultProjectManuscripts(workspaceId: unknown, revision: number) {
  return {
    ok: true,
    value: revision === 0
      ? []
      : [{
          manuscript: {
            unitId: 'chapter-1',
            title: '第一章',
            text: '她推开门。',
          },
          sourceRevision: revision,
          provenance: {
            taskId: `task-${String(workspaceId)}-r${String(revision)}`,
            sessionId: SESSION_ID,
            producer: 'client-test',
          },
        }],
  } as const
}

async function emptyProjectRelationships(workspaceId: unknown, revision: number) {
  return {
    ok: true,
    value: {
      projectId: `project-${String(workspaceId)}`,
      workspaceId: String(workspaceId),
      revision,
      relationships: [],
    },
  } as const
}

interface StockConversationViewEntry {
  readonly component: unknown
  readonly options: {
    readonly name: 'conversation.view'
    readonly id?: string
    readonly order?: number
    readonly label?: string
  }
  readonly inject?: unknown
}

/** Minimal ledger for the one stock DSH Slot this plugin is allowed to ride. */
class StockConversationSlots {
  private entriesValue: StockConversationViewEntry[] = []

  inject(name: string, callback: () => () => void): () => void {
    return name === 'conversation.view' ? callback() : () => {}
  }

  register(options: StockConversationViewEntry['options'] & { inject?: unknown }, component: unknown): () => void {
    const entry: StockConversationViewEntry = {
      component,
      options: {
        name: options.name,
        ...(options.id === undefined ? {} : { id: options.id }),
        ...(options.order === undefined ? {} : { order: options.order }),
        ...(options.label === undefined ? {} : { label: options.label }),
      },
      ...(options.inject === undefined ? {} : { inject: options.inject }),
    }
    this.entriesValue.push(entry)
    return () => {
      this.entriesValue = this.entriesValue.filter(candidate => candidate !== entry)
    }
  }

  entries(name: string): readonly StockConversationViewEntry[] {
    return name === 'conversation.view' ? this.entriesValue : []
  }
}

describe('小说工作台 client plugin', () => {
  it('adds the real Remote-backed panel to the stock conversation view ring', async () => {
    const clientModulePath = '../src/client/index.js'
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { apply } = await import(clientModulePath) as {
      apply: (ctx: Context) => Promise<() => Promise<void>>
    }
    const { NovelProjectPanel } = await import(panelModulePath) as {
      NovelProjectPanel: unknown
    }
    const ctx = new Context()
    const slots = new StockConversationSlots()
    ctx.provide('slots', slots as never)

    const result = { ok: true, value: { marker: 'remote-result' } } as const
    const namespace = {
      open: vi.fn(async () => result),
      reviewDraft: vi.fn(async () => result),
      previewReview: vi.fn(async () => result),
      review: vi.fn(async () => result),
      retrieve: vi.fn(async () => result),
      read: vi.fn(async () => result),
      projectCanon: vi.fn(async () => result),
      projectNarrative: vi.fn(async () => result),
      projectManuscripts: vi.fn(async () => result),
      projectRelationships: vi.fn(async () => result),
      rollback: vi.fn(async () => result),
      pendingProposals: vi.fn(async () => result),
      discardProposal: vi.fn(async () => result),
    }
    const teardownOrder: string[] = []

    class RemoteService extends Service {
      constructor(serviceCtx: Context) {
        super(serviceCtx, 'remote')
      }

      async $mount(contribution: unknown): Promise<() => Promise<void>> {
        expect(contribution).toBe(novelProjectRemote)
        const disposeNamespace = ctx.provide('remote.novelProject', namespace as never)
        return async () => {
          const viewStillMounted = slots.entries('conversation.view')
            .some(entry => entry.options.id === 'novel-project')
          teardownOrder.push(viewStillMounted ? 'remote-before-view' : 'remote-after-view')
          await disposeNamespace()
        }
      }
    }
    new RemoteService(ctx)

    const dispose = await apply(ctx as never)
    const entry = slots.entries('conversation.view')
      .find(candidate => candidate.options.id === 'novel-project')

    expect(entry).toBeDefined()
    if (entry === undefined) throw new Error('小说工作台 conversation view was not registered')
    expect(entry.options).toMatchObject({
      name: 'conversation.view',
      id: 'novel-project',
      order: 10,
      label: '小说工作台',
    })
    expect(entry.component).toBe(NovelProjectPanel)

    const actions = (entry.inject as unknown as (
      sessionId: SessionId,
    ) => NovelProjectPanelActions)(SESSION_ID)
    const packet = {
      packetId: 'packet-client-slot',
      expectedRevision: 0,
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章',
        text: '她推开门，看见雪落满旧庭。',
      },
      manuscriptDiff: {
        format: 'unified',
        text: '--- accepted/chapter-1\n+++ draft/chapter-1\n+她推开门，看见雪落满旧庭。',
      },
      deltas: [],
      issues: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-client-slot',
        sessionId: SESSION_ID,
        producer: 'client-slot-test',
      },
    } as const
    expect(packet).not.toHaveProperty('authorization')
    const rollback = {
      commandId: 'rollback-client-slot',
      expectedRevision: 2,
      targetRevision: 1,
      provenance: {
        taskId: 'task-rollback-client-slot',
        sessionId: SESSION_ID,
        producer: 'novel-project-panel',
      },
    } as const
    const reviewRequest = { revision: 2, unitId: 'chapter-1', focus: 'continuity' }
    const signal = new AbortController().signal
    await expect(actions.openProject('workspace-1' as never)).resolves.toBe(result)
    await expect(actions.generateReviewDraft(
      'workspace-1' as never,
      reviewRequest,
      signal,
    )).resolves.toBe(result)
    await expect(actions.previewReview('workspace-1' as never, {
      packet,
      decisions: [],
    })).resolves.toBe(result)
    await expect(actions.reviewResultPacket('workspace-1' as never, {
      packet,
      decisions: [],
    })).resolves.toBe(result)
    await expect(actions.retrieve('workspace-1' as never, {
      revision: 2,
      compareRevision: 1,
    })).resolves.toBe(result)
    await expect(actions.readRevision('workspace-1' as never, 2)).resolves.toBe(result)
    await expect(actions.projectCanon('workspace-1' as never, 2)).resolves.toBe(result)
    await expect(actions.projectNarrative('workspace-1' as never, 2)).resolves.toBe(result)
    await expect(actions.projectManuscripts('workspace-1' as never, 2)).resolves.toBe(result)
    await expect(actions.projectRelationships('workspace-1' as never, 2)).resolves.toBe(result)
    await expect(actions.rollbackRevision('workspace-1' as never, rollback)).resolves.toBe(result)
    await expect(actions.pendingProposals('workspace-1' as never)).resolves.toBe(result)
    await expect(actions.discardProposal('workspace-1' as never, 'packet-client-slot'))
      .resolves.toBe(result)
    expect(namespace.open).toHaveBeenCalledWith('workspace-1')
    expect(namespace.reviewDraft).toHaveBeenCalledWith(
      SESSION_ID,
      'workspace-1',
      reviewRequest,
      signal,
    )
    expect(packet).not.toHaveProperty('authorization')
    expect(rollback).not.toHaveProperty('authorization')
    expect(JSON.stringify([packet, rollback])).not.toContain('actorId')
    expect(JSON.stringify([packet, rollback])).not.toContain('decisionId')
    expect(namespace.previewReview).toHaveBeenCalledWith(SESSION_ID, 'workspace-1', {
      packet,
      decisions: [],
    })
    expect(namespace.review).toHaveBeenCalledWith(SESSION_ID, 'workspace-1', {
      packet,
      decisions: [],
    })
    expect(namespace.retrieve).toHaveBeenCalledWith('workspace-1', {
      revision: 2,
      compareRevision: 1,
    })
    expect(namespace.read).toHaveBeenCalledWith('workspace-1', 2)
    expect(namespace.projectCanon).toHaveBeenCalledWith('workspace-1', 2)
    expect(namespace.projectNarrative).toHaveBeenCalledWith('workspace-1', 2)
    expect(namespace.projectManuscripts).toHaveBeenCalledWith('workspace-1', 2)
    expect(namespace.projectRelationships).toHaveBeenCalledWith('workspace-1', 2)
    expect(namespace.rollback).toHaveBeenCalledWith(SESSION_ID, 'workspace-1', rollback)
    expect(namespace.pendingProposals).toHaveBeenCalledWith('workspace-1')
    expect(namespace.discardProposal).toHaveBeenCalledWith('workspace-1', 'packet-client-slot')

    await dispose()
    expect(slots.entries('conversation.view')
      .some(candidate => candidate.options.id === 'novel-project')).toBe(false)
    expect(teardownOrder).toEqual(['remote-after-view'])
  })

  it('renders both directional states in one accepted relationship line', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-relationships'
    const costlyTurn = {
      turnId: 'turn-burn-exit-map',
      eventId: 'event-burn-exit-map',
      storyOrder: 20,
      turnType: 'sacrifice',
      action: 'Alice burns her only exit map to buy Bob time.',
      otherResponse: 'Bob abandons the chase and returns for Alice.',
      cost: 'They lose both the traitor and their independent escape route.',
      persistentConsequence: 'Neither can now leave the old court alone.',
      stageAfter: 'costly-mutual-reliance',
    } as const
    const forwardLineState = {
      version: 2,
      premise: 'A shared cipher forces Alice and Bob into an alliance.',
      form: 'costly allies',
      stage: 'costly-mutual-reliance',
      independentGoal: 'Alice must expose the traitor without surrendering the original letter.',
      currentTrust: 'Alice trusts Bob to return for her under pressure.',
      currentConflict: 'Their factions demand opposite owners for the decoded list.',
      currentCommitment: 'They leave the old court together before deciding who keeps the list.',
      boundaries: ['Neither names the other\'s informants', 'Neither promises permanent allegiance'],
      sharedHistory: ['They first covered each other during the north-gate ambush'],
      obstacles: ['Their factions remain enemies', 'Their independent escape routes are gone'],
      unresolvedDebts: [
        'Alice still owes Bob the truth about the original letter',
        'They must decide which faction receives the decoded list',
      ],
      mainPlotConsequences: [
        'Losing the traitor shifts the main investigation to the leaked escape route',
        'Both factions now treat Alice and Bob as disobedient agents',
      ],
      turns: [costlyTurn],
      agencyEvidence: [
        'Alice proposed the original limited alliance',
        'Alice chose Bob\'s survival over her own escape route',
      ],
      desiredEndingState: 'They can openly choose each other while retaining independent goals.',
      revisionRationale: 'The mutual sacrifice turns provisional cooperation into earned reliance.',
    } as const
    const reverseLineState = {
      version: 1,
      premise: 'Bob needs Alice to decode the traitor list.',
      form: 'guarded intelligence partners',
      stage: 'guarded-cooperation',
      independentGoal: 'Bob must return the decoded list to his own faction.',
      currentTrust: 'Bob trusts Alice\'s judgment but not her faction.',
      currentConflict: 'He expects Alice to destroy names that implicate her allies.',
      currentCommitment: 'He will not move against Alice\'s faction before the list is decoded.',
      boundaries: ['Alice does not reveal Bob\'s identity'],
      sharedHistory: ['Alice once held off pursuers at the north gate'],
      obstacles: ['Bob still carries an order to arrest Alice'],
      unresolvedDebts: ['Bob still owes Alice the source of the arrest order'],
      mainPlotConsequences: ['Delaying the arrest lets the cipher investigation continue'],
      turns: [],
      agencyEvidence: ['Bob chose to delay the arrest order'],
      desiredEndingState: null,
      revisionRationale: null,
    } as const
    const forward = {
      pair: 'alice->bob',
      from: 'alice',
      to: 'bob',
      fields: {
        'line-state': forwardLineState,
        trust: 'growing',
        status: 'allied',
      },
      fieldSources: {
        'line-state': {
          value: forwardLineState,
          sourceRevision: 2,
          sourceDeltaId: 'relationship-line-state-r2',
          sourceAnchorIds: ['relationship-anchor-r2'],
          provenance: {
            taskId: 'relationship-task-r2',
            sessionId: SESSION_ID,
            producer: 'relationship-test',
          },
        },
        trust: {
          value: 'growing',
          sourceRevision: 1,
          sourceDeltaId: 'relationship-trust-r1',
          sourceAnchorIds: ['relationship-anchor-r1'],
          provenance: {
            taskId: 'relationship-task-r1',
            sessionId: SESSION_ID,
            producer: 'relationship-test',
          },
        },
        status: {
          value: 'allied',
          sourceRevision: 1,
          sourceDeltaId: 'relationship-status-r1',
          sourceAnchorIds: ['relationship-anchor-r1'],
          provenance: {
            taskId: 'relationship-task-r1',
            sessionId: SESSION_ID,
            producer: 'relationship-test',
          },
        },
      },
      sourceRevision: 2,
      sourceDeltaId: 'relationship-line-state-r2',
      sourceAnchorIds: ['relationship-anchor-r1', 'relationship-anchor-r2'],
      provenance: {
        taskId: 'relationship-task-r2',
        sessionId: SESSION_ID,
        producer: 'relationship-test',
      },
    } as const
    const reverse = {
      pair: 'bob->alice',
      from: 'bob',
      to: 'alice',
      fields: {
        'line-state': reverseLineState,
        status: 'guarded',
        trust: 3,
      },
      fieldSources: {
        'line-state': {
          value: reverseLineState,
          sourceRevision: 1,
          sourceDeltaId: 'relationship-line-state-reverse-r1',
          sourceAnchorIds: ['relationship-anchor-r1'],
          provenance: {
            taskId: 'relationship-task-r1',
            sessionId: SESSION_ID,
            producer: 'relationship-test',
          },
        },
        status: {
          value: 'guarded',
          sourceRevision: 1,
          sourceDeltaId: 'relationship-reverse-status-r1',
          sourceAnchorIds: ['relationship-anchor-r1'],
          provenance: {
            taskId: 'relationship-task-r1',
            sessionId: SESSION_ID,
            producer: 'relationship-test',
          },
        },
        trust: {
          value: 3,
          sourceRevision: 1,
          sourceDeltaId: 'relationship-reverse-trust-r1',
          sourceAnchorIds: ['relationship-anchor-r1'],
          provenance: {
            taskId: 'relationship-task-r1',
            sessionId: SESSION_ID,
            producer: 'relationship-test',
          },
        },
      },
      sourceRevision: 1,
      sourceDeltaId: 'relationship-reverse-trust-r1',
      sourceAnchorIds: ['relationship-anchor-r1'],
      provenance: {
        taskId: 'relationship-task-r1',
        sessionId: SESSION_ID,
        producer: 'relationship-test',
      },
    } as const
    const projectRelationships = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-relationships',
        workspaceId,
        revision: 2,
        relationships: [{
          line: 'alice<->bob',
          participants: ['alice', 'bob'],
          directions: [forward, reverse],
        }],
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-relationships',
              workspaceId,
              cwd: 'C:/novels/relationships',
              acceptedRevision: 2,
              canonLocks: [],
            },
          })),
          generateReviewDraft: vi.fn(),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({
            ok: true,
            value: {
              revision: 2,
              parentRevision: 1,
              packetId: 'packet-relationships-r2',
              manuscript: { unitId: 'chapter-1', title: '第一章', text: '正文' },
              deltas: [],
              issues: [],
              decisions: [],
              sourceAnchors: [],
              provenance: forward.provenance,
              authorization: {
                kind: 'author',
                actorId: 'author-relationships',
                decisionId: 'decision-relationships-r1',
              },
            },
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-relationships',
              workspaceId,
              revision: 1,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(projectRelationships).toHaveBeenCalledWith(workspaceId, 2)
      const section = container.querySelector('[data-novel-project-relationships]')
      expect(section).not.toBeNull()
      expect(section?.getAttribute('aria-label')).toBe('人物关系')
      expect(section?.textContent).toContain('alice → bob')
      expect(section?.textContent).toContain('trust: growing')
      expect(section?.textContent).toContain('status: allied')
      const forwardState = section?.querySelector('[data-relationship-line-state="alice->bob"]')
      expect(forwardState).not.toBeNull()
      expect(forwardState?.textContent).toContain('前提：A shared cipher forces Alice and Bob into an alliance.')
      expect(forwardState?.textContent).toContain('形式：costly allies')
      expect(forwardState?.textContent).toContain('阶段：costly-mutual-reliance')
      expect(forwardState?.textContent).toContain('独立目标：Alice must expose the traitor')
      expect(forwardState?.textContent).toContain('当前信任：Alice trusts Bob to return')
      expect(forwardState?.textContent).toContain('当前冲突：Their factions demand opposite owners')
      expect(forwardState?.textContent).toContain('当前承诺：They leave the old court together')
      expect([...forwardState?.querySelectorAll('[data-relationship-line-boundary]') ?? []]
        .map(item => item.textContent)).toEqual([...forwardLineState.boundaries])
      expect([...forwardState?.querySelectorAll('[data-relationship-line-history]') ?? []]
        .map(item => item.textContent)).toEqual([...forwardLineState.sharedHistory])
      expect([...forwardState?.querySelectorAll('[data-relationship-line-obstacle]') ?? []]
        .map(item => item.textContent)).toEqual([...forwardLineState.obstacles])
      expect([...forwardState?.querySelectorAll('[data-relationship-line-debt]') ?? []]
        .map(item => item.textContent)).toEqual([...forwardLineState.unresolvedDebts])
      expect([...forwardState?.querySelectorAll('[data-relationship-main-plot-consequence]') ?? []]
        .map(item => item.textContent)).toEqual([...forwardLineState.mainPlotConsequences])
      const turn = forwardState?.querySelector('[data-relationship-line-turn="turn-burn-exit-map"]')
      expect(turn).not.toBeNull()
      expect(turn?.textContent).toContain('sacrifice · event-burn-exit-map · order 20')
      expect(turn?.textContent).toContain(`动作：${costlyTurn.action}`)
      expect(turn?.textContent).toContain(`对方反应：${costlyTurn.otherResponse}`)
      expect(turn?.textContent).toContain(`代价：${costlyTurn.cost}`)
      expect(turn?.textContent).toContain(`持久后果：${costlyTurn.persistentConsequence}`)
      expect(turn?.textContent).toContain(`之后阶段：${costlyTurn.stageAfter}`)
      expect([...forwardState?.querySelectorAll('[data-relationship-line-agency]') ?? []]
        .map(item => item.textContent)).toEqual([...forwardLineState.agencyEvidence])
      expect(forwardState?.textContent).toContain(`期望结局：${forwardLineState.desiredEndingState}`)
      expect(forwardState?.textContent).toContain(`修订理由：${forwardLineState.revisionRationale}`)
      expect(forwardState?.textContent).toContain('R2 · relationship-line-state-r2')
      expect(section?.textContent).toContain('bob → alice')
      expect(section?.textContent).toContain('trust: 3')
      expect(section?.textContent).toContain('status: guarded')
      const reverseState = section?.querySelector('[data-relationship-line-state="bob->alice"]')
      expect(reverseState).not.toBeNull()
      expect(reverseState?.textContent).toContain('前提：Bob needs Alice to decode the traitor list.')
      expect(reverseState?.textContent).toContain('期望结局：未完')
      expect(reverseState?.textContent).toContain('修订理由：初始')
      expect([...reverseState?.querySelectorAll('[data-relationship-line-debt]') ?? []]
        .map(item => item.textContent)).toEqual([...reverseLineState.unresolvedDebts])
      expect([...reverseState?.querySelectorAll('[data-relationship-main-plot-consequence]') ?? []]
        .map(item => item.textContent)).toEqual([...reverseLineState.mainPlotConsequences])
      expect(reverseState?.querySelectorAll('[data-relationship-line-turn]')).toHaveLength(0)
      expect(reverseState?.textContent).toContain('R1 · relationship-line-state-reverse-r1')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders grouped creative, contract, character, emotion and story state in the existing Canon panel', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-domain-state'
    const provenance = {
      taskId: 'task-domain-state-r1',
      sessionId: SESSION_ID,
      producer: 'domain-state-test',
    } as const
    const styleProfile = {
      version: 1,
      profileName: '旧庭悬疑叙事声线',
      voicePrinciples: ['克制陈述，把判断留给动作', '先写可感知细节，再落人物推断'],
      viewpoint: {
        person: '第三人称限知',
        distance: '贴近当前视角人物的身体感受',
        rules: ['不越过视角人物当前所知', '切换视角必须换章'],
      },
      sentenceRhythm: {
        principles: ['行动段用短句推进', '发现真相前用一长一短形成停顿'],
        forbiddenPatterns: ['连续三句同长度', '用抽象总结替代场景动作'],
      },
      dialogue: {
        principles: ['对白必须同时推进目标或关系', '重要拒绝优先通过回避表达'],
        characterDifferentiation: ['沈砚少用反问', '顾临川用具体事实拆穿回避'],
      },
      sensoryPriorities: ['声音', '温度', '触感'],
      subtextRules: ['关系变化先由选择和代价显现'],
      expositionRules: ['设定信息必须附着于当前障碍'],
      forbiddenHabits: ['不连续使用总结性尾句', '不替读者命名已经清楚的情绪'],
      approvedExemplars: [{
        exemplarId: 'exemplar-old-court-bell-r1',
        sourceUnitId: 'chapter-1',
        sourceRevision: 1,
        sourceAnchorIds: ['anchor-style-exemplar-r1'],
        purpose: '批准为克制悬疑开场与听觉细节范例',
      }],
      adaptationBoundaries: [{
        context: '高速追逐场景',
        invariants: ['保持限知', '保留动作产生的信息差'],
        mayVary: ['短句比例可提高', '感官重点可从声音转为触感'],
      }],
      revisionRationale: null,
    } as const
    const serializationProfile = {
      version: 1,
      platform: '番茄小说',
      cadence: {
        chaptersPerWeek: 5,
        releaseDays: ['周一', '周二', '周三', '周四', '周五'],
      },
      chapterLengthRange: {
        min: 2200,
        max: 2800,
      },
      plannedLength: {
        unit: 'characters',
        target: 1_200_000,
      },
      revisionRationale: null,
    } as const
    const readerContractProfile = {
      version: 1,
      premise: {
        distinctiveSituation: '失踪三年的兄长在月蚀前从封闭旧庭传回声音',
        centralDramaticQuestion: '沈砚能否在真相再次伤人前查清旧案',
        readerFantasy: '以主动调查夺回被家族秘密支配的人生',
        constraints: ['真相只能从已接受线索推进', '关键选择必须产生持续后果'],
        tonalRange: ['克制悬疑', '成长后的有限释放'],
      },
      coreExperience: '追查旧案时持续兑现成长、关系与真相承诺',
      promises: [{
        promiseId: 'promise-old-case',
        statement: '月蚀前给出旧案真相及其关系代价',
      }],
      exclusions: ['不以无来源新设定解决旧案', '不把最终选择让给路过强者'],
      targetAudience: {
        description: '重视长线伏笔、公平线索与有代价成长的中文长篇读者',
        expectations: ['每次延期带来新证据', '关系变化影响主线选择'],
      },
      evidence: [{
        evidenceId: 'evidence-opening-r1',
        sourceUnitId: 'chapter-1',
        sourceRevision: 1,
        sourceAnchorIds: ['anchor-reader-contract-evidence-r1'],
        demonstrates: '开篇交付可追查的新线索和选择造成的关系代价',
      }],
      revisionRationale: '接受第一章后补充开篇契约证据。',
    } as const
    const entities = [
      {
        kind: 'creative-profile',
        targetId: 'project',
        fields: {
          audience: {
            language: 'zh-CN',
            ageRange: '18-35',
          },
          genreMix: ['东方玄幻', '悬疑'],
          'serialization-profile': serializationProfile,
          'style-profile': styleProfile,
        },
        fieldSources: {
          'serialization-profile': {
            value: serializationProfile,
            sourceRevision: 1,
            sourceDeltaId: 'creative-serialization-profile-r1',
            sourceAnchorIds: ['anchor-serialization-profile-r1'],
            provenance,
          },
          'style-profile': {
            value: styleProfile,
            sourceRevision: 1,
            sourceDeltaId: 'creative-style-profile-r1',
            sourceAnchorIds: ['anchor-style-profile-r1'],
            provenance,
          },
        },
        sourceRevision: 1,
        sourceDeltaId: 'profile-genre-r1',
        sourceAnchorIds: ['anchor-domain-state-r1'],
        provenance,
      },
      {
        kind: 'reader-contract',
        targetId: 'project',
        fields: {
          coreExperience: {
            promises: ['追查旧案', '兑现成长与关系承诺'],
            exclusions: ['无主线漂移'],
          },
          'contract-profile': readerContractProfile,
        },
        fieldSources: {
          'contract-profile': {
            value: readerContractProfile,
            sourceRevision: 1,
            sourceDeltaId: 'reader-contract-profile-r1',
            sourceAnchorIds: ['anchor-reader-contract-profile-r1'],
            provenance,
          },
        },
        sourceRevision: 1,
        sourceDeltaId: 'contract-experience-r1',
        sourceAnchorIds: ['anchor-domain-state-r1'],
        provenance,
      },
      {
        kind: 'character-state',
        targetId: 'shen-yan',
        fields: { goal: '查清旧案' },
        fieldSources: {},
        sourceRevision: 1,
        sourceDeltaId: 'character-goal-r1',
        sourceAnchorIds: ['anchor-domain-state-r1'],
        provenance,
      },
      {
        kind: 'emotion-state',
        targetId: 'shen-yan@event-return',
        fields: { felt: '警惕中夹着愧疚' },
        fieldSources: {},
        sourceRevision: 1,
        sourceDeltaId: 'emotion-felt-r1',
        sourceAnchorIds: ['anchor-domain-state-r1'],
        provenance,
      },
      {
        kind: 'story-event',
        targetId: 'event-return',
        fields: {
          change: '沈砚取得铜钥匙',
          storyTime: '第一卷第一日夜',
        },
        fieldSources: {},
        sourceRevision: 1,
        sourceDeltaId: 'event-time-r1',
        sourceAnchorIds: ['anchor-domain-state-r1'],
        provenance,
      },
    ] as const
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-domain-state',
              workspaceId,
              cwd: 'C:/novels/domain-state',
              acceptedRevision: 1,
              canonLocks: [],
            },
          })),
          generateReviewDraft: vi.fn(),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({
            ok: true,
            value: {
              revision: 1,
              parentRevision: 0,
              packetId: 'packet-domain-state-r1',
              manuscript: { unitId: 'chapter-1', title: '第一章', text: '正文' },
              deltas: [],
              issues: [],
              decisions: [],
              sourceAnchors: [],
              provenance,
              authorization: {
                kind: 'author',
                actorId: 'author-domain-state',
                decisionId: 'decision-domain-state-r1',
              },
            },
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-domain-state',
              workspaceId,
              revision: 1,
              facts: [{
                kind: 'story-event',
                targetId: 'event-return',
                field: 'effect',
                value: {
                  costs: ['暴露行踪'],
                  outcome: '取得铜钥匙',
                },
                sourceRevision: 1,
                sourceDeltaId: 'event-effect-r1',
                sourceAnchorIds: ['anchor-domain-state-r1'],
                provenance,
              }],
              entities,
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const state = container.querySelector('[data-novel-project-domain-state]')
      expect(state).not.toBeNull()
      expect(state?.getAttribute('aria-label')).toBe('已接受的领域状态')
      expect(container.querySelector('[data-canon-fact="story-event:event-return:effect"]')?.textContent)
        .toContain('{"costs":["暴露行踪"],"outcome":"取得铜钥匙"}')
      expect(container.querySelector('[data-canon-entity="creative-profile:project"]')?.textContent)
        .toContain('genreMix: ["东方玄幻","悬疑"]')
      expect(container.querySelector('[data-canon-entity="creative-profile:project"]')?.textContent)
        .toContain('audience: {"ageRange":"18-35","language":"zh-CN"}')
      const serialization = container.querySelector(
        '[data-creative-serialization-profile="project"]',
      )
      expect(serialization).not.toBeNull()
      expect(serialization?.textContent).toContain('连载配置 · 番茄小说 · v1')
      expect(serialization?.textContent).toContain('更新节奏：5 chapters/week')
      expect(serialization?.textContent).toContain('更新日：周一 · 周二 · 周三 · 周四 · 周五')
      expect(serialization?.textContent).toContain('章节字数：2200–2800 characters')
      expect(serialization?.textContent).toContain('计划字数：1200000 characters')
      expect(serialization?.textContent).toContain('修订理由：初始')
      expect(serialization?.textContent).toContain('R1 · creative-serialization-profile-r1')
      expect(serialization?.textContent).toContain('anchor-serialization-profile-r1')
      expect(serialization?.textContent).toContain('domain-state-test')
      expect(container.querySelector('[data-canon-entity="creative-profile:project"]')?.textContent)
        .not.toContain('serialization-profile: {')
      const style = container.querySelector('[data-creative-style-profile="project"]')
      expect(style).not.toBeNull()
      expect(style?.textContent).toContain('旧庭悬疑叙事声线 · v1')
      expect([...style?.querySelectorAll('[data-creative-style-principle]') ?? []]
        .map(item => item.textContent)).toEqual([...styleProfile.voicePrinciples])
      const viewpoint = style?.querySelector('[data-creative-style-viewpoint]')
      expect(viewpoint?.textContent).toContain(`人称：${styleProfile.viewpoint.person}`)
      expect(viewpoint?.textContent).toContain(`距离：${styleProfile.viewpoint.distance}`)
      for (const rule of styleProfile.viewpoint.rules) expect(viewpoint?.textContent).toContain(rule)
      expect([...style?.querySelectorAll('[data-creative-style-rhythm]') ?? []]
        .map(item => item.textContent)).toEqual([
          ...styleProfile.sentenceRhythm.principles,
          ...styleProfile.sentenceRhythm.forbiddenPatterns,
        ])
      expect([...style?.querySelectorAll('[data-creative-style-dialogue]') ?? []]
        .map(item => item.textContent)).toEqual([
          ...styleProfile.dialogue.principles,
          ...styleProfile.dialogue.characterDifferentiation,
        ])
      expect([...style?.querySelectorAll('[data-creative-style-sensory]') ?? []]
        .map(item => item.textContent)).toEqual([...styleProfile.sensoryPriorities])
      expect([...style?.querySelectorAll('[data-creative-style-subtext]') ?? []]
        .map(item => item.textContent)).toEqual([...styleProfile.subtextRules])
      expect([...style?.querySelectorAll('[data-creative-style-exposition]') ?? []]
        .map(item => item.textContent)).toEqual([...styleProfile.expositionRules])
      expect([...style?.querySelectorAll('[data-creative-style-forbidden]') ?? []]
        .map(item => item.textContent)).toEqual([...styleProfile.forbiddenHabits])
      const exemplar = style?.querySelector(
        '[data-creative-style-exemplar="exemplar-old-court-bell-r1"]',
      )
      expect(exemplar?.textContent).toContain('chapter-1 · R1')
      expect(exemplar?.textContent).toContain('anchor-style-exemplar-r1')
      expect(exemplar?.textContent).toContain('批准为克制悬疑开场与听觉细节范例')
      const adaptation = style?.querySelector('[data-creative-style-adaptation="高速追逐场景"]')
      for (const invariant of styleProfile.adaptationBoundaries[0].invariants) {
        expect(adaptation?.textContent).toContain(invariant)
      }
      for (const variation of styleProfile.adaptationBoundaries[0].mayVary) {
        expect(adaptation?.textContent).toContain(variation)
      }
      expect(style?.textContent).toContain('修订理由：初始')
      expect(style?.textContent).toContain('R1 · creative-style-profile-r1')
      expect(style?.textContent).toContain('anchor-style-profile-r1')
      expect(style?.textContent).toContain('domain-state-test')
      expect(container.querySelector('[data-canon-entity="reader-contract:project"]')?.textContent)
        .toContain('coreExperience: {"exclusions":["无主线漂移"],"promises":["追查旧案","兑现成长与关系承诺"]}')
      const readerContract = container.querySelector('[data-reader-contract-profile="project"]')
      expect(readerContract).not.toBeNull()
      expect(readerContract?.textContent).toContain('读者契约 · v1')
      expect(readerContract?.textContent).toContain(`特殊处境：${readerContractProfile.premise.distinctiveSituation}`)
      expect(readerContract?.textContent).toContain(`核心戏剧问题：${readerContractProfile.premise.centralDramaticQuestion}`)
      expect(readerContract?.textContent).toContain(`读者幻想：${readerContractProfile.premise.readerFantasy}`)
      expect(readerContract?.textContent).toContain(`核心体验：${readerContractProfile.coreExperience}`)
      expect(readerContract?.textContent).toContain(`目标读者：${readerContractProfile.targetAudience.description}`)
      const promise = readerContract?.querySelector('[data-reader-contract-promise="promise-old-case"]')
      expect(promise?.textContent).toContain(readerContractProfile.promises[0].statement)
      const evidence = readerContract?.querySelector('[data-reader-contract-evidence="evidence-opening-r1"]')
      expect(evidence?.textContent).toContain('chapter-1 · R1')
      expect(evidence?.textContent).toContain('anchor-reader-contract-evidence-r1')
      expect(evidence?.textContent).toContain(readerContractProfile.evidence[0].demonstrates)
      for (const exclusion of readerContractProfile.exclusions) {
        expect(readerContract?.textContent).toContain(exclusion)
      }
      for (const expectation of readerContractProfile.targetAudience.expectations) {
        expect(readerContract?.textContent).toContain(expectation)
      }
      expect(readerContract?.textContent).toContain(`修订理由：${readerContractProfile.revisionRationale}`)
      expect(readerContract?.textContent).toContain('R1 · reader-contract-profile-r1')
      expect(readerContract?.textContent).toContain('anchor-reader-contract-profile-r1')
      expect(readerContract?.textContent).toContain('domain-state-test')
      expect(container.querySelector('[data-canon-entity="character-state:shen-yan"]')?.textContent)
        .toContain('goal: 查清旧案')
      expect(container.querySelector('[data-canon-entity="emotion-state:shen-yan@event-return"]')?.textContent)
        .toContain('felt: 警惕中夹着愧疚')
      expect(container.querySelector('[data-canon-entity="story-event:event-return"]')?.textContent)
        .toContain('storyTime: 第一卷第一日夜')
      expect(state?.textContent).toContain('R1 · event-time-r1')
      expect(state?.textContent).toContain('anchor-domain-state-r1')
      expect(state?.textContent).toContain('domain-state-test')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders the accepted story hierarchy and all ten narrative clocks in the existing panel', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-narrative'
    const provenance = {
      taskId: 'task-narrative-r1',
      sessionId: SESSION_ID,
      producer: 'narrative-planner',
    } as const
    const unitDelta = {
      id: 'unit-book-main-r1',
      kind: 'narrative-unit',
      operation: 'set',
      targetId: 'book-main',
      field: 'unit',
      value: {
        level: 'book',
        parentId: null,
        order: 0,
        objective: '追查失落王朝的真相',
        entryState: '线索尚未出现',
        exitState: '主角确认王朝仍有遗民',
        status: 'active',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const readerUnitDelta = {
      id: 'unit-volume-old-court-r1',
      kind: 'narrative-unit',
      operation: 'set',
      targetId: 'volume-old-court',
      field: 'unit',
      value: {
        level: 'volume',
        parentId: 'book-main',
        order: 0,
        objective: '控制旧王庭密道真相的读者披露节奏',
        entryState: '密道只是传闻',
        exitState: '读者确认密道存在',
        status: 'active',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const clockDelta = {
      id: 'clock-plot-book-main-r1',
      kind: 'narrative-clock',
      operation: 'set',
      targetId: 'book-main',
      field: 'plot',
      value: {
        movement: 'advance',
        state: '主角获得第一枚王朝印记',
        storyTime: 'day-1',
        version: 1,
        scope: { unitId: 'book-main', level: 'book' },
        lines: [{
          lineId: 'line-lost-dynasty',
          goal: '查清失落王朝的真相',
          stakes: '主角将失去唯一遗民证人',
          status: 'active',
          turns: [{
            turnId: 'turn-archive-locked',
            storyEventId: 'event-archive-locked',
            turnType: 'obstacle',
            description: '王朝档案室被封锁',
            cost: '调查窗口只剩一夜',
            stateAfter: '主角必须寻找另一条入口',
          }, {
            turnId: 'turn-enter-tunnel',
            storyEventId: 'event-enter-tunnel',
            turnType: 'choice',
            description: '主角选择独自进入旧密道',
            cost: '与同伴失去联络',
            stateAfter: '调查转入地下密道',
          }, {
            turnId: 'turn-witness-exposed',
            storyEventId: 'event-witness-exposed',
            turnType: 'consequence',
            description: '行动暴露了证人的藏身处',
            cost: '证人被迫提前转移',
            stateAfter: '唯一证词暂时无法取得',
          }, {
            turnId: 'turn-ledger-reversal',
            storyEventId: 'event-ledger-reversal',
            turnType: 'reversal',
            description: '密道账册显示王朝遗民仍活着',
            cost: '主角原有判断失效',
            stateAfter: '调查目标转为寻找幸存者',
          }],
        }],
        revisionRationale: '接受四类推进转折作为当前主线状态',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const promiseStateDelta = {
      id: 'promise-open-moon-gate-state-r1',
      kind: 'promise',
      operation: 'set',
      targetId: 'promise-open-moon-gate',
      field: 'state',
      value: {
        version: 1,
        promise: '沈砚将凭自己掌握的月息打开月门',
        type: 'progression',
        weight: 'major',
        horizon: {
          openedUnitId: 'volume-old-court',
          expectedPayoffStartUnitId: 'volume-old-court',
          expectedPayoffEndUnitId: 'volume-old-court',
        },
        setup: {
          beatId: 'promise-open-moon-gate-setup',
          unitId: 'volume-old-court',
          sourceRevision: 1,
          sourceAnchorIds: ['anchor-narrative-r1'],
          description: '旧井刻痕表明月息可以被稳定控制。',
        },
        reminders: [],
        complications: [],
        resolution: {
          status: 'open',
          payoffType: null,
          beat: null,
          retirementRationale: null,
        },
        aftermath: null,
        revisionRationale: null,
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const promiseDelta = {
      id: 'clock-promise-volume-old-court-r1',
      kind: 'narrative-clock',
      operation: 'set',
      targetId: 'volume-old-court',
      field: 'promise',
      value: {
        movement: 'complicate-and-partial-payoff',
        state: '月门承诺因代价加重，并完成一次局部兑现',
        storyTime: '第一卷第五日清晨',
        version: 2,
        scope: {
          unitId: 'volume-old-court',
          level: 'volume',
        },
        moves: [{
          moveId: 'promise-move-open-moon-gate',
          kind: 'open',
          promiseId: 'promise-open-moon-gate',
          debtIds: null,
          contribution: '明确沈砚必须凭自己掌握的月息打开月门。',
        }, {
          moveId: 'promise-move-remind-moon-gate',
          kind: 'remind',
          promiseId: 'promise-open-moon-gate',
          debtIds: ['debt-promise-moon-gate'],
          contribution: '守门人在旧井前再次追问沈砚何时兑现。',
        }, {
          moveId: 'promise-move-complicate-moon-gate',
          kind: 'complicate',
          promiseId: 'promise-open-moon-gate',
          debtIds: ['debt-promise-moon-gate'],
          contribution: '开启月门现在还会消耗最后一枚月砂。',
        }, {
          moveId: 'promise-move-partial-payoff-moon-gate',
          kind: 'partial-payoff',
          promiseId: 'promise-open-moon-gate',
          debtIds: ['debt-promise-moon-gate'],
          contribution: '沈砚先独立开启侧门，但主月门仍未完全打开。',
        }],
        revisionRationale: '记录承诺复杂化与局部兑现',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const characterArcDelta = {
      id: 'character-arc-hypothesis-shen-yan-r1',
      kind: 'character-state',
      operation: 'set',
      targetId: 'shen-yan',
      field: 'arc-hypothesis',
      value: {
        version: 2,
        scopeUnitId: 'book-main',
        hypothesis: '沈砚会从独自背负秘密，转向愿意与可信盟友共同承担责任。',
        startingBelief: '只有独自承担才不会再次失去重要的人。',
        targetTransformation: '主动共享风险，并接受关系中的相互依赖。',
        transformationDimensions: ['belief', 'strategy', 'relationship'],
        pressures: ['月门真相只能由两人共同解开', '顾临川可能再次离开'],
        decisionChain: [{
          decisionId: 'decision-share-map',
          storyEventId: 'event-share-moon-gate-map',
          pressure: '独自进入月门会失去唯一的回程坐标。',
          choice: '把月门地图交给顾临川并邀请他同行。',
          rejectedAlternatives: ['隐瞒地图独自进入', '销毁地图终止调查'],
          cost: '承认自己无法独自完成调查，也把弱点交给了顾临川。',
          persistentConsequence: '顾临川获得共同决定路线的权利。',
          transformationEvidence: '沈砚第一次在行动前主动共享关键信息。',
        }],
        currentStage: '开始用共同决策替代单独控制',
        unresolvedQuestion: '当顾临川反对他的方案时，他会不会重新封闭？',
        changeRationale: '共享地图的决定提供了第一项转变证据。',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const characterPressureEventDelta = {
      id: 'character-event-moon-gate-deadline-r1',
      kind: 'story-event',
      operation: 'set',
      targetId: 'event-moon-gate-deadline',
      field: 'event',
      value: {
        storyTime: { startOrder: 10, label: '第一卷第六夜' },
        manuscriptOrder: 1,
        participants: ['shen-yan'],
        location: '月门外',
        effects: ['月门将在天亮前关闭'],
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const characterDecisionEventDelta = {
      id: 'character-event-share-map-r1',
      kind: 'story-event',
      operation: 'set',
      targetId: 'event-share-moon-gate-map',
      field: 'event',
      value: {
        storyTime: { startOrder: 20, label: '第一卷第七夜' },
        manuscriptOrder: 2,
        participants: ['shen-yan', 'gu-linchuan'],
        location: '月门外',
        effects: ['沈砚共享地图', '顾临川获得共同路线决定权'],
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const characterDelta = {
      id: 'clock-character-volume-old-court-r1',
      kind: 'narrative-clock',
      operation: 'set',
      targetId: 'volume-old-court',
      field: 'character',
      value: {
        movement: 'pressure-and-choice',
        state: '沈砚仍在共同承担与独自控制之间做选择',
        storyTime: '第一卷第七夜',
        version: 2,
        scope: {
          unitId: 'volume-old-court',
          level: 'volume',
        },
        moves: [{
          moveId: 'character-move-moon-gate-pressure',
          kind: 'pressure',
          characterId: 'shen-yan',
          storyEventIds: ['event-moon-gate-deadline'],
          contribution: '月门将在天亮前关闭，迫使沈砚决定是否继续独自行动。',
        }, {
          moveId: 'character-move-hold-isolation',
          kind: 'hold',
          characterId: 'shen-yan',
          storyEventIds: [],
          contribution: '第一阶段只维持独自控制的旧策略，不提前宣告人物完成转变。',
        }, {
          moveId: 'character-move-share-map-decision',
          kind: 'decision',
          characterId: 'shen-yan',
          storyEventIds: ['event-share-moon-gate-map'],
          contribution: '沈砚把月门地图交给顾临川，并邀请他共同决定路线。',
        }, {
          moveId: 'character-move-share-map-consequence',
          kind: 'consequence',
          characterId: 'shen-yan',
          storyEventIds: ['event-share-moon-gate-map'],
          contribution: '顾临川因此获得共同决定路线的持续权利。',
        }],
        revisionRationale: '记录共享地图的决定及其持续后果',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const relationshipDelta = {
      id: 'clock-relationship-volume-old-court-r1',
      kind: 'narrative-clock',
      operation: 'set',
      targetId: 'volume-old-court',
      field: 'relationship',
      value: {
        movement: 'earned-mutual-reliance',
        state: '两人仍保留独立目标，但开始用有代价的行动建立相互依赖',
        storyTime: '第一卷第八夜',
        version: 2,
        scope: {
          unitId: 'volume-old-court',
          level: 'volume',
        },
        moves: [{
          moveId: 'relationship-move-limited-alliance',
          lineId: 'alice<->bob',
          relationshipTargetId: 'alice->bob',
          storyEventIds: ['event-limited-alliance'],
          emotionEpisodeIds: [],
          contribution: '爱丽丝提出限时结盟条款，让两人的合作获得第一项可执行边界。',
        }, {
          moveId: 'relationship-move-mutual-sacrifice',
          lineId: 'alice<->bob',
          relationshipTargetId: 'alice->bob',
          storyEventIds: ['event-burn-exit-map'],
          emotionEpisodeIds: ['emotion-episode-mutual-sacrifice'],
          contribution: '爱丽丝牺牲退路、鲍勃放弃任务先机，形成无法单方面撤销的共同后果。',
        }],
        revisionRationale: '记录撤离图牺牲带来的持续关系后果',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const progressionDelta = {
      id: 'clock-progression-volume-old-court-r1',
      kind: 'narrative-clock',
      operation: 'set',
      targetId: 'volume-old-court',
      field: 'progression',
      value: {
        movement: 'earned-advance-and-hold',
        state: '月息主线完成一次有代价的推进，王庭身份支线保持不动',
        storyTime: '第一卷第四夜',
        version: 2,
        scope: {
          unitId: 'volume-old-court',
          level: 'volume',
        },
        tracks: [{
          trackId: 'progression-main-moon-breath',
          role: 'main',
          characterId: 'shen-yan',
          dimension: '月息控制',
          action: 'advance',
          advancementIds: ['advancement-breath-control'],
          promiseIds: ['promise-open-moon-gate'],
          endingHypothesisIds: ['book-main'],
          readiness: { setup: 'ready', payoff: 'delivered' },
          driftWarnings: [],
          contribution: '旧井训练以证据和代价兑现为稳定维持三息的能力。',
        }, {
          trackId: 'progression-supporting-court-status',
          role: 'supporting',
          characterId: 'shen-yan',
          dimension: '王庭身份',
          action: 'hold',
          advancementIds: [],
          promiseIds: [],
          endingHypothesisIds: ['book-main'],
          readiness: { setup: 'missing', payoff: 'not-due' },
          driftWarnings: [{
            warningId: 'warning-status-label-only',
            kind: 'label-only',
            description: '不得只给新称号而没有可观察的权限或责任变化。',
          }],
          contribution: '本卷保持身份线不动，避免无证据的称号升级。',
        }],
        revisionRationale: '记录月息主线兑现并保留身份支线 hold',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const readerKnowledgeDelta = {
      id: 'clock-reader-knowledge-volume-old-court-r1',
      kind: 'narrative-clock',
      operation: 'set',
      targetId: 'volume-old-court',
      field: 'reader-knowledge',
      value: {
        movement: 'controlled-disclosure',
        state: '读者知道密道存在，但仍不知道引路人的真实身份',
        storyTime: '第一卷第二夜',
        version: 1,
        scope: {
          unitId: 'volume-old-court',
          level: 'volume',
        },
        events: [{
          eventId: 'reader-event-moon-mark',
          kind: 'hint',
          unitId: 'scene-moon-mark',
          knowledgeTargetId: 'knowledge-secret-route',
          intendedEffect: 'suspect',
          viewpointId: 'character-shen-yan',
          viewpointAccess: 'limited',
          description: '读者看见密道入口的月形刻痕，但沈砚只把它当作旧工匠标记。',
          sourceAnchorIds: ['anchor-narrative-r1'],
        }, {
          eventId: 'reader-event-false-footsteps',
          kind: 'misdirection',
          unitId: 'scene-false-footsteps',
          knowledgeTargetId: 'knowledge-guide-identity',
          intendedEffect: 'misread',
          viewpointId: null,
          viewpointAccess: 'reported',
          description: '转述的脚步声让读者暂时误判引路人来自王庭禁卫。',
          sourceAnchorIds: ['anchor-narrative-r1'],
        }],
        ambiguityPolicy: {
          mode: 'narrow',
          description: '缩小为王庭旧人与叛逃守卫两种解释',
        },
        revisionRationale: '加入月形刻痕提示与一次身份误导',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const mysteryDelta = {
      id: 'clock-mystery-volume-old-court-r1',
      kind: 'narrative-clock',
      operation: 'set',
      targetId: 'volume-old-court',
      field: 'mystery',
      value: {
        movement: 'controlled-reveal',
        state: '旧案身份谜团经过误导、局部揭示与重构后仍保留最终答案',
        storyTime: '第一卷第三日清晨',
        version: 2,
        scope: {
          unitId: 'volume-old-court',
          level: 'volume',
        },
        moves: [{
          moveId: 'mystery-move-open',
          kind: 'open-question',
          mysteryId: 'mystery-old-case-survivor',
          clueIds: ['clue-half-crest'],
          knowledgeTargetIds: ['reader-main->clue-half-crest'],
          contribution: '提出旧案受害者是否仍活着。',
        }, {
          moveId: 'mystery-move-advance',
          kind: 'advance',
          mysteryId: 'mystery-old-case-survivor',
          clueIds: ['clue-wet-footprint'],
          knowledgeTargetIds: [],
          contribution: '把调查推进到旧庭密道。',
        }, {
          moveId: 'mystery-move-complicate',
          kind: 'complicate',
          mysteryId: 'mystery-old-case-survivor',
          clueIds: ['clue-conflicting-date'],
          knowledgeTargetIds: ['shen-yan->clue-conflicting-date'],
          contribution: '加入与死亡日期冲突的记录。',
        }, {
          moveId: 'mystery-move-misdirect',
          kind: 'misdirect',
          mysteryId: 'mystery-old-case-survivor',
          clueIds: ['clue-false-grave'],
          knowledgeTargetIds: ['reader-main->clue-false-grave'],
          contribution: '让读者暂时相信受害者葬在北岸。',
        }, {
          moveId: 'mystery-move-partial',
          kind: 'partial-reveal',
          mysteryId: 'mystery-old-case-survivor',
          clueIds: ['clue-tunnel-ledger'],
          knowledgeTargetIds: ['reader-main->clue-tunnel-ledger'],
          contribution: '确认受害者曾离开现场。',
        }, {
          moveId: 'mystery-move-reveal',
          kind: 'reveal',
          mysteryId: 'mystery-old-case-survivor',
          clueIds: ['clue-current-signature'],
          knowledgeTargetIds: ['reader-main->clue-current-signature'],
          contribution: '公开受害者仍然存活。',
        }, {
          moveId: 'mystery-move-recontextualize',
          kind: 'recontextualize',
          mysteryId: 'mystery-old-case-survivor',
          clueIds: ['clue-half-crest', 'clue-current-signature'],
          knowledgeTargetIds: ['reader-main->clue-half-crest'],
          contribution: '把半枚家徽重解为主动留下的联络标记。',
        }, {
          moveId: 'mystery-move-hold',
          kind: 'hold',
          mysteryId: 'mystery-guide-identity',
          clueIds: [],
          knowledgeTargetIds: [],
          contribution: '本卷继续保留引路人的真实身份。',
        }],
        revisionRationale: '记录密道账册带来的局部揭示并保留引路人谜团',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const tensionDelta = {
      id: 'clock-tension-payoff-chapter-10-r1',
      kind: 'narrative-clock',
      operation: 'set',
      targetId: 'chapter-10',
      field: 'tension-payoff',
      value: {
        movement: 'rise-and-partial-release',
        state: '旧庭追捕达到高点后只完成局部脱身',
        storyTime: '第一卷第十章',
        version: 1,
        scope: {
          unitId: 'chapter-10',
          level: 'chapter',
        },
        waves: [{
          waveId: 'wave-old-court-escape',
          source: '追兵封锁旧庭，沈砚必须带伤护送证人',
          intensity: {
            opening: 'low',
            peak: 'high',
            closing: 'medium',
          },
          duration: {
            startUnitId: 'scene-courtyard',
            endUnitId: 'scene-rain-alley',
          },
          release: {
            markerUnitId: 'scene-rain-alley',
            status: 'occurred',
            kind: 'partial',
            description: '证人暂时脱离包围，但追兵认出了沈砚',
            cost: '沈砚旧伤复发并暴露行踪',
            aftermath: '顾临川必须决定是否冒险接应',
          },
          recovery: {
            markerUnitId: 'scene-rooftop',
            status: 'planned',
            description: '屋顶短暂停顿用于处理伤势与误会',
            stateAfter: '两人恢复行动能力但信任仍然紧张',
          },
          sceneFunctions: [{
            sceneUnitId: 'scene-courtyard',
            function: 'pressure',
            contribution: '封死正门并迫使主角选择风险更高的雨巷',
          }, {
            sceneUnitId: 'scene-rain-alley',
            function: 'release',
            contribution: '提供有代价的局部脱身而不消除追捕',
          }],
        }, {
          waveId: 'wave-trust-aftershock',
          source: '沈砚是否愿意把证人与自己的退路一起交给顾临川',
          intensity: {
            opening: 'rest',
            peak: 'medium',
            closing: 'high',
          },
          duration: {
            startUnitId: 'scene-courtyard',
            endUnitId: null,
          },
          release: null,
          recovery: null,
          sceneFunctions: [{
            sceneUnitId: 'scene-rain-alley',
            function: 'anticipation',
            contribution: '追捕局部释放后继续抬高关系选择的压力',
          }],
        }],
        revisionRationale: null,
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const debtDelta = {
      id: 'debt-promise-throne-r1',
      kind: 'narrative-debt',
      operation: 'set',
      targetId: 'debt-promise-moon-gate',
      unitId: 'volume-old-court',
      field: 'promise',
      value: {
        summary: '完全打开主月门',
        status: 'open',
        horizon: 'volume-old-court',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const plotDebtDelta = {
      id: 'debt-plot-survivor-r1',
      kind: 'narrative-debt',
      operation: 'set',
      targetId: 'debt-find-survivor',
      unitId: 'book-main',
      field: 'plot',
      value: {
        summary: '找到仍然活着的王朝遗民',
        status: 'open',
      },
      sourceAnchorIds: ['anchor-narrative-r1'],
    } as const
    const projectNarrative = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-narrative',
        workspaceId,
        revision: 1,
        units: [{
          id: 'book-main',
          ...unitDelta.value,
          sourceRevision: 1,
          sourceDeltaId: unitDelta.id,
          sourceAnchorIds: unitDelta.sourceAnchorIds,
          provenance,
          delta: unitDelta,
        }, {
          id: 'volume-old-court',
          ...readerUnitDelta.value,
          sourceRevision: 1,
          sourceDeltaId: readerUnitDelta.id,
          sourceAnchorIds: readerUnitDelta.sourceAnchorIds,
          provenance,
          delta: readerUnitDelta,
        }],
        clocks: NARRATIVE_CLOCKS.map(clock => ({
          clock,
          entries: clock === 'plot'
            ? [{
                unitId: 'book-main',
                clock,
                ...clockDelta.value,
                sourceRevision: 1,
                sourceDeltaId: clockDelta.id,
                sourceAnchorIds: clockDelta.sourceAnchorIds,
                provenance,
                delta: clockDelta,
              }]
            : clock === 'promise'
              ? [{
                  unitId: 'volume-old-court',
                  clock,
                  ...promiseDelta.value,
                  sourceRevision: 1,
                  sourceDeltaId: promiseDelta.id,
                  sourceAnchorIds: promiseDelta.sourceAnchorIds,
                  provenance,
                  delta: promiseDelta,
                }]
            : clock === 'progression'
              ? [{
                  unitId: 'volume-old-court',
                  clock,
                  ...progressionDelta.value,
                  sourceRevision: 1,
                  sourceDeltaId: progressionDelta.id,
                  sourceAnchorIds: progressionDelta.sourceAnchorIds,
                  provenance,
                  delta: progressionDelta,
                }]
            : clock === 'character'
              ? [{
                  unitId: 'volume-old-court',
                  clock,
                  ...characterDelta.value,
                  sourceRevision: 1,
                  sourceDeltaId: characterDelta.id,
                  sourceAnchorIds: characterDelta.sourceAnchorIds,
                  provenance,
                  delta: characterDelta,
                }]
            : clock === 'relationship'
              ? [{
                  unitId: 'volume-old-court',
                  clock,
                  ...relationshipDelta.value,
                  sourceRevision: 1,
                  sourceDeltaId: relationshipDelta.id,
                  sourceAnchorIds: relationshipDelta.sourceAnchorIds,
                  provenance,
                  delta: relationshipDelta,
                }]
            : clock === 'reader-knowledge'
              ? [{
                  unitId: 'volume-old-court',
                  clock,
                  ...readerKnowledgeDelta.value,
                  sourceRevision: 1,
                  sourceDeltaId: readerKnowledgeDelta.id,
                  sourceAnchorIds: readerKnowledgeDelta.sourceAnchorIds,
                  provenance,
                  delta: readerKnowledgeDelta,
                }]
              : clock === 'mystery'
                ? [{
                    unitId: 'volume-old-court',
                    clock,
                    ...mysteryDelta.value,
                    sourceRevision: 1,
                    sourceDeltaId: mysteryDelta.id,
                    sourceAnchorIds: mysteryDelta.sourceAnchorIds,
                    provenance,
                    delta: mysteryDelta,
                  }]
              : clock === 'tension-payoff'
              ? [{
                  unitId: 'chapter-10',
                  clock,
                  ...tensionDelta.value,
                  sourceRevision: 1,
                  sourceDeltaId: tensionDelta.id,
                  sourceAnchorIds: tensionDelta.sourceAnchorIds,
                  provenance,
                  delta: tensionDelta,
                }]
              : [],
          debts: clock === 'plot'
            ? [{
                id: 'debt-find-survivor',
                unitId: 'book-main',
                clock,
                ...plotDebtDelta.value,
                sourceRevision: 1,
                sourceDeltaId: plotDebtDelta.id,
                sourceAnchorIds: plotDebtDelta.sourceAnchorIds,
                provenance,
                delta: plotDebtDelta,
              }]
            : clock === 'promise'
            ? [{
                id: 'debt-promise-moon-gate',
                unitId: 'volume-old-court',
                clock,
                ...debtDelta.value,
                sourceRevision: 1,
                sourceDeltaId: debtDelta.id,
                sourceAnchorIds: debtDelta.sourceAnchorIds,
                provenance,
                delta: debtDelta,
              }]
            : [],
        })),
      },
    } as const))
    const acceptedRevision = {
      revision: 1,
      parentRevision: 0,
      packetId: 'packet-narrative-r1',
      manuscript: { unitId: 'book-main', title: '第一卷', text: '正文' },
       deltas: [
         unitDelta,
         readerUnitDelta,
         clockDelta,
         promiseStateDelta,
         promiseDelta,
         characterArcDelta,
         characterPressureEventDelta,
         characterDecisionEventDelta,
         characterDelta,
         relationshipDelta,
         readerKnowledgeDelta,
         tensionDelta,
         debtDelta,
         plotDebtDelta,
       ],
      issues: [],
       decisions: [
         unitDelta,
         readerUnitDelta,
         clockDelta,
         promiseStateDelta,
         promiseDelta,
         characterArcDelta,
         characterPressureEventDelta,
         characterDecisionEventDelta,
         characterDelta,
         relationshipDelta,
         readerKnowledgeDelta,
         tensionDelta,
         debtDelta,
         plotDebtDelta,
       ].map(delta => ({
        itemType: 'delta' as const,
        itemId: delta.id,
        outcome: 'accept' as const,
      })),
      sourceAnchors: [{
        id: 'anchor-narrative-r1',
        sourceId: 'outline-r1',
        start: 0,
        end: 12,
        contentHash: 'a'.repeat(64),
      }],
      provenance,
      authorization: {
        kind: 'author' as const,
        actorId: 'author-1',
        decisionId: 'decision-narrative-r1',
      },
    }
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-narrative',
              workspaceId,
              cwd: 'C:/novels/narrative',
              acceptedRevision: 1,
            },
          })),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: acceptedRevision })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-narrative',
              workspaceId,
              revision: 1,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(projectNarrative).toHaveBeenCalledWith(workspaceId, 1)
      expect(container.querySelector('[data-novel-project-narrative]')).not.toBeNull()
      const hierarchy = container.querySelector('[aria-label="故事层级"]')
      expect(hierarchy?.tagName).toBe('OL')
      expect(hierarchy?.getAttribute('role')).toBeNull()
      expect(container.querySelector('[data-narrative-unit="book-main"]')?.textContent)
        .toContain('book · book-main')
      expect(container.querySelector('[data-narrative-unit="book-main"]')?.getAttribute('role'))
        .toBeNull()
      expect(container.querySelector('[data-narrative-unit="book-main"]')?.getAttribute('aria-level'))
        .toBeNull()
      expect(container.querySelector('[data-narrative-unit="book-main"]')?.textContent)
        .toContain('追查失落王朝的真相')
      expect(container.querySelectorAll('[data-narrative-clock]')).toHaveLength(10)
      expect(container.querySelector('[data-narrative-clock="plot"]')?.textContent)
        .toContain('advance · 主角获得第一枚王朝印记')
      const plotScope = container.querySelector('[data-plot-progression-scope="book-main"]')
      expect(plotScope).not.toBeNull()
      expect(plotScope?.textContent).toContain('book · book-main · v1')
      expect(plotScope?.textContent).toContain('故事时间: day-1')
      expect(plotScope?.textContent).toContain('接受四类推进转折作为当前主线状态')
      const plotLine = plotScope?.querySelector('[data-plot-line="line-lost-dynasty"]')
      expect(plotLine?.textContent).toContain('查清失落王朝的真相')
      expect(plotLine?.textContent).toContain('主角将失去唯一遗民证人')
      expect(plotLine?.textContent).toContain('active')
      const obstacle = plotLine?.querySelector('[data-plot-turn="turn-archive-locked"]')
      expect(obstacle?.textContent).toContain('obstacle · event-archive-locked')
      expect(obstacle?.textContent).toContain('王朝档案室被封锁')
      expect(obstacle?.textContent).toContain('调查窗口只剩一夜')
      expect(obstacle?.textContent).toContain('主角必须寻找另一条入口')
      expect(plotLine?.querySelector('[data-plot-turn="turn-enter-tunnel"]')?.textContent)
        .toContain('choice · event-enter-tunnel')
      expect(plotLine?.querySelector('[data-plot-turn="turn-witness-exposed"]')?.textContent)
        .toContain('consequence · event-witness-exposed')
      expect(plotLine?.querySelector('[data-plot-turn="turn-ledger-reversal"]')?.textContent)
        .toContain('reversal · event-ledger-reversal')
      expect(container.querySelector('[data-narrative-clock="plot"]')?.textContent)
        .toContain('debt-find-survivor · 找到仍然活着的王朝遗民 · open')
      expect(container.querySelector('[data-narrative-clock="plot"]')?.textContent)
        .toContain('R1 · clock-plot-book-main-r1 · 出处锚点：anchor-narrative-r1 · 生成者：narrative-planner')
      const promiseScope = container.querySelector(
        '[data-promise-clock-scope="volume-old-court"]',
      )
      expect(promiseScope).not.toBeNull()
      expect(promiseScope?.textContent).toContain('volume · volume-old-court · v2')
      expect(promiseScope?.textContent).toContain('推进：complicate-and-partial-payoff')
      expect(promiseScope?.textContent)
        .toContain('状态：月门承诺因代价加重，并完成一次局部兑现')
      expect(promiseScope?.textContent).toContain('故事时间: 第一卷第五日清晨')
      expect(promiseScope?.querySelector(
        '[data-promise-move="promise-move-open-moon-gate"]',
      )?.textContent).toContain('open · promise-open-moon-gate')
      expect(promiseScope?.querySelector(
        '[data-promise-move="promise-move-open-moon-gate"]',
      )?.textContent).toContain('债务：无')
      expect(promiseScope?.querySelector(
        '[data-promise-move="promise-move-remind-moon-gate"]',
      )?.textContent).toContain('remind · promise-open-moon-gate')
      expect(promiseScope?.querySelector(
        '[data-promise-move="promise-move-complicate-moon-gate"]',
      )?.textContent).toContain('债务：debt-promise-moon-gate')
      expect(promiseScope?.querySelector(
        '[data-promise-move="promise-move-partial-payoff-moon-gate"]',
      )?.textContent).toContain('partial-payoff · promise-open-moon-gate')
      expect(promiseScope?.textContent)
        .toContain('贡献：沈砚先独立开启侧门，但主月门仍未完全打开。')
      expect(promiseScope?.textContent)
        .toContain('修订理由：记录承诺复杂化与局部兑现')
      expect(container.querySelector('[data-narrative-clock="promise"]')?.textContent)
        .toContain('debt-promise-moon-gate · 完全打开主月门 · open')
      const progressionScope = container.querySelector(
        '[data-progression-clock-scope="volume-old-court"]',
      )
      expect(progressionScope).not.toBeNull()
      expect(progressionScope?.textContent).toContain('volume · volume-old-court · v2')
      expect(progressionScope?.textContent).toContain('推进：earned-advance-and-hold')
      expect(progressionScope?.textContent)
        .toContain('状态：月息主线完成一次有代价的推进，王庭身份支线保持不动')
      expect(progressionScope?.textContent).toContain('故事时间: 第一卷第四夜')
      const mainProgression = progressionScope?.querySelector(
        '[data-progression-track="progression-main-moon-breath"]',
      )
      expect(mainProgression?.textContent).toContain('main · advance · shen-yan · 月息控制')
      expect(mainProgression?.textContent).toContain('推进：advancement-breath-control')
      expect(mainProgression?.textContent).toContain('承诺：promise-open-moon-gate')
      expect(mainProgression?.textContent).toContain('结局假设：book-main')
      expect(mainProgression?.textContent).toContain('就绪度：setup ready · payoff delivered')
      expect(mainProgression?.textContent)
        .toContain('贡献：旧井训练以证据和代价兑现为稳定维持三息的能力。')
      const supportingProgression = progressionScope?.querySelector(
        '[data-progression-track="progression-supporting-court-status"]',
      )
      expect(supportingProgression?.textContent).toContain('supporting · hold · shen-yan · 王庭身份')
      expect(supportingProgression?.textContent).toContain('推进：无')
      expect(supportingProgression?.textContent).toContain('承诺：无')
      expect(supportingProgression?.textContent).toContain('就绪度：setup missing · payoff not-due')
      expect(supportingProgression?.querySelector(
        '[data-progression-drift-warning="warning-status-label-only"]',
      )?.textContent).toContain('label-only · 不得只给新称号而没有可观察的权限或责任变化。')
      expect(progressionScope?.textContent)
        .toContain('修订理由：记录月息主线兑现并保留身份支线 hold')
      expect(container.querySelector('[data-narrative-clock="progression"]')?.textContent)
        .toContain('R1 · clock-progression-volume-old-court-r1 · 出处锚点：anchor-narrative-r1 · 生成者：narrative-planner')
      const characterScope = container.querySelector(
        '[data-character-clock-scope="volume-old-court"]',
      )
      expect(characterScope).not.toBeNull()
      expect(characterScope?.textContent).toContain('volume · volume-old-court · v2')
      expect(characterScope?.textContent).toContain('推进：pressure-and-choice')
      expect(characterScope?.textContent)
        .toContain('状态：沈砚仍在共同承担与独自控制之间做选择')
      expect(characterScope?.textContent).toContain('故事时间: 第一卷第七夜')
      expect(characterScope?.querySelector(
        '[data-character-move="character-move-moon-gate-pressure"]',
      )?.textContent).toContain('pressure · shen-yan')
      expect(characterScope?.querySelector(
        '[data-character-move="character-move-moon-gate-pressure"]',
      )?.textContent).toContain('故事事件：event-moon-gate-deadline')
      expect(characterScope?.querySelector(
        '[data-character-move="character-move-hold-isolation"]',
      )?.textContent).toContain('故事事件：无')
      expect(characterScope?.querySelector(
        '[data-character-move="character-move-share-map-decision"]',
      )?.textContent).toContain('decision · shen-yan')
      expect(characterScope?.querySelector(
        '[data-character-move="character-move-share-map-consequence"]',
      )?.textContent).toContain('consequence · shen-yan')
      expect(characterScope?.textContent)
        .toContain('贡献：顾临川因此获得共同决定路线的持续权利。')
      expect(characterScope?.textContent)
        .toContain('修订理由：记录共享地图的决定及其持续后果')
      expect(container.querySelector('[data-narrative-clock="character"]')?.textContent)
        .toContain('R1 · clock-character-volume-old-court-r1 · 出处锚点：anchor-narrative-r1 · 生成者：narrative-planner')
      const relationshipScope = container.querySelector(
        '[data-relationship-clock-scope="volume-old-court"]',
      )
      expect(relationshipScope).not.toBeNull()
      expect(relationshipScope?.textContent).toContain('volume · volume-old-court · v2')
      expect(relationshipScope?.textContent).toContain('推进：earned-mutual-reliance')
      expect(relationshipScope?.textContent)
        .toContain('状态：两人仍保留独立目标，但开始用有代价的行动建立相互依赖')
      expect(relationshipScope?.textContent).toContain('故事时间: 第一卷第八夜')
      expect(relationshipScope?.querySelector(
        '[data-relationship-move="relationship-move-limited-alliance"]',
      )?.textContent).toContain('alice<->bob · alice->bob')
      expect(relationshipScope?.querySelector(
        '[data-relationship-move="relationship-move-limited-alliance"]',
      )?.textContent).toContain('故事事件：event-limited-alliance')
      expect(relationshipScope?.querySelector(
        '[data-relationship-move="relationship-move-limited-alliance"]',
      )?.textContent).toContain('情绪片段：无')
      expect(relationshipScope?.querySelector(
        '[data-relationship-move="relationship-move-mutual-sacrifice"]',
      )?.textContent).toContain('情绪片段：emotion-episode-mutual-sacrifice')
      expect(relationshipScope?.textContent)
        .toContain('贡献：爱丽丝牺牲退路、鲍勃放弃任务先机，形成无法单方面撤销的共同后果。')
      expect(relationshipScope?.textContent)
        .toContain('修订理由：记录撤离图牺牲带来的持续关系后果')
      expect(container.querySelector('[data-narrative-clock="relationship"]')?.textContent)
        .toContain('R1 · clock-relationship-volume-old-court-r1 · 出处锚点：anchor-narrative-r1 · 生成者：narrative-planner')
      const readerKnowledgeScope = container.querySelector(
        '[data-reader-knowledge-scope="volume-old-court"]',
      )
      expect(readerKnowledgeScope).not.toBeNull()
      expect(readerKnowledgeScope?.textContent).toContain('volume · volume-old-court · v1')
      expect(readerKnowledgeScope?.textContent).toContain('推进：controlled-disclosure')
      expect(readerKnowledgeScope?.textContent)
        .toContain('状态：读者知道密道存在，但仍不知道引路人的真实身份')
      expect(readerKnowledgeScope?.textContent).toContain('故事时间: 第一卷第二夜')
      const moonMark = readerKnowledgeScope?.querySelector(
        '[data-reader-knowledge-event="reader-event-moon-mark"]',
      )
      expect(moonMark?.textContent)
        .toContain('hint · suspect · knowledge-secret-route · scene-moon-mark')
      expect(moonMark?.textContent).toContain('视角：character-shen-yan · 通行权限：limited')
      expect(moonMark?.textContent)
        .toContain('读者看见密道入口的月形刻痕，但沈砚只把它当作旧工匠标记。')
      expect(moonMark?.textContent).toContain('来源：anchor-narrative-r1')
      const falseFootsteps = readerKnowledgeScope?.querySelector(
        '[data-reader-knowledge-event="reader-event-false-footsteps"]',
      )
      expect(falseFootsteps?.textContent)
        .toContain('misdirection · misread · knowledge-guide-identity · scene-false-footsteps')
      expect(falseFootsteps?.textContent).toContain('视角：reader · 通行权限：reported')
      expect(readerKnowledgeScope?.querySelector('[data-reader-knowledge-ambiguity]')?.textContent)
        .toContain('narrow · 缩小为王庭旧人与叛逃守卫两种解释')
      expect(readerKnowledgeScope?.textContent)
        .toContain('修订理由：加入月形刻痕提示与一次身份误导')
      expect(container.querySelector('[data-narrative-clock="reader-knowledge"]')?.textContent)
        .toContain('R1 · clock-reader-knowledge-volume-old-court-r1 · 出处锚点：anchor-narrative-r1 · 生成者：narrative-planner')
      const mysteryScope = container.querySelector('[data-mystery-clock-scope="volume-old-court"]')
      expect(mysteryScope).not.toBeNull()
      expect(mysteryScope?.textContent).toContain('volume · volume-old-court · v2')
      expect(mysteryScope?.textContent).toContain('推进：controlled-reveal')
      expect(mysteryScope?.textContent)
        .toContain('状态：旧案身份谜团经过误导、局部揭示与重构后仍保留最终答案')
      expect(mysteryScope?.textContent).toContain('故事时间: 第一卷第三日清晨')
      const mysteryMoves = [...(mysteryScope?.querySelectorAll('[data-mystery-move]') ?? [])]
      expect(mysteryMoves.map(move => move.getAttribute('data-mystery-move'))).toEqual([
        'mystery-move-open',
        'mystery-move-advance',
        'mystery-move-complicate',
        'mystery-move-misdirect',
        'mystery-move-partial',
        'mystery-move-reveal',
        'mystery-move-recontextualize',
        'mystery-move-hold',
      ])
      expect(mysteryScope?.querySelector('[data-mystery-move="mystery-move-open"]')?.textContent)
        .toContain('open-question · mystery-old-case-survivor')
      expect(mysteryScope?.querySelector('[data-mystery-move="mystery-move-open"]')?.textContent)
        .toContain('线索：clue-half-crest')
      expect(mysteryScope?.querySelector('[data-mystery-move="mystery-move-open"]')?.textContent)
        .toContain('认知目标：reader-main->clue-half-crest')
      expect(mysteryScope?.querySelector('[data-mystery-move="mystery-move-hold"]')?.textContent)
        .toContain('hold · mystery-guide-identity')
      expect(mysteryScope?.querySelector('[data-mystery-move="mystery-move-hold"]')?.textContent)
        .toContain('线索：无')
      expect(mysteryScope?.querySelector('[data-mystery-move="mystery-move-hold"]')?.textContent)
        .toContain('认知目标：无')
      for (const kind of [
        'advance',
        'complicate',
        'misdirect',
        'partial-reveal',
        'reveal',
        'recontextualize',
      ]) expect(mysteryScope?.textContent).toContain(kind)
      expect(mysteryScope?.textContent)
        .toContain('贡献：把半枚家徽重解为主动留下的联络标记。')
      expect(mysteryScope?.textContent)
        .toContain('修订理由：记录密道账册带来的局部揭示并保留引路人谜团')
      expect(container.querySelector('[data-narrative-clock="mystery"]')?.textContent)
        .toContain('R1 · clock-mystery-volume-old-court-r1 · 出处锚点：anchor-narrative-r1 · 生成者：narrative-planner')
      const tensionScope = container.querySelector('[data-tension-payoff-scope="chapter-10"]')
      expect(tensionScope?.textContent).toContain('chapter · chapter-10 · v1')
      expect(tensionScope?.textContent).toContain('rise-and-partial-release')
      const tensionWave = container.querySelector('[data-tension-wave="wave-old-court-escape"]')
      expect(tensionWave?.textContent).toContain('追兵封锁旧庭，沈砚必须带伤护送证人')
      expect(tensionWave?.querySelector('[data-tension-wave-intensity="wave-old-court-escape"]')?.textContent)
        .toContain('low → high → medium')
      expect(tensionWave?.querySelector('[data-tension-wave-duration="wave-old-court-escape"]')?.textContent)
        .toContain('scene-courtyard → scene-rain-alley')
      const release = tensionWave?.querySelector('[data-tension-wave-release="wave-old-court-escape"]')
      expect(release?.textContent).toContain('occurred · partial')
      expect(release?.textContent).toContain('沈砚旧伤复发并暴露行踪')
      expect(release?.textContent).toContain('顾临川必须决定是否冒险接应')
      const recovery = tensionWave?.querySelector('[data-tension-wave-recovery="wave-old-court-escape"]')
      expect(recovery?.textContent).toContain('planned')
      expect(recovery?.textContent).toContain('两人恢复行动能力但信任仍然紧张')
      expect(tensionWave?.querySelector('[data-tension-wave-scene-function="scene-courtyard"]')?.textContent)
        .toContain('pressure · 封死正门并迫使主角选择风险更高的雨巷')
      const accumulatingWave = container.querySelector('[data-tension-wave="wave-trust-aftershock"]')
      expect(accumulatingWave?.querySelector('[data-tension-wave-duration="wave-trust-aftershock"]')?.textContent)
        .toContain('scene-courtyard → 持续中')
      expect(accumulatingWave?.querySelector('[data-tension-wave-release="wave-trust-aftershock"]')?.textContent)
        .toContain('无释放标记')
      expect(accumulatingWave?.querySelector('[data-tension-wave-recovery="wave-trust-aftershock"]')?.textContent)
        .toContain('无恢复标记')
      expect(container.querySelector('[data-narrative-clock="promise"]')?.textContent)
        .toContain('完全打开主月门 · open')
      expect(container.querySelector('[data-narrative-clock="ending"]')?.textContent)
        .toContain('暂无已接受的推进或债务')
      expect(container.querySelector('[data-novel-project-narrative]')?.textContent)
        .toContain('R1 · unit-book-main-r1')
      expect(container.querySelector('[data-novel-project-narrative]')?.textContent)
        .toContain('anchor-narrative-r1')
      expect(container.querySelector('[data-novel-project-narrative]')?.textContent)
        .toContain('narrative-planner')
      const revisionAudit = container.querySelector(
        '[data-accepted-revision-audit="1"]',
      )
      expect(revisionAudit).not.toBeNull()
      expect(revisionAudit?.textContent).toContain('packet-narrative-r1')
      expect(revisionAudit?.textContent).toContain('unit-book-main-r1')
      expect(revisionAudit?.textContent).toContain('narrative-planner')
      expect(revisionAudit?.textContent).toContain('author-1')
      expect(revisionAudit?.textContent).toContain('decision-narrative-r1')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it("renders one strict ending clock in both 叙事时钟 and the selected Book's closure ledger", async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-ending-closure'
    const provenance = {
      taskId: 'task-ending-closure-r2',
      sessionId: SESSION_ID,
      producer: 'ending-planner',
    } as const
    const narrativeUnit = (
      id: string,
      level: 'series' | 'book' | 'chapter',
      parentId: string | null,
      order: number,
    ) => {
      const delta = {
        id: `unit-${id}-r2`,
        kind: 'narrative-unit' as const,
        operation: 'set' as const,
        targetId: id,
        field: 'unit' as const,
        value: {
          level,
          parentId,
          order,
          objective: `${id} objective`,
          entryState: `${id} entry`,
          exitState: `${id} exit`,
          status: 'accepted',
        },
        sourceAnchorIds: ['anchor-ending-closure-r2'],
      }
      return {
        id,
        ...delta.value,
        sourceRevision: 2,
        sourceDeltaId: delta.id,
        sourceAnchorIds: delta.sourceAnchorIds,
        provenance,
        delta,
      }
    }
    const series = narrativeUnit('series-main', 'series', null, 0)
    const book = narrativeUnit('book-main', 'book', 'series-main', 0)
    const chapter = narrativeUnit('chapter-finale', 'chapter', 'book-main', 0)
    const endingDelta = {
      id: 'ending-book-main-r2',
      kind: 'narrative-clock' as const,
      operation: 'set' as const,
      targetId: 'book-main',
      field: 'ending' as const,
      value: {
        movement: 'resolve-and-aftermath',
        state: '关系债已兑现，返乡承诺进入余波，制度重建继续保留',
        storyTime: '终章与尾声',
        version: 2,
        scope: {
          unitId: 'book-main',
          level: 'book' as const,
          closureScopeId: 'book-main',
        },
        moves: [{
          moveId: 'ending-move-resolve-trust',
          kind: 'resolve' as const,
          debtReferences: [{ clock: 'relationship' as const, id: 'debt-relationship-trust' }],
          contribution: '沈砚与守门人共同交出控制权，兑现彼此托付。',
        }, {
          moveId: 'ending-move-aftermath-return',
          kind: 'aftermath' as const,
          debtReferences: [{ clock: 'promise' as const, id: 'debt-promise-old-city' }],
          contribution: '第一份公开通行证让返乡承诺成为可见余波。',
        }, {
          moveId: 'ending-move-hold-world-rebuild',
          kind: 'hold' as const,
          debtReferences: [{ clock: 'world' as const, id: 'debt-rebuild-moon-gate' }],
          contribution: '把月门制度重建明确留给尾声继续承担。',
        }],
        revisionRationale: '终章兑现关系与返乡承诺，并把制度重建留给尾声。',
      },
      sourceAnchorIds: ['anchor-ending-closure-r2'],
    }
    const endingEntry = {
      unitId: 'book-main',
      clock: 'ending' as const,
      ...endingDelta.value,
      sourceRevision: 2,
      sourceDeltaId: endingDelta.id,
      sourceAnchorIds: endingDelta.sourceAnchorIds,
      provenance,
      delta: endingDelta,
    }
    const trustDebtDelta = {
      id: 'closure-debt-trust-r2',
      kind: 'narrative-debt' as const,
      operation: 'set' as const,
      targetId: 'debt-relationship-trust',
      unitId: 'chapter-finale',
      field: 'relationship' as const,
      value: {
        summary: '确认两位主角能否彼此托付',
        status: 'resolved',
        horizon: 'chapter-finale',
      },
      sourceAnchorIds: ['anchor-ending-closure-r2'],
    }
    const promiseDebtDelta = {
      id: 'closure-debt-promise-r2',
      kind: 'narrative-debt' as const,
      operation: 'set' as const,
      targetId: 'debt-promise-old-city',
      unitId: 'book-main',
      field: 'promise' as const,
      value: {
        summary: '兑现旧城终会重获自由的承诺',
        status: 'open',
        horizon: 'book-main',
        dependsOn: [{ clock: 'relationship' as const, id: 'debt-relationship-trust' }],
      },
      sourceAnchorIds: ['anchor-ending-closure-r2'],
    }
    const worldDebtDelta = {
      id: 'closure-debt-world-r2',
      kind: 'narrative-debt' as const,
      operation: 'set' as const,
      targetId: 'debt-rebuild-moon-gate',
      unitId: 'book-main',
      field: 'world' as const,
      value: {
        summary: '重建公开的月门通行制度',
        status: 'open',
        horizon: 'epilogue',
        dependsOn: [{ clock: 'promise' as const, id: 'debt-promise-old-city' }],
      },
      sourceAnchorIds: ['anchor-ending-closure-r2'],
    }
    const debts = [trustDebtDelta, promiseDebtDelta, worldDebtDelta].map(delta => ({
      id: delta.targetId,
      unitId: delta.unitId,
      clock: delta.field,
      ...delta.value,
      sourceRevision: 2,
      sourceDeltaId: delta.id,
      sourceAnchorIds: delta.sourceAnchorIds,
      provenance,
      delta,
    }))
    const endingHypothesis = {
      value: {
        scopeUnitId: 'book-main',
        version: 2,
        endingTarget: '旧城与守门人共同管理公开的月门通行制度',
        decisiveConflict: '沈砚必须在个人掌控月门与建立共同制度之间选择',
        protagonistChoice: '把月门交给新议会与守门人共同管理',
        thematicReturn: '真正的归属来自愿意与他人共同承担权力',
        desiredEmotionalAfterimage: '第一缕晨光照在公开通行证上',
        resolutionMode: 'closure' as const,
        finalStates: [{
          kind: 'character' as const,
          subjectId: 'shen-yan',
          state: '留在旧城但放弃独占月门',
        }, {
          kind: 'relationship' as const,
          subjectId: 'shen-yan:gatekeeper',
          state: '从互不信任转为共同守门',
        }, {
          kind: 'world' as const,
          subjectId: 'old-city',
          state: '月门通行规则公开且由新议会监督',
        }],
        aftermath: '首批公开通行证开始发放，旧议会残部退出城门',
        deliberatelyUnresolvedDebts: [{
          clock: 'world' as const,
          id: 'debt-rebuild-moon-gate',
        }],
        epiloguePurpose: '展示普通城民领取第一份公开通行证',
      },
      sourceRevision: 2,
      sourceDeltaId: 'ending-hypothesis-book-main-r2',
      sourceAnchorIds: ['anchor-ending-hypothesis-r2'],
      sourceRanges: [{
        anchorId: 'anchor-ending-hypothesis-r2',
        sourceId: 'chapter-ending-hypothesis-r2',
        start: 6,
        end: 46,
        contentHash: 'e'.repeat(64),
      }],
      provenance,
    } as const
    const closure = {
      scope: book,
      unitIds: ['book-main', 'chapter-finale'],
      endingHypothesis,
      endingEntries: [endingEntry],
      debts,
      dependencyOrder: [
        { clock: 'relationship' as const, id: 'debt-relationship-trust' },
        { clock: 'promise' as const, id: 'debt-promise-old-city' },
        { clock: 'world' as const, id: 'debt-rebuild-moon-gate' },
      ],
      remainingChapterBudget: 12,
    } as const
    const revisions = [1, 2].map(revision => ({
      revision,
      parentRevision: revision - 1,
      packetId: `packet-ending-closure-r${String(revision)}`,
      manuscript: {
        unitId: 'chapter-finale',
        title: '终章',
        text: `终章 R${String(revision)}`,
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance,
      authorization: {
        kind: 'author' as const,
        actorId: 'author-1',
        decisionId: `decision-ending-closure-r${String(revision)}`,
      },
    }))
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-ending-closure',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        closure,
      },
    } as const))
    const reviewResultPacket = vi.fn()
    const rollbackRevision = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-ending-closure',
              workspaceId,
              cwd: 'C:/novels/ending-closure',
              acceptedRevision: 2,
            },
          })),
          retrieve,
          reviewResultPacket,
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revisions[revision - 1],
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-ending-closure',
              workspaceId,
              revision: 2,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-ending-closure',
              workspaceId,
              revision: 2,
              units: [series, book, chapter],
              clocks: NARRATIVE_CLOCKS.map(clock => ({
                clock,
                entries: clock === 'ending' ? [endingEntry] : [],
                debts: debts.filter(debt => debt.clock === clock),
              })),
            },
          })),
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const scope = container.querySelector<HTMLSelectElement>(
        '[aria-label="结局范围"]',
      )
      const budget = container.querySelector<HTMLInputElement>(
        '[aria-label="剩余章节预算"]',
      )
      const build = container.querySelector<HTMLButtonElement>(
        '[data-build-ending-closure]',
      )
      expect(scope?.textContent).toContain('series-main')
      expect(scope?.textContent).toContain('book-main')
      await act(async () => {
        if (scope !== null) {
          scope.value = 'book-main'
          scope.dispatchEvent(new Event('change', { bubbles: true }))
        }
        if (budget !== null) {
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )?.set
          setter?.call(budget, '12')
          budget.dispatchEvent(new Event('input', { bubbles: true }))
        }
      })
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        closureScopeId: 'book-main',
        remainingChapterBudget: 12,
      })
      const ledger = container.querySelector('[data-ending-closure-ledger]')
      expect(ledger?.textContent).toContain('R2')
      expect(ledger?.textContent).toContain('book · book-main')
      expect(ledger?.textContent).toContain('remainingChapterBudget: 12')
      expect(ledger?.textContent).toContain('resolve-and-aftermath · 关系债已兑现，返乡承诺进入余波，制度重建继续保留')
      expect(ledger?.textContent).toContain('debt-relationship-trust')
      expect(ledger?.textContent).toContain('debt-promise-old-city')
      expect(ledger?.textContent).toContain('debt-rebuild-moon-gate')
      const endingViews = container.querySelectorAll('[data-ending-clock-scope="book-main"]')
      expect(endingViews).toHaveLength(2)
      for (const endingView of endingViews) {
        expect(endingView.textContent).toContain('book · book-main · v2 · closure book-main')
        expect(endingView.textContent).toContain('resolve-and-aftermath')
        expect(endingView.textContent).toContain('resolve · relationship · debt-relationship-trust')
        expect(endingView.textContent).toContain('aftermath · promise · debt-promise-old-city')
        expect(endingView.textContent).toContain('hold · world · debt-rebuild-moon-gate')
        expect(endingView.textContent).toContain('修订理由：终章兑现关系与返乡承诺，并把制度重建留给尾声。')
      }
      expect(container.querySelectorAll('[data-ending-move="ending-move-resolve-trust"]'))
        .toHaveLength(2)
      const hypothesis = container.querySelector('[data-ending-hypothesis]')
      expect(hypothesis?.textContent).toContain('结局目标：旧城与守门人共同管理公开的月门通行制度')
      expect(hypothesis?.textContent).toContain('决定性冲突：沈砚必须在个人掌控月门与建立共同制度之间选择')
      expect(hypothesis?.textContent).toContain('主角选择：把月门交给新议会与守门人共同管理')
      expect(hypothesis?.textContent).toContain('主题回归：真正的归属来自愿意与他人共同承担权力')
      expect(hypothesis?.textContent).toContain('收束方式：closure')
      expect(hypothesis?.textContent).toContain('期望情绪余韵：第一缕晨光照在公开通行证上')
      expect(hypothesis?.textContent).toContain('余波：首批公开通行证开始发放，旧议会残部退出城门')
      expect(hypothesis?.textContent).toContain('刻意未收束债务：world · debt-rebuild-moon-gate')
      expect(hypothesis?.textContent).toContain('尾声作用：展示普通城民领取第一份公开通行证')
      expect([...container.querySelectorAll('[data-ending-final-state]')]
        .map(item => item.textContent)).toEqual([
        'character · shen-yan · 留在旧城但放弃独占月门',
        'relationship · shen-yan:gatekeeper · 从互不信任转为共同守门',
        'world · old-city · 月门通行规则公开且由新议会监督',
      ])
      expect(hypothesis?.textContent).toContain('anchor-ending-hypothesis-r2')
      expect(hypothesis?.textContent).toContain('ending-planner')
      expect([...container.querySelectorAll('[data-ending-closure-dependency]')]
        .map(item => item.textContent)).toEqual([
        'relationship · debt-relationship-trust',
        'promise · debt-promise-old-city',
        'world · debt-rebuild-moon-gate',
      ])
      expect(reviewResultPacket).not.toHaveBeenCalled()
      expect(rollbackRevision).not.toHaveBeenCalled()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders strict world clock references in the existing 叙事时钟 view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-strict-world-clock'
    const sourceAnchorIds = ['anchor-strict-world-clock-r2'] as const
    const provenance = {
      taskId: 'task-strict-world-clock-r2',
      sessionId: SESSION_ID,
      producer: 'world-planner',
    } as const
    const unitDelta = {
      id: 'unit-volume-moon-gate-r2',
      kind: 'narrative-unit' as const,
      operation: 'set' as const,
      targetId: 'volume-moon-gate',
      field: 'unit' as const,
      value: {
        level: 'volume' as const,
        parentId: null,
        order: 0,
        objective: '改变月门通行秩序',
        entryState: '议会秘密控制渡口',
        exitState: '渡口进入公开协管',
        status: 'accepted',
      },
      sourceAnchorIds,
    }
    const worldDelta = {
      id: 'clock-volume-moon-gate-world-r2',
      kind: 'narrative-clock' as const,
      operation: 'set' as const,
      targetId: 'volume-moon-gate',
      field: 'world' as const,
      value: {
        movement: 'reconfigure-access',
        state: '月门通行规则公开，北渡口在洪季由议会与巡河卫共同限行',
        storyTime: '洪季第一日',
        version: 2,
        scope: { unitId: 'volume-moon-gate', level: 'volume' as const },
        moves: [{
          moveId: 'world-move-moon-gate-access-r2',
          references: [{
            kind: 'rule' as const,
            targetId: 'rule-moon-gate-access',
          }, {
            kind: 'faction-continuity' as const,
            entryId: 'faction-entry-moon-council-alliance',
          }, {
            kind: 'location-continuity' as const,
            entryId: 'location-entry-north-ferry-flood',
          }, {
            kind: 'object-continuity' as const,
            entryId: 'object-entry-moon-seal-transfer',
          }],
          contribution: '把公开通行规则、限时同盟、洪季限行与月门印转交对齐为新的世界状态。',
        }],
        revisionRationale: '新规则与三条连续性事实共同改变了月门世界状态。',
      },
      sourceAnchorIds,
    }
    const worldEntry = {
      unitId: 'volume-moon-gate',
      clock: 'world' as const,
      ...worldDelta.value,
      sourceRevision: 2,
      sourceDeltaId: worldDelta.id,
      sourceAnchorIds,
      provenance,
      delta: worldDelta,
    }
    const acceptedRevision = {
      revision: 2,
      parentRevision: 1,
      packetId: 'packet-strict-world-clock-r2',
      manuscript: { unitId: 'chapter-1', title: '第一章', text: '月门规则公开。' },
      deltas: [unitDelta, worldDelta],
      issues: [],
      decisions: [unitDelta, worldDelta].map(delta => ({
        itemType: 'delta' as const,
        itemId: delta.id,
        outcome: 'accept' as const,
      })),
      sourceAnchors: [{
        id: sourceAnchorIds[0],
        sourceId: 'chapter-strict-world-clock-r2',
        start: 0,
        end: 8,
        contentHash: 'f'.repeat(64),
      }],
      provenance,
      authorization: {
        kind: 'author' as const,
        actorId: 'author-1',
        decisionId: 'decision-strict-world-clock-r2',
      },
    }
    const projectNarrative = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-strict-world-clock',
        workspaceId,
        revision: 2,
        units: [{
          id: unitDelta.targetId,
          ...unitDelta.value,
          sourceRevision: 2,
          sourceDeltaId: unitDelta.id,
          sourceAnchorIds,
          provenance,
          delta: unitDelta,
        }],
        clocks: NARRATIVE_CLOCKS.map(clock => ({
          clock,
          entries: clock === 'world' ? [worldEntry] : [],
          debts: [],
        })),
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-strict-world-clock',
              workspaceId,
              cwd: 'C:/novels/strict-world-clock',
              acceptedRevision: 2,
            },
          })),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revision === 2
              ? acceptedRevision
              : {
                  ...acceptedRevision,
                  revision: 1,
                  parentRevision: 0,
                  packetId: 'packet-strict-world-clock-r1',
                  deltas: [],
                  decisions: [],
                },
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-strict-world-clock',
              workspaceId,
              revision: 2,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(projectNarrative).toHaveBeenCalledWith(workspaceId, 2)
      const world = container.querySelector('[data-world-clock-scope="volume-moon-gate"]')
      expect(world).not.toBeNull()
      expect(world?.textContent).toContain('volume · volume-moon-gate · v2')
      expect(world?.textContent).toContain('推进：reconfigure-access')
      expect(world?.textContent)
        .toContain('状态：月门通行规则公开，北渡口在洪季由议会与巡河卫共同限行')
      expect(world?.textContent).toContain('故事时间: 洪季第一日')
      const move = world?.querySelector('[data-world-move="world-move-moon-gate-access-r2"]')
      expect(move?.textContent).toContain('rule · rule-moon-gate-access')
      expect(move?.textContent)
        .toContain('faction-continuity · faction-entry-moon-council-alliance')
      expect(move?.textContent)
        .toContain('location-continuity · location-entry-north-ferry-flood')
      expect(move?.textContent)
        .toContain('object-continuity · object-entry-moon-seal-transfer')
      expect(move?.textContent)
        .toContain('贡献：把公开通行规则、限时同盟、洪季限行与月门印转交对齐为新的世界状态。')
      expect(world?.textContent)
        .toContain('修订理由：新规则与三条连续性事实共同改变了月门世界状态。')
      expect(container.querySelector('[data-narrative-clock="world"]')?.textContent)
        .toContain('R2 · clock-volume-moon-gate-world-r2 · 出处锚点：anchor-strict-world-clock-r2 · 生成者：world-planner')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('traces downstream causal impact for an accepted story event in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-causal-impact'
    const provenance = {
      taskId: 'task-causal-impact-r2',
      sessionId: SESSION_ID,
      producer: 'causal-planner',
    } as const
    const sourceAnchorIds = ['anchor-causal-impact-r2'] as const
    const storyEvents = [
      ['event-a', '主角打开城门。'],
      ['event-b', '守门人离开岗位。'],
      ['event-c', '暗门因此无人看守。'],
      ['event-x', '北岸商船照常靠港。'],
    ].map(([targetId, summary], order) => ({
      kind: 'story-event' as const,
      targetId: targetId!,
      fields: { summary: summary!, order },
      fieldSources: {},
      sourceRevision: 2,
      sourceDeltaId: `event-${targetId!}-summary-r2`,
      sourceAnchorIds,
      provenance,
    }))
    const causalEdge = (from: string, to: string) => ({
      id: `causal:${from}:${to}`,
      from: `entity:${from}`,
      to: `entity:${to}`,
      kind: 'causal' as const,
      label: 'causes',
      sourceRevision: 2,
      sourceDeltaId: `impact-${from}-causes-${to}-r2`,
      sourceAnchorIds,
      sourceRanges: [{
        anchorId: sourceAnchorIds[0],
        sourceId: 'chapter-causal-impact-r2',
        start: from === 'event-a' ? 0 : 12,
        end: from === 'event-a' ? 11 : 23,
        contentHash: from === 'event-a' ? 'a'.repeat(64) : 'b'.repeat(64),
      }],
      provenance,
    })
    const edgeAB = causalEdge('event-a', 'event-b')
    const edgeBC = causalEdge('event-b', 'event-c')
    const impact = {
      sourceEventId: 'event-a',
      affected: [
        { eventId: 'event-b', depth: 1, path: [edgeAB] },
        { eventId: 'event-c', depth: 2, path: [edgeAB, edgeBC] },
      ],
    } as const
    const revisions = [1, 2].map(revision => ({
      revision,
      parentRevision: revision - 1,
      packetId: `packet-causal-impact-r${String(revision)}`,
      manuscript: {
        unitId: 'chapter-causal-impact',
        title: '城门之后',
        text: `城门因果链 R${String(revision)}`,
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance,
      authorization: {
        kind: 'author' as const,
        actorId: 'author-1',
        decisionId: `decision-causal-impact-r${String(revision)}`,
      },
    }))
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-causal-impact',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        impact,
      },
    } as const))
    const reviewResultPacket = vi.fn()
    const rollbackRevision = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-causal-impact',
              workspaceId,
              cwd: 'C:/novels/causal-impact',
              acceptedRevision: 2,
            },
          })),
          retrieve,
          reviewResultPacket,
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revisions[revision - 1],
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-causal-impact',
              workspaceId,
              revision: 2,
              facts: [{
                kind: 'story-event' as const,
                targetId: 'event-a',
                field: 'causes',
                value: 'event-b',
                sourceRevision: 2,
                sourceDeltaId: edgeAB.sourceDeltaId,
                sourceAnchorIds,
                provenance,
              }, {
                kind: 'story-event' as const,
                targetId: 'event-b',
                field: 'causes',
                value: 'event-c',
                sourceRevision: 2,
                sourceDeltaId: edgeBC.sourceDeltaId,
                sourceAnchorIds,
                provenance,
              }],
              entities: storyEvents,
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const sourceEvent = container.querySelector<HTMLSelectElement>(
        '[aria-label="因果链起点事件"]',
      )
      const trace = container.querySelector<HTMLButtonElement>(
        '[data-trace-causal-impact]',
      )
      expect(sourceEvent?.textContent).toContain('event-a')
      expect(sourceEvent?.textContent).toContain('event-x')
      await act(async () => {
        if (sourceEvent !== null) {
          sourceEvent.value = 'event-a'
          sourceEvent.dispatchEvent(new Event('change', { bubbles: true }))
        }
        trace?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        impactEventId: 'event-a',
      })
      const result = container.querySelector('[data-causal-impact-trace]')
      expect(result?.textContent).toContain('R2')
      expect(result?.textContent).toContain('起点事件：event-a')
      expect(result?.textContent).toContain('event-b · depth 1')
      expect(result?.textContent).toContain('event-c · depth 2')
      expect(result?.textContent).toContain('causal:event-a:event-b')
      expect(result?.textContent).toContain('causal:event-b:event-c')
      expect(result?.textContent).toContain('impact-event-a-causes-event-b-r2')
      expect(result?.textContent).toContain('anchor-causal-impact-r2')
      expect(result?.textContent).toContain('chapter-causal-impact-r2')
      expect(result?.textContent).toContain('causal-planner')
      expect(result?.textContent).not.toContain('event-x')
      expect(reviewResultPacket).not.toHaveBeenCalled()
      expect(rollbackRevision).not.toHaveBeenCalled()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds the accepted 章节控制包 before Write in the existing narrative view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-chapter-control-pack'
    const provenance = {
      taskId: 'task-chapter-control-pack-r2',
      sessionId: SESSION_ID,
      producer: 'chapter-planner',
    } as const
    const sourceAnchorIds = ['anchor-chapter-control-pack-r2'] as const
    const postCheckProvenance = {
      taskId: 'task-post-chapter-check-r3',
      sessionId: SESSION_ID,
      producer: 'chapter-reviewer',
    } as const
    const postCheckAnchorIds = ['anchor-post-chapter-check-r3'] as const
    const chapterContract = {
      viewpoint: '沈砚',
      storyTime: '归城第三日·子夜',
      sceneFunctions: ['discovery', 'decision'],
      activePlotLineIds: ['plot-missing', 'plot-moon-gate'],
      activeRelationshipLineIds: ['relationship<->missing', 'gatekeeper<->shen-yan'],
      promisesTouched: [{
        promiseId: 'promise-missing',
        intendedMovement: 'hold',
      }, {
        promiseId: 'promise-old-city',
        intendedMovement: 'advance',
      }],
      informationPolicy: {
        readerMayKnow: ['月形刻痕指向密道'],
        characterMayKnow: [{
          characterId: 'shen-yan',
          facts: ['守门人隐瞒了第二把钥匙'],
        }],
      },
      progressionSetups: ['沈砚观察月门符文'],
      progressionPayoffs: ['识别旧庭暗号'],
      emotionalMovement: '戒备转为主动承担风险',
      endingPull: '暗门打开后传来失踪兄长的声音',
      prohibitedContradictions: ['不得让守门人公开第二把钥匙'],
      styleConstraints: ['近距离第三人称', '压低说明密度'],
      lengthRange: { min: 2800, max: 3600 },
      acceptanceGates: ['至少完成一次实质发现', '结尾拉力来自新声音而非机械断句'],
    } as const
    const postCheckValue = {
      contractAssessment: {
        contractRevision: 1,
        contractSourceDeltaId: 'unit-chapter-2-r1',
        outcome: 'met' as const,
        deviations: ['实际结尾将兄长声音提前到暗门开启瞬间'],
      },
      manuscriptSourceRevision: 2,
      changes: ['发现密道入口并确认第二把钥匙存在'],
      costs: ['沈砚向守门人暴露自己识得月门符文'],
      newlyPossible: ['进入月门下层档案室'],
      newlyImpossible: ['继续假装不知道第二把钥匙'],
      readerNowKnows: ['月形刻痕是密道坐标'],
      readerNowSuspects: ['失踪兄长正在暗门后'],
      characterCarryForward: [{
        characterId: 'shen-yan',
        carries: ['对守门人的新疑心', '进入档案室的决定'],
      }, {
        characterId: 'gatekeeper',
        carries: ['第二把钥匙可能暴露的压力'],
      }],
      debtTransitions: [{
        clock: 'plot' as const,
        debtId: 'debt-voice-behind-door',
        transition: 'created' as const,
        sourceDeltaId: 'debt-created-chapter-2-r2',
      }, {
        clock: 'plot' as const,
        debtId: 'debt-voice-behind-door',
        transition: 'created' as const,
        sourceDeltaId: 'debt-created-chapter-2-r2',
      }, {
        clock: 'world' as const,
        debtId: 'debt-moon-gate',
        transition: 'advanced' as const,
        sourceDeltaId: 'debt-advanced-chapter-2-r2',
      }, {
        clock: 'promise' as const,
        debtId: 'debt-old-signal',
        transition: 'paid' as const,
        sourceDeltaId: 'debt-paid-chapter-2-r2',
      }, {
        clock: 'mystery' as const,
        debtId: 'debt-false-tunnel',
        transition: 'retired' as const,
        sourceDeltaId: 'debt-retired-chapter-2-r2',
      }, {
        clock: 'plot' as const,
        debtId: 'debt-future-after-post-check',
        transition: 'advanced' as const,
        sourceDeltaId: 'debt-future-after-post-check-r4',
      }],
    } as const
    const narrativeUnit = (
      id: string,
      level: 'book' | 'volume' | 'arc' | 'chapter' | 'scene' | 'beat',
      parentId: string | null,
      order: number,
      objective: string,
      status: string,
    ) => {
      const delta = {
        id: `unit-${id}-r2`,
        kind: 'narrative-unit' as const,
        operation: 'set' as const,
        targetId: id,
        field: 'unit' as const,
        value: {
          level,
          parentId,
          order,
          objective,
          entryState: `${id} entry`,
          exitState: `${id} exit`,
          status,
          ...(id === 'chapter-2' ? { chapterContract } : {}),
        },
        sourceAnchorIds,
      }
      return {
        id,
        ...delta.value,
        sourceRevision: 2,
        sourceDeltaId: delta.id,
        sourceAnchorIds,
        provenance,
        delta,
      }
    }
    const units = [
      narrativeUnit('book-main', 'book', null, 0, '查清旧案', 'active'),
      narrativeUnit('volume-1', 'volume', 'book-main', 0, '重返故乡', 'active'),
      narrativeUnit('arc-1', 'arc', 'volume-1', 0, '找到密道', 'active'),
      narrativeUnit('chapter-1', 'chapter', 'arc-1', 0, '回到旧庭', 'accepted'),
      narrativeUnit('chapter-2', 'chapter', 'arc-1', 1, '寻找密道入口', 'planned'),
      narrativeUnit('scene-moon-gate', 'scene', 'chapter-2', 0, '确认月门机关', 'planned'),
      narrativeUnit('beat-read-runes', 'beat', 'scene-moon-gate', 0, '辨认月形刻痕', 'drafting'),
      narrativeUnit('beat-test-key', 'beat', 'scene-moon-gate', 1, '试探第二把钥匙', 'blocked'),
      narrativeUnit('scene-open-door', 'scene', 'chapter-2', 1, '打开暗门', 'ready'),
      narrativeUnit('beat-cross-threshold', 'beat', 'scene-open-door', 0, '决定是否进入暗门', 'accepted-plan'),
    ] as const
    const scopedCanonFact = {
      kind: 'clue' as const,
      targetId: 'chapter-2',
      field: 'known-sign',
      value: '砖缝里的月形刻痕',
      sourceRevision: 2,
      sourceDeltaId: 'clue-chapter-2-sign-r2',
      sourceAnchorIds,
      provenance,
    }
    const scopedPostCheckFact = {
      kind: 'chapter-state' as const,
      targetId: 'chapter-2',
      field: 'post-check',
      value: postCheckValue,
      sourceRevision: 3,
      sourceDeltaId: 'post-check-chapter-2-r3',
      sourceAnchorIds: postCheckAnchorIds,
      provenance: postCheckProvenance,
    }
    const plotDelta = {
      id: 'clock-chapter-2-plot-r2',
      kind: 'narrative-clock' as const,
      operation: 'set' as const,
      targetId: 'chapter-2',
      field: 'plot' as const,
      value: {
        movement: 'advance',
        state: '寻找密道入口',
        version: 2,
        scope: { unitId: 'chapter-2', level: 'chapter' as const },
        lines: [{
          lineId: 'plot-moon-gate',
          goal: '找到月门密道入口',
          stakes: '失去进入旧庭档案室的机会',
          status: 'active',
          turns: [],
        }],
        revisionRationale: '第二章接受后推进密道主线',
      },
      sourceAnchorIds,
    }
    const plotEntry = {
      unitId: 'chapter-2',
      clock: 'plot' as const,
      ...plotDelta.value,
      sourceRevision: 2,
      sourceDeltaId: plotDelta.id,
      sourceAnchorIds,
      provenance,
      delta: plotDelta,
    }
    const relationshipR1Provenance = {
      taskId: 'task-relationship-r1',
      sessionId: SESSION_ID,
      producer: 'relationship-planner',
    } as const
    const relationshipR1AnchorIds = ['anchor-relationship-r1'] as const
    const relationshipLine = {
      line: 'gatekeeper<->shen-yan',
      participants: ['gatekeeper', 'shen-yan'] as const,
      directions: [{
        pair: 'gatekeeper->shen-yan',
        from: 'gatekeeper',
        to: 'shen-yan',
        fields: { trust: 'cautious' },
        fieldSources: {
          trust: {
            value: 'cautious',
            sourceRevision: 1,
            sourceDeltaId: 'relationship-gatekeeper-shen-r1',
            sourceAnchorIds: relationshipR1AnchorIds,
            provenance: relationshipR1Provenance,
          },
        },
        sourceRevision: 1,
        sourceDeltaId: 'relationship-gatekeeper-shen-r1',
        sourceAnchorIds: relationshipR1AnchorIds,
        provenance: relationshipR1Provenance,
      }, {
        pair: 'shen-yan->gatekeeper',
        from: 'shen-yan',
        to: 'gatekeeper',
        fields: { trust: 'earned' },
        fieldSources: {
          trust: {
            value: 'earned',
            sourceRevision: 2,
            sourceDeltaId: 'relationship-shen-gatekeeper-r2',
            sourceAnchorIds,
            provenance,
          },
        },
        sourceRevision: 2,
        sourceDeltaId: 'relationship-shen-gatekeeper-r2',
        sourceAnchorIds,
        provenance,
      }],
    } as const
    const relationshipEmotionMove = {
      moveId: 'relationship-scene-mixed-relief',
      lineId: 'gatekeeper<->shen-yan',
      relationshipTargetId: 'shen-yan->gatekeeper',
      storyEventIds: ['event-moon-gate-turns'],
      emotionEpisodeIds: [
        'emotion-mixed-relief',
        'emotion-mixed-relief',
        'emotion-future-relief',
        'emotion-future-relief',
      ],
      contribution: '机关转动时的援手让沈砚同时积累信任与疑心。',
    } as const
    const relationshipClockDelta = {
      id: 'clock-scene-moon-gate-relationship-r2',
      kind: 'narrative-clock' as const,
      operation: 'set' as const,
      targetId: 'scene-moon-gate',
      field: 'relationship' as const,
      value: {
        movement: 'earned-trust-under-pressure',
        state: '沈砚接受守门人的帮助，但仍追问第二把钥匙',
        storyTime: '归城第三日·子夜',
        version: 1,
        scope: { unitId: 'scene-moon-gate', level: 'scene' as const },
        moves: [relationshipEmotionMove],
        revisionRationale: '月门机关转动时出现了带残留疑心的信任。',
      },
      sourceAnchorIds,
    } as const
    const relationshipClockEntry = {
      unitId: 'scene-moon-gate',
      clock: 'relationship' as const,
      ...relationshipClockDelta.value,
      sourceRevision: 2,
      sourceDeltaId: relationshipClockDelta.id,
      sourceAnchorIds,
      provenance,
      delta: relationshipClockDelta,
    } as const
    const relationshipEmotionValue = {
      characterId: 'shen-yan',
      eventId: 'event-moon-gate-turns',
      storyOrder: 20,
      trigger: '月门机关骤响后守门人伸手扶住沈砚',
      object: 'gatekeeper',
      appraisal: '守门人选择保护她，却仍没有解释第二把钥匙',
      emotions: [
        { label: '惊惧', intensity: 0.7 },
        { label: '信任', intensity: 0.5 },
      ],
      bodilyExpression: '肩背绷紧后借力站稳',
      actionTendency: '接受帮助并继续追问',
      expression: '先道谢，再要求守门人说明钥匙用途',
      suppression: '没有立刻把守门人的手甩开',
      coping: '把矛盾感受转化为下一步核验',
      residue: '对守门人的信任仍混着第二把钥匙的疑心',
      reactivatesEpisodeIds: ['emotion-gatekeeper-guarded'],
      downstreamChoices: ['进入暗门前再次确认守门人的立场'],
    } as const
    const relationshipEmotionEpisode = {
      episodeId: 'emotion-mixed-relief',
      episode: relationshipEmotionValue,
      sourceRevision: 2,
      sourceDeltaId: 'emotion-mixed-relief-r2',
      sourceAnchorIds,
      sourceRanges: [{
        anchorId: sourceAnchorIds[0],
        sourceId: 'chapter-control-pack-r2',
        start: 0,
        end: 24,
        contentHash: 'e'.repeat(64),
      }],
      provenance,
    } as const
    const promiseState = {
      version: 2,
      promise: '旧城暗号将在月门前得到兑现',
      type: 'mystery',
      weight: 'major' as const,
      horizon: {
        openedUnitId: 'chapter-1',
        expectedPayoffStartUnitId: 'chapter-2',
        expectedPayoffEndUnitId: 'chapter-2',
      },
      setup: {
        beatId: 'promise-old-city-setup',
        unitId: 'chapter-1',
        sourceRevision: 1,
        sourceAnchorIds: relationshipR1AnchorIds,
        description: '沈砚在旧庭听见暗号。',
      },
      reminders: [{
        beatId: 'promise-old-city-reminder-r2',
        unitId: 'chapter-2',
        sourceRevision: 2,
        sourceAnchorIds,
        description: '月形刻痕再次组成旧城暗号。',
      }],
      complications: [],
      resolution: {
        status: 'open' as const,
        payoffType: null,
        beat: null,
        retirementRationale: null,
      },
      aftermath: null,
      revisionRationale: '暗号已经推进到月门前。',
    } as const
    const promiseFact = {
      kind: 'promise' as const,
      targetId: 'promise-old-city',
      field: 'state',
      value: promiseState,
      sourceRevision: 2,
      sourceDeltaId: 'promise-old-city-state-r2',
      sourceAnchorIds,
      provenance,
    }
    const resolvedCanonLock = {
      kind: scopedCanonFact.kind,
      targetId: scopedCanonFact.targetId,
      field: scopedCanonFact.field,
      value: scopedCanonFact.value,
    } as const
    const unavailableCanonLock = {
      kind: 'story-event' as const,
      targetId: 'event-brother-identity',
      field: 'identity',
      value: '暗门后的声音属于失踪兄长',
    } as const
    const clocks = NARRATIVE_CLOCKS.map(clock => ({
      clock,
      entries: clock === 'plot'
        ? [plotEntry]
        : clock === 'relationship'
          ? [relationshipClockEntry]
          : [],
      debts: [],
    }))
    const recentManuscript = {
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章 归乡',
        text: '她回到旧庭。',
      },
      sourceRevision: 1,
      provenance: {
        taskId: 'task-chapter-1-r1',
        sessionId: SESSION_ID,
        producer: 'chapter-writer',
      },
    } as const
    const contractAnchorIds = ['anchor-chapter-contract-r1'] as const
    const contractUnit = {
      ...units[4],
      sourceRevision: 1,
      sourceDeltaId: 'unit-chapter-2-r1',
      sourceAnchorIds: contractAnchorIds,
      provenance: {
        taskId: 'task-chapter-contract-r1',
        sessionId: SESSION_ID,
        producer: 'chapter-planner',
      },
      delta: {
        ...units[4].delta,
        id: 'unit-chapter-2-r1',
        sourceAnchorIds: contractAnchorIds,
      },
    } as const
    const chapterManuscript = {
      manuscript: {
        unitId: 'chapter-2',
        title: '第二章 暗门',
        text: '沈砚循着月形刻痕打开暗门。',
      },
      sourceRevision: 2,
      provenance: {
        taskId: 'task-chapter-manuscript-r2',
        sessionId: SESSION_ID,
        producer: 'chapter-writer',
      },
    } as const
    const debtCandidate = (
      reference: typeof postCheckValue.debtTransitions[number],
      sourceRevision: number,
      status: string,
      anchorId: string,
    ) => ({
      debt: {
        id: reference.debtId,
        unitId: 'chapter-2',
        clock: reference.clock,
        summary: `${reference.debtId} summary`,
        status,
        sourceRevision,
        sourceDeltaId: reference.sourceDeltaId,
        sourceAnchorIds: [anchorId],
        provenance: {
          taskId: `task-${reference.sourceDeltaId}-r${String(sourceRevision)}`,
          sessionId: SESSION_ID,
          producer: 'chapter-writer',
        },
        delta: {
          id: reference.sourceDeltaId,
          kind: 'narrative-debt' as const,
          operation: 'set' as const,
          targetId: reference.debtId,
          unitId: 'chapter-2',
          field: reference.clock,
          value: { summary: `${reference.debtId} summary`, status },
          sourceAnchorIds: [anchorId],
        },
      },
      sourceRanges: [{
        anchorId,
        sourceId: `${reference.sourceDeltaId}-r${String(sourceRevision)}`,
        start: 0,
        end: 12,
        contentHash: String(sourceRevision).repeat(64),
      }],
    })
    const resolvedCreated = debtCandidate(
      postCheckValue.debtTransitions[0],
      2,
      'open',
      'anchor-debt-created-r2',
    )
    const resolvedPaid = debtCandidate(
      postCheckValue.debtTransitions[3],
      2,
      'paid',
      'anchor-debt-paid-r2',
    )
    const resolvedRetired = debtCandidate(
      postCheckValue.debtTransitions[4],
      2,
      'retired',
      'anchor-debt-retired-r2',
    )
    const ambiguousWorldR1 = debtCandidate(
      postCheckValue.debtTransitions[2],
      1,
      'open',
      'anchor-debt-world-r1',
    )
    const ambiguousWorldR2 = debtCandidate(
      postCheckValue.debtTransitions[2],
      2,
      'advanced',
      'anchor-debt-world-r2',
    )
    const postChapterCheckResolution = {
      postCheck: {
        fact: scopedPostCheckFact,
        sourceRanges: [{
          anchorId: postCheckAnchorIds[0],
          sourceId: 'post-check-chapter-2-r3',
          start: 0,
          end: 24,
          contentHash: '3'.repeat(64),
        }],
      },
      contract: {
        unit: contractUnit,
        sourceRanges: [{
          anchorId: contractAnchorIds[0],
          sourceId: 'chapter-contract-r1',
          start: 0,
          end: 18,
          contentHash: '1'.repeat(64),
        }],
      },
      manuscript: {
        projection: chapterManuscript,
        sourceRanges: [{
          sourceId: 'chapter-2',
          start: 0,
          end: chapterManuscript.manuscript.text.length,
          contentHash: '2'.repeat(64),
        }],
      },
      debtTransitions: {
        resolved: [{ reference: postCheckValue.debtTransitions[0], ...resolvedCreated }, {
          reference: postCheckValue.debtTransitions[1],
          ...resolvedCreated,
        }, {
          reference: postCheckValue.debtTransitions[3],
          ...resolvedPaid,
        }, {
          reference: postCheckValue.debtTransitions[4],
          ...resolvedRetired,
        }],
        missing: [postCheckValue.debtTransitions[5]],
        ambiguous: [{
          reference: postCheckValue.debtTransitions[2],
          candidates: [ambiguousWorldR1, ambiguousWorldR2],
        }],
      },
    } as const
    const previousPostCheckValue = {
      contractAssessment: {
        contractRevision: 1,
        contractSourceDeltaId: 'unit-chapter-1-r1',
        outcome: 'met' as const,
        deviations: ['第一章回庭后仍保留守门人的戒心'],
      },
      manuscriptSourceRevision: 1,
      changes: ['第一章确认沈砚已经回到旧庭'],
      costs: ['沈砚暴露了归城行踪'],
      newlyPossible: ['从旧庭追查月门暗号'],
      newlyImpossible: ['继续伪装仍在城外'],
      readerNowKnows: ['沈砚已经进入旧庭'],
      readerNowSuspects: ['守门人知道月门入口'],
      characterCarryForward: [{
        characterId: 'shen-yan',
        carries: ['对守门人的戒心', '追查月门的决定'],
      }],
      debtTransitions: [{
        clock: 'plot' as const,
        debtId: 'debt-old-courtyard-return',
        transition: 'created' as const,
        sourceDeltaId: 'debt-old-courtyard-return-r1',
      }],
    } as const
    const previousPostCheckAnchorId = 'anchor-post-check-chapter-1-r2'
    const previousDebtAnchorId = 'anchor-debt-old-courtyard-return-r1'
    const previousPostChapterCheckResolution = {
      postCheck: {
        fact: {
          ...scopedPostCheckFact,
          targetId: 'chapter-1',
          value: previousPostCheckValue,
          sourceRevision: 2,
          sourceDeltaId: 'post-check-chapter-1-r2',
          sourceAnchorIds: [previousPostCheckAnchorId],
        },
        sourceRanges: [{
          anchorId: previousPostCheckAnchorId,
          sourceId: 'post-check-chapter-1-r2',
          start: 0,
          end: 20,
          contentHash: '4'.repeat(64),
        }],
      },
      contract: null,
      manuscript: {
        projection: recentManuscript,
        sourceRanges: [{
          sourceId: 'chapter-1',
          start: 0,
          end: recentManuscript.manuscript.text.length,
          contentHash: '5'.repeat(64),
        }],
      },
      debtTransitions: {
        resolved: [{
          reference: previousPostCheckValue.debtTransitions[0],
          debt: {
            id: 'debt-old-courtyard-return',
            unitId: 'chapter-1',
            clock: 'plot' as const,
            summary: '追查回庭后暴露的行踪',
            status: 'open',
            sourceRevision: 1,
            sourceDeltaId: 'debt-old-courtyard-return-r1',
            sourceAnchorIds: [previousDebtAnchorId],
            provenance,
            delta: {
              id: 'debt-old-courtyard-return-r1',
              kind: 'narrative-debt' as const,
              operation: 'set' as const,
              targetId: 'debt-old-courtyard-return',
              unitId: 'chapter-1',
              field: 'plot' as const,
              value: { summary: '追查回庭后暴露的行踪', status: 'open' },
              sourceAnchorIds: [previousDebtAnchorId],
            },
          },
          sourceRanges: [{
            anchorId: previousDebtAnchorId,
            sourceId: 'chapter-1-r1',
            start: 0,
            end: 8,
            contentHash: '6'.repeat(64),
          }],
        }],
        missing: [],
        ambiguous: [],
      },
    } as const
    const controlPackArcValue = {
      version: 2,
      scopeUnitId: 'book-main',
      hypothesis: '沈砚会从独自控制风险，转向与顾临川共同承担。',
      startingBelief: '只有独自承担才不会再次失去重要的人。',
      targetTransformation: '主动共享风险，并接受关系中的相互依赖。',
      transformationDimensions: ['belief', 'strategy', 'relationship'],
      pressures: ['月门核心正在失控', '顾临川被困在断桥另一端'],
      decisionChain: [{
        decisionId: 'decision-return-for-ally',
        storyEventId: 'event-return-for-gu-linchuan',
        pressure: '月门即将坍塌，先夺取核心会把顾临川留在断桥另一端。',
        choice: '放弃抢先取得核心，折返断桥接应顾临川。',
        rejectedAlternatives: ['独自夺取核心', '封死断桥阻止追兵'],
        cost: '失去抢先控制月门核心的机会，并留下右肩灼伤。',
        persistentConsequence: '后续路线必须由两人共同决定。',
        transformationEvidence: '沈砚在高压下维持共同承担，而没有退回独自控制。',
      }],
      currentStage: '在真实代价下维持共同承担',
      unresolvedQuestion: '当共同决定导致失败时，他是否仍会接受相互依赖？',
      changeRationale: '折返救援证明转变能够承受机会损失。',
    } as const
    const controlPackArcFact = {
      kind: 'character-state',
      targetId: 'shen-yan',
      field: 'arc-hypothesis',
      value: controlPackArcValue,
      sourceRevision: 2,
      sourceDeltaId: 'character-arc-shen-yan-r2',
      sourceAnchorIds,
      provenance,
      delta: {
        id: 'character-arc-shen-yan-r2',
        kind: 'character-state',
        operation: 'set',
        targetId: 'shen-yan',
        field: 'arc-hypothesis',
        value: controlPackArcValue,
        sourceAnchorIds,
      },
    } as const
    const controlPack = {
      projectId: 'project-chapter-control-pack',
      workspaceId,
      sourceRevision: 3,
      headRevision: 3,
      freshness: 'current' as const,
      chapter: units[4],
      scope: [units[0], units[1], units[2], units[4]],
      sceneBeats: units.slice(5),
      scopedCanonFacts: [scopedCanonFact, scopedPostCheckFact],
      canonLockResolution: {
        resolved: [{ lock: resolvedCanonLock, fact: scopedCanonFact }],
        unavailableAtRevision: [unavailableCanonLock],
      },
      clocks,
      recentManuscripts: [recentManuscript],
      recentPostChapterChecks: [{
        chapter: units[3],
        resolution: previousPostChapterCheckResolution,
      }],
      writingMemory: {
        characterCarryForward: [{
          characterId: 'shen-yan',
          carries: ['对守门人的戒心', '追查月门的决定'],
          sourceChapter: units[3],
          sourceRevision: 2,
          sourceDeltaId: 'post-check-chapter-1-r2',
          sourceAnchorIds: [previousPostCheckAnchorId],
          sourceRanges: previousPostChapterCheckResolution.postCheck.sourceRanges,
          provenance: postCheckProvenance,
        }],
        characterArcHypotheses: [{
          characterId: 'shen-yan',
          fact: controlPackArcFact,
          sourceRanges: [{
            anchorId: sourceAnchorIds[0],
            sourceId: 'chapter-control-pack-r2',
            start: 0,
            end: 8,
            contentHash: 'd'.repeat(64),
          }],
        }],
      },
      referenceResolution: {
        plotLines: {
          resolved: [{
            lineId: 'plot-moon-gate',
            line: plotDelta.value.lines[0],
            clockEntry: plotEntry,
          }],
          missing: ['plot-missing'],
        },
        relationshipLines: {
          resolved: [{
            lineId: 'gatekeeper<->shen-yan',
            line: relationshipLine,
            emotionEpisodes: {
              resolved: [{
                clockEntry: relationshipClockEntry,
                move: relationshipEmotionMove,
                episodeId: 'emotion-mixed-relief',
                episode: relationshipEmotionEpisode,
              }, {
                clockEntry: relationshipClockEntry,
                move: relationshipEmotionMove,
                episodeId: 'emotion-mixed-relief',
                episode: relationshipEmotionEpisode,
              }],
              missing: [{
                clockEntry: relationshipClockEntry,
                move: relationshipEmotionMove,
                episodeId: 'emotion-future-relief',
              }, {
                clockEntry: relationshipClockEntry,
                move: relationshipEmotionMove,
                episodeId: 'emotion-future-relief',
              }],
            },
          }],
          missing: ['relationship<->missing'],
        },
        promises: {
          resolved: [{
            promiseId: 'promise-old-city',
            intendedMovement: 'advance',
            state: promiseState,
            fact: promiseFact,
          }],
          missing: [{ promiseId: 'promise-missing', intendedMovement: 'hold' }],
        },
      },
      postChapterCheckResolution,
    } as const
    const revisions = [1, 2, 3].map(revision => ({
      revision,
      parentRevision: revision - 1,
      packetId: `packet-chapter-control-pack-r${String(revision)}`,
      manuscript: recentManuscript.manuscript,
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance,
      authorization: {
        kind: 'author' as const,
        actorId: 'author-1',
        decisionId: `decision-chapter-control-pack-r${String(revision)}`,
      },
    }))
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-chapter-control-pack',
        workspaceId,
        revision: 3,
        headRevision: 3,
        freshness: 'current',
        hits: [],
        controlPack,
      },
    } as const))
    const generateReviewDraft = vi.fn()
    const previewReview = vi.fn()
    const reviewResultPacket = vi.fn()
    const rollbackRevision = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-chapter-control-pack',
              workspaceId,
              cwd: 'C:/novels/chapter-control-pack',
              acceptedRevision: 3,
              canonLocks: [resolvedCanonLock, unavailableCanonLock],
            },
          })),
          generateReviewDraft,
          previewReview,
          retrieve,
          reviewResultPacket,
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revisions[revision - 1],
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-chapter-control-pack',
              workspaceId,
              revision: 3,
              facts: [scopedCanonFact, scopedPostCheckFact],
              entities: [],
            },
          })),
          projectNarrative: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-chapter-control-pack',
              workspaceId,
              revision: 3,
              units,
              clocks,
            },
          })),
          projectManuscripts: vi.fn(async () => ({
            ok: true,
            value: [recentManuscript],
          })),
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const reviewSelect = container.querySelector<HTMLSelectElement>(
        '[aria-label="审阅正文"]',
      )
      const chapterSelect = container.querySelector<HTMLSelectElement>(
        '[aria-label="章节控制包目标"]',
      )
      expect(reviewSelect?.textContent).not.toContain('chapter-2')
      expect(chapterSelect?.textContent).toContain('chapter-1')
      expect(chapterSelect?.textContent).toContain('chapter-2')
      expect(chapterSelect?.textContent).toContain('planned')
      await act(async () => {
        if (chapterSelect !== null) {
          chapterSelect.value = 'chapter-2'
          chapterSelect.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      expect(chapterSelect?.value).toBe('chapter-2')
      const build = container.querySelector<HTMLButtonElement>(
        '[data-build-chapter-control-pack]',
      )
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 3,
        chapterId: 'chapter-2',
      })
      const pack = container.querySelector('[data-chapter-control-pack]')
      expect(pack?.textContent).toContain('R3 · current')
      expect(pack?.textContent).toContain('sourceRevision: 3')
      expect(pack?.textContent).toContain('chapter-2 · planned')
      expect(pack?.textContent).toContain('寻找密道入口')
      const writingMemory = container.querySelector(
        '[data-chapter-writing-memory-character="shen-yan"]',
      )
      expect(writingMemory?.textContent).toContain('对守门人的戒心 · 追查月门的决定')
      expect(writingMemory?.textContent).toContain('chapter-1')
      expect(writingMemory?.textContent).toContain('post-check-chapter-1-r2')
      expect(writingMemory?.textContent).toContain(previousPostCheckAnchorId)
      expect(writingMemory?.textContent).toContain('chapter-reviewer')
      const characterArc = container.querySelector(
        '[data-chapter-writing-memory-character-arc="shen-yan"]',
      )
      expect(characterArc?.textContent).toContain('Character arc hypothesis v2')
      expect(characterArc?.textContent).toContain('沈砚会从独自控制风险，转向与顾临川共同承担。')
      expect(characterArc?.textContent).toContain('范围：book-main')
      expect(characterArc?.textContent).toContain('起始信念：只有独自承担才不会再次失去重要的人。')
      expect(characterArc?.textContent).toContain('目标转变：主动共享风险，并接受关系中的相互依赖。')
      expect(characterArc?.textContent).toContain('belief')
      expect(characterArc?.textContent).toContain('月门核心正在失控')
      expect(characterArc?.textContent).toContain('decision-return-for-ally')
      expect(characterArc?.textContent).toContain('event-return-for-gu-linchuan')
      expect(characterArc?.textContent).toContain('放弃抢先取得核心，折返断桥接应顾临川。')
      expect(characterArc?.textContent).toContain('独自夺取核心 · 封死断桥阻止追兵')
      expect(characterArc?.textContent).toContain('失去抢先控制月门核心的机会，并留下右肩灼伤。')
      expect(characterArc?.textContent).toContain('后续路线必须由两人共同决定。')
      expect(characterArc?.textContent).toContain('沈砚在高压下维持共同承担，而没有退回独自控制。')
      expect(characterArc?.textContent).toContain('当前阶段：在真实代价下维持共同承担')
      expect(characterArc?.textContent).toContain('当共同决定导致失败时，他是否仍会接受相互依赖？')
      expect(characterArc?.textContent).toContain('折返救援证明转变能够承受机会损失。')
      expect(characterArc?.textContent).toContain('character-arc-shen-yan-r2')
      expect(characterArc?.textContent).toContain(sourceAnchorIds[0])
      expect(characterArc?.textContent).toContain('chapter-planner')
      expect(characterArc?.textContent).toContain('chapter-control-pack-r2')
      const resolvedLock = container.querySelector(
        '[data-chapter-control-lock-resolved="clue:chapter-2:known-sign"]',
      )
      expect(resolvedLock?.textContent).toContain(
        'clue · chapter-2 · known-sign: 砖缝里的月形刻痕',
      )
      expect(resolvedLock?.textContent).toContain('clue-chapter-2-sign-r2')
      expect(resolvedLock?.textContent).toContain(sourceAnchorIds[0])
      expect(resolvedLock?.textContent).toContain('chapter-planner')
      const unavailableLock = container.querySelector(
        '[data-chapter-control-lock-unavailable="story-event:event-brother-identity:identity"]',
      )
      expect(unavailableLock?.textContent).toContain(
        'story-event · event-brother-identity · identity: 暗门后的声音属于失踪兄长',
      )
      expect(unavailableLock?.textContent).toContain('在 R3')
      expect([...container.querySelectorAll('[data-chapter-control-scene-beat]')]
        .map(item => item.getAttribute('data-chapter-control-scene-beat'))).toEqual([
        'scene-moon-gate',
        'beat-read-runes',
        'beat-test-key',
        'scene-open-door',
        'beat-cross-threshold',
      ])
      const scenePlan = container.querySelector(
        '[data-chapter-control-scene-beat="scene-moon-gate"]',
      )
      expect(scenePlan?.textContent).toContain('scene · scene-moon-gate · planned')
      expect(scenePlan?.textContent).toContain('确认月门机关')
      expect(scenePlan?.textContent).toContain('scene-moon-gate entry → scene-moon-gate exit')
      expect(scenePlan?.textContent).toContain('unit-scene-moon-gate-r2')
      expect(scenePlan?.textContent).toContain(sourceAnchorIds[0])
      const blockedBeat = container.querySelector(
        '[data-chapter-control-scene-beat="beat-test-key"]',
      )
      expect(blockedBeat?.textContent).toContain('beat · beat-test-key · blocked')
      const contract = container.querySelector('[data-chapter-contract]')
      expect(contract?.textContent).toContain('视角：沈砚')
      expect(contract?.textContent).toContain('故事时间: 归城第三日·子夜')
      expect([...container.querySelectorAll('[data-chapter-contract-scene-function]')]
        .map(item => item.textContent)).toEqual(['discovery', 'decision'])
      expect([...container.querySelectorAll('[data-chapter-contract-plot-line]')]
        .map(item => item.textContent)).toEqual(['plot-missing', 'plot-moon-gate'])
      expect([...container.querySelectorAll('[data-chapter-contract-relationship-line]')]
        .map(item => item.textContent)).toEqual([
        'relationship<->missing',
        'gatekeeper<->shen-yan',
      ])
      expect([...container.querySelectorAll('[data-chapter-contract-promise]')]
        .map(item => item.textContent)).toEqual([
        'promise-missing · hold',
        'promise-old-city · advance',
      ])
      const referenceResolution = container.querySelector('[data-chapter-reference-resolution]')
      expect(referenceResolution?.textContent).toContain('章节引用解析')
      expect([...container.querySelectorAll('[data-chapter-reference-plot-line]')]
        .map(item => item.getAttribute('data-chapter-reference-plot-line')))
        .toEqual(['plot-moon-gate'])
      expect(container.querySelector('[data-chapter-reference-plot-line="plot-moon-gate"]')?.textContent)
        .toContain('目标：找到月门密道入口')
      expect(container.querySelector('[data-chapter-reference-plot-line="plot-moon-gate"]')?.textContent)
        .toContain('anchor-chapter-control-pack-r2')
      expect([...container.querySelectorAll('[data-chapter-reference-plot-missing]')]
        .map(item => item.textContent)).toEqual(['plot-missing'])
      const relationshipReference = container.querySelector(
        '[data-chapter-reference-relationship-line="gatekeeper<->shen-yan"]',
      )
      expect(relationshipReference?.textContent).toContain('gatekeeper → shen-yan')
      expect(relationshipReference?.textContent).toContain('trust: cautious')
      expect(relationshipReference?.textContent).toContain('anchor-relationship-r1')
      expect(relationshipReference?.textContent).toContain('shen-yan → gatekeeper')
      expect(relationshipReference?.textContent).toContain('trust: earned')
      expect(relationshipReference?.textContent).toContain('anchor-chapter-control-pack-r2')
      const relationshipEmotionEpisodes = [
        ...container.querySelectorAll('[data-chapter-reference-relationship-emotion]'),
      ]
      expect(relationshipEmotionEpisodes.map(item => (
        item.getAttribute('data-chapter-reference-relationship-emotion')
      ))).toEqual(['emotion-mixed-relief', 'emotion-mixed-relief'])
      expect(relationshipEmotionEpisodes.map(item => (
        item.getAttribute('data-chapter-reference-relationship-emotion-occurrence')
      ))).toEqual(['0', '1'])
      expect(relationshipEmotionEpisodes[0]?.textContent).toContain(
        '触发：月门机关骤响后守门人伸手扶住沈砚',
      )
      expect(relationshipEmotionEpisodes[0]?.textContent).toContain(
        '混合情绪：惊惧 0.7 · 信任 0.5',
      )
      expect(relationshipEmotionEpisodes[0]?.textContent).toContain(
        '余留：对守门人的信任仍混着第二把钥匙的疑心',
      )
      expect(relationshipEmotionEpisodes[0]?.textContent).toContain(
        'R2 · emotion-mixed-relief-r2 · 出处锚点：anchor-chapter-control-pack-r2 · 生成者：chapter-planner',
      )
      expect(relationshipEmotionEpisodes[0]?.textContent).toContain('chapter-control-pack-r2')
      expect([...container.querySelectorAll('[data-chapter-reference-relationship-emotion-missing]')]
        .map(item => item.textContent)).toEqual([
        'emotion-future-relief · relationship-scene-mixed-relief · clock-scene-moon-gate-relationship-r2',
        'emotion-future-relief · relationship-scene-mixed-relief · clock-scene-moon-gate-relationship-r2',
      ])
      expect([...container.querySelectorAll('[data-chapter-reference-relationship-missing]')]
        .map(item => item.textContent)).toEqual(['relationship<->missing'])
      const promiseReference = container.querySelector(
        '[data-chapter-reference-promise="promise-old-city"]',
      )
      expect(promiseReference?.textContent).toContain('计划推进：advance')
      expect(promiseReference?.textContent).toContain('承诺 · v2 · major · mystery')
      expect(promiseReference?.textContent).toContain('旧城暗号将在月门前得到兑现')
      expect(promiseReference?.textContent).toContain('promise-old-city-state-r2')
      expect(promiseReference?.textContent).toContain('anchor-chapter-control-pack-r2')
      expect([...container.querySelectorAll('[data-chapter-reference-promise-missing]')]
        .map(item => item.textContent)).toEqual(['promise-missing · hold'])
      expect([...container.querySelectorAll('[data-chapter-contract-reader-fact]')]
        .map(item => item.textContent)).toEqual(['月形刻痕指向密道'])
      expect([...container.querySelectorAll('[data-chapter-contract-character-knowledge]')]
        .map(item => item.textContent)).toEqual(['shen-yan · 守门人隐瞒了第二把钥匙'])
      expect([...container.querySelectorAll('[data-chapter-contract-progression-setup]')]
        .map(item => item.textContent)).toEqual(['沈砚观察月门符文'])
      expect([...container.querySelectorAll('[data-chapter-contract-progression-payoff]')]
        .map(item => item.textContent)).toEqual(['识别旧庭暗号'])
      expect(contract?.textContent).toContain('情绪推进：戒备转为主动承担风险')
      expect(contract?.textContent).toContain('结局牵引：暗门打开后传来失踪兄长的声音')
      expect([...container.querySelectorAll('[data-chapter-contract-prohibited-contradiction]')]
        .map(item => item.textContent)).toEqual(['不得让守门人公开第二把钥匙'])
      expect([...container.querySelectorAll('[data-chapter-contract-style-constraint]')]
        .map(item => item.textContent)).toEqual(['近距离第三人称', '压低说明密度'])
      expect(contract?.textContent).toContain('字数范围: 2800–3600')
      expect([...container.querySelectorAll('[data-chapter-contract-acceptance-gate]')]
        .map(item => item.textContent)).toEqual([
        '至少完成一次实质发现',
        '结尾拉力来自新声音而非机械断句',
      ])
      const postCheck = container.querySelector('[data-post-chapter-check]')
      expect(postCheck?.textContent).toContain('合同评估: R1 · unit-chapter-2-r1 · met')
      expect(postCheck?.textContent).toContain('正文来源：R2')
      expect(postCheck?.textContent).toContain('偏差：实际结尾将兄长声音提前到暗门开启瞬间')
      expect([...container.querySelectorAll('[data-post-chapter-change]')]
        .map(item => item.textContent)).toEqual(['发现密道入口并确认第二把钥匙存在'])
      expect([...container.querySelectorAll('[data-post-chapter-cost]')]
        .map(item => item.textContent)).toEqual(['沈砚向守门人暴露自己识得月门符文'])
      expect([...container.querySelectorAll('[data-post-chapter-newly-possible]')]
        .map(item => item.textContent)).toEqual(['进入月门下层档案室'])
      expect([...container.querySelectorAll('[data-post-chapter-newly-impossible]')]
        .map(item => item.textContent)).toEqual(['继续假装不知道第二把钥匙'])
      expect([...container.querySelectorAll('[data-post-chapter-reader-knows]')]
        .map(item => item.textContent)).toEqual(['月形刻痕是密道坐标'])
      expect([...container.querySelectorAll('[data-post-chapter-reader-suspects]')]
        .map(item => item.textContent)).toEqual(['失踪兄长正在暗门后'])
      expect([...container.querySelectorAll('[data-post-chapter-character-carry]')]
        .map(item => item.textContent)).toEqual([
        'shen-yan · 对守门人的新疑心 · 进入档案室的决定',
        'gatekeeper · 第二把钥匙可能暴露的压力',
      ])
      const postCheckResolution = container.querySelector('[data-post-chapter-check-resolution]')
      expect(postCheckResolution?.textContent).toContain('章节后来源对照')
      const postCheckSource = container.querySelector('[data-post-chapter-check-source]')
      expect(postCheckSource?.textContent).toContain(
        'R3 · post-check-chapter-2-r3 · 出处锚点：anchor-post-chapter-check-r3 · 生成者：chapter-reviewer',
      )
      expect(postCheckSource?.textContent).toContain('post-check-chapter-2-r3')
      const contractLink = container.querySelector('[data-post-chapter-contract-link]')
      expect(contractLink?.textContent).toContain(
        'R1 · unit-chapter-2-r1 · 出处锚点：anchor-chapter-contract-r1 · 生成者：chapter-planner',
      )
      expect(contractLink?.textContent).toContain('chapter-contract-r1')
      const manuscriptLink = container.querySelector('[data-post-chapter-manuscript-link]')
      expect(manuscriptLink?.textContent).toContain('chapter-2 · R2 · 生成者：chapter-writer')
      expect(manuscriptLink?.textContent).toContain('"sourceId": "chapter-2"')
      expect([...postCheckResolution?.querySelectorAll('[data-post-chapter-debt-resolved]') ?? []]
        .map(item => item.getAttribute('data-post-chapter-debt-resolved'))).toEqual([
        'debt-created-chapter-2-r2',
        'debt-created-chapter-2-r2',
        'debt-paid-chapter-2-r2',
        'debt-retired-chapter-2-r2',
      ])
      expect([...postCheckResolution?.querySelectorAll('[data-post-chapter-debt-resolved]') ?? []][0]?.textContent)
        .toContain('anchor-debt-created-r2')
      expect([...postCheckResolution?.querySelectorAll('[data-post-chapter-debt-missing]') ?? []]
        .map(item => item.textContent)).toEqual([
        'advanced · plot · debt-future-after-post-check · debt-future-after-post-check-r4',
      ])
      const ambiguousTransition = postCheckResolution?.querySelector('[data-post-chapter-debt-ambiguous]')
      expect(ambiguousTransition?.textContent).toContain(
        'advanced · world · debt-moon-gate · debt-advanced-chapter-2-r2',
      )
      expect([...postCheckResolution?.querySelectorAll('[data-post-chapter-debt-candidate]') ?? []]
        .map(item => item.getAttribute('data-post-chapter-debt-candidate'))).toEqual([
        '1:debt-advanced-chapter-2-r2',
        '2:debt-advanced-chapter-2-r2',
      ])
      expect(ambiguousTransition?.textContent).toContain('anchor-debt-world-r1')
      expect(ambiguousTransition?.textContent).toContain('anchor-debt-world-r2')
      expect([...container.querySelectorAll('[data-post-chapter-debt-transition]')]
        .map(item => item.textContent)).toEqual([
        'created · plot · debt-voice-behind-door · debt-created-chapter-2-r2',
        'created · plot · debt-voice-behind-door · debt-created-chapter-2-r2',
        'advanced · world · debt-moon-gate · debt-advanced-chapter-2-r2',
        'paid · promise · debt-old-signal · debt-paid-chapter-2-r2',
        'retired · mystery · debt-false-tunnel · debt-retired-chapter-2-r2',
        'advanced · plot · debt-future-after-post-check · debt-future-after-post-check-r4',
      ])
      expect(postCheck?.textContent).toContain('anchor-post-chapter-check-r3')
      expect(postCheck?.textContent).toContain('chapter-reviewer')
      expect([...container.querySelectorAll('[data-chapter-control-scope-unit]')]
        .map(item => item.getAttribute('data-chapter-control-scope-unit'))).toEqual([
        'book-main',
        'volume-1',
        'arc-1',
        'chapter-2',
      ])
      expect(pack?.textContent).toContain('clue · chapter-2 · known-sign')
      expect(pack?.textContent).toContain('砖缝里的月形刻痕')
      expect(container.querySelectorAll('[data-chapter-control-clock]')).toHaveLength(10)
      expect(container.querySelector('[data-chapter-control-clock="plot"]')?.textContent)
        .toContain('chapter-2 · advance · 寻找密道入口')
      const recent = container.querySelector(
        '[data-chapter-control-recent-manuscript="chapter-1"]',
      )
      expect(recent?.textContent).toContain('第一章 归乡')
      expect(recent?.textContent).toContain('她回到旧庭。')
      expect(recent?.textContent).toContain('source R1')
      expect(recent?.textContent).toContain('chapter-writer')
      const previousCheck = container.querySelector(
        '[data-chapter-control-recent-post-check="chapter-1"]',
      )
      expect(previousCheck?.textContent).toContain('chapter-1 · 回到旧庭 · carry-forward')
      expect([...previousCheck?.querySelectorAll('[data-recent-post-chapter-change]') ?? []]
        .map(item => item.textContent)).toEqual(['第一章确认沈砚已经回到旧庭'])
      expect([...previousCheck?.querySelectorAll('[data-recent-post-chapter-cost]') ?? []]
        .map(item => item.textContent)).toEqual(['沈砚暴露了归城行踪'])
      expect([...previousCheck?.querySelectorAll('[data-recent-post-chapter-newly-possible]') ?? []]
        .map(item => item.textContent)).toEqual(['从旧庭追查月门暗号'])
      expect([...previousCheck?.querySelectorAll('[data-recent-post-chapter-newly-impossible]') ?? []]
        .map(item => item.textContent)).toEqual(['继续伪装仍在城外'])
      expect([...previousCheck?.querySelectorAll('[data-recent-post-chapter-reader-knows]') ?? []]
        .map(item => item.textContent)).toEqual(['沈砚已经进入旧庭'])
      expect([...previousCheck?.querySelectorAll('[data-recent-post-chapter-reader-suspects]') ?? []]
        .map(item => item.textContent)).toEqual(['守门人知道月门入口'])
      expect([...previousCheck?.querySelectorAll('[data-recent-post-chapter-character-carry]') ?? []]
        .map(item => item.textContent)).toEqual(['shen-yan · 对守门人的戒心 · 追查月门的决定'])
      expect(previousCheck?.textContent).toContain('post-check-chapter-1-r2')
      expect(previousCheck?.textContent).toContain('chapter-writer')
      expect(previousCheck?.textContent).toContain('debt-old-courtyard-return-r1')
      expect(previousCheck?.textContent).toContain(previousDebtAnchorId)
      expect(generateReviewDraft).not.toHaveBeenCalled()
      expect(previewReview).not.toHaveBeenCalled()
      expect(reviewResultPacket).not.toHaveBeenCalled()
      expect(rollbackRevision).not.toHaveBeenCalled()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('selects and renders rolling-roadmap dependency and debt resolution in the existing conversation view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-roadmap-resolution'
    const provenance = {
      taskId: 'task-roadmap-r4',
      sessionId: SESSION_ID,
      producer: 'roadmap-planner',
    } as const
    const baseUnit = {
      unitId: 'unit-base',
      order: 0,
      targetChapterStart: 6,
      targetChapterEnd: 6,
      milestone: '确认旧案记录被篡改',
      status: 'ready',
      dependsOnUnitIds: [],
      scopedDebtIds: [],
      changeRationale: null,
    } as const
    const nextUnit = {
      unitId: 'unit-next',
      order: 2,
      targetChapterStart: 8,
      targetChapterEnd: 9,
      milestone: '揭开月门记录并迫使守门人选择',
      status: 'planned',
      dependsOnUnitIds: ['unit-base', 'unit-missing', 'unit-duplicate', 'unit-duplicate'],
      scopedDebtIds: ['debt-plot', 'debt-missing', 'debt-cross-clock', 'debt-cross-clock'],
      changeRationale: '新证词需要第八章先完成核验。',
    } as const
    const duplicateA = {
      unitId: 'unit-duplicate',
      order: 3,
      targetChapterStart: 10,
      targetChapterEnd: 10,
      milestone: '第一条候选余波',
      status: 'candidate',
      dependsOnUnitIds: [],
      scopedDebtIds: [],
      changeRationale: null,
    } as const
    const duplicateB = {
      ...duplicateA,
      targetChapterStart: 11,
      targetChapterEnd: 11,
      milestone: '第二条候选余波',
    } as const
    const roadmapValue = {
      version: 2,
      detailedThroughUnitId: 'unit-next',
      horizonSummary: '细化到第九章，后续只保留月门余波方向。',
      units: [nextUnit, baseUnit, duplicateA, duplicateB],
    } as const
    const debtDelta = (
      id: string,
      targetId: string,
      clock: 'plot' | 'promise' | 'world',
      summary: string,
      sourceAnchorIds: readonly string[],
    ) => ({
      id,
      kind: 'narrative-debt' as const,
      operation: 'set' as const,
      targetId,
      unitId: 'chapter-8',
      field: clock,
      value: { summary, status: 'open' },
      sourceAnchorIds,
    })
    const resolvedDelta = debtDelta(
      'debt-plot-r4',
      'debt-plot',
      'plot',
      '让守门人对记录篡改作出选择',
      ['anchor-debt-plot-r4'],
    )
    const resolvedDebt = {
      id: 'debt-plot',
      unitId: 'chapter-8',
      clock: 'plot' as const,
      summary: '让守门人对记录篡改作出选择',
      status: 'open',
      sourceRevision: 4,
      sourceDeltaId: resolvedDelta.id,
      sourceAnchorIds: resolvedDelta.sourceAnchorIds,
      provenance,
      delta: resolvedDelta,
    }
    const promiseDelta = debtDelta(
      'debt-cross-promise-r3',
      'debt-cross-clock',
      'promise',
      '兑现月门前的承诺',
      ['anchor-debt-promise-r3'],
    )
    const worldDelta = debtDelta(
      'debt-cross-world-r4',
      'debt-cross-clock',
      'world',
      '解释月门开启的世界代价',
      ['anchor-debt-world-r4'],
    )
    const promiseDebt = {
      id: 'debt-cross-clock',
      unitId: 'chapter-7',
      clock: 'promise' as const,
      summary: promiseDelta.value.summary,
      status: 'open',
      sourceRevision: 3,
      sourceDeltaId: promiseDelta.id,
      sourceAnchorIds: promiseDelta.sourceAnchorIds,
      provenance: { ...provenance, producer: 'promise-planner' },
      delta: { ...promiseDelta, unitId: 'chapter-7' },
    }
    const worldDebt = {
      id: 'debt-cross-clock',
      unitId: 'chapter-8',
      clock: 'world' as const,
      summary: worldDelta.value.summary,
      status: 'open',
      sourceRevision: 4,
      sourceDeltaId: worldDelta.id,
      sourceAnchorIds: worldDelta.sourceAnchorIds,
      provenance: { ...provenance, producer: 'world-planner' },
      delta: worldDelta,
    }
    const resolution = {
      roadmapId: 'roadmap-secondary',
      value: roadmapValue,
      sourceRevision: 4,
      sourceDeltaId: 'roadmap-secondary-r4',
      sourceAnchorIds: ['anchor-roadmap-r4'],
      sourceRanges: [{
        anchorId: 'anchor-roadmap-r4',
        sourceId: 'outline/roadmap.md',
        start: 10,
        end: 90,
        contentHash: 'roadmap-hash-r4',
      }],
      provenance,
      orderedUnits: [{
        unit: baseUnit,
        dependsOnUnitIds: { resolved: [], missing: [], ambiguous: [] },
        scopedDebtIds: { resolved: [], missing: [], ambiguous: [] },
      }, {
        unit: nextUnit,
        dependsOnUnitIds: {
          resolved: [{ unitId: 'unit-base', unit: baseUnit }],
          missing: ['unit-missing'],
          ambiguous: [{
            unitId: 'unit-duplicate',
            candidates: [duplicateA, duplicateB],
          }, {
            unitId: 'unit-duplicate',
            candidates: [duplicateA, duplicateB],
          }],
        },
        scopedDebtIds: {
          resolved: [{
            debtId: 'debt-plot',
            debt: resolvedDebt,
            sourceRanges: [{
              anchorId: 'anchor-debt-plot-r4',
              sourceId: 'canon/debts.md',
              start: 100,
              end: 140,
              contentHash: 'debt-plot-hash',
            }],
          }],
          missing: ['debt-missing'],
          ambiguous: [{
            debtId: 'debt-cross-clock',
            candidates: [{
              debt: promiseDebt,
              sourceRanges: [{
                anchorId: 'anchor-debt-promise-r3',
                sourceId: 'canon/promises.md',
                start: 30,
                end: 60,
                contentHash: 'debt-promise-hash',
              }],
            }, {
              debt: worldDebt,
              sourceRanges: [{
                anchorId: 'anchor-debt-world-r4',
                sourceId: 'canon/world.md',
                start: 70,
                end: 110,
                contentHash: 'debt-world-hash',
              }],
            }],
          }, {
            debtId: 'debt-cross-clock',
            candidates: [{
              debt: promiseDebt,
              sourceRanges: [{
                anchorId: 'anchor-debt-promise-r3',
                sourceId: 'canon/promises.md',
                start: 30,
                end: 60,
                contentHash: 'debt-promise-hash',
              }],
            }, {
              debt: worldDebt,
              sourceRanges: [{
                anchorId: 'anchor-debt-world-r4',
                sourceId: 'canon/world.md',
                start: 70,
                end: 110,
                contentHash: 'debt-world-hash',
              }],
            }],
          }],
        },
      }, {
        unit: duplicateA,
        dependsOnUnitIds: { resolved: [], missing: [], ambiguous: [] },
        scopedDebtIds: { resolved: [], missing: [], ambiguous: [] },
      }, {
        unit: duplicateB,
        dependsOnUnitIds: { resolved: [], missing: [], ambiguous: [] },
        scopedDebtIds: { resolved: [], missing: [], ambiguous: [] },
      }],
    } as const
    const entity = (kind: 'roadmap' | 'world', targetId: string, fields: Record<string, unknown>) => ({
      kind,
      targetId,
      fields,
      fieldSources: {},
      sourceRevision: 4,
      sourceDeltaId: `${targetId}-r4`,
      sourceAnchorIds: ['anchor-roadmap-r4'],
      provenance,
    })
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-roadmap-resolution',
        workspaceId,
        revision: 4,
        headRevision: 4,
        freshness: 'current',
        hits: [],
        roadmapResolution: resolution,
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-roadmap-resolution',
              workspaceId,
              cwd: 'C:/novels/roadmap-resolution',
              acceptedRevision: 4,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          retrieve,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: {
              revision,
              parentRevision: revision - 1,
              packetId: `packet-roadmap-r${String(revision)}`,
              deltas: [],
              issues: [],
              decisions: [],
              sourceAnchors: [],
              provenance,
              authorization: {
                kind: 'author',
                actorId: 'author-1',
                decisionId: `decision-roadmap-r${String(revision)}`,
              },
            },
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-roadmap-resolution',
              workspaceId,
              revision: 4,
              facts: [],
              entities: [
                entity('roadmap', 'roadmap-main', { plan: { ...roadmapValue, version: 1 } }),
                entity('roadmap', 'roadmap-secondary', { plan: roadmapValue }),
                entity('roadmap', 'roadmap-without-plan', { summary: 'ignored' }),
                entity('world', 'world-with-plan', { plan: roadmapValue }),
              ],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const select = container.querySelector<HTMLSelectElement>(
        '[aria-label="滚动路线图 target"]',
      )
      expect(select?.textContent).toContain('roadmap-main')
      expect(select?.textContent).toContain('roadmap-secondary')
      expect(select?.textContent).not.toContain('roadmap-without-plan')
      expect(select?.textContent).not.toContain('world-with-plan')
      await act(async () => {
        if (select !== null) {
          select.value = 'roadmap-secondary'
          select.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-build-roadmap-resolution]')?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 4,
        canonKind: 'roadmap',
        canonTargetId: 'roadmap-secondary',
      })
      const article = container.querySelector('[data-roadmap-resolution]')
      expect(article?.textContent).toContain('滚动路线图 · R4 · v2')
      expect(article?.textContent).toContain('细化到：unit-next')
      expect(article?.textContent).toContain(roadmapValue.horizonSummary)
      expect(article?.textContent).toContain('roadmap-secondary-r4')
      expect(article?.textContent).toContain('anchor-roadmap-r4')
      expect(article?.textContent).toContain('roadmap-planner')
      expect(article?.textContent).toContain('outline/roadmap.md')
      expect([...container.querySelectorAll('[data-roadmap-unit]')]
        .map(item => item.getAttribute('data-roadmap-unit'))).toEqual([
        'unit-base',
        'unit-next',
        'unit-duplicate',
        'unit-duplicate',
      ])
      const next = container.querySelector('[data-roadmap-unit="unit-next"]')
      expect(next?.textContent).toContain('章节 8–9')
      expect(next?.textContent).toContain(nextUnit.milestone)
      expect(next?.textContent).toContain('状态：planned')
      expect(next?.textContent).toContain(nextUnit.changeRationale)
      expect([...next?.querySelectorAll('[data-roadmap-dependency-status]') ?? []]
        .map(item => item.getAttribute('data-roadmap-dependency-status'))).toEqual([
        'resolved',
        'missing',
        'ambiguous',
        'ambiguous',
      ])
      expect(next?.textContent).toContain('unit-missing')
      expect(next?.textContent).toContain('第一条候选余波')
      expect(next?.textContent).toContain('第二条候选余波')
      expect([...next?.querySelectorAll('[data-roadmap-debt-status]') ?? []]
        .map(item => item.getAttribute('data-roadmap-debt-status'))).toEqual([
        'resolved',
        'missing',
        'ambiguous',
        'ambiguous',
      ])
      expect(next?.textContent).toContain('debt-plot · plot · chapter-8')
      expect(next?.textContent).toContain(resolvedDebt.summary)
      expect(next?.textContent).toContain('anchor-debt-plot-r4')
      expect(next?.textContent).toContain('debt-plot-r4')
      expect(next?.textContent).toContain('canon/debts.md')
      expect(next?.textContent).toContain('debt-missing')
      expect(next?.textContent).toContain('promise · chapter-7')
      expect(next?.textContent).toContain('world · chapter-8')
      expect(next?.textContent).toContain('anchor-debt-promise-r3')
      expect(next?.textContent).toContain('anchor-debt-world-r4')
      expect(next?.textContent).toContain('debt-cross-promise-r3')
      expect(next?.textContent).toContain('debt-cross-world-r4')
      expect(next?.textContent).toContain('promise-planner')
      expect(next?.textContent).toContain('world-planner')
      expect(next?.querySelectorAll('[data-roadmap-dependency-candidate]')).toHaveLength(4)
      expect(next?.querySelectorAll('[data-roadmap-debt-candidate]')).toHaveLength(4)
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders one strict knowledge state in the existing Canon and knowledge boundary views', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-knowledge-boundary'
    const provenance = {
      taskId: 'task-knowledge-boundary-r2',
      sessionId: SESSION_ID,
      producer: 'knowledge-planner',
    } as const
    const sourceAnchorIds = ['anchor-knowledge-boundary-r2'] as const
    const canonFact = (
      kind: 'knowledge' | 'clue' | 'story-event',
      targetId: string,
      field: string,
      value: unknown,
      sourceDeltaId: string,
    ) => ({
      kind,
      targetId,
      field,
      value,
      sourceRevision: 2,
      sourceDeltaId,
      sourceAnchorIds,
      provenance,
    })
    const aliceClueState = {
      version: 2,
      subjectKind: 'character',
      beliefStatus: 'known',
      memoryStatus: 'recalled',
      belief: '铜钥匙配合月蚀才能开启月门',
      truthAlignment: 'accurate',
      access: {
        mode: 'remembered',
        unitId: 'chapter-knowledge-2',
        viewpointId: 'alice',
        viewpointAccess: 'direct',
      },
      revisionRationale: '钥匙凹槽与旧卷宗让爱丽丝修正了开启条件',
    } as const
    const aliceEventState = {
      version: 1,
      subjectKind: 'character',
      beliefStatus: 'known',
      memoryStatus: 'retained',
      belief: '北塔警钟已经响起',
      truthAlignment: 'accurate',
      access: {
        mode: 'observed',
        unitId: 'chapter-knowledge-1',
        viewpointId: 'alice',
        viewpointAccess: 'direct',
      },
      revisionRationale: null,
    } as const
    const bobClueState = {
      version: 1,
      subjectKind: 'character',
      beliefStatus: 'suspected',
      memoryStatus: 'retained',
      belief: '铜钥匙可能与月门有关',
      truthAlignment: 'unverified',
      access: {
        mode: 'told',
        unitId: 'chapter-knowledge-2',
        viewpointId: 'bob',
        viewpointAccess: 'reported',
      },
      revisionRationale: null,
    } as const
    const aliceClue = canonFact(
      'knowledge',
      'alice->clue-a',
      'state',
      aliceClueState,
      'knowledge-alice-clue-state-r2',
    )
    const aliceEvent = canonFact(
      'knowledge',
      'alice->event-b',
      'state',
      aliceEventState,
      'knowledge-alice-event-state-r2',
    )
    const bobClue = canonFact(
      'knowledge',
      'bob->clue-a',
      'state',
      bobClueState,
      'knowledge-bob-clue-state-r2',
    )
    const clueSummary = canonFact(
      'clue',
      'clue-a',
      'summary',
      '铜钥匙刻有月门徽记',
      'clue-a-summary-r2',
    )
    const eventSummary = canonFact(
      'story-event',
      'event-b',
      'summary',
      '北塔警钟响起',
      'event-b-summary-r2',
    )
    const sourceRange = (sourceId: string, start: number) => ({
      anchorId: sourceAnchorIds[0],
      sourceId,
      start,
      end: start + 8,
      contentHash: sourceId === 'chapter-clue-r2' ? 'a'.repeat(64) : 'b'.repeat(64),
    })
    const knowledgeBoundary = {
      subjectId: 'alice',
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      entries: [{
        factId: 'clue-a',
        knowledgeFields: [{
          fact: aliceClue,
          sourceRanges: [sourceRange('chapter-knowledge-r2', 0)],
        }],
        factFields: [{
          fact: clueSummary,
          sourceRanges: [sourceRange('chapter-clue-r2', 10)],
        }],
      }, {
        factId: 'event-b',
        knowledgeFields: [{
          fact: aliceEvent,
          sourceRanges: [sourceRange('chapter-knowledge-r2', 20)],
        }],
        factFields: [{
          fact: eventSummary,
          sourceRanges: [sourceRange('chapter-event-r2', 30)],
        }],
      }],
    } as const
    const revisions = [1, 2].map(revision => ({
      revision,
      parentRevision: revision - 1,
      packetId: `packet-knowledge-boundary-r${String(revision)}`,
      manuscript: {
        unitId: 'chapter-knowledge',
        title: '知情边界',
        text: `角色所知 R${String(revision)}`,
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance,
      authorization: {
        kind: 'author' as const,
        actorId: 'author-1',
        decisionId: `decision-knowledge-boundary-r${String(revision)}`,
      },
    }))
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-knowledge-boundary',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        knowledgeBoundary,
      },
    } as const))
    const generateReviewDraft = vi.fn()
    const previewReview = vi.fn()
    const reviewResultPacket = vi.fn()
    const rollbackRevision = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-knowledge-boundary',
              workspaceId,
              cwd: 'C:/novels/knowledge-boundary',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft,
          previewReview,
          retrieve,
          reviewResultPacket,
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revisions[revision - 1],
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-knowledge-boundary',
              workspaceId,
              revision: 2,
              facts: [aliceClue, aliceEvent, bobClue, clueSummary, eventSummary],
              entities: [aliceClue, aliceEvent, bobClue, clueSummary, eventSummary].map(fact => ({
                kind: fact.kind,
                targetId: fact.targetId,
                fields: { [fact.field]: fact.value },
                fieldSources: {},
                sourceRevision: fact.sourceRevision,
                sourceDeltaId: fact.sourceDeltaId,
                sourceAnchorIds: fact.sourceAnchorIds,
                provenance: fact.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const subject = container.querySelector<HTMLSelectElement>(
        '[aria-label="Knowledge boundary subject"]',
      )
      expect([...subject?.options ?? []].map(option => option.value)).toEqual(['alice', 'bob'])
      await act(async () => {
        if (subject !== null) {
          subject.value = 'alice'
          subject.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      const build = container.querySelector<HTMLButtonElement>(
        '[data-build-knowledge-boundary]',
      )
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        knowledgeSubjectId: 'alice',
      })
      const ledger = container.querySelector('[data-knowledge-boundary-ledger]')
      expect(ledger?.textContent).toContain('R2 · head R2 · current')
      expect(ledger?.textContent).toContain('对象：alice')
      const clue = container.querySelector('[data-knowledge-boundary-entry="clue-a"]')
      const canonState = container.querySelector(
        '[data-canon-entity="knowledge:alice->clue-a"] [data-knowledge-state="alice->clue-a"]',
      )
      expect(canonState).not.toBeNull()
      expect(canonState?.textContent).toContain('character · known · recalled · accurate')
      expect(canonState?.textContent).toContain(aliceClueState.belief)
      const boundaryState = clue?.querySelector('[data-knowledge-state="alice->clue-a"]')
      expect(boundaryState).not.toBeNull()
      expect(boundaryState?.textContent).toContain('character · known · recalled · accurate')
      expect(boundaryState?.querySelector('[data-knowledge-access]')?.textContent)
        .toContain('remembered · chapter-knowledge-2 · direct · viewpoint alice')
      expect(boundaryState?.querySelector('[data-knowledge-rationale]')?.textContent)
        .toContain(aliceClueState.revisionRationale)
      expect(clue?.textContent).toContain('summary: 铜钥匙刻有月门徽记')
      expect(clue?.textContent).toContain('knowledge-alice-clue-state-r2')
      expect(clue?.textContent).toContain('clue-a-summary-r2')
      expect(clue?.textContent).toContain('anchor-knowledge-boundary-r2')
      expect(clue?.textContent).toContain('chapter-knowledge-r2')
      expect(clue?.textContent).toContain('chapter-clue-r2')
      expect(clue?.textContent).toContain('knowledge-planner')
      const event = container.querySelector('[data-knowledge-boundary-entry="event-b"]')
      expect(event?.querySelector('[data-knowledge-state="alice->event-b"]')?.textContent)
        .toContain('character · known · retained · accurate')
      expect(event?.textContent).toContain('summary: 北塔警钟响起')
      expect(ledger?.textContent).not.toContain('bob')
      expect(generateReviewDraft).not.toHaveBeenCalled()
      expect(previewReview).not.toHaveBeenCalled()
      expect(reviewResultPacket).not.toHaveBeenCalled()
      expect(rollbackRevision).not.toHaveBeenCalled()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds one participant accepted story-time ledger in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-participant-timeline'
    const provenance = {
      taskId: 'task-participant-timeline-r2',
      sessionId: SESSION_ID,
      producer: 'timeline-planner',
    } as const
    const sourceAnchorIds = ['anchor-participant-timeline-r2'] as const
    const eventValue = (
      label: string,
      startOrder: number,
      manuscriptOrder: number,
      participants: readonly string[],
      location: string,
      effects: readonly { readonly targetId: string; readonly type: string; readonly value: string }[],
      endOrder?: number,
    ) => ({
      storyTime: {
        startOrder,
        ...(endOrder === undefined ? {} : { endOrder }),
        label,
      },
      manuscriptOrder,
      participants,
      location,
      effects,
    })
    const earlyValue = eventValue(
      '第一日清晨',
      10,
      2,
      ['character-a', 'character-b'],
      '旧庭',
      [{ targetId: 'character-b', type: 'knowledge', value: '发现铜钥匙' }],
      20,
    )
    const lateValue = eventValue(
      '第一日正午',
      20,
      1,
      ['character-b'],
      '北塔',
      [{ targetId: 'character-b', type: 'emotion', value: '警觉' }],
      21,
    )
    const unrelatedValue = eventValue(
      '第一日黄昏',
      30,
      3,
      ['character-a'],
      '城门',
      [{ targetId: 'character-a', type: 'world', value: '离城' }],
    )
    const canonEvent = (
      eventId: string,
      value: ReturnType<typeof eventValue>,
      sourceDeltaId: string,
    ) => ({
      kind: 'story-event' as const,
      targetId: eventId,
      field: 'event',
      value,
      sourceRevision: 2,
      sourceDeltaId,
      sourceAnchorIds,
      provenance,
    })
    const acceptedEvents = [
      canonEvent('event-early', earlyValue, 'story-event-early-r2'),
      canonEvent('event-late', lateValue, 'story-event-late-r2'),
      canonEvent('event-unrelated', unrelatedValue, 'story-event-unrelated-r2'),
    ] as const
    const sourceRange = (start: number) => ({
      anchorId: sourceAnchorIds[0],
      sourceId: 'chapter-participant-timeline-r2',
      start,
      end: start + 12,
      contentHash: 'a'.repeat(64),
    })
    const earlyTimelineEvent = {
      eventId: 'event-early',
      event: earlyValue,
      sourceRevision: 1,
      sourceDeltaId: 'story-event-early-r1',
      sourceAnchorIds: ['anchor-participant-timeline-r1'],
      sourceRanges: [sourceRange(0)],
      provenance: {
        taskId: 'task-participant-timeline-r1',
        sessionId: SESSION_ID,
        producer: 'timeline-writer',
      },
    } as const
    const lateTimelineEvent = {
      eventId: 'event-late',
      event: lateValue,
      sourceRevision: 2,
      sourceDeltaId: 'story-event-late-r2',
      sourceAnchorIds,
      sourceRanges: [sourceRange(20)],
      provenance,
    } as const
    const timeline = {
      participantId: 'character-b',
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      events: [earlyTimelineEvent, lateTimelineEvent],
      locationConflicts: [{
        overlapStartOrder: 20,
        overlapEndOrder: 20,
        first: earlyTimelineEvent,
        second: lateTimelineEvent,
      }],
    } as const
    const noConflictTimeline = {
      ...timeline,
      participantId: 'character-a',
      events: [earlyTimelineEvent],
      locationConflicts: [],
    } as const
    const revisions = [1, 2].map(revision => ({
      revision,
      parentRevision: revision - 1,
      packetId: `packet-participant-timeline-r${String(revision)}`,
      manuscript: {
        unitId: 'chapter-participant-timeline',
        title: '人物时间线',
        text: `人物事件 R${String(revision)}`,
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance,
      authorization: {
        kind: 'author' as const,
        actorId: 'author-1',
        decisionId: `decision-participant-timeline-r${String(revision)}`,
      },
    }))
    const retrieve = vi.fn(async (_id: unknown, query: { readonly timelineParticipantId: string }) => ({
      ok: true,
      value: {
        projectId: 'project-participant-timeline',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        timeline: query.timelineParticipantId === 'character-b' ? timeline : noConflictTimeline,
      },
    } as const))
    const generateReviewDraft = vi.fn()
    const previewReview = vi.fn()
    const reviewResultPacket = vi.fn()
    const rollbackRevision = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-participant-timeline',
              workspaceId,
              cwd: 'C:/novels/participant-timeline',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft,
          previewReview,
          retrieve,
          reviewResultPacket,
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revisions[revision - 1],
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-participant-timeline',
              workspaceId,
              revision: 2,
              facts: acceptedEvents,
              entities: acceptedEvents.map(fact => ({
                kind: fact.kind,
                targetId: fact.targetId,
                fields: { event: fact.value },
                fieldSources: {},
                sourceRevision: fact.sourceRevision,
                sourceDeltaId: fact.sourceDeltaId,
                sourceAnchorIds: fact.sourceAnchorIds,
                provenance: fact.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const participant = container.querySelector<HTMLSelectElement>(
        '[aria-label="故事时间线参与者"]',
      )
      expect([...participant?.options ?? []].map(option => option.value)).toEqual([
        'character-a',
        'character-b',
      ])
      await act(async () => {
        if (participant !== null) {
          participant.value = 'character-b'
          participant.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      const build = container.querySelector<HTMLButtonElement>(
        '[data-build-story-timeline]',
      )
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        timelineParticipantId: 'character-b',
      })
      const ledger = container.querySelector('[data-story-timeline-ledger]')
      expect(ledger?.textContent).toContain('R2 · head R2 · current')
      expect(ledger?.textContent).toContain('参与者：character-b')
      expect([...container.querySelectorAll('[data-story-timeline-event]')]
        .map(item => item.getAttribute('data-story-timeline-event'))).toEqual([
        'event-early',
        'event-late',
      ])
      const early = container.querySelector('[data-story-timeline-event="event-early"]')
      expect(early?.textContent).toContain('第一日清晨 · 10 → 20')
      expect(early?.textContent).toContain('正文顺序：2')
      expect(early?.textContent).toContain('参与者：character-a, character-b')
      expect(early?.textContent).toContain('地点：旧庭')
      expect(early?.textContent).toContain('发现铜钥匙')
      expect(early?.textContent).toContain('R1 · story-event-early-r1')
      expect(early?.textContent).toContain('anchor-participant-timeline-r1')
      expect(early?.textContent).toContain('chapter-participant-timeline-r2')
      expect(early?.textContent).toContain('timeline-writer')
      const late = container.querySelector('[data-story-timeline-event="event-late"]')
      expect(late?.textContent).toContain('第一日正午 · 20 → 21')
      expect(late?.textContent).toContain('警觉')
      expect(ledger?.textContent).toContain('连续性冲突')
      const conflict = container.querySelector(
        '[data-story-timeline-location-conflict="event-early:event-late"]',
      )
      expect(conflict?.textContent).toContain('重叠：20')
      expect(conflict?.textContent).toContain('event-early · 旧庭 · 10 → 20')
      expect(conflict?.textContent).toContain('event-late · 北塔 · 20 → 21')
      expect(conflict?.textContent).toContain('R1 · story-event-early-r1')
      expect(conflict?.textContent).toContain('R2 · story-event-late-r2')
      expect(ledger?.textContent).not.toContain('event-unrelated')

      await act(async () => {
        if (participant !== null) {
          participant.value = 'character-a'
          participant.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-build-story-timeline]')?.click()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(retrieve).toHaveBeenCalledTimes(2)
      expect(retrieve).toHaveBeenLastCalledWith(workspaceId, {
        revision: 2,
        timelineParticipantId: 'character-a',
      })
      expect(container.querySelector('[data-story-timeline-ledger]')?.textContent)
        .toContain('无重叠地点冲突')
      expect(container.querySelector('[data-story-timeline-location-conflict]')).toBeNull()
      expect(generateReviewDraft).not.toHaveBeenCalled()
      expect(previewReview).not.toHaveBeenCalled()
      expect(reviewResultPacket).not.toHaveBeenCalled()
      expect(rollbackRevision).not.toHaveBeenCalled()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds one accepted character state trajectory in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-character-trajectory'
    const provenanceR1 = {
      taskId: 'task-character-trajectory-r1',
      sessionId: SESSION_ID,
      producer: 'character-planner-r1',
    } as const
    const provenanceR2 = {
      taskId: 'task-character-trajectory-r2',
      sessionId: SESSION_ID,
      producer: 'character-planner-r2',
    } as const
    const sourceRange = (revision: number, start: number) => ({
      anchorId: `anchor-character-trajectory-r${String(revision)}`,
      sourceId: `chapter-character-trajectory-r${String(revision)}`,
      start,
      end: start + 12,
      contentHash: (revision === 1 ? 'a' : 'b').repeat(64),
    })
    const fact = (
      field: string,
      value: unknown,
      revision: number,
      deltaId: string,
    ) => ({
      kind: 'character-state' as const,
      targetId: 'character-a',
      field,
      value,
      sourceRevision: revision,
      sourceDeltaId: deltaId,
      sourceAnchorIds: [`anchor-character-trajectory-r${String(revision)}`],
      provenance: revision === 1 ? provenanceR1 : provenanceR2,
    })
    const arcR1Value = {
      version: 1,
      scopeUnitId: 'book-main',
      hypothesis: '沈砚会从独自背负秘密，转向愿意与可信盟友共同承担责任。',
      startingBelief: '只有独自承担才不会再次失去重要的人。',
      targetTransformation: '主动共享风险，并接受关系中的相互依赖。',
      transformationDimensions: ['belief', 'strategy', 'relationship'],
      pressures: ['月门真相只能由两人共同解开', '顾临川可能再次离开'],
      decisionChain: [],
      currentStage: '以孤立换取控制感',
      unresolvedQuestion: '他能否在失控前主动求助？',
      changeRationale: null,
    } as const
    const arcR2Value = {
      ...arcR1Value,
      version: 2,
      decisionChain: [{
        decisionId: 'decision-share-map',
        storyEventId: 'event-share-moon-gate-map',
        pressure: '独自进入月门会失去唯一的回程坐标。',
        choice: '把月门地图交给顾临川并邀请他同行。',
        rejectedAlternatives: ['隐瞒地图独自进入', '销毁地图终止调查'],
        cost: '承认自己无法独自完成调查，也把弱点交给了顾临川。',
        persistentConsequence: '顾临川获得共同决定路线的权利。',
        transformationEvidence: '沈砚第一次在行动前主动共享关键信息。',
      }],
      currentStage: '开始用共同决策替代单独控制',
      unresolvedQuestion: '当顾临川反对他的方案时，他会不会重新封闭？',
      changeRationale: '第二章已接受的地图共享决定提供了第一项转变证据。',
    } as const
    const r1Arc = {
      fact: fact('arc-hypothesis', arcR1Value, 1, 'character-a-arc-r1'),
      sourceRanges: [sourceRange(1, 40)],
    } as const
    const r1Goal = {
      fact: fact('goal', '寻找月门', 1, 'character-a-goal-r1'),
      sourceRanges: [sourceRange(1, 0)],
    } as const
    const r1Injury = {
      fact: fact('injury', '左臂旧伤', 1, 'character-a-injury-r1'),
      sourceRanges: [sourceRange(1, 20)],
    } as const
    const r2Goal = {
      fact: fact('goal', '进入月门遗迹', 2, 'character-a-goal-r2'),
      sourceRanges: [sourceRange(2, 0)],
    } as const
    const r2Arc = {
      fact: fact('arc-hypothesis', arcR2Value, 2, 'character-a-arc-r2'),
      sourceRanges: [sourceRange(2, 40)],
    } as const
    const acceptedDelta = (
      id: string,
      operation: 'set' | 'remove',
      field: string,
      value: unknown,
    ) => ({
      id,
      kind: 'character-state' as const,
      operation,
      targetId: 'character-a',
      field,
      value,
      sourceAnchorIds: ['anchor-character-trajectory-r2'],
    })
    const characterTrajectory = {
      characterId: 'character-a',
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      entries: [{
        revision: 1,
        packetId: 'packet-character-trajectory-r1',
        provenance: provenanceR1,
        fields: [r1Arc, r1Goal, r1Injury],
        changes: [{
          field: 'arc-hypothesis',
          after: r1Arc,
          acceptedDeltaSourceRanges: [sourceRange(1, 40)],
        }, {
          field: 'goal',
          after: r1Goal,
          acceptedDeltaSourceRanges: [sourceRange(1, 0)],
        }, {
          field: 'injury',
          after: r1Injury,
          acceptedDeltaSourceRanges: [sourceRange(1, 20)],
        }],
      }, {
        revision: 2,
        packetId: 'packet-character-trajectory-r2',
        provenance: provenanceR2,
        fields: [r2Arc, r2Goal],
        changes: [{
          field: 'arc-hypothesis',
          before: r1Arc,
          after: r2Arc,
          acceptedDelta: acceptedDelta(
            'character-a-arc-r2',
            'set',
            'arc-hypothesis',
            arcR2Value,
          ),
          acceptedDeltaSourceRanges: [sourceRange(2, 40)],
        }, {
          field: 'goal',
          before: r1Goal,
          after: r2Goal,
          acceptedDelta: acceptedDelta(
            'character-a-goal-r2',
            'set',
            'goal',
            '进入月门遗迹',
          ),
          acceptedDeltaSourceRanges: [sourceRange(2, 0)],
        }, {
          field: 'injury',
          before: r1Injury,
          acceptedDelta: acceptedDelta(
            'character-a-injury-r2',
            'remove',
            'injury',
            null,
          ),
          acceptedDeltaSourceRanges: [sourceRange(2, 20)],
        }],
      }],
    } as const
    const currentFacts = [
      r2Arc.fact,
      r2Goal.fact,
      {
        kind: 'character-state' as const,
        targetId: 'character-b',
        field: 'goal',
        value: '留守北塔',
        sourceRevision: 1,
        sourceDeltaId: 'character-b-goal-r1',
        sourceAnchorIds: ['anchor-character-trajectory-r1'],
        provenance: provenanceR1,
      },
    ] as const
    const revisions = [1, 2].map(revision => ({
      revision,
      parentRevision: revision - 1,
      packetId: `packet-character-trajectory-r${String(revision)}`,
      manuscript: {
        unitId: 'chapter-character-trajectory',
        title: '人物轨迹',
        text: `人物状态 R${String(revision)}`,
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance: revision === 1 ? provenanceR1 : provenanceR2,
      authorization: {
        kind: 'author' as const,
        actorId: 'author-1',
        decisionId: `decision-character-trajectory-r${String(revision)}`,
      },
    }))
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-character-trajectory',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        characterTrajectory,
      },
    } as const))
    const generateReviewDraft = vi.fn()
    const previewReview = vi.fn()
    const reviewResultPacket = vi.fn()
    const rollbackRevision = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-character-trajectory',
              workspaceId,
              cwd: 'C:/novels/character-trajectory',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft,
          previewReview,
          retrieve,
          reviewResultPacket,
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revisions[revision - 1],
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-character-trajectory',
              workspaceId,
              revision: 2,
              facts: currentFacts,
              entities: currentFacts.map(current => ({
                kind: current.kind,
                targetId: current.targetId,
                fields: { [current.field]: current.value },
                fieldSources: {},
                sourceRevision: current.sourceRevision,
                sourceDeltaId: current.sourceDeltaId,
                sourceAnchorIds: current.sourceAnchorIds,
                provenance: current.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const target = container.querySelector<HTMLSelectElement>(
        '[aria-label="Character trajectory target"]',
      )
      expect([...target?.options ?? []].map(option => option.value)).toEqual([
        'character-a',
        'character-b',
      ])
      await act(async () => {
        if (target !== null) {
          target.value = 'character-a'
          target.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      const build = container.querySelector<HTMLButtonElement>(
        '[data-build-character-trajectory]',
      )
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        characterTrajectoryId: 'character-a',
      })
      const trajectory = container.querySelector('[data-character-trajectory]')
      expect(trajectory?.textContent).toContain('R2 · head R2 · current')
      expect(trajectory?.textContent).toContain('人物：character-a')
      expect([...container.querySelectorAll('[data-character-trajectory-entry]')]
        .map(item => item.getAttribute('data-character-trajectory-entry'))).toEqual(['1', '2'])
      const r1Entry = container.querySelector('[data-character-trajectory-entry="1"]')
      expect(r1Entry?.textContent).toContain('packet-character-trajectory-r1')
      expect(r1Entry?.textContent).toContain('goal: 寻找月门')
      expect(r1Entry?.textContent).toContain('injury: 左臂旧伤')
      expect(r1Entry?.textContent).toContain('anchor-character-trajectory-r1')
      expect(r1Entry?.textContent).toContain('chapter-character-trajectory-r1')
      expect(r1Entry?.textContent).toContain('character-planner-r1')
      const goalChange = container.querySelector(
        '[data-character-trajectory-change="2:goal"]',
      )
      expect(goalChange?.textContent).toContain('之前：寻找月门')
      expect(goalChange?.textContent).toContain('之后：进入月门遗迹')
      expect(goalChange?.textContent).toContain('character-a-goal-r2')
      expect(goalChange?.textContent).toContain('anchor-character-trajectory-r2')
      expect(goalChange?.textContent).toContain('chapter-character-trajectory-r2')
      expect(goalChange?.textContent).toContain('character-planner-r2')
      const injuryChange = container.querySelector(
        '[data-character-trajectory-change="2:injury"]',
      )
      expect(injuryChange?.textContent).toContain('之前：左臂旧伤')
      expect(injuryChange?.textContent).toContain('之后：已移除')
      expect(injuryChange?.textContent).toContain('remove')
      const arcR1 = container.querySelector('[data-character-arc-hypothesis="1"]')
      expect(arcR1?.textContent).toContain(arcR1Value.hypothesis)
      expect(arcR1?.textContent).toContain(arcR1Value.startingBelief)
      expect(arcR1?.textContent).toContain(arcR1Value.targetTransformation)
      expect([...arcR1?.querySelectorAll('[data-character-arc-target]') ?? []]
        .map(item => item.getAttribute('data-character-arc-target'))).toEqual([
        'belief',
        'strategy',
        'relationship',
      ])
      expect([...arcR1?.querySelectorAll('[data-character-arc-pressure]') ?? []]
        .map(item => item.textContent)).toEqual(arcR1Value.pressures)
      expect(arcR1?.textContent).toContain(arcR1Value.currentStage)
      expect(arcR1?.textContent).toContain('暂无已接受的人物弧决定')
      const arcR2 = container.querySelector('[data-character-arc-hypothesis="2"]')
      expect(arcR2?.textContent).toContain(arcR2Value.currentStage)
      expect(arcR2?.textContent).toContain(arcR2Value.unresolvedQuestion)
      expect(arcR2?.textContent).toContain(arcR2Value.changeRationale)
      expect(arcR2?.textContent).toContain('character-a-arc-r2')
      expect(arcR2?.textContent).toContain('anchor-character-trajectory-r2')
      expect(arcR2?.textContent).toContain('chapter-character-trajectory-r2')
      expect(arcR2?.textContent).toContain('character-planner-r2')
      const arcDecision = container.querySelector(
        '[data-character-arc-decision="2:decision-share-map"]',
      )
      expect(arcDecision?.textContent).toContain('event-share-moon-gate-map')
      expect(arcDecision?.textContent).toContain(arcR2Value.decisionChain[0].pressure)
      expect(arcDecision?.textContent).toContain(arcR2Value.decisionChain[0].choice)
      expect(arcDecision?.textContent).toContain('隐瞒地图独自进入 · 销毁地图终止调查')
      expect(arcDecision?.textContent).toContain(arcR2Value.decisionChain[0].cost)
      expect(arcDecision?.textContent).toContain(arcR2Value.decisionChain[0].persistentConsequence)
      const arcUpdate = container.querySelector(
        '[data-character-arc-update="2:decision-share-map"]',
      )
      expect(arcUpdate?.textContent).toContain(arcR2Value.decisionChain[0].transformationEvidence)
      expect(trajectory?.textContent).not.toContain('留守北塔')
      expect(generateReviewDraft).not.toHaveBeenCalled()
      expect(previewReview).not.toHaveBeenCalled()
      expect(reviewResultPacket).not.toHaveBeenCalled()
      expect(rollbackRevision).not.toHaveBeenCalled()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders one strict clue state in the existing Canon and clue lifecycle views', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-clue-lifecycle'
    const provenance = (revision: number) => ({
      taskId: `task-clue-lifecycle-r${String(revision)}`,
      sessionId: SESSION_ID,
      producer: `clue-editor-r${String(revision)}`,
    } as const)
    const sourceRange = (revision: number, start: number) => ({
      anchorId: `anchor-clue-lifecycle-r${String(revision)}`,
      sourceId: `chapter-clue-lifecycle-r${String(revision)}`,
      start,
      end: start + 10,
      contentHash: String(revision).repeat(64),
    })
    const fact = (
      field: string,
      value: unknown,
      revision: number,
      deltaId: string,
    ) => ({
      kind: 'clue' as const,
      targetId: 'clue-moon-gate',
      field,
      value,
      sourceRevision: revision,
      sourceDeltaId: deltaId,
      sourceAnchorIds: [`anchor-clue-lifecycle-r${String(revision)}`],
      provenance: provenance(revision),
    })
    const plantedState = {
      version: 1,
      role: 'foreshadowing',
      statement: '月门只在满月开启',
      linkedMysteryIds: ['mystery-moon-gate'],
      status: 'planted',
      readerVisibility: 'available',
      intendedFunction: '让读者先接受满月规则，再为月蚀真相制造重解释空间',
      expectedPayoffWindow: 'chapter-8..chapter-10',
      payoff: null,
      abandonmentReason: null,
      revisionRationale: null,
    } as const
    const paidOffState = {
      ...plantedState,
      version: 2,
      role: 'foreshadowing',
      statement: '满月规则是守门人的误导，月门实际响应月蚀',
      status: 'paid-off',
      readerVisibility: 'resolved',
      payoff: {
        unitId: 'chapter-8',
        kind: 'reinterpretation',
        description: '旧卷宗让既有满月线索转化为守门人的误导证据',
        aftermath: '沈砚开始追查月蚀周期以及守门人为何撒谎',
      },
      revisionRationale: '用旧卷宗完成对满月规则的重解释',
    } as const
    const r1Summary = {
      fact: fact('summary', '月门只在满月开启', 1, 'clue-summary-r1'),
      sourceRanges: [sourceRange(1, 0)],
    }
    const r1Status = {
      fact: fact('status', 'seeded', 1, 'clue-status-r1'),
      sourceRanges: [sourceRange(1, 12)],
    }
    const r2Status = {
      fact: fact('status', 'reinforced', 2, 'clue-status-r2'),
      sourceRanges: [sourceRange(2, 0)],
    }
    const r1State = {
      fact: fact('state', plantedState, 1, 'clue-state-r1'),
      sourceRanges: [sourceRange(1, 24)],
    }
    const r2State = {
      fact: fact('state', paidOffState, 2, 'clue-state-r2'),
      sourceRanges: [sourceRange(2, 24)],
    }
    const acceptedDelta = (
      id: string,
      operation: 'set' | 'remove',
      field: string,
      value: unknown,
    ) => ({
      id,
      kind: 'clue' as const,
      operation,
      targetId: 'clue-moon-gate',
      field,
      value,
      sourceAnchorIds: [`anchor-clue-lifecycle-r${operation === 'set' ? '2' : '2'}`],
    })
    const clueLifecycle = {
      clueId: 'clue-moon-gate',
      revision: 3,
      headRevision: 3,
      freshness: 'current' as const,
      entries: [{
        revision: 1,
        packetId: 'packet-clue-lifecycle-r1',
        provenance: provenance(1),
        fields: [r1State, r1Status, r1Summary],
        changes: [{
          field: 'state',
          after: r1State,
          acceptedDeltaSourceRanges: [sourceRange(1, 24)],
        }, {
          field: 'status',
          after: r1Status,
          acceptedDeltaSourceRanges: [sourceRange(1, 12)],
        }, {
          field: 'summary',
          after: r1Summary,
          acceptedDeltaSourceRanges: [sourceRange(1, 0)],
        }],
      }, {
        revision: 2,
        packetId: 'packet-clue-lifecycle-r2',
        provenance: provenance(2),
        fields: [r2State, r2Status],
        changes: [{
          field: 'state',
          before: r1State,
          after: r2State,
          acceptedDelta: acceptedDelta('clue-state-r2', 'set', 'state', paidOffState),
          acceptedDeltaSourceRanges: [sourceRange(2, 24)],
        }, {
          field: 'status',
          before: r1Status,
          after: r2Status,
          acceptedDelta: acceptedDelta('clue-status-r2', 'set', 'status', 'reinforced'),
          acceptedDeltaSourceRanges: [sourceRange(2, 0)],
        }, {
          field: 'summary',
          before: r1Summary,
          acceptedDelta: acceptedDelta('clue-summary-r2', 'remove', 'summary', null),
          acceptedDeltaSourceRanges: [sourceRange(2, 12)],
        }],
      }, {
        revision: 3,
        packetId: 'packet-clue-lifecycle-r3',
        rollbackOfRevision: 1,
        provenance: provenance(3),
        fields: [r1State, r1Status, r1Summary],
        changes: [{
          field: 'state',
          before: r2State,
          after: r1State,
          acceptedDeltaSourceRanges: [],
        }, {
          field: 'status',
          before: r2Status,
          after: r1Status,
          acceptedDeltaSourceRanges: [],
        }, {
          field: 'summary',
          after: r1Summary,
          acceptedDeltaSourceRanges: [],
        }],
      }],
    } as const
    const currentFacts = [r1State.fact, r1Status.fact, r1Summary.fact, {
      kind: 'clue' as const,
      targetId: 'clue-unrelated',
      field: 'summary',
      value: '无关线索',
      sourceRevision: 1,
      sourceDeltaId: 'clue-unrelated-r1',
      sourceAnchorIds: ['anchor-clue-lifecycle-r1'],
      provenance: provenance(1),
    }]
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-clue-lifecycle',
        workspaceId,
        revision: 3,
        headRevision: 3,
        freshness: 'current',
        hits: [],
        clueLifecycle,
      },
    } as const))
    const generateReviewDraft = vi.fn()
    const previewReview = vi.fn()
    const reviewResultPacket = vi.fn()
    const rollbackRevision = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-clue-lifecycle',
              workspaceId,
              cwd: 'C:/novels/clue-lifecycle',
              acceptedRevision: 3,
            },
          })),
          generateReviewDraft,
          previewReview,
          retrieve,
          reviewResultPacket,
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: {
              revision,
              parentRevision: revision - 1,
              packetId: `packet-clue-lifecycle-r${String(revision)}`,
              manuscript: {
                unitId: 'chapter-clue-lifecycle',
                title: '线索生命周期',
                text: `线索 R${String(revision)}`,
              },
              deltas: [],
              issues: [],
              decisions: [],
              sourceAnchors: [],
              provenance: provenance(revision),
              authorization: {
                kind: 'author',
                actorId: 'author-1',
                decisionId: `decision-clue-lifecycle-r${String(revision)}`,
              },
            },
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-clue-lifecycle',
              workspaceId,
              revision: 3,
              facts: currentFacts,
              entities: currentFacts.map(current => ({
                kind: current.kind,
                targetId: current.targetId,
                fields: { [current.field]: current.value },
                fieldSources: {},
                sourceRevision: current.sourceRevision,
                sourceDeltaId: current.sourceDeltaId,
                sourceAnchorIds: current.sourceAnchorIds,
                provenance: current.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const target = container.querySelector<HTMLSelectElement>('[aria-label="Clue lifecycle target"]')
      expect([...target?.options ?? []].map(option => option.value)).toEqual([
        'clue-moon-gate',
        'clue-unrelated',
      ])
      const build = container.querySelector<HTMLButtonElement>('[data-build-clue-lifecycle]')
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 3,
        clueLifecycleId: 'clue-moon-gate',
      })
      const lifecycle = container.querySelector('[data-clue-lifecycle]')
      expect(lifecycle?.textContent).toContain('R3 · head R3 · current')
      expect(lifecycle?.textContent).toContain('线索：clue-moon-gate')
      expect([...container.querySelectorAll('[data-clue-lifecycle-entry]')]
        .map(item => item.getAttribute('data-clue-lifecycle-entry'))).toEqual(['1', '2', '3'])
      expect(container.querySelector('[data-clue-lifecycle-entry="1"]')?.textContent)
        .toContain('summary: 月门只在满月开启')
      const canonState = container.querySelector(
        '[data-canon-entity="clue:clue-moon-gate"] [data-clue-state="clue-moon-gate"]',
      )
      expect(canonState).not.toBeNull()
      expect(canonState?.textContent).toContain('foreshadowing · planted · available')
      expect(canonState?.textContent).toContain(plantedState.intendedFunction)
      expect(canonState?.querySelector('[data-clue-mysteries]')?.textContent)
        .toContain('mystery-moon-gate')
      expect(canonState?.querySelector('[data-clue-payoff-window]')?.textContent)
        .toContain('chapter-8..chapter-10')
      expect(canonState?.querySelector('[data-clue-rationale]')?.textContent)
        .toContain('初始')
      const lifecycleState = container.querySelector(
        '[data-clue-lifecycle-entry="2"] [data-clue-state="clue-moon-gate"]',
      )
      expect(lifecycleState).not.toBeNull()
      expect(lifecycleState?.textContent).toContain('foreshadowing · paid-off · resolved')
      expect(lifecycleState?.querySelector('[data-clue-payoff="chapter-8"]')?.textContent)
        .toContain(paidOffState.payoff.description)
      expect(lifecycleState?.querySelector('[data-clue-aftermath]')?.textContent)
        .toContain(paidOffState.payoff.aftermath)
      expect(lifecycleState?.querySelector('[data-clue-rationale]')?.textContent)
        .toContain(paidOffState.revisionRationale)
      expect(lifecycleState?.textContent).toContain('clue-state-r2')
      expect(lifecycleState?.textContent).toContain('clue-editor-r2')
      const removed = container.querySelector('[data-clue-lifecycle-change="2:summary"]')
      expect(removed?.textContent).toContain('之前：月门只在满月开启')
      expect(removed?.textContent).toContain('之后：已移除')
      expect(removed?.textContent).toContain('clue-summary-r2')
      const restored = container.querySelector('[data-clue-lifecycle-entry="3"]')
      expect(restored?.textContent).toContain('rollback of R1')
      expect(restored?.textContent).toContain('之后：月门只在满月开启')
      expect(restored?.textContent).toContain('anchor-clue-lifecycle-r1')
      expect(lifecycle?.textContent).not.toContain('无关线索')
      expect(generateReviewDraft).not.toHaveBeenCalled()
      expect(previewReview).not.toHaveBeenCalled()
      expect(reviewResultPacket).not.toHaveBeenCalled()
      expect(rollbackRevision).not.toHaveBeenCalled()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds one accepted promise and payoff lifecycle in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-promise-lifecycle'
    const promiseId = 'promise-old-case'
    const provenance = (revision: number) => ({
      taskId: `task-promise-lifecycle-r${String(revision)}`,
      sessionId: SESSION_ID,
      producer: `promise-editor-r${String(revision)}`,
    } as const)
    const sourceRange = (revision: number, start: number) => ({
      anchorId: `anchor-promise-lifecycle-r${String(revision)}`,
      sourceId: `chapter-promise-lifecycle-r${String(revision)}`,
      start,
      end: start + 10,
      contentHash: String(revision).repeat(64),
    })
    const fact = (
      field: string,
      value: string,
      revision: number,
      deltaId: string,
    ) => ({
      kind: 'promise' as const,
      targetId: promiseId,
      field,
      value,
      sourceRevision: revision,
      sourceDeltaId: deltaId,
      sourceAnchorIds: [`anchor-promise-lifecycle-r${String(revision)}`],
      provenance: provenance(revision),
    })
    const projected = (
      field: string,
      value: string,
      revision: number,
      deltaId: string,
      start: number,
    ) => ({
      fact: fact(field, value, revision, deltaId),
      sourceRanges: [sourceRange(revision, start)],
    })
    const acceptedDelta = (
      id: string,
      field: string,
      value: string,
      revision: number,
    ) => ({
      id,
      kind: 'promise' as const,
      operation: 'set' as const,
      targetId: promiseId,
      field,
      value,
      sourceAnchorIds: [`anchor-promise-lifecycle-r${String(revision)}`],
    })
    const r1Summary = projected(
      'summary',
      '月蚀前查清旧案并告知守门人',
      1,
      'promise-old-case-summary-r1',
      0,
    )
    const r1Stage = projected('stage', 'setup', 1, 'promise-old-case-stage-r1', 12)
    const r2Stage = projected('stage', 'complicated', 2, 'promise-old-case-stage-r2', 0)
    const r2Reminder = projected(
      'reminder',
      '守门人在月蚀前再次追问',
      2,
      'promise-old-case-reminder-r2',
      12,
    )
    const r3Stage = projected('stage', 'resolved', 3, 'promise-old-case-stage-r3', 0)
    const r3Payoff = projected(
      'payoff',
      '公开真相并关闭月门',
      3,
      'promise-old-case-payoff-r3',
      12,
    )
    const r3Aftermath = projected(
      'aftermath',
      '故人失去信任',
      3,
      'promise-old-case-aftermath-r3',
      24,
    )
    const promiseLifecycle = {
      promiseId,
      revision: 3,
      headRevision: 3,
      freshness: 'current' as const,
      entries: [{
        revision: 1,
        packetId: 'packet-promise-lifecycle-r1',
        provenance: provenance(1),
        fields: [r1Stage, r1Summary],
        changes: [{
          field: 'stage',
          after: r1Stage,
          acceptedDeltaSourceRanges: [sourceRange(1, 12)],
        }, {
          field: 'summary',
          after: r1Summary,
          acceptedDeltaSourceRanges: [sourceRange(1, 0)],
        }],
      }, {
        revision: 2,
        packetId: 'packet-promise-lifecycle-r2',
        provenance: provenance(2),
        fields: [r2Reminder, r2Stage, r1Summary],
        changes: [{
          field: 'reminder',
          after: r2Reminder,
          acceptedDelta: acceptedDelta(
            'promise-old-case-reminder-r2',
            'reminder',
            '守门人在月蚀前再次追问',
            2,
          ),
          acceptedDeltaSourceRanges: [sourceRange(2, 12)],
        }, {
          field: 'stage',
          before: r1Stage,
          after: r2Stage,
          acceptedDelta: acceptedDelta(
            'promise-old-case-stage-r2',
            'stage',
            'complicated',
            2,
          ),
          acceptedDeltaSourceRanges: [sourceRange(2, 0)],
        }],
      }, {
        revision: 3,
        packetId: 'packet-promise-lifecycle-r3',
        provenance: provenance(3),
        fields: [r3Aftermath, r3Payoff, r2Reminder, r3Stage, r1Summary],
        changes: [{
          field: 'aftermath',
          after: r3Aftermath,
          acceptedDelta: acceptedDelta(
            'promise-old-case-aftermath-r3',
            'aftermath',
            '故人失去信任',
            3,
          ),
          acceptedDeltaSourceRanges: [sourceRange(3, 24)],
        }, {
          field: 'payoff',
          after: r3Payoff,
          acceptedDelta: acceptedDelta(
            'promise-old-case-payoff-r3',
            'payoff',
            '公开真相并关闭月门',
            3,
          ),
          acceptedDeltaSourceRanges: [sourceRange(3, 12)],
        }, {
          field: 'stage',
          before: r2Stage,
          after: r3Stage,
          acceptedDelta: acceptedDelta(
            'promise-old-case-stage-r3',
            'stage',
            'resolved',
            3,
          ),
          acceptedDeltaSourceRanges: [sourceRange(3, 0)],
        }],
      }],
    } as const
    const currentFacts = [
      r3Aftermath.fact,
      r3Payoff.fact,
      r2Reminder.fact,
      r3Stage.fact,
      r1Summary.fact,
      {
        kind: 'promise' as const,
        targetId: 'promise-side-thread',
        field: 'stage',
        value: 'setup',
        sourceRevision: 1,
        sourceDeltaId: 'promise-side-thread-stage-r1',
        sourceAnchorIds: ['anchor-promise-lifecycle-r1'],
        provenance: provenance(1),
      },
    ]
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-promise-lifecycle',
        workspaceId,
        revision: 3,
        headRevision: 3,
        freshness: 'current',
        hits: [],
        promiseLifecycle,
      },
    } as const))
    const generateReviewDraft = vi.fn()
    const previewReview = vi.fn()
    const reviewResultPacket = vi.fn()
    const rollbackRevision = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-promise-lifecycle',
              workspaceId,
              cwd: 'C:/novels/promise-lifecycle',
              acceptedRevision: 3,
            },
          })),
          generateReviewDraft,
          previewReview,
          retrieve,
          reviewResultPacket,
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: {
              revision,
              parentRevision: revision - 1,
              packetId: `packet-promise-lifecycle-r${String(revision)}`,
              manuscript: {
                unitId: 'chapter-promise-lifecycle',
                title: '承诺兑现',
                text: `承诺 R${String(revision)}`,
              },
              deltas: [],
              issues: [],
              decisions: [],
              sourceAnchors: [],
              provenance: provenance(revision),
              authorization: {
                kind: 'author',
                actorId: 'author-1',
                decisionId: `decision-promise-lifecycle-r${String(revision)}`,
              },
            },
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-promise-lifecycle',
              workspaceId,
              revision: 3,
              facts: currentFacts,
              entities: currentFacts.map(current => ({
                kind: current.kind,
                targetId: current.targetId,
                fields: { [current.field]: current.value },
                fieldSources: {},
                sourceRevision: current.sourceRevision,
                sourceDeltaId: current.sourceDeltaId,
                sourceAnchorIds: current.sourceAnchorIds,
                provenance: current.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const target = container.querySelector<HTMLSelectElement>('[aria-label="Promise lifecycle target"]')
      expect([...target?.options ?? []].map(option => option.value)).toEqual([
        'promise-old-case',
        'promise-side-thread',
      ])
      const build = container.querySelector<HTMLButtonElement>('[data-build-promise-lifecycle]')
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 3,
        promiseLifecycleId: promiseId,
      })
      const lifecycle = container.querySelector('[data-promise-lifecycle]')
      expect(lifecycle?.textContent).toContain('R3 · head R3 · current')
      expect(lifecycle?.textContent).toContain(`承诺：${promiseId}`)
      expect([...container.querySelectorAll('[data-promise-lifecycle-entry]')]
        .map(item => item.getAttribute('data-promise-lifecycle-entry'))).toEqual(['1', '2', '3'])
      expect(container.querySelector('[data-promise-lifecycle-entry="1"]')?.textContent)
        .toContain('summary: 月蚀前查清旧案并告知守门人')
      const complication = container.querySelector('[data-promise-lifecycle-change="2:stage"]')
      expect(complication?.textContent).toContain('之前：setup')
      expect(complication?.textContent).toContain('之后：complicated')
      expect(complication?.textContent).toContain('promise-old-case-stage-r2')
      expect(complication?.textContent).toContain('anchor-promise-lifecycle-r2')
      const payoff = container.querySelector('[data-promise-lifecycle-entry="3"]')
      expect(payoff?.textContent).toContain('payoff: 公开真相并关闭月门')
      expect(payoff?.textContent).toContain('aftermath: 故人失去信任')
      expect(payoff?.textContent).toContain('promise-old-case-payoff-r3')
      expect(payoff?.textContent).toContain('anchor-promise-lifecycle-r3')
      expect(payoff?.textContent).toContain('promise-editor-r3')
      expect(lifecycle?.textContent).not.toContain('promise-side-thread')
      expect(generateReviewDraft).not.toHaveBeenCalled()
      expect(previewReview).not.toHaveBeenCalled()
      expect(reviewResultPacket).not.toHaveBeenCalled()
      expect(rollbackRevision).not.toHaveBeenCalled()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders one strict promise state in the existing Canon and lifecycle views', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-strict-promise-state'
    const promiseId = 'promise-old-case'
    const provenance = (revision: number) => ({
      taskId: `task-strict-promise-state-r${String(revision)}`,
      sessionId: SESSION_ID,
      producer: `promise-editor-r${String(revision)}`,
    } as const)
    const sourceRange = (revision: number) => ({
      anchorId: `anchor-strict-promise-state-r${String(revision)}`,
      sourceId: `chapter-strict-promise-state-r${String(revision)}`,
      start: 0,
      end: 24,
      contentHash: String(revision).repeat(64),
    })
    const setup = {
      beatId: 'promise-old-case-setup-r1',
      unitId: 'chapter-1',
      sourceRevision: 1,
      sourceAnchorIds: ['anchor-strict-promise-state-r1'],
      description: '沈砚承诺在月蚀前查清旧案并公开真相',
    }
    const openState = {
      version: 1,
      promise: '月蚀前查清旧案并公开真相',
      type: 'mystery-and-relationship',
      weight: 'major',
      horizon: {
        openedUnitId: 'chapter-1',
        expectedPayoffStartUnitId: 'chapter-8',
        expectedPayoffEndUnitId: 'chapter-10',
      },
      setup,
      reminders: [],
      complications: [],
      resolution: {
        status: 'open',
        payoffType: null,
        beat: null,
        retirementRationale: null,
      },
      aftermath: null,
      revisionRationale: null,
    } as const
    const reminder = {
      beatId: 'promise-old-case-reminder-r2',
      unitId: 'chapter-8',
      sourceRevision: 2,
      sourceAnchorIds: ['anchor-strict-promise-state-r2'],
      description: '守门人在月蚀前再次追问旧案进展',
    }
    const complication = {
      beatId: 'promise-old-case-complication-r2',
      unitId: 'chapter-8',
      sourceRevision: 2,
      sourceAnchorIds: ['anchor-strict-promise-state-r2'],
      description: '公开账页会牵连沈砚最信任的故人',
    }
    const partialPayoff = {
      beatId: 'promise-old-case-partial-payoff-r2',
      unitId: 'chapter-8',
      sourceRevision: 2,
      sourceAnchorIds: ['anchor-strict-promise-state-r2'],
      description: '公开账页并确认守门记录曾被伪造',
    }
    const partiallyPaidState = {
      ...openState,
      version: 2,
      reminders: [reminder],
      complications: [complication],
      resolution: {
        status: 'partially-paid',
        payoffType: 'chapter',
        beat: partialPayoff,
        retirementRationale: null,
      },
      aftermath: '守门人获得行动依据，但沈砚与故人的信任开始破裂',
      revisionRationale: '先兑现伪造记录这一层，幕后人身份继续保留到本卷末',
    } as const
    const projectedState = (value: unknown, revision: number) => {
      const fact = {
        kind: 'promise' as const,
        targetId: promiseId,
        field: 'state',
        value,
        sourceRevision: revision,
        sourceDeltaId: `promise-old-case-state-r${String(revision)}`,
        sourceAnchorIds: [`anchor-strict-promise-state-r${String(revision)}`],
        provenance: provenance(revision),
      }
      return { fact, sourceRanges: [sourceRange(revision)] }
    }
    const r1State = projectedState(openState, 1)
    const r2State = projectedState(partiallyPaidState, 2)
    const promiseLifecycle = {
      promiseId,
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      entries: [{
        revision: 1,
        packetId: 'packet-strict-promise-state-r1',
        provenance: provenance(1),
        fields: [r1State],
        changes: [{
          field: 'state',
          after: r1State,
          acceptedDeltaSourceRanges: [sourceRange(1)],
        }],
      }, {
        revision: 2,
        packetId: 'packet-strict-promise-state-r2',
        provenance: provenance(2),
        fields: [r2State],
        changes: [{
          field: 'state',
          before: r1State,
          after: r2State,
          acceptedDelta: {
            id: 'promise-old-case-state-r2',
            kind: 'promise' as const,
            operation: 'set' as const,
            targetId: promiseId,
            field: 'state',
            value: partiallyPaidState,
            sourceAnchorIds: ['anchor-strict-promise-state-r2'],
          },
          acceptedDeltaSourceRanges: [sourceRange(2)],
        }],
      }],
    } as const
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-strict-promise-state',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        promiseLifecycle,
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-strict-promise-state',
              workspaceId,
              cwd: 'C:/novels/strict-promise-state',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          retrieve,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: {
              revision,
              parentRevision: revision - 1,
              packetId: `packet-strict-promise-state-r${String(revision)}`,
              manuscript: {
                unitId: 'chapter-strict-promise-state',
                title: '承诺状态',
                text: `承诺状态 R${String(revision)}`,
              },
              deltas: [],
              issues: [],
              decisions: [],
              sourceAnchors: [],
              provenance: provenance(revision),
              authorization: {
                kind: 'author',
                actorId: 'author-1',
                decisionId: `decision-strict-promise-state-r${String(revision)}`,
              },
            },
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-strict-promise-state',
              workspaceId,
              revision: 2,
              facts: [r2State.fact],
              entities: [{
                kind: 'promise' as const,
                targetId: promiseId,
                fields: { state: partiallyPaidState },
                fieldSources: { state: r2State.fact },
                sourceRevision: 2,
                sourceDeltaId: 'promise-old-case-state-r2',
                sourceAnchorIds: ['anchor-strict-promise-state-r2'],
                provenance: provenance(2),
              }],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const canonState = container.querySelector(
        `[data-canon-entity="promise:${promiseId}"] [data-promise-state="${promiseId}"]`,
      )
      expect(canonState).not.toBeNull()
      expect(canonState?.querySelector('[data-promise-horizon]')?.textContent)
        .toContain('chapter-1 → chapter-8 … chapter-10')
      expect(canonState?.querySelector('[data-promise-setup="promise-old-case-setup-r1"]')?.textContent)
        .toContain('沈砚承诺在月蚀前查清旧案并公开真相')
      expect(canonState?.querySelector('[data-promise-reminder="promise-old-case-reminder-r2"]')?.textContent)
        .toContain('守门人在月蚀前再次追问旧案进展')
      expect(canonState?.querySelector('[data-promise-complication="promise-old-case-complication-r2"]')?.textContent)
        .toContain('公开账页会牵连沈砚最信任的故人')
      expect(canonState?.querySelector('[data-promise-resolution="partially-paid"]')?.textContent)
        .toContain('chapter · 公开账页并确认守门记录曾被伪造')
      expect(canonState?.querySelector('[data-promise-aftermath]')?.textContent)
        .toContain('守门人获得行动依据，但沈砚与故人的信任开始破裂')
      expect(canonState?.textContent).toContain('promise-old-case-state-r2')
      expect(canonState?.textContent).toContain('promise-editor-r2')

      const build = container.querySelector<HTMLButtonElement>('[data-build-promise-lifecycle]')
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        promiseLifecycleId: promiseId,
      })
      const lifecycleState = container.querySelector(
        `[data-promise-lifecycle-entry="2"] [data-promise-state="${promiseId}"]`,
      )
      expect(lifecycleState).not.toBeNull()
      expect(lifecycleState?.querySelector('[data-promise-resolution="partially-paid"]')?.textContent)
        .toContain('chapter · 公开账页并确认守门记录曾被伪造')
      expect(lifecycleState?.querySelector('[data-promise-aftermath]')?.textContent)
        .toContain('守门人获得行动依据，但沈砚与故人的信任开始破裂')
      expect(lifecycleState?.textContent).toContain('promise-old-case-state-r2')
      expect(lifecycleState?.textContent).toContain('promise-editor-r2')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds one typed mystery reveal lifecycle in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-mystery-lifecycle'
    const mysteryId = 'mystery-moon-record'
    const provenance = (revision: number) => ({
      taskId: `task-mystery-r${String(revision)}`,
      sessionId: SESSION_ID,
      producer: `mystery-editor-r${String(revision)}`,
    } as const)
    const sourceRange = (revision: number) => ({
      anchorId: `anchor-mystery-r${String(revision)}`,
      sourceId: `chapter-mystery-r${String(revision)}`,
      start: 4,
      end: 36,
      contentHash: String(revision).repeat(64),
    })
    const unknownToAuthor = {
      version: 1,
      question: '谁伪造了月门守门记录',
      truth: { status: 'unknown-to-author', answer: null },
      hypotheses: ['守门人独自篡改记录', '旧案幸存者胁迫守门人'],
      knowers: [],
      readerVisibility: '读者知道记录有矛盾，但不知道答案',
      concealmentRule: '隐藏幕后人身份，不隐藏记录矛盾',
      revealConditions: ['找到烧焦账页', '让守门人核对月蚀日期'],
      earliestFairResolutionUnitId: 'chapter-5',
      desiredRevealWindow: { startUnitId: 'chapter-5', endUnitId: 'chapter-8' },
      actualReveal: null,
      aftermath: null,
      revisionRationale: null,
    } as const
    const knownToAuthor = {
      version: 2,
      question: '谁伪造了月门守门记录',
      truth: {
        status: 'known-to-author',
        answer: '旧案幸存者胁迫守门人伪造记录',
      },
      hypotheses: ['旧案幸存者胁迫守门人'],
      knowers: ['author', 'shen-yan', 'gatekeeper'],
      readerVisibility: '读者确认守门人受胁迫，但尚未看到幕后人姓名',
      concealmentRule: '可以展示胁迫行为，揭示前不写幕后人姓名',
      revealConditions: ['追查胁迫守门人的旧案幸存者'],
      earliestFairResolutionUnitId: 'chapter-5',
      desiredRevealWindow: { startUnitId: 'chapter-5', endUnitId: 'chapter-8' },
      actualReveal: {
        unitId: 'chapter-5',
        description: '守门人承认自己伪造记录并受到胁迫',
      },
      aftermath: '沈砚转而追查旧案幸存者',
      revisionRationale: '烧焦账页让作者锁定幕后动机',
    } as const
    const fact = (value: typeof unknownToAuthor | typeof knownToAuthor, revision: number) => ({
      kind: 'mystery' as const,
      targetId: mysteryId,
      field: 'state',
      value,
      sourceRevision: revision,
      sourceDeltaId: `mystery-moon-record-state-r${String(revision)}`,
      sourceAnchorIds: [`anchor-mystery-r${String(revision)}`],
      provenance: provenance(revision),
    })
    const r1Field = { fact: fact(unknownToAuthor, 1), sourceRanges: [sourceRange(1)] }
    const r2Field = { fact: fact(knownToAuthor, 2), sourceRanges: [sourceRange(2)] }
    const redHerring = {
      version: 1,
      role: 'red-herring',
      statement: '守门人独自篡改记录以掩盖受贿',
      linkedMysteryIds: [mysteryId],
      status: 'planted',
      readerVisibility: 'available',
      intendedFunction: '让读者暂时把个人贪念当作唯一动机',
      expectedPayoffWindow: 'chapter-5..chapter-8',
      payoff: null,
      abandonmentReason: null,
      revisionRationale: null,
    } as const
    const foreshadowing = {
      version: 1,
      role: 'foreshadowing',
      statement: '烧焦账页的月蚀日期与守门记录相差一日',
      linkedMysteryIds: [mysteryId],
      status: 'paid-off',
      readerVisibility: 'noticed',
      intendedFunction: '证明守门人伪造日期并留下胁迫证据',
      expectedPayoffWindow: 'chapter-5',
      payoff: {
        unitId: 'chapter-5',
        kind: 'reinterpretation',
        description: '账页日期使守门人的受贿说无法解释全部矛盾',
        aftermath: '调查目标转向胁迫他的旧案幸存者',
      },
      abandonmentReason: null,
      revisionRationale: null,
    } as const
    const linkedClueEvidence = (
      clueId: string,
      value: typeof redHerring | typeof foreshadowing,
      revision: number,
    ) => ({
      clueId,
      value,
      sourceRevision: revision,
      sourceDeltaId: `${clueId}-state-r${String(revision)}`,
      sourceAnchorIds: [`anchor-${clueId}-r${String(revision)}`],
      sourceRanges: [{
        ...sourceRange(revision),
        anchorId: `anchor-${clueId}-r${String(revision)}`,
      }],
      provenance: provenance(revision),
    })
    const r1RedHerring = linkedClueEvidence('clue-gatekeeper-bribe', redHerring, 1)
    const r2Foreshadowing = linkedClueEvidence('clue-burned-ledger', foreshadowing, 2)
    const mysteryLifecycle = {
      mysteryId,
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      entries: [{
        revision: 1,
        packetId: 'packet-mystery-r1',
        provenance: provenance(1),
        fields: [r1Field],
        changes: [{
          field: 'state',
          after: r1Field,
          acceptedDeltaSourceRanges: [sourceRange(1)],
        }],
        linkedClueEvidence: [r1RedHerring],
      }, {
        revision: 2,
        packetId: 'packet-mystery-r2',
        provenance: provenance(2),
        fields: [r2Field],
        changes: [{
          field: 'state',
          before: r1Field,
          after: r2Field,
          acceptedDelta: {
            id: 'mystery-moon-record-state-r2',
            kind: 'mystery' as const,
            operation: 'set' as const,
            targetId: mysteryId,
            field: 'state',
            value: knownToAuthor,
            sourceAnchorIds: ['anchor-mystery-r2'],
          },
          acceptedDeltaSourceRanges: [sourceRange(2)],
        }],
        linkedClueEvidence: [r1RedHerring, r2Foreshadowing],
      }],
    } as const
    const otherFact = {
      ...fact(unknownToAuthor, 2),
      targetId: 'mystery-unrelated',
      value: { ...unknownToAuthor, question: '北岸灯塔为何熄灭' },
      sourceDeltaId: 'mystery-unrelated-state-r2',
    }
    const clueFact = (evidence: typeof r1RedHerring | typeof r2Foreshadowing) => ({
      kind: 'clue' as const,
      targetId: evidence.clueId,
      field: 'state',
      value: evidence.value,
      sourceRevision: evidence.sourceRevision,
      sourceDeltaId: evidence.sourceDeltaId,
      sourceAnchorIds: evidence.sourceAnchorIds,
      provenance: evidence.provenance,
    })
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-mystery-lifecycle',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        mysteryLifecycle,
      },
    } as const))
    const currentFacts = [r2Field.fact, otherFact, clueFact(r1RedHerring), clueFact(r2Foreshadowing)]
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-mystery-lifecycle',
              workspaceId,
              cwd: 'C:/novels/mystery-lifecycle',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          retrieve,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-mystery-lifecycle',
              workspaceId,
              revision: 2,
              facts: currentFacts,
              entities: currentFacts.map(current => ({
                kind: current.kind,
                targetId: current.targetId,
                fields: { [current.field]: current.value },
                fieldSources: {},
                sourceRevision: current.sourceRevision,
                sourceDeltaId: current.sourceDeltaId,
                sourceAnchorIds: current.sourceAnchorIds,
                provenance: current.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const target = container.querySelector<HTMLSelectElement>('[aria-label="Mystery lifecycle target"]')
      expect([...target?.options ?? []].map(option => option.value)).toEqual([
        'mystery-moon-record',
        'mystery-unrelated',
      ])
      const build = container.querySelector<HTMLButtonElement>('[data-build-mystery-lifecycle]')
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        mysteryLifecycleId: mysteryId,
      })
      const lifecycle = container.querySelector('[data-mystery-lifecycle]')
      expect(lifecycle?.textContent).toContain('R2 · head R2 · current')
      expect(lifecycle?.textContent).toContain(`谜团：${mysteryId}`)
      expect([...container.querySelectorAll('[data-mystery-lifecycle-entry]')]
        .map(item => item.getAttribute('data-mystery-lifecycle-entry'))).toEqual(['1', '2'])
      const canonState = container.querySelector(
        `[data-canon-entity="mystery:${mysteryId}"] [data-mystery-state="${mysteryId}"]`,
      )
      expect(canonState?.textContent).toContain('known-to-author')
      expect(canonState?.textContent).toContain('旧案幸存者胁迫守门人伪造记录')
      expect(canonState?.textContent).toContain('可以展示胁迫行为')
      expect(canonState?.textContent).toContain('chapter-5 → chapter-8')
      expect(canonState?.textContent).toContain('chapter-5 · 守门人承认自己伪造记录并受到胁迫')
      expect(canonState?.textContent).toContain('沈砚转而追查旧案幸存者')
      expect(canonState?.textContent).toContain('烧焦账页让作者锁定幕后动机')
      expect(canonState?.textContent).toContain('mystery-moon-record-state-r2')
      const r1State = container.querySelector(
        `[data-mystery-lifecycle-entry="1"] [data-mystery-state="${mysteryId}"]`,
      )
      expect(r1State?.textContent).toContain('unknown-to-author')
      expect(r1State?.textContent).toContain('作者答案：未设置')
      expect(r1State?.textContent).toContain('最早公平揭晓：chapter-5')
      const reveal = container.querySelector('[data-mystery-lifecycle-change="2:state"]')
      expect(reveal?.textContent).toContain('"status":"unknown-to-author"')
      expect(reveal?.textContent).toContain('"status":"known-to-author"')
      expect(reveal?.textContent).toContain('守门人承认自己伪造记录并受到胁迫')
      expect(reveal?.textContent).toContain('mystery-moon-record-state-r2')
      expect(reveal?.textContent).toContain('anchor-mystery-r2')
      const linked = container.querySelector('[data-mystery-lifecycle-entry="2"] [data-mystery-linked-clues]')
      expect(linked?.querySelector('[data-clue-state="clue-gatekeeper-bribe"]')?.textContent)
        .toContain('red-herring · planted')
      expect(linked?.querySelector('[data-clue-state="clue-burned-ledger"]')?.textContent)
        .toContain('foreshadowing · paid-off')
      expect(linked?.textContent).toContain('clue-burned-ledger-state-r2')
      expect(linked?.textContent).toContain('anchor-clue-burned-ledger-r2')
      expect(linked?.textContent).toContain('mystery-editor-r2')
      expect(lifecycle?.textContent).toContain('mystery-editor-r2')
      expect(lifecycle?.textContent).not.toContain('北岸灯塔为何熄灭')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds one typed character progression ledger in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-progression-ledger'
    const provenance = {
      taskId: 'task-progression-ledger',
      sessionId: SESSION_ID,
      producer: 'progression-editor',
    } as const
    const advancement = {
      characterId: 'shen-yan',
      eventId: 'event-old-well-training',
      storyOrder: 10,
      dimension: '月息控制',
      priorLimitation: '无法让月息停留超过一息',
      setup: '旧井石壁留下前人控息刻痕',
      evidence: ['连续七次在一息内散功', '第八次维持到三息'],
      enablingAction: '按刻痕逆序调整呼吸',
      resourceOrSacrifice: '三日断粮并耗尽一枚月砂',
      newCapability: '稳定维持月息三息',
      remainingLimit: '移动时仍会立刻散功',
      counter: '扰乱呼吸节奏可打断月息',
      socialInterpretation: '守门人认为他终于具备入门资格',
      downstreamConsequence: '能够开启旧井第二层封印',
    } as const
    const sourceRange = {
      anchorId: 'anchor-progression-training',
      sourceId: 'chapter-progression-training',
      start: 4,
      end: 36,
      contentHash: 'p'.repeat(64),
    }
    const advancementFact = {
      kind: 'progression' as const,
      targetId: 'advancement-breath-control',
      field: 'advancement',
      value: advancement,
      sourceRevision: 2,
      sourceDeltaId: 'advancement-breath-control-r2',
      sourceAnchorIds: ['anchor-progression-training'],
      provenance,
    }
    const otherAdvancementFact = {
      ...advancementFact,
      targetId: 'advancement-guard-sight',
      value: {
        ...advancement,
        characterId: 'gatekeeper',
        eventId: 'event-gate-warning',
        storyOrder: 8,
        dimension: '感知',
        newCapability: '感知月门外侧十丈',
      },
      sourceDeltaId: 'advancement-guard-sight-r2',
    }
    const legacyFact = {
      kind: 'progression' as const,
      targetId: 'shen-yan',
      field: 'rank',
      value: '突破到第二境',
      sourceRevision: 2,
      sourceDeltaId: 'progression-legacy-r2',
      sourceAnchorIds: ['anchor-progression-training'],
      provenance,
    }
    const progressionLedger = {
      characterId: 'shen-yan',
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      advancements: [{
        advancementId: 'advancement-breath-control',
        advancement,
        sourceRevision: 2,
        sourceDeltaId: 'advancement-breath-control-r2',
        sourceAnchorIds: ['anchor-progression-training'],
        sourceRanges: [sourceRange],
        provenance,
      }],
    } as const
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-progression-ledger',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        progressionLedger,
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-progression-ledger',
              workspaceId,
              cwd: 'C:/novels/progression-ledger',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          retrieve,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-progression-ledger',
              workspaceId,
              revision: 2,
              facts: [advancementFact, otherAdvancementFact, legacyFact],
              entities: [advancementFact, otherAdvancementFact, legacyFact].map(fact => ({
                kind: fact.kind,
                targetId: fact.targetId,
                fields: { [fact.field]: fact.value },
                fieldSources: {},
                sourceRevision: fact.sourceRevision,
                sourceDeltaId: fact.sourceDeltaId,
                sourceAnchorIds: fact.sourceAnchorIds,
                provenance: fact.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const target = container.querySelector<HTMLSelectElement>('[aria-label="Progression ledger character"]')
      expect([...target?.options ?? []].map(option => option.value)).toEqual([
        'gatekeeper',
        'shen-yan',
      ])
      await act(async () => {
        if (target !== null) {
          target.value = 'shen-yan'
          target.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      const build = container.querySelector<HTMLButtonElement>('[data-build-progression-ledger]')
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        progressionCharacterId: 'shen-yan',
      })
      const ledger = container.querySelector('[data-progression-ledger]')
      expect(ledger?.textContent).toContain('R2 · head R2 · current')
      expect(ledger?.textContent).toContain('人物：shen-yan')
      const rendered = container.querySelector('[data-progression-advancement="advancement-breath-control"]')
      expect(rendered?.textContent).toContain('event-old-well-training · story order 10')
      expect(rendered?.textContent).toContain('维度：月息控制')
      expect(rendered?.textContent).toContain('先前限制：无法让月息停留超过一息')
      expect(rendered?.textContent).toContain('铺垫：旧井石壁留下前人控息刻痕')
      expect(rendered?.textContent).toContain('证据：连续七次在一息内散功 · 第八次维持到三息')
      expect(rendered?.textContent).toContain('促成行动：按刻痕逆序调整呼吸')
      expect(rendered?.textContent).toContain('资源或牺牲：三日断粮并耗尽一枚月砂')
      expect(rendered?.textContent).toContain('新增能力：稳定维持月息三息')
      expect(rendered?.textContent).toContain('剩余上限：移动时仍会立刻散功')
      expect(rendered?.textContent).toContain('反制：扰乱呼吸节奏可打断月息')
      expect(rendered?.textContent).toContain('社会解读：守门人认为他终于具备入门资格')
      expect(rendered?.textContent).toContain('下游后果：能够开启旧井第二层封印')
      expect(rendered?.textContent).toContain('anchor-progression-training')
      expect(rendered?.textContent).toContain('progression-editor')
      expect(ledger?.textContent).not.toContain('突破到第二境')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds one faction agenda and off-screen continuity ledger in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-faction-continuity'
    const provenance = {
      taskId: 'task-faction-continuity',
      sessionId: SESSION_ID,
      producer: 'faction-editor',
    } as const
    const continuity = {
      factionId: 'moon-council',
      eventId: 'event-north-ferry-lockdown',
      storyOrder: 10,
      goal: '在门印失踪公开前将其寻回',
      resources: ['三艘税船', '两名议会密探'],
      constraints: ['不得惊动城卫', '必须维持渡口税收'],
      currentAction: '封锁北渡口并逐船核对货单',
      membershipOrAllianceChange: '吸收渡口税吏为外围协力者',
      offscreenConsequence: '北岸粮船延误，黑市抬高夜航价格',
    } as const
    const sourceRange = {
      anchorId: 'anchor-faction-lockdown',
      sourceId: 'chapter-faction-lockdown',
      start: 4,
      end: 40,
      contentHash: 'f'.repeat(64),
    }
    const continuityFact = {
      kind: 'faction-state' as const,
      targetId: 'faction-entry-moon-council-search',
      field: 'continuity',
      value: continuity,
      sourceRevision: 2,
      sourceDeltaId: 'faction-moon-council-search-r2',
      sourceAnchorIds: ['anchor-faction-lockdown'],
      provenance,
    }
    const otherFactionFact = {
      ...continuityFact,
      targetId: 'faction-entry-river-wardens-patrol',
      value: {
        ...continuity,
        factionId: 'river-wardens',
        eventId: 'event-river-patrol',
        storyOrder: 8,
        goal: '查明北渡口封锁原因',
      },
      sourceDeltaId: 'faction-river-wardens-r2',
    }
    const legacyFact = {
      kind: 'faction-state' as const,
      targetId: 'faction-entry-moon-council-legacy',
      field: 'continuity',
      value: '议会正在暗中行动',
      sourceRevision: 2,
      sourceDeltaId: 'faction-moon-council-legacy-r2',
      sourceAnchorIds: ['anchor-faction-lockdown'],
      provenance,
    }
    const factionContinuity = {
      factionId: 'moon-council',
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      entries: [{
        entryId: 'faction-entry-moon-council-search',
        continuity,
        sourceRevision: 2,
        sourceDeltaId: 'faction-moon-council-search-r2',
        sourceAnchorIds: ['anchor-faction-lockdown'],
        sourceRanges: [sourceRange],
        provenance,
      }],
    } as const
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-faction-continuity',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        factionContinuity,
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-faction-continuity',
              workspaceId,
              cwd: 'C:/novels/faction-continuity',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          retrieve,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-faction-continuity',
              workspaceId,
              revision: 2,
              facts: [continuityFact, otherFactionFact, legacyFact],
              entities: [continuityFact, otherFactionFact, legacyFact].map(fact => ({
                kind: fact.kind,
                targetId: fact.targetId,
                fields: { [fact.field]: fact.value },
                fieldSources: {},
                sourceRevision: fact.sourceRevision,
                sourceDeltaId: fact.sourceDeltaId,
                sourceAnchorIds: fact.sourceAnchorIds,
                provenance: fact.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const target = container.querySelector<HTMLSelectElement>('[aria-label="Faction continuity ledger faction"]')
      expect([...target?.options ?? []].map(option => option.value)).toEqual([
        'moon-council',
        'river-wardens',
      ])
      const build = container.querySelector<HTMLButtonElement>('[data-build-faction-continuity]')
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        factionId: 'moon-council',
      })
      const ledger = container.querySelector('[data-faction-continuity]')
      expect(ledger?.textContent).toContain('R2 · head R2 · current')
      expect(ledger?.textContent).toContain('势力：moon-council')
      const rendered = container.querySelector('[data-faction-continuity-entry="faction-entry-moon-council-search"]')
      expect(rendered?.textContent).toContain('event-north-ferry-lockdown · story order 10')
      expect(rendered?.textContent).toContain('目标：在门印失踪公开前将其寻回')
      expect(rendered?.textContent).toContain('资源：三艘税船 · 两名议会密探')
      expect(rendered?.textContent).toContain('约束：不得惊动城卫 · 必须维持渡口税收')
      expect(rendered?.textContent).toContain('当前行动：封锁北渡口并逐船核对货单')
      expect(rendered?.textContent).toContain('成员/联盟变化：吸收渡口税吏为外围协力者')
      expect(rendered?.textContent).toContain('场外后果：北岸粮船延误，黑市抬高夜航价格')
      expect(rendered?.textContent).toContain('anchor-faction-lockdown')
      expect(rendered?.textContent).toContain('faction-editor')
      expect(ledger?.textContent).not.toContain('议会正在暗中行动')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds one nested location and travel-access continuity ledger in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-location-continuity'
    const provenance = {
      taskId: 'task-location-continuity',
      sessionId: SESSION_ID,
      producer: 'world-editor',
    } as const
    const continuity = {
      locationId: 'moon-gate-city',
      eventId: 'event-north-ferry-flood',
      storyOrder: 20,
      parentLocationId: 'northern-realm',
      scale: 'city',
      accessConditions: ['持有月门印', '巡河卫洪季通行证'],
      governingFactionIds: ['moon-council', 'river-wardens'],
      activeRuleIds: ['rule-moon-gate-bloodline', 'rule-flood-curfew'],
      resourceFlows: ['银砂改由西岭驿道流入', '北渡口只运输赈灾粮'],
      travelLinks: [{
        destinationLocationId: 'north-ferry',
        travelTime: '一日',
        accessConditions: ['巡河卫领航', '仅限白昼'],
        status: 'restricted',
      }],
      currentChange: '北渡口进入洪季限行并改由巡河卫协管',
      consequence: '旧城商队转向西岭驿道，月门城银砂价格上涨',
    } as const
    const sourceRange = {
      anchorId: 'anchor-location-flood',
      sourceId: 'chapter-location-flood',
      start: 4,
      end: 44,
      contentHash: 'l'.repeat(64),
    }
    const continuityFact = {
      kind: 'location-state' as const,
      targetId: 'location-entry-moon-gate-flood',
      field: 'continuity',
      value: continuity,
      sourceRevision: 2,
      sourceDeltaId: 'location-moon-gate-flood-r2',
      sourceAnchorIds: ['anchor-location-flood'],
      provenance,
    }
    const otherLocationFact = {
      ...continuityFact,
      targetId: 'location-entry-south-market-night',
      value: {
        ...continuity,
        locationId: 'south-market',
        eventId: 'event-south-market-night',
        storyOrder: 15,
        parentLocationId: 'southern-realm',
        scale: 'district',
      },
      sourceDeltaId: 'location-south-market-r2',
    }
    const legacyFact = {
      kind: 'location-state' as const,
      targetId: 'location-entry-moon-gate-legacy',
      field: 'continuity',
      value: '月门城正在经历洪季',
      sourceRevision: 2,
      sourceDeltaId: 'location-moon-gate-legacy-r2',
      sourceAnchorIds: ['anchor-location-flood'],
      provenance,
    }
    const locationContinuity = {
      locationId: 'moon-gate-city',
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      entries: [{
        entryId: 'location-entry-moon-gate-flood',
        continuity,
        sourceRevision: 2,
        sourceDeltaId: 'location-moon-gate-flood-r2',
        sourceAnchorIds: ['anchor-location-flood'],
        sourceRanges: [sourceRange],
        provenance,
      }],
    } as const
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-location-continuity',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        locationContinuity,
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-location-continuity',
              workspaceId,
              cwd: 'C:/novels/location-continuity',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          retrieve,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-location-continuity',
              workspaceId,
              revision: 2,
              facts: [continuityFact, otherLocationFact, legacyFact],
              entities: [continuityFact, otherLocationFact, legacyFact].map(fact => ({
                kind: fact.kind,
                targetId: fact.targetId,
                fields: { [fact.field]: fact.value },
                fieldSources: {},
                sourceRevision: fact.sourceRevision,
                sourceDeltaId: fact.sourceDeltaId,
                sourceAnchorIds: fact.sourceAnchorIds,
                provenance: fact.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const target = container.querySelector<HTMLSelectElement>('[aria-label="Location continuity ledger location"]')
      expect([...target?.options ?? []].map(option => option.value)).toEqual([
        'moon-gate-city',
        'south-market',
      ])
      const build = container.querySelector<HTMLButtonElement>('[data-build-location-continuity]')
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        locationId: 'moon-gate-city',
      })
      const ledger = container.querySelector('[data-location-continuity]')
      expect(ledger?.textContent).toContain('R2 · head R2 · current')
      expect(ledger?.textContent).toContain('地点：moon-gate-city')
      const rendered = container.querySelector('[data-location-continuity-entry="location-entry-moon-gate-flood"]')
      expect(rendered?.textContent).toContain('event-north-ferry-flood · story order 20')
      expect(rendered?.textContent).toContain('上级地点：northern-realm')
      expect(rendered?.textContent).toContain('规模：city')
      expect(rendered?.textContent).toContain('通行条件：持有月门印 · 巡河卫洪季通行证')
      expect(rendered?.textContent).toContain('管辖势力：moon-council · river-wardens')
      expect(rendered?.textContent).toContain('生效规则：rule-moon-gate-bloodline · rule-flood-curfew')
      expect(rendered?.textContent).toContain('资源流向：银砂改由西岭驿道流入 · 北渡口只运输赈灾粮')
      expect(rendered?.textContent).toContain('行程：north-ferry · 一日 · restricted · 巡河卫领航 · 仅限白昼')
      expect(rendered?.textContent).toContain('当前变化：北渡口进入洪季限行并改由巡河卫协管')
      expect(rendered?.textContent).toContain('后果：旧城商队转向西岭驿道，月门城银砂价格上涨')
      expect(rendered?.textContent).toContain('anchor-location-flood')
      expect(rendered?.textContent).toContain('world-editor')
      expect(ledger?.textContent).not.toContain('月门城正在经历洪季')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds one object custody and inventory continuity ledger in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-object-continuity'
    const provenance = {
      taskId: 'task-object-continuity',
      sessionId: SESSION_ID,
      producer: 'continuity-editor',
    } as const
    const continuity = {
      objectId: 'moon-gate-seal',
      eventId: 'event-moon-seal-transfer',
      storyOrder: 20,
      holderId: 'shen-yan',
      locationId: 'north-ferry',
      quantity: 1,
      condition: 'chipped',
      status: 'in-use',
      currentChange: '沈砚从林使手中接过月门印',
      consequence: '沈砚可以在洪季限行期间进入北渡口',
    } as const
    const sourceRange = {
      anchorId: 'anchor-object-transfer',
      sourceId: 'chapter-object-transfer',
      start: 8,
      end: 38,
      contentHash: 'o'.repeat(64),
    }
    const continuityFact = {
      kind: 'object-state' as const,
      targetId: 'object-entry-moon-seal-transfer',
      field: 'continuity',
      value: continuity,
      sourceRevision: 2,
      sourceDeltaId: 'object-moon-seal-transfer-r2',
      sourceAnchorIds: ['anchor-object-transfer'],
      provenance,
    }
    const otherObjectFact = {
      ...continuityFact,
      targetId: 'object-entry-silver-sand-delivery',
      value: {
        ...continuity,
        objectId: 'silver-sand-crate',
        eventId: 'event-silver-sand-delivery',
        storyOrder: 15,
        holderId: 'market-guild',
        locationId: 'south-market',
        quantity: 6,
        condition: 'dry',
        status: 'stored',
      },
      sourceDeltaId: 'object-silver-sand-r2',
    }
    const legacyFact = {
      kind: 'object-state' as const,
      targetId: 'object-entry-moon-seal-legacy',
      field: 'continuity',
      value: '月门印现在由沈砚持有',
      sourceRevision: 2,
      sourceDeltaId: 'object-moon-seal-legacy-r2',
      sourceAnchorIds: ['anchor-object-transfer'],
      provenance,
    }
    const objectContinuity = {
      objectId: 'moon-gate-seal',
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      entries: [{
        entryId: 'object-entry-moon-seal-transfer',
        continuity,
        sourceRevision: 2,
        sourceDeltaId: 'object-moon-seal-transfer-r2',
        sourceAnchorIds: ['anchor-object-transfer'],
        sourceRanges: [sourceRange],
        provenance,
      }],
    } as const
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-object-continuity',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        objectContinuity,
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-object-continuity',
              workspaceId,
              cwd: 'C:/novels/object-continuity',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          retrieve,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-object-continuity',
              workspaceId,
              revision: 2,
              facts: [continuityFact, otherObjectFact, legacyFact],
              entities: [continuityFact, otherObjectFact, legacyFact].map(fact => ({
                kind: fact.kind,
                targetId: fact.targetId,
                fields: { [fact.field]: fact.value },
                fieldSources: {},
                sourceRevision: fact.sourceRevision,
                sourceDeltaId: fact.sourceDeltaId,
                sourceAnchorIds: fact.sourceAnchorIds,
                provenance: fact.provenance,
              })),
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const target = container.querySelector<HTMLSelectElement>('[aria-label="Object continuity ledger object"]')
      expect([...target?.options ?? []].map(option => option.value)).toEqual([
        'moon-gate-seal',
        'silver-sand-crate',
      ])
      const build = container.querySelector<HTMLButtonElement>('[data-build-object-continuity]')
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        objectId: 'moon-gate-seal',
      })
      const ledger = container.querySelector('[data-object-continuity]')
      expect(ledger?.textContent).toContain('R2 · head R2 · current')
      expect(ledger?.textContent).toContain('物件：moon-gate-seal')
      const rendered = container.querySelector('[data-object-continuity-entry="object-entry-moon-seal-transfer"]')
      expect(rendered?.textContent).toContain('event-moon-seal-transfer · story order 20')
      expect(rendered?.textContent).toContain('持有者：shen-yan')
      expect(rendered?.textContent).toContain('地点：north-ferry')
      expect(rendered?.textContent).toContain('数量：1')
      expect(rendered?.textContent).toContain('状态：chipped')
      expect(rendered?.textContent).toContain('状态：in-use')
      expect(rendered?.textContent).toContain('当前变化：沈砚从林使手中接过月门印')
      expect(rendered?.textContent).toContain('后果：沈砚可以在洪季限行期间进入北渡口')
      expect(rendered?.textContent).toContain('anchor-object-transfer')
      expect(rendered?.textContent).toContain('continuity-editor')
      expect(ledger?.textContent).not.toContain('月门印现在由沈砚持有')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('builds one typed emotion continuity ledger in the existing Canon view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-emotion-continuity'
    const provenance = {
      taskId: 'task-emotion-continuity',
      sessionId: SESSION_ID,
      producer: 'emotion-editor',
    } as const
    const episode = {
      characterId: 'shen-yan',
      eventId: 'event-warning-bell',
      storyOrder: 20,
      trigger: '月门警钟骤响',
      object: 'moon-gate',
      appraisal: '故人的隐瞒已经造成现实危险',
      emotions: [
        { label: '恐惧', intensity: 0.7 },
        { label: '愤怒', intensity: 0.6 },
      ],
      bodilyExpression: '呼吸骤停后握紧门闩',
      actionTendency: '追赶故人质问',
      expression: '提高音量命令封锁月门',
      suppression: '克制住立即追赶',
      coping: '先执行封锁步骤',
      residue: '戒备被重新激活并转为不信任',
      reactivatesEpisodeIds: ['emotion-return'],
      downstreamChoices: ['优先封锁月门', '暂缓追赶故人'],
    } as const
    const sourceRange = {
      anchorId: 'anchor-emotion-warning',
      sourceId: 'chapter-emotion-warning',
      start: 6,
      end: 28,
      contentHash: 'e'.repeat(64),
    }
    const episodeFact = {
      kind: 'emotion-state' as const,
      targetId: 'emotion-warning',
      field: 'episode',
      value: episode,
      sourceRevision: 2,
      sourceDeltaId: 'emotion-warning-episode-r2',
      sourceAnchorIds: ['anchor-emotion-warning'],
      provenance,
    }
    const otherEpisodeFact = {
      ...episodeFact,
      targetId: 'emotion-other',
      value: { ...episode, characterId: 'gu-linchuan' },
      sourceDeltaId: 'emotion-other-episode-r2',
    }
    const legacyFact = {
      kind: 'emotion-state' as const,
      targetId: 'shen-yan@event-warning-bell',
      field: 'felt',
      value: '恐惧中夹着愤怒',
      sourceRevision: 2,
      sourceDeltaId: 'emotion-legacy-felt-r2',
      sourceAnchorIds: ['anchor-emotion-warning'],
      provenance,
    }
    const emotionContinuity = {
      characterId: 'shen-yan',
      revision: 2,
      headRevision: 2,
      freshness: 'current' as const,
      episodes: [{
        episodeId: 'emotion-warning',
        episode,
        sourceRevision: 2,
        sourceDeltaId: 'emotion-warning-episode-r2',
        sourceAnchorIds: ['anchor-emotion-warning'],
        sourceRanges: [sourceRange],
        provenance,
      }],
    } as const
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-emotion-continuity',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        emotionContinuity,
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-emotion-continuity',
              workspaceId,
              cwd: 'C:/novels/emotion-continuity',
              acceptedRevision: 2,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          retrieve,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-emotion-continuity',
              workspaceId,
              revision: 2,
              facts: [episodeFact, otherEpisodeFact, legacyFact],
              entities: [{
                kind: 'emotion-state',
                targetId: 'emotion-warning',
                fields: { episode },
                fieldSources: {},
                sourceRevision: 2,
                sourceDeltaId: 'emotion-warning-episode-r2',
                sourceAnchorIds: ['anchor-emotion-warning'],
                provenance,
              }, {
                kind: 'emotion-state',
                targetId: 'emotion-other',
                fields: { episode: otherEpisodeFact.value },
                fieldSources: {},
                sourceRevision: 2,
                sourceDeltaId: 'emotion-other-episode-r2',
                sourceAnchorIds: ['anchor-emotion-warning'],
                provenance,
              }, {
                kind: 'emotion-state',
                targetId: legacyFact.targetId,
                fields: { felt: legacyFact.value },
                fieldSources: {},
                sourceRevision: 2,
                sourceDeltaId: legacyFact.sourceDeltaId,
                sourceAnchorIds: ['anchor-emotion-warning'],
                provenance,
              }],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const target = container.querySelector<HTMLSelectElement>('[aria-label="Emotion continuity character"]')
      expect([...target?.options ?? []].map(option => option.value)).toEqual([
        'gu-linchuan',
        'shen-yan',
      ])
      await act(async () => {
        if (target !== null) {
          target.value = 'shen-yan'
          target.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      const build = container.querySelector<HTMLButtonElement>('[data-build-emotion-continuity]')
      await act(async () => {
        build?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        emotionCharacterId: 'shen-yan',
      })
      const ledger = container.querySelector('[data-emotion-continuity]')
      expect(ledger?.textContent).toContain('R2 · head R2 · current')
      expect(ledger?.textContent).toContain('人物：shen-yan')
      const renderedEpisode = container.querySelector('[data-emotion-episode="emotion-warning"]')
      expect(renderedEpisode?.textContent).toContain('event-warning-bell · story order 20')
      expect(renderedEpisode?.textContent).toContain('触发：月门警钟骤响')
      expect(renderedEpisode?.textContent).toContain('恐惧 0.7')
      expect(renderedEpisode?.textContent).toContain('愤怒 0.6')
      expect(renderedEpisode?.textContent).toContain('压抑：克制住立即追赶')
      expect(renderedEpisode?.textContent).toContain('余留：戒备被重新激活并转为不信任')
      expect(renderedEpisode?.textContent).toContain('重新激活：emotion-return')
      expect(renderedEpisode?.textContent).toContain('后续选择：优先封锁月门 · 暂缓追赶故人')
      expect(renderedEpisode?.textContent).toContain('anchor-emotion-warning')
      expect(renderedEpisode?.textContent).toContain('emotion-editor')
      expect(ledger?.textContent).not.toContain('恐惧中夹着愤怒')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('gives each rollback action a revision-specific accessible name', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-rollback-names'
    const revisions = [1, 2, 3].map(revision => ({
      revision,
      parentRevision: revision - 1,
      packetId: `packet-r${String(revision)}`,
      manuscript: {
        unitId: 'chapter-1',
        title: `第${String(revision)}版`,
        text: `正文 R${String(revision)}`,
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance: {
        taskId: `task-r${String(revision)}`,
        sessionId: SESSION_ID,
        producer: 'writer',
      },
      authorization: {
        kind: 'author',
        actorId: 'author-1',
        decisionId: `decision-r${String(revision)}`,
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-rollback-names',
              workspaceId,
              cwd: 'C:/novels/rollback-names',
              acceptedRevision: 3,
            },
          })),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revisions[revision - 1],
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-rollback-names',
              workspaceId,
              revision: 3,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const rollbackNames = [...container.querySelectorAll<HTMLButtonElement>(
        '[data-rollback-revision]',
      )].map(button => button.getAttribute('aria-label'))
      expect(rollbackNames).toEqual([
        '回滚到 R1',
        '回滚到 R2',
      ])
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('compares an accepted revision with the current head in the existing revision history', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-revision-comparison'
    const revisions = [1, 2].map(revision => ({
      revision,
      parentRevision: revision - 1,
      packetId: `packet-compare-r${String(revision)}`,
      manuscript: {
        unitId: 'chapter-1',
        title: `第一章 R${String(revision)}`,
        text: `正文 R${String(revision)}`,
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance: {
        taskId: `task-compare-r${String(revision)}`,
        sessionId: SESSION_ID,
        producer: 'writer',
      },
      authorization: {
        kind: 'author',
        actorId: 'author-1',
        decisionId: `decision-compare-r${String(revision)}`,
      },
    } as const))
    const revisionImpact = {
      fromRevision: 1,
      toRevision: 2,
      manuscripts: {
        added: [],
        removed: [],
        changed: [{
          before: { manuscript: revisions[0]?.manuscript, sourceRevision: 1 },
          after: { manuscript: revisions[1]?.manuscript, sourceRevision: 2 },
        }],
      },
      canonFacts: {
        added: [{ id: 'canon-door-state', value: 'open' }],
        removed: [],
        changed: [],
      },
      narrativeUnits: {
        added: [{ id: 'scene-door-crossing', level: 'scene', title: '跨过门槛' }],
        removed: [],
        changed: [],
      },
      clockEntries: {
        added: [{ id: 'clock-plot-door', clock: 'plot', summary: '主角进入旧庭' }],
        removed: [],
        changed: [],
      },
      debts: {
        added: [{ id: 'debt-door-origin', clock: 'mystery', summary: '解释门的来历' }],
        removed: [],
        changed: [],
      },
      causalConsequences: [{
        sourceEventId: 'event-open-door',
        added: [{ eventId: 'event-enter-courtyard', summary: '进入旧庭' }],
        removed: [],
      }],
    } as const
    const retrieve = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-revision-comparison',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        revisionImpact,
      },
    } as const))
    const reviewResultPacket = vi.fn()
    const rollbackRevision = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-revision-comparison',
              workspaceId,
              cwd: 'C:/novels/revision-comparison',
              acceptedRevision: 2,
            },
          })),
          retrieve,
          reviewResultPacket,
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revisions[revision - 1],
          })),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-revision-comparison',
              workspaceId,
              revision: 2,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const compare = container.querySelector<HTMLButtonElement>(
        '[data-compare-revision="1"]',
      )
      expect(compare?.textContent).toBe('与当前 R2')
      await act(async () => {
        compare?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieve).toHaveBeenCalledOnce()
      expect(retrieve).toHaveBeenCalledWith(workspaceId, {
        revision: 2,
        compareRevision: 1,
      })
      const comparison = container.querySelector('[data-accepted-revision-comparison]')
      expect(comparison?.textContent).toContain('R1 → R2')
      expect(comparison?.textContent).toContain('manuscripts')
      expect(comparison?.textContent).toContain('chapter-1')
      expect(comparison?.textContent).toContain('canonFacts')
      expect(comparison?.textContent).toContain('canon-door-state')
      expect(comparison?.textContent).toContain('narrativeUnits')
      expect(comparison?.textContent).toContain('scene-door-crossing')
      expect(comparison?.textContent).toContain('clockEntries')
      expect(comparison?.textContent).toContain('clock-plot-door')
      expect(comparison?.textContent).toContain('debts')
      expect(comparison?.textContent).toContain('debt-door-origin')
      expect(comparison?.textContent).toContain('causalConsequences')
      expect(comparison?.textContent).toContain('event-enter-courtyard')
      expect(reviewResultPacket).not.toHaveBeenCalled()
      expect(rollbackRevision).not.toHaveBeenCalled()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('discards an in-flight accepted revision comparison after the head refreshes', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-stale-revision-comparison'
    let headRevision = 2
    const revisions = [1, 2, 3].map(revision => ({
      revision,
      parentRevision: revision - 1,
      packetId: `packet-stale-compare-r${String(revision)}`,
      manuscript: {
        unitId: 'chapter-1',
        title: `第一章 R${String(revision)}`,
        text: `正文 R${String(revision)}`,
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance: {
        taskId: `task-stale-compare-r${String(revision)}`,
        sessionId: SESSION_ID,
        producer: 'writer',
      },
      authorization: {
        kind: 'author',
        actorId: 'author-1',
        decisionId: `decision-stale-compare-r${String(revision)}`,
      },
    } as const))
    const staleResult = {
      ok: true,
      value: {
        projectId: 'project-stale-revision-comparison',
        workspaceId,
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        hits: [],
        revisionImpact: {
          fromRevision: 1,
          toRevision: 2,
          manuscripts: { added: [], removed: [], changed: [] },
          canonFacts: { added: [], removed: [], changed: [] },
          narrativeUnits: { added: [], removed: [], changed: [] },
          clockEntries: { added: [], removed: [], changed: [] },
          debts: { added: [], removed: [], changed: [] },
          causalConsequences: [],
        },
      },
    } as const
    let resolveRetrieve: ((result: typeof staleResult) => void) | undefined
    const pendingRetrieve = new Promise<typeof staleResult>((resolve) => {
      resolveRetrieve = resolve
    })
    const retrieve = vi.fn(async () => await pendingRetrieve)
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-stale-revision-comparison',
              workspaceId,
              cwd: 'C:/novels/stale-revision-comparison',
              acceptedRevision: headRevision,
            },
          })),
          retrieve,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: revisions[revision - 1],
          })),
          projectCanon: vi.fn(async (_id: unknown, revision: number) => ({
            ok: true,
            value: {
              projectId: 'project-stale-revision-comparison',
              workspaceId,
              revision,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-compare-revision="1"]')?.click()
        await Promise.resolve()
      })
      expect(retrieve).toHaveBeenCalledOnce()

      headRevision = 3
      await act(async () => {
        container.querySelector<HTMLButtonElement>(
          '[aria-label="刷新小说工作台"]',
        )?.click()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(container.textContent).toContain('当前版本 3')

      await act(async () => {
        resolveRetrieve?.(staleResult)
        await pendingRetrieve
        await Promise.resolve()
      })
      expect(container.querySelector('[data-accepted-revision-comparison]')).toBeNull()
    } finally {
      resolveRetrieve?.(staleResult)
      await pendingRetrieve
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('applies exhaustive per-item 提案 decisions through the real panel action', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-result-packet'
    const packet = {
      packetId: 'packet-review',
      expectedRevision: 0,
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章 雪夜归来',
        text: '她推开门，看见雪落满旧庭。',
      },
      manuscriptDiff: {
        format: 'unified',
        text: '--- accepted/chapter-1\n+++ draft/chapter-1\n+她推开门，看见雪落满旧庭。',
      },
      deltas: [{
        id: 'delta-return',
        kind: 'story-event',
        operation: 'set',
        targetId: 'event-return',
        field: 'summary',
        value: '主角雪夜归来',
        sourceAnchorIds: ['anchor-return'],
      }],
      issues: [{
        id: 'issue-continuity',
        dimension: 'continuity',
        severity: 'major',
        problem: '旧庭积雪与上一场景的暴雨时间线冲突',
        suggestion: '补充入夜后降温转雪的过渡句',
        sourceAnchorIds: ['anchor-return'],
      }],
      sourceAnchors: [{
        id: 'anchor-return',
        sourceId: 'chapter-1',
        start: 0,
        end: 14,
        contentHash: 'a'.repeat(64),
      }],
      provenance: {
        taskId: 'task-review',
        sessionId: SESSION_ID,
        producer: 'writer',
      },
    } as const
    const opened = {
      ok: true,
      value: {
        id: 'project-result-packet',
        workspaceId,
        cwd: 'C:/novels/snow',
        acceptedRevision: 0,
      },
    } as const
    const canonAtZero = {
      ok: true,
      value: {
        projectId: opened.value.id,
        workspaceId,
        revision: 0,
        facts: [],
        entities: [],
      },
    } as const
    const accepted = {
      ok: true,
      value: {
        revision: 1,
        parentRevision: 0,
        packetId: packet.packetId,
        manuscript: packet.manuscript,
        deltas: packet.deltas,
        issues: packet.issues,
        decisions: [
          { itemType: 'manuscript', itemId: 'chapter-1', outcome: 'accept' },
          { itemType: 'delta', itemId: 'delta-return', outcome: 'accept' },
          {
            itemType: 'issue',
            itemId: 'issue-continuity',
            outcome: 'reject',
            reason: '保留为下一轮修订任务',
          },
        ],
        sourceAnchors: packet.sourceAnchors,
        provenance: packet.provenance,
        authorization: {
          kind: 'author',
          actorId: 'novel-owner-result-packet',
          decisionId: 'host-decision-review',
        },
      },
    } as const
    const decisions = accepted.value.decisions
    const canonAtOne = {
      ok: true,
      value: {
        projectId: opened.value.id,
        workspaceId,
        revision: 1,
        facts: [{
          kind: 'story-event',
          targetId: 'event-return',
          field: 'summary',
          value: '主角雪夜归来',
          sourceRevision: 1,
          sourceDeltaId: 'delta-return',
          sourceAnchorIds: ['anchor-return'],
          provenance: packet.provenance,
        }],
        entities: [{
          kind: 'story-event',
          targetId: 'event-return',
          fields: { summary: '主角雪夜归来' },
          fieldSources: {
            summary: {
              value: '主角雪夜归来',
              sourceRevision: 1,
              sourceDeltaId: 'delta-return',
              sourceAnchorIds: ['anchor-return'],
              provenance: packet.provenance,
            },
          },
          sourceRevision: 1,
          sourceDeltaId: 'delta-return',
          sourceAnchorIds: ['anchor-return'],
          provenance: packet.provenance,
        }],
      },
    } as const
    const reviewResultPacket = vi.fn(async () => accepted)
    let resolveRefresh: ((value: typeof opened) => void) | undefined
    const refreshOpened = new Promise<typeof opened>((resolve) => {
      resolveRefresh = resolve
    })
    const openProject = vi.fn()
      .mockResolvedValueOnce(opened)
      .mockImplementationOnce(async () => await refreshOpened)
      .mockResolvedValue(opened)
    const projectCanon = vi.fn(async (_id: unknown, revision: number) =>
      revision === 0 ? canonAtZero : canonAtOne)
    const projectNarrative = vi.fn(emptyProjectNarrative)
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject,
          reviewResultPacket,
          readRevision: vi.fn(),
          projectCanon,
          projectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
      })

      const input = container.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="提案 JSON"]',
      )
      expect(input).not.toBeNull()
      if (input === null) throw new Error('提案 JSON input was not rendered')
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          'value',
        )?.set
        setter?.call(input, JSON.stringify({ ...packet, deltas: [null] }))
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      const review = [...container.querySelectorAll('button')]
        .find(button => button.textContent === '解析提案')
      expect(review).toBeDefined()
      await act(async () => { review?.click() })
      expect(container.querySelector('[data-result-packet-review]')).toBeNull()
      expect(container.textContent).toContain('提案审阅失败')

      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          'value',
        )?.set
        setter?.call(input, JSON.stringify(packet))
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await act(async () => { review?.click() })

      expect(container.querySelector('[data-result-packet-review]')?.textContent)
        .toContain('第一章 雪夜归来')
      expect(container.querySelector('[data-result-packet-diff]')?.textContent)
        .toContain('+++ draft/chapter-1')
      expect(container.querySelector('[data-result-packet-delta="delta-return"]')?.textContent)
        .toContain('主角雪夜归来')
      expect(container.querySelector('[data-result-packet-issue="issue-continuity"]')?.textContent)
        .toContain('旧庭积雪与上一场景的暴雨时间线冲突')
      expect(container.querySelector('[data-result-packet-issue="issue-continuity"]')?.textContent)
        .toContain('anchor-return')

      const applyReview = container.querySelector<HTMLButtonElement>(
        '[data-apply-result-packet-review]',
      )
      const acceptDelta = container.querySelector<HTMLButtonElement>(
        '[data-result-packet-decision="delta:delta-return:accept"]',
      )
      const acceptManuscript = container.querySelector<HTMLButtonElement>(
        '[data-result-packet-decision="manuscript:chapter-1:accept"]',
      )
      const rejectIssue = container.querySelector<HTMLButtonElement>(
        '[data-result-packet-decision="issue:issue-continuity:reject"]',
      )
      const issueReason = container.querySelector<HTMLInputElement>(
        '[aria-label="决定理由：issue issue-continuity"]',
      )
      expect(applyReview?.disabled).toBe(true)
      expect(acceptManuscript).not.toBeNull()
      expect(acceptDelta).not.toBeNull()
      expect(rejectIssue).not.toBeNull()
      expect(issueReason).not.toBeNull()
      expect(acceptDelta?.getAttribute('aria-label')).toBe('接受 delta delta-return')
      expect(acceptManuscript?.getAttribute('aria-label')).toBe('接受 manuscript chapter-1')
      expect(rejectIssue?.getAttribute('aria-label')).toBe('拒绝 issue issue-continuity')
      await act(async () => {
        acceptDelta?.click()
        if (issueReason !== null) {
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )?.set
          setter?.call(issueReason, '保留为下一轮修订任务')
          issueReason.dispatchEvent(new Event('input', { bubbles: true }))
        }
      })
      expect(applyReview?.disabled).toBe(true)
      await act(async () => { rejectIssue?.click() })
      expect(applyReview?.disabled).toBe(true)
      await act(async () => { acceptManuscript?.click() })
      expect(applyReview?.disabled).toBe(false)

      const refresh = [...container.querySelectorAll('button')]
        .find(button => button.getAttribute('aria-label') === '刷新小说工作台')
      expect(refresh).toBeDefined()
      await act(async () => { refresh?.click() })
      expect(applyReview?.disabled).toBe(true)
      await act(async () => {
        resolveRefresh?.(opened)
        await refreshOpened
        await Promise.resolve()
      })
      expect(applyReview?.disabled).toBe(false)
      await act(async () => { applyReview?.click() })

      expect(reviewResultPacket).toHaveBeenCalledWith(workspaceId, {
        packet,
        decisions,
      })
      expect(container.textContent).toContain('当前版本 1')
      expect(container.textContent).toContain('Reviewed packet packet-review as R1')
      expect(container.querySelector('[data-canon-fact="story-event:event-return:summary"]')?.textContent)
        .toContain('主角雪夜归来')
      expect(projectNarrative).toHaveBeenLastCalledWith(workspaceId, 1)
      expect(container.querySelector('[data-novel-project-narrative]')?.textContent)
        .toContain('故事结构 · R1')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('previews complete 提案 decisions inside the existing article and clears stale impact on change', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-result-packet-preview'
    const packet = {
      packetId: 'packet-review-preview',
      expectedRevision: 0,
      manuscript: {
        unitId: 'chapter-preview',
        title: '第一章 旧庭来信',
        text: '她拆开旧庭寄来的信，决定赴约。',
      },
      manuscriptDiff: {
        format: 'unified',
        text: '--- accepted/chapter-preview\n+++ draft/chapter-preview\n+她拆开旧庭寄来的信，决定赴约。',
      },
      deltas: [{
        id: 'delta-preview-promise',
        kind: 'promise',
        operation: 'set',
        targetId: 'promise-old-court',
        field: 'summary',
        value: '主角将赴旧庭完成约定',
        sourceAnchorIds: ['anchor-preview-letter'],
      }],
      issues: [{
        id: 'issue-preview-continuity',
        dimension: 'continuity',
        severity: 'minor',
        problem: '信件送达时间需要在下一场交代',
        suggestion: '在赴约路上补一句信使来源',
        sourceAnchorIds: ['anchor-preview-letter'],
      }],
      sourceAnchors: [{
        id: 'anchor-preview-letter',
        sourceId: 'chapter-preview',
        start: 0,
        end: 8,
        contentHash: 'b'.repeat(64),
      }],
      provenance: {
        taskId: 'task-result-packet-preview',
        sessionId: SESSION_ID,
        producer: 'writer',
      },
    } as const
    const decisions = [
      { itemType: 'manuscript', itemId: 'chapter-preview', outcome: 'accept' },
      { itemType: 'delta', itemId: 'delta-preview-promise', outcome: 'accept' },
      { itemType: 'issue', itemId: 'issue-preview-continuity', outcome: 'accept' },
    ] as const
    const previewValue = {
      expectedRevision: 0,
      projectedRevision: 1,
      impact: {
        fromRevision: 0,
        toRevision: 1,
        manuscripts: { added: [], removed: [], changed: [] },
        canonFacts: { added: [], removed: [], changed: [] },
        narrativeUnits: { added: [], removed: [], changed: [] },
        clockEntries: { added: [], removed: [], changed: [] },
        debts: { added: [], removed: [], changed: [] },
        causalConsequences: [],
      },
    } as const
    const previewReview = vi.fn(async () => ({ ok: true, value: previewValue } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-result-packet-preview',
              workspaceId,
              cwd: 'C:/novels/result-packet-preview',
              acceptedRevision: 0,
              canonLocks: [],
            },
          } as const)),
          generateReviewDraft: vi.fn(),
          previewReview,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-result-packet-preview',
              workspaceId,
              revision: 0,
              facts: [],
              entities: [],
            },
          } as const)),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const input = container.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="提案 JSON"]',
      )
      expect(input).not.toBeNull()
      if (input === null) throw new Error('提案 JSON input was not rendered')
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          'value',
        )?.set
        setter?.call(input, JSON.stringify(packet))
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      const review = [...container.querySelectorAll('button')]
        .find(button => button.textContent === '解析提案')
      await act(async () => { review?.click() })

      const article = container.querySelector<HTMLElement>('[data-result-packet-review]')
      const preview = article?.querySelector<HTMLButtonElement>(
        '[data-preview-result-packet-review]',
      ) ?? null
      expect(article).not.toBeNull()
      expect(preview).not.toBeNull()
      expect(preview?.disabled).toBe(true)

      await act(async () => {
        article?.querySelector<HTMLButtonElement>(
          '[data-accept-all-result-packet-items]',
        )?.click()
      })
      expect(preview?.disabled).toBe(false)
      await act(async () => {
        preview?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(previewReview).toHaveBeenCalledWith(workspaceId, {
        packet,
        decisions,
      })
      const impact = article?.querySelector<HTMLElement>(
        '[data-result-packet-review-impact]',
      ) ?? null
      expect(impact).not.toBeNull()
      expect(impact?.textContent).toContain('R0 → R1')
      expect(impact?.textContent).toContain('正文 · 1 项接受 · 0 项拒绝')
      expect(impact?.textContent).toContain('设定变更 · 1 项接受 · 0 项拒绝')
      expect(impact?.textContent).toContain('审阅问题 · 1 项接受 · 0 项拒绝')
      expect(impact?.textContent).toContain('causalConsequences')
      expect(container.querySelector('[data-result-packet-review-impact]')).toBe(impact)

      await act(async () => {
        article?.querySelector<HTMLButtonElement>(
          '[data-result-packet-decision="issue:issue-preview-continuity:reject"]',
        )?.click()
      })
      expect(article?.querySelector('[data-result-packet-review-impact]')).toBeNull()

      let resolveStalePreview: ((value: {
        readonly ok: true
        readonly value: typeof previewValue
      }) => void) | undefined
      previewReview.mockImplementationOnce(async () => await new Promise((resolve) => {
        resolveStalePreview = resolve
      }))
      await act(async () => {
        preview?.click()
        await Promise.resolve()
      })
      await act(async () => {
        article?.querySelector<HTMLButtonElement>(
          '[data-result-packet-decision="issue:issue-preview-continuity:accept"]',
        )?.click()
      })
      await act(async () => {
        resolveStalePreview?.({ ok: true, value: previewValue })
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(article?.querySelector('[data-result-packet-review-impact]')).toBeNull()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it.each([
    'propose_novel_result_packet',
    'propose_novel_import',
  ])('opens the latest %s Tool 提案 in the existing review and Apply path', async (toolName) => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-write-proposal'
    const packet = {
      packetId: 'packet-write-proposal-r2',
      expectedRevision: 1,
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章 雪夜归来',
        text: '她推开门，看见雪落满旧庭，灯下却坐着失踪三年的兄长。',
      },
      manuscriptDiff: {
        format: 'unified',
        text: [
          '--- accepted/chapter-1',
          '+++ draft/chapter-1',
          '@@ -1 +1 @@',
          '-她推开门，看见雪落满旧庭。',
          '+她推开门，看见雪落满旧庭，灯下却坐着失踪三年的兄长。',
        ].join('\n'),
      },
      deltas: [],
      issues: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-write-proposal-r2',
        sessionId: SESSION_ID,
        producer: 'novel-writer-agent',
      },
    } as const
    const reviewResultPacket = vi.fn(async (
      _workspaceId: unknown,
      _review: { readonly packet: typeof packet; readonly decisions: readonly unknown[] },
    ) => ({
      ok: true,
      value: {
        revision: 2,
        parentRevision: 1,
        packetId: packet.packetId,
        manuscript: packet.manuscript,
        deltas: [],
        issues: [],
        decisions: [],
        sourceAnchors: [],
        provenance: packet.provenance,
        authorization: {
          kind: 'author',
          actorId: SESSION_ID,
          decisionId: 'decision-write-proposal-r2',
        },
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: legacyChatSelector({
            nodes: [{
              kind: 'tool-result',
              seq: 12,
              time: 0,
              callId: 'write-proposal-r2',
              call: {
                name: toolName,
                argsRaw: JSON.stringify({ packet }),
              },
              callTime: 0,
              content: [{ type: 'text', text: JSON.stringify(packet) }],
              isError: false,
              callView: null,
              resultView: null,
              subCalls: [],
            }],
          }),
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-write-proposal',
              workspaceId,
              cwd: 'C:/novels/write-proposal',
              acceptedRevision: 1,
            },
          })),
          reviewResultPacket,
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-write-proposal',
              workspaceId,
              revision: 1,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(container.querySelector('[data-result-packet-review]')?.textContent)
        .toContain('packet-write-proposal-r2')
      expect(container.querySelector('[data-result-packet-review]')?.textContent)
        .toContain('等待作者决定')
      const applyReview = container.querySelector<HTMLButtonElement>(
        '[data-apply-result-packet-review]',
      )
      const acceptManuscript = container.querySelector<HTMLButtonElement>(
        '[data-result-packet-decision="manuscript:chapter-1:accept"]',
      )
      expect(applyReview?.disabled).toBe(true)
      await act(async () => { acceptManuscript?.click() })
      expect(applyReview?.disabled).toBe(false)
      await act(async () => {
        applyReview?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(reviewResultPacket).toHaveBeenCalledWith(workspaceId, {
        packet,
        decisions: [{
          itemType: 'manuscript',
          itemId: 'chapter-1',
          outcome: 'accept',
        }],
      })
      expect(reviewResultPacket.mock.calls[0]?.[1].packet).not.toHaveProperty('authorization')
      expect(container.textContent).toContain('当前版本 2')
      expect(container.querySelector('[data-result-packet-review]')).toBeNull()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('loads the durable proposal inbox without scraping the chat transcript', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-proposal-inbox'
    const packet = {
      packetId: 'packet-proposal-inbox',
      expectedRevision: 1,
      manuscript: {
        unitId: 'chapter-2',
        title: '第二章 潮声',
        text: '潮声从第七码头的铁皮顶下退去，她终于看见那盏熄灭的灯。',
      },
      deltas: [],
      issues: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-proposal-inbox',
        sessionId: SESSION_ID,
        producer: 'novel-writer-agent',
      },
    } as const
    const pendingProposals = vi.fn(async () => ({
      ok: true,
      value: [{
        packetId: packet.packetId,
        receivedAt: 1_780_000_000_000,
        producer: packet.provenance.producer,
        packet,
      }],
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-proposal-inbox',
              workspaceId,
              cwd: 'C:/novels/proposal-inbox',
              acceptedRevision: 1,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-proposal-inbox',
              workspaceId,
              revision: 1,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
          pendingProposals,
          discardProposal: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(pendingProposals).toHaveBeenCalledWith(workspaceId)
      expect(container.querySelector('[data-result-packet-review]')?.textContent)
        .toContain('packet-proposal-inbox')
      expect(container.querySelector('[data-result-packet-review]')?.textContent)
        .toContain('潮声从第七码头的铁皮顶下退去')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('switches between the author views and keeps engineering detail hidden until asked', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-panel-views'
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-panel-views',
              workspaceId,
              cwd: 'C:/novels/panel-views',
              acceptedRevision: 1,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-panel-views',
              workspaceId,
              revision: 1,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
          pendingProposals: vi.fn(async () => ({ ok: true, value: [] } as const)),
          discardProposal: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const view = (name: string) =>
        container.querySelector(`[data-novel-view="${name}"]`)
      expect(view('writing')).not.toBeNull()
      expect(view('writing')?.hasAttribute('hidden')).toBe(false)
      expect(view('overview')?.hasAttribute('hidden')).toBe(true)
      expect(view('history')?.hasAttribute('hidden')).toBe(true)
      expect(view('engineering')?.hasAttribute('hidden')).toBe(true)
      // Engineering sections stay mounted so their content survives view switches.
      expect(container.querySelector('[data-novel-project-canon]')).not.toBeNull()

      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-novel-view-tab="engineering"]')?.click()
      })
      expect(view('engineering')?.hasAttribute('hidden')).toBe(false)
      expect(view('writing')?.hasAttribute('hidden')).toBe(true)

      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-novel-view-tab="writing"]')?.click()
      })
      expect(view('writing')?.hasAttribute('hidden')).toBe(false)
      expect(view('engineering')?.hasAttribute('hidden')).toBe(true)
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders the authored proposal in plain language and applies it through the two-step chapter card', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-proposal-plain'
    const packet = {
      packetId: 'packet-proposal-plain',
      expectedRevision: 0,
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章 旧庭来信',
        text: '她拆开旧庭寄来的信，决定赴约。',
      },
      deltas: [{
        id: 'delta-plain-promise',
        kind: 'promise',
        operation: 'set',
        targetId: 'promise-old-court',
        field: 'summary',
        value: '主角将赴旧庭完成约定',
        sourceAnchorIds: ['anchor-plain-letter'],
      }],
      issues: [{
        id: 'issue-plain-continuity',
        dimension: 'continuity',
        severity: 'minor',
        problem: '信件送达时间需要在下一场交代',
        suggestion: '在赴约路上补一句信使来源',
        sourceAnchorIds: ['anchor-plain-letter'],
      }],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-proposal-plain',
        sessionId: SESSION_ID,
        producer: 'writer',
      },
    } as const
    const previewReview = vi.fn(async () => ({
      ok: true,
      value: {
        expectedRevision: 0,
        projectedRevision: 1,
        impact: {
          fromRevision: 0,
          toRevision: 1,
          manuscripts: { added: [], removed: [], changed: [] },
          canonFacts: { added: [], removed: [], changed: [] },
          narrativeUnits: { added: [], removed: [], changed: [] },
          clockEntries: { added: [], removed: [], changed: [] },
          debts: { added: [], removed: [], changed: [] },
          causalConsequences: [],
        },
      },
    } as const))
    const reviewResultPacket = vi.fn(async () => ({
      ok: true,
      value: {
        revision: 1,
        parentRevision: 0,
        packetId: packet.packetId,
        manuscript: packet.manuscript,
        deltas: packet.deltas,
        issues: packet.issues,
        decisions: [
          { itemType: 'manuscript', itemId: 'chapter-1', outcome: 'accept' },
          { itemType: 'delta', itemId: 'delta-plain-promise', outcome: 'accept' },
          { itemType: 'issue', itemId: 'issue-plain-continuity', outcome: 'accept' },
        ],
        sourceAnchors: [],
        provenance: packet.provenance,
        authorization: {
          kind: 'author',
          actorId: SESSION_ID,
          decisionId: 'decision-proposal-plain',
        },
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-proposal-plain',
              workspaceId,
              cwd: 'C:/novels/proposal-plain',
              acceptedRevision: 0,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview,
          reviewResultPacket,
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-proposal-plain',
              workspaceId,
              revision: 0,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: vi.fn(async () => ({ ok: true, value: [] } as const)),
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
          pendingProposals: vi.fn(async () => ({
            ok: true,
            value: [{
              packetId: packet.packetId,
              receivedAt: 1_780_000_100_000,
              producer: packet.provenance.producer,
              packet,
            }],
          } as const)),
          discardProposal: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const card = container.querySelector('[data-novel-proposal-card]')
      expect(card).not.toBeNull()
      const summary = container.querySelector('[data-novel-proposal-summary]')
      expect(summary?.textContent).toContain('第一章 旧庭来信')
      expect(summary?.textContent).toContain('1 条设定变更')
      expect(summary?.textContent).toContain('1 个审阅问题')
      expect(summary?.textContent).toContain('更新承诺')
      expect(summary?.textContent).toContain('信件送达时间需要在下一场交代')
      expect(summary?.textContent).toContain('建议：在赴约路上补一句信使来源')
      expect(summary?.textContent).not.toContain('"kind"')
      expect(summary?.textContent).not.toContain('promise-old-court')

      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-novel-accept-chapter]')?.click()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(previewReview).toHaveBeenCalledWith(workspaceId, {
        packet,
        decisions: [
          { itemType: 'manuscript', itemId: 'chapter-1', outcome: 'accept' },
          { itemType: 'delta', itemId: 'delta-plain-promise', outcome: 'accept' },
          { itemType: 'issue', itemId: 'issue-plain-continuity', outcome: 'accept' },
        ],
      })
      const impact = container.querySelector('[data-novel-proposal-impact]')
      expect(impact?.textContent).toContain('R0 → R1')
      expect(impact?.textContent).toContain('正文 1 篇')

      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-novel-confirm-accept]')?.click()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(reviewResultPacket).toHaveBeenCalledWith(workspaceId, {
        packet,
        decisions: [
          { itemType: 'manuscript', itemId: 'chapter-1', outcome: 'accept' },
          { itemType: 'delta', itemId: 'delta-plain-promise', outcome: 'accept' },
          { itemType: 'issue', itemId: 'issue-plain-continuity', outcome: 'accept' },
        ],
      })
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('asks the agent for the next chapter through the DSH input actions', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-continue-writing'
    const chapter = (id: string, order: number) => ({
      id,
      level: 'chapter',
      parentId: 'volume-1',
      order,
      objective: `${id} 目标`,
      entryState: '入口',
      exitState: '出口',
      status: 'planned',
      sourceRevision: 1,
      sourceDeltaId: `delta-${id}`,
      sourceAnchorIds: [],
      provenance: {
        taskId: `task-${id}`,
        sessionId: SESSION_ID,
        producer: 'planner',
      },
      delta: {
        id: `delta-${id}`,
        kind: 'narrative-unit',
        operation: 'set',
        targetId: id,
        field: 'unit',
        value: {
          level: 'chapter',
          parentId: 'volume-1',
          order,
          objective: `${id} 目标`,
          entryState: '入口',
          exitState: '出口',
          status: 'planned',
        },
        sourceAnchorIds: [],
      },
    })
    const inputActions = {
      setDraft: vi.fn(),
      addImages: vi.fn(),
      removeImage: vi.fn(),
      pruneImages: vi.fn(),
      submit: vi.fn(),
    }
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          inputActions,
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-continue-writing',
              workspaceId,
              cwd: 'C:/novels/continue-writing',
              acceptedRevision: 1,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-continue-writing',
              workspaceId,
              revision: 1,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: vi.fn(async (_workspace: unknown, revision: number) => ({
            ok: true,
            value: {
              projectId: 'project-continue-writing',
              workspaceId,
              revision,
              units: [chapter('chapter-1', 1), chapter('chapter-2', 2)],
              clocks: NARRATIVE_CLOCKS.map(clock => ({ clock, entries: [], debts: [] })),
            },
          } as const)),
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
          pendingProposals: vi.fn(async () => ({ ok: true, value: [] } as const)),
          discardProposal: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const continueButton = container.querySelector<HTMLButtonElement>('[data-novel-continue-writing]')
      expect(continueButton).not.toBeNull()
      expect(continueButton?.textContent).toContain('继续写第 2 章')

      await act(async () => {
        continueButton?.click()
        await Promise.resolve()
      })
      expect(inputActions.setDraft).toHaveBeenCalledWith(expect.stringContaining('chapter-2'))
      expect(inputActions.setDraft).toHaveBeenCalledWith(expect.stringContaining('第 2 章'))
      expect(inputActions.submit).toHaveBeenCalledTimes(1)
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('summarizes the story overview and revision history in plain language', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-story-overview'
    const chapterUnit = (id: string, order: number) => ({
      id,
      level: 'chapter',
      parentId: 'volume-1',
      order,
      objective: `${id} 目标`,
      entryState: '入口',
      exitState: '出口',
      status: 'planned',
      sourceRevision: 1,
      sourceDeltaId: `delta-${id}`,
      sourceAnchorIds: [],
      provenance: { taskId: `task-${id}`, sessionId: SESSION_ID, producer: 'planner' },
      delta: {
        id: `delta-${id}`,
        kind: 'narrative-unit',
        operation: 'set',
        targetId: id,
        field: 'unit',
        value: {
          level: 'chapter',
          parentId: 'volume-1',
          order,
          objective: `${id} 目标`,
          entryState: '入口',
          exitState: '出口',
          status: 'planned',
        },
        sourceAnchorIds: [],
      },
    })
    const acceptedRevision = {
      revision: 1,
      parentRevision: 0,
      packetId: 'packet-story-r1',
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章 夜航标',
        text: '雾港的灯一盏盏亮起，他握紧了父亲留下的铜钥匙。',
      },
      deltas: [{
        id: 'delta-story-r1',
        kind: 'promise',
        operation: 'set',
        targetId: 'promise-father',
        field: 'summary',
        value: '父亲失踪的真相将在第一卷揭开',
        sourceAnchorIds: [],
      }],
      issues: [],
      decisions: [{ itemType: 'delta', itemId: 'delta-story-r1', outcome: 'accept' }],
      sourceAnchors: [],
      provenance: { taskId: 'task-story-r1', sessionId: SESSION_ID, producer: 'writer' },
      authorization: { kind: 'author', actorId: SESSION_ID, decisionId: 'decision-story-r1' },
    }
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-story-overview',
              workspaceId,
              cwd: 'C:/novels/story-overview',
              acceptedRevision: 1,
            },
          })),
          generateReviewDraft: vi.fn(),
          previewReview: vi.fn(),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async (_workspace: unknown, revision: number) => ({
            ok: true,
            value: revision === 1 ? acceptedRevision : undefined,
          } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-story-overview',
              workspaceId,
              revision: 1,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: vi.fn(async (_workspace: unknown, revision: number) => ({
            ok: true,
            value: {
              projectId: 'project-story-overview',
              workspaceId,
              revision,
              units: [chapterUnit('chapter-1', 1), chapterUnit('chapter-2', 2)],
              clocks: NARRATIVE_CLOCKS.map(clock => ({
                clock,
                entries: [],
                debts: clock === 'plot'
                  ? [{
                      id: 'debt-father',
                      unitId: 'chapter-1',
                      clock: 'plot',
                      summary: '父亲失踪的真相',
                      status: 'open',
                      sourceRevision: 1,
                      sourceDeltaId: 'delta-debt-father',
                      sourceAnchorIds: [],
                      provenance: {
                        taskId: 'task-debt-father',
                        sessionId: SESSION_ID,
                        producer: 'planner',
                      },
                      delta: {
                        id: 'delta-debt-father',
                        kind: 'narrative-debt',
                        operation: 'set',
                        targetId: 'debt-father',
                        field: 'plot',
                        value: {
                          summary: '父亲失踪的真相',
                          status: 'open',
                        },
                        sourceAnchorIds: [],
                      },
                    }]
                  : [],
              })),
            },
          } as const)),
          projectManuscripts: vi.fn(async () => ({
            ok: true,
            value: [{
              manuscript: acceptedRevision.manuscript,
              sourceRevision: 1,
              provenance: acceptedRevision.provenance,
            }],
          } as const)),
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
          pendingProposals: vi.fn(async () => ({ ok: true, value: [] } as const)),
          discardProposal: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const statsView = container.querySelector('[data-novel-view="overview"]')
      expect(statsView?.hasAttribute('hidden')).toBe(true)
      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-novel-view-tab="overview"]')?.click()
      })
      expect(statsView?.hasAttribute('hidden')).toBe(false)

      const stats = container.querySelector('[data-novel-overview-stats]')
      expect(stats?.textContent).toContain('已接受章节')
      expect(stats?.textContent).toContain('未收束线索')
      expect(container.querySelector('[data-novel-overview-chapter="chapter-2"]')?.textContent)
        .toContain('待写')
      expect(container.querySelector('[data-novel-overview-chapter="chapter-1"]')?.textContent)
        .toContain('第一章 夜航标')
      expect(container.querySelector('[data-novel-overview-debts]')?.textContent)
        .toContain('父亲失踪的真相')

      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-novel-view-tab="history"]')?.click()
      })
      const historyRow = container.querySelector('[data-novel-history-revision="1"]')
      expect(historyRow?.textContent).toContain('第一章 夜航标')
      expect(historyRow?.textContent).toContain('1 条设定变更')
      expect(historyRow?.querySelector('.np-history-summary')?.textContent)
        .not.toContain('packet-story-r1')
      expect(container.querySelector('[data-accepted-revision-audit="1"]')).not.toBeNull()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('reviews and applies a Canon-only project brief in the existing conversation view', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-project-brief'
    const packet = {
      packetId: 'packet-project-brief',
      expectedRevision: 0,
      deltas: [{
        id: 'profile-genre',
        kind: 'creative-profile',
        operation: 'set',
        targetId: 'project',
        field: 'genreMix',
        value: '东方玄幻 / 悬疑',
        sourceAnchorIds: [],
      }, {
        id: 'contract-experience',
        kind: 'reader-contract',
        operation: 'set',
        targetId: 'project',
        field: 'coreExperience',
        value: '追查旧案时兑现成长与关系承诺',
        sourceAnchorIds: [],
      }],
      issues: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-project-brief',
        sessionId: SESSION_ID,
        producer: 'novel-writer-agent',
      },
    } as const
    const decisions = packet.deltas.map(delta => ({
      itemType: 'delta' as const,
      itemId: delta.id,
      outcome: 'accept' as const,
    }))
    const reviewResultPacket = vi.fn(async () => ({
      ok: true,
      value: {
        revision: 1,
        parentRevision: 0,
        packetId: packet.packetId,
        deltas: packet.deltas,
        issues: [],
        decisions,
        sourceAnchors: [],
        provenance: packet.provenance,
        authorization: {
          kind: 'author',
          actorId: SESSION_ID,
          decisionId: 'decision-project-brief',
        },
      },
    } as const))
    const provenance = packet.provenance
    const projectCanon = vi.fn(async (_id: unknown, revision: number) => ({
      ok: true,
      value: {
        projectId: 'project-project-brief',
        workspaceId,
        revision,
        facts: [],
        entities: revision === 0
          ? []
          : [{
              kind: 'creative-profile',
              targetId: 'project',
              fields: { genreMix: '东方玄幻 / 悬疑' },
              fieldSources: {},
              sourceRevision: 1,
              sourceDeltaId: 'profile-genre',
              sourceAnchorIds: [],
              provenance,
            }, {
              kind: 'reader-contract',
              targetId: 'project',
              fields: { coreExperience: '追查旧案时兑现成长与关系承诺' },
              fieldSources: {},
              sourceRevision: 1,
              sourceDeltaId: 'contract-experience',
              sourceAnchorIds: [],
              provenance,
            }],
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: legacyChatSelector({
            nodes: [{
              kind: 'tool-result',
              seq: 13,
              time: 0,
              callId: 'project-brief-r1',
              call: {
                name: 'propose_novel_result_packet',
                argsRaw: JSON.stringify({ packet }),
              },
              callTime: 0,
              content: [{ type: 'text', text: JSON.stringify(packet) }],
              isError: false,
              callView: null,
              resultView: null,
              subCalls: [],
            }],
          }),
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-project-brief',
              workspaceId,
              cwd: 'C:/novels/project-brief',
              acceptedRevision: 0,
            },
          })),
          reviewResultPacket,
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon,
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: vi.fn(async () => ({ ok: true, value: [] } as const)),
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(container.querySelector('[data-result-packet-canon-only]')?.textContent)
        .toContain('创作画像 / 读者契约')
      expect(container.querySelector('[data-result-packet-manuscript]')).toBeNull()
      expect(container.querySelector('[data-result-packet-diff]')).toBeNull()

      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-accept-all-result-packet-items]')?.click()
      })
      const apply = container.querySelector<HTMLButtonElement>('[data-apply-result-packet-review]')
      expect(apply?.disabled).toBe(false)
      await act(async () => {
        apply?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(reviewResultPacket).toHaveBeenCalledWith(workspaceId, { packet, decisions })
      expect(container.textContent).toContain('立项提案')
      expect(container.querySelector('[data-canon-entity="creative-profile:project"]')?.textContent)
        .toContain('genreMix: 东方玄幻 / 悬疑')
      expect(container.querySelector('[data-canon-entity="reader-contract:project"]')?.textContent)
        .toContain('coreExperience: 追查旧案时兑现成长与关系承诺')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('rejects a revised manuscript while applying its anchored issue without minting browser authorization', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-generated-review'
    const manuscript = {
      unitId: 'chapter-1',
      title: '第一章 雪夜归来',
      text: '她推开门，看见雪落满旧庭。',
    } as const
    const revisedManuscript = {
      ...manuscript,
      text: '她解开门闩，推开门，看见雪落满旧庭。',
    } as const
    const sourceRevision = {
      revision: 1,
      parentRevision: 0,
      packetId: 'packet-source-r1',
      manuscript,
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-source-r1',
        sessionId: SESSION_ID,
        producer: 'writer',
      },
      authorization: {
        kind: 'author',
        actorId: 'author-1',
        decisionId: 'decision-source-r1',
      },
    } as const
    const draft = {
      packetId: 'review-generated-r1',
      expectedRevision: 1,
      manuscript: revisedManuscript,
      manuscriptDiff: {
        format: 'unified',
        text: [
          '--- accepted/chapter-1',
          '+++ reviewed/chapter-1',
          '@@ -1 +1 @@',
          '-她推开门，看见雪落满旧庭。',
          '+她解开门闩，推开门，看见雪落满旧庭。',
        ].join('\n'),
      },
      deltas: [],
      issues: [{
        id: 'review-generated-r1-issue-1',
        dimension: 'continuity',
        severity: 'major',
        problem: '入门动作缺少与旧庭空间的衔接。',
        suggestion: '补充跨过门槛后的视线变化。',
        sourceAnchorIds: ['review-generated-r1-anchor-1'],
      }],
      sourceAnchors: [{
        id: 'review-generated-r1-anchor-1',
        sourceId: 'chapter-1',
        start: 0,
        end: 4,
        contentHash: 'b'.repeat(64),
      }],
      provenance: {
        taskId: 'review-generated-r1',
        sessionId: SESSION_ID,
        producer: 'novel-reviewer-subagent',
      },
    } as const
    const opened = {
      ok: true,
      value: {
        id: 'project-generated-review',
        workspaceId,
        cwd: 'C:/novels/generated-review',
        acceptedRevision: 1,
      },
    } as const
    const generateReviewDraft = vi.fn(async () => ({ ok: true, value: draft } as const))
    type AppliedReview = {
      readonly packet: typeof draft
      readonly decisions: readonly [{
        readonly itemType: 'manuscript'
        readonly itemId: string
        readonly outcome: 'reject'
        readonly reason: string
      }, {
        readonly itemType: 'issue'
        readonly itemId: string
        readonly outcome: 'accept' | 'reject'
      }]
    }
    const reviewResultPacket = vi.fn(async (_id: unknown, review: AppliedReview) => ({
      ok: true,
      value: {
        revision: 2,
        parentRevision: 1,
        packetId: review.packet.packetId,
        manuscript: review.packet.manuscript,
        deltas: review.packet.deltas,
        issues: review.packet.issues,
        decisions: review.decisions,
        sourceAnchors: review.packet.sourceAnchors,
        provenance: review.packet.provenance,
        authorization: {
          kind: 'author',
          actorId: 'novel-owner-generated-review',
          decisionId: 'host-decision-generated-review',
        },
      },
    } as const))
    const projectCanon = vi.fn(async (_id: unknown, revision: number) => ({
      ok: true,
      value: {
        projectId: opened.value.id,
        workspaceId,
        revision,
        facts: [],
        entities: [],
      },
    } as const))
    const projectManuscripts = vi.fn(async (_id: unknown, revision: number) => ({
      ok: true,
      value: [
        {
          manuscript: {
            unitId: 'chapter-0',
            title: '序章 风雪前夜',
            text: '风雪尚未落下。',
          },
          sourceRevision: 1,
          provenance: sourceRevision.provenance,
        },
        {
          manuscript,
          sourceRevision: revision,
          provenance: sourceRevision.provenance,
        },
      ],
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => opened),
          generateReviewDraft,
          reviewResultPacket,
          readRevision: vi.fn(async () => ({ ok: true, value: sourceRevision } as const)),
          projectCanon,
          projectNarrative: emptyProjectNarrative,
          projectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
      })

      const generate = container.querySelector<HTMLButtonElement>(
        '[data-generate-anchored-review]',
      )
      const manuscriptSelect = container.querySelector<HTMLSelectElement>(
        '[aria-label="审阅正文"]',
      )
      const reviewFocus = container.querySelector<HTMLInputElement>(
        '[aria-label="关注点"]',
      )
      expect(manuscriptSelect?.value).toBe('chapter-0')
      expect(reviewFocus).not.toBeNull()
      expect(manuscriptSelect?.textContent).toContain('序章 风雪前夜')
      expect(manuscriptSelect?.textContent).toContain('第一章 雪夜归来')
      await act(async () => {
        if (manuscriptSelect !== null) {
          manuscriptSelect.value = 'chapter-1'
          manuscriptSelect.dispatchEvent(new Event('change', { bubbles: true }))
        }
        if (reviewFocus !== null) {
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )?.set
          setter?.call(reviewFocus, 'continuity')
          reviewFocus.dispatchEvent(new Event('input', { bubbles: true }))
        }
      })
      expect(manuscriptSelect?.value).toBe('chapter-1')
      expect(reviewFocus?.value).toBe('continuity')
      expect(generate?.textContent).toBe('生成审阅意见')
      await act(async () => {
        generate?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(generateReviewDraft).toHaveBeenCalledWith(
        workspaceId,
        { revision: 1, unitId: 'chapter-1', focus: 'continuity' },
        expect.any(AbortSignal),
      )
      expect(draft).not.toHaveProperty('authorization')
      expect(draft.manuscript.text).not.toBe(manuscript.text)
      expect(draft.manuscriptDiff.text).toContain('@@ -1 +1 @@')
      expect(draft.manuscriptDiff.text).toContain(`-${manuscript.text}`)
      expect(draft.manuscriptDiff.text).toContain(`+${revisedManuscript.text}`)
      expect(container.querySelector('[data-result-packet-issue="review-generated-r1-issue-1"]')
        ?.textContent).toContain('入门动作缺少与旧庭空间的衔接')
      expect(container.querySelector('[data-result-packet-review]')?.textContent)
        .toContain('等待作者决定')

      const rejectManuscript = container.querySelector<HTMLButtonElement>(
        '[data-result-packet-decision="manuscript:chapter-1:reject"]',
      )
      const manuscriptReason = container.querySelector<HTMLInputElement>(
        '[aria-label="决定理由：manuscript chapter-1"]',
      )
      const acceptIssue = container.querySelector<HTMLButtonElement>(
        '[data-result-packet-decision="issue:review-generated-r1-issue-1:accept"]',
      )
      const applyReview = container.querySelector<HTMLButtonElement>(
        '[data-apply-result-packet-review]',
      )
      expect(rejectManuscript).not.toBeNull()
      expect(manuscriptReason).not.toBeNull()
      expect(applyReview?.disabled).toBe(true)
      await act(async () => { acceptIssue?.click() })
      expect(applyReview?.disabled).toBe(true)
      await act(async () => {
        if (manuscriptReason !== null) {
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )?.set
          setter?.call(manuscriptReason, '保留原文，只采纳审校问题。')
          manuscriptReason.dispatchEvent(new Event('input', { bubbles: true }))
        }
        rejectManuscript?.click()
      })
      expect(applyReview?.disabled).toBe(false)
      await act(async () => {
        applyReview?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(reviewResultPacket).toHaveBeenCalledOnce()
      const applied = reviewResultPacket.mock.calls[0]?.[1]
      expect(applied).toEqual({
        packet: draft,
        decisions: [{
          itemType: 'manuscript',
          itemId: 'chapter-1',
          outcome: 'reject',
          reason: '保留原文，只采纳审校问题。',
        }, {
          itemType: 'issue',
          itemId: 'review-generated-r1-issue-1',
          outcome: 'accept',
        }],
      })
      expect(applied?.packet).not.toHaveProperty('authorization')
      expect(JSON.stringify(applied)).not.toContain('actorId')
      expect(JSON.stringify(applied)).not.toContain('decisionId')
      expect(container.textContent).toContain('当前版本 2')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('reports a rejected snapshot load and allows the user to retry', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-load-rejection'
    const opened = {
      ok: true,
      value: {
        id: 'project-load-rejection',
        workspaceId,
        cwd: 'C:/novels/load-rejection',
        acceptedRevision: 0,
      },
    } as const
    const openProject = vi.fn()
      .mockRejectedValueOnce(new Error('transport disconnected'))
      .mockResolvedValue(opened)
    const projectCanon = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: opened.value.id,
        workspaceId,
        revision: 0,
        facts: [],
        entities: [],
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(),
          projectCanon,
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(container.querySelector('[role="alert"]')?.textContent)
        .toContain('小说工作台刷新失败：transport disconnected')
      const refresh = [...container.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.getAttribute('aria-label') === '刷新小说工作台')
      expect(refresh?.disabled).toBe(false)

      await act(async () => {
        refresh?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(openProject).toHaveBeenCalledTimes(2)
      expect(container.textContent).toContain('当前版本 0')
      expect(container.querySelector('[role="alert"]')).toBeNull()
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('keeps the Canon panel available when a domain projection is not installed', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-domain-unavailable'
    const opened = {
      ok: true,
      value: {
        id: 'project-domain-unavailable',
        workspaceId,
        cwd: 'C:/novels/domain-unavailable',
        acceptedRevision: 0,
      },
    } as const
    const projectNarrative = vi.fn(async () => ({
      ok: false,
      error: {
        code: 'gateway/internal',
        message: "novel project has no 'planning/narrative' projector registered; install the domain plugin that registers it",
        details: {},
      },
    } as const))
    const projectRelationships = vi.fn(async () => ({
      ok: false,
      error: {
        code: 'gateway/internal',
        message: "novel project has no 'memory/relationships' projector registered; install the domain plugin that registers it",
        details: {},
      },
    } as const))
    const projectCanon = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: opened.value.id,
        workspaceId,
        revision: 0,
        facts: [],
        entities: [],
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => opened),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(),
          projectCanon,
          projectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(container.querySelector('[role="alert"]')).toBeNull()
      expect(container.textContent).toContain('当前版本 0')
      expect(container.textContent).toContain('故事结构暂不可用')
      expect(container.textContent).toContain('人物关系暂不可用')
      expect(projectNarrative).toHaveBeenCalledTimes(1)
      expect(projectRelationships).toHaveBeenCalledTimes(1)
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('ignores a failed writing-memory rehydration instead of failing the panel', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-memory-unavailable'
    const memoryQuery = { revision: 1, writingMemoryQuery: '旧潮声' }
    const retrieveMemory = vi.fn(async () => ({
      ok: false,
      error: {
        code: 'gateway/internal',
        message: 'novel project requires @novel-agent/novel-memory (Cordis service "novelMemory")',
        details: {},
      },
    } as const))
    const projectCanon = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-memory-unavailable',
        workspaceId,
        revision: 0,
        facts: [],
        entities: [],
      },
    } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: legacyChatSelector({
            nodes: [{
              kind: 'tool-result',
              seq: 20,
              time: 0,
              callId: 'retrieve-writing-memory-unavailable',
              call: { name: 'retrieve_novel_context', argsRaw: JSON.stringify(memoryQuery) },
              callTime: 0,
              content: [{ type: 'text', text: '{}' }],
              isError: false,
              callView: null,
              resultView: null,
              subCalls: [],
            }],
          }),
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-memory-unavailable',
              workspaceId,
              cwd: 'C:/novels/memory-unavailable',
              acceptedRevision: 0,
            },
          } as const)),
          retrieve: retrieveMemory,
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(),
          projectCanon,
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(retrieveMemory).toHaveBeenCalledWith(workspaceId, memoryQuery)
      expect(container.querySelector('[role="alert"]')).toBeNull()
      expect(container.textContent).toContain('当前版本 0')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('handles rejected review and post-review Canon transport failures without stale state', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-review-rejection'
    const packet = {
      packetId: 'packet-review-rejection',
      expectedRevision: 0,
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章',
        text: '她推开门。',
      },
      manuscriptDiff: {
        format: 'unified',
        text: '--- accepted/chapter-1\n+++ draft/chapter-1\n+她推开门。',
      },
      deltas: [],
      issues: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-review-rejection',
        sessionId: SESSION_ID,
        producer: 'writer',
      },
    } as const
    const openProject = vi.fn(async () => ({
      ok: true,
      value: {
        id: 'project-review-rejection',
        workspaceId,
        cwd: 'C:/novels/review-rejection',
        acceptedRevision: 0,
      },
    } as const))
    const projectCanon = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-review-rejection',
        workspaceId,
        revision: 0,
        facts: [],
        entities: [],
      },
    } as const))
    const accepted = {
      ok: true,
      value: {
        revision: 1,
        parentRevision: 0,
        packetId: packet.packetId,
        manuscript: packet.manuscript,
        deltas: packet.deltas,
        issues: packet.issues,
        decisions: [],
        sourceAnchors: packet.sourceAnchors,
        provenance: packet.provenance,
        authorization: {
          kind: 'author',
          actorId: 'novel-owner-review-rejection',
          decisionId: 'host-decision-review-rejection',
        },
      },
    } as const
    const reviewResultPacket = vi.fn()
      .mockRejectedValue(new Error('transport disconnected'))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject,
          reviewResultPacket,
          readRevision: vi.fn(),
          projectCanon,
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
      })
      const input = container.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="提案 JSON"]',
      )
      if (input === null) throw new Error('提案 JSON input was not rendered')
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          'value',
        )?.set
        setter?.call(input, JSON.stringify(packet))
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      const preview = [...container.querySelectorAll('button')]
        .find(button => button.textContent === '解析提案')
      await act(async () => { preview?.click() })
      const applyReview = container.querySelector<HTMLButtonElement>(
        '[data-apply-result-packet-review]',
      )
      await act(async () => {
        container.querySelector<HTMLButtonElement>(
          '[data-accept-all-result-packet-items]',
        )?.click()
      })
      expect(applyReview?.disabled).toBe(false)

      await act(async () => {
        applyReview?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(reviewResultPacket).toHaveBeenCalledTimes(1)
      expect(container.textContent)
        .toContain('提案审阅失败：transport disconnected')
      expect(applyReview?.disabled).toBe(false)
      expect(container.textContent).toContain('当前版本 0')

      reviewResultPacket.mockResolvedValueOnce(accepted)
      projectCanon.mockRejectedValueOnce(new Error('Canon transport disconnected'))
      await act(async () => {
        applyReview?.click()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(container.textContent).toContain('当前版本 1')
      expect(container.textContent)
        .toContain('Reviewed packet packet-review-rejection as R1; 作品事实刷新失败：Canon transport disconnected')
      expect(container.querySelector('[data-result-packet-review]')).toBeNull()
      expect(container.querySelector('[data-novel-project-canon]')?.textContent)
        .toContain('作品事实暂不可用')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('handles rejected rollback and post-rollback Canon transport failures without stale state', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-rollback-rejection'
    const revisionOne = {
      revision: 1,
      parentRevision: 0,
      packetId: 'packet-r1-rejection',
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章',
        text: '她推开门。',
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-r1-rejection',
        sessionId: SESSION_ID,
        producer: 'writer',
      },
      authorization: {
        kind: 'author',
        actorId: 'author-1',
        decisionId: 'decision-r1-rejection',
      },
    } as const
    const revisionTwo = {
      ...revisionOne,
      revision: 2,
      parentRevision: 1,
      packetId: 'packet-r2-rejection',
      manuscript: {
        ...revisionOne.manuscript,
        title: '第二章',
      },
    } as const
    const openProject = vi.fn(async () => ({
      ok: true,
      value: {
        id: 'project-rollback-rejection',
        workspaceId,
        cwd: 'C:/novels/rollback-rejection',
        acceptedRevision: 2,
      },
    } as const))
    const readRevision = vi.fn(async (_workspaceId: unknown, revision: number) => ({
      ok: true,
      value: revision === 1 ? revisionOne : revisionTwo,
    } as const))
    const projectCanon = vi.fn(async () => ({
      ok: true,
      value: {
        projectId: 'project-rollback-rejection',
        workspaceId,
        revision: 2,
        facts: [],
        entities: [],
      },
    } as const))
    const projectNarrative = vi.fn(emptyProjectNarrative)
    const rollbackRevision = vi.fn()
      .mockRejectedValue(new Error('transport disconnected'))
    const rolledBack = {
      ok: true,
      value: {
        ...revisionOne,
        revision: 3,
        parentRevision: 2,
        packetId: 'rollback-r3-rejection',
        rollbackOfRevision: 1,
      },
    } as const
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: useEmptyChat,
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject,
          reviewResultPacket: vi.fn(),
          readRevision,
          projectCanon,
          projectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision,
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
      })
      const rollback = container.querySelector<HTMLButtonElement>(
        '[data-rollback-revision="1"]',
      )
      expect(rollback?.disabled).toBe(false)

      await act(async () => {
        rollback?.click()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(rollbackRevision).toHaveBeenCalledTimes(1)
      expect(container.textContent).toContain('回滚失败：transport disconnected')
      expect(rollback?.disabled).toBe(false)
      expect(container.textContent).toContain('当前版本 2')

      rollbackRevision.mockResolvedValueOnce(rolledBack)
      projectCanon.mockRejectedValueOnce(new Error('Canon transport disconnected'))
      await act(async () => {
        rollback?.click()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(container.textContent).toContain('当前版本 3')
      expect(container.textContent).toContain('第一章')
      expect(container.textContent)
        .toContain('已回滚到 R1 as R3; 作品事实刷新失败：Canon transport disconnected')
      expect(container.querySelector('[data-novel-project-canon]')?.textContent)
        .toContain('作品事实暂不可用')
      expect(projectNarrative).toHaveBeenLastCalledWith(workspaceId, 3)
      expect(container.querySelector('[data-novel-project-narrative]')?.textContent)
        .toContain('故事结构 · R3')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('invalidates an in-flight review and its transient UI when the workspace changes', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    let activeWorkspaceId = 'workspace-a'
    const packet = {
      packetId: 'packet-workspace-a',
      expectedRevision: 0,
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章',
        text: '她推开门。',
      },
      manuscriptDiff: {
        format: 'unified',
        text: '--- accepted/chapter-1\n+++ draft/chapter-1\n+她推开门。',
      },
      deltas: [],
      issues: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-workspace-a',
        sessionId: SESSION_ID,
        producer: 'writer',
      },
    } as const
    const openProject = vi.fn(async (workspaceId: unknown) => ({
      ok: true,
      value: {
        id: `project-${String(workspaceId)}`,
        workspaceId: String(workspaceId),
        cwd: `C:/novels/${String(workspaceId)}`,
        acceptedRevision: 0,
      },
    } as const))
    const projectCanon = vi.fn(async (workspaceId: unknown, revision: number) => ({
      ok: true,
      value: {
        projectId: `project-${String(workspaceId)}`,
        workspaceId: String(workspaceId),
        revision,
        facts: [],
        entities: [],
      },
    } as const))
    let resolveReview: ((value: unknown) => void) | undefined
    const pendingReview = new Promise<unknown>((resolve) => {
      resolveReview = resolve
    })
    const reviewResultPacket = vi.fn(async () => await pendingReview)
    const useWorkspaces = (selector: (state: unknown) => unknown) => selector({
      items: [{ workspaceId: activeWorkspaceId, sessionIds: [SESSION_ID] }],
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const renderPanel = (): void => {
      const panel = createElement(NovelProjectPanel, {
        sessionId: SESSION_ID,
        useChat: useEmptyChat,
        useWorkspaces,
        openProject,
        reviewResultPacket,
        readRevision: vi.fn(),
        projectCanon,
        projectNarrative: emptyProjectNarrative,
        projectManuscripts: defaultProjectManuscripts,
        projectRelationships: emptyProjectRelationships,
        rollbackRevision: vi.fn(),
      } as never)
      root.render(panel as unknown as Parameters<typeof root.render>[0])
    }

    try {
      await act(async () => {
        renderPanel()
        await Promise.resolve()
        await Promise.resolve()
      })
      const input = container.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="提案 JSON"]',
      )
      expect(input).not.toBeNull()
      if (input === null) throw new Error('提案 JSON input was not rendered')
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          'value',
        )?.set
        setter?.call(input, JSON.stringify(packet))
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      const review = [...container.querySelectorAll('button')]
        .find(button => button.textContent === '解析提案')
      await act(async () => { review?.click() })
      const applyReview = container.querySelector<HTMLButtonElement>(
        '[data-apply-result-packet-review]',
      )
      await act(async () => {
        container.querySelector<HTMLButtonElement>(
          '[data-accept-all-result-packet-items]',
        )?.click()
      })
      expect(applyReview?.disabled).toBe(false)
      await act(async () => {
        applyReview?.click()
        await Promise.resolve()
      })
      expect(applyReview?.disabled).toBe(true)

      activeWorkspaceId = 'workspace-b'
      await act(async () => {
        renderPanel()
        await Promise.resolve()
        await Promise.resolve()
      })

      const refresh = [...container.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.getAttribute('aria-label') === '刷新小说工作台')
      expect(openProject).toHaveBeenLastCalledWith('workspace-b')
      expect(refresh?.disabled).toBe(false)
      expect(input.value).toBe('')
      expect(container.querySelector('[data-result-packet-review]')).toBeNull()
    } finally {
      resolveReview?.({
        ok: false,
        error: { code: 'stale', message: 'stale operation', details: {} },
      })
      await pendingReview
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('refreshes a workspace when its stale in-flight review succeeds after returning to it', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    let activeWorkspaceId = 'workspace-a'
    let workspaceARevision = 0
    const packet = {
      packetId: 'packet-workspace-a-success',
      expectedRevision: 0,
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章',
        text: '她推开门。',
      },
      manuscriptDiff: {
        format: 'unified',
        text: '--- accepted/chapter-1\n+++ draft/chapter-1\n+她推开门。',
      },
      deltas: [],
      issues: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-workspace-a-success',
        sessionId: SESSION_ID,
        producer: 'writer',
      },
    } as const
    const accepted = {
      ok: true,
      value: {
        revision: 1,
        parentRevision: 0,
        packetId: packet.packetId,
        manuscript: packet.manuscript,
        deltas: packet.deltas,
        issues: packet.issues,
        decisions: [],
        sourceAnchors: packet.sourceAnchors,
        provenance: packet.provenance,
        authorization: {
          kind: 'author',
          actorId: 'novel-owner-workspace-a-success',
          decisionId: 'host-decision-workspace-a-success',
        },
      },
    } as const
    const openProject = vi.fn(async (workspaceId: unknown) => ({
      ok: true,
      value: {
        id: `project-${String(workspaceId)}`,
        workspaceId: String(workspaceId),
        cwd: `C:/novels/${String(workspaceId)}`,
        acceptedRevision: workspaceId === 'workspace-a' ? workspaceARevision : 0,
      },
    } as const))
    const readRevision = vi.fn(async (workspaceId: unknown, revision: number) => ({
      ok: true,
      value: workspaceId === 'workspace-a' && revision === 1 ? accepted.value : undefined,
    } as const))
    const projectCanon = vi.fn(async (workspaceId: unknown, revision: number) => ({
      ok: true,
      value: {
        projectId: `project-${String(workspaceId)}`,
        workspaceId: String(workspaceId),
        revision,
        facts: [],
        entities: [],
      },
    } as const))
    let resolveReview: ((value: typeof accepted) => void) | undefined
    const pendingReview = new Promise<typeof accepted>((resolve) => {
      resolveReview = resolve
    })
    const reviewResultPacket = vi.fn(async () => await pendingReview)
    const useWorkspaces = (selector: (state: unknown) => unknown) => selector({
      items: [{ workspaceId: activeWorkspaceId, sessionIds: [SESSION_ID] }],
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const renderPanel = (): void => {
      const panel = createElement(NovelProjectPanel, {
        sessionId: SESSION_ID,
        useChat: useEmptyChat,
        useWorkspaces,
        openProject,
        reviewResultPacket,
        readRevision,
        projectCanon,
        projectNarrative: emptyProjectNarrative,
        projectManuscripts: defaultProjectManuscripts,
        projectRelationships: emptyProjectRelationships,
        rollbackRevision: vi.fn(),
      } as never)
      root.render(panel as unknown as Parameters<typeof root.render>[0])
    }

    try {
      await act(async () => {
        renderPanel()
        await Promise.resolve()
        await Promise.resolve()
      })
      const input = container.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="提案 JSON"]',
      )
      expect(input).not.toBeNull()
      if (input === null) throw new Error('提案 JSON input was not rendered')
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          'value',
        )?.set
        setter?.call(input, JSON.stringify(packet))
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      const review = [...container.querySelectorAll('button')]
        .find(button => button.textContent === '解析提案')
      await act(async () => { review?.click() })
      const applyReview = container.querySelector<HTMLButtonElement>(
        '[data-apply-result-packet-review]',
      )
      await act(async () => {
        container.querySelector<HTMLButtonElement>(
          '[data-accept-all-result-packet-items]',
        )?.click()
      })
      expect(applyReview?.disabled).toBe(false)
      await act(async () => {
        applyReview?.click()
        await Promise.resolve()
      })

      activeWorkspaceId = 'workspace-b'
      await act(async () => {
        renderPanel()
        await Promise.resolve()
        await Promise.resolve()
      })
      activeWorkspaceId = 'workspace-a'
      await act(async () => {
        renderPanel()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(container.textContent).toContain('当前版本 0')

      workspaceARevision = 1
      await act(async () => {
        resolveReview?.(accepted)
        await pendingReview
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(openProject.mock.calls
        .filter(([workspaceId]) => workspaceId === 'workspace-a')).toHaveLength(3)
      expect(container.textContent).toContain('当前版本 1')
      expect(container.textContent).toContain('第一章')
    } finally {
      resolveReview?.(accepted)
      await pendingReview
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('refreshes a workspace when its stale in-flight rollback succeeds after returning to it', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    let activeWorkspaceId = 'workspace-a'
    let workspaceARevision = 2
    const revisionOne = {
      revision: 1,
      parentRevision: 0,
      packetId: 'packet-r1',
      manuscript: {
        unitId: 'chapter-1',
        title: '第一章',
        text: '她推开门。',
      },
      deltas: [],
      issues: [],
      decisions: [],
      sourceAnchors: [],
      provenance: {
        taskId: 'task-r1',
        sessionId: SESSION_ID,
        producer: 'writer',
      },
      authorization: {
        kind: 'author',
        actorId: 'author-1',
        decisionId: 'decision-r1',
      },
    } as const
    const revisionTwo = {
      ...revisionOne,
      revision: 2,
      parentRevision: 1,
      packetId: 'packet-r2',
      manuscript: {
        ...revisionOne.manuscript,
        title: '第二章',
        text: '她踏进雪夜。',
      },
    } as const
    const rolledBack = {
      ok: true,
      value: {
        ...revisionOne,
        revision: 3,
        parentRevision: 2,
        packetId: 'rollback-r3',
      },
    } as const
    const openProject = vi.fn(async (workspaceId: unknown) => ({
      ok: true,
      value: {
        id: `project-${String(workspaceId)}`,
        workspaceId: String(workspaceId),
        cwd: `C:/novels/${String(workspaceId)}`,
        acceptedRevision: workspaceId === 'workspace-a' ? workspaceARevision : 0,
      },
    } as const))
    const readRevision = vi.fn(async (workspaceId: unknown, revision: number) => ({
      ok: true,
      value: workspaceId !== 'workspace-a'
        ? undefined
        : revision === 1
          ? revisionOne
          : revision === 2
            ? revisionTwo
            : revision === 3
              ? rolledBack.value
              : undefined,
    } as const))
    const projectCanon = vi.fn(async (workspaceId: unknown, revision: number) => ({
      ok: true,
      value: {
        projectId: `project-${String(workspaceId)}`,
        workspaceId: String(workspaceId),
        revision,
        facts: [],
        entities: [],
      },
    } as const))
    let resolveRollback: ((value: typeof rolledBack) => void) | undefined
    const pendingRollback = new Promise<typeof rolledBack>((resolve) => {
      resolveRollback = resolve
    })
    const rollbackRevision = vi.fn(async (
      _workspaceId: unknown,
      _command: unknown,
    ) => await pendingRollback)
    const useWorkspaces = (selector: (state: unknown) => unknown) => selector({
      items: [{ workspaceId: activeWorkspaceId, sessionIds: [SESSION_ID] }],
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const renderPanel = (): void => {
      const panel = createElement(NovelProjectPanel, {
        sessionId: SESSION_ID,
        useChat: useEmptyChat,
        useWorkspaces,
        openProject,
        reviewResultPacket: vi.fn(),
        readRevision,
        projectCanon,
        projectNarrative: emptyProjectNarrative,
        projectManuscripts: defaultProjectManuscripts,
        projectRelationships: emptyProjectRelationships,
        rollbackRevision,
      } as never)
      root.render(panel as unknown as Parameters<typeof root.render>[0])
    }

    try {
      await act(async () => {
        renderPanel()
        await Promise.resolve()
        await Promise.resolve()
      })
      const rollback = container.querySelector<HTMLButtonElement>(
        '[data-rollback-revision="1"]',
      )
      expect(rollback?.disabled).toBe(false)
      await act(async () => {
        rollback?.click()
        await Promise.resolve()
      })
      expect(rollbackRevision).toHaveBeenCalledTimes(1)
      const rollbackCommand = rollbackRevision.mock.calls[0]?.[1]
      expect(rollbackRevision.mock.calls[0]?.[0]).toBe('workspace-a')
      expect(rollbackCommand).toMatchObject({
        expectedRevision: 2,
        targetRevision: 1,
      })
      expect(rollbackCommand).not.toHaveProperty('authorization')
      expect(JSON.stringify(rollbackCommand)).not.toContain('actorId')
      expect(JSON.stringify(rollbackCommand)).not.toContain('decisionId')

      activeWorkspaceId = 'workspace-b'
      await act(async () => {
        renderPanel()
        await Promise.resolve()
        await Promise.resolve()
      })
      activeWorkspaceId = 'workspace-a'
      await act(async () => {
        renderPanel()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(container.textContent).toContain('当前版本 2')

      workspaceARevision = 3
      await act(async () => {
        resolveRollback?.(rolledBack)
        await pendingRollback
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(openProject.mock.calls
        .filter(([workspaceId]) => workspaceId === 'workspace-a')).toHaveLength(3)
      expect(container.textContent).toContain('当前版本 3')
      expect(container.textContent).toContain('第一章')
    } finally {
      resolveRollback?.(rolledBack)
      await pendingRollback
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it.each(['inline', 'spilled'])('renders complete revision-bound writing memory from a %s Tool Result', async (outputMode) => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-writing-memory-results'
    const provenance = {
      taskId: 'task-writing-memory-r1',
      sessionId: SESSION_ID,
      producer: 'novel-writing-memory',
    } as const
    const sourceEvidence = (
      anchorId: string,
      sourceId: string,
    ) => ({
      sourceRevision: 1,
      sourceRanges: [{
        anchorId,
        sourceId,
        start: 2,
        end: 18,
        contentHash: anchorId.at(-1)!.repeat(64),
      }],
      provenance,
    })
    const evidence = (
      anchorId: string,
      sourceId: string,
      score: number,
      terms: readonly string[],
    ) => ({ score, terms, ...sourceEvidence(anchorId, sourceId) })
    const styleContractFact = {
      kind: 'creative-profile',
      targetId: 'current',
      field: 'style-profile',
      value: {
        profileName: '旧庭悬疑叙事声线',
        voicePrinciples: ['克制陈述，把判断留给动作'],
        viewpoint: { person: '第三人称限知' },
      },
      sourceRevision: 1,
      sourceDeltaId: 'style-contract-r1',
      sourceAnchorIds: ['anchor-style-contract-r1'],
      provenance,
      delta: {
        id: 'style-contract-r1',
        kind: 'creative-profile',
        operation: 'set',
        targetId: 'current',
        field: 'style-profile',
        value: {
          profileName: '旧庭悬疑叙事声线',
          voicePrinciples: ['克制陈述，把判断留给动作'],
          viewpoint: { person: '第三人称限知' },
        },
        sourceAnchorIds: ['anchor-style-contract-r1'],
      },
    } as const
    const readerContractFact = {
      kind: 'reader-contract',
      targetId: 'project',
      field: 'contract-profile',
      value: {
        coreExperience: '追查旧案时持续兑现成长、关系与真相承诺',
        promises: [{ promiseId: 'promise-old-case', statement: '月蚀前交付旧案真相' }],
      },
      sourceRevision: 1,
      sourceDeltaId: 'reader-contract-r1',
      sourceAnchorIds: ['anchor-reader-contract-r1'],
      provenance,
      delta: {
        id: 'reader-contract-r1',
        kind: 'reader-contract',
        operation: 'set',
        targetId: 'project',
        field: 'contract-profile',
        value: {
          coreExperience: '追查旧案时持续兑现成长、关系与真相承诺',
          promises: [{ promiseId: 'promise-old-case', statement: '月蚀前交付旧案真相' }],
        },
        sourceAnchorIds: ['anchor-reader-contract-r1'],
      },
    } as const
    const settingFact = {
      kind: 'location-state',
      targetId: 'lighthouse',
      field: 'old-tide-signal',
      value: '旧潮声是点亮灯塔并开启海门的唯一信号',
      sourceRevision: 1,
      sourceDeltaId: 'setting-lighthouse-r1',
      sourceAnchorIds: ['anchor-setting-r1'],
      provenance,
      delta: {
        id: 'setting-lighthouse-r1',
        kind: 'location-state',
        operation: 'set',
        targetId: 'lighthouse',
        field: 'old-tide-signal',
        value: '旧潮声是点亮灯塔并开启海门的唯一信号',
        sourceAnchorIds: ['anchor-setting-r1'],
      },
    } as const
    const continuityFact = {
      kind: 'story-event',
      targetId: 'event-old-tide',
      field: 'summary',
      value: '沈砚听见旧潮声，灯塔随即亮起',
      sourceRevision: 1,
      sourceDeltaId: 'event-old-tide-r1',
      sourceAnchorIds: ['anchor-event-r1'],
      provenance,
      delta: {
        id: 'event-old-tide-r1',
        kind: 'story-event',
        operation: 'set',
        targetId: 'event-old-tide',
        field: 'summary',
        value: '沈砚听见旧潮声，灯塔随即亮起',
        sourceAnchorIds: ['anchor-event-r1'],
      },
    } as const
    const continuityClock = {
      unitId: 'chapter-1',
      clock: 'reader-knowledge',
      movement: '保留引路人身份的双重解读',
      state: '读者仍不知道谁在海门后回应',
      sourceRevision: 1,
      sourceDeltaId: 'reader-clock-r1',
      sourceAnchorIds: ['anchor-clock-r1'],
      provenance,
      delta: {
        id: 'reader-clock-r1',
        kind: 'narrative-clock',
        operation: 'set',
        targetId: 'chapter-1',
        field: 'reader-knowledge',
        value: {
          movement: '保留引路人身份的双重解读',
          state: '读者仍不知道谁在海门后回应',
          version: 1,
          scope: { unitId: 'chapter-1', level: 'chapter' },
          events: [],
          ambiguityPolicy: { mode: 'preserve', description: '保持双重解读' },
          revisionRationale: null,
        },
        sourceAnchorIds: ['anchor-clock-r1'],
      },
    } as const
    const debt = {
      id: 'debt-old-tide',
      unitId: 'chapter-1',
      clock: 'mystery',
      summary: '解释旧潮声为何能点亮灯塔并开启海门',
      status: 'open',
      horizon: 'chapter-8',
      sourceRevision: 1,
      sourceDeltaId: 'debt-old-tide-r1',
      sourceAnchorIds: ['anchor-debt-r1'],
      provenance,
      delta: {
        id: 'debt-old-tide-r1',
        kind: 'narrative-debt',
        operation: 'set',
        targetId: 'debt-old-tide',
        unitId: 'chapter-1',
        field: 'mystery',
        value: {
          summary: '解释旧潮声为何能点亮灯塔并开启海门',
          status: 'open',
          horizon: 'chapter-8',
        },
        sourceAnchorIds: ['anchor-debt-r1'],
      },
    } as const
    const roadmapResolution = {
      roadmapId: 'roadmap-main',
      value: {
        version: 1,
        detailedThroughUnitId: 'roadmap-lighthouse',
        horizonSummary: '未来八章追查旧潮声，登上灯塔并验证海门信号',
        units: [{
          unitId: 'roadmap-old-tide',
          order: 0,
          targetChapterStart: 2,
          targetChapterEnd: 4,
          milestone: '确认旧潮声来自海门方向',
          status: 'planned',
          dependsOnUnitIds: [],
          scopedDebtIds: ['debt-old-tide'],
          changeRationale: null,
        }, {
          unitId: 'roadmap-lighthouse',
          order: 1,
          targetChapterStart: 5,
          targetChapterEnd: 8,
          milestone: '登上灯塔并验证海门信号',
          status: 'planned',
          dependsOnUnitIds: ['roadmap-old-tide'],
          scopedDebtIds: ['debt-old-tide'],
          changeRationale: '旧潮声已把调查范围收束到灯塔',
        }],
      },
      sourceRevision: 1,
      sourceDeltaId: 'writing-memory-roadmap-r1',
      sourceAnchorIds: ['anchor-roadmap-r1'],
      sourceRanges: sourceEvidence('anchor-roadmap-r1', 'plan/roadmap-r1').sourceRanges,
      provenance,
      orderedUnits: [{
        unit: {
          unitId: 'roadmap-old-tide',
          order: 0,
          targetChapterStart: 2,
          targetChapterEnd: 4,
          milestone: '确认旧潮声来自海门方向',
          status: 'planned',
          dependsOnUnitIds: [],
          scopedDebtIds: ['debt-old-tide'],
          changeRationale: null,
        },
        dependsOnUnitIds: { resolved: [], missing: [], ambiguous: [] },
        scopedDebtIds: {
          resolved: [{
            debtId: 'debt-old-tide',
            debt,
            sourceRanges: sourceEvidence('anchor-debt-r1', 'draft-debt-r1').sourceRanges,
          }],
          missing: [],
          ambiguous: [],
        },
      }, {
        unit: {
          unitId: 'roadmap-lighthouse',
          order: 1,
          targetChapterStart: 5,
          targetChapterEnd: 8,
          milestone: '登上灯塔并验证海门信号',
          status: 'planned',
          dependsOnUnitIds: ['roadmap-old-tide'],
          scopedDebtIds: ['debt-old-tide'],
          changeRationale: '旧潮声已把调查范围收束到灯塔',
        },
        dependsOnUnitIds: {
          resolved: [{
            unitId: 'roadmap-old-tide',
            unit: {
              unitId: 'roadmap-old-tide',
              order: 0,
              targetChapterStart: 2,
              targetChapterEnd: 4,
              milestone: '确认旧潮声来自海门方向',
              status: 'planned',
              dependsOnUnitIds: [],
              scopedDebtIds: ['debt-old-tide'],
              changeRationale: null,
            },
          }],
          missing: [],
          ambiguous: [],
        },
        scopedDebtIds: {
          resolved: [{
            debtId: 'debt-old-tide',
            debt,
            sourceRanges: sourceEvidence('anchor-debt-r1', 'draft-debt-r1').sourceRanges,
          }],
          missing: [],
          ambiguous: [],
        },
      }],
    } as const
    const characterMemorySourceChapter = {
      id: 'chapter-1',
      level: 'chapter',
      parentId: 'arc-main',
      order: 0,
      objective: '循旧潮声登上灯塔',
      entryState: '旧潮声出现',
      exitState: '灯塔重新亮起',
      status: 'accepted',
      sourceRevision: 1,
      sourceDeltaId: 'writing-memory-chapter-r1',
      sourceAnchorIds: ['anchor-character-memory-r1'],
      provenance,
      delta: {
        id: 'writing-memory-chapter-r1',
        kind: 'narrative-unit',
        operation: 'set',
        targetId: 'chapter-1',
        field: 'unit',
        value: {
          level: 'chapter',
          parentId: 'arc-main',
          order: 0,
          objective: '循旧潮声登上灯塔',
          entryState: '旧潮声出现',
          exitState: '灯塔重新亮起',
          status: 'accepted',
        },
        sourceAnchorIds: ['anchor-character-memory-r1'],
      },
    } as const
    const characterArcValue = {
      version: 2,
      scopeUnitId: 'book-main',
      hypothesis: '沈砚会从独自控制风险，转向与顾临川共同承担。',
      startingBelief: '只有独自承担才不会再次失去重要的人。',
      targetTransformation: '主动共享风险，并接受关系中的相互依赖。',
      transformationDimensions: ['belief', 'strategy', 'relationship'],
      pressures: ['月门核心正在失控', '顾临川被困在断桥另一端'],
      decisionChain: [{
        decisionId: 'decision-return-for-ally',
        storyEventId: 'event-return-for-gu-linchuan',
        pressure: '月门即将坍塌，先夺取核心会把顾临川留在断桥另一端。',
        choice: '放弃抢先取得核心，折返断桥接应顾临川。',
        rejectedAlternatives: ['独自夺取核心', '封死断桥阻止追兵'],
        cost: '失去抢先控制月门核心的机会，并留下右肩灼伤。',
        persistentConsequence: '后续路线必须由两人共同决定。',
        transformationEvidence: '沈砚在高压下维持共同承担，而没有退回独自控制。',
      }],
      currentStage: '在真实代价下维持共同承担',
      unresolvedQuestion: '当共同决定导致失败时，他是否仍会接受相互依赖？',
      changeRationale: '折返救援证明转变能够承受机会损失。',
    } as const
    const characterArcFact = {
      kind: 'character-state',
      targetId: 'shen-yan',
      field: 'arc-hypothesis',
      value: characterArcValue,
      sourceRevision: 1,
      sourceDeltaId: 'character-arc-shen-yan-r1',
      sourceAnchorIds: ['anchor-character-arc-r1'],
      provenance,
      delta: {
        id: 'character-arc-shen-yan-r1',
        kind: 'character-state',
        operation: 'set',
        targetId: 'shen-yan',
        field: 'arc-hypothesis',
        value: characterArcValue,
        sourceAnchorIds: ['anchor-character-arc-r1'],
      },
    } as const
    const relationshipCarryForward = [{
      line: 'gu-linchuan<->shen-yan',
      participants: ['gu-linchuan', 'shen-yan'] as const,
      directions: [{
        pair: 'gu-linchuan->shen-yan',
        from: 'gu-linchuan',
        to: 'shen-yan',
        fields: { trust: 'cautious' },
        fieldSources: {
          trust: {
            value: 'cautious',
            sourceRevision: 1,
            sourceDeltaId: 'relationship-gu-shen-r1',
            sourceAnchorIds: ['anchor-relationship-gu-shen-r1'],
            provenance,
          },
        },
        sourceRevision: 1,
        sourceDeltaId: 'relationship-gu-shen-r1',
        sourceAnchorIds: ['anchor-relationship-gu-shen-r1'],
        provenance,
      }, {
        pair: 'shen-yan->gu-linchuan',
        from: 'shen-yan',
        to: 'gu-linchuan',
        fields: { trust: 'earned' },
        fieldSources: {
          trust: {
            value: 'earned',
            sourceRevision: 1,
            sourceDeltaId: 'relationship-shen-gu-r1',
            sourceAnchorIds: ['anchor-relationship-shen-gu-r1'],
            provenance,
          },
        },
        sourceRevision: 1,
        sourceDeltaId: 'relationship-shen-gu-r1',
        sourceAnchorIds: ['anchor-relationship-shen-gu-r1'],
        provenance,
      }],
    }] as const
    const knowledgeBoundaries = [{
      subjectId: 'shen-yan',
      revision: 1,
      headRevision: 2,
      freshness: 'historical' as const,
      entries: [{
        factId: 'clue-moon-key',
        knowledgeFields: [{
          fact: {
            kind: 'knowledge',
            targetId: 'shen-yan->clue-moon-key',
            field: 'belief',
            value: '铜钥匙能开启月门',
            sourceRevision: 1,
            sourceDeltaId: 'knowledge-shen-moon-key-r1',
            sourceAnchorIds: ['anchor-knowledge-shen-r1'],
            provenance,
          },
          sourceRanges: sourceEvidence('anchor-knowledge-shen-r1', 'chapter-1').sourceRanges,
        }],
        factFields: [{
          fact: {
            kind: 'clue',
            targetId: 'clue-moon-key',
            field: 'summary',
            value: '铜钥匙刻有月门徽记',
            sourceRevision: 1,
            sourceDeltaId: 'clue-moon-key-summary-r1',
            sourceAnchorIds: ['anchor-clue-moon-key-r1'],
            provenance,
          },
          sourceRanges: sourceEvidence('anchor-clue-moon-key-r1', 'chapter-1').sourceRanges,
        }],
      }],
    }] as const
    const writingMemory = {
      query: '旧潮声 灯塔 海门',
      characterCarryForward: [{
        characterId: 'shen-yan',
        carries: ['已经决定登上灯塔', '仍在隐瞒海门真相'],
        sourceChapter: characterMemorySourceChapter,
        sourceRevision: 1,
        sourceDeltaId: 'post-check-chapter-1-r1',
        sourceAnchorIds: ['anchor-character-memory-r1'],
        sourceRanges: sourceEvidence('anchor-character-memory-r1', 'chapter-1').sourceRanges,
        provenance,
      }],
      characterArcHypotheses: [{
        characterId: 'shen-yan',
        fact: characterArcFact,
        sourceRanges: sourceEvidence('anchor-character-arc-r1', 'brief/character-arc-r1').sourceRanges,
      }],
      latestReaderDisclosure: {
        readerNowKnows: ['月形刻痕是密道坐标'],
        readerNowSuspects: ['失踪兄长正在暗门后'],
        sourceChapter: characterMemorySourceChapter,
        sourceRevision: 1,
        sourceDeltaId: 'post-check-chapter-1-r1',
        sourceAnchorIds: ['anchor-character-memory-r1'],
        sourceRanges: sourceEvidence('anchor-character-memory-r1', 'chapter-1').sourceRanges,
        provenance,
      },
      latestChapterOutcome: {
        contractAssessment: {
          contractRevision: 1,
          contractSourceDeltaId: 'writing-memory-chapter-r1',
          outcome: 'changed' as const,
          deviations: ['未能取得灯塔守卫的公开许可'],
        },
        manuscriptSourceRevision: 1,
        changes: ['灯塔暗门已经开启'],
        costs: ['失去公开通行令'],
        newlyPossible: ['沿暗道追踪失踪兄长'],
        newlyImpossible: ['以使者身份公开进入灯塔'],
        sourceChapter: characterMemorySourceChapter,
        sourceRevision: 1,
        sourceDeltaId: 'post-check-chapter-1-r1',
        sourceAnchorIds: ['anchor-character-memory-r1'],
        sourceRanges: sourceEvidence('anchor-character-memory-r1', 'chapter-1').sourceRanges,
        provenance,
      },
      relationshipCarryForward,
      knowledgeBoundaries,
      authoringContracts: [{
        fact: styleContractFact,
        evidence: [{
          kind: 'approved-style-exemplar',
          exemplarId: 'exemplar-old-court-bell-r1',
          sourceUnitId: 'chapter-1',
          excerpt: '雪压旧庭，沈砚听见檐铃只响了半声。',
          purpose: '批准为克制悬疑开场与听觉细节范例',
          ...sourceEvidence('anchor-style-exemplar-r1', 'chapter-1'),
        }],
        ...sourceEvidence('anchor-style-contract-r1', 'brief/style-r1'),
      }, {
        fact: readerContractFact,
        evidence: [{
          kind: 'reader-contract-evidence',
          evidenceId: 'evidence-opening-r1',
          sourceUnitId: 'chapter-1',
          excerpt: '沈砚取得月门刻痕，却因此失去顾临川的信任。',
          demonstrates: '开篇同时兑现可追查线索和关系代价',
          ...sourceEvidence('anchor-reader-evidence-r1', 'chapter-1'),
        }],
        ...sourceEvidence('anchor-reader-contract-r1', 'brief/reader-r1'),
      }],
      roadmaps: [{
        resolution: roadmapResolution,
        ...evidence('anchor-roadmap-r1', 'plan/roadmap-r1', 9.75, ['旧潮声', '灯塔', '海门']),
      }],
      narrativeUnits: [{
        unit: {
          id: 'arc-main',
          level: 'arc',
          parentId: 'volume-main',
          order: 0,
          objective: '登上灯塔并确认海门信号',
          entryState: '旧潮声初现',
          exitState: '海门信号确认',
          status: 'active',
          sourceRevision: 1,
          sourceDeltaId: 'writing-memory-arc-r1',
          sourceAnchorIds: ['anchor-arc-r1'],
          provenance,
          delta: {
            id: 'writing-memory-arc-r1',
            kind: 'narrative-unit',
            operation: 'set',
            targetId: 'arc-main',
            field: 'unit',
            value: {
              level: 'arc',
              parentId: 'volume-main',
              order: 0,
              objective: '登上灯塔并确认海门信号',
              entryState: '旧潮声初现',
              exitState: '海门信号确认',
              status: 'active',
            },
            sourceAnchorIds: ['anchor-arc-r1'],
          },
        },
        ...evidence('anchor-arc-r1', 'plan/arc-r1', 7.5, ['旧潮声', '灯塔', '海门']),
      }],
      manuscriptExcerpts: [{
        unitId: 'chapter-1',
        title: '第一章 旧潮夜',
        excerpt: '沈砚听见旧潮声后登上灯塔，决定隐瞒海门仍会开启的真相。',
        ...evidence('anchor-manuscript-r1', 'chapter-1', 8.25, ['旧潮声', '灯塔']),
      }],
      settingFacts: [{
        fact: settingFact,
        ...evidence('anchor-setting-r1', 'draft-setting-r1', 6.5, ['灯塔', '海门']),
      }],
      continuityHits: [{
        kind: 'canon-fact',
        fact: continuityFact,
        ...evidence('anchor-event-r1', 'draft-event-r1', 5.75, ['旧潮声']),
      }, {
        kind: 'narrative-clock',
        entry: continuityClock,
        ...evidence('anchor-clock-r1', 'draft-clock-r1', 4.5, ['海门']),
      }],
      debts: [{
        debt,
        ...evidence('anchor-debt-r1', 'draft-debt-r1', 3.25, ['灯塔', '海门']),
      }],
    } as const
    const memoryResult = {
      projectId: 'project-writing-memory-results',
      workspaceId,
      revision: 1,
      headRevision: 2,
      freshness: 'historical',
      hits: [],
      writingMemory,
    } as const
    const unrelatedLaterRetrieve = {
      projectId: 'project-writing-memory-results',
      workspaceId,
      revision: 2,
      headRevision: 2,
      freshness: 'current',
      hits: [],
    } as const
    const memoryQuery = { revision: 1, writingMemoryQuery: '旧潮声 灯塔 海门' }
    const retrieveMemory = vi.fn(async () => ({ ok: true, value: memoryResult } as const))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: legacyChatSelector({
            nodes: [{
              kind: 'tool-result',
              seq: 20,
              time: 0,
              callId: 'retrieve-writing-memory-r1',
              call: outputMode === 'spilled'
                ? null
                : { name: 'retrieve_novel_context', argsRaw: JSON.stringify(memoryQuery) },
              meta: outputMode === 'spilled' ? memoryResult : undefined,
              callTime: 0,
              content: [{
                type: 'text',
                text: outputMode === 'inline'
                  ? JSON.stringify(memoryResult)
                  : JSON.stringify(memoryResult).slice(0, 120) + '\n[Output truncated; full output saved to a spill file]',
              }],
              isError: false,
              callView: null,
              resultView: null,
              subCalls: [],
            }, {
              kind: 'tool-result',
              seq: 21,
              time: 0,
              callId: 'retrieve-current-canon-r2',
              call: { name: 'retrieve_novel_context', argsRaw: '{}' },
              callTime: 0,
              content: [{ type: 'text', text: JSON.stringify(unrelatedLaterRetrieve) }],
              isError: false,
              callView: null,
              resultView: null,
              subCalls: [],
            }],
          }),
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-writing-memory-results',
              workspaceId,
              cwd: 'C:/novels/writing-memory-results',
              acceptedRevision: 2,
            },
          })),
          reviewResultPacket: vi.fn(),
          retrieve: retrieveMemory,
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-writing-memory-results',
              workspaceId,
              revision: 2,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const result = container.querySelector('[data-novel-writing-memory]')
      if (outputMode === 'inline') {
        expect(retrieveMemory).toHaveBeenCalledWith(workspaceId, memoryQuery)
      } else {
        expect(retrieveMemory).not.toHaveBeenCalled()
      }
      expect(result?.textContent).toContain('写作记忆 · R1 · historical')
      expect(result?.textContent).toContain('写作意图：旧潮声 灯塔 海门')

      const characterMemory = container.querySelector('[data-writing-memory-character="shen-yan"]')
      expect(characterMemory?.textContent).toContain('shen-yan · 已经决定登上灯塔 · 仍在隐瞒海门真相')
      expect(characterMemory?.textContent).toContain('chapter-1')
      expect(characterMemory?.textContent).toContain('post-check-chapter-1-r1')
      expect(characterMemory?.textContent).toContain('anchor-character-memory-r1')
      expect(characterMemory?.textContent).toContain('task-writing-memory-r1')

      const characterArc = container.querySelector('[data-writing-memory-character-arc="shen-yan"]')
      expect(characterArc?.textContent).toContain('Character arc hypothesis v2')
      expect(characterArc?.textContent).toContain('沈砚会从独自控制风险，转向与顾临川共同承担。')
      expect(characterArc?.textContent).toContain('当前阶段：在真实代价下维持共同承担')
      expect(characterArc?.textContent).toContain('当共同决定导致失败时，他是否仍会接受相互依赖？')
      expect(characterArc?.textContent).toContain('失去抢先控制月门核心的机会，并留下右肩灼伤。')
      expect(characterArc?.textContent).toContain('后续路线必须由两人共同决定。')
      expect(characterArc?.textContent).toContain('character-arc-shen-yan-r1')
      expect(characterArc?.textContent).toContain('anchor-character-arc-r1')
      expect(characterArc?.textContent).toContain('task-writing-memory-r1')

      const readerDisclosure = container.querySelector(
        '[data-writing-memory-reader-disclosure="chapter-1"]',
      )
      expect(readerDisclosure?.textContent).toContain('读者认知延续')
      expect(readerDisclosure?.textContent).toContain('来源章节：chapter-1')
      expect(readerDisclosure?.textContent).toContain('读者现已知道')
      expect(readerDisclosure?.textContent).toContain('月形刻痕是密道坐标')
      expect(readerDisclosure?.textContent).toContain('读者现已怀疑')
      expect(readerDisclosure?.textContent).toContain('失踪兄长正在暗门后')
      expect(readerDisclosure?.textContent).toContain('post-check-chapter-1-r1')
      expect(readerDisclosure?.textContent).toContain('anchor-character-memory-r1')
      expect(readerDisclosure?.textContent).toContain('task-writing-memory-r1')

      const chapterOutcome = container.querySelector(
        '[data-writing-memory-chapter-outcome="chapter-1"]',
      )
      expect(chapterOutcome?.textContent).toContain('最新章节结果')
      expect(chapterOutcome?.textContent).toContain('来源章节：chapter-1')
      expect(chapterOutcome?.textContent).toContain('合同结果：changed')
      expect(chapterOutcome?.textContent).toContain('未能取得灯塔守卫的公开许可')
      expect(chapterOutcome?.textContent).toContain('正文来源版本：R1')
      expect(chapterOutcome?.textContent).toContain('变化')
      expect(chapterOutcome?.textContent).toContain('灯塔暗门已经开启')
      expect(chapterOutcome?.textContent).toContain('代价')
      expect(chapterOutcome?.textContent).toContain('失去公开通行令')
      expect(chapterOutcome?.textContent).toContain('新增可能')
      expect(chapterOutcome?.textContent).toContain('沿暗道追踪失踪兄长')
      expect(chapterOutcome?.textContent).toContain('新增不可能')
      expect(chapterOutcome?.textContent).toContain('以使者身份公开进入灯塔')
      expect(chapterOutcome?.textContent).toContain('post-check-chapter-1-r1')
      expect(chapterOutcome?.textContent).toContain('anchor-character-memory-r1')
      expect(chapterOutcome?.textContent).toContain('task-writing-memory-r1')

      const relationshipMemory = container.querySelector('[data-writing-memory-relationships]')
      expect(relationshipMemory?.textContent).toContain('gu-linchuan ↔ shen-yan')
      expect(relationshipMemory?.textContent).toContain('gu-linchuan → shen-yan')
      expect(relationshipMemory?.textContent).toContain('trust: cautious')
      expect(relationshipMemory?.textContent).toContain('anchor-relationship-gu-shen-r1')
      expect(relationshipMemory?.textContent).toContain('shen-yan → gu-linchuan')
      expect(relationshipMemory?.textContent).toContain('trust: earned')
      expect(relationshipMemory?.textContent).toContain('anchor-relationship-shen-gu-r1')
      expect(relationshipMemory?.textContent).toContain('task-writing-memory-r1')

      const knowledgeMemory = container.querySelector(
        '[data-writing-memory-knowledge-boundary="shen-yan"]',
      )
      expect(knowledgeMemory?.textContent).toContain('Knowledge boundary · R1 · head R2 · historical')
      expect(knowledgeMemory?.textContent).toContain('对象：shen-yan')
      expect(knowledgeMemory?.textContent).toContain('knowledge · shen-yan->clue-moon-key · belief')
      expect(knowledgeMemory?.textContent).toContain('铜钥匙能开启月门')
      expect(knowledgeMemory?.textContent).toContain('clue · clue-moon-key · summary')
      expect(knowledgeMemory?.textContent).toContain('铜钥匙刻有月门徽记')
      expect(knowledgeMemory?.textContent).toContain('anchor-knowledge-shen-r1')
      expect(knowledgeMemory?.textContent).toContain('anchor-clue-moon-key-r1')
      expect(knowledgeMemory?.textContent).toContain('task-writing-memory-r1')

      const styleContract = container.querySelector(
        '[data-writing-memory-authoring-contract="creative-profile:current:style-profile"]',
      )
      expect(styleContract?.textContent).toContain('旧庭悬疑叙事声线')
      expect(styleContract?.textContent).toContain('来源版本：R1')
      expect(styleContract?.textContent).toContain('anchor-style-contract-r1')
      const styleEvidence = styleContract?.querySelector(
        '[data-writing-memory-contract-evidence="approved-style-exemplar:exemplar-old-court-bell-r1"]',
      )
      expect(styleEvidence?.textContent).toContain('雪压旧庭，沈砚听见檐铃只响了半声。')
      expect(styleEvidence?.textContent).toContain('批准为克制悬疑开场与听觉细节范例')
      expect(styleEvidence?.textContent).toContain('anchor-style-exemplar-r1')

      const readerContract = container.querySelector(
        '[data-writing-memory-authoring-contract="reader-contract:project:contract-profile"]',
      )
      expect(readerContract?.textContent).toContain('追查旧案时持续兑现成长、关系与真相承诺')
      expect(readerContract?.textContent).toContain('reader-contract-r1')
      expect(readerContract?.textContent).toContain('anchor-reader-contract-r1')
      const readerEvidence = readerContract?.querySelector(
        '[data-writing-memory-contract-evidence="reader-contract-evidence:evidence-opening-r1"]',
      )
      expect(readerEvidence?.textContent).toContain('沈砚取得月门刻痕，却因此失去顾临川的信任。')
      expect(readerEvidence?.textContent).toContain('开篇同时兑现可追查线索和关系代价')
      expect(readerEvidence?.textContent).toContain('anchor-reader-evidence-r1')

      const roadmap = container.querySelector('[data-writing-memory-roadmap="roadmap-main"]')
      expect(roadmap?.textContent).toContain('滚动路线图 · R1 · v1')
      expect(roadmap?.textContent).toContain('未来八章追查旧潮声，登上灯塔并验证海门信号')
      expect(roadmap?.textContent).toContain('章节 2–4')
      expect(roadmap?.textContent).toContain('确认旧潮声来自海门方向')
      expect(roadmap?.textContent).toContain('章节 5–8')
      expect(roadmap?.textContent).toContain('登上灯塔并验证海门信号')
      expect(roadmap?.textContent).toContain('已解析 · roadmap-old-tide · 章节 2–4')
      expect(roadmap?.textContent).toContain('已解析 · debt-old-tide · mystery · chapter-1')
      expect(roadmap?.textContent).toContain('得分：9.75')
      expect(roadmap?.textContent).toContain('词项：旧潮声, 灯塔, 海门')
      expect(roadmap?.textContent).toContain('anchor-roadmap-r1')
      expect(roadmap?.textContent).toContain('task-writing-memory-r1')

      const narrativeContext = container.querySelector('[data-writing-memory-narrative="arc-main"]')
      expect(narrativeContext?.textContent).toContain('Arc · arc-main · active')
      expect(narrativeContext?.textContent).toContain('目标：登上灯塔并确认海门信号')
      expect(narrativeContext?.textContent).toContain('进入 → 退出：旧潮声初现 → 海门信号确认')
      expect(narrativeContext?.textContent).toContain('得分：7.5')
      expect(narrativeContext?.textContent).toContain('词项：旧潮声, 灯塔, 海门')
      expect(narrativeContext?.textContent).toContain('anchor-arc-r1')

      const manuscript = container.querySelector('[data-writing-memory-manuscript="chapter-1"]')
      expect(manuscript?.textContent).toContain('第一章 旧潮夜')
      expect(manuscript?.textContent).toContain('沈砚听见旧潮声后登上灯塔')
      expect(manuscript?.textContent).toContain('得分：8.25')
      expect(manuscript?.textContent).toContain('词项：旧潮声, 灯塔')
      expect(manuscript?.textContent).toContain('anchor-manuscript-r1')

      const setting = container.querySelector('[data-writing-memory-setting="location-state:lighthouse:old-tide-signal"]')
      expect(setting?.textContent).toContain('旧潮声是点亮灯塔并开启海门的唯一信号')
      expect(setting?.textContent).toContain('setting-lighthouse-r1')
      expect(setting?.textContent).toContain('anchor-setting-r1')

      const canonContinuity = container.querySelector('[data-writing-memory-continuity="canon-fact:event-old-tide-r1"]')
      expect(canonContinuity?.textContent).toContain('沈砚听见旧潮声，灯塔随即亮起')
      expect(canonContinuity?.textContent).toContain('anchor-event-r1')

      const clockContinuity = container.querySelector('[data-writing-memory-continuity="narrative-clock:reader-clock-r1"]')
      expect(clockContinuity?.textContent).toContain('reader-knowledge · chapter-1')
      expect(clockContinuity?.textContent).toContain('保留引路人身份的双重解读')
      expect(clockContinuity?.textContent).toContain('anchor-clock-r1')

      const recalledDebt = container.querySelector('[data-writing-memory-debt="debt-old-tide"]')
      expect(recalledDebt?.textContent).toContain('解释旧潮声为何能点亮灯塔并开启海门')
      expect(recalledDebt?.textContent).toContain('debt-old-tide-r1')
      expect(recalledDebt?.textContent).toContain('anchor-debt-r1')
      expect(result?.textContent).toContain('task-writing-memory-r1')
      expect(result?.textContent).toContain(SESSION_ID)
      expect(result?.textContent).toContain('novel-writing-memory')
      expect(result?.textContent).not.toContain('R2 · current')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders the latest single story-world and reader-response SimulationRuns in Results', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-simulation-results'
    const storyWorldRun = {
      runId: 'story-run-7',
      sandbox: 'story-world',
      sourceRevision: 3,
      maxActions: 2,
      seed: 'story-seed-7',
      replayKey: 'story-replay-7',
      storyTime: '第三章午夜',
      hypothesis: '沈砚会先确认钟声来源，而不是立刻开门。',
      assumptions: ['旧庭门仍然上锁'],
      actor: {
        id: 'shen-yan',
        goal: '找出钟声的来源',
        resources: ['铜钥匙'],
        knowledge: [],
      },
      knownFacts: [],
      trace: [{
        actorId: 'shen-yan',
        type: 'observe',
        target: '旧庭门',
        intent: '先确认门后的动静',
        preconditions: [],
        effects: [{
          operation: 'set',
          path: { type: 'resource', resource: '新线索' },
          value: '钟声来自北廊',
        }],
      }],
      initialState: [{
        path: { type: 'resource', resource: '铜钥匙' },
        value: true,
      }],
      transitions: [{
        actionIndex: 0,
        before: [{
          path: { type: 'resource', resource: '铜钥匙' },
          value: true,
        }],
        after: [
          {
            path: { type: 'resource', resource: '铜钥匙' },
            value: true,
          },
          {
            path: { type: 'resource', resource: '新线索' },
            value: '钟声来自北廊',
          },
        ],
      }],
      finalState: [
        {
          path: { type: 'resource', resource: '铜钥匙' },
          value: true,
        },
        {
          path: { type: 'resource', resource: '新线索' },
          value: '钟声来自北廊',
        },
      ],
      limitations: ['只模拟角色当前可知信息'],
      provenance: {
        taskId: 'task-story-run-7',
        sessionId: SESSION_ID,
        producer: 'novel-story-world-simulation',
      },
    } as const
    const readerResponseRun = {
      runId: 'reader-run-9',
      sandbox: 'reader-response',
      sourceRevision: 3,
      seed: 'reader-seed-9',
      replayKey: 'reader-replay-9',
      unitId: 'chapter-3',
      hypothesis: '锈钥匙的首次出现是否足够清楚？',
      persona: {
        id: 'serial-mystery-reader',
        description: '追更型悬疑读者',
      },
      readingHistory: ['第一章', '第二章'],
      presentedText: '沈砚从雪里捡起那把锈钥匙。',
      presentedTextSource: 'accepted',
      presentedTextHash: 'sha256-reader-run-9',
      reactions: [{
        dimension: 'confusion',
        hypothesis: '读者会追问钥匙为何恰好出现在雪中。',
        evidence: '锈钥匙',
      }],
      marketRepresentative: false,
      limitations: ['合成读者反应不代表真实市场'],
      provenance: {
        taskId: 'task-reader-run-9',
        sessionId: SESSION_ID,
        producer: 'novel-reader-response-simulation',
      },
    } as const
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: legacyChatSelector({
            nodes: [
              {
                kind: 'tool-result',
                seq: 20,
                time: 0,
                callId: 'simulate-story-world-7',
                call: {
                  name: 'simulate_novel_story_world',
                  argsRaw: '{}',
                },
                callTime: 0,
                content: [{ type: 'text', text: JSON.stringify(storyWorldRun) }],
                isError: false,
                callView: null,
                resultView: null,
                subCalls: [],
              },
              {
                kind: 'tool-result',
                seq: 21,
                time: 0,
                callId: 'simulate-reader-response-9',
                call: {
                  name: 'simulate_novel_reader_response',
                  argsRaw: '{}',
                },
                callTime: 0,
                content: [{ type: 'text', text: JSON.stringify(readerResponseRun) }],
                isError: false,
                callView: null,
                resultView: null,
                subCalls: [],
              },
            ],
          }),
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-simulation-results',
              workspaceId,
              cwd: 'C:/novels/simulation-results',
              acceptedRevision: 3,
            },
          })),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-simulation-results',
              workspaceId,
              revision: 3,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const simulations = container.querySelector('[data-novel-simulations]')
      expect(simulations?.textContent).toContain('模拟实验')

      const storyWorld = container.querySelector('[data-story-world-simulation="story-run-7"]')
      expect(storyWorld?.textContent).toContain('故事世界 · R3')
      expect(storyWorld?.textContent).toContain('shen-yan · 第三章午夜')
      expect(storyWorld?.textContent).toContain('story-seed-7 · story-replay-7')
      expect(storyWorld?.textContent).toContain('沈砚会先确认钟声来源，而不是立刻开门。')
      expect(storyWorld?.textContent).toContain('observe · 旧庭门')
      expect(storyWorld?.textContent).toContain('之前：resource:铜钥匙 = true')
      expect(storyWorld?.textContent).toContain('之后：resource:铜钥匙 = true · resource:新线索 = 钟声来自北廊')
      expect(storyWorld?.textContent).toContain('novel-story-world-simulation')

      const readerResponse = container.querySelector('[data-reader-response-simulation="reader-run-9"]')
      expect(readerResponse?.textContent).toContain('读者反应 · R3 · chapter-3')
      expect(readerResponse?.textContent).toContain('serial-mystery-reader · 追更型悬疑读者')
      expect(readerResponse?.textContent).toContain('accepted · sha256-reader-run-9')
      expect(readerResponse?.textContent).toContain('第一章 · 第二章')
      expect(readerResponse?.textContent).toContain('confusion · 读者会追问钥匙为何恰好出现在雪中。')
      expect(readerResponse?.textContent).toContain('证据：锈钥匙')
      expect(readerResponse?.textContent).toContain('Synthetic only · not market representative')
      expect(readerResponse?.textContent).toContain('novel-reader-response-simulation')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders the latest shared story-world encounter with ordered turns and shared state', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-shared-encounter-results'
    const gatePath = { type: 'resource' as const, resource: '侧门' }
    const lanternPath = { type: 'resource' as const, resource: '灯笼' }
    const bladePath = { type: 'resource' as const, resource: '短刃' }
    const actors = [{
      id: 'shen-yan',
      goal: '打开侧门接应来人',
      resources: ['侧门', '灯笼'],
      knowledge: [],
    }, {
      id: 'gu-linchuan',
      goal: '穿过侧门进入旧庭',
      resources: ['侧门', '短刃'],
      knowledge: [],
    }] as const
    const sharedInitialState = [
      { path: gatePath, value: true },
      { path: lanternPath, value: true },
      { path: bladePath, value: true },
    ] as const
    const afterFirstTurn = [
      { path: gatePath, value: 'open' },
      { path: lanternPath, value: true },
      { path: bladePath, value: true },
    ] as const
    const sharedFinalState = [
      { path: gatePath, value: 'guarded' },
      { path: lanternPath, value: true },
      { path: bladePath, value: true },
    ] as const
    const firstRun = {
      runId: 'shared-encounter-child-1',
      sandbox: 'story-world',
      sourceRevision: 4,
      maxActions: 1,
      seed: 'shared-encounter-seed',
      replayKey: 'shared-encounter-replay-1',
      storyTime: '第四章清晨',
      hypothesis: '沈砚打开侧门后，顾临川能否接续入院？',
      assumptions: ['按输入顺序行动'],
      actor: actors[0],
      knownFacts: [],
      trace: [{
        actorId: 'shen-yan',
        type: 'reveal',
        target: '侧门',
        intent: '打开侧门',
        preconditions: [{ path: gatePath, equals: true }],
        effects: [{ operation: 'set', path: gatePath, value: 'open' }],
      }],
      initialState: [
        { path: gatePath, value: true },
        { path: lanternPath, value: true },
      ],
      transitions: [{
        actionIndex: 0,
        before: [
          { path: gatePath, value: true },
          { path: lanternPath, value: true },
        ],
        after: [
          { path: gatePath, value: 'open' },
          { path: lanternPath, value: true },
        ],
      }],
      finalState: [
        { path: gatePath, value: 'open' },
        { path: lanternPath, value: true },
      ],
      limitations: ['仅模拟沈砚当前可见状态'],
      provenance: {
        taskId: 'shared-encounter-child-1',
        sessionId: SESSION_ID,
        producer: 'novel-story-world-simulation',
      },
    } as const
    const secondRun = {
      runId: 'shared-encounter-child-2',
      sandbox: 'story-world',
      sourceRevision: 4,
      maxActions: 1,
      seed: 'shared-encounter-seed',
      replayKey: 'shared-encounter-replay-2',
      storyTime: '第四章清晨',
      hypothesis: '沈砚打开侧门后，顾临川能否接续入院？',
      assumptions: ['按输入顺序行动'],
      actor: actors[1],
      knownFacts: [],
      trace: [{
        actorId: 'gu-linchuan',
        type: 'move',
        target: '旧庭',
        intent: '穿过已打开的侧门',
        preconditions: [{ path: gatePath, equals: 'open' }],
        effects: [{ operation: 'set', path: gatePath, value: 'guarded' }],
      }],
      initialState: [
        { path: gatePath, value: 'open' },
        { path: bladePath, value: true },
      ],
      transitions: [{
        actionIndex: 0,
        before: [
          { path: gatePath, value: 'open' },
          { path: bladePath, value: true },
        ],
        after: [
          { path: gatePath, value: 'guarded' },
          { path: bladePath, value: true },
        ],
      }],
      finalState: [
        { path: gatePath, value: 'guarded' },
        { path: bladePath, value: true },
      ],
      limitations: ['仅模拟顾临川当前可见状态'],
      provenance: {
        taskId: 'shared-encounter-child-2',
        sessionId: SESSION_ID,
        producer: 'novel-story-world-simulation',
      },
    } as const
    const sharedEncounter = {
      sandbox: 'story-world',
      mode: 'shared-encounter',
      sourceRevision: 4,
      maxActions: 1,
      seed: 'shared-encounter-seed',
      storyTime: '第四章清晨',
      hypothesis: '沈砚打开侧门后，顾临川能否接续入院？',
      assumptions: ['按输入顺序行动'],
      initialState: sharedInitialState,
      turns: [{
        actor: actors[0],
        before: sharedInitialState,
        after: afterFirstTurn,
        run: firstRun,
      }, {
        actor: actors[1],
        before: afterFirstTurn,
        after: sharedFinalState,
        run: secondRun,
      }],
      finalState: sharedFinalState,
    } as const
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: legacyChatSelector({
            nodes: [{
              kind: 'tool-result',
              seq: 40,
              time: 0,
              callId: 'simulate-story-world-shared-encounter',
              call: { name: 'simulate_novel_story_world', argsRaw: '{}' },
              callTime: 0,
              content: [{ type: 'text', text: JSON.stringify(sharedEncounter) }],
              isError: false,
              callView: null,
              resultView: null,
              subCalls: [],
            }],
          }),
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-shared-encounter-results',
              workspaceId,
              cwd: 'C:/novels/shared-encounter-results',
              acceptedRevision: 4,
            },
          })),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-shared-encounter-results',
              workspaceId,
              revision: 4,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const encounter = container.querySelector('[data-story-world-shared-encounter]')
      expect(encounter?.textContent).toContain('故事世界共享场景 · R4')
      expect(encounter?.textContent).toContain('初始状态：resource:侧门 = true')
      expect(encounter?.textContent).toContain('最终状态：resource:侧门 = guarded')
      const turns = [...container.querySelectorAll('[data-story-world-encounter-turn]')]
      expect(turns.map(turn => turn.getAttribute('data-story-world-encounter-turn')))
        .toEqual(['shen-yan', 'gu-linchuan'])
      expect(turns[0]?.textContent).toContain('Turn 1 · shen-yan · 打开侧门接应来人')
      expect(turns[0]?.textContent).toContain('之前：resource:侧门 = true')
      expect(turns[0]?.textContent).toContain('之后：resource:侧门 = open')
      expect(turns[0]?.textContent).toContain('shared-encounter-child-1')
      expect(turns[0]?.textContent).toContain('shared-encounter-replay-1')
      expect(turns[1]?.textContent).toContain('Turn 2 · gu-linchuan · 穿过侧门进入旧庭')
      expect(turns[1]?.textContent).toContain('之前：resource:侧门 = open')
      expect(turns[1]?.textContent).toContain('之后：resource:侧门 = guarded')
      expect(turns[1]?.textContent).toContain('shared-encounter-child-2')
      expect(turns[1]?.textContent).toContain('shared-encounter-replay-2')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })

  it('renders story branch-seed and reader candidate-Persona comparisons in Results', async () => {
    const panelModulePath = '../src/client/NovelProjectPanel.js'
    const { NovelProjectPanel } = await import(panelModulePath)
    const workspaceId = 'workspace-simulation-comparisons'
    const actor = {
      id: 'shen-yan',
      goal: '确定是否打开旧庭门',
      resources: ['铜钥匙'],
      knowledge: [],
    } as const
    const storyWorldComparison = {
      sandbox: 'story-world',
      mode: 'branch-seed-comparison',
      sourceRevision: 3,
      maxActions: 2,
      storyTime: '第三章午夜',
      hypothesis: '比较开门与绕行在不同种子下的后果。',
      assumptions: ['旧庭门仍然上锁'],
      actor,
      knownFacts: [],
      seeds: ['seed-a', 'seed-b'],
      initialState: [{
        path: { type: 'resource', resource: '铜钥匙' },
        value: true,
      }],
      branches: [
        {
          id: 'open-door',
          hypothesis: '直接开门',
          assumptions: ['钥匙可用'],
          experiment: {
            sandbox: 'story-world',
            sourceRevision: 3,
            maxActions: 2,
            storyTime: '第三章午夜',
            hypothesis: '直接开门',
            assumptions: ['钥匙可用'],
            actor,
            knownFacts: [],
            seeds: ['seed-a', 'seed-b'],
            runs: [],
            actionSummary: [{ type: 'observe', count: 2, total: 2, ratio: 1 }],
          },
        },
        {
          id: 'take-detour',
          hypothesis: '绕行北廊',
          assumptions: ['北廊可通行'],
          experiment: {
            sandbox: 'story-world',
            sourceRevision: 3,
            maxActions: 2,
            storyTime: '第三章午夜',
            hypothesis: '绕行北廊',
            assumptions: ['北廊可通行'],
            actor,
            knownFacts: [],
            seeds: ['seed-a', 'seed-b'],
            runs: [],
            actionSummary: [{ type: 'move', count: 1, total: 2, ratio: 0.5 }],
          },
        },
      ],
      stateComparison: [{
        path: { type: 'resource', resource: '新线索' },
        differs: true,
        experiments: [
          { branchId: 'open-door', seed: 'seed-a', present: true, value: '门内脚印' },
          { branchId: 'open-door', seed: 'seed-b', present: false },
          { branchId: 'take-detour', seed: 'seed-a', present: true, value: '北廊灯油' },
          { branchId: 'take-detour', seed: 'seed-b', present: true, value: '北廊灯油' },
        ],
      }],
    } as const
    const readerComparison = {
      sandbox: 'reader-response',
      mode: 'candidate-persona-comparison',
      sourceRevision: 3,
      unitId: 'chapter-3',
      hypothesis: '哪个候选文本对两类读者更清楚？',
      readingHistory: ['第一章', '第二章'],
      seeds: ['seed-a', 'seed-b'],
      candidates: [
        { id: 'candidate-a', presentedTextHash: 'hash-a' },
        { id: 'candidate-b', presentedTextHash: 'hash-b' },
      ],
      personas: [
        { id: 'mystery-reader', description: '悬疑追更读者' },
        { id: 'romance-reader', description: '关系线读者' },
      ],
      experiments: [],
      dimensionComparison: [{
        dimension: 'confusion',
        experiments: [
          { candidateId: 'candidate-a', personaId: 'mystery-reader', count: 1, total: 2, ratio: 0.5 },
          { candidateId: 'candidate-a', personaId: 'romance-reader', count: 0, total: 2, ratio: 0 },
          { candidateId: 'candidate-b', personaId: 'mystery-reader', count: 2, total: 2, ratio: 1 },
          { candidateId: 'candidate-b', personaId: 'romance-reader', count: 1, total: 2, ratio: 0.5 },
        ],
      }],
      marketRepresentative: false,
    } as const
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        const panel = createElement(NovelProjectPanel, {
          sessionId: SESSION_ID,
          useChat: legacyChatSelector({
            nodes: [
              {
                kind: 'tool-result',
                seq: 30,
                time: 0,
                callId: 'simulate-story-branch-seed',
                call: { name: 'simulate_novel_story_world', argsRaw: '{}' },
                callTime: 0,
                content: [{ type: 'text', text: JSON.stringify(storyWorldComparison) }],
                isError: false,
                callView: null,
                resultView: null,
                subCalls: [],
              },
              {
                kind: 'tool-result',
                seq: 31,
                time: 0,
                callId: 'simulate-reader-candidate-persona',
                call: { name: 'simulate_novel_reader_response', argsRaw: '{}' },
                callTime: 0,
                content: [{ type: 'text', text: JSON.stringify(readerComparison) }],
                isError: false,
                callView: null,
                resultView: null,
                subCalls: [],
              },
            ],
          }),
          useWorkspaces: (selector: (state: unknown) => unknown) => selector({
            items: [{ workspaceId, sessionIds: [SESSION_ID] }],
          }),
          openProject: vi.fn(async () => ({
            ok: true,
            value: {
              id: 'project-simulation-comparisons',
              workspaceId,
              cwd: 'C:/novels/simulation-comparisons',
              acceptedRevision: 3,
            },
          })),
          reviewResultPacket: vi.fn(),
          readRevision: vi.fn(async () => ({ ok: true, value: undefined } as const)),
          projectCanon: vi.fn(async () => ({
            ok: true,
            value: {
              projectId: 'project-simulation-comparisons',
              workspaceId,
              revision: 3,
              facts: [],
              entities: [],
            },
          })),
          projectNarrative: emptyProjectNarrative,
          projectManuscripts: defaultProjectManuscripts,
          projectRelationships: emptyProjectRelationships,
          rollbackRevision: vi.fn(),
        } as never)
        root.render(panel as unknown as Parameters<typeof root.render>[0])
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })

      const storyWorld = container.querySelector('[data-story-world-simulation-result]')
      expect(storyWorld?.textContent).toContain('故事世界分支 × 种子 · R3')
      expect(storyWorld?.textContent).toContain('种子：seed-a · seed-b')
      expect(storyWorld?.textContent).toContain('open-door · 直接开门')
      expect(storyWorld?.textContent).toContain('observe: 2/2 (100%)')
      expect(storyWorld?.textContent).toContain('take-detour · 绕行北廊')
      expect(storyWorld?.textContent).toContain('move: 1/2 (50%)')
      expect(storyWorld?.textContent).toContain('resource:新线索 · differs')
      expect(storyWorld?.textContent).toContain('open-door / seed-a = 门内脚印')
      expect(storyWorld?.textContent).toContain('open-door / seed-b = absent')

      const readerResponse = container.querySelector('[data-reader-response-simulation-result]')
      expect(readerResponse?.textContent).toContain('读者候选 × 画像 · R3 · chapter-3')
      expect(readerResponse?.textContent).toContain('candidate-a · hash-a')
      expect(readerResponse?.textContent).toContain('mystery-reader · 悬疑追更读者')
      expect(readerResponse?.textContent).toContain('confusion')
      expect(readerResponse?.textContent).toContain('candidate-a / mystery-reader: 1/2 (50%)')
      expect(readerResponse?.textContent).toContain('candidate-b / romance-reader: 1/2 (50%)')
      expect(readerResponse?.textContent).toContain('Synthetic only · not market representative')
    } finally {
      await act(async () => { root.unmount() })
      container.remove()
    }
  })
})
