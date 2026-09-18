/**
 * 故事地图: the accepted cast and their relationships, drawn with sigma.js over a
 * graphology graph (both MIT; see docs/open-source-evaluations/frontend-stack-2026-09-16.md).
 *
 * The view owns no facts: the nodes and edges arrive already mapped from Canon by
 * the novel data face. What lives here is presentation — where the discs go
 * (story-map-layout), colour by faction, the cluster discs and their `+N`
 * folding, name search, dragging a character to a place of the author's choosing,
 * and the selection reducer that fades everything but the chosen character's
 * neighbourhood.
 *
 * Three seams are deliberate, because each one is a way to lose the author's work
 * or their bearings:
 * - **The camera is not reset by the layout.** Positions are re-applied through
 *   `setGraph`, so pinning one character does not throw away the zoom and pan the
 *   author had set up.
 * - **Discs are drawn in an SVG overlay, not in the graph.** sigma renders nodes
 *   and edges; the discs and their counts are chrome, so they follow the camera
 *   through `graphToViewport` instead of becoming fake nodes that can be clicked,
 *   dragged or label-collided with.
 * - **Nothing is folded silently.** The header says how much of the cast is off
 *   the web, and every `+N` names the cluster it belongs to.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { UndirectedGraph } from 'graphology'
import Sigma from 'sigma'
import type { NovelStoryMap } from './novel-data.js'
import { probeWebGL } from './webgl-probe.js'
import {
  MAP_CANVAS,
  clusterKeyOf,
  layoutStoryMap,
  type ClusterAxis,
  type MapCluster,
  type MapLayout,
  type MapPoint,
} from './story-map-layout.js'

export interface StoryMapViewProps {
  readonly map: NovelStoryMap
  /** Open one person's 人物档案 (the prototype's double-click on a node). */
  readonly onOpenPerson?: (id: string) => void
  /**
   * Where the degraded card sends an author whose machine cannot paint the map.
   * The same cast is still readable as a list, so the card is never a dead end.
   */
  readonly onOpenCast?: () => void
}

/** Faction palette: four colours plus the unaffiliated grey, both schemes legible. */
const GROUP_COLORS = ['#D97757', '#7A9E7E', '#6C7BA8', '#C08A3E'] as const
const UNAFFILIATED_COLOR = '#9A9A9A'
const FADED = '#d5d0ca'
const FADED_DARK = '#4a4644'

/** Radius of a `+N` bubble, in screen pixels: it must stay clickable at any zoom. */
const BUBBLE_RADIUS = 14

const MAP_CSS = `
[data-novel-story-map] {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  gap: 10px;
}
[data-novel-story-map] .nw-map-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
[data-novel-story-map] .nw-map-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
[data-novel-story-map] .nw-map-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
}
[data-novel-story-map] .nw-map-search input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 5px 10px;
  border: 1px solid hsl(var(--border-100));
  border-radius: 8px;
  background: hsl(var(--bg-000));
  color: inherit;
  font: inherit;
  font-size: 12px;
}
[data-novel-story-map] .nw-map-unpin {
  padding: 3px 10px;
  border: 1px dashed hsl(var(--border-100));
  border-radius: 999px;
  background: transparent;
  color: hsl(var(--text-200));
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
[data-novel-story-map] .nw-map-nomatch {
  margin: 0;
  font-size: 12px;
  color: hsl(var(--text-200));
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
/* The discs are chrome over the WebGL canvas: they may not swallow a drag.
   The width/height are explicit because an SVG is a replaced element, so inset:0
   alone leaves it at its intrinsic 300x150, and every disc then lands off-screen. */
[data-novel-story-map] .nw-map-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
[data-novel-story-map] .nw-map-disc {
  fill: hsl(var(--border-100) / .45);
  stroke: hsl(var(--border-100));
  stroke-width: 1;
}
[data-novel-story-map] .nw-map-disc-label {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: hsl(var(--text-200) / .8);
  text-anchor: middle;
}
/* The keyboard's twin of a WebGL dot. It draws nothing until it has focus, and
   it never takes a pointer event: the mouse story belongs to sigma. */
[data-novel-story-map] .nw-map-node-focus {
  fill: none;
  stroke: transparent;
  stroke-width: 2;
  pointer-events: none;
}
[data-novel-story-map] .nw-map-node-focus:focus {
  stroke: hsl(var(--accent-brand));
  stroke-width: 2.5;
}
[data-novel-story-map] .nw-map-bubble {
  fill: hsl(var(--bg-200));
  stroke: hsl(var(--border-200));
  stroke-width: 1;
  cursor: pointer;
  pointer-events: auto;
}
[data-novel-story-map] .nw-map-bubble:hover { fill: hsl(var(--bg-300)); }
[data-novel-story-map] .nw-map-bubble-text {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: hsl(var(--text-100) / .85);
  text-anchor: middle;
  pointer-events: none;
}
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
/* Where the machine cannot paint WebGL the map is not a blank stage: it says what
   happened, offers the list view that shows the same cast, and lets the author ask
   again (a second monitor, a restarted browser, a driver that came back). */
[data-novel-story-map] .nw-map-degraded {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 320px;
  padding: 16px 18px;
  border: 1px dashed hsl(var(--border-100));
  border-radius: 10px;
}
[data-novel-story-map] .nw-map-degraded-why {
  margin: 0;
  max-width: 52ch;
  font-size: 13px;
  line-height: 1.7;
  color: hsl(var(--text-100));
}
[data-novel-story-map] .nw-map-degraded-actions { display: flex; gap: 8px; }
`

/** The story map canvas. */
export function StoryMapView({ map, onOpenPerson, onOpenCast }: StoryMapViewProps): ReactNode {
  const host = useRef<HTMLDivElement | null>(null)
  const overlay = useRef<SVGSVGElement | null>(null)
  const renderer = useRef<Sigma | null>(null)
  const syncOverlay = useRef<() => void>(() => {})
  /** The layout the live graph was built from, so an unchanged one is not reapplied. */
  const applied = useRef<MapLayout | null>(null)
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [axis, setAxis] = useState<ClusterAxis>('faction')
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set<string>())
  const [pins, setPins] = useState<ReadonlyMap<string, MapPoint>>(() => new Map<string, MapPoint>())
  // Asking the machine is a render-time question, and 重试 is the author asking
  // again — so the answer is memoised against an attempt counter, not cached for
  // the life of the view.
  const [attempt, setAttempt] = useState(0)
  const paintable = useMemo(() => probeWebGL(), [attempt])
  const colours = useMemo(() => groupColours(map), [map])
  const labels = useMemo(() => new Map(map.nodes.map(node => [node.id, node.label])), [map])
  const layout = useMemo(
    () => layoutStoryMap({ map, axis, expanded, pins }),
    [map, axis, expanded, pins],
  )
  // The sigma lifecycle must not depend on the layout — rebuilding the renderer
  // would throw away the camera — so it reads the newest one through a ref.
  const latest = useRef(layout)
  latest.current = layout

  const chooseAxis = useCallback((next: ClusterAxis): void => {
    setAxis(current => {
      // Cluster names belong to one axis: keeping them across a switch would
      // expand a cluster that is no longer there, or one that now means
      // something else entirely.
      if (current !== next) setExpanded(new Set<string>())
      return next
    })
  }, [])

  // Discs, their `+N`, and the cast's accessible twin: built once per layout,
  // then kept on the camera.
  useEffect(() => {
    const svg = overlay.current
    if (svg === null) return
    svg.replaceChildren()
    const parts = layout.clusters.map(cluster => drawCluster(
      svg,
      cluster,
      id => labels.get(id) ?? id,
      () => { setExpanded(current => new Set(current).add(cluster.id)) },
    ))
    // sigma draws the cast on WebGL, where nothing is focusable and a screen
    // reader sees nothing at all. These are the same characters as real elements
    // in the overlay, sitting exactly where they are on screen — so the map can
    // be walked from the keyboard and read out loud. A character folded behind a
    // `+N` is not drawn and so is not offered; search is how the author reaches
    // one (and it opens the cluster that hid them).
    const seats: DrawnCharacter[] = []
    for (const cluster of layout.clusters) {
      for (const id of cluster.drawn) {
        const node = map.nodes.find(entry => entry.id === id)
        const at = layout.positions.get(id)
        if (node === undefined || at === undefined) continue
        seats.push(drawCharacter(svg, node, at, () => { setSelected(id) }, () => { onOpenPerson?.(id) }))
      }
    }
    let roving = 0
    const setRoving = (next: number): void => {
      roving = next
      seats.forEach((seat, index) => {
        seat.circle.setAttribute('tabindex', index === roving ? '0' : '-1')
      })
    }
    setRoving(0)

    const onKeyDown = (event: KeyboardEvent): void => {
      const active = document.activeElement
      const at = seats.findIndex(seat => seat.circle === active)
      if (at < 0) return
      if (event.key === 'Enter') {
        event.preventDefault()
        seats[at]?.select()
        return
      }
      if (event.key === 'd' || event.key === 'D') {
        event.preventDefault()
        seats[at]?.open()
        return
      }
      const step = event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
      if (step === 0) return
      event.preventDefault()
      const next = (at + step + seats.length) % seats.length
      setRoving(next)
      seats[next]?.circle.focus()
    }
    svg.addEventListener('keydown', onKeyDown)

    syncOverlay.current = () => {
      const instance = renderer.current
      if (instance === null) return
      const ratio = instance.getGraphToViewportRatio()
      for (const part of parts) {
        const centre = instance.graphToViewport({ x: part.cluster.cx, y: part.cluster.cy })
        const radius = part.cluster.r * ratio
        part.disc.setAttribute('cx', String(centre.x))
        part.disc.setAttribute('cy', String(centre.y))
        part.disc.setAttribute('r', String(radius))
        part.label.setAttribute('x', String(centre.x))
        part.label.setAttribute('y', String(centre.y - radius - 8))
        if (part.bubble !== undefined) {
          const at = instance.graphToViewport(part.bubble.at)
          part.bubble.circle.setAttribute('cx', String(at.x))
          part.bubble.circle.setAttribute('cy', String(at.y))
          part.bubble.text.setAttribute('x', String(at.x))
          part.bubble.text.setAttribute('y', String(at.y + 4))
        }
      }
      for (const seat of seats) {
        const at = instance.graphToViewport(seat.at)
        seat.circle.setAttribute('cx', String(at.x))
        seat.circle.setAttribute('cy', String(at.y))
        seat.circle.setAttribute('r', String(nodeRadius(seat.debts) * ratio + FOCUS_RING_GAP))
      }
    }
    syncOverlay.current()
    return () => {
      svg.removeEventListener('keydown', onKeyDown)
    }
  }, [layout, labels, map, onOpenPerson])

  useEffect(() => {
    const element = host.current
    // Nothing is built where nothing can be drawn: sigma with no WebGL context
    // throws on its first frame, and a thrown canvas used to take the whole seat.
    if (!paintable || element === null) return
    const instance = new Sigma(buildGraph(map, latest.current, colours), element, {
      renderEdgeLabels: true,
      labelDensity: 0.6,
      labelGridCellSize: 90,
      defaultEdgeColor: '#c4bcb2',
      defaultEdgeType: 'line',
    })
    instance.on('clickNode', ({ node }) => { setSelected(node) })
    instance.on('doubleClickNode', ({ node }) => { onOpenPerson?.(node) })
    instance.on('clickStage', () => { setSelected(undefined) })
    // Dropping a character is how the author says "this is where it belongs":
    // the position becomes a pin, and the ring stops moving it.
    instance.on('upNode', ({ node }) => {
      const dropped = instance.getGraph().getNodeAttributes(node) as { x: number; y: number }
      if (typeof dropped.x !== 'number' || typeof dropped.y !== 'number') return
      setPins(current => new Map(current).set(node, { x: dropped.x, y: dropped.y }))
    })
    instance.on('afterRender', () => { syncOverlay.current() })
    renderer.current = instance
    applied.current = latest.current
    syncOverlay.current()
    return () => {
      renderer.current = null
      instance.kill()
    }
  }, [map, colours, onOpenPerson, paintable])

  // Re-lay the graph without recreating the renderer, so pinning or expanding
  // one cluster leaves the author's zoom and pan where they were.
  useEffect(() => {
    const instance = renderer.current
    if (instance === null || applied.current === layout) return
    applied.current = layout
    instance.setGraph(buildGraph(map, layout, colours))
    syncOverlay.current()
  }, [layout, map, colours])

  // Search is focus, not filtering: the match becomes the selection, which is the
  // same fade-and-card path a click uses.
  useEffect(() => {
    if (search.trim() === '') {
      setSelected(undefined)
      return
    }
    const first = matches(map, search)[0]
    setSelected(first?.id)
    // A folded character is off the graph, so focusing one has to open the
    // cluster that hid them before the author can see who they searched for.
    if (first === undefined || !layout.hidden.includes(first.id)) return
    const key = clusterKeyOf(first, axis)
    // Same set when the key is already open: a fresh one would re-render for
    // nothing, and this effect keys off the layout it would change.
    setExpanded(current => current.has(key) ? current : new Set(current).add(key))
  }, [search, map, axis, layout])

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
  const folded = layout.hidden.length
  const hits = search.trim() === '' ? [] : matches(map, search)

  return (
    <div
      data-novel-story-map=""
      data-novel-story-map-people={map.nodes.length}
      data-novel-story-map-clusters={layout.clusters.length}
      data-novel-story-map-folded={folded}
    >
      <style>{MAP_CSS}</style>
      <header className="nw-map-header">
        <h2 className="nw-map-title">故事地图</h2>
        <span className="nw-map-meta">
          {`R${String(map.revision)} · ${String(map.nodes.length)} 个人物 · ${String(map.edges.length)} 条关系`}
          {folded > 0 ? ` · 折叠 ${String(folded)} 位` : ''}
        </span>
      </header>
      {map.nodes.length === 0
        ? <p className="nw-map-empty">还没有人物与关系设定</p>
        : !paintable
          ? (
              <div className="nw-map-degraded" data-novel-story-map-degraded="" role="alert">
                <p className="nw-map-degraded-why">
                  {`这台机器没能给出可以画图的 WebGL 环境，所以 ${String(map.nodes.length)} 个人物的关系图画不出来。人物与关系本身没有问题——换「人物与关系」用列表看同一批人，或者换一个浏览器再试。`}
                </p>
                <div className="nw-map-degraded-actions">
                  <button
                    type="button"
                    className="btn sm"
                    data-novel-story-map-degraded-cast=""
                    onClick={() => { onOpenCast?.() }}
                  >
                    去人物与关系
                  </button>
                  <button
                    type="button"
                    className="btn sm"
                    data-novel-story-map-degraded-retry=""
                    onClick={() => { setAttempt(current => current + 1) }}
                  >
                    重试
                  </button>
                </div>
              </div>
            )
          : (
              <>
              <div className="nw-map-bar">
                <div className="nw-map-search">
                  <input
                    type="search"
                    data-novel-story-map-search=""
                    aria-label="按名字定位人物"
                    placeholder="按名字定位人物"
                    value={search}
                    onChange={event => { setSearch(event.target.value) }}
                  />
                  {search.trim() !== '' && (
                    <span className="nw-map-meta">{`${String(hits.length)} 处匹配`}</span>
                  )}
                </div>
                <div className="seg" role="group" aria-label="分簇方式" data-novel-story-map-axis={axis}>
                  <button
                    type="button"
                    data-novel-story-map-axis-option="faction"
                    aria-pressed={axis === 'faction'}
                    onClick={() => { chooseAxis('faction') }}
                  >
                    按势力分簇
                  </button>
                  <button
                    type="button"
                    data-novel-story-map-axis-option="place"
                    aria-pressed={axis === 'place'}
                    onClick={() => { chooseAxis('place') }}
                  >
                    按地点分布
                  </button>
                </div>
                {pins.size > 0 && (
                  <button
                    type="button"
                    className="nw-map-unpin"
                    data-novel-story-map-unpin=""
                    onClick={() => { setPins(new Map<string, MapPoint>()) }}
                  >
                    {`解除全部钉位（${String(pins.size)}）`}
                  </button>
                )}
              </div>
              <div className="nw-map-stage">
                <div className="nw-map-canvas" ref={host} data-novel-story-map-canvas="" />
                <svg
                  className="nw-map-overlay"
                  ref={overlay}
                  data-novel-story-map-overlay=""
                  role="group"
                  aria-label="故事地图上的人物"
                />
                {chosen !== undefined && (
                  <div className="nw-map-selection" data-novel-story-map-selection={chosen.id}>
                    <strong>{chosen.label}</strong>
                    <span>
                      {chosen.group === undefined ? ' · 无势力' : ` · ${chosen.group}`}
                      {chosen.place === undefined ? '' : ` · ${chosen.place}`}
                      {chosen.debts > 0 ? ` · ${String(chosen.debts)} 条未收束关系债务` : ''}
                    </span>
                  </div>
                )}
              </div>
              {search.trim() !== '' && hits.length === 0 && (
                <p className="nw-map-nomatch" data-novel-story-map-nomatch="">
                  没有匹配的人物。
                </p>
              )}
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

interface DrawnCluster {
  readonly cluster: MapCluster
  readonly disc: SVGCircleElement
  readonly label: SVGTextElement
  readonly bubble: {
    readonly at: MapPoint
    readonly circle: SVGCircleElement
    readonly text: SVGTextElement
  } | undefined
}

/**
 * One disc, its label and its `+N`, created imperatively because they have to be
 * rewritten from the camera on every frame — React would re-render the tree
 * sixty times a second to do the same thing.
 */
function drawCluster(
  svg: SVGSVGElement,
  cluster: MapCluster,
  labelOf: (id: string) => string,
  onExpand: () => void,
): DrawnCluster {
  const group = document.createElementNS(SVG_NS, 'g')
  group.setAttribute('data-novel-story-map-cluster', cluster.id)
  if (cluster.bubble !== undefined) {
    group.setAttribute('data-novel-story-map-bubble', cluster.id)
  }
  const disc = document.createElementNS(SVG_NS, 'circle')
  disc.setAttribute('class', 'nw-map-disc')
  disc.setAttribute('aria-hidden', 'true')
  group.append(disc)
  const label = document.createElementNS(SVG_NS, 'text')
  label.setAttribute('class', 'nw-map-disc-label')
  label.setAttribute('aria-hidden', 'true')
  label.textContent = cluster.label
  group.append(label)
  if (cluster.bubble === undefined) {
    svg.append(group)
    return { cluster, disc, label, bubble: undefined }
  }
  // A count alone leaves the author guessing who is missing, so the bubble says
  // who it is holding — the same thing the prototype's chip did with its title.
  const hidden = cluster.bubble.ids.map(labelOf).join('、')
  const bubble = document.createElementNS(SVG_NS, 'circle')
  bubble.setAttribute('class', 'nw-map-bubble')
  bubble.setAttribute('r', String(BUBBLE_RADIUS))
  bubble.setAttribute('role', 'button')
  bubble.setAttribute('aria-label', `${cluster.label}：还有 ${String(cluster.bubble.n)} 位未展开（${hidden}）`)
  bubble.append(document.createElementNS(SVG_NS, 'title'))
  bubble.querySelector('title')!.textContent = hidden
  bubble.addEventListener('click', onExpand)
  group.append(bubble)
  const text = document.createElementNS(SVG_NS, 'text')
  text.setAttribute('class', 'nw-map-bubble-text')
  text.textContent = `+${String(cluster.bubble.n)}`
  group.append(text)
  svg.append(group)
  return { cluster, disc, label, bubble: { at: { x: cluster.bubble.x, y: cluster.bubble.y }, circle: bubble, text } }
}

const SVG_NS = 'http://www.w3.org/2000/svg'

/** How far outside the drawn dot the focus ring sits, in screen pixels. */
const FOCUS_RING_GAP = 5

/** A drawn character's dot radius in graph units, sized by its open debts. */
function nodeRadius(debts: number): number {
  return 7 + Math.min(debts, 3) * 2
}

interface DrawnCharacter {
  readonly id: string
  readonly debts: number
  readonly at: MapPoint
  readonly circle: SVGCircleElement
  readonly select: () => void
  readonly open: () => void
}

/**
 * One character as a real, focusable element over the WebGL canvas.
 *
 * `pointer-events: none` keeps the mouse story exactly as it was — dragging a
 * character to pin it still reaches sigma, and the overlay still swallows
 * nothing — while Tab and the arrow keys can still land on it.
 */
function drawCharacter(
  svg: SVGSVGElement,
  node: NovelStoryMap['nodes'][number],
  at: MapPoint,
  select: () => void,
  open: () => void,
): DrawnCharacter {
  const circle = document.createElementNS(SVG_NS, 'circle')
  circle.setAttribute('class', 'nw-map-node-focus')
  circle.setAttribute('data-novel-story-map-node', node.id)
  circle.setAttribute('role', 'button')
  circle.setAttribute('aria-label', node.label)
  circle.setAttribute('tabindex', '-1')
  svg.append(circle)
  return { id: node.id, debts: node.debts, at, circle, select, open }
}

/** Characters whose accepted name or id carries the query. */
function matches(map: NovelStoryMap, query: string): NovelStoryMap['nodes'] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []
  return map.nodes.filter(node =>
    node.label.toLowerCase().includes(needle) || node.id.toLowerCase().includes(needle))
}

function buildGraph(
  map: NovelStoryMap,
  layout: MapLayout,
  colours: ReadonlyMap<string, string>,
): UndirectedGraph {
  const graph = new UndirectedGraph({ multi: false })
  // sigma fits the nodes it is handed, and a disc is wider than the members it
  // holds, so the two framing anchors sit on the layout's own content box. They
  // carry no label (a label would enter the label grid and hide a real one) and
  // no size, so they draw nothing and cannot be hit, clicked or dragged.
  const bounds = layout.bounds ?? { minX: 0, minY: 0, maxX: MAP_CANVAS.w, maxY: MAP_CANVAS.h }
  graph.addNode(EXTENT_ANCHORS[0], { x: bounds.minX, y: bounds.minY, size: 0, color: 'transparent' })
  graph.addNode(EXTENT_ANCHORS[1], { x: bounds.maxX, y: bounds.maxY, size: 0, color: 'transparent' })
  const hidden = new Set(layout.hidden)
  for (const node of map.nodes) {
    if (hidden.has(node.id)) continue
    const at = layout.positions.get(node.id) ?? { x: 0, y: 0 }
    graph.addNode(node.id, {
      x: at.x,
      y: at.y,
      label: node.label,
      size: nodeRadius(node.debts),
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

/** Reserved graph ids of the two framing anchors; Canon ids never look like this. */
const EXTENT_ANCHORS = ['__nw-extent-0', '__nw-extent-1'] as const

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
