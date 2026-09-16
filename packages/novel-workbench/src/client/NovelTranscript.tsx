/**
 * The novel-mode transcript: the conversation, set as reading rather than as a
 * chat log.
 *
 * The lines come from `transcriptOf` over the shipped session log, so this
 * component holds no state and subscribes to nothing — it is a rendering of
 * lines it is handed. Prose is set in the reading face (`--font-serif` at
 * `--read-size` / `--read-lh`) and measured to `--read-measure`, which is the
 * same typography the manuscript views use: the author should not have to read
 * the model's answer in a different voice than their own draft.
 */
import { createElement, type ReactNode } from 'react'
import type { TranscriptEntry } from './transcript-data.js'

/** Reading measure for the transcript column. */
const TRANSCRIPT_CSS = `
.novel-transcript {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: var(--read-measure);
  margin: 0 auto;
  padding: 24px 0 8px;
}
.novel-transcript-line { margin: 0; }
.novel-transcript-text {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--read-size);
  line-height: var(--read-lh);
  color: hsl(var(--text-000));
  white-space: pre-wrap;
}
.novel-transcript-line.is-user .novel-transcript-text {
  color: hsl(var(--text-100));
}
.novel-transcript-line.is-notice .novel-transcript-text {
  font-family: var(--font-ui);
  font-size: 13px;
  line-height: 1.6;
  color: hsl(var(--text-200));
}
.novel-transcript-tool {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1.6;
  color: hsl(var(--text-200));
}
.novel-transcript-streaming::after {
  content: '▍';
  margin-left: 2px;
}
.novel-transcript-empty {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--read-size);
  line-height: var(--read-lh);
  color: hsl(var(--text-200));
}
`

/** How a tool line reads while it is still open, and after it settles. */
const TOOL_STATE: Record<NonNullable<TranscriptEntry['state']>, string> = {
  running: '进行中',
  done: '已完成',
  failed: '失败',
}

/** Everything the transcript needs: the lines, already reduced. */
export interface NovelTranscriptProps {
  readonly entries: readonly TranscriptEntry[]
}

/** Render the transcript. */
export function NovelTranscript(props: NovelTranscriptProps): ReactNode {
  const { entries } = props
  return createElement(
    'div',
    { className: 'novel-transcript', 'data-novel-transcript': entries.length === 0 ? 'empty' : 'true' },
    createElement('style', { key: 'css' }, TRANSCRIPT_CSS),
    entries.length === 0
      ? createElement(
          'p',
          { key: 'empty', className: 'novel-transcript-empty' },
          '这个线程还没有对话。写下第一句，或者从右栏挑一条待审提案。',
        )
      : entries.map(entry =>
          createElement(
            'article',
            {
              key: entry.id,
              className: `novel-transcript-line is-${entry.kind}`,
              'data-novel-transcript-entry': entry.kind,
              ...(entry.streaming === true ? { 'data-novel-transcript-streaming': 'true' } : {}),
            },
            entry.kind === 'tool'
              ? createElement(
                  'p',
                  { className: 'novel-transcript-tool' },
                  `${entry.text} · ${TOOL_STATE[entry.state ?? 'running']}`,
                )
              : createElement(
                  'p',
                  {
                    className: entry.streaming === true
                      ? 'novel-transcript-text novel-transcript-streaming'
                      : 'novel-transcript-text',
                  },
                  entry.text,
                ),
          ),
        ),
  )
}
