// @vitest-environment jsdom
// The frame's columns are solved, not fixed. The prototype draws three tracks;
// what it does not say is what happens when the window is too narrow for them,
// and "the manuscript gets squeezed to nothing" is not an answer. The official
// AppFrame solves exactly this with a pure function — centre keeps a floor, the
// details column concedes first and then auto-closes, the rail never concedes —
// and this is the same contract with our own numbers.
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { WorkbenchFrame } from '../src/client/WorkbenchFrame.js'
import { getWorkbenchState, resetWorkbench, workbenchActions } from '../src/client/store.js'
import {
  CENTER_MIN,
  RAIL_COLLAPSED,
  RAIL_DEFAULT,
  RAIL_MAX,
  RAIL_MIN,
  SIDE_DEFAULT,
  SIDE_MAX,
  SIDE_MIN,
  clampWidth,
  solveColumns,
} from '../src/client/frame-columns.js'

describe('novel-mode frame columns', () => {
  it('clamps a dragged width into the panel range', () => {
    expect(clampWidth(100, RAIL_MIN, RAIL_MAX)).toBe(RAIL_MIN)
    expect(clampWidth(9_999, RAIL_MIN, RAIL_MAX)).toBe(RAIL_MAX)
    expect(clampWidth(300, RAIL_MIN, RAIL_MAX)).toBe(300)
  })

  it('gives every column its preference when there is room', () => {
    expect(solveColumns(1440, RAIL_DEFAULT, SIDE_DEFAULT)).toEqual({
      rail: RAIL_DEFAULT,
      center: 1440 - RAIL_DEFAULT - SIDE_DEFAULT,
      side: SIDE_DEFAULT,
    })
    // A drag to the far end of the range is honoured where there is room for it...
    expect(solveColumns(1600, RAIL_MAX, SIDE_MAX)).toEqual({
      rail: RAIL_MAX,
      center: 1600 - RAIL_MAX - SIDE_MAX,
      side: SIDE_MAX,
    })
    // ...and at 1440 the same two preferences cannot both stand: the manuscript
    // floor takes 80 back off the details column rather than being squeezed.
    expect(solveColumns(1440, RAIL_MAX, SIDE_MAX)).toEqual({
      rail: RAIL_MAX,
      center: CENTER_MIN,
      side: 440,
    })
  })

  it('resolves a closed column, keeping the rail a rail', () => {
    expect(solveColumns(1440, 0, 0)).toEqual({
      rail: RAIL_COLLAPSED,
      center: 1440 - RAIL_COLLAPSED,
      side: 0,
    })
  })

  it('shrinks the details column to keep the manuscript its floor', () => {
    const solved = solveColumns(1180, RAIL_DEFAULT, 400)
    expect(solved.center).toBe(CENTER_MIN)
    expect(solved.side).toBe(1180 - RAIL_DEFAULT - CENTER_MIN)
    expect(solved.side).toBeGreaterThanOrEqual(SIDE_MIN)
  })

  it('closes the details column rather than squeezing it below its minimum', () => {
    // 84px of give would leave 212, under SIDE_MIN: the column goes away instead
    // of turning into a sliver, and the centre gets all of it back.
    expect(solveColumns(1100, RAIL_DEFAULT, SIDE_DEFAULT)).toEqual({
      rail: RAIL_DEFAULT,
      center: 1100 - RAIL_DEFAULT,
      side: 0,
    })
  })

  it('never takes it out of the rail', () => {
    // The rail is the author's navigation: it stays at its own width and the
    // centre absorbs whatever is left, even past its floor.
    const solved = solveColumns(700, RAIL_DEFAULT, SIDE_DEFAULT)
    expect(solved.rail).toBe(RAIL_DEFAULT)
    expect(solved.side).toBe(0)
    expect(solved.center).toBe(700 - RAIL_DEFAULT)
    expect(solved.center).toBeLessThan(CENTER_MIN)
  })

  it('keeps a closed column closed no matter how wide the window gets', () => {
    expect(solveColumns(2560, RAIL_DEFAULT, 0).side).toBe(0)
    expect(solveColumns(2560, RAIL_DEFAULT, 0).center).toBe(2560 - RAIL_DEFAULT)
  })
})

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

/** One pointer gesture on a handle, in the coordinates the frame reads. */
async function drag(handle: Element, from: number, to: number): Promise<void> {
  handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: from }))
  await Promise.resolve()
  handle.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: to }))
  await Promise.resolve()
  handle.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: to }))
  await Promise.resolve()
}

describe('novel-mode frame columns in the frame', () => {
  beforeEach(() => {
    localStorage.clear()
    resetWorkbench()
  })

  it('draws the solved tracks rather than the raw preferences', async () => {
    workbenchActions.resize(1440)
    const { container, root } = await mountFrame()
    const frame = container.querySelector('[data-novel-workbench="frame"]') as HTMLElement | null

    expect(frame?.style.getPropertyValue('--nw-rail')).toBe('248px')
    expect(frame?.style.getPropertyValue('--nw-side')).toBe('296px')

    await act(async () => { root.unmount() })
  })

  it('drags the rail wider and remembers the width', async () => {
    workbenchActions.resize(1440)
    const { container, root } = await mountFrame()
    const handle = container.querySelector('[data-novel-column-handle="rail"]')!

    await act(async () => { await drag(handle, 300, 340) })
    expect(getWorkbenchState().panels.sidebar).toBe(288)
    expect((container.querySelector('[data-novel-workbench="frame"]') as HTMLElement)
      .style.getPropertyValue('--nw-rail')).toBe('288px')

    await act(async () => { root.unmount() })
  })

  it('drags the conversation column wider by pulling the boundary left', async () => {
    workbenchActions.resize(1440)
    const { container, root } = await mountFrame()
    const handle = container.querySelector('[data-novel-column-handle="conversation"]')!

    await act(async () => { await drag(handle, 900, 860) })
    expect(getWorkbenchState().panels.details).toBe(336)

    await act(async () => { root.unmount() })
  })

  it('answers the arrow keys, because a mouse is not the only way to resize', async () => {
    workbenchActions.resize(1440)
    const { container, root } = await mountFrame()
    const handle = container.querySelector('[data-novel-column-handle="rail"]')!

    const press = async (key: string, shiftKey = false): Promise<void> => {
      await act(async () => {
        handle.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }))
      })
    }
    await press('ArrowRight')
    expect(getWorkbenchState().panels.sidebar).toBe(RAIL_DEFAULT + 16)
    await press('ArrowRight', true)
    expect(getWorkbenchState().panels.sidebar).toBe(RAIL_DEFAULT + 64)
    await press('ArrowLeft', true)
    expect(getWorkbenchState().panels.sidebar).toBe(RAIL_DEFAULT + 16)

    await act(async () => { root.unmount() })
  })

  it('closes the conversation column rather than letting it squeeze the manuscript', async () => {
    workbenchActions.resize(1440)
    const { container, root } = await mountFrame()
    expect(container.querySelector('[data-novel-conversation-column]')).not.toBeNull()

    // 900px cannot hold 248 + 296 and still leave the manuscript its floor, and
    // what is left of the conversation column is under its own minimum.
    await act(async () => { workbenchActions.resize(900) })
    expect(container.querySelector('[data-novel-conversation-column]')).toBeNull()
    // The preference is untouched: the column comes back when there is room.
    expect(getWorkbenchState().panels.details).toBe(SIDE_DEFAULT)
    await act(async () => { workbenchActions.resize(1440) })
    expect(container.querySelector('[data-novel-conversation-column]')).not.toBeNull()

    await act(async () => { root.unmount() })
  })
})

/**
 * The empty thread is the case the frame got wrong.
 *
 * With no lines, the shipped conversation surface renders its own welcome page
 * instead of a transcript. That page claims the whole column, so the frame's own
 * empty state was squeezed to a strip at the top and the author was left clicking
 * a dead scroll body. The frame already knows the thread is empty — it holds the
 * transcript — so it publishes that, and the stylesheet answers it.
 */
describe('the empty thread', () => {
  beforeEach(() => {
    localStorage.clear()
    resetWorkbench()
  })

  it('publishes the empty state on the conversation column', async () => {
    workbenchActions.resize(1440)
    const { container, root } = await mountFrame()

    expect(container.querySelector('[data-novel-conversation-column]')
      ?.getAttribute('data-novel-thread-state')).toBe('empty')

    await act(async () => { root.unmount() })
  })

  it('stops publishing it once the thread has a line', async () => {
    workbenchActions.resize(1440)
    const { container, root } = await mountFrame()

    await act(async () => {
      workbenchActions.setTranscript([{ kind: 'user', id: 'u1', text: '写一段开场。' }])
    })
    expect(container.querySelector('[data-novel-conversation-column]')
      ?.getAttribute('data-novel-thread-state')).toBeNull()

    await act(async () => { root.unmount() })
  })

  it('answers that state in the stylesheet, so the shipped welcome page cannot claim the column', async () => {
    workbenchActions.resize(1440)
    const { container, root } = await mountFrame()
    const styles = Array.from(container.querySelectorAll('style'))
      .map(node => node.textContent ?? '')
      .join('\n')

    // Every child of the shipped composer stack but the composer bar is the
    // welcome page — the bar is the only slot the frame still needs from it.
    expect(styles).toContain('data-novel-thread-state="empty"')
    expect(styles).toContain('_composerHero')
    expect(styles).toContain('conversation.composer.bar')

    await act(async () => { root.unmount() })
  })
})
