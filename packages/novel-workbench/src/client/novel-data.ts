/**
 * The novel data face the workbench surfaces read.
 *
 * The client plugin builds it over the DSH services it binds (the novel-project
 * Client Remote plus the Session and Workspace controllers) and hands it to the
 * left column and the canvas as an injected share. Canon stays in Novel Project;
 * this module only maps what the Remote returns into author-facing rows.
 */
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '@novel-agent/novel-project/remote'
import type {
  AcceptedNovelRevision,
  NovelCanonProjection,
  NovelManuscriptProjection,
  NovelNarrativeProjection,
  NovelPendingProposal,
  NovelProject,
  NovelRelationshipLine,
  NovelRelationshipProjection,
  NovelResultItemDecision,
  NovelResultPacketDraft,
} from '@novel-agent/novel-project/types'
import type { WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { countCharacters, describeDelta, dimensionLabel, severityLabel } from './novel-copy.js'

/** Chapter badge the work tree shows. */
export type NovelChapterStatus = 'accepted' | 'pending' | 'planned'

/** One chapter row in the left column's work tree. */
export interface NovelWorkChapter {
  readonly id: string
  /** 1-based position among the work's chapters in story order. */
  readonly number: number
  readonly title: string
  readonly status: NovelChapterStatus
  /** Unresolved narrative debts this chapter carries. */
  readonly debts: number
}

/** One volume/arc row grouping its chapters. */
export interface NovelWorkGroup {
  readonly id: string
  readonly title: string
  readonly chapters: readonly NovelWorkChapter[]
}

/** Build-side twin of {@link NovelWorkGroup}: the chapter list grows while grouping. */
interface MutableNovelWorkGroup {
  readonly id: string
  readonly title: string
  readonly chapters: NovelWorkChapter[]
}

/** One work's accepted outline: what the works segment renders. */
export interface NovelWorkOutline {
  readonly revision: number
  readonly groups: readonly NovelWorkGroup[]
  readonly chapterCount: number
  readonly pending: number
  readonly debts: number
}

/** Structural input of {@link buildWorkOutline} — exactly what the Remotes answer. */
export interface NovelOutlineInput {
  readonly project: NovelProject
  readonly narrative: NovelNarrativeProjection
  readonly manuscripts: readonly NovelManuscriptProjection[]
  readonly proposals: readonly NovelPendingProposal[]
}

/** The novel data face handed to the workbench surfaces. */
export interface NovelWorkFace {
  /** Accepted outline of one work: volumes, chapters, badges. */
  readonly loadOutline: (workspaceId: WorkspaceId) => Promise<NovelWorkOutline>
  /** Accepted cast and the relationships between them, ready to draw. */
  readonly loadStoryMap: (workspaceId: WorkspaceId) => Promise<NovelStoryMap>
  /** Every unaccepted proposal of one work, mapped to author-facing rows. */
  readonly loadReviews: (workspaceId: WorkspaceId) => Promise<NovelReviewDeck>
  /** What the current decisions would write, without writing anything. */
  readonly previewReview: (
    sessionId: SessionId,
    workspaceId: WorkspaceId,
    packet: NovelResultPacketDraft,
    decisions: readonly NovelResultItemDecision[],
  ) => Promise<NovelReviewImpact>
  /** Write the accepted items and advance the work by one revision. */
  readonly submitReview: (
    sessionId: SessionId,
    workspaceId: WorkspaceId,
    packet: NovelResultPacketDraft,
    decisions: readonly NovelResultItemDecision[],
  ) => Promise<NovelReviewOutcome>
  /** Drop one proposal without writing anything. */
  readonly discardProposal: (workspaceId: WorkspaceId, packetId: string) => Promise<void>
  /** Accepted revisions, newest first. */
  readonly loadHistory: (workspaceId: WorkspaceId) => Promise<readonly NovelRevisionRow[]>
  /** Roll the work back to one accepted revision as a new revision. */
  readonly rollbackTo: (
    sessionId: SessionId,
    workspaceId: WorkspaceId,
    targetRevision: number,
  ) => Promise<NovelReviewOutcome>
  /** Raw accepted structures for the advanced diagnostics panel. */
  readonly loadDiagnostics: (workspaceId: WorkspaceId) => Promise<NovelDiagnostics>
  /** Switch the current thread. */
  readonly openThread: (sessionId: SessionId) => void
  /** Start a new thread inside one work. */
  readonly newThread: (workspaceId: WorkspaceId) => void
}

/** One character node of the story map. */
export interface NovelStoryNode {
  readonly id: string
  readonly label: string
  /** Faction or affiliation the node is coloured by; absent means unaffiliated. */
  readonly group: string | undefined
  /** Unresolved relationship debts touching this character. */
  readonly debts: number
}

/** One relationship line of the story map (one edge per undirected pair). */
export interface NovelStoryEdge {
  readonly id: string
  readonly source: string
  readonly target: string
  /** Author-facing copy for both directions of the pair. */
  readonly label: string
  readonly turns: number
}

/** The story map as the canvas draws it. */
export interface NovelStoryMap {
  readonly revision: number
  readonly nodes: readonly NovelStoryNode[]
  readonly edges: readonly NovelStoryEdge[]
}

/** One proposed setting change, ready for the author's decision. */
export interface NovelReviewItem {
  readonly id: string
  readonly summary: string
}

/** One review issue raised against the proposal. */
export interface NovelReviewIssue {
  readonly id: string
  readonly severityLabel: string
  readonly dimensionLabel: string
  readonly problem: string
  readonly suggestion: string
  readonly anchorCount: number
}

/** One pending proposal as the review screen shows it. */
export interface NovelReviewProposal {
  readonly packetId: string
  readonly expectedRevision: number
  readonly chapterTitle: string
  readonly unitId: string | undefined
  readonly words: number
  readonly text: string
  readonly deltas: readonly NovelReviewItem[]
  readonly issues: readonly NovelReviewIssue[]
  readonly packet: NovelResultPacketDraft
}

/** Every pending proposal of one work plus the revision it would build on. */
export interface NovelReviewDeck {
  readonly acceptedRevision: number
  readonly proposals: readonly NovelReviewProposal[]
}

/** Author-facing impact of the decisions currently staged on the review screen. */
export interface NovelReviewImpact {
  readonly fromRevision: number
  readonly toRevision: number
  readonly manuscriptChanged: boolean
  readonly settingChanges: number
  readonly unacceptedIssues: number
}

/** What one accepted review (or rollback) produced. */
export interface NovelReviewOutcome {
  readonly revision: number
  readonly acceptedSettings: number
  readonly manuscriptAccepted: boolean
}

/** One accepted revision as the history screen lists it. */
export interface NovelRevisionRow {
  readonly revision: number
  readonly title: string
  readonly summary: string
  /** Set when this revision was produced by rolling back to an earlier one. */
  readonly rollbackOf: number | undefined
}

/** Raw structures the diagnostics panel prints verbatim. */
export interface NovelDiagnostics {
  readonly projectId: string
  readonly workspaceId: string
  readonly cwd: string
  readonly acceptedRevision: number
  readonly locks: readonly string[]
  /** The accepted Canon projection as the Host returned it. */
  readonly canonJson: string
}

/** Services the face is built over. */
export interface NovelFaceDeps {
  readonly project: ClientRemote['novelProject']
  readonly sessions: ISessions
  readonly workspace: UiWorkspace
}

const GROUP_LABELS: Readonly<Record<string, string>> = {
  series: '系列',
  book: '书',
  volume: '卷',
  arc: '篇章',
}

const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const UNGROUPED = '未分卷'
const TITLE_LIMIT = 24

/** Build the left column's outline from one accepted revision. */
export function buildWorkOutline(input: NovelOutlineInput): NovelWorkOutline {
  const units = input.narrative.units
  const chapters = units
    .filter(unit => unit.level === 'chapter')
    .slice()
    .sort((left, right) => left.order - right.order)

  const titles = new Map<string, string>()
  const accepted = new Set<string>()
  for (const projected of input.manuscripts) {
    accepted.add(projected.manuscript.unitId)
    titles.set(projected.manuscript.unitId, projected.manuscript.title)
  }
  const pending = new Set<string>()
  for (const proposal of input.proposals) {
    const manuscript = proposal.packet.manuscript
    if (manuscript === undefined) continue
    pending.add(manuscript.unitId)
    if (manuscript.title.trim().length > 0) titles.set(manuscript.unitId, manuscript.title)
  }

  const debts = new Map<string, number>()
  for (const bucket of input.narrative.clocks) {
    for (const debt of bucket.debts) {
      if (debt.status === 'resolved') continue
      debts.set(debt.unitId, (debts.get(debt.unitId) ?? 0) + 1)
    }
  }

  const groups: MutableNovelWorkGroup[] = units
    .filter(unit => unit.level !== 'chapter' && unit.level !== 'scene' && unit.level !== 'beat')
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((unit, index) => ({
      id: unit.id,
      title: groupTitle(unit.level, index),
      chapters: [],
    }))
  const groupById = new Map(groups.map(group => [group.id, group]))

  const ungrouped: NovelWorkChapter[] = []
  const rows: NovelWorkChapter[] = chapters.map((unit, index) => {
    const row: NovelWorkChapter = {
      id: unit.id,
      number: index + 1,
      title: chapterTitle(titles.get(unit.id), unit.objective),
      status: pending.has(unit.id) ? 'pending' : accepted.has(unit.id) ? 'accepted' : 'planned',
      debts: debts.get(unit.id) ?? 0,
    }
    const group = unit.parentId === null ? undefined : groupById.get(unit.parentId)
    if (group === undefined) ungrouped.push(row)
    else group.chapters.push(row)
    return row
  })

  const filled = groups.filter(group => group.chapters.length > 0)
  return {
    revision: input.narrative.revision,
    groups: ungrouped.length === 0
      ? filled
      : [...filled, { id: 'ungrouped', title: UNGROUPED, chapters: ungrouped }],
    chapterCount: rows.length,
    pending: input.proposals.length,
    debts: [...debts.values()].reduce((total, count) => total + count, 0),
  }
}

/**
 * Build the face over live services. One instance per client plugin load: the
 * surfaces receive it as an injected share, so its method identities are stable
 * across renders (effects keyed on them stay put).
 */
export function createNovelWorkFace(deps: NovelFaceDeps): NovelWorkFace {
  return {
    async loadOutline(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const [narrative, manuscripts, proposals] = await Promise.all([
        unwrap(deps.project.projectNarrative(workspaceId, project.acceptedRevision), '读取卷章结构'),
        unwrap(deps.project.projectManuscripts(workspaceId, project.acceptedRevision), '读取正文'),
        unwrap(deps.project.pendingProposals(workspaceId), '读取待审提案'),
      ])
      return buildWorkOutline({ project, narrative, manuscripts, proposals })
    },
    async loadStoryMap(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const [canon, relationships] = await Promise.all([
        unwrap(deps.project.projectCanon(workspaceId, project.acceptedRevision), '读取作品事实'),
        unwrap(deps.project.projectRelationships(workspaceId, project.acceptedRevision), '读取人物关系'),
      ])
      return buildStoryMap({ canon, relationships })
    },
    async loadReviews(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const proposals = await unwrap(deps.project.pendingProposals(workspaceId), '读取待审提案')
      return {
        acceptedRevision: project.acceptedRevision,
        proposals: proposals.map(proposal => buildReviewProposal(proposal)),
      }
    },
    async previewReview(sessionId, workspaceId, packet, decisions) {
      const preview = await unwrap(
        deps.project.previewReview(String(sessionId), workspaceId, { packet, decisions }),
        '计算影响预览',
      )
      return {
        fromRevision: preview.expectedRevision,
        toRevision: preview.projectedRevision,
        manuscriptChanged: preview.impact.manuscripts.added.length > 0
          || preview.impact.manuscripts.changed.length > 0,
        settingChanges: preview.impact.canonFacts.added.length + preview.impact.canonFacts.changed.length,
        unacceptedIssues: decisions.filter(
          decision => decision.itemType === 'issue' && decision.outcome === 'reject',
        ).length,
      }
    },
    async submitReview(sessionId, workspaceId, packet, decisions) {
      const revision = await unwrap(
        deps.project.review(String(sessionId), workspaceId, { packet, decisions }),
        '接受本章',
      )
      return {
        revision: revision.revision,
        acceptedSettings: decisions.filter(
          decision => decision.itemType === 'delta' && decision.outcome === 'accept',
        ).length,
        manuscriptAccepted: decisions.some(
          decision => decision.itemType === 'manuscript' && decision.outcome === 'accept',
        ),
      }
    },
    async discardProposal(workspaceId, packetId) {
      await unwrap(deps.project.discardProposal(workspaceId, packetId), '丢弃提案')
    },
    async loadHistory(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const revisions: NovelRevisionRow[] = []
      for (let revision = 1; revision <= project.acceptedRevision; revision += 1) {
        const accepted = await unwrap(deps.project.read(workspaceId, revision), '读取版本')
        if (accepted === undefined) continue
        revisions.push(describeRevision(accepted))
      }
      return revisions.reverse()
    },
    async rollbackTo(sessionId, workspaceId, targetRevision) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const revision = await unwrap(
        deps.project.rollback(String(sessionId), workspaceId, {
          expectedRevision: project.acceptedRevision,
          targetRevision,
        }),
        '回滚版本',
      )
      return {
        revision: revision.revision,
        acceptedSettings: revision.deltas.length,
        manuscriptAccepted: revision.manuscript !== undefined,
      }
    },
    async loadDiagnostics(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const canon = await unwrap(
        deps.project.projectCanon(workspaceId, project.acceptedRevision),
        '读取作品事实',
      )
      return {
        projectId: project.id,
        workspaceId: String(workspaceId),
        cwd: project.cwd,
        acceptedRevision: project.acceptedRevision,
        locks: project.canonLocks.map(lock => `${lock.kind}/${lock.targetId}`),
        canonJson: JSON.stringify(canon, null, 2),
      }
    },
    openThread(sessionId) {
      deps.sessions.open(sessionId)
    },
    newThread(workspaceId) {
      deps.workspace.startSession(workspaceId)
    },
  }
}

/** Input of {@link buildStoryMap}: the two accepted projections the graph is drawn from. */
export interface NovelStoryMapInput {
  readonly canon: NovelCanonProjection
  readonly relationships: NovelRelationshipProjection
}

/**
 * Map accepted Canon onto the story map. Characters are canonical character-state
 * entities (plus anyone a relationship line names); a line becomes one edge
 * carrying both directions' copy, so the pair keeps its bidirectional meaning.
 */
export function buildStoryMap(input: NovelStoryMapInput): NovelStoryMap {
  const people = new Map<string, { label: string; group: string | undefined }>()
  for (const entity of input.canon.entities) {
    if (entity.kind !== 'character-state') continue
    people.set(entity.targetId, {
      label: readText(entity.fields, ['name', 'display-name', 'full-name']) ?? entity.targetId,
      group: readText(entity.fields, ['faction', 'affiliation']),
    })
  }

  const debts = new Map<string, number>()
  const edges: NovelStoryEdge[] = []
  for (const line of input.relationships.relationships) {
    const [source, target] = line.participants
    for (const id of [source, target]) {
      if (!people.has(id)) people.set(id, { label: id, group: undefined })
    }
    for (const id of [source, target]) {
      if (line.directions.some(direction => unresolvedDebtsOf(direction).length > 0)) {
        debts.set(id, (debts.get(id) ?? 0) + 1)
      }
    }
    edges.push({
      id: line.line,
      source,
      target,
      label: describeLine(line),
      turns: line.directions.reduce((total, direction) => total + turnsOf(direction), 0),
    })
  }

  return {
    revision: input.canon.revision,
    nodes: [...people].map(([id, person]) => ({
      id,
      label: person.label,
      group: person.group,
      debts: debts.get(id) ?? 0,
    })),
    edges,
  }
}

/** One pending proposal as plain author-facing rows. */
export function buildReviewProposal(proposal: NovelPendingProposal): NovelReviewProposal {
  const manuscript = proposal.packet.manuscript
  return {
    packetId: proposal.packetId,
    expectedRevision: proposal.packet.expectedRevision,
    chapterTitle: manuscript?.title ?? '立项提案',
    unitId: manuscript?.unitId,
    words: manuscript === undefined ? 0 : countCharacters(manuscript.text),
    text: manuscript?.text ?? '',
    deltas: proposal.packet.deltas.map(delta => ({
      id: delta.id,
      summary: describeDelta(delta),
    })),
    issues: proposal.packet.issues.map(issue => ({
      id: issue.id,
      severityLabel: severityLabel(issue.severity),
      dimensionLabel: dimensionLabel(issue.dimension),
      problem: issue.problem,
      suggestion: issue.suggestion,
      anchorCount: issue.sourceAnchorIds.length,
    })),
    packet: proposal.packet,
  }
}

/** One accepted revision as the history screen's row. */
export function describeRevision(revision: AcceptedNovelRevision): NovelRevisionRow {
  const parts: string[] = []
  if (revision.manuscript !== undefined) {
    parts.push(`约 ${String(countCharacters(revision.manuscript.text))} 字`)
  }
  parts.push(`${String(revision.deltas.length)} 条设定变更`)
  parts.push(`${String(revision.issues.length)} 个审阅问题`)
  return {
    revision: revision.revision,
    title: revision.manuscript?.title ?? '设定推进',
    summary: parts.join(' · '),
    rollbackOf: revision.rollbackOfRevision,
  }
}

/** The work a session belongs to: its owning Workspace, then the first one. */
export function resolveCurrentWork(
  works: readonly WorkspaceView[],
  sessionId: SessionId | undefined,
): WorkspaceView | undefined {
  return works.find(work => sessionId !== undefined && work.sessionIds.includes(sessionId)) ?? works[0]
}

async function unwrap<T>(pending: Promise<RemoteResult<T>>, action: string): Promise<T> {
  const result = await pending
  if (!result.ok) throw new Error(`${action}失败：${result.error.message}`)
  return result.value
}

function groupTitle(level: string, index: number): string {
  const label = GROUP_LABELS[level] ?? '分卷'
  return `${label}${NUMERALS[index] ?? String(index + 1)}`
}

function chapterTitle(manuscriptTitle: string | undefined, objective: string): string {
  if (manuscriptTitle !== undefined && manuscriptTitle.trim().length > 0) return manuscriptTitle.trim()
  const goal = objective.trim()
  if (goal.length > 0) return truncate(goal, TITLE_LIMIT)
  return ''
}

function truncate(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit)}…`
}

function describeLine(line: NovelRelationshipLine): string {
  const directions = line.directions
    .map(direction => describeDirection(direction.from, direction.to, direction.fields))
    .filter(text => text.length > 0)
  return directions.length === 0 ? '尚未确立关系' : directions.join(' · ')
}

function describeDirection(
  from: string,
  to: string,
  fields: Readonly<Record<string, unknown>>,
): string {
  const state = fields['line-state']
  if (state === null || typeof state !== 'object') return ''
  const record = state as Record<string, unknown>
  const form = typeof record['form'] === 'string' ? record['form'].trim() : ''
  const stage = typeof record['stage'] === 'string' ? record['stage'].trim() : ''
  const head = form.length === 0 ? stage : stage.length === 0 ? form : `${form}（${stage}）`
  return head.length === 0 ? '' : `${from}→${to} ${head}`
}

function turnsOf(direction: { readonly fields: Readonly<Record<string, unknown>> }): number {
  const state = direction.fields['line-state']
  if (state === null || typeof state !== 'object') return 0
  const turns = (state as Record<string, unknown>)['turns']
  return Array.isArray(turns) ? turns.length : 0
}

function unresolvedDebtsOf(direction: {
  readonly fields: Readonly<Record<string, unknown>>
}): readonly unknown[] {
  const state = direction.fields['line-state']
  if (state === null || typeof state !== 'object') return []
  const debts = (state as Record<string, unknown>)['unresolvedDebts']
  return Array.isArray(debts) ? debts : []
}

function readText(fields: Readonly<Record<string, unknown>>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = fields[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return undefined
}
