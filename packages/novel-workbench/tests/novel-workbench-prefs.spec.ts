// @vitest-environment jsdom
// The author's choices have to survive a reload, and a browser's storage is an
// untrusted input: it can be stale from an older build or edited by hand. So
// hydration validates every field against what this build can actually render,
// and a field it cannot use falls back to the shipped default rather than
// breaking the frame.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  WORKBENCH_PREFS_KEY,
  getWorkbenchState,
  hydrateWorkbench,
  resetWorkbench,
  workbenchActions,
} from '../src/client/store.js'

function stored(): unknown {
  const raw = localStorage.getItem(WORKBENCH_PREFS_KEY)
  return raw === null ? null : JSON.parse(raw)
}

describe('workbench preferences across a reload', () => {
  beforeEach(() => {
    localStorage.clear()
    resetWorkbench()
  })

  it('starts from the shipped defaults when the browser has nothing stored', () => {
    const state = getWorkbenchState()
    expect(localStorage.getItem(WORKBENCH_PREFS_KEY)).toBeNull()
    expect(state.view).toBe('editor')
    expect(state.theme).toBe('auto')
    expect(state.panels).toEqual({ sidebar: 248, details: 296 })
    expect(state.settings.readingSize).toBe(17)
    expect(state.settings.toolActivity).toBe(true)
  })

  it('writes the choices down as the author makes them', () => {
    workbenchActions.setView('map')
    workbenchActions.setTheme('night')
    workbenchActions.setReadingSize(18)
    workbenchActions.closeDetails()

    expect(stored()).toEqual({
      view: 'map',
      theme: 'night',
      panels: { sidebar: 248, details: 0 },
      settings: {
        readingSize: 18,
        readingMeasure: 40,
        readingIndent: 2,
        readingLeading: 1.85,
        completionEnabled: true,
        completionDelayMs: 900,
        toolActivity: true,
        refineMode: 'on-submit',
      },
    })
  })

  it('brings those choices back on the next load', () => {
    workbenchActions.setView('cast')
    workbenchActions.setTheme('day')
    workbenchActions.setReadingLeading(2.1)
    workbenchActions.toggleSidebar()
    workbenchActions.setRefineMode('while-writing')

    // A reload is a fresh module over the same storage.
    resetWorkbench()
    const state = getWorkbenchState()
    expect(state.view).toBe('cast')
    expect(state.theme).toBe('day')
    expect(state.panels.sidebar).toBe(0)
    expect(state.settings.readingLeading).toBe(2.1)
    expect(state.settings.refineMode).toBe('while-writing')
  })

  it('keeps a column width the author dragged', () => {
    // A dragged width is not one of a fixed set of choices — it is any number in
    // the panel's range, so validating against the defaults alone threw it away
    // on the next load. The real machine found this; the unit test had not asked.
    workbenchActions.setSidebarWidth(320)
    workbenchActions.setDetailsWidth(410)
    resetWorkbench()
    expect(getWorkbenchState().panels).toEqual({ sidebar: 320, details: 410 })
  })

  it('keeps nothing that belongs to a session', () => {
    workbenchActions.setCurrentSession('s-6' as never)
    workbenchActions.rememberSubmission('s-6' as never, '夜里风大')
    workbenchActions.openPersonFile('guchen')
    workbenchActions.setTranscript([{ id: 'x', kind: 'user', text: '正文', streaming: false }])

    const raw = localStorage.getItem(WORKBENCH_PREFS_KEY) ?? ''
    expect(raw).not.toContain('s-6')
    expect(raw).not.toContain('夜里风大')
    expect(raw).not.toContain('guchen')
    expect(raw).not.toContain('正文')
    // The drawer and the settings sheet are where the author is standing, not
    // what they chose: reopening the app should not reopen a sheet.
    expect(getWorkbenchState().personFileId).toBe('guchen')
    resetWorkbench()
    expect(getWorkbenchState().personFileId).toBeUndefined()
    expect(getWorkbenchState().settingsOpen).toBe(false)
  })

  it('ignores storage it cannot parse, and keeps the defaults', () => {
    expect(hydrateWorkbench('not json at all').view).toBe('editor')
    expect(hydrateWorkbench('[]').theme).toBe('auto')
    expect(hydrateWorkbench('null').settings.readingSize).toBe(17)
  })

  it('falls back field by field when a stored value is not renderable', () => {
    const state = hydrateWorkbench(JSON.stringify({
      view: 'storybook',
      theme: 'sepia',
      // 'wide' is not a width; 900 is outside every panel range this build draws.
      panels: { sidebar: 'wide', details: 900 },
      settings: {
        readingSize: 99,
        readingMeasure: '40',
        readingIndent: 7,
        readingLeading: 0,
        completionEnabled: 'yes',
        completionDelayMs: 10,
        toolActivity: null,
        refineMode: 'always',
      },
    }))

    expect(state.view).toBe('editor')
    expect(state.theme).toBe('auto')
    expect(state.panels).toEqual({ sidebar: 248, details: 296 })
    expect(state.settings).toEqual({
      readingSize: 17,
      readingMeasure: 40,
      readingIndent: 2,
      readingLeading: 1.85,
      completionEnabled: true,
      completionDelayMs: 900,
      toolActivity: true,
      refineMode: 'on-submit',
    })
  })

  it('accepts a stored choice it does understand next to one it does not', () => {
    const state = hydrateWorkbench(JSON.stringify({
      view: 'timeline',
      theme: 'sepia',
      settings: { readingSize: 16, completionDelayMs: 1500 },
    }))

    expect(state.view).toBe('timeline')
    expect(state.theme).toBe('auto')
    expect(state.settings.readingSize).toBe(16)
    expect(state.settings.completionDelayMs).toBe(1500)
    expect(state.settings.readingIndent).toBe(2)
  })

  it('does not write on a change the author did not make', () => {
    // A session event or a Canon refresh is not a preference. Writing on every
    // publish would put the browser's storage on the hot path of the whole
    // frame, so this counts writes rather than comparing what ended up stored —
    // rewriting the same value would pass the weaker check.
    const writes = vi.spyOn(Storage.prototype, 'setItem')
    workbenchActions.setView('map')
    expect(writes).toHaveBeenCalledTimes(1)

    writes.mockClear()
    workbenchActions.refresh()
    workbenchActions.resize(1280)
    workbenchActions.setCurrentSession('s-6' as never)
    workbenchActions.setTranscript([{ id: 'x', kind: 'user', text: '正文', streaming: false }])
    expect(writes).not.toHaveBeenCalled()
  })

  it('comes back to the chapter the author was writing', () => {
    // F2c: losing the chapter on reload sends the author back to the rail to
    // find their place again, which reads as work lost even when the prose is
    // safe on disk.
    workbenchActions.openChapter('vol01-ch0001')

    resetWorkbench()
    expect(getWorkbenchState().chapterId).toBe('vol01-ch0001')
  })

  it('falls back when the stored chapter is not a chapter id', () => {
    expect(hydrateWorkbench(JSON.stringify({ chapterId: 42 })).chapterId).toBeUndefined()
    expect(hydrateWorkbench(JSON.stringify({ chapterId: { id: 'vol01-ch0001' } })).chapterId)
      .toBeUndefined()
    expect(hydrateWorkbench(JSON.stringify({ chapterId: '' })).chapterId).toBeUndefined()
    expect(hydrateWorkbench(JSON.stringify({ chapterId: 'vol01-ch0002' })).chapterId)
      .toBe('vol01-ch0002')
  })

  it('writes the chapter down, and keeps nothing else about the thread', () => {
    workbenchActions.openChapter('vol01-ch0001')
    expect(stored()).toMatchObject({ chapterId: 'vol01-ch0001' })
    expect(localStorage.getItem(WORKBENCH_PREFS_KEY) ?? '').not.toContain('session-1')
  })
})
