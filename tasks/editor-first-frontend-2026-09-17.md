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
| 5 | ~~**审批卡自研，排在最前**~~ → **2026-09-17 改为「验证并修好复用路径」** | 原前提「官方审批只由被我们禁用的 `ui-chat` 提供」**被 I1.1 证伪**：官方另有 `@deepseek-ai/dsh-client-ui-approval`，novel profile 里 HTTP 200 加载，我们没禁它，且它就是 `approval/request` 的应答者。用户裁定**不自研**，改为验证官方面板在我们 frame 里可用、不可用就修 frame。证据见 [`docs/approval-renderer-red-2026-09-17.md`](docs/approval-renderer-red-2026-09-17.md)。Phase 1 的 I1.2/I1.3 已按此重写。 |
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

- [x] **I0.1 基线确认** — 目标：确认主 checkout、host、测试与扫描基线，避免在错的地方开工。
  - 文件：无（只读）
  - 验证：`git log --oneline -1` = `8926e31`；`git status --short`（**读第一列**，本 checkout 有预暂存内容）；
    `corepack pnpm test` 324 绿；`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4780/` = 401；
    `node scripts/smoke-workbench.mjs` exit 0。把结果写进本节下方一行基线记录。

**基线记录（2026-09-17，I0.1 已完成）：** 主 checkout `/Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent`，
HEAD `02a48d8` —— 即本计划写的 `8926e31` **加本计划文件本身的这一个提交**，不是分叉；`git status --short`
干净、`git diff --cached --name-only` 空（本轮无预暂存内容，仍按 §4.1 读第一列）；`corepack pnpm test` →
19 files / **324 passed**；`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4780/` → **401**；
`node scripts/smoke-workbench.mjs` → **exit 0**（9 个 view 条目 rendered，`review` skipped-no-proposal）。

**执行位置说明（I0.1 附带）：** 本 session 被 harness 钉在 worktree
`.claude/worktrees/nostalgic-morse-d8d402`（与主 checkout 同在 `02a48d8`，**不是**计划警告的 `a3be81c` 旧树；
另外三个 `a3be81c` 树才是）。`change_directory` 被 harness 拒绝，session 无法迁移。经用户当轮确认后，
**以绝对路径在主 checkout 开工**，提交落在 `main` 分支。每轮 loop 的 bash 命令都显式
`cd /Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent && …`，因为 harness 会在命令之间把 cwd 重置回 worktree。

- [x] **I0.2 编辑器选型记录** — 目标：Tiptap/ProseMirror 栈的选型证据，含**体积实测**，否则不许引依赖。
  - 文件：`docs/open-source-evaluations/editor-stack-2026-09-17.md`（新）、`THIRD_PARTY_NOTICES.md`、
    `docs/upstream-sources.md`、`packages/novel-workbench/package.json`、
    **`packages/novel-workbench/tsdown.config.ts`（本轮新增，见下）**
  - RED：先量**未引入**时的 `packages/novel-workbench/lib/client.js` 原始与 gzip 体积并记录。
  - GREEN：隔离 esbuild 对照量 `@tiptap/react + @tiptap/starter-kit + @tiptap/pm` 的 minified/gzip；
    审阅全部 install script 与传递依赖许可证；记录精确版本。若总体积超过当前 client.js 的 2 倍，
    停下来把数字写给用户再决定（这是**需要人介入的信号**，见 §5）。
  - 验证：选型记录里每个数字都有可复现命令；`pnpm-lock.yaml` diff 已审阅；
    `corepack pnpm test`、`typecheck`、`lint` 仍绿。

  > **✅ 2026-09-17 完成。** 完整证据在
  > [`docs/open-source-evaluations/editor-stack-2026-09-17.md`](../docs/open-source-evaluations/editor-stack-2026-09-17.md)。
  >
  > **过程：** 先用仓库外隔离探针量（`/tmp/editor-stack-probe`、`/tmp/tsdown-probe`），投影出 **1,602,531 B
  > = 2.48×（raw）/ 2.88×（gzip）**，破原 2 倍护栏 → **按 §5 停下问人**。用户选择「放宽预算、直接引入」，
  > 于是把护栏换成绝对上限 **2,400,000 B raw**（见 §5「体积护栏」）并完成引入。
  >
  > **真实实测（端到端，权威口径 —— 不是探针投影）：**
  >
  > | 时点 | raw | gzip |
  > | --- | --- | --- |
  > | 基线 | 645,428 B | 123,596 B |
  > | 引入后（**修 `platformModules` 之后**） | **1,559,851 B（+914,423，2.42×）** | **340,653 B（+217,057）** |
  >
  > 在 2,400,000 B 上限内 → **PASS**。移除临时 import 重构建后，产物 sha256 与基线
  > **逐字节相同**（`548d1124…`），即配置改动对当前产物零影响。
  >
  > **⚠️ 顺带修掉一个会让体积翻倍的既有配置缺陷（本轮最有价值的发现）：**
  > `tsdown.config.ts` 的 `platformModules` 原本只有 `react` + `react/jsx-runtime`，
  > **漏了 `react-dom` / `react-dom/client`**。`@tiptap/react` 会 `import 'react-dom'`，
  > 于是 **react-dom + scheduler 被整段复制进 `lib/client.js`（约 900 KB）**——尽管宿主早就提供了它们。
  > 首次真实构建因此是 **2,511,029 B（3.89×）**；把这两个 id 补进 `platformModules` 后回落到 1,559,851 B，
  > 与探针预测（+957,103 B）相差 5% 以内。
  > **依据：** 官方 `@deepseek-ai/dsh-client-ui-renderer` 的 client bundle 里 `require("react-dom")` 与
  > `require("react-dom/client")` 都是**裸 require**，即由宿主模块表提供（`-conversation`、`-chat` 同样如此）。
  > **教训（已写进选型记录）：** 孤立探针的外部化清单必须逐项对齐真实构建配置，凭印象写会让体积预测错一倍。
  >
  > **引入内容：** `@tiptap/react` / `@tiptap/starter-kit` / `@tiptap/pm` 精确 `3.31.3` 写进
  > `packages/novel-workbench/package.json`；`pnpm-lock.yaml` 新增 **51 个包、移除 0 个**、
  > **未改动任何既有 resolution**；`react`/`react-dom` 保持 `18.3.1`，**没有出现第二个 React 版本**。
  > 51 个包**全部 MIT**，0 个 `preinstall`/`install`/`postinstall`。
  >
  > **⚠️ 规格错误，I3.2 落地时必须改：** `@tiptap/pm` **没有 `.` 导出**，只有 `/state`、`/view`、`/model`
  > 等子路径。本计划与决定 11 里把「`@tiptap/pm`」当裸导入写**编译不过**。
  >
  > **未做（不得当已验证）：** 没有在任何真实浏览器里加载过 Tiptap —— 本增量只回答**体积、许可证与打包**，
  > 运行时可用性属于 I3.2。§4.7 的 smoke 覆盖的是**现有**界面（编辑器尚不存在），它验证的是这次配置改动
  > 没有弄坏已有 client bundle。
  >
  > **对后续增量的影响：** 体积护栏已换成绝对上限（§5「体积护栏」），I3.x 不再需要在每轮重新论证 2 倍线；
  > 但每次引入新依赖仍要先实测并记录。

### Phase 1 — 审批面（安全优先）

- [x] **I1.1 RED：确认审批回归** — 目标：用证据证明「现在没有审批渲染者」，而不是靠推断。
  - 文件：`docs/` 下的证据记录（新）
  - RED：在**隔离 profile**（`.novel-agent/dsh-home` + 新 profile）里驱动一次真正需要审批的操作
    （例如需要 approval 的 shell/文件写入），记录：操作是否卡住、有没有出现审批 UI、DOM 里有没有
    可应答控件。已知事实：`dsh-user-approval` 无客户端半边；整个 `@deepseek-ai/` 里客户端提到
    approval 的只有 `dsh-client-ui-chat`，而它被我们的 bundle patch 禁用。
  - 验证：RED 证据落盘（截图/DOM dump/日志），并注明这是**回归**还是**从未有过**。

  > **✅ 已完成（2026-09-17）。** 官方审批渲染者存在、已加载、我们没禁它，
  > 并且**真实审批已跑通** —— 四条断言全部成立，见下方 I1.2 与证据 §9。
  > 证据：[`docs/approval-renderer-red-2026-09-17.md`](../docs/approval-renderer-red-2026-09-17.md)，
  > 原始产物 `docs/evidence/approval-red-2026-09-17/`（`summary.json` + 可复跑的 `probe.mjs`）。
  >
  > - **本增量「已知事实」是错的，而且错在根目录取错。** 那条是靠 grep 仓库 `node_modules/` 得出的，
  >   而 DSH profile 的那批客户端包**根本不在仓库 `node_modules/` 里**。实际存在一个独立的官方包
  >   **`@deepseek-ai/dsh-client-ui-approval`**，宿主的前端模块 manifest 里带 rev `d7ab0d02e937c5a6-19`，
  >   真机探测到它 **HTTP 200 加载**，且与 `@novel-agent/novel-workbench/client.js` 同批。
  >   （与 I0.2 漏掉 `react-dom` 是同一类错误 —— **清单取错根目录，结论会反向**。）
  > - **它的角色：** 自己声明 `conversation.approval.detail` 槽（作为 `conversation.composer` 的子槽）、
  >   渲染 `ApprovalPanel`（条件是存在 pending approval）、并且**就是** `approval/request` 瀑布的应答者
  >   （`ctx.remote.$on("approval/request", …)`）。
  > - **`ui-chat` 被禁 ≠ 审批卡没了：** `ui-chat` 只是往上面那个槽里注入一个「显示命令原文」的细节组件。
  >   禁它丢的是命令预览，不是审批卡。
  > - **我们的 patch 只禁 `ui-layout` / `ui-sidebar` / `ui-chat`，没碰 `ui-approval`。** 真机 DOM 里
  >   `data-slot="conversation.composer"`（审批面板的挂载座位）**存在**，console 报错 0。
  > - **分类：既不是回归，也不是从未有过，而是「一直有、现在也开着」。**
  > - **仍未证明（不得当已验证）：** **没有**驱动过一次真实需要审批的操作。本轮只证明了「渲染者已加载、
  >   座位存在」，不等于「真 pending 时面板会画出来」。触发真审批需要一次带工具调用的真实会话（要模型），
  >   本轮未跑；`dsh --profile headless` 只给终端审批，证明不了 web 面板。
  > - **用户裁定（2026-09-17）：走 ①「验证并修好复用路径」。** **不自研审批卡。**
  >   I1.2 / I1.3 已按此重写（I1.2 改为「真机验证官方面板」，I1.3 改为「修复用路径缺陷」）；
  >   决定 5 那一行也已改写。若要走 ③ 自研，会与 §2「不建第二套 …审批…」直接冲突，需要用户明确豁免。
  >
  > **I1.1 仍未完成。**
  >
  > **2026-09-17 续：找到一条不需要模型的 RED 入口。** `dsh-client-connection` 的客户端 fixture
  > **只由 URL `?fixture=1` 打开**，打开后会吐出**真实的 pending `approval/request` 瀑布**
  > （`agentId: fx-alpha`，reason「fixture 常驻审批（可答：批准/拒绝后消失）」）。
  > 复跑：`node docs/evidence/approval-red-2026-09-17/probe-fixture-approval.mjs /tmp/approval-fixture`。
  > （坑：token URL 会 303 到裸 `/` 把 query 丢掉，必须先拿 cookie 再二次导航。探针已处理。）
  >
  > **观测（3 次运行一致，两种选会话顺序都试过）：** 我们的 frame 给官方 pending 交互留的座位**是通的** ——
  > 官方 `user-questions` 的待答面板确实渲染进了 `conversation.composer`（「偏好 / 你现在更想招哪类… 1/3」）；
  > **但官方审批面板没有出现**（`approvalDetailSlot=false`、`approvalishNodes=0`）。
  > 两条瀑布的 `agentId` **完全相同**，所以不是会话作用域造成的；6 条 console 报错全是 fixture 未实现的
  > `dynamicCordisRunner/*`，没有一条与 approval 或插件应用失败有关。
  >
  > **这是一条可复现但未解释的差异，不是缺陷结论。** 未排除的替代解释：fixture 先自行决定了那条审批、
  > 两个包 `registerPendingInteraction` 的竞争顺序不同、或 `ui-approval` 的
  > `select: pendingInteraction instanceof PendingApproval` 在这条路径上取不到值。边界见证据 §7.3。
  >
  > **本轮没有花模型额度**，用的也是官方自己的开发 fixture —— 所以它回答的是**UI 那一半**，
  > **不是**原 RED 要求的「真实操作」。真实审批（带工具调用的真实会话）仍未跑。
  >
  > **2026-09-17 差分结账：那条不对称不是我们的问题。**
  > 起了第二个宿主跑官方 `web` profile（`DSH_PROFILE=web DSH_PORT=4790`，同一个 DSH_HOME，
  > 路径里**完全没有**我们的 frame 与 patch），同一个 fixture、同一个会话、同一份探针：
  > **两边行为完全一致** —— user-questions 待答面板都渲染，**审批面板都不出现**（`approvalishNodes=0`）。
  > 所以 §7.2 的不对称是 **fixture 的性质**，不是我们的 frame / patch / 座位安排造成的。
  > **据此撤回「可能是我们坏了」那一读法。** 证据见
  > [`docs/approval-renderer-red-2026-09-17.md`](../docs/approval-renderer-red-2026-09-17.md) §8，
  > 产物 `docs/evidence/approval-red-2026-09-17/web-fixture-summary.json`。
  > （第二个宿主已 `stop`；novel 宿主仍在 4780 正常服务。）
  >
  > **硬结论：fixture 这条捷径回答不了「官方审批面板在我们 frame 里能不能画出来」。**
  > 它能证明的只有「官方 pending 交互的座位是通的」（questions 已证）。**真实审批成为唯一剩下的路径。**
  >
  > **✅ 用户已授权真实审批（2026-09-17）。** 下一步执行真实模型会话。这是本计划第一个真正
  > 产生模型调用费用的动作，授权已取得。
  >
  > **安全设计（下一轮必须遵守）：**
  > - **默认只做「拒绝」路径**：断言 (a) 面板画出、(b) 展示要批准的具体内容、
  >   (d) Esc 不等价于批准、以及 (c) 的**拒绝半边**（拒绝后操作被中止、会话里有可见结果）。
  >   **全程不做任何批准动作。** 这样既覆盖了大部分断言，又不会在本机真的执行越界操作。
  > - 只有当触发操作**被证明无害**（例如建一个可随手删掉的空文件）时，才额外测 (c) 的**批准半边**，
  >   并在测完**立刻清理**。
  > - 用**新会话**，不动既有线程；不碰用户全局 `~/.dsh`；不碰 Canon；不改权限预设。
  > - **触发方式：** 未配置任何 permission/sandbox 覆盖，所以走默认预设 `workspace-write`
  >   （`sandbox: workspace-write` + `approval: ask`），语义是「工作区内写免批，**更宽的写入重试需要审批**」。
  >   因此让模型做一次**工作区外**的写入即可触发审批，不需要真的做危险操作。
  >
  > **方法：** CDP 驱动 web UI —— 新建会话 → 在 composer 发一条会让模型调用工具、且该调用越界的提示 →
  > 等 `conversation.composer` 里出现审批面板 → 依次断言 (a)(b)(d)(c-拒绝)。
  > 可直接复用 `docs/evidence/approval-red-2026-09-17/probe-fixture-approval.mjs` 的 CDP 骨架
  > （Chrome 启动、`Session` 类、`DUMP` 表达式都已具备），**去掉 `?fixture=1`** 即走真实连接。
  >
  > **✅ 真实审批已执行（2026-09-17）。** 用 `docs/evidence/approval-red-2026-09-17/probe-real-approval.mjs`
  > 跑了两轮真实模型会话（一轮拒绝、一轮批准），四条断言**全部成立**：
  > (a) 面板在我们 frame 里画出（`conversation.approval.detail` 存在）；
  > (b) 逐字展示要批准的内容（越界目标路径 + 放宽到 `danger-full-access` 的原因）+ 「拒绝」「允许一次」；
  > (c) **拒绝 → 文件始终不存在**；**批准 → 文件真的写出来**（`ok`，3 字节）；
  > (d) Esc 后审批**仍挂起**，文案一字未变 → Esc 不等于批准。
  > 收尾：批准那轮产生的 `/Users/wzy/novel-approval-probe.txt` 已删除并复验不存在；用的是新线程；
  > 没碰 `~/.dsh`、没改权限预设、没碰 Canon。**证据 §9。**
  >
  > **两个操作坑（都卡过一轮，已写进探针）：** composer 是自定义 `contenteditable`，`.focus()` 不够，
  > 要用真实鼠标事件点击；会话座位在其他视图里**尺寸为 0**，必须先点 rail 的 `threads` 段再点线程行。
  > 探针现在以「composer 宽度 > 50」为就绪判据，并在打字为空时**拒绝发送**（避免白发一个空回合）。

- [x] **I1.2 GREEN：真机验证官方审批面板** — 目标：证明「复用路径可用」，而不是假设它可用。
  - 前置：I1.1 的剩余部分（真机驱动一次真实审批）。
  - 文件：`docs/evidence/approval-red-2026-09-17/`（追加真实审批证据）、
    `packages/novel-workbench/tests/novel-workbench-approval.spec.ts`（新，若需要）、必要时 frame 侧文件
  - 要求：在**隔离 profile** 里跑一次真正需要审批的**真实操作**（带工具调用的真实会话），断言四条：
    (a) `ApprovalPanel` 在我们的 frame 里**画出来了**；(b) 它展示审批对象与**要批准的具体内容**；
    (c) 能真实**批准**并让操作继续、也能真实**拒绝**并让操作中止；(d) Esc **不等价于批准**。
  - **不新造卡：** 复用官方 `conversation.composer` / `conversation.approval.detail` 槽与官方应答通路。
    **禁止**往 `shell.overlay` 另注册一张审批卡 —— 那就是 §2 说的第二套。
  - 验证：证据（DOM / 截图 / 会话日志）落盘且指向仓库内文件；四条断言若有不成立，
    记下具体缺陷交给 I1.3 修，**不要**改成自己造。
  - 注：`approval/request` 是 **fail-closed**（无应答者 → `unavailable`），所以缺陷的表现应是
    **操作被拒绝**而不是卡死；按这个预期观察，别把「被拒绝」误判成「卡住」。

  > **✅ 已完成（2026-09-17）：四条断言全部成立，复用路径可用。**
  > 真实模型会话两轮（拒绝 / 批准），证据
  > [`docs/approval-renderer-red-2026-09-17.md`](../docs/approval-renderer-red-2026-09-17.md) §9，
  > 产物 `docs/evidence/approval-red-2026-09-17/real-*-summary.json` 与 `real-approval-*.png`。
  > (a) 面板画出；(b) 逐字展示越界目标路径与放宽原因 + 「拒绝」「允许一次」；
  > (c) **拒绝 → 文件始终不存在**、**批准 → 文件真被写出**；(d) Esc 后审批仍挂起。
  > 没有另建 `novel-workbench-approval.spec.ts` —— 这条路径由官方包拥有，我们的仓库里没有可测的
  > 新行为，硬造一个 spec 只会是「为绿而绿」。
  > **边界：** 触发是**我们挑的一个合成操作**（一次越界小文件写入），没有覆盖全部工具类型，
  > 也没有证明多审批并发 / 超时下的表现。

- [x] **I1.3 修复用路径的缺陷（不是造卡）** — 目标：把 I1.2 暴露的 frame 侧问题就地修好。
  - 文件：`WorkbenchFrame.tsx` / `novel-copy.ts` 等 **frame 侧**文件、相关 spec
  - 要求：只修「我们的 frame 让官方面板画不出来 / 画不正 / 抢焦点」这一类问题 ——
    座位几何、`conversation.composer` 的可见尺寸（它是 `display: contents`，尺寸由会话面决定）、
    与我们自研 `novel.composer` 底部行的叠加遮挡、焦点与 Esc 既有约定。
    **不得**复制官方的审批数据通路或应答逻辑。
  - 验证：spec 绿；真机复跑 I1.2 的四条断言全部成立；并把「不建第二套审批」固化成一条 spec
    不变量（面板仍由 `ui-approval` 提供，我们的 bundle 里没有第二个 `approval/request` 应答者）。

  > **✅ 已完成（2026-09-17）：缺陷清单为空，不变量已落地。**
  > I1.2 四条断言在真实会话里全部成立，**没有暴露任何 frame 侧缺陷**（座位几何、composer 尺寸、
  > 与 `novel.composer` 的叠加、焦点与 Esc 都没问题），所以这个增量的「修」没有对象。
  > 它唯一的实质产出是**把不变量固化成测试**：
  > `packages/novel-workbench/tests/novel-workbench-approval-ownership.spec.ts`（新，3 个断言）
  > —— ① `src/` 里不得出现 `approval/request`（不得自建应答者）；② 不得出现 `conversation.approval`
  > （不得自建座位）；③ `cordis.patch.yml` **不得禁用 `ui-approval`**。
  > **已证明它能咬人**（§4.3 要求）：临时注入一处违规后三个断言**全部失败**，并各自指出了具体文件 /
  > 具体被禁 id；注入已完全还原（`git status` 里 `cordis.patch.yml` 无改动）。
  > **未做：** 没有新建 `novel-workbench-approval.spec.ts` 之类的「面板行为」spec —— 那条路径由官方包
  > 拥有，我们仓库里没有可测的新行为，硬造只会是为绿而绿。

### Phase 2 — 对话面自研

- [x] **I2.1 消息流** — 目标：自渲染用户/助手消息与流式增量，替换官方会话面的排版。
  - 文件：`packages/novel-workbench/src/client/NovelTranscript.tsx`（新）、`transcript-data.ts`（新）、
    `NovelCanvas.tsx` 或 `WorkbenchFrame.tsx`（接线）、对应 spec（新）
  - RED：先写「给定一组会话消息渲染出 N 条消息与流式追加」的 focused test，证明当前没有这个面。
  - 要求：数据只从官方会话绑定读取（`binding` / `eventSource`），**不新建消息存储**；
    正文用阅读排版（衬线/行高/行宽沿用 `--read-*` token）；长文、段落、中文标点正常。
  - 验证：spec 绿；真机 smoke 里线程视图出现自渲染消息流。

  > **✅ 已完成（2026-09-17）。**
  > - **新增** `src/client/transcript-data.ts`（纯归约）、`src/client/NovelTranscript.tsx`（纯呈现）、
  >   `tests/novel-workbench-transcript.spec.ts`（8 个断言）。**接线**：`store.ts` 加 `transcript` 切片
  >   与 `setTranscript`（带同值短路，避免每个无关事件都重渲染）、`index.tsx` 在**既有的**
  >   session-follow 里从 `binding.eventSource` 归约、`WorkbenchFrame.tsx` 在线程视图渲染。
  > - **RED→GREEN**：spec 先因 `Failed to resolve import ".../transcript-data.js"` 失败（证明缺的就是这个面），
  >   实现后 8/8 绿。
  > - **不新建消息存储**：`transcriptOf(entries)` 是官方 session log 的**纯函数视图**，没有第二个真相源。
  > - **归约范围**：`user/message`；`assistant/chunk` 的 `text-delta` 流式累积、由 `assistant/message` 定稿；
  >   `tool/call` 与 `tool/result` 配对（`running`/`done`/`failed`）；`turn/end` 失败转成一条 notice。
  >   **`reasoning-delta` 故意不进正文** —— 那是模型在想，不是手稿。
  > - **排版**：正文用 `--font-serif` + `--read-size` / `--read-lh` / `--read-measure`，与手稿视图同一套；
  >   `white-space: pre-wrap` 保住中文标点与分段。
  > - **官方会话面怎么处理**：frame 只在 `FRAME_CSS` 里隐藏官方的 `[data-slot="conversation.session"]`
  >   （它自己的消息区），**其余全部保留**（composer / 输入菜单 / 审批面板）—— 这正是 I2.4 的前置要求：
  >   I2.2/I2.3 到位前不丢作者还在用的能力。
  > - **真机验证**：按 §4.7「如需覆盖新屏幕先扩展扫描脚本」，扩了 `scripts/smoke-workbench.mjs` 的线程扫描 ——
  >   它会**沿线程列表走到第一个真有正文的线程**（第一行常是空线程，只测它等于什么都没测），并把
  >   transcript 座椅缺失、或所有可达线程都空，判为**失败**而非跳过。实测
  >   `thread transcript: 6 entries`，样本就是真实会话内容；smoke exit 0。
  > - **已知问题（不在 I2.1 修，留给后续）：** transcript 会**原样渲染运行期上下文快照**
  >   （那条 `Current runtime context. This snapshot supersedes earlier…` 的 user-role 注入）。它是日志里
  >   真实存在的 user 消息（官方会话面同样会显示它），但在一段中文里读起来像噪音。
  >   安全过滤需要 llm 的 `MessageSource` **特化**轴（base 上写的是 `form?: never`），本轮没有足够证据
  >   区分「注入的上下文」与「作者真的写了这句」，所以不在 I2.1 猜着过滤 —— 归 I2.2 / I6.5 的「信息去术语化」。

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
- ~~引入编辑器栈后 client bundle 超过当前 2 倍（体积预算被突破）。~~
  **已于 2026-09-17 被 I0.2 触发并裁定，护栏已换成绝对上限，见下方「体积护栏」。**
- 发现「审批回归」不是回归、而是官方从未提供 → 需要用户决定是否自建。
  **2026-09-17 被 I1.1 触发了它的加强版：连「回归」都不成立 —— 官方审批渲染者
  `@deepseek-ai/dsh-client-ui-approval` 一直存在、已被加载、且我们没禁它。
  见 [`docs/approval-renderer-red-2026-09-17.md`](../docs/approval-renderer-red-2026-09-17.md)。**
- 任何要改 Canon 语义、DSH 版本、或要碰用户全局 `~/.dsh` 的场合。
- 任何规格冲突（`AGENTS.md` 与 `plan-final.md` 打架，或原型与本次共识打架）。
- 需要 push / PR / 合并 / 发布 / 部署时——本计划**不包含**这些，一律停下等授权。

**绝不做：** 为了让门禁变绿而删除/跳过/弱化测试；用 mock 或占位冒充完成；在未验证的情况下宣称
`verified`；把补全/续写/提炼的结果直接写进 Canon。

### 体积护栏（2026-09-17 裁定，替换原「2 倍」规则）

**旧规则**「引入后超过当前 `client.js` 的 2 倍就停下」是拿**未 minify 的 raw 字节**算的，而当前产物
根本未 minify（645,428 B raw 但只有 123,596 B gzip），护栏因此偏严。I0.2 触发它之后，用户 2026-09-17
决定**放宽预算、直接引入**。

**新护栏（绝对上限）：** `packages/novel-workbench/lib/client.js` 的**未压缩 raw** 体积
**不得超过 2,400,000 B（约 2.4 MB）**。超过才停下问人。

- 数字来源：trio 引入后**真实端到端实测 1,559,851 B（+914,423，2.42×）**（证据见
  [`docs/open-source-evaluations/editor-stack-2026-09-17.md`](../docs/open-source-evaluations/editor-stack-2026-09-17.md) §5），
  留约 **840 KB** 给 Phase 3–6 的自研界面代码（参照：整个图谱栈当时只花了 +457 KB，而自研代码远小于库代码）。
- **注意上限是按「已经修掉 `platformModules` 漏 react-dom 那个缺陷」的前提定的。** 如果不修，同样这三个依赖
  会打到 2,511,029 B，直接顶穿上限。所以这条护栏的前提是 `platformModules` 与宿主模块表保持一致。
- 判定用**真实构建**的数，不用探针投影：探针当时给 1,602,531 B，与真实值只差 3%，但**过程里它一度错了一倍**
  （漏算 react-dom）。口径教训写在选型记录 §1 与 §3。
- **我按「1.8 MB」那个例子往上放到了 2.4 MB**，理由是 1.60 MB 之后 Phase 3–6 还要加编辑器、右栏、左栏重排、
  地图分簇等一整套界面，1.8 MB 会在 Phase 3 中途就再次绑手绑脚。**如果你要的就是 1.8 MB，改这一个数字即可。**
- 每次引入新依赖仍然必须先实测并记录（I0.2 的做法不变），只是判定基准换成这个绝对数。
- **面向读者的真实成本是 gzip**（host 的 webserver 已开 gzip）：123,596 B → 约 356,495 B，多约 233 KB。
  raw 上限只是构建期的粗护栏，别把它当成用户感知指标。
- 仍然**不能用代码分割绕**：DSH 的 ClientModuleSystem 每个插件只提供一个 `client.js`。

---

## 6. 留到实现时再定的（边写边改）

- 编辑器的具体工具条内容（参考应用有加粗/插图/伏笔关联；首版做哪些）。
- 续写的评价回路（参考应用用「墨水」换）——我们是否需要类似反馈采集。
- 语音输入/朗读、小黑屋专注模式、便签、查找替换：参考应用有，本次共识未包含，**暂不纳入**。
- 插图能力（参考应用限签约作品）：暂不纳入。
