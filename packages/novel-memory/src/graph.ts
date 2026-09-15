import { createHash } from 'node:crypto'
import { deepFreeze } from '@deepseek-ai/dsh-util-values'
import type {
  NovelCanonProjection, NovelCanonSnapshot, NovelCanonValue, NovelCausalImpact,
  NovelGraphEdge, NovelGraphNode, NovelGraphProjection, NovelNarrativeProjection,
  NovelRetrievalSourceRange, NovelRevisionImpact, NovelCanonFact, NovelKnowledgeBoundary,
} from '@novel-agent/novel-project/types'

/** Build a derived graph from the supplied Canon and Planning views, including an unaccepted preview snapshot. */
export function buildNovelGraph(
  project: NovelCanonSnapshot,
  canon: NovelCanonProjection,
  narrative: NovelNarrativeProjection,
  headRevision: number,
): NovelGraphProjection {
  const nodesById = new Map<string, NovelGraphNode>()
  const edgesById = new Map<string, NovelGraphEdge>()

  const addNode = (node: NovelGraphNode): void => {
    if (!nodesById.has(node.id)) nodesById.set(node.id, node)
  }
  const addEdge = (edge: NovelGraphEdge): void => {
    if (!edgesById.has(edge.id)) edgesById.set(edge.id, edge)
  }

  const unitsById = new Map(narrative.units.map(unit => [unit.id, unit] as const))
  for (const unit of narrative.units) {
    addNode({
      id: `unit:${unit.id}`,
      kind: 'narrative-unit',
      label: unit.id,
      value: unit.status,
      ...graphSourceMetadata(project, unit),
    })
  }
  for (const unit of narrative.units) {
    if (unit.parentId === null || !unitsById.has(unit.parentId)) continue
    addEdge({
      id: `hierarchy:${unit.parentId}:${unit.id}`,
      kind: 'hierarchy',
      from: `unit:${unit.parentId}`,
      to: `unit:${unit.id}`,
      label: 'contains',
      ...graphSourceMetadata(project, unit),
    })
  }

  const addEntityNode = (id: string, source: NovelGraphSource): string => {
    const nodeId = `entity:${id}`
    addNode({
      id: nodeId,
      kind: 'entity',
      label: id,
      ...graphSourceMetadata(project, source),
    })
    return nodeId
  }

  for (const fact of canon.facts) {
    const factNodeId = `fact:${fact.kind}:${fact.targetId}:${fact.field}`
    const factLabel = `${fact.kind}:${fact.targetId}:${fact.field}`
    const metadata = graphSourceMetadata(project, fact)
    addNode({
      id: factNodeId,
      kind: 'canon-fact',
      label: factLabel,
      value: fact.value,
      ...metadata,
    })

    const relation = fact.kind === 'relationship' || fact.kind === 'knowledge'
      ? splitNovelGraphRelationTarget(fact.targetId)
      : undefined
    const targetNodeIds = relation === undefined
      ? [unitsById.has(fact.targetId)
          ? `unit:${fact.targetId}`
          : addEntityNode(fact.targetId, fact)]
      : relation.map(endpoint => addEntityNode(endpoint, fact))
    for (const targetNodeId of targetNodeIds) {
      const targetSuffix = targetNodeId.startsWith('unit:')
        ? targetNodeId.slice('unit:'.length)
        : targetNodeId.slice('entity:'.length)
      addEdge({
        id: `fact-target:${fact.kind}:${fact.targetId}:${fact.field}:${targetSuffix}`,
        kind: 'fact-target',
        from: factNodeId,
        to: targetNodeId,
        label: `${fact.field}: ${formatCanonValue(fact.value)}`,
        ...metadata,
      })
    }
    if (fact.kind === 'relationship' && relation !== undefined) {
      const [from, to] = relation
      addEdge({
        id: `relationship:${fact.targetId}:${fact.field}`,
        kind: 'relationship',
        from: `entity:${from}`,
        to: `entity:${to}`,
        label: `${fact.field}: ${formatCanonValue(fact.value)}`,
        ...metadata,
      })
    }
    if (fact.kind === 'knowledge' && relation !== undefined) {
      const [from, to] = relation
      addEdge({
        id: `knowledge:${from}:${to}:${fact.field}`,
        kind: 'knowledge',
        from: `entity:${from}`,
        to: `entity:${to}`,
        label: `${fact.field}: ${formatCanonValue(fact.value)}`,
        ...metadata,
      })
    }
    if (fact.kind === 'story-event'
      && fact.field === 'causes'
      && typeof fact.value === 'string') {
      const from = addEntityNode(fact.targetId, fact)
      const to = addEntityNode(fact.value, fact)
      addEdge({
        id: `causal:${fact.targetId}:${fact.value}`,
        kind: 'causal',
        from,
        to,
        label: 'causes',
        ...metadata,
      })
    }
  }

  for (const bucket of narrative.clocks) {
    for (const entry of bucket.entries) {
      const nodeId = `clock:${entry.clock}:${entry.unitId}`
      addNode({
        id: nodeId,
        kind: 'narrative-clock',
        label: nodeId,
        value: entry.state,
        ...graphSourceMetadata(project, entry),
      })
      addEdge({
        id: `clock-unit:${entry.clock}:${entry.unitId}`,
        kind: 'clock-unit',
        from: nodeId,
        to: `unit:${entry.unitId}`,
        label: entry.clock,
        ...graphSourceMetadata(project, entry),
      })
    }
    for (const debt of bucket.debts) {
      const nodeId = `debt:${debt.clock}:${debt.id}`
      addNode({
        id: nodeId,
        kind: 'narrative-debt',
        label: nodeId,
        value: debt.status,
        ...graphSourceMetadata(project, debt),
      })
      addEdge({
        id: `debt-unit:${debt.clock}:${debt.id}:${debt.unitId}`,
        kind: 'debt-unit',
        from: nodeId,
        to: `unit:${debt.unitId}`,
        label: debt.clock,
        ...graphSourceMetadata(project, debt),
      })
    }
  }

  const nodes = [...nodesById.values()].sort((left, right) =>
    compareText(left.id, right.id) || compareText(left.kind, right.kind))
  const edges = [...edgesById.values()].sort((left, right) =>
    compareText(left.id, right.id)
      || compareText(left.kind, right.kind)
      || compareText(left.from, right.from)
      || compareText(left.to, right.to))
  const contentHash = createHash('sha256')
    .update(JSON.stringify({ nodes, edges }))
    .digest('hex')

  return deepFreeze({
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    revision: narrative.revision,
    headRevision,
    freshness: narrative.revision === headRevision ? 'current' : 'historical',
    provider: 'novel-graph',
    contentHash,
    nodes,
    edges,
  })
}

export function traceNovelCausalImpact(
  graph: NovelGraphProjection,
  sourceEventId: string,
): NovelCausalImpact {
  const sourceNodeId = `entity:${sourceEventId}`
  const outgoing = new Map<string, NovelGraphEdge[]>()
  for (const edge of graph.edges) {
    if (edge.kind !== 'causal') continue
    const edges = outgoing.get(edge.from) ?? []
    edges.push(edge)
    outgoing.set(edge.from, edges)
  }
  for (const edges of outgoing.values()) {
    edges.sort((left, right) => compareText(left.to, right.to) || compareText(left.id, right.id))
  }

  const visited = new Set([sourceNodeId])
  const queue: Array<{ readonly nodeId: string; readonly path: readonly NovelGraphEdge[] }> = [{
    nodeId: sourceNodeId,
    path: [],
  }]
  const affected: NovelCausalImpact['affected'][number][] = []
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!
    for (const edge of outgoing.get(current.nodeId) ?? []) {
      if (visited.has(edge.to)) continue
      visited.add(edge.to)
      const path = [...current.path, edge]
      queue.push({ nodeId: edge.to, path })
      affected.push({
        eventId: edge.to.startsWith('entity:') ? edge.to.slice('entity:'.length) : edge.to,
        depth: path.length,
        path,
      })
    }
  }
  affected.sort((left, right) => left.depth - right.depth || compareText(left.eventId, right.eventId))
  return {
    sourceEventId,
    affected,
  }
}

export function compareNovelCausalConsequences(
  beforeGraph: NovelGraphProjection,
  afterGraph: NovelGraphProjection,
): NonNullable<NovelRevisionImpact['causalConsequences']> {
  const sourceEventIds = [...new Set([
    ...causalSourceEventIds(beforeGraph),
    ...causalSourceEventIds(afterGraph),
  ])].sort(compareText)
  const impacts: NonNullable<NovelRevisionImpact['causalConsequences']>[number][] = []

  for (const sourceEventId of sourceEventIds) {
    const before = traceNovelCausalImpact(beforeGraph, sourceEventId).affected
    const after = traceNovelCausalImpact(afterGraph, sourceEventId).affected
    const beforeByEventId = new Map(before.map(event => [event.eventId, event] as const))
    const afterByEventId = new Map(after.map(event => [event.eventId, event] as const))
    const added = after.filter(event => !beforeByEventId.has(event.eventId))
    const removed = before.filter(event => !afterByEventId.has(event.eventId))
    const changed = after.flatMap((afterEvent) => {
      const beforeEvent = beforeByEventId.get(afterEvent.eventId)
      return beforeEvent !== undefined
        && !causalImpactEventsSemanticallyEqual(beforeEvent, afterEvent)
        ? [{ before: beforeEvent, after: afterEvent }]
        : []
    })

    if (added.length > 0 || removed.length > 0 || changed.length > 0) {
      impacts.push({ sourceEventId, added, removed, changed })
    }
  }

  return impacts
}

function causalSourceEventIds(graph: NovelGraphProjection): string[] {
  return graph.edges
    .filter(edge => edge.kind === 'causal')
    .map(edge => edge.from.startsWith('entity:')
      ? edge.from.slice('entity:'.length)
      : edge.from)
}

function causalImpactEventsSemanticallyEqual(
  left: NovelCausalImpact['affected'][number],
  right: NovelCausalImpact['affected'][number],
): boolean {
  return left.depth === right.depth
    && left.path.length === right.path.length
    && left.path.every((edge, index) => {
      const other = right.path[index]!
      return edge.from === other.from && edge.to === other.to
    })
}

export function buildNovelKnowledgeBoundary(
  project: NovelCanonSnapshot,
  canon: NovelCanonProjection,
  headRevision: number,
  subjectId: string,
): NovelKnowledgeBoundary {
  const knowledgeByFactId = new Map<string, NovelCanonFact[]>()
  for (const fact of canon.facts) {
    if (fact.kind !== 'knowledge') continue
    const relation = splitNovelGraphRelationTarget(fact.targetId)
    if (relation === undefined || relation[0] !== subjectId) continue
    const current = knowledgeByFactId.get(relation[1]) ?? []
    current.push(fact)
    knowledgeByFactId.set(relation[1], current)
  }

  const fieldWithRanges = (fact: NovelCanonFact) => ({
    fact,
    sourceRanges: retrievalSourceRanges(
      project,
      fact.sourceRevision,
      fact.sourceAnchorIds,
    ),
  })
  const entries = [...knowledgeByFactId.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([factId, knowledgeFields]) => ({
      factId,
      knowledgeFields: knowledgeFields
        .sort(compareCanonFacts)
        .map(fieldWithRanges),
      factFields: canon.facts
        .filter(fact => fact.kind !== 'knowledge' && fact.targetId === factId)
        .sort(compareCanonFacts)
        .map(fieldWithRanges),
    }))

  return deepFreeze({
    subjectId,
    revision: canon.revision,
    headRevision,
    freshness: canon.revision === headRevision ? 'current' : 'historical',
    entries,
  })
}

/** Include every accepted subject boundary independently of the current search words. */
export function buildNovelKnowledgeBoundaries(snapshot: NovelCanonSnapshot, canon: NovelCanonProjection, headRevision: number): readonly NovelKnowledgeBoundary[] {
  return [...new Set(canon.facts.flatMap(fact => {
    if (fact.kind !== 'knowledge') return []
    const relation = splitNovelGraphRelationTarget(fact.targetId)
    return relation === undefined ? [] : [relation[0]]
  }))].sort(compareText).map(subjectId => buildNovelKnowledgeBoundary(snapshot, canon, headRevision, subjectId))
}

function compareCanonFacts(left: NovelCanonFact, right: NovelCanonFact): number {
  return compareText(left.kind, right.kind)
    || compareText(left.targetId, right.targetId)
    || compareText(left.field, right.field)
}

type NovelGraphSource = {
  readonly sourceRevision: number
  readonly sourceDeltaId: string
  readonly sourceAnchorIds: readonly string[]
  readonly provenance: {
    readonly taskId: string
    readonly sessionId: string
    readonly producer: string
  }
}

function graphSourceMetadata(
  project: NovelCanonSnapshot,
  source: NovelGraphSource,
): Pick<NovelGraphNode, 'sourceRevision' | 'sourceDeltaId' | 'sourceAnchorIds' | 'sourceRanges' | 'provenance'> {
  const sourceAnchorIds = [...source.sourceAnchorIds].sort(compareText)
  const sourceRanges = retrievalSourceRanges(
    project,
    source.sourceRevision,
    sourceAnchorIds,
  ).sort(compareNovelGraphSourceRanges)
  return {
    sourceRevision: source.sourceRevision,
    sourceDeltaId: source.sourceDeltaId,
    sourceAnchorIds,
    sourceRanges,
    provenance: source.provenance,
  }
}

function compareNovelGraphSourceRanges(
  left: NovelRetrievalSourceRange,
  right: NovelRetrievalSourceRange,
): number {
  return compareText(left.sourceId, right.sourceId)
    || left.start - right.start
    || left.end - right.end
    || compareText(left.anchorId ?? '', right.anchorId ?? '')
    || compareText(left.contentHash, right.contentHash)
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

function retrievalSourceRanges(
  snapshot: NovelCanonSnapshot,
  sourceRevision: number,
  sourceAnchorIds: readonly string[],
): NovelRetrievalSourceRange[] {
  const revision = snapshot.revisions.find(source => source.revision === sourceRevision)!
  const anchors = new Map(revision.sourceAnchors.map(anchor => [anchor.id, anchor] as const))
  return sourceAnchorIds.map(id => {
    const anchor = anchors.get(id)!
    return { anchorId: anchor.id, sourceId: anchor.sourceId, start: anchor.start, end: anchor.end, contentHash: anchor.contentHash }
  })
}

function formatCanonValue(value: NovelCanonValue): string {
  return typeof value === 'string' ? value : canonicalizeJsonValue(value)
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

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
