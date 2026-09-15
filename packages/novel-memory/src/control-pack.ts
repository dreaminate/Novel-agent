import { createHash } from 'node:crypto'
import { deepFreeze } from '@deepseek-ai/dsh-util-values'
import type {
  NovelCanonSnapshot, NovelCanonProjection, NovelChapterControlPack, NovelEmotionEpisodeValue,
  NovelManuscriptProjection, NovelNarrativeProjection, NovelNarrativeUnit,
  NovelPostChapterCheckResolution, NovelPostChapterCheckValue, NovelPostChapterDebtTransitionCandidate,
  NovelPromiseStateValue, NovelRelationshipProjection, NovelRetrievalSourceRange, NovelWritingMemoryRecall,
} from '@novel-agent/novel-project/types'

/** Canon selects the effective ancestry; Writing supplies the accepted manuscript at an explicit source revision. */
export interface MemorySourceContext {
  readonly snapshot: NovelCanonSnapshot
  readonly manuscriptsAt: (revision: number) => readonly NovelManuscriptProjection[]
}

/** Read every accepted character arc with its original source ranges. */
export function buildWritingMemoryCharacterArcHypotheses(
  project: MemorySourceContext,
  canon: NovelCanonProjection,
): NovelWritingMemoryRecall['characterArcHypotheses'] {
  return canon.facts
    .filter(fact => fact.kind === 'character-state' && fact.field === 'arc-hypothesis')
    .sort((left, right) => compareText(left.targetId, right.targetId))
    .map(fact => ({
      characterId: fact.targetId,
      fact,
      sourceRanges: retrievalSourceRanges(project, fact.sourceRevision, fact.sourceAnchorIds),
    }))
}

function buildPostChapterCheckResolution(
  project: MemorySourceContext,
  canon: NovelCanonProjection,
  chapterId: string,
): NovelPostChapterCheckResolution | undefined {
  const postCheckFact = canon.facts.find(fact => (
    fact.kind === 'chapter-state'
    && fact.targetId === chapterId
    && fact.field === 'post-check'
  ))
  if (postCheckFact === undefined) return undefined
  const postCheck = postCheckFact.value as NovelPostChapterCheckValue
  const effectiveSourceRevisions = new Set(project.snapshot.revisions.map(revision => revision.revision))

  let contract: NovelPostChapterCheckResolution['contract'] = null
  if (effectiveSourceRevisions.has(postCheck.contractAssessment.contractRevision)) {
    const contractRevision = project.snapshot.revisions.find(revision => (
      revision.revision === postCheck.contractAssessment.contractRevision
    ))
    const contractDelta = contractRevision?.deltas.find(delta => (
      delta.id === postCheck.contractAssessment.contractSourceDeltaId
      && delta.kind === 'narrative-unit'
      && delta.operation === 'set'
      && delta.targetId === chapterId
      && delta.value.chapterContract !== undefined
    ))
    if (contractRevision !== undefined
      && contractDelta !== undefined
      && contractDelta.kind === 'narrative-unit'
      && contractDelta.operation === 'set') {
      contract = {
        unit: {
          id: contractDelta.targetId,
          ...contractDelta.value,
          sourceRevision: contractRevision.revision,
          sourceDeltaId: contractDelta.id,
          sourceAnchorIds: contractDelta.sourceAnchorIds,
          provenance: contractRevision.provenance,
          delta: contractDelta,
        },
        sourceRanges: retrievalSourceRanges(
          project,
          contractRevision.revision,
          contractDelta.sourceAnchorIds,
        ),
      }
    }
  }

  let manuscript: NovelPostChapterCheckResolution['manuscript'] = null
  if (effectiveSourceRevisions.has(postCheck.manuscriptSourceRevision)) {
    const projection = project.manuscriptsAt(postCheck.manuscriptSourceRevision)
      .find(candidate => (
        candidate.manuscript.unitId === chapterId
        && candidate.sourceRevision === postCheck.manuscriptSourceRevision
      ))
    if (projection !== undefined) {
      manuscript = {
        projection,
        sourceRanges: [{
          sourceId: projection.manuscript.unitId,
          start: 0,
          end: projection.manuscript.text.length,
          contentHash: createHash('sha256').update(projection.manuscript.text).digest('hex'),
        }],
      }
    }
  }

  const resolved: NovelPostChapterCheckResolution['debtTransitions']['resolved'][number][] = []
  const missing: NovelPostChapterCheckResolution['debtTransitions']['missing'][number][] = []
  const ambiguous: NovelPostChapterCheckResolution['debtTransitions']['ambiguous'][number][] = []
  for (const reference of postCheck.debtTransitions) {
    const candidates: NovelPostChapterDebtTransitionCandidate[] = []
    for (const revision of project.snapshot.revisions) {
      for (const delta of revision.deltas) {
        if (delta.kind !== 'narrative-debt'
          || delta.operation !== 'set'
          || delta.id !== reference.sourceDeltaId
          || delta.targetId !== reference.debtId
          || delta.field !== reference.clock) continue
        candidates.push({
          debt: {
            id: delta.targetId,
            unitId: delta.unitId,
            clock: delta.field,
            ...delta.value,
            sourceRevision: revision.revision,
            sourceDeltaId: delta.id,
            sourceAnchorIds: delta.sourceAnchorIds,
            provenance: revision.provenance,
            delta,
          },
          sourceRanges: retrievalSourceRanges(project, revision.revision, delta.sourceAnchorIds),
        })
      }
    }
    if (candidates.length === 0) missing.push(reference)
    else if (candidates.length === 1) resolved.push({ reference, ...candidates[0]! })
    else ambiguous.push({ reference, candidates })
  }

  return deepFreeze({
    postCheck: {
      fact: postCheckFact,
      sourceRanges: retrievalSourceRanges(
        project,
        postCheckFact.sourceRevision,
        postCheckFact.sourceAnchorIds,
      ),
    },
    contract,
    manuscript,
    debtTransitions: { resolved, missing, ambiguous },
  })
}

/** Carry forward explicit post-Chapter state from the ordered accepted chapters. */
export function buildWritingCharacterMemory(
  project: MemorySourceContext,
  canon: NovelCanonProjection,
  precedingChapters: readonly NovelNarrativeUnit[],
): Pick<
  NovelWritingMemoryRecall,
  'characterCarryForward' | 'latestReaderDisclosure' | 'latestChapterOutcome'
> {
  const latestByCharacterId = new Map<
    string,
    NovelWritingMemoryRecall['characterCarryForward'][number]
  >()
  let latestReaderDisclosure: NovelWritingMemoryRecall['latestReaderDisclosure'] = null
  let latestChapterOutcome: NovelWritingMemoryRecall['latestChapterOutcome'] = null

  for (const chapter of precedingChapters) {
    const resolution = buildPostChapterCheckResolution(
      project,
      canon,
      chapter.id,
    )
    if (resolution === undefined) continue

    const postCheck = resolution.postCheck.fact.value as NovelPostChapterCheckValue
    const fact = resolution.postCheck.fact
    latestReaderDisclosure = {
      readerNowKnows: postCheck.readerNowKnows,
      readerNowSuspects: postCheck.readerNowSuspects,
      sourceChapter: chapter,
      sourceRevision: fact.sourceRevision,
      sourceDeltaId: fact.sourceDeltaId,
      sourceAnchorIds: fact.sourceAnchorIds,
      sourceRanges: resolution.postCheck.sourceRanges,
      provenance: fact.provenance,
    }
    latestChapterOutcome = {
      contractAssessment: postCheck.contractAssessment,
      manuscriptSourceRevision: postCheck.manuscriptSourceRevision,
      changes: postCheck.changes,
      costs: postCheck.costs,
      newlyPossible: postCheck.newlyPossible,
      newlyImpossible: postCheck.newlyImpossible,
      sourceChapter: chapter,
      sourceRevision: fact.sourceRevision,
      sourceDeltaId: fact.sourceDeltaId,
      sourceAnchorIds: fact.sourceAnchorIds,
      sourceRanges: resolution.postCheck.sourceRanges,
      provenance: fact.provenance,
    }
    const carriesByCharacterId = new Map<string, string[]>()
    for (const character of postCheck.characterCarryForward) {
      const carries = carriesByCharacterId.get(character.characterId) ?? []
      carries.push(...character.carries)
      carriesByCharacterId.set(character.characterId, carries)
    }

    for (const [characterId, carries] of carriesByCharacterId) {
      latestByCharacterId.set(characterId, {
        characterId,
        carries,
        sourceChapter: chapter,
        sourceRevision: fact.sourceRevision,
        sourceDeltaId: fact.sourceDeltaId,
        sourceAnchorIds: fact.sourceAnchorIds,
        sourceRanges: resolution.postCheck.sourceRanges,
        provenance: fact.provenance,
      })
    }
  }

  return {
    characterCarryForward: [...latestByCharacterId.values()]
      .sort((left, right) => compareText(left.characterId, right.characterId)),
    latestReaderDisclosure,
    latestChapterOutcome,
  }
}

/** Assemble the requested Chapter's scope, references and prior outcomes without writing Canon. */
export function buildChapterControlPack(
  project: MemorySourceContext,
  canon: NovelCanonProjection,
  narrative: NovelNarrativeProjection,
  manuscripts: readonly NovelManuscriptProjection[],
  relationships: NovelRelationshipProjection,
  canonLockResolution: NovelChapterControlPack['canonLockResolution'],
  headRevision: number,
  chapterId: string,
): NovelChapterControlPack {
  const units = new Map(narrative.units.map(unit => [unit.id, unit] as const))
  const chapter = units.get(chapterId)
  if (chapter === undefined) {
    throw new Error(
      `control pack Chapter '${chapterId}' does not exist at accepted revision R${String(narrative.revision)}`,
    )
  }
  if (chapter.level !== 'chapter') {
    throw new Error(`control pack target '${chapterId}' must be a Chapter, got ${chapter.level}`)
  }

  const scope: NovelNarrativeUnit[] = [chapter]
  let parentId = chapter.parentId
  while (parentId !== null) {
    const parent = units.get(parentId)
    if (parent === undefined) {
      throw new Error(`control pack Chapter '${chapterId}' is missing parent '${parentId}'`)
    }
    scope.unshift(parent)
    parentId = parent.parentId
  }
  const chapterDescendantIds = new Set([chapterId])
  const sceneBeats: NovelNarrativeUnit[] = []
  for (const unit of narrative.units) {
    if (unit.parentId === null || !chapterDescendantIds.has(unit.parentId)) continue
    chapterDescendantIds.add(unit.id)
    if (unit.level === 'scene' || unit.level === 'beat') sceneBeats.push(unit)
  }
  const scopeIds = new Set([
    ...scope.map(unit => unit.id),
    ...sceneBeats.map(unit => unit.id),
  ])
  const clocks = narrative.clocks.map(bucket => ({
    clock: bucket.clock,
    entries: bucket.entries.filter(entry => scopeIds.has(entry.unitId)),
    debts: bucket.debts.filter(debt => scopeIds.has(debt.unitId)),
  }))

  const manuscriptByUnit = new Map(manuscripts.map(projected => [
    projected.manuscript.unitId,
    projected,
  ] as const))
  const chapterUnits = narrative.units.filter(unit => unit.level === 'chapter')
  const chapterPosition = chapterUnits.findIndex(unit => unit.id === chapterId)
  const precedingChapters = chapterUnits.slice(0, chapterPosition)
  const recentChapters = precedingChapters.slice(-9)
  const recentManuscripts = recentChapters.flatMap((precedingChapter) => {
    const manuscript = manuscriptByUnit.get(precedingChapter.id)
    return manuscript === undefined ? [] : [manuscript]
  })
  const recentPostChapterChecks = recentChapters
    .flatMap((precedingChapter) => {
      const resolution = buildPostChapterCheckResolution(
        project,
        canon,
        precedingChapter.id,
      )
      return resolution === undefined ? [] : [{ chapter: precedingChapter, resolution }]
    })
  const { characterCarryForward } = buildWritingCharacterMemory(
    project,
    canon,
    precedingChapters,
  )
  const characterArcHypotheses = buildWritingMemoryCharacterArcHypotheses(project, canon)
  const writingMemory = { characterCarryForward, characterArcHypotheses }

  let referenceResolution: NovelChapterControlPack['referenceResolution'] = {
    plotLines: { resolved: [], missing: [] },
    relationshipLines: { resolved: [], missing: [] },
    promises: { resolved: [], missing: [] },
  }
  const contract = chapter.chapterContract
  if (contract !== undefined) {
    const plotEntriesBySpecificity = [...scope]
      .reverse()
      .flatMap(unit => clocks
        .find(bucket => bucket.clock === 'plot')!
        .entries
        .filter(entry => entry.unitId === unit.id))
    const resolvedPlotLines: NovelChapterControlPack['referenceResolution']['plotLines']['resolved'][number][] = []
    const missingPlotLines: string[] = []
    for (const lineId of contract.activePlotLineIds) {
      let resolution: typeof resolvedPlotLines[number] | undefined
      for (const clockEntry of plotEntriesBySpecificity) {
        if (clockEntry.delta.operation !== 'set' || clockEntry.delta.field !== 'plot') continue
        const line = clockEntry.delta.value.lines.find(candidate => candidate.lineId === lineId)
        if (line !== undefined) {
          resolution = { lineId, line, clockEntry }
          break
        }
      }
      if (resolution === undefined) missingPlotLines.push(lineId)
      else resolvedPlotLines.push(resolution)
    }

    const relationshipsByLine = new Map(
      relationships.relationships.map(line => [line.line, line] as const),
    )
    const relationshipClockEntries = clocks
      .find(bucket => bucket.clock === 'relationship')!
      .entries
    const emotionEpisodeFactsById = new Map(canon.facts.flatMap(fact => (
      fact.kind === 'emotion-state' && fact.field === 'episode'
        ? [[fact.targetId, fact] as const]
        : []
    )))
    const resolvedRelationshipLines: NovelChapterControlPack['referenceResolution']['relationshipLines']['resolved'][number][] = []
    const missingRelationshipLines: string[] = []
    for (const lineId of contract.activeRelationshipLineIds) {
      const line = relationshipsByLine.get(lineId)
      if (line === undefined) missingRelationshipLines.push(lineId)
      else {
        const resolvedEmotionEpisodes: NovelChapterControlPack['referenceResolution']['relationshipLines']['resolved'][number]['emotionEpisodes']['resolved'][number][] = []
        const missingEmotionEpisodes: NovelChapterControlPack['referenceResolution']['relationshipLines']['resolved'][number]['emotionEpisodes']['missing'][number][] = []
        for (const clockEntry of relationshipClockEntries) {
          if (clockEntry.delta.operation !== 'set'
            || clockEntry.delta.field !== 'relationship') continue
          for (const move of clockEntry.delta.value.moves) {
            if (move.lineId !== lineId
              || !line.directions.some(direction => (
                direction.pair === move.relationshipTargetId
            ))) continue
            for (const episodeId of move.emotionEpisodeIds) {
              const fact = emotionEpisodeFactsById.get(episodeId)
              if (fact === undefined) {
                missingEmotionEpisodes.push({ clockEntry, move, episodeId })
                continue
              }
              // Generic Canon may also contain primitive episode notes; only records are typed episodes.
              if (fact.value === null || typeof fact.value !== 'object' || Array.isArray(fact.value)) {
                missingEmotionEpisodes.push({ clockEntry, move, episodeId })
                continue
              }
              resolvedEmotionEpisodes.push({
                clockEntry,
                move,
                episodeId,
                episode: {
                  episodeId,
                  // Canon validates record-shaped episode values through its Result Packet parser.
                  episode: fact.value as unknown as NovelEmotionEpisodeValue,
                  sourceRevision: fact.sourceRevision,
                  sourceDeltaId: fact.sourceDeltaId,
                  sourceAnchorIds: fact.sourceAnchorIds,
                  sourceRanges: retrievalSourceRanges(
                    project,
                    fact.sourceRevision,
                    fact.sourceAnchorIds,
                  ),
                  provenance: fact.provenance,
                },
              })
            }
          }
        }
        resolvedRelationshipLines.push({
          lineId,
          line,
          emotionEpisodes: {
            resolved: resolvedEmotionEpisodes,
            missing: missingEmotionEpisodes,
          },
        })
      }
    }

    const resolvedPromises: NovelChapterControlPack['referenceResolution']['promises']['resolved'][number][] = []
    const missingPromises: NovelChapterControlPack['referenceResolution']['promises']['missing'][number][] = []
    for (const reference of contract.promisesTouched) {
      const fact = canon.facts.find(candidate => (
        candidate.kind === 'promise'
        && candidate.targetId === reference.promiseId
        && candidate.field === 'state'
      ))
      if (fact === undefined) {
        missingPromises.push(reference)
      } else {
        resolvedPromises.push({
          promiseId: reference.promiseId,
          intendedMovement: reference.intendedMovement,
          state: fact.value as NovelPromiseStateValue,
          fact,
        })
      }
    }
    referenceResolution = {
      plotLines: {
        resolved: resolvedPlotLines,
        missing: missingPlotLines,
      },
      relationshipLines: {
        resolved: resolvedRelationshipLines,
        missing: missingRelationshipLines,
      },
      promises: {
        resolved: resolvedPromises,
        missing: missingPromises,
      },
    }
  }
  const postChapterCheckResolution = buildPostChapterCheckResolution(
    project,
    canon,
    chapterId,
  )

  return deepFreeze({
    projectId: narrative.projectId,
    workspaceId: narrative.workspaceId,
    sourceRevision: narrative.revision,
    headRevision,
    freshness: narrative.revision === headRevision ? 'current' : 'historical',
    chapter,
    scope,
    sceneBeats,
    canonLockResolution,
    referenceResolution,
    ...(postChapterCheckResolution === undefined ? {} : { postChapterCheckResolution }),
    scopedCanonFacts: canon.facts.filter(fact => scopeIds.has(fact.targetId)),
    clocks,
    recentManuscripts,
    recentPostChapterChecks,
    writingMemory,
  })
}

function retrievalSourceRanges(
  project: MemorySourceContext,
  sourceRevision: number,
  sourceAnchorIds: readonly string[],
): NovelRetrievalSourceRange[] {
  const revision = project.snapshot.revisions.find(candidate => candidate.revision === sourceRevision)!
  const anchors = new Map(revision.sourceAnchors.map(anchor => [anchor.id, anchor] as const))
  return sourceAnchorIds.map(anchorId => {
    const anchor = anchors.get(anchorId)!
    return { anchorId: anchor.id, sourceId: anchor.sourceId, start: anchor.start, end: anchor.end, contentHash: anchor.contentHash }
  })
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
