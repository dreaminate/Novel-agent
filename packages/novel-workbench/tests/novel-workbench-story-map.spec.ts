// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { NovelCanonProjection, NovelRelationshipProjection } from '@novel-agent/novel-project/types'
import { buildStoryMap } from '../src/client/novel-data.js'

/** Renderer stand-in: sigma needs WebGL, the mapping and wiring do not. */
const sigmaMock = vi.hoisted(() => ({
  instances: [] as { graph: { order: number; size: number }; killed: boolean }[],
}))

vi.mock('sigma', () => ({
  default: class {
    readonly graph: { order: number; size: number }
    killed = false

    constructor(graph: { order: number; size: number }) {
      this.graph = graph
      sigmaMock.instances.push(this)
    }

    on(): void {}

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

    await act(async () => { root.unmount() })
    expect(sigmaMock.instances[0]?.killed).toBe(true)
  })
})
