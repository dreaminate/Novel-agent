/**
 * 人物档案抽屉: one person's accepted file, slid in from the right.
 *
 * The prototype opens this from a map node or a cast card and answers the
 * author's four questions — who is this, what does Canon say about them, how do
 * their relations stand in each direction, and where have they appeared — then
 * offers the one action that matters: keep writing from this person.
 */
import { createElement, useEffect, useRef, type ReactNode } from 'react'
import { useDialogFocus } from './dialog-focus.js'
import type { NovelPersonFile } from './novel-data.js'

/** Drawer rules: a right-hand panel above the columns, like the prototype's sheet. */
const DRAWER_CSS = `
[data-novel-person-file] {
  position: absolute;
  inset: 0;
  z-index: 45;
  display: flex;
  justify-content: flex-end;
  background: hsl(var(--text-000) / .16);
}
[data-novel-person-file] .file {
  width: min(420px, 100%);
  height: 100%;
  overflow-y: auto;
  background: hsl(var(--bg-000));
  border-left: 1px solid hsl(var(--border-100));
  box-shadow: var(--sh-3);
  padding: var(--s5);
}
[data-novel-person-file] .file-head {
  display: flex; align-items: center; gap: var(--s2);
  margin-bottom: var(--s3);
}
[data-novel-person-file] .file-head h2 { margin: 0; font-size: var(--fs-16); }
[data-novel-person-file] .file-head .btn { margin-left: auto; }
[data-novel-person-file] .aspect {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: var(--s2);
  padding: var(--s2) 0;
  border-top: 1px solid hsl(var(--border-100));
  font-size: var(--fs-13);
}
[data-novel-person-file] .aspect .field {
  font-family: var(--font-mono);
  font-size: var(--fs-12);
  color: hsl(var(--text-200) / .8);
}
`

/** Everything the drawer receives. */
export interface PersonFileDrawerProps {
  /** The person's file; the drawer renders nothing while it is absent. */
  readonly file: NovelPersonFile | undefined
  readonly onClose: () => void
  /** Ask the current thread to keep writing from this person. */
  readonly onContinueFrom: (id: string) => void
}

/** The drawer. */
export function PersonFileDrawer(props: PersonFileDrawerProps): ReactNode {
  const { file } = props
  const drawer = useRef<HTMLDivElement | null>(null)
  useDialogFocus(drawer, file !== undefined)

  useEffect(() => {
    if (file === undefined) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [file, props])

  if (file === undefined) return null

  return createElement(
    'div',
    {
      'data-novel-person-file': file.id,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': `人物档案 ${file.name}`,
      ref: drawer,
      onClick: (event: { target: unknown; currentTarget: unknown }) => {
        if (event.target === event.currentTarget) props.onClose()
      },
    },
    createElement(
      'div',
      { className: 'file' },
      createElement('style', null, DRAWER_CSS),
      createElement(
        'div',
        { className: 'file-head' },
        createElement('h2', null, file.name),
        file.faction === undefined
          ? createElement('span', { className: 'chip' }, '无势力')
          : createElement('span', { className: 'chip info' }, file.faction),
        createElement(
          'button',
          {
            type: 'button',
            className: 'btn sm',
            'data-novel-person-close': 'true',
            onClick: () => { props.onClose() },
          },
          '关闭',
        ),
      ),
      createElement(
        'div',
        { className: 'side-title' },
        `档案：${String(file.aspects.length)} 条已接受设定`,
      ),
      file.aspects.map(aspect => createElement(
        'div',
        { className: 'aspect', key: aspect.field, 'data-novel-person-aspect': aspect.field },
        createElement('span', { className: 'field' }, aspect.field),
        createElement('span', null, aspect.value),
      )),
      createElement(
        'div',
        { className: 'side-title', style: { marginTop: '18px' } },
        `关系：${String(file.relations.length)} 条（两个方向各自独立）`,
      ),
      file.relations.length === 0
        ? createElement('p', { className: 'note' }, '还没有被接受的关系线。')
        : file.relations.map(relation => createElement(
            'div',
            { className: 'card', key: relation.id, style: { marginBottom: '10px' } },
            createElement(
              'div',
              { className: 'row', style: { gap: '6px', display: 'flex', alignItems: 'center' } },
              createElement('span', { className: 'code' }, relation.id),
              relation.debts > 0
                ? createElement('span', { className: 'chip warn' }, `${String(relation.debts)} 条未了债务`)
                : null,
            ),
            createElement('div', { style: { marginTop: '6px', fontSize: '13px' } }, relation.forward),
            createElement('div', { style: { fontSize: '13px' } }, relation.backward),
          )),
      createElement(
        'div',
        { className: 'side-title', style: { marginTop: '18px' } },
        `出场：${String(file.appearances.length)} 个已接受事件`,
      ),
      file.appearances.length === 0
        ? createElement('p', { className: 'note' }, '还没有被接受的故事事件提到这个人。')
        : createElement(
            'ul',
            { className: 'list' },
            file.appearances.map(appearance => createElement(
              'li',
              { key: `${String(appearance.chapter)}-${appearance.label}` },
              appearance.chapter === 0
                ? appearance.label
                : `第 ${String(appearance.chapter)} 章 · ${appearance.label}`,
            )),
          ),
      createElement(
        'div',
        { className: 'row', style: { gap: '8px', marginTop: '18px', display: 'flex' } },
        createElement(
          'button',
          {
            type: 'button',
            className: 'btn primary',
            'data-novel-person-continue': 'true',
            onClick: () => { props.onContinueFrom(file.id) },
          },
          '让 AI 从这个人物继续写',
        ),
      ),
    ),
  )
}
