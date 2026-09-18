// @vitest-environment jsdom
import { createElement, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CanvasBoundary } from '../src/client/canvas-boundary.js'

/**
 * Why this spec exists: one canvas crashing used to take the whole workbench with
 * it. The seat's occupant rendered its views as plain JSX with nothing between a
 * thrown error and the root, so a failed story map left the author staring at a
 * white rectangle — and every later canvas was white too, because the crashed
 * tree was never replaced. These tests hold the seam that stops it: a crash is
 * contained to the canvas that crashed, the author is told which canvas it was
 * and why, and 重试 rebuilds that canvas from a clean slate.
 */

let mounts = 0

/** A canvas stand-in that throws from its effect, the way a WebGL-less sigma does. */
function Bomb(props: { readonly boom: boolean }): null {
  mounts += 1
  useEffect(() => {
    if (props.boom) throw new Error('地图渲染器起不来')
  }, [props.boom])
  return null
}

/**
 * Every root this file mounts. A boundary test deliberately leaves a crashed tree
 * behind, and a mounted React root keeps running its effects — so each case tears
 * its own down rather than leaving it to the next one.
 */
const mounted: { root: Root; container: HTMLElement }[] = []

async function mountUi(boom: boolean) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(
      createElement(
        'div',
        null,
        createElement(
          CanvasBoundary,
          { label: '故事地图' },
          createElement(Bomb, { boom }),
        ),
        createElement('p', { 'data-neighbour': '' }, '旁边照常'),
      ),
    )
  })
  mounted.push({ root, container })
  return { container, root }
}

describe('novel-mode canvas boundary', () => {
  beforeEach(() => {
    mounts = 0
    // React reports a caught error to the console and jsdom prints the "not wrapped
    // in act" noise; neither is what this spec is about.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(async () => {
    for (const entry of mounted.splice(0)) {
      await act(async () => { entry.root.unmount() })
      entry.container.remove()
    }
    document.body.replaceChildren()
  })

  it('contains a crashing canvas instead of taking the workbench with it', async () => {
    const { container } = await mountUi(true)

    const card = container.querySelector('[data-novel-canvas-crashed]')
    expect(card).not.toBeNull()
    // The author is told which canvas died and why — not shown a blank rectangle.
    expect(card?.getAttribute('data-novel-canvas-crashed')).toBe('故事地图')
    expect(card?.textContent).toContain('故事地图')
    expect(card?.textContent).toContain('地图渲染器起不来')
    expect(container.querySelector('[data-novel-canvas-retry]')).not.toBeNull()
    // Everything outside the failed canvas is untouched.
    expect(container.querySelector('[data-neighbour]')?.textContent).toBe('旁边照常')
  })

  it('rebuilds the canvas from a clean slate when the author retries', async () => {
    const { container } = await mountUi(true)
    const crashed = mounts
    expect(crashed).toBeGreaterThan(0)

    const retry = container.querySelector('[data-novel-canvas-retry]')
    await act(async () => {
      retry?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // A retry is a remount, not a repaint of the tree that already failed.
    expect(mounts).toBe(crashed + 1)
  })

  it('shows the canvas rather than the card while nothing has crashed', async () => {
    const { container } = await mountUi(false)

    expect(container.querySelector('[data-novel-canvas-crashed]')).toBeNull()
    expect(mounts).toBe(1)
  })
})
