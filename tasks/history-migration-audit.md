# 历史代码与迁移审计（2026-09-05）

本审计只处理历史代码、旧计划和迁移准备。没有实现 Canon、Planning、Writing、Memory、Review 或 MiroFish adapter。

## 证据边界与当前状态

已完整阅读并以当前工作树为准核对：

- [`AGENTS.md`](../AGENTS.md)、[`README.md`](../README.md)、[`tasks/plan.md`](plan.md)、[`tasks/plan-v2.md`](plan-v2.md)、[`tasks/plan-v3.md`](plan-v3.md)、[`tasks/plan-final.md`](plan-final.md)、[`tasks/todo.md`](todo.md)；
- [`docs/architecture.md`](../docs/architecture.md)、[`docs/novel-agent-product-research-2026-09-05.md`](../docs/novel-agent-product-research-2026-09-05.md)、[`docs/plugin-design-v3.md`](../docs/plugin-design-v3.md)、[`docs/mirofish-novel-sandbox-design.md`](../docs/mirofish-novel-sandbox-design.md)；
- 当前 `packages/novel-project/src`、`packages/novel-project/tests`、根 manifest/lockfile/build 配置；
- MiroFish 的 `README.md`、`README-ZH.md`、`LICENSE`、`package.json`、`backend/pyproject.toml`、`backend/app/api`、`backend/app/services`、`backend/scripts`。

开始时运行的只读命令是 `git status --short`、`git diff --stat` 和产品源代码/测试 diff。当前 novel-agent 输出为全量未跟踪树：

```text
?? .gitignore
?? AGENTS.md
?? README.md
?? THIRD_PARTY_NOTICES.md
?? docs/
?? graphify-out/
?? package.json
?? packages/
?? pnpm-lock.yaml
?? pnpm-workspace.yaml
?? tasks/
?? tsconfig.base.json
?? tsconfig.host.json
?? tsconfig.json
?? vitest.config.ts
```

因此 `git diff` 没有可读的 tracked diff；上面每一项都视为既有工作树内容，不能覆盖、清理或推断为本次新增。`graphify-out/` 仍保持原样。

随后用 `git status --short --untracked-files=all` 展开核对，发现 `tasks/.tmp-ch4-plan.mjs`、`tasks/.tmp-ch4-write.mjs` 及其余 `docs/`、`packages/`、`graphify-out/` 子项均为未跟踪既有内容；本次仅新增本审计列出的三个 Markdown 文件。因为仓库没有 tracked 基线，所有 `??` 项都保留，不能用状态差异推断删除或覆盖权限。

MiroFish checkout 的只读状态记录在 [`docs/mirofish-upstream-audit.md`](../docs/mirofish-upstream-audit.md)：它有既有 modified/untracked 文件，本次没有写入。

## 当前单插件符号迁移表

归属值严格使用：`canon`、`planning`、`writing`、`memory`、`review`、`mirofish-adapter`、`retired-generic`。表中“保留”是迁移后的责任边界，不表示本次已移动代码。

### 文件与顶层运行时符号

| 当前文件/符号 | 归属 | 迁移判断与证据 |
|---|---|---|
| `src/index.ts:2212-2218` `novelProjectDomainSpec`、`novel_project.projects` | canon | 持久化 Project/Revision 聚合的唯一事实源。 |
| `src/index.ts:2220-2225` Cordis `Context.novelProject` 合并 | canon | Canon Service 注入键；未来扩展只依赖 typed Service。 |
| `src/index.ts:2227-2232` `SessionEventMap['novel/automation-policy']` | writing | 记录作者批准的 bounded Write automation envelope；不是 Canon 跨插件事件。 |
| `src/index.ts:2234-2238` `JobKindMap['novel-index']` | memory | 索引是可重建派生物，归 Memory，继续使用 DSH Jobs。 |
| `src/index.ts:2246-2265` `NovelProjectService`、`static inject`、constructor | canon | 单一 `TypertRemoteService` 和 DSH-native authority；拆分时保留 Service 键 `novelProject`。 |
| `src/index.ts:2267-2287` domain open、system prompt、8 个 Skill 注册 | 混合：Skill 目标见下表 | 初始化本身留在现有 self-mount 插件；正式拆分时注册职责应按 Skill 目标迁移。 |
| `src/index.ts:6104-6155` Revision/lock/workspace errors | canon | 领域错误属于 Canon 边界。 |
| `src/index.ts:6173-7515` Canon/relationship/impact/graph/projection helpers | canon + memory | `projectSnapshot`、`revisionSnapshot`、`buildCanonProjection`、`buildCanonEntities`、`buildRelationshipProjection`、revision impact 和 causal graph 保留 Canon；retrieval-facing graph/causal read model 是 Memory 的只读 projection。 |
| `src/index.ts:7522-7621` Jieba/local full-text index helpers | memory | `LOCAL_CHINESE_RETRIEVAL_PROVIDER`、index build/search/source ranges 属于可重建检索。 |
| `src/index.ts:7622-8001` writing-memory ranking/recall helpers | memory | control pack、setting/continuity/debt/character-arc recall 只读 accepted revision。 |
| `src/index.ts:8002-8917` narrative projection、chapter control pack、closure/clock validation | planning + memory | narrative units/contracts/roadmap/clock ownership先归 planning；control pack、post-check、债务/连续性 projection 归 memory。不能把整段继续留在 Canon。 |
| `src/index.ts:8923-9052` automation policy folding/budget accounting | writing | DSH Session Event 的 Write envelope；不建立第二个 workflow。 |
| `src/index.ts:9054-9331` accepted Canon/entity/relationship helpers | canon | generic fact projection、lock conflict、immutable accepted state。 |
| `src/result-packet-schema.ts` 全部 schema | canon | Result Packet/Decision/Anchor/Provenance 是通用审阅与 Apply 契约。Writing/Planning/Review/MiroFish 只能产生 draft/proposal。 |
| `src/client/index.ts` Remote mount 与 `conversation.view` id `novel-project` | canon | 唯一必要小说 UI；不要恢复 Sidebar/TUI adapter。拆分后的其他 Slot 仍由 DSH `conversation.view` 承载。 |
| `src/client/NovelProjectPanel.tsx` | canon（读取 planning/writing/memory/review projection） | 面板呈现 Result Packet、Revision、Canon、narrative、manuscript、relationship、retrieval；它是现有 UI 壳，后续按能力逐项抽出，不新建页面。 |
| `build/generate-typert.ts`、生成的 `lib/typert*.{js,d.ts}` | canon/DSH build artifact | 描述符由 Typert generator 生成；每次迁移后重新生成，不能手改 generated artifact。 |
| `cordis.patch.yml` `novel-project` 单 row | canon | 唯一 self-mount；没有聚合 Profile 或社区插件 row。 |

### `src/types.ts` 类型与常量（符号级分组）

| 符号集合（均在 `src/types.ts`，括号为主要行段） | 归属 | 处理 |
|---|---|---|
| `NovelWorkspaceId`, `ManuscriptRevision`, `ManuscriptDiff`, `NovelTextImportRequest`, `CanonFactDelta`, `SourceAnchor`, `AnchoredIssue`, `AcceptanceAuthorization`, `NovelCanonLock`, `ResultProvenance`, `NovelResultPacket*`, `ReviewNovelResultPacket`, `RollbackNovelRevision`, `AcceptedNovelRevision`, `NovelProject`（约 5-290、1085-1254、约 2230 以后） | canon | 最小事实/审阅/回滚契约保留。导入请求只保留为 Writing 薄 capability 的输入。 |
| `CANON_FACT_KINDS`, `CanonFactKind`, `NovelCanonValue`, `NovelCanonFact`, `NovelCanonFieldSource`, `NovelCanonEntity`, `NovelCanonProjection`, `NovelRelationshipFieldSource`, `NovelRelationshipPair`, `NovelRelationshipLine`, `NovelRelationshipProjection` | canon | generic namespace/key/value projection；不在核心解释小说语义。 |
| `NARRATIVE_LEVELS`, `NarrativeLevel`, `NarrativeUnitValue`, `NarrativeUnit*Delta`, `NovelChapterContract`, `NovelRollingRoadmap*`, `NovelPromise*`, `NovelClue*`, `NovelMystery*`, `NovelEndingHypothesis*` | planning | 项目 brief、roadmap、hierarchy、chapter contract、promise/foreshadow/mystery/ending 计划数据。 |
| `NARRATIVE_CLOCKS`, `NarrativeClock`, 全部 `*Clock*Value`、`NarrativeClock*Delta`、`NovelNarrative*` | planning（定义）/memory（projection） | schema 迁移时拆“计划/合同”与“accepted projection”；不复制第二事实源。 |
| `NarrativeDebt*`, `NovelPostChapterCheck*`, `NovelClosureLedger`, `NovelWriting*`, `NovelRetrieval*`, `NovelChapterControlPack`, `NovelManuscriptProjection`, revision impact/change 类型 | memory | revision-bound control pack、债务、写作记忆、索引和连续性 read model。正文事实仍由 Canon accepted revision 持有。 |
| `NovelCreativeStyleProfileValue`, `NovelCreativeSerializationProfileValue`, `NovelReaderContractProfileValue`, `NovelRelationshipTurn`, `NovelRelationshipLineStateValue`, `NovelCharacterArcHypothesisValue` | planning（契约/设定） + writing（style） | 先按真实消费者迁移；同一符号不能双归属，若跨域用 Canon generic Delta 引用。 |
| `NovelGraph*`, `NovelKnowledgeBoundary*`, `NovelStoryTimeRange`, `NovelStoryEventValue`, `NovelTimeline*`, `NovelProgression*`, `NovelFaction*`, `NovelLocation*`, `NovelObject*`, `NovelEmotion*`, `NovelCharacterTrajectory*`, lifecycle 类型 | memory | 全部是从 accepted facts/manuscripts 重建的连续性、图和 timeline projection；不得成为第二 Store。 |
| `STORY_WORLD_ACTION_TYPES`, `StoryWorld*`, `SimulationSandbox`, `SimulationReplayKeyInput`（约 1700 以后） | mirofish-adapter（历史实现暂存） | 当前实现是本地 synthetic proposal-only SimulationRun；迁移目标是未来 `novel-mirofish` contract。其现有 deterministic replay helper 可作为 adapter contract 参考，但不复制 MiroFish 源码。 |
| `READER_RESPONSE_DIMENSIONS`, `ReaderResponse*`, `ReaderPersonaInput`（约 2000 以后） | mirofish-adapter（历史实现暂存） | Reader Reaction/Persona comparison 是 sidecar adapter 目标；结果只做 proposal/review input。 |
| `NOVEL_AUTOMATION_*` 类型与常量 | writing | author-approved bounded write policy；使用现有 SessionEventMap。 |

完整符号 inventory 已由当前文件导出声明逐项核对；上表按同一责任族列出全部公开类型族，迁移时必须逐符号删除旧消费者后再移动，不能保留隐式双归属。

### 当前依赖/许可证矩阵

版本取自 `packages/novel-project/package.json`、`pnpm-lock.yaml` 和已安装 rc.2 manifest；许可证字段为本地 package manifest 的只读值。

| 依赖族 | 精确版本 | 许可证/边界 | 迁移处理 |
|---|---|---|---|
| DSH rc.2（agent、api gateway/remotes、session/projection、storage/domain/json、tools、jobs、fs、workspace、skill、subagent、system-prompt、token-meter、typert） | 全部 `0.1.1-rc.2` | MIT；唯一运行时内核 | 保留为外部 DSH seam，不复制实现、不升版本。 |
| Cordis | `4.0.1` | MIT | 保留；Service 生命周期由 Cordis 管理。 |
| `@node-rs/jieba` | `2.0.2` | MIT | 仅 Memory 本地中文索引需要；迁移后由 Memory 直接声明。 |
| `diff` | `9.0.0` | BSD-3-Clause | Writing/Review 的 unified diff 能力；确认 NOTICE。 |
| `docx`、`fflate` | `9.7.1`、`0.8.3` | MIT | Writing 薄 IO capability；不拆 `novel-io` 直到生命周期证据成立。 |
| `minisearch`、`zod` | `7.2.0`、`4.4.3` | MIT | `minisearch` 归 Memory；schema 依赖按使用者保留。 |
| React/React DOM | `18.3.1` | MIT | 仅 `conversation.view` Client；不建立独立 UI runtime。 |
| DSH dev-only（agent-loop、jobs-local、spawn-in-process、tool-skill、typert-generator 等） | 全部 `0.1.1-rc.2` | MIT | 测试/build 使用；不进入产品 sidecar。 |
| MiroFish / camel-oasis / camel-ai / Zep / Graphiti | 见 [`mirofish-upstream-audit.md`](../docs/mirofish-upstream-audit.md) | MiroFish AGPL-3.0；其余各自上游许可 | 只能作为外部 AGPL sidecar，绝不加入 novel-agent lockfile 或 bundle。 |

任何新增第三方依赖都必须在迁移前补齐精确版本、许可证、资产授权、维护状态、Windows/DSH 支持、bundle 成本和隔离 Profile smoke；本次没有新增依赖。

### Tool、Remote、Skill、Client、测试

| 当前符号 | 归属 | 迁移顺序/说明 |
|---|---|---|
| `manage_novel_canon_lock`、`propose_novel_result_packet`、`propose_novel_import`（`src/index.ts:2606`, `3124`, `3257`） | canon；import capability 由 writing 消费 | Lock/Result Packet 先迁；import 在 Writing 迁移前不拆新包。 |
| `authorize_novel_automation`、`publish_novel_manuscript`（`2678`, `3740`） | writing | automation envelope 与 publish 只读取 accepted revision，继续走 stock approval。 |
| `retrieve_novel_context`、`rebuild_novel_index`（`2873`, `3952`） | memory | retrieval/query 和 DSH Jobs 派生索引。 |
| `simulate_novel_story_world`、`simulate_novel_reader_response`（`3445`, `3583`） | mirofish-adapter | 保留历史行为测试作为 adapter contract evidence；正式 adapter 改为 loopback sidecar 时不在本次实现。 |
| `@Remote('open')`, `current`, `reviewDraft`, `previewReview`, `review`, `rollback`, `projectNarrative`, `projectManuscripts`, `retrieve`, `projectCanon`, `projectRelationships`, `read`（`src/index.ts:5019-6029`） | canon 基础 Remote；方法内容按上表分流 | 先保留 namespace `novelProject`，迁移一个能力族后再删除无消费者 endpoint。 |
| Skills `novel-architect`, `novel-hook-payoff-planner`, `novel-world-character-setting` | planning | 只读 accepted state，输出 chapter/Canon Delta proposal。 |
| Skill `novel-prose-writer` | writing | 输出 unified diff/manuscript draft，不直接 Apply。 |
| Skills `novel-continuity-checker`, `novel-writing-memory-organizer` | memory | 输出 Anchor/控制包/连续性 Issue。 |
| Skill `novel-reviewer` | review | 只提 Issue/diff，不自动拒绝或 Apply。 |
| Skill `novel-researcher` | review（研究输入） | 使用上游浏览器/搜索/File seam；事实与推论必须标注，不建立检索 Store。 |
| `NovelProjectPanelActions`、`NovelProjectPanel` | canon UI shell + read-only projections | 迁移期间保持 `conversation.view`；不建新 Sidebar/TUI/route。 |
| `novel-project.spec.ts` | canon + review + writing | Project/Revision/Result Packet/lock/approval/review/subagent 用例；按 describe/it 标题拆分。 |
| `novel-project-narrative.spec.ts` | planning + memory | hierarchy、十类 clocks、chapter control pack、rollback projection。 |
| `novel-project-result-packet-remote.integration.spec.ts` | canon/planning/writing/memory/mirofish-adapter | 这是跨 seam 的历史集成证据；迁移时按测试标题重分类，禁止删除断言换绿。 |
| `novel-project-client.spec.ts` | canon UI/Remote | `conversation.view`/Remote mount 回归。 |
| `product-boundary.spec.ts` | retired-generic guard + canon boundary | 保留 generic 路线不存在、外部社区插件下载项和单插件 patch 断言。 |

## DSH rc.2 seam 只读结论

证据来自已解析的 `node_modules/@deepseek-ai/*@0.1.1-rc.2`（产品 `package.json` 与 `pnpm-lock.yaml` 也锁定 rc.2）及只读上游源码/README。相邻 DSH checkout 当前 `git describe` 为 rc.1，不能冒充 rc.2 运行证据；因此本节以产品实际 rc.2 包的 declarations/lib 和上游契约说明为准。

| seam | rc.2 证据 | 迁移结论 |
|---|---|---|
| Cordis Service 注入 | `NovelProjectService` 的 `static inject` 和 `super(ctx, 'novelProject')`（`src/index.ts:2246-2265`）；Cordis `ctx.inject` 在 `2267-2287` 注册 Skills | 可行。扩展插件依赖 `ctx.inject(['novelProject'])`/typed Context，不直接 import 实现类。 |
| SessionEventMap | `node_modules/@deepseek-ai/dsh-session/README.md:73` 说明声明合并；`lib/types/index.d.ts` 的 `SessionEventMap` 和 `Session.append` 可追加 JSON 事件 | 可行。跨插件只追加 `novel/canon/accepted`、`novel/canon/rolled-back` 等明确事件；不要新建 bus。 |
| Typert Remote | `node_modules/@deepseek-ai/dsh-typert-protocol/lib/types/index.d.ts:64-93` 只有 `TypertRemoteService`、`Remote`、`RemoteScope`、`bindTypertRemote`；`node_modules/@deepseek-ai/dsh-api-gateway/README.md:5,9` 说明生成 descriptor/registry/contribution | 现有静态 Remote 可行；未发现 `registerExtension`。动态添加 endpoint 的产品 Service API 不成立。 |
| `registerExtension` | `rg -n "registerExtension" node_modules/@deepseek-ai` 与 rc.2 产品依赖源码无命中；Typert registry 的 `register(contribution)` 是 descriptor contribution，不是 Canon Delta extension registration | **RED/blocked seam**。采用 namespace-keyed generic Delta：Canon 只验证 `{namespace, kind, targetId, field, value, sourceAnchors}`，扩展 projector 在自己的 Service 里消费 accepted revision。不得臆造动态 Service API。 |
| SkillRegistry | `node_modules/@deepseek-ai/dsh-skill/lib/types/index.d.ts:227-259` `SkillRegistry.register(skill): disposer`；当前 `src/index.ts:2278-2287` 已使用 `ctx.inject(['skills'])` | 可行。Skill 按目标插件迁移，沿用 scope/disposer；不建 Preset/Agent Loop。 |
| `conversation.view` | `node_modules/@deepseek-ai/dsh-client-ui-conversation/README.md:13` 说明 view ring 是 session-scoped slot，插件通过 `ctx.slots.register` 加 tab；当前 `src/client/index.ts` 已做 `id: 'novel-project'` | 可行。所有小说视图只能在该 slot ring 中注册；Better Sidebar/TUI 继续外部。 |
| Subagent | 当前 `static inject` 包含 `subagents`，`reviewDraft` 使用 `this.ctx.subagents.start('spawn', ...)`（`src/index.ts:5152-5169`）；rc.2 `dsh-subagent` 提供 owner/session-backed run | 可行。Review/Simulation 继续使用 stock spawn；不新建队列或 child wrapper。 |
| Jobs | `node_modules/@deepseek-ai/dsh-jobs/lib/types/index.d.ts:45-...` 的 `JobRegistry.start/list/get/read/kill/wait` contract；当前 `rebuild_novel_index` 通过 `this.ctx.get('jobs')`（`src/index.ts:5568-5602`） | 可行。索引是 owner-relative DSH Job；没有 novel queue。 |
| fs/sandbox/workspace | `node_modules/@deepseek-ai/dsh-fs/lib/types/index.d.ts:61-...` 的 `FileSystem` provider；当前 import/publish 通过 `ctx.fs`、`sandboxPolicy`，Workspace 通过 `workspaceRegistry` 解析 cwd（`src/index.ts:3341-3367`, `6033-6066`） | 可行。导入/导出留在 Writing 薄 capability，使用 DSH fs/workspace/approval；不新建文件 Store。 |

### 必须锁定的 generic Delta 形状

由于 rc.2 没有 `registerExtension`，下一阶段只能先写 RED 再实现最小通用路径：

```ts
type NovelGenericDelta = {
  namespace: string
  kind: string
  targetId: string
  field: string
  operation: 'set' | 'remove'
  value?: JsonValue
  sourceAnchorIds: readonly string[]
}
```

Canon 不解释 namespace 语义；扩展在 `ctx.inject(['novelProject'])` 后读取 accepted revision，自己的 projector/摘要/Remote 仍在自身插件。该方案不改变 SessionEventMap，也不产生第二事件系统。

### 2026-09-15 更正：`registerExtension` 已解除阻塞

上面的 seam 结论（表格中 `registerExtension` 行）与本节的 generic Delta 方案是**基于 2026-09-05 只读搜索的当时结论，已被 M1 证据取代**。保留原文作为历史记录，但**不要**再据此实现通用的 namespace-keyed Delta：

- 不变的部分：DSH 自身确实没有动态 endpoint 注册 API，Typert protocol 只有静态 `@Remote`/`RemoteScope` 与 generated registry contribution。
- 更正的部分：Canon 扩展不由 DSH 提供，而由本项目自己的 seam 承担。`NovelProjectService.registerExtension(extension)` 与 `registerProjector(namespace, projector)` 经 Cordis `ctx.inject(['novelProject'])` 回调注册，wire 形状为 `kind: 'extension'` + `namespace` + `valueSchema`（`ExtensionCanonDelta`），不使用本节设想的 `NovelGenericDelta` 名称。
- 证据与位置：[M1 checkpoint](../docs/canon-extension-m1-2026-09-08.md)；`packages/novel-project/src/index.ts:1105`（`registerExtension`）、`1104-1114`（`registerProjector`）、`packages/novel-project/src/types.ts:292`（`ExtensionCanonDelta`）。真实 Host 已通过接受/回滚冷恢复。

因此 `tasks/plan-final.md` D-002「Canon 扩展契约」中的条件分支与 `docs/goal-prompts-final.md` 的对应条款均已满足，不再是未决项。

## 历史行为矩阵与证据等级

| 行为族 | 当前代码/测试 | 历史状态 | 目标 | 当前证据限制 |
|---|---|---|---|---|
| Project open/current、revision 0、accepted revision、rollback、lock | `NovelProjectService`, `novel-project.spec.ts`, remote integration | implemented-unverified（工作树未 tracked） | canon | 有大量 in-process 测试；尚未在本审计中重跑 fresh Profile。 |
| Result Packet preview/review/apply、Anchor、partial decision | `result-packet-schema.ts`, `src/index.ts:3124-3256`, tests | implemented-unverified | canon + review | 依赖现有 stock approval；不等于新插件边界已验证。 |
| hierarchy、chapter contract、十类 clocks、promise/foreshadow | `types.ts`, narrative tests | implemented-unverified | planning | 目前与 Canon/Memory 混在一个文件，待逐族迁移。 |
| manuscript/style/write automation/publish | `src/index.ts:2678`, `3740`, automation types | implemented-unverified | writing | Session event 仅是 bounded policy，不是第二 workflow。 |
| revision-bound retrieval、Chinese index、control pack、Jobs | `src/index.ts:2873`, `3952`, `7522-8917` | implemented-unverified | memory | index 可重建；需保留 R2/R3 isolation RED。 |
| continuity/review draft | `reviewDraft`, reviewer/continuity Skills, tests | implemented-unverified | review + memory | subagent 结构化输出和 source Anchor 约束已有测试。 |
| local story-world deterministic replay/branches/reader synthetic runs | simulation Tools/types/tests | implemented-unverified | mirofish-adapter history only | 这是本地 synthetic implementation，不是 MiroFish branch/replay/world-state 证据。 |
| import/export TXT/Markdown/EPUB/DOCX | `propose_novel_import`, `publish_novel_manuscript`, integration tests | implemented-unverified | writing thin capability | 依赖 DSH fs/workspace; 不拆 IO 直到真实生命周期证据。 |
| `conversation.view` review/projection panel | `src/client/index.ts`, `NovelProjectPanel.tsx`, client tests | implemented-unverified | canon shared view | 不能被误标成 Sidebar/TUI product surface。 |
| generic Electron/Profile/Terminal/Sidebar/TUI/Transport | 旧计划/架构历史；当前 checkout 无这些 package（product-boundary tests guard absence） | retired | retired-generic | 不恢复、不迁移、不为旧测试补回。 |

## 删除清单与保留清单

### 明确删除/退役（尚未执行）

- 旧 local Electron/Forge bootstrap、`novel-agent://`、preload/IPC carrier、零端口断言；
- 聚合 Profile/Bundle wrapper、Profile manager、安装器、更新器、通用 operator terminal；
- 私有 Workbench/layout/editor、Better Sidebar Canon summary tab、Pi TUI Canon footer/status-only extension；
- 第二套 Agent/Session/Workspace/Event/Approval/Storage/Workflow/Remote/Gateway/Transport、消息总线、memory Store；
- 仅由上述 generic 路线消费的依赖、lockfile row、测试和构建入口（在迁移对应 focused tests 后才删除）。

依据：[`docs/architecture.md`](../docs/architecture.md) “Retired implementations”、[`tasks/plan-final.md`](plan-final.md:52,124,310) 和 [`README.md`](../README.md:1-18)。

### 保留

- `@novel-agent/novel-project` self-mount 与包名、`novel_project` domain、Result Packet/Revision/lock/rollback/approval；
- DSH rc.2 的 Service、SessionEventMap、Typert、SkillRegistry、Subagent、Jobs、fs/workspace、`conversation.view`；
- Canon 必要 UI 壳和 generated Typert artifacts；
- Planning/Writing/Memory/Review 的符号与行为测试，按能力族迁移而不复制旧 generic surface；
- MiroFish 作为外部 AGPL sidecar；novel-agent 未来只拥有 loopback `novel-mirofish` adapter contract。

## 可执行迁移顺序、回滚与第一批 RED

1. **H-001 快照/基线**：冻结本审计和 MiroFish 状态证据；不要改任何产品源文件。回滚：删除本次新增文档即可，不触碰既有 untracked 树。
2. **H-002 Canon seam RED**：测试 `ctx.inject(['novelProject'])` 可读；测试不存在动态 `registerExtension` 时 generic Delta 能保存/读取 namespace；测试 accepted event 载荷只含 project/revision/deltaRefs/sourceSessionId。失败时停止，不写实现。
3. **H-003 Canon 边界**：先移动 Project/Revision/Result Packet/lock/rollback 的 focused tests，再在绿灯下删除核心中无消费者的 narrative/simulation 分支。回滚点是保留当前单插件文件和 generated artifact 的分支/备份。
4. **H-004 Planning**：迁移 project brief/roadmap/chapter contract/promise/foreshadow/architect/hook/world；RED 覆盖 accepted revision 绑定、未来 revision 不泄漏、章合同 delta namespace。
5. **H-005 Writing**：迁移 manuscript/style/write automation/publish；RED 覆盖失败不推进 Canon、作者拒绝正文但接受设定、publish 只读 accepted revision。
6. **H-006 Memory**：迁移 retrieval/control pack/index Job/continuity；RED 覆盖 R2 查询不得读 R3、索引失效/重建由 DSH Job 保存、所有 hit 带 source revision/Anchor。
7. **H-007 Review**：迁移 reviewer/Issue/diff；RED 覆盖 quote 必须命中 accepted text、Review 不自动 Apply、只接受 Issue 不改变 manuscript projection。
8. **H-008 MiroFish adapter（未来）**：仅在前述边界稳定后新建 adapter；首批 RED 是 sourceRevision/input hash 固定、sidecar 停止原始失败、无来源片段不得生成 Apply-able proposal、Canon hash 不变。Plot Counterfactual 继续 blocked。

每步只允许 1–5 个文件增量，跑受影响 package test/typecheck/lint/build；跨 Host 只用全新隔离 DSH_HOME/Profile。任何失败都回滚到上一个文档化 checkpoint，不恢复 retired generic route。

## 本次验证与停止

本审计阶段只读检查了状态、diff、路径和上游源码；没有修改 MiroFish、用户 `.dsh`、graphify-out、产品源代码、依赖或 lockfile。三份交付文档完成后立即停止，不进入任何正式小说功能实现。
