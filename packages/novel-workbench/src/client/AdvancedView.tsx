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
import type { NovelAdvancedPanels } from './novel-data.js'

export interface AdvancedViewProps {
  readonly sessionId: SessionId | undefined
  readonly jobs: Readonly<Record<SessionId, readonly JobView[]>>
  readonly subagents: Readonly<Record<SessionId, SubagentCatalogSnapshot>>
  readonly diagnostics: NovelDiagnostics | undefined
  /** Plugin inventory, presets and dynamic Cordis plugins from the Host. */
  readonly panels: NovelAdvancedPanels | undefined
  /** Reload the inventory-backed panels (the 重试 affordance). */
  readonly onReload: () => void
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
  border: 1px solid hsl(var(--border-100));
  border-radius: 10px;
  background: hsl(var(--bg-000));
  padding: 14px 16px;
}
[data-novel-advanced] h3 { margin: 0 0 8px; font-size: 13px; color: hsl(var(--text-200)); }
[data-novel-advanced] .nw-mono {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  /* Wrap at boundaries. break-all split character-state across two lines,
     which is not JSON anyone can read. */
  word-break: normal;
  overflow-wrap: break-word;
}
/*
 * The raw projection, on an editor surface rather than loose on the panel. A
 * projection runs long, so it gets a ceiling and scrolls — the way a settings
 * pane does — instead of pushing the sections below it off the page.
 */
[data-novel-advanced] .nw-code {
  margin: 8px 0 0;
  padding: 10px 12px;
  border: 1px solid hsl(var(--border-100));
  border-radius: var(--r-ctl);
  background: hsl(var(--bg-200));
  max-height: 320px;
  overflow: auto;
}
[data-novel-advanced] .nw-facts { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 0; }
[data-novel-advanced] .nw-facts dt { color: hsl(var(--text-200)); }
[data-novel-advanced] .nw-facts dd { margin: 0; }
[data-novel-advanced] .nw-row { display: flex; gap: 10px; padding: 4px 0; }
[data-novel-advanced] .nw-status { color: hsl(var(--text-200)); }
[data-novel-advanced] .nw-empty { margin: 0; color: hsl(var(--text-200)); }
[data-novel-advanced] details summary { cursor: pointer; color: hsl(var(--text-200)); }
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
      <section aria-label="插件清单">
        <h3>插件清单</h3>
        {props.panels === undefined
          ? (
              <p className="nw-empty">
                尚未读取插件清单。
                <button
                  type="button"
                  className="btn sm"
                  data-novel-advanced-reload="true"
                  onClick={() => { props.onReload() }}
                >
                  重试读取
                </button>
              </p>
            )
          : props.panels.plugins.map(plugin => (
              <div
                className="nw-row nw-mono"
                key={plugin.entryId ?? plugin.moduleName}
                data-novel-advanced-plugin={plugin.entryId ?? plugin.moduleName}
              >
                <span>{plugin.moduleName}</span>
                <span className="nw-status">{plugin.state}</span>
                <span className="nw-status">{plugin.enabled ? '启用' : '已停用'}</span>
              </div>
            ))}
      </section>
      <section aria-label="Agent preset">
        <h3>Agent preset 与模型</h3>
        {props.panels === undefined || props.panels.presets.length === 0
          ? <p className="nw-empty">这份部署没有读取到 agent preset。</p>
          : props.panels.presets.map(preset => (
              <div className="nw-row nw-mono" key={preset.id} data-novel-advanced-preset={preset.id}>
                <span>{preset.name}</span>
                <span className="nw-status">{preset.isDefault ? '默认' : '可选'}</span>
                <span className="nw-status">{preset.trust === 'system' ? '随部署发布' : '用户自建'}</span>
                <span className="nw-status">{`${String(preset.rows)} 个插件行${preset.conditional > 0 ? ` · ${String(preset.conditional)} 条按条件` : ''}`}</span>
                {preset.broken !== undefined && <span className="nw-status">{preset.broken}</span>}
              </div>
            ))}
      </section>
      <section aria-label="Cordis 插件树">
        <h3>Cordis 插件树</h3>
        {props.panels === undefined
          ? <p className="nw-empty">尚未读取 Cordis 插件。</p>
          : props.panels.cordis.length === 0
            ? <p className="nw-empty">这份部署还没有由模型定义并运行的 Cordis 插件。</p>
            : props.panels.cordis.map(row => (
                <div className="nw-row nw-mono" key={row.pluginId} data-novel-advanced-cordis={row.pluginId}>
                  <span>{row.pluginId}</span>
                  <span className="nw-status">{row.current ?? '未命名版本'}</span>
                  <span className="nw-status">{row.running ? '运行中' : '已停止'}</span>
                  <span className="nw-status">{`${String(row.packages)} 个版本 · 线程 ${row.agentId}`}</span>
                </div>
              ))}
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
                <div className="nw-mono nw-code">{props.diagnostics.canonJson}</div>
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
