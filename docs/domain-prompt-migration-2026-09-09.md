# 领域提示归属与原生热加载 — 2026-09-09

Core 的单段 `novel:authoring-stages` 已按责任拆成五个原生 SystemPrompt 段。
原有 11 段指令内容全部保留；只启用 Core 时仅有 Canon 提示，组合后按固定顺序组装。
255 个测试和包门禁通过，真实 Agent scope、同进程热禁用/恢复及完整重启均验证成功。

本次只推进提示所有权。它不证明模型行为质量或完整 M2；领域算法、wire/schema、旧 Tool/Remote
调用方、新 Slots、GUI 和前 12 章验收仍未完成。

## 归属与复用

| 原生段 | 所有者 | 内容 | 顺序 |
| --- | --- | --- | --- |
| novel:canon | [Core](../packages/novel-project/src/index.ts) | Canon 权威、只读 Ask、作者接受与通用 DSH workflow 边界 | 120 |
| novel:memory | [Memory](../packages/novel-memory/src/index.ts) | Chapter control pack 与历史写作记忆使用规则 | 121 |
| novel:planning | [Planning](../packages/novel-planning/src/index.ts) | Project setup、Plan | 122 |
| novel:writing | [Writing](../packages/novel-writing/src/index.ts) | Write、bounded automation、Publish | 123 |
| novel:review | [Review](../packages/novel-review/src/index.ts) | Review 的提案边界 | 124 |

四个领域插件通过原生 `ctx.inject(['systemPrompt'])` 和 `systemPrompt.section` 发布内容，
注册及释放复用 Cordis effect。Core 保留自己的原生段，没有第二套 prompt registry、装配器或 watcher。
四包新增直接声明的是已经解析的 `@deepseek-ai/dsh-system-prompt@0.1.2-rc.1`（MIT），没有新第三方版本。

按 TypeScript AST 提取原字符串与新字符串，去掉标题/空行后逐项对照：11 段各保留一次。
本次改变标题、归属和组装顺序，没有删减已有业务指令。提示仍不替代 Host 端事务与审批约束。

## RED → GREEN

写入前保存 85 个文件与 SHA-256：`.novel-agent/checkpoints/2026-09-09-domain-prompts/`。
当前 Git 没有 commit，继续用实际字节快照审查变化。

- 14:32:09：Core-only 与完整组合两条 RED 都仍只看到旧 `novel:authoring-stages`。
- 14:34:52：Core-only 为 Canon 段，完整组合为五段；旧的阶段/检索/workflow 断言仍通过。
- 14:37:24：受控删除 Writing 的 Planning 依赖后，卸载 Planning 留下 `novel:writing`，有效 RED。
- 14:37:28：恢复依赖并重建，卸载后只剩 Canon，GREEN。

此前尝试经 root context 注册的受控改动仍被原生上下文追踪正确释放，测试通过，因此没有将它计为 RED。
该实验及后续依赖改动均已恢复。有效测试未删除或弱化；旧内容断言改为检查真实原生组合的完整内容。

最终 `corepack pnpm test:focused`：14:39:18，5 文件、255/255、23.87 秒。
`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm build` 均通过。

## 真实 Host 与 Agent-scope 组装

新 Home：`.novel-agent/acceptance/domain-prompts-20260909/`。复用已验证、同补丁的官方 rc.1
CLI，先通过真实 `dsh plugin --profile web add` 安装 Core 和诊断插件，再加入四个领域插件。
Profile 的 `patchReload` 是官方 `live`；源代码核对其 `watchUserPatches` 监听用户 patch，
以及 Cordis include 的 `id/disabled` patch 格式。未实现自己的热加载。

| PID / 端口 | 操作 | 结果 |
| --- | --- | --- |
| 18344 / 60604 | Core-only 创建 prompt-core Session | 实际 Agent scope 只有 novel:canon |
| 32584 / 63304 | 完整五包；创建 prompt-full | 五个段按顺序存在 |
| 同一 32584 / 63304 | 用户 patch 设置 novel-planning disabled:true；创建 prompt-unloaded | 只剩 Canon，宿主未重启 |
| 同一 32584 / 63304 | patch 恢复为 []；创建 prompt-restored | 五段恢复，哈希与禁用前一致 |
| 28396 / 55377 | 完整进程重启，恢复原 prompt-full Session | 五段名称/长度/哈希与启动及热恢复结果一致 |

诊断插件调用真实 `systemPrompt.assemble({ scope: agent })`，只保存 `novel:` 段的名称、
长度和 SHA-256。没有保存组装后的提示正文、其他提示段内容、凭据或任何模型输入快照。

| 段 | 字符数 | SHA-256 |
| --- | --- | --- |
| novel:canon | 751 | 6721faf54991333ae416573c393507325e5b96961f12572add3060683b69d762 |
| novel:memory | 288 | b558d174eea70dd77a3cd63d50059fc61c6243d5245a320cf905bb90ad4e2251 |
| novel:planning | 1624 | ead3c20bfe4f96ce01a929e0257dfeaddfb27bb8ead5b593e8c75b0825fa83b7 |
| novel:writing | 2266 | 77d5346f4be135438397f2e8cfb4c79251c7e761f7418caca0eeb2f8f97503c8 |
| novel:review | 174 | 00df1cb95bad95cc106e14339501496f8ab63b5fb3da75c2eed3a874514b8337 |

这些哈希也与当前源文件中的对应字符串一致。9 个真实 RPC 结果全部成功；四个 Session 的
官方 `readFrom` 共读到 13 条内置事件，零模型 turn、零 Canon 通知。Canon 一直为 R0，
文件 SHA-256 为 `dd74815b90efdbed36448b1313c099cd3f0a3e71810fb5e98c80e2f5c46ac5f8`。

元数据在该目录 `artifacts/prompt-core-startup.json`、`prompt-full-startup.json`、
`prompt-unloaded-startup.json`、`prompt-restored-startup.json`、`prompt-full-resume.json`。
实际安装包哈希及运行摘要见 `run.json`。Profile patch 已恢复为 `[]`。

14:57:53 检查三个端口及本次 Node 进程均为 0，全局 `.dsh` 不存在。没有新的 GUI/TUI/Desktop
或模型质量验收。CLI 仍有静态 peer warning；实际运行证据不被扩大为 peer 全绿、生产或作者接受。

检查点收尾：85 基线文件哈希保持，32 个变更文件及新报告的 whitespace 检查通过；七份文档
326 个本地链接存在，9 个 RPC 结果逐项核对。README 五条 pack 命令实跑；Memory/Review
重包只有 manifest 键顺序变化，依赖值及运行文件字节相同，重包哈希单记在 run.json。
三环境 Session 补丁实现仍一致，r20/u26 当前/历史地图一致，完整 Goal 保持 active。
