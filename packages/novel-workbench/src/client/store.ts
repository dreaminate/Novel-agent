/**
 * Novel-mode workbench state: the transient UI facts the frame owns.
 *
 * Exactly two kinds live here — the geometry and switches the frame shares with
 * the columns and the composer, and which canvas the main column shows. All of
 * it is pure UI state: DSH keeps the source of truth for sessions, workspaces
 * and Canon.
 *
 * The author's own choices outlive a page load and are written to the browser's
 * storage; see {@link hydrateWorkbench} for why that is a boundary that has to
 * be validated rather than trusted.
 *
 * `view` is `thread` or `advanced` whenever the main column belongs to the
 * conversation surface rather than to a novel canvas.
 */
import { useSyncExternalStore } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { RAIL_MAX, RAIL_MIN, SIDE_MAX, SIDE_MIN, clampWidth } from './frame-columns.js'
import type { TranscriptEntry } from './transcript-data.js'

/** Live shell geometry (px; sidebar 0 = collapsed rail, details 0 = no context column). */
export interface WorkbenchPanels {
  sidebar: number
  details: number
}

/** Modifier both slot renderers and key handlers set; `auto` follows the host theme. */
export type WorkbenchTheme = 'auto' | 'day' | 'night'

/**
 * When refinement runs.
 *
 * `on-submit` is the default: the author writes, and the settings are drawn out
 * of what they wrote when they hand the chapter over — plus whenever they ask
 * again. `while-writing` runs it during writing too, for authors who want the
 * world to keep up as they go.
 */
export type RefineMode = 'on-submit' | 'while-writing'

/** The choices the 设置 sheet owns: they change how the workbench reads, not the story. */
export interface WorkbenchSettings {
  /** Reading body size in px (the prototype offers 16 / 17 / 18). */
  readonly readingSize: number
  /** Reading line length in em, i.e. roughly characters per line (34 / 40). */
  readonly readingMeasure: number
  /**
   * First-line indent in em (0 = flush, 2 = the Chinese 段首缩进 two characters).
   * A manuscript convention, so it belongs to the author's reading choices
   * rather than to any one surface.
   */
  readonly readingIndent: number
  /** Reading line height as a multiple of the body size (1.6 / 1.85 / 2.1). */
  readonly readingLeading: number
  /** Whether a pause asks the model for a sentence-level continuation. */
  readonly completionEnabled: boolean
  /** How long the author has to stop typing before that request goes out. */
  readonly completionDelayMs: number
  /**
   * Whether the thread shows tool activity. Honoured by `NovelTranscript`, which
   * the frame renders itself — which is what makes this offerable again.
   */
  readonly toolActivity: boolean
  /**
   * When refinement runs. The state exists ahead of the control on purpose: the
   * sheet does not offer a switch until there is something for it to switch, and
   * the refinement path itself is I5.2 / I5.3.
   */
  readonly refineMode: RefineMode
}

/** Live width of the seat the frame renders into. */
export interface WorkbenchWindow {
  readonly width: number
  nearLimit: boolean
}

/**
 * A place the author dragged a story-map character to and left there.
 *
 * Pins outlive a reload because "this is where it belongs" is the author's
 * edit to the map's layout, not a transient view state. The key is the
 * character id; the store owns one map per work, and the canvas reads the
 * slice that belongs to the work it is showing.
 */
export interface MapPin {
  readonly x: number
  readonly y: number
}

/** Every canvas the workbench can show in the main column. */
export type WorkbenchViewId =
  | 'editor'
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
  // 写作 first: this is the surface the author works in, and the one the rail
  // should put within reach without scrolling.
  { id: 'editor', label: '写作', icon: 'M3 2h10v12H3zM5 5h6M5 8h6M5 11h3', ready: true },
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
  /**
   * The current session's log reduced to transcript lines. This is a *view* of
   * the shipped session log, never a second message store: `index.tsx` recomputes
   * it from the binding's `eventSource` on every append.
   */
  readonly transcript: readonly TranscriptEntry[]
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
  /**
   * Characters the author pinned on the story map, keyed by character id.
   * The canvas applies these after the force layout settles, so a pin holds
   * its place across a reload instead of being re-laid-out.
   */
  readonly mapPins: ReadonlyMap<string, MapPin>
}

/** Default geometry: the prototype's 248 / 296 columns. */
const SIDEBAR_DEFAULT = 248
const DETAILS_DEFAULT = 296
/**
 * The prototype's 窄窗 width, and the one the sweep resizes to. At or below it
 * the rail folds to icons and the conversation column floats, so the manuscript
 * keeps the page instead of paying for two fixed columns.
 */
export const NARROW_AT = 1280

/** Render inside a seat at or below {@link NARROW_AT}. */
function narrowAt(width: number): boolean {
  return width <= NARROW_AT
}

const DEFAULT_STATE: WorkbenchState = {
  panels: { sidebar: SIDEBAR_DEFAULT, details: DETAILS_DEFAULT },
  // The prototype opens on the workbench, not on the conversation. The landing
  // is the editor now: an author opens the app to write, and the story map is
  // one rail entry away.
  view: 'editor',
  chapterId: undefined,
  advanced: false,
  advancedGroup: 'core',
  theme: 'auto',
  settings: {
    readingSize: 17,
    readingMeasure: 40,
    readingIndent: 2,
    readingLeading: 1.85,
    // On, but not eager: a 900ms pause is the author stopping to think, which is
    // the moment a continuation is welcome and the moment it is least in the way.
    completionEnabled: true,
    completionDelayMs: 900,
    /**
     * Whether the thread shows what the model did, not only what it said. On by
     * default: an author who cannot see that work is happening is being asked to
     * trust a blank page.
     */
    toolActivity: true,
    // The author writes first and the world catches up when they hand the
    // chapter over. Refining while they write is the option, not the default:
    // proposals arriving mid-sentence are nobody's idea of help.
    refineMode: 'on-submit',
  },
  settingsOpen: false,
  personFileId: undefined,
  lastSubmission: undefined,
  turnFailure: undefined,
  transcript: [],
  window: { width: 1440, nearLimit: false },
  newThreadToken: 0,
  sessionId: undefined,
  revision: 0,
  mapPins: new Map<string, MapPin>(),
}

/**
 * Where the author's choices wait for the next page load.
 *
 * Only choices live here: the canvas they were on, the theme, the two column
 * widths and the 设置 sheet's own values. A session, a transcript, a drawer and
 * the last submission are where the author *is*, not what they decided, and
 * reopening the workbench should not reopen them.
 */
export const WORKBENCH_PREFS_KEY = 'novel-workbench/prefs'

const THEMES: readonly WorkbenchTheme[] = ['auto', 'day', 'night']
const REFINE_MODES: readonly RefineMode[] = ['on-submit', 'while-writing']
const READING_SIZES = [16, 17, 18] as const
const READING_MEASURES = [34, 40] as const
const READING_INDENTS = [0, 2] as const
const READING_LEADINGS = [1.6, 1.85, 2.1] as const
const COMPLETION_DELAYS = { min: 300, max: 2000 } as const

/**
 * Read the author's choices back, one field at a time.
 *
 * What is in a browser's storage is not trusted input: it can be left over from
 * an older build, edited by hand, or written by something else on the origin.
 * A field this build cannot render falls back to the shipped default rather
 * than being coerced into a value the author never picked.
 */
export function hydrateWorkbench(raw: string | null, base: WorkbenchState = DEFAULT_STATE): WorkbenchState {
  const stored = parsePrefs(raw)
  const panels = isRecord(stored?.['panels']) ? stored['panels'] : {}
  const settings = isRecord(stored?.['settings']) ? stored['settings'] : {}
  return {
    ...base,
    view: oneOf(stored?.['view'], WORKBENCH_VIEWS.map(entry => entry.id), base.view),
    theme: oneOf(stored?.['theme'], THEMES, base.theme),
    chapterId: textOr(stored?.['chapterId'], base.chapterId),
    panels: {
      sidebar: panelWidthOr(panels['sidebar'], RAIL_MIN, RAIL_MAX, base.panels.sidebar),
      details: panelWidthOr(panels['details'], SIDE_MIN, SIDE_MAX, base.panels.details),
    },
    settings: {
      readingSize: oneOfNumber(settings['readingSize'], READING_SIZES, base.settings.readingSize),
      readingMeasure: oneOfNumber(settings['readingMeasure'], READING_MEASURES, base.settings.readingMeasure),
      readingIndent: oneOfNumber(settings['readingIndent'], READING_INDENTS, base.settings.readingIndent),
      readingLeading: oneOfNumber(settings['readingLeading'], READING_LEADINGS, base.settings.readingLeading),
      completionEnabled: booleanOr(settings['completionEnabled'], base.settings.completionEnabled),
      completionDelayMs: rangeOr(settings['completionDelayMs'], base.settings.completionDelayMs),
      toolActivity: booleanOr(settings['toolActivity'], base.settings.toolActivity),
      refineMode: oneOf(settings['refineMode'], REFINE_MODES, base.settings.refineMode),
    },
    mapPins: mapPinsOr(stored?.['mapPins'], base.mapPins),
  }
}

/** The slice that outlives a page load, as the stored string. */
export function dehydrateWorkbench(state: WorkbenchState): string {
  return JSON.stringify({
    view: state.view,
    theme: state.theme,
    // The chapter is where the author was working, not which thread they had
    // open: reloading into "pick a chapter" makes them find their place again,
    // which reads as lost work even when the prose is safe on disk.
    chapterId: state.chapterId,
    panels: { sidebar: state.panels.sidebar, details: state.panels.details },
    settings: state.settings,
    // Map pins are the author's edit to the story map's layout; losing them on
    // reload reads as the map forgetting what the author told it. The Map is
    // serialised as a plain object so JSON can carry it.
    mapPins: Object.fromEntries(state.mapPins),
  })
}

function parsePrefs(raw: string | null): Record<string, unknown> | undefined {
  if (raw === null) return undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? value as T
    : fallback
}

function oneOfNumber(value: unknown, allowed: readonly number[], fallback: number): number {
  return typeof value === 'number' && allowed.includes(value) ? value : fallback
}

/**
 * A panel width preference: 0 is closed, anything else is a width the author
 * dragged, so it has to sit in the same range the drag itself clamps to. A
 * stored width outside that range is from another build's contract, not a value
 * this one knows how to draw.
 */
function panelWidthOr(value: unknown, min: number, max: number, fallback: number): number {
  if (value === 0) return 0
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
    ? Math.round(value)
    : fallback
}

function rangeOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    && value >= COMPLETION_DELAYS.min && value <= COMPLETION_DELAYS.max
    ? Math.round(value)
    : fallback
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * A stored string that only means something when it has content — a chapter id,
 * which this build cannot check against anything until the outline arrives, but
 * which is never empty. Anything else falls back rather than being rendered.
 */
function textOr(value: unknown, fallback: string | undefined): string | undefined {
  return typeof value === 'string' && value !== '' ? value : fallback
}

/**
 * Read the author's map pins back from storage.
 *
 * Each pin is a `{ x, y }` pair keyed by character id. A pin with non-finite
 * coordinates or the wrong shape is dropped rather than coerced, because a pin
 * the renderer cannot place is worse than no pin at all.
 */
function mapPinsOr(value: unknown, fallback: ReadonlyMap<string, MapPin>): ReadonlyMap<string, MapPin> {
  if (!isRecord(value)) return fallback
  const pins = new Map<string, MapPin>()
  for (const [id, raw] of Object.entries(value)) {
    if (!isRecord(raw)) continue
    const x = raw['x']
    const y = raw['y']
    if (typeof x !== 'number' || !Number.isFinite(x)) continue
    if (typeof y !== 'number' || !Number.isFinite(y)) continue
    pins.set(id, { x, y })
  }
  return pins.size === 0 ? fallback : pins
}

/**
 * The author's storage, or nothing.
 *
 * A browser can refuse storage outright (private mode, a blocked origin), and
 * reaching for it is where that shows up — so a frame that cannot persist
 * still runs, it just forgets.
 */
function prefsStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

function loadWorkbench(): WorkbenchState {
  const store = prefsStorage()
  return hydrateWorkbench(store === undefined ? null : store.getItem(WORKBENCH_PREFS_KEY))
}

function saveWorkbench(state: WorkbenchState): void {
  try {
    prefsStorage()?.setItem(WORKBENCH_PREFS_KEY, dehydrateWorkbench(state))
  } catch {
    // A full or blocked store is not a reason to fail the author's click.
  }
}

/**
 * Whether this change was one the author made.
 *
 * `settings` and `panels` are replaced wholesale on every write, so identity is
 * enough — and it keeps the store's storage off the hot path: a transcript
 * append or a Canon refresh must not rewrite anything.
 */
function prefsChanged(before: WorkbenchState, after: WorkbenchState): boolean {
  if (before.view !== after.view) return true
  if (before.theme !== after.theme) return true
  if (before.chapterId !== after.chapterId) return true
  if (before.panels !== after.panels) return true
  if (before.settings !== after.settings) return true
  // Map pins: compare by content, because every write produces a new Map.
  if (before.mapPins.size !== after.mapPins.size) return true
  for (const [id, pin] of after.mapPins) {
    const old = before.mapPins.get(id)
    if (old === undefined || old.x !== pin.x || old.y !== pin.y) return true
  }
  return false
}

let state: WorkbenchState = loadWorkbench()
const listeners = new Set<() => void>()

function publish(next: WorkbenchState): void {
  const before = state
  state = next
  if (prefsChanged(before, next)) saveWorkbench(next)
  for (const listener of listeners) listener()
}

/**
 * Whether a fresh reduction says the same thing as the one in state.
 *
 * The transcript is recomputed from the log on every append, so the array is
 * always new; without this guard every unrelated session event would re-render
 * the whole thread view.
 */
function sameTranscript(a: readonly TranscriptEntry[], b: readonly TranscriptEntry[]): boolean {
  if (a.length !== b.length) return false
  return a.every((line, at) => {
    const other = b[at]
    return other !== undefined
      && line.id === other.id
      && line.kind === other.kind
      && line.text === other.text
      && line.streaming === other.streaming
      && line.state === other.state
  })
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
      view: advanced ? 'advanced' : 'editor',
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

  /** First-line indent in em: flush or the Chinese two-character indent. */
  setReadingIndent(readingIndent: number): void {
    const next = readingIndent >= 1 ? 2 : 0
    if (state.settings.readingIndent === next) return
    publish({ ...state, settings: { ...state.settings, readingIndent: next } })
  },

  /** Reading line height, clamped to the three the sheet offers. */
  setReadingLeading(readingLeading: number): void {
    const next = Math.min(2.1, Math.max(1.6, readingLeading))
    if (state.settings.readingLeading === next) return
    publish({ ...state, settings: { ...state.settings, readingLeading: next } })
  },

  /** Turn the pause-triggered continuation on or off. */
  setCompletionEnabled(completionEnabled: boolean): void {
    if (state.settings.completionEnabled === completionEnabled) return
    publish({ ...state, settings: { ...state.settings, completionEnabled } })
  },

  /** How long a pause has to last before a continuation is asked for. */
  setCompletionDelayMs(completionDelayMs: number): void {
    const next = Math.min(2000, Math.max(300, Math.round(completionDelayMs)))
    if (state.settings.completionDelayMs === next) return
    publish({ ...state, settings: { ...state.settings, completionDelayMs: next } })
  },

  /** Whether the thread shows what the model did, or only what it said. */
  setToolActivity(toolActivity: boolean): void {
    if (state.settings.toolActivity === toolActivity) return
    publish({ ...state, settings: { ...state.settings, toolActivity } })
  },

  /** When refinement runs: with the submission, or while the author writes. */
  setRefineMode(refineMode: RefineMode): void {
    if (state.settings.refineMode === refineMode) return
    publish({ ...state, settings: { ...state.settings, refineMode } })
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

  /**
   * Remember the last sentence this session submitted.
   *
   * The composer belongs to the shipped conversation surface, which tells us
   * nothing, so the plugin reads this out of the session log instead — the
   * newest user line *is* the newest submission. Without it the failed-turn
   * strip could never offer to resend the sentence that failed.
   */
  rememberSubmission(sessionId: SessionId, text: string): void {
    if (state.lastSubmission?.sessionId === sessionId && state.lastSubmission.text === text) return
    publish({ ...state, lastSubmission: { sessionId, text } })
  },

  /** Mirror the current session's last failed turn (plugin-side, from the log). */
  setTurnFailure(turnFailure: WorkbenchState['turnFailure']): void {
    const same = state.turnFailure?.sessionId === turnFailure?.sessionId
      && state.turnFailure?.message === turnFailure?.message
    if (same) return
    publish({ ...state, turnFailure })
  },

  /** Replace the transcript with the current session log's reduction. */
  setTranscript(transcript: readonly TranscriptEntry[]): void {
    if (sameTranscript(state.transcript, transcript)) return
    publish({ ...state, transcript })
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

  /**
   * Drag the navigation column to a width. A drag never crosses the open/closed
   * line — that is what the toggle is for — so it clamps into the panel's range.
   */
  setSidebarWidth(width: number): void {
    const sidebar = clampWidth(width, RAIL_MIN, RAIL_MAX)
    if (state.panels.sidebar === sidebar) return
    publish({ ...state, panels: { ...state.panels, sidebar } })
  },

  openDetails(): void {
    if (state.panels.details === DETAILS_DEFAULT) return
    publish({ ...state, panels: { ...state.panels, details: DETAILS_DEFAULT } })
  },

  /** Drag the conversation column to a width; same clamps, same rule. */
  setDetailsWidth(width: number): void {
    const details = clampWidth(width, SIDE_MIN, SIDE_MAX)
    if (state.panels.details === details) return
    publish({ ...state, panels: { ...state.panels, details } })
  },

  closeDetails(): void {
    if (state.panels.details === 0) return
    publish({ ...state, panels: { ...state.panels, details: 0 } })
  },

  /** Mirror the rendered width; the columns fold by themselves near the limit. */
  resize(width: number): void {
    // A frame measured before layout reports 0, which is not an author on a tiny
    // window: acting on it would fold the rail on every load.
    if (width <= 0) return
    if (state.window.width === width) return
    publish({ ...state, window: { width, nearLimit: narrowAt(width) } })
  },

  /**
   * Pin a story-map character where the author dropped it. The pin outlives a
   * reload; clearing it is {@link clearMapPins}.
   */
  setMapPin(personId: string, pin: MapPin): void {
    const next = new Map(state.mapPins)
    next.set(personId, pin)
    publish({ ...state, mapPins: next })
  },

  /** Remove every pin the author set, the way 「解除全部钉位」 does. */
  clearMapPins(): void {
    if (state.mapPins.size === 0) return
    publish({ ...state, mapPins: new Map<string, MapPin>() })
  },
}

/** The thread the composer shows; the conversation surface owns the binding. */
export interface WorkbenchThreadBinding {
  readonly sessionId: SessionId | undefined
  readonly label: string
}

/**
 * Drop every frame-local listener and come back as a freshly loaded plugin.
 *
 * The author's choices stay: an unload and reload of the plugin is a reload of
 * the page as far as they are concerned.
 */
export function resetWorkbench(): void {
  state = loadWorkbench()
  listeners.clear()
}
