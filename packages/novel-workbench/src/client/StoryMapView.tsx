/**
 * 故事地图: the accepted cast and their relationships, drawn with sigma.js over a
 * graphology graph (both MIT; see docs/open-source-evaluations/frontend-stack-2026-09-16.md).
 *
 * The view owns no facts: the nodes and edges arrive already mapped from Canon by
 * the novel data face. What lives here is presentation — layout, colour by
 * faction, and the selection reducer that fades everything but the chosen
 * character's neighbourhood.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { UndirectedGraph } from 'graphology'
import Sigma from 'sigma'
import { circular } from 'graphology-layout'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { NovelStoryMap } from './novel-data.js'

export interface StoryMapViewProps {
  readonly map: NovelStoryMap
  /** Open one person's 人物档案 (the prototype's double-click on a node). */
  readonly onOpenPerson?: (id: string) => void
}

/** Faction palette: four colours plus the unaffiliated grey, both schemes legible. */
const GROUP_COLORS = ['#D97757', '#7A9E7E', '#6C7BA8', '#C08A3E'] as const
const UNAFFILIATED_COLOR = '#9A9A9A'
const FADED = '#d5d0ca'
const FADED_DARK = '#4a4644'

const MAP_CSS = `
[data-novel-story-map] {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: 10px;
}
[data-novel-story-map] .nw-map-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
[data-novel-story-map] .nw-map-title { margin: 0; font-size: 16px; font-weight: 600; }
[data-novel-story-map] .nw-map-meta { font-size: 12px; color: hsl(var(--text-200)); font-variant-numeric: tabular-nums; }
[data-novel-story-map] .nw-map-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 320px;
  border: 1px solid hsl(var(--border-100));
  border-radius: 10px;
  background: hsl(var(--bg-000));
  overflow: hidden;
}
[data-novel-story-map] .nw-map-canvas { position: absolute; inset: 0; }
[data-novel-story-map] .nw-map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 12px;
  color: hsl(var(--text-200));
}
[data-novel-story-map] .nw-map-legend span { display: inline-flex; align-items: center; gap: 6px; }
[data-novel-story-map] .nw-map-swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}
[data-novel-story-map] .nw-map-selection {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 8px 12px;
  border: 1px solid hsl(var(--border-100));
  border-radius: 8px;
  background: hsl(var(--bg-000) / .94);
  font-size: 12px;
  color: hsl(var(--text-100));
  max-width: 60%;
}
[data-novel-story-map] .nw-map-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 320px;
  border: 1px dashed hsl(var(--border-100));
  border-radius: 10px;
  color: hsl(var(--text-200));
}
`

/** The story map canvas. */
export function StoryMapView({ map, onOpenPerson }: StoryMapViewProps): ReactNode {
  const host = useRef<HTMLDivElement | null>(null)
  const renderer = useRef<Sigma | null>(null)
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const colours = useMemo(() => groupColours(map), [map])

  useEffect(() => {
    const element = host.current
    if (element === null) return
    const graph = buildGraph(map, colours)
    // forceAtlas2 expands whatever coordinates the graph already has, and sigma
    // refuses nodes without numeric x/y, so seed a deterministic ring first.
    circular.assign(graph)
    forceAtlas2.assign(graph, { iterations: 220, settings: { ...forceAtlas2.inferSettings(graph), scalingRatio: 12 } })
    const instance = new Sigma(graph, element, {
      renderEdgeLabels: true,
      labelDensity: 0.6,
      labelGridCellSize: 90,
      defaultEdgeColor: '#c4bcb2',
      defaultEdgeType: 'line',
    })
    instance.on('clickNode', ({ node }) => { setSelected(node) })
    instance.on('doubleClickNode', ({ node }) => { onOpenPerson?.(node) })
    instance.on('clickStage', () => { setSelected(undefined) })
    renderer.current = instance
    return () => {
      renderer.current = null
      instance.kill()
    }
  }, [map, colours, onOpenPerson])

  useEffect(() => {
    const instance = renderer.current
    if (instance === null) return
    if (selected === undefined) {
      instance.setSetting('nodeReducer', null)
      instance.setSetting('edgeReducer', null)
      return
    }
    const related = new Set<string>([selected])
    for (const edge of map.edges) {
      if (edge.source === selected) related.add(edge.target)
      if (edge.target === selected) related.add(edge.source)
    }
    const faded = document.body.dataset['dsDarkTheme'] === undefined ? FADED : FADED_DARK
    instance.setSetting('nodeReducer', (node, data) =>
      related.has(node) ? { ...data, zIndex: 2 } : { ...data, color: faded, label: '' })
    instance.setSetting('edgeReducer', (edge, data) => {
      const [source, target] = instance.getGraph().extremities(edge)
      return source === selected || target === selected
        ? { ...data, zIndex: 2 }
        : { ...data, color: faded, label: '' }
    })
  }, [selected, map])

  const chosen = map.nodes.find(node => node.id === selected)

  return (
    <div data-novel-story-map="">
      <style>{MAP_CSS}</style>
      <header className="nw-map-header">
        <h2 className="nw-map-title">故事地图</h2>
        <span className="nw-map-meta">
          {`R${String(map.revision)} · ${String(map.nodes.length)} 个人物 · ${String(map.edges.length)} 条关系`}
        </span>
      </header>
      {map.nodes.length === 0
        ? <p className="nw-map-empty">还没有人物与关系设定</p>
        : (
            <>
              <div className="nw-map-stage">
                <div className="nw-map-canvas" ref={host} data-novel-story-map-canvas="" />
                {chosen !== undefined && (
                  <div className="nw-map-selection" data-novel-story-map-selection={chosen.id}>
                    <strong>{chosen.label}</strong>
                    <span>
                      {chosen.group === undefined ? ' · 无势力' : ` · ${chosen.group}`}
                      {chosen.debts > 0 ? ` · ${String(chosen.debts)} 条未收束关系债务` : ''}
                    </span>
                  </div>
                )}
              </div>
              <div className="nw-map-legend">
                {[...colours].map(([group, colour]) => (
                  <span key={group}>
                    <i className="nw-map-swatch" style={{ background: colour }} />
                    {group}
                  </span>
                ))}
              </div>
            </>
          )}
    </div>
  )
}

function buildGraph(map: NovelStoryMap, colours: ReadonlyMap<string, string>): UndirectedGraph {
  const graph = new UndirectedGraph({ multi: false })
  for (const node of map.nodes) {
    graph.addNode(node.id, {
      label: node.label,
      size: 7 + Math.min(node.debts, 3) * 2,
      color: colours.get(node.group ?? UNAFFILIATED) ?? UNAFFILIATED_COLOR,
    })
  }
  for (const edge of map.edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue
    if (graph.hasEdge(edge.source, edge.target)) continue
    graph.addEdge(edge.source, edge.target, { label: edge.label, size: 1 + Math.min(edge.turns, 4) })
  }
  return graph
}

const UNAFFILIATED = '无势力'

/**
 * Stable group → colour assignment: the palette order follows the sorted group
 * names, so a map keeps its colours between loads while the cast stays the same.
 */
function groupColours(map: NovelStoryMap): ReadonlyMap<string, string> {
  const named = [...new Set(map.nodes.map(node => node.group).filter(
    (group): group is string => group !== undefined,
  ))].sort()
  const colours = new Map<string, string>(named.map((group, index) => [
    group,
    paletteColor(index),
  ]))
  if (map.nodes.some(node => node.group === undefined)) {
    colours.set(UNAFFILIATED, UNAFFILIATED_COLOR)
  }
  return colours
}

function paletteColor(index: number): string {
  return GROUP_COLORS[index % GROUP_COLORS.length] ?? GROUP_COLORS[0]
}
