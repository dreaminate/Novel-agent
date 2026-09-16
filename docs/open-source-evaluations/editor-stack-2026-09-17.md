# 编辑器栈选型记录 — Tiptap / ProseMirror（2026-09-17）

**触发：** `tasks/editor-first-frontend-2026-09-17.md` 决定 11「编辑器用 Tiptap / ProseMirror（MIT）富文本」，
增量 I0.2 要求「引进前先做体积实测，否则不许引依赖」。

**地位：** **选型证据 + 一份被阻断的引入。** 依赖**没有**装进本仓库，`package.json` / `pnpm-lock.yaml`
**未被修改**。按计划 §5，本记录的结论触发「体积预算被突破 → 停下问人」，等待用户裁定后再决定是否引入。

**测量环境：** macOS (darwin 25.6.0)，node `v24.14.1`，npm `11.16.0`，
隔离探针 `/tmp/editor-stack-probe` 与 `/tmp/tsdown-probe`（均在仓库外，不污染仓库）。
仓库 bundler：tsdown `0.22.2`（`packages/novel-workbench`）；对照 bundler：esbuild `0.25.12`（仓库根 devDependency）。

---

## 1. 结论（先给判定）

按计划原文的组合引入（`@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/pm`），
**workbench client bundle 会涨到当前 `lib/client.js` 的 2.48 倍（raw）/ 2.88 倍（gzip）**，
突破计划 §5 写死的 2 倍预算。**判定：破。已按 §5 停下。**

三条独立测量互相印证，不是单一 bundler 的偏差：

| 测量方式 | 增量 raw | 引入后 raw | 倍数 |
| --- | --- | --- | --- |
| tsdown 0.22.2（**与真实构建同配置**：cjs / browser / es2023 / react external / 不 minify） | 957,103 B | 1,602,531 B | **2.48×** |
| esbuild 0.25.12（esm / 不 minify） | 848,633 B | 1,494,061 B | 2.31× |
| esbuild 0.25.12（esm / minify） | 399,877 B | 1,045,305 B | 1.62× |

即使按对引入方最有利的 minify 口径，gzip 仍然破线（见 §5）。**换更小的配置也不够**：
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

`react` / `react-dom` / `react/jsx-runtime` 一律 external —— 依据
`packages/novel-workbench/tsdown.config.ts` 的 `platformModules`（DSH 的 `PLATFORM_MODULES` 冻结 React，
由宿主提供），与真实构建一致。

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

**结论：给引入方最有利的算法也过不了 gzip 那一关。** 按计划 §5 第 1 条
「引入编辑器栈后 client bundle 超过当前 2 倍（体积预算被突破）」——**停下，把数字交用户决定。**

### 供决策的选项（按对计划改动量从小到大）

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

**本轮没有做的事（不得当成已验证）：**
- **没有**在真实仓库 `pnpm add`，**没有**产生 `pnpm-lock.yaml` diff，**没有**改 `package.json`；
  因此 `THIRD_PARTY_NOTICES.md` 与 `docs/upstream-sources.md` **未更新** —— 依赖尚未引入，此时写入会误导。
- **没有**跑 `packages/novel-workbench` 的真实 `tsdown` 构建做端到端体积确认（选项 2 需要）。
- **没有**在任何真实浏览器里加载 Tiptap 编辑器；本记录只回答**体积与许可证**，不回答运行时可用性。
- 隔离 Profile 的加载 smoke（`frontend-stack-2026-09-16.md` 要求的那条）**未做**。

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
```
