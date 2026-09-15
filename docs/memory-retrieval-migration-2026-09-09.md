# Memory 检索引擎与原生索引 Jobs 迁移 — 2026-09-09

剩余检索组装、中文搜索、写作记忆排名、各类账本/生命周期计算和索引 Job 已从 Core 移入 Memory。
两个既有检索/索引 Tool 也由 Memory 注册并随插件撤回。264 个测试和包门禁通过，真实 Host 中
索引可重建、过期重建被拒绝，历史与回滚后的检索经过完整重启仍正确。

本轮完成这些既有后端实现的归属迁移。专属 Memory Remote/Slot、最终 Tool 命名、wire/schema、
其他领域迁移、GUI、真实 DeepSeek 与前 12 章小说验收仍未完成；不关闭完整 Goal。

## 实现与依赖

- [Memory Service](../packages/novel-memory/src/index.ts) 注册原生 `retrieve_novel_context`、
  `rebuild_novel_index`，拥有派生索引 Map，并通过原生 `session/event` 响应 Canon 接受/回滚通知。
- [检索引擎](../packages/novel-memory/src/retrieval.ts) 负责结构化/精确/全文查询、写作记忆排名、
  路线图解析、人物/线索/承诺/谜团生命周期、各类连续性账本、结局账本和原生 Job 生产者。
- [Core](../packages/novel-project/src/index.ts) 保留唯一存储、版本选择和 `readRevisionImpact`。
  生命周期逐版本读取 Core 的 revision/Canon 视图，历史正文通过 Writing 读取；Memory 不复制
  回滚解释器，也不持有第二事实库。原 author authorization 不传入检索上下文。
- Core 删除 49 个检索相关声明及 `retrieve` / `rebuildRetrievalIndex` 两个计算方法。
  16 处直接服务调用改为 Memory；现有客户端仍用 Core 的 `retrieve` Remote，由其 typed 派发。

`minisearch@7.2.0`、`@node-rs/jieba@2.0.2` 的生产归属转到 Memory，DSH Jobs 的 Core 依赖改为
仅供现有测试使用的 dev dependency。Memory 直接声明已解析的 Agent/Jobs/Session rc.1、Zod 4.4.3；
Tools 为精确 rc.1 peer + dev，实际由 Host 提供。没有新增解析包版本。
原生 Job 仍归属调用 Agent；索引只缓存派生数据，并继续校验 revision 与正文 hash。

两个完整 Tool 声明与原版 AST 一致；17 个搜索/排名/Job/读取 schema 声明也保持。
读取 schema 中的 JSON 值使用已安装 Zod 的 `z.json()`，没有新建 JSON 解析器。
原 1,740 个完整 expect 链和预期参数保留，仅将 16 个直接服务接收者改为 Memory。

## RED → GREEN

基线：`.novel-agent/checkpoints/2026-09-09-memory-retrieval/`，106 文件与 SHA-256 已保存。
Git 无 commit，保留所有原有未提交内容。

| 时间 | 检查 |
| --- | --- |
| 19:24:26 → 19:29:56 | Core 仍发布两个领域 Tool 的 RED；迁移后缺少/卸载 Memory 时撤回，GREEN |
| 19:32:40 → 19:52:18 | Memory 重建服务缺失的 RED；实际 DSH owned Job 完成并返回全文命中，GREEN |

移动依赖后补回测试所需的 Core dev-only Jobs 依赖，清理已移走的未使用导入。
新案例最初查询“密门 钥匙”，但原 Jieba 把正文中的“密门旁”分为“密”“门旁”；核对实际分词后，
案例改为两个已索引且不连续的词“旧庭 钥匙”。没有修改原搜索算法，也没有弱化既有测试。

19:52:25 `corepack pnpm test:focused`：5 文件、264/264、16.42 秒。
`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm build` 通过，最终重新构建并打包。

## 新 Host 的 Job 与冷恢复

目录：`.novel-agent/acceptance/memory-retrieval-20260909/`。五个产品包与观察插件通过官方 CLI
安装到新隔离 Profile，保持相同 rc.1 Session 补丁和 Host Tools peer。原生 `tool-jobs` 的
官方 `completionDelivery: quiet` 设置仅用于该测试 Profile，避免通知自动打开模型回合；
本轮不证明默认 wakeup 模型通知路径。没有自建 Job 控制器或 Agent Loop。

| PID / 端口 | 结果 |
| --- | --- |
| 29668 / 51809 | 接受无正文 R1、R2 正文及状态、R3 修改；原生 Job 已完成，但观察脚本把 JSON 键顺序当作结果差异 |
| 52008 / 64602 | 修正观察脚本的语义比较并重启；同一作者 Session 首次以 Preview 恢复。R3 索引 Job 完成，Tool 与索引前读取一致，旧 revision 重建被拒；随后回滚 R2 成 R4 |
| 41780 / 51295 | 再次冷恢复；R4 索引重建完成，全文命中与写作记忆恢复 R2，R3 新正文不进入当前结果；显式生命周期查询正确保留回滚记录 |

19 次正式 RPC 均成功。两份成功的观察记录各证明一个完成且属于调用者的 Job、一次检索 Tool
与直接读取一致，以及一次旧 revision 的索引重建拒绝。初始观察失败与原 probe 包保留，
不是产品 RED；正式成功结果使用 v2 probe。读取/重建前后 Canon SHA 不变。

R2 的旧正文全文命中来源为 2；R3 不再命中旧词，新的全文命中来源为 3。R4 冷恢复后旧正文
命中仍来自 2，写作记忆与 R2 相同。生命周期查询显式包含已接受历史及 rollback 标记，
其 R4 当前人物字段恢复 R2；它不等同于默认续写上下文。

原生 `readFrom` 读取两 Session 共 12 事件、0 模型 turn，4 条 Canon 通知均保留 ignorable。
R3 Canon SHA：`2a35c8b6fe27c549d77a3b0c6f340c354b493bc54c2f0bf8d40f16f6c7f06b32`；
R4：`739397eccfde631472e8482bae01156ee5ae4e015fb30cee28f2b2c70c9adb57`。
包哈希、结果索引、quiet 配置及观察脚本均保留在该目录，完整摘要见 `run.json`。

20:24:07 三个端口及所属 Node 进程为 0，全局 `.dsh` 不存在。静态 peer 与可选
Jobs/sandbox-policy compatibility warning 仍保留。本轮没有新 GUI/TUI/Desktop、真实模型质量、
CI、生产或用户接受证明，也没有提交、推送或发布。

收尾：106 基线文件 SHA 保持；30 个变化文件、7 个新增源码/生成/报告/状态文件通过
whitespace 检查，八份文档 372 个本地链接存在。20:42:29 文档边界测试 6/6。
README 五条 pack 命令实跑，五个重包 tar 均与实际 Host 安装包逐字节一致。
