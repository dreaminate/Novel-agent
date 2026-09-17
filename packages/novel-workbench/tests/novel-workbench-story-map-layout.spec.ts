// The story map's geometry is a pure function so it can be asserted without WebGL:
// `layoutStoryMap` decides where every drawn character sits, which cluster disc
// carries their label, and which unconnected characters collapse behind a `+N`.
import { describe, expect, it } from 'vitest'
import type { NovelStoryMap, NovelStoryNode } from '../src/client/novel-data.js'
import { MAP_CANVAS, clusterKeyOf, layoutStoryMap } from '../src/client/story-map-layout.js'

function node(id: string, group?: string, place?: string): NovelStoryNode {
  return { id, label: id, group, place, debts: 0 }
}

function map(nodes: readonly NovelStoryNode[], pairs: readonly (readonly [string, string])[] = []): NovelStoryMap {
  return {
    revision: 5,
    nodes,
    edges: pairs.map(([source, target]) => ({
      id: `${source}-${target}`,
      source,
      target,
      label: '关系',
      turns: 1,
    })),
  }
}

/** Distance from a cluster's own centre. */
function radiusFrom(point: { x: number; y: number }, centre: { x: number; y: number }): number {
  return Math.hypot(point.x - centre.x, point.y - centre.y)
}

describe('story map layout', () => {
  it('groups the cast by faction, and the ungrouped under one name', () => {
    const story = map([node('a', '甲'), node('b', '乙'), node('c'), node('d', '甲')])
    const layout = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(), pins: new Map() })

    expect(layout.clusters.map(cluster => [cluster.label, cluster.drawn.length])).toEqual([
      ['甲', 2],
      ['乙', 1],
      ['无势力', 1],
    ])
    for (const cluster of layout.clusters) {
      for (const id of cluster.drawn) {
        expect(clusterKeyOf(story.nodes.find(entry => entry.id === id)!, 'faction')).toBe(cluster.id)
      }
    }
  })

  it('groups the cast by last known place when the author asks for places', () => {
    const story = map([node('a', '甲', '码头'), node('b', '乙', '码头'), node('c', '甲')])
    const layout = layoutStoryMap({ map: story, axis: 'place', expanded: new Set(), pins: new Map() })

    expect(layout.clusters.map(cluster => [cluster.label, cluster.drawn.length])).toEqual([
      ['码头', 2],
      ['地点未知', 1],
    ])  })

  it('places cluster discs on the outer ring and members on each disc own ring', () => {
    const story = map([node('a', '甲'), node('b', '甲'), node('c', '乙'), node('d', '乙'), node('e', '丙')])
    const layout = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(), pins: new Map() })

    const centre = { x: MAP_CANVAS.cx, y: MAP_CANVAS.cy }
    expect(layout.clusters).toHaveLength(3)
    for (const cluster of layout.clusters) {
      // Every disc centre sits on one shared outer ring around the canvas centre.
      expect(radiusFrom({ x: cluster.cx, y: cluster.cy }, centre)).toBeCloseTo(206, 6)
      for (const id of cluster.drawn) {
        const point = layout.positions.get(id)
        expect(point).toBeDefined()
        // Members orbit their own disc, and the disc is big enough to hold them.
        expect(radiusFrom(point!, { x: cluster.cx, y: cluster.cy })).toBeGreaterThan(0)
        expect(radiusFrom(point!, { x: cluster.cx, y: cluster.cy })).toBeLessThan(cluster.r)
      }
    }
    // Two members of one disc share the same orbit radius, opposite each other.
    const first = layout.positions.get('a')!
    const second = layout.positions.get('b')!
    const disc = layout.clusters.find(cluster => cluster.id === '甲')!
    const discCentre = { x: disc.cx, y: disc.cy }
    expect(radiusFrom(first, discCentre)).toBeCloseTo(radiusFrom(second, discCentre), 6)
  })

  it('lays the same cast out at the same coordinates every time', () => {
    const story = map([node('a', '甲'), node('b', '乙'), node('c', '乙')])
    const once = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(), pins: new Map() })
    const twice = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(), pins: new Map() })
    expect([...once.positions]).toEqual([...twice.positions])
    expect(once.clusters.map(cluster => [cluster.cx, cluster.cy, cluster.r]))
      .toEqual(twice.clusters.map(cluster => [cluster.cx, cluster.cy, cluster.r]))
  })

  it('folds the cast no accepted line reaches behind one +N per cluster', () => {
    // 甲 has a real relation, so its unconnected member folds; 乙 has no line at
    // all, so its members stay drawn — an empty disc with only a +N says nothing.
    const story = map(
      [node('a', '甲'), node('b', '甲'), node('e', '甲'), node('c', '乙'), node('d', '乙')],
      [['a', 'b']],
    )
    const layout = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(), pins: new Map() })

    const first = layout.clusters.find(cluster => cluster.id === '甲')!
    expect(first.drawn).toEqual(['a', 'b'])
    expect(first.bubble?.n).toBe(1)
    expect(first.bubble?.ids).toEqual(['e'])
    expect(layout.hidden).toEqual(['e'])

    const second = layout.clusters.find(cluster => cluster.id === '乙')!
    expect(second.drawn.sort()).toEqual(['c', 'd'])
    expect(second.bubble).toBeUndefined()
    expect(layout.hidden).not.toContain('c')
  })

  it('draws the folded cast once the author expands their cluster', () => {
    const story = map([node('a', '甲'), node('b', '甲'), node('c', '甲')], [['a', 'b']])
    const folded = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(), pins: new Map() })
    const open = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(['甲']), pins: new Map() })

    expect(folded.clusters[0]?.drawn).toEqual(['a', 'b'])
    expect(folded.clusters[0]?.bubble?.ids).toEqual(['c'])
    expect(open.clusters[0]?.drawn.sort()).toEqual(['a', 'b', 'c'])
    expect(open.clusters[0]?.bubble).toBeUndefined()
    expect(open.hidden).toEqual([])
    // An expanded disc is wider, so the extra members have room.
    expect(open.clusters[0]!.r).toBeGreaterThan(folded.clusters[0]!.r)
  })

  it('keeps a pinned character where the author dropped it', () => {
    const story = map([node('a', '甲'), node('b', '甲')])
    const free = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(), pins: new Map() })
    const pinned = layoutStoryMap({
      map: story,
      axis: 'faction',
      expanded: new Set(),
      pins: new Map([['a', { x: 12, y: 34 }]]),
    })

    expect(pinned.positions.get('a')).toEqual({ x: 12, y: 34 })
    // The rest of the cast still orbits the disc the pin belongs to.
    expect(pinned.positions.get('b')).toEqual(free.positions.get('b'))
    expect(pinned.clusters[0]?.id).toBe('甲')
  })

  it('frames the disc it draws, not just the characters standing on it', () => {
    // The renderer can only frame the points it is given, and a disc reaches
    // wider than the members it holds: the content box has to cover the rim.
    const story = map([node('a', '甲'), node('b', '甲'), node('c', '甲')], [['a', 'b']])
    const layout = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(), pins: new Map() })
    const bounds = layout.bounds

    expect(bounds).not.toBeNull()
    for (const cluster of layout.clusters) {
      expect(bounds!.minX).toBeLessThanOrEqual(cluster.cx - cluster.r)
      expect(bounds!.maxX).toBeGreaterThanOrEqual(cluster.cx + cluster.r)
      expect(bounds!.minY).toBeLessThanOrEqual(cluster.cy - cluster.r)
      expect(bounds!.maxY).toBeGreaterThanOrEqual(cluster.cy + cluster.r)
    }
    expect(layoutStoryMap({ map: map([]), axis: 'faction', expanded: new Set(), pins: new Map() }).bounds)
      .toBeNull()
  })

  it('keeps a +N outside the rim, clear of the characters it is hiding', () => {
    const story = map([node('a', '甲'), node('b', '甲'), node('c', '甲')], [['a', 'b']])
    const layout = layoutStoryMap({ map: story, axis: 'faction', expanded: new Set(), pins: new Map() })
    const cluster = layout.clusters[0]!
    const bubble = cluster.bubble!

    expect(bubble.n).toBe(1)
    expect(Math.hypot(bubble.x - cluster.cx, bubble.y - cluster.cy)).toBeGreaterThan(cluster.r)
    expect(layout.bounds!.maxX).toBeGreaterThan(bubble.x)
  })

  it('reports no cluster for an empty cast', () => {
    const layout = layoutStoryMap({ map: map([]), axis: 'faction', expanded: new Set(), pins: new Map() })
    expect(layout.clusters).toEqual([])
    expect(layout.positions.size).toBe(0)
    expect(layout.hidden).toEqual([])
  })
})
