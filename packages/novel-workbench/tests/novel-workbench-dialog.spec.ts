// @vitest-environment jsdom
// `aria-modal` is a promise the frame has to keep. A dialog that does not take
// focus, does not hold Tab inside itself and does not give focus back is one the
// keyboard cannot use — and inside the shipped host, Tab out of our overlay does
// not land on our own UI, it lands in whatever else is mounted behind us.
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { NovelSettings } from '../src/client/NovelSettings.js'
import { PersonFileDrawer } from '../src/client/PersonFileDrawer.js'
import { workbenchActions } from '../src/client/store.js'

function tab(shiftKey = false): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
}

const focusables = (root: Element): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>('button:not([disabled])')].filter(node => node.tabIndex >= 0)

describe('novel-mode modal surfaces', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.replaceChildren()
    workbenchActions.closeSettings()
  })

  it('takes focus into the settings sheet and gives it back to its opener', async () => {
    const opener = document.createElement('button')
    opener.textContent = '设置'
    document.body.append(opener)
    opener.focus()

    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => { workbenchActions.openSettings() })
    await act(async () => { root.render(createElement(NovelSettings as never, {})) })
    await act(async () => {})

    const sheet = container.querySelector('[data-novel-settings]')
    expect(sheet).not.toBeNull()
    expect(sheet?.contains(document.activeElement)).toBe(true)

    await act(async () => { root.unmount() })
    expect(document.activeElement).toBe(opener)
  })

  it('keeps Tab inside the settings sheet, in both directions', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => { workbenchActions.openSettings() })
    await act(async () => { root.render(createElement(NovelSettings as never, {})) })
    await act(async () => {})

    const sheet = container.querySelector('[data-novel-settings]')
    const items = focusables(sheet!)
    expect(items.length).toBeGreaterThan(2)
    const first = items[0]!
    const last = items[items.length - 1]!

    last.focus()
    await act(async () => { last.dispatchEvent(tab()) })
    expect(document.activeElement).toBe(first)

    first.focus()
    await act(async () => { first.dispatchEvent(tab(true)) })
    expect(document.activeElement).toBe(last)

    await act(async () => { root.unmount() })
  })

  it('pulls focus back into the sheet when it has escaped to the page behind', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)

    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => { workbenchActions.openSettings() })
    await act(async () => { root.render(createElement(NovelSettings as never, {})) })
    await act(async () => {})

    const sheet = container.querySelector('[data-novel-settings]')
    outside.focus()
    await act(async () => { outside.dispatchEvent(tab()) })
    expect(sheet?.contains(document.activeElement)).toBe(true)

    await act(async () => { root.unmount() })
  })

  it('does the same for the 人物档案 drawer', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()

    workbenchActions.openPersonFile('guchen')
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(PersonFileDrawer as never, {
        file: {
          id: 'guchen',
          name: '顾尘',
          faction: undefined,
          aspects: [],
          relations: [],
          appearances: [],
        },
        onClose: () => { workbenchActions.closePersonFile() },
        onContinueFrom: () => {},
      }))
    })
    await act(async () => {})

    const drawer = container.querySelector('[data-novel-person-file]')
    expect(drawer?.contains(document.activeElement)).toBe(true)

    const items = focusables(drawer!)
    const last = items[items.length - 1]!
    last.focus()
    await act(async () => { last.dispatchEvent(tab()) })
    expect(document.activeElement).toBe(items[0])

    await act(async () => { root.unmount() })
    expect(document.activeElement).toBe(opener)
  })
})
