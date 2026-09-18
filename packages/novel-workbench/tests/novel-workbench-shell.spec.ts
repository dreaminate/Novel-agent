// @vitest-environment jsdom
import './webgl-env.js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import { WORKBENCH_CSS } from '../src/client/workbench-css.js'
import { WorkbenchFrame } from '../src/client/WorkbenchFrame.js'
import { WorkbenchStyleSheet } from '../src/client/WorkbenchStyleSheet.js'

/**
 * The prototype is the design source of truth: the product frame keeps its token
 * sheet and its three-section geometry verbatim, so this spec compares the two
 * sheets instead of restating the values.
 *
 * The prototype lives at the repository root (`docs/prototypes/...`), but this
 * spec may be invoked from either the repo root or `packages/novel-workbench`
 * depending on the test runner's filter. Walk up from `process.cwd()` until the
 * workspace manifest is found, so the lookup does not depend on whichever
 * directory the runner happened to start in.
 */
function findRepoRoot(from: string): string {
  let dir = from
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  throw new Error(`could not find pnpm-workspace.yaml starting from ${from}`)
}

const prototypePath = resolve(
  findRepoRoot(process.cwd()),
  'docs/prototypes/2026-09-16-novel-mode/novel-mode-workbench.html',
)

function tokenBlock(source: string, selector: string): Map<string, string> {
  const start = source.indexOf(`${selector} {`)
  expect(start, `${selector} missing from the prototype`).toBeGreaterThanOrEqual(0)
  const open = source.indexOf('{', start)
  const block = source.slice(open + 1, source.indexOf('}', open))
  const tokens = new Map<string, string>()
  for (const declaration of block.split(';')) {
    const [name, ...rest] = declaration.split(':')
    const value = rest.join(':').trim()
    if (name?.trim().startsWith('--') && value !== '') tokens.set(name.trim(), value)
  }
  return tokens
}

describe('novel-mode frame carries the prototype design language', () => {
  it('installs the prototype stylesheet once, under its own style tag', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => { root.render(createElement(WorkbenchStyleSheet)) })
    const styles = document.querySelectorAll('style[data-novel-workbench="css"]')
    expect(styles).toHaveLength(1)
    expect(styles[0]?.textContent).toBe(WORKBENCH_CSS)
    await act(async () => { root.unmount() })
    expect(document.querySelectorAll('style[data-novel-workbench="css"]')).toHaveLength(0)
  })

  it('keeps every prototype design token, day and night', () => {
    const prototype = readFileSync(prototypePath, 'utf8')
    for (const selector of [':root', 'html[data-theme="night"]']) {
      const expected = tokenBlock(prototype, selector)
      expect(expected.size).toBeGreaterThan(20)
      for (const [name, value] of expected) {
        expect(WORKBENCH_CSS, `${selector} ${name}`).toContain(`${name}: ${value}`)
      }
    }
  })

  it('renders the prototype shell: topbar and three sections, with no composer of its own', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    // The topbar seat gets the seat's own content; the frame only has to place it.
    const renderSlot = (name: string) => name === 'novel.topbar'
      ? createElement(
          'div',
          null,
          createElement('span', { className: 'brand' }, '《雾港夜航：第七码头》'),
          createElement('span', { className: 'vbadge' }, 'R5'),
          createElement('span', { className: 'ctx' }, '卷二 · 第 6 章《冷库之下的通道》· 待审'),
        )
      : null
    await act(async () => {
      // The frame reads the session it shows from its own store, which the
      // plugin mirrors the Session Controller's selection into.
      const { workbenchActions } = await import('../src/client/store.js')
      workbenchActions.setCurrentSession('session-novel' as never)
      root.render(createElement(WorkbenchFrame as never, {
        renderSlot,
        actions: { toggleSidebar() {}, openDetails() {}, closeDetails() {} },
      }))
    })
    const frame = container.querySelector('[data-novel-workbench="frame"]')
    expect(frame).not.toBeNull()
    expect(frame?.querySelector('[data-novel-topbar]')).not.toBeNull()
    expect(frame?.querySelector('[data-novel-topbar]')?.textContent).toContain('《雾港夜航：第七码头》')
    expect(frame?.querySelector('[data-novel-topbar]')?.textContent).toContain('R5')
    expect(frame?.querySelector('[data-novel-topbar]')?.textContent).toContain('卷二 · 第 6 章《冷库之下的通道》· 待审')
    expect(frame?.querySelector('[data-novel-shell="left"]')).not.toBeNull()
    expect(frame?.querySelector('[data-novel-shell="main"]')).not.toBeNull()
    expect(frame?.querySelector('[data-novel-shell="right"]')).not.toBeNull()
    // No composer dock belongs to the frame. The composer lives in the shipped
    // conversation surface, which owns the input machine, the slash and at
    // menus and the approval panel — none reachable from a plugin. A dock here
    // would be a second input the author could type into without the model
    // hearing it.
    expect(frame?.querySelector('[data-novel-composer]')).toBeNull()
    await act(async () => { root.unmount() })
  })

  it('answers the shipped surfaces in this product tokens, not the host palette', async () => {
    // The conversation surface renders inside this frame and is written in the
    // host theme's variables — cool greys and a blue accent, against this
    // product's warm greys and orange. Its own class names are build hashes, so
    // the frame answers the variables instead, which is also the seam community
    // skins use. These are the ones an author actually sees.
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      const { workbenchActions } = await import('../src/client/store.js')
      workbenchActions.setCurrentSession('session-novel' as never)
      root.render(createElement(WorkbenchFrame as never, {
        renderSlot: () => null,
        actions: { toggleSidebar() {}, openDetails() {}, closeDetails() {} },
      }))
    })
    const frame = container.querySelector('[data-novel-workbench="frame"]')
    const style = getComputedStyle(frame!)

    expect(style.getPropertyValue('--dsw-alias-bg-base')).toBe('hsl(var(--bg-000))')
    expect(style.getPropertyValue('--dsw-alias-label-primary')).toBe('hsl(var(--text-000))')
    expect(style.getPropertyValue('--dsw-alias-state-business-primary')).toBe('hsl(var(--accent-brand))')
    expect(style.getPropertyValue('--dsw-font-family')).toBe('var(--font-ui)')

    await act(async () => { root.unmount() })
  })
})
