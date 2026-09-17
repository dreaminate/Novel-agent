/**
 * Where the story map draws things, as a pure function.
 *
 * The prototype lays a long cast out as discs of allied characters on a ring,
 * with the cast no relationship line reaches collapsed behind a `+N` on their
 * own disc. That keeps a growing cast readable: allies stay together, positions
 * are stable between loads, and an unconnected dot stops taking up room.
 *
 * Keeping the geometry here — rather than inside the sigma renderer — lets the
 * ring maths, the folding rule and the pin rule be asserted without WebGL.
 */
import type { NovelStoryMap, NovelStoryNode } from './novel-data.js'

/** Which accepted field decides who belongs together. */
export type ClusterAxis = 'faction' | 'place'

/** Cluster name for the cast Canon records no faction for. */
export const UNCLUSTERED_FACTION = '无势力'
/** Cluster name for the cast no accepted story event places anywhere. */
export const UNCLUSTERED_PLACE = '地点未知'

/** The graph-space canvas the prototype lays the map out in. */
export const MAP_CANVAS = { w: 880, h: 740, cx: 440, cy: 356 } as const

/** Radius of the ring the cluster discs themselves sit on, sized to the count. */
function discOrbit(count: number): number {
  return count >= 5 ? 238 : count === 4 ? 218 : 206
}

/** How wide a disc has to be to hold `members` on its inner ring. */
function memberOrbit(members: number, expanded: boolean): number {
  return 34 + Math.min(members, 5) * 11 + (expanded ? 22 : 0)
}

/** The gap between a disc's inner ring and its rim. */
const DISC_MARGIN = 52
/** How far outside the rim a `+N` sits, so it clears the rim and the member labels. */
const BUBBLE_LIFT = 30
/** Slack around the content box, and room for a bubble's own width. */
const BOUNDS_PADDING = 24

export interface MapPoint {
  readonly x: number
  readonly y: number
}

/** The characters a cluster folded away, and where its `+N` sits. */
export interface MapBubble {
  readonly x: number
  readonly y: number
  readonly n: number
  readonly ids: readonly string[]
}

/** One disc: its centre, its rim, who is drawn on it, and its `+N` if any. */
export interface MapCluster {
  readonly id: string
  readonly label: string
  readonly cx: number
  readonly cy: number
  readonly r: number
  readonly drawn: readonly string[]
  readonly bubble: MapBubble | undefined
}

/** A graph-space rectangle the renderer can frame the camera on. */
export interface MapBounds {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

export interface MapLayout {
  readonly positions: ReadonlyMap<string, MapPoint>
  readonly clusters: readonly MapCluster[]
  /** Character ids the layout folded away, so the renderer can leave them out. */
  readonly hidden: readonly string[]
  /**
   * Everything the layout draws, discs and `+N` included, with slack. The
   * renderer frames this rather than the cast: a disc is wider than the members
   * it holds, so fitting the members alone cuts the rims off, and framing a
   * fixed canvas instead makes the map shrink as the prototype canvas grows.
   * `null` when the author has no cast at all.
   */
  readonly bounds: MapBounds | null
}

export interface MapLayoutInput {
  readonly map: NovelStoryMap
  readonly axis: ClusterAxis
  /** Cluster ids the author has opened, whose folded cast comes back. */
  readonly expanded: ReadonlySet<string>
  /** Characters the author dragged somewhere, which outrank the ring. */
  readonly pins: ReadonlyMap<string, MapPoint>
}

/** Which cluster one character belongs to on the chosen axis. */
export function clusterKeyOf(node: NovelStoryNode, axis: ClusterAxis): string {
  if (axis === 'place') return node.place ?? UNCLUSTERED_PLACE
  return node.group ?? UNCLUSTERED_FACTION
}

export function layoutStoryMap(input: MapLayoutInput): MapLayout {
  const groups = new Map<string, NovelStoryNode[]>()
  for (const node of input.map.nodes) {
    const key = clusterKeyOf(node, input.axis)
    const bucket = groups.get(key)
    if (bucket === undefined) groups.set(key, [node])
    else bucket.push(node)
  }

  const reached = new Set<string>()
  for (const edge of input.map.edges) {
    reached.add(edge.source)
    reached.add(edge.target)
  }

  // Named clusters first, in a stable author-facing order; the catch-all for
  // "Canon records nothing" goes last, where a bucket of leftovers belongs.
  const unclustered = input.axis === 'place' ? UNCLUSTERED_PLACE : UNCLUSTERED_FACTION
  const keys = [...groups.keys()].sort((left, right) => {
    if (left === unclustered) return right === unclustered ? 0 : 1
    if (right === unclustered) return -1
    return left.localeCompare(right, 'zh-Hans-CN')
  })

  const orbit = discOrbit(keys.length)
  const positions = new Map<string, MapPoint>()
  const clusters: MapCluster[] = []
  const hidden: string[] = []
  let bounds: MapBounds | null = null

  keys.forEach((key, index) => {
    const members = groups.get(key) ?? []
    const angle = keys.length === 1
      ? 0
      : (-90 + index * (360 / keys.length)) * Math.PI / 180
    const cx = keys.length === 1 ? MAP_CANVAS.cx : MAP_CANVAS.cx + Math.cos(angle) * orbit
    const cy = keys.length === 1 ? MAP_CANVAS.cy : MAP_CANVAS.cy + Math.sin(angle) * orbit

    const expanded = input.expanded.has(key)
    const connected = members.filter(node => reached.has(node.id))
    const loose = members.filter(node => !reached.has(node.id))
    // A disc whose whole cast is unconnected keeps its characters: an empty
    // disc carrying only a `+N` withholds more than it saves.
    const folded = connected.length === 0 || expanded ? [] : loose
    const drawn = connected.length === 0 ? [...members] : [...connected, ...loose.filter(node => !folded.includes(node))]
    const ring = memberOrbit(drawn.length, expanded && connected.length > 0)

    drawn.forEach((node, seat) => {
      const pinned = input.pins.get(node.id)
      if (pinned !== undefined) {
        positions.set(node.id, pinned)
        return
      }
      const seatAngle = drawn.length === 1
        ? -Math.PI / 2
        : -Math.PI / 2 + seat * (2 * Math.PI / drawn.length)
      positions.set(node.id, {
        x: cx + Math.cos(seatAngle) * ring,
        y: cy + Math.sin(seatAngle) * ring,
      })
    })

    for (const node of folded) hidden.push(node.id)
    const reach = ring + DISC_MARGIN + BUBBLE_LIFT + BOUNDS_PADDING
    bounds = {
      minX: Math.min(bounds?.minX ?? cx - reach, cx - reach),
      minY: Math.min(bounds?.minY ?? cy - reach, cy - reach),
      maxX: Math.max(bounds?.maxX ?? cx + reach, cx + reach),
      maxY: Math.max(bounds?.maxY ?? cy + reach, cy + reach),
    }
    clusters.push({
      id: key,
      label: key,
      cx,
      cy,
      r: ring + DISC_MARGIN,
      drawn: drawn.map(node => node.id),
      bubble: folded.length === 0
        ? undefined
        : {
            x: cx + Math.cos(angle) * (ring + DISC_MARGIN + BUBBLE_LIFT),
            y: cy + Math.sin(angle) * (ring + DISC_MARGIN + BUBBLE_LIFT),
            n: folded.length,
            ids: folded.map(node => node.id),
          },
    })
  })

  return { positions, clusters, hidden, bounds }
}
