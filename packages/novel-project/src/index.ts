import { createHash, randomUUID } from 'node:crypto'
import { Context, Service } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-session-projection'
import {
  SessionId,
  type Session,
} from '@deepseek-ai/dsh-session'
import type { SubagentResult, SubagentRun } from '@deepseek-ai/dsh-subagent'
import { FsVersion, type FsWriteIntent } from '@deepseek-ai/dsh-fs'
import type {} from '@deepseek-ai/dsh-sandbox-policy'
import type {
  NovelChapterFileRead,
  NovelChapterFileWrite,
} from './types.js'
import type {} from '@deepseek-ai/dsh-system-prompt'
import {
  defineDomain,
  domainTable,
  type KvTable,
} from '@deepseek-ai/dsh-storage-domain'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import {
  WorkspaceId,
  type Workspace,
  type WorkspaceId as DshWorkspaceId,
} from '@deepseek-ai/dsh-workspace'
import {
  defineTool,
  type JsonSchemaNode,
  type ObjectJsonSchema,
  type ToolRunContext,
} from '@deepseek-ai/dsh-tools'
import { z } from 'zod'
import type {
  AcceptedNovelRevision,
  NovelCanonEntity,
  NovelCanonChange,
  NovelCanonDeltaKind,
  NovelCanonExtension,
  NovelCanonFact,
  NovelCanonFieldSource,
  NovelCanonProjection,
  NovelCanonProjector,
  NovelCanonSnapshot,
  NovelCanonValue,
  NovelCausalImpact,
  NovelChapterControlPack,
  NovelGraphProjection,
  NovelKnowledgeBoundary,
  NovelCanonLock,
  NovelNarrativeClockEntry,
  NovelNarrativeProjection,
  NovelManuscriptProjection,
  NovelPendingProposal,
  NovelProject,
  NovelRelationshipProjection,
  NovelRetrievalQuery,
  NovelRetrievalRebuildJob,
  NovelRetrievalResult,
  NovelRevisionImpact,
  NovelWritingContinuity,
  NovelResultItemDecision,
  NovelResultPacketImpactPreview,
  NovelResultPacket,
  NovelResultPacketDraft,
  NovelReviewDraftRequest,
  NovelWorkspaceId,
  ReaderPersonaInput,
  ReaderResponseCandidateDimensionComparison,
  ReaderResponseCandidateExperiment,
  ReaderResponseCandidateInput,
  ReaderResponseCandidateComparison,
  ReaderResponseCandidatePersonaComparison,
  ReaderResponseCandidatePersonaDimensionComparison,
  ReaderResponseCandidatePersonaExperiment,
  ReaderResponseComparedCandidate,
  ReaderResponseFeedbackCalibration,
  ReaderResponseFeedbackCalibrationItem,
  ReaderResponseFeedbackInput,
  ReaderResponsePersonaComparison,
  ReaderResponsePersonaDimensionComparison,
  ReaderResponsePersonaExperiment,
  ReaderResponseSimulationExperiment,
  ReaderResponseSimulationRequest,
  ReaderResponseSimulationResult,
  ReaderResponseSimulationRun,
  ReaderResponseVariantComparison,
  ReaderResponseVariantDimensionComparison,
  ReaderResponseVariantInput,
  ReaderResponseVariantRun,
  ReviewNovelResultPacket,
  RollbackNovelRevision,
  SimulationReplayKeyInput,
  SimulationSandbox,
  StoryWorldBranchStateComparison,
  StoryWorldBranchSeedStateComparison,
  StoryWorldSimulationBranch,
  StoryWorldSimulationBranchExperiment,
  StoryWorldSimulationBranchRun,
  StoryWorldSimulationBranchSeedComparison,
  StoryWorldSimulationBranchSeedExperiment,
  StoryWorldSimulationExperiment,
  StoryWorldRoleComparison,
  StoryWorldRoleComparisonRequest,
  StoryWorldRoleRun,
  StoryWorldSharedEncounter,
  StoryWorldSharedEncounterRequest,
  StoryWorldSharedEncounterTurn,
  StoryWorldSingleActorSimulationRequest,
  StoryWorldSimulationRequest,
  StoryWorldSimulationResult,
  StoryWorldSimulationRun,
  StoryWorldSimulationAction,
  StoryWorldStateEntry,
  StoryWorldStatePath,
  StoryWorldStateReplay,
} from './types.js'
import {
  CANON_FACT_KINDS,
  NARRATIVE_CLOCKS,
  READER_RESPONSE_DIMENSIONS,
  STORY_WORLD_ACTION_TYPES,
} from './types.js'
import {
  acceptanceAuthorizationSchema,
  anchoredIssueSchema,
  canonDeltaSchema,
  DOMAIN_OWNED_DELTA_KINDS,
  manuscriptRevisionSchema,
  novelResultItemDecisionSchema,
  novelCanonValueSchema,
  novelResultPacketDraftSchema,
  novelResultPacketSchema,
  resultProvenanceSchema,
  reviewNovelResultPacketDraftSchema,
  reviewNovelResultPacketSchema,
  sourceAnchorSchema,
} from './result-packet-schema.js'

export type {
  AcceptanceAuthorization,
  AcceptedNovelRevision,
  AnchoredIssue,
  CanonDelta,
  CanonFactDelta,
  CanonFactKind,
  ManuscriptDiff,
  ManuscriptRevision,
  NarrativeClock,
  NarrativeClockDelta,
  NarrativeClockRemoveDelta,
  NarrativeClockSetDelta,
  WorldClockSetDelta,
  CharacterClockSetDelta,
  RelationshipClockSetDelta,
  PromiseClockSetDelta,
  ProgressionClockSetDelta,
  NarrativeDebtDelta,
  NarrativeDebtReference,
  NarrativeDebtRemoveDelta,
  NarrativeDebtSetDelta,
  NarrativeDebtValue,
  NarrativeLevel,
  NarrativeUnitDelta,
  NarrativeUnitRemoveDelta,
  NarrativeUnitSetDelta,
  NarrativeUnitValue,
  NovelCanonFact,
  NovelCanonEntity,
  NovelCanonFieldSource,
  NovelCanonProjection,
  NovelWorldClockReference,
  NovelWorldClockValue,
  NovelCanonValue,
  NovelCharacterTrajectory,
  NovelCharacterTrajectoryChange,
  NovelCharacterTrajectoryEntry,
  NovelCharacterTrajectoryField,
  NovelCharacterClockValue,
  NovelRelationshipClockValue,
  NovelClueLifecycle,
  NovelClueLifecycleChange,
  NovelClueLifecycleEntry,
  NovelClueLifecycleField,
  NovelMysteryLifecycle,
  NovelMysteryLifecycleChange,
  NovelMysteryLifecycleEntry,
  NovelMysteryLifecycleField,
  NovelMysteryLinkedClueEvidence,
  NovelMysteryStateValue,
  NovelPromiseLifecycle,
  NovelPromiseLifecycleChange,
  NovelPromiseLifecycleEntry,
  NovelPromiseLifecycleField,
  NovelPromiseClockValue,
  NovelProgressionClockValue,
  NovelProgressionAdvancement,
  NovelProgressionAdvancementValue,
  NovelProgressionLedger,
  NovelFactionContinuityEntry,
  NovelFactionContinuityLedger,
  NovelFactionContinuityValue,
  NovelLocationContinuityEntry,
  NovelLocationContinuityLedger,
  NovelLocationContinuityValue,
  NovelLocationTravelLink,
  NovelObjectContinuityEntry,
  NovelObjectContinuityLedger,
  NovelObjectContinuityValue,
  NovelEmotionComponent,
  NovelEmotionContinuityLedger,
  NovelEmotionEpisode,
  NovelEmotionEpisodeValue,
  NovelChapterControlPack,
  NovelClosureLedger,
  NovelEndingFinalState,
  NovelEndingHypothesis,
  NovelEndingHypothesisValue,
  NovelEndingResolutionMode,
  NovelGraphEdge,
  NovelGraphNode,
  NovelGraphProjection,
  NovelKnowledgeBoundary,
  NovelStoryEventValue,
  NovelStoryTimeRange,
  NovelTimelineEvent,
  NovelTimelineLedger,
  NovelCanonLock,
  NovelNarrativeClockBucket,
  NovelNarrativeClockEntry,
  NovelNarrativeDebt,
  NovelNarrativeProjection,
  NovelNarrativeUnit,
  NovelManuscriptProjection,
  NovelProject,
  NovelRelationshipFieldSource,
  NovelRelationshipLine,
  NovelRelationshipPair,
  NovelRelationshipProjection,
  NovelRetrievalFreshness,
  NovelRetrievalHit,
  NovelRetrievalHitEvidence,
  NovelRetrievalQuery,
  NovelRetrievalRebuildJob,
  NovelRetrievalResult,
  NovelRetrievalSourceRange,
  NovelRevisionImpact,
  NovelStructuredRetrievalHit,
  NovelExactTextRetrievalHit,
  NovelFullTextRetrievalHit,
  NovelWritingMemoryContinuityHit,
  NovelWritingMemoryDebtHit,
  NovelWritingMemoryEvidence,
  NovelWritingMemoryManuscriptExcerpt,
  NovelWritingMemoryRecall,
  NovelWritingContinuity,
  NovelWritingMemorySettingFact,
  NovelResultItemDecision,
  NovelResultPacketImpactPreview,
  NovelResultPacket,
  NovelResultPacketDraft,
  NovelReviewDraftRequest,
  NovelTextImportRequest,
  NovelWorkspaceId,
  ReaderPersonaInput,
  ReaderResponseCandidateInput,
  ReaderResponseCandidateComparison,
  ReaderResponseCandidateDimensionComparison,
  ReaderResponseCandidateDimensionValue,
  ReaderResponseCandidateExperiment,
  ReaderResponseCandidatePersonaComparison,
  ReaderResponseCandidatePersonaDimensionComparison,
  ReaderResponseCandidatePersonaDimensionValue,
  ReaderResponseCandidatePersonaExperiment,
  ReaderResponseComparedCandidate,
  ReaderResponseDimension,
  ReaderResponseDimensionSummary,
  ReaderResponseFeedbackAuthorDecision,
  ReaderResponseFeedbackCalibration,
  ReaderResponseFeedbackCalibrationItem,
  ReaderResponseFeedbackCategory,
  ReaderResponseFeedbackInput,
  ReaderResponseFeedbackObservation,
  ReaderResponseHypothesis,
  ReaderResponsePersonaComparison,
  ReaderResponsePersonaDimensionComparison,
  ReaderResponsePersonaDimensionValue,
  ReaderResponsePersonaExperiment,
  ReaderResponseSimulationExperiment,
  ReaderResponseSimulationRequest,
  ReaderResponseSimulationResult,
  ReaderResponseSimulationRun,
  ReaderResponseVariantComparison,
  ReaderResponseVariantDimensionComparison,
  ReaderResponseVariantDimensionValue,
  ReaderResponseVariantInput,
  ReaderResponseVariantRun,
  ResultProvenance,
  ResultPacketItemDecision,
  ReviewNovelResultPacket,
  RollbackNovelRevision,
  SourceAnchor,
  SimulationReplayKeyInput,
  SimulationSandbox,
  StoryWorldActionSummary,
  StoryWorldActionType,
  StoryWorldActorInput,
  StoryWorldBranchSeedStateComparison,
  StoryWorldBranchSeedStateValue,
  StoryWorldBranchStateComparison,
  StoryWorldBranchStateValue,
  StoryWorldKnowledgeRef,
  StoryWorldRoleComparison,
  StoryWorldRoleComparisonRequest,
  StoryWorldRoleRun,
  StoryWorldSharedEncounter,
  StoryWorldSharedEncounterRequest,
  StoryWorldSharedEncounterTurn,
  StoryWorldSimulationAction,
  StoryWorldSimulationBranch,
  StoryWorldSimulationBranchExperiment,
  StoryWorldSimulationBranchRun,
  StoryWorldSimulationBranchSeedComparison,
  StoryWorldSimulationBranchSeedExperiment,
  StoryWorldSimulationExperiment,
  StoryWorldSimulationRequest,
  StoryWorldSimulationResult,
  StoryWorldSimulationRun,
  StoryWorldSingleActorSimulationRequest,
  StoryWorldStateEffect,
  StoryWorldStateEntry,
  StoryWorldStatePath,
  StoryWorldStatePrecondition,
  StoryWorldStateReplay,
  StoryWorldStateTransition,
} from './types.js'

export {
  CANON_FACT_KINDS,
  NARRATIVE_CLOCKS,
  NARRATIVE_LEVELS,
  READER_RESPONSE_DIMENSIONS,
  STORY_WORLD_ACTION_TYPES,
} from './types.js'

export {
  acceptanceAuthorizationSchema,
  anchoredIssueSchema,
  canonDeltaSchema,
  manuscriptDiffSchema,
  manuscriptRevisionSchema,
  novelResultItemDecisionSchema,
  novelCanonValueSchema,
  novelResultPacketDraftSchema,
  novelResultPacketSchema,
  resultProvenanceSchema,
  reviewNovelResultPacketDraftSchema,
  reviewNovelResultPacketSchema,
  sourceAnchorSchema,
} from './result-packet-schema.js'

const revisionSchema = z.number().int().nonnegative()











const storyWorldKnowledgeRefSchema = z.object({
  kind: z.enum([
    'canon',
    'story-event',
    'character-state',
    'emotion-state',
    'relationship',
    'knowledge',
    'promise',
    'clue',
    'timeline',
  ]),
  targetId: z.string().min(1),
  field: z.string().min(1),
}).strict()

const storyWorldActorInputSchema = z.object({
  id: z.string().min(1),
  goal: z.string().min(1),
  resources: z.array(z.string().min(1)),
  knowledge: z.array(storyWorldKnowledgeRefSchema),
}).strict()

const storyWorldStatePathSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('resource'),
    resource: z.string().min(1),
  }).strict(),
  z.object({
    type: z.literal('fact'),
    fact: storyWorldKnowledgeRefSchema,
  }).strict(),
])

const storyWorldStatePreconditionSchema = z.object({
  path: storyWorldStatePathSchema,
  equals: novelCanonValueSchema,
}).strict()

const storyWorldStateEffectSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('set'),
    path: storyWorldStatePathSchema,
    value: novelCanonValueSchema,
  }).strict(),
  z.object({
    operation: z.literal('remove'),
    path: storyWorldStatePathSchema,
  }).strict(),
])

const storyWorldSimulationBranchSchema = z.object({
  id: z.string().min(1),
  hypothesis: z.string().min(1),
  assumptions: z.array(z.string().min(1)),
}).strict()

export const storyWorldSimulationRequestSchema = z.object({
  mode: z.enum(['role-comparison', 'shared-encounter']).optional(),
  revision: revisionSchema,
  maxActions: z.number().int().positive().default(1),
  storyTime: z.string().min(1),
  hypothesis: z.string().min(1),
  assumptions: z.array(z.string().min(1)),
  actor: storyWorldActorInputSchema.optional(),
  actors: z.array(storyWorldActorInputSchema).min(2).optional(),
  seed: z.string().min(1).optional(),
  seeds: z.array(z.string().min(1)).min(2).optional(),
  branches: z.array(storyWorldSimulationBranchSchema).min(2).optional(),
}).strict().superRefine((request, ctx) => {
  if ((request.actor === undefined) === (request.actors === undefined)) {
    ctx.addIssue({
      code: 'custom',
      path: ['actors'],
      message: 'provide exactly one of actor or actors',
    })
  }
  if (request.actors !== undefined) {
    const actorIds = request.actors.map(actor => actor.id)
    if (new Set(actorIds).size !== actorIds.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['actors'],
        message: 'story-world comparison actor ids must be unique',
      })
    }
    if (request.branches !== undefined || request.seeds !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['actors'],
        message: 'actors cannot be combined with branches or seeds',
      })
    }
  } else if (request.mode !== undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['mode'],
      message: 'mode requires actors',
    })
  }
}).transform(request => request as StoryWorldSimulationRequest)

const generatedStoryWorldActionSchema = z.object({
  type: z.enum(STORY_WORLD_ACTION_TYPES),
  target: z.string().min(1),
  intent: z.string().min(1),
  preconditions: z.array(storyWorldStatePreconditionSchema),
  effects: z.array(storyWorldStateEffectSchema),
}).strict()

const generatedStoryWorldOutputSchema = z.object({
  actions: z.array(generatedStoryWorldActionSchema).min(1),
  limitations: z.array(z.string().min(1)),
}).strict()

const storyWorldStatePathJsonSchema: JsonSchemaNode = {
  oneOf: [{
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: { type: 'string', const: 'resource' },
      resource: { type: 'string' },
    },
  }, {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'fact'],
    properties: {
      type: { type: 'string', const: 'fact' },
      fact: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'targetId', 'field'],
        properties: {
          kind: { type: 'string', enum: [...CANON_FACT_KINDS] },
          targetId: { type: 'string' },
          field: { type: 'string' },
        },
      },
    },
  }],
}

const storyWorldStatePreconditionJsonSchema: JsonSchemaNode = {
  type: 'object',
  additionalProperties: false,
  required: ['path', 'equals'],
  properties: {
    path: storyWorldStatePathJsonSchema,
    equals: {},
  },
}

const storyWorldStateEffectJsonSchema: JsonSchemaNode = {
  oneOf: [{
    type: 'object',
    additionalProperties: false,
    required: ['operation', 'path', 'value'],
    properties: {
      operation: { type: 'string', const: 'set' },
      path: storyWorldStatePathJsonSchema,
      value: {},
    },
  }, {
    type: 'object',
    additionalProperties: false,
    required: ['operation', 'path'],
    properties: {
      operation: { type: 'string', const: 'remove' },
      path: storyWorldStatePathJsonSchema,
    },
  }],
}

const generatedStoryWorldOutputJsonSchema: ObjectJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['actions', 'limitations'],
  properties: {
    actions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'target', 'intent', 'preconditions', 'effects'],
        properties: {
          type: { type: 'string', enum: [...STORY_WORLD_ACTION_TYPES] },
          target: { type: 'string' },
          intent: { type: 'string' },
          preconditions: { type: 'array', items: storyWorldStatePreconditionJsonSchema },
          effects: { type: 'array', items: storyWorldStateEffectJsonSchema },
        },
      },
    },
    limitations: { type: 'array', items: { type: 'string' } },
  },
}

const readerPersonaInputSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
}).strict()

const readerResponseCandidateInputSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
}).strict()

const readerResponseVariantInputSchema = z.discriminatedUnion('source', [
  z.object({
    id: z.string().min(1),
    source: z.literal('accepted'),
  }).strict(),
  z.object({
    id: z.string().min(1),
    source: z.literal('candidate'),
    text: z.string().min(1),
  }).strict(),
])

const readerResponseFeedbackCategorySchema = z.enum([
  'comprehension',
  'expectation',
  'emotion',
  'preference',
  'coordinated-noise',
  'continuity',
])

const readerResponseFeedbackObservationSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('qualitative'),
    category: readerResponseFeedbackCategorySchema,
    outcome: z.string().min(1),
    uncertainty: z.string().min(1),
  }).strict(),
  z.object({
    id: z.string().min(1),
    type: z.literal('quantitative'),
    category: readerResponseFeedbackCategorySchema,
    count: z.number().int().nonnegative(),
    total: z.number().int().positive(),
    uncertainty: z.string().min(1),
  }).strict().refine(
    observation => observation.count <= observation.total,
    { message: 'reader-response feedback count cannot exceed total' },
  ),
])

const readerResponseFeedbackInputSchema = z.object({
  sourceId: z.string().min(1),
  platform: z.string().min(1),
  observedAt: z.string().min(1),
  consented: z.literal(true),
  cohort: readerPersonaInputSchema,
  revision: revisionSchema,
  unitId: z.string().min(1),
  variantId: z.string().min(1),
  presentedTextHash: z.string().regex(/^[a-f0-9]{64}$/),
  authorDecision: z.object({
    action: z.enum(['consider', 'defer', 'dismiss']),
    rationale: z.string().min(1),
  }).strict(),
  observations: z.array(readerResponseFeedbackObservationSchema).min(1),
}).strict()

export const readerResponseSimulationRequestSchema = z.object({
  revision: revisionSchema,
  unitId: z.string().min(1),
  hypothesis: z.string().min(1),
  persona: readerPersonaInputSchema.optional(),
  personas: z.array(readerPersonaInputSchema).min(2).optional(),
  readingHistory: z.array(z.string().min(1)),
  candidate: readerResponseCandidateInputSchema.optional(),
  candidates: z.array(readerResponseCandidateInputSchema).min(2).optional(),
  variants: z.array(readerResponseVariantInputSchema).min(2).optional(),
  feedback: readerResponseFeedbackInputSchema.optional(),
  seed: z.string().min(1).optional(),
  seeds: z.array(z.string().min(1)).min(2).optional(),
}).strict()
  .refine(
    request => (request.persona === undefined) !== (request.personas === undefined),
    { message: 'reader-response requires exactly one of persona or personas' },
  )
  .refine(
    request => request.candidate === undefined || request.candidates === undefined,
    { message: 'reader-response candidate and candidates cannot be used together' },
  )
  .refine(
    request => request.variants === undefined
      || (request.candidate === undefined && request.candidates === undefined),
    { message: 'reader-response variants cannot be combined with candidate or candidates' },
  )
  .refine(
    request => request.variants === undefined || request.personas === undefined,
    { message: 'reader-response variants require one persona' },
  )
  .refine(
    request => request.variants === undefined || request.seeds === undefined,
    { message: 'reader-response variants use the shared seed, not seeds' },
  )
  .refine(
    request => request.variants === undefined
      || new Set(request.variants.map(variant => variant.id)).size === request.variants.length,
    { message: 'reader-response variant ids must be unique' },
  )
  .refine(
    request => request.feedback === undefined || request.seeds !== undefined,
    { message: 'reader-response feedback calibration requires at least two seeds' },
  )
  .refine(
    request => request.feedback === undefined
      || (request.personas === undefined
        && request.candidate === undefined
        && request.candidates === undefined
        && request.variants === undefined),
    { message: 'reader-response feedback calibration requires one persona and accepted text' },
  )
  .refine(
    request => request.candidates === undefined || request.seeds !== undefined,
    { message: 'reader-response candidate comparison requires at least two seeds' },
  )
  .refine(
    request => request.candidates === undefined
      || new Set(request.candidates.map(candidate => candidate.id)).size === request.candidates.length,
    { message: 'reader-response candidate ids must be unique' },
  )
  .refine(
    request => request.personas === undefined || request.seeds !== undefined,
    { message: 'reader-response persona comparison requires at least two seeds' },
  )
  .refine(
    request => request.personas === undefined
      || new Set(request.personas.map(persona => persona.id)).size === request.personas.length,
    { message: 'reader-response persona ids must be unique' },
  )

const generatedReaderResponseHypothesisSchema = z.object({
  dimension: z.enum(READER_RESPONSE_DIMENSIONS),
  hypothesis: z.string().min(1),
  evidence: z.string().min(1),
}).strict()

const generatedReaderResponseOutputSchema = z.object({
  reactions: z.array(generatedReaderResponseHypothesisSchema).min(1),
  limitations: z.array(z.string().min(1)),
}).strict()

const generatedReaderResponseOutputJsonSchema: ObjectJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['reactions', 'limitations'],
  properties: {
    reactions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['dimension', 'hypothesis', 'evidence'],
        properties: {
          dimension: { type: 'string', enum: [...READER_RESPONSE_DIMENSIONS] },
          hypothesis: { type: 'string' },
          evidence: { type: 'string' },
        },
      },
    },
    limitations: { type: 'array', items: { type: 'string' } },
  },
}

const lockableCanonFactKindSchema = z.union([
  z.enum(CANON_FACT_KINDS),
  z.string().regex(/^[^/]+\/[^/]+$/),
])

const novelCanonLockSchema = z.object({
  kind: lockableCanonFactKindSchema,
  targetId: z.string().min(1),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict()

const manageNovelCanonLockSchema = z.object({
  action: z.enum(['lock', 'unlock']),
  expectedRevision: revisionSchema,
  kind: lockableCanonFactKindSchema,
  targetId: z.string().min(1),
  field: z.string().min(1),
}).strict()

const NOVEL_CANON_GUIDANCE = `# Novel canon

Use the accepted Novel Project revision as the only story authority. Keep these stages distinct:

- Narrative structure is a strict ancestry, one level per step: \`series → book → volume → arc → chapter → scene → beat → prose\`. \`series\` is the only root, and every other level must name a parent of exactly the level before it (a Chapter hangs off an arc, an arc off a volume, a volume off a book). A packet that skips a level is rejected at acceptance, and the author cannot rescue it item by item: every delta of the packet is validated together.

- Anchors are optional and never guessed. A Result Packet may carry \`sourceAnchors: []\` and empty per-delta \`sourceAnchorIds\`, which is the right answer for a change that is not tied to existing manuscript text. A source anchor that IS present must carry the exact SHA-256 of its byte range, so if you cannot compute that hash from the file you are reading, submit the change without an anchor instead of spending turns guessing one.

- Ask: read only. Answer from the selected accepted revision and identify the revision and evidence used. Do not create authorization or mutate Canon.

- Accept: author decision. Only the existing Novel Project Result Packet transaction may advance the expected revision after the author has decided every item and explicitly applies it.

Use DSH's stock \`workflow\` tool only when the user explicitly requests a workflow or the work genuinely needs large multi-agent orchestration. Ordinary Ask, Plan, Write or Review work does not require a workflow. Do not register, emulate or assume another workflow engine, task store or workflow UI.`









export const rollbackNovelRevisionSchema = z.object({
  commandId: z.string().min(1),
  expectedRevision: revisionSchema,
  targetRevision: z.number().int().positive(),
  provenance: resultProvenanceSchema,
  authorization: acceptanceAuthorizationSchema,
}).strict()

export const acceptedNovelRevisionSchema = z.object({
  revision: revisionSchema,
  parentRevision: revisionSchema,
  packetId: z.string().min(1),
  manuscript: manuscriptRevisionSchema.optional(),
  deltas: z.array(canonDeltaSchema),
  issues: z.array(anchoredIssueSchema),
  decisions: z.array(novelResultItemDecisionSchema),
  sourceAnchors: z.array(sourceAnchorSchema),
  provenance: resultProvenanceSchema,
  authorization: acceptanceAuthorizationSchema,
  rollbackOfRevision: revisionSchema.optional(),
}).strict()

interface NovelProjectRecord extends NovelProject {
  readonly revisions: readonly AcceptedNovelRevision[]
  /** Durable proposals awaiting an author decision; accepted ones leave this inbox. */
  readonly pendingProposals: readonly NovelPendingProposal[]
}

type NovelProjectProjectionRevision = Omit<AcceptedNovelRevision, 'authorization'> & {
  readonly authorization?: AcceptedNovelRevision['authorization']
}

interface NovelProjectProjectionRecord extends NovelProject {
  readonly revisions: readonly NovelProjectProjectionRevision[]
}


type SingleReaderResponseSimulationRequest = ReaderResponseSimulationRequest & {
  readonly persona: ReaderPersonaInput
  readonly personas?: undefined
  readonly variants?: undefined
  readonly feedback?: undefined
}

type PersonaComparisonReaderResponseRequest = ReaderResponseSimulationRequest & {
  readonly persona?: undefined
  readonly personas: readonly ReaderPersonaInput[]
  readonly candidates?: undefined
  readonly variants?: undefined
  readonly feedback?: undefined
}

type CandidatePersonaComparisonReaderResponseRequest = ReaderResponseSimulationRequest & {
  readonly persona?: undefined
  readonly personas: readonly ReaderPersonaInput[]
  readonly candidate?: undefined
  readonly candidates: readonly ReaderResponseCandidateInput[]
  readonly seeds: readonly string[]
  readonly variants?: undefined
  readonly feedback?: undefined
}

type VariantComparisonReaderResponseRequest = ReaderResponseSimulationRequest & {
  readonly persona: ReaderPersonaInput
  readonly personas?: undefined
  readonly candidate?: undefined
  readonly candidates?: undefined
  readonly variants: readonly ReaderResponseVariantInput[]
  readonly seeds?: undefined
  readonly feedback?: undefined
}

type FeedbackCalibrationReaderResponseRequest = ReaderResponseSimulationRequest & {
  readonly persona: ReaderPersonaInput
  readonly personas?: undefined
  readonly candidate?: undefined
  readonly candidates?: undefined
  readonly variants?: undefined
  readonly seeds: readonly string[]
  readonly feedback: ReaderResponseFeedbackInput
}

const novelPendingProposalSchema: z.ZodType<NovelPendingProposal> = z.object({
  packetId: z.string().min(1),
  receivedAt: z.number().int().nonnegative(),
  producer: z.string().min(1),
  packet: novelResultPacketDraftSchema,
}).strict()

/** Bound the durable inbox so the project record cannot grow without limit. */
const NOVEL_PENDING_PROPOSAL_LIMIT = 20

const novelProjectSchema: z.ZodType<NovelProjectRecord> = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().min(1).transform(WorkspaceId),
  cwd: z.string().min(1),
  acceptedRevision: revisionSchema,
  canonLocks: z.array(novelCanonLockSchema).default([]),
  revisions: z.array(acceptedNovelRevisionSchema).default([]),
  pendingProposals: z.array(novelPendingProposalSchema).default([]),
}).strict()

/**
 * Derive a stable identity for a proposal-only simulation replay.
 *
 * The key covers the sandbox, caller seed, frozen input and emitted trace. It
 * identifies equivalent data only; it does not make an underlying model call
 * deterministic and intentionally remains separate from the DSH child run id.
 */
export function simulationReplayKey(input: SimulationReplayKeyInput): string {
  const sandbox: SimulationSandbox = input.sandbox
  const serialized = canonicalizeJsonValue({
    sandbox,
    seed: input.seed ?? null,
    input: input.input,
    trace: input.trace,
  })
  return createHash('sha256').update(serialized).digest('hex')
}

/**
 * Replay ordered proposal-only actions against an explicit frozen state.
 *
 * Preconditions must match the value at the same typed path. Each successful
 * action applies its set/remove effects only to this counterfactual projection.
 */
export function replayStoryWorldStateTransitions(
  initialState: readonly StoryWorldStateEntry[],
  actions: readonly StoryWorldSimulationAction[],
): StoryWorldStateReplay {
  const projectedState = new Map<string, StoryWorldStateEntry>()
  for (const entry of initialState) {
    projectedState.set(storyWorldStatePathKey(entry.path), entry)
  }
  const frozenInitialState = storyWorldStateSnapshot(projectedState)
  const transitions = actions.map((action, index) => {
    for (const precondition of action.preconditions) {
      const key = storyWorldStatePathKey(precondition.path)
      const current = projectedState.get(key)
      if (current === undefined || !canonValuesEqual(current.value, precondition.equals)) {
        const actual = current === undefined
          ? 'missing'
          : canonicalizeJsonValue(current.value)
        throw new Error(
          `story-world action ${String(index + 1)} has unmet precondition at ${key}: expected ${canonicalizeJsonValue(precondition.equals)}, received ${actual}`,
        )
      }
    }
    const before = storyWorldStateSnapshot(projectedState)
    for (const effect of action.effects) {
      const key = storyWorldStatePathKey(effect.path)
      if (effect.operation === 'set') {
        projectedState.set(key, { path: effect.path, value: effect.value })
      } else {
        projectedState.delete(key)
      }
    }
    const after = storyWorldStateSnapshot(projectedState)
    return {
      actionIndex: index,
      before,
      after,
    }
  })
  return deepFreeze({
    initialState: frozenInitialState,
    transitions,
    finalState: storyWorldStateSnapshot(projectedState),
  })
}

function storyWorldStatePathKey(path: StoryWorldStatePath): string {
  return canonicalizeJsonValue(path)
}

function storyWorldStateSnapshot(
  state: ReadonlyMap<string, StoryWorldStateEntry>,
): StoryWorldStateEntry[] {
  return [...state.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([, entry]) => ({ path: entry.path, value: entry.value }))
}

function buildStoryWorldInitialState(
  resources: readonly string[],
  knownFacts: readonly NovelCanonFact[],
): StoryWorldStateEntry[] {
  const state = new Map<string, StoryWorldStateEntry>()
  for (const fact of knownFacts) {
    const path: StoryWorldStatePath = {
      type: 'fact',
      fact: {
        kind: fact.kind,
        targetId: fact.targetId,
        field: fact.field,
      },
    }
    state.set(storyWorldStatePathKey(path), { path, value: fact.value })
  }
  for (const resource of resources) {
    const path: StoryWorldStatePath = { type: 'resource', resource }
    state.set(storyWorldStatePathKey(path), { path, value: true })
  }
  return storyWorldStateSnapshot(state)
}

function projectStoryWorldVisibleState(
  acceptedVisibleState: readonly StoryWorldStateEntry[],
  sharedState: readonly StoryWorldStateEntry[],
): StoryWorldStateEntry[] {
  const shared = new Map(sharedState.map(entry => [
    storyWorldStatePathKey(entry.path),
    entry,
  ] as const))
  const visible = new Map<string, StoryWorldStateEntry>()
  for (const acceptedEntry of acceptedVisibleState) {
    const key = storyWorldStatePathKey(acceptedEntry.path)
    const current = shared.get(key)
    if (current !== undefined) visible.set(key, current)
  }
  return storyWorldStateSnapshot(visible)
}

function canonicalizeJsonValue(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    const items = Array.from(
      { length: value.length },
      (_unused, index) => canonicalizeJsonValue(value[index]),
    )
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
  if (serialized === undefined) return 'null'
  return serialized
}

/** Durable Novel Project authority, including its complete accepted revision aggregate. */
export const novelProjectDomainSpec = defineDomain({
  name: 'novel_project',
  version: 1,
  tables: {
    projects: domainTable<DshWorkspaceId, NovelProjectRecord>(novelProjectSchema),
  },
})

/** Typed Memory reads consumed by existing authoring entries; no reverse plugin lifecycle dependency. */
export interface NovelMemoryReadService {
  rebuildRetrievalIndex(owner: Agent, workspaceId: DshWorkspaceId, revision: number): NovelRetrievalRebuildJob
  readKnowledgeBoundary(workspaceId: DshWorkspaceId, revision: number, subjectId: string): NovelKnowledgeBoundary
  projectGraph(snapshot: NovelCanonSnapshot, canon: NovelCanonProjection, narrative: NovelNarrativeProjection, headRevision: number): NovelGraphProjection
  compareCausalConsequences(before: NovelGraphProjection, after: NovelGraphProjection): NonNullable<NovelRevisionImpact['causalConsequences']>
  readGraph(workspaceId: DshWorkspaceId, revision: number): NovelGraphProjection
  traceCausalImpact(graph: NovelGraphProjection, sourceEventId: string): NovelCausalImpact
  retrieve(workspaceId: DshWorkspaceId, query: NovelRetrievalQuery): NovelRetrievalResult
  readRelationships(workspaceId: DshWorkspaceId, revision: number): NovelRelationshipProjection
  readChapterControlPack(workspaceId: DshWorkspaceId, revision: number, chapterId: string): NovelChapterControlPack
  readWritingContinuity(workspaceId: DshWorkspaceId, revision: number): NovelWritingContinuity
}

/** Writing reads and proposal accounting used by the current composed authoring path. */
export interface NovelWritingReadService {
  readManuscripts(workspaceId: DshWorkspaceId, revision: number): readonly NovelManuscriptProjection[]
  recordProposal(exec: ToolRunContext, packet: NovelResultPacketDraft, acceptedRevision: number): void
}

/** Typed domain service used by the existing author-review entry while its clients migrate. */
export interface NovelReviewDraftService {
  reviewDraft(
    agent: Agent,
    workspaceId: NovelWorkspaceId,
    request: NovelReviewDraftRequest,
    signal: AbortSignal,
  ): Promise<NovelResultPacketDraft>
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Sole owner of accepted novel-project identity and revision state. */
    novelProject: NovelProjectService
    /** Domain-owned read-only context; Canon retains all acceptance and version authority. */
    novelMemory: NovelMemoryReadService
    /** Writing owns bounded proposal accounting and consumes the real native execution context. */
    novelWriting: NovelWritingReadService
    /** Domain-owned review execution returning an unauthorised Result Packet. */
    novelReview: NovelReviewDraftService
  }
}

declare module '@deepseek-ai/dsh-session' {
  interface SessionEventMap {
    'novel/canon/accepted': NovelCanonChange
    'novel/canon/rolled-back': NovelCanonChange
  }
}


/**
 * The filesystem service's own failure code, read structurally.
 *
 * Deliberately not `instanceof FsError`. The store can hold more than one
 * `dsh-fs` copy, and the backend that throws is not necessarily the copy this
 * module imported, so class identity is not a safe test here. The real-machine
 * check found exactly that: a stale write reported itself as a generic failure
 * because the identity check missed, and the author would have been told "读写
 * 这个文件时出错了" instead of "文件在别处被改过了".
 */
function fsErrorCode(error: unknown): string | undefined {
  const code = (error as { readonly code?: unknown } | null | undefined)?.code
  return typeof code === 'string' ? code : undefined
}

/**
 * Author-facing reason for one filesystem failure.
 *
 * The editor shows this next to the draft, so it says what the author can act
 * on — permission, sandbox mode, encoding — rather than echoing a host error.
 * `FsError.code` is the closed vocabulary the fs service owns; anything else is
 * either a plain `Error` from a lower layer or something we have no words for.
 */
function describeFsFailure(error: unknown): string {
  switch (fsErrorCode(error)) {
    case 'FS_PERMISSION_DENIED': return '没有权限读写这个文件。'
    case 'FS_SANDBOX_DENIED': return '当前的访问模式不允许读写这个位置。'
    case 'FS_NOT_TEXT': return '这不是 UTF-8 文本，编辑器打不开。'
    case 'FS_NOT_REGULAR_FILE': return '这个路径不是普通文件。'
    case 'FS_TOO_LARGE': return '这个文件太大，编辑器没有打开它。'
    case 'FS_NOT_FOUND': return '这个文件已经不在了。'
    default:
      return error instanceof Error && error.message !== '' ? error.message : '读写这个文件时出错了。'
  }
}

/**
 * DSH-native authority for Novel Project state.
 *
 * Drafts, summaries, retrieval and graph consumers submit Result Packets;
 * only this service advances the accepted manuscript and Canon revision.
 */
export class NovelProjectService extends TypertRemoteService {
  static inject = [
    'storageDomain',
    'sessions',
    'typert',
    'workspaceRegistry',
    'tools',
    'subagents',
    'agents',
    'systemPrompt',
    'sessionProjections',
    'fs',
    'sandboxPolicy',
  ]

  private projects?: KvTable<DshWorkspaceId, NovelProjectRecord>
  private operationTail: Promise<void> = Promise.resolve()
  private readonly extensions = new Map<string, NovelCanonExtension>()
  private readonly deltaKinds = new Map<string, NovelCanonDeltaKind>()
  private readonly projectors = new Map<string, NovelCanonProjector>()

  constructor(ctx: Context) {
    super(ctx, 'novelProject')
  }

  /** Parse and freeze an authorization-free domain proposal using Canon and registered extension contracts. */
  parseDraft(input: unknown): NovelResultPacketDraft {
    const packet = novelResultPacketDraftSchema.parse(input)
    this.validateDeltas(packet.deltas)
    return deepFreeze(packet)
  }

  /** Register a domain value schema; return this disposer from its Cordis injection callback. */
  registerExtension(extension: NovelCanonExtension): () => void {
    this.extensions.set(extension.namespace, extension)
    return () => { this.extensions.delete(extension.namespace) }
  }

  /** Register one domain-owned Canon Delta kind's value contract; return the disposer to its Cordis owner. */
  registerDeltaKind(deltaKind: NovelCanonDeltaKind): () => void {
    this.deltaKinds.set(deltaKind.kind, deltaKind)
    return () => { this.deltaKinds.delete(deltaKind.kind) }
  }

  /** Register domain projection/validation and return the disposer to its Cordis owner. */
  registerProjector(namespace: string, projector: NovelCanonProjector): () => void {
    this.projectors.set(namespace, projector)
    return () => { this.projectors.delete(namespace) }
  }

  /** Read immutable effective revision sources without author authorization or discarded branches. */
  readSnapshot(workspaceId: DshWorkspaceId, revision: number): NovelCanonSnapshot {
    const targetRevision = revisionSchema.parse(revision)
    const project = this.requireProjects().get(workspaceId)!
    return buildCanonSnapshot(project, targetRevision)
  }

  /** Project only the effective sources of this accepted revision, never the current head by default. */
  readProjection<Result>(namespace: string, workspaceId: DshWorkspaceId, revision: number): Result {
    return this.requireProjector(namespace).project(this.readSnapshot(workspaceId, revision)) as Result
  }

  private requireProjector(namespace: string): NovelCanonProjector {
    const projector = this.projectors.get(namespace)
    if (projector === undefined) {
      throw new NovelProjectDomainUnavailableError(
        'projector',
        namespace,
        `novel project has no '${namespace}' projector registered; install the domain plugin that registers it`,
      )
    }
    return projector
  }

  private requireExtension(namespace: string): NovelCanonExtension {
    const extension = this.extensions.get(namespace)
    if (extension === undefined) {
      throw new NovelProjectDomainUnavailableError(
        'extension',
        namespace,
        `novel project has no '${namespace}' extension schema registered; install the domain plugin that registers it`,
      )
    }
    return extension
  }

  private requireNovelReview(): NovelReviewDraftService {
    const review = this.ctx.get('novelReview')
    if (review === undefined) {
      throw new NovelProjectDomainUnavailableError(
        'domain-service',
        'novelReview',
        'novel project requires @novel-agent/novel-review (Cordis service "novelReview")',
      )
    }
    return review
  }

  private requireNovelMemoryRead(): NovelMemoryReadService {
    const memory = this.ctx.get('novelMemory')
    if (memory === undefined) {
      throw new NovelProjectDomainUnavailableError(
        'domain-service',
        'novelMemory',
        'novel project requires @novel-agent/novel-memory (Cordis service "novelMemory")',
      )
    }
    return memory
  }

  private projectDomain<Result>(namespace: string, project: NovelProjectProjectionRecord, revision: number): Result {
    return this.requireProjector(namespace).project(buildCanonSnapshot(project, revision)) as Result
  }

  private validateProjectors(before: NovelProjectProjectionRecord, candidate: NovelProjectProjectionRecord): void {
    const previousSnapshot = buildCanonSnapshot(before, before.acceptedRevision)
    const candidateSnapshot = buildCanonSnapshot(candidate, candidate.acceptedRevision)
    for (const projector of this.projectors.values()) projector.validate?.(previousSnapshot, candidateSnapshot)
  }

  private validateDeltas(deltas: NovelResultPacketDraft['deltas']): void {
    for (const delta of deltas) {
      if (delta.kind === 'extension') {
        const { valueSchema } = this.requireExtension(delta.namespace)
        if (delta.operation === 'set') valueSchema.parse(delta.value)
        continue
      }
      const deltaKind = this.deltaKinds.get(delta.kind)
      if (deltaKind === undefined) {
        if (!DOMAIN_OWNED_DELTA_KINDS.has(delta.kind)) continue
        throw new NovelProjectDomainUnavailableError(
          'delta-kind',
          delta.kind,
          `novel project has no '${delta.kind}' delta schema registered; install the domain plugin that owns it`,
        )
      }
      deltaKind.validate({
        operation: delta.operation,
        field: delta.field,
        value: delta.value,
        targetId: delta.targetId,
        sourceAnchorIds: delta.sourceAnchorIds,
      })
    }
  }

  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(novelProjectDomainSpec)
    this.ctx.effect(() => () => domain.close(), 'novel-project.domainClose')
    this.projects = domain.table('projects')

    this.ctx.systemPrompt.section({
      name: 'novel:canon',
      order: 120,
      text: NOVEL_CANON_GUIDANCE,
    })

    this.ctx.on('tools/pre-execute', async (exec, next) => {
      if (exec.agent === undefined) {
        return next()
      }

      if (exec.name === 'manage_novel_canon_lock') {
        const request = manageNovelCanonLockSchema.parse(exec.arguments)
        const cwd = exec.agent.session.header.cwd
        if (cwd === undefined) {
          throw new Error('manage_novel_canon_lock requires the calling agent session to have a cwd')
        }
        const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
        if (workspace === undefined) {
          throw new Error(`manage_novel_canon_lock found no DSH Workspace for calling agent cwd '${cwd}'`)
        }
        const project = this.requireProjects().get(workspace.id)
        if (project === undefined) {
          throw new Error(`novel project for Workspace '${workspace.id}' does not exist`)
        }
        if (project.acceptedRevision !== request.expectedRevision) {
          throw new NovelProjectRevisionConflictError(
            request.expectedRevision,
            project.acceptedRevision,
          )
        }
        const key = canonFactKey(request.kind, request.targetId, request.field)
        const lock = request.action === 'lock'
          ? this.projectCanon(workspace.id, request.expectedRevision).facts.find(fact => (
              canonFactKey(fact.kind, fact.targetId, fact.field) === key
            ))
          : project.canonLocks.find(fact => (
              canonFactKey(fact.kind, fact.targetId, fact.field) === key
            ))
        if (lock === undefined) {
          throw new Error(
            `Canon fact '${request.kind}:${request.targetId}:${request.field}' cannot be ${request.action === 'lock' ? 'locked because it is not accepted' : 'unlocked because it is not locked'}`,
          )
        }
        return {
          kind: 'ask',
          reason: `${request.action === 'lock' ? 'Lock' : 'Unlock'} accepted R${String(request.expectedRevision)} Canon fact '${request.kind}:${request.targetId}:${request.field}' with value ${JSON.stringify(lock.value)}.`,
        }
      }

      return next()
    })

    this.ctx.tools.register(defineTool({
      name: 'manage_novel_canon_lock',
      description: 'Ask the author through stock DSH approval to lock or unlock one currently accepted Canon fact. A lock persists with the Novel Project and blocks every conflicting Apply or rollback until explicitly unlocked.',
      parameters: {
        action: {
          type: 'string',
          enum: ['lock', 'unlock'],
          required: true,
          description: 'Lock the accepted value or unlock the existing author lock.',
        },
        expectedRevision: {
          type: 'integer',
          required: true,
          description: 'The current accepted Novel Project revision.',
        },
        kind: {
          type: 'string',
          required: true,
          description: 'The accepted Canon fact kind or complete extension namespace.',
        },
        targetId: {
          type: 'string',
          required: true,
          description: 'The accepted Canon fact target.',
        },
        field: {
          type: 'string',
          required: true,
          description: 'The accepted Canon fact field.',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            locks: { type: 'array', required: true },
          },
        },
        render: (_args, value) => [{
          type: 'text',
          text: JSON.stringify(value.locks, null, 2),
        }],
      },
      presentCall: args => ({
        card: 'generic',
        title: `${args.action === 'lock' ? 'Lock' : 'Unlock'} Canon fact ${args.kind}:${args.targetId}:${args.field}`,
      }),
      presentResult: args => ({
        card: 'generic',
        title: `Canon fact ${args.action === 'lock' ? 'locked' : 'unlocked'}`,
      }),
      execute: async (args, exec) => {
        const agent = exec.agent
        if (agent === undefined) {
          throw new Error('manage_novel_canon_lock requires a calling agent (exec.agent was undefined)')
        }
        const request = manageNovelCanonLockSchema.parse(args)
        const cwd = agent.session.header.cwd
        if (cwd === undefined) {
          throw new Error('manage_novel_canon_lock requires the calling agent session to have a cwd')
        }
        const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
        if (workspace === undefined) {
          throw new Error(`manage_novel_canon_lock found no DSH Workspace for calling agent cwd '${cwd}'`)
        }
        const locks = await this.manageCanonLock(workspace.id, request)
        return { locks: [...locks] as unknown as JsonValue[] }
      },
    }))


    this.ctx.tools.register(defineTool({
      name: 'propose_novel_result_packet',
      description: 'Submit one complete, authorization-free Result Packet draft for author review. Write packets include manuscript and manuscriptDiff; project setup may omit both and propose only creative-profile / reader-contract Canon Deltas. The stock DSH tool call/result records the proposal and never advances accepted Canon. Anchors are optional: `sourceAnchors: []` and an empty `sourceAnchorIds` are valid for a change that is not tied to existing manuscript text, and a source anchor must never carry a guessed hash — if you cannot compute the exact SHA-256 of the exact byte range, submit with no anchor instead of inventing one.',
      parameters: {
        packet: {
          type: 'json',
          required: true,
          description: 'A complete Novel Result Packet draft without authorization, targeting the current accepted revision.',
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
      presentCall: () => ({
        card: 'generic',
        title: 'Propose novel Result Packet',
      }),
      presentResult: () => ({
        card: 'generic',
        title: 'Novel Result Packet ready for review',
      }),
      execute: async (args, exec) => {
        const agent = exec.agent
        if (agent === undefined) {
          throw new Error('propose_novel_result_packet requires a calling agent (exec.agent was undefined)')
        }
        const cwd = agent.session.header.cwd
        if (cwd === undefined) {
          throw new Error('propose_novel_result_packet requires the calling agent session to have a cwd')
        }
        const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
        if (workspace === undefined) {
          throw new Error(`propose_novel_result_packet found no DSH Workspace for calling agent cwd '${cwd}'`)
        }
        const packet = this.parseDraft(args.packet)
        const project = this.requireProjects().get(workspace.id)
        if (project === undefined) {
          throw new Error(`novel project for Workspace '${workspace.id}' does not exist`)
        }
        this.ctx.get('novelWriting')?.recordProposal(exec, packet, project.acceptedRevision)
        if (project.acceptedRevision !== packet.expectedRevision) {
          throw new NovelProjectRevisionConflictError(
            packet.expectedRevision,
            project.acceptedRevision,
          )
        }
        const recorded: NovelResultPacketDraft = {
          ...packet,
          provenance: {
            ...packet.provenance,
            sessionId: agent.id,
          },
        }
        await this.recordPendingProposal(workspace.id, recorded)
        return {
          packet: recorded as unknown as JsonValue,
        }
      },
    }))


    this.ctx.tools.register(defineTool({
      name: 'simulate_novel_story_world',
      description: 'Run one bounded proposal-only counterfactual action trace, an isolated role comparison, an ordered shared-state encounter, a sequential multi-seed experiment, an explicit branch comparison, or a branch-by-seed variance matrix against a frozen accepted Novel Project revision. The result never advances Canon.',
      parameters: {
        mode: {
          type: 'string',
          description: "Use 'shared-encounter' for ordered actors sharing counterfactual effects, or 'role-comparison' for an explicit isolated comparison.",
        },
        revision: {
          type: 'integer',
          required: true,
          description: 'The accepted revision frozen for this SimulationRun.',
        },
        maxActions: {
          type: 'integer',
          description: 'Positive upper bound for ordered actions in each child trace. Defaults to one.',
        },
        storyTime: {
          type: 'string',
          required: true,
          description: 'The story-time position at which the inhabitant acts.',
        },
        hypothesis: {
          type: 'string',
          required: true,
          description: 'The counterfactual situation to test.',
        },
        assumptions: {
          type: 'json',
          required: true,
          description: 'Explicit assumptions for this counterfactual run as a string array.',
        },
        actor: {
          type: 'json',
          description: 'One inhabitant id, goal, resources and exact accepted Canon fact references available to that role.',
        },
        actors: {
          type: 'json',
          description: 'At least two inhabitants in input order. Role comparison isolates them; shared-encounter uses this order as turn order while exposing only each role-visible prior effects.',
        },
        seed: {
          type: 'string',
          description: 'Optional deterministic replay seed used to derive a stable replay key; it does not make model output deterministic.',
        },
        seeds: {
          type: 'json',
          description: 'Optional array of at least two seeds. Each seed starts an independent story-world child in order, then the Tool summarizes action variance.',
        },
        branches: {
          type: 'json',
          description: 'Optional array of at least two explicit alternatives with id, hypothesis and assumptions. Each branch starts from the same frozen role state; combine with seeds for branch-major, seed-minor variance.',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            run: { type: 'json', required: true },
          },
        },
        render: (_args, value) => [{
          type: 'text',
          text: JSON.stringify(value.run, null, 2),
        }],
      },
      presentCall: args => ({
        card: 'generic',
        title: `Simulate story world R${String(args.revision)}`,
      }),
      presentResult: () => ({
        card: 'generic',
        title: 'Story-world simulation ready',
      }),
      execute: async (args, exec) => {
        const agent = exec.agent
        if (agent === undefined) {
          throw new Error('simulate_novel_story_world requires a calling agent (exec.agent was undefined)')
        }
        const cwd = agent.session.header.cwd
        if (cwd === undefined) {
          throw new Error('simulate_novel_story_world requires the calling agent session to have a cwd')
        }
        const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
        if (workspace === undefined) {
          throw new Error(`simulate_novel_story_world found no DSH Workspace for calling agent cwd '${cwd}'`)
        }
        const request = storyWorldSimulationRequestSchema.parse(args)
        const run: StoryWorldSimulationResult = request.actors !== undefined
          ? request.mode === 'shared-encounter'
            ? await this.simulateSharedStoryWorldEncounter(
                agent,
                workspace.id,
                request,
                exec.signal,
              )
            : await this.compareStoryWorldRoles(
                agent,
                workspace.id,
                request,
                exec.signal,
              )
          : request.branches !== undefined
          && request.seeds !== undefined
          ? await this.compareStoryWorldBranchesAcrossSeeds(
              agent,
              workspace.id,
              request,
              request.branches,
              request.seeds,
              exec.signal,
            )
          : request.branches !== undefined
          ? await this.compareStoryWorldBranches(
              agent,
              workspace.id,
              request,
              request.branches,
              exec.signal,
            )
          : request.seeds === undefined
            ? await this.simulateStoryWorld(
              agent,
              workspace.id,
              request,
              exec.signal,
            )
            : await this.simulateStoryWorldExperiment(
              agent,
              workspace.id,
              request,
              request.seeds,
              exec.signal,
            )
        return { run: run as unknown as JsonValue }
      },
    }))

    this.ctx.tools.register(defineTool({
      name: 'simulate_novel_reader_response',
      description: 'Run one proposal-only synthetic reader response, a sequential multi-seed experiment, an explicit candidate comparison, a configured Persona comparison, an accepted/candidate variant comparison, a real-feedback calibration, or a candidate-by-Persona matrix against frozen accepted manuscript text or unaccepted alternatives. Readers see no hidden Canon and the result never advances Canon.',
      parameters: {
        revision: {
          type: 'integer',
          required: true,
          description: 'The frozen accepted Novel Project baseline. R0 is valid for explicit candidate-only experiments.',
        },
        unitId: {
          type: 'string',
          required: true,
          description: 'The experiment unit id; it must identify accepted manuscript text when no explicit candidate is supplied.',
        },
        hypothesis: {
          type: 'string',
          required: true,
          description: 'The reader-response question to test.',
        },
        persona: {
          type: 'json',
          description: 'One configured audience persona with an id and description. Use either persona or personas.',
        },
        personas: {
          type: 'json',
          description: 'Optional array of at least two audience personas with unique ids. Requires seeds and compares every Persona over the same text and reading history; combine with candidates for a candidate-by-Persona matrix.',
        },
        readingHistory: {
          type: 'json',
          required: true,
          description: 'Only the prior presented reading history available to this persona, as a string array.',
        },
        candidate: {
          type: 'json',
          description: 'Optional unaccepted manuscript candidate with an id and complete text. Omit to present the accepted unit text.',
        },
        candidates: {
          type: 'json',
          description: 'Optional array of at least two unaccepted manuscript candidates with unique ids. Requires seeds and compares every candidate over the same persona or every configured Persona, history and ordered seed set.',
        },
        variants: {
          type: 'json',
          description: 'Optional ordered array of at least two unique accepted/candidate variants. Uses one persona and the shared optional seed to compare the accepted unit directly with explicit alternatives.',
        },
        feedback: {
          type: 'json',
          description: 'Optional consented, provenance-bearing real-reader evidence for the exact accepted text. Requires one persona and at least two seeds; calibration happens after synthetic runs and never enters child prompts.',
        },
        seed: {
          type: 'string',
          description: 'Optional deterministic replay seed used to derive a stable replay key; it does not make model output deterministic.',
        },
        seeds: {
          type: 'json',
          description: 'Optional array of at least two seeds. Each seed starts an independent reader child in order, then the Tool summarizes reaction variance.',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            run: { type: 'json', required: true },
          },
        },
        render: (_args, value) => [{
          type: 'text',
          text: JSON.stringify(value.run, null, 2),
        }],
      },
      presentCall: args => ({
        card: 'generic',
        title: `Simulate reader response R${String(args.revision)}`,
      }),
      presentResult: () => ({
        card: 'generic',
        title: 'Reader-response SimulationRun ready',
      }),
      execute: async (args, exec) => {
        const agent = exec.agent
        if (agent === undefined) {
          throw new Error('simulate_novel_reader_response requires a calling agent (exec.agent was undefined)')
        }
        const cwd = agent.session.header.cwd
        if (cwd === undefined) {
          throw new Error('simulate_novel_reader_response requires the calling agent session to have a cwd')
        }
        const workspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
        if (workspace === undefined) {
          throw new Error(`simulate_novel_reader_response found no DSH Workspace for calling agent cwd '${cwd}'`)
        }
        const request = readerResponseSimulationRequestSchema.parse(args)
        let run: ReaderResponseSimulationResult
        if (request.feedback !== undefined) {
          run = await this.calibrateReaderResponseFeedback(
            agent,
            workspace.id,
            request as FeedbackCalibrationReaderResponseRequest,
            exec.signal,
          )
        } else if (request.variants !== undefined) {
          run = await this.compareReaderResponseVariants(
            agent,
            workspace.id,
            request as VariantComparisonReaderResponseRequest,
            request.variants,
            exec.signal,
          )
        } else if (request.personas !== undefined && request.candidates !== undefined) {
          run = await this.compareReaderResponseCandidatePersonas(
            agent,
            workspace.id,
            request as CandidatePersonaComparisonReaderResponseRequest,
            request.candidates,
            request.personas,
            request.seeds!,
            exec.signal,
          )
        } else if (request.personas !== undefined) {
          run = await this.compareReaderResponsePersonas(
            agent,
            workspace.id,
            request as PersonaComparisonReaderResponseRequest,
            request.personas,
            request.seeds!,
            exec.signal,
          )
        } else {
          const singleRequest = request as SingleReaderResponseSimulationRequest
          run = request.candidates !== undefined
            ? await this.compareReaderResponseCandidates(
              agent,
              workspace.id,
              singleRequest,
              request.candidates,
              request.seeds!,
              exec.signal,
            )
            : request.seeds === undefined
              ? await this.simulateReaderResponse(
                agent,
                workspace.id,
                singleRequest,
                exec.signal,
              )
              : await this.simulateReaderResponseExperiment(
                agent,
                workspace.id,
                singleRequest,
                request.seeds,
                exec.signal,
              )
        }
        return { run: run as unknown as JsonValue }
      },
    }))


  }

  /** Run one role-scoped counterfactual action against an immutable accepted revision. */
  private async simulateStoryWorld(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: StoryWorldSingleActorSimulationRequest,
    signal: AbortSignal,
    sharedState?: readonly StoryWorldStateEntry[],
  ): Promise<StoryWorldSimulationRun> {
    const maxActions = request.maxActions ?? 1
    const canon = this.projectCanon(workspaceId, request.revision)
    const facts = new Map(canon.facts.map(fact => [
      canonFactKey(fact.kind, fact.targetId, fact.field),
      fact,
    ] as const))
    const knownFacts = request.actor.knowledge.map((reference) => {
      const fact = facts.get(canonFactKey(reference.kind, reference.targetId, reference.field))
      if (fact === undefined) {
        throw new Error(
          `story-world knowledge fact '${reference.kind}:${reference.targetId}:${reference.field}' does not exist at accepted revision R${String(request.revision)}`,
        )
      }
      return fact
    })
    const acceptedVisibleState = buildStoryWorldInitialState(request.actor.resources, knownFacts)
    const initialState = sharedState === undefined
      ? acceptedVisibleState
      : projectStoryWorldVisibleState(acceptedVisibleState, sharedState)
    const frozenInput = deepFreeze({
      sourceRevision: request.revision,
      maxActions,
      ...(request.seed === undefined ? {} : { seed: request.seed }),
      storyTime: request.storyTime,
      hypothesis: request.hypothesis,
      assumptions: request.assumptions,
      actor: {
        id: request.actor.id,
        goal: request.actor.goal,
        resources: request.actor.resources,
        knownFacts,
      },
      initialState,
    })
    const prompt = [
      `Simulate between one and ${String(maxActions)} ordered counterfactual story-world actions for the supplied inhabitant.`,
      'The frozen role view below is the complete knowledge available to this inhabitant.',
      'initialState contains this role-visible accepted state after any visible effects from earlier encounter turns.',
      'Do not use hidden Canon, author intent, future outline, parent conversation or manuscript facts that are absent from knownFacts.',
      'Return ordered typed actions whose preconditions reference the state produced by all prior actions, beginning with initialState.',
      'Return set/remove effects on those same typed resource/fact paths plus explicit limitations.',
      'This output is a proposal-only SimulationRun and cannot mutate Canon, files or accepted revisions.',
      JSON.stringify(frozenInput),
    ].join('\n\n')
    const run = await this.ctx.subagents.start('spawn', {
      label: `Story-world simulation R${String(request.revision)} · ${request.actor.id}`,
      prompt: [{ type: 'text', text: prompt }],
      parent: agent,
      signal,
      outputSchema: generatedStoryWorldOutputJsonSchema,
      toolFilter: { allow: [] },
    })
    const result = await settleSubagentRun(run)
    if (result.stopReason !== 'completed') {
      const diagnostic = result.diagnostic === undefined ? '' : `: ${result.diagnostic}`
      throw new Error(`story-world simulation subagent ended with ${result.stopReason}${diagnostic}`)
    }
    if (result.structured === undefined) {
      throw new Error('story-world simulation subagent completed without structured output')
    }
    const generated = generatedStoryWorldOutputSchema.parse(result.structured)
    if (generated.actions.length > maxActions) {
      throw new Error(
        `story-world simulation returned ${String(generated.actions.length)} actions, exceeding maxActions ${String(maxActions)}`,
      )
    }
    const trace = generated.actions.map(action => ({
      actorId: request.actor.id,
      ...action,
    }))
    const stateReplay = replayStoryWorldStateTransitions(initialState, trace)
    return deepFreeze({
      runId: run.id,
      sandbox: 'story-world',
      sourceRevision: request.revision,
      maxActions,
      ...(request.seed === undefined ? {} : { seed: request.seed }),
      replayKey: simulationReplayKey({
        sandbox: 'story-world',
        seed: request.seed,
        input: frozenInput,
        trace,
      }),
      storyTime: request.storyTime,
      hypothesis: request.hypothesis,
      assumptions: request.assumptions,
      actor: request.actor,
      knownFacts,
      trace,
      ...stateReplay,
      limitations: generated.limitations,
      provenance: {
        taskId: run.id,
        sessionId: agent.id,
        producer: 'novel-story-world-simulation',
      },
    })
  }

  /** Replay input-ordered actor turns over one shared proposal-only state. */
  private async simulateSharedStoryWorldEncounter(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: StoryWorldSharedEncounterRequest,
    signal: AbortSignal,
  ): Promise<StoryWorldSharedEncounter> {
    const canon = this.projectCanon(workspaceId, request.revision)
    const facts = new Map(canon.facts.map(fact => [
      canonFactKey(fact.kind, fact.targetId, fact.field),
      fact,
    ] as const))
    const initialStateMap = new Map<string, StoryWorldStateEntry>()
    for (const actor of request.actors) {
      const knownFacts = actor.knowledge.map((reference) => {
        const fact = facts.get(canonFactKey(reference.kind, reference.targetId, reference.field))
        if (fact === undefined) {
          throw new Error(
            `story-world knowledge fact '${reference.kind}:${reference.targetId}:${reference.field}' does not exist at accepted revision R${String(request.revision)}`,
          )
        }
        return fact
      })
      for (const entry of buildStoryWorldInitialState(actor.resources, knownFacts)) {
        initialStateMap.set(storyWorldStatePathKey(entry.path), entry)
      }
    }
    const initialState = storyWorldStateSnapshot(initialStateMap)
    let sharedState: readonly StoryWorldStateEntry[] = initialState
    const turns: StoryWorldSharedEncounterTurn[] = []
    for (const actor of request.actors) {
      const singleRoleRequest: StoryWorldSingleActorSimulationRequest = {
        revision: request.revision,
        maxActions: request.maxActions,
        storyTime: request.storyTime,
        hypothesis: request.hypothesis,
        assumptions: request.assumptions,
        actor,
        ...(request.seed === undefined ? {} : { seed: request.seed }),
      }
      const run = await this.simulateStoryWorld(
        agent,
        workspaceId,
        singleRoleRequest,
        signal,
        sharedState,
      )
      const replay = replayStoryWorldStateTransitions(sharedState, run.trace)
      turns.push({
        actor,
        before: sharedState,
        after: replay.finalState,
        run,
      })
      sharedState = replay.finalState
    }
    return deepFreeze({
      sandbox: 'story-world',
      mode: 'shared-encounter',
      sourceRevision: request.revision,
      maxActions: request.maxActions ?? 1,
      storyTime: request.storyTime,
      hypothesis: request.hypothesis,
      assumptions: request.assumptions,
      ...(request.seed === undefined ? {} : { seed: request.seed }),
      initialState,
      turns,
      finalState: sharedState,
    })
  }

  /** Compare independent role views without sharing one role's frozen input with another. */
  private async compareStoryWorldRoles(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: StoryWorldRoleComparisonRequest,
    signal: AbortSignal,
  ): Promise<StoryWorldRoleComparison> {
    const roles: StoryWorldRoleRun[] = []
    for (const actor of request.actors) {
      const singleRoleRequest: StoryWorldSingleActorSimulationRequest = {
        revision: request.revision,
        maxActions: request.maxActions,
        storyTime: request.storyTime,
        hypothesis: request.hypothesis,
        assumptions: request.assumptions,
        actor,
        ...(request.seed === undefined ? {} : { seed: request.seed }),
      }
      roles.push({
        actor,
        run: await this.simulateStoryWorld(
          agent,
          workspaceId,
          singleRoleRequest,
          signal,
        ),
      })
    }
    const firstRun = roles[0]!.run
    return deepFreeze({
      sandbox: 'story-world',
      mode: 'role-comparison',
      sourceRevision: firstRun.sourceRevision,
      maxActions: firstRun.maxActions,
      storyTime: request.storyTime,
      hypothesis: request.hypothesis,
      assumptions: request.assumptions,
      ...(request.seed === undefined ? {} : { seed: request.seed }),
      roles,
    })
  }

  /** Run independent story-world children sequentially and summarize action variance. */
  private async simulateStoryWorldExperiment(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: StoryWorldSingleActorSimulationRequest,
    seeds: readonly string[],
    signal: AbortSignal,
  ): Promise<StoryWorldSimulationExperiment> {
    const runs: StoryWorldSimulationRun[] = []
    for (const seed of seeds) {
      runs.push(await this.simulateStoryWorld(
        agent,
        workspaceId,
        { ...request, seed },
        signal,
      ))
    }
    const firstRun = runs[0]!
    const actionSummary = STORY_WORLD_ACTION_TYPES.map((type) => {
      const count = runs.filter(run => (
        run.trace.some(action => action.type === type)
      )).length
      return {
        type,
        count,
        total: runs.length,
        ratio: count / runs.length,
      }
    })
    return deepFreeze({
      sandbox: 'story-world',
      sourceRevision: firstRun.sourceRevision,
      maxActions: firstRun.maxActions,
      storyTime: firstRun.storyTime,
      hypothesis: firstRun.hypothesis,
      assumptions: firstRun.assumptions,
      actor: firstRun.actor,
      knownFacts: firstRun.knownFacts,
      seeds,
      runs,
      actionSummary,
    })
  }

  /** Compare explicit alternatives from the same frozen role state and seed. */
  private async compareStoryWorldBranches(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: StoryWorldSingleActorSimulationRequest,
    branches: readonly StoryWorldSimulationBranch[],
    signal: AbortSignal,
  ): Promise<StoryWorldSimulationBranchExperiment> {
    const branchRuns: StoryWorldSimulationBranchRun[] = []
    for (const branch of branches) {
      const run = await this.simulateStoryWorld(
        agent,
        workspaceId,
        {
          ...request,
          hypothesis: branch.hypothesis,
          assumptions: [...request.assumptions, ...branch.assumptions],
        },
        signal,
      )
      branchRuns.push({
        id: branch.id,
        hypothesis: branch.hypothesis,
        assumptions: run.assumptions,
        run,
      })
    }
    const firstRun = branchRuns[0]!.run
    const paths = new Map<string, StoryWorldStatePath>()
    const finalStates = branchRuns.map((branch) => {
      const entries = new Map<string, StoryWorldStateEntry>()
      for (const entry of branch.run.finalState) {
        const key = storyWorldStatePathKey(entry.path)
        paths.set(key, entry.path)
        entries.set(key, entry)
      }
      return entries
    })
    const stateComparison: StoryWorldBranchStateComparison[] = [...paths.entries()]
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, path]) => {
        const values = branchRuns.map((branch, index) => {
          const entry = finalStates[index]!.get(key)
          return entry === undefined
            ? { branchId: branch.id, present: false as const }
            : { branchId: branch.id, present: true as const, value: entry.value }
        })
        const first = values[0]!
        const differs = values.slice(1).some(value => (
          value.present !== first.present
          || (value.present && first.present && !canonValuesEqual(value.value, first.value))
        ))
        return { path, differs, branches: values }
      })
    return deepFreeze({
      sandbox: 'story-world',
      mode: 'branch-comparison',
      sourceRevision: firstRun.sourceRevision,
      maxActions: firstRun.maxActions,
      storyTime: request.storyTime,
      hypothesis: request.hypothesis,
      assumptions: request.assumptions,
      actor: firstRun.actor,
      knownFacts: firstRun.knownFacts,
      ...(request.seed === undefined ? {} : { seed: request.seed }),
      initialState: firstRun.initialState,
      branches: branchRuns,
      stateComparison,
    })
  }

  /** Compare explicit branches across ordered independent seeds. */
  private async compareStoryWorldBranchesAcrossSeeds(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: StoryWorldSingleActorSimulationRequest,
    branches: readonly StoryWorldSimulationBranch[],
    seeds: readonly string[],
    signal: AbortSignal,
  ): Promise<StoryWorldSimulationBranchSeedComparison> {
    const branchExperiments: StoryWorldSimulationBranchSeedExperiment[] = []
    for (const branch of branches) {
      const experiment = await this.simulateStoryWorldExperiment(
        agent,
        workspaceId,
        {
          ...request,
          branches: undefined,
          hypothesis: branch.hypothesis,
          assumptions: [...request.assumptions, ...branch.assumptions],
        },
        seeds,
        signal,
      )
      branchExperiments.push({
        id: branch.id,
        hypothesis: branch.hypothesis,
        assumptions: experiment.assumptions,
        experiment,
      })
    }
    const firstRun = branchExperiments[0]!.experiment.runs[0]!
    const paths = new Map<string, StoryWorldStatePath>()
    const experimentStates = branchExperiments.flatMap(branch => (
      branch.experiment.runs.map((run) => {
        const entries = new Map<string, StoryWorldStateEntry>()
        for (const entry of run.finalState) {
          const key = storyWorldStatePathKey(entry.path)
          paths.set(key, entry.path)
          entries.set(key, entry)
        }
        return { branchId: branch.id, seed: run.seed!, entries }
      })
    ))
    const stateComparison: StoryWorldBranchSeedStateComparison[] = [...paths.entries()]
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, path]) => {
        const values = experimentStates.map(({ branchId, seed, entries }) => {
          const entry = entries.get(key)
          return entry === undefined
            ? { branchId, seed, present: false as const }
            : { branchId, seed, present: true as const, value: entry.value }
        })
        const first = values[0]!
        const differs = values.slice(1).some(value => (
          value.present !== first.present
          || (value.present && first.present && !canonValuesEqual(value.value, first.value))
        ))
        return { path, differs, experiments: values }
      })
    return deepFreeze({
      sandbox: 'story-world',
      mode: 'branch-seed-comparison',
      sourceRevision: firstRun.sourceRevision,
      maxActions: firstRun.maxActions,
      storyTime: request.storyTime,
      hypothesis: request.hypothesis,
      assumptions: request.assumptions,
      actor: firstRun.actor,
      knownFacts: firstRun.knownFacts,
      seeds,
      initialState: firstRun.initialState,
      branches: branchExperiments,
      stateComparison,
    })
  }

  /** Run one synthetic reader perspective using only presented text and reading history. */
  private async simulateReaderResponse(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: SingleReaderResponseSimulationRequest,
    signal: AbortSignal,
  ): Promise<ReaderResponseSimulationRun> {
    const manuscripts = this.projectManuscripts(workspaceId, request.revision)
    let presentedText: string
    if (request.candidate === undefined) {
      const manuscript = manuscripts
        .find(candidate => candidate.manuscript.unitId === request.unitId)
      if (manuscript === undefined) {
        throw new Error(
          `reader-response manuscript unit '${request.unitId}' does not exist at accepted revision R${String(request.revision)}`,
        )
      }
      presentedText = manuscript.manuscript.text
    } else {
      presentedText = request.candidate.text
    }
    const presentedTextHash = createHash('sha256').update(presentedText).digest('hex')
    const frozenInput = deepFreeze({
      sourceRevision: request.revision,
      ...(request.seed === undefined ? {} : { seed: request.seed }),
      hypothesis: request.hypothesis,
      persona: request.persona,
      readingHistory: request.readingHistory,
      presentedText: request.candidate === undefined
        ? {
            unitId: request.unitId,
            text: presentedText,
          }
        : {
            unitId: request.unitId,
            source: 'candidate' as const,
            candidateId: request.candidate.id,
            contentHash: presentedTextHash,
            text: presentedText,
          },
    })
    const prompt = [
      'Simulate one synthetic reader response for the configured audience persona.',
      'The frozen presentedText and readingHistory below are the complete story information available to this reader. presentedText may be accepted prose or an explicit unaccepted candidate; evaluate only the supplied text.',
      'Do not use hidden Canon, future outline, author intent, story-world role knowledge or parent conversation.',
      'Return diagnostic hypotheses grounded in exact presented-text evidence for confusion, expectation, trust, boredom, fairness or emotion as applicable.',
      'Do not claim market representativeness, replace real readers or prescribe or perform automatic manuscript optimization.',
      'This output is a proposal-only SimulationRun and cannot mutate Canon, manuscript files or accepted revisions.',
      JSON.stringify(frozenInput),
    ].join('\n\n')
    const run = await this.ctx.subagents.start('spawn', {
      label: `Reader-response simulation R${String(request.revision)} · ${request.persona.id}`,
      prompt: [{ type: 'text', text: prompt }],
      parent: agent,
      signal,
      outputSchema: generatedReaderResponseOutputJsonSchema,
      toolFilter: { allow: [] },
    })
    const result = await settleSubagentRun(run)
    if (result.stopReason !== 'completed') {
      const diagnostic = result.diagnostic === undefined ? '' : `: ${result.diagnostic}`
      throw new Error(`reader-response simulation subagent ended with ${result.stopReason}${diagnostic}`)
    }
    if (result.structured === undefined) {
      throw new Error('reader-response simulation subagent completed without structured output')
    }
    const generated = generatedReaderResponseOutputSchema.parse(result.structured)
    const ungroundedReaction = generated.reactions
      .find(reaction => !presentedText.includes(reaction.evidence))
    if (ungroundedReaction !== undefined) {
      throw new Error(
        `reader-response reaction evidence ${JSON.stringify(ungroundedReaction.evidence)} does not occur in the presented text`,
      )
    }
    return deepFreeze({
      runId: run.id,
      sandbox: 'reader-response',
      sourceRevision: request.revision,
      ...(request.seed === undefined ? {} : { seed: request.seed }),
      replayKey: simulationReplayKey({
        sandbox: 'reader-response',
        seed: request.seed,
        input: frozenInput,
        trace: generated.reactions,
      }),
      unitId: request.unitId,
      hypothesis: request.hypothesis,
      persona: request.persona,
      readingHistory: request.readingHistory,
      presentedText,
      presentedTextSource: request.candidate === undefined ? 'accepted' : 'candidate',
      presentedTextHash,
      ...(request.candidate === undefined ? {} : { candidateId: request.candidate.id }),
      reactions: generated.reactions,
      marketRepresentative: false,
      limitations: generated.limitations,
      provenance: {
        taskId: run.id,
        sessionId: agent.id,
        producer: 'novel-reader-response-simulation',
      },
    })
  }

  /** Run independent reader children sequentially and summarize visible reaction variance. */
  private async simulateReaderResponseExperiment(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: SingleReaderResponseSimulationRequest,
    seeds: readonly string[],
    signal: AbortSignal,
  ): Promise<ReaderResponseSimulationExperiment> {
    const runs: ReaderResponseSimulationRun[] = []
    for (const seed of seeds) {
      runs.push(await this.simulateReaderResponse(
        agent,
        workspaceId,
        { ...request, seed },
        signal,
      ))
    }
    const firstRun = runs[0]!
    const dimensionSummary = READER_RESPONSE_DIMENSIONS.map((dimension) => {
      const count = runs.filter(run => (
        run.reactions.some(reaction => reaction.dimension === dimension)
      )).length
      return {
        dimension,
        count,
        total: runs.length,
        ratio: count / runs.length,
      }
    })
    return deepFreeze({
      sandbox: 'reader-response',
      sourceRevision: firstRun.sourceRevision,
      unitId: firstRun.unitId,
      hypothesis: firstRun.hypothesis,
      persona: firstRun.persona,
      readingHistory: firstRun.readingHistory,
      seeds,
      presentedText: firstRun.presentedText,
      presentedTextSource: firstRun.presentedTextSource,
      presentedTextHash: firstRun.presentedTextHash,
      ...(firstRun.candidateId === undefined ? {} : { candidateId: firstRun.candidateId }),
      runs,
      dimensionSummary,
      marketRepresentative: false,
    })
  }

  /** Compare unaccepted manuscript alternatives over one reader context and seed set. */
  private async compareReaderResponseCandidates(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: SingleReaderResponseSimulationRequest,
    candidates: readonly ReaderResponseCandidateInput[],
    seeds: readonly string[],
    signal: AbortSignal,
  ): Promise<ReaderResponseCandidateComparison> {
    const candidateExperiments: ReaderResponseCandidateExperiment[] = []
    for (const candidate of candidates) {
      const experiment = await this.simulateReaderResponseExperiment(
        agent,
        workspaceId,
        { ...request, candidate, candidates: undefined },
        seeds,
        signal,
      )
      candidateExperiments.push({
        candidateId: candidate.id,
        presentedTextHash: experiment.presentedTextHash,
        experiment,
      })
    }
    const dimensionComparison: ReaderResponseCandidateDimensionComparison[] =
      READER_RESPONSE_DIMENSIONS.map(dimension => ({
        dimension,
        candidates: candidateExperiments.map(({ candidateId, experiment }) => {
          const summary = experiment.dimensionSummary
            .find(candidate => candidate.dimension === dimension)!
          return {
            candidateId,
            count: summary.count,
            total: summary.total,
            ratio: summary.ratio,
          }
        }),
      }))
    return deepFreeze({
      sandbox: 'reader-response',
      mode: 'candidate-comparison',
      sourceRevision: request.revision,
      unitId: request.unitId,
      hypothesis: request.hypothesis,
      persona: request.persona,
      readingHistory: request.readingHistory,
      seeds,
      candidates: candidateExperiments,
      dimensionComparison,
      marketRepresentative: false,
    })
  }

  /** Compare configured reader cohorts over one frozen text, history and seed set. */
  private async compareReaderResponsePersonas(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: PersonaComparisonReaderResponseRequest,
    personas: readonly ReaderPersonaInput[],
    seeds: readonly string[],
    signal: AbortSignal,
  ): Promise<ReaderResponsePersonaComparison> {
    const personaExperiments: ReaderResponsePersonaExperiment[] = []
    for (const persona of personas) {
      const personaRequest: SingleReaderResponseSimulationRequest = {
        ...request,
        persona,
        personas: undefined,
      }
      const experiment = await this.simulateReaderResponseExperiment(
        agent,
        workspaceId,
        personaRequest,
        seeds,
        signal,
      )
      personaExperiments.push({ persona, experiment })
    }
    const firstExperiment = personaExperiments[0]!.experiment
    const dimensionComparison: ReaderResponsePersonaDimensionComparison[] =
      READER_RESPONSE_DIMENSIONS.map(dimension => ({
        dimension,
        personas: personaExperiments.map(({ persona, experiment }) => {
          const summary = experiment.dimensionSummary
            .find(candidate => candidate.dimension === dimension)!
          return {
            personaId: persona.id,
            count: summary.count,
            total: summary.total,
            ratio: summary.ratio,
          }
        }),
      }))
    return deepFreeze({
      sandbox: 'reader-response',
      mode: 'persona-comparison',
      sourceRevision: firstExperiment.sourceRevision,
      unitId: firstExperiment.unitId,
      hypothesis: firstExperiment.hypothesis,
      readingHistory: firstExperiment.readingHistory,
      seeds,
      presentedText: firstExperiment.presentedText,
      presentedTextSource: firstExperiment.presentedTextSource,
      presentedTextHash: firstExperiment.presentedTextHash,
      ...(firstExperiment.candidateId === undefined
        ? {}
        : { candidateId: firstExperiment.candidateId }),
      personas: personaExperiments,
      dimensionComparison,
      marketRepresentative: false,
    })
  }

  /** Compare every manuscript candidate and reader cohort over one ordered seed set. */
  private async compareReaderResponseCandidatePersonas(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: CandidatePersonaComparisonReaderResponseRequest,
    candidates: readonly ReaderResponseCandidateInput[],
    personas: readonly ReaderPersonaInput[],
    seeds: readonly string[],
    signal: AbortSignal,
  ): Promise<ReaderResponseCandidatePersonaComparison> {
    const comparedCandidates: ReaderResponseComparedCandidate[] = candidates.map(candidate => ({
      id: candidate.id,
      presentedTextHash: createHash('sha256').update(candidate.text).digest('hex'),
    }))
    const experiments: ReaderResponseCandidatePersonaExperiment[] = []
    for (const candidate of candidates) {
      for (const persona of personas) {
        const experiment = await this.simulateReaderResponseExperiment(
          agent,
          workspaceId,
          {
            ...request,
            persona,
            personas: undefined,
            candidate,
            candidates: undefined,
          },
          seeds,
          signal,
        )
        experiments.push({
          candidateId: candidate.id,
          presentedTextHash: experiment.presentedTextHash,
          persona,
          experiment,
        })
      }
    }
    const dimensionComparison: ReaderResponseCandidatePersonaDimensionComparison[] =
      READER_RESPONSE_DIMENSIONS.map(dimension => ({
        dimension,
        experiments: experiments.map(({ candidateId, persona, experiment }) => {
          const summary = experiment.dimensionSummary
            .find(candidate => candidate.dimension === dimension)!
          return {
            candidateId,
            personaId: persona.id,
            count: summary.count,
            total: summary.total,
            ratio: summary.ratio,
          }
        }),
      }))
    return deepFreeze({
      sandbox: 'reader-response',
      mode: 'candidate-persona-comparison',
      sourceRevision: request.revision,
      unitId: request.unitId,
      hypothesis: request.hypothesis,
      readingHistory: request.readingHistory,
      seeds,
      candidates: comparedCandidates,
      personas,
      experiments,
      dimensionComparison,
      marketRepresentative: false,
    })
  }

  /** Compare accepted prose and explicit candidates under one frozen reader definition. */
  private async compareReaderResponseVariants(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: VariantComparisonReaderResponseRequest,
    variants: readonly ReaderResponseVariantInput[],
    signal: AbortSignal,
  ): Promise<ReaderResponseVariantComparison> {
    const variantRuns: ReaderResponseVariantRun[] = []
    for (const variant of variants) {
      const run = await this.simulateReaderResponse(
        agent,
        workspaceId,
        {
          ...request,
          variants: undefined,
          candidate: variant.source === 'accepted'
            ? undefined
            : { id: variant.id, text: variant.text },
        },
        signal,
      )
      variantRuns.push({
        variantId: variant.id,
        presentedTextSource: run.presentedTextSource,
        presentedTextHash: run.presentedTextHash,
        run,
      })
    }
    const dimensionComparison: ReaderResponseVariantDimensionComparison[] =
      READER_RESPONSE_DIMENSIONS.map(dimension => ({
        dimension,
        variants: variantRuns.map(({ variantId, run }) => {
          const count = run.reactions.some(reaction => reaction.dimension === dimension) ? 1 : 0
          return {
            variantId,
            count,
            total: 1 as const,
            ratio: count as 0 | 1,
          }
        }),
      }))
    return deepFreeze({
      sandbox: 'reader-response',
      mode: 'variant-comparison',
      sourceRevision: request.revision,
      unitId: request.unitId,
      hypothesis: request.hypothesis,
      persona: request.persona,
      readingHistory: request.readingHistory,
      ...(request.seed === undefined ? {} : { seed: request.seed }),
      variants: variantRuns,
      dimensionComparison,
      marketRepresentative: false,
    })
  }

  /** Compare a multi-seed synthetic experiment with separate real-reader evidence. */
  private async calibrateReaderResponseFeedback(
    agent: Agent,
    workspaceId: DshWorkspaceId,
    request: FeedbackCalibrationReaderResponseRequest,
    signal: AbortSignal,
  ): Promise<ReaderResponseFeedbackCalibration> {
    const experiment = await this.simulateReaderResponseExperiment(
      agent,
      workspaceId,
      { ...request, feedback: undefined },
      request.seeds,
      signal,
    )
    const feedback = request.feedback
    if (feedback.revision !== experiment.sourceRevision) {
      throw new Error('reader-response feedback revision does not match the synthetic experiment')
    }
    if (feedback.unitId !== experiment.unitId) {
      throw new Error('reader-response feedback unit does not match the synthetic experiment')
    }
    if (feedback.presentedTextHash !== experiment.presentedTextHash) {
      throw new Error('reader-response feedback text hash does not match the synthetic experiment')
    }
    if (feedback.cohort.id !== experiment.persona.id) {
      throw new Error('reader-response feedback cohort does not match the synthetic Persona')
    }
    const calibration: ReaderResponseFeedbackCalibrationItem[] = feedback.observations
      .map((observation) => {
        const dimension = observation.category === 'comprehension'
          ? 'confusion' as const
          : observation.category === 'expectation'
            ? 'expectation' as const
            : observation.category === 'emotion'
              ? 'emotion' as const
              : undefined
        if (dimension === undefined) {
          return {
            observationId: observation.id,
            category: observation.category,
            status: 'unmapped' as const,
          }
        }
        if (observation.type === 'qualitative') {
          return {
            observationId: observation.id,
            category: observation.category,
            status: 'insufficient-data' as const,
            dimension,
          }
        }
        const syntheticRatio = experiment.dimensionSummary
          .find(summary => summary.dimension === dimension)!.ratio
        const observedRatio = observation.count / observation.total
        const ratioDelta = syntheticRatio - observedRatio
        return {
          observationId: observation.id,
          category: observation.category,
          status: 'compared' as const,
          dimension,
          syntheticRatio,
          observedRatio,
          ratioDelta,
          absoluteDelta: Math.abs(ratioDelta),
        }
      })
    return deepFreeze({
      sandbox: 'reader-response',
      mode: 'feedback-calibration',
      sourceRevision: experiment.sourceRevision,
      unitId: experiment.unitId,
      hypothesis: experiment.hypothesis,
      persona: experiment.persona,
      readingHistory: experiment.readingHistory,
      seeds: experiment.seeds,
      presentedTextHash: experiment.presentedTextHash,
      experiment,
      feedback,
      calibration,
      marketRepresentative: false,
    })
  }

  /** Resolve one accepted manuscript unit or one ordered Book and its publication target. */

  /** Open the one durable project bound to an existing DSH Workspace. */
  open(workspace: Workspace): Promise<NovelProject> {
    return this.enqueue(async () => {
      const projects = this.requireProjects()
      const existing = projects.get(workspace.id)
      if (existing !== undefined) {
        if (existing.workspaceId !== workspace.id || existing.cwd !== workspace.path) {
          throw new Error(`novel project '${existing.id}' has a conflicting DSH Workspace binding`)
        }
        return projectSnapshot(existing)
      }

      const project: NovelProjectRecord = deepFreeze({
        id: randomUUID(),
        workspaceId: workspace.id,
        cwd: workspace.path,
        acceptedRevision: 0,
        canonLocks: [],
        revisions: [],
        pendingProposals: [],
      })
      await projects.put(workspace.id, project)
      return projectSnapshot(project)
    })
  }

  /** Open the project identified by a DSH Workspace id through Typert Remote. */
  @Remote('open')
  remoteOpen(workspaceId: NovelWorkspaceId): Promise<NovelProject> {
    return this.open(this.requireWorkspace(workspaceId))
  }

  /**
   * Read one chapter draft file out of a workspace.
   *
   * A chapter draft is the author's own file in their workdir — the medium the
   * editor writes into before anything is ever proposed. This service is only
   * the transport for it: reading a draft here advances nothing, and the version
   * token it returns is what a later write guards against.
   */
  @Remote('readChapterFile')
  async remoteReadChapterFile(
    workspaceId: NovelWorkspaceId,
    relativePath: string,
  ): Promise<NovelChapterFileRead> {
    const workspace = this.requireWorkspace(workspaceId)
    let target
    try {
      target = await this.ctx.fs.resolve(relativePath, { cwd: workspace.path })
    } catch (error) {
      return { state: 'unreadable', reason: describeFsFailure(error) }
    }
    const info = await this.ctx.fs.stat(target)
    if (info === undefined) return { state: 'missing' }
    if (info.type !== 'file') return { state: 'unreadable', reason: '这个路径不是正文文件。' }
    try {
      return { state: 'ok', text: await this.ctx.fs.readText(target), version: String(info.version) }
    } catch (error) {
      return { state: 'unreadable', reason: describeFsFailure(error) }
    }
  }

  /**
   * Write one chapter draft file.
   *
   * `expectedVersion` is the token the read returned. A mismatch means the file
   * moved under us — the author edited it in their own editor, or another window
   * saved — so the write is refused rather than overwriting their work, and the
   * caller gets the current version to re-read against. Nothing here advances
   * Canon: only an accepted Result Packet does that.
   */
  @Remote('writeChapterFile')
  async remoteWriteChapterFile(
    workspaceId: NovelWorkspaceId,
    relativePath: string,
    text: string,
    expectedVersion: string,
  ): Promise<NovelChapterFileWrite> {
    const workspace = this.requireWorkspace(workspaceId)
    let target
    try {
      target = await this.ctx.fs.resolve(relativePath, { cwd: workspace.path })
    } catch (error) {
      return { state: 'unwritable', reason: describeFsFailure(error) }
    }
    const expected: FsWriteIntent | undefined = expectedVersion === ''
      ? undefined
      : { kind: 'replaceIfVersion', version: FsVersion(expectedVersion) }
    try {
      const outcome = await this.ctx.fs.writeText(target, text, expected, undefined, this.ctx.sandboxPolicy.resolve())
      return { state: 'ok', version: String(outcome.version) }
    } catch (error) {
      if (fsErrorCode(error) === 'FS_STALE_VERSION') {
        // The one failure the editor handles by re-reading, so it is a state and
        // not a message. `stat` supplies the version to re-read against.
        const current = await this.ctx.fs.stat(target).catch(() => undefined)
        if (current !== undefined) return { state: 'conflict', version: String(current.version) }
      }
      return { state: 'unwritable', reason: describeFsFailure(error) }
    }
  }

  /** Read the current project head without creating a project record. */
  @Remote('current')
  current(workspaceId: NovelWorkspaceId): NovelProject | undefined {
    const workspace = this.requireWorkspace(workspaceId)
    const project = this.requireProjects().get(workspace.id)
    return project === undefined ? undefined : projectSnapshot(project)
  }

  /** Read the durable proposals that still await an author decision. */
  pendingProposals(workspaceId: DshWorkspaceId): readonly NovelPendingProposal[] {
    const project = this.requireProjects().get(workspaceId)
    if (project === undefined) return []
    return deepFreeze(project.pendingProposals.map(proposal => structuredClone(proposal)))
  }

  /** Read the pending proposal inbox through Typert Remote for the selected Workspace. */
  @Remote('pendingProposals')
  remotePendingProposals(workspaceId: NovelWorkspaceId): readonly NovelPendingProposal[] {
    return this.pendingProposals(this.requireWorkspace(workspaceId).id)
  }

  /** Drop one pending proposal without touching Canon; missing ids are a no-op. */
  async discardProposal(
    workspaceId: DshWorkspaceId,
    packetId: string,
  ): Promise<readonly NovelPendingProposal[]> {
    const id = z.string().min(1).parse(packetId)
    const updated = await this.requireProjects().update(workspaceId, current => deepFreeze({
      ...current,
      pendingProposals: current.pendingProposals.filter(proposal => proposal.packetId !== id),
    } satisfies NovelProjectRecord))
    return deepFreeze(updated.pendingProposals.map(proposal => structuredClone(proposal)))
  }

  /** Drop one pending proposal through Typert Remote while Canon authority stays in Core. */
  @Remote('discardProposal')
  remoteDiscardProposal(
    workspaceId: NovelWorkspaceId,
    packetId: string,
  ): Promise<readonly NovelPendingProposal[]> {
    return this.discardProposal(this.requireWorkspace(workspaceId).id, packetId)
  }

  /** Store one complete proposal in the durable inbox, replacing the same packet id. */
  private async recordPendingProposal(
    workspaceId: DshWorkspaceId,
    packet: NovelResultPacketDraft,
  ): Promise<void> {
    await this.requireProjects().update(workspaceId, current => deepFreeze({
      ...current,
      pendingProposals: [
        ...current.pendingProposals.filter(proposal => proposal.packetId !== packet.packetId),
        deepFreeze({
          packetId: packet.packetId,
          receivedAt: Date.now(),
          producer: packet.provenance.producer,
          packet,
        } satisfies NovelPendingProposal),
      ].slice(-NOVEL_PENDING_PROPOSAL_LIMIT),
    } satisfies NovelProjectRecord))
  }

  /** Persist one author-approved Canon lock change in the sole project record. */
  private async manageCanonLock(
    workspaceId: DshWorkspaceId,
    request: z.infer<typeof manageNovelCanonLockSchema>,
  ): Promise<readonly NovelCanonLock[]> {
    const updated = await this.requireProjects().update(workspaceId, (current) => {
      if (current.acceptedRevision !== request.expectedRevision) {
        throw new NovelProjectRevisionConflictError(
          request.expectedRevision,
          current.acceptedRevision,
        )
      }
      const key = canonFactKey(request.kind, request.targetId, request.field)
      if (request.action === 'unlock') {
        return deepFreeze({
          ...current,
          canonLocks: current.canonLocks.filter(lock => (
            canonFactKey(lock.kind, lock.targetId, lock.field) !== key
          )),
        } satisfies NovelProjectRecord)
      }
      const accepted = buildCanonProjection(current, current.acceptedRevision).facts.find(fact => (
        canonFactKey(fact.kind, fact.targetId, fact.field) === key
      ))
      if (accepted === undefined) {
        throw new Error(
          `Canon fact '${request.kind}:${request.targetId}:${request.field}' is not accepted at R${String(request.expectedRevision)}`,
        )
      }
      const lock: NovelCanonLock = {
        kind: request.kind,
        targetId: accepted.targetId,
        field: accepted.field,
        value: accepted.value,
      }
      return deepFreeze({
        ...current,
        canonLocks: [
          ...current.canonLocks.filter(existing => (
            canonFactKey(existing.kind, existing.targetId, existing.field) !== key
          )),
          lock,
        ].sort(compareCanonLocks),
      } satisfies NovelProjectRecord)
    })
    return deepFreeze([...updated.canonLocks])
  }

  /** Assert the canonical head for a domain read/compute operation without exposing mutable state. */
  assertCurrentRevision(workspaceId: NovelWorkspaceId, expectedRevision: number): NovelProject {
    const workspace = this.requireWorkspace(workspaceId)
    const project = this.current(workspace.id)
    if (project === undefined) {
      throw new Error(`novel project for Workspace '${workspace.id}' does not exist`)
    }
    if (project.acceptedRevision !== expectedRevision) {
      throw new NovelProjectRevisionConflictError(expectedRevision, project.acceptedRevision)
    }
    return project
  }

  /** Use native Agent lookup to reuse or resume the author Session before review. */
  @Remote('reviewDraft')
  async remoteReviewDraft(
    sessionId: string,
    workspaceId: NovelWorkspaceId,
    request: NovelReviewDraftRequest,
    signal: AbortSignal,
  ): Promise<NovelResultPacketDraft> {
    const review = this.requireNovelReview()
    // The published generator only accepts workspace-owned lookup wire types.
    const agent = await this.ctx.typert.lookups.get('agent')!.resolve(SessionId(sessionId)) as Agent
    const workspace = await this.requireAgentWorkspace(agent, workspaceId)
    return this.ctx.agents.withInitiator(
      agent,
      () => review.reviewDraft(agent, workspace.id, request, signal),
    )
  }

  /**
   * Accept one reviewable Result Packet against the current project head.
   * DSH storage-domain serializes this single-record update; the synchronous
   * revision comparison and the one durable record replacement are therefore
   * one CAS transaction for manuscript, typed deltas, provenance and decision.
   */
  async accept(
    workspaceId: DshWorkspaceId,
    packet: unknown,
  ): Promise<AcceptedNovelRevision> {
    const parsed = novelResultPacketSchema.parse(packet)
    return this.review(workspaceId, {
      packet: parsed,
      decisions: [
        ...(parsed.manuscript === undefined
          ? []
          : [{
              itemType: 'manuscript' as const,
              itemId: parsed.manuscript.unitId,
              outcome: 'accept' as const,
            }]),
        ...parsed.deltas.map(delta => ({
          itemType: 'delta' as const,
          itemId: delta.id,
          outcome: 'accept' as const,
        })),
        ...parsed.issues.map(issue => ({
          itemType: 'issue' as const,
          itemId: issue.id,
          outcome: 'accept' as const,
        })),
      ],
    })
  }

  /** Apply selected items and publish their revision to the live Session named by packet provenance. */
  async review(
    workspaceId: DshWorkspaceId,
    command: unknown,
  ): Promise<AcceptedNovelRevision> {
    const parsed = reviewNovelResultPacketSchema.parse(command)
    this.validateDeltas(parsed.packet.deltas)
    const session = this.requireMutationSession(parsed.packet.provenance.sessionId)
    const updated = await this.requireProjects().update(workspaceId, (current) => {
      const projected = buildReviewCandidate(current, parsed)
      this.validateProjectors(current, projected.project)
      const accepted = deepFreeze({
        ...projected.revision,
        authorization: parsed.packet.authorization,
      } satisfies AcceptedNovelRevision)
      return deepFreeze({
        ...current,
        acceptedRevision: accepted.revision,
        revisions: [...current.revisions, accepted],
        pendingProposals: current.pendingProposals
          .filter(proposal => proposal.packetId !== accepted.packetId),
      } satisfies NovelProjectRecord)
    })
    const accepted = updated.revisions.at(-1)!
    // The complete Canon revision is durable above; this event is a derived notification.
    session.append('novel/canon/accepted', {
      projectId: updated.id,
      revision: accepted.revision,
      deltaRefs: accepted.deltas.map(delta => delta.id),
      sourceSessionId: session.id,
    }, { ignorable: true })
    await this.ctx.sessions.flush(session)
    return revisionSnapshot(accepted)
  }

  /** Compare Canon and Planning changes, adding Memory's causal contribution only while installed. */
  private buildRevisionImpact(
    project: NovelProjectProjectionRecord,
    fromRevision: number,
    toRevision: number,
    toCanon: NovelCanonProjection,
    toManuscripts: readonly NovelManuscriptProjection[],
    narrative?: { readonly from: NovelNarrativeProjection; readonly to: NovelNarrativeProjection },
  ): NovelRevisionImpact {
    const fromCanon = buildCanonProjection(project, fromRevision)
    const fromManuscripts = buildManuscriptProjection(project, fromRevision)
    const impact = {
      fromRevision,
      toRevision,
      manuscripts: compareRevisionProjections(
        fromManuscripts,
        toManuscripts,
        projected => projected.manuscript.unitId,
        (left, right) => left.manuscript.title === right.manuscript.title
          && left.manuscript.text === right.manuscript.text,
      ),
      canonFacts: compareRevisionProjections(
        fromCanon.facts,
        toCanon.facts,
        fact => JSON.stringify([fact.kind, fact.targetId, fact.field]),
        (left, right) => canonValuesEqual(left.value, right.value),
      ),
    }
    if (narrative === undefined) return deepFreeze(impact)
    const { from: fromNarrative, to: toNarrative } = narrative
    const fromClockEntries = fromNarrative.clocks.flatMap(bucket => bucket.entries)
    const toClockEntries = toNarrative.clocks.flatMap(bucket => bucket.entries)
    const fromDebts = fromNarrative.clocks.flatMap(bucket => bucket.debts)
    const toDebts = toNarrative.clocks.flatMap(bucket => bucket.debts)
    const memory = this.ctx.get('novelMemory')
    const causalConsequences = memory === undefined ? undefined : memory.compareCausalConsequences(
      memory.projectGraph(buildCanonSnapshot(project, fromRevision), fromCanon, fromNarrative, project.acceptedRevision),
      memory.projectGraph(buildCanonSnapshot(project, toRevision), toCanon, toNarrative, project.acceptedRevision),
    )
    return deepFreeze({
      ...impact,
      narrativeUnits: compareRevisionProjections(
        fromNarrative.units,
        toNarrative.units,
        unit => unit.id,
        (left, right) => canonicalizeJsonValue({
          level: left.level,
          parentId: left.parentId,
          order: left.order,
          objective: left.objective,
          entryState: left.entryState,
          exitState: left.exitState,
          status: left.status,
        }) === canonicalizeJsonValue({
          level: right.level,
          parentId: right.parentId,
          order: right.order,
          objective: right.objective,
          entryState: right.entryState,
          exitState: right.exitState,
          status: right.status,
        }),
      ),
      clockEntries: compareRevisionProjections(
        fromClockEntries,
        toClockEntries,
        entry => narrativeClockIdentity(entry.clock, entry.unitId),
        (left, right) => canonicalizeJsonValue(left.delta.value)
          === canonicalizeJsonValue(right.delta.value),
      ),
      debts: compareRevisionProjections(
        fromDebts,
        toDebts,
        debt => narrativeClockIdentity(debt.clock, debt.id),
        (left, right) => canonicalizeJsonValue({
          unitId: left.unitId,
          summary: left.summary,
          status: left.status,
          horizon: left.horizon,
          dependsOn: left.dependsOn,
        }) === canonicalizeJsonValue({
          unitId: right.unitId,
          summary: right.summary,
          status: right.status,
          horizon: right.horizon,
          dependsOn: right.dependsOn,
        }),
      ),
      ...(causalConsequences === undefined ? {} : { causalConsequences }),
    })
  }

  /** Project the selected Result Packet decisions without writing a revision or authorization. */
  previewReview(
    workspaceId: DshWorkspaceId,
    command: unknown,
  ): NovelResultPacketImpactPreview {
    const parsed = reviewNovelResultPacketDraftSchema.parse(command)
    this.validateDeltas(parsed.packet.deltas)
    const current = this.requireProjects().get(workspaceId)
    if (current === undefined) {
      throw new Error(`novel project for Workspace '${workspaceId}' does not exist`)
    }
    const projected = buildReviewCandidate(current, parsed)
    this.validateProjectors(current, projected.project)
    const revision = projected.revision.revision
    const canon = buildCanonProjection(projected.project, revision)
    const narrative = this.projectors.has('planning/narrative')
      ? {
          from: this.projectDomain<NovelNarrativeProjection>('planning/narrative', current, current.acceptedRevision),
          to: this.projectDomain<NovelNarrativeProjection>('planning/narrative', projected.project, revision),
        }
      : undefined
    const manuscripts = buildManuscriptProjection(projected.project, revision)
    return deepFreeze({
      expectedRevision: parsed.packet.expectedRevision,
      projectedRevision: revision,
      impact: this.buildRevisionImpact(
        projected.project,
        current.acceptedRevision,
        revision,
        canon,
        manuscripts,
        narrative,
      ),
    })
  }

  /** Preview through native Agent lookup so a persisted author Session can resume. */
  @Remote('previewReview')
  async remotePreviewReview(
    sessionId: string,
    workspaceId: NovelWorkspaceId,
    command: ReviewNovelResultPacket,
  ): Promise<NovelResultPacketImpactPreview> {
    const agent = await this.ctx.typert.lookups.get('agent')!.resolve(SessionId(sessionId)) as Agent
    const workspace = await this.requireAgentWorkspace(agent, workspaceId)
    return this.ctx.agents.withInitiator(agent, () => this.previewReview(workspace.id, {
      packet: this.bindDraftToAgent(agent, command.packet),
      decisions: command.decisions,
    }))
  }

  /** Apply author decisions using the live or natively resumed Session identity. */
  @Remote('review')
  async remoteReview(
    sessionId: string,
    workspaceId: NovelWorkspaceId,
    command: ReviewNovelResultPacket,
  ): Promise<AcceptedNovelRevision> {
    const agent = await this.ctx.typert.lookups.get('agent')!.resolve(SessionId(sessionId)) as Agent
    const workspace = await this.requireAgentWorkspace(agent, workspaceId)
    return this.ctx.agents.withInitiator(agent, () => this.review(workspace.id, {
      packet: this.authorizeDraft(agent, command.packet),
      decisions: command.decisions,
    }))
  }

  /** Restore a prior aggregate and publish the new revision to the live provenance Session. */
  async rollback(
    workspaceId: DshWorkspaceId,
    command: unknown,
  ): Promise<AcceptedNovelRevision> {
    const parsed = rollbackNovelRevisionSchema.parse(command)
    const session = this.requireMutationSession(parsed.provenance.sessionId)
    const updated = await this.requireProjects().update(workspaceId, (current) => {
      if (current.acceptedRevision !== parsed.expectedRevision) {
        throw new NovelProjectRevisionConflictError(
          parsed.expectedRevision,
          current.acceptedRevision,
        )
      }
      const target = current.revisions.find(
        candidate => candidate.revision === parsed.targetRevision,
      )
      if (target === undefined) {
        throw new NovelProjectRevisionNotFoundError(parsed.targetRevision)
      }
      const lockConflict = findCanonProjectionLockConflict(
        current.canonLocks,
        buildCanonProjection(current, target.revision),
      )
      if (lockConflict !== undefined) {
        throw new NovelProjectCanonLockConflictError(lockConflict)
      }
      const accepted = deepFreeze({
        revision: current.acceptedRevision + 1,
        parentRevision: current.acceptedRevision,
        packetId: parsed.commandId,
        ...(target.manuscript === undefined ? {} : { manuscript: target.manuscript }),
        deltas: target.deltas,
        issues: target.issues,
        decisions: target.decisions,
        sourceAnchors: target.sourceAnchors,
        provenance: parsed.provenance,
        authorization: parsed.authorization,
        rollbackOfRevision: target.revision,
      } satisfies AcceptedNovelRevision)
      return deepFreeze({
        ...current,
        acceptedRevision: accepted.revision,
        revisions: [...current.revisions, accepted],
      })
    })
    const accepted = updated.revisions.at(-1)!
    session.append('novel/canon/rolled-back', {
      projectId: updated.id,
      revision: accepted.revision,
      deltaRefs: accepted.deltas.map(delta => delta.id),
      sourceSessionId: session.id,
    }, { ignorable: true })
    await this.ctx.sessions.flush(session)
    return revisionSnapshot(accepted)
  }

  /** Append an auditable rollback using the natively resolved author Session. */
  @Remote('rollback')
  async remoteRollback(
    sessionId: string,
    workspaceId: NovelWorkspaceId,
    command: RollbackNovelRevision,
  ): Promise<AcceptedNovelRevision> {
    const agent = await this.ctx.typert.lookups.get('agent')!.resolve(SessionId(sessionId)) as Agent
    const workspace = await this.requireAgentWorkspace(agent, workspaceId)
    const decisionId = randomUUID()
    return this.ctx.agents.withInitiator(agent, () => this.rollback(workspace.id, {
      commandId: `rollback-${decisionId}`,
      expectedRevision: command.expectedRevision,
      targetRevision: command.targetRevision,
      provenance: {
        taskId: `rollback-${decisionId}`,
        sessionId: agent.id,
        producer: 'novel-project-remote',
      },
      authorization: {
        kind: 'author',
        actorId: agent.id,
        decisionId,
      },
    }))
  }

  /** Read one immutable accepted revision without exposing a Canon mutation surface. */
  readRevision(
    workspaceId: DshWorkspaceId,
    revision: number,
  ): AcceptedNovelRevision | undefined {
    const project = this.requireProjects().get(workspaceId)
    const accepted = project?.revisions.find(candidate => candidate.revision === revision)
    return accepted === undefined ? undefined : revisionSnapshot(accepted)
  }

  /** Compare two accepted versions while keeping generic revision authority in Canon. */
  readRevisionImpact(workspaceId: DshWorkspaceId, fromRevision: number, toRevision: number): NovelRevisionImpact {
    const canon = this.projectCanon(workspaceId, toRevision)
    this.projectCanon(workspaceId, fromRevision)
    const project = this.requireProjects().get(workspaceId)!
    const narrative = this.projectors.has('planning/narrative') ? {
      from: this.projectDomain<NovelNarrativeProjection>('planning/narrative', project, fromRevision),
      to: this.projectDomain<NovelNarrativeProjection>('planning/narrative', project, toRevision),
    } : undefined
    return this.buildRevisionImpact(project, fromRevision, toRevision, canon, this.projectManuscripts(workspaceId, toRevision), narrative)
  }

  /** Rebuild the authoritative Canon view for an accepted revision. */
  projectCanon(
    workspaceId: DshWorkspaceId,
    revision: number,
  ): NovelCanonProjection {
    const targetRevision = revisionSchema.parse(revision)
    const project = this.requireProjects().get(workspaceId)
    if (project === undefined) {
      throw new Error(`novel project for Workspace '${workspaceId}' does not exist`)
    }
    if (targetRevision > project.acceptedRevision) {
      throw new NovelProjectRevisionNotFoundError(targetRevision)
    }
    return buildCanonProjection(project, targetRevision)
  }

  /** Resolve the current author locks against the requested Canon revision for domain readers. */
  readCanonLockResolution(workspaceId: DshWorkspaceId, revision: number): NovelChapterControlPack['canonLockResolution'] {
    const project = this.current(workspaceId)!
    const canon = this.projectCanon(workspaceId, revision)
    const factsByKey = new Map(canon.facts.map(fact => [
      canonFactKey(fact.kind, fact.targetId, fact.field),
      fact,
    ] as const))
    const resolvedCanonLocks: NovelChapterControlPack['canonLockResolution']['resolved'][number][] = []
    const unavailableCanonLocks: NovelCanonLock[] = []
    for (const lock of [...project.canonLocks].sort(compareCanonLocks)) {
      const fact = factsByKey.get(canonFactKey(lock.kind, lock.targetId, lock.field))
      if (fact === undefined || !canonValuesEqual(fact.value, lock.value)) {
        unavailableCanonLocks.push(lock)
      } else {
        resolvedCanonLocks.push({ lock, fact })
      }
    }
    const canonLockResolution: NovelChapterControlPack['canonLockResolution'] = {
      resolved: resolvedCanonLocks,
      unavailableAtRevision: unavailableCanonLocks,
    }
    return deepFreeze(canonLockResolution)
  }

  /** Serve existing relationship readers through Memory's registered projector. */
  projectRelationships(
    workspaceId: DshWorkspaceId,
    revision: number,
  ): NovelRelationshipProjection {
    return this.readProjection<NovelRelationshipProjection>('memory/relationships', workspaceId, revision)
  }

  /** Serve existing narrative callers through the registered Planning projector during migration. */
  projectNarrative(
    workspaceId: DshWorkspaceId,
    revision: number,
  ): NovelNarrativeProjection {
    return this.readProjection<NovelNarrativeProjection>('planning/narrative', workspaceId, revision)
  }

  /** Project the accepted story hierarchy and clocks through Typert Remote. */
  @Remote('projectNarrative')
  remoteProjectNarrative(
    workspaceId: NovelWorkspaceId,
    revision: number,
  ): NovelNarrativeProjection {
    const workspace = this.requireWorkspace(workspaceId)
    return this.projectNarrative(workspace.id, revision)
  }

  /** Project every accepted manuscript unit at one aggregate revision. */
  projectManuscripts(
    workspaceId: DshWorkspaceId,
    revision: number,
  ): readonly NovelManuscriptProjection[] {
    const targetRevision = revisionSchema.parse(revision)
    const project = this.requireProjects().get(workspaceId)
    if (project === undefined) {
      throw new Error(`novel project for Workspace '${workspaceId}' does not exist`)
    }
    if (targetRevision > project.acceptedRevision) {
      throw new NovelProjectRevisionNotFoundError(targetRevision)
    }
    return deepFreeze(buildManuscriptProjection(project, targetRevision))
  }

  /** Project accepted manuscript units through the generated Typert Remote boundary. */
  @Remote('projectManuscripts')
  remoteProjectManuscripts(
    workspaceId: NovelWorkspaceId,
    revision: number,
  ): readonly NovelManuscriptProjection[] {
    const workspace = this.requireWorkspace(workspaceId)
    return this.projectManuscripts(workspace.id, revision)
  }



  /** Retrieve revision-bound direct evidence through Typert Remote. */
  @Remote('retrieve')
  remoteRetrieve(
    workspaceId: NovelWorkspaceId,
    query: NovelRetrievalQuery,
  ): NovelRetrievalResult {
    const workspace = this.requireWorkspace(workspaceId)
    return this.requireNovelMemoryRead().retrieve(workspace.id, query)
  }

  /** Project Canon through the generated Typert Remote boundary. */
  @Remote('projectCanon')
  remoteProjectCanon(
    workspaceId: NovelWorkspaceId,
    revision: number,
  ): NovelCanonProjection {
    const workspace = this.requireWorkspace(workspaceId)
    return this.projectCanon(workspace.id, revision)
  }

  /** Project accepted bidirectional relationship lines through Typert Remote. */
  @Remote('projectRelationships')
  remoteProjectRelationships(
    workspaceId: NovelWorkspaceId,
    revision: number,
  ): NovelRelationshipProjection {
    const workspace = this.requireWorkspace(workspaceId)
    return this.projectRelationships(workspace.id, revision)
  }

  /** Read one accepted revision through the generated Typert Remote boundary. */
  @Remote('read')
  remoteRead(
    workspaceId: NovelWorkspaceId,
    revision: number,
  ): AcceptedNovelRevision | undefined {
    const workspace = this.requireWorkspace(workspaceId)
    return this.readRevision(workspace.id, revision)
  }

  /**
   * Read one chapter's control pack through the generated Typert Remote boundary.
   *
   * The pack is the chapter contract the 本章合同 canvas renders: the scope it
   * sits in, its scenes and beats, the accepted facts the contract resolves
   * against, and the author locks that apply at this revision. Memory owns the
   * assembly and Canon keeps the authority, so this stays a thin read.
   */
  @Remote('chapterControlPack')
  remoteChapterControlPack(
    workspaceId: NovelWorkspaceId,
    revision: number,
    chapterId: string,
  ): NovelChapterControlPack {
    const workspace = this.requireWorkspace(workspaceId)
    return this.requireNovelMemoryRead().readChapterControlPack(workspace.id, revision, chapterId)
  }

  private requireMutationSession(sessionId: string): Session {
    const session = this.ctx.sessions.get(SessionId(sessionId))
    if (session === undefined) throw new Error(`live DSH Session '${sessionId}' does not exist`)
    return session
  }

  private requireWorkspace(workspaceId: NovelWorkspaceId): Workspace {
    const id = WorkspaceId(workspaceId)
    const workspace = this.ctx.workspaceRegistry.get(id)
    if (workspace === undefined) {
      throw new NovelProjectWorkspaceNotFoundError(id)
    }
    return workspace
  }

  private async requireAgentWorkspace(
    agent: Agent,
    workspaceId: NovelWorkspaceId,
  ): Promise<Workspace> {
    const workspace = this.requireWorkspace(workspaceId)
    const cwd = agent.session.header.cwd
    if (cwd === undefined) {
      throw new Error(`live DSH Agent '${agent.id}' has no cwd for Workspace '${workspace.id}'`)
    }
    const ownerWorkspace = await this.ctx.workspaceRegistry.resolveByPath(cwd)
    if (ownerWorkspace?.id !== workspace.id) {
      throw new Error(
        `live DSH Agent '${agent.id}' cwd '${cwd}' does not own Workspace '${workspace.id}'`,
      )
    }
    return workspace
  }

  private bindDraftToAgent(agent: Agent, packet: NovelResultPacketDraft): NovelResultPacketDraft {
    return {
      ...packet,
      provenance: {
        ...packet.provenance,
        sessionId: agent.id,
      },
    }
  }

  private authorizeDraft(agent: Agent, packet: NovelResultPacketDraft): NovelResultPacket {
    return {
      ...this.bindDraftToAgent(agent, packet),
      authorization: {
        kind: 'author',
        actorId: agent.id,
        decisionId: randomUUID(),
      },
    }
  }

  private requireProjects(): KvTable<DshWorkspaceId, NovelProjectRecord> {
    if (this.projects === undefined) {
      throw new Error('Novel Project service is not started yet')
    }
    return this.projects
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationTail.then(operation)
    this.operationTail = result.then(() => {}, () => {})
    return result
  }
}

export class NovelProjectRevisionConflictError extends Error {
  readonly code = 'revision-conflict'
  readonly expectedRevision: number
  readonly actualRevision: number

  constructor(
    expectedRevision: number,
    actualRevision: number,
  ) {
    super(
      `novel project revision conflict: expected ${String(expectedRevision)}, actual ${String(actualRevision)}`,
    )
    this.name = 'NovelProjectRevisionConflictError'
    this.expectedRevision = expectedRevision
    this.actualRevision = actualRevision
  }
}

export class NovelProjectRevisionNotFoundError extends Error {
  readonly code = 'revision-not-found'
  readonly revision: number

  constructor(revision: number) {
    super(`novel project revision ${String(revision)} does not exist`)
    this.name = 'NovelProjectRevisionNotFoundError'
    this.revision = revision
  }
}

export class NovelProjectCanonLockConflictError extends Error {
  readonly code = 'canon-lock-conflict'
  readonly lock: NovelCanonLock

  constructor(lock: NovelCanonLock) {
    super(`locked Canon fact '${lock.kind}:${lock.targetId}:${lock.field}' cannot change`)
    this.name = 'NovelProjectCanonLockConflictError'
    this.lock = lock
  }
}

export class NovelProjectWorkspaceNotFoundError extends Error {
  readonly code = 'workspace-not-found'
  readonly workspaceId: DshWorkspaceId

  constructor(workspaceId: DshWorkspaceId) {
    super(`DSH Workspace '${workspaceId}' does not exist`)
    this.name = 'NovelProjectWorkspaceNotFoundError'
    this.workspaceId = workspaceId
  }
}

export class NovelProjectDomainUnavailableError extends Error {
  readonly code = 'domain-unavailable'
  readonly capability: 'projector' | 'extension' | 'delta-kind' | 'domain-service'
  readonly requirement: string

  constructor(
    capability: 'projector' | 'extension' | 'delta-kind' | 'domain-service',
    requirement: string,
    message: string,
  ) {
    super(message)
    this.name = 'NovelProjectDomainUnavailableError'
    this.capability = capability
    this.requirement = requirement
  }
}

async function settleSubagentRun(run: SubagentRun): Promise<SubagentResult> {
  const [execution] = await Promise.allSettled([run.result])
  const [disposal] = await Promise.allSettled([
    Promise.resolve().then(async () => await run.dispose()),
  ])
  if (execution.status === 'rejected') {
    if (disposal.status === 'rejected') {
      throw new AggregateError(
        [execution.reason, disposal.reason],
        'novel review subagent execution and disposal both failed',
      )
    }
    throw execution.reason
  }
  if (disposal.status === 'rejected') throw disposal.reason
  return execution.value
}

function projectSnapshot(project: NovelProjectRecord): NovelProject {
  return Object.freeze({
    id: project.id,
    workspaceId: project.workspaceId,
    cwd: project.cwd,
    acceptedRevision: project.acceptedRevision,
    canonLocks: deepFreeze([...project.canonLocks]),
  })
}

function revisionSnapshot(revision: AcceptedNovelRevision): AcceptedNovelRevision {
  return deepFreeze(structuredClone(revision))
}

interface NovelReviewCandidate {
  readonly revision: NovelProjectProjectionRevision
  readonly project: NovelProjectProjectionRecord
}

/** Build and validate the exact selected revision shared by Preview and Apply. */
function buildReviewCandidate(
  current: NovelProjectProjectionRecord,
  command: ReviewNovelResultPacket,
): NovelReviewCandidate {
  if (current.acceptedRevision !== command.packet.expectedRevision) {
    throw new NovelProjectRevisionConflictError(
      command.packet.expectedRevision,
      current.acceptedRevision,
    )
  }
  const normalizedDecisions = normalizeReviewDecisions(command)
  const acceptedDeltaIds = new Set(normalizedDecisions
    .filter(decision => decision.itemType === 'delta' && decision.outcome === 'accept')
    .map(decision => decision.itemId))
  const acceptedDeltas = command.packet.deltas
    .filter(delta => acceptedDeltaIds.has(delta.id))
  const lockConflict = findCanonLockConflict(current.canonLocks, acceptedDeltas)
  if (lockConflict !== undefined) {
    throw new NovelProjectCanonLockConflictError(lockConflict)
  }
  const manuscriptDecision = normalizedDecisions
    .find(decision => decision.itemType === 'manuscript')
  const revision = deepFreeze({
    revision: current.acceptedRevision + 1,
    parentRevision: current.acceptedRevision,
    packetId: command.packet.packetId,
    ...(command.packet.manuscript === undefined || manuscriptDecision?.outcome === 'reject'
      ? {}
      : { manuscript: command.packet.manuscript }),
    deltas: acceptedDeltas,
    issues: command.packet.issues,
    decisions: normalizedDecisions,
    sourceAnchors: command.packet.sourceAnchors,
    provenance: command.packet.provenance,
  } satisfies NovelProjectProjectionRevision)
  const project = deepFreeze({
    ...current,
    acceptedRevision: revision.revision,
    revisions: [...current.revisions, revision],
  } satisfies NovelProjectProjectionRecord)
  return { revision, project }
}

function normalizeReviewDecisions(
  command: ReviewNovelResultPacket,
): readonly NovelResultItemDecision[] {
  const decisions = new Map(command.decisions.map(decision => [
    reviewDecisionKey(decision.itemType, decision.itemId),
    decision,
  ]))
  const manuscriptDecision = command.packet.manuscript === undefined
    ? undefined
    : decisions.get(reviewDecisionKey('manuscript', command.packet.manuscript.unitId))
  return [
    ...(manuscriptDecision === undefined ? [] : [manuscriptDecision]),
    ...command.packet.deltas.map(delta =>
      decisions.get(reviewDecisionKey('delta', delta.id)) as NovelResultItemDecision),
    ...command.packet.issues.map(issue =>
      decisions.get(reviewDecisionKey('issue', issue.id)) as NovelResultItemDecision),
  ]
}

function reviewDecisionKey(
  itemType: NovelResultItemDecision['itemType'],
  itemId: string,
): string {
  return JSON.stringify([itemType, itemId])
}



















/** Trace stable shortest downstream paths over the accepted causal projection. */

function buildManuscriptProjection(
  project: NovelProjectProjectionRecord,
  targetRevision: number,
): NovelManuscriptProjection[] {
  const revisions = new Map(project.revisions.map(revision => [revision.revision, revision] as const))
  const projections = new Map<number, Map<string, NovelManuscriptProjection>>([[0, new Map()]])

  for (let revisionNumber = 1; revisionNumber <= targetRevision; revisionNumber += 1) {
    const revision = revisions.get(revisionNumber)
    if (revision === undefined) throw new NovelProjectRevisionNotFoundError(revisionNumber)
    const baseRevision = revision.rollbackOfRevision ?? revision.parentRevision
    const base = projections.get(baseRevision)
    if (base === undefined) throw new NovelProjectRevisionNotFoundError(baseRevision)
    const state = new Map(base)
    if (revision.rollbackOfRevision === undefined && revision.manuscript !== undefined) {
      state.set(revision.manuscript.unitId, {
        manuscript: revision.manuscript,
        sourceRevision: revision.revision,
        provenance: revision.provenance,
      })
    }
    projections.set(revisionNumber, state)
  }

  const projected = projections.get(targetRevision)
  if (projected === undefined) throw new NovelProjectRevisionNotFoundError(targetRevision)
  return [...projected.values()].sort((left, right) =>
    compareText(left.manuscript.unitId, right.manuscript.unitId))
}

interface RevisionProjectionChanges<T> {
  readonly added: readonly T[]
  readonly removed: readonly T[]
  readonly changed: ReadonlyArray<{
    readonly before: T
    readonly after: T
  }>
}

/** Compare two complete accepted snapshots without treating provenance-only rewrites as story changes. */

/** Compare shortest downstream paths while ignoring provenance-only edge rewrites. */



function compareRevisionProjections<T>(
  before: readonly T[],
  after: readonly T[],
  identity: (value: T) => string,
  semanticallyEqual: (left: T, right: T) => boolean,
): RevisionProjectionChanges<T> {
  const beforeByIdentity = new Map(before.map(value => [identity(value), value] as const))
  const afterByIdentity = new Map(after.map(value => [identity(value), value] as const))
  const identities = [...new Set([...beforeByIdentity.keys(), ...afterByIdentity.keys()])]
    .sort(compareText)
  const added: T[] = []
  const removed: T[] = []
  const changed: Array<{ readonly before: T; readonly after: T }> = []
  for (const key of identities) {
    const beforeValue = beforeByIdentity.get(key)
    const afterValue = afterByIdentity.get(key)
    if (beforeValue === undefined) {
      added.push(afterValue!)
    } else if (afterValue === undefined) {
      removed.push(beforeValue)
    } else if (!semanticallyEqual(beforeValue, afterValue)) {
      changed.push({ before: beforeValue, after: afterValue })
    }
  }
  return { added, removed, changed }
}

function narrativeClockIdentity(clock: NovelNarrativeClockEntry['clock'], id: string): string {
  return `${String(NARRATIVE_CLOCKS.indexOf(clock)).padStart(2, '0')}:${id}`
}






















/** Canon selects the active ancestry before any domain interprets revision contents. */
function buildCanonSnapshot(project: NovelProjectProjectionRecord, targetRevision: number): NovelCanonSnapshot {
  const included = effectiveAcceptedSourceRevisions(project, targetRevision)
  return deepFreeze({
    projectId: project.id,
    workspaceId: project.workspaceId,
    revision: targetRevision,
    revisions: project.revisions.filter(revision => included.has(revision.revision)).map(revision => {
      const { authorization: _authorization, ...source } = revision
      return structuredClone(source)
    }),
  })
}

function effectiveAcceptedSourceRevisions(
  project: NovelProjectProjectionRecord,
  targetRevision: number,
): ReadonlySet<number> {
  const revisions = new Map(project.revisions.map(revision => [revision.revision, revision] as const))
  const included = new Set<number>()
  let revisionNumber = targetRevision
  while (revisionNumber > 0) {
    const revision = revisions.get(revisionNumber)
    if (revision === undefined) throw new NovelProjectRevisionNotFoundError(revisionNumber)
    if (revision.rollbackOfRevision !== undefined) {
      revisionNumber = revision.rollbackOfRevision
    } else {
      included.add(revision.revision)
      revisionNumber = revision.parentRevision
    }
  }
  return included
}

function buildCanonProjection(
  project: NovelProjectProjectionRecord,
  targetRevision: number,
): NovelCanonProjection {
  const revisions = new Map(project.revisions.map(accepted => [
    accepted.revision,
    accepted,
  ] as const))
  const projections = new Map<number, Map<string, NovelCanonFact>>([
    [0, new Map()],
  ])
  for (let currentRevision = 1; currentRevision <= targetRevision; currentRevision += 1) {
    const accepted = revisions.get(currentRevision)
    if (accepted === undefined) {
      throw new NovelProjectRevisionNotFoundError(currentRevision)
    }
    const baseRevision = accepted.rollbackOfRevision ?? accepted.parentRevision
    const base = projections.get(baseRevision)
    if (base === undefined) {
      throw new NovelProjectRevisionNotFoundError(baseRevision)
    }
    const facts = new Map(base)
    if (accepted.rollbackOfRevision === undefined) {
      for (const delta of accepted.deltas) {
        if (
          delta.kind === 'narrative-unit'
          || delta.kind === 'narrative-clock'
          || delta.kind === 'narrative-debt'
        ) continue
        const kind = delta.kind === 'extension' ? delta.namespace : delta.kind
        const key = canonFactKey(kind, delta.targetId, delta.field)
        if (delta.operation === 'remove') {
          facts.delete(key)
          continue
        }
        facts.set(key, deepFreeze({
          kind,
          targetId: delta.targetId,
          field: delta.field,
          value: delta.value,
          sourceRevision: accepted.revision,
          sourceDeltaId: delta.id,
          sourceAnchorIds: delta.sourceAnchorIds,
          provenance: accepted.provenance,
        }))
      }
    }
    projections.set(currentRevision, facts)
  }

  const facts = [...(projections.get(targetRevision)?.values() ?? [])]
    .sort(compareCanonFacts)
  const entities = buildCanonEntities(facts)
  return deepFreeze({
    projectId: project.id,
    workspaceId: project.workspaceId,
    revision: targetRevision,
    facts,
    entities,
  })
}

function buildCanonEntities(facts: readonly NovelCanonFact[]): readonly NovelCanonEntity[] {
  const grouped = new Map<string, NovelCanonFact[]>()
  for (const fact of facts) {
    const key = JSON.stringify([fact.kind, fact.targetId])
    const fields = grouped.get(key) ?? []
    fields.push(fact)
    grouped.set(key, fields)
  }

  return [...grouped.values()]
    .map((entityFacts) => {
      const orderedFacts = [...entityFacts].sort((left, right) =>
        compareText(left.field, right.field)
          || left.sourceRevision - right.sourceRevision
          || compareText(left.sourceDeltaId, right.sourceDeltaId))
      const first = orderedFacts[0]!
      const latest = [...orderedFacts].sort((left, right) =>
        left.sourceRevision - right.sourceRevision
          || compareText(left.sourceDeltaId, right.sourceDeltaId)
          || compareText(left.field, right.field)).at(-1)!
      const fields = Object.fromEntries(orderedFacts.map(fact => [fact.field, fact.value]))
      const fieldSources = Object.fromEntries(orderedFacts.map(fact => [fact.field, {
        value: fact.value,
        sourceRevision: fact.sourceRevision,
        sourceDeltaId: fact.sourceDeltaId,
        sourceAnchorIds: [...fact.sourceAnchorIds].sort(compareText),
        provenance: fact.provenance,
      } satisfies NovelCanonFieldSource]))
      const sourceAnchorIds = [...new Set(orderedFacts.flatMap(fact => fact.sourceAnchorIds))]
        .sort(compareText)
      return deepFreeze({
        kind: first.kind,
        targetId: first.targetId,
        fields,
        fieldSources,
        sourceRevision: latest.sourceRevision,
        sourceDeltaId: latest.sourceDeltaId,
        sourceAnchorIds,
        provenance: latest.provenance,
      } satisfies NovelCanonEntity)
    })
    .sort((left, right) =>
      compareText(left.kind, right.kind) || compareText(left.targetId, right.targetId))
}

function findCanonLockConflict(
  locks: readonly NovelCanonLock[],
  deltas: NovelResultPacketDraft['deltas'],
): NovelCanonLock | undefined {
  return locks.find(lockedFact => deltas.some((delta) => {
    if (
      delta.kind === 'narrative-unit'
      || delta.kind === 'narrative-clock'
      || delta.kind === 'narrative-debt'
    ) return false
    return (delta.kind === 'extension' ? delta.namespace : delta.kind) === lockedFact.kind
      && delta.targetId === lockedFact.targetId
      && delta.field === lockedFact.field
      && (delta.operation === 'remove' || !canonValuesEqual(delta.value, lockedFact.value))
  }))
}

function findCanonProjectionLockConflict(
  locks: readonly NovelCanonLock[],
  projection: NovelCanonProjection,
): NovelCanonLock | undefined {
  const facts = new Map(projection.facts.map(fact => [
    canonFactKey(fact.kind, fact.targetId, fact.field),
    fact,
  ] as const))
  return locks.find((lock) => {
    const fact = facts.get(canonFactKey(lock.kind, lock.targetId, lock.field))
    return fact === undefined || !canonValuesEqual(fact.value, lock.value)
  })
}

function canonFactKey(
  kind: NovelCanonFact['kind'],
  targetId: string,
  field: string,
): string {
  return JSON.stringify([kind, targetId, field])
}

function canonValuesEqual(left: NovelCanonValue, right: NovelCanonValue): boolean {
  return canonicalizeJsonValue(left) === canonicalizeJsonValue(right)
}


function compareCanonFacts(left: NovelCanonFact, right: NovelCanonFact): number {
  return compareText(left.kind, right.kind)
    || compareText(left.targetId, right.targetId)
    || compareText(left.field, right.field)
}

function compareCanonLocks(left: NovelCanonLock, right: NovelCanonLock): number {
  return compareText(left.kind, right.kind)
    || compareText(left.targetId, right.targetId)
    || compareText(left.field, right.field)
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value
  for (const child of Object.values(value)) deepFreeze(child)
  return Object.freeze(value)
}

export default NovelProjectService
