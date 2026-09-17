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
import { createElement, type ReactNode } from 'react'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import { NovelTranscript } from './NovelTranscript.js'
import { useWorkbenchState } from './store.js'
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
}
[data-novel-workbench="frame"][data-novel-workbench-sidebar="collapsed"] {
  --nw-rail: 56px;
}
[data-novel-workbench="frame"][data-novel-workbench-details="collapsed"] {
  --nw-side: 0px;
}
[data-novel-workbench="frame"] .seat {
  display: contents;
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
  const { panels, theme, sessionId, transcript, settings } = useWorkbenchState()
  /** The conversation column: open when a session exists and the column is out. */
  const conversationOpen = panels.details > 0 && sessionId !== undefined
  const threadProps = sessionId === undefined ? { 'data-novel-thread': 'idle' } : {}

  return createElement(
    'div',
    {
      'data-novel-workbench': 'frame',
      'data-nw-theme': theme,
      'data-novel-workbench-sidebar': panels.sidebar === 0 ? 'collapsed' : 'expanded',
      'data-novel-workbench-details': panels.details === 0 ? 'collapsed' : 'expanded',
      className: 'app',
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
            className: 'side',
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
