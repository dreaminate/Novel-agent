import { deepFreeze } from '@deepseek-ai/dsh-util-values'
import { NARRATIVE_CLOCKS } from '@novel-agent/novel-project/types'
import type {
  NarrativeLevel, NovelCanonProjector, NovelCanonSnapshot, NovelNarrativeClockEntry,
  NovelNarrativeDebt, NovelNarrativeProjection, NovelNarrativeUnit,
} from '@novel-agent/novel-project/types'

/** Planning interprets effective Canon sources; Canon alone selects ancestry and commits revisions. */
export const novelPlanningProjector: NovelCanonProjector = {
  project: projectNarrative,
  validate(before, candidate) {
    const previous = projectNarrative(before)
    const next = projectNarrative(candidate)
    validateNarrativeIdentity(previous, next)
    validateNarrativeProjection(next)
  },
}

interface NarrativeState {
  readonly units: Map<string, NovelNarrativeUnit>
  readonly entries: Map<string, NovelNarrativeClockEntry>
  readonly debts: Map<string, NovelNarrativeDebt>
}

function projectNarrative(snapshot: NovelCanonSnapshot): NovelNarrativeProjection {
  const state: NarrativeState = { units: new Map(), entries: new Map(), debts: new Map() }
  for (const revision of snapshot.revisions) {
    for (const delta of revision.deltas) {
      if (delta.kind === 'narrative-unit') {
        if (delta.operation === 'remove' || delta.value === null) {
          state.units.delete(delta.targetId)
        } else {
          state.units.set(delta.targetId, deepFreeze({
            id: delta.targetId,
            ...delta.value,
            sourceRevision: revision.revision,
            sourceDeltaId: delta.id,
            sourceAnchorIds: delta.sourceAnchorIds,
            provenance: revision.provenance,
            delta,
          }))
        }
      } else if (delta.kind === 'narrative-clock') {
        const key = JSON.stringify([delta.field, delta.targetId])
        if (delta.operation === 'remove' || delta.value === null) {
          state.entries.delete(key)
        } else {
          state.entries.set(key, deepFreeze({
            unitId: delta.targetId,
            clock: delta.field,
            ...delta.value,
            sourceRevision: revision.revision,
            sourceDeltaId: delta.id,
            sourceAnchorIds: delta.sourceAnchorIds,
            provenance: revision.provenance,
            delta,
          }))
        }
      } else if (delta.kind === 'narrative-debt') {
        const key = JSON.stringify([delta.field, delta.targetId])
        if (delta.operation === 'remove' || delta.value === null) {
          const existing = state.debts.get(key)
          if (existing !== undefined && existing.unitId !== delta.unitId) {
            throw new Error(
              `narrative debt '${delta.targetId}' belongs to unit '${existing.unitId}', not '${delta.unitId}'`,
            )
          }
          state.debts.delete(key)
        } else {
          state.debts.set(key, deepFreeze({
            id: delta.targetId,
            unitId: delta.unitId,
            clock: delta.field,
            ...delta.value,
            sourceRevision: revision.revision,
            sourceDeltaId: delta.id,
            sourceAnchorIds: delta.sourceAnchorIds,
            provenance: revision.provenance,
            delta,
          }))
        }
      }
    }
  }
  const units = orderNarrativeUnits(state.units)
  const unitPositions = new Map(units.map((unit, index) => [unit.id, index] as const))
  const compareByUnit = (
    left: { unitId: string; sourceDeltaId: string },
    right: { unitId: string; sourceDeltaId: string },
  ): number => (unitPositions.get(left.unitId) ?? Number.MAX_SAFE_INTEGER)
    - (unitPositions.get(right.unitId) ?? Number.MAX_SAFE_INTEGER)
    || compareText(left.sourceDeltaId, right.sourceDeltaId)
  return deepFreeze({
    projectId: snapshot.projectId,
    workspaceId: snapshot.workspaceId,
    revision: snapshot.revision,
    units,
    clocks: NARRATIVE_CLOCKS.map(clock => ({
      clock,
      entries: [...state.entries.values()].filter(entry => entry.clock === clock).sort(compareByUnit),
      debts: [...state.debts.values()].filter(debt => debt.clock === clock).sort(compareByUnit),
    })),
  })
}

const REQUIRED_PARENT_LEVEL: Readonly<Partial<Record<NarrativeLevel, NarrativeLevel>>> = {
  volume: 'book',
  arc: 'volume',
  chapter: 'arc',
  scene: 'chapter',
  beat: 'scene',
  prose: 'beat',
}

function validateNarrativeProjection(projection: NovelNarrativeProjection): void {
  const units = new Map(projection.units.map(unit => [unit.id, unit] as const))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visitParentChain = (unitId: string): void => {
    if (visiting.has(unitId)) {
      throw new Error(`narrative hierarchy cycle includes '${unitId}'`)
    }
    if (visited.has(unitId)) return
    visiting.add(unitId)
    const parentId = units.get(unitId)?.parentId
    if (parentId !== null && parentId !== undefined && units.has(parentId)) {
      visitParentChain(parentId)
    }
    visiting.delete(unitId)
    visited.add(unitId)
  }
  for (const unit of units.values()) visitParentChain(unit.id)

  const siblingOrders = new Map<string, string>()
  for (const unit of units.values()) {
    if (unit.level === 'series') {
      if (unit.parentId !== null) {
        throw new Error(`narrative unit '${unit.id}' at level series must be a root`)
      }
    } else if (unit.level === 'book') {
      if (unit.parentId !== null) {
        const parent = units.get(unit.parentId)
        if (parent === undefined) {
          throw new Error(`narrative unit '${unit.id}' is orphaned: missing parent '${unit.parentId}'`)
        }
        if (parent.level !== 'series') {
          throw new Error(
            `narrative unit '${unit.id}' at level book requires parent level series, got ${parent.level}`,
          )
        }
      }
    } else {
      const requiredParentLevel = REQUIRED_PARENT_LEVEL[unit.level]
      if (unit.parentId === null) {
        throw new Error(
          `narrative unit '${unit.id}' at level ${unit.level} requires parent level ${String(requiredParentLevel)}`,
        )
      }
      const parent = units.get(unit.parentId)
      if (parent === undefined) {
        throw new Error(`narrative unit '${unit.id}' is orphaned: missing parent '${unit.parentId}'`)
      }
      if (parent.level !== requiredParentLevel) {
        throw new Error(
          `narrative unit '${unit.id}' at level ${unit.level} requires parent level ${String(requiredParentLevel)}, got ${parent.level}`,
        )
      }
    }

    const siblingKey = JSON.stringify([unit.parentId, unit.order])
    const existingSibling = siblingOrders.get(siblingKey)
    if (existingSibling !== undefined) {
      throw new Error(
        `narrative sibling order ${String(unit.order)} is duplicated by '${existingSibling}' and '${unit.id}'`,
      )
    }
    siblingOrders.set(siblingKey, unit.id)
  }

  for (const bucket of projection.clocks) {
    for (const entry of bucket.entries) {
      const unit = units.get(entry.unitId)
      if (unit === undefined) {
        throw new Error(
          `narrative clock '${bucket.clock}' references missing unit '${entry.unitId}'`,
        )
      }
      if (
        entry.delta.operation === 'set'
        && entry.delta.field === 'plot'
        && entry.delta.value.scope.level !== unit.level
      ) {
        throw new Error(
          `plot progression scope level '${entry.delta.value.scope.level}' does not match narrative unit '${entry.unitId}' level '${unit.level}'`,
        )
      }
      if (
        entry.delta.operation === 'set'
        && entry.delta.field === 'world'
        && entry.delta.value.scope.level !== unit.level
      ) {
        throw new Error(
          `world scope level '${entry.delta.value.scope.level}' does not match narrative unit '${entry.unitId}' level '${unit.level}'`,
        )
      }
      if (
        entry.delta.operation === 'set'
        && entry.delta.field === 'promise'
        && entry.delta.value.scope.level !== unit.level
      ) {
        throw new Error(
          `promise scope level '${entry.delta.value.scope.level}' does not match narrative unit '${entry.unitId}' level '${unit.level}'`,
        )
      }
      if (
        entry.delta.operation === 'set'
        && entry.delta.field === 'character'
        && entry.delta.value.scope.level !== unit.level
      ) {
        throw new Error(
          `character scope level '${entry.delta.value.scope.level}' does not match narrative unit '${entry.unitId}' level '${unit.level}'`,
        )
      }
      if (
        entry.delta.operation === 'set'
        && entry.delta.field === 'relationship'
        && entry.delta.value.scope.level !== unit.level
      ) {
        throw new Error(
          `relationship scope level '${entry.delta.value.scope.level}' does not match narrative unit '${entry.unitId}' level '${unit.level}'`,
        )
      }
      if (
        entry.delta.operation === 'set'
        && entry.delta.field === 'progression'
        && entry.delta.value.scope.level !== unit.level
      ) {
        throw new Error(
          `progression scope level '${entry.delta.value.scope.level}' does not match narrative unit '${entry.unitId}' level '${unit.level}'`,
        )
      }
      if (
        entry.delta.operation === 'set'
        && entry.delta.field === 'reader-knowledge'
        && entry.delta.value.scope.level !== unit.level
      ) {
        throw new Error(
          `reader-knowledge scope level '${entry.delta.value.scope.level}' does not match narrative unit '${entry.unitId}' level '${unit.level}'`,
        )
      }
      if (
        entry.delta.operation === 'set'
        && entry.delta.field === 'mystery'
        && entry.delta.value.scope.level !== unit.level
      ) {
        throw new Error(
          `mystery scope level '${entry.delta.value.scope.level}' does not match narrative unit '${entry.unitId}' level '${unit.level}'`,
        )
      }
      if (
        entry.delta.operation === 'set'
        && entry.delta.field === 'ending'
        && entry.delta.value.scope.level !== unit.level
      ) {
        throw new Error(
          `ending scope level '${entry.delta.value.scope.level}' does not match narrative unit '${entry.unitId}' level '${unit.level}'`,
        )
      }
    }
    for (const debt of bucket.debts) {
      if (!units.has(debt.unitId)) {
        throw new Error(
          `narrative debt '${debt.id}' references missing unit '${debt.unitId}'`,
        )
      }
    }
  }
}

function validateNarrativeIdentity(
  previous: NovelNarrativeProjection,
  candidate: NovelNarrativeProjection,
): void {
  const previousUnits = new Map(previous.units.map(unit => [unit.id, unit] as const))
  for (const unit of candidate.units) {
    const accepted = previousUnits.get(unit.id)
    if (accepted !== undefined && accepted.level !== unit.level) {
      throw new Error(
        `narrative unit '${unit.id}' level is immutable: cannot change from ${accepted.level} to ${unit.level}`,
      )
    }
  }
}

function orderNarrativeUnits(
  units: ReadonlyMap<string, NovelNarrativeUnit>,
): NovelNarrativeUnit[] {
  const children = new Map<string | null, NovelNarrativeUnit[]>()
  for (const unit of units.values()) {
    const siblings = children.get(unit.parentId) ?? []
    siblings.push(unit)
    children.set(unit.parentId, siblings)
  }
  for (const siblings of children.values()) siblings.sort(compareNarrativeUnits)

  const ordered: NovelNarrativeUnit[] = []
  const seen = new Set<string>()
  const visit = (unit: NovelNarrativeUnit): void => {
    if (seen.has(unit.id)) return
    seen.add(unit.id)
    ordered.push(unit)
    for (const child of children.get(unit.id) ?? []) visit(child)
  }
  for (const root of children.get(null) ?? []) visit(root)
  for (const unit of [...units.values()].sort(compareNarrativeUnits)) visit(unit)
  return ordered
}

function compareNarrativeUnits(
  left: NovelNarrativeUnit,
  right: NovelNarrativeUnit,
): number {
  return left.order - right.order || compareText(left.id, right.id)
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
