/**
 * The failed-turn strip, sitting directly under the transcript.
 *
 * It used to live in the thread header, above the conversation, while the
 * transcript said nothing about the failure — so after the frame started
 * rendering the thread's own lines, the same failure was reported in two places.
 * A failure belongs where the author is reading, right after the last line, so
 * the strip moved down here and the header kept only the work's name and its
 * pending proposals.
 *
 * It is its own seat rather than part of `NovelTranscript` because it is the one
 * part of the stream that acts: resending the sentence needs the session face's
 * `resend`, which the frame does not receive.
 */
import { createElement, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { useWorkbenchState } from './store.js'

/**
 * What the notice seat receives: the framework's session-scoped shares, plus the
 * one capability it acts with. It needs nothing else from the data face, so it
 * asks for nothing else.
 */
export type NovelThreadNoticeProps = PropsRuntime<'novel.thread.notice'> & {
  readonly resend: (sessionId: SessionId, text: string) => Promise<void>
}

const NOTICE_CSS = `
.novel-thread-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: var(--read-measure);
  margin: 4px auto 20px;
  padding: 8px 12px;
  border: 1px solid hsl(var(--warn) / .45);
  border-radius: 8px;
  background: hsl(var(--warn) / .08);
  font-family: var(--font-ui);
  font-size: 13px;
  color: hsl(var(--text-200));
}
.novel-thread-notice-text {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`

/** The failed-turn strip. Renders nothing while the turn is healthy. */
export function NovelThreadNotice(props: NovelThreadNoticeProps): ReactNode {
  const state = useWorkbenchState()
  const sessionId = props.sessionId
  // Two sources: the Host records the failure on the snapshot, and a failed
  // *turn* never reaches the snapshot at all — the plugin mirrors that one out
  // of the session's own event window into the store.
  const reported = props.useSession(snapshot => (
    snapshot.lastAgentError ?? snapshot.promptError?.error.message ?? undefined
  ))
  const mirrored = state.turnFailure
  const problem = reported
    ?? (mirrored !== undefined && mirrored.sessionId === sessionId ? mirrored.message : undefined)
  if (problem === undefined || sessionId === undefined) return null

  const submission = state.lastSubmission
  const lastText = submission !== undefined && submission.sessionId === sessionId
    ? submission.text
    : undefined

  return createElement(
    'div',
    { className: 'novel-thread-notice', 'data-novel-thread-notice': 'true', role: 'alert' },
    createElement('style', { key: 'css' }, NOTICE_CSS),
    createElement('span', { key: 'chip', className: 'chip warn' }, '上次生成失败'),
    createElement(
      'span',
      { key: 'text', className: 'novel-thread-notice-text', title: problem },
      problem,
    ),
    lastText === undefined
      ? null
      : createElement(
          'button',
          {
            key: 'retry',
            type: 'button',
            className: 'btn sm',
            'data-novel-thread-retry': 'true',
            onClick: () => {
              void props.resend(sessionId, lastText).catch(() => {})
            },
          },
          '重试上一句',
        ),
  )
}
