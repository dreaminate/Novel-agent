import { mkdir, mkdtemp, readFile, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'
import * as JsonStorage from '@deepseek-ai/dsh-storage-json'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import TokenMeter from '@deepseek-ai/dsh-token-meter'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import WorkspaceRegistry from '@deepseek-ai/dsh-workspace'
import NovelPlanning from '@novel-agent/novel-planning'
import NovelWriting from '@novel-agent/novel-writing'
import NovelMemory from '@novel-agent/novel-memory'
import { afterEach, describe, expect, it } from 'vitest'
import NovelProjectService from '../src/index.js'
import type {
  CanonDelta,
  CanonFactDelta,
  CharacterClockSetDelta,
  EndingClockSetDelta,
  NarrativeClockDelta,
  NarrativeDebtDelta,
  NarrativeDebtSetDelta,
  NarrativeLevel,
  NarrativeUnitDelta,
  MysteryClockSetDelta,
  PlotProgressionClockSetDelta,
  ProgressionClockSetDelta,
  PromiseClockSetDelta,
  ReaderKnowledgeClockSetDelta,
  RelationshipClockSetDelta,
  WorldClockSetDelta,
  NovelResultPacket,
} from '../src/types.js'

const homes: string[] = []

afterEach(async () => {
  for (const home of homes.splice(0)) {
    await rm(home, { recursive: true, force: true })
  }
})

async function makeHome(name: string): Promise<{ home: string; cwd: string }> {
  const home = await realpath(await mkdtemp(join(tmpdir(), `novel-narrative-${name}-`)))
  homes.push(home)
  const cwd = join(home, 'workspace')
  await mkdir(cwd)
  return { home, cwd }
}

async function boot(home: string) {
  const ctx = new Context()
  const disposeSubagents = ctx.provide('subagents', {
    start: async () => { throw new Error('unexpected subagent start') },
  } as never)
  const disposeFileSystem = ctx.provide('fs', {
    resolve: async () => { throw new Error('unexpected filesystem resolve') },
    writeText: async () => { throw new Error('unexpected filesystem write') },
  } as never)
  // The continuation seam is injected but never exercised here: a test that
  // reaches the model should fail loudly rather than silently call one.
  const _llm = ctx.provide('llm', { stream: () => { throw new Error('unexpected model call') } } as never)
  const disposeSandboxPolicy = ctx.provide('sandboxPolicy', {
    resolve: () => { throw new Error('unexpected sandbox policy resolve') },
  } as never)
  const sessions = await ctx.plugin(SessionStore)
  ctx.sessions.create(SessionId('fixture-narrative'), { meta: { cwd: join(home, 'workspace') } })
  const sessionProjections = await ctx.plugin(SessionProjectionRegistry)
  const tokenMeter = await ctx.plugin(TokenMeter)
  const agents = await ctx.plugin(AgentRegistry)
  const systemPrompt = await ctx.plugin(SystemPrompt)
  const tools = await ctx.plugin(ToolRuntime)
  const storage = await ctx.plugin(Storage)
  const json = await ctx.plugin(JsonStorage, { root: join(home, 'storages') })
  const domain = await ctx.plugin(StorageDomain, { backend: 'json' })
  const disposeSessionPersistence = ctx.provide('sessionPersistence', {
    list: async () => [],
    load: async () => { throw new Error('unexpected session body read') },
    inspect: async () => { throw new Error('unexpected session body inspection') },
  } as never)
  const workspaces = await ctx.plugin(WorkspaceRegistry)
  const typert = await ctx.plugin(TypertRegistry)
  const projects = await ctx.plugin(NovelProjectService)
  const planning = await ctx.plugin(NovelPlanning)
  const writing = await ctx.plugin(NovelWriting)
  const memory = await ctx.plugin(NovelMemory)

  return {
    ctx,
    async dispose() {
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await projects.dispose()
      await typert.dispose()
      disposeSandboxPolicy()
      disposeFileSystem()
      await workspaces.dispose()
      disposeSessionPersistence()
      await domain.dispose()
      await json.dispose()
      await storage.dispose()
      await tools.dispose()
      await systemPrompt.dispose()
      await agents.dispose()
      await tokenMeter.dispose()
      await sessionProjections.dispose()
      await sessions.dispose()
      disposeSubagents()
    },
  }
}

const anchorId = 'anchor-narrative-r1'
const sourceAnchorIds = [anchorId] as const

function narrativeUnit(
  targetId: string,
  level: NarrativeLevel,
  parentId: string | null,
  order: number,
): NarrativeUnitDelta {
  return {
    id: `unit-${targetId}`,
    kind: 'narrative-unit',
    operation: 'set',
    targetId,
    field: 'unit',
    value: {
      level,
      parentId,
      order,
      objective: `${targetId} objective`,
      entryState: `${targetId} entry`,
      exitState: `${targetId} exit`,
      status: 'planned',
    },
    sourceAnchorIds,
  }
}

function removeNarrativeUnit(targetId: string): NarrativeUnitDelta {
  return {
    id: `remove-unit-${targetId}`,
    kind: 'narrative-unit',
    operation: 'remove',
    targetId,
    field: 'unit',
    value: null,
    sourceAnchorIds,
  }
}

function narrativeClock(
  targetId: string,
  level: NarrativeLevel,
  version = 1,
): PlotProgressionClockSetDelta {
  return {
    id: `clock-${targetId}`,
    kind: 'narrative-clock',
    operation: 'set',
    targetId,
    field: 'plot',
    value: {
      movement: 'advance',
      state: `${targetId} advances the plot`,
      version,
      scope: { unitId: targetId, level },
      lines: [{
        lineId: `line-${targetId}`,
        goal: `${targetId} goal`,
        stakes: `${targetId} stakes`,
        status: 'active',
        turns: [],
      }],
      revisionRationale: null,
    },
    sourceAnchorIds,
  }
}

function plotProgressionClock(
  targetId: string,
  version: number,
  turns: readonly {
    readonly turnId: string
    readonly storyEventId: string
    readonly turnType: 'obstacle' | 'choice' | 'consequence' | 'reversal'
    readonly description: string
    readonly cost: string
    readonly stateAfter: string
  }[],
): CanonDelta {
  return {
    id: `clock-${targetId}-plot-v${String(version)}`,
    kind: 'narrative-clock',
    operation: 'set',
    targetId,
    field: 'plot',
    value: {
      movement: 'advance',
      state: '旧案追查仍在推进',
      storyTime: 'day-1-evening',
      version,
      scope: {
        unitId: targetId,
        level: 'book',
      },
      lines: [{
        lineId: 'line-old-case',
        goal: '查清旧案真相',
        stakes: '主角将失去唯一证人',
        status: 'active',
        turns,
      }],
      revisionRationale: version === 1 ? null : '记录已发生的后果与反转',
    },
    sourceAnchorIds,
  } as unknown as CanonDelta
}

function readerKnowledgeClock(
  targetId: string,
  version: number,
  events: ReaderKnowledgeClockSetDelta['value']['events'],
  ambiguityMode: ReaderKnowledgeClockSetDelta['value']['ambiguityPolicy']['mode'],
): ReaderKnowledgeClockSetDelta {
  return {
    id: `clock-${targetId}-reader-knowledge-v${String(version)}`,
    kind: 'narrative-clock',
    operation: 'set',
    targetId,
    field: 'reader-knowledge',
    value: {
      movement: 'controlled-disclosure',
      state: '读者知道密道存在，但仍不知道引路人的真实身份',
      storyTime: 'day-2-night',
      version,
      scope: {
        unitId: targetId,
        level: 'volume',
      },
      events,
      ambiguityPolicy: {
        mode: ambiguityMode,
        description: ambiguityMode === 'preserve'
          ? '保留引路人身份的双重解释'
          : '缩小为王庭旧人与叛逃守卫两种解释',
      },
      revisionRationale: version === 1 ? null : '加入读者可见的密道刻痕并收窄歧义',
    },
    sourceAnchorIds,
  }
}

function mysteryClock(
  targetId: string,
  version: number,
  moves: MysteryClockSetDelta['value']['moves'],
): MysteryClockSetDelta {
  return {
    id: `clock-${targetId}-mystery-v${String(version)}`,
    kind: 'narrative-clock',
    operation: 'set',
    targetId,
    field: 'mystery',
    value: {
      movement: 'controlled-reveal',
      state: '旧案身份谜团仍在推进，但答案尚未完全公开',
      storyTime: 'day-3-dawn',
      version,
      scope: {
        unitId: targetId,
        level: 'volume',
      },
      moves,
      revisionRationale: version === 1 ? null : '记录新线索带来的局部揭示与重构',
    },
    sourceAnchorIds,
  }
}

function progressionClock(
  targetId: string,
  version: number,
  tracks: ProgressionClockSetDelta['value']['tracks'],
): ProgressionClockSetDelta {
  return {
    id: `clock-${targetId}-progression-v${String(version)}`,
    kind: 'narrative-clock',
    operation: 'set',
    targetId,
    field: 'progression',
    value: {
      movement: version === 1 ? 'setup-and-hold' : 'earned-advance',
      state: version === 1
        ? '主线能力正在铺垫，支线身份刻意保持不动'
        : '主线能力已用证据与代价兑现，支线继续保持',
      storyTime: 'day-4-night',
      version,
      scope: {
        unitId: targetId,
        level: 'volume',
      },
      tracks,
      revisionRationale: version === 1 ? null : '记录主线推进兑现并保留支线 hold',
    },
    sourceAnchorIds,
  }
}

function promiseClock(
  targetId: string,
  version: number,
  moves: readonly {
    readonly moveId: string
    readonly kind: 'open' | 'remind' | 'complicate' | 'partial-payoff' | 'payoff' | 'retire' | 'hold'
    readonly promiseId: string
    readonly debtIds: readonly string[] | null
    readonly contribution: string
  }[],
): PromiseClockSetDelta {
  return {
    id: `clock-${targetId}-promise-v${String(version)}`,
    kind: 'narrative-clock',
    operation: 'set',
    targetId,
    field: 'promise',
    value: {
      movement: version === 1 ? 'open-and-remind' : 'complicate-and-partial-payoff',
      state: version === 1
        ? '月门承诺已经提出并获得一次提醒'
        : '月门承诺因代价加重，并完成一次局部兑现',
      storyTime: 'day-5-dawn',
      version,
      scope: {
        unitId: targetId,
        level: 'volume',
      },
      moves,
      revisionRationale: version === 1 ? null : '记录承诺复杂化与局部兑现',
    },
    sourceAnchorIds,
  }
}

function characterClock(
  targetId: string,
  version: number,
  moves: readonly {
    readonly moveId: string
    readonly kind: 'pressure' | 'decision' | 'consequence' | 'commitment' | 'transformation' | 'hold'
    readonly characterId: string
    readonly storyEventIds: readonly string[]
    readonly contribution: string
  }[],
): CharacterClockSetDelta {
  return {
    id: `clock-${targetId}-character-v${String(version)}`,
    kind: 'narrative-clock',
    operation: 'set',
    targetId,
    field: 'character',
    value: {
      movement: 'pressure-and-choice',
      state: '沈砚仍在共同承担与独自控制之间做选择',
      storyTime: 'day-6-night',
      version,
      scope: {
        unitId: targetId,
        level: 'volume',
      },
      moves,
      revisionRationale: version === 1 ? null : '记录共享地图的决定及其持续后果',
    },
    sourceAnchorIds,
  }
}

function relationshipClock(
  targetId: string,
  version: number,
  moves: RelationshipClockSetDelta['value']['moves'],
): RelationshipClockSetDelta {
  return {
    id: `clock-${targetId}-relationship-v${String(version)}`,
    kind: 'narrative-clock',
    operation: 'set',
    targetId,
    field: 'relationship',
    value: {
      movement: 'earned-mutual-reliance',
      state: '两人仍保留独立目标，但开始用有代价的行动建立相互依赖',
      storyTime: 'day-8-night',
      version,
      scope: {
        unitId: targetId,
        level: 'volume',
      },
      moves,
      revisionRationale: version === 1 ? null : '记录撤离图牺牲带来的持续关系后果',
    },
    sourceAnchorIds,
  }
}

function removeNarrativeClock(targetId: string): NarrativeClockDelta {
  return {
    id: `remove-clock-${targetId}`,
    kind: 'narrative-clock',
    operation: 'remove',
    targetId,
    field: 'plot',
    value: null,
    sourceAnchorIds,
  }
}

function narrativeDebt(targetId: string, unitId: string): NarrativeDebtSetDelta {
  return {
    id: `debt-${targetId}`,
    kind: 'narrative-debt',
    operation: 'set',
    targetId,
    unitId,
    field: 'promise',
    value: {
      summary: `${targetId} remains owed`,
      status: 'open',
    },
    sourceAnchorIds,
  }
}

function removeNarrativeDebt(targetId: string, unitId: string): NarrativeDebtDelta {
  return {
    id: `remove-debt-${targetId}`,
    kind: 'narrative-debt',
    operation: 'remove',
    targetId,
    unitId,
    field: 'promise',
    value: null,
    sourceAnchorIds,
  }
}

function canonFact(value: string): CanonFactDelta {
  return {
    id: `canon-${value}`,
    kind: 'canon',
    operation: 'set',
    targetId: 'atomic-proof',
    field: 'status',
    value,
    sourceAnchorIds,
  }
}

function packet(
  name: string,
  expectedRevision: number,
  deltas: readonly CanonDelta[],
): NovelResultPacket {
  return {
    packetId: `packet-${name}`,
    expectedRevision,
    manuscript: {
      unitId: `manuscript-${name}`,
      title: name,
      text: `${name} manuscript`,
    },
    manuscriptDiff: {
      format: 'unified',
      text: `--- accepted/${name}\n+++ draft/${name}\n+${name}`,
    },
    deltas,
    issues: [],
    sourceAnchors: [{
      id: anchorId,
      sourceId: `source-${name}`,
      start: 0,
      end: name.length,
      contentHash: 'b'.repeat(64),
    }],
    provenance: {
      taskId: `task-${name}`,
      sessionId: 'fixture-narrative',
      producer: 'narrative-invariant-test',
    },
    authorization: {
      kind: 'author',
      actorId: 'author-1',
      decisionId: `decision-${name}`,
    },
  }
}

describe('NovelProjectService narrative projection', () => {
  it('reads Planning chapter contracts at the requested accepted revision after later edits and rollback', async () => {
    const { home, cwd } = await makeHome('planning-contract-seam')
    const runtime = await boot(home)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(workspace.id, packet('planning-root', 0, [
        narrativeUnit('book-1', 'book', null, 0),
        narrativeUnit('volume-1', 'volume', 'book-1', 0),
        narrativeUnit('arc-1', 'arc', 'volume-1', 0),
      ]))
      const chapter = narrativeUnit('chapter-1', 'chapter', 'arc-1', 0) as Extract<NarrativeUnitDelta, { operation: 'set' }>
      const chapterContract = {
        viewpoint: '沈砚，第三人称限知',
        storyTime: '第一夜',
        sceneFunctions: ['阻碍与选择'],
        activePlotLineIds: [],
        activeRelationshipLineIds: [],
        promisesTouched: [],
        informationPolicy: { readerMayKnow: [], characterMayKnow: [] },
        progressionSetups: [],
        progressionPayoffs: [],
        emotionalMovement: '疑虑变为决心',
        endingPull: 'R2：船票背面出现第七码头',
        prohibitedContradictions: [],
        styleConstraints: [],
        lengthRange: { min: 2900, max: 3100 },
        acceptanceGates: ['人物必须付出可观察代价'],
      }
      await runtime.ctx.novelProject.accept(workspace.id, packet('planning-contract', 1, [{
        ...chapter,
        value: { ...chapter.value, chapterContract },
      }]))
      await runtime.ctx.novelProject.accept(workspace.id, packet('planning-future', 2, [{
        ...chapter,
        value: { ...chapter.value, chapterContract: { ...chapterContract, endingPull: 'R3：证人跳海' } },
      }]))

      const storagePath = join(home, 'storages', 'novel_project.json')
      const beforeRead = await readFile(storagePath)
      const historical = runtime.ctx.novelPlanning.readPlan(workspace.id, 2)
      expect(runtime.ctx.novelProject.readProjection('planning/narrative', workspace.id, 2)).toEqual(historical)
      expect(historical).toMatchObject({ workspaceId: workspace.id, revision: 2 })
      expect(historical.units).toEqual([
        expect.objectContaining({ id: 'book-1' }),
        expect.objectContaining({ id: 'volume-1' }),
        expect.objectContaining({ id: 'arc-1' }),
        expect.objectContaining({ id: 'chapter-1', chapterContract, sourceRevision: 2, sourceAnchorIds }),
      ])
      expect(JSON.stringify(historical)).not.toContain('R3：证人跳海')
      expect(runtime.ctx.novelPlanning.readPlan(workspace.id, 3).units.at(-1)?.chapterContract?.endingPull)
        .toBe('R3：证人跳海')
      expect(await readFile(storagePath)).toEqual(beforeRead)

      await runtime.ctx.novelProject.rollback(workspace.id, {
        commandId: 'planning-rollback', expectedRevision: 3, targetRevision: 2,
        provenance: { taskId: 'planning-rollback', sessionId: 'fixture-narrative', producer: 'author' },
        authorization: { kind: 'author', actorId: 'author-1', decisionId: 'planning-rollback' },
      })
      expect(runtime.ctx.novelPlanning.readPlan(workspace.id, 4).units.at(-1)?.chapterContract).toEqual(chapterContract)
      expect(runtime.ctx.novelPlanning.readPlan(workspace.id, 3).units.at(-1)?.chapterContract?.endingPull)
        .toBe('R3：证人跳海')
    } finally {
      await skills.dispose()
      await runtime.dispose()
    }
  })

  it('projects the accepted hierarchy and all ten explicit clock buckets without inferring clocks from status facts', async () => {
    const { home, cwd } = await makeHome('complete')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(workspace.id, {
        packetId: 'packet-narrative-r1',
        expectedRevision: 0,
        manuscript: {
          unitId: 'chapter-1',
          title: '第一章',
          text: '主角回到故乡，决定查清旧案。',
        },
        manuscriptDiff: {
          format: 'unified',
          text: '--- accepted/chapter-1\n+++ draft/chapter-1\n+主角回到故乡，决定查清旧案。',
        },
        deltas: [
          narrativeUnit('series-main', 'series', null, 0),
          narrativeUnit('book-main', 'book', 'series-main', 0),
          narrativeUnit('volume-1', 'volume', 'book-main', 0),
          narrativeUnit('arc-return', 'arc', 'volume-1', 0),
          narrativeUnit('chapter-1', 'chapter', 'arc-return', 0),
          narrativeUnit('scene-arrival', 'scene', 'chapter-1', 0),
          narrativeUnit('beat-decision', 'beat', 'scene-arrival', 0),
          narrativeUnit('prose-opening', 'prose', 'beat-decision', 0),
          narrativeUnit('book-standalone', 'book', null, 1),
          {
            ...narrativeClock('chapter-1', 'chapter'),
            id: 'clock-plot-chapter-1',
            value: {
              ...narrativeClock('chapter-1', 'chapter').value,
              movement: 'advance',
              state: '主角选择调查旧案，形成新的因果目标。',
              storyTime: 'day-1-evening',
            },
          },
          {
            id: 'debt-promise-old-case',
            kind: 'narrative-debt',
            operation: 'set',
            targetId: 'promise-old-case',
            field: 'promise',
            unitId: 'chapter-1',
            value: {
              summary: '解释旧案真相并兑现返乡承诺。',
              status: 'open',
              horizon: 'volume-1',
            },
            sourceAnchorIds,
          },
          {
            id: 'generic-status-is-not-a-clock',
            kind: 'canon',
            operation: 'set',
            targetId: 'chapter-1',
            field: 'status',
            value: 'active',
            sourceAnchorIds,
          },
        ],
        issues: [],
        sourceAnchors: [{
          id: anchorId,
          sourceId: 'draft-chapter-1',
          start: 0,
          end: 15,
          contentHash: 'a'.repeat(64),
        }],
        provenance: {
          taskId: 'task-narrative-r1',
          sessionId: 'fixture-narrative',
          producer: 'planner-composer',
        },
        authorization: {
          kind: 'author',
          actorId: 'author-1',
          decisionId: 'decision-narrative-r1',
        },
      })

      const projection = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)

      expect(projection).toMatchObject({
        projectId: expect.any(String),
        workspaceId: workspace.id,
        revision: 1,
      })
      expect(projection.units.map(unit => ({
        id: unit.id,
        level: unit.level,
        parentId: unit.parentId,
        order: unit.order,
      }))).toEqual([
        { id: 'series-main', level: 'series', parentId: null, order: 0 },
        { id: 'book-main', level: 'book', parentId: 'series-main', order: 0 },
        { id: 'volume-1', level: 'volume', parentId: 'book-main', order: 0 },
        { id: 'arc-return', level: 'arc', parentId: 'volume-1', order: 0 },
        { id: 'chapter-1', level: 'chapter', parentId: 'arc-return', order: 0 },
        { id: 'scene-arrival', level: 'scene', parentId: 'chapter-1', order: 0 },
        { id: 'beat-decision', level: 'beat', parentId: 'scene-arrival', order: 0 },
        { id: 'prose-opening', level: 'prose', parentId: 'beat-decision', order: 0 },
        { id: 'book-standalone', level: 'book', parentId: null, order: 1 },
      ])
      expect(projection.units[4]).toMatchObject({
        sourceRevision: 1,
        sourceDeltaId: 'unit-chapter-1',
        sourceAnchorIds,
        provenance: {
          taskId: 'task-narrative-r1',
          sessionId: 'fixture-narrative',
          producer: 'planner-composer',
        },
        delta: {
          kind: 'narrative-unit',
          targetId: 'chapter-1',
        },
      })

      expect(projection.clocks.map(clock => clock.clock)).toEqual([
        'plot',
        'promise',
        'progression',
        'world',
        'character',
        'relationship',
        'mystery',
        'reader-knowledge',
        'tension-payoff',
        'ending',
      ])
      expect(projection.clocks.map(clock => ({
        clock: clock.clock,
        entryIds: clock.entries.map(entry => entry.unitId),
        debtIds: clock.debts.map(debt => debt.id),
      }))).toEqual([
        { clock: 'plot', entryIds: ['chapter-1'], debtIds: [] },
        { clock: 'promise', entryIds: [], debtIds: ['promise-old-case'] },
        { clock: 'progression', entryIds: [], debtIds: [] },
        { clock: 'world', entryIds: [], debtIds: [] },
        { clock: 'character', entryIds: [], debtIds: [] },
        { clock: 'relationship', entryIds: [], debtIds: [] },
        { clock: 'mystery', entryIds: [], debtIds: [] },
        { clock: 'reader-knowledge', entryIds: [], debtIds: [] },
        { clock: 'tension-payoff', entryIds: [], debtIds: [] },
        { clock: 'ending', entryIds: [], debtIds: [] },
      ])
      expect(projection.clocks[0]?.entries[0]).toMatchObject({
        unitId: 'chapter-1',
        movement: 'advance',
        state: '主角选择调查旧案，形成新的因果目标。',
        storyTime: 'day-1-evening',
        sourceRevision: 1,
        sourceDeltaId: 'clock-plot-chapter-1',
        sourceAnchorIds,
        delta: { kind: 'narrative-clock', field: 'plot' },
      })
      expect(projection.clocks[1]?.debts[0]).toMatchObject({
        id: 'promise-old-case',
        unitId: 'chapter-1',
        status: 'open',
        sourceRevision: 1,
        sourceDeltaId: 'debt-promise-old-case',
        sourceAnchorIds,
        delta: { kind: 'narrative-debt', field: 'promise' },
      })
      expect(Object.isFrozen(projection)).toBe(true)
      expect(projection.units.every(Object.isFrozen)).toBe(true)
      expect(projection.clocks.every(Object.isFrozen)).toBe(true)
    } finally {
      await runtime.dispose()
    }
  })

  it('rebuilds the next-chapter control pack from each accepted revision', async () => {
    const { home, cwd } = await makeHome('control-pack')
    const runtime = await boot(home)
    const chapterContract = {
      viewpoint: 'alice',
      storyTime: 'third-night',
      sceneFunctions: ['discovery'],
      activePlotLineIds: [
        'plot-missing-before',
        'plot-old-case',
        'plot-missing-after',
        'plot-shadow-route',
      ],
      activeRelationshipLineIds: [
        'missing<->relationship-before',
        'alice<->bob',
        'missing<->relationship-after',
        'alice<->carol',
      ],
      promisesTouched: [{
        promiseId: 'promise-missing-before',
        intendedMovement: 'hold',
      }, {
        promiseId: 'promise-old-case',
        intendedMovement: 'advance',
      }, {
        promiseId: 'promise-missing-after',
        intendedMovement: 'retire',
      }, {
        promiseId: 'promise-shadow-route',
        intendedMovement: 'remind',
      }],
      informationPolicy: { readerMayKnow: [], characterMayKnow: [] },
      progressionSetups: [],
      progressionPayoffs: [],
      emotionalMovement: 'doubt becomes resolve',
      endingPull: 'the sealed route opens',
      prohibitedContradictions: [],
      styleConstraints: [],
      lengthRange: { min: 1, max: 2 },
      acceptanceGates: ['resolve one reference'],
    } as const
    const chapterThree = narrativeUnit(
      'chapter-3',
      'chapter',
      'arc-1',
      2,
    ) as Extract<NarrativeUnitDelta, { readonly operation: 'set' }>
    const chapterThreeWithContract: NarrativeUnitDelta = {
      ...chapterThree,
      value: { ...chapterThree.value, chapterContract },
    }
    const plotClock = (
      unitId: 'series-main' | 'arc-1' | 'chapter-3',
      level: 'series' | 'arc' | 'chapter',
      version: number,
      lines: readonly string[],
    ) => {
      const base = narrativeClock(unitId, level, version)
      return {
        ...base,
        id: `clock-${unitId}-r${String(version)}`,
        value: {
          ...base.value,
          lines: lines.map(lineId => ({
            lineId,
            goal: `${unitId} ${lineId} goal R${String(version)}`,
            stakes: `${unitId} ${lineId} stakes R${String(version)}`,
            status: 'active',
            turns: [],
          })),
          revisionRationale: version === 1 ? null : `R${String(version)} update`,
        },
      } as const
    }
    const promiseState = (promiseId: string, version: number) => ({
      version,
      promise: `${promiseId} promise R${String(version)}`,
      type: 'mystery',
      weight: 'major' as const,
      horizon: {
        openedUnitId: 'chapter-1',
        expectedPayoffStartUnitId: 'chapter-3',
        expectedPayoffEndUnitId: 'chapter-3',
      },
      setup: {
        beatId: `${promiseId}-setup`,
        unitId: 'chapter-1',
        sourceRevision: 1,
        sourceAnchorIds,
        description: `${promiseId} setup`,
      },
      reminders: version === 1 ? [] : [{
        beatId: `${promiseId}-reminder-r${String(version)}`,
        unitId: 'chapter-2',
        sourceRevision: version,
        sourceAnchorIds,
        description: `${promiseId} reminder R${String(version)}`,
      }],
      complications: [],
      resolution: {
        status: 'open' as const,
        payoffType: null,
        beat: null,
        retirementRationale: null,
      },
      aftermath: null,
      revisionRationale: version === 1 ? null : `${promiseId} advanced`,
    })
    const oldCasePromiseR1 = promiseState('promise-old-case', 1)
    const shadowPromiseR1 = promiseState('promise-shadow-route', 1)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...packet('control-pack-r1', 0, [
          narrativeUnit('series-main', 'series', null, 0),
          narrativeUnit('book-main', 'book', 'series-main', 0),
          narrativeUnit('volume-1', 'volume', 'book-main', 0),
          narrativeUnit('arc-1', 'arc', 'volume-1', 0),
          narrativeUnit('chapter-1', 'chapter', 'arc-1', 0),
          narrativeUnit('chapter-2', 'chapter', 'arc-1', 1),
          chapterThreeWithContract,
          {
            id: 'canon-chapter-3-location-r1',
            kind: 'canon',
            operation: 'set',
            targetId: 'chapter-3',
            field: 'location',
            value: '旧庭',
            sourceAnchorIds,
          },
          plotClock('series-main', 'series', 1, ['plot-old-case']),
          plotClock('arc-1', 'arc', 1, ['plot-shadow-route']),
          {
            ...plotClock('chapter-3', 'chapter', 1, ['plot-old-case']),
            value: {
              ...plotClock('chapter-3', 'chapter', 1, ['plot-old-case']).value,
              movement: 'setup',
              state: '追查旧案',
            },
          },
          {
            id: 'relationship-alice-bob-r1',
            kind: 'relationship',
            operation: 'set',
            targetId: 'alice->bob',
            field: 'trust',
            value: 'guarded',
            sourceAnchorIds,
          },
          {
            id: 'relationship-bob-alice-r1',
            kind: 'relationship',
            operation: 'set',
            targetId: 'bob->alice',
            field: 'trust',
            value: 'cautious',
            sourceAnchorIds,
          },
          {
            id: 'relationship-alice-carol-r1',
            kind: 'relationship',
            operation: 'set',
            targetId: 'alice->carol',
            field: 'trust',
            value: 'earned',
            sourceAnchorIds,
          },
          {
            id: 'relationship-carol-alice-r1',
            kind: 'relationship',
            operation: 'set',
            targetId: 'carol->alice',
            field: 'trust',
            value: 'earned',
            sourceAnchorIds,
          },
          {
            id: 'promise-old-case-state-r1',
            kind: 'promise',
            operation: 'set',
            targetId: 'promise-old-case',
            field: 'state',
            value: oldCasePromiseR1,
            sourceAnchorIds,
          },
          {
            id: 'promise-shadow-route-state-r1',
            kind: 'promise',
            operation: 'set',
            targetId: 'promise-shadow-route',
            field: 'state',
            value: shadowPromiseR1,
            sourceAnchorIds,
          },
          narrativeDebt('promise-old-case', 'chapter-3'),
        ]),
        manuscript: {
          unitId: 'chapter-1',
          title: '第一章 归乡',
          text: '她回到旧庭。',
        },
      })

      const first = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 1,
        chapterId: 'chapter-3',
      })
      expect(first.controlPack).toMatchObject({
        sourceRevision: 1,
        headRevision: 1,
        freshness: 'current',
        chapter: { id: 'chapter-3', level: 'chapter' },
        scope: [
          { id: 'series-main' },
          { id: 'book-main' },
          { id: 'volume-1' },
          { id: 'arc-1' },
          { id: 'chapter-3' },
        ],
        scopedCanonFacts: [{
          targetId: 'chapter-3',
          field: 'location',
          value: '旧庭',
          sourceRevision: 1,
        }],
        recentManuscripts: [{
          manuscript: { unitId: 'chapter-1', text: '她回到旧庭。' },
          sourceRevision: 1,
        }],
        referenceResolution: {
          plotLines: {
            resolved: [{
              lineId: 'plot-old-case',
              line: { goal: 'chapter-3 plot-old-case goal R1' },
              clockEntry: {
                unitId: 'chapter-3',
                sourceRevision: 1,
                sourceDeltaId: 'clock-chapter-3-r1',
              },
            }, {
              lineId: 'plot-shadow-route',
              line: { goal: 'arc-1 plot-shadow-route goal R1' },
              clockEntry: {
                unitId: 'arc-1',
                sourceRevision: 1,
                sourceDeltaId: 'clock-arc-1-r1',
              },
            }],
            missing: ['plot-missing-before', 'plot-missing-after'],
          },
          relationshipLines: {
            resolved: [{
              lineId: 'alice<->bob',
              line: {
                line: 'alice<->bob',
                directions: [
                  { pair: 'alice->bob', fields: { trust: 'guarded' }, sourceRevision: 1 },
                  { pair: 'bob->alice', fields: { trust: 'cautious' }, sourceRevision: 1 },
                ],
              },
            }, {
              lineId: 'alice<->carol',
              line: { line: 'alice<->carol' },
            }],
            missing: ['missing<->relationship-before', 'missing<->relationship-after'],
          },
          promises: {
            resolved: [{
              promiseId: 'promise-old-case',
              intendedMovement: 'advance',
              state: oldCasePromiseR1,
              fact: {
                sourceRevision: 1,
                sourceDeltaId: 'promise-old-case-state-r1',
              },
            }, {
              promiseId: 'promise-shadow-route',
              intendedMovement: 'remind',
              state: shadowPromiseR1,
              fact: {
                sourceRevision: 1,
                sourceDeltaId: 'promise-shadow-route-state-r1',
              },
            }],
            missing: [{
              promiseId: 'promise-missing-before',
              intendedMovement: 'hold',
            }, {
              promiseId: 'promise-missing-after',
              intendedMovement: 'retire',
            }],
          },
        },
      })
      expect(first.controlPack?.clocks.map(bucket => bucket.clock)).toEqual([
        'plot',
        'promise',
        'progression',
        'world',
        'character',
        'relationship',
        'mystery',
        'reader-knowledge',
        'tension-payoff',
        'ending',
      ])
      expect(first.controlPack?.clocks[0]).toMatchObject({
        clock: 'plot',
      })
      expect(first.controlPack?.clocks[0]?.entries.find(entry => entry.unitId === 'chapter-3'))
        .toMatchObject({ unitId: 'chapter-3', state: '追查旧案', sourceRevision: 1 })
      expect(first.controlPack?.clocks[1]).toMatchObject({
        clock: 'promise',
        debts: [{ id: 'promise-old-case', unitId: 'chapter-3', sourceRevision: 1 }],
      })
      expect(runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 1,
        chapterId: 'chapter-2',
      }).controlPack?.referenceResolution).toEqual({
        plotLines: { resolved: [], missing: [] },
        relationshipLines: { resolved: [], missing: [] },
        promises: { resolved: [], missing: [] },
      })

      const oldCasePromiseR2 = promiseState('promise-old-case', 2)
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...packet('control-pack-r2', 1, [
          {
            id: 'canon-chapter-3-location-r2',
            kind: 'canon',
            operation: 'set',
            targetId: 'chapter-3',
            field: 'location',
            value: '雪庭密道',
            sourceAnchorIds,
          },
          {
            ...plotClock('chapter-3', 'chapter', 2, ['plot-old-case']),
            value: {
              ...plotClock('chapter-3', 'chapter', 2, ['plot-old-case']).value,
              movement: 'advance',
              state: '发现密道入口',
            },
          },
          {
            id: 'relationship-alice-bob-r2',
            kind: 'relationship',
            operation: 'set',
            targetId: 'alice->bob',
            field: 'trust',
            value: 'earned',
            sourceAnchorIds,
          },
          {
            id: 'promise-old-case-state-r2',
            kind: 'promise',
            operation: 'set',
            targetId: 'promise-old-case',
            field: 'state',
            value: oldCasePromiseR2,
            sourceAnchorIds,
          },
        ]),
        manuscript: {
          unitId: 'chapter-2',
          title: '第二章 门闩',
          text: '她解开门闩。',
        },
      })

      const rebuilt = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        chapterId: 'chapter-3',
      }).controlPack
      expect(rebuilt).toMatchObject({
        sourceRevision: 2,
        headRevision: 2,
        freshness: 'current',
        scopedCanonFacts: [{
          targetId: 'chapter-3',
          field: 'location',
          value: '雪庭密道',
          sourceRevision: 2,
        }],
      })
      expect(rebuilt?.recentManuscripts.map(projected => [
        projected.manuscript.unitId,
        projected.sourceRevision,
      ])).toEqual([
        ['chapter-1', 1],
        ['chapter-2', 2],
      ])
      expect(rebuilt?.clocks[0]?.entries.find(entry => entry.unitId === 'chapter-3')).toMatchObject({
        unitId: 'chapter-3',
        state: '发现密道入口',
        sourceRevision: 2,
      })
      expect(rebuilt?.referenceResolution).toMatchObject({
        plotLines: {
          resolved: [{
            lineId: 'plot-old-case',
            line: { goal: 'chapter-3 plot-old-case goal R2' },
            clockEntry: { unitId: 'chapter-3', sourceRevision: 2 },
          }, {
            lineId: 'plot-shadow-route',
            line: { goal: 'arc-1 plot-shadow-route goal R1' },
            clockEntry: { unitId: 'arc-1', sourceRevision: 1 },
          }],
          missing: ['plot-missing-before', 'plot-missing-after'],
        },
        relationshipLines: {
          resolved: [{
            lineId: 'alice<->bob',
            line: { directions: [
              { pair: 'alice->bob', fields: { trust: 'earned' }, sourceRevision: 2 },
              { pair: 'bob->alice', fields: { trust: 'cautious' }, sourceRevision: 1 },
            ] },
          }, { lineId: 'alice<->carol' }],
          missing: ['missing<->relationship-before', 'missing<->relationship-after'],
        },
        promises: {
          resolved: [{
            promiseId: 'promise-old-case',
            intendedMovement: 'advance',
            state: oldCasePromiseR2,
            fact: { sourceRevision: 2, sourceDeltaId: 'promise-old-case-state-r2' },
          }, {
            promiseId: 'promise-shadow-route',
            intendedMovement: 'remind',
            state: shadowPromiseR1,
            fact: { sourceRevision: 1, sourceDeltaId: 'promise-shadow-route-state-r1' },
          }],
          missing: [{ promiseId: 'promise-missing-before', intendedMovement: 'hold' }, {
            promiseId: 'promise-missing-after', intendedMovement: 'retire',
          }],
        },
      })

      const canonBeforeHistoricalQuery = runtime.ctx.novelProject.projectCanon(workspace.id, 2)
      const historical = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 1,
        chapterId: 'chapter-3',
      }).controlPack
      expect(historical).toMatchObject({
        sourceRevision: 1,
        headRevision: 2,
        freshness: 'historical',
        scopedCanonFacts: [{ value: '旧庭', sourceRevision: 1 }],
      })
      expect(historical?.recentManuscripts.map(projected => projected.manuscript.unitId))
        .toEqual(['chapter-1'])
      expect(historical?.referenceResolution).toMatchObject({
        plotLines: { resolved: [
          { lineId: 'plot-old-case', clockEntry: { sourceRevision: 1 } },
          { lineId: 'plot-shadow-route', clockEntry: { sourceRevision: 1 } },
        ] },
        relationshipLines: { resolved: [
          { lineId: 'alice<->bob', line: { directions: [
            { sourceRevision: 1 }, { sourceRevision: 1 },
          ] } },
          { lineId: 'alice<->carol' },
        ] },
        promises: { resolved: [
          { promiseId: 'promise-old-case', state: oldCasePromiseR1, fact: { sourceRevision: 1 } },
          { promiseId: 'promise-shadow-route', state: shadowPromiseR1, fact: { sourceRevision: 1 } },
        ] },
      })
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeHistoricalQuery)
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
    } finally {
      await runtime.dispose()
    }
  })

  it.each([
    {
      name: 'rejects a series nested below a book',
      id: 'illegal-parent',
      deltas: [
        narrativeUnit('book-root', 'book', null, 0),
        narrativeUnit('series-child', 'series', 'book-root', 0),
        canonFact('illegal-parent'),
      ],
      error: /series.*root/i,
    },
    {
      name: 'rejects an orphan volume',
      id: 'orphan',
      deltas: [
        narrativeUnit('volume-orphan', 'volume', 'book-missing', 0),
        canonFact('orphan'),
      ],
      error: /missing parent|orphan/i,
    },
    {
      name: 'rejects a parent cycle',
      id: 'cycle',
      deltas: [
        narrativeUnit('series-cycle', 'series', 'book-cycle', 0),
        narrativeUnit('book-cycle', 'book', 'series-cycle', 0),
        canonFact('cycle'),
      ],
      error: /cycle/i,
    },
    {
      name: 'rejects duplicate sibling order',
      id: 'duplicate-order',
      deltas: [
        narrativeUnit('book-first', 'book', null, 0),
        narrativeUnit('book-second', 'book', null, 0),
        canonFact('duplicate-order'),
      ],
      error: /sibling.*order|order.*sibling/i,
    },
    {
      name: 'rejects a clock whose target unit is absent',
      id: 'clock-target',
      deltas: [narrativeClock('unit-missing', 'book'), canonFact('clock-target')],
      error: /clock.*unit-missing|unit-missing.*clock/i,
    },
    {
      name: 'rejects a debt whose unit is absent',
      id: 'debt-unit',
      deltas: [narrativeDebt('promise-missing', 'unit-missing'), canonFact('debt-unit')],
      error: /debt.*unit-missing|unit-missing.*debt/i,
    },
  ])('$name and preserves the atomic head', async ({ id, deltas, error }) => {
    const { home, cwd } = await makeHome(id)
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)

      await expect(runtime.ctx.novelProject.accept(
        workspace.id,
        packet(id, 0, deltas),
      )).rejects.toThrow(error)

      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(0)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 0).facts).toEqual([])
      expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 0).units).toEqual([])
    } finally {
      await runtime.dispose()
    }
  })

  it('validates the actual accepted subset and atomically rejects an accepted child whose parent was rejected', async () => {
    const { home, cwd } = await makeHome('partial-review')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const commandPacket = packet('partial-review', 0, [
        narrativeUnit('book-rejected', 'book', null, 0),
        narrativeUnit('volume-accepted', 'volume', 'book-rejected', 0),
        canonFact('must-not-commit'),
      ])

      await expect(runtime.ctx.novelProject.review(workspace.id, {
        packet: commandPacket,
        decisions: [
          {
            itemType: 'manuscript',
            itemId: commandPacket.manuscript!.unitId,
            outcome: 'accept',
          },
          { itemType: 'delta', itemId: 'unit-book-rejected', outcome: 'reject' },
          { itemType: 'delta', itemId: 'unit-volume-accepted', outcome: 'accept' },
          { itemType: 'delta', itemId: 'canon-must-not-commit', outcome: 'accept' },
        ],
      })).rejects.toThrow(/missing parent|orphan/i)

      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(0)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 0).facts).toEqual([])
    } finally {
      await runtime.dispose()
    }
  })

  it('commits a valid accepted subset while retaining every review decision in packet order', async () => {
    const { home, cwd } = await makeHome('partial-review-valid')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const commandPacket = packet('partial-review-valid', 0, [
        narrativeUnit('book-accepted', 'book', null, 0),
        narrativeUnit('book-rejected', 'book', null, 0),
        narrativeClock('book-accepted', 'book'),
        narrativeDebt('promise-accepted', 'book-accepted'),
      ])
      const decisions = [
        {
          itemType: 'manuscript' as const,
          itemId: commandPacket.manuscript!.unitId,
          outcome: 'accept' as const,
        },
        { itemType: 'delta' as const, itemId: 'debt-promise-accepted', outcome: 'accept' as const },
        { itemType: 'delta' as const, itemId: 'unit-book-rejected', outcome: 'reject' as const },
        { itemType: 'delta' as const, itemId: 'clock-book-accepted', outcome: 'accept' as const },
        { itemType: 'delta' as const, itemId: 'unit-book-accepted', outcome: 'accept' as const },
      ]

      const accepted = await runtime.ctx.novelProject.review(workspace.id, {
        packet: commandPacket,
        decisions,
      })

      expect(accepted.deltas).toEqual([
        commandPacket.deltas[0],
        commandPacket.deltas[2],
        commandPacket.deltas[3],
      ])
      expect(accepted.decisions).toEqual([
        decisions[0],
        decisions[4],
        decisions[2],
        decisions[3],
        decisions[1],
      ])
      const projection = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      expect(projection).toMatchObject({
        revision: 1,
        units: [{ id: 'book-accepted' }],
      })
      expect(projection.clocks[0]).toMatchObject({
        clock: 'plot',
        entries: [{ unitId: 'book-accepted' }],
        debts: [],
      })
      expect(projection.clocks[1]).toMatchObject({
        clock: 'promise',
        entries: [],
        debts: [{ id: 'promise-accepted' }],
      })
      expect(projection.units)
        .not.toContainEqual(expect.objectContaining({ id: 'book-rejected' }))
    } finally {
      await runtime.dispose()
    }
  })

  it('keeps an accepted narrative unit level immutable across later revisions', async () => {
    const { home, cwd } = await makeHome('immutable-level')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(workspace.id, packet('immutable-level-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        canonFact('baseline'),
      ]))

      await expect(runtime.ctx.novelProject.accept(workspace.id, packet(
        'immutable-level-r2',
        1,
        [narrativeUnit('book-main', 'series', null, 0), canonFact('mutated')],
      ))).rejects.toThrow(/level.*immutable|cannot change.*level/i)

      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(1)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 1).facts)
        .toMatchObject([{ value: 'baseline', sourceRevision: 1 }])
      expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 1).units)
        .toEqual([expect.objectContaining({ id: 'book-main', level: 'book', sourceRevision: 1 })])
    } finally {
      await runtime.dispose()
    }
  })

  it('rolls narrative state back, continues from that state, and restores every projection after restart', async () => {
    const { home, cwd } = await makeHome('rollback-restart')
    const firstRuntime = await boot(home)
    let expectedProject: Awaited<ReturnType<typeof firstRuntime.ctx.novelProject.open>>
    let expectedProjections: readonly unknown[] = []
    try {
      const workspace = await firstRuntime.ctx.workspaceRegistry.create(cwd)
      expectedProject = await firstRuntime.ctx.novelProject.open(workspace)
      await firstRuntime.ctx.novelProject.accept(workspace.id, packet('rollback-restart-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        narrativeUnit('book-side', 'book', null, 1),
        narrativeClock('book-main', 'book'),
        narrativeDebt('promise-main', 'book-main'),
      ]))
      const first = firstRuntime.ctx.novelProject.projectNarrative(workspace.id, 1)

      await firstRuntime.ctx.novelProject.accept(workspace.id, packet('rollback-restart-r2', 1, [
        { ...narrativeUnit('book-main', 'book', null, 1), id: 'unit-book-main-r2' },
        { ...narrativeUnit('book-side', 'book', null, 0), id: 'unit-book-side-r2' },
        {
          ...narrativeClock('book-main', 'book', 2),
          id: 'clock-book-main-r2',
          value: {
            ...narrativeClock('book-main', 'book', 2).value,
            movement: 'reverse',
            state: 'R2 plot state',
          },
        },
        {
          ...narrativeDebt('promise-main', 'book-main'),
          id: 'debt-promise-main-r2',
          value: { summary: 'R2 debt state', status: 'resolved' },
        },
      ]))
      const second = firstRuntime.ctx.novelProject.projectNarrative(workspace.id, 2)
      expect(second.units.map(unit => unit.id)).toEqual(['book-side', 'book-main'])

      await firstRuntime.ctx.novelProject.rollback(workspace.id, {
        commandId: 'rollback-narrative-to-r1',
        expectedRevision: 2,
        targetRevision: 1,
        provenance: {
          taskId: 'task-rollback-narrative',
          sessionId: 'fixture-narrative',
          producer: 'author',
        },
        authorization: {
          kind: 'author',
          actorId: 'author-1',
          decisionId: 'decision-rollback-narrative',
        },
      })
      const third = firstRuntime.ctx.novelProject.projectNarrative(workspace.id, 3)
      expect(third.revision).toBe(3)
      expect(third.units).toEqual(first.units)
      expect(third.clocks).toEqual(first.clocks)
      expect(third.units[0]).toMatchObject({
        sourceRevision: 1,
        sourceDeltaId: 'unit-book-main',
        sourceAnchorIds,
        provenance: { taskId: 'task-rollback-restart-r1' },
        delta: { id: 'unit-book-main' },
      })

      await firstRuntime.ctx.novelProject.accept(workspace.id, packet('rollback-restart-r4', 3, [
        { ...narrativeUnit('book-side', 'book', null, 1), id: 'unit-book-side-r4' },
      ]))
      const fourth = firstRuntime.ctx.novelProject.projectNarrative(workspace.id, 4)
      expect(fourth.units.map(unit => [unit.id, unit.sourceRevision])).toEqual([
        ['book-main', 1],
        ['book-side', 4],
      ])
      expect(fourth.clocks).toEqual(first.clocks)
      expect(firstRuntime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(4)
      expect([1, 2, 3, 4].map(revision =>
        firstRuntime.ctx.novelProject.readRevision(workspace.id, revision)?.revision,
      )).toEqual([1, 2, 3, 4])
      expectedProject = firstRuntime.ctx.novelProject.current(workspace.id) ?? expectedProject
      expectedProjections = [first, second, third, fourth]
    } finally {
      await firstRuntime.dispose()
    }

    const secondRuntime = await boot(home)
    try {
      const workspace = await secondRuntime.ctx.workspaceRegistry.create(cwd)
      expect(await secondRuntime.ctx.novelProject.open(workspace)).toEqual(expectedProject)
      for (const [index, projection] of expectedProjections.entries()) {
        expect(secondRuntime.ctx.novelProject.projectNarrative(workspace.id, index + 1))
          .toEqual(projection)
      }
    } finally {
      await secondRuntime.dispose()
    }
  })

  it.each([
    {
      name: 'child',
      initial: [
        narrativeUnit('book-parent', 'book', null, 0),
        narrativeUnit('volume-child', 'volume', 'book-parent', 0),
      ],
      error: /missing parent|orphan/i,
    },
    {
      name: 'clock',
      initial: [narrativeUnit('book-parent', 'book', null, 0), narrativeClock('book-parent', 'book')],
      error: /clock.*book-parent|book-parent.*clock/i,
    },
    {
      name: 'debt',
      initial: [
        narrativeUnit('book-parent', 'book', null, 0),
        narrativeDebt('promise-parent', 'book-parent'),
      ],
      error: /debt.*book-parent|book-parent.*debt/i,
    },
  ])('rejects removing a unit still referenced by a $name and preserves R1', async ({ name, initial, error }) => {
    const { home, cwd } = await makeHome(`remove-${name}`)
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(
        workspace.id,
        packet(`remove-${name}-r1`, 0, [...initial, canonFact('baseline')]),
      )

      await expect(runtime.ctx.novelProject.accept(workspace.id, packet(
        `remove-${name}-r2`,
        1,
        [removeNarrativeUnit('book-parent'), canonFact('mutated')],
      ))).rejects.toThrow(error)

      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(1)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 1).facts)
        .toMatchObject([{ value: 'baseline', sourceRevision: 1 }])
      expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 1).units)
        .toContainEqual(expect.objectContaining({ id: 'book-parent' }))
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects removing a debt through the wrong unit and preserves R1', async () => {
    const { home, cwd } = await makeHome('remove-debt-wrong-unit')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(workspace.id, packet('remove-debt-wrong-unit-r1', 0, [
        narrativeUnit('book-parent', 'book', null, 0),
        narrativeDebt('promise-parent', 'book-parent'),
        canonFact('baseline'),
      ]))

      await expect(runtime.ctx.novelProject.accept(workspace.id, packet(
        'remove-debt-wrong-unit-r2',
        1,
        [removeNarrativeDebt('promise-parent', 'book-wrong'), canonFact('mutated')],
      ))).rejects.toThrow(/debt.*promise-parent.*book-wrong/i)

      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(1)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 1).facts)
        .toMatchObject([{ value: 'baseline', sourceRevision: 1 }])
      expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 1).clocks[1]?.debts)
        .toContainEqual(expect.objectContaining({ id: 'promise-parent', unitId: 'book-parent' }))
    } finally {
      await runtime.dispose()
    }
  })

  it('allows a unit and all of its child, clock and debt references to be removed in one accepted set', async () => {
    const { home, cwd } = await makeHome('remove-complete')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(workspace.id, packet('remove-complete-r1', 0, [
        narrativeUnit('book-parent', 'book', null, 0),
        narrativeUnit('volume-child', 'volume', 'book-parent', 0),
        narrativeClock('book-parent', 'book'),
        narrativeDebt('promise-parent', 'book-parent'),
      ]))

      await runtime.ctx.novelProject.accept(workspace.id, packet('remove-complete-r2', 1, [
        removeNarrativeUnit('volume-child'),
        removeNarrativeClock('book-parent'),
        removeNarrativeDebt('promise-parent', 'book-parent'),
        removeNarrativeUnit('book-parent'),
      ]))

      const projection = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      expect(projection.units).toEqual([])
      expect(projection.clocks.every(bucket =>
        bucket.entries.length === 0 && bucket.debts.length === 0)).toBe(true)
    } finally {
      await runtime.dispose()
    }
  })

  it('tracks strict plot turns across revisions and rejects an incomplete turn atomically', async () => {
    const { home, cwd } = await makeHome('strict-plot-progression')
    const runtime = await boot(home)
    const obstacle = {
      turnId: 'turn-locked-archive',
      storyEventId: 'event-archive-locked',
      turnType: 'obstacle' as const,
      description: '档案室被封锁',
      cost: '调查窗口只剩一夜',
      stateAfter: '主角必须寻找另一条入口',
    }
    const choice = {
      turnId: 'turn-enter-tunnel',
      storyEventId: 'event-enter-tunnel',
      turnType: 'choice' as const,
      description: '主角选择独自进入旧密道',
      cost: '与同伴失去联络',
      stateAfter: '调查转入地下密道',
    }
    const consequence = {
      turnId: 'turn-witness-exposed',
      storyEventId: 'event-witness-exposed',
      turnType: 'consequence' as const,
      description: '行动暴露了证人的藏身处',
      cost: '证人被迫提前转移',
      stateAfter: '唯一证词暂时无法取得',
    }
    const reversal = {
      turnId: 'turn-ledger-reversal',
      storyEventId: 'event-ledger-reversal',
      turnType: 'reversal' as const,
      description: '密道账册显示旧案受害者仍活着',
      cost: '主角原有判断失效',
      stateAfter: '调查目标转为寻找幸存者',
    }

    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const r1Plot = plotProgressionClock('book-main', 1, [obstacle, choice])
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-plot-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        r1Plot,
        {
          id: 'debt-plot-survivor-r1',
          kind: 'narrative-debt',
          operation: 'set',
          targetId: 'debt-find-survivor',
          unitId: 'book-main',
          field: 'plot',
          value: {
            summary: '找到旧案幸存者',
            status: 'open',
          },
          sourceAnchorIds,
        },
      ]))

      const r2Plot = plotProgressionClock('book-main', 2, [
        obstacle,
        choice,
        consequence,
        reversal,
      ])
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-plot-r2', 1, [r2Plot]))

      const historical = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      const current = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      expect(historical.clocks[0]?.entries).toEqual([
        expect.objectContaining({
          unitId: 'book-main',
          clock: 'plot',
          version: 1,
          scope: { unitId: 'book-main', level: 'book' },
          lines: [expect.objectContaining({
            lineId: 'line-old-case',
            turns: [obstacle, choice],
          })],
          revisionRationale: null,
          sourceRevision: 1,
          sourceDeltaId: r1Plot.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-plot-r1' }),
          delta: r1Plot,
        }),
      ])
      expect(current.clocks[0]?.entries).toEqual([
        expect.objectContaining({
          version: 2,
          lines: [expect.objectContaining({
            turns: [obstacle, choice, consequence, reversal],
          })],
          revisionRationale: '记录已发生的后果与反转',
          sourceRevision: 2,
          sourceDeltaId: r2Plot.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-plot-r2' }),
          delta: r2Plot,
        }),
      ])
      expect(current.clocks[0]?.debts).toEqual([
        expect.objectContaining({
          id: 'debt-find-survivor',
          status: 'open',
          sourceRevision: 1,
        }),
      ])

      const beforeQueryHead = runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision
      const compared = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        compareRevision: 1,
        narrativeClock: 'plot',
      })
      expect(compared).toMatchObject({
        revision: 2,
        headRevision: 2,
        freshness: 'current',
      })
      expect(compared.hits.filter(hit => hit.kind !== 'narrative-unit')).toEqual([
        expect.objectContaining({
          kind: 'narrative-clock',
          sourceRevision: 2,
          value: expect.objectContaining({ version: 2, delta: r2Plot }),
        }),
        expect.objectContaining({
          kind: 'narrative-debt',
          sourceRevision: 1,
          value: expect.objectContaining({ id: 'debt-find-survivor' }),
        }),
      ])
      expect(compared.revisionImpact?.clockEntries!.changed).toEqual([{
        before: historical.clocks[0]!.entries[0],
        after: current.clocks[0]!.entries[0],
      }])
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(beforeQueryHead)

      const incompleteR3 = plotProgressionClock('book-main', 3, [
        obstacle,
        choice,
        consequence,
        { ...reversal, stateAfter: undefined },
      ] as never)
      await expect(runtime.ctx.novelProject.accept(
        workspace.id,
        packet('strict-plot-r3-invalid', 2, [incompleteR3]),
      )).rejects.toThrow(/stateAfter|invalid/i)
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
      expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 2)).toEqual(current)
    } finally {
      await runtime.dispose()
    }
  })

  it('projects strict reader knowledge disclosure events across revisions and rejects malformed updates atomically', async () => {
    const { home, cwd } = await makeHome('strict-reader-knowledge')
    const runtime = await boot(home)
    const disclosure = {
      eventId: 'reader-event-moon-mark',
      kind: 'hint' as const,
      unitId: 'scene-moon-mark',
      knowledgeTargetId: 'knowledge-secret-route',
      intendedEffect: 'suspect' as const,
      viewpointId: 'character-shen-yan',
      viewpointAccess: 'limited' as const,
      description: '读者看见密道入口的月形刻痕，但视角人物只把它当作旧工匠标记。',
      sourceAnchorIds,
    }

    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const r1ReaderKnowledge = readerKnowledgeClock('volume-old-court', 1, [], 'preserve')
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-reader-knowledge-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        narrativeUnit('volume-old-court', 'volume', 'book-main', 0),
        r1ReaderKnowledge,
      ]))

      const r2ReaderKnowledge = readerKnowledgeClock(
        'volume-old-court',
        2,
        [disclosure],
        'narrow',
      )
      await runtime.ctx.novelProject.accept(
        workspace.id,
        packet('strict-reader-knowledge-r2', 1, [r2ReaderKnowledge]),
      )

      const historical = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      const current = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      const historicalEntries = historical.clocks
        .find(bucket => bucket.clock === 'reader-knowledge')!.entries
      const currentEntries = current.clocks
        .find(bucket => bucket.clock === 'reader-knowledge')!.entries
      expect(historicalEntries).toEqual([
        expect.objectContaining({
          unitId: 'volume-old-court',
          clock: 'reader-knowledge',
          movement: r1ReaderKnowledge.value.movement,
          state: r1ReaderKnowledge.value.state,
          storyTime: r1ReaderKnowledge.value.storyTime,
          version: 1,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          events: [],
          ambiguityPolicy: {
            mode: 'preserve',
            description: '保留引路人身份的双重解释',
          },
          revisionRationale: null,
          sourceRevision: 1,
          sourceDeltaId: r1ReaderKnowledge.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-reader-knowledge-r1' }),
          delta: r1ReaderKnowledge,
        }),
      ])
      expect(currentEntries).toEqual([
        expect.objectContaining({
          movement: r1ReaderKnowledge.value.movement,
          state: r1ReaderKnowledge.value.state,
          storyTime: r1ReaderKnowledge.value.storyTime,
          version: 2,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          events: [disclosure],
          ambiguityPolicy: {
            mode: 'narrow',
            description: '缩小为王庭旧人与叛逃守卫两种解释',
          },
          revisionRationale: '加入读者可见的密道刻痕并收窄歧义',
          sourceRevision: 2,
          sourceDeltaId: r2ReaderKnowledge.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-reader-knowledge-r2' }),
          delta: r2ReaderKnowledge,
        }),
      ])

      const beforeQueryHead = runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision
      const compared = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        compareRevision: 1,
        narrativeClock: 'reader-knowledge',
      })
      expect(compared.hits.filter(hit => hit.kind === 'narrative-clock')).toEqual([
        expect.objectContaining({
          sourceRevision: 2,
          value: expect.objectContaining({ version: 2, delta: r2ReaderKnowledge }),
        }),
      ])
      expect(compared.revisionImpact?.clockEntries!.changed).toEqual([{
        before: historicalEntries[0],
        after: currentEntries[0],
      }])
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(beforeQueryHead)

      const invalidUpdates: readonly {
        readonly name: string
        readonly delta: ReaderKnowledgeClockSetDelta
        readonly error: RegExp
      }[] = [
        {
          name: 'scope-target',
          delta: {
            ...r2ReaderKnowledge,
            id: 'clock-volume-old-court-reader-knowledge-invalid-scope-target',
            value: {
              ...r2ReaderKnowledge.value,
              version: 3,
              scope: { unitId: 'volume-other', level: 'volume' },
            },
          },
          error: /scope.*unitId.*targetId|targetId.*scope.*unitId/i,
        },
        {
          name: 'scope-level',
          delta: {
            ...r2ReaderKnowledge,
            id: 'clock-volume-old-court-reader-knowledge-invalid-scope-level',
            value: {
              ...r2ReaderKnowledge.value,
              version: 3,
              scope: { unitId: 'volume-old-court', level: 'arc' },
            },
          },
          error: /scope level.*arc.*volume|volume.*scope level.*arc/i,
        },
        {
          name: 'version',
          delta: {
            ...r2ReaderKnowledge,
            id: 'clock-volume-old-court-reader-knowledge-invalid-version',
            value: { ...r2ReaderKnowledge.value, version: 0 },
          },
          error: /version|greater than 0|positive/i,
        },
        {
          name: 'nested-anchor',
          delta: {
            ...r2ReaderKnowledge,
            id: 'clock-volume-old-court-reader-knowledge-invalid-nested-anchor',
            value: {
              ...r2ReaderKnowledge.value,
              version: 3,
              events: [{ ...disclosure, sourceAnchorIds: [] }],
            },
          },
          error: /sourceAnchorIds|source anchor|too small/i,
        },
        {
          name: 'top-level-anchor',
          delta: {
            ...r2ReaderKnowledge,
            id: 'clock-volume-old-court-reader-knowledge-invalid-top-level-anchor',
            value: { ...r2ReaderKnowledge.value, version: 3 },
            sourceAnchorIds: [],
          },
          error: /source anchor/i,
        },
      ]
      for (const invalid of invalidUpdates) {
        await expect(runtime.ctx.novelProject.accept(
          workspace.id,
          packet(`strict-reader-knowledge-invalid-${invalid.name}`, 2, [invalid.delta]),
        )).rejects.toThrow(invalid.error)
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
        expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
        expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 2)).toEqual(current)
      }
    } finally {
      await runtime.dispose()
    }
  })

  it('projects strict mystery reveal moves across revisions and rejects malformed updates atomically', async () => {
    const { home, cwd } = await makeHome('strict-mystery-clock')
    const runtime = await boot(home)
    const openedQuestion = {
      moveId: 'mystery-move-open-survivor',
      kind: 'open-question' as const,
      mysteryId: 'mystery-old-case-survivor',
      clueIds: ['clue-half-crest'],
      knowledgeTargetIds: ['reader-main->clue-half-crest'],
      contribution: '提出旧案受害者是否仍活着，并让半枚家徽成为可追索方向。',
    }
    const partialReveal = {
      moveId: 'mystery-move-partial-survivor',
      kind: 'partial-reveal' as const,
      mysteryId: 'mystery-old-case-survivor',
      clueIds: ['clue-half-crest', 'clue-tunnel-ledger'],
      knowledgeTargetIds: ['reader-main->clue-half-crest', 'reader-main->clue-tunnel-ledger'],
      contribution: '确认受害者曾离开现场，但继续隐藏其现用身份。',
    }

    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const r1Mystery = mysteryClock('volume-old-court', 1, [openedQuestion])
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-mystery-clock-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        narrativeUnit('volume-old-court', 'volume', 'book-main', 0),
        {
          id: 'mystery-old-case-survivor-state-r1',
          kind: 'mystery',
          operation: 'set',
          targetId: 'mystery-old-case-survivor',
          field: 'state',
          value: {
            version: 1,
            question: '旧案受害者是否仍活着？',
            truth: { status: 'unknown-to-author', answer: null },
            hypotheses: ['受害者死亡', '受害者改名存活'],
            knowers: [],
            readerVisibility: '读者知道去向成谜，但没有确定答案',
            concealmentRule: '作者锁定答案前保持两个假设都与已接受证据相容',
            revealConditions: ['找到密道账册'],
            earliestFairResolutionUnitId: null,
            desiredRevealWindow: null,
            actualReveal: null,
            aftermath: null,
            revisionRationale: null,
          },
          sourceAnchorIds,
        },
        {
          id: 'clue-half-crest-state-r1',
          kind: 'clue',
          operation: 'set',
          targetId: 'clue-half-crest',
          field: 'state',
          value: {
            version: 1,
            role: 'clue',
            statement: '现场留下半枚家徽',
            linkedMysteryIds: ['mystery-old-case-survivor'],
            status: 'planted',
            readerVisibility: 'available',
            intendedFunction: '把身份谜团指向旧家族',
            expectedPayoffWindow: 'volume-old-court',
            payoff: null,
            abandonmentReason: null,
            revisionRationale: null,
          },
          sourceAnchorIds,
        },
        {
          id: 'knowledge-reader-half-crest-state-r1',
          kind: 'knowledge',
          operation: 'set',
          targetId: 'reader-main->clue-half-crest',
          field: 'state',
          value: {
            version: 1,
            subjectKind: 'reader',
            beliefStatus: 'suspected',
            memoryStatus: 'retained',
            belief: '半枚家徽与旧案受害者身份有关',
            truthAlignment: 'unverified',
            access: {
              mode: 'observed',
              unitId: 'volume-old-court',
              viewpointId: null,
              viewpointAccess: 'direct',
            },
            revisionRationale: null,
          },
          sourceAnchorIds,
        },
        r1Mystery,
      ]))

      const r2Mystery = mysteryClock('volume-old-court', 2, [openedQuestion, partialReveal])
      await runtime.ctx.novelProject.accept(
        workspace.id,
        packet('strict-mystery-clock-r2', 1, [r2Mystery]),
      )

      const historical = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      const current = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      const historicalEntries = historical.clocks
        .find(bucket => bucket.clock === 'mystery')!.entries
      const currentEntries = current.clocks
        .find(bucket => bucket.clock === 'mystery')!.entries
      expect(historicalEntries).toEqual([
        expect.objectContaining({
          unitId: 'volume-old-court',
          clock: 'mystery',
          movement: r1Mystery.value.movement,
          state: r1Mystery.value.state,
          storyTime: r1Mystery.value.storyTime,
          version: 1,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          moves: [openedQuestion],
          revisionRationale: null,
          sourceRevision: 1,
          sourceDeltaId: r1Mystery.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-mystery-clock-r1' }),
          delta: r1Mystery,
        }),
      ])
      expect(currentEntries).toEqual([
        expect.objectContaining({
          movement: r1Mystery.value.movement,
          state: r1Mystery.value.state,
          storyTime: r1Mystery.value.storyTime,
          version: 2,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          moves: [openedQuestion, partialReveal],
          revisionRationale: '记录新线索带来的局部揭示与重构',
          sourceRevision: 2,
          sourceDeltaId: r2Mystery.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-mystery-clock-r2' }),
          delta: r2Mystery,
        }),
      ])

      const canonBeforeQuery = runtime.ctx.novelProject.projectCanon(workspace.id, 2)
      const compared = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        compareRevision: 1,
        narrativeClock: 'mystery',
        narrativeUnitId: 'volume-old-court',
      })
      expect(compared.hits.filter(hit => hit.kind === 'narrative-clock')).toEqual([
        expect.objectContaining({
          sourceRevision: 2,
          value: expect.objectContaining({ version: 2, moves: [openedQuestion, partialReveal], delta: r2Mystery }),
        }),
      ])
      expect(compared.revisionImpact?.clockEntries!.changed).toEqual([{
        before: historicalEntries[0],
        after: currentEntries[0],
      }])
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeQuery)

      const invalidUpdates: readonly {
        readonly name: string
        readonly delta: MysteryClockSetDelta
        readonly error: RegExp
      }[] = [
        {
          name: 'empty-moves',
          delta: {
            ...r2Mystery,
            id: 'clock-volume-old-court-mystery-invalid-empty-moves',
            value: { ...r2Mystery.value, version: 3, moves: [] },
          },
          error: /moves|too small|at least 1/i,
        },
        {
          name: 'duplicate-move-id',
          delta: {
            ...r2Mystery,
            id: 'clock-volume-old-court-mystery-invalid-duplicate-move-id',
            value: {
              ...r2Mystery.value,
              version: 3,
              moves: [openedQuestion, { ...partialReveal, moveId: openedQuestion.moveId }],
            },
          },
          error: /moveId|unique|duplicate/i,
        },
        {
          name: 'scope-target',
          delta: {
            ...r2Mystery,
            id: 'clock-volume-old-court-mystery-invalid-scope-target',
            value: {
              ...r2Mystery.value,
              version: 3,
              scope: { unitId: 'volume-other', level: 'volume' },
            },
          },
          error: /scope.*unitId.*targetId|targetId.*scope.*unitId/i,
        },
        {
          name: 'scope-level',
          delta: {
            ...r2Mystery,
            id: 'clock-volume-old-court-mystery-invalid-scope-level',
            value: {
              ...r2Mystery.value,
              version: 3,
              scope: { unitId: 'volume-old-court', level: 'arc' },
            },
          },
          error: /scope level.*arc.*volume|volume.*scope level.*arc/i,
        },
        {
          name: 'empty-contribution',
          delta: {
            ...r2Mystery,
            id: 'clock-volume-old-court-mystery-invalid-empty-contribution',
            value: {
              ...r2Mystery.value,
              version: 3,
              moves: [{ ...openedQuestion, contribution: '' }],
            },
          },
          error: /contribution|too small/i,
        },
        {
          name: 'top-level-anchor',
          delta: {
            ...r2Mystery,
            id: 'clock-volume-old-court-mystery-invalid-top-level-anchor',
            value: { ...r2Mystery.value, version: 3 },
            sourceAnchorIds: [],
          },
          error: /source anchor/i,
        },
      ]
      for (const invalid of invalidUpdates) {
        await expect(runtime.ctx.novelProject.accept(
          workspace.id,
          packet(`strict-mystery-clock-invalid-${invalid.name}`, 2, [invalid.delta]),
        )).rejects.toThrow(invalid.error)
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
        expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
        expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 2)).toEqual(current)
      }
    } finally {
      await runtime.dispose()
    }
  })

  it('projects strict progression tracks across revisions and rejects malformed updates atomically', async () => {
    const { home, cwd } = await makeHome('strict-progression-clock')
    const runtime = await boot(home)
    const mainSetup = {
      trackId: 'progression-main-moon-breath',
      role: 'main' as const,
      characterId: 'shen-yan',
      dimension: '月息控制',
      action: 'setup' as const,
      advancementIds: [],
      promiseIds: ['promise-open-moon-gate'],
      endingHypothesisIds: ['book-main'],
      readiness: { setup: 'in-progress' as const, payoff: 'not-due' as const },
      driftWarnings: [],
      contribution: '以旧井刻痕铺垫下一次可观察的控息突破。',
    }
    const supportingHold = {
      trackId: 'progression-supporting-court-status',
      role: 'supporting' as const,
      characterId: 'shen-yan',
      dimension: '王庭身份',
      action: 'hold' as const,
      advancementIds: [],
      promiseIds: [],
      endingHypothesisIds: ['book-main'],
      readiness: { setup: 'missing' as const, payoff: 'not-due' as const },
      driftWarnings: [{
        warningId: 'warning-status-label-only',
        kind: 'label-only' as const,
        description: '不得只把沈砚称为王庭客卿而没有权限或责任变化。',
      }],
      contribution: '本卷保持身份线不动，避免无证据的称号升级。',
    }
    const mainAdvance = {
      ...mainSetup,
      action: 'advance' as const,
      advancementIds: ['advancement-breath-control'],
      readiness: { setup: 'ready' as const, payoff: 'delivered' as const },
      contribution: '旧井训练以明确证据和代价兑现为稳定维持三息的能力。',
    }

    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const r1Progression = progressionClock(
        'volume-old-court',
        1,
        [mainSetup, supportingHold],
      )
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-progression-clock-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        narrativeUnit('volume-old-court', 'volume', 'book-main', 0),
        r1Progression,
      ]))

      const r2Progression = progressionClock(
        'volume-old-court',
        2,
        [mainAdvance, supportingHold],
      )
      await runtime.ctx.novelProject.accept(
        workspace.id,
        packet('strict-progression-clock-r2', 1, [r2Progression]),
      )

      const historical = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      const current = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      const historicalEntries = historical.clocks
        .find(bucket => bucket.clock === 'progression')!.entries
      const currentEntries = current.clocks
        .find(bucket => bucket.clock === 'progression')!.entries
      expect(historicalEntries).toEqual([
        expect.objectContaining({
          unitId: 'volume-old-court',
          clock: 'progression',
          movement: r1Progression.value.movement,
          state: r1Progression.value.state,
          storyTime: r1Progression.value.storyTime,
          version: 1,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          tracks: [mainSetup, supportingHold],
          revisionRationale: null,
          sourceRevision: 1,
          sourceDeltaId: r1Progression.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-progression-clock-r1' }),
          delta: r1Progression,
        }),
      ])
      expect(currentEntries).toEqual([
        expect.objectContaining({
          unitId: 'volume-old-court',
          clock: 'progression',
          movement: r2Progression.value.movement,
          state: r2Progression.value.state,
          storyTime: r2Progression.value.storyTime,
          version: 2,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          tracks: [mainAdvance, supportingHold],
          revisionRationale: '记录主线推进兑现并保留支线 hold',
          sourceRevision: 2,
          sourceDeltaId: r2Progression.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-progression-clock-r2' }),
          delta: r2Progression,
        }),
      ])

      const canonBeforeQuery = runtime.ctx.novelProject.projectCanon(workspace.id, 2)
      const compared = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        compareRevision: 1,
        narrativeClock: 'progression',
        narrativeUnitId: 'volume-old-court',
      })
      expect(compared.hits.filter(hit => hit.kind === 'narrative-clock')).toEqual([
        expect.objectContaining({
          sourceRevision: 2,
          value: expect.objectContaining({
            version: 2,
            tracks: [mainAdvance, supportingHold],
            delta: r2Progression,
          }),
        }),
      ])
      expect(compared.revisionImpact?.clockEntries!.changed).toEqual([{
        before: historicalEntries[0],
        after: currentEntries[0],
      }])
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeQuery)

      const invalidUpdates: readonly {
        readonly name: string
        readonly delta: ProgressionClockSetDelta
        readonly error: RegExp
      }[] = [
        {
          name: 'empty-tracks',
          delta: {
            ...r2Progression,
            id: 'clock-volume-old-court-progression-invalid-empty-tracks',
            value: { ...r2Progression.value, version: 3, tracks: [] },
          },
          error: /tracks|too small|at least 1/i,
        },
        {
          name: 'duplicate-track-id',
          delta: {
            ...r2Progression,
            id: 'clock-volume-old-court-progression-invalid-duplicate-track-id',
            value: {
              ...r2Progression.value,
              version: 3,
              tracks: [mainAdvance, { ...supportingHold, trackId: mainAdvance.trackId }],
            },
          },
          error: /trackId|unique|duplicate/i,
        },
        {
          name: 'missing-main-track',
          delta: {
            ...r2Progression,
            id: 'clock-volume-old-court-progression-invalid-missing-main-track',
            value: { ...r2Progression.value, version: 3, tracks: [supportingHold] },
          },
          error: /main track/i,
        },
        {
          name: 'advance-without-advancement',
          delta: {
            ...r2Progression,
            id: 'clock-volume-old-court-progression-invalid-empty-advancement',
            value: {
              ...r2Progression.value,
              version: 3,
              tracks: [{ ...mainAdvance, advancementIds: [] }],
            },
          },
          error: /advance.*advancement|advancement.*advance/i,
        },
        {
          name: 'scope-target',
          delta: {
            ...r2Progression,
            id: 'clock-volume-old-court-progression-invalid-scope-target',
            value: {
              ...r2Progression.value,
              version: 3,
              scope: { unitId: 'volume-other', level: 'volume' },
            },
          },
          error: /scope.*unitId.*targetId|targetId.*scope.*unitId/i,
        },
        {
          name: 'scope-level',
          delta: {
            ...r2Progression,
            id: 'clock-volume-old-court-progression-invalid-scope-level',
            value: {
              ...r2Progression.value,
              version: 3,
              scope: { unitId: 'volume-old-court', level: 'arc' },
            },
          },
          error: /scope level.*arc.*volume|volume.*scope level.*arc/i,
        },
        {
          name: 'empty-contribution',
          delta: {
            ...r2Progression,
            id: 'clock-volume-old-court-progression-invalid-empty-contribution',
            value: {
              ...r2Progression.value,
              version: 3,
              tracks: [{ ...mainAdvance, contribution: '' }],
            },
          },
          error: /contribution|too small/i,
        },
        {
          name: 'top-level-anchor',
          delta: {
            ...r2Progression,
            id: 'clock-volume-old-court-progression-invalid-top-level-anchor',
            value: { ...r2Progression.value, version: 3 },
            sourceAnchorIds: [],
          },
          error: /source anchor/i,
        },
      ]
      for (const invalid of invalidUpdates) {
        await expect(runtime.ctx.novelProject.accept(
          workspace.id,
          packet(`strict-progression-clock-invalid-${invalid.name}`, 2, [invalid.delta]),
        )).rejects.toThrow(invalid.error)
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
        expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
        expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 2)).toEqual(current)
      }
    } finally {
      await runtime.dispose()
    }
  })

  it('projects strict promise moves with their accepted debts across revisions and rejects malformed updates atomically', async () => {
    const { home, cwd } = await makeHome('strict-promise-clock')
    const runtime = await boot(home)
    const opened = {
      moveId: 'promise-move-open-moon-gate',
      kind: 'open' as const,
      promiseId: 'promise-open-moon-gate',
      debtIds: ['debt-promise-moon-gate'],
      contribution: '明确沈砚必须凭自己掌握的月息打开月门。',
    }
    const reminded = {
      moveId: 'promise-move-remind-moon-gate',
      kind: 'remind' as const,
      promiseId: 'promise-open-moon-gate',
      debtIds: ['debt-promise-moon-gate'],
      contribution: '守门人在旧井前再次追问沈砚何时兑现。',
    }
    const complicated = {
      moveId: 'promise-move-complicate-moon-gate',
      kind: 'complicate' as const,
      promiseId: 'promise-open-moon-gate',
      debtIds: ['debt-promise-moon-gate'],
      contribution: '开启月门现在还会消耗最后一枚月砂。',
    }
    const partialPayoff = {
      moveId: 'promise-move-partial-payoff-moon-gate',
      kind: 'partial-payoff' as const,
      promiseId: 'promise-open-moon-gate',
      debtIds: ['debt-promise-moon-gate'],
      contribution: '沈砚先独立开启侧门，但主月门仍未完全打开。',
    }
    const openPromiseState = {
      version: 1,
      promise: '沈砚将凭自己掌握的月息打开月门',
      type: 'progression',
      weight: 'major' as const,
      horizon: {
        openedUnitId: 'volume-old-court',
        expectedPayoffStartUnitId: 'volume-old-court',
        expectedPayoffEndUnitId: 'volume-old-court',
      },
      setup: {
        beatId: 'promise-open-moon-gate-setup',
        unitId: 'volume-old-court',
        sourceRevision: 1,
        sourceAnchorIds,
        description: '旧井刻痕表明月息可以被稳定控制。',
      },
      reminders: [],
      complications: [],
      resolution: {
        status: 'open' as const,
        payoffType: null,
        beat: null,
        retirementRationale: null,
      },
      aftermath: null,
      revisionRationale: null,
    }

    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const r1Promise = promiseClock('volume-old-court', 1, [opened, reminded])
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-promise-clock-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        narrativeUnit('volume-old-court', 'volume', 'book-main', 0),
        {
          id: 'promise-open-moon-gate-state-r1',
          kind: 'promise',
          operation: 'set',
          targetId: 'promise-open-moon-gate',
          field: 'state',
          value: openPromiseState,
          sourceAnchorIds,
        },
        {
          id: 'debt-promise-moon-gate-r1',
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
          sourceAnchorIds,
        },
        r1Promise,
      ]))

      const r2Promise = promiseClock(
        'volume-old-court',
        2,
        [opened, reminded, complicated, partialPayoff],
      )
      const complicationBeat = {
        beatId: 'promise-open-moon-gate-complication-r2',
        unitId: 'volume-old-court',
        sourceRevision: 2,
        sourceAnchorIds,
        description: '开启月门会耗尽最后一枚月砂。',
      }
      const partialPayoffBeat = {
        beatId: 'promise-open-moon-gate-partial-payoff-r2',
        unitId: 'volume-old-court',
        sourceRevision: 2,
        sourceAnchorIds,
        description: '沈砚独立开启侧门，但主月门仍未完全打开。',
      }
      const partiallyPaidPromiseState = {
        ...openPromiseState,
        version: 2,
        complications: [complicationBeat],
        resolution: {
          status: 'partially-paid' as const,
          payoffType: 'progression' as const,
          beat: partialPayoffBeat,
          retirementRationale: null,
        },
        aftermath: '守门人获得进入侧门的通道，但完全打开主月门仍是一笔未清债务。',
        revisionRationale: '记录月砂代价与侧门的局部兑现。',
      }
      await runtime.ctx.novelProject.accept(
        workspace.id,
        packet('strict-promise-clock-r2', 1, [{
          id: 'promise-open-moon-gate-state-r2',
          kind: 'promise',
          operation: 'set',
          targetId: 'promise-open-moon-gate',
          field: 'state',
          value: partiallyPaidPromiseState,
          sourceAnchorIds,
        }, r2Promise]),
      )

      const historical = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      const current = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      const historicalBucket = historical.clocks.find(bucket => bucket.clock === 'promise')!
      const currentBucket = current.clocks.find(bucket => bucket.clock === 'promise')!
      expect(historicalBucket.entries).toEqual([
        expect.objectContaining({
          unitId: 'volume-old-court',
          clock: 'promise',
          movement: 'open-and-remind',
          state: '月门承诺已经提出并获得一次提醒',
          storyTime: 'day-5-dawn',
          version: 1,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          moves: [opened, reminded],
          revisionRationale: null,
          sourceRevision: 1,
          sourceDeltaId: r1Promise.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-promise-clock-r1' }),
          delta: r1Promise,
        }),
      ])
      expect(currentBucket.entries).toEqual([
        expect.objectContaining({
          unitId: 'volume-old-court',
          clock: 'promise',
          movement: 'complicate-and-partial-payoff',
          state: '月门承诺因代价加重，并完成一次局部兑现',
          storyTime: 'day-5-dawn',
          version: 2,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          moves: [opened, reminded, complicated, partialPayoff],
          revisionRationale: '记录承诺复杂化与局部兑现',
          sourceRevision: 2,
          sourceDeltaId: r2Promise.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-promise-clock-r2' }),
          delta: r2Promise,
        }),
      ])
      expect(currentBucket.debts).toEqual([
        expect.objectContaining({
          id: 'debt-promise-moon-gate',
          unitId: 'volume-old-court',
          summary: '完全打开主月门',
          status: 'open',
          sourceRevision: 1,
          sourceDeltaId: 'debt-promise-moon-gate-r1',
        }),
      ])

      const canonBeforeQuery = runtime.ctx.novelProject.projectCanon(workspace.id, 2)
      const compared = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        compareRevision: 1,
        promiseLifecycleId: 'promise-open-moon-gate',
        narrativeClock: 'promise',
        narrativeUnitId: 'volume-old-court',
      })
      expect(compared.promiseLifecycle).toMatchObject({
        promiseId: 'promise-open-moon-gate',
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        entries: [
          { revision: 1, fields: [expect.objectContaining({ fact: expect.objectContaining({ value: openPromiseState }) })] },
          { revision: 2, fields: [expect.objectContaining({ fact: expect.objectContaining({ value: partiallyPaidPromiseState }) })] },
        ],
      })
      expect(compared.hits.filter(hit => hit.kind === 'narrative-clock')).toEqual([
        expect.objectContaining({
          sourceRevision: 2,
          value: expect.objectContaining({
            version: 2,
            moves: [opened, reminded, complicated, partialPayoff],
            delta: r2Promise,
          }),
        }),
      ])
      expect(compared.hits.filter(hit => hit.kind === 'narrative-debt')).toEqual([
        expect.objectContaining({
          sourceRevision: 1,
          value: expect.objectContaining({ id: 'debt-promise-moon-gate' }),
        }),
      ])
      expect(compared.revisionImpact?.clockEntries!.changed).toEqual([{
        before: historicalBucket.entries[0],
        after: currentBucket.entries[0],
      }])
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeQuery)

      const invalidUpdates: readonly {
        readonly name: string
        readonly delta: PromiseClockSetDelta
        readonly error: RegExp
      }[] = [
        {
          name: 'generic-contract',
          delta: {
            ...r2Promise,
            id: 'clock-volume-old-court-promise-invalid-generic',
            value: { movement: 'advance', state: 'generic promise clock must not pass' },
          } as unknown as PromiseClockSetDelta,
          error: /version|scope|moves|required/i,
        },
        {
          name: 'empty-moves',
          delta: {
            ...r2Promise,
            id: 'clock-volume-old-court-promise-invalid-empty-moves',
            value: { ...r2Promise.value, version: 3, moves: [] },
          },
          error: /moves|too small|at least 1/i,
        },
        {
          name: 'duplicate-move-id',
          delta: {
            ...r2Promise,
            id: 'clock-volume-old-court-promise-invalid-duplicate-move-id',
            value: {
              ...r2Promise.value,
              version: 3,
              moves: [opened, { ...partialPayoff, moveId: opened.moveId }],
            },
          },
          error: /moveId|unique|duplicate/i,
        },
        {
          name: 'scope-target',
          delta: {
            ...r2Promise,
            id: 'clock-volume-old-court-promise-invalid-scope-target',
            value: {
              ...r2Promise.value,
              version: 3,
              scope: { unitId: 'volume-other', level: 'volume' },
            },
          },
          error: /scope.*unitId.*targetId|targetId.*scope.*unitId/i,
        },
        {
          name: 'scope-level',
          delta: {
            ...r2Promise,
            id: 'clock-volume-old-court-promise-invalid-scope-level',
            value: {
              ...r2Promise.value,
              version: 3,
              scope: { unitId: 'volume-old-court', level: 'arc' },
            },
          },
          error: /scope level.*arc.*volume|volume.*scope level.*arc/i,
        },
        {
          name: 'empty-debt-id',
          delta: {
            ...r2Promise,
            id: 'clock-volume-old-court-promise-invalid-empty-debt-id',
            value: {
              ...r2Promise.value,
              version: 3,
              moves: [{ ...partialPayoff, debtIds: [''] }],
            },
          },
          error: /debtIds|too small/i,
        },
        {
          name: 'empty-contribution',
          delta: {
            ...r2Promise,
            id: 'clock-volume-old-court-promise-invalid-empty-contribution',
            value: {
              ...r2Promise.value,
              version: 3,
              moves: [{ ...partialPayoff, contribution: '' }],
            },
          },
          error: /contribution|too small/i,
        },
        {
          name: 'empty-anchors',
          delta: {
            ...r2Promise,
            id: 'clock-volume-old-court-promise-invalid-empty-anchors',
            value: { ...r2Promise.value, version: 3 },
            sourceAnchorIds: [],
          },
          error: /source anchor/i,
        },
      ]
      for (const invalid of invalidUpdates) {
        await expect(runtime.ctx.novelProject.accept(
          workspace.id,
          packet(`strict-promise-clock-invalid-${invalid.name}`, 2, [invalid.delta]),
        )).rejects.toThrow(invalid.error)
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
        expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
        expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 2)).toEqual(current)
      }
    } finally {
      await runtime.dispose()
    }
  })

  it('projects strict character moves alongside the accepted arc trajectory and rejects malformed updates atomically', async () => {
    const { home, cwd } = await makeHome('strict-character-clock')
    const runtime = await boot(home)
    const pressure = {
      moveId: 'character-move-moon-gate-pressure',
      kind: 'pressure' as const,
      characterId: 'shen-yan',
      storyEventIds: ['event-moon-gate-deadline'],
      contribution: '月门将在天亮前关闭，迫使沈砚决定是否继续独自行动。',
    }
    const hold = {
      moveId: 'character-move-hold-isolation',
      kind: 'hold' as const,
      characterId: 'shen-yan',
      storyEventIds: [],
      contribution: '第一阶段只维持独自控制的旧策略，不提前宣告人物完成转变。',
    }
    const decision = {
      moveId: 'character-move-share-map-decision',
      kind: 'decision' as const,
      characterId: 'shen-yan',
      storyEventIds: ['event-share-moon-gate-map'],
      contribution: '沈砚把月门地图交给顾临川，并邀请他共同决定路线。',
    }
    const consequence = {
      moveId: 'character-move-share-map-consequence',
      kind: 'consequence' as const,
      characterId: 'shen-yan',
      storyEventIds: ['event-share-moon-gate-map'],
      contribution: '顾临川因此获得共同决定路线的持续权利。',
    }
    const arcR1 = {
      version: 1,
      scopeUnitId: 'book-main',
      hypothesis: '沈砚会从独自背负秘密，转向愿意与可信盟友共同承担责任。',
      startingBelief: '只有独自承担才不会再次失去重要的人。',
      targetTransformation: '主动共享风险，并接受关系中的相互依赖。',
      transformationDimensions: ['belief', 'strategy', 'relationship'] as const,
      pressures: ['月门真相只能由两人共同解开', '顾临川可能再次离开'],
      decisionChain: [],
      currentStage: '以孤立换取控制感',
      unresolvedQuestion: '他能否在失控前主动求助？',
      changeRationale: null,
    }
    const arcDecision = {
      decisionId: 'decision-share-map',
      storyEventId: 'event-share-moon-gate-map',
      pressure: '独自进入月门会失去唯一的回程坐标。',
      choice: '把月门地图交给顾临川并邀请他同行。',
      rejectedAlternatives: ['隐瞒地图独自进入', '销毁地图终止调查'],
      cost: '承认自己无法独自完成调查，也把弱点交给了顾临川。',
      persistentConsequence: '顾临川获得共同决定路线的权利。',
      transformationEvidence: '沈砚第一次在行动前主动共享关键信息。',
    }
    const arcR2 = {
      ...arcR1,
      version: 2,
      decisionChain: [arcDecision],
      currentStage: '开始用共同决策替代单独控制',
      unresolvedQuestion: '当顾临川反对他的方案时，他会不会重新封闭？',
      changeRationale: '共享地图的决定提供了第一项转变证据。',
    }

    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const r1Character = characterClock('volume-old-court', 1, [pressure, hold])
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-character-clock-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        narrativeUnit('volume-old-court', 'volume', 'book-main', 0),
        {
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
          sourceAnchorIds,
        },
        {
          id: 'character-arc-hypothesis-r1',
          kind: 'character-state',
          operation: 'set',
          targetId: 'shen-yan',
          field: 'arc-hypothesis',
          value: arcR1,
          sourceAnchorIds,
        },
        r1Character,
      ]))

      const r2Character = characterClock(
        'volume-old-court',
        2,
        [pressure, hold, decision, consequence],
      )
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-character-clock-r2', 1, [
        {
          id: 'character-event-share-map-r2',
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
          sourceAnchorIds,
        },
        {
          id: 'character-arc-hypothesis-r2',
          kind: 'character-state',
          operation: 'set',
          targetId: 'shen-yan',
          field: 'arc-hypothesis',
          value: arcR2,
          sourceAnchorIds,
        },
        r2Character,
      ]))

      const historical = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      const current = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      const historicalEntries = historical.clocks
        .find(bucket => bucket.clock === 'character')!.entries
      const currentEntries = current.clocks
        .find(bucket => bucket.clock === 'character')!.entries
      expect(historicalEntries).toEqual([
        expect.objectContaining({
          unitId: 'volume-old-court',
          clock: 'character',
          movement: 'pressure-and-choice',
          state: '沈砚仍在共同承担与独自控制之间做选择',
          storyTime: 'day-6-night',
          version: 1,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          moves: [pressure, hold],
          revisionRationale: null,
          sourceRevision: 1,
          sourceDeltaId: r1Character.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-character-clock-r1' }),
          delta: r1Character,
        }),
      ])
      expect(currentEntries).toEqual([
        expect.objectContaining({
          unitId: 'volume-old-court',
          clock: 'character',
          movement: 'pressure-and-choice',
          state: '沈砚仍在共同承担与独自控制之间做选择',
          storyTime: 'day-6-night',
          version: 2,
          scope: { unitId: 'volume-old-court', level: 'volume' },
          moves: [pressure, hold, decision, consequence],
          revisionRationale: '记录共享地图的决定及其持续后果',
          sourceRevision: 2,
          sourceDeltaId: r2Character.id,
          sourceAnchorIds,
          provenance: expect.objectContaining({ taskId: 'task-strict-character-clock-r2' }),
          delta: r2Character,
        }),
      ])

      const canonBeforeQuery = runtime.ctx.novelProject.projectCanon(workspace.id, 2)
      const historicalQuery = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 1,
        characterTrajectoryId: 'shen-yan',
        narrativeClock: 'character',
        narrativeUnitId: 'volume-old-court',
      })
      expect(historicalQuery).toMatchObject({
        revision: 1,
        headRevision: 2,
        freshness: 'historical',
        characterTrajectory: {
          characterId: 'shen-yan',
          revision: 1,
          headRevision: 2,
          freshness: 'historical',
        },
      })
      const compared = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        compareRevision: 1,
        characterTrajectoryId: 'shen-yan',
        narrativeClock: 'character',
        narrativeUnitId: 'volume-old-court',
      })
      expect(compared.characterTrajectory?.entries.map(entry => entry.revision)).toEqual([1, 2])
      expect(compared.hits.filter(hit => hit.kind === 'narrative-clock')).toEqual([
        expect.objectContaining({
          sourceRevision: 2,
          value: expect.objectContaining({
            version: 2,
            moves: [pressure, hold, decision, consequence],
            delta: r2Character,
          }),
        }),
      ])
      expect(compared.hits.filter(hit => hit.kind === 'canon-fact')).toContainEqual(
        expect.objectContaining({
          value: expect.objectContaining({
            kind: 'character-state',
            targetId: 'shen-yan',
            field: 'arc-hypothesis',
            value: arcR2,
          }),
        }),
      )
      expect(compared.revisionImpact?.clockEntries!.changed).toEqual([{
        before: historicalEntries[0],
        after: currentEntries[0],
      }])
      expect(compared.revisionImpact?.canonFacts.changed).toContainEqual({
        before: expect.objectContaining({ value: arcR1 }),
        after: expect.objectContaining({ value: arcR2 }),
      })
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeQuery)

      const characterR2Value = {
        movement: 'pressure-and-choice',
        state: '沈砚仍在共同承担与独自控制之间做选择',
        storyTime: 'day-6-night',
        version: 2,
        scope: { unitId: 'volume-old-court', level: 'volume' as const },
        moves: [pressure, hold, decision, consequence],
        revisionRationale: '记录共享地图的决定及其持续后果',
      }
      const invalidUpdates: readonly {
        readonly name: string
        readonly delta: CharacterClockSetDelta
        readonly error: RegExp
      }[] = [
        {
          name: 'generic-contract',
          delta: {
            ...r2Character,
            id: 'clock-volume-old-court-character-invalid-generic',
            value: { movement: 'hold', state: 'generic character clock must not pass' },
          } as unknown as CharacterClockSetDelta,
          error: /version|scope|moves|required/i,
        },
        {
          name: 'empty-moves',
          delta: {
            ...r2Character,
            id: 'clock-volume-old-court-character-invalid-empty-moves',
            value: { ...characterR2Value, version: 3, moves: [] },
          },
          error: /moves|too small|at least 1/i,
        },
        {
          name: 'duplicate-move-id',
          delta: {
            ...r2Character,
            id: 'clock-volume-old-court-character-invalid-duplicate-move-id',
            value: {
              ...characterR2Value,
              version: 3,
              moves: [pressure, { ...decision, moveId: pressure.moveId }],
            },
          },
          error: /moveId|unique|duplicate/i,
        },
        {
          name: 'scope-target',
          delta: {
            ...r2Character,
            id: 'clock-volume-old-court-character-invalid-scope-target',
            value: {
              ...characterR2Value,
              version: 3,
              scope: { unitId: 'volume-other', level: 'volume' },
            },
          },
          error: /scope.*unitId.*targetId|targetId.*scope.*unitId/i,
        },
        {
          name: 'scope-level',
          delta: {
            ...r2Character,
            id: 'clock-volume-old-court-character-invalid-scope-level',
            value: {
              ...characterR2Value,
              version: 3,
              scope: { unitId: 'volume-old-court', level: 'arc' },
            },
          },
          error: /scope level.*arc.*volume|volume.*scope level.*arc/i,
        },
        {
          name: 'empty-character-id',
          delta: {
            ...r2Character,
            id: 'clock-volume-old-court-character-invalid-empty-character-id',
            value: {
              ...characterR2Value,
              version: 3,
              moves: [{ ...decision, characterId: '' }],
            },
          },
          error: /characterId|too small/i,
        },
        {
          name: 'empty-story-event-id',
          delta: {
            ...r2Character,
            id: 'clock-volume-old-court-character-invalid-empty-story-event-id',
            value: {
              ...characterR2Value,
              version: 3,
              moves: [{ ...decision, storyEventIds: [''] }],
            },
          },
          error: /storyEventIds|too small/i,
        },
        {
          name: 'empty-contribution',
          delta: {
            ...r2Character,
            id: 'clock-volume-old-court-character-invalid-empty-contribution',
            value: {
              ...characterR2Value,
              version: 3,
              moves: [{ ...decision, contribution: '' }],
            },
          },
          error: /contribution|too small/i,
        },
        {
          name: 'empty-anchors',
          delta: {
            ...r2Character,
            id: 'clock-volume-old-court-character-invalid-empty-anchors',
            value: { ...characterR2Value, version: 3 },
            sourceAnchorIds: [],
          },
          error: /source anchor/i,
        },
      ]
      for (const invalid of invalidUpdates) {
        await expect(runtime.ctx.novelProject.accept(
          workspace.id,
          packet(`strict-character-clock-invalid-${invalid.name}`, 2, [invalid.delta]),
        )).rejects.toThrow(invalid.error)
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
        expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
        expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 2)).toEqual(current)
      }
    } finally {
      await runtime.dispose()
    }
  })

  it('projects strict relationship moves alongside independent directional line states and rejects malformed updates atomically', async () => {
    const { home, cwd } = await makeHome('strict-relationship-clock')
    const runtime = await boot(home)
    const forwardR1 = {
      version: 1,
      premise: '爱丽丝与鲍勃因同一封密信被迫结盟。',
      form: '互相试探的临时盟友',
      stage: 'provisional-alliance',
      independentGoal: '爱丽丝要在不交出密信原件的前提下查出内鬼。',
      currentTrust: '她相信鲍勃会守约，但不相信他会优先保护她。',
      currentConflict: '两人都要求掌握唯一的撤离路线。',
      currentCommitment: '共同进入旧庭，任何一方撤离前必须告知另一方。',
      boundaries: ['不交出各自线人的身份'],
      sharedHistory: ['在北门伏击中第一次互相掩护'],
      obstacles: ['双方所属阵营仍在敌对'],
      unresolvedDebts: ['爱丽丝尚未解释为何隐瞒密信原件'],
      mainPlotConsequences: ['临时结盟使两人能够共同进入旧庭'],
      turns: [],
      agencyEvidence: ['爱丽丝主动提出限时结盟条款'],
      desiredEndingState: '两人能够在保留独立目标时公开选择彼此。',
      revisionRationale: null,
    } as const
    const reverseR1 = {
      version: 1,
      premise: '鲍勃把爱丽丝视为唯一能读懂密信的人。',
      form: '带着戒备的情报伙伴',
      stage: 'guarded-cooperation',
      independentGoal: '鲍勃要把叛徒名单带回自己的阵营。',
      currentTrust: '他信任爱丽丝的判断，不信任她的阵营。',
      currentConflict: '他担心爱丽丝会销毁名单来保护旧友。',
      currentCommitment: '在名单解密前不向爱丽丝的阵营动手。',
      boundaries: ['不公开鲍勃的真实身份'],
      sharedHistory: ['爱丽丝曾在北门替他挡下追兵'],
      obstacles: ['鲍勃仍收到逮捕爱丽丝的命令'],
      unresolvedDebts: ['鲍勃仍欠爱丽丝一次对逮捕令来源的坦白'],
      mainPlotConsequences: ['鲍勃暂缓逮捕令，让密信调查得以继续'],
      turns: [],
      agencyEvidence: ['鲍勃主动暂缓执行逮捕令'],
      desiredEndingState: null,
      revisionRationale: null,
    } as const
    const costlyTurn = {
      turnId: 'turn-burn-exit-map',
      eventId: 'event-burn-exit-map',
      storyOrder: 20,
      turnType: 'sacrifice' as const,
      action: '爱丽丝烧掉自己唯一的撤离图，为鲍勃争取脱身时间。',
      otherResponse: '鲍勃放弃追击内鬼，折返把爱丽丝带出旧庭。',
      cost: '两人同时失去追踪内鬼和安全撤离的先机。',
      persistentConsequence: '此后两人必须共同选择路线，任何一方都无法单独撤离。',
      stageAfter: 'costly-mutual-reliance',
    }
    const forwardR2 = {
      ...forwardR1,
      version: 2,
      stage: 'costly-mutual-reliance',
      currentTrust: '爱丽丝已确认鲍勃会为她放弃任务先机。',
      currentConflict: '共同撤离让两人的独立任务都面临失败。',
      currentCommitment: '无论名单归属如何，两人先共同离开旧庭。',
      turns: [costlyTurn],
      agencyEvidence: [...forwardR1.agencyEvidence, '爱丽丝主动以自己的退路换取鲍勃的生还机会'],
      revisionRationale: '旧庭中的双向牺牲把临时结盟推进为有代价的相互依赖。',
    }
    const alliance = {
      moveId: 'relationship-move-limited-alliance',
      lineId: 'alice<->bob',
      relationshipTargetId: 'alice->bob',
      storyEventIds: ['event-limited-alliance'],
      emotionEpisodeIds: [],
      contribution: '爱丽丝提出限时结盟条款，让两人的合作获得第一项可执行边界。',
    }
    const mutualSacrifice = {
      moveId: 'relationship-move-mutual-sacrifice',
      lineId: 'alice<->bob',
      relationshipTargetId: 'alice->bob',
      storyEventIds: ['event-burn-exit-map'],
      emotionEpisodeIds: ['emotion-episode-mutual-sacrifice'],
      contribution: '爱丽丝牺牲退路、鲍勃放弃任务先机，形成无法单方面撤销的共同后果。',
    }
    const mutualSacrificeEpisode = {
      characterId: 'alice',
      eventId: 'event-burn-exit-map',
      storyOrder: 20,
      trigger: '爱丽丝烧毁撤离图，鲍勃放弃追击并折返救援',
      object: 'bob',
      appraisal: '鲍勃愿意放弃任务先机，证明共同撤离承诺真实有效',
      emotions: [{ label: '信任', intensity: 0.8 }],
      bodilyExpression: '烧图后仍握紧鲍勃的手腕',
      actionTendency: '与鲍勃共同撤离',
      expression: '明确要求两人一起离开',
      suppression: '压住独自留下断后的冲动',
      coping: '把撤离决定转化为共同路线选择',
      residue: '对鲍勃形成有代价的依赖',
      reactivatesEpisodeIds: [],
      downstreamChoices: ['此后任何撤离路线都先与鲍勃共同决定'],
    }

    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const r1Relationship = relationshipClock('volume-old-court', 1, [alliance])
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-relationship-clock-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        narrativeUnit('volume-old-court', 'volume', 'book-main', 0),
        {
          id: 'relationship-event-limited-alliance-r1',
          kind: 'story-event',
          operation: 'set',
          targetId: 'event-limited-alliance',
          field: 'event',
          value: {
            storyTime: { startOrder: 10, label: '第一卷第七夜' },
            manuscriptOrder: 1,
            participants: ['alice', 'bob'],
            location: '旧庭入口',
            effects: ['两人接受限时结盟条款'],
          },
          sourceAnchorIds,
        },
        {
          id: 'relationship-line-state-forward-r1',
          kind: 'relationship',
          operation: 'set',
          targetId: 'alice->bob',
          field: 'line-state',
          value: forwardR1,
          sourceAnchorIds,
        },
        {
          id: 'relationship-line-state-reverse-r1',
          kind: 'relationship',
          operation: 'set',
          targetId: 'bob->alice',
          field: 'line-state',
          value: reverseR1,
          sourceAnchorIds,
        },
        r1Relationship,
      ]))

      const r2Relationship = relationshipClock(
        'volume-old-court',
        2,
        [alliance, mutualSacrifice],
      )
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-relationship-clock-r2', 1, [
        {
          id: 'relationship-event-burn-exit-map-r2',
          kind: 'story-event',
          operation: 'set',
          targetId: 'event-burn-exit-map',
          field: 'event',
          value: {
            storyTime: { startOrder: 20, label: '第一卷第八夜' },
            manuscriptOrder: 2,
            participants: ['alice', 'bob'],
            location: '旧庭密道',
            effects: ['爱丽丝烧毁撤离图', '鲍勃放弃追击并折返救援'],
          },
          sourceAnchorIds,
        },
        {
          id: 'relationship-emotion-mutual-sacrifice-r2',
          kind: 'emotion-state',
          operation: 'set',
          targetId: 'emotion-episode-mutual-sacrifice',
          field: 'episode',
          value: mutualSacrificeEpisode,
          sourceAnchorIds,
        },
        {
          id: 'relationship-line-state-forward-r2',
          kind: 'relationship',
          operation: 'set',
          targetId: 'alice->bob',
          field: 'line-state',
          value: forwardR2,
          sourceAnchorIds,
        },
        r2Relationship,
      ]))

      const historical = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      const current = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      const historicalEntries = historical.clocks.find(bucket => bucket.clock === 'relationship')!.entries
      const currentEntries = current.clocks.find(bucket => bucket.clock === 'relationship')!.entries
      expect(historicalEntries).toEqual([expect.objectContaining({
        unitId: 'volume-old-court',
        clock: 'relationship',
        version: 1,
        scope: { unitId: 'volume-old-court', level: 'volume' },
        moves: [alliance],
        revisionRationale: null,
        sourceRevision: 1,
        sourceDeltaId: r1Relationship.id,
        delta: r1Relationship,
      })])
      expect(currentEntries).toEqual([expect.objectContaining({
        unitId: 'volume-old-court',
        clock: 'relationship',
        version: 2,
        scope: { unitId: 'volume-old-court', level: 'volume' },
        moves: [alliance, mutualSacrifice],
        revisionRationale: '记录撤离图牺牲带来的持续关系后果',
        sourceRevision: 2,
        sourceDeltaId: r2Relationship.id,
        delta: r2Relationship,
      })])

      const historicalRelationships = runtime.ctx.novelProject.projectRelationships(workspace.id, 1)
      const currentRelationships = runtime.ctx.novelProject.projectRelationships(workspace.id, 2)
      expect(historicalRelationships.relationships).toEqual([expect.objectContaining({
        line: 'alice<->bob',
        participants: ['alice', 'bob'],
        directions: [
          expect.objectContaining({ pair: 'alice->bob', fields: { 'line-state': forwardR1 }, sourceRevision: 1 }),
          expect.objectContaining({ pair: 'bob->alice', fields: { 'line-state': reverseR1 }, sourceRevision: 1 }),
        ],
      })])
      expect(currentRelationships.relationships).toEqual([expect.objectContaining({
        line: 'alice<->bob',
        participants: ['alice', 'bob'],
        directions: [
          expect.objectContaining({ pair: 'alice->bob', fields: { 'line-state': forwardR2 }, sourceRevision: 2 }),
          expect.objectContaining({ pair: 'bob->alice', fields: { 'line-state': reverseR1 }, sourceRevision: 1 }),
        ],
      })])

      const canonBeforeQuery = runtime.ctx.novelProject.projectCanon(workspace.id, 2)
      const compared = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        compareRevision: 1,
        canonKind: 'relationship',
        canonTargetId: 'alice->bob',
        narrativeClock: 'relationship',
        narrativeUnitId: 'volume-old-court',
      })
      expect(compared.hits.filter(hit => hit.kind === 'narrative-clock')).toEqual([
        expect.objectContaining({
          sourceRevision: 2,
          value: expect.objectContaining({
            version: 2,
            moves: [alliance, mutualSacrifice],
            delta: r2Relationship,
          }),
        }),
      ])
      expect(compared.hits.filter(hit => hit.kind === 'canon-fact')).toEqual([
        expect.objectContaining({ value: expect.objectContaining({ value: forwardR2 }) }),
      ])
      expect(compared.revisionImpact?.clockEntries!.changed).toEqual([{
        before: historicalEntries[0],
        after: currentEntries[0],
      }])
      expect(compared.revisionImpact?.canonFacts.changed).toEqual([{
        before: expect.objectContaining({ value: forwardR1 }),
        after: expect.objectContaining({ value: forwardR2 }),
      }])
      expect(runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        emotionCharacterId: 'alice',
      }).emotionContinuity).toMatchObject({
        characterId: 'alice',
        revision: 2,
        headRevision: 2,
        freshness: 'current',
        episodes: [{
          episodeId: 'emotion-episode-mutual-sacrifice',
          episode: mutualSacrificeEpisode,
          sourceRevision: 2,
          sourceDeltaId: 'relationship-emotion-mutual-sacrifice-r2',
        }],
      })
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeQuery)

      const invalidUpdates: readonly {
        readonly name: string
        readonly delta: RelationshipClockSetDelta
        readonly error: RegExp
      }[] = [
        {
          name: 'generic-contract',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-generic',
            value: { movement: 'hold', state: 'generic relationship clock must not pass' },
          } as unknown as RelationshipClockSetDelta,
          error: /version|scope|moves|required/i,
        },
        {
          name: 'empty-moves',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-empty-moves',
            value: { ...r2Relationship.value, version: 3, moves: [] },
          },
          error: /moves|too small|at least 1/i,
        },
        {
          name: 'duplicate-move-id',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-duplicate-move-id',
            value: {
              ...r2Relationship.value,
              version: 3,
              moves: [alliance, { ...mutualSacrifice, moveId: alliance.moveId }],
            },
          },
          error: /moveId|unique|duplicate/i,
        },
        {
          name: 'scope-target',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-scope-target',
            value: {
              ...r2Relationship.value,
              version: 3,
              scope: { unitId: 'volume-other', level: 'volume' },
            },
          },
          error: /scope.*unitId.*targetId|targetId.*scope.*unitId/i,
        },
        {
          name: 'scope-level',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-scope-level',
            value: {
              ...r2Relationship.value,
              version: 3,
              scope: { unitId: 'volume-old-court', level: 'arc' },
            },
          },
          error: /scope level.*arc.*volume|volume.*scope level.*arc/i,
        },
        {
          name: 'empty-line-id',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-empty-line-id',
            value: { ...r2Relationship.value, version: 3, moves: [{ ...alliance, lineId: '' }] },
          },
          error: /lineId|too small/i,
        },
        {
          name: 'empty-relationship-target-id',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-empty-target-id',
            value: {
              ...r2Relationship.value,
              version: 3,
              moves: [{ ...alliance, relationshipTargetId: '' }],
            },
          },
          error: /relationshipTargetId|too small/i,
        },
        {
          name: 'empty-story-event-id',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-empty-story-event-id',
            value: {
              ...r2Relationship.value,
              version: 3,
              moves: [{ ...alliance, storyEventIds: [''] }],
            },
          },
          error: /storyEventIds|too small/i,
        },
        {
          name: 'empty-emotion-episode-id',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-empty-emotion-episode-id',
            value: {
              ...r2Relationship.value,
              version: 3,
              moves: [{ ...alliance, emotionEpisodeIds: [''] }],
            },
          },
          error: /emotionEpisodeIds|too small/i,
        },
        {
          name: 'empty-contribution',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-empty-contribution',
            value: {
              ...r2Relationship.value,
              version: 3,
              moves: [{ ...alliance, contribution: '' }],
            },
          },
          error: /contribution|too small/i,
        },
        {
          name: 'empty-anchors',
          delta: {
            ...r2Relationship,
            id: 'clock-volume-old-court-relationship-invalid-empty-anchors',
            value: { ...r2Relationship.value, version: 3 },
            sourceAnchorIds: [],
          },
          error: /source anchor/i,
        },
      ]
      for (const invalid of invalidUpdates) {
        await expect(runtime.ctx.novelProject.accept(
          workspace.id,
          packet(`strict-relationship-clock-invalid-${invalid.name}`, 2, [invalid.delta]),
        )).rejects.toThrow(invalid.error)
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
        expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
        expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 2)).toEqual(current)
        expect(runtime.ctx.novelProject.projectRelationships(workspace.id, 2)).toEqual(currentRelationships)
      }
    } finally {
      await runtime.dispose()
    }
  })

  it('projects strict ending moves with accepted hypotheses and closure debts and rejects malformed updates atomically', async () => {
    const { home, cwd } = await makeHome('strict-ending-clock')
    const runtime = await boot(home)
    const relationshipDebt = {
      clock: 'relationship' as const,
      id: 'debt-ending-trust',
    }
    const promiseDebt = {
      clock: 'promise' as const,
      id: 'debt-ending-return',
    }
    const worldDebt = {
      clock: 'world' as const,
      id: 'debt-ending-moon-gate',
    }
    const convergeMove = {
      moveId: 'ending-move-converge-trust-and-return',
      kind: 'converge' as const,
      debtReferences: [relationshipDebt, promiseDebt],
      contribution: '把关系和解与返乡承诺汇入同一个终局选择。',
    }
    const holdWorldMove = {
      moveId: 'ending-move-hold-world-rebuild',
      kind: 'hold' as const,
      debtReferences: [worldDebt],
      contribution: '把月门制度重建明确留给尾声继续承担。',
    }
    const resolveMove = {
      moveId: 'ending-move-resolve-trust',
      kind: 'resolve' as const,
      debtReferences: [relationshipDebt],
      contribution: '沈砚与守门人共同交出控制权，兑现彼此托付。',
    }
    const aftermathMove = {
      moveId: 'ending-move-aftermath-return',
      kind: 'aftermath' as const,
      debtReferences: [promiseDebt],
      contribution: '第一份公开通行证让返乡承诺成为可见余波。',
    }
    const hypothesisR1 = {
      scopeUnitId: 'book-main',
      version: 1,
      endingTarget: '旧城脱离议会垄断，但月门制度仍待重建',
      decisiveConflict: '沈砚必须在摧毁月门与保留通行体系之间选择',
      protagonistChoice: '保留月门并公开守门规则',
      thematicReturn: '自由来自共同承担规则，而非逃离规则',
      desiredEmotionalAfterimage: '黎明中仍带余烬的希望',
      resolutionMode: 'transformation' as const,
      finalStates: [{
        kind: 'world' as const,
        subjectId: 'old-city',
        state: '议会失去对月门的独占权',
      }],
      aftermath: '守门人与城民开始共同制定通行规则',
      deliberatelyUnresolvedDebts: [worldDebt],
      epiloguePurpose: null,
    }
    const hypothesisR2 = {
      ...hypothesisR1,
      version: 2,
      endingTarget: '旧城与守门人共同管理公开的月门通行制度',
      protagonistChoice: '把月门交给新议会与守门人共同管理',
      resolutionMode: 'closure' as const,
      finalStates: [{
        kind: 'relationship' as const,
        subjectId: 'shen-yan:gatekeeper',
        state: '从互不信任转为共同守门',
      }, {
        kind: 'world' as const,
        subjectId: 'old-city',
        state: '月门通行规则公开且由新议会监督',
      }],
      aftermath: '首批公开通行证开始发放，旧议会残部退出城门',
      epiloguePurpose: '展示普通城民领取第一份公开通行证',
    }
    const endingR1 = {
      id: 'clock-book-main-ending-v1',
      kind: 'narrative-clock' as const,
      operation: 'set' as const,
      targetId: 'book-main',
      field: 'ending' as const,
      value: {
        movement: 'converge-and-hold',
        state: '关系与承诺开始汇入终局，制度重建仍被明确保留',
        storyTime: '终卷',
        version: 1,
        scope: { unitId: 'book-main', level: 'book' as const, closureScopeId: 'book-main' },
        moves: [convergeMove, holdWorldMove],
        revisionRationale: null,
      },
      sourceAnchorIds,
    } as const satisfies EndingClockSetDelta
    const endingR2 = {
      ...endingR1,
      id: 'clock-book-main-ending-v2',
      value: {
        ...endingR1.value,
        movement: 'resolve-and-aftermath',
        state: '关系债已兑现，返乡承诺进入余波，制度重建继续保留',
        storyTime: '终章与尾声',
        version: 2,
        moves: [resolveMove, aftermathMove, holdWorldMove],
        revisionRationale: '终章兑现关系与返乡承诺，并把制度重建留给尾声。',
      },
    } as const satisfies EndingClockSetDelta

    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-ending-clock-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        {
          id: 'ending-hypothesis-book-main-r1',
          kind: 'ending',
          operation: 'set',
          targetId: 'book-main',
          field: 'hypothesis',
          value: hypothesisR1,
          sourceAnchorIds,
        },
        {
          id: 'ending-relationship-debt-r1',
          kind: 'narrative-debt',
          operation: 'set',
          targetId: relationshipDebt.id,
          unitId: 'book-main',
          field: relationshipDebt.clock,
          value: {
            summary: '确认沈砚与守门人能否彼此托付',
            status: 'open',
          },
          sourceAnchorIds,
        },
        {
          id: 'ending-promise-debt-r1',
          kind: 'narrative-debt',
          operation: 'set',
          targetId: promiseDebt.id,
          unitId: 'book-main',
          field: promiseDebt.clock,
          value: {
            summary: '兑现沈砚终会回到旧城的承诺',
            status: 'open',
            dependsOn: [relationshipDebt],
          },
          sourceAnchorIds,
        },
        {
          id: 'ending-world-debt-r1',
          kind: 'narrative-debt',
          operation: 'set',
          targetId: worldDebt.id,
          unitId: 'book-main',
          field: worldDebt.clock,
          value: {
            summary: '重建公开的月门通行制度',
            status: 'open',
            dependsOn: [promiseDebt],
          },
          sourceAnchorIds,
        },
        endingR1,
      ]))

      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-ending-clock-r2', 1, [
        {
          id: 'ending-hypothesis-book-main-r2',
          kind: 'ending',
          operation: 'set',
          targetId: 'book-main',
          field: 'hypothesis',
          value: hypothesisR2,
          sourceAnchorIds,
        },
        {
          id: 'ending-relationship-debt-r2',
          kind: 'narrative-debt',
          operation: 'set',
          targetId: relationshipDebt.id,
          unitId: 'book-main',
          field: relationshipDebt.clock,
          value: {
            summary: '确认沈砚与守门人能否彼此托付',
            status: 'resolved',
          },
          sourceAnchorIds,
        },
        endingR2,
      ]))

      const historical = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      const current = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      const historicalEntry = historical.clocks.find(bucket => bucket.clock === 'ending')!.entries[0]!
      const currentEntry = current.clocks.find(bucket => bucket.clock === 'ending')!.entries[0]!
      expect(historicalEntry).toMatchObject({
        unitId: 'book-main',
        clock: 'ending',
        ...endingR1.value,
        sourceRevision: 1,
        sourceDeltaId: endingR1.id,
        delta: endingR1,
      })
      expect(currentEntry).toMatchObject({
        unitId: 'book-main',
        clock: 'ending',
        ...endingR2.value,
        sourceRevision: 2,
        sourceDeltaId: endingR2.id,
        delta: endingR2,
      })

      const canonBeforeQuery = runtime.ctx.novelProject.projectCanon(workspace.id, 2)
      const compared = runtime.ctx.novelMemory.retrieve(workspace.id, {
        revision: 2,
        compareRevision: 1,
        narrativeClock: 'ending',
        narrativeUnitId: 'book-main',
        closureScopeId: 'book-main',
        remainingChapterBudget: 9,
      })
      expect(compared.hits.filter(hit => hit.kind === 'narrative-clock')).toEqual([
        expect.objectContaining({
          sourceRevision: 2,
          value: expect.objectContaining({
            ...endingR2.value,
            delta: endingR2,
          }),
        }),
      ])
      expect(compared.closure).toMatchObject({
        scope: { id: 'book-main', level: 'book' },
        endingHypothesis: { value: hypothesisR2, sourceRevision: 2 },
        endingEntries: [currentEntry],
        debts: [
          expect.objectContaining({ id: promiseDebt.id, status: 'open', sourceRevision: 1 }),
          expect.objectContaining({ id: worldDebt.id, status: 'open', sourceRevision: 1 }),
          expect.objectContaining({ id: relationshipDebt.id, status: 'resolved', sourceRevision: 2 }),
        ],
        dependencyOrder: [relationshipDebt, promiseDebt, worldDebt],
        remainingChapterBudget: 9,
      })
      expect(compared.revisionImpact?.clockEntries!.changed).toEqual([{
        before: historicalEntry,
        after: currentEntry,
      }])
      expect(compared.revisionImpact?.debts!.changed).toEqual([{
        before: expect.objectContaining({ id: relationshipDebt.id, status: 'open' }),
        after: expect.objectContaining({ id: relationshipDebt.id, status: 'resolved' }),
      }])
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeQuery)

      const invalidUpdates: readonly {
        readonly name: string
        readonly delta: EndingClockSetDelta
        readonly error: RegExp
      }[] = [
        {
          name: 'generic-contract',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-generic',
            value: { movement: 'close', state: 'old generic ending clock must not pass' },
          } as unknown as EndingClockSetDelta,
          error: /version|scope|moves|required/i,
        },
        {
          name: 'empty-moves',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-empty-moves',
            value: { ...endingR2.value, version: 3, moves: [] },
          },
          error: /moves|too small|at least 1/i,
        },
        {
          name: 'duplicate-move-id',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-duplicate-move-id',
            value: {
              ...endingR2.value,
              version: 3,
              moves: [resolveMove, { ...aftermathMove, moveId: resolveMove.moveId }],
            },
          },
          error: /moveId|unique|duplicate/i,
        },
        {
          name: 'duplicate-debt-reference',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-duplicate-debt-reference',
            value: {
              ...endingR2.value,
              version: 3,
              moves: [{
                ...resolveMove,
                debtReferences: [relationshipDebt, relationshipDebt],
              }],
            },
          },
          error: /debt reference|debtReferences|unique|duplicate/i,
        },
        {
          name: 'scope-target',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-scope-target',
            value: {
              ...endingR2.value,
              version: 3,
              scope: { ...endingR2.value.scope, unitId: 'book-other' },
            },
          },
          error: /scope.*unitId.*targetId|targetId.*scope.*unitId/i,
        },
        {
          name: 'scope-level',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-scope-level',
            value: {
              ...endingR2.value,
              version: 3,
              scope: { ...endingR2.value.scope, level: 'volume' },
            },
          },
          error: /scope level.*volume.*book|book.*scope level.*volume/i,
        },
        {
          name: 'empty-closure-scope-id',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-empty-closure-scope-id',
            value: {
              ...endingR2.value,
              version: 3,
              scope: { ...endingR2.value.scope, closureScopeId: '' },
            },
          },
          error: /closureScopeId|too small/i,
        },
        {
          name: 'empty-debt-id',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-empty-debt-id',
            value: {
              ...endingR2.value,
              version: 3,
              moves: [{ ...resolveMove, debtReferences: [{ ...relationshipDebt, id: '' }] }],
            },
          },
          error: /debtReferences|id|too small/i,
        },
        {
          name: 'empty-contribution',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-empty-contribution',
            value: {
              ...endingR2.value,
              version: 3,
              moves: [{ ...resolveMove, contribution: '' }],
            },
          },
          error: /contribution|too small/i,
        },
        {
          name: 'empty-anchors',
          delta: {
            ...endingR2,
            id: 'clock-book-main-ending-invalid-empty-anchors',
            value: { ...endingR2.value, version: 3 },
            sourceAnchorIds: [],
          },
          error: /source anchor/i,
        },
      ]
      for (const invalid of invalidUpdates) {
        await expect(runtime.ctx.novelProject.accept(
          workspace.id,
          packet(`strict-ending-clock-invalid-${invalid.name}`, 2, [invalid.delta]),
        )).rejects.toThrow(invalid.error)
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
        expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
        expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 2)).toEqual(current)
        expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeQuery)
      }
    } finally {
      await runtime.dispose()
    }
  })

  it('projects strict world moves over accepted rules and continuity records and rejects malformed updates atomically', async () => {
    const { home, cwd } = await makeHome('strict-world-clock')
    const runtime = await boot(home)
    const ruleReference = {
      kind: 'rule' as const,
      targetId: 'rule-moon-gate-access',
    }
    const factionR1Reference = {
      kind: 'faction-continuity' as const,
      entryId: 'faction-entry-moon-council-lockdown',
    }
    const locationR1Reference = {
      kind: 'location-continuity' as const,
      entryId: 'location-entry-north-ferry-open',
    }
    const objectR1Reference = {
      kind: 'object-continuity' as const,
      entryId: 'object-entry-moon-seal-issued',
    }
    const factionR2Reference = {
      kind: 'faction-continuity' as const,
      entryId: 'faction-entry-moon-council-alliance',
    }
    const locationR2Reference = {
      kind: 'location-continuity' as const,
      entryId: 'location-entry-north-ferry-flood',
    }
    const objectR2Reference = {
      kind: 'object-continuity' as const,
      entryId: 'object-entry-moon-seal-transfer',
    }
    const r1Move = {
      moveId: 'world-move-moon-gate-access-r1',
      references: [ruleReference, factionR1Reference, locationR1Reference, objectR1Reference],
      contribution: '把月门规则、议会封锁、北渡口通路与月门印交付对齐为同一次世界变化。',
    }
    const r2Move = {
      moveId: 'world-move-moon-gate-access-r2',
      references: [ruleReference, factionR2Reference, locationR2Reference, objectR2Reference],
      contribution: '把公开通行规则、限时同盟、洪季限行与月门印转交对齐为新的世界状态。',
    }
    const worldR1 = {
      id: 'clock-volume-moon-gate-world-v1',
      kind: 'narrative-clock' as const,
      operation: 'set' as const,
      targetId: 'volume-moon-gate',
      field: 'world' as const,
      value: {
        movement: 'reconfigure-access',
        state: '月门仍由议会秘密控制，北渡口只向持印者开放',
        storyTime: '洪季前夜',
        version: 1,
        scope: { unitId: 'volume-moon-gate', level: 'volume' as const },
        moves: [r1Move],
        revisionRationale: null,
      },
      sourceAnchorIds,
    } as const satisfies WorldClockSetDelta
    const worldR2 = {
      ...worldR1,
      id: 'clock-volume-moon-gate-world-v2',
      value: {
        ...worldR1.value,
        state: '月门通行规则公开，北渡口在洪季由议会与巡河卫共同限行',
        storyTime: '洪季第一日',
        version: 2,
        moves: [r2Move],
        revisionRationale: '新规则与三条连续性事实共同改变了月门世界状态。',
      },
    } as const satisfies WorldClockSetDelta

    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-world-clock-r1', 0, [
        narrativeUnit('book-main', 'book', null, 0),
        narrativeUnit('volume-moon-gate', 'volume', 'book-main', 0),
        {
          id: 'world-rule-moon-gate-access-r1',
          kind: 'world',
          operation: 'set',
          targetId: ruleReference.targetId,
          field: 'rule',
          value: {
            scope: '月门与北渡口',
            statement: '只有持有月门印者能在无月之夜通过北渡口',
            version: 1,
            exceptions: ['议会税船可由双人签押通行'],
            publicBelief: '月门在洪季完全关闭',
            hiddenTruth: '议会仍用月门印维持秘密航线',
            observedConsequences: ['北岸粮船延误', '黑市夜航价格上涨'],
          },
          sourceAnchorIds,
        },
        {
          id: 'faction-moon-council-lockdown-r1',
          kind: 'faction-state',
          operation: 'set',
          targetId: factionR1Reference.entryId,
          field: 'continuity',
          value: {
            factionId: 'moon-council',
            eventId: 'event-north-ferry-lockdown',
            storyOrder: 10,
            goal: '在门印失踪公开前将其寻回',
            resources: ['三艘税船'],
            constraints: ['不得惊动城卫'],
            currentAction: '封锁北渡口并核对货单',
            membershipOrAllianceChange: '吸收渡口税吏为外围协力者',
            offscreenConsequence: '北岸粮船延误',
          },
          sourceAnchorIds,
        },
        {
          id: 'location-north-ferry-open-r1',
          kind: 'location-state',
          operation: 'set',
          targetId: locationR1Reference.entryId,
          field: 'continuity',
          value: {
            locationId: 'north-ferry',
            eventId: 'event-moon-gate-opened',
            storyOrder: 10,
            parentLocationId: 'northern-realm',
            scale: 'ferry',
            accessConditions: ['持有月门印', '无月之夜'],
            governingFactionIds: ['moon-council'],
            activeRuleIds: [ruleReference.targetId],
            resourceFlows: ['银砂由北渡口流入'],
            travelLinks: [{
              destinationLocationId: 'moon-gate-city',
              travelTime: '半日',
              accessConditions: ['北岸水位低于警戒线'],
              status: 'open',
            }],
            currentChange: '北渡口仅向持印者开放',
            consequence: '旧城商队绕开城卫税站',
          },
          sourceAnchorIds,
        },
        {
          id: 'object-moon-seal-issued-r1',
          kind: 'object-state',
          operation: 'set',
          targetId: objectR1Reference.entryId,
          field: 'continuity',
          value: {
            objectId: 'moon-gate-seal',
            eventId: 'event-moon-seal-issued',
            storyOrder: 10,
            holderId: 'courier-lin',
            locationId: 'moon-gate-vault',
            quantity: 1,
            condition: 'intact',
            status: 'sealed',
            currentChange: '月门印从库房交给林使',
            consequence: '林使获得北渡口通行资格',
          },
          sourceAnchorIds,
        },
        worldR1,
      ]))

      await runtime.ctx.novelProject.accept(workspace.id, packet('strict-world-clock-r2', 1, [
        {
          id: 'world-rule-moon-gate-access-r2',
          kind: 'world',
          operation: 'set',
          targetId: ruleReference.targetId,
          field: 'rule',
          value: {
            scope: '月门与北渡口',
            statement: '月门印持有者须在白昼登记并由议会与巡河卫共同放行',
            version: 2,
            exceptions: ['赈灾粮船可由巡河卫单独领航'],
            publicBelief: '月门通行规则已经公开',
            hiddenTruth: '议会保留一枚未登记的副印',
            observedConsequences: ['商队转向白昼登记', '巡河卫进入北渡口'],
          },
          sourceAnchorIds,
        },
        {
          id: 'faction-moon-council-alliance-r2',
          kind: 'faction-state',
          operation: 'set',
          targetId: factionR2Reference.entryId,
          field: 'continuity',
          value: {
            factionId: 'moon-council',
            eventId: 'event-hidden-hold-discovered',
            storyOrder: 20,
            goal: '用巡河卫协管换取公开通行制度',
            resources: ['密探口供', '议会安全屋'],
            constraints: ['城卫已经注意到渡口异常'],
            currentAction: '与巡河卫建立洪季限时同盟',
            membershipOrAllianceChange: '撤换旧渡口盟友并接纳巡河卫',
            offscreenConsequence: '旧盟友泄露议会私设水牢',
          },
          sourceAnchorIds,
        },
        {
          id: 'location-north-ferry-flood-r2',
          kind: 'location-state',
          operation: 'set',
          targetId: locationR2Reference.entryId,
          field: 'continuity',
          value: {
            locationId: 'north-ferry',
            eventId: 'event-north-ferry-flood',
            storyOrder: 20,
            parentLocationId: 'northern-realm',
            scale: 'ferry',
            accessConditions: ['登记月门印', '巡河卫洪季通行证'],
            governingFactionIds: ['moon-council', 'river-wardens'],
            activeRuleIds: [ruleReference.targetId],
            resourceFlows: ['北渡口只运输赈灾粮'],
            travelLinks: [{
              destinationLocationId: 'moon-gate-city',
              travelTime: '一日',
              accessConditions: ['巡河卫领航', '仅限白昼'],
              status: 'restricted',
            }],
            currentChange: '北渡口进入洪季限行并由巡河卫协管',
            consequence: '商队转向西岭驿道',
          },
          sourceAnchorIds,
        },
        {
          id: 'object-moon-seal-transfer-r2',
          kind: 'object-state',
          operation: 'set',
          targetId: objectR2Reference.entryId,
          field: 'continuity',
          value: {
            objectId: 'moon-gate-seal',
            eventId: 'event-moon-seal-transfer',
            storyOrder: 20,
            holderId: 'shen-yan',
            locationId: 'north-ferry',
            quantity: 1,
            condition: 'chipped',
            status: 'registered',
            currentChange: '沈砚接过月门印并完成公开登记',
            consequence: '沈砚可在洪季限行期间进入北渡口',
          },
          sourceAnchorIds,
        },
        worldR2,
      ]))

      const historicalNarrative = runtime.ctx.novelProject.projectNarrative(workspace.id, 1)
      const currentNarrative = runtime.ctx.novelProject.projectNarrative(workspace.id, 2)
      const historicalEntry = historicalNarrative.clocks
        .find(bucket => bucket.clock === 'world')!.entries[0]!
      const currentEntry = currentNarrative.clocks
        .find(bucket => bucket.clock === 'world')!.entries[0]!
      expect(historicalEntry).toMatchObject({
        unitId: 'volume-moon-gate',
        clock: 'world',
        ...worldR1.value,
        sourceRevision: 1,
        sourceDeltaId: worldR1.id,
        delta: worldR1,
      })
      expect(currentEntry).toMatchObject({
        unitId: 'volume-moon-gate',
        clock: 'world',
        ...worldR2.value,
        sourceRevision: 2,
        sourceDeltaId: worldR2.id,
        delta: worldR2,
      })

      const canonBeforeQuery = runtime.ctx.novelProject.projectCanon(workspace.id, 2)
      const query = {
        revision: 2,
        compareRevision: 1,
        canonKind: 'world' as const,
        canonTargetId: ruleReference.targetId,
        narrativeClock: 'world' as const,
        narrativeUnitId: 'volume-moon-gate',
        factionId: 'moon-council',
        locationId: 'north-ferry',
        objectId: 'moon-gate-seal',
      }
      const current = runtime.ctx.novelMemory.retrieve(workspace.id, query)
      expect(current.hits.find(hit => hit.kind === 'canon-fact')).toMatchObject({
        sourceRevision: 2,
        value: {
          kind: 'world',
          targetId: ruleReference.targetId,
          field: 'rule',
          sourceDeltaId: 'world-rule-moon-gate-access-r2',
        },
      })
      expect(current.hits.find(hit => hit.kind === 'narrative-clock')).toMatchObject({
        sourceRevision: 2,
        value: currentEntry,
      })
      expect(current.factionContinuity?.entries.map(entry => entry.entryId)).toEqual([
        factionR1Reference.entryId,
        factionR2Reference.entryId,
      ])
      expect(current.locationContinuity?.entries.map(entry => entry.entryId)).toEqual([
        locationR1Reference.entryId,
        locationR2Reference.entryId,
      ])
      expect(current.objectContinuity?.entries.map(entry => entry.entryId)).toEqual([
        objectR1Reference.entryId,
        objectR2Reference.entryId,
      ])
      expect(current.factionContinuity?.entries[1]).toMatchObject({
        sourceRevision: 2,
        sourceDeltaId: 'faction-moon-council-alliance-r2',
        continuity: { factionId: 'moon-council', eventId: 'event-hidden-hold-discovered' },
      })
      expect(current.locationContinuity?.entries[1]).toMatchObject({
        sourceRevision: 2,
        sourceDeltaId: 'location-north-ferry-flood-r2',
        continuity: { locationId: 'north-ferry', eventId: 'event-north-ferry-flood' },
      })
      expect(current.objectContinuity?.entries[1]).toMatchObject({
        sourceRevision: 2,
        sourceDeltaId: 'object-moon-seal-transfer-r2',
        continuity: { objectId: 'moon-gate-seal', eventId: 'event-moon-seal-transfer' },
      })
      expect(current.revisionImpact?.clockEntries!.changed).toEqual([{
        before: historicalEntry,
        after: currentEntry,
      }])
      expect(current.revisionImpact?.canonFacts.changed).toEqual([
        expect.objectContaining({
          before: expect.objectContaining({
            kind: 'world',
            targetId: ruleReference.targetId,
            sourceRevision: 1,
          }),
          after: expect.objectContaining({
            kind: 'world',
            targetId: ruleReference.targetId,
            sourceRevision: 2,
          }),
        }),
      ])

      const historical = runtime.ctx.novelMemory.retrieve(workspace.id, {
        ...query,
        revision: 1,
        compareRevision: undefined,
      })
      expect(historical.headRevision).toBe(2)
      expect(historical.freshness).toBe('historical')
      expect(historical.hits.find(hit => hit.kind === 'narrative-clock')).toMatchObject({
        sourceRevision: 1,
        value: historicalEntry,
      })
      expect(historical.factionContinuity?.entries.map(entry => entry.entryId)).toEqual([
        factionR1Reference.entryId,
      ])
      expect(historical.locationContinuity?.entries.map(entry => entry.entryId)).toEqual([
        locationR1Reference.entryId,
      ])
      expect(historical.objectContinuity?.entries.map(entry => entry.entryId)).toEqual([
        objectR1Reference.entryId,
      ])
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeQuery)

      const invalidUpdates: readonly {
        readonly name: string
        readonly delta: WorldClockSetDelta
        readonly error: RegExp
      }[] = [
        {
          name: 'generic-contract',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-generic',
            value: { movement: 'advance', state: 'old generic world clock must not pass' },
          } as unknown as WorldClockSetDelta,
          error: /version|scope|moves|required/i,
        },
        {
          name: 'scope-target',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-scope-target',
            value: {
              ...worldR2.value,
              version: 3,
              scope: { ...worldR2.value.scope, unitId: 'volume-other' },
            },
          },
          error: /scope.*unitId.*targetId|targetId.*scope.*unitId/i,
        },
        {
          name: 'missing-unit',
          delta: {
            ...worldR2,
            id: 'clock-volume-missing-world-invalid-unit',
            targetId: 'volume-missing',
            value: {
              ...worldR2.value,
              version: 3,
              scope: { unitId: 'volume-missing', level: 'volume' },
            },
          },
          error: /references missing unit|missing unit|volume-missing/i,
        },
        {
          name: 'scope-level',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-scope-level',
            value: {
              ...worldR2.value,
              version: 3,
              scope: { ...worldR2.value.scope, level: 'arc' },
            },
          },
          error: /scope level.*arc.*volume|volume.*scope level.*arc/i,
        },
        {
          name: 'empty-moves',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-empty-moves',
            value: { ...worldR2.value, version: 3, moves: [] },
          },
          error: /moves|too small|at least 1/i,
        },
        {
          name: 'duplicate-move-id',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-duplicate-move-id',
            value: {
              ...worldR2.value,
              version: 3,
              moves: [r2Move, { ...r1Move, moveId: r2Move.moveId }],
            },
          },
          error: /moveId|unique|duplicate/i,
        },
        {
          name: 'empty-references',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-empty-references',
            value: {
              ...worldR2.value,
              version: 3,
              moves: [{ ...r2Move, references: [] }],
            },
          },
          error: /references|too small|at least 1/i,
        },
        {
          name: 'unknown-reference-kind',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-reference-kind',
            value: {
              ...worldR2.value,
              version: 3,
              moves: [{
                ...r2Move,
                references: [{ kind: 'timeline', entryId: 'event-flood' }],
              }],
            },
          } as unknown as WorldClockSetDelta,
          error: /kind|invalid/i,
        },
        {
          name: 'empty-reference-id',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-empty-reference-id',
            value: {
              ...worldR2.value,
              version: 3,
              moves: [{ ...r2Move, references: [{ ...ruleReference, targetId: '' }] }],
            },
          },
          error: /targetId|too small/i,
        },
        {
          name: 'duplicate-reference',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-duplicate-reference',
            value: {
              ...worldR2.value,
              version: 3,
              moves: [{ ...r2Move, references: [ruleReference, ruleReference] }],
            },
          },
          error: /reference|unique|duplicate/i,
        },
        {
          name: 'empty-contribution',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-empty-contribution',
            value: {
              ...worldR2.value,
              version: 3,
              moves: [{ ...r2Move, contribution: '' }],
            },
          },
          error: /contribution|too small/i,
        },
        {
          name: 'empty-anchors',
          delta: {
            ...worldR2,
            id: 'clock-volume-moon-gate-world-invalid-empty-anchors',
            value: { ...worldR2.value, version: 3 },
            sourceAnchorIds: [],
          },
          error: /source anchor/i,
        },
      ]
      for (const invalid of invalidUpdates) {
        await expect(runtime.ctx.novelProject.accept(
          workspace.id,
          packet(`strict-world-clock-invalid-${invalid.name}`, 2, [invalid.delta]),
        )).rejects.toThrow(invalid.error)
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(2)
        expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
        expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 2)).toEqual(currentNarrative)
        expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2)).toEqual(canonBeforeQuery)
      }
    } finally {
      await runtime.dispose()
    }
  })

  it.each([
    {
      name: 'scope target',
      delta: () => {
        const base = narrativeClock('book-main', 'book')
        return {
          ...base,
          value: {
            ...base.value,
            scope: { unitId: 'book-other', level: 'book' as const },
          },
        } as unknown as CanonDelta
      },
      error: /scope.*unitId.*targetId|targetId.*scope.*unitId/i,
    },
    {
      name: 'scope level',
      delta: () => {
        const base = narrativeClock('book-main', 'book')
        return {
          ...base,
          value: {
            ...base.value,
            scope: { unitId: 'book-main', level: 'chapter' as const },
          },
        } as unknown as CanonDelta
      },
      error: /scope level.*chapter.*book|book.*scope level.*chapter/i,
    },
    {
      name: 'source anchor',
      delta: () => ({
        ...narrativeClock('book-main', 'book'),
        sourceAnchorIds: [],
      } as unknown as CanonDelta),
      error: /source anchor/i,
    },
    {
      name: 'plot lines',
      delta: () => {
        const base = narrativeClock('book-main', 'book')
        return {
          ...base,
          value: {
            ...base.value,
            lines: [],
          },
        } as unknown as CanonDelta
      },
      error: /lines|at least one/i,
    },
  ])('rejects a plot progression with an invalid $name before advancing Canon', async ({ name, delta, error }) => {
    const { home, cwd } = await makeHome(`strict-plot-${name.replace(' ', '-')}`)
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await expect(runtime.ctx.novelProject.accept(workspace.id, packet(`strict-plot-${name}`, 0, [
        narrativeUnit('book-main', 'book', null, 0),
        delta(),
      ]))).rejects.toThrow(error)

      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(0)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
      expect(runtime.ctx.novelProject.projectNarrative(workspace.id, 0).clocks[0]?.entries).toEqual([])
    } finally {
      await runtime.dispose()
    }
  })
})
