/**
 * Novel-mode workbench state: the transient UI facts the frame owns.
 *
 * Exactly two kinds live here — the geometry and switches the frame shares with
 * the columns and the composer, and which canvas the main column shows. All of
 * it is pure UI state: DSH keeps the source of truth for sessions, workspaces
 * and Canon, and nothing in this module is persisted.
 *
 * `view` is `thread` or `advanced` whenever the main column belongs to the
 * conversation surface rather than to a novel canvas.
 */
import { useSyncExternalStore } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Live shell geometry (px; sidebar 0 = collapsed rail, details 0 = no context column). */
export interface WorkbenchPanels {
  sidebar: number
  details: number
}

/** Modifier both slot renderers and key handlers set; `auto` follows the host theme. */
export type WorkbenchTheme = 'auto' | 'day' | 'night'

/** The choices the 设置 sheet owns: they change how the workbench reads, not the story. */
export interface WorkbenchSettings {
  /** Reading body size in px (the prototype offers 16 / 17 / 18). */
  readonly readingSize: number
  /** Reading line length in em, i.e. roughly characters per line (34 / 40). */
  readonly readingMeasure: number
}

/** Live width of the seat the frame renders into. */
export interface WorkbenchWindow {
  readonly width: number
  nearLimit: boolean
}

/** Every canvas the workbench can show in the main column. */
export type WorkbenchViewId =
  | 'thread'
  | 'map'
  | 'review'
  | 'clues'
  | 'debts'
  | 'cast'
  | 'timeline'
  | 'memory'
  | 'contract'
  | 'simulation'
  | 'history'
  | 'read'
  | 'advanced'

/** One entry of the left column's view segment. */
export interface WorkbenchViewEntry {
  readonly id: WorkbenchViewId
  readonly label: string
  /** The prototype's inline icon path for this entry. */
  readonly icon: string
  /** False while the canvas is still to be built; that entry renders disabled. */
  readonly ready: boolean
}

/**
 * The view segment in the prototype's order: the story surfaces an author
 * moves between while writing, with 版本历史 last. 提案审阅 is not listed here —
 * the author reaches it from the waiting-proposal entry in the context column
 * and the canvas head, the way the prototype navigates.
 */
export const WORKBENCH_VIEWS: readonly WorkbenchViewEntry[] = [
  { id: 'map', label: '故事地图', icon: 'M2 3h12v10H2zM2 8h12M8 3v10', ready: true },
  { id: 'clues', label: '伏笔与线索', icon: 'M3 13l5-5 2 2 3-4M3 13h2', ready: true },
  { id: 'debts', label: '未收束债务', icon: 'M8 2v8M5 7l3 3 3-3M3 13h10', ready: true },
  { id: 'cast', label: '人物与关系', icon: 'M6 7a2 2 0 100-4 2 2 0 000 4zM2 13c0-2 2-3 4-3s4 1 4 3M11 6h3M11 9h3', ready: true },
  { id: 'timeline', label: '时间线', icon: 'M2 8h12M4 5v6M8 5v6M12 5v6', ready: true },
  { id: 'memory', label: '写作记忆', icon: 'M3 3h10v10H3zM5 6h6M5 9h4', ready: true },
  { id: 'contract', label: '本章合同', icon: 'M4 2h8v12H4zM6 5h4M6 8h4M6 11h2', ready: true },
  { id: 'simulation', label: '推演', icon: 'M8 2a6 6 0 106 6H8zM9 2v5h5', ready: true },
  { id: 'history', label: '版本历史', icon: 'M8 3v5l3 2M8 3a5 5 0 105 5', ready: true },
]

/** The whole frame-visible UI state. */
export interface WorkbenchState {
  readonly panels: WorkbenchPanels
  /** The canvas the main column shows; `thread` hands the column to the conversation. */
  readonly view: WorkbenchViewId
  /** Chapter the work tree last opened; absent while the author follows a thread. */
  readonly chapterId: string | undefined
  /** Advanced surfaces stay hidden until the author opens them. */
  readonly advanced: boolean
  /** Which advanced group the rail expands alongside the work. */
  readonly advancedGroup: string
  /** Theme modifier: `auto` follows the host theme, the other two force one. */
  readonly theme: WorkbenchTheme
  /** Author reading choices, owned by the 设置 sheet. */
  readonly settings: WorkbenchSettings
  /** Whether the 设置 sheet is open. */
  readonly settingsOpen: boolean
  /** The person whose 人物档案 drawer is open; absent while it is closed. */
  readonly personFileId: string | undefined
  /**
   * The last sentence this frame submitted into a session. The official
   * composer keeps its own draft and queue; this is only what the novel bar
   * sent, so a failed turn can be resent without guessing its text.
   */
  readonly lastSubmission: { readonly sessionId: SessionId; readonly text: string } | undefined
  /**
   * A turn that ended in failure, read from the session's own event window. The
   * Session snapshot only relays live failures that have no turn position
   * (`api-session/error`), so a failed *turn* is only visible here.
   */
  readonly turnFailure: { readonly sessionId: SessionId; readonly message: string } | undefined
  /** Live width of the frame's window, mirrored for slot renderers. */
  readonly window: WorkbenchWindow
  /** Start a new thread inside one work (the frame owns the request, the caller opens it). */
  readonly newThreadToken: number
  /**
   * The session the frame is showing. The Session Controller owns the selection;
   * this is the frame's mirror of it, so every seat re-renders together the
   * moment a thread opens or closes.
   */
  readonly sessionId: SessionId | undefined
  /** Bumped whenever accepted Canon moved, so the tree and canvases reload. */
  readonly revision: number
}

/** Default geometry: the prototype's 248 / 296 columns. */
const SIDEBAR_DEFAULT = 248
const DETAILS_DEFAULT = 296
const NARROW_LIMIT = 1120

/** Render inside a seat narrower than the prototype's comfortable canvas. */
function narrowAt(width: number): boolean {
  return width < NARROW_LIMIT
}

const DEFAULT_STATE: WorkbenchState = {
  panels: { sidebar: SIDEBAR_DEFAULT, details: DETAILS_DEFAULT },
  // The prototype opens on the workbench, not on the conversation: the story map
  // is the first screen and 线程 is one view the rail switches to.
  view: 'map',
  chapterId: undefined,
  advanced: false,
  advancedGroup: 'core',
  theme: 'auto',
  settings: { readingSize: 17, readingMeasure: 40 },
  settingsOpen: false,
  personFileId: undefined,
  lastSubmission: undefined,
  turnFailure: undefined,
  window: { width: 1440, nearLimit: false },
  newThreadToken: 0,
  sessionId: undefined,
  revision: 0,
}

let state: WorkbenchState = DEFAULT_STATE
const listeners = new Set<() => void>()

function publish(next: WorkbenchState): void {
  state = next
  for (const listener of listeners) listener()
}

/** Current workbench state (stable reference between mutations). */
export function getWorkbenchState(): WorkbenchState {
  return state
}

/** Observe workbench state; the frame and the canvases re-render on every change. */
export function subscribeWorkbench(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** React binding over {@link subscribeWorkbench}. */
export function useWorkbenchState(): WorkbenchState {
  return useSyncExternalStore(subscribeWorkbench, getWorkbenchState, getWorkbenchState)
}

/** Every write the frame, the left column and `ctx.layout` are allowed to make. */
export const workbenchActions = {
  setView(view: WorkbenchViewId): void {
    if (state.view === view) return
    publish({ ...state, view })
  },

  /** Point the canvas at one chapter; the caller decides which canvas shows it. */
  openChapter(chapterId: string | undefined): void {
    publish({ ...state, chapterId })
  },

  /** Flip the advanced surfaces; closing them returns to the work the author came from. */
  toggleAdvanced(): void {
    const advanced = !state.advanced
    publish({
      ...state,
      advanced,
      view: advanced ? 'thread' : state.view,
    })
  },

  /** Expand one advanced group next to the work (core / agent / jobs / diag). */
  setAdvancedGroup(advancedGroup: string): void {
    if (state.advancedGroup === advancedGroup) return
    publish({ ...state, advancedGroup })
  },

  /** Ask for one new thread; the surface owning `sessions` opens it. */
  requestNewThread(): void {
    publish({ ...state, newThreadToken: state.newThreadToken + 1 })
  },

  /** Mirror the Session Controller's current selection into the frame. */
  setCurrentSession(sessionId: SessionId | undefined): void {
    if (state.sessionId === sessionId) return
    publish({ ...state, sessionId })
  },

  /** Switch the day / night modifier; `auto` hands the choice back to the host theme. */
  setTheme(theme: WorkbenchTheme): void {
    if (state.theme === theme) return
    publish({ ...state, theme })
  },

  openSettings(): void {
    if (state.settingsOpen) return
    publish({ ...state, settingsOpen: true })
  },

  closeSettings(): void {
    if (!state.settingsOpen) return
    publish({ ...state, settingsOpen: false })
  },

  /** Reading size in px, clamped to the range the prototype offers. */
  setReadingSize(readingSize: number): void {
    const next = Math.min(18, Math.max(16, Math.round(readingSize)))
    if (state.settings.readingSize === next) return
    publish({ ...state, settings: { ...state.settings, readingSize: next } })
  },

  /** Reading measure in em, clamped to the prototype's two choices. */
  setReadingMeasure(readingMeasure: number): void {
    const next = Math.min(40, Math.max(34, Math.round(readingMeasure)))
    if (state.settings.readingMeasure === next) return
    publish({ ...state, settings: { ...state.settings, readingMeasure: next } })
  },

  /** Open one person's 人物档案 drawer. */
  openPersonFile(personId: string): void {
    if (state.personFileId === personId) return
    publish({ ...state, personFileId: personId })
  },

  closePersonFile(): void {
    if (state.personFileId === undefined) return
    publish({ ...state, personFileId: undefined })
  },

  /** Remember the sentence the novel bar just handed to a session. */
  rememberSubmission(sessionId: SessionId, text: string): void {
    publish({ ...state, lastSubmission: { sessionId, text } })
  },

  /** Mirror the current session's last failed turn (plugin-side, from the log). */
  setTurnFailure(turnFailure: WorkbenchState['turnFailure']): void {
    const same = state.turnFailure?.sessionId === turnFailure?.sessionId
      && state.turnFailure?.message === turnFailure?.message
    if (same) return
    publish({ ...state, turnFailure })
  },

  /** Reload every Canon-derived surface (one accepted revision landed). */
  refresh(): void {
    publish({ ...state, revision: state.revision + 1 })
  },

  /** Collapse or expand the navigation column. */
  toggleSidebar(): void {
    const { panels } = state
    publish({
      ...state,
      panels: { ...panels, sidebar: panels.sidebar === 0 ? SIDEBAR_DEFAULT : 0 },
    })
  },

  openDetails(): void {
    if (state.panels.details === DETAILS_DEFAULT) return
    publish({ ...state, panels: { ...state.panels, details: DETAILS_DEFAULT } })
  },

  closeDetails(): void {
    if (state.panels.details === 0) return
    publish({ ...state, panels: { ...state.panels, details: 0 } })
  },

  /** Mirror the rendered width; the columns collapse by themselves near the limit. */
  resize(width: number): void {
    if (state.window.width === width) return
    publish({ ...state, window: { width, nearLimit: narrowAt(width) } })
  },
}

/** The thread the composer shows; the conversation surface owns the binding. */
export interface WorkbenchThreadBinding {
  readonly sessionId: SessionId | undefined
  readonly label: string
}

/** Drop every frame-local listener and reset the geometry (plugin unload). */
export function resetWorkbench(): void {
  state = DEFAULT_STATE
  listeners.clear()
}
