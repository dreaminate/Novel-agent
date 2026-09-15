# novel-agent 重设计计划 v2：一切皆插件

## 目标

在 DSH `0.1.1-rc.2` 和社区 Desktop `v2.0.2` 之上，把小说 Agent 重构为一组可独立安装、可组合联动的 DSH 插件。计划只保留小说领域能力；Agent、Session、Workspace、事件持久化、审批、Remote、Transport、Profile、通用 UI 和通用工具全部复用 DSH 或社区插件。

这是一份重新设计的路线，旧 `tasks/plan.md` 保留为历史对照，不作为新边界的依据。

## 已确认的设计取舍

1. **极小核心**：核心只负责项目身份、Revision、通用 Result Packet、接受/回滚/锁和事件聚合。叙事时钟、写作合同、记忆召回、模拟状态不再内置在核心。
2. **原生联动**：插件之间只通过 Cordis typed Service 和 DSH `SessionEventMap` 联动；不直接 import 另一插件的实现，不另建消息总线、Store、Agent Loop 或 Workflow。
3. **共享工作面**：所有小说 UI 只贡献 DSH `conversation.view` 的 Slot/卡片；不新增 Sidebar tab、路由、页面、TUI 扩展或第二个工作台。
4. **垂直交付**：先完成 Canon + Writing 的最小闭环，再接 Memory、Simulation；导入导出是否单列为插件由真实使用证明决定。

## 产品组合

```text
DSH / Community Desktop or DSH CLI
  └─ user-selected Profile
      ├─ DSH and community plugins
      │   ├─ dsh-better-sidebar / browser / search / file-upload
      │   ├─ dsh-tool-jobs (official)
      │   └─ @xmoon76/dsh-pi-tui (TUI Profile)
      └─ novel-agent plugins
          ├─ @novel-agent/novel-project   (Canon core, required)
          ├─ @novel-agent/novel-writing   (writing roles and workflow)
          ├─ @novel-agent/novel-memory    (retrieval and continuity)
          └─ @novel-agent/novel-simulation (proposal-only experiments)
```

`@novel-agent/novel-project` 先保留现有包名以避免无意义的安装迁移，但职责收缩为逻辑上的 `novel-canon`。不建立兼容 wrapper；安装说明直接指向新的职责和依赖关系。

### 1. Canon 核心插件（必需）

拥有唯一事实源和 Revision 生命周期：

- Workspace 中的 Novel Project 身份和最小层级引用；
- 通用 `ResultPacket`（Manuscript、Delta、Issue、SourceAnchor、Provenance）；
- preview、accept、reject、rollback、stale-revision 和 Canon lock；
- DSH Session 事件到 accepted Revision 的聚合、持久化和重放；
- 一个通用扩展注册点：扩展插件提供 namespace、Delta schema、projector 和可读摘要。

核心不知道“人物”“关系”“十类时钟”“读者反应”等业务含义，只保存经过扩展注册的合法 Delta 和 accepted revision。所有 Canon 写入仍经过 DSH Tool/approval；Remote 只读投影。

核心 UI 只显示 Result Packet 审阅、Revision 历史、接受/回滚和锁状态。

### 2. Writing 插件

依赖 Canon，提供第一次可用闭环：

- Ask → Plan → Write → Review → Accept 的角色 Skills 和提示模板；
- Chapter/Scene/Beat/Manuscript 的写作 Delta 与章节合同 projector；
- 写作记忆所需的最小章节状态（已接受正文、计划、审阅 Issue、post-check）；
- 在共享 `conversation.view` 注册写作阶段、章节合同和草稿审阅卡片；
- 通过 DSH Subagent/Skill 组合角色，不创建常驻专家团、第二个 Agent 或独立队列。

导入导出先作为 Writing 的可选 capability 实现，直接消费 DSH File Upload、Workspace 和 stock approval；只有独立安装、独立生命周期被真实场景证明后才拆出 `novel-io`。

### 3. Memory 插件

依赖 Canon，可选依赖官方 Jobs：

- revision-bound retrieval、章节控制包、连续性 Issue 和写作记忆召回；
- 仅使用 accepted Revision 和 Writing 已注册的投影，不建立第二事实库；
- 索引重建直接调用 DSH `dsh-tool-jobs`，Job 状态留在 DSH Session/Job 投影；
- 在共享视图显示召回来源、范围、过期状态和连续性问题；
- 没有 Memory 插件时，Canon + Writing 仍可完成写作闭环。

向量数据库、常驻索引服务、自动摘要 Store 和独立记忆 UI 不在本计划内。

### 4. Simulation 插件

依赖 Canon，可选消费 Writing/Memory 的只读投影：

- 故事世界和读者反应两类 proposal-only SimulationRun；
- 每次实验绑定一个 frozen accepted revision，结果只作为 Session 事件和 Result Packet 供作者审阅；
- 第一阶段只做单次 run；多 seed、分支矩阵、角色隔离和校准在单次 run 真实可用后再排；
- 在共享视图显示假设、输入、结果、限制和 provenance，不写入 Canon。

Simulation 不拥有世界状态、读者画像 Store、重试队列或后台 Workflow。

## 插件契约

### 实时 Service

核心导出 `NovelCanon` typed Service；扩展插件注册自己的 `NovelDomainExtension`。Writing、Memory、Simulation 只依赖这些接口，不导入核心 Service 的实现类。接口最小化为：

- `registerExtension()`：注册 namespace、Delta schema、projector、摘要函数；
- `readRevision()` / `readCurrent()`：读取指定 accepted Revision；
- `propose()` / `preview()` / `apply()`：走现有 Result Packet 决策路径；
- `rollback()`：通过同一 Canon authority 回滚。

如果 DSH 当前版本无法提供动态注册，第一切片先采用核心的 namespace-keyed generic Delta 记录；扩展 projector 通过 `ctx.inject` 监听并读取这些记录，仍不增加第二套总线。是否采用哪一种实现必须在 Slice 1 的 RED 阶段用 DSH rc.2 源码和 focused test 证实。

### 持久事件

只使用 DSH `SessionEventMap`，事件名按插件命名空间分组：

- `novel/canon/proposed`、`novel/canon/accepted`、`novel/canon/rolled-back`；
- `novel/writing/delta-registered`、`novel/writing/chapter-state`；
- `novel/memory/index-requested`、`novel/memory/continuity-found`；
- `novel/simulation/run-recorded`。

事件只记录可回放的事实和来源引用，不记录密钥、完整系统提示或第三方状态。瞬时选择、hover、面板尺寸和输入框内容留在 Client Runtime。

### UI

每个插件注册自己的 `conversation.view` Slot。Slot 读取当前 Session/Workspace，通过生成的 Remote 取完整数据；不解析可能被 DSH 截断的模型文本，不建立页面级状态库。插件缺失时对应 Slot 不加载。

## 交付切片

### Slice 0 — DSH seam 体检（只读）

- 核对 rc.2 的插件注入、Service 生命周期、事件扩展、Remote 生成、Slot 装配和官方 Jobs API；
- 对照当前 `novel-project` 9k 行 Service 和 3k 行 types，标出可直接搬入核心、Writing、Memory、Simulation 的边界；
- 输出一页 seam 结论和迁移清单，不改产品代码。

### Slice 1 — Canon + Writing 最小闭环

- 将现有包收缩为 Canon 核心，新增 Writing 插件；
- 只实现一条新项目路径：project brief → 一个 Chapter contract → draft → review → accept/rollback；
- Canon 与 Writing 各自注册 Tool、Remote、Skill 和共享视图 Slot；
- fresh isolated rc.2 Web Profile 验证安装、解析、真实模型/Tool/UI、reload 和停止后零监听；
- Canon 缺失 Writing、Writing 缺失 Canon 的 pending injection 行为各有一个 focused test。

### Slice 2 — Memory

- 先接 revision-bound chapter control pack 和连续性读取；
- 再接官方 Jobs 的索引重建；
- 验证跨 Session/reload 只恢复 accepted Revision 和可重建索引状态；
- 不在这一切片引入向量库、自动摘要或新 UI 页面。

### Slice 3 — Simulation

- 先实现单次故事世界 proposal；
- 再实现单次读者反应 proposal；
- 单次 run 通过隔离 Profile 后，才评估多 seed/分支矩阵；
- 验证实验失败不会污染 Canon，结果可在 reload 后重放。

### Slice 4 — IO 决策点

- 评估 TXT/Markdown/EPUB/DOCX 是否有独立安装和独立生命周期需求；
- 若没有，保持 Writing 内的薄 capability；
- 若有，再建立 `@novel-agent/novel-io`，只消费 Canon/Writing Service 和 DSH File/Workspace，禁止新增导出 UI 或 Store。

## 每个切片的 RED → GREEN → REFACTOR

1. 先写一个跨插件可观察行为的 focused RED，并证明旧单插件实现捕获不到新边界；
2. 用最小 Service/Event/Tool/Remote 代码使 RED 变绿；
3. 在绿灯保护下删除核心中不再属于该插件的分支和类型；
4. 运行受影响包测试、typecheck、lint、build；
5. 用全新隔离 DSH_HOME/Profile 做真实组合 smoke；
6. 更新 parity matrix、README、upstream evidence 和 `tasks/todo.md`，记录“已验证行为”而不是“代码存在”。

## 旧实现迁移策略

- 先复制当前单插件的行为测试为边界测试，再移动实现；不复制旧的 Electron、Terminal、Sidebar、TUI 或 Profile 代码。
- Canon 先承接现有 Result Packet/Revision/lock/rollback 的最小路径；十类时钟和专用类型按其真实消费者迁移到 Writing/Memory/Simulation。
- 每次只迁移一个完整能力族，保持 1–5 个文件的增量；迁移后删除核心中已无消费者的类型、Tool 和 UI 分支。
- 不新增兼容层、双写、版本分支或共享 util 包。现有包名 `@novel-agent/novel-project` 仅作为 Canon 核心的安装名保留。

## 完成标准

- 至少 Slice 1 在真实隔离 Web Profile 完成一条可写作、可审阅、可接受、可回滚的闭环；
- 每个后续插件都有独立安装、缺失依赖时的 DSH 原生装载行为和共享视图证据；
- Canon 是唯一事实源；任何 Memory/Simulation/社区插件都不能直接写 Canon；
- 无第二套 Agent、Session、Store、Workflow、Transport、Profile、Sidebar、TUI 或消息总线；
- README 明确列出插件依赖和社区下载项；parity matrix 只把有实现、测试和最新 smoke 的单元标为 `verified`；
- 不提交、不推送、不发布、不修改用户全局 `.dsh`，除非另有明确授权。

## 暂不做

完整十章生产验收、自动化长跑、向量检索、常驻记忆服务、市场/安装器、独立 TUI、通用编辑器、复杂权限体系、跨用户协作和公网 Gateway。
