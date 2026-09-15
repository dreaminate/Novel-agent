# DSH Session 恢复补丁

`@deepseek-ai__dsh-session@0.1.2-rc.1.patch` 是本项目经用户授权维护的本地补丁，基于官方 MIT 版本 `0.1.2-rc.1`。它不是 DeepSeek 官方发布的修复。上游版权和许可见 [LICENSE.deepseek](LICENSE.deepseek)。

补丁给公开 `Session.append` 增加仅用于 log-only 事件的可选 `{ ignorable: true }`。没有选择该参数时仍是 required 事件；surface 事件不接受这个兼容性标记。原 seq/time、冻结、事件发布和持久化路径保持。

补丁还给 `SessionStore` 增加 `registerLogEventType(type)`：插件在加载时声明本 Host 认识的 log-only 事件类型，否则持久化 reader 会按「更晚的 harness 写入的日志」拒绝恢复。已知类型注册表是进程级共享的（`globalThis` 上以固定 Symbol 保存），因为真实 Host 可能为 `sessions` 服务与持久化 reader 分别解析出两份 `dsh-session` 模块副本；只改模块内局部 `Set` 时注册不会跨副本生效。

本项目只有 `novel/canon/accepted` 和 `novel/canon/rolled-back` 使用 `{ ignorable: true }`；这两条记录是完整原生 Storage Revision 的派生通知。`novel/automation-policy` 是 required 记录，只通过 `registerLogEventType` 声明，不要标为可忽略。

## 安装范围

根 `pnpm-workspace.yaml` 已登记 `patchedDependencies`，在本仓库运行 `corepack pnpm install` 会应用补丁。`pnpm patch-commit` 只是生成依赖补丁，不是 Git 提交。

**实际运行 DSH 的 Host 和 selected Profile 也必须应用同一补丁。** 只修改 novel-agent 的开发依赖，不会修复另一个原样安装的 CLI 或 Desktop。两处 pnpm workspace 配置都使用：

```yaml
patchedDependencies:
  '@deepseek-ai/dsh-session@0.1.2-rc.1': <指向本文件夹补丁的路径>
```

保持原有配置，并按该安装目录调整补丁路径，再运行正常的 pnpm install。本仓库已在以下两处实际安装、核对源码哈希并完成完整进程重启测试：

- `.novel-agent/acceptance/session-recovery-20260909/runtime/`：官方 `@deepseek-ai/dsh@0.1.2-rc.1`，附同一 pnpm patch。
- `.novel-agent/acceptance/session-recovery-20260909/dsh-home/profiles/web/`：官方 Web Profile 加打包小说插件。

从仓库根启动这套已验证的测试环境：

```powershell
$env:DSH_HOME = Join-Path (Get-Location).Path '.novel-agent/acceptance/session-recovery-20260909/dsh-home'
$env:DSH_TELEMETRY_DISABLED = '1'
$env:PATH = "C:\coding-projects\novel-agent-development\runtime\node_modules\.bin;$env:PATH"
node .novel-agent/acceptance/session-recovery-20260909/runtime/node_modules/@deepseek-ai/dsh/lib/bin.js --profile web --host 127.0.0.1 --port 0 --no-open
```

这是原有官方 CLI 和 Profile 的测试组合，不新增 novel-agent 运行时、安装器或 Agent Loop。其 Canon 数据是合成验收夹具；请勿把它当成真实小说成果。社区 Desktop 的补丁部署仍未验证。

五领域包的后续 [Review 宿主验证](../docs/review-engine-migration-2026-09-09.md) 还确认了 Tools 的安装要求：
Core/Memory/Review/Writing 使用精确 `@deepseek-ai/dsh-tools@0.1.2-rc.1` Host peer，所选 Profile 的
`pnpm-workspace.yaml` 保留 `autoInstallPeers: false`，通过官方 fallback 使用完整 Host 的 Tools。
Profile 不应额外安装该包，否则两份 scheduler Symbol 会导致实际工具调用失败。
这是包依赖修正，不是新的 DSH 内核补丁；只应用 Session 补丁不能解决重复 Tools 模块问题。

## 验证与限制

```powershell
corepack pnpm test packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts -t 'restores accepted and rolled-back Canon notifications'
```

测试覆盖真实 JSONL、运行环境重建、接受与回滚事件的原样保留、作者续接，以及未标记未知事件仍被拒绝。跨模块副本注册由 `-t 'shares a registered log-only event type across separately loaded session module copies'` 覆盖。完整宿主证据见 [恢复报告](../docs/canon-session-recovery-2026-09-09.md)；Writing 预算日志的 required 事件冷恢复证据见 [automation 迁移记录](../docs/writing-automation-migration-2026-09-15.md)。

补丁不会迁移已经写入的旧日志。此前未标记的失败记录继续保留为反证，不能仅靠安装新的 writer 自动修复。当前 rc.1 reader 会保留带标记的原始事件，但协议允许不认识事件类型的其他 reader 省略它；不能把该机制用在唯一的领域事实记录上。
