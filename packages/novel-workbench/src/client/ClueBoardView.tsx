/**
 * 伏笔与线索板: every accepted promise, clue and mystery of the work.
 *
 * It draws the prototype's board — a kind filter, then one card per fact with
 * its first chapter, payoff window, current state and evidence anchor — over the
 * rows `buildClueBoard` maps from accepted Canon. The anchor is a button because
 * the prototype's board uses it to jump back into the text that set the fact up.
 */
import { createElement, useState, type ReactNode } from 'react'
import type { NovelClueBoard, NovelClueKind } from './novel-data.js'

/** Everything the board receives: the mapped rows plus the anchor callback. */
export interface ClueBoardViewProps {
  readonly board: NovelClueBoard
  /** Jump to the chapter an anchor names (the reader's 出处锚点). */
  readonly onOpenAnchor?: (chapter: number) => void
}

/** The filter strip, in the prototype's order. */
const FILTERS: readonly { readonly id: NovelClueKind | 'all'; readonly label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'promise', label: '伏笔' },
  { id: 'clue', label: '线索' },
  { id: 'mystery', label: '谜团' },
]

/** The board. */
export function ClueBoardView(props: ClueBoardViewProps): ReactNode {
  const [filter, setFilter] = useState<NovelClueKind | 'all'>('all')
  const rows = props.board.rows.filter(row => filter === 'all' || row.kind === filter)

  return createElement(
    'section',
    { 'data-novel-clues': 'true' },
    createElement(
      'div',
      { className: 'row', style: { gap: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center' } },
      createElement(
        'div',
        { className: 'seg', role: 'group', 'aria-label': '按类型筛选' },
        FILTERS.map(entry => createElement(
          'button',
          {
            key: entry.id,
            type: 'button',
            'aria-pressed': filter === entry.id ? 'true' : 'false',
            onClick: () => { setFilter(entry.id) },
          },
          entry.label,
        )),
      ),
      createElement(
        'span',
        { className: 'note' },
        `状态：已埋 / 推进中 / 已收 · 共 ${String(props.board.rows.length)} 条，已接受 R${String(props.board.revision)}`,
      ),
    ),
    rows.length === 0
      ? createElement('p', { className: 'note' }, '这一类型下还没有被接受的伏笔、线索或谜团。')
      : createElement(
          'div',
          { className: 'grid g2' },
          rows.map(row => createElement(
            'div',
            { className: 'fcard', key: row.id, 'data-novel-clue': row.id },
            createElement(
              'div',
              { className: 'top' },
              createElement('span', { className: 'code' }, row.id),
              createElement('span', { className: 'chip' }, row.typeLabel),
              createElement(
                'span',
                { className: `chip ${row.statusKey === 'planted' ? 'warn' : row.statusKey === 'paid' ? 'ok' : 'accent'}` },
                row.statusLabel,
              ),
            ),
            createElement('div', { className: 'txt' }, row.text),
            createElement(
              'div',
              { className: 'grid2' },
              createElement('span', null, '首次出现：',
                createElement('b', null, row.chapter === 0 ? '未标注' : `第 ${String(row.chapter)} 章`)),
              createElement('span', null, '回收窗口：',
                createElement('b', null, row.window ?? '未设定')),
              createElement('span', null, '当前状态：',
                createElement('b', null, row.note ?? row.statusLabel)),
              createElement('span', null, '证据锚点：',
                row.anchor === undefined
                  ? createElement('b', null, '未标注')
                  : createElement(
                      'button',
                      {
                        type: 'button',
                        className: 'anchor',
                        onClick: () => { props.onOpenAnchor?.(row.chapter) },
                      },
                      row.anchor,
                    )),
            ),
          )),
        ),
  )
}
