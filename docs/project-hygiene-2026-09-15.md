# 项目卫生清理 — 2026-09-15

**性质：** 删除退役/可重装的本地负载与过时措辞；不改产品源码、规格原文、dated 运行证据或上游只读仓库。
**授权：** 用户 2026-09-15 明确要求「打扫项目卫生，该清理的清理」。

## 删除清单（回收 1,672.6 MB）

| 对象 | 体积 | 理由 |
| --- | --- | --- |
| `apps/`（仅 `desktop/.vite` + `desktop/out`） | 357.1 MB | 已退役自建 Electron 路线的构建残留（无源码）；A-001 已分类为 ignored build residue，`vitest.config.ts` 与 workspace 不再引用 |
| 14 个历史验收环境的 `node_modules`/profile 安装 | ~830 MB | 依赖可重装；证据文件（`run.json`、`artifacts/`、`dsh-home/sessions`、`storages`、脚本）全部保留 |
| `.novel-agent/upstream-evaluation/2026-09-08/{full-runtime-alpha,full-runtime-latest,runtime-alpha2}/node_modules` | 437.3 MB | 09-08 版本评估用的完整 runtime 安装；manifest/lockfile/installed-inventory 保留，可重装 |
| `.novel-agent/patch-work/dsh-session-0.1.2-rc.1` | 0.3 MB | 过期 patch 工作副本（缺共享注册表改动，与当前 patch 不一致，易误导）；权威来源仍是 `patches/*.patch` |
| `.novel-agent/tmp/*.log` | ~0 MB | 一次性诊断日志 |

保留不动：三个在用验收环境（`real-model-20260915`、`writing-automation-close-20260915`、`m2-canon-boundary-20260915`）、共享的已打补丁 CLI `session-recovery-20260909/runtime`、全部 acceptance 证据与 checkpoint（无 Git 基线时唯一的回滚手段）、`graphify-out`（未授权）、`MIGRATION_*` 与 `SHA256SUMS.txt`（dated 迁移归档记录，`MIGRATION_MANIFEST.md` 解释其用途）、历史计划/设计文档与 `docs/*` 带日期报告。

## 文档与配置一致性

- `README.md:538`、`docs/architecture.md:696`、`docs/claude-desktop-parity-matrix.md:553` 的 `239/239` 计数从「当前/Current」改为注明这是 2026-09-02 里程碑记录（数字本身正确，仅措辞会与总门禁混淆）。
- `vitest.config.ts` 删除 `apps/*/tests/**` include（退役路径已不存在）。
- `.gitignore` 的 Electron 注释更新为通用构建输出说明（`out/`、`.vite/` 模式保留）。

## 校验

- 清理后 `corepack pnpm test`、`typecheck`、`lint`、`build` 全部通过（275 测试）。
- 三个在用环境的 `node_modules` 与共享 runtime 存续；历史验收的 `run.json`/`artifacts`/sessions/storages 抽查存在。
- 删除均为可重装或已退役负载；历史验收如需重跑须先按原命令重装依赖（证据本身不依赖 `node_modules`）。
- 实测体积：`.novel-agent` 1,886.7 MB → 579.3 MB；`apps/` 357.1 MB → 删除；工作区共回收 1,672.6 MB。
- 未动 `.opencode/`（52.5 MB，是 opencode 工具自身的 `node_modules` 与 goal 状态，不是项目内容）。

## 限制

- 删除 `node_modules` 后，历史验收目录不可直接重跑；需要按各自 `run.json`/README 记录重新安装。这是本次卫生清理的已知代价。
- 未删除任何 checkpoint；`.novel-agent/checkpoints` 仍为 164 MB 级，删减会削弱无 Git 基线时的回滚能力。
- 未做全库文档逐条校对；本次只处理已知过时项（见上文）。
