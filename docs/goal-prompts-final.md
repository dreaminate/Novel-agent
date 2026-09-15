# 两阶段 Goal 提示词

下面两段提示词按顺序使用。第一段完成并关闭后，再开启第二段；不要在同一个 Goal 中同时做历史整理和正式功能开发。

## 2026-09-15 使用前必读（覆盖下方正文中的过期条款）

本文件是**已消费的历史提示词模板**。Goal 1 已关闭，Goal 2 正在进行。保留正文原文供追溯，但以下条款已被取代，直接照用会走错方向：

1. **DSH 版本**：正文中的 `0.1.1-rc.2` 已由用户 2026-09-08 的决定取代，当前基线为 `0.1.2-rc.1`，且实际运行 DSH 的 Host 与 Profile **必须应用** `patches/@deepseek-ai/dsh-session@0.1.2-rc.1.patch`。以 [`AGENTS.md`](../AGENTS.md)「DSH 唯一内核」和 [采用记录](open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md) 为准。
2. **Goal 1 第 3 条的条件分支已收口**：`registerExtension` 经本项目 `NovelProjectService` 与 Cordis 注入可用（`kind: 'extension'` + `namespace` + `valueSchema`），原「若不可行则记录 namespace-keyed generic Delta 方案」不再适用。证据见 [`M1 检查点`](canon-extension-m1-2026-09-08.md)。
3. **绝对路径属于另一台机器**：正文中的 `C:\coding-projects\...` 不是当前机器的路径；仓库现有文档与证据中也存在多台机器混用的绝对路径，引用前须按当前机器重新确认。

下方正文未作修改，仅此说明生效。

## Goal 1：历史代码处理与开工准备

```text
目标：只处理 C:\coding-projects\My-Projects\Original\novel-agent 的历史代码、旧计划和迁移准备，不实现新的小说功能。

必须先完整读取并遵守：
- C:\coding-projects\My-Projects\Original\novel-agent\AGENTS.md
- README.md
- tasks/plan.md、tasks/plan-v2.md、tasks/plan-v3.md、tasks/plan-final.md
- tasks/todo.md
- docs/architecture.md
- docs/novel-agent-product-research-2026-09-05.md
- docs/plugin-design-v3.md
- docs/mirofish-novel-sandbox-design.md
- C:\coding-projects\My-Projects\Original\MiroFish\README.md、README-ZH.md、LICENSE、package.json、backend/pyproject.toml、backend/app/api、backend/app/services、backend/scripts

任务范围：
1. 运行只读 git status --short 和相关 diff，记录所有已有修改；不要覆盖或清理任何修改。
2. 建立当前单插件的符号级迁移表，把当前 novel-project 的代码、类型、Tool、Remote、Skill、Client、测试标注为 canon、planning、writing、memory、review、mirofish-adapter 或 retired-generic。
3. 只读核对 DSH 0.1.1-rc.2 的 Cordis Service 注入、SessionEventMap、Typert Remote、SkillRegistry、conversation.view、Subagent、Jobs、fs/workspace seam；重点验证 registerExtension 是否可行。若不可行，记录 namespace-keyed generic Delta 方案。
4. 只读审计 MiroFish 的 AGPL-3.0、锁定依赖 camel-oasis==0.2.5/camel-ai==0.2.78、Flask endpoints、Graphiti/Zep、OASIS 社交动作、runner/IPC、报告和采访能力。确认 branch/replay/world-state 是否真实存在。
5. 生成历史行为矩阵、依赖/许可证矩阵、上游证据表、删除清单、保留清单、迁移顺序、回滚路径和第一批 RED 测试清单。
6. 把旧 generic Electron、Profile、Terminal、Sidebar、TUI、Transport 路线标为 retired，不恢复它们。
7. 把 MiroFish 规划为独立 AGPL sidecar；novel-agent 只实现未来的 novel-mirofish DSH adapter。不要修改 MiroFish checkout，不复制其源码。
8. 只允许写入 novel-agent 内的计划/证据文档；不要修改产品源代码、依赖、lockfile、用户 .dsh、MiroFish 或 graphify-out。

交付文件：
- tasks/history-migration-audit.md
- tasks/history-migration-todo.md
- docs/mirofish-upstream-audit.md
- 如有必要，更新 tasks/plan-final.md 中的证据，但不要改旧计划原文。

验证：
- git diff --check
- 文档链接和路径检查
- 现有最小只读检查/测试（不得为绿色删除或弱化测试）
- git status --short，确认没有源代码、依赖、MiroFish 或用户配置写入

停止条件：
- 历史代码归属、删除/保留清单和迁移顺序已经可执行；
- MiroFish sidecar contract 和 Plot Counterfactual 的 blocked 证据已经记录；
- 完成后立即停止，不开始 Canon、Planning、Writing、Memory、Review 或 MiroFish adapter 的正式实现。
``` 

## Goal 2：正式插件开发

```text
目标：依据 C:\coding-projects\My-Projects\Original\novel-agent\tasks\plan-final.md 和历史 Goal 的审计结果，正式开发中文中长篇网文小说 Agent 插件组合。

必须先完整读取并遵守：
- C:\coding-projects\My-Projects\Original\novel-agent\AGENTS.md
- tasks/plan-final.md
- tasks/history-migration-audit.md
- tasks/history-migration-todo.md
- docs/novel-agent-product-research-2026-09-05.md
- docs/plugin-design-v3.md
- docs/mirofish-novel-sandbox-design.md
- docs/mirofish-upstream-audit.md
- docs/architecture.md、README.md、tasks/todo.md

产品目标：
让《雾港夜航：第七码头》前 12 章完成真实的“立项/读者契约 → 路线图 → 章纲 → Draft → Review → 作者接受/回滚 → Memory → 可选 MiroFish 沙盘”闭环。

插件边界：
1. @novel-agent/novel-project：Canon 核心，保留当前安装名；只拥有 Project、Revision、Result Packet、接受/回滚/锁、通用扩展注册和 Canon review Slot。
2. @novel-agent/novel-planning：题材、读者契约、简介、世界/人物底盘、路线图、章纲、承诺、伏笔。
3. @novel-agent/novel-writing：按 contract 生成/重写正文、风格 profile、章节状态和薄 IO capability。
4. @novel-agent/novel-memory：revision-bound 召回、chapter control pack、连续性、写作记忆、官方 Jobs 索引。
5. @novel-agent/novel-review：结构、节奏、动作—反应、连续性、风格、承诺/伏笔 Issue 和可选 diff。
6. @novel-agent/novel-mirofish：独立 AGPL MiroFish sidecar 的 loopback adapter，先做 Reader Reaction 和 Character Pressure；Plot Counterfactual 在上游能力验证前保持 blocked。

硬约束：
- DSH 0.1.1-rc.2 是唯一 Agent/Session/Storage/Event/Approval/Remote/Transport 内核。
- 插件通过 typed Cordis Service 和 SessionEventMap 联动，禁止直接 import 其他插件实现、第二套事件总线、Store、Agent、Workflow 或 Profile。
- 所有小说 UI 只贡献 conversation.view Slot，不新增 Sidebar、路由、独立 TUI 或工作台。
- Canon 是唯一事实源；Memory、Review、MiroFish、社区插件都不能直接写 Canon。
- MiroFish 源码和 AGPL 依赖保持外部 sidecar；不要修改 C:\coding-projects\My-Projects\Original\MiroFish，不复制其源码。
- 不自动接受模型输出；所有正文、设定、Issue 和沙盘 Proposal 都要经过作者 Result Packet 决策。

实现顺序：
1. 先做 Canon 核心收缩和 extension seam RED/GREEN。
2. 再做 Planning 的 project brief→roadmap→chapter contract。
3. 再做 Writing 的 contract→draft→rewrite。
4. 再做 Review，并完成《雾港夜航》R1–R5 的真实 Web Profile smoke。
5. 再做 Memory retrieval/control pack/continuity/Jobs。
6. 再做 novel-mirofish Reader Reaction，然后 Character Pressure。
7. 最后根据真实 IO 场景决定是否拆 novel-io。

每个任务必须：
- 先写 focused RED，证明旧行为捕获不到缺口；
- 用最小代码 GREEN，再 REFACTOR；
- 运行受影响包 test、typecheck、lint、build；
- 跨插件用 fresh isolated DSH_HOME/Profile 验证安装、Remote、Slot、reload、停止和零监听；
- 更新 tasks/todo.md、parity matrix、README、upstream sources 和许可证记录；
- 未有真实证据的行为只能标 implemented-unverified。

首个硬验收：
- R1 project brief 无正文也能接受；
- R2 roadmap/contract 可读取；
- 前 3 章每章有主角、真实冲突、动作—反应、信息变化和章末拉力；
- Review 能定位人物知识越界、世界规则违反、物件位置冲突；
- R2 查询绝不泄漏 R3；
- 正文拒绝但设定接受时正文 projection 不变；
- 回滚后 Canon/Remote/Slot/Storage 一致；
- MiroFish 结果不产生 Canon Delta。

停止条件：
- 先完成一个垂直切片再进入下一个；
- 真实产品冲突才向用户提问；
- 不为保旧测试恢复 retired generic 路线；
- 不提交、不推送、不发布、不部署，除非得到新的明确授权。
``` 
