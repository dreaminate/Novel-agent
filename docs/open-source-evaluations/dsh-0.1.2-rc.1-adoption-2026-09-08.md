# DSH 0.1.2-rc.1 采用与插件迁移 — 2026-09-08

**用户已明确选择 `0.1.2-rc.1`。产品依赖、锁文件及必要接口已迁移；244 个测试、typecheck、lint、build 通过，全新官方 Web Profile 完成无正文 R1、R2、回滚 R3 和页面刷新。自定义 Canon 事件的完整宿主冷恢复仍失败，未宣称修复或 M1 完成。**

原 rc.2 / Desktop 2.0.2 的版本限制被用户的新选择取代；其余单一 DSH 内核、上游只读、作者决策和小说事实边界不变。本次没有采用 alpha，也没有安装或验收社区 Desktop 2.0.5。

## 选择依据与成熟度

- 来源：[官方 Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-rc.1)，精确 commit `a66e4702047846cdaa10c66c9d3df3951f5ea70d`，MIT。
- 官方[同 tag README](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/dsh-v0.1.2-rc.1/README.md)明确定位为 developer preview，说明仍快速迭代并会有破坏兼容的变化；Release 标为 Pre-release。本次实际页面也显示 Internal Testing Notice，说明多处仍需完善。
- [完整官方宿主试跑](../dsh-full-host-upgrade-trial-2026-09-08.md)已经证明普通会话可恢复、自定义事件被拒绝。用户了解此结果后仍指定该版本作为开发基线，采用不是把失败门禁改成通过。

本次具体缺口是：公开 `SessionEventMap` 与 `Session.append` 支持写插件事件，但 reader 拒绝不在核心目录且未标 `ignorable` 的事件，公开 writer 又没有设置该信封标记的入口。拒绝未知必需事件是上游有意保守处理；不完整的是这条插件写入与恢复链。它不能证明整个 Host、普通会话或模型不可用。

## 实际迁移

| 范围 | 改动 |
| --- | --- |
| 依赖 | 52 项直接 DSH 依赖全部精确 `0.1.2-rc.1`，Cordis `4.0.2`；实际解析遍历得到 68 个 DSH 包，全部同版本，root peers check 无问题 |
| Session 读取 | 使用官方 `snapshotEvents()`；原有预算折叠、replay seed 和 Canon 事件断言保持原语义；`JsonValue` 移到公开 `dsh-util-values` |
| 客户端 | 已退役且无 rc.1 发布的 `dsh-client-runtime` 被移除；使用 Cordis `Context` 和官方 renderer/session/workspace 类型声明；仍只贡献一个 `conversation.view` |
| Chat 数据 | 面板通过官方 `useChat(chat => ...chat.legacy)` 读取上游自带节点投影；不实现另一份 Chat、Session、Store 或通用视图 |
| 类型依赖 | `client-store`、`api-workspace-controller` 等在上游公开 `.d.ts` 中被引用，但上游只列为 devDependencies，因此在本包显式声明消费者所需的精确类型提供包 |
| 原生恢复测试 | 采用官方 `SessionController`、`AgentDefaultModel`、`LocalAttachmentStore({ dshHome })` 和 Session Query；普通 live-Agent 测试使用 `AgentRegistry` 自带 lookup |
| 测试边界 | SQLite provider 使用 `openAt: never`，`observeSession()` 仍通过实际 JSONL persistence 借用持久 Session；不声称覆盖 SQLite 索引。RPC-only 夹具补齐新版 connection 生命周期面，不模拟 Remote event/stream；真实 Host smoke 使用真实 transport |

未复制或修改 DSH 源码、Agent Loop、reader、writer、静态事件目录和存储日志；未改变 Canon 事件的四字段协议。客户端正常退出仍撤销 Slot 和 Remote；按当前项目 Fail raw 规则移除了未请求的激活失败 catch 分支。

## 验证

升级前快照位于 `.novel-agent/checkpoints/2026-09-08-rc1-adoption/`，保存 52 个文件及 SHA-256。仓库仍无 Git commit / 已跟踪基线，不能用空 diff 证明无旧改动。

| 验证 | 结果 |
| --- | --- |
| 版本 focused RED | 16:58，既有 provider 边界测试期望 rc.1，实际 rc.2，预期失败；切换后 5/5 通过 |
| 新 Chat 形状 focused RED/GREEN | 17:10，按官方 Chat 形状更新夹具后旧面板报 `useSession is not a function`；17:12，迁移到 `useChat` 后相同关系面板断言通过 |
| 原生冷预览 | 17:25，真实 JSONL、同 ID 恢复、idle、无模型轮次、Canon R0，focused 通过 |
| `corepack pnpm test:focused` | 17:25:49，5 文件、244/244、15.46s |
| `corepack pnpm typecheck` / `lint` / `build` | 全部通过；保留原 Typert generator 与浏览器模块包装方式 |
| 独立复核 | W011 客户端接口、W013 恢复入口、W014 实际解析/许可证；R005 检查迁移 diff 与测试语义，无未解决的范围内回归发现 |

安装使用 `corepack pnpm install --ignore-scripts`。一次指定 DSH 模式的 `pnpm update ...@0.1.2-rc.1 --save-exact` 还重算了部分锁定的构建工具传递版本；非 DSH 直接依赖版本未修改。旧自动 peer 未全部更新时，按实际缺失项显式声明了同版测试 peer；最终 root lock 不含 rc.2 / Cordis 4.0.1。

## 全新 Profile 与实际 UI

证据目录：`.novel-agent/acceptance/rc1-adoption-20260908/`；过滤结果为 `run.json`。产品包含 15 个文件，SHA-256：

```text
468fbbcda9f7897676a66eb00b342fd3515346c0a396cec823d3023ee2ac2f9d
```

使用完整官方 rc.1 CLI，通过 `plugin --profile web add --ignore-scripts <绝对 tgz 路径>` 安装产品包成功。Profile 自己有 32 个 DSH manifest，全部 rc.1；静态 Profile peers check 会报告 stock Host fallback 提供的 peer 未在 Profile 本身安装，这个静态结果未冒充无警告。实际 Host、Remote 和 UI 运行成功。

试验用了三个完整进程 lifetime：57301、56889、57310。所有 Home、Workspace 和文件都在上述隔离目录，用户全局 `.dsh` 未创建。浏览器经官方自动打开的正常认证流程进入；临时登录材料只在内存中使用，不在证据文件中保存。

rc.1 的空会话会隐藏整个 `conversation.view`。为验证面板且不调用模型，使用本仓库自建 `ui-seed-fixture`，仅向固定测试 Session 通过公开 append 写入一条标明夹具身份的内置用户消息。它不是模型生成或真实小说验收。

该辅助 fixture 安装在 pnpm 报告文件写入完成后迟迟不退出，CLI 尚未把它加入 bundles；已停止该安装及测试 Host，随后在隔离 Profile 手动启用它，并只更新这份自建 fixture 的源文件和已安装副本，使已有空测试会话恢复时补入一次消息。原 fixture tgz 保留为初次安装记录；最终可复核源码位于 `ui-seed-fixture/index.js`，与 Profile 副本一致。没有修改 DSH、任何社区插件或已打包的小说插件来通过验收。

在真实 `Novel Project` tab 上完成：

1. 读取 R0；粘贴没有 manuscript 的合成提案，选择一项 Delta，预览 R0 → R1，Canon 仍为 R0。
2. 作者 Apply 后 R1 为“测试码头夜间关闭”；同一事实更新为 R2“开放”。
3. 作者 Rollback to R1 后生成 R3，内容恢复“关闭”。
4. 页面 reload 后仍显示 Revision 3 和对应事实；本站来源 warning/error 为 0。浏览器扩展自身的警告另计，没有混作本站错误或宣称所有 console 全部为 0。

## 冷恢复仍受阻，但 Canon 数据保留

停止 UI Host 后重启同一 Home，再调用原生 `session/create` 恢复 `rc1-ui-seed`：HTTP 200，但 `result.ok: false`，`gateway/internal`，内层错误：

```text
novel/canon/accepted (seq 6) unknown to this harness and not marked ignorable;
refusing to interpret the log
```

同一新 Host 的 `novelProject/current` 仍成功返回 `acceptedRevision: 3`。冷恢复拒绝前后：

- Canon 文件 SHA-256 均为 `7079fba777dc2197ca70a1f67e965af2c3f803090fe673ca3c2885a8ce00d7c0`。
- Session 文件均为 1387 bytes，SHA-256 `631583954e0d24d3cb6aa5d5ebe32ed20b2b47baa611ba9bf6c3fd4a31cbd1c9`。

17:58 检查本次 Node 进程为 0，三个端口监听为 0，测试浏览器页面已关闭。没有模型请求、密钥配置、外部模型质量、Desktop、CI、生产或作者小说质量验收。

## 后续接口方案的精确限制

R004 复核指出：当前 accepted/rolled-back 四字段事件是完整原生 Storage Revision 的派生通知；不是仅凭它们就能重建 Canon 的唯一记录。rc.1 实现若遇到 marker 会保留原事件，只跳过核心已知类型检查，但协议允许不认识该类型的 reader 省略它。

因此，未来明确授权的 marker 方案只能逐事件选择，并验证这两种通知的原始记录与 Canon 恢复。不能笼统把所有小说事件标成 ignorable；`novel/automation-policy` 的预算事实确实依赖 Session 日志，不能用同一办法处理。此前补丁提案仍未实施，也不能承诺所有后续插件事件都因此解决。
