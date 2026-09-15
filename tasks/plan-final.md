# novel-agent 开工前总计划（最终版）

## 0. 这份计划解决什么问题

novel-agent 面向中文中长篇网络小说作者，目标不是让模型一次生成更多文字，而是让作者可以稳定完成：

```text
选题与读者契约
  → 主角/世界底盘
  → 全书与卷级路线
  → 章纲/场景卡
  → 分章写作
  → 连续性/节奏/风格/承诺审阅
  → 作者接受或拒绝
  → 写作记忆与下一章控制包
  → 连载反馈与阶段复盘
  → 完结、导出和可选沙盘演绎
```

DSH `0.1.2-rc.1`（加本仓库维护的 Session 恢复补丁，见 [`AGENTS.md`](../AGENTS.md)「DSH 唯一内核」）是唯一 Agent、Session、Workspace、事件、审批、Storage、Remote、Transport、Skill 和 UI 运行时。社区 Desktop 目标版本 `v2.0.5`（`v2.0.2` 为最后完成验证的组合）、Better Sidebar、Browser、Search、File Upload、Pi TUI 和官方 Jobs 继续原样复用。novel-agent 只实现小说领域插件。

这份计划先处理历史代码，再正式开发；在第一部分完成并单独开 Goal 之前，不进入新功能实现。

## 1. 研究结论转成的产品要求

阅文官方作者课程给出的实际网文工作流是：题材 → 写法 → 主角身份与处境 → 前几万字综述 → 细纲 → 试写和编辑反馈 → 发布。其他官方课程反复强调前三章、动作—反应、信息差、期待感、人物生活根基、伏笔回收和长篇追订稳定。

因此产品必须满足：

1. 开篇能检查类型、主角、冲突、读者期待和章末拉力，而不是只检查语法。
2. 每章能表达目标、障碍、动作、反应、信息变化、承诺推进和下一章牵引。
3. 人物、关系、世界规则、读者知识和伏笔都有 accepted revision、来源 Anchor 和历史状态。
4. Plan、Draft、Review、Apply 分离；模型失败、重写失败和作者拒绝都不能污染 accepted Canon。
5. 记忆召回绑定 revision，不能把废案、未来草稿和当前事实混在一起。
6. MiroFish 的群体反应只能作为外部实验材料，不能直接变成小说事实或市场预测。
7. 作者始终能逐项接受/拒绝，并能回滚到旧 Revision。

LongWriter 研究表明，长上下文模型仍可能在约 2,000 词附近停止长输出，AgentWrite 通过分解任务才扩展到更长文本；创意协作研究也显示，模型作为反馈者往往比直接代写更适合专家用户。产品默认采用小步、可审阅、可回放的协作方式。

## 2. 能力地图与插件组合

| 模块 id | 插件 | 责任 | 依赖 |
| --- | --- | --- | --- |
| canon | `@novel-agent/novel-project` | 唯一事实源、Result Packet、Revision、接受/回滚/锁、通用扩展注册 | DSH storage/session/tools/typert/workspace |
| planning | `@novel-agent/novel-planning` | 题材、读者契约、简介、世界/人物底盘、路线图、章纲、承诺、伏笔 | canon |
| writing | `@novel-agent/novel-writing` | 按 contract 生成/重写正文、风格契约、章节状态、薄 IO | canon, planning |
| memory | `@novel-agent/novel-memory` | revision-bound 召回、章节控制包、连续性、索引 Job | canon, planning, writing projections |
| review | `@novel-agent/novel-review` | 结构、节奏、动作—反应、连续性、风格、承诺和伏笔审阅 | canon, planning, writing, memory read-only |
| mirofish | `@novel-agent/novel-mirofish` | MiroFish 人物/读者群体反应沙盘，有限情景压力实验 | canon；可选 planning/memory；独立 MiroFish sidecar |
| io | 暂不创建 | 导入导出先作为 writing capability，只有独立生命周期被证明才拆包 | writing, DSH fs/workspace |

拆分按生命周期和失败边界，不按每一张表拆包。禁止 `novel-shared`、`novel-runtime`、`novel-bus`、第二个 Agent、Session、Store、Workflow、Transport、Profile 或通用 Workbench。

默认作者组合是 `canon + planning + writing + memory + review`；MiroFish 和复杂 IO 可选。

## 3. 领域模型和数据归属

### Canon 核心

Canon 只知道：Project、Revision、Result Packet、SourceAnchor、Provenance、Decision、CanonLock 和扩展 Delta 引用。核心不解释人物、关系、时钟、读者反应或模拟动作。

### Planning

Planning 拥有 `planning/project-brief`、`planning/roadmap`、`planning/chapter-contract`、`planning/promise`、`planning/foreshadow`。每项都带版本、来源、有效范围、预期回收窗口和作者接受状态。

### Writing

Writing 拥有 `writing/narrative-unit`、`writing/manuscript`、`writing/style-profile`、`writing/chapter-state`。正文、统一 diff、完整 hash、视角和章节 post-check 都绑定 accepted Revision。

### Memory

Memory 只产生可重建 projection：Chapter control pack、人物/关系变化、读者知识、债务、伏笔状态、连续性 Issue 和索引。它不拥有事实。

### Review

Review 只产生 Issue、Anchor、严重度、影响范围和可选 unified diff。Review 不自动 Apply，不自动拒绝章节。

### MiroFish

MiroFish 产生 SandboxRun、StateSnapshot、StateDelta、Report 和 Proposal 引用。实验输入固定 `sourceRevision` 和 input hash；结果只能经 Review 和作者 Apply 进入 Canon。

## 4. DSH 联动契约

### Typed Service

Canon 暴露最小接口：

```ts
interface NovelCanon {
  open(workspaceId: WorkspaceId): Promise<NovelProject>
  read(workspaceId: WorkspaceId, revision?: number): Promise<AcceptedRevision>
  propose(input: ResultPacketDraft): Promise<ResultPacketRef>
  preview(input: ResultPacketReview): Promise<ResultPacketImpact>
  apply(input: ResultPacketReview): Promise<AcceptedRevision>
  rollback(input: RollbackCommand): Promise<AcceptedRevision>
  registerExtension(extension: NovelCanonExtension): () => void
}
```

`registerExtension` 的 focused RED 已完成，条件分支已收口：DSH 自身不提供动态 endpoint 注册，但本项目自己的 `NovelProjectService.registerExtension` / `registerProjector` 经 Cordis `ctx.inject(['novelProject'])` 可用，wire 形状为 `kind: 'extension'` + `namespace` + `valueSchema`（见 [`M1 检查点`](../docs/canon-extension-m1-2026-09-08.md)）。原「若不支持动态注册则退回 namespace-keyed generic Delta」不再适用，不要再据此实现通用 Delta；扩展插件自行 projector，不能增加事件总线。

### SessionEventMap

跨插件事实事件只有：

- `novel/canon/accepted`
- `novel/canon/rolled-back`

载荷只含 `projectId`、`revision`、`deltaRefs`、`sourceSessionId`。插件本地事件仅保存需要 replay 的派生运行状态，例如 `novel/memory/index-requested`、`novel/mirofish/run-requested` 和 `novel/mirofish/run-completed`。

### Client UI

每个插件只向 `conversation.view` 注册一个 Slot：

```text
novel-canon-review
novel-planning-board
novel-writing-stage
novel-memory-recall
novel-review-findings
novel-mirofish-sandbox
```

Slot 通过生成 Remote 取完整结构化数据，不解析 DSH 截断的模型预览，不创建 Sidebar tab、独立路由、TUI 扩展或第二个页面系统。

## 5. 完整作者流程

### A. 立项

作者描述题材、读者幻想、核心体验、禁区、更新模式和差异化。Planning 生成 project brief，作者接受后形成 R1；R1 可以没有正文。

### B. 路线

Planning 生成主角处境、世界底盘、势力关系、全书/卷/阶段路线、核心承诺和短中长伏笔。作者接受后形成 R2。

### C. 开篇

Planning 为前 3 章生成章纲和 contract。Review 检查主角是否及时出现、类型是否清晰、是否有真实冲突、动作—反应是否完整、章末是否产生继续阅读理由。

### D. 分章生产

Writing 读取当前 contract 和 Memory control pack，生成 Draft；Review 输出带 Anchor 的 Issue/diff；作者分别决定正文、设定、Issue 和 post-check。每章接受后更新 Revision、记忆和下一章输入。

### E. 连载复盘

作者手动提供评论、编辑意见和数据观察。Review/Planning 把它们当作未验证材料，只有作者明确 Apply 才进入 Canon。单一指标不能自动改主线。

### F. 沙盘

MiroFish 对固定 Revision 做 Reader Reaction 或 Character Pressure。结果显示 Persona 反应、信息扩散、误读、联盟和未解决钩子；不显示“必然爆款”，不自动写回 Canon。

### G. 完结与导出

Planning 生成回收清单和终局路线；Memory 核对债务/伏笔；Writing/Review 完成最终稿；IO capability 导出 accepted manuscript、来源和版本记录。

## 6. 验收小说

### 《雾港夜航：第七码头》

类型：现代都市异能 × 悬疑成长 × 职业群像。  
目标：4 卷、每卷 24 章、全书约 24–32 万汉字；首轮只验收前 12 章和卷一可继续路线。

### 固定 Canon

- 主角林砚：雾港夜班航标维护员，背负父亲失踪留下的债务；
- 苏晚：搭档，掌握一段不完整的旧港记录；
- 顾沉：港务制度内的对手，有合理的秩序动机；
- 三个势力：航标、港务、旧港走私线；
- 三条世界规则：旧港层显形条件、进入代价、记忆影响；
- 核心谜团：父亲是否主动进入旧港，第七码头为何被删除；
- 关系线：林砚与苏晚从不信任到共同承担代价；
- 卷一结尾：证实第七码头存在，同时揭示父亲曾主动删除一次航标记录。

### 12 章验收分段

| 章节 | 验收目标 |
| --- | --- |
| 1–3 | 主角、职业、类型、真实压力、打破平衡的动作、章末拉力 |
| 4–6 | 修复航标小闭环、动作—反应、苏晚登场、首条规则、收益伴随代价 |
| 7–9 | 旧港层显形、两条线交叉、伏笔 Anchor、人物选择改变关系/资源 |
| 10–12 | 第七码头线索证实但不完全揭底，短伏笔回收，中长伏笔保留，路线可继续 |

### 硬验收指标

- R1 project brief、R2 roadmap/contract、R3–R5 三章正文可追溯；
- 12 章每章均有目标、障碍、动作—反应、信息变化和章末拉力；
- 故意制造人物知识越界、世界规则违反、物件位置冲突三类错误，Memory/Review 能定位到章节和 Anchor；
- R2 查询不得泄漏 R3；废案不得进入下一章上下文；
- 正文拒绝而设定接受时，旧正文 projection 保持不变；
- 回滚后 Canon、Remote、Slot、Storage 一致；
- MiroFish 实验结果不产生 Canon Delta；
- fresh isolated 当前目标版本 Profile（已应用 Session 恢复补丁）完成安装、运行、reload 和清洁停止。

## 7. 第一部分：历史代码处理 Goal

第一部分不实现新功能，只把当前单插件历史代码整理成可迁移状态。

### H-001 建立历史快照

读取根规则、README、现有 plan/todo/architecture、所有报告、package manifest、lockfile、测试和当前 `novel-project` 代码；记录 git status 和文件 hash。确认 MiroFish checkout 有未提交修改，不覆盖、不清理。

**验收：** 形成历史清单、当前行为矩阵、依赖矩阵和未验证证据表；没有产品写入。

### H-002 代码归属标注

按 Canon、Planning、Writing、Memory、Review、MiroFish、Generic retired 七类标注当前 `src/index.ts`、`types.ts`、Remote、Tools、Skills、Client 和 tests。每个符号只能有一个目标归属。

**验收：** 生成迁移表，标出重复职责、无消费者类型和依赖环。

### H-003 DSH seam 体检

只读核对 DSH 的 Service 注入、SkillRegistry、SessionEventMap、Typert Remote、conversation Slot、Subagent、Jobs 和 fs/workspace API。`registerExtension` 的可行性已由 M1 验证为成立（见 [`M1 检查点`](../docs/canon-extension-m1-2026-09-08.md)），不再保留「不成立时锁定 generic namespace Delta 方案」的条件分支。

**验收：** seam 结论有源码/测试路径；没有凭 README 猜测 API。

### H-004 MiroFish 上游体检

记录 MiroFish commit、AGPL-3.0、`camel-oasis==0.2.5`、`camel-ai==0.2.78`、Flask endpoints、Graphiti/Zep、OASIS 动作、Windows 启动和运行成本。确认当前没有 branch/replay/world-state API。

**验收：** 形成 `MiroFish → novel-mirofish` sidecar contract；Plot Counterfactual 标记 `blocked`。

### H-005 历史测试重分类

把当前测试分成 Canon、Planning、Writing、Memory、Review、MiroFish adapter、retired generic。测试只移动/复制到边界目录，不通过删除断言取得绿色。

**验收：** 每个目标插件有最小 RED 清单；旧 generic 测试有 superseded 说明。

### H-006 依赖与许可证报告

核对 DSH 精确版本（当前 `0.1.2-rc.1`）、MiroFish AGPL、OASIS Apache 2.0、Node/Python 依赖和潜在运行成本。为未来 `THIRD_PARTY_NOTICES.md`、`docs/upstream-sources.md` 和 open-source evaluation 准备记录。

**验收：** 明确哪些依赖能进 DSH 插件，哪些只能作为外部 sidecar；不修改邻库。

### H-007 历史代码整理方案

输出逐文件迁移顺序、删除清单、保留清单、回滚路径和每步 focused test。历史包名 `@novel-agent/novel-project` 保留为 Canon 安装名；不建立兼容 wrapper、双写或版本分支。

**验收：** 用户可以只审阅这份方案就知道下一步会删除什么、移动什么、验证什么。

### H-008 第一部分检查点

运行根 `git diff --check`、只读状态、文档链接检查和现有最小测试；确认没有代码、依赖、用户 `.dsh` 或 MiroFish checkout 写入。

**Checkpoint：** 第一部分完成后停止，关闭该 Goal；用户审核历史处理结果后，另开第二个 Goal。

## 8. 第二部分：正式开发 Goal

### D-001 Canon 核心收缩

从当前单插件提取 Project、Result Packet、Revision、preview/apply/rollback/lock、通用 Remote 和 Canon Slot。核心不再注册 Planning/Writing/Memory/Review/MiroFish Skills。

### D-002 Canon 扩展契约

实现 `NovelCanonExtension` 或 generic namespace Delta；为 schema、projector、摘要和来源锚点写 focused RED/GREEN。验证多个扩展可以同时挂载。

### D-003 Planning 首条垂直链

实现 project brief → roadmap → chapter contract；接入 Planning Skills、Tool、Remote 和 Slot。用验收小说生成 R1/R2，作者 Apply 后回放一致。

### D-004 Writing 首条垂直链

实现 contract → draft → rewrite；接入正文 diff、style profile、章节状态和 Writing Slot。模型失败只留下 Session 结果，不推进 Canon。

### D-005 Review 首条垂直链

实现结构、节奏、动作—反应、连续性、风格、承诺/伏笔 Issue；支持只接受 Issue/Delta 而拒绝正文。

### D-006 Slice 1 真实验收

在 fresh isolated 当前目标版本 Web Profile（已应用 Session 恢复补丁）完成《雾港夜航》R1–R5、三章真实闭环、reload、回滚和零监听停止。通过后才继续 Memory。

### D-007 Memory projection

实现 revision-bound retrieval、Chapter control pack、人物/关系/读者知识/债务/伏笔 projection 和连续性 Skill。旧 revision 不泄漏未来。

### D-008 Memory Jobs

复用官方 `dsh-tool-jobs` 做索引重建；Job 是派生状态，不能成为 Canon。完成跨 Session/reload smoke。

### D-009 Review + Memory 联动

Review 消费 Memory control pack，所有 Issue 带来源 Revision/Anchor；Review 失败不会写 Canon。

### D-010 MiroFish adapter

在 novel-agent 新建 `novel-mirofish` DSH 插件，定义 `SandboxSeed`、`ExperimentSpec`、`SandboxRun`、`StateSnapshot`、`StateDelta` 和 `Proposal`。通过 loopback HTTP 调用独立 MiroFish，复用其 graph/prepare/start/status/report/interview。

### D-011 MiroFish Reader Reaction

以 R2 前三章和 4 个 Reader Persona 验收：返回反应、分歧、误读、证据 Anchor 和限制；结果只能生成 proposal，作者拒绝后 Canon hash 不变。

### D-012 MiroFish Character Pressure

加入角色/势力干预实验，输出联盟、冲突、信息扩散和未解决钩子；不把社交动作直接当小说事实。

### D-013 Plot Counterfactual 决策闸门

若完整剧情分支是硬需求，另立保留 AGPL 的 MiroFish fork；先在实际 `camel-oasis==0.2.5` 环境做 custom action spike，再增加叙事动作、快照、分支和 replay。fork 代码不写入 novel-agent。

### D-014 IO 决策与完结验收

用一次真实导入/导出场景判断是否拆 `novel-io`；完成 12 章验收、来源核对、回滚、MiroFish proposal 隔离和 README 安装说明。

## 9. 任务执行规则

- 每个任务先 RED，再 GREEN，再 REFACTOR；一个增量约 1–5 个文件。
- 任务依赖按 `canon → planning → writing → memory/review → mirofish → io` 执行。
- 每完成 2–3 个任务做 checkpoint；跨插件任务必须 fresh isolated Profile。
- 只读上游 DSH、Desktop、MiroFish 和社区插件；产品代码只写 `novel-agent`。
- 不修改规格原文、`.i18n.yaml`、graphify-out、用户全局 `.dsh` 或 MiroFish 邻库。
- 不提交、不推送、不发布、不部署，除非用户另行明确要求。

## 10. 总体 Definition of Done

1. 《雾港夜航：第七码头》前 12 章完成真实 Plan→Draft→Review→Accept→Memory 闭环。
2. Canon 是唯一事实源，插件缺失时遵循 DSH 原生 pending injection。
3. Review、Memory、MiroFish 都不能绕过 Canon 直接写事实。
4. MiroFish Reader Reaction 和 Character Pressure 有真实 sidecar smoke；Plot Counterfactual 未验证前保持 `blocked`。
5. 每个 `verified` 单元同时有实现、focused test、Remote/Client 证据和最近一次 isolated Profile 记录。
6. 没有第二套 Agent、Session、Store、Workflow、Transport、Profile、Sidebar、TUI 或消息总线。

## 11. 当前不做

整卷单次生成、无作者确认自动 Apply、根据市场指标自动改主线、向量数据库、常驻记忆服务、自动发布、复杂权限、公网 Gateway、独立 TUI、MiroFish 社交动作伪装成叙事事实，以及未经 fork 评估的完整剧情分支引擎。
