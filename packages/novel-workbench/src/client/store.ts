/**
 * Novel-mode workbench state: the transient UI facts the frame owns.
 *
 * Exactly two kinds live here — the column geometry the frame and `ctx.layout`
 * share, and which canvas the left column has switched to. Both are pure UI
 * state: DSH keeps the source of truth for sessions, workspaces and Canon, and
 * nothing in this module is persisted.
 */
import { useSyncExternalStore } from 'react'

/** Live column geometry (px; sidebar 0 = collapsed). */
export interface WorkbenchPanels {
  sidebar: number
  details: number
  narrow: boolean
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
  | 'simulation'
  | 'history'
  | 'advanced'

/** One entry of the left column's view segment. */
export interface WorkbenchViewEntry {
  readonly id: WorkbenchViewId
  readonly label: string
  /** False while the canvas is still to be built; that entry renders disabled. */
  readonly ready: boolean
}

/**
 * The view segment: the brief's order without 线程, which the thread segment
 * owns. The not-yet-built canvases stay listed (the information architecture is
 * fixed) but render disabled so the column never promises a surface it cannot
 * show.
 */
export const WORKBENCH_VIEWS: readonly WorkbenchViewEntry[] = [
  { id: 'map', label: '故事地图', ready: true },
  { id: 'review', label: '提案审阅', ready: true },
  { id: 'clues', label: '伏笔与线索', ready: false },
  { id: 'debts', label: '未收束债务', ready: false },
  { id: 'cast', label: '人物与关系', ready: false },
  { id: 'timeline', label: '时间线', ready: false },
  { id: 'memory', label: '写作记忆', ready: false },
  { id: 'simulation', label: '推演', ready: false },
  { id: 'history', label: '版本历史', ready: true },
]

/** The whole frame-visible UI state. */
export interface WorkbenchState {
  readonly panels: WorkbenchPanels
  /** The canvas the main column shows; `thread` hands the column to the conversation surface. */
  readonly view: WorkbenchViewId
  /** Chapter the work tree last opened; absent while the author follows a thread. */
  readonly chapterId: string | undefined
  /** Advanced surfaces stay hidden until the author opens them. */
  readonly advanced: boolean
  /** Bumped whenever accepted Canon moved, so the tree and canvases reload. */
  readonly revision: number
}

/** Default and collapsed widths for the navigation column. */
const SIDEBAR_DEFAULT = 280
const DETAILS_DEFAULT = 360

const DEFAULT_STATE: WorkbenchState = {
  panels: { sidebar: SIDEBAR_DEFAULT, details: 0, narrow: false },
  view: 'thread',
  chapterId: undefined,
  advanced: false,
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

  /** Flip the advanced surfaces; opening them switches the canvas to their hub. */
  toggleAdvanced(): void {
    const advanced = !state.advanced
    publish({
      ...state,
      advanced,
      view: advanced ? 'advanced' : state.view === 'advanced' ? 'thread' : state.view,
    })
  },

  /** Reload every Canon-derived surface (one accepted revision landed). */
  refresh(): void {
    publish({ ...state, revision: state.revision + 1 })
  },

  toggleSidebar(): void {
    const { panels } = state
    if (panels.narrow) return
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

  setNarrow(narrow: boolean): void {
    if (state.panels.narrow === narrow) return
    publish({ ...state, panels: { ...state.panels, narrow } })
  },
}

/** Drop every frame-local listener and reset the geometry (plugin unload). */
export function resetWorkbench(): void {
  state = DEFAULT_STATE
  listeners.clear()
}
