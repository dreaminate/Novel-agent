import { createHash } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { JobOutcome } from '@deepseek-ai/dsh-jobs'
import { deepFreeze } from '@deepseek-ai/dsh-util-values'
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import { Jieba } from '@node-rs/jieba'
import { dict } from '@node-rs/jieba/dict.js'
import MiniSearch from 'minisearch'
import { z } from 'zod'
import type { NovelMemoryReadService } from '@novel-agent/novel-project'
import type {} from '@novel-agent/novel-planning'
import type {} from '@novel-agent/novel-writing'
import { CANON_FACT_KINDS, NARRATIVE_LEVELS, NARRATIVE_CLOCKS } from '@novel-agent/novel-project/types'
import type {
  AcceptedNovelRevision,
  CanonFactDelta,
  NarrativeDebtReference,
  NovelCanonFact,
  NovelCanonProjection,
  NovelCanonValue,
  NovelCharacterTrajectory,
  NovelCharacterTrajectoryField,
  NovelClosureLedger,
  NovelClueLifecycle,
  NovelClueLifecycleField,
  NovelClueStateValue,
  NovelCreativeStyleProfileValue,
  NovelEmotionContinuityLedger,
  NovelEmotionEpisodeValue,
  NovelEndingHypothesis,
  NovelEndingHypothesisValue,
  NovelFactionContinuityLedger,
  NovelFactionContinuityValue,
  NovelLocationContinuityLedger,
  NovelLocationContinuityValue,
  NovelManuscriptProjection,
  NovelMysteryLifecycle,
  NovelMysteryLifecycleField,
  NovelMysteryLinkedClueEvidence,
  NovelNarrativeClockEntry,
  NovelNarrativeProjection,
  NovelObjectContinuityLedger,
  NovelObjectContinuityValue,
  NovelProgressionAdvancementValue,
  NovelProgressionLedger,
  NovelProject,
  NovelPromiseLifecycle,
  NovelPromiseLifecycleField,
  NovelReaderContractProfileValue,
  NovelRetrievalHit,
  NovelRetrievalRebuildJob,
  NovelRetrievalResult,
  NovelRetrievalSourceRange,
  NovelRollingRoadmapPlanValue,
  NovelRollingRoadmapResolution,
  NovelStoryEventValue,
  NovelTimelineLedger,
  NovelWritingContinuity,
  NovelWritingMemoryAuthoringEvidence,
  NovelWritingMemoryRecall
} from '@novel-agent/novel-project/types'

/** Native Memory retrieval and derived index operations; all facts remain in Canon. */
interface MemoryProjectionContext extends NovelProject {
  readonly revisionAt: (revision: number) => Omit<AcceptedNovelRevision, 'authorization'>
  readonly canonAt: (revision: number) => NovelCanonProjection
  readonly manuscriptsAt: (revision: number) => readonly NovelManuscriptProjection[]
}

function projectionContext(ctx: Context, workspaceId: WorkspaceId): MemoryProjectionContext {
  return {
    ...ctx.novelProject.current(workspaceId)!,
    revisionAt: revision => {
      const { authorization: _authorization, ...source } = ctx.novelProject.readRevision(workspaceId, revision)!
      return source
    },
    canonAt: revision => ctx.novelProject.projectCanon(workspaceId, revision),
    manuscriptsAt: revision => ctx.novelWriting.readManuscripts(workspaceId, revision),
  }
}

/** Read one accepted revision through Canon/Planning/Writing and Memory's domain calculations. */
export function retrieveNovelContext(ctx: Context, memory: NovelMemoryReadService, indexes: Map<WorkspaceId, LocalChineseRetrievalIndex>, workspaceId: WorkspaceId, query: unknown): NovelRetrievalResult {
  const parsed = novelRetrievalQuerySchema.parse(query)
  const canon = ctx.novelProject.projectCanon(workspaceId, parsed.revision)
  if (parsed.compareRevision !== undefined) ctx.novelProject.projectCanon(workspaceId, parsed.compareRevision)
  const project = projectionContext(ctx, workspaceId)
  const narrative = ctx.novelPlanning.readPlan(workspaceId, parsed.revision)
  const manuscripts = ctx.novelWriting.readManuscripts(workspaceId, parsed.revision)
  const characterTrajectory = parsed.characterTrajectoryId === undefined
    ? undefined
    : buildNovelCharacterTrajectory(
        project,
        parsed.revision,
        project.acceptedRevision,
        parsed.characterTrajectoryId,
      )
  const clueLifecycle = parsed.clueLifecycleId === undefined
    ? undefined
    : buildNovelClueLifecycle(
        project,
        parsed.revision,
        project.acceptedRevision,
        parsed.clueLifecycleId,
      )
  const promiseLifecycle = parsed.promiseLifecycleId === undefined
    ? undefined
    : buildNovelPromiseLifecycle(
        project,
        parsed.revision,
        project.acceptedRevision,
        parsed.promiseLifecycleId,
      )
  const mysteryLifecycle = parsed.mysteryLifecycleId === undefined
    ? undefined
    : buildNovelMysteryLifecycle(
        project,
        parsed.revision,
        project.acceptedRevision,
        parsed.mysteryLifecycleId,
      )
  const progressionLedger = parsed.progressionCharacterId === undefined
    ? undefined
    : buildNovelProgressionLedger(
        project,
        canon,
        project.acceptedRevision,
        parsed.progressionCharacterId,
      )
  const factionContinuity = parsed.factionId === undefined
    ? undefined
    : buildNovelFactionContinuityLedger(
        project,
        canon,
        project.acceptedRevision,
        parsed.factionId,
      )
  const locationContinuity = parsed.locationId === undefined
    ? undefined
    : buildNovelLocationContinuityLedger(
        project,
        canon,
        project.acceptedRevision,
        parsed.locationId,
      )
  const objectContinuity = parsed.objectId === undefined
    ? undefined
    : buildNovelObjectContinuityLedger(
        project,
        canon,
        project.acceptedRevision,
        parsed.objectId,
      )
  const emotionContinuity = parsed.emotionCharacterId === undefined
    ? undefined
    : buildNovelEmotionContinuityLedger(
        project,
        canon,
        project.acceptedRevision,
        parsed.emotionCharacterId,
      )
  const knowledgeBoundary = parsed.knowledgeSubjectId === undefined
    ? undefined
    : memory.readKnowledgeBoundary(workspaceId, parsed.revision, parsed.knowledgeSubjectId)
  const timeline = parsed.timelineParticipantId === undefined
    ? undefined
    : buildNovelTimelineLedger(
        project,
        canon,
        project.acceptedRevision,
        parsed.timelineParticipantId,
      )
  const roadmapResolution = parsed.canonKind === 'roadmap'
    && parsed.canonTargetId !== undefined
    ? buildNovelRollingRoadmapResolution(
        project,
        canon,
        narrative,
        parsed.canonTargetId,
      )
    : undefined
  const revisionImpact = parsed.compareRevision === undefined
    ? undefined
    : ctx.novelProject.readRevisionImpact(workspaceId, parsed.compareRevision, parsed.revision)
  const controlPack = parsed.chapterId === undefined
    ? undefined
    : memory.readChapterControlPack(workspaceId, parsed.revision, parsed.chapterId)
  const writingMemory = parsed.writingMemoryQuery === undefined
    ? undefined
    : buildWritingMemoryRecall(
        project,
        canon,
        narrative,
        manuscripts,
        controlPack === undefined
          ? memory.readWritingContinuity(workspaceId, parsed.revision)
          : undefined,
        parsed.writingMemoryQuery,
        controlPack === undefined,
      )
  const closure = parsed.closureScopeId === undefined
    || parsed.remainingChapterBudget === undefined
    ? undefined
    : buildNovelClosureLedger(
        project,
        canon,
        narrative,
        parsed.closureScopeId,
        parsed.remainingChapterBudget,
      )
  const knowledgeBoundaryFactIds = knowledgeBoundary === undefined
    ? undefined
    : new Set(knowledgeBoundary.entries.map(entry => entry.factId))
  const timelineEventIds = timeline === undefined
    ? undefined
    : new Set(timeline.events.map(event => event.eventId))
  const progressionAdvancementIds = progressionLedger === undefined
    ? undefined
    : new Set(progressionLedger.advancements.map(advancement => advancement.advancementId))
  const factionContinuityEntryIds = factionContinuity === undefined
    ? undefined
    : new Set(factionContinuity.entries.map(entry => entry.entryId))
  const locationContinuityEntryIds = locationContinuity === undefined
    ? undefined
    : new Set(locationContinuity.entries.map(entry => entry.entryId))
  const objectContinuityEntryIds = objectContinuity === undefined
    ? undefined
    : new Set(objectContinuity.entries.map(entry => entry.entryId))
  const emotionEpisodeIds = emotionContinuity === undefined
    ? undefined
    : new Set(emotionContinuity.episodes.map(episode => episode.episodeId))
  const hits: NovelRetrievalHit[] = []
  const hasExplicitCanonFilter = parsed.canonKind !== undefined
    || parsed.canonTargetId !== undefined
  for (const fact of canon.facts) {
    if (parsed.canonKind !== undefined && fact.kind !== parsed.canonKind) continue
    if (parsed.canonTargetId !== undefined && fact.targetId !== parsed.canonTargetId) continue
    if (parsed.characterTrajectoryId !== undefined && !(
      fact.kind === 'character-state'
      && fact.targetId === parsed.characterTrajectoryId
    )) continue
    if (parsed.clueLifecycleId !== undefined && !(
      fact.kind === 'clue'
      && fact.targetId === parsed.clueLifecycleId
    )) continue
    if (parsed.promiseLifecycleId !== undefined && !(
      fact.kind === 'promise'
      && fact.targetId === parsed.promiseLifecycleId
    )) continue
    if (parsed.mysteryLifecycleId !== undefined && !(
      fact.kind === 'mystery'
      && fact.targetId === parsed.mysteryLifecycleId
    )) continue
    if (progressionAdvancementIds !== undefined && !(
      fact.kind === 'progression'
      && fact.field === 'advancement'
      && progressionAdvancementIds.has(fact.targetId)
    )) continue
    if (!hasExplicitCanonFilter && factionContinuityEntryIds !== undefined && !(
      fact.kind === 'faction-state'
      && fact.field === 'continuity'
      && factionContinuityEntryIds.has(fact.targetId)
    )) continue
    if (!hasExplicitCanonFilter && locationContinuityEntryIds !== undefined && !(
      fact.kind === 'location-state'
      && fact.field === 'continuity'
      && locationContinuityEntryIds.has(fact.targetId)
    )) continue
    if (!hasExplicitCanonFilter && objectContinuityEntryIds !== undefined && !(
      fact.kind === 'object-state'
      && fact.field === 'continuity'
      && objectContinuityEntryIds.has(fact.targetId)
    )) continue
    if (emotionEpisodeIds !== undefined && !(
      fact.kind === 'emotion-state'
      && fact.field === 'episode'
      && emotionEpisodeIds.has(fact.targetId)
    )) continue
    if (knowledgeBoundaryFactIds !== undefined) {
      const relation = fact.kind === 'knowledge'
        ? splitNovelGraphRelationTarget(fact.targetId)
        : undefined
      const belongsToSubject = relation?.[0] === parsed.knowledgeSubjectId
      const describesKnownFact = fact.kind !== 'knowledge'
        && knowledgeBoundaryFactIds.has(fact.targetId)
      if (!belongsToSubject && !describesKnownFact) continue
    }
    if (timelineEventIds !== undefined && !(
      fact.kind === 'story-event'
      && fact.field === 'event'
      && timelineEventIds.has(fact.targetId)
    )) continue
    hits.push({
      method: 'structured',
      kind: 'canon-fact',
      sourceRevision: fact.sourceRevision,
      sourceRanges: retrievalSourceRanges(project, fact.sourceRevision, fact.sourceAnchorIds),
      provenance: fact.provenance,
      value: fact,
    })
  }
  for (const unit of narrative.units) {
    if (parsed.narrativeLevel !== undefined && unit.level !== parsed.narrativeLevel) continue
    if (parsed.narrativeUnitId !== undefined && unit.id !== parsed.narrativeUnitId) continue
    hits.push({
      method: 'structured',
      kind: 'narrative-unit',
      sourceRevision: unit.sourceRevision,
      sourceRanges: retrievalSourceRanges(project, unit.sourceRevision, unit.sourceAnchorIds),
      provenance: unit.provenance,
      value: unit,
    })
  }
  for (const bucket of narrative.clocks) {
    if (parsed.narrativeClock !== undefined && bucket.clock !== parsed.narrativeClock) continue
    for (const entry of bucket.entries) {
      if (parsed.narrativeUnitId !== undefined && entry.unitId !== parsed.narrativeUnitId) continue
      hits.push({
        method: 'structured',
        kind: 'narrative-clock',
        sourceRevision: entry.sourceRevision,
        ...(entry.storyTime === undefined ? {} : { storyTime: entry.storyTime }),
        sourceRanges: retrievalSourceRanges(project, entry.sourceRevision, entry.sourceAnchorIds),
        provenance: entry.provenance,
        value: entry,
      })
    }
    for (const debt of bucket.debts) {
      if (parsed.narrativeUnitId !== undefined && debt.unitId !== parsed.narrativeUnitId) continue
      hits.push({
        method: 'structured',
        kind: 'narrative-debt',
        sourceRevision: debt.sourceRevision,
        sourceRanges: retrievalSourceRanges(project, debt.sourceRevision, debt.sourceAnchorIds),
        provenance: debt.provenance,
        value: debt,
      })
    }
  }

  if (parsed.exactText !== undefined) {
    for (const projected of manuscripts) {
      if (parsed.unitId !== undefined && projected.manuscript.unitId !== parsed.unitId) continue
      const { manuscript } = projected
      const contentHash = createHash('sha256').update(manuscript.text).digest('hex')
      let start = manuscript.text.indexOf(parsed.exactText)
      while (start !== -1) {
        hits.push({
          method: 'exact-text',
          kind: 'manuscript',
          sourceRevision: projected.sourceRevision,
          sourceRanges: [{
            sourceId: manuscript.unitId,
            start,
            end: start + parsed.exactText.length,
            contentHash,
          }],
          provenance: projected.provenance,
          manuscript: {
            unitId: manuscript.unitId,
            title: manuscript.title,
          },
          match: parsed.exactText,
        })
        start = manuscript.text.indexOf(parsed.exactText, start + parsed.exactText.length)
      }
    }
  }

  if (parsed.fullText !== undefined) {
    const contentHash = manuscriptProjectionHash(manuscripts)
    const cached = parsed.revision === project.acceptedRevision
      ? indexes.get(workspaceId)
      : undefined
    const index = cached?.revision === parsed.revision && cached.contentHash === contentHash
      ? cached.index
      : buildLocalChineseManuscriptIndex(manuscripts)
    const manuscriptsById = new Map(manuscripts.map(projected => [
      projected.manuscript.unitId,
      projected,
    ] as const))
    for (const match of searchLocalChineseIndex(index, parsed.fullText)) {
      if (parsed.unitId !== undefined && match.unitId !== parsed.unitId) continue
      const projected = manuscriptsById.get(match.unitId)
      if (projected === undefined) continue
      const { manuscript } = projected
      const manuscriptHash = createHash('sha256').update(manuscript.text).digest('hex')
      hits.push({
        method: 'full-text',
        kind: 'manuscript',
        provider: LOCAL_CHINESE_RETRIEVAL_PROVIDER,
        sourceRevision: projected.sourceRevision,
        sourceRanges: fullTextSourceRanges(
          manuscript.unitId,
          manuscript.text,
          manuscriptHash,
          match.terms,
        ),
        provenance: projected.provenance,
        manuscript: {
          unitId: manuscript.unitId,
          title: manuscript.title,
        },
        score: match.score,
        terms: match.terms,
      })
    }
  }

  const projectedGraph = parsed.graph === true || parsed.impactEventId !== undefined
    ? memory.projectGraph(ctx.novelProject.readSnapshot(workspaceId, parsed.revision), canon, narrative, project.acceptedRevision)
    : undefined
  const impact = parsed.impactEventId === undefined
    ? undefined
    : memory.traceCausalImpact(projectedGraph!, parsed.impactEventId)
  const graph = parsed.graph === true ? projectedGraph : undefined

  return deepFreeze({
    projectId: project.id,
    workspaceId: project.workspaceId,
    revision: parsed.revision,
    headRevision: project.acceptedRevision,
    freshness: parsed.revision === project.acceptedRevision ? 'current' : 'historical',
    hits,
    ...(characterTrajectory === undefined ? {} : { characterTrajectory }),
    ...(clueLifecycle === undefined ? {} : { clueLifecycle }),
    ...(promiseLifecycle === undefined ? {} : { promiseLifecycle }),
    ...(mysteryLifecycle === undefined ? {} : { mysteryLifecycle }),
    ...(progressionLedger === undefined ? {} : { progressionLedger }),
    ...(factionContinuity === undefined ? {} : { factionContinuity }),
    ...(locationContinuity === undefined ? {} : { locationContinuity }),
    ...(objectContinuity === undefined ? {} : { objectContinuity }),
    ...(emotionContinuity === undefined ? {} : { emotionContinuity }),
    ...(knowledgeBoundary === undefined ? {} : { knowledgeBoundary }),
    ...(timeline === undefined ? {} : { timeline }),
    ...(roadmapResolution === undefined ? {} : { roadmapResolution }),
    ...(controlPack === undefined ? {} : { controlPack }),
    ...(writingMemory === undefined ? {} : { writingMemory }),
    ...(closure === undefined ? {} : { closure }),
    ...(impact === undefined ? {} : { impact }),
    ...(revisionImpact === undefined ? {} : { revisionImpact }),
    ...(graph === undefined ? {} : { graph }),
  })
}

/** Start a native owner-bound Job for a disposable index, never a Canon mutation. */
export function rebuildMemoryIndex(ctx: Context, indexes: Map<WorkspaceId, LocalChineseRetrievalIndex>, owner: Agent, workspaceId: WorkspaceId, revision: number): NovelRetrievalRebuildJob {
  const targetRevision = revisionSchema.parse(revision)
  const project = ctx.novelProject.current(workspaceId)
  if (project === undefined) {
    throw new Error(`novel project for Workspace '${workspaceId}' does not exist`)
  }
  if (targetRevision !== project.acceptedRevision) {
    throw new Error(
      `cannot rebuild retrieval index R${String(targetRevision)}; current accepted revision is R${String(project.acceptedRevision)}`,
    )
  }
  const manuscripts = ctx.novelWriting.readManuscripts(workspaceId, targetRevision)
  const jobs = ctx.get('jobs')
  if (jobs === undefined) {
    throw new Error('retrieval index rebuild requires the DSH jobs service')
  }
  const sourceHash = manuscriptProjectionHash(manuscripts)
  const jobId = jobs.start({
    kind: 'novel-index',
    label: `Rebuild novel retrieval index R${String(targetRevision)}`,
    owner,
    run: () => deferredRetrievalIndexBuild({
      build: () => {
        const current = ctx.novelProject.current(workspaceId)
        if (current?.acceptedRevision !== targetRevision) {
          return `skipped stale revision R${String(targetRevision)}`
        }
        const currentManuscripts = ctx.novelWriting.readManuscripts(workspaceId, targetRevision)
        const currentHash = manuscriptProjectionHash(currentManuscripts)
        if (currentHash !== sourceHash) {
          return `skipped changed revision R${String(targetRevision)}`
        }
        indexes.set(workspaceId, {
          projectId: project.id,
          revision: targetRevision,
          contentHash: sourceHash,
          index: buildLocalChineseManuscriptIndex(currentManuscripts),
        })
        return `indexed accepted revision R${String(targetRevision)}`
      },
    }),
  })
  return deepFreeze({ jobId, revision: targetRevision })
}

const novelCanonValueSchema: z.ZodType<NovelCanonValue> = z.json()

const revisionSchema = z.number().int().nonnegative()

const novelStoryEventValueSchema: z.ZodType<NovelStoryEventValue> = z.object({
  storyTime: z.object({
    startOrder: z.number(),
    endOrder: z.number().optional(),
    label: z.string().min(1),
  }).strict(),
  manuscriptOrder: z.number().int().nonnegative(),
  participants: z.array(z.string().min(1)).min(1),
  location: z.string().min(1),
  effects: z.array(novelCanonValueSchema),
}).strict()

const novelEmotionEpisodeValueSchema: z.ZodType<NovelEmotionEpisodeValue> = z.object({
  characterId: z.string().min(1),
  eventId: z.string().min(1),
  storyOrder: z.number(),
  trigger: z.string().min(1),
  object: z.string().min(1),
  appraisal: z.string().min(1),
  emotions: z.array(z.object({
    label: z.string().min(1),
    intensity: z.number().min(0).max(1),
  }).strict()).min(1),
  bodilyExpression: z.string().min(1),
  actionTendency: z.string().min(1),
  expression: z.string().min(1),
  suppression: z.string().min(1),
  coping: z.string().min(1),
  residue: z.string().min(1),
  reactivatesEpisodeIds: z.array(z.string().min(1)),
  downstreamChoices: z.array(z.string().min(1)),
}).strict()

const novelProgressionAdvancementValueSchema: z.ZodType<NovelProgressionAdvancementValue> = z.object({
  characterId: z.string().min(1),
  eventId: z.string().min(1),
  storyOrder: z.number(),
  dimension: z.string().min(1),
  priorLimitation: z.string().min(1),
  setup: z.string().min(1),
  evidence: z.array(z.string().min(1)).min(1),
  enablingAction: z.string().min(1),
  resourceOrSacrifice: z.string().min(1),
  newCapability: z.string().min(1),
  remainingLimit: z.string().min(1),
  counter: z.string().min(1),
  socialInterpretation: z.string().min(1),
  downstreamConsequence: z.string().min(1),
}).strict()

const novelFactionContinuityValueSchema: z.ZodType<NovelFactionContinuityValue> = z.object({
  factionId: z.string().min(1),
  eventId: z.string().min(1),
  storyOrder: z.number(),
  goal: z.string().min(1),
  resources: z.array(z.string().min(1)).min(1),
  constraints: z.array(z.string().min(1)).min(1),
  currentAction: z.string().min(1),
  membershipOrAllianceChange: z.string().min(1),
  offscreenConsequence: z.string().min(1),
}).strict()

const novelLocationContinuityValueSchema: z.ZodType<NovelLocationContinuityValue> = z.object({
  locationId: z.string().min(1),
  eventId: z.string().min(1),
  storyOrder: z.number(),
  parentLocationId: z.string().min(1).nullable(),
  scale: z.string().min(1),
  accessConditions: z.array(z.string().min(1)),
  governingFactionIds: z.array(z.string().min(1)),
  activeRuleIds: z.array(z.string().min(1)),
  resourceFlows: z.array(z.string().min(1)),
  travelLinks: z.array(z.object({
    destinationLocationId: z.string().min(1),
    travelTime: z.string().min(1),
    accessConditions: z.array(z.string().min(1)),
    status: z.string().min(1),
  }).strict()),
  currentChange: z.string().min(1),
  consequence: z.string().min(1),
}).strict()

const novelObjectContinuityValueSchema: z.ZodType<NovelObjectContinuityValue> = z.object({
  objectId: z.string().min(1),
  eventId: z.string().min(1),
  storyOrder: z.number(),
  holderId: z.string().min(1).nullable(),
  locationId: z.string().min(1).nullable(),
  quantity: z.number(),
  condition: z.string().min(1),
  status: z.string().min(1),
  currentChange: z.string().min(1),
  consequence: z.string().min(1),
}).strict()

const novelEndingHypothesisValueSchema: z.ZodType<NovelEndingHypothesisValue> = z.object({
  scopeUnitId: z.string().min(1),
  version: z.number().int().positive(),
  endingTarget: z.string().min(1),
  decisiveConflict: z.string().min(1),
  protagonistChoice: z.string().min(1),
  thematicReturn: z.string().min(1),
  desiredEmotionalAfterimage: z.string().min(1),
  resolutionMode: z.enum([
    'closure',
    'transformation',
    'deliberate-openness',
    'tragic-failure',
    'sequel-transfer',
  ]),
  finalStates: z.array(z.object({
    kind: z.enum([
      'character',
      'relationship',
      'world',
      'progression',
      'mystery',
      'promise',
      'other',
    ]),
    subjectId: z.string().min(1),
    state: z.string().min(1),
  }).strict()).min(1),
  aftermath: z.string().min(1),
  deliberatelyUnresolvedDebts: z.array(z.object({
    clock: z.enum(NARRATIVE_CLOCKS),
    id: z.string().min(1),
  }).strict()),
  epiloguePurpose: z.string().min(1).nullable(),
}).strict()

export const novelRetrievalQuerySchema = z.object({
  revision: revisionSchema,
  compareRevision: revisionSchema.optional(),
  canonKind: z.enum(CANON_FACT_KINDS).optional(),
  canonTargetId: z.string().min(1).optional(),
  characterTrajectoryId: z.string().min(1).optional(),
  clueLifecycleId: z.string().min(1).optional(),
  promiseLifecycleId: z.string().min(1).optional(),
  mysteryLifecycleId: z.string().min(1).optional(),
  progressionCharacterId: z.string().min(1).optional(),
  factionId: z.string().min(1).optional(),
  locationId: z.string().min(1).optional(),
  objectId: z.string().min(1).optional(),
  emotionCharacterId: z.string().min(1).optional(),
  knowledgeSubjectId: z.string().min(1).optional(),
  timelineParticipantId: z.string().min(1).optional(),
  narrativeLevel: z.enum(NARRATIVE_LEVELS).optional(),
  narrativeUnitId: z.string().min(1).optional(),
  narrativeClock: z.enum(NARRATIVE_CLOCKS).optional(),
  unitId: z.string().min(1).optional(),
  chapterId: z.string().min(1).optional(),
  closureScopeId: z.string().min(1).optional(),
  remainingChapterBudget: z.number().int().positive().optional(),
  exactText: z.string().min(1).optional(),
  fullText: z.string().min(1).optional(),
  writingMemoryQuery: z.string().min(1).optional(),
  impactEventId: z.string().min(1).optional(),
  graph: z.boolean().optional(),
}).strict()

function retrievalSourceRanges(
  project: MemoryProjectionContext,
  sourceRevision: number,
  sourceAnchorIds: readonly string[],
): NovelRetrievalSourceRange[] {
  const revision = project.revisionAt(sourceRevision)
  const anchors = new Map(revision.sourceAnchors.map(anchor => [anchor.id, anchor] as const))
  return sourceAnchorIds.map(anchorId => {
    const anchor = anchors.get(anchorId)
    if (anchor === undefined) {
      throw new Error(
        `retrieval source anchor '${anchorId}' is missing from revision ${String(sourceRevision)}`,
      )
    }
    return {
      anchorId: anchor.id,
      sourceId: anchor.sourceId,
      start: anchor.start,
      end: anchor.end,
      contentHash: anchor.contentHash,
    }
  })
}

function buildNovelRollingRoadmapResolution(
  project: MemoryProjectionContext,
  canon: NovelCanonProjection,
  narrative: NovelNarrativeProjection,
  roadmapId: string,
): NovelRollingRoadmapResolution | undefined {
  const fact = canon.facts.find(candidate => (
    candidate.kind === 'roadmap'
    && candidate.targetId === roadmapId
    && candidate.field === 'plan'
  ))
  if (fact === undefined) return undefined

  const value = fact.value as NovelRollingRoadmapPlanValue
  const unitsById = new Map<string, NovelRollingRoadmapPlanValue['units'][number][]>()
  for (const unit of value.units) {
    const candidates = unitsById.get(unit.unitId)
    if (candidates === undefined) unitsById.set(unit.unitId, [unit])
    else candidates.push(unit)
  }

  type DebtCandidate = NovelRollingRoadmapResolution['orderedUnits'][number]['scopedDebtIds']['resolved'][number]
  const debtsById = new Map<string, DebtCandidate[]>()
  for (const bucket of narrative.clocks) {
    for (const debt of bucket.debts) {
      const candidate = {
        debtId: debt.id,
        debt,
        sourceRanges: retrievalSourceRanges(project, debt.sourceRevision, debt.sourceAnchorIds),
      }
      const candidates = debtsById.get(debt.id)
      if (candidates === undefined) debtsById.set(debt.id, [candidate])
      else candidates.push(candidate)
    }
  }

  const orderedUnits = value.units.map((unit, declarationIndex) => {
    const resolvedUnitIds: {
      unitId: string
      unit: NovelRollingRoadmapPlanValue['units'][number]
    }[] = []
    const missingUnitIds: string[] = []
    const ambiguousUnitIds: {
      unitId: string
      candidates: readonly NovelRollingRoadmapPlanValue['units'][number][]
    }[] = []
    for (const unitId of unit.dependsOnUnitIds) {
      const candidates = unitsById.get(unitId) ?? []
      if (candidates.length === 0) missingUnitIds.push(unitId)
      else if (candidates.length === 1) {
        resolvedUnitIds.push({ unitId, unit: candidates[0]! })
      } else ambiguousUnitIds.push({ unitId, candidates })
    }

    const resolvedDebtIds: DebtCandidate[] = []
    const missingDebtIds: string[] = []
    const ambiguousDebtIds: Array<
      NovelRollingRoadmapResolution['orderedUnits'][number]['scopedDebtIds']['ambiguous'][number]
    > = []
    for (const debtId of unit.scopedDebtIds) {
      const candidates = debtsById.get(debtId) ?? []
      if (candidates.length === 0) missingDebtIds.push(debtId)
      else if (candidates.length === 1) resolvedDebtIds.push(candidates[0]!)
      else {
        ambiguousDebtIds.push({
          debtId,
          candidates: candidates.map(candidate => ({
            debt: candidate.debt,
            sourceRanges: candidate.sourceRanges,
          })),
        })
      }
    }

    return {
      declarationIndex,
      resolution: {
        unit,
        dependsOnUnitIds: {
          resolved: resolvedUnitIds,
          missing: missingUnitIds,
          ambiguous: ambiguousUnitIds,
        },
        scopedDebtIds: {
          resolved: resolvedDebtIds,
          missing: missingDebtIds,
          ambiguous: ambiguousDebtIds,
        },
      },
    }
  }).sort((left, right) => (
    left.resolution.unit.order - right.resolution.unit.order
    || left.declarationIndex - right.declarationIndex
  )).map(projected => projected.resolution)

  return {
    roadmapId,
    value,
    sourceRevision: fact.sourceRevision,
    sourceDeltaId: fact.sourceDeltaId,
    sourceAnchorIds: fact.sourceAnchorIds,
    sourceRanges: retrievalSourceRanges(project, fact.sourceRevision, fact.sourceAnchorIds),
    provenance: fact.provenance,
    orderedUnits,
  }
}

function splitNovelGraphRelationTarget(
  targetId: string,
): readonly [string, string] | undefined {
  const separator = targetId.indexOf('->')
  if (separator <= 0 || separator !== targetId.lastIndexOf('->')) return undefined
  const from = targetId.slice(0, separator).trim()
  const to = targetId.slice(separator + 2).trim()
  if (from.length === 0 || to.length === 0) return undefined
  return [from, to]
}

function buildNovelTimelineLedger(
  project: MemoryProjectionContext,
  canon: NovelCanonProjection,
  headRevision: number,
  participantId: string,
): NovelTimelineLedger {
  const events = canon.facts.flatMap((fact) => {
    if (fact.kind !== 'story-event' || fact.field !== 'event') return []
    const parsed = novelStoryEventValueSchema.safeParse(fact.value)
    if (!parsed.success || !parsed.data.participants.includes(participantId)) return []
    return [{
      eventId: fact.targetId,
      event: parsed.data,
      sourceRevision: fact.sourceRevision,
      sourceDeltaId: fact.sourceDeltaId,
      sourceAnchorIds: fact.sourceAnchorIds,
      sourceRanges: retrievalSourceRanges(
        project,
        fact.sourceRevision,
        fact.sourceAnchorIds,
      ),
      provenance: fact.provenance,
    }]
  }).sort((left, right) => (
    left.event.storyTime.startOrder - right.event.storyTime.startOrder
    || left.event.manuscriptOrder - right.event.manuscriptOrder
    || compareText(left.eventId, right.eventId)
  ))
  const locationConflicts: NovelTimelineLedger['locationConflicts'][number][] = []
  for (let firstIndex = 0; firstIndex < events.length; firstIndex += 1) {
    const first = events[firstIndex]!
    const firstEndOrder = first.event.storyTime.endOrder
      ?? first.event.storyTime.startOrder
    for (let secondIndex = firstIndex + 1; secondIndex < events.length; secondIndex += 1) {
      const second = events[secondIndex]!
      if (first.event.location === second.event.location) continue
      const secondEndOrder = second.event.storyTime.endOrder
        ?? second.event.storyTime.startOrder
      const overlapStartOrder = Math.max(
        first.event.storyTime.startOrder,
        second.event.storyTime.startOrder,
      )
      const overlapEndOrder = Math.min(firstEndOrder, secondEndOrder)
      if (overlapStartOrder > overlapEndOrder) continue
      locationConflicts.push({
        overlapStartOrder,
        overlapEndOrder,
        first,
        second,
      })
    }
  }

  return deepFreeze({
    participantId,
    revision: canon.revision,
    headRevision,
    freshness: canon.revision === headRevision ? 'current' : 'historical',
    events,
    locationConflicts,
  })
}

function buildNovelProgressionLedger(
  project: MemoryProjectionContext,
  canon: NovelCanonProjection,
  headRevision: number,
  characterId: string,
): NovelProgressionLedger {
  const advancements = canon.facts.flatMap((fact) => {
    if (fact.kind !== 'progression' || fact.field !== 'advancement') return []
    const parsed = novelProgressionAdvancementValueSchema.safeParse(fact.value)
    if (!parsed.success || parsed.data.characterId !== characterId) return []
    return [{
      advancementId: fact.targetId,
      advancement: parsed.data,
      sourceRevision: fact.sourceRevision,
      sourceDeltaId: fact.sourceDeltaId,
      sourceAnchorIds: fact.sourceAnchorIds,
      sourceRanges: retrievalSourceRanges(
        project,
        fact.sourceRevision,
        fact.sourceAnchorIds,
      ),
      provenance: fact.provenance,
    }]
  }).sort((left, right) => (
    left.advancement.storyOrder - right.advancement.storyOrder
    || compareText(left.advancement.eventId, right.advancement.eventId)
    || compareText(left.advancementId, right.advancementId)
  ))

  return deepFreeze({
    characterId,
    revision: canon.revision,
    headRevision,
    freshness: canon.revision === headRevision ? 'current' : 'historical',
    advancements,
  })
}

function buildNovelFactionContinuityLedger(
  project: MemoryProjectionContext,
  canon: NovelCanonProjection,
  headRevision: number,
  factionId: string,
): NovelFactionContinuityLedger {
  const entries = canon.facts.flatMap((fact) => {
    if (fact.kind !== 'faction-state' || fact.field !== 'continuity') return []
    const parsed = novelFactionContinuityValueSchema.safeParse(fact.value)
    if (!parsed.success || parsed.data.factionId !== factionId) return []
    return [{
      entryId: fact.targetId,
      continuity: parsed.data,
      sourceRevision: fact.sourceRevision,
      sourceDeltaId: fact.sourceDeltaId,
      sourceAnchorIds: fact.sourceAnchorIds,
      sourceRanges: retrievalSourceRanges(
        project,
        fact.sourceRevision,
        fact.sourceAnchorIds,
      ),
      provenance: fact.provenance,
    }]
  }).sort((left, right) => (
    left.continuity.storyOrder - right.continuity.storyOrder
    || compareText(left.continuity.eventId, right.continuity.eventId)
    || compareText(left.entryId, right.entryId)
  ))

  return deepFreeze({
    factionId,
    revision: canon.revision,
    headRevision,
    freshness: canon.revision === headRevision ? 'current' : 'historical',
    entries,
  })
}

function buildNovelLocationContinuityLedger(
  project: MemoryProjectionContext,
  canon: NovelCanonProjection,
  headRevision: number,
  locationId: string,
): NovelLocationContinuityLedger {
  const entries = canon.facts.flatMap((fact) => {
    if (fact.kind !== 'location-state' || fact.field !== 'continuity') return []
    const parsed = novelLocationContinuityValueSchema.safeParse(fact.value)
    if (!parsed.success || parsed.data.locationId !== locationId) return []
    return [{
      entryId: fact.targetId,
      continuity: parsed.data,
      sourceRevision: fact.sourceRevision,
      sourceDeltaId: fact.sourceDeltaId,
      sourceAnchorIds: fact.sourceAnchorIds,
      sourceRanges: retrievalSourceRanges(
        project,
        fact.sourceRevision,
        fact.sourceAnchorIds,
      ),
      provenance: fact.provenance,
    }]
  }).sort((left, right) => (
    left.continuity.storyOrder - right.continuity.storyOrder
    || compareText(left.continuity.eventId, right.continuity.eventId)
    || compareText(left.entryId, right.entryId)
  ))

  return deepFreeze({
    locationId,
    revision: canon.revision,
    headRevision,
    freshness: canon.revision === headRevision ? 'current' : 'historical',
    entries,
  })
}

function buildNovelObjectContinuityLedger(
  project: MemoryProjectionContext,
  canon: NovelCanonProjection,
  headRevision: number,
  objectId: string,
): NovelObjectContinuityLedger {
  const entries = canon.facts.flatMap((fact) => {
    if (fact.kind !== 'object-state' || fact.field !== 'continuity') return []
    const parsed = novelObjectContinuityValueSchema.safeParse(fact.value)
    if (!parsed.success || parsed.data.objectId !== objectId) return []
    return [{
      entryId: fact.targetId,
      continuity: parsed.data,
      sourceRevision: fact.sourceRevision,
      sourceDeltaId: fact.sourceDeltaId,
      sourceAnchorIds: fact.sourceAnchorIds,
      sourceRanges: retrievalSourceRanges(
        project,
        fact.sourceRevision,
        fact.sourceAnchorIds,
      ),
      provenance: fact.provenance,
    }]
  }).sort((left, right) => (
    left.continuity.storyOrder - right.continuity.storyOrder
    || compareText(left.continuity.eventId, right.continuity.eventId)
    || compareText(left.entryId, right.entryId)
  ))

  return deepFreeze({
    objectId,
    revision: canon.revision,
    headRevision,
    freshness: canon.revision === headRevision ? 'current' : 'historical',
    entries,
  })
}

function buildNovelEmotionContinuityLedger(
  project: MemoryProjectionContext,
  canon: NovelCanonProjection,
  headRevision: number,
  characterId: string,
): NovelEmotionContinuityLedger {
  const episodes = canon.facts.flatMap((fact) => {
    if (fact.kind !== 'emotion-state' || fact.field !== 'episode') return []
    const parsed = novelEmotionEpisodeValueSchema.safeParse(fact.value)
    if (!parsed.success || parsed.data.characterId !== characterId) return []
    return [{
      episodeId: fact.targetId,
      episode: parsed.data,
      sourceRevision: fact.sourceRevision,
      sourceDeltaId: fact.sourceDeltaId,
      sourceAnchorIds: fact.sourceAnchorIds,
      sourceRanges: retrievalSourceRanges(
        project,
        fact.sourceRevision,
        fact.sourceAnchorIds,
      ),
      provenance: fact.provenance,
    }]
  }).sort((left, right) => (
    left.episode.storyOrder - right.episode.storyOrder
    || compareText(left.episode.eventId, right.episode.eventId)
    || compareText(left.episodeId, right.episodeId)
  ))

  return deepFreeze({
    characterId,
    revision: canon.revision,
    headRevision,
    freshness: canon.revision === headRevision ? 'current' : 'historical',
    episodes,
  })
}

function buildNovelCharacterTrajectory(
  project: MemoryProjectionContext,
  targetRevision: number,
  headRevision: number,
  characterId: string,
): NovelCharacterTrajectory {
  const sourceField = (fact: NovelCanonFact): NovelCharacterTrajectoryField => ({
    fact,
    sourceRanges: retrievalSourceRanges(
      project,
      fact.sourceRevision,
      fact.sourceAnchorIds,
    ),
  })
  const entries: NovelCharacterTrajectory['entries'][number][] = []
  let previous = new Map<string, NovelCanonFact>()

  for (let revision = 1; revision <= targetRevision; revision += 1) {
    const accepted = project.revisionAt(revision)
    const fields = project.canonAt(revision).facts
      .filter(fact => fact.kind === 'character-state' && fact.targetId === characterId)
      .sort((left, right) => compareText(left.field, right.field))
    const current = new Map(fields.map(fact => [fact.field, fact] as const))
    const changedFields = [...new Set([...previous.keys(), ...current.keys()])]
      .sort(compareText)
      .filter((field) => {
        const before = previous.get(field)
        const after = current.get(field)
        return JSON.stringify(before) !== JSON.stringify(after)
      })
    if (changedFields.length > 0) {
      entries.push({
        revision,
        packetId: accepted.packetId,
        ...(accepted.rollbackOfRevision === undefined
          ? {}
          : { rollbackOfRevision: accepted.rollbackOfRevision }),
        provenance: accepted.provenance,
        fields: fields.map(sourceField),
        changes: changedFields.map((field) => {
          const before = previous.get(field)
          const after = current.get(field)
          const acceptedDelta = accepted.rollbackOfRevision === undefined
            ? [...accepted.deltas].reverse().find((delta): delta is CanonFactDelta => (
                delta.kind === 'character-state'
                && delta.targetId === characterId
                && delta.field === field
              ))
            : undefined
          return {
            field,
            ...(before === undefined ? {} : { before: sourceField(before) }),
            ...(after === undefined ? {} : { after: sourceField(after) }),
            ...(acceptedDelta === undefined ? {} : { acceptedDelta }),
            acceptedDeltaSourceRanges: acceptedDelta === undefined
              ? []
              : retrievalSourceRanges(
                  project,
                  accepted.revision,
                  acceptedDelta.sourceAnchorIds,
                ),
          }
        }),
      })
    }
    previous = current
  }

  return deepFreeze({
    characterId,
    revision: targetRevision,
    headRevision,
    freshness: targetRevision === headRevision ? 'current' : 'historical',
    entries,
  })
}

function buildNovelClueLifecycle(
  project: MemoryProjectionContext,
  targetRevision: number,
  headRevision: number,
  clueId: string,
): NovelClueLifecycle {
  const sourceField = (fact: NovelCanonFact): NovelClueLifecycleField => ({
    fact,
    sourceRanges: retrievalSourceRanges(
      project,
      fact.sourceRevision,
      fact.sourceAnchorIds,
    ),
  })
  const entries: NovelClueLifecycle['entries'][number][] = []
  let previous = new Map<string, NovelCanonFact>()

  for (let revision = 1; revision <= targetRevision; revision += 1) {
    const accepted = project.revisionAt(revision)
    const fields = project.canonAt(revision).facts
      .filter(fact => fact.kind === 'clue' && fact.targetId === clueId)
      .sort((left, right) => compareText(left.field, right.field))
    const current = new Map(fields.map(fact => [fact.field, fact] as const))
    const changedFields = [...new Set([...previous.keys(), ...current.keys()])]
      .sort(compareText)
      .filter((field) => {
        const before = previous.get(field)
        const after = current.get(field)
        return JSON.stringify(before) !== JSON.stringify(after)
      })
    if (changedFields.length > 0) {
      entries.push({
        revision,
        packetId: accepted.packetId,
        ...(accepted.rollbackOfRevision === undefined
          ? {}
          : { rollbackOfRevision: accepted.rollbackOfRevision }),
        provenance: accepted.provenance,
        fields: fields.map(sourceField),
        changes: changedFields.map((field) => {
          const before = previous.get(field)
          const after = current.get(field)
          const acceptedDelta = accepted.rollbackOfRevision === undefined
            ? [...accepted.deltas].reverse().find((delta): delta is CanonFactDelta => (
                delta.kind === 'clue'
                && delta.targetId === clueId
                && delta.field === field
              ))
            : undefined
          return {
            field,
            ...(before === undefined ? {} : { before: sourceField(before) }),
            ...(after === undefined ? {} : { after: sourceField(after) }),
            ...(acceptedDelta === undefined ? {} : { acceptedDelta }),
            acceptedDeltaSourceRanges: acceptedDelta === undefined
              ? []
              : retrievalSourceRanges(
                  project,
                  accepted.revision,
                  acceptedDelta.sourceAnchorIds,
                ),
          }
        }),
      })
    }
    previous = current
  }

  return deepFreeze({
    clueId,
    revision: targetRevision,
    headRevision,
    freshness: targetRevision === headRevision ? 'current' : 'historical',
    entries,
  })
}

function buildNovelPromiseLifecycle(
  project: MemoryProjectionContext,
  targetRevision: number,
  headRevision: number,
  promiseId: string,
): NovelPromiseLifecycle {
  const sourceField = (fact: NovelCanonFact): NovelPromiseLifecycleField => ({
    fact,
    sourceRanges: retrievalSourceRanges(
      project,
      fact.sourceRevision,
      fact.sourceAnchorIds,
    ),
  })
  const entries: NovelPromiseLifecycle['entries'][number][] = []
  let previous = new Map<string, NovelCanonFact>()

  for (let revision = 1; revision <= targetRevision; revision += 1) {
    const accepted = project.revisionAt(revision)
    const fields = project.canonAt(revision).facts
      .filter(fact => fact.kind === 'promise' && fact.targetId === promiseId)
      .sort((left, right) => compareText(left.field, right.field))
    const current = new Map(fields.map(fact => [fact.field, fact] as const))
    const changedFields = [...new Set([...previous.keys(), ...current.keys()])]
      .sort(compareText)
      .filter((field) => {
        const before = previous.get(field)
        const after = current.get(field)
        return JSON.stringify(before) !== JSON.stringify(after)
      })
    if (changedFields.length > 0) {
      entries.push({
        revision,
        packetId: accepted.packetId,
        ...(accepted.rollbackOfRevision === undefined
          ? {}
          : { rollbackOfRevision: accepted.rollbackOfRevision }),
        provenance: accepted.provenance,
        fields: fields.map(sourceField),
        changes: changedFields.map((field) => {
          const before = previous.get(field)
          const after = current.get(field)
          const acceptedDelta = accepted.rollbackOfRevision === undefined
            ? [...accepted.deltas].reverse().find((delta): delta is CanonFactDelta => (
                delta.kind === 'promise'
                && delta.targetId === promiseId
                && delta.field === field
              ))
            : undefined
          return {
            field,
            ...(before === undefined ? {} : { before: sourceField(before) }),
            ...(after === undefined ? {} : { after: sourceField(after) }),
            ...(acceptedDelta === undefined ? {} : { acceptedDelta }),
            acceptedDeltaSourceRanges: acceptedDelta === undefined
              ? []
              : retrievalSourceRanges(
                  project,
                  accepted.revision,
                  acceptedDelta.sourceAnchorIds,
                ),
          }
        }),
      })
    }
    previous = current
  }

  return deepFreeze({
    promiseId,
    revision: targetRevision,
    headRevision,
    freshness: targetRevision === headRevision ? 'current' : 'historical',
    entries,
  })
}

function buildNovelMysteryLifecycle(
  project: MemoryProjectionContext,
  targetRevision: number,
  headRevision: number,
  mysteryId: string,
): NovelMysteryLifecycle {
  const sourceField = (fact: NovelCanonFact): NovelMysteryLifecycleField => ({
    fact,
    sourceRanges: retrievalSourceRanges(
      project,
      fact.sourceRevision,
      fact.sourceAnchorIds,
    ),
  })
  const entries: NovelMysteryLifecycle['entries'][number][] = []
  let previous: NovelCanonFact | undefined
  let previousLinkedClueEvidence: readonly NovelMysteryLinkedClueEvidence[] = []

  for (let revision = 1; revision <= targetRevision; revision += 1) {
    const accepted = project.revisionAt(revision)
    const canon = project.canonAt(revision)
    const current = canon.facts.find(fact => (
      fact.kind === 'mystery'
      && fact.targetId === mysteryId
      && fact.field === 'state'
    ))
    const linkedClueEvidence = canon.facts.flatMap((fact): NovelMysteryLinkedClueEvidence[] => {
      if (fact.kind !== 'clue' || fact.field !== 'state') return []
      const value = fact.value as NovelClueStateValue
      if (!value.linkedMysteryIds.includes(mysteryId)) return []
      return [{
        clueId: fact.targetId,
        value,
        sourceRevision: fact.sourceRevision,
        sourceDeltaId: fact.sourceDeltaId,
        sourceAnchorIds: fact.sourceAnchorIds,
        sourceRanges: retrievalSourceRanges(
          project,
          fact.sourceRevision,
          fact.sourceAnchorIds,
        ),
        provenance: fact.provenance,
      }]
    })
    const stateChanged = JSON.stringify(previous) !== JSON.stringify(current)
    const linkedClueEvidenceChanged = JSON.stringify(previousLinkedClueEvidence)
      !== JSON.stringify(linkedClueEvidence)
    if (stateChanged || linkedClueEvidenceChanged) {
      const acceptedDelta = accepted.rollbackOfRevision === undefined
        ? [...accepted.deltas].reverse().find((delta): delta is CanonFactDelta => (
            delta.kind === 'mystery'
            && delta.targetId === mysteryId
            && delta.field === 'state'
          ))
        : undefined
      entries.push({
        revision,
        packetId: accepted.packetId,
        ...(accepted.rollbackOfRevision === undefined
          ? {}
          : { rollbackOfRevision: accepted.rollbackOfRevision }),
        provenance: accepted.provenance,
        fields: current === undefined ? [] : [sourceField(current)],
        changes: stateChanged
          ? [{
              field: 'state',
              ...(previous === undefined ? {} : { before: sourceField(previous) }),
              ...(current === undefined ? {} : { after: sourceField(current) }),
              ...(acceptedDelta === undefined ? {} : { acceptedDelta }),
              acceptedDeltaSourceRanges: acceptedDelta === undefined
                ? []
                : retrievalSourceRanges(
                    project,
                    accepted.revision,
                    acceptedDelta.sourceAnchorIds,
                  ),
            }]
          : [],
        linkedClueEvidence,
      })
    }
    previous = current
    previousLinkedClueEvidence = linkedClueEvidence
  }

  return deepFreeze({
    mysteryId,
    revision: targetRevision,
    headRevision,
    freshness: targetRevision === headRevision ? 'current' : 'historical',
    entries,
  })
}

function manuscriptProjectionHash(manuscripts: readonly NovelManuscriptProjection[]): string {
  return createHash('sha256').update(JSON.stringify(manuscripts.map(({ manuscript }) => [
    manuscript.unitId,
    manuscript.text,
  ]))).digest('hex')
}

const LOCAL_CHINESE_RETRIEVAL_PROVIDER = 'local-chinese'

const chineseSegmenter = Jieba.withDict(dict)

const searchableTermPattern = /[\p{L}\p{N}]/u

interface LocalChineseSearchDocument {
  readonly id: string
  readonly text: string
}

export interface LocalChineseRetrievalIndex {
  readonly projectId: string
  readonly revision: number
  readonly contentHash: string
  readonly index: MiniSearch<LocalChineseSearchDocument>
}

interface LocalChineseSearchMatch {
  readonly unitId: string
  readonly score: number
  readonly terms: readonly string[]
}

function buildLocalChineseManuscriptIndex(
  manuscripts: readonly NovelManuscriptProjection[],
): MiniSearch<LocalChineseSearchDocument> {
  const index = new MiniSearch<LocalChineseSearchDocument>({
    fields: ['text'],
    tokenize: tokenizeChinese,
  })
  for (const { manuscript } of manuscripts) {
    index.add({ id: manuscript.unitId, text: manuscript.text })
  }
  return index
}

function searchLocalChineseIndex(
  index: MiniSearch<LocalChineseSearchDocument>,
  query: string,
): LocalChineseSearchMatch[] {
  return index.search(query, { combineWith: 'AND' }).map(result => ({
    unitId: String(result.id),
    score: result.score,
    terms: [...new Set(result.terms)].sort((left, right) => left.localeCompare(right, 'zh-CN')),
  }))
}

function deferredRetrievalIndexBuild(
  operation: { readonly build: () => string },
): { readonly cancel: (reason?: string) => void; readonly done: Promise<JobOutcome> } {
  let resolveDone!: (outcome: JobOutcome) => void
  let settled = false
  const done = new Promise<JobOutcome>((resolve) => { resolveDone = resolve })
  const settle = (outcome: JobOutcome): void => {
    if (settled) return
    settled = true
    resolveDone(outcome)
  }
  const immediate = setImmediate(() => {
    try {
      settle({ status: 'completed', detail: operation.build() })
    } catch (error) {
      settle({ status: 'failed', detail: String(error) })
    }
  })
  return {
    cancel: (reason) => {
      clearImmediate(immediate)
      settle({ status: 'killed', detail: reason ?? 'cancelled' })
    },
    done,
  }
}

function tokenizeChinese(text: string): string[] {
  return chineseSegmenter.cutForSearch(text, true)
    .map(term => term.trim().toLocaleLowerCase('zh-CN'))
    .filter(term => term.length > 0 && searchableTermPattern.test(term))
}

function fullTextSourceRanges(
  sourceId: string,
  text: string,
  contentHash: string,
  terms: readonly string[],
): NovelRetrievalSourceRange[] {
  const ranges: NovelRetrievalSourceRange[] = []
  for (const term of terms) {
    let start = text.indexOf(term)
    while (start !== -1) {
      ranges.push({
        sourceId,
        start,
        end: start + term.length,
        contentHash,
      })
      start = text.indexOf(term, start + term.length)
    }
  }
  return ranges.sort((left, right) => left.start - right.start || left.end - right.end)
}

const WRITING_MEMORY_BUCKET_LIMIT = 3

const WRITING_MEMORY_EXCERPT_LENGTH = 320

const WRITING_MEMORY_SETTING_KINDS = new Set<NovelCanonFact['kind']>([
  'world',
  'faction-state',
  'location-state',
  'object-state',
])

const WRITING_MEMORY_CONTINUITY_KINDS = new Set<NovelCanonFact['kind']>([
  'story-event',
  'character-state',
  'emotion-state',
  'progression',
  'relationship',
  'knowledge',
  'promise',
  'clue',
  'mystery',
  'ending',
  'timeline',
])

interface LocalWritingMemoryCandidate<T> {
  readonly id: string
  readonly text: string
  readonly value: T
}

interface LocalWritingMemoryMatch<T> {
  readonly id: string
  readonly value: T
  readonly score: number
  readonly terms: readonly string[]
}

function rankWritingMemoryCandidates<T>(
  query: string,
  candidates: readonly LocalWritingMemoryCandidate<T>[],
): LocalWritingMemoryMatch<T>[] {
  if (candidates.length === 0) return []
  const index = new MiniSearch<LocalChineseSearchDocument>({
    fields: ['text'],
    tokenize: tokenizeChinese,
  })
  index.addAll(candidates.map(candidate => ({ id: candidate.id, text: candidate.text })))
  const candidatesById = new Map(candidates.map(candidate => [candidate.id, candidate] as const))
  return index.search(query, { combineWith: 'OR' })
    .flatMap((result) => {
      const candidate = candidatesById.get(String(result.id))
      if (candidate === undefined) return []
      return [{
        id: candidate.id,
        value: candidate.value,
        score: result.score,
        terms: [...new Set(result.terms)].sort(compareText),
      }]
    })
    .sort((left, right) => right.score - left.score || compareText(left.id, right.id))
    .slice(0, WRITING_MEMORY_BUCKET_LIMIT)
}

function writingMemorySearchText(...parts: readonly unknown[]): string {
  return parts.map(part => typeof part === 'string' ? part : JSON.stringify(part)).join(' ')
}

function writingMemoryExcerpt(
  text: string,
  sourceRanges: readonly NovelRetrievalSourceRange[],
): string {
  const firstMatchStart = sourceRanges[0]?.start ?? 0
  const start = Math.max(0, firstMatchStart - Math.floor(WRITING_MEMORY_EXCERPT_LENGTH / 3))
  return text.slice(start, start + WRITING_MEMORY_EXCERPT_LENGTH)
}

function writingMemoryAuthoringEvidence(
  project: MemoryProjectionContext,
  fact: NovelCanonFact,
): NovelWritingMemoryAuthoringEvidence[] {
  if (fact.kind === 'creative-profile' && fact.field === 'style-profile') {
    const value = fact.value as NovelCreativeStyleProfileValue
    return value.approvedExemplars.map(exemplar => ({
      kind: 'approved-style-exemplar',
      exemplarId: exemplar.exemplarId,
      sourceUnitId: exemplar.sourceUnitId,
      purpose: exemplar.purpose,
      ...writingMemoryAuthoringEvidenceSource(project, exemplar),
    }))
  }
  if (fact.kind === 'reader-contract' && fact.field === 'contract-profile') {
    const value = fact.value as NovelReaderContractProfileValue
    return value.evidence.map(evidence => ({
      kind: 'reader-contract-evidence',
      evidenceId: evidence.evidenceId,
      sourceUnitId: evidence.sourceUnitId,
      demonstrates: evidence.demonstrates,
      ...writingMemoryAuthoringEvidenceSource(project, evidence),
    }))
  }
  return []
}

function writingMemoryAuthoringEvidenceSource(
  project: MemoryProjectionContext,
  reference: {
    readonly sourceUnitId: string
    readonly sourceRevision: number
    readonly sourceAnchorIds: readonly string[]
  },
): Pick<
  NovelWritingMemoryAuthoringEvidence,
  'excerpt' | 'sourceRevision' | 'sourceRanges' | 'provenance'
> {
  const revision = project.revisionAt(reference.sourceRevision)
  const manuscript = project.manuscriptsAt(reference.sourceRevision)
    .find(projected => projected.manuscript.unitId === reference.sourceUnitId)!
  const sourceRanges = retrievalSourceRanges(
    project,
    reference.sourceRevision,
    reference.sourceAnchorIds,
  )
  return {
    excerpt: sourceRanges
      .map(range => manuscript.manuscript.text.slice(range.start, range.end))
      .join('\n'),
    sourceRevision: reference.sourceRevision,
    sourceRanges,
    provenance: revision.provenance,
  }
}

type LocalWritingMemoryContinuitySource =
  | { readonly kind: 'canon-fact'; readonly fact: NovelCanonFact }
  | { readonly kind: 'narrative-clock'; readonly entry: NovelNarrativeClockEntry }

function buildWritingMemoryRecall(
  project: MemoryProjectionContext,
  canon: NovelCanonProjection,
  narrative: NovelNarrativeProjection,
  manuscripts: readonly NovelManuscriptProjection[],
  continuity: NovelWritingContinuity | undefined,
  query: string,
  includeNarrativeUnits: boolean,
): NovelWritingMemoryRecall {
  const characterCarryForward = continuity?.characterCarryForward ?? []
  const characterArcHypotheses = continuity?.characterArcHypotheses ?? []
  const latestReaderDisclosure = continuity?.latestReaderDisclosure ?? null
  const latestChapterOutcome = continuity?.latestChapterOutcome ?? null
  const relationshipCarryForward = continuity?.relationshipCarryForward ?? []
  const knowledgeBoundaries = continuity?.knowledgeBoundaries ?? []
  const manuscriptExcerpts = rankWritingMemoryCandidates(query, manuscripts.map(projected => ({
    id: `manuscript:${projected.manuscript.unitId}`,
    text: writingMemorySearchText(projected.manuscript.title, projected.manuscript.text),
    value: projected,
  }))).map(({ value: projected, score, terms }) => {
    const { manuscript } = projected
    const contentHash = createHash('sha256').update(manuscript.text).digest('hex')
    const sourceRanges = fullTextSourceRanges(manuscript.unitId, manuscript.text, contentHash, terms)
    return {
      unitId: manuscript.unitId,
      title: manuscript.title,
      excerpt: writingMemoryExcerpt(manuscript.text, sourceRanges),
      score,
      terms,
      sourceRevision: projected.sourceRevision,
      sourceRanges,
      provenance: projected.provenance,
    }
  })

  const authoringContracts = [...canon.facts]
    .filter(fact => (
      (fact.kind === 'creative-profile'
        && (fact.field === 'style-profile' || fact.field === 'serialization-profile'))
      || (fact.kind === 'reader-contract' && fact.field === 'contract-profile')
    ))
    .sort(compareCanonFacts)
    .map(fact => ({
      fact,
      evidence: writingMemoryAuthoringEvidence(project, fact),
      sourceRevision: fact.sourceRevision,
      sourceRanges: retrievalSourceRanges(project, fact.sourceRevision, fact.sourceAnchorIds),
      provenance: fact.provenance,
    }))

  const roadmaps = rankWritingMemoryCandidates(query, canon.facts.flatMap(fact => {
    if (fact.kind !== 'roadmap' || fact.field !== 'plan') return []
    const resolution = buildNovelRollingRoadmapResolution(
      project,
      canon,
      narrative,
      fact.targetId,
    )
    if (resolution === undefined) return []
    return [{
      id: `roadmap:${fact.targetId}`,
      text: writingMemorySearchText(
        resolution.roadmapId,
        resolution.value,
        resolution.orderedUnits,
      ),
      value: resolution,
    }]
  })).map(({ value: resolution, score, terms }) => ({
    resolution,
    score,
    terms,
    sourceRevision: resolution.sourceRevision,
    sourceRanges: resolution.sourceRanges,
    provenance: resolution.provenance,
  }))

  const narrativeUnits = includeNarrativeUnits
    ? rankWritingMemoryCandidates(query, narrative.units.map(unit => ({
        id: `narrative:${unit.level}:${unit.id}`,
        text: writingMemorySearchText(
          unit.id,
          unit.level,
          unit.parentId ?? '',
          unit.objective,
          unit.entryState,
          unit.exitState,
          unit.status,
          unit.chapterContract ?? '',
        ),
        value: unit,
      }))).map(({ value: unit, score, terms }) => ({
        unit,
        score,
        terms,
        sourceRevision: unit.sourceRevision,
        sourceRanges: retrievalSourceRanges(project, unit.sourceRevision, unit.sourceAnchorIds),
        provenance: unit.provenance,
      }))
    : []

  const settingFacts = rankWritingMemoryCandidates(query, canon.facts
    .filter(fact => WRITING_MEMORY_SETTING_KINDS.has(fact.kind))
    .map(fact => ({
      id: `setting:${fact.kind}:${fact.targetId}:${fact.field}`,
      text: writingMemorySearchText(fact.kind, fact.targetId, fact.field, fact.value),
      value: fact,
    })))
    .map(({ value: fact, score, terms }) => ({
      fact,
      score,
      terms,
      sourceRevision: fact.sourceRevision,
      sourceRanges: retrievalSourceRanges(project, fact.sourceRevision, fact.sourceAnchorIds),
      provenance: fact.provenance,
    }))

  const continuityCandidates: LocalWritingMemoryCandidate<LocalWritingMemoryContinuitySource>[] = []
  for (const fact of canon.facts) {
    if (!WRITING_MEMORY_CONTINUITY_KINDS.has(fact.kind)
      && !(fact.kind === 'chapter-state' && fact.field === 'post-check')) continue
    continuityCandidates.push({
      id: `continuity:fact:${fact.kind}:${fact.targetId}:${fact.field}`,
      text: writingMemorySearchText(fact.kind, fact.targetId, fact.field, fact.value),
      value: { kind: 'canon-fact', fact },
    })
  }
  for (const bucket of narrative.clocks) {
    for (const entry of bucket.entries) {
      continuityCandidates.push({
        id: `continuity:clock:${entry.clock}:${entry.sourceDeltaId}`,
        text: writingMemorySearchText(
          entry.unitId,
          entry.clock,
          entry.movement,
          entry.state,
          entry.storyTime ?? '',
          entry.scope ?? '',
          entry.lines ?? '',
          entry.tracks ?? '',
          entry.events ?? '',
          entry.ambiguityPolicy ?? '',
          entry.moves ?? '',
          entry.waves ?? '',
          entry.revisionRationale ?? '',
        ),
        value: { kind: 'narrative-clock', entry },
      })
    }
  }
  const continuityHits: NovelWritingMemoryRecall['continuityHits'][number][] = rankWritingMemoryCandidates(
    query,
    continuityCandidates,
  ).map(({ value, score, terms }) => {
    const source = value.kind === 'canon-fact' ? value.fact : value.entry
    const evidence = {
      score,
      terms,
      sourceRevision: source.sourceRevision,
      sourceRanges: retrievalSourceRanges(project, source.sourceRevision, source.sourceAnchorIds),
      provenance: source.provenance,
    }
    return value.kind === 'canon-fact'
      ? { kind: 'canon-fact', fact: value.fact, ...evidence }
      : { kind: 'narrative-clock', entry: value.entry, ...evidence }
  })

  const debtCandidates = narrative.clocks.flatMap(bucket => bucket.debts.map(debt => ({
    id: `debt:${debt.clock}:${debt.id}`,
    text: writingMemorySearchText(
      debt.id,
      debt.unitId,
      debt.clock,
      debt.summary,
      debt.status,
      debt.horizon ?? '',
      debt.dependsOn ?? '',
    ),
    value: debt,
  })))
  const debts = rankWritingMemoryCandidates(query, debtCandidates)
    .map(({ value: debt, score, terms }) => ({
      debt,
      score,
      terms,
      sourceRevision: debt.sourceRevision,
      sourceRanges: retrievalSourceRanges(project, debt.sourceRevision, debt.sourceAnchorIds),
      provenance: debt.provenance,
    }))

  return deepFreeze({
    query,
    characterCarryForward,
    characterArcHypotheses,
    latestReaderDisclosure,
    latestChapterOutcome,
    relationshipCarryForward,
    knowledgeBoundaries,
    authoringContracts,
    roadmaps,
    narrativeUnits,
    manuscriptExcerpts,
    settingFacts,
    continuityHits,
    debts,
  })
}

function buildNovelClosureLedger(
  project: MemoryProjectionContext,
  canon: NovelCanonProjection,
  narrative: NovelNarrativeProjection,
  closureScopeId: string,
  remainingChapterBudget: number,
): NovelClosureLedger {
  const scope = narrative.units.find(unit => unit.id === closureScopeId)
  if (scope === undefined) {
    throw new Error(
      `closure scope '${closureScopeId}' does not exist at accepted revision R${String(narrative.revision)}`,
    )
  }
  if (scope.level !== 'series' && scope.level !== 'book') {
    throw new Error(`closure scope '${closureScopeId}' must be a Series or Book, got ${scope.level}`)
  }

  const endingHypothesisFact = canon.facts.find(fact => (
    fact.kind === 'ending'
    && fact.field === 'hypothesis'
    && fact.targetId === closureScopeId
  ))
  const endingHypothesis: NovelEndingHypothesis | null = endingHypothesisFact === undefined
    ? null
    : (() => {
        const value = novelEndingHypothesisValueSchema.parse(endingHypothesisFact.value)
        if (value.scopeUnitId !== closureScopeId) {
          throw new Error(
            `ending hypothesis '${endingHypothesisFact.sourceDeltaId}' targets scope '${value.scopeUnitId}', expected '${closureScopeId}'`,
          )
        }
        return {
          value,
          sourceRevision: endingHypothesisFact.sourceRevision,
          sourceDeltaId: endingHypothesisFact.sourceDeltaId,
          sourceAnchorIds: endingHypothesisFact.sourceAnchorIds,
          sourceRanges: retrievalSourceRanges(
            project,
            endingHypothesisFact.sourceRevision,
            endingHypothesisFact.sourceAnchorIds,
          ),
          provenance: endingHypothesisFact.provenance,
        }
      })()

  const includedUnitIds = new Set<string>()
  for (const unit of narrative.units) {
    if (unit.id === scope.id || (unit.parentId !== null && includedUnitIds.has(unit.parentId))) {
      includedUnitIds.add(unit.id)
    }
  }
  const unitIds = narrative.units
    .filter(unit => includedUnitIds.has(unit.id))
    .map(unit => unit.id)
  const endingEntries = narrative.clocks
    .find(bucket => bucket.clock === 'ending')!
    .entries
    .filter(entry => includedUnitIds.has(entry.unitId))
  const debts = narrative.clocks.flatMap(bucket =>
    bucket.debts.filter(debt => includedUnitIds.has(debt.unitId)))
  const debtsByReference = new Map(debts.map(debt => [
    narrativeDebtReferenceKey(debt),
    debt,
  ] as const))
  const pending = new Set(debtsByReference.keys())
  const dependencyOrder: NarrativeDebtReference[] = []
  while (pending.size > 0) {
    let progressed = false
    for (const debt of debts) {
      const key = narrativeDebtReferenceKey(debt)
      if (!pending.has(key)) continue
      const hasPendingDependency = (debt.dependsOn ?? []).some(reference => {
        const dependencyKey = narrativeDebtReferenceKey(reference)
        return debtsByReference.has(dependencyKey) && pending.has(dependencyKey)
      })
      if (hasPendingDependency) continue
      pending.delete(key)
      dependencyOrder.push({ clock: debt.clock, id: debt.id })
      progressed = true
    }
    if (!progressed) {
      throw new Error(`closure scope '${closureScopeId}' has a circular debt dependency`)
    }
  }

  return deepFreeze({
    scope,
    unitIds,
    endingHypothesis,
    endingEntries,
    debts,
    dependencyOrder,
    remainingChapterBudget,
  })
}

function narrativeDebtReferenceKey(reference: NarrativeDebtReference): string {
  return JSON.stringify([reference.clock, reference.id])
}

function compareCanonFacts(left: NovelCanonFact, right: NovelCanonFact): number {
  return compareText(left.kind, right.kind)
    || compareText(left.targetId, right.targetId)
    || compareText(left.field, right.field)
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
