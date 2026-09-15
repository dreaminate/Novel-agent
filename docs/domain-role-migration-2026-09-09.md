# 五插件角色归属与历史读取 — 2026-09-09

八个既有小说角色已经全部移出 Core：Planning 3 个、Writing 1 个、Memory 2 个、Review 2 个。
Writing 提供已接受正文读取，Memory 提供指定 revision 的检索入口。254 个测试和包门禁通过；
全新官方 Host 验证五包安装、八个原生 Skill loader、历史正文/召回及回滚后的冷恢复。

这是 M2 的角色归属切片。Memory 检索算法仍在 Core，新服务当前直接调用它；Writing 的
正文读取复用 Canon 的基础正文快照。新的 Draft/Rewrite/Review Tools、Jobs、领域 wire/schema、
新 Remote/Slots 和 Core 阶段 prompt 均未完成迁移，不据此宣布五个领域插件功能完整。

## 实现与依赖

- [Writing Service](../packages/novel-writing/src/index.ts) 通过 Canon 的只读快照提供
  `readManuscripts(workspaceId, revision)`；角色与服务依赖 Canon + Planning。
- [Memory](../packages/novel-memory/src/index.ts) 拥有 `novel-continuity-checker` 和
  `novel-writing-memory-organizer`，提供 `retrieve(workspaceId, query)`，依赖 Canon、Planning、Writing。
  目前复用 Core 的检索实现，没有第二份索引或事实库。
- [Review](../packages/novel-review/src/index.ts) 拥有 `novel-reviewer` 和 `novel-researcher`，
  原生 injection 要求 Canon、Planning、Writing、Memory 与 Skills。
- Core 删除七个私有角色/示例声明及最后一组 Skill 注册；不再导入 SkillRegistration。
  不再使用的生产 `dsh-skill` 依赖移为 dev-only，供真实 registry 测试使用。
- 七个声明经 TypeScript AST 对照写入前快照，只有 `source` 所有者变化。既有角色正文、
  示例和 loader/schema 断言保留。Core 的阶段 prompt 和旧领域 Tool 仍在，未宣称已移除。
- 新包均为私有 `0.0.0` / `UNLICENSED`。继续复用 Cordis `4.0.2`、DSH `0.1.2-rc.1` 的
  原生 Service/Skill/Workspace（MIT）。lock 仅改变 workspace 链接、已有直接依赖归属，无新增第三方版本。

## RED → GREEN

写入前保存 71 个文件及 SHA-256：`.novel-agent/checkpoints/2026-09-09-domain-roles/`。
Git 仍无 commit，使用实际字节快照审查差异，不清理既有未跟踪工作树。

| 行为 | RED | GREEN |
| --- | --- | --- |
| Writing 已接受正文读取 | 13:37:07，原生服务不存在 | 13:37:59，历史读取/回滚正确且读取不写 Canon |
| Core 不再发布领域角色 | 13:38:42，仍返回 continuity-checker | 13:42:32，八角色均不由 Core 发布 |
| Memory 必须等待 Writing | 13:46:17，受控删依赖后提前发布 | 13:46:26，恢复依赖后等待/撤回通过 |
| Memory 不可用 head 替代请求 revision | 13:46:21，受控改为 head 后历史命中失败 | 13:46:26，恢复参数后历史/回滚读取通过 |
| Review 必须等待 Memory | 13:48:32，受控删依赖后提前发布 | 13:48:36，恢复后等待与 Memory 卸载撤回通过 |

受控修改全部恢复并重建。有效旧断言没有删除或弱化。八个原生 loader 用例已通过；
最终 `corepack pnpm test:focused` 于 13:49:20 开始，5 文件、254/254、10.34 秒。
`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm build` 均通过。

主线程另作只读复核，检查了实际声明、原生依赖与清理、Core 生产依赖变化、现有断言和运行产物。
本次新增的是角色所有权与可用的原生服务入口；未把检索算法尚在 Core 的事实写成迁移完成。

## 五插件真实宿主

全新 Home：`.novel-agent/acceptance/domain-roles-20260909/`。复用已打补丁的官方完整
`session-recovery-20260909/runtime` CLI，以真实 `dsh plugin --profile web add` 安装五个产品
tgz 和仅用于观察的诊断插件。Profile 顺序为 Review → Memory → Writing → Planning → Core，
原生依赖等待后正常加载。CLI 仍有静态 peer warning，不等同于实际宿主失败，也未宣称 peer 全绿。

观察插件只调用 native Skill Tool、Writing/Memory 读取服务，记录角色内容哈希及合成数据的
正文命中和来源；读取前后核对 Canon 哈希。它不调用模型、不写 Canon、不进入产品依赖。

| PID / 端口 | 操作 | 结果 |
| --- | --- | --- |
| 43068 / 55608 | R0 八角色加载；作者 Remote 接受合成 R1 合同、R2 初稿、R3 修订 | 全部成功 |
| 40516 / 51869 | 完整重启后作者 Preview 首次访问；随后回滚 R2 | R2 只有旧正文命中，R3 只有新正文命中；回滚生成 R4 |
| 7848 / 58388 | 再次完整重启，由作者 Preview 恢复 | R4 返回 sourceRevision 2 的旧正文/命中；历史 R3 仍返回新正文 |

冷阶段没有 session/create 预热。17 个 RPC 的实际 `result.ok` 全为 true。三次观察共完成
24 次 native Skill Tool 读取，八个角色内容哈希一致；8 次 Writing 读取和 16 次 Memory 查询
均保持 Canon 字节不变，精确命中包含 sourceRevision 与实际正文 SourceAnchor range。

R3 Canon SHA-256：`e039dc281f8e457b03acf3dd684ebb073e6de018e0e32acbdb2ac9573612cb29`。
R4 Canon SHA-256：`0643627dc09dd4fb8eca67264d0d703544c1170ac54b2a00334bd832bd208346`。
官方 persistence `readFrom` 读到 10 条事件、零模型 turn、4 条已带 marker 的 Canon 通知，
载荷仍为原四键。开发/Host/Profile 的 Session 实现仍同为
`c1d72f32b0b68d2509ca67185ef4875472f944e12fd1f3915cdbe5bbd8ff6522`，恢复补丁未变。

证据位于该目录的 `artifacts/read-startup-r0.json`、`read-resume-r3.json`、
`read-resume-r4.json`、`accepted-r1-r3.json`、`cold-r3-preview.json`、`rollback-r4.json`、
`cold-r4-preview.json`；包哈希和摘要见 `run.json`。

14:05:35 检查三个端口及本次 Node 进程均为 0，全局 `.dsh` 不存在。首次读取观察文件时
客户端仍在运行，等待同一进程完成后获得成功结果；没有重发已执行的动作。
没有新 GUI/TUI/Desktop 验收、真实模型或前 12 章质量证明；没有提交、发布或修改只读参考仓库。

检查点收尾：71 个基线文件哈希保持，27 个变更文件和 9 个新文件 whitespace 检查通过；
七份文档 312 个本地链接存在，17 个 RPC 成功结果逐项复核，r19/u25 地图与历史一致。
README 五个 pack 命令已实跑。Memory 重打包只有 package.json 的 peerDependencies 键顺序
变化，manifest 值与其余文件字节相同；实际验收包哈希仍以上方 run.json 为准，重打包哈希
`03b73c1a39ae4098af54eb2e26aceb8ab0c6ce71e07131cdcc540dca92e35db0` 单独记录。其余四包哈希一致。
