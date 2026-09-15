import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-llm-retry'
import type {} from '@deepseek-ai/dsh-session-projection'
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter'
import { defineTool, type ToolRunContext } from '@deepseek-ai/dsh-tools'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import { z } from 'zod'
import { CANON_FACT_KINDS } from '@novel-agent/novel-project/types'
import type { NovelCanonFact, NovelCanonLock, NovelCanonValue, NovelResultPacketDraft } from '@novel-agent/novel-project/types'
import type {} from '@novel-agent/novel-project'
/** The only authoring stage covered by the first bounded automation envelope. */
export const NOVEL_AUTOMATION_STAGES = ['write'] as const
export type NovelAutomationStage = typeof NOVEL_AUTOMATION_STAGES[number]
/** Fixed reasons that end a bounded novel automation run. */
export const NOVEL_AUTOMATION_STOP_RULES = [
  'revision-changed',
  'lock-conflict',
  'budget-exhausted',
  'scope-complete',
] as const
export type NovelAutomationStopReason = typeof NOVEL_AUTOMATION_STOP_RULES[number]
/** Author-supplied provider prices for the four disjoint DSH usage buckets. */
export interface NovelAutomationTokenRatesUsdPerMillion {
  readonly uncachedInput: number
  readonly output: number
  readonly cacheRead: number
  readonly cacheWrite: number
}
/** Complete author-visible scope submitted for one bounded Write run. */
export interface NovelAutomationPolicyRequest {
  readonly expectedRevision: number
  /** Single-unit shorthand retained for the one-unit authoring flow. */
  readonly unitId?: string | undefined
  /** Ordered manuscript scope for this Write run. Each unit may be proposed once. */
  readonly unitIds: readonly string[]
  readonly allowedStages: readonly [
    'write'
  ]
  readonly maxResultPackets: number
  /** Provider-reported Token allowance consumed after this run is authorized. */
  readonly maxTokens: number
  /** Provider-reported Token allowance consumed while producing one scoped unit. */
  readonly maxTokensPerUnit: number
  /** Maximum USD cost computed from provider-reported usage after authorization. */
  readonly maxCostUsd: number
  /** Maximum USD cost computed while producing one scoped unit. */
  readonly maxCostUsdPerUnit: number
  /** Author-supplied USD prices per million Tokens for every DSH usage bucket. */
  readonly tokenRatesUsdPerMillion: NovelAutomationTokenRatesUsdPerMillion
  /** Wall-clock allowance measured from the DSH policy event timestamp. */
  readonly maxWallTimeMs: number
  /** Wall-clock allowance consumed while producing one scoped unit. */
  readonly maxWallTimeMsPerUnit: number
  /** Maximum DSH provider retries that may start after authorization. */
  readonly maxRetries: number
  /** Maximum DSH provider retries that may start while producing one scoped unit. */
  readonly maxRetriesPerUnit: number
  readonly lockedFacts: readonly NovelCanonLock[]
  readonly stopRules: readonly [
    'revision-changed',
    'lock-conflict',
    'budget-exhausted',
    'scope-complete'
  ]
}
/** Replayable Session snapshot for one approved bounded automation run. */
export interface NovelAutomationPolicySnapshot extends NovelAutomationPolicyRequest {
  readonly runId: string
  readonly status: 'active' | 'stopped'
  readonly usedResultPackets: number
  /** Manuscript units whose proposal has already been emitted in this run. */
  readonly completedUnitIds: readonly string[]
  /** Cumulative DSH Token usage captured when the author allowed this run. */
  readonly baselineTokens: number
  /** Provider-reported Tokens consumed since the authorization baseline. */
  readonly usedTokens: number
  /** Cumulative provider usage priced at authorization with the approved rates. */
  readonly baselineCostUsd: number
  /** Provider-reported usage cost accumulated since authorization. */
  readonly usedCostUsd: number
  /** Number of DSH retries that started after authorization. */
  readonly usedRetries: number
  /** Wall-clock milliseconds consumed since the DSH authorization event. */
  readonly elapsedMs: number
  readonly stopReason?: NovelAutomationStopReason | undefined
}
declare module '@deepseek-ai/dsh-session' {
  interface SessionEventMap {
    /** Complete snapshot of one author-approved bounded Write run; it is required replay state. */
    'novel/automation-policy': NovelAutomationPolicySnapshot
  }
}
const revisionSchema = z.number().int().nonnegative()
const lockableCanonFactKindSchema = z.union([
  z.enum(CANON_FACT_KINDS),
  z.string().regex(/^[^/]+\/[^/]+$/),
])
const novelCanonLockSchema = z.object({
  kind: lockableCanonFactKindSchema,
  targetId: z.string().min(1),
  field: z.string().min(1),
  value: z.json(),
}).strict()
const novelAutomationTokenRatesUsdPerMillionSchema = z.object({
  uncachedInput: z.number().nonnegative(),
  output: z.number().nonnegative(),
  cacheRead: z.number().nonnegative(),
  cacheWrite: z.number().nonnegative(),
}).strict()
export const novelAutomationPolicyRequestSchema = z.object({
  expectedRevision: revisionSchema,
  unitId: z.string().min(1).optional(),
  unitIds: z.array(z.string().min(1)).min(1).optional(),
  allowedStages: z.tuple([z.literal(NOVEL_AUTOMATION_STAGES[0])]),
  maxResultPackets: z.number().int().positive(),
  maxTokens: z.number().int().positive(),
  maxTokensPerUnit: z.number().int().positive(),
  maxCostUsd: z.number().positive(),
  maxCostUsdPerUnit: z.number().positive(),
  tokenRatesUsdPerMillion: novelAutomationTokenRatesUsdPerMillionSchema,
  maxWallTimeMs: z.number().int().positive(),
  maxWallTimeMsPerUnit: z.number().int().positive(),
  maxRetries: z.number().int().nonnegative(),
  maxRetriesPerUnit: z.number().int().nonnegative(),
  lockedFacts: z.array(novelCanonLockSchema),
  stopRules: z.tuple([
    z.literal(NOVEL_AUTOMATION_STOP_RULES[0]),
    z.literal(NOVEL_AUTOMATION_STOP_RULES[1]),
    z.literal(NOVEL_AUTOMATION_STOP_RULES[2]),
    z.literal(NOVEL_AUTOMATION_STOP_RULES[3]),
  ]),
}).strict().superRefine((request, ctx) => {
  const unitIds = request.unitIds ?? (request.unitId === undefined ? [] : [request.unitId])
  if (unitIds.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['unitIds'],
      message: 'provide unitId or unitIds for the automation scope',
    })
  }
  if (new Set(unitIds).size !== unitIds.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['unitIds'],
      message: 'automation scope unitIds must be unique',
    })
  }
  if (request.unitId !== undefined
    && request.unitIds !== undefined
    && (request.unitIds.length !== 1 || request.unitIds[0] !== request.unitId)) {
    ctx.addIssue({
      code: 'custom',
      path: ['unitIds'],
      message: 'unitId and unitIds must identify the same single-unit scope when both are provided',
    })
  }
}).transform((request) => {
  const unitIds = request.unitIds ?? [request.unitId!]
  return {
    ...request,
    unitIds,
    ...(request.unitId === undefined && unitIds.length === 1
      ? { unitId: unitIds[0] }
      : {}),
  }
})
/** Assemble one inclusive accepted Book or Series subtree without inferring debt status. */
type NovelAutomationPolicyEvent = Extract<SessionEvent, {
  readonly type: 'novel/automation-policy'
}>
function foldNovelAutomationPolicyEvent(events: readonly SessionEvent[]): NovelAutomationPolicyEvent | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event?.type === 'novel/automation-policy')
      return event
  }
  return undefined
}
function foldNovelAutomationPolicy(events: readonly SessionEvent[]): NovelAutomationPolicySnapshot | undefined {
  return foldNovelAutomationPolicyEvent(events)?.data
}
function activeNovelAutomationPolicyEvent(events: readonly SessionEvent[]): NovelAutomationPolicyEvent | undefined {
  const event = foldNovelAutomationPolicyEvent(events)
  return event?.data.status === 'active' ? event : undefined
}
function novelAutomationRunStartEvent(events: readonly SessionEvent[], runId: string): NovelAutomationPolicyEvent {
  for (const event of events) {
    if (event.type === 'novel/automation-policy' && event.data.runId === runId) {
      return event
    }
  }
  throw new Error(`automation run ${runId} has no start event`)
}
function stopNovelAutomationPolicy(agent: Agent, policy: NovelAutomationPolicySnapshot, stopReason: NovelAutomationStopReason, usedResultPackets: number = policy.usedResultPackets, usedTokens: number = policy.usedTokens, usedCostUsd: number = policy.usedCostUsd, elapsedMs: number = policy.elapsedMs, usedRetries: number = policy.usedRetries, completedUnitIds: readonly string[] = automationCompletedUnitIds(policy)): NovelAutomationPolicySnapshot {
  return agent.session.append('novel/automation-policy', {
    ...policy,
    status: 'stopped',
    usedResultPackets,
    completedUnitIds,
    usedTokens,
    usedCostUsd,
    elapsedMs,
    usedRetries,
    stopReason,
  }).data
}
function automationUnitIds(policy: Pick<NovelAutomationPolicyRequest, 'unitId' | 'unitIds'>): readonly string[] {
  if (policy.unitIds !== undefined)
    return policy.unitIds
  return policy.unitId === undefined ? [] : [policy.unitId]
}
function automationCompletedUnitIds(policy: Partial<Pick<NovelAutomationPolicySnapshot, 'completedUnitIds'>>): readonly string[] {
  return policy.completedUnitIds ?? []
}
function novelAutomationElapsedMs(event: NovelAutomationPolicyEvent): number {
  return Date.now() - event.time
}
function providerReportedTokenTotal(usage: TokenUsageProjection | undefined): number {
  if (usage === undefined) {
    throw new Error('novel automation requires the DSH tokenUsage projection')
  }
  return usage.uncachedInputTokens
    + usage.outputTokens
    + usage.cacheReadTokens
    + usage.cacheWriteTokens
}
function providerReportedTokenCostUsd(usage: TokenUsageProjection | undefined, rates: NovelAutomationTokenRatesUsdPerMillion): number {
  if (usage === undefined) {
    throw new Error('novel automation requires the DSH tokenUsage projection')
  }
  return (usage.uncachedInputTokens * rates.uncachedInput
    + usage.outputTokens * rates.output
    + usage.cacheReadTokens * rates.cacheRead
    + usage.cacheWriteTokens * rates.cacheWrite) / 1000000
}
function novelAutomationUsedTokens(usage: TokenUsageProjection | undefined, policy: NovelAutomationPolicySnapshot): number {
  return providerReportedTokenTotal(usage) - policy.baselineTokens
}
function novelAutomationUsedCostUsd(usage: TokenUsageProjection | undefined, policy: NovelAutomationPolicySnapshot): number {
  return providerReportedTokenCostUsd(usage, policy.tokenRatesUsdPerMillion)
    - policy.baselineCostUsd
}
function novelAutomationUsedRetries(events: readonly SessionEvent[], authorizationEvent: NovelAutomationPolicyEvent): number {
  return events.filter(event => (event.seq > authorizationEvent.seq
    && event.type === 'llm/retry-started')).length
}
function findAutomationLockConflict(policy: NovelAutomationPolicySnapshot, packet: NovelResultPacketDraft): NovelCanonLock | undefined {
  return findCanonLockConflict(policy.lockedFacts, packet.deltas)
}
function findCanonLockConflict(locks: readonly NovelCanonLock[], deltas: NovelResultPacketDraft['deltas']): NovelCanonLock | undefined {
  return locks.find(lockedFact => deltas.some((delta) => {
    if (delta.kind === 'narrative-unit'
      || delta.kind === 'narrative-clock'
      || delta.kind === 'narrative-debt')
      return false
    return (delta.kind === 'extension' ? delta.namespace : delta.kind) === lockedFact.kind
      && delta.targetId === lockedFact.targetId
      && delta.field === lockedFact.field
      && (delta.operation === 'remove' || !canonValuesEqual(delta.value, lockedFact.value))
  }))
}
function canonFactKey(kind: NovelCanonFact['kind'], targetId: string, field: string): string {
  return JSON.stringify([kind, targetId, field])
}
function canonValuesEqual(left: NovelCanonValue, right: NovelCanonValue): boolean {
  return canonicalizeJsonValue(left) === canonicalizeJsonValue(right)
}
function canonicalizeJsonValue(value: unknown): string {
  if (value === null)
    return 'null'
  if (Array.isArray(value)) {
    const items = Array.from({ length: value.length }, (_unused, index) => canonicalizeJsonValue(value[index]))
    return `[${items.join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => compareText(left, right))
    return `{${entries
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalizeJsonValue(child)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined)
    return 'null'
  return serialized
}
function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
/** Register Writing's approved scope, budget checks and Session accounting in the native Tool pipeline. */
export function registerWritingAutomation(ctx: Context): void {
  // This required state is read by the Host's own persistence catalog, even when package copies differ.
  ctx.sessions.registerLogEventType('novel/automation-policy')
  ctx.on('tools/pre-execute', async (exec, next) => {
    if (exec.agent === undefined)
      return next()
    if (exec.name === 'authorize_novel_automation') {
      const request = novelAutomationPolicyRequestSchema.parse(exec.arguments)
      return {
        kind: 'ask',
        reason: [
          `Authorize accepted R${String(request.expectedRevision)} unit scope ${request.unitIds.join(', ')} for up to ${String(request.maxResultPackets)} automated ${request.allowedStages.join('/')} proposals.`,
          `Budget: ${String(request.maxResultPackets)} Result Packets.`,
          `Token budget: ${String(request.maxTokens)} provider-reported tokens.`,
          `Per-unit Token budget: ${String(request.maxTokensPerUnit)} provider-reported tokens.`,
          `USD cost budget: $${String(request.maxCostUsd)} using author-supplied per-million Token rates ${JSON.stringify(request.tokenRatesUsdPerMillion)}.`,
          `Per-unit USD cost budget: $${String(request.maxCostUsdPerUnit)}.`,
          `Wall-time budget: ${String(request.maxWallTimeMs)} ms.`,
          `Per-unit wall-time budget: ${String(request.maxWallTimeMsPerUnit)} ms.`,
          `Retry budget: ${String(request.maxRetries)} started DSH retries.`,
          `Per-unit retry budget: ${String(request.maxRetriesPerUnit)} started DSH retries.`,
          `Locked Canon facts: ${JSON.stringify(request.lockedFacts)}.`,
          `Stop rules: ${request.stopRules.join(', ')}.`,
        ].join(' '),
      }
    }
    if (exec.name === 'propose_novel_result_packet') {
      const policyEvent = activeNovelAutomationPolicyEvent(exec.agent.session.snapshotEvents())
      if (policyEvent === undefined)
        return next()
      const policy = policyEvent.data
      const runStartEvent = novelAutomationRunStartEvent(exec.agent.session.snapshotEvents(), policy.runId)
      const tokenUsage = ctx.sessionProjections.snapshot(exec.agent.session).values.tokenUsage
      const usedTokens = novelAutomationUsedTokens(tokenUsage, policy)
      const usedCostUsd = novelAutomationUsedCostUsd(tokenUsage, policy)
      const usedRetries = novelAutomationUsedRetries(exec.agent.session.snapshotEvents(), runStartEvent)
      const elapsedMs = novelAutomationElapsedMs(runStartEvent)
      if (elapsedMs > policy.maxWallTimeMs) {
        stopNovelAutomationPolicy(exec.agent, policy, 'budget-exhausted', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} exceeded wall-time budget ${String(policy.maxWallTimeMs)} ms with elapsed ${String(elapsedMs)} ms`,
        }
      }
      const elapsedMsForCurrentUnit = novelAutomationElapsedMs(policyEvent)
      if (elapsedMsForCurrentUnit > policy.maxWallTimeMsPerUnit) {
        stopNovelAutomationPolicy(exec.agent, policy, 'budget-exhausted', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} exceeded per-unit wall-time budget ${String(policy.maxWallTimeMsPerUnit)} ms with current unit elapsed ${String(elapsedMsForCurrentUnit)} ms`,
        }
      }
      if (usedTokens > policy.maxTokens) {
        stopNovelAutomationPolicy(exec.agent, policy, 'budget-exhausted', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} exceeded token budget ${String(policy.maxTokens)} with used ${String(usedTokens)}`,
        }
      }
      const usedTokensForCurrentUnit = usedTokens - policy.usedTokens
      if (usedTokensForCurrentUnit > policy.maxTokensPerUnit) {
        stopNovelAutomationPolicy(exec.agent, policy, 'budget-exhausted', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} exceeded per-unit token budget ${String(policy.maxTokensPerUnit)} with current unit used ${String(usedTokensForCurrentUnit)}`,
        }
      }
      if (usedCostUsd > policy.maxCostUsd) {
        stopNovelAutomationPolicy(exec.agent, policy, 'budget-exhausted', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} exceeded USD cost budget $${String(policy.maxCostUsd)} with used $${String(usedCostUsd)}`,
        }
      }
      const usedCostUsdForCurrentUnit = usedCostUsd - policy.usedCostUsd
      if (usedCostUsdForCurrentUnit > policy.maxCostUsdPerUnit) {
        stopNovelAutomationPolicy(exec.agent, policy, 'budget-exhausted', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} exceeded per-unit USD cost budget $${String(policy.maxCostUsdPerUnit)} with current unit used $${String(usedCostUsdForCurrentUnit)}`,
        }
      }
      if (usedRetries > policy.maxRetries) {
        stopNovelAutomationPolicy(exec.agent, policy, 'budget-exhausted', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} exceeded retry budget ${String(policy.maxRetries)} with used ${String(usedRetries)} started retries`,
        }
      }
      const usedRetriesForCurrentUnit = usedRetries - policy.usedRetries
      if (usedRetriesForCurrentUnit > policy.maxRetriesPerUnit) {
        stopNovelAutomationPolicy(exec.agent, policy, 'budget-exhausted', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} exceeded per-unit retry budget ${String(policy.maxRetriesPerUnit)} with current unit used ${String(usedRetriesForCurrentUnit)} started retries`,
        }
      }
      const packet = ctx.novelProject.parseDraft((exec.arguments as {
        readonly packet?: unknown
      }).packet)
      const cwd = exec.agent.session.header.cwd
      if (cwd === undefined) {
        throw new Error('propose_novel_result_packet requires the calling agent session to have a cwd')
      }
      const workspace = await ctx.workspaceRegistry.resolveByPath(cwd)
      if (workspace === undefined) {
        throw new Error(`propose_novel_result_packet found no DSH Workspace for calling agent cwd '${cwd}'`)
      }
      const project = ctx.novelProject.current(workspace.id)
      if (project === undefined) {
        throw new Error(`novel project for Workspace '${workspace.id}' does not exist`)
      }
      if (project.acceptedRevision !== policy.expectedRevision
        || packet.expectedRevision !== policy.expectedRevision) {
        stopNovelAutomationPolicy(exec.agent, policy, 'revision-changed', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} stopped because accepted or proposed revision changed from R${String(policy.expectedRevision)}`,
        }
      }
      const unitIds = automationUnitIds(policy)
      const completedUnitIds = automationCompletedUnitIds(policy)
      if (packet.manuscript === undefined) {
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} is Write-only and requires a manuscript proposal`,
        }
      }
      if (!unitIds.includes(packet.manuscript.unitId)) {
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} is limited to manuscript units ${unitIds.join(', ')}`,
        }
      }
      if (completedUnitIds.includes(packet.manuscript.unitId)) {
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} already proposed manuscript unit '${packet.manuscript.unitId}'`,
        }
      }
      if (policy.usedResultPackets >= policy.maxResultPackets) {
        stopNovelAutomationPolicy(exec.agent, policy, 'budget-exhausted', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} exhausted its Result Packet budget`,
        }
      }
      const lockConflict = findAutomationLockConflict(policy, packet)
      if (lockConflict !== undefined) {
        stopNovelAutomationPolicy(exec.agent, policy, 'lock-conflict', policy.usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries)
        return {
          kind: 'deny',
          reason: `automation run ${policy.runId} cannot change locked Canon fact '${lockConflict.kind}:${lockConflict.targetId}:${lockConflict.field}'`,
        }
      }
      return next()
    }
    return next()
  })
  ctx.tools.register(defineTool({
    name: 'authorize_novel_automation',
    description: 'Ask the author for one stock DSH allowed-once decision covering a bounded Write scope for one accepted revision. Each scoped manuscript unit may produce at most one Result Packet; the replayable Session envelope never grants Accept or Publish and never advances Canon.',
    parameters: {
      expectedRevision: {
        type: 'integer',
        required: true,
        description: 'The accepted Novel Project revision fixed for the run.',
      },
      unitId: {
        type: 'string',
        description: 'Single-unit shorthand. Use unitIds to authorize more than one manuscript unit.',
      },
      unitIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Ordered manuscript units the run may propose, each at most once.',
      },
      allowedStages: {
        type: 'array',
        items: { type: 'string', enum: [...NOVEL_AUTOMATION_STAGES] },
        required: true,
        description: 'Exactly ["write"] for this bounded automation slice.',
      },
      maxResultPackets: {
        type: 'integer',
        required: true,
        description: 'Maximum number of reviewable Result Packet proposals in this run.',
      },
      maxTokens: {
        type: 'integer',
        required: true,
        description: 'Maximum provider-reported Tokens consumed after authorization.',
      },
      maxTokensPerUnit: {
        type: 'integer',
        required: true,
        description: 'Maximum provider-reported Tokens consumed while producing one scoped manuscript unit.',
      },
      maxCostUsd: {
        type: 'number',
        required: true,
        description: 'Maximum USD cost of provider-reported usage after authorization.',
      },
      maxCostUsdPerUnit: {
        type: 'number',
        required: true,
        description: 'Maximum USD cost of provider-reported usage while producing one scoped manuscript unit.',
      },
      tokenRatesUsdPerMillion: {
        type: 'object',
        required: true,
        additionalProperties: false,
        properties: {
          uncachedInput: { type: 'number', required: true },
          output: { type: 'number', required: true },
          cacheRead: { type: 'number', required: true },
          cacheWrite: { type: 'number', required: true },
        },
        description: 'Author-supplied USD prices per million Tokens for the four disjoint DSH usage buckets.',
      },
      maxWallTimeMs: {
        type: 'integer',
        required: true,
        description: 'Maximum wall-clock milliseconds consumed after authorization.',
      },
      maxWallTimeMsPerUnit: {
        type: 'integer',
        required: true,
        description: 'Maximum wall-clock milliseconds consumed while producing one scoped manuscript unit.',
      },
      maxRetries: {
        type: 'integer',
        required: true,
        description: 'Maximum started DSH retries permitted before the proposal; zero permits none.',
      },
      maxRetriesPerUnit: {
        type: 'integer',
        required: true,
        description: 'Maximum started DSH retries permitted while producing one scoped manuscript unit; zero permits none.',
      },
      lockedFacts: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            kind: {
              type: 'string',
              required: true,
            },
            targetId: { type: 'string', required: true },
            field: { type: 'string', required: true },
            value: { type: 'json', required: true },
          },
        },
        required: true,
        description: 'Accepted Canon values that the proposed packet may not change.',
      },
      stopRules: {
        type: 'array',
        items: { type: 'string', enum: [...NOVEL_AUTOMATION_STOP_RULES] },
        required: true,
        description: 'Exactly the four fixed revision, lock, budget and scope stop rules.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          policy: { type: 'json', required: true },
        },
      },
      render: (_args, value) => [{
          type: 'text',
          text: JSON.stringify(value.policy, null, 2),
        }],
    },
    presentCall: args => ({
      card: 'generic',
      title: `Authorize Write proposals for ${args.unitIds === undefined ? args.unitId : args.unitIds.join(', ')}`,
    }),
    presentResult: () => ({
      card: 'generic',
      title: 'Novel automation envelope active',
    }),
    execute: async (args, exec) => {
      const agent = exec.agent
      if (agent === undefined) {
        throw new Error('authorize_novel_automation requires a calling agent (exec.agent was undefined)')
      }
      const request = novelAutomationPolicyRequestSchema.parse(args) as NovelAutomationPolicyRequest
      const currentPolicy = foldNovelAutomationPolicy(agent.session.snapshotEvents())
      if (currentPolicy?.status === 'active') {
        throw new Error(`automation run ${currentPolicy.runId} is already active in this Session`)
      }
      const cwd = agent.session.header.cwd
      if (cwd === undefined) {
        throw new Error('authorize_novel_automation requires the calling agent session to have a cwd')
      }
      const workspace = await ctx.workspaceRegistry.resolveByPath(cwd)
      if (workspace === undefined) {
        throw new Error(`authorize_novel_automation found no DSH Workspace for calling agent cwd '${cwd}'`)
      }
      ctx.novelProject.assertCurrentRevision(workspace.id, request.expectedRevision)
      const canon = ctx.novelProject.projectCanon(workspace.id, request.expectedRevision)
      const canonFacts = new Map(canon.facts.map(fact => [
        canonFactKey(fact.kind, fact.targetId, fact.field),
        fact,
      ] as const))
      for (const lockedFact of request.lockedFacts) {
        const accepted = canonFacts.get(canonFactKey(lockedFact.kind, lockedFact.targetId, lockedFact.field))
        if (accepted === undefined || !canonValuesEqual(accepted.value, lockedFact.value)) {
          throw new Error(`locked Canon fact '${lockedFact.kind}:${lockedFact.targetId}:${lockedFact.field}' does not match accepted R${String(request.expectedRevision)}`)
        }
      }
      const tokenUsage = ctx.sessionProjections.snapshot(agent.session).values.tokenUsage
      const active: NovelAutomationPolicySnapshot = {
        ...request,
        runId: randomUUID(),
        status: 'active',
        usedResultPackets: 0,
        completedUnitIds: [],
        baselineTokens: providerReportedTokenTotal(tokenUsage),
        usedTokens: 0,
        baselineCostUsd: providerReportedTokenCostUsd(tokenUsage, request.tokenRatesUsdPerMillion),
        usedCostUsd: 0,
        usedRetries: 0,
        elapsedMs: 0,
      }
      const event = agent.session.append('novel/automation-policy', active)
      return { policy: event.data as unknown as JsonValue }
    },
  }))
}
/** Record a validated proposal and use its real ToolRunContext to finish an approved Write scope. */
export function recordWritingAutomationProposal(ctx: Context, exec: ToolRunContext, packet: NovelResultPacketDraft, acceptedRevision: number): void {
  const agent = exec.agent!
  const automationPolicyEvent = activeNovelAutomationPolicyEvent(agent.session.snapshotEvents())
  if (automationPolicyEvent === undefined)
    return
  if (acceptedRevision !== packet.expectedRevision) {
    const automationPolicy = automationPolicyEvent.data
    const automationRunStartEvent = novelAutomationRunStartEvent(agent.session.snapshotEvents(), automationPolicy.runId)
    const tokenUsage = ctx.sessionProjections.snapshot(agent.session).values.tokenUsage
    stopNovelAutomationPolicy(agent, automationPolicy, 'revision-changed', automationPolicy.usedResultPackets, novelAutomationUsedTokens(tokenUsage, automationPolicy), novelAutomationUsedCostUsd(tokenUsage, automationPolicy), novelAutomationElapsedMs(automationRunStartEvent), novelAutomationUsedRetries(agent.session.snapshotEvents(), automationRunStartEvent))
    return
  }
  const automationPolicy = automationPolicyEvent.data
  const automationRunStartEvent = novelAutomationRunStartEvent(agent.session.snapshotEvents(), automationPolicy.runId)
  if (packet.manuscript === undefined) {
    throw new Error(`automation run ${automationPolicy.runId} is Write-only and requires a manuscript proposal`)
  }
  const completedUnitIds = [
    ...automationCompletedUnitIds(automationPolicy),
    packet.manuscript.unitId,
  ]
  const usedResultPackets = automationPolicy.usedResultPackets + 1
  const scopeComplete = completedUnitIds.length >= automationUnitIds(automationPolicy).length
  const packetBudgetComplete = usedResultPackets >= automationPolicy.maxResultPackets
  const tokenUsage = ctx.sessionProjections.snapshot(agent.session).values.tokenUsage
  const usedTokens = novelAutomationUsedTokens(tokenUsage, automationPolicy)
  const usedCostUsd = novelAutomationUsedCostUsd(tokenUsage, automationPolicy)
  const elapsedMs = novelAutomationElapsedMs(automationRunStartEvent)
  const usedRetries = novelAutomationUsedRetries(agent.session.snapshotEvents(), automationRunStartEvent)
  if (scopeComplete || packetBudgetComplete) {
    stopNovelAutomationPolicy(agent, automationPolicy, scopeComplete ? 'scope-complete' : 'budget-exhausted', usedResultPackets, usedTokens, usedCostUsd, elapsedMs, usedRetries, completedUnitIds)
    exec.concludeTurn()
  }
  else {
    agent.session.append('novel/automation-policy', {
      ...automationPolicy,
      status: 'active',
      usedResultPackets,
      completedUnitIds,
      usedTokens,
      usedCostUsd,
      elapsedMs,
      usedRetries,
    })
  }
}
