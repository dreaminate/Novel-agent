// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { NovelCanonProjection, NovelRelationshipProjection } from '@novel-agent/novel-project/types'
import { buildStoryMap } from '../src/client/novel-data.js'

/** Renderer stand-in: sigma needs WebGL, the mapping and wiring do not. */
const sigmaMock = vi.hoisted(() => ({
  instances: [] as {
    graph: { order: number; size: number }
    killed: boolean
    handlers: Map<string, (payload: { node: string }) => void>
  }[],
}))

vi.mock('sigma', () => ({
  default: class {
    readonly graph: { order: number; size: number }
    killed = false
    readonly handlers = new Map<string, (payload: { node: string }) => void>()

    constructor(graph: { order: number; size: number }) {
      this.graph = graph
      sigmaMock.instances.push(this)
    }

    /** Record the events the view subscribes to so a test can fire them. */
    on(name: string, handler: (payload: { node: string }) => void): void {
      this.handlers.set(name, handler)
    }

    setSetting(): void {}

    getGraph(): unknown {
      return this.graph
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

const canon = {
  projectId: 'project-mist',
  workspaceId: 'ws-mist',
  revision: 5,
  facts: [],
  entities: [
    character('chen-mo', '陈默', '港务局'),
    character('zhou-yan', '周砚', '雾灯帮'),
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

describe('novel-mode story map', () => {
  it('maps accepted Canon onto labelled nodes and bidirectional edges', () => {
    const map = buildStoryMap({ canon, relationships })

    expect(map.revision).toBe(5)
    expect(map.nodes.map(node => [node.id, node.label, node.group])).toEqual([
      ['chen-mo', '陈默', '港务局'],
      ['zhou-yan', '周砚', '雾灯帮'],
    ])
    expect(map.edges).toHaveLength(1)
    expect(map.edges[0]?.label).toBe('chen-mo→zhou-yan 旧同僚（试探） · zhou-yan→chen-mo 旧同僚（戒备）')
    expect(map.edges[0]?.turns).toBe(1)
    // Both ends of a line carrying an unresolved debt are flagged.
    expect(map.nodes.map(node => node.debts)).toEqual([1, 1])
  })

  it('draws the map canvas for the map view over the graph library', async () => {
    const { NovelCanvas } = await import('../src/client/NovelCanvas.js') as {
      NovelCanvas: (props: Record<string, unknown>) => unknown
    }
    const { workbenchActions } = await import('../src/client/store.js') as {
      workbenchActions: { setView(view: string): void }
    }
    workbenchActions.setView('map')

    const loadStoryMap = vi.fn(async () => ({
      revision: 5,
      nodes: [
        { id: 'chen-mo', label: '陈默', group: '港务局', debts: 1 },
        { id: 'zhou-yan', label: '周砚', group: '雾灯帮', debts: 0 },
      ],
      edges: [{ id: 'line-1', source: 'chen-mo', target: 'zhou-yan', label: '旧同僚', turns: 1 }],
    }))

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
        openThread: vi.fn(),
        newThread: vi.fn(),
      } as never))
    })
    await act(async () => {})

    expect(loadStoryMap).toHaveBeenCalledWith('ws-mist')
    expect(container.querySelector('[data-novel-canvas="map"]')).not.toBeNull()
    expect(container.querySelector('[data-novel-story-map]')).not.toBeNull()
    expect(sigmaMock.instances).toHaveLength(1)
    expect(sigmaMock.instances[0]?.graph.order).toBe(2)
    expect(sigmaMock.instances[0]?.graph.size).toBe(1)
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

  it('folds the cast no relationship line reaches, and unfolds it on request', async () => {
    const { NovelCanvas } = await import('../src/client/NovelCanvas.js') as {
      NovelCanvas: (props: Record<string, unknown>) => unknown
    }
    const { workbenchActions } = await import('../src/client/store.js') as {
      workbenchActions: { setView(view: string): void }
    }
    workbenchActions.setView('map')

    const loadStoryMap = vi.fn(async () => ({
      revision: 5,
      nodes: [
        { id: 'chen-mo', label: '陈默', group: '港务局', debts: 1 },
        { id: 'zhou-yan', label: '周砚', group: '雾灯帮', debts: 0 },
        { id: 'solo', label: '码头看门人', group: undefined, debts: 0 },
      ],
      edges: [{ id: 'line-1', source: 'chen-mo', target: 'zhou-yan', label: '旧同僚', turns: 1 }],
    }))

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
        openThread: vi.fn(),
        newThread: vi.fn(),
      } as never))
    })
    await act(async () => {})

    const before = sigmaMock.instances.length
    // The accepted totals stay in the header; the graph draws the story web, and
    // a character no line reaches is one chip instead of an unconnected dot.
    expect(container.querySelector('.nw-map-meta')?.textContent).toContain('3 个人物')
    expect(sigmaMock.instances[before - 1]?.graph.order).toBe(2)
    const chip = container.querySelector('[data-novel-story-map-folded]')
    expect(chip?.textContent).toContain('+1')
    expect(chip?.getAttribute('title')).toContain('码头看门人')

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-novel-story-map-folded]')?.click()
    })
    await act(async () => {})
    expect(sigmaMock.instances[sigmaMock.instances.length - 1]?.graph.order).toBe(3)
    expect(container.querySelector('[data-novel-story-map-folded]')).toBeNull()

    await act(async () => { root.unmount() })
  })

  it('focuses a character by name, unfolding the cast when the match is folded', async () => {
    const { NovelCanvas } = await import('../src/client/NovelCanvas.js') as {
      NovelCanvas: (props: Record<string, unknown>) => unknown
    }
    const { workbenchActions } = await import('../src/client/store.js') as {
      workbenchActions: { setView(view: string): void }
    }
    workbenchActions.setView('map')

    const loadStoryMap = vi.fn(async () => ({
      revision: 5,
      nodes: [
        { id: 'chen-mo', label: '陈默', group: '港务局', debts: 1 },
        { id: 'zhou-yan', label: '周砚', group: '雾灯帮', debts: 0 },
        { id: 'solo', label: '码头看门人', group: undefined, debts: 0 },
      ],
      edges: [{ id: 'line-1', source: 'chen-mo', target: 'zhou-yan', label: '旧同僚', turns: 1 }],
    }))

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
        openThread: vi.fn(),
        newThread: vi.fn(),
      } as never))
    })
    await act(async () => {})

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

    // A folded character is off the graph, so focusing one has to bring the
    // folded cast back before the author can see who they searched for.
    await type('看门')
    expect(container.querySelector('[data-novel-story-map-folded]')).toBeNull()
    expect(sigmaMock.instances[sigmaMock.instances.length - 1]?.graph.order).toBe(3)
    expect(container.querySelector('[data-novel-story-map-selection]')?.getAttribute('data-novel-story-map-selection')).toBe('solo')

    await type('没有这个人')
    expect(container.querySelector('[data-novel-story-map-nomatch]')).not.toBeNull()
    expect(container.querySelector('[data-novel-story-map-selection]')).toBeNull()

    await act(async () => { root.unmount() })
  })
})
