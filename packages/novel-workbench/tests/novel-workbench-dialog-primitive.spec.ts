// @vitest-environment jsdom
// One dialog, not four.
//
// The frame used to carry a hand-rolled focus trap plus, in each surface, its
// own Escape listener and its own overlay-click check. That is three chances to
// get `aria-modal` wrong, and one of them was: nothing hid the page behind the
// modal from a screen reader, so a dialog read as an overlay painted on top of
// a page that was still announcing itself.
//
// These assertions pin the two things a shared primitive buys — every modal
// surface is the same component, and the page behind it goes quiet — plus the
// one thing that must not drift: the two arrangements still look like each
// other because they read the same tokens.
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DIALOG_CSS } from '../src/client/novel-dialog.js'
import { PersonFileDrawer } from '../src/client/PersonFileDrawer.js'
import { NovelSettings } from '../src/client/NovelSettings.js'
import { workbenchActions } from '../src/client/store.js'

let container: HTMLDivElement
let root: Root

function mount(node: Parameters<typeof createElement>[0]): void {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => { root.render(createElement(node as never, {})) })
  act(() => {})
}

/** The dialog the surface just opened, wherever the portal put it. */
function dialog(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-novel-dialog]')
}

const person = {
  id: 'guchen',
  name: '顾尘',
  faction: undefined,
  aspects: [],
  relations: [],
  appearances: [],
}

beforeEach(() => {
  localStorage.clear()
  document.querySelectorAll('style[data-novel-workbench="css"]').forEach(tag => { tag.remove() })
  document.body.replaceChildren()
  workbenchActions.closeSettings()
  workbenchActions.closePersonFile()
})

afterEach(() => {
  act(() => { root?.unmount() })
})

describe('the one dialog primitive', () => {
  it('draws the settings sheet and the person drawer through the same element', () => {
    act(() => { workbenchActions.openSettings() })
    mount(NovelSettings)
    const sheet = dialog()
    expect(sheet).not.toBeNull()
    expect(sheet?.getAttribute('role')).toBe('dialog')
    expect(sheet?.getAttribute('data-state')).toBe('open')
    // The panel is named by its own heading, not by a second copy of the string:
    // `aria-labelledby` points at the visible title the author reads.
    expect(document.getElementById(sheet?.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('设置')

    act(() => { root.unmount() })
    document.body.replaceChildren()
    workbenchActions.closeSettings()

    act(() => { workbenchActions.openPersonFile('guchen') })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root.render(createElement(PersonFileDrawer as never, {
        file: person,
        onClose: () => { workbenchActions.closePersonFile() },
        onContinueFrom: () => {},
      }))
    })
    act(() => {})

    const drawer = dialog()
    expect(drawer).not.toBeNull()
    // Same component, different arrangement: the shared class is what carries
    // the shared radius, shadow and animation curve.
    expect(drawer?.className).toBe(sheet?.className)
    expect(drawer?.getAttribute('data-novel-dialog')).not.toBe(sheet?.getAttribute('data-novel-dialog'))
  })

  it('hides the page behind the modal from assistive tech, and gives it back', () => {
    const behind = document.createElement('button')
    behind.textContent = 'rail behind the sheet'
    document.body.append(behind)

    act(() => { workbenchActions.openSettings() })
    mount(NovelSettings)

    expect(behind.getAttribute('aria-hidden')).toBe('true')

    act(() => { workbenchActions.closeSettings() })
    act(() => {})
    expect(dialog()).toBeNull()
    expect(behind.getAttribute('aria-hidden')).toBeNull()
  })

  it('closes on Escape', () => {
    act(() => { workbenchActions.openSettings() })
    mount(NovelSettings)
    expect(dialog()).not.toBeNull()

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    act(() => {})
    expect(dialog()).toBeNull()
  })

  it('closes when the author clicks the dimmed page around it', async () => {
    act(() => { workbenchActions.openSettings() })
    mount(NovelSettings)
    const overlay = document.querySelector('[data-novel-dialog-overlay]')
    expect(overlay).not.toBeNull()

    // The primitive arms its outside-pointer listener on a zero-delay timer, so
    // the dismissal cannot fire from the very pointer event that opened it. Let
    // that timer run before knocking.
    await act(async () => { await new Promise(resolve => { setTimeout(resolve, 0) }) })
    act(() => {
      overlay?.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }))
    })
    act(() => {})
    expect(dialog()).toBeNull()
  })

  it('keeps one radius, one shadow and one animation curve for both arrangements', () => {
    // The shared look is not asserted by measuring a jsdom box — it is asserted
    // by reading the one stylesheet both arrangements are drawn from.
    const rules = DIALOG_CSS.match(/\.nv-dialog-content[^{]*\{[^}]*\}/gu) ?? []
    expect(rules.length).toBeGreaterThan(0)
    const shared = rules.join('\n')
    expect(shared).toMatch(/border-radius:\s*var\(--r-card\)/u)
    expect(shared).toMatch(/box-shadow:\s*var\(--sh-3\)/u)
    // Both states animate from the same declaration, so opening and closing the
    // two arrangements feel like one product.
    expect(DIALOG_CSS).toMatch(/\.nv-dialog-content\[data-state="closed"\][^{]*\{[^}]*animation/u)
  })
})
