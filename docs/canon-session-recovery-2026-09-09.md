# Canon Session 恢复修复 — 2026-09-09

**接受与回滚通知的恢复缺口已通过原生回归测试和完整官方宿主 API 重启验证。** 在同一个 Session 中接受 R1/R2，停止 Host 后恢复并回滚到 R3，再停止 Host 后恢复并接受 R4，全部成功。245 个测试、typecheck、lint、build 通过。

本轮没有完成新的界面点击/reload 验收：Windows Computer Use 因无法可靠确定当前浏览器 URL 而主动停止；随后没有继续界面操作或换工具绕过限制。完整宿主 API 证据与界面未验证项分开记录，不据此宣称整个小说目标或 Desktop 完成。

## 授权与实现

用户在选定官方 `0.1.2-rc.1` 后明确要求“我们自己完善恢复缺口”，后续再次要求继续恢复修复。此前等待的本地补丁授权已经满足。

- `patches/@deepseek-ai__dsh-session@0.1.2-rc.1.patch`：修改已发布 Session 的两个 JS 产物和公开类型声明，增加 log-only `LogEventIntent`；沿用原生 `ignorable` 信封字段。
- `packages/novel-project/src/index.ts`：只为 accepted / rolled-back 两条 Canon 派生通知传 `{ ignorable: true }`，data 仍只有 projectId、revision、deltaRefs、sourceSessionId。
- 根 `pnpm-workspace.yaml` 与 lockfile：登记可重复安装的 pnpm 补丁。参考源码、reader、已知事件目录、Agent Loop、全局 `.dsh` 和旧日志均未修改。
- `packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts`：增加一条真实 JSONL / Native SessionController 冷恢复回归测试。

完整 Canon Revision 已先提交到原生 Storage；这些四字段通知不是唯一事实来源。预算事件 `novel/automation-policy` 没有改为 ignorable。补丁的省略选项仍保持 required 语义，surface 事件也不被标为可忽略。

## RED → GREEN

修改前保存 11 文件及哈希至 `.novel-agent/checkpoints/2026-09-09-session-recovery/`。仓库仍全量未跟踪，没有用空 Git diff 冒充干净基线。

focused 命令：

```powershell
corepack pnpm test packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts -t 'restores accepted and rolled-back Canon notifications'
```

- 08:36:57 RED：真实接受 R1/R2 后重建运行环境，作者预览报 `novel/canon/accepted (seq 1) unknown ... not marked ignorable`。最初一次测试误用了不存在的 `manuscripts` 返回字段，修正为真实 manuscript projection 检查后才得到这个有效 RED；未把夹具错误计为产品失败。
- 08:39:15 GREEN：同一用例通过，随后回滚、再次冷恢复，原始 Canon 事件完全保留；未标记未知事件的对照仍拒绝恢复。
- 主线程只读复核发现另一个已发布 JS 入口还需导入 `isSurfaceEligibleType`，已补齐；两个实际入口分别验证了 marker、required 对照、冻结以及 surface 保持 required。
- 最终 `corepack pnpm test:focused`：09:41:23，5 文件、245/245、18.52s。typecheck、lint、build 全通过，既有 244 个断言未被跳过或弱化。

当前无新增子代理授权，独立复核按 review-gate 的规定由主线程另作只读阶段完成。范围检查确认 reader / 目录 / Loop 不在补丁中；完整客户端 bundle 差异只有九处生成 Remote 的 sourceLocation 行号，不包含界面逻辑变更。这不等于新的界面运行验收。

## 实际部署与一致性

官方完整 CLI 在独立 runtime 中安装，沿用已核查的精确 rc.1 lock，离线安装 499 个包并应用同一补丁。新的测试 Home 使用官方 base + web Profile 结构，通过真实 `dsh plugin ... add` 安装小说包和一条内置消息的测试 fixture；本次没有上轮 fixture 的未完成启用问题。

本仓库开发依赖、实际 Host runtime 和 Profile 的 `dsh-session/lib/index.js` SHA-256 都是：

```text
c1d72f32b0b68d2509ca67185ef4875472f944e12fd1f3915cdbe5bbd8ff6522
```

补丁 SHA-256：`fadd2c4d733522104c8c029b17c77e243ca0a5000c1a8adc1a6679d56eed8b58`。

小说 tgz SHA-256：`1f86d85e588d879fbd7688bf0da4d12efb1802031bd8b8565a6328bea452f382`。其前端为 1,562,355 bytes；相对昨日仅 sourceLocation 行号变化。

不能只在插件开发目录打补丁、却让实际 Agent 跑在另一个未打补丁的 Host。部署步骤和许可见 [patches/README](../patches/README.md)。本次测试不代表任意用户安装的 Desktop 已自动修复。

## 三个真实 Host lifetime

全部使用 `.novel-agent/acceptance/session-recovery-20260909/`，同一 Home / Workspace / Session `rc1-ui-seed`；所有数据都是明确标注的测试夹具。

| Host | 操作 | 结果 |
| --- | --- | --- |
| 58619 | 真实 Remote 接受 R1“关闭”、R2“开放”；读取两个 Revision 和 R2 Canon | 成功；head R2 |
| 56387 | 完全停止前一进程后，以作者 previewReview 作为首个会话访问触发恢复；再回滚 R1 | 预览保持 R2；回滚产生 R3，Canon 回到“关闭” |
| 65108 | 再次完整停止/启动，以作者 previewReview 恢复包含 rollback 通知的同一会话；随后接受新提案 | 预览保持 R3；接受为 R4，Canon 为“开放” |

冷阶段没有先调用 session/create 把作者会话预热；原生 SessionController lookup 由作者 Remote 触发。每个被调用接口均检查实际 `result.ok`，不是只看 HTTP 200。

输出文件：

- `artifacts/warm-state.json`：R1/R2 的真实读回。
- `artifacts/cold-after-accept.json`：接受后恢复、只读预览和回滚。
- `artifacts/cold-after-rollback.json`：回滚后恢复、继续接受 R4。
- `artifacts/filtered-session-events.json`：官方 `readFrom` 读取落盘数据后过滤；12 条事件、0 个模型 turn，4 条 Canon 通知均有 ignorable，data 键仍恰好四个。

末次 Canon 文件 SHA-256：`a660650d891669ab64bba300ce73ebb7739d73bf36b6b9281a0ec3931fa64b10`。三个端口都已释放，本次 Node Host / HTTP 客户端没有遗留进程。自动打开的测试浏览器页未由工具关闭，因为本轮界面工具已停止；宿主已停止。

登录材料只在 stdin 和内存中使用，不进入结果文件。初版诊断客户端的长 JSON 被 Windows PTY 控制序列打断，不能解析；没有重发已经执行的接受动作，改为把过滤目标接口的结果直接写文件，并从实际 Revision 读回核对。

## 仍未证明的范围

- 新的 GUI 交互/reload smoke 因 Computer Use 的 URL 判定停止而未完成；此前界面证据仍标明原日期。
- 原有未标记日志不会自动迁移；旧失败文件继续保留，未篡改来获得通过。
- 其他 required 外部事件不因此获得支持；尤其不能把预算/策略的唯一日志事实套用为可忽略通知。
- 领域插件拆分、真实模型质量、前 12 章、Desktop 补丁部署、CI、生产和作者验收均不是本轮完成项。
