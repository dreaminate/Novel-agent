# 前端 Phase 2 Polish 交付单（给 deepseek flash 执行） — 2026-09-19

> **本文档是什么：** 站艺 2026-09-19 判定 Phase 1（修不可用，`tasks/frontend-rewrite-handoff-2026-09-18.md`）的 framing 没错，但 11 个增量做完只算"修好不可用"，离"舒服优雅"还差很远。现在要 Phase 2（polish 而非 fix）。本文档基于 2026-09-19 grill 会话的 shared understanding 写出。
>
> **执行前提（不可妥协）：** 遵守 [`AGENTS.md`](../AGENTS.md) 与 Phase 1 handoff 的全部硬约束；**Phase 1 尾巴必须先在 A1/A3 下全绿**（见 §3 前置），才进 Phase 2。
>
> **约束松开（仅 Phase 2，显式授权）：** 站艺 2026-09-19 确认 Y——视觉 CSS 维度松开 AGENTS.md "前端与交互能力优先复用开源实现"规则；**功能性组件**（图谱渲染、虚拟列表、命令面板、对话框原语等）仍走开源门禁。理由：标杆产品 Obsidian/iA Writer/Things 3/Linear/macOS/Heptabase 全是闭源商业产品，视觉 CSS 按定义没有"开源等价物"可复用。

---

## 0. 先承认两件事

**第一，Phase 1 与 Phase 2 的标准不同。** Phase 1 的 A1-A6 是"作者能用"——崩溃隔离、全中文、新手闭环、线程可用、数据卫生、回归不破。Phase 2 的 A7-A12 是"作者愿意用、持续用、推荐给同行"——标杆产品对标、视觉协调、长期舒适。**Phase 1 测的是"是否能让作者完成一次写作"，Phase 2 测的是"作者打开 5 分钟觉得认真、30 分钟愿意推荐"。**

**第二，Phase 2 不是从零做。** Phase 1 已落地的 20+ commit（章节文件、去 Canon 术语、线程折叠、可拖拽栏宽、composer chrome、续写流程、持久化）是 Phase 2 的地基。Phase 2 在这些之上做视觉与交互的标杆化重构，不重写功能。

---

## 1. 标杆产品清单（每维度一个，含闭源/开源属性与落地路径）

| 维度 | 标杆 | 闭源/开源 | 视觉 CSS 路径 | 功能性组件路径 |
| --- | --- | --- | --- | --- |
| 图谱 | Obsidian graph view | 闭源 | bespoke CSS（紫色 accent、节点光晕、hover 高亮连通子图） | sigma + d3-force 或 graphology + forceatlas2（均开源，I-P1 加回） |
| 编辑器 | iA Writer | 闭源 | bespoke CSS（思源宋体 + iA Writer Mono/Duo 等价、行距 1.6-1.8、零 chrome） | 复用已有 @tiptap/react + starter-kit（开源 MIT），仅调扩展与主题 |
| 左栏 rail | Things 3 | 闭源 | bespoke CSS（Mac 原生密度、分组标题、章节行高与 Things 3 测量一致） | 复用已有 react + 自写 rail，CSS 重写 |
| 对话框 | shadcn/ui | 开源 | 复用 shadcn/ui 主题（中性现代） | 引入 shadcn/ui（I-P4 评估 bundle 体积） |
| topbar | Linear | 闭源 | bespoke CSS（单行、次要色状态、零冗余） | 复用已有 NovelTopbar.tsx |
| settings | macOS System Settings | 闭源 | bespoke CSS（分组原生、二级面板） | 复用已有 NovelSettings.tsx |
| landing | Heptabase welcome | 闭源 | bespoke CSS（卡片导向、行动优先） | 复用已有 NovelLanding.tsx（Phase 1 I-X1 产物） |
| transcript | Linear thread | 闭源 | bespoke CSS（紧凑消息气泡、时间分组） | 复用已有 NovelTranscript.tsx |
| cast | Notion database card | 闭源 | bespoke CSS（一卡一人、字段对齐） | 复用已有 CastView.tsx |
| memory | Obsidian backlinks panel | 闭源 | bespoke CSS（反向时间线、锚点 chip） | 复用已有 MemoryView.tsx |
| advanced | VSCode settings.json | 开源 | bespoke CSS（裸 JSON、等宽字体） | 复用已有 AdvancedView.tsx 或裸 textarea |

**许可证备注：** iA Writer、Things 3、Linear、Heptabase、Notion、Obsidian、macOS 都是闭源商业产品——标杆仅供**视觉参数参照**（颜色、字体、间距、行高、动画曲线），不复制任何代码、设计资源或受版权保护的视觉资产。具体参数由走查探针实测标杆产品截图后写入 `docs/evidence/2026-09-19/benchmarks/`，作为 bespoke CSS 的输入。

---

## 2. 改造目标与可验收标准（A7-A12）

### 2.1 目标一句话

**一个第一次打开的中文作者，使用 5 分钟后觉得"这个工具看起来认真、不廉价、像 Mac 原生应用"；使用 30 分钟后愿意把它推荐给同行写网文的朋友。**

### 2.2 可验收标准（全部人类视角，可证伪，A1-A6 沿用 Phase 1）

- **A7 图谱 Obsidian 化**：力导向物理生效；节点尺寸按度数；按卷/弧可过滤；用户钉位刷新保持；40-120 节点不毛球。走查截图 vs Obsidian 同规模图谱对照，节点不重叠、可读、有 Obsidian 的"重力感"。
- **A8 编辑器 iA Writer 化**：默认无工具栏 chrome（仅 1 个模式切换）；中文字体方案对标 iA Writer（思源宋体或等价），英文对标 iA Writer Duo/Mono；正文行高 1.6-1.8；段落间距明显；走查截图 vs iA Writer 主编辑器对照。
- **A9 rail Things 3 化**：章节行高与 Things 3 sidebar 实测一致；卷/章/线索/线程按 Things 3 风格分组（分组标题字号一致、二级缩进、活动项高亮）；走查截图 vs Things 3 sidebar 对照。
- **A10 对话框 shadcn/ui 化**：所有 modal/popover 采用 shadcn/ui 组件（若引入评估通过）；边角、阴影、动画一致；走查截图对照 shadcn/ui 官方 demo。
- **A11 其余面 polish**：topbar、settings、landing、transcript、cast、memory、advanced 各有一张走查截图，与对应标杆视觉对照（颜色差 ≤ deltaE 3、字体一致、间距用 4/8/16/24 等格点）。
- **A12 整体协调**：所有可见面颜色/字体/间距/动画曲线一致；走查整页截图对照（亮色 + 暗色各一张）；color token 单一来源（workbench-css.ts 全局变量）。

---

## 3. 前置：Phase 1 尾巴必须先全绿（这是 Phase 2 的开关）

### 3.1 Phase 1 尾巴清单（按 Phase 1 handoff §3 序）

| # | 增量 | 状态 | 阻塞 |
| --- | --- | --- | --- |
| 1 | I-W1 画布错误边界 + 视图降级卡 | 工作区 12 modified + 3 untracked（`canvas-boundary.tsx`、`webgl-probe.ts`、`NovelCanvas.tsx` 修改、`novel-workbench-canvas-boundary.spec.ts`、`novel-workbench-canvas.spec.ts`） | A1 验收未走完 |
| 2 | I-W2 提交确认卡去工程术语 | commit `6ac90f3` "Say it in the author's language, not in Canon's" 已落地 | 已绿（A2 部分） |
| 3 | I-W3 composer 中文化 | commit `33879fb` "Answer the shipped conversation chrome in this product's own colours" 已落地 | 走查待复核 |
| 4 | I-W4 线程降噪 | commit `e009d92` "Put the navigation above the thread list, and fold what is long" 已落地 | 走查待复核 |
| 5 | I-W5 草稿清理 + 探针规约 | 未明示，需查 `docs/evidence/2026-09-18/walkthrough/` 草稿 sha256 | A5 待验证 |
| 6 | I-X1 落地引导卡 | 工作区 1 untracked（`NovelLanding.tsx`、`novel-workbench-landing.spec.ts`） | A3 验收未走完 |
| 7 | I-X2 头部瘦身 + 互斥 | commit `41d0869` "Put the chapters back beside the volume header, not inside it" 已落地 | 走查待复核 |

### 3.2 隐性回归（Phase 2 handoff 新发现，未在 Phase 1 handoff）

**R1 `novel-workbench-shell.spec.ts` 路径错误**：

- 测试基线：200 passed / 1 failed（2026-09-19 00:17 实测）
- 失败原因：`prototypePath` 解析为 `packages/novel-workbench/docs/prototypes/2026-09-16-novel-mode/novel-mode-workbench.html`，实际原型在仓库根 `docs/prototypes/2026-09-16-novel-mode/novel-mode-workbench.html`
- 修法：把 spec 里的相对路径改成相对仓库根（或加 `path.resolve(__dirname, '../../../docs/prototypes/...')`）
- **这是 Phase 1 的回归，不属于 Phase 2，但在 Phase 2 开工前必须修**

### 3.3 Phase 2 开工闸门

deepseek flash 取本文件 I-P1 开工前，必须满足：

1. `corepack pnpm --filter @novel-agent/novel-workbench test` 全绿（含 R1 修复）
2. `git status --short` 中 I-W1 + I-X1 的 untracked 文件已合并提交（按 Phase 1 handoff §4.2 的 TDD 门禁）
3. `docs/evidence/2026-09-18/walkthrough/` 走查探针复跑 A1 + A3，截图证明崩溃隔离 + 落地引导卡已落地
4. `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4780/` = 401 确认 host 在

若 1-3 任一不满足，**先在 Phase 1 标准下收尾，不要进 Phase 2**。

---

## 4. Phase 2 增量拆分（I-P1 → I-P6）

每个增量沿用 Phase 1 handoff §3 格式：**目标 / 涉及文件 / RED / GREEN / 真机验证 / 验收**。deepseek flash 每轮取**第一个未勾选项**。顺序即优先级：先图谱（撤销 2026-09-17 偏离），再编辑器（作者盯得最久），再 rail（每屏可见），再对话框（引入新依赖），再其余面，最后整体协调。

### Phase P — Phase 2 polish 增量

#### I-P1 力导向回归 + 图谱 Obsidian 化（A7）

- **目标**：撤销 2026-09-17 那次"删 forceAtlas2 改自写簇盘几何"的偏离；sigma + d3-force（或 graphology + forceatlas2 with 调好的参数），加节点尺寸按度数、按卷/弧过滤、钉位机制；视觉参数（紫色 accent、节点光晕、hover 高亮连通子图）对标 Obsidian graph view。
- **涉及文件**：`packages/novel-workbench/src/client/StoryMapView.tsx`（重写布局与交互）、`packages/novel-workbench/src/client/story-map-layout.ts`（退役为 fallback 或删除）、`packages/novel-workbench/package.json`（加回 `d3-force` 或 `graphology-layout-forceatlas2` + `graphology-layout`）、`packages/novel-workbench/src/client/workbench-css.ts`（图谱专属 CSS token）、`packages/novel-workbench/tests/novel-workbench-story-map.spec.ts`、`scripts/smoke-workbench.mjs`、`THIRD_PARTY_NOTICES.md`、`docs/upstream-sources.md`。
- **RED**：spec 断言：
  1. 40 节点布局后任意两节点最小距离 > N px（防毛球）
  2. 节点 visual size 与度数正相关（maxDeg 节点 = 2× minDeg 节点尺寸）
  3. 用户钉位后刷新钉位保持（已在 prefs，I-X5 落地）
  4. 按卷/弧过滤切换时只渲染子图（前置依赖：Canon `manuscriptOrder` 字段填充——见 frontend-stack-2026-09-16.md §5 补充，若该字段仍 null 则此条 spec skip 并在 PR 描述里标 blocked）
  5. hover 节点时连通子图高亮、非连通节点淡出（视觉断言用 DOM class 或 style 断言）
- **GREEN 要点**：
  1. 选 d3-force（轻、生态稳）或 graphology+forceatlas2（更熟、bundle 体积已知）——deepseek flash 二选一前先量 bundle 体积（参考 frontend-stack §5 对照表）。
  2. 物理参数对标 Obsidian：斥力缩放按节点数自适应、节点质量按度数、边权重按关系强度（如有）、停止模拟后保留位置。
  3. 视觉参数：从 Obsidian 实测截图取色（accent、节点底色、边色、hover 光晕），写入 `docs/evidence/2026-09-19/benchmarks/obsidian-graph.png` + 配套 JSON。
  4. 退役 `story-map-layout.ts`：若 d3-force 路径走通，该文件无消费者，删除；不要留死代码。
- **真机验证**：走查探针复跑图谱 step；附双截图（当前实现 vs Obsidian 同规模图谱对照）；40 节点 + 80 节点 + 120 节点各一张。
- **验收**：A7。

#### I-P2 编辑器 iA Writer 化（A8）

- **目标**：移除编辑器 chrome（默认无工具栏，仅 1 个模式切换）；字体方案对标 iA Writer；正文行高 1.6-1.8；段落间距明显；走查截图 vs iA Writer 主编辑器对照。
- **涉及文件**：`packages/novel-workbench/src/client/NovelEditor.tsx`（去 chrome）、`packages/novel-workbench/src/client/workbench-css.ts`（字体方案、行高、段落间距 token）、原型 `docs/prototypes/2026-09-16-novel-mode/novel-mode-workbench.html`（编辑器块重写）、`scripts/port-prototype-css.mjs`（重生成 CSS）、`packages/novel-workbench/tests/novel-workbench-editor.spec.ts`。
- **RED**：spec 断言：
  1. 编辑器顶部工具栏元素数 ≤ 1（仅模式切换）
  2. 正文区字体族断言含 "Source Han Serif" 或 "Noto Serif CJK" 或等价 CJK 宋体
  3. 正文行高 ∈ [1.6, 1.8]
  4. 段落 margin-bottom ≥ 1em
- **GREEN 要点**：
  1. 字体方案：中文用思源宋体（开源 SIL OFL，符合功能性组件开源门禁），英文用 iA Writer Duo/Mono 的开源等价（如 JetBrains Mono 或 IBM Plex Mono）——**不许**直接复制 iA Writer 付费字体。
  2. Tiptap 扩展精简：仅保留 paragraph、heading、emphasis、strong、blockquote、hardbreak；移除任何带工具栏的扩展。
  3. 原型 HTML 改编辑器块 → `port-prototype-css.mjs --check` 通过 → CSS 重生成。
  4. 视觉参数从 iA Writer 实测截图取（行高、段距、字号、字间距），写入 `docs/evidence/2026-09-19/benchmarks/ia-writer-editor.png` + JSON。
- **真机验证**：走查探针复跑编辑器 step；附双截图（当前 vs iA Writer 主编辑器对照）。
- **验收**：A8。

#### I-P3 rail Things 3 化（A9）

- **目标**：rail 分组密度对标 Things 3 sidebar；卷/章/线索/线程按 Things 3 风格分组；章节行高与 Things 3 实测一致；活动项高亮。
- **涉及文件**：`packages/novel-workbench/src/client/NovelRail.tsx`（分组结构 + 类名）、`packages/novel-workbench/src/client/workbench-css.ts`（rail token）、原型、`port-prototype-css.mjs`、`packages/novel-workbench/tests/novel-workbench-rail.spec.ts`。
- **RED**：spec 断言：
  1. rail 章节行高 = X px（X 从 Things 3 sidebar 实测截图取，写入 benchmarks JSON）
  2. 卷/章/线索/线程按 Things 3 风格分组（分组标题字号一致、二级缩进 = N px）
  3. 当前活动章节高亮（与 Things 3 selected item 配色对标）
- **GREEN 要点**：
  1. 分组标题字号、二级缩进、行高从 Things 3 实测截图取，写入 `docs/evidence/2026-09-19/benchmarks/things-3-sidebar.png` + JSON。
  2. 原型改 rail 块 → 重生成 CSS。
  3. 不破坏既有功能（线程折叠、章节切换）。
- **真机验证**：走查探针复跑 rail step；附双截图（当前 vs Things 3 sidebar 对照）。
- **验收**：A9。

#### I-P4 对话框 shadcn/ui 化（A10）

- **前置查证（RED 的一部分，查证本身就是本轮产物）**：
  1. shadcn/ui 是否能在不破坏 DSH client bundle 体积护栏（≤ 2,400,000 B raw）的前提下引入——实测加 shadcn/ui 后 `lib/client.js` 体积。
  2. shadcn/ui 与 DSH client-ui-renderer 是否冲突（同一 React tree 是否兼容）。
  3. 若体积或冲突任一不通过 → 停下问站艺（这构成规格冲突，§6 停止条件）。
- **涉及文件**：`packages/novel-workbench/package.json`（加 shadcn/ui 相关依赖）、所有含 modal/popover 的 *.tsx（统一改用 shadcn/ui 组件）、`THIRD_PARTY_NOTICES.md`、`docs/upstream-sources.md`、`docs/open-source-evaluations/shadcn-ui-2026-09-19.md`（新增选型记录）。
- **RED**：spec 断言：
  1. 所有 modal/popover 用同一组件库（断言 DOM class 前缀或组件来源）
  2. 视觉一致（边角半径、阴影、动画曲线同一 token）
- **GREEN 要点**：替换现有 dialog 实现；保留既有交互逻辑（focus trap、ESC 关闭、点击遮罩关闭）；shadcn/ui 主题 token 与 workbench-css.ts 全局 token 对齐。
- **真机验证**：走查探针对每个 modal 截图；与 shadcn/ui 官方 demo 对照。
- **验收**：A10。

#### I-P5 其余面 polish（A11）

按顺序：topbar → settings → landing → transcript → cast → memory → advanced。每面一个子增量（I-P5a → I-P5g）。

- **每面统一格式**：
  - 涉及文件：对应 *.tsx + workbench-css.ts + 原型 + port-prototype-css.mjs + spec
  - RED：spec 断言视觉参数（颜色差 ≤ deltaE 3、字体一致、间距用 4/8/16/24 等格点）
  - GREEN：bespoke CSS 重写；视觉参数从对应标杆实测截图取
  - 真机验证：走查探针截图 vs 标杆对照
  - 验收：A11 对应子项

- **各面子增量具体标杆**（见 §1 表）：
  - I-P5a topbar → Linear
  - I-P5b settings → macOS System Settings
  - I-P5c landing → Heptabase welcome
  - I-P5d transcript → Linear thread
  - I-P5e cast → Notion database card
  - I-P5f memory → Obsidian backlinks panel
  - I-P5g advanced → VSCode settings.json

#### I-P6 整体协调校验（A12）

- **目标**：所有可见面颜色/字体/间距/动画曲线一致；color token 单一来源；亮色 + 暗色双主题协调。
- **涉及文件**：`packages/novel-workbench/src/client/workbench-css.ts`（全局 token 收口）、各 *.tsx（清除局部 hardcode 颜色）。
- **RED**：spec 断言：
  1. 所有 *.tsx 不含 hardcode 颜色（grep 断言）
  2. 全局 color token 在 workbench-css.ts 单一来源
  3. 亮色 + 暗色双主题各有一张整页走查截图
- **GREEN 要点**：收口 token；清除局部 hardcode；走查整页对照。
- **真机验证**：整页走查（亮色 + 暗色各一张）；与任一标杆产品整页对照（颜色协调度、字体一致、间距格点）。
- **验收**：A12。

---

## 5. 给 deepseek flash 的执行规约

### 5.1 开工前固定动作（每轮）

1. `cd /Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent && git status --short`（读第一列）。
2. 读 `AGENTS.md` + `tasks/frontend-rewrite-handoff-2026-09-18.md`（Phase 1 handoff）+ `tasks/frontend-polish-handoff-2026-09-19.md`（本文件）+ `docs/open-source-evaluations/frontend-stack-2026-09-16.md`。
3. **验证 §3.3 Phase 2 开工闸门**：测试全绿（含 R1 修复）+ I-W1/I-X1 已合并 + 走查 A1/A3 落地 + host 在 401。**任一不满足先在 Phase 1 标准下收尾**。
4. 取本文件**第一个未勾选** Phase 2 增量（顺序 I-P1 → I-P2 → I-P3 → I-P4 → I-P5a..g → I-P6）。
5. `corepack pnpm test` 确认基线绿。

### 5.2 TDD 与门禁（每个增量）

RED（先测先跑存失败原因；首绿则定点破坏证明能咬人）→ GREEN（最小实现）→ REFACTOR → 门禁：

```bash
corepack pnpm test && corepack pnpm typecheck && corepack pnpm lint && git diff --check
scripts/dev-host.sh rebuild && node scripts/smoke-workbench.mjs   # 改了产品源码时
node scripts/port-prototype-css.mjs --check                        # 改了原型时
```

体积护栏：`lib/client.js` ≤ 2,400,000 B raw（I-P1 加 d3-force、I-P4 加 shadcn/ui 后必须复测）。

### 5.3 真机验证规约（比 Phase 1 严）

- **每个改可见面的增量，走查探针必须复跑对应 step 并附双截图**：当前实现 + 标杆产品对照。**双截图缺一不算验收**——Phase 1 的教训是"rendered ≠ 体验好"，Phase 2 进一步是"绿 ≠ 离标杆近"。
- **标杆产品截图来源**：deepseek flash 自己用沙箱内 Chrome（带 `--no-sandbox --disable-gpu --remote-allow-origins=*` 三个 flag，见 Phase 1 handoff §4.3）截 Obsidian/iA Writer/Things 3/Linear 等闭源产品的免费 demo 页或公开试用页。**不许**下载盗版、破解版或未经授权的字体/设计资源。
- **视觉参数取数**：从标杆截图取颜色（hex + deltaE）、行高、字号、间距、字体族；写入 `docs/evidence/2026-09-19/benchmarks/<product>-<surface>.png` + 配套 JSON。
- 探针规约：产生的草稿文件结尾删除并记录 sha256 before/after（沿用 Phase 1 §4.3）。
- 走查环境注意：沙箱内 Chrome 需三个 flag；`--disable-gpu` 会让地图走降级卡（I-W1 的验收环境），图谱 Obsidian 化验证需要**不带 `--disable-gpu`** 跑一次真机 WebGL。

### 5.4 停止条件（问站艺）

- 改 Canon 语义（沿用 Phase 1 D6）
- DSH 版本、`~/.dsh`
- shadcn/ui 引入若与 DSH seam 冲突（I-P4 查证出冲突）
- 体积护栏突破且无降级方案
- 需要 push/发布
- 标杆产品截图无法合法获取（如某产品无公开 demo）
- Phase 2 增量 Y 决策项（见 §7）

### 5.5 绝不做

- 为绿灯删/弱化测试
- mock 冒充完成
- 未验证称 verified
- 以"rendered"当验收（Phase 2 验收是 §2.2 的 A7-A12，必须双截图对照）
- **复制闭源商业产品的受版权保护资产**（字体文件、图标 SVG、原版设计资源）——只取视觉参数（颜色、行高、字号），不取资产
- 自研图谱渲染（sigma 是开源门禁的既定选择，I-P1 只换布局算法）
- 自研对话框原语（I-P4 引 shadcn/ui，不自己写 modal/popover）

---

## 6. 优先级总览

| 序 | 增量 | 修的维度 | 类型 | 大小 | 前置 |
| --- | --- | --- | --- | --- | --- |
| 前置 | Phase 1 tail（I-W1 + I-X1 + R1） | A1/A3 致命级 | 修复 | 中 | 当前工作区状态 |
| 1 | I-P1 力导向回归 + 图谱 Obsidian 化 | 图谱 | 修复 + 新依赖 + 视觉 CSS | 中 | Phase 1 tail 绿 |
| 2 | I-P2 编辑器 iA Writer 化 | 编辑器 | 视觉 CSS + Tiptap 配置 | 中 | I-P1 |
| 3 | I-P3 rail Things 3 化 | rail | 视觉 CSS | 中 | I-P2 |
| 4 | I-P4 对话框 shadcn/ui 化 | 对话框 | 引入新依赖 + 视觉 CSS | 中（查证有分叉） | I-P3 |
| 5 | I-P5a-g 其余面 polish | topbar/settings/landing/transcript/cast/memory/advanced | 视觉 CSS | 中-大 | I-P4 |
| 6 | I-P6 整体协调校验 | 全局 | 视觉 CSS 收口 | 小 | I-P5g |

**挂起（沿用 Phase 1）**：只看本卷（Canon 单卷）、人物 name 根治（D6 批复前）。

---

## 7. Phase 2 决策项（deepseek flash 只写卡，不动代码）

| # | 问题 | 卡片内容 |
| --- | --- | --- |
| Q1 | I-P1 选 d3-force 还是 graphology + forceatlas2？ | 两方案 bundle 体积、API 稳定性、与现有 sigma 集成成本、调试难度对比 |
| Q2 | I-P2 中文字体最终方案：思源宋体（开源）vs 系统宋体（无依赖但跨平台不一致）vs 引入商用字体（需付费授权） | 各方案代价；推荐思源宋体 |
| Q3 | I-P4 shadcn/ui 引入路径：完整引入 vs 按需引入（只取 modal/popover） | bundle 体积对比；推荐按需 |
| Q4 | 标杆产品截图获取：哪些产品有合法公开 demo 可截？哪些需要替代标杆？ | 列出每个标杆产品的合法截图来源；无可获取的找替代 |
| Q5 | I-P6 全局 token 收口：现有 workbench-css.ts 的 token 结构是否够？是否需要重新设计 token 层级？ | 现状审计 + 推荐结构 |

---

## 8. 给 deepseek flash 的第一句话

> 读 `AGENTS.md` + `tasks/frontend-rewrite-handoff-2026-09-18.md`（Phase 1）+ 本文件。**先验证 §3.3 Phase 2 开工闸门**——测试全绿（含 R1 路径修复）+ I-W1/I-X1 已合并 + 走查 A1/A3 落地 + host 在 401。任一不满足先在 Phase 1 标准下收尾。
>
> Phase 2 的标杆是 Obsidian 图谱 + iA Writer 编辑器 + Things 3 rail + shadcn/ui 对话框（其余面见 §1 表）。视觉 CSS 维度松开"优先复用开源"——但功能性组件仍走开源门禁，**不许复制闭源商业产品的受版权保护资产**。
>
> 每个增量：RED → GREEN → 门禁 → **走查探针复跑对应 step 附双截图**（当前 vs 标杆对照）。验收标准是 §2.2 的 A7-A12，不是"rendered"。
