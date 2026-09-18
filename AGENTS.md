# Repository rules for novel-agent

本文件适用于仓库中的所有文件。用户当轮明确指令优先；在不冲突时，本文、规格、计划与架构文档共同约束实现。

通用规则参考全局 `~/.claude/CLAUDE.md` 与 `~/.codex/AGENTS.md`。

当前实施路线以 `tasks/plan-final.md` 与 `docs/plugin-design-v3.md` 为准。`tasks/plan.md`、`README.md`、`tasks/todo.md` 和 `docs/architecture.md` 中的单插件描述用于理解迁移前实现，不再限制领域插件拆分；迁移顺序与既有证据见 `tasks/history-migration-audit.md` 和 `tasks/history-migration-todo.md`。

## 每次开始工作前

1. 完整阅读本文件、`tasks/plan-final.md`、`docs/plugin-design-v3.md`、`tasks/history-migration-audit.md`、`tasks/history-migration-todo.md`、`README.md`、`tasks/todo.md`、`docs/architecture.md`，并清点后完整阅读仓库内现有报告、规格、计划和产品代码；不要只依赖摘要。对当前切片再重读直接相关的 DSH/社区宿主/社区插件源码、规格段落与测试。只有切片实际触及凭据、外部输入或系统能力等信任边界时，才把 `docs/security-threat-model.md` 作为该切片的必读材料。
2. 运行只读的 `git status --short` 与相关 diff，识别并保留用户和其他协作者的现有修改。
3. 从根 manifest、唯一 lockfile、CI 和现有测试发现真实工具链与命令；不得猜测默认命令。
4. 对 DSH、社区 Desktop 和候选社区插件行为，先在其只读源码、发布包、测试和架构说明中查证；框架用法再查官方文档。正常上游功能直接复用，不为其重写补丁或替代实现（唯一例外是「DSH 唯一内核」列明的 Session 恢复补丁）。
5. 按 `tasks/plan-final.md` 和 `tasks/history-migration-todo.md` 选择一个依赖已满足的小任务，以 `tasks/todo.md` 核对既有行为和验证证据；一次只推进一个 RED → GREEN → REFACTOR 增量。

## 写入边界

- 自主开发、适配层、补丁、复制代码、生成文件和文档写入当前或用户指定的 `novel-agent` 工作区，不限定盘符；用户已允许使用 C 盘。
- DSH 上游及 Codex、Claude Code、Pi Agent、OpenClaude、MiroFish 等参考仓库一律只读，实际位置以本机发现结果为准。产品运行时基于 DSH，其他 Agent 仅作设计与实现参考。
- `anywhere-labs/deepseek-harness-desktop` 社区宿主及所有引入的社区插件也是只读上游；不得在其 checkout、安装目录或用户 Profile 中开发产品代码。隔离兼容性 smoke 只能写入临时 DSH_HOME/Profile，产品适配仍只写本仓库。
- 不修改 `graphify-out`，除非用户单独授权其再生成。
- 不修改规格原文或 `.i18n.yaml` 清单，除非用户明确要求维护规格；发现漂移只报告。

## DSH 唯一内核

- 所有投入产品路径并由 novel-agent 解析的 DSH npm 包必须精确为 `0.1.2-rc.1`（用户 2026-09-08 明确选定，取代原 rc.2 限制；见 [采用记录](docs/open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md)）。不得混用已解析的 DSH 版本或依赖 dist-tag。若某依赖需要更换版本或引入 alpha，先取得用户明确授权并记录证据，不在本规则内自行升级。
- 实际运行 DSH 的 Host 与所选 Profile 必须应用本仓库维护的 `@deepseek-ai/dsh-session@0.1.2-rc.1` 补丁（见 [`patches/README.md`](patches/README.md)）。该补丁给公开 `Session.append` 增加仅用于 log-only 事件的可选 `{ ignorable: true }`，并给 `SessionStore` 增加进程级共享注册表的 `registerLogEventType`（供 required 的 `novel/automation-policy` 声明）；`{ ignorable: true }` 本项目只有 `novel/canon/accepted` 与 `novel/canon/rolled-back` 使用。这是用户已授权的例外；除它之外，仍不得为 DSH 正常生命周期行为写 novel-agent 补丁。
- 不 fork 或复制 Agent Loop，不添加 novel-agent 专用 Agent Loop 分支。
- 不建立第二套 Agent、Session、Workspace、事件、审批、权限、设置、凭据、插件或 Remote/Gateway 体系。
- `@novel-agent/novel-project` 保留为唯一 Canon、Result Packet、Revision 与接受/回滚核心；Planning、Writing、Memory、Review 和可选 MiroFish 按最终计划拆为领域插件，通过 DSH 原生 Service、SessionEventMap 与 Remote 联动。
- **小说模式的前端层由 novel-agent 拥有（用户 2026-09-16 决定）**：`@novel-agent/novel-workbench` 作为
  bundle 层注册 DSH 的 root occupant，自研全部可见面（左栏、主画布、右栏、底部输入、设置页、审批、
  进阶面）；不 fork 上游包、不改 transport、不改宿主生命周期，Host 仍由 `dsh-base + dsh-web-app` 提供。
  通用的 Sidebar/TUI/Profile/Bundle 行为继续复用上游。
- 第三方组件只实现具体能力，必须包在可替换的 DSH seam 后；第三方状态不得成为产品事实来源。
- `SessionEventMap` 与 DSH 事件溯源负责需要模型可见、审计、回放或跨重启恢复的事实。Client Runtime 只持有选择、hover、pane 尺寸、临时输入等纯 UI 瞬时状态。
- Worktree 属于 Desktop/Profile/部署层；不得改变 Agent Team 共享 cwd 的 DSH 核心语义。

## 社区 Desktop 与 transport 规则

- 产品 Desktop 宿主复用 `anywhere-labs/deepseek-harness-desktop`。最后完成验证的组合是 Release `v2.0.2`（tag commit `9d18856ddea4f20eb3ef8c88b0436921c6b19606`，MIT）；当前目标版本为 `v2.0.5`，尚未安装或验收，在完成隔离 smoke 之前不得写成已验证。novel-agent 不再拥有 Electron bootstrap、窗口、托盘、Profile Manager、原生 operator terminal、更新、市场或发行安装器。
- 直接复用社区宿主的正常 DSH Host：`dsh-base + dsh-web-app + selected Profile`，以及它绑定 `127.0.0.1` 临时端口的 loopback HTTP/WebSocket carrier。不得恢复自建 `novel-agent://`、preload/IPC carrier、零端口断言或第二套 server/transport。
- 复用 DSH Client Runtime、动态 client plugins 和 Slots；小说领域插件通过已发布 DSH seam 接入。
  **可见面与不可见服务分界（H1）**：所有看得见的界面——包括 Cordis、插件、Agent preset、Jobs、
  Subagent 与诊断面板——都由 novel-agent 自己渲染；不可见的客户端服务（会话装配、输入状态机、
  草稿/队列、图片缓存、设置命名空间、theme runtime、传输与模块系统）继续复用官方实现，不重写。
- 社区 Desktop 只跑 **compatibility 模式**：它作为独立 frame 叠加在官方 Web 表面之上；extended /
  enhanced 模式会接管 root 与 `ui-layout` 行，与小说模式的 root occupant 互斥，不得同时宣称可用。
- 不为社区宿主或 DSH 的正常窗口、终端、Profile、transport、设置、插件市场和生命周期行为写 novel-agent 补丁或重复实现。只有可复现的小说领域/Session 内能力缺口才进入本仓库。
- Desktop 验收使用全新隔离 DSH_HOME/Profile 的真实安装、解析、启动和 UI smoke。不得修改用户全局 `.dsh`，也不得把上游宿主测试复制成本仓库产品实现。

## 功能优先与社区插件组合

- 当前优先级是实现并组合全部真实可见功能。安全工作只做实际信任边界和上游运行所必需的最小部分；额外 hardening、安全专项和已退役 carrier 修复不得阻塞功能增量。
- 对已由 DSH、社区 Desktop 或成熟社区插件提供的通用能力，直接原样复用；README 列明用户需要下载的插件和精确版本，novel-agent 不为这些通用表面再写 adapter、wrapper 或替代前端。遗留测试若只断言已退役的自建 Electron/IPC/Forge 路线，应在确认失效后删除，不得为保住旧测试恢复旧架构。
- Web/Desktop 用户按需独立安装 `dsh-better-sidebar`、`@anweat/dsh-browser`、`dsh-web-search-pro` 和 `dsh-file-upload`；TUI 用户独立安装 `@xmoon76/dsh-pi-tui`；开发者可选安装 `dsh-git-worktree`。这些都是外部下载项，不进入 novel-agent 的依赖、聚合 Profile、Bundle 或安装器。兼容性声明必须来自全新隔离的当前目标版本 Profile（且已应用上文 DSH Session 补丁）的真实 install/load/UI 或 TUI smoke，README 和 peer range 不能替代运行证据。
- novel-agent 不为 Better Sidebar 注册重复 tab/viewer，也不创建 Pi TUI extension 只显示状态。Result Packet、Canon 审阅与其他不可替代的小说交互由小说模式前端层（`@novel-agent/novel-workbench`）呈现。卷、章、场景、人物、关系、情绪、伏笔、线索、时间线和结局进度仍经 Novel Project Canon 接受；领域投影与社区插件不得建立平行事实源。
- `dsh-mnemon`、`dsh-memento` 等记忆/检索插件只能作为可重建派生 Provider。社区任务板、Agent Teams、独立小说状态库、无兼容许可证或重复 workbench/TUI/transport 的插件不进入产品组合。

## 凭据和模型边界

- 凭据值只存在于 DSH Credentials seam 后的 Host/provider 或 OS credential store。renderer 只能看见经过筛选的状态/引用，永远不能读取 secret material。
- 不把密钥、Token、Cookie、系统 prompt、其他用户数据或本机配置写入普通模型可读文件、SessionEvent、日志、错误、截图或测试 fixture。
- 模型输入、输出、网页、workspace 文件和第三方 bundle 都是不可信数据。系统 prompt 不是权限边界；工具参数在 Host 端验证，危险或不可逆操作必须使用真实 DSH approval。
- 当前 DSH `trusted-host` 不是身份认证。没有完成认证、授权、审计和负面测试之前，禁止把未来的自托管 Gateway/Runner 暴露公网。

## 严格 TDD 与增量实现

每个行为变更都遵循以下顺序：

1. **RED**：先写一个描述可观察行为的 focused test，运行并保存预期失败原因。测试若首次就通过，先证明它能捕获缺口。
2. **GREEN**：只实现让该测试通过的最小产品代码，不顺带抽象或扩展下一项能力。
3. **REFACTOR**：在绿灯保护下清理命名和重复；每次可能改变行为后重跑 focused test。
4. 运行当前包的完整单元/集成测试、typecheck 和 lint；跨社区 Desktop/DSH 边界的切片再跑全新隔离 Profile 的真实宿主 E2E/smoke，不重建自有 Electron 测试栈。
5. 检查 `git diff --check`、`git diff` 和 `git status --short`，更新 `tasks/todo.md` 与 parity matrix 的证据。

附加规则：

- fixture 可以帮助 RED 或开发 UI，但不能作为完成功能的 E2E 证据。
- 最终集成测试优先使用真实 DSH in-process implementation；只在不可控外部边界使用最小 fake。
- 不删除、跳过、弱化或改写有效测试来获得绿色结果。
- 一个增量保持在约 1–5 个文件；更大任务先拆分。两到三个增量后执行 checkpoint。
- 脚手架、类型、构建成功、单元测试或截图都只是中间证据，不是用户价值完成。

## 开源复用门禁

自行实现非 DSH 核心能力前，先查 DSH 社区目录和成熟开源候选。每项重要选型必须记录：仓库、精确版本/commit、许可证及资产授权、维护与 release 状态、Windows/社区宿主支持、API 稳定性、bundle/运行成本、可访问性、DSH seam、隔离的当前目标版本 Profile smoke 和采用/拒绝理由。

优先顺序是：用户直接安装兼容的社区 DSH 插件并原样使用 → 在最终计划对应的领域插件内实现必要的小说事务，或由小说模式前端层（`@novel-agent/novel-workbench`）实现对应界面 → 对仍缺失的通用能力记录所需下载项。通用 adapter、wrapper、vendor/fork 或自行实现需要用户另行明确改变产品边界；不得以“方便组合”为由创建。引入前审阅 install scripts、所有直接/传递许可证和 lockfile diff；禁止来源可疑、混淆、停更或带危险安装脚本的项目。

- **前端与交互能力优先复用开源实现（用户 2026-09-16 指示）**：关系图谱、分栏面板、
  命令面板、虚拟列表、图标、图表、Markdown 渲染、diff 视图等，先上 GitHub 找成熟实现直接采用，
  不在本仓库自造渲染与布局；只有找不到合适实现、或现有实现与 DSH seam、中文阅读体验冲突时才自研，
  并在选型记录里写明理由。示例：关系图谱采用现有开源 WebGL 力导向实现
  （候选 `sigma.js + graphology`、`react-force-graph`、Quartz 的 pixi 图谱），不自写力导向与渲染。
  选型与证据记录在 [`docs/open-source-evaluations/frontend-stack-2026-09-16.md`](docs/open-source-evaluations/frontend-stack-2026-09-16.md)。

采用后同步维护 `THIRD_PARTY_NOTICES.md`、`docs/upstream-sources.md` 和 `docs/open-source-evaluations/`。上游自带测试不能替代本仓库的 adapter、负例、集成和 E2E 测试。

## 状态与完成声明

- parity matrix 是公开体验范围和状态的事实来源；只用 `not-started`、`researching`、`red`、`implemented-unverified`、`verified`、`blocked` 等可审计状态。
- 每个 `verified` 单元必须链接实现、测试和最近一次验证证据。证据过期或回归时立即降级状态。
- 真实 first slice 未完成前，不得声称“Desktop 基础完成”。所有可见组件、必要恢复路径与 Windows 生命周期未验证前，不得声称 parity 完成。
- 完成一个任务前执行 `tasks/plan-final.md` 中当前切片的验收条件与 Definition of Done。遇到真实产品冲突才询问用户；可从源码、测试、官方文档或既有决策查明的事实自行查证。
