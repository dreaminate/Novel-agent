# 小说模式前端：真机记录与可重跑证据 — 2026-09-16

**这份记录解决什么：** 2026-09-16 的前端移植（rail / topbar / 右栏 / 输入条 / 设置 / 人物档案 +
八个画布 + 两条边界态）此前只有 `tasks/todo.md` 的勾选和 `/tmp` 里的一次性截图。本文件把每个屏幕
落到「实现文件 + 覆盖测试 + 最近一次真机证据」，并给出可重跑的扫描命令。

**基线：** DSH `0.1.2-rc.1` + 本仓库 `dsh-session` 补丁；profile `novel`（`dsh-base + dsh-web-app +
六个 novel-agent 插件`）；Host `127.0.0.1:4780`。扫描时 Canon 处于 **R5**。

**怎么重跑：**

```bash
scripts/dev-host.sh start                       # 已有带 token 的 Host 时跳过
node scripts/smoke-workbench.mjs                # 输出到 .novel-agent/run/sweep/（已被 .gitignore 忽略）
```

脚本只读：只导航、点击、取文本、截图，不写 Canon、不改 profile、不动工作区。退出码 0 表示每个
可达画布都渲染出了自己，且浏览器没有 console / page / request 报错。

本轮扫描的机读记录同时附在本目录：[`novel-mode-front-end-sweep-2026-09-17.json`](novel-mode-front-end-sweep-2026-09-17.json)。

## 1. 屏幕矩阵

`state` 与数字来自本轮扫描（`.novel-agent/run/sweep/sweep.json`，2026-09-17 00:0x 本地时间）。

| 屏幕 | 画布标记 / 入口 | 实现 | 覆盖测试 | 本轮真机证据 |
| --- | --- | --- | --- | --- |
| ① 工作台（故事地图 + 三段左栏 + 右栏 + 底部输入） | `[data-novel-workbench=frame]`、`[data-novel-rail=nav]` | `WorkbenchFrame.tsx`、`NovelRail.tsx`、`StoryMapView.tsx` | `novel-workbench-shell.spec.ts`、`novel-workbench-rail.spec.ts`、`novel-workbench-story-map.spec.ts` | `rendered`；rail 段 `works / threads / views`，视图入口 9 个；地图头 `故事地图`，正文 `R5 · 7 个人物 · 3 条关系`，并折叠 `+3 位未连线人物`（sigma 已画出 accepted 人物，头部报的是总数） |
| ①b 故事地图的规模化 | `[data-novel-story-map-search]`、`[data-novel-story-map-folded]` | `StoryMapView.tsx` | `novel-workbench-story-map.spec.ts` | `rendered`；真实 Canon 上折叠 3 人；搜索命中会选中并淡出其余节点，命中被折叠的人物时先展开折叠cast；无匹配时报 `没有匹配的人物。` |
| ② 提案审阅 | `[data-novel-proposal]` → `[data-novel-canvas=review]` | `ProposalReviewView.tsx` | `novel-workbench-review.spec.ts` | `skipped-no-proposal`：当前工作区没有待决提案，见 §2 |
| ③ 过期提案 | 同上（`review` 画布的过期态） | `ProposalReviewView.tsx` | `novel-workbench-review.spec.ts` | 同上，本轮无待决提案可走到该态 |
| ④ 接受设定·拒绝正文 | 同上（接受路径） | `ProposalReviewView.tsx` | `novel-workbench-review.spec.ts` | 该路径会写 Canon，只读扫描不覆盖，见 §2 |
| ⑤ 正文阅读 | `[data-novel-chapter]` → `[data-novel-canvas=read]` | `NovelCanvas.tsx` | `novel-workbench-shell.spec.ts` | `rendered`；打开 `开篇章`，257 字符可见文本，`顾辰在漏雨的屋檐下睁眼…`（真实 accepted 正文） |
| ⑥ 人物档案 | `[data-novel-person-file]` 抽屉 | `PersonFileDrawer.tsx`、`PersonFileSeat.tsx` | `novel-workbench-person.spec.ts` | 本轮未走抽屉入口（可从人物与关系屏双击打开），见 §2 |
| ⑦ 伏笔与线索板 | `[data-novel-canvas=clues]` | `ClueBoardView.tsx` | `novel-workbench-shell.spec.ts` | `rendered`；`共 6 条，已接受 R5`，逐条带类型 / 状态 / 回收窗口 / 证据锚点 |
| ⑧ 未收束债务 | `[data-novel-canvas=debts]` | `DebtBoardView.tsx` | `novel-workbench-shell.spec.ts` | `rendered`；`3` 条债务，带时钟标签（世界 / 关系）、摘要、`回收窗口：第 9–11 章`、`0 章未推进` |
| ⑨ 时间线 | `[data-novel-canvas=timeline]` | `TimelineView.tsx` | `novel-workbench-shell.spec.ts` | `rendered`；两条 `已发生` 故事事件，最后一条标 `当下` |
| ⑩ 写作记忆 | `[data-novel-canvas=memory]` | `MemoryView.tsx` | `novel-workbench-shell.spec.ts` | `rendered`；`基于 R5，最新`，`2 条摘要`，每条带 `写入于 R2` 与新鲜度 |
| ⑪ 版本历史 | `[data-novel-canvas=history]` | `VersionHistoryView.tsx` | `novel-workbench-shell.spec.ts` | `rendered`；R5…R1 五行，当前 R5（`3 条设定变更`），R4 为 `开篇章 · 约 213 字 · 6 条设定变更`，其余各行带 `回滚到此版本` |
| ⑫ 线程对话流 | `[data-novel-conversation-seat]` + `[data-novel-thread-header]` | `NovelThreadHeader.tsx`（对话面仍为官方实现） | `novel-workbench-failure.spec.ts`、`novel-workbench-composer.spec.ts` | `rendered`；线程 `天机阁主`，条带读出 `R5` 与线程名 |
| ⑬ 进阶面 | `[data-novel-advanced-item]` → `[data-novel-canvas=advanced]` | `AdvancedView.tsx` | `novel-workbench-advanced.spec.ts`、`novel-workbench-advanced-panels.spec.ts` | `rendered`；内核读出真实 `workspaceId` / 目录 / `R5` / 线程 id；插件清单、Agent preset、Cordis 树、任务、Subagent、原始 Canon 六段俱在 |
| ⑭ 夜间关键屏 | `[data-novel-workbench=frame][data-nw-theme=night]` | `NovelTopbar.tsx`、`theme-presenter.ts`、`workbench-css.ts` | `novel-workbench-shell.spec.ts` | `rendered`；点「夜间」后 frame 背景实测 `rgb(48, 48, 46)` |
| ⑮ 窄窗 1280 | `Emulation.setDeviceMetricsOverride(1280×900)` | `workbench-css.ts` | `novel-workbench-shell.spec.ts` | `rendered`；`viewport 1280 / documentWidth 1280`（无横向滚动）、frame 1280、rail 247 |
| ⑯ 设置 | `[data-novel-settings-open]` → `[data-novel-settings]` | `NovelSettings.tsx` | `novel-workbench-settings.spec.ts` | `rendered`；实测 `unhonorableControl: false`，面板只剩主题 / 正文大小 / 阅读行宽三项，能兑现的选择才出现在这里 |
| ⑰ 空项目 / 缺插件 / AI 无输出 | `[data-novel-rail-gap]`、`MissingPluginCard.tsx`、条带失败态 | `NovelWelcome.tsx`、`MissingPluginCard.tsx`、`index.tsx` | `novel-workbench-adopt.spec.ts`、`novel-workbench-contexts.spec.ts`、`novel-workbench-failure.spec.ts` | 需要别的部署条件才能走到，见 §2 |

本轮扫描 15 个屏幕 `rendered`、1 个如实跳过、**浏览器 console / page / request 报错均为 0**。

## 2. 覆盖边界：扫描做到的和做不到的

扫描是**只读**的，所以它覆盖所有「读出来就能判断」的屏幕，不覆盖任何需要**写 Canon** 才能产生的态：

- **提案审阅 / 过期提案 / 接受设定·拒绝正文**：三条都要求工作区里存在一个待决 Result Packet。
  本轮扫描时待决提案为空（`todo.md` 提到的 `tiangege-status-r2-2026-09-16` 已不在收件箱），
  所以脚本如实报 `skipped-no-proposal`，而不是伪造一个提案。要恢复这一屏的真机证据，需要作者
  或模型真的提一次案；这也是[上一轮记录](ui-redesign-2026-09-15.md)与 `/tmp/nwreview*.png` 仍是
  这些屏幕最近证据的原因。
- **人物档案抽屉**：入口是从「人物与关系」屏双击一个人物。当前脚本没有走这一步（左栏视图本身
  已覆盖 `cast`），抽屉的证据仍来自 `novel-workbench-person.spec.ts` 与 `/tmp/nwperson-drawer.png`。
- **空项目**：需要 `novel-min` profile 或一个空工作区；`novel-workbench-adopt.spec.ts` 覆盖行为，
  真机证据来自 `/tmp/nwadopt2-form.png`。
- **缺插件**：需要隔离的 `novel-min` profile（`dsh-base + dsh-web-app + novel-project + novel-workbench`）。
  Host 已在 4782 上跑过该 profile，卡片按设计渲染；本轮未重跑，证据为 `/tmp/nwmin2-contract.png`。
- **AI 无输出**：需要一次真实失败的回合（无效凭据）。`novel-workbench-failure.spec.ts` 覆盖逻辑，
  真机证据为 `/tmp/nwstrip4.png`。

这些边界态**不是**未实现，而是需要写操作或另一个部署条件；脚本已经把这些情况报成
`skipped-*` 而不是失败，避免把「没有素材」伪装成「通过」。

## 3. 扫描观察到的真实 Canon 状态

扫描顺带确认了 `tasks/todo.md` 顶部那组数字（它们此前只有 `/tmp` 记录支持）：

- 当前 **R5**；`故事地图` 读出 **7 个人物 · 3 条关系**；`伏笔与线索板` **6 条**；`时间线` **2 个**已发生事件；
  `未收束债务` **3 条**；`版本历史` R1–R5 五级，R4 = `开篇章 · 约 213 字 · 6 条设定变更`。
- 该工作区 (`/private/tmp/nw-workspace/天机阁主`) 的 accepted 正文是一篇**穿越 / 系统题材**的开篇章
  （顾辰、天机阁、青岚城），**不是** `tasks/plan-final.md` §6 的验收小说《雾港夜航：第七码头》。
  也就是说 §6 的 12 章验收**至今没有被触碰**，前端的真机证据与计划里的产品验收是两件事。

## 4. profile 安装路径修复与冷启动

`scripts/install-plugins.sh` 与 `.ps1` 过去把 tarball 打到 `$TMPDIR`/`$env:TEMP`，而被安装 profile 的
lockfile 会记住解析到的 `file:` 路径——临时目录一被清理，profile 就坏。现在两个脚本都默认打包到
`<checkout>/.novel-agent/packages`（`--output-dir` / `-OutputDir` 仍可覆盖）。

冷启动证据：改动后 `scripts/dev-host.sh rebuild` 重装并重启，profile lockfile 里 `/var/folders`
引用从 6 处降为 **0**；Host 重新监听 4780 并签发 token；随后 §1 的整轮扫描在新装的 profile 上通过，
零浏览器报错。

## 5. 门禁

- `corepack pnpm test` — **324 passed / 19 files**
- `corepack pnpm typecheck`（`tsc -b`）— 通过
- `corepack pnpm lint`（oxlint `--deny-warnings`）— 通过
- `git diff --check` — clean
- `node scripts/port-prototype-css.mjs --check` — `workbench-css.ts matches the prototype`

## 6. 收尾增量 — 2026-09-17

三件事，都在同一轮真机扫描里复核。

1. **设置：删掉一个无法兑现的控制。** 面板原来提供「线程里的工具活动」，但它只把选择写进 client store：
   渲染 transcript 的是**官方会话面**，`node_modules/@deepseek-ai/` 里也没有任何工具活动开关可供代理，
   所以这个控制在 novel-agent 这边永远不会有作用。留一个按了不动的开关比没有开关更糟，因此连同
   `WorkbenchSettings.showToolActivity`、`setShowToolActivity` 一起删除；面板现在只保留主题 / 正文大小 /
   阅读行宽三项，并保留一句注释说明为什么四选三。扫描脚本现在把这类控制当成失败：
   `[data-novel-settings-activity]` 若再次出现，`settings` 屏会以 `offers-unhonorable-control` 退出 1。

2. **故事地图规模化：折叠边缘人物 + 搜索定位。** 没有**任何**关系线的人物不再各画一个孤立点，而是折成
   一枚 `+N 位未连线人物` chip（`title` 列出姓名，点击展开）；真实 Canon 上折叠了 **3 / 7** 人，头部仍报
   accepted 总数 `R5 · 7 个人物 · 3 条关系`，所以「地图画了什么」与「Canon 接受了几个人」不会被混为一谈。
   搜索框按 accepted 名字/id 定位：命中即选中并沿用点击的淡出路径，命中落在折叠cast里时先展开再选中，
   无匹配时明说 `没有匹配的人物。`。

3. **未做的两项，以及原因。** 原型里的「按卷 / 弧筛选」需要节点带卷/弧归属，而 `NovelStoryMap` 只从
   Canon 实体与关系投影拿到姓名、势力、关系债务——这是投影数据的缺口，不是前端缺口，故不做假筛选。
   「钉位」是纯 UI 瞬时状态（store 不持久化），要落地得先定「重载后钉位是否保留」，属于设计问题而非收尾，
   一并留给下一轮。

## 7. 未验证 / 未覆盖

- 提案审阅、过期提案、接受设定·拒绝正文、人物档案抽屉、空项目、缺插件、AI 无输出这七屏**本轮没有
  重跑真机**（原因见 §2），它们的状态仍是各自旧记录里的 `verified`，不是本次扫描的结论。
- 扫描跑在 **Web Host** 上。社区 Desktop 目标版本 `v2.0.5` 的兼容模式**未验收**，本记录不构成
  Desktop 证据。
- 扫描不判断文案与视觉是否与原型一致（那需要作者目视），只判断「这个屏幕是否渲染出了自己的内容、
  有没有浏览器报错」。
- 未做：真实模型的完整回合验收（见 `tasks/plan-final.md` §6 的 12 章验收）与用户验收。
