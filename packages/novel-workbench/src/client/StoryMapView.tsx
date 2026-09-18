/**
 * 故事地图: the accepted cast and their relationships, drawn with sigma.js over a
 * graphology graph (both MIT; see docs/open-source-evaluations/frontend-stack-2026-09-16.md).
 *
 * The view owns no facts: the nodes and edges arrive already mapped from Canon by
 * the novel data face. What lives here is presentation — where the nodes go
 * (force-directed, the way Obsidian's graph view places them), colour by faction,
 * name search, dragging a character to a place of the author's choosing, and the
 * selection/hover reducer that fades everything but the chosen character's
 * neighbourhood.
 *
 * The 2026-09-17 cluster-disc detour placed every character on a deterministic
 * ring; it collapsed a 40-node cast into a hairball the moment the rings ran out
 * of room. The force-directed layout (graphology-layout-forceatlas2) returns here,
 * with circular.assign as the deterministic starting ring forceAtlas2 needs.
 *
 * Three seams are deliberate, because each one is a way to lose the author's work
 * or their bearings:
 * - **The camera is not reset by the layout.** Positions are re-applied through
 *   `setGraph`, so pinning one character does not throw away the zoom and pan the
 *   author had set up.
 * - **Pins come from the workbench store, not component state.** "This is where
 *   it belongs" is the author's edit to the map, and it survives a reload.
 * - **Nothing is folded silently.** Every character the map knows about is drawn;
 *   the header says how many there are.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { UndirectedGraph } from 'graphology'
import Sigma from 'sigma'
import { circular } from 'graphology-layout'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { NovelStoryMap } from './novel-data.js'
import { probeWebGL } from './webgl-probe.js'
import { useWorkbenchState, workbenchActions } from './store.js'

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
/* The overlay is chrome over the WebGL canvas: it may not swallow a drag.
   The width/height are explicit because an SVG is a replaced element, so inset:0
   alone leaves it at its intrinsic 300x150, and every focus ring then lands off-screen. */
[data-novel-story-map] .nw-map-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
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
/* The hover glow: Obsidian's graph view highlights a node's neighbourhood on
   hover, and the node itself gains a purple halo. The product's global accent
   is orange, so the graph's hover halo uses the Obsidian brand purple as a
   graph-specific token (A12 allows surface-specific tokens alongside the
   global ones). */
[data-novel-story-map] .nw-map-node-hovered {
  stroke: #7C3AED;
  stroke-width: 3;
  filter: drop-shadow(0 0 4px rgba(124, 58, 237, 0.4));
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

/** A graph-space point the renderer places a character at. */
interface MapPoint {
  readonly x: number
  readonly y: number
}

/** The story map canvas. */
export function StoryMapView({ map, onOpenPerson, onOpenCast }: StoryMapViewProps): ReactNode {
  const workbench = useWorkbenchState()
  const host = useRef<HTMLDivElement | null>(null)
  const overlay = useRef<SVGSVGElement | null>(null)
  const renderer = useRef<Sigma | null>(null)
  const syncOverlay = useRef<() => void>(() => {})
  const [selected, setSelected] = useState<string | undefined>(undefined)
  /**
   * The node the pointer is hovering over, if any. Obsidian's graph view
   * highlights a node's neighbourhood on hover — the gesture an author makes
   * *before* they decide to click — and the map now does the same.
   */
  const [hovered, setHovered] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  /**
   * Pins come from the workbench store now, so they survive a reload: "this is
   * where it belongs" is the author's edit to the map, not a transient view
   * state. The canvas reads the slice the store owns and writes back through
   * {@link workbenchActions.setMapPin}.
   */
  const pins: ReadonlyMap<string, MapPoint> = workbench.mapPins
  // Asking the machine is a render-time question, and 重试 is the author asking
  // again — so the answer is memoised against an attempt counter, not cached for
  // the life of the view.
  const [attempt, setAttempt] = useState(0)
  const paintable = useMemo(() => probeWebGL(), [attempt])
  const colours = useMemo(() => groupColours(map), [map])
  const labels = useMemo(() => new Map(map.nodes.map(node => [node.id, node.label])), [map])

  /**
   * The force-directed layout: circular.assign gives every node a deterministic
   * starting position (forceAtlas2 needs numerical x/y to begin), then forceAtlas2
   * runs N iterations of repulsion, attraction and gravity. Pins the author set
   * override the computed position, so "this is where it belongs" holds.
   *
   * The layout is a pure function of the map and the pins — it does not touch
   * WebGL — so it can be memoised and tested without a renderer.
   */
  const positions = useMemo<ReadonlyMap<string, MapPoint>>(() => {
    const graph = new UndirectedGraph()
    for (const node of map.nodes) {
      graph.addNode(node.id, { x: 0, y: 0, label: node.label, size: nodeRadius(node.debts) })
    }
    for (const edge of map.edges) {
      if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue
      if (graph.hasEdge(edge.source, edge.target)) continue
      graph.addEdge(edge.source, edge.target, { weight: 1 + Math.min(edge.turns, 4) })
    }
    // A deterministic starting ring: forceAtlas2 only refines positions, so
    // without this every node starts at (0,0) and the first iteration collapses
    // them onto a point.
    circular.assign(graph, { scale: 100 })
    forceAtlas2.assign(graph, {
      settings: forceAtlas2.inferSettings(graph),
      iterations: 80,
    })
    const result = new Map<string, MapPoint>()
    for (const node of map.nodes) {
      const attrs = graph.getNodeAttributes(node.id)
      const pinned = pins.get(node.id)
      result.set(node.id, pinned ?? { x: attrs.x, y: attrs.y })
    }
    return result
  }, [map, pins])

  // The sigma lifecycle must not depend on the layout — rebuilding the renderer
  // would throw away the camera — so it reads the newest one through a ref.
  const latest = useRef(positions)
  latest.current = positions

  // The accessible twin of the cast: one focusable element per drawn character,
  // sitting exactly where it is on screen. Built once per layout, then kept on
  // the camera.
  useEffect(() => {
    const svg = overlay.current
    if (svg === null) return
    svg.replaceChildren()
    const seats: DrawnCharacter[] = []
    for (const node of map.nodes) {
      const at = positions.get(node.id)
      if (at === undefined) continue
      seats.push(drawCharacter(svg, node, at, () => { setSelected(node.id) }, () => { onOpenPerson?.(node.id) }))
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
  }, [positions, labels, map, onOpenPerson])

  useEffect(() => {
    const element = host.current
    // Nothing is built where nothing can be drawn: sigma with no WebGL context
    // throws on its first frame, and a thrown canvas used to take the whole seat.
    if (!paintable || element === null) return
    const instance = new Sigma(buildGraph(map, latest.current, colours), element, {
      renderEdgeLabels: true,
      labelDensity: 0.6,
      labelGridCellSize: 90,
      // Obsidian's edges are a translucent grey that does not compete with the
      // nodes; the warm #c4bcb2 the cluster-disc detour used was the product's
      // rail colour, which made a dense web read as a single warm mass.
      defaultEdgeColor: 'rgba(128, 128, 128, 0.25)',
      defaultEdgeType: 'line',
    })
    instance.on('clickNode', ({ node }) => { setSelected(node) })
    instance.on('doubleClickNode', ({ node }) => { onOpenPerson?.(node) })
    instance.on('clickStage', () => { setSelected(undefined) })
    // Dropping a character is how the author says "this is where it belongs":
    // the position becomes a pin, and the ring stops moving it. The pin is
    // written to the workbench store, so it outlives a reload.
    instance.on('upNode', ({ node }) => {
      const dropped = instance.getGraph().getNodeAttributes(node) as { x: number; y: number }
      if (typeof dropped.x !== 'number' || typeof dropped.y !== 'number') return
      workbenchActions.setMapPin(node, { x: dropped.x, y: dropped.y })
    })
    instance.on('enterNode', ({ node }) => { setHovered(node) })
    instance.on('leaveNode', () => { setHovered(undefined) })
    instance.on('afterRender', () => { syncOverlay.current() })
    renderer.current = instance
    syncOverlay.current()
    return () => {
      renderer.current = null
      instance.kill()
    }
  }, [map, colours, onOpenPerson, paintable])

  // Re-lay the graph without recreating the renderer, so pinning one character
  // leaves the author's zoom and pan where they were.
  useEffect(() => {
    const instance = renderer.current
    if (instance === null) return
    instance.setGraph(buildGraph(map, positions, colours))
    syncOverlay.current()
  }, [positions, map, colours])

  // Search is focus, not filtering: the match becomes the selection, which is the
  // same fade-and-card path a click uses.
  useEffect(() => {
    if (search.trim() === '') {
      setSelected(undefined)
      return
    }
    const first = matches(map, search)[0]
    setSelected(first?.id)
  }, [search, map])

  useEffect(() => {
    const instance = renderer.current
    if (instance === null) return
    // Hover takes precedence over click: the author's pointer is the gesture
    // they make before they decide, and Obsidian's graph view highlights a
    // node's neighbourhood on hover. A click still holds when the pointer
    // leaves — selection is a state, hover is a moment.
    const focus = hovered ?? selected
    if (focus === undefined) {
      instance.setSetting('nodeReducer', null)
      instance.setSetting('edgeReducer', null)
      return
    }
    const related = new Set<string>([focus])
    for (const edge of map.edges) {
      if (edge.source === focus) related.add(edge.target)
      if (edge.target === focus) related.add(edge.source)
    }
    const faded = document.body.dataset['dsDarkTheme'] === undefined ? FADED : FADED_DARK
    instance.setSetting('nodeReducer', (node, data) =>
      related.has(node) ? { ...data, zIndex: 2 } : { ...data, color: faded, label: '' })
    instance.setSetting('edgeReducer', (edge, data) => {
      const [source, target] = instance.getGraph().extremities(edge)
      return source === focus || target === focus
        ? { ...data, zIndex: 2 }
        : { ...data, color: faded, label: '' }
    })
  }, [hovered, selected, map])

  // The hover halo: toggle a class on the overlay circle so the SVG filter
  // (drop-shadow) gives the hovered node a purple glow. This is separate from
  // the reducer above because the reducer dims the *non*-neighbours; the halo
  // brightens the *hovered* node.
  useEffect(() => {
    const svg = overlay.current
    if (svg === null) return
    svg.querySelectorAll('.nw-map-node-focus').forEach(circle => {
      const id = circle.getAttribute('data-novel-story-map-node')
      circle.classList.toggle('nw-map-node-hovered', id === hovered)
    })
  }, [hovered])

  const chosen = map.nodes.find(node => node.id === selected)
  const hits = search.trim() === '' ? [] : matches(map, search)

  return (
    <div
      data-novel-story-map=""
      data-novel-story-map-people={map.nodes.length}
    >
      <style>{MAP_CSS}</style>
      <header className="nw-map-header">
        <h2 className="nw-map-title">故事地图</h2>
        <span className="nw-map-meta">
          {`R${String(map.revision)} · ${String(map.nodes.length)} 个人物 · ${String(map.edges.length)} 条关系`}
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
                {pins.size > 0 && (
                  <button
                    type="button"
                    className="nw-map-unpin"
                    data-novel-story-map-unpin=""
                    onClick={() => { workbenchActions.clearMapPins() }}
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
  positions: ReadonlyMap<string, MapPoint>,
  colours: ReadonlyMap<string, string>,
): UndirectedGraph {
  const graph = new UndirectedGraph({ multi: false })
  // Two framing anchors on the layout's content box, so sigma frames the whole
  // cast rather than a tight fit that would cut labels off. They carry no label
  // and no size, so they draw nothing and cannot be hit, clicked or dragged.
  const xs = [...positions.values()].map(p => p.x)
  const ys = [...positions.values()].map(p => p.y)
  const minX = xs.length > 0 ? Math.min(...xs) : 0
  const maxX = xs.length > 0 ? Math.max(...xs) : 100
  const minY = ys.length > 0 ? Math.min(...ys) : 0
  const maxY = ys.length > 0 ? Math.max(...ys) : 100
  graph.addNode(EXTENT_ANCHORS[0], { x: minX, y: minY, size: 0, color: 'transparent' })
  graph.addNode(EXTENT_ANCHORS[1], { x: maxX, y: maxY, size: 0, color: 'transparent' })
  for (const node of map.nodes) {
    const at = positions.get(node.id) ?? { x: 0, y: 0 }
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

/** How far outside the drawn dot the focus ring sits, in screen pixels. */
const FOCUS_RING_GAP = 5

const SVG_NS = 'http://www.w3.org/2000/svg'

const UNAFFILIATED = '无势力'

/**
 * A drawn character's dot radius in graph units, sized by its open debts.
 *
 * The degree scales the radius so a character who carries the web reads larger
 * than a leaf: Obsidian's graph view does the same, and the cluster-disc
 * detour's cap (13px for a degree-3 node against 7px for a leaf) left the
 * headline of the cast barely twice the footnote. The multiplier is chosen so
 * a degree-3 centre is at least twice a degree-0 leaf.
 */
function nodeRadius(debts: number): number {
  return 5 + Math.min(debts, 3) * 3
}

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
