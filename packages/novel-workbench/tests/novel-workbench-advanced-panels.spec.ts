// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { buildAdvancedPanels } from '../src/client/novel-data.js'
import { AdvancedView } from '../src/client/AdvancedView.js'

/**
 * The prototype's 进阶面 lists the Cordis plugin tree, the plugin inventory and
 * the agent presets next to jobs, subagents and diagnostics. All three come from
 * real Host reads: `pluginInventory.list()` answers the composition rows and the
 * per-preset groups, `dynamicCordisRunner.inventory()` answers the model-defined
 * Cordis plugins.
 */
const inventory = {
  entries: [
    { entryId: 'ui-layout', moduleName: '@deepseek-ai/dsh-client-ui-layout', enabled: false, fiberPhase: 'unloading' },
    { entryId: 'ui-chat', moduleName: '@deepseek-ai/dsh-client-ui-chat', enabled: false, fiberPhase: null },
    { entryId: 'novel-workbench', moduleName: '@novel-agent/novel-workbench', enabled: true, fiberPhase: 'active' },
  ],
  agentPresets: [
    {
      id: 'default',
      trust: 'system',
      name: '长篇写作（默认）',
      isDefault: true,
      rows: [
        { entryId: 'novel-project', moduleName: '@novel-agent/novel-project', enabled: true, fiberPhase: 'active' },
        { entryId: 'novel-planning', moduleName: '@novel-agent/novel-planning', enabled: 'conditional', condition: '!!js flag', fiberPhase: null },
      ],
    },
  ],
}

const cordis = [
  {
    pluginId: 'dyn-1',
    agentId: 'session-1',
    packages: [
      { packageId: 'pkg-1', name: '读者反应小工具', purpose: '试算读者反应', hasHostHalf: true, hasClientHalf: false },
    ],
    currentPackageId: 'pkg-1',
    activeRun: { pluginRunId: 'run-1', packageId: 'pkg-1' },
  },
]

describe('novel-mode advanced panels', () => {
  it('maps the Host inventory, the presets and the dynamic Cordis plugins', () => {
    const panels = buildAdvancedPanels({
      inventory: inventory as never,
      cordis: cordis as never,
    })

    expect(panels.plugins.map(row => row.moduleName)).toEqual([
      '@deepseek-ai/dsh-client-ui-layout',
      '@deepseek-ai/dsh-client-ui-chat',
      '@novel-agent/novel-workbench',
    ])
    expect(panels.plugins[0]).toMatchObject({ entryId: 'ui-layout', enabled: false, state: '卸载中' })
    expect(panels.plugins[2]).toMatchObject({ enabled: true, state: '运行中' })
    expect(panels.presets[0]).toMatchObject({ id: 'default', name: '长篇写作（默认）', isDefault: true, rows: 2 })
    expect(panels.presets[0]?.conditional).toBe(1)
    expect(panels.cordis[0]).toMatchObject({
      pluginId: 'dyn-1',
      agentId: 'session-1',
      running: true,
      current: '读者反应小工具',
      packages: 1,
    })
  })

  it('renders the three panels with their real rows', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const panels = buildAdvancedPanels({ inventory: inventory as never, cordis: cordis as never })
    await act(async () => {
      root.render(createElement(AdvancedView as never, {
        sessionId: 'session-1',
        jobs: {},
        subagents: {},
        diagnostics: undefined,
        panels,
        onReload: vi.fn(),
      }))
    })

    const view = container.querySelector('[data-novel-advanced]')
    expect(view).not.toBeNull()
    expect(container.querySelectorAll('[data-novel-advanced-plugin]')).toHaveLength(3)
    expect(view?.textContent).toContain('@novel-agent/novel-workbench')
    expect(view?.textContent).toContain('运行中')
    expect(view?.textContent).toContain('长篇写作（默认）')
    expect(view?.textContent).toContain('读者反应小工具')
    await act(async () => { root.unmount() })
  })
})
