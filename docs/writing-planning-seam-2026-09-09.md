# Planning 读取服务与 Writing 角色迁移 — 2026-09-09

Planning 现在提供原生 `novelPlanning.readPlan(workspaceId, revision)`，正文写手归属
独立 `@novel-agent/novel-writing`，并依赖 Canon + Planning。249 个测试及包门禁通过。
全新官方 Host 证明：当前 R3 时可以读到各自的 R2/R3 章节合同，回滚为 R4 后再重启仍正确，
三个 Planning 角色与正文写手都能通过原生 Skill Tool 加载相同内容。

这仍是 M2 迁移增量。`readPlan` 当前调用 Canon 中现有的叙事 projector；其实现、领域
类型和新的 Planning/Writing Tools、Remote、Slot 尚未迁移。本文不宣布完整写作闭环或小说质量通过。

## 本次实现

- [Planning](../packages/novel-planning/src/index.ts) 由函数入口改为原生 Cordis Service。
  `novelPlanning` 键和 `readPlan` 供插件读取精确 accepted revision 的层级、章节合同及来源。
  直接复用现有 Canon 投影，不复制事件回放、不保存派生事实、不增加缓存或错误包装。
- [Writing](../packages/novel-writing/src/index.ts) 通过原生 injection 依赖 `novelProject`、
  `novelPlanning`、`skills`。Planning 缺失时不注册写手，Planning 卸载后写手注册同步撤回。
  新包目前只拥有既有 prose Skill；Draft/Rewrite Tools、正文 projection 和 UI 仍待迁移。
- Core 删除正文写手的注册及三个私有声明。三个声明经 TypeScript AST 对照快照，除
  `source` 改为 Writing 外内容相同；原有 loader/schema/正文与合同示例断言均保留。
  章节示例现在由 Planning 和 Writing 分别持有，不再留在 Core，也没有新建共享包装包。
- 跨插件只使用公开类型和 Cordis Service；没有 runtime import 另一插件实现。
  Writing 打包后 peers 精确为 Core `0.0.0`、Planning `0.0.0`。
- 根 workspace/lock/构建加入 Writing。Planning 新直接声明既有的 DSH Workspace
  `0.1.2-rc.1` 类型依赖；lock 没有新增第三方解析版本。Cordis `4.0.2`、DSH `0.1.2-rc.1`
  都保持既有版本和 MIT 许可，新增项目代码仍为 `UNLICENSED`。

复用依据是已发布 Cordis `Service` 的自动提供/撤回、SkillRegistry 的原生注册 effect，
以及现有 Canon 的 revision-bound projector。未修改 DSH、参考 checkout 或 Agent Loop。

## RED、GREEN 与检查

写入前保存 60 个文件及 SHA-256：`.novel-agent/checkpoints/2026-09-09-writing-seam/`。
当前 Git 仍没有 commit，全部既有文件未跟踪；使用字节快照做差异审查。

| 行为 | RED | GREEN |
| --- | --- | --- |
| Planning 指定 revision 的合同读取 | 11:38:21，缺少原生 `novelPlanning.readPlan` | 11:39:47，R2 不泄漏 R3、历史来源保留、回滚恢复、读取不改 Storage |
| Core 不再发布正文写手 | 11:41:10，仍返回 `novel-prose-writer` | 11:44:31，角色已移出 Core；原有 native loader 用例也通过 |
| Writing 的 Planning 依赖和撤回 | 11:46:24，受控移除依赖后错误发布写手 | 11:46:28，恢复注入后等待、加载、卸载撤回通过 |

受控修改已恢复并重新构建。没有跳过、删除或弱化有效测试。

`corepack pnpm test:focused` 于 11:47:18 开始：5 个文件、249/249、9.75 秒；
`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm build` 均通过。
Planning 的包测试包括 Core、narrative、Remote 套件；Writing 的包测试使用实际 Core/Remote
跨插件用例，根 focused 已覆盖这些套件。

主线程单独作了只读复核：服务的 revision 参数直接传给现有 projector；没有读取 head
替代历史 revision。角色声明保持原内容，Core 没有反向依赖 Writing/Planning。对应测试
仅增加读取/生命周期行为和更新真实插件装配、所有者断言。未发现未解决的范围内问题。

## 全新 Profile 与三个宿主进程

新 Home 位于 `.novel-agent/acceptance/writing-seam-20260909/`，复用已验证并应用恢复补丁的
`session-recovery-20260909/runtime` 官方完整 CLI。通过真实 `dsh plugin --profile web add`
安装 Core、Planning、Writing 和仅用于观察的诊断插件。Profile 顺序为 Writing → Planning →
Core，实际通过原生依赖等待后加载。CLI 报过 peer dependency warning；实际 Host 加载通过，
不声明 Profile 的静态 peer 检查全绿。

诊断插件仅在该测试 Session 的 startup/resume 中调用真实 Skill Tool 和 Planning 服务。
它记录角色内容哈希、合同和来源，并验证读取前后 Canon 文件哈希不变；没有模型调用或自动 Canon 写入。
测试 R1/R2/R3 及回滚使用已认证的官方作者 Remote，数据明确为合成验收夹具。

| Host PID / port | 操作 | 结果 |
| --- | --- | --- |
| 52440 / 51962 | R0 加载四个角色；作者 Remote 预览并接受 R1 层级、R2 合同、R3 修改 | 成功，head R3 |
| 21648 / 57568 | 完整重启后以作者 Preview 为首个会话访问；读取 R2/R3；随后回滚 R2 | R2 为“船票背面出现第七码头”，R3 为“证人跳海”；回滚生成 R4 |
| 43764 / 64114 | 再次完整重启，以作者 Preview 恢复同一 Session | R4 恢复 R2 合同，历史 R3 保留自己的值，四个 Skill 内容哈希不变 |

两个冷阶段没有 `session/create` 预热。正式 17 个 RPC 的 `result.ok` 全为 true，
三次观察共完成 12 个原生 Skill Tool 读取。官方 persistence `readFrom` 读出 10 条落盘事件，
零模型 turn，R1/R2/R3 accepted 与 R4 rolled-back 四条通知均带 marker，载荷仍只有四个规定字段。

最初诊断请求误用数组形式的 args，被上游拒绝信封且未创建 Workspace；该结果保留在
`artifacts/workspace.json`，不算产品 RED。按已发布 named-object 协议修正后，正式创建记录为
`artifacts/workspace-created.json`。未掩盖这条失败或把 HTTP 200 当作业务成功。

Canon R3 SHA-256：`d6923847e52a9634d6d684ae87c620edf42dd8179c0ee70ec0b1610a15bef98d`。
Canon R4 SHA-256：`6d3f329c4c6cb80ddf9eb62b572a3ca56f79eb960dd373ef43ef2fbcaa29b479`。
开发/Host/Profile 的 Session 实现仍同为
`c1d72f32b0b68d2509ca67185ef4875472f944e12fd1f3915cdbe5bbd8ff6522`，授权恢复补丁没有变化。

运行摘要与打包哈希在 `writing-seam-20260909/run.json`；主要证据为
`artifacts/read-startup-r0.json`、`read-resume-r3.json`、`read-resume-r4.json`、
`accepted-r1-r3.json`、`cold-r3-preview.json`、`rollback-r4.json`、`cold-r4-preview.json`。

12:00:29 检查三个端口与本次 Node 进程均为 0，全局 `.dsh` 不存在。没有 GUI 操作，
先前 Computer Use URL 判定造成的可见验收缺口仍保留；没有用别的工具绕过。
真实 DeepSeek 写作质量、前 12 章、完整 M2、领域新 Remote/Slots、Desktop、CI、生产和作者验收仍未完成。

检查点收尾：60 个快照文件哈希保持；27 个实际变更文件和 5 个新文件的 whitespace 检查
通过，七份文档 290 个本地链接均存在。README 的三个 pack 命令实际执行，产物哈希与本次
宿主安装包相同；17 个正式 RPC 结果重新逐项核对。文档边界测试 5/5，r17/u23 当前地图与
历史投影一致，完整 Goal 保持 active。
