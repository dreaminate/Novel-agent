# Planning 叙事投影归属迁移 — 2026-09-09

叙事投影、层级/身份/引用校验和排序已从 Core 移到 Planning。Canon 提供指定 revision 的
有效历史及原子校验入口，Planning 解释领域数据。251 个测试、typecheck、lint、build 通过；
四个真实官方 Host 进程验证了 Core-only 基本预览、组合后的领域校验、历史读取与回滚冷恢复。

本次不等于 M2 完成。领域 wire/schema、四个剩余角色、检索/图/模拟/IO、新领域 Remote/Slots
仍待迁移。当前 `projectNarrative` 方法及 Remote 仍有旧客户端和检索消费者，保留派发入口；
它调用已注册的 Planning projector，Core 内没有第二份叙事计算实现。

## 契约与实现

- [Canon 类型](../packages/novel-project/src/types.ts) 定义 `NovelCanonSnapshot` 与
  `NovelCanonProjector`。Snapshot 只包含指定 revision 的有效来源，排除未来 revision、
  已回滚分支和 author authorization；来源副本深度冻结。候选快照只供提交前校验。
- [Canon Service](../packages/novel-project/src/index.ts) 的 `registerProjector(namespace, projector)`
  返回交给 Cordis owner 的 disposer；`readProjection` 读取真实项目的指定 accepted revision。
  Preview 和 Apply 在写入前调用注册者的 `validate(before, candidate)`，错误沿原路径返回。
- Canon 直接复用自身已有的有效祖先选择逻辑。领域插件不遍历 rollback 链、不保存自己的
  revision 状态库。注册表只持有代码回调，事实仍在同一原生 Canon Storage。
- [Planning projector](../packages/novel-planning/src/projection.ts) 从有效来源构建层级、十类
  时钟及债务，负责原有层级、不可变身份、单位引用和 scope 匹配校验。
  [Service](../packages/novel-planning/src/index.ts) 用原生 effect 注册并释放它。
  Skills 通过原生可选 injection 挂载，Planning 读取服务只依赖 Canon。
- Core 删除十项原有声明；六项领域状态/校验/排序声明经 AST 比对原样迁移。
  旧的逐 revision 投影缓存、复制状态和领域 rollback 回放不再需要；有效来源由 Canon 选择。
- Core-only Preview 只返回 `fromRevision/toRevision/manuscripts/canonFacts`。Planning 存在时
  保留原有领域 impact 字段；这没有填充假领域结果或新增 fallback wrapper。
- Planning 复用已解析的 `@deepseek-ai/dsh-util-values@0.1.2-rc.1`（MIT）进行深度冻结，
  使用 Canon 现有公开 wire 常量/类型，不导入 Core Service 实现。没有新增第三方版本。

## RED → GREEN

写入前保存 67 个文件及 SHA-256 到 `.novel-agent/checkpoints/2026-09-09-narrative-projection/`。
仓库仍无 commit、全量未跟踪，不把空 Git diff 当作无变更证据。

| 行为 | RED | GREEN |
| --- | --- | --- |
| 泛型 projector 的有效来源与提交前校验 | 12:31:35，缺少 `registerProjector` | 12:33:02，R2 排除 R3、回滚 R4 只给 R1/R2、历史 R3 可读、拒绝不改 Canon |
| Core-only Preview 与 Planning 注册归属 | 12:38:05，Core 仍返回领域字段，Planning 未注册 projector | 12:44:08，基本预览独立运行，Planning 注册并执行真实投影 |
| 卸载时释放 projector | 12:52:17，受控移除 effect 后旧 projector 留存 | 12:52:21，恢复 effect 并重建后卸载撤回通过 |

受控修改已恢复。原有 narrative、Remote 和八个 review-draft 场景显式挂载 Planning；
预期值和有效断言保留。类型更新只对已装载 Planning 的测试字段使用非空断言，没有改成
“缺失也通过”。首次 lint 的两个已搬走类型导入、typecheck 的十处字段可选性错误均已修正。

最终 `corepack pnpm test:focused`：13:11:03，5 文件、251/251、10.13 秒。
`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm build` 均通过。
主线程单独只读复核了 AST、调用方、字段可选性、有效历史选择、卸载释放和实际宿主产物。

## 四个真实宿主进程

新 Home/Profile：`.novel-agent/acceptance/narrative-projection-20260909/`。
复用已打补丁的官方完整 CLI `session-recovery-20260909/runtime`。先仅安装 Core，停止后
通过真实 CLI 加入 Planning/Writing，再按 Writing → Planning → Core 顺序加载。
观察插件原样复用上一切片的只读诊断 tgz，不进入产品依赖。

| PID / 端口 | 操作 | 结果 |
| --- | --- | --- |
| 50740 / 63163 | Core-only 新 Workspace/Session；预览并接受合成 Canon-only R1 | 预览只有四个基本 impact 键；接受成功 |
| 37212 / 50337 | 加入领域插件后冷预览；接受合成 R2 层级/合同、R3 修改；提交孤儿章节 | 正常事务成功；孤儿在 Preview 和 Apply 都拒绝，Canon 仍为 R3 |
| 47944 / 62483 | 完整重启，以作者 Preview 首次访问会话；读历史后回滚 R2 | R2/R3 合同各自正确；回滚生成 R4 |
| 43124 / 54003 | 再次重启，以作者 Preview 恢复 | R4 恢复 R2 合同，显式历史 R3 保留其修改 |

三个组合阶段的首次会话访问都是作者 Preview，没有 `session/create` 预热。24 个 RPC
中 22 个成功，两个是预期的孤儿提案拒绝。四个角色完成 12 次真实 native Skill Tool 读取，
内容哈希保持一致；Planning 读取前后 Canon 文件哈希不变。

R3 SHA-256：`0bc4b16a7161f13da0e0fb7bc42001cd5f6f03abe08b1b109f22bc0b1108f99b`。
R4 SHA-256：`47857b790c4ffdc35ebc9912978386fbb257fc7185bc052ba235ab38694820f4`。
孤儿拒绝前后 R3 哈希相同。官方 `readFrom` 读取 11 条持久化事件：零模型 turn，四条
accepted/rolled-back 通知均带现有 marker，data 仍只有规定的四个字段。

开发、Host、Profile 的 Session 实现 SHA-256 仍为
`c1d72f32b0b68d2509ca67185ef4875472f944e12fd1f3915cdbe5bbd8ff6522`，恢复补丁未改动。
CLI 仍报告 Profile peer dependency warning；实际 Host 成功不等于静态 peer 检查全绿。

主要记录为该验收目录的 `artifacts/core-only-r1.json`、`composed-preview-r2.json`、
`accepted-r2-r3.json`、`orphan-rejected.json`、`cold-r3-preview.json`、`rollback-r4.json`、
`cold-r4-preview.json` 及三个 `read-resume-*.json`。打包哈希和摘要见 `run.json`。

13:11:15 检查四个端口与本次 Node 进程均为 0，全局 `.dsh` 不存在。没有 GUI 操作、
模型调用、参考仓库修改或外部发布。新 GUI 验收、完整 Core-only Agent/界面体验、各领域完整迁移、
真实小说质量和前 12 章仍未完成；旧领域 Tool/Remote 消费者迁移继续进行。

检查点收尾：67 个基线文件哈希保持，26 个变更文件和两个新文件的 whitespace 检查通过；
七份文档 302 个本地链接均存在。README 三个打包命令实跑产物与宿主验收 tgz 哈希一致；
24 个 RPC 逐项核对为 22 成功、2 预期拒绝。文档边界测试 5/5，r18/u24 当前地图与历史一致，
完整 Goal 保持 active。
