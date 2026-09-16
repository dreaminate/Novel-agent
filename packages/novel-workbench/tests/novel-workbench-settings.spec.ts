// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import { NovelSettings } from '../src/client/NovelSettings.js'
import { getWorkbenchState, resetWorkbench, workbenchActions } from '../src/client/store.js'

/**
 * The prototype's 设置 sheet holds the choices an author makes once and expects
 * to keep: theme, 正文字号, 阅读行宽 and whether threads show tool activity. The
 * reading choices have to reach the reading canvas, so the sheet writes the same
 * store the canvas reads.
 */
describe('novel-mode settings sheet', () => {
  it('offers the four author choices and writes them to the frame store', async () => {
    resetWorkbench()
    workbenchActions.openSettings()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => { root.render(createElement(NovelSettings as never, {})) })

    const sheet = container.querySelector('[data-novel-settings]')
    expect(sheet).not.toBeNull()
    expect(sheet?.textContent).toContain('正文大小')
    expect(sheet?.textContent).toContain('阅读行宽')

    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-size="18"]')?.click()
    })
    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-measure="34"]')?.click()
    })
    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-activity="hide"]')?.click()
    })

    expect(getWorkbenchState().settings.readingSize).toBe(18)
    expect(getWorkbenchState().settings.readingMeasure).toBe(34)
    expect(getWorkbenchState().settings.showToolActivity).toBe(false)

    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-close]')?.click()
    })
    expect(getWorkbenchState().settingsOpen).toBe(false)

    await act(async () => { root.unmount() })
    resetWorkbench()
  })
})
