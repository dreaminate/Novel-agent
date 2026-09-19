/**
 * 人物与关系: the accepted cast, the factions they answer to, and every
 * relationship line with both directions written out.
 *
 * The prototype's screen opens with a count line (人物 · 势力 · 双向关系), then
 * the people as cards and the relationship lines as rows whose two halves are
 * never collapsed into one sentence — Canon stores each direction separately,
 * so the board shows both.
 */
import { createElement, type ReactNode } from 'react'
import { aspectLabel, personLabel } from './novel-copy.js'
import type { NovelCastBoard, NovelCastPerson } from './novel-data.js'

/** Keep one aspect line inside a column card. */
function truncate(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit)}…`
}

/**
 * The aspects Canon holds, in the author's words. A key with no author-facing
 * name is dropped rather than printed: the count chip already says how much
 * Canon holds, and an English key is not a label a Chinese author can read.
 */
function personAspectLabels(names: readonly string[]): readonly string[] {
  return names.map(name => aspectLabel(name)).filter((label): label is string => label !== undefined)
}

/**
 * One card's facts, as the property list a Notion database card carries. Only
 * the fields Canon actually holds appear; a person with none gets no rows
 * rather than three empty ones.
 */
function personFields(person: NovelCastPerson): readonly { readonly key: string; readonly value: string }[] {
  const aspects = personAspectLabels(person.aspectNames)
  const fields: ({ readonly key: string; readonly value: string } | undefined)[] = [
    person.summary === undefined ? undefined : { key: '设定', value: truncate(person.summary, 72) },
    person.emotion === undefined ? undefined : { key: '情绪', value: person.emotion },
    aspects.length === 0 ? undefined : { key: '方面', value: aspects.join(' · ') },
  ]
  return fields.filter((field): field is { readonly key: string; readonly value: string } => field !== undefined)
}

/** Everything the board receives: the mapped cast plus the node actions. */
export interface CastViewProps {
  readonly board: NovelCastBoard
  /** Open one person's file (the prototype's 人物档案 drawer). */
  readonly onOpenPerson?: (id: string) => void
  /** Ask the current thread to keep writing from this person. */
  readonly onContinueFrom?: (id: string) => void
}

/** The cast and relationship board. */
export function CastView(props: CastViewProps): ReactNode {
  const { board } = props
  return createElement(
    'section',
    { 'data-novel-cast': 'true' },
    createElement(
      'p',
      { className: 'note', style: { marginBottom: '14px' } },
      `${String(board.people.length)} 人物 · ${String(board.factions.length)} 势力 · ${String(board.relations.length)} 条双向关系（每条两个方向各自独立）`,
    ),
    createElement(
      'div',
      { className: 'side-title' },
      '人物',
    ),
    board.people.length === 0
      ? createElement('p', { className: 'note' }, '还没有被接受的人物设定。')
      : createElement(
          'div',
          { className: 'grid g3', 'data-novel-cast-people': 'true' },
          board.people.map(person => {
            const title = personLabel(person.name, person.id)
            return createElement(
            'div',
            { className: 'card', key: person.id, 'data-novel-person': person.id },
            createElement(
              'div',
              // The chips may wrap to a second line; the name may not. Without
              // this the three chips squeeze 未命名人物 into a vertical column
              // one character wide, which is what the card did until a real
              // screenshot caught it.
              { className: 'row', style: { gap: '6px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' } },
              createElement('span', { style: { fontWeight: 600, whiteSpace: 'nowrap' } }, title.label),
              // The id stays, so 未命名人物 is still seven distinguishable cards.
              title.unnamed ? createElement('span', { className: 'chip mono' }, person.id) : null,
              person.faction === undefined
                ? createElement('span', { className: 'chip' }, '无势力')
                : createElement('span', { className: 'chip info' }, person.faction),
              createElement('span', { className: 'chip num' }, `${String(person.aspects)} 条设定`),
            ),
            // The card's facts as a property list, the way a Notion database card
            // carries them: the key holds its own column, so comparing two people
            // does not mean reading both cards in full.
            personFields(person).length > 0 && createElement(
              'div',
              { className: 'nw-cast-fields' },
              personFields(person).map(field => createElement(
                'div',
                { className: 'nw-cast-field', key: field.key, style: { display: 'contents' } },
                createElement('span', { className: 'nw-cast-key' }, field.key),
                createElement('span', { className: 'nw-cast-value' }, field.value),
              )),
            ),
            createElement(
              'div',
              { className: 'row', style: { gap: '6px', marginTop: '10px', display: 'flex' } },
              createElement(
                'button',
                {
                  type: 'button',
                  className: 'btn sm',
                  'data-novel-person-open': 'true',
                  onClick: () => { props.onOpenPerson?.(person.id) },
                },
                '看档案',
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  className: 'btn sm',
                  onClick: () => { props.onContinueFrom?.(person.id) },
                },
                '让 AI 从这里继续写',
              ),
            ),
            )
          }),
        ),
    board.factions.length > 0 && [
      createElement('div', { className: 'side-title', key: 'factions-title', style: { marginTop: '18px' } }, '势力'),
      createElement(
        'div',
        { className: 'grid g3', key: 'factions' },
        board.factions.map(faction => createElement(
          'div',
          { className: 'card', key: faction.id, 'data-novel-faction': faction.id },
          createElement('div', { className: 'row', style: { gap: '6px', display: 'flex', alignItems: 'center' } },
            createElement('span', { style: { fontWeight: 600 } }, faction.name),
            // A faction Canon records but has not given members yet is not a
            // zero: saying so is information, and "0 人" is a placeholder.
            createElement(
              'span',
              { className: 'chip num' },
              faction.people.length === 0 ? '尚无已接受的成员' : `${String(faction.people.length)} 人`,
            )),
          faction.agenda !== undefined && createElement('div', { className: 'note', style: { marginTop: '6px' } }, faction.agenda),
        )),
      ),
    ],
    createElement('div', { className: 'side-title', key: 'relations-title', style: { marginTop: '18px' } }, '关系'),
    board.relations.length === 0
      ? createElement('p', { className: 'note' }, '还没有被接受的人物关系；关系线一旦被接受，两个方向会各自成句显示在这里。')
      : createElement(
          'div',
          { 'data-novel-cast-relations': 'true' },
          board.relations.map(relation => createElement(
            'div',
            { className: 'card', key: relation.id, style: { marginBottom: '10px' }, 'data-novel-relation': relation.id },
            createElement(
              'div',
              { className: 'row', style: { gap: '6px', display: 'flex', alignItems: 'center' } },
              createElement('span', { className: 'code' }, relation.id),
              relation.debts > 0
                ? createElement('span', { className: 'chip warn' }, `${String(relation.debts)} 条未了债务`)
                : createElement('span', { className: 'chip' }, '无未了债务'),
            ),
            createElement('div', { style: { marginTop: '6px', fontSize: '13px' } }, relation.forward),
            createElement('div', { style: { fontSize: '13px' } }, relation.backward),
          )),
        ),
  )
}
