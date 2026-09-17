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
import { createElement, useEffect, useRef, type ReactNode } from 'react'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import { NovelTranscript } from './NovelTranscript.js'
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
  /** The conversation column: open when a session exists and the column is out. */
  const conversationOpen = panels.details > 0 && sessionId !== undefined
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
      'data-novel-workbench-details': panels.details === 0 ? 'collapsed' : 'expanded',
      className: 'app',
      ref: frame,
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
        width: panels.sidebar === 0 ? RAIL_COLLAPSED : panels.sidebar,
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
        )
      : null,
    props.renderSlot('shell.overlay', {}),
  )
}

/** Width the frame gives the navigation column while it is collapsed. */
const RAIL_COLLAPSED = 56
