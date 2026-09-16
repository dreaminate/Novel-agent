// @vitest-environment jsdom
import './webgl-env.js'
import { Context } from '@deepseek-ai/cordis'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'

interface LedgerOptions {
  name: string
  locale?: string
  id?: string
  children?: Record<string, unknown>
}

interface LedgerEntry {
  options: LedgerOptions
  component: unknown
}

/**
 * Slot ledger stand-in. It is declaration-aware because the novel surfaces are
 * registered from a service-gated inner fiber: the ledger has to answer the
 * `slots.inject` wait the same way the shipped renderer does.
 */
class SlotLedger {
  private readonly entriesValue: LedgerEntry[] = []
  private readonly declaredValue = new Set<string>()

  inject(name: string, callback: () => unknown): () => void {
    const disposers = this.declaredValue.has(name)
      ? (callback() as (() => void) | readonly (() => void)[])
      : []
    return () => {
      for (const dispose of Array.isArray(disposers) ? disposers : [disposers]) {
        (dispose as () => void)()
      }
    }
  }

  register(options: LedgerOptions, component: unknown): () => void {
    const entry: LedgerEntry = { options, component }
    this.entriesValue.push(entry)
    for (const child of Object.keys(options.children ?? {})) this.declaredValue.add(child)
    return () => {
      const index = this.entriesValue.indexOf(entry)
      if (index >= 0) this.entriesValue.splice(index, 1)
    }
  }

  entries(name?: string): readonly LedgerEntry[] {
    return name === undefined
      ? this.entriesValue
      : this.entriesValue.filter(entry => entry.options.name === name)
  }
}

const themeSnapshot = {
  preference: 'light',
  fontSize: 16,
  active: { id: 'light', colorScheme: 'light', tokens: {} },
  themes: [],
  revision: 1,
}

const works = [
  {
    workspaceId: 'ws-mist',
    path: '/books/mist-harbor',
    title: '雾港夜航：第七码头',
    sessionIds: ['s-6', 's-plan'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },
]

const sessions = {
  ids: ['s-6', 's-plan'],
  byId: {
    's-6': {
      id: 's-6',
      displayTitle: '第 6 章 · 冷库之下的通道',
      running: false,
      blank: false,
      updatedAt: 2,
    },
    's-plan': {
      id: 's-plan',
      displayTitle: '全书 · 路线规划',
      running: false,
      blank: false,
      updatedAt: 1,
    },
  },
  current: 's-6',
  phase: 'ready',
  subagentsByParent: {},
  jobsBySession: {},
  currentAddress: undefined,
}

const outline = {
  revision: 5,
  chapterCount: 2,
  pending: 1,
  debts: 0,
  groups: [
    {
      id: 'volume-2',
      title: '卷二 · 冷库',
      chapters: [
        { id: 'chapter-5', number: 5, title: '雾里的货单', status: 'accepted' as const, debts: 0 },
        { id: 'chapter-6', number: 6, title: '冷库之下的通道', status: 'pending' as const, debts: 0 },
      ],
    },
  ],
}

describe('novel-workbench novel navigation rail', () => {
  it('takes the sidebar seat and renders the three work segments plus the advanced entry', async () => {
    const { apply } = await import('../src/client/index.js') as {
      apply: (ctx: Context) => () => void
    }
    const ctx = new Context()
    const ledger = new SlotLedger()
    const loadOutline = vi.fn(async () => outline)
    ctx.provide('slots', ledger as never)
    ctx.provide('theme', { getTheme: () => themeSnapshot } as never)
    ctx.provide('sessions', { open: vi.fn(), list: { getSnapshot: () => ({ current: undefined }), subscribe: () => () => {} } } as never)
    ctx.provide('uiWorkspace', { startSession: vi.fn(), archiveSession: vi.fn() } as never)
    // The novel surfaces adopt folders through the Workspace Controller, so the
    // service has to exist before they take their seats.
    ctx.provide('workspaces', { create: vi.fn() } as never)
    // The plugin registers its `@` reference source on the trigger pipeline.
    ctx.provide('inputTriggers', { registerSource: () => () => {} } as never)
    ctx.provide('remote', {} as never)
    // The advanced panels read the Host's plugin inventory and the dynamic
    // Cordis inventory, so the surfaces fiber waits for both namespaces.
    ctx.provide('remote.pluginInventory', { list: vi.fn() } as never)
    ctx.provide('remote.dynamicCordisRunner', { inventory: vi.fn() } as never)
    ctx.provide('remote.novelProject', {
      open: vi.fn(async () => ({ ok: true, value: { acceptedRevision: 5 } })),
      pendingProposals: vi.fn(async () => ({ ok: true, value: [] })),
      projectNarrative: vi.fn(async () => ({ ok: true, value: { units: [] } })),
      projectManuscripts: vi.fn(async () => ({ ok: true, value: [] })),
    } as never)

    const dispose = apply(ctx as never)
    await new Promise(resolve => { setTimeout(resolve, 0) })
    const entry = ledger.entries('sidebar')[0]

    expect(entry).toBeDefined()
    expect(Object.keys(ledger.entries('root')[0]?.options.children ?? {})).toContain('novel.canvas')

    const container = document.createElement('div')
    document.body.append(container)
    const Sidebar = entry?.component as (props: Record<string, unknown>) => unknown
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(Sidebar, {
        collapsed: false,
        width: 280,
        useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: works }),
        useSessions: (selector: (value: unknown) => unknown) => selector(sessions),
        loadOutline,
        openThread: vi.fn(),
        newThread: vi.fn(),
      } as never))
    })
    await act(async () => {})

    expect(loadOutline).toHaveBeenCalledWith('ws-mist')
    const rail = container.querySelector('[data-novel-rail="nav"]')
    expect(rail).not.toBeNull()
    expect(
      [...rail!.querySelectorAll('[data-novel-rail-segment]')]
        .map(node => node.getAttribute('data-novel-rail-segment')),
    ).toEqual(['works', 'threads', 'views'])
    // The prototype's 作品 group is the chapter tree itself; the work title now
    // lives in the topbar, so the rail only has to carry its volume/chapter count.
    expect(rail!.querySelector('[data-novel-rail-segment="works"] .grp-head')?.textContent)
      .toContain('1 卷 · 2 章')
    expect(rail!.querySelector('[data-novel-chapter="chapter-6"]')?.textContent)
      .toContain('冷库之下的通道')
    expect(
      rail!.querySelector('[data-novel-chapter="chapter-6"]')
        ?.getAttribute('data-novel-chapter-status'),
    ).toBe('pending')
    expect(
      [...rail!.querySelectorAll('[data-novel-thread]')]
        .map(node => node.getAttribute('data-novel-thread')),
    ).toEqual(['s-6', 's-plan'])
    const views = [...rail!.querySelectorAll('[data-novel-view]')]
    expect(views).toHaveLength(10)
    // 写作 leads the segment: the surface the author works in should not be the
    // one they have to scroll to.
    expect(views[0]?.getAttribute('data-novel-view')).toBe('editor')
    expect(container.querySelector('[data-novel-advanced-toggle]')).not.toBeNull()

    await act(async () => { root.unmount() })
    dispose()
  })

  it('names a missing domain plugin instead of echoing the Host error', async () => {
    const { apply } = await import('../src/client/index.js') as {
      apply: (ctx: Context) => () => void
    }
    const ctx = new Context()
    const ledger = new SlotLedger()
    const loadOutline = vi.fn(async () => {
      throw new Error("打开作品失败：novel project has no 'planning/narrative' projector registered; install the domain plugin that registers it")
    })
    ctx.provide('slots', ledger as never)
    ctx.provide('theme', { getTheme: () => themeSnapshot } as never)
    ctx.provide('sessions', { open: vi.fn(), list: { getSnapshot: () => ({ current: undefined }), subscribe: () => () => {} } } as never)
    ctx.provide('uiWorkspace', { startSession: vi.fn(), archiveSession: vi.fn() } as never)
    ctx.provide('workspaces', { create: vi.fn() } as never)
    // The plugin registers its `@` reference source on the trigger pipeline.
    ctx.provide('inputTriggers', { registerSource: () => () => {} } as never)
    ctx.provide('remote', {} as never)
    // The advanced panels read the Host's plugin inventory and the dynamic
    // Cordis inventory, so the surfaces fiber waits for both namespaces.
    ctx.provide('remote.pluginInventory', { list: vi.fn() } as never)
    ctx.provide('remote.dynamicCordisRunner', { inventory: vi.fn() } as never)
    ctx.provide('remote.novelProject', { open: vi.fn(async () => ({ ok: true, value: { acceptedRevision: 0 } })) } as never)

    const dispose = apply(ctx as never)
    await new Promise(resolve => { setTimeout(resolve, 0) })
    const entry = ledger.entries('sidebar')[0]
    const container = document.createElement('div')
    document.body.append(container)
    const Sidebar = entry?.component as (props: Record<string, unknown>) => unknown
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(Sidebar, {
        collapsed: false,
        width: 248,
        useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: works }),
        useSessions: (selector: (value: unknown) => unknown) => selector(sessions),
        loadOutline,
        openThread: vi.fn(),
        newThread: vi.fn(),
      } as never))
    })
    await act(async () => {})

    const gap = container.querySelector('[data-novel-rail-gap="planning/narrative"]')
    expect(gap).not.toBeNull()
    expect(gap?.textContent).toContain('缺插件：未安装小说规划插件')
    expect(gap?.textContent).not.toContain('projector registered')
    await act(async () => { root.unmount() })
    dispose()
  })
})
