# M2 工作面与规格漂移处置建议 — 2026-09-15

**本文件的地位：** 工作面参考 + 漂移处置提案。
本文件本身**不改任何产品代码，也不改任何规格原文**。`AGENTS.md` 要求「发现漂移只报告」，因此第 3、4 节只列结论与建议方案。

> **2026-09-15 更新：** 用户已授权执行 §4 的**方案 A（四处定点修订）**、§3.2 第 5 条（`registerExtension` 结论消歧），以及 §3.1 第 6 条中 `tasks/plan-final.md` 与 `tasks/history-migration-todo.md` 的版本残留。以上**均已执行完毕**，逐条改动、校验与残留清单见 [`docs/agent-rules-alignment-2026-09-15.md`](../docs/agent-rules-alignment-2026-09-15.md)。
> 本文档相应条款保留为提案原文，不再代表未决状态。**仍未处置**的是 §3.1/D 与 §3.3 中 `THIRD_PARTY_NOTICES.md`、`docs/claude-desktop-parity-matrix.md`、`docs/architecture.md`、`docs/security-threat-model.md` 的版本残留——这四项属于状态/声明类文档，其中两处的 `rc.2` 是「证据基线」性质，需与治理文档不同的处理方式，等另行授权；详见变更记录 §5。

---

## 0. 证据边界

### 0.1 本次完整阅读

- `AGENTS.md`、`tasks/plan-final.md`、`docs/plugin-design-v3.md`
- `tasks/history-migration-audit.md`（207 行，全读）
- `docs/architecture.md`（1182 行，全读）
- `README.md`（1216 行，全读）
- `tasks/history-migration-todo.md`（110 行，全读）
- `docs/writing-io-migration-2026-09-09.md`、`docs/open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md`、`patches/README.md`（全读）
- `tasks/todo.md`：第 1–230 行（全部 M2 切片、M1、A-001、B-001、N-001 开头）逐行读；第 230–2576 行的 N-001…N-007、C-001、C-002 只读标题、`**Status:**` 行与未勾选项，**未逐行读完**。

### 0.2 本次实测（而非转述文档）

| 命令 | 结果 |
| --- | --- |
| `git status --short` | 全部文件未跟踪；`master` 无任何 commit |
| `pnpm test`（经 corepack 直调） | **5 个测试文件，268 / 268 通过，约 51 秒** |
| `wc -l packages/*/src/*` | 见 §1.2 |
| `grep` 实物核对 | Core 注册的 Tool / Remote / Skill、projector namespace、prompt 段、依赖版本，见 §1.3–§1.4 |

**未运行：** `typecheck`、`lint`、`build`、任何隔离 Profile smoke。
**未做任何写入：** 除本文件与 `.workbuddy/memory/` 日志外，未改动产品源码、依赖、lockfile、规格或上游。

### 0.3 环境说明（与上轮不同，需注意）

本机为 Windows 工作机（工作根 `D:\Work\`）。文档中大量证据路径绑定的是**另一台机器**（`C:\Users\33166\...`）或 macOS 侧的 `wzy`，在本机不可解析。本文件引用它们时只作为**文档内记录**，不当作本机可复现事实。

`pnpm` 不在 PATH，且 Git Bash 下 `corepack pnpm ...` 会因路径转换失败。可用替代：

```bash
node "C:/Users/<user>/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/corepack/dist/corepack.js" pnpm <script>
```

---

## 1. 事实基线

### 1.1 仓库与工具链

- 无 Git 基线：`master` 零提交，全部文件未跟踪。回滚只能依赖 `.novel-agent/checkpoints/`（15 个检查点）与外部 ZIP 备份。**当前不存在可 `git restore` 的状态**。
- 根 `package.json`：pnpm `11.7.0`、Node `^22.19 || >=24`、vitest `4.1.8`、TypeScript `6.0.3`、oxlint `1.76.0`。

### 1.2 五个包的实际规模

| 包 | 关键源文件行数 |
| --- | --- |
| `novel-project`（Canon） | `index.ts` 3,664 / `types.ts` 3,152 / `result-packet-schema.ts` 1,881 / `client/NovelProjectPanel.tsx` **7,587** |
| `novel-planning` | `index.ts` 392 / `projection.ts` 328 |
| `novel-writing` | `index.ts` 704 / `automation.ts` 676 / `documents.ts` 237 |
| `novel-memory` | `retrieval.ts` 1,941 / `index.ts` 575 / `control-pack.ts` 480 / `graph.ts` 443 / `relationships.ts` 93 |
| `novel-review` | `index.ts` 305 |

依赖版本**已统一**，不存在混版：

- 全部 5 个包：`@deepseek-ai/dsh-*` = `0.1.2-rc.1`，`@deepseek-ai/cordis` = `4.0.2`。
- 根 `pnpm-workspace.yaml` 已登记 `patchedDependencies: '@deepseek-ai/dsh-session@0.1.2-rc.1'`。
- **任何 manifest 中都没有 `0.1.1-rc.2`。**

### 1.3 Core（`novel-project`）实测残留

Core 已完成的收缩（实物确认，非文档转述）：

- **注册 0 个领域角色 Skill**（八个角色分别由 Planning / Writing / Memory / Review 注册）。
- **prompt 段已五方拆分**：`novel:canon` 在 Core（order 120），`novel:planning` / `novel:writing` / `novel:memory` / `novel:review` 在各自插件。
- 导入提案 `propose_novel_import` 与发布 `publish_novel_manuscript` 已不在 Core（Writing 拥有）。
- `retrieve_novel_context` / `rebuild_novel_index` 已不在 Core（Memory 拥有）。
- 叙事投影实现已不在 Core：`planning/narrative` projector 由 Planning 注册；`memory/relationships` 由 Memory 注册。Core 只保留 `readProjection` / `projectDomain` 读取口。

Core **仍持有**：

| 项 | 位置 / 证据 |
| --- | --- |
| `novelProjectDomainSpec`（`defineDomain({name:'novel_project'})`） | `index.ts:1010` |
| 4 个 Tool | `manage_novel_canon_lock`(1205)、`propose_novel_result_packet`(1277)、`simulate_novel_story_world`(1346)、`simulate_novel_reader_response`(1484) |
| 12 个 `@Remote` | `open` / `current` / `reviewDraft` / `previewReview` / `review` / `rollback` / `projectNarrative` / `projectManuscripts` / `retrieve` / `projectCanon` / `projectRelationships` / `read` |
| `registerExtension` / `registerProjector` / `readSnapshot` / `readProjection`（Canon 自有 seam） | `index.ts:1105 / 1111 / 1117 / 1124` |
| simulation 家族实现 | `SimulationRun`/`StoryWorld`/`ReaderResponse` 等符号在 `index.ts` 命中 272 处、`types.ts` 172 处 |
| 客户端面板 | `NovelProjectPanel.tsx` 7,587 行 |

**Core 的 legacy 派发现有硬耦合：** `remoteRetrieve` 用 `this.ctx.get('novelMemory')!.retrieve(...)`（`index.ts:3081`），`projectNarrative` 用 `readProjection(...)`，而后者内部是 `this.projectors.get(namespace)!`（`index.ts:1125`）。即这些 Remote **在对应领域插件缺失时会抛原生 TypeError，而不是给出可读的缺插件错误**。
说明：`previewReview` 走的是另一条路径，它在 `index.ts:2822` 用 `this.projectors.has('planning/narrative')` 做了显式守卫，Core-only 预览确实能降级工作。**「Core-only 预览可用」有代码支持；「legacy Remote 缺插件时优雅失败」没有。** 后者是否可被用户触发（面板是否已按插件安装情况门控）**本轮未验证**。

### 1.4 M2 逐切片状态

`tasks/todo.md` 中 11 个 M2 切片全部标为 `**Status:** verified`，且每片都留了一条未勾选的「剩余范围」。逐片剩余范围的**并集**即 M2 真正的待办：

| 切片 | 该片自述的剩余范围 |
| --- | --- |
| Writing import/publication | Final Writing interfaces、其余领域迁移、GUI、真实 DeepSeek、完整小说验收 |
| Memory retrieval + Jobs | Final Tool 名、专属 Memory Remote/Slot、wire/schema、其他领域迁移、真实模型/GUI |
| Memory graph/causal/knowledge | 其余检索/排名、账本/生命周期、Jobs、wire/schema、专属 Remote/Slot、GUI |
| Memory relationships/chapter context | 其余检索/排名/知识/图算法、Jobs、wire/schema、专属 Remote/Slot、GUI |
| Review execution + Tools peer | 专属 Review Remote/Tools/Slot、其余 Core 收缩、Memory 算法、GUI、真实 DeepSeek |
| Domain prompts | 继续领域算法、wire/schema、Tool/Remote 归属与新增 Slot |
| 八个角色 Skill 归属 | 领域 wire/schema、Tool/Remote body、其余领域算法/Slot；`Memory.retrieve` 仍委托 Core 检索实现 |
| Planning projection ownership | 领域 wire/schema、retrieval/graph/simulation/IO、专属 Remote/Slot；legacy entry 消费者仍在 |
| Planning Service + Writing role | 领域 Tools/types/projections、Planning/Writing Remote/Slot、真实模型验收 |
| 首个 Planning 归属切片 | v3 Planning contracts、tools、必要 `conversation.view`；GUI 与真实模型验收 |
| M1 Canon seam | 新的 GUI 复验仍未完成 |

**结论：M2 的「已完成」全部是「归属（ownership）已迁移并验证」，不是「接口已定型」。** 十一处剩余范围反复指向同一个四项集合：**wire/schema、专属 Tool/Remote/Slot、Core 继续收缩、真实模型与 GUI 验收**。

---

## 2. M2 剩余工作面

### 2.1 真正还未做的四项（按依赖顺序）

`tasks/history-migration-todo.md` 的 M2 段落仍有 4 个未勾选项，与上表并集一致。按依赖排序：

**① Core 继续收缩（Canon 边界定型）** — 其余全部事项的底座

- 把 `novelProjectDomainSpec`、Project / Revision / Result Packet / lock / rollback / approval **正式定型为 Canon 边界**，并对其声明与测试完成归属化整理。注意：这些**归属 Canon，不是迁出 Canon**；本条的含义是「让它们成为经过界定的 Canon 公共面」，而不是搬家。
- 处置 Core 内已无消费者的分支。
- 明确并执行「Canon 不解释人物、时钟、读者反应或 MiroFish 动作」的边界：把 `types.ts` 中仍由 Core 持有的领域类型引用改为经 projector / 领域服务取用。
- **RED 目标：** Core-only 装配下，Canon 的 open / read / propose / preview / apply / rollback / lock 全链路可运行；领域插件缺失时给出**可读的缺插件错误**而非 TypeError。
- **验收：** focused test + 包 test/typecheck/lint/build + 全新隔离 Profile 冷恢复。

**② 领域 wire/schema 定型**

- 十类 clock、lifecycle、ledger、projection 的 wire 形状从 Core 的 `result-packet-schema.ts`（1,881 行）与 `types.ts`（3,152 行）按域拆定。
- **RED 目标：** 每个领域 namespace 的 schema 由所属插件注册；Core 不内联解释其语义。
- **验收：** 逐 namespace 的 focused RED/GREEN；迁移后旧断言不得弱化（此前各切片均在记录「保留 N 条完整 expect 链」）。

**③ 专属 Tool / Remote / Slot**

- 按 `docs/plugin-design-v3.md` 落地六个 Slot：`novel-canon-review` / `novel-planning-board` / `novel-writing-stage` / `novel-memory-recall` / `novel-review-findings` / `novel-mirofish-sandbox`。
- 现在实际只有 Core 的 `novel-project` Slot 在使用，领域 Slot 尚未注册。
- 同时删除 Core 中已由领域插件接管的 legacy Remote 派发（`retrieve` / `projectNarrative` / `projectRelationships` 等），前提是面板消费者先改完。
- **验收：** 六个 Slot 在 reload 后与 Remote/Storage 一致（`plugin-design-v3.md` 验收第 7 条）。

**④ 真实模型与 GUI 验收**

- 全部十一处剩余范围都点到了这一项。当前证据里模型边界与审批答复方**均为脚本**。
- 这是《雾港夜航》前 12 章验收的前置。

### 2.2 与 M2 相邻但**不属于** M2 的项（不要混入）

| 项 | 归属 | 状态 |
| --- | --- | --- |
| `simulate_novel_story_world` / `simulate_novel_reader_response` 迁至 `novel-mirofish` adapter | M6 | 依赖 MiroFish sidecar；Plot Counterfactual 仍 `blocked` |
| 前 12 章《雾港夜航》真实闭环验收 | plan-final §6 | 未开始；且 `tasks/todo.md` 记录了第三至五章仍有已确认的正文元文本/物证/债务引用问题待修 |
| `novel-io` 是否独立成包 | D-014 | 未定，需真实导入导出场景证据 |

**注意：** Core 里那 272 处 simulation 符号**不是「无消费者僵尸代码」**，而是 M6 的历史实现暂存（`history-migration-audit.md` 标注为 `mirofish-adapter（历史实现暂存）`）。删除它必须等 M6 落地，不能作为 M2「清理」顺手做掉。

### 2.3 风险

1. **无 Git 基线**：M2 ① 是本轮最重的一次结构改动，而 `git restore` 不可用。动手前必须先确认最新 checkpoint 可用，并**明确本次回滚点**。
2. **文档计数滞后**：README 与最新迁移文档写 `266/266`，实测 `268`；`architecture.md` 里还留着 `239/239`、`205/205` 等更早快照。以实测为准。
3. **`registerExtension` 阻塞结论已过期**，见 §3 第 5 条——若照旧结论行事，会去实现一个不必要的 generic Delta 方案。

---

## 3. 文档漂移清单

上轮我报了「三处」。完整读完后，实际是 **9 条**，其中 4 条会实际误导后续工作。**我上轮的三处是部分阅读下的结论，此处更正。**

### 3.1 会误导后续工作（建议优先处置）

| # | 位置 | 现状 | 为什么是问题 |
| --- | --- | --- | --- |
| 1 | `AGENTS.md:26` | 「所有投入产品路径并由 novel-agent 解析的 DSH npm 包**必须精确为 `0.1.1-rc.2`**。若某个需要的包不能在实际 rc.2 Profile 中解析和运行，**停止该依赖变更**」 | 与实测直接冲突：五包全部 `0.1.2-rc.1`。而 `AGENTS.md` 是每轮开工的强制第一读物——照它执行会要求把已经验证过的版本改回去 |
| 2 | `AGENTS.md:12, 40` | 第 12 行「不为上游重写补丁」；第 40 行「不为社区宿主或 DSH 的……**生命周期行为写 novel-agent 补丁**」 | `AGENTS.md` **全文从未提及**本项目强制依赖 `patches/@deepseek-ai__dsh-session@0.1.2-rc.1.patch`，而第 40 行按字面读**禁止**这个已被授权且必需的补丁。缺了这条规则，后续任何一次「遵守 AGENTS.md」的安装都不会打补丁，Canon 冷恢复会失败 |
| 3 | `AGENTS.md:37` | 「产品 Desktop 宿主**固定复用** Release `v2.0.2`（tag commit `9d18856d…`）」 | 与 README 冲突。`README.md:105` 已把目标指向 Desktop `2.0.5`（配套 rc.1），但注明**尚未安装或验收**。真实状态是「2.0.2 是最后验证组合，2.0.5 是待验收目标」——「固定复用」的措辞把这个区别抹掉了 |
| 4 | `AGENTS.md:47, 79` | 验收门槛写的是「全新隔离 **rc.2** Profile 的真实 install/load/UI 或 TUI smoke」 | 版本号已过期。这条是**验收要求**，过期会让正确版本的 smoke 看起来不合规 |

### 3.2 内部矛盾 / 过期结论

| # | 位置 | 现状 |
| --- | --- | --- |
| 5 | `tasks/history-migration-todo.md:103` vs 同文件 `:30-31` | **同一文件自相矛盾。** 第 103 行「不可用/阻塞事项」写：`registerExtension`——未发现 Canon 动态扩展 API，「采用 generic Delta，**直到新的 focused RED/GREEN 证明其他方案**」；而第 30–31 行已勾选：`registerExtension` 可行、采用 `kind: 'extension'` + `namespace: string`。实物证实后者：`novel-project/src/index.ts:1105` 有 `registerExtension`，`types.ts:292` 的 `ExtensionCanonDelta` 就是那个形状。`history-migration-audit.md:132` 与 `docs/goal-prompts-final.md:24` 仍沿用旧的 blocked 结论，`tasks/plan-final.md:100` 的条件句也已经满足 |
| 6 | `tasks/plan-final.md:20` | 治理计划本身仍写「DSH `0.1.1-rc.2` 是唯一……运行时。社区 Desktop `v2.0.2`……」 |

### 3.3 状态与合规类

| # | 位置 | 现状 |
| --- | --- | --- |
| 7 | `THIRD_PARTY_NOTICES.md:82,122` | 仍声明当前宿主为「Exact `0.1.1-rc.2` host packages」。这是**第三方声明文件**，与实际解析版本不符 |
| 8 | `docs/claude-desktop-parity-matrix.md:6` | 表头写「Desktop `v2.0.2` on DSH `0.1.1-rc.2`」，而该文件被 `AGENTS.md` 指定为**公开体验范围与状态的事实来源** |
| 9 | `docs/architecture.md:7-8,33-34`、`docs/security-threat-model.md:6` | Status 头与「Decision 1」仍写死 rc.2。`architecture.md` 另有一处小漂移：`history-migration-audit.md:91` 记 Cordis `4.0.1`，实测为 `4.0.2` |

**不作处置的历史文档（正确，不要动）：** `docs/*-e2e-2026-*.md`、`docs/*-smoke-2026-*.md` 等约 60 份文件中的 rc.2 是**带日期的运行记录**，记录"当时跑在 rc.2 上"本身就正确。README 对 rc.2 的引用也已加「既有隔离 smoke 记录保留在 `docs/`」的历史框定。

---

## 4. 规格漂移处置建议

问题的根源是一条**已被用户决定取代、但规格文件未同步**的规则。`docs/open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md:5` 已经写清楚：

> 原 rc.2 / Desktop 2.0.2 的版本限制**被用户的新选择取代**；其余单一 DSH 内核、上游只读、作者决策和小说事实边界不变。

也就是说：**用户 2026-09-08 的决定就是权威，`AGENTS.md` 只是没跟上。** 所以处置方向是「把规格同步到既有决定」，而不是重新讨论版本选型。

### 方案 A（推荐）：对 `AGENTS.md` 做四处定点修订

只改与决定冲突的四处，其余规则一字不动。

**A1 — 第 26 行（DSH 唯一内核）** 替换为：

> - 所有投入产品路径并由 novel-agent 解析的 DSH npm 包必须精确为 **`0.1.2-rc.1`**（用户 2026-09-08 明确选定，取代原 rc.2 限制）。不得混用已解析的 DSH 版本或依赖 dist-tag。若某依赖需要更换版本或引入 alpha，先取得用户明确授权并记录证据，不在本规则内自行升级。

**A2 — 在「DSH 唯一内核」段新增一条（补上缺失的补丁规则）** ：

> - 实际运行 DSH 的 Host 与所选 Profile **必须应用本仓库维护的 `@deepseek-ai/dsh-session@0.1.2-rc.1` 补丁**（`patches/README.md`）。该补丁只给 `Session.append` 增加 log-only 事件的可选 `{ ignorable: true }`，本项目仅 `novel/canon/accepted` 与 `novel/canon/rolled-back` 使用。这是用户已授权的例外；除它之外，仍不得为 DSH 正常生命周期行为写 novel-agent 补丁。

**A3 — 第 37 行（社区 Desktop）** 替换为：

> - 产品 Desktop 宿主复用 `anywhere-labs/deepseek-harness-desktop`。**最后完成验证的组合是 Release `v2.0.2`**（tag commit `9d18856ddea4f20eb3ef8c88b0436921c6b19606`，MIT）；**当前目标版本为 `v2.0.5`，尚未安装或验收**，在完成隔离 smoke 之前不得写成已验证。novel-agent 不再拥有 Electron bootstrap、窗口、托盘、Profile Manager、原生 operator terminal、更新、市场或发行安装器。

**A4 — 第 47、79 行** 把「隔离 `rc.2` Profile」的版本字样改为「隔离的当前目标版本 Profile」（或直接写 `0.1.2-rc.1`），避免版本号散落在验收规则里。

**涉及文件：** 仅 `AGENTS.md` 一个。四处都是替换/新增，不删任何现有约束。

### 方案 B：不做修订，改为在 `AGENTS.md` 顶部加一条总覆盖声明

> 本文件的版本号以 `README.md`「当前证据边界」与最近一次 adoption 记录为准；`AGENTS.md` 中出现的历史版本号（`0.1.1-rc.2`、Desktop `v2.0.2`）不构成当前约束。

- **优点：** 改动最小，一处落定；以后换版本只改 README。
- **缺点：** 留下一个「读到第 26 行还得回头看第 3 行」的规则结构；第 40 行的补丁禁令仍然没被解除，A2 想解决的那个真实隐患依然存在。

### 方案 C：全量清扫

把 §3 的 9 条一次性全部对齐，包括 `THIRD_PARTY_NOTICES.md`、`parity matrix`、`architecture.md`、`plan-final.md`、`security-threat-model.md`。

- **优点：** 文档之间彻底自洽。
- **缺点：** 触及治理计划、第三方声明和事实来源矩阵三类文件；`plan-final.md` 与 `architecture.md` 中大量内容本就以「迁移前基线」身份被引用，全量改写会破坏历史可对照性，且工作量远超 M2 本身。

### 我的建议

**先做方案 A，再做 §3.2 的第 5 条（`registerExtension` 结论消歧）**；方案 C 留到 M2 收口时作为一次独立的文档对齐任务。

理由：

1. 方案 A 只动一个文件、四处，却解决了**唯一会让后续每轮工作做错方向**的两个问题：版本基线错、以及补丁规则缺失导致冷恢复必然失败。
2. 第 5 条是本次新发现里最实际的一条：`history-migration-todo.md` 自己和自己矛盾，而 `plan-final.md:100` 与 `goal-prompts-final.md:24` 都还挂着「若不支持动态注册就退回 generic Delta」的未决条件。这个条件**已经满足**，不消歧就有实现重复方案的真实风险。
3. 方案 C 里的 `architecture.md` / `plan-final.md` 有明确的历史对照价值，不值得为版本号牺牲。

**以上方案 A 与第 5 条已由用户于 2026-09-15 授权并执行完毕**，逐条改动见 [`docs/agent-rules-alignment-2026-09-15.md`](../docs/agent-rules-alignment-2026-09-15.md)。方案 C 未执行，等 M2 收口时另行授权。

---

## 5. 未验证项（显式清单）

- `pnpm typecheck` / `lint` / `build` 本轮**未运行**。
- 未执行任何隔离 Profile 的 install / load / Host 启动 / UI smoke。
- 未跑真实模型；全部历史证据中模型与审批答复方均为脚本。
- §1.3 的「legacy Remote 在缺插件时抛 TypeError」是**读代码得出的结论**，未构造缺失插件场景实测，也未确认用户是否可达。
- `tasks/todo.md` 第 230–2576 行（N-001…N-007、C-001、C-002 的逐条明细）**未逐行阅读**。
- §3 的漂移条目来自全文检索与定点核对；可能存在其他未纳入检索词的漂移（例如社区插件版本号与 `README.md:88-97` 表格的一致性、`SECURITY` / 许可证类文件的日期），**未做系统排查**。
- 文档中记录的大量证据路径绑定其他机器（`C:\Users\33166\...`、macOS `wzy`），本机不可复现，未逐一核验其现存在性。
