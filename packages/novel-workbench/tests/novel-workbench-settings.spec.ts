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
 * The sheet offers nothing it cannot honor. That rule used to exclude 工具活动 —
 * the transcript belonged to the shipped conversation surface, so the switch
 * would have been remembered and never applied. It is not excluded any more:
 * the frame renders the thread itself now, so the switch is back and what this
 * test has to show is that it is *honoured*, not merely stored.
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

    // Back, and no longer a control with no effect: NovelTranscript is ours, so
    // 工具活动 has somewhere to land. Its own spec shows the lines disappearing.
    expect(sheet?.querySelector('[data-novel-settings-activity]')).not.toBeNull()
    expect(Object.keys(getWorkbenchState().settings))
      .toEqual([
        'readingSize', 'readingMeasure', 'readingIndent', 'readingLeading',
        'completionEnabled', 'completionDelayMs', 'toolActivity', 'refineMode',
      ])

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

    // And these by the editor's completion mechanism, off the same reason.
    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-completion="false"]')?.click()
    })
    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-completion-delay="1500"]')?.click()
    })
    expect(getWorkbenchState().settings.completionEnabled).toBe(false)
    expect(getWorkbenchState().settings.completionDelayMs).toBe(1500)

    // And this one by the frame's own transcript.
    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-activity="false"]')?.click()
    })
    expect(getWorkbenchState().settings.toolActivity).toBe(false)

    await act(async () => {
      sheet?.querySelector<HTMLButtonElement>('[data-novel-settings-close]')?.click()
    })
    expect(getWorkbenchState().settingsOpen).toBe(false)

    await act(async () => { root.unmount() })
    resetWorkbench()
  })

  /**
   * The refine mode is state before it is a control, and that order is the point.
   *
   * The sheet may not carry a switch that does nothing — the same rule that kept
   * 工具活动 out until the frame rendered the thread itself. Neither refine mode
   * can be honoured yet, because the refinement path they choose between does not
   * exist (I5.2 / I5.3 build it). So the mode is remembered here and the control
   * waits; I5.1b offers it, and inverts the absence assertion below.
   */
  it('remembers the refine mode, and does not yet offer a switch for it', async () => {
    resetWorkbench()
    workbenchActions.openSettings()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => { root.render(createElement(NovelSettings as never, {})) })

    // Default: the world catches up when the author hands the chapter over.
    expect(getWorkbenchState().settings.refineMode).toBe('on-submit')

    workbenchActions.setRefineMode('while-writing')
    expect(getWorkbenchState().settings.refineMode).toBe('while-writing')
    workbenchActions.setRefineMode('on-submit')
    expect(getWorkbenchState().settings.refineMode).toBe('on-submit')

    // Honest absence, with a reason that is still true: there is nothing to
    // switch yet. Not the old reason — the transcript is ours now.
    expect(container.querySelector('[data-novel-settings-refine]')).toBeNull()

    await act(async () => { root.unmount() })
    resetWorkbench()
  })
})
