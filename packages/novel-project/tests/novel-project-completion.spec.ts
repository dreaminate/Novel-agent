import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'
import * as JsonStorage from '@deepseek-ai/dsh-storage-json'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import TokenMeter from '@deepseek-ai/dsh-token-meter'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import WorkspaceRegistry from '@deepseek-ai/dsh-workspace'
import { afterEach, describe, expect, it } from 'vitest'
import NovelProjectService from '../src/index.js'

const homes: string[] = []

afterEach(async () => {
  for (const home of homes.splice(0)) {
    await rm(home, { recursive: true, force: true })
  }
})

/** One chunk of a scripted model answer, in the shape `ctx.llm.stream` yields. */
type Chunk = { readonly type: 'text-delta'; readonly text: string }

/**
 * A boot whose model seam is a script the test owns.
 *
 * The real seam is a network call; these tests are about what the service does
 * with an answer — and with no answer at all — so the answer is data here.
 */
async function boot(name: string) {
  const home = await realpath(await mkdtemp(join(tmpdir(), `novel-completion-${name}-`)))
  homes.push(home)
  const cwd = join(home, 'workspace')
  await mkdir(cwd)

  const ctx = new Context()
  const calls: unknown[] = []
  let answer: () => Promise<Chunk[]> = async () => {
    throw new Error('unexpected model call')
  }
  const disposeSubagents = ctx.provide('subagents', {
    start: async () => { throw new Error('unexpected subagent start') },
  } as never)
  // Every other seam in this boot throws when touched, so a test that reaches
  // one fails loudly instead of quietly exercising something it did not mean to.
  const disposeFileSystem = ctx.provide('fs', {
    resolve: async () => { throw new Error('unexpected filesystem resolve') },
    writeText: async () => { throw new Error('unexpected filesystem write') },
  } as never)
  const disposeSandboxPolicy = ctx.provide('sandboxPolicy', {
    resolve: () => { throw new Error('unexpected sandbox policy resolve') },
  } as never)

  const sessions = await ctx.plugin(SessionStore)
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
  const workspaceRegistry = await ctx.plugin(WorkspaceRegistry)
  const typert = await ctx.plugin(TypertRegistry)
  const disposeLlm = ctx.provide('llm', {
    stream(options: unknown) {
      calls.push(options)
      return (async function* () {
        for (const chunk of await answer()) yield chunk
      })()
    },
  } as never)
  const projects = await ctx.plugin(NovelProjectService)

  const agentCtxFiber = ctx.plugin(() => {})
  /** Register a live agent at `agentCwd` so the service can resolve it by id. */
  function registerAgent(id: string, agentCwd: string, options: Record<string, unknown>) {
    const session = ctx.sessions.create(SessionId(id), { meta: { cwd: agentCwd } })
    const agent = {
      id,
      ctx: agentCtxFiber.ctx,
      status: 'idle',
      session,
      options,
    } as unknown as Agent
    ctx.agents.register(agent)
    return agent
  }

  const workspace = await ctx.workspaceRegistry.create(cwd)
  return {
    ctx,
    cwd,
    home,
    workspace,
    calls,
    registerAgent,
    script(next: () => Promise<Chunk[]>) {
      answer = next
    },
    async dispose() {
      await projects.dispose()
      disposeLlm()
      await typert.dispose()
      await workspaceRegistry.dispose()
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
      disposeSandboxPolicy()
      disposeFileSystem()
      disposeSubagents()
    },
  }
}

describe('NovelProjectService sentence continuation', () => {
  it('answers with the model continuation, without the trailing newline it padded with', async () => {
    const runtime = await boot('answer')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-answer', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [
        { type: 'text-delta', text: '他合上门，' },
        { type: 'text-delta', text: '没让风进来。\n' },
      ])

      await expect(runtime.ctx.novelProject.remoteCompleteSentence(
        agent.id,
        runtime.workspace.id,
        '他站在门口。',
        new AbortController().signal,
      )).resolves.toBe('他合上门，没让风进来。')
    } finally {
      await runtime.dispose()
    }
  })

  it('stays silent when the model fails, rather than surfacing an error mid-sentence', async () => {
    const runtime = await boot('fail')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-fail', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => { throw new Error('provider is unreachable') })

      await expect(runtime.ctx.novelProject.remoteCompleteSentence(
        agent.id,
        runtime.workspace.id,
        '他站在门口。',
        new AbortController().signal,
      )).resolves.toBe('')
    } finally {
      await runtime.dispose()
    }
  })

  it('asks nothing at all when the agent has no model route', async () => {
    const runtime = await boot('no-route')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-no-route', runtime.cwd, {})

      await expect(runtime.ctx.novelProject.remoteCompleteSentence(
        agent.id,
        runtime.workspace.id,
        '他站在门口。',
        new AbortController().signal,
      )).resolves.toBe('')
      expect(runtime.calls).toHaveLength(0)
    } finally {
      await runtime.dispose()
    }
  })

  it('refuses to ask on behalf of an agent that does not own the workspace', async () => {
    const runtime = await boot('foreign-workspace')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const outside = join(runtime.home, 'elsewhere')
      await mkdir(outside)
      const agent = runtime.registerAgent('fixture-outsider', outside, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [{ type: 'text-delta', text: '不该发生' }])

      await expect(runtime.ctx.novelProject.remoteCompleteSentence(
        agent.id,
        runtime.workspace.id,
        '他站在门口。',
        new AbortController().signal,
      )).rejects.toThrow(/does not own Workspace/u)
      expect(runtime.calls).toHaveLength(0)
    } finally {
      await runtime.dispose()
    }
  })

  it('carries only the tail of the draft, so a long chapter is not resent on every pause', async () => {
    const runtime = await boot('tail')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-tail', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [{ type: 'text-delta', text: '继续。' }])

      const before = `${'旧'.repeat(4000)}他站在门口。`
      await runtime.ctx.novelProject.remoteCompleteSentence(
        agent.id,
        runtime.workspace.id,
        before,
        new AbortController().signal,
      )

      const call = runtime.calls[0] as { readonly messages: readonly { readonly content: readonly { readonly text: string }[] }[] }
      const sent = call.messages[0]!.content[0]!.text
      expect(sent.length).toBeLessThan(before.length)
      expect(sent.endsWith('他站在门口。')).toBe(true)
    } finally {
      await runtime.dispose()
    }
  })

  it('gives the answer room to exist, which a tight budget on a reasoning route does not', async () => {
    // Measured against the real route this shipped on: `maxTokens: 80` and `256`
    // both came back with no text at all, because the route spends its budget
    // thinking before it emits a single text delta — and the author saw a feature
    // that never suggested anything. `stop` already ends generation at the first
    // newline, so the budget bounds thinking, not the sentence.
    const runtime = await boot('budget')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-budget', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [{ type: 'text-delta', text: '他合上门。' }])

      await runtime.ctx.novelProject.remoteCompleteSentence(
        agent.id,
        runtime.workspace.id,
        '他站在门口。',
        new AbortController().signal,
      )

      const call = runtime.calls[0] as { readonly maxTokens: number; readonly stop: readonly string[]; readonly tools?: unknown }
      expect(call.maxTokens).toBeGreaterThanOrEqual(1024)
      expect(call.stop).toEqual(['\n'])
      // No tools: this is a sentence, not a task.
      expect(call.tools).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('advances nothing: the project head is the same as before the request', async () => {
    const runtime = await boot('no-canon')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-no-canon', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [{ type: 'text-delta', text: '他合上门。' }])
      const before = runtime.ctx.novelProject.current(runtime.workspace.id)

      await runtime.ctx.novelProject.remoteCompleteSentence(
        agent.id,
        runtime.workspace.id,
        '他站在门口。',
        new AbortController().signal,
      )

      expect(runtime.ctx.novelProject.current(runtime.workspace.id)).toEqual(before)
      expect(runtime.ctx.novelProject.pendingProposals(runtime.workspace.id)).toHaveLength(0)
    } finally {
      await runtime.dispose()
    }
  })
})

/** The brief the host actually sent, as text. */
function briefOf(call: unknown): string {
  const messages = (call as { readonly messages: readonly { readonly content: readonly { readonly text: string }[] }[] }).messages
  return messages[0]!.content[0]!.text
}

describe('NovelProjectService paragraph continuation', () => {
  it('answers with the prose the model wrote, trimmed', async () => {
    const runtime = await boot('paragraph')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-paragraph', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [
        { type: 'text-delta', text: '\n门开了，' },
        { type: 'text-delta', text: '风灌进来。\n' },
      ])

      await expect(runtime.ctx.novelProject.remoteContinueWriting(
        agent.id,
        runtime.workspace.id,
        { inspiration: ['先写风声'], before: '他站在门口。' },
        new AbortController().signal,
      )).resolves.toEqual({ state: 'ok', text: '门开了，风灌进来。' })
    } finally {
      await runtime.dispose()
    }
  })

  it('sends the beats in the author order, numbered, ahead of the manuscript', async () => {
    const runtime = await boot('paragraph-brief')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-brief', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [{ type: 'text-delta', text: '门开了。' }])

      await runtime.ctx.novelProject.remoteContinueWriting(
        agent.id,
        runtime.workspace.id,
        { inspiration: ['先写风声', '再写脚步声'], before: '他站在门口。' },
        new AbortController().signal,
      )

      const brief = briefOf(runtime.calls[0])
      const first = brief.indexOf('1. 先写风声')
      const second = brief.indexOf('2. 再写脚步声')
      expect(first).toBeGreaterThan(-1)
      expect(second).toBeGreaterThan(first)
      expect(brief).toContain('他站在门口。')
      // The manuscript has to come after the beats, or the model has read the
      // instructions before it knows what it is continuing.
      expect(brief.indexOf('他站在门口。')).toBeGreaterThan(second)
    } finally {
      await runtime.dispose()
    }
  })

  it('reports a failing model instead of staying silent, because the author asked', async () => {
    const runtime = await boot('paragraph-fail')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-paragraph-fail', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => { throw new Error('provider is unreachable') })

      const answer = await runtime.ctx.novelProject.remoteContinueWriting(
        agent.id,
        runtime.workspace.id,
        { inspiration: [], before: '他站在门口。' },
        new AbortController().signal,
      )

      expect(answer.state).toBe('failed')
      // Nothing the author cannot act on: no provider string, no stack.
      expect(answer.state === 'failed' ? answer.message : '').not.toContain('unreachable')
    } finally {
      await runtime.dispose()
    }
  })

  it('treats an empty answer as a failure rather than as prose that happens to be blank', async () => {
    const runtime = await boot('paragraph-empty')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-paragraph-empty', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [{ type: 'text-delta', text: '   \n  ' }])

      const answer = await runtime.ctx.novelProject.remoteContinueWriting(
        agent.id,
        runtime.workspace.id,
        { inspiration: ['先写风声'], before: '他站在门口。' },
        new AbortController().signal,
      )

      expect(answer.state).toBe('failed')
    } finally {
      await runtime.dispose()
    }
  })

  it('asks nothing when the agent has no model route, and says why', async () => {
    const runtime = await boot('paragraph-no-route')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-paragraph-no-route', runtime.cwd, {})

      const answer = await runtime.ctx.novelProject.remoteContinueWriting(
        agent.id,
        runtime.workspace.id,
        { inspiration: [], before: '他站在门口。' },
        new AbortController().signal,
      )

      expect(answer).toEqual({ state: 'failed', message: '这条线程还没有可用的模型，先在输入框上选一个再续写。' })
      expect(runtime.calls).toHaveLength(0)
    } finally {
      await runtime.dispose()
    }
  })

  it('refuses to write for an agent that does not own the workspace', async () => {
    const runtime = await boot('paragraph-foreign')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const outside = join(runtime.home, 'elsewhere-paragraph')
      await mkdir(outside)
      const agent = runtime.registerAgent('fixture-paragraph-outsider', outside, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [{ type: 'text-delta', text: '不该发生' }])

      await expect(runtime.ctx.novelProject.remoteContinueWriting(
        agent.id,
        runtime.workspace.id,
        { inspiration: [], before: '他站在门口。' },
        new AbortController().signal,
      )).rejects.toThrow(/does not own Workspace/u)
      expect(runtime.calls).toHaveLength(0)
    } finally {
      await runtime.dispose()
    }
  })

  it('advances nothing: prose the author has not adopted cannot reach Canon', async () => {
    const runtime = await boot('paragraph-no-canon')
    try {
      await runtime.ctx.novelProject.open(runtime.workspace)
      const agent = runtime.registerAgent('fixture-paragraph-no-canon', runtime.cwd, {
        provider: 'fixture',
        model: 'scripted',
      })
      runtime.script(async () => [{ type: 'text-delta', text: '门开了，风灌进来。' }])
      const before = runtime.ctx.novelProject.current(runtime.workspace.id)

      await runtime.ctx.novelProject.remoteContinueWriting(
        agent.id,
        runtime.workspace.id,
        { inspiration: ['先写风声'], before: '他站在门口。' },
        new AbortController().signal,
      )

      expect(runtime.ctx.novelProject.current(runtime.workspace.id)).toEqual(before)
      expect(runtime.ctx.novelProject.pendingProposals(runtime.workspace.id)).toHaveLength(0)
    } finally {
      await runtime.dispose()
    }
  })
})
