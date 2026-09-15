# MiroFish 小说专用沙盘插件设计

## 结论

MiroFish 作为 `@novel-agent/novel-mirofish` 可选 DSH 插件接入，定位为“小说人物/读者群体反应沙盘”，不是第二个 Canon、第二个 Agent Runtime 或第二个小说事实库。

MiroFish 当前上游是 AGPL-3.0 的 Python Flask 服务，核心依赖 `camel-oasis`、`camel-ai`、Zep/Graphiti 图记忆和独立模拟进程。其锁定环境为 `camel-oasis==0.2.5`、`camel-ai==0.2.78`；不能把 OASIS main 分支更新后的能力假定存在于该锁定版本。它的真实工作流是：种子材料 → 图谱/实体 → Agent 人设 → Twitter/Reddit 双平台模拟 → 报告与 Agent 采访。当前动作模型主要面向社交平台，不等于完整的小说世界状态机。

因此不把 MiroFish 源码复制进 `novel-agent`，不在相邻 MiroFish checkout 修改产品代码，也不把 AGPL 代码静态链接进 UNLICENSED 的小说包。novel-agent 只实现一个可替换的 DSH 适配插件，通过受限的本机 loopback HTTP 调用用户单独安装的 MiroFish 服务；适配器、契约和测试全部留在本仓库。

## 插件职责

### DSH 侧 `novel-mirofish`

负责：

- 从指定 accepted Revision 生成小说沙盘种子；
- 把人物、势力、关系、世界规则、章节正文和读者契约编译成 MiroFish 输入；
- 创建/准备/启动/停止一次 MiroFish simulation；
- 读取报告、动作日志、Agent 采访和状态；
- 把结果封装成带 `sourceRevision`、输入 hash、运行 ID 和限制说明的 proposal-only `SimulationRun`；
- 在 DSH `conversation.view` 显示沙盘结果；
- 将作者明确选中的结论转成普通 Result Packet，交由 Canon 审阅，绝不直接写 Canon。

不负责：MiroFish 图数据库、OASIS 进程、Zep 凭据、平台动作实现、模拟内部状态持久化或第二套 UI。

### MiroFish 侧保持上游边界

用户单独运行 AGPL 服务和其依赖。首期只要求上游已有的 HTTP 能力：项目/图谱创建、实体读取、模拟创建/准备/启动、状态查询、报告生成/读取、Agent interview。任何需要改变 OASIS 动作模型、增加“叙事事件”平台或修改报告协议的工作，先形成独立 upstream patch 评估，不在本仓库偷偷 fork。

## 小说语义编译

### 输入 `NovelMirofishSeed`

```ts
interface NovelMirofishSeed {
  projectId: string
  sourceRevision: number
  manuscriptUnits: readonly {
    unitId: string
    title: string
    acceptedText: string
    sourceAnchors: readonly string[]
  }[]
  characters: readonly {
    id: string
    name: string
    goals: readonly string[]
    beliefs: readonly string[]
    constraints: readonly string[]
    relationships: readonly string[]
    knowledgeBoundary: readonly string[]
  }[]
  factions: readonly { id: string; name: string; goals: readonly string[] }[]
  worldRules: readonly { id: string; statement: string; exceptions: readonly string[] }[]
  promises: readonly { id: string; state: string; expectedWindow?: string }[]
  scenario: {
    question: string
    intervention: string
    horizon: string
  }
}
```

所有字段来自同一个 `sourceRevision`。没有 accepted 文本或来源锚点的内容只能作为显式 scenario 输入，不能伪装成 Canon 事实。

### 映射到 MiroFish

| 小说对象 | MiroFish 输入 | 限制 |
| --- | --- | --- |
| Character | Agent profile/persona | OASIS 行为仍是社交动作，不是完整人生状态 |
| Faction | Agent group/关系边 | 群体目标需要在 seed 中展开，不能依赖隐式推断 |
| Relationship | Graph edge + profile context | 结果是互动证据，不自动更新关系 Canon |
| Chapter excerpt | 初始帖子/事件描述/采访上下文 | 不能把帖子等同于正文情节 |
| Reader Persona | 独立 Agent profile | 只能说明该模拟 Persona 的反应 |
| World rule | seed context/约束说明 | 规则违反需由 Review/Canon 检查，MiroFish 不具备权威验证 |

## 两种可验收模式

### 1. Reader Reaction（首期）

输入一个 accepted Chapter 或两个候选片段、3–5 个显式 Reader Persona、阅读历史和一个问题，例如“第七码头线索是否让悬疑读者继续追读”。MiroFish 运行群体互动，插件返回：

- 各 Persona 的原始反应和引用片段；
- 反应分歧、误读、期待和退出原因；
- 触发反应的章内证据 Anchor；
- 非市场代表、不可外推的限制。

结果只帮助作者发现读者知识边界和期待风险，不输出“市场会爆”的结论。

### 2. Character Pressure（第二期）

把已接受角色、势力和一项明确干预（例如“航标修复失败”“苏晚隐瞒证据”）编译成群体互动问题，通过 Agent interview 和动作日志观察联盟、冲突、误解和信息扩散。输出是候选压力路径，不是自动剧情。

### 暂不承诺：Plot Counterfactual

完整的“如果主角在第 8 章选择 B，后续 20 章如何演化”需要通用叙事事件、资源状态、时间推进、动作前置条件和分支合并。MiroFish 当前 OASIS Twitter/Reddit 动作模型不能直接证明这一能力。只有上游支持通用 narrative action adapter，并通过独立验证后，才加入该模式。

如果产品验收必须包含 Plot Counterfactual，另立 AGPL fork/upstream patch 路线，不把 fork 代码写入 novel-agent：先验证 OASIS custom action，再定义 `MOVE/CONVERSE/REVEAL/ATTACK/RESOURCE`、`StateSnapshot`、`StateDelta`、seed/replay/branch API。novel-agent 只跟踪 fork commit 和 loopback HTTP contract；在 fork 的独立 smoke 通过前，Plot Counterfactual 保持 `blocked`。

## DSH Service / Tool / Remote

```ts
interface NovelMirofish {
  prepare(input: NovelMirofishSeed): Promise<{ runId: string; sourceRevision: number }>
  start(runId: string): Promise<SimulationRunRef>
  status(runId: string): Promise<MirofishStatus>
  report(runId: string): Promise<MirofishReport>
  interview(runId: string, request: InterviewRequest): Promise<InterviewResult>
  stop(runId: string): Promise<void>
}
```

Tools：

- `novel_mirofish_reader_reaction`
- `novel_mirofish_character_pressure`
- `novel_mirofish_status`
- `novel_mirofish_interview`

Remote：`novelMirofish.prepare/status/report/interview/stop`。  
Slot：`novel-mirofish-sandbox`，显示 sourceRevision、输入摘要、运行状态、报告、Agent 反应、限制和“Apply 为提案”的入口。

## 运行和进程边界

1. DSH Host 只允许连接用户配置的 `127.0.0.1` MiroFish URL；不暴露公网，不读取 MiroFish 的 `.env` 或凭据文件。
2. 每次 run 使用独立 MiroFish `project_id/simulation_id`，并在 DSH 事件中保存 opaque ID、sourceRevision、输入 hash 和状态，不复制 MiroFish 全量图数据库。
3. 启动/停止通过 DSH 的可审计 Tool 和官方 Jobs/进程能力；不在 novel-agent 新建队列、后台服务或常驻线程。
4. MiroFish 报告、动作日志和 Agent interview 都是不可信外部结果；进入 Canon 前必须经过 Review 和作者 Apply。
5. MiroFish 服务不可用时，让 DSH Tool 原始失败；不自动切换到伪造的本地模拟结果。

## 事件

- `novel/mirofish/run-requested`：project、sourceRevision、mode、inputHash、opaque runId；
- `novel/mirofish/run-completed`：runId、status、reportRef、sourceRevision；
- `novel/mirofish/proposal-created`：报告中被作者选中的候选 Delta 引用。

这些事件只描述调用和结果，不提升任何小说事实。作者 Apply 仍由 Canon 产生新的 accepted Revision。

## 首轮验收（接入《雾港夜航：第七码头》）

### GREEN

1. 以 R2 的前 3 章和 4 个 Reader Persona 创建 seed；
2. MiroFish 图谱/Agent 配置完成，simulation 能启动并产生报告；
3. `novel_mirofish_reader_reaction` 返回每个 Persona 的反应、证据片段、sourceRevision 和限制；
4. 运行状态、报告和一次 Agent interview 在 DSH Remote/Slot 中可见，reload 后仍可读；
5. 选择一条“读者误解风险”生成 Result Packet，作者拒绝后 Canon 仍为 R2；
6. DSH Host 停止后无监听器，MiroFish 运行 ID 不会泄漏到其他项目。

### RED

- seed 混入 R3 未接受正文时必须被拒绝；
- MiroFish 返回没有来源片段的结论时不能生成可 Apply Delta；
- Simulation 报告包含“市场必然爆款”等越界断言时只能显示为限制/不确定，不得升级为 Canon；
- MiroFish 服务停止时 Tool 返回原始连接错误，Canon 不变；
- 两个不同 sourceRevision 使用同一 runId 时拒绝复用。

## 开发阶段

### M-0：上游适配体检

记录 MiroFish commit、AGPL-3.0、依赖版本、HTTP endpoints、Windows 启动方式、Zep/Graphiti 运行成本和 OASIS 动作限制。必须在实际锁定的 `camel-oasis==0.2.5` 环境做 custom-action spike；若要升级依赖或使用 OASIS main，另立 fork/升级评估并记录 lockfile 与许可证变化。用隔离配置启动一次，不修改用户 MiroFish `.env`。

### M-1：只读 Reader Reaction

只实现 seed 编译、prepare/start/status/report/interview、Remote、Slot 和 proposal-only 结果。此阶段不做角色状态写回和完整剧情分支。

### M-2：Character Pressure

在 R2–R5 accepted Revision 上验证角色/势力互动、信息扩散和 interview；把结果作为 Review 输入，不写 Canon。

### M-3：上游能力评估

根据 M-1/M-2 的失败样本判断是否需要 MiroFish 上游增加 narrative action adapter。若需要，另立 upstream patch 计划并重新做许可证、维护和兼容性评估；在此之前保持 Plot Counterfactual `blocked`。

## 许可证和交付边界

- MiroFish 源码、OASIS、Zep/Graphiti 继续作为外部依赖，保留 AGPL/各自许可证和 NOTICE。
- novel-agent 只交付 DSH 适配器、schema、测试和文档；不打包 MiroFish 服务、Python 依赖、Neo4j、Ollama 或凭据。
- README 必须明确用户需要单独安装/启动 MiroFish，适配器只支持 localhost，且报告不能当作事实或市场预测。
