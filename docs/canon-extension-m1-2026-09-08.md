# M1 Canon 扩展检查点 — 2026-09-08

**状态：`blocked`。** 本轮实现了接口候选并通过本地检查，但真实隔离 Profile 的会话冷恢复失败；不能把 M1 或新的领域插件组合标为完成。

**后续进展：**用户已授权评估并采用通过验证的官方新版。随后检查的 `0.1.2-rc.1`、`0.1.3-alpha.2` 与 Desktop `2.0.5` 仍未提供通过必要验证的恢复路径，见 [官方版本评估与可复现验证](open-source-evaluations/dsh-session-event-upgrade-2026-09-08.md)。下文保留最初 rc.2 检查点证据；升级授权不再是待答项。

## 已实现的候选

- `NovelProjectService.registerExtension({ namespace, valueSchema })`：由 Cordis injection 调用并返回卸载 disposer；`set` 与 `remove` 均要求活动注册，只有 `set` 校验领域值。领域 schema 校验不改写原 JSON。
- `ExtensionCanonDelta` 使用 `kind: 'extension'` 与 `namespace: string`。accepted revision 保留原 Delta，Canon fact/entity 的 `kind` 投影为完整 namespace；继续复用现有 key、来源、预览、作者逐项接受与回滚。
- 扩展事实可通过原生审批加锁/解锁，锁跨服务 reload 保留，Preview/Apply/rollback 共用事实身份与冲突检查。
- 核心 `accept → review` 与 `rollback` 从 provenance 查找真实 DSH Session，在成功事务后追加 `novel/canon/accepted` / `novel/canon/rolled-back` 并调用官方 `sessions.flush()`。这部分能写入磁盘，但当前 rc.2 无法恢复含这些事件的 Session，见下文。
- 既有 Core/Narrative 测试夹具改为创建真实 Session，未删除、跳过或弱化原有断言。

实现：[Host](../packages/novel-project/src/index.ts)、[类型](../packages/novel-project/src/types.ts)、[schema](../packages/novel-project/src/result-packet-schema.ts)。测试：[Core](../packages/novel-project/tests/novel-project.spec.ts)、[Narrative](../packages/novel-project/tests/novel-project-narrative.spec.ts)、[生成 Remote 集成](../packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts)。

当前未进行 Canon 核心收缩、Planning/Writing/Memory/Review/MiroFish 拆包，也未生成或验收小说正文。临时扩展只是协议 fixture，不是 Planning 或 Writing 产品实现。

## 本地 RED/GREEN 与检查

| 检查 | 本轮结果 |
| --- | --- |
| 修改前 `corepack pnpm test:focused` | 5 文件，239/239 |
| 两个 Cordis 扩展注册 RED | `registerExtension is not a function` |
| 扩展锁 RED | 原锁 `kind` 枚举拒绝 namespace |
| Canon SessionEvent RED | 三次核心事务完成，事件数组仍为空 |
| 独立复核后的卸载 RED | 未注册的 `remove` 意外接受为 R2 |
| 对应 GREEN | 四个新增 focused 场景通过 |
| 最终 `corepack pnpm test:focused` | 5 文件，243/243，13.89s |
| `corepack pnpm typecheck` / `corepack pnpm lint` | 通过 |
| `corepack pnpm --filter @novel-agent/novel-project build` | Typert、Host/Client TypeScript、client bundle 通过 |
| 包目录 `pnpm pack --pack-destination …` | 15 文件的独立 Canon tgz |
| baseline `git diff --no-index --check` 与 `git diff --check` | 无新增空白错误 |

受限进程的 `tsx` 曾因 `os.userInfo()` / `uv_os_get_passwd ENOMEM` 在编译前失败；独立探针复现，机器当时有约 20 GB 可用内存。相同构建在普通本机进程成功，未修改依赖或产品代码来绕过此环境错误。`pnpm exec vitest` 的 Windows launcher 也未启动测试，focused 检查改用仓库已有 `pnpm test <file> -t <name>`。

普通内存 `sessions.create({ seed: events })` 绕过了 PersistenceCoordinator 的格式门禁，因此该测试只证明内存 replay，不能证明真实恢复。最终状态以隔离运行的失败为准。

检查点文档更新后，独立复核未发现误导完成声明或损坏的相对链接；`corepack pnpm test packages/novel-project/tests/product-boundary.spec.ts` 再次通过 5/5。10 个已有快照文件的 no-index whitespace check 与 `git diff --check` 无新增空白错误。

## 隔离 Profile 的真实证据

使用已准备的独立 CLI `0.1.1-rc.2`、pnpm `11.7.0` 和全新 `DSH_HOME`。通过原生 `dsh plugin --profile web add --ignore-scripts` 安装本轮 Canon tgz 和临时扩展 fixture；正常宿主为 `dsh-base + dsh-web-app`。

证据目录为 `.novel-agent/acceptance/m1-20260908/`。`run-final.json` 保存实际 Home、Workspace、Session；`canon-r1.json`、`canon-r2.json`、`canon-r3-native.json` 为审计快照，原生 Home 内的 `storages/novel_project.json` 才是事实源。

最终打包 Canon tgz SHA-256：`656f1b2e1a495d1b8f01f9b8ad712720e00b3d2eca1198a85a8fc7f25a31ee56`。

实际观察：

1. 原生 `workspace.create` / `session.create` 建立隔离工作区与会话；UI 执行只读 `/goal`，未调用模型。
2. 现有 `conversation.view` 审阅两个 namespace 的无正文提案；R1 接受后正文 projection 为空。
3. R2 只把 Writing 状态由 `planned` 改为 `drafting`；Planning 值和历史 R1 不变。
4. Preview 前后 Canon 文件字节相同。故意把 `status` 改为数值时，真实 Preview 与 Apply 均返回字段 `status` 的原始 Zod 错误，Canon 仍为 R2，文件字节不变。
5. 通过现有作者按钮回滚到 R1，形成 R3；两个 namespace 均恢复 R1 的值。renderer reload 后仍显示 R1/R2/R3、来源与空正文。
6. 使用固定 rc.2 的原生 `scanZstdFrames` 只读解码 `.jsonl.zstd` 的连续帧，磁盘中确有两条 accepted 和一条 rolled-back 事件，payload 严格为四字段，模型事件数为零。结果保存在 `canon-session-events.json`。
7. Host 停止后重启同一 Home，原历史 Session 的只读视图和 Canon R3 恢复，Canon 文件字节不变。但随后作者回滚失败，显式调用原生同 ID 的 `session.create` 也失败，见下一节。

R3 Canon SHA-256：`72649e86ca48eb0910b44f13ba81eebb14fabe6524cfb11add0ea469241264cb`。`restart-summary.json` 区分只读恢复与不可继续的 Session。

正常运行的最终 origin `58340` 未观察到 console warning/error。先前已停止的 `55451` 页面留下 39 条断线重连 warning，不算最终 origin 的正常运行结果。浏览器协议观测出现长等待，未用它宣称完整请求计数；验收依据页面操作、实际 Canon 与 Session 文件。

全部测试 Host 已停止：`55451`、`58340`、`53469` 均为零监听。Ctrl+C 的 PowerShell/PTY wrapper 返回 1，未据此声称 Windows Desktop 托盘或完整生命周期验收。用户全局 `.dsh` 前后均不存在。未提交、推送、发布、部署或调用外部模型。

## 硬阻塞：外部插件事件不能在 rc.2 恢复

真实原生恢复错误（省略测试身份与路径）：

```text
SessionFormatUnsupportedError: session contains event type
"novel/canon/accepted" (seq 5) unknown to this harness and not marked
ignorable; refusing to interpret the log
```

独立 high 只读复核与主线程核对一致，证据来自本机固定 rc.2 归档：

- `packages/core/session/src/known-event-types.ts:9-17`：固定目录只包含 DSH 仓库内事件；明确说明外部插件的运行时注册入口尚未实现。
- `packages/session/session-persistence/src/coordinator.ts:1051-1064`：恢复只接受目录成员或信封上的 `ignorable: true`。
- `packages/core/session/src/types.ts:416-426` 虽声明 `ignorable?: true`，但 `Session.append`（`src/index.ts:604-633`）的公开参数和构造信封均不提供该写入能力。
- 上游 `.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md:19-23` 明确说明这是 read-side-only 的预发布状态：writer 尚不写 marker，外部插件事件会被第一方恢复器拒绝。

这不是损坏的 JSON，也不是仅缺少手工激活。**固定 rc.2、保留自定义 SessionEvent、上游只读、要求跨重启继续会话，目前不能同时成立。** 当前候选不能作为可交付的恢复版本。

后续已独立修复四个作者 Remote 的手工 live-Agent 查找，详见 [作者会话恢复报告](native-author-session-lookup-2026-09-08.md)。发布版 generator 不能为 downstream 插件解析外部 `Agent` wire 类型，因此保留 string Session ID，直接调用 Host 已注册的 Agent provider；实际复用/恢复仍由官方 resolver 完成。新增 cold-Session focused test 和全新 Web Profile 的宿主重启预览已通过，完整包为 244/244。此修复仍不能取消上述未知事件门禁。

## 决策与后续

需要用户明确选择保留当前全部约束并暂停 M1，或允许评估支持该能力的官方 DSH 版本，或调整自定义事件协议。尚未查明存在可直接采用的新官方版本：网页工具连接失败，GitHub Releases 的只读请求发生 TLS authentication failure，未据此作版本推断。

不把强转修改 `KNOWN_SESSION_EVENT_TYPES`、手改日志、monkey patch writer 或另建持久化/事件包装层当作公开接口。现有试验日志保留作为 RED 证据；未来 writer 变更也不自动解决这些旧日志的恢复。

产品依赖和 lockfile未变更；未复制上游代码，许可证清单无新增项。本轮启动前的 ZIP 备份已复核 SHA-256；主要源码、测试及 README/todo/parity/upstream 的原字节保存在 `.novel-agent/checkpoints/2026-09-08-m1/baseline/`，历史迁移 TODO 的本次局部改动也保留在任务补丁记录中。Git 仍无提交，全部既有未跟踪内容保留。
