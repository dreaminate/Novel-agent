# 公开发布与克隆验证 — 2026-09-15

**目标仓库：** <https://github.com/dreaminate/Novel-agent>（PUBLIC，用户明确确认；`UNLICENSED` 私有开发包，无公开发布意图）
**分支：** `main`（初始导入）
**权威版本：** `3563ef6`

## 提交

| commit | 内容 |
| --- | --- |
| `47f2cc4` | 初始导入：五个 DSH 小说插件、授权 Session 补丁、docs/tasks、安装脚本；178 个文件 |
| `0f09e8f` | 修复 `product-boundary.spec.ts` 在 CRLF 检出下的断言（`\s*` 会吞掉换行） |
| `3563ef6` | 安装脚本自动向所选 Profile 写入 `patchedDependencies` 与 `autoInstallPeers: false`，并在结束前校验补丁标记与五个插件包 |

## 入库范围

- **包含：** `packages/*` 的 `src`、`tests`、`build`、`cordis.patch.yml`、tsconfig/tsdown 配置与 package.json；`patches/`（含 `LICENSE.deepseek`）；`docs/`、`tasks/`；根规格（`2026-08-22-*`）；`README`、`AGENTS.md`、`THIRD_PARTY_NOTICES.md`、`MIGRATION_*`、`SHA256SUMS.txt`；`pnpm-lock.yaml`、workspace/tsconfig/vitest 配置；`scripts/install-plugins.ps1`；`.gitignore`、`.gitattributes`。
- **排除（gitignored）：** `node_modules/`、`packages/*/lib/`（构建产物）、`.novel-agent/`（验收环境、checkpoint、凭据）、`.opencode/`、`.workbuddy/`、`*.log`、`*.tgz`。
- **凭据：** 密钥只在被忽略的 `.novel-agent/acceptance/real-model-20260915/dsh-home/.env`；对全库扫描 `sk-`、`gho_`、`AIza` 只命中测试中的假 id 与文档用词；无凭据、日志或本机 Home 进入索引。

## 从公开仓库的验证链（另一台机器的等价路径）

1. `git clone --depth 1` → 178 个文件，与索引一致。
2. `corepack pnpm install` → 11.3s，成功。
3. `corepack pnpm build` → 五个包全部 `Done`。
4. `corepack pnpm test` → **284 passed (284)**。
5. `pnpm pack` → 五个 tarball（novel-project 271 KB；planning 17 KB；writing 20 KB；memory 30 KB；review 7 KB），tarball 内只含 `files` 声明的运行时文件。
6. `scripts/install-plugins.ps1 -Profile web`（`DSH_HOME` 指向全新隔离目录）→ [1/6]–[6/6] 全部通过：Profile 写入补丁路径、五个插件安装、Profile 内 `dsh-session` 含 `registerLogEventType`。
7. 用已打补丁 CLI 冷启动该 Profile → `dsh web: http://127.0.0.1:59835/`，stderr 为空，进程停止后端口释放。

## 本次发布发现并修复的两个缺陷

1. **CRLF 断言**（`0f09e8f`）：`expect(bundlePatch.match(/^\s*- id:/gm))` 在 CRLF 检出时把 `\r\n` 吞进匹配串，导致新克隆的测试失败；改为 `^[ \t]*- id:`。
2. **新 Profile 未打补丁**：只给 CLI runtime 打补丁不够；`dsh plugin add` 会为该 Profile 另装一份未打补丁的 `dsh-session`，`novel-writing` 因 `ctx.sessions.registerLogEventType is not a function` 加载失败。脚本现在自动写入 `patchedDependencies`、重装并校验；`patches/README.md` 与 `README.md` 同步说明。

## 运行事故与处置

- 早期手工验证时把 `$home` 当作普通变量赋值，而它是 PowerShell 只读自动变量，导致 `DSH_HOME` 落到 `C:\Users\dreminate`，CLI 在该目录创建了 `profiles\web`（3 个脚手架文件）。发现后立即删除该目录；检查 `.dsh`、`sessions`、`storages` 均不存在，用户 Profile 无其他写入。安装脚本现在要求显式隔离的 `DSH_HOME`，否则拒绝运行。
- 提交使用一次性身份 `dreaminate <177133313+dreaminate@users.noreply.github.com>`；仓库未写入 `user.name`/`user.email` 配置，后续提交需自行设置或再次传入。
- 发布过程中用到的临时克隆、Home、tarball 与日志已从 `%TEMP%\opencode` 删除；发现一个 20:44 启动、不属于本次任务的遗留 Host 进程（PID 15440，session-recovery runtime）仍运行，未擅自终止。

## 限制

- 未验证社区 Desktop `2.0.5` 宿主与仓库代码的组合；验证使用官方 CLI + 补丁 + 隔离 Profile。
- 未做多机 Windows/macOS 交叉验证；`install-plugins.ps1` 仅面向 Windows PowerShell。
- 公开仓库包含历史盘点和机器路径；如需收敛为公开文档，应另开清理任务，不在此记录内处理。
