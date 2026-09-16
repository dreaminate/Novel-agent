/**
 * 写作记忆: what the AI carries into the next chapter, and where each line came
 * from.
 *
 * The prototype shows one card per remembered summary with its 新鲜度 (the
 * accepted revision it was written in), its 来源 and the moment it took effect.
 * The rows come from accepted Canon: the latest field revisions of the story
 * facts an author works with — character, world, promise and clue state — with
 * their provenance intact, so nothing here is a second source of truth.
 */
import { createElement, type ReactNode } from 'react'
import type { NovelMemoryBoard } from './novel-data.js'

/** Everything the board receives: the mapped rows plus its two exits. */
export interface MemoryViewProps {
  readonly memory: NovelMemoryBoard
  readonly onOpenClues?: () => void
  readonly onOpenThread?: () => void
}

/** The board. */
export function MemoryView(props: MemoryViewProps): ReactNode {
  const { memory } = props
  return createElement(
    'section',
    { 'data-novel-memory': 'true' },
    createElement(
      'div',
      { className: 'row', style: { marginBottom: '16px', gap: '8px', display: 'flex', alignItems: 'center' } },
      createElement('span', { className: 'chip ok' }, `基于 R${String(memory.revision)}，最新`),
      createElement(
        'span',
        { className: 'note' },
        `AI 写作前会读到的 ${String(memory.rows.length)} 条摘要；来源与写入版本都写在下面。`,
      ),
    ),
    memory.rows.length === 0
      ? createElement('p', { className: 'note' }, '还没有可被 AI 读到的写作记忆。')
      : memory.rows.map(row => createElement(
          'div',
          { className: 'card', key: row.id, style: { marginBottom: '12px' }, 'data-novel-memory-row': row.id },
          createElement(
            'div',
            { className: 'row', style: { display: 'flex', alignItems: 'center' } },
            createElement('span', { style: { fontSize: '14px' } }, row.text),
            createElement(
              'span',
              {
                className: `chip${row.revision >= memory.revision ? ' accent' : ''}`,
                style: { marginLeft: 'auto' },
              },
              `R${String(row.revision)} 起生效`,
            ),
          ),
          createElement(
            'div',
            { className: 'mem-band' },
            createElement('i', {
              style: {
                left: 0,
                width: `${String(Math.min(100, Math.max(12, (row.revision / Math.max(memory.revision, 1)) * 100)))}%`,
              },
            }),
          ),
          createElement(
            'div',
            { className: 'row', style: { gap: '12px', display: 'flex' } },
            createElement('span', { className: 'note' }, `新鲜度：基于 R${String(memory.revision)}，最新`),
            createElement('span', { className: 'note' }, `来源：${row.sourceLabel}`),
            createElement('span', { className: 'note' }, row.detail),
          ),
        )),
    createElement(
      'div',
      { className: 'row', style: { gap: '8px', marginTop: '16px', display: 'flex' } },
      createElement(
        'button',
        { type: 'button', className: 'btn sm', onClick: () => { props.onOpenClues?.() } },
        '看伏笔状态',
      ),
      createElement(
        'button',
        { type: 'button', className: 'btn sm', onClick: () => { props.onOpenThread?.() } },
        '去线程里问 AI 记得什么',
      ),
    ),
  )
}
