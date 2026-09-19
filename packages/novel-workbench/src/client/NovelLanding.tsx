/**
 * Where 写作 starts when there is no chapter open yet.
 *
 * Two states, one screen, because they are the same question — "what do I write
 * now?":
 *
 * - A work with chapters offers the first few to open. The old screen offered a
 *   sentence telling the author to go and find one in the rail.
 * - A work with none offers to ask the architect for a first chapter. Without
 *   that, an author who has just started a project has nowhere to begin: every
 *   other surface in this product is about a chapter that does not exist yet.
 *
 * The copy rules are the product's: verbs, no engineering nouns, and no promise
 * that planning writes anything — it proposes, the author accepts.
 */
import { createElement, type ReactNode } from 'react'
import type { NovelWorkOutline } from './novel-data.js'

export interface NovelLandingProps {
  /** The accepted outline, as the canvas read it. */
  readonly outline: NovelWorkOutline
  /** Open one chapter in the writing surface. */
  readonly onOpenChapter: (id: string) => void
  /** Ask for a chapter to be planned. What that means is the canvas's business. */
  readonly onPlan: () => void
  /** True while the plan request is being confirmed. */
  readonly planning?: boolean
  readonly onConfirmPlan?: () => void
  readonly onCancelPlan?: () => void
}

/** The rail's own words for a chapter's state. */
const STATUS_LABEL: Readonly<Record<string, string>> = {
  accepted: '已接受',
  pending: '待审',
  planned: '计划中',
}

/** How many chapters the landing offers before it stops being a way in. */
const OFFERED = 3

const LANDING_CSS = `
[data-novel-landing] { display: flex; flex-direction: column; align-items: flex-start; gap: var(--s4); }
[data-novel-landing] .nw-landing-lead {
  margin: 0;
  font-size: var(--fs-13);
  line-height: 1.8;
  color: hsl(var(--text-200));
  max-width: 52ch;
}
/*
 * The ways in are cards, the way Heptabase's welcome is cards: a small grid of
 * places to start, each pressable as a whole. What this replaced was a sentence
 * with a stack of rows under it, which is a table of contents — the author read
 * down it and still had to find where the doing was.
 */
[data-novel-landing] .nw-landing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--s3);
  width: 100%; max-width: 720px;
}
[data-novel-landing] .nw-landing-card {
  display: flex; flex-direction: column; gap: 6px;
  padding: 14px 16px;
  border: 1px solid hsl(var(--border-100));
  border-radius: var(--r-card);
  background: hsl(var(--bg-000));
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
[data-novel-landing] .nw-landing-card:hover { border-color: hsl(var(--border-200)); background: hsl(var(--bg-100)); }
[data-novel-landing] .nw-landing-eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .04em;
  color: hsl(var(--text-200) / .8);
}
[data-novel-landing] .nw-landing-card-title { font-size: var(--fs-14); color: hsl(var(--text-000)); }
[data-novel-landing] .nw-landing-card-meta { font-size: var(--fs-12); color: hsl(var(--text-200)); }
/* The one card that is not a chapter says so by its edge, not by a different shape. */
[data-novel-landing] .nw-landing-card-add { border-style: dashed; background: transparent; }
[data-novel-landing] .nw-landing-confirm {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 14px;
  border: 1px solid hsl(var(--accent-brand) / .5);
  border-radius: 10px;
  background: hsl(var(--accent-brand) / .08);
  font-size: 13px; line-height: 1.7;
  color: hsl(var(--text-100));
  max-width: 52ch;
}
[data-novel-landing] .nw-landing-confirm p { margin: 0; }
[data-novel-landing] .nw-landing-note { color: hsl(var(--text-200)); font-size: 12px; }
[data-novel-landing] .nw-landing-actions { display: flex; gap: 8px; }
`

/** The first thing 写作 shows when there is no chapter open. */
export function NovelLanding(props: NovelLandingProps): ReactNode {
  const chapters = props.outline.groups.flatMap(group => group.chapters)
  // Every chapter already accepted means there is nothing left to write in this
  // work — which is the one state where planning ahead is the useful offer.
  const allAccepted = chapters.length > 0
    && chapters.every(chapter => chapter.status === 'accepted')

  return (
    <div data-novel-landing="">
      <style>{LANDING_CSS}</style>
      <p className="nw-landing-lead">
        {chapters.length === 0
          ? '这部作品还没有章节。让 AI 先规划第一章，你逐条接受之后就能动手写。'
          : '选一章开始写。'
            + (allAccepted ? '这一部现有的章节都写完了，也可以让 AI 接着往下规划。' : '')}
      </p>
      <div className="nw-landing-cards">
        {chapters.slice(0, OFFERED).map(chapter => createElement(
          'button',
          {
            key: chapter.id,
            type: 'button',
            className: 'nw-landing-card',
            'data-novel-landing-chapter': chapter.id,
            onClick: () => { props.onOpenChapter(chapter.id) },
          },
          createElement('span', { className: 'nw-landing-eyebrow' }, `第${String(chapter.number)}章`),
          createElement('span', { className: 'nw-landing-card-title' }, chapter.title),
          createElement('span', { className: 'nw-landing-card-meta' }, STATUS_LABEL[chapter.status] ?? ''),
        ))}
        {(chapters.length === 0 || allAccepted) && createElement(
          'button',
          {
            type: 'button',
            className: 'nw-landing-card nw-landing-card-add',
            'data-novel-landing-plan': 'true',
            onClick: props.onPlan,
          },
          createElement(
            'span',
            { className: 'nw-landing-eyebrow' },
            chapters.length === 0 ? '还没有章节' : '这一部写完了',
          ),
          createElement(
            'span',
            { className: 'nw-landing-card-title' },
            chapters.length === 0 ? '让 AI 规划第一章' : '让 AI 规划下一章',
          ),
          createElement('span', { className: 'nw-landing-card-meta' }, '产出提案，你逐条接受'),
        )}
      </div>
      {props.planning === true && (
        <div className="nw-landing-confirm" data-novel-landing-confirm="true" role="dialog">
          <p>规划也只产出提案：AI 会把结构整理成一条条待你决定的建议，放进提案收件箱。</p>
          <p className="nw-landing-note">在你逐条接受之前，故事内容不会有任何变化。</p>
          <div className="nw-landing-actions">
            <button
              type="button"
              className="btn sm"
              data-novel-landing-confirm-no="true"
              onClick={props.onCancelPlan}
            >
              先不规划
            </button>
            <button
              type="button"
              className="btn primary sm"
              data-novel-landing-confirm-yes="true"
              onClick={props.onConfirmPlan}
            >
              让 AI 规划
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
