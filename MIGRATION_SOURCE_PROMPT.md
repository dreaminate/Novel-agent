# 本机迁移请求

这是随迁移包交付的用户需求摘要，只记录用户明确确认的迁移范围。

请将当前 Windows 本机的 novel-agent 项目迁移到目标电脑，并保留：

- 源码；
- 文档；
- 测试；
- 锁文件；
- 现有构建产物；
- 仓库内现有提示词，以及一份供目标机 Codex 使用的 handoff 提示词。

迁移包从本机发出，供另一台电脑使用。交付为单个 ZIP，根目录为
novel-agent-migration-2026-09-07，并附带清单和 SHA-256 校验。

下列内容明确排除：

- .git；
- node_modules；
- .pnpm-store；
- .novel-agent；
- test-results；
- 日志；
- 旧的 novel-agent-source.zip。

