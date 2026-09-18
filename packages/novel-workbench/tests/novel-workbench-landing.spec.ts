// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import type { NovelWorkOutline } from '../src/client/novel-data.js'
import { NovelLanding } from '../src/client/NovelLanding.js'

/**
 * F4/S3: an author who opens 写作 before picking a chapter used to get a title
 * and a line of engineering prose. Nothing on that screen was a way forward, and
 * a work with no chapters at all had no way to get its first one — the product's
 * whole point is that the author writes, and on this screen they could not.
 *
 * This component owns both states: a work that has chapters to open, and a work
 * that has none and needs the architect.
 */
const outline = (chapters: { id: string; number: number; title: string; status: string }[]): NovelWorkOutline => ({
  revision: 5,
  groups: chapters.length === 0
    ? []
    : [{ id: 'vol-1', title: '第一卷', chapters }],
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

describe('novel-mode writing landing', () => {
  it('offers the first chapters to open, in the author\'s words', async () => {
    const { container } = await mountLanding()

    const card = container.querySelector('[data-novel-landing]')
    expect(card).not.toBeNull()
    // The first few, not all of them: this is a way in, not a table of contents.
    const entries = container.querySelectorAll('[data-novel-landing-chapter]')
    expect(entries).toHaveLength(3)
    expect(entries[0]?.getAttribute('data-novel-landing-chapter')).toBe('c1')
    expect(entries[0]?.textContent).toContain('第1章')
    expect(entries[0]?.textContent).toContain('开篇章')

    // No engineering prose on the screen the author lands on.
    const text = card?.textContent ?? ''
    expect(text).not.toContain('Canon')
    expect(text).not.toContain('workdir')
    expect(text).not.toContain('R5')
  })

  it('opens the chapter the author picks', async () => {
    const opened: string[] = []
    const { container } = await mountLanding({ onOpenChapter: (id: string) => { opened.push(id) } })

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-novel-landing-chapter="c2"]')?.click()
    })

    expect(opened).toEqual(['c2'])
  })

  it('offers to plan the first chapter when the work has none', async () => {
    let planned = 0
    const { container } = await mountLanding({
      outline: outline([]),
      onPlan: () => { planned += 1 },
    })

    const button = container.querySelector<HTMLButtonElement>('[data-novel-landing-plan]')
    expect(button).not.toBeNull()
    expect(button?.textContent).toContain('规划')

    await act(async () => { button?.click() })
    expect(planned).toBe(1)
  })

  it('offers the next chapter once every chapter is accepted', async () => {
    const { container } = await mountLanding({
      outline: outline([{ id: 'c1', number: 1, title: '开篇章', status: 'accepted' }]),
    })

    expect(container.querySelector('[data-novel-landing-plan]')).not.toBeNull()
  })

  it('does not offer to plan ahead while an accepted chapter is still unwritten', async () => {
    // 第三章 is still planned: the author has something to write, and adding
    // more structure before writing it is not what this screen is for.
    const { container } = await mountLanding()

    expect(container.querySelector('[data-novel-landing-plan]')).toBeNull()
  })

  it('says what planning will and will not do before it asks the agent', async () => {
    const confirmed: number[] = []
    const { container } = await mountLanding({
      outline: outline([]),
      planning: true,
      onConfirmPlan: () => { confirmed.push(1) },
    })

    const card = container.querySelector('[data-novel-landing-confirm]')
    expect(card).not.toBeNull()
    // The same promise the other consent cards make: a proposal, not a write.
    expect(card?.textContent).toContain('提案')
    expect(card?.textContent).toContain('接受')

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-novel-landing-confirm-yes]')?.click()
    })
    expect(confirmed).toHaveLength(1)
  })
})
