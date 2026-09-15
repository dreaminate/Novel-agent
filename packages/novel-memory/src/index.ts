import { Context, Service } from '@deepseek-ai/cordis'
import { deepFreeze, type JsonValue } from '@deepseek-ai/dsh-util-values'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-session'
import { rebuildMemoryIndex, retrieveNovelContext, type LocalChineseRetrievalIndex } from './retrieval.js'
import type { NovelRetrievalRebuildJob } from '@novel-agent/novel-project/types'
import { CANON_FACT_KINDS, NARRATIVE_LEVELS, NARRATIVE_CLOCKS } from '@novel-agent/novel-project/types'
import type { SkillRegistration } from '@deepseek-ai/dsh-skill'
import { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import type { NovelMemoryReadService } from '@novel-agent/novel-project'
import type {} from '@novel-agent/novel-planning'
import type {} from '@novel-agent/novel-writing'
import type { NovelChapterControlPack, NovelRelationshipProjection, NovelResultPacketDraft, NovelRetrievalResult, NovelWritingContinuity } from '@novel-agent/novel-project/types'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { buildRelationshipProjection } from './relationships.js'
import { buildNovelGraph, buildNovelKnowledgeBoundaries, buildNovelKnowledgeBoundary, compareNovelCausalConsequences, traceNovelCausalImpact } from './graph.js'
import type { NovelCanonProjection, NovelCanonSnapshot, NovelCausalImpact, NovelGraphProjection, NovelKnowledgeBoundary, NovelNarrativeProjection, NovelRevisionImpact } from '@novel-agent/novel-project/types'
import { buildChapterControlPack, buildWritingCharacterMemory, buildWritingMemoryCharacterArcHypotheses, type MemorySourceContext } from './control-pack.js'

const NOVEL_MEMORY_GUIDANCE = `# Novel memory

When \`chapterId\` is included, use the Chapter control pack's complete character arc hypotheses together with its other accepted writing memory. When it is omitted for a not-yet-accepted next Chapter, use the equivalent top-level query-independent character arc hypotheses.`

const NOVEL_CONTINUITY_CHECKER_PACKET_EXAMPLE = {
  packetId: 'continuity-checker-example',
  expectedRevision: 1,
  deltas: [],
  issues: [{
    id: 'continuity-location-example',
    dimension: 'continuity',
    severity: 'major',
    problem: '正文让角色在没有旅行、离场或时间跳跃证据的情况下从北门出现在南岸。',
    suggestion: '补写可与当前世界规则和角色状态相符的移动过程，或改正地点描述。',
    sourceAnchorIds: ['continuity-checker-source-anchor-example'],
  }],
  sourceAnchors: [{
    id: 'continuity-checker-source-anchor-example',
    sourceId: 'chapter-example',
    start: 0,
    end: 1,
    contentHash: 'f'.repeat(64),
  }],
  provenance: {
    taskId: 'continuity-checker-task-example',
    sessionId: 'continuity-checker-session-example',
    producer: 'novel-continuity-checker',
  },
} satisfies NovelResultPacketDraft

const NOVEL_CONTINUITY_CHECKER_SKILL = {
  name: 'novel-continuity-checker',
  description: '连续性检查：依据已接受的小说事实和正文证据，提出带锚点的连续性问题与修订建议。',
  whenToUse: '用户需要检查正文或计划的设定、时间线、人物、关系、知识、债务或章节合同连续性时使用。',
  source: '@novel-agent/novel-memory',
  invocation: {
    modelInvocable: true,
    userInvocable: true,
  },
  content: `# 连续性检查

你负责识别可由证据证明的小说连续性问题，并生成可审阅的 Issue 或修订提案；你不直接写入项目事实，也不自行接受修订。

1. 先调用 \`retrieve_novel_context\`，读取 current accepted revision 的 Novel Project Canon、相关正文、世界规则、人物/关系/知识状态、叙事时钟、未清偿债务和写作记忆。检查一个已接受 Chapter 时在同一调用中带 \`chapterId\`，以获得该 Chapter 的 control pack 和明确来源。
2. 逐项比对正文或计划与已接受事实：世界规则和旅行/时间、人物目标/位置/资源/声音、关系双方状态、角色与读者知识边界、承诺与线索、剧情债务、Chapter contract 的视角/信息政策/长度/验收门槛，以及已经发生的 post-check。只报告实际矛盾、缺失的必要解释或可验证的违反；没有证据不要推测问题。
3. 每个问题必须是严格的 anchored Issue：给出稳定 \`id\`、具体 \`dimension\`（连续性使用 \`continuity\`）、\`critical\` / \`major\` / \`minor\` 的 \`severity\`、清楚的 \`problem\`、可执行的 \`suggestion\` 和至少一个指向实际正文或 Canon 证据的 \`sourceAnchorIds\`。没有发现问题时显式提交 \`issues: []\`，不要为了填表制造 Issue。
4. 若建议直接的正文修订，才在同一个 Result Packet 中同时给出 \`manuscript\` 和 unified \`manuscriptDiff\`；两者不可只给其一。连续性检查不能把推测、Issue 或 Diff 自动变成 Canon Delta、post-check 或已接受事实。

下面是能通过当前严格 Result Packet parser 的 Issue-only 连续性检查骨架。所有示例 id、revision、Anchor、内容和引用都必须替换为当前 accepted Project 中真实可用的值；不要照抄占位内容：

<novel_continuity_checker_packet_example>
\`\`\`json
${JSON.stringify(NOVEL_CONTINUITY_CHECKER_PACKET_EXAMPLE, null, 2)}
\`\`\`
</novel_continuity_checker_packet_example>

5. 调用 \`propose_novel_result_packet\` 提交现有 authorization-free Result Packet，保留 expected revision、SourceAnchors 和 provenance。不得直接写入 Canon，不得添加 author authorization，不得自动 Apply、Publish、创建新 Session 或建立平行审校状态。作者逐项决定后，只有现有 Novel Project Apply 事务可以产生下一 revision。`,
} satisfies SkillRegistration

const NOVEL_WRITING_MEMORY_PACKET_EXAMPLE = {
  packetId: 'writing-memory-organizer-example',
  expectedRevision: 2,
  deltas: [{
    id: 'writing-memory-post-check-example',
    kind: 'chapter-state',
    operation: 'set',
    targetId: 'chapter-example',
    field: 'post-check',
    value: {
      contractAssessment: {
        contractRevision: 1,
        contractSourceDeltaId: 'chapter-contract-source-delta-example',
        outcome: 'met',
        deviations: [],
      },
      manuscriptSourceRevision: 2,
      changes: ['本章正文已实际造成的状态变化'],
      costs: ['本章正文已实际支付且下一章必须保留的代价'],
      newlyPossible: ['本章结果使下一章新近可行的行动'],
      newlyImpossible: [],
      readerNowKnows: ['读者在已接受正文中已明确获知的信息'],
      readerNowSuspects: ['读者可从已接受正文合理怀疑但尚未确认的信息'],
      characterCarryForward: [{
        characterId: 'character-example',
        carries: ['下一章必须延续的角色位置、资源、情绪或选择后果'],
      }],
      debtTransitions: [{
        clock: 'promise',
        debtId: 'promise-debt-example',
        transition: 'advanced',
        sourceDeltaId: 'promise-debt-source-delta-example',
      }],
    },
    sourceAnchorIds: ['writing-memory-source-anchor-example'],
  }],
  issues: [],
  sourceAnchors: [{
    id: 'writing-memory-source-anchor-example',
    sourceId: 'accepted-chapter-example',
    start: 0,
    end: 1,
    contentHash: 'b'.repeat(64),
  }],
  provenance: {
    taskId: 'writing-memory-organizer-task-example',
    sessionId: 'writing-memory-organizer-session-example',
    producer: 'novel-writing-memory-organizer',
  },
} satisfies NovelResultPacketDraft

const NOVEL_WRITING_MEMORY_ORGANIZER_SKILL = {
  name: 'novel-writing-memory-organizer',
  description: '写作记忆整理：按指定 accepted revision 组织续写所需的事实、状态、信息边界与来源，并在明确要求时提出严格的章节后写回提案。',
  whenToUse: '用户需要回顾前文、准备续写、整理跨 Session 写作记忆、核对历史 revision 或在章节接受后提出状态写回时使用。',
  source: '@novel-agent/novel-memory',
  invocation: {
    modelInvocable: true,
    userInvocable: true,
  },
  content: `# 写作记忆整理

你负责把 Novel Project 已接受事实组织成当前任务需要的续写记忆，并在作者明确要求时提出可审阅的章节后写回；你不拥有第二套记忆、索引或事实源。

1. 用用户当前的写作意图作为 \`writingMemoryQuery\`，调用 \`retrieve_novel_context\` 读取用户指定的 requested revision；未指定时使用 current accepted revision。整理一个已接受 Chapter 时同时提供 \`chapterId\` 以取得 control pack。只组织该 revision 可见的 accepted Canon、narrative、manuscript 与来源证据，不以模型记忆、Session 临时文本或未接受草稿补全事实。
2. 默认输出当前 Session 的续写记忆简报，按固定顺序保留：\`latestChapterOutcome\` 的实际变化、代价、下一步可行/不可行；\`characterCarryForward\`；完整 \`characterArcHypotheses\`；\`relationshipCarryForward\` 的双向状态；\`knowledgeBoundaries\`；读者 \`readerNowKnows\` 与 \`readerNowSuspects\`；必须遵守的 \`authoringContracts\`；未清偿 \`debts\`、伏笔/承诺及其准备度；适用世界规则、能力限制；缺失、冲突或无法证明的项目。每项保留 source revision、SourceAnchor range 和 provenance。
3. 历史 requested revision 只能使用该 revision 及更早已接受的事实。不得把未来 revision 的结局、角色/关系状态、读者知识、人物弧、债务进度或后设解释混入；证据不足时标为未知，不推断补全。查询和整理不得刷新索引、改写缓存或改变 Canon。
4. 用户只要求回顾、续写准备、核对或整理记忆时始终只读：不得调用提案或 Apply Tool，不写 Canon、文件、Git 快照、索引、摘要库或任何状态。
5. 只有作者明确要求“整理并提出入库更新”，且目标 Chapter 的正文已经进入同一 accepted lineage 时，才可调用 \`propose_novel_result_packet\` 提交 authorization-free 提案。章节实际结果使用现有 \`chapter-state/post-check\` Delta：wrapper 必须给出 \`kind: "chapter-state"\`、\`operation: "set"\`、\`field: "post-check"\`、Chapter \`targetId\`、稳定 \`id\` 和真实 \`sourceAnchorIds\`；\`value\` 必须完整给出 \`contractAssessment\`、\`manuscriptSourceRevision\`、\`changes\`、\`costs\`、\`newlyPossible\`、\`newlyImpossible\`、\`readerNowKnows\`、\`readerNowSuspects\`、\`characterCarryForward\` 与 \`debtTransitions\`，没有内容的数组也显式写成 \`[]\`。
6. \`contractAssessment.outcome\` 只能是 \`met\` / \`changed\` / \`missed\`；每条 \`debtTransitions.transition\` 只能是 \`created\` / \`advanced\` / \`paid\` / \`retired\`，其 \`clock\` 只能是 \`plot\` / \`promise\` / \`progression\` / \`world\` / \`character\` / \`relationship\` / \`mystery\` / \`reader-knowledge\` / \`tension-payoff\` / \`ending\`。合同、正文、角色和债务引用必须在同一 accepted lineage 中真实存在。

下面是能通过当前严格 Result Packet parser 的最小章节后写作记忆骨架。它只能用于已接受正文之后；所有示例 id、revision、Anchor、内容和引用都必须替换为当前 Project 的真实值：

<novel_writing_memory_packet_example>
\`\`\`json
${JSON.stringify(NOVEL_WRITING_MEMORY_PACKET_EXAMPLE, null, 2)}
\`\`\`
</novel_writing_memory_packet_example>

7. post-check 之外的真实变化只能使用现有完整 strict contract 作为同一 author-reviewable proposal 的独立项：债务本体使用 \`narrative-debt/set\`，且 post-check 的 \`sourceDeltaId\`、\`debtId\` 和 \`clock\` 必须精确引用同一 accepted lineage 中的债务 Delta；双向关系分别使用 \`relationship/line-state\` 与 \`<from>-><to>\` targetId；角色或读者知情边界使用 \`knowledge/state\` 与 \`<subject>-><fact>\` targetId；人物弧只使用 \`character-state/arc-hypothesis\`。每项都必须给出该 contract 的全部必填字段和真实来源，不能塞进 post-check 的自由文本，也不得创建“记忆摘要”事实类型。不能合法映射时返回待确认清单。
8. 写回仍只是 Result Packet。不得直接写入 Canon，不得添加 author authorization，不得自动 Apply、Publish、创建新 Tool、Provider、memory store、Profile、Workflow、Session、Agent Loop 或版本系统。作者逐项决定后，只有现有 Novel Project Apply 事务可以产生下一 revision。`,
} satisfies SkillRegistration

declare module '@deepseek-ai/dsh-jobs' {
  interface JobKindMap {
    'novel-index': 'novel-index'
  }
}

/** Memory roles and revision-bound retrieval share the native domain-service lifetime. */
export class NovelMemoryService extends Service implements NovelMemoryReadService {
  static inject = ['novelProject', 'novelPlanning', 'novelWriting', 'tools', 'workspaceRegistry']

  private readonly retrievalIndexes = new Map<WorkspaceId, LocalChineseRetrievalIndex>()

  constructor(ctx: Context) {
    super(ctx, 'novelMemory')
    ctx.on('session/event', (_session, event) => {
      if (event.type !== 'novel/canon/accepted' && event.type !== 'novel/canon/rolled-back') return
      for (const [workspaceId, index] of this.retrievalIndexes) {
        if (index.projectId === event.data.projectId) this.retrievalIndexes.delete(workspaceId)
      }
    })
    this.ctx.tools.register(defineTool({
      name: 'retrieve_novel_context',
      description: 'Read accepted Canon, narrative and manuscript evidence for one Novel Project revision, optionally comparing another accepted revision, limiting structured Canon facts by family or entity, reconstructing one character state trajectory or clue/promise lifecycle, assembling one character progression ledger, one faction agenda and off-screen continuity ledger, one nested location and travel-access continuity ledger, one object custody and inventory continuity ledger, subject knowledge boundary or participant story-time timeline, limiting structured narrative state by level, unit or clock, selecting text hits by manuscript unit, rebuilding one Chapter control pack, assembling one ending closure ledger or tracing downstream event impact. Writing-memory results always include accepted authoring contracts and intent-ranked rolling roadmaps. When chapterId is supplied, the Chapter control pack includes complete character arc hypotheses. Without chapterId, writing memory includes query-independent character carry-forward, query-independent character arc hypotheses, query-independent latest reader disclosure carry-forward from the latest accepted post-Chapter check, query-independent latest Chapter outcome carry-forward from that post-check, query-independent relationship carry-forward, query-independent knowledge boundaries and intent-ranked accepted narrative units. Use this read-only tool for Ask, Plan and memory-grounded Write; it never advances Canon.',
      parameters: {
        revision: {
          type: 'integer',
          required: true,
          description: 'The accepted Novel Project revision to read.',
        },
        compareRevision: {
          type: 'integer',
          description: 'Optional accepted baseline revision compared with revision across manuscripts and domain projections.',
        },
        canonKind: {
          type: 'string',
          enum: [...CANON_FACT_KINDS],
          description: 'Optional accepted Canon family limiting structured Canon fact hits.',
        },
        canonTargetId: {
          type: 'string',
          description: 'Optional accepted Canon entity id limiting structured Canon fact hits.',
        },
        characterTrajectoryId: {
          type: 'string',
          description: 'Optional character id whose accepted state changes should be reconstructed across revisions.',
        },
        clueLifecycleId: {
          type: 'string',
          description: 'Optional clue id whose accepted field lifecycle should be reconstructed across revisions.',
        },
        promiseLifecycleId: {
          type: 'string',
          description: 'Optional promise id whose accepted setup, complication and payoff lifecycle should be reconstructed.',
        },
        mysteryLifecycleId: {
          type: 'string',
          description: 'Optional mystery id whose accepted truth and reveal lifecycle should be reconstructed.',
        },
        progressionCharacterId: {
          type: 'string',
          description: 'Optional character id whose typed accepted capability advancements should be assembled in story order.',
        },
        factionId: {
          type: 'string',
          description: 'Optional faction id whose typed accepted agenda and off-screen continuity should be assembled in story order.',
        },
        locationId: {
          type: 'string',
          description: 'Optional location id whose typed accepted nesting, access and travel continuity should be assembled in story order.',
        },
        objectId: {
          type: 'string',
          description: 'Optional object id whose typed accepted custody, location and quantity continuity should be assembled in story order.',
        },
        emotionCharacterId: {
          type: 'string',
          description: 'Optional character id whose typed accepted emotional episodes should be assembled.',
        },
        knowledgeSubjectId: {
          type: 'string',
          description: 'Optional character or reader id whose accepted subject-to-fact knowledge boundary should be assembled.',
        },
        timelineParticipantId: {
          type: 'string',
          description: 'Optional character id whose accepted structured story events should be ordered by story time.',
        },
        narrativeLevel: {
          type: 'string',
          enum: [...NARRATIVE_LEVELS],
          description: 'Optional hierarchy level limiting structured narrative-unit hits.',
        },
        narrativeUnitId: {
          type: 'string',
          description: 'Optional accepted narrative unit id limiting structured unit, clock and debt hits.',
        },
        narrativeClock: {
          type: 'string',
          enum: [...NARRATIVE_CLOCKS],
          description: 'Optional narrative clock limiting structured clock entries and debts.',
        },
        unitId: {
          type: 'string',
          description: 'Optional accepted manuscript unit id limiting exact-text and full-text hits.',
        },
        exactText: {
          type: 'string',
          description: 'Optional exact manuscript text to locate at that revision.',
        },
        fullText: {
          type: 'string',
          description: 'Optional Chinese full-text query at that revision.',
        },
        writingMemoryQuery: {
          type: 'string',
          description: 'Optional writing intent used to recall ranked rolling roadmaps, narrative structure when no chapterId is supplied, manuscript, setting, continuity and debt memory from that revision alongside its accepted authoring contracts, query-independent character carry-forward, query-independent character arc hypotheses, the latest accepted post-Chapter reader disclosure (readerNowKnows and readerNowSuspects), the latest accepted post-Chapter outcome (contractAssessment, changes, costs, newlyPossible and newlyImpossible), query-independent relationship carry-forward and query-independent knowledge boundaries.',
        },
        chapterId: {
          type: 'string',
          description: 'Optional accepted Chapter id whose control pack should be rebuilt from this revision.',
        },
        closureScopeId: {
          type: 'string',
          description: 'Optional accepted Book or Series id whose ending entries and current debts should be assembled.',
        },
        remainingChapterBudget: {
          type: 'integer',
          description: 'Positive author-supplied remaining Chapter budget for the requested closure scope.',
        },
        impactEventId: {
          type: 'string',
          description: 'Optional accepted story-event id whose downstream causal impact should be traced by shortest paths.',
        },
        graph: {
          type: 'boolean',
          description: 'Include the rebuildable hierarchy, relationship, clock and debt graph for this revision.',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            projectId: { type: 'string', required: true },
            workspaceId: { type: 'string', required: true },
            revision: { type: 'integer', required: true },
            headRevision: { type: 'integer', required: true },
            freshness: {
              type: 'string',
              enum: ['current', 'historical'],
              required: true,
            },
            hits: { type: 'array', required: true },
            characterTrajectory: { type: 'json' },
            clueLifecycle: { type: 'json' },
            promiseLifecycle: { type: 'json' },
            mysteryLifecycle: { type: 'json' },
            progressionLedger: { type: 'json' },
            factionContinuity: { type: 'json' },
            locationContinuity: { type: 'json' },
            objectContinuity: { type: 'json' },
            emotionContinuity: { type: 'json' },
            knowledgeBoundary: { type: 'json' },
            timeline: { type: 'json' },
            roadmapResolution: { type: 'json' },
            controlPack: { type: 'json' },
            writingMemory: { type: 'json' },
            closure: { type: 'json' },
            impact: { type: 'json' },
            revisionImpact: { type: 'json' },
            graph: { type: 'json' },
          },
        },
        render: (_args, value) => [{
          type: 'text',
          text: JSON.stringify(value, null, 2),
        }],
        presentationMeta: (args, value) => ({
          projectId: value.projectId,
          workspaceId: value.workspaceId,
          freshness: value.freshness,
          headRevision: value.headRevision,
          writingMemoryQuery: args.writingMemoryQuery ?? null,
          revision: args.revision,
          chapterId: args.chapterId ?? null,
          // The DSH renderer may spill the model-facing text. Keep this
          // rebuildable projection in tool presentation metadata for the
          // persisted client result; it is never sent as a model prompt.
          ...value.writingMemory === undefined ? {} : { writingMemory: value.writingMemory },
        }),
      },
      execute: async (args, exec) => {
        const agent = exec.agent
        if (agent === undefined) {
          throw new Error('retrieve_novel_context requires a calling agent (exec.agent was undefined)')
        }
        const cwd = agent.session.header.cwd
        if (cwd === undefined) {
          throw new Error('retrieve_novel_context requires the calling agent session to have a cwd')
        }
        const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
        if (workspace === undefined) {
          throw new Error(`retrieve_novel_context found no DSH Workspace for calling agent cwd '${cwd}'`)
        }
        const result = this.retrieve(workspace.id, args)
        return {
          projectId: result.projectId,
          workspaceId: result.workspaceId,
          revision: result.revision,
          headRevision: result.headRevision,
          freshness: result.freshness,
          ...(result.characterTrajectory === undefined
            ? {}
            : { characterTrajectory: result.characterTrajectory as unknown as JsonValue }),
          ...(result.clueLifecycle === undefined
            ? {}
            : { clueLifecycle: result.clueLifecycle as unknown as JsonValue }),
          ...(result.promiseLifecycle === undefined
            ? {}
            : { promiseLifecycle: result.promiseLifecycle as unknown as JsonValue }),
          ...(result.mysteryLifecycle === undefined
            ? {}
            : { mysteryLifecycle: result.mysteryLifecycle as unknown as JsonValue }),
          ...(result.progressionLedger === undefined
            ? {}
            : { progressionLedger: result.progressionLedger as unknown as JsonValue }),
          ...(result.factionContinuity === undefined
            ? {}
            : { factionContinuity: result.factionContinuity as unknown as JsonValue }),
          ...(result.locationContinuity === undefined
            ? {}
            : { locationContinuity: result.locationContinuity as unknown as JsonValue }),
          ...(result.objectContinuity === undefined
            ? {}
            : { objectContinuity: result.objectContinuity as unknown as JsonValue }),
          ...(result.emotionContinuity === undefined
            ? {}
            : { emotionContinuity: result.emotionContinuity as unknown as JsonValue }),
          ...(result.knowledgeBoundary === undefined
            ? {}
            : { knowledgeBoundary: result.knowledgeBoundary as unknown as JsonValue }),
          ...(result.timeline === undefined
            ? {}
            : { timeline: result.timeline as unknown as JsonValue }),
          ...(result.roadmapResolution === undefined
            ? {}
            : { roadmapResolution: result.roadmapResolution as unknown as JsonValue }),
          ...(result.controlPack === undefined
            ? {}
            : { controlPack: result.controlPack as unknown as JsonValue }),
          ...(result.writingMemory === undefined
            ? {}
            : { writingMemory: result.writingMemory as unknown as JsonValue }),
          ...(result.closure === undefined
            ? {}
            : { closure: result.closure as unknown as JsonValue }),
          ...(result.impact === undefined
            ? {}
            : { impact: result.impact as unknown as JsonValue }),
          ...(result.revisionImpact === undefined
            ? {}
            : { revisionImpact: result.revisionImpact as unknown as JsonValue }),
          ...(result.graph === undefined
            ? {}
            : { graph: result.graph as unknown as JsonValue }),
          // ToolRuntime validates every hit as lossless JSON; the domain
          // interfaces intentionally do not carry a broad string index.
          hits: [...result.hits] as unknown as JsonValue[],
        }
      },
    }))

    this.ctx.tools.register(defineTool({
      name: 'rebuild_novel_index',
      description: 'Rebuild the local full-text index for the current Novel Project revision. Returns a background job id for use with the standard DSH job tools.',
      parameters: {
        revision: {
          type: 'integer',
          required: true,
          description: 'The currently accepted Novel Project revision to index.',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            jobId: { type: 'string', required: true },
            revision: { type: 'integer', required: true },
          },
        },
        render: (_args, value) => [{
          type: 'text',
          text: `started novel index job ${value.jobId} for R${String(value.revision)}`,
        }],
      },
      execute: async (args, exec) => {
        const agent = exec.agent
        if (agent === undefined) {
          throw new Error('rebuild_novel_index requires a calling agent (exec.agent was undefined)')
        }
        const cwd = agent.session.header.cwd
        if (cwd === undefined) {
          throw new Error('rebuild_novel_index requires the calling agent session to have a cwd')
        }
        const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
        if (workspace === undefined) {
          throw new Error(`rebuild_novel_index found no DSH Workspace for calling agent cwd '${cwd}'`)
        }
        return this.rebuildRetrievalIndex(agent, workspace.id, args.revision)
      },
    }))
    ctx.effect(() => ctx.novelProject.registerProjector('memory/relationships', {
      project: snapshot => buildRelationshipProjection(ctx.novelProject.projectCanon(
        WorkspaceId(snapshot.workspaceId), snapshot.revision,
      )),
    }))
    ctx.inject(['systemPrompt'], promptCtx => promptCtx.systemPrompt.section({
      name: 'novel:memory',
      order: 121,
      text: NOVEL_MEMORY_GUIDANCE,
    }))
    ctx.inject(['skills'], skillCtx => {
      skillCtx.skills.register(NOVEL_CONTINUITY_CHECKER_SKILL)
      skillCtx.skills.register(NOVEL_WRITING_MEMORY_ORGANIZER_SKILL)
    })
  }

  /** Read Memory-owned bidirectional relationship lines from one accepted Canon revision. */
  readRelationships(workspaceId: WorkspaceId, revision: number): NovelRelationshipProjection {
    return this.ctx.novelProject.readProjection<NovelRelationshipProjection>('memory/relationships', workspaceId, revision)
  }

  /** Read the derived graph at exactly one accepted revision. */
  readGraph(workspaceId: WorkspaceId, revision: number): NovelGraphProjection {
    return this.projectGraph(
      this.ctx.novelProject.readSnapshot(workspaceId, revision),
      this.ctx.novelProject.projectCanon(workspaceId, revision),
      this.ctx.novelPlanning.readPlan(workspaceId, revision),
      this.ctx.novelProject.current(workspaceId)!.acceptedRevision,
    )
  }

  /** Project supplied Canon/Planning views so author preview can include a candidate that is not accepted. */
  projectGraph(snapshot: NovelCanonSnapshot, canon: NovelCanonProjection, narrative: NovelNarrativeProjection, headRevision: number): NovelGraphProjection {
    return buildNovelGraph(snapshot, canon, narrative, headRevision)
  }

  /** Compare derived causal paths without treating provenance-only rewrites as story changes. */
  compareCausalConsequences(before: NovelGraphProjection, after: NovelGraphProjection): NonNullable<NovelRevisionImpact['causalConsequences']> {
    return compareNovelCausalConsequences(before, after)
  }

  /** Trace sourced shortest paths over the supplied derived graph without changing Canon. */
  traceCausalImpact(graph: NovelGraphProjection, sourceEventId: string): NovelCausalImpact {
    return traceNovelCausalImpact(graph, sourceEventId)
  }

  /** Read one character or reader's accepted knowledge and the referenced facts at this revision. */
  readKnowledgeBoundary(workspaceId: WorkspaceId, revision: number, subjectId: string): NovelKnowledgeBoundary {
    return buildNovelKnowledgeBoundary(
      this.ctx.novelProject.readSnapshot(workspaceId, revision),
      this.ctx.novelProject.projectCanon(workspaceId, revision),
      this.ctx.novelProject.current(workspaceId)!.acceptedRevision,
      subjectId,
    )
  }

  /** Assemble one accepted Chapter's control pack using Canon sources and the domain read services. */
  readChapterControlPack(workspaceId: WorkspaceId, revision: number, chapterId: string): NovelChapterControlPack {
    return buildChapterControlPack(
      this.sourceContext(workspaceId, revision),
      this.ctx.novelProject.projectCanon(workspaceId, revision),
      this.ctx.novelPlanning.readPlan(workspaceId, revision),
      this.ctx.novelWriting.readManuscripts(workspaceId, revision),
      this.readRelationships(workspaceId, revision),
      this.ctx.novelProject.readCanonLockResolution(workspaceId, revision),
      this.ctx.novelProject.current(workspaceId)!.acceptedRevision,
      chapterId,
    )
  }

  /** Carry explicit accepted character, relationship and Chapter outcomes into the next writing context. */
  readWritingContinuity(workspaceId: WorkspaceId, revision: number): NovelWritingContinuity {
    const source = this.sourceContext(workspaceId, revision)
    const canon = this.ctx.novelProject.projectCanon(workspaceId, revision)
    const narrative = this.ctx.novelPlanning.readPlan(workspaceId, revision)
    return deepFreeze({
      ...buildWritingCharacterMemory(source, canon, narrative.units.filter(unit => unit.level === 'chapter')),
      characterArcHypotheses: buildWritingMemoryCharacterArcHypotheses(source, canon),
      relationshipCarryForward: this.readRelationships(workspaceId, revision).relationships,
      knowledgeBoundaries: buildNovelKnowledgeBoundaries(source.snapshot, canon, this.ctx.novelProject.current(workspaceId)!.acceptedRevision),
    })
  }

  private sourceContext(workspaceId: WorkspaceId, revision: number): MemorySourceContext {
    return {
      snapshot: this.ctx.novelProject.readSnapshot(workspaceId, revision),
      manuscriptsAt: sourceRevision => this.ctx.novelWriting.readManuscripts(workspaceId, sourceRevision),
    }
  }

  /** Rebuild the current derived search index through the caller's native DSH Job controller. */
  rebuildRetrievalIndex(owner: Agent, workspaceId: WorkspaceId, revision: number): NovelRetrievalRebuildJob {
    return rebuildMemoryIndex(this.ctx, this.retrievalIndexes, owner, workspaceId, revision)
  }

  /** Assemble requested accepted evidence and ranking without writing Canon. */
  retrieve(workspaceId: WorkspaceId, query: unknown): NovelRetrievalResult {
    return retrieveNovelContext(this.ctx, this, this.retrievalIndexes, workspaceId, query)
  }
}

export default NovelMemoryService
