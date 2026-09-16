/**
 * 进阶面: the kernel, background work and raw projections behind the writing
 * surface. Everything here is deliberately plain and monospaced where it shows
 * identifiers — the author-facing screens never do.
 */
import type { ReactNode } from 'react'
import type { SubagentCatalogSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import type { JobView } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { NovelDiagnostics } from './novel-data.js'

export interface AdvancedViewProps {
  readonly sessionId: SessionId | undefined
  readonly jobs: Readonly<Record<SessionId, readonly JobView[]>>
  readonly subagents: Readonly<Record<SessionId, SubagentCatalogSnapshot>>
  readonly diagnostics: NovelDiagnostics | undefined
}

const JOB_LABELS: Readonly<Record<string, string>> = {
  running: '进行中',
  stopping: '停止中',
  completed: '已完成',
  killed: '已终止',
  failed: '已失败',
}

const ADVANCED_CSS = `
[data-novel-advanced] { display: flex; flex-direction: column; gap: 16px; }
[data-novel-advanced] h2 { margin: 0; font-size: 18px; }
[data-novel-advanced] section {
  border: 1px solid hsl(var(--nw-border-100));
  border-radius: 10px;
  background: hsl(var(--nw-bg-000));
  padding: 14px 16px;
}
[data-novel-advanced] h3 { margin: 0 0 8px; font-size: 13px; color: hsl(var(--nw-text-200)); }
[data-novel-advanced] .nw-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
[data-novel-advanced] .nw-facts { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 0; }
[data-novel-advanced] .nw-facts dt { color: hsl(var(--nw-text-200)); }
[data-novel-advanced] .nw-facts dd { margin: 0; }
[data-novel-advanced] .nw-row { display: flex; gap: 10px; padding: 4px 0; }
[data-novel-advanced] .nw-status { color: hsl(var(--nw-text-200)); }
[data-novel-advanced] .nw-empty { margin: 0; color: hsl(var(--nw-text-200)); }
[data-novel-advanced] details summary { cursor: pointer; color: hsl(var(--nw-text-200)); }
`

/** The advanced surface. */
export function AdvancedView(props: AdvancedViewProps): ReactNode {
  const jobs = props.sessionId === undefined ? [] : props.jobs[props.sessionId] ?? []
  const catalog = props.sessionId === undefined ? undefined : props.subagents[props.sessionId]

  return (
    <div data-novel-advanced="">
      <style>{ADVANCED_CSS}</style>
      <h2>进阶</h2>
      <section aria-label="内核">
        <h3>内核</h3>
        {props.diagnostics === undefined
          ? <p className="nw-empty">尚未读取作品内核信息。</p>
          : (
              <dl className="nw-facts nw-mono">
                <dt>作品</dt><dd>{props.diagnostics.projectId}</dd>
                <dt>工作区</dt><dd>{props.diagnostics.workspaceId}</dd>
                <dt>目录</dt><dd>{props.diagnostics.cwd}</dd>
                <dt>版本</dt><dd>{`R${String(props.diagnostics.acceptedRevision)}`}</dd>
                <dt>锁定</dt>
                <dd>{props.diagnostics.locks.length === 0 ? '无' : props.diagnostics.locks.join('、')}</dd>
                <dt>线程</dt><dd>{props.sessionId === undefined ? '未选择' : String(props.sessionId)}</dd>
              </dl>
            )}
      </section>
      <section aria-label="任务">
        <h3>任务</h3>
        {jobs.length === 0
          ? <p className="nw-empty">当前线程没有后台任务。</p>
          : jobs.map(job => (
              <div className="nw-row nw-mono" key={job.id} data-novel-advanced-job={job.id}>
                <span>{job.label}</span>
                <span className="nw-status">{JOB_LABELS[job.status] ?? job.status}</span>
                {job.detail !== undefined && <span className="nw-status">{job.detail}</span>}
              </div>
            ))}
      </section>
      <section aria-label="Subagent">
        <h3>Subagent</h3>
        {catalog === undefined || children(catalog).length === 0
          ? <p className="nw-empty">当前线程没有子代理。</p>
          : children(catalog).map(entry => (
              <div className="nw-row nw-mono" key={entry.id} data-novel-advanced-subagent={entry.id}>
                <span>{entry.label ?? String(entry.id)}</span>
                <span className="nw-status">{entry.mode === 'continuable' ? '可续聊' : '一次性'}</span>
                <span className="nw-status">{entry.activity === 'running' ? '运行中' : '已停止'}</span>
              </div>
            ))}
      </section>
      <section aria-label="诊断">
        <h3>诊断</h3>
        {props.diagnostics === undefined
          ? <p className="nw-empty">尚未读取投影。</p>
          : (
              <details data-novel-advanced-canon="">
                <summary>已接受作品事实（原始结构）</summary>
                <div className="nw-mono">{props.diagnostics.canonJson}</div>
              </details>
            )}
      </section>
    </div>
  )
}

/** Only real children: the catalog also reports diagnostics about unreadable children. */
function children(catalog: SubagentCatalogSnapshot): readonly {
  readonly id: SessionId
  readonly label?: string | undefined
  readonly activity: 'running' | 'inactive'
  readonly mode?: 'one-shot' | 'continuable'
}[] {
  return catalog.entries.filter(entry => entry.kind === 'child')
}
