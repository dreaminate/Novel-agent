# novel-agent 本机迁移包

归档名称：novel-agent-migration-2026-09-07.zip

## 包含内容

- 根目录配置、README、AGENTS.md、许可证与第三方声明；
- 根目录的历史研究/规格 Markdown 和 i18n YAML；
- docs、tasks、packages、apps 和 tests 中的项目文件；
- pnpm-lock.yaml 和 pnpm-workspace.yaml；
- 现有构建产物，包括 packages/novel-project/lib、packages/novel-project/build、
  apps/desktop/out 和 apps/desktop/.vite/build；
- docs/goal-prompts-final.md、MIGRATION_SOURCE_PROMPT.md 和
  MIGRATION_HANDOFF.md；
- SHA256SUMS.txt，其中列出归档内其余文件的 SHA-256。

## 明确排除

- .git、node_modules、.pnpm-store；
- .novel-agent、test-results、日志；
- graphify-out；
- 旧的 novel-agent-source.zip；
- 本归档自身及其外部 SHA-256 sidecar。

## 验证

压缩包旁的 .sha256 文件校验整个 ZIP。解压后，SHA256SUMS.txt 用于校验其中的
payload 文件。解压目录不含依赖缓存；在目标机需要开发依赖时，使用锁文件执行
corepack pnpm install --frozen-lockfile。

