/**
 * The novel-mode navigation column: the left seat's occupant.
 *
 * Three segments in the brief's fixed order — 作品 (volumes and chapters),
 * 线程 (the sessions serving this work) and 视图 (the canvases) — closed by the
 * 进阶 entry. It replaces `ui-sidebar` outright: the bundled patch disables that
 * row, so no shipped navigation is hidden underneath.
 *
 * Works and threads come from the DSH controllers through the framework's
 * standard hooks; the chapter tree comes from the novel data face, which reads
 * the accepted Canon through the novel-project Remote.
 */
import { useEffect, useState, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionSummary } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { WORKBENCH_VIEWS, useWorkbenchState, workbenchActions } from './store.js'
import { resolveCurrentWork, type NovelWorkFace, type NovelWorkGroup, type NovelWorkOutline } from './novel-data.js'

/** Everything the left seat receives: the frame's owner props, the framework shares and the data face. */
export type NovelSidebarProps = PropsRuntime<'sidebar'> & NovelWorkFace

const STATUS_LABELS: Readonly<Record<string, string>> = {
  accepted: '已接受',
  pending: '待审',
  planned: '计划中',
}

const SIDEBAR_CSS = `
[data-novel-sidebar="nav"] {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  min-height: 0;
  overflow: hidden auto;
  padding: 12px 8px 8px;
  box-sizing: border-box;
  font-size: 13px;
  color: hsl(var(--nw-text-100));
}
[data-novel-sidebar="nav"] .nw-segment {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 10px;
}
[data-novel-sidebar="nav"] .nw-segment-title {
  margin: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .08em;
  color: hsl(var(--nw-text-200));
}
[data-novel-sidebar="nav"] button {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 5px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
[data-novel-sidebar="nav"] button:hover { background: hsl(var(--nw-bg-300)); }
[data-novel-sidebar="nav"] button[aria-current="true"],
[data-novel-sidebar="nav"] button[aria-pressed="true"] {
  background: hsl(var(--nw-bg-000));
  color: hsl(var(--nw-text-000));
  box-shadow: inset 0 0 0 1px hsl(var(--nw-border-100));
}
[data-novel-sidebar="nav"] button:disabled { opacity: .45; cursor: default; }
[data-novel-sidebar="nav"] .nw-work { font-weight: 600; }
[data-novel-sidebar="nav"] .nw-work-meta,
[data-novel-sidebar="nav"] .nw-volume-count,
[data-novel-sidebar="nav"] .nw-count {
  margin-left: auto;
  font-size: 11px;
  color: hsl(var(--nw-text-200));
  font-variant-numeric: tabular-nums;
}
[data-novel-sidebar="nav"] .nw-group-title {
  display: flex;
  gap: 6px;
  margin: 6px 8px 2px;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--nw-text-100));
}
[data-novel-sidebar="nav"] ol { margin: 0; padding: 0; list-style: none; }
[data-novel-sidebar="nav"] .nw-chapter { padding-left: 16px; }
[data-novel-sidebar="nav"] .nw-chapter-number {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--nw-text-200));
}
[data-novel-sidebar="nav"] .nw-chapter-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
[data-novel-sidebar="nav"] .nw-chapter-status {
  flex: 0 0 auto;
  margin-left: auto;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  background: hsl(var(--nw-bg-300));
  color: hsl(var(--nw-text-200));
}
[data-novel-sidebar="nav"] .nw-chapter-status[data-novel-chapter-status="pending"] {
  background: hsl(var(--nw-accent) / .16);
  color: hsl(var(--nw-accent));
}
[data-novel-sidebar="nav"] .nw-chapter-debts {
  flex: 0 0 auto;
  color: hsl(var(--nw-accent));
  font-variant-numeric: tabular-nums;
}
[data-novel-sidebar="nav"] .nw-empty {
  margin: 2px 8px;
  color: hsl(var(--nw-text-200));
}
[data-novel-sidebar="nav"] .nw-footer {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid hsl(var(--nw-border-100));
}
[data-novel-sidebar="nav"][data-novel-sidebar-density="rail"] .nw-segment-title,
[data-novel-sidebar="nav"][data-novel-sidebar-density="rail"] .nw-empty { display: none; }
[data-novel-sidebar="nav"][data-novel-sidebar-density="rail"] button { justify-content: center; }
[data-novel-sidebar="nav"] .nw-rail-glyph { font-size: 14px; }
`

/** The novel navigation column. */
export function NovelSidebar(props: NovelSidebarProps): ReactNode {
  const state = useWorkbenchState()
  const works = props.useWorkspaces(snapshot => snapshot.items)
  const threads = props.useSessions(snapshot => snapshot.byId)
  const threadIds = props.useSessions(snapshot => snapshot.ids)
  const currentThread = props.useSessions(snapshot => snapshot.current)
  const { loadOutline } = props
  const narrow = props.collapsed === true

  const currentWork = resolveCurrentWork(works, currentThread)
  const workId = currentWork?.workspaceId
  const rows = currentWork === undefined ? [] : threadRows(currentWork, threadIds, threads)

  const [outline, setOutline] = useState<NovelWorkOutline | undefined>(undefined)
  const [outlineError, setOutlineError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (workId === undefined) {
      setOutline(undefined)
      setOutlineError(undefined)
      return
    }
    let live = true
    setOutlineError(undefined)
    loadOutline(workId).then(
      value => {
        if (live) setOutline(value)
      },
      (failure: unknown) => {
        if (!live) return
        setOutline(undefined)
        setOutlineError(failure instanceof Error ? failure.message : String(failure))
      },
    )
    return () => {
      live = false
    }
  }, [workId, loadOutline, state.revision])

  const openWork = (work: WorkspaceView): void => {
    const target = threadRows(work, threadIds, threads)[0]
    if (target === undefined) {
      props.newThread(work.workspaceId)
      return
    }
    props.openThread(target.id)
    workbenchActions.setView('thread')
  }

  return (
    <nav
      data-novel-sidebar="nav"
      data-novel-sidebar-density={narrow ? 'rail' : 'full'}
      aria-label="小说导航"
    >
      <style>{SIDEBAR_CSS}</style>
      <section className="nw-segment" data-novel-sidebar-segment="works" aria-label="作品">
        <h2 className="nw-segment-title">作品</h2>
        {works.length === 0
          ? <p className="nw-empty">还没有作品</p>
          : (
              <ol>
                {works.map(work => (
                  <li key={work.workspaceId}>
                    <button
                      type="button"
                      className="nw-work"
                      data-novel-work={work.workspaceId}
                      aria-current={work.workspaceId === currentWork?.workspaceId}
                      title={work.path}
                      onClick={() => { openWork(work) }}
                    >
                      <span className="nw-chapter-title">{work.title}</span>
                      {work.workspaceId === workId && outline !== undefined
                        ? <span className="nw-count">R{String(outline.revision)}</span>
                        : <span className="nw-count">{work.sessionIds.length} 线程</span>}
                    </button>
                    {work.workspaceId === workId && !narrow && (
                      <Outline
                        outline={outline}
                        error={outlineError}
                        chapterId={state.chapterId}
                      />
                    )}
                  </li>
                ))}
              </ol>
            )}
      </section>
      <section className="nw-segment" data-novel-sidebar-segment="threads" aria-label="线程">
        <h2 className="nw-segment-title">线程</h2>
        {currentWork === undefined
          ? <p className="nw-empty">先建立作品</p>
          : (
              <>
                <ol>
                  {rows.map(row => (
                    <li key={row.id}>
                      <button
                        type="button"
                        data-novel-thread={row.id}
                        aria-current={row.id === currentThread}
                        title={row.title}
                        onClick={() => {
                          props.openThread(row.id)
                          workbenchActions.setView('thread')
                        }}
                      >
                        <span className="nw-chapter-title">{row.title}</span>
                        {row.running && (
                          <span className="nw-chapter-status" data-novel-thread-state="running">
                            进行中
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ol>
                {!narrow && (
                  <button
                    type="button"
                    data-novel-thread-new=""
                    onClick={() => { props.newThread(currentWork.workspaceId) }}
                  >
                    新建线程
                  </button>
                )}
              </>
            )}
      </section>
      <section className="nw-segment" data-novel-sidebar-segment="views" aria-label="视图">
        <h2 className="nw-segment-title">视图</h2>
        <ol>
          {WORKBENCH_VIEWS.map(entry => (
            <li key={entry.id}>
              <button
                type="button"
                data-novel-view={entry.id}
                aria-pressed={state.view === entry.id}
                disabled={!entry.ready}
                title={entry.ready ? entry.label : `${entry.label}（尚未实现）`}
                onClick={() => { workbenchActions.setView(entry.id) }}
              >
                {narrow
                  ? <span className="nw-rail-glyph">{entry.label.slice(0, 1)}</span>
                  : <span className="nw-chapter-title">{entry.label}</span>}
              </button>
            </li>
          ))}
        </ol>
      </section>
      <div className="nw-footer">
        <button
          type="button"
          data-novel-advanced-toggle=""
          aria-pressed={state.advanced}
          onClick={() => { workbenchActions.toggleAdvanced() }}
        >
          {narrow
            ? <span className="nw-rail-glyph">进</span>
            : <span>进阶</span>}
        </button>
      </div>
    </nav>
  )
}

function Outline(props: {
  outline: NovelWorkOutline | undefined
  error: string | undefined
  chapterId: string | undefined
}): ReactNode {
  if (props.error !== undefined) return <p className="nw-empty" role="alert">{props.error}</p>
  if (props.outline === undefined) return <p className="nw-empty">正在读取作品设定…</p>
  if (props.outline.groups.length === 0) return <p className="nw-empty">还没有卷章计划</p>
  return (
    <ol>
      {props.outline.groups.map(group => <Volume key={group.id} group={group} chapterId={props.chapterId} />)}
    </ol>
  )
}

function Volume(props: { group: NovelWorkGroup; chapterId: string | undefined }): ReactNode {
  return (
    <li data-novel-volume={props.group.id}>
      <div className="nw-group-title">
        <span>{props.group.title}</span>
        <span className="nw-volume-count">{props.group.chapters.length} 章</span>
      </div>
      <ol>
        {props.group.chapters.map(chapter => (
          <li key={chapter.id}>
            <button
              type="button"
              className="nw-chapter"
              data-novel-chapter={chapter.id}
              aria-current={chapter.id === props.chapterId}
              title={chapter.title.length === 0 ? undefined : chapter.title}
              onClick={() => {
                workbenchActions.openChapter(chapter.id)
                workbenchActions.setView(chapter.status === 'pending' ? 'review' : 'thread')
              }}
            >
              <span className="nw-chapter-number">第 {chapter.number} 章</span>
              {chapter.title.length > 0 && (
                <span className="nw-chapter-title">{chapter.title}</span>
              )}
              {chapter.debts > 0 && (
                <span className="nw-chapter-debts" title={`${String(chapter.debts)} 条未收束债务`}>
                  {chapter.debts}
                </span>
              )}
              <span className="nw-chapter-status" data-novel-chapter-status={chapter.status}>
                {STATUS_LABELS[chapter.status] ?? chapter.status}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </li>
  )
}

/** One row of the thread segment: a real session this work owns, in Host order. */
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
    // Subagent transcripts are not author threads; navigation filters them the
    // same way the shipped sidebar does.
    .filter(summary => summary.origin !== 'subagent')
}
