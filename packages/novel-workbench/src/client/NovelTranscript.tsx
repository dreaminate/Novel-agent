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
import { toolPhrase } from './novel-copy.js'
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

/**
 * How one tool line reads.
 *
 * The tool's own name never reaches the page: `toolPhrase` turns it into the
 * author's vocabulary, and the lead says whether the step is still running or
 * already went wrong. The detail is what it acted on — a path, a pattern, or the
 * model's own short description of the command.
 */
function toolLine(entry: TranscriptEntry): { readonly lead: string, readonly detail: string | undefined } {
  const phrase = toolPhrase(entry.text)
  const lead = entry.state === 'running'
    ? `正在${phrase}…`
    : entry.state === 'failed'
      ? `${phrase}时出错`
      : `已${phrase}`
  return { lead, detail: entry.detail }
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
              // Phrase and detail are separate nodes on purpose: the phrase is
              // ours and must stay in the author's language, while the detail can
              // be the model's own sentence — which may name a tool, and that is
              // the model talking, not our rendering.
              ? createElement(
                  'p',
                  { className: 'novel-transcript-tool' },
                  createElement(
                    'span',
                    { 'data-novel-transcript-tool-phrase': 'true' },
                    toolLine(entry).lead,
                  ),
                  toolLine(entry).detail === undefined
                    ? null
                    : createElement(
                        'span',
                        { 'data-novel-transcript-tool-detail': 'true' },
                        ` · ${toolLine(entry).detail as string}`,
                      ),
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
