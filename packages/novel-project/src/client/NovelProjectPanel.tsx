import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type {
  LegacyConversationSlice,
  ToolResultNode,
} from '@deepseek-ai/dsh-client-ui-chat/client'
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace/types'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type {
  AcceptedNovelRevision,
  NovelCausalImpact,
  NovelCharacterArcHypothesisValue,
  NovelCharacterClockValue,
  NovelCanonProjection,
  NovelCanonValue,
  NovelCharacterTrajectory,
  NovelClueLifecycle,
  NovelClueStateValue,
  NovelChapterControlPack,
  NovelClosureLedger,
  NovelCreativeSerializationProfileValue,
  NovelCreativeStyleProfileValue,
  NovelEmotionContinuityLedger,
  NovelEndingClockValue,
  NovelFactionContinuityLedger,
  NovelLocationContinuityLedger,
  NovelObjectContinuityLedger,
  NovelPlotProgressionValue,
  NovelPromiseClockValue,
  NovelProgressionClockValue,
  NovelPostChapterCheckResolution,
  NovelPostChapterCheckValue,
  NovelKnowledgeBoundary,
  NovelKnowledgeStateValue,
  NovelManuscriptProjection,
  NovelMysteryClockValue,
  NovelMysteryLifecycle,
  NovelMysteryStateValue,
  NovelNarrativeProjection,
  NovelPromiseLifecycle,
  NovelPromiseStateValue,
  NovelProgressionLedger,
  NovelProject,
  NovelReaderKnowledgeClockValue,
  NovelReaderContractProfileValue,
  ReaderResponseCandidateComparison,
  ReaderResponseCandidatePersonaComparison,
  ReaderResponseFeedbackCalibration,
  ReaderResponsePersonaComparison,
  ReaderResponseSimulationExperiment,
  ReaderResponseSimulationResult,
  ReaderResponseSimulationRun,
  ReaderResponseVariantComparison,
  NovelRelationshipClockValue,
  NovelRelationshipLineStateValue,
  NovelRelationshipProjection,
  NovelRollingRoadmapResolution,
  NovelRetrievalQuery,
  NovelRetrievalResult,
  NovelRevisionImpact,
  NovelTensionPayoffValue,
  NovelTimelineLedger,
  NovelWorldClockValue,
  NovelWritingMemoryAuthoringContract,
  NovelWritingMemoryEvidence,
  NovelWritingMemoryRecall,
  NovelResultPacketImpactPreview,
  NovelResultPacket,
  NovelResultPacketDraft,
  NovelPendingProposal,
  NovelReviewDraftRequest,
  ResultPacketItemDecision,
  ReviewNovelResultPacket,
  RollbackNovelRevision,
  StoryWorldRoleComparison,
  StoryWorldSharedEncounter,
  StoryWorldSimulationBranchExperiment,
  StoryWorldSimulationBranchSeedComparison,
  StoryWorldSimulationExperiment,
  StoryWorldSimulationResult,
  StoryWorldSimulationRun,
  StoryWorldStateEntry,
} from '../types.js'
import { novelResultPacketDraftSchema } from '../result-packet-schema.js'
import {
  clockLabel,
  countManuscriptCharacters,
  describeDelta,
  describeIssue,
  describeRevisionSummary,
} from './describe.js'

interface ResultPacketDecisionCounts {
  readonly accepted: number
  readonly rejected: number
}

export interface NovelProjectPanelActions {
  openProject: (workspaceId: WorkspaceId) => Promise<RemoteResult<NovelProject>>
  generateReviewDraft: (
    workspaceId: WorkspaceId,
    request: NovelReviewDraftRequest,
    signal?: AbortSignal,
  ) => Promise<RemoteResult<NovelResultPacketDraft>>
  previewReview: (
    workspaceId: WorkspaceId,
    review: ReviewNovelResultPacket,
  ) => Promise<RemoteResult<NovelResultPacketImpactPreview>>
  reviewResultPacket: (
    workspaceId: WorkspaceId,
    review: ReviewNovelResultPacket,
  ) => Promise<RemoteResult<AcceptedNovelRevision>>
  retrieve: (
    workspaceId: WorkspaceId,
    query: NovelRetrievalQuery,
  ) => Promise<RemoteResult<NovelRetrievalResult>>
  readRevision: (
    workspaceId: WorkspaceId,
    revision: number,
  ) => Promise<RemoteResult<AcceptedNovelRevision | undefined>>
  projectCanon: (
    workspaceId: WorkspaceId,
    revision: number,
  ) => Promise<RemoteResult<NovelCanonProjection>>
  projectNarrative: (
    workspaceId: WorkspaceId,
    revision: number,
  ) => Promise<RemoteResult<NovelNarrativeProjection>>
  projectManuscripts: (
    workspaceId: WorkspaceId,
    revision: number,
  ) => Promise<RemoteResult<readonly NovelManuscriptProjection[]>>
  projectRelationships: (
    workspaceId: WorkspaceId,
    revision: number,
  ) => Promise<RemoteResult<NovelRelationshipProjection>>
  rollbackRevision: (
    workspaceId: WorkspaceId,
    command: RollbackNovelRevision,
  ) => Promise<RemoteResult<AcceptedNovelRevision>>
  /** Durable inbox; optional so hosts without the Remote keep the chat fallback. */
  pendingProposals?: (
    workspaceId: WorkspaceId,
  ) => Promise<RemoteResult<readonly NovelPendingProposal[]>>
  /** Drop one durable proposal; optional alongside {@link pendingProposals}. */
  discardProposal?: (
    workspaceId: WorkspaceId,
    packetId: string,
  ) => Promise<RemoteResult<readonly NovelPendingProposal[]>>
}

type NovelProjectPanelProps =
  & PropsRuntime<'conversation.view'>
  & InjectFace<NovelProjectPanelActions>

interface ProjectSnapshot {
  readonly project: NovelProject
  readonly revisions: readonly AcceptedNovelRevision[]
  readonly canon: NovelCanonProjection | null
  readonly narrative: NovelNarrativeProjection | null
  readonly manuscripts: readonly NovelManuscriptProjection[] | null
  readonly relationships: NovelRelationshipProjection | null
}

interface WritingMemoryToolResult {
  readonly projectId: NovelRetrievalResult['projectId']
  readonly workspaceId: NovelRetrievalResult['workspaceId']
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalResult['freshness']
  readonly writingMemory: NovelWritingMemoryRecall
}

type ReviewableNovelResultPacket = NovelResultPacket | NovelResultPacketDraft

type NovelPanelView = 'writing' | 'overview' | 'history' | 'engineering'

const panelStyle: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  height: '100%',
  overflow: 'auto',
  background: 'var(--np-paper)',
  color: 'var(--np-ink)',
  padding: 12,
  fontFamily: '"DM Sans", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
  fontSize: 13.5,
}

const panelCss = `
[data-novel-project-panel] {
  /* ML4T "Applied AI" design system: Picasso blue period + warm amber + paper. */
  --np-navy: #0a1628;
  --np-navy-light: #152238;
  --np-slate: #1a2d4a;
  --np-navy-dark: #050b14;
  --np-amber: #d4a84b;
  --np-amber-light: #e4b85b;
  --np-copper: #c87533;
  --np-paper: #fafaf9;
  --np-warm: #f8f8f6;
  --np-silver: #c0c0c0;
  --np-border: #e8e8e6;
  --np-ink: #334155;
  --np-ink-light: #64748b;
  --np-ink-dark: #1e293b;
  --np-success: #10b981;
  --np-warning: #d4a84b;
  --np-error: #ef4444;
  --np-info: #06b6d4;
  --np-soft: color-mix(in srgb, var(--np-ink) 7%, transparent);
  --np-softer: color-mix(in srgb, var(--np-ink) 4%, transparent);
  --np-serif: "Source Serif 4", "Noto Serif SC", "Songti SC", Georgia, serif;
  --np-mono: "JetBrains Mono", ui-monospace, Consolas, monospace;
  line-height: 1.7;
}
[data-novel-project-panel] header.np-header {
  position: sticky;
  top: -12px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  margin: -12px -12px 0;
  border-radius: 0 0 12px 12px;
  background: linear-gradient(165deg, #0c1220 0%, #111827 40%, #0f1a2e 100%);
  color: #f8f8f6;
  box-shadow: 0 10px 25px -18px rgba(0, 0, 0, .65);
}
[data-novel-project-panel] .np-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--np-serif);
  font-size: 17px;
  letter-spacing: -.01em;
}
[data-novel-project-panel] .np-title strong {
  font-weight: 600;
}
[data-novel-project-panel] .np-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
[data-novel-project-panel] .np-chip {
  padding: 2px 9px;
  border: 1px solid rgba(212, 168, 75, .4);
  border-radius: 999px;
  background: rgba(212, 168, 75, .14);
  color: var(--np-amber);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
[data-novel-project-panel] header.np-header button.np-header-button {
  padding: 4px 12px;
  border-color: rgba(212, 168, 75, .45);
  border-radius: 8px;
  background: rgba(212, 168, 75, .12);
  color: #f8f8f6;
  font-weight: 600;
}
[data-novel-project-panel] header.np-header button.np-header-button:hover:not(:disabled) {
  background: rgba(212, 168, 75, .26);
}
[data-novel-project-panel] nav.np-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 0 2px;
  border-bottom: 1px solid var(--np-border);
}
[data-novel-project-panel] nav.np-nav button {
  padding: 4px 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--np-ink-light);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}
[data-novel-project-panel] nav.np-nav button:hover {
  background: var(--np-soft);
  color: var(--np-ink-dark);
}
[data-novel-project-panel] nav.np-nav button.np-nav-active {
  background: rgba(212, 168, 75, .16);
  border-color: rgba(212, 168, 75, .55);
  color: var(--np-ink-dark);
  font-weight: 600;
}
[data-novel-project-panel] .np-nav-badge {
  margin-left: 5px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(212, 168, 75, .3);
  color: #7a5a12;
  font-size: 11px;
}
[data-novel-project-panel] [data-novel-view] > section,
[data-novel-project-panel] [data-novel-view] > ol {
  border: 1px solid var(--np-border);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(10, 22, 40, .04);
  padding: 14px 16px;
  margin-top: 12px;
  transition: box-shadow .2s ease, border-color .2s ease;
}
[data-novel-project-panel] [data-novel-view] > section:hover,
[data-novel-project-panel] [data-novel-view] > ol:hover {
  box-shadow: 0 8px 22px -14px rgba(10, 22, 40, .35);
}
[data-novel-project-panel] section > strong:first-child,
[data-novel-project-panel] section > summary:first-child {
  font-family: var(--np-serif);
  font-size: 15px;
  color: var(--np-ink-dark);
}
[data-novel-project-panel] section section {
  border-top: 1px solid var(--np-softer);
  padding-top: 10px;
  margin-top: 12px;
}
[data-novel-project-panel] h1,
[data-novel-project-panel] h2,
[data-novel-project-panel] h3 {
  font-family: var(--np-serif);
  font-size: 14.5px;
  margin: 0;
}
[data-novel-project-panel] details {
  border: 1px solid var(--np-border);
  border-radius: 10px;
  padding: 6px 10px;
  margin-top: 8px;
  background: var(--np-warm);
}
[data-novel-project-panel] details[open] {
  background: #fff;
}
[data-novel-project-panel] summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--np-ink-dark);
}
[data-novel-project-panel] button {
  border: 1px solid var(--np-border);
  border-radius: 8px;
  background: #fff;
  color: var(--np-ink-dark);
  font-weight: 500;
  transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
[data-novel-project-panel] button:hover:not(:disabled) {
  border-color: rgba(212, 168, 75, .6);
  background: rgba(212, 168, 75, .08);
}
[data-novel-project-panel] button:disabled {
  opacity: .5;
  cursor: default;
}
[data-novel-project-panel] input:focus-visible,
[data-novel-project-panel] select:focus-visible,
[data-novel-project-panel] textarea:focus-visible,
[data-novel-project-panel] button:focus-visible {
  outline: 2px solid rgba(212, 168, 75, .75);
  outline-offset: 1px;
}
[data-novel-project-panel] pre {
  background: var(--np-navy);
  color: #f8f8f6;
  border-radius: 10px;
  padding: 10px 12px;
  overflow: auto;
  max-height: 320px;
}
[data-novel-project-panel] code {
  font-family: var(--np-mono);
  font-size: 12px;
}
[data-novel-project-panel] a {
  color: var(--np-copper);
}
[data-novel-project-panel] .np-proposal {
  border-top: none;
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px solid var(--np-border);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 22px -18px rgba(10, 22, 40, .45);
}
[data-novel-project-panel] .np-proposal-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
[data-novel-project-panel] .np-proposal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.6rem;
  height: 2.6rem;
  padding: 0 8px;
  border-radius: 8px;
  background: var(--np-navy);
  color: var(--np-warm);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
[data-novel-project-panel] .np-proposal-title strong {
  font-family: var(--np-serif);
  font-size: 16px;
  color: var(--np-ink-dark);
}
[data-novel-project-panel] .np-proposal-meta {
  margin-top: 2px;
  color: var(--np-ink-light);
  font-size: 12px;
}
[data-novel-project-panel] .np-proposal-lines {
  margin: 10px 0 0;
  padding-left: 20px;
}
[data-novel-project-panel] .np-proposal-lines li {
  margin-top: 4px;
}
[data-novel-project-panel] .np-proposal-suggestion {
  color: var(--np-ink-light);
  font-size: 12.5px;
}
[data-novel-project-panel] .np-manuscript {
  margin-top: 12px;
  padding: 16px 18px;
  border: 1px solid var(--np-border);
  border-radius: 12px;
  background: var(--np-warm);
  font-family: var(--np-serif);
  font-size: 14.5px;
  line-height: 1.95;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
[data-novel-project-panel] .np-proposal-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
[data-novel-project-panel] button.np-btn-amber {
  padding: 6px 14px;
  border-color: var(--np-amber);
  background: var(--np-amber);
  color: var(--np-navy);
  font-weight: 700;
}
[data-novel-project-panel] button.np-btn-amber:hover:not(:disabled) {
  border-color: var(--np-amber-light);
  background: var(--np-amber-light);
}
[data-novel-project-panel] .np-impact {
  border-top: none;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(212, 168, 75, .5);
  border-radius: 10px;
  background: rgba(212, 168, 75, .1);
}
[data-novel-project-panel] .np-impact-actions {
  margin-top: 8px;
}
[data-novel-project-panel] .np-continue-hint {
  margin-left: 8px;
  color: var(--np-ink-light);
  font-size: 12px;
}
[data-novel-project-panel] .np-muted {
  color: var(--np-ink-light);
  font-size: 12.5px;
}
[data-novel-project-panel] .np-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 10px;
}
[data-novel-project-panel] .np-stat {
  padding: 10px 12px;
  border: 1px solid var(--np-border);
  border-radius: 10px;
  background: var(--np-warm);
  text-align: center;
}
[data-novel-project-panel] .np-stat-value {
  display: block;
  font-family: var(--np-serif);
  font-size: 26px;
  font-weight: 600;
  color: var(--np-amber);
  line-height: 1.1;
}
[data-novel-project-panel] .np-stat-label {
  display: block;
  margin-top: 4px;
  color: var(--np-ink-light);
  font-size: 12px;
}
[data-novel-project-panel] .np-chapter-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}
[data-novel-project-panel] .np-chapter-list li {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid var(--np-softer);
}
[data-novel-project-panel] .np-chapter-list li:first-child {
  border-top: none;
}
[data-novel-project-panel] .np-chapter-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 8px;
  background: var(--np-navy);
  color: var(--np-warm);
  font-size: 12px;
  font-weight: 700;
}
[data-novel-project-panel] .np-chapter-body strong {
  font-family: var(--np-serif);
  font-size: 14px;
}
[data-novel-project-panel] .np-chapter-meta,
[data-novel-project-panel] .np-chapter-objective {
  color: var(--np-ink-light);
  font-size: 12.5px;
}
[data-novel-project-panel] .np-debt-list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}
[data-novel-project-panel] .np-debt-list li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 0;
  border-top: 1px solid var(--np-softer);
}
[data-novel-project-panel] .np-debt-list li:first-child {
  border-top: none;
}
[data-novel-project-panel] .np-history {
  margin: 0;
  padding: 0;
  list-style: none;
}
[data-novel-project-panel] .np-history-row {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--np-softer);
}
[data-novel-project-panel] .np-history-row:first-child {
  border-top: none;
}
[data-novel-project-panel] .np-history-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 2.2rem;
  height: 1.9rem;
  padding: 0 6px;
  border-radius: 8px;
  background: var(--np-navy);
  color: var(--np-warm);
  font-size: 12px;
  font-weight: 700;
}
[data-novel-project-panel] .np-history-body {
  min-width: 0;
  flex: 1 1 auto;
}
[data-novel-project-panel] .np-history-summary {
  font-weight: 600;
  color: var(--np-ink-dark);
}
[data-novel-project-panel] .np-history-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
[data-novel-project-panel] .np-history-audit {
  margin-top: 6px;
}
[data-novel-project-panel] [role="alert"] {
  margin: 10px 0 0;
  padding: 8px 10px;
  border: 1px solid rgba(239, 68, 68, .45);
  border-radius: 10px;
  background: rgba(239, 68, 68, .08);
  color: #991b1b;
}
`

const buttonStyle: CSSProperties = {
  border: '1px solid var(--np-border, rgba(127,127,127,.35))',
  borderRadius: 8,
  background: 'var(--np-paper, #fff)',
  color: 'inherit',
  cursor: 'pointer',
  padding: '4px 10px',
}

const packetFieldStyle: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 110,
  resize: 'vertical',
  border: '1px solid var(--np-border, rgba(127,127,127,.35))',
  borderRadius: 10,
  background: 'var(--np-warm, #fff)',
  color: 'inherit',
  padding: 10,
  fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace',
  fontSize: 12,
}

const selectStyle: CSSProperties = {
  boxSizing: 'border-box',
  maxWidth: '100%',
  border: '1px solid var(--np-border, rgba(127,127,127,.35))',
  borderRadius: 8,
  background: 'var(--np-warm, #fff)',
  color: 'inherit',
  padding: '4px 8px',
}

export function NovelProjectPanel({
  sessionId,
  useChat,
  useWorkspaces,
  openProject,
  generateReviewDraft,
  previewReview,
  reviewResultPacket,
  retrieve,
  readRevision,
  projectCanon,
  projectNarrative,
  projectManuscripts,
  projectRelationships,
  rollbackRevision,
  pendingProposals,
  discardProposal,
  inputActions,
}: NovelProjectPanelProps) {
  const writeProposal = useChat(chat => latestNovelResultPacketProposal(chat.legacy))
  const writeProposalText = writeProposal === null
    ? null
    : textContent(writeProposal)
  const writingMemoryMeta = useChat(chat => latestWritingMemoryMetadata(chat.legacy))
  const writingMemoryCall = useChat(chat => latestWritingMemoryCall(chat.legacy))
  const writingMemoryArgs = writingMemoryCall?.call?.argsRaw
  const [rehydratedWritingMemory, setRehydratedWritingMemory] = useState<WritingMemoryToolResult | null>(null)
  const writingMemoryResult = writingMemoryMeta ?? rehydratedWritingMemory
  const storyWorldSimulation = useChat(chat => latestStoryWorldSimulationResult(chat.legacy))
  const readerResponseSimulation = useChat(chat => latestReaderResponseSimulationResult(chat.legacy))
  const workspaceId = useWorkspaces(state =>
    state.items.find(item => item.sessionIds.includes(sessionId))?.workspaceId)
  useEffect(() => {
    setRehydratedWritingMemory(null)
    if (workspaceId === undefined || writingMemoryArgs === undefined) return
    let active = true
    // DSH may spill rendered Tool text; reconstruct the original revision over
    // the existing Remote instead of parsing a truncated model-facing preview.
    void retrieve(workspaceId, JSON.parse(writingMemoryArgs) as NovelRetrievalQuery).then(result => {
      if (!active || !result.ok) return
      if (result.value.writingMemory === undefined) return
      setRehydratedWritingMemory({
        projectId: result.value.projectId,
        workspaceId: result.value.workspaceId,
        revision: result.value.revision,
        headRevision: result.value.headRevision,
        freshness: result.value.freshness,
        writingMemory: result.value.writingMemory,
      })
    }, () => undefined)
    return () => { active = false }
  }, [retrieve, workspaceId, sessionId, writingMemoryCall?.seq, writingMemoryArgs])
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [rollingBack, setRollingBack] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [generatingReview, setGeneratingReview] = useState(false)
  const [reviewUnitId, setReviewUnitId] = useState('')
  const [reviewFocus, setReviewFocus] = useState('')
  const [packetText, setPacketText] = useState('')
  const [reviewPacket, setReviewPacket] = useState<ReviewableNovelResultPacket | null>(null)
  const [itemDecisions, setItemDecisions] = useState<
    Readonly<Record<string, ResultPacketItemDecision['outcome']>>
  >({})
  const [itemDecisionReasons, setItemDecisionReasons] = useState<
    Readonly<Record<string, string>>
  >({})
  const [resultPacketImpact, setResultPacketImpact] =
    useState<NovelResultPacketImpactPreview | null>(null)
  const [previewingResultPacket, setPreviewingResultPacket] = useState(false)
  const [revisionComparison, setRevisionComparison] = useState<NovelRevisionImpact | null>(null)
  const [comparingRevision, setComparingRevision] = useState<number | null>(null)
  const [closureScopeId, setClosureScopeId] = useState('')
  const [remainingChapterBudget, setRemainingChapterBudget] = useState('')
  const [endingClosure, setEndingClosure] = useState<{
    readonly revision: number
    readonly ledger: NovelClosureLedger
  } | null>(null)
  const [buildingEndingClosure, setBuildingEndingClosure] = useState(false)
  const [causalImpactEventId, setCausalImpactEventId] = useState('')
  const [causalImpact, setCausalImpact] = useState<{
    readonly revision: number
    readonly impact: NovelCausalImpact
  } | null>(null)
  const [tracingCausalImpact, setTracingCausalImpact] = useState(false)
  const [chapterControlPackTargetId, setChapterControlPackTargetId] = useState('')
  const [chapterControlPack, setChapterControlPack] = useState<NovelChapterControlPack | null>(null)
  const [buildingChapterControlPack, setBuildingChapterControlPack] = useState(false)
  const [roadmapTargetId, setRoadmapTargetId] = useState('')
  const [roadmapResolution, setRoadmapResolution] = useState<NovelRollingRoadmapResolution | null>(null)
  const [buildingRoadmapResolution, setBuildingRoadmapResolution] = useState(false)
  const [characterTrajectoryId, setCharacterTrajectoryId] = useState('')
  const [characterTrajectory, setCharacterTrajectory] = useState<NovelCharacterTrajectory | null>(null)
  const [buildingCharacterTrajectory, setBuildingCharacterTrajectory] = useState(false)
  const [clueLifecycleId, setClueLifecycleId] = useState('')
  const [clueLifecycle, setClueLifecycle] = useState<NovelClueLifecycle | null>(null)
  const [buildingClueLifecycle, setBuildingClueLifecycle] = useState(false)
  const [promiseLifecycleId, setPromiseLifecycleId] = useState('')
  const [promiseLifecycle, setPromiseLifecycle] = useState<NovelPromiseLifecycle | null>(null)
  const [buildingPromiseLifecycle, setBuildingPromiseLifecycle] = useState(false)
  const [mysteryLifecycleId, setMysteryLifecycleId] = useState('')
  const [mysteryLifecycle, setMysteryLifecycle] = useState<NovelMysteryLifecycle | null>(null)
  const [buildingMysteryLifecycle, setBuildingMysteryLifecycle] = useState(false)
  const [progressionCharacterId, setProgressionCharacterId] = useState('')
  const [progressionLedger, setProgressionLedger] = useState<NovelProgressionLedger | null>(null)
  const [buildingProgressionLedger, setBuildingProgressionLedger] = useState(false)
  const [factionId, setFactionId] = useState('')
  const [factionContinuity, setFactionContinuity] = useState<NovelFactionContinuityLedger | null>(null)
  const [buildingFactionContinuity, setBuildingFactionContinuity] = useState(false)
  const [locationId, setLocationId] = useState('')
  const [locationContinuity, setLocationContinuity] = useState<NovelLocationContinuityLedger | null>(null)
  const [buildingLocationContinuity, setBuildingLocationContinuity] = useState(false)
  const [objectId, setObjectId] = useState('')
  const [objectContinuity, setObjectContinuity] = useState<NovelObjectContinuityLedger | null>(null)
  const [buildingObjectContinuity, setBuildingObjectContinuity] = useState(false)
  const [emotionCharacterId, setEmotionCharacterId] = useState('')
  const [emotionContinuity, setEmotionContinuity] = useState<NovelEmotionContinuityLedger | null>(null)
  const [buildingEmotionContinuity, setBuildingEmotionContinuity] = useState(false)
  const [knowledgeBoundarySubjectId, setKnowledgeBoundarySubjectId] = useState('')
  const [knowledgeBoundary, setKnowledgeBoundary] = useState<NovelKnowledgeBoundary | null>(null)
  const [buildingKnowledgeBoundary, setBuildingKnowledgeBoundary] = useState(false)
  const [timelineParticipantId, setTimelineParticipantId] = useState('')
  const [timelineLedger, setTimelineLedger] = useState<NovelTimelineLedger | null>(null)
  const [buildingTimelineLedger, setBuildingTimelineLedger] = useState(false)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [panelView, setPanelView] = useState<NovelPanelView>('writing')
  const [pendingInbox, setPendingInbox] = useState<readonly NovelPendingProposal[]>([])
  const mountedRef = useRef(false)
  const operationEpochRef = useRef(0)
  const operationBusyRef = useRef(false)
  const workspaceIdRef = useRef<WorkspaceId | undefined>(undefined)
  const reviewAbortRef = useRef<AbortController | null>(null)
  const resultPacketPreviewEpochRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      reviewAbortRef.current?.abort()
      resultPacketPreviewEpochRef.current += 1
    }
  }, [])

  useEffect(() => {
    const workspaceChanged = workspaceIdRef.current !== workspaceId
    workspaceIdRef.current = workspaceId
    reviewAbortRef.current?.abort()
    reviewAbortRef.current = null
    setGeneratingReview(false)
    resultPacketPreviewEpochRef.current += 1
    setResultPacketImpact(null)
    setPreviewingResultPacket(false)
    setRevisionComparison(null)
    setComparingRevision(null)
    setEndingClosure(null)
    setBuildingEndingClosure(false)
    setCausalImpact(null)
    setTracingCausalImpact(false)
    setChapterControlPack(null)
    setBuildingChapterControlPack(false)
    setRoadmapResolution(null)
    setBuildingRoadmapResolution(false)
    setCharacterTrajectory(null)
    setBuildingCharacterTrajectory(false)
    setClueLifecycle(null)
    setBuildingClueLifecycle(false)
    setPromiseLifecycle(null)
    setBuildingPromiseLifecycle(false)
    setMysteryLifecycle(null)
    setBuildingMysteryLifecycle(false)
    setProgressionLedger(null)
    setBuildingProgressionLedger(false)
    setFactionContinuity(null)
    setBuildingFactionContinuity(false)
    setLocationContinuity(null)
    setBuildingLocationContinuity(false)
    setObjectContinuity(null)
    setBuildingObjectContinuity(false)
    setEmotionContinuity(null)
    setBuildingEmotionContinuity(false)
    setKnowledgeBoundary(null)
    setBuildingKnowledgeBoundary(false)
    setTimelineLedger(null)
    setBuildingTimelineLedger(false)
    if (workspaceId === undefined) {
      operationEpochRef.current += 1
      operationBusyRef.current = false
      setSnapshot(null)
      setStatus('idle')
      setMessage(null)
      setRollingBack(false)
      setAccepting(false)
      setPacketText('')
      setReviewPacket(null)
      setPendingInbox([])
      setItemDecisions({})
      setItemDecisionReasons({})
      setReviewUnitId('')
      setReviewFocus('')
      setClosureScopeId('')
      setRemainingChapterBudget('')
      setCausalImpactEventId('')
      setChapterControlPackTargetId('')
      setRoadmapTargetId('')
      setCharacterTrajectoryId('')
      setClueLifecycleId('')
      setPromiseLifecycleId('')
      setMysteryLifecycleId('')
      setProgressionCharacterId('')
      setFactionId('')
      setLocationId('')
      setObjectId('')
      setEmotionCharacterId('')
      setKnowledgeBoundarySubjectId('')
      setTimelineParticipantId('')
      return
    }

    const operationEpoch = operationEpochRef.current + 1
    operationEpochRef.current = operationEpoch
    operationBusyRef.current = true
    setRollingBack(false)
    setAccepting(false)
    if (workspaceChanged) {
      setSnapshot(null)
      setPacketText('')
      setReviewPacket(null)
      setPendingInbox([])
      setItemDecisions({})
      setItemDecisionReasons({})
      setReviewUnitId('')
      setReviewFocus('')
      setClosureScopeId('')
      setRemainingChapterBudget('')
      setCausalImpactEventId('')
      setChapterControlPackTargetId('')
      setRoadmapTargetId('')
      setCharacterTrajectoryId('')
      setClueLifecycleId('')
      setPromiseLifecycleId('')
      setMysteryLifecycleId('')
      setProgressionCharacterId('')
      setFactionId('')
      setLocationId('')
      setObjectId('')
      setEmotionCharacterId('')
      setKnowledgeBoundarySubjectId('')
      setTimelineParticipantId('')
    }
    setStatus('loading')
    setMessage(null)
    if (pendingProposals !== undefined) {
      void pendingProposals(workspaceId).then(result => {
        if (operationEpoch !== operationEpochRef.current || !result.ok) return
        setPendingInbox(result.value)
      }, () => undefined)
    }
    void loadSnapshot(
      workspaceId,
      openProject,
      readRevision,
      projectCanon,
      projectNarrative,
      projectManuscripts,
      projectRelationships,
    ).then(
      (result) => {
        if (operationEpoch !== operationEpochRef.current) return
        operationBusyRef.current = false
        if (!result.ok) {
          setSnapshot(null)
          setStatus('error')
          setMessage(result.message)
          return
        }
        setSnapshot(result.value)
        setStatus('ready')
      },
      (error: unknown) => {
        if (operationEpoch !== operationEpochRef.current) return
        operationBusyRef.current = false
        setSnapshot(null)
        setStatus('error')
        setMessage(`小说工作台刷新失败：${errorMessage(error)}`)
      },
    )
    return () => {
      operationEpochRef.current += 1
      operationBusyRef.current = false
    }
  }, [
    openProject,
    projectCanon,
    projectNarrative,
    projectManuscripts,
    projectRelationships,
    pendingProposals,
    readRevision,
    reloadVersion,
    workspaceId,
  ])

  const acceptedRevision = snapshot?.project.acceptedRevision
  const inboxProposal = acceptedRevision === undefined
    ? undefined
    : pendingInbox.find(proposal => proposal.packet.expectedRevision === acceptedRevision)
  useEffect(() => {
    if (acceptedRevision === undefined) return
    if (inboxProposal !== undefined) {
      setReviewPacket(inboxProposal.packet)
      setItemDecisions({})
      setItemDecisionReasons({})
      resultPacketPreviewEpochRef.current += 1
      setResultPacketImpact(null)
      setPreviewingResultPacket(false)
      setMessage(`提案 ${inboxProposal.packetId} 已生成，等待作者审阅`)
      return
    }
    if (writeProposalText === null) return
    const packet = parseResultPacketJson(writeProposalText)
    if (packet.expectedRevision !== acceptedRevision) return
    setReviewPacket(packet)
    setItemDecisions({})
    setItemDecisionReasons({})
    resultPacketPreviewEpochRef.current += 1
    setResultPacketImpact(null)
    setPreviewingResultPacket(false)
    setMessage(`提案 ${packet.packetId} 已生成，等待作者审阅`)
  }, [acceptedRevision, inboxProposal?.packetId, writeProposal?.seq, writeProposalText])

  if (workspaceId === undefined) return null

  const selectedReviewUnitId = snapshot?.manuscripts?.some(
    projected => projected.manuscript.unitId === reviewUnitId,
  ) === true
    ? reviewUnitId
    : snapshot?.manuscripts?.[0]?.manuscript.unitId ?? ''
  const closureScopes = snapshot?.narrative?.units.filter(
    unit => unit.level === 'book' || unit.level === 'series',
  ) ?? []
  const selectedClosureScopeId = closureScopes.some(unit => unit.id === closureScopeId)
    ? closureScopeId
    : closureScopes[0]?.id ?? ''
  const parsedRemainingChapterBudget = Number(remainingChapterBudget)
  const remainingChapterBudgetValid = Number.isInteger(parsedRemainingChapterBudget)
    && parsedRemainingChapterBudget > 0
  const causalImpactEvents = snapshot?.canon?.entities.filter(
    entity => entity.kind === 'story-event',
  ) ?? []
  const selectedCausalImpactEventId = causalImpactEvents.some(
    event => event.targetId === causalImpactEventId,
  )
    ? causalImpactEventId
    : causalImpactEvents[0]?.targetId ?? ''
  const chapterControlPackTargets = snapshot?.narrative?.units.filter(
    unit => unit.level === 'chapter',
  ) ?? []
  const selectedChapterControlPackTargetId = chapterControlPackTargets.some(
    chapter => chapter.id === chapterControlPackTargetId,
  )
    ? chapterControlPackTargetId
    : chapterControlPackTargets[0]?.id ?? ''
  const chapterControlPackChapterId = chapterControlPack?.chapter.id
  const postChapterCheckFact = chapterControlPack?.scopedCanonFacts.find(fact => (
    fact.kind === 'chapter-state'
    && fact.targetId === chapterControlPackChapterId
    && fact.field === 'post-check'
  ))
  const postChapterCheck = postChapterCheckFact?.value as NovelPostChapterCheckValue | undefined
  const roadmapTargets = snapshot?.canon?.entities
    .filter(entity => entity.kind === 'roadmap' && entity.fields.plan !== undefined)
    .map(entity => entity.targetId) ?? []
  const selectedRoadmapTargetId = roadmapTargets.includes(roadmapTargetId)
    ? roadmapTargetId
    : roadmapTargets[0] ?? ''
  const characterTrajectoryTargets = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'character-state')
      .map(fact => fact.targetId) ?? [],
  )].sort()
  const selectedCharacterTrajectoryId = characterTrajectoryTargets.includes(characterTrajectoryId)
    ? characterTrajectoryId
    : characterTrajectoryTargets[0] ?? ''
  const clueLifecycleTargets = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'clue')
      .map(fact => fact.targetId) ?? [],
  )].sort()
  const selectedClueLifecycleId = clueLifecycleTargets.includes(clueLifecycleId)
    ? clueLifecycleId
    : clueLifecycleTargets[0] ?? ''
  const promiseLifecycleTargets = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'promise')
      .map(fact => fact.targetId) ?? [],
  )].sort()
  const selectedPromiseLifecycleId = promiseLifecycleTargets.includes(promiseLifecycleId)
    ? promiseLifecycleId
    : promiseLifecycleTargets[0] ?? ''
  const mysteryLifecycleTargets = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'mystery' && fact.field === 'state')
      .map(fact => fact.targetId) ?? [],
  )].sort()
  const selectedMysteryLifecycleId = mysteryLifecycleTargets.includes(mysteryLifecycleId)
    ? mysteryLifecycleId
    : mysteryLifecycleTargets[0] ?? ''
  const progressionCharacters = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'progression' && fact.field === 'advancement')
      .map(fact => progressionAdvancementCharacterId(fact.value))
      .filter((characterId): characterId is string => characterId !== null) ?? [],
  )].sort()
  const selectedProgressionCharacterId = progressionCharacters.includes(progressionCharacterId)
    ? progressionCharacterId
    : progressionCharacters[0] ?? ''
  const factionIds = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'faction-state' && fact.field === 'continuity')
      .map(fact => factionContinuityFactionId(fact.value))
      .filter((candidate): candidate is string => candidate !== null) ?? [],
  )].sort()
  const selectedFactionId = factionIds.includes(factionId)
    ? factionId
    : factionIds[0] ?? ''
  const locationIds = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'location-state' && fact.field === 'continuity')
      .map(fact => locationContinuityLocationId(fact.value))
      .filter((candidate): candidate is string => candidate !== null) ?? [],
  )].sort()
  const selectedLocationId = locationIds.includes(locationId)
    ? locationId
    : locationIds[0] ?? ''
  const objectIds = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'object-state' && fact.field === 'continuity')
      .map(fact => objectContinuityObjectId(fact.value))
      .filter((candidate): candidate is string => candidate !== null) ?? [],
  )].sort()
  const selectedObjectId = objectIds.includes(objectId)
    ? objectId
    : objectIds[0] ?? ''
  const emotionCharacters = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'emotion-state' && fact.field === 'episode')
      .map(fact => emotionEpisodeCharacterId(fact.value))
      .filter((characterId): characterId is string => characterId !== null) ?? [],
  )].sort()
  const selectedEmotionCharacterId = emotionCharacters.includes(emotionCharacterId)
    ? emotionCharacterId
    : emotionCharacters[0] ?? ''
  const knowledgeBoundarySubjects = [...new Set(
    snapshot?.canon?.facts
      .filter(fact => fact.kind === 'knowledge')
      .map(fact => fact.targetId.split('->', 1)[0]!)
      .filter(subjectId => subjectId.length > 0) ?? [],
  )].sort()
  const selectedKnowledgeBoundarySubjectId = knowledgeBoundarySubjects.includes(
    knowledgeBoundarySubjectId,
  )
    ? knowledgeBoundarySubjectId
    : knowledgeBoundarySubjects[0] ?? ''
  const timelineParticipants = [...new Set(
    snapshot?.canon?.facts.flatMap(fact => (
      fact.kind === 'story-event' && fact.field === 'event'
        ? storyEventParticipants(fact.value)
        : []
    )) ?? [],
  )].sort()
  const selectedTimelineParticipantId = timelineParticipants.includes(timelineParticipantId)
    ? timelineParticipantId
    : timelineParticipants[0] ?? ''

  const discardStaleMutationResult = (
    operationEpoch: number,
    mutatedWorkspaceId: WorkspaceId,
    mutationApplied: boolean,
  ): boolean => {
    if (operationEpoch === operationEpochRef.current) return false
    if (mutationApplied
      && mountedRef.current
      && workspaceIdRef.current === mutatedWorkspaceId) {
      operationEpochRef.current += 1
      operationBusyRef.current = true
      setStatus('loading')
      setMessage(null)
      setReloadVersion(version => version + 1)
    }
    return true
  }

  const rollback = async (targetRevision: number): Promise<void> => {
    if (snapshot === null
      || sessionId === undefined
      || status === 'loading'
      || operationBusyRef.current) return
    invalidateResultPacketImpact()
    setRevisionComparison(null)
    setComparingRevision(null)
    setEndingClosure(null)
    setBuildingEndingClosure(false)
    setCausalImpact(null)
    setTracingCausalImpact(false)
    setChapterControlPack(null)
    setBuildingChapterControlPack(false)
    setRoadmapResolution(null)
    setBuildingRoadmapResolution(false)
    setCharacterTrajectory(null)
    setBuildingCharacterTrajectory(false)
    setClueLifecycle(null)
    setBuildingClueLifecycle(false)
    setPromiseLifecycle(null)
    setBuildingPromiseLifecycle(false)
    setMysteryLifecycle(null)
    setBuildingMysteryLifecycle(false)
    setProgressionLedger(null)
    setBuildingProgressionLedger(false)
    setFactionContinuity(null)
    setBuildingFactionContinuity(false)
    setLocationContinuity(null)
    setBuildingLocationContinuity(false)
    setObjectContinuity(null)
    setBuildingObjectContinuity(false)
    setEmotionContinuity(null)
    setBuildingEmotionContinuity(false)
    setKnowledgeBoundary(null)
    setBuildingKnowledgeBoundary(false)
    setTimelineLedger(null)
    setBuildingTimelineLedger(false)
    const operationEpoch = operationEpochRef.current + 1
    operationEpochRef.current = operationEpoch
    operationBusyRef.current = true
    setRollingBack(true)
    setMessage(null)
    let mutationApplied = false
    try {
      const result = await rollbackRevision(workspaceId, {
        expectedRevision: snapshot.project.acceptedRevision,
        targetRevision,
      })
      mutationApplied = result.ok
      if (discardStaleMutationResult(operationEpoch, workspaceId, result.ok)) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      let canon: NovelCanonProjection | null = null
      let canonFailure: string | null = null
      try {
        const projected = await projectCanon(workspaceId, result.value.revision)
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        if (projected.ok) canon = projected.value
        else canonFailure = projected.error.message
      } catch (error) {
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        canonFailure = errorMessage(error)
      }
      let narrative: NovelNarrativeProjection | null = null
      let narrativeFailure: string | null = null
      try {
        const projected = await projectNarrative(workspaceId, result.value.revision)
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        if (projected.ok) narrative = projected.value
        else narrativeFailure = projected.error.message
      } catch (error) {
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        narrativeFailure = errorMessage(error)
      }
      let manuscripts: readonly NovelManuscriptProjection[] | null = null
      let manuscriptsFailure: string | null = null
      try {
        const projected = await projectManuscripts(workspaceId, result.value.revision)
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        if (projected.ok) manuscripts = projected.value
        else manuscriptsFailure = projected.error.message
      } catch (error) {
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        manuscriptsFailure = errorMessage(error)
      }
      let relationships: NovelRelationshipProjection | null = null
      let relationshipsFailure: string | null = null
      try {
        const projected = await projectRelationships(workspaceId, result.value.revision)
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        if (projected.ok) relationships = projected.value
        else relationshipsFailure = projected.error.message
      } catch (error) {
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        relationshipsFailure = errorMessage(error)
      }
      setSnapshot({
        project: {
          ...snapshot.project,
          acceptedRevision: result.value.revision,
        },
        revisions: [...snapshot.revisions, result.value],
        canon,
        narrative,
        manuscripts,
        relationships,
      })
      const completed = `已回滚到 R${String(targetRevision)} as R${String(result.value.revision)}`
      const refreshFailures = [
        canonFailure === null ? null : `作品事实刷新失败：${canonFailure}`,
        narrativeFailure === null ? null : `故事结构刷新失败：${narrativeFailure}`,
        manuscriptsFailure === null ? null : `Manuscript refresh failed: ${manuscriptsFailure}`,
        relationshipsFailure === null ? null : `人物关系刷新失败：${relationshipsFailure}`,
      ].filter(failure => failure !== null)
      setMessage(refreshFailures.length === 0
        ? completed
        : `${completed}; ${refreshFailures.join('; ')}`)
    } catch (error) {
      if (discardStaleMutationResult(operationEpoch, workspaceId, mutationApplied)) return
      setMessage(`回滚失败：${errorMessage(error)}`)
      if (mutationApplied) setReloadVersion(version => version + 1)
    } finally {
      if (operationEpoch === operationEpochRef.current) {
        operationBusyRef.current = false
        setRollingBack(false)
      }
    }
  }

  const invalidateResultPacketImpact = (): void => {
    resultPacketPreviewEpochRef.current += 1
    setResultPacketImpact(null)
    setPreviewingResultPacket(false)
  }

  const previewResultPacket = (): void => {
    invalidateResultPacketImpact()
    try {
      setReviewPacket(parseResultPacketJson(packetText))
      setItemDecisions({})
      setItemDecisionReasons({})
      setMessage(null)
    } catch (error) {
      setReviewPacket(null)
      setMessage(`提案审阅失败：${errorMessage(error)}`)
    }
  }

  const generateAnchoredReview = async (): Promise<void> => {
    if (snapshot === null
      || sessionId === undefined
      || snapshot.project.acceptedRevision === 0
      || selectedReviewUnitId.length === 0
      || status === 'loading'
      || operationBusyRef.current) return
    invalidateResultPacketImpact()
    const operationEpoch = operationEpochRef.current + 1
    operationEpochRef.current = operationEpoch
    operationBusyRef.current = true
    const abort = new AbortController()
    reviewAbortRef.current?.abort()
    reviewAbortRef.current = abort
    setGeneratingReview(true)
    setMessage(null)
    try {
      const focus = reviewFocus.trim()
      const result = await generateReviewDraft(workspaceId, {
        revision: snapshot.project.acceptedRevision,
        unitId: selectedReviewUnitId,
        ...(focus.length === 0 ? {} : { focus }),
      }, abort.signal)
      if (operationEpoch !== operationEpochRef.current) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setReviewPacket(result.value)
      setItemDecisions({})
      setItemDecisionReasons({})
      invalidateResultPacketImpact()
      setMessage(`已为 R${String(result.value.expectedRevision)}`)
    } catch (error) {
      if (operationEpoch !== operationEpochRef.current) return
      setMessage(`Anchored review failed: ${errorMessage(error)}`)
    } finally {
      if (operationEpoch === operationEpochRef.current) {
        operationBusyRef.current = false
        reviewAbortRef.current = null
        setGeneratingReview(false)
      }
    }
  }

  const previewReviewedPacketImpact = async (
    decisionsOverride?: readonly ResultPacketItemDecision[],
  ): Promise<void> => {
    if (snapshot === null
      || reviewPacket === null
      || sessionId === undefined
      || status === 'loading'
      || operationBusyRef.current
      || previewingResultPacket) return
    const decisions = decisionsOverride ?? buildResultPacketDecisions(
      reviewPacket,
      itemDecisions,
      itemDecisionReasons,
    )
    if (decisions === null) return
    const previewEpoch = resultPacketPreviewEpochRef.current + 1
    resultPacketPreviewEpochRef.current = previewEpoch
    setResultPacketImpact(null)
    setPreviewingResultPacket(true)
    setMessage(null)
    try {
      const result = await previewReview(workspaceId, {
        packet: resultPacketDraft(reviewPacket),
        decisions,
      })
      if (previewEpoch !== resultPacketPreviewEpochRef.current
        || !mountedRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setResultPacketImpact(result.value)
    } catch (error) {
      if (previewEpoch !== resultPacketPreviewEpochRef.current
        || !mountedRef.current
        || workspaceIdRef.current !== workspaceId) return
      setMessage(`提案影响预览失败：${errorMessage(error)}`)
    } finally {
      if (previewEpoch === resultPacketPreviewEpochRef.current) {
        setPreviewingResultPacket(false)
      }
    }
  }

  const applyReviewedPacket = async (): Promise<void> => {
    if (snapshot === null
      || reviewPacket === null
      || sessionId === undefined
      || status === 'loading'
      || operationBusyRef.current) return
    const decisions = buildResultPacketDecisions(
      reviewPacket,
      itemDecisions,
      itemDecisionReasons,
    )
    if (decisions === null) return
    const review: ReviewNovelResultPacket = {
      packet: resultPacketDraft(reviewPacket),
      decisions,
    }
    invalidateResultPacketImpact()
    setRevisionComparison(null)
    setComparingRevision(null)
    setEndingClosure(null)
    setBuildingEndingClosure(false)
    setCausalImpact(null)
    setTracingCausalImpact(false)
    setChapterControlPack(null)
    setBuildingChapterControlPack(false)
    setRoadmapResolution(null)
    setBuildingRoadmapResolution(false)
    setCharacterTrajectory(null)
    setBuildingCharacterTrajectory(false)
    setClueLifecycle(null)
    setBuildingClueLifecycle(false)
    setPromiseLifecycle(null)
    setBuildingPromiseLifecycle(false)
    setMysteryLifecycle(null)
    setBuildingMysteryLifecycle(false)
    setProgressionLedger(null)
    setBuildingProgressionLedger(false)
    setFactionContinuity(null)
    setBuildingFactionContinuity(false)
    setLocationContinuity(null)
    setBuildingLocationContinuity(false)
    setObjectContinuity(null)
    setBuildingObjectContinuity(false)
    setEmotionContinuity(null)
    setBuildingEmotionContinuity(false)
    setKnowledgeBoundary(null)
    setBuildingKnowledgeBoundary(false)
    setTimelineLedger(null)
    setBuildingTimelineLedger(false)
    const operationEpoch = operationEpochRef.current + 1
    operationEpochRef.current = operationEpoch
    operationBusyRef.current = true
    setAccepting(true)
    setMessage(null)
    let mutationApplied = false
    try {
      const result = await reviewResultPacket(workspaceId, review)
      mutationApplied = result.ok
      if (discardStaleMutationResult(operationEpoch, workspaceId, result.ok)) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      let canon: NovelCanonProjection | null = null
      let canonFailure: string | null = null
      try {
        const projected = await projectCanon(workspaceId, result.value.revision)
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        if (projected.ok) canon = projected.value
        else canonFailure = projected.error.message
      } catch (error) {
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        canonFailure = errorMessage(error)
      }
      let narrative: NovelNarrativeProjection | null = null
      let narrativeFailure: string | null = null
      try {
        const projected = await projectNarrative(workspaceId, result.value.revision)
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        if (projected.ok) narrative = projected.value
        else narrativeFailure = projected.error.message
      } catch (error) {
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        narrativeFailure = errorMessage(error)
      }
      let manuscripts: readonly NovelManuscriptProjection[] | null = null
      let manuscriptsFailure: string | null = null
      try {
        const projected = await projectManuscripts(workspaceId, result.value.revision)
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        if (projected.ok) manuscripts = projected.value
        else manuscriptsFailure = projected.error.message
      } catch (error) {
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        manuscriptsFailure = errorMessage(error)
      }
      let relationships: NovelRelationshipProjection | null = null
      let relationshipsFailure: string | null = null
      try {
        const projected = await projectRelationships(workspaceId, result.value.revision)
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        if (projected.ok) relationships = projected.value
        else relationshipsFailure = projected.error.message
      } catch (error) {
        if (discardStaleMutationResult(operationEpoch, workspaceId, true)) return
        relationshipsFailure = errorMessage(error)
      }
      setSnapshot({
        project: {
          ...snapshot.project,
          acceptedRevision: result.value.revision,
        },
        revisions: [...snapshot.revisions, result.value],
        canon,
        narrative,
        manuscripts,
        relationships,
      })
      const completed = `Reviewed packet ${result.value.packetId} as R${String(result.value.revision)}`
      const refreshFailures = [
        canonFailure === null ? null : `作品事实刷新失败：${canonFailure}`,
        narrativeFailure === null ? null : `故事结构刷新失败：${narrativeFailure}`,
        manuscriptsFailure === null ? null : `Manuscript refresh failed: ${manuscriptsFailure}`,
        relationshipsFailure === null ? null : `人物关系刷新失败：${relationshipsFailure}`,
      ].filter(failure => failure !== null)
      setMessage(refreshFailures.length === 0
        ? completed
        : `${completed}; ${refreshFailures.join('; ')}`)
      setPacketText('')
      setReviewPacket(null)
      setItemDecisions({})
      setItemDecisionReasons({})
    } catch (error) {
      if (discardStaleMutationResult(operationEpoch, workspaceId, mutationApplied)) return
      setMessage(`提案审阅失败：${errorMessage(error)}`)
      if (mutationApplied) setReloadVersion(version => version + 1)
    } finally {
      if (operationEpoch === operationEpochRef.current) {
        operationBusyRef.current = false
        setAccepting(false)
      }
    }
  }

  const refreshSnapshot = (): void => {
    if (operationBusyRef.current) return
    invalidateResultPacketImpact()
    setRevisionComparison(null)
    setComparingRevision(null)
    setEndingClosure(null)
    setBuildingEndingClosure(false)
    setCausalImpact(null)
    setTracingCausalImpact(false)
    setChapterControlPack(null)
    setBuildingChapterControlPack(false)
    setRoadmapResolution(null)
    setBuildingRoadmapResolution(false)
    setCharacterTrajectory(null)
    setBuildingCharacterTrajectory(false)
    setClueLifecycle(null)
    setBuildingClueLifecycle(false)
    setPromiseLifecycle(null)
    setBuildingPromiseLifecycle(false)
    setMysteryLifecycle(null)
    setBuildingMysteryLifecycle(false)
    setProgressionLedger(null)
    setBuildingProgressionLedger(false)
    setFactionContinuity(null)
    setBuildingFactionContinuity(false)
    setLocationContinuity(null)
    setBuildingLocationContinuity(false)
    setObjectContinuity(null)
    setBuildingObjectContinuity(false)
    setEmotionContinuity(null)
    setBuildingEmotionContinuity(false)
    setKnowledgeBoundary(null)
    setBuildingKnowledgeBoundary(false)
    setTimelineLedger(null)
    setBuildingTimelineLedger(false)
    operationEpochRef.current += 1
    operationBusyRef.current = true
    setStatus('loading')
    setMessage(null)
    setReloadVersion(version => version + 1)
  }

  const compareAcceptedRevision = async (compareRevision: number): Promise<void> => {
    if (snapshot === null
      || status === 'loading'
      || operationBusyRef.current
      || comparingRevision !== null) return
    const operationEpoch = operationEpochRef.current
    const currentRevision = snapshot.project.acceptedRevision
    setRevisionComparison(null)
    setComparingRevision(compareRevision)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision: currentRevision,
        compareRevision,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setRevisionComparison(result.value.revisionImpact ?? null)
    } catch (error) {
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      setMessage(`当前版本 comparison failed: ${errorMessage(error)}`)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setComparingRevision(null)
      }
    }
  }

  const buildEndingClosure = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.narrative === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingEndingClosure
      || selectedClosureScopeId.length === 0
      || !remainingChapterBudgetValid) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setEndingClosure(null)
    setBuildingEndingClosure(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        closureScopeId: selectedClosureScopeId,
        remainingChapterBudget: parsedRemainingChapterBudget,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setEndingClosure({
        revision: result.value.revision,
        ledger: result.value.closure!,
      })
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingEndingClosure(false)
      }
    }
  }

  const traceCausalImpact = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || tracingCausalImpact
      || selectedCausalImpactEventId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setCausalImpact(null)
    setTracingCausalImpact(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        impactEventId: selectedCausalImpactEventId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setCausalImpact({
        revision: result.value.revision,
        impact: result.value.impact!,
      })
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setTracingCausalImpact(false)
      }
    }
  }

  const buildChapterControlPack = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.narrative === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingChapterControlPack
      || selectedChapterControlPackTargetId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setChapterControlPack(null)
    setBuildingChapterControlPack(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        chapterId: selectedChapterControlPackTargetId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setChapterControlPack(result.value.controlPack!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingChapterControlPack(false)
      }
    }
  }

  const buildRoadmapResolution = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingRoadmapResolution
      || selectedRoadmapTargetId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setRoadmapResolution(null)
    setBuildingRoadmapResolution(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        canonKind: 'roadmap',
        canonTargetId: selectedRoadmapTargetId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setRoadmapResolution(result.value.roadmapResolution!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingRoadmapResolution(false)
      }
    }
  }

  const buildKnowledgeBoundary = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingKnowledgeBoundary
      || selectedKnowledgeBoundarySubjectId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setKnowledgeBoundary(null)
    setBuildingKnowledgeBoundary(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        knowledgeSubjectId: selectedKnowledgeBoundarySubjectId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setKnowledgeBoundary(result.value.knowledgeBoundary!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingKnowledgeBoundary(false)
      }
    }
  }

  const buildCharacterTrajectory = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingCharacterTrajectory
      || selectedCharacterTrajectoryId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setCharacterTrajectory(null)
    setBuildingCharacterTrajectory(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        characterTrajectoryId: selectedCharacterTrajectoryId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setCharacterTrajectory(result.value.characterTrajectory!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingCharacterTrajectory(false)
      }
    }
  }

  const buildClueLifecycle = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingClueLifecycle
      || selectedClueLifecycleId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setClueLifecycle(null)
    setBuildingClueLifecycle(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        clueLifecycleId: selectedClueLifecycleId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setClueLifecycle(result.value.clueLifecycle!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingClueLifecycle(false)
      }
    }
  }

  const buildPromiseLifecycle = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingPromiseLifecycle
      || selectedPromiseLifecycleId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setPromiseLifecycle(null)
    setBuildingPromiseLifecycle(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        promiseLifecycleId: selectedPromiseLifecycleId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setPromiseLifecycle(result.value.promiseLifecycle!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingPromiseLifecycle(false)
      }
    }
  }

  const buildMysteryLifecycle = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingMysteryLifecycle
      || selectedMysteryLifecycleId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setMysteryLifecycle(null)
    setBuildingMysteryLifecycle(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        mysteryLifecycleId: selectedMysteryLifecycleId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setMysteryLifecycle(result.value.mysteryLifecycle!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingMysteryLifecycle(false)
      }
    }
  }

  const buildProgressionLedger = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingProgressionLedger
      || selectedProgressionCharacterId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setProgressionLedger(null)
    setBuildingProgressionLedger(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        progressionCharacterId: selectedProgressionCharacterId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setProgressionLedger(result.value.progressionLedger!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingProgressionLedger(false)
      }
    }
  }

  const buildFactionContinuity = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingFactionContinuity
      || selectedFactionId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setFactionContinuity(null)
    setBuildingFactionContinuity(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        factionId: selectedFactionId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setFactionContinuity(result.value.factionContinuity!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingFactionContinuity(false)
      }
    }
  }

  const buildLocationContinuity = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingLocationContinuity
      || selectedLocationId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setLocationContinuity(null)
    setBuildingLocationContinuity(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        locationId: selectedLocationId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setLocationContinuity(result.value.locationContinuity!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingLocationContinuity(false)
      }
    }
  }

  const buildObjectContinuity = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingObjectContinuity
      || selectedObjectId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setObjectContinuity(null)
    setBuildingObjectContinuity(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        objectId: selectedObjectId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setObjectContinuity(result.value.objectContinuity!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingObjectContinuity(false)
      }
    }
  }

  const buildEmotionContinuity = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingEmotionContinuity
      || selectedEmotionCharacterId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setEmotionContinuity(null)
    setBuildingEmotionContinuity(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        emotionCharacterId: selectedEmotionCharacterId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setEmotionContinuity(result.value.emotionContinuity!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingEmotionContinuity(false)
      }
    }
  }

  const buildTimelineLedger = async (): Promise<void> => {
    if (snapshot === null
      || snapshot.canon === null
      || status === 'loading'
      || operationBusyRef.current
      || buildingTimelineLedger
      || selectedTimelineParticipantId.length === 0) return
    const operationEpoch = operationEpochRef.current
    const revision = snapshot.project.acceptedRevision
    setTimelineLedger(null)
    setBuildingTimelineLedger(true)
    setMessage(null)
    try {
      const result = await retrieve(workspaceId, {
        revision,
        timelineParticipantId: selectedTimelineParticipantId,
      })
      if (operationEpoch !== operationEpochRef.current
        || workspaceIdRef.current !== workspaceId) return
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setTimelineLedger(result.value.timeline!)
    } finally {
      if (operationEpoch === operationEpochRef.current
        && workspaceIdRef.current === workspaceId) {
        setBuildingTimelineLedger(false)
      }
    }
  }

  const decideItem = (
    itemType: ResultPacketItemDecision['itemType'],
    itemId: string,
    outcome: ResultPacketItemDecision['outcome'],
  ): void => {
    invalidateResultPacketImpact()
    setItemDecisions(current => ({
      ...current,
      [resultPacketDecisionKey(itemType, itemId)]: outcome,
    }))
  }

  const explainItemDecision = (
    itemType: ResultPacketItemDecision['itemType'],
    itemId: string,
    reason: string,
  ): void => {
    invalidateResultPacketImpact()
    setItemDecisionReasons(current => ({
      ...current,
      [resultPacketDecisionKey(itemType, itemId)]: reason,
    }))
  }

  const markAllAccepted = (): void => {
    if (reviewPacket === null) return
    invalidateResultPacketImpact()
    setItemDecisions(Object.fromEntries([
      ...(reviewPacket.manuscript === undefined
        ? []
        : [[
            resultPacketDecisionKey('manuscript', reviewPacket.manuscript.unitId),
            'accept' as const,
          ]]),
      ...reviewPacket.deltas.map(delta => [
        resultPacketDecisionKey('delta', delta.id),
        'accept' as const,
      ]),
      ...reviewPacket.issues.map(issue => [
        resultPacketDecisionKey('issue', issue.id),
        'accept' as const,
      ]),
    ]))
  }

  const reviewDecisions = reviewPacket === null
    ? null
    : buildResultPacketDecisions(reviewPacket, itemDecisions, itemDecisionReasons)
  const reviewComplete = reviewDecisions !== null
  const resultPacketImpactCounts = resultPacketImpact === null || reviewDecisions === null
    ? null
    : {
        manuscript: countResultPacketDecisions(reviewDecisions, 'manuscript'),
        deltas: countResultPacketDecisions(reviewDecisions, 'delta'),
        issues: countResultPacketDecisions(reviewDecisions, 'issue'),
      }
  const chapterCardDecisions = reviewPacket === null
    ? null
    : buildResultPacketDecisions(reviewPacket, allAcceptOutcomes(reviewPacket), {})
  const chapterUnits = (snapshot?.narrative?.units ?? [])
    .filter(unit => unit.level === 'chapter')
    .slice()
    .sort((left, right) => left.order - right.order)
  const acceptedChapterIds = new Set(
    (snapshot?.manuscripts ?? []).map(projected => projected.manuscript.unitId),
  )
  const overviewWordCount = (snapshot?.manuscripts ?? [])
    .reduce((total, projected) => total + countManuscriptCharacters(projected.manuscript.text), 0)
  const openDebts = (snapshot?.narrative?.clocks ?? [])
    .flatMap(bucket => bucket.debts)
    .filter(debt => debt.status !== 'resolved')
  const nextChapter = chapterUnits.find(unit => !acceptedChapterIds.has(unit.id))
  const nextChapterNumber = nextChapter === undefined
    ? undefined
    : chapterUnits.indexOf(nextChapter) + 1
  const chapterCardNumber = reviewPacket?.manuscript === undefined
    ? undefined
    : (() => {
        const index = chapterUnits.findIndex(unit => unit.id === reviewPacket.manuscript?.unitId)
        return index < 0 ? undefined : index + 1
      })()

  const acceptChapterCard = async (): Promise<void> => {
    if (reviewPacket === null || chapterCardDecisions === null) return
    markAllAccepted()
    await previewReviewedPacketImpact(chapterCardDecisions)
  }

  const discardProposalCard = async (): Promise<void> => {
    if (workspaceId === undefined || discardProposal === undefined || reviewPacket === null) return
    try {
      const result = await discardProposal(workspaceId, reviewPacket.packetId)
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }
      setPendingInbox(result.value)
      setReviewPacket(null)
      setMessage(`已丢弃提案 ${reviewPacket.packetId}`)
    } catch (error) {
      setMessage(`丢弃提案失败：${errorMessage(error)}`)
    }
  }

  const continueWriting = (): void => {
    if (nextChapter === undefined || nextChapterNumber === undefined || inputActions === undefined) return
    inputActions.setDraft(
      `继续写第 ${String(nextChapterNumber)} 章（${nextChapter.id}）：按已接受的章节合同与写作记忆完成正文，完成后提交提案供我审阅。`,
    )
    inputActions.submit()
  }

  return (
    <aside data-novel-project-panel="" aria-label="小说工作台" style={panelStyle}>
      <style>{panelCss}</style>
      <header className="np-header">
        <div className="np-title">
          <strong>小说工作台</strong>
          <span className="np-chip" aria-live="polite">
            {snapshot === null ? '加载中…' : `当前版本 ${String(snapshot.project.acceptedRevision)}`}
          </span>
        </div>
        <div className="np-actions">
          <button
            type="button"
            aria-label="刷新小说工作台"
            className="np-header-button"
            disabled={status === 'loading' || rollingBack || accepting || generatingReview}
            onClick={refreshSnapshot}
          >
            刷新
          </button>
        </div>
      </header>
      <nav className="np-nav" aria-label="视图切换">
        {([
          ['writing', '写作台'],
          ['overview', '故事'],
          ['history', '历史'],
          ['engineering', '高级'],
        ] as const).map(([view, label]) => (
          <button
            key={view}
            type="button"
            data-novel-view-tab={view}
            aria-pressed={panelView === view}
            className={panelView === view ? 'np-nav-active' : undefined}
            onClick={() => { setPanelView(view) }}
          >
            {label}
            {view === 'writing' && inboxProposal !== undefined && (
              <span className="np-nav-badge" data-novel-view-badge="">待审</span>
            )}
          </button>
        ))}
      </nav>
      <div data-novel-view="writing" hidden={panelView !== 'writing'}>
      {status === 'error' && <p role="alert">{message}</p>}
      <section id="novel-review" aria-label="提案审阅" style={{ marginTop: 12 }}>
        <strong>审阅提案</strong>
        <p style={{ margin: '6px 0', opacity: .7 }}>
          为已接受版本生成审阅问题，或粘贴完整的提案 JSON。
          审阅不会改变作品事实，只有接受作者决定后才会写入。
        </p>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
            正文
            <select
              aria-label="审阅正文"
              value={selectedReviewUnitId}
              style={selectStyle}
              disabled={
                snapshot === null
                || snapshot.manuscripts === null
                || snapshot.manuscripts.length === 0
                || status === 'loading'
                || accepting
                || rollingBack
                || generatingReview
              }
              onChange={event => { setReviewUnitId(event.currentTarget.value) }}
            >
              {(snapshot?.manuscripts?.length ?? 0) === 0 && (
                <option value="">暂无已接受正文</option>
              )}
              {snapshot?.manuscripts?.map(projected => (
                <option
                  key={projected.manuscript.unitId}
                  value={projected.manuscript.unitId}
                >
                  {`${projected.manuscript.title} · R${String(projected.sourceRevision)}`}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
            关注点
            <input
              aria-label="关注点"
              value={reviewFocus}
              style={selectStyle}
              placeholder="例如：连续性"
              disabled={
                snapshot === null
                || snapshot.project.acceptedRevision === 0
                || selectedReviewUnitId.length === 0
                || status === 'loading'
                || accepting
                || rollingBack
                || generatingReview
              }
              onChange={event => { setReviewFocus(event.currentTarget.value) }}
            />
          </label>
          <button
            type="button"
            data-generate-anchored-review=""
            style={buttonStyle}
            disabled={
              snapshot === null
              || snapshot.project.acceptedRevision === 0
              || selectedReviewUnitId.length === 0
              || status === 'loading'
              || accepting
              || rollingBack
              || generatingReview
            }
            onClick={() => { void generateAnchoredReview() }}
          >
            {generatingReview ? '生成中…' : '生成审阅意见'}
          </button>
        </div>
        <textarea
          aria-label="提案 JSON"
          value={packetText}
          style={packetFieldStyle}
          placeholder="把提案 JSON 粘贴到这里"
          spellCheck={false}
          onChange={event => { setPacketText(event.currentTarget.value) }}
        />
        <div style={{ marginTop: 6 }}>
          <button
            type="button"
            style={buttonStyle}
            disabled={packetText.trim().length === 0 || accepting || rollingBack || generatingReview}
            onClick={previewResultPacket}
          >
            解析提案
          </button>
        </div>
        {reviewPacket !== null && (
          <section data-novel-proposal-card="" className="np-proposal" aria-label="待审提案">
            <div data-novel-proposal-summary="" className="np-proposal-summary">
              <div className="np-proposal-head">
                <span className="np-proposal-badge">
                  {chapterCardNumber === undefined ? '立项' : `第 ${String(chapterCardNumber)} 章`}
                </span>
                <div className="np-proposal-title">
                  <strong>{reviewPacket.manuscript?.title ?? '立项提案'}</strong>
                  <div className="np-proposal-meta">
                    {reviewPacket.manuscript !== undefined
                      && `约 ${String(countManuscriptCharacters(reviewPacket.manuscript.text))} 字 · `}
                    {`${String(reviewPacket.deltas.length)} 条设定变更 · ${String(reviewPacket.issues.length)} 个审阅问题`}
                  </div>
                </div>
              </div>
              {(reviewPacket.deltas.length > 0 || reviewPacket.issues.length > 0) && (
                <ul className="np-proposal-lines">
                  {reviewPacket.deltas.map((delta, index) => (
                    <li key={resultPacketItemId(delta, index)}>{describeDelta(delta)}</li>
                  ))}
                  {reviewPacket.issues.map(issue => (
                    <li key={issue.id} data-novel-proposal-issue={issue.id}>
                      {describeIssue(issue)}
                      <div className="np-proposal-suggestion">{`建议：${issue.suggestion}`}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {reviewPacket.manuscript !== undefined && (
              <div data-novel-manuscript-reading="" className="np-manuscript">
                {reviewPacket.manuscript.text}
              </div>
            )}
            <div className="np-proposal-actions">
              <button
                type="button"
                data-novel-accept-chapter=""
                className="np-btn-amber"
                disabled={
                  chapterCardDecisions === null
                  || accepting
                  || rollingBack
                  || generatingReview
                  || previewingResultPacket
                }
                onClick={() => { void acceptChapterCard() }}
              >
                {previewingResultPacket ? '正在计算影响…' : '接受本章'}
              </button>
              {discardProposal !== undefined && (
                <button
                  type="button"
                  data-novel-discard-proposal=""
                  disabled={accepting || rollingBack || generatingReview}
                  onClick={() => { void discardProposalCard() }}
                >
                  丢弃
                </button>
              )}
            </div>
            {resultPacketImpact !== null && resultPacketImpactCounts !== null && (
              <section data-novel-proposal-impact="" className="np-impact">
                <strong>
                  {`R${String(resultPacketImpact.expectedRevision)} → R${String(resultPacketImpact.projectedRevision)}：正文 ${String(resultPacketImpactCounts.manuscript.accepted)} 篇 · 设定变更 ${String(resultPacketImpactCounts.deltas.accepted)} 条 · 审阅问题 ${String(resultPacketImpactCounts.issues.accepted)} 个`}
                </strong>
                <div className="np-impact-actions">
                  <button
                    type="button"
                    data-novel-confirm-accept=""
                    className="np-btn-amber"
                    disabled={accepting || rollingBack || generatingReview}
                    onClick={() => { void applyReviewedPacket() }}
                  >
                    {accepting ? '正在应用…' : '确认接受'}
                  </button>
                </div>
              </section>
            )}
          </section>
        )}
        {reviewPacket !== null && (
          <details data-novel-technical-review="" className="np-technical">
            <summary>逐项调整与技术细节</summary>
            <article
              data-result-packet-review=""
              aria-label={`提案 ${reviewPacket.packetId}`}
              style={{ marginTop: 10 }}
            >
            <div>
              <strong>{reviewPacket.manuscript?.title ?? '立项提案'}</strong>
              <span style={{ marginLeft: 8, opacity: .7 }}>
                {`${reviewPacket.packetId} · 期望版本 R${String(reviewPacket.expectedRevision)}`}
              </span>
            </div>
            {reviewPacket.manuscript === undefined
              ? (
                <p data-result-packet-canon-only="">
                  立项提案：创作画像 / 读者契约（无正文）
                </p>
                )
              : (
                <pre
                  data-result-packet-manuscript=""
                  style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                  {reviewPacket.manuscript.text}
                </pre>
                )}
            {reviewPacket.manuscriptDiff !== undefined && (
              <details open>
                <summary>正文修改对比</summary>
                <pre
                  data-result-packet-diff=""
                  style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                  {reviewPacket.manuscriptDiff.text}
                </pre>
              </details>
            )}
            {reviewPacket.manuscript !== undefined && (
              <ResultPacketDecisionButtons
                itemType="manuscript"
                itemId={reviewPacket.manuscript.unitId}
                outcome={itemDecisions[
                  resultPacketDecisionKey('manuscript', reviewPacket.manuscript.unitId)
                ]}
                reason={itemDecisionReasons[
                  resultPacketDecisionKey('manuscript', reviewPacket.manuscript.unitId)
                ] ?? ''}
                disabled={accepting || rollingBack || generatingReview}
                onDecide={decideItem}
                onReasonChange={explainItemDecision}
              />
            )}
            <details open>
              <summary>{`设定变更 (${String(reviewPacket.deltas.length)})`}</summary>
              {reviewPacket.deltas.length === 0 && <p>无设定变更</p>}
              {reviewPacket.deltas.length > 0 && (
                <ol style={{ paddingLeft: 22 }}>
                  {reviewPacket.deltas.map((delta, index) => (
                    <li
                      key={resultPacketItemId(delta, index)}
                      data-result-packet-delta={resultPacketItemId(delta, index)}
                    >
                      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {formatJson(delta)}
                      </pre>
                      <ResultPacketDecisionButtons
                        itemType="delta"
                        itemId={delta.id}
                        outcome={itemDecisions[resultPacketDecisionKey('delta', delta.id)]}
                        reason={itemDecisionReasons[resultPacketDecisionKey('delta', delta.id)] ?? ''}
                        disabled={accepting || rollingBack || generatingReview}
                        onDecide={decideItem}
                        onReasonChange={explainItemDecision}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </details>
            <details open>
              <summary>{`审阅问题 (${String(reviewPacket.issues.length)})`}</summary>
              {reviewPacket.issues.length === 0 && <p>无审阅问题</p>}
              {reviewPacket.issues.length > 0 && (
                <ol style={{ paddingLeft: 22 }}>
                  {reviewPacket.issues.map((issue, index) => (
                    <li
                      key={resultPacketItemId(issue, index)}
                      data-result-packet-issue={resultPacketItemId(issue, index)}
                      style={{ marginTop: 8 }}
                    >
                      <div>
                        <strong>{`${issue.severity} · ${issue.dimension}`}</strong>
                      </div>
                      <p style={{ margin: '4px 0' }}>{issue.problem}</p>
                      <p style={{ margin: '4px 0' }}>{`建议：${issue.suggestion}`}</p>
                      <div style={{ opacity: .7 }}>
                        {`出处锚点：${issue.sourceAnchorIds.join(', ')}`}
                      </div>
                      <ResultPacketDecisionButtons
                        itemType="issue"
                        itemId={issue.id}
                        outcome={itemDecisions[resultPacketDecisionKey('issue', issue.id)]}
                        reason={itemDecisionReasons[resultPacketDecisionKey('issue', issue.id)] ?? ''}
                        disabled={accepting || rollingBack || generatingReview}
                        onDecide={decideItem}
                        onReasonChange={explainItemDecision}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </details>
            <details>
              <summary>{`出处锚点 (${String(reviewPacket.sourceAnchors.length)})`}</summary>
              <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {formatJson(reviewPacket.sourceAnchors)}
              </pre>
            </details>
            <details>
              <summary>来源与授权</summary>
              <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {formatJson({
                  provenance: reviewPacket.provenance,
                  authorization: hasAuthorization(reviewPacket)
                    ? reviewPacket.authorization
                    : '等待作者决定',
                })}
              </pre>
            </details>
            {resultPacketImpact !== null && resultPacketImpactCounts !== null && (
              <section
                data-result-packet-review-impact=""
                aria-label="选中提案的影响"
                style={{ margin: '8px 0' }}
              >
                <strong>
                  {`R${String(resultPacketImpact.expectedRevision)} → R${String(resultPacketImpact.projectedRevision)}`}
                </strong>
                <div>
                  {formatDecisionCounts('正文', resultPacketImpactCounts.manuscript)}
                </div>
                <div>
                  {formatDecisionCounts('设定变更', resultPacketImpactCounts.deltas)}
                </div>
                <div>
                  {formatDecisionCounts('审阅问题', resultPacketImpactCounts.issues)}
                </div>
                <details open>
                  <summary>领域净影响</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(resultPacketImpact.impact)}
                  </pre>
                </details>
              </section>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                data-accept-all-result-packet-items=""
                style={buttonStyle}
                disabled={accepting || rollingBack || generatingReview}
                onClick={markAllAccepted}
              >
                全部接受
              </button>
              <button
                type="button"
                data-preview-result-packet-review=""
                style={buttonStyle}
                disabled={
                  !reviewComplete
                  || snapshot === null
                  || sessionId === undefined
                  || status === 'loading'
                  || accepting
                  || rollingBack
                  || generatingReview
                  || previewingResultPacket
                }
                onClick={() => { void previewReviewedPacketImpact() }}
              >
                {previewingResultPacket ? '正在计算…' : '预览选中项的影响'}
              </button>
              <button
                type="button"
                data-apply-result-packet-review=""
                style={buttonStyle}
                disabled={
                  !reviewComplete
                  || snapshot === null
                  || status === 'loading'
                  || accepting
                  || rollingBack
                  || generatingReview
                  || previewingResultPacket
                }
                onClick={() => { void applyReviewedPacket() }}
              >
                {accepting ? '正在应用…' : '接受全部审阅决定'}
              </button>
            </div>
          </article>
          </details>
        )}
      </section>
      <section aria-label="继续写作" style={{ marginTop: 12 }}>
        <button
          type="button"
          data-novel-continue-writing=""
          className="np-btn-amber"
          disabled={
            nextChapter === undefined
            || inputActions === undefined
            || status === 'loading'
            || accepting
            || rollingBack
            || generatingReview
          }
          onClick={continueWriting}
        >
          {nextChapterNumber === undefined ? '暂无下一章计划' : `继续写第 ${String(nextChapterNumber)} 章`}
        </button>
        <span className="np-continue-hint">
          {nextChapter === undefined
            ? '先在故事结构里确认下一章'
            : `把指令发给 agent：${nextChapter.id}`}
        </span>
      </section>
      </div>
      <div data-novel-view="overview" hidden={panelView !== 'overview'}>
        {snapshot === null
          ? <p className="np-muted">正在加载作品总览…</p>
          : (
              <>
                <section data-novel-overview-stats="" aria-label="创作进度">
                  <strong>创作进度</strong>
                  <div className="np-stats">
                    <div className="np-stat">
                      <span className="np-stat-value">{String(overviewWordCount)}</span>
                      <span className="np-stat-label">已写正文（字）</span>
                    </div>
                    <div className="np-stat">
                      <span className="np-stat-value">{String(acceptedChapterIds.size)}</span>
                      <span className="np-stat-label">已接受章节</span>
                    </div>
                    <div className="np-stat">
                      <span className="np-stat-value">{String(chapterUnits.length)}</span>
                      <span className="np-stat-label">计划章节</span>
                    </div>
                    <div className="np-stat">
                      <span className="np-stat-value">{String(openDebts.length)}</span>
                      <span className="np-stat-label">未收束线索</span>
                    </div>
                  </div>
                </section>
                <section data-novel-overview-chapters="" aria-label="章节进度">
                  <strong>章节</strong>
                  {chapterUnits.length === 0
                    ? <p className="np-muted">还没有章节计划</p>
                    : (
                        <ol className="np-chapter-list">
                          {chapterUnits.map((unit, index) => {
                            const projected = (snapshot.manuscripts ?? [])
                              .find(candidate => candidate.manuscript.unitId === unit.id)
                            return (
                              <li key={unit.id} data-novel-overview-chapter={unit.id}>
                                <span className="np-chapter-order">{String(index + 1)}</span>
                                <div className="np-chapter-body">
                                  <strong>{projected?.manuscript.title ?? unit.id}</strong>
                                  <div className="np-chapter-meta">
                                    {projected === undefined
                                      ? '待写'
                                      : `已接受 · 约 ${String(countManuscriptCharacters(projected.manuscript.text))} 字`}
                                  </div>
                                  {unit.objective.trim().length > 0 && (
                                    <div className="np-chapter-objective">{unit.objective}</div>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ol>
                      )}
                </section>
                <section data-novel-overview-debts="" aria-label="未收束线索">
                  <strong>未收束线索</strong>
                  {openDebts.length === 0
                    ? <p className="np-muted">暂无</p>
                    : (
                        <ul className="np-debt-list">
                          {openDebts.map((debt, index) => (
                            <li key={`${debt.id}-${String(index)}`}>
                              <span className="np-chip">{clockLabel(debt.clock)}</span>
                              <span>{debt.summary}</span>
                              {debt.horizon === undefined ? null : (
                                <span className="np-muted">{`期望回收：${debt.horizon}`}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                </section>
              </>
            )}
      </div>
      <div data-novel-view="history" hidden={panelView !== 'history'}>
      {snapshot !== null && snapshot.revisions.length === 0 && (
        <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受版本</p>
      )}
      {snapshot !== null && snapshot.revisions.length > 0 && (
        <ol aria-label="历史版本" className="np-history">
          {snapshot.revisions.map(revision => (
            <li
              key={revision.revision}
              data-novel-history-revision={revision.revision}
              className="np-history-row"
            >
              <span className="np-history-badge">{`R${String(revision.revision)}`}</span>
              <div className="np-history-body">
                <div className="np-history-summary">{describeRevisionSummary(revision)}</div>
                {revision.revision < snapshot.project.acceptedRevision && (
                  <div className="np-history-actions">
                    <button
                      type="button"
                      data-compare-revision={revision.revision}
                      aria-label={`与当前 R${String(revision.revision)} 对比（当前 R${String(snapshot.project.acceptedRevision)}`}
                      style={{ ...buttonStyle }}
                      disabled={
                        status === 'loading'
                        || rollingBack
                        || accepting
                        || generatingReview
                        || comparingRevision !== null
                      }
                      onClick={() => { void compareAcceptedRevision(revision.revision) }}
                    >
                      {comparingRevision === revision.revision
                        ? '正在对比…'
                        : `与当前 R${String(snapshot.project.acceptedRevision)}`}
                    </button>
                    <button
                      type="button"
                      data-rollback-revision={revision.revision}
                      aria-label={`回滚到 R${String(revision.revision)}`}
                      style={{ ...buttonStyle }}
                      disabled={
                        sessionId === undefined
                        || status === 'loading'
                        || rollingBack
                        || accepting
                        || generatingReview
                        || comparingRevision !== null
                      }
                      onClick={() => { void rollback(revision.revision) }}
                    >
                      回滚到此版本
                    </button>
                  </div>
                )}
                <details
                  data-accepted-revision-audit={revision.revision}
                  className="np-history-audit"
                >
                  <summary>{`版本 R${String(revision.revision)} 技术细节`}</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson({
                      packetId: revision.packetId,
                      parentRevision: revision.parentRevision,
                      rollbackOfRevision: revision.rollbackOfRevision ?? null,
                      decisions: revision.decisions,
                      provenance: revision.provenance,
                      authorization: revision.authorization,
                    })}
                  </pre>
                </details>
              </div>
            </li>
          ))}
        </ol>
      )}
      {revisionComparison !== null && (
        <section
          data-accepted-revision-comparison=""
          aria-label="版本对比"
          style={{ marginTop: 10 }}
        >
          <strong>
            {`R${String(revisionComparison.fromRevision)} → R${String(revisionComparison.toRevision)}`}
          </strong>
          <details open>
            <summary>领域净影响</summary>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {formatJson(revisionComparison)}
            </pre>
          </details>
        </section>
      )}
      </div>
      <div data-novel-view="engineering" hidden={panelView !== 'engineering'}>
      {writingMemoryResult !== null && (
        <WritingMemoryResultsView result={writingMemoryResult} />
      )}
      {(storyWorldSimulation !== null || readerResponseSimulation !== null) && (
        <SimulationResultsView
          storyWorld={storyWorldSimulation}
          readerResponse={readerResponseSimulation}
        />
      )}
      {snapshot !== null && (
        <section
          data-novel-project-narrative=""
          aria-label="故事结构与叙事时钟"
          style={{ marginTop: 12 }}
        >
          <strong>
            {snapshot.narrative === null
              ? '故事结构暂不可用'
              : `故事结构 · R${String(snapshot.narrative.revision)}`}
          </strong>
          {snapshot.narrative === null
            ? <p style={{ marginBottom: 0, opacity: .7 }}>已接受故事结构投影不可用</p>
            : <NarrativeProjectionView narrative={snapshot.narrative} />}
          {snapshot.narrative !== null && (
            <section id="novel-control-pack" aria-label="章节控制包工具" style={{ marginTop: 12 }}>
              <strong>章节控制包</strong>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                  章节
                  <select
                    aria-label="章节控制包目标"
                    value={selectedChapterControlPackTargetId}
                    style={selectStyle}
                    disabled={
                      chapterControlPackTargets.length === 0
                      || status === 'loading'
                      || rollingBack
                      || accepting
                      || buildingChapterControlPack
                    }
                    onChange={event => {
                      setChapterControlPackTargetId(event.currentTarget.value)
                      setChapterControlPack(null)
                    }}
                  >
                    {chapterControlPackTargets.length === 0 && (
                      <option value="">暂无已接受章节</option>
                    )}
                    {chapterControlPackTargets.map(chapter => (
                      <option key={chapter.id} value={chapter.id}>
                        {`${chapter.id} · ${chapter.status} · ${chapter.objective}`}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  data-build-chapter-control-pack=""
                  style={buttonStyle}
                  disabled={
                    selectedChapterControlPackTargetId.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingChapterControlPack
                  }
                  onClick={() => { void buildChapterControlPack() }}
                >
                  {buildingChapterControlPack ? '正在生成…' : '构建章节控制包'}
                </button>
              </div>
              {chapterControlPack !== null && (
                <article
                  data-chapter-control-pack=""
                  aria-label="章节控制包"
                  style={{ marginTop: 10 }}
                >
                  <strong>
                    {`章节控制包 · R${String(chapterControlPack.sourceRevision)} · ${chapterControlPack.freshness}`}
                  </strong>
                  <div style={{ marginTop: 6 }}>
                    {`sourceRevision: ${String(chapterControlPack.sourceRevision)} · headRevision: ${String(chapterControlPack.headRevision)}`}
                  </div>
                  <section aria-label="控制包章节" style={{ marginTop: 8 }}>
                    <strong>{`${chapterControlPack.chapter.id} · ${chapterControlPack.chapter.status}`}</strong>
                    <div>{chapterControlPack.chapter.objective}</div>
                    <div style={{ opacity: .7 }}>
                      {`${chapterControlPack.chapter.entryState} → ${chapterControlPack.chapter.exitState}`}
                    </div>
                    <small style={{ opacity: .7 }}>
                      {projectionSourceLabel(chapterControlPack.chapter)}
                    </small>
                    {chapterControlPack.chapter.chapterContract !== undefined && (
                      <section data-chapter-contract="" aria-label="章节合同" style={{ marginTop: 8 }}>
                        <strong>章节合同</strong>
                        <div>{`视角：${chapterControlPack.chapter.chapterContract.viewpoint}`}</div>
                        <div>{`故事时间: ${chapterControlPack.chapter.chapterContract.storyTime}`}</div>
                        <div>场景功能</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.sceneFunctions.map(sceneFunction => (
                            <li key={sceneFunction} data-chapter-contract-scene-function={sceneFunction}>
                              {sceneFunction}
                            </li>
                          ))}
                        </ul>
                        <div>活跃剧情线</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.activePlotLineIds.map(lineId => (
                            <li key={lineId} data-chapter-contract-plot-line={lineId}>{lineId}</li>
                          ))}
                        </ul>
                        <div>活跃关系线</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.activeRelationshipLineIds.map(lineId => (
                            <li key={lineId} data-chapter-contract-relationship-line={lineId}>{lineId}</li>
                          ))}
                        </ul>
                        <div>涉及的承诺</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.promisesTouched.map(promise => (
                            <li key={promise.promiseId} data-chapter-contract-promise={promise.promiseId}>
                              {`${promise.promiseId} · ${promise.intendedMovement}`}
                            </li>
                          ))}
                        </ul>
                        <div>读者可知</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.informationPolicy.readerMayKnow.map(fact => (
                            <li key={fact} data-chapter-contract-reader-fact={fact}>{fact}</li>
                          ))}
                        </ul>
                        <div>角色认知</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.informationPolicy.characterMayKnow.map(entry => (
                            <li
                              key={entry.characterId}
                              data-chapter-contract-character-knowledge={entry.characterId}
                            >
                              {`${entry.characterId} · ${entry.facts.join(' · ')}`}
                            </li>
                          ))}
                        </ul>
                        <div>成长铺垫</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.progressionSetups.map(setup => (
                            <li key={setup} data-chapter-contract-progression-setup={setup}>{setup}</li>
                          ))}
                        </ul>
                        <div>成长兑现</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.progressionPayoffs.map(payoff => (
                            <li key={payoff} data-chapter-contract-progression-payoff={payoff}>{payoff}</li>
                          ))}
                        </ul>
                        <div>{`情绪推进：${chapterControlPack.chapter.chapterContract.emotionalMovement}`}</div>
                        <div>{`结局牵引：${chapterControlPack.chapter.chapterContract.endingPull}`}</div>
                        <div>禁止的冲突</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.prohibitedContradictions.map(contradiction => (
                            <li
                              key={contradiction}
                              data-chapter-contract-prohibited-contradiction={contradiction}
                            >
                              {contradiction}
                            </li>
                          ))}
                        </ul>
                        <div>文风约束</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.styleConstraints.map(constraint => (
                            <li key={constraint} data-chapter-contract-style-constraint={constraint}>
                              {constraint}
                            </li>
                          ))}
                        </ul>
                        <div>
                          {`字数范围: ${String(chapterControlPack.chapter.chapterContract.lengthRange.min)}–${String(chapterControlPack.chapter.chapterContract.lengthRange.max)}`}
                        </div>
                        <div>验收门槛</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {chapterControlPack.chapter.chapterContract.acceptanceGates.map(gate => (
                            <li key={gate} data-chapter-contract-acceptance-gate={gate}>{gate}</li>
                          ))}
                        </ul>
                      </section>
                    )}
                    <ChapterReferenceResolutionView controlPack={chapterControlPack} />
                  </section>
                  {postChapterCheckFact !== undefined && postChapterCheck !== undefined && (
                    <section
                      data-post-chapter-check=""
                      aria-label="章节后变化台账"
                      style={{ marginTop: 8 }}
                    >
                      <strong>章节后变化台账</strong>
                      <div>
                        {`合同评估: R${String(postChapterCheck.contractAssessment.contractRevision)} · ${postChapterCheck.contractAssessment.contractSourceDeltaId} · ${postChapterCheck.contractAssessment.outcome}`}
                      </div>
                      <div>{`正文来源：R${String(postChapterCheck.manuscriptSourceRevision)}`}</div>
                      {postChapterCheck.contractAssessment.deviations.map(deviation => (
                        <div key={deviation}>{`偏差：${deviation}`}</div>
                      ))}
                      <div>变化</div>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {postChapterCheck.changes.map(change => (
                          <li key={change} data-post-chapter-change={change}>{change}</li>
                        ))}
                      </ul>
                      <div>代价</div>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {postChapterCheck.costs.map(cost => (
                          <li key={cost} data-post-chapter-cost={cost}>{cost}</li>
                        ))}
                      </ul>
                      <div>新增可能</div>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {postChapterCheck.newlyPossible.map(possibility => (
                          <li key={possibility} data-post-chapter-newly-possible={possibility}>
                            {possibility}
                          </li>
                        ))}
                      </ul>
                      <div>新增不可能</div>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {postChapterCheck.newlyImpossible.map(impossibility => (
                          <li key={impossibility} data-post-chapter-newly-impossible={impossibility}>
                            {impossibility}
                          </li>
                        ))}
                      </ul>
                      <div>读者现已知道</div>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {postChapterCheck.readerNowKnows.map(knowledge => (
                          <li key={knowledge} data-post-chapter-reader-knows={knowledge}>{knowledge}</li>
                        ))}
                      </ul>
                      <div>读者现已怀疑</div>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {postChapterCheck.readerNowSuspects.map(suspicion => (
                          <li key={suspicion} data-post-chapter-reader-suspects={suspicion}>{suspicion}</li>
                        ))}
                      </ul>
                      <div>人物延续</div>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {postChapterCheck.characterCarryForward.map(entry => (
                          <li key={entry.characterId} data-post-chapter-character-carry={entry.characterId}>
                            {`${entry.characterId} · ${entry.carries.join(' · ')}`}
                          </li>
                        ))}
                      </ul>
                      <div>债务变化</div>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {postChapterCheck.debtTransitions.map((transition, transitionIndex) => (
                          <li
                            key={`${transition.sourceDeltaId}:${String(transitionIndex)}`}
                            data-post-chapter-debt-transition={transition.sourceDeltaId}
                          >
                            {`${transition.transition} · ${transition.clock} · ${transition.debtId} · ${transition.sourceDeltaId}`}
                          </li>
                        ))}
                      </ul>
                      <small style={{ opacity: .7 }}>{projectionSourceLabel(postChapterCheckFact)}</small>
                      {chapterControlPack.postChapterCheckResolution !== undefined && (
                        <PostChapterCheckResolutionView
                          resolution={chapterControlPack.postChapterCheckResolution}
                        />
                      )}
                    </section>
                  )}
                  <section aria-label="控制包范围" style={{ marginTop: 8 }}>
                    <strong>已接受范围</strong>
                    <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {chapterControlPack.scope.map(unit => (
                        <li
                          key={unit.id}
                          data-chapter-control-scope-unit={unit.id}
                        >
                          <div>{`${unit.level} · ${unit.id} · ${unit.objective}`}</div>
                          <small style={{ opacity: .7 }}>{projectionSourceLabel(unit)}</small>
                        </li>
                      ))}
                    </ol>
                  </section>
                  <section aria-label="控制包场景与节拍" style={{ marginTop: 8 }}>
                    <strong>已接受场景/节拍</strong>
                    {chapterControlPack.sceneBeats.length === 0
                      ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受场景或节拍计划</p>
                      : (
                          <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                            {chapterControlPack.sceneBeats.map(unit => (
                              <li
                                key={unit.id}
                                data-chapter-control-scene-beat={unit.id}
                              >
                                <div>{`${unit.level} · ${unit.id} · ${unit.status}`}</div>
                                <div>{unit.objective}</div>
                                <div style={{ opacity: .7 }}>
                                  {`${unit.entryState} → ${unit.exitState}`}
                                </div>
                                <small style={{ opacity: .7 }}>{projectionSourceLabel(unit)}</small>
                              </li>
                            ))}
                          </ol>
                        )}
                  </section>
                  <section aria-label="控制包锁定设定" style={{ marginTop: 8 }}>
                    <strong>本版本锁定的设定</strong>
                    {chapterControlPack.canonLockResolution.resolved.length === 0
                      && chapterControlPack.canonLockResolution.unavailableAtRevision.length === 0
                      ? <p style={{ marginBottom: 0, opacity: .7 }}>当前无作品事实锁定</p>
                      : (
                          <>
                            {chapterControlPack.canonLockResolution.resolved.length > 0 && (
                              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                {chapterControlPack.canonLockResolution.resolved.map(({ lock, fact }) => (
                                  <li
                                    key={`${lock.kind}:${lock.targetId}:${lock.field}`}
                                    data-chapter-control-lock-resolved={`${lock.kind}:${lock.targetId}:${lock.field}`}
                                  >
                                    <div>
                                      {`${lock.kind} · ${lock.targetId} · ${lock.field}: ${formatCanonValue(lock.value)}`}
                                    </div>
                                    <small style={{ opacity: .7 }}>{projectionSourceLabel(fact)}</small>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {chapterControlPack.canonLockResolution.unavailableAtRevision.length > 0 && (
                              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                {chapterControlPack.canonLockResolution.unavailableAtRevision.map(lock => (
                                  <li
                                    key={`${lock.kind}:${lock.targetId}:${lock.field}`}
                                    data-chapter-control-lock-unavailable={`${lock.kind}:${lock.targetId}:${lock.field}`}
                                  >
                                    <div>
                                      {`${lock.kind} · ${lock.targetId} · ${lock.field}: ${formatCanonValue(lock.value)}`}
                                    </div>
                                    <small style={{ opacity: .7 }}>
                                      {`在 R${String(chapterControlPack.sourceRevision)}`}
                                    </small>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                  </section>
                  <section aria-label="控制包作品事实" style={{ marginTop: 8 }}>
                    <strong>锁定设定</strong>
                    {chapterControlPack.scopedCanonFacts.length === 0
                      ? <p style={{ marginBottom: 0, opacity: .7 }}>无范围内的作品事实</p>
                      : (
                          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                            {chapterControlPack.scopedCanonFacts.map(fact => (
                              <li
                                key={`${fact.kind}:${fact.targetId}:${fact.field}`}
                                data-chapter-control-canon={`${fact.kind}:${fact.targetId}:${fact.field}`}
                              >
                                <div>
                                  {`${fact.kind} · ${fact.targetId} · ${fact.field}: ${formatCanonValue(fact.value)}`}
                                </div>
                                <small style={{ opacity: .7 }}>{projectionSourceLabel(fact)}</small>
                              </li>
                            ))}
                          </ul>
                        )}
                  </section>
                  <section aria-label="控制包叙事时钟" style={{ marginTop: 8 }}>
                    <strong>叙事时钟</strong>
                    {chapterControlPack.clocks.map(bucket => (
                      <article
                        key={bucket.clock}
                        data-chapter-control-clock={bucket.clock}
                        style={{ marginTop: 6 }}
                      >
                        <strong>{bucket.clock}</strong>
                        {bucket.entries.length === 0 && bucket.debts.length === 0 && (
                          <span style={{ marginLeft: 6, opacity: .7 }}>无范围内的移动或债务</span>
                        )}
                        {bucket.entries.map(entry => {
                          const world = entry.delta.operation === 'set'
                            && entry.delta.field === 'world'
                            ? entry.delta.value as NovelWorldClockValue
                            : undefined
                          return (
                            <div key={`${entry.unitId}:${entry.sourceDeltaId}`}>
                              {world === undefined
                                ? <div>{`${entry.unitId} · ${entry.movement} · ${entry.state}`}</div>
                                : <WorldClockEntryView value={world} />}
                              <small style={{ opacity: .7 }}>{projectionSourceLabel(entry)}</small>
                            </div>
                          )
                        })}
                        {bucket.debts.map(debt => (
                          <div key={`${debt.id}:${debt.sourceDeltaId}`}>
                            <div>{`${debt.id} · ${debt.summary} · ${debt.status}`}</div>
                            <small style={{ opacity: .7 }}>{projectionSourceLabel(debt)}</small>
                          </div>
                        ))}
                      </article>
                    ))}
                  </section>
                  <section aria-label="控制包写作记忆" style={{ marginTop: 8 }}>
                    <strong>Writing memory · character carry-forward</strong>
                    {chapterControlPack.writingMemory.characterCarryForward.length === 0
                      ? <p style={{ marginBottom: 0, opacity: .7 }}>无长程人物记忆</p>
                      : (
                          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                            {chapterControlPack.writingMemory.characterCarryForward.map(memory => (
                              <li
                                key={memory.characterId}
                                data-chapter-writing-memory-character={memory.characterId}
                              >
                                <div>
                                  {`${memory.characterId} · ${memory.carries.length === 0
                                    ? 'No carry-forward state'
                                    : memory.carries.join(' · ')}`}
                                </div>
                                <small style={{ opacity: .7 }}>
                                  {`${memory.sourceChapter.id} · ${projectionSourceLabel(memory)}`}
                                </small>
                              </li>
                            ))}
                          </ul>
                        )}
                  </section>
                  <section aria-label="控制包人物弧假设" style={{ marginTop: 8 }}>
                    <strong>Writing memory · character arc hypotheses</strong>
                    {chapterControlPack.writingMemory.characterArcHypotheses.length === 0
                      ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受人物弧假设</p>
                      : (
                          <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                            {chapterControlPack.writingMemory.characterArcHypotheses.map(character => (
                              <li
                                key={character.characterId}
                                data-chapter-writing-memory-character-arc={character.characterId}
                                style={{ marginTop: 6 }}
                              >
                                <CharacterArcHypothesisDetails character={character} />
                              </li>
                            ))}
                          </ol>
                        )}
                  </section>
                  <section aria-label="控制包近期正文" style={{ marginTop: 8 }}>
                    <strong>近期正文</strong>
                    {chapterControlPack.recentManuscripts.length === 0
                      ? <p style={{ marginBottom: 0, opacity: .7 }}>无前序章节正文</p>
                      : chapterControlPack.recentManuscripts.map(projected => (
                          <article
                            key={projected.manuscript.unitId}
                            data-chapter-control-recent-manuscript={projected.manuscript.unitId}
                            style={{ marginTop: 6 }}
                          >
                            <strong>{projected.manuscript.title}</strong>
                            <div>{projected.manuscript.text}</div>
                            <small style={{ opacity: .7 }}>
                              {`source R${String(projected.sourceRevision)} · ${projected.provenance.taskId} · ${projected.provenance.producer}`}
                            </small>
                          </article>
                        ))}
                  </section>
                  <section aria-label="控制包近期章节后检查" style={{ marginTop: 8 }}>
                    <strong>近期章节后延续</strong>
                    {chapterControlPack.recentPostChapterChecks.length === 0
                      ? <p style={{ marginBottom: 0, opacity: .7 }}>无前序章节后检查</p>
                      : chapterControlPack.recentPostChapterChecks.map(entry => (
                          <RecentPostChapterCheckView key={entry.chapter.id} entry={entry} />
                        ))}
                  </section>
                  <details style={{ marginTop: 8 }}>
                    <summary>完整章节控制包数据</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {formatJson(chapterControlPack)}
                    </pre>
                  </details>
                </article>
              )}
            </section>
          )}
          {snapshot.narrative !== null && (
            <section id="novel-ending" aria-label="结局收束台账 builder" style={{ marginTop: 12 }}>
              <strong>结局收束台账</strong>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                  范围
                  <select
                    aria-label="结局范围"
                    value={selectedClosureScopeId}
                    style={selectStyle}
                    disabled={
                      closureScopes.length === 0
                      || status === 'loading'
                      || rollingBack
                      || accepting
                      || buildingEndingClosure
                    }
                    onChange={event => {
                      setClosureScopeId(event.currentTarget.value)
                      setEndingClosure(null)
                    }}
                  >
                    {closureScopes.length === 0 && (
                      <option value="">暂无已接受卷或系列</option>
                    )}
                    {closureScopes.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {`${unit.level} · ${unit.id}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                  剩余章节预算
                  <input
                    aria-label="剩余章节预算"
                    type="number"
                    min={1}
                    step={1}
                    value={remainingChapterBudget}
                    style={selectStyle}
                    disabled={
                      closureScopes.length === 0
                      || status === 'loading'
                      || rollingBack
                      || accepting
                      || buildingEndingClosure
                    }
                    onChange={event => {
                      setRemainingChapterBudget(event.currentTarget.value)
                      setEndingClosure(null)
                    }}
                  />
                </label>
                <button
                  type="button"
                  data-build-ending-closure=""
                  style={buttonStyle}
                  disabled={
                    selectedClosureScopeId.length === 0
                    || !remainingChapterBudgetValid
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingEndingClosure
                  }
                  onClick={() => { void buildEndingClosure() }}
                >
                  {buildingEndingClosure ? '正在生成…' : '构建结局收束'}
                </button>
              </div>
              {endingClosure !== null && (
                <article
                  data-ending-closure-ledger=""
                  aria-label="结局收束台账"
                  style={{ marginTop: 10 }}
                >
                  <strong>{`Ending closure · R${String(endingClosure.revision)}`}</strong>
                  <div style={{ marginTop: 6 }}>
                    {`范围：${endingClosure.ledger.scope.level} · ${endingClosure.ledger.scope.id}`}
                  </div>
                  <div>{`remainingChapterBudget: ${String(endingClosure.ledger.remainingChapterBudget)}`}</div>
                  <div>{`unitIds: ${endingClosure.ledger.unitIds.join(' → ')}`}</div>
                  {endingClosure.ledger.endingHypothesis !== null && (
                    <section data-ending-hypothesis="" aria-label="结局假设" style={{ marginTop: 8 }}>
                    <strong>结局假设</strong>
                    <div>{`结局目标：${endingClosure.ledger.endingHypothesis.value.endingTarget}`}</div>
                    <div>{`决定性冲突：${endingClosure.ledger.endingHypothesis.value.decisiveConflict}`}</div>
                    <div>{`主角选择：${endingClosure.ledger.endingHypothesis.value.protagonistChoice}`}</div>
                    <div>{`主题回归：${endingClosure.ledger.endingHypothesis.value.thematicReturn}`}</div>
                    <div>{`收束方式：${endingClosure.ledger.endingHypothesis.value.resolutionMode}`}</div>
                    <div>{`期望情绪余韵：${endingClosure.ledger.endingHypothesis.value.desiredEmotionalAfterimage}`}</div>
                    <div>{`余波：${endingClosure.ledger.endingHypothesis.value.aftermath}`}</div>
                    <div>
                      {`刻意未收束债务：${endingClosure.ledger.endingHypothesis.value.deliberatelyUnresolvedDebts
                        .map(reference => `${reference.clock} · ${reference.id}`).join(', ')}`}
                    </div>
                    <div>
                      {`尾声作用：${endingClosure.ledger.endingHypothesis.value.epiloguePurpose ?? '无'}`}
                    </div>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {endingClosure.ledger.endingHypothesis.value.finalStates.map(finalState => (
                        <li
                          key={`${finalState.kind}:${finalState.subjectId}`}
                          data-ending-final-state={`${finalState.kind}:${finalState.subjectId}`}
                        >
                          {`${finalState.kind} · ${finalState.subjectId} · ${finalState.state}`}
                        </li>
                      ))}
                    </ul>
                    <small style={{ opacity: .7 }}>
                      {projectionSourceLabel(endingClosure.ledger.endingHypothesis)}
                    </small>
                    </section>
                  )}
                  <section aria-label="结局推进" style={{ marginTop: 8 }}>
                    <strong>结局推进</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {endingClosure.ledger.endingEntries.map(entry => {
                        const ending = entry.delta.operation === 'set'
                          && entry.delta.field === 'ending'
                          ? entry.delta.value as NovelEndingClockValue
                          : undefined
                        return (
                          <li
                            key={`${entry.unitId}:${entry.sourceDeltaId}`}
                            data-ending-closure-entry={`${entry.unitId}:${entry.sourceDeltaId}`}
                          >
                            {ending === undefined
                              ? <div>{`${entry.unitId} · ${entry.movement} · ${entry.state}`}</div>
                              : <EndingClockEntryView value={ending} />}
                            <small style={{ opacity: .7 }}>{projectionSourceLabel(entry)}</small>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                  <section aria-label="预计收束债务" style={{ marginTop: 8 }}>
                    <strong>预计收束债务</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {endingClosure.ledger.debts.map(debt => (
                        <li
                          key={`${debt.clock}:${debt.id}:${debt.sourceDeltaId}`}
                          data-ending-closure-debt={`${debt.clock}:${debt.id}`}
                        >
                          <div>{`${debt.clock} · ${debt.id} · ${debt.summary} · ${debt.status}`}</div>
                          <small style={{ opacity: .7 }}>{projectionSourceLabel(debt)}</small>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="收束依赖顺序" style={{ marginTop: 8 }}>
                    <strong>依赖顺序</strong>
                    <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {endingClosure.ledger.dependencyOrder.map(reference => (
                        <li
                          key={`${reference.clock}:${reference.id}`}
                          data-ending-closure-dependency={`${reference.clock}:${reference.id}`}
                        >
                          {`${reference.clock} · ${reference.id}`}
                        </li>
                      ))}
                    </ol>
                  </section>
                  <details style={{ marginTop: 8 }}>
                    <summary>完整台账数据</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {formatJson(endingClosure.ledger)}
                    </pre>
                  </details>
                </article>
              )}
            </section>
          )}
        </section>
      )}
      {snapshot !== null && (
        <section id="novel-canon" data-novel-project-canon="" aria-label="作品事实" style={{ marginTop: 12 }}>
          <strong>
            {snapshot.canon === null
              ? '作品事实暂不可用'
              : `Canon · R${String(snapshot.canon.revision)}`}
          </strong>
          {snapshot.canon !== null && snapshot.canon.facts.length === 0 && (
            <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受作品事实</p>
          )}
          {snapshot.canon !== null && snapshot.canon.facts.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {snapshot.canon.facts.map(fact => (
                <li
                  key={`${fact.kind}:${fact.targetId}:${fact.field}`}
                  data-canon-fact={`${fact.kind}:${fact.targetId}:${fact.field}`}
                  style={{ marginTop: 4 }}
                >
                  <span>{`${fact.kind} · ${fact.targetId} · ${fact.field}: `}</span>
                  <span>{formatCanonValue(fact.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {snapshot !== null && snapshot.canon !== null && (
        <section
          data-novel-project-domain-state=""
          aria-label="已接受的领域状态"
          style={{ marginTop: 12 }}
        >
          <strong>{`作品状态 · R${String(snapshot.canon.revision)}`}</strong>
          <CanonEntityProjectionView projection={snapshot.canon} />
          <section aria-label="滚动路线图 resolution builder" style={{ marginTop: 12 }}>
            <strong>滚动路线图</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                路线图
                <select
                  aria-label="滚动路线图 target"
                  value={selectedRoadmapTargetId}
                  style={selectStyle}
                  disabled={
                    roadmapTargets.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingRoadmapResolution
                  }
                  onChange={event => {
                    setRoadmapTargetId(event.currentTarget.value)
                    setRoadmapResolution(null)
                  }}
                >
                  {roadmapTargets.length === 0 && (
                    <option value="">暂无已接受滚动路线图</option>
                  )}
                  {roadmapTargets.map(targetId => (
                    <option key={targetId} value={targetId}>{targetId}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-roadmap-resolution=""
                style={buttonStyle}
                disabled={
                  selectedRoadmapTargetId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingRoadmapResolution
                }
                onClick={() => { void buildRoadmapResolution() }}
              >
                {buildingRoadmapResolution ? '正在解析…' : '解析路线图'}
              </button>
            </div>
            {roadmapResolution !== null && (
              <RollingRoadmapResolutionView resolution={roadmapResolution} />
            )}
          </section>
          <section aria-label="人物轨迹台账" style={{ marginTop: 12 }}>
            <strong>人物状态轨迹</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Character
                <select
                  aria-label="Character trajectory target"
                  value={selectedCharacterTrajectoryId}
                  style={selectStyle}
                  disabled={
                    characterTrajectoryTargets.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingCharacterTrajectory
                  }
                  onChange={event => {
                    setCharacterTrajectoryId(event.currentTarget.value)
                    setCharacterTrajectory(null)
                  }}
                >
                  {characterTrajectoryTargets.length === 0 && (
                    <option value="">暂无已接受人物状态</option>
                  )}
                  {characterTrajectoryTargets.map(characterId => (
                    <option key={characterId} value={characterId}>{characterId}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-character-trajectory=""
                style={buttonStyle}
                disabled={
                  selectedCharacterTrajectoryId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingCharacterTrajectory
                }
                onClick={() => { void buildCharacterTrajectory() }}
              >
                {buildingCharacterTrajectory ? '正在生成…' : '构建人物轨迹'}
              </button>
            </div>
            {characterTrajectory !== null && (
              <article
                data-character-trajectory=""
                aria-label="人物状态轨迹"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`Character trajectory · R${String(characterTrajectory.revision)} · head R${String(characterTrajectory.headRevision)} · ${characterTrajectory.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`人物：${characterTrajectory.characterId}`}</div>
                {characterTrajectory.entries.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受人物状态变化</p>
                )}
                {characterTrajectory.entries.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {characterTrajectory.entries.map(entry => (
                      <li
                        key={entry.revision}
                        data-character-trajectory-entry={String(entry.revision)}
                        style={{ marginTop: 10 }}
                      >
                        <strong>
                          {`R${String(entry.revision)} · ${entry.packetId}${entry.rollbackOfRevision === undefined ? '' : ` · rollback of R${String(entry.rollbackOfRevision)}`}`}
                        </strong>
                        <div style={{ marginTop: 4 }}>当前状态</div>
                        {entry.fields.length === 0
                          ? <div style={{ opacity: .7 }}>暂无已接受字段</div>
                          : (
                              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                {entry.fields.map((field) => {
                                  const characterArc = field.fact.kind === 'character-state'
                                    && field.fact.field === 'arc-hypothesis'
                                    ? field.fact.value as NovelCharacterArcHypothesisValue
                                    : undefined
                                  return (
                                    <li key={field.fact.field}>
                                      {characterArc === undefined
                                        ? (
                                            <>
                                              <div>{`${field.fact.field}: ${formatCanonValue(field.fact.value)}`}</div>
                                              <div style={{ opacity: .7 }}>
                                                {`出处范围：${formatJson(field.sourceRanges)}`}
                                              </div>
                                              <small style={{ opacity: .7 }}>
                                                {projectionSourceLabel(field.fact)}
                                              </small>
                                            </>
                                          )
                                        : (
                                            <section
                                              data-character-arc-hypothesis={String(characterArc.version)}
                                              aria-label={`Character arc hypothesis v${String(characterArc.version)}`}
                                            >
                                              <strong>{`Character arc hypothesis v${String(characterArc.version)}`}</strong>
                                              <div>{`假设：${characterArc.hypothesis}`}</div>
                                              <div>{`范围：${characterArc.scopeUnitId}`}</div>
                                              <div>{`起始信念：${characterArc.startingBelief}`}</div>
                                              <div>{`目标转变：${characterArc.targetTransformation}`}</div>
                                              <div>转变维度</div>
                                              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                                {characterArc.transformationDimensions.map(dimension => (
                                                  <li key={dimension} data-character-arc-target={dimension}>
                                                    {dimension}
                                                  </li>
                                                ))}
                                              </ul>
                                              <div>当前压力</div>
                                              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                                {characterArc.pressures.map(pressure => (
                                                  <li key={pressure} data-character-arc-pressure={pressure}>
                                                    {pressure}
                                                  </li>
                                                ))}
                                              </ul>
                                              <div>已接受决定链</div>
                                              {characterArc.decisionChain.length === 0
                                                ? <div style={{ opacity: .7 }}>暂无已接受的人物弧决定</div>
                                                : (
                                                    <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                                      {characterArc.decisionChain.map(decision => (
                                                        <li
                                                          key={decision.decisionId}
                                                          data-character-arc-decision={`${String(characterArc.version)}:${decision.decisionId}`}
                                                          style={{ marginTop: 6 }}
                                                        >
                                                          <strong>{decision.decisionId}</strong>
                                                          <div>{`事件：${decision.storyEventId}`}</div>
                                                          <div>{`压力：${decision.pressure}`}</div>
                                                          <div>{`选择：${decision.choice}`}</div>
                                                          <div>
                                                            {`被拒备选：${decision.rejectedAlternatives.join(' · ')}`}
                                                          </div>
                                                          <div>{`代价：${decision.cost}`}</div>
                                                          <div>
                                                            {`持久后果：${decision.persistentConsequence}`}
                                                          </div>
                                                          <div
                                                            data-character-arc-update={`${String(characterArc.version)}:${decision.decisionId}`}
                                                          >
                                                            {`转变证据：${decision.transformationEvidence}`}
                                                          </div>
                                                        </li>
                                                      ))}
                                                    </ol>
                                                  )}
                                              <div>{`当前阶段：${characterArc.currentStage}`}</div>
                                              <div>{`未解问题：${characterArc.unresolvedQuestion}`}</div>
                                              <div>
                                                {`修订理由：${characterArc.changeRationale ?? '无'}`}
                                              </div>
                                              <div style={{ opacity: .7 }}>
                                                {`出处范围：${formatJson(field.sourceRanges)}`}
                                              </div>
                                              <small style={{ opacity: .7 }}>
                                                {projectionSourceLabel(field.fact)}
                                              </small>
                                            </section>
                                          )}
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                        <div style={{ marginTop: 6 }}>变化</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {entry.changes.map(change => (
                            <li
                              key={change.field}
                              data-character-trajectory-change={`${String(entry.revision)}:${change.field}`}
                              style={{ marginTop: 6 }}
                            >
                              <strong>{change.field}</strong>
                              <div>
                                {`之前：${change.before === undefined ? 'not set' : formatCanonValue(change.before.fact.value)}`}
                              </div>
                              <div>
                                {`之后：${change.after === undefined ? '已移除' : formatCanonValue(change.after.fact.value)}`}
                              </div>
                              {change.before !== undefined && (
                                <div style={{ opacity: .7 }}>
                                  {`之前出处范围：${formatJson(change.before.sourceRanges)} · ${projectionSourceLabel(change.before.fact)}`}
                                </div>
                              )}
                              {change.after !== undefined && (
                                <div style={{ opacity: .7 }}>
                                  {`之后出处范围：${formatJson(change.after.sourceRanges)} · ${projectionSourceLabel(change.after.fact)}`}
                                </div>
                              )}
                              {change.acceptedDelta !== undefined && (
                                <div>
                                  {`已接受变更：${change.acceptedDelta.operation} · ${change.acceptedDelta.id}`}
                                </div>
                              )}
                              <div style={{ opacity: .7 }}>
                                {`已接受变更出处范围：${formatJson(change.acceptedDeltaSourceRanges)}`}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <small style={{ opacity: .7 }}>
                          {`接受者：${entry.provenance.producer} · ${entry.provenance.taskId}`}
                        </small>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整人物轨迹数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(characterTrajectory)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="线索生命周期台账" style={{ marginTop: 12 }}>
            <strong>线索与伏笔生命周期</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Clue
                <select
                  aria-label="Clue lifecycle target"
                  value={selectedClueLifecycleId}
                  style={selectStyle}
                  disabled={
                    clueLifecycleTargets.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingClueLifecycle
                  }
                  onChange={event => {
                    setClueLifecycleId(event.currentTarget.value)
                    setClueLifecycle(null)
                  }}
                >
                  {clueLifecycleTargets.length === 0 && (
                    <option value="">暂无已接受线索</option>
                  )}
                  {clueLifecycleTargets.map(clueId => (
                    <option key={clueId} value={clueId}>{clueId}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-clue-lifecycle=""
                style={buttonStyle}
                disabled={
                  selectedClueLifecycleId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingClueLifecycle
                }
                onClick={() => { void buildClueLifecycle() }}
              >
                {buildingClueLifecycle ? '正在生成…' : '构建线索生命周期'}
              </button>
            </div>
            {clueLifecycle !== null && (
              <article
                data-clue-lifecycle=""
                aria-label="线索与伏笔生命周期"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`Clue lifecycle · R${String(clueLifecycle.revision)} · head R${String(clueLifecycle.headRevision)} · ${clueLifecycle.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`线索：${clueLifecycle.clueId}`}</div>
                {clueLifecycle.entries.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受线索变化</p>
                )}
                {clueLifecycle.entries.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {clueLifecycle.entries.map(entry => (
                      <li
                        key={entry.revision}
                        data-clue-lifecycle-entry={String(entry.revision)}
                        style={{ marginTop: 10 }}
                      >
                        <strong>
                          {`R${String(entry.revision)} · ${entry.packetId}${entry.rollbackOfRevision === undefined ? '' : ` · rollback of R${String(entry.rollbackOfRevision)}`}`}
                        </strong>
                        <div style={{ marginTop: 4 }}>当前线索字段</div>
                        {entry.fields.length === 0
                          ? <div style={{ opacity: .7 }}>暂无已接受字段</div>
                          : (
                              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                {entry.fields.map(field => (
                                  <li key={field.fact.field}>
                                    {field.fact.field === 'state'
                                      ? (
                                          <ClueStateView
                                            targetId={clueLifecycle.clueId}
                                            value={field.fact.value as NovelClueStateValue}
                                            sourceLabel={projectionSourceLabel(field.fact)}
                                          />
                                        )
                                      : (
                                          <>
                                            <div>{`${field.fact.field}: ${formatCanonValue(field.fact.value)}`}</div>
                                            <small style={{ opacity: .7 }}>{projectionSourceLabel(field.fact)}</small>
                                          </>
                                        )}
                                    <div style={{ opacity: .7 }}>
                                      {`出处范围：${formatJson(field.sourceRanges)}`}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                        <div style={{ marginTop: 6 }}>变化</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {entry.changes.map(change => (
                            <li
                              key={change.field}
                              data-clue-lifecycle-change={`${String(entry.revision)}:${change.field}`}
                              style={{ marginTop: 6 }}
                            >
                              <strong>{change.field}</strong>
                              <div>
                                {`之前：${change.before === undefined ? 'not set' : formatCanonValue(change.before.fact.value)}`}
                              </div>
                              <div>
                                {`之后：${change.after === undefined ? '已移除' : formatCanonValue(change.after.fact.value)}`}
                              </div>
                              {change.before !== undefined && (
                                <div style={{ opacity: .7 }}>
                                  {`之前出处范围：${formatJson(change.before.sourceRanges)} · ${projectionSourceLabel(change.before.fact)}`}
                                </div>
                              )}
                              {change.after !== undefined && (
                                <div style={{ opacity: .7 }}>
                                  {`之后出处范围：${formatJson(change.after.sourceRanges)} · ${projectionSourceLabel(change.after.fact)}`}
                                </div>
                              )}
                              {change.acceptedDelta !== undefined && (
                                <div>
                                  {`已接受变更：${change.acceptedDelta.operation} · ${change.acceptedDelta.id}`}
                                </div>
                              )}
                              <div style={{ opacity: .7 }}>
                                {`已接受变更出处范围：${formatJson(change.acceptedDeltaSourceRanges)}`}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <small style={{ opacity: .7 }}>
                          {`接受者：${entry.provenance.producer} · ${entry.provenance.taskId}`}
                        </small>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整线索生命周期数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(clueLifecycle)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="承诺与兑现生命周期 builder" style={{ marginTop: 12 }}>
            <strong>承诺与兑现生命周期</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Promise
                <select
                  aria-label="Promise lifecycle target"
                  value={selectedPromiseLifecycleId}
                  style={selectStyle}
                  disabled={
                    promiseLifecycleTargets.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingPromiseLifecycle
                  }
                  onChange={event => {
                    setPromiseLifecycleId(event.currentTarget.value)
                    setPromiseLifecycle(null)
                  }}
                >
                  {promiseLifecycleTargets.length === 0 && (
                    <option value="">暂无已接受承诺</option>
                  )}
                  {promiseLifecycleTargets.map(promiseId => (
                    <option key={promiseId} value={promiseId}>{promiseId}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-promise-lifecycle=""
                style={buttonStyle}
                disabled={
                  selectedPromiseLifecycleId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingPromiseLifecycle
                }
                onClick={() => { void buildPromiseLifecycle() }}
              >
                {buildingPromiseLifecycle ? '正在生成…' : '构建承诺生命周期'}
              </button>
            </div>
            {promiseLifecycle !== null && (
              <article
                data-promise-lifecycle=""
                aria-label="承诺与兑现生命周期"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`Promise lifecycle · R${String(promiseLifecycle.revision)} · head R${String(promiseLifecycle.headRevision)} · ${promiseLifecycle.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`承诺：${promiseLifecycle.promiseId}`}</div>
                {promiseLifecycle.entries.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受承诺变化</p>
                )}
                {promiseLifecycle.entries.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {promiseLifecycle.entries.map(entry => (
                      <li
                        key={entry.revision}
                        data-promise-lifecycle-entry={String(entry.revision)}
                        style={{ marginTop: 10 }}
                      >
                        <strong>
                          {`R${String(entry.revision)} · ${entry.packetId}${entry.rollbackOfRevision === undefined ? '' : ` · rollback of R${String(entry.rollbackOfRevision)}`}`}
                        </strong>
                        <div style={{ marginTop: 4 }}>当前承诺字段</div>
                        {entry.fields.length === 0
                          ? <div style={{ opacity: .7 }}>暂无已接受字段</div>
                          : (
                              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                {entry.fields.map(field => (
                                  <li key={field.fact.field}>
                                    {field.fact.field === 'state'
                                      ? (
                                          <PromiseStateView
                                            targetId={promiseLifecycle.promiseId}
                                            value={field.fact.value as NovelPromiseStateValue}
                                            sourceLabel={projectionSourceLabel(field.fact)}
                                          />
                                        )
                                      : (
                                          <>
                                            <div>{`${field.fact.field}: ${formatCanonValue(field.fact.value)}`}</div>
                                            <small style={{ opacity: .7 }}>{projectionSourceLabel(field.fact)}</small>
                                          </>
                                        )}
                                    <div style={{ opacity: .7 }}>
                                      {`出处范围：${formatJson(field.sourceRanges)}`}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                        <div style={{ marginTop: 6 }}>变化</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {entry.changes.map(change => (
                            <li
                              key={change.field}
                              data-promise-lifecycle-change={`${String(entry.revision)}:${change.field}`}
                              style={{ marginTop: 6 }}
                            >
                              <strong>{change.field}</strong>
                              <div>
                                {`之前：${change.before === undefined ? 'not set' : formatCanonValue(change.before.fact.value)}`}
                              </div>
                              <div>
                                {`之后：${change.after === undefined ? '已移除' : formatCanonValue(change.after.fact.value)}`}
                              </div>
                              {change.before !== undefined && (
                                <div style={{ opacity: .7 }}>
                                  {`之前出处范围：${formatJson(change.before.sourceRanges)} · ${projectionSourceLabel(change.before.fact)}`}
                                </div>
                              )}
                              {change.after !== undefined && (
                                <div style={{ opacity: .7 }}>
                                  {`之后出处范围：${formatJson(change.after.sourceRanges)} · ${projectionSourceLabel(change.after.fact)}`}
                                </div>
                              )}
                              {change.acceptedDelta !== undefined && (
                                <div>
                                  {`已接受变更：${change.acceptedDelta.operation} · ${change.acceptedDelta.id}`}
                                </div>
                              )}
                              <div style={{ opacity: .7 }}>
                                {`已接受变更出处范围：${formatJson(change.acceptedDeltaSourceRanges)}`}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <small style={{ opacity: .7 }}>
                          {`接受者：${entry.provenance.producer} · ${entry.provenance.taskId}`}
                        </small>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整承诺生命周期数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(promiseLifecycle)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="谜团揭示生命周期 builder" style={{ marginTop: 12 }}>
            <strong>谜团揭示生命周期</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Mystery
                <select
                  aria-label="Mystery lifecycle target"
                  value={selectedMysteryLifecycleId}
                  style={selectStyle}
                  disabled={
                    mysteryLifecycleTargets.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingMysteryLifecycle
                  }
                  onChange={event => {
                    setMysteryLifecycleId(event.currentTarget.value)
                    setMysteryLifecycle(null)
                  }}
                >
                  {mysteryLifecycleTargets.length === 0 && (
                    <option value="">暂无已接受谜团</option>
                  )}
                  {mysteryLifecycleTargets.map(mysteryId => (
                    <option key={mysteryId} value={mysteryId}>{mysteryId}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-mystery-lifecycle=""
                style={buttonStyle}
                disabled={
                  selectedMysteryLifecycleId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingMysteryLifecycle
                }
                onClick={() => { void buildMysteryLifecycle() }}
              >
                {buildingMysteryLifecycle ? '正在生成…' : '构建谜团生命周期'}
              </button>
            </div>
            {mysteryLifecycle !== null && (
              <article
                data-mystery-lifecycle=""
                aria-label="谜团揭示生命周期"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`Mystery lifecycle · R${String(mysteryLifecycle.revision)} · head R${String(mysteryLifecycle.headRevision)} · ${mysteryLifecycle.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`谜团：${mysteryLifecycle.mysteryId}`}</div>
                {mysteryLifecycle.entries.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受谜团变化</p>
                )}
                {mysteryLifecycle.entries.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {mysteryLifecycle.entries.map(entry => (
                      <li
                        key={entry.revision}
                        data-mystery-lifecycle-entry={String(entry.revision)}
                        style={{ marginTop: 10 }}
                      >
                        <strong>
                          {`R${String(entry.revision)} · ${entry.packetId}${entry.rollbackOfRevision === undefined ? '' : ` · rollback of R${String(entry.rollbackOfRevision)}`}`}
                        </strong>
                        <div style={{ marginTop: 4 }}>当前谜团状态</div>
                        {entry.fields.length === 0
                          ? <div style={{ opacity: .7 }}>暂无已接受状态</div>
                          : (
                              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                {entry.fields.map(field => (
                                  <li key={field.fact.field}>
                                    {field.fact.field === 'state'
                                      ? (
                                          <MysteryStateView
                                            targetId={mysteryLifecycle.mysteryId}
                                            value={field.fact.value as NovelMysteryStateValue}
                                            sourceLabel={projectionSourceLabel(field.fact)}
                                          />
                                        )
                                      : <div>{`${field.fact.field}: ${formatCanonValue(field.fact.value)}`}</div>}
                                    <div style={{ opacity: .7 }}>
                                      {`出处范围：${formatJson(field.sourceRanges)}`}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                        <section data-mystery-linked-clues="" style={{ marginTop: 6 }}>
                          <div>关联线索与误导线证据</div>
                          {entry.linkedClueEvidence.length === 0
                            ? <div style={{ opacity: .7 }}>无关联线索证据</div>
                            : (
                                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                  {entry.linkedClueEvidence.map(evidence => (
                                    <li key={evidence.clueId} style={{ marginTop: 6 }}>
                                      <ClueStateView
                                        targetId={evidence.clueId}
                                        value={evidence.value}
                                        sourceLabel={projectionSourceLabel(evidence)}
                                      />
                                      <div style={{ opacity: .7 }}>
                                        {`出处范围：${formatJson(evidence.sourceRanges)}`}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                        </section>
                        <div style={{ marginTop: 6 }}>变化</div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {entry.changes.map(change => (
                            <li
                              key={change.field}
                              data-mystery-lifecycle-change={`${String(entry.revision)}:${change.field}`}
                              style={{ marginTop: 6 }}
                            >
                              <strong>{change.field}</strong>
                              <div>
                                {`之前：${change.before === undefined ? 'not set' : formatCanonValue(change.before.fact.value)}`}
                              </div>
                              <div>
                                {`之后：${change.after === undefined ? '已移除' : formatCanonValue(change.after.fact.value)}`}
                              </div>
                              {change.before !== undefined && (
                                <div style={{ opacity: .7 }}>
                                  {`之前出处范围：${formatJson(change.before.sourceRanges)} · ${projectionSourceLabel(change.before.fact)}`}
                                </div>
                              )}
                              {change.after !== undefined && (
                                <div style={{ opacity: .7 }}>
                                  {`之后出处范围：${formatJson(change.after.sourceRanges)} · ${projectionSourceLabel(change.after.fact)}`}
                                </div>
                              )}
                              {change.acceptedDelta !== undefined && (
                                <div>
                                  {`已接受变更：${change.acceptedDelta.operation} · ${change.acceptedDelta.id}`}
                                </div>
                              )}
                              <div style={{ opacity: .7 }}>
                                {`已接受变更出处范围：${formatJson(change.acceptedDeltaSourceRanges)}`}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <small style={{ opacity: .7 }}>
                          {`接受者：${entry.provenance.producer} · ${entry.provenance.taskId}`}
                        </small>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整谜团生命周期数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(mysteryLifecycle)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="人物成长台账 builder" style={{ marginTop: 12 }}>
            <strong>人物成长台账</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Character
                <select
                  aria-label="Progression ledger character"
                  value={selectedProgressionCharacterId}
                  style={selectStyle}
                  disabled={
                    progressionCharacters.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingProgressionLedger
                  }
                  onChange={event => {
                    setProgressionCharacterId(event.currentTarget.value)
                    setProgressionLedger(null)
                  }}
                >
                  {progressionCharacters.length === 0 && (
                    <option value="">暂无已接受能力成长</option>
                  )}
                  {progressionCharacters.map(characterId => (
                    <option key={characterId} value={characterId}>{characterId}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-progression-ledger=""
                style={buttonStyle}
                disabled={
                  selectedProgressionCharacterId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingProgressionLedger
                }
                onClick={() => { void buildProgressionLedger() }}
              >
                {buildingProgressionLedger ? '正在生成…' : '构建成长台账'}
              </button>
            </div>
            {progressionLedger !== null && (
              <article
                data-progression-ledger=""
                aria-label="人物成长台账"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`Progression ledger · R${String(progressionLedger.revision)} · head R${String(progressionLedger.headRevision)} · ${progressionLedger.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`人物：${progressionLedger.characterId}`}</div>
                {progressionLedger.advancements.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受能力成长</p>
                )}
                {progressionLedger.advancements.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {progressionLedger.advancements.map(item => (
                      <li
                        key={item.advancementId}
                        data-progression-advancement={item.advancementId}
                        style={{ marginTop: 10 }}
                      >
                        <strong>{item.advancementId}</strong>
                        <div>{`${item.advancement.eventId} · story order ${String(item.advancement.storyOrder)}`}</div>
                        <div>{`维度：${item.advancement.dimension}`}</div>
                        <div>{`先前限制：${item.advancement.priorLimitation}`}</div>
                        <div>{`铺垫：${item.advancement.setup}`}</div>
                        <div>
                          {`证据：${item.advancement.evidence.length === 0 ? '无' : item.advancement.evidence.join(' · ')}`}
                        </div>
                        <div>{`促成行动：${item.advancement.enablingAction}`}</div>
                        <div>{`资源或牺牲：${item.advancement.resourceOrSacrifice}`}</div>
                        <div>{`新增能力：${item.advancement.newCapability}`}</div>
                        <div>{`剩余上限：${item.advancement.remainingLimit}`}</div>
                        <div>{`反制：${item.advancement.counter}`}</div>
                        <div>{`社会解读：${item.advancement.socialInterpretation}`}</div>
                        <div>{`下游后果：${item.advancement.downstreamConsequence}`}</div>
                        <div style={{ opacity: .7 }}>
                          {`出处范围：${formatJson(item.sourceRanges)}`}
                        </div>
                        <small style={{ opacity: .7 }}>{projectionSourceLabel(item)}</small>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整成长台账数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(progressionLedger)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="势力连续性台账" style={{ marginTop: 12 }}>
            <strong>势力目标与场外连续性</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Faction
                <select
                  aria-label="Faction continuity ledger faction"
                  value={selectedFactionId}
                  style={selectStyle}
                  disabled={
                    factionIds.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingFactionContinuity
                  }
                  onChange={event => {
                    setFactionId(event.currentTarget.value)
                    setFactionContinuity(null)
                  }}
                >
                  {factionIds.length === 0 && (
                    <option value="">暂无已接受势力连续性</option>
                  )}
                  {factionIds.map(candidate => (
                    <option key={candidate} value={candidate}>{candidate}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-faction-continuity=""
                style={buttonStyle}
                disabled={
                  selectedFactionId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingFactionContinuity
                }
                onClick={() => { void buildFactionContinuity() }}
              >
                {buildingFactionContinuity ? '正在生成…' : '构建势力连续性'}
              </button>
            </div>
            {factionContinuity !== null && (
              <article
                data-faction-continuity=""
                aria-label="势力目标与场外连续性 ledger"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`Faction continuity · R${String(factionContinuity.revision)} · head R${String(factionContinuity.headRevision)} · ${factionContinuity.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`势力：${factionContinuity.factionId}`}</div>
                {factionContinuity.entries.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受势力连续性</p>
                )}
                {factionContinuity.entries.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {factionContinuity.entries.map(item => (
                      <li
                        key={item.entryId}
                        data-faction-continuity-entry={item.entryId}
                        style={{ marginTop: 10 }}
                      >
                        <strong>{item.entryId}</strong>
                        <div>{`${item.continuity.eventId} · story order ${String(item.continuity.storyOrder)}`}</div>
                        <div>{`目标：${item.continuity.goal}`}</div>
                        <div>
                          {`资源：${item.continuity.resources.length === 0 ? '无' : item.continuity.resources.join(' · ')}`}
                        </div>
                        <div>
                          {`约束：${item.continuity.constraints.length === 0 ? '无' : item.continuity.constraints.join(' · ')}`}
                        </div>
                        <div>{`当前行动：${item.continuity.currentAction}`}</div>
                        <div>{`成员/联盟变化：${item.continuity.membershipOrAllianceChange}`}</div>
                        <div>{`场外后果：${item.continuity.offscreenConsequence}`}</div>
                        <div style={{ opacity: .7 }}>
                          {`出处范围：${formatJson(item.sourceRanges)}`}
                        </div>
                        <small style={{ opacity: .7 }}>{projectionSourceLabel(item)}</small>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整势力连续性数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(factionContinuity)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="地点连续性台账" style={{ marginTop: 12 }}>
            <strong>嵌套地点与通行连续性</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Location
                <select
                  aria-label="Location continuity ledger location"
                  value={selectedLocationId}
                  style={selectStyle}
                  disabled={
                    locationIds.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingLocationContinuity
                  }
                  onChange={event => {
                    setLocationId(event.currentTarget.value)
                    setLocationContinuity(null)
                  }}
                >
                  {locationIds.length === 0 && (
                    <option value="">暂无已接受地点连续性</option>
                  )}
                  {locationIds.map(candidate => (
                    <option key={candidate} value={candidate}>{candidate}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-location-continuity=""
                style={buttonStyle}
                disabled={
                  selectedLocationId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingLocationContinuity
                }
                onClick={() => { void buildLocationContinuity() }}
              >
                {buildingLocationContinuity ? '正在生成…' : '构建地点连续性'}
              </button>
            </div>
            {locationContinuity !== null && (
              <article
                data-location-continuity=""
                aria-label="嵌套地点与通行连续性 ledger"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`Location continuity · R${String(locationContinuity.revision)} · head R${String(locationContinuity.headRevision)} · ${locationContinuity.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`地点：${locationContinuity.locationId}`}</div>
                {locationContinuity.entries.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受地点连续性</p>
                )}
                {locationContinuity.entries.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {locationContinuity.entries.map(item => (
                      <li
                        key={item.entryId}
                        data-location-continuity-entry={item.entryId}
                        style={{ marginTop: 10 }}
                      >
                        <strong>{item.entryId}</strong>
                        <div>{`${item.continuity.eventId} · story order ${String(item.continuity.storyOrder)}`}</div>
                        <div>{`上级地点：${item.continuity.parentLocationId ?? '无'}`}</div>
                        <div>{`规模：${item.continuity.scale}`}</div>
                        <div>
                          {`通行条件：${item.continuity.accessConditions.length === 0 ? '无' : item.continuity.accessConditions.join(' · ')}`}
                        </div>
                        <div>
                          {`管辖势力：${item.continuity.governingFactionIds.length === 0 ? '无' : item.continuity.governingFactionIds.join(' · ')}`}
                        </div>
                        <div>
                          {`生效规则：${item.continuity.activeRuleIds.length === 0 ? '无' : item.continuity.activeRuleIds.join(' · ')}`}
                        </div>
                        <div>
                          {`资源流向：${item.continuity.resourceFlows.length === 0 ? '无' : item.continuity.resourceFlows.join(' · ')}`}
                        </div>
                        {item.continuity.travelLinks.length === 0 && <div>Travel: none</div>}
                        {item.continuity.travelLinks.map(travel => (
                          <div key={`${travel.destinationLocationId}:${travel.travelTime}:${travel.status}`}>
                            {`行程：${travel.destinationLocationId} · ${travel.travelTime} · ${travel.status} · ${travel.accessConditions.length === 0 ? '无' : travel.accessConditions.join(' · ')}`}
                          </div>
                        ))}
                        <div>{`当前变化：${item.continuity.currentChange}`}</div>
                        <div>{`后果：${item.continuity.consequence}`}</div>
                        <div style={{ opacity: .7 }}>
                          {`出处范围：${formatJson(item.sourceRanges)}`}
                        </div>
                        <small style={{ opacity: .7 }}>{projectionSourceLabel(item)}</small>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整地点连续性数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(locationContinuity)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="物件连续性台账" style={{ marginTop: 12 }}>
            <strong>物件保管与流转连续性</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Object
                <select
                  aria-label="Object continuity ledger object"
                  value={selectedObjectId}
                  style={selectStyle}
                  disabled={
                    objectIds.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingObjectContinuity
                  }
                  onChange={event => {
                    setObjectId(event.currentTarget.value)
                    setObjectContinuity(null)
                  }}
                >
                  {objectIds.length === 0 && (
                    <option value="">暂无已接受物件连续性</option>
                  )}
                  {objectIds.map(candidate => (
                    <option key={candidate} value={candidate}>{candidate}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-object-continuity=""
                style={buttonStyle}
                disabled={
                  selectedObjectId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingObjectContinuity
                }
                onClick={() => { void buildObjectContinuity() }}
              >
                {buildingObjectContinuity ? '正在生成…' : '构建物件连续性'}
              </button>
            </div>
            {objectContinuity !== null && (
              <article
                data-object-continuity=""
                aria-label="物件保管与流转连续性 ledger"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`Object continuity · R${String(objectContinuity.revision)} · head R${String(objectContinuity.headRevision)} · ${objectContinuity.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`物件：${objectContinuity.objectId}`}</div>
                {objectContinuity.entries.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受物件连续性</p>
                )}
                {objectContinuity.entries.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {objectContinuity.entries.map(item => (
                      <li
                        key={item.entryId}
                        data-object-continuity-entry={item.entryId}
                        style={{ marginTop: 10 }}
                      >
                        <strong>{item.entryId}</strong>
                        <div>{`${item.continuity.eventId} · story order ${String(item.continuity.storyOrder)}`}</div>
                        <div>{`持有者：${item.continuity.holderId ?? '无'}`}</div>
                        <div>{`地点：${item.continuity.locationId ?? '无'}`}</div>
                        <div>{`数量：${String(item.continuity.quantity)}`}</div>
                        <div>{`状态：${item.continuity.condition}`}</div>
                        <div>{`状态：${item.continuity.status}`}</div>
                        <div>{`当前变化：${item.continuity.currentChange}`}</div>
                        <div>{`后果：${item.continuity.consequence}`}</div>
                        <div style={{ opacity: .7 }}>
                          {`出处范围：${formatJson(item.sourceRanges)}`}
                        </div>
                        <small style={{ opacity: .7 }}>{projectionSourceLabel(item)}</small>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整物件连续性数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(objectContinuity)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="情绪连续性台账 builder" style={{ marginTop: 12 }}>
            <strong>情绪连续性台账</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Character
                <select
                  aria-label="Emotion continuity character"
                  value={selectedEmotionCharacterId}
                  style={selectStyle}
                  disabled={
                    emotionCharacters.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingEmotionContinuity
                  }
                  onChange={event => {
                    setEmotionCharacterId(event.currentTarget.value)
                    setEmotionContinuity(null)
                  }}
                >
                  {emotionCharacters.length === 0 && (
                    <option value="">暂无已接受情绪片段</option>
                  )}
                  {emotionCharacters.map(characterId => (
                    <option key={characterId} value={characterId}>{characterId}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-emotion-continuity=""
                style={buttonStyle}
                disabled={
                  selectedEmotionCharacterId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingEmotionContinuity
                }
                onClick={() => { void buildEmotionContinuity() }}
              >
                {buildingEmotionContinuity ? '正在生成…' : '构建情绪连续性'}
              </button>
            </div>
            {emotionContinuity !== null && (
              <article
                data-emotion-continuity=""
                aria-label="情绪连续性台账"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`Emotion continuity · R${String(emotionContinuity.revision)} · head R${String(emotionContinuity.headRevision)} · ${emotionContinuity.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`人物：${emotionContinuity.characterId}`}</div>
                {emotionContinuity.episodes.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受情绪片段</p>
                )}
                {emotionContinuity.episodes.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {emotionContinuity.episodes.map(item => (
                      <li
                        key={item.episodeId}
                        data-emotion-episode={item.episodeId}
                        style={{ marginTop: 10 }}
                      >
                        <strong>{item.episodeId}</strong>
                        <div>{`${item.episode.eventId} · story order ${String(item.episode.storyOrder)}`}</div>
                        <div>{`触发：${item.episode.trigger}`}</div>
                        <div>{`物件：${item.episode.object}`}</div>
                        <div>{`评估：${item.episode.appraisal}`}</div>
                        <div>
                          {`混合情绪：${item.episode.emotions.map(emotion => `${emotion.label} ${String(emotion.intensity)}`).join(' · ')}`}
                        </div>
                        <div>{`身体反应：${item.episode.bodilyExpression}`}</div>
                        <div>{`行动倾向：${item.episode.actionTendency}`}</div>
                        <div>{`表情：${item.episode.expression}`}</div>
                        <div>{`压抑：${item.episode.suppression}`}</div>
                        <div>{`应对：${item.episode.coping}`}</div>
                        <div>{`余留：${item.episode.residue}`}</div>
                        <div>
                          {`重新激活：${item.episode.reactivatesEpisodeIds.length === 0 ? '无' : item.episode.reactivatesEpisodeIds.join(' · ')}`}
                        </div>
                        <div>
                          {`后续选择：${item.episode.downstreamChoices.length === 0 ? '无' : item.episode.downstreamChoices.join(' · ')}`}
                        </div>
                        <div style={{ opacity: .7 }}>
                          {`出处范围：${formatJson(item.sourceRanges)}`}
                        </div>
                        <small style={{ opacity: .7 }}>{projectionSourceLabel(item)}</small>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整情绪连续性数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(emotionContinuity)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="认知边界台账 builder" style={{ marginTop: 12 }}>
            <strong>认知边界台账</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                对象
                <select
                  aria-label="Knowledge boundary subject"
                  value={selectedKnowledgeBoundarySubjectId}
                  style={selectStyle}
                  disabled={
                    knowledgeBoundarySubjects.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingKnowledgeBoundary
                  }
                  onChange={event => {
                    setKnowledgeBoundarySubjectId(event.currentTarget.value)
                    setKnowledgeBoundary(null)
                  }}
                >
                  {knowledgeBoundarySubjects.length === 0 && (
                    <option value="">暂无已接受认知主体</option>
                  )}
                  {knowledgeBoundarySubjects.map(subjectId => (
                    <option key={subjectId} value={subjectId}>{subjectId}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-knowledge-boundary=""
                style={buttonStyle}
                disabled={
                  selectedKnowledgeBoundarySubjectId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingKnowledgeBoundary
                }
                onClick={() => { void buildKnowledgeBoundary() }}
              >
                {buildingKnowledgeBoundary ? '正在生成…' : '构建认知边界'}
              </button>
            </div>
            {knowledgeBoundary !== null && (
              <KnowledgeBoundaryView boundary={knowledgeBoundary} />
            )}
          </section>
          <section id="novel-timeline" aria-label="故事时间线台账 builder" style={{ marginTop: 12 }}>
            <strong>故事时间线台账</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                参与者
                <select
                  aria-label="故事时间线参与者"
                  value={selectedTimelineParticipantId}
                  style={selectStyle}
                  disabled={
                    timelineParticipants.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || buildingTimelineLedger
                  }
                  onChange={event => {
                    setTimelineParticipantId(event.currentTarget.value)
                    setTimelineLedger(null)
                  }}
                >
                  {timelineParticipants.length === 0 && (
                    <option value="">暂无已接受故事事件参与者</option>
                  )}
                  {timelineParticipants.map(participantId => (
                    <option key={participantId} value={participantId}>{participantId}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-build-story-timeline=""
                style={buttonStyle}
                disabled={
                  selectedTimelineParticipantId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || buildingTimelineLedger
                }
                onClick={() => { void buildTimelineLedger() }}
              >
                {buildingTimelineLedger ? '正在生成…' : '构建故事时间线'}
              </button>
            </div>
            {timelineLedger !== null && (
              <article
                data-story-timeline-ledger=""
                aria-label="故事时间线台账"
                style={{ marginTop: 10 }}
              >
                <strong>
                  {`故事时间线 · R${String(timelineLedger.revision)} · head R${String(timelineLedger.headRevision)} · ${timelineLedger.freshness}`}
                </strong>
                <div style={{ marginTop: 6 }}>{`参与者：${timelineLedger.participantId}`}</div>
                {timelineLedger.events.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受故事事件</p>
                )}
                {timelineLedger.events.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {timelineLedger.events.map(projected => (
                      <li
                        key={projected.eventId}
                        data-story-timeline-event={projected.eventId}
                        style={{ marginTop: 8 }}
                      >
                        <strong>{projected.eventId}</strong>
                        <div>
                          {`${projected.event.storyTime.label} · ${String(projected.event.storyTime.startOrder)}${projected.event.storyTime.endOrder === undefined ? '' : ` → ${String(projected.event.storyTime.endOrder)}`}`}
                        </div>
                        <div>{`正文顺序：${String(projected.event.manuscriptOrder)}`}</div>
                        <div>{`参与者：${projected.event.participants.join(', ')}`}</div>
                        <div>{`地点：${projected.event.location}`}</div>
                        <div>{`影响：${formatJson(projected.event.effects)}`}</div>
                        <div style={{ opacity: .7 }}>
                          {`出处范围：${formatJson(projected.sourceRanges)}`}
                        </div>
                        <small style={{ opacity: .7 }}>{projectionSourceLabel(projected)}</small>
                      </li>
                    ))}
                  </ol>
                )}
                <section aria-label="故事时间线冲突" style={{ marginTop: 10 }}>
                  <strong>连续性冲突</strong>
                  {timelineLedger.locationConflicts.length === 0
                    ? <p style={{ marginBottom: 0, opacity: .7 }}>无重叠地点冲突</p>
                    : (
                        <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                          {timelineLedger.locationConflicts.map(conflict => (
                            <li
                              key={`${conflict.first.eventId}:${conflict.second.eventId}`}
                              data-story-timeline-location-conflict={`${conflict.first.eventId}:${conflict.second.eventId}`}
                              style={{ marginTop: 8 }}
                            >
                              <div>
                                {`重叠：${String(conflict.overlapStartOrder)}${conflict.overlapEndOrder === conflict.overlapStartOrder ? '' : ` → ${String(conflict.overlapEndOrder)}`}`}
                              </div>
                              <div>
                                {`${conflict.first.eventId} · ${conflict.first.event.location} · ${String(conflict.first.event.storyTime.startOrder)}${conflict.first.event.storyTime.endOrder === undefined ? '' : ` → ${String(conflict.first.event.storyTime.endOrder)}`}`}
                              </div>
                              <small style={{ opacity: .7 }}>{projectionSourceLabel(conflict.first)}</small>
                              <div>
                                {`${conflict.second.eventId} · ${conflict.second.event.location} · ${String(conflict.second.event.storyTime.startOrder)}${conflict.second.event.storyTime.endOrder === undefined ? '' : ` → ${String(conflict.second.event.storyTime.endOrder)}`}`}
                              </div>
                              <small style={{ opacity: .7 }}>{projectionSourceLabel(conflict.second)}</small>
                            </li>
                          ))}
                        </ol>
                      )}
                </section>
                <details style={{ marginTop: 8 }}>
                  <summary>完整故事时间线数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(timelineLedger)}
                  </pre>
                </details>
              </article>
            )}
          </section>
          <section aria-label="因果影响链工具" style={{ marginTop: 12 }}>
            <strong>因果影响链</strong>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                Source event
                <select
                  aria-label="因果链起点事件"
                  value={selectedCausalImpactEventId}
                  style={selectStyle}
                  disabled={
                    causalImpactEvents.length === 0
                    || status === 'loading'
                    || rollingBack
                    || accepting
                    || tracingCausalImpact
                  }
                  onChange={event => {
                    setCausalImpactEventId(event.currentTarget.value)
                    setCausalImpact(null)
                  }}
                >
                  {causalImpactEvents.length === 0 && (
                    <option value="">暂无已接受故事事件</option>
                  )}
                  {causalImpactEvents.map(event => (
                    <option key={event.targetId} value={event.targetId}>
                      {typeof event.fields.summary === 'string'
                        ? `${event.targetId} · ${event.fields.summary}`
                        : event.targetId}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-trace-causal-impact=""
                style={buttonStyle}
                disabled={
                  selectedCausalImpactEventId.length === 0
                  || status === 'loading'
                  || rollingBack
                  || accepting
                  || tracingCausalImpact
                }
                onClick={() => { void traceCausalImpact() }}
              >
                {tracingCausalImpact ? '正在追踪…' : '追踪因果影响'}
              </button>
            </div>
            {causalImpact !== null && (
              <article
                data-causal-impact-trace=""
                aria-label="因果影响链"
                style={{ marginTop: 10 }}
              >
                <strong>{`Causal impact · R${String(causalImpact.revision)}`}</strong>
                <div style={{ marginTop: 6 }}>
                  {`起点事件：${causalImpact.impact.sourceEventId}`}
                </div>
                {causalImpact.impact.affected.length === 0 && (
                  <p style={{ marginBottom: 0, opacity: .7 }}>无下游事件</p>
                )}
                {causalImpact.impact.affected.length > 0 && (
                  <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {causalImpact.impact.affected.map(affected => (
                      <li
                        key={affected.eventId}
                        data-causal-impact-event={affected.eventId}
                        style={{ marginTop: 8 }}
                      >
                        <div><strong>{`${affected.eventId} · depth ${String(affected.depth)}`}</strong></div>
                        <ol
                          aria-label={`最短因果路径：${affected.eventId}`}
                          style={{ margin: '4px 0 0', paddingLeft: 18 }}
                        >
                          {affected.path.map(edge => (
                            <li
                              key={edge.id}
                              data-causal-impact-edge={edge.id}
                            >
                              <div>{`${edge.id} · ${edge.from} → ${edge.to} · ${edge.label}`}</div>
                              <div style={{ opacity: .7 }}>
                                {`出处范围：${formatJson(edge.sourceRanges)}`}
                              </div>
                              <small style={{ opacity: .7 }}>{projectionSourceLabel(edge)}</small>
                            </li>
                          ))}
                        </ol>
                      </li>
                    ))}
                  </ol>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>完整因果链数据</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {formatJson(causalImpact.impact)}
                  </pre>
                </details>
              </article>
            )}
          </section>
        </section>
      )}
      {snapshot !== null && (
        <section
          data-novel-project-relationships=""
          aria-label="人物关系"
          style={{ marginTop: 12 }}
        >
          <strong>
            {snapshot.relationships === null
              ? '人物关系暂不可用'
              : `人物关系 · R${String(snapshot.relationships.revision)}`}
          </strong>
          {snapshot.relationships === null
            ? <p style={{ marginBottom: 0, opacity: .7 }}>已接受人物关系投影不可用</p>
            : <RelationshipProjectionView projection={snapshot.relationships} />}
        </section>
      )}
      </div>
      {message !== null && status !== 'error' && (
        <p aria-live="polite" style={{ marginBottom: 0 }}>{message}</p>
      )}
    </aside>
  )
}

function KnowledgeBoundaryView({
  boundary,
  writingMemory = false,
}: {
  readonly boundary: NovelKnowledgeBoundary
  readonly writingMemory?: boolean | undefined
}) {
  return (
    <article
      data-knowledge-boundary-ledger=""
      data-knowledge-boundary-subject={boundary.subjectId}
      data-writing-memory-knowledge-boundary={writingMemory ? boundary.subjectId : undefined}
      aria-label="认知边界台账"
      style={{ marginTop: 10 }}
    >
      <strong>
        {`Knowledge boundary · R${String(boundary.revision)} · head R${String(boundary.headRevision)} · ${boundary.freshness}`}
      </strong>
      <div style={{ marginTop: 6 }}>{`对象：${boundary.subjectId}`}</div>
      {boundary.entries.length === 0 && (
        <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受已知事实</p>
      )}
      {boundary.entries.length > 0 && (
        <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {boundary.entries.map(entry => (
            <li
              key={entry.factId}
              data-knowledge-boundary-entry={entry.factId}
              style={{ marginTop: 8 }}
            >
              <strong>{entry.factId}</strong>
              <section aria-label={`${entry.factId} knowledge fields`} style={{ marginTop: 4 }}>
                <div>认知字段</div>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {entry.knowledgeFields.map(field => (
                    <li key={field.fact.sourceDeltaId}>
                      {field.fact.field === 'state'
                        ? (
                            <KnowledgeStateView
                              targetId={field.fact.targetId}
                              value={field.fact.value as NovelKnowledgeStateValue}
                              sourceLabel={projectionSourceLabel(field.fact)}
                            />
                          )
                        : (
                            <>
                              <div>
                                {`${field.fact.kind} · ${field.fact.targetId} · ${field.fact.field}: ${formatCanonValue(field.fact.value)}`}
                              </div>
                              <small style={{ opacity: .7 }}>{projectionSourceLabel(field.fact)}</small>
                            </>
                          )}
                      <div style={{ opacity: .7 }}>
                        {`出处范围：${formatJson(field.sourceRanges)}`}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label={`${entry.factId} accepted fact fields`} style={{ marginTop: 4 }}>
                <div>已接受字段</div>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {entry.factFields.map(field => (
                    <li key={field.fact.sourceDeltaId}>
                      <div>
                        {`${field.fact.kind} · ${field.fact.targetId} · ${field.fact.field}: ${formatCanonValue(field.fact.value)}`}
                      </div>
                      <div style={{ opacity: .7 }}>
                        {`出处范围：${formatJson(field.sourceRanges)}`}
                      </div>
                      <small style={{ opacity: .7 }}>{projectionSourceLabel(field.fact)}</small>
                    </li>
                  ))}
                </ul>
              </section>
            </li>
          ))}
        </ol>
      )}
      <details style={{ marginTop: 8 }}>
        <summary>完整认知边界数据</summary>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {formatJson(boundary)}
        </pre>
      </details>
    </article>
  )
}

function CharacterArcHypothesisDetails({
  character,
}: {
  readonly character: NovelWritingMemoryRecall['characterArcHypotheses'][number]
}) {
  const characterArc = character.fact.value as NovelCharacterArcHypothesisValue
  return (
    <>
      <strong>{`Character arc hypothesis v${String(characterArc.version)}`}</strong>
      <div>{`人物：${character.characterId}`}</div>
      <div>{`假设：${characterArc.hypothesis}`}</div>
      <div>{`范围：${characterArc.scopeUnitId}`}</div>
      <div>{`起始信念：${characterArc.startingBelief}`}</div>
      <div>{`目标转变：${characterArc.targetTransformation}`}</div>
      <div>转变维度</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {characterArc.transformationDimensions.map(dimension => (
          <li key={dimension}>{dimension}</li>
        ))}
      </ul>
      <div>当前压力</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {characterArc.pressures.map(pressure => (
          <li key={pressure}>{pressure}</li>
        ))}
      </ul>
      <div>已接受决定链</div>
      {characterArc.decisionChain.length === 0
        ? <div style={{ opacity: .7 }}>暂无已接受的人物弧决定</div>
        : (
            <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {characterArc.decisionChain.map(decision => (
                <li key={decision.decisionId} style={{ marginTop: 6 }}>
                  <strong>{decision.decisionId}</strong>
                  <div>{`事件：${decision.storyEventId}`}</div>
                  <div>{`压力：${decision.pressure}`}</div>
                  <div>{`选择：${decision.choice}`}</div>
                  <div>{`被拒备选：${decision.rejectedAlternatives.join(' · ')}`}</div>
                  <div>{`代价：${decision.cost}`}</div>
                  <div>{`持久后果：${decision.persistentConsequence}`}</div>
                  <div>{`转变证据：${decision.transformationEvidence}`}</div>
                </li>
              ))}
            </ol>
          )}
      <div>{`当前阶段：${characterArc.currentStage}`}</div>
      <div>{`未解问题：${characterArc.unresolvedQuestion}`}</div>
      <div>{`修订理由：${characterArc.changeRationale ?? '无'}`}</div>
      <small style={{ display: 'block', opacity: .7 }}>
        {projectionSourceLabel(character.fact)}
      </small>
      <div style={{ opacity: .7 }}>
        {`出处范围：${formatJson(character.sourceRanges)}`}
      </div>
      <div style={{ opacity: .7 }}>
        {`来源信息：${formatJson(character.fact.provenance)}`}
      </div>
    </>
  )
}

function WritingMemoryResultsView({
  result,
}: {
  readonly result: WritingMemoryToolResult
}) {
  const memory = result.writingMemory
  return (
    <section
      data-novel-writing-memory=""
      aria-label="写作记忆"
      style={{ marginTop: 12 }}
    >
      <strong>{`写作记忆 · R${String(result.revision)} · ${result.freshness}`}</strong>
      <div data-writing-memory-query="" style={{ marginTop: 6 }}>
        {`写作意图：${memory.query}`}
      </div>
      <div style={{ opacity: .7 }}>
        {`最新版本：R${String(result.headRevision)}`}
      </div>

      <section aria-label="写作记忆 character carry-forward" style={{ marginTop: 8 }}>
        <strong>人物延续</strong>
        {memory.characterCarryForward.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受人物延续状态</p>
          : (
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {memory.characterCarryForward.map(character => (
                  <li
                    key={character.characterId}
                    data-writing-memory-character={character.characterId}
                    style={{ marginTop: 6 }}
                  >
                    <div>
                      {`${character.characterId} · ${character.carries.length === 0
                        ? 'No carry-forward state'
                        : character.carries.join(' · ')}`}
                    </div>
                    <div>{`来源章节：${character.sourceChapter.id}`}</div>
                    <small style={{ opacity: .7 }}>{projectionSourceLabel(character)}</small>
                    <div style={{ opacity: .7 }}>
                      {`出处范围：${formatJson(character.sourceRanges)}`}
                    </div>
                    <div style={{ opacity: .7 }}>
                      {`来源信息：${formatJson(character.provenance)}`}
                    </div>
                  </li>
                ))}
              </ol>
            )}
      </section>

      <section aria-label="写作记忆 character arc hypotheses" style={{ marginTop: 8 }}>
        <strong>人物弧假设</strong>
        {memory.characterArcHypotheses.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受人物弧假设</p>
          : (
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {memory.characterArcHypotheses.map(character => (
                  <li
                    key={character.characterId}
                    data-writing-memory-character-arc={character.characterId}
                    style={{ marginTop: 6 }}
                  >
                    <CharacterArcHypothesisDetails character={character} />
                  </li>
                ))}
              </ol>
            )}
      </section>

      <section
        data-writing-memory-reader-disclosure={memory.latestReaderDisclosure?.sourceChapter.id}
        aria-label="写作记忆 reader disclosure"
        style={{ marginTop: 8 }}
      >
        <strong>读者认知延续</strong>
        {memory.latestReaderDisclosure === null
          ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受读者披露</p>
          : (
              <article style={{ marginTop: 6 }}>
                <div>{`来源章节：${memory.latestReaderDisclosure.sourceChapter.id}`}</div>
                <div style={{ marginTop: 4 }}>读者现已知道</div>
                {memory.latestReaderDisclosure.readerNowKnows.length === 0
                  ? <p style={{ margin: '4px 0 0', opacity: .7 }}>无已披露认知</p>
                  : (
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {memory.latestReaderDisclosure.readerNowKnows.map(knowledge => (
                          <li key={knowledge}>{knowledge}</li>
                        ))}
                      </ul>
                    )}
                <div style={{ marginTop: 4 }}>读者现已怀疑</div>
                {memory.latestReaderDisclosure.readerNowSuspects.length === 0
                  ? <p style={{ margin: '4px 0 0', opacity: .7 }}>无已披露疑心</p>
                  : (
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {memory.latestReaderDisclosure.readerNowSuspects.map(suspicion => (
                          <li key={suspicion}>{suspicion}</li>
                        ))}
                      </ul>
                    )}
                <small style={{ display: 'block', opacity: .7 }}>
                  {projectionSourceLabel(memory.latestReaderDisclosure)}
                </small>
                <div style={{ opacity: .7 }}>
                  {`出处范围：${formatJson(memory.latestReaderDisclosure.sourceRanges)}`}
                </div>
                <div style={{ opacity: .7 }}>
                  {`来源信息：${formatJson(memory.latestReaderDisclosure.provenance)}`}
                </div>
              </article>
            )}
      </section>

      <section
        data-writing-memory-chapter-outcome={memory.latestChapterOutcome?.sourceChapter.id}
        aria-label="写作记忆 latest Chapter outcome"
        style={{ marginTop: 8 }}
      >
        <strong>最新章节结果</strong>
        {memory.latestChapterOutcome === null
          ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受章节结果</p>
          : (
              <article style={{ marginTop: 6 }}>
                <div>{`来源章节：${memory.latestChapterOutcome.sourceChapter.id}`}</div>
                <div>{`合同结果：${memory.latestChapterOutcome.contractAssessment.outcome}`}</div>
                <div>
                  {`合同版本：R${String(memory.latestChapterOutcome.contractAssessment.contractRevision)} · Delta: ${memory.latestChapterOutcome.contractAssessment.contractSourceDeltaId}`}
                </div>
                <div style={{ marginTop: 4 }}>合同偏差</div>
                {memory.latestChapterOutcome.contractAssessment.deviations.length === 0
                  ? <p style={{ margin: '4px 0 0', opacity: .7 }}>无合同偏差</p>
                  : (
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {memory.latestChapterOutcome.contractAssessment.deviations.map(deviation => (
                          <li key={deviation}>{deviation}</li>
                        ))}
                      </ul>
                    )}
                <div>
                  {`正文来源版本：R${String(memory.latestChapterOutcome.manuscriptSourceRevision)}`}
                </div>
                <div style={{ marginTop: 4 }}>变化</div>
                {memory.latestChapterOutcome.changes.length === 0
                  ? <p style={{ margin: '4px 0 0', opacity: .7 }}>无已记录变化</p>
                  : (
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {memory.latestChapterOutcome.changes.map(change => (
                          <li key={change}>{change}</li>
                        ))}
                      </ul>
                    )}
                <div style={{ marginTop: 4 }}>代价</div>
                {memory.latestChapterOutcome.costs.length === 0
                  ? <p style={{ margin: '4px 0 0', opacity: .7 }}>无已记录代价</p>
                  : (
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {memory.latestChapterOutcome.costs.map(cost => (
                          <li key={cost}>{cost}</li>
                        ))}
                      </ul>
                    )}
                <div style={{ marginTop: 4 }}>新增可能</div>
                {memory.latestChapterOutcome.newlyPossible.length === 0
                  ? <p style={{ margin: '4px 0 0', opacity: .7 }}>无新增可能状态</p>
                  : (
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {memory.latestChapterOutcome.newlyPossible.map(possible => (
                          <li key={possible}>{possible}</li>
                        ))}
                      </ul>
                    )}
                <div style={{ marginTop: 4 }}>新增不可能</div>
                {memory.latestChapterOutcome.newlyImpossible.length === 0
                  ? <p style={{ margin: '4px 0 0', opacity: .7 }}>无新增不可能状态</p>
                  : (
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {memory.latestChapterOutcome.newlyImpossible.map(impossible => (
                          <li key={impossible}>{impossible}</li>
                        ))}
                      </ul>
                    )}
                <small style={{ display: 'block', opacity: .7 }}>
                  {projectionSourceLabel(memory.latestChapterOutcome)}
                </small>
                <div style={{ opacity: .7 }}>
                  {`出处范围：${formatJson(memory.latestChapterOutcome.sourceRanges)}`}
                </div>
                <div style={{ opacity: .7 }}>
                  {`来源信息：${formatJson(memory.latestChapterOutcome.provenance)}`}
                </div>
              </article>
            )}
      </section>

      <section
        data-writing-memory-relationships=""
        aria-label="写作记忆 relationship carry-forward"
        style={{ marginTop: 8 }}
      >
        <strong>关系延续</strong>
        <RelationshipProjectionView projection={{
          projectId: result.projectId,
          workspaceId: result.workspaceId,
          revision: result.revision,
          relationships: memory.relationshipCarryForward,
        }} />
        {memory.relationshipCarryForward.length > 0 && (
          <details style={{ marginTop: 6 }}>
            <summary>完整关系延续数据</summary>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {formatJson(memory.relationshipCarryForward)}
            </pre>
          </details>
        )}
      </section>

      <section
        data-writing-memory-knowledge-boundaries=""
        aria-label="写作记忆 knowledge boundaries"
        style={{ marginTop: 8 }}
      >
        <strong>认知边界</strong>
        {memory.knowledgeBoundaries.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受人物或读者认知</p>
          : memory.knowledgeBoundaries.map(boundary => (
              <KnowledgeBoundaryView
                key={boundary.subjectId}
                boundary={boundary}
                writingMemory
              />
            ))}
      </section>

      <section aria-label="写作记忆 authoring contracts" style={{ marginTop: 8 }}>
        <strong>写作合同</strong>
        {memory.authoringContracts.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受创作合同</p>
          : (
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {memory.authoringContracts.map((contract) => {
                  const { fact } = contract
                  const key = `${fact.kind}:${fact.targetId}:${fact.field}`
                  return (
                    <li
                      key={key}
                      data-writing-memory-authoring-contract={key}
                      style={{ marginTop: 6 }}
                    >
                      <div>{`${fact.kind} · ${fact.targetId} · ${fact.field}: ${formatCanonValue(fact.value)}`}</div>
                      <small style={{ opacity: .7 }}>{projectionSourceLabel(fact)}</small>
                      {contract.evidence.length > 0 && (
                        <ul
                          aria-label={`${key} manuscript evidence`}
                          style={{ margin: '4px 0 0', paddingLeft: 18 }}
                        >
                          {contract.evidence.map(evidence => (
                            <WritingMemoryAuthoringEvidenceView
                              key={writingMemoryAuthoringEvidenceKey(evidence)}
                              evidence={evidence}
                            />
                          ))}
                        </ul>
                      )}
                      <WritingMemoryAuthoringContractEvidenceView contract={contract} />
                    </li>
                  )
                })}
              </ol>
            )}
      </section>

      <section aria-label="写作记忆 rolling roadmaps" style={{ marginTop: 8 }}>
        <strong>滚动路线图</strong>
        {memory.roadmaps.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>无匹配滚动路线图</p>
          : (
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {memory.roadmaps.map(recalled => (
                  <li
                    key={recalled.resolution.roadmapId}
                    data-writing-memory-roadmap={recalled.resolution.roadmapId}
                    style={{ marginTop: 6 }}
                  >
                    <RollingRoadmapResolutionView resolution={recalled.resolution} />
                    <WritingMemoryEvidenceView evidence={recalled} />
                  </li>
                ))}
              </ol>
            )}
      </section>

      <section id="novel-memory" aria-label="写作记忆 故事结构" style={{ marginTop: 8 }}>
        <strong>故事结构</strong>
        {memory.narrativeUnits.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>使用已接受的章节控制包，或尚无匹配的故事结构</p>
          : (
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {memory.narrativeUnits.map((recalled) => {
                  const { unit } = recalled
                  const level = `${unit.level.charAt(0).toUpperCase()}${unit.level.slice(1)}`
                  return (
                    <li
                      key={unit.id}
                      data-writing-memory-narrative={unit.id}
                      style={{ marginTop: 6 }}
                    >
                      <div><strong>{`${level} · ${unit.id} · ${unit.status}`}</strong></div>
                      <div>{`目标：${unit.objective}`}</div>
                      <div>{`进入 → 退出：${unit.entryState} → ${unit.exitState}`}</div>
                      {unit.chapterContract !== undefined && (
                        <div>{`章节合同：${formatJson(unit.chapterContract)}`}</div>
                      )}
                      <small style={{ opacity: .7 }}>{projectionSourceLabel(unit)}</small>
                      <WritingMemoryEvidenceView evidence={recalled} />
                    </li>
                  )
                })}
              </ol>
            )}
      </section>

      <section aria-label="写作记忆 manuscript excerpts" style={{ marginTop: 8 }}>
        <strong>正文摘录</strong>
        {memory.manuscriptExcerpts.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>无匹配正文摘录</p>
          : (
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {memory.manuscriptExcerpts.map(excerpt => (
                  <li
                    key={excerpt.unitId}
                    data-writing-memory-manuscript={excerpt.unitId}
                    style={{ marginTop: 6 }}
                  >
                    <strong>{`${excerpt.title} · ${excerpt.unitId}`}</strong>
                    <div>{excerpt.excerpt}</div>
                    <WritingMemoryEvidenceView evidence={excerpt} />
                  </li>
                ))}
              </ol>
            )}
      </section>

      <section aria-label="写作记忆 setting facts" style={{ marginTop: 8 }}>
        <strong>设定事实</strong>
        {memory.settingFacts.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>无匹配设定事实</p>
          : (
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {memory.settingFacts.map(recalled => {
                  const { fact } = recalled
                  const key = `${fact.kind}:${fact.targetId}:${fact.field}`
                  return (
                    <li
                      key={key}
                      data-writing-memory-setting={key}
                      style={{ marginTop: 6 }}
                    >
                      <div>{`${fact.kind} · ${fact.targetId} · ${fact.field}: ${formatCanonValue(fact.value)}`}</div>
                      <small style={{ opacity: .7 }}>{projectionSourceLabel(fact)}</small>
                      <WritingMemoryEvidenceView evidence={recalled} />
                    </li>
                  )
                })}
              </ol>
            )}
      </section>

      <section aria-label="写作记忆 continuity" style={{ marginTop: 8 }}>
        <strong>连续性</strong>
        {memory.continuityHits.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>无匹配连续性</p>
          : (
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {memory.continuityHits.map((recalled) => {
                  const source = recalled.kind === 'canon-fact' ? recalled.fact : recalled.entry
                  return (
                    <li
                      key={`${recalled.kind}:${source.sourceDeltaId}`}
                      data-writing-memory-continuity={`${recalled.kind}:${source.sourceDeltaId}`}
                      style={{ marginTop: 6 }}
                    >
                      {recalled.kind === 'canon-fact'
                        ? (
                            <div>
                              {`${recalled.fact.kind} · ${recalled.fact.targetId} · ${recalled.fact.field}: ${formatCanonValue(recalled.fact.value)}`}
                            </div>
                          )
                        : (
                            <>
                              <div>{`${recalled.entry.clock} · ${recalled.entry.unitId}`}</div>
                              <div>{`${recalled.entry.movement} · ${recalled.entry.state}`}</div>
                            </>
                          )}
                      <small style={{ opacity: .7 }}>{projectionSourceLabel(source)}</small>
                      <WritingMemoryEvidenceView evidence={recalled} />
                    </li>
                  )
                })}
              </ol>
            )}
      </section>

      <section aria-label="写作记忆 narrative debts" style={{ marginTop: 8 }}>
        <strong>叙事债务</strong>
        {memory.debts.length === 0
          ? <p style={{ marginBottom: 0, opacity: .7 }}>无匹配的叙事债务</p>
          : (
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {memory.debts.map((recalled) => {
                  const { debt } = recalled
                  return (
                    <li
                      key={`${debt.clock}:${debt.id}`}
                      data-writing-memory-debt={debt.id}
                      style={{ marginTop: 6 }}
                    >
                      <div>{`${debt.clock} · ${debt.id} · ${debt.status}`}</div>
                      <div>{debt.summary}</div>
                      <small style={{ opacity: .7 }}>{projectionSourceLabel(debt)}</small>
                      <WritingMemoryEvidenceView evidence={recalled} />
                    </li>
                  )
                })}
              </ol>
            )}
      </section>
    </section>
  )
}

function RollingRoadmapResolutionView({
  resolution,
}: {
  readonly resolution: NovelRollingRoadmapResolution
}) {
  return (
    <article
      data-roadmap-resolution=""
      aria-label="滚动路线图 dependency and debt resolution"
      style={{ marginTop: 10 }}
    >
      <strong>
        {`滚动路线图 · R${String(resolution.sourceRevision)} · v${String(resolution.value.version)}`}
      </strong>
      <div style={{ marginTop: 6 }}>{`路线图：${resolution.roadmapId}`}</div>
      <div>{`细化到：${resolution.value.detailedThroughUnitId}`}</div>
      <div>{resolution.value.horizonSummary}</div>
      <small style={{ display: 'block', marginTop: 4, opacity: .7 }}>
        {projectionSourceLabel(resolution)}
      </small>
      <div style={{ opacity: .7 }}>
        {`出处范围：${formatJson(resolution.sourceRanges)}`}
      </div>
      <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>
        {resolution.orderedUnits.map((projected, unitIndex) => (
          <li
            key={`${projected.unit.unitId}:${String(projected.unit.order)}:${String(unitIndex)}`}
            data-roadmap-unit={projected.unit.unitId}
            style={{ marginTop: 12 }}
          >
            <strong>{`${projected.unit.unitId} · order ${String(projected.unit.order)}`}</strong>
            <div>
              {`章节 ${String(projected.unit.targetChapterStart)}–${String(projected.unit.targetChapterEnd)}`}
            </div>
            <div>{`里程碑：${projected.unit.milestone}`}</div>
            <div>{`状态：${projected.unit.status}`}</div>
            <div>{`改动理由：${projected.unit.changeRationale ?? '无'}`}</div>
            <section aria-label={`Dependencies for ${projected.unit.unitId}`} style={{ marginTop: 6 }}>
              <strong>依赖项</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {projected.dependsOnUnitIds.resolved.map((reference, referenceIndex) => (
                  <li
                    key={`resolved:${reference.unitId}:${String(referenceIndex)}`}
                    data-roadmap-dependency-reference={reference.unitId}
                    data-roadmap-dependency-status="resolved"
                  >
                    {`已解析 · ${reference.unitId} · 章节 ${String(reference.unit.targetChapterStart)}–${String(reference.unit.targetChapterEnd)} · ${reference.unit.milestone} · ${reference.unit.status}`}
                  </li>
                ))}
                {projected.dependsOnUnitIds.missing.map((unitId, referenceIndex) => (
                  <li
                    key={`missing:${unitId}:${String(referenceIndex)}`}
                    data-roadmap-dependency-reference={unitId}
                    data-roadmap-dependency-status="missing"
                  >
                    {`缺失 · ${unitId}`}
                  </li>
                ))}
                {projected.dependsOnUnitIds.ambiguous.map((reference, referenceIndex) => (
                  <li
                    key={`ambiguous:${reference.unitId}:${String(referenceIndex)}`}
                    data-roadmap-dependency-reference={reference.unitId}
                    data-roadmap-dependency-status="ambiguous"
                  >
                    <div>{`歧义 · ${reference.unitId}`}</div>
                    <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {reference.candidates.map((candidate, candidateIndex) => (
                        <li
                          key={`${candidate.unitId}:${String(candidate.order)}:${String(candidateIndex)}`}
                          data-roadmap-dependency-candidate=""
                        >
                          {`章节 ${String(candidate.targetChapterStart)}–${String(candidate.targetChapterEnd)} · ${candidate.milestone} · ${candidate.status}`}
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label={`关联债务 for ${projected.unit.unitId}`} style={{ marginTop: 6 }}>
              <strong>关联债务</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {projected.scopedDebtIds.resolved.map((reference, referenceIndex) => (
                  <li
                    key={`resolved:${reference.debtId}:${String(referenceIndex)}`}
                    data-roadmap-debt-reference={reference.debtId}
                    data-roadmap-debt-status="resolved"
                  >
                    <div>
                      {`已解析 · ${reference.debtId} · ${reference.debt.clock} · ${reference.debt.unitId}`}
                    </div>
                    <div>{`${reference.debt.summary} · ${reference.debt.status}`}</div>
                    <small style={{ display: 'block', opacity: .7 }}>
                      {projectionSourceLabel(reference.debt)}
                    </small>
                    <div style={{ opacity: .7 }}>
                      {`出处范围：${formatJson(reference.sourceRanges)}`}
                    </div>
                  </li>
                ))}
                {projected.scopedDebtIds.missing.map((debtId, referenceIndex) => (
                  <li
                    key={`missing:${debtId}:${String(referenceIndex)}`}
                    data-roadmap-debt-reference={debtId}
                    data-roadmap-debt-status="missing"
                  >
                    {`缺失 · ${debtId}`}
                  </li>
                ))}
                {projected.scopedDebtIds.ambiguous.map((reference, referenceIndex) => (
                  <li
                    key={`ambiguous:${reference.debtId}:${String(referenceIndex)}`}
                    data-roadmap-debt-reference={reference.debtId}
                    data-roadmap-debt-status="ambiguous"
                  >
                    <div>{`歧义 · ${reference.debtId}`}</div>
                    <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {reference.candidates.map((candidate, candidateIndex) => (
                        <li
                          key={`${candidate.debt.clock}:${candidate.debt.sourceDeltaId}:${String(candidateIndex)}`}
                          data-roadmap-debt-candidate=""
                        >
                          <div>
                            {`${candidate.debt.id} · ${candidate.debt.clock} · ${candidate.debt.unitId}`}
                          </div>
                          <div>{`${candidate.debt.summary} · ${candidate.debt.status}`}</div>
                          <small style={{ display: 'block', opacity: .7 }}>
                            {projectionSourceLabel(candidate.debt)}
                          </small>
                          <div style={{ opacity: .7 }}>
                            {`出处范围：${formatJson(candidate.sourceRanges)}`}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
            </section>
          </li>
        ))}
      </ol>
      <details style={{ marginTop: 8 }}>
        <summary>完整路线图解析</summary>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {formatJson(resolution)}
        </pre>
      </details>
    </article>
  )
}

function writingMemoryAuthoringEvidenceKey(
  evidence: NovelWritingMemoryAuthoringContract['evidence'][number],
): string {
  return evidence.kind === 'approved-style-exemplar'
    ? `${evidence.kind}:${evidence.exemplarId}`
    : `${evidence.kind}:${evidence.evidenceId}`
}

function WritingMemoryAuthoringEvidenceView({
  evidence,
}: {
  readonly evidence: NovelWritingMemoryAuthoringContract['evidence'][number]
}) {
  const key = writingMemoryAuthoringEvidenceKey(evidence)
  const description = evidence.kind === 'approved-style-exemplar'
    ? `目的：${evidence.purpose}`
    : `证明：${evidence.demonstrates}`
  return (
    <li data-writing-memory-contract-evidence={key} style={{ marginTop: 6 }}>
      <div>{`${evidence.kind} · ${evidence.sourceUnitId} · R${String(evidence.sourceRevision)}`}</div>
      <div>{description}</div>
      <blockquote style={{ margin: '4px 0' }}>{evidence.excerpt}</blockquote>
      <div style={{ opacity: .7 }}>
        <div>{`出处范围：${formatJson(evidence.sourceRanges)}`}</div>
        <div>
          {`来源信息：${evidence.provenance.taskId} · ${evidence.provenance.sessionId} · ${evidence.provenance.producer}`}
        </div>
      </div>
    </li>
  )
}

function WritingMemoryAuthoringContractEvidenceView({
  contract,
}: {
  readonly contract: NovelWritingMemoryAuthoringContract
}) {
  return (
    <div style={{ marginTop: 2, opacity: .7 }}>
      <div>{`来源版本：R${String(contract.sourceRevision)}`}</div>
      <div>{`出处范围：${formatJson(contract.sourceRanges)}`}</div>
      <div>
        {`来源信息：${contract.provenance.taskId} · ${contract.provenance.sessionId} · ${contract.provenance.producer}`}
      </div>
    </div>
  )
}

function WritingMemoryEvidenceView({
  evidence,
}: {
  readonly evidence: NovelWritingMemoryEvidence
}) {
  const terms = evidence.terms.length === 0 ? '无' : evidence.terms.join(', ')
  return (
    <div style={{ marginTop: 2, opacity: .7 }}>
      <div>
        {`得分：${String(evidence.score)} · 词项：${terms} · 来源版本：R${String(evidence.sourceRevision)}`}
      </div>
      <div>{`出处范围：${formatJson(evidence.sourceRanges)}`}</div>
      <div>
        {`来源信息：${evidence.provenance.taskId} · ${evidence.provenance.sessionId} · ${evidence.provenance.producer}`}
      </div>
    </div>
  )
}

function SimulationResultsView({
  storyWorld,
  readerResponse,
}: {
  readonly storyWorld: StoryWorldSimulationResult | null
  readonly readerResponse: ReaderResponseSimulationResult | null
}) {
  return (
    <section
      data-novel-simulations=""
      aria-label="模拟实验"
      style={{ marginTop: 12 }}
    >
      <strong>模拟实验</strong>
      <p style={{ margin: '6px 0', opacity: .7 }}>
        来自当前 DSH 会话的最新模拟结果，仅供提案参考，不会改动作品事实。
      </p>
      {storyWorld !== null && <StoryWorldSimulationResultView result={storyWorld} />}
      {readerResponse !== null && <ReaderResponseSimulationResultView result={readerResponse} />}
    </section>
  )
}

function StoryWorldSimulationResultView({
  result,
}: {
  readonly result: StoryWorldSimulationResult
}) {
  if ('runId' in result) return <StoryWorldSimulationView run={result} />
  if (!('mode' in result)) return <StoryWorldExperimentView experiment={result} />
  switch (result.mode) {
    case 'branch-comparison':
      return <StoryWorldBranchComparisonView comparison={result} />
    case 'branch-seed-comparison':
      return <StoryWorldBranchSeedComparisonView comparison={result} />
    case 'role-comparison':
      return <StoryWorldRoleComparisonView comparison={result} />
    case 'shared-encounter':
      return <StoryWorldSharedEncounterView encounter={result} />
  }
}

function StoryWorldSimulationView({ run }: { readonly run: StoryWorldSimulationRun }) {
  const transitions = new Map(run.transitions.map(transition => [
    transition.actionIndex,
    transition,
  ]))
  return (
    <article
      data-story-world-simulation-result=""
      data-story-world-simulation={run.runId}
      aria-label={`故事世界模拟运行 ${run.runId}`}
      style={{ marginTop: 10 }}
    >
      <div>
        <strong>{`故事世界 · R${String(run.sourceRevision)}`}</strong>
        <span style={{ marginLeft: 8, opacity: .7 }}>{`${run.actor.id} · ${run.storyTime}`}</span>
      </div>
      <div>{`运行：${run.runId}`}</div>
      <div>{`种子/回放：${run.seed ?? '无'} · ${run.replayKey}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${run.hypothesis}`}</p>
      <div>{`目标：${run.actor.goal}`}</div>
      <div>{`资源：${run.actor.resources.join(' · ') || '无'}`}</div>
      <div>{`假设：${run.assumptions.join(' · ') || '无'}`}</div>
      <div>{`初始状态：${storyWorldStateEntriesLabel(run.initialState)}`}</div>
      <ol aria-label="故事世界行动轨迹" style={{ margin: '8px 0', paddingLeft: 22 }}>
        {run.trace.map((action, index) => {
          const transition = transitions.get(index)
          return (
            <li key={index} data-story-world-action={index} style={{ marginTop: 6 }}>
              <strong>{`${action.type} · ${action.target}`}</strong>
              <div>{`行动者：${action.actorId}`}</div>
              <div>{`意图：${action.intent}`}</div>
              <div>{`之前：${storyWorldStateEntriesLabel(transition?.before ?? [])}`}</div>
              <div>{`之后：${storyWorldStateEntriesLabel(transition?.after ?? [])}`}</div>
            </li>
          )
        })}
      </ol>
      <div>{`最终状态：${storyWorldStateEntriesLabel(run.finalState)}`}</div>
      <div>{`限制：${run.limitations.join(' · ') || '无'}`}</div>
      <details>
        <summary>来源信息</summary>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {formatJson(run.provenance)}
        </pre>
      </details>
    </article>
  )
}

function StoryWorldExperimentView({
  experiment,
}: {
  readonly experiment: StoryWorldSimulationExperiment
}) {
  return (
    <article
      data-story-world-simulation-result=""
      data-story-world-experiment=""
      style={{ marginTop: 10 }}
    >
      <strong>{`故事世界多种子 · R${String(experiment.sourceRevision)}`}</strong>
      <div>{`${experiment.actor.id} · ${experiment.storyTime}`}</div>
      <div>{`种子：${experiment.seeds.join(' · ')}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${experiment.hypothesis}`}</p>
      <div>{`动作摘要：${storyWorldActionSummaryLabel(experiment.actionSummary)}`}</div>
      <details>
        <summary>{`运行（${String(experiment.runs.length)})`}</summary>
        {experiment.runs.map(run => <StoryWorldSimulationView key={run.runId} run={run} />)}
      </details>
    </article>
  )
}

function StoryWorldBranchComparisonView({
  comparison,
}: {
  readonly comparison: StoryWorldSimulationBranchExperiment
}) {
  return (
    <article data-story-world-simulation-result="" style={{ marginTop: 10 }}>
      <strong>{`故事世界分支 · R${String(comparison.sourceRevision)}`}</strong>
      <div>{`${comparison.actor.id} · ${comparison.storyTime}`}</div>
      <div>{`种子：${comparison.seed ?? '无'}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${comparison.hypothesis}`}</p>
      <ol aria-label="故事世界分支" style={{ margin: '8px 0', paddingLeft: 22 }}>
        {comparison.branches.map(branch => (
          <li key={branch.id} data-story-world-branch={branch.id} style={{ marginTop: 6 }}>
            <strong>{`${branch.id} · ${branch.hypothesis}`}</strong>
            <div>{`假设：${branch.assumptions.join(' · ') || '无'}`}</div>
            <details>
              <summary>{`Run ${branch.run.runId}`}</summary>
              <StoryWorldSimulationView run={branch.run} />
            </details>
          </li>
        ))}
      </ol>
      <StoryWorldBranchStateComparisonView comparisons={comparison.stateComparison} />
    </article>
  )
}

function StoryWorldBranchSeedComparisonView({
  comparison,
}: {
  readonly comparison: StoryWorldSimulationBranchSeedComparison
}) {
  return (
    <article data-story-world-simulation-result="" style={{ marginTop: 10 }}>
      <strong>{`故事世界分支 × 种子 · R${String(comparison.sourceRevision)}`}</strong>
      <div>{`${comparison.actor.id} · ${comparison.storyTime}`}</div>
      <div>{`种子：${comparison.seeds.join(' · ')}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${comparison.hypothesis}`}</p>
      <ol aria-label="故事世界分支实验" style={{ margin: '8px 0', paddingLeft: 22 }}>
        {comparison.branches.map(branch => (
          <li key={branch.id} data-story-world-branch={branch.id} style={{ marginTop: 6 }}>
            <strong>{`${branch.id} · ${branch.hypothesis}`}</strong>
            <div>{`假设：${branch.assumptions.join(' · ') || '无'}`}</div>
            <div>{`动作摘要：${storyWorldActionSummaryLabel(branch.experiment.actionSummary)}`}</div>
            <details>
              <summary>{`运行（${String(branch.experiment.runs.length)})`}</summary>
              {branch.experiment.runs.map(run => (
                <StoryWorldSimulationView key={run.runId} run={run} />
              ))}
            </details>
          </li>
        ))}
      </ol>
      <ul aria-label="分支种子状态对比" style={{ paddingLeft: 18 }}>
        {comparison.stateComparison.map((state, index) => (
          <li key={`${storyWorldStatePathLabel(state.path)}:${String(index)}`}>
            <strong>
              {`${storyWorldStatePathLabel(state.path)} · ${state.differs ? 'differs' : 'same'}`}
            </strong>
            {state.experiments.map(cell => (
              <div key={`${cell.branchId}:${cell.seed}`}>
                {`${cell.branchId} / ${cell.seed} = ${cell.present ? formatCanonValue(cell.value) : 'absent'}`}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </article>
  )
}

function StoryWorldRoleComparisonView({
  comparison,
}: {
  readonly comparison: StoryWorldRoleComparison
}) {
  return (
    <article data-story-world-simulation-result="" style={{ marginTop: 10 }}>
      <strong>{`故事世界角色 · R${String(comparison.sourceRevision)}`}</strong>
      <div>{`${comparison.storyTime} · seed ${comparison.seed ?? '无'}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${comparison.hypothesis}`}</p>
      <ol aria-label="角色对比" style={{ margin: '8px 0', paddingLeft: 22 }}>
        {comparison.roles.map(role => (
          <li key={role.actor.id} data-story-world-role={role.actor.id}>
            <strong>{`${role.actor.id} · ${role.actor.goal}`}</strong>
            <div>{`资源：${role.actor.resources.join(' · ') || '无'}`}</div>
            <details>
              <summary>{`Run ${role.run.runId}`}</summary>
              <StoryWorldSimulationView run={role.run} />
            </details>
          </li>
        ))}
      </ol>
    </article>
  )
}

function StoryWorldSharedEncounterView({
  encounter,
}: {
  readonly encounter: StoryWorldSharedEncounter
}) {
  return (
    <article
      data-story-world-simulation-result=""
      data-story-world-shared-encounter=""
      aria-label="共享场景"
      style={{ marginTop: 10 }}
    >
      <strong>{`故事世界共享场景 · R${String(encounter.sourceRevision)}`}</strong>
      <div>{`${encounter.storyTime} · seed ${encounter.seed ?? '无'}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${encounter.hypothesis}`}</p>
      <div>{`假设：${encounter.assumptions.join(' · ') || '无'}`}</div>
      <div>{`初始状态：${storyWorldStateEntriesLabel(encounter.initialState)}`}</div>
      <ol
        aria-label="共享场景回合"
        style={{ margin: '8px 0', paddingLeft: 22 }}
      >
        {encounter.turns.map((turn, index) => (
          <li
            key={`${turn.actor.id}:${turn.run.runId}`}
            data-story-world-encounter-turn={turn.actor.id}
            style={{ marginTop: 6 }}
          >
            <strong>{`Turn ${String(index + 1)} · ${turn.actor.id} · ${turn.actor.goal}`}</strong>
            <div>{`之前：${storyWorldStateEntriesLabel(turn.before)}`}</div>
            <div>{`之后：${storyWorldStateEntriesLabel(turn.after)}`}</div>
            <div>{`运行/回放：${turn.run.runId} · ${turn.run.replayKey}`}</div>
            <details>
              <summary>{`Run ${turn.run.runId}`}</summary>
              <StoryWorldSimulationView run={turn.run} />
            </details>
          </li>
        ))}
      </ol>
      <div>{`最终状态：${storyWorldStateEntriesLabel(encounter.finalState)}`}</div>
    </article>
  )
}

function StoryWorldBranchStateComparisonView({
  comparisons,
}: {
  readonly comparisons: StoryWorldSimulationBranchExperiment['stateComparison']
}) {
  return (
    <ul aria-label="分支状态对比" style={{ paddingLeft: 18 }}>
      {comparisons.map((state, index) => (
        <li key={`${storyWorldStatePathLabel(state.path)}:${String(index)}`}>
          <strong>
            {`${storyWorldStatePathLabel(state.path)} · ${state.differs ? 'differs' : 'same'}`}
          </strong>
          {state.branches.map(branch => (
            <div key={branch.branchId}>
              {`${branch.branchId} = ${branch.present ? formatCanonValue(branch.value) : 'absent'}`}
            </div>
          ))}
        </li>
      ))}
    </ul>
  )
}

function storyWorldActionSummaryLabel(
  summaries: StoryWorldSimulationExperiment['actionSummary'],
): string {
  return summaries.length === 0
    ? '无'
    : summaries.map(summary => (
        `${summary.type}: ${simulationRatioLabel(summary.count, summary.total, summary.ratio)}`
      )).join(' · ')
}

function ReaderResponseSimulationResultView({
  result,
}: {
  readonly result: ReaderResponseSimulationResult
}) {
  if ('runId' in result) return <ReaderResponseSimulationView run={result} />
  if (!('mode' in result)) return <ReaderResponseExperimentView experiment={result} />
  switch (result.mode) {
    case 'candidate-comparison':
      return <ReaderResponseCandidateComparisonView comparison={result} />
    case 'persona-comparison':
      return <ReaderResponsePersonaComparisonView comparison={result} />
    case 'candidate-persona-comparison':
      return <ReaderResponseCandidatePersonaComparisonView comparison={result} />
    case 'variant-comparison':
      return <ReaderResponseVariantComparisonView comparison={result} />
    case 'feedback-calibration':
      return <ReaderResponseFeedbackCalibrationView calibration={result} />
  }
}

function ReaderResponseSimulationView({ run }: { readonly run: ReaderResponseSimulationRun }) {
  return (
    <article
      data-reader-response-simulation-result=""
      data-reader-response-simulation={run.runId}
      aria-label={`读者反应模拟运行 ${run.runId}`}
      style={{ marginTop: 10 }}
    >
      <div>
        <strong>{`读者反应 · R${String(run.sourceRevision)} · ${run.unitId}`}</strong>
      </div>
      <div>{`运行：${run.runId}`}</div>
      <div>{`种子/回放：${run.seed ?? '无'} · ${run.replayKey}`}</div>
      <div>{`画像：${run.persona.id} · ${run.persona.description}`}</div>
      <div>{`呈现：${run.presentedTextSource} · ${run.presentedTextHash}`}</div>
      <div>{`阅读历史：${run.readingHistory.join(' · ') || '无'}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${run.hypothesis}`}</p>
      <blockquote style={{ margin: '6px 0' }}>{run.presentedText}</blockquote>
      <ol aria-label="合成读者反应" style={{ margin: '8px 0', paddingLeft: 22 }}>
        {run.reactions.map((reaction, index) => (
          <li
            key={`${reaction.dimension}:${String(index)}`}
            data-reader-response-reaction={reaction.dimension}
            style={{ marginTop: 6 }}
          >
            <strong>{`${reaction.dimension} · ${reaction.hypothesis}`}</strong>
            <div>{`证据：${reaction.evidence}`}</div>
          </li>
        ))}
      </ol>
      <div>Synthetic only · not market representative</div>
      <div>{`限制：${run.limitations.join(' · ') || '无'}`}</div>
      <details>
        <summary>来源信息</summary>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {formatJson(run.provenance)}
        </pre>
      </details>
    </article>
  )
}

function ReaderResponseExperimentView({
  experiment,
}: {
  readonly experiment: ReaderResponseSimulationExperiment
}) {
  return (
    <article
      data-reader-response-simulation-result=""
      data-reader-response-experiment=""
      style={{ marginTop: 10 }}
    >
      <strong>{`读者多种子 · R${String(experiment.sourceRevision)} · ${experiment.unitId}`}</strong>
      <div>{`画像：${experiment.persona.id} · ${experiment.persona.description}`}</div>
      <div>{`种子：${experiment.seeds.join(' · ')}`}</div>
      <div>{`呈现：${experiment.presentedTextSource} · ${experiment.presentedTextHash}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${experiment.hypothesis}`}</p>
      <div>{`维度摘要：${readerDimensionSummaryLabel(experiment.dimensionSummary)}`}</div>
      <div>Synthetic only · not market representative</div>
      <details>
        <summary>{`运行（${String(experiment.runs.length)})`}</summary>
        {experiment.runs.map(run => <ReaderResponseSimulationView key={run.runId} run={run} />)}
      </details>
    </article>
  )
}

function ReaderResponseCandidateComparisonView({
  comparison,
}: {
  readonly comparison: ReaderResponseCandidateComparison
}) {
  return (
    <article data-reader-response-simulation-result="" style={{ marginTop: 10 }}>
      <strong>{`读者候选 · R${String(comparison.sourceRevision)} · ${comparison.unitId}`}</strong>
      <div>{`画像：${comparison.persona.id} · ${comparison.persona.description}`}</div>
      <div>{`种子：${comparison.seeds.join(' · ')}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${comparison.hypothesis}`}</p>
      <ul style={{ paddingLeft: 18 }}>
        {comparison.candidates.map(candidate => (
          <li key={candidate.candidateId}>
            {`${candidate.candidateId} · ${candidate.presentedTextHash} · ${readerDimensionSummaryLabel(candidate.experiment.dimensionSummary)}`}
          </li>
        ))}
      </ul>
      <ul aria-label="候选维度对比" style={{ paddingLeft: 18 }}>
        {comparison.dimensionComparison.map(dimension => (
          <li key={dimension.dimension}>
            <strong>{dimension.dimension}</strong>
            {dimension.candidates.map(value => (
              <div key={value.candidateId}>
                {`${value.candidateId}: ${simulationRatioLabel(value.count, value.total, value.ratio)}`}
              </div>
            ))}
          </li>
        ))}
      </ul>
      <div>Synthetic only · not market representative</div>
    </article>
  )
}

function ReaderResponsePersonaComparisonView({
  comparison,
}: {
  readonly comparison: ReaderResponsePersonaComparison
}) {
  return (
    <article data-reader-response-simulation-result="" style={{ marginTop: 10 }}>
      <strong>{`读者画像 · R${String(comparison.sourceRevision)} · ${comparison.unitId}`}</strong>
      <div>{`种子：${comparison.seeds.join(' · ')}`}</div>
      <div>{`呈现：${comparison.presentedTextSource} · ${comparison.presentedTextHash}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${comparison.hypothesis}`}</p>
      <ul style={{ paddingLeft: 18 }}>
        {comparison.personas.map(entry => (
          <li key={entry.persona.id}>
            {`${entry.persona.id} · ${entry.persona.description} · ${readerDimensionSummaryLabel(entry.experiment.dimensionSummary)}`}
          </li>
        ))}
      </ul>
      <ul aria-label="画像维度对比" style={{ paddingLeft: 18 }}>
        {comparison.dimensionComparison.map(dimension => (
          <li key={dimension.dimension}>
            <strong>{dimension.dimension}</strong>
            {dimension.personas.map(value => (
              <div key={value.personaId}>
                {`${value.personaId}: ${simulationRatioLabel(value.count, value.total, value.ratio)}`}
              </div>
            ))}
          </li>
        ))}
      </ul>
      <div>Synthetic only · not market representative</div>
    </article>
  )
}

function ReaderResponseCandidatePersonaComparisonView({
  comparison,
}: {
  readonly comparison: ReaderResponseCandidatePersonaComparison
}) {
  return (
    <article data-reader-response-simulation-result="" style={{ marginTop: 10 }}>
      <strong>{`读者候选 × 画像 · R${String(comparison.sourceRevision)} · ${comparison.unitId}`}</strong>
      <div>{`种子：${comparison.seeds.join(' · ')}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${comparison.hypothesis}`}</p>
      <div>
        {`候选：${comparison.candidates.map(candidate => (
          `${candidate.id} · ${candidate.presentedTextHash}`
        )).join(' | ')}`}
      </div>
      <div>
        {`画像：${comparison.personas.map(persona => (
          `${persona.id} · ${persona.description}`
        )).join(' | ')}`}
      </div>
      <ul aria-label="候选 × 画像矩阵" style={{ paddingLeft: 18 }}>
        {comparison.dimensionComparison.map(dimension => (
          <li key={dimension.dimension}>
            <strong>{dimension.dimension}</strong>
            {dimension.experiments.map(value => (
              <div key={`${value.candidateId}:${value.personaId}`}>
                {`${value.candidateId} / ${value.personaId}: ${simulationRatioLabel(value.count, value.total, value.ratio)}`}
              </div>
            ))}
          </li>
        ))}
      </ul>
      <div>Synthetic only · not market representative</div>
    </article>
  )
}

function ReaderResponseVariantComparisonView({
  comparison,
}: {
  readonly comparison: ReaderResponseVariantComparison
}) {
  return (
    <article data-reader-response-simulation-result="" style={{ marginTop: 10 }}>
      <strong>{`读者变体 · R${String(comparison.sourceRevision)} · ${comparison.unitId}`}</strong>
      <div>{`画像：${comparison.persona.id} · ${comparison.persona.description}`}</div>
      <div>{`种子：${comparison.seed ?? '无'}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${comparison.hypothesis}`}</p>
      <ul style={{ paddingLeft: 18 }}>
        {comparison.variants.map(variant => (
          <li key={variant.variantId}>
            {`${variant.variantId} · ${variant.presentedTextSource} · ${variant.presentedTextHash} · run ${variant.run.runId}`}
          </li>
        ))}
      </ul>
      <ul aria-label="变体维度对比" style={{ paddingLeft: 18 }}>
        {comparison.dimensionComparison.map(dimension => (
          <li key={dimension.dimension}>
            <strong>{dimension.dimension}</strong>
            {dimension.variants.map(value => (
              <div key={value.variantId}>
                {`${value.variantId}: ${simulationRatioLabel(value.count, value.total, value.ratio)}`}
              </div>
            ))}
          </li>
        ))}
      </ul>
      <div>Synthetic only · not market representative</div>
    </article>
  )
}

function ReaderResponseFeedbackCalibrationView({
  calibration,
}: {
  readonly calibration: ReaderResponseFeedbackCalibration
}) {
  return (
    <article data-reader-response-simulation-result="" style={{ marginTop: 10 }}>
      <strong>{`读者反馈校准 · R${String(calibration.sourceRevision)} · ${calibration.unitId}`}</strong>
      <div>{`画像：${calibration.persona.id} · ${calibration.persona.description}`}</div>
      <div>{`反馈：${calibration.feedback.sourceId} · ${calibration.feedback.platform} · ${calibration.feedback.observedAt}`}</div>
      <div>{`作者决定：${calibration.feedback.authorDecision.action} · ${calibration.feedback.authorDecision.rationale}`}</div>
      <p style={{ margin: '6px 0' }}>{`假设：${calibration.hypothesis}`}</p>
      <ul aria-label="读者反馈校准" style={{ paddingLeft: 18 }}>
        {calibration.calibration.map(item => (
          <li key={item.observationId}>
            {item.status === 'compared'
              ? `${item.observationId} · ${item.category} → ${item.dimension} · synthetic ${formatSimulationPercent(item.syntheticRatio)} · observed ${formatSimulationPercent(item.observedRatio)} · delta ${formatSimulationPercent(item.ratioDelta)}`
              : item.status === 'insufficient-data'
                ? `${item.observationId} · ${item.category} → ${item.dimension} · insufficient data`
                : `${item.observationId} · ${item.category} · unmapped`}
          </li>
        ))}
      </ul>
      <div>Synthetic only · not market representative</div>
    </article>
  )
}

function readerDimensionSummaryLabel(
  summaries: ReaderResponseSimulationExperiment['dimensionSummary'],
): string {
  return summaries.length === 0
    ? '无'
    : summaries.map(summary => (
        `${summary.dimension}: ${simulationRatioLabel(summary.count, summary.total, summary.ratio)}`
      )).join(' · ')
}

function simulationRatioLabel(count: number, total: number, ratio: number): string {
  return `${String(count)}/${String(total)} (${formatSimulationPercent(ratio)})`
}

function formatSimulationPercent(ratio: number): string {
  return `${String(Math.round(ratio * 100))}%`
}

function storyWorldStateEntriesLabel(entries: readonly StoryWorldStateEntry[]): string {
  return entries.length === 0
    ? 'empty'
    : entries.map(entry => (
        `${storyWorldStatePathLabel(entry.path)} = ${formatCanonValue(entry.value)}`
      )).join(' · ')
}

function storyWorldStatePathLabel(path: StoryWorldStateEntry['path']): string {
  return path.type === 'resource'
    ? `resource:${path.resource}`
    : `fact:${path.fact.kind}:${path.fact.targetId}:${path.fact.field}`
}

function CanonEntityProjectionView({
  projection,
}: {
  readonly projection: NovelCanonProjection
}) {
  return projection.entities.length === 0
    ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受小说状态实体</p>
    : (
      <ul
        aria-label="已接受的设定条目"
        style={{ margin: '8px 0 0', paddingLeft: 18 }}
      >
        {projection.entities.map(entity => (
          <li
            key={`${entity.kind}:${entity.targetId}`}
            data-canon-entity={`${entity.kind}:${entity.targetId}`}
            style={{ marginTop: 8 }}
          >
            <div><strong>{`${entity.kind} · ${entity.targetId}`}</strong></div>
            {entity.kind === 'creative-profile' && entity.fields['style-profile'] !== undefined && (
              <CreativeStyleProfileView
                targetId={entity.targetId}
                value={entity.fields['style-profile'] as NovelCreativeStyleProfileValue}
                sourceLabel={projectionSourceLabel(
                  entity.fieldSources['style-profile'] ?? entity,
                )}
              />
            )}
            {entity.kind === 'creative-profile' && entity.fields['serialization-profile'] !== undefined && (
              <CreativeSerializationProfileView
                targetId={entity.targetId}
                value={entity.fields['serialization-profile'] as NovelCreativeSerializationProfileValue}
                sourceLabel={projectionSourceLabel(
                  entity.fieldSources['serialization-profile'] ?? entity,
                )}
              />
            )}
            {entity.kind === 'reader-contract' && entity.fields['contract-profile'] !== undefined && (
              <ReaderContractProfileView
                targetId={entity.targetId}
                value={entity.fields['contract-profile'] as NovelReaderContractProfileValue}
                sourceLabel={projectionSourceLabel(
                  entity.fieldSources['contract-profile'] ?? entity,
                )}
              />
            )}
            {entity.kind === 'promise' && entity.fields.state !== undefined && (
              <PromiseStateView
                targetId={entity.targetId}
                value={entity.fields.state as NovelPromiseStateValue}
                sourceLabel={projectionSourceLabel(entity.fieldSources.state ?? entity)}
              />
            )}
            {entity.kind === 'mystery' && entity.fields.state !== undefined && (
              <MysteryStateView
                targetId={entity.targetId}
                value={entity.fields.state as NovelMysteryStateValue}
                sourceLabel={projectionSourceLabel(entity.fieldSources.state ?? entity)}
              />
            )}
            {entity.kind === 'clue' && entity.fields.state !== undefined && (
              <ClueStateView
                targetId={entity.targetId}
                value={entity.fields.state as NovelClueStateValue}
                sourceLabel={projectionSourceLabel(entity.fieldSources.state ?? entity)}
              />
            )}
            {entity.kind === 'knowledge' && entity.fields.state !== undefined && (
              <KnowledgeStateView
                targetId={entity.targetId}
                value={entity.fields.state as NovelKnowledgeStateValue}
                sourceLabel={projectionSourceLabel(entity.fieldSources.state ?? entity)}
              />
            )}
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {Object.entries(entity.fields)
                .filter(([field]) => !(
                  (entity.kind === 'creative-profile' && field === 'style-profile')
                  || (entity.kind === 'creative-profile' && field === 'serialization-profile')
                  || (entity.kind === 'reader-contract' && field === 'contract-profile')
                  || (entity.kind === 'promise' && field === 'state')
                  || (entity.kind === 'mystery' && field === 'state')
                  || (entity.kind === 'clue' && field === 'state')
                  || (entity.kind === 'knowledge' && field === 'state')
                ))
                .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
                .map(([field, value]) => (
                  <li key={field}>{`${field}: ${formatCanonValue(value)}`}</li>
                ))}
            </ul>
            <small style={{ opacity: .7 }}>{projectionSourceLabel(entity)}</small>
          </li>
        ))}
      </ul>
    )
}

function KnowledgeStateView({
  targetId,
  value,
  sourceLabel,
}: {
  readonly targetId: string
  readonly value: NovelKnowledgeStateValue
  readonly sourceLabel: string
}) {
  return (
    <section
      data-knowledge-state={targetId}
      aria-label={`${targetId} knowledge state`}
      style={{ marginTop: 6 }}
    >
      <div data-knowledge-status="">
        <strong>{`认知 · v${String(value.version)} · ${value.subjectKind} · ${value.beliefStatus} · ${value.memoryStatus} · ${value.truthAlignment}`}</strong>
      </div>
      <div data-knowledge-belief="">{`信念：${value.belief}`}</div>
      <div data-knowledge-access="">
        {`通行权限：${value.access.mode} · ${value.access.unitId} · ${value.access.viewpointAccess} · viewpoint ${value.access.viewpointId ?? '无'}`}
      </div>
      <div data-knowledge-rationale="">
        {`修订理由：${value.revisionRationale ?? '初始'}`}
      </div>
      <small style={{ opacity: .7 }}>{sourceLabel}</small>
    </section>
  )
}

function ClueStateView({
  targetId,
  value,
  sourceLabel,
}: {
  readonly targetId: string
  readonly value: NovelClueStateValue
  readonly sourceLabel: string
}) {
  return (
    <section
      data-clue-state={targetId}
      aria-label={`${targetId} clue state`}
      style={{ marginTop: 6 }}
    >
      <div data-clue-role-status="">
        <strong>{`线索 · v${String(value.version)} · ${value.role} · ${value.status} · ${value.readerVisibility}`}</strong>
      </div>
      <div data-clue-statement="">{value.statement}</div>
      <div data-clue-mysteries="">
        {`关联谜团：${value.linkedMysteryIds.join(', ') || '无'}`}
      </div>
      <div data-clue-function="">{`功能：${value.intendedFunction}`}</div>
      <div data-clue-payoff-window="">
        {`预计兑现窗口：${value.expectedPayoffWindow ?? '无'}`}
      </div>
      {value.payoff === null
        ? <div data-clue-payoff="">Payoff: pending</div>
        : (
            <div data-clue-payoff={value.payoff.unitId}>
              <div>{`兑现 · ${value.payoff.kind} · ${value.payoff.unitId} · ${value.payoff.description}`}</div>
              <div data-clue-aftermath="">{`余波：${value.payoff.aftermath}`}</div>
            </div>
          )}
      <div data-clue-abandonment="">
        {`放弃理由：${value.abandonmentReason ?? '无'}`}
      </div>
      <div data-clue-rationale="">
        {`修订理由：${value.revisionRationale ?? '初始'}`}
      </div>
      <small style={{ opacity: .7 }}>{sourceLabel}</small>
    </section>
  )
}

function MysteryStateView({
  targetId,
  value,
  sourceLabel,
}: {
  readonly targetId: string
  readonly value: NovelMysteryStateValue
  readonly sourceLabel: string
}) {
  return (
    <section
      data-mystery-state={targetId}
      aria-label={`${targetId} mystery state`}
      style={{ marginTop: 6 }}
    >
      <div><strong>{`谜团 · v${String(value.version)} · ${value.truth.status}`}</strong></div>
      <div data-mystery-question="">{`问题：${value.question}`}</div>
      <div data-mystery-truth="">
        {`作者答案：${value.truth.status === 'known-to-author' ? value.truth.answer : '未设置'}`}
      </div>
      <div>{`假设：${value.hypotheses.join(' · ') || '无'}`}</div>
      <div>{`知情者：${value.knowers.join(', ') || '无'}`}</div>
      <div data-mystery-reader-visibility="">{`读者可见性：${value.readerVisibility}`}</div>
      <div data-mystery-concealment="">{`隐瞒规则：${value.concealmentRule}`}</div>
      <div>{`揭示条件：${value.revealConditions.join(' · ') || '无'}`}</div>
      <div data-mystery-fair-point="">
        {`最早公平揭晓：${value.earliestFairResolutionUnitId ?? '无'}`}
      </div>
      <div data-mystery-reveal-window="">
        {`期望揭示窗口：${value.desiredRevealWindow === null
          ? '无'
          : `${value.desiredRevealWindow.startUnitId} → ${value.desiredRevealWindow.endUnitId}`}`}
      </div>
      <div data-mystery-actual-reveal="">
        {`实际揭示：${value.actualReveal === null
          ? '无'
          : `${value.actualReveal.unitId} · ${value.actualReveal.description}`}`}
      </div>
      <div data-mystery-aftermath="">{`余波：${value.aftermath ?? '无'}`}</div>
      <div data-mystery-rationale="">
        {`修订理由：${value.revisionRationale ?? '初始'}`}
      </div>
      <small style={{ opacity: .7 }}>{sourceLabel}</small>
    </section>
  )
}

function PromiseStateView({
  targetId,
  value,
  sourceLabel,
}: {
  readonly targetId: string
  readonly value: NovelPromiseStateValue
  readonly sourceLabel: string
}) {
  return (
    <section
      data-promise-state={targetId}
      aria-label={`${targetId} promise state`}
      style={{ marginTop: 6 }}
    >
      <div><strong>{`承诺 · v${String(value.version)} · ${value.weight} · ${value.type}`}</strong></div>
      <div>{value.promise}</div>
      <div data-promise-horizon="" style={{ marginTop: 4 }}>
        {`窗口：${value.horizon.openedUnitId} → ${value.horizon.expectedPayoffStartUnitId} … ${value.horizon.expectedPayoffEndUnitId}`}
      </div>
      <div
        data-promise-setup={value.setup.beatId}
        style={{ marginTop: 4 }}
      >
        {`Setup · ${value.setup.unitId} · R${String(value.setup.sourceRevision)} · ${value.setup.description} · 出处锚点：${value.setup.sourceAnchorIds.join(', ')}`}
      </div>
      <div style={{ marginTop: 4 }}>提醒</div>
      {value.reminders.length === 0
        ? <div style={{ opacity: .7 }}>暂无提醒</div>
        : (
            <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
              {value.reminders.map(reminder => (
                <li key={reminder.beatId} data-promise-reminder={reminder.beatId}>
                  {`${reminder.unitId} · R${String(reminder.sourceRevision)} · ${reminder.description} · 出处锚点：${reminder.sourceAnchorIds.join(', ')}`}
                </li>
              ))}
            </ul>
          )}
      <div style={{ marginTop: 4 }}>复杂化</div>
      {value.complications.length === 0
        ? <div style={{ opacity: .7 }}>暂无复杂化</div>
        : (
            <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
              {value.complications.map(complication => (
                <li key={complication.beatId} data-promise-complication={complication.beatId}>
                  {`${complication.unitId} · R${String(complication.sourceRevision)} · ${complication.description} · 出处锚点：${complication.sourceAnchorIds.join(', ')}`}
                </li>
              ))}
            </ul>
          )}
      <div data-promise-resolution={value.resolution.status} style={{ marginTop: 4 }}>
        {value.resolution.status === 'open'
          ? '收束：未完 · 等待兑现'
          : value.resolution.status === 'retired'
            ? `收束：retired · ${value.resolution.beat.description} · ${value.resolution.retirementRationale}`
            : `收束：${value.resolution.status} · ${value.resolution.payoffType} · ${value.resolution.beat.description}`}
      </div>
      <div data-promise-aftermath="">
        {`余波：${value.aftermath ?? '无'}`}
      </div>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
      <small style={{ opacity: .7 }}>{sourceLabel}</small>
    </section>
  )
}

function CreativeStyleProfileView({
  targetId,
  value,
  sourceLabel,
}: {
  readonly targetId: string
  readonly value: NovelCreativeStyleProfileValue
  readonly sourceLabel: string
}) {
  return (
    <section
      data-creative-style-profile={targetId}
      aria-label={`${targetId} creative style profile`}
      style={{ marginTop: 6 }}
    >
      <div><strong>{`${value.profileName} · v${String(value.version)}`}</strong></div>
      <div style={{ marginTop: 4 }}>声音原则</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.voicePrinciples.map(principle => (
          <li key={principle} data-creative-style-principle={principle}>{principle}</li>
        ))}
      </ul>
      <section data-creative-style-viewpoint="" aria-label="视角" style={{ marginTop: 4 }}>
        <div>{`人称：${value.viewpoint.person}`}</div>
        <div>{`距离：${value.viewpoint.distance}`}</div>
        <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
          {value.viewpoint.rules.map(rule => <li key={rule}>{rule}</li>)}
        </ul>
      </section>
      <div style={{ marginTop: 4 }}>句式节奏</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.sentenceRhythm.principles.map(principle => (
          <li key={principle} data-creative-style-rhythm={principle}>{principle}</li>
        ))}
        {value.sentenceRhythm.forbiddenPatterns.map(pattern => (
          <li key={pattern} data-creative-style-rhythm={pattern}>{pattern}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>对话</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.dialogue.principles.map(principle => (
          <li key={principle} data-creative-style-dialogue={principle}>{principle}</li>
        ))}
        {value.dialogue.characterDifferentiation.map(rule => (
          <li key={rule} data-creative-style-dialogue={rule}>{rule}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>感官优先级</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.sensoryPriorities.map(priority => (
          <li key={priority} data-creative-style-sensory={priority}>{priority}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>潜台词规则</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.subtextRules.map(rule => (
          <li key={rule} data-creative-style-subtext={rule}>{rule}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>交代规则</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.expositionRules.map(rule => (
          <li key={rule} data-creative-style-exposition={rule}>{rule}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>禁止习惯</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.forbiddenHabits.map(habit => (
          <li key={habit} data-creative-style-forbidden={habit}>{habit}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>认可范例</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.approvedExemplars.map(exemplar => (
          <li key={exemplar.exemplarId} data-creative-style-exemplar={exemplar.exemplarId}>
            <div>{`${exemplar.exemplarId} · ${exemplar.sourceUnitId} · R${String(exemplar.sourceRevision)}`}</div>
            <div>{`目的：${exemplar.purpose}`}</div>
            <div>{`出处锚点：${exemplar.sourceAnchorIds.join(', ') || '无'}`}</div>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>改编边界</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.adaptationBoundaries.map((boundary, index) => (
          <li
            key={`${boundary.context}:${String(index)}`}
            data-creative-style-adaptation={boundary.context}
          >
            <div><strong>{boundary.context}</strong></div>
            <div>{`不变项：${boundary.invariants.join(' · ') || '无'}`}</div>
            <div>{`可变项：${boundary.mayVary.join(' · ') || '无'}`}</div>
          </li>
        ))}
      </ul>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
      <small style={{ opacity: .7 }}>{sourceLabel}</small>
    </section>
  )
}

function CreativeSerializationProfileView({
  targetId,
  value,
  sourceLabel,
}: {
  readonly targetId: string
  readonly value: NovelCreativeSerializationProfileValue
  readonly sourceLabel: string
}) {
  return (
    <section
      data-creative-serialization-profile={targetId}
      aria-label={`${targetId} creative serialization profile`}
      style={{ marginTop: 6 }}
    >
      <div><strong>{`连载配置 · ${value.platform} · v${String(value.version)}`}</strong></div>
      <div>{`更新节奏：${String(value.cadence.chaptersPerWeek)} chapters/week`}</div>
      <div>{`更新日：${value.cadence.releaseDays.join(' · ')}`}</div>
      <div>{`章节字数：${String(value.chapterLengthRange.min)}–${String(value.chapterLengthRange.max)} characters`}</div>
      <div>{`计划字数：${String(value.plannedLength.target)} ${value.plannedLength.unit}`}</div>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
      <small style={{ opacity: .7 }}>{sourceLabel}</small>
    </section>
  )
}

function ReaderContractProfileView({
  targetId,
  value,
  sourceLabel,
}: {
  readonly targetId: string
  readonly value: NovelReaderContractProfileValue
  readonly sourceLabel: string
}) {
  return (
    <section
      data-reader-contract-profile={targetId}
      aria-label={`${targetId} reader contract profile`}
      style={{ marginTop: 6 }}
    >
      <div><strong>{`读者契约 · v${String(value.version)}`}</strong></div>
      <section data-reader-contract-premise="" aria-label="前提" style={{ marginTop: 4 }}>
        <div>{`特殊处境：${value.premise.distinctiveSituation}`}</div>
        <div>{`核心戏剧问题：${value.premise.centralDramaticQuestion}`}</div>
        <div>{`读者幻想：${value.premise.readerFantasy}`}</div>
        <div>约束</div>
        <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
          {value.premise.constraints.map(constraint => <li key={constraint}>{constraint}</li>)}
        </ul>
        <div>基调范围</div>
        <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
          {value.premise.tonalRange.map(tone => <li key={tone}>{tone}</li>)}
        </ul>
      </section>
      <div style={{ marginTop: 4 }}>{`核心体验：${value.coreExperience}`}</div>
      <div style={{ marginTop: 4 }}>承诺</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.promises.map(promise => (
          <li key={promise.promiseId} data-reader-contract-promise={promise.promiseId}>
            <div><strong>{promise.promiseId}</strong></div>
            <div>{promise.statement}</div>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>排除项</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.exclusions.map(exclusion => <li key={exclusion}>{exclusion}</li>)}
      </ul>
      <section data-reader-contract-audience="" aria-label="目标读者" style={{ marginTop: 4 }}>
        <div>{`目标读者：${value.targetAudience.description}`}</div>
        <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
          {value.targetAudience.expectations.map(expectation => (
            <li key={expectation}>{expectation}</li>
          ))}
        </ul>
      </section>
      <div style={{ marginTop: 4 }}>已接受交付证据</div>
      {value.evidence.length === 0
        ? <div style={{ opacity: .7 }}>暂无已接受交付证据</div>
        : (
            <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
              {value.evidence.map(evidence => (
                <li
                  key={evidence.evidenceId}
                  data-reader-contract-evidence={evidence.evidenceId}
                >
                  <div>{`${evidence.evidenceId} · ${evidence.sourceUnitId} · R${String(evidence.sourceRevision)}`}</div>
                  <div>{`证明：${evidence.demonstrates}`}</div>
                  <div>{`出处锚点：${evidence.sourceAnchorIds.join(', ')}`}</div>
                </li>
              ))}
            </ul>
          )}
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
      <small style={{ opacity: .7 }}>{sourceLabel}</small>
    </section>
  )
}

function PlotProgressionEntryView({
  value,
}: {
  readonly value: NovelPlotProgressionValue
}) {
  return (
    <section
      data-plot-progression-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} plot progression`}
      style={{ marginTop: 6 }}
    >
      <div>
        <strong>{`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)}`}</strong>
      </div>
      <div>{`推进：${value.movement}`}</div>
      <div>{`状态：${value.state}`}</div>
      {value.storyTime !== undefined && <div>{`故事时间: ${value.storyTime}`}</div>}
      <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {value.lines.map(line => (
          <li key={line.lineId} data-plot-line={line.lineId} style={{ marginTop: 6 }}>
            <div><strong>{`${line.lineId} · ${line.status}`}</strong></div>
            <div>{`目标：${line.goal}`}</div>
            <div>{`赌注：${line.stakes}`}</div>
            <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {line.turns.map(turn => (
                <li key={turn.turnId} data-plot-turn={turn.turnId} style={{ marginTop: 4 }}>
                  <div><strong>{`${turn.turnType} · ${turn.storyEventId}`}</strong></div>
                  <div>{`描述：${turn.description}`}</div>
                  <div>{`代价：${turn.cost}`}</div>
                  <div>{`之后状态：${turn.stateAfter}`}</div>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function ChapterReferenceResolutionView({
  controlPack,
}: {
  readonly controlPack: NovelChapterControlPack
}) {
  const resolution = controlPack.referenceResolution
  return (
    <section
      data-chapter-reference-resolution=""
      aria-label="章节引用解析"
      style={{ marginTop: 8 }}
    >
      <strong>章节引用解析</strong>
      <div style={{ marginTop: 6 }}>情节线</div>
      {resolution.plotLines.resolved.length === 0
        ? <div style={{ opacity: .7 }}>暂无已收束情节线</div>
        : resolution.plotLines.resolved.map(reference => (
            <article
              key={reference.lineId}
              data-chapter-reference-plot-line={reference.lineId}
              style={{ marginTop: 6 }}
            >
              <PlotProgressionEntryView
                value={{
                  ...(reference.clockEntry.delta.value as NovelPlotProgressionValue),
                  lines: [reference.line],
                }}
              />
              <small style={{ opacity: .7 }}>{projectionSourceLabel(reference.clockEntry)}</small>
            </article>
          ))}
      {resolution.plotLines.missing.length > 0 && (
        <>
          <div style={{ marginTop: 6 }}>缺失情节线</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {resolution.plotLines.missing.map(lineId => (
              <li key={lineId} data-chapter-reference-plot-missing={lineId}>{lineId}</li>
            ))}
          </ul>
        </>
      )}

      <div style={{ marginTop: 8 }}>关系线</div>
      {resolution.relationshipLines.resolved.length === 0
        ? <div style={{ opacity: .7 }}>暂无已收束关系线</div>
        : resolution.relationshipLines.resolved.map(reference => (
            <article
              key={reference.lineId}
              data-chapter-reference-relationship-line={reference.lineId}
              style={{ marginTop: 6 }}
            >
              <RelationshipProjectionView projection={{
                projectId: controlPack.projectId,
                workspaceId: controlPack.workspaceId,
                revision: controlPack.sourceRevision,
                relationships: [reference.line],
              }} />
              {reference.emotionEpisodes.resolved.length > 0 && (
                <section style={{ marginTop: 8 }}>
                  <strong>关系情绪片段</strong>
                  <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {reference.emotionEpisodes.resolved.map((item, occurrence) => (
                      <li
                        key={`${item.clockEntry.sourceDeltaId}:${item.move.moveId}:${item.episodeId}:${String(occurrence)}`}
                        data-chapter-reference-relationship-emotion={item.episodeId}
                        data-chapter-reference-relationship-emotion-occurrence={occurrence}
                        style={{ marginTop: 6 }}
                      >
                        <strong>{item.episodeId}</strong>
                        <div>{`触发：${item.episode.episode.trigger}`}</div>
                        <div>
                          {`混合情绪：${item.episode.episode.emotions.map(emotion => `${emotion.label} ${String(emotion.intensity)}`).join(' · ')}`}
                        </div>
                        <div>{`余留：${item.episode.episode.residue}`}</div>
                        <div>{`推进：${item.move.moveId} · ${item.move.contribution}`}</div>
                        <div style={{ opacity: .7 }}>
                          {`出处范围：${formatJson(item.episode.sourceRanges)}`}
                        </div>
                        <small style={{ opacity: .7 }}>{projectionSourceLabel(item.episode)}</small>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              {reference.emotionEpisodes.missing.length > 0 && (
                <section style={{ marginTop: 8 }}>
                  <strong>缺失的关系情绪片段</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {reference.emotionEpisodes.missing.map((item, occurrence) => (
                      <li
                        key={`${item.clockEntry.sourceDeltaId}:${item.move.moveId}:${item.episodeId}:${String(occurrence)}`}
                        data-chapter-reference-relationship-emotion-missing={item.episodeId}
                      >
                        {`${item.episodeId} · ${item.move.moveId} · ${item.clockEntry.sourceDeltaId}`}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>
          ))}
      {resolution.relationshipLines.missing.length > 0 && (
        <>
          <div style={{ marginTop: 6 }}>缺失关系线</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {resolution.relationshipLines.missing.map(lineId => (
              <li key={lineId} data-chapter-reference-relationship-missing={lineId}>{lineId}</li>
            ))}
          </ul>
        </>
      )}

      <div style={{ marginTop: 8 }}>承诺</div>
      {resolution.promises.resolved.length === 0
        ? <div style={{ opacity: .7 }}>暂无已收束承诺</div>
        : resolution.promises.resolved.map(reference => (
            <article
              key={reference.promiseId}
              data-chapter-reference-promise={reference.promiseId}
              style={{ marginTop: 6 }}
            >
              <div>{`计划推进：${reference.intendedMovement}`}</div>
              <PromiseStateView
                targetId={reference.promiseId}
                value={reference.state}
                sourceLabel={projectionSourceLabel(reference.fact)}
              />
            </article>
          ))}
      {resolution.promises.missing.length > 0 && (
        <>
          <div style={{ marginTop: 6 }}>缺失承诺</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {resolution.promises.missing.map(reference => (
              <li
                key={reference.promiseId}
                data-chapter-reference-promise-missing={reference.promiseId}
              >
                {`${reference.promiseId} · ${reference.intendedMovement}`}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function PostChapterCheckResolutionView({
  resolution,
}: {
  readonly resolution: NovelPostChapterCheckResolution
}) {
  const transitionLabel = (
    reference: NovelPostChapterCheckValue['debtTransitions'][number],
  ): string => `${reference.transition} · ${reference.clock} · ${reference.debtId} · ${reference.sourceDeltaId}`
  return (
    <section
      data-post-chapter-check-resolution=""
      aria-label="章节后来源对照"
      style={{ marginTop: 8 }}
    >
      <strong>章节后来源对照</strong>
      <article data-post-chapter-check-source="" style={{ marginTop: 6 }}>
        <div>章节后检查来源</div>
        <small style={{ display: 'block', opacity: .7 }}>
          {projectionSourceLabel(resolution.postCheck.fact)}
        </small>
        <div style={{ opacity: .7 }}>
          {`出处范围：${formatJson(resolution.postCheck.sourceRanges)}`}
        </div>
      </article>
      {resolution.contract === null
        ? <div data-post-chapter-contract-missing="">缺失合同来源</div>
        : (
            <article data-post-chapter-contract-link="" style={{ marginTop: 6 }}>
              <div>合同来源</div>
              <small style={{ display: 'block', opacity: .7 }}>
                {projectionSourceLabel(resolution.contract.unit)}
              </small>
              <div style={{ opacity: .7 }}>
                {`出处范围：${formatJson(resolution.contract.sourceRanges)}`}
              </div>
            </article>
          )}
      {resolution.manuscript === null
        ? <div data-post-chapter-manuscript-missing="">缺失正文来源</div>
        : (
            <article data-post-chapter-manuscript-link="" style={{ marginTop: 6 }}>
              <div>
                {`${resolution.manuscript.projection.manuscript.unitId} · R${String(resolution.manuscript.projection.sourceRevision)} · 生成者：${resolution.manuscript.projection.provenance.producer}`}
              </div>
              <div style={{ opacity: .7 }}>
                {`出处范围：${formatJson(resolution.manuscript.sourceRanges)}`}
              </div>
            </article>
          )}
      <div style={{ marginTop: 6 }}>已收束债务流转</div>
      <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {resolution.debtTransitions.resolved.map((entry, entryIndex) => (
          <li
            key={`resolved:${entry.reference.sourceDeltaId}:${String(entryIndex)}`}
            data-post-chapter-debt-resolved={entry.reference.sourceDeltaId}
          >
            <div>{transitionLabel(entry.reference)}</div>
            <small style={{ display: 'block', opacity: .7 }}>
              {projectionSourceLabel(entry.debt)}
            </small>
            <div style={{ opacity: .7 }}>{`出处范围：${formatJson(entry.sourceRanges)}`}</div>
          </li>
        ))}
      </ol>
      {resolution.debtTransitions.missing.length > 0 && (
        <>
          <div style={{ marginTop: 6 }}>缺失债务流转</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {resolution.debtTransitions.missing.map((reference, referenceIndex) => (
              <li
                key={`missing:${reference.sourceDeltaId}:${String(referenceIndex)}`}
                data-post-chapter-debt-missing={reference.sourceDeltaId}
              >
                {transitionLabel(reference)}
              </li>
            ))}
          </ul>
        </>
      )}
      {resolution.debtTransitions.ambiguous.length > 0 && (
        <>
          <div style={{ marginTop: 6 }}>歧义债务流转</div>
          <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {resolution.debtTransitions.ambiguous.map((entry, entryIndex) => (
              <li
                key={`ambiguous:${entry.reference.sourceDeltaId}:${String(entryIndex)}`}
                data-post-chapter-debt-ambiguous={entry.reference.sourceDeltaId}
              >
                <div>{transitionLabel(entry.reference)}</div>
                <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {entry.candidates.map((candidate, candidateIndex) => (
                    <li
                      key={`${candidate.debt.sourceRevision}:${candidate.debt.sourceDeltaId}:${String(candidateIndex)}`}
                      data-post-chapter-debt-candidate={`${String(candidate.debt.sourceRevision)}:${candidate.debt.sourceDeltaId}`}
                    >
                      <small style={{ display: 'block', opacity: .7 }}>
                        {projectionSourceLabel(candidate.debt)}
                      </small>
                      <div style={{ opacity: .7 }}>
                        {`出处范围：${formatJson(candidate.sourceRanges)}`}
                      </div>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}

function RecentPostChapterCheckView({
  entry,
}: {
  readonly entry: NovelChapterControlPack['recentPostChapterChecks'][number]
}) {
  const value = entry.resolution.postCheck.fact.value as NovelPostChapterCheckValue
  return (
    <article
      data-chapter-control-recent-post-check={entry.chapter.id}
      aria-label={`${entry.chapter.id} post-Chapter carry-forward`}
      style={{ marginTop: 8 }}
    >
      <strong>{`${entry.chapter.id} · ${entry.chapter.objective} · carry-forward`}</strong>
      <div>变化</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {value.changes.map(change => (
          <li key={change} data-recent-post-chapter-change={change}>{change}</li>
        ))}
      </ul>
      <div>代价</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {value.costs.map(cost => (
          <li key={cost} data-recent-post-chapter-cost={cost}>{cost}</li>
        ))}
      </ul>
      <div>新增可能</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {value.newlyPossible.map(possible => (
          <li key={possible} data-recent-post-chapter-newly-possible={possible}>{possible}</li>
        ))}
      </ul>
      <div>新增不可能</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {value.newlyImpossible.map(impossible => (
          <li key={impossible} data-recent-post-chapter-newly-impossible={impossible}>{impossible}</li>
        ))}
      </ul>
      <div>读者现已知道</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {value.readerNowKnows.map(knowledge => (
          <li key={knowledge} data-recent-post-chapter-reader-knows={knowledge}>{knowledge}</li>
        ))}
      </ul>
      <div>读者现已怀疑</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {value.readerNowSuspects.map(suspicion => (
          <li key={suspicion} data-recent-post-chapter-reader-suspects={suspicion}>{suspicion}</li>
        ))}
      </ul>
      <div>人物延续</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {value.characterCarryForward.map(carry => (
          <li
            key={carry.characterId}
            data-recent-post-chapter-character-carry={carry.characterId}
          >
            {`${carry.characterId} · ${carry.carries.join(' · ')}`}
          </li>
        ))}
      </ul>
      <PostChapterCheckResolutionView resolution={entry.resolution} />
    </article>
  )
}

function ProgressionClockEntryView({
  value,
}: {
  readonly value: NovelProgressionClockValue
}) {
  return (
    <section
      data-progression-clock-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} progression clock`}
      style={{ marginTop: 6 }}
    >
      <div>
        <strong>{`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)}`}</strong>
      </div>
      <div>{`推进：${value.movement}`}</div>
      <div>{`状态：${value.state}`}</div>
      {value.storyTime !== undefined && <div>{`故事时间: ${value.storyTime}`}</div>}
      <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {value.tracks.map(track => (
          <li key={track.trackId} data-progression-track={track.trackId} style={{ marginTop: 6 }}>
            <div>
              <strong>{`${track.role} · ${track.action} · ${track.characterId} · ${track.dimension}`}</strong>
            </div>
            <div>
              {`推进：${track.advancementIds.length === 0 ? '无' : track.advancementIds.join(', ')}`}
            </div>
            <div>{`承诺：${track.promiseIds.length === 0 ? '无' : track.promiseIds.join(', ')}`}</div>
            <div>
              {`结局假设：${track.endingHypothesisIds.length === 0 ? '无' : track.endingHypothesisIds.join(', ')}`}
            </div>
            <div>{`就绪度：setup ${track.readiness.setup} · payoff ${track.readiness.payoff}`}</div>
            {track.driftWarnings.length > 0 && (
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {track.driftWarnings.map(warning => (
                  <li
                    key={warning.warningId}
                    data-progression-drift-warning={warning.warningId}
                  >
                    {`${warning.kind} · ${warning.description}`}
                  </li>
                ))}
              </ul>
            )}
            <div>{`贡献：${track.contribution}`}</div>
          </li>
        ))}
      </ol>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function PromiseClockEntryView({
  value,
}: {
  readonly value: NovelPromiseClockValue
}) {
  return (
    <section
      data-promise-clock-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} promise clock`}
      style={{ marginTop: 6 }}
    >
      <div>
        <strong>{`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)}`}</strong>
      </div>
      <div>{`推进：${value.movement}`}</div>
      <div>{`状态：${value.state}`}</div>
      {value.storyTime !== undefined && <div>{`故事时间: ${value.storyTime}`}</div>}
      <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {value.moves.map(move => (
          <li key={move.moveId} data-promise-move={move.moveId} style={{ marginTop: 6 }}>
            <div><strong>{`${move.kind} · ${move.promiseId}`}</strong></div>
            <div>{`债务：${move.debtIds === null || move.debtIds.length === 0 ? '无' : move.debtIds.join(', ')}`}</div>
            <div>{`贡献：${move.contribution}`}</div>
          </li>
        ))}
      </ol>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function CharacterClockEntryView({
  value,
}: {
  readonly value: NovelCharacterClockValue
}) {
  return (
    <section
      data-character-clock-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} character clock`}
      style={{ marginTop: 6 }}
    >
      <div>
        <strong>{`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)}`}</strong>
      </div>
      <div>{`推进：${value.movement}`}</div>
      <div>{`状态：${value.state}`}</div>
      {value.storyTime !== undefined && <div>{`故事时间: ${value.storyTime}`}</div>}
      <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {value.moves.map(move => (
          <li key={move.moveId} data-character-move={move.moveId} style={{ marginTop: 6 }}>
            <div><strong>{`${move.kind} · ${move.characterId}`}</strong></div>
            <div>
              {`故事事件：${move.storyEventIds.length === 0 ? '无' : move.storyEventIds.join(', ')}`}
            </div>
            <div>{`贡献：${move.contribution}`}</div>
          </li>
        ))}
      </ol>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function RelationshipClockEntryView({
  value,
}: {
  readonly value: NovelRelationshipClockValue
}) {
  return (
    <section
      data-relationship-clock-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} relationship clock`}
      style={{ marginTop: 6 }}
    >
      <div>
        <strong>{`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)}`}</strong>
      </div>
      <div>{`推进：${value.movement}`}</div>
      <div>{`状态：${value.state}`}</div>
      {value.storyTime !== undefined && <div>{`故事时间: ${value.storyTime}`}</div>}
      <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {value.moves.map(move => (
          <li key={move.moveId} data-relationship-move={move.moveId} style={{ marginTop: 6 }}>
            <div><strong>{`${move.lineId} · ${move.relationshipTargetId}`}</strong></div>
            <div>
              {`故事事件：${move.storyEventIds.length === 0 ? '无' : move.storyEventIds.join(', ')}`}
            </div>
            <div>
              {`情绪片段：${move.emotionEpisodeIds.length === 0 ? '无' : move.emotionEpisodeIds.join(', ')}`}
            </div>
            <div>{`贡献：${move.contribution}`}</div>
          </li>
        ))}
      </ol>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function WorldClockEntryView({
  value,
}: {
  readonly value: NovelWorldClockValue
}) {
  return (
    <section
      data-world-clock-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} world clock`}
      style={{ marginTop: 6 }}
    >
      <div>
        <strong>{`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)}`}</strong>
      </div>
      <div>{`推进：${value.movement}`}</div>
      <div>{`状态：${value.state}`}</div>
      {value.storyTime !== undefined && <div>{`故事时间: ${value.storyTime}`}</div>}
      <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {value.moves.map(move => (
          <li key={move.moveId} data-world-move={move.moveId} style={{ marginTop: 6 }}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {move.references.map(reference => {
                const id = reference.kind === 'rule' ? reference.targetId : reference.entryId
                return (
                  <li key={`${reference.kind}:${id}`} data-world-reference={`${reference.kind}:${id}`}>
                    {`${reference.kind} · ${id}`}
                  </li>
                )
              })}
            </ul>
            <div>{`贡献：${move.contribution}`}</div>
          </li>
        ))}
      </ol>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function ReaderKnowledgeEntryView({
  value,
}: {
  readonly value: NovelReaderKnowledgeClockValue
}) {
  return (
    <section
      data-reader-knowledge-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} reader knowledge`}
      style={{ marginTop: 6 }}
    >
      <div>
        <strong>{`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)}`}</strong>
      </div>
      <div>{`推进：${value.movement}`}</div>
      <div>{`状态：${value.state}`}</div>
      {value.storyTime !== undefined && <div>{`故事时间: ${value.storyTime}`}</div>}
      {value.events.length === 0
        ? <div style={{ opacity: .7 }}>暂无读者披露事件</div>
        : (
            <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {value.events.map(event => (
                <li
                  key={event.eventId}
                  data-reader-knowledge-event={event.eventId}
                  style={{ marginTop: 6 }}
                >
                  <div>
                    <strong>
                      {`${event.kind} · ${event.intendedEffect} · ${event.knowledgeTargetId} · ${event.unitId}`}
                    </strong>
                  </div>
                  <div>{`视角：${event.viewpointId ?? 'reader'} · 通行权限：${event.viewpointAccess}`}</div>
                  <div>{event.description}</div>
                  <div>{`来源：${event.sourceAnchorIds.join(', ')}`}</div>
                </li>
              ))}
            </ol>
          )}
      <div data-reader-knowledge-ambiguity="">
        {`歧义策略：${value.ambiguityPolicy.mode} · ${value.ambiguityPolicy.description}`}
      </div>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function MysteryClockEntryView({
  value,
}: {
  readonly value: NovelMysteryClockValue
}) {
  return (
    <section
      data-mystery-clock-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} mystery clock`}
      style={{ marginTop: 6 }}
    >
      <div>
        <strong>{`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)}`}</strong>
      </div>
      <div>{`推进：${value.movement}`}</div>
      <div>{`状态：${value.state}`}</div>
      {value.storyTime !== undefined && <div>{`故事时间: ${value.storyTime}`}</div>}
      <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {value.moves.map(move => (
          <li key={move.moveId} data-mystery-move={move.moveId} style={{ marginTop: 6 }}>
            <div><strong>{`${move.kind} · ${move.mysteryId}`}</strong></div>
            <div>{`线索：${move.clueIds.length === 0 ? '无' : move.clueIds.join(', ')}`}</div>
            <div>
              {`认知目标：${move.knowledgeTargetIds.length === 0 ? '无' : move.knowledgeTargetIds.join(', ')}`}
            </div>
            <div>{`贡献：${move.contribution}`}</div>
          </li>
        ))}
      </ol>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function TensionPayoffEntryView({
  value,
}: {
  readonly value: NovelTensionPayoffValue
}) {
  return (
    <section
      data-tension-payoff-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} tension and payoff waves`}
      style={{ marginTop: 6 }}
    >
      <div>
        <strong>{`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)}`}</strong>
      </div>
      <div>{`推进：${value.movement}`}</div>
      <div>{`状态：${value.state}`}</div>
      {value.storyTime !== undefined && <div>{`故事时间: ${value.storyTime}`}</div>}
      <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {value.waves.map(wave => (
          <li key={wave.waveId} data-tension-wave={wave.waveId} style={{ marginTop: 6 }}>
            <div><strong>{wave.waveId}</strong></div>
            <div>{`来源：${wave.source}`}</div>
            <div data-tension-wave-intensity={wave.waveId}>
              {`强度：${wave.intensity.opening} → ${wave.intensity.peak} → ${wave.intensity.closing}`}
            </div>
            <div data-tension-wave-duration={wave.waveId}>
              {`持续时间：${wave.duration.startUnitId} → ${wave.duration.endUnitId ?? '持续中'}`}
            </div>
            <div data-tension-wave-release={wave.waveId}>
              {wave.release === null
                ? '无释放标记'
                : `释放：${wave.release.status} · ${wave.release.kind} · ${wave.release.markerUnitId} · ${wave.release.description} · 代价：${wave.release.cost} · 余波：${wave.release.aftermath}`}
            </div>
            <div data-tension-wave-recovery={wave.waveId}>
              {wave.recovery === null
                ? '无恢复标记'
                : `恢复：${wave.recovery.status} · ${wave.recovery.markerUnitId} · ${wave.recovery.description} · 之后状态：${wave.recovery.stateAfter}`}
            </div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {wave.sceneFunctions.map(sceneFunction => (
                <li
                  key={`${wave.waveId}:${sceneFunction.sceneUnitId}:${sceneFunction.function}`}
                  data-tension-wave-scene-function={sceneFunction.sceneUnitId}
                >
                  {`${sceneFunction.sceneUnitId} · ${sceneFunction.function} · ${sceneFunction.contribution}`}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function EndingClockEntryView({
  value,
}: {
  readonly value: NovelEndingClockValue
}) {
  return (
    <section
      data-ending-clock-scope={value.scope.unitId}
      aria-label={`${value.scope.unitId} ending clock`}
      style={{ marginTop: 4 }}
    >
      <div>
        {`${value.scope.level} · ${value.scope.unitId} · v${String(value.version)} · closure ${value.scope.closureScopeId}`}
      </div>
      <div>{`${value.movement} · ${value.state}`}</div>
      {value.storyTime !== undefined && (
        <div style={{ opacity: .7 }}>{`故事时间: ${value.storyTime}`}</div>
      )}
      <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {value.moves.map(move => (
          <li key={move.moveId} data-ending-move={move.moveId}>
            <div>
              {`${move.kind} · ${move.debtReferences
                .map(reference => `${reference.clock} · ${reference.id}`).join(', ')}`}
            </div>
            <div>{`贡献：${move.contribution}`}</div>
          </li>
        ))}
      </ol>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
    </section>
  )
}

function NarrativeProjectionView({
  narrative,
}: {
  readonly narrative: NovelNarrativeProjection
}) {
  const unitsById = new Map(narrative.units.map(unit => [unit.id, unit] as const))
  return (
    <>
      <details open>
        <summary>{`故事层级 (${String(narrative.units.length)})`}</summary>
        {narrative.units.length === 0 && (
          <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受故事结构单元</p>
        )}
        {narrative.units.length > 0 && (
          <ol
            aria-label="故事层级"
            style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}
          >
            {narrative.units.map(unit => {
              const depth = narrativeUnitDepth(unitsById, unit.id)
              return (
                <li
                  key={unit.id}
                  data-narrative-unit={unit.id}
                  style={{ marginTop: 8, paddingLeft: (depth - 1) * 16 }}
                >
                  <div>
                    <strong>{`${unit.level} · ${unit.id}`}</strong>
                    <span style={{ marginLeft: 8, opacity: .7 }}>{unit.status}</span>
                  </div>
                  <div>{unit.objective}</div>
                  <div style={{ opacity: .7 }}>
                    {`${unit.entryState} → ${unit.exitState}`}
                  </div>
                  <small style={{ opacity: .7 }}>{projectionSourceLabel(unit)}</small>
                </li>
              )
            })}
          </ol>
        )}
      </details>
      <details open>
        <summary>{`叙事时钟 (${String(narrative.clocks.length)})`}</summary>
        <div aria-label="叙事时钟">
          {narrative.clocks.map(bucket => (
            <article
              key={bucket.clock}
              data-narrative-clock={bucket.clock}
              aria-label={`${bucket.clock} narrative clock`}
              style={{ marginTop: 10 }}
            >
              <strong>{bucket.clock}</strong>
              {bucket.entries.length === 0 && bucket.debts.length === 0 && (
                <p style={{ margin: '4px 0 0', opacity: .7 }}>
                  暂无已接受的推进或债务
                </p>
              )}
              {bucket.entries.length > 0 && (
                <ul aria-label={`${bucket.clock} movements`} style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {bucket.entries.map(entry => {
                    const plotProgression = entry.delta.operation === 'set'
                      && entry.delta.field === 'plot'
                      ? entry.delta.value as NovelPlotProgressionValue
                      : undefined
                    const promise = entry.delta.operation === 'set'
                      && entry.delta.field === 'promise'
                      ? entry.delta.value as NovelPromiseClockValue
                      : undefined
                    const progression = entry.delta.operation === 'set'
                      && entry.delta.field === 'progression'
                      ? entry.delta.value as NovelProgressionClockValue
                      : undefined
                    const character = entry.delta.operation === 'set'
                      && entry.delta.field === 'character'
                      ? entry.delta.value as NovelCharacterClockValue
                      : undefined
                    const relationship = entry.delta.operation === 'set'
                      && entry.delta.field === 'relationship'
                      ? entry.delta.value as NovelRelationshipClockValue
                      : undefined
                    const readerKnowledge = entry.delta.operation === 'set'
                      && entry.delta.field === 'reader-knowledge'
                      ? entry.delta.value as NovelReaderKnowledgeClockValue
                      : undefined
                    const mystery = entry.delta.operation === 'set'
                      && entry.delta.field === 'mystery'
                      ? entry.delta.value as NovelMysteryClockValue
                      : undefined
                    const tensionPayoff = entry.delta.operation === 'set'
                      && entry.delta.field === 'tension-payoff'
                      ? entry.delta.value as NovelTensionPayoffValue
                      : undefined
                    const world = entry.delta.operation === 'set'
                      && entry.delta.field === 'world'
                      ? entry.delta.value as NovelWorldClockValue
                      : undefined
                    const ending = entry.delta.operation === 'set'
                      && entry.delta.field === 'ending'
                      ? entry.delta.value as NovelEndingClockValue
                      : undefined
                    return (
                      <li key={`${entry.unitId}:${entry.sourceDeltaId}`}>
                        {ending !== undefined
                          ? <EndingClockEntryView value={ending} />
                          : world !== undefined
                            ? <WorldClockEntryView value={world} />
                            : <div>{`${entry.unitId} · ${entry.movement} · ${entry.state}`}</div>}
                        {ending === undefined && world === undefined && entry.storyTime !== undefined && (
                          <div style={{ opacity: .7 }}>{`故事时间: ${entry.storyTime}`}</div>
                        )}
                        {plotProgression !== undefined && (
                          <PlotProgressionEntryView value={plotProgression} />
                        )}
                        {promise !== undefined && (
                          <PromiseClockEntryView value={promise} />
                        )}
                        {progression !== undefined && (
                          <ProgressionClockEntryView value={progression} />
                        )}
                        {character !== undefined && (
                          <CharacterClockEntryView value={character} />
                        )}
                        {relationship !== undefined && (
                          <RelationshipClockEntryView value={relationship} />
                        )}
                        {readerKnowledge !== undefined && (
                          <ReaderKnowledgeEntryView value={readerKnowledge} />
                        )}
                        {mystery !== undefined && (
                          <MysteryClockEntryView value={mystery} />
                        )}
                        {tensionPayoff !== undefined && (
                          <TensionPayoffEntryView value={tensionPayoff} />
                        )}
                        <small style={{ opacity: .7 }}>{projectionSourceLabel(entry)}</small>
                      </li>
                    )
                  })}
                </ul>
              )}
              {bucket.debts.length > 0 && (
                <ul aria-label={`${bucket.clock} debts`} style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {bucket.debts.map(debt => (
                    <li key={`${debt.id}:${debt.sourceDeltaId}`}>
                      <div>{`${debt.id} · ${debt.summary} · ${debt.status}`}</div>
                      <div style={{ opacity: .7 }}>
                        {`单元：${debt.unitId}${debt.horizon === undefined ? '' : ` · Horizon: ${debt.horizon}`}`}
                      </div>
                      <small style={{ opacity: .7 }}>{projectionSourceLabel(debt)}</small>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </details>
    </>
  )
}

function RelationshipProjectionView({
  projection,
}: {
  readonly projection: NovelRelationshipProjection
}) {
  return projection.relationships.length === 0
    ? <p style={{ marginBottom: 0, opacity: .7 }}>暂无已接受人物关系</p>
    : (
      <ul
        aria-label="关系线"
        style={{ margin: '8px 0 0', paddingLeft: 18 }}
      >
        {projection.relationships.map(relationship => (
          <li
            key={relationship.line}
            data-novel-relationship={relationship.line}
            style={{ marginTop: 6 }}
          >
            <div>
              <strong>{`${relationship.participants[0]} ↔ ${relationship.participants[1]}`}</strong>
              <span style={{ marginLeft: 8, opacity: .7 }}>{relationship.line}</span>
            </div>
            <ul
              aria-label={`${relationship.participants[0]} and ${relationship.participants[1]} directional states`}
              style={{ margin: '4px 0 0', paddingLeft: 18 }}
            >
              {relationship.directions.map(direction => (
                <li
                  key={direction.pair}
                  data-novel-relationship-direction={direction.pair}
                  style={{ marginTop: 4 }}
                >
                  <strong>{`${direction.from} → ${direction.to}`}</strong>
                  {direction.fields['line-state'] === undefined
                    ? null
                    : (
                      <RelationshipLineStateView
                        pair={direction.pair}
                        value={direction.fields['line-state'] as NovelRelationshipLineStateValue}
                        sourceLabel={projectionSourceLabel(
                          direction.fieldSources['line-state'] ?? direction,
                        )}
                      />
                    )}
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {Object.entries(direction.fields)
                      .filter(([field]) => field !== 'line-state')
                      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
                      .map(([field, value]) => (
                        <li key={field}>{`${field}: ${formatCanonValue(value)}`}</li>
                      ))}
                  </ul>
                  <small style={{ opacity: .7 }}>{projectionSourceLabel(direction)}</small>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    )
}

function RelationshipLineStateView({
  pair,
  value,
  sourceLabel,
}: {
  readonly pair: string
  readonly value: NovelRelationshipLineStateValue
  readonly sourceLabel: string
}) {
  return (
    <section
      data-relationship-line-state={pair}
      aria-label={`${pair} relationship line state`}
      style={{ marginTop: 6 }}
    >
      <div><strong>{`关系线 v${String(value.version)}`}</strong></div>
      <div>{`前提：${value.premise}`}</div>
      <div>{`形式：${value.form}`}</div>
      <div>{`阶段：${value.stage}`}</div>
      <div>{`独立目标：${value.independentGoal}`}</div>
      <div>{`当前信任：${value.currentTrust}`}</div>
      <div>{`当前冲突：${value.currentConflict}`}</div>
      <div>{`当前承诺：${value.currentCommitment}`}</div>
      <div style={{ marginTop: 4 }}>边界</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.boundaries.map(boundary => (
          <li key={boundary} data-relationship-line-boundary={boundary}>{boundary}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>共同经历</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.sharedHistory.map(history => (
          <li key={history} data-relationship-line-history={history}>{history}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>障碍</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.obstacles.map(obstacle => (
          <li key={obstacle} data-relationship-line-obstacle={obstacle}>{obstacle}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>未收束的关系债务</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.unresolvedDebts.map(debt => (
          <li key={debt} data-relationship-line-debt={debt}>{debt}</li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>主情节后果</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.mainPlotConsequences.map(consequence => (
          <li
            key={consequence}
            data-relationship-main-plot-consequence={consequence}
          >
            {consequence}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 4 }}>已赢得的回合</div>
      {value.turns.length === 0
        ? <p style={{ margin: '2px 0 0', opacity: .7 }}>尚无已赢得的回合</p>
        : (
          <ol style={{ margin: '2px 0 0', paddingLeft: 18 }}>
            {value.turns.map(turn => (
              <li key={turn.turnId} data-relationship-line-turn={turn.turnId}>
                <div>{`${turn.turnType} · ${turn.eventId} · order ${String(turn.storyOrder)}`}</div>
                <div>{`动作：${turn.action}`}</div>
                <div>{`对方反应：${turn.otherResponse}`}</div>
                <div>{`代价：${turn.cost}`}</div>
                <div>{`持久后果：${turn.persistentConsequence}`}</div>
                <div>{`之后阶段：${turn.stageAfter}`}</div>
              </li>
            ))}
          </ol>
        )}
      <div style={{ marginTop: 4 }}>主动性证据</div>
      <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
        {value.agencyEvidence.map(evidence => (
          <li key={evidence} data-relationship-line-agency={evidence}>{evidence}</li>
        ))}
      </ul>
      <div>{`期望结局：${value.desiredEndingState ?? '未完'}`}</div>
      <div>{`修订理由：${value.revisionRationale ?? '初始'}`}</div>
      <small style={{ opacity: .7 }}>{sourceLabel}</small>
    </section>
  )
}

function narrativeUnitDepth(
  unitsById: ReadonlyMap<string, NovelNarrativeProjection['units'][number]>,
  unitId: string,
): number {
  let depth = 1
  let parentId = unitsById.get(unitId)?.parentId ?? null
  const seen = new Set([unitId])
  while (parentId !== null && !seen.has(parentId)) {
    seen.add(parentId)
    depth += 1
    parentId = unitsById.get(parentId)?.parentId ?? null
  }
  return depth
}

function storyEventParticipants(value: NovelCanonValue): readonly string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return []
  const participants: unknown = Reflect.get(value, 'participants')
  return Array.isArray(participants)
    ? participants.filter((participant): participant is string => (
        typeof participant === 'string' && participant.length > 0
      ))
    : []
}

function emotionEpisodeCharacterId(value: NovelCanonValue): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const characterId: unknown = Reflect.get(value, 'characterId')
  return typeof characterId === 'string' && characterId.length > 0 ? characterId : null
}

function progressionAdvancementCharacterId(value: NovelCanonValue): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const characterId: unknown = Reflect.get(value, 'characterId')
  return typeof characterId === 'string' && characterId.length > 0 ? characterId : null
}

function factionContinuityFactionId(value: NovelCanonValue): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const candidate: unknown = Reflect.get(value, 'factionId')
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null
}

function locationContinuityLocationId(value: NovelCanonValue): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const candidate: unknown = Reflect.get(value, 'locationId')
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null
}

function objectContinuityObjectId(value: NovelCanonValue): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const candidate: unknown = Reflect.get(value, 'objectId')
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null
}

function projectionSourceLabel(source: {
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: { readonly producer: string }
}): string {
  const anchors = source.sourceAnchorIds.length === 0
    ? '无'
    : source.sourceAnchorIds.join(', ')
  return `R${String(source.sourceRevision)} · ${source.sourceDeltaId} · 出处锚点：${anchors} · 生成者：${source.provenance.producer}`
}

async function loadSnapshot(
  workspaceId: WorkspaceId,
  openProject: NovelProjectPanelActions['openProject'],
  readRevision: NovelProjectPanelActions['readRevision'],
  projectCanon: NovelProjectPanelActions['projectCanon'],
  projectNarrative: NovelProjectPanelActions['projectNarrative'],
  projectManuscripts: NovelProjectPanelActions['projectManuscripts'],
  projectRelationships: NovelProjectPanelActions['projectRelationships'],
): Promise<
  | { readonly ok: true; readonly value: ProjectSnapshot }
  | { readonly ok: false; readonly message: string }
> {
  const opened = await openProject(workspaceId)
  if (!opened.ok) return { ok: false, message: opened.error.message }
  const revisions: AcceptedNovelRevision[] = []
  for (let revision = 1; revision <= opened.value.acceptedRevision; revision += 1) {
    const read = await readRevision(workspaceId, revision)
    if (!read.ok) return { ok: false, message: read.error.message }
    if (read.value !== undefined) revisions.push(read.value)
  }
  const canon = await projectCanon(workspaceId, opened.value.acceptedRevision)
  if (!canon.ok) return { ok: false, message: canon.error.message }
  const narrative = await projectNarrative(workspaceId, opened.value.acceptedRevision)
  const manuscripts = await projectManuscripts(workspaceId, opened.value.acceptedRevision)
  if (!manuscripts.ok) return { ok: false, message: manuscripts.error.message }
  const relationships = await projectRelationships(workspaceId, opened.value.acceptedRevision)
  return {
    ok: true,
    value: {
      project: opened.value,
      revisions,
      canon: canon.value,
      narrative: narrative.ok ? narrative.value : null,
      manuscripts: manuscripts.value,
      relationships: relationships.ok ? relationships.value : null,
    },
  }
}

function parseResultPacketJson(text: string): NovelResultPacketDraft {
  const value: unknown = JSON.parse(text)
  const parsed = novelResultPacketDraftSchema.safeParse(value)
  if (parsed.success) return parsed.data
  const issue = parsed.error.issues[0]
  if (issue === undefined) throw new Error('invalid Result Packet')
  const path = issue.path.length === 0 ? '' : `${issue.path.map(String).join('.')}: `
  throw new Error(`${path}${issue.message}`)
}

function latestNovelResultPacketProposal(
  snapshot: LegacyConversationSlice,
): ToolResultNode | null {
  for (let index = snapshot.nodes.length - 1; index >= 0; index -= 1) {
    const node = snapshot.nodes[index]
    if (node?.kind === 'tool-result'
      && !node.isError
      && (node.call?.name === 'propose_novel_result_packet'
        || node.call?.name === 'propose_novel_import')) {
      return node
    }
  }
  return null
}

function latestStoryWorldSimulationResult(
  snapshot: LegacyConversationSlice,
): StoryWorldSimulationResult | null {
  const result = latestSuccessfulToolResult(snapshot, 'simulate_novel_story_world')
  if (result === null) return null
  return JSON.parse(textContent(result)) as StoryWorldSimulationResult
}

function latestReaderResponseSimulationResult(
  snapshot: LegacyConversationSlice,
): ReaderResponseSimulationResult | null {
  const result = latestSuccessfulToolResult(snapshot, 'simulate_novel_reader_response')
  if (result === null) return null
  return JSON.parse(textContent(result)) as ReaderResponseSimulationResult
}

function latestWritingMemoryMetadata(
  snapshot: LegacyConversationSlice,
): WritingMemoryToolResult | null {
  for (let index = snapshot.nodes.length - 1; index >= 0; index -= 1) {
    const node = snapshot.nodes[index]
    if (node?.kind !== 'tool-result' || node.isError
      || node.meta === undefined || node.meta === null || typeof node.meta !== 'object') continue
    const meta = node.meta as Record<string, unknown>
    if (meta.writingMemory === undefined) continue
    return meta as unknown as WritingMemoryToolResult
  }
  return null
}

function latestWritingMemoryCall(
  snapshot: LegacyConversationSlice,
): ToolResultNode | null {
  for (let index = snapshot.nodes.length - 1; index >= 0; index -= 1) {
    const node = snapshot.nodes[index]
    if (node?.kind !== 'tool-result' || node.isError) continue
    if (node.call?.name !== 'retrieve_novel_context'
      && !(node.call === null && node.meta !== undefined)) continue
    const query = node.call !== null
      ? JSON.parse(node.call.argsRaw) as NovelRetrievalQuery
      : node.meta !== undefined && node.meta !== null && typeof node.meta === 'object'
        ? node.meta as NovelRetrievalQuery
        : null
    if (query === null) continue
    if (query.writingMemoryQuery === undefined) continue
    return node
  }
  return null
}

function latestSuccessfulToolResult(
  snapshot: LegacyConversationSlice,
  toolName: string,
): ToolResultNode | null {
  for (let index = snapshot.nodes.length - 1; index >= 0; index -= 1) {
    const node = snapshot.nodes[index]
    if (node?.kind === 'tool-result' && !node.isError && node.call?.name === toolName) {
      return node
    }
  }
  return null
}

function textContent(result: ToolResultNode): string {
  const block = result.content.find(candidate => candidate.type === 'text')
  if (block === undefined || block.type !== 'text') {
    throw new Error(`提案 '${result.callId}' has no text content`)
  }
  return block.text
}

interface ResultPacketDecisionButtonsProps {
  readonly itemType: ResultPacketItemDecision['itemType']
  readonly itemId: string
  readonly outcome: ResultPacketItemDecision['outcome'] | undefined
  readonly reason: string
  readonly disabled: boolean
  readonly onDecide: (
    itemType: ResultPacketItemDecision['itemType'],
    itemId: string,
    outcome: ResultPacketItemDecision['outcome'],
  ) => void
  readonly onReasonChange: (
    itemType: ResultPacketItemDecision['itemType'],
    itemId: string,
    reason: string,
  ) => void
}

function ResultPacketDecisionButtons({
  itemType,
  itemId,
  outcome,
  reason,
  disabled,
  onDecide,
  onReasonChange,
}: ResultPacketDecisionButtonsProps) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div
        role="group"
        aria-label={`${itemType} ${itemId} decision`}
        style={{ display: 'flex', gap: 6 }}
      >
        {(['accept', 'reject'] as const).map(candidate => (
          <button
            key={candidate}
            type="button"
            data-result-packet-decision={`${itemType}:${itemId}:${candidate}`}
            aria-label={`${candidate === 'accept' ? '接受' : '拒绝'} ${itemType} ${itemId}`}
            aria-pressed={outcome === candidate}
            style={buttonStyle}
            disabled={disabled}
            onClick={() => { onDecide(itemType, itemId, candidate) }}
          >
            {candidate === 'accept' ? '接受' : '拒绝'}
          </button>
        ))}
      </div>
      <label>
        Reason
        <input
          aria-label={`决定理由：${itemType} ${itemId}`}
          value={reason}
          style={{ ...selectStyle, marginLeft: 6 }}
          placeholder="Optional"
          disabled={disabled}
          onChange={event => { onReasonChange(itemType, itemId, event.currentTarget.value) }}
        />
      </label>
    </div>
  )
}

function allAcceptOutcomes(
  packet: ReviewableNovelResultPacket,
): Readonly<Record<string, ResultPacketItemDecision['outcome']>> {
  const outcomes: Record<string, ResultPacketItemDecision['outcome']> = {}
  if (packet.manuscript !== undefined) {
    outcomes[resultPacketDecisionKey('manuscript', packet.manuscript.unitId)] = 'accept'
  }
  for (const delta of packet.deltas) outcomes[resultPacketDecisionKey('delta', delta.id)] = 'accept'
  for (const issue of packet.issues) outcomes[resultPacketDecisionKey('issue', issue.id)] = 'accept'
  return outcomes
}

function buildResultPacketDecisions(
  packet: ReviewableNovelResultPacket,
  outcomes: Readonly<Record<string, ResultPacketItemDecision['outcome']>>,
  reasons: Readonly<Record<string, string>>,
): ResultPacketItemDecision[] | null {
  const decisions: ResultPacketItemDecision[] = []
  if (packet.manuscript !== undefined) {
    const itemId = packet.manuscript.unitId
    const key = resultPacketDecisionKey('manuscript', itemId)
    const outcome = outcomes[key]
    if (outcome === undefined) return null
    const reason = reasons[key]?.trim()
    decisions.push({
      itemType: 'manuscript',
      itemId,
      outcome,
      ...(reason === undefined || reason.length === 0 ? {} : { reason }),
    })
  }
  for (const delta of packet.deltas) {
    const key = resultPacketDecisionKey('delta', delta.id)
    const outcome = outcomes[key]
    if (outcome === undefined) return null
    const reason = reasons[key]?.trim()
    decisions.push({
      itemType: 'delta',
      itemId: delta.id,
      outcome,
      ...(reason === undefined || reason.length === 0 ? {} : { reason }),
    })
  }
  for (const issue of packet.issues) {
    const key = resultPacketDecisionKey('issue', issue.id)
    const outcome = outcomes[key]
    if (outcome === undefined) return null
    const reason = reasons[key]?.trim()
    decisions.push({
      itemType: 'issue',
      itemId: issue.id,
      outcome,
      ...(reason === undefined || reason.length === 0 ? {} : { reason }),
    })
  }
  return decisions
}

function countResultPacketDecisions(
  decisions: readonly ResultPacketItemDecision[],
  itemType: ResultPacketItemDecision['itemType'],
): ResultPacketDecisionCounts {
  let accepted = 0
  let rejected = 0
  for (const decision of decisions) {
    if (decision.itemType !== itemType) continue
    if (decision.outcome === 'accept') accepted += 1
    else rejected += 1
  }
  return { accepted, rejected }
}

function formatDecisionCounts(
  label: string,
  counts: ResultPacketDecisionCounts,
): string {
  return `${label} · ${String(counts.accepted)} 项接受 · ${String(counts.rejected)} 项拒绝`
}

function resultPacketDraft(
  packet: ReviewableNovelResultPacket,
): NovelResultPacketDraft {
  return {
    packetId: packet.packetId,
    expectedRevision: packet.expectedRevision,
    ...(packet.manuscript === undefined ? {} : { manuscript: packet.manuscript }),
    ...(packet.manuscriptDiff === undefined ? {} : { manuscriptDiff: packet.manuscriptDiff }),
    deltas: packet.deltas,
    issues: packet.issues,
    sourceAnchors: packet.sourceAnchors,
    provenance: packet.provenance,
  }
}

function hasAuthorization(
  packet: ReviewableNovelResultPacket,
): packet is NovelResultPacket {
  return 'authorization' in packet
}

function resultPacketDecisionKey(
  itemType: ResultPacketItemDecision['itemType'],
  itemId: string,
): string {
  return `${itemType}:${itemId}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resultPacketItemId(value: unknown, index: number): string {
  return isRecord(value) && typeof value.id === 'string' ? value.id : String(index)
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function formatCanonValue(value: NovelCanonValue): string {
  return typeof value === 'string' ? value : canonicalizeJsonValue(value)
}

function canonicalizeJsonValue(value: NovelCanonValue): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return `[${value.map(canonicalizeJsonValue).join(',')}]`
  if (typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalizeJsonValue(child)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
