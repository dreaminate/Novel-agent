/**
 * The novel-mode strip above the conversation surface: which work and revision
 * the current thread is serving, and how many proposals are waiting for the
 * author. It is chrome, not a second chat surface — the conversation below it
 * stays the shipped one.
 */
import { useEffect, useState, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { useWorkbenchState, workbenchActions } from './store.js'
import { resolveCurrentWork, type NovelWorkFace } from './novel-data.js'

/** Everything the thread header receives: the framework shares and the data face. */
export type NovelThreadHeaderProps = PropsRuntime<'novel.thread.header'> & NovelWorkFace

const HEADER_CSS = `
[data-novel-thread-header] {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  padding: 8px 16px;
  border-bottom: 1px solid hsl(var(--border-100));
  background: hsl(var(--bg-100));
  font-size: 12px;
  color: hsl(var(--text-200));
}
[data-novel-thread-header] .nw-thread-work { color: hsl(var(--text-000)); font-weight: 600; }
[data-novel-thread-header] .nw-thread-version { font-variant-numeric: tabular-nums; }
[data-novel-thread-header] .nw-thread-pending {
  margin-left: auto;
  padding: 2px 8px;
  border: 1px solid hsl(var(--accent-brand) / .5);
  border-radius: 999px;
  background: hsl(var(--accent-brand) / .12);
  color: hsl(var(--accent-text));
  font: inherit;
  cursor: pointer;
}
[data-novel-thread-header] .nw-thread-failure {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
  margin-left: auto;
}
[data-novel-thread-header] .nw-thread-failure-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: hsl(var(--warn));
}
`

/** The thread context strip. */
export function NovelThreadHeader(props: NovelThreadHeaderProps): ReactNode {
  const works = props.useWorkspaces(snapshot => snapshot.items)
  const work = resolveCurrentWork(works, props.sessionId)
  const state = useWorkbenchState()
  /**
   * A failed turn is a state the author has to see: the Host records it on the
   * session snapshot, and without this strip the thread just goes quiet
   * (the prototype's AI 无输出 boundary).
   */
  const failure = props.useSession(snapshot => (
    snapshot.lastAgentError ?? snapshot.promptError?.error.message ?? undefined
  ))
  const submission = state.lastSubmission
  const lastText = submission !== undefined && submission.sessionId === props.sessionId
    ? submission.text
    : undefined
  /** A turn that ended in error lives in the session log, mirrored by the plugin. */
  const mirrored = state.turnFailure
  const turnFailure = mirrored !== undefined && mirrored.sessionId === props.sessionId
    ? mirrored.message
    : undefined
  const problem = failure ?? turnFailure
  const workId = work?.workspaceId
  const { loadReviews } = props
  const [pending, setPending] = useState<number | undefined>(undefined)
  const [revision, setRevision] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (workId === undefined) return
    let live = true
    loadReviews(workId).then(
      deck => {
        if (!live) return
        setPending(deck.proposals.length)
        setRevision(deck.acceptedRevision)
      },
      () => {
        if (live) setPending(undefined)
      },
    )
    return () => {
      live = false
    }
  }, [workId, loadReviews])

  if (work === undefined) return null
  const sessionId = props.sessionId
  if (sessionId === undefined) return null

  return (
    <div data-novel-thread-header="" data-novel-thread-work={work.workspaceId}>
      <style>{HEADER_CSS}</style>
      <span className="nw-thread-work">{work.title}</span>
      {revision !== undefined && <span className="nw-thread-version">{`R${String(revision)}`}</span>}
      {pending !== undefined && pending > 0 && (
        <button
          type="button"
          className="nw-thread-pending"
          data-novel-thread-pending={pending}
          onClick={() => { workbenchActions.setView('review') }}
        >
          {`待审提案 ${String(pending)}`}
        </button>
      )}
      {problem !== undefined && (
        <div className="nw-thread-failure" data-novel-thread-failure="" role="alert">
          <span className="chip warn">上次生成失败</span>
          <span className="nw-thread-failure-text" title={problem}>{problem}</span>
          {lastText !== undefined && (
            <button
              type="button"
              className="btn sm"
              data-novel-thread-retry="true"
              onClick={() => {
                void props.resend(sessionId, lastText).catch(() => {})
              }}
            >
              重试上一句
            </button>
          )}
        </div>
      )}
    </div>
  )
}
