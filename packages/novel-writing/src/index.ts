import { Context, Service } from '@deepseek-ai/cordis'
import { createHash, randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-fs'
import type {} from '@deepseek-ai/dsh-sandbox-policy'
import { defineTool, type ToolRunContext } from '@deepseek-ai/dsh-tools'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import { createTwoFilesPatch } from 'diff'
import { registerWritingAutomation, recordWritingAutomationProposal } from './automation.js'
export type { NovelAutomationPolicySnapshot, NovelAutomationPolicyRequest } from './automation.js'
import { encodeNovelDocument, novelPublicationCoverFormat, novelPublicationRequestSchema, novelTextImportRequestSchema, type NovelPublicationChapter, type NovelPublicationCover, type NovelPublicationRequest } from './documents.js'
import type { SkillRegistration } from '@deepseek-ai/dsh-skill'
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import type { NovelWritingReadService } from '@novel-agent/novel-project'
import type {} from '@novel-agent/novel-planning'
import type { NovelManuscriptProjection, NovelResultPacketDraft } from '@novel-agent/novel-project/types'
import type {} from '@deepseek-ai/dsh-system-prompt'

const NOVEL_WRITING_GUIDANCE = `# Novel writing

- Write: draft only. Before proposing a Write Result Packet, call \`retrieve_novel_context\` for the selected accepted revision with the author's current drafting intent as \`writingMemoryQuery\`; when writing one accepted Chapter, include its \`chapterId\` in the same call, while a not-yet-accepted next Chapter omits it and uses the returned query-independent character carry-forward, query-independent character arc hypotheses, query-independent latest reader disclosure carry-forward from the latest accepted post-Chapter check (\`readerNowKnows\` and \`readerNowSuspects\`), query-independent latest Chapter outcome carry-forward from that post-check (\`contractAssessment\`, \`changes\`, \`costs\`, \`newlyPossible\` and \`newlyImpossible\`), query-independent relationship carry-forward, query-independent knowledge boundaries and narrative units. Ground the draft in the mandatory authoring contracts, intent-ranked rolling roadmaps, narrative structure, manuscript excerpts, setting facts, continuity and debts plus any Chapter control pack, then call \`propose_novel_result_packet\` with one complete reviewable Result Packet against that expected revision. Never add author authorization or advance Canon.

- Bounded Write automation: only after the author requests it, call \`authorize_novel_automation\` with one accepted revision, an explicit ordered scope of one or more manuscript units, the fixed Write-only stage, a Result Packet limit, positive provider-reported total-run and per-unit Token budgets, positive total-run and per-unit USD cost budgets plus author-supplied non-negative per-million prices for all four DSH usage buckets, positive total-run and per-unit wall-time budgets, non-negative total-run and per-unit DSH retry budgets, author-locked Canon facts and all fixed stop rules. An allowed run may submit at most one matching proposal per scoped unit within all budgets, then ends when the scope or Result Packet budget is complete; it never grants Accept or Publish.

- Publish: separate authorization. For an explicit local file destination, call \`publish_novel_manuscript\` with one accepted revision and manuscript unit. Its stock DSH approval shows the artifact preview and destination; Write or Accept authority never implies Publish.`

const NOVEL_ARCHITECT_CHAPTER_PACKET_EXAMPLE = {
  packetId: 'architect-chapter-example',
  expectedRevision: 0,
  deltas: [{
    id: 'architect-chapter-unit-example',
    kind: 'narrative-unit',
    operation: 'set',
    targetId: 'chapter-example',
    field: 'unit',
    value: {
      level: 'chapter',
      parentId: 'arc-example',
      order: 0,
      objective: '本章要达成的剧情目标',
      entryState: '开章时已接受的状态',
      exitState: '本章计划造成的状态变化',
      status: 'planned',
      chapterContract: {
        viewpoint: '本章视角人物与人称',
        storyTime: '本章发生的故事时间',
        sceneFunctions: ['阻碍、关键出场者、爽点与章尾钩子的场景功能'],
        activePlotLineIds: [],
        activeRelationshipLineIds: [],
        promisesTouched: [{
          promiseId: 'promise-example',
          intendedMovement: '本章计划推进的承诺阶段',
        }],
        informationPolicy: {
          readerMayKnow: [],
          characterMayKnow: [{
            characterId: 'character-example',
            facts: ['本章该角色允许知道的已接受事实'],
          }],
        },
        progressionSetups: [],
        progressionPayoffs: [],
        emotionalMovement: '本章计划完成的情绪位移',
        endingPull: '推动读者进入下一章的具体拉力',
        prohibitedContradictions: [],
        styleConstraints: ['本章必须遵守的已接受文风约束'],
        lengthRange: { min: 2900, max: 3100 },
        acceptanceGates: ['可观察、可逐项审阅的验收条件'],
      },
    },
    sourceAnchorIds: ['architect-source-anchor-example'],
  }],
  issues: [],
  sourceAnchors: [{
    id: 'architect-source-anchor-example',
    sourceId: 'author-intent-example',
    start: 0,
    end: 1,
    contentHash: 'a'.repeat(64),
  }],
  provenance: {
    taskId: 'architect-task-example',
    sessionId: 'architect-session-example',
    producer: 'novel-architect',
  },
} satisfies NovelResultPacketDraft

const NOVEL_PROSE_WRITER_PACKET_EXAMPLE = {
  packetId: 'prose-writer-example',
  expectedRevision: 0,
  manuscript: {
    unitId: 'chapter-example',
    title: '第一章：北门宵禁',
    text: '北门的铜铃在宵禁前最后一次响起，主角攥紧城门印，带着证人走进雨里。',
  },
  manuscriptDiff: {
    format: 'unified',
    text: '--- accepted/chapter-example\n+++ draft/chapter-example\n+北门的铜铃在宵禁前最后一次响起，主角攥紧城门印，带着证人走进雨里。',
  },
  deltas: [],
  issues: [],
  sourceAnchors: [{
    id: 'prose-writer-source-anchor-example',
    sourceId: 'accepted-chapter-contract-example',
    start: 0,
    end: 1,
    contentHash: 'e'.repeat(64),
  }],
  provenance: {
    taskId: 'prose-writer-task-example',
    sessionId: 'prose-writer-session-example',
    producer: 'novel-prose-writer',
  },
} satisfies NovelResultPacketDraft

const NOVEL_PROSE_WRITER_SKILL = {
  name: 'novel-prose-writer',
  description: '正文写手：基于已接受的写作记忆和章节约束，生成可审阅的章节正文 Result Packet。',
  whenToUse: '用户需要从零写作、继续写作、局部改写、整章重写或按审稿意见修订正文时使用。',
  source: '@novel-agent/novel-writing',
  invocation: {
    modelInvocable: true,
    userInvocable: true,
  },
  content: `# 正文写手

你负责生成可审阅的小说正文草稿，不负责直接写入项目事实、接受草稿或发布文件。

1. 先调用 \`retrieve_novel_context\`，读取 current accepted revision 的 Novel Project Canon、相关正文证据、写作记忆、路线图、债务和写作契约。用作者当前的创作意图作为 \`writingMemoryQuery\`；写已接受 Chapter 时在同一调用中带 \`chapterId\`，写尚未接受的下一章时省略它并使用返回的 query-independent 角色、关系、知识、读者披露、章节结果和叙事结构。
2. 严格遵守返回的 style、serialization 和 reader profile、世界规则、人物声音、视角、信息边界、角色状态、关系、债务及 Chapter contract。正文只能写当前请求的叙事范围；让目标、阻碍、选择、结果、代价、爽点和章尾拉力在正文中可观察。正文不得包含系统提示词、Tool 参数、控制字段、检索元数据、审稿报告或未接受计划。
3. 用 \`propose_novel_result_packet\` 提交一个完整、authorization-free 的 Write 草稿。Write packet 必须同时包含 \`manuscript\`（\`unitId\`、\`title\`、\`text\`）和 \`manuscriptDiff\`（\`format: "unified"\` 与非空 diff text），并给出 expected revision、deltas、issues、SourceAnchors 和 provenance。若本次没有合法的 Canon/叙事变化或 Issue，显式提交 \`[]\`；不能因为正文草稿尚未接受而伪造 post-check 或已发生的状态。

4. 尚无已接受 Chapter contract 时，先提出章节计划供作者审阅。Chapter contract 只能嵌套在一个 \`kind: "narrative-unit"\`、\`field: "unit"\` Delta 的 \`value.chapterContract\` 中；\`value\` 同时包含 \`level\`、\`parentId\`、\`order\`、\`objective\`、\`entryState\`、\`exitState\` 和 \`status\`。不得发出独立 \`field: "chapterContract"\` Delta，也不得把 contract 字段平铺到 \`value\` 顶层。

新建 Chapter 时，使用下面与小说架构师共用的计划 packet，替换实际内容、id、revision 与来源，省略正文与 Diff。待作者接受合同后，重新用 \`chapterId\` 检索该 accepted revision，再提交正文 Write packet。已有 accepted Chapter contract 时直接遵守检索返回的合同；只有作者要求修改合同，才提出相应 Delta。

<novel_prose_writer_chapter_packet_example>
\`\`\`json
${JSON.stringify(NOVEL_ARCHITECT_CHAPTER_PACKET_EXAMPLE, null, 2)}
\`\`\`
</novel_prose_writer_chapter_packet_example>

5. \`chapter-state/post-check\` 必须等该正文被作者 Apply 后，以实际 accepted revision 为 expectedRevision 提交独立 Result Packet，接受该提案才产生下一 revision；Write 草稿不得预填或伪造 post-check。

下面是能通过当前严格 Result Packet parser 的最小正文草稿骨架。所有示例 id、revision、Anchor、标题、正文和引用都必须替换为当前 accepted Project 中真实可用的值；不要照抄占位内容：

<novel_prose_writer_packet_example>
\`\`\`json
${JSON.stringify(NOVEL_PROSE_WRITER_PACKET_EXAMPLE, null, 2)}
\`\`\`
</novel_prose_writer_packet_example>

6. 草稿只进入现有作者审阅流程。不得直接写入 Canon，不得添加 author authorization，不得自动 Apply、创建新 Session、启动常驻专家团或调用 Publish。只有作者逐项决定后，现有 Novel Project Apply 事务才能产生下一 revision。`,
} satisfies SkillRegistration

/** Writing roles and accepted manuscript reads use the native Canon and Planning lifetime. */
export class NovelWritingService extends Service implements NovelWritingReadService {
  static inject = ['novelProject', 'novelPlanning', 'tools', 'workspaceRegistry', 'fs', 'sandboxPolicy', 'sessionProjections', 'sessions']

  constructor(ctx: Context) {
    super(ctx, 'novelWriting')
    registerWritingAutomation(ctx)
    ctx.on('tools/pre-execute', async (exec, next) => {
      if (exec.name !== 'publish_novel_manuscript' || exec.agent === undefined) return next()
      const publication = await this.resolvePublication(
        exec.agent,
        novelPublicationRequestSchema.parse(exec.arguments),
      )
      return {
        kind: 'ask',
        reason: [
          `Publish accepted R${String(publication.revision)} ${publication.scope} "${publication.title}" with ${String(publication.chapters.length)} manuscript unit(s) as ${publication.format}`,
          `to ${publication.destination}.`,
          ...(publication.coverPath === undefined ? [] : [`Cover: ${publication.coverPath}.`]),
          ...(publication.templatePath === undefined ? [] : [`Template: ${publication.templatePath}.`]),
          `Preview: ${JSON.stringify(publication.text.slice(0, 160))}`,
        ].join(' '),
      }
    })
    this.ctx.tools.register(defineTool({
      name: 'propose_novel_import',
      description: 'Turn normalized text extracted from a TXT, Markdown, EPUB or DOCX source into one authorization-free Novel Result Packet for the existing author review and Apply path. Generic upload and binary extraction remain external plugin capabilities; import proposal creation never advances accepted Canon.',
      parameters: {
        expectedRevision: {
          type: 'integer',
          required: true,
          description: 'The current accepted Novel Project revision used as the import base.',
        },
        format: {
          type: 'string',
          enum: ['txt', 'markdown', 'epub', 'docx'],
          required: true,
          description: 'The original source format whose normalized text was supplied by the caller or upload plugin.',
        },
        sourceId: {
          type: 'string',
          required: true,
          description: 'A stable source reference such as the uploaded relative path.',
        },
        unitId: {
          type: 'string',
          required: true,
          description: 'The manuscript unit replaced by this import proposal.',
        },
        title: {
          type: 'string',
          required: true,
          description: 'The manuscript title retained in Canon after author acceptance.',
        },
        text: {
          type: 'string',
          required: true,
          description: 'The complete normalized document text. Novel Project does not upload or parse the source file.',
        },
        deltas: {
          type: 'json',
          description: 'Optional strict Canon/narrative Delta array extracted from this document. Use sourceId as an explicit source anchor id, or leave a Delta sourceAnchorIds array empty to bind it to the generated full-text anchor.',
        },
        sourceEncoding: {
          type: 'string',
          description: 'Optional encoding label reported for the original source bytes.',
        },
        sourceBom: {
          type: 'boolean',
          description: 'Optional flag indicating whether the original source bytes began with a BOM.',
        },
        sourceByteLength: {
          type: 'integer',
          description: 'Optional original source byte length reported before text normalization.',
        },
        sourcePath: {
          type: 'string',
          description: 'Optional Workspace file path whose exact bytes should be retained for byte-preserving publication after author acceptance.',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            packet: { type: 'json', required: true },
          },
        },
        render: (_args, value) => [{
          type: 'text',
          text: JSON.stringify(value.packet, null, 2),
        }],
      },
      presentCall: args => ({
        card: 'generic',
        title: `Import ${args.format} manuscript ${args.unitId}`,
      }),
      presentResult: () => ({
        card: 'generic',
        title: 'Novel import ready for review',
      }),
      execute: async (args, exec) => {
        const agent = exec.agent
        if (agent === undefined) {
          throw new Error('propose_novel_import requires a calling agent (exec.agent was undefined)')
        }
        const cwd = agent.session.header.cwd
        if (cwd === undefined) {
          throw new Error('propose_novel_import requires the calling agent session to have a cwd')
        }
        const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
        if (workspace === undefined) {
          throw new Error(`propose_novel_import found no DSH Workspace for calling agent cwd '${cwd}'`)
        }
        const request = novelTextImportRequestSchema.parse(args)
        this.ctx.novelProject.assertCurrentRevision(workspace.id, request.expectedRevision)
        let sourcePath: string | undefined
        let sourceBytesBase64: string | undefined
        let sourceByteLength = request.sourceByteLength
        if (request.sourcePath !== undefined) {
          const sandboxPolicy = this.ctx.sandboxPolicy.resolve({ session: agent.session })
          const sourceTarget = await this.ctx.fs.resolve(request.sourcePath, {
            cwd: sandboxPolicy.workspaceRoot,
            signal: exec.signal,
          })
          const sourceBytes = await this.ctx.fs.readBytes(
            sourceTarget,
            exec.signal,
            Number.MAX_SAFE_INTEGER,
          )
          sourcePath = sourceTarget.displayPath
          sourceBytesBase64 = Buffer.from(sourceBytes).toString('base64')
          sourceByteLength = sourceBytes.byteLength
        }
        const acceptedText = this.readManuscripts(workspace.id, request.expectedRevision)
          .find(candidate => candidate.manuscript.unitId === request.unitId)
          ?.manuscript.text ?? ''
        const packetId = randomUUID()
        const sourceAnchorId = request.sourceId
        const deltas = request.deltas.map((delta) => {
          const record = typeof delta === 'object' && delta !== null && !Array.isArray(delta)
            ? delta as Record<string, unknown>
            : undefined
          const candidate = record !== undefined
            && Array.isArray(record.sourceAnchorIds)
            && record.sourceAnchorIds.length === 0
            ? { ...record, sourceAnchorIds: [sourceAnchorId] }
            : delta
          return candidate
        })
        const packet = this.ctx.novelProject.parseDraft({
          packetId,
          expectedRevision: request.expectedRevision,
          manuscript: {
            unitId: request.unitId,
            title: request.title,
            text: request.text,
          },
          manuscriptDiff: {
            format: 'unified',
            text: createTwoFilesPatch(
              `accepted/${request.unitId}`,
              `import/${request.unitId}`,
              acceptedText,
              request.text,
              '',
              '',
            ),
          },
          deltas,
          issues: [],
          sourceAnchors: [{
            id: sourceAnchorId,
            sourceId: request.sourceId,
            start: 0,
            end: request.text.length,
            contentHash: createHash('sha256').update(request.text).digest('hex'),
            ...(request.sourceEncoding === undefined
              ? {}
              : { sourceEncoding: request.sourceEncoding }),
            ...(request.sourceBom === undefined
              ? {}
              : { sourceBom: request.sourceBom }),
            ...(sourceByteLength === undefined
              ? {}
              : { sourceByteLength }),
            ...(sourcePath === undefined
              ? {}
              : { sourcePath }),
            ...(sourceBytesBase64 === undefined
              ? {}
              : { sourceBytesBase64 }),
          }],
          provenance: {
            taskId: packetId,
            sessionId: agent.id,
            producer: `novel-import:${request.format}`,
          },
        })
        return { packet: packet as unknown as JsonValue }
      },
    }))

    this.ctx.tools.register(defineTool({
      name: 'publish_novel_manuscript',
      description: 'Write one manuscript unit or one whole book ordered by the accepted narrative hierarchy to an explicit local UTF-8, original-source, EPUB or DOCX destination after a separate stock DSH approval. Publishing never advances Canon.',
      parameters: {
        revision: {
          type: 'integer',
          required: true,
          description: 'The accepted aggregate revision that supplies the manuscript.',
        },
        unitId: {
          type: 'string',
          required: true,
          description: 'The accepted manuscript unit id, or the accepted Book narrative-unit id when scope is book.',
        },
        destination: {
          type: 'string',
          required: true,
          description: 'The explicit local file path that receives the accepted manuscript text.',
        },
        format: {
          type: 'string',
          enum: ['utf8', 'source', 'epub', 'docx'],
          description: 'Optional output format. Omit for UTF-8 text; source writes the exact bytes retained by an accepted import.',
        },
        scope: {
          type: 'string',
          enum: ['unit', 'book'],
          description: 'Optional publication scope. Omit for one manuscript unit; book assembles descendant Chapter manuscripts in accepted hierarchy order.',
        },
        title: {
          type: 'string',
          description: 'Whole-book document title. Omit for one-unit publication.',
        },
        coverPath: {
          type: 'string',
          description: 'Optional Workspace PNG or JPEG used as the EPUB cover.',
        },
        templatePath: {
          type: 'string',
          description: 'Optional Workspace DOCX template containing {{title}} and {{content}} placeholders.',
        },
        author: {
          type: 'string',
          description: 'Optional author name written to EPUB publication metadata.',
        },
        language: {
          type: 'string',
          description: 'Optional language tag written to EPUB publication metadata.',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            revision: { type: 'integer', required: true },
            sourceRevision: { type: 'integer' },
            sourceRevisions: { type: 'array', required: true },
            scope: {
              type: 'string',
              enum: ['unit', 'book'],
              required: true,
            },
            unitId: { type: 'string', required: true },
            unitIds: { type: 'array', required: true },
            title: { type: 'string', required: true },
            destination: { type: 'string', required: true },
            format: {
              type: 'string',
              enum: ['utf8', 'source', 'epub', 'docx'],
              required: true,
            },
            operation: {
              type: 'string',
              enum: ['create', 'update'],
              required: true,
            },
            characters: { type: 'integer', required: true },
            bytes: { type: 'integer', required: true },
            templatePath: { type: 'string' },
          },
        },
        render: (_args, value) => [{
          type: 'text',
          text: value.scope === 'book'
            ? `published accepted R${String(value.revision)} book ${value.unitId} ${JSON.stringify(value.title)} with ${String(value.unitIds.length)} ordered manuscript units to ${value.destination} (${value.operation}, ${value.format}, ${String(value.characters)} characters, ${String(value.bytes)} bytes)`
            : value.format === 'utf8'
              ? `published accepted R${String(value.revision)} manuscript ${value.unitId} ${JSON.stringify(value.title)} from source R${String(value.sourceRevision)} to ${value.destination} (${value.operation}, ${String(value.characters)} characters)`
              : `published accepted R${String(value.revision)} manuscript ${value.unitId} ${JSON.stringify(value.title)} from source R${String(value.sourceRevision)} to ${value.destination} (${value.operation}, ${value.format}, ${String(value.characters)} characters, ${String(value.bytes)} bytes)`,
        }],
      },
      presentCall: args => ({
        card: 'generic',
        kind: 'edit',
        title: `Publish ${args.scope === 'book' ? 'book ' : ''}${args.unitId} to ${args.destination}`,
        locations: [{ path: args.destination }],
      }),
      presentResult: () => ({
        card: 'generic',
        title: 'Accepted novel manuscript published',
      }),
      execute: async (args, exec) => {
        const agent = exec.agent
        if (agent === undefined) {
          throw new Error('publish_novel_manuscript requires a calling agent (exec.agent was undefined)')
        }
        const publication = await this.resolvePublication(
          agent,
          novelPublicationRequestSchema.parse(args),
        )
        const sandboxPolicy = this.ctx.sandboxPolicy.resolve({ session: agent.session })
        const target = await this.ctx.fs.resolve(publication.destination, {
          cwd: sandboxPolicy.workspaceRoot,
          signal: exec.signal,
        })
        let operation: 'create' | 'update'
        let bytes: number
        let templatePath: string | undefined
        if (publication.format === 'utf8') {
          const outcome = await this.ctx.fs.writeText(
            target,
            publication.text,
            undefined,
            exec.signal,
            sandboxPolicy,
          )
          operation = outcome.operation
          bytes = Buffer.byteLength(publication.text, 'utf8')
        } else if (publication.format === 'source') {
          const sourceBytes = Buffer.from(publication.sourceBytesBase64!, 'base64')
          const existing = await this.ctx.fs.stat(target, exec.signal)
          await writeFile(
            this.ctx.fs.processPath(target),
            sourceBytes,
            { signal: exec.signal },
          )
          operation = existing === undefined ? 'create' : 'update'
          bytes = sourceBytes.byteLength
        } else {
          let cover: NovelPublicationCover | undefined
          let template: Uint8Array | undefined
          if (publication.format === 'epub' && publication.coverPath !== undefined) {
            const format = novelPublicationCoverFormat(publication.coverPath)
            const coverTarget = await this.ctx.fs.resolve(publication.coverPath, {
              cwd: sandboxPolicy.workspaceRoot,
              signal: exec.signal,
            })
            cover = {
              ...format,
              bytes: await this.ctx.fs.readBytes(
                coverTarget,
                exec.signal,
                Number.MAX_SAFE_INTEGER,
              ),
            }
          }
          if (publication.format === 'docx' && publication.templatePath !== undefined) {
            const templateTarget = await this.ctx.fs.resolve(publication.templatePath, {
              cwd: sandboxPolicy.workspaceRoot,
              signal: exec.signal,
            })
            template = await this.ctx.fs.readBytes(
              templateTarget,
              exec.signal,
              Number.MAX_SAFE_INTEGER,
            )
            templatePath = templateTarget.displayPath
          }
          const documentBytes = await encodeNovelDocument({
            revision: publication.revision,
            scope: publication.scope,
            unitId: publication.unitId,
            title: publication.title,
            chapters: publication.chapters,
            format: publication.format,
            ...(cover === undefined ? {} : { cover }),
            ...(template === undefined ? {} : { template }),
            ...(publication.author === undefined ? {} : { author: publication.author }),
            ...(publication.language === undefined ? {} : { language: publication.language }),
          })
          const existing = await this.ctx.fs.stat(target, exec.signal)
          await writeFile(
            this.ctx.fs.processPath(target),
            documentBytes,
            { signal: exec.signal },
          )
          operation = existing === undefined ? 'create' : 'update'
          bytes = documentBytes.byteLength
        }
        return {
          revision: publication.revision,
          ...(publication.chapters.length === 1
            ? { sourceRevision: publication.chapters[0]!.sourceRevision }
            : {}),
          sourceRevisions: publication.chapters.map(chapter => ({
            unitId: chapter.unitId,
            revision: chapter.sourceRevision,
          })),
          scope: publication.scope,
          unitId: publication.unitId,
          unitIds: publication.chapters.map(chapter => chapter.unitId),
          title: publication.title,
          destination: target.displayPath,
          format: publication.format,
          operation,
          characters: publication.text.length,
          bytes,
          ...(templatePath === undefined ? {} : { templatePath }),
        }
      },
    }))
    ctx.inject(['systemPrompt'], promptCtx => promptCtx.systemPrompt.section({
      name: 'novel:writing',
      order: 123,
      text: NOVEL_WRITING_GUIDANCE,
    }))
    ctx.inject(['skills'], skillCtx => {
      skillCtx.skills.register(NOVEL_PROSE_WRITER_SKILL)
    })
  }

  /** Resolve an accepted unit/book and optional retained source bytes through domain read services. */
  private async resolvePublication(
    agent: Agent,
    request: NovelPublicationRequest,
  ) {
    const cwd = agent.session.header.cwd
    if (cwd === undefined) {
      throw new Error('publish_novel_manuscript requires the calling agent session to have a cwd')
    }
    const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
    if (workspace === undefined) {
      throw new Error(`publish_novel_manuscript found no DSH Workspace for calling agent cwd '${cwd}'`)
    }
    const manuscripts = this.readManuscripts(workspace.id, request.revision)
    const chapters: readonly NovelPublicationChapter[] = request.scope === 'unit'
      ? (() => {
          const manuscript = manuscripts
            .find(candidate => candidate.manuscript.unitId === request.unitId)
          if (manuscript === undefined) {
            throw new Error(
              `manuscript unit '${request.unitId}' does not exist at accepted revision R${String(request.revision)}`,
            )
          }
          return [{
            unitId: manuscript.manuscript.unitId,
            title: manuscript.manuscript.title,
            text: manuscript.manuscript.text,
            sourceRevision: manuscript.sourceRevision,
          }]
        })()
      : (() => {
          const narrative = this.ctx.novelPlanning.readPlan(workspace.id, request.revision)
          const units = new Map(narrative.units.map(unit => [unit.id, unit] as const))
          const book = units.get(request.unitId)
          if (book?.level !== 'book') {
            throw new Error(
              `narrative Book '${request.unitId}' does not exist at accepted revision R${String(request.revision)}`,
            )
          }
          const projected = new Map(manuscripts.map(manuscript => [
            manuscript.manuscript.unitId,
            manuscript,
          ] as const))
          return narrative.units
            .filter((unit) => {
              if (unit.level !== 'chapter') return false
              let parentId = unit.parentId
              while (parentId !== null) {
                if (parentId === book.id) return true
                parentId = units.get(parentId)?.parentId ?? null
              }
              return false
            })
            .map((unit) => {
              const manuscript = projected.get(unit.id)
              if (manuscript === undefined) {
                throw new Error(
                  `accepted Chapter '${unit.id}' has no manuscript at revision R${String(request.revision)}`,
                )
              }
              return {
                unitId: manuscript.manuscript.unitId,
                title: manuscript.manuscript.title,
                text: manuscript.manuscript.text,
                sourceRevision: manuscript.sourceRevision,
              }
            })
        })()
    const title = request.scope === 'unit'
      ? chapters[0]!.title
      : request.title ?? request.unitId
    const text = request.scope === 'unit'
      ? chapters[0]!.text
      : chapters.map(chapter => `${chapter.title}\n\n${chapter.text}`).join('\n\n')
    let sourceBytesBase64: string | undefined
    if (request.format === 'source') {
      if (request.scope !== 'unit') {
        throw new Error('original-source publication supports one manuscript unit')
      }
      const chapter = chapters[0]!
      const sourceRevision = this.ctx.novelProject.readRevision(workspace.id, chapter.sourceRevision)
      const contentHash = createHash('sha256').update(chapter.text).digest('hex')
      const sourceAnchor = sourceRevision?.sourceAnchors.find(anchor => (
        anchor.start === 0
        && anchor.end === chapter.text.length
        && anchor.contentHash === contentHash
        && anchor.sourceBytesBase64 !== undefined
      ))
      if (sourceAnchor?.sourceBytesBase64 === undefined) {
        throw new Error(
          `manuscript unit '${chapter.unitId}' has no retained original source bytes at source revision R${String(chapter.sourceRevision)}`,
        )
      }
      sourceBytesBase64 = sourceAnchor.sourceBytesBase64
    }
    return {
      revision: request.revision,
      scope: request.scope,
      unitId: request.unitId,
      title,
      text,
      chapters,
      destination: request.destination,
      format: request.format,
      ...(sourceBytesBase64 === undefined ? {} : { sourceBytesBase64 }),
      coverPath: request.coverPath,
      templatePath: request.templatePath,
      author: request.author,
      language: request.language,
    }
  }

  /** Record this proposal against an approved Write scope and end its native tool turn when complete. */
  recordProposal(exec: ToolRunContext, packet: NovelResultPacketDraft, acceptedRevision: number): void {
    recordWritingAutomationProposal(this.ctx, exec, packet, acceptedRevision)
  }

  /** Read accepted manuscript units at exactly this aggregate revision through Canon authority. */
  readManuscripts(workspaceId: WorkspaceId, revision: number): readonly NovelManuscriptProjection[] {
    return this.ctx.novelProject.projectManuscripts(workspaceId, revision)
  }
}

export default NovelWritingService
