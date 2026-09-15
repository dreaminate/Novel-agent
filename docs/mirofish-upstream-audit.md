# MiroFish 上游审计（只读，2026-09-05）

本文件记录 `C:\coding-projects\My-Projects\Original\MiroFish` 的上游证据，供未来 `novel-mirofish` DSH adapter 使用。本次没有修改该 checkout，也没有复制其源码。

## 版本、许可证与工作树

只读命令：`git status --short`、`git describe --tags --always`、`git log -1 --format='%H %ad %s'`。

- 当前提交：`117ed37758cdc96f73b7d5e0d22713c50439695f`（`v0.1.2-100-g117ed37`，2026-08-17，`chore: update star history`）。
- 既有 modified：`.env.example`、`.gitignore`、`README.md`、`README-ZH.md`、`package.json`、`frontend/package.json`、`frontend/vite.config.js`、`backend/run.py`、`backend/app/config.py`、`backend/app/api/graph.py`、`backend/app/api/simulation.py`、`backend/app/services/graph_builder.py`、`oasis_profile_generator.py`、`zep_entity_reader.py`、`zep_graph_memory_updater.py`、`zep_tools.py`、`backend/app/utils/zep.py`、`zep_lifecycle.py`、`backend/tests/test_zep_retry_and_client.py`。
- 既有 untracked：`backend/app/utils/local_graph_memory.py`、`backend/tests/test_local_graph_memory_client.py`、`docs/`、`local-runtime/`、`scripts/configure-local-memory.ps1`、`local-runtime-common.ps1`、`setup-local-embedding.ps1`、`setup-local-memory.ps1`、`start-local.ps1`、`stop-local.ps1`。

这些状态属于上游既有修改，不能作为 novel-agent 生成或可清理内容。

`LICENSE` 首行是 **GNU AFFERO GENERAL PUBLIC LICENSE Version 3**。根 [`package.json`](../../MiroFish/package.json) 与 [`backend/pyproject.toml`](../../MiroFish/backend/pyproject.toml) 都声明 `AGPL-3.0`。因此 MiroFish 是独立 AGPL 网络服务；不把其源码、Python 依赖或静态链接代码放进 UNLICENSED 的 `novel-agent` 包。未来若分发修改版服务，必须按 AGPL-3.0 保留许可证、版权/修改声明、对应源代码与交互界面法律告知；本项目只分发可替换 adapter、schema 和文档。

## 锁定依赖与运行边界

[`backend/pyproject.toml`](../../MiroFish/backend/pyproject.toml) 的运行时依赖为：Flask、Flask-CORS、OpenAI、`zep-cloud==3.25.0`、httpx、**`camel-oasis==0.2.5`**、**`camel-ai==0.2.78`**、PyMuPDF、charset-normalizer、chardet、python-dotenv、pydantic。`backend/uv.lock` 同时锁定上述 OASIS 版本，并给出 `camel-oasis-0.2.5` 的完整下载 hash；不能按 OASIS main 分支 API 推断能力。

根 `package.json` 的启动脚本是 `npm run backend`（`cd backend && uv run python run.py`）、`npm run frontend`、`npm run dev`、`npm run start:local`/`stop:local`。`backend/run.py` 默认绑定 `127.0.0.1:5001`，先执行 `Config.validate()`，再 `create_app()`；Windows 分支只调整 UTF-8 输出。README 的本地组合还可启动 Graphiti、Neo4j Bolt `127.0.0.1:7687` 和 Ollama/embedding，运行成本与凭据由用户单独承担。

图记忆有两条实现路径：

1. 云端 Zep：`graph_builder.py`、`zep_entity_reader.py`、`zep_tools.py` 通过 `zep-cloud` API 建图、实体/边读取、搜索和统计；`zep_graph_memory_updater.py` 在模拟过程中异步写入活动。
2. 本地 Graphiti：README 将 `GRAPH_MEMORY_BACKEND=graphiti` 作为默认；checkout 中的 `local-runtime/graph-memory`、Neo4j 和本地脚本是可选外部运行时。它仍是图记忆，不是小说 Canon。

## Flask API 证据

`backend/app/__init__.py` 注册三个 Blueprint：`/api/graph`、`/api/simulation`、`/api/report`，并提供 `/health`。CORS 对 `/api/*` 允许 `*`；adapter 只能连接用户明确配置的 localhost 地址，不把该开放 CORS 当作身份认证。

### Graph

`backend/app/api/graph.py` 的真实路由包括：

- `GET /project/<project_id>`、`GET /project/list`、`DELETE /project/<project_id>`、`POST /project/<project_id>/reset`；
- `POST /ontology/generate`、`POST /build`；
- `GET /task/<task_id>`、`GET /tasks`；
- `GET /data/<graph_id>`、`DELETE /delete/<graph_id>`。

这些路由覆盖项目/图谱创建与读取、ontology、异步 build task 和图数据；没有 branch、replay 或叙事状态端点。

### Simulation

`backend/app/api/simulation.py` 提供：

- 图谱实体：`GET /entities/<graph_id>`、`GET /entities/<graph_id>/<entity_uuid>`、`GET /entities/<graph_id>/by-type/<entity_type>`；
- 生命周期：`POST /create`、`POST /prepare`、`POST /prepare/status`、`GET /<simulation_id>`、`GET /list`、`GET /history`、`POST /generate-profiles`、`POST /start`、`POST /stop`；
- 配置/环境：`GET /<simulation_id>/profiles`、`/profiles/realtime`、`/config/realtime`、`/config`、`/config/download`、`GET /script/<script_name>/download`、`POST /env-status`、`POST /close-env`；
- 结果：`GET /<simulation_id>/run-status`、`/run-status/detail`、`/actions`、`/timeline`、`/agent-stats`、`/posts`、`/comments`；
- 采访：`POST /interview`、`/interview/batch`、`/interview/all`、`/interview/history`。

### Report

`backend/app/api/report.py` 提供 `POST /generate`、`POST /generate/status`、`GET /<report_id>`、`GET /by-simulation/<simulation_id>`、`GET /list`、`GET /<report_id>/download`、`DELETE /<report_id>`、`POST /chat`、progress/sections/agent-log/console-log 读取与流式端点，以及 `POST /tools/search`、`POST /tools/statistics`。报告是外部分析材料，不能直接成为 Canon。

## 服务与动作模型

### 图谱、Agent profile 与 OASIS

`graph_builder.py` 将上传文本分块，经 ontology generator 写入 Zep/Graphiti 图；`oasis_profile_generator.py` 将实体/关系生成平台 Agent profile。`simulation_runner.py` 的模块说明和实现都指向 **OASIS 社交模拟**，并按 `twitter`、`reddit` 两个平台启动脚本、读 `actions.jsonl`，维护回合号、模拟小时、平台完成状态和最近动作。

可观察动作是平台社交动作（发帖、评论、转发、关注等，具体动作日志由 OASIS 产生）；结果端点也以 posts/comments/timeline/agent-stats 为中心。它没有地点移动、资源守恒、战斗前置条件、叙事因果账本或小说世界规则验证器。

### runner 与 IPC

`simulation_runner.py:228-230` 保存进程级 `_run_states` 与 `subprocess.Popen`；`start_simulation` 创建 `run_state.json`、启动 Twitter/Reddit 脚本并监控 `actions.jsonl`，`stop_simulation` 终止子进程，`register_cleanup` 在 Flask 退出时清理。`SimulationRunState` 的 `current_round`、`simulated_hours`、`runner_status`（含 `PAUSED`）是**运行监控状态**，不是叙事 `WorldState`。

`simulation_ipc.py` 明确说明它是文件系统 IPC：Flask 写 `ipc_commands/*.json`，模拟脚本轮询并写 `ipc_responses/*.json`。`CommandType` 只有 `interview`、`batch_interview`、`close_env`；没有通用 action dispatch、snapshot、branch 或 replay 命令。采访 API 通过该 IPC 向正在运行的 OASIS Agent 发问，结果按 Twitter/Reddit 平台返回。

### 报告与采访

`report_agent.py` 定义 `ReportAgent`、`ReportManager`、`Report/ReportOutline/ReportSection`，通过 Zep 工具执行 `insight_forge`、`panorama_search`、`quick_search`、`interview_agents`，生成 Markdown 报告、章节、agent log、console log 和进度。`simulation.py` 的三个 interview endpoint 以及 `simulation_runner.py` 的 `interview_agent`、`interview_agents_batch`、`interview_all_agents`、`get_interview_history` 证明采访能力真实存在，但前提是 OASIS 环境已运行。

## branch / replay / world-state 核验

结论：**没有真实的 branch/replay/world-state API。**

- 逐文件搜索 `backend/app/api`、`backend/app/services`、`backend/scripts` 的 `branch`、`replay`、`world-state`、`StateSnapshot`、`StateDelta`、`counterfactual`，没有对应 Flask route、服务方法或 schema；命中仅是 `graph_builder.py` 关于“ambiguous replay”重试的注释，以及 Zep batch replay 的幂等性说明。
- 存在的 `run_state.json`、`SimulationRunState`、`current_round`、暂停/停止和 action log 是进程/平台运行遥测；没有跨分支快照、状态 delta、分支合并或确定性回放契约。
- `GET /history` 是 simulation 历史列表，`GET /timeline` 是动作时间线，二者都不能证明 branch/replay/world-state。

因此 Plot Counterfactual 不能从当前上游能力推出。完整剧情分支至少需要 `MOVE/CONVERSE/REVEAL/ATTACK/RESOURCE` 等叙事动作、带前置条件的 StateSnapshot/StateDelta、seed/replay/branch API，以及在锁定 `camel-oasis==0.2.5` 环境中的 custom-action spike。该 spike 尚未完成，保持 `blocked`。

## novel-mirofish sidecar contract（未来，仅计划）

novel-agent 未来只实现一个可替换 DSH adapter；MiroFish 独立运行在用户 localhost。建议的最小边界：

```text
POST /api/graph/project/<id> 或 /api/graph/build
POST /api/simulation/create
POST /api/simulation/prepare
POST /api/simulation/start
GET  /api/simulation/<id>/run-status[/detail]
GET  /api/simulation/<id>/actions
POST /api/report/generate
GET  /api/report/by-simulation/<id>
POST /api/simulation/interview|interview/batch|interview/all
POST /api/simulation/stop
```

adapter 输入固定为一个 accepted `sourceRevision`、manuscript/character/faction/world-rule 摘要、显式 Reader Persona 或 Character Pressure intervention、input hash 和 opaque `project_id/simulation_id`。adapter 只保存调用/结果引用、状态、来源 revision、限制和 proposal；不复制图数据库、不读取 `.env`/Zep secret、不把 OASIS 帖子当正文事实。

adapter 的 DSH 侧方法可保持：`prepare`、`start`、`status`、`report`、`interview`、`stop`；工具名规划为 `novel_mirofish_reader_reaction`、`novel_mirofish_character_pressure`、`novel_mirofish_status`、`novel_mirofish_interview`，Remote/Slot 仍走 DSH `Typert` 和 `conversation.view`。服务错误按 DSH 原始错误返回，不伪造本地结果；所有结果 proposal-only，必须经过 Review/作者 Apply 才可能进入 Canon。

首期支持 Reader Reaction，第二期 Character Pressure。Reader Reaction 的输出必须包含每个 Persona 的原始反应、证据片段、分歧/误读/期待和“非市场代表”限制；Character Pressure 只输出联盟、冲突、信息扩散和未解决钩子。两者都不写 Canon。

## 依赖/许可证矩阵

| 组件 | 精确版本/证据 | 许可证/边界 | 处理 |
|---|---|---|---|
| MiroFish root/backend | commit `117ed377...`; root/backend 声明 AGPL-3.0 | 强 copyleft 网络服务；修改/分发需对应源码与告知 | 外部 sidecar，novel-agent 不打包源码 |
| `camel-oasis` | `==0.2.5`，`uv.lock` hash | 上游独立许可证需随用户安装核对；动作是 Twitter/Reddit 社交模型 | 仅通过 HTTP sidecar 使用 |
| `camel-ai` | `==0.2.78`，`pyproject.toml`/`uv.lock` | 与 OASIS 一起留在 Python 环境 | 不进入 Node 插件 |
| `zep-cloud` | `==3.25.0` | 云端凭据/服务成本由用户承担 | adapter 不读取 key |
| Graphiti/Neo4j/Ollama | README 与 `local-runtime/graph-memory` | 外部服务和各自许可证/资源成本 | sidecar 运行时，不复制 |
| Flask/Flask-CORS | `>=3.0.0` / `>=6.0.0` | MiroFish backend 运行时 | 只连接 loopback |
| MiroFish report/interview | `report_agent.py`、`simulation.py`、`simulation_ipc.py` | 结果是不可信外部材料 | 显示限制，proposal-only |

## 结论与停止条件

MiroFish 可以作为独立 AGPL sidecar 提供图谱、OASIS 群体社交反应、报告和 Agent 采访；它没有可证明的小说 branch/replay/world-state，因此 Plot Counterfactual 记录为 `blocked`。本审计已满足“版本/许可证/依赖/API/runner/IPC/报告/采访/能力缺口”证据要求；在用户另开正式开发 Goal 前，不实现 `novel-mirofish` adapter，也不改上游 checkout。
