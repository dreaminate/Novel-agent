# 历史迁移 TODO（只准备，不实现功能）

状态约定：`done` 仅表示本次审计文档已完成；`pending` 表示未来迁移工作；`blocked` 表示有明确外部缺口。任何 pending 项都不得在本 Goal 内改产品源码。

## 本次 Goal

- [x] 读取项目规则、README、四份旧计划、todo、architecture、研究/设计文档，以及 MiroFish 指定文件。
- [x] 运行并记录 novel-agent `git status --short`、`git diff --stat` 和相关只读 diff。
- [x] 记录 MiroFish checkout 的既有 modified/untracked 状态；不覆盖、不清理。
- [x] 生成符号级归属与历史行为矩阵：见 [`history-migration-audit.md`](history-migration-audit.md)。
- [x] 生成 MiroFish 版本、AGPL、依赖、API、runner/IPC、报告/采访和 branch/replay/world-state 证据：见 [`../docs/mirofish-upstream-audit.md`](../docs/mirofish-upstream-audit.md)。
- [x] 记录 `registerExtension` 的当时结论。**2026-09-15 更正**：该项当时的「无 API 证据、采用 namespace-keyed generic Delta 作为下一阶段 RED 目标」已被 M1 取代——`registerExtension` 经本项目 `NovelProjectService` 与 Cordis 注入成立，wire 形状为 `kind: 'extension'` + `namespace` + `valueSchema`。详见下方「不可用/阻塞事项」的同名条目。
- [x] 将旧 Electron、Profile、Terminal、Sidebar、TUI、Transport 路线标为 `retired-generic`；不恢复。
- [x] 将 MiroFish 定义为独立 AGPL sidecar；Plot Counterfactual 保持 `blocked`。
- [x] 运行文档/路径检查、`git diff --check`、最小只读测试并再次运行 status；确认只新增本仓库文档。

## 迁移顺序（M0 完成，M1 起 pending）

### M0 — 重新建立可回滚快照

- [x] 在任何代码写入前保存当前工作树清单、SHA-256 和 `git status --short`。
- [x] 创建并逐文件校验外部 ZIP 备份；初始化的 Git 仓库没有 commit，不把全量未跟踪基线误当作干净 commit。
- [x] 记录从备份解压到新目录再核对恢复的路径；禁止 `git clean`、广泛删除或覆盖他人修改。

2026-09-07 本机准备证据、实际目录、239 个测试、隔离 Web/Desktop smoke 与未验收边界见 [`development-setup-2026-09-07.md`](../docs/development-setup-2026-09-07.md)。本次只补齐既有测试缺失的 rc.2 开发依赖，产品源码与测试保持原字节。

### M1 — Canon seam RED（只允许在新 Goal）

- [x] `ctx.inject(['novelProject'])` 可由扩展读取 typed Service；真实 Cordis callback 注册两个扩展。
- [x] focused RED/GREEN 证明项目自己的 `registerExtension` 可行；采用 `kind: extension` + `namespace: string` 的可生成 wire shape。旧的同名搜索结论不再作为能力判断。
- [x] focused RED/GREEN 与磁盘检查证明 accepted/rolled-back payload 只有 projectId、revision、deltaRefs、sourceSessionId。
- [x] 初始 RED 之前未拆类型或移动源代码；本轮仍未进行领域拆包。
- [x] 用户已允许评估并采用通过验证的官方 DSH 与配套宿主版本；已核查 `0.1.2-rc.1`、`0.1.3-alpha.2` 与 Desktop `2.0.5`。
- [x] 用户已授权本地 marker writer 补丁；rc.1 原生/完整 Host API 的接受后恢复、回滚后恢复和继续接受均已通过。原样官方包的失败仍保留，见 [恢复证据](../docs/canon-session-recovery-2026-09-09.md)。

原 243 个测试及 cold-resume RED 见 [`M1 checkpoint`](../docs/canon-extension-m1-2026-09-08.md)。当前 245 个测试和完整宿主 API 恢复已通过，核心契约可支持 M2 的独立 RED/GREEN；新的 GUI 复验因界面工具 URL 判定停止而未完成，最终可见验收仍须补齐。

### M2 — Canon 迁移

- [x] 导入提案、发布 Tool/审批及文档编码已移入 Writing；Core 提供无授权的领域提案校验入口。266 测试与 fresh Host 四格式、拒绝不写入、冷恢复后发布通过，见 [I/O 迁移](../docs/writing-io-migration-2026-09-09.md)。外部模型与审批答复使用脚本；真实模型和界面验收未完成。

- [x] 完整既有检索组装、中文搜索/排名、账本/生命周期与原生索引 Job 已归属 Memory；两个旧名 Tool 随 Memory 生命周期注册。Core 保留通用版本比较及旧 Remote 派发。264 测试和 fresh Host Jobs/冷恢复通过，见 [检索迁移](../docs/memory-retrieval-migration-2026-09-09.md)。
- [x] 图/因果路径与比较、角色和读者知识边界已迁至 Memory；作者预览使用候选输入，未安装 Memory 时保留基础比较。262 测试及四个 Host lifecycle 的候选/历史/回滚冷恢复通过，见 [图迁移](../docs/memory-graph-migration-2026-09-09.md)。剩余检索/账本/Jobs 与可见验收未完成。
- [x] 既有双向关系、控制包与写作延续状态已移入 Memory；Canon 保留有效来源与锁解析，Memory 不重放版本链。259 测试和 fresh Host 历史/来源/两次冷恢复通过，见 [Memory 迁移](../docs/memory-projection-migration-2026-09-09.md)。其余检索/图/Jobs、wire/schema 与专属界面未完成。
- [x] 审稿执行、响应 schema、Anchor 与 diff 已归属 Review；Core 保留版本检查及旧作者 Remote 的 typed 派发。修正实际 Host 重复 Tools 模块依赖，256 测试及真实子代理/冷恢复/只接受 Issue 通过，见 [审稿迁移](../docs/review-engine-migration-2026-09-09.md)。专属 Remote/Tools/Slot 与真实模型质量未完成。
- [x] Core 的跨领域阶段提示已按 Canon/Planning/Writing/Memory/Review 拆为原生段，保留原 11 段指令；255 测试、真实 Agent 组装、热卸载/恢复及冷重启通过，见 [提示迁移](../docs/domain-prompt-migration-2026-09-09.md)。
- [x] 叙事投影、层级/身份/引用校验与排序已归属 Planning；Canon 提供有效祖先快照和原子校验入口，Core-only Preview 保留基本功能。251 测试及四个真实 Host lifetime 通过，见 [投影迁移](../docs/planning-projection-migration-2026-09-09.md)。wire/schema、其他领域和旧 Remote 消费者仍待迁移。
- [x] 正文写手已从 Core 移入 Writing；Planning 增加指定 accepted revision 的原生只读服务，Writing 缺少/卸载 Planning 时遵循原生等待/撤回。249 测试及新 Host 历史读取/回滚/冷恢复通过，见 [证据](../docs/writing-planning-seam-2026-09-09.md)。该增量后的叙事 projector 归属已由上方迁移项完成。
- [x] 首个能力族迁移：三个 Planning Skills 从核心移出，Core-only、原生 pending injection 和卸载均有 RED/GREEN；全新 rc.1 Host Tool 加载及冷恢复通过。其余核心收缩未完成，见 [首切片证据](../docs/planning-skill-ownership-2026-09-09.md)。
- [x] 先迁 `novelProjectDomainSpec`、Project/Revision/Result Packet/lock/rollback/approval 及对应 tests。**2026-09-15 收口**：按 [M2 工作面](m2-work-surface-2026-09-15.md) 的定义，本条是「定型为 Canon 公共面」而非迁出。Core-only 全链路测试、可读缺插件错误（`NovelProjectDomainUnavailableError`）、Typert 不变式与隔离 Core-only Host 验收见 [M2 记录](../docs/canon-boundary-m2-2026-09-15.md)。
- [x] 重生成 Typert host/remote artifacts；检查 endpoint namespace 与 `NovelProjectService` key 一致。**2026-09-15**：包 build 的 `generate-typert.ts` 重新生成 `lib/typert.*` 与内联 client 描述符；`product-boundary.spec.ts` 断言 12 个 invocation 的 `service === namespace === 'novelProject'`、id 由 namespace/method 构成且 host/remote 描述符一致（受控改写可使其失败），见 [M2 记录](../docs/canon-boundary-m2-2026-09-15.md#w3--typert-制品不变式)。
- [ ] 删除核心中无消费者的 narrative/simulation/retrieval 分支；删除前必须有 focused test 保护目标行为。**2026-09-15 状态**：未执行。272 处 simulation 符号是 M6 历史实现暂存，不得在 M2 清理；`retrieve`/`projectNarrative`/`projectRelationships` 等 legacy Remote 仍有面板消费者，删除前提是 M3+ 的六个领域 Slot 迁移完成。scoped 删除清单与前置条件记录在 [M2 记录](../docs/canon-boundary-m2-2026-09-15.md)。
- [x] Canon 不解释人物、时钟、读者反应或 MiroFish 动作。**2026-09-15**：Planning 的 12 个 Delta kind 值契约（`world`/`mystery`/`clue`/`promise`/`roadmap`/`ending`/`character-state`/`creative-profile`/`reader-contract`/`relationship`/`narrative-unit`/`narrative-clock`）已由 `novel-planning` 通过 `registerDeltaKind` 拥有，Core 只保留 envelope；Memory/Writing 域 kind（`knowledge`/`faction-state`/`location-state`/`object-state`/`emotion-state`/`chapter-state`/`narrative-debt`）按 M5/M4 迁移，期间保持 Core 内联并在 [M2 记录](../docs/canon-boundary-m2-2026-09-15.md) 列明。

### M3 — Planning

- [x] architect/hook/world 三个既有 Skill 已归属 `novel-planning`；本项不包含领域类型、Tools、namespace 或新面板。
- [ ] 迁移 `NarrativeUnit*`、`NovelChapterContract`、rolling roadmap、promise/foreshadow/mystery/ending plan 类型与 architect/hook/world Skills。
- [ ] RED：accepted revision 绑定、R2 不泄漏 R3、缺失 Canon 时遵循 DSH pending injection。
- [ ] UI 继续使用 `conversation.view`，不创建 Planning page/sidebar/TUI。

### M4 — Writing

- [x] `novel-prose-writer` Skill 归属迁移及 Canon + Planning 原生依赖已验证；不包含 Draft/Rewrite Tools、正文投影或新 Slot。
- [ ] 迁移 manuscript/style/automation/publish 与 prose-writer Skill。
- [ ] RED：模型/子 agent 失败不推进 Canon；拒绝正文但接受设定保持旧正文；publish 只读 accepted revision。
- [ ] 复用 DSH fs/workspace/approval；不引入新 Store、Workflow 或 IO 包。

### M5 — Memory + Review

- [x] M2 中迁移既有图、因果比较和知识边界计算；未把合成数据的 native API smoke 作为完整 Memory 或真实小说验收。
- [x] M2 中先迁移既有 relationship、Chapter control pack、post-check 来源关联和写作延续状态；不代表完整 D-007 或真实小说质量验收。
- [x] M2 中先完成四个既有角色的归属迁移和原生依赖/卸载路径；Writing 只读正文及 Memory 检索服务完成历史/回滚验证。Core 检索算法、Jobs、审阅 Tool/Slot 仍待迁移，见 [角色证据](../docs/domain-role-migration-2026-09-09.md)。
- [x] Memory：上述既有后端实现已迁移；专属 Remote/Slot、最终 Tool 名称和完整真实模型/可见验收仍未完成。
- [ ] RED：R2 绝不命中 R3；每个 hit 带 source revision/Anchor；索引为可重建 Job。
- [x] Review：迁移 reviewer 执行/Issue/diff；引用校验、未授权提案和拒绝改写保留旧正文已有本地及真实 Host 证明；新的 Tool/Remote/Slot 仍待迁移。
- [x] Review 只读 Canon、Planning、Writing 和 Memory 服务，不直接写 Canon；Memory 检索算法的所有权迁移仍待完成。

### M6 — MiroFish adapter（未来独立 Goal）

- [ ] 不复制 MiroFish 源码，不修改其 checkout；Node adapter 只在 novel-agent 新建。
- [ ] 通过 localhost loopback HTTP 调用现有 graph/create/prepare/start/status/report/interview/stop endpoints。
- [ ] RED：sourceRevision/input hash 固定；sidecar 停止返回原始连接错误；无来源片段不能产生 Apply-able proposal；Canon hash 不变；不同 revision 不得复用同一 runId。
- [ ] Reader Reaction 先于 Character Pressure；Plot Counterfactual 维持 `blocked`。

## 删除与保留执行闸门

删除任何历史符号前必须满足：

1. 符号在本审计表有唯一目标归属；
2. 所有现有消费者已迁移或明确标记 retired；
3. focused test 已复制为边界测试并先 RED 后 GREEN；
4. package test/typecheck/lint/build 通过；
5. fresh isolated 当前目标版本 Profile（已应用 Session 恢复补丁）smoke 有实现、测试和运行证据；
6. 失败可回滚到上一 checkpoint。

保留清单：`novel-project` 包名/self-mount、Canon domain、Result Packet/Revision/lock/rollback、DSH 原生 seams（当前目标版本 `0.1.2-rc.1`）、generated Typert、`conversation.view` 必要面板、按族迁移的 tests、外部 MiroFish sidecar contract。

删除清单：local Electron/Forge、custom scheme/preload/IPC、聚合 Profile/Bundle/installer、operator terminal、私有 Workbench/editor/layout、重复 Better Sidebar tab、Pi TUI footer/adapter、第二套 Agent/Session/Store/Workflow/Transport/Gateway、仅服务它们的依赖和测试。

## 不可用/阻塞事项

- `registerExtension`：**已解除阻塞，不再是待定方案（2026-09-15 更正）。** 准确结论分两层：DSH 自身确实不提供动态 endpoint 注册（Typert protocol 只有静态 `@Remote`/`RemoteScope` 与 generated registry contribution）；但「Canon 扩展」由本项目自己的 seam 承担——`NovelProjectService.registerExtension` / `registerProjector` 经 Cordis `ctx.inject(['novelProject'])` 回调注册，wire 形状为 `kind: 'extension'` + `namespace` + `valueSchema`，已由 M1 的 focused RED/GREEN 与真实 Host 验证（见 [`M1 checkpoint`](../docs/canon-extension-m1-2026-09-08.md)；代码见 `packages/novel-project/src/index.ts:1105`、`packages/novel-project/src/types.ts:292`）。本条目原先「若不可行则退回 namespace-keyed generic Delta」的条件已满足，该退路不再适用；不要再据此实现通用 Delta 方案。
- Plot Counterfactual：MiroFish 只有 OASIS Twitter/Reddit 社交动作、run state、action log、report/interview；没有叙事动作、StateSnapshot/StateDelta、branch/replay API。需要独立 AGPL fork/upstream custom-action spike，未通过前不得实现或宣称。
- 旧审计中 rc.1 checkout 属于迁出机。本机已取得官方 `dsh-v0.1.1-rc.2` 源码归档和独立 rc.2 CLI，并完成隔离 Profile 检查；详见本机准备记录。源码归档没有 Git 历史，不能伪称 checkout 或干净 HEAD。

## 完成后停止

本 TODO 的 H-001 至 H-008 审计项完成后，立即关闭本 Goal。下一步必须由用户另开 Goal 并明确授权，届时才进入 Canon/Planning/Writing/Memory/Review 或 MiroFish adapter 的正式实现。
