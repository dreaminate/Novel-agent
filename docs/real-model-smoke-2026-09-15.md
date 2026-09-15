# 真实 DeepSeek 模型冒烟 — 2026-09-15

**性质：** 真实模型（非脚本 adapter）的最小验收冒烟，验证 DSH credentials seam、官方 DeepSeek provider 与小说领域插件的真实组合路径。
**授权与边界：** 用户自行在隔离 DSH_HOME 配置凭据；本记录与任何脚本都不读取密钥值。凭据只经 `credentials/describe` 检查状态。

## 环境

- 隔离 Home：`.novel-agent/acceptance/real-model-20260915/`（官方 rc.1 Host + 本项目 Session 补丁，Profile `web` 安装五个产品包；Host cwd 为验收 `workspace/`，与 `dsh-home/` 分离）。
- 模型：`deepseek-official / deepseek-v4-flash`（`session/selectModel`，记录 `reasoningEffort: high`）。
- 凭据：`dsh-home/.env` 提供 `DEEPSEEK_API_KEY`；`node preflight.mjs` 经 `credentials/describe` 得到 `configured: true, source: user-env`（只读状态，未显示值），Host 正常启动并释放端口。

## RED：第一次尝试失败

第一次冒烟脚本在 `session/create` 后直接发提示，没有先调用 `novelProject/open`。真实模型按 `novel-architect` 技能先调用 `retrieve_novel_context`，得到 `Error: novel project for Workspace '…' does not exist`；随后 `propose_novel_result_packet` 同样失败，模型开始读取仓库源码探索（46 次工具调用、约 2.6 万流式 chunk），最终没有形成提案。脚本又在错误路径解析非 JSON 工具结果时崩溃且未停止 Host。

结论：这是验收脚本缺口（缺少产品要求的打开项目步骤），不是插件缺陷；修复为：先 `novelProject/open`、Host cwd 限定在验收工作区、提示明确禁止读源码/探索、runner 在 finally 中始终停止 Host。

## GREEN：第二次尝试

| 项目 | 结果 |
| --- | --- |
| Session | `session-10a318e9-59f4-48c9-b4eb-cb6be3ae73f5` |
| 真实调用 | `skill({name:"novel-architect"})` → `propose_novel_result_packet`（仅两次工具调用） |
| 模型选择 | `model/selection` = `deepseek-official / deepseek-v4-flash / reasoningEffort high` |
| Turn 用时 | 约 60 秒；usage 累计 input 23,882 / output 3,181 tokens |
| 提案 | `architect-r1-project-setup-20260915-001`，`expectedRevision: 0`，无 `authorization`；5 个 Delta：`creative-profile` 的 `genreMix`/`premise`/`audience` + `reader-contract` 的 `coreExperience`/`chapterPull`；3 个 SourceAnchor |
| 校验 | 工具结果非错误（Core envelope + Planning 插件校验通过） |
| 作者 Apply | `novelProject/review` ok → revision 1；`projectCanon(R1)` = 5 facts |
| Apply 前 head | R0（提案不推进 Canon） |
| 停止 | Host 停止，端口 `55367` 释放 |

证据目录：`.novel-agent/acceptance/real-model-20260915/evidence/`（`smoke.json`、`proposal.json`、`smoke-events.json`（3,166 事件，含两次工具调用与一次 turn/end）、`smoke-stop.json`、host 日志、`preflight.json`）。

## 限制

- 只有一次立项 turn；未写正文、未运行审稿/记忆/发布、未做逐项拒绝路径。
- 未做 GUI 点击验收；提示与 Apply 经原生 RPC 完成，模型输出质量未人工审阅。
- 未触发 DSH approval（立项工具本身不需要审批）；发布/锁等审批路径仍只有脚本审批证据。
- 真实调用按量计费；12 章《雾港夜航》验收尚未开始。
- 该 Home 与结论只代表本次隔离组合，不代表社区 Desktop 或生产验收。
