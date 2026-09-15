# Memory 关系投影与章节控制包迁移 — 2026-09-09

双向关系、Chapter control pack、章节后来源关联与人物延续状态的计算已从 Core 移入 Memory。
259 个测试和包门禁通过；全新隔离 Host 中，R2 查询不含 R3 内容，回滚 R2 形成 R4 后，
正文、关系和章节结果恢复，完整重启仍保持一致。

本轮是 M2 的既有实现迁移。检索排名、其他知识/图/账本算法、索引 Jobs、wire/schema、
专属 Remote/Slot、GUI 和真实 DeepSeek 小说质量仍未完成，不能据此关闭完整 Goal。

## 代码归属

| 责任 | 实现 |
| --- | --- |
| 有效版本选择、只读来源快照、锁解析、接受/回滚 | [Core](../packages/novel-project/src/index.ts) 的 `readSnapshot`、`readCanonLockResolution` 与既有事务 |
| 双向关系与逐字段来源 | [Memory relationships](../packages/novel-memory/src/relationships.ts)，经原生 projector 生命周期注册 |
| 章节 scope、引用、先前正文、post-check 来源关联、人物状态与完整人物弧 | [Memory control-pack](../packages/novel-memory/src/control-pack.ts) |
| 领域服务组合 | [Memory Service](../packages/novel-memory/src/index.ts) 的 `readRelationships`、`readChapterControlPack`、`readWritingContinuity` |

Canon 的 projector `validate` 现在可省略，支持只读投影；Planning 原有的候选校验仍执行。
`readSnapshot` 只返回有效祖先记录，去除 author authorization；Memory 不重新回放 rollback 链。
历史正文通过 Writing 的指定版本读服务取得；锁的解释和数值比较仍由 Canon 负责。

Core 删除七个领域函数。现有 relationship Remote 通过已注册的 Memory projector 派发；
检索 Tool/Remote 使用 typed Memory Service 获得控制包和续写状态。其余检索计算仍在 Core，
Memory 的总体 `retrieve` 入口暂继续调用它。没有反向插件生命周期依赖、第二事实库或新 Agent Loop。

迁移时清除必有分组的空值保护和已筛选来源的重复判断。Canon parser 对 record-shaped emotion episode
执行严格校验；primitive/array 仍可作为 generic Canon note，因此控制包继续把它们列为缺少 typed episode。
没有在 Memory 再复制整套 episode schema。缺失/歧义来源、当前锁在历史版本不可用等业务结果继续保留。

## RED → GREEN

写入前保存 92 文件与 SHA-256：`.novel-agent/checkpoints/2026-09-09-memory-projections/`。
Git 无 commit，使用真实字节快照审查，保留原有未提交内容。

| 时间 | 检查 |
| --- | --- |
| 17:00:21 → 17:00:51 | 只读 projector 无 validator 导致接受失败；可选 hook 后通过，原 Planning 拒绝校验也通过 |
| 17:02:45 → 17:06:24 | Memory 关系读服务缺失；历史 R1/R2、逐字段来源及回滚 R3 通过 |
| 17:16:10 → 17:23:22 | Memory 控制包服务缺失；历史正文/章节 scope 与回滚有效来源通过 |
| 17:26:54 → 17:26:58 | 受控恢复旧 Core 关系计算，卸载 Memory 后仍能读取，测试失败；恢复领域派发后通过 |

先前仅移除 effect 的实验仍因原生 context 失效而拒绝读取，不计为 RED。两次受控改动均已恢复。
集成 fixture 统一加载所需 Writing/Memory 后，移除八个场景的重复挂载/释放，没有删除断言。
AST 对照保留原三份受影响测试中的 1,706 个完整 expect 链及其预期参数。

17:23:26 `corepack pnpm test:focused`：5 文件、259/259、24.43 秒。
`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm build` 通过。
迁出后五个未使用的 Core 类型导入已清理；最终重新构建并打包。

## 新隔离 Host 的来源与恢复验证

目录：`.novel-agent/acceptance/memory-projections-20260909/`。官方 rc.1 CLI 使用原 Session 补丁，
通过真实 `dsh plugin --profile web add` 安装五个产品包及只读观察插件。Profile 的 Tools peer
仍由完整 Host 提供，`autoInstallPeers: false`，没有 Profile-local Tools。
静态 peer warning 与可选 Jobs/sandbox-policy compatibility warning 仍保留，不宣称全部兼容。

| PID / 端口 | 操作与结果 |
| --- | --- |
| 52424 / 56566 | 接受无正文 R1 规划、R2 正文/关系/post-check、R3 修改；实际 Memory 服务读取历史和当前值，原生检索 Tool 的控制包相同 |
| 49748 / 59053 | 完整重启，以原父 Session 的作者 Preview 首次访问；R3 的全部读取与重启前一致。随后回滚 R2，生成 R4 |
| 37296 / 61792 | 再次完整重启，以同一 Session 的作者 Preview 首次访问；R4 恢复 R2，显式历史 R3 仍可读取 |

实际 API 与原生服务证明：

- R2 不含 R3 的“复制品”和“决裂”内容；双向关系保留独立字段来源。
- 章节合同指向 R1、已接受正文指向 R2、post-check 的债务关联指向 R1 的真实 Delta。
- R4 的有效来源只有 `[1, 2]`；正文、关系、人物延续和先前章节结果与 R2 相同。
- 三次原生 `retrieve_novel_context` Tool 返回的控制包与 Memory 直接读取一致；读取前后 Canon SHA 不变。

18 次正式 RPC 全部成功。最初一次 workspace/create 参数信封错误单独保存在 `workspace.json`，
随后依据已安装 DTO 的 `request.path` 修正；它不是产品 RED。CLI 的实际 Bundle 顺序让 Memory
先于 Writing 被装载，依赖由原生 Cordis 处理。

原生 `readFrom` 读取两个 Session 的 12 事件，其中 4 条 Canon 接受/回滚通知均保留 ignorable 标记；
模型 turn 为 0。合成来源文本、packet 构造和结果均保留；没有读取或复制用户凭据、模型输入或系统提示。
R3 Canon SHA：`beade4b0ab1986b8a35f74ae9f2c3f568088d3330e5dffd44ae73e5109c36f50`；
R4：`f5fcf279bb5d7fa6b466cfae5c24ea17c446fd2feae0fd06277339c9dc7a7115`。
安装包哈希和完整结果索引见该目录 `run.json`。

17:54:27 所属 Node 进程和三个端口均为 0，全局 `.dsh` 不存在。
本轮没有新的 UI/TUI/Desktop、模型质量、CI、生产或用户接受证明，也没有提交、推送或发布。

收尾检查：92 个基线文件 SHA 保持；30 个基线变化文件、5 个新增源码/报告/状态文件及
6 个新增生成文件通过 whitespace 检查，七份文档的 348 个本地链接存在。
18:15:57 文档边界测试 6/6。README 五条 pack 命令实跑，Memory/Review 的 manifest
只有键顺序差异，全部运行文件字节与 Host 验收包相同；精确重包 SHA 单记 run.json。
