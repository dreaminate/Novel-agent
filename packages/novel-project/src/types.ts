/** Client-safe wire vocabulary for the Novel Project plugin. */

import type {} from '@deepseek-ai/dsh-llm-retry/types'

export type NovelWorkspaceId = string

export interface ManuscriptRevision {
  readonly unitId: string
  readonly title: string
  readonly text: string
}

export interface ManuscriptDiff {
  readonly format: 'unified'
  readonly text: string
}

/** Normalized text handed to Novel Project after generic TXT/Markdown/EPUB/DOCX upload or extraction. */
export interface NovelTextImportRequest {
  readonly expectedRevision: number
  readonly format: 'txt' | 'markdown' | 'epub' | 'docx'
  readonly sourceId: string
  readonly unitId: string
  readonly title: string
  readonly text: string
  /** Strict Canon/narrative proposals extracted from the imported text. Empty source refs bind to the full-text import anchor. */
  readonly deltas?: readonly CanonDelta[] | undefined
  /** Encoding label reported for the original source bytes by the upload/extraction plugin. */
  readonly sourceEncoding?: string | undefined
  /** Whether the original source bytes began with a byte-order mark. */
  readonly sourceBom?: boolean | undefined
  /** Original source byte length reported before text normalization. */
  readonly sourceByteLength?: number | undefined
  /** Optional Workspace file whose exact bytes should be retained for source publication. */
  readonly sourcePath?: string | undefined
}

/** Accepted project-state families owned by the Novel Project Canon. */
export const CANON_FACT_KINDS = [
  'canon',
  'creative-profile',
  'reader-contract',
  'world',
  'faction-state',
  'location-state',
  'object-state',
  'story-event',
  'chapter-state',
  'character-state',
  'emotion-state',
  'progression',
  'relationship',
  'knowledge',
  'promise',
  'clue',
  'mystery',
  'ending',
  'roadmap',
  'timeline',
] as const

export type CanonFactKind = typeof CANON_FACT_KINDS[number]

/** JSON-compatible value stored in one accepted Canon field. */
export type NovelCanonValue =
  | string
  | number
  | boolean
  | null
  | readonly NovelCanonValue[]
  | { readonly [key: string]: NovelCanonValue }

/** Versioned accepted rule governing one explicit part of the story world. */
export type NovelWorldRuleValue = {
  readonly scope: string
  readonly statement: string
  readonly version: number
  readonly exceptions: readonly string[]
  readonly publicBelief: string
  readonly hiddenTruth: string
  readonly observedConsequences: readonly string[]
}

/** Author-owned truth and fair-reveal contract for one opaque mystery identity. */
export type NovelMysteryStateValue = {
  readonly version: number
  readonly question: string
  readonly truth:
    | {
      readonly status: 'unknown-to-author'
      readonly answer: null
    }
    | {
      readonly status: 'known-to-author'
      readonly answer: string
    }
  readonly hypotheses: readonly string[]
  readonly knowers: readonly string[]
  readonly readerVisibility: string
  readonly concealmentRule: string
  readonly revealConditions: readonly string[]
  readonly earliestFairResolutionUnitId: string | null
  readonly desiredRevealWindow: {
    readonly startUnitId: string
    readonly endUnitId: string
  } | null
  readonly actualReveal: {
    readonly unitId: string
    readonly description: string
  } | null
  readonly aftermath: string | null
  readonly revisionRationale: string | null
}

/** Author-accepted lifecycle state for one clue, foreshadowing thread, or red herring. */
export type NovelClueStateValue = {
  readonly version: number
  readonly role: 'clue' | 'foreshadowing' | 'red-herring'
  readonly statement: string
  readonly linkedMysteryIds: readonly string[]
  readonly status:
    | 'proposed'
    | 'planted'
    | 'noticed'
    | 'reinforced'
    | 'complicated'
    | 'due'
    | 'paid-off'
    | 'transformed'
    | 'retired'
    | 'abandoned'
  readonly readerVisibility: 'hidden' | 'available' | 'noticed' | 'misdirected' | 'resolved'
  readonly intendedFunction: string
  readonly expectedPayoffWindow: string | null
  readonly payoff: {
    readonly unitId: string
    readonly kind: 'confirmation' | 'reinterpretation' | 'reveal' | 'reversal' | 'exit'
    readonly description: string
    readonly aftermath: string
  } | null
  readonly abandonmentReason: string | null
  readonly revisionRationale: string | null
}

/** Author-accepted belief and access state for one reader or character fact boundary. */
export type NovelKnowledgeStateValue = {
  readonly version: number
  readonly subjectKind: 'reader' | 'character'
  readonly beliefStatus: 'known' | 'suspected' | 'misread'
  readonly memoryStatus: 'retained' | 'recalled' | 'forgotten'
  readonly belief: string
  readonly truthAlignment: 'accurate' | 'partial' | 'incorrect' | 'unverified'
  readonly access: {
    readonly mode: 'observed' | 'told' | 'inferred' | 'remembered' | 'misreported'
    readonly unitId: string
    readonly viewpointId: string | null
    readonly viewpointAccess: 'direct' | 'limited' | 'reported' | 'unreliable'
  }
  readonly revisionRationale: string | null
}

/** One source-backed story beat that opens, advances, complicates, or resolves a narrative promise. */
export type NovelPromiseBeatValue = {
  readonly beatId: string
  readonly unitId: string
  readonly sourceRevision: number
  readonly sourceAnchorIds: readonly string[]
  readonly description: string
}

/** Author-accepted lifecycle state for one narrative promise and its payoff. */
export type NovelPromiseStateValue = {
  readonly version: number
  readonly promise: string
  readonly type: string
  readonly weight: 'minor' | 'supporting' | 'major' | 'core'
  readonly horizon: {
    readonly openedUnitId: string
    readonly expectedPayoffStartUnitId: string
    readonly expectedPayoffEndUnitId: string
  }
  readonly setup: NovelPromiseBeatValue
  readonly reminders: readonly NovelPromiseBeatValue[]
  readonly complications: readonly NovelPromiseBeatValue[]
  readonly resolution:
    | {
        readonly status: 'open'
        readonly payoffType: null
        readonly beat: null
        readonly retirementRationale: null
      }
    | {
        readonly status: 'partially-paid' | 'paid'
        readonly payoffType: 'micro' | 'chapter' | 'arc' | 'relationship' | 'mystery' | 'progression' | 'thematic' | 'final'
        readonly beat: NovelPromiseBeatValue
        readonly retirementRationale: null
      }
    | {
        readonly status: 'retired'
        readonly payoffType: null
        readonly beat: NovelPromiseBeatValue
        readonly retirementRationale: string
      }
  readonly aftermath: string | null
  readonly revisionRationale: string | null
}

/** Author-accepted rolling plan with an explicit detailed horizon and ordered units. */
export type NovelRollingRoadmapPlanValue = {
  readonly version: number
  readonly detailedThroughUnitId: string
  readonly horizonSummary: string
  readonly units: readonly {
    readonly unitId: string
    readonly order: number
    readonly targetChapterStart: number
    readonly targetChapterEnd: number
    readonly milestone: string
    readonly status: string
    readonly dependsOnUnitIds: readonly string[]
    readonly scopedDebtIds: readonly string[]
    readonly changeRationale: string | null
  }[]
}

/** One exact rolling-roadmap unit reference resolved within the accepted plan value. */
export interface NovelRollingRoadmapResolvedUnitReference {
  readonly unitId: string
  readonly unit: NovelRollingRoadmapPlanValue['units'][number]
}

/** One rolling-roadmap unit reference with multiple exact candidates in the accepted plan. */
export interface NovelRollingRoadmapAmbiguousUnitReference {
  readonly unitId: string
  readonly candidates: readonly NovelRollingRoadmapPlanValue['units'][number][]
}

/** One exact rolling-roadmap debt reference resolved from the accepted Narrative projection. */
export interface NovelRollingRoadmapResolvedDebtReference {
  readonly debtId: string
  readonly debt: NovelNarrativeDebt
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
}

/** One rolling-roadmap debt reference with multiple current candidates across Narrative clocks. */
export interface NovelRollingRoadmapAmbiguousDebtReference {
  readonly debtId: string
  readonly candidates: readonly {
    readonly debt: NovelNarrativeDebt
    readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  }[]
}

/** One roadmap unit with its declared dependency and scoped-debt references classified in order. */
export interface NovelRollingRoadmapOrderedUnit {
  readonly unit: NovelRollingRoadmapPlanValue['units'][number]
  readonly dependsOnUnitIds: {
    readonly resolved: readonly NovelRollingRoadmapResolvedUnitReference[]
    readonly missing: readonly string[]
    readonly ambiguous: readonly NovelRollingRoadmapAmbiguousUnitReference[]
  }
  readonly scopedDebtIds: {
    readonly resolved: readonly NovelRollingRoadmapResolvedDebtReference[]
    readonly missing: readonly string[]
    readonly ambiguous: readonly NovelRollingRoadmapAmbiguousDebtReference[]
  }
}

/** Revision-bound rolling roadmap plus read-only resolution of every declared reference. */
export interface NovelRollingRoadmapResolution {
  readonly roadmapId: string
  readonly value: NovelRollingRoadmapPlanValue
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
  readonly orderedUnits: readonly NovelRollingRoadmapOrderedUnit[]
}

export interface CanonFactDelta {
  readonly id: string
  readonly kind: CanonFactKind
  readonly operation: 'set' | 'remove'
  readonly targetId: string
  readonly field: string
  readonly value: NovelCanonValue
  readonly sourceAnchorIds: readonly string[]
}

/** Domain-owned JSON carried by the existing Result Packet and accepted revision. */
export interface ExtensionCanonDelta {
  readonly id: string
  readonly kind: 'extension'
  readonly namespace: string
  readonly operation: 'set' | 'remove'
  readonly targetId: string
  readonly field: string
  readonly value: NovelCanonValue
  readonly sourceAnchorIds: readonly string[]
}

/** Host-only registration from an injected domain plugin; parsing validates without rewriting accepted JSON. */
export interface NovelCanonExtension {
  readonly namespace: string
  readonly valueSchema: { parse(value: unknown): unknown }
}

/** Host-only registration from an injected domain plugin owning one Canon Delta kind's value contract. */
export interface NovelCanonDeltaKind {
  readonly kind: string
  /** Validate the kind-owned field/operation/value of one parsed Delta envelope; throw when invalid. */
  validate(delta: {
    readonly operation: 'set' | 'remove'
    readonly field: string
    readonly value: unknown
    readonly targetId: string
    readonly sourceAnchorIds: readonly string[]
  }): void
}

/** Effective revision sources at one accepted or review-candidate revision; excludes discarded branches. */
export interface NovelCanonSnapshot {
  readonly projectId: string
  readonly workspaceId: NovelWorkspaceId
  readonly revision: number
  readonly revisions: readonly Omit<AcceptedNovelRevision, 'authorization'>[]
}

/** Host-only domain projection; mutating domains may also validate Canon candidates. */
export interface NovelCanonProjector {
  readonly project: (snapshot: NovelCanonSnapshot) => unknown
  readonly validate?: (before: NovelCanonSnapshot, candidate: NovelCanonSnapshot) => void
}

/** Cross-plugin fact notification; the accepted revision remains the source of complete data. */
export interface NovelCanonChange {
  readonly projectId: string
  readonly revision: number
  readonly deltaRefs: readonly string[]
  readonly sourceSessionId: string
}

export const NARRATIVE_LEVELS = [
  'series',
  'book',
  'volume',
  'arc',
  'chapter',
  'scene',
  'beat',
  'prose',
] as const

export type NarrativeLevel = typeof NARRATIVE_LEVELS[number]

export const NARRATIVE_CLOCKS = [
  'plot',
  'promise',
  'progression',
  'world',
  'character',
  'relationship',
  'mystery',
  'reader-knowledge',
  'tension-payoff',
  'ending',
] as const

export type NarrativeClock = typeof NARRATIVE_CLOCKS[number]

/** One accepted causal turn inside a plot line. */
export type NovelPlotTurn = {
  readonly turnId: string
  readonly storyEventId: string
  readonly turnType: 'obstacle' | 'choice' | 'consequence' | 'reversal'
  readonly description: string
  readonly cost: string
  readonly stateAfter: string
}

/** Versioned accepted progression for the reserved plot narrative clock. */
export type NovelPlotProgressionValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: NarrativeLevel
  }
  readonly lines: readonly {
    readonly lineId: string
    readonly goal: string
    readonly stakes: string
    readonly status: string
    readonly turns: readonly NovelPlotTurn[]
  }[]
  readonly revisionRationale: string | null
}

/** Opaque reference to one Canon-owned world rule or continuity record. */
export type NovelWorldClockReference =
  | { readonly kind: 'rule'; readonly targetId: string }
  | { readonly kind: 'faction-continuity'; readonly entryId: string }
  | { readonly kind: 'location-continuity'; readonly entryId: string }
  | { readonly kind: 'object-continuity'; readonly entryId: string }

/** Versioned world movement composed from accepted rule and continuity references. */
export type NovelWorldClockValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: 'scene' | 'chapter' | 'arc' | 'volume'
  }
  readonly moves: readonly {
    readonly moveId: string
    readonly references: readonly NovelWorldClockReference[]
    readonly contribution: string
  }[]
  readonly revisionRationale: string | null
}

/** Versioned promise movement for one accepted narrative scope. */
export type NovelPromiseClockValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: 'scene' | 'chapter' | 'arc' | 'volume'
  }
  readonly moves: readonly {
    readonly moveId: string
    readonly kind: 'open' | 'remind' | 'complicate' | 'partial-payoff' | 'payoff' | 'retire' | 'hold'
    /** Stable target ID of an accepted promise fact; its state remains Canon-owned. */
    readonly promiseId: string
    /** Stable IDs of related narrative debts; their state remains debt-projection-owned. */
    readonly debtIds: readonly string[] | null
    readonly contribution: string
  }[]
  readonly revisionRationale: string | null
}

/** Versioned character pressure, choice, and consequence movement for one accepted narrative scope. */
export type NovelCharacterClockValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: 'scene' | 'chapter' | 'arc' | 'volume'
  }
  readonly moves: readonly {
    readonly moveId: string
    readonly kind: 'pressure' | 'decision' | 'consequence' | 'commitment' | 'transformation' | 'hold'
    readonly characterId: string
    /** Stable target IDs of accepted story events; their details remain Canon-owned. */
    readonly storyEventIds: readonly string[]
    readonly contribution: string
  }[]
  readonly revisionRationale: string | null
}

/** Versioned relationship movement that references Canon-owned directional lines and evidence. */
export type NovelRelationshipClockValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: 'scene' | 'chapter' | 'arc' | 'volume'
  }
  readonly moves: readonly {
    readonly moveId: string
    /** Stable bidirectional line identity from the relationship projection. */
    readonly lineId: string
    /** Stable directional Canon target whose state remains relationship-projection-owned. */
    readonly relationshipTargetId: string
    readonly storyEventIds: readonly string[]
    readonly emotionEpisodeIds: readonly string[]
    readonly contribution: string
  }[]
  readonly revisionRationale: string | null
}

/** Versioned capability-progression pacing for one accepted narrative scope. */
export type NovelProgressionClockValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: 'scene' | 'chapter' | 'arc' | 'volume'
  }
  readonly tracks: readonly {
    readonly trackId: string
    readonly role: 'main' | 'supporting'
    readonly characterId: string
    readonly dimension: string
    readonly action: 'hold' | 'setup' | 'demonstrate' | 'advance' | 'test-limit' | 'apply-consequence'
    /** Stable target IDs of accepted progression/advancement facts; their details remain Canon-owned. */
    readonly advancementIds: readonly string[]
    /** Stable target IDs of accepted promise/state facts related to this pacing choice. */
    readonly promiseIds: readonly string[]
    /** Stable target IDs of accepted ending/hypothesis facts related to this pacing choice. */
    readonly endingHypothesisIds: readonly string[]
    readonly readiness: {
      readonly setup: 'missing' | 'in-progress' | 'ready'
      readonly payoff: 'not-due' | 'ready' | 'delivered'
    }
    readonly driftWarnings: readonly {
      readonly warningId: string
      readonly kind:
        | 'label-only'
        | 'missing-evidence'
        | 'missing-prerequisite'
        | 'missing-cost'
        | 'missing-counter'
        | 'ceiling-breach'
        | 'conflict-invalidated'
        | 'causal-weight-lost'
      readonly description: string
    }[]
    readonly contribution: string
  }[]
  readonly revisionRationale: string | null
}

/** Versioned reader-facing disclosure pacing for one accepted narrative scope. */
export type NovelReaderKnowledgeClockValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: 'scene' | 'chapter' | 'arc' | 'volume'
  }
  readonly events: readonly {
    readonly eventId: string
    readonly kind: 'disclosure' | 'hint' | 'reminder' | 'misdirection' | 'recontextualization'
    readonly unitId: string
    readonly knowledgeTargetId: string
    readonly intendedEffect: 'know' | 'suspect' | 'misread' | 'remember'
    readonly viewpointId: string | null
    readonly viewpointAccess: 'direct' | 'limited' | 'reported' | 'unreliable'
    readonly description: string
    readonly sourceAnchorIds: readonly string[]
  }[]
  readonly ambiguityPolicy: {
    readonly mode: 'preserve' | 'narrow' | 'resolve'
    readonly description: string
  }
  readonly revisionRationale: string | null
}

/** Versioned mystery progression and reveal pacing for one accepted narrative scope. */
export type NovelMysteryClockValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: 'scene' | 'chapter' | 'arc' | 'volume'
  }
  readonly moves: readonly {
    readonly moveId: string
    readonly kind:
      | 'open-question'
      | 'advance'
      | 'complicate'
      | 'misdirect'
      | 'partial-reveal'
      | 'reveal'
      | 'recontextualize'
      | 'hold'
    readonly mysteryId: string
    readonly clueIds: readonly string[]
    readonly knowledgeTargetIds: readonly string[]
    readonly contribution: string
  }[]
  readonly revisionRationale: string | null
}

/** Fixed qualitative levels used to describe one accepted tension wave. */
export type NovelTensionLevel = 'rest' | 'low' | 'medium' | 'high' | 'peak'

/** Versioned pacing contract for the reserved tension/payoff narrative clock. */
export type NovelTensionPayoffValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: 'scene' | 'chapter' | 'arc' | 'volume'
  }
  readonly waves: readonly {
    readonly waveId: string
    readonly source: string
    readonly intensity: {
      readonly opening: NovelTensionLevel
      readonly peak: NovelTensionLevel
      readonly closing: NovelTensionLevel
    }
    readonly duration: {
      readonly startUnitId: string
      readonly endUnitId: string | null
    }
    readonly release: {
      readonly markerUnitId: string
      readonly status: 'planned' | 'occurred'
      readonly kind: 'partial' | 'full' | 'reversal'
      readonly description: string
      readonly cost: string
      readonly aftermath: string
    } | null
    readonly recovery: {
      readonly markerUnitId: string
      readonly status: 'planned' | 'occurred'
      readonly description: string
      readonly stateAfter: string
    } | null
    readonly sceneFunctions: readonly {
      readonly sceneUnitId: string
      readonly function:
        | 'anticipation'
        | 'pressure'
        | 'escalation'
        | 'climax'
        | 'release'
        | 'aftermath'
        | 'reflection'
        | 'recovery'
        | 'renewal'
        | 'transition'
      readonly contribution: string
    }[]
  }[]
  readonly revisionRationale: string | null
}

/** Versioned closure movement for one accepted narrative scope. */
export type NovelEndingClockValue = {
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  readonly version: number
  readonly scope: {
    readonly unitId: string
    readonly level: 'scene' | 'chapter' | 'arc' | 'volume' | 'book' | 'series'
    readonly closureScopeId: string
  }
  readonly moves: readonly {
    readonly moveId: string
    readonly kind: 'converge' | 'resolve' | 'transform' | 'aftermath' | 'hold'
    readonly debtReferences: readonly NarrativeDebtReference[]
    readonly contribution: string
  }[]
  readonly revisionRationale: string | null
}

/** Accepted accounting of what one completed Chapter changed for the next writing turn. */
export type NovelPostChapterCheckValue = {
  readonly contractAssessment: {
    readonly contractRevision: number
    readonly contractSourceDeltaId: string
    readonly outcome: 'met' | 'changed' | 'missed'
    readonly deviations: readonly string[]
  }
  readonly manuscriptSourceRevision: number
  readonly changes: readonly string[]
  readonly costs: readonly string[]
  readonly newlyPossible: readonly string[]
  readonly newlyImpossible: readonly string[]
  readonly readerNowKnows: readonly string[]
  readonly readerNowSuspects: readonly string[]
  readonly characterCarryForward: readonly {
    readonly characterId: string
    readonly carries: readonly string[]
  }[]
  readonly debtTransitions: readonly {
    readonly clock: NarrativeClock
    readonly debtId: string
    readonly transition: 'created' | 'advanced' | 'paid' | 'retired'
    readonly sourceDeltaId: string
  }[]
}

/** Versioned accepted hypothesis and costly decision evidence for one character arc. */
export type NovelCharacterArcHypothesisValue = {
  readonly version: number
  readonly scopeUnitId: string
  readonly hypothesis: string
  readonly startingBelief: string
  readonly targetTransformation: string
  readonly transformationDimensions: readonly (
    | 'belief'
    | 'strategy'
    | 'identity'
    | 'relationship'
    | 'responsibility'
  )[]
  readonly pressures: readonly string[]
  readonly decisionChain: readonly {
    readonly decisionId: string
    readonly storyEventId: string
    readonly pressure: string
    readonly choice: string
    readonly rejectedAlternatives: readonly string[]
    readonly cost: string
    readonly persistentConsequence: string
    readonly transformationEvidence: string
  }[]
  readonly currentStage: string
  readonly unresolvedQuestion: string
  readonly changeRationale: string | null
}

/** Versioned author-approved style and voice evidence for one creative profile. */
export type NovelCreativeStyleProfileValue = {
  readonly version: number
  readonly profileName: string
  readonly voicePrinciples: readonly string[]
  readonly viewpoint: {
    readonly person: string
    readonly distance: string
    readonly rules: readonly string[]
  }
  readonly sentenceRhythm: {
    readonly principles: readonly string[]
    readonly forbiddenPatterns: readonly string[]
  }
  readonly dialogue: {
    readonly principles: readonly string[]
    readonly characterDifferentiation: readonly string[]
  }
  readonly sensoryPriorities: readonly string[]
  readonly subtextRules: readonly string[]
  readonly expositionRules: readonly string[]
  readonly forbiddenHabits: readonly string[]
  readonly approvedExemplars: readonly {
    readonly exemplarId: string
    readonly sourceUnitId: string
    readonly sourceRevision: number
    readonly sourceAnchorIds: readonly string[]
    readonly purpose: string
  }[]
  readonly adaptationBoundaries: readonly {
    readonly context: string
    readonly invariants: readonly string[]
    readonly mayVary: readonly string[]
  }[]
  readonly revisionRationale: string | null
}

/** Versioned author-accepted platform, release cadence and planned serial length. */
export type NovelCreativeSerializationProfileValue = {
  readonly version: number
  readonly platform: string
  readonly cadence: {
    readonly chaptersPerWeek: number
    readonly releaseDays: readonly string[]
  }
  readonly chapterLengthRange: {
    readonly min: number
    readonly max: number
  }
  readonly plannedLength: {
    readonly unit: 'characters' | 'chapters'
    readonly target: number
  }
  readonly revisionRationale: string | null
}

/** Versioned author-accepted premise and delivery evidence for one reader contract. */
export type NovelReaderContractProfileValue = {
  readonly version: number
  readonly premise: {
    readonly distinctiveSituation: string
    readonly centralDramaticQuestion: string
    readonly readerFantasy: string
    readonly constraints: readonly string[]
    readonly tonalRange: readonly string[]
  }
  readonly coreExperience: string
  readonly promises: readonly {
    readonly promiseId: string
    readonly statement: string
  }[]
  readonly exclusions: readonly string[]
  readonly targetAudience: {
    readonly description: string
    readonly expectations: readonly string[]
  }
  readonly evidence: readonly {
    readonly evidenceId: string
    readonly sourceUnitId: string
    readonly sourceRevision: number
    readonly sourceAnchorIds: readonly string[]
    readonly demonstrates: string
  }[]
  readonly revisionRationale: string | null
}

/** One accepted, source-bearing change in a directional relationship line. */
export type NovelRelationshipTurn = {
  readonly turnId: string
  readonly eventId: string
  readonly storyOrder: number
  readonly turnType:
    | 'bid'
    | 'acceptance'
    | 'rejection'
    | 'reversal'
    | 'rupture'
    | 'repair'
    | 'sacrifice'
    | 'commitment'
    | 'climax'
  readonly action: string
  readonly otherResponse: string
  readonly cost: string
  readonly persistentConsequence: string
  readonly stageAfter: string
}

/** Versioned Canon state for one directional relationship, preserving each subject's agency. */
export type NovelRelationshipLineStateValue = {
  readonly version: number
  readonly premise: string
  readonly form: string
  readonly stage: string
  readonly independentGoal: string
  readonly currentTrust: string
  readonly currentConflict: string
  readonly currentCommitment: string
  readonly boundaries: readonly string[]
  readonly sharedHistory: readonly string[]
  readonly obstacles: readonly string[]
  readonly unresolvedDebts: readonly string[]
  readonly mainPlotConsequences: readonly string[]
  readonly turns: readonly NovelRelationshipTurn[]
  readonly agencyEvidence: readonly string[]
  readonly desiredEndingState: string | null
  readonly revisionRationale: string | null
}

/** Accepted writing contract attached only to a planned or accepted Chapter unit. */
export interface NovelChapterContract {
  readonly viewpoint: string
  readonly storyTime: string
  readonly sceneFunctions: readonly string[]
  readonly activePlotLineIds: readonly string[]
  readonly activeRelationshipLineIds: readonly string[]
  readonly promisesTouched: readonly {
    readonly promiseId: string
    readonly intendedMovement: string
  }[]
  readonly informationPolicy: {
    readonly readerMayKnow: readonly string[]
    readonly characterMayKnow: readonly {
      readonly characterId: string
      readonly facts: readonly string[]
    }[]
  }
  readonly progressionSetups: readonly string[]
  readonly progressionPayoffs: readonly string[]
  readonly emotionalMovement: string
  readonly endingPull: string
  readonly prohibitedContradictions: readonly string[]
  readonly styleConstraints: readonly string[]
  readonly lengthRange: {
    readonly min: number
    readonly max: number
  }
  readonly acceptanceGates: readonly string[]
}

export interface NarrativeUnitValue {
  readonly level: NarrativeLevel
  readonly parentId: string | null
  readonly order: number
  readonly objective: string
  readonly entryState: string
  readonly exitState: string
  readonly status: string
  readonly chapterContract?: NovelChapterContract | undefined
}

export interface NarrativeUnitSetDelta {
  readonly id: string
  readonly kind: 'narrative-unit'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'unit'
  readonly value: NarrativeUnitValue
  readonly sourceAnchorIds: readonly string[]
}

export interface NarrativeUnitRemoveDelta {
  readonly id: string
  readonly kind: 'narrative-unit'
  readonly operation: 'remove'
  readonly targetId: string
  readonly field: 'unit'
  readonly value: null
  readonly sourceAnchorIds: readonly string[]
}

export type NarrativeUnitDelta = NarrativeUnitSetDelta | NarrativeUnitRemoveDelta

/** Strict, versioned update for the reserved plot narrative clock. */
export interface PlotProgressionClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'plot'
  readonly value: NovelPlotProgressionValue
  readonly sourceAnchorIds: readonly string[]
}

/** Strict, versioned update for the reserved world narrative clock. */
export interface WorldClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'world'
  readonly value: NovelWorldClockValue
  readonly sourceAnchorIds: readonly string[]
}

/** Strict, versioned update for the reserved promise narrative clock. */
export interface PromiseClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'promise'
  readonly value: NovelPromiseClockValue
  readonly sourceAnchorIds: readonly string[]
}

/** Strict, versioned update for the reserved character narrative clock. */
export interface CharacterClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'character'
  readonly value: NovelCharacterClockValue
  readonly sourceAnchorIds: readonly string[]
}

/** Strict, versioned update for the reserved relationship narrative clock. */
export interface RelationshipClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'relationship'
  readonly value: NovelRelationshipClockValue
  readonly sourceAnchorIds: readonly string[]
}

/** Strict, versioned update for the reserved progression narrative clock. */
export interface ProgressionClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'progression'
  readonly value: NovelProgressionClockValue
  readonly sourceAnchorIds: readonly string[]
}

/** Strict, versioned update for the reserved reader-knowledge narrative clock. */
export interface ReaderKnowledgeClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'reader-knowledge'
  readonly value: NovelReaderKnowledgeClockValue
  readonly sourceAnchorIds: readonly string[]
}

/** Strict, versioned update for the reserved mystery narrative clock. */
export interface MysteryClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'mystery'
  readonly value: NovelMysteryClockValue
  readonly sourceAnchorIds: readonly string[]
}

/** Strict, versioned update for the reserved tension/payoff narrative clock. */
export interface TensionPayoffClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'tension-payoff'
  readonly value: NovelTensionPayoffValue
  readonly sourceAnchorIds: readonly string[]
}

/** Strict, versioned update for the reserved ending narrative clock. */
export interface EndingClockSetDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'set'
  readonly targetId: string
  readonly field: 'ending'
  readonly value: NovelEndingClockValue
  readonly sourceAnchorIds: readonly string[]
}

export type NarrativeClockSetDelta =
  | PlotProgressionClockSetDelta
  | WorldClockSetDelta
  | PromiseClockSetDelta
  | CharacterClockSetDelta
  | RelationshipClockSetDelta
  | ProgressionClockSetDelta
  | ReaderKnowledgeClockSetDelta
  | MysteryClockSetDelta
  | TensionPayoffClockSetDelta
  | EndingClockSetDelta

export interface NarrativeClockRemoveDelta {
  readonly id: string
  readonly kind: 'narrative-clock'
  readonly operation: 'remove'
  readonly targetId: string
  readonly field: NarrativeClock
  readonly value: null
  readonly sourceAnchorIds: readonly string[]
}

export type NarrativeClockDelta = NarrativeClockSetDelta | NarrativeClockRemoveDelta

/** Stable identity for one debt across the ten narrative clocks. */
export type NarrativeDebtReference = {
  readonly clock: NarrativeClock
  readonly id: string
}

/** Supported author-accepted ways for a scoped ending to resolve. */
export type NovelEndingResolutionMode =
  | 'closure'
  | 'transformation'
  | 'deliberate-openness'
  | 'tragic-failure'
  | 'sequel-transfer'

/** One explicit subject state expected after the accepted ending. */
export type NovelEndingFinalState = {
  readonly kind:
    | 'character'
    | 'relationship'
    | 'world'
    | 'progression'
    | 'mystery'
    | 'promise'
    | 'other'
  readonly subjectId: string
  readonly state: string
}

/** Versioned Canon contract for how one Book or Series is intended to end. */
export type NovelEndingHypothesisValue = {
  readonly scopeUnitId: string
  readonly version: number
  readonly endingTarget: string
  readonly decisiveConflict: string
  readonly protagonistChoice: string
  readonly thematicReturn: string
  readonly desiredEmotionalAfterimage: string
  readonly resolutionMode: NovelEndingResolutionMode
  readonly finalStates: readonly NovelEndingFinalState[]
  readonly aftermath: string
  readonly deliberatelyUnresolvedDebts: readonly NarrativeDebtReference[]
  readonly epiloguePurpose: string | null
}

export interface NarrativeDebtValue {
  readonly summary: string
  readonly status: string
  readonly horizon?: string | undefined
  /** Explicit prerequisite debts that should be handled before this debt. */
  readonly dependsOn?: readonly NarrativeDebtReference[] | undefined
}

export interface NarrativeDebtSetDelta {
  readonly id: string
  readonly kind: 'narrative-debt'
  readonly operation: 'set'
  readonly targetId: string
  readonly unitId: string
  readonly field: NarrativeClock
  readonly value: NarrativeDebtValue
  readonly sourceAnchorIds: readonly string[]
}

export interface NarrativeDebtRemoveDelta {
  readonly id: string
  readonly kind: 'narrative-debt'
  readonly operation: 'remove'
  readonly targetId: string
  readonly unitId: string
  readonly field: NarrativeClock
  readonly value: null
  readonly sourceAnchorIds: readonly string[]
}

export type NarrativeDebtDelta = NarrativeDebtSetDelta | NarrativeDebtRemoveDelta

export type CanonDelta =
  | CanonFactDelta
  | ExtensionCanonDelta
  | NarrativeUnitDelta
  | NarrativeClockDelta
  | NarrativeDebtDelta

export interface SourceAnchor {
  readonly id: string
  readonly sourceId: string
  readonly start: number
  readonly end: number
  readonly contentHash: string
  /** Encoding label reported for the original source bytes by the importer. */
  readonly sourceEncoding?: string | undefined
  /** Whether the original source bytes began with a byte-order mark. */
  readonly sourceBom?: boolean | undefined
  /** Original source byte length reported before text normalization. */
  readonly sourceByteLength?: number | undefined
  /** Resolved Workspace path from which exact original bytes were read. */
  readonly sourcePath?: string | undefined
  /** Exact original bytes encoded as Base64 for byte-preserving publication. */
  readonly sourceBytesBase64?: string | undefined
}

export interface AnchoredIssue {
  readonly id: string
  readonly dimension: string
  readonly severity: 'critical' | 'major' | 'minor'
  readonly problem: string
  readonly suggestion: string
  readonly sourceAnchorIds: readonly string[]
}

export type AcceptanceAuthorization =
  | {
    readonly kind: 'author'
    readonly actorId: string
    readonly decisionId: string
  }
  | {
    readonly kind: 'policy'
    readonly policyId: string
    readonly runId: string
    readonly decisionId: string
  }

/** One accepted Canon value that only a later author-approved unlock may change. */
export interface NovelCanonLock {
  readonly kind: string
  readonly targetId: string
  readonly field: string
  readonly value: CanonFactDelta['value']
}

export interface ResultProvenance {
  readonly taskId: string
  readonly sessionId: string
  readonly producer: string
}

/** One accepted Canon fact projected from the revision that last set it. */
export interface NovelCanonFact {
  /** Built-in fact kind or the complete namespace of an extension Delta. */
  readonly kind: string
  readonly targetId: string
  readonly field: string
  readonly value: CanonFactDelta['value']
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: ResultProvenance
}

/** Source metadata retained for one current field of a grouped Canon entity. */
export interface NovelCanonFieldSource {
  readonly value: CanonFactDelta['value']
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: ResultProvenance
}

/** One accepted project-state entity assembled from its current Canon fields. */
export interface NovelCanonEntity {
  readonly kind: string
  readonly targetId: string
  readonly fields: Readonly<Record<string, CanonFactDelta['value']>>
  readonly fieldSources: Readonly<Record<string, NovelCanonFieldSource>>
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: ResultProvenance
}

/** Deterministic Canon state reconstructed for one accepted project revision. */
export interface NovelCanonProjection {
  readonly projectId: string
  readonly workspaceId: NovelWorkspaceId
  readonly revision: number
  readonly facts: readonly NovelCanonFact[]
  /** Current fields grouped into author-facing project-state entities. */
  readonly entities: readonly NovelCanonEntity[]
}

/** Source metadata for one field in a pair-keyed relationship projection. */
export interface NovelRelationshipFieldSource {
  readonly value: CanonFactDelta['value']
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: ResultProvenance
}

/** One directional pair with its currently accepted relationship fields. */
export interface NovelRelationshipPair {
  /** Stable pair key, conventionally formatted as `from->to`. */
  readonly pair: string
  readonly from: string
  readonly to: string
  readonly fields: Readonly<Record<string, CanonFactDelta['value']>>
  /** Per-field provenance retained when a pair contains multiple deltas. */
  readonly fieldSources: Readonly<Record<string, NovelRelationshipFieldSource>>
  /** Metadata of the latest field in deterministic revision/delta order. */
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: ResultProvenance
}

/** One unordered participant line containing each accepted directional state independently. */
export interface NovelRelationshipLine {
  /** Stable line key with lexicographically ordered participants. */
  readonly line: string
  readonly participants: readonly [string, string]
  readonly directions: readonly NovelRelationshipPair[]
}

/** Deterministic relationship projection rebuilt from one accepted revision. */
export interface NovelRelationshipProjection {
  readonly projectId: string
  readonly workspaceId: NovelWorkspaceId
  readonly revision: number
  readonly relationships: readonly NovelRelationshipLine[]
}

export interface NovelNarrativeUnit {
  readonly id: string
  readonly level: NarrativeLevel
  readonly parentId: string | null
  readonly order: number
  readonly objective: string
  readonly entryState: string
  readonly exitState: string
  readonly status: string
  readonly chapterContract?: NovelChapterContract | undefined
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: ResultProvenance
  readonly delta: NarrativeUnitDelta
}

export interface NovelNarrativeClockEntry {
  readonly unitId: string
  readonly clock: NarrativeClock
  readonly movement: string
  readonly state: string
  readonly storyTime?: string | undefined
  /** Present only for reserved strict narrative clocks. */
  readonly version?: number | undefined
  /** Present only for reserved strict narrative clocks. */
  readonly scope?: {
    readonly unitId: string
    readonly level: NarrativeLevel
    /** Present only for the reserved strict ending clock. */
    readonly closureScopeId?: string | undefined
  } | undefined
  /** Present only for the reserved strict plot clock. */
  readonly lines?: NovelPlotProgressionValue['lines'] | undefined
  /** Present only for the reserved strict progression clock. */
  readonly tracks?: NovelProgressionClockValue['tracks'] | undefined
  /** Present only for the reserved strict reader-knowledge clock. */
  readonly events?: NovelReaderKnowledgeClockValue['events'] | undefined
  /** Present only for the reserved strict reader-knowledge clock. */
  readonly ambiguityPolicy?: NovelReaderKnowledgeClockValue['ambiguityPolicy'] | undefined
  /** Present only for reserved strict clocks that project move records. */
  readonly moves?:
    | NovelWorldClockValue['moves']
    | NovelPromiseClockValue['moves']
    | NovelCharacterClockValue['moves']
    | NovelRelationshipClockValue['moves']
    | NovelMysteryClockValue['moves']
    | NovelEndingClockValue['moves']
    | undefined
  /** Present only for the reserved strict tension/payoff clock. */
  readonly waves?: NovelTensionPayoffValue['waves'] | undefined
  /** Present only for reserved strict narrative clocks. */
  readonly revisionRationale?: string | null | undefined
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: ResultProvenance
  readonly delta: NarrativeClockDelta
}

export interface NovelNarrativeDebt {
  readonly id: string
  readonly unitId: string
  readonly clock: NarrativeClock
  readonly summary: string
  readonly status: string
  readonly horizon?: string | undefined
  readonly dependsOn?: readonly NarrativeDebtReference[] | undefined
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: ResultProvenance
  readonly delta: NarrativeDebtDelta
}

export interface NovelNarrativeClockBucket {
  readonly clock: NarrativeClock
  readonly entries: readonly NovelNarrativeClockEntry[]
  readonly debts: readonly NovelNarrativeDebt[]
}

export interface NovelNarrativeProjection {
  readonly projectId: string
  readonly workspaceId: NovelWorkspaceId
  readonly revision: number
  readonly units: readonly NovelNarrativeUnit[]
  readonly clocks: readonly NovelNarrativeClockBucket[]
}

export type NovelRetrievalFreshness = 'current' | 'historical'

/** Revision-bound retrieval across structured state, exact phrases and local full text. */
export interface NovelRetrievalQuery {
  readonly revision: number
  /** Optional accepted baseline revision compared with revision. */
  readonly compareRevision?: number | undefined
  /** Optional accepted Canon family limiting structured Canon fact hits. */
  readonly canonKind?: CanonFactKind | undefined
  /** Optional accepted Canon entity limiting structured Canon fact hits. */
  readonly canonTargetId?: string | undefined
  /** Optional character whose accepted state changes should be reconstructed across revisions. */
  readonly characterTrajectoryId?: string | undefined
  /** Optional clue whose accepted field lifecycle should be reconstructed across revisions. */
  readonly clueLifecycleId?: string | undefined
  /** Optional promise whose accepted setup, complication and payoff lifecycle should be reconstructed. */
  readonly promiseLifecycleId?: string | undefined
  /** Optional mystery whose accepted truth and reveal lifecycle should be reconstructed. */
  readonly mysteryLifecycleId?: string | undefined
  /** Optional character whose typed accepted advancement records should be assembled. */
  readonly progressionCharacterId?: string | undefined
  /** Optional faction whose typed accepted agenda and off-screen continuity should be assembled. */
  readonly factionId?: string | undefined
  /** Optional location whose typed accepted nested-place and travel continuity should be assembled. */
  readonly locationId?: string | undefined
  /** Optional object whose typed accepted custody, location and quantity continuity should be assembled. */
  readonly objectId?: string | undefined
  /** Optional character whose typed accepted emotional episodes should be assembled. */
  readonly emotionCharacterId?: string | undefined
  /** Optional character or reader whose accepted subject-to-fact knowledge should be assembled. */
  readonly knowledgeSubjectId?: string | undefined
  /** Optional character whose accepted structured story events should be ordered by story time. */
  readonly timelineParticipantId?: string | undefined
  /** Optional narrative hierarchy level limiting structured narrative-unit hits. */
  readonly narrativeLevel?: NarrativeLevel | undefined
  /** Optional accepted narrative unit limiting structured unit, clock and debt hits. */
  readonly narrativeUnitId?: string | undefined
  /** Optional narrative clock limiting structured clock entries and debts. */
  readonly narrativeClock?: NarrativeClock | undefined
  /** Optional accepted manuscript unit limiting exact-text and full-text hits. */
  readonly unitId?: string | undefined
  /** Optional accepted Chapter whose bounded drafting context should be reconstructed. */
  readonly chapterId?: string | undefined
  /** Optional accepted Book or Series whose ending scope should be summarized. */
  readonly closureScopeId?: string | undefined
  /** Author-supplied remaining Chapter budget paired with closureScopeId. */
  readonly remainingChapterBudget?: number | undefined
  readonly exactText?: string | undefined
  readonly fullText?: string | undefined
  /** Optional writing intent used to recall ranked long-range drafting memory. */
  readonly writingMemoryQuery?: string | undefined
  /** Trace shortest downstream causal paths from one accepted story event. */
  readonly impactEventId?: string | undefined
  /** Include the rebuildable relationship/causal graph for this revision. */
  readonly graph?: boolean | undefined
}

/** Rebuildable drafting context selected only from one accepted project revision. */
export interface NovelChapterControlPack {
  readonly projectId: string
  readonly workspaceId: NovelWorkspaceId
  readonly sourceRevision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly chapter: NovelNarrativeUnit
  /** Accepted root-to-Chapter ancestry that defines the pack's narrative scope. */
  readonly scope: readonly NovelNarrativeUnit[]
  /** Accepted Scene and Beat descendants in deterministic hierarchy depth-first order. */
  readonly sceneBeats: readonly NovelNarrativeUnit[]
  /** Current author locks resolved only against exact facts present at this accepted revision. */
  readonly canonLockResolution: {
    readonly resolved: readonly {
      readonly lock: NovelCanonLock
      readonly fact: NovelCanonFact
    }[]
    readonly unavailableAtRevision: readonly NovelCanonLock[]
  }
  /** Exact Chapter-contract references resolved against this accepted revision. */
  readonly referenceResolution: {
    readonly plotLines: {
      readonly resolved: readonly {
        readonly lineId: string
        readonly line: NovelPlotProgressionValue['lines'][number]
        readonly clockEntry: NovelNarrativeClockEntry
      }[]
      readonly missing: readonly string[]
    }
    readonly relationshipLines: {
      readonly resolved: readonly {
        readonly lineId: string
        readonly line: NovelRelationshipLine
        /** Declared emotion evidence from scoped relationship-clock moves for this exact line. */
        readonly emotionEpisodes: {
          readonly resolved: readonly {
            readonly clockEntry: NovelNarrativeClockEntry
            readonly move: NovelRelationshipClockValue['moves'][number]
            readonly episodeId: string
            readonly episode: NovelEmotionEpisode
          }[]
          readonly missing: readonly {
            readonly clockEntry: NovelNarrativeClockEntry
            readonly move: NovelRelationshipClockValue['moves'][number]
            readonly episodeId: string
          }[]
        }
      }[]
      readonly missing: readonly string[]
    }
    readonly promises: {
      readonly resolved: readonly {
        readonly promiseId: string
        readonly intendedMovement: string
        readonly state: NovelPromiseStateValue
        readonly fact: NovelCanonFact
      }[]
      readonly missing: readonly {
        readonly promiseId: string
        readonly intendedMovement: string
      }[]
    }
  }
  /** Exact accepted sources named by the Chapter's post-check, when one exists at this revision. */
  readonly postChapterCheckResolution?: NovelPostChapterCheckResolution | undefined
  /** Accepted Canon facts targeting the Chapter ancestry or its Scene/Beat plan. */
  readonly scopedCanonFacts: readonly NovelCanonFact[]
  /** All ten clock buckets, limited to the Chapter ancestry and Scene/Beat plan. */
  readonly clocks: readonly NovelNarrativeClockBucket[]
  /** At most nine accepted preceding Chapter manuscripts in hierarchy order. */
  readonly recentManuscripts: readonly NovelManuscriptProjection[]
  /** Accepted post-Chapter ledgers for the same recent preceding Chapter window. */
  readonly recentPostChapterChecks: readonly {
    readonly chapter: NovelNarrativeUnit
    readonly resolution: NovelPostChapterCheckResolution
  }[]
  /** Long-range accepted writing memory derived beyond the bounded recent-Chapter window. */
  readonly writingMemory: {
    /** Latest explicit post-Chapter carry-forward state for each character before this Chapter. */
    readonly characterCarryForward: readonly NovelWritingCharacterMemory[]
    /** Complete accepted arc hypothesis for every character at this Chapter's source revision. */
    readonly characterArcHypotheses: readonly NovelWritingMemoryCharacterArcHypothesis[]
  }
}

/** Latest source-bearing character state carried into one future writing turn. */
export interface NovelWritingCharacterMemory {
  readonly characterId: string
  readonly carries: readonly string[]
  readonly sourceChapter: NovelNarrativeUnit
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Latest complete reader disclosure state carried from one accepted Chapter post-check. */
export interface NovelWritingReaderDisclosureMemory {
  readonly readerNowKnows: readonly string[]
  readonly readerNowSuspects: readonly string[]
  readonly sourceChapter: NovelNarrativeUnit
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Latest completed-Chapter outcome carried from one accepted post-Chapter check. */
export interface NovelWritingChapterOutcomeMemory {
  readonly contractAssessment: NovelPostChapterCheckValue['contractAssessment']
  readonly manuscriptSourceRevision: number
  readonly changes: readonly string[]
  readonly costs: readonly string[]
  readonly newlyPossible: readonly string[]
  readonly newlyImpossible: readonly string[]
  readonly sourceChapter: NovelNarrativeUnit
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** One accepted narrative-debt Delta named by a post-Chapter transition. */
export interface NovelPostChapterDebtTransitionCandidate {
  readonly debt: NovelNarrativeDebt
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
}

/** Revision-bound source links for one accepted post-Chapter change ledger. */
export interface NovelPostChapterCheckResolution {
  readonly postCheck: {
    readonly fact: NovelCanonFact
    readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  }
  readonly contract: {
    readonly unit: NovelNarrativeUnit
    readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  } | null
  readonly manuscript: {
    readonly projection: NovelManuscriptProjection
    readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  } | null
  readonly debtTransitions: {
    readonly resolved: readonly (NovelPostChapterDebtTransitionCandidate & {
      readonly reference: NovelPostChapterCheckValue['debtTransitions'][number]
    })[]
    readonly missing: readonly NovelPostChapterCheckValue['debtTransitions'][number][]
    readonly ambiguous: readonly {
      readonly reference: NovelPostChapterCheckValue['debtTransitions'][number]
      readonly candidates: readonly NovelPostChapterDebtTransitionCandidate[]
    }[]
  }
}

/** Source-bearing accepted ending hypothesis projected for one closure scope. */
export interface NovelEndingHypothesis {
  readonly value: NovelEndingHypothesisValue
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Read-only ending scope assembled from accepted Canon, hierarchy, clocks and current debts. */
export interface NovelClosureLedger {
  readonly scope: NovelNarrativeUnit
  readonly unitIds: readonly string[]
  readonly endingHypothesis: NovelEndingHypothesis | null
  readonly endingEntries: readonly NovelNarrativeClockEntry[]
  readonly debts: readonly NovelNarrativeDebt[]
  readonly dependencyOrder: readonly NarrativeDebtReference[]
  readonly remainingChapterBudget: number
}

export interface NovelRetrievalSourceRange {
  readonly anchorId?: string | undefined
  readonly sourceId: string
  readonly start: number
  readonly end: number
  readonly contentHash: string
}

export type NovelGraphNodeKind =
  | 'narrative-unit'
  | 'entity'
  | 'canon-fact'
  | 'narrative-clock'
  | 'narrative-debt'

export type NovelGraphEdgeKind =
  | 'hierarchy'
  | 'relationship'
  | 'causal'
  | 'knowledge'
  | 'fact-target'
  | 'clock-unit'
  | 'debt-unit'

/** One source-bearing node in a rebuildable graph projection. */
export interface NovelGraphNode {
  readonly id: string
  readonly kind: NovelGraphNodeKind
  readonly label: string
  readonly value?: NovelCanonValue | undefined
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** One source-bearing edge in a rebuildable graph projection. */
export interface NovelGraphEdge {
  readonly id: string
  readonly from: string
  readonly to: string
  readonly kind: NovelGraphEdgeKind
  readonly label: string
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** One downstream story event reached through its shortest accepted causal path. */
export interface NovelCausalImpactEvent {
  readonly eventId: string
  readonly depth: number
  readonly path: readonly NovelGraphEdge[]
}

/** Revision-bound downstream impact derived from accepted story-event causes edges. */
export interface NovelCausalImpact {
  readonly sourceEventId: string
  readonly affected: readonly NovelCausalImpactEvent[]
}

/** One downstream event whose shortest accepted causal path changed between revisions. */
export interface NovelCausalImpactEventRevisionChange {
  readonly before: NovelCausalImpactEvent
  readonly after: NovelCausalImpactEvent
}

/** Net downstream consequences for one causal source across two accepted revisions. */
export interface NovelCausalSourceRevisionImpact {
  readonly sourceEventId: string
  readonly added: readonly NovelCausalImpactEvent[]
  readonly removed: readonly NovelCausalImpactEvent[]
  readonly changed: readonly NovelCausalImpactEventRevisionChange[]
}

/** Rebuildable relationship, causal and knowledge projection derived from one accepted revision. */
export interface NovelGraphProjection {
  readonly projectId: string
  readonly workspaceId: NovelWorkspaceId
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly provider: 'novel-graph'
  readonly contentHash: string
  readonly nodes: readonly NovelGraphNode[]
  readonly edges: readonly NovelGraphEdge[]
}

/** One accepted Canon field plus the exact source ranges supporting that field. */
export interface NovelKnowledgeBoundaryField {
  readonly fact: NovelCanonFact
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
}

/** All accepted knowledge and referenced Canon fields for one known fact. */
export interface NovelKnowledgeBoundaryEntry {
  readonly factId: string
  readonly knowledgeFields: readonly NovelKnowledgeBoundaryField[]
  readonly factFields: readonly NovelKnowledgeBoundaryField[]
}

/** Revision-bound ledger of facts known by one character or reader. */
export interface NovelKnowledgeBoundary {
  readonly subjectId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly entries: readonly NovelKnowledgeBoundaryEntry[]
}

/** Explicit ordering and display label for one accepted story-time point or interval. */
export interface NovelStoryTimeRange {
  readonly startOrder: number
  readonly endOrder?: number | undefined
  readonly label: string
}

/** Typed accepted payload for one story event participating in timeline projection. */
export interface NovelStoryEventValue {
  readonly storyTime: NovelStoryTimeRange
  readonly manuscriptOrder: number
  readonly participants: readonly string[]
  readonly location: string
  readonly effects: readonly NovelCanonValue[]
}

/** One source-bearing accepted event in a participant timeline. */
export interface NovelTimelineEvent {
  readonly eventId: string
  readonly event: NovelStoryEventValue
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Two accepted events that place one participant at different locations in overlapping story time. */
export interface NovelTimelineLocationConflict {
  readonly overlapStartOrder: number
  readonly overlapEndOrder: number
  readonly first: NovelTimelineEvent
  readonly second: NovelTimelineEvent
}

/** Revision-bound accepted story events involving one explicit participant. */
export interface NovelTimelineLedger {
  readonly participantId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly events: readonly NovelTimelineEvent[]
  readonly locationConflicts: readonly NovelTimelineLocationConflict[]
}

/** Typed accepted payload proving one earned capability advancement. */
export interface NovelProgressionAdvancementValue {
  readonly characterId: string
  readonly eventId: string
  readonly storyOrder: number
  readonly dimension: string
  readonly priorLimitation: string
  readonly setup: string
  readonly evidence: readonly string[]
  readonly enablingAction: string
  readonly resourceOrSacrifice: string
  readonly newCapability: string
  readonly remainingLimit: string
  readonly counter: string
  readonly socialInterpretation: string
  readonly downstreamConsequence: string
}

/** One source-bearing accepted advancement with an opaque stable identity. */
export interface NovelProgressionAdvancement {
  readonly advancementId: string
  readonly advancement: NovelProgressionAdvancementValue
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Revision-bound capability ledger for one explicit character. */
export interface NovelProgressionLedger {
  readonly characterId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly advancements: readonly NovelProgressionAdvancement[]
}

/** Typed accepted payload for one faction agenda or off-screen continuity event. */
export interface NovelFactionContinuityValue {
  readonly factionId: string
  readonly eventId: string
  readonly storyOrder: number
  readonly goal: string
  readonly resources: readonly string[]
  readonly constraints: readonly string[]
  readonly currentAction: string
  readonly membershipOrAllianceChange: string
  readonly offscreenConsequence: string
}

/** One source-bearing accepted faction continuity record with an opaque stable identity. */
export interface NovelFactionContinuityEntry {
  readonly entryId: string
  readonly continuity: NovelFactionContinuityValue
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Revision-bound agenda and off-screen continuity ledger for one explicit faction. */
export interface NovelFactionContinuityLedger {
  readonly factionId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly entries: readonly NovelFactionContinuityEntry[]
}

/** One typed travel connection leaving an accepted location state. */
export interface NovelLocationTravelLink {
  readonly destinationLocationId: string
  readonly travelTime: string
  readonly accessConditions: readonly string[]
  readonly status: string
}

/** Typed accepted payload for one nested location or travel-access continuity event. */
export interface NovelLocationContinuityValue {
  readonly locationId: string
  readonly eventId: string
  readonly storyOrder: number
  readonly parentLocationId: string | null
  readonly scale: string
  readonly accessConditions: readonly string[]
  readonly governingFactionIds: readonly string[]
  readonly activeRuleIds: readonly string[]
  readonly resourceFlows: readonly string[]
  readonly travelLinks: readonly NovelLocationTravelLink[]
  readonly currentChange: string
  readonly consequence: string
}

/** One source-bearing accepted location continuity record with an opaque stable identity. */
export interface NovelLocationContinuityEntry {
  readonly entryId: string
  readonly continuity: NovelLocationContinuityValue
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Revision-bound nested-place and travel-access ledger for one explicit location. */
export interface NovelLocationContinuityLedger {
  readonly locationId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly entries: readonly NovelLocationContinuityEntry[]
}

/** Typed accepted payload for one object custody, location or quantity continuity event. */
export interface NovelObjectContinuityValue {
  readonly objectId: string
  readonly eventId: string
  readonly storyOrder: number
  readonly holderId: string | null
  readonly locationId: string | null
  readonly quantity: number
  readonly condition: string
  readonly status: string
  readonly currentChange: string
  readonly consequence: string
}

/** One source-bearing accepted object continuity record with an opaque stable identity. */
export interface NovelObjectContinuityEntry {
  readonly entryId: string
  readonly continuity: NovelObjectContinuityValue
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Revision-bound custody, location and quantity ledger for one explicit object. */
export interface NovelObjectContinuityLedger {
  readonly objectId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly entries: readonly NovelObjectContinuityEntry[]
}

/** One named component of a mixed emotion with an explicit normalized intensity. */
export interface NovelEmotionComponent {
  readonly label: string
  readonly intensity: number
}

/** Typed accepted payload for one event-derived emotional episode. */
export interface NovelEmotionEpisodeValue {
  readonly characterId: string
  readonly eventId: string
  readonly storyOrder: number
  readonly trigger: string
  readonly object: string
  readonly appraisal: string
  readonly emotions: readonly NovelEmotionComponent[]
  readonly bodilyExpression: string
  readonly actionTendency: string
  readonly expression: string
  readonly suppression: string
  readonly coping: string
  readonly residue: string
  readonly reactivatesEpisodeIds: readonly string[]
  readonly downstreamChoices: readonly string[]
}

/** One source-bearing accepted emotional episode. */
export interface NovelEmotionEpisode {
  readonly episodeId: string
  readonly episode: NovelEmotionEpisodeValue
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Revision-bound event-derived emotional continuity for one explicit character. */
export interface NovelEmotionContinuityLedger {
  readonly characterId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly episodes: readonly NovelEmotionEpisode[]
}

/** One accepted character-state field plus the exact source ranges supporting it. */
export interface NovelCharacterTrajectoryField {
  readonly fact: NovelCanonFact
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
}

/** One field-level change between consecutive accepted aggregate revisions. */
export interface NovelCharacterTrajectoryChange {
  readonly field: string
  readonly before?: NovelCharacterTrajectoryField | undefined
  readonly after?: NovelCharacterTrajectoryField | undefined
  /** Explicit accepted character-state Delta for this field; absent for rollback-derived changes. */
  readonly acceptedDelta?: CanonFactDelta | undefined
  /** Exact source ranges attached to acceptedDelta, or empty for rollback-derived changes. */
  readonly acceptedDeltaSourceRanges: readonly NovelRetrievalSourceRange[]
}

/** One accepted revision that changed the reconstructed state of a character. */
export interface NovelCharacterTrajectoryEntry {
  readonly revision: number
  readonly packetId: string
  readonly rollbackOfRevision?: number | undefined
  readonly provenance: ResultProvenance
  readonly fields: readonly NovelCharacterTrajectoryField[]
  readonly changes: readonly NovelCharacterTrajectoryChange[]
}

/** Revision-bound accepted state trajectory for one character. */
export interface NovelCharacterTrajectory {
  readonly characterId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly entries: readonly NovelCharacterTrajectoryEntry[]
}

/** One accepted clue field plus the exact source ranges supporting it. */
export interface NovelClueLifecycleField {
  readonly fact: NovelCanonFact
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
}

/** One clue field change between consecutive accepted aggregate revisions. */
export interface NovelClueLifecycleChange {
  readonly field: string
  readonly before?: NovelClueLifecycleField | undefined
  readonly after?: NovelClueLifecycleField | undefined
  /** Explicit accepted clue Delta for this field; absent for rollback-derived changes. */
  readonly acceptedDelta?: CanonFactDelta | undefined
  /** Exact source ranges attached to acceptedDelta, or empty for rollback-derived changes. */
  readonly acceptedDeltaSourceRanges: readonly NovelRetrievalSourceRange[]
}

/** One accepted revision that changed the reconstructed state of a clue. */
export interface NovelClueLifecycleEntry {
  readonly revision: number
  readonly packetId: string
  readonly rollbackOfRevision?: number | undefined
  readonly provenance: ResultProvenance
  readonly fields: readonly NovelClueLifecycleField[]
  readonly changes: readonly NovelClueLifecycleChange[]
}

/** Revision-bound accepted lifecycle for one clue or foreshadowing target. */
export interface NovelClueLifecycle {
  readonly clueId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly entries: readonly NovelClueLifecycleEntry[]
}

/** One accepted promise field plus the exact source ranges supporting it. */
export interface NovelPromiseLifecycleField {
  readonly fact: NovelCanonFact
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
}

/** One promise field change between consecutive accepted aggregate revisions. */
export interface NovelPromiseLifecycleChange {
  readonly field: string
  readonly before?: NovelPromiseLifecycleField | undefined
  readonly after?: NovelPromiseLifecycleField | undefined
  /** Explicit accepted promise Delta for this field; absent for rollback-derived changes. */
  readonly acceptedDelta?: CanonFactDelta | undefined
  /** Exact source ranges attached to acceptedDelta, or empty for rollback-derived changes. */
  readonly acceptedDeltaSourceRanges: readonly NovelRetrievalSourceRange[]
}

/** One accepted revision that changed the reconstructed state of a promise. */
export interface NovelPromiseLifecycleEntry {
  readonly revision: number
  readonly packetId: string
  readonly rollbackOfRevision?: number | undefined
  readonly provenance: ResultProvenance
  readonly fields: readonly NovelPromiseLifecycleField[]
  readonly changes: readonly NovelPromiseLifecycleChange[]
}

/** Revision-bound accepted lifecycle for one narrative promise and its payoff. */
export interface NovelPromiseLifecycle {
  readonly promiseId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly entries: readonly NovelPromiseLifecycleEntry[]
}

/** One accepted mystery state plus the exact source ranges supporting it. */
export interface NovelMysteryLifecycleField {
  readonly fact: NovelCanonFact
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
}

/** One mystery state change between consecutive accepted aggregate revisions. */
export interface NovelMysteryLifecycleChange {
  readonly field: 'state'
  readonly before?: NovelMysteryLifecycleField | undefined
  readonly after?: NovelMysteryLifecycleField | undefined
  /** Explicit accepted mystery Delta; absent for rollback-derived changes. */
  readonly acceptedDelta?: CanonFactDelta | undefined
  /** Exact source ranges attached to acceptedDelta, or empty for rollback-derived changes. */
  readonly acceptedDeltaSourceRanges: readonly NovelRetrievalSourceRange[]
}

/** One accepted strict clue/state currently linked to a mystery at this revision. */
export interface NovelMysteryLinkedClueEvidence {
  readonly clueId: string
  readonly value: NovelClueStateValue
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** One accepted revision that changed the mystery state or its linked clue evidence. */
export interface NovelMysteryLifecycleEntry {
  readonly revision: number
  readonly packetId: string
  readonly rollbackOfRevision?: number | undefined
  readonly provenance: ResultProvenance
  readonly fields: readonly NovelMysteryLifecycleField[]
  readonly changes: readonly NovelMysteryLifecycleChange[]
  readonly linkedClueEvidence: readonly NovelMysteryLinkedClueEvidence[]
}

/** Revision-bound accepted truth and reveal lifecycle for one mystery. */
export interface NovelMysteryLifecycle {
  readonly mysteryId: string
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly entries: readonly NovelMysteryLifecycleEntry[]
}

export interface NovelRetrievalHitEvidence {
  readonly sourceRevision: number
  readonly storyTime?: string | undefined
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

export type NovelStructuredRetrievalHit =
  | (NovelRetrievalHitEvidence & {
    readonly method: 'structured'
    readonly kind: 'canon-fact'
    readonly value: NovelCanonFact
  })
  | (NovelRetrievalHitEvidence & {
    readonly method: 'structured'
    readonly kind: 'narrative-unit'
    readonly value: NovelNarrativeUnit
  })
  | (NovelRetrievalHitEvidence & {
    readonly method: 'structured'
    readonly kind: 'narrative-clock'
    readonly value: NovelNarrativeClockEntry
  })
  | (NovelRetrievalHitEvidence & {
    readonly method: 'structured'
    readonly kind: 'narrative-debt'
    readonly value: NovelNarrativeDebt
  })

export interface NovelExactTextRetrievalHit extends NovelRetrievalHitEvidence {
  readonly method: 'exact-text'
  readonly kind: 'manuscript'
  readonly manuscript: Pick<ManuscriptRevision, 'unitId' | 'title'>
  readonly match: string
}

export interface NovelFullTextRetrievalHit extends NovelRetrievalHitEvidence {
  readonly method: 'full-text'
  readonly kind: 'manuscript'
  readonly provider: string
  readonly manuscript: Pick<ManuscriptRevision, 'unitId' | 'title'>
  readonly score: number
  readonly terms: readonly string[]
}

/** Shared score and accepted source evidence for one writing-memory recall item. */
export interface NovelWritingMemoryEvidence {
  readonly score: number
  readonly terms: readonly string[]
  readonly sourceRevision: number
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** Bounded excerpt from one accepted manuscript selected for the current writing intent. */
export interface NovelWritingMemoryManuscriptExcerpt extends NovelWritingMemoryEvidence {
  readonly unitId: string
  readonly title: string
  readonly excerpt: string
}

/** One accepted setting fact selected for the current writing intent. */
export interface NovelWritingMemorySettingFact extends NovelWritingMemoryEvidence {
  readonly fact: NovelCanonFact
}

/** One accepted authoring contract that applies independently of query terms. */
export type NovelWritingMemoryAuthoringEvidence =
  | {
      readonly kind: 'approved-style-exemplar'
      readonly exemplarId: string
      readonly sourceUnitId: string
      readonly excerpt: string
      readonly purpose: string
      readonly sourceRevision: number
      readonly sourceRanges: readonly NovelRetrievalSourceRange[]
      readonly provenance: ResultProvenance
    }
  | {
      readonly kind: 'reader-contract-evidence'
      readonly evidenceId: string
      readonly sourceUnitId: string
      readonly excerpt: string
      readonly demonstrates: string
      readonly sourceRevision: number
      readonly sourceRanges: readonly NovelRetrievalSourceRange[]
      readonly provenance: ResultProvenance
    }

/** One accepted authoring contract plus the manuscript evidence it explicitly references. */
export interface NovelWritingMemoryAuthoringContract {
  readonly fact: NovelCanonFact
  readonly evidence: readonly NovelWritingMemoryAuthoringEvidence[]
  readonly sourceRevision: number
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
  readonly provenance: ResultProvenance
}

/** One accepted narrative unit selected for planning when no Chapter control pack exists. */
export interface NovelWritingMemoryNarrativeUnit extends NovelWritingMemoryEvidence {
  readonly unit: NovelNarrativeUnit
}

/** One accepted rolling roadmap selected for the current writing intent. */
export interface NovelWritingMemoryRoadmap extends NovelWritingMemoryEvidence {
  readonly resolution: NovelRollingRoadmapResolution
}

/** One accepted continuity fact or narrative-clock movement selected for drafting. */
export type NovelWritingMemoryContinuityHit =
  | (NovelWritingMemoryEvidence & {
      readonly kind: 'canon-fact'
      readonly fact: NovelCanonFact
    })
  | (NovelWritingMemoryEvidence & {
      readonly kind: 'narrative-clock'
      readonly entry: NovelNarrativeClockEntry
    })

/** One accepted narrative debt selected for the current writing intent. */
export interface NovelWritingMemoryDebtHit extends NovelWritingMemoryEvidence {
  readonly debt: NovelNarrativeDebt
}

/** One strict accepted character arc hypothesis recalled independently of query terms. */
export interface NovelWritingMemoryCharacterArcHypothesis {
  readonly characterId: string
  readonly fact: NovelCanonFact
  readonly sourceRanges: readonly NovelRetrievalSourceRange[]
}

/** Ranked, rebuildable writing memory hydrated only from one accepted revision. */
export interface NovelWritingMemoryRecall {
  readonly query: string
  /** Latest explicit accepted post-Chapter state for every character before the next Chapter. */
  readonly characterCarryForward: readonly NovelWritingCharacterMemory[]
  /** Complete accepted arc hypothesis for every character before the next Chapter. */
  readonly characterArcHypotheses: readonly NovelWritingMemoryCharacterArcHypothesis[]
  /** Complete reader disclosure from the latest accepted post-Chapter check. */
  readonly latestReaderDisclosure: NovelWritingReaderDisclosureMemory | null
  /** Complete actual outcome from the latest accepted post-Chapter check. */
  readonly latestChapterOutcome: NovelWritingChapterOutcomeMemory | null
  /** Complete accepted bidirectional relationship state before the next Chapter. */
  readonly relationshipCarryForward: readonly NovelRelationshipLine[]
  /** Complete accepted character and reader knowledge boundaries before the next Chapter. */
  readonly knowledgeBoundaries: readonly NovelKnowledgeBoundary[]
  readonly authoringContracts: readonly NovelWritingMemoryAuthoringContract[]
  readonly roadmaps: readonly NovelWritingMemoryRoadmap[]
  readonly narrativeUnits: readonly NovelWritingMemoryNarrativeUnit[]
  readonly manuscriptExcerpts: readonly NovelWritingMemoryManuscriptExcerpt[]
  readonly settingFacts: readonly NovelWritingMemorySettingFact[]
  readonly continuityHits: readonly NovelWritingMemoryContinuityHit[]
  readonly debts: readonly NovelWritingMemoryDebtHit[]
}

/** Query-independent accepted state carried into the next Chapter's writing context. */
export type NovelWritingContinuity = Pick<NovelWritingMemoryRecall,
  'characterCarryForward' | 'characterArcHypotheses' | 'latestReaderDisclosure'
  | 'latestChapterOutcome' | 'relationshipCarryForward' | 'knowledgeBoundaries'>

export type NovelRetrievalHit =
  | NovelStructuredRetrievalHit
  | NovelExactTextRetrievalHit
  | NovelFullTextRetrievalHit

export interface NovelRetrievalResult {
  readonly projectId: string
  readonly workspaceId: NovelWorkspaceId
  readonly revision: number
  readonly headRevision: number
  readonly freshness: NovelRetrievalFreshness
  readonly hits: readonly NovelRetrievalHit[]
  readonly characterTrajectory?: NovelCharacterTrajectory | undefined
  readonly clueLifecycle?: NovelClueLifecycle | undefined
  readonly promiseLifecycle?: NovelPromiseLifecycle | undefined
  readonly mysteryLifecycle?: NovelMysteryLifecycle | undefined
  readonly progressionLedger?: NovelProgressionLedger | undefined
  readonly factionContinuity?: NovelFactionContinuityLedger | undefined
  readonly locationContinuity?: NovelLocationContinuityLedger | undefined
  readonly objectContinuity?: NovelObjectContinuityLedger | undefined
  readonly emotionContinuity?: NovelEmotionContinuityLedger | undefined
  readonly knowledgeBoundary?: NovelKnowledgeBoundary | undefined
  readonly timeline?: NovelTimelineLedger | undefined
  readonly roadmapResolution?: NovelRollingRoadmapResolution | undefined
  readonly controlPack?: NovelChapterControlPack | undefined
  readonly writingMemory?: NovelWritingMemoryRecall | undefined
  readonly closure?: NovelClosureLedger | undefined
  readonly impact?: NovelCausalImpact | undefined
  readonly revisionImpact?: NovelRevisionImpact | undefined
  readonly graph?: NovelGraphProjection | undefined
}

/** One DSH background job rebuilding the current accepted manuscript index. */
export interface NovelRetrievalRebuildJob {
  readonly jobId: string
  readonly revision: number
}

/** One manuscript unit as it exists at an accepted aggregate revision. */
export interface NovelManuscriptProjection {
  readonly manuscript: ManuscriptRevision
  readonly sourceRevision: number
  readonly provenance: ResultProvenance
}

export interface NovelManuscriptRevisionChange {
  readonly before: NovelManuscriptProjection
  readonly after: NovelManuscriptProjection
}

export interface NovelManuscriptRevisionChanges {
  readonly added: readonly NovelManuscriptProjection[]
  readonly removed: readonly NovelManuscriptProjection[]
  readonly changed: readonly NovelManuscriptRevisionChange[]
}

export interface NovelCanonFactRevisionChange {
  readonly before: NovelCanonFact
  readonly after: NovelCanonFact
}

export interface NovelCanonFactRevisionChanges {
  readonly added: readonly NovelCanonFact[]
  readonly removed: readonly NovelCanonFact[]
  readonly changed: readonly NovelCanonFactRevisionChange[]
}

export interface NovelNarrativeUnitRevisionChange {
  readonly before: NovelNarrativeUnit
  readonly after: NovelNarrativeUnit
}

export interface NovelNarrativeUnitRevisionChanges {
  readonly added: readonly NovelNarrativeUnit[]
  readonly removed: readonly NovelNarrativeUnit[]
  readonly changed: readonly NovelNarrativeUnitRevisionChange[]
}

export interface NovelClockEntryRevisionChange {
  readonly before: NovelNarrativeClockEntry
  readonly after: NovelNarrativeClockEntry
}

export interface NovelClockEntryRevisionChanges {
  readonly added: readonly NovelNarrativeClockEntry[]
  readonly removed: readonly NovelNarrativeClockEntry[]
  readonly changed: readonly NovelClockEntryRevisionChange[]
}

export interface NovelDebtRevisionChange {
  readonly before: NovelNarrativeDebt
  readonly after: NovelNarrativeDebt
}

export interface NovelDebtRevisionChanges {
  readonly added: readonly NovelNarrativeDebt[]
  readonly removed: readonly NovelNarrativeDebt[]
  readonly changed: readonly NovelDebtRevisionChange[]
}

/** Semantic domain changes between two complete accepted revision snapshots. */
export interface NovelRevisionImpact {
  readonly fromRevision: number
  readonly toRevision: number
  readonly manuscripts: NovelManuscriptRevisionChanges
  readonly canonFacts: NovelCanonFactRevisionChanges
  /** Domain impact is present only while its Planning projector is registered. */
  readonly narrativeUnits?: NovelNarrativeUnitRevisionChanges
  readonly clockEntries?: NovelClockEntryRevisionChanges
  readonly debts?: NovelDebtRevisionChanges
  readonly causalConsequences?: readonly NovelCausalSourceRevisionImpact[]
}

/** Counterfactual actions currently supported by the story-world sandbox. */
export const STORY_WORLD_ACTION_TYPES = [
  'move',
  'observe',
  'conceal',
  'reveal',
  'bargain',
  'train',
  'fight',
  'refuse',
  'sacrifice',
  'promise',
  'betray',
  'repair',
] as const

export type StoryWorldActionType = typeof STORY_WORLD_ACTION_TYPES[number]

/** Simulation sandboxes that expose a deterministic replay identity. */
export type SimulationSandbox = 'story-world' | 'reader-response'

/** Pure replay-key input shared by both proposal-only simulation sandboxes. */
export interface SimulationReplayKeyInput {
  readonly sandbox: SimulationSandbox
  readonly seed?: string | undefined
  readonly input: unknown
  readonly trace: unknown
}

/** One accepted Canon fact explicitly available to a simulated inhabitant. */
export interface StoryWorldKnowledgeRef {
  readonly kind: NovelCanonFact['kind']
  readonly targetId: string
  readonly field: string
}

/** The one inhabitant whose next action is simulated in this run. */
export interface StoryWorldActorInput {
  readonly id: string
  readonly goal: string
  readonly resources: readonly string[]
  readonly knowledge: readonly StoryWorldKnowledgeRef[]
}

/** One address in the role-scoped counterfactual state used by story-world replay. */
export type StoryWorldStatePath =
  | {
      readonly type: 'resource'
      readonly resource: string
    }
  | {
      readonly type: 'fact'
      readonly fact: StoryWorldKnowledgeRef
    }

/** One current value in a frozen or replayed story-world state. */
export interface StoryWorldStateEntry {
  readonly path: StoryWorldStatePath
  readonly value: NovelCanonValue
}

/** One exact state value that must hold before a counterfactual action applies. */
export interface StoryWorldStatePrecondition {
  readonly path: StoryWorldStatePath
  readonly equals: NovelCanonValue
}

/** One deterministic mutation applied only to the counterfactual story-world state. */
export type StoryWorldStateEffect =
  | {
      readonly operation: 'set'
      readonly path: StoryWorldStatePath
      readonly value: NovelCanonValue
    }
  | {
      readonly operation: 'remove'
      readonly path: StoryWorldStatePath
    }

/** One explicit counterfactual branch compared from the same frozen role state. */
export interface StoryWorldSimulationBranch {
  readonly id: string
  readonly hypothesis: string
  readonly assumptions: readonly string[]
}

/** Fields shared by single-role and isolated multi-role story-world requests. */
interface StoryWorldSimulationRequestBase {
  readonly revision: number
  /** Maximum number of ordered actions the isolated child may return. */
  readonly maxActions?: number | undefined
  readonly storyTime: string
  readonly hypothesis: string
  readonly assumptions: readonly string[]
  /** Optional caller-provided seed carried as replay metadata. */
  readonly seed?: string | undefined
}

/** Input for one role-scoped action or one role-scoped branch/seed experiment. */
export interface StoryWorldSingleActorSimulationRequest extends StoryWorldSimulationRequestBase {
  readonly mode?: undefined
  readonly actor: StoryWorldActorInput
  readonly actors?: undefined
  /** Optional seeds for a sequential experiment of independent story-world runs. */
  readonly seeds?: readonly string[] | undefined
  /** Optional explicit alternatives compared from the same frozen role state. */
  readonly branches?: readonly StoryWorldSimulationBranch[] | undefined
}

/** Input for comparing at least two isolated role views under one shared question. */
export interface StoryWorldRoleComparisonRequest extends StoryWorldSimulationRequestBase {
  readonly mode?: 'role-comparison' | undefined
  readonly actor?: undefined
  readonly actors: readonly StoryWorldActorInput[]
  readonly seeds?: undefined
  readonly branches?: undefined
}

/** Input for one ordered multi-role encounter over a shared counterfactual state. */
export interface StoryWorldSharedEncounterRequest extends StoryWorldSimulationRequestBase {
  readonly mode: 'shared-encounter'
  readonly actor?: undefined
  /** Input order is the encounter turn order. */
  readonly actors: readonly StoryWorldActorInput[]
  readonly seeds?: undefined
  readonly branches?: undefined
}

/** Single-role, isolated multi-role, or shared-encounter request accepted by the story-world Tool. */
export type StoryWorldSimulationRequest =
  | StoryWorldSingleActorSimulationRequest
  | StoryWorldRoleComparisonRequest
  | StoryWorldSharedEncounterRequest

/** One typed counterfactual action emitted by a story-world run. */
export interface StoryWorldSimulationAction {
  readonly actorId: string
  readonly type: StoryWorldActionType
  readonly target: string
  readonly intent: string
  readonly preconditions: readonly StoryWorldStatePrecondition[]
  readonly effects: readonly StoryWorldStateEffect[]
}

/** One successfully applied action in a deterministic counterfactual state replay. */
export interface StoryWorldStateTransition {
  readonly actionIndex: number
  readonly before: readonly StoryWorldStateEntry[]
  readonly after: readonly StoryWorldStateEntry[]
}

/** Host-projected state produced by applying ordered story-world action effects. */
export interface StoryWorldStateReplay {
  readonly initialState: readonly StoryWorldStateEntry[]
  readonly transitions: readonly StoryWorldStateTransition[]
  readonly finalState: readonly StoryWorldStateEntry[]
}

/** Proposal-only artifact from one isolated DSH story-world child run. */
export interface StoryWorldSimulationRun extends StoryWorldStateReplay {
  readonly runId: string
  readonly sandbox: 'story-world'
  readonly sourceRevision: number
  readonly maxActions: number
  /** The optional deterministic replay seed supplied for this run. */
  readonly seed?: string | undefined
  /** Stable identity derived from frozen input, seed and emitted trace. */
  readonly replayKey: string
  readonly storyTime: string
  readonly hypothesis: string
  readonly assumptions: readonly string[]
  readonly actor: StoryWorldActorInput
  readonly knownFacts: readonly NovelCanonFact[]
  readonly trace: readonly StoryWorldSimulationAction[]
  readonly limitations: readonly string[]
  readonly provenance: ResultProvenance
}

/** Occurrence rate for one story-world action type across independent runs. */
export interface StoryWorldActionSummary {
  readonly type: StoryWorldActionType
  readonly count: number
  readonly total: number
  readonly ratio: number
}

/** Read-only aggregate of independent story-world runs over one frozen role view. */
export interface StoryWorldSimulationExperiment {
  readonly sandbox: 'story-world'
  readonly sourceRevision: number
  readonly maxActions: number
  readonly storyTime: string
  readonly hypothesis: string
  readonly assumptions: readonly string[]
  readonly actor: StoryWorldActorInput
  readonly knownFacts: readonly NovelCanonFact[]
  readonly seeds: readonly string[]
  readonly runs: readonly StoryWorldSimulationRun[]
  readonly actionSummary: readonly StoryWorldActionSummary[]
}

/** One explicit branch and its isolated proposal-only run. */
export interface StoryWorldSimulationBranchRun extends StoryWorldSimulationBranch {
  readonly run: StoryWorldSimulationRun
}

/** One branch's value at a typed state path after its isolated run. */
export type StoryWorldBranchStateValue =
  | {
      readonly branchId: string
      readonly present: true
      readonly value: NovelCanonValue
    }
  | {
      readonly branchId: string
      readonly present: false
    }

/** Stable cross-branch comparison for one typed final-state path. */
export interface StoryWorldBranchStateComparison {
  readonly path: StoryWorldStatePath
  readonly differs: boolean
  readonly branches: readonly StoryWorldBranchStateValue[]
}

/** Explicit alternatives compared from one immutable accepted role state. */
export interface StoryWorldSimulationBranchExperiment {
  readonly sandbox: 'story-world'
  readonly mode: 'branch-comparison'
  readonly sourceRevision: number
  readonly maxActions: number
  readonly storyTime: string
  readonly hypothesis: string
  readonly assumptions: readonly string[]
  readonly actor: StoryWorldActorInput
  readonly knownFacts: readonly NovelCanonFact[]
  readonly seed?: string | undefined
  readonly initialState: readonly StoryWorldStateEntry[]
  readonly branches: readonly StoryWorldSimulationBranchRun[]
  readonly stateComparison: readonly StoryWorldBranchStateComparison[]
}

/** One explicit branch and its ordered repeated-run experiment. */
export interface StoryWorldSimulationBranchSeedExperiment extends StoryWorldSimulationBranch {
  readonly experiment: StoryWorldSimulationExperiment
}

/** One branch/seed cell's value at a typed final-state path. */
export type StoryWorldBranchSeedStateValue =
  | {
      readonly branchId: string
      readonly seed: string
      readonly present: true
      readonly value: NovelCanonValue
    }
  | {
      readonly branchId: string
      readonly seed: string
      readonly present: false
    }

/** Stable final-state comparison across every branch/seed cell. */
export interface StoryWorldBranchSeedStateComparison {
  readonly path: StoryWorldStatePath
  readonly differs: boolean
  readonly experiments: readonly StoryWorldBranchSeedStateValue[]
}

/** Explicit alternatives compared across one ordered seed set. */
export interface StoryWorldSimulationBranchSeedComparison {
  readonly sandbox: 'story-world'
  readonly mode: 'branch-seed-comparison'
  readonly sourceRevision: number
  readonly maxActions: number
  readonly storyTime: string
  readonly hypothesis: string
  readonly assumptions: readonly string[]
  readonly actor: StoryWorldActorInput
  readonly knownFacts: readonly NovelCanonFact[]
  readonly seeds: readonly string[]
  readonly initialState: readonly StoryWorldStateEntry[]
  readonly branches: readonly StoryWorldSimulationBranchSeedExperiment[]
  readonly stateComparison: readonly StoryWorldBranchSeedStateComparison[]
}

/** One role and its independent proposal-only story-world run. */
export interface StoryWorldRoleRun {
  readonly actor: StoryWorldActorInput
  readonly run: StoryWorldSimulationRun
}

/** Ordered comparison of isolated role views over one frozen accepted revision. */
export interface StoryWorldRoleComparison {
  readonly sandbox: 'story-world'
  readonly mode: 'role-comparison'
  readonly sourceRevision: number
  readonly maxActions: number
  readonly storyTime: string
  readonly hypothesis: string
  readonly assumptions: readonly string[]
  readonly seed?: string | undefined
  readonly roles: readonly StoryWorldRoleRun[]
}

/** One actor's child run and its effect on the full shared encounter state. */
export interface StoryWorldSharedEncounterTurn {
  readonly actor: StoryWorldActorInput
  readonly before: readonly StoryWorldStateEntry[]
  readonly after: readonly StoryWorldStateEntry[]
  readonly run: StoryWorldSimulationRun
}

/** Ordered role turns replayed over one shared proposal-only counterfactual state. */
export interface StoryWorldSharedEncounter {
  readonly sandbox: 'story-world'
  readonly mode: 'shared-encounter'
  readonly sourceRevision: number
  readonly maxActions: number
  readonly storyTime: string
  readonly hypothesis: string
  readonly assumptions: readonly string[]
  readonly seed?: string | undefined
  readonly initialState: readonly StoryWorldStateEntry[]
  readonly turns: readonly StoryWorldSharedEncounterTurn[]
  readonly finalState: readonly StoryWorldStateEntry[]
}

/** Single-run, role, encounter, multi-seed, branch, or branch-by-seed result returned by the story-world Tool. */
export type StoryWorldSimulationResult =
  | StoryWorldSimulationRun
  | StoryWorldSimulationExperiment
  | StoryWorldSimulationBranchExperiment
  | StoryWorldSimulationBranchSeedComparison
  | StoryWorldRoleComparison
  | StoryWorldSharedEncounter

/** Diagnostic dimensions supported by the synthetic reader-response sandbox. */
export const READER_RESPONSE_DIMENSIONS = [
  'confusion',
  'expectation',
  'trust',
  'boredom',
  'fairness',
  'emotion',
] as const

export type ReaderResponseDimension = typeof READER_RESPONSE_DIMENSIONS[number]

/** One configured audience perspective for a synthetic reader-response run. */
export interface ReaderPersonaInput {
  readonly id: string
  readonly description: string
}

/** One unaccepted manuscript candidate presented for an author-requested reader experiment. */
export interface ReaderResponseCandidateInput {
  readonly id: string
  readonly text: string
}

/** One accepted baseline or explicit candidate in an ordered text comparison. */
export type ReaderResponseVariantInput =
  | {
      readonly id: string
      readonly source: 'accepted'
    }
  | {
      readonly id: string
      readonly source: 'candidate'
      readonly text: string
    }

/** Real-reader evidence categories kept separate from synthetic dimensions. */
export type ReaderResponseFeedbackCategory =
  | 'comprehension'
  | 'expectation'
  | 'emotion'
  | 'preference'
  | 'coordinated-noise'
  | 'continuity'

/** Explicit author disposition recorded with one real-feedback source. */
export interface ReaderResponseFeedbackAuthorDecision {
  readonly action: 'consider' | 'defer' | 'dismiss'
  readonly rationale: string
}

/** One qualitative comment or quantitative real-reader observation. */
export type ReaderResponseFeedbackObservation =
  | {
      readonly id: string
      readonly type: 'qualitative'
      readonly category: ReaderResponseFeedbackCategory
      readonly outcome: string
      readonly uncertainty: string
    }
  | {
      readonly id: string
      readonly type: 'quantitative'
      readonly category: ReaderResponseFeedbackCategory
      readonly count: number
      readonly total: number
      readonly uncertainty: string
    }

/** Consented, provenance-bearing real feedback for one exact presented text. */
export interface ReaderResponseFeedbackInput {
  readonly sourceId: string
  readonly platform: string
  readonly observedAt: string
  readonly consented: true
  readonly cohort: ReaderPersonaInput
  readonly revision: number
  readonly unitId: string
  readonly variantId: string
  readonly presentedTextHash: string
  readonly authorDecision: ReaderResponseFeedbackAuthorDecision
  readonly observations: readonly ReaderResponseFeedbackObservation[]
}

/** Input for one text-only synthetic reader response at a frozen accepted revision. */
export interface ReaderResponseSimulationRequest {
  readonly revision: number
  readonly unitId: string
  readonly hypothesis: string
  /** One reader perspective for a single, repeated-seed, or candidate comparison. */
  readonly persona?: ReaderPersonaInput | undefined
  /** Optional reader cohorts compared over the same text, history and seeds. */
  readonly personas?: readonly ReaderPersonaInput[] | undefined
  readonly readingHistory: readonly string[]
  readonly candidate?: ReaderResponseCandidateInput | undefined
  /** Optional unaccepted alternatives compared over the same persona, history and seeds. */
  readonly candidates?: readonly ReaderResponseCandidateInput[] | undefined
  /** Optional accepted/candidate variants compared over one frozen reader definition. */
  readonly variants?: readonly ReaderResponseVariantInput[] | undefined
  /** Optional real-reader evidence calibrated after a multi-seed accepted-text experiment. */
  readonly feedback?: ReaderResponseFeedbackInput | undefined
  /** Optional caller-provided seed carried as replay metadata. */
  readonly seed?: string | undefined
  /** Optional seeds for a sequential experiment of independent reader runs. */
  readonly seeds?: readonly string[] | undefined
}

/** One synthetic diagnostic hypothesis grounded in the text shown to the reader. */
export interface ReaderResponseHypothesis {
  readonly dimension: ReaderResponseDimension
  readonly hypothesis: string
  readonly evidence: string
}

/** Proposal-only artifact from one isolated DSH synthetic reader child run. */
export interface ReaderResponseSimulationRun {
  readonly runId: string
  readonly sandbox: 'reader-response'
  readonly sourceRevision: number
  /** The optional deterministic replay seed supplied for this run. */
  readonly seed?: string | undefined
  /** Stable identity derived from frozen input, seed and emitted reactions. */
  readonly replayKey: string
  readonly unitId: string
  readonly hypothesis: string
  readonly persona: ReaderPersonaInput
  readonly readingHistory: readonly string[]
  readonly presentedText: string
  readonly presentedTextSource: 'accepted' | 'candidate'
  readonly presentedTextHash: string
  readonly candidateId?: string | undefined
  readonly reactions: readonly ReaderResponseHypothesis[]
  readonly marketRepresentative: false
  readonly limitations: readonly string[]
  readonly provenance: ResultProvenance
}

/** Occurrence rate for one reader-response dimension across independent runs. */
export interface ReaderResponseDimensionSummary {
  readonly dimension: ReaderResponseDimension
  readonly count: number
  readonly total: number
  readonly ratio: number
}

/** Read-only aggregate of independent synthetic reader runs over the same presented text. */
export interface ReaderResponseSimulationExperiment {
  readonly sandbox: 'reader-response'
  readonly sourceRevision: number
  readonly unitId: string
  readonly hypothesis: string
  readonly persona: ReaderPersonaInput
  readonly readingHistory: readonly string[]
  readonly seeds: readonly string[]
  readonly presentedText: string
  readonly presentedTextSource: 'accepted' | 'candidate'
  readonly presentedTextHash: string
  readonly candidateId?: string | undefined
  readonly runs: readonly ReaderResponseSimulationRun[]
  readonly dimensionSummary: readonly ReaderResponseDimensionSummary[]
  readonly marketRepresentative: false
}

/** One unaccepted candidate and its repeated synthetic reader experiment. */
export interface ReaderResponseCandidateExperiment {
  readonly candidateId: string
  readonly presentedTextHash: string
  readonly experiment: ReaderResponseSimulationExperiment
}

/** One candidate's occurrence rate for a reader-response dimension. */
export interface ReaderResponseCandidateDimensionValue {
  readonly candidateId: string
  readonly count: number
  readonly total: number
  readonly ratio: number
}

/** Stable same-persona comparison for one reader-response dimension. */
export interface ReaderResponseCandidateDimensionComparison {
  readonly dimension: ReaderResponseDimension
  readonly candidates: readonly ReaderResponseCandidateDimensionValue[]
}

/** Explicit manuscript alternatives compared over one reader context and seed set. */
export interface ReaderResponseCandidateComparison {
  readonly sandbox: 'reader-response'
  readonly mode: 'candidate-comparison'
  readonly sourceRevision: number
  readonly unitId: string
  readonly hypothesis: string
  readonly persona: ReaderPersonaInput
  readonly readingHistory: readonly string[]
  readonly seeds: readonly string[]
  readonly candidates: readonly ReaderResponseCandidateExperiment[]
  readonly dimensionComparison: readonly ReaderResponseCandidateDimensionComparison[]
  readonly marketRepresentative: false
}

/** One configured reader cohort and its repeated synthetic experiment. */
export interface ReaderResponsePersonaExperiment {
  readonly persona: ReaderPersonaInput
  readonly experiment: ReaderResponseSimulationExperiment
}

/** One reader cohort's occurrence rate for a response dimension. */
export interface ReaderResponsePersonaDimensionValue {
  readonly personaId: string
  readonly count: number
  readonly total: number
  readonly ratio: number
}

/** Stable same-text comparison for one dimension across reader cohorts. */
export interface ReaderResponsePersonaDimensionComparison {
  readonly dimension: ReaderResponseDimension
  readonly personas: readonly ReaderResponsePersonaDimensionValue[]
}

/** Explicit reader cohorts compared over one frozen text, history and seed set. */
export interface ReaderResponsePersonaComparison {
  readonly sandbox: 'reader-response'
  readonly mode: 'persona-comparison'
  readonly sourceRevision: number
  readonly unitId: string
  readonly hypothesis: string
  readonly readingHistory: readonly string[]
  readonly seeds: readonly string[]
  readonly presentedText: string
  readonly presentedTextSource: 'accepted' | 'candidate'
  readonly presentedTextHash: string
  readonly candidateId?: string | undefined
  readonly personas: readonly ReaderResponsePersonaExperiment[]
  readonly dimensionComparison: readonly ReaderResponsePersonaDimensionComparison[]
  readonly marketRepresentative: false
}

/** One candidate/Persona cell and its repeated synthetic experiment. */
export interface ReaderResponseCandidatePersonaExperiment {
  readonly candidateId: string
  readonly presentedTextHash: string
  readonly persona: ReaderPersonaInput
  readonly experiment: ReaderResponseSimulationExperiment
}

/** One candidate retained in a candidate/Persona comparison matrix. */
export interface ReaderResponseComparedCandidate {
  readonly id: string
  readonly presentedTextHash: string
}

/** One matrix cell's occurrence rate for a reader-response dimension. */
export interface ReaderResponseCandidatePersonaDimensionValue {
  readonly candidateId: string
  readonly personaId: string
  readonly count: number
  readonly total: number
  readonly ratio: number
}

/** Stable candidate/Persona matrix values for one response dimension. */
export interface ReaderResponseCandidatePersonaDimensionComparison {
  readonly dimension: ReaderResponseDimension
  readonly experiments: readonly ReaderResponseCandidatePersonaDimensionValue[]
}

/** Explicit text alternatives and reader cohorts compared as one isolated matrix. */
export interface ReaderResponseCandidatePersonaComparison {
  readonly sandbox: 'reader-response'
  readonly mode: 'candidate-persona-comparison'
  readonly sourceRevision: number
  readonly unitId: string
  readonly hypothesis: string
  readonly readingHistory: readonly string[]
  readonly seeds: readonly string[]
  readonly candidates: readonly ReaderResponseComparedCandidate[]
  readonly personas: readonly ReaderPersonaInput[]
  readonly experiments: readonly ReaderResponseCandidatePersonaExperiment[]
  readonly dimensionComparison: readonly ReaderResponseCandidatePersonaDimensionComparison[]
  readonly marketRepresentative: false
}

/** One ordered accepted/candidate variant and its isolated synthetic run. */
export interface ReaderResponseVariantRun {
  readonly variantId: string
  readonly presentedTextSource: 'accepted' | 'candidate'
  readonly presentedTextHash: string
  readonly run: ReaderResponseSimulationRun
}

/** One variant's occurrence value for a reader-response dimension. */
export interface ReaderResponseVariantDimensionValue {
  readonly variantId: string
  readonly count: number
  readonly total: 1
  readonly ratio: 0 | 1
}

/** Stable same-reader comparison for one dimension across text variants. */
export interface ReaderResponseVariantDimensionComparison {
  readonly dimension: ReaderResponseDimension
  readonly variants: readonly ReaderResponseVariantDimensionValue[]
}

/** Accepted prose and explicit candidates compared under one frozen reader definition. */
export interface ReaderResponseVariantComparison {
  readonly sandbox: 'reader-response'
  readonly mode: 'variant-comparison'
  readonly sourceRevision: number
  readonly unitId: string
  readonly hypothesis: string
  readonly persona: ReaderPersonaInput
  readonly readingHistory: readonly string[]
  readonly seed?: string | undefined
  readonly variants: readonly ReaderResponseVariantRun[]
  readonly dimensionComparison: readonly ReaderResponseVariantDimensionComparison[]
  readonly marketRepresentative: false
}

/** Deterministic comparison status for one real-feedback observation. */
export type ReaderResponseFeedbackCalibrationItem =
  | {
      readonly observationId: string
      readonly category: ReaderResponseFeedbackCategory
      readonly status: 'compared'
      readonly dimension: ReaderResponseDimension
      readonly syntheticRatio: number
      readonly observedRatio: number
      /** Synthetic occurrence ratio minus observed occurrence ratio. */
      readonly ratioDelta: number
      readonly absoluteDelta: number
    }
  | {
      readonly observationId: string
      readonly category: ReaderResponseFeedbackCategory
      readonly status: 'insufficient-data'
      readonly dimension: ReaderResponseDimension
    }
  | {
      readonly observationId: string
      readonly category: ReaderResponseFeedbackCategory
      readonly status: 'unmapped'
    }

/** Multi-seed synthetic experiment calibrated against separate real-reader evidence. */
export interface ReaderResponseFeedbackCalibration {
  readonly sandbox: 'reader-response'
  readonly mode: 'feedback-calibration'
  readonly sourceRevision: number
  readonly unitId: string
  readonly hypothesis: string
  readonly persona: ReaderPersonaInput
  readonly readingHistory: readonly string[]
  readonly seeds: readonly string[]
  readonly presentedTextHash: string
  readonly experiment: ReaderResponseSimulationExperiment
  readonly feedback: ReaderResponseFeedbackInput
  readonly calibration: readonly ReaderResponseFeedbackCalibrationItem[]
  readonly marketRepresentative: false
}

/** Single, repeated, candidate, Persona, variant, feedback, or matrix result returned by the reader-response Tool. */
export type ReaderResponseSimulationResult =
  | ReaderResponseSimulationRun
  | ReaderResponseSimulationExperiment
  | ReaderResponseCandidateComparison
  | ReaderResponsePersonaComparison
  | ReaderResponseCandidatePersonaComparison
  | ReaderResponseVariantComparison
  | ReaderResponseFeedbackCalibration

/** Request one read-only reviewer pass over a manuscript unit at the current head. */
export interface NovelReviewDraftRequest {
  readonly revision: number
  readonly unitId: string
  readonly focus?: string | undefined
}

/** Review proposal before an author supplies acceptance authorization. */
export interface NovelResultPacketDraft {
  readonly packetId: string
  readonly expectedRevision: number
  /** Omitted when the author is reviewing Canon-only project configuration. */
  readonly manuscript?: ManuscriptRevision | undefined
  /** Present together with manuscript; omitted for a Canon-only packet. */
  readonly manuscriptDiff?: ManuscriptDiff | undefined
  readonly deltas: readonly CanonDelta[]
  readonly issues: readonly AnchoredIssue[]
  readonly sourceAnchors: readonly SourceAnchor[]
  readonly provenance: ResultProvenance
}

export interface NovelResultPacket extends NovelResultPacketDraft {
  readonly authorization: AcceptanceAuthorization
}

export interface NovelResultItemDecision {
  readonly itemType: 'manuscript' | 'delta' | 'issue'
  readonly itemId: string
  readonly outcome: 'accept' | 'reject'
  readonly reason?: string | undefined
}

export type ResultPacketItemDecision = NovelResultItemDecision

export interface ReviewNovelResultPacket {
  readonly packet: NovelResultPacketDraft
  readonly decisions: readonly NovelResultItemDecision[]
}

/** Read-only projection of the exact accepted revision a reviewed packet would create. */
export interface NovelResultPacketImpactPreview {
  readonly expectedRevision: number
  readonly projectedRevision: number
  readonly impact: NovelRevisionImpact
}

export interface RollbackNovelRevision {
  readonly expectedRevision: number
  readonly targetRevision: number
}

export interface AcceptedNovelRevision {
  readonly revision: number
  readonly parentRevision: number
  readonly packetId: string
  /** The manuscript changed by this revision, if it was not Canon-only. */
  readonly manuscript?: ManuscriptRevision | undefined
  readonly deltas: readonly CanonDelta[]
  readonly issues: readonly AnchoredIssue[]
  readonly decisions: readonly NovelResultItemDecision[]
  readonly sourceAnchors: readonly SourceAnchor[]
  readonly provenance: ResultProvenance
  readonly authorization: AcceptanceAuthorization
  readonly rollbackOfRevision?: number | undefined
}

/** The authoritative project identity and accepted-revision head for one DSH Workspace. */
export interface NovelProject {
  readonly id: string
  readonly workspaceId: NovelWorkspaceId
  readonly cwd: string
  readonly acceptedRevision: number
  /** Durable author locks enforced by every Canon-advancing transaction. */
  readonly canonLocks: readonly NovelCanonLock[]
}

/** One durable, unaccepted Result Packet awaiting the author's decision. */
export interface NovelPendingProposal {
  readonly packetId: string
  /** Wall-clock receipt time of the proposal; replay identity stays in the packet. */
  readonly receivedAt: number
  readonly producer: string
  /** The complete reviewable draft exactly as proposed; accepting it advances Canon. */
  readonly packet: NovelResultPacketDraft
}

/**
 * Reading one chapter draft file out of a workspace.
 *
 * A chapter draft is a file in the author's own workdir, not Canon state: it is
 * where prose is written before it is ever proposed. These states exist so the
 * editor can say what went wrong in the author's language instead of surfacing a
 * filesystem error, and so "the draft is gone" stays distinguishable from "the
 * draft is there but unreadable".
 */
export type NovelChapterFileRead =
  | { readonly state: 'ok'; readonly text: string; /** Freshness token for the next write. */ readonly version: string }
  | { readonly state: 'missing' }
  | { readonly state: 'unreadable'; readonly reason: string }

/**
 * Writing one chapter draft file.
 *
 * `conflict` is the case that matters: the file changed on disk since it was
 * read (the author edited it in their own editor, or another window saved), so
 * the write is refused rather than silently overwriting their work.
 */
export type NovelChapterFileWrite =
  | { readonly state: 'ok'; readonly version: string }
  | { readonly state: 'conflict'; readonly version: string }
  | { readonly state: 'unwritable'; readonly reason: string }

/**
 * What a paragraph-level continuation is asked with.
 *
 * `inspiration` is the author's own beats for the next stretch, kept in the
 * order they were written — the panel is not a prompt box, it is a place to say
 * what happens next. `before` is the manuscript so far: the model continues from
 * the end of it and is told not to retell what is already written.
 */
export interface NovelContinuationRequest {
  readonly inspiration: readonly string[]
  readonly before: string
}

/**
 * The outcome of asking for one.
 *
 * Unlike the sentence-level suggestion — where any failure is silence, because
 * the author never asked and being interrupted costs more than a suggestion is
 * worth — this request was deliberate. A failure is therefore said out loud, in
 * words the author can act on.
 */
export type NovelContinuationResult =
  | { readonly state: 'ok'; readonly text: string }
  | { readonly state: 'failed'; readonly message: string }
