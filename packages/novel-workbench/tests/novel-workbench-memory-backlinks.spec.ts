// @vitest-environment jsdom
// I-P5f: 写作记忆 goes Obsidian's backlinks panel — a dense reverse timeline,
// with the origin of each line carried as a chip.
//
// The board drew one card per remembered line, each with a progress bar whose
// width was `revision / acceptedRevision`. That is not a proportion of
// anything: it is a recency bar, and in a list already ordered newest-first the
// order *is* the recency. Obsidian's panel is what an author actually reads —
// a tight list of what the AI carries, each line pointing back at where it came
// from.
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import type { NovelMemoryBoard } from '../src/client/novel-data.js'
import { MemoryView } from '../src/client/MemoryView.js'
import { WORKBENCH_CSS } from '../src/client/workbench-css.js'

const board = (rows: { id: string; text: string; revision: number; sourceLabel: string; detail: string }[]): NovelMemoryBoard => ({
  revision: 5,
  rows,
} as unknown as NovelMemoryBoard)

/** Deliberately out of order: the view has to sort, not the caller. */
const rows = [
  { id: 'm1', text: '顾尘守着快要塌的阁', revision: 2, sourceLabel: '第1章', detail: '人物状态' },
  { id: 'm2', text: '林轩欠顾尘一个人情', revision: 5, sourceLabel: '第3章', detail: '关系' },
  { id: 'm3', text: '天机阁只剩三层', revision: 3, sourceLabel: '第2章', detail: '世界' },
]

const mounted: { root: Root; container: HTMLElement }[] = []

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => { entry.root.unmount() })
    entry.container.remove()
  }
})

async function mountMemory(memory: NovelMemoryBoard) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => { root.render(createElement(MemoryView as never, { memory })) })
  await act(async () => {})
  mounted.push({ root, container })
  return { container, root }
}

describe('novel-mode 写作记忆, against the Obsidian backlinks panel (I-P5f)', () => {
  it('reads newest first, whatever order it is handed', async () => {
    const { container } = await mountMemory(board(rows))
    const ids = [...container.querySelectorAll('[data-novel-memory-row]')]
      .map(node => node.getAttribute('data-novel-memory-row'))
    expect(ids).toStrictEqual(['m2', 'm3', 'm1'])
  })

  it('carries where each line came from as a chip, not as a sentence', async () => {
    const { container } = await mountMemory(board(rows))
    const row = container.querySelector('[data-novel-memory-row="m2"]')
    const chips = [...(row?.querySelectorAll('.chip') ?? [])].map(chip => chip.textContent ?? '')
    // 来源 is an anchor: the chapter it was written in, and the revision.
    expect(chips.some(text => text.includes('第3章'))).toBe(true)
    expect(chips.some(text => text.includes('R5'))).toBe(true)
  })

  it('is one dense list with rules between rows, not a card per line', async () => {
    const { container } = await mountMemory(board(rows))
    const list = container.querySelector('.nw-memory-list')
    expect(list).not.toBeNull()
    expect(list?.querySelectorAll('[data-novel-memory-row]').length).toBe(3)
    // A card per line is what this replaced: cards have their own box, radius
    // and shadow, and a panel of twelve lines becomes a column of boxes.
    expect(container.querySelectorAll('[data-novel-memory-row].card').length).toBe(0)
    expect(WORKBENCH_CSS).toMatch(/\.nw-memory-row \+ \.nw-memory-row \{[^}]*border-top/u)
  })

  it('drops the recency bar, which measured nothing', async () => {
    const { container } = await mountMemory(board(rows))
    expect(container.querySelector('.mem-band')).toBeNull()
    // And it is gone from the stylesheet too — a rule with no reader is dead code.
    expect(WORKBENCH_CSS).not.toMatch(/\.mem-band/u)
  })

  it('still says how many lines the AI will read', async () => {
    const { container } = await mountMemory(board(rows))
    expect(container.textContent).toContain('3 条摘要')
  })
})
