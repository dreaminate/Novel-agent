/**
 * 提案审阅: the core screen. One pending proposal at a time — the chapter draft,
 * every proposed setting change with its own 接受/拒绝, the review issues with
 * their anchors, the staged impact, and the two ways out (接受本章 / 暂不处理).
 *
 * The screen owns only the author's staged decisions; what they would write is
 * asked of Novel Project through the impact preview, and nothing reaches Canon
 * until the author accepts.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { NovelResultItemDecision } from '@novel-agent/novel-project/types'
import { workbenchActions } from './store.js'
import type { NovelReviewImpact, NovelReviewProposal } from './novel-data.js'

export interface ProposalReviewViewProps {
  readonly proposal: NovelReviewProposal
  readonly acceptedRevision: number
  readonly impact: NovelReviewImpact | undefined
  readonly busy: boolean
  readonly notice: string | undefined
  readonly onDecisions: (decisions: readonly NovelResultItemDecision[]) => void
  readonly onAccept: (decisions: readonly NovelResultItemDecision[]) => void
  readonly onDiscard: () => void
}

interface Staged {
  readonly outcome: 'accept' | 'reject'
  readonly reason: string
}

const REVIEW_CSS = `
[data-novel-review] { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; gap: 14px; }
[data-novel-review] .nw-review-head { display: flex; flex-direction: column; gap: 4px; }
[data-novel-review] .nw-review-route { display: flex; align-items: baseline; gap: 8px; font-size: 13px; color: hsl(var(--nw-text-200)); font-variant-numeric: tabular-nums; }
[data-novel-review] h2 { margin: 0; font-size: 18px; }
[data-novel-review] .nw-review-body { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 18px; flex: 1 1 auto; min-height: 0; }
[data-novel-review] .nw-review-column { display: flex; flex-direction: column; gap: 12px; min-height: 0; overflow: auto; padding-right: 4px; }
[data-novel-review] .nw-card { border: 1px solid hsl(var(--nw-border-100)); border-radius: 10px; background: hsl(var(--nw-bg-000)); padding: 14px 16px; }
[data-novel-review] .nw-card h3 { margin: 0 0 8px; font-size: 13px; color: hsl(var(--nw-text-200)); font-weight: 600; }
[data-novel-review] .nw-manuscript {
  font-family: "Songti SC", "Source Han Serif SC", Georgia, serif;
  font-size: 16px;
  line-height: 1.9;
  white-space: pre-wrap;
  max-height: 46vh;
  overflow: auto;
  color: hsl(var(--nw-text-000));
}
[data-novel-review] .nw-item { display: flex; gap: 10px; padding: 8px 0; border-top: 1px solid hsl(var(--nw-border-100)); }
[data-novel-review] .nw-item:first-of-type { border-top: none; }
[data-novel-review] .nw-item-text { flex: 1 1 auto; min-width: 0; }
[data-novel-review] .nw-item-actions { display: flex; gap: 6px; flex: 0 0 auto; }
[data-novel-review] button {
  padding: 4px 10px;
  border: 1px solid hsl(var(--nw-border-100));
  border-radius: 6px;
  background: hsl(var(--nw-bg-000));
  color: hsl(var(--nw-text-100));
  font: inherit;
  cursor: pointer;
}
[data-novel-review] button:hover:not(:disabled) { background: hsl(var(--nw-bg-200)); }
[data-novel-review] button:disabled { opacity: .5; cursor: default; }
[data-novel-review] button[aria-pressed="true"] {
  border-color: hsl(var(--nw-accent));
  color: hsl(var(--nw-accent));
  background: hsl(var(--nw-accent) / .10);
}
[data-novel-review] .nw-primary { border-color: hsl(var(--nw-accent)); background: hsl(var(--nw-accent)); color: #fff; }
[data-novel-review] .nw-primary:hover:not(:disabled) { filter: brightness(.95); }
[data-novel-review] .nw-issue { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; border-top: 1px solid hsl(var(--nw-border-100)); }
[data-novel-review] .nw-issue:first-of-type { border-top: none; }
[data-novel-review] .nw-issue-head { display: flex; align-items: baseline; gap: 8px; }
[data-novel-review] .nw-severity { padding: 1px 6px; border-radius: 999px; font-size: 11px; background: hsl(var(--nw-bg-300)); color: hsl(var(--nw-text-200)); }
[data-novel-review] .nw-severity[data-severity="critical"] { background: hsl(var(--nw-accent) / .18); color: hsl(var(--nw-accent)); }
[data-novel-review] .nw-anchor { font-size: 12px; color: hsl(var(--nw-text-200)); }
[data-novel-review] .nw-footer { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; border-top: 1px solid hsl(var(--nw-border-100)); padding-top: 12px; }
[data-novel-review] .nw-impact { font-size: 13px; color: hsl(var(--nw-text-200)); }
[data-novel-review] .nw-notice { font-size: 13px; color: hsl(var(--nw-accent)); }
[data-novel-review] .nw-empty { margin: 0; color: hsl(var(--nw-text-200)); }
[data-novel-review] .nw-stale { color: hsl(var(--nw-accent)); font-weight: 600; }
`

/** The proposal review screen. */
export function ProposalReviewView(props: ProposalReviewViewProps): ReactNode {
  const { proposal } = props
  const stale = props.acceptedRevision !== proposal.expectedRevision
  const [staged, setStaged] = useState<ReadonlyMap<string, Staged>>(new Map())

  const base = useMemo(() => defaultDecisions(proposal), [proposal])
  const decisions = useMemo(() => applyStaged(base, staged), [base, staged])

  useEffect(() => {
    if (stale) return
    props.onDecisions(decisions)
    // The staged decisions are the only input; `onDecisions` is a stable prop.
  }, [decisions, stale, props.onDecisions])

  const decide = (key: string, outcome: 'accept' | 'reject', reason: string): void => {
    const next = new Map(staged)
    next.set(key, { outcome, reason })
    setStaged(next)
  }

  if (stale) {
    return (
      <div data-novel-review={proposal.packetId}>
        <style>{REVIEW_CSS}</style>
        <div className="nw-card">
          <p className="nw-stale">此提案已过期</p>
          <p className="nw-empty">
            {`它基于 R${String(proposal.expectedRevision)}，当前已是 R${String(props.acceptedRevision)}，只能丢弃。`}
          </p>
          <div className="nw-footer">
            <button
              type="button"
              data-novel-review-discard=""
              disabled={props.busy}
              onClick={props.onDiscard}
            >
              丢弃提案
            </button>
            {props.notice !== undefined && <span className="nw-notice">{props.notice}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div data-novel-review={proposal.packetId}>
      <style>{REVIEW_CSS}</style>
      <header className="nw-review-head">
        <span className="nw-review-route">
          {`R${String(proposal.expectedRevision)} → R${String(props.acceptedRevision + 1)} · ${proposal.chapterTitle} · 约 ${String(proposal.words)} 字`}
        </span>
        <h2>{proposal.chapterTitle}</h2>
      </header>
      <div className="nw-review-body">
        <div className="nw-review-column">
          <section className="nw-card" aria-label="正文预览">
            <h3>正文预览</h3>
            {proposal.text.length === 0
              ? <p className="nw-empty">本提案只有设定变更，没有正文。</p>
              : <div className="nw-manuscript" data-novel-review-manuscript="">{proposal.text}</div>}
          </section>
          <section className="nw-card" aria-label="设定变更">
            <h3>{`设定变更 ${String(proposal.deltas.length)} 条`}</h3>
            {proposal.deltas.length === 0 && <p className="nw-empty">没有设定变更。</p>}
            {proposal.deltas.map(delta => {
              const key = `delta:${delta.id}`
              const stage = staged.get(key)
              return (
                <div className="nw-item" key={delta.id} data-novel-review-delta={delta.id}>
                  <span className="nw-item-text">{delta.summary}</span>
                  <span className="nw-item-actions">
                    <button
                      type="button"
                      aria-pressed={stage?.outcome !== 'reject'}
                      data-novel-review-decision="accept"
                      onClick={() => { decide(key, 'accept', '') }}
                    >
                      接受
                    </button>
                    <button
                      type="button"
                      aria-pressed={stage?.outcome === 'reject'}
                      data-novel-review-decision="reject"
                      onClick={() => { decide(key, 'reject', stage?.reason ?? '') }}
                    >
                      拒绝
                    </button>
                  </span>
                </div>
              )
            })}
          </section>
        </div>
        <div className="nw-review-column">
          <section className="nw-card" aria-label="审阅问题">
            <h3>{`审阅问题 ${String(proposal.issues.length)} 个`}</h3>
            {proposal.issues.length === 0 && <p className="nw-empty">没有审阅问题。</p>}
            {proposal.issues.map(issue => {
              const key = `issue:${issue.id}`
              const stage = staged.get(key)
              return (
                <div className="nw-issue" key={issue.id} data-novel-review-issue={issue.id}>
                  <div className="nw-issue-head">
                    <span className="nw-severity" data-severity={issue.severityLabel === '严重' ? 'critical' : 'other'}>
                      {issue.severityLabel}
                    </span>
                    <span>{issue.dimensionLabel}</span>
                    <button
                      type="button"
                      aria-pressed={stage?.outcome !== 'reject'}
                      data-novel-review-decision="issue"
                      onClick={() => { decide(key, stage?.outcome === 'reject' ? 'accept' : 'reject', '') }}
                    >
                      {stage?.outcome === 'reject' ? '未采纳' : '采纳建议'}
                    </button>
                  </div>
                  <span>{issue.problem}</span>
                  {issue.suggestion.trim().length > 0 && (
                    <span className="nw-anchor">{`建议：${issue.suggestion}`}</span>
                  )}
                  <span className="nw-anchor">{`出处 ${String(issue.anchorCount)} 处`}</span>
                </div>
              )
            })}
          </section>
          <section className="nw-card" aria-label="影响预览">
            <h3>影响预览</h3>
            {props.impact === undefined
              ? <p className="nw-empty">正在计算影响…</p>
              : (
                  <p className="nw-impact">
                    {`R${String(props.impact.fromRevision)} → R${String(props.impact.toRevision)}：`}
                    {props.impact.manuscriptChanged ? '正文 1 篇' : '正文 0 篇'}
                    {` · 设定变更 ${String(props.impact.settingChanges)} 条`}
                    {` · 未采纳建议 ${String(props.impact.unacceptedIssues)} 条`}
                  </p>
                )}
          </section>
        </div>
      </div>
      <div className="nw-footer">
        <button
          type="button"
          className="nw-primary"
          data-novel-review-accept=""
          disabled={props.busy}
          onClick={() => { props.onAccept(decisions) }}
        >
          {props.busy ? '正在写入…' : '接受本章'}
        </button>
        <button
          type="button"
          data-novel-review-later=""
          disabled={props.busy}
          onClick={() => { workbenchActions.setView('thread') }}
        >
          暂不处理
        </button>
        <button
          type="button"
          data-novel-review-discard=""
          disabled={props.busy}
          onClick={props.onDiscard}
        >
          丢弃提案
        </button>
        {props.notice !== undefined && <span className="nw-notice">{props.notice}</span>}
      </div>
    </div>
  )
}

/** Default staging: every proposal item is accepted until the author says otherwise. */
function defaultDecisions(proposal: NovelReviewProposal): readonly NovelResultItemDecision[] {
  const decisions: NovelResultItemDecision[] = proposal.deltas.map(delta => ({
    itemType: 'delta',
    itemId: delta.id,
    outcome: 'accept',
  }))
  if (proposal.unitId !== undefined) {
    decisions.push({
      itemType: 'manuscript',
      itemId: proposal.packet.manuscript?.unitId ?? proposal.packetId,
      outcome: 'accept',
    })
  }
  for (const issue of proposal.issues) {
    decisions.push({ itemType: 'issue', itemId: issue.id, outcome: 'accept' })
  }
  return decisions
}

function applyStaged(
  base: readonly NovelResultItemDecision[],
  staged: ReadonlyMap<string, Staged>,
): readonly NovelResultItemDecision[] {
  return base.map(decision => {
    const stage = staged.get(`${decision.itemType}:${decision.itemId}`)
    if (stage === undefined) return decision
    return stage.reason.length === 0
      ? { itemType: decision.itemType, itemId: decision.itemId, outcome: stage.outcome }
      : { itemType: decision.itemType, itemId: decision.itemId, outcome: stage.outcome, reason: stage.reason }
  })
}
