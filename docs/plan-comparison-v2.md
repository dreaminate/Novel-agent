# 旧计划与 v2 计划对照

| 维度 | 旧 `tasks/plan.md` | v2 结论 |
| --- | --- | --- |
| 插件数量 | 一个 `novel-project` 深插件承载全部小说能力 | Canon 核心 + Writing + Memory + Simulation；IO 由真实需求决定 |
| 核心职责 | Canon、十类时钟、检索、模拟、IO、角色、UI 全部在同一 Service | 核心只保留 Revision/Result Packet/接受回滚/锁/事件聚合 |
| 领域类型 | 所有专用类型集中在一个 `types.ts` | 类型按插件拥有；跨插件只暴露最小 typed Service/Result Packet 契约 |
| 联动方式 | 主要依赖同一包内直接调用 | Cordis `ctx.inject` + 命名空间 `SessionEventMap`，禁止直接 import 实现 |
| 角色 Skills | 八个角色由单插件统一注册 | 角色归 Writing；Memory/Simulation 只注册自己的 proposal Skill |
| 记忆 | 写作记忆、连续性、索引与 Canon 同包 | Memory 独立安装，读取 accepted Revision，索引复用官方 Jobs |
| 模拟 | 世界与读者反应、多 seed/分支/校准逐步堆入同一包 | 先单次 proposal；复杂实验在单次 run 真实可用后再排 |
| 导入导出 | EPUB/DOCX/TXT/Markdown 都是核心插件能力 | 先作为 Writing 的薄 capability；有独立生命周期需求才拆 IO |
| UI | 一个大型 Novel Project Panel 承担所有面板 | 各插件向同一 `conversation.view` 提供小 Slot/卡片，不造新页面 |
| 通用能力 | 明确复用社区插件，但小说包仍有很宽的内部边界 | DSH/社区插件继续原样提供 Sidebar、浏览器、搜索、上传、Jobs、TUI |
| 验证策略 | 大量领域单元和跨功能证据并行累积 | 先做 Canon+Writing 垂直闭环，再逐插件隔离 smoke |
| 迁移策略 | 以“单插件继续扩展”为默认 | 先保留安装名，按能力族把实现迁移出核心并删除无消费者分支 |
| 过度工程化控制 | 通过“不新增第二套基础设施”控制，但单包内部仍过宽 | 通过最小核心、单向依赖、无共享 util/总线、每片 1–5 文件控制 |

## 新计划明确删除或降级的工作

- 不再把十类叙事时钟作为 Canon 核心的前置实现；它们由真正消费它们的插件逐步注册。
- 不再把复杂模拟矩阵、校准、自动化预算和生产长跑作为首个交付门槛。
- 不再把导入导出强行做成核心公共接口；先证明安装/生命周期需求。
- 不再为每种领域能力增加新的页面、tab、Store、Workflow 或 TUI 扩展。

## 必须保留的事实约束

- DSH `0.1.1-rc.2` 是唯一内核，社区 Desktop 固定复用 `v2.0.2`。
- accepted Revision、Result Packet、审批、Remote、Session 事件和 Canon 仍是可回放事实的唯一来源。
- 社区插件是独立下载项；novel-agent 不包装、不复制、不在其 checkout 中开发。
- 每个 `verified` 单元必须有实现、focused test 和最新隔离 Profile 证据。
