import { z } from 'zod'
import {
  CANON_FACT_KINDS,
  type CanonDelta,
  NARRATIVE_CLOCKS,
  type NovelCanonValue,
  type NovelEmotionEpisodeValue,
  type NovelFactionContinuityValue,
  type NovelKnowledgeStateValue,
  type NovelLocationContinuityValue,
  type NovelObjectContinuityValue,
  type NovelPostChapterCheckValue,
} from './types.js'

const revisionSchema = z.number().int().nonnegative()

export const manuscriptRevisionSchema = z.object({
  unitId: z.string().min(1),
  title: z.string().min(1),
  text: z.string(),
}).strict()

export const manuscriptDiffSchema = z.object({
  format: z.literal('unified'),
  text: z.string().min(1),
}).strict()

const deltaIdentityShape = {
  id: z.string().min(1),
  targetId: z.string().min(1),
  sourceAnchorIds: z.array(z.string().min(1)),
}

const narrativeDebtReferenceSchema = z.object({
  clock: z.enum(NARRATIVE_CLOCKS),
  id: z.string().min(1),
}).strict()

/** Runtime contract for recursive JSON values accepted by Canon fact Deltas. */
export const novelCanonValueSchema: z.ZodType<NovelCanonValue> = z.lazy(() => z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(novelCanonValueSchema),
  z.record(z.string(), novelCanonValueSchema),
]))

const untypedCanonFactKinds = CANON_FACT_KINDS.filter(kind => (
  kind !== 'world'
  && kind !== 'creative-profile'
  && kind !== 'reader-contract'
  && kind !== 'clue'
  && kind !== 'knowledge'
  && kind !== 'mystery'
  && kind !== 'ending'
  && kind !== 'emotion-state'
  && kind !== 'roadmap'
  && kind !== 'chapter-state'
  && kind !== 'character-state'
  && kind !== 'faction-state'
  && kind !== 'location-state'
  && kind !== 'object-state'
  && kind !== 'relationship'
   && kind !== 'promise'
 ))

const knowledgeStateValueSchema: z.ZodType<NovelKnowledgeStateValue> = z.object({
  version: z.number().int().positive(),
  subjectKind: z.enum(['reader', 'character']),
  beliefStatus: z.enum(['known', 'suspected', 'misread']),
  memoryStatus: z.enum(['retained', 'recalled', 'forgotten']),
  belief: z.string().min(1),
  truthAlignment: z.enum(['accurate', 'partial', 'incorrect', 'unverified']),
  access: z.object({
    mode: z.enum(['observed', 'told', 'inferred', 'remembered', 'misreported']),
    unitId: z.string().min(1),
    viewpointId: z.string().min(1).nullable(),
    viewpointAccess: z.enum(['direct', 'limited', 'reported', 'unreliable']),
  }).strict(),
  revisionRationale: z.string().min(1).nullable(),
}).strict()

const postChapterCheckValueSchema: z.ZodType<NovelPostChapterCheckValue> = z.object({
  contractAssessment: z.object({
    contractRevision: z.number().int().positive(),
    contractSourceDeltaId: z.string().min(1),
    outcome: z.enum(['met', 'changed', 'missed']),
    deviations: z.array(z.string().min(1)),
  }).strict(),
  manuscriptSourceRevision: z.number().int().positive(),
  changes: z.array(z.string().min(1)),
  costs: z.array(z.string().min(1)),
  newlyPossible: z.array(z.string().min(1)),
  newlyImpossible: z.array(z.string().min(1)),
  readerNowKnows: z.array(z.string().min(1)),
  readerNowSuspects: z.array(z.string().min(1)),
  characterCarryForward: z.array(z.object({
    characterId: z.string().min(1),
    carries: z.array(z.string().min(1)),
  }).strict()),
  debtTransitions: z.array(z.object({
    clock: z.enum(NARRATIVE_CLOCKS),
    debtId: z.string().min(1),
    transition: z.enum(['created', 'advanced', 'paid', 'retired']),
    sourceDeltaId: z.string().min(1),
  }).strict()),
}).strict()

const characterStateDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('character-state'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict()

const creativeProfileDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('creative-profile'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict()

const readerContractDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('reader-contract'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict()

const relationshipDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('relationship'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict()

const promiseDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('promise'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict()

const clueDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('clue'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict()

const knowledgeDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('knowledge'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict().superRefine((delta, context) => {
  if (delta.field !== 'state') return
  const parsed = delta.operation === 'set'
    ? knowledgeStateValueSchema.safeParse(delta.value)
    : z.null().safeParse(delta.value)
  if (parsed.success) return
  for (const issue of parsed.error.issues) {
    context.addIssue({
      code: 'custom',
      path: ['value', ...issue.path],
      message: issue.message,
    })
  }
})

const mysteryDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('mystery'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict()

const factionContinuityValueSchema: z.ZodType<NovelFactionContinuityValue> = z.object({
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

const factionStateDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('faction-state'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict().superRefine((delta, context) => {
  if (delta.field !== 'continuity') return
  // Legacy primitive/array continuity values remain generic Canon facts; only
  // record-shaped typed continuity values are subject to the strict contract.
  if (delta.operation === 'set'
    && (delta.value === null || typeof delta.value !== 'object' || Array.isArray(delta.value))) return
  const parsed = delta.operation === 'set'
    ? factionContinuityValueSchema.safeParse(delta.value)
    : z.null().safeParse(delta.value)
  if (parsed.success) return
  for (const issue of parsed.error.issues) {
    context.addIssue({
      code: 'custom',
      path: ['value', ...issue.path],
      message: issue.message,
    })
  }
})

const locationContinuityValueSchema: z.ZodType<NovelLocationContinuityValue> = z.object({
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

const locationStateDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('location-state'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict().superRefine((delta, context) => {
  if (delta.field !== 'continuity') return
  // Legacy primitive/array continuity values remain generic Canon facts; only
  // record-shaped typed continuity values are subject to the strict contract.
  if (delta.operation === 'set'
    && (delta.value === null || typeof delta.value !== 'object' || Array.isArray(delta.value))) return
  const parsed = delta.operation === 'set'
    ? locationContinuityValueSchema.safeParse(delta.value)
    : z.null().safeParse(delta.value)
  if (parsed.success) return
  for (const issue of parsed.error.issues) {
    context.addIssue({
      code: 'custom',
      path: ['value', ...issue.path],
      message: issue.message,
    })
  }
})

const objectContinuityValueSchema: z.ZodType<NovelObjectContinuityValue> = z.object({
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

const objectStateDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('object-state'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict().superRefine((delta, context) => {
  if (delta.field !== 'continuity') return
  // Legacy primitive/array continuity values remain generic Canon facts; only
  // record-shaped typed continuity values are subject to the strict contract.
  if (delta.operation === 'set'
    && (delta.value === null || typeof delta.value !== 'object' || Array.isArray(delta.value))) return
  const parsed = delta.operation === 'set'
    ? objectContinuityValueSchema.safeParse(delta.value)
    : z.null().safeParse(delta.value)
  if (parsed.success) return
  for (const issue of parsed.error.issues) {
    context.addIssue({
      code: 'custom',
      path: ['value', ...issue.path],
      message: issue.message,
    })
  }
})

const emotionEpisodeValueSchema: z.ZodType<NovelEmotionEpisodeValue> = z.object({
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

const emotionStateDeltaSchema = z.object({
  ...deltaIdentityShape,
  kind: z.literal('emotion-state'),
  operation: z.enum(['set', 'remove']),
  field: z.string().min(1),
  value: novelCanonValueSchema,
}).strict().superRefine((delta, context) => {
  if (delta.field !== 'episode') return
  // Legacy primitive/array episode values remain generic Canon facts; only
  // record-shaped typed episodes are subject to the strict contract.
  if (delta.operation === 'set'
    && (delta.value === null || typeof delta.value !== 'object' || Array.isArray(delta.value))) return
  const parsed = delta.operation === 'set'
    ? emotionEpisodeValueSchema.safeParse(delta.value)
    : z.null().safeParse(delta.value)
  if (parsed.success) return
  for (const issue of parsed.error.issues) {
    context.addIssue({
      code: 'custom',
      path: ['value', ...issue.path],
      message: issue.message,
    })
  }
})

const canonFactDeltaSchema = z.union([
  z.object({
    ...deltaIdentityShape,
    kind: z.enum(untypedCanonFactKinds),
    operation: z.enum(['set', 'remove']),
    field: z.string().min(1),
    value: novelCanonValueSchema,
  }).strict(),
  characterStateDeltaSchema,
  creativeProfileDeltaSchema,
  readerContractDeltaSchema,
  relationshipDeltaSchema,
  clueDeltaSchema,
  knowledgeDeltaSchema,
  mysteryDeltaSchema,
  factionStateDeltaSchema,
  locationStateDeltaSchema,
  objectStateDeltaSchema,
  emotionStateDeltaSchema,
  promiseDeltaSchema,
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('chapter-state'),
    operation: z.literal('set'),
    field: z.literal('post-check'),
    value: postChapterCheckValueSchema,
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('chapter-state'),
    operation: z.literal('remove'),
    field: z.literal('post-check'),
    value: z.null(),
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('world'),
    operation: z.literal('set'),
    field: z.string().min(1),
    value: novelCanonValueSchema,
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('world'),
    operation: z.literal('remove'),
    field: z.string().min(1),
    value: z.null(),
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('roadmap'),
    operation: z.literal('set'),
    field: z.string().min(1),
    value: novelCanonValueSchema,
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('roadmap'),
    operation: z.literal('remove'),
    field: z.string().min(1),
    value: z.null(),
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('ending'),
    operation: z.literal('set'),
    field: z.string().min(1),
    value: novelCanonValueSchema,
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('ending'),
    operation: z.literal('remove'),
    field: z.string().min(1),
    value: z.null(),
  }).strict(),
])


const narrativeDebtValueSchema = z.object({
  summary: z.string().min(1),
  status: z.string().min(1),
  horizon: z.string().min(1).optional(),
  dependsOn: z.array(narrativeDebtReferenceSchema).optional(),
}).strict()

/** Delta kinds whose value contract is owned by a domain plugin; Canon validates only their envelope. */
export const DOMAIN_OWNED_DELTA_KINDS: ReadonlySet<string> = new Set([
  'world',
  'mystery',
  'clue',
  'promise',
  'roadmap',
  'ending',
  'character-state',
  'creative-profile',
  'reader-contract',
  'relationship',
  'narrative-unit',
  'narrative-clock',
])

const canonDeltaEnvelopeSchema = z.union([
  canonFactDeltaSchema,
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('extension'),
    namespace: z.string().regex(/^[^/]+\/[^/]+$/),
    operation: z.literal('set'),
    field: z.string().min(1),
    value: novelCanonValueSchema,
    sourceAnchorIds: z.array(z.string().min(1)).min(1),
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('extension'),
    namespace: z.string().regex(/^[^/]+\/[^/]+$/),
    operation: z.literal('remove'),
    field: z.string().min(1),
    value: z.null(),
    sourceAnchorIds: z.array(z.string().min(1)).min(1),
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('narrative-unit'),
    operation: z.literal('set'),
    field: z.string().min(1),
    value: novelCanonValueSchema,
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('narrative-unit'),
    operation: z.literal('remove'),
    field: z.string().min(1),
    value: z.null(),
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('narrative-clock'),
    operation: z.literal('set'),
    field: z.string().min(1),
    value: novelCanonValueSchema,
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('narrative-clock'),
    operation: z.literal('remove'),
    field: z.string().min(1),
    value: z.null(),
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('narrative-debt'),
    operation: z.literal('set'),
    unitId: z.string().min(1),
    field: z.enum(NARRATIVE_CLOCKS),
    value: narrativeDebtValueSchema,
  }).strict(),
  z.object({
    ...deltaIdentityShape,
    kind: z.literal('narrative-debt'),
    operation: z.literal('remove'),
    unitId: z.string().min(1),
    field: z.enum(NARRATIVE_CLOCKS),
    value: z.null(),
  }).strict(),
])

/** Runtime Delta envelope; domain-owned kinds delegate their value contract to the registered plugin. */
export const canonDeltaSchema: z.ZodType<CanonDelta> = canonDeltaEnvelopeSchema as unknown as z.ZodType<CanonDelta>

export const sourceAnchorSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  sourceEncoding: z.string().min(1).optional(),
  sourceBom: z.boolean().optional(),
  sourceByteLength: z.number().int().nonnegative().optional(),
  sourcePath: z.string().min(1).optional(),
  sourceBytesBase64: z.string().min(1).optional(),
}).strict()

export const anchoredIssueSchema = z.object({
  id: z.string().min(1),
  dimension: z.string().min(1),
  severity: z.enum(['critical', 'major', 'minor']),
  problem: z.string().min(1),
  suggestion: z.string().min(1),
  sourceAnchorIds: z.array(z.string().min(1)).min(1),
}).strict()

export const acceptanceAuthorizationSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('author'),
    actorId: z.string().min(1),
    decisionId: z.string().min(1),
  }).strict(),
  z.object({
    kind: z.literal('policy'),
    policyId: z.string().min(1),
    runId: z.string().min(1),
    decisionId: z.string().min(1),
  }).strict(),
])

export const resultProvenanceSchema = z.object({
  taskId: z.string().min(1),
  sessionId: z.string().min(1),
  producer: z.string().min(1),
}).strict()

const novelResultPacketDraftShape = {
  packetId: z.string().min(1),
  expectedRevision: revisionSchema,
  manuscript: manuscriptRevisionSchema.optional(),
  manuscriptDiff: manuscriptDiffSchema.optional(),
  deltas: z.array(canonDeltaSchema),
  issues: z.array(anchoredIssueSchema),
  sourceAnchors: z.array(sourceAnchorSchema),
  provenance: resultProvenanceSchema,
}

const novelResultPacketDraftBaseSchema = z.object(novelResultPacketDraftShape).strict()
type NovelResultPacketDraftValue = z.infer<typeof novelResultPacketDraftBaseSchema>

export const novelResultPacketDraftSchema = novelResultPacketDraftBaseSchema
  .superRefine(validateNovelResultPacket)

export const novelResultPacketSchema = z.object({
  ...novelResultPacketDraftShape,
  authorization: acceptanceAuthorizationSchema,
}).strict().superRefine(validateNovelResultPacket)

function validateNovelResultPacket(
  packet: NovelResultPacketDraftValue,
  ctx: z.core.$RefinementCtx<NovelResultPacketDraftValue>,
): void {
  if ((packet.manuscript === undefined) !== (packet.manuscriptDiff === undefined)) {
    ctx.addIssue({
      code: 'custom',
      path: packet.manuscript === undefined ? ['manuscript'] : ['manuscriptDiff'],
      message: 'manuscript and manuscriptDiff must be provided together',
    })
  }

  const deltaIds = new Set<string>()
  for (const [deltaIndex, delta] of packet.deltas.entries()) {
    if (deltaIds.has(delta.id)) {
      ctx.addIssue({
        code: 'custom',
        path: ['deltas', deltaIndex, 'id'],
        message: `duplicate Delta id '${delta.id}'`,
      })
    }
    deltaIds.add(delta.id)
  }

  const issueIds = new Set<string>()
  for (const [issueIndex, issue] of packet.issues.entries()) {
    if (issueIds.has(issue.id)) {
      ctx.addIssue({
        code: 'custom',
        path: ['issues', issueIndex, 'id'],
        message: `duplicate Issue id '${issue.id}'`,
      })
    }
    issueIds.add(issue.id)
  }

  const sourceAnchorIds = new Set<string>()
  for (const [anchorIndex, anchor] of packet.sourceAnchors.entries()) {
    if (sourceAnchorIds.has(anchor.id)) {
      ctx.addIssue({
        code: 'custom',
        path: ['sourceAnchors', anchorIndex, 'id'],
        message: `duplicate SourceAnchor id '${anchor.id}'`,
      })
    }
    sourceAnchorIds.add(anchor.id)
  }

  for (const [deltaIndex, delta] of packet.deltas.entries()) {
    for (const [referenceIndex, sourceAnchorId] of delta.sourceAnchorIds.entries()) {
      if (sourceAnchorIds.has(sourceAnchorId)) continue
      ctx.addIssue({
        code: 'custom',
        path: ['deltas', deltaIndex, 'sourceAnchorIds', referenceIndex],
        message: `unknown SourceAnchor id '${sourceAnchorId}'`,
      })
    }
  }

  for (const [issueIndex, issue] of packet.issues.entries()) {
    for (const [referenceIndex, sourceAnchorId] of issue.sourceAnchorIds.entries()) {
      if (sourceAnchorIds.has(sourceAnchorId)) continue
      ctx.addIssue({
        code: 'custom',
        path: ['issues', issueIndex, 'sourceAnchorIds', referenceIndex],
        message: `unknown SourceAnchor id '${sourceAnchorId}'`,
      })
    }
  }
}

export const novelResultItemDecisionSchema = z.object({
  itemType: z.enum(['manuscript', 'delta', 'issue']),
  itemId: z.string().min(1),
  outcome: z.enum(['accept', 'reject']),
  reason: z.string().optional(),
}).strict()

const reviewNovelResultPacketDraftBaseSchema = z.object({
  packet: novelResultPacketDraftSchema,
  decisions: z.array(novelResultItemDecisionSchema),
}).strict()

export const reviewNovelResultPacketDraftSchema = reviewNovelResultPacketDraftBaseSchema
  .superRefine(validateReviewNovelResultPacket)

export const reviewNovelResultPacketSchema = z.object({
  packet: novelResultPacketSchema,
  decisions: z.array(novelResultItemDecisionSchema),
}).strict().superRefine(validateReviewNovelResultPacket)

type ReviewNovelResultPacketValue = z.infer<typeof reviewNovelResultPacketDraftBaseSchema>

function validateReviewNovelResultPacket(
  command: ReviewNovelResultPacketValue,
  ctx: z.core.$RefinementCtx<ReviewNovelResultPacketValue>,
): void {
  const expected = new Map<string, readonly (string | number)[]>()
  for (const [deltaIndex, delta] of command.packet.deltas.entries()) {
    expected.set(reviewDecisionKey('delta', delta.id), ['packet', 'deltas', deltaIndex, 'id'])
  }
  for (const [issueIndex, issue] of command.packet.issues.entries()) {
    expected.set(reviewDecisionKey('issue', issue.id), ['packet', 'issues', issueIndex, 'id'])
  }
  if (command.packet.manuscript !== undefined) {
    expected.set(
      reviewDecisionKey('manuscript', command.packet.manuscript.unitId),
      ['packet', 'manuscript', 'unitId'],
    )
  }
  const known = new Map(expected)

  const seen = new Set<string>()
  for (const [decisionIndex, decision] of command.decisions.entries()) {
    const key = reviewDecisionKey(decision.itemType, decision.itemId)
    if (!known.has(key)) {
      ctx.addIssue({
        code: 'custom',
        path: ['decisions', decisionIndex, 'itemId'],
        message: `unknown ${decision.itemType} decision item '${decision.itemId}'`,
      })
      continue
    }
    if (seen.has(key)) {
      ctx.addIssue({
        code: 'custom',
        path: ['decisions', decisionIndex, 'itemId'],
        message: `duplicate ${decision.itemType} decision for '${decision.itemId}'`,
      })
      continue
    }
    seen.add(key)
  }

  for (const [key, path] of expected) {
    if (seen.has(key)) continue
    const [itemType, itemId] = JSON.parse(key) as [string, string]
    ctx.addIssue({
      code: 'custom',
      path: [...path],
      message: `missing ${itemType} decision for '${itemId}'`,
    })
  }
}

function reviewDecisionKey(itemType: 'manuscript' | 'delta' | 'issue', itemId: string): string {
  return JSON.stringify([itemType, itemId])
}
