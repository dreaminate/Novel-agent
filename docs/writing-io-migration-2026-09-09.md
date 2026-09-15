# Writing 导入、发布与审批恢复 — 2026-09-09

既有导入提案、发布 Tool、发布审批提示和 EPUB/DOCX 编码已从 Core 移入 Writing。
266 个测试及包门禁通过；新隔离官方 Host 验证了提案与接受分离、拒绝发布不写文件、
四种格式输出，以及完整重启后的作者预览和再次发布。

这完成本次 I/O 归属迁移和列出的原生路径。完整 Writing、领域 wire/schema、最终 Tool/Remote/Slot、
GUI、真实 DeepSeek 和前 12 章小说验收仍未完成。

## 实现

- [Writing Service](../packages/novel-writing/src/index.ts) 注册 `propose_novel_import` 与
  `publish_novel_manuscript`，通过原生 `tools/pre-execute` 请求 DSH approval；插件卸载后 Tool 撤回。
- [文档编码](../packages/novel-writing/src/documents.ts) 接收已接受章节和元数据，生成 EPUB/DOCX。
  11 个 schema、类型、格式/编码声明与原 Core AST 一致，只有跨文件使用所需的 export 改变。
- [Core.parseDraft](../packages/novel-project/src/index.ts) 用 Result Packet schema 和已注册领域扩展
  校验提案并冻结结果。它不加入作者授权、不推进 revision；旧通用提案 Tool 也使用该入口。
- Writing 从自身正文服务和 Planning 获取指定版本及章节顺序；原始字节从 Core 对应来源 revision
  读取。文件路径、读取和写入沿用现有 DSH FS/sandbox-policy 与原编码逻辑。
  通用上传和二进制文本提取仍是外部能力。

`diff@9.0.0`、`docx@9.7.1`、`fflate@0.8.3` 及 DSH FS/sandbox-policy 的生产归属移到 Writing；
Core 为既有测试保留 dev dependency。Writing 声明现有 DSH Agent/util-values rc.1 与 Zod 4.4.3，
Tools 采用精确 rc.1 peer + dev。lockfile 的 439 个 package resolution key 不变。
没有新增上游 fork、Loop、文件宿主或审批系统。

## RED → GREEN

基线：`.novel-agent/checkpoints/2026-09-09-writing-io/`，111 文件与 SHA-256。
仓库没有 commit 基线，原有未提交文件均保留。

| 时间 | 可观察行为 |
| --- | --- |
| 20:59:14 → 21:00:04 | Core 的领域提案校验入口缺失；加入后扩展校验、无授权、冻结及 R0 不变通过 |
| 21:00:07 → 21:08:52 | Core 仍发布两个 I/O Tool；迁移后仅安装 Writing 时提供，卸载后撤回 |

随后构建发现 Writing 缺少 Planning 的类型扩展导入，补齐后完整 build 成功。
21:11:17 `corepack pnpm test:focused`：5 文件、266/266、18.24 秒。
`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm build` 通过。
复核按五个测试文件统计，2,898 个原 expect 调用及完整链保留，新增 9 个；既有预期未弱化。

## 新 Host 与重启

目录：`.novel-agent/acceptance/writing-io-20260909/`。五个产品 tar 包通过官方 CLI 安装到
全新 Home/Profile，使用 `0.1.2-rc.1` 和同一 Session 恢复补丁；Profile 禁止自动安装 Tools peer。
Agent Loop、ToolRuntime、FS、ApprovalService、Session JSONL 均为实际官方实现。
仅外部 LLM 和该合成 Session 的审批答复方使用脚本；没有真实 DeepSeek 或 GUI 点击证明。

1. 接受无正文计划为 R1；导入 UTF-16LE BOM/CRLF 第一章只生成提案，Canon 仍 R1；
   接受后为 R2。Markdown 第二章同样先保持 R2，接受后到 R3。
2. 拒绝发布没有生成 `denied.txt`。允许后 UTF-8 正文一致，source 输出与 52 字节原文件完全一致。
3. EPUB/DOCX 整书均含按顺序排列的两章、标题与作者。EPUB 语言为 zh-CN；DOCX 保留目录和两章分页。
   验证了压缩包内容和 XML，未做阅读器或 Word 的视觉排版验收。
4. 21:35:20 停止 PID 41108 / 端口 49228。重启为 PID 52792 / 端口 60558 后，第一次 Session
   访问就是原作者 Preview；两章正文与来源版本 R2/R3 恢复，Canon 仍 R3。再次原生审批和发布通过。
5. 21:37:25 第二个 Host 停止。两个 PID/端口均已释放，全局 `.dsh` 仍不存在。

原生读取器读回 226 个事件、9 个完整 turn、6 对 `approval/asked` / `approval/decided`
（1 次拒绝、5 次单次允许）和 3 条 `ignorable: true` Canon 接受通知。
首次允许发布前、四种格式发布后及重启后的 Canon SHA-256 均为
`45e9c40180dd98056eb311aa8f4a87bf880d54327628c536200981139ff09da1`。

23 次 RPC 中 22 次成功；首次导入接受脚本漏了决定项 `itemId`，被 gateway/input-invalid 拒绝，
补齐后通过。该失败原样保留，是验收脚本错误，不是产品 RED。
准备期 fixture 少了闭合括号、只读观察脚本误用 `Context.start` 也已修正；没有改动产品换取通过。

可执行 `node .novel-agent/acceptance/writing-io-20260909/verify.mjs` 重新核对保留的输出与
原生 Session；`run.json` 收录包哈希、审批序号和 RPC 结果。该命令不启动 Host 或调用模型。
旧未标记日志仍不迁移；CI、生产、Desktop、真实模型质量和用户接受均未声明通过。

收尾复核：完整发布 Tool AST 与原实现相同，导入 Tool 对外 schema/呈现声明保持；
111 份基线 SHA 完整，27 个变化文件和 4 个新增源码/生成/报告文件的 whitespace 检查通过，
八份当前文档 384 条本地链接存在。21:45:15 文档边界测试 6/6。
README 五条 pack 命令实跑。Core/Planning tar 与 Host artifact 完全一致；
Writing/Memory/Review 的 manifest 只有键序差异，语义相同，其他文件与 Host 安装文件逐字节一致。
没有提交、推送或公开发布。
