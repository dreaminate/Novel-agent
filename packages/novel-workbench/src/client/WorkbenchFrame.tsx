/**
 * The novel-mode application frame: the root occupant that replaces
 * `dsh-client-ui-layout`'s AppFrame.
 *
 * It declares the five seats the browser roster occupies — the novel left
 * column, the novel canvas, the conversation surface, the details column and the
 * shell overlay — and picks between the conversation and the canvas from the
 * workbench view state. The conversation seat stays mounted while a novel canvas
 * is shown, so a thread keeps its scroll position and composer state across
 * view switches.
 */
import { createElement, type ReactNode } from 'react'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import { useWorkbenchState } from './store.js'

/** Bound panel actions handed to `ctx.layout` consumers. */
export interface WorkbenchPanelActions {
  toggleSidebar(): void
  openDetails(): void
  closeDetails(): void
}

/** Everything the root occupant receives from the slot framework. */
export type WorkbenchFrameProps = PropsRenderSlots<
  'sidebar' | 'conversation' | 'novel.thread.header' | 'novel.canvas' | 'details' | 'shell.overlay'
>

/** Novel-mode token sheet: warm neutrals, one clay accent, both schemes. */
const FRAME_CSS = `
[data-novel-workbench="frame"] {
  --nw-bg-000: 0 0% 100%;
  --nw-bg-100: 48 33.3% 97.1%;
  --nw-bg-200: 53 28.6% 94.5%;
  --nw-bg-300: 48 25% 92.2%;
  --nw-border-100: 51 16.5% 84.5%;
  --nw-text-000: 60 2.6% 7.6%;
  --nw-text-100: 60 2.6% 20%;
  --nw-text-200: 60 2.6% 40%;
  --nw-accent: 15 63.1% 59.6%;
  display: flex;
  align-items: stretch;
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  background: hsl(var(--nw-bg-100));
  color: hsl(var(--nw-text-000));
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}
body[data-ds-dark-theme] [data-novel-workbench="frame"] {
  --nw-bg-000: 60 2.1% 18.4%;
  --nw-bg-100: 60 2.7% 14.5%;
  --nw-bg-200: 30 3.3% 11.8%;
  --nw-bg-300: 60 2.6% 7.6%;
  --nw-border-100: 30 3.3% 16%;
  --nw-text-000: 48 33.3% 97.1%;
  --nw-text-100: 48 20% 88%;
  --nw-text-200: 48 12% 70%;
}
[data-novel-workbench="frame"] .nw-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
[data-novel-workbench="frame"] .nw-sidebar {
  flex: 0 0 auto;
  border-right: 1px solid hsl(var(--nw-border-100));
  background: hsl(var(--nw-bg-200));
}
[data-novel-workbench="frame"] .nw-main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
[data-novel-workbench="frame"] .nw-thread-seat,
[data-novel-workbench="frame"] .nw-canvas {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
[data-novel-workbench="frame"] .nw-details {
  flex: 0 0 auto;
  border-left: 1px solid hsl(var(--nw-border-100));
  background: hsl(var(--nw-bg-000));
}
`

/** The novel-mode frame: sidebar / main / details / overlay, all seats declared. */
export function WorkbenchFrame(props: WorkbenchFrameProps): ReactNode {
  const state = useWorkbenchState()
  const { panels } = state
  const collapsed = panels.sidebar === 0
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : panels.sidebar
  const threads = state.view === 'thread'

  return createElement(
    'div',
    {
      'data-novel-workbench': 'frame',
      'data-novel-workbench-sidebar': collapsed ? 'collapsed' : 'expanded',
    },
    createElement('style', { key: 'tokens' }, FRAME_CSS),
    createElement(
      'div',
      {
        key: 'sidebar',
        className: 'nw-column nw-sidebar',
        style: { width: sidebarWidth },
      },
      props.renderSlot('sidebar', { collapsed, width: sidebarWidth }),
    ),
    createElement(
      'div',
      { key: 'main', className: 'nw-column nw-main' },
      createElement(
        'div',
        {
          key: 'thread',
          className: 'nw-thread-seat',
          style: { display: threads ? 'flex' : 'none' },
        },
        props.renderSlot('novel.thread.header', {}),
        props.renderSlot('conversation', {}),
      ),
      threads
        ? null
        : createElement(
            'div',
            { key: 'canvas', className: 'nw-canvas' },
            props.renderSlot('novel.canvas', {}),
          ),
    ),
    panels.details > 0
      ? createElement(
          'div',
          { key: 'details', className: 'nw-column nw-details', style: { width: panels.details } },
          props.SessionProvider === undefined
            ? props.renderSlot('details', {})
            : createElement(props.SessionProvider, null, props.renderSlot('details', {})),
        )
      : null,
    props.renderSlot('shell.overlay', {}),
  )
}

/** Collapsed rail width for the navigation column. */
const SIDEBAR_COLLAPSED = 56
