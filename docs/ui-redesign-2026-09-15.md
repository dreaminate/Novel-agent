# 作者工作台重设计与提案收件箱（2026-09-15）

## 背景

旧面板把 85 个技术区块平铺在一个滚动页里，提案审阅需要手工搬 JSON，接受一章要走
「全部接受 → 预览选中项的影响 → 接受全部审阅决定」三步，且大量 ID、锚点和原始 JSON
直接展示给作者。本次按用户要求重做前端：默认停在写作台、界面全中文、人话优先，并参考
`https://ml4trading.io/` 的设计系统（深蓝 + 琥珀金 + 暖纸白）做视觉底座。

## 交付内容

### 1. 提案收件箱（主机侧）

- 项目记录新增 `pendingProposals`（`NovelPendingProposal`：`packetId`、`receivedAt`、
  `producer`、完整 `packet`），schema 使用默认值兼容旧记录，存储版本保持 1，无迁移。
- `propose_novel_result_packet` 成功后把带真实 Session 身份的完整提案写入收件箱；
  同一 `packetId` 覆盖，最多保留最近 20 条。
- 新增 Remote：`pendingProposals`（读取）与 `discardProposal`（丢弃，幂等）；
  接受提案时自动把对应条目移出收件箱。
- 收件箱保存完整草稿，长正文不再依赖聊天记录里可能被截断的 Tool 输出。

### 2. 面板结构（客户端）

- 四个页签常驻 DOM、用 `hidden` 切换：**写作台**（默认）、**故事**、**历史**、**高级**。
  现有全部技术区块原样放进「高级」，老功能与老测试继续可用。
- 写作台：提案卡（章节序号徽章、标题、字数、人话摘要、问题与建议）、正文阅读区、
  「接受本章 → 影响预览 → 确认接受」两步流、「丢弃」提案、「继续写第 N 章」按钮
  （通过 DSH `inputActions.setDraft` + `submit` 把指令发给 agent，不新增任何通道）。
- 故事总览：字数/已接受章节/计划章节/未收束线索统计，章节进度列表与线索列表。
- 历史：每个已接受版本一枚版本徽章 + 一句人话摘要 + 对比/回退 + 技术细节折叠。

### 3. 人话渲染器

新增 `packages/novel-project/src/client/describe.ts`：Delta 类型/级别/维度/时钟映射为中文，
`describeDelta`、`describeIssue`、`describeRevisionSummary`、`countManuscriptCharacters`
等纯函数；ID、锚点、原始 JSON 只保留在「技术细节」折叠中。

### 4. 视觉底座

面板内注入作用域 CSS，使用 ml4trading.io 主题令牌：深蓝 `#0a1628`、琥珀 `#d4a84b`、
暖纸白 `#fafaf9`、边框 `#e8e8e6`、正文 `#334155`；衬线标题 + 无衬线正文 + 等宽代码，
卡片 12px 圆角、琥珀主按钮、深蓝代码块；不加载外部字体（离线可用）。

## 验证

- 逐切片 RED → GREEN：收件箱服务测试 3 条、Remote 集成测试 1 条、客户端测试 5 条新增；
  `product-boundary` 的 Typert 调用计数随两个新 Remote 从 12 更新为 14（命名空间唯一性
  断言不变）。
- 最终门禁：根 `pnpm test` **284 passed / 5 files**，`pnpm typecheck`、`pnpm lint`
  （oxlint `--deny-warnings`）与包 `pnpm build` 全部通过。
- 隔离真实环境：把重打包的 `novel-agent-novel-project-0.0.0.tgz` 覆盖进
  `.novel-agent/acceptance/real-model-20260915/dsh-home/profiles/web`，用标准流程启动
  官方 Host（`dsh --profile web --host 127.0.0.1 --port 0 --no-open`），
  `http://127.0.0.1:50267/` 返回 303（带 token 正常跳转）。启动日志见
  `host-logs/host-20260915-204439.log`，pid 记录在 `host-ui.pid`。

## 未完成 / 未验证

- 新界面尚未经过用户目视验收；真实模型在写作台里「接受本章 → 继续写」的完整回合尚未跑通。
- 生产安装与发布验收不在本次范围。

## 涉及文件

- `packages/novel-project/src/index.ts`（收件箱 schema、remote、工具落库、接受清理）
- `packages/novel-project/src/types.ts`（`NovelPendingProposal`）
- `packages/novel-project/src/client/index.ts`（两个新接口注入）
- `packages/novel-project/src/client/NovelProjectPanel.tsx`（页签、写作台、总览、历史、样式）
- `packages/novel-project/src/client/describe.ts`（人话渲染器，新增）
- `packages/novel-project/tests/novel-project.spec.ts`
- `packages/novel-project/tests/novel-project-client.spec.ts`
- `packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts`
- `packages/novel-project/tests/product-boundary.spec.ts`
