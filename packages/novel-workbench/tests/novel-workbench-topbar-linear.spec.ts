// @vitest-environment jsdom
// I-P5a: the topbar goes Linear — one row, status in a secondary voice, and no
// control on it that the author did not come for.
//
// The bar had three always-visible theme buttons. That is the widest slot in the
// header spent on a setting an author changes twice a day, and it made the theme
// the loudest thing on a bar whose job is to say where the work stands. Linear's
// header rule is the opposite: exactly one thing is loud, everything else is
// legible but quiet.
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NovelTopbar } from '../src/client/NovelTopbar.js'
import { getWorkbenchState, resetWorkbench, workbenchActions } from '../src/client/store.js'
import { WORKBENCH_CSS } from '../src/client/workbench-css.js'

const works = [{
  workspaceId: 'ws-1',
  path: '/books/x',
  title: '天机阁主',
  sessionIds: ['s-6'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}]

const mounted: { root: Root; container: HTMLElement }[] = []

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => { entry.root.unmount() })
    entry.container.remove()
  }
  resetWorkbench()
})

async function mountTopbar() {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(createElement(NovelTopbar as never, {
      useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: works }),
      useSessions: (selector: (value: unknown) => unknown) => selector({ current: 's-6' }),
      loadOutline: async () => ({ revision: 5, groups: [], chapterCount: 0 }),
      loadReviews: async () => ({ acceptedRevision: 5, proposals: [] }),
      newThread: vi.fn(),
      actions: {
        // The real theme action, or the cycle would look broken rather than work.
        setTheme: (theme: never) => { workbenchActions.setTheme(theme) },
        toggleAdvanced: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleDetails: vi.fn(),
      },
    } as never))
  })
  await act(async () => {})
  mounted.push({ root, container })
  return { container, root }
}

const themeButton = (container: HTMLElement): HTMLButtonElement | null =>
  container.querySelector<HTMLButtonElement>('[data-novel-topbar-theme]')

const clickTheme = async (container: HTMLElement): Promise<void> => {
  await act(async () => { themeButton(container)?.click() })
  await act(async () => {})
}

describe('novel-mode topbar, against the Linear benchmark (I-P5a)', () => {
  it('offers the theme as one control that names the mode it is in', async () => {
    const { container } = await mountTopbar()
    workbenchActions.setTheme('auto')
    await act(async () => {})

    const button = themeButton(container)
    expect(button).not.toBeNull()
    // The mode is readable without opening anything: it is the button's own text.
    expect(button?.textContent).toBe('跟随系统')
    // And the three modes are not three buttons competing for the same slot. The
    // bar keeps 进阶 — the rail owns that switch too, but its label is hidden at
    // 1280 and below, so the bar's copy is the readable one in a narrow window.
    const right = container.querySelector('.right')
    expect(right?.querySelectorAll('.seg').length).toBe(0)
    expect(right?.querySelectorAll('button').length).toBeLessThanOrEqual(5)
  })

  it('cycles 跟随系统 → 日间 → 夜间 → 跟随系统, and says so each time', async () => {
    const { container } = await mountTopbar()
    workbenchActions.setTheme('auto')
    await act(async () => {})

    const read = (): string => themeButton(container)?.textContent ?? ''
    const seen: string[] = [read()]
    // Three presses walk the cycle and land back where it started.
    for (let step = 0; step < 3; step += 1) {
      await clickTheme(container)
      seen.push(read())
    }
    expect(seen).toStrictEqual(['跟随系统', '日间', '夜间', '跟随系统'])
    expect(getWorkbenchState().theme).toBe('auto')
  })

  it('keeps exactly one loud element: the revision badge is not the accent', async () => {
    // The badge says which revision the work stands at. Wearing the accent made
    // it the same colour as the bar's primary action, so two things shouted.
    const badge = WORKBENCH_CSS.match(/\.vbadge\s*\{[^}]*\}/u)?.[0] ?? ''
    expect(badge).not.toBe('')
    expect(badge).not.toMatch(/--accent-brand|--accent-text/u)
    expect(badge).toMatch(/--bg-300|--bg-200/u)
  })

  it('reads its status line as metadata, not as a second headline', async () => {
    const ctx = WORKBENCH_CSS.match(/\.topbar \.ctx\s*\{[^}]*\}/u)?.[0] ?? ''
    expect(ctx).toMatch(/font-size:\s*var\(--fs-12\)/u)
    expect(ctx).toMatch(/--text-200/u)
    // The bar never wraps: a second row would push the canvas down on every screen.
    const bar = WORKBENCH_CSS.match(/\.topbar\s*\{[^}]*\}/u)?.[0] ?? ''
    expect(bar).not.toMatch(/flex-wrap/u)
  })
})
