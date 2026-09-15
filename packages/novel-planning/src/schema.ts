import { z } from 'zod'
import {
  NARRATIVE_CLOCKS,
  NARRATIVE_LEVELS,
  type NarrativeDebtReference,
  type NovelCanonDeltaKind,
  type NovelChapterContract,
  type NovelCharacterArcHypothesisValue,
  type NovelCharacterClockValue,
  type NovelClueStateValue,
  type NovelCreativeSerializationProfileValue,
  type NovelCreativeStyleProfileValue,
  type NovelEndingClockValue,
  type NovelEndingHypothesisValue,
  type NovelMysteryClockValue,
  type NovelMysteryStateValue,
  type NovelPlotProgressionValue,
  type NovelProgressionClockValue,
  type NovelPromiseBeatValue,
  type NovelPromiseClockValue,
  type NovelPromiseStateValue,
  type NovelReaderContractProfileValue,
  type NovelReaderKnowledgeClockValue,
  type NovelRelationshipClockValue,
  type NovelRelationshipLineStateValue,
  type NovelRollingRoadmapPlanValue,
  type NovelTensionPayoffValue,
  type NovelWorldClockValue,
  type NovelWorldRuleValue,
} from '@novel-agent/novel-project/types'

type DomainDelta = {
  readonly operation: 'set' | 'remove'
  readonly field: string
  readonly value: unknown
  readonly targetId: string
  readonly sourceAnchorIds: readonly string[]
}

const narrativeDebtReferenceSchema: z.ZodType<NarrativeDebtReference> = z.object({
  clock: z.enum(NARRATIVE_CLOCKS),
  id: z.string().min(1),
}).strict()

const worldRuleValueSchema: z.ZodType<NovelWorldRuleValue> = z.object({
  scope: z.string().min(1),
  statement: z.string().min(1),
  version: z.number().int().positive(),
  exceptions: z.array(z.string().min(1)),
  publicBelief: z.string().min(1),
  hiddenTruth: z.string().min(1),
  observedConsequences: z.array(z.string().min(1)),
}).strict()

const mysteryStateValueSchema: z.ZodType<NovelMysteryStateValue> = z.object({
  version: z.number().int().positive(),
  question: z.string().min(1),
  truth: z.discriminatedUnion('status', [
    z.object({
      status: z.literal('unknown-to-author'),
      answer: z.null(),
    }).strict(),
    z.object({
      status: z.literal('known-to-author'),
      answer: z.string().min(1),
    }).strict(),
  ]),
  hypotheses: z.array(z.string().min(1)),
  knowers: z.array(z.string().min(1)),
  readerVisibility: z.string().min(1),
  concealmentRule: z.string().min(1),
  revealConditions: z.array(z.string().min(1)),
  earliestFairResolutionUnitId: z.string().min(1).nullable(),
  desiredRevealWindow: z.object({
    startUnitId: z.string().min(1),
    endUnitId: z.string().min(1),
  }).strict().nullable(),
  actualReveal: z.object({
    unitId: z.string().min(1),
    description: z.string().min(1),
  }).strict().nullable(),
  aftermath: z.string().min(1).nullable(),
  revisionRationale: z.string().min(1).nullable(),
}).strict()

const clueStateValueSchema: z.ZodType<NovelClueStateValue> = z.object({
  version: z.number().int().positive(),
  role: z.enum(['clue', 'foreshadowing', 'red-herring']),
  statement: z.string().min(1),
  linkedMysteryIds: z.array(z.string().min(1)),
  status: z.enum([
    'proposed',
    'planted',
    'noticed',
    'reinforced',
    'complicated',
    'due',
    'paid-off',
    'transformed',
    'retired',
    'abandoned',
  ]),
  readerVisibility: z.enum(['hidden', 'available', 'noticed', 'misdirected', 'resolved']),
  intendedFunction: z.string().min(1),
  expectedPayoffWindow: z.string().min(1).nullable(),
  payoff: z.object({
    unitId: z.string().min(1),
    kind: z.enum(['confirmation', 'reinterpretation', 'reveal', 'reversal', 'exit']),
    description: z.string().min(1),
    aftermath: z.string().min(1),
  }).strict().nullable(),
  abandonmentReason: z.string().min(1).nullable(),
  revisionRationale: z.string().min(1).nullable(),
}).strict().superRefine((value, context) => {
  if (
    (value.status === 'paid-off' || value.status === 'transformed')
    && value.payoff === null
  ) {
    context.addIssue({
      code: 'custom',
      path: ['payoff'],
      message: `payoff is required when clue status is ${value.status}`,
    })
  }
  if (value.status === 'abandoned' && value.abandonmentReason === null) {
    context.addIssue({
      code: 'custom',
      path: ['abandonmentReason'],
      message: 'abandonmentReason is required when clue status is abandoned',
    })
  }
})

const promiseBeatValueSchema: z.ZodType<NovelPromiseBeatValue> = z.object({
  beatId: z.string().min(1),
  unitId: z.string().min(1),
  sourceRevision: z.number().int().positive(),
  sourceAnchorIds: z.array(z.string().min(1)).min(1),
  description: z.string().min(1),
}).strict()

const promisePayoffTypeSchema = z.enum([
  'micro',
  'chapter',
  'arc',
  'relationship',
  'mystery',
  'progression',
  'thematic',
  'final',
])

const promiseStateValueSchema: z.ZodType<NovelPromiseStateValue> = z.object({
  version: z.number().int().positive(),
  promise: z.string().min(1),
  type: z.string().min(1),
  weight: z.enum(['minor', 'supporting', 'major', 'core']),
  horizon: z.object({
    openedUnitId: z.string().min(1),
    expectedPayoffStartUnitId: z.string().min(1),
    expectedPayoffEndUnitId: z.string().min(1),
  }).strict(),
  setup: promiseBeatValueSchema,
  reminders: z.array(promiseBeatValueSchema),
  complications: z.array(promiseBeatValueSchema),
  resolution: z.discriminatedUnion('status', [
    z.object({
      status: z.literal('open'),
      payoffType: z.null(),
      beat: z.null(),
      retirementRationale: z.null(),
    }).strict(),
    z.object({
      status: z.literal('partially-paid'),
      payoffType: promisePayoffTypeSchema,
      beat: promiseBeatValueSchema,
      retirementRationale: z.null(),
    }).strict(),
    z.object({
      status: z.literal('paid'),
      payoffType: promisePayoffTypeSchema,
      beat: promiseBeatValueSchema,
      retirementRationale: z.null(),
    }).strict(),
    z.object({
      status: z.literal('retired'),
      payoffType: z.null(),
      beat: promiseBeatValueSchema,
      retirementRationale: z.string().min(1),
    }).strict(),
  ]),
  aftermath: z.string().min(1).nullable(),
  revisionRationale: z.string().min(1).nullable(),
}).strict().superRefine((value, context) => {
  if (
    (value.resolution.status === 'partially-paid' || value.resolution.status === 'paid')
    && value.aftermath === null
  ) {
    context.addIssue({
      code: 'custom',
      path: ['aftermath'],
      message: `aftermath is required when promise resolution is ${value.resolution.status}`,
    })
  }
})

const rollingRoadmapPlanValueSchema: z.ZodType<NovelRollingRoadmapPlanValue> = z.object({
  version: z.number().int().positive(),
  detailedThroughUnitId: z.string().min(1),
  horizonSummary: z.string().min(1),
  units: z.array(z.object({
    unitId: z.string().min(1),
    order: z.number().int().nonnegative(),
    targetChapterStart: z.number().int().positive(),
    targetChapterEnd: z.number().int().positive(),
    milestone: z.string().min(1),
    status: z.string().min(1),
    dependsOnUnitIds: z.array(z.string().min(1)),
    scopedDebtIds: z.array(z.string().min(1)),
    changeRationale: z.string().min(1).nullable(),
  }).strict()),
}).strict()

const endingHypothesisValueSchema: z.ZodType<NovelEndingHypothesisValue> = z.object({
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
  deliberatelyUnresolvedDebts: z.array(narrativeDebtReferenceSchema),
  epiloguePurpose: z.string().min(1).nullable(),
}).strict()

const characterArcHypothesisValueSchema: z.ZodType<NovelCharacterArcHypothesisValue> = z.object({
  version: z.number().int().positive(),
  scopeUnitId: z.string().min(1),
  hypothesis: z.string().min(1),
  startingBelief: z.string().min(1),
  targetTransformation: z.string().min(1),
  transformationDimensions: z.array(z.enum([
    'belief',
    'strategy',
    'identity',
    'relationship',
    'responsibility',
  ])).min(1),
  pressures: z.array(z.string().min(1)).min(1),
  decisionChain: z.array(z.object({
    decisionId: z.string().min(1),
    storyEventId: z.string().min(1),
    pressure: z.string().min(1),
    choice: z.string().min(1),
    rejectedAlternatives: z.array(z.string().min(1)),
    cost: z.string().min(1),
    persistentConsequence: z.string().min(1),
    transformationEvidence: z.string().min(1),
  }).strict()),
  currentStage: z.string().min(1),
  unresolvedQuestion: z.string().min(1),
  changeRationale: z.string().min(1).nullable(),
}).strict()

const creativeStyleProfileValueSchema: z.ZodType<NovelCreativeStyleProfileValue> = z.object({
  version: z.number().int().positive(),
  profileName: z.string().min(1),
  voicePrinciples: z.array(z.string().min(1)),
  viewpoint: z.object({
    person: z.string().min(1),
    distance: z.string().min(1),
    rules: z.array(z.string().min(1)),
  }).strict(),
  sentenceRhythm: z.object({
    principles: z.array(z.string().min(1)),
    forbiddenPatterns: z.array(z.string().min(1)),
  }).strict(),
  dialogue: z.object({
    principles: z.array(z.string().min(1)),
    characterDifferentiation: z.array(z.string().min(1)),
  }).strict(),
  sensoryPriorities: z.array(z.string().min(1)),
  subtextRules: z.array(z.string().min(1)),
  expositionRules: z.array(z.string().min(1)),
  forbiddenHabits: z.array(z.string().min(1)),
  approvedExemplars: z.array(z.object({
    exemplarId: z.string().min(1),
    sourceUnitId: z.string().min(1),
    sourceRevision: z.number().int().positive(),
    sourceAnchorIds: z.array(z.string().min(1)),
    purpose: z.string().min(1),
  }).strict()),
  adaptationBoundaries: z.array(z.object({
    context: z.string().min(1),
    invariants: z.array(z.string().min(1)),
    mayVary: z.array(z.string().min(1)),
  }).strict()),
  revisionRationale: z.string().min(1).nullable(),
}).strict()

const creativeSerializationProfileValueSchema: z.ZodType<NovelCreativeSerializationProfileValue> = z.object({
  version: z.number().int().positive(),
  platform: z.string().min(1),
  cadence: z.object({
    chaptersPerWeek: z.number().int().positive(),
    releaseDays: z.array(z.string().min(1)).min(1),
  }).strict(),
  chapterLengthRange: z.object({
    min: z.number().int().positive(),
    max: z.number().int(),
  }).strict().refine(
    range => range.max >= range.min,
    {
      path: ['max'],
      message: 'chapterLengthRange.max must be greater than or equal to min',
    },
  ),
  plannedLength: z.object({
    unit: z.enum(['characters', 'chapters']),
    target: z.number().int().positive(),
  }).strict(),
  revisionRationale: z.string().nullable(),
}).strict()

const readerContractProfileValueSchema: z.ZodType<NovelReaderContractProfileValue> = z.object({
  version: z.number().int().positive(),
  premise: z.object({
    distinctiveSituation: z.string().min(1),
    centralDramaticQuestion: z.string().min(1),
    readerFantasy: z.string().min(1),
    constraints: z.array(z.string().min(1)),
    tonalRange: z.array(z.string().min(1)).min(1),
  }).strict(),
  coreExperience: z.string().min(1),
  promises: z.array(z.object({
    promiseId: z.string().min(1),
    statement: z.string().min(1),
  }).strict()).min(1),
  exclusions: z.array(z.string().min(1)),
  targetAudience: z.object({
    description: z.string().min(1),
    expectations: z.array(z.string().min(1)).min(1),
  }).strict(),
  evidence: z.array(z.object({
    evidenceId: z.string().min(1),
    sourceUnitId: z.string().min(1),
    sourceRevision: z.number().int().positive(),
    sourceAnchorIds: z.array(z.string().min(1)).min(1),
    demonstrates: z.string().min(1),
  }).strict()),
  revisionRationale: z.string().min(1).nullable(),
}).strict()

const relationshipLineStateValueSchema: z.ZodType<NovelRelationshipLineStateValue> = z.object({
  version: z.number().int().positive(),
  premise: z.string().min(1),
  form: z.string().min(1),
  stage: z.string().min(1),
  independentGoal: z.string().min(1),
  currentTrust: z.string().min(1),
  currentConflict: z.string().min(1),
  currentCommitment: z.string().min(1),
  boundaries: z.array(z.string().min(1)),
  sharedHistory: z.array(z.string().min(1)),
  obstacles: z.array(z.string().min(1)),
  unresolvedDebts: z.array(z.string().min(1)),
  mainPlotConsequences: z.array(z.string().min(1)),
  turns: z.array(z.object({
    turnId: z.string().min(1),
    eventId: z.string().min(1),
    storyOrder: z.number(),
    turnType: z.enum([
      'bid',
      'acceptance',
      'rejection',
      'reversal',
      'rupture',
      'repair',
      'sacrifice',
      'commitment',
      'climax',
    ]),
    action: z.string().min(1),
    otherResponse: z.string().min(1),
    cost: z.string().min(1),
    persistentConsequence: z.string().min(1),
    stageAfter: z.string().min(1),
  }).strict()),
  agencyEvidence: z.array(z.string().min(1)),
  desiredEndingState: z.string().min(1).nullable(),
  revisionRationale: z.string().min(1).nullable(),
}).strict()

function conditionalFieldValue(field: string, schema: { parse(value: unknown): unknown }) {
  return (delta: DomainDelta) => {
    if (delta.field !== field) return
    if (delta.operation === 'set') {
      schema.parse(delta.value)
      return
    }
    z.null().parse(delta.value)
  }
}

function requiredFieldValue(field: string, schema: { parse(value: unknown): unknown }) {
  return (delta: DomainDelta) => {
    if (delta.field !== field)
      throw new Error(`Delta field must be '${field}', received '${delta.field}'`)
    if (delta.operation === 'set') {
      schema.parse(delta.value)
      return
    }
    z.null().parse(delta.value)
  }
}

function creativeProfileValidate(delta: DomainDelta): void {
  if (delta.field === 'style-profile') {
    conditionalFieldValue('style-profile', creativeStyleProfileValueSchema)(delta)
    return
  }
  if (delta.field === 'serialization-profile') {
    conditionalFieldValue('serialization-profile', creativeSerializationProfileValueSchema)(delta)
  }
}

// Narrative structure, chapter contracts and the ten narrative clock values.
const chapterContractSchema: z.ZodType<NovelChapterContract> = z.object({
  viewpoint: z.string().min(1),
  storyTime: z.string().min(1),
  sceneFunctions: z.array(z.string().min(1)),
  activePlotLineIds: z.array(z.string().min(1)),
  activeRelationshipLineIds: z.array(z.string().min(1)),
  promisesTouched: z.array(z.object({
    promiseId: z.string().min(1),
    intendedMovement: z.string().min(1),
  }).strict()),
  informationPolicy: z.object({
    readerMayKnow: z.array(z.string().min(1)),
    characterMayKnow: z.array(z.object({
      characterId: z.string().min(1),
      facts: z.array(z.string().min(1)),
    }).strict()),
  }).strict(),
  progressionSetups: z.array(z.string().min(1)),
  progressionPayoffs: z.array(z.string().min(1)),
  emotionalMovement: z.string().min(1),
  endingPull: z.string().min(1),
  prohibitedContradictions: z.array(z.string().min(1)),
  styleConstraints: z.array(z.string().min(1)),
  lengthRange: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  }).strict().refine(range => range.max >= range.min, {
    path: ['max'],
    message: 'Chapter contract maximum length must be at least its minimum length',
  }),
  acceptanceGates: z.array(z.string().min(1)),
}).strict()

const narrativeUnitValueSchema = z.object({
  level: z.enum(NARRATIVE_LEVELS),
  parentId: z.string().min(1).nullable(),
  order: z.number().int().nonnegative(),
  objective: z.string(),
  entryState: z.string(),
  exitState: z.string(),
  status: z.string().min(1),
  chapterContract: chapterContractSchema.optional(),
}).strict().superRefine((value, context) => {
  if (value.chapterContract !== undefined && value.level !== 'chapter') {
    context.addIssue({
      code: 'custom',
      path: ['chapterContract'],
      message: 'chapterContract is only valid for Chapter narrative units',
    })
  }
})

const plotProgressionValueSchema: z.ZodType<NovelPlotProgressionValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(NARRATIVE_LEVELS),
  }).strict(),
  lines: z.array(z.object({
    lineId: z.string().min(1),
    goal: z.string().min(1),
    stakes: z.string().min(1),
    status: z.string().min(1),
    turns: z.array(z.object({
      turnId: z.string().min(1),
      storyEventId: z.string().min(1),
      turnType: z.enum(['obstacle', 'choice', 'consequence', 'reversal']),
      description: z.string().min(1),
      cost: z.string().min(1),
      stateAfter: z.string().min(1),
    }).strict()),
  }).strict()).min(1),
  revisionRationale: z.string().min(1).nullable(),
}).strict()

const worldClockReferenceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('rule'),
    targetId: z.string().min(1),
  }).strict(),
  z.object({
    kind: z.literal('faction-continuity'),
    entryId: z.string().min(1),
  }).strict(),
  z.object({
    kind: z.literal('location-continuity'),
    entryId: z.string().min(1),
  }).strict(),
  z.object({
    kind: z.literal('object-continuity'),
    entryId: z.string().min(1),
  }).strict(),
])

const worldClockValueSchema: z.ZodType<NovelWorldClockValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(['scene', 'chapter', 'arc', 'volume']),
  }).strict(),
  moves: z.array(z.object({
    moveId: z.string().min(1),
    references: z.array(worldClockReferenceSchema).min(1),
    contribution: z.string().min(1),
  }).strict()).min(1),
  revisionRationale: z.string().min(1).nullable(),
}).strict().superRefine((value, context) => {
  const moveIds = new Set<string>()
  value.moves.forEach((move, moveIndex) => {
    if (moveIds.has(move.moveId)) {
      context.addIssue({
        code: 'custom',
        path: ['moves', moveIndex, 'moveId'],
        message: `world moveId '${move.moveId}' must be unique within one clock value`,
      })
    }
    moveIds.add(move.moveId)

    const references = new Set<string>()
    move.references.forEach((reference, referenceIndex) => {
      const id = reference.kind === 'rule' ? reference.targetId : reference.entryId
      const key = JSON.stringify([reference.kind, id])
      if (references.has(key)) {
        context.addIssue({
          code: 'custom',
          path: ['moves', moveIndex, 'references', referenceIndex],
          message: `world reference '${reference.kind}:${id}' must be unique within one move`,
        })
      }
      references.add(key)
    })
  })
})

const promiseClockValueSchema: z.ZodType<NovelPromiseClockValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(['scene', 'chapter', 'arc', 'volume']),
  }).strict(),
  moves: z.array(z.object({
    moveId: z.string().min(1),
    kind: z.enum(['open', 'remind', 'complicate', 'partial-payoff', 'payoff', 'retire', 'hold']),
    promiseId: z.string().min(1),
    debtIds: z.array(z.string().min(1)).nullable(),
    contribution: z.string().min(1),
  }).strict()).min(1),
  revisionRationale: z.string().min(1).nullable(),
}).strict().superRefine((value, context) => {
  const moveIds = new Set<string>()
  value.moves.forEach((move, index) => {
    if (moveIds.has(move.moveId)) {
      context.addIssue({
        code: 'custom',
        path: ['moves', index, 'moveId'],
        message: `promise moveId '${move.moveId}' must be unique within one clock value`,
      })
    }
    moveIds.add(move.moveId)
  })
})

const characterClockValueSchema: z.ZodType<NovelCharacterClockValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(['scene', 'chapter', 'arc', 'volume']),
  }).strict(),
  moves: z.array(z.object({
    moveId: z.string().min(1),
    kind: z.enum(['pressure', 'decision', 'consequence', 'commitment', 'transformation', 'hold']),
    characterId: z.string().min(1),
    storyEventIds: z.array(z.string().min(1)),
    contribution: z.string().min(1),
  }).strict()).min(1),
  revisionRationale: z.string().min(1).nullable(),
}).strict().superRefine((value, context) => {
  const moveIds = new Set<string>()
  value.moves.forEach((move, index) => {
    if (moveIds.has(move.moveId)) {
      context.addIssue({
        code: 'custom',
        path: ['moves', index, 'moveId'],
        message: `character moveId '${move.moveId}' must be unique within one clock value`,
      })
    }
    moveIds.add(move.moveId)
  })
})

const relationshipClockValueSchema: z.ZodType<NovelRelationshipClockValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(['scene', 'chapter', 'arc', 'volume']),
  }).strict(),
  moves: z.array(z.object({
    moveId: z.string().min(1),
    lineId: z.string().min(1),
    relationshipTargetId: z.string().min(1),
    storyEventIds: z.array(z.string().min(1)),
    emotionEpisodeIds: z.array(z.string().min(1)),
    contribution: z.string().min(1),
  }).strict()).min(1),
  revisionRationale: z.string().min(1).nullable(),
}).strict().superRefine((value, context) => {
  const moveIds = new Set<string>()
  value.moves.forEach((move, index) => {
    if (moveIds.has(move.moveId)) {
      context.addIssue({
        code: 'custom',
        path: ['moves', index, 'moveId'],
        message: `relationship moveId '${move.moveId}' must be unique within one clock value`,
      })
    }
    moveIds.add(move.moveId)
  })
})

const progressionClockValueSchema: z.ZodType<NovelProgressionClockValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(['scene', 'chapter', 'arc', 'volume']),
  }).strict(),
  tracks: z.array(z.object({
    trackId: z.string().min(1),
    role: z.enum(['main', 'supporting']),
    characterId: z.string().min(1),
    dimension: z.string().min(1),
    action: z.enum(['hold', 'setup', 'demonstrate', 'advance', 'test-limit', 'apply-consequence']),
    advancementIds: z.array(z.string().min(1)),
    promiseIds: z.array(z.string().min(1)),
    endingHypothesisIds: z.array(z.string().min(1)),
    readiness: z.object({
      setup: z.enum(['missing', 'in-progress', 'ready']),
      payoff: z.enum(['not-due', 'ready', 'delivered']),
    }).strict(),
    driftWarnings: z.array(z.object({
      warningId: z.string().min(1),
      kind: z.enum([
        'label-only',
        'missing-evidence',
        'missing-prerequisite',
        'missing-cost',
        'missing-counter',
        'ceiling-breach',
        'conflict-invalidated',
        'causal-weight-lost',
      ]),
      description: z.string().min(1),
    }).strict()),
    contribution: z.string().min(1),
  }).strict()).min(1),
  revisionRationale: z.string().min(1).nullable(),
}).strict().superRefine((value, context) => {
  const trackIds = new Set<string>()
  let hasMainTrack = false
  value.tracks.forEach((track, index) => {
    if (trackIds.has(track.trackId)) {
      context.addIssue({
        code: 'custom',
        path: ['tracks', index, 'trackId'],
        message: `progression trackId '${track.trackId}' must be unique within one clock value`,
      })
    }
    trackIds.add(track.trackId)
    if (track.role === 'main') hasMainTrack = true
    if (track.action === 'advance' && track.advancementIds.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['tracks', index, 'advancementIds'],
        message: `progression track '${track.trackId}' with action 'advance' requires at least one advancementId`,
      })
    }
  })
  if (!hasMainTrack) {
    context.addIssue({
      code: 'custom',
      path: ['tracks'],
      message: 'progression clock requires at least one main track',
    })
  }
})

const readerKnowledgeClockValueSchema: z.ZodType<NovelReaderKnowledgeClockValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(['scene', 'chapter', 'arc', 'volume']),
  }).strict(),
  events: z.array(z.object({
    eventId: z.string().min(1),
    kind: z.enum(['disclosure', 'hint', 'reminder', 'misdirection', 'recontextualization']),
    unitId: z.string().min(1),
    knowledgeTargetId: z.string().min(1),
    intendedEffect: z.enum(['know', 'suspect', 'misread', 'remember']),
    viewpointId: z.string().min(1).nullable(),
    viewpointAccess: z.enum(['direct', 'limited', 'reported', 'unreliable']),
    description: z.string().min(1),
    sourceAnchorIds: z.array(z.string().min(1)).min(1),
  }).strict()),
  ambiguityPolicy: z.object({
    mode: z.enum(['preserve', 'narrow', 'resolve']),
    description: z.string().min(1),
  }).strict(),
  revisionRationale: z.string().min(1).nullable(),
}).strict()

const mysteryClockValueSchema: z.ZodType<NovelMysteryClockValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(['scene', 'chapter', 'arc', 'volume']),
  }).strict(),
  moves: z.array(z.object({
    moveId: z.string().min(1),
    kind: z.enum([
      'open-question',
      'advance',
      'complicate',
      'misdirect',
      'partial-reveal',
      'reveal',
      'recontextualize',
      'hold',
    ]),
    mysteryId: z.string().min(1),
    clueIds: z.array(z.string().min(1)),
    knowledgeTargetIds: z.array(z.string().min(1)),
    contribution: z.string().min(1),
  }).strict()).min(1),
  revisionRationale: z.string().min(1).nullable(),
}).strict().superRefine((value, context) => {
  const moveIds = new Set<string>()
  value.moves.forEach((move, index) => {
    if (moveIds.has(move.moveId)) {
      context.addIssue({
        code: 'custom',
        path: ['moves', index, 'moveId'],
        message: `mystery moveId '${move.moveId}' must be unique within one clock value`,
      })
    }
    moveIds.add(move.moveId)
  })
})

const tensionLevelSchema = z.enum(['rest', 'low', 'medium', 'high', 'peak'])

const tensionPayoffValueSchema: z.ZodType<NovelTensionPayoffValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(['scene', 'chapter', 'arc', 'volume']),
  }).strict(),
  waves: z.array(z.object({
    waveId: z.string().min(1),
    source: z.string().min(1),
    intensity: z.object({
      opening: tensionLevelSchema,
      peak: tensionLevelSchema,
      closing: tensionLevelSchema,
    }).strict(),
    duration: z.object({
      startUnitId: z.string().min(1),
      endUnitId: z.string().min(1).nullable(),
    }).strict(),
    release: z.object({
      markerUnitId: z.string().min(1),
      status: z.enum(['planned', 'occurred']),
      kind: z.enum(['partial', 'full', 'reversal']),
      description: z.string().min(1),
      cost: z.string().min(1),
      aftermath: z.string().min(1),
    }).strict().nullable(),
    recovery: z.object({
      markerUnitId: z.string().min(1),
      status: z.enum(['planned', 'occurred']),
      description: z.string().min(1),
      stateAfter: z.string().min(1),
    }).strict().nullable(),
    sceneFunctions: z.array(z.object({
      sceneUnitId: z.string().min(1),
      function: z.enum([
        'anticipation',
        'pressure',
        'escalation',
        'climax',
        'release',
        'aftermath',
        'reflection',
        'recovery',
        'renewal',
        'transition',
      ]),
      contribution: z.string().min(1),
    }).strict()),
  }).strict()).min(1),
  revisionRationale: z.string().min(1).nullable(),
}).strict()

const endingClockValueSchema: z.ZodType<NovelEndingClockValue> = z.object({
  movement: z.string().min(1),
  state: z.string().min(1),
  storyTime: z.string().min(1).optional(),
  version: z.number().int().positive(),
  scope: z.object({
    unitId: z.string().min(1),
    level: z.enum(['scene', 'chapter', 'arc', 'volume', 'book', 'series']),
    closureScopeId: z.string().min(1),
  }).strict(),
  moves: z.array(z.object({
    moveId: z.string().min(1),
    kind: z.enum(['converge', 'resolve', 'transform', 'aftermath', 'hold']),
    debtReferences: z.array(narrativeDebtReferenceSchema),
    contribution: z.string().min(1),
  }).strict()).min(1),
  revisionRationale: z.string().min(1).nullable(),
}).strict().superRefine((value, context) => {
  const moveIds = new Set<string>()
  value.moves.forEach((move, moveIndex) => {
    if (moveIds.has(move.moveId)) {
      context.addIssue({
        code: 'custom',
        path: ['moves', moveIndex, 'moveId'],
        message: `ending moveId '${move.moveId}' must be unique within one clock value`,
      })
    }
    moveIds.add(move.moveId)

    const debtReferences = new Set<string>()
    move.debtReferences.forEach((reference, referenceIndex) => {
      const key = JSON.stringify([reference.clock, reference.id])
      if (debtReferences.has(key)) {
        context.addIssue({
          code: 'custom',
          path: ['moves', moveIndex, 'debtReferences', referenceIndex],
          message: `ending debt reference '${reference.clock}:${reference.id}' must be unique within one move`,
        })
      }
      debtReferences.add(key)
    })
  })
})

const narrativeClockValueSchemas: Readonly<Record<string, { parse(value: unknown): unknown }>> = {
  plot: plotProgressionValueSchema,
  world: worldClockValueSchema,
  promise: promiseClockValueSchema,
  character: characterClockValueSchema,
  relationship: relationshipClockValueSchema,
  progression: progressionClockValueSchema,
  'reader-knowledge': readerKnowledgeClockValueSchema,
  mystery: mysteryClockValueSchema,
  'tension-payoff': tensionPayoffValueSchema,
  ending: endingClockValueSchema,
}

function narrativeClockValidate(delta: DomainDelta): void {
  const schema = narrativeClockValueSchemas[delta.field]
  if (schema === undefined)
    throw new Error(`unknown narrative clock '${delta.field}'`)
  if (delta.operation === 'remove') {
    z.null().parse(delta.value)
    return
  }
  const value = schema.parse(delta.value) as { readonly scope?: { readonly unitId?: string } }
  if (value.scope !== undefined && value.scope.unitId !== delta.targetId)
    throw new Error(`${delta.field} scope unitId must match the clock targetId`)
  if (delta.field !== 'tension-payoff' && delta.sourceAnchorIds.length === 0)
    throw new Error(`${delta.field} requires at least one source anchor`)
}

export const novelDomainDeltaKinds: readonly NovelCanonDeltaKind[] = [
  { kind: 'world', validate: requiredFieldValue('rule', worldRuleValueSchema) },
  { kind: 'mystery', validate: conditionalFieldValue('state', mysteryStateValueSchema) },
  { kind: 'clue', validate: conditionalFieldValue('state', clueStateValueSchema) },
  { kind: 'promise', validate: conditionalFieldValue('state', promiseStateValueSchema) },
  { kind: 'roadmap', validate: requiredFieldValue('plan', rollingRoadmapPlanValueSchema) },
  { kind: 'ending', validate: requiredFieldValue('hypothesis', endingHypothesisValueSchema) },
  { kind: 'character-state', validate: conditionalFieldValue('arc-hypothesis', characterArcHypothesisValueSchema) },
  { kind: 'creative-profile', validate: creativeProfileValidate },
  { kind: 'reader-contract', validate: conditionalFieldValue('contract-profile', readerContractProfileValueSchema) },
  { kind: 'relationship', validate: conditionalFieldValue('line-state', relationshipLineStateValueSchema) },
  { kind: 'narrative-unit', validate: requiredFieldValue('unit', narrativeUnitValueSchema) },
  { kind: 'narrative-clock', validate: narrativeClockValidate },
]
