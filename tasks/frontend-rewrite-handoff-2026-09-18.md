# 前端审查与重构交付单（给 deepseek flash 执行） — 2026-09-18

> **本文档是什么：** 站艺 2026-09-18 判定「前端以人类作者体验为标准**根本不是人用的**」，要求审阅真实问题并撰写可直接交付 deepseek flash 执行的重构计划。本文档基于**真机走查截图证据**（非代码推断），把问题清单与可执行工作单合并写出。
>
> **证据基线：** CDP 真机走查，1440×900 headless Chrome，Host `127.0.0.1:4780`（profile `novel`，Canon R5）。
> 全部截图与机读记录：[`docs/evidence/2026-09-18/walkthrough/`](../docs/evidence/2026-09-18/walkthrough/)（12 张截图 + `walkthrough-summary.json` + 可复跑的 `probe-walkthrough.mjs`）。
>
> **执行前提（不可妥协）：** 遵守 [`AGENTS.md`](../AGENTS.md) 与 [`tasks/editor-first-frontend-2026-09-17.md`](editor-first-frontend-2026-09-17.md) §2 的全部硬约束：Canon 唯一事实源、H1 分界、严格 TDD、DSH `0.1.2-rc.1` 锁定、不建第二套、不碰 `~/.dsh`、不 push 不发布。

---

## 0. 先承认两件事

**第一，站艺的判断成立。** 以人类作者体验为标准，这个前端**确实接近不可用**。走查截图里的问题（画布死白、中英混杂、垃圾线程名、测试残留混进正文、工程术语确认卡）任何一个都足以让真实作者在五分钟内放弃。

**第二，工程证据与体验证据不矛盾，但工程证据回答错了问题。** 439 tests 全绿、16 屏 `rendered`、0 浏览器报错——这些测的是「组件是否渲染出预期的 DOM」，不是「作者能否顺畅地写完一章」。smoke 脚本的判定标准是 `data-*` 标记存在，它看不见「确认卡上写了五个工程术语」和「线程列表被 agent 日志淹没」。**测试标准本身就是工程视角，这正是漏洞所在。** 后续所有验收以本文件 §2 的人类体验标准为准，不再以「rendered」为准。

---

## 1. 现状问题清单（按严重程度分级，每条带截图证据）

### 致命级——作者第一眼就会放弃

#### W1 一个视图崩溃 → 所有后续视图死白（错误边界缺失）

- **证据**：[`07-story-map.png`](../docs/evidence/2026-09-18/walkthrough/07-story-map.png)、[`08-cast.png`](../docs/evidence/2026-09-18/walkthrough/08-cast.png)、[`09-transcript.png`](../docs/evidence/2026-09-18/walkthrough/09-transcript.png)——三张图的主画布区域**全部是一片死白**，无标题、无加载态、无错误提示、无恢复入口。左栏显示「故事地图」「人物与关系」处于选中态，主画布什么都不画。
- **根因**：走查环境 `--disable-gpu` 下 WebGL 不可用，sigma.js 的 `createWebGLContext` 返回 null，读 `blendFunc` 抛 `TypeError`。console 报错原文：**`slot entry crashed in 'novel.canvas': TypeError: Cannot read properties of null (reading 'blendFunc')`**——崩溃发生在 **slot 层**，`novel.canvas` 座位的占用组件崩了之后**没有错误边界接住**，座位保持崩溃态，切到任何其它视图都不恢复。
- **为什么这是真问题而不只是沙箱限制**：`--disable-gpu` 只是触媒。任何无 GPU 环境（旧 Mac、虚拟机、远程桌面、GPU 驱动故障）都会命中同一条路径；而「一个视图崩溃污染所有视图」是 `NovelCanvas.tsx` 的结构缺陷——每个视图分支直接 return JSX，没有 per-view 错误边界，也没有「这个画布暂时打不开 + 重试」的降级态。
- **涉及文件**：`packages/novel-workbench/src/client/NovelCanvas.tsx`（所有视图分支）、`StoryMapView.tsx`（WebGL 探测与降级）。

#### W2 中文写作工具的输入框是英文的（composer 中英混杂）

- **证据**：[`01-landing.png`](../docs/evidence/2026-09-18/walkthrough/01-landing.png) 底部右栏、以及 06/07/08/09 所有截图的右栏 composer——placeholder 是 **「Describe what you want to build... / 调用指令 @ 文件或对话」**，模型选择器显示 **「Deep... High」**。中英文混在同一行。
- **根因**：composer 由官方 `dsh-client-ui-conversation` 拥有（I2.4 的决定，H1 边界内正确），官方文案是英文 + 部分中文，novel-agent 没有任何翻译层。H1 说「不可见的客户端服务复用官方」，但 **placeholder 文案是可见面**，作者每一眼都看到。
- **为什么难修（要先说清代价）**：composer 内部类名是 build hash，不能直接改 DOM；官方 locale seam（`dsh-client-locale`）是否覆盖 conversation 包的文案**需要查证**——若覆盖，配 locale 即可；若不覆盖，可行的缝是 frame 级 CSS 覆盖 placeholder（`::placeholder` 不吃 hash 类名限制）+ locale 注入，两条都要留证据。**不许**自研 composer（违反 H1 与 I2.4 的查证结论）。
- **涉及文件**：先查 `@deepseek-ai/dsh-client-locale` 的词表机制；可能落点 `WorkbenchFrame.tsx`（FRAME_CSS 已有回答官方变量污染的先例）。

#### W3 线程列表被 agent 任务日志淹没，作者找不到自己的对话

- **证据**：所有截图的左栏「线程」段——21 条线程里可见的包括：**「未命名线程」「提炼第1章写作记忆提案」「提交第一章草稿提案」「把 ok 写入指定文件」「将本 ok 写入指定文件」「展开其余 16 条」**。「把 ok 写入指定文件」是探针让 agent 执行 shell 命令时留下的会话名，不是作者起的对话名。
- **根因**：线程名直接取官方 `session.title`（agent 首句自动生成），novel-agent 无过滤、无分组、无重命名。I3.5 只做了「显示前 5 条 + 展开」，没做「哪些线程值得显示」。对长期使用的作者，线程列表会无限膨胀成日志堆。
- **涉及文件**：`NovelRail.tsx`（线程段）、可能 `store.ts`（需要「收藏/置顶/归档」这类作者侧状态——这是新产品决定，先问站艺）。

#### W4 测试残留文本混在作者草稿正文里

- **证据**：[`03-editor-bar.png`](../docs/evidence/2026-09-18/walkthrough/03-editor-bar.png) 与 [`06-submit-confirm.png`](../docs/evidence/2026-09-18/walkthrough/06-submit-confirm.png) 的正文区第一行——**「测测试试夜里风大，吹得窗纸哗哗作响。灯芯将尽……」**。「测测试试」是历次探针（I3.3/I4.1b/I5.2 的真机验证）打字残留，留在了 workdir 的草稿文件 `第1章《开篇章》.草稿.md` 里。
- **根因**：探针诚实记录了「测完已删除草稿文件」，但**删除只覆盖当轮**；多轮探针各写各的，后一轮读到的文件里已有前一轮的残留（且 I5.2 的记录明说「那份手打的草稿文件留在现场」）。工作区 `/private/tmp/nw-workspace/天机阁主` 是共享的，没人做数据卫生。
- **修复分两层**：① 立即清理：删除或清空该草稿文件的测试残留（**要站艺确认**——那是 workdir 里的作者文件，哪怕内容是测试垃圾，删除也是写操作）；② 机制上：探针规约补一条「用完的草稿文件必须恢复原状（删除或还原内容）」，写进 `editor-first-frontend-2026-09-17.md` §4 的固定动作。
- **涉及文件**：`/private/tmp/nw-workspace/天机阁主/第1章《开篇章》.草稿.md`（数据）、探针规约（流程）。

### 严重级——核心流程读不懂或走不通

#### W5 提交确认卡一句话里塞了五个工程术语

- **证据**：[`06-submit-confirm.png`](../docs/evidence/2026-09-18/walkthrough/06-submit-confirm.png)——确认卡全文：「把第1章《开篇章》的草稿（18 字）作为一份**提案**提交，和已接受版本 **R5** 对齐。草稿先存盘，再由 AI 读它、产出**提案**放进**提案收件箱**。**Canon** 不会因为这一步改变 —— 只有你在**审阅**里逐条接受，它才动。」
- **对照产品自己的文案规范**：`docs/novel-mode-frontend-brief-2026-09-16.md` §6 明写「界面上不出现 JSON / delta / **Canon** / kind / 账本 / 控制包（进阶面与诊断除外）」「术语统一：提案（不是 packet）」——Canon 出现在作者面上**违反了产品自己的规范**。I3.3 实现时把这句话当成了「边界说明」而不是「作者文案」。
- **改写方向**（deepseek flash 照此执行，具体措辞可在 RED 里断言）：去掉 Canon/R5，说作者关心的事——「提交后 AI 会读这章草稿，把设定变化整理成一条条待你决定的建议；在你逐条接受之前，你的故事内容不会变。」版本信息可以保留但要说人话（「基于当前已接受的 5 个版本」或干脆去掉）。
- **涉及文件**：`NovelEditor.tsx`（确认卡 JSX）、`novel-workbench-editor.spec.ts`（断言文案不含 Canon/R5 字样）、`scripts/smoke-workbench.mjs`（泄漏检查已有 `cast-prints-canon-keys` 先例，加一条提交卡检查）。

#### W6 落地页是一片空白，没有「从哪开始」

- **证据**：[`01-landing.png`](../docs/evidence/2026-09-18/walkthrough/01-landing.png)——打开应用主画布只有大标题「写作」+ 一行副标题「这一章的草稿文件 · 自动保存到你自己的 workdir，接受后才进 Canon」（又是 workdir/Canon 工程话）+ 一行小字「先在左栏选一章，这里就是这一章的稿子。」**主区域 800×600 像素全空**。
- **对照**：原型 `hero-card` 有「三行说明 + 陶土按钮」，但只在 `workId === undefined`（无作品）时出现；**已立项但未选章**这个最常见的新手状态没有任何引导。副标题文案也是给工程师看的（workdir、Canon）。
- **改法**：`NovelCanvas` 的 editor 分支在 `chapterId === undefined` 时渲染一张引导卡：列出章节（前 3 章 + 各自状态），点一章直接进编辑器；若全部章节都已接受，给「让 AI 规划下一章」入口（走既有线程通路，不自建）。副标题改人话：「选一章开始写，写的东西自动保存在你自己的文件夹里」。
- **涉及文件**：`NovelCanvas.tsx`（editor 空态分支）、`NovelEditor.tsx`（「先在左栏选一章」那行可以退役，引导卡接管）、spec。

#### W7 故事地图在 WebGL 不可用时无降级、无提示

- **证据**：同 W1 的 console 报错与 [`07-story-map.png`](../docs/evidence/2026-09-18/walkthrough/07-story-map.png)。
- **改法**：`StoryMapView` 挂载时先探测 WebGL 可用性（创建 context 试一下），不可用就渲染降级卡：「这个设备暂时画不了关系图」+ 两个替代入口（「人物与关系」列表视图 + 「重试」）。**不许**因此自研第二套图谱渲染（开源门禁：sigma 是选型记录里的既定选择）。
- **涉及文件**：`StoryMapView.tsx`、`novel-workbench-story-map.spec.ts`。

#### W8 人物显示实体 id，作者不知道 `guchen` 是谁

- **证据**：代码契约（`NovelStoryNode.label` / `NovelCastPerson.name` 回落到实体 id）+ I6.5b 查证（Canon 无任何 character-state 带 `name` 字段）。本次走查因 canvas 崩溃（W1）未能截到 cast 屏实际渲染，**此条沿用 I6.5b 的查证证据，不计入本次截图**。
- **这是内容缺口不是前端缺口**，但**体验上是致命的**：地图、`@` 候选、关系线、人物档案全是 slug。根治要动 organizer 契约（提炼时把名字写进 Canon）——**这要站艺拍板**（改 Canon 语义属于停止条件）。短期缓解：前端把「裸 id 当标题」的等宽提示（I6.5a 已做）升级为更明显的「未命名人物」+ 副显 id，并给 agent 的提炼提示词加一句「为每个人物补充 name 方面」——这句是**提案路径**（agent 产出、作者接受），不违反 Canon 边界。
- **涉及文件**：`chapter-files.ts`（refineRequest 提示词加 name 补充要求）、`novel-copy.ts`（显示策略）、CastView/PersonFileDrawer/StoryMapView（显示层）。

### 体验差级——能用但难受

| # | 问题 | 证据 | 改法方向 |
| --- | --- | --- | --- |
| W9 | 编辑器头部一行 9 个元素（章节名 + 写作/阅读 + 状态 + 字数 + 续写 + 提交 + 重新提炼），896px 挤满 | [`03-editor-bar.png`](../docs/evidence/2026-09-18/walkthrough/03-editor-bar.png)、`walkthrough-summary.json` step 3 | 动作收进「···」溢出菜单或图标化；状态与字数弱化为次要色；**结构改动走原型 HTML → 重生成 CSS**（§2 设计来源规则） |
| W10 | 句级续写等 2–6.5s（高推理档）、段级续写不流式只显示「正在写…」 | I4.1b/I4.2 实测记录 | 决策项：换档位要查 dsh-llm adapter 的 reasoningEffort 枚举（私有串，猜会打失败）；流式要新增协议面。**先给站艺决策卡，不动代码** |
| W11 | 提交确认卡与续写面板可同时展开叠加（截图里两个面板叠着） | [`06-submit-confirm.png`](../docs/evidence/2026-09-18/walkthrough/06-submit-confirm.png) | `NovelEditor` 内互斥：开确认卡时收起续写面板（一行 state 互斥） |
| W12 | 视图切换数据加载无加载态（cast 空白期间什么都不知道） | [`08-cast.png`](../docs/evidence/2026-09-18/walkthrough/08-cast.png)（部分因 W1） | 各视图分支补骨架屏（`.sk` 骨架样式原型 CSS 里已有，没用上） |
| W13 | 运行期上下文注入原样渲染进 transcript、失败重试会把它重发 | I2.1/I2.4 已知问题（代码证据，本次截图未触及——线程是空的） | 按 I8.1 方案：识别固定前缀过滤显示与重发，不删日志 |
| W14 | 提炼模式、地图钉位刷新即丢 | I5.3/I6.1a 已知问题 | 进 prefs 切片（I8.2/I8.3 方案） |
| W15 | 设置面板 9 项平铺、说明文字长 | [`10-settings.png`](../docs/evidence/2026-09-18/walkthrough/10-settings.png) | 低优先级：分组（阅读 / AI 协作）；文案已算合格，先不动 |

### 站艺决策项（deepseek flash 不动代码，先出决策卡）

| # | 问题 | 卡片内容 |
| --- | --- | --- |
| D1 | 线程管理：要不要「置顶 / 归档 / 重命名」作者侧操作？（W3 的根治） | 列代价：新增作者侧状态存哪（prefs or Canon 外的工作区文件）、工作量 |
| D2 | 右栏退役丢掉的「最近 AI 活动 / 置顶提案预览」要不要补回？ | I3.4 丢弃清单 + 补回成本 |
| D3 | 续写档位与流式（W10） | 实测数字 + 换档风险 + 流式协议成本 |
| D4 | 窄窗 1184 以下对话列彻底消失要不要留回归路径？ | todo.md 已记录的产品决策 |
| D5 | W4 的草稿残留清理授权 | 列出将删除的具体文件与内容 |
| D6 | W8 根治路径：organizer 契约加 name（改 Canon 语义，属停止条件） | 两条路径（改契约 vs 只改提示词）的代价 |

---

## 2. 改造目标与可验收标准

### 2.1 目标一句话

**一个第一次打开的中文作者，能在不被工程术语、垃圾数据、死白画布打断的情况下，完成「打开 → 选章 → 写 → 让 AI 续 → 提交 → 审阅 → 接受」的完整闭环。**

### 2.2 可验收标准（全部人类视角，可证伪）

- **A1 崩溃隔离**：人为触发任一画布崩溃（spec 里 mock），其余画布照常打开；崩溃画布显示自己的降级卡（标题 + 原因 + 重试），**不是死白**。真机等价验证：`--disable-gpu` 环境跑走查，地图屏显示降级卡，且切走再切回其余视图正常。
- **A2 全中文**：走查探针在**作者可见区域**（排除进阶面/诊断）收集全部可见文本，断言不含 `Describe what you want to build`、`Deep...`（模型英文名另行处理为中文标签或保持但不算文案）、`Canon`、`workdir`、`R\d+`（版本徽标除外——徽标是设计元素）。证据：探针输出 `nonChineseStrings: []`。
- **A3 新手闭环**：清空状态的作者从打开应用到完成第一次「选章 → 写一句 → 提交」：落地页有引导卡（W6）、每一步不需要左栏之外的探索、提交流程的每一句文案作者能复述他在确认什么（W5 改写后）。
- **A4 线程可用**：新建的作者对话线程在列表前 5 条可见，探针/任务类线程不淹没它们（具体机制随 D1 决定，最低标准：列表默认段看不到「把 ok 写入指定文件」这类行——agent origin 的会话折叠进单独分组）。
- **A5 数据卫生**：走查探针结束后 workdir 草稿文件与探针开始前逐字节一致；spec 断言编辑器加载时不会把非作者输入的残留当正文展示（无法完美区分，但 W4 的具体残留清理后，探针规约保证不再产生）。
- **A6 回归不破**：既有 439 tests 全绿（改文案的 spec 允许同步改断言，**不许删除**）、typecheck/lint/diff-check 0、smoke exit 0、`lib/client.js` ≤ 2,400,000 B、`port-prototype-css.mjs --check` 通过（若动了结构）。

---

## 3. 分阶段任务拆分（优先级序）

每个增量的格式沿用 `editor-first-frontend-2026-09-17.md`：**目标 / 涉及文件 / RED / GREEN / 真机验证**。deepseek flash 每轮取**第一个未勾选项**。顺序即优先级：先止血（崩溃与死白），再通语言（全中文），再通流程（新手闭环），再清理（数据卫生与体验），最后决策项交站艺。

### Phase W — 止血（致命级，先做）

#### I-W1 画布错误边界 + 视图降级卡（W1+W7，一次做完——同根因）

- **目标**：任何画布崩溃不污染其它画布；每个画布有自己的「打不开」降级态。
- **涉及文件**：`NovelCanvas.tsx`（加 per-view ErrorBoundary 组件）、新 `CanvasErrorBoundary.tsx`（或就近放同文件）、`StoryMapView.tsx`（WebGL 预探测 + 降级卡）、`novel-workbench-shell.spec.ts`（扩展）、`scripts/smoke-workbench.mjs`（加降级断言）。
- **RED**：spec 断言「一个视图的渲染函数抛错时，其余视图仍能打开；崩溃视图显示降级卡（含重试按钮）」。先跑，预期失败（当前整个 canvas 崩）。
- **GREEN 要点**：
  1. ErrorBoundary 包住 `Shell` 的 children（每个视图分支一层，不是整个 canvas 一层——整层一层会退回「一崩全崩」）。
  2. 降级卡复用 `err-card` 原型样式（CSS 已有），内容三件套：这个画布的名字、一句原因、重试按钮。
  3. `StoryMapView` 挂载前探测 WebGL（`canvas.getContext('webgl2') ?? getContext('webgl')`，null 即降级），**探测失败不抛错**，直接渲染降级卡。
  4. 降级卡的「重试」重挂载该视图（key +1），不刷新整页。
- **真机验证**：走查探针复跑，`--disable-gpu` 下地图屏截图显示降级卡；cast/其余视图正常渲染（`data-novel-canvas` 各自的内容标记存在）；console 无未捕获错误。
- **验收**：A1。

#### I-W2 提交确认卡去工程术语（W5）

- **目标**：确认卡文案作者能懂；全应用作者面不出现 Canon/workdir/R 版本号散文。
- **涉及文件**：`NovelEditor.tsx`（确认卡 JSX）、`novel-copy.ts`（若抽公共文案）、`novel-workbench-editor.spec.ts`、`scripts/smoke-workbench.mjs`。
- **RED**：spec 断言确认卡文本不含 `Canon`、不含 `R\d+ 对齐`、不含 `workdir`；含「逐条」「接受」「故事内容不会变」这三个关键语义词。先跑，预期失败。
- **GREEN 要点**：按 §1 W5 的改写方向重写两段文案；「提交成提案」按钮改「请 AI 起草建议」或站艺定的词（先用前者，站艺可改）；「先不提交」保留。**边界说明那句不能丢**（「接受前故事内容不变」是信任承诺），只是换人话。
- **真机验证**：走查探针 step 6 复跑，断言卡文本无术语；截图留档。
- **验收**：A2 部分 + A3 的提交一步。

#### I-W3 composer 文案中文化（W2，先查证再动手）

- **目标**：右栏输入区可见文案全中文（或至少中英不再混杂）。
- **前置查证（RED 的一部分，查证本身就是本轮产物）**：
  1. `@deepseek-ai/dsh-client-locale` 的词表机制是否覆盖 `dsh-client-ui-conversation` 的 composer 文案——读 host 页面里 locale 服务的注册表（CDP 取），或读包源码（`node_modules` 里 profile 安装的那份，**不是仓库根的**——I1.1 的教训）。
  2. 若 locale 覆盖不了：查 composer placeholder 的 DOM 结构，确认 `::placeholder` 能否从 frame 级 CSS 命中（hash 类名不影响伪元素选择器）。
- **涉及文件**：查证记录 `docs/evidence/2026-09-18/composer-locale/`；落点三种可能：locale 词表注入（`index.tsx`）、FRAME_CSS 追加 placeholder 覆盖（`WorkbenchFrame.tsx`）、或两者组合。**查证结论若是「官方 seam 完全封闭」→ 停下问站艺**（这构成规格冲突，§5）。
- **验收**：A2 的 composer 部分；截图留档（01 那张的右栏不再有英文）。

#### I-W4 线程列表降噪（W3 的不动 Canon 部分）

- **目标**：默认视图下，探针/任务类会话不再与作者对话混排。
- **涉及文件**：`NovelRail.tsx`（线程段分组）、`novel-workbench-rail.spec.ts`。
- **RED**：spec 断言「origin 为 agent/自动化的会话（判定依据先查官方 `SessionSummary` 有无 origin 字段——I5.x 用过 `origin !== 'subagent'`，同样思路）不进默认线程段，折叠进『其他会话』分组」。先跑，预期失败。
- **GREEN 要点**：默认段只显示「作者手动发过消息」的线程（判定：会话日志里有 user 行且不是注入——I8.1 的前缀判定可复用）；其余折叠成「历史会话 N 条」一行。**不删任何会话**，只是显示分层。D1（置顶/归档）等站艺拍板后再做。
- **真机验证**：走查截图左栏线程段不再出现「把 ok 写入指定文件」。
- **验收**：A4。

#### I-W5 草稿残留清理 + 探针规约补丁（W4）

- **前置：站艺在 D5 上签字**（删除 workdir 文件是写操作）。
- **做法**：① 按授权清理 `/private/tmp/nw-workspace/天机阁主/第1章《开篇章》.草稿.md` 的测试残留（删除文件或还原为空，按授权执行）；② `editor-first-frontend-2026-09-17.md` §4 固定动作追加第 11 条：「探针产生的草稿文件，探针结尾必须删除或还原，并在 summary 里记录 before/after sha256」；③ 本文件 §4 的走查探针自己先遵守（`probe-walkthrough.mjs` 目前打了「夜里风大……」——**本轮走查自己也留了残留，先清理它**）。
- **验收**：A5。

### Phase X — 新手闭环（严重级收尾）

#### I-X1 落地页引导卡（W6）

- **涉及文件**：`NovelCanvas.tsx`（editor 空态分支）、spec、smoke。
- **RED**：spec 断言「已立项、无选中章节时，主画布有引导卡：列出前 3 章各自状态、每章可点进编辑器；副标题不含 workdir/Canon」。先跑，预期失败。
- **GREEN 要点**：引导卡用 `hero-card` 样式（原型 CSS 已有）；章节列表从 `loadOutline` 取（数据已有）；「让 AI 规划下一章」入口走既有线程通路（`submitChapterProposal` 同款 `beginSubmission`，不自建投递）；副标题改「选一章开始写，稿子自动保存在你自己的文件夹里」。
- **真机验证**：走查 step 1 复跑截图：主画布有卡、有点得动的章。
- **验收**：A3 的落地一步。

#### I-X2 编辑器头部瘦身 + 面板互斥（W9+W11）

- **前置判断**：结构改动（9 元素 → 收纳）**先改原型 HTML 再重生成 CSS**（§2 设计来源规则）；互斥是纯 state 改动，直接做。
- **涉及文件**：原型 `docs/prototypes/2026-09-16-novel-mode/novel-mode-workbench.html`、`scripts/port-prototype-css.mjs`（重生成）、`NovelEditor.tsx`（头部 JSX + 互斥 state）、spec。
- **RED**：spec 断言「确认卡打开时续写面板关闭」；真机断言头部可见按钮数 ≤ 4（章节名/模式/状态字数合并区/主操作）。
- **GREEN 要点**：头部重排为「章节名 + 模式切换 | 状态·字数（次要色）| 续写 ··· 菜单（提交本章/重新提炼收进去）」；「提交本章」是唯一保留的一级按钮（它是唯一触达 Canon 的动作，值得一级位置）。原型改完跑 `--check`。
- **真机验证**：走查 step 3/6 复跑：头部元素数、叠加不复现。
- **验收**：A3 部分 + W9/W11 关闭。

#### I-X3 加载骨架屏（W12）

- **涉及文件**：`NovelCanvas.tsx` 各视图分支（`.sk` 样式已有）、spec 可选。
- **GREEN 要点**：数据未到时渲染 2–3 行 `.sk-line`/`.sk-card` 骨架，替换现在的「正在读取…」纯文本（两者都行，骨架观感更好；保留文本亦可，二选一，不叠加）。低风险小增量。
- **验收**：走查各视图切换瞬间不再纯白。

#### I-X4 transcript 上下文噪音过滤 + 失败重试修正（W13）

- 即原 I8.1 方案，全文见 §3 Phase 8 旧稿（保留在本文件 git 历史里）：识别 `Current runtime context` 固定前缀，过滤**显示**与 `rememberSubmission`，不删日志。spec + smoke 泄漏检查 + 探针验证。
- **验收**：A2 的 transcript 部分。

#### I-X5 提炼模式与钉位持久化（W14）

- 即原 I8.2 + I8.3 方案：`refineMode` 进 prefs 切片（逐字段校验、未知回落）；`mapPins` 按 `workspaceId#personId` 键控进 prefs。各自 spec + 探针 reload 验证。
- **验收**：刷新后模式与钉位保持。

### Phase Y — 站艺决策项（deepseek flash 只写卡，不动代码）

#### I-Y1 六张决策卡（D1–D6）

- **产出**：`tasks/decisions-2026-09-18.md`，六节，每节：现状、选项（含「不做」）、各选项代价（工作量/风险/边界冲突）、deepseek flash 的建议（可给，决定权在站艺）。
- **验收**：站艺逐条批复后，批复结果回写进本文件 §3 对应增量的「前置」处，对应增量才开工。

---

## 4. 给 deepseek flash 的执行规约

### 4.1 开工前固定动作（每轮）

1. `cd /Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent && git status --short`（读第一列）。
2. 读 `AGENTS.md` + `tasks/editor-first-frontend-2026-09-17.md` §0–§2 + 本文件。
3. 取本文件**第一个未勾选**增量（顺序 I-W1 → I-W2 → I-W3 → I-W4 → I-W5 → I-X1 → I-X2 → I-X3 → I-X4 → I-X5 → I-Y1）。
4. `corepack pnpm test` 确认基线绿；`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4780/` = 401 确认 host 在。

### 4.2 TDD 与门禁（每个增量）

RED（先测先跑存失败原因；首绿则定点破坏证明能咬人）→ GREEN（最小实现）→ REFACTOR → 门禁：

```bash
corepack pnpm test && corepack pnpm typecheck && corepack pnpm lint && git diff --check
scripts/dev-host.sh rebuild && node scripts/smoke-workbench.mjs   # 改了产品源码时
node scripts/port-prototype-css.mjs --check                        # 改了原型时
```

体积护栏：`lib/client.js` ≤ 2,400,000 B raw。

### 4.3 真机验证规约（本计划新增，比旧计划严）

- **每个改可见面的增量，走查探针必须复跑对应 step 并附新截图**——「spec 绿」不再足够（§0 的教训：spec 看不见文案与观感）。
- 探针规约：产生的草稿文件结尾删除并记录 sha256 before/after（I-W5 的新规约，探针自己先遵守）。
- 走查环境注意：沙箱内 Chrome 需要 `--no-sandbox --disable-gpu --remote-allow-origins=*`（本轮踩过：缺前者 SIGTRAP、缺后者 WebGL 崩溃、缺第三个 WS 连上即断）；**`--disable-gpu` 会让地图走降级卡，这本身是 I-W1 的验收环境**。

### 4.4 停止条件（问站艺）

改 Canon 语义（D6）、DSH 版本、`~/.dsh`；规格冲突（如 I-W3 查证出官方 seam 封闭）；需要 push/发布；Phase Y 全部。

### 4.5 绝不做

为绿灯删/弱化测试；mock 冒充完成；未验证称 verified；补全/续写/提炼直写 Canon；**以「rendered」当验收**（本计划的验收是 §2.2 的人类标准）。

---

## 5. 优先级总览

| 序 | 增量 | 修的问题 | 类型 | 大小 |
| --- | --- | --- | --- | --- |
| 1 | I-W1 错误边界 + 降级卡 | W1 W7 | 修复 | 中 |
| 2 | I-W2 确认卡去术语 | W5 | 文案 | 小 |
| 3 | I-W3 composer 中文化 | W2 | 查证+修复 | 中（查证有分叉） |
| 4 | I-W4 线程降噪 | W3 | 修复 | 中 |
| 5 | I-W5 草稿清理+探针规约 | W4 | 数据+流程 | 小（需 D5 授权） |
| 6 | I-X1 落地引导卡 | W6 | 新界面 | 中 |
| 7 | I-X2 头部瘦身+互斥 | W9 W11 | 结构 | 中（走原型） |
| 8 | I-X3 加载骨架 | W12 | 体验 | 小 |
| 9 | I-X4 transcript 过滤 | W13 | 修复 | 小 |
| 10 | I-X5 持久化 | W14 | 修复 | 小 |
| 11 | I-Y1 决策卡 ×6 | D1–D6 | 决策 | 无代码 |

**挂起（维持既有查证结论）**：只看本卷（Canon 单卷）、人物 name 根治（D6 批复前）。

---

## 6. 给 deepseek flash 的第一句话

> 读 `AGENTS.md` 与 `tasks/editor-first-frontend-2026-09-17.md` §0–§2，然后取本文件 **I-W1** 开工。
> 前端的测试是绿的，但作者会死白、读英文、认不出自己的人物——你修的是这些。
> 每个增量：RED → GREEN → 门禁 → **走查探针复跑对应 step 附截图**。验收标准是 §2.2，不是「rendered」。
