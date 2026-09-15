# 规则文档对齐与 `registerExtension` 结论消歧 — 2026-09-15

**性质：** 文档/规格对齐。**没有改动任何产品源码、依赖、lockfile、测试或上游。**
**授权：** 用户 2026-09-15 明确指示执行 `tasks/m2-work-surface-2026-09-15.md` §4 方案 A 的四处定点修订，以及 §3.2 第 5 条（`registerExtension` 结论消歧）。

背景：`AGENTS.md:21` 原本规定「不修改规格原文……除非用户明确要求维护规格；发现漂移只报告」。漂移由上述工作面文档报告，用户审阅后授权本次维护。

---

## 1. 方案 A：`AGENTS.md` 四处定点修订

### A1 — 第 26 行：DSH 版本基线

| | |
| --- | --- |
| 原文 | 「所有投入产品路径并由 novel-agent 解析的 DSH npm 包必须精确为 `0.1.1-rc.2`。若某个需要的包不能在实际 rc.2 Profile 中解析和运行，停止该依赖变更并记录证据；不得混用已解析的 DSH 版本或依赖 dist-tag。」 |
| 现文 | 「……必须精确为 `0.1.2-rc.1`（用户 2026-09-08 明确选定，取代原 rc.2 限制；见 [采用记录](open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md)）。不得混用已解析的 DSH 版本或依赖 dist-tag。若某依赖需要更换版本或引入 alpha，先取得用户明确授权并记录证据，不在本规则内自行升级。」 |
| 依据 | 实测五个包全部 `0.1.2-rc.1`；[采用记录](open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md) 第 5 行：「原 rc.2 / Desktop 2.0.2 的版本限制被用户的新选择取代」 |

### A2 — 第 27 行（新增）：补上缺失的强制补丁条款

新增：

> - 实际运行 DSH 的 Host 与所选 Profile 必须应用本仓库维护的 `@deepseek-ai/dsh-session@0.1.2-rc.1` 补丁（见 [`patches/README.md`](../patches/README.md)）。该补丁只给公开 `Session.append` 增加仅用于 log-only 事件的可选 `{ ignorable: true }`，本项目只有 `novel/canon/accepted` 与 `novel/canon/rolled-back` 使用它。这是用户已授权的例外；除它之外，仍不得为 DSH 正常生命周期行为写 novel-agent 补丁。

这是本次最重要的一处。`AGENTS.md` 此前**从未提及**该项目强制依赖的补丁，而第 40 行按字面读禁止为 DSH 生命周期行为写补丁。照原文执行安装会漏打补丁，Canon 冷恢复必然失败。

### A3 — 第 38 行：社区 Desktop 版本

| | |
| --- | --- |
| 原文 | 「产品 Desktop 宿主**固定复用** `anywhere-labs/deepseek-harness-desktop` GitHub Release `v2.0.2`（tag commit `9d18856d…`，MIT）。」 |
| 现文 | 「产品 Desktop 宿主复用 `anywhere-labs/deepseek-harness-desktop`。**最后完成验证的组合是** Release `v2.0.2`（tag commit `9d18856d…`，MIT）；**当前目标版本为 `v2.0.5`，尚未安装或验收**，在完成隔离 smoke 之前不得写成已验证。……」 |
| 依据 | `README.md:105-106`：Desktop `2.0.5` 配套 rc.1「但尚未在本轮安装或验收；旧 `2.0.2` 组合只保留历史证据」 |

原文「固定复用」抹掉了「2.0.2 = 最后已验证 / 2.0.5 = 待验收目标」这个区别。

### A4 — 第 48、80 行：验收规则里的过期版本字样

- 第 48 行：「兼容性声明必须来自全新隔离 rc.2 Profile 的真实 install/load/UI 或 TUI smoke」→「……来自全新隔离的当前目标版本 Profile（且已应用上文 DSH Session 补丁）的真实 install/load/UI 或 TUI smoke」。
- 第 80 行：「隔离 rc.2 Profile smoke」→「隔离的当前目标版本 Profile smoke」。

### A 的附带一处（超出原列四项，主动披露）

- 第 12 行：「不为其重写补丁或替代实现」→ 句尾增加「（唯一例外是「DSH 唯一内核」列明的 Session 恢复补丁）」。

原因：第 12 行是与第 40 行同源的补丁禁令，A2 已建立例外，但第 12 行字面仍是无限定的禁止。不加这一处，读者在第 12 行就会得出错误结论。这是一句括号，不改任何实质约束。

### 未改动的相邻条款（有意保留）

- 第 41 行「不为社区宿主或 DSH 的正常窗口、终端、Profile、transport、设置、插件市场和生命周期行为写 novel-agent 补丁或重复实现」：A2 的「除它之外，仍不得……」已把它限定为「除 Session 恢复补丁外仍成立」，保留原文语义。

---

## 1b. 治理文档的版本残留补齐（用户 2026-09-15 追加授权）

用户随后要求把 `tasks/plan-final.md` 的版本残留一并处理。由于该文件是 `AGENTS.md` 指定的当前实施路线，其版本陈述与 `AGENTS.md` 直接冲突，本次一并处理 `plan-final.md` 与 `tasks/history-migration-todo.md` 两份治理/追踪文档。

| 文件 | 位置 | 处理 |
| --- | --- | --- |
| `tasks/plan-final.md` | `:20` | `DSH 0.1.1-rc.2` → `0.1.2-rc.1`（加 Session 恢复补丁，链到 `AGENTS.md`）；社区 Desktop → 「目标版本 `v2.0.5`（`v2.0.2` 为最后完成验证的组合）」 |
| `tasks/plan-final.md` | `:192` | 硬验收指标「fresh isolated rc.2 Profile」→「当前目标版本 Profile（已应用 Session 恢复补丁）」 |
| `tasks/plan-final.md` | `:230` | H-006「核对 DSH rc.2 精确版本」→「核对 DSH 精确版本（当前 `0.1.2-rc.1`）」 |
| `tasks/plan-final.md` | `:270` | D-006「fresh isolated rc.2 Web Profile」→「当前目标版本 Web Profile（已应用 Session 恢复补丁）」 |
| `tasks/history-migration-todo.md` | `:94` | 删除闸门第 5 条「fresh isolated rc.2 Profile smoke」→「当前目标版本 Profile（已应用 Session 恢复补丁）」 |
| `tasks/history-migration-todo.md` | `:97` | 保留清单「DSH rc.2 seams」→「DSH 原生 seams（当前目标版本 `0.1.2-rc.1`）」 |

**有意保留为历史记录的行：**

- `tasks/history-migration-todo.md:25`（2026-09-07 工作记录：「只补齐既有测试缺失的 rc.2 开发依赖」）与 `:105`（旧审计关于 rc.2 源码归档与迁出机的机器差异记录）——都是带日期的既成事实。
- `tasks/plan-final.md:20` 中刻意保留的一个 `v2.0.2`，用于说明「最后完成验证的组合」，不是当前主张。

---

## 2. 第 5 条：`registerExtension` 结论消歧

原问题：`registerExtension` 的「不可用、退回 generic Delta」结论写在四处，而 M1 已证明可行，四处未同步——照旧结论行事会去实现一个不需要的重复方案。

**准确结论分两层**（本次据此统一表述）：

1. DSH 自身确实不提供动态 endpoint 注册（Typert protocol 只有静态 `@Remote`/`RemoteScope` 与 generated registry contribution）——原判断这层是对的。
2. 但「Canon 扩展」由本项目自己的 seam 承担：`NovelProjectService.registerExtension` / `registerProjector` 经 Cordis `ctx.inject(['novelProject'])` 回调注册，wire 形状为 `kind: 'extension'` + `namespace` + `valueSchema`。原判断这层已被 M1 取代。

| # | 文件 | 处理方式 |
| --- | --- | --- |
| 1 | `tasks/history-migration-todo.md`「不可用/阻塞事项」 | **改写**（该节陈述当前阻塞，不是历史记录）：标为「已解除阻塞」，写明两层结论、证据与代码位置，并明示退路不再适用 |
| 2 | `tasks/history-migration-todo.md` M1 第 12 行（`[x]` 项） | **加更正注**：保留当时记录，标明已被 M1 取代并指向同名条目的更正 |
| 3 | `tasks/history-migration-audit.md`（seam 表 + generic Delta 小节） | **加「2026-09-15 更正」小节**，保留 2026-09-05 原文作为历史记录，明确「不要再据此实现通用的 namespace-keyed Delta」 |
| 4 | `tasks/plan-final.md`（Typed Service 段） | **改写条件句**为已收口 |
| 5 | `tasks/plan-final.md` H-003 | **改写条件句**为已收口（同一条件的第二处） |
| 6 | `docs/goal-prompts-final.md` | **加「使用前必读」banner**，保留两段提示词正文原文，标明其中版本号与 `registerExtension` 条件已被取代 |

代码位置引用：`packages/novel-project/src/index.ts:1105`（`registerExtension`）、`1111`（`registerProjector`）、`packages/novel-project/src/types.ts:292`（`ExtensionCanonDelta`）。证据：[M1 检查点](canon-extension-m1-2026-09-08.md)。

**未采用的处置：** 没有直接改写 `history-migration-audit.md` 与 `goal-prompts-final.md` 的正文。前者是带日期的审计记录、后者是已消费的提示词模板，重写会破坏历史可对照性；按仓库既有惯例（parity matrix 对旧失败行的处理方式）改为「保留原文 + 加日期化更正」。

---

## 3. 改动文件清单

| 文件 | 改动 |
| --- | --- |
| `AGENTS.md` | 5 处（A1、A2 新增、A3、A4×2、附带第 12 行） |
| `tasks/plan-final.md` | 4 处（§1b 版本残留）＋ 2 处（§2 `registerExtension` 条件句收口） |
| `tasks/history-migration-todo.md` | 2 处（§1b 版本残留）＋ 2 处（§2 结论消歧） |
| `tasks/history-migration-audit.md` | 1 处新增更正小节 |
| `docs/goal-prompts-final.md` | 1 处新增 banner |
| `tasks/m2-work-surface-2026-09-15.md` | 状态行更新（见 §5） |
| `docs/agent-rules-alignment-2026-09-15.md` | 本文件（新增） |

合计改动 6 个既有文档 + 1 个新增记录，共 17 处编辑。

---

## 4. 校验

| 检查 | 结果 |
| --- | --- |
| `AGENTS.md` 残留 `rc.2` / `v2.0.2` / `0.1.1` 作为当前规则的引用 | 0（仅第 26、38 行各保留一处作为「被取代的原限制」的说明性引用） |
| `tasks/plan-final.md` 残留 `rc.2` | 0。`:20` 保留的一处 `v2.0.2` 是刻意的「最后完成验证的组合」说明，非当前主张 |
| `tasks/history-migration-todo.md` 残留 `rc.2` | 仅 `:25`、`:105` 两处**带日期的既成事实记录**（2026-09-07 工作记录、旧审计的机器差异说明），有意保留 |
| 新增内部链接目标存在性 | 4 / 4 全部存在（`docs/open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md`、`patches/README.md`、`docs/canon-extension-m1-2026-09-08.md`、`AGENTS.md`） |
| 6 个改动文件行尾空白 | 无新增。`plan-final.md:160`、`goal-prompts-final.md:57,126` 共 3 处为**改动前既有**（Markdown 硬换行与代码围栏后缀），本次未触及这些行 |
| 产品代码 / 依赖 / lockfile / 测试 | **未改动** |
| 未运行 | `pnpm typecheck` / `lint` / `build` / 测试；本次为纯文档改动，但**没有跑任何门禁** |

---

## 5. 残留的四项：已于第二轮处理（见 §6）

本节原先把四项列为「方案 C，待授权」。用户随后要求一并修正，并明确要求**先验证再修改**。验证结果**推翻了我的部分分类**，实际处置见 §6。

| 文件 | 我在本节原先的判断 | 验证后的结论 |
| --- | --- | --- |
| `THIRD_PARTY_NOTICES.md` `:82` / `:122` | 「真正的错误，第三方清单以现状口吻写 rc.2」 | **判断有误，已更正。** 该文件 `:76-77` 与 `:117-118` **已经**加了历史框定，`:103` 更已正确写明「All current direct DSH packages are exact `0.1.2-rc.1`, with Cordis `4.0.2`」——与实测一致。真实缺陷只是**措辞**：两处仍在历史小节内用现在时陈述。 |
| `docs/claude-desktop-parity-matrix.md` `:6` | 「半对，描述的是证据基线」 | **判断正确。** 修法按「标明基线 + 指出当前目标」而非替换版本号。 |
| `docs/architecture.md` `:34` | 「真正的错误」 | **判断正确，且范围更大。** 除版本外，Decision 3/4 与 `:10` 的「defines the current product boundary」也是现在时陈述，与五包现实冲突。按仓库惯例以**顶部取代声明**处理，不重写带日期的决策原文。 |
| `docs/security-threat-model.md` `:6` | 「真正的错误」 | **判断正确，且范围更大。** 除版本外，`:7`/`:20`/`:30`/`:75` 还写着「single `novel-project` plugin」，与五包现实冲突。该文件无日期、自称 current scope，属活文档，**就地修正**。 |

**不建议改的（保持现状是正确的）：** `tasks/todo.md`、`docs/architecture.md:751,772,1107…`、`docs/claude-desktop-parity-matrix.md` 中大量 `rc.2` 是**带日期的运行证据**（「当时跑在 rc.2 上」本身正确）；`tasks/history-migration-audit.md:86,90,97,123,125` 同理属于 2026-09-05 审计记录。

**关于 Cordis 版本（更正本文件早先的说法）：** 本文件曾写「`docs/architecture.md` 与 `tasks/history-migration-audit.md:91` 记 Cordis `4.0.1`」。复核后：`architecture.md` **并未**出现 `4.0.1`；`tasks/history-migration-audit.md:91` 的 `4.0.1` 是 2026-09-05 审计当时的实测值（lockfile 当时确为 4.0.1，[采用记录](open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md):42 也记录了迁移时「最终 root lock 不含 … Cordis 4.0.1」）。**该行属带日期的正确记录，不是错误，不应修改。**

**未验证项：**

- 本次改的是规则文本，**没有运行任何测试或门禁**，也没有做隔离 Profile smoke。规则修订不改变产品行为，因此不需要 RED/GREEN；但「这些文档现在与产品实际状态一致」这一判断只经过文本核对，未经过运行验证。
- 改动后的新表述未经过第三方复核。
- 本次未系统排查社区插件版本号与 `README.md:88-97` 表格的一致性。
- 仓库无 Git commit 基线，**本次全部改动无法用 `git diff` 呈现**；如需回退须按本记录的逐条 before/after 反向编辑。

---

## 6. 第二轮：验证优先的错误排查与修正（用户 2026-09-15 追加授权）

用户要求「四项都去修正，还有其他的错误，先去验证真的是错误再去修正」。本轮**先建立可核验的事实底座，再逐条判定**；验证推翻了 §5 的两处分类（见上）。

### 6.1 事实底座（实测，不引用文档）

| 事实 | 验证方法与结果 |
| --- | --- |
| DSH 版本 | `pnpm-lock.yaml` 中 `dsh-[a-z0-9-]+@0.1.1-rc.2` **零命中**；`0.1.2-rc.1` 为唯一版本 |
| Cordis 版本 | lockfile 中 `cordis@4.0.2`（951 处上下文命中），非 `4.0.1` |
| 测试门禁 | `pnpm test` 实测 **5 文件 / 268 通过**（客户端 41、Remote 集成 136） |
| `pnpm pack --out` | `pnpm pack --help` 实测支持 `--out <path>` — **README 打包命令不是错误** |
| `SHA256SUMS.txt` | 逐条校验：`apps/` 以外的 144 条中 **44 条与当前树不一致**；`.gitignore`、根规格 md 等仍 MATCH |
| `allowBuilds` 语义 | pnpm 11.7.0 `dist/pnpm.mjs` 中 `createAllowBuildFunction` 对值做 `switch (value) { case true: …; case false: … }`，**无 `default` 分支** |

### 6.2 修正清单

| # | 文件 | 修正 | 依据 |
| --- | --- | --- | --- |
| 1 | `pnpm-workspace.yaml` | `allowBuilds` 中 3 个值为字符串 `set this to true or false` 的条目改为显式布尔：`@google/genai: false`、`koffi: false`、`protobufjs: false`，并加注释说明 | 见 §6.1：字符串值两个 `case` 都不匹配 → 条目被**静默丢弃**。`@google/genai` 与 `protobufjs` 在 lockfile 中零命中；`koffi` 在图中且文档记载安装使用 `--ignore-scripts`、未执行其 install 脚本。**取 `false` 保持当前有效行为不变** |
| 2 | `docs/security-threat-model.md` | `:6` Scope 改为当前基线 + 补丁 + **五个**领域插件；`:20`/`:30` 架构图同步；`:75`「single-plugin composition」→「five-plugin composition」 | 该文件无日期、自称 current scope，属活文档。实测五包 + rc.1 |
| 3 | `docs/architecture.md` | 顶部新增「Superseded in part — 2026-09-15」取代声明：DSH 版本、**插件数量**（Decision 3/4 描述的单包 vs 实际五包）、Desktop 版本三项，并指向当前权威文件 | 该文件 `Date: 2026-08-27` 且 `AGENTS.md:5` 已声明其单插件描述仅用于理解迁移前实现。按仓库惯例**保留带日期的决策原文 + 加取代声明**，不重写历史 |
| 4 | `docs/claude-desktop-parity-matrix.md` | `:6` 表头改为「evidence baseline 为 2.0.2/rc.2；current baseline 为 rc.1 + 补丁；2.0.5 为未验收目标」，并声明未重跑的行使基线范围内的证据 | 该句描述的是矩阵**证据基线**，删除会丢信息 |
| 5 | `THIRD_PARTY_NOTICES.md` | `:82` 表格行加「of that earlier pairing」限定并指向当前基线；`:122` 的 `at exact 0.1.1-rc.2` 补「at the time of that proof；current lockfile 为 0.1.2-rc.1」 | 两处仍在历史小节内用现在时陈述，与紧邻的历史框定自相矛盾 |
| 6 | `README.md` | `:1195`「当前…`266/266`」→ `268/268`（2026-09-15 实测），并注明 `266/266` 是 I/O 迁移当时的记录、typecheck/lint/build **本次未重跑** | 唯一一处明确自称「当前」且可直接实测的计数 |
| 7 | `.gitignore` | 在既有「Local runtime state must never enter source control」段加入 `.opencode/` 与 `.workbuddy/` | 同段已有的 `.novel-agent/` 是同类本地状态；两者此前未被忽略，`git status` 出现噪声 |

### 6.3 验证后判定为「不是错误」——未修改

| 对象 | 为何不是错误 |
| --- | --- |
| `SHA256SUMS.txt` 与其 44 处不一致 | 它是 2026-09-07 **迁移归档负载**的校验清单，`MIGRATION_MANIFEST.md:15,27-28` 明确说明其用途是校验 ZIP payload，并有意包含 `apps/desktop/out` 等构建产物。八天开发后 44 条不等属预期。**建议（未执行）**：在文件首行加一行用途说明，避免被误当作当前完整性基线 |
| `README.md:163-173` 的 `pnpm pack --out` | `pnpm pack --help` 实测支持 |
| `apps/desktop/out`（358 MB，含 `.exe`/`app.asar`/Chromium 运行时） | 是已退役自建 Electron 路线的构建残留；`.gitignore` 的 `out/`、`.vite/` 覆盖它，`tasks/todo.md` A-001 已把它分类为「ignored build residue is not a product package」，`MIGRATION_MANIFEST.md` 又明确将其纳入迁移归档。**已分类、非未记录错误**；但属卫生问题，见 §6.4 |
| `README.md:536`、`docs/architecture.md:676`、`parity matrix:544` 的「当前/Current … `239/239`」 | 数字本身对各自里程碑是**正确**的（239 是 2026-09-02 前后、266 是 2026-09-09 的记录）。把数字改成 268 会**伪造历史**；仅「当前/Current」这个措辞偏松。**判定为措辞问题而非事实错误，未修改** |
| `docs/*-migration-2026-09-09.md`、`tasks/todo.md` M2 段落、`docs/architecture.md` 证据段、parity matrix 证据行的 `rc.2` / 各档计数 | 全部是**带日期的运行证据**，「当时跑在 rc.2 上、当时 239 通过」本身正确 |
| `tasks/history-migration-audit.md:91` 的 Cordis `4.0.1` | 2026-09-05 审计当时的实测值；本文件早先把它误报为漂移，已更正 |
| `tasks/history-migration-todo.md:25,105` 的 `rc.2` | 带日期的既成事实记录 |

### 6.4 已验证但未修改的建议项

1. **`apps/desktop/out` 358 MB 残留。** 已分类为 ignored build residue，但它使仓库工作树体积异常，且任何 ZIP/快照备份都会连带 358 MB。删除需用户授权（破坏性操作），**本次未动**。
2. **`SHA256SUMS.txt` 加用途首行。** 见 §6.3。
3. **「当前 N/N」措辞统一。** 建议把里程碑计数句里的 `Current/当前` 改为 `该里程碑` 之类的限定，避免与总门禁混淆。涉及 3 处，**本次未改**。

### 6.5 未验证项与一个未解决的环境问题

**测试基线的实际验证方式（重要，改变了本轮的表述口径）：**

| 命令 | 结果 |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run`（绕过 pnpm 直接跑） | **5 文件 / 268 通过 / 24.62 秒 / exit 0** |
| `corepack pnpm test`（README 记录的标准命令） | **超时挂起，两次复现（11 分 49 秒后人工终止；另一次 220 秒 SIGTERM）** |

`corepack pnpm test` 挂起的位置与原因，日志证据在 `.novel-agent/tmp/test-run.log`：

```text
Scope: all 6 workspace projects
? Verifying lockfile against supply-chain policies (439 entries)...
Lockfile is up to date, resolution step is skipped
[WARN] GET https://registry.npmjs.org/@asamuzakjp%2Fcss-color error (23). Will retry in 10 seconds. 2 retries left.
...（439 个条目，同样失败）
```

即 pnpm 在执行脚本前对 439 个锁定条目做供应链策略校验，全部 GET 失败并进入 10s×2 + 1min×1 重试。

**已排除与未排除：**

- 已排除「断网」：同环境下从 Bash 直接请求 `https://registry.npmjs.org/cordis` 返回 **HTTP 200 / 402ms**。
- 已排除「我改坏了代码」：绕过 pnpm 直接跑 vitest 全绿。
- **未能排除**「`pnpm-workspace.yaml` 的 `allowBuilds` 修改使 pnpm 的缓存校验结果失效」。时间线支持这个怀疑：今天 09:01 首次 `pnpm test` 正常（58 秒完成，未做这轮 439 次查询），而 `AppData/Local/pnpm-cache/v11` 目录的时间戳是 **09:43**，早于我 09:45 前后的配置修改与 09:47 的挂起运行。
- 两种绕过尝试**均无效**：`npm_config_verify_deps_before_run=false` 与 `npm_config_minimum_release_age=0` 都仍然挂起。

**结论：我无法判定这次挂起是否由本次改动引起。** 未做决定性实验（把 `allowBuilds` 临时还原后重跑）以避免再次扰动配置。**建议用户在联网环境下重跑 `corepack pnpm test` 确认**；若仍挂起，再按上述时间线回溯。

**其余未验证项：**

- **未运行 `corepack pnpm install`**：无法确认 `allowBuilds` 修正后的安装行为与修正前完全一致。判断依据是 pnpm 11.7.0 源码静态推理（字符串值被丢弃 ⇒ 等价于无规则；`false` 为显式拒绝；两者对图中的 `koffi` 都是「不构建」），**不是安装实测**。
- **未跑 typecheck / lint / build**。
- **未做隔离 Profile smoke**。本轮改的是文档与本地配置，不改变产品行为，但结论仅经文本与静态核对。
- 未系统排查 `README.md:88-97` 社区插件版本号在上游是否真实发布（需联网逐一核对）。**已做**的本地检查是：六个插件版本号在全部文档中**完全一致**（`dsh-better-sidebar@0.16.1`、`@anweat/dsh-browser@0.1.9`、`dsh-web-search-pro@0.1.11`、`dsh-file-upload@0.4.3`、`@xmoon76/dsh-pi-tui@0.3.4`、`dsh-git-worktree@0.6.0` 各自零冲突），无跨文档矛盾。
- 未排查 `docs/upstream-sources.md`（959 行）与 `docs/plugin-design-v3.md` 的逐条内容一致性。
- 仓库无 Git 基线，本轮 7 个文件的改动同样无法用 `git diff` 呈现。
