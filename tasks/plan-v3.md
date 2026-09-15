# novel-agent 开工前总计划 v3

## 1. 目标和完成定义

构建一个面向中文中长篇网文的 DSH 插件组合，帮助作者完成“选题/读者契约 → 长线规划 → 章节生产 → 审阅 → 接受 → 写作记忆 → 连载反馈”的可回放循环。产品完成不以模型输出字数或自动生成章节数量定义，而以验收小说《雾港夜航：第七码头》前 12 章能否稳定完成、修订和继续规划定义。

DSH `0.1.1-rc.2` 是唯一 Agent、Session、Workspace、事件、审批、Storage、Remote、Transport 和 Skill 内核；社区 Desktop `v2.0.2`、Better Sidebar、Browser、Search、File Upload、Pi TUI 按需原样安装。novel-agent 不拥有 Electron、Profile、安装器、通用编辑器或第二套工作台。

## 2. 最终插件组合

插件按**创作生命周期和失败边界**拆分，不按每一种数据表拆包。默认作者组合为前五个，模拟和 IO 可选：

| 插件 | 必需性 | 负责功能 | 不负责 |
| --- | --- | --- | --- |
| `@novel-agent/novel-project`（逻辑名 novel-canon） | 必需 | 项目身份、Result Packet、Revision、接受/回滚/锁、通用 Canon 扩展注册 | 人物/时钟/记忆/模型角色解释 |
| `@novel-agent/novel-planning` | 默认 | 题材与读者契约、简介、世界/人物底盘、卷/阶段路线图、章纲、章节合同、承诺/伏笔登记 | 正文生成、索引、模拟 |
| `@novel-agent/novel-writing` | 默认 | Plan→Draft→Rewrite、风格契约、场景/正文生成、写作阶段 Skills、薄 IO capability | Canon 存储、连续性事实判定 |
| `@novel-agent/novel-memory` | 默认 | revision-bound 召回、章节控制包、连续性检查、写作记忆、索引 Job | 事实写入、自动摘要事实化、市场分析 |
| `@novel-agent/novel-review` | 默认 | 结构、节奏、动作—反应、承诺/伏笔、人物/世界、文风和读者契约审阅 | 自动 Apply、替作者决定改稿 |
| `@novel-agent/novel-mirofish` | 可选 | 基于 MiroFish 的人物/读者群体反应沙盘与有限情景演绎 | 修改 Canon、真实市场预测、自动化长跑 |
| `@novel-agent/novel-io` | 决策后 | 若真实场景需要独立安装，则承接导入/导出 | 新页面、新 Store、新发布系统 |

`novel-project` 保留现有安装名，避免无意义的包迁移；新增插件没有兼容 wrapper。各包单独 self-mount，只插入自身 Bundle row。

## 3. DSH 联动设计

### 3.1 Host Service

Canon 导出最小 typed Service：`open/read/propose/preview/apply/rollback/registerExtension`。Planning、Writing、Memory、Review、MiroFish 通过 `ctx.inject(['novelProject'])` 获取接口，不直接 import `NovelProjectService` 实现。

每个领域插件注册一个 `NovelCanonExtension`：namespace、Delta schema、projector、摘要函数和来源字段。若 rc.2 不支持运行时注册，使用 Canon 的 namespace-keyed generic Delta 记录；扩展插件自己 projector，禁止引入消息总线。

### 3.2 事件规则

跨插件只广播 Canon 的 accepted/reverted Revision 引用：`projectId`、`revision`、`deltaRefs`、`sourceSessionId`。插件内部事件只记录需要 replay 的事实：Memory 的 index request、MiroFish 的 run record。模型文本、密钥、完整系统提示和临时 UI 状态不进入事件。

### 3.3 UI 规则

各插件只注册一个 DSH `conversation.view` Slot：Canon Review、Planning Board、Writing Stage、Memory Recall、Review Findings、Simulation Run。Slot 通过生成 Remote 读取完整 payload，不解析截断的模型预览，不互相调用，不创建 Sidebar tab、路由、独立 TUI 或第二个 Store。

## 4. 端到端作者流程

### 阶段 A：立项

Planning Skill 询问题材、读者幻想、差异化、禁区和更新目标，生成 `project-brief` Result Packet。作者接受后得到 R1；没有正文也可以存在项目。

### 阶段 B：路线图

Planning 生成卷/阶段路线图、主角底盘、势力、世界规则、承诺和伏笔。每一项带来源、版本和预计回收窗口。作者接受后得到 R2。

### 阶段 C：章节生产

Planning 读取 R2 生成 Chapter/Scene/Beat contract；Writing 读取同一 contract 生成 Draft；Review 读取 accepted Revision + Draft，返回带 Anchor 的问题和可选 diff；作者分别决定接受正文、设定 Delta 和 Issue。任何拒绝都不污染旧稿。

### 阶段 D：记忆与下一章

Memory 根据 accepted Revision 生成控制包：最近章节结果、人物/关系变化、读者知识、未偿还债务、活动承诺和伏笔。查询必须绑定 revision，旧 revision 不得看到未来草稿。

### 阶段 E：连载反馈

作者可以手动输入评论/编辑意见作为未验证外部材料。Review/Planning 将其整理成候选假设，作者接受后才进入 Canon；不根据单一追读数字自动改写主线。

### 阶段 F：实验与完结

MiroFish 对固定 Revision 做单次读者反应/人物压力实验，结果只供作者判断。卷末由 Planning 生成回收清单和下一卷路线；IO 在决策后导出 accepted manuscript 和来源。

## 5. 插件功能详细表

### Canon

Tools：`novel_canon_propose`、`novel_canon_apply`、`novel_canon_rollback`、`novel_canon_read`。  
Remote：项目、Revision、Result Packet、preview、history。  
验收：R1→R2 接受、正文拒绝但 Delta 接受、R3 回滚、reload 后 hash 一致。

### Planning

Skills：`novel-idea-editor`、`novel-premise-planner`、`novel-outline-architect`、`novel-chapter-planner`。  
Delta：`planning/project-brief`、`planning/roadmap`、`planning/chapter-contract`、`planning/promise`、`planning/foreshadow`。  
Tools：`novel_plan_project`、`novel_plan_chapter`。  
Slot：题材/契约、路线图、章纲、承诺与伏笔清单。

### Writing

Skills：`novel-prose-writer`、`novel-rewriter`、`novel-style-keeper`。  
Delta：`writing/narrative-unit`、`writing/manuscript`、`writing/style-profile`。  
Tools：`novel_write_draft`、`novel_write_rewrite`。  
Slot：当前章 contract、草稿 diff、作者接受状态。导入/导出先通过 DSH File/Workspace 的薄 capability。

### Memory

Skills：`novel-continuity-checker`、`novel-writing-memory-organizer`。  
Tools：`novel_memory_retrieve`、`novel_memory_rebuild`。  
Projection：chapter control pack、人物/关系/知识边界、债务和伏笔状态。索引是可重建派生物，官方 Jobs 负责后台执行。

### Review

Skills：`novel-structure-reviewer`、`novel-pacing-reviewer`、`novel-continuity-reviewer`、`novel-reader-contract-reviewer`。  
Tool：`novel_review_manuscript`。  
输出：Issue、证据 Anchor、严重度、影响范围、可选 unified diff；不直接 Apply。

### MiroFish

Skills：`novel-world-simulator`、`novel-reader-simulator`。  
Tools：`novel_simulate_world`、`novel_simulate_reader`。  
每次 run 固定 `sourceRevision`、输入 hash、replay key 和“非市场代表”标签；首轮只做单次 run。

## 6. 验收矩阵

| 能力 | 验收小说观察 | GREEN 证据 |
| --- | --- | --- |
| 立项 | R1 只有 project brief，无正文也可继续 | Host/Remote/Slot + reload |
| 开篇 | 前 3 章主角、类型、冲突、动作—反应和章末拉力齐全 | Planning/Review focused tests + Web smoke |
| 长线 | 4 卷路线、12 章路线、承诺/伏笔回收窗口可追溯 | Canon projector + plan Remote |
| 连续性 | 三类故意错误全部定位，未来 revision 不泄漏 | Memory/Review tests + isolated profile |
| 人物/关系 | 林砚、苏晚、顾沉的目标/资源/关系变化按 revision 回放 | Writing/Memory projection |
| 世界规则 | 旧港层三条规则在 R1–R5 一致，违规被拒绝 | strict Delta RED/GREEN |
| 写作 | 12 章可逐章 Plan→Draft→Review→Accept | real model/Tool/UI smoke |
| 作者控制 | 正文拒绝而设定接受；回滚后 UI 和 Remote 一致 | Canon integration + reload |
| 记忆 | R2 查询不看到 R3，来源含 Anchor | Memory Remote + cross-session smoke |
| 模拟 | 固定 R2 的 MiroFish 世界/读者实验不产生 Canon Delta | MiroFish replay + unchanged hash |
| IO | accepted 文本可导出，来源 revision 保留 | DSH fs/approval integration |

## 7. 实施阶段

### Phase 0：研究和 seam 闸门

固定本研究报告与验收小说；只读确认 rc.2 Service 注入、SessionEventMap、Typert Remote、conversation Slot、SkillRegistry、Subagent、Jobs 和 File/Workspace API。若 `registerExtension` 不成立，立即采用 generic namespace Delta，不延迟整个项目。

### Phase 1：Canon 核心收缩

从当前 `novel-project` 提取项目、Result Packet、Revision、preview/apply/rollback/lock、通用 Remote 和最小 UI。删除核心中没有消费者的时钟、模拟、索引和角色分支。先保留包名，新增 Canon boundary RED。

### Phase 2：Planning + Writing 首个可用闭环

先实现《雾港夜航》R1 project brief、R2 roadmap/contract、R3–R5 三章 Draft/Review/Accept。真实模型只按章调用；每个阶段可重试，失败不写 Canon。

### Phase 3：Memory + Review

把连续性、chapter control pack、写作记忆和审阅器从旧包移出；接官方 Jobs 做索引重建；完成跨 Session/R2-R3 隔离验收。

### Phase 4：MiroFish 沙盘

先接入独立 AGPL MiroFish sidecar，完成 Reader Reaction；再做 Character Pressure。若验收必须包含“主角选择 A/B 后的剧情状态演化”，另立一条 AGPL fork/upstream patch 路线：在 MiroFish 侧先做 OASIS custom action spike，再定义 `MOVE/CONVERSE/REVEAL/ATTACK/RESOURCE`、`StateSnapshot/StateDelta`、seed/replay/branch API。该 fork 不写入本仓库，novel-agent 只跟踪 commit 和 loopback HTTP contract；通过独立 smoke 后才把 Plot Counterfactual 从 `blocked` 提升。

### Phase 5：IO 决策

用至少一次真实导入/导出场景判断是否需要独立 `novel-io`；没有独立生命周期证据就维持 Writing 薄 capability。

## 8. 每个阶段的停止条件

- focused RED 能捕获目标缺口，GREEN 后旧行为没有被测试删除掩盖；
- 受影响包 test/typecheck/lint/build 通过；
- 新插件能在 fresh isolated rc.2 Profile 安装、解析、运行、reload、停止；
- Canon/storage/build hash 和无关插件行为保持不变；
- 未验证的跨插件或真实模型能力标为 `implemented-unverified`，不写成 `verified`；
- 不提交、不推送、不发布、不修改全局 `.dsh`。

## 9. 明确不做

一次生成整卷、无作者确认的自动 Apply、根据市场指标自动改主线、向量数据库、常驻记忆服务、复杂多分支模拟、自动发布、独立 TUI、通用编辑器、第二套 Agent/Session/Store/Workflow/Transport。
