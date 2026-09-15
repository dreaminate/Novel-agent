# Review 审稿执行归属与宿主工具调用 — 2026-09-09

审稿执行、结构化响应校验、正文 Anchor 和 unified diff 已从 Core 移入 Review。
256 个测试和包门禁通过；全新隔离 Profile 中，真实 DSH 子代理完成审稿、完整重启后再次审稿，
无效引用被拒绝，作者只接受 Issue 时保留旧正文。

这轮使用脚本化 LLM adapter，验证原生运行路径，不代表 DeepSeek 审稿质量或真实小说验收。
完整 M2、领域 Tool/Remote/Slot 拆分、Memory 算法、GUI 和前 12 章仍未完成。

## 实现边界

- [Review](../packages/novel-review/src/index.ts) 暴露原生 `novelReview.reviewDraft` Service，
  从 Writing 读取正文、Planning 读取章纲、Memory 读取同 revision 的 control pack 与召回。
  它调用 DSH `spawn`，等待并释放 run，返回不带作者 authorization 的 Result Packet。
- [Core](../packages/novel-project/src/index.ts) 提供 `assertCurrentRevision`，在模型执行前后检查版本，
  保留身份、Storage、作者逐项决定及接受/回滚权。原审稿算法和四个请求/响应 schema 已移出 Core。
- 现有客户端仍调用 Core 的 `reviewDraft` Remote，本轮保留该入口的作者/Workspace 绑定，
  通过共享 typed port 和原生 `ctx.get('novelReview')` 派发；Core 不反向依赖 Review 生命周期或实现。
  专属 Review Remote/Slot 尚未迁移，Memory 服务当前仍调用 Core 的检索算法。

三个模型输出 schema 与基线相同；请求 revision 校验从原别名展开为等价非负整数。
此前有效的错误、版本推进、引用、diff、作者授权与逐项接受断言均保留。

## RED → GREEN 与包验证

写入前保存 85 文件基线及 SHA-256：`.novel-agent/checkpoints/2026-09-09-review-engine/`。
当前 Git 没有 commit，使用逐文件基线 diff，没有覆盖原有未提交内容。

| 检查 | 结果 |
| --- | --- |
| 15:25:40 → 15:33:01 | `novelReview` 不存在的 RED；原八个直接审稿场景改用领域服务后 GREEN |
| 旧作者 Remote | 直接属性访问触发 Cordis 未声明 inject 错误；改用原生可选服务 lookup 后，原三个集成场景通过 |
| 16:11:10 → 16:11:18 | Tools production dependency 的包边界 RED；改为精确 peer + dev 后 GREEN |
| 16:21:08 | `corepack pnpm test:focused`：5 文件、256/256、10.49 秒 |
| 最终门禁 | `corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm build` 通过；构建后重新打包 |

一次未等构建结束便测试的旧导出错误，以及最初合成 Canon 字段不合法，均属验证操作错误，不计为产品 RED。

## 真实 Host 的 Tools 模块身份问题

子代理执行结构化输出时报 `Cannot read properties of undefined (reading 'prepare')`。
官方 rc.1 Agent Loop 通过模块内 `TOOL_RUNTIME_SCHEDULER` Symbol 访问 ToolRuntime。
实查 Host 与 Profile 各解析一份 `dsh-tools`，两个键不相等；安装/启动检查没有覆盖这条路径。

只修改 [Core manifest](../packages/novel-project/package.json) 和
[Review manifest](../packages/novel-review/package.json)：Tools 使用精确 `0.1.2-rc.1` Host peer，
本地测试使用同版 dev dependency。隔离 Profile 的 `pnpm-workspace.yaml` 保持 `autoInstallPeers: false`，
由官方 Host fallback 提供 Tools；重装后 Profile 没有本地 Tools，实际 `structured_output` 调用成功。
没有修改 DSH scheduler、Symbol 或 Agent Loop。安装要求同步到 [README](../README.md) 和 [补丁说明](../patches/README.md)。

新增直接声明复用既有 DSH rc.1、`diff@9.0.0`、`zod@4.4.3`，lock 没有新增解析条目。
静态 peer warning 及可选 `dsh-jobs` / `dsh-sandbox-policy` compatibility warning 仍存在；
该成功组合不能证明任意 Profile 或 Desktop 兼容。

## 隔离运行与冷恢复

目录：`.novel-agent/acceptance/review-engine-20260909/`。复用已验证的官方 rc.1 CLI 加 Session 补丁，
通过真实 `dsh plugin --profile web add` 安装五包和测试 adapter。官方 API 创建父 Session、
选择本地 `review-fixture/scripted` 模型并完成一次父 turn。没有 DeepSeek 调用或用户凭据。

| 生命周期 | 结果 |
| --- | --- |
| 64825，PID 8976 | 接受合成 R1；adapter 对 child 工具数量的假设错误，修正夹具 |
| 61788 | 修正 adapter 后复现 Tools scheduler 身份错误；失败结果保留 |
| 56639，PID 37992 | 修正依赖后审稿成功；无效引用被拒绝，Canon 仍为 R1 |
| 61862，PID 37360 | 完整重启后 `reviewDraft` 首次访问原父 Session 即成功；作者只接受 Issue，拒绝改写正文，形成 R2 |

成功提案引用 R1 正文 `沈砚推开门，看见雪落满旧庭。` 的 `推开门`，Anchor 为 `[2,5)`，
contentHash 与实际正文一致；包含一个 Issue、有效 diff，不含 authorization。
R2 正文仍为上述原文，sourceRevision 为 1。R1 Canon SHA-256：
`8754650adfbd15c7d3d1a9068c9b6660b52115a3720d7963d643d8db513b3aeb`；Issue-only R2：
`2520f2cc04e88125901ceb5c47becadbcacd90bdbcac0e0747f09eba28ebf9fa`。

七份正式 API 结果共 18 次调用：17 成功、1 预期引用拒绝。诊断失败单独保留。
五次本地 spawn 均有配对 start/end；最终三次 child 正常完成，官方 `readFrom` 每次读出 23 事件，
包含 `tool/call`、`tool/result`、`turn/end`。其中一次无效引用由 Review 拒绝，不是 Agent Loop 失败。
脚本 adapter 只替代外部模型响应，没有替代 Agent、工具执行或持久化。

真实 child 工具表为 `structured_output` 与原生 `subagent`；只调用前者。
官方 restriction 筛选继承工具，child scope 自己注册的工具豁免，因此不将 `toolFilter: { allow: [] }`
解读为完全禁止 child 工具。诊断仅存工具名、模型名、运行状态，不保存模型输入或系统提示。

安装包文件名、SHA 与结果索引见该目录 `run.json`。README 五条 pack 命令实跑；Writing/Review
重包仅 manifest 键序变化。收尾检查发现 TypeScript 在 Core 一条参数内注释前生成行尾空格；
移动源注释并重建后通过 whitespace 检查。Core 重包仅该 JS 的注释位置/空白变化，TypeScript AST
均无语法诊断，去注释打印完全一致；其余文件字节相同，原 Host 验收包保留。开发依赖/Host/Profile 的 Session 实现 SHA 均为
`c1d72f32b0b68d2509ca67185ef4875472f944e12fd1f3915cdbe5bbd8ff6522`。
16:21:20 四个端口及所属 Node 进程均为 0，全局 `.dsh` 不存在，fixture mode 已恢复 valid。

本轮没有 GUI、TUI、Desktop、真实 DeepSeek 质量、CI、生产或用户接受证明；没有提交、推送或发布。
