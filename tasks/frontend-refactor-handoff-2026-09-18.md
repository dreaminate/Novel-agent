# novel-agent 前端重构实施计划（交付 deepseek flash 执行）— 2026-09-18

> 本计划由 Claude（claude-fable-5）产出，取代同日 glm-5.2 的 `tasks/frontend-rewrite-handoff-2026-09-18.md`（旧文件保留不动，其仍有效的内容已吸收进本计划；失效处已勘误）。执行模型以本文档为唯一工作单。

---

## Phase 0 基线记录（2026-09-18，已完成）

- **执行位置**：主 checkout `/Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent`，分支 `main`。本 session 被 harness 钉在 worktree `.claude/worktrees/review-project-status-7c2dca`（HEAD 同为 `33879fb`，工作区干净），`change_directory` 被 harness 拒绝——与 2026-09-17 那轮同一个限制。按该轮先例，**以绝对路径在主 checkout 开工**；worktree 未做任何改动。
- 1. `git status --short`：4 改（`NovelTranscript.tsx` / `WorkbenchFrame.tsx` / `novel-workbench-columns.spec.ts` / `tasks/todo.md`）+ 4 未跟踪（`docs/evidence/2026-09-18/`、`docs/evidence/interaction-2026-09-18/`、本计划文件、旧 handoff）。**工作单写「两个 evidence 目录 + 旧 handoff」= 3 个未跟踪，实际 4 个**——多出的那个是本计划文件自身。已保留未动。
- 2. `git log --oneline -1` → `33879fb` ✅
- 3. `corepack pnpm test` → **456 passed / 32 files，exit 0** ✅（含未提交的 3 条空线程 spec）
- 4. `corepack pnpm typecheck` → 0 ✅；`git diff --check` → 0 ✅；**`corepack pnpm lint` 基线为 1（红）**——唯一原因是不带跟踪的走查探针 `docs/evidence/2026-09-18/walkthrough/probe-walkthrough.mjs:18` 未使用的 `dirname` import。该 import 已删除（A1 本就要复跑同一探针，非产品代码、不涉及任何测试），复跑 **exit 0** ✅。**这是本轮唯一一处偏离工作单「期望全 0」的地方，偏差与处置记录在此。**
- 5. `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4780/` → **401** ✅
- 6. `scripts/dev-host.sh rebuild` → 0；`node scripts/smoke-workbench.mjs` → **exit 0** ✅（`review` 仍 `skipped-no-proposal`；正常 GPU 下地图 1 簇/7 人物/折叠 3；`cast board: canon keys leaked 0`）
- 7. `node scripts/port-prototype-css.mjs --check` → `workbench-css.ts matches the prototype`，exit 0 ✅
- 8. `packages/novel-workbench/lib/client.js` → **1,599,048 B**（工作单写 1,598,712 B，**差 336 B，工作单该数字已过期**；`lib/` 在 `.gitignore` 内，是构建产物不是跟踪文件）。上限 2,400,000 B → **PASS** ✅
- 9. 本节即基线记录。
- 10. 旧 handoff `tasks/frontend-rewrite-handoff-2026-09-18.md` 保留未动 ✅

**给后续增量的两条事实**：① rebuild 会更换 host token；走查探针从 `.novel-agent/run/host.url` 读，自动跟上，无需手工改。② 每轮门禁必须从主 checkout 用绝对路径跑（harness 在命令之间把 cwd 重置回 worktree）。

---

**工作区现状**：主 checkout `/Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent`，HEAD `33879fb`。存在未提交的空线程修复增量（`NovelTranscript.tsx` / `WorkbenchFrame.tsx` / `tests/novel-workbench-columns.spec.ts` / `tasks/todo.md` 一节，测试 456/456 绿）——**保留在工作区继续叠加，不提交、不 stash、不清理**。提交/推送需站艺明确授权。

**执行前提（不可妥协）**，来自 `AGENTS.md` 与 `tasks/editor-first-frontend-2026-09-17.md` §2：
- Canon 唯一事实源：前端不得直写 Canon；新建章节/写正文只能走 agent 提案 → 作者接受路径。
- H1 分界：可见面自渲染，不可见服务复用官方；不得自研 composer / agent / session / 审批 / transport。
- 严格 TDD：每增量 RED → GREEN → REFACTOR；禁止删、跳、弱化既有测试换绿灯。
- DSH 版本锁定 `0.1.2-rc.1`；不碰用户全局 `~/.dsh`；不 push、不发布、不提交。
- 证据落盘 `docs/evidence/2026-09-18/<increment-id>/`（截图 + `*-summary.json`），不写 `/tmp`。

---

## 1. 现状问题清单（逐条，附证据与代码位置）

### 1.1 致命级——数据丢失 / 界面死亡 / 主链路断裂

- **F1 一个视图崩溃 → 全部画布死白，且不恢复**。选中「故事地图」后，无 GPU 环境下 sigma.js `createWebGLContext` 返回 null，读 `blendFunc` 抛 `TypeError`，报错 `slot entry crashed in 'novel.canvas'`。`NovelCanvas.tsx` 各视图分支直接 return JSX、**没有 per-view 错误边界**，座位崩溃后切到任何其它视图都死白，整场不恢复。证据：`docs/evidence/2026-09-18/walkthrough/` 07/08/09 截图 + `walkthrough-summary.json` step 13。
- **F2 丢稿三连，全无提示**：
  - a) **切视图丢尾**：`NovelEditor.tsx:328-331` unmount cleanup 注释写「Unmount must not cancel a pending save」，代码恰恰是 `clearTimeout` 取消 pending 保存——最后 ≤700ms 键入永远不落盘。
  - b) **切章节竞态**：timer 回调读**当时**的 `chapterRef.current`/`versionRef.current`（`NovelEditor.tsx:297-301`），而 `chapterRef` 渲染时已指向新章节（L181-182）。新章节无草稿文件时版本令牌 `''` 被宿主视为无条件写（`packages/novel-project/src/index.ts:2786-2788`）——旧章节文本会被写进新章节文件；已有文件则 CAS 拒绝并把冲突错挂到新章节。正常时序下旧章节最后一句话直接丢失。测试作者自己在 `tests/novel-workbench-editor.spec.ts:162-163` 绕过该场景。
  - c) **刷新丢尾 + 丢位置**：全仓库无 `beforeunload`/`pagehide` flush；`chapterId` 不在 `store.ts:281-288` 持久化切片——刷新后回到「先在左栏选一章」，作者必须重找章节。
- **F3 人机协作主链路断裂**：
  - a) **「提交本章」一次性**：`NovelEditor.tsx:563` 条件 `submitState !== 'sent'`，`submitState` 不随章节重置（`load()` L457-482 只重置 refinedAt/status/problem/conflict）——提交过一次后按钮永久消失直到切视图。
  - b) **待审提案徽标是死的**：`NovelThreadHeader.tsx:53-69` effect 依赖只有 `[workId, loadReviews]`，不含 `state.revision`、无订阅无轮询——agent 落提案后「待审提案 N」不出现、数字不动；`NovelCanvas.tsx:298-316,600-602` 审阅画布同样只读一次。**agent 产出是核心价值，但作者没有任何收到产出的通知**。
  - c) **无 session 审阅死路**：`NovelCanvas.tsx:612` 无 session 时点「确认接受」直接静默 `return`；「影响预览」永远停在「正在计算影响…」（`ProposalReviewView.tsx:234-235`）。可达路径：左栏 → 本章合同 → 去审阅提案（不需要线程）。
  - d) **接受后正文无处可读**：采纳写 Canon（revision+1）后不回写草稿文件；`novel-data.ts` 的 `loadManuscriptText`（L210/L1321）与 `loadManuscript`（L205/L1311）都是**死代码**。编辑器里还是旧草稿；「本章合同」的「读已接受正文」按钮只是 `setView('editor')`（`NovelCanvas.tsx:536`），名不符实。草稿与 Canon 永久分叉。
- **F4 作者无法从零开始**：全仓库无「新建章节/立项」入口。Canon 无章节时左栏只显示「尚未立项…」（`NovelRail.tsx:323-330`）；无线程时点提交/提炼只弹一句「还没有选定线程…」（`NovelEditor.tsx:395-397,372-375`），提示里无可点入口。另：无 session 时右栏根本不渲染，「对话」按钮点了无任何可见变化（`WorkbenchFrame.tsx:261` 的 `conversationOpen = columns.side > 0 && sessionId !== undefined` + `NovelTopbar.tsx:128-139`）。**不打算先折腾 agent 的作者无法从界面开始写第一章**。

### 1.2 严重级——核心流程读不懂或走不通

- **S1 提交确认卡一句话塞五个工程术语**：「提案」「R5 对齐」「提案收件箱」「Canon」「审阅」，违反产品文案规范（`docs/novel-mode-frontend-brief-2026-09-16.md` §6：作者面不得出现 Canon/workdir/R 版本散文）。证据：walkthrough `06-submit-confirm.png`；位置 `NovelEditor.tsx` 确认卡 JSX（约 L594-628）。
- **S2 中文写作工具的输入框是英文的**：官方 composer placeholder「Describe what you want to build...」、模型名「Deep... High」中英混杂。composer 归官方 `dsh-client-ui-conversation` 所有（H1 边界内正确）。**先查证 profile 安装的 `@deepseek-ai/dsh-client-locale` 词表是否覆盖 conversation 包**（注意 I1.1 教训：查 profile 的 node_modules，不是仓库根的）；CSS `::placeholder` 只能改样式改不了文字。查证结论「官方 seam 封闭」→ 停止条件 #1。
- **S3 落地页空白无引导**：已立项未选章时主画布只有标题「写作」+ 工程话副标题「…自动保存到你自己的 workdir，接受后才进 Canon」+ 小字「先在左栏选一章」。原型 `hero-card` 只在无作品时出现，此态无引导。位置：`NovelCanvas.tsx` editor 分支、`NovelEditor.tsx:511-518`。
- **S4 线程列表被 agent 任务日志淹没**：可见「未命名线程」「把 ok 写入指定文件」「将本 ok 写入指定文件」——agent 自动会话与作者对话混排。位置：`NovelRail.tsx` 线程段（L178-250，`threadRows` L403-413 只滤 subagent）。
- **S5 人物显示实体 id**：地图/`@` 候选/关系线/档案全是 `guchen` 类 slug。根因：Canon 无 character-state 带 `name` 字段（I6.5b 查证结论），属组织器契约缺口，根治走决策卡 D6。短期：显示层「未命名人物」+ 副显 id；提炼提示词加「为每个人物补充 name」（走提案路径，不违反 Canon 边界）。
- **S6 运行期上下文注入泄漏进对话**：`Current runtime context...` 工程注入渲染成作者消息行（`transcript-data.ts:124-130` 无过滤），且 `index.tsx:206-213` 把它记为 `lastSubmission`，失败重试会**重发**这段注入。
- **S7 测试残留混在作者草稿正文里**：`/private/tmp/nw-workspace/天机阁主/第1章《开篇章》.草稿.md` 里有「测测试试夜里风大…」。清理是写操作，走决策卡 D5；机制上探针规约补「结尾删除或还原草稿文件 + sha256 before/after」。
- **S8 续写 2–6.5 秒、段级续写不流式**：高推理档 + `maxTokens` 曾饿死答案 + `reasoningEffort` 是 adapter 私有串。换档与流式都是产品决策（决策卡 D3），不动代码。

### 1.3 体验级——能用但难受

- **E1 编辑器头部一行 9 个元素**（章节名+写作/阅读+状态+字数+续写+提交本章+重新提炼）挤满 896px；提交确认卡与续写面板**可同时展开叠加**（walkthrough `06-submit-confirm.png`）。
- **E2 视图切换无加载态**：数据未到时一片空白（原型 CSS `.sk` 骨架样式已有、没用上）。
- **E3 地图钉位刷新即丢**（勘误：refineMode **已**持久化——`hydrateWorkbench` L275 / `dehydrateWorkbench` L286 已覆盖，勿重复实现；只剩钉位与 `WHILE_WRITING_MIN_CHARS=1200` 常量）。
- **E4 窄窗对话列被关死**：代码无 1184 常量（`store.ts:181` 是 `NARROW_AT=1280`；1184 = 248+296+640 的算术结果）。实际三段：≤1184px 对话列归零、1184–1280 浮动、>1280 常驻。窗口变窄时列被 solver 关掉且无回归路径，「对话」按钮死键（todo.md 自记「Found and left alone」）。方案走决策卡 D4。
- **E5 失败静默，作者在不知情中花钱**：句级补全失败 `() => {}` 吞掉（`NovelEditor.tsx:241-249`）；「重试上一句」失败 `.catch(() => {})`（`NovelThreadNotice.tsx:93`）。
- **E6 状态误导与残留**：大纲读失败把 `editorChapter` 置 undefined → 编辑器说「你没选章节」（`NovelCanvas.tsx:385-389` vs `NovelEditor.tsx:511-518`）；`refineState='asked'`、`submitProblem`/`refineProblem` 跨章节残留；冲突时状态行留空。
- **E7 可达性与探针疑点**：故事地图 4 个节点 circle 被判 `unreachable`（`views-summary.json`）；各视图文本读出混入 `[data-novel-canvas] .nw-note { padding…` 原始 CSS——**已核实是探针文本采集没跳过 STYLE 节点（探针缺陷），不是产品缺陷**，修探针。
- **E8 设置面板 9 项平铺无分组**（阅读类 5 项 / AI 协作类 4 项）。
- **E9（M4）提炼失败后油门不重试**：`refine()` 在请求发出前就 `refinedAt.current = charsRef.current`（`NovelEditor.tsx:380`），失败后 1200 字内不再触发。
- **E10（M2）审阅画布提案兜底跨章**：`NovelCanvas.tsx:395-397` 未选章时兜底到任意 `deck.proposals[0]`，可能显示别章的提案（C2 走查确认，若误导则在 A4 收尾时加章名标注）。

### 1.4 待站艺决策（deepseek flash 只写决策卡，不动代码）

| # | 问题 | 卡片内容 |
| --- | --- | --- |
| D1 | 线程管理：要不要「置顶/归档/重命名」作者侧操作？（S4 根治） | 作者侧状态存哪（prefs or 工作区文件）、工作量 |
| D2 | 右栏退役丢掉的「最近 AI 活动/置顶提案预览」要不要补回？ | 丢弃清单 + 补回成本 |
| D3 | 续写档位与流式（S8） | 2–6.5s 实测 + 换档风险（查 reasoningEffort 枚举）+ 流式协议成本 |
| D4 | 窄窗 ≤1184 对话列归零，要不要留回归路径？（E4） | 三段式现状 + 浮层/抽屉化成本 |
| D5 | 草稿残留清理授权（S7） | 列出具体文件与内容：`/private/tmp/nw-workspace/天机阁主/第1章《开篇章》.草稿.md` 里的「测测试试夜里风大…」 |
| D6 | 人物 name 根治：organizer 契约加 name（改 Canon 语义） | 改契约 vs 只改提示词 两条路径代价 |

---

## 2. 改造目标与可验收标准（人类视角、可证伪）

**目标一句话**：一个第一次打开的中文作者，不被打断地完成「打开 → 选章 → 写 → 让 AI 续 → 提交 → 审阅 → 接受 → 读到已接受的正文」，且**任何一步都不丢稿、不消失、不白屏、不说工程话**。

| # | 验收标准 |
| --- | --- |
| A1 崩溃隔离 | mock 任一画布崩溃，其余画布照常；崩溃画布显示降级卡（画布名+原因+重试），重试可恢复。真机 `--disable-gpu` 下地图屏显示降级卡（含「去人物与关系」入口），cast 等其余视图正常，console 无未捕获错误。 |
| A2 零丢稿 | 输入后 ≤700ms 内切视图 / 切章节 / 关页，最后一段文字都进**旧章节**草稿文件；刷新后回到上次章节；离开脏页有浏览器拦截。 |
| A3 提交可重复 | 提交后可见「去收件箱」；改稿或切章后「提交本章」恢复；确认卡与续写面板互斥；大纲读失败显示真实原因+重试，而不是「你没选章节」。 |
| A4 协作闭环 | agent 落提案后右栏徽标与审阅画布 ≤1 次刷新内更新（不依赖轮询）；无 session 审阅给出明确指引 + 「开线程」入口，绝不静默；接受后编辑器能读已接受正文、能把分叉写回草稿。 |
| A5 新手闭环 | 未选章有章节引导卡；无章节有「让 AI 规划第一章」；无线程提示自带「开线程」按钮；无 session 时「对话」按钮能开线程。 |
| A6 全中文 | 作者可见区（排除进阶面）断言不含 `Describe what you want to build`、`Canon`、`workdir`、`R\d+ 对齐`类散文（R 徽标除外），探针输出 `nonChineseStrings: []`。 |
| A7 线程可用 | 作者线程在前 5 条可见；agent origin 会话折叠进「其他会话」分组；transcript 不显示 `Current runtime context…` 注入，重试也不重发它。 |
| A8 状态不丢 | 地图钉位刷新后保持；refineMode 加回归护栏；设置面板分组可读。 |
| A9 回归不破 | 全部门禁绿：测试 ≥456/456 全绿（改文案允许同步改断言，**不许删**）、typecheck / lint / `git diff --check` 全 0、`dev-host.sh rebuild` + smoke exit 0、动原型时 `port-prototype-css.mjs --check` 通过、`lib/client.js` ≤ 2,400,000 B（当前 1,598,712 B）。 |

---

## 3. 分阶段任务拆分（优先级序）

> 每增量格式：**目标 / 涉及文件 / RED / GREEN / 真机验证 / 验收**。执行时一次只取第一个未勾选增量。

### Phase 0 — 基线确认（全只读，10 步）✅ 2026-09-18 完成，记录见文件顶部

1. `git status --short`：期望 ` M`（NovelTranscript.tsx / WorkbenchFrame.tsx / columns.spec.ts / todo.md）+ `??`（两个 evidence 目录 + 旧 handoff）。**不清理、不提交。**
2. `git log --oneline -1`：期望 `33879fb`。
3. `corepack pnpm test`：期望 **456/456** 绿（含未提交的 3 条空线程 spec），保存输出留档。
4. `corepack pnpm typecheck && corepack pnpm lint && git diff --check`：期望全 0。
5. `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4780/`：期望 401（host 在）；不在则 `scripts/dev-host.sh start`。
6. `scripts/dev-host.sh rebuild && node scripts/smoke-workbench.mjs`：期望 exit 0。
7. `node scripts/port-prototype-css.mjs --check`：期望通过（未动原型）。
8. `stat -f%z packages/novel-workbench/lib/client.js`：期望 1,598,712 B（≤ 2,400,000）。
9. 在本计划文件顶部写基线记录（日期、HEAD、测试数、smoke、体积）。
10. 确认旧 handoff 保留不动。

### Phase A — 止血（P0，A1→A6 串行）

#### A1 画布错误边界 + WebGL 降级 + 自愈（F1）✅ 2026-09-18 完成

- **涉及文件**：新增 `packages/novel-workbench/src/client/canvas-boundary.tsx`；`index.tsx`（注册处包边界）；`StoryMapView.tsx`（探测+降级卡）；新增 `tests/novel-workbench-canvas-boundary.spec.ts`；扩展 `tests/novel-workbench-story-map.spec.ts`；`scripts/smoke-workbench.mjs`。
- **RED**：边界 spec——子组件 effect 抛错 → 断言①降级卡（画布名+重试按钮）②点重试子组件重挂载（挂载计数+1）③外层兄弟组件照常。story-map spec——`vi.mock` 探测函数返回 false → 断言降级卡（`data-novel-story-map-degraded`）+ 按钮「去人物与关系」「重试」，不构造 Sigma；**既有 9 条 story-map spec 的 mount 助手必须 mock 探测为 true，否则全绿变红（这是 RED 工作量的一部分）**。smoke——加一步「正常 GPU 下 `data-novel-story-map-canvas` 存在」。
- **GREEN**：`canvas-boundary.tsx` 手写 ~30 行 class 组件（`componentDidCatch`/`getDerivedStateFromError`，**不引入 react-error-boundary 依赖**）；retry 用内部 attempt 状态做 children 的 key。`index.tsx` L282-285 注册回调里把 `NovelCanvas` 包进边界，**key 取 `getWorkbenchState().view`**——切视图即重挂边界 = 自动自愈。`StoryMapView.tsx` 新增 `webgl-probe.ts` 纯函数 `probeWebGL()`（`getContext('webgl2') ?? getContext('webgl')`，null/抛错均 false）；组件开头探测失败即渲染降级卡不 mount Sigma；props 增 `onOpenCast`（NovelCanvas 传 `setView('cast')`）。
- **真机验证**：`docs/evidence/2026-09-18/walkthrough/probe-walkthrough.mjs` 用 `--disable-gpu` 复跑 step 7/8/9：地图降级卡截图、cast 正常、console 无未捕获错误；正常 GPU 下 smoke exit 0。
- **验收**：A1 + A9。

> **✅ 2026-09-18 完成。** 证据：[`docs/evidence/2026-09-18/A1/`](../docs/evidence/2026-09-18/A1/)（`a1-summary.json` verdict `pass`、`probe-a1.mjs` 可复跑、三张截图、`red.txt`）。
>
> - **实现**：新增 `canvas-boundary.tsx`（class 组件，`getDerivedStateFromError` + `componentDidCatch`，重试以 attempt 作 key 重挂载子树，零新依赖）与 `webgl-probe.ts`（`probeWebGL()` 纯函数，null 与抛错都算 false）。`index.tsx` 注册处改用新组件 `CanvasSeat` 包住 `NovelCanvas`；`StoryMapView` 探测失败即渲染降级卡（`data-novel-story-map-degraded`，含「去人物与关系」「重试」），**不构造 Sigma**；`NovelCanvas` 传 `onOpenCast={() => setView('cast')}`；`smoke-workbench.mjs` 加 `map-degraded-on-good-gpu` / `map-no-canvas-host` 两个失败态。
> - **与工作单的偏差（两处，均以代码为准）**：① 工作单写「key 取 `getWorkbenchState().view`」——直接用裸读不会触发重渲染，key 永远不变、自愈失效；改为在 `CanvasSeat` 里 `useWorkbenchState()` 订阅（[index.tsx](../packages/novel-workbench/src/client/index.tsx)），行为符合工作单意图。② `data-novel-editor-*` 之外的既有 class 名未动；`port-prototype-css --check` 不受影响（本轮未碰原型 HTML）。
> - **门禁**：`corepack pnpm test` **461 passed / 33 files**（456 基线 + 5 新增：边界 3 + 降级 2），typecheck 0、lint 0、`git diff --check` 0；`dev-host.sh rebuild` + `smoke-workbench.mjs` exit 0（GPU 机器上地图仍 `canvas 7`，新断言未误报）；`lib/client.js` 1,606,425 B（+7,377，上限 2,400,000）。
> - **真机（`--disable-gpu`）**：A1 专用探针三条全中 —— 降级卡 `role=alert` 带两个按钮且 `webglCanvases 0`；点「去人物与关系」后 cast 画布正常（6 人物 / 3 关系 / 4 势力）；「重试」后仍是卡（机器确实没有 WebGL）但左栏 10 个视图项、frame 都在、**未出现边界崩溃卡**；**console 未捕获错误 0**。
> - **顺带查实（探针缺陷，非产品缺陷）**：走查探针 step 8 读的是原型旧 class（`.char-card` / `.rel-line`），所以 JSON 里 `cardCount: 0` 不代表 cast 死白 —— 截图 08 显示 cast 完整渲染。这与 §1 E7「探针文本采集」同源，B4 一并修。
> - **未做**：未验证真实崩溃（非 WebGL）路径下的降级卡外观 —— 边界卡只由 `novel-workbench-canvas-boundary.spec.ts` 覆盖；真机只验证了 WebGL 降级这一条路径。

#### A2 丢稿三连修复（F2）✅ 2026-09-18 完成

- **涉及文件**：`NovelEditor.tsx`（saveNow 重构 + flush-on-unmount + 切章前 flush + pagehide/beforeunload）；`store.ts`（chapterId 入 prefs）；`tests/novel-workbench-editor.spec.ts`、`tests/novel-workbench-prefs.spec.ts`。
- **RED**（全用 `vi.useFakeTimers`）：①「切章节时 pending save 落进**旧**章节文件」——载入章 A → 输入 → 700ms 内重渲染为章 B → `runAllTimers()` → 断言 save 以 A 的 identity + A 的文本调用，且**没有**以 B identity 携带 A 文本的调用。②「unmount 时 flush 而非取消」——输入 → 立即 unmount → 断言 save 被调、携带最新文本。③「pagehide flush」——dispatch `PageTransitionEvent('pagehide')` → save 被调。④「脏稿刷新有拦截」——脏时 dispatch `beforeunload` → `preventDefault` 被调；干净时不调。⑤ prefs spec——chapterId 跨刷新存活、非字符串回落 undefined。
- **GREEN**：`scheduleSave`（L293-326）回调体抽成 `saveNow(live, target, version)`，带 `mountedRef` 守卫 setState（防 setState-after-unmount）；**调度时刻把 `{chapter, version}` 捕获进 `pendingRef`**，timer 回调改用 pendingRef（根除双载体竞态）。unmount cleanup（L328-331）改为 flush pendingRef（旧章+旧版本），并把 L328 注释改成真话。章节切换 effect（L484-490）在 `load()` 之前同样 flush，`timer.current = undefined` 防双发。新增 effect：`pagehide` → flush；`beforeunload` → `dirtyRef.current === true` 时 preventDefault。`flush()`（L334-356）改为复用 `saveNow`。`store.ts`：dehydrate 加 `chapterId`、hydrate 加类型校验、`prefsChanged`（L373-378）加比较。
- **真机验证**：`docs/evidence/interaction-2026-09-18/probe-typing.mjs` 类探针：输入后 300ms 内切视图再切回，读草稿文件断言末段文字在；刷新后断言回到原章节。
- **验收**：A2 + A9。

> **✅ 2026-09-18 完成。** 证据：[`docs/evidence/2026-09-18/A2/`](../docs/evidence/2026-09-18/A2/)（`a2-summary.json` verdict `pass`、`probe-a2.mjs` 可复跑、两张截图、`red.txt`）。
>
> - **实现**：`scheduleSave` 拆成 `writeDraft`（唯一写盘口：版本守卫 + 状态行 + 失败处理各一份）与调度器；**调度时刻把 `{chapter, version, text}` 一起钉进 `pendingRef`**，timer 回调只读 pendingRef。`flushPending()` 是「离开」路径（卸载 / 切章 / pagehide），写钉住的那份，不读文档。新增 `pagehide`（补债）与 `beforeunload`（有未落盘正文才 `preventDefault`）监听；`editCount`/`editsOnFile` 一对计数器回答「有没有会丢的正文」，状态行答不了（保存在飞时又打了字，不能算 clean）。`load()` 成功时归零。切章 effect 在 `load()` **之前** `flushPending()`。`store.ts`：`dehydrate` 加 `chapterId`、`hydrate` 用新 `textOr` 校验、`prefsChanged` 参与比较。
> - **与工作单的三处偏差（均以代码为准）**：① 工作单写 pendingRef 只钉 `{chapter, version}`、回调重新 `serialize(live)`；我额外钉了 `text` —— 卸载时 Tiptap 实例可能已销毁，重新序列化会抛，且切章后文档已换成新章正文，钉文本是唯一可靠的。② 工作单写 `dirtyRef.current === true` 布尔；我改用 `editCount`/`editsOnFile` 计数器，因为「保存在飞时作者又打字」会让布尔提前变 clean。③ 工作单的 RED 要求「全用 `vi.useFakeTimers`」；我用了 `vi.useFakeTimers({ toFake: ['setTimeout','clearTimeout'] })` —— 只假造 debounce，全面假造会让 rAF/microtask 停摆、编辑器根本挂不上。
> - **门禁**：`corepack pnpm test` **468 passed / 33 files**（461 + 7 新增：editor 4 + prefs 3），typecheck 0、lint 0、`git diff --check` 0；rebuild + smoke exit 0；`lib/client.js` 1,610,269 B。
> - **真机**：A2 探针两条全中 —— 打字后 **13ms** 切走（远在 700ms 防抖窗内），草稿文件里**有**最后一句，切回编辑器读得到；刷新后 `view=editor`、`chapter=vol01-ch0001`、不出现「先在左栏选一章」、正文仍可读；console 未捕获错误 0。**草稿文件 sha256 before/after 完全相同**（`c2d819ea…`），探针写进去的标记已还原。
> - **未做**：`beforeunload` 只在单测里验证（真机 CDP 无法可靠触发浏览器的关闭询问）；`pagehide` 同理只走单测。真机验的是「切视图 → 卸载 flush」与「刷新 → 回到原章」两条主路径。
>
> **⚠️ 2026-09-18 更正（本站艺复核后自查）。** 上面那版结论**下早了**，有以下四处要改：
>
> 1. **修完之后还留着一个真 bug，当时没查出来。** 离开的 flush 和新章的读取是两个同时在飞的请求，**回来的顺序不定**。旧代码在 `writeDraft` 里无条件 `versionRef.current = result.version`；如果第 1 章的保存**晚于**第 2 章的读取返回，它的版本令牌就变成了"当前章"的令牌，下一次写第 2 章会带着**别章的令牌**发出去 —— 正是 F2b 描述的那条 CAS 拒绝，只是换了个触发路径。补了 RED（`expected 'saved-1' to be 'v-2'`）后修掉：`writeDraft` 先 `stillOnScreen(target)` 判断这次保存是否仍属于屏幕上那一章（按 number+title 比，因为草稿文件名由它们决定），不是就**不碰令牌、不写状态行、不报它的错**。
> 2. **真机上的「切章节」一次都没验过。** 这个工作区**只有 1 章、1 个草稿文件**，「切章节」在真机上不可达 —— 它只有单测覆盖。上一版报告把这件事含混过去了。
> 3. **「13ms 切走」是我算错的**。那个数是点击的往返耗时，不是打字到切走的间隔。新探针改为直接测这个间隔：`sinceKeystrokeMs: 265`（< 700ms 防抖窗，`withinDebounce: true`）。结论不变，数字原来是错的。
> 4. **三个探针合并了。** 我原先为 A1/A2/A3 各写了一份 ~200 行的 CDP 脚本，把同一套 session 类与 Chrome 启动参数抄了三遍 —— 这是过度。现在抽成 `docs/evidence/2026-09-18/probe-harness.mjs`（一份 harness）+ 三个各约 110 行的场景文件；三个都重跑过，结论不变。合并过程中我自己引入并修掉了两个 harness 缺陷：`ROOT` 相对路径少算一层（合并后目录上移，导致 `ENOENT`），以及 `cdp.send()` 无超时 + `launch()` 失败不清理 Chrome 子进程（两者叠加会让探针**永久挂死**而不是报错）。
>
> 修完的门禁：**476 passed / 34 files**（+1 新增的令牌竞态测试），typecheck / lint / `git diff --check` 全 0，rebuild + smoke exit 0，`lib/client.js` 1,613,406 B。三个探针 verdict 均 `pass`，草稿 sha256 before == after。
>
> **⚠️⚠️ 2026-09-18 第二轮自查（加入第 2 章之后）——又查出两个真 bug，其中一个是丢稿机制本身。**
>
> **A2-3（严重）待审提案会改掉章节标题，从而把作者正在写的草稿文件改名。** `buildWorkOutline` 先用**已接受**正文的标题填 `titles`，紧接着又用**待审提案**的标题覆盖它（`novel-data.ts`，原 `if (manuscript.title.trim().length > 0) titles.set(...)`）。而草稿文件名由标题决定（`chapterDraftPath` → `第N章《title》.草稿.md`）。于是 agent 落一条提案，作者正在写的那一章就换了个文件名，编辑器再去读就是**一章空白**——agent 的一个动作静默吃掉作者一章。这不是推断：本工作区现在就有两份文件为证（`第1章《开篇章》.草稿.md` 与 `第1章《第1章《开篇章》》.草稿.md`），后者正是本增量自己的 A3 探针提交后 agent 生成提案造成的，里面还躺着那次探针打进去的字。**修法**：标题只来自已接受正文，待审提案只标记 `pending`（`status` 不变）。RED 在 `tests/novel-workbench-contexts.spec.ts`（`expected '第1章《开篇章》' to be '开篇章'`）。旁证：这份被改名的文件已删除，原始文件 sha256 未变。
>
> **A2-4 记住的章节不在当前作品里 → 永远停在「正在读取这一章…」。** `chapterId` 现在跨刷新持久化（本增量加的），但**没有任何地方在作品切换时清掉它**；指向一份不在当前作品目录里的章节时，A3 新加的分支会一直显示「正在读取这一章…」（改之前至少还显示可操作的「先在左栏选一章」）。**修法**：目录里找不到记住的那一章就把它清掉，回到「选一章」。RED 在 `tests/novel-workbench-canvas.spec.ts`。
>
> **A2-5 我写的测试互相污染。** 这几个 spec 都挂载 React root 却从不解挂，而 workbench store 是模块级状态：上一个用例的 canvas 仍活着、仍响应 store 变化、仍往里写——A2-4 的修复一落地就立刻暴露了它（前一个用例把后一个用例的选章清掉了）。三个 spec 现在都按用例解挂并重置 store。
>
> **A2-6 真机「切章节」现在真的验了。** 工作区原本只有 1 章，这条路径在真机上不可达。经站艺同意，往工作区加了一个**明确标注为测试夹具**的章节（Canon 追加 revision 6，`vol01-ch0002`，objective「测试夹具第二章」；改前备份在 `docs/evidence/2026-09-18/A2/novel_project.backup.json`，只动了 `projects` 表）。A2 探针现在真的切章：**251ms** 内切走，句子进了第 1 章的文件、**没有**进第 2 章的文件，刷新后回到第 2 章。verdict `pass`。

#### A3 提交链路修通（F3a + E1 互斥 + E6 误导空态）✅ 2026-09-18 完成

- **涉及文件**：`NovelEditor.tsx`；`NovelCanvas.tsx`（editor 分支错误区分）；`tests/novel-workbench-editor.spec.ts`；新增 `tests/novel-workbench-canvas.spec.ts`。
- **RED**：①「提交过再改稿按钮回来」——submit → sent（出现 `data-novel-editor-inbox`）→ 再输入 → `data-novel-editor-submit` 重现、inbox 消失。②「切章节后提交/提炼状态归零」——A 章 sent → 切 B 章 → B 无「已交给 AI」、无 refineProblem/submitProblem 残留。③「开确认卡收起续写面板，反之亦然」。④「去收件箱」按钮点击调用新 prop `onOpenInbox`。⑤ canvas spec——loadOutline 拒绝时渲染错误卡（原因 + `data-novel-editor-outline-error` 重试），而非「先在左栏选一章」。
- **GREEN**：`NovelEditor` props 加 `onOpenInbox`（NovelCanvas 传 `setView('review')`）。`load()`（L457-482）重置全套：submitState/submitProblem/refineState/refineProblem/confirming/continuing。`onUpdate` 里 `submitState === 'sent'` 时重置回 idle（改稿后可再提交，新提案覆盖旧提案，收件箱语义不变）。互斥：开确认卡关续写、开续写关确认卡。sent 展示（L573-575）改「已交给 AI 起草提案」+ 「去收件箱」按钮。`NovelCanvas`：editor effect 失败路径改为 `setEditorProblem(message)` 新 state + 错误卡（重试 = `workbenchActions.refresh()`）；`NovelEditor` 仅在 `editorChapter` 就绪时渲染。
- **真机验证**：walkthrough 探针 step 4/6 复跑：提交后见「去收件箱」、再打字「提交本章」回来、确认卡与续写不同屏；探针 stub loadOutline 拒绝截图错误卡。
- **验收**：A3 + A9。

> **✅ 2026-09-18 完成。** 证据：[`docs/evidence/2026-09-18/A3/`](../docs/evidence/2026-09-18/A3/)（`a3-summary.json` verdict `pass`、`probe-a3.mjs` 可复跑、5 张截图、`red.txt`）。
>
> - **实现**：`NovelEditor` 加 `onOpenInbox` prop，sent 态渲染「已交给 AI 起草提案」+「去收件箱」（`data-novel-editor-inbox`）。`load()` 在**开头**重置全套（confirming / continuing / submitState / submitProblem / refineState / refineProblem）——早于草稿读回，作者一切章就看不到上一章的残留。`onUpdate` 用函数式 setState 把 `sent` 复位成 `idle`（改稿即可再提交）。两个面板互斥。`NovelCanvas` 加 `editorProblem` state，editor effect 失败路径 `setEditorProblem(message)`，分支按「有错 → 错误卡（`data-novel-editor-outline-error` + 重试）/ 没选章 → 提示 / 在读 → 提示 / 就绪 → NovelEditor」渲染。
> - **一处顺带修掉的既有测试环境缺陷**：A3 的新测试首次让 ProseMirror 在 jsdom 里对**非空文档**执行 `focus()`，触发 `scrollToSelection` → `getClientRects`/`getBoundingClientRect`，而 jsdom 两个都没在 Element 与 Range 上实现，于是抛出**未被捕获的异常**、让 vitest 整体退 1（475 条全绿也照样退 1）。已在 `tests/webgl-env.ts` 补三个 shim（`Element#getClientRects`、`Range#getClientRects`、`Range#getBoundingClientRect`），并在 editor spec 导入该文件。这是 jsdom 没有排版层，不是产品缺陷。
> - **与工作单的一处偏差**：工作单要求「探针 stub loadOutline 拒绝截图错误卡」。CDP 无法从外部 stub 宿主的 outline RPC，所以错误卡由新增的 `tests/novel-workbench-canvas.spec.ts` 三条覆盖（错误卡内容与文案、重试触发重读、正常路径仍开编辑器）；真机只验了正常路径未被破坏。
> - **门禁**：`corepack pnpm test` **475 passed / 34 files、0 error**（468 + 7 新增：editor 4 + canvas 3），typecheck 0、lint 0、`git diff --check` 0；rebuild + smoke exit 0；`lib/client.js` 1,612,600 B。
> - **真机（真的提交了一次）**：确认卡与续写面板互斥（开续写 → 点提交 → 确认卡在、续写没了）；确认后 **155ms** 出现「已交给 AI 起草提案」+「去收件箱」；再写一句，「提交本章」回来、inbox 收起；版本历史仍是 **R5**（这一步不动 Canon）；console 未捕获错误 0。提交前探针把草稿内容替换成自己那一句，**没有把文件里的测试残留当作正文提交**。
> - **探针副作用（如实记录）**：这次提交在线程里排了一个真实请求。跑完时收件箱仍是空的（smoke `review` = `skipped-no-proposal`），即没有留下提案；草稿文件 sha256 before == after（`c2d819ea…`）。若那轮 agent 稍后落出提案，作者可在审阅屏一键丢弃。
>
> **⚠️ 上面这条「没有留下提案」是错的，而且我当初的依据永远不会失败。** `scripts/smoke-workbench.mjs` 的 `sweepProposal` 找一个 `[data-novel-proposal]` 节点，而**产品从来没有渲染过这个节点**（产品把待审标在章节行上：`data-novel-chapter-status="pending"`，进入审阅的真正入口是右栏线程头的 `data-novel-thread-pending` 徽标）。所以这一屏在每一次运行里都报「没有待审」，**包括有待审的时候**。实测：存储里 `pendingProposals` 有 **8 条**，其中至少 2 条是本增量自己的探针提交产生的（A3 的那次提交让 agent 落了一条提案，标题 `第1章《开篇章》`——正是它触发上面 A2-3 那个改名 bug）。已修 `sweepProposal`：先开右栏，读 `data-novel-thread-pending`，再点它进审阅。修完 smoke 报 `review rendered 提案审阅`（改前是 `skipped-no-proposal`），审阅屏正常渲染出正文预览、设定变更 0 条、接受/暂不处理/丢弃三个动作。
>
> **A3 真机复核（加入第 2 章后）**：切章也补上了 —— 提交后切到第 2 章，无「已交给 AI」、无「去收件箱」、无确认卡；在第 2 章里写字，「提交本章」正常出现（sent 状态没有跨章泄漏）。verdict `pass`。

#### A4 协作闭环（F3b/F3c/F3d）✅ 2026-09-18 完成

- **涉及文件**：`NovelThreadHeader.tsx`；`index.tsx`；`transcript-data.ts`；`NovelCanvas.tsx`；`ProposalReviewView.tsx`；`NovelEditor.tsx`；`tests/novel-workbench-transcript.spec.ts`、`tests/novel-workbench-review.spec.ts`、`tests/novel-workbench-editor.spec.ts`、`tests/novel-workbench-canvas.spec.ts`。
- **RED**：① transcript spec——纯函数 `proposalCallIds(entries)` 收集 name 为 `propose_novel_result_packet` 的 tool/call 的 callId。② review spec——新 prop `sessionless` + `onOpenThread` 时渲染横幅（`data-novel-review-sessionless`）含「开一条线程」按钮，点击调用 onOpenThread 且不调用 onAccept。③ canvas spec——sessionId undefined 时点接受 → `submitReview` **不被调用**且 notice 出明确文案（「要先开一条线程，才能把接受的决定交给 AI。」）。④ editor spec——新 prop `acceptedText` 与草稿不一致时渲染分叉条（`data-novel-editor-diverged`）含「读已接受正文」（切只读渲染 acceptedText）与「写回稿子」（`saveChapterDraft` 带 acceptedText 与当前 version）；一致时不出现。
- **GREEN**：`index.tsx` 的 read()（L192-214）维护 `seenProposalCalls: Set<string>`：每轮 `proposalCallIds(entries)` 出现新 id → `workbenchActions.refresh()`（session 切换时清空）。`NovelThreadHeader` 读 store 的 `revision` 并加入 effect 依赖（L69）——refresh 后徽标自动重读，**无轮询**；审阅画布 L298-316 已含 revision 依赖，自动受益。`ProposalReviewView` 加 `sessionless`/`onOpenThread`；NovelCanvas review 分支传 `sessionless={sessionId === undefined}`、`onOpenThread={() => { props.newThread(workId); workbenchActions.openDetails() }}`；onAccept 的 guard（L612）改为 setNotice 明确文案后 return。NovelCanvas editor 分支 outline 加载后追加 `props.loadManuscriptText(workId, state.chapterId)`（复活死代码），结果存 `acceptedText` 传 NovelEditor（dep 含 `state.revision`）。分叉条「写回稿子」用 `setContent(分段转 HTML)` + `saveNow`（versionRef 守卫冲突）。ChapterContractView 的「读已接受正文」按钮自此名副其实，无需改动。
- **真机验证**：真实 host 发一句让 agent 落提案 → 记录徽标出现时间（≤1 次刷新）；无 session 开审阅屏截图横幅；接受一章后回编辑器截图分叉条，点「读已接受正文」读 Canon 文本，点「写回稿子」后草稿文件 sha256 与 acceptedText 一致。全链路证据落盘 `full-accept-flow.json`（before/after revision）。
- **验收**：A4 + A9。

> **✅ 2026-09-18 完成。** 证据：[`docs/evidence/2026-09-18/A4/`](../docs/evidence/2026-09-18/A4/)（`a4-summary.json` verdict `pass`、`probe-a4.mjs` 可复跑、3 张截图、`red.txt`）。
>
> - **实现**：`transcript-data.ts` 加纯函数 `proposalCallIds()`；`index.tsx` 的会话日志 follow 里维护 seen 集合，出现新 id 就 `workbenchActions.refresh()`；`NovelThreadHeader` 的读取 effect 加入 store 的 `revision`（**无轮询**）；`ProposalReviewView` 加 `sessionless`/`onOpenThread` 与横幅；`NovelCanvas` 传 `sessionless`、`onOpenThread`，accept guard 改为 `setNotice('要先开一条线程，才能把接受的决定交给 AI。')`，并在 editor 分支用 `loadManuscriptText` 读已接受正文（**复活死代码**）；`NovelEditor` 加 `acceptedText` prop + 分叉条（「读已接受正文」/「写回稿子」，写回走 `versionRef` 守卫）。
> - **验证时查出一个我自己写的真 bug（F3b 第一版没修好）**：修完第一版跑真机，提案确实在 180 秒窗口内进了存储，**徽标却一动不动**。原因是 `followTurnFailure` 在**每次会话列表变化**时都被重入（`ctx.sessions.list.subscribe`），而我把 seen 集合和「已播种」标志建在了这个函数**内部**——于是每轮重订阅都重建并重新播种，agent 刚落的那条 call 被当成历史吞掉。而 agent 落提案本身就伴随会话变化，等于稳定地错过。把两者提到 `apply` 作用域后真机复测：**徽标 6 → 7，39 秒，作者未做任何操作**。这条记录在案，因为它是「不改完就跑真机就不会知道」的那类。
> - **真机（三条）**：① 编辑器出现分叉条「这一章已经接受过一版，稿子和它不一样了。」+ 两个按钮；② 点「读已接受正文」读到 Canon 的 R4 正文，点「写回稿子」后**草稿文件里就是那段 Canon 正文**（探针读文件核对），随后草稿已按 sha256 还原；③ 徽标 6 → 7。console 未捕获错误 0。
> - **与工作单的一处偏差**：工作单把「sessionId undefined 时点接受不调用 submitReview + notice」放在 canvas spec；我放在 `novel-workbench-review.spec.ts`，因为那里已经有 `buildReviewProposal` 的 fixture 与挂载 NovelCanvas 的现成写法，放 canvas spec 要复制一整套 fixture。行为覆盖相同。
> - **只有单测覆盖**：无 session 的审阅横幅 —— 这个 profile 始终有选中的 session，CDP 没法把它拿掉，真机不可达。
> - **门禁**：`corepack pnpm test` **486 passed / 34 files**（478 + 8 新增），typecheck / lint / `git diff --check` / `port-prototype-css --check` 全 0；rebuild + smoke exit 0；`lib/client.js` 1,620,210 B。
> - **副作用已清理**：A4 真机验证提交了几次，产生的待审提案已全部移除；存储回到验收前状态（accepted revision 5、6 条待审、全部是 2026-09-17 的）；草稿文件 sha256 未变。

#### A5 写作入口（F4 + S3）✅ 2026-09-18 完成

- **涉及文件**：新增 `packages/novel-workbench/src/client/NovelLanding.tsx`；`NovelCanvas.tsx`（editor 分支重构：outline 常驻 + 引导卡 + 错误卡）；`NovelEditor.tsx`（无线程提示加动作）；`chapter-files.ts`（`planChapterRequest` 纯函数）；`novel-data.ts`（face 加 `sendToThread`，复用 L1452-1457 `beginSubmission({mode:'queue',...})` 同款，**不自建投递**）；`NovelTopbar.tsx`（M1）；`tests/novel-workbench-chapter-files.spec.ts`、`tests/novel-workbench-editor.spec.ts`、新增 `tests/novel-workbench-landing.spec.ts`、新增 `tests/novel-workbench-topbar.spec.ts`。
- **RED**：① chapter-files spec——`planChapterRequest()` 命名 `novel-architect` 技能（已核实存在于 `packages/novel-planning/src/index.ts:129`）、要求只产提案、明说「不要直接改 Canon」。② landing spec——outline 有章节未选章 → 引导卡（`data-novel-landing`）：前 3 章（编号/标题/状态，可点进编辑器），副标题不含 workdir/Canon；全部已接受时另有「让 AI 规划下一章」。③ outline 章节数为 0 → 「让 AI 规划第一章」按钮，点击无 session 先 `newThread(workId)` + `openDetails()`，有 session 出确认卡、确认后 `sendToThread(sessionId, planChapterRequest(...))`。④ editor spec——无线程时提交/提炼提示行各带 `data-novel-editor-open-thread` 按钮，点击调新 prop `onOpenThread`，不调 submit/refine。⑤ topbar spec——无 session 点「对话」→ `newThread(workId)` + `openDetails()`；有 session 维持原 toggle。
- **GREEN**：`NovelLanding.tsx` 引导卡（样式复用 `.nw-map-empty`/`hero-card`，文案遵守 brief §6 动词开头无术语）；「让 AI 规划」确认卡复用 NovelEditor 确认卡模式（边界承诺句：「规划也只产出提案，你逐条接受后才写进故事」）。`NovelCanvas` editor 分支：outline 常驻加载（effect deps `[state.view, workId, loadOutline, state.revision]`，去掉 chapterId 门）；`editorChapter` 改 `useMemo(() => outline.find(chapterId))` 纯派生，**消灭 L366-393 异步竞态**；渲染顺序：`editorProblem` → 错误卡；outline 空 → 规划卡；未选章 → 引导卡；否则 NovelEditor。`NovelEditor` props 加 `onOpenThread`。`novel-data.ts` face 加 `sendToThread(sessionId, text)`（与 resend 共用 beginSubmission）。`NovelTopbar` 对话按钮无 session 时开线程。
- **真机验证**：walkthrough step 1 复跑：落地引导卡截图；隔离作品验证「让 AI 规划第一章」端到端（只验收请求与提案到达收件箱，**不验收 Canon 变化**）；断 session 验证提交提示按钮开线程。
- **验收**：A5 + A9。

> **✅ 2026-09-18 完成。** 证据：[`docs/evidence/2026-09-18/A5/`](../docs/evidence/2026-09-18/A5/)（`a5-summary.json` verdict `pass`、`probe-a5.mjs` 可复跑、3 张截图）。
>
> - **实现**：新增 `chapter-files.ts` 的 `planChapterRequest(revision)`（命名 `novel-architect`、只规划到第一章、只产提案）；新增 `NovelLanding.tsx`（有章节 → 前 3 章可点开；无章节 → 让 AI 规划第一章；全部已接受 → 让 AI 规划下一章；确认卡带边界承诺句）；`NovelCanvas` editor 分支的 outline 改为**常驻加载**（去掉 `chapterId` 门，`chapterId` 变成读取里的分支），渲染顺序：错误卡 → notice → 「正在读取作品目录…」 → `NovelLanding` → `NovelEditor`；`novel-data.ts` face 加 `sendToThread(sessionId, text)`，与提交/提炼**共用同一条 `beginSubmission` 投递**，不自建通道；`NovelEditor` 加 `onOpenThread`，无线程时的提交/提炼提示行各带「开一条线程」按钮；`NovelTopbar` 的「对话」在无 session 时改为 `newThread(workId) + openDetails()`。
> - **与工作单的两处偏差**：① 工作单写 `planChapterRequest()` 无参；我加了 `revision`，因为它和另外两个请求一样要带 `expectedRevision`，而提案本身也带这个字段（工作单 RED ③ 里写的是 `planChapterRequest(...)`，说明参数是被预期的）。② 工作单说「outline 空 → 规划卡」独立于引导卡；我让 `NovelLanding` 同时承担这两种状态——它们问的是同一个问题「现在写什么」，分成两个组件只会让两条分支重复。
> - **门禁**：`corepack pnpm test` **498 passed / 36 files**（486 + 12 新增：chapter-files 2、landing 6、editor 2、topbar 2），typecheck / lint / `git diff --check` / `port-prototype-css --check` 全 0；rebuild + smoke exit 0；`lib/client.js` 1,632,020 B。
> - **真机**：新 profile（localStorage 为空）打开 写作 → 落地卡「选一章开始写。」+「第1章 开篇章 待审」，**无 Canon / workdir / R5 / expectedRevision 泄漏**；点该章真的打开编辑器。console 未捕获错误 0。
> - **真机未验（如实记录）**：① **「让 AI 规划第一章」的端到端**没有跑 —— 这台机器的作品里第 1 章是**待审**，产品因此**正确地不提供**「规划下一章」（这是对的行为，探针已断言它不出现）；要跑到规划卡需要一部**空作品**，那要新建作品（改作品注册表 + 新 Canon），比上次那个夹具更重，没有做。请求文本与确认卡由单测覆盖。② 无 session 的审阅横幅、编辑器里的「开一条线程」按钮，同样只有单测（与 A4 同因：这个 profile 始终有 session，且没有 UI 可以取消选中章节）。
> - **副作用**：本增量没有提交任何请求、没有改动 Canon、没有写草稿文件 —— 探针只点开了一章并读屏。

#### A6 文案（S1 + S2 + 副标题人话）✅ 2026-09-18 完成

- **涉及文件**：`NovelEditor.tsx`（确认卡文案）；`NovelCanvas.tsx`（VIEW_HEAD L92 editor 副标题）；`tests/novel-workbench-editor.spec.ts`（改断言）；`scripts/smoke-workbench.mjs`（加文案泄漏检查）；composer 查证证据落 `docs/evidence/2026-09-18/composer-locale/`，落点 `index.tsx`（locale 注入）与/或 `WorkbenchFrame.tsx`（FRAME_CSS）。
- **RED**：editor spec——确认卡文本断言 `not.toContain('Canon')`、`not.toMatch(/R\d+\s*对齐/)`、`not.toContain('workdir')`，含关键语义「逐条」「接受」「故事内容不会变」；保留「未确认不发请求」既有断言。smoke——加作者面文本泄漏检查（仿 cast-prints-canon-keys 先例），断言不含 `Canon`/`workdir`/`Describe what you want to build`。
- **GREEN**：确认卡改写（措辞可微调，断言为准）：「把第1章《开篇章》的草稿（18 字）交给 AI 整理成一份提案。草稿先存盘；AI 会把设定变化整理成一条条待你决定的建议，放进提案收件箱。**在你逐条接受之前，故事内容不会有任何变化。**」版本信息去掉「R5 对齐」。VIEW_HEAD 副标题改「选一章开始写，稿子自动保存在你自己的文件夹里」。composer 先查证（词表覆盖范围 + DOM 结构）；能走 locale seam 就走 locale 注入；`::placeholder` 不能改文字；**官方 seam 封闭 → 停止条件 #1**，本轮其余部分照常交付。
- **真机验证**：walkthrough step 6 复跑截图（确认卡无术语）；01 截图右栏复查；smoke 泄漏检查 exit 0。
- **验收**：A6 + A9。

> **✅ 2026-09-18 完成。** 证据：[`docs/evidence/2026-09-18/composer-locale/`](../docs/evidence/2026-09-18/composer-locale/)（`findings.md` + `probe-locale.mjs` 可复跑）、`docs/evidence/2026-09-18/walkthrough/`（step 6 复跑截图与 summary）。
>
> **S2 查证结论：不是产品缺陷，停止条件 #1 不成立，本轮不做 locale 注入。** profile 里装的 `@deepseek-ai/dsh-client-ui-conversation` 自己 `locale.register('conversation', …)`，placeholder 是**词条** `placeholder.hero`，zh 与 en 两本词典键集一致（源码注释：*English dictionary, checked complete against the zh key set*）。屏幕上出现英文的唯一原因是 locale 解析成了 `en`，而 locale 运行时**只对「浏览器没报出任何已注册语言」的浏览器**回落到英文。实测：本机 `navigator.languages` 就是 `["zh-CN","zh"]`，**带不带 Accept-Language，composer 都是中文**。更强的一条：把整个 `docs/evidence/` 搜一遍，`Describe what you want to build` **只出现在本增量新增的文件里**，而中文 placeholder 出现在 2026-09-17 起的多份旧证据里——**这条前提从记录上复现不出来**。那一行上确实有英文，是**模型自己的名字**（`Deep… High`，provider 数据），旁边的档位标签是本地化的（「标准模式」）。
>
> **顺带修掉一个真问题：走查探针的浏览器。** 它不带 `Accept-Language`，测的是一个作者不会有的浏览器；A6 的「作者面不得出现英文」断言若建立在它上面就是无效证据。已在走查探针与 smoke 的 Chrome 参数里加 `--accept-lang=zh-CN,zh;q=0.9`，并给 smoke 加了作者面文案泄漏检查（`author copy: …`，仿 `cast-prints-canon-keys` 先例，排除进阶面；比对画布标题、副标题与 composer placeholder，**不比对正文**——正文里的话是作者和模型说的）。
>
> **S1 与副标题（两处真缺陷，已修）**：确认卡从「…作为一份提案提交，和已接受版本 R5 对齐。…Canon 不会因为这一步改变——只有你在审阅里逐条接受，它才动」改成「…交给 AI 整理成一份提案。草稿先存盘。AI 会把这一章的设定变化整理成一条条建议，放进提案收件箱。**在你逐条接受之前，故事内容不会有任何变化。**」；编辑器副标题从「这一章的草稿文件 · 自动保存到你自己的 workdir，接受后才进 Canon」改成「这一章的稿子 · 自动保存在你自己的文件夹里」。
> - **与工作单的一处偏差**：工作单给的副标题是「选一章开始写，稿子自动保存在你自己的文件夹里」——那句描述的是**没有选中章节**时的屏幕，而那个状态在 A5 之后归 `NovelLanding` 管；编辑器副标题只在**已经选中一章**时出现，所以说的是「这一章的稿子」。
> - **门禁**：`corepack pnpm test` **499 passed / 36 files**，typecheck / lint / `git diff --check` / `port-prototype-css --check` 全 0；rebuild + smoke exit 0（`author copy: no plumbing words on our lines · composer "发消息或做任务… / 调用指令 @ 文件或对话"`）；`lib/client.js` 1,632,011 B。
> - **真机**：走查 step 6 复跑，确认卡文本已是上面那版；step 13 console 未捕获错误 0。走查探针会往草稿里打字，已按 sha256 还原（`c2d819ea…`）。

### Phase B — 体验（P1，A 完成后按序）

#### B1 transcript 上下文注入过滤（S6）

- **涉及文件**：`transcript-data.ts`；`tests/novel-workbench-transcript.spec.ts`；`scripts/smoke-workbench.mjs`。
- **RED**：entries 含以 `Current runtime context` 开头的 user/message → `transcriptOf` 输出不含该行；作者行中间含该短语仍保留；纯函数 `isInjectedContextText(text)` 前缀判定（trim 后 startsWith）。
- **GREEN**：`transcriptOf` 的 user/message 分支（L124-129）加一行判定跳过。**`rememberSubmission` 无需改动**——`index.tsx:206-213` 扫描的是已归约的 transcript，过滤自动生效（一处过滤两处受益）。
- **真机验证**：真实线程截图：注入行不再出现；失败重试条带显示作者原句。
- **验收**：A7 的 transcript 部分。

#### B2 钉位持久化（E3 勘误版）

- **涉及文件**：`store.ts`；`StoryMapView.tsx`；`tests/novel-workbench-prefs.spec.ts`、`tests/novel-workbench-story-map.spec.ts`。
- **RED**：prefs spec——`mapPins` 切片 `{ 'w1#guchen': {x:1,y:2} }` 往返存活、非有限数/非对象条目被丢弃。refineMode 回归护栏：**预期直接绿，按 TDD 规则先定点破坏证明能咬人**（把 hydrate 的 REFINE_MODES 去掉 'while-writing' 跑红一次再还原）。story-map spec——pins 存进 store 后 remount 钉位仍在。
- **GREEN**：store 加 `mapPins: Readonly<Record<string, {x:number;y:number}>>` + `setMapPins`；dehydrate/hydrate 逐条校验；`StoryMapView` 加 `workId` prop，pins 初始值按 `${workId}#` 前缀过滤，`upNode` 回调改 `setMapPins`（合并），「解除全部钉位」清该前缀切片。
- **真机验证**：拖钉位 → 刷新 → 探针断言坐标不变。
- **验收**：A8。

#### B3 线程降噪（S4 不动 Canon 部分）

- **涉及文件**：`NovelRail.tsx`；`tests/novel-workbench-rail.spec.ts`。
- **RED**：origin 为 agent 的会话进「其他会话」折叠组（`data-novel-threads-others`，展开前不可见）；origin 为 user 的进主列表；origin 字段缺失按作者线程对待（不隐藏）。**先 grep `dsh-api-session-controller` 的 `SessionSummary.origin` 枚举做实，不能猜。**
- **GREEN**：`threadRows`（L403-413）拆两桶；主列表保持 VISIBLE_THREADS=5 折叠；others 组一行「其他会话 N 条」可展开。不删任何会话。D1（置顶/归档/重命名）不动，进 C1。
- **真机验证**：走查截图左栏默认折叠态不再出现「把 ok 写入指定文件」。
- **验收**：A7 的线程部分。

#### B4 骨架屏 + 探针修复（E2 + E7）

- **涉及文件**：`NovelCanvas.tsx`（各分支加载态）；`docs/evidence/interaction-2026-09-18/probe-views.mjs`（探针修复）；`scripts/smoke-workbench.mjs`。
- **RED**：canvas spec——各视图数据未到时渲染 `.sk-line`/`.sk-card` 骨架（样式已在 `workbench-css.ts:337-341`），错误态不渲染骨架。地图键盘：**先查证后定 RED**——确认「unreachable」判据是探针以「全部可 Tab」为标准、产品是正确 roving tabindex 模式；若 roving 焦点真落不上则改产品（每座位 tabindex=0），不得猜。
- **GREEN**：骨架屏替换「正在读取…」纯文本（保留 `data-novel-canvas` 标记）；探针文本采集过滤 STYLE/SCRIPT 节点（真实屏幕阅读器不读 `<style>`，此为探针缺陷，证据写进修复说明）；地图键盘按查证结果二选一：修探针为「焦点落第一个座位 → ArrowRight 遍历 → Enter 选中 → d 开档案」走查断言，或修产品。
- **真机验证**：probe-views 复跑：`unreachable: []`、editor 视图文本无 `[data-novel-canva` 前缀、切换截图有骨架。
- **验收**：E2 + E7 关闭（含证据）。

#### B5 编辑器头部瘦身（E1，走原型流程）

- **涉及文件**：`docs/prototypes/2026-09-16-novel-mode/novel-mode-workbench.html`（结构改动源）；`scripts/port-prototype-css.mjs`（重生成）；`workbench-css.ts`（生成物）；`NovelEditor.tsx`（头部 JSX）；`tests/novel-workbench-editor.spec.ts`；`scripts/smoke-workbench.mjs`。**串行在 A3 之后（同一头部）。**
- **RED**：头部一级子元素 ≤5：章节名、模式切换、状态·字数（合并）、提交本章（primary）、「···」溢出按钮（`data-novel-editor-more`）；溢出菜单内 `data-novel-editor-continue` 与 `data-novel-editor-refine` 存在；Escape 关闭菜单。
- **GREEN**：**先改原型 HTML 的编辑器头部标记与样式，再跑 port-prototype-css.mjs 生成**（设计来源规则，不许直接手改生成物）；NovelEditor 头部 JSX 改「章节名+模式切换 | 状态·字数 | 提交本章 | ···（续写/重新提炼/读已接受正文若有）」；菜单用按钮 + 绝对定位浮层 + Escape/外点关闭（复用 dialog-focus 思路，不引依赖）；**所有既有 `data-novel-editor-*` 标记必须保留**（smoke/探针依赖）。
- **真机验证**：walkthrough step 3 复跑：一级元素 ≤5、窄窗不溢出；step 6 互斥仍成立。
- **验收**：E1 关闭 + A9（含 port-prototype-css --check）。

#### B6 补全失败可观测（E5）

- **涉及文件**：`NovelEditor.tsx`（L241-249）；`NovelThreadNotice.tsx`（L93）；`tests/novel-workbench-completion.spec.ts`、`tests/novel-workbench-failure.spec.ts`。
- **RED**：completion spec——`requestCompletion` reject 后出现 `data-novel-completion-failed` 提示（「刚才的句子建议没生成出来」），4 秒后自动消失（fake timers）；成功路径不出现。failure spec——resend reject 后 notice 显示「重试没发出去，可以再点一次。」。
- **GREEN**：NovelEditor 加 `completionFailed` state + 自动清除 timer；NovelThreadNotice 加 `resentProblem` 本地 state。**可选子增量 B6b**（落日志事件 `novel/completion/failed`，`{ignorable: true}` + `registerLogEventType`）：先查证客户端 `Session.append` seam 是否可达；需要动 novel-project 端 → 停止条件 #4 先问站艺。
- **真机验证**：探针 stub 补全 RPC 拒绝 → 编辑器提示截图；恢复后正常。
- **验收**：E5 关闭。

#### B7 设置面板分组（E8）

- **涉及文件**：原型 HTML（设置面板结构）；`port-prototype-css.mjs`（重生成）；`NovelSettings.tsx`；`tests/novel-workbench-settings.spec.ts`。**串行在 B5 之后（共用原型文件）。**
- **RED**：面板含「阅读」与「AI 协作」两个组标题，9 个控件及其 `data-novel-settings-*` 标记全部仍在。
- **GREEN**：原型 HTML 加组标题结构与样式 → 重生成 CSS；NovelSettings JSX 按「阅读（主题/正文大小/行宽/缩进/行高）· AI 协作（句子续写/续写等待/工具活动/提炼时机）」重排。文案已合格，不动。
- **真机验证**：settings-night 探针复跑截图。
- **验收**：E8 关闭。

### Phase C — 决策与收口（P2）

#### C1 六张决策卡（D1–D6，零代码）

- 新增 `tasks/decisions-2026-09-18.md`，每节：现状（引用证据路径）/ 选项（含「不做」）/ 各选项代价（工作量/风险/边界冲突）/ deepseek flash 的建议（决定权在站艺）。D5 清理草稿是写操作、D6 属 Canon 语义——**批复前绝对不做**。
- **验收**：站艺逐条批复，批复结果回写本计划对应增量的「前置」处。

#### C2 视觉密度观感走查

- 日/夜各 8 屏（三栏常态 + 窄窗 1280/1024 + 引导卡 + 编辑器 + 确认卡 + 审阅 + 设置），证据落 `docs/evidence/2026-09-18/density/`。**只测量不修改**——未测量的样式不做微调；顺带确认 E10（审阅兜底跨章）是否误导，误导则在 A4 收尾加章名标注。
- **验收**：16 张截图 + 站艺/作者过目记录。

#### C3 工程收口

- `tasks/todo.md` 顶部补一节本计划状态（各增量完成/进行中/挂起，parity 口径）；`docs/evidence/2026-09-18/` 证据归档整理；全部门禁最后一轮；`git status --short` 清点并**不提交**；本计划顶部回写完成度。
- **验收**：A9 全绿 + 证据索引可读。

---

## 4. 执行规约（deepseek flash 每轮遵守）

### 4.1 每轮固定动作

1. `git status --short`（读第一列，本 checkout 可能有预暂存内容）。
2. 读 `AGENTS.md` + `tasks/editor-first-frontend-2026-09-17.md` §0–§2 + 本文件 §1–§2。
3. 取本文件**第一个未勾选**增量开工（顺序：Phase 0 → A1 → A2 → A3 → A4 → A5 → A6 → B1 → B2 → B3 → B4 → B5 → B6 → B7 → C1（A6 后可随时穿插）→ C2 → C3）。
4. 跑基线：`corepack pnpm test`；`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4780/` = 401。

### 4.2 TDD 与门禁（每个增量）

RED（先写测试跑出失败并保存失败原因；首次即绿做定点破坏证明测试能咬人）→ GREEN（最小实现）→ REFACTOR → 门禁：

```bash
corepack pnpm test && corepack pnpm typecheck && corepack pnpm lint && git diff --check
scripts/dev-host.sh rebuild && node scripts/smoke-workbench.mjs   # 改了产品源码时
node scripts/port-prototype-css.mjs --check                       # 改了原型 HTML 时
```

体积护栏：`packages/novel-workbench/lib/client.js` ≤ 2,400,000 B raw（当前 1,598,712 B）。

### 4.3 真机验证规约

- **每个改可见面的增量，必须复跑对应 CDP 走查探针并附新截图**——「spec 绿」不够（教训：spec 看不见文案与观感）。
- 走查环境：沙箱 Chrome 需 `--no-sandbox --disable-gpu --remote-allow-origins=*`；注意 `--disable-gpu` 会让地图走降级卡，这本身是 A1 的验收环境。
- 探针规约：产生的草稿文件结尾删除或还原，summary 记录 sha256 before/after。

### 4.4 停止条件（停下问站艺）

1. A6 composer 查证结论是官方 seam 完全封闭（locale 不覆盖、DOM 不可稳定命中，且不自研 composer）。
2. D1–D6 全部：决策卡交站艺，批复前不动对应代码；D5 清理草稿文件是写操作、D6 属 Canon 语义，未批复绝对不做。
3. 改 Canon 语义 / DSH 版本 / 碰 `~/.dsh` / commit·push·发布——一律停下。
4. B6b 需要 novel-project 端新增事件声明或 append seam 不可达。
5. 需要引入新依赖（本计划刻意零新依赖），或 `lib/client.js` 超 2,400,000 B。
6. 出现「必须删除/弱化有效测试才能绿」。
7. A5 的 `novel-architect` 技能契约无法从仓库查实（已核实存在于 `packages/novel-planning/src/index.ts:129`，实现时若发现不支持首章规划）。

### 4.5 绝不做

为绿灯删/弱化测试；mock 冒充完成；未验证宣称 verified；补全/续写/提炼结果直写 Canon；自研 composer/agent/session/transport；**以「rendered」当验收**（验收是 §2 的 A1–A9 人类标准）。

---

## 5. 依赖与优先级总览

**必须串行**（同一文件/同一产物）：
- A2 → A3（同改 NovelEditor.tsx；A3 的 load 重置建立在 A2 的 saveNow/effect 重构上）。
- A1 → A4/A5（同改 NovelCanvas.tsx，需先有边界与降级）。
- A4 → A5（同改 NovelCanvas + novel-data face）。
- A5 → A6（同改 VIEW_HEAD 与 NovelEditor 文案区）。
- A3 → B5（B5 重排的头部正是 A3 加过按钮的头部）。
- B5 → B7（共用原型 HTML 与生成器）。
- C2 → C3（收口以走查证据为输入）。

**可交换顺序（不同文件、无结构冲突）**：A1 ∥ A2；B1、B3、B6 与任意增量（transcript-data / NovelRail / editor 相对独立）；C1 与 B 全系列。

| 序 | 增量 | 修的问题 | 类型 | 规模 |
| --- | --- | --- | --- | --- |
| 0 | Phase 0 基线 | — | 只读 | 10 步 |
| 1 | A1 错误边界+降级 | F1 | 修复 | 中 |
| 2 | A2 丢稿三连 | F2 | 修复 | 中 |
| 3 | A3 提交链路 | F3a E1 E6 | 修复 | 中 |
| 4 | A4 协作闭环 | F3b F3c F3d | 修复 | 大 |
| 5 | A5 写作入口 | F4 S3 M1 | 新界面 | 大 |
| 6 | A6 文案 | S1 S2 | 查证+文案 | 中（查证有分叉） |
| 7 | B1 transcript 过滤 | S6 | 修复 | 小 |
| 8 | B2 钉位持久化 | E3 | 修复 | 小 |
| 9 | B3 线程降噪 | S4 | 修复 | 中 |
| 10 | B4 骨架+探针 | E2 E7 | 修复 | 小 |
| 11 | B5 头部瘦身 | E1 | 结构 | 中（走原型） |
| 12 | B6 补全反馈 | E5 | 修复 | 小 |
| 13 | B7 设置分组 | E8 | 结构 | 小（走原型） |
| 14 | C1 决策卡 ×6 | D1–D6 | 决策 | 无代码 |
| 15 | C2 密度走查 | E10 复核 | 证据 | 只读 |
| 16 | C3 收口 | — | 流程 | 无代码 |

**挂起（维持既有查证结论）**：只看本卷筛选（Canon 单卷、`manuscriptOrder` 全 null）；人物 name 根治（D6 批复前）；S5 短期缓解（提示词补 name 要求）可并入任意 A 增量顺手做，但显示层「未命名人物」等 D6 批复后再定。

---

## 6. 给 deepseek flash 的第一句话

> 读 `AGENTS.md` 与 `tasks/editor-first-frontend-2026-09-17.md` §0–§2，然后按本计划 **Phase 0** 的 10 步确认基线（HEAD `33879fb`、456/456、未提交增量保留不动），取第一个未勾选增量 **A1** 开工。
> 测试是绿的，但作者会死白、丢稿、提交一次按钮就没了、agent 落了提案没人告诉他、接受了的正文没地方读——你修的是这些。
> 每个增量：RED → GREEN → 门禁 → 走查探针复跑对应 step 附截图。验收标准是 §2 的 A1–A9，不是「rendered」。
