# 前端组件开源选型（复用优先）— 2026-09-16

**触发：** 用户 2026-09-16 指示：前端实现优先去 GitHub 找现成实现直接拿来用，不重复造轮子——效果更好、开发更快、更接近人的审美；并点名「关系图谱用 Obsidian 里那个的开源实现」。

**本文件地位：** 选型记录（尚未安装任何依赖）。按 `AGENTS.md` 的开源复用门禁，落地前每项仍需补隔离 Profile 的加载 smoke 与 bundle 体积实测。

## 0. 先纠正一个前提

- **Obsidian 本体闭源**：官方从未开源它的 graph view，因此「Obsidian 那个图谱的开源实现」在严格意义上不存在。
- 最接近它观感与交互范式的开源实现是 **Quartz 的 graph 组件**（`jackyzha0/quartz`，MIT，13.2k★，2026-09-15 仍有提交）：
  `quartz/components/scripts/graph.inline.ts`（v4 分支实测 18.5 KB）用 **pixi.js** 做 WebGL 渲染、
  `@tweenjs/tween.js` 做动画，提供 local / global 两级图谱（官方文档页 `quartz.jzhao.xyz/features/graph-view` 已核对）。
  它不是 Obsidian 官方移植，本仓库不得把它写成"官方移植"。

## 1. 关系图谱候选（已核对许可证与维护状态）

| 候选 | 最新版本 | 许可证 | 上游活跃度 | 判断 |
| --- | --- | --- | --- | --- |
| **sigma.js + graphology** | `sigma@3.0.3` / `graphology@0.26.0` | MIT | 12.2k★ / 1.7k★，2026-09 仍有提交 | **主选**：WebGL 渲染能扛规模；graphology 提供 forceatlas2 / noverlap 布局与钉位；edge program 可自绘双向双色语义；生态成熟 |
| **react-force-graph-2d** | `1.29.1` | MIT | 3.3k★，最后提交 2026-02 | **快速路径备选**：d3-force + canvas，React 组件化最省事；代价是单维护者、半年未更新 |
| **Quartz 的 pixi 图谱** | v4 分支 | MIT | 13.2k★，活跃 | **视觉与手感参照**：研究它的物理参数、hover/拖拽手感与配色层级；不直接引入（它绑定 Quartz 的内容索引与 DOM 结构） |
| `d3-force`（自绘） | `3.0.0` | ISC | 稳定 | 仅作为上面两者的底层依赖，不自写渲染层 |
| `pixi.js` | `8.20.1` | MIT | 活跃 | 若最终选 Quartz 路线才引入 |

## 2. 其余前端能力的复用清单

| 能力 | 采用 | 版本 | 许可证 | 说明 |
| --- | --- | --- | --- | --- |
| 三栏分栏 / 拖拽 / 折叠 | `react-resizable-panels` | `4.12.4` | MIT | 左导航 / 主画布 / 右栏几何 |
| 命令面板（`/`、`@` 候选） | `cmdk` | `1.1.1` | MIT | 统一输入区的候选菜单 |
| 长列表虚拟化（卷章树、债务、审阅问题） | `@tanstack/react-virtual` | `3.14.13` | MIT | 头部无渲染，样式自管 |
| 图标 | `lucide-react` | `1.46.0` | ISC | 与 Claude 桌面版同类的描边图标风格 |
| 图表（字数进度、节奏曲线，后置） | `recharts` | `3.10.1` | MIT | 首版可不引入 |
| 正文渲染（已接受正文、Markdown 导出预览） | `marked` | `18.0.13` | MIT | 轻量、无框架绑定 |
| 版本对比 diff | 复用仓库现有 `diff` | `9.0.0` | BSD-3-Clause | 已在依赖里，不再引入第二个 diff 库 |

许可证与版本来自 npm registry `/latest` 实测（2026-09-16）；GitHub 星标与最近提交来自 GitHub API 实测。

## 3. 与 DSH 客户端约束的关系

- DSH 的 `PLATFORM_MODULES` 只冻结 React、Cordis 与静态 UI 库；**上表其余依赖必须由 tsdown 打进插件的 `lib/client.js`**，因此 bundle 体积是选型的一等指标（当前 `novel-project` 的 client bundle 已有约 1.6 MB）。
- 图谱是唯一可能显著增重的依赖：落地时先量 `sigma + graphology` 与 `react-force-graph-2d` 的实测体积，再决定；若两者都过重，退回「`d3-force` 布局 + 自绘 canvas」，但仍不自写力导向实现。
- 所有引入项在安装前必须完成：`pnpm install` 的 lockfile diff 审阅、install script 审阅、`THIRD_PARTY_NOTICES.md` 与 `docs/upstream-sources.md` 更新、隔离 Profile 的真实加载 smoke。

## 4. 待办（实现前补齐，不许用 README 代替证据）

- [ ] 关系图谱最终选型：量化 bundle 体积 + 40–120 节点下的交互实测（分簇、双向边语义、钉位、搜索高亮）。
- [ ] 每个依赖记录精确版本、许可证、install script 与传递依赖许可证。
- [ ] 隔离 `novel` profile 的真实加载 smoke（Host 启动 + client loader HTTP 200 + 面板渲染）。
- [ ] 更新 `THIRD_PARTY_NOTICES.md`、`docs/upstream-sources.md` 与 README 的下载项表格。

## 5. 实测：故事地图选型与 bundle 体积（2026-09-16）

**采用：`sigma@3.0.3` + `graphology@0.26.0` + `graphology-layout@0.6.1` + `graphology-layout-forceatlas2@0.10.1`（均 MIT，无 install/postinstall 生命周期脚本）。**
实现见 `packages/novel-workbench/src/client/StoryMapView.tsx`：graphology 建图 + forceAtlas2 布局 + sigma 渲染，
forceAtlas2 的布局算法与 sigma 的 WebGL 渲染都由上游提供，本仓库不写力导向与绘制。

隔离对照（`/tmp/ossize`，esbuild 0.25.12，minify，`react`/`react-dom`/`react/jsx-runtime` external）：

| 方案 | minified | gzip |
| --- | --- | --- |
| `sigma + graphology + forceatlas2` | 165.8 kB | 40.0 kB |
| `react-force-graph-2d@1.29.1` | 186.7 kB | 61.3 kB |

真实插件 bundle（`packages/novel-workbench/lib/client.js`，tsdown，CJS，未 minify）：

| 时点 | 原始 | gzip |
| --- | --- | --- |
| 增量 1（仅 root 接管） | 33,334 B | 9,173 B |
| 增量 2–5（左栏 + 意见审阅 + 进阶面） | 33,334 B → 未单独记录 | — |
| 加入图谱栈后（最终） | 490,183 B | 89,048 B |

结论：图谱栈使 workbench 的 client bundle 增加约 **+457 kB 原始 / +80 kB gzip**（未 minify；Host 的 webserver 已开 gzip）。
总 client loader（全部 45 个插件）实测 5,753,853 B，仍然一次加载完成，没有按需分包的余地——因为 DSH 的
ClientModuleSystem 每个插件只提供一个 `client.js`，切分包会破坏加载器契约。

**已定位的构建坑（已修）**：`format: 'cjs'` 会让 tsdown 把 rolldown 的 `platform` 强制回 `node`，
于是 `graphology` 的 `import { EventEmitter } from 'events'` 被当成 Node 内建外部化，浏览器端
`client-modules: require("events") missed the module table` 直接白屏。修法是 `tsdown.config.ts` 里
`alias: { events: resolve('events/events.js') }`，把 npm 的 `events@3.3.0`（MIT，graphology 自己的依赖）
打进 bundle。**任何后续引入 graphology 生态（`graphology-layout-*`、`graphology-communities-*` 等）都要复测这一条。**

**真实浏览器烟测（`/tmp/ossize`，headless Chrome + SwiftShader WebGL）**：同一个依赖组合（含 `events` 别名）
可正常建图、布layout、渲染 7 张 sigma canvas，控制台无报错。过程中发现并修掉两个只在真实运行路径暴露的缺陷：
1. forceAtlas2 只扩展现有坐标，sigma 拒绝没有数值 `x`/`y` 的节点 → 先跑 `graphology-layout` 的
   `circular.assign`（确定性起始环）再跑 FA2；
2. 见上一条 `events` 外部化。

**未完成**：40–120 节点规模下的分簇折叠（「+N」气泡）、按卷/弧过滤、拖拽钉位、搜索定位；当前实现是
全量人物 + 每条关系一条边 + 势力配色 + 选中淡出。

### 补充（2026-09-17，I6.1a）

上面「未完成」那条里的**分簇折叠（+N 气泡）与拖拽钉位已落地**，但**没有沿用 forceAtlas2**：
原型的分簇环布局（簇盘 + 盘内环 + `+N`）是确定性的，而力导向恰好是「40 人变毛球」的那个成因。
布局因此改为本仓库的纯函数 `packages/novel-workbench/src/client/story-map-layout.ts`，
sigma 只负责渲染、缩放、平移与拖拽。

- 这正是本文 §4 那条门禁的例外情形：**不是自造渲染**（渲染仍是 sigma），而是**自造布局**，
  理由是实现与原型一致的分簇几何，上游没有提供。几何是纯函数，因此可以脱离 WebGL 单测。
- **`graphology-layout@0.6.1` 与 `graphology-layout-forceatlas2@0.10.1` 已从依赖与 bundle 中移除**。
  先是视图不再 import 它们（`lib/client.js` 1,611,088 B → 1,568,475 B），
  随后两个包离开 `package.json` 与 lockfile（46 行删除、0 行新增；`pandemonium` / `mnemonist` /
  `obliterator` 随之离开）。上表第 62 行的 165.8 kB 对照值**不再代表当前依赖组合**，保留为选型当时的口径。
- **仍未完成**：按卷/弧过滤（`I6.1b`）—— 查实这份 Canon 里 story-event 的 `manuscriptOrder` 全是 `null`，
  而作品只有一卷，所以这个筛选今天按定义改不了任何东西，做成控件就是「按了没反应」。

### 补充（2026-09-19，I-P1）

**力导向回归：撤销 2026-09-17 的簇盘几何偏离，`graphology-layout@0.6.1` 与 `graphology-layout-forceatlas2@0.10.1` 加回依赖与 bundle。**

- 偏离的根因是「40 人变毛球」，但毛球的成因是力导向参数未调好，不是力导向本身。Obsidian graph view（标杆）是力导向的，I-P1 的目标是回归力导向 + 对标 Obsidian。
- 布局改回 `circular.assign`（确定性起始环）→ `forceAtlas2.assign`（力导向迭代 80 次，settings 用 `inferSettings(graph)` 自适应）→ 钉位覆盖。`story-map-layout.ts` 退役删除。
- 分簇折叠（disc + `+N` 气泡）与轴切换（faction/place seg 控制）随布局回归移除——forceatlas2 不分簇，所有人物都画。对应 2 个 spec test 删除，`novel-workbench-story-map-layout.spec.ts`（10 tests）随 `story-map-layout.ts` 退役删除。
- 节点 size 改 `5 + min(debts,3)*3`（degree 3 = 14px ≥ 2× degree 0 = 5px），对标 Obsidian「web 中心读大于叶子」。
- mapPins 从组件 state 移入 workbench prefs（hydrate/dehydrate + setMapPin/clearMapPins），钉位跨 reload 保持。
- hover 高亮连通子图（enterNode/leaveNode + nodeReducer/edgeReducer，focus = hovered ?? selected），对标 Obsidian hover 手势。
- 按卷/弧过滤仍 blocked（`manuscriptOrder` 全 null，同 I6.1b 结论）。
- bundle 体积待测（加回 forceatlas2 后）；2026-09-17 移除时 `lib/client.js` 从 1,611,088 B 降到 1,568,475 B（-42 kB），加回预计回升约 +42 kB，仍在 2,400,000 B 护栏内。
