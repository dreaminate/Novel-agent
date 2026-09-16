/**
 * 版本历史: one row per accepted revision, each with the author-facing summary and
 * a two-step rollback. Rolling back writes a NEW revision that restores the old
 * one, so history is never rewritten.
 */
import { useState, type ReactNode } from 'react'
import type { NovelRevisionRow } from './novel-data.js'

export interface VersionHistoryViewProps {
  readonly rows: readonly NovelRevisionRow[]
  readonly headRevision: number
  readonly busy: boolean
  readonly notice: string | undefined
  readonly onRollback: (targetRevision: number) => void
}

const HISTORY_CSS = `
[data-novel-history] { display: flex; flex-direction: column; gap: 12px; }
[data-novel-history] h2 { margin: 0 0 4px; font-size: 18px; }
[data-novel-history] .nw-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid hsl(var(--nw-border-100));
  border-radius: 10px;
  background: hsl(var(--nw-bg-000));
}
[data-novel-history] .nw-badge {
  flex: 0 0 auto;
  min-width: 42px;
  padding: 3px 8px;
  border-radius: 999px;
  background: hsl(var(--nw-bg-300));
  color: hsl(var(--nw-text-200));
  font-variant-numeric: tabular-nums;
  text-align: center;
}
[data-novel-history] .nw-row[data-current="true"] .nw-badge { background: hsl(var(--nw-accent) / .16); color: hsl(var(--nw-accent)); }
[data-novel-history] .nw-row-text { flex: 1 1 auto; min-width: 0; }
[data-novel-history] .nw-row-title { display: block; }
[data-novel-history] .nw-row-summary { font-size: 12px; color: hsl(var(--nw-text-200)); }
[data-novel-history] button {
  padding: 4px 10px;
  border: 1px solid hsl(var(--nw-border-100));
  border-radius: 6px;
  background: hsl(var(--nw-bg-000));
  color: hsl(var(--nw-text-100));
  font: inherit;
  cursor: pointer;
}
[data-novel-history] button:hover:not(:disabled) { background: hsl(var(--nw-bg-200)); }
[data-novel-history] button:disabled { opacity: .5; cursor: default; }
[data-novel-history] .nw-empty { margin: 0; color: hsl(var(--nw-text-200)); }
[data-novel-history] .nw-notice { font-size: 13px; color: hsl(var(--nw-accent)); }
`

/** The version history screen. */
export function VersionHistoryView(props: VersionHistoryViewProps): ReactNode {
  const [confirming, setConfirming] = useState<number | undefined>(undefined)

  return (
    <div data-novel-history="">
      <style>{HISTORY_CSS}</style>
      <h2>版本历史</h2>
      {props.notice !== undefined && <p className="nw-notice">{props.notice}</p>}
      {props.rows.length === 0 && <p className="nw-empty">还没有已接受版本。</p>}
      {props.rows.map(row => (
        <div className="nw-row" key={row.revision} data-novel-history-row={row.revision} data-current={row.revision === props.headRevision}>
          <span className="nw-badge">{`R${String(row.revision)}`}</span>
          <span className="nw-row-text">
            <span className="nw-row-title">{row.title}</span>
            <span className="nw-row-summary">
              {row.summary}
              {row.rollbackOf === undefined ? '' : ` · 回滚自 R${String(row.rollbackOf)}`}
            </span>
          </span>
          {row.revision === props.headRevision
            ? <span className="nw-row-summary">当前版本</span>
            : confirming === row.revision
              ? (
                  <>
                    <button
                      type="button"
                      disabled={props.busy}
                      data-novel-history-confirm={row.revision}
                      onClick={() => {
                        setConfirming(undefined)
                        props.onRollback(row.revision)
                      }}
                    >
                      确认回滚
                    </button>
                    <button type="button" onClick={() => { setConfirming(undefined) }}>取消</button>
                  </>
                )
              : (
                  <button
                    type="button"
                    disabled={props.busy}
                    data-novel-history-rollback={row.revision}
                    onClick={() => { setConfirming(row.revision) }}
                  >
                    回滚到此版本
                  </button>
                )}
        </div>
      ))}
    </div>
  )
}
