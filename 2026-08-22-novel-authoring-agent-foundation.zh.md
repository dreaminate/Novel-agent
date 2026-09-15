# Agent Note: 基于七项参考的小说创作 Agent 底座

Status: proposed

[English](2026-08-22-novel-authoring-agent-foundation.md) | 中文

## 问题

DeepSeek Harness 计划成为中文网文小说创作 Agent 的运行时底座，并提供一等公民的终端 UI，以及交互质量接近 Codex Desktop 和 Claude Code 桌面联动体验的桌面应用。设计需要同时评估 DeepSeek Harness、Claude Code、Pi、OpenFic、OpenNovel 和 MiroFish 六个本地项目，并把腾讯 WorkBuddy 作为基于官方文档的产品参考。

七项参考存在能力重叠，但不是七套可互换的实现。DeepSeek Harness 的可组合运行时和策略模型最强，却没有随仓库交付 TUI 或原生桌面壳。Pi 有成熟的终端渲染器和 coding-agent 交互模型，但缺少 Harness 的权限与多 Agent 控制面。OpenFic 是完成度最高的小说创作产品和桌面端参考，却带来另一套 Python、LangGraph、React 和 Electron 运行时。OpenNovel 的结构化叙事概念最强，但目前仍是存在实质实现缺陷的 Alpha CLI。MiroFish 是社交仿真与报告流水线，不是作者共同创作 Agent。本地 Claude Code 仓库公开了产品行为、插件协议和示例，而非产品内核，其代码也没有开源许可。WorkBuddy 提供任务优先的桌面产品模型，但本次没有可审阅的本地源码快照，也没有可据以复用实现的依据。

因此，可行设计必须只有一个运行时所有者、一个权威小说状态、一个共享客户端协议、两套相互隔离且非 Canon 的沙盘，并明确规定复用边界。把所有可见的 Agent loop、Session 格式、模型注册表、图和存储同时拼接起来，只会形成重复权威，而不会形成更强的产品。独立的[长篇创作特点基准](2026-08-22-long-form-web-novel-creation-characteristics.zh.md)定义本文采用的叙事义务；本文评估的是系统与架构，不是在设计某一本具体小说。

## 审阅范围与证据边界

本文描述 2026-08-22 可见的六个本地快照，以及同日检索的 WorkBuddy 官方产品文档。审阅结合入口文档、清单文件、重点实现、面向关系的代码图，以及能说明成熟度的测试，并在产品声明和实际调用点之间做了交叉核对。生成的代码图只索引代码并保存在所有仓库之外，因此纯文档声明另行核验。审阅期间没有修改任何被审阅产品源码。

| 项目 | 审阅快照 | 来源与许可 | 证据边界 |
|---|---|---|---|
| DeepSeek Harness | `xiaoshuo@528c682e0616`，包版本 `0.1.1-rc.1` | Git checkout，MIT | 当前源码、架构、包文档和已交付 profile |
| Claude Code | `main@8a8e81d098cb`，CHANGELOG 顶部版本 `2.1.238` | Git checkout，Anthropic 版权与 Commercial Terms | 公共分发仓库、CHANGELOG、插件示例、settings 和 gateway 样例；不含核心 TUI、loop、session 或 Desktop 源码 |
| Pi | `main@5cd93f688aaa`，monorepo 包版本 `0.0.3` | Git checkout，MIT | 成熟 coding-agent 路径，以及与其分离且尚未完成的 AgentHarness v2 路径 |
| OpenFic | 本地包版本 `0.10.1` | 本地无 Git 元数据，Apache-2.0 | 解包源码快照中的后端、前端、Electron 壳、prompt、存储、检索和测试 |
| OpenNovel | 本地包版本 `2.0.0`，标记为 Alpha | 本地无 Git 元数据，MIT | 解包源码快照中的 Python 包、CLI、MCP server、schema、存储、工作流、测试和设计文档 |
| MiroFish | `local/graphiti-memory@117ed37758cdc96f73b7d5e0d22713c50439695f`，dirty worktree | Git checkout，AGPL-3.0 | 当前社交仿真流水线、Web 工作流、测试与未提交的本地 Graphiti-memory 实验；没有作者创作事务、TUI 或宽松许可的可复用 runtime |
| 腾讯 WorkBuddy | 2026-08-22 检索的官方产品文档 | 无本地源码快照；实现许可与复用许可未确定 | 仅包括产品行为、任务 UX、权限、自动化、协作、记忆、模型和扩展文档 |

本文有意区分能力状态：**已交付**表示审阅快照中存在用户可达的实现；**实验性**表示已有代码但缺少稳定或完整的产品路径；**行为参考**表示公开材料记录了产品行为但未公开实现；**规划中**表示文档描述的是未来能力；**有缺陷**表示具体源码调用路径与所宣称行为矛盾或会令其失效。

能力账本用紧凑证据标签——`[S]` 已交付、`[X]` 实验性、`[B]` 行为参考、`[P]` 规划中、`[D]` 有缺陷、`[—]` 缺失——并与目标动作分开：**Adopt** 复用受维护实现，**Adapt** 把已验证概念重写到 Harness 上，**Integrate** 通过受限 Provider 调用可选外部产品，**Reject** 排除该路径，**Build** 实现目标中缺失的能力。“公共资产”“prompt 方法论”“prototype schema”“coarse schema”“谨慎”或“通过 clean-room 重写”等限定语只描述证据或动作，不会产生新标签。证据成熟度和小说用途绝不压成一个分数。

## 结论摘要

建议产品不是任何一套小说应用的 fork，而是由 DeepSeek Harness profile 与插件族组成，配套权威 Novel Project 服务、Pi TUI 客户端、扩展后的 Harness Web 客户端、后续 Electron carrier 与可选 Simulation Lab。OpenFic 与 OpenNovel 提供小说产品、创作方法、schema 和反面事务需求，Claude Code 与 Pi 提供交互模式，WorkBuddy 提供任务优先的桌面组织、渐进自治、以产物为中心的 Results 和协作参考，MiroFish 只提供仿真生命周期与合成读者概念。DeepSeek Harness 始终是模型执行、Session 历史、工具、权限、审批、子 Agent、工作流、凭据和客户端传输的唯一所有者。

核心不变量是：**对话历史不是小说 Canon**。Harness Session 记录模型可见输入、工具提案、用户决定和执行结果；独立的 Novel Project 服务负责已接受的正文修订、结构化事实、故事时间和双向关系/情绪状态。摘要、图视图、搜索索引、Embedding、上下文包、仿真事件和合成读者反应都是可重建或反事实 artifact。任何压缩摘要、向量匹配、图抽取或仿真结果都不得静默成为权威故事状态。

作者主导共同创作是默认模式：作者无需从 transcript 反推决定，就能 steering、branch、锁定事实、选择备选、拒绝强类型变更、接受 revision 和 rollback。可选全自动只是同一 Harness workflow 中预授权的子集，具有固定范围、预算、停止规则、审阅 gate 与接受 policy；它不是第二套 loop，也绝不隐含发布权。两个客户端使用相同的领域命令、Results 和运行时事件。TUI 与桌面应用可以采用不同呈现方式，但都不得实现第二套工作流引擎或小说存储。

## DeepSeek Harness 能力摘要

### 能力结论

DeepSeek Harness 是目标系统的执行与治理主干，不是小说应用。它最强的资产是[插件组合运行时](../deepseek-harness/docs/architecture.zh.md)：模型请求、工具、持久交互历史、权限、审批、Subagent、工作流、Job、凭据、设置和客户端传输只有一个所有者。它的决定性缺口同样清楚：没有已接受小说状态模型、章节事务、长篇检索策略、仓库内 TUI 或原生桌面壳。

### 能力树

```text
DeepSeek Harness
|- Runtime: Agent Loop + LLM + Prompt + Tools
|- Record: Session Event Log + Persistence + Projections
|- Control: Permissions + Approvals + Questions + Credentials
|- Orchestration: Subagents + Workflows + Jobs + Schedules
|- Composition: Cordis Plugins + Profiles + Effects
`- Clients: Host/API + Web/PWA + SDKs
```

除[明确标记为实验性的 Agent Teams](../deepseek-harness/docs/subsystems/agent-team.zh.md)外，这棵树表示已交付能力族。Subagent 和工作流是已审阅 release family 中的已交付能力；不能只因希望得到团队式 UX，就让未来小说产品依赖私有实验性团队内部实现。

### 真实控制与数据流

```text
TUI/Web input
  -> Agent inbox
  -> prompt sections + tool schemas
  -> Session-derived model history
  -> LLM stream
  -> tool call
  -> pre-execute policy
  -> provider execute
  -> post-execute
  -> Session events + projections
  -> TUI/Web render
```

[架构约定](../deepseek-harness/docs/architecture.zh.md)要求每项模型可见输入都能从 Session 事件重建。检查点策略会在派生模型请求前持久化缓冲事件，也会在进入顶层工具 Body 前持久化工具调用，因此崩溃恢复可以区分“结果未知的工具”和“从未派发的动作”。客户端展示保持为派生数据：[Web 客户端规则](../deepseek-harness/packages/client/AGENTS.md)不让纯渲染数据进入日志，同时要求新的模型可见输入成为事件。这为“哪个控制包、用户决定和工具提案影响了草稿”提供强审计链，但不能证明任何抽取到的故事事实为真。

### 能力账本

| 能力 | 证据与成熟度 | 长篇网文价值 | 目标动作 |
|---|---|---|---|
| Cordis 插件、Profile 与可撤销 Effect | `[S]` 架构和已交付 Bundle | 挂载小说存储、检索、审阅、导入导出、TUI 和客户端展示，而不特化核心 Loop | **Adopt** |
| Agent loop、提示词 Section、类型化工具与生命周期事件 | `[S]` 核心运行时 | 让 Ask、Plan、Write、审阅和提交 Consumer 通过同一可审计执行路径运行 | **Adopt** |
| Session 日志、JSONL/SQLite 持久化、投影、查询与压缩 | `[S]` 持久交互记录 | 重建模型可见上下文、决定、工具活动和协作分支；绝不替代 Canon | **Adopt** |
| 交互、权限、审批、问题、凭据与设置能力 | `[S]` [交互能力族](../deepseek-harness/packages/interaction/README.zh.md)及 Provider | 执行作者主导审批、任务范围、Provider 披露，以及独立 Canon/发布权限 | **Adopt** |
| Subagent Provider、可继续子级、工作流、后台 Job 与定时任务 | `[S]`；Agent Teams `[X]`；Worker Thread 不是安全边界 | 协调受限研究、规划、审稿、连续性和导出任务，同时保留一个父级策略面 | **Adopt** 已交付 Seam；**Reject** 对实验团队内部实现的依赖 |
| LLM、文件系统、Shell、Subprocess、Web、Skill、附件、Workspace、Hook 与 SDK 能力族 | `[S]` 可独立替换的 Provider 与 Consumer | 选择模型、访问项目内证据、公开 Skill，并在不引入第二通用运行时的情况下连接 TUI/Desktop | 选择性 **Adopt** |
| Host、React/Vite/PWA 客户端及插件 Slot | `[S]` Web/headless 产品路径 | 提供面向桌面的共享协议、任务视图、工具活动、Subagent、审批、设置和领域 UI Slot | **Adopt** 并扩展 |
| 小说层级、十个时钟、类型化人物/关系状态、故事时间、承诺、Canon 事务、长篇检索、TUI、Electron | `[—]`；TUI 在仓库外，Electron `[P]` | 这些是创作特点基准定义的领域与主客户端要求 | 作为完整小说能力 Seam 和客户端 Bundle **Build** |

### 长篇网文映射

Harness 直接帮助基准中的作者权威、受限自动化、来源、多角色协调和共享客户端要求。权限与审批可以区分 Ask、Plan、Write、Accept 和 Publish。Session 与检查点可以证明模型看见了什么，以及一次执行结果是否已知。Subagent 与工作流可以在显式预算和父级权限下，承载大纲规划、关系审阅、连续性管理或故事世界仿真。Host、SDK 和 Web 客户端提供一套交付物协议，不必让 TUI 和桌面渲染器各自发明工作流。

Harness 不解决基准中的语义时钟。Session 消息提到悲伤不会自动生成情绪残留；Plan 条目提到重逢不会生成双向关系转变；通用 Job 不会隔离人物知识；Session 全文检索不会执行故事时间或修订新鲜度。Book、Volume、Arc、Chapter、Scene、成长证据、承诺、读者知识、谜团、关系债和结局汇流，需要独立的类型化 Novel Project 服务。故事世界与读者反应仿真也需要两个领域专用沙箱，即便 Harness 提供其执行和权限。

已交付客户端也未达到目标体验。当前 Profile 是 Web 和 headless；文档中的 TUI 示例需要安装仓库外 Bundle；GUI 分层决策把 Electron 描述为后续 Carrier，而不是现有代码。因此，Harness 证明了可复用控制与展示协议，并未证明成熟的中文小说 TUI 或 Codex/Claude 式桌面产品。

### 复用边界与目标职责

DeepSeek Harness 是 MIT 许可的本地源码，也是唯一被整体采纳为运行时底座的参考。复用其公开能力 Seam，并保持所有新行为通过插件到达。不要把小说语义塞进 `agent-loop`，不要让 Session 或自动记忆成为 Canon，不要把工作流 Worker 当作沙箱，不要依赖实验性 Agent Teams，也不要把计划中的客户端计作已交付。

**目标职责：** DeepSeek Harness 独占执行、策略、审计、Provider 路由、编排、传输和扩展组合；Novel Project 服务独占已接受正文与 Canon。

## Claude Code 能力摘要

### 能力结论

Claude Code 是本次审阅中最强的终端交互与分阶段 Agent 工作流标杆，但它的内核不透明。本地 checkout 只有 229 个 tracked file，公开的是分发材料、CHANGELOG、插件示例、settings/MDM 示例和云 Gateway 样例；其中没有 TUI、Loop、Session Engine、Desktop Bridge 或 Remote Control 对应的常规 `src/`、应用 Package、构建清单或测试套件。因此，产品行为与公开插件资产必须保持为两类证据。

### 可观察能力树

```text
Claude Code (opaque core)
|- Terminal UX: input + stream + diff + status
|- Session UX: resume + fork + rewind + compact
|- Orchestration: agents + teams + tasks + worktrees
|- Extension Plane: commands + agents + skills + hooks + MCP
|- Control: permissions + managed settings + Bash sandbox
`- Reach: terminal + IDE + Desktop + remote clients
```

CHANGELOG 可以作为可信的行为证据，证明全屏和传统渲染、多行输入、图片、Markdown、语法高亮、Diff、上下文与任务状态、后台 Agent 视图、Attach/Detach、Fork、Resume、Rewind、局部压缩、Goal、跨 Session 消息、CJK/RTL/宽字符处理、无障碍、窄终端、鼠标、Windows 和 PowerShell；但它不是实现证据。CHANGELOG 对超长恢复、Fork Chain、Unicode、后台恢复、Worktree、Remote Control 和 Windows 的反复修复，既说明产品广度，也说明把这些行为变成验收标准时的工程风险。

### 公开扩展控制流

```text
startup
  -> scan plugin manifest
  -> register commands / agents / skills / hooks / MCP

task
  -> command or agent
  -> tool proposal
  -> PreToolUse hook
  -> opaque execution
  -> PostToolUse hook
  -> Stop hook / result
```

这是该 checkout 所能支持的最深实现流程。`plugins/plugin-dev/.../component-patterns.md` 记录启动时发现和激活 Command、Agent、Skill、Hook 与 MCP；`plugins/feature-dev/commands/feature-dev.md` 实现一套可见阶段方法——发现、并行探索、澄清、候选架构、明确批准、实现、独立复核和总结；`plugins/code-review/commands/code-review.md` 先产生独立结论，再做单独验证；`ralph-wiggum` 展示 Stop-hook 迭代守卫；`hookify` 展示可编辑事件策略。无法从本仓库继续展开标为“opaque execution”的方框，否则就是臆造事实。

### 能力账本

| 能力 | 证据与成熟度 | 长篇网文价值 | 目标动作 |
|---|---|---|---|
| 终端交互、流式输出、Diff、状态、CJK、Windows、无障碍 | `[B]` 产品 CHANGELOG；内核源码缺失 | 标定命令输入、长任务进度、正文 Diff、审批、宽窄布局和中文输入 | **Adapt** 行为与验收测试；不复制实现 |
| Resume、Fork、Rewind、Branch、Recap、局部压缩 | `[B]` 产品行为 | 表达备选场景/大纲试验与可恢复协作；绝不能把 Transcript Rewind 等同于正文/Canon 回滚 | **Adapt** UX 概念 |
| 前台/后台 Agent、Team、Task、依赖、Goal、Worktree | `[B]` 产品行为 | 标定编辑角色状态、受限并行审阅、依赖、引导和可见的 Needs-input 状态 | 通过 Harness Subagent/Workflow **Adapt**；不原样移入代码 Worktree 语义 |
| 连接 Terminal-hosted Session 与 Web/Mobile/Desktop/IDE 的 Remote Control | `[B]` 行为；实现不可见且受 Gateway 约束 | 标定远程任务检查、暂停、引导和有限审批 | **Adapt** 协议目标；作为 DeepSeek Bridge **Reject** |
| 插件 Manifest、Command、Agent、Skill、Hook、MCP 与脚本 | `[S]` 可读公共资产，不是私有内核 | 组织受限小说 Skill、编辑 Expert、策略、Connector 与渐进说明 | **Adapt** 组织方式；复制任何资产前单独审查许可 |
| Discovery → Alternatives → Approval → Implementation → Independent review | `[S]` 可执行公共 Markdown 工作流 | 映射前提/控制包发现、Canon 检索、备选、作者审批、起草、连续性与关系审阅 | 在 Harness Workflow 上 **Adapt** |
| 权限规则、Managed Settings、Pre/Post/Stop Hook、Bash Sandbox | `[B]` 行为加公开示例；Sandbox 不是通用隔离 | 标定 Canon Lock、写入提示、写后抽取、停止门和企业配置 | **Adapt** 策略行为；Harness 继续掌权 |
| 小说层级、十个时钟、类型化情绪/关系状态、故事时间、Canon 事务、长篇检索 | `[—]` 没有小说领域 | Coding-agent 功能都不能确立故事真相或情绪连续性 | 在 Novel Project 服务中 **Build** |

### 长篇网文映射

Claude Code 对作者主导共同创作最有价值的贡献是交互语法：用户看得到什么正在运行、什么需要输入、什么发生改变、自己位于哪个分支，以及哪个 Agent 正在负责。小说产品应为 Director、Planner、Writer、连续性审阅、关系编辑、承诺/伏笔审阅和最终 Critic 提供同等清晰度。代码 Diff 映射正文 Diff，Task Goal 映射章节验收条件，Conversation Fork 映射草稿备选，Hook 决策映射 Canon Lock 与独立 Accept/Publish Gate。

分阶段 `feature-dev` 方法可以干净映射成证据优先的小说工作：理解当前 Canon、澄清作者意图、比较大纲或场景方案、选择一个、审批后才起草，再执行独立锚定审阅。带验证的审阅模式很重要，因为 Critic 模型可能发明矛盾。Ralph 式循环只适合配置且可机械观察的条件，例如缺失字段、断链、明确规则冲突、重复短语、导出有效性或受限字数；绝不能无限优化“情绪”“感情”或“质量”，再自行接受结果。

本参考完全不提供基准要求的长篇层级、十个叙事时钟、双向关系账本、情绪残留、读者/角色知识分离、故事时间投影、仿真隔离或正文加 Canon 原子提交。Fork、Rewind、Compact 和 Worktree 是交互隐喻，不是领域事务。仅由 Prompt 描述的关系编辑 Agent 仍只是 L1 辅助；只有提案进入类型化、持久、来源锚定状态后，能力级别才能提高。

### 复用边界与目标职责

`LICENSE.md` 只包含 Anthropic 版权声明并指向 Commercial Terms，不是开源许可。本地既没有可复用的私有内核，公开示例也没有授予复制整个产品的一般权利。模型名称、Prompt Cache、Thinking Control、Sandbox 细节、Gateway 与 Remote Control 都绑定 Claude；CHANGELOG 明确说明非 Anthropic Base URL 会禁用 Remote Control，因此它不能直接成为 DeepSeek 桌面传输。

把 Claude Code 用作行为、工作流、扩展组织、可靠性和质量标杆。作者明确授权的任务可以通过 Harness 将官方产品作为受限外部 Subagent **Integrate**。凡依赖不透明运行时、从逆向推断复制专有内核，或把 Claude Transcript 当小说 Canon 的架构，都应 **Reject**。

**目标职责：** Claude Code 定义交互与分阶段工作的质量标杆；目标产品中的每项控制、状态和提交仍由 Harness 与 Novel Project 拥有。

## 腾讯 WorkBuddy 能力摘要

### 能力结论

WorkBuddy 是这一组参考中最好的任务优先桌面产品范本，尤其适合观察渐进自治、独立任务工作区、以交付物为中心的结果区、Expert 分层、权限 UX 和定时工作。本节每个结论都是腾讯文档记录的 `[B]` 行为：没有可用于核验的本地源码快照、内部架构、可复用 Core API、SDK 或源码许可。

### 文档化能力树

```text
WorkBuddy (documented product surface)
|- Task Envelope: mode + workspace + model + extensions
|- Autonomy: Ask + Plan + Craft
|- Roles: Expert + Expert Team
|- Access: Skills + MCP + Connectors + permissions
|- Results: files + browser + changes + artifacts
|- Continuity: concurrent tasks + memory + automation
`- Reach: desktop + mobile/IM companion
```

官方[任务栏文档](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Task-Bar)说明：Ask 只回答和查看，Plan 先准备执行计划并等待确认，Craft 执行任务且可修改文件；每段对话是具有独立工作区与上下文的任务，多个任务可以并行，用户选择模型、Skill、Connector 和权限模式。这是产品约定，不是隔离或调度实现方式的证据。

### 可观察任务流

```text
user + task configuration
  -> task envelope
  -> [opaque WorkBuddy executor]
  -> Expert / Expert Team
  -> authorized Skill / MCP / Connector
  -> workspace or external service
  -> conversation + changes + artifacts
  -> optional cloud/mobile share
```

[专家中心](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Expert-Center)把 Skill 定义为能力、Expert 定义为角色加方法论加工具、Expert Team 定义为多个 Expert 加负责人主导的协作流程。负责人负责拆解、并行委派和整合交付。Expert 不会只因角色身份获得系统权限，Skill 或 MCP 访问仍受用户授权约束。官方页面描述的是结果和控制，而不是 Call Graph 或事务边界，因此图中方括号标记的 Executor 保持不透明。

### 能力账本

| 能力 | 证据与成熟度 | 长篇网文价值 | 目标动作 |
|---|---|---|---|
| Ask、Plan 与 Craft | `[B]` 官方任务文档 | 映射只读咨询、写入前审阅规划和修订范围内 Write，同时让 Accept 与 Publish 独立 | 通过 Harness 策略 **Adapt** |
| 独立任务上下文、Workspace、模型、扩展、权限和并发 | `[B]` 官方任务文档 | 给每次研究、章节、修订、审计或仿真运行独立 Envelope 与 Scratch 区 | **Adapt**；Scratch 状态绝不成为 Canon |
| 带工作区文件、Browser、Changes 与 Artifacts 的右侧 Results | `[B]` [结果查看文档](https://www.workbuddy.cn/docs/workbuddy/Results) | 把 Draft、Diff、Canon Delta、Issues、Sources、Simulations 和 Exports 变成一等交付物，而非 Transcript 碎片 | 在 Web/Desktop 与 TUI 协议中 **Adapt** |
| Skill、Expert 与 Expert Team 分层 | `[B]` 官方 Expert 文档 | 分离受限操作、配置化编辑角色与多角色 Harness Workflow；关系编辑是 Expert，不是关系数据库 | **Adapt** 产品词汇 |
| 默认/完全访问模式、工作区保护、高风险确认、Sandbox、备份/回收行为 | `[B]` [权限文档](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Permission-Modes) | 在保持作者效率的同时，对保护路径、删除、脚本、网络、外部分享、Canon 接受和发布提示确认 | **Adapt** UX；依赖 Harness 执行 |
| 用户可见、可编辑、可删除、可禁用的对话记忆 | `[B]` [记忆文档](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Memory)；摘要可能有偏差或陈旧 | 保存协作偏好与习惯，绝不保存人物、事件、关系或世界真相 | 在 Canon 外谨慎 **Adapt** |
| 有历史、Workspace、身份、时长/频率/并发限制的定时自动化 | `[B]` [自动化文档](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Automation-Guide) | 运行备份、索引重建、连续性审计、研究摘要、反馈导入与导出预览 | 带明确预算且默认无 Canon/发布权地 **Adapt** |
| TUI、小说层级、十个时钟、类型化关系/情绪状态、故事时间投影、原子章节提交 | `[—]` 没有文档化小说/运行时界面 | 这些仍是目标专用要求 | 在 Harness 客户端与 Novel Project 中 **Build** |

### 长篇网文映射

WorkBuddy 为作者主导共同创作提供了最清楚的产品表达。小说任务应明确绑定项目、来源修订、模式、工作区、权限、模型、Skill、Expert、预算、状态和结果产物。Ask 映射 Canon 咨询与分析；Plan 可以准备滚动路线图、章节控制卡、关系转折、仿真运行和 Diff，但不能写入；Craft 映射仅限授权草稿修订的 Write 阶段。Canon 接受、破坏性覆盖、外部分享与发布，在所有模式中都保持为独立动作。

Results 分离比视觉模仿更重要。对话负责解释和接受引导；结果区公开章节、正文 Diff、候选 Canon 变化、连续性与关系问题、来源、仿真假设和导出。完成意味着存在可审阅交付物。这能防止作者从长 Transcript 中自行拼回真实结果，也让 TUI 和 Desktop 共用一套产物词汇。

这套分层也使小说角色更清晰：连续性查询是 Skill；关系编辑把说明、方法、模型策略和允许的 Skill 组合成 Expert；编辑团队是由 Director 委派并整合的 Harness Workflow。给 Expert 命名为“关系编辑”并不能满足基准要求的双向关系账本、两条独立人物弧、边界、情感债或来源锚定转变。WorkBuddy 没有记录能够让这些状态持久化的小说 Schema。

自动化适合可恢复辅助工作，也可选用于预声明的受限起草运行。它需要来源修订、章节上限、成本/时间/重试上限、历史、停止条件和单独提交决定。在目标设计中，移动或 IM Companion 可以检查进度、预览产物、引导、暂停和批准有限提案；这是目标要求，不是对 WorkBuddy 内部实现的声明。它们不应静默接受 Canon 或发布。云上传、共享资料库、Connector、MCP、OAuth 服务和移动投递都是明确的稿件数据目的地，不是默认便利项。

### 复用边界与目标职责

[记忆文档](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Memory)明确警告，模型抽取记忆可能存在概括偏差或时效问题。这支持可见的偏好记忆，却排除了把它当故事真相。自动化文档还说明无人值守任务使用当前登录身份，并可能在调用外部模型、MCP、Connector、OAuth 服务或通知通道时分享数据。因此，未公开稿件必须披露目的地并采用最小权限。

本报告审阅的官方页面没有证明可嵌入 WorkBuddy Core、适合该架构的受支持集成 SDK、源码复用许可、TUI 或正文与 Canon 原子事务。其任务、结果、Expert、权限、自动化和 Companion 模式可以 **Adapt**；增加一个不透明第二运行时，或从 UI 文档推断内部保证，必须 **Reject**。

**目标职责：** WorkBuddy 定义任务优先桌面产品语法；Harness 负责执行，Novel Project 提供全部小说语义和权威提交。

## Pi 能力摘要

### 能力结论

Pi 包含所有已审阅本地项目中唯一成熟、开源、可直接复用的 TUI 实现。它当前的 Coding-agent 路径还提供有价值的事件、Session Tree、Extension、SDK 与 JSONL RPC 参考。必须把这条路径与 Pi 较新的 Durable-session `AgentHarness` v2 Scaffold 严格分开：后者虽已有 Repository 和 Protocol 组件，但核心 Agent 操作仍会以未实现拒绝。

### 能力树

```text
Pi mature path
|- pi-tui
|- pi-coding-agent
|  |- AgentSession
|  |- JSONL SessionManager
|  |- Extensions
|  `- SDK / JSONL RPC
|- pi-agent-core
`- pi-ai providers

Pi v2 [experimental]
`- durable Session repositories + AgentHarness scaffold
```

成熟路径由 Pi 的 `pi-coding-agent`、`pi-agent-core`、`pi-ai` 和 `pi-tui` workspace 组成。独立 v2 路径包含 Lane 与 Operation Record、Memory/JSONL/SQLite Repository、Materialized View、Writer Lease、可选 FTS、CBOR Protocol 与 Client/Server Package；但 `AgentHarness.create()` 会拒绝 Restore，`prompt`、Skill、Compact、Tree Navigation、Resume、Abort、Queue、Usage、Idle、Drive、Watch 与 Lane 操作都返回 `HarnessNotImplemented`。存储设计先进，并不能让这个 Scaffold 成为可用 Agent Runtime。

### 成熟路径真实事件流

```text
Editor submit
  -> InteractiveMode
  -> AgentSession.prompt
  -> Agent.prompt / agentLoop
  -> pi-ai stream
  -> message + tool events
  -> tool execute + result message
  -> AgentSession persistence / extension events
  -> InteractiveMode subscription
  -> pi-tui differential render
```

`InteractiveMode` 明确把业务逻辑委派给 `AgentSession`，订阅其事件，再通过 `pi-tui` 渲染消息与工具活动。底层 Agent 处理上下文变换、流式生命周期事件、串行或并发工具调用、前后 Hook、进度、错误结果、Steering、Follow-up Queue、Abort、Idle Wait 和完整 Turn 后停止。这是一条有用的参考流，但目标系统会用 Harness 替代其中的 Agent 与持久化所有者；只有展示 Adapter 保持由 Pi 提供。

### 能力账本

| 能力 | 证据与成熟度 | 长篇网文价值 | 目标动作 |
|---|---|---|---|
| Main-screen Scrollback 与 Alternate-screen Viewport、差异渲染、同步输出、响应式 Stack、嵌套滚动、搜索、Overlay、鼠标、Markdown、图片 | `[S]` `pi-tui` 源码与 README | 构建无闪烁的宽/窄 Project、Transcript、Diff、Canon、Issue、Approval 与 Progress 视图 | 在 Harness Client Adapter 后 **Adopt** `pi-tui` |
| Editor、Bracketed Paste、Completion、多行输入、外部编辑器交接、硬件光标与 CJK IME 行为 | `[S]` TUI 与 Coding-agent 路径 | 支持中文命令、锚定改写、大段笔记粘贴，并交给真正长篇编辑器 | **Adopt** 并增加小说专用 Fixture |
| AgentSession 事件订阅、流式工具视图、排队 Steer/Follow-up、中断与状态约定 | `[S]` 成熟 Coding Agent | 标定响应式起草、运行中作者引导、Needs-input 状态和非阻塞后台展示 | 把事件 **Adapt** 到 Harness；不复用 Loop |
| Parent-linked JSONL Tree、文件内 Branch、Fork、Clone、Label、Resume、Export、Compaction 与 Branch Summary | `[S]` 成熟 SessionManager | 参考备选草稿导航与可恢复协作；通用 Branch 和 Summary 不是正文修订或 Canon | **Adapt** UX，作为领域权威 **Reject** |
| Extension Tool、Command、Key、Hook、Navigation、持久 Entry、Renderer、Widget、Footer、Prompt、Theme 与 Skill | `[S]` 公开 Extension API | 添加章节导航、正文 Diff、Canon 提案、关系问题、仿真与审批 Renderer | **Adapt** Renderer 与 Extension 模式 |
| 同进程 SDK 与逐行 JSON RPC | `[S]` 编程模式 | 参考同进程 TUI Bundle 或严格进程桥，同时保留一套共享领域协议 | 仅在 Harness 传输确有需要时 **Adapt** |
| Agent Loop 与广泛的 `pi-ai` 模型/Provider/凭据注册表 | `[S]` 成熟，但与 Harness 重复职责 | 可作实现参考；实际运行会拆分模型、工具、Session、审批与凭据权威 | **Reject** 重复 runtime |
| 权限、Sandbox、内置 Subagent、Plan Mode、小说 Schema、原生 Desktop；v2 AgentHarness | 当前产品控制/领域/Desktop 为 `[—]`；v2 为不完整 `[X]` | 无法执行作者策略、表达十个时钟或提供桌面产品 | 在 Harness/Novel Project **Build**；当前 **Reject** v2 |

### 长篇网文映射

Pi 在基准的 TUI 与作者引导层最强。宽终端可以组合 Project Tree、Transcript 或正文 Diff，以及 Agent、Canon 变化、关系问题、承诺和审批的上下文面板；窄终端可以把这些面板折叠为 Overlay。搜索、应用自管滚动、语义 Prompt 导航、排队消息、自定义 Tool Renderer 和外部编辑器交接，都直接支持长 Session 与局部改写。Main-screen Renderer 保留普通终端 Scrollback；Alternate-screen Renderer 提供类似 Codex/Claude 的托管 Viewport，并可在退出时打印最终文档。

不应强迫终端 Editor 变成完整富文本小说工作台。它适合命令、引导、小改、审阅决定和锚定 Patch；持续正文写作应打开作者编辑器。`pi-tui` 渲染的是 ANSI 行，不能复用成 React 或 Electron Component。Desktop 使用同一 Harness 与 Novel Project 事件，但采用另一套 Renderer。

Pi 的 Session Tree 演示了可发现的 Branch 与恢复，却不能满足基准要求的原子章节修订、故事时间投影或陈旧索引失效。其 Compaction 有意有损，不能拥有角色事实、情绪残留、男女主关系转变、承诺、谜团或结局债务。Pi 没有小说 Schema、语义故事检索、故事世界/读者沙箱分离、发布流水线或跨存储提交。

Coding Agent 还有意不内置权限、Sandbox、Subagent、Plan Mode 与 MCP。Project Trust 控制资源加载，不是执行隔离；Extension 与工具拥有宿主权限。这些缺失符合 Pi 的极简理念，却使它不能成为目标运行时所有者。

### 复用边界与目标职责

Pi 采用 MIT 许可，因此可以选择性复用代码，但必须保留版权与许可声明。应固定经过审阅的公开 `pi-tui` Surface，或通过明确更新流程 Vendor；避免依赖私有内部实现。复用 TUI Component、交互约定、自定义 Renderer 设计，以及可能的 SDK/RPC Bridge 模式。不得在 Harness 旁启动 `pi-coding-agent`、导入重复的 `pi-ai` 注册表，或采用未完成的 v2 AgentHarness。

**目标职责：** Pi 只拥有终端渲染组件；Harness `novel-tui` Bundle 把共享运行时和小说领域事件转换成这些组件，Harness 继续作为唯一 Loop 与策略所有者。

## OpenFic 能力摘要

### 能力结论

OpenFic 是本组项目中最强的、可直接审阅源码的小说产品参考。它已经组合 React/TipTap 写作工作台、Electron 载体、持久专职 Agent、审批中断、关联 revision 的 diff、分层章节上下文、混合检索，以及异常细致的中文小说 Skill。其决定性局限不是缺少小说知识，而是缺少强类型权威状态：大纲、关系、情绪、承诺、伏笔、读者知识和故事时间规则仍是 Note、自由文本或 prompt 生成的工作表，不是可确定投影的 Novel Project 状态。

### 能力树

```text
OpenFic
|- Clients: React/TipTap Web + Electron
|- API/Transport: FastAPI + WebSocket
|- Agent Runtime: Orchestrator + ReAct agents + checkpoints
|- Control: tool hooks + approvals + persistent threads
|- Project Store: project/volume/chapter/character/world/note
|- Revision Store: snapshots + rollback + diffs
|- Long Memory: layered summaries + hybrid retrieval
`- Fiction Skills: emotion + relationship + reader contract + state
```

Project 实体、Agent 配置、revision 和索引记录是已交付的 SQLModel 持久数据。Composer、Writer、Reviewer、Auditor、Plan、Explore、Build 与 Actor 是可配置 Agent 角色，具备 prompt、工具类别、Skill、允许的子 Agent、thread、checkpoint、queue、暂停和恢复。能力树最后一支的证据类型不同：Skill 已交付且可加载，但其叙事结构是给模型的指令，不是数据库 schema 或强制状态迁移。

### 真实写作与检索流程

```text
Assistant Sidebar
  -> WebSocket SessionRunner
  -> begin user revision
  -> LangGraph agent
  -> write_chapter proposal
  -> auth hook / approval interrupt
  -> chapter transaction + revision diff
  -> index stale/enqueue
  -> persisted events + UI diff
```

`SessionRunner` 在 graph 运行前开始 user revision，并在完成、中断、取消、持久化失败和 runtime 失败时分别结束其状态。`auth_hook` 按工具选择 allow、deny 或 interrupt；只读工具默认允许，写工具默认询问。`write_chapter` 是带 interrupt preview 的 write 级工具，它要求存在 active revision，在 volume lock 下串行化变更，记录章节前后 diff 与 Agent activity，刷新计数，加入索引任务并提交。这是一条可信的作者审阅与恢复路径；但它不是正文加 Canon 的原子事务，因为 OpenFic 没有独立权威 Canon Delta，而同一 revision 内的多个工具调用可能分别提交。

```text
chapter content
  -> SHA/freshness
  -> chunks
  -> vector search + FTS/BM25
  -> RRF
  -> optional rerank
  -> bounded chapter context
```

章节控制包受到明确预算约束：当前章、前九章全文、再前一段窗口的章节摘要、更早的区间摘要和近期标题目录。检索可以执行 vector、FTS/BM25 或 hybrid 查询，以 RRF 融合排序，可选 rerank，并追踪来源 hash 与索引 freshness。它比只依赖 transcript memory 更好地解决 token 分配和派生数据过期问题，但主要索引章节正文，也不会按所需故事时刻投影创作基准中的十个时钟。

### 能力账本

| 能力 | 证据与成熟度 | 长篇网文价值 | 目标动作 |
|---|---|---|---|
| 响应式项目树、多标签 TipTap 编辑器、Agent 侧栏、任务/reasoning/子 Agent/审批视图 | `[S]` React client | 最接近作者工作台的参考，可同时保持正文、对话、活动与决策可见 | **Adapt** 为 Harness Web/Desktop 领域 slot |
| Electron 本地/远程实例管理、便携 Python 生命周期、版本检查、备份、迁移、恢复、删除与 TXT 导入导出 | `[S]` desktop 与交换路径 | 建立 local-first 打包、项目可携带性、恢复、编码识别、限范围导出任务与取消的产品基准 | **Adapt** 产品行为；不保留 Python runtime |
| Project、Volume、Chapter、Character、WorldBook entry、Note、summary、Skill、rule、preference、thread、task 与 index 记录 | `[S]` 持久产品模型 | 提供实用的编辑器/项目最小清单与卷章组织 | **Adapt** 有用字段；用 Novel Project schema 替换自由文本叙事权威 |
| 可配置专职 Agent、子 Agent、持久 thread、checkpoint、queue、暂停/恢复与 compaction | `[S]` LangGraph runtime | 展示持久编辑角色以及策划、写作、审查、表演和研究的可见委派 | **Adapt** Harness 上的角色 UX；**Reject** 重复 loop |
| 每工具 allow/ask/deny、interrupt preview、关联 revision 的 snapshot/diff/activity 和非破坏 rollback | `[S]` 已实现控制与 revision 路径 | 作者主导提案、锚定正文审阅、已知失败状态和可恢复编辑的强参考 | **Adapt**；扩展为正文加 Canon 的单次提交 |
| 近距离全文、中距离章节摘要、远距离区间摘要、标题目录与持久对话 tail/summary | `[S]` 上下文构建与 compaction | 给出具体长上下文预算，而不是发送整本书或相信对话记忆 | **Adapt** 为强类型控制包的一种输入 |
| Vector、FTS/BM25、hybrid RRF、可选 rerank、hash、freshness、stale detection 与 index job | `[S]` 检索实现 | 查找远距正文证据并让派生索引 freshness 可见 | **Adapt** 到 Harness retrieval 背后；增加实体、事实、时间、来源和 revision 过滤 |
| 情绪弧、人物关系、读者契约、故事状态、故事拆解、对白、开篇、反转与正文 Skill | `[S]` 可加载 YAML prompt 方法论 | 提供情绪因果、关系节奏、期待债、状态筛选、读者效果和锚定审阅的丰富启发式方法 | **Adapt** 选中方法为 profile、强类型 schema、evaluator 与 fixture；不把 prompt 输出当事实 |
| TUI、强类型大纲/场景/节拍、时序 Canon、因果图、双向关系实体、知识矩阵、承诺生命周期、跨存储原子提交 | `[—]` 不存在强制领域能力 | 创作基准要求这些能力，Note、prompt、retrieval 或 revision 均未建立它们 | **Build** 于 Novel Project 与基于 Pi 的 TUI |

### 长篇网文映射

OpenFic 的小说方法不应被低估为普通“prompt 库”。`emotional-arc.yaml` 区分角色经历的情绪、文本传递的情绪和读者实际反应，还建模触发、蓄力、释放、余韵、赌注和长期投入。`character-relationship.yaml` 区分表面社会关系与私人情感，要求刻意的不对称推进与信息差，检查阶段适配，让两个重要角色拥有独立变化路线，并拒绝生命中只有恋爱的情感工具人。`reader-contract.yaml` 建模期待所有权、兑现、延期债务利息、利益交换、主角代理权以及新地图或新谜团产生的债务。`story-state-tracking.yaml` 只选择影响决策的状态，区分文本事实、角色知识和分析，不允许未来信息倒灌，保留来源冲突待裁定，并追踪关系、承诺、伤口、资源、情绪立场和伏笔。这些方法直接映射创作基准的情绪、感情第二主线、承诺/兑现、信息公平与连续性检查。

但它们仍停在 L1–L2 辅助层。输出是进入 prompt、response、Note 或正文的生成文本；系统没有强类型 `RelationshipState(pair_id, A_to_B, B_to_A, social_stage, private_affect, trust, intimacy, commitment, boundaries, promises, debt, knowledge, evidence, valid_transition)`。验证器无法证明一次吸引变化由来源场景挣得、男女主双方仍有行动权、情绪余波跨十章延续，或破坏承诺已经改变终局计划。OpenFic revision 可以恢复已存对象，却不会由已接受事件计算权威关系状态或故事时间投影。

这些 Skill 还把可迁移方法与强题材立场混在一起。谁应该追求谁、“纯洁”要求、理想伴侣地位、章节字数、段落形式或强制情绪节律都只是 profile 选择，有些还是有害刻板印象，不是平台不变量。目标应保留有用的双轴、不对称、双方行动权、触发/证据、期待债和失败检查结构；感情 Profile、语气、受众、边界与排除套路必须由作者配置，并用测试防止物化或单方失去行动权。

因此，OpenFic 直接帮助作者权威、长上下文分配、章节审阅、可恢复性、关系/情绪方法、读者契约检查和 Desktop 工作流。它没有解决完整层级、全部十个时钟、因果/空间模拟、读者证据来源、终局收束，或故事世界与读者反应沙盘的隔离。其丰富编辑器可以在 Novel Project 拥有这些 artifact 后显示它们；现有自由文本状态不能成为其权威。

### 复用边界与目标职责

本地快照报告版本 `0.10.1` 与 Apache-2.0，但没有 Git metadata，因此无法确定上游 commit 和本地修改。复制代码前应重新验证来源，并为获批复用保留声明。Python/LangChain/LangGraph/LanceDB/FastEmbed runtime 会重复 Harness 对模型、工具、Session、权限、凭据和编排的所有权。公网 FastAPI/Docker 部署也需要重新设计认证、origin、secret 与暴露策略；loopback Desktop 默认值不能证明 Internet 安全。

仅选择性 **Adopt** 经过审阅、边界清晰且能减少目标自有代码的 client 或交换代码。**Adapt** 三栏工作台、审批卡、revision UX、分层上下文、检索 freshness、备份/迁移、专职角色展示与选中的小说方法论。**Reject** 把 OpenFic 嵌为第二套 runtime，或把任何 Skill 输出、对话摘要、Note 或 vector hit 直接提升为 Canon。

**目标职责：** OpenFic 定义主要小说产品、编辑器、记忆、revision 和方法论参考；Harness 重写其控制行为，Novel Project 将选中方法转为强类型、来源锚定、作者批准的状态。

## OpenNovel 能力摘要

### 能力结论

OpenNovel 是本组项目中最强的叙事 schema 与质量流水线原型，不是安全 runtime 或完成态创作产品。其有价值的思想是 canonical ID、结构化角色状态、章/场景大纲、故事时间事件账本、因果和关联事件边、伏笔状态、按权威分层的上下文、锚定原文的批评，以及经人工审阅的状态抽取。同一份源码也证明这些概念必须重写：自动路径在手稿可恢复持久化之前就修改权威状态，多条宣传路径被禁用或已经损坏，关系与情绪模型也远不足以承载创作基准要求的完整感情第二主线。

### 能力树

```text
OpenNovel
|- Interfaces: Typer/Rich CLI + MCP
|- Pipeline: Writer -> Critic -> Manager -> Director
|- Human Layer: Markdown manuscripts/settings
|- State Layer: frontmatter + SQLite events + snapshots
|- Semantic Layer: canon/subconscious vectors
|- Domain Models: characters + outlines + events + causal links
`- Global Control: foreshadowing + timeline + metrics
```

该包版本为 `2.0.0`，采用 MIT 许可证并标记为 Alpha。Character frontmatter 使用 canonical ID、alias、location、injury、buff、debuff、五个有界情绪维度与 extras、inventory 和 knowledge。`ChapterOutline` 包含强类型 scene ID、description、参与角色 ID、情绪基调、字数估计、角色弧、情节点、节奏和目标长度。Event 携带章节、故事时间文本、一个角色 ID、事件类型、自然语言 description、因果压强、一个因果父事件和非因果关联 ID。Foreshadowing 区分 plot、character、theme 与 world，状态为 buried、in-progress 和 closed。这些是真实 schema，但 schema 的存在本身不能证明抽取、投影、事务或作者 UX 正确。

### 安全交互路径与危险自动路径

```text
Interactive commit
chapter -> pre-snapshot -> Auditor -> diff
        -> per-event approval
        -> state/events
        -> summary/timeline

AutoRunner [unsafe]
outline -> Writer -> Critic <-> revise
        -> Manager mutates state/events
        -> snapshot
        -> chapter write
           ^ authoritative mutation already happened
```

交互式 `commit` 是 OpenNovel 最好的作者主导模式。它为受影响 frontmatter 和待回滚事件集建立 snapshot，抽取候选事件，显示状态 Diff，逐事件询问，只应用被接受的事件，随后更新时间线和摘要。此时章节已经存在，snapshot 也从不存 Markdown body，因此它是受保护的状态抽取事务，不是新正文加 Canon 的原子接受。

`AutoRunner` 把安全顺序颠倒。正常分支先调用 `Manager.update()`，直接修改角色 frontmatter 并追加事件，再创建名义上的写前 snapshot，最后写章节。高分章节还会把 Manager 更新延迟到之后的批处理，且没有对应 snapshot。Snapshot 只记录 `fm_before`、`fm_after` 和事件 ID，不能恢复被重写正文。因此该流程可能让状态先于手稿、rollback 丢失章 body，或在失败后保留部分已应用变更。

### 能力账本

| 能力 | 证据与成熟度 | 长篇网文价值 | 目标动作 |
|---|---|---|---|
| Markdown 人类层、frontmatter 状态层、SQLite 事件账本、snapshot、语义 Canon/subconscious 层 | `[S]` 已实现 prototype 本地 store，但存在双写风险 | 在作者正文、当前状态、因果历史与低权威灵感之间建立有用分层 | **Adapt** 为一个权威事件/记录服务和可重建 projection |
| Canonical character/location/item 约定、`CharacterFrontmatter`、`ChapterOutline` 与 `SceneBreakdown` | `[S]` 经 Pydantic 校验的 prototype schema | 为角色状态、章节控制卡、场景、参与者、基调、目标长度、人物弧和情节点提供起点 | **Adapt** 并扩展到完整层级、升级、目标、声音、情绪证据和故事时间 |
| 强类型事件类别、章节/故事时间字段、因果压强、一个因果父事件、关联事件、查询、投影、时间线与可选图分析 | `[S]` 有用的 EventStore 实现；多个 payload 仍是自然语言 | 支持连续性证据、因果遍历、高影响事件审阅与历史状态投影 | 重设计后 **Adapt**，加入强类型 payload、多实体参与、来源区间、有效区间、分支和确定性 projector |
| Plot/character/theme/world 伏笔类型与 buried/in-progress/closed 生命周期 | `[S]` coarse schema 和 store；MCP 表面为 `[D]` | 提供开放承诺和延迟揭示的初始词汇 | **Adapt**，加入 truth、clue、读者/角色知识、揭示前置、兑现证据、过期和终局债务 |
| CANON、STATE_MEMORY、SUBCONSCIOUS 权威分类与 frugal/standard/panoramic context pack | `[S]` 上下文组装；宣传的检索栈只有部分实现 | 正确阻止灵感碎片压过 Canon，并让上下文预算成为任务选择 | **Adapt** 权威和预算概念；替换检索并要求 revision/time 过滤 |
| Writer 规划、大纲变体、Critic 评分、锚定 issue、全章重写前的局部 hot fix、Manager 抽取、Director 节奏/张力指导与 metrics/trace | `[S]` 固定 prototype 四角色流水线 | 章节控制、证据锚定审阅、有界修复、候选比较和职责分离的强来源 | **Adapt** 职责为 Harness Skill/Expert/workflow；**Reject** 固定 runtime |
| Snapshot → Auditor → Diff → 逐事件批准 → state/summary/timeline | `[S]` 交互式 CLI 路径，但仅限状态抽取 | 作者否决权和细粒度 Canon 提案的最佳参考 | **Adapt** 为强类型 Canon Delta 和一次正文加 Canon 的接受事务 |
| AutoRunner 状态顺序、延迟 Manager、仅 frontmatter rollback、空 chapter ID、自动 Director 调度、MCP 自动 commit 和损坏的 foreshadow API | `[D]` 具体实现缺陷 | 展示会损坏长篇状态或绕过作者的失败模式 | **Reject** 所有受影响路径；从头设计事务与自动化语义 |
| 全屏 TUI、Web/Desktop 编辑器、持久对话/子 Agent 控制、通用审批协议、发布工作流、隔离仿真 | `[—]`；GUI 是 `[P]` 文档 | 无法交付所需共同创作产品或仿真实验室 | **Build** 于 Harness、Pi TUI、Novel Project 和后续 Electron |

### 已确认的实现缺陷与宣传差距

- `Manager._apply_updates()` 生成带 `chapter_id=""` 的 `EventCreate`，注释声称 StateManager 会补全，但 `StateManager.apply_event()` 原样转发对象。因此按章查询、时间线和投影失去来源锚点。
- `Writer` 默认使用 `AutonomousConfig(enabled=False)`，`AutoRunner` 没有传入另一份 autonomy 配置。即使 AutoRunner 选择 `write_with_autonomy()`，autonomy runner 也会返回单次模型调用，而不是执行写作中的工具 loop。
- 通用 SafetyFence 的预算/深度/超时检查会在部分 Writer hot fix 与 Director 分析前调用；独立的 `check_canon_integrity()` 在生产包中没有调用点，因此 Canon checker 的存在和测试并未保护生成章节。
- Director 的 `SKIP` 和 `INSERT` 调度提案会立即修改剩余大纲，不请求批准；`MERGE` 只写一条未实现日志。
- MCP `commit` 先 snapshot 和抽取，随后对整个结果调用 `apply_confirmed_events(result.events, ...)`，没有 CLI 的逐事件审阅。同名操作在不同界面上具有不同作者权威语义。
- CLI `write` 在内存中拼接模型输出并打印，却从不持久化新文本。MCP foreshadow 使用已移除的 `id`、`target_chapter`、`ACTIVE` 和 `RESOLVED`，而不是当前 schema 的 `foreshadow_id`、`expected_close_chapter`、`BURIED`/`IN_PROGRESS`/`CLOSED`。
- README 宣称 FTS5、rerank 和 reindex，但审阅到的包并不支持；hybrid retriever 只是追加 SQL 和向量结果，没有实现所宣传的融合栈。CI 仍检查过时的 `loom/` 而非 `opennovel/`，因此其 lint、type 和 coverage job 没有验证当前包。
- Frontmatter 与 EventStore 同时承载当前状态，多个 projector 又从自然语言 description 推断更新。即使显式顺序 bug 修复后，这仍会造成权威来源和双写问题。

### 长篇网文映射

OpenNovel 覆盖的创作基准词汇比任何通用 coding Agent 都多。场景感知的大纲帮助长篇层级与章节 loop；故事时间事件、因果边、角色 knowledge、时间线导出与来源章节字段指向连续性和信息公平；伏笔状态指向承诺与终局收束；按权威分层的上下文正确区分 Canon、当前记忆与推测灵感；Critic 锚点和局部修复满足审阅必须引用所改正文的要求；metrics 与 trace 可以展示成本和质量循环行为，而不假装分数能证明文学质量。

它仍只表示十个时钟的片段。`timestamp` 是未经校验的字符串，不是日历/区间与旅行模型；一个 event 只有一个 `character_id`，不是明确 participants 和强类型 effect；因果压强只是评分，不是因果证据；foreshadow 记录没有区分客观真相、线索、各角色知识、读者知识、误导假设和揭示证据。升级层级、资源与代价、地图规则、读者契约债、章节兑现、声音、发布状态和结局依赖均需要新 schema。

关系缺口是结构性的。`RELATIONSHIP_CHANGE` 只是事件 enum，payload 只有一个角色 ID 和自然语言 description。系统没有 pair identity、双方独立目标、A-to-B 与 B-to-A 状态、公开/社会与私人/情感双轴、阶段、信任、亲密、尊重、承诺、冲突、同意/边界状态、约定、情感债、共同记忆、不对称知识、来源证据或允许的迁移图。`EmotionVector` 只是五个数值加 extras 的快照，无法表达 trigger、对象、评价、压抑、表现情绪与真实情绪、身体证据、误读、积累、衰减、余波或情绪导致的选择。OpenFic 的 prompt 方法在这里更丰富，尽管 OpenNovel 的存储更强类型。

目标需要重建以 pair 和故事时间有效区间为键的 `RelationshipState`，包含方向状态、两人的目标与边界、公开/私人阶段、信任/亲密/尊重/承诺/冲突、约定与债务、不对称知识、事件/来源证据、允许迁移和对主线的后果。Emotion 需要事件派生状态，包括触发、目标、评价、表达、掩饰、强度、余波、证据和下游选择。两者都不能一次推断后静默覆盖；已接受事件通过确定性 projector 更新它们，作者在正文 Diff 旁审阅关系/情绪 Delta。

作者主导模式应以交互式 commit 顺序为默认，但必须移动到所有权威变更之前并包含正文。可选全自动模式可以在私有分支上按章数/成本/时间/重试上限执行生成、批评、修复、抽取和仿真。只有项目显式策略允许时才可以自动接受；即便如此仍必须产出相同的 Diff、Canon Delta、关系/情绪 Delta、证据和可恢复事务。包装当前 AutoRunner 无法获得这些保证。

### 复用边界与目标职责

OpenNovel 采用 MIT 许可证，但本地解包目录没有 Git metadata，因此复制前必须固定来源和本地改动。**Adapt** 领域词汇、小型 schema 思想、权威分层、Critic 锚点、局部修复策略、事件查询概念与细粒度交互审阅。**Reject** AutoRunner、StateManager、当前 snapshot/projector、MCP 变更 handler、检索宣传、固定四 Agent 执行，以及 Alpha 标签或测试足以证明端到端安全的假设。

不得把 OpenNovel 嵌在 Harness 旁边，也不得让其 frontmatter/EventStore 成为第二份 Canon。把选中概念重写为完整 Harness capability seam 与单一 Novel Project 事务模型，并覆盖 unit、lifecycle、recovery、assembled snapshot 和 client protocol 测试。

**目标职责：** OpenNovel 提供主要领域词汇与反面事务教训；Novel Project 拥有重新设计的 schema 和 projection，Harness 拥有每个 Agent、policy、approval 与自动运行。

## MiroFish 能力摘要

### 能力结论

MiroFish 是专门的社交仿真与报告流水线，不是 Codex/Claude 式作者共同创作 Agent，也不是可复用小说 runtime。其真实路径是种子材料 → 可发声主体 ontology → 时序图谱 → 社交 persona 与环境 → OASIS Twitter/Reddit 仿真 → 行动摄取 → 图谱辅助报告与采访。它对目标的最高价值是 Simulation Lab：时序 episode、append-only 行动时间线、运行后 memory drain 才算完成、graph reader 生命周期、角色采访和合成读者群体思想。读者反应仿真与其现有实现更接近；故事世界沙盘需要全新的 ontology、状态模型、行动引擎和确定性分支协议。

### 能力树

```text
MiroFish
|- [S] Seed Intake: PDF/Markdown/TXT + prediction requirement
|- [S] Social Ontology: speaking subjects + typed relations
|- [S] Temporal Graph: episodes + historical relationships
|- [S] Personas/Config: profiles + activity + stance + influence
|- [S] Simulation: OASIS Twitter || Reddit environments
|- [S] Memory: actions -> episodes -> pending-drain barrier
|- [S] Analysis: Quick/Panorama/Insight/Interview -> report
|- [S] Client: five-stage Web progress + action timeline
|- [X] Local Memory: Graphiti + Neo4j + SQLite + Ollama
`- [—] Authoring: manuscript/canon/diff/approval/TUI
```

已交付 ontology 明确面向社交媒体舆论仿真。其 prompt 要求恰好十种实体类型，保留 `Person` 与 `Organization` 兜底，要求六至十种关系，排除抽象概念，并要求每个实体都是能以账号发声的主体。这对于社交 Agent 可以成立，但不是故事世界 ontology：地点、物品、功法、伤势、秘密、规则、旅行、战斗与资源必须真实存在，不能假扮社交账号。

### 真实当前数据流

```text
PDF/Markdown/TXT + prediction requirement
  -> extract / chunk / sample source text
  -> LLM social ontology
  -> temporal subject graph
  -> LLM personas + activity/environment config
  -> OASIS subprocess
       |- Twitter environment
       `- Reddit environment
  -> per-platform actions.jsonl
  -> action-to-episode graph updater
  -> flush queue + wait for pending episodes
  -> Quick / Panorama / Insight / Interview tools
  -> ReportAgent outline + section ReAct
  -> report + logs + interactive interviews
```

两个 OASIS environment 通过 `asyncio.gather` 并发运行，但它们是独立社交平台，不是一个共享物理与因果世界。每轮随机选择活跃 Agent，并让每个 Agent 执行 `LLMAction`；Twitter 支持发帖/点赞/转发/关注/引用类动作，Reddit 支持发帖/评论/赞踩/搜索/趋势类动作。Interview 是向仍存活环境发送的 manual action，由其 LLM Agent 回答。因此源码中“真实回答，而非 LLM 模拟”的措辞不准确：回答在合成环境中实时产生，但仍由模型生成。

上游 HEAD 的图操作使用 Zep Cloud。审阅到的 dirty branch 新增了未提交的 loopback Graph Memory client 与 FastAPI sidecar，后者使用 Graphiti、Neo4j、SQLite task/batch metadata 和本地 Ollama embedding；图谱抽取、仿真与报告推理仍使用远程 LLM 配置。该本地路径是 `[X]`，不是上游已发布能力。它也只部分展示了正确权威方向：graph memory 是派生仿真 store，但 MiroFish 上方并没有已接受 manuscript/canon 来源。

### 能力账本

| 能力 | 证据与成熟度 | 长篇网文价值 | 目标动作 |
|---|---|---|---|
| PDF/Markdown/TXT 接入、全文持久化、分块、代表性抽样和自然语言仿真需求 | `[S]` API 与文件处理路径 | 接入冻结手稿或大纲并定义有界实验，不把整本书塞进一个 prompt | **Adapt** 于 Novel Project import 与 SimulationRun 输入 |
| LLM 生成社交 ontology、Pydantic entity/relation model、建图、批摄取、状态轮询、调用方生成 graph/operation ID 和丢失响应对账 | `[S]` 图构建路径 | 为派生时序图与幂等长任务摄取提供强生命周期思想 | **Adapt** operation 与来源纪律；**Reject** 将可发声主体 ontology 当故事事实 |
| 包含身份、bio、人口信息、兴趣、社交统计、stance、sentiment、activity、response delay 与 influence 的 persona 生成 | `[S]` OASIS 准备路径；失败可静默回退模板 | 为多样合成读者群体和可见仿真假设提供起点 | **Adapt** 读者 cohort 配置；按目标、知识、资源、价值、关系和来源时间重建故事角色 |
| 并行 Twitter/Reddit OASIS environment、平台 action、每轮活跃 Agent 选择、日志、启停与实时 interview IPC | `[S]` 仿真子进程 | 展示多 Agent 反应轨迹、传播、社交讨论与运行后追问 | **Adapt** 为合成读者实验；**Reject** 将其当作因果故事世界引擎的证据 |
| Append-only `actions.jsonl`、action 转 timestamped episode、queue/batch/flush、等待待摄取 episode，以及 drain 成功后才发布最终完成 | `[S]` memory updater 与 runner lifecycle | 是仿真事件来源追踪，以及防止派生 memory 未追平便宣告“完成”的优秀模型 | **Adapt** action ledger 与 drain barrier；持久化 retry 状态并保持非 Canon |
| QuickSearch、Panorama、InsightForge 子问题、图历史、Agent 选择、interview、大纲规划、分节 ReAct、报告、进度与完整日志 | `[S]` report 路径；质量/事实性未验证 | 支持连续性/仿真审阅、角色 hot-seat、竞争假设和可检查的证据收集轨迹 | **Adapt** 有界工具与引用要求；每次 interview/report 都标为合成 |
| 五阶段 Vue 流程：接入、图可视化、persona/environment 准备、行动时间线、报告生成、Agent chat、单角色采访与群体问卷 | `[S]` Web client | Simulation Lab 进度、事件时间线、日志、假设和交互探索结果的好参考 | **Adapt** 为共享 Desktop client 内的领域面板；它不是作者工作台或 TUI |
| Loopback Graphiti/Neo4j/SQLite/Ollama graph-memory service | `[X]` 未提交 dirty-worktree 实验 | 展示可能的本地派生图 provider，以及 loopback/token/proxy 卫生 | **Reject** 将其当已发布能力证据；独立评估干净 Harness provider |
| 手稿树/编辑器、章节控制包、Diff/Canon Delta、强类型故事状态、作者审批、分支/重放、确定性仿真、TUI/Desktop task 控制 | `[—]` 缺失 | 这些是小说创作中安全使用仿真的前提 | 集成前 **Build**；MiroFish 永不拥有已接受故事状态 |

### 故事世界与读者反应映射

```text
                         accepted revision R
                                  |
                    frozen read-only simulation input
                    +-------------+-------------+
                    |                           |
          STORY-WORLD SANDBOX          READER-REACTION SANDBOX
          characters + factions        reader cohorts
          goals + resources            presented text only
          role-scoped knowledge        reading history
          causal actions               social reactions
                    |                           |
          counterfactual events         hypotheses + variance
                    +-------------+-------------+
                                  |
                         SimulationRun artifact
                                  |
                       author/policy review only
                                  X
                         no direct canon write
```

按用户确定的顺序，目标先建故事世界沙盘，但不能通过给 MiroFish 账号改名获得该能力。世界 Agent 必须作为选定故事时间的居民行动，只能读取自身 belief、goal、resource、location、capability、relationship 与感知证据。引擎需要 move、observe、conceal、reveal、bargain、train、fight、refuse、sacrifice、promise、betray 与 repair 等强类型动作；明确 precondition 和 effect；共享的反事实世界状态；fork point；run identity 或 seed；有界时间；可比较分支。客观事件、每个角色的 belief 与读者可见信息必须分开。MiroFish 提供时序 episode、图查询、子进程生命周期与故障分离、行动日志、采访与 drain 纪律，而不是这些缺失的语义。

后续读者反应沙盘更接近直接改造。Cohort 可表示升级/爽点读者、世界观考据者、节奏敏感者、感情线优先者、男女主角色粉、群像粉、逻辑/公平审阅者、老读者和新读者。他们只收到该时刻可见的文本与阅读历史，永不获得隐藏 Canon 或未来大纲。其帖子、评论、困惑、期待、信任、厌倦、情绪反应、CP 讨论、流失原因和分歧可以形成关于开章钩子、爽点兑现、信息负担、角色行动权、关系化学反应、伏笔可见度和连载疲劳的假设。必须通过多次运行展示方差，并在以后用带来源的真实反馈校准。合成反应既不是市场需求，也不能代替读者。

MiroFish 现有 persona 文本、`sentiment_bias`、`stance` 和普通 graph edge 不能建模男女主感情线。故事世界运行需要 Novel Project 的双向、时间限定 `RelationshipState`：男女主各自的目标、信念、吸引、信任、尊重、亲密、承诺、受伤、怨恨、边界、约定、债务、已知秘密、感知意图和来源事件证据。读者运行另行评价文本是否让这些迁移清晰且合理。两个沙盘都不能把“预测到有 CP 感”或合成偏好变成关系事实。

每次运行读取冻结的已接受 revision，并产出 `SimulationRun` artifact，包含 sandbox 类型、source revision、假设、ontology/persona/model 版本、角色知识 policy、run identity 或 seed、预算、行动/反应 trace、失败、方差和限制。两个沙盘的 store、queue、tool 与 result type 必须分离。仿真可以提出未来场景、缺失反应、后果或 revision；只有正常 Write → review → Accept 事务能够改变手稿或 Canon。

### 证据限制、成熟度与风险

当前 `backend/app` 工作树的外部 Graphify index 支持所报告的 `SimulationRunner`、`SimulationManager`、`ZepToolsService`、`OasisProfileGenerator` 和 `ReportManager` 等静态中心。该图为 `directed:false`，跨模块 link 包含 `INFERRED` edge，且不覆盖 frontend、OASIS 启动脚本和本地 Graphiti sidecar。它不能证明 runtime 调用顺序、并发正确性、隐私、容量、仿真保真度或 README 的“成千上万个 Agent”声明。

实现没有 random-seed 协议、确定性 replay、仿真 branch/fork 比较、手稿 Diff、Canon 事务、工具权限面或作者接受 gate。Task table 与重要生命周期 lock 是进程内的，project/simulation/report 状态常以 JSON 覆写而没有跨进程事务，失败的 graph-memory batch 留在内存。Panorama 会物化完整图。系统有围绕解析、paging、retry、lifecycle、drain 与 prepare 的 mock/unit test，但没有 frontend test、真实 OASIS 端到端 gate、报告事实性评估、鉴权/路径安全套件、负载基准或确定性 replay 套件。

主 Flask application 没有应用级 authentication，并配置 permissive CORS；上游部署默认值与 Docker 暴露可能让它变得危险，而 dirty local branch 把主 bind 改为 loopback，sidecar 增加 loopback、bearer token、常量时间比较和禁用环境 proxy。默认 secret、详细 error trace、大量 prompt/tool/report log、用于文件路径的外部 ID 和临时 report 文件也必须在手稿使用前重构。“Local” 必须是经验证的部署属性，不能从类似 Desktop 的 UX 中假设。

MiroFish 使用 AGPL-3.0。复制、修改或紧密集成其代码或 prompt 可能产生源代码提供义务，包括修改后的网络使用。独立服务是否只是聚合不能由本技术说明保证，需要法律审查。如果目标不采用 AGPL，应通过 Harness capability seam 执行 clean-room 概念重写；另行检查 OASIS、Camel、Graphiti、Neo4j 等依赖许可证。

### 复用边界与目标职责

通过 clean-room 重写 **Adapt** 时序 episode/来源思想、调用方生成 operation ID 与对账、append-only 仿真 action、completion-after-drain 规则、进程内 graph reader lease、角色 interview、search tool 分工、分阶段进度、行动时间线和合成读者 cohort 方法。**Reject** MiroFish 作为 Agent runtime、作者 client、Canon store、relationship model、story-world engine、安全基线，或社交仿真可以预测读者/剧情的证明。未完成来源、许可证、安全和依赖审查前，不执行代码级 **Integrate**。

**目标职责：** MiroFish 只定义 Simulation Lab 概念；Harness 拥有执行与隔离，Novel Project 提供冻结强类型输入，每个 sandbox 拥有反事实状态，其结果只能进入 Results/Review，永不能直接进入 Canon 或 Publish。

## 对比决策矩阵

| 参考 | 最强证据能力 | 证据类别 | 长篇网文贡献 | 决定性限制 | 目标动作 |
|---|---|---|---|---|---|
| DeepSeek Harness | 插件组合 runtime、持久 Session 记录、权限、审批、子 Agent、workflow、provider 与共享 client transport | `[S]` 本地源码；Agent Teams `[X]`；原生 TUI `[—]`；Electron `[P]` | 作者主导与有界自动工作的唯一执行、治理、审计、编排和传输主干 | 无已接受小说模型、章节事务、关系状态、长篇检索策略、仓内 TUI 或原生桌面壳 | **Adopt** 为唯一 runtime 权威；在其上 **Build** 小说 capability seam 与 client |
| Claude Code | 清晰终端交互与分阶段 Agent 工作：stream、Diff、status、resume、fork、rewind、approval、独立审阅与远程 steering | `[B]` 产品行为加 `[S]` 公共资产；核心实现不透明且专有 | 可见进度、备选、正文 Diff、角色状态、分阶段审批和有界远程 steering 的验收行为 | 公共仓库不能证明私有 loop、TUI、Session engine、Desktop bridge 或小说语义 | **Adapt** 行为/工作流语法；可通过受限 provider **Integrate** 官方产品；绝不复制或反推核心 |
| 腾讯 WorkBuddy | Task envelope、Ask/Plan/Craft、Results/Artifacts、Expert/Team、权限、memory、automation 与桌面/移动连续性 | `[B]` 仅官方产品文档 | 任务优先 Desktop 模型、产物优先完成、渐进自治、可配置编辑角色与定时维护模式 | 无可复用实现、TUI、小说 schema、Canon 事务或经证实内部隔离模型 | 在 Harness 所有界面上 **Adapt** 已记录 UX；memory 始终非 Canon |
| Pi | 成熟 `pi-tui`、支持 CJK 的 editor/renderer、差分更新、外部编辑器交接与已验证交互事件路径 | `[S]` 成熟路径；AgentHarness v2 `[X]` 且未完成 | 中文输入、流式正文、Diff、审批、分支和中断恢复的一等终端机制 | 无内置 permission、sandbox、Plan、子 Agent、workflow 或小说语义；其 loop/provider 会重复 Harness | **Adopt** 受维护 `pi-tui`；**Adapt** renderer 模式；**Reject** 重复 runtime/provider 与 v2 底座 |
| OpenFic | TipTap editor、Electron、持久专职 Agent、审批、revision、rollback、分层章节上下文、hybrid retrieval 与小说 Skill | `[S]` 解包产品快照；情绪/关系方法是 `[S]` prompt 方法论 | 主要 editor/Desktop 参考、章节 revision UX、检索 freshness，以及丰富情绪、关系、读者契约和状态方法 | 无 TUI；重复 Python/LangGraph runtime；无强类型故事时间、因果或关系权威；Git 来源未知；prompt 立场强 | **Adapt** 产品行为/方法；来源复核后才选择性复用 Apache 代码；**Reject** 其 runtime 成为第二权威 |
| OpenNovel | 强类型 character、outline、event、causal-link、foreshadowing、authority-context、Critic 和交互逐事件审阅概念 | `[S]` prototype schema 加多条 `[D]` 生产路径 | 故事时间、因果事件、锚定审阅、状态提案和局部修复的最强词汇 | 事务不安全；AutoRunner/MCP/autonomy/retrieval/CI 有缺陷；关系事件不是双向实体 | **Adapt** 重设计 schema/审阅；**Reject** AutoRunner、StateManager、snapshot、MCP write 与当前流水线 |
| MiroFish | 时序 episode、社交仿真、行动时间线、memory-drain barrier、角色 interview、图辅助报告与分阶段仿真 UI | `[S]` 社交仿真源码；本地 Graphiti 路径是 dirty worktree 中的 `[X]` | Simulation Lab 概念，尤其行动来源、合成读者 cohort、采访、时序投影和 drain 纪律 | 不是创作 Agent；Twitter/Reddit 不是因果故事世界；无 manuscript/Canon 事务、确定性 replay、TUI 或审批面；AGPL | 通过 clean-room Harness plugin **Adapt** 概念；**Reject** runtime/Canon 复用；代码集成前法律审查 |

没有一项参考提供完整目标。设计只采用一个 runtime、一个故事权威、一个共享呈现协议和两个非 Canon 仿真沙盘；其他贡献都只是有界实现、行为、创作方法或领域参考。

## 目标能力模型

### 权威与系统边界

目标具有四种明确权威：作者拥有创作意图；task policy 授予有界操作权；Harness 拥有执行与审计；Novel Project 拥有已接受故事事实。全自动不会把创作权转交模型，只会执行已保存作者 policy 中明确列出的箭头、叙事单元、工具、预算、检查、重试和接受决定。

```text
                         AUTHOR = creative authority
                  steer / branch / approve / roll back
                                     |
      Pi TUI ------ same typed Novel Protocol ------ Web / Electron
                                     |
                           Task authority policy
 Ask | Plan | Write | Accept | Publish | scope | budgets | stop rules
                                     |
+------------------------ DeepSeek Harness --------------------------+
| model execution | Session audit | tools | permissions | approvals |
| subagents | workflows | providers | credentials | client transport |
+------------------------------------+-------------------------------+
                                     |
                         Novel workflow Consumers
 Director | Planner | Researcher | Writer | Continuity | Critic
                                     |
                  proposal + diff + anchored typed delta
                                     |
+----------------------- AUTHORITATIVE BOUNDARY ---------------------+
| Novel Project service = sole story authority                       |
| manuscript revisions + canon events + story time + relationship    |
| state + provenance + atomic acceptance + auditable rollback        |
+-------------------------+----------------------+-------------------+
                          |                      |
                rebuildable projections      frozen revision R
                          |                      |
       summaries / FTS / vectors / graph    Simulation Lab
       / context packs / dashboards          |- Story-world sandbox
                                             `- Reader sandbox
                                                  |
                                            proposals only
                                                  X direct canon/publish
```

| 事项 | 目标唯一所有者 | 参考影响 | 不变量 |
|---|---|---|---|
| 创作方向、锁定决定、Profile 和接受 policy | 作者 | 创作特点基准 | 模型可以提出备选，但不能静默改写意图或自行授予权威 |
| 模型执行、工具、权限、审批、Session 审计、子 Agent、workflow、凭据与传输 | DeepSeek Harness | DeepSeek Harness | 其他参考 runtime 不镜像也不拥有这些职责 |
| Task mode 与有界自动化 policy | Harness Interaction 上的 novel task-policy capability | Harness、WorkBuddy、Claude Code | 自动化只能使用预授权箭头，不得扩大范围或隐含发布 |
| 已接受手稿、Canon、故事时间、revision 与审批来源 | Novel Project service | OpenNovel schema 与 OpenFic revision | 这是唯一故事权威；chat、memory、graph、summary 和 `SimulationRun` artifact 永不成为 Canon |
| 人物、情绪与双向关系状态 | Novel Project character/relationship capability | 创作特点基准和 OpenFic 方法；OpenNovel、MiroFish 暴露缺口 | 每项已接受变更都有时间范围、正文锚点，并与手稿 revision 同时提交 |
| 结构化、精确文本、语义、图与摘要检索 | 可重建 Novel Retrieval provider | OpenFic、OpenNovel、MiroFish | 每项结果携带来源 revision 与 freshness；retrieval 从不写 Canon |
| 编辑角色与多 Agent 协作 | Harness workflow、preset 与 subagent | WorkBuddy Expert、Claude 分阶段工作、OpenFic 角色、OpenNovel 词汇 | 角色只产出 proposal 和 issue；只有 Accept 改变项目事实 |
| Terminal 与 Desktop client | Novel TUI 加 Harness Web/Electron 呈现 | Pi、OpenFic、Claude Code、WorkBuddy | Client 只渲染同一协议，不拥有 loop、凭据、工具执行或故事状态 |
| 故事世界与合成读者实验 | 隔离 Simulation Lab provider | MiroFish 概念 | 两者读取冻结 revision、执行独立知识范围，只返回反事实 artifact |
| 导出、外部分享、远程访问与发布 | 面向目的地的独立 output capability | WorkBuddy 与 Claude 远程行为 | Write 或 Accept 权限绝不隐含 Publish 权限 |

### 任务封装与自治模式

产品提供五个需授权阶段。**Ask** 只读，可以检查、检索、比较和解释。**Plan** 可以创建 control pack、大纲、备选、仿真请求、强类型 proposal 和 Diff，但不能修改 draft。**Write** 只能在已授权 project、source revision 与叙事单元范围内生成或编辑 draft。**Accept** 执行改变已接受正文与 Canon 的 expected-revision 事务。**Publish** 预览已接受 artifact 并发送到一个具名目的地。破坏性覆盖、删除、外部分享与发布在所有配置中都保持独立权限。

```text
ASK ------> evidence + explanation
PLAN -----> alternatives + control pack + simulations + diffs
WRITE ----> draft revision + anchored issues + typed proposals
ACCEPT ---> expected-revision check + atomic manuscript/canon commit
PUBLISH --> destination preview + separate authorization

author-led = explicit steering and approval at configured gates
full-auto = pre-authorized subset + fixed scope + budgets + stop rules
full-auto != self-expansion, self-approval, silent canon mutation, or publish
```

每个任务都有稳定 task ID、Harness Session、选定 project 与 source revision、scratch workspace、授权阶段与叙事单元、权限 profile、模型、Skill、Expert、Connector、cost/token/wall-time 预算、重试与重写上限、停止条件、状态和强类型结果 artifact。任务可以并发运行，但 Accept 使用 expected revision identity 并对冲突串行化。Scratch file、浏览器状态、检索上下文、对话记忆与仿真状态都是可丢弃任务输入，不是已接受故事状态。

作者主导是默认模式。作者无需考古 transcript，就能修改 control pack、锁定事实、选择备选、steer 或暂停运行、拒绝任意强类型 Delta、Accept revision、branch 与 rollback。任务完成表示已经产生可审阅 Result Packet，而不只是 Assistant 发出最终消息。Packet 关联分析或 Draft、正文 Diff、Canon Delta、Relationship/Emotion Delta、promise/clue/timeline 变化、anchored Issue、Source、SimulationRun、Export，以及 approval 或 commit 结果。

有界全自动在已保存 policy 下选择同一组阶段的子集。Policy 固定 source revision、授权 volume/chapter/scene、模型与工具权限、章/场景数量、预算、重试、重写上限、确定性 gate、审阅升级、自然收束和是否允许 Accept。没有显式 Accept 时，运行以 proposal 结束；即使明确允许，接受仍使用同一事务，也不能只靠模型为自身输出评分。Publish 永不隐含。遇到 Canon 歧义、locked fact 冲突、source state 过期、反复校验失败、预算耗尽、范围扩大、由作者保留的关系/结局选择，或已完成授权单元时，运行停止。

### 权威项目数据

Novel Project 服务负责已接受的正文和事实，最小模型包括：

- 项目标识、目标读者、主题或戏剧命题、作者 lock 与显式创作 profile，包括升级/冒险、单配对感情第二主线、多主角、群像或无感情线选择；
- 系列、书、卷、故事弧、剧情单元、章、场景、节拍、正文区间、滚动 roadmap、依赖、状态和逐章 control pack；
- 升级层级、能力、证据、限制、克制、资源、代价、奖励、声望，以及每次提升造成的变化；
- 世界规则、嵌套地点、旅行时间、势力、组织、文化、经济、术语、物品、秘密和不可静默修改的 Canon lock；
- 具有 canonical ID、alias、目标、belief、价值、秘密、声音证据、位置、伤势、inventory、knowledge、情绪事件/余波、人物弧阶段和时间限定变化的角色；
- 以 pair 为键的关系线，包括双方目标与方向状态、公开/私人阶段、边界、约定、债务、共同记忆、知识不对称、来源证据和主线影响；
- 强类型故事事件、故事时间点/区间、明确参与者与 effect、因果/关联边、客观真相、各角色 belief、读者知识、hypothesis、clue 与 reveal；
- 具有 open、due、overdue、resolved、abandoned 或 deliberately unresolved 状态的剧情线、承诺、读者契约义务、谜团、伏笔、兑现窗口、张力/释放与结局依赖；
- 正文 revision、替代分支、provenance、approval 或自动 policy 决定、发布状态、rollback 与 audit record；
- Style/voice guide、禁用模式、标题和段落约束、平台 profile、质量阈值、读者反馈证据和仿真 artifact。

确定性 projector 按指定已接受 revision 与故事时间，生成 character、emotion、relationship、progression、world、knowledge、timeline、promise、mystery、plot、ending 与 publication 视图。Session log 记录给模型的精确上下文切片、proposal 输出、工具调用、审批与 commit 结果，但绝不替代 Novel Project 服务。Frontmatter mirror、summary、FTS、vector、graph、dashboard、对话 compaction 与 simulation memory 都携带 source revision 与 freshness，并保持可重建。

### 感情线作为一等项目状态

默认创作 profile 把男女主感情线作为完整第二主线，而不是奖励、人物 trait 或单一好感数字。多主角、群像、非恋爱或无感情线 profile 仍是显式配置选择，不得通过 prompt 漂移静默出现。

```text
RelationshipLine(pair, storyTime)
|- independent objective and agency for each lead
|- public / social relationship state
|- private / emotional relationship state
|- A -> B: perception, desire, trust, boundary, debt, knowledge
|- B -> A: perception, desire, trust, boundary, debt, knowledge
|- attraction, intimacy, respect, commitment, conflict, hurt, resentment
|- promises, breaches, sacrifices, repairs, and unresolved obligations
|- asymmetric knowledge, misreading, concealment, and reveal evidence
|- source scenes, uncertainty, and allowed transitions
|- consequences for decisions on the external main line
`- ending state, aftermath, and deliberately unresolved debt
```

只有来源事件改变至少一名主角知道什么、想要什么、承担什么风险、允许什么、承诺什么或做出什么，并且 proposal 记录另一方状态而不是假定对称时，关系迁移才能被接受。情绪余波会持续影响之后的注意、语言、行动和决定，直到另一项锚定事件改变它。破裂与修复需要原因、代价、问责、行为改变和后果；接近、营救、表白、吃醋、性张力或数值增加本身不能证明持久迁移。关系线拥有卷级与结局节点，接受独立收束审阅，并必须在不抹掉双方独立人物弧的前提下影响外部主线。

`EmotionState` 不等于情感描写。起草与审阅分别追踪角色实际感受、页面中展示或隐藏的文本证据，以及预期或实际观察到的读者效果。Reviewer 报告这三层之间的不一致，但 reader-response hypothesis 不能变成 Canon，也不能授权自动改写。

OpenFic 提供双进度、不对称投入、情绪触发、蓄力、释放、读者反应和避免恋爱工具人的有用方法，但仍是 prompt。OpenNovel 的 `RELATIONSHIP_CHANGE` 与情绪快照结构不足，MiroFish 的 persona、sentiment、stance 与 graph edge 也不提供关系因果。因此该能力必须构建，并在正文旁接受审阅，不能从任何参考继承为现成实现。

### 正文与 Canon 原子接受

任何 Writer、Manager、Critic、extractor、retrieval provider 或 simulation tool 都不得直接写入已接受故事状态。每一项只能针对一个 expected source revision 产出可审阅 Result Packet。

```text
accepted revision R
  -> chapter control pack @R
  -> draft D
  -> anchored review
  -> CanonDelta C
  -> RelationshipDelta L
  -> promise / clue / timeline deltas
  -> reviewable Result Packet
  -> Accept gate
  -> compare expected revision == R
  -> ONE TRANSACTION
       manuscript revision R+1
       + typed canon and story events
       + character / emotion / relationship changes
       + approval or automatic-policy decision
       + source anchors and provenance
  -> commit
  -> invalidate derived projections
  -> asynchronous summary / FTS / vector / graph rebuild

transaction failure -> neither manuscript nor canon changes
rollback -> a new accepted revision restoring both, never erased history
```

权威事务只包含权威正文、强类型 event/Delta、provenance 与 authorization，不包含派生数据。Summary 与 index 通过 recovery marker 异步重建，并明确展示 stale 状态。Accept 遇到过期 expected revision 时直接拒绝，不静默 merge。Rollback 创建同时恢复正文与结构化状态的新 accepted revision，绝不删除解释历史。

### 检索与逐章控制

生成前，workflow 在 accepted revision R 和所需故事时间上构建有界章节 control pack。它包括章节契约、scene beat、相关 plot/promise/progression/world/character/relationship/mystery/reader-knowledge/tension/ending 时钟状态、男女主当前方向关系与情绪余波、伤势与资源、地点/旅行/世界规则、到期兑现和线索、近期正文、远距证据与摘要、声音/风格约束、locked fact 和未决冲突。每一项都标明相关原因与来源。

结构化 query 回答精确 entity、fact、指定时间状态与依赖；全文搜索回答精确短语、姓名、标题与声音证据；vector retrieval 提出主题或语义相似项；graph traversal 提出因果、关系与知识路径；summary 按距离分配上下文。每个结果携带 project、accepted revision、source range、retrieval method、推断 confidence、content hash 与 freshness；过期 graph、vector 与 summary 结果被拒绝或显式标记，也绝不压过直接已接受证据。

生成后，独立 extractor 与 reviewer 生成候选 event/Delta，针对来源段落与当前 revision 校验每项声明，展示 anchored Issue 与正文 Diff，但不修改已接受状态。长时间运行可在显式 policy 下减少中断，但每个单元仍构建 control pack、执行连续性/质量 gate、限制重写升级、记录每个 Result Packet 与 acceptance，并在自然收束或配置安全条件处停止。

### 隔离 Simulation Lab

Simulation 是可选分析，不是强制章节生成步骤。两个 sandbox 都读取一个冻结 accepted revision，只写 `SimulationRun` artifact，其中包括 source revision、sandbox 类型、假设、完整配置与 ontology/persona/model/dependency 版本、knowledge policy、run identity、支持时使用的 seed、预算、行动/反应 trace、失败、方差、限制与派生报告。

```text
                         accepted revision R
                                  |
                   frozen, read-only simulation input
                    +-------------+-------------+
                    |                           |
          STORY-WORLD SANDBOX          READER-REACTION SANDBOX
          typed world and events       presented manuscript only
          role-scoped knowledge        cohort + reading history
          goals and resources          no hidden author truth
          causal counterfactuals       response hypotheses
                    |                           |
          candidate consequences       confusion / anticipation /
          missing reactions            trust / boredom / fairness
                    +-------------+-------------+
                                  |
                      SimulationRun artifacts
                                  |
                    author or policy review
                                  |
                 optional future draft proposal
                                  |
                       X no direct canon write
                       X no direct publication
```

故事世界 Agent 作为世界居民推理，只能访问该角色在仿真故事时间可获得的 fact、belief、resource、location、capability 与 relationship。Action 有强类型 precondition/effect，只修改 fork 后的反事实状态。Reader Agent 只收到当时已经呈现的手稿与配置阅读历史，绝不收到隐藏 Canon、未来大纲、作者意图或故事世界私有状态。两个 sandbox 使用分离的 store、queue、tool namespace、identity type 与 output，因此角色知识不会从全知真相泄漏，合成偏好也不会变成故事事实。

实现顺序是先故事世界、后读者反应。前者迫使 Canon、故事时间、角色知识、目标、资源、关系状态、action、branch 与 replay 变得精确；后者只有在呈现文本 revision 和真实读者反馈都带 provenance 后才有意义。MiroFish 为时序行动账本、interview、graph-reader lease、进度 UI 和 memory drain 后完成提供启发，但其社交 environment 不提供故事世界因果。故事世界 run 记录强类型 action trace，即使 action 生成存在变化，也能确定性 replay 状态迁移。读者实验按相同实验定义重复运行并报告分布与方差；两个 sandbox 都不声称 LLM 生成可以逐 token 确定性重放。两者都只返回 proposal，也绝不代表真实市场需求。

### 工作流角色

WorkBuddy 对能力、角色与团队的区分应保持显式：Skill 提供一项有界操作，Expert 组合指令、方法、模型策略与允许的 Skill，Expert Team 则是负责拆解并整合工作的 Harness workflow。初始 Expert 集应由 Harness preset、子 Agent 和 workflow 实现，而不是写死在 loop 分支中：

1. **Director** 确定本轮创作目标、约束、节奏和审批策略。
2. **Planner/Composer** 提出类型化卷、章、场景和节拍方案。
3. **Researcher** 只检索相关 Canon、正文片段和可选外部资料。
4. **Writer** 生成 draft 或局部改写，不直接修改 Canon。
5. **Continuity Manager** 生成带原文锚点的类型化 event 与状态 proposal。
6. **Character/Relationship Editor** 检查男女主双方行动权、方向状态、情绪余波、合理迁移、边界、约定、破裂/修复、声音和主线后果。
7. **Promise/Mystery/Ending Editor** 审计读者契约债、兑现窗口、线索、知识公平、伏笔，以及向卷末和全书收束的进度。
8. **Critic/Reviewer** 报告人物、因果逻辑、主题、原创性、正文、风格、标题、段落和平台约束方面的原文锚定 Issue。
9. **Simulation Analyst** 配置隔离 sandbox，声明假设与 knowledge policy，比较重复运行，并把反事实 trace 转换为有限假设。
10. **Editor-in-chief** 解决冲突 proposal，并在 policy 要求时请求作者输入。
11. **Committer** 执行原子 accepted revision 并令派生 index 失效；它不生成正文，也不自行批准。

快速模型可以分类、检索、总结和抽取，强写作模型可以规划和生成，独立模型可以审阅。模型分工属于配置，不是领域不变量。

定时自动化可以备份项目、重建索引、执行连续性审计、准备研究摘要并生成导出预览。每个 job 都需要 identity、workspace、权限 profile、时长与成本预算、并发策略、停止条件和审计记录。默认不得接受 Canon 章节或向外发布。

### 共享呈现协议

两个主要客户端消费相同的强类型状态与动作：task 与 Agent started、needs-input、paused、failed 或 finished；reasoning 摘要；工具 proposed/running；子 Agent 活动；control pack 与备选；正文 Diff；anchored Issue；Canon、Character、Emotion、Relationship、Promise、Clue、Timeline 与 Ending Delta；冲突；审批；revision commit 或 rollback；compaction；index stale/rebuilt；SimulationRun；artifact 和后台 job 进度。

Desktop 布局把协作与交付物分开。持久 Results 区展示 Draft、Diff、Canon/Relationship/Emotion Delta、Issues、Sources、Simulations、Exports 和接受决定；对话区负责解释决定与接收 steering。用户无需搜索 transcript，就能检查每项 artifact、source anchor、freshness marker 与 policy。

TUI 应成为基于 `pi-tui` 的一等 `dsh --profile novel-tui` bundle。宽终端可同时显示项目树、中央 transcript 或正文 Diff，以及可切换 control/Agent/Canon/relationship/approval/simulation 面板；窄终端把侧栏折叠为可搜索 overlay。必需交互包括 CJK IME、宽字符正确性、鼠标和键盘导航、长行换行、保留 scrollback 的输出、章节与分支搜索、外部编辑器接管、排队 steering、审批对话框、可见 source revision 和可访问状态文本。

Desktop 产品应通过 client plugin 与 slot 扩展现有 Harness Web client，再把同一 client 用于 Electron carrier。主要工作区可以沿用 OpenFic 已验证的三栏结构，同时增加受 WorkBuddy 启发的 Results 区、十时钟 dashboard、强类型 timeline、方向 relationship line、emotion residue、plot/promise/foreshadow/ending 视图、revision history、task/subagent 视图、两个明确标注且相互隔离的 simulation panel、Diff acceptance、项目 backup/migration 和本地 runtime diagnostics。Electron 负责进程生命周期、IPC transport、文件选择、备份和更新；renderer 不保存凭据，也不拥有工具或 commit 权威。

可选移动端或 IM companion 可以显示任务状态与产物、接受或拒绝有界 proposal、发送 steering 并暂停工作。远程访问、云存储、通知与正文同步均为 opt-in 能力，必须显示数据目的地；移动端不是主要长文编辑器。

## 提案

在不修改核心 Agent Loop 的前提下，建立小说 capability family、两个主要 client profile 和可选 Simulation Lab provider。

Capability family 应为项目存储、故事时间与强类型 Canon event、character/emotion/relationship state、promise 与 knowledge、确定性 projection、revision transaction、上下文组装与检索、质量检查、workflow 组合、simulation、读者反馈、导入导出与共享呈现数据提供完整的 Service Definition、Provider 与 Consumer 角色。随部署变化的 profile、阈值、上下文预算、模型、审阅深度、题材与关系规则、approval/acceptance policy、仿真参数和自动运行限制应成为经过验证的配置字段，而不是硬编码常量。

建议实施顺序是：

1. 定义 project/task/Result Packet、层级、control-pack、manuscript revision、story-time event、character/emotion/relationship、progression/world、promise/clue/knowledge/ending、source-anchor 和 proposal schema。
2. 实现唯一权威本地 store、expected-revision 原子接受、确定性时间限定 projection、provenance、branch、rollback、recovery 与派生数据失效。
3. 增加 Ask、Plan、Write、Accept 与 Publish policy、任务级 workspace、权限升级、作者 lock、有界自动化 policy 和 artifact 呈现。
4. 交付单章闭环：重建 control pack、比较备选、生成 draft、执行锚定 continuity/relationship/promise/prose 审阅、产出强类型 Delta、审批、原子 Accept、replay，并从注入失败恢复。
5. 增加分层 summary、structured/full-text/vector/graph retrieval、来源与 content hash、revision/time/freshness 检查、可恢复 job 和有界定时维护。
6. 组合 Skill、专职 Expert、Expert Team workflow、有界子 Agent、多模型路由、渐进自动化、可见预算、升级与自然收束 safeguard。
7. 交付基于 Pi 的 TUI profile，扩展 Web client，再增加 Electron carrier；覆盖 CJK、宽字符、Diff/Delta/Results、审批、resume、branch、resize、loopback 隔离、backup、migration 和 recovery。
8. 先增加 TXT 与 Markdown 交换，再增加 EPUB 与 DOCX，并覆盖 round-trip、编码、accepted-revision、provenance 与外部目的地审批测试。
9. 在冻结强类型状态上构建故事世界 sandbox，包含角色范围 knowledge、action precondition/effect、fork/run identity、完整配置与版本 provenance、强类型 trace、确定性状态迁移 replay、生成方差、预算与 proposal-only result。
10. 只有在 presented-text revision 与真实 feedback provenance 已存在后才增加读者反应 sandbox；隔离 cohort 与隐藏 Canon，比较重复运行，谨慎校准，绝不根据合成偏好自动优化手稿。

第一条 vertical slice 不应尝试完整自主创作一部长篇或执行仿真。它应完成：打开一个项目，创建或导入强类型 Canon 与一条 pair-keyed relationship state，规划一章，生成 draft，识别锚定 continuity/prose/relationship Issue，在 TUI 与 Web 中展示正文 Diff 和 Canon/Relationship/Emotion Delta，逐项接受或拒绝，原子提交一个 revision，通过可审计 revision 恢复与 rollback，恢复 Session，并从已接受状态重建下一章 control pack。

## 已考虑的替代方案

### 以 OpenFic fork 作为产品底座

OpenFic 已有最强的编辑器和桌面产品，但这样会让 Python、LangGraph、其模型注册表、Session、权限和存储成为运行时权威，DeepSeek Harness 则退化为二级集成，且小说状态仍缺少强类型。把选定行为移植到 Harness 可以保留一个控制面。

### 以 Pi 作为完整底座

Pi 提供最适合复用的 TUI、成熟 Session 和能力较强的通用 Agent，但它有意不内置权限、sandbox、子 Agent 和 plan/workflow 策略，新 durable harness 也尚未完成。用 Pi 取代 Harness 会丢掉既定底座已经拥有的能力。

### 以 OpenNovel 作为领域运行时

OpenNovel 的 schema 和 workflow 词汇有价值，但 snapshot、event、approval、autonomy、MCP、retrieval 与 CI 缺陷使其无法成为生产权威。用类型化 Harness service 重写其最佳概念，比包装 AutoRunner 更安全。

### 把 Claude Code 当作实现依赖

本地仓库没有核心实现，也没有开源许可。其 UX 与插件约定仍值得参考，Harness provider 也可把官方产品作为可选子 Agent 调用，但它不能提供目标 TUI 或 Desktop 代码。

### 把 WorkBuddy 当作实现依赖

现有证据只能确定 WorkBuddy 的产品行为，无法确定本架构可复用的内核、源码许可、嵌入 API 或受支持集成 SDK。依赖其私有桌面运行时还会分裂任务状态、权限、凭据和未发布手稿的保管责任。应在 Harness 所有的接口上重写其设计模式。

### 采用 MiroFish 作为仿真运行时

MiroFish 已能接入长材料、运行多个社交 Agent、更新时序 graph memory 并生成报告，但其 ontology 与 action 建模的是社交账号，不是因果故事世界。它缺少冻结 Canon 输入、确定性 branch、knowledge 隔离、正文审阅与作者接受，直接复用还带来 AGPL、安全和重复 runtime 问题。Clean-room 重写有界生命周期概念可以保持单一权威，并让两个目标 sandbox 使用 Novel Project 的强类型状态。

### 用 adapter 同时运行所有参考系统

Adapter 会保留多套 Agent loop、模型注册表、凭据、Session history、审批语义和小说存储。发生故障后，没有唯一答案能说明实际运行了什么、模型看到了什么、当前故事事实是什么。目标架构应为每项职责指定一个所有者，只移植有界组件或概念。

## 验收标准

- 仓库文档明确区分审阅到的能力是已交付、实验性、只有行为记录、规划中或有缺陷，不把 roadmap 当成当前实现。
- Ask 只读，Plan 不能写，Write 只在授权范围内处理 draft，Accept 需要 expected revision 与 policy，Publish 指定目的地与独立 authorization。破坏性操作、删除、外部分享与发布绝不继承 Write 或 Accept 权限。
- 每个并发 task 都有隔离 scratch workspace、稳定 identity、source revision、叙事单元范围、预算、停止规则、状态、provenance 与强类型 Results。UI 把 Draft、Diff、Canon/Relationship/Emotion Delta、Issues、Sources、Simulations、Exports 与接受结果和 transcript 分开展示。
- 小说 profile 使用现有 Harness Agent Loop、Session、permission、approval、provider、subagent、workflow 和 credential capability；不需要第二套通用 runtime、Session authority、provider registry 或 approval plane。
- Novel Project 是已接受 manuscript、Canon、故事时间、关系/情绪状态与审批 provenance 的唯一权威。对话 summary、frontmatter、graph、index、模型抽取、feedback 与 simulation 始终是派生证据或反事实 artifact。
- 层级和十个时钟——plot、promise、progression、world、character、relationship、mystery、reader knowledge、tension/payoff 与 ending——可以按 accepted revision 和故事时间投影，并带来源证据与开放债务。
- Chapter Result Packet 携带 source anchor、expected revision、正文 Diff、强类型 Canon/Character/Emotion/Relationship/Promise/Clue/Timeline Delta、anchored Issue、policy decision 与 approval state。Accept 原子提交所有内容；拒绝或事务失败时全部不变。
- 默认男女主 profile 存储以 pair 为键、双向、时间限定的 relationship line，包含双方目标、行动权、公开/私人阶段、边界、信任、亲密、承诺、冲突、约定/债务、不对称知识、来源事件、合法迁移、主线后果与结局状态。其他关系 profile 必须显式选择。
- 情绪状态由 event 派生并锚定来源，保留 trigger、对象、评价、表达/掩饰、强度、余波与下游选择；单一数值或 trait summary 不得静默替代它。
- Rollback 通过新的可审计 revision 同时恢复正文与结构化状态，并让旧历史仍可恢复。
- 进程重启、Session compaction 或更换客户端后，仍可根据已接受项目状态与已记录 retrieval provenance 重建下一章上下文。
- 随仓库交付、可安装的 `pi-tui` profile 正确处理 CJK IME 与宽字符，提供项目导航、source revision、进度、Diff/Delta、审批、子 Agent、branch、外部编辑、resume、simulation artifact 与中断恢复，但不拥有业务状态。
- Web client 提供相同协议与 Results。后续 Electron shell 复用 Web client，不把凭据、工具执行、commit 权威或项目真相移入 renderer；移动端 companion 仍受显式远程 policy 约束。
- 有界自动化固定 source revision、stage、叙事单元、模型/工具、预算、重试/重写上限、确定性 gate、reviewer escalation、停止条件与是否允许 Accept；它不得扩大范围、自行授权或 Publish。
- Retrieval 区分 structured、exact-text、semantic、graph 与 summary source；每个结果都携带 source range、revision/time identity、method、hash 与 freshness，过期派生 index 不得静默使用。
- 故事世界 sandbox 首先从冻结强类型状态运行，包含角色范围 knowledge、action precondition/effect、fork/run identity、可重复性、可见方差与 proposal-only output；后续 reader sandbox 只看已呈现文本。两者的 store、identity、tool、queue 与 output 隔离，均不能写 Canon 或 Publish。
- 真实 reader feedback 与 synthetic-reader reaction 使用不同 provenance 与 confidence。合成结果绝不声称市场代表性，任何 engagement metric 或仿真 objective 都不能自动改写主线。
- 测试覆盖 schema、合法/非法 relationship 与 emotion transition、确定性时间投影、无效 proposal、transaction failure、crash recovery、rollback、stale retrieval、permission denial、自动化 stop、sandbox knowledge leakage、repeat run、workflow lifecycle、TUI rendering、Web presentation、两套 SDK projection，以及一个无需 API key 的端到端 project replay。
- Novel Project 存储默认位于本地；每个网络 model、远程访问路径和稿件数据目的地都必须显式配置，并在使用前披露。Telemetry 只有用户 opt-in 才开启，Electron 与 Web 开发默认只绑定 loopback，云知识库、移动同步、Connector、第三方 Skill 与 MCP 目的地需要单独授权。
- 复用 Pi 或 OpenFic 源码时保留许可声明；不得复制 Claude Code 或 WorkBuddy 实现；除非明确 AGPL 与法律决策授权，否则只对 MiroFish 概念进行 clean-room 重写。

## 风险

- OpenFic 和 OpenNovel 目录没有 Git 元数据，准确上游 commit 与本地改动未知。复制源码或依赖其行为前，应以固定上游 commit 重新核验。
- WorkBuddy 只依据官方产品文档审阅，其实现、隔离保证、扩展边界、复用权利和未来行为都未经验证，并可能独立于本设计发生变化。
- 已审阅的 MiroFish checkout 位于脏的 `local/graphiti-memory` 分支，其中本地图记忆路径是未提交实验工作。把任何此类行为视为已发布能力前，必须另行固定并审阅干净的上游 revision。
- MiroFish 使用 AGPL-3.0，其传递依赖的 simulation、graph 与 database 组件还有各自许可。默认采用 clean-room 概念改写；任何代码复用、修改后的网络服务或紧密集成都需要留下产品与法律决策记录。
- 自动对话记忆、云知识库、移动同步和第三方扩展可能泄漏未发布文本，或让陈旧摘要成为误导上下文。它们必须 opt-in、按权限限定、可检查，并位于小说 Canon 之外。
- Pi 与 DeepSeek Harness 都在快速演进。依赖 Pi 的私有或实验性内部实现会造成不必要的适配波动；只依赖固定的公共 TUI surface，或按明确 procedure vendoring。
- 正文 revision 与领域 event transaction 可能涉及大内容和多个派生 job。设计需要把小而权威的 commit 与异步摘要、索引重建分离，同时保留恢复标记。
- 模型抽取可能虚构事实或遗漏隐含变化。类型化 schema、source anchor、确定性校验和审批可以降低风险，但不能替代编辑判断。
- 丰富的 relationship schema 可能把亲密关系变成机械计分，或固化题材刻板印象。各维度必须仍是有证据的编辑状态，profile 可配置，并由作者判断 proposal 中的迁移是否构成叙事事实。
- 多模型和多 Agent workflow 会增加成本、延迟与上下文增长。预算与分阶段升级必须可观察、可配置。
- 全自动可能放大错误前提、反复改写已批准内容，或让同一模型审批自己的工作。必须固定 scope、锁定 source revision、设置独立 gate 与 retry ceiling，并保证 Publish 不可自动化。
- 故事世界 simulation 可能把全知信息泄漏给角色，synthetic-reader simulation 也可能产生很有说服力却不稳定的共识。输入隔离、多随机种子、可见方差、对抗性泄漏测试与 proposal-only output 可以降低但不能消除虚假信心。
- 合成反应可能被误当成真实 reader evidence，或被优化成公式化 engagement。必须分开 provenance，只用取得同意的真实 feedback 做校准，且绝不能让 proxy metric 授权正文变更。
- 终端富文本编辑存在实际限制。TUI 必须集成外部编辑器，不应模仿全部桌面编辑能力。
- Electron 会扩大更新、IPC、文件系统和 renderer 攻击面。进程职责、loopback binding、CSP、导航限制和凭据隔离需要单独安全审阅。
- 中文输入法、全角标点、Unicode 宽度、超长段落、大章节树和 Windows 进程恢复都是高风险客户端路径，需要 fixture 和真实平台测试。
- 题材专用 prompt 可能抹平作者声音。创作 profile、Canon lock、显式 style rule 和 anchored local repair 必须优先于通用“去 AI 味”。
- 大规模图和向量检索可能产生看似合理但非权威的联系。界面必须把每项推断与已接受 Canon 清楚区分。

## 压缩后的续作上下文

- **目标：**基于 DeepSeek Harness 构建具有一等 TUI 和桌面客户端的中文网文小说创作 Agent。
- **产品姿态：**默认采用作者主导的共同创作；有界全自动只是可选项，且绝不能自行扩大权威。
- **作者权威：**作者拥有意图、风格、Canon 接受、关系事实、自动化 policy 与发布权。Agent 只产出证据、备选、proposal、检查与可审阅 artifact。
- **固定 runtime 所有者：**DeepSeek Harness 独占 loop、Session、工具、权限、审批、provider、subagent、workflow、credential、policy enforcement、audit 与客户端传输。
- **项目真相：**独立 Novel Project 服务独占已接受正文 revision、类型化 Canon event、故事时间、十时钟 projection、角色 knowledge、relationship/emotion state、promise、clue 与 approval provenance；summary、graph、index、feedback 与 simulation 都是可重建或非 Canon artifact。
- **七项参考职责：**DeepSeek Harness 是 runtime 与治理底座；Claude Code 是不透明的行为和 workflow 标杆；WorkBuddy 提供文档可证的任务优先桌面与 Results 模式；Pi 提供 `pi-tui` 与事件驱动 UX，而不是第二套 loop；OpenFic 提供小说编辑器、审批、revision、retrieval 与 prompt 级创作方法；OpenNovel 提供领域词汇与质量概念，而不是其有缺陷的 runtime；MiroFish 只提供 clean-room 的时序图、action ledger、interview、reader cohort 与 simulation lifecycle 概念。
- **客户端事实：**DSH 当前交付 Web 与 headless，但没有仓内 TUI 或 Electron；Pi 有 TUI 而无 desktop；OpenFic 有 Web 与 Electron 而无 TUI；OpenNovel 提供 Rich CLI/MCP 而不是作者工作台；本地 Claude 仓库没有 core 与 Desktop 源码；WorkBuddy 文档记录了 desktop 与 remote companion，但没有可复用 core 或 TUI；MiroFish 交付分阶段 Web simulation UI，而不是 TUI 或 manuscript-authoring client。
- **任务模型：**Ask 只读，Plan 提出方案，Write 修改 scratch draft，Accept 是唯一的已接受正文/Canon mutation 边界，Publish 是独立显式权威；每个任务都展示 source revision、scope、policy、progress、Draft、Diff、类型化 Delta、Issue、Source、simulation artifact 与 approval state。
- **原子性边界：**Accept 在一次 expected-revision transaction 中提交 manuscript、Canon/Character/Emotion/Relationship/Promise/Clue/Timeline event、provenance 与 authorization；拒绝或失败时全部不变，派生 index 工作在之后运行并带 recovery marker。
- **关系与情绪边界：**默认男女主关系是一条完整、双向、时间限定、有来源锚点的第二主线，包含双方行动权并影响主线。情绪由 event 派生，保留 trigger、appraisal、表达或掩饰、余波与选择；两者都不能退化成无依据分数。
- **Simulation 边界：**故事世界与 reader-reaction sandbox 消费冻结的 accepted revision，使用彼此分离的 identity、knowledge、store、tool、queue 与 result type，只能产出反事实 proposal 或合成 hypothesis。先构建故事世界 simulation，后构建 reader simulation；两者都不能写 Canon 或发布，synthetic reader 也绝不能冒充真实读者。
- **MVP 流程：**accepted control pack -> draft proposal -> anchored critic -> typed state proposal -> Diff/Delta review -> atomic Accept -> projection 与 index invalidation -> 可复现的下一章上下文。
- **MVP 客户端：**基于 `pi-tui` 的仓内 profile 与现有 Harness Web client 消费相同的类型化 protocol 与 Results；完成 Web vertical slice 后再增加强化的 Electron shell，且后者不拥有 execution 或 project state。
- **自动化边界：**有界 run 固定 revision、scope、stage、narrative unit、model/tool、budget、retry/rewrite ceiling、reviewer、stop condition 与是否允许 Accept；它不能自行授权、扩大范围或 Publish。
- **不可妥协项：**模型可见上下文必须记录；只有 Novel Project 拥有真相；rollback 同时覆盖正文与结构化状态；过期 retrieval 和 inference 必须可见；relationship 与 emotion 变更携带证据；sandbox knowledge 不得泄漏；CJK 与 Windows 是一等平台；Novel Project 存储默认位于本地；每个网络 model、远程路径和稿件目的地都必须显式配置并授权；telemetry 采用 opt-in。
- **已知陷阱：**不要运行多套 loop，不要把 Session 或自动记忆 summary 当 Canon，不要复制不透明的 Claude/WorkBuddy 实现，不要采用 Pi AgentHarness v2，不要嵌入 OpenFic Python runtime，不要包装 OpenNovel AutoRunner，不要把 MiroFish 社交环境等同于因果故事世界，也不要让 graph/model/simulation output 静默变成事实。
- **下一项设计任务：**先规定 Novel Project event 与 revision 模型和单章事务式接受协议，再实现 TUI 或 Electron 代码。
