/**
 * The novel-mode application frame: the root occupant that replaces
 * `dsh-client-ui-layout`'s AppFrame.
 *
 * The geometry is the prototype's `.app` grid — a topbar, the three sections
 * (left rail / canvas / right context column) and the composer dock — with the
 * prototype's class names, so `workbench-css.ts` styles it as drawn. The frame
 * declares the seats the novel surfaces and the conversation occupy: the
 * conversation keeps its own seat while a novel canvas is shown, so a thread
 * keeps its scroll position and draft across view switches.
 */
import { createElement, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import { NovelTranscript } from './NovelTranscript.js'
import { RAIL_COLLAPSED, RAIL_MAX, RAIL_MIN, SIDE_MAX, SIDE_MIN, solveColumns } from './frame-columns.js'
import { useWorkbenchState, workbenchActions } from './store.js'
import { WorkbenchStyleSheet } from './WorkbenchStyleSheet.js'

/** Bound panel actions handed to `ctx.layout` consumers. */
export interface WorkbenchPanelActions {
  toggleSidebar(): void
  openDetails(): void
  closeDetails(): void
}

/** Everything the root occupant receives from the slot framework. */
export type WorkbenchFrameProps = PropsRenderSlots<
  | 'sidebar'
  | 'novel.topbar'
  | 'conversation'
  | 'novel.thread.header'
  | 'novel.thread.notice'
  | 'novel.canvas'
  | 'shell.overlay'
>

/**
 * The frame's own rules: only what binds the prototype's grid to the host page
 * (full-window sizing and the night attribute the ported token sheet reads).
 * Everything the prototype drew lives in the ported stylesheet.
 */
const FRAME_CSS = `
/*
 * The prototype's grid is three fixed tracks. A collapsed column has to give its
 * track back, or the editor keeps paying for a column that is not there — which
 * is what "收起对话后正文拿到全宽" means literally. Driving both side tracks from
 * variables keeps the four combinations from needing four rules.
 *
 * The third row goes with it: the prototype docks its own composer there, and the
 * frame renders none (the conversation column brings the shipped composer with
 * it), so keeping the track would leave 88px of dead page under every screen.
 */
[data-novel-workbench="frame"] {
  --nw-rail: 248px;
  --nw-side: 296px;
  height: 100vh;
  width: 100%;
  border: none;
  border-radius: 0;
  box-shadow: none;
  font-family: var(--font-ui);
  color: hsl(var(--text-000));
  grid-template-columns: var(--nw-rail) minmax(0, 1fr) var(--nw-side);
  grid-template-rows: 44px minmax(0, 1fr);
  grid-template-areas: "top top top" "rail main side";
}
[data-novel-workbench="frame"][data-novel-workbench-sidebar="collapsed"] {
  --nw-rail: 56px;
}
[data-novel-workbench="frame"][data-novel-workbench-details="collapsed"] {
  --nw-side: 0px;
}
/*
 * The prototype reserves the bottom of its floating column for a composer of its
 * own; the shipped one lives inside this column, so it reaches the floor.
 */
[data-novel-workbench="frame"][data-narrow="1"] .side.open {
  bottom: 0;
}
[data-novel-workbench="frame"] .seat {
  display: contents;
}
/*
 * The transcript is the part of the conversation column that scrolls: the
 * header stays at the top and the composer stays at the bottom, where the author
 * left them. The seat is display:contents for every other purpose, so it has to
 * become a box here — without one, a long conversation overflows the grid row
 * and the frame clips it, and the author cannot read past the fold at all.
 */
[data-novel-workbench="frame"] [data-novel-transcript-seat] {
  display: block;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
/*
 * The columns' boundaries are draggable. The handle straddles the seam — half in
 * each column — so the hit area is where the cursor already is when the author
 * reaches for the edge, and it stays invisible until they do.
 */
[data-novel-workbench="frame"] .rail,
[data-novel-workbench="frame"] .side { position: relative; }
[data-novel-workbench="frame"] .nw-column-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 9px;
  z-index: 12;
  cursor: col-resize;
  background: transparent;
  touch-action: none;
}
[data-novel-workbench="frame"] .nw-column-handle[data-novel-column-handle="rail"] { right: -4px; }
[data-novel-workbench="frame"] .nw-column-handle[data-novel-column-handle="conversation"] { left: -4px; }
[data-novel-workbench="frame"] .nw-column-handle::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 4px;
  width: 1px;
  background: transparent;
  transition: background var(--t-fast);
}
[data-novel-workbench="frame"] .nw-column-handle:hover::after,
[data-novel-workbench="frame"] .nw-column-handle:focus-visible::after,
[data-novel-workbench="frame"] .nw-column-handle[data-dragging="true"]::after {
  background: hsl(var(--accent-brand));
}
/*
 * At the prototype's 窄窗 width the rail is the frame's business, not the
 * author's, so its handle goes away. The conversation column floats there, and
 * its width is still whatever the author dragged it to.
 */
[data-novel-workbench="frame"][data-narrow="1"] .nw-column-handle[data-novel-column-handle="rail"] {
  display: none;
}
[data-novel-workbench="frame"][data-narrow="1"] .side.open { width: var(--nw-side); }
/*
 * The frame renders the thread's prose itself (NovelTranscript) and sets it as
 * reading. The shipped conversation surface is left mounted because it still
 * owns what the novel mode has not replaced yet — the composer, the input
 * menus, the approval panel — so only its own transcript region is hidden.
 */
[data-novel-workbench="frame"] [data-slot="conversation.session"] {
  display: none;
}
`

/** The novel-mode frame: topbar / rail / canvas / side / composer, all seats declared. */
export function WorkbenchFrame(props: WorkbenchFrameProps): ReactNode {
  const { panels, theme, sessionId, transcript, settings, window: viewport } = useWorkbenchState()
  /**
   * The widths are solved, not read: the preferences are what the author dragged
   * or toggled, and the solver is what keeps the manuscript its floor when the
   * window cannot hold all three.
   */
  const columns = solveColumns(viewport.width, panels.sidebar, panels.details)
  /** The conversation column: open when a session exists and the solver kept it room. */
  const conversationOpen = columns.side > 0 && sessionId !== undefined
  const threadProps = sessionId === undefined ? { 'data-novel-thread': 'idle' } : {}
  const frame = useRef<HTMLDivElement | null>(null)

  /**
   * The frame measures itself rather than reading `window`: the host can seat it
   * in a narrower column than the viewport, and it is the seat the columns have
   * to fit inside.
   */
  useEffect(() => {
    const element = frame.current
    if (element === null) return
    const report = (): void => { workbenchActions.resize(element.getBoundingClientRect().width) }
    report()
    const observer = new ResizeObserver(report)
    observer.observe(element)
    return () => { observer.disconnect() }
  }, [])

  return createElement(
    'div',
    {
      'data-novel-workbench': 'frame',
      'data-nw-theme': theme,
      // The prototype's own narrow rules — icon rail, floating conversation —
      // key off this attribute and had never been switched on here.
      'data-narrow': viewport.nearLimit ? '1' : '0',
      'data-novel-workbench-sidebar': panels.sidebar === 0 ? 'collapsed' : 'expanded',
      'data-novel-workbench-details': columns.side === 0 ? 'collapsed' : 'expanded',
      className: 'app',
      ref: frame,
      // The tracks come from the solver, so a drag or a narrow window changes
      // what is drawn without a second set of rules deciding it again.
      style: { '--nw-rail': `${String(columns.rail)}px`, '--nw-side': `${String(columns.side)}px` },
    },
    createElement(WorkbenchStyleSheet, { key: 'css' }),
        createElement('style', { key: 'frame-css' }, FRAME_CSS),
        createElement(
      'header',
      { key: 'topbar', className: 'topbar', 'data-novel-topbar': 'true' },
      props.renderSlot('novel.topbar', {}),
    ),
    createElement(
      'aside',
      { key: 'rail', className: 'rail', 'data-novel-shell': 'left' },
      props.renderSlot('sidebar', {
        collapsed: panels.sidebar === 0,
        width: columns.rail,
      }),
      createElement(ColumnHandle, {
        key: 'rail-handle',
        edge: 'rail',
        width: panels.sidebar === 0 ? RAIL_COLLAPSED : panels.sidebar,
        min: RAIL_MIN,
        max: RAIL_MAX,
        label: '调整左栏宽度',
        onWidth: (px: number) => { workbenchActions.setSidebarWidth(px) },
      }),
    ),
    createElement(
      'main',
      { key: 'main', className: 'main', 'data-novel-shell': 'main' },
      // The canvas is always the main column now. 线程 is not a view any more:
      // the conversation is the right-hand column, so the author writes in the
      // editor and talks beside it instead of leaving one to reach the other.
      createElement(
        'div',
        { key: 'canvas', className: 'seat', 'data-novel-canvas-seat': 'true' },
        props.renderSlot('novel.canvas', threadProps),
      ),
    ),
    conversationOpen
      ? createElement(
          'aside',
          {
            key: 'conversation',
            // `open` is what the prototype's narrow rules turn into a floating
            // column; without it a narrow frame would `display: none` the
            // conversation and leave the author no way back to it.
            className: viewport.nearLimit ? 'side open' : 'side',
            'data-novel-shell': 'right',
            'data-novel-conversation-column': 'true',
          },
          createElement(
            'div',
            { className: 'seat', 'data-novel-conversation-seat': 'true' },
            props.renderSlot('novel.thread.header', threadProps),
            createElement(
              'div',
              { key: 'transcript', className: 'seat', 'data-novel-transcript-seat': 'true' },
              createElement(NovelTranscript, { entries: transcript, showTools: settings.toolActivity }),
              props.renderSlot('novel.thread.notice', threadProps),
            ),
            // The shipped conversation surface stays: it owns the composer, and
            // the composer is where the slash and at menus, the model and
            // permission controls, plan mode, attachments and the approval panel
            // all live. None of that is reachable any other way — the input seams
            // are closed to plugins — so the frame keeps it and only hides its
            // transcript, which NovelTranscript above replaces.
            props.renderSlot('conversation', threadProps),
          ),
          createElement(ColumnHandle, {
            key: 'side-handle',
            edge: 'conversation',
            width: panels.details,
            min: SIDE_MIN,
            max: SIDE_MAX,
            label: '调整对话栏宽度',
            onWidth: (px: number) => { workbenchActions.setDetailsWidth(px) },
          }),
        )
      : null,
    props.renderSlot('shell.overlay', {}),
  )
}

/**
 * The draggable boundary between two columns.
 *
 * The handle is a window splitter, not decoration: it takes the pointer, reports
 * every width the drag passes through, and answers the arrow keys too — a
 * resize that only a mouse can perform is a resize half the authors cannot
 * perform at all.
 */
function ColumnHandle(props: {
  /** Which column the handle resizes: the one on its left, or the one on its right. */
  readonly edge: 'rail' | 'conversation'
  readonly width: number
  readonly min: number
  readonly max: number
  readonly label: string
  readonly onWidth: (px: number) => void
}): ReactNode {
  const start = useRef<{ readonly x: number; readonly width: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  // A drag rightwards grows the column on the left of the boundary and shrinks
  // the one on the right of it.
  const signed = useCallback((delta: number): number =>
    props.edge === 'rail' ? props.width + delta : props.width - delta, [props.edge, props.width])

  return createElement('div', {
    className: 'nw-column-handle',
    'data-novel-column-handle': props.edge,
    role: 'separator',
    tabIndex: 0,
    'aria-orientation': 'vertical',
    'aria-label': props.label,
    'aria-valuenow': props.width,
    'aria-valuemin': props.min,
    'aria-valuemax': props.max,
    'data-dragging': dragging ? 'true' : 'false',
    onPointerDown: (event: { pointerId: number; clientX: number; currentTarget: { setPointerCapture(id: number): void } }) => {
      start.current = { x: event.clientX, width: props.width }
      setDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove: (event: { clientX: number }) => {
      const from = start.current
      if (from === null) return
      props.onWidth(signed(event.clientX - from.x))
    },
    onPointerUp: (event: { pointerId: number; currentTarget: { releasePointerCapture(id: number): void } }) => {
      start.current = null
      setDragging(false)
      event.currentTarget.releasePointerCapture(event.pointerId)
    },
    onPointerCancel: () => {
      start.current = null
      setDragging(false)
    },
    onKeyDown: (event: { key: string; shiftKey: boolean; preventDefault(): void }) => {
      const step = event.shiftKey ? 48 : 16
      const delta = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0
      if (delta === 0) return
      event.preventDefault()
      props.onWidth(signed(delta))
    },
  })
}
