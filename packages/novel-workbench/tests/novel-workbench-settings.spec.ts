// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import { NovelSettings } from '../src/client/NovelSettings.js'
import { getWorkbenchState, resetWorkbench, workbenchActions } from '../src/client/store.js'

/**
 * The 设置 sheet holds the choices an author makes once and expects to keep:
 * theme, 正文字号 and 阅读行宽. The reading choices have to reach the reading
 * canvas, so the sheet writes the same store the canvas reads.
 *
 * The sheet offers nothing it cannot honor: the transcript belongs to the
 * shipped conversation surface, so a 工具活动 switch here would be a control
 * with no effect, and the sheet must not carry one.
 */
describe('novel-mode settings sheet', () => {
  it('offers only the choices the frame applies, and writes them to the frame store', async () => {
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

    // A control whose effect it cannot deliver is worse than no control: the
    // transcript is rendered by the shipped conversation surface, not here.
    expect(sheet?.querySelector('[data-novel-settings-activity]')).toBeNull()
    expect(Object.keys(getWorkbenchState().settings))
      .toEqual(['readingSize', 'readingMeasure', 'readingIndent', 'readingLeading'])

    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-size="18"]')?.click()
    })
    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-measure="34"]')?.click()
    })
    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-indent="0"]')?.click()
    })
    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-leading="2.1"]')?.click()
    })

    expect(getWorkbenchState().settings.readingSize).toBe(18)
    expect(getWorkbenchState().settings.readingMeasure).toBe(34)
    // Honoured by the editor's reading state, which is why they may be offered.
    expect(getWorkbenchState().settings.readingIndent).toBe(0)
    expect(getWorkbenchState().settings.readingLeading).toBe(2.1)

    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-close]')?.click()
    })
    expect(getWorkbenchState().settingsOpen).toBe(false)

    await act(async () => { root.unmount() })
    resetWorkbench()
  })
})
