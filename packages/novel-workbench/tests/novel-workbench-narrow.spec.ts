// @vitest-environment jsdom
// A narrow window has to keep the manuscript its room. The rail folds to icons
// and the conversation column stops taking a track, floating over the canvas
// when the author asks for it — otherwise two fixed columns eat the page and the
// prototype's own `[data-narrow="1"]` rules never fire.
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { WorkbenchFrame } from '../src/client/WorkbenchFrame.js'
import { getWorkbenchState, resetWorkbench, workbenchActions } from '../src/client/store.js'

async function mountFrame() {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    workbenchActions.setCurrentSession('session-novel' as never)
    root.render(createElement(WorkbenchFrame as never, {
      renderSlot: () => null,
      actions: { toggleSidebar() {}, openDetails() {}, closeDetails() {} },
    }))
  })
  return { container, root }
}

function frameOf(container: HTMLElement): Element | null {
  return container.querySelector('[data-novel-workbench="frame"]')
}

describe('novel-mode narrow window', () => {
  beforeEach(() => {
    localStorage.clear()
    resetWorkbench()
  })

  it('is narrow at the prototype 窄窗 width and wide above it', () => {
    workbenchActions.resize(1280)
    expect(getWorkbenchState().window.nearLimit).toBe(true)
    workbenchActions.resize(1281)
    expect(getWorkbenchState().window.nearLimit).toBe(false)
  })

  it('keeps the three columns when the window is wide', async () => {
    workbenchActions.resize(1440)
    const { container, root } = await mountFrame()

    expect(frameOf(container)?.getAttribute('data-narrow')).toBe('0')
    const side = container.querySelector('[data-novel-conversation-column]')
    expect(side).not.toBeNull()
    expect(side?.className).not.toContain('open')

    await act(async () => { root.unmount() })
  })

  it('folds the rail and floats the conversation when the window is narrow', async () => {
    workbenchActions.resize(1280)
    const { container, root } = await mountFrame()

    expect(frameOf(container)?.getAttribute('data-narrow')).toBe('1')
    // The column still exists — the author keeps the conversation — but it is an
    // overlay the prototype's own narrow rules can position.
    const side = container.querySelector('[data-novel-conversation-column]')
    expect(side).not.toBeNull()
    expect(side?.className).toContain('open')

    await act(async () => { root.unmount() })
  })

  it('gives the floated column back to the canvas when the author closes it', async () => {
    workbenchActions.resize(1280)
    const { container, root } = await mountFrame()
    await act(async () => { workbenchActions.closeDetails() })

    expect(container.querySelector('[data-novel-conversation-column]')).toBeNull()
    expect(frameOf(container)?.getAttribute('data-narrow')).toBe('1')
    expect(frameOf(container)?.getAttribute('data-novel-workbench-details')).toBe('collapsed')

    await act(async () => { root.unmount() })
  })

  it('reports the width it is given, and ignores a zero one', async () => {
    // A frame measured before layout reports 0; treating that as "very narrow"
    // would flash the folded rail on every load.
    workbenchActions.resize(1440)
    workbenchActions.resize(0)
    expect(getWorkbenchState().window.nearLimit).toBe(false)
    expect(getWorkbenchState().window.width).toBe(1440)
  })
})
