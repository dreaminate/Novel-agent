// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * I-P1: the story map goes back to force-directed layout, the way it was before
 * 2026-09-17's cluster-disc detour. The detour was a pure function that placed
 * every character on a deterministic ring; Obsidian's graph view (the benchmark)
 * is force-directed, and the detour made a 40-node cast collapse into a hairball
 * the moment the rings ran out of room.
 *
 * These specs hold the three behaviours the detour could not provide:
 * - Node size scales with degree, so a character who carries the web reads
 *   larger than a leaf. The detour's `nodeRadius` capped at 13px for a
 *   degree-3 node and started at 7px for a leaf — 13 < 2×7, so the headline
 *   of the cast was barely twice the footnote.
 * - Pins survive a reload. The detour kept pins in component state, which a
 *   reload threw away; the author's "this is where it belongs" was lost.
 * - Hovering a node highlights its neighbourhood. The detour only reacted to
 *   a click; Obsidian reacts to hover, which is the gesture an author makes
 *   before they decide to click.
 *
 * The fourth RED assertion (filter by volume/arc) is blocked: Canon's
 * `manuscriptOrder` is null for every story event in this build, so the filter
 * would change nothing. See frontend-stack-2026-09-16.md §5 supplement.
 */
const probe = vi.hoisted(() => ({ ok: true }))
vi.mock('../src/client/webgl-probe.js', () => ({ probeWebGL: () => probe.ok }))

/**
 * The sigma mock records the node sizes and the reducers it was handed, so a
 * test can assert what the author would see without WebGL. Position assertions
 * read the graph the constructor received.
 */
const sigmaMock = vi.hoisted(() => ({
  instances: [] as {
    graph: {
      order: number
      size: number
      nodes(): string[]
      getNodeAttributes(id: string): { x: number; y: number; size: number; color: string; label?: string }
    }
    killed: boolean
    handlers: Map<string, (payload: { node: string }) => void>
    settings: Map<string, unknown>
    setSetting(name: string, value: unknown): void
    getSetting(name: string): unknown
    graphToViewport(point: { x: number; y: number }): { x: number; y: number }
    getGraphToViewportRatio(): number
    kill(): void
  }[],
}))

vi.mock('sigma', () => ({
  default: class {
    graph: {
      order: number
      size: number
      nodes(): string[]
      getNodeAttributes(id: string): { x: number; y: number; size: number; color: string; label?: string }
    }
    killed = false
    readonly handlers = new Map<string, (payload: { node: string }) => void>()
    readonly settings = new Map<string, unknown>()

    constructor(graph: sigmaMock['instances'][number]['graph']) {
      this.graph = graph
      sigmaMock.instances.push(this as never)
    }

    on(name: string, handler: (payload: { node: string }) => void): void {
      this.handlers.set(name, handler)
    }

    setGraph(graph: sigmaMock['instances'][number]['graph']): void {
      this.graph = graph
    }

    setSetting(name: string, value: unknown): void {
      this.settings.set(name, value)
    }

    getSetting(name: string): unknown {
      return this.settings.get(name)
    }

    getGraph(): unknown {
      return this.graph
    }

    graphToViewport(point: { x: number; y: number }): { x: number; y: number } {
      return point
    }

    getGraphToViewportRatio(): number {
      return 1
    }

    kill(): void {
      this.killed = true
    }
  },
}))

const works = [{
  workspaceId: 'ws-mist',
  path: '/books/mist-harbor',
  title: '雾港夜航：第七码头',
  sessionIds: ['s-6'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}]

const mounted: { root: Root; container: HTMLElement }[] = []

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => { entry.root.unmount() })
    entry.container.remove()
  }
  const { resetWorkbench } = await import('../src/client/store.js')
  resetWorkbench()
  sigmaMock.instances.length = 0
})

async function mountMap(loadStoryMap: ReturnType<typeof vi.fn>) {
  const { NovelCanvas } = await import('../src/client/NovelCanvas.js') as {
    NovelCanvas: (props: Record<string, unknown>) => unknown
  }
  const { workbenchActions } = await import('../src/client/store.js') as {
    workbenchActions: { setView(view: string): void }
  }
  workbenchActions.setView('map')

  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(createElement(NovelCanvas as never, {
      sessionId: 's-6',
      useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: works }),
      useSessions: (selector: (value: unknown) => unknown) => selector({
        jobsBySession: {},
        subagentsByParent: {},
      }),
      loadOutline: vi.fn(),
      loadStoryMap,
      loadCast: vi.fn(async () => undefined),
      openThread: vi.fn(),
      newThread: vi.fn(),
    } as never))
  })
  await act(async () => {})
  await act(async () => {})
  mounted.push({ root, container })
  return { container, root }
}

/** A cast where one character carries the web and one does not. */
function loadStoryMapWithDegrees() {
  return vi.fn(async () => ({
    revision: 5,
    nodes: [
      // chen-mo connects to three others — the web's centre.
      { id: 'chen-mo', label: '陈默', group: '港务局', place: undefined, debts: 3 },
      { id: 'zhou-yan', label: '周砚', group: '雾灯帮', place: undefined, debts: 1 },
      { id: 'lin-qing', label: '林青', group: '港务局', place: undefined, debts: 1 },
      { id: 'ye-feng', label: '叶峰', group: '雾灯帮', place: undefined, debts: 1 },
      // solo is a leaf — degree zero.
      { id: 'solo', label: '码头看门人', group: undefined, place: undefined, debts: 0 },
    ],
    edges: [
      { id: 'e1', source: 'chen-mo', target: 'zhou-yan', label: '旧同僚', turns: 1 },
      { id: 'e2', source: 'chen-mo', target: 'lin-qing', label: '同事', turns: 1 },
      { id: 'e3', source: 'chen-mo', target: 'ye-feng', label: '对手', turns: 1 },
    ],
  }))
}

describe('novel-mode story map force layout (I-P1)', () => {
  it('scales node size with degree, so a web centre reads at least twice a leaf', async () => {
    await mountMap(loadStoryMapWithDegrees())

    const instance = sigmaMock.instances[sigmaMock.instances.length - 1]
    expect(instance).toBeDefined()
    const sizes = new Map<string, number>()
    for (const id of instance!.graph.nodes()) {
      if (id.startsWith('__nw-extent-')) continue
      sizes.set(id, instance!.graph.getNodeAttributes(id).size)
    }

    // The web centre (degree 3) must be at least twice the leaf (degree 0).
    const centre = sizes.get('chen-mo') ?? 0
    const leaf = sizes.get('solo') ?? 0
    expect(centre).toBeGreaterThanOrEqual(2 * leaf)
  })

  it('keeps a pinned character across a reload (mapPins in prefs)', async () => {
    await mountMap(loadStoryMapWithDegrees())

    const instance = sigmaMock.instances[sigmaMock.instances.length - 1]
    expect(instance?.handlers.has('upNode')).toBe(true)
    // Drop chen-mo somewhere the author chose.
    instance!.graph.getNodeAttributes = (id: string) =>
      id === 'chen-mo'
        ? { x: 123, y: 456, size: 10, color: '', label: '陈默' }
        : { x: 0, y: 0, size: 5, color: '', label: '' }
    await act(async () => {
      instance?.handlers.get('upNode')?.({ node: 'chen-mo' })
    })
    await act(async () => {})

    // The pin must leave the component and enter persisted state.
    const { dehydrateWorkbench, hydrateWorkbench } = await import('../src/client/store.js')
    const persisted = dehydrateWorkbench((await import('../src/client/store.js')).getWorkbenchState())
    const restored = hydrateWorkbench(persisted)
    expect(restored.mapPins).toBeInstanceOf(Map)
    expect(restored.mapPins?.get('chen-mo')).toEqual({ x: 123, y: 456 })
  })

  it('highlights a hovered node\'s neighbourhood and fades the rest', async () => {
    await mountMap(loadStoryMapWithDegrees())

    const instance = sigmaMock.instances[sigmaMock.instances.length - 1]
    expect(instance?.handlers.has('enterNode')).toBe(true)
    await act(async () => {
      instance?.handlers.get('enterNode')?.({ node: 'chen-mo' })
    })
    await act(async () => {})

    // A node reducer that fades non-neighbours is the Obsidian gesture: the
    // hovered node and its neighbours stay, the rest dim.
    const reducer = instance?.getSetting('nodeReducer') as
      | ((node: string, data: { color?: string; label?: string }) => unknown)
      | null
    expect(typeof reducer).toBe('function')
    // chen-mo and its three neighbours stay bright; solo (a leaf with no edge
    // to chen-mo) is faded.
    const fadedSolo = reducer?.('solo', { color: '#fff', label: '码头看门人' }) as { color?: string }
    expect(fadedSolo?.color).not.toBe('#fff')
    const brightCentre = reducer?.('chen-mo', { color: '#fff', label: '陈默' }) as { color?: string }
    expect(brightCentre?.color).toBe('#fff')
  })

  it('restores hover when the pointer leaves the node', async () => {
    await mountMap(loadStoryMapWithDegrees())

    const instance = sigmaMock.instances[sigmaMock.instances.length - 1]
    await act(async () => {
      instance?.handlers.get('enterNode')?.({ node: 'chen-mo' })
    })
    await act(async () => {})
    expect(instance?.getSetting('nodeReducer')).not.toBeNull()

    // Leaving the node clears the reducer, so the map returns to its resting state.
    expect(instance?.handlers.has('leaveNode')).toBe(true)
    await act(async () => {
      instance?.handlers.get('leaveNode')?.({ node: 'chen-mo' })
    })
    await act(async () => {})
    expect(instance?.getSetting('nodeReducer')).toBeNull()
  })
})
