/**
 * The novel-mode topbar: which work the session is serving, its accepted
 * revision, the chapter the author is on, and the switches that belong to the
 * frame — 进阶, 设置, the theme modifier and the two side columns.
 *
 * Everything shown is Canon-derived: the work comes from the DSH workspace
 * registry, the revision and the chapter context from the novel data face.
 */
import { createElement, useEffect, useState, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { useWorkbenchState, workbenchActions, type WorkbenchTheme } from './store.js'
import { resolveCurrentWork, type NovelWorkFace } from './novel-data.js'

/** Everything the topbar receives: the framework shares and the data face. */
export type NovelTopbarProps = PropsRuntime<'novel.topbar'> & NovelWorkFace & {
  /** Frame switches the plugin layer binds to the workbench store. */
  actions: {
    setTheme(theme: WorkbenchTheme): void
    toggleAdvanced(): void
    toggleSidebar(): void
    toggleDetails(): void
  }
}

/** The theme modifier's three states, in the prototype's order. */
const THEME_LABELS: readonly { readonly id: WorkbenchTheme; readonly label: string }[] = [
  { id: 'auto', label: '跟随系统' },
  { id: 'day', label: '日间' },
  { id: 'night', label: '夜间' },
]

/** The topbar strip. */
export function NovelTopbar(props: NovelTopbarProps): ReactNode {
  const { actions } = props
  const state = useWorkbenchState()
  const works = props.useWorkspaces(snapshot => snapshot.items)
  const current = props.useSessions(snapshot => snapshot.current)
  const work = resolveCurrentWork(works, current)
  const workId = work?.workspaceId
  const [revision, setRevision] = useState<number | undefined>(undefined)
  const [context, setContext] = useState<string | undefined>(undefined)
  const reload = state.revision

  useEffect(() => {
    if (workId === undefined) return
    let live = true
    Promise.all([props.loadOutline(workId), props.loadReviews(workId)]).then(
      ([outline, deck]) => {
        if (!live) return
        setRevision(deck.acceptedRevision)
        setContext(describeContext(outline, deck.proposals.length))
      },
      () => {
        if (!live) return
        setRevision(undefined)
        setContext(undefined)
      },
    )
    return () => {
      live = false
    }
  }, [workId, reload, props.loadOutline, props.loadReviews])

  return [
    createElement('span', { className: 'brand', key: 'brand' }, work?.title ?? '小说模式'),
    createElement('span', { className: 'sep', key: 'sep' }),
    createElement(
      'span',
      {
        className: 'vbadge',
        key: 'ver',
        title: revision === undefined ? '还没有已接受的版本' : `当前已接受版本 R${String(revision)}`,
      },
      revision === undefined ? 'R—' : `R${String(revision)}`,
    ),
    createElement('span', { className: 'ctx', key: 'ctx' }, context ?? '尚未立项'),
    createElement(
      'div',
      { className: 'right', key: 'right' },
      createElement(
        'button',
        {
          type: 'button',
          className: `btn sm${state.advanced ? ' primary' : ''}`,
          'aria-pressed': state.advanced ? 'true' : 'false',
          title: '显示内核、插件、Agent、任务与诊断面板',
          onClick: () => { actions.toggleAdvanced() },
        },
        '进阶',
      ),
      createElement(
        'div',
        { className: 'seg', role: 'group', 'aria-label': '主题' },
        THEME_LABELS.map(entry => createElement(
          'button',
          {
            key: entry.id,
            type: 'button',
            'aria-pressed': state.theme === entry.id ? 'true' : 'false',
            onClick: () => { actions.setTheme(entry.id) },
          },
          entry.label,
        )),
      ),
      createElement(
        'button',
        {
          type: 'button',
          className: 'btn sm',
          'data-novel-settings-open': 'true',
          title: '阅读与显示设置',
          'aria-pressed': state.settingsOpen ? 'true' : 'false',
          onClick: () => { workbenchActions.openSettings() },
        },
        '设置',
      ),
      createElement(
        'button',
        {
          type: 'button',
          className: 'btn sm',
          title: '收起或展开左栏',
          'aria-pressed': state.panels.sidebar === 0 ? 'true' : 'false',
          onClick: () => { actions.toggleSidebar() },
        },
        '左栏',
      ),
      createElement(
        'button',
        {
          type: 'button',
          className: 'btn sm',
          'data-novel-topbar-details': 'true',
          title: '收起或展开对话',
          'aria-pressed': state.panels.details === 0 ? 'true' : 'false',
          onClick: () => {
            if (current === undefined) {
              // The conversation column only mounts when there is a session, so
              // with none this button toggled something that could never appear.
              // "Show me the conversation" with no thread means "give me one".
              if (workId !== undefined) props.newThread(workId)
              workbenchActions.openDetails()
              return
            }
            actions.toggleDetails()
          },
        },
        '对话',
      ),
    ),
  ]
}

/** One line naming the chapter in flight, the way the prototype's context cell reads. */
function describeContext(outline: { readonly groups: readonly { readonly chapters: readonly { readonly number: number; readonly title: string; readonly status: string }[] }[] }, pending: number): string {
  const chapters = outline.groups.flatMap(group => group.chapters)
  const inFlight = chapters.find(chapter => chapter.status === 'pending')
  if (inFlight !== undefined) {
    return `第 ${String(inFlight.number)} 章《${inFlight.title}》· ${pending > 0 ? '待审' : '已接受'}`
  }
  const last = chapters.at(-1)
  if (last === undefined) return '还没有章节'
  return `第 ${last.number} 章《${last.title}》· 已接受`
}
