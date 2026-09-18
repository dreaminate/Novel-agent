// @vitest-environment jsdom
// I-P5b: the settings sheet goes macOS System Settings — one grouped pane, one
// row per setting, the control on the trailing edge and the explanation under
// its label.
//
// The sheet stacked label-above-control in loose blocks. That is a form: the eye
// has no column to run down, so finding "行高" means reading every block. A
// settings pane is scanned, not read, and the arrangement is the whole reason
// it can be.
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NovelSettings } from '../src/client/NovelSettings.js'
import { workbenchActions } from '../src/client/store.js'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  localStorage.clear()
  document.body.replaceChildren()
  workbenchActions.openSettings()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => { root.render(createElement(NovelSettings as never, {})) })
  act(() => {})
})

afterEach(() => {
  act(() => { root.unmount() })
  workbenchActions.closeSettings()
})

const sheet = (): HTMLElement => document.querySelector('[data-novel-settings]') as HTMLElement

describe('novel-mode settings sheet, against macOS System Settings (I-P5b)', () => {
  it('draws every setting inside one grouped pane', () => {
    const pane = sheet().querySelectorAll('.nv-setting-group')
    expect(pane.length).toBe(1)
    // Every row belongs to the pane. A setting left outside it would render as a
    // loose block with no separator and no container — the old arrangement,
    // surviving in one corner of the sheet.
    const all = sheet().querySelectorAll('.setting')
    const grouped = pane[0]?.querySelectorAll('.setting') ?? []
    expect(all.length).toBeGreaterThan(5)
    expect(grouped.length).toBe(all.length)
  })

  it('keeps every control reachable, with its label and note', () => {
    // The pane is built in CSS from markup this file still owns: the group has no
    // row wrapper of its own, so a missing label or an orphaned note would only
    // show up as a row that reads wrong.
    for (const row of sheet().querySelectorAll('.nv-setting-group .setting')) {
      expect(row.querySelector('.setting-label')?.textContent ?? '').not.toBe('')
      expect(row.querySelector('.seg')?.querySelectorAll('button').length ?? 0).toBeGreaterThan(1)
      // A note is optional — 主题 needs none, its three labels say what they are —
      // but one that renders empty is a row with a hole in it.
      const note = row.querySelector('.setting-note')
      if (note !== null) expect(note.textContent ?? '').not.toBe('')
    }
  })

  it('says the arrangement in the stylesheet, in the macOS shape', async () => {
    const { WORKBENCH_CSS } = await import('../src/client/workbench-css.js')
    expect(WORKBENCH_CSS).toBeTruthy()
    const css = sheet().querySelector('style')?.textContent ?? ''
    // Label and control share a row; the note sits under the label. Anything
    // else is not a settings row.
    const row = css.match(/\[data-novel-settings\] \.setting \{([^}]*)\}/u)?.[1] ?? ''
    expect(row).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) auto/u)
    expect(row).toMatch(/grid-template-areas:\s*"label control"\s*"note \."/u)
    // A hairline between rows, and only between rows — the pane is one object,
    // so the `+` combinator is what keeps the first row unruled.
    expect(css).toMatch(/\.setting \+ \.setting \{[^}]*border-top/u)
    // The pane wears the shared card radius rather than inventing one.
    const pane = css.match(/\[data-novel-settings\] \.nv-setting-group \{([^}]*)\}/u)?.[1] ?? ''
    expect(pane).toMatch(/border-radius:\s*var\(--r-card\)/u)
    expect(pane).toMatch(/--bg-000|--bg-100/u)
  })
})
