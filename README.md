# novel-agent

当前正式开发按 [最终计划](tasks/plan-final.md) 推进。Canon 扩展和锁已有验证，
下文各段测试数字是**各自迁移当日的记录**（244/245/255/256/259/262/264/266），不是当前总数；
当前门禁以本机 `corepack pnpm test` 实测为准，最近一次结果记在 [任务清单](tasks/todo.md)。
[接受/回滚通知的恢复补丁](docs/canon-session-recovery-2026-09-09.md)已通过 245 个测试和
完整官方宿主 API 的两次冷重启验证；恢复后可继续回滚、接受新提案。新的 GUI 复验尚未完成。
用户已明确选择 `0.1.2-rc.1`；[版本迁移](docs/open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md)
已完成依赖与接口适配，244 个测试和包检查通过，隔离 Web Profile 验证了 R1、R2、回滚 R3 和页面刷新。
当前基线为官方 `0.1.2-rc.1` 加本项目维护的最小 Session 补丁；实际 Host 和 Profile 均须应用
[同一补丁](patches/README.md)。原样官方包的旧失败证据保留，旧未标记日志未迁移。
八个既有角色已全部移出 Core，分别由 Planning、Writing、Memory、Review 注册。
阶段提示也已由对应插件发布，255 个测试及真实 Agent 提示组装、原生热卸载/恢复、冷重启通过，
见 [提示归属证据](docs/domain-prompt-migration-2026-09-09.md)。五插件的八角色、正文/召回历史读取、
回滚和冷恢复见 [角色迁移证据](docs/domain-role-migration-2026-09-09.md)。Planning 的叙事算法与校验
已有 [归属证据](docs/planning-projection-migration-2026-09-09.md)。Review 审稿执行、引用校验和 diff
也已移出 Core；256 个测试及真实子代理、冷恢复、逐项接受通过，见 [审稿迁移](docs/review-engine-migration-2026-09-09.md)。
实际 Host 验证发现并修正了 Profile 重复安装 Tools 的问题。Memory 的双向关系、章节控制包与延续状态
现已迁出 Core，259 测试及新 Host 的历史读取、来源关联和两次冷恢复通过，见 [Memory 迁移](docs/memory-projection-migration-2026-09-09.md)。
图、因果比较和知识边界也已归属 Memory；262 测试及候选预览/历史/冷恢复通过，见 [图与知识迁移](docs/memory-graph-migration-2026-09-09.md)。
剩余检索、中文搜索/排名、账本/生命周期和索引 Jobs 已移入 Memory，264 测试与真实 Host Job/冷恢复通过，见 [检索与 Jobs 迁移](docs/memory-retrieval-migration-2026-09-09.md)。
既有导入提案、发布和编码现由 Writing 负责；266 测试及新 Host 的审批、四格式输出、冷恢复通过，见 [I/O 迁移](docs/writing-io-migration-2026-09-09.md)。其余领域拆包和前 12 章
验收尚未完成，Canon 扩展基线见 [M1 检查点](docs/canon-extension-m1-2026-09-08.md)。

`novel-agent` 是面向中文长篇网文创作的 DeepSeek Harness（DSH）领域插件项目。
它不提供 Electron 壳、通用 Workbench、完整 TUI、终端、浏览器、搜索、上传器、
Profile 包装层或插件安装器；这些能力直接使用 DSH、社区
[DSH Desktop](docs/open-source-evaluations/deepseek-harness-desktop.md)
和社区插件。

当前产品依赖的 DSH `0.1.2-rc.1` 是唯一的 Agent、Session、Workspace、事件、审批、存储、设置、
凭据和插件内核。novel-agent 的领域责任范围限定为小说 Canon、Result Packet、
审校、检索、工作流、模拟、导入导出，以及承载这些领域行为所必需的小说项目面板；
各项能力的实际完成度以 [任务清单](tasks/todo.md) 为准。

## novel-agent 自己维护什么

| 插件 | 责任 | 明确不负责 |
| --- | --- | --- |
| `@novel-agent/novel-project` | 唯一 Novel Project Canon、Result Packet、逐项接受/拒绝、原子 revision/rollback、领域投影和必要的 `conversation.view` 小说面板 | 通用 Agent/Session、第二套存储、Better Sidebar tab、TUI footer、Profile 或桌面壳 |
| `@novel-agent/novel-planning` | 三个规划 Skills、叙事投影/层级校验、`novelPlanning.readPlan` 原生服务，以及全部规划 Delta kind 的值契约（`registerDeltaKind`）；规划 Tools 和面板仍待迁移 | Canon 写入权、第二套 Agent/Session、独立页面或 Sidebar |
| `@novel-agent/novel-writing` | 正文写手 Skill、已接受正文只读服务、导入提案与单独审批的四格式发布、bounded Write 预算授权/检查/记账；依赖 Canon/Planning，Draft/Rewrite Tools 和面板仍待迁移 | 自动接受正文、独立事实库、通用 IO 宿主 |
| `@novel-agent/novel-memory` | 版本绑定检索、中文搜索/排名、账本/生命周期、关系与知识图、控制包/延续状态、两个 Skills 和原生索引 Jobs；专属 Remote/Slot、最终 Tool 命名及 wire/schema 仍待迁移 | 独立事实库、自动写回 Canon |
| `@novel-agent/novel-review` | 审稿与资料研究 Skills；通过 Canon/Planning/Writing/Memory 生成带 Anchor 和 diff 的未授权审稿提案；专属 Remote/Tools/界面仍待迁移 | 自动接受或拒绝正文、平行审稿状态库 |

当前源码包含五个自挂载 Cordis plugin，均未公开发布。依赖按 Canon → Planning → Writing →
Memory → Review 组合；缺失时由 Cordis 等待，卸载上游服务时下游角色撤回。没有聚合 Profile、社区插件 wrapper 或安装器。社区插件由使用者按需要
另行安装，版本升级也保持独立。

产品功能包括以下小说领域能力，安装包边界以最终计划为准：

- **写作**：Ask / Plan / Write / Review / Accept / Publish 的真实创作闭环；
- **写作管理**：作品层级、章节合同、Result Packet、进度与审阅事务；
- **设定**：人物、关系、世界规则、地点、物件、知识边界和十类叙事时钟；
- **写作记忆**：从指定 accepted revision 召回滚动路线图、正文、设定、连续性、
  叙事债务、人物与双向关系延续状态，以及上一已完成章节的读者披露与实际结果，供下一次规划、
  写作和审校直接使用。

当前按最终计划推进 Canon 核心收缩。Core 已不注册领域角色及其他领域的阶段提示；Planning 的
十二个 Delta kind 值契约已由 `novel-planning` 通过 `registerDeltaKind` 拥有，Core 只保留
Result Packet/Revision/lock/rollback 信封与通用 fact kind；Memory/Writing 域的值 schema、检索等
实现和新界面仍在迁移中。所有插件共享唯一 Canon，必要前端仍在
现有 `conversation.view` 内；不会因此新增 Sidebar、TUI、Profile、transport 或平行记忆库。

Canon 的 `registerProjector` / `readProjection` 只交付指定 revision 的有效历史，负责排除未来
版本和已回滚分支；Planning 负责解释这些来源。没有 Planning projector 时，基本 Canon 预览
仅返回正文和 Canon fact 变化。现有叙事 Remote 仍为旧消费者保留派发入口，计算已由 Planning 承担。

Review 的 `novelReview.reviewDraft` 使用 DSH 原生子代理执行审稿，Canon 在执行前后检查 revision。
现有作者 Remote 保留身份/Workspace 绑定后派发给 Review，接受和回滚仍由 Canon 负责。
真实宿主验证使用脚本化 LLM 响应；DeepSeek 审稿质量和新 Review Slot 仍待验收。

原生提示段为 `novel:canon`、`novel:memory`、`novel:planning`、`novel:writing`、`novel:review`。
只启用 Canon 时只发布它自己的段；领域插件及其依赖卸载后对应段撤回。原有指令内容保留，
这些提示不替代 Host 端事务和审批校验。

Memory 的 `readRelationships`、`readChapterControlPack`、`readWritingContinuity` 消费原生领域服务。
Canon 的 `readSnapshot` 只给出有效祖先，`readCanonLockResolution` 解释当前锁在请求版本中的状态；
Memory 不回放版本链、不写事实。现有 Tool/Remote 已使用这些计算，专属 Memory Remote/Slot 尚未迁移。

`readGraph` 与 `readKnowledgeBoundary` 读取指定版本；`projectGraph` 接收明确的 Canon/Planning
输入，因此作者预览可以比较未接受候选。缺少 Memory 时，基础预览保持可用，因果比较项不提供。

现有 `retrieve_novel_context` / `rebuild_novel_index` 由 Memory 注册，并随其卸载撤回。
Memory 的 `retrieve` 自行组装检索结果，`rebuildRetrievalIndex` 创建调用者的原生 DSH Job；
Core 保留 `readRevisionImpact` 与旧检索 Remote 派发。索引只缓存派生数据，接受/回滚经原生事件使其失效。

`propose_novel_import` 和 `publish_novel_manuscript` 由 Writing 注册。导入经 Core 的 `parseDraft`
完成 Result Packet 与领域扩展校验，只返回待接受提案。发布使用指定 accepted revision，经原生
DSH approval 后写入目标文件，不推进 Canon；编码实现留在 Writing。

## 需要下载的社区插件

| 使用面 | 下载项 | 上游提供 | 在 `0.1.2-rc.1` 上的实测状态 |
| --- | --- | --- | --- |
| Web / Desktop | `dsh-better-sidebar@0.16.1` | 文件树、编辑/预览、真实终端、Git、Diff、Jobs/Subagents、分栏与浮窗 | **加载失败**：rc.1 的 `@deepseek-ai/dsh-settings` 没有 `settingsNamespace` 导出 |
| Web / Desktop | `@anweat/dsh-browser@0.1.9` | Playwright/OpenCLI 浏览器服务与工具 | **加载失败**：同一个 `settingsNamespace` 缺失 |
| Web / Desktop | `dsh-web-search-pro@0.1.11` | 多引擎与中文站点 Web 检索 | **加载失败**：rc.1 的 `@deepseek-ai/dsh-settings` 没有 `installSettingsSection` 导出 |
| Web / Desktop | `dsh-file-upload@0.4.3` | 上传入口和通用文档转文本 | 安装、Host 启动、client artifact HTTP `200` 通过；未做浏览器交互 |
| TUI | `@xmoon76/dsh-pi-tui@0.3.4` | 完整 TUI、Session、审批、命令、搜索、Skills、Plan 与 Subagents | 未在 `0.1.2-rc.1` 验收，旧 rc.2 记录保留在 `docs/` |
| 可选开发 | `dsh-git-worktree@0.6.0` | 隔离 Worktree 开发流程 | 未在 `0.1.2-rc.1` 验收 |

上表状态来自 [社区插件 rc.1 兼容性实测](docs/community-plugin-rc1-compatibility-2026-09-15.md)：
前三个插件的这些版本面向更新的 DSH，装进 `0.1.2-rc.1` Profile 会让
`plugin tree failed to load` 直接阻塞 Host 启动，因此已从隔离 Profile 移除；是否存在面向
rc.1 的更老版本尚未排查。它们的更老版本可用前，不要把这些组合写成可用。
这些全部是外部下载项，本仓库不复制、不包装，也不为它们再写通用前端。新的隔离
DSH `0.1.2-rc.1` Profile 完成真实 load/UI/TUI smoke 前，不把对应组合写成已验证。

## Web / Desktop 安装组合

当前已验证的开发入口是官方 `@deepseek-ai/dsh@0.1.2-rc.1` Web Host。
社区 [Desktop `2.0.5`](https://github.com/anywhere-labs/dsh-desktop/releases/tag/v2.0.5)
配套该 DSH 版本，但尚未在本轮安装或验收；旧 `2.0.2` 组合只保留历史证据。
以下社区插件命令保留为候选组合示例。按上面的 rc.1 实测，前三条命令装进 `0.1.2-rc.1`
Profile 后会让 Host 加载失败，等出现兼容版本再执行；旧 rc.2 smoke 不能替代 rc.1 兼容性验收：

```powershell
dsh plugin --profile web add `
  --allow-build=node-pty `
  dsh-better-sidebar@0.16.1
dsh plugin --profile web add `
  --allow-build=@jackwener/opencli `
  @anweat/dsh-browser@0.1.9 `
  dsh-web-search-pro@0.1.11
dsh plugin --profile web add `
  --allow-build=sharp `
  --allow-build=tesseract.js `
  dsh-file-upload@0.4.3
```

需要隔离 Worktree 开发流程时，只在自己选定的开发 Profile 中额外下载社区插件；
以下沿用上面的 `web` Profile：

```powershell
dsh plugin --profile web add dsh-git-worktree@0.6.0
```

File Upload 保持负责附件按钮、拖放、上传和通用文档抽取。TXT / Markdown
原文或 EPUB / DOCX 抽取后的规范化文本进入 Agent 后，当前的 `novel-project`
插件用 `propose_novel_import` 生成
authorization-free Result Packet；作者仍在现有小说面板审阅并 Apply，导出继续使用
已有的 `publish_novel_manuscript`。本仓库不包装 File Upload，也不复制它的前端。

EPUB / DOCX 也不增加导出前端或第二个 Tool。调用同一个
`publish_novel_manuscript` 时把 `format` 设为 `epub` 或 `docx`，原生 DSH 审批通过后
会把指定 accepted revision 中的一个 manuscript unit 写成真实二进制文件。若要导出
整书，继续调用同一个 Tool，设置 `scope: book`，让 `unitId` 指向 accepted Book
叙事单元并提供书名 `title`；插件会按 Book 下既有 Volume / Arc / Chapter Canon
顺序组装所有同 id 的 accepted Chapter manuscripts。EPUB 可再传 Workspace 内的
`coverPath`；PNG 会原样写成 `cover.png`，`.jpg` / `.jpeg` 会原样写成
`cover.jpg`，并生成 EPUB 3 `cover-image` manifest 与正文前的封面页；显式
`author` 会写入 EPUB OPF 或 DOCX core properties，`language` 会写入 EPUB
`dc:language`。DOCX 还可传 Workspace 内的 `templatePath`；模板用
`{{title}}` 接收 accepted 标题、用 `{{content}}` 接收按原顺序生成的正文段落，
其余模板内容和样式保留。调用卡片通过 DSH 既有
`edit + locations` 呈现进入 Produced Files。省略 `scope` 和 `format` 仍是原来的单元
UTF-8 文本发布。`docx@9.7.1` 与 `fflate@0.8.3` 是 `novel-writing` 内部的 Host 编码库，
不是用户要下载的新 DSH 插件。

从当前 checkout 开发时，构建并打包五个小说插件，再加入同一隔离 Profile。
实际 Host 与 Profile 须先按 [补丁说明](patches/README.md) 配置恢复补丁。
Core/Memory/Review/Writing 把 `@deepseek-ai/dsh-tools@0.1.2-rc.1` 声明为 Host peer；所选 Profile 的
`pnpm-workspace.yaml` 还须保留 `autoInstallPeers: false`，由同版本完整 Host 的官方 fallback
提供 Tools。Profile 再安装一份 Tools 会产生 scheduler Symbol 不一致，真实子代理工具调用将失败。
安装前将 `DSH_HOME` 指向该隔离 Home，并让下面的 `dsh` 命令指向同一已打补丁的 CLI。
以下在仓库根目录运行；打包会把 workspace peers 转为实际版本：

```powershell
corepack pnpm install
corepack pnpm build
corepack pnpm --filter @novel-agent/novel-project pack --out "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-project-0.0.0.tgz"
corepack pnpm --filter @novel-agent/novel-planning pack --out "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-planning-0.0.0.tgz"
corepack pnpm --filter @novel-agent/novel-writing pack --out "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-writing-0.0.0.tgz"
corepack pnpm --filter @novel-agent/novel-memory pack --out "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-memory-0.0.0.tgz"
corepack pnpm --filter @novel-agent/novel-review pack --out "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-review-0.0.0.tgz"
dsh plugin --profile web add `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-project-0.0.0.tgz" `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-planning-0.0.0.tgz" `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-writing-0.0.0.tgz" `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-memory-0.0.0.tgz" `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-review-0.0.0.tgz"
```

源码分别在 `packages\novel-project`、`packages\novel-planning`、`packages\novel-writing`、
`packages\novel-memory` 与 `packages\novel-review`。当前包版本均为私有
开发版本 `0.0.0`；上述命令不是 npm 公开发布或全局 Profile 验收。

### 在另一台电脑上安装

新机器克隆仓库后，Windows 用 `scripts/install-plugins.ps1`、macOS/Linux 用
`scripts/install-plugins.sh` 完成整套安装：`corepack pnpm install`、
`corepack pnpm build`、打包到 `%TEMP%\novel-agent-packages`、给所选 Profile 的
`pnpm-workspace.yaml` 写入授权的 `dsh-session` 补丁路径（并保留
`autoInstallPeers: false`）后执行 `dsh plugin --profile <名称> add`，最后校验 Profile
内的 `dsh-session` 带补丁、五个插件包齐全。前置条件是 Node 与 corepack（版本见根
`package.json`），并且**实际运行该 Profile 的 DSH CLI/Host 也必须已按
[补丁说明](patches/README.md) 应用同一补丁**——本脚本能配置 Profile，但不能修改
CLI 安装本身。脚本要求显式指定隔离的 `DSH_HOME`，不会写默认 Home：

```powershell
corepack enable
$env:DSH_HOME = 'D:\dsh-homes\dev'
powershell -ExecutionPolicy Bypass -File scripts/install-plugins.ps1 -Profile web
```

macOS / Linux 上先装本机唯一的已打补丁 CLI，再把它装进隔离 Home：

```bash
scripts/install-dsh.sh                              # 官方 0.1.2-rc.1 + 仓库 Session 补丁
scripts/install-plugins.sh --dsh-home "$PWD/.novel-agent/dsh-home"
DSH_HOME="$PWD/.novel-agent/dsh-home" dsh --profile web --host 127.0.0.1 --port 0 --no-open
```

`scripts/install-dsh.sh` 幂等：在 `~/.local/lib/dsh/0.1.2-rc.1` 装官方 CLI，校验每一份
`dsh-session` 都带补丁，并写出 `~/.local/bin/dsh` shim；它不写任何 `DSH_HOME`，也不删除旧版本。
本机（macOS）的搭建与冒烟证据见
[macOS 开发环境记录](docs/development-environment-macos-2026-09-15.md)。

装好之后用常驻开发宿主跑开发：它以脱离会话的后台进程提供前端和同一个 Host 里的后端服务，
固定端口 `4780`，运行状态写在 `.novel-agent/run/`（已被 `.gitignore` 忽略）。

```bash
scripts/dev-host.sh start      # 后台启动；重复调用不会起第二个进程
scripts/dev-host.sh rebuild    # 改完源码后：构建 → 装进 Profile → 重启
scripts/dev-host.sh status     # 或用 open / url / logs / stop
```

token 只在首次访问该浏览器时需要，`scripts/dev-host.sh open` 会用它打开页面；
日志里的 token 已打码。证据见 [任务清单](tasks/todo.md)。

脚本只写入 `%TEMP%`、`$DSH_HOME` 与仓库内构建产物；安装完成后用同一已打补丁的 CLI
启动该 Profile 即可。
必要的小说前端由 `novel-project` 通过 DSH 既有 `conversation.view` Slot 提供。
Better Sidebar 自带终端、Side Chat、文件、Git、Diff 和布局保持原样；novel-agent
不再注册第二份 Canon 摘要 tab。

检索索引重建也直接使用 DSH 自带的
`@deepseek-ai/dsh-tool-jobs@0.1.2-rc.1`。标准 Agent preset 已在每个 Agent
作用域挂载它，不需要 novel-agent 再下载、包装或启用根级 controller；自定义
Agent preset 若要使用后台重建，必须同样包含这个官方插件。每个 `novel-index`
Job 归属于发起调用的当前 DSH Session/Agent，因此现有 `job_output`、`job_list`、
`job_kill` 和社区 Jobs 界面可以直接接管。

## 小说角色 Skills

四个领域插件通过 DSH `0.1.2-rc.1` 原生 SkillRegistry 注册小说角色，Core 不再注册角色；不创建
插件自己的 Agent Loop、Session、Preset 目录或常驻专家团。组合后仍有八个既有角色，
以下前三个由 `novel-planning` 注册，正文写手由 `novel-writing` 注册；连续性检查和写作记忆整理
归属 `novel-memory`，审稿与资料研究归属 `novel-review`：
`novel-architect`（小说架构师）先读取 current accepted revision，再按需要规划整书、
卷、剧情阶段、章节和场景，把章节合同与严格 Canon/narrative Deltas 放入现有
authorization-free Result Packet；`novel-hook-payoff-planner`（爽点与钩子策划）以已接受
读者契约、章节状态和债务为边界，提出可审阅的张力升级、局部释放、代价与下一章拉力，
并且只使用既有 `narrative-clock/tension-payoff` 和结构字段；
`novel-world-character-setting`（世界观与人物设定）则把世界规则、人物目标、信念、
缺陷、声音、位置和资源映射到既有 Canon Delta；`novel-prose-writer`（正文写手）遵守
已接受的写作记忆和 Chapter 约束，生成带 unified diff 的正文草稿；
新建章节先用 Skill 内与架构师共用的严格合同示例提出计划，作者接受后再写正文；
正文接受后再独立提交 post-check。写作记忆面板使用原始 revision 查询从 Remote
读取完整内容，因此 DSH 截断大型 Tool 预览时仍能显示。真实模型首章至第五章的
分阶段验收、修订与跨 Session 验证见
[2026-09-05 记录](docs/external-model-chapter-repair-2026-09-05.md)。
[2026-09-07 质量复核](docs/accepted-chapter-quality-audit-2026-09-07.md) 已纠正
“入库等于质量通过”的边界：第二章修订及写回已到 R19/R20，第三至第五章仍有
已确认的正文元文本、物证及债务引用问题。十章规模、完整设定和已有小说接管
均未完成，不能只用入库章数或字数宣布验收完成。
`novel-continuity-checker`（连续性检查）则依据已接受的事实和文本证据提出带锚点的
连续性 Issue；`novel-reviewer`（小说审稿）审阅当前范围内的因果、人物、节奏、信息
边界、兑现、文风和读者承诺，提出带锚点的 Issue 及可选的完整修订正文/diff；
`novel-researcher`（资料研究）则使用当前 Profile 已有的浏览器、Web 搜索或文件 Tool，
形成区分事实、来源自述、推论和未知项的资料简报，只有作者明确要求入库提案时才使用现有
authorization-free Result Packet；`novel-writing-memory-organizer`（写作记忆整理）按指定
accepted revision 组织章节结果、人物/人物弧/双向关系、角色与读者知识边界、写作合同和
未清偿债务，普通回顾始终只读，只有作者明确要求且正文已接受时才提出严格
`chapter-state/post-check` 等既有 Delta。作者仍逐项审阅并 Apply。

在已挂载 `@deepseek-ai/dsh-tool-skill` 的 Agent preset 中，用户可直接在消息里写
`/novel-architect`、`/novel-hook-payoff-planner`、`/novel-world-character-setting` 或
`/novel-prose-writer`、`/novel-continuity-checker`、`/novel-reviewer`、`/novel-researcher`
或 `/novel-writing-memory-organizer`；模型也可从 Session Skill catalog 发现它们并调用 stock
`skill({ name })` loader。外部用户级 `novel` preset 只负责标准 Agent persona/组合。
2026-09-09 的全新 rc.1 Profile 验证了 Planning 三角色及正文写手的实际 Tool 加载、
章节合同历史读取和回滚后的完整 Host 冷恢复，读取过程不改 Canon。没有 GUI 或模型调用。
下面的 rc.2 记录属于拆包前的历史证据：
2026-09-01 的全新隔离 rc.2 Profile 已在 stock Web slash catalog
显示全部八个角色；`/novel-researcher` 与 `/novel-writing-memory-organizer` 均完成直接用户
注入，replay-driven 的真实 Agent 也分别发出原生 `skill({ name })` Tool 调用，成功结果与
各自直接注入的 canonical body 完全一致。80 个同源请求全部为 2xx，console error/warning、
page error、request failure、`novel/` Canon 事件和意外小说 storage 写入均为 0；构建哈希
在 Host 前后不变，停止后监听器为 0。该 replay 只验证 Agent/Tool/UI 执行链，不代表外部
模型自主选择 Skill。先前 `/novel-architect` 的同类代表性路径也已验证。另两个全新隔离
Web Profile 验证了 Standard parent 到 `novel-writing-memory-organizer` 的两条 DSH 原生
委派。前台 one-shot child 加载 Skill，完成一次只读 R1 `retrieve_novel_context` 并以
`CHILD_MEMORY_BRIEF_R1` 结束。后台 continuable child 则在首次只读 R1 retrieval 后原生
`report`，settle 后由 parent 通过 stock `send_message` 冷续接，再次 retrieval 和
`report`；parent 依次收到 `report → settled → report → settled`，child catalog 状态从
running 变为 inactive。两次 smoke 的父子 turn 均完成，Canon、小说 storage 与构建产物
未改变，浏览器请求无失败且 Host 停止后监听器为 0。它们只验证这一条 Standard parent
到 memory-organizer 的组合，不等于小说角色之间的协作。另一个全新的隔离 rc.2 Profile
在两个真实 Host lifetime 中复现了同一条 continuation：Host 1 的 Standard parent
`session-be372582-3af3-452c-b80c-a0fd6afc371a` 创建 child
`1eb3b95b-3478-4a87-88ec-7c10d10f2908` 并完成首轮 R1 retrieval/report/settle；Host 1
以 PTY `Ctrl+C` 退出后端口 `55235` 清空，Host 2（不同 PID `39276`、端口 `56818`）在
同一 DSH_HOME/Profile 中先看到 `parentAvailable=false`，再由 exact parent 通过一次
stock `send_message` 冷恢复同一 child。phase 2 完成第二轮 retrieval/report/settle，
parent 顺序仍为 `report → settled → report → settled`，raw `session.export` 的
parent/child JSONL 以 phase 1 为严格前缀，唯一 coordinator relay 的 `user/message`
与 inbox message 共享 id/source/text；R1、Canon、storage、build 和浏览器/RPC 状态均
保持不变，两个 Host 停止后监听器均为 0。受控 RED 则只去掉第二轮 report，并以
`reports=1` 的 quiescence 失败收口。证据与完整字段见
[checked runtime evidence](docs/upstream-sources.md#checked-evidence)。这仍只验证
Standard parent → memory-organizer 的跨 Host continuation，不等于产品级跨 Session
写作记忆或小说角色之间的协作。另一个全新隔离 rc.2 stock-Web Profile 已分别直接
调用 `novel-hook-payoff-planner`、`novel-world-character-setting`、`novel-prose-writer`、
`novel-continuity-checker` 和 `novel-reviewer`，每个角色都完成原生 `skill` Tool
调用/结果，Canon 保持 R1 且浏览器错误为 0；这验证直接调用链，不验证角色之间的协作。
随后另一份全新的隔离 rc.2 stock-Web Profile 验证了一个深度 2 的原生角色链：Standard
parent → `novel-architect` one-shot child → `novel-prose-writer` one-shot child。
外层角色读取 R1 后把 `ARCHITECT_PLAN_R1` 放入内层提示，内层读取同一 R1 并返回
`INNER_PROSE_R1`，结果沿原生 `subagent` 返回父级；三个 Session 的 parent/origin/
delegationDepth（0/1/2）通过 `session.list` 与 `session.export` 交叉核对。GREEN 使用
`C:\Users\33166\AppData\Local\Temp\novel-role-chain-green4-20260901-01a05b3c`，
27 个 RPC 与 23 个 Web API 全部成功，浏览器错误为 0，Canon/storage 保持 R1，停止后端口
`64142` 无监听；受控 RED 仅把内层 Skill 改成 `missing-role` 并在 canonical prose
Skill 结果断言处失败。该证据验证一个真实 role-to-role pairing，不代表其他配对、
parallel/fault recovery、这些角色的跨 Host continuation、外部模型质量、生产使用或用户验收；见
[N-007](tasks/todo.md)。

同一目标下的另一个全新隔离 rc.2 stock-Web Profile 验证了并行故障隔离：父级在同一
assistant step 启动两个前台 `subagent`，`novel-architect` 分支正常读取 R1，另一分支的
`skill({ name: "missing-role" })` 返回原生 `isError`，但仍独立结算，父级收到两条结果并
完成 `PARALLEL_PARENT_DONE_R1`。GREEN 使用
`C:\Users\33166\AppData\Local\Temp\novel-parallel-fault-green-20260901-01a05b3c`，
24 个 RPC 与 23 个 Web API 全部成功，浏览器错误为 0，Canon/storage 保持 R1，停止后端口
`64148` 无监听；RED 仅把故障 Skill 改为有效角色并在失败分支断言处失败。该证据只提升
原生 Skill 工具错误的并行 sibling 隔离，不代表进程/传输崩溃恢复、重试/取消、可继续并行
或完整角色配对矩阵；详见 [并行故障证据](docs/parallel-fault-recovery-stock-web-e2e-2026-09-01.md)。

## TUI 安装组合

完整 TUI 直接使用社区 Pi TUI。`novel-project` 的运行时依赖会下载 DSH
`0.1.2-rc.1` 的 `dsh-storage`、`dsh-storage-json`、`dsh-storage-domain` 和
`dsh-workspace`；Pi TUI 的基础 Profile 不负责挂载这组小说领域所需的 Host
provider，因此只在 `DSH_HOME\profiles\pi-tui\cordis.patch.yml` 合并下面四个
provider 条目：

```yaml
- insert:
    - id: storage
      name: '@deepseek-ai/dsh-storage'

    - id: storage-json
      name: '@deepseek-ai/dsh-storage-json'
      config:
        root: !!js dshHomePath('storages')

    - id: storage-domain
      name: '@deepseek-ai/dsh-storage-domain'
      config:
        backend: json

    - id: workspace
      name: '@deepseek-ai/dsh-workspace'
```

这只是用户选择的 Pi TUI Profile 对 DSH 官方 provider 的组合，不是 novel-agent
自研 Profile 或 TUI。Web Profile 已由 `dsh-web-app` 挂载同名 provider，不能加入
这段 Pi TUI overlay，否则 DSH 会以重复 loader id 拒绝启动。以下安装 Pi TUI 与上面已打包的
五个领域插件；这个新 TUI 组合尚未进行本轮 smoke：

```powershell
dsh plugin --profile pi-tui add @xmoon76/dsh-pi-tui@0.3.4
dsh plugin --profile pi-tui add `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-project-0.0.0.tgz" `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-planning-0.0.0.tgz" `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-writing-0.0.0.tgz" `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-memory-0.0.0.tgz" `
  "D:\Work\01_Projects\My-Projects\Original\novel-agent\.novel-agent\packages\novel-agent-novel-review-0.0.0.tgz"
dsh --profile pi-tui
```

完整 TUI、Session 切换、审批、命令、搜索、Skills、Plan 和 Subagents 都由 Pi TUI
提供。novel-agent 不创建 TUI 包或 Pi TUI extension；任何不可替代的小说界面都只
继续扩展现有 `novel-project` 的 stock DSH `conversation.view`。

## 架构

仓库根目录的 2026-08-22 foundation reports 是保留的历史研究，不是当前实施路线；
当前边界以本 README、`AGENTS.md`、`tasks/` 与 `docs/architecture.md` 为准。

```text
Community DSH Desktop or DSH CLI
  └─ user-selected Profile
      ├─ community plugins chosen by the user
      │   ├─ dsh-better-sidebar / browser / search / upload
      │   └─ @xmoon76/dsh-pi-tui (TUI Profile)
      └─ novel-agent domain plugins
          ├─ novel-project (Canon + current novel UI)
          ├─ novel-planning
          ├─ novel-writing
          ├─ novel-memory
          └─ novel-review
```

社区插件只提供可替换的通用表面，不能成为小说事实来源。卷、章、场景、人物、
关系、情绪、伏笔、线索、时间线、十个叙事时钟和结局进度仍由 Novel Project
Canon 与领域服务拥有。

## 当前证据边界

- 社区 Desktop `v2.0.2`、DSH `0.1.1-rc.2` 和 Better Sidebar `0.16.1` 的既有
  隔离 smoke 记录保留在 `docs/`。
- 2026-08-28 前后的单插件组合（当时版本为 `0.1.1-rc.2`）已在临时 `DSH_HOME` 中验证到
  启动边界：Web 根页面、`novel-project` client artifact 与 Better Sidebar client artifact
  均返回 HTTP `200`；Pi TUI `0.3.4` 显示可输入主界面。该证据不等于 Better Sidebar
  全部 Files/terminal/Git/Diff 交互或 Pi TUI 小说审阅流程已验收。
- `dsh-file-upload@0.4.3` 已在新的隔离 DSH `0.1.1-rc.2` Web Profile 中用
  上述两个精确 `--allow-build` 参数完成安装、解析、Host 启动与 client artifact
  HTTP `200`。后续真实浏览器流程又完成 TXT 点击上传 → composer 原文 → stock
  Agent `propose_novel_import` → 同一 Result Packet 面板 → author Apply R1 → reload
  恢复；但 File Upload 自己的 `conversation.input.dock` 同时记录了
  `undefined.text` console error，所以不把该社区 UI 写成 clean verified，也不在
  novel-agent 加补丁。完整证据见
  [N-006 记录](docs/txt-markdown-import-export-rc2-smoke-2026-08-28.md)。
- N-006 的同一个 Publish Tool 现可从 aggregate R2 选择仍源自 R1 的 accepted unit，
  也可按 accepted Book 层级把分别源自 R2/R1 的两个 Chapter 依 Canon 顺序组装为
  整书。原生审批前目标不存在，审批后生成可解包的 EPUB 3 或 DOCX ZIP，并返回
  `format`、真实字节数、aggregate/per-unit source revisions 和 `create|update`。测试
  核验 EPUB 的首个未压缩 `mimetype`、container、顺序 OPF/spine/nav/chapters，以及
  DOCX 的 content types、`word/document.xml`、书名、章节标题和中文正文顺序；整书
  DOCX 会在书名后生成只收录 Chapter 标题的可更新目录，并让每个 Chapter 从新页开始。发布后
  Canon 仍为 R2。没有新增 UI、adapter、Profile 或 Bundle。证据见
  [`docs/epub-docx-export-rc2-smoke-2026-08-28.md`](docs/epub-docx-export-rc2-smoke-2026-08-28.md)。
- 同一个 Publish Tool 的可选 `coverPath` 已通过本地真实 DSH Tool/approval/fs 集成测试：
  PNG 与 `.jpeg` 的原始字节进入 EPUB，OPF 声明正确 media type 和 `cover-image`，封面页
  位于 Chapter 前，审批前没有目标文件，发布后 Canon revision 不变。全新 Profile 的可见
  调用仍待验证。
- 整书 EPUB 的显式作者署名与语言标签已通过 OPF 解包测试，DOCX 作者署名也通过
  `docProps/core.xml` 解包测试；DOCX core 同时写入既有整书 `title`。未传可选字段的调用
  继续使用兼容输出，不增加作者设置库或导出 UI。
- `propose_novel_import` 还会接收上游 File Upload/抽取器报告的可选
  `sourceEncoding`、`sourceBom`、`sourceByteLength` 和 Workspace `sourcePath`。Host
  通过现有 DSH fs 直接读取该文件，将 resolved path 与真实原始字节随
  同一个 SourceAnchor 经过 Result Packet、author Apply、Typert Remote 和存储
  reload 保留；模型或上传插件不需要手工传 Base64。同一个 Publish Tool 使用
  `format: "source"`
  时，按 manuscript 的 accepted `sourceRevision` 原样写出这些字节，因而保留
  UTF-8 BOM、CRLF、混合换行和非 UTF-8 字节；发布不改变 Canon。本地
  真实 DSH Tool/Remote/storage/fs 闭环已通过；全新 Profile 的可见
  `sourcePath` 调用和同一 Project 接管见下方 N-006 evidence。
- N-006 的已有小说接管现已在全新隔离 rc.2 Web Profile 中验证：Workspace 中的原创
  `existing-novel.md` 由 stock Agent 通过 `propose_novel_import`（含 `sourcePath`、
  完整 world Delta 和规范化正文）形成 authorization-free Result Packet，面板显示
  manuscript、Diff、Delta、SourceAnchor 与 provenance，作者在同一面板 Apply 后由 R1
  进入 R2。真实 Host 重启后，新的 Session 从 R2 召回带 Anchor/provenance 的写作记忆，
  通过 `retrieve_novel_context` 与 `propose_novel_result_packet` 生成第二章提案，再由
  面板 Apply 到 R3；reload 后正文、Delta、Anchor 和 producer 仍在。Host 1/2 使用不同
  PID（29208/32584）和端口（51887/58567），两次 PTY `Ctrl+C` 后监听器均为 0，浏览器
  console/page/request error 均为 0。受控 RED 省略 import Delta，在真实提案到达后以
  `existing-world-rule-r2` 缺口失败。完整字段见
  [checked runtime evidence](docs/upstream-sources.md#checked-evidence)。该证据只覆盖
  这条已有小说接管→新 Session 续写路径，不等于十章原创验收或生产/用户验收。
- 另一个全新的隔离 rc.2 stock-Web Profile 已完成一部完全原创测试书的十章机械验收：
  R1 先接受世界规则、卷/弧层级、读者契约和 2900–3100 字合同，随后十个真实 Agent
  turns 各自加载 `novel-prose-writer`、按当前 revision 调用 `retrieve_novel_context`、
  提交带 Chapter contract 与 `chapter-state/post-check` 的 authorization-free
  Result Packet，并由现有 author review 逐章接受到 R11。storage 独立解析得到 10 个
  不同章节、每章可见 3000 字、总计 30000 字；历史 revision 不泄漏后续正文，reload
  后仍为 R11，110 个 RPC/26 个 Web API 全部成功且浏览器错误为 0。受控 RED 把第 6
  章设为 2800 字并在 `2800 !== 3000` 处失败。该证据验证 DSH Agent/Tool/Result
  Packet/Accept 与长度、合同、post-check 的可回放闭环；外部模型文风质量、逐章可见
  panel 交互、生产和用户验收仍需单独确认。完整字段见
  [checked runtime evidence](docs/upstream-sources.md#checked-evidence)。
- 同一个 Publish Tool 的可选 DOCX `templatePath` 已通过本地真实 DSH
  Tool/approval/fs 集成测试：审批前不写目标，审批后从 Workspace 读取模板，替换
  `{{title}}` / `{{content}}`，保留模板静态内容并返回实际模板路径；Canon revision
  不变。全新 Profile 的可见调用仍待验证。
- 当前 `novel-project` 还在全新隔离的 stock DSH Web Profile 中完成了真实可见的
  R0→R1 审阅、Book 层级、plot movement、promise debt、十个固定时钟、来源与
  provenance 展示及 reload 恢复。首次流程的 10 个和 rebuild 后复验的 4 个
  Novel Project RPC 均为 HTTP `200`，console/page/request error 均为 0；最终层级
  使用普通可访问列表，没有伪造可交互 Tree。证据根目录是
  `C:\Users\33166\AppData\Local\Temp\novel-agent-current-web-270cd52400ab417aa0682681e224b4c4`。
- N-001 的 Canon-only project brief、strict style-profile 与 reader-contract 也已在
  全新隔离 stock-Web Profile 中验证：R1 只接受 `project` 两个合同且没有 manuscript，
  R2 在同一 author review 中加入 `chapter-brief` 正文并写入带 R2 Anchor 的 style exemplar
  与 reader delivery evidence；Agent 通过 `writingMemoryQuery` 召回当前合同，历史 R1
  不泄漏 R2 证据，现有 Canon 面板和 reload 恢复嵌套值。GREEN 有 17 个 RPC 与 59 个
  Web API 响应、浏览器错误为 0、Canon/storage 未变，端口 `64304` 停止后无监听；RED
  对缺少 `purpose` 与 `demonstrates` 的 R3 分别原子拒绝并保持 R2。详见
  [project brief/style/reader stock-Web E2E](docs/project-brief-style-reader-stock-web-e2e-2026-09-02.md)。
- 十个 narrative clocks 现在全部保留 strict、versioned contract，不再存在 generic
  clock value/schema/delta 分支。`plot` 按 accepted
  narrative unit 定义
  scope，每条 line 保留 goal、stakes、status 和有序的 obstacle/choice/consequence/
  reversal turns；每个 turn 保留 story event、description、cost 与 `stateAfter`。
  R1→R2 即使 movement/state/storyTime 不变、只新增后果与反转，现有 revision impact
  也会按完整 accepted value 报告 before/after，而 provenance-only 变化仍不算故事变化。
  Tool/generated Remote 返回 historical/current、plot debt、Delta、Anchor 与 provenance，
  缺少 turn `stateAfter`、scope 不匹配或空 lines 的 R3 被原子拒绝并保持 R2；现有
  Narrative clocks 区域直接显示 scope、lines、四类 turns、理由和来源。package
  `193/193`、Narrative `21/21`、focused Remote `101/101`、focused Client `34/34`
  通过。fresh stock-Web strict plot 交互现已验证 R1/R2 historical/current retrieval、
  Remote、Narrative clocks 面板与 reload；18 个 RPC、65 个 Web API 响应成功，浏览器错误为
  0，Canon/storage 不变。详见 [strict plot clock stock-Web E2E](docs/plot-clock-stock-web-e2e-2026-09-02.md)。
  该证据只覆盖 synthetic fixture 的 plot 合同；更广泛固定时钟语义、进程/传输恢复、
  生产安装和用户验收仍未完成。
  `reader-knowledge` 只记录正文披露机制，不复制 `knowledge/state` 的 belief/memory/
  truth/access 事实。它按 scene/chapter/arc/volume scope 保留 disclosure、hint、
  reminder、misdirection、recontextualization 事件，每项引用既有 knowledge target，
  并带 intended effect、unit、viewpoint/access、description 与 Anchor；另保留
  preserve/narrow/resolve ambiguity policy 和修订理由。R1→R2 即使 outer summary
  不变、只改变 nested events 也会进入完整 revision comparison；空 events 允许 quiet
  unit，scope/version/Anchor 不合法的 R3 会原子拒绝并保持 R2。现有 Tool/generated
  Remote 与 Narrative clocks 区域返回/显示 historical/current、事件、歧义策略、
  Delta、来源和 provenance，不新增 Tool 或页面。package `196/196`、Narrative
  `23/23`、focused Remote `102/102`、focused Client `34/34` 通过。fresh stock-Web
  reader-knowledge 交互现已验证 R1/R2 五类嵌套事件、historical/current retrieval、
  Remote、Narrative clocks 面板与 reload；19 个 RPC、64 个 Web API 响应成功，浏览器错误为
  0，Canon/storage 不变。详见 [strict reader-knowledge clock stock-Web E2E](docs/reader-knowledge-clock-stock-web-e2e-2026-09-02.md)。
  该证据只覆盖 synthetic fixture 的 reader-knowledge clock；更广泛固定时钟语义、
  进程/传输恢复、生产安装和用户验收仍未完成。
  `mystery` 时钟只表达叙事单元中的谜团推进，不复制 mystery truth、clue 内容或
  knowledge belief。每个 move 是 open-question、advance、complicate、misdirect、
  partial-reveal、reveal、recontextualize 或显式 hold，并只引用现有 mystery、clue 和
  knowledge target IDs，保留 contribution 与修订理由。R1→R2 outer summary 不变时，
  nested moves 仍进入完整 comparison；至少一个 move、唯一 moveId、scope/level/Anchor
  与非空字段由现有原子事务校验。Tool/generated Remote 与 Narrative clocks 区域返回/
  显示 historical/current、refs、Delta、来源和 provenance，不新增 Tool 或页面。
  package `198/198`、Narrative `24/24`、focused Remote `103/103`、focused Client
  `34/34` 通过。fresh stock-Web mystery clock 交互现已验证 R1/R2 nested moves、
  historical/current retrieval、Remote、Narrative clocks 面板与 reload；18 个 RPC、87 个
  Web API 响应成功，浏览器错误为 0，Canon/storage 不变。详见
  [strict mystery clock stock-Web E2E](docs/mystery-clock-stock-web-e2e-2026-09-02.md)。
  该证据只覆盖 synthetic fixture 的 mystery 合同；更广泛固定时钟语义、进程/传输恢复、
  生产安装和用户验收仍未完成。
  `progression` 时钟只编排人物成长节奏，不复制 `progression/advancement`、Promise
  或 Ending 事实。每个 scene/chapter/arc/volume scope 至少保留一条 main 或 supporting
  track，表达 hold/setup/demonstrate/advance/test-limit/apply-consequence、引用的
  advancement/promise/ending IDs、setup/payoff readiness、typed drift warnings 与
  contribution；至少一条 main，且 advance 必须引用 advancement。R1 setup/hold 与 R2
  advance 会进入完整 historical/current comparison，非法 scope、空 tracks、重复 trackId
  或无 advancement 的 advance 被原子拒绝。
  `promise` 时钟记录某个 scope 实际发生的 open/remind/complicate/partial-payoff/payoff/
  retire/hold，只引用真实 `promise/state` target 与 promise debt IDs，不复制承诺文本、
  horizon、beats、resolution 或 aftermath。正常 R2 在同一个原子 Packet 中同步更新
  Promise lifecycle 与 clock，现有 Tool/generated Remote 同时返回 lifecycle、debt 和
  clock；现有 Narrative clocks 区域直接显示 moves 与引用。
  `character` 时钟记录 pressure/decision/consequence/commitment/transformation/hold，
  只引用 character target 与 story-event IDs；角色弧、选择、代价、后果和证据仍由
  `character-state/arc-hypothesis` 与 trajectory 拥有。`relationship` 时钟只引用稳定
  pair lineId、一个 directional `relationship/line-state` target、story-event 与 emotion
  episode IDs；R2 只推进 A→B 时，B→A 的 R1 value/source 保持不变，现有 Remote 同时
  返回 projectNarrative、projectRelationships 与 emotion ledger。四个时钟都复用现有
  `conversation.view`，不新增 Tool、store、页面或 package。当前 package `205/205`、
  Narrative `28/28`、focused Remote `106/106`、focused Client `34/34`、build、typecheck
  与 lint 通过。progression 的 fresh stock-Web R1/R2 交互已验证，详见
  [progression clock stock-Web E2E](docs/progression-clock-stock-web-e2e-2026-09-02.md)；
  promise 的 fresh stock-Web R1/R2 lifecycle/clock 交互也已验证，详见
  [promise clock stock-Web E2E](docs/promise-clock-stock-web-e2e-2026-09-02.md)；
  character 时钟的 fresh stock-Web R1/R2 pacing 交互也已验证，详见
  [character clock stock-Web E2E](docs/character-clock-stock-web-e2e-2026-09-02.md)；
  relationship 时钟的 fresh stock-Web R1/R2 pacing 交互也已验证：R1 的 alliance
  move 在 R2 增加 sacrifice move，同时保留独立的 A→B/B→A line-state、story-event
  与 emotion episode 引用；historical/current retrieval、generated Remote、
  `projectNarrative`、现有 Narrative clocks/relationship 面板及 reload 均一致。GREEN
  有 22 个 RPC 与 64 个 Web API 响应，浏览器错误为 0，Canon/storage 未变，端口
  `64287` 停止后无监听；RED 以重复 `moveId` 被原子拒绝并保持 R2。详见
  [relationship clock stock-Web E2E](docs/relationship-clock-stock-web-e2e-2026-09-02.md)。
  该证据只覆盖 synthetic fixture 的 relationship pacing 合同；更广泛关系语义、进程/
  传输恢复、生产安装和用户验收仍未完成。
  `ending` 时钟只记录一个 scope 对 closureScopeId 的 converge/resolve/transform/
  aftermath/hold 节奏动作和现有 narrative debt references；终局目标、主角选择、主题
  回返、final states、余波与 debt status 仍由 `ending.hypothesis` 和 closure ledger
  权威拥有。R1→R2 在同一原子 Packet 中更新 hypothesis、相关 debt 与 clock，现有
  Tool/generated Remote 返回完整 comparison，Narrative clocks 与 closure ledger 复用
  同一个 Ending view。fresh stock-Web ending 交互现已验证 R1/R2 hypothesis、debt 与
  clock 的原子更新、historical/current retrieval、generated Remote、`projectNarrative`、
  Ending/Narrative clocks 与 closure ledger 面板及 reload；GREEN 有 20 个 RPC 与 89 个
  Web API 响应，浏览器错误为 0，Canon/storage 未变，端口 `64293` 停止后无监听；RED
  以重复 `moveId` 被原子拒绝并保持 R2。详见
  [ending clock stock-Web E2E](docs/ending-clock-stock-web-e2e-2026-09-02.md)。该证据只覆盖
  synthetic fixture 的 ending closure 合同；更广泛终局语义、进程/传输恢复、生产安装和
  用户验收仍未完成。
  `world` 时钟只记录 typed references：world rule target、faction continuity entry、
  location continuity entry 或 object continuity entry，不复制规则/势力/地点/物件内容或
  来源。R1→R2 与真实 rule 和三类 continuity facts 同步接受，现有组合查询分别重建
  current/historical ledgers；最后一个 generic clock 类型、schema 和 delta branch 已删除。
  World/Ending 的非法 scope、空/重复 move/reference、空 Anchor 等 R3 都原子拒绝并保持
R2。该里程碑 package `239/239`、Narrative `30/30`、focused Remote `131/131`、focused
  Client `40/40`、build、typecheck 与 lint 通过；fresh stock-Web world 交互已验证
  R1/R2 rule 与 faction/location/object continuity references、historical/current
  retrieval、generated Remote、`projectNarrative`、Narrative clocks 面板及 reload。
  GREEN 有 20 个 RPC 与 86 个 Web API 响应，浏览器错误为 0，Canon/storage 未变，端口
  `64297` 停止后无监听；RED 以重复 `moveId` 被原子拒绝并保持 R2。详见
  [world clock stock-Web E2E](docs/world-clock-stock-web-e2e-2026-09-02.md)。该证据只覆盖
  synthetic fixture 的 world reference-clock 合同；跨-Canon 存在性校验、world simulation、
  进程/传输恢复、生产安装和用户验收仍未完成。
  `tension-payoff` 按 `unitId` 与 `scene|chapter|arc|volume` level
  定义 scope，并允许多条重叠 wave；每条 wave 明确 `source`、opening/peak/closing 的
  `rest|low|medium|high|peak` 强度、起止 unit（结束可为 `null` 表示持续中）、可空的
  release/recovery 及 typed `sceneFunctions`。R1 同时保留一条有代价的局部释放追捕线
  和一条尚未释放/恢复的关系余震，R2 把追捕线推进为高潮、完全释放和已发生恢复。
  现有 `retrieve_novel_context` Tool/generated Remote 返回 historical R1、current R2、
  R1→R2 comparison、SourceAnchor ranges、Delta 与 provenance，且查询不改 Canon；缺少
  `release.aftermath` 的 R3 会被拒绝并保持 R2。既有 Narrative clocks 区域通过
  `data-tension-payoff-scope`、`data-tension-wave` 及强度、时长、释放、恢复、
  scene-function selectors 显示这些 accepted waves；没有新增 Tool、store、页面或
  package。fresh stock-Web 现已验证 R1/R2 overlapping waves、historical/current
  retrieval、Remote、Narrative clocks 面板与 reload；18 个 RPC、87 个 Web API 响应成功，
  浏览器错误为 0，Canon/storage 不变。详见 [strict tension-payoff clock stock-Web E2E](docs/tension-payoff-clock-stock-web-e2e-2026-09-02.md)。
  该证据只覆盖 synthetic fixture 的 tension-payoff 合同；更广泛固定时钟语义、进程/
  传输恢复、生产安装和用户验收仍未完成。
- 已从 workspace 与产品路径退役的本地终端和额外 Web/TUI adapter 证据不能证明
  当前组合；现行通用表面由上述社区插件提供。
- N-003 的当前 retrieval 切片已经通过真实 DSH Remote 返回指定 revision 的
  Canon/层级结构结果、正文 exact-text 范围和 MiniSearch + Jieba 中文全文命中，
  并带有 source range、provenance、source revision 与 `current|historical`
  freshness；测试证明 R1/R2 隔离、错误 revision 无命中以及非连续中文词检索。
  可选 `canonKind` 会把 structured Canon hits 限定到一个既有事实族，例如只取
  `clue`、`character-state` 或 `promise`，而不改变叙事、图谱或正文结果。
  可选 `canonTargetId` 会进一步精确到一个已接受 Canon 实体，例如某个具体人物、
  事件、线索或承诺；它只过滤 structured Canon hits，并可与 `canonKind` 组合。
  `world` Canon 的 `field: "rule"` 只接受包含 scope、statement、正整数 version、
  exceptions、publicBelief、hiddenTruth 和 observedConsequences 的 typed value。现有
  Result Packet 可接受 R1/v1 到 R2/v2 的规则更新；同一个 `retrieve_novel_context`
  通过 `canonKind: "world"`、`canonTargetId` 和 `compareRevision` 返回当前 hit/source
  及完整 before/after revision impact，并保持 Canon 不变。通用 Canon/revision 界面
  已能显示这些事实和比较，不新增世界规则 selector、UI、Tool、store 或 Profile。
  `roadmap` Canon 的 `field: "plan"` 只接受 strict typed 滚动计划：正整数
  `version`、`detailedThroughUnitId`、`horizonSummary` 和有序 `units`；每个 unit 保留
  `targetChapterStart`/`targetChapterEnd`、`milestone`、`status`、
  `dependsOnUnitIds`、`scopedDebtIds` 与 `changeRationale`。现有
  `retrieve_novel_context` 在精确 roadmap target 上返回 revision-bound
  `roadmapResolution`：稳定排序的 `orderedUnits` 以及依赖和债务引用的
  `resolved`、`missing`、`ambiguous` 结果、候选与来源。现有 `conversation.view`
  可选择计划并显示完整解析及 revision comparison，查询保持 Canon 不变。该能力
  不自动重规划，也不新增 Tool、store、package 或 Profile。
  可选 `narrativeLevel` 同样可只取 `chapter`、`scene` 等指定层级的结构单元。
  可选 `narrativeUnitId` 会一次限定某章或场景的 structured unit、clock entry 和
  debt，并可与 `narrativeLevel`、`narrativeClock` 取交集；Canon 与正文结果不变。
  可选 `narrativeClock` 会把 structured clock entry/debt hits 一并限定到 `plot`、
  `promise` 等一个既有叙事时钟，不改变 Canon、层级、图谱、正文或控制包结果。
  可选 `unitId` 会把 exact-text/full-text 命中限定到指定 accepted manuscript，
  适合多章包含同一词时只检索当前章；它复用同一个全书索引，不创建章节索引或 UI。
  可选 `timelineParticipantId` 会把显式列出该人物的 typed `story-event.event`
  组成 story-time ledger，按故事时间、正文顺序和事件 id 排列，并保留 effects、
  source range、Delta 与 provenance；现有 Canon 区域直接显示该只读账本。
  可选 `characterTrajectoryId` 会逐个 accepted aggregate revision 重建指定人物的
  `character-state`，只在状态或来源证据变化时生成 trajectory entry。每项同时保留
  当前字段、before/after、accepted Delta 的锚点范围、packet 与 provenance，因此
  `recentDecision`、`emotionalResidue`、字段移除和 rollback 恢复都有可见证据。它不把
  自由形态 `emotion-state` target 猜成人物关系，也不创建第二个历史库、tab 或 adapter。
  其中仅保留的 `character-state/arc-hypothesis` 是 strict typed 值：正整数 version、
  scope、人物弧 hypothesis、starting belief、target transformation、transformation
  dimensions、pressures、accepted `decisionChain`、current stage、unresolved question
  与 nullable change rationale。每个决定保留 story event、压力、选择、被拒备选、
  cost、persistent consequence 和 transformation evidence；其他 `character-state`
  字段仍走既有 generic Canon 路径。现有 `characterTrajectoryId` Tool/generated Remote
  在 historical R2 与 current R3 返回完整 before/after、source ranges 和 provenance，
  R3 正常路径保留两步有代价的决定链，既有 `conversation.view` 使用专门排版显示，
  查询不修改 Canon，也不新增 fact family、Tool、store 或 package。fresh stock-Web
  R1→R2 轨迹路径现已通过
  [character arc trajectory evidence](docs/character-arc-trajectory-stock-web-e2e-2026-09-02.md)：
  RED 缺少 `persistentConsequence` 时保持 R2，GREEN 的 historical/current
  `characterTrajectoryId` retrieval、generated Remote、现有 trajectory 面板与 reload
  全部通过（20 RPC / 68 Web，浏览器错误 0，Canon/storage 不变）。该证据只覆盖
  合成的 strict arc-hypothesis 轨迹；rollback-specific arc restoration、其他通用
  character-state 字段、进程/传输恢复、生产安装和用户验收仍未完成。
  可选 `clueLifecycleId` 会用同样的 accepted-revision 语义重建一条线索或伏笔的完整
  生命周期：字段埋设、强化或误导、显式移除、同值新证据与 rollback 恢复都会形成带
  before/after、packet、Delta、SourceAnchor 范围和 provenance 的条目。现有 Canon 区域
  直接提供线索选择器和只读账本，不建立平行伏笔库。仅 `clue/state` 被保留为 strict、
  versioned contract；其他 Clue 字段仍走 generic Canon 路径。该状态区分 clue、
  foreshadowing 与 red herring，保留关联谜题、生命周期状态、读者可见性、预期用途、
  兑现窗口、兑现类型/说明/余波、放弃理由与修订理由。R1 planted foreshadowing 到 R2
  paid-off 会通过现有 Tool/generated Remote 保留 historical/current、before/after、
  accepted Delta、SourceAnchor 与 provenance；缺少 payoff aftermath 的 R3 被原子拒绝，
  head 保持 R2。现有 Canon 与 clue lifecycle 复用同一状态排版。package `188/188`、
  focused Remote `100/100`、focused Client `34/34` 通过；fresh stock-Web clue/state
  R1→R2 交互、历史隔离、generated Remote、现有 clue lifecycle 面板与 reload 已通过
  [clue-state stock-Web E2E](docs/clue-state-stock-web-e2e-2026-09-02.md)：GREEN
  22 RPC/67 Web、浏览器错误 0、Canon/storage 不变，RED 缺少 `payoff.aftermath`
  时保持 R2。该证据只覆盖合成 strict clue 生命周期；更广泛谜题语义、rollback-specific
  恢复、进程/传输恢复、生产安装和用户验收仍未完成。
  仅 `knowledge/state` 被保留为 strict、versioned contract；其他 Knowledge 字段继续
  generic。它明确主体是 reader 或 character，记录 known/suspected/misread belief、
  retained/recalled/forgotten memory、truth alignment，以及 observed/told/inferred/
  remembered/misreported 的获得方式、所在 unit 和 direct/limited/reported/unreliable
  viewpoint access。R1→R2 的人物与读者知识更新通过现有 `canonKind: "knowledge"`、
  `knowledgeSubjectId`、knowledge edge、historical/current、Delta/Anchor/provenance 路径
  返回且不改 Canon；缺少 `access.unitId` 或 remove 携带非 null value 的 R3 被拒绝，
  head 保持 R2。现有 Canon 与 Knowledge boundary 复用同一状态排版。package
  `188/188`、focused Remote `100/100`、focused Client `34/34` 通过；fresh stock-Web
  knowledge/state R1→R2 交互、历史隔离、generated Remote、现有 Knowledge boundary
  面板与 reload 已通过 [knowledge-state stock-Web E2E](docs/knowledge-state-stock-web-e2e-2026-09-02.md)：
  GREEN 17 RPC/67 Web、浏览器错误 0、Canon/storage 不变；RED 缺少 `access.unitId`
  时保持 R1。语义真值推断、进程/传输恢复、生产安装和用户验收仍未完成。
  仅 `promise/state` 被保留为 strict、versioned contract；其他 Promise
  字段仍走既有 generic Canon 路径。该状态记录 `version`、承诺文本、开放 `type`、
  `minor|supporting|major|core` weight、opened/payoff-start/payoff-end horizon，以及带
  `beatId`、`unitId`、`sourceRevision`、非空 `sourceAnchorIds` 和 description 的 setup、
  reminders 与 complications。resolution 是 `open|partially-paid|paid|retired` 判别联合：
  open 没有 payoff，partial/paid 必须给出
  `micro|chapter|arc|relationship|mystery|progression|thematic|final` payoff type、兑现 beat
  和非空 aftermath，retired 则保留 beat 与非空 retirement rationale。可选
  `promiseLifecycleId` 会重建同一 strict 状态从 R1 open 到 R2 partially-paid 的 accepted
  生命周期，并通过现有 Tool/generated Remote 返回 historical/current、before/after、
  accepted Delta、SourceAnchor 范围、revision、packet 与 provenance。缺失 aftermath 的
  paid R3 被原子拒绝，head 保持 R2。现有 Canon 与 Promise lifecycle 区域复用同一状态
  排版，不建立新 Tool、store、page、payoff store 或 package。当前 package `188/188`、
  focused Remote `100/100`、focused Client `34/34` 通过；fresh stock-Web Promise 交互尚未
  执行，因此状态为 `implemented-unverified`。
  可选 `mysteryLifecycleId` 只重建一个 strict typed `mystery.state`。它保留 positive
  version、question、`unknown-to-author + answer:null | known-to-author + answer:string`
  判别真相、hypotheses、knowers、readerVisibility、concealmentRule、revealConditions、
  earliest fair resolution unit、desired reveal window、actual reveal、aftermath 与修订理由。
  R1 作者未知到 R2 锁定真相/实际揭示会保留 current/historical、before/after、accepted
  Delta/source ranges、packet 与 provenance；同一 lifecycle 还从当前 revision 的唯一
  `clue/state` 事实派生全部匹配 linkedMysteryIds 的 foreshadowing/red-herring 证据，纯
  evidence 变化也会生成 lifecycle entry，但不建立第二个 clue store。unknown truth 带
  非空 answer 的 R3 被原子拒绝，head 保持 R2。现有 Canon 区域复用同一个 state/clue
  展示，不新增 Tool、store、Profile 或 package。fresh stock-Web strict `mystery/state`
  R1→R2 lifecycle、历史隔离、linked clue evidence、generated Remote、`projectNarrative`、
  现有 Mystery/Clue 面板与 reload 已通过 [mystery-state stock-Web E2E](docs/mystery-state-stock-web-e2e-2026-09-02.md)：
  GREEN 22 RPC/60 Web、浏览器错误 0、Canon/storage 不变，端口 `64463` 停止后无监听；
  RED 的 author-unknown 非空 answer 在 `truth.answer` 被拒绝并保持 R2。更广泛谜题/揭示语义、
  rollback-specific 恢复、进程/传输恢复、生产安装和用户验收仍未完成。
  可选 `progressionCharacterId` 只组装 `progression` 中 `field: "advancement"` 的显式
  typed 能力提升，并按 `storyOrder`、事件 id 和 opaque advancement id 排列。每项保留
  先前限制、铺垫、证据、促成行动、资源或牺牲、新能力、剩余限制、克制、社会解释、
  下游后果以及完整 source range、Delta 和 provenance；其他人物与旧自由文本 rank 不会
  被猜测进账本。现有 Canon 区域提供人物选择器并显示该只读成长账本。fresh stock-Web
  `progressionCharacterId` R1→R2 交互、历史隔离、generated Remote、`projectNarrative`、
  现有 progression 面板与 reload 已通过 [progression ledger stock-Web E2E](docs/progression-ledger-stock-web-e2e-2026-09-02.md)：
  GREEN 19 RPC/81 Web、浏览器错误 0、Canon/storage 不变，端口 `64362` 停止后无监听；
  RED 缺少 typed advancement value 时在 Typert 边界拒绝并保持 R1。更广泛成长语义、
  rollback-specific 恢复、进程/传输恢复、生产安装和用户验收仍未完成。
  可选 `factionId` 只组装该势力显式 typed `faction-state.continuity` entries，并通过
  `factionContinuity` 按 `storyOrder`、`eventId` 和 opaque entry id 排列。每项保留
  `goal`、`resources`、`constraints`、`currentAction`、
  `membershipOrAllianceChange`、`offscreenConsequence` 及完整来源；current/historical
  查询排除其他势力和 legacy 文本，并保持 Canon 不变。现有 Canon 区域提供势力选择器
  和只读账本，不新增 Tool、store、Profile 或 package。记录型 typed value 缺少
  `offscreenConsequence` 会在 Result Packet 边界直接拒绝，primitive/array legacy value
  仍按 generic Canon 保留。fresh stock-Web faction R1→R2 交互、历史隔离、generated
  Remote、`projectNarrative`、现有面板与 reload 已通过 [faction-state stock-Web E2E](docs/faction-state-stock-web-e2e-2026-09-02.md)：
  GREEN 20 RPC/89 Web、浏览器错误 0、Canon/storage 不变，端口 `64531` 停止后无监听；
  RED 缺少 `offscreenConsequence` 时保持 R2。更广泛势力语义、rollback-specific 恢复、
  进程/传输恢复、生产安装和用户验收仍未完成。
  可选 `locationId` 只组装该地点显式 typed `location-state.continuity` entries，并通过
  `locationContinuity` 按 story order、event 和 opaque entry id 排列。每项保留
  `parentLocationId`、`scale`、`accessConditions`、`governingFactionIds`、
  `activeRuleIds`、`resourceFlows`、`currentChange`、`consequence`，以及包含
  destination、travel time、access conditions、status 的 `travelLinks` 和完整来源。
  current/historical 查询排除其他地点与 legacy 文本并保持 Canon 不变；现有 Canon
  区域提供地点选择器和只读账本，不新增地图、旅行判定、Tool、store 或 Profile。
  记录型 typed value 缺少 `consequence` 会在 Result Packet 边界拒绝，legacy primitive/
  array value 仍按 generic Canon 保留。fresh stock-Web location R1→R2 交互、历史隔离、
  generated Remote、`projectNarrative`、现有面板与 reload 已通过 [location-state stock-Web E2E](docs/location-state-stock-web-e2e-2026-09-02.md)：
  GREEN 20 RPC/88 Web、浏览器错误 0、Canon/storage 不变，端口 `64541` 停止后无监听；
  RED 缺少 `consequence` 时保持 R2。更广泛地点/旅行语义、rollback-specific 恢复、进程/
  传输恢复、生产安装和用户验收仍未完成。
  可选 `objectId` 只组装该物件显式 typed `object-state.continuity` entries，并通过
  `objectContinuity` 按 story order、event 和 opaque entry id 排列。每项保留
  `holderId`、`locationId`、`quantity`、`condition`、`status`、`currentChange`、
  `consequence` 及完整来源；current/historical 查询排除其他物件和 legacy 文本并
  保持 Canon 不变。现有 Canon 区域提供物件选择器和只读账本，不做 inventory 自动
  同步、重复或守恒校验，也不新增 Tool、store 或 Profile。记录型 typed value 缺少
  `consequence` 会在 Result Packet 边界拒绝，legacy primitive/array value 仍按 generic
  Canon 保留。fresh stock-Web object R1→R2 交互、历史隔离、generated Remote、
  `projectNarrative`、现有面板与 reload 已通过 [object-state stock-Web E2E](docs/object-state-stock-web-e2e-2026-09-03.md)：
  GREEN 20 RPC/90 Web、浏览器错误 0、Canon/storage 不变，端口 `64373` 停止后无监听；
  RED 缺少 `consequence` 时保持 R2。更广泛 inventory 语义、rollback-specific 恢复、
  进程/传输恢复、生产安装和用户验收仍未完成。
  可选 `emotionCharacterId` 只读取 `emotion-state` 中 `field: "episode"` 的显式结构化
  情绪事件，并按 `storyOrder`、事件 id 和 opaque episode id 组成指定人物的连续性账本。
  现有 Canon 区域显示触发、对象、评估、混合情绪强度、身体表现、行动倾向、外显与
  压抑、应对、残留、再激活、后续选择及完整来源证据。旧 `felt` 等自由格式事实继续
  保留在 Canon，但不会被猜测进该账本，也不会自动改写 `character-state`。记录型 typed
  episode 缺少 `downstreamChoices` 会在 Result Packet 边界拒绝。fresh stock-Web emotion
  R1→R2 交互、角色/legacy 过滤、历史隔离、generated Remote、`projectNarrative`、现有面板
  与 reload 已通过 [emotion-state stock-Web E2E](docs/emotion-state-stock-web-e2e-2026-09-03.md)：
  GREEN 21 RPC/89 Web、浏览器错误 0、Canon/storage 不变，端口 `64613` 停止后无监听；
  RED 缺少 `downstreamChoices` 时保持 R1。更广泛心理语义、rollback-specific 恢复、
  进程/传输恢复、生产安装和用户验收仍未完成。
  同一个 `retrieve_novel_context` 还可按需返回只读 graph projection：它从指定
   accepted revision 重建 narrative hierarchy、Canon fact、关系、时钟和债务节点/边，
   每项保留 source range、provenance、source revision 和稳定 `contentHash`；它不写
   Canon、不新增 graph store/Job/UI。已接受的 `story-event` fact 若使用
   `field: "causes"` 和目标事件 id 字符串，会投影为 source-bearing typed causal edge。
   传入 `impactEventId` 时，同一个 Tool 与生成的 Remote 会从该 accepted revision
   稳定追踪所有下游事件的最短因果路径，按深度和事件 id 返回完整 edge 来源元数据；
   只请求影响追踪不会返回完整 `graph`，也不会修改 Canon。
   同时传入 `closureScopeId` 与正整数 `remainingChapterBudget` 时，它还会按 accepted
   hierarchy 顺序返回该 Book/Series 子树的 ending entries、当前 projection 中仍存在的
   全部十时钟债务和作者给定的剩余章节预算。债务是否返回由 accepted set/remove
   决定，不猜测自由文本 `status`。每条 debt 可用 `{clock,id}` 复合引用显式声明
   `dependsOn`，账本据此给出稳定 `dependencyOrder`；结果不评分、不自行猜依赖、
   不写 Canon。Accepted Canon 还支持严格的 `ending` / `field: "hypothesis"`
   set/remove：值必须声明 Book/Series `scopeUnitId`、正整数 `version`、`endingTarget`、
   `decisiveConflict`、`protagonistChoice`、`thematicReturn`、
   `desiredEmotionalAfterimage`、固定 `resolutionMode`、非空 `finalStates`、
   `aftermath`、显式 `deliberatelyUnresolvedDebts` 和可空 `epiloguePurpose`。同一个
   closure Tool/generated Remote 按请求 revision 返回匹配 scope 的 hypothesis 及其
   source revision、Delta、Anchor、range、provenance 和 current/historical freshness；
   该 scope 没有 accepted hypothesis 时明确返回 `endingHypothesis: null`。既有
   `conversation.view` ending-closure 面板直接呈现这些字段；不从正文或其他 Canon
   推断终态，也不新增 Tool、页面、package、Profile 或 TUI，查询仍不修改 Canon。
   传入 `compareRevision` 时，同一个查询还会比较两个完整 accepted snapshots，按正文、
   Canon fact、narrative unit、clock entry 和 debt 分别返回 added/removed/changed；
   `changed` 同时保留 before/after 的 revision、Delta、Anchor 与 provenance。它还会比较
   两版显式 `story-event.causes` 投影，按每个因果源报告新增、失去或改走最短路径的下游
   事件，并保留完整路径证据而不返回未请求的 graph。比较只看小说语义值和路径端点，
   因此同值重新 set 或仅来源变化不会误报，任意非相邻 revision 与 rollback 也按重建后的
   净状态比较。
   Result Packet 的逐项决定完成后，现有审阅 article 还能在 Apply 前调用生成的
   `previewReview` Remote。它只把被接受的正文和 Delta 投影成下一 revision，复用
   Apply 的 revision、Canon lock 与叙事结构校验，并显示正文、Canon、结构、时钟、
   债务和下游因果的完整净影响；预览不生成 authorization、不写 revision 或索引。
   随后用相同决定 Apply 得到的真实 revision impact 与预览完全相等。决定或理由变化
   会立即清除旧结果，迟到的异步预览不会回写。
   first-class `knowledge` fact 使用显式 `subject->fact` target 时，同一投影会生成
   主体到已知事实的 typed knowledge edge，保留 source revision、Delta、
   Anchor 和 provenance；同一事实也可用 `canonKind: "knowledge"` 结构化检索。
   同一个 `novel-project` 还通过生成的 DSH Remote 暴露
   `projectRelationships(workspaceId, revision)`：它把 accepted `relationship` facts
   先按显式 `from->to` 聚合方向状态，再把 `A→B` 与 `B→A` 收进词典序稳定的
   `A<->B` RelationshipLine。两个方向各自保留字段、fieldSources 和 provenance，
   不假定关系对称，并按请求的 accepted revision 重建，因此 remove/rollback 仍由
   Canon 决定。其中仅 `relationship` / `field: "line-state"` 被保留为 strict typed
   双向关系状态：每个方向独立记录 version、premise、form、stage、独立目标、信任、
   冲突、承诺、边界、共同历史、障碍、`unresolvedDebts`、
   `mainPlotConsequences`、agency evidence、目标结局和修订理由；每个 earned turn
   还必须保留 story event、行动、对方反应、代价、持续后果与阶段变化。其他
   `relationship` 字段继续走 generic Canon 路径。现有 `conversation.view` Novel
   Project 面板直接消费该 Remote，在同一 line 下显示两个方向、strict 状态、转折、
    债务、主线后果和来源，并在 Apply/rollback 后刷新。historical R1 与 current R2
    Remote、缺少 `persistentConsequence` 的拒绝及 Client 专用展示均已通过。fresh
    stock-Web 现已验证同一 R1/R2 双向 projection、现有关系/关系时钟视图和 reload；
    21 个 RPC 与 64 个 Web API 响应成功、浏览器错误为 0，Canon/storage 不变。详见
    [strict relationship line-state stock-Web E2E](docs/relationship-line-state-stock-web-e2e-2026-09-02.md)。
    该扩展仅在本 synthetic fixture 范围内提升为 `verified`；其他 strict clocks、进程/传输恢复、
    生产安装和用户验收仍未完成。没有新增关系存储、
   Sidebar tab、Pi TUI extension 或通用前端。
   当前 revision 的派生索引可通过归属于当前 Agent 的 DSH 原生 `novel-index` Job
  重建；接受新 revision 会使旧缓存失效，Jobs 的显示、等待和终止继续复用 DSH，
  不新增任务前端。全新 stock Web Profile 的 `standard` preset 在没有
  novel-agent Jobs controller 时，由模型调用 `rebuild_novel_index`，返回
  `novel-index-1`，接收原生 `tool-jobs` 完成通知并以 completed turn 收尾；成功
  Session 为 `session-c5048727-7feb-4c7f-a3e9-fc6000a0d33a`，证据根目录为
  `C:\Users\33166\AppData\Local\Temp\novel-agent-stock-agent-replay-20260827-1932`。
  该证据不覆盖运行中 kill 或 in-flight stale 分支。
- N-003 的锚定审校入口已在唯一 `novel-project` 内实现：现有
  `conversation.view` 面板把当前 Session 交给 DSH live Agent registry，并使用
  stock `spawn` Subagent 生成只读、无 author authorization 的完整改写正文和锚定
  Issue 草稿；`diff@9.0.0` 在 Host 内把已接受正文与 `revisedText` 转成含真实删除、
  新增内容的 unified Diff。quote 必须在已接受正文中存在且唯一；改写与原文相同、
  无有效 Diff 或审校期间 revision 前进都会拒绝旧结果，run 始终 dispose。只有用户
  逐项决定并点击 Apply 才授权并进入既有 Canon 事务。正文改写本身也是独立项目：
  作者可以拒绝改写正文并填写原因，同时接受同一包里的 Canon Delta 或锚定 Issue；
  新 revision 会保留上一版已接受正文及其 `sourceRevision`。Canon-only 包不会生成
  虚假的正文决定。现有面板还能把作者填写的
  审校焦点送入同一个 reviewer prompt，并在 Apply 时携带可选的逐项决策理由；这两项
  新控件已通过本地 client 正常路径测试。accepted revision 历史也可在原列表中展开
  packet、parent/rollback 来源、逐项决定、provenance 和 authorization；这些新控件
  尚未单独完成 fresh-Profile 可见 smoke。全新隔离 stock-Web 已真实
  验证 R1 甲章、R2 乙章、选择甲章审校、Apply R3、rollback R2 得 R4 以及 reload：
  两章按各自真实 `sourceRevision` 和 provenance 恢复；29 个 Novel Project RPC 均为
  HTTP `200`，console/page/request error 均为 0。证据见
  [`docs/multi-manuscript-review-stock-web-e2e-2026-08-28.md`](docs/multi-manuscript-review-stock-web-e2e-2026-08-28.md)。
- N-004 继续复用 DSH 原生 Agent、Tool Runtime、System Prompt 和 Session 事件。唯一
  `novel-project` 新增只读 `retrieve_novel_context`，让 Ask/Plan 能按 accepted revision
  读取已有 Canon、叙事结构和正文证据；它不修改 Canon、不注册 workflow，也不增加
  前端。全新隔离 stock-Web `standard` Agent 已真实产生一次原生 `tool/call` 和一次
  `tool/result`，从 R1 正文/Canon 证据完成回答，accepted revision 仍为 R1，且没有
  `tool-workflow/*` 或自定义 retrieval 事件。证据见
  [`docs/retrieve-novel-context-stock-agent-e2e-2026-08-28.md`](docs/retrieve-novel-context-stock-agent-e2e-2026-08-28.md)。
- N-004 的 Write 正常路径也只扩展唯一 `novel-project`：stock Agent 先调用
  `retrieve_novel_context`，再调用 `propose_novel_result_packet` 提交完整、无
  authorization 的 Result Packet；DSH 原生 `tool/call` / `tool/result` 保存提案，
  已有 `conversation.view` 面板自动打开同一审阅/Apply 流程。Apply 前 Canon 保持
  R1；作者决定 2/2 项并 Apply 后才铸造 author authorization、推进 R2，reload 后
  正文与 `sourceRevision=2` 完整恢复。证据见
  [`docs/write-result-packet-stock-agent-e2e-2026-08-28.md`](docs/write-result-packet-stock-agent-e2e-2026-08-28.md)。
- N-004 的 Plan 正常路径没有新增产品代码或前端：stock Agent 只调用一次
  `retrieve_novel_context`，在原生 `conversation.view` 给出 source revision、范围、
  两个备选、约束和停止条件；没有调用 `propose_novel_result_packet` 或 workflow，
  Plan 前、Plan 后和 reload 后 Canon 都保持 R1。14 个直接 RPC 与 62 个 Web API
  响应全部成功，console/page/request error 均为 0。证据见
  [`docs/plan-stock-agent-e2e-2026-08-28.md`](docs/plan-stock-agent-e2e-2026-08-28.md)。
- Plan 需要下一章控制上下文时，继续调用同一个 `retrieve_novel_context`，传入可选
  `chapterId` 即可从指定 accepted revision 即时重建 `controlPack`：目标 Chapter、
  根到 Chapter 的 accepted scope、scope 内 Canon、全部十个时钟桶及最多九篇前置
  accepted Chapter 正文都保留真实 source revision、anchors 和 provenance。R1→R2
  后重建与历史 R1 复现、既有真实 DSH Tool 调用及全新 rc.2 Profile load 均通过；
  没有新增 Tool、UI、缓存、Job 或事实源。证据见
  [`docs/chapter-control-pack-rc2-smoke-2026-08-28.md`](docs/chapter-control-pack-rc2-smoke-2026-08-28.md)。
- Accepted `NarrativeUnit` 的 Chapter 现在还可带可选 strict `chapterContract`：
  `viewpoint`、`storyTime`、`sceneFunctions`、active plot/relationship line ids、
  带 intended movement 的 `promisesTouched`、reader/character `informationPolicy`、
  progression setups/payoffs、`emotionalMovement`、`endingPull`、
  `prohibitedContradictions`、`styleConstraints`、正整数 `lengthRange` 和
  `acceptanceGates`。`lengthRange.max` 必须不小于 `min`，且非 Chapter unit 不能携带
  该字段；旧 unit 省略它时继续按原路径工作。现有 `chapterId` Tool/generated Remote
  保留 Chapter 的 source metadata，既有 `conversation.view` control-pack 面板直接显示
  contract；没有新增 Tool、store、页面或 package。该 contract 的 fresh stock-Web
  R1→R2 可见交互、historical/current Remote、`projectNarrative`、严格 `max < min`
  拒绝与 reload 已通过 [Chapter contract stock-Web E2E](docs/chapter-contract-stock-web-e2e-2026-09-02.md)：
  GREEN 18 RPC/67 Web、浏览器错误 0、Canon/storage 不变。`chapter-state/post-check`
  source join 也已在独立的 fresh stock-Web `chapterId` smoke 中通过：R1 contract、
  R2 manuscript/debt、R3 post-check 的 contract/manuscript/debt source resolution、
  historical/current isolation、generated Remote、`projectNarrative`、现有面板与 reload
  全部一致（23 RPC/63 Web、浏览器错误 0、Canon/storage 不变）。详见
  [Chapter post-check source-join E2E](docs/chapter-postcheck-source-join-stock-web-e2e-2026-09-02.md)。
- Accepted Canon 还保留 strict `chapter-state/post-check` set/remove 账本。set 值明确
  记录 contract revision/source Delta 与 `met|changed|missed` outcome、deviations、
  manuscript source revision、changes、costs、newly possible/impossible、reader now
  knows/suspects、character carry-forward 以及带 clock、transition 和 source Delta 的
  debt transitions；remove 使用 `null`。真实正常路径串起 R1 Chapter contract、R2
  accepted manuscript 与实际 Canon/clock/debt Delta、R3 post-check 及各自来源证据。
  同一个 `chapterId` control pack、`canonKind: "chapter-state"` 查询/generated Remote
  与既有 `conversation.view` 直接返回并显示该 accepted 账本。control pack 还会把账本
  中的 contract revision/Delta、manuscript revision 与每个 debt transition 精确解析到
  accepted 来源；debt 引用按 `resolved`、`missing`、`ambiguous` 保留声明顺序、重复项、
  Anchor ranges 与 provenance，rollback 复制的 Delta 和被放弃的未来 revision 不会伪造
  来源。为下一章构建 control pack 时，同一结构还会按层级顺序携带最近最多九章已有的
  post-check 及 changes、costs、reader knowledge、character carry-forward 与完整来源链。
  它不是 hypothesis，不从正文推断结果、不自动拒绝章节，也不新增 Tool、store 或事实源。
  独立 fresh stock-Web source-join smoke 已验证该 `chapterId` 分支的真实 contract、
  manuscript、debt transition 与 post-check 来源解析；RED 缺少 debt Delta 时在读取阶段
  以 `0 !== 1` 失败且 head/Canon/storage 不变，GREEN 端口 `64416` 停止后无监听。更广的
  Scene/Beat、lock/reference、进程/传输恢复、生产安装和用户验收仍未完成。
  Agent 使用同一个 `retrieve_novel_context` 传入 `writingMemoryQuery` 后，现有
  `conversation.view` 还会自动读取当前 Session 最近一个真正含写作记忆的成功结果，
  将当前 revision 的 strict style、serialization 与 reader authoring contracts，以及
  不依赖 query 的人物延续、最近 accepted post-check 的完整读者已知/怀疑与实际
  contract outcome、changes、costs、newly possible/impossible，双向关系延续
  状态与每个角色/读者的完整知识边界，以及 rolling roadmaps、narrative structure、正文摘录、
  设定事实、连续性 Canon/clock 和叙事债务六个 ranked bucket 可读呈现。路线图桶按当前意图返回最多三份 accepted plan，
  直接带回跨章 horizon、milestones、Chapter ranges、依赖与 scoped debts 的完整解析；
  若目标下一章尚未 accepted、因而没有 `chapterId` control pack，
  narrative structure 会按意图召回最多三条 accepted Book/Volume/Arc/Chapter 的 objective、
  entry/exit state、status 和可选 Chapter contract；已有 control pack 时该桶为空，不重复
  注入同一结构。三类契约不依赖 query 命中，保留 source revision/ranges 与 provenance
  而不伪造 score/terms；其中 style profile 的 `approvedExemplars` 与 reader contract 的
  delivery evidence 还会按各自声明的 accepted source revision、unit 和 Anchors 解析出
  实际正文片段、用途/兑现说明及来源。Plan、Write 和面板因此直接拿到作者批准的写作
  范例与契约兑现文本，不再只看到引用 id；serialization profile 没有正文引用时保持空集。
  六个 ranked buckets 均保留 query、freshness、score、matched terms 和完整来源。后续普通检索不会遮掉
  这份最近记忆结果。作者使用既有“审校重点”启动 Review 时，同一 focus 还会在同一
  accepted revision 上确定性构建这些契约与六桶记忆，并随 manuscript、Canon 和可选
  control pack 进入现有 stock reviewer prompt；reviewer 仍只返回未授权的 Result
  Packet/Diff，Canon/head 不变。现有 Agent System Prompt 与 retrieval Tool contract 也
  要求 Plan/Write 用当前规划或创作意图传 `writingMemoryQuery`；单章创作在同一次调用
  传 accepted `chapterId`；尚未 accepted 的下一章省略该参数，使用 requested revision
  中每个人物最新的 query-independent carry-forward，并无条件带回全部 accepted
  `character-state/arc-hypothesis`。每条角色弧保留 hypothesis、起始信念、目标转变、
  转变维度、压力、完整 decision chain、当前阶段、未解问题、revision、Anchor ranges 与
  provenance，并在既有写作记忆区域直接显示；历史 revision 不读取未来更新。传入
  `chapterId` 时，同一角色弧列表进入 Chapter control pack 并在其既有区域显示，顶层
  列表保持为空以避免重复。随后同一路径继续带回最近 accepted
  Chapter post-check 的完整 `readerNowKnows` / `readerNowSuspects`，以及同一 post-check
  的 `contractAssessment`、
  `changes`、`costs`、`newlyPossible` / `newlyImpossible`、完整 A↔B 双向关系现态、全部角色/读者的
  query-independent knowledge boundaries 和 ranked narrative units。每个 boundary 复用既有 accepted
  knowledge ledger，带回 known fact 的全部字段、source ranges、provenance 与 freshness。显式空
  `carries` 会清除旧状态；最新 post-check 的 reader 两个空数组也会作为明确清除保留，不回退旧章；
  outcome 的四组空数组同样保留最新来源，不回退旧章。没有 post-check 时这两个字段均为
  `null`。历史 revision 不会读到未来人物、角色弧、读者披露、Chapter outcome、关系或知识状态；
  已有 control pack 时顶层 reader disclosure 与 Chapter outcome 均为 `null`，其余四个列表为空，避免重复。两条路径都遵守 mandatory authoring contracts，并用 intent-ranked rolling
  roadmaps、其余五桶记忆和可选 control pack 起草后才提交原有 Result Packet。
  其中无 `chapterId` 的 stock-Agent Plan → Tool → Session Result → 既有 Novel Project
  面板路径先以三条 narrative units、刷新恢复和 Canon R1 完成
  [writing-memory stock-Web E2E](docs/writing-memory-stock-web-e2e-2026-08-31.md)。
  后续全新隔离 rc.2 Web Profile 还在 R1 放入全部三类 strict authoring contracts、
  character carry-forward、完整角色弧、reader disclosure 与 Chapter outcome；第一 Host
  停止后，第二 Host 的新 Session 再次真实调用同一 Tool，保留原接受 Session 的
  revision/Anchor/provenance，并在面板及 reload 后显示全部六个目标区域。两阶段分别有
  15/63 与 14/61 个 RPC/Web API 响应成功，浏览器错误为 0，Canon 始终为 R1；证据见
  [authoring-memory restart stock-Web E2E](docs/authoring-memory-restart-stock-web-e2e-2026-09-01.md)。
  三类契约、角色弧、reader disclosure、Chapter outcome 与 query-independent
  character carry-forward 的这些精确可见路径现为 `verified`；rolling-roadmap 与
  `chapterId` control-pack 分支仍按各自证据状态处理。Character carry-forward 的
  独立 fresh stock-Web 证据验证了无 `chapterId`、无关 query 仍返回最新人物延续状态，
  保留 Chapter/R1 post-check Delta、Anchor、range、provenance，并在 generated
  Remote、既有写作记忆/trajectory 面板及 reload 中一致呈现；RED 的空 carry-forward
  断言保持 R2。详见
  [character carry-forward stock-Web E2E](docs/writing-memory-character-carry-forward-stock-web-e2e-2026-09-02.md)。
  随后的全新隔离 rc.2 Web Profile 已补充 `chapterId: "chapter-control"` 的 stock-Agent
  retrieval 与现有面板 Build 路径：control pack 返回完整 Book→Chapter scope、R1
  2900–3100 Chapter contract，顶层 narrative-unit bucket 保持为空；13 个 RPC 与 59 个
  Web API 全部成功，浏览器错误为 0，Canon/storage 保持 R1，端口 `64152` 停止后无监听。
  缺少 `chapterId` 的受控 RED 在 `controlPack.chapter` 断言处失败。证据见
  [chapter control-pack stock-Web E2E](docs/chapter-control-pack-stock-web-e2e-2026-09-01.md)。
  另一个全新隔离 rc.2 Web Profile 已验证无 `chapterId` 的 relationship/knowledge
  分支：请求 historical R1（head R2）时，stock Agent 的一次 native
  `retrieve_novel_context` 调用返回完整双向 `alice<->bob` 关系和 `alice`、`reader-main`
  两个知识边界，R2 单向改写与 future-only subject 不泄漏；现有面板和 reload 后仍显示
  同一来源数据。GREEN 有 16 个 RPC 与 65 个 Web API 响应、浏览器错误为 0、Canon/storage
  未变，端口 `64212` 停止后无监听；受控 RED 在缺少 R1 关系事实时于
  `relationshipCarryForward.length` 断言失败。完整范围与临时证据见
  [relationship/knowledge stock-Web E2E](docs/writing-memory-relationship-knowledge-stock-web-e2e-2026-09-02.md)。
  这只提升关系延续与角色/读者知识边界的可见路径；进程/传输恢复、生产安装和用户验收
  仍未完成；reader disclosure 与 Chapter outcome 已由前述两 Host restart evidence 覆盖，
  character carry-forward 由独立的 no-`chapterId` 证据覆盖。
  随后的全新隔离 stock-Web smoke 又验证了同一无 `chapterId` 路径的 hydrated evidence：
  historical R1 的 style exemplar 与 reader-contract evidence 都解析为真实 accepted
  manuscript excerpt、purpose/demonstrates、Anchor range 和 provenance，R2 future evidence
  不泄漏；现有面板与 reload 均显示同一证据。该 GREEN 有 20 个 RPC 与 65 个 Web API 响应，
  浏览器错误为 0，Canon/storage 未变，端口 `61514` 停止后无监听；RED 在空 evidence 数组
  的 `readerContract.evidence.length` 断言处失败。详见
  [hydrated evidence stock-Web E2E](docs/writing-memory-hydrated-evidence-stock-web-e2e-2026-09-02.md)。
  随后的全新隔离 stock-Web smoke 又验证了无 `chapterId` 的 rolling-roadmap 分支：historical
  R1（head R2）返回一个带两项有序 Chapter 单元、依赖解析和开放剧情债务的 roadmap，R2
  future 路线不泄漏；现有 roadmap 面板行和 reload 均恢复。GREEN 有 19 个 RPC 与 66 个
  Web API 响应、浏览器错误为 0、Canon/storage 未变，端口 `64228` 停止后无监听；RED 在
  缺少 R1 roadmap 时于 `roadmaps.length` 断言失败。详见
  [rolling-roadmap stock-Web E2E](docs/writing-memory-roadmap-stock-web-e2e-2026-09-02.md)。
  随后的全新隔离 stock-Web smoke 验证了无 `chapterId` 的 query-independent 人物弧召回：
  请求带有与人物弧无关的 `writingMemoryQuery`，R2 返回完整 v2
  `characterArcHypotheses`，历史 R1 只返回空 decision chain 的 v1，换用另一组无关词仍
  得到相同弧列表；现有写作记忆/trajectory 面板与 reload 均恢复。GREEN 有 21 个 RPC 与
  67 个 Web API 响应、浏览器错误为 0、Canon/storage 未变，端口 `64324` 停止后无监听；
  RED 缺少 `persistentConsequence` 时保持 R2。详见
  [writing-memory character-arc stock-Web E2E](docs/writing-memory-character-arc-stock-web-e2e-2026-09-02.md)。
  这些路径都没有新增人工查询表单、强制 gate、写作服务或另一套前端。
  现有 anchored Review 对 accepted Chapter 也会把同 revision 的完整 control pack 交给
  reviewer，使 contract acceptance gates、十个 clocks/debts、显式引用和 post-check 参与
  审校；输出仍只是现有 Diff 与 anchored Issues，Canon/head 不变。
  同一 control pack 还会解析 Chapter contract 的显式引用：
  `activePlotLineIds` 在 Chapter→Arc→Volume→Book→Series scope 中选择最具体的 strict
  plot line 与完整 source-bearing clock entry；`activeRelationshipLineIds` 精确匹配稳定
  pair line 并返回完整双向关系。active line 在本章 ancestry∪Scene/Beat scope 的
  Relationship clock move 中引用的 `emotionEpisodeIds` 还会按 clock→move→声明顺序
  exact 解析 strict emotion episodes；只有 line id 与 directional target 都属于该关系线
  才纳入，重复保留，缺失明确列出，并显示 trigger、mixed emotions、residue 与完整来源。
  `promisesTouched` 精确匹配当前 accepted
  `promise/state` 并保留 intended movement、typed state 与 source fact。三类都按声明顺序
  返回 `resolved` 与 `missing`，无 contract 时为空，missing 不报错、不阻止 Accept，也
  不做近似 ID 推断。Tool/generated Remote、历史 revision 与既有 Control pack 区域复用
  同一路径；没有新 query、Tool、store 或页面。
  同一 control pack 还包含目标 Chapter 在请求 accepted revision 中的全部 Scene/Beat
  后代，沿现有 hierarchy 采用 Scene→其 Beats→下一 Scene 的 depth-first 顺序，不按
  自由文本 status 过滤。每项保留完整 NarrativeUnit 来源；scoped Canon 与十个 clock
  bucket 的 entries/debts 使用 root→Chapter ancestry 与这些 Scene/Beat ids 的并集。
  sibling Chapter、未来或 rollback 后被放弃的计划不会混入，现有 `conversation.view`
  直接显示 level/id/status、objective、entry→exit 与 revision/Delta/Anchor/provenance。
  作者当前设置的 Canon locks 也会进入同一 control pack。请求 revision 中存在
  kind/targetId/field/value 完全一致的 Canon fact 时返回 `resolved` lock 与完整来源；
  历史 revision 中 fact 缺失或 value 已不同时进入 `unavailableAtRevision`，不会伪造
  历史来源。Tool/generated Remote/reviewer 与现有面板共用这一投影，读取不改变锁、
  Canon 或 head，也没有新增锁页面或权限体系。
- N-004 的 Publish 正常路径同样没有新增前端：stock Agent 调用一次
  `publish_novel_manuscript`，原生审批卡先显示 R1、标题、目标和正文预览；文件在
  决策前不存在，用户选择 `Allow once` 后才写入。原生 Session 持久化
  `tool/call → approval/asked → approval/decided → tool/result → turn/end`，回执包含
  aggregate/source revision、标题、绝对目标、`create|update` 和字数。Publish 前后及
  隔离 Host 重启后 Canon 均保持 R1，文件和 manuscript projection 完整恢复；首轮
  16 个直接 RPC / 36 个 Web API 与重启复验 3 个直接 RPC / 38 个 Web API 均成功，
  console/page/request error 为 0。证据见
  [`docs/publish-stock-agent-e2e-2026-08-28.md`](docs/publish-stock-agent-e2e-2026-08-28.md)。
- N-004 的首个有界自动化切片仍只使用唯一 `novel-project` 和 DSH 原生界面：
  `authorize_novel_automation` 把 accepted revision、单个正文单元、Write-only、一个
  Result Packet、作者指定的 accepted Canon locks 和四个固定停止规则完整交给 stock
  `allowed-once` 审批。批准前不写策略；批准后只在当前 Session 追加可回放的
  `novel/automation-policy` 快照。匹配提案消耗唯一预算并调用 DSH `concludeTurn()`，
  Canon 仍不变，Accept 与 Publish 仍需各自既有决策。真实 Session seed/replay focused
  integration 和全新隔离 stock-Web 的可见 `Allow once` → 单次 proposal → completed
  turn 均已通过；11 个直接 RPC、36 个 Web API 全部成功，console/page/request error
  为 0，因此该单 revision/单 unit/单 Result Packet 切片记为 `verified`。证据见
  [`docs/bounded-automation-stock-agent-e2e-2026-08-28.md`](docs/bounded-automation-stock-agent-e2e-2026-08-28.md)。
  同一个授权入口现在还支持有序多单元 Write：用 `unitIds`（保留单元 `unitId` 简写）
  指定一个或多个正文单元，并用 `maxResultPackets` 限制本次运行的 Result Packet
  数量；每个作用域单元最多提交一个 proposal。多个 proposal 留在同一个 DSH
  Session/turn 中，活动与停止的 `novel/automation-policy` 快照按顺序回放
  `completedUnitIds`；达到 scope 或 packet 上限时调用同一个原生 `concludeTurn()`。
  focused rc.2 integration 已覆盖 `chapter-a`、`chapter-b` 在 R2 下各提交一次，
  `maxResultPackets=2`，最终 `completedUnitIds` 为两个单元且 accepted Canon 仍为 R2；
  fresh stock-Web 可见的多单元审批/同一 turn 完成 smoke 尚未验证，因此这部分为
  `implemented-unverified`。
  同一审批现在还要求作者给出正整数 `maxTokens`。插件在批准时记录 DSH 原生
  `tokenUsage` 四个互斥 provider-reported 桶的累计基线，在提案前计算本次 run 的
  实际用量；只有 `usedTokens > maxTokens` 才停止并追加
  `budget-exhausted` 快照。全新 stock-Web 真实运行显示 20 Token 审批范围、28 Token
  授权基线、下一步再用 28 Token 后拒绝提案、零 Result Packet、completed turn 和
  Canon R1 不变；13 个直接 RPC 与 36 个 Web API 全部成功，console/page/request
  error 为 0。证据见
  [`docs/token-budget-stock-agent-e2e-2026-08-28.md`](docs/token-budget-stock-agent-e2e-2026-08-28.md)。
  多单元 Write 还要求正整数 `maxTokensPerUnit`：每个成功 proposal 后的 active
  policy 快照记录本次 run 的累计 `usedTokens`，下一个单元只用当前累计值减去该快照
  值计算本单元用量。focused rc.2 integration 已验证前两章分别使用 18 Token 均成功，
  第三章使用 21 Token 超过每章 20 的上限后停止；前两章记录保留、第三章不产生
  Result Packet，Canon 不变。它复用同一审批、SessionEvent 和 DSH tokenUsage，
  没有新计数器、服务、UI 或存储；fresh stock-Web 可见审批仍未验证。
  同一授权 Tool 现在还要求正整数 `maxWallTimeMs`。插件直接以批准后写入的 DSH
  `novel/automation-policy` 首个同 run SessionEvent 时间戳为总运行起点，在每次提案前计算
  `elapsedMs`；只有 `elapsedMs > maxWallTimeMs` 才写入 `budget-exhausted` 并拒绝
  提案。真实 rc.2 Session/Tool 集成已经验证事件 seed/replay 后 100ms 预算在
  101ms 时停止、零 Result Packet 且 Canon 保持 R1。该切片没有计时服务、调度器、
  UI、adapter、Profile 或 Bundle；fresh stock-Web 可见审批仍未验证。
  多单元 Write 还要求正整数 `maxWallTimeMsPerUnit`。每个单元以最新 active policy
  SessionEvent 的 `time` 为起点，而总预算始终以同一 run 的首事件为起点。focused
  rc.2 integration 已验证 50ms、55ms 的前两章分别通过，第三章 61ms 超过每章 60ms
  后停止；另一个事件时序回归证明快照累计 50ms、事件写入于 60ms 时，120ms 的下一次
  proposal 正确按 60ms 计算。停止快照保留全 run 累计 166ms 和前两章完成记录，Canon
  不变。
  同一授权现在还接受非负整数 `maxRetries`，只统计授权事件之后真正开始的
  DSH `llm/retry-started` 事件，不把只排队的 `llm/retry` 算入使用量；超过预算时
  在提案前追加 `budget-exhausted` 快照并拒绝提案。真实 rc.2 Session seed/replay
  focused integration 已覆盖“启动 2 次、预算 1 次”拒绝以及“启动 1 次、预算 1 次”
  允许的边界；fresh stock-Web 重试可见审批仍未验证，因此状态为
  `implemented-unverified`。多单元授权还要求非负整数 `maxRetriesPerUnit`，用当前
  run 的累计启动次数减去最新 active snapshot 的累计值计算本单元重试。focused
  integration 已验证第一章 1 次重试后成功，第二章 2 次超过每章 1 次的上限后在
  proposal 前停止；停止快照保留累计 3 次重试和第一章完成记录。同一授权还要求正数
  `maxCostUsd` / `maxCostUsdPerUnit` 与作者明确给出的四类 Token 每百万美元费率；Host
  只对 DSH provider-reported uncached input、output、cache read、cache write 用量计价。
  focused rc.2 integration 已覆盖总费用 $0.000046 超过 $0.000045 时在提案前停止，
  以及每章 $0.000018、$0.000018 通过而第三章 $0.000021 超过 $0.00002 时停止；
  Canon 保持不变。费用与 per-unit wall-time/retry 的 fresh stock-Web 可见审批仍未验证。
  永久项目 Canon Lock 现在通过 `manage_novel_canon_lock` 直接复用 stock DSH
  `allowed-once` 审批：锁定时从当前 accepted revision 读取精确 Canon 值并持久化到唯一
  Novel Project 记录；普通 Result Packet Apply 和 rollback 都在同一个原子事务里拒绝冲突。
  focused real rc.2 Tool/Remote/storage 集成覆盖 R2 锁定、两条事务拒绝、服务重载后继续
  拒绝、显式解锁以及原提案成功进入 R3；96 个包测试通过。该能力没有新前端、TUI
  extension、sidebar tab、adapter、Profile 或 Bundle，fresh stock-Web 可见审批仍未验证，
  因此状态为 `implemented-unverified`。
- N-005 的 story-world 与 reader-response 首切片都只存在于唯一
  `novel-project`。`simulate_novel_story_world` 把显式授权的角色事实交给 stock DSH
  `spawn` child；`simulate_novel_reader_response` 只交付指定 accepted revision 的
  呈现正文或一个显式未接受候选、受众 Persona 和显式阅读历史。候选路径返回
  `candidateId`、`presentedTextSource` 与 SHA-256 `presentedTextHash`；在 R0 尚无任何
  accepted manuscript 时也可直接实验开篇候选，不必先写入占位正文。请求 revision
  仍作为实验基线。两个 child 都以 `outputSchema` 返回
  proposal-only 强类型结果，以 `toolFilter: { allow: [] }` 隔离普通工具，并在完成后
  释放；隐藏 Canon 和父对话不会进入 child，Synthetic reader 明示
  `marketRepresentative: false`。每条 reader reaction 的 `evidence` 必须真实出现在本次
  呈现正文中，否则整个模拟结果会被拒绝；Canon 不变。两个 Tool 还接受可选
  `seed`，并从规范化的 sandbox、冻结输入和输出 trace/reactions 计算稳定 SHA-256 `replayKey`；
  这是等价数据的重放身份，不声称模型语义确定性。真实测试使用精确 rc.2 的 Agent Loop、
  Subagent Runtime、in-process driver 和 spawn provider，scripted adapter 只是模型
  边界；没有新增 UI、TUI extension、Profile、Bundle、Workflow、Job、store 或
  queue。已接受正文的 rc.2 真实 child 证据见
  [`story-world`](docs/story-world-simulation-rc2-smoke-2026-08-28.md) 与
  [`reader-response`](docs/reader-response-simulation-rc2-smoke-2026-08-28.md)。
  2026-09-02 的 fresh isolated stock-Web run 又验证了现有
  `conversation.view` 中的单次 story-world 结果：stock Agent 发出一次 native
  Tool 调用，面板显示 R1、actor、action、Before/After/Final state、provenance，
  reload 后 replay identity 仍在，18 个 RPC 与 63 个 Web API 响应成功且浏览器错误为
  0，Canon/storage hash 不变。详见
  [`story-world stock-Web evidence`](docs/story-world-simulation-stock-web-e2e-2026-09-02.md)。
  这只提升单次 story-world 可见 action/UI plumbing；reader-response 比较/聚合实验、
  child 隔离细节、生产安装和用户验收仍未验证。
  同一日期的另一个 fresh isolated stock-Web run 也验证了现有
  `conversation.view` 中的单次 accepted-text reader-response 结果：stock Agent
  发出一次 native Tool 调用，面板显示 Persona、呈现正文及 hash、阅读历史、reaction
  evidence、synthetic-only 标签和 provenance，reload 后 replay identity 仍在，18 个
  RPC 与 63 个 Web API 响应成功且浏览器错误为 0，Canon/storage hash 不变。详见
  [`reader-response stock-Web evidence`](docs/reader-response-simulation-stock-web-e2e-2026-09-02.md)。
  这只提升单次可见 reader-response action/UI plumbing；child 隔离细节、多 seed、候选/Persona/
  variant 比较、生产安装和用户验收仍未验证。
  story-world 现还会把角色资源和显式可见 Canon fact 投影为类型化的冻结初始状态；
  action 用相同的 resource/fact path 声明精确前置条件和 `set` / `remove` 效果。
  现有 Tool 的正整数 `maxActions`（默认 1）限制同一 child 的有序轨迹；Host 让后一步
  读取前一步的 after state，并返回全部 before/after/final state。前置条件不成立或
  输出超过上限时不返回伪造的成功状态，所有变化都只在反事实副本内，Canon 不变。
  相同初始状态与 trace 得到相同状态投影，但这仍不声称 LLM 生成本身确定。
  同一 story-world Tool 还可接受至少两个 `seeds`，按输入顺序在同一 frozen revision 和
  角色知识视图上启动独立 child。每个 run 保留自己的 `runId`、`seed` 和 `replayKey`，
  实验按固定十二类动作输出 `count`、`total`、`ratio`，并保持 Canon 不变；该路径目前为
  本地 `implemented-unverified`。
  同一 Tool 还可接受至少两个显式 `branches`。每个分支提供自己的 id、hypothesis 和
  assumptions，并从同一 frozen revision、角色初始状态、story time 与共享 seed 顺序启动
  独立 child；共同 assumptions 会追加到各分支 assumptions。返回值保留输入顺序下的每个
  独立 run，并按稳定 path 顺序列出各分支 final state 的 present/value 差异，Canon 仍不变。
  该显式分支比较路径目前为本地 `implemented-unverified`。
  `branches` 现在也可与至少两个 `seeds` 组合，按 branch-major / seed-minor 顺序运行。
  每个分支保留完整多 seed experiment 与固定十二类动作比例；跨所有 branch/seed 单元的
  final-state path matrix 保留 exact present/value，不评分、不选择赢家且不推进 Canon。
  该路径目前为本地 `implemented-unverified`。
  同一 Tool 还可用至少两个 `actors` 比较隔离角色视角，并与单一 `actor` 输入二选一。
  Host 按角色输入顺序复用现有单角色模拟路径；每个 child 只收到自己的 id、goal、resources
  和显式可见 Canon facts，不会收到其他角色的知识或状态。结果按原顺序保留每个 actor
  及其完整 run/replay/final state，可共享一个 caller seed，但不评分、不传播角色间信息且不推进
  Canon。该路径目前为本地 `implemented-unverified`。
  同一 reader Tool 还可接受至少两个 `seeds`，按输入顺序复用上述单次路径启动相互独立的
  child。每个 run 保留自己的 `runId`、`seed` 和 `replayKey`，实验返回共享的呈现文本
  哈希，并按固定六维输出 `count`、`total`、`ratio`；同一 run 内重复维度只计一次。
  该多 seed 路径仍标记 `marketRepresentative: false` 且不推进 Canon，目前为本地
  `implemented-unverified`。
  现有 reader Tool 还可接受至少两个未接受 `candidates` 和至少两个共享 `seeds`，按
  candidate-major / seed-minor 顺序复用同一 Persona、阅读历史、revision 与问题运行独立
  child。每个 child 只接收自己的候选文本；结果保留每个候选的文本 hash、完整多 seed
  experiment，并按固定六维输出候选间的 count/total/ratio。它不排名、不自动改稿，
  `marketRepresentative` 仍为 false，Canon 不变；该路径目前为本地
  `implemented-unverified`。
  同一 Tool 也可用至少两个 `personas` 和至少两个共享 `seeds`，在同一冻结正文或单个
  候选、同一阅读历史与问题上按 Persona-major / seed-minor 顺序运行。每个 child 只收到
  自己的 Persona；结果保留每个 Persona 的完整 experiment，并按固定六维输出群体间的
  count/total/ratio。它不把任何 Persona 当成市场代表，也不排名或修改正文，Canon 不变；
  该路径目前为本地 `implemented-unverified`。
  `candidates` 与 `personas` 现在也可在同一请求中组合：Tool 按
  candidate-major / Persona-major / seed-minor 顺序运行每个隔离实验单元，每个 child
  只看到自己的候选文本和 Persona。结果保留候选文本 hash、Persona、每个完整 experiment
  及固定六维矩阵，不选择赢家、不自动改稿，`marketRepresentative` 保持 false，R0 Canon
  不变；不存在的 accepted-revision 基线会在任何 child 启动前拒绝。该路径目前为本地
  `implemented-unverified`。
  对需要直接核对当前版本的实验，同一 Tool 还接受至少两个有序 `variants`：`accepted`
  变体从冻结 revision 读取正文，`candidate` 变体携带未接受文本。它们共享一个 Persona、
  阅读历史和可选 seed，各自启动隔离 child；结果保留 source/hash/完整 run，并按固定六维
  输出 0/1 比较，不排名、不改稿且不推进 Canon。该路径目前为本地
  `implemented-unverified`。
  对已取得同意且带来源的真实读者反馈，同一 Tool 现在可在 accepted-text 多 seed
  experiment 完成后做确定性校准投影。反馈保留 platform、time、cohort、exact text hash、
  uncertainty 和 author decision，绝不进入 synthetic child。只有 comprehension、
  expectation、emotion 的定量项分别映射到 confusion、expectation、emotion，并返回
  synthetic/observed ratio 与差值；定性项标记 `insufficient-data`，preference、
  coordinated-noise、continuity 保持 `unmapped`。结果不打分、不自动改稿、不推进 Canon，
  目前为本地 `implemented-unverified`。
- 开书阶段现在继续复用同一个 `propose_novel_result_packet` 和现有
   `conversation.view` 审阅面板：Agent 可以提交不含正文/Diff、只含
   `creative-profile` / `reader-contract` Delta 的 Canon-only 项目简报；作者逐项决定并
  Apply 后形成 R1，但 manuscript projection 仍为空。Canon 字段支持字符串、数值、
  布尔值、空值、数组和嵌套对象，因此题材组合、受众画像、承诺与排除项可以保持
  结构化数据；现有面板以稳定紧凑 JSON 显示结构值。后续正常 Write 形成 R2 时该项目
  状态继续存在；有界自动 Write 仍必须带正文。当前 Host/Client RED→GREEN 已通过，
   真实 stock DSH Tool → generated Remote 的同一路径也已通过；fresh stock-Web 可见立项
   仍为 `implemented-unverified`。没有新增立项表单、Tool、包、
   Profile、adapter、Sidebar tab 或 TUI extension。
   其中仅 `creative-profile` / `field: "style-profile"` 被保留为 strict、versioned
   作者声音契约：它记录 profile 名称、voice principles、视角人称/距离/规则、句法节奏、
   对话与人物区分、感官优先级、潜台词与说明规则、禁用习惯、带 source revision 和
   Anchor 的作者认可范例，以及允许变化但必须保留不变量的 adaptation boundaries。
   其他 `creative-profile` 字段仍保持 generic。现有 retrieval Tool/generated Remote
   已返回 historical R1 与 current R2 的完整 profile、source ranges 和 provenance，
   既有 Canon 区域使用专用可读排版显示全部规则、范例和修订理由；查询保持 Canon
   不变。fresh stock-Web 尚未执行，因此该扩展仍是 `implemented-unverified`，且没有
   新增表单、Tool、store、页面或 package。
   同样，仅 `reader-contract` / `field: "contract-profile"` 被保留为 strict、versioned
   读者契约；其他 Reader Contract 字段仍保持 generic。该值记录独特情境、核心戏剧
   问题、读者幻想、约束和语调范围组成的 premise，以及 `coreExperience`、具名
   promises、exclusions、目标读者及其 expectations、带 source unit/revision/Anchors 的
   delivery evidence 和修订理由。现有 retrieval Tool/generated Remote 返回 historical
   R1 与 current R2 的完整契约、source ranges 和 provenance，且查询不改 Canon；缺少
   `evidence.demonstrates` 的 R3 被拒绝并保持 R2。既有 Canon 区域使用专用可读排版显示
   premise、承诺、排除项、受众、兑现证据和理由，没有新增表单、Tool、store、页面或
   package。fresh stock-Web 尚未执行，因此状态为 `implemented-unverified`。
  - 当前五个插件的本地门禁为 5 个测试文件、`275/275`（2026-09-15 实测；`266/266`
    是 [I/O 迁移](docs/writing-io-migration-2026-09-09.md) 当时的记录）。typecheck、lint、build 于
    2026-09-15 重跑通过；Writing 预算授权/记账与 required 日志冷恢复见
    [automation 记录](docs/writing-automation-migration-2026-09-15.md)，Core/Planning 边界与
    Delta kind 注册机制见 [M2 记录](docs/canon-boundary-m2-2026-09-15.md)。
    五个包已分别打包并在全新官方 Host Profile 安装、加载、冷恢复。
    当前验证包含角色、原生依赖、Planning 投影与校验归属；生产安装、用户验收、GUI 复验和未运行的
    社区插件 smoke 不作推断。
- 不启动默认 Desktop，也不修改用户全局 `.dsh`；兼容性验证使用全新临时
  `DSH_HOME` / Profile。

## 开发命令

```powershell
corepack pnpm install
corepack pnpm test:focused
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```

详细状态见 [最终实施计划](tasks/plan-final.md)、[任务清单](tasks/todo.md) 和
[parity matrix](docs/claude-desktop-parity-matrix.md)。来源、许可证和精确版本见
[upstream ledger](docs/upstream-sources.md) 与
[THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md)。
