/**
 * 未收束债务: every narrative debt Canon still holds open, stalest first.
 *
 * The prototype's three summary cards open the board, then one row per debt with
 * its 临期 mark, the clock it belongs to, how many chapters passed without it
 * moving, and a track running from the chapter that opened it to the current
 * head. The numbers come from `buildDebtBoard`, which measures the debt against
 * its own clock instead of the work's latest chapter.
 */
import { createElement, type ReactNode } from 'react'
import type { NovelDebtBoard } from './novel-data.js'

/** Everything the board receives: the mapped rows plus the two row actions. */
export interface DebtBoardViewProps {
  readonly board: NovelDebtBoard
  /** Ask the current thread to move this debt forward. */
  readonly onPush?: (id: string) => void
  /** Jump to the chapter the debt was opened in. */
  readonly onOpenAnchor?: (chapter: number) => void
}

/** The board. */
export function DebtBoardView(props: DebtBoardViewProps): ReactNode {
  const rows = props.board.rows
  const stalest = rows[0]
  const dueCount = rows.filter(row => row.level === 'warn').length
  const span = Math.max(6, stalest?.age ?? 0)

  return createElement(
    'section',
    { 'data-novel-debts': 'true' },
    createElement(
      'div',
      { className: 'grid g3', style: { marginBottom: '18px' } },
      createElement('div', { className: 'card' },
        createElement('div', { className: 'num', style: { fontSize: '20px', fontWeight: 600 } }, String(rows.length)),
        createElement('div', { className: 'note' }, '未收束债务')),
      createElement('div', { className: 'card' },
        createElement('div', { className: 'num', style: { fontSize: '20px', fontWeight: 600 } },
          stalest === undefined ? '—' : `${String(stalest.age)} 章`),
        createElement('div', { className: 'note' },
          stalest === undefined ? '没有未推进的债务' : `最久未推进：${stalest.summary}`)),
      createElement('div', { className: 'card' },
        createElement('div', { className: 'num', style: { fontSize: '20px', fontWeight: 600 } }, `${String(dueCount)} 条`),
        createElement('div', { className: 'note' }, '临期提醒（已超过 3 章未推进）')),
    ),
    rows.length === 0
      ? createElement('p', { className: 'note' }, '还没有未收束的债务。')
      : rows.map(row => createElement(
          'div',
          {
            className: `debt-row${row.level === 'warn' ? ' warn' : ''}`,
            key: row.id,
            'data-novel-debt': row.id,
          },
          createElement(
            'div',
            null,
            createElement(
              'div',
              { className: 'row', style: { gap: '6px', display: 'flex' } },
              createElement(
                'span',
                { className: `chip ${row.level === 'warn' ? 'warn' : 'info'}` },
                row.level === 'warn' ? '临期' : row.level === 'info' ? '待推进' : '开放中',
              ),
              createElement('span', { className: 'chip' }, row.clockLabel),
            ),
            createElement('div', { style: { marginTop: '6px', fontSize: '14px', fontWeight: 600 } }, row.summary),
            createElement(
              'div',
              { className: 'note', style: { marginTop: '3px' } },
              row.horizon === undefined ? '未设定回收窗口' : `回收窗口：${row.horizon}`,
            ),
          ),
          createElement(
            'div',
            { className: 'track' },
            createElement('span', { className: 'base' }),
            createElement('span', {
              className: 'bar',
              style: {
                left: 0,
                width: `${String(Math.max(6, (row.age / span) * 100))}%`,
                background: `hsl(var(${row.level === 'warn' ? '--warn' : '--info'}) / .55)`,
              },
            }),
            createElement(
              'span',
              { className: 'ticks' },
              createElement('span', null, row.chapter === 0 ? '未标注' : `第 ${String(row.chapter)} 章`),
              createElement('span', null, `${String(row.age)} 章未推进`),
            ),
          ),
          createElement(
            'div',
            { className: 'row', style: { gap: '6px', display: 'flex' } },
            createElement(
              'button',
              {
                type: 'button',
                className: 'btn sm',
                onClick: () => { props.onPush?.(row.id) },
              },
              '让 AI 推进',
            ),
            createElement(
              'button',
              {
                type: 'button',
                className: 'btn sm',
                onClick: () => { props.onOpenAnchor?.(row.chapter) },
              },
              '看出处',
            ),
          ),
        )),
  )
}
