/**
 * The novel-mode strip above the conversation surface: which work and revision
 * the current thread is serving, and how many proposals are waiting for the
 * author. It is chrome, not a second chat surface.
 *
 * A failed turn is *not* reported here: that is the strip under the transcript
 * (`NovelThreadNotice`), where the author is actually reading. Reporting it in
 * both places said the same thing twice.
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
`

/** The thread context strip. */
export function NovelThreadHeader(props: NovelThreadHeaderProps): ReactNode {
  const works = props.useWorkspaces(snapshot => snapshot.items)
  const work = resolveCurrentWork(works, props.sessionId)
  const workId = work?.workspaceId
  const { loadReviews } = props
  const [pending, setPending] = useState<number | undefined>(undefined)
  const [revision, setRevision] = useState<number | undefined>(undefined)
  /**
   * The workbench's own revision counter. Something that notices a new proposal
   * (the transcript follow in `index.tsx`) bumps it, and this read is keyed on it
   * — so the badge follows the agent without polling for anything.
   */
  const store = useWorkbenchState()

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
  }, [workId, loadReviews, store.revision])

  if (work === undefined) return null
  if (props.sessionId === undefined) return null

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
    </div>
  )
}