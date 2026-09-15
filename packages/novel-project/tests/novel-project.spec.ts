import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
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
import NovelReview from '@novel-agent/novel-review'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import NovelProjectService, { NovelProjectDomainUnavailableError } from '../src/index.js'

const homes: string[] = []

afterEach(async () => {
  for (const home of homes.splice(0)) {
    await rm(home, { recursive: true, force: true })
  }
})

async function makeHome(name: string): Promise<{ home: string; cwd: string }> {
  const home = await realpath(await mkdtemp(join(tmpdir(), `novel-project-${name}-`)))
  homes.push(home)
  const cwd = join(home, 'workspace')
  await mkdir(cwd)
  return { home, cwd }
}

async function boot(
  home: string,
  subagents: { readonly start: (...args: never[]) => Promise<unknown> } = {
    start: async () => { throw new Error('unexpected subagent start') },
  },
) {
  const ctx = new Context()
  const disposeSubagents = ctx.provide('subagents', subagents as never)
  const disposeFileSystem = ctx.provide('fs', {
    resolve: async () => { throw new Error('unexpected filesystem resolve') },
    writeText: async () => { throw new Error('unexpected filesystem write') },
  } as never)
  const disposeSandboxPolicy = ctx.provide('sandboxPolicy', {
    resolve: () => { throw new Error('unexpected sandbox policy resolve') },
  } as never)
  const sessions = await ctx.plugin(SessionStore)
  ctx.sessions.create(SessionId('fixture-canon'), { meta: { cwd: join(home, 'workspace') } })
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

  return {
    ctx,
    async dispose() {
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

function resultPacket(
  suffix: string,
  expectedRevision: number,
  text: string,
) {
  const anchorId = `anchor-${suffix}`
  return {
    packetId: `packet-${suffix}`,
    expectedRevision,
    manuscript: {
      unitId: 'chapter-1',
      title: '第一章',
      text,
    },
    manuscriptDiff: {
      format: 'unified',
      text: `--- accepted/chapter-1\n+++ draft/chapter-1\n+${text}`,
    },
    deltas: [{
      id: `delta-${suffix}`,
      kind: 'story-event',
      operation: 'set',
      targetId: `event-${suffix}`,
      field: 'summary',
      value: text,
      sourceAnchorIds: [anchorId],
    }],
    issues: [],
    sourceAnchors: [{
      id: anchorId,
      sourceId: `draft-${suffix}`,
      start: 0,
      end: text.length,
      contentHash: 'a'.repeat(64),
    }],
    provenance: {
      taskId: `task-${suffix}`,
      sessionId: 'fixture-canon',
      producer: 'writer',
    },
    authorization: {
      kind: 'author',
      actorId: 'author-1',
      decisionId: `decision-${suffix}`,
    },
  } as const
}

function rollbackCommand(
  suffix: string,
  expectedRevision: number,
  targetRevision: number,
) {
  return {
    commandId: `rollback-${suffix}`,
    expectedRevision,
    targetRevision,
    provenance: {
      taskId: `rollback-task-${suffix}`,
      sessionId: 'fixture-canon',
      producer: 'author',
    },
    authorization: {
      kind: 'author',
      actorId: 'author-1',
      decisionId: `rollback-decision-${suffix}`,
    },
  } as const
}

function caughtError(run: () => unknown): unknown {
  try {
    run()
  } catch (error) {
    return error
  }
  throw new Error('expected the call to throw')
}

describe('NovelProjectService', () => {
  it('publishes only Canon prompt guidance when domain plugins are absent', async () => {
    const { home } = await makeHome('canon-prompt-only')
    const runtime = await boot(home)
    try {
      const sections = (await runtime.ctx.systemPrompt.assemble()).sections
        .filter(section => section.name.startsWith('novel:'))
      expect(sections.map(section => section.name)).toEqual(['novel:canon'])
      expect(sections[0]?.text).toContain('Accept: author decision')
      expect(sections[0]?.text).not.toContain('- Plan:')
      expect(sections[0]?.text).not.toContain('- Write:')
      expect(sections[0]?.text).not.toContain('- Review:')
      expect(sections[0]?.text).not.toContain('- Publish:')
      expect(sections[0]?.text).not.toContain('chapterId')
    } finally {
      await runtime.dispose()
    }
  })

  it('runs the complete Canon chain in a Core-only assembly', async () => {
    const { home, cwd } = await makeHome('canon-core-only-chain')
    const runtime = await boot(home)
    const disposeApproval = runtime.ctx.provide('approval', {
      request: async () => 'allowed-once' as const,
    } as never)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await expect(runtime.ctx.novelProject.open(workspace)).resolves.toMatchObject({ acceptedRevision: 0 })
      const packet = resultPacket('core-only-chain', 0, 'R1 正文')
      const { authorization: _authorization, ...draft } = packet
      expect(runtime.ctx.novelProject.parseDraft(draft)).toMatchObject({ packetId: 'packet-core-only-chain' })
      expect(runtime.ctx.novelProject.previewReview(workspace.id, {
        packet: draft,
        decisions: [
          { itemType: 'manuscript', itemId: 'chapter-1', outcome: 'accept' },
          { itemType: 'delta', itemId: 'delta-core-only-chain', outcome: 'accept' },
        ],
      })).toMatchObject({ projectedRevision: 1 })
      await expect(runtime.ctx.novelProject.accept(workspace.id, packet)).resolves.toMatchObject({ revision: 1 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toMatchObject({ packetId: 'packet-core-only-chain' })
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 1).facts).toHaveLength(1)
      await expect(runtime.ctx.novelProject.rollback(workspace.id, rollbackCommand('core-only-chain', 1, 1)))
        .resolves.toMatchObject({ revision: 2, rollbackOfRevision: 1 })
      const session = runtime.ctx.sessions.get(SessionId('fixture-canon'))!
      const lock = await runtime.ctx.tools.execute({
        callId: 'core-only-chain-lock' as never,
        name: 'manage_novel_canon_lock',
        arguments: {
          action: 'lock',
          expectedRevision: 2,
          kind: 'story-event',
          targetId: 'event-core-only-chain',
          field: 'summary',
        },
        agent: { id: SessionId('fixture-canon'), session } as never,
        signal: new AbortController().signal,
      })
      expect(lock).toMatchObject({
        isError: false,
        value: { locks: [{ kind: 'story-event', targetId: 'event-core-only-chain', field: 'summary' }] },
      })
      expect(runtime.ctx.novelProject.current(workspace.id)?.canonLocks).toHaveLength(1)
    } finally {
      disposeApproval()
      await runtime.dispose()
    }
  })

  it('names the missing domain capability instead of throwing a bare TypeError', async () => {
    const { home, cwd } = await makeHome('canon-core-only-errors')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const narrativeError = caughtError(() => runtime.ctx.novelProject.projectNarrative(workspace.id, 0))
      expect(narrativeError).toBeInstanceOf(NovelProjectDomainUnavailableError)
      expect(narrativeError).toMatchObject({
        name: 'NovelProjectDomainUnavailableError',
        code: 'domain-unavailable',
        capability: 'projector',
        requirement: 'planning/narrative',
      })
      expect((narrativeError as Error).message).toContain('planning/narrative')
      const relationshipError = caughtError(() => runtime.ctx.novelProject.projectRelationships(workspace.id, 0))
      expect(relationshipError).toBeInstanceOf(NovelProjectDomainUnavailableError)
      expect(relationshipError).toMatchObject({
        name: 'NovelProjectDomainUnavailableError',
        code: 'domain-unavailable',
        capability: 'projector',
        requirement: 'memory/relationships',
      })
      const retrieveError = caughtError(() => runtime.ctx.novelProject.remoteRetrieve(
        workspace.id,
        { revision: 0, exactText: '不存在' },
      ))
      expect(retrieveError).toBeInstanceOf(NovelProjectDomainUnavailableError)
      expect(retrieveError).toMatchObject({
        name: 'NovelProjectDomainUnavailableError',
        code: 'domain-unavailable',
        capability: 'domain-service',
        requirement: 'novelMemory',
      })
      await expect(runtime.ctx.novelProject.remoteReviewDraft(
        'missing-review-session',
        workspace.id,
        {} as never,
        new AbortController().signal,
      )).rejects.toMatchObject({
        name: 'NovelProjectDomainUnavailableError',
        code: 'domain-unavailable',
        capability: 'domain-service',
        requirement: 'novelReview',
      })
      const { authorization: _unregisteredAuthorization, ...unregisteredBase } = resultPacket(
        'core-only-unregistered-extension',
        0,
        '扩展正文',
      )
      const unregistered = {
        ...unregisteredBase,
        deltas: [{
          id: 'delta-core-only-unregistered-extension',
          kind: 'extension',
          operation: 'set',
          namespace: 'test/unregistered',
          targetId: 'extension-target',
          field: 'value',
          value: { note: 'x' },
          sourceAnchorIds: ['anchor-core-only-unregistered-extension'],
        }],
      }
      const extensionError = caughtError(() => runtime.ctx.novelProject.parseDraft(unregistered))
      expect(extensionError).toBeInstanceOf(NovelProjectDomainUnavailableError)
      expect(extensionError).toMatchObject({
        name: 'NovelProjectDomainUnavailableError',
        code: 'domain-unavailable',
        capability: 'extension',
        requirement: 'test/unregistered',
      })
      expect((extensionError as Error).message).toContain('test/unregistered')
    } finally {
      await runtime.dispose()
    }
  })

  it('delegates a migrated domain Delta kind to its owning plugin schema', async () => {
    const { home, cwd } = await makeHome('canon-delta-kind-registry')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const { authorization: _authorization, ...base } = resultPacket('delta-kind-world', 0, '世界规则正文')
      const worldRule = {
        scope: '旧港层',
        statement: '雾夜显形',
        version: 1,
        exceptions: [],
        publicBelief: '雾夜传闻',
        hiddenTruth: '旧港层随潮位开启',
        observedConsequences: ['航标短暂熄灭'],
      }
      const worldDraft = (value: unknown) => ({
        ...base,
        deltas: [{
          id: 'world-rule-delta',
          kind: 'world',
          operation: 'set',
          targetId: 'rule-old-harbor',
          field: 'rule',
          value,
          sourceAnchorIds: [base.sourceAnchors[0].id],
        }],
      })
      const coreOnlyError = caughtError(() => runtime.ctx.novelProject.parseDraft(worldDraft(worldRule)))
      expect(coreOnlyError).toBeInstanceOf(NovelProjectDomainUnavailableError)
      expect(coreOnlyError).toMatchObject({
        code: 'domain-unavailable',
        capability: 'delta-kind',
        requirement: 'world',
      })
      const planning = await runtime.ctx.plugin(NovelPlanning)
      try {
        expect(runtime.ctx.novelProject.parseDraft(worldDraft(worldRule)))
          .toMatchObject({ deltas: [{ kind: 'world', value: worldRule }] })
        const invalidError = caughtError(() => runtime.ctx.novelProject.parseDraft(
          worldDraft({ ...worldRule, hiddenTruth: '' }),
        ))
        expect(invalidError).toMatchObject({ name: 'ZodError' })
        expect((invalidError as Error).message).toContain('hiddenTruth')
      } finally {
        await planning.dispose()
      }
      const withdrawnError = caughtError(() => runtime.ctx.novelProject.parseDraft(worldDraft(worldRule)))
      expect(withdrawnError).toBeInstanceOf(NovelProjectDomainUnavailableError)
    } finally {
      await runtime.dispose()
    }
  })

  it('keeps Review pending without Memory and withdraws its roles when Memory unloads', async () => {
    const { home, cwd } = await makeHome('review-memory-lifetime')
    const runtime = await boot(home)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const review = runtime.ctx.plugin(NovelReview)
    try {
      for (const name of ['novel-reviewer', 'novel-researcher']) {
        expect((await runtime.ctx.skills.get(name, { cwd }))?.name).toBeUndefined()
      }
      const memory = await runtime.ctx.plugin(NovelMemory)
      try {
        await review.await()
        expect(await runtime.ctx.skills.get('novel-reviewer', { cwd }))
          .toMatchObject({ source: '@novel-agent/novel-review' })
      } finally {
        await memory.dispose()
      }
      await review.await()
      for (const name of ['novel-reviewer', 'novel-researcher']) {
        expect((await runtime.ctx.skills.get(name, { cwd }))?.name).toBeUndefined()
      }
      expect(await runtime.ctx.skills.get('novel-prose-writer', { cwd }))
        .toMatchObject({ source: '@novel-agent/novel-writing' })
    } finally {
      await review.dispose()
      await writing.dispose()
      await planning.dispose()
      await skills.dispose()
      await runtime.dispose()
    }
  })

  it('waits for Writing before Memory and Review roles, retrieves historical sources, and withdraws the dependent roles', async () => {
    const { home, cwd } = await makeHome('memory-review-lifetime')
    const runtime = await boot(home)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const memory = runtime.ctx.plugin(NovelMemory)
    const review = runtime.ctx.plugin(NovelReview)
    const roles = [
      ['novel-continuity-checker', '@novel-agent/novel-memory'],
      ['novel-writing-memory-organizer', '@novel-agent/novel-memory'],
      ['novel-reviewer', '@novel-agent/novel-review'],
      ['novel-researcher', '@novel-agent/novel-review'],
    ] as const
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      for (const [name] of roles) expect((await runtime.ctx.skills.get(name, { cwd }))?.name).toBeUndefined()
      const writing = await runtime.ctx.plugin(NovelWriting)
      try {
        await memory.await()
        await review.await()
        for (const [name, source] of roles) expect(await runtime.ctx.skills.get(name, { cwd })).toMatchObject({ name, source })
        await runtime.ctx.novelProject.accept(workspace.id, resultPacket('memory-read-r1', 0, 'R1 旧正文'))
        await runtime.ctx.novelProject.accept(workspace.id, resultPacket('memory-read-r2', 1, 'R2 新正文'))
        const beforeRead = await readFile(join(home, 'storages', 'novel_project.json'))
        const historical = runtime.ctx.novelMemory.retrieve(workspace.id, { revision: 1, exactText: 'R1 旧正文' })
        expect(historical.hits).toContainEqual(expect.objectContaining({
          method: 'exact-text', sourceRevision: 1, match: 'R1 旧正文',
          sourceRanges: [expect.objectContaining({ sourceId: 'chapter-1' })],
        }))
        expect(runtime.ctx.novelMemory.retrieve(workspace.id, { revision: 1, exactText: 'R2 新正文' }).hits
          .filter(hit => hit.method === 'exact-text')).toEqual([])
        expect(await readFile(join(home, 'storages', 'novel_project.json'))).toEqual(beforeRead)
        await runtime.ctx.novelProject.rollback(workspace.id, rollbackCommand('memory-read', 2, 1))
        expect(runtime.ctx.novelMemory.retrieve(workspace.id, { revision: 3, exactText: 'R1 旧正文' }).hits)
          .toContainEqual(expect.objectContaining({ method: 'exact-text', sourceRevision: 1, match: 'R1 旧正文' }))
      } finally {
        await writing.dispose()
      }
      await memory.await()
      await review.await()
      for (const [name] of roles) expect((await runtime.ctx.skills.get(name, { cwd }))?.name).toBeUndefined()
      expect(() => runtime.ctx.novelProject.projectRelationships(workspace.id, 3)).toThrow()
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(3)
    } finally {
      await review.dispose()
      await memory.dispose()
      await planning.dispose()
      await skills.dispose()
      await runtime.dispose()
    }
  })

  it('reads bidirectional relationship sources through Memory across history and rollback', async () => {
    const { home, cwd } = await makeHome('memory-relationship-read')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const first = resultPacket('memory-relationship-r1', 0, '沈砚向陆星交出钥匙，陆星仍保持戒备。')
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...first,
        deltas: [
          { id: 'forward-r1', kind: 'relationship', operation: 'set', targetId: 'shen->lu', field: 'status', value: '合作', sourceAnchorIds: [first.sourceAnchors[0].id] },
          { id: 'reverse-r1', kind: 'relationship', operation: 'set', targetId: 'lu->shen', field: 'status', value: '戒备', sourceAnchorIds: [first.sourceAnchors[0].id] },
        ],
      })
      const second = resultPacket('memory-relationship-r2', 1, '沈砚发现钥匙被复制，与陆星决裂。')
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...second,
        deltas: [{ id: 'forward-r2', kind: 'relationship', operation: 'set', targetId: 'shen->lu', field: 'status', value: '决裂', sourceAnchorIds: [second.sourceAnchors[0].id] }],
      })
      const before = await readFile(join(home, 'storages', 'novel_project.json'))
      const historical = runtime.ctx.novelMemory.readRelationships(workspace.id, 1)
      expect(historical.relationships).toMatchObject([{
        line: 'lu<->shen',
        directions: [
          { pair: 'lu->shen', fields: { status: '戒备' }, fieldSources: { status: { sourceRevision: 1, sourceDeltaId: 'reverse-r1' } } },
          { pair: 'shen->lu', fields: { status: '合作' }, fieldSources: { status: { sourceRevision: 1, sourceDeltaId: 'forward-r1' } } },
        ],
      }])
      expect(runtime.ctx.novelMemory.readRelationships(workspace.id, 2).relationships[0]?.directions[1])
        .toMatchObject({ fields: { status: '决裂' }, sourceRevision: 2, sourceAnchorIds: [second.sourceAnchors[0].id] })
      expect(await readFile(join(home, 'storages', 'novel_project.json'))).toEqual(before)
      await runtime.ctx.novelProject.rollback(workspace.id, rollbackCommand('memory-relationship', 2, 1))
      expect(runtime.ctx.novelMemory.readRelationships(workspace.id, 3).relationships).toEqual(historical.relationships)
    } finally {
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('builds a chapter control pack in Memory from accepted sources across history and rollback', async () => {
    const { home, cwd } = await makeHome('memory-control-pack')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const first = resultPacket('memory-pack-r1', 0, '沈砚在旧庭找到钥匙。')
      const units = [
        ['book', 'book', null], ['volume', 'volume', 'book'], ['arc', 'arc', 'volume'],
        ['chapter-1', 'chapter', 'arc'], ['chapter-2', 'chapter', 'arc'],
      ] as const
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...first,
        deltas: units.map(([targetId, level, parentId], order) => ({
          id: `unit-${targetId}`, kind: 'narrative-unit' as const, operation: 'set' as const,
          targetId, field: 'unit' as const,
          value: { level, parentId, order, objective: targetId, entryState: '进入旧庭', exitState: '查明钥匙来源', status: 'planned' as const },
          sourceAnchorIds: [first.sourceAnchors[0].id],
        })),
      })
      await runtime.ctx.novelProject.accept(workspace.id, resultPacket('memory-pack-r2', 1, '沈砚在新码头找到复制品。'))
      const before = await readFile(join(home, 'storages', 'novel_project.json'))
      const historical = runtime.ctx.novelMemory.readChapterControlPack(workspace.id, 1, 'chapter-2')
      expect(historical).toMatchObject({
        sourceRevision: 1, headRevision: 2, freshness: 'historical',
        chapter: { id: 'chapter-2' },
        scope: [{ id: 'book' }, { id: 'volume' }, { id: 'arc' }, { id: 'chapter-2' }],
        recentManuscripts: [{ sourceRevision: 1, manuscript: { text: '沈砚在旧庭找到钥匙。' } }],
      })
      expect(runtime.ctx.novelMemory.readChapterControlPack(workspace.id, 2, 'chapter-2').recentManuscripts)
        .toMatchObject([{ sourceRevision: 2, manuscript: { text: '沈砚在新码头找到复制品。' } }])
      expect(await readFile(join(home, 'storages', 'novel_project.json'))).toEqual(before)
      await runtime.ctx.novelProject.rollback(workspace.id, rollbackCommand('memory-pack', 2, 1))
      const restored = runtime.ctx.novelMemory.readChapterControlPack(workspace.id, 3, 'chapter-2')
      expect(restored.recentManuscripts).toEqual(historical.recentManuscripts)
      expect(restored).toMatchObject({ sourceRevision: 3, headRevision: 3, freshness: 'current' })
      expect(runtime.ctx.novelProject.readSnapshot(workspace.id, 3).revisions.map(source => source.revision)).toEqual([1])
    } finally {
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('reads Memory graphs and sourced causal paths at historical and rolled-back revisions', async () => {
    const { home, cwd } = await makeHome('memory-graph-read')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const first = resultPacket('memory-graph-r1', 0, '钥匙丢失，导致旧庭调查中断。')
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...first,
        deltas: [{ id: 'cause-a-b-r1', kind: 'story-event', operation: 'set', targetId: 'event-a', field: 'causes', value: 'event-b', sourceAnchorIds: [first.sourceAnchors[0].id] }],
      })
      const second = resultPacket('memory-graph-r2', 1, '调查中断，导致证人离港。')
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...second,
        deltas: [{ id: 'cause-b-c-r2', kind: 'story-event', operation: 'set', targetId: 'event-b', field: 'causes', value: 'event-c', sourceAnchorIds: [second.sourceAnchors[0].id] }],
      })
      const before = await readFile(join(home, 'storages', 'novel_project.json'))
      const r1 = runtime.ctx.novelMemory.readGraph(workspace.id, 1)
      expect(r1).toMatchObject({ revision: 1, headRevision: 2, freshness: 'historical', provider: 'novel-graph' })
      expect(r1.edges.filter(edge => edge.kind === 'causal')).toMatchObject([{
        from: 'entity:event-a', to: 'entity:event-b', sourceRevision: 1, sourceDeltaId: 'cause-a-b-r1',
        sourceRanges: [{ anchorId: first.sourceAnchors[0].id, contentHash: first.sourceAnchors[0].contentHash }],
      }])
      const r2 = runtime.ctx.novelMemory.readGraph(workspace.id, 2)
      expect(runtime.ctx.novelMemory.traceCausalImpact(r2, 'event-a').affected).toMatchObject([
        { eventId: 'event-b', depth: 1 }, { eventId: 'event-c', depth: 2, path: [{ sourceRevision: 1 }, { sourceRevision: 2 }] },
      ])
      expect(runtime.ctx.novelMemory.traceCausalImpact(r1, 'event-a').affected.map(event => event.eventId)).toEqual(['event-b'])
      expect(await readFile(join(home, 'storages', 'novel_project.json'))).toEqual(before)
      await runtime.ctx.novelProject.rollback(workspace.id, rollbackCommand('memory-graph', 2, 1))
      const r3 = runtime.ctx.novelMemory.readGraph(workspace.id, 3)
      expect(r3.contentHash).toBe(r1.contentHash)
      expect(r3.edges).toEqual(r1.edges)
      expect(r3).toMatchObject({ revision: 3, headRevision: 3, freshness: 'current' })
    } finally {
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('contributes candidate causal comparisons only while Memory is available', async () => {
    const { home, cwd } = await makeHome('memory-candidate-graph')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const first = resultPacket('candidate-graph-r1', 0, '钥匙丢失导致调查中断。')
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...first,
        deltas: [{ id: 'candidate-cause-r1', kind: 'story-event', operation: 'set', targetId: 'event-a', field: 'causes', value: 'event-b', sourceAnchorIds: [first.sourceAnchors[0].id] }],
      })
      const second = resultPacket('candidate-graph-r2', 1, '钥匙丢失直接导致证人离港。')
      const { authorization: _authorization, ...draft } = second
      const command = {
        packet: { ...draft, deltas: [{ id: 'candidate-cause-r2', kind: 'story-event' as const, operation: 'set' as const, targetId: 'event-a', field: 'causes', value: 'event-c', sourceAnchorIds: [second.sourceAnchors[0].id] }] },
        decisions: [
          { itemType: 'manuscript', itemId: 'chapter-1', outcome: 'reject' },
          { itemType: 'delta', itemId: 'candidate-cause-r2', outcome: 'accept' },
        ],
      }
      const before = await readFile(join(home, 'storages', 'novel_project.json'))
      expect(runtime.ctx.novelProject.previewReview(workspace.id, command).impact).not.toHaveProperty('causalConsequences')
      const memory = await runtime.ctx.plugin(NovelMemory)
      try {
        const preview = runtime.ctx.novelProject.previewReview(workspace.id, command)
        expect(preview).toMatchObject({ expectedRevision: 1, projectedRevision: 2 })
        expect(preview.impact.causalConsequences).toMatchObject([{
          sourceEventId: 'event-a',
          added: [{ eventId: 'event-c', depth: 1, path: [{ sourceRevision: 2, sourceDeltaId: 'candidate-cause-r2' }] }],
          removed: [{ eventId: 'event-b', depth: 1, path: [{ sourceRevision: 1, sourceDeltaId: 'candidate-cause-r1' }] }],
          changed: [],
        }])
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(1)
        expect(await readFile(join(home, 'storages', 'novel_project.json'))).toEqual(before)
      } finally {
        await memory.dispose()
      }
      expect(runtime.ctx.novelProject.previewReview(workspace.id, command).impact).not.toHaveProperty('causalConsequences')
    } finally {
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('reads subject knowledge and writing boundaries through Memory without future facts', async () => {
    const { home, cwd } = await makeHome('memory-knowledge-read')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const first = resultPacket('memory-knowledge-r1', 0, '沈砚看见东墙的密门，陆星听到消息。')
      const state = { version: 1, subjectKind: 'character', beliefStatus: 'known', memoryStatus: 'retained', belief: '密门在东墙', truthAlignment: 'accurate', access: { mode: 'observed', unitId: 'chapter-1', viewpointId: 'shen', viewpointAccess: 'direct' }, revisionRationale: null }
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...first,
        deltas: [
          { id: 'door-r1', kind: 'canon', operation: 'set', targetId: 'secret-door', field: 'location', value: '东墙', sourceAnchorIds: [first.sourceAnchors[0].id] },
          { id: 'shen-knows-r1', kind: 'knowledge', operation: 'set', targetId: 'shen->secret-door', field: 'state', value: state, sourceAnchorIds: [first.sourceAnchors[0].id] },
          { id: 'lu-knows-r1', kind: 'knowledge', operation: 'set', targetId: 'lu->secret-door', field: 'state', value: { ...state, access: { ...state.access, mode: 'told', viewpointId: 'lu' } }, sourceAnchorIds: [first.sourceAnchors[0].id] },
        ],
      })
      const second = resultPacket('memory-knowledge-r2', 1, '沈砚发现 R2 新密门位于西墙。')
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...second,
        deltas: [
          { id: 'door-r2', kind: 'canon', operation: 'set', targetId: 'secret-door', field: 'location', value: 'R2 西墙', sourceAnchorIds: [second.sourceAnchors[0].id] },
          { id: 'shen-knows-r2', kind: 'knowledge', operation: 'set', targetId: 'shen->secret-door', field: 'state', value: { ...state, version: 2, belief: 'R2 西墙', revisionRationale: '重新确认位置' }, sourceAnchorIds: [second.sourceAnchors[0].id] },
        ],
      })
      const before = await readFile(join(home, 'storages', 'novel_project.json'))
      const r1 = runtime.ctx.novelMemory.readKnowledgeBoundary(workspace.id, 1, 'shen')
      expect(r1).toMatchObject({ subjectId: 'shen', revision: 1, headRevision: 2, freshness: 'historical', entries: [{
        factId: 'secret-door',
        knowledgeFields: [{ fact: { targetId: 'shen->secret-door', sourceRevision: 1, value: { belief: '密门在东墙' } }, sourceRanges: [{ anchorId: first.sourceAnchors[0].id }] }],
        factFields: [{ fact: { value: '东墙', sourceRevision: 1 } }],
      }] })
      expect(JSON.stringify(r1)).not.toContain('R2 西墙')
      expect(runtime.ctx.novelMemory.readKnowledgeBoundary(workspace.id, 2, 'shen').entries[0]?.factFields[0]?.fact.value).toBe('R2 西墙')
      expect(runtime.ctx.novelMemory.readWritingContinuity(workspace.id, 1).knowledgeBoundaries.map(boundary => boundary.subjectId)).toEqual(['lu', 'shen'])
      expect(runtime.ctx.novelMemory.readWritingContinuity(workspace.id, 1).knowledgeBoundaries[0])
        .toMatchObject({ revision: 1, headRevision: 2, freshness: 'historical' })
      expect(await readFile(join(home, 'storages', 'novel_project.json'))).toEqual(before)
      await runtime.ctx.novelProject.rollback(workspace.id, rollbackCommand('memory-knowledge', 2, 1))
      expect(runtime.ctx.novelMemory.readKnowledgeBoundary(workspace.id, 3, 'shen').entries).toEqual(r1.entries)
    } finally {
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('publishes retrieval and index tools only while Memory is installed', async () => {
    const { home } = await makeHome('memory-tool-ownership')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const names = ['retrieve_novel_context', 'rebuild_novel_index']
    try {
      for (const name of names) expect(runtime.ctx.tools.schemas().find(tool => tool.name === name)).toBeUndefined()
      const memory = await runtime.ctx.plugin(NovelMemory)
      try {
        for (const name of names) expect(runtime.ctx.tools.schemas().find(tool => tool.name === name)?.name).toBe(name)
      } finally {
        await memory.dispose()
      }
      for (const name of names) expect(runtime.ctx.tools.schemas().find(tool => tool.name === name)).toBeUndefined()
    } finally {
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('parses domain drafts through Canon extension validation without accepting them', async () => {
    const { home, cwd } = await makeHome('canon-parse-domain-draft')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const unregister = runtime.ctx.novelProject.registerExtension({ namespace: 'test/import', valueSchema: z.object({ note: z.string().min(1) }) })
      try {
        const { authorization: _authorization, ...base } = resultPacket('domain-draft', 0, '待作者接受的导入正文。')
        const draft = { ...base, deltas: [{ id: 'import-note', kind: 'extension', namespace: 'test/import', operation: 'set', targetId: 'chapter-1', field: 'note', value: { note: '导入说明' }, sourceAnchorIds: [base.sourceAnchors[0].id] }] }
        const before = await readFile(join(home, 'storages', 'novel_project.json'))
        const parsed = runtime.ctx.novelProject.parseDraft(draft)
        expect(parsed).toEqual(draft)
        expect(Object.isFrozen(parsed)).toBe(true)
        expect(parsed).not.toHaveProperty('authorization')
        expect(() => runtime.ctx.novelProject.parseDraft({ ...draft, deltas: [{ ...draft.deltas[0], value: { note: '' } }] })).toThrow()
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(0)
        expect(await readFile(join(home, 'storages', 'novel_project.json'))).toEqual(before)
      } finally {
        unregister()
      }
    } finally {
      await runtime.dispose()
    }
  })

  it('publishes import and publication tools only while Writing is installed', async () => {
    const { home } = await makeHome('writing-io-ownership')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const names = ['propose_novel_import', 'publish_novel_manuscript']
    try {
      for (const name of names) expect(runtime.ctx.tools.schemas().find(tool => tool.name === name)).toBeUndefined()
      const writing = await runtime.ctx.plugin(NovelWriting)
      try {
        for (const name of names) expect(runtime.ctx.tools.schemas().find(tool => tool.name === name)?.name).toBe(name)
      } finally {
        await writing.dispose()
      }
      for (const name of names) expect(runtime.ctx.tools.schemas().find(tool => tool.name === name)).toBeUndefined()
    } finally {
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('publishes bounded Write authorization only while Writing is installed', async () => {
    const { home } = await makeHome('writing-automation-ownership')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const name = 'authorize_novel_automation'
    try {
      expect(runtime.ctx.tools.schemas().find(tool => tool.name === name)).toBeUndefined()
      const writing = await runtime.ctx.plugin(NovelWriting)
      try {
        expect(runtime.ctx.tools.schemas().find(tool => tool.name === name)?.name).toBe(name)
      } finally {
        await writing.dispose()
      }
      expect(runtime.ctx.tools.schemas().find(tool => tool.name === name)).toBeUndefined()
    } finally {
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('reads accepted manuscripts through Writing without leaking later or rolled-back text', async () => {
    const { home, cwd } = await makeHome('writing-manuscript-read')
    const runtime = await boot(home)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      expect(runtime.ctx.novelWriting.readManuscripts(workspace.id, 0)).toEqual([])
      await runtime.ctx.novelProject.accept(workspace.id, resultPacket('writing-read-r1', 0, 'R1 正文'))
      await runtime.ctx.novelProject.accept(workspace.id, resultPacket('writing-read-r2', 1, 'R2 修订正文'))
      const storagePath = join(home, 'storages', 'novel_project.json')
      const beforeRead = await readFile(storagePath)
      expect(runtime.ctx.novelWriting.readManuscripts(workspace.id, 1))
        .toMatchObject([{ sourceRevision: 1, manuscript: { unitId: 'chapter-1', text: 'R1 正文' } }])
      expect(runtime.ctx.novelWriting.readManuscripts(workspace.id, 2))
        .toMatchObject([{ sourceRevision: 2, manuscript: { text: 'R2 修订正文' } }])
      expect(await readFile(storagePath)).toEqual(beforeRead)
      await runtime.ctx.novelProject.rollback(workspace.id, rollbackCommand('writing-read', 2, 1))
      expect(runtime.ctx.novelWriting.readManuscripts(workspace.id, 3))
        .toMatchObject([{ sourceRevision: 1, manuscript: { text: 'R1 正文' } }])
    } finally {
      await writing.dispose()
      await planning.dispose()
      await skills.dispose()
      await runtime.dispose()
    }
  })

  it('previews Canon items without requiring a domain projector', async () => {
    const { home, cwd } = await makeHome('canon-only-preview')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const { authorization: _authorization, ...packet } = resultPacket('canon-preview', 0, 'Canon-only draft')
      const preview = runtime.ctx.novelProject.previewReview(workspace.id, {
        packet,
        decisions: [
          { itemType: 'manuscript', itemId: packet.manuscript.unitId, outcome: 'accept' },
          { itemType: 'delta', itemId: packet.deltas[0].id, outcome: 'accept' },
        ],
      })
      expect(preview).toMatchObject({ expectedRevision: 0, projectedRevision: 1 })
      expect(preview.impact.manuscripts.added).toHaveLength(1)
      expect(preview.impact.canonFacts.added).toHaveLength(1)
      expect(preview.impact).not.toHaveProperty('narrativeUnits')
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(0)
    } finally {
      await runtime.dispose()
    }
  })

  it('accepts Canon revisions with a read-only domain projector that has no validation hook', async () => {
    const { home, cwd } = await makeHome('read-only-projector')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const unregister = runtime.ctx.novelProject.registerProjector('test/read-only', {
        project: snapshot => snapshot.revisions.map(source => ({
          revision: source.revision,
          text: source.manuscript?.text,
        })),
      })
      try {
        await runtime.ctx.novelProject.accept(workspace.id, resultPacket('read-only-r1', 0, 'R1 正文'))
        expect(runtime.ctx.novelProject.readProjection('test/read-only', workspace.id, 1))
          .toEqual([{ revision: 1, text: 'R1 正文' }])
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(1)
      } finally {
        unregister()
      }
    } finally {
      await runtime.dispose()
    }
  })

  it('gives registered domain projectors only active revision sources and runs their preview and apply validation', async () => {
    const { home, cwd } = await makeHome('domain-projector')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const unregister = runtime.ctx.novelProject.registerProjector('test/accepted-sources', {
        project(snapshot) {
          expect(Object.isFrozen(snapshot)).toBe(true)
          expect(snapshot.revisions.every(Object.isFrozen)).toBe(true)
          return {
            revision: snapshot.revision,
            sourceRevisions: snapshot.revisions.map(source => source.revision),
            manuscripts: snapshot.revisions.map(source => source.manuscript?.text),
          }
        },
        validate(_before, candidate) {
          if (candidate.revisions.at(-1)?.manuscript?.text === 'rejected by domain') {
            throw new Error('domain contract rejected the candidate')
          }
        },
      })
      try {
        expect(runtime.ctx.novelProject.readProjection('test/accepted-sources', workspace.id, 0))
          .toEqual({ revision: 0, sourceRevisions: [], manuscripts: [] })
        await runtime.ctx.novelProject.accept(workspace.id, resultPacket('domain-1', 0, 'R1 accepted'))
        await runtime.ctx.novelProject.accept(workspace.id, resultPacket('domain-2', 1, 'R2 accepted'))
        await runtime.ctx.novelProject.accept(workspace.id, resultPacket('domain-3', 2, 'R3 discarded'))
        expect(runtime.ctx.novelProject.readProjection('test/accepted-sources', workspace.id, 2))
          .toEqual({ revision: 2, sourceRevisions: [1, 2], manuscripts: ['R1 accepted', 'R2 accepted'] })
        await runtime.ctx.novelProject.rollback(workspace.id, rollbackCommand('domain', 3, 2))
        expect(runtime.ctx.novelProject.readProjection('test/accepted-sources', workspace.id, 4))
          .toEqual({ revision: 4, sourceRevisions: [1, 2], manuscripts: ['R1 accepted', 'R2 accepted'] })
        expect(runtime.ctx.novelProject.readProjection('test/accepted-sources', workspace.id, 3))
          .toEqual({ revision: 3, sourceRevisions: [1, 2, 3], manuscripts: ['R1 accepted', 'R2 accepted', 'R3 discarded'] })

        const rejected = resultPacket('domain-rejected', 4, 'rejected by domain')
        const { authorization: _authorization, ...draft } = rejected
        const before = await readFile(join(home, 'storages', 'novel_project.json'))
        expect(() => runtime.ctx.novelProject.previewReview(workspace.id, {
          packet: draft,
          decisions: [
            { itemType: 'manuscript', itemId: draft.manuscript.unitId, outcome: 'accept' },
            { itemType: 'delta', itemId: draft.deltas[0].id, outcome: 'accept' },
          ],
        })).toThrow('domain contract rejected the candidate')
        await expect(runtime.ctx.novelProject.accept(workspace.id, rejected))
          .rejects.toThrow('domain contract rejected the candidate')
        expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(4)
        expect(await readFile(join(home, 'storages', 'novel_project.json'))).toEqual(before)
      } finally {
        unregister()
      }
      expect(() => runtime.ctx.novelProject.readProjection('test/accepted-sources', workspace.id, 4)).toThrow()
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(4)
    } finally {
      await runtime.dispose()
    }
  })

  it('waits for Planning before publishing the writer and withdraws it when Planning unloads', async () => {
    const { home, cwd } = await makeHome('writing-planning-lifetime')
    const runtime = await boot(home)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const writing = runtime.ctx.plugin(NovelWriting)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      expect((await runtime.ctx.skills.get('novel-prose-writer', { cwd }))?.name).toBeUndefined()

      const planning = await runtime.ctx.plugin(NovelPlanning)
      try {
        await writing
        expect(await runtime.ctx.skills.get('novel-prose-writer', { cwd }))
          .toMatchObject({ source: '@novel-agent/novel-writing' })
      } finally {
        await planning.dispose()
      }
      expect((await runtime.ctx.skills.get('novel-prose-writer', { cwd }))?.name).toBeUndefined()
      expect(runtime.ctx.novelProject.current(workspace.id)).toMatchObject({ acceptedRevision: 0 })
    } finally {
      await writing.dispose()
      await skills.dispose()
      await runtime.dispose()
    }
  })

  it('requires Canon for Planning skills and withdraws them with the Planning plugin', async () => {
    const names = ['novel-architect', 'novel-hook-payoff-planner', 'novel-world-character-setting']
    const isolated = new Context()
    const isolatedSkills = await isolated.plugin(SkillRegistry)
    const pendingPlanning = isolated.plugin(NovelPlanning)
    try {
      for (const name of names) {
        expect((await isolated.skills.get(name))?.name).toBeUndefined()
      }
    } finally {
      await pendingPlanning.dispose()
      await isolatedSkills.dispose()
    }

    const { home, cwd } = await makeHome('planning-skill-lifetime')
    const runtime = await boot(home)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const planning = await runtime.ctx.plugin(NovelPlanning)
      try {
        for (const name of names) {
          expect(await runtime.ctx.skills.get(name, { cwd }))
            .toMatchObject({ name, source: '@novel-agent/novel-planning' })
        }
        expect(runtime.ctx.novelProject.readProjection('planning/narrative', workspace.id, 0))
          .toMatchObject({ revision: 0, units: [] })
      } finally {
        await planning.dispose()
      }
      for (const name of names) {
        expect((await runtime.ctx.skills.get(name, { cwd }))?.name).toBeUndefined()
      }
      expect(() => runtime.ctx.novelProject.readProjection('planning/narrative', workspace.id, 0)).toThrow()
      expect(runtime.ctx.novelProject.current(workspace.id)).toMatchObject({ acceptedRevision: 0 })
    } finally {
      await skills.dispose()
      await runtime.dispose()
    }
  })

  it('does not publish domain role skills from the Canon core', async () => {
    const { home, cwd } = await makeHome('planning-skill-boundary')
    const runtime = await boot(home)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    try {
      for (const name of [
        'novel-architect', 'novel-hook-payoff-planner', 'novel-world-character-setting', 'novel-prose-writer',
        'novel-continuity-checker', 'novel-writing-memory-organizer', 'novel-reviewer', 'novel-researcher',
      ]) {
        expect((await runtime.ctx.skills.get(name, { cwd }))?.name).toBeUndefined()
      }
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await expect(runtime.ctx.novelProject.open(workspace)).resolves.toMatchObject({ acceptedRevision: 0 })
    } finally {
      await skills.dispose()
      await runtime.dispose()
    }
  })

  it('ships as a self-mounting DSH plugin without a product Profile wrapper', async () => {
    const packageRoot = new URL('../', import.meta.url)
    const manifest = JSON.parse(await readFile(new URL('package.json', packageRoot), 'utf8')) as {
      readonly dsh?: {
        readonly bundle?: { readonly patch?: string }
        readonly client?: { readonly platform?: string }
      }
      readonly files?: readonly string[]
    }
    const patch = await readFile(new URL('cordis.patch.yml', packageRoot), 'utf8')

    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(manifest.dsh?.client?.platform).toBe('web')
    expect(manifest.files).toContain('cordis.patch.yml')
    expect(patch).toContain("id: novel-project")
    expect(patch).toContain("name: '@novel-agent/novel-project'")
    expect(patch).not.toContain('dsh-better-sidebar')
    expect(patch).not.toContain('desktop-profile')
  })

  it('composes domain-owned authoring prompts and withdraws them with their native dependencies', async () => {
    const { home } = await makeHome('authoring-stages')
    const runtime = await boot(home)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    const review = await runtime.ctx.plugin(NovelReview)
    try {
      const assembly = await runtime.ctx.systemPrompt.assemble()
      const sections = assembly.sections.filter(section => section.name.startsWith('novel:'))
      expect(sections.map(section => section.name)).toEqual([
        'novel:canon', 'novel:memory', 'novel:planning', 'novel:writing', 'novel:review',
      ])
      const section = { text: sections.map(section => section.text).join('\n\n') }
      expect(sections.find(section => section.name === 'novel:planning')?.text).toContain('Project setup:')
      expect(sections.find(section => section.name === 'novel:writing')?.text).toContain('Bounded Write automation:')
      expect(sections.find(section => section.name === 'novel:memory')?.text).toContain('Chapter control pack')
      expect(sections.find(section => section.name === 'novel:review')?.text).toContain('Review: proposal only')

      expect(section?.text).toContain('Ask: read only')
      expect(section?.text).toContain('Plan: proposal only')
      expect(section?.text).toContain('Write: draft only')
      expect(section?.text).toContain('Review: proposal only')
      expect(section?.text).toContain('Accept: author decision')
      expect(section?.text).toContain('Publish: separate authorization')
      expect(section?.text).toContain('planning intent as `writingMemoryQuery`')
      expect(section?.text).toContain('drafting intent as `writingMemoryQuery`')
      expect(section?.text).toContain('mandatory authoring contracts')
      expect(section?.text).toContain('intent-ranked rolling roadmaps')
      expect(section?.text).toContain('query-independent character carry-forward')
      expect(section?.text).toContain('query-independent character arc hypotheses')
      expect(section?.text)
        .toContain("When `chapterId` is included, use the Chapter control pack's complete character arc hypotheses")
      expect(section?.text).toContain('query-independent latest reader disclosure carry-forward')
      expect(section?.text).toContain('query-independent latest Chapter outcome carry-forward')
      expect(section?.text).toContain('query-independent relationship carry-forward')
      expect(section?.text).toContain('query-independent knowledge boundaries')
      expect(section?.text).toContain('stock `workflow` tool')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('memory-grounded Write')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('accepted authoring contracts')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('intent-ranked rolling roadmaps')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('query-independent character carry-forward')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('query-independent character arc hypotheses')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('Chapter control pack includes complete character arc hypotheses')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('query-independent latest reader disclosure carry-forward')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('query-independent latest Chapter outcome carry-forward')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('query-independent relationship carry-forward')
      expect(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')?.description)
        .toContain('query-independent knowledge boundaries')
      expect(JSON.stringify(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')))
        .toContain('latest accepted post-Chapter reader disclosure')
      expect(JSON.stringify(runtime.ctx.tools.schemas().find(schema => schema.name === 'retrieve_novel_context')))
        .toContain('latest accepted post-Chapter outcome')
      expect(runtime.ctx.tools.schemas().filter(schema => schema.name === 'workflow')).toEqual([])
      await planning.dispose()
      await writing.await()
      await memory.await()
      await review.await()
      expect((await runtime.ctx.systemPrompt.assemble()).sections
        .filter(section => section.name.startsWith('novel:')).map(section => section.name))
        .toEqual(['novel:canon'])
    } finally {
      await review.dispose()
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await skills.dispose()
      await runtime.dispose()
    }
  })

  it('opens one revision-zero project for a real DSH Workspace id and cwd', async () => {
    const { home, cwd } = await makeHome('open')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      const first = await runtime.ctx.novelProject.open(workspace)
      const repeated = await runtime.ctx.novelProject.open(workspace)

      expect(first).toEqual({
        id: expect.any(String),
        workspaceId: workspace.id,
        cwd: workspace.path,
        acceptedRevision: 0,
        canonLocks: [],
      })
      expect(repeated).toEqual(first)
    } finally {
      await runtime.dispose()
    }
  })

  it('accepts two Cordis-registered Canon extensions with their own schemas and restores their revision on rollback', async () => {
    const { home, cwd } = await makeHome('canon-extensions')
    const runtime = await boot(home)
    try {
      await runtime.ctx.inject(['novelProject'], ctx => ctx.novelProject.registerExtension({
        namespace: 'planning/project-brief',
        valueSchema: z.object({ title: z.string() }).strict(),
      }))
      await runtime.ctx.inject(['novelProject'], ctx => ctx.novelProject.registerExtension({
        namespace: 'writing/chapter-state',
        valueSchema: z.object({ state: z.string() }).strict(),
      }))
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const source = resultPacket('extension-source', 0, '雾港夜航：第七码头')
      const packet = {
        packetId: 'extension-brief-r1',
        expectedRevision: 0,
        deltas: [{
          id: 'extension-brief',
          kind: 'extension',
          namespace: 'planning/project-brief',
          operation: 'set',
          targetId: 'project',
          field: 'content',
          value: { title: '雾港夜航：第七码头' },
          sourceAnchorIds: [source.sourceAnchors[0].id],
        }, {
          id: 'extension-writing-state',
          kind: 'extension',
          namespace: 'writing/chapter-state',
          operation: 'set',
          targetId: 'project',
          field: 'content',
          value: { state: 'planned' },
          sourceAnchorIds: [source.sourceAnchors[0].id],
        }],
        issues: [],
        sourceAnchors: source.sourceAnchors,
        provenance: source.provenance,
      } as const
      const decisions = packet.deltas.map(delta => ({
        itemType: 'delta' as const,
        itemId: delta.id,
        outcome: 'accept' as const,
      }))
      const preview = runtime.ctx.novelProject.previewReview(workspace.id, { packet, decisions })
      expect(preview.impact.canonFacts.added).toHaveLength(2)
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(0)

      const accepted = await runtime.ctx.novelProject.review(workspace.id, {
        packet: { ...packet, authorization: source.authorization },
        decisions,
      })
      expect(accepted.deltas).toEqual(packet.deltas)
      expect(runtime.ctx.novelProject.projectManuscripts(workspace.id, 1)).toEqual([])
      const first = runtime.ctx.novelProject.projectCanon(workspace.id, 1)
      expect(first.facts).toEqual(packet.deltas.map(delta => ({
        kind: delta.namespace,
        targetId: 'project',
        field: 'content',
        value: delta.value,
        sourceRevision: 1,
        sourceDeltaId: delta.id,
        sourceAnchorIds: delta.sourceAnchorIds,
        provenance: source.provenance,
      })))
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)?.sourceAnchors)
        .toEqual(source.sourceAnchors)

      const update = {
        ...packet,
        packetId: 'extension-state-r2',
        expectedRevision: 1,
        deltas: [{ ...packet.deltas[1], value: { state: 'drafting' } }],
      }
      const updateDecisions = [decisions[1]!]
      const invalid = { ...update, deltas: [{ ...update.deltas[0]!, value: { title: 'wrong schema' } }] }
      expect(() => runtime.ctx.novelProject.previewReview(workspace.id, {
        packet: invalid, decisions: updateDecisions,
      })).toThrow(z.ZodError)
      await expect(runtime.ctx.novelProject.review(workspace.id, {
        packet: { ...invalid, authorization: source.authorization },
        decisions: updateDecisions,
      })).rejects.toMatchObject({
        issues: expect.arrayContaining([expect.objectContaining({ path: ['state'] })]),
      })
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(1)

      await runtime.ctx.novelProject.review(workspace.id, {
        packet: { ...update, authorization: source.authorization },
        decisions: updateDecisions,
      })
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2).facts)
        .toMatchObject([{ value: { title: '雾港夜航：第七码头' } }, { value: { state: 'drafting' } }])
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 1)).toEqual(first)
      await runtime.ctx.novelProject.rollback(workspace.id, rollbackCommand('extensions-r1', 2, 1))
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 3).facts).toEqual(first.facts)
    } finally {
      await runtime.dispose()
    }
  })

  it('requires a live extension registration for both set and remove after its Cordis plugin unloads', async () => {
    const { home, cwd } = await makeHome('extension-unload')
    const runtime = await boot(home)
    try {
      const extension = await runtime.ctx.inject(['novelProject'], ctx => ctx.novelProject.registerExtension({
        namespace: 'planning/project-brief', valueSchema: z.string(),
      }))
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const source = resultPacket('extension-unload-r1', 0, '雾港夜航：第七码头')
      const delta = {
        id: 'brief-title', kind: 'extension', namespace: 'planning/project-brief',
        operation: 'set', targetId: 'project', field: 'title', value: '雾港夜航：第七码头',
        sourceAnchorIds: [source.sourceAnchors[0].id],
      } as const
      await runtime.ctx.novelProject.accept(workspace.id, { ...source, deltas: [delta] })
      const before = runtime.ctx.novelProject.projectCanon(workspace.id, 1)
      await extension.dispose()
      for (const [operation, value] of [['set', 'changed'], ['remove', null]] as const) {
        await expect(runtime.ctx.novelProject.accept(workspace.id, {
          ...source, packetId: 'unloaded-extension-change', expectedRevision: 1,
          deltas: [{ ...delta, operation, value }],
        })).rejects.toThrow()
      }
      expect(runtime.ctx.novelProject.current(workspace.id)?.acceptedRevision).toBe(1)
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 1)).toEqual(before)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)?.deltas).toEqual([delta])
    } finally {
      await runtime.dispose()
    }
  })

  it('publishes accepted and rolled-back Canon facts from core mutations through the source DSH Session', async () => {
    const { home, cwd } = await makeHome('canon-session-events')
    const runtime = await boot(home)
    try {
      const session = runtime.ctx.sessions.create(SessionId('canon-event-source'), { meta: { cwd } })
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      const project = await runtime.ctx.novelProject.open(workspace)
      const first = resultPacket('event-r1', 0, '林砚开始夜班。')
      const second = resultPacket('event-r2', 1, '林砚发现第七码头。')
      const observed: unknown[] = []
      runtime.ctx.on('session/event', (source, event) => {
        if (source.id === session.id && event.type.startsWith('novel/canon/')) {
          observed.push({ type: event.type, data: event.data })
        }
      })
      await runtime.ctx.novelProject.accept(workspace.id, {
        ...first, provenance: { ...first.provenance, sessionId: session.id },
      })
      await runtime.ctx.novelProject.review(workspace.id, {
        packet: { ...second, provenance: { ...second.provenance, sessionId: session.id } },
        decisions: [
          { itemType: 'manuscript', itemId: 'chapter-1', outcome: 'accept' },
          { itemType: 'delta', itemId: 'delta-event-r2', outcome: 'accept' },
        ],
      })
      const rollback = rollbackCommand('events-r1', 2, 1)
      await runtime.ctx.novelProject.rollback(workspace.id, {
        ...rollback, provenance: { ...rollback.provenance, sessionId: session.id },
      })
      const expected = [
        { type: 'novel/canon/accepted', data: {
          projectId: project.id, revision: 1, deltaRefs: ['delta-event-r1'], sourceSessionId: session.id,
        } },
        { type: 'novel/canon/accepted', data: {
          projectId: project.id, revision: 2, deltaRefs: ['delta-event-r2'], sourceSessionId: session.id,
        } },
        { type: 'novel/canon/rolled-back', data: {
          projectId: project.id, revision: 3, deltaRefs: ['delta-event-r1'], sourceSessionId: session.id,
        } },
      ]
      expect(observed).toEqual(expected)
      expect(session.snapshotEvents().filter(event => event.type.startsWith('novel/canon/'))
        .map(event => ({ type: event.type, data: event.data }))).toEqual(expected)
      const replay = runtime.ctx.sessions.create(SessionId('canon-event-replay'), { seed: session.snapshotEvents() })
      expect(replay.snapshotEvents().filter(event => event.type.startsWith('novel/canon/'))
        .map(event => ({ type: event.type, data: event.data }))).toEqual(expected)
    } finally {
      await runtime.dispose()
    }
  })

  it('restores the same project identity and accepted revision from the same DSH home', async () => {
    const { home, cwd } = await makeHome('restart')
    const firstRuntime = await boot(home)
    let created: Awaited<ReturnType<typeof firstRuntime.ctx.novelProject.open>>
    try {
      const workspace = await firstRuntime.ctx.workspaceRegistry.create(cwd)
      created = await firstRuntime.ctx.novelProject.open(workspace)
    } finally {
      await firstRuntime.dispose()
    }

    const secondRuntime = await boot(home)
    try {
      const workspace = await secondRuntime.ctx.workspaceRegistry.create(cwd)
      const restored = await secondRuntime.ctx.novelProject.open(workspace)
      expect(restored).toEqual(created)
      expect(restored.acceptedRevision).toBe(0)
    } finally {
      await secondRuntime.dispose()
    }
  })

  it('keeps one authored proposal in the project inbox until the author accepts it', async () => {
    const { home, cwd } = await makeHome('proposal-inbox-accept')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const session = runtime.ctx.sessions.get(SessionId('fixture-canon'))!
      const packet = resultPacket('inbox-accept', 0, '她把铜钥匙放回灯座，潮声从门缝里退了下去。')
      const { authorization: _authorization, ...draft } = packet
      const proposed = await runtime.ctx.tools.execute({
        callId: 'proposal-inbox-accept' as never,
        name: 'propose_novel_result_packet',
        arguments: { packet: draft },
        agent: { id: SessionId('fixture-canon'), session } as never,
        signal: new AbortController().signal,
      })
      expect(proposed).toMatchObject({ isError: false })

      const inbox = runtime.ctx.novelProject.pendingProposals(workspace.id)
      expect(inbox).toMatchObject([{
        packetId: 'packet-inbox-accept',
        producer: 'writer',
        packet: {
          manuscript: { text: '她把铜钥匙放回灯座，潮声从门缝里退了下去。' },
        },
      }])
      expect(inbox[0]?.receivedAt).toBeGreaterThan(0)
      expect(await readFile(join(home, 'storages', 'novel_project.json'), 'utf8'))
        .toContain('她把铜钥匙放回灯座')

      await runtime.ctx.novelProject.accept(workspace.id, packet)
      expect(runtime.ctx.novelProject.pendingProposals(workspace.id)).toEqual([])
    } finally {
      await runtime.dispose()
    }
  })

  it('restores pending proposals from storage and lets the author discard one', async () => {
    const { home, cwd } = await makeHome('proposal-inbox-durable')
    const firstRuntime = await boot(home)
    try {
      const workspace = await firstRuntime.ctx.workspaceRegistry.create(cwd)
      await firstRuntime.ctx.novelProject.open(workspace)
      const session = firstRuntime.ctx.sessions.get(SessionId('fixture-canon'))!
      const { authorization: _authorization, ...draft } = resultPacket('inbox-durable', 0, '灯影里有人先到了。')
      const proposed = await firstRuntime.ctx.tools.execute({
        callId: 'proposal-inbox-durable' as never,
        name: 'propose_novel_result_packet',
        arguments: { packet: draft },
        agent: { id: SessionId('fixture-canon'), session } as never,
        signal: new AbortController().signal,
      })
      expect(proposed).toMatchObject({ isError: false })
    } finally {
      await firstRuntime.dispose()
    }

    const secondRuntime = await boot(home)
    try {
      const workspace = await secondRuntime.ctx.workspaceRegistry.create(cwd)
      await secondRuntime.ctx.novelProject.open(workspace)
      expect(secondRuntime.ctx.novelProject.pendingProposals(workspace.id))
        .toMatchObject([{ packetId: 'packet-inbox-durable' }])
      await expect(secondRuntime.ctx.novelProject.discardProposal(workspace.id, 'packet-inbox-durable'))
        .resolves.toEqual([])
      expect(secondRuntime.ctx.novelProject.pendingProposals(workspace.id)).toEqual([])
    } finally {
      await secondRuntime.dispose()
    }
  })

  it('opens a stored project record that predates the proposal inbox', async () => {
    const { home, cwd } = await makeHome('proposal-inbox-legacy')
    const firstRuntime = await boot(home)
    try {
      const workspace = await firstRuntime.ctx.workspaceRegistry.create(cwd)
      await firstRuntime.ctx.novelProject.open(workspace)
      const session = firstRuntime.ctx.sessions.get(SessionId('fixture-canon'))!
      const { authorization: _authorization, ...draft } = resultPacket('inbox-legacy', 0, '旧记录兼容。')
      await firstRuntime.ctx.tools.execute({
        callId: 'proposal-inbox-legacy' as never,
        name: 'propose_novel_result_packet',
        arguments: { packet: draft },
        agent: { id: SessionId('fixture-canon'), session } as never,
        signal: new AbortController().signal,
      })
    } finally {
      await firstRuntime.dispose()
    }

    const storagePath = join(home, 'storages', 'novel_project.json')
    const stored = JSON.parse(await readFile(storagePath, 'utf8')) as unknown
    const dropInbox = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(dropInbox)
      if (value === null || typeof value !== 'object') return value
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== 'pendingProposals')
        .map(([key, child]) => [key, dropInbox(child)] as const)
      return Object.fromEntries(entries)
    }
    await writeFile(storagePath, JSON.stringify(dropInbox(stored), null, 2), 'utf8')

    const secondRuntime = await boot(home)
    try {
      const workspace = await secondRuntime.ctx.workspaceRegistry.create(cwd)
      await expect(secondRuntime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 0 })
      expect(secondRuntime.ctx.novelProject.pendingProposals(workspace.id)).toEqual([])
    } finally {
      await secondRuntime.dispose()
    }
  })

  it('atomically accepts manuscript, typed Canon delta, provenance and authorization at the expected revision', async () => {
    const { home, cwd } = await makeHome('accept')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const packet = resultPacket('first', 0, '她推开门，看见雪落满旧庭。')

      const accepted = await runtime.ctx.novelProject.accept(workspace.id, packet)

      expect(accepted).toEqual({
        revision: 1,
        parentRevision: 0,
        packetId: packet.packetId,
        manuscript: packet.manuscript,
        deltas: packet.deltas,
        issues: packet.issues,
        decisions: [{
          itemType: 'manuscript',
          itemId: packet.manuscript.unitId,
          outcome: 'accept',
        }, {
          itemType: 'delta',
          itemId: packet.deltas[0].id,
          outcome: 'accept',
        }],
        sourceAnchors: packet.sourceAnchors,
        provenance: packet.provenance,
        authorization: packet.authorization,
      })
      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
    } finally {
      await runtime.dispose()
    }
  })

  it('projects the accepted creative profile, reader contract and core novel state as source-bearing entities', async () => {
    const { home, cwd } = await makeHome('domain-state')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const base = resultPacket('domain-state-r1', 0, '沈砚踏雪归城，第一次看见林照留下的铜钥匙。')
      const sourceAnchorIds = [base.sourceAnchors[0].id]
      const deltas = [
        {
          id: 'profile-genre-r1',
          kind: 'creative-profile',
          operation: 'set',
          targetId: 'project',
          field: 'genreMix',
          value: '东方玄幻 / 悬疑',
          sourceAnchorIds,
        },
        {
          id: 'profile-audience-r1',
          kind: 'creative-profile',
          operation: 'set',
          targetId: 'project',
          field: 'audience',
          value: '中文长篇网文读者',
          sourceAnchorIds,
        },
        {
          id: 'contract-experience-r1',
          kind: 'reader-contract',
          operation: 'set',
          targetId: 'project',
          field: 'coreExperience',
          value: '追查旧案时兑现成长与关系承诺',
          sourceAnchorIds,
        },
        {
          id: 'event-time-r1',
          kind: 'story-event',
          operation: 'set',
          targetId: 'event-return',
          field: 'storyTime',
          value: '第一卷第一日夜',
          sourceAnchorIds,
        },
        {
          id: 'event-change-r1',
          kind: 'story-event',
          operation: 'set',
          targetId: 'event-return',
          field: 'change',
          value: '沈砚取得铜钥匙',
          sourceAnchorIds,
        },
        {
          id: 'character-goal-r1',
          kind: 'character-state',
          operation: 'set',
          targetId: 'shen-yan',
          field: 'goal',
          value: '查清旧案',
          sourceAnchorIds,
        },
        {
          id: 'emotion-felt-r1',
          kind: 'emotion-state',
          operation: 'set',
          targetId: 'shen-yan@event-return',
          field: 'felt',
          value: '警惕中夹着愧疚',
          sourceAnchorIds,
        },
        {
          id: 'relationship-trust-r1',
          kind: 'relationship',
          operation: 'set',
          targetId: 'shen-yan->lin-zhao',
          field: 'trust',
          value: '尚未恢复',
          sourceAnchorIds,
        },
        {
          id: 'promise-status-r1',
          kind: 'promise',
          operation: 'set',
          targetId: 'promise-old-case',
          field: 'status',
          value: 'setup',
          sourceAnchorIds,
        },
        {
          id: 'clue-visibility-r1',
          kind: 'clue',
          operation: 'set',
          targetId: 'clue-copper-key',
          field: 'readerVisibility',
          value: 'visible',
          sourceAnchorIds,
        },
        {
          id: 'timeline-order-r1',
          kind: 'timeline',
          operation: 'set',
          targetId: 'event-return',
          field: 'order',
          value: 1,
          sourceAnchorIds,
        },
      ] as const

      await runtime.ctx.novelProject.accept(workspace.id, {
        ...base,
        deltas,
      })

      const projection = runtime.ctx.novelProject.projectCanon(workspace.id, 1)
      expect(projection.entities.map(entity => `${entity.kind}:${entity.targetId}`)).toEqual([
        'character-state:shen-yan',
        'clue:clue-copper-key',
        'creative-profile:project',
        'emotion-state:shen-yan@event-return',
        'promise:promise-old-case',
        'reader-contract:project',
        'relationship:shen-yan->lin-zhao',
        'story-event:event-return',
        'timeline:event-return',
      ])
      expect(projection.entities.find(entity => entity.kind === 'creative-profile'))
        .toMatchObject({
          fields: {
            audience: '中文长篇网文读者',
            genreMix: '东方玄幻 / 悬疑',
          },
          fieldSources: {
            audience: {
              sourceRevision: 1,
              sourceDeltaId: 'profile-audience-r1',
              sourceAnchorIds,
              provenance: base.provenance,
            },
            genreMix: {
              sourceRevision: 1,
              sourceDeltaId: 'profile-genre-r1',
              sourceAnchorIds,
              provenance: base.provenance,
            },
          },
        })
      expect(projection.entities.find(entity => entity.kind === 'story-event'))
        .toMatchObject({
          fields: {
            change: '沈砚取得铜钥匙',
            storyTime: '第一卷第一日夜',
          },
          sourceRevision: 1,
          sourceDeltaId: 'event-time-r1',
          sourceAnchorIds,
          provenance: base.provenance,
        })
      expect(projection.entities.every(Object.isFrozen)).toBe(true)
    } finally {
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('accepts a Canon-only project brief before the first manuscript', async () => {
    const { home, cwd } = await makeHome('project-brief')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const brief = {
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
          sessionId: 'fixture-canon',
          producer: 'writer',
        },
        authorization: {
          kind: 'author',
          actorId: 'author-1',
          decisionId: 'decision-project-brief',
        },
      } as const

      const acceptedBrief = await runtime.ctx.novelProject.accept(workspace.id, brief)

      expect(acceptedBrief).not.toHaveProperty('manuscript')
      expect(runtime.ctx.novelProject.projectManuscripts(workspace.id, 1)).toEqual([])
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 1).entities)
        .toMatchObject([{
          kind: 'creative-profile',
          targetId: 'project',
          fields: { genreMix: '东方玄幻 / 悬疑' },
        }, {
          kind: 'reader-contract',
          targetId: 'project',
          fields: { coreExperience: '追查旧案时兑现成长与关系承诺' },
        }])

      await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('project-brief-r2', 1, '沈砚踏雪归城。'),
      )

      expect(runtime.ctx.novelProject.projectManuscripts(workspace.id, 2))
        .toMatchObject([{ manuscript: { unitId: 'chapter-1', text: '沈砚踏雪归城。' } }])
      expect(runtime.ctx.novelProject.projectCanon(workspace.id, 2).entities)
        .toEqual(expect.arrayContaining([
          expect.objectContaining({ kind: 'creative-profile', targetId: 'project' }),
          expect.objectContaining({ kind: 'reader-contract', targetId: 'project' }),
        ]))
    } finally {
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('asks the stock DSH subagent for anchored issues and returns an unauthorised review draft without changing Canon', async () => {
    const { home, cwd } = await makeHome('review-draft')
    const disposeRun = vi.fn(async () => {})
    const start = vi.fn(async () => ({
      id: 'session-review-child',
      localAgent: undefined,
      result: Promise.resolve({
        output: [],
        structured: {
          revisedText: '她解开门闩，推开门，看见雪落满旧庭。',
          issues: [{
            dimension: 'continuity',
            severity: 'major',
            problem: 'The door is described as locked before the protagonist opens it.',
            suggestion: 'Explain how the lock was released.',
            quote: '她推开门',
          }],
        },
        stopReason: 'completed',
      }),
      dispose: disposeRun,
    }))
    const runtime = await boot(home, { start })
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const review = await runtime.ctx.plugin(NovelReview)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const parentAgent = {
        id: 'session-review-parent',
        session: { id: 'session-review-parent' },
      } as never
      const signal = new AbortController().signal
      const sourcePacket = resultPacket('review-source', 0, '她推开门，看见雪落满旧庭。')
      const sourceAnchorId = sourcePacket.sourceAnchors[0].id
      const accepted = await runtime.ctx.novelProject.accept(workspace.id, {
        ...sourcePacket,
        deltas: [
          ...sourcePacket.deltas,
          {
            id: 'review-memory-scope',
            kind: 'narrative-unit',
            operation: 'set',
            targetId: 'chapter-1',
            field: 'unit',
            value: {
              level: 'book',
              parentId: null,
              order: 0,
              objective: '查清旧庭门闩的开启者',
              entryState: '旧庭封闭',
              exitState: '门闩开启',
              status: 'active',
            },
            sourceAnchorIds: [sourceAnchorId],
          },
          {
            id: 'review-setting-memory',
            kind: 'location-state',
            operation: 'set',
            targetId: 'old-court',
            field: 'gate',
            value: '旧庭门闩必须从内侧解开',
            sourceAnchorIds: [sourceAnchorId],
          },
          {
            id: 'review-debt-memory',
            kind: 'narrative-debt',
            operation: 'set',
            targetId: 'debt-old-court-gate',
            unitId: 'chapter-1',
            field: 'mystery',
            value: {
              summary: '解释是谁从旧庭内侧解开门闩',
              status: 'open',
              horizon: 'chapter-3',
            },
            sourceAnchorIds: [sourceAnchorId],
          },
        ],
      })

      const draft = await runtime.ctx.novelReview.reviewDraft(parentAgent, workspace.id, {
        revision: 1,
        unitId: 'chapter-1',
        focus: '旧庭',
      }, signal)

      expect(draft).toMatchObject({
        packetId: expect.any(String),
        expectedRevision: 1,
        manuscript: {
          ...accepted.manuscript!,
          text: '她解开门闩，推开门，看见雪落满旧庭。',
        },
        manuscriptDiff: {
          format: 'unified',
          text: expect.stringContaining('@@'),
        },
        deltas: [],
        issues: [{
          id: expect.any(String),
          dimension: 'continuity',
          severity: 'major',
          problem: 'The door is described as locked before the protagonist opens it.',
          suggestion: 'Explain how the lock was released.',
          sourceAnchorIds: [expect.any(String)],
        }],
        sourceAnchors: [{
          id: expect.any(String),
          sourceId: accepted.manuscript!.unitId,
          start: 0,
          end: 4,
          contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }],
        provenance: {
          taskId: expect.any(String),
          sessionId: 'session-review-parent',
          producer: 'novel-reviewer-subagent',
        },
      })
      expect(draft.manuscriptDiff!.text).toContain('-她推开门，看见雪落满旧庭。')
      expect(draft.manuscriptDiff!.text).toContain('+她解开门闩，推开门，看见雪落满旧庭。')
      expect(draft).not.toHaveProperty('authorization')
      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
      expect(start).toHaveBeenCalledWith('spawn', expect.objectContaining({
        parent: parentAgent,
        signal,
        outputSchema: expect.objectContaining({
          required: ['revisedText', 'issues'],
          properties: expect.objectContaining({
            revisedText: { type: 'string' },
          }),
        }),
      }))
      const [, startOptions] = start.mock.calls[0] as unknown as readonly [unknown, {
        readonly prompt: readonly [{ readonly type: 'text'; readonly text: string }]
      }]
      const promptPayload = JSON.parse(
        startOptions.prompt[0].text.slice(startOptions.prompt[0].text.lastIndexOf('\n\n') + 2),
      ) as {
        readonly writingMemory?: unknown
      }
      expect(promptPayload.writingMemory).toMatchObject({
        query: '旧庭',
        manuscriptExcerpts: [expect.objectContaining({
          unitId: 'chapter-1',
          score: expect.any(Number),
          terms: expect.arrayContaining(['旧庭']),
          sourceRevision: 1,
          sourceRanges: expect.arrayContaining([expect.objectContaining({ sourceId: 'chapter-1' })]),
          provenance: accepted.provenance,
        })],
        settingFacts: [expect.objectContaining({
          score: expect.any(Number),
          terms: expect.arrayContaining(['旧庭']),
          sourceRevision: 1,
          sourceRanges: [expect.objectContaining({ anchorId: sourceAnchorId })],
          provenance: accepted.provenance,
          fact: expect.objectContaining({ sourceDeltaId: 'review-setting-memory' }),
        })],
        continuityHits: [expect.objectContaining({
          kind: 'canon-fact',
          score: expect.any(Number),
          terms: expect.arrayContaining(['旧庭']),
          sourceRevision: 1,
          sourceRanges: [expect.objectContaining({ anchorId: sourceAnchorId })],
          provenance: accepted.provenance,
          fact: expect.objectContaining({ sourceDeltaId: 'delta-review-source' }),
        })],
        debts: [expect.objectContaining({
          score: expect.any(Number),
          terms: expect.arrayContaining(['旧庭']),
          sourceRevision: 1,
          sourceRanges: [expect.objectContaining({ anchorId: sourceAnchorId })],
          provenance: accepted.provenance,
          debt: expect.objectContaining({ sourceDeltaId: 'review-debt-memory' }),
        })],
      })
      expect(disposeRun).toHaveBeenCalledOnce()
    } finally {
      await review.dispose()
      await skills.dispose()
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('rejects an ambiguous review quote instead of anchoring the first duplicate occurrence', async () => {
    const { home, cwd } = await makeHome('review-duplicate-quote')
    const disposeRun = vi.fn(async () => {})
    const start = vi.fn(async () => ({
      id: 'session-review-duplicate-child',
      localAgent: undefined,
      result: Promise.resolve({
        output: [],
        structured: {
          revisedText: '她慢慢推开门。她再次推开门。',
          issues: [{
            dimension: 'continuity',
            severity: 'major',
            problem: 'The repeated action needs a precise location.',
            suggestion: 'Anchor the exact occurrence under review.',
            quote: '她推开门',
          }],
        },
        stopReason: 'completed',
      }),
      dispose: disposeRun,
    }))
    const runtime = await boot(home, { start })
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const review = await runtime.ctx.plugin(NovelReview)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('review-duplicate-source', 0, '她推开门。她推开门。'),
      )

      await expect(runtime.ctx.novelReview.reviewDraft({
        id: 'session-review-duplicate-parent',
        session: { id: 'session-review-duplicate-parent' },
      } as never, workspace.id, { revision: 1, unitId: 'chapter-1' }, new AbortController().signal))
        .rejects.toThrow('quote was not unique in accepted manuscript R1')

      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
      expect(disposeRun).toHaveBeenCalledOnce()
    } finally {
      await review.dispose()
      await skills.dispose()
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('rejects a non-completed review result with its diagnostic and disposes the run', async () => {
    const { home, cwd } = await makeHome('review-non-completed')
    const disposeRun = vi.fn(async () => {})
    const start = vi.fn(async () => ({
      id: 'session-review-error-child',
      localAgent: undefined,
      result: Promise.resolve({
        output: [],
        diagnostic: 'provider failed to produce a review',
        stopReason: 'error',
      }),
      dispose: disposeRun,
    }))
    const runtime = await boot(home, { start })
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const review = await runtime.ctx.plugin(NovelReview)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const accepted = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('review-non-completed-source', 0, '她推开门，看见雪落满旧庭。'),
      )

      await expect(runtime.ctx.novelReview.reviewDraft({
        id: 'session-review-error-parent',
        session: { id: 'session-review-error-parent' },
      } as never, workspace.id, { revision: 1, unitId: 'chapter-1' }, new AbortController().signal))
        .rejects.toThrow(
          'novel review subagent ended with error: provider failed to produce a review',
        )

      expect(disposeRun).toHaveBeenCalledOnce()
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
    } finally {
      await review.dispose()
      await skills.dispose()
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('rejects a completed review without structured output and disposes the run', async () => {
    const { home, cwd } = await makeHome('review-missing-structured')
    const disposeRun = vi.fn(async () => {})
    const start = vi.fn(async () => ({
      id: 'session-review-missing-structured-child',
      localAgent: undefined,
      result: Promise.resolve({
        output: [],
        stopReason: 'completed',
      }),
      dispose: disposeRun,
    }))
    const runtime = await boot(home, { start })
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const review = await runtime.ctx.plugin(NovelReview)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const accepted = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('review-missing-structured-source', 0, '她推开门，看见雪落满旧庭。'),
      )

      await expect(runtime.ctx.novelReview.reviewDraft({
        id: 'session-review-missing-structured-parent',
        session: { id: 'session-review-missing-structured-parent' },
      } as never, workspace.id, { revision: 1, unitId: 'chapter-1' }, new AbortController().signal))
        .rejects.toThrow('novel review subagent completed without structured output')

      expect(disposeRun).toHaveBeenCalledOnce()
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
    } finally {
      await review.dispose()
      await skills.dispose()
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('propagates an AbortError-shaped review run rejection and still disposes the run', async () => {
    const { home, cwd } = await makeHome('review-run-cancelled')
    const cancellation = Object.assign(new Error('review cancelled by caller'), {
      name: 'AbortError',
    })
    const disposeRun = vi.fn(async () => {})
    const start = vi.fn(async () => ({
      id: 'session-review-cancelled-child',
      localAgent: undefined,
      result: Promise.reject(cancellation),
      dispose: disposeRun,
    }))
    const runtime = await boot(home, { start })
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const review = await runtime.ctx.plugin(NovelReview)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const accepted = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('review-run-cancelled-source', 0, '她推开门，看见雪落满旧庭。'),
      )

      await expect(runtime.ctx.novelReview.reviewDraft({
        id: 'session-review-cancelled-parent',
        session: { id: 'session-review-cancelled-parent' },
      } as never, workspace.id, { revision: 1, unitId: 'chapter-1' }, new AbortController().signal))
        .rejects.toBe(cancellation)

      expect(disposeRun).toHaveBeenCalledOnce()
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
    } finally {
      await review.dispose()
      await skills.dispose()
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('rejects a review quote that is absent from the accepted manuscript', async () => {
    const { home, cwd } = await makeHome('review-missing-quote')
    const disposeRun = vi.fn(async () => {})
    const start = vi.fn(async () => ({
      id: 'session-review-missing-quote-child',
      localAgent: undefined,
      result: Promise.resolve({
        output: [],
        structured: {
          revisedText: '她解开门闩，推开门，看见雪落满旧庭。',
          issues: [{
            dimension: 'continuity',
            severity: 'major',
            problem: 'The generated issue points outside the accepted manuscript.',
            suggestion: 'Anchor the issue to exact accepted text.',
            quote: '不存在的句子',
          }],
        },
        stopReason: 'completed',
      }),
      dispose: disposeRun,
    }))
    const runtime = await boot(home, { start })
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const review = await runtime.ctx.plugin(NovelReview)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const accepted = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('review-missing-quote-source', 0, '她推开门，看见雪落满旧庭。'),
      )

      await expect(runtime.ctx.novelReview.reviewDraft({
        id: 'session-review-missing-quote-parent',
        session: { id: 'session-review-missing-quote-parent' },
      } as never, workspace.id, { revision: 1, unitId: 'chapter-1' }, new AbortController().signal))
        .rejects.toThrow('quote was not found in accepted manuscript R1')

      expect(disposeRun).toHaveBeenCalledOnce()
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
    } finally {
      await review.dispose()
      await skills.dispose()
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('rejects a review draft when the accepted revision advances while its subagent runs', async () => {
    const { home, cwd } = await makeHome('review-revision-advanced')
    const disposeRun = vi.fn(async () => {})
    let completeReview!: (result: {
      output: never[]
      structured: {
        revisedText: string
        issues: Array<{
          dimension: string
          severity: 'major'
          problem: string
          suggestion: string
          quote: string
        }>
      }
      stopReason: 'completed'
    }) => void
    const result = new Promise<Parameters<typeof completeReview>[0]>((resolve) => {
      completeReview = resolve
    })
    const start = vi.fn(async () => ({
      id: 'session-review-revision-advanced-child',
      localAgent: undefined,
      result,
      dispose: disposeRun,
    }))
    const runtime = await boot(home, { start })
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const review = await runtime.ctx.plugin(NovelReview)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const first = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('review-revision-advanced-r1', 0, '她推开门，看见雪落满旧庭。'),
      )
      const pendingReview = runtime.ctx.novelReview.reviewDraft({
        id: 'session-review-revision-advanced-parent',
        session: { id: 'session-review-revision-advanced-parent' },
      } as never, workspace.id, { revision: 1, unitId: 'chapter-1' }, new AbortController().signal)
      expect(start).toHaveBeenCalledOnce()

      const second = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('review-revision-advanced-r2', 1, '她关上门，转身走入风雪。'),
      )
      completeReview({
        output: [],
        structured: {
          revisedText: '她解开门闩，推开门，看见雪落满旧庭。',
          issues: [{
            dimension: 'continuity',
            severity: 'major',
            problem: 'The first revision needs a clearer threshold transition.',
            suggestion: 'Clarify the transition in the first revision.',
            quote: '她推开门',
          }],
        },
        stopReason: 'completed',
      })

      await expect(pendingReview).rejects.toMatchObject({
        code: 'revision-conflict',
        expectedRevision: 1,
        actualRevision: 2,
      })
      expect(disposeRun).toHaveBeenCalledOnce()
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(first)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toEqual(second)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 3)).toBeUndefined()
    } finally {
      await review.dispose()
      await skills.dispose()
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('rejects a review draft whose revised manuscript is unchanged and disposes the run', async () => {
    const { home, cwd } = await makeHome('review-unchanged-rewrite')
    const manuscript = '她推开门，看见雪落满旧庭。'
    const disposeRun = vi.fn(async () => {})
    const start = vi.fn(async () => ({
      id: 'session-review-unchanged-child',
      localAgent: undefined,
      result: Promise.resolve({
        output: [],
        structured: {
          revisedText: manuscript,
          issues: [],
        },
        stopReason: 'completed',
      }),
      dispose: disposeRun,
    }))
    const runtime = await boot(home, { start })
    const planning = await runtime.ctx.plugin(NovelPlanning)
    const writing = await runtime.ctx.plugin(NovelWriting)
    const memory = await runtime.ctx.plugin(NovelMemory)
    const skills = await runtime.ctx.plugin(SkillRegistry)
    const review = await runtime.ctx.plugin(NovelReview)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const accepted = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('review-unchanged-source', 0, manuscript),
      )

      await expect(runtime.ctx.novelReview.reviewDraft({
        id: 'session-review-unchanged-parent',
        session: { id: 'session-review-unchanged-parent' },
      } as never, workspace.id, { revision: 1, unitId: 'chapter-1' }, new AbortController().signal))
        .rejects.toThrow('revisedText did not change accepted manuscript R1')

      expect(disposeRun).toHaveBeenCalledOnce()
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
    } finally {
      await review.dispose()
      await skills.dispose()
      await memory.dispose()
      await writing.dispose()
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('atomically accepts anchored issues and restores them after a fresh DSH Host boot', async () => {
    const { home, cwd } = await makeHome('anchored-issues-restart')
    const firstRuntime = await boot(home)
    const packet = {
      ...resultPacket('anchored-issues', 0, '她推开门，看见雪落满旧庭。'),
      issues: [{
        id: 'issue-anchored-continuity',
        dimension: 'continuity',
        severity: 'major',
        problem: '门外积雪与上一场景的暴雨天气冲突。',
        suggestion: '补充降温转雪的故事时间过渡。',
        sourceAnchorIds: ['anchor-anchored-issues'],
      }],
    } as const
    try {
      const workspace = await firstRuntime.ctx.workspaceRegistry.create(cwd)
      await firstRuntime.ctx.novelProject.open(workspace)

      const accepted = await firstRuntime.ctx.novelProject.accept(workspace.id, packet)

      expect(accepted).toMatchObject({
        revision: 1,
        issues: packet.issues,
      })
    } finally {
      await firstRuntime.dispose()
    }

    const secondRuntime = await boot(home)
    try {
      const workspace = await secondRuntime.ctx.workspaceRegistry.create(cwd)
      await expect(secondRuntime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
      expect(secondRuntime.ctx.novelProject.readRevision(workspace.id, 1)).toMatchObject({
        revision: 1,
        issues: packet.issues,
      })
    } finally {
      await secondRuntime.dispose()
    }
  })

  it('reviews mixed Delta and Issue decisions in packet order and restores them after restart', async () => {
    const { home, cwd } = await makeHome('mixed-review-restart')
    const firstRuntime = await boot(home)
    const firstPlanning = await firstRuntime.ctx.plugin(NovelPlanning)
    const base = resultPacket('mixed-review', 0, '她推门而入，旧庭积雪未化。')
    const packet = {
      ...base,
      deltas: [
        base.deltas[0],
        {
          id: 'delta-mixed-review-rejected',
          kind: 'relationship',
          operation: 'set',
          targetId: 'lead-pair',
          field: 'status',
          value: '盟友',
          sourceAnchorIds: ['anchor-mixed-review'],
        },
      ],
      issues: [
        {
          id: 'issue-mixed-review-accepted',
          dimension: 'continuity',
          severity: 'major',
          problem: '积雪状态需要与上一场衔接。',
          suggestion: '补充降温转雪的时间过渡。',
          sourceAnchorIds: ['anchor-mixed-review'],
        },
        {
          id: 'issue-mixed-review-rejected',
          dimension: 'pacing',
          severity: 'minor',
          problem: '入场动作可能过快。',
          suggestion: '增加一拍观察。',
          sourceAnchorIds: ['anchor-mixed-review'],
        },
      ],
    } as const
    const command = {
      packet,
      decisions: [
        {
          itemType: 'manuscript',
          itemId: packet.manuscript.unitId,
          outcome: 'accept',
        },
        {
          itemType: 'issue',
          itemId: 'issue-mixed-review-rejected',
          outcome: 'reject',
          reason: '作者保留当前节奏。',
        },
        {
          itemType: 'delta',
          itemId: base.deltas[0].id,
          outcome: 'accept',
        },
        {
          itemType: 'issue',
          itemId: 'issue-mixed-review-accepted',
          outcome: 'accept',
        },
        {
          itemType: 'delta',
          itemId: 'delta-mixed-review-rejected',
          outcome: 'reject',
          reason: '关系变化尚未发生。',
        },
      ],
    } as const
    const normalizedDecisions = [
      command.decisions[0],
      command.decisions[2],
      command.decisions[4],
      command.decisions[3],
      command.decisions[1],
    ]
    let accepted: Awaited<ReturnType<typeof firstRuntime.ctx.novelProject.review>>
    try {
      const workspace = await firstRuntime.ctx.workspaceRegistry.create(cwd)
      await firstRuntime.ctx.novelProject.open(workspace)

      accepted = await firstRuntime.ctx.novelProject.review(workspace.id, command)

      expect(accepted).toMatchObject({
        revision: 1,
        packetId: packet.packetId,
        deltas: [packet.deltas[0]],
        issues: packet.issues,
        decisions: normalizedDecisions,
      })
      expect(firstRuntime.ctx.novelProject.projectCanon(workspace.id, 1).facts)
        .toEqual([
          expect.objectContaining({
            sourceDeltaId: packet.deltas[0].id,
            value: packet.manuscript.text,
          }),
        ])
    } finally {
      await firstPlanning.dispose()
      await firstRuntime.dispose()
    }

    const secondRuntime = await boot(home)
    try {
      const workspace = await secondRuntime.ctx.workspaceRegistry.create(cwd)
      await expect(secondRuntime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
      expect(secondRuntime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
    } finally {
      await secondRuntime.dispose()
    }
  })

  it('rejects duplicate Delta and Issue ids without advancing the head', async () => {
    const { home, cwd } = await makeHome('duplicate-review-item-id')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const base = resultPacket('duplicate-review-item-id', 0, '待审正文')
      const issue = {
        id: 'issue-duplicate-review-item-id',
        dimension: 'continuity',
        severity: 'major',
        problem: '重复 Issue ID。',
        suggestion: '保留唯一 ID。',
        sourceAnchorIds: ['anchor-duplicate-review-item-id'],
      } as const
      const cases = [
        {
          name: 'Delta',
          command: {
            packet: {
              ...base,
              deltas: [base.deltas[0], { ...base.deltas[0], targetId: 'duplicate-target' }],
            },
            decisions: [{
              itemType: 'delta',
              itemId: base.deltas[0].id,
              outcome: 'accept',
            }],
          },
          path: ['packet', 'deltas', 1, 'id'],
        },
        {
          name: 'Issue',
          command: {
            packet: { ...base, issues: [issue, { ...issue, dimension: 'pacing' }] },
            decisions: [
              {
                itemType: 'delta',
                itemId: base.deltas[0].id,
                outcome: 'accept',
              },
              {
                itemType: 'issue',
                itemId: issue.id,
                outcome: 'reject',
              },
            ],
          },
          path: ['packet', 'issues', 1, 'id'],
        },
      ] as const

      for (const testCase of cases) {
        await expect(
          runtime.ctx.novelProject.review(workspace.id, testCase.command),
          `duplicate ${testCase.name} id`,
        ).rejects.toMatchObject({
          issues: expect.arrayContaining([
            expect.objectContaining({ path: testCase.path }),
          ]),
        })
        await expect(runtime.ctx.novelProject.open(workspace))
          .resolves.toMatchObject({ acceptedRevision: 0 })
      }
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects missing, duplicate and unknown review decisions without advancing the head', async () => {
    const { home, cwd } = await makeHome('invalid-review-decisions')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const base = resultPacket('invalid-review-decisions', 0, '待审正文')
      const issue = {
        id: 'issue-invalid-review-decisions',
        dimension: 'continuity',
        severity: 'major',
        problem: '待作者审阅。',
        suggestion: '确认或拒绝。',
        sourceAnchorIds: ['anchor-invalid-review-decisions'],
      } as const
      const deltaDecision = {
        itemType: 'delta',
        itemId: base.deltas[0].id,
        outcome: 'accept',
      } as const
      const cases = [
        {
          name: 'missing Delta',
          command: { packet: base, decisions: [] },
          path: ['packet', 'deltas', 0, 'id'],
        },
        {
          name: 'missing Issue',
          command: {
            packet: { ...base, issues: [issue] },
            decisions: [deltaDecision],
          },
          path: ['packet', 'issues', 0, 'id'],
        },
        {
          name: 'duplicate decision',
          command: { packet: base, decisions: [deltaDecision, deltaDecision] },
          path: ['decisions', 1, 'itemId'],
        },
        {
          name: 'unknown Delta',
          command: {
            packet: base,
            decisions: [
              deltaDecision,
              { itemType: 'delta', itemId: 'delta-unknown', outcome: 'reject' },
            ],
          },
          path: ['decisions', 1, 'itemId'],
        },
        {
          name: 'unknown Issue',
          command: {
            packet: base,
            decisions: [
              deltaDecision,
              { itemType: 'issue', itemId: 'issue-unknown', outcome: 'reject' },
            ],
          },
          path: ['decisions', 1, 'itemId'],
        },
      ] as const

      for (const testCase of cases) {
        await expect(
          runtime.ctx.novelProject.review(workspace.id, testCase.command),
          testCase.name,
        ).rejects.toMatchObject({
          issues: expect.arrayContaining([
            expect.objectContaining({ path: testCase.path }),
          ]),
        })
        await expect(runtime.ctx.novelProject.open(workspace))
          .resolves.toMatchObject({ acceptedRevision: 0 })
      }
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects a manuscript review when Delta and Issue decisions omit the manuscript decision', async () => {
    const { home, cwd } = await makeHome('missing-manuscript-review-decision')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const base = resultPacket('missing-manuscript-review-decision', 0, '待审正文')
      const issue = {
        id: 'issue-missing-manuscript-review-decision',
        dimension: 'continuity',
        severity: 'major',
        problem: '作者还没有决定是否接受改写正文。',
        suggestion: '先接受或拒绝正文，再应用其他决定。',
        sourceAnchorIds: [base.sourceAnchors[0].id],
      } as const
      const packet = { ...base, issues: [issue] } as const

      await expect(runtime.ctx.novelProject.review(workspace.id, {
        packet,
        decisions: [{
          itemType: 'delta',
          itemId: packet.deltas[0].id,
          outcome: 'accept',
        }, {
          itemType: 'issue',
          itemId: issue.id,
          outcome: 'accept',
        }],
      })).rejects.toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: ['packet', 'manuscript', 'unitId'],
            message: "missing manuscript decision for 'chapter-1'",
          }),
        ]),
      })
      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 0 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects a stale review without changing the accepted head', async () => {
    const { home, cwd } = await makeHome('stale-review')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const accepted = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('stale-review-accepted', 0, '已接受正文'),
      )
      const packet = resultPacket('stale-review-rejected', 0, '不应接受的正文')

      await expect(runtime.ctx.novelProject.review(workspace.id, {
        packet,
        decisions: [{
          itemType: 'manuscript',
          itemId: packet.manuscript.unitId,
          outcome: 'accept',
        }, {
          itemType: 'delta',
          itemId: packet.deltas[0].id,
          outcome: 'reject',
          reason: '该审阅基于过期版本。',
        }],
      })).rejects.toMatchObject({
        code: 'revision-conflict',
        expectedRevision: 0,
        actualRevision: 1,
      })

      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects an Issue that references an unknown SourceAnchor without advancing the head', async () => {
    const { home, cwd } = await makeHome('unknown-issue-anchor')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const packet = {
        ...resultPacket('unknown-issue-anchor', 0, '待审正文'),
        issues: [{
          id: 'issue-unknown-anchor',
          dimension: 'continuity',
          severity: 'major',
          problem: '问题引用了不存在的正文位置。',
          suggestion: '重新定位问题。',
          sourceAnchorIds: ['anchor-missing'],
        }],
      } as const

      await expect(runtime.ctx.novelProject.accept(workspace.id, packet))
        .rejects.toMatchObject({
          issues: expect.arrayContaining([
            expect.objectContaining({
              path: ['issues', 0, 'sourceAnchorIds', 0],
              message: expect.stringContaining('anchor-missing'),
            }),
          ]),
        })
      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 0 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects a Canon Delta that references an unknown SourceAnchor without advancing the head', async () => {
    const { home, cwd } = await makeHome('unknown-delta-anchor')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const base = resultPacket('unknown-delta-anchor', 0, '待审正文')
      const packet = {
        ...base,
        deltas: [{
          ...base.deltas[0],
          sourceAnchorIds: ['anchor-missing'],
        }],
      } as const

      await expect(runtime.ctx.novelProject.accept(workspace.id, packet))
        .rejects.toMatchObject({
          issues: expect.arrayContaining([
            expect.objectContaining({
              path: ['deltas', 0, 'sourceAnchorIds', 0],
              message: expect.stringContaining('anchor-missing'),
            }),
          ]),
        })
      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 0 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects duplicate SourceAnchor ids without advancing the head', async () => {
    const { home, cwd } = await makeHome('duplicate-anchor-id')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const base = resultPacket('duplicate-anchor-id', 0, '待审正文')
      const packet = {
        ...base,
        sourceAnchors: [
          ...base.sourceAnchors,
          {
            ...base.sourceAnchors[0],
            sourceId: 'duplicate-source',
          },
        ],
      } as const

      await expect(runtime.ctx.novelProject.accept(workspace.id, packet))
        .rejects.toMatchObject({
          issues: expect.arrayContaining([
            expect.objectContaining({
              path: ['sourceAnchors', 1, 'id'],
              message: expect.stringContaining('anchor-duplicate-anchor-id'),
            }),
          ]),
        })
      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 0 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects an incomplete Result Packet without accepting manuscript or Canon', async () => {
    const { home, cwd } = await makeHome('incomplete')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const incomplete: Record<string, unknown> = {
        ...resultPacket('incomplete', 0, '不完整正文'),
      }
      delete incomplete.deltas

      await expect(runtime.ctx.novelProject.accept(workspace.id, incomplete))
        .rejects.toBeDefined()
      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 0 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects a stale expected revision without changing manuscript or Canon', async () => {
    const { home, cwd } = await makeHome('stale')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const accepted = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('accepted', 0, '已接受正文'),
      )

      await expect(runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('stale', 0, '不应写入的正文'),
      )).rejects.toMatchObject({
        code: 'revision-conflict',
        expectedRevision: 0,
        actualRevision: 1,
      })

      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('serializes concurrent accepts so only one packet can win the same expected revision', async () => {
    const { home, cwd } = await makeHome('concurrent')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)

      const outcomes = await Promise.allSettled([
        runtime.ctx.novelProject.accept(workspace.id, resultPacket('left', 0, '左侧方案')),
        runtime.ctx.novelProject.accept(workspace.id, resultPacket('right', 0, '右侧方案')),
      ])
      const fulfilled = outcomes.filter(outcome => outcome.status === 'fulfilled')
      const rejected = outcomes.filter(outcome => outcome.status === 'rejected')

      expect(fulfilled).toHaveLength(1)
      expect(rejected).toHaveLength(1)
      expect(rejected[0]?.reason).toMatchObject({
        code: 'revision-conflict',
        expectedRevision: 0,
        actualRevision: 1,
      })
      const winner = runtime.ctx.novelProject.readRevision(workspace.id, 1)
      expect(winner).toEqual(fulfilled[0]?.value)
      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
    } finally {
      await runtime.dispose()
    }
  })

  it('restores the accepted manuscript and Canon aggregate after a fresh DSH Host boot', async () => {
    const { home, cwd } = await makeHome('accepted-restart')
    const firstRuntime = await boot(home)
    let accepted: unknown
    try {
      const workspace = await firstRuntime.ctx.workspaceRegistry.create(cwd)
      await firstRuntime.ctx.novelProject.open(workspace)
      accepted = await firstRuntime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('restart', 0, '跨重启正文'),
      )
    } finally {
      await firstRuntime.dispose()
    }

    const secondRuntime = await boot(home)
    try {
      const workspace = await secondRuntime.ctx.workspaceRegistry.create(cwd)
      await expect(secondRuntime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
      expect(secondRuntime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
    } finally {
      await secondRuntime.dispose()
    }
  })

  it('rolls back by creating a new durable revision while preserving prior history', async () => {
    const { home, cwd } = await makeHome('rollback')
    const firstRuntime = await boot(home)
    let firstAccepted: Awaited<ReturnType<typeof firstRuntime.ctx.novelProject.accept>>
    let secondAccepted: Awaited<ReturnType<typeof firstRuntime.ctx.novelProject.accept>>
    let rolledBack: Awaited<ReturnType<typeof firstRuntime.ctx.novelProject.rollback>>
    try {
      const workspace = await firstRuntime.ctx.workspaceRegistry.create(cwd)
      await firstRuntime.ctx.novelProject.open(workspace)
      const firstPacket = {
        ...resultPacket('rollback-first', 0, '第一版正文'),
        issues: [{
          id: 'issue-rollback-first',
          dimension: 'continuity',
          severity: 'major',
          problem: '第一版待确认的连续性问题。',
          suggestion: '按第一版锚点复核。',
          sourceAnchorIds: ['anchor-rollback-first'],
        }],
      } as const
      const secondPacket = {
        ...resultPacket('rollback-second', 1, '第二版正文'),
        issues: [{
          id: 'issue-rollback-second',
          dimension: 'pacing',
          severity: 'minor',
          problem: '第二版待确认的节奏问题。',
          suggestion: '按第二版锚点复核。',
          sourceAnchorIds: ['anchor-rollback-second'],
        }],
      } as const
      firstAccepted = await firstRuntime.ctx.novelProject.review(workspace.id, {
        packet: firstPacket,
        decisions: [
          {
            itemType: 'manuscript',
            itemId: firstPacket.manuscript.unitId,
            outcome: 'accept',
          },
          {
            itemType: 'delta',
            itemId: firstPacket.deltas[0].id,
            outcome: 'reject',
            reason: '第一版结构化变化暂不进入 Canon。',
          },
          {
            itemType: 'issue',
            itemId: firstPacket.issues[0].id,
            outcome: 'accept',
          },
        ],
      })
      secondAccepted = await firstRuntime.ctx.novelProject.accept(
        workspace.id,
        secondPacket,
      )
      const command = rollbackCommand('to-first', 2, 1)

      rolledBack = await firstRuntime.ctx.novelProject.rollback(workspace.id, command)

      expect(rolledBack).toEqual({
        revision: 3,
        parentRevision: 2,
        packetId: command.commandId,
        manuscript: firstAccepted.manuscript,
        deltas: firstAccepted.deltas,
        issues: firstAccepted.issues,
        decisions: firstAccepted.decisions,
        sourceAnchors: firstAccepted.sourceAnchors,
        provenance: command.provenance,
        authorization: command.authorization,
        rollbackOfRevision: 1,
      })
      expect(firstRuntime.ctx.novelProject.readRevision(workspace.id, 1))
        .toEqual(firstAccepted)
      expect(firstRuntime.ctx.novelProject.readRevision(workspace.id, 2))
        .toEqual(secondAccepted)
    } finally {
      await firstRuntime.dispose()
    }

    const secondRuntime = await boot(home)
    try {
      const workspace = await secondRuntime.ctx.workspaceRegistry.create(cwd)
      await expect(secondRuntime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 3 })
      expect(secondRuntime.ctx.novelProject.readRevision(workspace.id, 1))
        .toEqual(firstAccepted)
      expect(secondRuntime.ctx.novelProject.readRevision(workspace.id, 2))
        .toEqual(secondAccepted)
      expect(secondRuntime.ctx.novelProject.readRevision(workspace.id, 3))
        .toEqual(rolledBack)
    } finally {
      await secondRuntime.dispose()
    }
  })

  it('projects Canon at any accepted revision and restores the target projection on rollback', async () => {
    const { home, cwd } = await makeHome('canon-projection')
    const runtime = await boot(home)
    const planning = await runtime.ctx.plugin(NovelPlanning)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const firstPacket = {
        ...resultPacket('projection-first', 0, '第一版正文'),
        deltas: [
          {
            id: 'projection-character-first',
            kind: 'character-state',
            operation: 'set',
            targetId: 'character-lead',
            field: 'emotion',
            value: '警惕',
            sourceAnchorIds: ['anchor-projection-first'],
          },
          {
            id: 'projection-relationship-first',
            kind: 'relationship',
            operation: 'set',
            targetId: 'lead-pair',
            field: 'status',
            value: '盟友',
            sourceAnchorIds: ['anchor-projection-first'],
          },
          {
            id: 'projection-event-first',
            kind: 'story-event',
            operation: 'set',
            targetId: 'event-return',
            field: 'summary',
            value: '主角回到旧宅',
            sourceAnchorIds: ['anchor-projection-first'],
          },
        ],
      } as const
      const secondPacket = {
        ...resultPacket('projection-second', 1, '第二版正文'),
        deltas: [
          {
            id: 'projection-relationship-remove',
            kind: 'relationship',
            operation: 'remove',
            targetId: 'lead-pair',
            field: 'status',
            value: null,
            sourceAnchorIds: ['anchor-projection-second'],
          },
          {
            id: 'projection-event-second',
            kind: 'story-event',
            operation: 'set',
            targetId: 'event-return',
            field: 'summary',
            value: '主角发现旧宅已被占据',
            sourceAnchorIds: ['anchor-projection-second'],
          },
          {
            id: 'projection-promise-second',
            kind: 'promise',
            operation: 'set',
            targetId: 'promise-reclaim-home',
            field: 'due',
            value: 'chapter-3',
            sourceAnchorIds: ['anchor-projection-second'],
          },
        ],
      } as const

      await runtime.ctx.novelProject.accept(workspace.id, firstPacket)
      await runtime.ctx.novelProject.accept(workspace.id, secondPacket)

      const first = runtime.ctx.novelProject.projectCanon(workspace.id, 1)
      expect(first).toMatchObject({
        projectId: expect.any(String),
        workspaceId: workspace.id,
        revision: 1,
      })
      expect(first.facts.map(fact => ({
        kind: fact.kind,
        targetId: fact.targetId,
        field: fact.field,
        value: fact.value,
        sourceRevision: fact.sourceRevision,
      }))).toEqual([
        {
          kind: 'character-state',
          targetId: 'character-lead',
          field: 'emotion',
          value: '警惕',
          sourceRevision: 1,
        },
        {
          kind: 'relationship',
          targetId: 'lead-pair',
          field: 'status',
          value: '盟友',
          sourceRevision: 1,
        },
        {
          kind: 'story-event',
          targetId: 'event-return',
          field: 'summary',
          value: '主角回到旧宅',
          sourceRevision: 1,
        },
      ])

      const second = runtime.ctx.novelProject.projectCanon(workspace.id, 2)
      expect(second.facts.map(fact => ({
        kind: fact.kind,
        targetId: fact.targetId,
        field: fact.field,
        value: fact.value,
        sourceRevision: fact.sourceRevision,
      }))).toEqual([
        {
          kind: 'character-state',
          targetId: 'character-lead',
          field: 'emotion',
          value: '警惕',
          sourceRevision: 1,
        },
        {
          kind: 'promise',
          targetId: 'promise-reclaim-home',
          field: 'due',
          value: 'chapter-3',
          sourceRevision: 2,
        },
        {
          kind: 'story-event',
          targetId: 'event-return',
          field: 'summary',
          value: '主角发现旧宅已被占据',
          sourceRevision: 2,
        },
      ])

      await runtime.ctx.novelProject.rollback(
        workspace.id,
        rollbackCommand('projection-to-first', 2, 1),
      )
      const rolledBack = runtime.ctx.novelProject.projectCanon(workspace.id, 3)
      expect(rolledBack).toMatchObject({
        projectId: first.projectId,
        workspaceId: workspace.id,
        revision: 3,
      })
      expect(rolledBack.facts).toEqual(first.facts)
      expect(rolledBack.facts.every(Object.isFrozen)).toBe(true)
      expect(() => runtime.ctx.novelProject.projectCanon(workspace.id, 99))
        .toThrow(expect.objectContaining({ code: 'revision-not-found', revision: 99 }))
    } finally {
      await planning.dispose()
      await runtime.dispose()
    }
  })

  it('rejects a stale rollback without creating a new revision', async () => {
    const { home, cwd } = await makeHome('rollback-stale')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const accepted = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('rollback-stale-head', 0, '已接受正文'),
      )

      await expect(runtime.ctx.novelProject.rollback(
        workspace.id,
        rollbackCommand('stale', 0, 1),
      )).rejects.toMatchObject({
        code: 'revision-conflict',
        expectedRevision: 0,
        actualRevision: 1,
      })

      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('rejects an unknown rollback target without changing the accepted head', async () => {
    const { home, cwd } = await makeHome('rollback-missing')
    const runtime = await boot(home)
    try {
      const workspace = await runtime.ctx.workspaceRegistry.create(cwd)
      await runtime.ctx.novelProject.open(workspace)
      const accepted = await runtime.ctx.novelProject.accept(
        workspace.id,
        resultPacket('rollback-missing-head', 0, '已接受正文'),
      )

      await expect(runtime.ctx.novelProject.rollback(
        workspace.id,
        rollbackCommand('missing', 1, 99),
      )).rejects.toMatchObject({
        code: 'revision-not-found',
        revision: 99,
      })

      await expect(runtime.ctx.novelProject.open(workspace))
        .resolves.toMatchObject({ acceptedRevision: 1 })
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 1)).toEqual(accepted)
      expect(runtime.ctx.novelProject.readRevision(workspace.id, 2)).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })
})
