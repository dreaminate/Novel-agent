/**
 * The novel-mode context column: the right seat's occupant.
 *
 * It keeps the prototype's three blocks in its order — 当前章 (the chapter in
 * flight with the words Canon accepted for it), 待审提案 (how many proposals
 * wait and what the top one would write) and 最近 AI 活动 (the accepted
 * revision the work last moved to). Every number is read from Novel Project;
 * nothing here caches a second copy of the story.
 */
import { createElement, useEffect, useState, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { useWorkbenchState, workbenchActions } from './store.js'
import {
  resolveCurrentWork,
  type NovelReviewDeck,
  type NovelWorkFace,
  type NovelWorkOutline,
} from './novel-data.js'

/** Everything the context column receives: the framework shares and the data face. */
export type NovelSideProps = PropsRuntime<'details'> & NovelWorkFace

/** The context column. */
export function NovelSide(props: NovelSideProps): ReactNode {
  const state = useWorkbenchState()
  const works = props.useWorkspaces(snapshot => snapshot.items)
  const work = resolveCurrentWork(works, props.sessionId)
  const workId = work?.workspaceId
  const [outline, setOutline] = useState<NovelWorkOutline | undefined>(undefined)
  const [deck, setDeck] = useState<NovelReviewDeck | undefined>(undefined)
  const [words, setWords] = useState<number | undefined>(undefined)
  const reload = state.revision

  useEffect(() => {
    if (workId === undefined) {
      setOutline(undefined)
      setDeck(undefined)
      setWords(undefined)
      return
    }
    let live = true
    Promise.all([props.loadOutline(workId), props.loadReviews(workId)]).then(
      ([nextOutline, nextDeck]) => {
        if (!live) return
        setOutline(nextOutline)
        setDeck(nextDeck)
        const target = nextOutline.groups
          .flatMap(group => group.chapters)
          .find(chapter => chapter.id === state.chapterId)
        if (target === undefined) {
          setWords(undefined)
          return
        }
        props.loadManuscript(workId, target.id).then(
          count => { if (live) setWords(count) },
          () => { if (live) setWords(undefined) },
        )
      },
      () => {
        if (!live) return
        setOutline(undefined)
        setDeck(undefined)
      },
    )
    return () => {
      live = false
    }
  }, [workId, reload, state.chapterId, props.loadOutline, props.loadReviews, props.loadManuscript])

  const chapters = outline?.groups.flatMap(group => group.chapters) ?? []
  const chapter = chapters.find(entry => entry.id === state.chapterId) ?? chapters.at(-1)
  const pending = deck?.proposals ?? []

  return createElement(
    'div',
    { className: 'side-scroll', 'data-novel-side-scroll': 'true' },
    createElement(
      'div',
      { className: 'side-block', key: 'chapter' },
      createElement('div', { className: 'side-title' }, '当前章'),
      createElement(
        'div',
        { className: 'card' },
        chapter === undefined
          ? createElement('p', { className: 'muted' }, '还没有章节')
          : [
              createElement('div', { className: 'h2', key: 'num' }, `第 ${String(chapter.number)} 章`),
              createElement('div', { className: 'h1', key: 'title' }, chapter.title),
              createElement(
                'div',
                { className: 'chips', key: 'chips' },
                createElement('span', { className: `chip ${chapter.status === 'accepted' ? 'ok' : 'accent'}` },
                  chapter.status === 'accepted' ? '已接受' : chapter.status === 'pending' ? '待审提案' : '计划中'),
                chapter.debts > 0
                  ? createElement('span', { className: 'chip warn' }, `${String(chapter.debts)} 条未收束债务`)
                  : null,
              ),
              createElement(
                'div',
                { className: 'kv', key: 'words' },
                createElement('span', null, '字数进度'),
                createElement('span', { className: 'num' }, words === undefined ? '—' : `${words.toLocaleString('zh-CN')} 字`),
              ),
              createElement(
                'div',
                { className: 'row', key: 'actions' },
                createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'btn sm',
                    onClick: () => { workbenchActions.setView('editor') },
                  },
                  '读正文',
                ),
                createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'btn sm',
                    onClick: () => { workbenchActions.setView('contract') },
                  },
                  '本章合同',
                ),
              ),
            ],
      ),
    ),
    createElement(
      'div',
      { className: 'side-block', key: 'pending' },
      createElement(
        'div',
        { className: 'side-title' },
        '待审提案',
        createElement('span', { className: 'more' }, `${String(pending.length)} 份`),
      ),
      pending.length === 0
        ? createElement('p', { className: 'muted' }, '没有等待决定的提案')
        : pending.map(entry => createElement(
            'button',
            {
              key: entry.packetId,
              type: 'button',
              className: 'card plain',
              'data-novel-proposal': entry.packetId,
              style: { textAlign: 'left', width: '100%' },
              onClick: () => {
                workbenchActions.setView('review')
              },
            },
            createElement('div', { className: 'row' },
              createElement('span', { className: 'chip accent' }, '待审'),
              createElement(
                'span',
                { className: 'num muted' },
                `R${String(entry.expectedRevision)} → 待定`,
              )),
            createElement(
              'div',
              { className: 'note' },
              `${entry.chapterTitle}· 约 ${entry.words.toLocaleString('zh-CN')} 字 · ${String(entry.deltas.length)} 条设定变更 · ${String(entry.issues.length)} 个审阅问题`,
            ),
            createElement(
              'ul',
              { className: 'list' },
              entry.deltas.slice(0, 3).map(delta => createElement(
                'li',
                { key: delta.id },
                delta.summary,
              )),
            ),
          )),
    ),
    createElement(
      'div',
      { className: 'side-block', key: 'activity' },
      createElement('div', { className: 'side-title' }, '最近 AI 活动'),
      createElement(
        'div',
        { className: 'card' },
        outline === undefined
          ? createElement('p', { className: 'muted' }, '还没有记录')
          : createElement('p', null, `已接受版本 R${String(outline.revision)}：${String(outline.chapterCount)} 章、${String(pending.length)} 份待审提案。`),
      ),
    ),
  )
}
