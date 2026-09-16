// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { SimulationView } from '../src/client/SimulationView.js'

/**
 * 推演 in this product is not a standalone runner: the two experiments the
 * prototype names are Agent tools that run inside a thread against a frozen
 * accepted revision. The canvas has to say exactly that, list the real
 * parameters each tool takes, and hand the author to a thread when they ask.
 */
describe('novel-mode simulation canvas', () => {
  it('names the real experiment tools, their parameters and the frozen revision', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const onOpenThread = vi.fn()
    await act(async () => {
      root.render(createElement(SimulationView as never, {
        revision: 2,
        onOpenThread,
      }))
    })

    const section = container.querySelector('[data-novel-simulation]')
    expect(section).not.toBeNull()
    expect(section?.textContent).toContain('沙盒侧车未接入')
    expect(section?.textContent).toContain('固定版本 R2')
    expect(section?.textContent).toContain('读者反应')
    expect(section?.textContent).toContain('人物压力')
    // Parameters come from the registered tools, not from the prototype sample.
    expect(section?.textContent).toContain('unitId')
    expect(section?.textContent).toContain('maxActions')
    expect(section?.textContent).toContain('simulate_novel_reader_response')
    expect(section?.textContent).toContain('simulate_novel_story_world')

    await act(async () => {
      section?.querySelector<HTMLButtonElement>('[data-novel-simulation-open-thread]')?.click()
    })
    expect(onOpenThread).toHaveBeenCalled()
    await act(async () => { root.unmount() })
  })
})
