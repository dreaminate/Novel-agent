// @vitest-environment jsdom
// I-P5c: the landing goes Heptabase — cards, and the card is the action.
//
// The screen offered a sentence and then a stack of three rows with a button
// under them. A stack of rows is a table of contents: the author reads down it
// and then has to decide where the "do something" is. A welcome screen is a set
// of places to start, and on Heptabase's every place is a card you can press.
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import type { NovelWorkOutline } from '../src/client/novel-data.js'
import { NovelLanding } from '../src/client/NovelLanding.js'

const outline = (chapters: { id: string; number: number; title: string; status: string }[]): NovelWorkOutline => ({
  revision: 5,
  groups: chapters.length === 0 ? [] : [{ id: 'vol-1', title: '第一卷', chapters }],
  chapterCount: chapters.length,
} as unknown as NovelWorkOutline)

const chapters = [
  { id: 'c1', number: 1, title: '开篇章', status: 'accepted' },
  { id: 'c2', number: 2, title: '夜航', status: 'pending' },
  { id: 'c3', number: 3, title: '旧瓦', status: 'planned' },
  { id: 'c4', number: 4, title: '第四个', status: 'planned' },
]

const mounted: { root: Root; container: HTMLElement }[] = []

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => { entry.root.unmount() })
    entry.container.remove()
  }
})

async function mountLanding(overrides: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(createElement(NovelLanding as never, {
      outline: outline(chapters),
      onOpenChapter: () => {},
      onPlan: () => {},
      ...overrides,
    } as never))
  })
  await act(async () => {})
  mounted.push({ root, container })
  return { container, root }
}

const css = (container: HTMLElement): string =>
  container.querySelector('[data-novel-landing] style')?.textContent ?? ''

describe('novel-mode landing, against the Heptabase welcome (I-P5c)', () => {
  it('lays the ways in out as a grid of cards, not a stack of rows', async () => {
    const { container } = await mountLanding()

    const grid = container.querySelector('[data-novel-landing] > .nw-landing-cards')
    expect(grid).not.toBeNull()
    // Every way in is inside the grid, so the author reads one set of choices.
    expect(grid?.querySelectorAll('[data-novel-landing-chapter]').length).toBe(3)
    expect(grid?.querySelectorAll('[data-novel-landing-chapter]').length)
      .toBe(container.querySelectorAll('[data-novel-landing-chapter]').length)

    const rule = css(container).match(/\[data-novel-landing\] \.nw-landing-cards \{([^}]*)\}/u)?.[1] ?? ''
    expect(rule).toMatch(/display:\s*grid/u)
    expect(rule).toMatch(/grid-template-columns:[^;]*repeat\(/u)
  })

  it('makes the way to a new chapter a card in that same grid', async () => {
    // With no chapters at all the only way forward is the plan action, and it
    // has to look like the other cards: a button under a grid is the shape this
    // screen just stopped being.
    const { container } = await mountLanding({ outline: outline([]) })

    const grid = container.querySelector('[data-novel-landing] > .nw-landing-cards')
    const plan = grid?.querySelector('[data-novel-landing-plan]')
    expect(plan).not.toBeNull()
    expect(plan?.className).toContain('nw-landing-card')
    expect(plan?.textContent).toContain('规划')
  })

  it('puts the number, the title and the state on every card', async () => {
    const { container } = await mountLanding()
    const card = container.querySelector('[data-novel-landing-chapter="c2"]')
    expect(card?.textContent).toContain('第2章')
    expect(card?.textContent).toContain('夜航')
    expect(card?.textContent).toContain('待审')
    // The card is one control: it presses as a whole, and nothing inside it is
    // its own button.
    expect(card?.tagName).toBe('BUTTON')
    expect(card?.querySelectorAll('button').length).toBe(0)
  })

  it('gives the card a line to lead with, so it scans down the grid', async () => {
    const { container } = await mountLanding()
    const rule = css(container).match(/\.nw-landing-card \{([^}]*)\}/u)?.[1] ?? ''
    // A card is a small column: leading line, title, then the quiet meta line.
    expect(rule).toMatch(/display:\s*(grid|flex)/u)
    expect(rule).toMatch(/flex-direction:\s*column|grid-template-areas|grid-auto-flow:\s*row/u)
    // The title is the card's own text size, not the body's.
    expect(css(container)).toMatch(/\.nw-landing-card-title \{[^}]*font-size/u)
  })
})
