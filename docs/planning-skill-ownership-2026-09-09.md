# Planning 三角色归属迁移 — 2026-09-09

三个既有规划角色已从 Canon 核心迁入独立的 `@novel-agent/novel-planning`。
247 个测试、typecheck、lint、build 通过；全新隔离的官方 rc.1 Host 成功安装两个包，
完整重启前后均通过原生 Skill Tool 加载相同内容，Canon 保持 R0 且文件哈希不变。

这是 M2 核心收缩的第一个能力族。其余五个角色、领域 Tools、类型、阶段 prompt 和
领域投影仍在核心；本报告不宣布 M2 或完整 Planning 完成。恢复补丁的 GUI 复验仍见
[恢复报告](canon-session-recovery-2026-09-09.md)，本次没有进行界面操作或模型调用。

## 实现与复用

- [Planning 入口](../packages/novel-planning/src/index.ts) 用公开 `inject` 声明
  `novelProject` 和 `skills` 依赖，`apply(ctx)` 通过原生 `ctx.skills.register` 注册
  `novel-architect`、`novel-hook-payoff-planner`、`novel-world-character-setting`。
  注册随 Cordis 插件生命周期撤回；不另建 Service、Store、Agent 或生命周期包装器。
- [Core](../packages/novel-project/src/index.ts) 删除对应注册和六个私有声明。
  章节合同示例仍被暂留 Core 的正文写手使用，因此保留一份该业务数据；Planning 有自己的副本。
- Planning 只以 type import 使用 Core 已公开的 `/types`，没有导入其实现。
  编译后 Planning JS 没有 runtime import。Core 产品依赖不反向依赖 Planning；
  根开发依赖只让跨插件测试加载它。Planning 的 Core peer 在打包后为 `0.0.0`。
- 唯一 lockfile 只新增 workspace importer/link，未改变第三方解析版本。
  继续直接复用已有 Cordis `4.0.2`、DSH SkillRegistry / Skill Tool `0.1.2-rc.1`（MIT）。
  新插件仍是本项目 `UNLICENSED` 代码；没有引入社区通用替代实现或复制 DSH 源码。
- 原有三个角色名和内容保持不变，仅 `source` 改为 Planning 包名。最终设计中的新角色契约、
  project brief → roadmap → chapter contract Tools、领域 namespace 和板面仍待实现。

本次先核对 DSH/Cordis 的原生 injection、SkillRegistry 注册释放与 stock Skill loader，
再复用既有项目角色。没有新增通用算法、依赖框架、Profile 或聚合安装器。

## RED → GREEN 与复核

写入前保存了 53 个文件与 SHA-256 清单：
`.novel-agent/checkpoints/2026-09-09-planning-skills/`。仓库没有 commit 基线，
仍为已有的全量未跟踪工作树；差异检查使用这份字节快照。

| 行为 | RED | GREEN |
| --- | --- | --- |
| 只加载 Core 不发布 Planning 角色，Canon 仍能打开 | 10:24:45，仍读到 `novel-architect` | 10:43:34，三者均不存在，Canon R0 正常 |
| Planning 缺少 Canon 时等待依赖；卸载时撤回角色 | 10:47:33，受控移除 `novelProject` 注入要求后错误发布角色 | 10:47:37，恢复注入后等待及卸载断言通过 |
| 三角色原有原生 loader 行为 | 保留有效测试，调整挂载方及 `source` 断言 | 既有 schema、内容、Tool 结果断言全部保留并通过 |

受控修改已恢复并重建，不进入最终包。未删减或跳过有效测试。

```powershell
corepack pnpm test packages/novel-project/tests/novel-project.spec.ts -t 'does not publish Planning role skills'
corepack pnpm test packages/novel-project/tests/novel-project.spec.ts -t 'requires Canon for Planning skills'
corepack pnpm test:focused
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```

最终完整测试开始于 10:59:10，5 个文件、247/247、13.56 秒；其余门禁均通过。
新增插件的 `test` 命令指向实际 Core/Remote 跨插件套件，不用空测试替代接口验证。

主线程在实现后单独只读复核：TypeScript AST 核对七个搬迁声明，除三个 `source` 值外
全部与快照相同；Core 只保留正文写手仍在使用的章节示例。测试 diff 只新增两条边界用例，
并调整三个既有角色测试的插件挂载、释放和所有者断言。没有 Core → Planning 产品依赖循环。

## 全新官方 Host 的实际证据

本次新 Home/Profile 位于 `.novel-agent/acceptance/planning-skills-20260909/`。
复用已验证的 `session-recovery-20260909/runtime` 完整官方 CLI，避免重复安装环境。
两个产品 tgz 和一份测试用观察插件通过真实 `dsh plugin --profile web add` 安装。
Profile 使用官方 base + web，且故意把 Planning 排在 Canon 前，验证真实依赖等待路径。

观察插件只在该测试 Session 的原生 startup/resume 回调中调用真实
`ctx.tools.execute({ name: 'skill', ... })`，核对返回内容与 registry 相同。
证据只保存角色名、所有者、provider 与内容哈希，不保存完整角色 prompt 或登录材料。
它仅位于隔离验收目录，不属于产品安装包。

| Host | 实际操作 | 结果 |
| --- | --- | --- |
| PID 27100，端口 58865 | 创建隔离 Workspace、打开 R0、创建 Session、读取三个 Skills | 全部成功，所有者均为 Planning |
| PID 2484，端口 52079 | 完整停止前一进程后新起 Host，恢复同一 Session，再读 R0 | 三个 Skills 的内容哈希完全相同，head R0 |

两阶段所有被检查的 Remote `result.ok` 均为 true。官方 persistence `readFrom` 读到五条
内置事件：permission preset、sandbox mode、approval policy、title、end-seed；无模型 turn，
无 Canon 通知。这里只验证加载/恢复路径，不将诊断插件视为真实模型选择角色的证明。

Canon SHA-256：`9100a9fda777fc8e92598acfe50c47390f3478ada340bd6d4225b75195ceaced`。

| 角色 | 完整内容 SHA-256 |
| --- | --- |
| novel-architect | `c976c064f8853d91c60a25988308bbfb40f04576f450b0e723c739a85cf7e529` |
| novel-hook-payoff-planner | `34bed7ecdea5778553804080203c89ccb92c94a1c26f1e5adc291e1bdd24800d` |
| novel-world-character-setting | `d7228a59d752e10fdd011409b6c12651b454b8cd82b1af21abe1f2656d509469` |

开发、Host 与 Profile 的 Session 实现仍完全相同：
`c1d72f32b0b68d2509ca67185ef4875472f944e12fd1f3915cdbe5bbd8ff6522`。
之前授权的恢复补丁没有变更；详细部署边界见 [补丁说明](../patches/README.md)。

打包 SHA-256：

- Core：`bb15e35fa7f42f25618efcc19ac6adbd76d0f8fe90ef601e6fd90b8f47d659d2`。
- Planning：`1328dbdbd56a87f3a7d0da534ce10a53cdd8c565d417d8b73de32d4df62bf9a6`。

原始过滤结果在该目录的 `artifacts/workspace.json`、`warm-session.json`、
`cold-session.json`、`skills-startup.json`、`skills-resume.json`，摘要为 `run.json`。
两个 Host 已退出，58865 / 52079 无监听。未修改全局 `.dsh`、参考仓库或规格原文。

收尾检查：53 个快照文件哈希仍匹配，21 个实际变更文件通过基线 whitespace 检查；
七份相关文档的 282 个本地链接均存在。README 中的两个打包命令实际运行成功，产物与
已验收 tgz 的哈希一致。文档修改后的 product-boundary 为 5/5；`git diff --check`
无输出。r16/u22 当前地图与历史投影一致，检查时本次 Node 进程和两个监听端口均为 0，
用户全局 `.dsh` 不存在。

GUI、完整 M2/Planning、其他角色协作、真实 DeepSeek 小说质量、前 12 章、Desktop、CI、
生产和作者验收都不由本切片证明。完整 Goal 保持 active，下一步继续剩余 Core 能力族迁移。
