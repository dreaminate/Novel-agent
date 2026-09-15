import { deepFreeze } from '@deepseek-ai/dsh-util-values'
import type {
  NovelCanonFact,
  NovelCanonProjection,
  NovelRelationshipFieldSource,
  NovelRelationshipLine,
  NovelRelationshipPair,
  NovelRelationshipProjection,
} from '@novel-agent/novel-project/types'

/** Group accepted Canon fields by direction while retaining each field's revision and source. */
export function buildRelationshipProjection(canon: NovelCanonProjection): NovelRelationshipProjection {
  const pairs = new Map<string, NovelCanonFact[]>()
  for (const fact of canon.facts) {
    if (fact.kind !== 'relationship') continue
    const [from, to] = fact.targetId.split('->').map(endpoint => endpoint.trim())
    const pair = `${from}->${to}`
    const fields = pairs.get(pair) ?? []
    fields.push(fact)
    pairs.set(pair, fields)
  }

  const directions = [...pairs.entries()]
    .map(([pair, facts]) => {
      const [from, to] = pair.split('->') as [string, string]
      const orderedFacts = [...facts].sort(compareRelationshipFacts)
      const latest = orderedFacts.at(-1)!
      const fields = Object.fromEntries(orderedFacts.map(fact => [fact.field, fact.value]))
      const fieldSources = Object.fromEntries(orderedFacts.map(fact => [fact.field, {
        value: fact.value,
        sourceRevision: fact.sourceRevision,
        sourceDeltaId: fact.sourceDeltaId,
        sourceAnchorIds: [...fact.sourceAnchorIds].sort(compareText),
        provenance: fact.provenance,
      } satisfies NovelRelationshipFieldSource]))
      const sourceAnchorIds = [...new Set(orderedFacts.flatMap(fact => fact.sourceAnchorIds))]
        .sort(compareText)
      return deepFreeze({
        pair, from, to, fields, fieldSources,
        sourceRevision: latest.sourceRevision,
        sourceDeltaId: latest.sourceDeltaId,
        sourceAnchorIds,
        provenance: latest.provenance,
      } satisfies NovelRelationshipPair)
    })
    .sort(compareRelationshipPairs)

  const lines = new Map<string, NovelRelationshipPair[]>()
  for (const direction of directions) {
    const participants = compareText(direction.from, direction.to) <= 0
      ? [direction.from, direction.to] as const
      : [direction.to, direction.from] as const
    const line = `${participants[0]}<->${participants[1]}`
    const lineDirections = lines.get(line) ?? []
    lineDirections.push(direction)
    lines.set(line, lineDirections)
  }
  const relationships = [...lines.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([line, lineDirections]) => {
      const firstDirection = lineDirections[0]!
      const participants = compareText(firstDirection.from, firstDirection.to) <= 0
        ? [firstDirection.from, firstDirection.to] as const
        : [firstDirection.to, firstDirection.from] as const
      return deepFreeze({
        line,
        participants,
        directions: [...lineDirections].sort(compareRelationshipPairs),
      } satisfies NovelRelationshipLine)
    })
  return deepFreeze({
    projectId: canon.projectId,
    workspaceId: canon.workspaceId,
    revision: canon.revision,
    relationships,
  })
}

function compareRelationshipFacts(left: NovelCanonFact, right: NovelCanonFact): number {
  return left.sourceRevision - right.sourceRevision
    || compareText(left.sourceDeltaId, right.sourceDeltaId)
    || compareText(left.field, right.field)
}

function compareRelationshipPairs(left: NovelRelationshipPair, right: NovelRelationshipPair): number {
  return compareText(left.pair, right.pair)
    || compareText(left.from, right.from)
    || compareText(left.to, right.to)
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
