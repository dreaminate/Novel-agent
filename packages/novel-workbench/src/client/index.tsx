/**
 * Browser Cordis half of the novel-mode workbench.
 *
 * Two layers, split by what they need to exist first:
 *
 * 1. The root registration is immediate. It takes the built-in `root` slot —
 *    the seat `dsh-client-ui-renderer` renders once — declares the five child
 *    seats (novel sidebar, novel canvas, conversation, details, shell overlay)
 *    and provides `ctx.layout`. The bundle patch disables `ui-layout` and
 *    `ui-sidebar`, so this frame is the only root occupant and its left column
 *    is the only navigation.
 * 2. The novel surfaces wait for the services they read (`uiWorkspace`,
 *    `sessions`, the novel-project Remote) before taking the sidebar and canvas
 *    seats, so a slow or missing novel backend never leaves the shell blank.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-workspace-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-input-trigger/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-host-plugin-inventory/remote'
import type {} from '@deepseek-ai/dsh-cordis-host-runner/remote'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@novel-agent/novel-project/remote'
import { createNovelWorkFace } from './novel-data.js'
import { createNovelReferenceSource } from './novel-input-source.js'
import { NovelCanvas } from './NovelCanvas.js'
import { NovelRail } from './NovelRail.js'
import { NovelSide } from './NovelSide.js'
import { NovelSettings } from './NovelSettings.js'
import { PersonFileSeat } from './PersonFileSeat.js'
import { NovelThreadHeader } from './NovelThreadHeader.js'
import { NovelThreadNotice } from './NovelThreadNotice.js'
import { NovelTopbar } from './NovelTopbar.js'
import {
  WorkbenchFrame,
  type WorkbenchPanelActions,
} from './WorkbenchFrame.js'
import { ThemePresenter } from './theme-presenter.js'
import { transcriptOf } from './transcript-data.js'
import {
  getWorkbenchState,
  resetWorkbench,
  workbenchActions,
  type WorkbenchTheme,
} from './store.js'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * The novel-mode main canvas. OCCUPIED by this bundle's NovelCanvas, which
     * switches between the novel surfaces (story map, proposal review, advanced
     * panels) on the workbench view state. The frame shows it for every view
     * except 线程, which renders the conversation seat instead.
     *
     * Session-optional: the canvas owns its no-session state and reads the
     * current thread through the framework's `session-maybe` hooks.
     */
    'novel.canvas': {
      kind: 'single'
      scope: 'session-maybe'
    }
    /**
     * The strip above the conversation surface. OCCUPIED by this bundle's
     * NovelThreadHeader, which names the work and revision the current thread
     * serves and links to the proposals waiting on it.
     */
    'novel.thread.header': {
      kind: 'single'
      scope: 'session-maybe'
    }
    /**
     * The failed-turn strip under the transcript. OCCUPIED by this bundle's
     * NovelThreadNotice, which says a turn failed and offers to resend the
     * sentence that failed. It is a seat rather than part of the transcript
     * because resending needs the session face, which the frame does not get.
     */
    'novel.thread.notice': {
      kind: 'single'
      scope: 'session-maybe'
    }
    /**
     * The novel-mode topbar. OCCUPIED by this bundle's NovelTopbar, which names
     * the work and revision the session serves and carries the frame switches.
     */
    'novel.topbar': {
      kind: 'single'
      scope: 'root'
    }
  }
}

/** Required services (cordis fiber inject — the loader passes all exports as a plugin). */
export const inject = ['slots', 'theme', 'locale', 'sessions']


/**
 * The message of the last turn that ended in failure, read from the session's
 * durable event window. `turn/end` carries the structured reason, so this is the
 * same evidence the log keeps.
 */
function lastFailedTurn(
  entries: readonly { readonly type: string; readonly event?: unknown }[],
): string | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index]
    if (entry?.type !== 'event') continue
    const event = entry.event as { readonly type?: string; readonly data?: unknown } | undefined
    if (event?.type !== 'turn/end') continue
    const reason = (event.data as { readonly reason?: unknown } | undefined)?.reason as
      | { readonly kind?: string; readonly error?: { readonly message?: unknown } }
      | undefined
    if (reason?.kind !== 'error') return undefined
    const message = reason.error?.message
    return typeof message === 'string' && message.length > 0 ? message : '这次生成没有返回内容。'
  }
  return undefined
}

/** The panel-action face other plugins call through `ctx.layout`. */
class PanelController {
  toggleSidebar(): void {
    workbenchActions.toggleSidebar()
  }

  openDetails(): void {
    workbenchActions.openDetails()
  }

  closeDetails(): void {
    workbenchActions.closeDetails()
  }
}

/**
 * Install the novel-mode frame: provide `ctx.layout`, take the `root` slot and
 * declare its child seats, follow the Session Controller's current selection so
 * every session-optional seat sees the same session the frame does, project
 * theme snapshots onto the document, then seat the novel surfaces behind the
 * services they read.
 * @param ctx - client root context.
 * @returns disposer for every effect.
 */
export function apply(ctx: ClientContext): () => void {
  const layout: WorkbenchPanelActions & PanelController = new PanelController()
  const disposeService = ctx.reflect.provide('layout', layout)
  const disposeRegistration = ctx.slots.register({
    name: 'root',
    locale: 'common',
    children: {
      sidebar: { kind: 'single', scope: 'root' },
      'novel.topbar': { kind: 'single', scope: 'root' },
      conversation: { kind: 'single', scope: 'session-maybe' },
      'novel.thread.header': { kind: 'single', scope: 'session-maybe' },
      'novel.thread.notice': { kind: 'single', scope: 'session-maybe' },
      'novel.canvas': { kind: 'single', scope: 'session-maybe' },
      details: { kind: 'single', scope: 'session' },
      'shell.overlay': { kind: 'list', scope: 'root' },
    },
  }, WorkbenchFrame)
  // The frame mirrors the Session Controller's selection, because a slot
  // registration is rendered once: without this the frame would keep the session
  // it saw at mount and the context column would never appear.
  workbenchActions.setCurrentSession(ctx.sessions.list.getSnapshot().current)
  const disposeSessionFollow = ctx.effect(() => ctx.sessions.list.subscribe(() => {
    const current = ctx.sessions.list.getSnapshot().current
    workbenchActions.setCurrentSession(current)
    followTurnFailure(current)
  }), 'novel-mode current session mirror')
  /**
   * A failed turn is only visible in the session's own event window: the
   * snapshot relays live failures without a turn position
   * (`api-session/error`), while a turn that ended in error lives in the log as
   * `turn/end`. This mirror keeps the novel strip honest across reloads.
   */
  let stopFailureFollow: (() => void) | undefined
  const followTurnFailure = (sessionId: string | undefined): void => {
    stopFailureFollow?.()
    stopFailureFollow = undefined
    if (sessionId === undefined) {
      workbenchActions.setTurnFailure(undefined)
      workbenchActions.setTranscript([])
      return
    }
    const binding = ctx.sessions.binding(sessionId as never)
    if (binding === undefined) {
      workbenchActions.setTurnFailure(undefined)
      workbenchActions.setTranscript([])
      return
    }
    const read = (): void => {
      const entries = binding.eventSource.getSnapshot().entries
      workbenchActions.setTurnFailure(
        lastFailedTurn(entries) === undefined
          ? undefined
          : { sessionId: sessionId as never, message: lastFailedTurn(entries) as string },
      )
      // The transcript is a view of this same log, recomputed per append; the
      // store drops it when the result is unchanged.
      const transcript = transcriptOf(entries)
      workbenchActions.setTranscript(transcript)
      // What the author last submitted, read off the log rather than captured
      // from a composer this bundle no longer owns: the newest user line is the
      // newest submission. The failed-turn strip resends exactly this sentence.
      for (let at = transcript.length - 1; at >= 0; at -= 1) {
        const line = transcript[at]
        if (line === undefined) continue
        if (line.kind === 'user') {
          workbenchActions.rememberSubmission(sessionId as never, line.text)
          break
        }
      }
    }
    stopFailureFollow = binding.eventSource.subscribe(read)
    read()
  }
  followTurnFailure(ctx.sessions.list.getSnapshot().current)
  const presenter = new ThemePresenter()
  presenter.apply(ctx.theme.getTheme())
  const disposeThemeChange = ctx.on('theme/change', snapshot => {
    presenter.apply(snapshot)
  })

  const surfaces = ctx.plugin({
    name: '@novel-agent/novel-workbench/surfaces',
    // `remote` is the service whose mounted namespace is read as `remote.novelProject`;
    // cordis refuses the property read unless both names are injected.
    inject: [
      'slots',
      'sessions',
      'uiWorkspace',
      'workspaces',
      'inputTriggers',
      'remote',
      'remote.novelProject',
      'remote.pluginInventory',
      'remote.dynamicCordisRunner',
    ],
    apply(surfaceCtx: ClientContext) {
      const face = createNovelWorkFace({
        project: surfaceCtx.remote.novelProject,
        sessions: surfaceCtx.sessions,
        workspace: surfaceCtx.uiWorkspace,
        workspaces: surfaceCtx.workspaces,
        inventory: surfaceCtx.remote.pluginInventory,
        cordis: surfaceCtx.remote.dynamicCordisRunner,
      })
      // The `@` source that puts 人物与章节 beside the shipped file candidates.
      // Registered once for this plugin instance: the pipeline owns the menu,
      // the keyboard and the insertion, and resolves the per-session controller
      // itself, so this costs one source and no second input machine.
      surfaceCtx.effect(() => surfaceCtx.inputTriggers.registerSource(createNovelReferenceSource({
        face,
        works: () => surfaceCtx.workspaces.list.getSnapshot().items,
        revision: () => getWorkbenchState().revision,
      })), 'novel-mode @ references')
      surfaceCtx.effect(() => surfaceCtx.slots.inject('sidebar', () => surfaceCtx.slots.register({
        name: 'sidebar',
        inject: () => face,
      }, NovelRail)), 'novel-mode navigation column')
      const topbarActions = {
        setTheme(theme: WorkbenchTheme) {
          workbenchActions.setTheme(theme)
        },
        toggleAdvanced() {
          workbenchActions.toggleAdvanced()
        },
        toggleSidebar() {
          workbenchActions.toggleSidebar()
        },
        toggleDetails() {
          const open = getWorkbenchState().panels.details > 0
          if (open) workbenchActions.closeDetails()
          else workbenchActions.openDetails()
        },
      }
      surfaceCtx.effect(() => surfaceCtx.slots.inject('novel.topbar', () => surfaceCtx.slots.register({
        name: 'novel.topbar',
        inject: () => ({ ...face, actions: topbarActions }),
      }, NovelTopbar)), 'novel-mode topbar')
      surfaceCtx.effect(() => surfaceCtx.slots.inject('novel.canvas', () => surfaceCtx.slots.register({
        name: 'novel.canvas',
        inject: () => face,
      }, NovelCanvas)), 'novel-mode canvas')
      surfaceCtx.effect(() => surfaceCtx.slots.inject('details', () => surfaceCtx.slots.register({
        name: 'details',
        inject: () => face,
      }, NovelSide)), 'novel-mode context column')
      // There is no novel composer row. The composer belongs to the shipped
      // conversation surface, which owns the input machine, the slash and at
      // menus, the model / permission / plan controls and the approval panel.
      // None of those are reachable from a plugin — the draft is unreadable and
      // a pick's outcome never leaves the shipped events — so the frame renders
      // that surface and adds nothing beside it. A second bar here would be a
      // second input, and the one the author would be typing into would not be
      // the one the model hears.
      // The 设置 sheet rides the frame's overlay seat: it sits above all three
      // columns and renders nothing while it is closed.
      surfaceCtx.effect(() => surfaceCtx.slots.inject('shell.overlay', () => surfaceCtx.slots.register({
        name: 'shell.overlay',
        id: 'novel-settings',
      }, NovelSettings)), 'novel-mode settings sheet')
      // The 人物档案 drawer also rides the overlay: closed it renders nothing, so
      // the seat costs the layout nothing until an author opens a person.
      surfaceCtx.effect(() => surfaceCtx.slots.inject('shell.overlay', () => surfaceCtx.slots.register({
        name: 'shell.overlay',
        id: 'novel-person-file',
        inject: () => face,
      }, PersonFileSeat as never)), 'novel-mode person drawer')
      surfaceCtx.effect(() => surfaceCtx.slots.inject('novel.thread.header', () => surfaceCtx.slots.register({
        name: 'novel.thread.header',
        inject: () => face,
      }, NovelThreadHeader)), 'novel-mode thread header')
      surfaceCtx.effect(() => surfaceCtx.slots.inject('novel.thread.notice', () => surfaceCtx.slots.register({
        name: 'novel.thread.notice',
        inject: () => ({ resend: face.resend }),
      }, NovelThreadNotice)), 'novel-mode failed-turn strip')
    },
  })

  return () => {
    stopFailureFollow?.()
    surfaces.dispose()
    disposeSessionFollow()
    disposeThemeChange()
    presenter.dispose()
    disposeRegistration()
    disposeService()
    resetWorkbench()
  }
}
