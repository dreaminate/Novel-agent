/**
 * The novel data face the workbench surfaces read.
 *
 * The client plugin builds it over the DSH services it binds (the novel-project
 * Client Remote plus the Session and Workspace controllers) and hands it to the
 * left column and the canvas as an injected share. Canon stays in Novel Project;
 * this module only maps what the Remote returns into author-facing rows.
 */
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { IWorkspaces, WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '@novel-agent/novel-project/remote'
import type {
  AcceptedNovelRevision,
  NovelCanonEntity,
  NovelChapterControlPack,
  NovelCanonProjection,
  NovelContinuationRequest,
  NovelContinuationResult,
  NovelManuscriptProjection,
  NovelNarrativeUnit,
  NovelNarrativeProjection,
  NovelPendingProposal,
  NovelProject,
  NovelRelationshipLine,
  NovelRelationshipProjection,
  NovelResultItemDecision,
  NovelResultPacketDraft,
} from '@novel-agent/novel-project/types'
import type {} from '@deepseek-ai/dsh-host-plugin-inventory/remote'
import type {} from '@deepseek-ai/dsh-cordis-host-runner/remote'
import type { WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/client'
import {
  chapterDraftPath,
  draftFromRead,
  proposalRequest,
  saveResultFromWrite,
  type ChapterDraft,
  type ChapterDraftSave,
  type ChapterIdentity,
} from './chapter-files.js'
import { countCharacters, describeDelta, dimensionLabel, kindLabel, severityLabel } from './novel-copy.js'

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
  /** Accepted people, factions and both directions of every relationship line. */
  readonly loadCast: (workspaceId: WorkspaceId) => Promise<NovelCastBoard>
  /** One person's accepted 人物档案, or `undefined` when Canon holds no such person. */
  readonly loadPersonFile: (
    workspaceId: WorkspaceId,
    personId: string,
  ) => Promise<NovelPersonFile | undefined>
  /** Accepted promises, clues and mysteries, ready for the 伏笔与线索板. */
  readonly loadClues: (workspaceId: WorkspaceId) => Promise<NovelClueBoard>
  /** Open narrative debts, stalest first, ready for the 未收束债务板. */
  readonly loadDebts: (workspaceId: WorkspaceId) => Promise<NovelDebtBoard>
  /** One chapter's accepted contract, as the 本章合同 sheet renders it. */
  readonly loadContract: (
    workspaceId: WorkspaceId,
    chapterId: string,
  ) => Promise<NovelChapterContractView>
  /** Accepted story events in story-time order, ready for the 时间线. */
  readonly loadTimeline: (workspaceId: WorkspaceId) => Promise<NovelTimeline>
  /** The newest accepted facts the AI writes from, ready for 写作记忆. */
  readonly loadMemory: (workspaceId: WorkspaceId) => Promise<NovelMemoryBoard>
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
  /**
   * Read one chapter's draft file out of the workdir. A draft is the author's
   * own file, not Canon state — nothing here advances the accepted revision.
   * Never throws: an unreadable draft is a state the editor shows.
   */
  readonly loadChapterDraft: (
    workspaceId: WorkspaceId,
    chapter: ChapterIdentity,
  ) => Promise<ChapterDraft>
  /**
   * Write one chapter's draft file. `version` is the token the read returned; a
   * mismatch comes back as a conflict rather than overwriting the author's work.
   */
  readonly saveChapterDraft: (
    workspaceId: WorkspaceId,
    chapter: ChapterIdentity,
    text: string,
    version: string,
  ) => Promise<ChapterDraftSave>
  /**
   * Ask the session's agent to file one chapter's draft as a proposal. The
   * client cannot file a Result Packet itself; the draft reaches Canon only
   * through the proposal this produces.
   */
  readonly submitChapterProposal: (
    sessionId: SessionId,
    chapter: ChapterIdentity,
    revision: number,
    chars: number,
  ) => Promise<void>
  /**
   * Ask the model for one sentence of continuation after `before`. An empty
   * answer and a failed one are the same thing here — no suggestion — so a
   * failure never reaches the author mid-sentence.
   */
  readonly completeSentence: (
    sessionId: SessionId,
    workspaceId: WorkspaceId,
    before: string,
    signal: AbortSignal,
  ) => Promise<string>
  /**
   * Ask for the next stretch of prose, from the author's beats and the draft so
   * far. Unlike the sentence suggestion, a failure comes back as a state the
   * panel can say out loud — the author asked for this one.
   */
  readonly continueWriting: (
    sessionId: SessionId,
    workspaceId: WorkspaceId,
    request: NovelContinuationRequest,
    signal: AbortSignal,
  ) => Promise<NovelContinuationResult>
  /**
   * Character count of one chapter's accepted manuscript, or `undefined` while
   * Canon holds no accepted text for it.
   */
  readonly loadManuscript: (workspaceId: WorkspaceId, unitId: string) => Promise<number | undefined>
  /**
   * The accepted manuscript of one chapter as Canon holds it, or `undefined`
   * while nothing has been accepted for that unit yet.
   */
  readonly loadManuscriptText: (workspaceId: WorkspaceId, unitId: string) => Promise<NovelManuscriptText | undefined>
  /** Roll the work back to one accepted revision as a new revision. */
  readonly rollbackTo: (
    sessionId: SessionId,
    workspaceId: WorkspaceId,
    targetRevision: number,
  ) => Promise<NovelReviewOutcome>
  /** Raw accepted structures for the advanced diagnostics panel. */
  readonly loadDiagnostics: (workspaceId: WorkspaceId) => Promise<NovelDiagnostics>
  /**
   * The deployment's plugin composition, its agent presets, and the
   * model-defined Cordis plugins — the 进阶面's 内核 and Agent panels.
   */
  readonly loadAdvancedPanels: () => Promise<NovelAdvancedPanels>
  /** Switch the current thread. */
  readonly openThread: (sessionId: SessionId) => void
  /** Start a new thread inside one work. */
  readonly newThread: (workspaceId: WorkspaceId) => void
  /**
   * Adopt an existing folder as this profile's work, through the Workspace
   * controller, and answer the Workspace id the Host minted for it.
   */
  readonly adoptWork: (path: string) => Promise<WorkspaceId>
  /** Open the Host's own directory chooser; absent when the author cancelled. */
  readonly pickWorkDirectory: () => Promise<string | undefined>
  /**
   * Send one sentence into a session again — used when a turn failed and the
   * author asks for a retry. It goes through the same submission echo the bar
   * uses, so the Host still owns the queue.
   */
  readonly resend: (sessionId: SessionId, text: string) => Promise<void>
}

/** One chapter's accepted manuscript text, ready to read. */
export interface NovelManuscriptText {
  readonly unitId: string
  readonly title: string
  readonly text: string
}

/** Which of the three lifecycle families one clue-board row belongs to. */
export type NovelClueKind = 'promise' | 'clue' | 'mystery'

/** Where one promise / clue / mystery stands right now. */
export type NovelClueStatus = 'planted' | 'progress' | 'paid'

/** One row of the 伏笔与线索板. */
export interface NovelClueRow {
  readonly id: string
  readonly kind: NovelClueKind
  readonly typeLabel: string
  readonly text: string
  readonly statusLabel: string
  readonly statusKey: NovelClueStatus
  /** Chapter the fact was first accepted in, read off its anchor; 0 when unnamed. */
  readonly chapter: number
  readonly window: string | undefined
  readonly note: string | undefined
  /** First anchor id as Canon recorded it, for the reader's 出处锚点. */
  readonly anchor: string | undefined
}

/** Every accepted promise / clue / mystery of one work. */
export interface NovelClueBoard {
  readonly revision: number
  readonly rows: readonly NovelClueRow[]
}

/** Input of {@link buildClueBoard}: accepted Canon plus the unit order it anchors into. */
export interface NovelClueBoardInput {
  readonly canon: NovelCanonProjection
  readonly narrative: NovelNarrativeProjection
}

/** One open narrative debt of the 未收束债务板. */
export interface NovelDebtRow {
  readonly id: string
  readonly summary: string
  /** Chapters that passed without this debt's clock moving. */
  readonly age: number
  /** Chapter the debt was opened in, in narrative order. */
  readonly chapter: number
  readonly clockLabel: string
  /** Colour key the board gives a stale debt; `neutral` stays unmarked. */
  readonly level: 'warn' | 'info' | 'neutral'
  readonly horizon: string | undefined
  readonly anchor: string | undefined
}

/** Every open debt of one work, stalest first. */
export interface NovelDebtBoard {
  readonly revision: number
  readonly rows: readonly NovelDebtRow[]
}

/** Input of {@link buildDebtBoard}: the narrative projection plus the accepted chapter count. */
export interface NovelDebtBoardInput {
  readonly narrative: NovelNarrativeProjection
  /** Chapters the work has accepted so far; the head every age is measured against. */
  readonly chapterCount: number
}

/** One Loader row of the deployment's plugin composition. */
export interface NovelPluginRow {
  readonly entryId: string | undefined
  readonly moduleName: string
  readonly enabled: boolean
  /** Author-facing lifecycle word for the row's fiber phase. */
  readonly state: string
}

/** One agent preset as the inventory reports it. */
export interface NovelPresetRow {
  readonly id: string
  readonly name: string
  readonly isDefault: boolean
  readonly trust: 'system' | 'user'
  /** Why the preset's composition cannot be read; absent when it can. */
  readonly broken: string | undefined
  /** Plugin rows in composition order. */
  readonly rows: number
  /** Rows whose enablement only a Loader context can decide. */
  readonly conditional: number
}

/** One model-defined Cordis plugin. */
export interface NovelCordisRow {
  readonly pluginId: string
  readonly agentId: string
  readonly packages: number
  /** Label of the version that completed activation, when one did. */
  readonly current: string | undefined
  readonly running: boolean
}

/** The three inventory-backed panels of the advanced surface. */
export interface NovelAdvancedPanels {
  readonly plugins: readonly NovelPluginRow[]
  readonly presets: readonly NovelPresetRow[]
  readonly cordis: readonly NovelCordisRow[]
}

/** Input of {@link buildAdvancedPanels}: the two Host snapshots it reads. */
export interface NovelAdvancedPanelsInput {
  readonly inventory: {
    readonly entries: readonly {
      readonly entryId: string
      readonly moduleName: string
      readonly enabled: boolean
      readonly fiberPhase: string | null
    }[]
    readonly agentPresets?: readonly {
      readonly id: string
      readonly name?: string
      readonly isDefault: boolean
      readonly trust: 'system' | 'user'
      readonly broken?: string
      readonly rows: readonly { readonly enabled: boolean | 'conditional' }[]
    }[]
  }
  readonly cordis: readonly {
    readonly pluginId: string
    readonly agentId: string
    readonly packages: readonly { readonly packageId: string; readonly name: string }[]
    readonly currentPackageId?: string
    readonly activeRun?: { readonly packageId: string }
  }[]
}

/** One accepted aspect of a person, under Canon's own field name. */
export interface NovelPersonAspect {
  readonly field: string
  /** Readable form of the accepted value; arrays join, objects are skipped. */
  readonly value: string
}

/** One accepted story event that names this person as a participant. */
export interface NovelPersonAppearance {
  readonly chapter: number
  readonly label: string
}

/** The 人物档案 of one accepted person. */
export interface NovelPersonFile {
  readonly id: string
  readonly name: string
  readonly faction: string | undefined
  readonly aspects: readonly NovelPersonAspect[]
  /** Relationship lines that name this person, with both directions written out. */
  readonly relations: readonly NovelCastRelation[]
  readonly appearances: readonly NovelPersonAppearance[]
}

/** Input of {@link buildPersonFile}. */
export interface NovelPersonFileInput {
  readonly canon: NovelCanonProjection
  readonly relationships: NovelRelationshipProjection
  readonly personId: string
}

/** One accepted person as the 人物与关系 board lists them. */
export interface NovelCastPerson {
  readonly id: string
  /** Canon's own name for the person, or the entity id when none is recorded. */
  readonly name: string
  /** Faction name the person belongs to; absent when Canon names none. */
  readonly faction: string | undefined
  /**
   * One line an author can read: the recorded status when Canon has one,
   * otherwise this person's first accepted aspect. The AI writes character facts
   * one aspect at a time (`realm`, `constitution`, `persona`, …), so the board
   * must not depend on a fixed set of field names.
   */
  readonly summary: string | undefined
  /** How many aspects Canon currently holds for this person. */
  readonly aspects: number
  /** The aspect names themselves, in Canon's words. */
  readonly aspectNames: readonly string[]
  readonly status: string | undefined
  readonly emotion: string | undefined
}

/** One accepted faction with the people Canon files under it. */
export interface NovelCastFaction {
  readonly id: string
  readonly name: string
  readonly agenda: string | undefined
  readonly people: readonly string[]
}

/** One relationship line with both directions' own state. */
export interface NovelCastRelation {
  readonly id: string
  /** Copy for the direction the line stores first. */
  readonly forward: string
  /** Copy for the opposite direction — never inferred from the first. */
  readonly backward: string
  /** Unresolved debts the line carries, summed over both directions. */
  readonly debts: number
}

/** The cast and its relationships at one accepted revision. */
export interface NovelCastBoard {
  readonly revision: number
  readonly people: readonly NovelCastPerson[]
  readonly factions: readonly NovelCastFaction[]
  readonly relations: readonly NovelCastRelation[]
}

/** Input of {@link buildCastBoard}: the two accepted projections it reads. */
export interface NovelCastBoardInput {
  readonly canon: NovelCanonProjection
  readonly relationships: NovelRelationshipProjection
}

/** One accepted story event as the 时间线 draws it. */
export interface NovelTimelineRow {
  readonly id: string
  /** Story-time label Canon recorded for the event. */
  readonly label: string
  readonly text: string
  readonly chapter: number
  readonly location: string | undefined
  readonly participants: readonly string[]
  /** True for the latest event at the accepted head, the timeline's 当下. */
  readonly current: boolean
}

/** Accepted story events in story-time order. */
export interface NovelTimeline {
  readonly revision: number
  readonly rows: readonly NovelTimelineRow[]
}

/** Input of {@link buildTimeline}: accepted Canon plus the unit order it anchors into. */
export interface NovelTimelineInput {
  readonly canon: NovelCanonProjection
  readonly narrative: NovelNarrativeProjection
}

/** One accepted story fact the AI carries into the next chapter. */
export interface NovelMemoryRow {
  readonly id: string
  readonly text: string
  /** Accepted revision the fact last changed in. */
  readonly revision: number
  readonly sourceLabel: string
  readonly detail: string
}

/** What the AI writes from, newest first. */
export interface NovelMemoryBoard {
  readonly revision: number
  readonly rows: readonly NovelMemoryRow[]
}

/** Input of {@link buildMemoryBoard}: accepted Canon plus how many lines to keep. */
export interface NovelMemoryBoardInput {
  readonly canon: NovelCanonProjection
  /** Upper bound on the summaries the board shows; the prototype keeps three. */
  readonly limit: number
}

/** One row of the 本章合同 sheet: a labelled promise about the chapter in flight. */
export interface NovelContractRow {
  readonly label: string
  readonly value?: string
  readonly items?: readonly string[]
}

/** The chapter contract as the canvas renders it. */
export interface NovelChapterContractView {
  readonly revision: number
  readonly unitId: string
  readonly chapterNumber: number
  readonly title: string
  readonly volumeTitle: string | undefined
  readonly status: string
  readonly rows: readonly NovelContractRow[]
  /** Contract references Canon does not hold at this revision. */
  readonly gaps: readonly string[]
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
  /** Workspace Controller: the one place a folder becomes a registered Workspace. */
  readonly workspaces: IWorkspaces
  /** Host plugin inventory: composition rows and per-preset groups. */
  readonly inventory: ClientRemote['pluginInventory']
  /** Dynamic Cordis runner: the model-defined plugins this deployment holds. */
  readonly cordis: ClientRemote['dynamicCordisRunner']
}

const GROUP_LABELS: Readonly<Record<string, string>> = {
  series: '系列',
  book: '书',
  volume: '卷',
  arc: '篇章',
}

/** The three Canon fact kinds the 伏笔与线索板 lists, with the prototype's words. */
const CLUE_KINDS: Readonly<Record<string, { readonly label: string; readonly order: number }>> = {
  promise: { label: '伏笔', order: 0 },
  clue: { label: '线索', order: 1 },
  mystery: { label: '谜团', order: 2 },
}

/**
 * Accepted lifecycle words mapped to the board's three states. Canon keeps the
 * provider's own vocabulary (`planted`, `progress`, `payoff`, …), so unknown
 * words fall back to 推进中 rather than inventing a fourth state.
 */
const CLUE_STATUS: Readonly<Record<string, { readonly key: NovelClueStatus; readonly label: string }>> = {
  planted: { key: 'planted', label: '已埋' },
  open: { key: 'planted', label: '已埋' },
  seeded: { key: 'planted', label: '已埋' },
  progress: { key: 'progress', label: '推进中' },
  progressing: { key: 'progress', label: '推进中' },
  active: { key: 'progress', label: '推进中' },
  paid: { key: 'paid', label: '已收' },
  payoff: { key: 'paid', label: '已收' },
  resolved: { key: 'paid', label: '已收' },
  retired: { key: 'paid', label: '已收' },
}

/**
 * Map accepted Canon onto the 伏笔与线索板. One row per accepted promise, clue
 * and mystery entity; the chapter and the anchor come from the fact's first
 * source anchor, which is how Canon records where the setup landed.
 */
export function buildClueBoard(input: NovelClueBoardInput): NovelClueBoard {
  const chapterOf = chapterNumbers(input.narrative)
  const rows: NovelClueRow[] = []
  for (const entity of input.canon.entities) {
    const kind = CLUE_KINDS[entity.kind]
    if (kind === undefined) continue
    const status = CLUE_STATUS[readText(entity.fields, ['status', 'state', 'lifecycle']) ?? '']
      ?? { key: 'progress' as const, label: '推进中' }
    const anchor = entity.sourceAnchorIds[0]
    rows.push({
      id: entity.targetId,
      kind: entity.kind as NovelClueKind,
      typeLabel: kind.label,
      text: readText(entity.fields, ['statement', 'summary', 'text', 'title', 'question'])
        ?? entity.targetId,
      statusLabel: status.label,
      statusKey: status.key,
      chapter: anchor === undefined ? 0 : chapterOf(anchor) ?? 0,
      window: readText(entity.fields, ['window', 'payoffWindow', 'horizon']),
      note: readText(entity.fields, ['note', 'reason', 'detail']),
      anchor,
    })
  }
  rows.sort((left, right) => {
    const byKind = (CLUE_KINDS[left.kind]?.order ?? 0) - (CLUE_KINDS[right.kind]?.order ?? 0)
    if (byKind !== 0) return byKind
    return left.chapter - right.chapter
  })
  return { revision: input.canon.revision, rows }
}

/** Chapter id → the 1-based number the reader sees, in narrative order. */
function chapterNumbers(narrative: NovelNarrativeProjection): (unitId: string) => number | undefined {
  const numbers = new Map<string, number>()
  narrative.units
    .filter(unit => unit.level === 'chapter')
    .slice()
    .sort((left, right) => left.order - right.order)
    .forEach((unit, index) => {
      numbers.set(unit.id, index + 1)
    })
  return unitId => numbers.get(unitId.replace(/#.*$/, ''))
}

/** The prototype's words for the narrative clock a debt belongs to. */
const CLOCK_LABELS: Readonly<Record<string, string>> = {
  plot: '情节',
  promise: '伏笔',
  progression: '成长',
  world: '世界',
  character: '人物',
  relationship: '关系',
  mystery: '谜团',
  'reader-knowledge': '读者认知',
  'tension-payoff': '张力',
  ending: '结局',
  object: '物件',
}

/**
 * 未收束债务, stalest first. A debt ages by the chapters that passed while its
 * own clock stood still: the head is the last chapter that clock moved in, or
 * the latest accepted chapter when it never moved at all. Resolved debts are
 * Canon's past, not the author's open work, so they stay off the board.
 */
export function buildDebtBoard(input: NovelDebtBoardInput): NovelDebtBoard {
  const chapterOf = chapterNumbers(input.narrative)
  const rows: NovelDebtRow[] = []
  for (const bucket of input.narrative.clocks) {
    const moved = bucket.entries
      .map(entry => chapterOf(entry.unitId) ?? 0)
      .reduce((highest, value) => (value > highest ? value : highest), 0)
    const head = moved > 0 ? moved : input.chapterCount
    for (const debt of bucket.debts) {
      if (debt.status === 'resolved') continue
      const chapter = chapterOf(debt.unitId) ?? 0
      const age = Math.max(0, head - chapter)
      rows.push({
        id: debt.id,
        summary: debt.summary,
        age,
        chapter,
        clockLabel: CLOCK_LABELS[debt.clock] ?? debt.clock,
        level: age >= 3 ? 'warn' : age >= 2 ? 'info' : 'neutral',
        horizon: debt.horizon,
        anchor: debt.sourceAnchorIds[0],
      })
    }
  }
  rows.sort((left, right) => right.age - left.age || left.chapter - right.chapter)
  return { revision: input.narrative.revision, rows }
}

const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

/**
 * Acceptance gates often repeat the row label (`必须出现：铅封钥匙`). The sheet
 * already says which row it is, so the label is stripped and the gate itself
 * stays readable as one item.
 */
function stripGatePrefix(gate: string, prefix: string): string {
  const trimmed = gate.trim()
  for (const separator of ['：', ':', ' ']) {
    const head = `${prefix}${separator}`
    if (trimmed.startsWith(head)) return trimmed.slice(head.length).trim()
  }
  return trimmed
}

/**
 * 人物与关系: accepted people, the factions they belong to, and every
 * relationship line with **both** directions spelled out — the pair's two
 * directions carry their own state and copy in Canon, so the board never infers
 * one from the other.
 */
/**
 * 人物档案 of one accepted person: what Canon filed about them, the relationship
 * lines that name them (both directions written out), and the accepted story
 * events that list them as a participant — which is how the file knows the
 * chapters they appear in without inventing an appearance index.
 */
/** Author-facing word for one Loader fiber phase. */
const FIBER_PHASE_LABELS: Readonly<Record<string, string>> = {
  active: '运行中',
  loading: '加载中',
  failed: '启动失败',
  unloading: '卸载中',
  pending: '等待依赖',
  initializing: '初始化',
  unobserved: '未运行',
  disposed: '已移除',
}

/**
 * The advanced surface's inventory-backed panels: the deployment's plugin rows,
 * the agent presets with their compositions, and the model-defined Cordis
 * plugins. Everything is read from the Host's own snapshots — this only renames
 * the lifecycle phases into the author's words.
 */
export function buildAdvancedPanels(input: NovelAdvancedPanelsInput): NovelAdvancedPanels {
  const plugins: NovelPluginRow[] = input.inventory.entries.map(entry => ({
    entryId: entry.entryId,
    moduleName: entry.moduleName,
    enabled: entry.enabled,
    state: entry.fiberPhase === null ? '未运行' : FIBER_PHASE_LABELS[entry.fiberPhase] ?? entry.fiberPhase,
  }))
  const presets: NovelPresetRow[] = (input.inventory.agentPresets ?? []).map(preset => ({
    id: preset.id,
    name: preset.name ?? preset.id,
    isDefault: preset.isDefault,
    trust: preset.trust,
    broken: preset.broken,
    rows: preset.rows.length,
    conditional: preset.rows.filter(row => row.enabled === 'conditional').length,
  }))
  const cordis: NovelCordisRow[] = input.cordis.map(row => {
    const packageId = row.activeRun?.packageId ?? row.currentPackageId
    const current = row.packages.find(candidate => candidate.packageId === packageId)
    return {
      pluginId: row.pluginId,
      agentId: row.agentId,
      packages: row.packages.length,
      current: current?.name,
      running: row.activeRun !== undefined,
    }
  })
  return { plugins, presets, cordis }
}

export function buildPersonFile(input: NovelPersonFileInput): NovelPersonFile | undefined {
  const entity = input.canon.entities.find(candidate => (
    candidate.kind === 'character-state' && candidate.targetId === input.personId
  ))
  if (entity === undefined) return undefined

  const factionId = readText(entity.fields, ['faction', 'affiliation', 'sect'])
  const faction = factionId === undefined
    ? undefined
    : input.canon.entities
      .filter(candidate => candidate.kind === 'faction-state' && candidate.targetId === factionId)
      .map(candidate => readText(candidate.fields, ['name', 'title']) ?? candidate.targetId)
      .at(0) ?? factionId

  const aspects: NovelPersonAspect[] = Object.entries(entity.fields)
    .map(([field, value]) => ({ field, value: describeAspect(value) }))
    .filter(aspect => aspect.value.length > 0)

  const relations: NovelCastRelation[] = input.relationships.relationships
    .filter(line => line.participants.includes(input.personId))
    .map(line => {
      const [first, second] = line.directions
      return {
        id: line.line,
        forward: first === undefined ? '尚未确立关系' : describeDirection(first.from, first.to, first.fields),
        backward: second === undefined ? '尚未确立关系' : describeDirection(second.from, second.to, second.fields),
        debts: line.directions.reduce((total, direction) => total + unresolvedDebtsOf(direction).length, 0),
      }
    })

  const appearances: NovelPersonAppearance[] = input.canon.entities
    .filter(candidate => candidate.kind === 'story-event')
    .map(candidate => ({ event: readStoryEvent(candidate.fields) }))
    .filter((entry): entry is { event: StoryEventFields } => entry.event !== undefined)
    .filter(entry => entry.event.participants.includes(input.personId))
    .map(entry => ({ chapter: entry.event.manuscriptOrder, label: entry.event.label }))
    .sort((left, right) => left.chapter - right.chapter)

  return {
    id: entity.targetId,
    name: readText(entity.fields, ['name', 'label', 'title']) ?? entity.targetId,
    faction,
    aspects,
    relations,
    appearances,
  }
}

/** One accepted value read back as a line a person's file can show. */
function describeAspect(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(item => item.length > 0)
      .join(' · ')
  }
  return ''
}

export function buildCastBoard(input: NovelCastBoardInput): NovelCastBoard {
  const factionName = new Map<string, string>()
  for (const entity of input.canon.entities) {
    if (entity.kind !== 'faction-state') continue
    factionName.set(entity.targetId, readText(entity.fields, ['name', 'title']) ?? entity.targetId)
  }

  const people: NovelCastPerson[] = input.canon.entities
    .filter(entity => entity.kind === 'character-state')
    .map(entity => {
      const faction = readText(entity.fields, ['faction', 'affiliation', 'sect'])
      const status = readText(entity.fields, ['status', 'role', 'state'])
      const aspectNames = Object.keys(entity.fields)
      return {
        id: entity.targetId,
        name: readText(entity.fields, ['name', 'label', 'title']) ?? entity.targetId,
        faction: faction === undefined ? undefined : factionName.get(faction) ?? faction,
        summary: status ?? readText(entity.fields, aspectNames),
        aspects: aspectNames.length,
        aspectNames,
        status,
        emotion: readText(entity.fields, ['emotion', 'mood']),
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))

  const factions: NovelCastFaction[] = input.canon.entities
    .filter(entity => entity.kind === 'faction-state')
    .map(entity => ({
      id: entity.targetId,
      name: factionName.get(entity.targetId) ?? entity.targetId,
      agenda: readText(entity.fields, ['agenda', 'goal', 'aim']),
      people: people
        .filter(person => person.faction === (factionName.get(entity.targetId) ?? entity.targetId))
        .map(person => person.id),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))

  const relations: NovelCastRelation[] = input.relationships.relationships.map(line => {
    const [first, second] = line.directions
    return {
      id: line.line,
      forward: first === undefined ? '尚未确立关系' : describeDirection(first.from, first.to, first.fields),
      backward: second === undefined ? '尚未确立关系' : describeDirection(second.from, second.to, second.fields),
      debts: line.directions.reduce((total, direction) => total + unresolvedDebtsOf(direction).length, 0),
    }
  })

  return { revision: input.canon.revision, people, factions, relations }
}

/**
 * 时间线: every accepted story event, ordered by the story time Canon recorded,
 * cross-referenced with the chapter it was accepted in. The last row is the
 * timeline's 当下.
 */
export function buildTimeline(input: NovelTimelineInput): NovelTimeline {
  const chapterOf = chapterNumbers(input.narrative)
  const events = input.canon.entities
    .filter(entity => entity.kind === 'story-event')
    .map(entity => ({ entity, event: readStoryEvent(entity.fields) }))
    .filter((entry): entry is { entity: NovelCanonEntity; event: StoryEventFields } => entry.event !== undefined)
    .sort((left, right) => left.event.startOrder - right.event.startOrder)

  const rows: NovelTimelineRow[] = events.map((entry, index) => ({
    id: entry.entity.targetId,
    label: entry.event.label,
    text: entry.event.label,
    chapter: entry.event.manuscriptOrder > 0
      ? entry.event.manuscriptOrder
      : chapterOf(entry.entity.sourceAnchorIds[0] ?? '') ?? 0,
    location: entry.event.location,
    participants: entry.event.participants,
    current: index === events.length - 1,
  }))
  return { revision: input.canon.revision, rows }
}

/**
 * 写作记忆: the newest accepted facts the AI writes from, newest revision first.
 *
 * Each row is one accepted entity's latest field change — the same facts
 * `projectCanon` returns, read as lines an author can scan, with the revision
 * they took effect in. It is a view of Canon, not a memory store of its own;
 * the retrieval index and its job records stay on the Host side.
 */
export function buildMemoryBoard(input: NovelMemoryBoardInput): NovelMemoryBoard {
  const rows: NovelMemoryRow[] = input.canon.entities
    .map(entity => ({
      id: `${entity.kind}/${entity.targetId}`,
      text: describeEntity(entity),
      revision: entity.sourceRevision,
      sourceLabel: kindLabel(entity.kind),
      detail: describeEntityDetail(entity),
    }))
    .filter(row => row.text.length > 0)
    .sort((left, right) => right.revision - left.revision || left.id.localeCompare(right.id))
  return { revision: input.canon.revision, rows: rows.slice(0, input.limit) }
}

/** One accepted entity read back as a line of prose for the memory board. */
function describeEntityDetail(entity: NovelCanonEntity): string {
  const head = `写入于 R${String(entity.sourceRevision)}`
  const event = entity.kind === 'story-event' ? readStoryEvent(entity.fields) : undefined
  return event === undefined ? head : `${head} · ${event.label}`
}

/** One accepted entity read back as a line of prose for the memory board. */
function describeEntity(entity: NovelCanonEntity): string {
  const event = entity.kind === 'story-event' ? readStoryEvent(entity.fields) : undefined
  if (event !== undefined) {
    const where = event.location === undefined ? '' : `在${event.location}`
    return `${event.label}：${where}${event.participants.length === 0 ? '' : `，涉及 ${event.participants.join(' · ')}`}`
  }
  const text = readText(entity.fields, [
    'statement',
    'summary',
    'text',
    'title',
    'name',
    'objective',
    'value',
  ])
  if (text === undefined) return ''
  return entity.kind === 'character-state' ? `${text}` : text
}

/** The story-event fields the timeline reads, flattened off the accepted value. */
interface StoryEventFields {
  readonly startOrder: number
  readonly label: string
  readonly manuscriptOrder: number
  readonly participants: readonly string[]
  readonly location: string | undefined
}

/** Read one accepted `story-event` entity's typed payload back into plain fields. */
function readStoryEvent(fields: Readonly<Record<string, unknown>>): StoryEventFields | undefined {
  const value = fields['event']
  if (value === null || typeof value !== 'object') return undefined
  const event = value as Record<string, unknown>
  const storyTime = event['storyTime']
  const time = storyTime !== null && typeof storyTime === 'object'
    ? storyTime as Record<string, unknown>
    : {}
  const label = typeof time['label'] === 'string' ? time['label'].trim() : ''
  if (label.length === 0) return undefined
  return {
    startOrder: typeof time['startOrder'] === 'number' ? time['startOrder'] : 0,
    label,
    manuscriptOrder: typeof event['manuscriptOrder'] === 'number' ? event['manuscriptOrder'] : 0,
    participants: Array.isArray(event['participants'])
      ? event['participants'].filter((id): id is string => typeof id === 'string')
      : [],
    location: typeof event['location'] === 'string' && event['location'].trim().length > 0
      ? event['location'].trim()
      : undefined,
  }
}
const UNGROUPED = '未分卷'
const TITLE_LIMIT = 24
/** How many summary lines the 写作记忆 board shows, matching the prototype. */
const MEMORY_LIMIT = 3

/**
 * 本章合同: the contract planning accepted for one chapter, laid out as the
 * prototype's labelled rows. Everything comes from the control pack — the
 * contract itself, the scenes it names, and the references Canon could not
 * resolve at this revision, which the sheet reports as gaps instead of hiding.
 */
export function buildChapterContract(pack: NovelChapterControlPack): NovelChapterContractView {
  const contract = pack.chapter.chapterContract
  const volume = pack.scope.find(unit => unit.level === 'volume')
  const rows: NovelContractRow[] = []
  if (contract !== undefined) {
    rows.push(
      { label: '视角', value: contract.viewpoint },
      { label: '故事时间', value: contract.storyTime },
      { label: '必须出现', items: contract.acceptanceGates.map(gate => stripGatePrefix(gate, '必须出现')) },
      { label: '禁止矛盾', items: contract.prohibitedContradictions },
      {
        label: '长度范围',
        value: `${contract.lengthRange.min.toLocaleString('zh-CN')} – ${contract.lengthRange.max.toLocaleString('zh-CN')} 字`,
      },
      { label: '接受标准', items: contract.styleConstraints },
    )
  } else {
    rows.push({ label: '合同', value: '这一章还没有被接受的合同' })
  }
  rows.push({
    label: '场景',
    items: pack.sceneBeats.length === 0
      ? ['尚未拆分场景']
      : pack.sceneBeats.map(unit => unit.objective.trim().length > 0 ? unit.objective.trim() : unit.id),
  })

  const gaps = [
    ...pack.referenceResolution.plotLines.missing.map(id => `情节线 ${id} 在本修订不存在`),
    ...pack.referenceResolution.promises.missing.map(id => `伏笔 ${id} 在本修订不存在`),
  ]

  return {
    revision: pack.headRevision,
    unitId: pack.chapter.id,
    chapterNumber: pack.chapter.order,
    title: pack.chapter.objective.trim().length > 0 ? pack.chapter.objective.trim() : pack.chapter.id,
    volumeTitle: volume === undefined ? undefined : `卷 ${String(volume.order)}`,
    status: pack.chapter.status,
    rows,
    gaps,
  }
}

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

  // A Chapter sits under arc → volume → book → series, so the tree groups the
  // chapters by their Volume: that is the level an author reads as 卷一/卷二,
  // and grouping by the immediate parent would print one heading per arc.
  const byId = new Map(units.map(unit => [unit.id, unit] as const))
  const groups: MutableNovelWorkGroup[] = []
  const groupById = new Map<string, MutableNovelWorkGroup>()
  const groupingAncestor = (unit: NovelNarrativeUnit): NovelNarrativeUnit | undefined => {
    let parentId = unit.parentId
    let nearest: NovelNarrativeUnit | undefined
    while (parentId !== null) {
      const parent = byId.get(parentId)
      if (parent === undefined) return nearest
      if (parent.level === 'volume') return parent
      nearest ??= parent
      parentId = parent.parentId
    }
    return nearest
  }

  const ungrouped: NovelWorkChapter[] = []
  const rows: NovelWorkChapter[] = chapters.map((unit, index) => {
    const row: NovelWorkChapter = {
      id: unit.id,
      number: index + 1,
      title: chapterTitle(titles.get(unit.id), unit.objective),
      status: pending.has(unit.id) ? 'pending' : accepted.has(unit.id) ? 'accepted' : 'planned',
      debts: debts.get(unit.id) ?? 0,
    }
    const ancestor = groupingAncestor(unit)
    if (ancestor === undefined) {
      ungrouped.push(row)
      return row
    }
    let group = groupById.get(ancestor.id)
    if (group === undefined) {
      group = {
        id: ancestor.id,
        title: groupTitle(ancestor.level, groups.length, ancestor.objective),
        chapters: [],
      }
      groupById.set(ancestor.id, group)
      groups.push(group)
    }
    group.chapters.push(row)
    return row
  })

  return {
    revision: input.narrative.revision,
    groups: ungrouped.length === 0
      ? groups
      : [...groups, { id: 'ungrouped', title: UNGROUPED, chapters: ungrouped }],
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
    async loadClues(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const [canon, narrative] = await Promise.all([
        unwrap(deps.project.projectCanon(workspaceId, project.acceptedRevision), '读取作品事实'),
        unwrap(deps.project.projectNarrative(workspaceId, project.acceptedRevision), '读取卷章结构'),
      ])
      return buildClueBoard({ canon, narrative })
    },
    async loadCast(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const [canon, relationships] = await Promise.all([
        unwrap(deps.project.projectCanon(workspaceId, project.acceptedRevision), '读取作品事实'),
        unwrap(deps.project.projectRelationships(workspaceId, project.acceptedRevision), '读取人物关系'),
      ])
      return buildCastBoard({ canon, relationships })
    },
    async loadPersonFile(workspaceId, personId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const [canon, relationships] = await Promise.all([
        unwrap(deps.project.projectCanon(workspaceId, project.acceptedRevision), '读取作品事实'),
        unwrap(deps.project.projectRelationships(workspaceId, project.acceptedRevision), '读取人物关系'),
      ])
      return buildPersonFile({ canon, relationships, personId })
    },
    async loadDebts(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const [narrative, manuscripts] = await Promise.all([
        unwrap(deps.project.projectNarrative(workspaceId, project.acceptedRevision), '读取卷章结构'),
        unwrap(deps.project.projectManuscripts(workspaceId, project.acceptedRevision), '读取正文'),
      ])
      const chapters = new Set(manuscripts.map(entry => entry.manuscript.unitId))
      return buildDebtBoard({ narrative, chapterCount: chapters.size })
    },
    async loadContract(workspaceId, chapterId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const pack = await unwrap(
        deps.project.chapterControlPack(workspaceId, project.acceptedRevision, chapterId),
        '读取本章合同',
      )
      return buildChapterContract(pack)
    },
    async loadTimeline(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const [canon, narrative] = await Promise.all([
        unwrap(deps.project.projectCanon(workspaceId, project.acceptedRevision), '读取作品事实'),
        unwrap(deps.project.projectNarrative(workspaceId, project.acceptedRevision), '读取卷章结构'),
      ])
      return buildTimeline({ canon, narrative })
    },
    async loadMemory(workspaceId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const canon = await unwrap(
        deps.project.projectCanon(workspaceId, project.acceptedRevision),
        '读取作品事实',
      )
      return buildMemoryBoard({ canon, limit: MEMORY_LIMIT })
    },
    async loadManuscript(workspaceId, unitId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const manuscripts = await unwrap(
        deps.project.projectManuscripts(workspaceId, project.acceptedRevision),
        '读取正文',
      )
      const projection = manuscripts.find(entry => entry.manuscript.unitId === unitId)
      if (projection === undefined) return undefined
      return countCharacters(projection.manuscript.text)
    },
    async loadManuscriptText(workspaceId, unitId) {
      const project = await unwrap(deps.project.open(workspaceId), '打开作品')
      const manuscripts = await unwrap(
        deps.project.projectManuscripts(workspaceId, project.acceptedRevision),
        '读取正文',
      )
      const projection = manuscripts.find(entry => entry.manuscript.unitId === unitId)
      if (projection === undefined) return undefined
      return {
        unitId,
        title: projection.manuscript.title,
        text: projection.manuscript.text,
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
    async loadChapterDraft(workspaceId, chapter) {
      try {
        return draftFromRead(await unwrap(
          deps.project.readChapterFile(workspaceId, chapterDraftPath(chapter)),
          '读取章节草稿',
        ))
      } catch (error) {
        return { state: 'unreadable', message: draftFailure(error) }
      }
    },
    async saveChapterDraft(workspaceId, chapter, text, version) {
      try {
        return saveResultFromWrite(await unwrap(
          deps.project.writeChapterFile(workspaceId, chapterDraftPath(chapter), text, version),
          '保存章节草稿',
        ))
      } catch (error) {
        return { state: 'failed', message: draftFailure(error) }
      }
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
    async loadAdvancedPanels() {
      const [inventory, cordis] = await Promise.all([
        unwrap(deps.inventory.list(), '读取插件清单'),
        unwrap(deps.cordis.inventory(), '读取 Cordis 插件'),
      ])
      return buildAdvancedPanels({
        inventory: inventory as NovelAdvancedPanelsInput['inventory'],
        cordis: cordis as NovelAdvancedPanelsInput['cordis'],
      })
    },
    openThread(sessionId) {
      deps.sessions.open(sessionId)
    },
    newThread(workspaceId) {
      deps.workspace.startSession(workspaceId)
    },
    async adoptWork(path) {
      const workspace = await deps.workspaces.create({ path })
      return workspace.workspaceId
    },
    async pickWorkDirectory() {
      return await deps.workspace.pickDirectory() ?? undefined
    },
    async resend(sessionId, text) {
      const session = deps.sessions.binding(sessionId)?.session
      if (session === undefined) {
        throw new Error('这条线程在 Host 上没有可用的会话绑定，无法重发。')
      }
      const handle = session.beginSubmission({ mode: 'queue', text, images: [] })
      const result = await session.prompt([{ type: 'text', text }], 'queue', undefined, handle.requestId)
      if (!result.ok) throw new Error(`重发失败：${result.error.message}`)
    },
    /**
     * Ask the current session's agent to file one chapter's draft as a proposal.
     *
     * The client cannot file a Result Packet itself — the only path is the
     * `propose_novel_result_packet` tool, which needs a calling agent — so this
     * sends the request into the thread and lets the agent do it. I3.3's whole
     * boundary rests on that: the draft reaches Canon only through a proposal the
     * author then reviews, never through this call.
     */
    async submitChapterProposal(sessionId, chapter, revision, chars) {
      const session = deps.sessions.binding(sessionId)?.session
      if (session === undefined) {
        throw new Error('这条线程在 Host 上没有可用的会话绑定，没法把草稿提交成提案。')
      }
      const text = proposalRequest(chapter, revision, chars)
      const handle = session.beginSubmission({ mode: 'queue', text, images: [] })
      const result = await session.prompt([{ type: 'text', text }], 'queue', undefined, handle.requestId)
      if (!result.ok) throw new Error(`提交失败：${result.error.message}`)
    },
    /**
     * The continuation seam. The host already turns every failure into an empty
     * answer, so this only has to unwrap the transport.
     */
    async completeSentence(sessionId, workspaceId, before, signal) {
      const result = await deps.project.completeSentence(sessionId, workspaceId, before, signal)
      return result.ok ? result.value : ''
    },
    /**
     * The paragraph seam. A transport failure is turned into the same shape as a
     * failed generation, because either way the author is owed a sentence.
     */
    async continueWriting(sessionId, workspaceId, request, signal) {
      const result = await deps.project.continueWriting(sessionId, workspaceId, request, signal)
      return result.ok
        ? result.value
        : { state: 'failed', message: '这次续写没能完成，可以再试一次。' }
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

/** What to show when a draft read or write never reached the host at all. */
function draftFailure(error: unknown): string {
  return error instanceof Error && error.message !== ''
    ? error.message
    : '没能和宿主通信，章节草稿这次没有读/写成功。'
}

/**
 * Heading for one group of chapters: the level's own word plus the numeral, and
 * the unit's accepted objective when planning gave it one — the same shape the
 * prototype's rail uses (`卷一 雾中来客`).
 */
function groupTitle(level: string, index: number, objective: string): string {
  const label = GROUP_LABELS[level] ?? '分卷'
  const ordinal = `${label}${NUMERALS[index] ?? String(index + 1)}`
  const name = objective.trim()
  return name.length === 0 ? ordinal : `${ordinal} · ${truncate(name, TITLE_LIMIT)}`
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
