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
  | 'details'
  | 'shell.overlay'
>

/**
 * The frame's own rules: only what binds the prototype's grid to the host page
 * (full-window sizing and the night attribute the ported token sheet reads).
 * Everything the prototype drew lives in the ported stylesheet.
 */
const FRAME_CSS = `
[data-novel-workbench="frame"] {
  height: 100vh;
  width: 100%;
  border: none;
  border-radius: 0;
  box-shadow: none;
  font-family: var(--font-ui);
  color: hsl(var(--text-000));
}
[data-novel-workbench="frame"] .seat {
  display: contents;
}
/*
 * The frame renders the thread's prose itself (NovelTranscript) and sets it as
 * reading. The shipped conversation surface is left mounted because it still
 * owns what the novel mode has not replaced yet — the composer, the input
 * menus, the approval panel — so only its own transcript region is hidden.
 * I2.4 stops rendering that surface once the replacement covers all of it.
 */
[data-novel-workbench="frame"] [data-slot="conversation.session"] {
  display: none;
}
`

/** The novel-mode frame: topbar / rail / canvas / side / composer, all seats declared. */
export function WorkbenchFrame(props: WorkbenchFrameProps): ReactNode {
  const { panels, theme, view, sessionId, transcript } = useWorkbenchState()
  const sideOpen = panels.details > 0 && sessionId !== undefined
  const threads = view === 'thread'
  const threadProps = sessionId === undefined ? { 'data-novel-thread': 'idle' } : {}

  return createElement(
    'div',
    {
      'data-novel-workbench': 'frame',
      'data-nw-theme': theme,
      'data-novel-workbench-sidebar': panels.sidebar === 0 ? 'collapsed' : 'expanded',
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
      createElement(
        'div',
        {
          key: 'conversation',
          className: 'seat',
          'data-novel-conversation-seat': 'true',
          hidden: !threads,
        },
        props.renderSlot('novel.thread.header', threadProps),
        createElement(
          'div',
          { key: 'transcript', className: 'seat', 'data-novel-transcript-seat': 'true' },
          createElement(NovelTranscript, { entries: transcript }),
          props.renderSlot('novel.thread.notice', threadProps),
        ),
        // The shipped conversation surface stays: it owns the composer, and the
        // composer is where the slash and at menus, the model and permission
        // controls, plan mode, attachments and the approval panel all live. None
        // of that is reachable any other way — the input seams are closed to
        // plugins — so the frame keeps it and only hides its transcript, which
        // NovelTranscript above replaces.
        props.renderSlot('conversation', threadProps),
      ),
      threads
        ? null
        : createElement(
            'div',
            { key: 'canvas', className: 'seat', 'data-novel-canvas-seat': 'true' },
            props.renderSlot('novel.canvas', threadProps),
          ),
    ),
    sideOpen
      ? createElement(
          'aside',
          { key: 'side', className: 'side', 'data-novel-shell': 'right' },
          props.SessionProvider === undefined
            ? props.renderSlot('details', { sessionId: sessionId as never })
            : createElement(
                props.SessionProvider,
                { sessionId } as never,
                props.renderSlot('details', { sessionId: sessionId as never }),
              ),
        )
      : null,
    props.renderSlot('shell.overlay', {}),
  )
}

/** Width the frame gives the navigation column while it is collapsed. */
const RAIL_COLLAPSED = 56
