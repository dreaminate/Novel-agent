# 编辑器优先的前端重做 — 全量执行计划（2026-09-17）

**这份文件是什么：** 一次 grill 后形成的共识与增量清单，供 loop 逐轮执行。**它同时是给实现者的规格**：
每一轮 loop 读它、取下一个未勾选项、按 RED → GREEN 做完、跑门禁、回写勾选、提交。

**基线：** 主 checkout `/Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent`，HEAD `8926e31`，
324 测试绿；host `127.0.0.1:4780`（`scripts/dev-host.sh` 管，profile `novel`）。
**不要在这个会话被 fork 出的旧 worktree 里开工**（它停在 `a3be81c`，缺 6 个提交）。

---

## 1. 共识：这次改什么

原型（`docs/prototypes/2026-09-16-novel-mode/`）是**基线，但不是终点**——作者自评 80 分。这次是
「手写编辑器成为主工作面」的重做，不是给现有界面打补丁。

| # | 决定 | 后果 |
| --- | --- | --- |
| 1 | 四块痛点（对话面 / 左栏 / 画布信息 / 密度）加各种小细节全都要动 | 整体设计过一遍 |
| 2 | 以原型为基线，差的 20 分在设计层一起修 | 不把原型当不可动的稿 |
| 3 | 节奏：边写边改，不单独交付设计稿 | 每轮 loop 直接落到实现 |
| 4 | 结构类改动回写原型 HTML 再重生成 CSS；观感微调直接改 `workbench-css.ts` | 见 §3 的设计来源规则 |
| 5 | **审批卡自研，排在最前** | 官方审批只由被我们禁用的 `ui-chat` 提供，可能是回归 |
| 6 | 线程视图里官方会话面**不再渲染** | 官方只留不可见服务（输入机 / 草稿队列 / 流 / 审批服务 / 会话装配） |
| 7 | 手写正文 = workdir 里的**章节文件**；点「提交本章」才作为 Result Packet 进提案收件箱 | Canon 仍是唯一事实源，作者手稿不被锁进 Canon |
| 8 | 自动提炼做成**模式**：默认「提交本章时跑 + 可手动重跑」，另有「边写边提炼」 | 提炼只产出提案 |
| 9 | **补全与续写两层都留**：句级灰字（Tab/Esc）+ 段级续写面板（带情节灵感） | 两个 AI 入口，粒度不同 |
| 10 | **编辑器是主画布**，对话是可收起右栏；故事画布仍走左栏，不再默认落地在地图 | 落地页从地图改为编辑器 |
| 11 | 编辑器用 **Tiptap / ProseMirror（MIT）** 富文本 | 灰字与高亮用 decoration |
| 12 | `/` 与 `@` **复用官方触发管道、只换渲染**；`@` 加一组「人物与章节」 | 不建第二套输入机 |
| 13 | **正文阅读并入编辑器的阅读模式**，不再单独占一个画布 | 一个文档两种状态：写作 / 阅读 |
| 14 | 前端设计可用 OpenDesign MCP 产出与迭代 | 产物收进 `docs/prototypes/` |

**与原型冲突、按上表覆盖的地方：** 原型「打开即故事地图」→ 编辑器优先；原型对话在独立线程页 →
并进编辑器右栏；原型无补全与自动提炼 → 新增；原型把权威放在地图 → 权威跟着正文走。

---

## 2. 不可违反的硬约束

来自 [`AGENTS.md`](../AGENTS.md) 与 [`tasks/plan-final.md`](plan-final.md)，每一轮 loop 都要守：

- **Canon 唯一事实源。** 只有作者接受的变更进 Canon。补全、续写、提炼**一律只产出提案**，
  绝不直接写 Canon；不接受就丢弃，Canon hash 不变。
- **H1 分界。** 所有看得见的界面由 novel-agent 自渲染；不可见的客户端服务（会话装配、输入状态机、
  草稿/队列、图片缓存、设置命名空间、theme runtime、传输与模块系统）复用官方实现，**不重写**。
- **不建第二套** Agent / Session / Workspace / 事件 / 审批 / 权限 / 设置 / 凭据 / 插件 / transport。
- **严格 TDD。** 每个行为变更 RED → GREEN → REFACTOR；一个增量约 1–5 个文件；两到三个增量一个 checkpoint。
  不删除、跳过、弱化或改写有效测试来换绿灯。
- **DSH 版本锁定 `0.1.2-rc.1`**，只带本仓库那个已授权的 session 补丁；不混版本、不升 alpha。
- **凭据边界。** 密钥/Token 只走 DSH Credentials seam；不写进模型可读文件、事件、日志、截图、fixture。
  危险或不可逆操作必须走真实 DSH approval。
- **开源复用门禁。** 引入新依赖前记录：仓库、精确版本、许可证、install script、传递依赖、
  维护状态、bundle 体积实测，并同步 `THIRD_PARTY_NOTICES.md` 与 `docs/upstream-sources.md`。
- **不提交、不 push、不发布、不部署**——除非用户当轮明确要求。**绝不碰用户全局 `~/.dsh`。**
- **不修改规格原文、`.i18n.yaml`、`graphify-out`。**

### 设计来源规则（决定 4 的展开）

- `packages/novel-workbench/src/client/workbench-css.ts` 是**生成物**，由
  `scripts/port-prototype-css.mjs` 从 `docs/prototypes/2026-09-16-novel-mode/novel-mode-workbench.html` 生成，
  并有 `--check` 门禁。**直接手改它能通过一时，下次谁跑生成器就覆盖掉。**
- 所以：**结构性改动**（信息架构、屏幕划分、组件构成、布局骨架）先改原型 HTML，再跑生成器；
  **纯观感微调**（间距、密度、颜色、字号）直接改 `workbench-css.ts`，并**同时**在原型 CSS 里做同样改动
  以免下次重生成时回退。
- 若换用新的原型文件（例如 OpenDesign 产出的 v2），**必须同步改 `scripts/port-prototype-css.mjs` 里的
  `prototypePath`**，并在 `tasks/todo.md` 记录切换理由与日期。
- OpenDesign 产出的设计，收进 `docs/prototypes/<date>-<name>/`，并记录 SHA256 与来源。

---

## 3. 阶段与增量

每个增量的格式：**目标 / 主要文件 / RED / GREEN / 验证**。未勾选项就是 loop 的待办队列。

### Phase 0 — 开工准备

- [ ] **I0.1 基线确认** — 目标：确认主 checkout、host、测试与扫描基线，避免在错的地方开工。
  - 文件：无（只读）
  - 验证：`git log --oneline -1` = `8926e31`；`git status --short`（**读第一列**，本 checkout 有预暂存内容）；
    `corepack pnpm test` 324 绿；`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4780/` = 401；
    `node scripts/smoke-workbench.mjs` exit 0。把结果写进本节下方一行基线记录。

- [ ] **I0.2 编辑器选型记录** — 目标：Tiptap/ProseMirror 栈的选型证据，含**体积实测**，否则不许引依赖。
  - 文件：`docs/open-source-evaluations/editor-stack-2026-09-17.md`（新）、`THIRD_PARTY_NOTICES.md`、
    `docs/upstream-sources.md`、`packages/novel-workbench/package.json`
  - RED：先量**未引入**时的 `packages/novel-workbench/lib/client.js` 原始与 gzip 体积并记录。
  - GREEN：隔离 esbuild 对照量 `@tiptap/react + @tiptap/starter-kit + @tiptap/pm` 的 minified/gzip；
    审阅全部 install script 与传递依赖许可证；记录精确版本。若总体积超过当前 client.js 的 2 倍，
    停下来把数字写给用户再决定（这是**需要人介入的信号**，见 §5）。
  - 验证：选型记录里每个数字都有可复现命令；`pnpm-lock.yaml` diff 已审阅；
    `corepack pnpm test`、`typecheck`、`lint` 仍绿。

### Phase 1 — 审批面（安全优先）

- [ ] **I1.1 RED：确认审批回归** — 目标：用证据证明「现在没有审批渲染者」，而不是靠推断。
  - 文件：`docs/` 下的证据记录（新）
  - RED：在**隔离 profile**（`.novel-agent/dsh-home` + 新 profile）里驱动一次真正需要审批的操作
    （例如需要 approval 的 shell/文件写入），记录：操作是否卡住、有没有出现审批 UI、DOM 里有没有
    可应答控件。已知事实：`dsh-user-approval` 无客户端半边；整个 `@deepseek-ai/` 里客户端提到
    approval 的只有 `dsh-client-ui-chat`，而它被我们的 bundle patch 禁用。
  - 验证：RED 证据落盘（截图/DOM dump/日志），并注明这是**回归**还是**从未有过**。

- [ ] **I1.2 GREEN：自研审批卡** — 目标：作者看得见「批准什么」，并能真实应答。
  - 文件：`packages/novel-workbench/src/client/ApprovalCard.tsx`（新）、`index.tsx`（挂载）、
    `packages/novel-workbench/tests/novel-workbench-approval.spec.ts`（新）
  - 要求：渲染在 frame 的 overlay 座位（`shell.overlay`）之上；展示审批对象与**要批准的具体内容**
    （命令/参数/路径）；提供真实 DSH approval 的应答动作；**复用官方 approval 服务与 respond 路径**，
    不建第二套机制；危险键与普通键分清；Esc 不得等价于批准。
  - 验证：spec 覆盖（含拒绝路径与键盘）；真机 smoke 看到卡片；隔离 profile 里那次需要审批的操作
    能被真实批准并通过。

- [ ] **I1.3 审批可访问性** — 目标：键盘可达、焦点管理正确，且不与其它 overlay 抢焦点。
  - 文件：`ApprovalCard.tsx`、`novel-workbench-approval.spec.ts`、必要时 `WorkbenchFrame.tsx`
  - 验证：Tab 顺序、焦点环、Esc 关抽屉/弹层的既有约定不被破坏；spec 绿。

### Phase 2 — 对话面自研

- [ ] **I2.1 消息流** — 目标：自渲染用户/助手消息与流式增量，替换官方会话面的排版。
  - 文件：`packages/novel-workbench/src/client/NovelTranscript.tsx`（新）、`transcript-data.ts`（新）、
    `NovelCanvas.tsx` 或 `WorkbenchFrame.tsx`（接线）、对应 spec（新）
  - RED：先写「给定一组会话消息渲染出 N 条消息与流式追加」的 focused test，证明当前没有这个面。
  - 要求：数据只从官方会话绑定读取（`binding` / `eventSource`），**不新建消息存储**；
    正文用阅读排版（衬线/行高/行宽沿用 `--read-*` token）；长文、段落、中文标点正常。
  - 验证：spec 绿；真机 smoke 里线程视图出现自渲染消息流。

- [ ] **I2.2 工具行与失败重试** — 目标：工具调用渲染成**人话行**，失败态可重试。
  - 文件：`NovelTranscript.tsx`、`novel-workbench-failure.spec.ts`（扩展）
  - 要求：不用工程术语；已有「上次生成失败 + 重试上一句」的条带行为并入消息流，不重复两处。
  - 验证：spec 绿；失败回合真机可见。

- [ ] **I2.3 `/` 与 `@` 候选菜单** — 目标：拆掉「请切到线程输入」的挡板，复用官方管道只换渲染。
  - 文件：`NovelComposer.tsx`、`novel-workbench-composer.spec.ts`（扩展）
  - 要求：`/` 列出官方全部命令（compact / export / feedback / goal / permission / plan / model）；
    `@` 在官方文件候选之外加一组「人物与章节」（来自 Canon）；候选数据来自官方触发管道，
    **不重建输入状态机**；键盘上下选、Enter 确认、Esc 取消。
  - 验证：spec 绿；真机敲 `/` 与 `@` 都能出候选并可用。

- [ ] **I2.4 停用官方会话面** — 目标：线程视图不再渲染官方 conversation seat；不可见服务照旧。
  - 文件：`packages/novel-workbench/cordis.patch.yml`、`index.tsx`、相关 spec
  - 前置：I2.1–I2.3 全部绿且真机验证过——**否则会丢掉作者还在用的能力**。
  - 验证：线程视图无官方启动页、无重复输入框；`/` `@` 仍可用；真机 smoke 全绿。

### Phase 3 — 编辑器成为主工作面

- [ ] **I3.1 章节文件模型** — 目标：正文以 workdir 里的章节文件为草稿载体。
  - 文件：`packages/novel-workbench/src/client/chapter-files.ts`（新）、`novel-data.ts`（扩展）、spec（新）
  - 要求：读写走 DSH 的 fs/workspace seam；文件缺失/权限/编码错误有明确人话态；不把草稿写进 Canon。
  - 验证：spec 覆盖读写与失败态；真机能在 workdir 看到文件。

- [ ] **I3.2 编辑器画布（含阅读模式）** — 目标：Tiptap 编辑器成为默认主画布，阅读并入同一文档。
  - 文件：`packages/novel-workbench/src/client/NovelEditor.tsx`（新）、`novel-copy.ts`、
    `NovelCanvas.tsx`（默认视图改编辑器）、`novel-workbench-editor.spec.ts`（新）
  - 要求：写作/阅读两态切换；阅读态沿用衬线排版与锚点定位；**中文字数统计**；段首缩进与行高可调
    （接设置面板的 `--read-*`）；删除原「正文阅读」画布入口并说明迁移。
  - 验证：spec 绿；真机写作与阅读两态都对；原 read 画布不再出现在视图段。

- [ ] **I3.3 提交本章 → 提案** — 目标：手稿经作者确认后进入 Canon 事务。
  - 文件：`NovelEditor.tsx`、`novel-data.ts`、spec
  - 要求：点「提交本章」把当前章节文件内容作为 Result Packet 草稿提交（走既有
    `propose_novel_result_packet` 路径与提案收件箱）；失败不污染 Canon；提交前显示将产生的影响。
  - 验证：spec + 真机走通一次「手写 → 提交 → 收件箱出现提案」。

- [ ] **I3.4 头部与右栏改造** — 目标：原右栏的「当前章 / 待审提案 / 最近活动」迁到编辑器头部与左栏；
  右栏改可收起的对话。
  - 文件：`NovelTopbar.tsx`、`NovelSide.tsx`、`WorkbenchFrame.tsx`、相关 spec
  - 验证：真机三栏语义正确；对话可收起且收起后正文拿到全宽。

- [ ] **I3.5 左栏重排** — 目标：修「17 条线程把视图挤出视野」。
  - 文件：`NovelRail.tsx`、`store.ts`、`novel-workbench-rail.spec.ts`
  - 要求：视图段置顶或常驻；线程列表收折/限高 + 可展开；作品段显示进度摘要。
  - 验证：spec + 真机在 20+ 线程下视图仍在首屏可见。

### Phase 4 — 补全与续写

- [ ] **I4.1 句级补全（幽灵文本）** — 目标：停顿后在光标处出灰字，Tab 接受、Esc 丢弃。
  - 文件：`packages/novel-workbench/src/client/novel-completion.ts`（新）、`NovelEditor.tsx`、
    `novel-workbench-completion.spec.ts`（新）
  - 要求：ProseMirror decoration 实现；**中文输入法组字期间绝不触发、不干扰 composition**；
    触发延迟与开关进设置；请求走已有模型 seam（不新建 provider）；失败静默不打扰作者；
    接受后只改草稿文件，不碰 Canon。
  - 验证：spec 覆盖触发/接受/丢弃/组字期抑制；真机手写时出现灰字并能 Tab 接受。

- [ ] **I4.2 段级续写面板** — 目标：参考应用那种「情节灵感 → 生成 → 采用」。
  - 文件：`packages/novel-workbench/src/client/ContinueWritingPanel.tsx`（新）、spec（新）
  - 要求：情节灵感可多行、按写作顺序；生成中可停止；结果可「采用」（写进草稿）或丢弃；
    结果只进草稿，进 Canon 仍需走提交 → 提案。
  - 验证：spec + 真机一次真实生成与采用。

- [ ] **I4.3 设置项补齐** — 目标：把新能力接到设置面板，并让「工具活动」开关回来。
  - 文件：`NovelSettings.tsx`、`store.ts`、`novel-workbench-settings.spec.ts`
  - 说明：上一轮删掉「线程里的工具活动」是因为当时由官方会话面渲染、我们兑现不了；
    对话面自研后**这个开关重新可兑现**，属于回归而非新增。
  - 验证：spec 绿（含「面板不得携带无法兑现的控件」这条不变量仍然成立）。

### Phase 5 — 自动提炼（模式）

- [ ] **I5.1 提炼模式设置** — 目标：默认「提交本章时跑 + 可手动重跑」，另给「边写边提炼」。
  - 文件：`store.ts`、`NovelSettings.tsx`、spec
  - 验证：spec 绿；两模式可切换且被记住（配合 I6.2 的持久化）。

- [ ] **I5.2 提交时提炼** — 目标：整章文本 → 提炼 → **只产出提案**进收件箱。
  - 文件：`packages/novel-writing/src/`（提炼入口）、`packages/novel-project/src/`（若需边界）、spec
  - 要求：复用既有 writing-memory organizer 的 post-check/debt/relationship/knowledge/arc Delta 形状；
    无锚点时必须允许 `sourceAnchors: []`（模型会为了算 hash 空转，这是已知坑）；
    提炼失败不得污染 Canon；提案在既有「提案审阅」面逐条接受。
  - 验证：spec + 真机「写一段 → 提交 → 收件箱出现设定提案」；拒绝后 Canon hash 不变。

- [ ] **I5.3 边写边提炼模式** — 目标：该模式下写作过程中也提炼，但不打扰。
  - 文件：同 I5.2 + 节流逻辑、spec
  - 要求：节流（按字数或停顿，可配）；重复内容不重复提案；收件箱不得被噪声淹没；
    可随时关掉回到默认模式。
  - 验证：spec + 真机一次长写作观察提案数量合理。

### Phase 6 — 其余画布与收尾

- [ ] **I6.1 地图规模化对齐原型** — 分簇（按势力/地点）、只看本卷、钉位、簇内「+N」。当前实现只有
  我自己加的「未连线折叠 + 搜索」，缺分簇/钉位/过滤。注意「按卷筛选」需要节点带卷弧归属——
  没有这个数据就先改投影或用别的可实现口径，**不许做假筛选**。
- [ ] **I6.2 刷新保留** — 当前屏幕 / 主题 / 字号 / 折叠状态写 `localStorage`（现在全仓 0 处）。
- [ ] **I6.3 窄窗 1280** — 左栏折成 58px 图标 + tooltip、右栏浮层；现在 `.app[data-narrow="1"]`
  这条规则永远不会命中我们的 frame。
- [ ] **I6.4 键盘可达** — Tab 顺序、图谱节点可聚焦（Enter 选定、D 开档案）、焦点环、弹层 Tab 循环。
- [ ] **I6.5 信息去术语化** — 裸 id 当标题（`guchen`）、英文键名直出（`status`、`constitution · realm`）、
  空行白占位（「0 人」势力、右栏「字数进度 —」）全部改成作者语言。
- [ ] **I6.6 密度与观感微调** — 直接改 `workbench-css.ts`（并同步原型 CSS）。
- [ ] **I6.7 记录收口** — 原型回写 + 重生成 CSS + 更新 `tasks/todo.md`、`docs/claude-desktop-parity-matrix.md`、
  本文件勾选与证据链接；跑 `node scripts/port-prototype-css.mjs --check`。

---

## 4. 每轮 loop 的固定动作

1. 进主 checkout（绝对路径），`git status --short` **看第一列**（这个 checkout 有预暂存内容，
   不要把它人的暂存混进自己的提交），`git diff --cached --name-only` 确认暂存区状态。
2. 读本文件，取**第一个未勾选**的增量；它就是要做的全部内容，不顺手扩展别的增量。
3. RED：先写 focused test 并**运行**，保存预期失败原因；若首次就绿，先证明它能捕获缺口。
4. GREEN：只写让该测试通过的最小实现，不顺带抽象。
5. REFACTOR：绿灯保护下清理；每次可能改变行为后重跑 focused test。
6. 门禁：当前包测试 → 根 `corepack pnpm test`、`pnpm typecheck`、`pnpm lint`、`git diff --check`。
7. 若改了产品源码：`scripts/dev-host.sh rebuild`（重装 + 重启 host）→ `node scripts/smoke-workbench.mjs`
   （应为 exit 0；如需覆盖新屏幕，先扩展扫描脚本）。
8. 若改的是**结构**：先回写原型 HTML 并重生成 CSS；若是**微调**：同时改 `workbench-css.ts` 与原型 CSS。
9. 回写证据：勾选本文件的增量，写明实现文件、测试文件、验证命令与结果；必要时更新 `tasks/todo.md`
   与 parity matrix。**证据指向仓库内文件，不再只写 `/tmp` 路径。**
10. 提交：单一逻辑、可回滚、不含无关改动；提交信息说明**为什么**。

## 5. 停止条件与要人介入的信号

**正常停止：** 本文件所有增量勾完。

**必须停下问人**（把问题与本轮已做的写进本文件，然后停）：
- 引入编辑器栈后 client bundle 超过当前 2 倍（体积预算被突破）。
- 发现「审批回归」不是回归、而是官方从未提供 → 需要用户决定是否自建。
- 任何要改 Canon 语义、DSH 版本、或要碰用户全局 `~/.dsh` 的场合。
- 任何规格冲突（`AGENTS.md` 与 `plan-final.md` 打架，或原型与本次共识打架）。
- 需要 push / PR / 合并 / 发布 / 部署时——本计划**不包含**这些，一律停下等授权。

**绝不做：** 为了让门禁变绿而删除/跳过/弱化测试；用 mock 或占位冒充完成；在未验证的情况下宣称
`verified`；把补全/续写/提炼的结果直接写进 Canon。

---

## 6. 留到实现时再定的（边写边改）

- 编辑器的具体工具条内容（参考应用有加粗/插图/伏笔关联；首版做哪些）。
- 续写的评价回路（参考应用用「墨水」换）——我们是否需要类似反馈采集。
- 语音输入/朗读、小黑屋专注模式、便签、查找替换：参考应用有，本次共识未包含，**暂不纳入**。
- 插图能力（参考应用限签约作品）：暂不纳入。
