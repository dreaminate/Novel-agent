// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NovelCanonProjection, NovelRelationshipProjection } from '@novel-agent/novel-project/types'
import { buildStoryMap } from '../src/client/novel-data.js'

/**
 * The map only paints where WebGL does, and jsdom has none. Every test here is
 * about what the map draws once it can draw, so the probe answers yes by default;
 * the degraded path is exercised by its own test with the probe turned off.
 */
const probe = vi.hoisted(() => ({ ok: true }))
vi.mock('../src/client/webgl-probe.js', () => ({ probeWebGL: () => probe.ok }))

/** Renderer stand-in: sigma needs WebGL, the mapping and wiring do not. */
const sigmaMock = vi.hoisted(() => ({
  instances: [] as {
    graph: { order: number; size: number; nodes(): string[]; getNodeAttributes(id: string): { x: number; y: number } }
    killed: boolean
    handlers: Map<string, (payload: { node: string }) => void>
  }[],
}))

vi.mock('sigma', () => ({
  default: class {
    graph: { order: number; size: number; nodes(): string[]; getNodeAttributes(id: string): { x: number; y: number } }
    killed = false
    readonly handlers = new Map<string, (payload: { node: string }) => void>()

    constructor(graph: { order: number; size: number; nodes(): string[]; getNodeAttributes(id: string): { x: number; y: number } }) {
      this.graph = graph
      sigmaMock.instances.push(this)
    }

    /** Record the events the view subscribes to so a test can fire them. */
    on(name: string, handler: (payload: { node: string }) => void): void {
      this.handlers.set(name, handler)
    }

    setGraph(graph: { order: number; size: number }): void {
      this.graph = graph
    }

    setSetting(): void {}

    getGraph(): unknown {
      return this.graph
    }

    /** The overlay follows the camera through these two; identity keeps the maths out. */
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

const provenance = {
  taskId: 'task-1',
  sessionId: 'session-1',
  producer: 'proposal',
}

function character(id: string, name: string, faction: string) {
  return {
    kind: 'character-state',
    targetId: id,
    fields: { name, faction },
    fieldSources: {},
    sourceRevision: 5,
    sourceDeltaId: `delta-${id}`,
    sourceAnchorIds: [],
    provenance,
  }
}

/** One accepted story event, which is where a character's place comes from. */
function storyEvent(id: string, participants: string[], location: string, startOrder: number) {
  return {
    kind: 'story-event',
    targetId: id,
    fields: {
      event: {
        storyTime: { startOrder, label: `事件 ${id}` },
        manuscriptOrder: 1,
        participants,
        location,
      },
    },
    fieldSources: {},
    sourceRevision: 5,
    sourceDeltaId: `delta-${id}`,
    sourceAnchorIds: [],
    provenance,
  }
}

const canon = {
  projectId: 'project-mist',
  workspaceId: 'ws-mist',
  revision: 5,
  facts: [],
  entities: [
    character('chen-mo', '陈默', '港务局'),
    character('zhou-yan', '周砚', '雾灯帮'),
    storyEvent('event-dock', ['zhou-yan'], '雾灯码头', 10),
    storyEvent('event-harbour', ['chen-mo'], '港务局大楼', 20),
  ],
} as unknown as NovelCanonProjection

const relationships = {
  projectId: 'project-mist',
  workspaceId: 'ws-mist',
  revision: 5,
  relationships: [{
    line: 'chen-mo <-> zhou-yan',
    participants: ['chen-mo', 'zhou-yan'],
    directions: [
      {
        pair: 'chen-mo->zhou-yan',
        from: 'chen-mo',
        to: 'zhou-yan',
        fields: {
          'line-state': {
            form: '旧同僚',
            stage: '试探',
            turns: [{ turnId: 't1' }],
            unresolvedDebts: ['那张货单'],
          },
        },
        fieldSources: {},
        sourceRevision: 5,
        sourceDeltaId: 'delta-rel-1',
        sourceAnchorIds: [],
        provenance,
      },
      {
        pair: 'zhou-yan->chen-mo',
        from: 'zhou-yan',
        to: 'chen-mo',
        fields: {
          'line-state': {
            form: '旧同僚',
            stage: '戒备',
            turns: [],
            unresolvedDebts: [],
          },
        },
        fieldSources: {},
        sourceRevision: 5,
        sourceDeltaId: 'delta-rel-2',
        sourceAnchorIds: [],
        provenance,
      },
    ],
  }],
  orphans: [],
} as unknown as NovelRelationshipProjection

const works = [{
  workspaceId: 'ws-mist',
  path: '/books/mist-harbor',
  title: '雾港夜航：第七码头',
  sessionIds: ['s-6'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}]

/** Mount the map view over one fixture map, the way the canvas does. */
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
      // The degraded card's way out is 人物与关系, so a test that takes it lands on
      // the cast canvas — which reads this. It resolves to nothing here: what is
      // under test is that the author was sent there, not what the board draws.
      loadCast: vi.fn(async () => undefined),
      openThread: vi.fn(),
      newThread: vi.fn(),
    } as never))
  })
  await act(async () => {})
  return { container, root }
}

/** How many characters the renderer was handed, ignoring the framing anchors. */
function drawnCast(instance: (typeof sigmaMock.instances)[number] | undefined): number {
  if (instance === undefined) return 0
  return instance.graph.nodes().filter(id => !id.startsWith('__nw-extent-')).length
}

describe('novel-mode story map', () => {
  it('maps accepted Canon onto labelled nodes and bidirectional edges', () => {
    const map = buildStoryMap({ canon, relationships })

    expect(map.revision).toBe(5)
    expect(map.nodes.map(node => [node.id, node.label, node.group])).toEqual([
      ['chen-mo', '陈默', '港务局'],
      ['zhou-yan', '周砚', '雾灯帮'],
    ])
    // A character's place is where Canon last put them, and is absent when no
    // accepted event names them — the map never invents one.
    expect(map.nodes.map(node => node.place)).toEqual(['港务局大楼', '雾灯码头'])
    expect(buildStoryMap({ canon: { ...canon, entities: [] }, relationships: {
      ...relationships, relationships: [],
    } }).nodes).toEqual([])
    expect(map.edges).toHaveLength(1)
    expect(map.edges[0]?.label).toBe('陈默→周砚 旧同僚（试探） · 周砚→陈默 旧同僚（戒备）')
    expect(map.edges[0]?.turns).toBe(1)
    // Both ends of a line carrying an unresolved debt are flagged.
    expect(map.nodes.map(node => node.debts)).toEqual([1, 1])
  })

  it('draws the map canvas for the map view over the graph library', async () => {
    const loadStoryMap = vi.fn(async () => ({
      revision: 5,
      nodes: [
        { id: 'chen-mo', label: '陈默', group: '港务局', place: '港务局大楼', debts: 1 },
        { id: 'zhou-yan', label: '周砚', group: '雾灯帮', place: '雾灯码头', debts: 0 },
      ],
      edges: [{ id: 'line-1', source: 'chen-mo', target: 'zhou-yan', label: '旧同僚', turns: 1 }],
    }))

    const { container, root } = await mountMap(loadStoryMap)

    expect(loadStoryMap).toHaveBeenCalledWith('ws-mist')
    expect(container.querySelector('[data-novel-canvas="map"]')).not.toBeNull()
    expect(container.querySelector('[data-novel-story-map]')).not.toBeNull()
    expect(sigmaMock.instances).toHaveLength(1)
    expect(drawnCast(sigmaMock.instances[0])).toBe(2)
    expect(sigmaMock.instances[0]?.graph.size).toBe(1)
    // The force-directed layout places every character the map knows about;
    // the cluster-disc detour's folding is gone, so the whole cast is drawn.
    expect(container.querySelectorAll('.nw-map-swatch')).toHaveLength(2)

    // The prototype opens 人物档案 by double-clicking a node; the view hands that
    // node to the frame store, which is what the drawer seat reads.
    const store = await import('../src/client/store.js')
    const instance = sigmaMock.instances[0]
    expect(instance?.handlers.has('doubleClickNode')).toBe(true)
    await act(async () => {
      instance?.handlers.get('doubleClickNode')?.({ node: 'chen-mo' })
    })
    expect(store.getWorkbenchState().personFileId).toBe('chen-mo')
    store.workbenchActions.closePersonFile()

    await act(async () => { root.unmount() })
    expect(sigmaMock.instances[0]?.killed).toBe(true)
  })

  // The cluster-folding and axis-switching tests lived here before I-P1 returned
  // the map to force-directed layout. The detour's discs, +N bubbles and
  // faction/place axis toggle are gone — forceAtlas2 places every character the
  // map knows about — so the behaviours those tests held no longer exist.

  it('keeps a character the author dropped, and lets them release every pin', async () => {
    const loadStoryMap = vi.fn(async () => ({
      revision: 5,
      nodes: [
        { id: 'chen-mo', label: '陈默', group: '港务局', place: undefined, debts: 0 },
        { id: 'zhou-yan', label: '周砚', group: '港务局', place: undefined, debts: 0 },
      ],
      edges: [],
    }))

    const { container, root } = await mountMap(loadStoryMap)
    expect(container.querySelector('[data-novel-story-map-unpin]')).toBeNull()
    const before = sigmaMock.instances.length

    const instance = sigmaMock.instances[sigmaMock.instances.length - 1]
    expect(instance?.handlers.has('upNode')).toBe(true)
    await act(async () => {
      instance?.handlers.get('upNode')?.({ node: 'chen-mo' })
    })
    await act(async () => {})
    expect(container.querySelector('[data-novel-story-map-unpin]')?.textContent).toContain('1')
    // Pinning re-lays the graph in place: a fresh renderer would throw away the
    // zoom and pan the author had set up before they dragged anything.
    expect(sigmaMock.instances).toHaveLength(before)

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-novel-story-map-unpin]')?.click()
    })
    await act(async () => {})
    expect(container.querySelector('[data-novel-story-map-unpin]')).toBeNull()

    await act(async () => { root.unmount() })
  })

  it('focuses a character by name, opening the cluster that folded them', async () => {
    const loadStoryMap = vi.fn(async () => ({
      revision: 5,
      nodes: [
        { id: 'chen-mo', label: '陈默', group: '港务局', place: undefined, debts: 0 },
        { id: 'chen-an', label: '陈安', group: '港务局', place: undefined, debts: 0 },
        { id: 'zhou-yan', label: '周砚', group: '雾灯帮', place: undefined, debts: 0 },
      ],
      edges: [{ id: 'line-1', source: 'chen-mo', target: 'zhou-yan', label: '旧同僚', turns: 1 }],
    }))

    const { container, root } = await mountMap(loadStoryMap)

    const type = async (value: string): Promise<void> => {
      await act(async () => {
        const input = container.querySelector('[data-novel-story-map-search]') as HTMLInputElement
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        setter?.call(input, value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await act(async () => {})
    }

    await type('周砚')
    expect(container.querySelector('[data-novel-story-map-selection]')?.getAttribute('data-novel-story-map-selection')).toBe('zhou-yan')

    // The force-directed layout draws every character, so focusing 陈安 is
    // focusing them — no cluster to open first.
    await type('陈安')
    expect(container.querySelector('[data-novel-story-map-selection]')?.getAttribute('data-novel-story-map-selection')).toBe('chen-an')

    await type('没有这个人')
    expect(container.querySelector('[data-novel-story-map-nomatch]')).not.toBeNull()
    expect(container.querySelector('[data-novel-story-map-selection]')).toBeNull()

    await act(async () => { root.unmount() })
  })

  afterEach(() => { probe.ok = true })

  /**
   * F1: with no GPU the old code built sigma anyway, `createWebGLContext` returned
   * null, and reading `blendFunc` off it threw — the map died, and because nothing
   * caught it, so did every canvas the author opened afterwards. The map now asks
   * the machine first and says so in the author's words when the answer is no.
   */
  it('degrades to a card, not a blank canvas, where the machine cannot paint WebGL', async () => {
    probe.ok = false
    const before = sigmaMock.instances.length
    const { container } = await mountMap(vi.fn(async () => ({
      revision: 5,
      nodes: [
        { id: 'chen-mo', label: '陈默', group: '港务局', place: undefined, debts: 0 },
        { id: 'zhou-yan', label: '周砚', group: '雾灯帮', place: undefined, debts: 0 },
      ],
      edges: [{ id: 'line-1', source: 'chen-mo', target: 'zhou-yan', label: '旧同僚', turns: 1 }],
    })))

    const card = container.querySelector('[data-novel-story-map-degraded]')
    expect(card).not.toBeNull()
    // The cast is still one click away, and the author can ask the machine again.
    expect(container.querySelector('[data-novel-story-map-degraded-cast]')).not.toBeNull()
    expect(container.querySelector('[data-novel-story-map-degraded-retry]')).not.toBeNull()
    // The fallback is a decision made before anything was built, not a crash: the
    // renderer is never handed a graph it cannot paint.
    expect(sigmaMock.instances).toHaveLength(before)

    const { getWorkbenchState } = await import('../src/client/store.js')
    await act(async () => {
      container.querySelector('[data-novel-story-map-degraded-cast]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(getWorkbenchState().view).toBe('cast')
  })

  it('paints the map when the author retries and the machine turns out to have WebGL', async () => {
    probe.ok = false
    const before = sigmaMock.instances.length
    const { container } = await mountMap(vi.fn(async () => ({
      revision: 5,
      nodes: [{ id: 'chen-mo', label: '陈默', group: '港务局', place: undefined, debts: 0 }],
      edges: [],
    })))
    expect(container.querySelector('[data-novel-story-map-degraded]')).not.toBeNull()

    probe.ok = true
    await act(async () => {
      container.querySelector('[data-novel-story-map-degraded-retry]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(container.querySelector('[data-novel-story-map-degraded]')).toBeNull()
    expect(container.querySelector('[data-novel-story-map]')).not.toBeNull()
    expect(sigmaMock.instances).toHaveLength(before + 1)
  })
})

/**
 * The cast is drawn on WebGL, where nothing is focusable and nothing reaches a
 * screen reader. The overlay that already carries the discs is the map's
 * accessible twin: one element per drawn character, sitting exactly where that
 * character is on screen.
 */
describe('novel-mode story map keyboard', () => {
  const cast = {
    revision: 5,
    nodes: [
      { id: 'chen-mo', label: '陈默', group: '港务局', place: undefined, debts: 0 },
      { id: 'chen-an', label: '陈安', group: '港务局', place: undefined, debts: 0 },
      { id: 'zhou-yan', label: '周砚', group: '雾灯帮', place: undefined, debts: 0 },
    ],
    edges: [{ id: 'line-1', source: 'chen-mo', target: 'zhou-yan', label: '旧同僚', turns: 1 }],
  }

  const stops = (container: HTMLElement): Element[] =>
    [...container.querySelectorAll('[data-novel-story-map-node]')]

  const key = (target: Element, name: string): void => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))
  }

  it('offers every drawn character as a named stop, and only one in the tab order', async () => {
    const { container, root } = await mountMap(vi.fn(async () => cast))
    const drawn = stops(container)

    // The force-directed layout draws every character, so every character is
    // offered as a focusable stop.
    expect(drawn.map(node => node.getAttribute('data-novel-story-map-node'))).toEqual(['chen-mo', 'chen-an', 'zhou-yan'])
    expect(drawn.map(node => node.getAttribute('aria-label'))).toEqual(['陈默', '陈安', '周砚'])
    // Roving tabindex: a long cast must not become fifty Tab presses.
    expect(drawn.map(node => node.getAttribute('tabindex'))).toEqual(['0', '-1', '-1'])
    // The overlay is the cast's accessible twin.
    const overlay = container.querySelector('[data-novel-story-map-overlay]')
    expect(overlay?.getAttribute('aria-hidden')).toBeNull()
    expect(overlay?.getAttribute('aria-label')).toBe('故事地图上的人物')

    await act(async () => { root.unmount() })
  })

  it('walks the cast with the arrow keys, and wraps at the ends', async () => {
    const { container, root } = await mountMap(vi.fn(async () => cast))
    const drawn = stops(container)
    const overlay = container.querySelector('[data-novel-story-map-overlay]')!
    const [first, second, third] = drawn as [Element, Element, Element]

    expect(first.getAttribute('tabindex')).toBe('0')
    await act(async () => {
      first.focus()
      key(first, 'ArrowRight')
    })
    expect(document.activeElement).toBe(second)
    expect(second.getAttribute('tabindex')).toBe('0')
    expect(first.getAttribute('tabindex')).toBe('-1')

    await act(async () => { key(second, 'ArrowRight') })
    expect(document.activeElement).toBe(third)
    await act(async () => { key(third, 'ArrowRight') })
    expect(document.activeElement).toBe(first)
    await act(async () => { key(first, 'ArrowLeft') })
    expect(document.activeElement).toBe(third)
    expect(overlay.querySelectorAll('[data-novel-story-map-node]').length).toBe(3)

    await act(async () => { root.unmount() })
  })

  it('selects on Enter and opens the 人物档案 on D', async () => {
    const { container, root } = await mountMap(vi.fn(async () => cast))
    const store = await import('../src/client/store.js')
    const [first, second] = stops(container) as [Element, Element]

    await act(async () => {
      first.focus()
      key(first, 'Enter')
    })
    expect(container.querySelector('[data-novel-story-map-selection]')?.getAttribute('data-novel-story-map-selection'))
      .toBe('chen-mo')

    await act(async () => {
      second.focus()
      key(second, 'd')
    })
    // The force-directed layout draws every character, so the second stop is
    // 陈安 now — the cluster-disc detour used to fold them away.
    expect(store.getWorkbenchState().personFileId).toBe('chen-an')
    store.workbenchActions.closePersonFile()

    await act(async () => { root.unmount() })
  })
})
