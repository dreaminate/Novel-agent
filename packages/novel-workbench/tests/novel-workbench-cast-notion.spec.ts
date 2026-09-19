// @vitest-environment jsdom
// I-P5e: the cast board goes Notion's database card — one card per person, and
// the card's fields lined up as properties.
//
// The card carried its facts as three loose sentences: the summary, a line
// prefixed 情绪：, and a run of aspect words joined by dots. Nothing lined up
// with anything, so comparing two people meant reading both cards in full. A
// Notion card is a property list: the key holds a fixed column and the values
// line up down it, which is what makes a board of them scannable.
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import { CastView } from '../src/client/CastView.js'
import { WORKBENCH_CSS } from '../src/client/workbench-css.js'

const board = {
  revision: 5,
  people: [
    {
      id: 'guchen', name: '顾尘', faction: '天机阁', aspects: 1,
      summary: '阁主初立', emotion: '沉稳', aspectNames: ['status'],
    },
    {
      id: 'linxuan', name: '林轩', faction: undefined, aspects: 1,
      summary: '君家天骄', aspectNames: ['persona'],
    },
  ],
  factions: [],
  relations: [],
}

async function mountCast() {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => { root.render(createElement(CastView as never, { board } as never)) })
  await act(async () => {})
  return { container, root }
}

const css = (): string => WORKBENCH_CSS

describe('novel-mode 人物与关系, against the Notion database card (I-P5e)', () => {
  it('lists each card\'s facts as properties, not as loose sentences', async () => {
    const { container } = await mountCast()
    const card = container.querySelector('[data-novel-person="guchen"]')
    const rows = card?.querySelectorAll('.nw-cast-field') ?? []
    expect(rows.length).toBeGreaterThanOrEqual(2)
    // Every property row has a key and a value; a row missing either is a
    // sentence that got half-converted.
    for (const row of rows) {
      expect(row.querySelector('.nw-cast-key')?.textContent ?? '').not.toBe('')
      expect(row.querySelector('.nw-cast-value')?.textContent ?? '').not.toBe('')
    }
    // 情绪 is a property now, not a prefix glued onto the front of a sentence.
    const text = card?.textContent ?? ''
    expect(text).toContain('情绪')
    expect(text).not.toContain('情绪：')
  })

  it('gives the keys a column so they line up down the card', async () => {
    await mountCast()
    const rule = css().match(/\.nw-cast-fields \{([^}]*)\}/u)?.[1] ?? ''
    expect(rule).toMatch(/display:\s*grid/u)
    // One column for the keys and one for the values — the alignment is the
    // whole point of the arrangement.
    expect(rule).toMatch(/grid-template-columns:[^;]*max-content/u)
  })

  it('still shows one person, their faction and their way in', async () => {
    const { container } = await mountCast()
    const card = container.querySelector('[data-novel-person="guchen"]')
    expect(card?.textContent).toContain('顾尘')
    expect(card?.textContent).toContain('天机阁')
    expect(card?.querySelector('[data-novel-person-open]')).not.toBeNull()
  })
})
