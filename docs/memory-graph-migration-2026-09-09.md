# Memory 图、因果比较与知识边界迁移 — 2026-09-09

知识图、最短因果路径、因果变化比较和角色/读者知识边界现由 Memory 计算。
262 个测试和包门禁通过。真实 Host 验证了缺少 Memory 时的基础预览、加入后的未接受候选图，
以及 R2/R3 历史隔离和回滚 R4 后的冷恢复。

这仍是 M2 既有实现的归属迁移。检索组装/排名、其他账本与生命周期、索引 Jobs、wire/schema、
专属 Remote/Slot、GUI 和真实 DeepSeek 小说质量尚未完成，完整 Goal 保持 active。

## 归属与输入

- [Memory graph](../packages/novel-memory/src/graph.ts) 拥有图节点/边、来源信息、稳定因果路径、
  因果变化和知识边界。Core 移出九个领域函数和一个图来源类型。
- [Memory Service](../packages/novel-memory/src/index.ts) 暴露 `readGraph`、`projectGraph`、
  `traceCausalImpact`、`compareCausalConsequences` 和 `readKnowledgeBoundary`。
  完整知识边界也进入既有 `readWritingContinuity`，不受查询词影响。
- [Core](../packages/novel-project/src/index.ts) 继续选择有效来源、计算 Canon/正文变化和控制接受。
  版本比较改为服务内私有方法，调用 typed Memory Service 取得因果贡献；Memory 未安装时不提供该项。

作者预览传入明确的候选来源快照、Canon/Planning 投影和 head revision。
Memory `projectGraph` 使用这些输入，不重新查询尚未接受的 revision；因此无需先提交候选即可比较。
同一方法也服务于已接受版本的图读取。没有第二套事实库、事件总线、Agent Loop 或 transport。

复用原有算法和标签格式化：10 个路径/比较/排序/格式化声明的 AST 除 export 外一致。
原有 JSON 标签格式保留在图模块；Core 的 Canon 相等比较和沙盘 replay 仍使用原有序列化实现。
没有引入第三方版本，lockfile 字节不变；DSH `deepFreeze` 和 Node crypto 均为已有依赖。

## RED → GREEN

基线：`.novel-agent/checkpoints/2026-09-09-memory-graph/`。清单有 104 条记录，对应 101 个唯一文件；
三个重复项来自路径分隔符不同，所指文件和 SHA 相同，原始清单保留。Git 没有 commit。

| 时间 | 行为 |
| --- | --- |
| 18:31:28 → 18:34:42 | Memory 图读服务缺失；历史因果路径与回滚后相同图 hash 通过 |
| 18:36:26 → 18:38:40 | 缺少 Memory 时 Core 仍提供因果比较；改为领域贡献后，安装/卸载与未接受候选预览通过 |
| 18:41:41 → 18:46:24 | Memory 知识边界服务缺失；指定角色、完整续写边界、来源、历史与回滚通过 |
| 18:47:37 → 18:47:43 | 受控把候选图误接到已接受版本查询，R2 尚不存在而失败；恢复显式候选输入后通过 |

第一次候选 fixture 漏了正文决定，先修正为拒绝正文再得到有效 RED，不把 fixture 错误算产品缺口。
所有受控变更已恢复；迁出后两个未使用的 Core 类型导入已清理。
三份受影响测试中，原有 1,719 个完整 expect 链及预期参数均保留。

18:46:28 `corepack pnpm test:focused`：5 文件、262/262、17.06 秒。
`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm build` 通过，最终重新构建并打包。

## 实际 Host 与候选/恢复路径

新目录：`.novel-agent/acceptance/memory-graph-20260909/`。复用官方 rc.1 CLI 和既有 Session 补丁，
通过官方 plugin add 先安装 Core/Planning/Writing，再加入 Memory/Review。Profile 禁止 peer 自动安装，
Tools 继续由完整 Host 提供。静态 peer 与可选 Jobs/sandbox-policy compatibility warning 保留。

| PID / 端口 | 验证 |
| --- | --- |
| 20096 / 56781 | 没有 Memory：接受 R1，作者预览可用且没有 causalConsequences，Canon 保持 R1 |
| 17996 / 64353 | 加入 Memory 并重启：同一作者 Session 首次以 Preview 恢复；候选 R2 因果变化有 R2 来源，Canon 仍为 R1。随后接受 R2/R3 |
| 46404 / 62733 | 完整重启，以同一 Session 的 Preview 首次访问；所有图/路径/知识读取与重启前一致，R2→R3 因果变化正确；回滚到 R2 形成 R4 |
| 9648 / 52154 | 再冷恢复 R4：有效来源只有 `[1,2]`，图 hash、节点/边、因果路径和知识内容恢复到 R2；显式 R3 仍可查询 |

22 次正式 RPC 全部成功，4 次原生 `retrieve_novel_context` Tool 与 Memory 直接读取一致。
候选预览、图与知识读取前后 Canon SHA 不变；R2 不含 R3 的南墙/新因果目标。
两个 Session 的原生 `readFrom` 共读到 13 事件，4 条 Canon 通知保留 ignorable，模型 turn 为 0。

R1 Canon SHA：`0cf9c6aa68aaa29860f66f6a202adec075e7c1a9692cfe5cb30eee0e964186c0`；
R3：`8f3078db21652fb972be89be37849b65e911b4dc2a062c97751da47232cbacfe`；
R4：`dd45bf3d8d137fc3ed5084c7de79adb1320bf3d0ba7d4bf3981f08372dd3d56d`。
恢复的 R2 图 hash：`d1691747190a0d6bc1db58c2604f2932ae1c354d020fef338aabff1957b68f0d`。
完整结果和安装包 SHA 见该目录 `run.json`；全部输入为合成数据，无模型调用或系统提示诊断拷贝。

19:02:27 四端口和所属 Node 进程均为 0，全局 `.dsh` 不存在。
本轮没有新的 GUI/TUI/Desktop、真实小说质量、CI、生产或用户接受证明，没有提交、推送或发布。

收尾：101 个唯一基线文件 SHA 保持，27 个变化文件和 7 个新增源码/生成/报告/状态文件
whitespace 检查通过，七份文档 358 个本地链接存在。19:11:33 文档边界 6/6。
README 五条 pack 命令实跑；Memory/Review 的 manifest 仅键序不同，所有运行文件字节与
Host 验收包相同，精确重包 SHA 单记 run.json。
