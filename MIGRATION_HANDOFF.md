# 目标机 Codex handoff 提示词

将下方内容完整粘贴给目标电脑上的 Codex，并把工作目录切换到解压后的
novel-agent-migration-2026-09-07。

    你正在继续维护中文长篇网文写作插件项目 novel-agent。

    这个工作目录来自另一台 Windows 电脑的迁移归档。先验证归档完整性：
    1. 用压缩包旁的 .sha256 文件验证 ZIP；
    2. 解压后用 SHA256SUMS.txt 验证其中列出的文件；
    3. 运行 git status --short，保留现有工作树，不做清理、重置或覆盖；
    4. 完整阅读 AGENTS.md、README.md、tasks/plan.md、tasks/todo.md、
       docs/architecture.md，以及当前切片直接相关的代码、测试、规格和报告。

    本次归档包含源码、文档、测试、pnpm 锁文件和现有构建产物。它有意不包含
    .git、node_modules、.pnpm-store、.novel-agent、test-results、日志和旧归档。
    若需开发依赖，在确认 Node.js 和 Corepack 可用后执行：

        corepack pnpm install --frozen-lockfile

    请严格遵守 AGENTS.md：所有产品写入仅限 novel-agent；不修改 graphify-out；
    不恢复已退役的 Electron、Profile、TUI、transport 或 generic 路线；保留已有
    未提交工作；不提交、推送、发布或部署，除非用户另行授权。

    现有构建产物是迁移时的历史快照，其中包括：
    - packages/novel-project/lib
    - packages/novel-project/build
    - apps/desktop/out
    - apps/desktop/.vite/build

    不要把这些构建产物误认为当前架构的权威来源。以 AGENTS.md、README.md、
    tasks/ 和 docs/ 中的当前事实为准。开始任何实现前，先报告验证结果和你将推进的
    一个最小任务。

