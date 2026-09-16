# 编辑器栈选型记录 — Tiptap / ProseMirror（2026-09-17）

**触发：** `tasks/editor-first-frontend-2026-09-17.md` 决定 11「编辑器用 Tiptap / ProseMirror（MIT）富文本」，
增量 I0.2 要求「引进前先做体积实测，否则不许引依赖」。

**地位：** 选型证据 + 一次**已完成的引入**。先按 §5 阻断，用户 2026-09-17 裁定「放宽预算、直接引入」后，
`@tiptap/react` / `@tiptap/starter-kit` / `@tiptap/pm` 已写进
`packages/novel-workbench/package.json`（精确 `3.31.3`），lockfile 新增 51 个包、移除 0 个。

**⚠️ 本文件的孤立探针低估了真实成本约 2 倍 —— 原因已查明并修掉，见 §1 与 §5。**
**下面 §2–§4 保留的是**裁定前**的探针证据，§5 起是引入后的真实测量与修正。**

**测量环境：** macOS (darwin 25.6.0)，node `v24.14.1`，npm `11.16.0`，
隔离探针 `/tmp/editor-stack-probe` 与 `/tmp/tsdown-probe`（均在仓库外，不污染仓库）。
仓库 bundler：tsdown `0.22.2`（rolldown `1.1.5`，`packages/novel-workbench`）；
对照 bundler：esbuild `0.25.12`（仓库根 devDependency）。

---

## 1. 结论（先给判定）

**已引入。真实增量 +914,423 B raw / +217,057 B gzip；引入后 `lib/client.js` = 1,559,851 B（2.42×）
/ 340,653 B gzip（2.76×），在用户新定的 2,400,000 B raw 上限之内 → PASS。**

**但孤立探针当时给的是 +957,103 B，方向对、口径错。** 真实增量一度是 **+1,865,601 B（3.89×）**，
因为 `@tiptap/react` 会 `import 'react-dom'`，而本仓库 `tsdown.config.ts` 的 `platformModules`
**只外部化 `react` 与 `react/jsx-runtime`，漏了 `react-dom` 与 `react-dom/client`** ——
于是 **react-dom + scheduler 被整个复制进 `lib/client.js`（约 900 KB）**，尽管宿主早就提供了它们。
把这两个 id 补进 `platformModules` 之后，增量回落到 914,423 B，与探针预测（957,103 B）相差 5% 以内。
**教训：孤立探针必须把外部化清单对齐真实构建，否则体积预测可以错一倍。**

三条独立测量（修正后互相印证）：

| 测量方式 | 增量 raw | 引入后 raw | 倍数 |
| --- | --- | --- | --- |
| **仓库真实构建**（`pnpm --filter @novel-agent/novel-workbench build`，临时 import 后量，已还原） | **+914,423 B** | **1,559,851 B** | **2.42×** |
| 仓库 tsdown 0.22.2 孤立对照（react **与 react-dom** external） | +957,103 B | 1,602,531 B | 2.48× |
| esbuild 0.25.12（esm / 不 minify，react+react-dom external） | +848,633 B | 1,494,061 B | 2.31× |

**口径说明（重要）：** 上面「未修 react-dom」的那次真实测量是 2,511,029 B（3.89×）；修掉之后才是 1,559,851 B。
本文件早期版本写的 1,602,531 B 是**探针投影**，现在已被真实测量取代 —— 两者接近纯属巧合
（投影少算了 react-dom，却也没算 StarterKit 的完整保留集）。

按对引入方最有利的 minify 口径，gzip 仍会破原 2 倍线；**换更小的配置也不够**：
去掉 StarterKit 的精简组合 raw 勉强过线（1.96×）但 gzip 仍破（2.22×）；只有退回裸 ProseMirror 才两项都过。

---

## 2. RED：未引入时的基线

真实产物 `packages/novel-workbench/lib/client.js`（tsdown，CJS，**未 minify**）：

```bash
cd /Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent
wc -c < packages/novel-workbench/lib/client.js          # 645428
gzip -9 -c packages/novel-workbench/lib/client.js | wc -c  # 123596
shasum -a 256 packages/novel-workbench/lib/client.js
# 548d1124b14c71f41fd78d324ac2bd1eed499632e43250755726528350526021
```

| 时点 | raw | gzip | sha256 前缀 |
| --- | --- | --- | --- |
| 引入前（2026-09-17 基线） | 645,428 B | 123,596 B | `548d1124` |

**2 倍预算：raw 1,290,856 B / gzip 247,192 B。**

参考：上一轮已落地的图谱栈（`docs/open-source-evaluations/frontend-stack-2026-09-16.md`）把同一文件
从 33,334 B 推到 490,183 B；此后到 645,428 B 的涨幅来自左栏 / 头部 / 编辑器前身等界面工作。

---

## 3. GREEN：隔离体积实测

`react` / `react-dom` / `react/jsx-runtime` 一律 external。

> **⚠️ 这里犯过一个错，已修，记下来免得重犯：** 探针当时断言这与真实构建一致，
> **其实不一致** —— `tsdown.config.ts` 的 `platformModules` 只外部化 `react` 与 `react/jsx-runtime`，
> **没有 `react-dom`**。探针多外部化了一个 react-dom，于是把 `@tiptap/react` 触发的 react-dom 打包
> 整段漏算了。**孤立探针的外部化清单必须逐项对齐真实构建配置，不能凭印象写。**

### 3.1 安装与版本（探针内）

```bash
rm -rf /tmp/editor-stack-probe && mkdir -p /tmp/editor-stack-probe && cd /tmp/editor-stack-probe
npm init -y && npm install --no-audit --no-fund @tiptap/react @tiptap/starter-kit @tiptap/pm
# 57 packages
```

**精确版本（2026-09-17 registry 解析）：**

| 包 | 版本 |
| --- | --- |
| `@tiptap/react` / `@tiptap/starter-kit` / `@tiptap/pm` / `@tiptap/core` | `3.31.3` |
| `prosemirror-view` | `1.42.3` |
| `prosemirror-model` | `1.25.11` |
| `prosemirror-state` | `1.4.4` |
| `prosemirror-transform` | `1.12.1` |
| `prosemirror-commands` / `prosemirror-keymap` | `1.7.2` / `1.2.3` |
| `prosemirror-history` / `prosemirror-inputrules` | `1.5.0` / `1.5.1` |
| `prosemirror-schema-list` / `prosemirror-dropcursor` / `prosemirror-gapcursor` | `1.5.1` / `1.8.3` / `1.4.1` |
| `prosemirror-changeset` / `prosemirror-tables` | `2.4.2` / `1.8.5` |
| `linkifyjs` / `orderedmap` / `rope-sequence` / `w3c-keyname` | `4.3.3` / `2.1.1` / `1.3.4` / `2.2.8` |
| `fast-equals` / `use-sync-external-store` | `5.4.2` / `1.7.0` |

### 3.2 一个必须先纠正的规格错误

**`@tiptap/pm` 没有 `.` 导出。** `import * as pm from '@tiptap/pm'` 直接报错：

```
✘ [ERROR] Could not resolve "@tiptap/pm"
  The path "." is not exported by package "@tiptap/pm": node_modules/@tiptap/pm/package.json:42:13
```

它只导出子路径（`@tiptap/pm/state`、`/view`、`/model`、`/transform`…）。计划 I0.2 与决定 11 里写的
「`@tiptap/pm`」作为裸导入**不成立**，落地时必须按子路径引入。

### 3.3 四种组合的实测（各自单入口、单文件）

```bash
cd /tmp/tsdown-probe    # node_modules 复制自 editor-stack-probe
TSDOWN=/Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent/packages/novel-workbench/node_modules/.bin/tsdown
$TSDOWN <entry>.ts --format cjs --platform browser --target es2023 --out-dir <out> \
  --no-dts --no-sourcemap --no-clean \
  --deps.never-bundle react --deps.never-bundle react/jsx-runtime --logLevel error
```

> 坑：**`--out-dir` 一次只能放一个入口**。多入口会触发 tsdown 代码分割，生成共享 chunk
> （实测 `lean.cjs` 只有 245 KB，真正的代码在 `dist-*.cjs` chunk 里），单文件读数会严重偏小。
> DSH 的 ClientModuleSystem 每个插件只给一个 `client.js`，代码分割本来就不能用，所以按单入口测才对。

| 组合 | entry 导入 | raw | gzip |
| --- | --- | --- | --- |
| **trio**（计划原文） | `@tiptap/react` 的 Editor/EditorContent/useEditor + `@tiptap/starter-kit` + `@tiptap/pm/{state,view,model}` | **957,103 B** | **232,899 B** |
| **lean**（去掉 StarterKit） | `@tiptap/core` + extension-{document,paragraph,text,bold,italic} + `@tiptap/extensions/undo-redo` | 619,414 B | 150,338 B |
| **core-react**（只要 React 包装） | `@tiptap/react` 的 Editor/EditorContent/useEditor | 641,720 B† | 146,751 B† |
| **pm-only**（裸 ProseMirror，不含 Tiptap） | `@tiptap/pm/{state,view,model}` | 369,422 B | 92,415 B |

† `core-react` 是 esbuild 口径（tsdown 未单独跑）；其余三行为 tsdown 口径。

### 3.4 trio 的体积构成（esbuild metafile，minified 399,877 B）

| 占比 | 包 |
| --- | --- |
| 24.7% | `prosemirror-view` |
| 21.1% | `@tiptap/core` |
| 11.3% | `prosemirror-model` |
| 7.9% | `prosemirror-transform` |
| 5.3% | `@tiptap/extension-list` |
| 4.9% | `linkifyjs` |
| 3.0% | `prosemirror-state` |
| 2.3% | `@tiptap/react` |
| 其余 | 各 extension 与 `@tiptap/pm` 子模块，均 <3% |

**可压缩空间有限**：真正的大头是 `prosemirror-view` + `@tiptap/core` + `prosemirror-model/transform`
（合计 65%），任何 Tiptap 配置都甩不掉。去掉 StarterKit 能省的只有 `extension-list` 21 KB、
`linkifyjs` 19.6 KB、`extension-link` 9 KB 这类可选件（minified 合计约 50 KB）。

**注意：`@tiptap/extension-bubble-menu` / `-floating-menu` 不在 StarterKit v3 的传递依赖里**，
trio 的 bundle 里没有 `@floating-ui/*`。上表 57 个包里出现 `@floating-ui/*` 只是因为 npm 装了
StarterKit 声明的全部 extension 包，实际未被打进 bundle。

---

## 4. 许可证与生命周期脚本审阅

**57 个包全部 MIT，0 个 `preinstall` / `install` / `postinstall`。**
15 个包带 `prepare` 脚本，内容全是构建脚本（`pm-buildhelper src/index.ts`、`rollup -c`），
且 `prepare` **不随 registry tarball 安装执行**（只在 git 依赖或包自身本地开发时跑），故不构成安装期风险。

```bash
cd /tmp/editor-stack-probe
node -e '...'   # 遍历 node_modules，打印 name/version/license/生命周期脚本
```

**React 版本兼容性（已核对，不是问题）：** `@tiptap/react@3.31.3` 的 peer 为
`react: ^17.0.0 || ^18.0.0 || ^19.0.0`，本仓库冻结的 **React 18.3.1 在范围内**。
它还依赖 `use-sync-external-store@1.7.0`（React <18 的垫片），说明上游对 18 有明确支持路径。

**上游仓库：** `https://github.com/ueberdosis/tiptap`（`packages/react`、`packages/pm`、`packages/starter-kit`）。

---

## 5. 体积预算判定（触发 §5）

**预算：2 × 645,428 = 1,290,856 B raw；2 × 123,596 = 247,192 B gzip。**

| 组合 | 引入后 raw | raw 倍数 | 引入后 gzip | gzip 倍数 | 判定 |
| --- | --- | --- | --- | --- | --- |
| **trio（计划原文）** | 1,602,531 B | **2.48×** | 356,495 B | **2.88×** | **两项全破** |
| lean（无 StarterKit） | 1,264,842 B | 1.96× | 273,934 B | 2.22× | raw 勉强过，**gzip 破** |
| pm-only（裸 ProseMirror） | 1,014,850 B | 1.57× | 216,011 B | 1.75× | 两项都过 |
| trio（minify 口径，最宽松） | 1,045,305 B | 1.62× | 249,916 B | **2.02×** | raw 过，**gzip 仍破** |

**结论：按旧规则（当前 `client.js` 的 2 倍），给引入方最有利的算法也过不了 gzip 那一关。**
这触发了计划 §5 第 1 条，loop 停下并把数字交给用户。

### 裁定结果（2026-09-17）

用户选择**放宽预算、直接引入**。计划里的「2 倍当前」护栏已替换为**绝对上限 2,400,000 B raw**
（理由与数字来源写进 `tasks/editor-first-frontend-2026-09-17.md` 的「体积护栏」一节）。

引入后的**真实实测**：

| 时点 | raw | gzip | 说明 |
| --- | --- | --- | --- |
| 基线 | 645,428 B | 123,596 B | sha256 `548d1124…` |
| 首次真实构建（未修 `platformModules`） | 2,511,029 B | 523,098 B | **+1,865,601 B；react-dom + scheduler 被重复打包** |
| 修掉 `platformModules` 后 | **1,559,851 B** | **340,653 B** | **+914,423 B / +217,057 B → 2.42×，PASS** |
| 还原（移除临时 import 后重构建） | 645,428 B | 123,596 B | sha256 与基线**逐字节相同** |

> 还原后的 sha 与基线一致，说明补 `platformModules` **不影响当前产物**（当前代码没有任何模块 import
> react-dom），只影响将来 import react-dom 的构建。这同时也是一次「配置改动无副作用」的实证。

### 裁定时的选项（历史记录，按对计划改动量从小到大）

1. **放宽预算**：承认 2× 是自设护栏而非硬指标，把上限改成一个明确的数字写进计划。代价：单文件
   client.js 从 645 KB 涨到约 1.6 MB 未压缩，与「编辑器是主画布」的即时加载路径叠加。
2. **先给 workbench client 开 minify 再算**：当前产物**未 minify**（645 KB raw / 124 KB gzip），
   开 minify 会同时压低基线与增量，2× 判定结果**可能改变**。本条**未实测**，需要单独一轮量。
   注意上游 §3 已记录「DSH 每插件只有一个 client.js」，所以不能用分包绕。
3. **换 lean 配置**：不用 StarterKit，按需挑 extension。raw 过得勉强（1.96×），gzip 仍破。
   代价：计划决定 9「补全与续写」以及将来的工具栏需要的能力要自己一个个挑，`/` 菜单的富文本语义要重建。
4. **退回裸 ProseMirror**（`@tiptap/pm/*`）：两项预算都过（1.57× / 1.75×），但这是**改动计划决定 11**，
   灰字补全（I4.1）与 decoration 要自己写，省掉的是 Tiptap 的 schema/extension 层。
5. **缩短编辑器能力的首版范围**：只上 reading/writing 两态 + 灰字所需的 decoration，
   把 StarterKit 里用不到的（list / link / blockquote / code-block / horizontal-rule）全部拿掉，
   逼近 lean 或更低。与选项 3 同路，只是动机从「省体积」变成「首版就不需要」。

**引入后已完成 / 仍未做（不得当成已验证）：**
- ✅ 已写进真实仓库 `packages/novel-workbench/package.json`（精确 `3.31.3`）并 `pnpm install`；
  `pnpm-lock.yaml` 新增 51 个包、移除 0 个、未改动任何既有 resolution；`react`/`react-dom` 保持
  `18.3.1`，**没有出现第二个 React 版本**。
- ✅ `THIRD_PARTY_NOTICES.md` 与 `docs/upstream-sources.md` 已更新（依赖已实际引入，不再是空头记录）。
- ✅ 端到端体积用**真实构建**实测（见上表），不再是探针投影。
- ✅ 顺带修掉一个会导致体积翻倍的既有配置缺陷：`tsdown.config.ts` 的 `platformModules` 补上
  `react-dom` 与 `react-dom/client`。证据：官方 `dsh-client-ui-renderer` 的 client bundle 里
  `require("react-dom")` 与 `require("react-dom/client")` 都是**裸 require**，即由宿主模块表提供。
- ❌ **没有**在任何真实浏览器里加载过 Tiptap 编辑器。本记录只回答**体积、许可证与打包**，
  不回答运行时可用性 —— 那属于 I3.2 的验证范围。
- ⚠️ 计划 §4.7 的 `scripts/dev-host.sh rebuild` + `scripts/smoke-workbench.mjs` 覆盖的是**现有**界面
  （编辑器尚不存在），它验证的是这次配置改动没有弄坏已有 client bundle，不是编辑器的可用性。

---

## 6. 复现命令汇总

```bash
# 基线
cd /Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent
wc -c < packages/novel-workbench/lib/client.js
gzip -9 -c packages/novel-workbench/lib/client.js | wc -c

# 探针
rm -rf /tmp/editor-stack-probe && mkdir -p /tmp/editor-stack-probe && cd /tmp/editor-stack-probe
npm init -y && npm install --no-audit --no-fund @tiptap/react @tiptap/starter-kit @tiptap/pm

# 许可证与生命周期脚本
node -e 'for (const p of ["@tiptap/react","@tiptap/pm","@tiptap/starter-kit"]) { const j=require(`./node_modules/${p}/package.json`); console.log(p, j.version, j.license, JSON.stringify(j.scripts||{})); }'

# tsdown 单入口测量（每个组合一个 --out-dir，否则会代码分割）
TSDOWN=/Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent/packages/novel-workbench/node_modules/.bin/tsdown
$TSDOWN entry.ts --format cjs --platform browser --target es2023 --out-dir lib-trio \
  --no-dts --no-sourcemap --no-clean \
  --deps.never-bundle react --deps.never-bundle react/jsx-runtime --logLevel error
wc -c < lib-trio/entry.cjs && gzip -9 -c lib-trio/entry.cjs | wc -c

# 真实端到端测量（引入后做，权威口径）
cd /Users/wzy/Work/01_Projects/My-Projects/Original/Novel-agent
cp packages/novel-workbench/lib/client.js /tmp/client.js.orig        # 先备份产物
# 在 packages/novel-workbench/src/client/index.tsx 末尾临时加：
#   export { Editor, EditorContent, useEditor } from '@tiptap/react'
#   export { default as StarterKit } from '@tiptap/starter-kit'
#   export { EditorState } from '@tiptap/pm/state'
#   export { EditorView } from '@tiptap/pm/view'
#   export { Schema } from '@tiptap/pm/model'
corepack pnpm --filter @novel-agent/novel-workbench build
wc -c < packages/novel-workbench/lib/client.js                       # 1,559,851
gzip -9 -c packages/novel-workbench/lib/client.js | wc -c            # 340,653
# 还原并确认逐字节回到基线
git checkout -- packages/novel-workbench/src/client/index.tsx
corepack pnpm --filter @novel-agent/novel-workbench build
shasum -a 256 packages/novel-workbench/lib/client.js                 # 548d1124…（与基线一致）

# 确认 react-dom 由宿主模块表提供（而不是我们打进去）
grep -rl 'require("react-dom")' node_modules/.pnpm --include=client.js
# 输出含 @deepseek-ai/dsh-client-ui-renderer / -conversation / -chat 的 client.js
```
