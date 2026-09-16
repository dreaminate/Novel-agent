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
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@novel-agent/novel-project/remote'
import { createNovelWorkFace } from './novel-data.js'
import { NovelCanvas } from './NovelCanvas.js'
import { NovelSidebar } from './NovelSidebar.js'
import { NovelThreadHeader } from './NovelThreadHeader.js'
import {
  WorkbenchFrame,
  type WorkbenchPanelActions,
} from './WorkbenchFrame.js'
import { ThemePresenter } from './theme-presenter.js'
import { resetWorkbench, workbenchActions } from './store.js'

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
  }
}

/** Required services (cordis fiber inject — the loader passes all exports as a plugin). */
export const inject = ['slots', 'theme', 'locale', 'sessions']

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
 * declare its five child seats, project theme snapshots onto the document, then
 * seat the novel surfaces behind the services they read.
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
      conversation: { kind: 'single', scope: 'session-maybe' },
      'novel.thread.header': { kind: 'single', scope: 'session-maybe' },
      'novel.canvas': { kind: 'single', scope: 'session-maybe' },
      details: { kind: 'single', scope: 'session' },
      'shell.overlay': { kind: 'list', scope: 'root' },
    },
  }, WorkbenchFrame)
  const presenter = new ThemePresenter()
  presenter.apply(ctx.theme.getTheme())
  const disposeThemeChange = ctx.on('theme/change', snapshot => {
    presenter.apply(snapshot)
  })

  const surfaces = ctx.plugin({
    name: '@novel-agent/novel-workbench/surfaces',
    // `remote` is the service whose mounted namespace is read as `remote.novelProject`;
    // cordis refuses the property read unless both names are injected.
    inject: ['slots', 'sessions', 'uiWorkspace', 'remote', 'remote.novelProject'],
    apply(surfaceCtx: ClientContext) {
      const face = createNovelWorkFace({
        project: surfaceCtx.remote.novelProject,
        sessions: surfaceCtx.sessions,
        workspace: surfaceCtx.uiWorkspace,
      })
      surfaceCtx.effect(() => surfaceCtx.slots.inject('sidebar', () => surfaceCtx.slots.register({
        name: 'sidebar',
        inject: () => face,
      }, NovelSidebar)), 'novel-mode navigation column')
      surfaceCtx.effect(() => surfaceCtx.slots.inject('novel.canvas', () => surfaceCtx.slots.register({
        name: 'novel.canvas',
        inject: () => face,
      }, NovelCanvas)), 'novel-mode canvas')
      surfaceCtx.effect(() => surfaceCtx.slots.inject('novel.thread.header', () => surfaceCtx.slots.register({
        name: 'novel.thread.header',
        inject: () => face,
      }, NovelThreadHeader)), 'novel-mode thread header')
    },
  })

  return () => {
    surfaces.dispose()
    disposeThemeChange()
    presenter.dispose()
    disposeRegistration()
    disposeService()
    resetWorkbench()
  }
}
