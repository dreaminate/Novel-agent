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
/*
 * The author's own line, marked as theirs.
 *
 * What stood here was \`color: var(--text-100)\` against the model's
 * \`var(--text-000)\` — and in both the day and the night sheet those two tokens
 * are the same value, so the rule did nothing at all. Measured on a real
 * 77-line thread, the author's two lines were pixel-identical to the model's
 * twenty. A mark has to be structural to survive that: a rule down the side and
 * the word 你.
 *
 * Only the author's line is marked. Labelling each of the twenty answers as the
 * model's would say nothing the column does not already say by being almost
 * entirely answers.
 */
.novel-transcript-line.is-user {
  border-left: 2px solid hsl(var(--accent-brand) / .45);
  padding-left: 12px;
}
.novel-transcript-speaker {
  margin: 0 0 4px;
  font-family: var(--font-ui);
  font-size: 11px;
  letter-spacing: .04em;
  color: hsl(var(--accent-text));
}
.novel-transcript-tool {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1.6;
  color: hsl(var(--text-200));
}
/*
 * A run of tool lines is one stretch of work, so it is set as one block: tight
 * inside, and ruled down the side to show where the stretch begins and ends.
 * Spaced at the paragraph gap instead — which is what it was — an eleven-line
 * run cost 198px of blank column to say what a list says in 40.
 */
.novel-transcript-tools {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-left: 2px solid hsl(var(--border-100));
  padding-left: 12px;
}
.novel-transcript-streaming::after {
  content: '▍';
  margin-left: 2px;
}
/*
 * A signpost, not prose. The reading face belongs to what the author reads at
 * length; this is one sentence, read at a glance, in a column that is often
 * ~300px wide — where 17px serif on a 31px leading ran edge to edge in lines of
 * six or seven words. It speaks in the interface face, at the size the rest of
 * the frame's secondary text uses.
 */
.novel-transcript-empty {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--fs-13);
  line-height: 1.7;
  text-align: center;
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
  /**
   * Whether to show what the model did, or only what it said.
   *
   * The empty state is decided from the unfiltered lines: a thread whose only
   * entries are tool calls still had a conversation, and turning this off must
   * not make the transcript claim the author never wrote anything.
   */
  readonly showTools?: boolean
}

/** Render the transcript. */
export function NovelTranscript(props: NovelTranscriptProps): ReactNode {
  const { entries } = props
  const lines = props.showTools === false
    ? entries.filter(entry => entry.kind !== 'tool')
    : entries

  /**
   * Consecutive tool lines become one block. Only tools group: two assistant
   * lines are two answers, and folding them would join paragraphs that merely
   * arrived next to each other.
   */
  const blocks: { readonly key: string; readonly tool: boolean; readonly lines: TranscriptEntry[] }[] = []
  for (const entry of lines) {
    const last = blocks[blocks.length - 1]
    if (entry.kind === 'tool' && last?.tool === true) last.lines.push(entry)
    else blocks.push({ key: entry.id, tool: entry.kind === 'tool', lines: [entry] })
  }

  const renderLine = (entry: TranscriptEntry): ReactNode => createElement(
    'article',
    {
      key: entry.id,
      className: `novel-transcript-line is-${entry.kind}`,
      'data-novel-transcript-entry': entry.kind,
      ...(entry.streaming === true ? { 'data-novel-transcript-streaming': 'true' } : {}),
    },
    entry.kind === 'tool'
      // Phrase and detail are separate nodes on purpose: the phrase is ours and
      // must stay in the author's language, while the detail can be the model's
      // own sentence — which may name a tool, and that is the model talking, not
      // our rendering.
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
      : [
          entry.kind === 'user'
            ? createElement(
                'p',
                {
                  key: 'speaker',
                  className: 'novel-transcript-speaker',
                  'data-novel-transcript-speaker': 'true',
                },
                '你',
              )
            : null,
          createElement(
            'p',
            {
              key: 'text',
              className: entry.streaming === true
                ? 'novel-transcript-text novel-transcript-streaming'
                : 'novel-transcript-text',
            },
            entry.text,
          ),
        ],
  )

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
      : blocks.map(block => block.tool
          ? createElement(
              'div',
              { key: block.key, className: 'novel-transcript-tools' },
              block.lines.map(renderLine),
            )
          : renderLine(block.lines[0] as TranscriptEntry)),
  )
}
