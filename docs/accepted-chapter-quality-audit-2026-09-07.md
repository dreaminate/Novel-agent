# 已入库章节质量复核与第二章修订 — 2026-09-07

## 状态纠正

五章正文确实经过 DSH 事务入库；这不等于五章通过了完整质量验收。
此前的字数、schema、API 与 reload 结果只能证明各自检查的行为，不能证明
正文无元文本、连续性成立或 post-check 的 met 有充分依据。

本次只将第二章的五处具体修订及配套 post-check 标为 verified。
第三至第五章整体质量仍是 implemented-unverified，并存在下列已确认问题。
第六章没有开始生成；原始十章、29,000–31,000 可见字符、完整设定与已有小说
接管目标不变。不得用入库章数代替质量通过章数。

## 权威数据与范围

- 同一隔离 Profile：novel-external-chapter-green-20260903-01a05b3c。
- Workspace：4096c460-e003-473f-8528-ed1d5092fe3d。
- 本次开始时 head R18，结束时 R20。
- R18 时 storage SHA-256：5d6058a7b529ccb068ce458567b63221b602b6f1d81b44f04a27ede8faf9f5ad。
- R20 时 storage SHA-256：84ed2c508f8e5bd655145a8e560957f33c5dd09c72ebf46da0bde643fc40bfa6。
- 本次不修改产品源码、规格、graphify-out、相邻仓库或用户全局 Profile；
  仅通过现有 conversation.view 的作者审阅事务增加 revision。

下表是实际存储字数，不是整体质量评级。

| 当前正文 | 来源 revision | 非空白可见字符 | 质量证据边界 |
| --- | --- | ---: | --- |
| 第一章 | R3 | 3087 | 本次未重新做完整质量验收 |
| 第二章 | R19 | 2979 | 本次五处修订及对应写回已复核 |
| 第三章 | R10 | 3002 | 存在一处章节元文本 |
| 第四章 | R14 | 3005 | 存在两处章节元文本 |
| 第五章 | R17 | 3100 | 存在三处章节元文本及物证矛盾 |

当前五章合计 15,173 可见字符；旧 R18 快照的 15,124 仍是历史数据。

## 已完成的第二章修订

原 R6 正文的两处“第1章”回顾改为故事内的时间/地点描述；将无依据的巡查者
意图说明改为灯光和脚步的可观察变化；明确挡潮板下两人挤藏的空间；补足小满
因巡查风险改为带走木盒的决定。窗上留下衣襟线头，原有蓝线完整收回木盒，
与第三章继续使用盒中蓝线衔接。

独立只读复核先拦下会造成蓝线去向歧义的候选，再批准最终稿。最终稿 2,979
可见字符、3,099 UTF-16 code units，SHA-256 为
57bc519bad9931b662e6010d026891b8aa3759c4d28262934bf1667dda8b25ff。
使用现有 diff@9.0.0 生成真实 unified diff，并验证 applyPatch(R6, diff)
逐字等于候选稿；没有用描述性占位文本冒充 Diff。

R19 接受正文。R20 独立接受第二章 post-check，manuscriptSourceRevision=19，
Anchor 为 chapter-2-reviewed-prose-r19，范围 0..3099，hash 与正文完全一致。
写回明确木盒、完整蓝线和衣襟路标的去向，并清空没有实际 narrative-debt
记录支撑的 debtTransitions；不删除故事中的未完成告别或承诺。

## 真实 UI 与持久化证据

- 在原第二章写作 Session 中粘贴候选、Review packet、Accept all items、
  Preview selected impact，再 Apply Result Packet Review。两次分别产生 R19/R20。
- 两次 Preview 均核对 storage 哈希不变；作者授权由现有 Remote 路径产生。
- R1–R18 的持久记录与修订前逐项 deepEqual；R20 也保留 R19，未覆盖历史。
- Host 58359 的面板 reload 显示 R20；停止后用同一 Profile 启动 Host 64255。
- 在已有第五章 Session 选择第二章，重启后的面板仍显示 R20 和新 post-check。
  26 个 Novel Project RPC 全部 HTTP 200，console/page/request failures 为 0，
  读取前后 storage 哈希相同。没有新的 DSH 外部模型调用，也没有新建 Session。
- 全卡片截图受滚动容器裁切，不用于证明完整视觉布局；保留的 viewport 截图
  已查看，配合 DOM 字符串、请求响应和存储断言证明本次行为。

生成的本地证据位于 .novel-agent/acceptance/2026-09-07/：
chapter-2-quality-candidate.json、chapter-2-quality-findings.json、
chapter-2-ui-apply-summary.json、chapter-2-reviewed-r19.json、
chapter-2-post-quality-r20.json、chapter-2-post-quality-ui-summary.json、
chapter-2-quality-restart-summary.json、accepted-quality-audit.json。
它们是审计输出，不是第二套小说事实库。

## 尚未修复

1. 第三至第五章仍有六处正文内“第 N 章”控制/回顾元文本。确切 JS start/end、
   原文片段、revision 和 SHA-256 已记录在 accepted-quality-audit.json。
2. 同一铅牌刻痕数量矛盾：R14/chapter-4 的 572..593 为“铅牌上有三道浅刻痕，
   两短一长，末端都朝下。”；R17/chapter-5 的 1225..1251 却说“铅牌上的划痕
   却只有两道，第三道并不在牌面，而在墙下。”未提供变化过程。
3. 第三至第五章当前 post-check 还有六条 debtTransitions。它们的 sourceDeltaId
   指向章节合同，而项目没有对应 narrative-debt 记录；修复前不能将它们称为
   已完成的剧情债务写回。
4. 第五章的试探顺序与 R15 写回所列条件不一致，需要核对正文、合同和写回。
   仅凭关键词缺席不能判定世界规则被违反；该项记录为待核实，不强行算作已证实
   硬矛盾，也不能在未核实前用 met 宣称通过。
5. 第四、五章当时的操作者脚本使用过描述性 Diff 文本。现有摘要不能证明
   可应用的完整 patch；本次没有补造历史截图、原始 Diff 或作者 Apply 证据。
6. 完整人物/关系/世界与成长等项目设定、剩余章节、逐章独立审阅、以及同一稿件的
   已有作品接管仍需真实验收。当前 seed 的少量记录不能替代完整项目准备。

下一增量先修复第三至第五章的明确缺陷并重建相应写回，再恢复新增章节。
