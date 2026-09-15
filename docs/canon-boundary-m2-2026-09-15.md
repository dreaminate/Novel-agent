# M2 Canon 边界定型 — 执行记录 2026-09-15

**性质：** M2 进行中的逐增量记录（W1 起），最终收口在本文件追加。
**授权：** 用户 2026-09-15 确认 M2 计划（Canon Slot + 降级；wire/schema 机制 + Planning 先行；真实模型/GUI 独立验收）。
**回滚点：** `.novel-agent/checkpoints/2026-09-15-m2-canon-boundary/`（本工作开始前）。

---

## W1 — Core-only 可读缺插件错误与面板降级

### 范围

1. Core-only 装配下 Canon 全链路（open/propose/preview/accept/rollback/lock）可运行且被 focused 测试保护。
2. 缺领域插件时 Canon 给出可读的 `NovelProjectDomainUnavailableError`，不再抛裸 `TypeError`。
3. `conversation.view` 面板在领域投影缺失时保留 Canon 区块并显示既有 "unavailable" 文案，不再整体报错。

### 错误契约

新增导出 `NovelProjectDomainUnavailableError`（`packages/novel-project/src/index.ts`）：

| 字段 | 值 |
| --- | --- |
| `code` | `domain-unavailable` |
| `capability` | `'projector' \| 'extension' \| 'domain-service'` |
| `requirement` | 缺失的 namespace 或 Cordis service key（如 `planning/narrative`、`novelMemory`） |
| `message` | 含 namespace/服务名与所属包名（服务类）的可读说明 |

替换的裸 `!` 站点：

| 位置 | 原行为 | 现行为 |
| --- | --- | --- |
| `readProjection`（`index.ts:1125`） | `projectors.get(ns)!.project(...)` | `requireProjector(ns)` |
| `projectDomain`（`index.ts:1129`） | 同上 | `requireProjector(ns)` |
| `validateExtensions`（`index.ts:1141`） | `extensions.get(ns)!` 解构 TypeError | `requireExtension(ns)` |
| `remoteReviewDraft`（`index.ts:2643`） | `ctx.get('novelReview')!.reviewDraft` | `requireNovelReview()`，先于 Session 查找 |
| `remoteRetrieve`（`index.ts:3081`） | `ctx.get('novelMemory')!.retrieve` | `requireNovelMemoryRead()` |

保留：`ctx.typert.lookups.get('agent')!`（DSH 内建）、`previewReview`/`readRevisionImpact` 的 `projectors.has(...)` 降级预览、`requireProjects().get(...)!`（Canon 工作区前置条件，非领域插件）。

### 面板降级

`packages/novel-project/src/client/NovelProjectPanel.tsx`：

- `loadSnapshot`：`projectNarrative` / `projectRelationships` 失败时对应区块置 `null`（既有 "Narrative unavailable" / "Relationships unavailable" 渲染），不再使整个快照失败。`openProject`、`readRevision`、`projectCanon`、`projectManuscripts` 仍为致命错误。
- writing-memory 重建 effect：`retrieve` 返回 `ok:false` 或 Promise 拒绝时静默跳过（区块保持未重建），不再产生 unhandled rejection。

### RED → GREEN

| 时间 | 行为 | 结果 |
| --- | --- | --- |
| 13:28:18 | `node_modules/vitest/vitest.mjs run packages/novel-project/tests/novel-project.spec.ts` | RED：新行为测试在 `projectNarrative` 处得到 `TypeError: Cannot read properties of undefined (reading 'project')`；链测试因 fixture 缺 approval stub 而失败（测试夹具缺口，非产品缺口） |
| 13:28:54 | 补 approval stub 后单跑链测试 | GREEN：Core-only open/propose/preview/accept/rollback/lock 全链路通过 |
| 13:29:46 | 实现错误类与守卫后跑单文件 | GREEN：56/56 |
| 13:32:23 | `novel-project-client.spec.ts` 新降级用例 | RED：`role="alert"` 显示 planner 缺插件错误、Canon 未渲染 |
| 13:33:11 | 临时回退 writing-memory 修复单跑 | RED：Vitest 捕获 unhandled rejection `novel project requires @novel-agent/novel-memory` |
| 13:33:21 | 恢复修复后跑客户端文件 | GREEN：43/43 |
| 13:33:29 | 全套门禁 | GREEN：5 文件 / 273 通过；`tsc -b`、`oxlint`、五包 build 全部通过 |

新增测试：

- `novel-project.spec.ts`：`runs the complete Canon chain in a Core-only assembly`；`names the missing domain capability instead of throwing a bare TypeError`。
- `novel-project-client.spec.ts`：`keeps the Canon panel available when a domain projection is not installed`；`ignores a failed writing-memory rehydration instead of failing the panel`。

### 证据边界

- 本轮未做隔离 Profile 验证（按 M2 计划集中在 W5 的 Core-only/组合 Profile 验收）。
- 面板对领域投影失败一律降级为 `null`，未区分 `domain-unavailable` 与其它传输错误；错误码区分留待 wire/schema 机制（W4）落地后再评估。
- `remoteReviewDraft` 现在先检查 Review 插件，再解析 Session；缺插件时不再返回 Session 查找错误。

---

## W3 — Typert 制品不变式

### 范围

- 生成物由 `packages/novel-project/build/generate-typert.ts` 在包 build 时重写；测试直接 import `@novel-agent/novel-project/typert` 与 `/remote` 读取真实制品。
- 新增断言（`tests/product-boundary.spec.ts`）：12 个 invocation 的 `service === namespace === 'novelProject'`、`id === '#namespace/method'`；host `invocations` 与 remote `descriptors` 的 id/service/namespace/method/参数 `wire`/结果 `typeSymbol` 逐一相等。

### RED → GREEN

| 时间 | 行为 | 结果 |
| --- | --- | --- |
| 13:35:06 | 首次运行新测试 | GREEN（守卫型；此前无任何断言覆盖该不变式） |
| 13:35:23 | 受控 RED：临时把 `lib/typert.host.js` 首个 `namespace: 'novelProject'` 改为 `'novelProjectDrifted'` | 失败于 `expect(invocation.namespace).toBe(invocation.service)` |
| 13:35:28 | 从字节备份恢复生成物 | GREEN：7/7 |
| 13:35:35 | 全套门禁 | GREEN：5 文件 / 274 通过；typecheck/lint/build 通过 |

### 证据边界

- 该测试读取已构建的 `lib/` 制品；包测试前必须已运行 `pnpm build`（仓库既有前提，集成测试同样依赖生成物）。
- 受控 RED 是对生成物的临时改写，未改产品源码；恢复后与构建输出一致。

---

## W4a — 领域 Delta kind 注册机制与 `world` 首个迁移

### 机制

- 新增公共 seam `NovelCanonDeltaKind`（`packages/novel-project/src/types.ts`）：

  ```ts
  interface NovelCanonDeltaKind {
    readonly kind: string
    validate(delta: {
      readonly operation: 'set' | 'remove'
      readonly field: string
      readonly value: unknown
    }): void
  }
  ```

- `NovelProjectService.registerDeltaKind(kind)` 返回 disposer，由所属插件的 `ctx.effect` 管理生命周期。
- Core 新增 `DOMAIN_OWNED_DELTA_KINDS`（`result-packet-schema.ts`）；已迁移 kind 的 Core 分支只保留 envelope（`kind`/`operation`/`field`/JSON `value`），值语义由注册插件承担。
- `validateDeltas`（原 `validateExtensions`）在 `parseDraft`、`previewReview`、`review` 三处执行：extension 走原 namespace 注册；已迁移 kind 无注册时抛 `NovelProjectDomainUnavailableError`（`capability: 'delta-kind'`）；仍由 Core 内联校验的 kind 保持原样跳过。
- `NovelProjectDomainUnavailableError.capability` 增加 `'delta-kind'`。

### 首个迁移：`world`

- Core 删除内联 `worldRuleValueSchema`，`world` 加入 `DOMAIN_OWNED_DELTA_KINDS`，set/remove 分支的 `field` 放宽为通用字符串。
- `packages/novel-planning/src/schema.ts` 接收世界规则 schema，`novelWorldDeltaKind.validate` 强制 `field === 'rule'`、remove 必须 `null`、set 走严格值 schema。
- `NovelPlanningService` 构造时 `ctx.effect(() => ctx.novelProject.registerDeltaKind(novelWorldDeltaKind))`；`novel-planning` 增加 `zod@4.4.3`（工作区既有解析版本，lockfile 无新版本）。

### RED → GREEN

| 时间 | 行为 | 结果 |
| --- | --- | --- |
| 13:37:58 | 新测试 `delegates a migrated domain Delta kind to its owning plugin schema` | RED：Core-only 仍按内联 schema 接受了 `world` Delta，未出现 domain-unavailable |
| 13:39:47 | Core 侧 envelope + 注册 + Planning 注册后单跑 | GREEN：Core-only 报 `delta-kind/world`，挂载 Planning 后有效值解析、`hiddenTruth: ''` 抛 ZodError，卸载 Planning 后恢复 domain-unavailable |
| 13:41:10 | 泛化 seam：`valueSchema` → `validate({operation, field, value})`（为字段条件 kind 做准备） | GREEN：测试保持通过 |
| 13:42:29 | 全套门禁 | GREEN：5 文件 / 275 通过；typecheck/lint/build 通过 |

### 仍由 Core 内联校验的 kind（W4b 待迁）

`promise`、`clue`、`mystery`、`roadmap`、`ending`、`character-state`、`creative-profile`、`reader-contract`、`relationship`、`knowledge`、`narrative-unit`、`narrative-clock`、`narrative-debt` 以及 Memory/Writing 域 kind（`faction-state`/`location-state`/`object-state`/`emotion-state`/`chapter-state`）仍留在 `result-packet-schema.ts`；迁移时必须同步把这些 kind 加入 `DOMAIN_OWNED_DELTA_KINDS` 并移除对应内联分支，且不得弱化现有断言。

---

## W4b — 其余 Planning kind 迁出 Core

### 迁移范围

`DOMAIN_OWNED_DELTA_KINDS`（12 个）：`world`、`mystery`、`clue`、`promise`、`roadmap`、`ending`、`character-state`、`creative-profile`、`reader-contract`、`relationship`、`narrative-unit`、`narrative-clock`。

- Core 删除的领域 schema（约 456 行）：`mystery`、`clue`、`promise`（beat/state）、`roadmap`、`ending`、`character-arc`、`creative-style`、`creative-serialization`、`reader-contract`、`relationship-line-state`。
- 随后整体搬出叙事结构（471 行）：`chapterContract`、`narrativeUnit`、`plotProgression`、`world/promise/character/relationship/progression/reader-knowledge/mystery/tension-payoff/ending` clock 值 schema 及 `tensionLevel`。
- Planning 侧 `packages/novel-planning/src/schema.ts` 现为领域契约的唯一实现（约 33 KB）：值 schema + `validate(delta)`（字段/操作/值） + `narrativeClockValidate`（clock 名、`scope.unitId === targetId`、除 `tension-payoff` 外要求至少一个 source anchor）。`novelDomainDeltaKinds` 一次注册 12 个 kind，随插件生命周期撤回。
- Core 侧 `narrative-unit` / `narrative-clock` 分支改为通用 envelope；`narrative-clock` remove 的 `field` 由 `z.enum(NARRATIVE_CLOCKS)` 放宽为通用字符串（由插件校验）。

### 类型边界

`canonDeltaSchema` 的运行时 union 现在只保证 envelope；`CanonDelta` 等 TS 类型仍描述**有效** wire 形状（投影与投影消费者继续获得严格类型）。实现方式：

```ts
const canonDeltaEnvelopeSchema = z.union([...])
export const canonDeltaSchema: z.ZodType<CanonDelta> =
  canonDeltaEnvelopeSchema as unknown as z.ZodType<CanonDelta>
```

即类型层不随运行时的 envelope 放宽而丢失精度；值语义在 `parseDraft` / `previewReview` / `review` 由注册插件校验。

### RED → GREEN

| 时间 | 行为 | 结果 |
| --- | --- | --- |
| 16:52 | 迁移 fact kinds 后跑全套 | RED：4 个 Core-only 光测试以 `novel project has no '<kind>' delta schema registered` 失败（`creative-profile`×2、`relationship`、`character-state`） |
| 17:01 | 为这 4 个测试显式挂载 `NovelPlanning`（保留原断言） | GREEN：单文件 57/57 |
| 17:02 | fact kinds 全套 | GREEN：275/275；typecheck/lint/build 通过 |
| 17:07 | narrative-unit / narrative-clock 迁移后全套 | GREEN：275/275；typecheck/lint/build 通过 |

既有的无效值拒绝断言（`aftermath`、`payoff`、`abandonmentReason`、`moveId`、clock `scope`/`sourceAnchorIds` 等）现在全部经注册插件执行；Core 不再内联这些语义。

### 仍由 Core 内联校验的 kind（后续里程碑）

`knowledge`、`faction-state`、`location-state`、`object-state`、`emotion-state`、`chapter-state`（post-check）、`narrative-debt` 以及 generic `canon/story-event/progression/timeline`；前三类之外的 Memory kind 在 M5 迁移，`chapter-state`/`narrative-debt` 按 audit 归属 Memory，`knowledge` 归属待定。

---

## W5 — 隔离 Profile 验收与 M2 收口

### Core-only 隔离 Host

环境：`.novel-agent/acceptance/m2-canon-boundary-20260915/`；官方 rc.1 CLI（`session-recovery-20260909/runtime`，已应用带共享注册表的 Session 补丁），全新 `core-home` Profile 只安装 `@novel-agent/novel-project`（profile 的 `dsh-session` 同样应用补丁），工作区为 `core-workspace`。

`evidence/run-core-only.mjs` 经真实 gateway 依次调用：

| 调用 | 结果 |
| --- | --- |
| `workspace/create` / `session/create` | ok（workspace `432350fb…`） |
| `novelProject/open` / `current` / `read`(R0) | ok：R0 工程可打开与读取 |
| `novelProject/previewReview` | ok：`projectedRevision: 1`（通用 story-event proposal） |
| `novelProject/review` | ok：作者授权接受，R1 |
| `novelProject/rollback` | ok：R2 且 `rollbackOfRevision: 1` |
| `novelProject/projectCanon`(R2) | ok：R1 来源 fact 可追溯 |
| `novelProject/projectNarrative` | ok=false，可读错误 `novel project has no 'planning/narrative' projector registered; install the domain plugin that registers it` |
| `novelProject/retrieve` | ok=false，可读错误 `novel project requires @novel-agent/novel-memory (Cordis service "novelMemory")` |

Host 停止后端口 `60543` 释放（`evidence/stop.json`、`evidence/core-only.json`、`evidence/host.log`）。`manage_novel_canon_lock` 只经 Tool 暴露，未纳入 RPC 探针，由本地 Core-only focused 测试覆盖。

### 组合 Profile wire 校验

环境：复用 `writing-automation-close-20260915/dsh-home`（五个产品插件 + 脚本化 probe）。`evidence/run-composed.mjs`：

- `projectNarrative`（十类 clock 空投影）、`projectRelationships`、`retrieve` 均 ok，证明 Planning/Memory 服务在真实 Host 生效；
- `previewReview` 携带合法 `world` 规则 Delta：ok，`projectedRevision: 1`；
- 同一个 Delta 缺少 `hiddenTruth`：ok=false，错误 message 为插件 ZodError（path `packet.deltas.0.value.hiddenTruth`）；
- 之后 `current` 仍为 R0，预览不推进 Canon。

Host 停止后端口 `51129` 释放（`evidence/composed.json`、`evidence/composed-stop.json`）。

### M2 四项处置

| `history-migration-todo.md` M2 项 | 处置 |
| --- | --- |
| domainSpec/Project/Revision/Result Packet/lock/rollback/approval + tests | 勾选：定型为 Canon 公共面（W1 Core-only 链 + 可读错误、W3 Typert 不变式、W5 隔离验收），不迁出 |
| Typert 重生成与 namespace 一致 | 勾选：W3 |
| 删除无消费者的 narrative/simulation/retrieval 分支 | 未执行并注明：simulation 属 M6 暂存；legacy Remote 待 M3+ 六 Slot 消费者迁移；清单与前置条件见本记录 |
| Canon 不解释人物/时钟/读者反应/MiroFish | 勾选：Planning 12 kind 已由插件拥有；Memory/Writing 域 kind 按 M4/M5 迁移并已列明 staging |

### 限制

- 本轮仍无真实 DeepSeek、GUI 点击或外部模型质量验收；Host 验收使用通用 story-event 与 synthetic world 规则。
- 组合 Home 的 Canon/写作状态来自 automation 验收夹具，不是真实小说成果。
- 六个领域 Slot、legacy Remote 删除、Memory/Writing 值 schema 迁移仍属 M3–M6。
- 无 Git 提交；回滚点 `.novel-agent/checkpoints/2026-09-15-m2-w5-acceptance/`（验收前）与 `2026-09-15-m2-w4b-planning-schema/`。
