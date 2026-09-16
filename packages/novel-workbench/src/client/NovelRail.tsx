/**
 * The novel-mode navigation column: the left seat's occupant.
 *
 * It draws the prototype's three groups in its order — 作品 (volumes, then the
 * chapters with their 已接受 / 待审 / 计划中 dot and debt marks), 线程 (the
 * sessions serving this work, subagent transcripts filtered out the way the
 * shipped sidebar filters them) and 视图 (the story surfaces) — with the 进阶
 * entry closing the column, where opening it grows one group per advanced area.
 *
 * Works and threads come from the DSH controllers through the framework's
 * standard hooks; the chapter tree comes from the novel data face, which reads
 * accepted Canon through the novel-project Remote.
 */
import { createElement, useEffect, useState, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionSummary } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { WORKBENCH_VIEWS, useWorkbenchState, workbenchActions } from './store.js'
import { missingDomainPlugin } from './MissingPluginCard.js'
import {
  resolveCurrentWork,
  type NovelWorkChapter,
  type NovelWorkFace,
  type NovelWorkOutline,
} from './novel-data.js'

/** Everything the left seat receives: the framework shares and the data face. */
export type NovelRailProps = PropsRuntime<'sidebar'> & NovelWorkFace

/** The dot a chapter row carries, keyed by its accepted status. */
const STATUS_CLASS: Readonly<Record<string, string>> = {
  accepted: 'ok',
  pending: 'pend',
  planned: 'plan',
}

/** Prototype status words, kept verbatim so the rail reads as designed. */
const STATUS_TAIL: Readonly<Record<string, string>> = {
  accepted: '已接受',
  pending: '待审',
  planned: '计划中',
}

/** The advanced groups the rail grows while 进阶 is open. */
const ADVANCED_GROUPS: readonly {
  readonly id: string
  readonly label: string
  readonly items: readonly { readonly id: string; readonly label: string }[]
}[] = [
  { id: 'core', label: '内核', items: [{ id: 'cordis', label: 'Cordis 插件树' }, { id: 'plugins', label: '插件清单' }] },
  { id: 'agent', label: 'Agent', items: [{ id: 'presets', label: 'Agent preset 与模型' }] },
  { id: 'jobs', label: '任务', items: [{ id: 'jobs', label: 'Jobs 列表' }, { id: 'subagents', label: 'Subagent 列表' }] },
  { id: 'diag', label: '诊断', items: [{ id: 'canon', label: '诊断原始数据' }, { id: 'log', label: '事件日志' }] },
]

/** Prototype glyphs for the thread and thread-creation rows. */
const THREAD_ICON = 'M2 4h12M2 8h8M2 12h10'
const PLUS_ICON = 'M8 3v10M3 8h10'
const MINUS_ICON = 'M3 8h10'
/** How many threads the rail shows before the list folds. */
const VISIBLE_THREADS = 5
const ADVANCED_ICON = 'M8 2a6 6 0 106 6H8zM9 2v5h5'

/**
 * The rail carries one line per row, the way the prototype's column reads. A
 * Volume's accepted objective can be a full sentence, so the heading truncates
 * inside the column instead of wrapping one character per line next to its
 * chapter count.
 */
const RAIL_CSS = `
[data-novel-rail="nav"] .vol-head > span:first-child {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[data-novel-rail="nav"] .vol-head .vol-meta,
[data-novel-rail="nav"] .grp-head .count { flex: none; }
[data-novel-rail="nav"] .grp-head > span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`

/** The navigation column. */
export function NovelRail(props: NovelRailProps): ReactNode {
  const state = useWorkbenchState()
  /** Whether the author unfolded the whole thread list. Local: it is a glance, not a setting. */
  const [expanded, setExpanded] = useState<boolean | undefined>(undefined)
  const works = props.useWorkspaces(snapshot => snapshot.items)
  const current = props.useSessions(snapshot => snapshot.current)
  const work = resolveCurrentWork(works, current)
  const sessions = props.useSessions(snapshot => ({ ids: snapshot.ids, byId: snapshot.byId }))
  const [outline, setOutline] = useState<NovelWorkOutline | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const reload = state.revision
  const workId = work?.workspaceId

  useEffect(() => {
    if (workId === undefined) {
      setOutline(undefined)
      return
    }
    let live = true
    props.loadOutline(workId).then(
      next => {
        if (!live) return
        setOutline(next)
        setError(undefined)
      },
      (reason: unknown) => {
        if (!live) return
        setOutline(undefined)
        setError(reason instanceof Error ? reason.message : String(reason))
      },
    )
    return () => {
      live = false
    }
  }, [workId, reload, props.loadOutline])

  const threads = work === undefined ? [] : threadRows(work, sessions.ids, sessions.byId)
  const counts = outline === undefined
    ? '尚未立项'
    // 进度摘要: what the work holds and where Canon stands, on one line — the
    // context column used to say this, and it is cheap to keep saying.
    : `${String(outline.groups.length)} 卷 · ${String(outline.chapterCount)} 章 · R${String(outline.revision)}`

  return [
    createElement('style', { key: 'css' }, RAIL_CSS),
    createElement(
      'div',
      {
        className: 'rail-scroll',
        key: 'scroll',
        'data-novel-rail': 'nav',
        'data-novel-rail-scroll': 'true',
      },
      createElement(
        'div',
        { className: 'grp', key: 'works', 'data-novel-rail-segment': 'works' },
        createElement(
          'div',
          { className: 'grp-head' },
          createElement('span', null, '作品'),
          createElement('span', { className: 'count' }, counts),
        ),
        renderWorks(outline, error, state.chapterId),
      ),
      // 视图 before 线程, and the rail spec pins that order: an author with
      // seventeen threads could not reach the navigation without scrolling past
      // all of them. 写作 is the landing page, so its entry should not be the one
      // that falls off the first screen.
      createElement(
        'div',
        { className: 'grp', key: 'views', 'data-novel-rail-segment': 'views' },
        createElement('div', { className: 'grp-head' }, createElement('span', null, '视图')),
        WORKBENCH_VIEWS.map(entry => createElement(
          'button',
          {
            key: entry.id,
            type: 'button',
            className: 'item',
            'data-novel-view': entry.id,
            'aria-current': state.view === entry.id ? 'true' : 'false',
            disabled: !entry.ready,
            title: entry.ready ? entry.label : `${entry.label}（尚未实现）`,
            onClick: () => { workbenchActions.setView(entry.id) },
          },
          railIcon(entry.icon),
          createElement('span', { className: 'lbl' }, entry.label),
        )),
      ),
      createElement(
        'div',
        { className: 'grp', key: 'threads', 'data-novel-rail-segment': 'threads' },
        createElement(
          'div',
          { className: 'grp-head' },
          createElement('span', null, '线程'),
          createElement('span', { className: 'count' }, String(threads.length)),
        ),
        // Long thread lists stay reachable but stop pushing everything else off
        // the column: the newest few are always there, and the rest are one
        // click away rather than a scroll away.
        threads.slice(0, expanded === true ? threads.length : VISIBLE_THREADS).map(summary => createElement(
          'button',
          {
            key: summary.id,
            type: 'button',
            className: 'item',
            'data-novel-thread': summary.id,
            'aria-current': current === summary.id ? 'true' : 'false',
            title: summary.title,
            onClick: () => {
              props.openThread(summary.id)
              workbenchActions.openDetails()
            },
          },
          railIcon(THREAD_ICON),
          createElement('span', { className: 'lbl' }, summary.title),
        )),
        threads.length > VISIBLE_THREADS
          ? createElement(
              'button',
              {
                type: 'button',
                className: 'item',
                'data-novel-threads-toggle': expanded === true ? 'collapse' : 'expand',
                onClick: () => { setExpanded(expanded !== true) },
              },
              railIcon(expanded === true ? MINUS_ICON : PLUS_ICON),
              createElement(
                'span',
                { className: 'lbl' },
                expanded === true ? '收起' : `展开其余 ${String(threads.length - VISIBLE_THREADS)} 条`,
              ),
            )
          : null,
        createElement(
          'button',
          {
            type: 'button',
            className: 'item',
            'data-novel-new-thread': 'true',
            onClick: () => {
              if (workId !== undefined) props.newThread(workId)
              workbenchActions.requestNewThread()
              // The author asked to talk, so the conversation gets the column.
              workbenchActions.openDetails()
            },
          },
          railIcon(PLUS_ICON),
          createElement('span', { className: 'lbl' }, '新建线程'),
        ),
      ),
      state.advanced
        ? ADVANCED_GROUPS.map(group => createElement(
            'div',
            { className: 'grp', key: group.id, 'data-novel-rail-segment': group.id },
            createElement(
              'div',
              { className: 'grp-head' },
              createElement('span', null, group.label),
              createElement('span', { className: 'count' }, '进阶'),
            ),
            group.items.map(item => createElement(
              'button',
              {
                key: item.id,
                type: 'button',
                className: 'item',
                'data-novel-advanced-item': item.id,
                'aria-current': state.advancedGroup === group.id ? 'true' : 'false',
                onClick: () => {
                  workbenchActions.setAdvancedGroup(group.id)
                  workbenchActions.setView('advanced')
                },
              },
              railIcon(ADVANCED_ICON),
              createElement('span', { className: 'lbl' }, item.label),
            )),
          ))
        : null,
    ),
    createElement(
      'div',
      { className: 'rail-foot', key: 'foot' },
      createElement(
        'button',
        {
          type: 'button',
          className: 'item',
          'data-novel-advanced-toggle': 'true',
          'aria-pressed': state.advanced ? 'true' : 'false',
          onClick: () => { workbenchActions.toggleAdvanced() },
        },
        railIcon(ADVANCED_ICON),
        createElement('span', { className: 'lbl' }, '进阶'),
        createElement('span', { className: 'tail' }, state.advanced ? '开' : '关'),
      ),
    ),
  ]
}

/** The chapter tree, or the one line explaining why there is none yet. */
function renderWorks(
  outline: NovelWorkOutline | undefined,
  error: string | undefined,
  chapterId: string | undefined,
): ReactNode {
  if (error !== undefined) {
    const gap = missingDomainPlugin(error)
    return createElement(
      'div',
      { className: 'note', role: 'alert', 'data-novel-rail-gap': gap?.namespace ?? '' },
      gap === undefined
        ? error
        : `缺插件：未安装${gap.plugin}。${gap.impact}，装好后点「重试检测」即可恢复。`,
    )
  }
  if (outline === undefined) {
    return createElement('div', { className: 'note' }, '正在读取作品设定…')
  }
  if (outline.groups.length === 0) {
    return [
      createElement('div', { className: 'item', key: 'empty', 'aria-current': 'true' },
        createElement('span', { className: 'ico' }, '·'),
        createElement('span', { className: 'lbl' }, '尚未立项')),
      createElement('div', { className: 'note', key: 'hint', style: { padding: '6px 8px' } },
        '立项后这里会长出卷、章与状态徽标。'),
    ]
  }
  return outline.groups.map(group => createElement(
    'div',
    { className: 'vol-head', key: group.id, 'data-novel-volume': group.id },
    createElement('span', null, group.title),
    createElement('span', { className: 'vol-meta' }, `${String(group.chapters.length)} 章`),
    ...group.chapters.map(chapter => renderChapter(chapter, chapterId)),
  ))
}

/** One chapter row: ordinal, status dot, debt mark, title and status word. */
function renderChapter(chapter: NovelWorkChapter, chapterId: string | undefined): ReactNode {
  return createElement(
    'button',
    {
      key: chapter.id,
      type: 'button',
      className: 'item ch-item',
      'data-novel-chapter': chapter.id,
      'data-novel-chapter-status': chapter.status,
      'aria-current': chapter.id === chapterId ? 'true' : 'false',
      title: `第 ${String(chapter.number)} 章 · ${chapter.title}`,
      onClick: () => {
        workbenchActions.openChapter(chapter.id)
        workbenchActions.setView('editor')
      },
    },
    createElement('span', { className: 'ord' }, String(chapter.number)),
    createElement('span', { className: `st-dot ${STATUS_CLASS[chapter.status] ?? 'plan'}` }),
    chapter.debts > 0
      ? createElement('span', { className: 'st-dot warn', title: '有未收束债务' })
      : null,
    createElement('span', { className: 't' }, chapter.title),
    createElement('span', { className: 'tail' }, STATUS_TAIL[chapter.status] ?? chapter.status),
  )
}

/** One inline prototype icon. */
function railIcon(path: string): ReactNode {
  return createElement(
    'svg',
    {
      className: 'ico',
      viewBox: '0 0 16 16',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.3,
      'aria-hidden': 'true',
    },
    createElement('path', { d: path }),
  )
}

/** One row of the thread group: a real session this work owns, in Host order. */
function threadRows(
  work: WorkspaceView,
  ids: readonly SessionId[],
  byId: Readonly<Record<SessionId, SessionSummary>>,
): readonly SessionSummary[] {
  const owned = new Set(work.sessionIds)
  return ids
    .filter(id => owned.has(id))
    .map(id => byId[id])
    .filter((summary): summary is SessionSummary => summary !== undefined)
    .filter(summary => summary.origin !== 'subagent')
}
