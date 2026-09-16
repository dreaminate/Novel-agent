/**
 * 时间线: every accepted story event in story-time order.
 *
 * The prototype's timeline is one vertical rail: each event shows its story-time
 * label, where it happened, who was in it, the chapter it was accepted in and
 * whether it is 已发生 or the 当下. The closing note repeats the prototype's own
 * rule that story time is always written as 第 N 天.
 */
import { createElement, type ReactNode } from 'react'
import type { NovelTimeline } from './novel-data.js'

/** Everything the timeline receives: the mapped rows plus the anchor jump. */
export interface TimelineViewProps {
  readonly timeline: NovelTimeline
  readonly onOpenChapter?: (chapter: number) => void
}

/** The rail. */
export function TimelineView(props: TimelineViewProps): ReactNode {
  const { timeline } = props
  return createElement(
    'section',
    { 'data-novel-timeline': 'true' },
    timeline.rows.length === 0
      ? createElement('p', { className: 'note' }, '还没有被接受的故事事件。')
      : createElement(
          'div',
          { className: 'tl' },
          timeline.rows.map(row => createElement(
            'div',
            {
              className: `tl-item${row.current ? ' now' : ''}`,
              key: row.id,
              'data-novel-timeline-event': row.id,
            },
            createElement('div', { className: 'day' }, row.label),
            createElement('div', { className: 't' }, row.text),
            createElement(
              'div',
              { className: 'd' },
              [
                row.location === undefined ? undefined : `地点：${row.location}`,
                row.participants.length === 0 ? undefined : `涉及：${row.participants.join(' · ')}`,
              ].filter((part): part is string => part !== undefined).join('　'),
            ),
            createElement(
              'div',
              { className: 'row', style: { gap: '6px', marginTop: '6px', display: 'flex' } },
              createElement(
                'button',
                {
                  type: 'button',
                  className: 'btn sm',
                  onClick: () => { props.onOpenChapter?.(row.chapter) },
                },
                row.chapter === 0 ? '看这一段' : `第 ${String(row.chapter)} 章 · 看这一段`,
              ),
              createElement('span', { className: 'chip' }, row.current ? '当下' : '已发生'),
            ),
          )),
        ),
    createElement(
      'div',
      { className: 'dup-note', style: { marginTop: '20px' } },
      '故事内时间由数据给出，界面一律用「第 N 天」表述；真实时间只出现在线程与版本记录里。',
    ),
  )
}
