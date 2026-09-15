# Writing 预算自动化与 `novel/automation-policy` 冷恢复 — 2026-09-15

**性质：** 收口 2026-09-09 未完成的 Writing automation 增量，并修复其 required 日志事件的冷恢复缺口。
**授权：** 用户 2026-09-15 选择「扩展 Session 补丁」方案，允许把已维护的 `@deepseek-ai/dsh-session@0.1.2-rc.1` 补丁扩展到跨模块副本的日志类型注册；延续 2026-09-09 的恢复缺口授权，不修改只读上游仓库，不把预算事件标为 `ignorable`。

本记录覆盖：Writing 已有的预算授权/检查/记账归属在真实 Host 中的 required 事件冷恢复验证，以及为此所需的补丁扩展。它不重复 2026-09-09 已记录的导入/发布迁移。

## 1. 增量边界

2026-09-09 的最后一轮把以下实现移入 [Writing automation](../packages/novel-writing/src/automation.ts)：

- `authorize_novel_automation` Tool 的原生 `ask` 审批与作者预算范围解析；
- Result Packet、provider-reported Token、作者 USD 费率、wall-time、DSH started-retry 的总量与逐单元预算检查；
- `novel/automation-policy` 会话记录（runId、状态、计数、停止规则）与 proposal 记账；
- `novel/canon/accepted` / `rolled-back` 仍走 Core 的派生通知（`{ ignorable: true }`）。

该轮结束时本地 268 个测试通过，但 required 的 `novel/automation-policy` 事件在冷恢复时被持久化 reader 拒绝；旧验收目录保留失败现场。

## 2. RED：required 事件无法冷恢复

旧隔离 Host 的失败证据：`.novel-agent/acceptance/writing-automation-20260909/artifacts/cold-preview.json`（2026-09-09 22:27）：

```text
resume failed for session "writing-automation-pending":
SessionQueryError: ... contains event type "novel/automation-policy" (seq 39)
unknown to this harness and not marked ignorable; refusing to interpret the log
```

2026-09-15 复现时用 Node loader hook 记录了实际模块解析（`close/module-resolutions.jsonl`）：真实 Host 同时加载了两份 `dsh-session` 模块实例——

- `sessions` 服务与全部 novel 插件解析到 profile 副本（`profiles/web/node_modules/@deepseek-ai/dsh-session`）；
- `dsh-session-persistence` reader 解析到官方安装副本（`runtime/node_modules/.pnpm/@deepseek-ai+dsh-session@...`）。

`SessionStore.registerLogEventType` 只修改所服务实例所在副本的模块级 `Set`，reader 检查的是另一份 `Set`，因此注册不生效。这不是插件加载失败，而是 DSH 同一包多模块副本下的身份问题（与 Review 迁移记录的 Tools scheduler Symbol 同类）。

## 3. GREEN：补丁共享类型注册表

补丁 `patches/@deepseek-ai__dsh-session@0.1.2-rc.1.patch` 在原有两处扩展之外，把 `KNOWN_SESSION_EVENT_TYPES` 的创建改为进程级共享：

```js
// lib/index.js 与 lib/types/known-event-types.js
const KNOWN_SESSION_EVENT_TYPES =
  globalThis[Symbol.for("@deepseek-ai/dsh-session/known-session-event-types")] ??= new Set([...])
```

这样不论 Host 加载哪一份副本，`registerLogEventType` 的注册都对持久化 reader 可见；`novel/automation-policy` 保持 required，不获得 `ignorable` 语义。

配套 focused 测试（`packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts`）：

- `shares a registered log-only event type across separately loaded session module copies`
  通过带 query 的动态 import 加载第二份模块实例，断言其 `KNOWN_SESSION_EVENT_TYPES` 与已加载副本是同一 `Set`，且注册立即可见。补丁扩展前该测试失败（RED，两个不同 Set），扩展后通过。
- 旧补丁哈希 `debc866f...`，新补丁 SHA-256 `8c38458c088392c15dd34c99d60f4cc4fd47a70c1f602a7d6aac3b6d4a79b4f0`。

## 4. 包门禁

| 检查 | 结果 |
| --- | --- |
| `corepack pnpm test` | 5 文件 / 269 通过（新增 1 个跨副本测试），exit 0 |
| `corepack pnpm typecheck` | exit 0 |
| `corepack pnpm lint` | exit 0 |
| `corepack pnpm build` | 五个包全部 exit 0 |
| `pnpm-lock.yaml` | 仅 `patch_hash` / peer-suffix 行变化；归一化后唯一差异是 `patchedDependencies` 哈希行，无解析版本变化 |

## 5. 隔离 Host 验证

运行时为官方 `0.1.2-rc.1` CLI（`session-recovery-20260909/runtime`），Profile 保持 `autoInstallPeers: false`，两份 workspace 都应用打补丁后的 `dsh-session`。

### 5.1 原验收 Home（存在两份模块副本）

把新补丁重新应用到 runtime 与 `writing-automation-20260909/dsh-home` 后，对同一 `writing-automation-pending` 会话做冷恢复：

- `close/cold-resume-patched.json`：`resumed: true`，`acceptedRevisionAfterResume: 0`；
- `close/stop-patched.json`：端口 `58144` 已释放，Canon storage 与两份 session `.zstd` 哈希前后一致（`unchanged: true`）；
- `close/host-patched.log` 只有 URL 行，无插件加载错误。

### 5.2 全新隔离 Home

新建 `writing-automation-close-20260915`：复制持久化 sessions/storages/settings，重新用 `dsh plugin --profile web add` 安装五个产品包与脚本化 probe，Profile 应用同一补丁。

- `close/cold-resume-fresh.json`：`resumed: true`，`acceptedRevisionAfterResume: 0`；
- `close/stop-fresh.json`：端口 `49982` 已释放，存储与 session 完全不变；
- `close/module-resolutions-fresh.jsonl`：runtime 副本（`@deepseek-ai+dsh-session@0._bb3d09d5...`，含共享注册表）同时服务 `dsh-base`、`dsh-session-persistence` 与 profile 副本；注册跨副本生效。

冷恢复只读取并解释日志，不产生模型调用、不推进 Canon、不写回自动化状态。

## 6. 文档更新

- `patches/README.md`：补丁范围改为两条（`{ ignorable: true }` 与 `registerLogEventType` 的进程级共享注册表），并保留「`novel/automation-policy` 是 required、不要标为可忽略」的约束。
- `AGENTS.md`「DSH 唯一内核」：补丁描述同步到两条扩展（用户已选择该修复方案）。
- 本文件与 `tasks/todo.md` 的新增切片条目。

## 7. 验证与限制

- 本轮不包含真实 DeepSeek 调用、GUI 点击或外部模型质量验收；Host 验收使用脚本化 probe，仅验证原生 Session/持久化/Remote 路径。
- 预算行为（Token/USD/wall-time/retry 的逐单元检查）由本地 focused 测试覆盖，未在隔离 Host 中重跑完整 automation 场景。
- 同一 Host 中其它官方包的重复模块副本仍存在；本轮只修复 `dsh-session` 日志类型注册这一处可复现缺口，未做全量 manifest/Host 依赖收敛。
- 旧验收目录中 `close/cold-resume.json`、`close/cold-resume-globalkey.json` 是方案调查阶段的受控实验（分别临时移开第二份副本、临时手改两份 `lib/index.js`），现场已恢复；正式 GREEN 以 `-patched` / `-fresh` 两组为准。
- 未提交、推送或发布；仓库仍无 Git commit 基线，回滚依赖 `.novel-agent/checkpoints/`。
